-- v9: cadastro de peças para as atendentes e peça fora do cadastro na venda no balcão.
-- Rode uma vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
--
--   * A atendente (store_admins com unit_id) cadastra e edita peças. Apagar continua só com a dona.
--   * Pelo cadastro ninguém grava estoque direto: o estoque só muda pelas funções da loja
--     (entrada, ajuste, venda, transferência), que registram o histórico.
--   * A venda no balcão aceita peça fora do cadastro: nome, preço, quantidade e foto opcional.
--     Ela entra no faturamento, mas não mexe no estoque.

begin;

-- 1. Quem pode mexer no cadastro de peças.
drop policy if exists "Store admins can manage catalog" on public.catalog_products;
drop policy if exists "Store staff can add products" on public.catalog_products;
drop policy if exists "Store staff can edit products" on public.catalog_products;
drop policy if exists "Store owner can delete products" on public.catalog_products;

create policy "Store staff can add products" on public.catalog_products
  for insert to authenticated
  with check ((select public.is_store_admin()));

create policy "Store staff can edit products" on public.catalog_products
  for update to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

create policy "Store owner can delete products" on public.catalog_products
  for delete to authenticated
  using ((select public.is_store_owner()));

-- 2. O cadastro grava só as colunas da peça. O estoque (variant_stock, unit_stock) fica de fora.
revoke insert, update on public.catalog_products from anon, authenticated;
grant insert (name, category, description, price, old_price, image, images, video, sizes, size_fit, colors, tag, is_available)
  on public.catalog_products to authenticated;
grant update (name, category, description, price, old_price, image, images, video, sizes, size_fit, colors, tag, is_available, updated_at)
  on public.catalog_products to authenticated;

