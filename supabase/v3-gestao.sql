-- Bella Chic v3: gestão completa da loja.
-- Execute no SQL Editor do Supabase, depois dos arquivos anteriores (setup, order-management,
-- order-protection, restock-alerts e storage). Pode ser executado mais de uma vez.
--
-- O que este arquivo faz:
--   1. Configurações da loja editáveis no painel (frete grátis, Pix, reserva, validade dos pedidos).
--   2. Etapas do pedido: pendente, confirmado, pago, enviado/pronto, entregue e cancelado.
--   3. Reserva: o pedido do site separa as peças na hora, por 2 horas (ajustável). Reservas
--      vencidas voltam ao estoque e pedidos parados há 48 h são cancelados sozinhos.
--   4. Cancelar qualquer venda (até a confirmada) devolve as peças ao estoque.
--   5. Venda no balcão: registra a venda da loja física e baixa o estoque.
--   6. Histórico de estoque: toda entrada e saída fica registrada, com motivo.
--   7. Cupons criados pelo painel (o BELLA10 continua valendo igual).
--   8. "Meus pedidos": a cliente com conta vê os próprios pedidos.
--   9. Avaliações com foto de quem recebeu o pedido (só aparecem depois da aprovação).
--  10. Lista VIP com consentimento.
--  11. Ajustes de segurança (o mesmo de security-hardening.sql).
--
-- Funciona com o site atual: o pedido continua sendo enviado do mesmo jeito.

begin;

-- ---------------------------------------------------------------------------
-- 1. Configurações da loja
-- ---------------------------------------------------------------------------

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  free_shipping_min numeric(10, 2) check (free_shipping_min is null or free_shipping_min > 0),
  pix_key text check (pix_key is null or length(pix_key) between 1 and 77),
  pix_name text check (pix_name is null or length(pix_name) between 1 and 25),
  pix_city text check (pix_city is null or length(pix_city) between 1 and 15),
  promotion_ends_at date,
  reservation_minutes integer not null default 120 check (reservation_minutes between 15 and 1440),
  pending_expire_hours integer not null default 48 check (pending_expire_hours between 3 and 720),
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

alter table public.store_settings enable row level security;
revoke all on table public.store_settings from public, anon, authenticated;
grant select on table public.store_settings to anon, authenticated;
grant update on table public.store_settings to authenticated;

drop policy if exists "Store settings are public" on public.store_settings;
create policy "Store settings are public"
  on public.store_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Store admins can update settings" on public.store_settings;
create policy "Store admins can update settings"
  on public.store_settings for update
  to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

-- ---------------------------------------------------------------------------
-- 2. Pedidos: novas colunas e etapas
-- ---------------------------------------------------------------------------

alter table public.store_orders
  add column if not exists channel text not null default 'site',
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists stock_taken boolean not null default false,
  add column if not exists reserved_until timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists note text,
  add column if not exists review_token uuid not null default gen_random_uuid();

alter table public.store_orders drop constraint if exists store_orders_status_check;
alter table public.store_orders add constraint store_orders_status_check
  check (status in ('pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'));

alter table public.store_orders drop constraint if exists store_orders_channel_check;
alter table public.store_orders add constraint store_orders_channel_check
  check (channel in ('site', 'balcao'));

alter table public.store_orders drop constraint if exists store_orders_text_limits_check;
alter table public.store_orders add constraint store_orders_text_limits_check
  check (coalesce(length(cancel_reason), 0) <= 300 and coalesce(length(note), 0) <= 500);

create unique index if not exists store_orders_review_token_idx on public.store_orders (review_token);
create index if not exists store_orders_user_created_at_idx on public.store_orders (user_id, created_at desc) where user_id is not null;
create index if not exists store_orders_reservation_idx on public.store_orders (reserved_until) where status = 'pending' and stock_taken;

-- Vendas confirmadas antes desta versão já tinham baixado o estoque.
update public.store_orders set stock_taken = true where status = 'confirmed' and not stock_taken;

