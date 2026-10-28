begin;

alter table public.catalog_products
  add column if not exists variant_stock jsonb not null default '[]'::jsonb;

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  customer jsonb not null,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  unit jsonb not null,
  fulfillment jsonb not null,
  payment text not null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists store_orders_status_created_at_idx
  on public.store_orders (status, created_at desc);

alter table public.store_orders enable row level security;
revoke all on table public.store_orders from public, anon, authenticated;
grant select on table public.store_orders to authenticated;

drop policy if exists "Store admins can read orders" on public.store_orders;
create policy "Store admins can read orders"
  on public.store_orders for select
  to authenticated
  using ((select public.is_store_admin()));

create or replace function public.create_store_order(p_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product record;
  v_order_items jsonb := '[]'::jsonb;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_delivery_fee numeric(10, 2);
  v_stock integer;
  v_quantity integer;
  v_product_id bigint;
  v_coupon_code text;
  v_reference text;
begin
  if p_order is null or jsonb_typeof(p_order) is distinct from 'object' then
    raise exception 'Invalid order data';
  end if;

  if pg_column_size(p_order) > 65536
    or jsonb_typeof(p_order->'customer') is distinct from 'object'
    or jsonb_typeof(p_order->'unit') is distinct from 'object'
    or jsonb_typeof(p_order->'fulfillment') is distinct from 'object'
    or jsonb_typeof(p_order->'items') is distinct from 'array' then
    raise exception 'Invalid order data';
  end if;

  if jsonb_array_length(p_order->'items') = 0
    or jsonb_array_length(p_order->'items') > 100 then
    raise exception 'Invalid order item count';
  end if;

  v_reference := p_order->>'reference';
  if v_reference is null or v_reference !~ '^BC-[A-F0-9]{16}$' then
    raise exception 'Invalid order reference';
  end if;

  if length(trim(coalesce(p_order->'customer'->>'name', ''))) not between 2 and 120
    or length(trim(coalesce(p_order->'customer'->>'phone', ''))) not between 8 and 30
    or length(trim(coalesce(p_order->'unit'->>'name', ''))) not between 1 and 120
    or length(trim(coalesce(p_order->'unit'->>'storePhone', ''))) not between 8 and 30 then
    raise exception 'Invalid customer or store contact';
  end if;

  if coalesce(length(p_order->'customer'->>'email'), 0) > 254 then
    raise exception 'Invalid customer email';
  end if;

  if jsonb_typeof(p_order->'fulfillment'->'deliveryFee') is distinct from 'null'
    and jsonb_typeof(p_order->'fulfillment'->'deliveryFee') is distinct from 'number' then
    raise exception 'Invalid delivery fee';
  end if;
  if jsonb_typeof(p_order->'fulfillment'->'deliveryFee') = 'number' then
    v_delivery_fee := (p_order->'fulfillment'->>'deliveryFee')::numeric;
    if v_delivery_fee < 0 or v_delivery_fee > 10000 then
      raise exception 'Invalid delivery fee';
    end if;
  end if;

  if coalesce(p_order->>'payment', '') not in ('Pix', 'Cartão de crédito', 'Dinheiro', 'Link de pagamento')
    or coalesce(p_order->'fulfillment'->>'type', '') not in ('Entrega', 'Retirada na loja') then
    raise exception 'Invalid payment or fulfillment method';
  end if;

  for v_item in select value from jsonb_array_elements(p_order->'items')
  loop
    if coalesce(v_item->>'productId', '') !~ '^[0-9]+$'
      or length(v_item->>'productId') > 18
      or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]*$'
      or length(v_item->>'quantity') > 5
      or length(trim(coalesce(v_item->>'size', ''))) = 0
      or length(trim(coalesce(v_item->>'color', ''))) = 0
      or length(v_item->>'size') > 40
      or length(v_item->>'color') > 80 then
      raise exception 'Invalid order item';
    end if;

    v_product_id := (v_item->>'productId')::bigint;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity > 10000 then
      raise exception 'Invalid order quantity';
    end if;

    select id, name, price, size_fit, sizes, is_available, variant_stock
      into v_product
      from public.catalog_products
      where id = v_product_id;

    if not found or not v_product.is_available then
      raise exception 'Insufficient stock: product unavailable';
    end if;

    v_stock := null;
    select (variant->>'quantity')::integer
      into v_stock
      from jsonb_array_elements(v_product.variant_stock) as variant
      where variant->>'size' = v_item->>'size'
        and variant->>'color' = v_item->>'color'
      limit 1;

    if v_stock is null or v_stock < v_quantity then
      raise exception 'Insufficient stock for product %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_order_items := v_order_items || jsonb_build_array(jsonb_build_object(
      'productId', v_product.id,
      'name', v_product.name,
      'size', v_item->>'size',
      'color', v_item->>'color',
      'sizeFit', v_product.size_fit,
      'sizes', v_product.sizes,
      'quantity', v_quantity,
      'unitPrice', v_product.price
    ));
  end loop;

  v_coupon_code := nullif(trim(p_order->>'couponCode'), '');
  if v_coupon_code is not null then
    if lower(v_coupon_code) <> 'bella10' or v_subtotal < 300 then
      raise exception 'Invalid or ineligible coupon';
    end if;
    v_discount := round(v_subtotal * 0.10, 2);
  end if;

  insert into public.store_orders (
    reference, customer, items, unit, fulfillment, payment,
    subtotal, discount, coupon_code
  )
  values (
    v_reference, p_order->'customer', v_order_items, p_order->'unit',
    p_order->'fulfillment', p_order->>'payment',
    v_subtotal, v_discount, v_coupon_code
  );

  return jsonb_build_object(
    'reference', v_reference,
    'items', v_order_items,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'couponCode', v_coupon_code
  );