-- 3. Venda no balcão com peça fora do cadastro (item sem productId).
create or replace function public.register_store_sale(p_sale jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_item jsonb;
  v_product record;
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_quantity integer;
  v_price numeric(10, 2);
  v_name text;
  v_photo text;
  v_reference text;
  v_order_id uuid;
  v_unit_name text := btrim(coalesce(p_sale->>'unitName', ''));
  v_payment text := btrim(coalesce(p_sale->>'payment', ''));
  v_customer_name text := nullif(btrim(coalesce(p_sale->>'customerName', '')), '');
  v_customer_phone text := btrim(coalesce(p_sale->>'customerPhone', ''));
begin
  if not (select public.is_store_admin()) then
    raise exception 'Not authorized';
  end if;

  if p_sale is null or jsonb_typeof(p_sale) is distinct from 'object' or pg_column_size(p_sale) > 32768
    or jsonb_typeof(p_sale->'items') is distinct from 'array'
    or jsonb_array_length(p_sale->'items') not between 1 and 50 then
    raise exception 'Invalid sale data';
  end if;
  if length(v_unit_name) not between 1 and 120 then
    raise exception 'Invalid store unit';
  end if;
  if v_payment not in ('Pix', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'Link de pagamento') then
    raise exception 'Invalid payment or fulfillment method';
  end if;
  if coalesce(length(v_customer_name), 0) > 120 or length(v_customer_phone) > 30 then
    raise exception 'Invalid customer or store contact';
  end if;

  for v_item in select value from jsonb_array_elements(p_sale->'items')
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]{0,3}$' then
      raise exception 'Invalid order item';
    end if;
    v_quantity := (v_item->>'quantity')::integer;

    if coalesce(jsonb_typeof(v_item->'productId'), 'null') = 'null' then
      -- Peça fora do cadastro: nome e preço digitados no balcão, foto opcional do nosso armazenamento.
      v_name := btrim(coalesce(v_item->>'name', ''));
      v_photo := nullif(btrim(coalesce(v_item->>'photo', '')), '');
      if length(v_name) not between 2 and 120 or jsonb_typeof(v_item->'unitPrice') is distinct from 'number' then
        raise exception 'Invalid order item';
      end if;
      v_price := round((v_item->>'unitPrice')::numeric, 2);
      if v_price not between 0.01 and 100000
        or (v_photo is not null and v_photo !~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/bella-chic-products/[A-Za-z0-9._-]{1,120}$') then
        raise exception 'Invalid order item';
      end if;

      v_subtotal := v_subtotal + v_price * v_quantity;
      v_items := v_items || jsonb_build_array(
        jsonb_build_object(
          'productId', null,
          'name', v_name,
          'size', '',
          'color', '',
          'sizes', '[]'::jsonb,
          'quantity', v_quantity,
          'unitPrice', v_price
        ) || case when v_photo is null then '{}'::jsonb else jsonb_build_object('photo', v_photo) end
      );
    else
      if coalesce(v_item->>'productId', '') !~ '^[0-9]{1,18}$'
        or length(btrim(coalesce(v_item->>'size', ''))) not between 1 and 40
        or length(btrim(coalesce(v_item->>'color', ''))) not between 1 and 80 then
        raise exception 'Invalid order item';
      end if;

      select id, name, price, size_fit, sizes into v_product
        from public.catalog_products where id = (v_item->>'productId')::bigint;
      if not found then
        raise exception 'Insufficient stock: product unavailable';
      end if;

      v_subtotal := v_subtotal + v_product.price * v_quantity;
      v_items := v_items || jsonb_build_array(jsonb_build_object(
        'productId', v_product.id,
        'name', v_product.name,
        'size', v_item->>'size',
        'color', v_item->>'color',
        'sizeFit', v_product.size_fit,
        'sizes', v_product.sizes,
        'quantity', v_quantity,
        'unitPrice', v_product.price
      ));
    end if;
  end loop;

  if jsonb_typeof(p_sale->'discount') = 'number' then
    v_discount := round((p_sale->>'discount')::numeric, 2);
    if v_discount < 0 or v_discount > v_subtotal then
      raise exception 'Invalid discount';
    end if;
  end if;

  v_reference := 'LJ-' || upper(left(replace(gen_random_uuid()::text, '-', ''), 16));

  insert into public.store_orders (
    reference, status, channel, customer, items, unit, fulfillment, payment,
    subtotal, discount, note, confirmed_at, paid_at, delivered_at
  )
  values (
    v_reference, 'delivered', 'balcao',
    jsonb_build_object('name', coalesce(v_customer_name, 'Cliente no balcão'), 'phone', v_customer_phone),
    v_items,
    jsonb_build_object('name', v_unit_name, 'address', btrim(coalesce(p_sale->>'unitAddress', '')), 'attendant', 'Balcão', 'storePhone', ''),
    jsonb_build_object('type', 'Retirada na loja', 'street', '', 'houseNumber', '', 'complement', '', 'neighborhood', '',
      'postalCode', '', 'deliveryCity', '', 'referencePoint', '', 'deliveryNotes', '', 'deliveryFee', null),
    v_payment, v_subtotal, v_discount,
    nullif(left(btrim(coalesce(p_sale->>'note', '')), 500), ''),
    now(), now(), now()
  )
  returning id into v_order_id;

  perform public.take_order_stock(v_order_id, 'venda_balcao');

  return jsonb_build_object('id', v_order_id, 'reference', v_reference, 'subtotal', v_subtotal, 'discount', v_discount);
end;
$function$;

-- 4. Baixa e devolução de estoque pulam a peça fora do cadastro.
create or replace function public.take_order_stock(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order public.store_orders%rowtype;
  v_item jsonb;
begin
  select * into v_order from public.store_orders where id = p_order_id for update;
  if not found or v_order.stock_taken then
    return;
  end if;
  if v_order.unit_id is null then
    raise exception 'Invalid store unit';
  end if;

  perform public.set_stock_context(p_reason, v_order.id, v_order.reference);
  for v_item in select value from jsonb_array_elements(v_order.items)
  loop
    continue when v_item->>'productId' is null;
    if not exists (
      select 1 from public.catalog_products
      where id = (v_item->>'productId')::bigint and is_available
    ) then
      raise exception 'Insufficient stock: product unavailable';
    end if;
    perform public.adjust_unit_stock(
      (v_item->>'productId')::bigint, v_order.unit_id, v_item->>'size', v_item->>'color', -((v_item->>'quantity')::integer)
    );
  end loop;
  perform public.set_stock_context(null);

  update public.store_orders set stock_taken = true, updated_at = now() where id = p_order_id;
end;
$function$;

create or replace function public.return_order_stock(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order public.store_orders%rowtype;
  v_item jsonb;
begin
  select * into v_order from public.store_orders where id = p_order_id for update;
  if not found or not v_order.stock_taken then
    return;
  end if;

  perform public.set_stock_context(p_reason, v_order.id, v_order.reference);
  for v_item in select value from jsonb_array_elements(v_order.items)
  loop
    continue when v_item->>'productId' is null;
    perform public.adjust_unit_stock(
      (v_item->>'productId')::bigint, coalesce(v_order.unit_id, 'galeria-portuense'), v_item->>'size', v_item->>'color', (v_item->>'quantity')::integer
    );
  end loop;
  perform public.set_stock_context(null);

  update public.store_orders set stock_taken = false, reserved_until = null, updated_at = now() where id = p_order_id;
end;
$function$;

commit;