-- A cliente com conta vê os próprios pedidos ("Meus pedidos").
drop policy if exists "Customers can read their own orders" on public.store_orders;
create policy "Customers can read their own orders"
  on public.store_orders for select
  to authenticated
  using (user_id is not null and user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Histórico de estoque
-- ---------------------------------------------------------------------------

create table if not exists public.stock_movements (
  id bigint generated by default as identity primary key,
  product_id bigint references public.catalog_products (id) on delete set null,
  product_name text not null,
  size text not null,
  color text not null,
  delta integer not null,
  balance_after integer not null,
  reason text not null check (reason in (
    'entrada', 'ajuste', 'reserva', 'confirmacao', 'venda_balcao', 'cancelamento', 'expiracao'
  )),
  order_id uuid references public.store_orders (id) on delete set null,
  order_reference text,
  note text check (note is null or length(note) <= 300),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_created_at_idx on public.stock_movements (product_id, created_at desc);
create index if not exists stock_movements_created_at_idx on public.stock_movements (created_at desc);

alter table public.stock_movements enable row level security;
revoke all on table public.stock_movements from public, anon, authenticated;
grant select on table public.stock_movements to authenticated;

drop policy if exists "Store admins can read stock movements" on public.stock_movements;
create policy "Store admins can read stock movements"
  on public.stock_movements for select
  to authenticated
  using ((select public.is_store_admin()));

-- Motivo da próxima mudança de estoque nesta transação (as funções abaixo definem antes de mexer).
create or replace function public.set_stock_context(p_reason text, p_order_id uuid default null, p_order_reference text default null, p_note text default null)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform set_config('bella.stock_reason', coalesce(p_reason, ''), true);
  perform set_config('bella.stock_order_id', coalesce(p_order_id::text, ''), true);
  perform set_config('bella.stock_order_ref', coalesce(p_order_reference, ''), true);
  perform set_config('bella.stock_note', coalesce(p_note, ''), true);
end;
$$;

-- Registra a diferença de cada variação sempre que o estoque de uma peça muda,
-- inclusive quando a administradora edita a grade no painel (motivo "ajuste").
create or replace function public.log_stock_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := coalesce(
    nullif(current_setting('bella.stock_reason', true), ''),
    case when tg_op = 'INSERT' then 'entrada' else 'ajuste' end
  );
  v_order_id uuid := nullif(current_setting('bella.stock_order_id', true), '')::uuid;
  v_order_ref text := nullif(current_setting('bella.stock_order_ref', true), '');
  v_note text := nullif(current_setting('bella.stock_note', true), '');
  v_old jsonb := case when tg_op = 'INSERT' then '[]'::jsonb else coalesce(old.variant_stock, '[]'::jsonb) end;
begin
  insert into public.stock_movements (product_id, product_name, size, color, delta, balance_after, reason, order_id, order_reference, note)
  select new.id, new.name,
         coalesce(n.size, o.size), coalesce(n.color, o.color),
         coalesce(n.qty, 0) - coalesce(o.qty, 0),
         coalesce(n.qty, 0),
         case when v_reason = 'ajuste' and coalesce(n.qty, 0) > coalesce(o.qty, 0) then 'entrada' else v_reason end,
         v_order_id, v_order_ref, v_note
  from (
    select v->>'size' as size, v->>'color' as color, max(coalesce((v->>'quantity')::numeric, 0))::integer as qty
    from jsonb_array_elements(v_old) as v
    group by 1, 2
  ) as o
  full join (
    select v->>'size' as size, v->>'color' as color, max(coalesce((v->>'quantity')::numeric, 0))::integer as qty
    from jsonb_array_elements(coalesce(new.variant_stock, '[]'::jsonb)) as v
    group by 1, 2
  ) as n on n.size = o.size and n.color = o.color
  where coalesce(n.qty, 0) <> coalesce(o.qty, 0);

  return new;
end;
$$;

drop trigger if exists log_stock_changes on public.catalog_products;
create trigger log_stock_changes
  after insert or update of variant_stock on public.catalog_products
  for each row execute function public.log_stock_changes();

-- Soma (ou tira) unidades de uma variação. Nunca deixa o estoque negativo.
-- Devolve o novo saldo, ou null quando a peça foi excluída do catálogo.
create or replace function public.adjust_variant_stock(p_product_id bigint, p_size text, p_color text, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock jsonb;
  v_name text;
  v_index integer;
  v_current integer;
  v_new integer;
begin
  select variant_stock, name into v_stock, v_name
    from public.catalog_products
    where id = p_product_id
    for update;

  if not found then
    if p_delta < 0 then
      raise exception 'Insufficient stock: product unavailable';
    end if;
    return null;
  end if;

  v_stock := coalesce(v_stock, '[]'::jsonb);
  v_index := null;
  v_current := null;
  select (s.ord - 1)::integer, coalesce((s.v->>'quantity')::numeric, 0)::integer
    into v_index, v_current
    from jsonb_array_elements(v_stock) with ordinality as s(v, ord)
    where s.v->>'size' = p_size and s.v->>'color' = p_color
    limit 1;

  if v_index is null then
    if p_delta < 0 then
      raise exception 'Insufficient stock for product %', v_name;
    end if;
    v_new := p_delta;
    v_stock := v_stock || jsonb_build_array(jsonb_build_object('size', p_size, 'color', p_color, 'quantity', v_new));
  else
    v_new := v_current + p_delta;
    if v_new < 0 then
      raise exception 'Insufficient stock for product %', v_name;
    end if;
    v_stock := jsonb_set(v_stock, array[v_index::text, 'quantity'], to_jsonb(v_new));
  end if;

  update public.catalog_products
    set variant_stock = v_stock, updated_at = now()
    where id = p_product_id;

  return v_new;
end;
$$;

-- Tira do estoque as peças de um pedido (reserva, confirmação ou venda no balcão).
create or replace function public.take_order_stock(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.store_orders%rowtype;
  v_item jsonb;
begin
  select * into v_order from public.store_orders where id = p_order_id for update;
  if not found or v_order.stock_taken then
    return;
  end if;

  perform public.set_stock_context(p_reason, v_order.id, v_order.reference);
  for v_item in select value from jsonb_array_elements(v_order.items)
  loop
    if not exists (
      select 1 from public.catalog_products
      where id = (v_item->>'productId')::bigint and is_available
    ) then
      raise exception 'Insufficient stock: product unavailable';
    end if;
    perform public.adjust_variant_stock(
      (v_item->>'productId')::bigint, v_item->>'size', v_item->>'color', -((v_item->>'quantity')::integer)
    );
  end loop;
  perform public.set_stock_context(null);

  update public.store_orders set stock_taken = true, updated_at = now() where id = p_order_id;
end;
$$;

-- Devolve ao estoque as peças de um pedido (cancelamento ou reserva vencida).
create or replace function public.return_order_stock(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
    perform public.adjust_variant_stock(
      (v_item->>'productId')::bigint, v_item->>'size', v_item->>'color', (v_item->>'quantity')::integer
    );
  end loop;
  perform public.set_stock_context(null);

  update public.store_orders set stock_taken = false, reserved_until = null, updated_at = now() where id = p_order_id;
end;
$$;

-- Reservas vencidas voltam ao estoque; pedidos do site parados há muito tempo são cancelados.
create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_hours integer;
  v_count integer := 0;
begin
  select pending_expire_hours into v_hours from public.store_settings where id = 1;
  v_hours := coalesce(v_hours, 48);

  for v_order in
    select id from public.store_orders
    where status = 'pending' and channel = 'site' and created_at < now() - make_interval(hours => v_hours)
    order by created_at
    for update skip locked
  loop
    perform public.return_order_stock(v_order.id, 'expiracao');
    update public.store_orders
      set status = 'cancelled', cancelled_at = now(), reserved_until = null, updated_at = now(),
          cancel_reason = 'Cancelado automaticamente: sem confirmação em ' || v_hours || ' horas'
      where id = v_order.id;
    v_count := v_count + 1;
  end loop;

  for v_order in
    select id from public.store_orders
    where status = 'pending' and stock_taken and reserved_until is not null and reserved_until < now()
    order by reserved_until
    for update skip locked
  loop
    perform public.return_order_stock(v_order.id, 'expiracao');
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Cupons
-- ---------------------------------------------------------------------------

create table if not exists public.store_coupons (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,30}$'),
  kind text not null check (kind in ('percent', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_subtotal numeric(10, 2) not null default 0 check (min_subtotal >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  once_per_customer boolean not null default true,
  first_purchase_only boolean not null default false,
  active boolean not null default true,
  description text check (description is null or length(description) <= 140),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_coupons_percent_check check (kind <> 'percent' or value <= 90),
  constraint store_coupons_period_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

insert into public.store_coupons (code, kind, value, min_subtotal, once_per_customer, description)
values ('BELLA10', 'percent', 10, 300, true, '10% na primeira compra acima de R$ 300')
on conflict (code) do nothing;

alter table public.store_coupons enable row level security;
revoke all on table public.store_coupons from public, anon, authenticated;
grant select, insert, update, delete on table public.store_coupons to authenticated;

drop policy if exists "Store admins can manage coupons" on public.store_coupons;
create policy "Store admins can manage coupons"
  on public.store_coupons for all
  to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

-- Consulta pública de um cupom pela sacola (não revela a lista de cupons).
create or replace function public.check_coupon(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_coupon public.store_coupons%rowtype;
  v_used integer;
  v_discount numeric(10, 2);
begin
  if v_code !~ '^[A-Z0-9_-]{3,30}$' then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  select * into v_coupon from public.store_coupons where code = v_code;
  if not found or not v_coupon.active then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;
  if v_coupon.starts_at is not null and now() < v_coupon.starts_at then
    return jsonb_build_object('valid', false, 'reason', 'not_started', 'startsAt', v_coupon.starts_at);
  end if;
  if v_coupon.ends_at is not null and now() > v_coupon.ends_at then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;
  if v_coupon.max_uses is not null then
    select count(*) into v_used from public.store_orders
      where coupon_code is not null and upper(coupon_code) = v_coupon.code and status <> 'cancelled';
    if v_used >= v_coupon.max_uses then
      return jsonb_build_object('valid', false, 'reason', 'limit');
    end if;
  end if;

  v_discount := case
    when v_coupon.kind = 'percent' then round(coalesce(p_subtotal, 0) * v_coupon.value / 100, 2)
    else least(v_coupon.value, coalesce(p_subtotal, 0))
  end;

  return jsonb_build_object(
    'valid', coalesce(p_subtotal, 0) >= v_coupon.min_subtotal,
    'reason', case when coalesce(p_subtotal, 0) >= v_coupon.min_subtotal then null else 'min_subtotal' end,
    'code', v_coupon.code,
    'kind', v_coupon.kind,
    'value', v_coupon.value,
    'minSubtotal', v_coupon.min_subtotal,
    'oncePerCustomer', v_coupon.once_per_customer,
    'firstPurchaseOnly', v_coupon.first_purchase_only,
    'discount', v_discount
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Proteções do pedido (anti-spam, unidade oficial, frete e regras do cupom)
-- ---------------------------------------------------------------------------

create or replace function public.protect_store_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(new.customer->>'phone', ''), '\D', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(new.customer->>'email', ''))), '');
  v_unit_name text := new.unit->>'name';
  v_store_phone text := regexp_replace(coalesce(new.unit->>'storePhone', ''), '\D', '', 'g');
  v_origin text;
  v_destination text;
  v_expected_fee numeric(10, 2);
  v_free_min numeric(10, 2);
  v_coupon public.store_coupons%rowtype;
begin
  -- Venda no balcão é registrada pela administradora: sem estas regras.
  if new.channel = 'balcao' then
    return new;
  end if;

  -- Anti-spam
  if length(v_phone) < 10 or length(v_phone) > 13 then
    raise exception 'Invalid customer phone';
  end if;

  if (
    select count(*) from public.store_orders
    where customer_phone_digits = v_phone
      and status = 'pending'
      and created_at > now() - interval '30 minutes'
  ) >= 3 then
    raise exception 'Too many orders from this phone';
  end if;

  if (
    select count(*) from public.store_orders
    where created_at > now() - interval '10 minutes'
  ) >= 40 then
    raise exception 'Too many orders right now';
  end if;

  -- Unidade e WhatsApp oficiais (mesmos dados de src/config/store.ts)
  v_origin := case v_unit_name
    when 'Galeria Portuense' then 'Belém'
    when 'Cidade Nova 4' then 'Ananindeua'
  end;
  if v_origin is null then
    raise exception 'Invalid store unit';
  end if;

  if not (
    (v_unit_name = 'Galeria Portuense' and v_store_phone in ('5591980648559'))
    or (v_unit_name = 'Cidade Nova 4' and v_store_phone in ('5591980408420', '5591986066894'))
  ) then
    raise exception 'Invalid store unit';
  end if;

  -- Frete (mesma regra de src/services/delivery.ts). O valor do servidor é o que vale.
  if new.fulfillment->>'type' = 'Entrega' then
    v_destination := new.fulfillment->>'deliveryCity';
    if v_destination is null or v_destination not in ('Belém', 'Ananindeua', 'Marituba', 'Icoaraci') then
      raise exception 'Invalid delivery fee';
    end if;

    v_expected_fee := case
      when v_destination in ('Marituba', 'Icoaraci') then 20
      when v_destination = v_origin then 12
      else 15
    end;

    select free_shipping_min into v_free_min from public.store_settings where id = 1;
    if v_free_min is not null and (new.subtotal - new.discount) >= v_free_min then
      v_expected_fee := 0;
    end if;

    new.fulfillment := jsonb_set(new.fulfillment, '{deliveryFee}', to_jsonb(v_expected_fee));
  else
    new.fulfillment := jsonb_set(new.fulfillment, '{deliveryFee}', 'null'::jsonb);
  end if;

  -- Regras do cupom por cliente
  if new.coupon_code is not null then
    select * into v_coupon from public.store_coupons where code = upper(new.coupon_code);

    if coalesce(v_coupon.once_per_customer, true) or coalesce(v_coupon.first_purchase_only, false) then
      if v_email is null then
        raise exception 'Coupon requires email';
      end if;
    end if;

    if coalesce(v_coupon.once_per_customer, true) and exists (
      select 1 from public.store_orders
      where coupon_code is not null
        and upper(coupon_code) = upper(new.coupon_code)
        and status <> 'cancelled'
        and (customer_email_normalized = v_email or customer_phone_digits = v_phone)
    ) then
      raise exception 'Coupon already used by this customer';
    end if;

    if coalesce(v_coupon.first_purchase_only, false) and exists (
      select 1 from public.store_orders
      where channel = 'site'
        and status <> 'cancelled'
        and (customer_email_normalized = v_email or customer_phone_digits = v_phone)
    ) then
      raise exception 'Coupon only for first purchase';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_store_order() from public, anon, authenticated;

drop trigger if exists protect_store_order on public.store_orders;
create trigger protect_store_order
  before insert on public.store_orders
  for each row execute function public.protect_store_order();

-- ---------------------------------------------------------------------------
-- 6. Criar pedido pelo site (agora reserva as peças)
-- ---------------------------------------------------------------------------

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
  v_coupon public.store_coupons%rowtype;
  v_used integer;
  v_reference text;
  v_order_id uuid;
  v_fulfillment jsonb;
  v_reserved_until timestamptz;
  v_minutes integer;
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

  -- Libera reservas vencidas antes de conferir o estoque.
  perform public.release_expired_reservations();

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
      where id = v_product_id
      for update;

    if not found or not v_product.is_available then
      raise exception 'Insufficient stock: product unavailable';
    end if;

    v_stock := null;
    select coalesce((variant->>'quantity')::numeric, 0)::integer
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

  v_coupon_code := nullif(upper(btrim(coalesce(p_order->>'couponCode', ''))), '');
  if v_coupon_code is not null then
    select * into v_coupon from public.store_coupons where code = v_coupon_code;
    if not found or not v_coupon.active
      or (v_coupon.starts_at is not null and now() < v_coupon.starts_at)
      or (v_coupon.ends_at is not null and now() > v_coupon.ends_at)
      or v_subtotal < v_coupon.min_subtotal then
      raise exception 'Invalid or ineligible coupon';
    end if;
    if v_coupon.max_uses is not null then
      select count(*) into v_used from public.store_orders
        where coupon_code is not null and upper(coupon_code) = v_coupon.code and status <> 'cancelled';
      if v_used >= v_coupon.max_uses then
        raise exception 'Coupon usage limit reached';
      end if;
    end if;
    v_discount := case
      when v_coupon.kind = 'percent' then round(v_subtotal * v_coupon.value / 100, 2)
      else least(v_coupon.value, v_subtotal)
    end;
  end if;

  select reservation_minutes into v_minutes from public.store_settings where id = 1;
  v_reserved_until := now() + make_interval(mins => coalesce(v_minutes, 120));

  insert into public.store_orders (
    reference, customer, items, unit, fulfillment, payment,
    subtotal, discount, coupon_code, channel, user_id, reserved_until
  )
  values (
    v_reference, p_order->'customer', v_order_items, p_order->'unit',
    p_order->'fulfillment', p_order->>'payment',
    v_subtotal, v_discount, v_coupon_code, 'site', auth.uid(), v_reserved_until
  )
  returning id, fulfillment into v_order_id, v_fulfillment;

  perform public.take_order_stock(v_order_id, 'reserva');

  v_delivery_fee := case
    when jsonb_typeof(v_fulfillment->'deliveryFee') = 'number' then (v_fulfillment->>'deliveryFee')::numeric
    else null
  end;

  return jsonb_build_object(
    'reference', v_reference,
    'items', v_order_items,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'couponCode', v_coupon_code,
    'deliveryFee', v_delivery_fee,
    'total', v_subtotal - v_discount + coalesce(v_delivery_fee, 0),
    'reservedUntil', v_reserved_until
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Ações da administradora sobre os pedidos
-- ---------------------------------------------------------------------------

create or replace function public.confirm_store_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.store_orders%rowtype;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Not authorized';
  end if;

  perform public.release_expired_reservations();

  select * into v_order from public.store_orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Only pending orders can be confirmed';
  end if;

  -- Se a reserva venceu, tenta separar as peças de novo agora.
  if not v_order.stock_taken then
    perform public.take_order_stock(p_order_id, 'confirmacao');
  end if;

  update public.store_orders
    set status = 'confirmed', confirmed_at = now(), reserved_until = null, updated_at = now()
    where id = p_order_id;
end;
$$;

-- Avança a etapa: confirmado → pago → enviado/pronto → entregue (pode pular etapas).
create or replace function public.update_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.store_orders%rowtype;
  v_steps text[] := array['confirmed', 'paid', 'shipped', 'delivered'];
begin
  if not (select public.is_store_admin()) then
    raise exception 'Not authorized';
  end if;
  if p_status is null or not (p_status = any (array['paid', 'shipped', 'delivered'])) then
    raise exception 'Invalid order status';
  end if;

  select * into v_order from public.store_orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status = 'pending' then
    raise exception 'Confirm the order first';
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'Order already cancelled';
  end if;
  if array_position(v_steps, p_status) <= array_position(v_steps, v_order.status) then
    raise exception 'Order already in this step';
  end if;

  update public.store_orders
    set status = p_status,
        paid_at = case when p_status in ('paid', 'shipped', 'delivered') then coalesce(paid_at, case when p_status = 'paid' then now() end) else paid_at end,
        shipped_at = case when p_status in ('shipped', 'delivered') then coalesce(shipped_at, case when p_status = 'shipped' then now() end) else shipped_at end,
        delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
        updated_at = now()
    where id = p_order_id;
end;
$$;

-- Cancela qualquer pedido que ainda não foi cancelado e devolve as peças ao estoque.
drop function if exists public.cancel_store_order(uuid);
create or replace function public.cancel_store_order(p_order_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.store_orders%rowtype;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Not authorized';
  end if;

  select * into v_order from public.store_orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'Order already cancelled';
  end if;

  perform public.return_order_stock(p_order_id, 'cancelamento');

  update public.store_orders
    set status = 'cancelled',
        cancelled_at = now(),
        reserved_until = null,
        cancel_reason = nullif(left(btrim(coalesce(p_reason, '')), 300), ''),
        updated_at = now()
    where id = p_order_id;
end;
$$;

-- Venda feita na loja física: registra e baixa o estoque na hora.
create or replace function public.register_store_sale(p_sale jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product record;
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_quantity integer;
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
    if coalesce(v_item->>'productId', '') !~ '^[0-9]{1,18}$'
      or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]{0,3}$'
      or length(btrim(coalesce(v_item->>'size', ''))) not between 1 and 40
      or length(btrim(coalesce(v_item->>'color', ''))) not between 1 and 80 then
      raise exception 'Invalid order item';
    end if;
    v_quantity := (v_item->>'quantity')::integer;

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
$$;

-- ---------------------------------------------------------------------------
-- 8. Avaliações com foto
-- ---------------------------------------------------------------------------

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders (id) on delete cascade,
  product_id bigint references public.catalog_products (id) on delete cascade,
  product_name text not null,
  customer_name text not null check (length(customer_name) between 1 and 60),
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or length(comment) <= 600),
  photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 3),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (order_id, product_id)
);

create index if not exists product_reviews_product_status_idx on public.product_reviews (product_id, status, created_at desc);
create index if not exists product_reviews_status_created_at_idx on public.product_reviews (status, created_at desc);

alter table public.product_reviews enable row level security;
revoke all on table public.product_reviews from public, anon, authenticated;
grant select (id, product_id, product_name, customer_name, rating, comment, photos, status, created_at) on table public.product_reviews to anon;
grant select, update, delete on table public.product_reviews to authenticated;

drop policy if exists "Approved reviews are public" on public.product_reviews;
create policy "Approved reviews are public"
  on public.product_reviews for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "Store admins can read reviews" on public.product_reviews;
create policy "Store admins can read reviews"
  on public.product_reviews for select
  to authenticated
  using ((select public.is_store_admin()));

drop policy if exists "Store admins can moderate reviews" on public.product_reviews;
create policy "Store admins can moderate reviews"
  on public.product_reviews for update
  to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "Store admins can delete reviews" on public.product_reviews;
create policy "Store admins can delete reviews"
  on public.product_reviews for delete
  to authenticated
  using ((select public.is_store_admin()));

-- O link de avaliação vale por 60 dias depois da entrega.
create or replace function public.review_order_for_token(p_token uuid)
returns public.store_orders
language sql
stable
security definer
set search_path = ''
as $$
  select o.* from public.store_orders o
  where o.review_token = p_token
    and o.status = 'delivered'
    and coalesce(o.delivered_at, o.updated_at) > now() - interval '60 days'
  limit 1;
$$;

create or replace function public.review_upload_allowed(p_folder text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_token uuid;
begin
  if p_folder is null or p_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  v_token := p_folder::uuid;
  return (select (public.review_order_for_token(v_token)).id is not null);
end;
$$;

-- Dados mínimos para a página de avaliação (sem telefone, e-mail ou endereço).
create or replace function public.get_review_request(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order public.store_orders;
begin
  v_order := public.review_order_for_token(p_token);
  if v_order.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'reference', v_order.reference,
    'firstName', split_part(btrim(coalesce(v_order.customer->>'name', '')), ' ', 1),
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'productId', (i.value->>'productId')::bigint,
        'name', i.value->>'name',
        'size', i.value->>'size',
        'color', i.value->>'color',
        'image', p.image,
        'reviewed', exists (
          select 1 from public.product_reviews r
          where r.order_id = v_order.id and r.product_id = (i.value->>'productId')::bigint
        )
      )), '[]'::jsonb)
      from (select distinct on (value->>'productId') value from jsonb_array_elements(v_order.items)) as i
      left join public.catalog_products p on p.id = (i.value->>'productId')::bigint
    )
  );
end;
$$;

create or replace function public.submit_review(p_token uuid, p_product_id bigint, p_rating integer, p_comment text, p_photos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.store_orders;
  v_item jsonb;
  v_name text;
  v_parts text[];
  v_photos jsonb := coalesce(p_photos, '[]'::jsonb);
  v_photo jsonb;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  v_order := public.review_order_for_token(p_token);
  if v_order.id is null then
    raise exception 'Invalid review link';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Invalid review';
  end if;
  if coalesce(length(v_comment), 0) > 600 then
    raise exception 'Invalid review';
  end if;

  select value into v_item from jsonb_array_elements(v_order.items)
    where (value->>'productId')::bigint = p_product_id limit 1;
  if v_item is null then
    raise exception 'Invalid review';
  end if;

  if jsonb_typeof(v_photos) is distinct from 'array' or jsonb_array_length(v_photos) > 3 then
    raise exception 'Invalid review photos';
  end if;
  for v_photo in select value from jsonb_array_elements(v_photos)
  loop
    if jsonb_typeof(v_photo) is distinct from 'string'
      or (v_photo #>> '{}') !~ ('^' || p_token::text || '/[A-Za-z0-9._-]{1,80}$') then
      raise exception 'Invalid review photos';
    end if;
  end loop;

  -- Nome público: primeiro nome e inicial do sobrenome.
  v_parts := regexp_split_to_array(
    case when v_order.channel = 'balcao' and v_order.customer->>'name' = 'Cliente no balcão' then 'Cliente'
         else btrim(coalesce(nullif(v_order.customer->>'name', ''), 'Cliente')) end,
    '\s+');
  v_name := v_parts[1] || case when array_length(v_parts, 1) > 1 then ' ' || left(v_parts[array_length(v_parts, 1)], 1) || '.' else '' end;

  insert into public.product_reviews (order_id, product_id, product_name, customer_name, rating, comment, photos)
  values (v_order.id, p_product_id, v_item->>'name', left(v_name, 60), p_rating, v_comment, v_photos)
  on conflict (order_id, product_id) do nothing;

  if not found then
    raise exception 'Review already sent';
  end if;
end;
$$;

-- Fotos das avaliações: pasta com o código do link; só imagens até 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bella-chic-reviews', 'bella-chic-reviews', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Review photos are publicly readable" on storage.objects;
create policy "Review photos are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'bella-chic-reviews');

drop policy if exists "Customers can upload review photos" on storage.objects;
create policy "Customers can upload review photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'bella-chic-reviews'
    and public.review_upload_allowed((storage.foldername(name))[1])
  );

drop policy if exists "Store admins can delete review photos" on storage.objects;
create policy "Store admins can delete review photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bella-chic-reviews' and (select public.is_store_admin()));

-- ---------------------------------------------------------------------------
-- 9. Lista VIP com consentimento
-- ---------------------------------------------------------------------------

create table if not exists public.vip_subscribers (
  id uuid primary key default gen_random_uuid(),
  name text check (name is null or length(name) <= 120),
  phone text not null check (length(phone) <= 30),
  phone_digits text not null unique check (phone_digits ~ '^[0-9]{10,13}$'),
  consent_text text not null check (length(consent_text) between 10 and 300),
  source text not null default 'site' check (length(source) <= 40),
  created_at timestamptz not null default now(),
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists vip_subscribers_created_at_idx on public.vip_subscribers (created_at desc);

alter table public.vip_subscribers enable row level security;
revoke all on table public.vip_subscribers from public, anon, authenticated;
grant select, update, delete on table public.vip_subscribers to authenticated;

drop policy if exists "Store admins can read vip list" on public.vip_subscribers;
create policy "Store admins can read vip list"
  on public.vip_subscribers for select
  to authenticated
  using ((select public.is_store_admin()));

drop policy if exists "Store admins can update vip list" on public.vip_subscribers;
create policy "Store admins can update vip list"
  on public.vip_subscribers for update
  to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "Store admins can delete vip list" on public.vip_subscribers;
create policy "Store admins can delete vip list"
  on public.vip_subscribers for delete
  to authenticated
  using ((select public.is_store_admin()));

create or replace function public.join_vip_list(p_request jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(btrim(coalesce(p_request->>'name', '')), '');
  v_phone text := btrim(coalesce(p_request->>'phone', ''));
  v_digits text := regexp_replace(coalesce(p_request->>'phone', ''), '\D', '', 'g');
  v_consent text := btrim(coalesce(p_request->>'consentText', ''));
begin
  if p_request is null or jsonb_typeof(p_request) is distinct from 'object' or pg_column_size(p_request) > 4096 then
    raise exception 'Invalid VIP request';
  end if;
  if coalesce((p_request->>'consent')::boolean, false) is not true or length(v_consent) not between 10 and 300 then
    raise exception 'Consent required';
  end if;
  if length(v_digits) not between 10 and 13 or length(v_phone) > 30 then
    raise exception 'Invalid customer phone';
  end if;
  if coalesce(length(v_name), 0) > 120 then
    raise exception 'Invalid VIP request';
  end if;
  if (select count(*) from public.vip_subscribers where created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'Too many VIP requests';
  end if;

  insert into public.vip_subscribers (name, phone, phone_digits, consent_text)
  values (v_name, v_phone, v_digits, v_consent)
  on conflict (phone_digits) do update
    set name = coalesce(excluded.name, public.vip_subscribers.name),
        phone = excluded.phone,
        consent_text = excluded.consent_text,
        consented_at = now(),
        unsubscribed_at = null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Permissões das funções
-- ---------------------------------------------------------------------------

revoke all on function public.set_stock_context(text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.log_stock_changes() from public, anon, authenticated;
revoke all on function public.adjust_variant_stock(bigint, text, text, integer) from public, anon, authenticated;
revoke all on function public.take_order_stock(uuid, text) from public, anon, authenticated;
revoke all on function public.return_order_stock(uuid, text) from public, anon, authenticated;
revoke all on function public.review_order_for_token(uuid) from public, anon, authenticated;

revoke all on function public.release_expired_reservations() from public, anon;
grant execute on function public.release_expired_reservations() to authenticated;

revoke all on function public.create_store_order(jsonb) from public;
grant execute on function public.create_store_order(jsonb) to anon, authenticated;

revoke all on function public.check_coupon(text, numeric) from public;
grant execute on function public.check_coupon(text, numeric) to anon, authenticated;

revoke all on function public.confirm_store_order(uuid) from public, anon;
revoke all on function public.update_order_status(uuid, text) from public, anon;
revoke all on function public.cancel_store_order(uuid, text) from public, anon;
revoke all on function public.register_store_sale(jsonb) from public, anon;
grant execute on function public.confirm_store_order(uuid) to authenticated;
grant execute on function public.update_order_status(uuid, text) to authenticated;
grant execute on function public.cancel_store_order(uuid, text) to authenticated;
grant execute on function public.register_store_sale(jsonb) to authenticated;

revoke all on function public.review_upload_allowed(text) from public;
grant execute on function public.review_upload_allowed(text) to anon, authenticated;
revoke all on function public.get_review_request(uuid) from public;
grant execute on function public.get_review_request(uuid) to anon, authenticated;
revoke all on function public.submit_review(uuid, bigint, integer, text, jsonb) from public;
grant execute on function public.submit_review(uuid, bigint, integer, text, jsonb) to anon, authenticated;

revoke all on function public.join_vip_list(jsonb) from public;
grant execute on function public.join_vip_list(jsonb) to anon, authenticated;

-- Segurança (mesmo conteúdo de security-hardening.sql)
revoke execute on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to authenticated;

do $$
declare
  v_function regprocedure;
begin
  -- Funções antigas de outro projeto (apontam para tabelas que não existem neste banco).
  for v_function in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('finalizar_recebimento', 'match_documents')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', v_function);
  end loop;
  for v_function in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  loop
    execute format('alter function %s set search_path = %L', v_function, '');
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 11. Limpeza automática a cada 10 minutos (pg_cron). Fica fora da transação
--     acima: se o pg_cron não estiver disponível, o resto já foi salvo e o site
--     libera as reservas vencidas sozinho a cada novo pedido.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.unschedule(jobid) from cron.job where jobname = 'bella-chic-reservas';
      perform cron.schedule('bella-chic-reservas', '*/10 * * * *', 'select public.release_expired_reservations()');
    exception when others then
      raise notice 'Limpeza automática não agendada (%). As reservas continuam sendo liberadas a cada pedido.', sqlerrm;
    end;
  end if;
end;
$$;