end;
$$;

create or replace function public.confirm_store_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.store_orders%rowtype;
  v_item jsonb;
  v_stock jsonb;
  v_updated_stock jsonb;
  v_available integer;
  v_quantity integer;
  v_product_id bigint;
  v_found boolean;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Not authorized';
  end if;

  select * into v_order
    from public.store_orders
    where id = p_order_id
    for update;

  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Only pending orders can be confirmed';
  end if;

  for v_item in select value from jsonb_array_elements(v_order.items)
  loop
    v_product_id := (v_item->>'productId')::bigint;
    v_quantity := (v_item->>'quantity')::integer;

    select variant_stock into v_stock
      from public.catalog_products
      where id = v_product_id and is_available
      for update;

    if not found then
      raise exception 'Insufficient stock: product unavailable';
    end if;

    v_found := false;
    select (variant->>'quantity')::integer
      into v_available
      from jsonb_array_elements(v_stock) as variant
      where variant->>'size' = v_item->>'size'
        and variant->>'color' = v_item->>'color'
      limit 1;
    v_found := found;

    if not v_found or v_available < v_quantity then
      raise exception 'Insufficient stock for product %', v_item->>'name';
    end if;

    select jsonb_agg(
      case
        when variant->>'size' = v_item->>'size'
          and variant->>'color' = v_item->>'color'
        then jsonb_set(variant, '{quantity}', to_jsonb((variant->>'quantity')::integer - v_quantity))
        else variant
      end
      order by ordinal
    )
    into v_updated_stock
    from jsonb_array_elements(v_stock) with ordinality as stock(variant, ordinal);

    update public.catalog_products
      set variant_stock = coalesce(v_updated_stock, '[]'::jsonb),
          updated_at = now()
      where id = v_product_id;
  end loop;

  update public.store_orders
    set status = 'confirmed',
        confirmed_at = now(),
        updated_at = now()
    where id = p_order_id;
end;
$$;

create or replace function public.cancel_store_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_store_admin()) then
    raise exception 'Not authorized';
  end if;

  update public.store_orders
    set status = 'cancelled',
        updated_at = now()
    where id = p_order_id
      and status = 'pending';

  if not found then
    raise exception 'Only pending orders can be cancelled';
  end if;
end;
$$;

revoke all on function public.create_store_order(jsonb) from public;
revoke all on function public.confirm_store_order(uuid) from public;
revoke all on function public.cancel_store_order(uuid) from public;
grant execute on function public.create_store_order(jsonb) to anon, authenticated;
grant execute on function public.confirm_store_order(uuid) to authenticated;
grant execute on function public.cancel_store_order(uuid) to authenticated;

commit;
