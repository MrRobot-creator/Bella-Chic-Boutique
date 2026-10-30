-- Bella Chic v5: duas lojas (Galeria Portuense e Cidade Nova 4).
--
-- Rode DEPOIS de supabase/v3-gestao.sql. Pode ser executado mais de uma vez.
--
-- O que muda:
--   * Estoque separado por loja (catalog_products.unit_stock). O estoque que já existia vai para a
--     Galeria Portuense, onde a mercadoria chega. variant_stock continua existindo como o total das
--     duas lojas (a vitrine e a prévia de link usam o total).
--   * O pedido baixa o estoque da loja escolhida pela cliente; venda no balcão, da loja do balcão.
--   * Transferência entre lojas e lançamento de estoque por loja, tudo no histórico (com a loja).
--   * Pix por loja (store_units).
--   * Equipe: a dona (sem loja) vê tudo; a atendente (com loja) vê e mexe só nos pedidos, vendas,
--     histórico e faturamento da loja dela. O estoque das duas lojas continua visível para todas.
--
-- Depois de rodar, cadastre as atendentes em /admin › Equipe (a conta precisa existir em
-- Supabase › Authentication › Users).

begin;

do $$
begin
  if to_regclass('public.store_settings') is null or to_regclass('public.stock_movements') is null then
    raise exception 'Rode primeiro supabase/v3-gestao.sql';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Lojas
-- ---------------------------------------------------------------------------

create table if not exists public.store_units (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null unique check (length(name) between 1 and 60),
  city text not null check (length(city) between 1 and 60),
  sort_order smallint not null default 0,
  pix_key text check (pix_key is null or length(pix_key) between 1 and 77),
  pix_name text check (pix_name is null or length(pix_name) between 1 and 25),
  pix_city text check (pix_city is null or length(pix_city) between 1 and 15),
  updated_at timestamptz not null default now()
);

-- Mesmos nomes de src/config/store.ts e de protect_store_order.
insert into public.store_units (id, name, city, sort_order) values
  ('galeria-portuense', 'Galeria Portuense', 'Belém', 1),
  ('cidade-nova-4', 'Cidade Nova 4', 'Ananindeua', 2)
on conflict (id) do nothing;

-- O Pix único que existia passa a valer para as duas lojas até cada uma ter o seu.
update public.store_units u
  set pix_key = s.pix_key, pix_name = s.pix_name, pix_city = s.pix_city
  from public.store_settings s
  where s.id = 1 and s.pix_key is not null and u.pix_key is null;

-- ---------------------------------------------------------------------------
-- 2. Equipe: dona (sem loja) e atendentes (com loja)
-- ---------------------------------------------------------------------------

alter table public.store_admins
  add column if not exists unit_id text references public.store_units (id) on delete restrict;

-- Loja da atendente logada (null para a dona e para quem não é da equipe).
create or replace function public.admin_unit_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select unit_id from public.store_admins where user_id = (select auth.uid());
$$;

create or replace function public.is_store_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.store_admins where user_id = (select auth.uid()) and unit_id is null);
$$;

-- A dona mexe em qualquer loja; a atendente, só na dela.
create or replace function public.can_manage_unit(p_unit_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_admins
    where user_id = (select auth.uid()) and (unit_id is null or unit_id = p_unit_id)
  );
$$;

alter table public.store_units enable row level security;
revoke all on table public.store_units from public, anon, authenticated;
grant select on table public.store_units to anon, authenticated;
grant update (pix_key, pix_name, pix_city, updated_at) on table public.store_units to authenticated;

drop policy if exists "Store units are public" on public.store_units;
create policy "Store units are public"
  on public.store_units for select
  to anon, authenticated
  using (true);

drop policy if exists "Store owner can update units" on public.store_units;
create policy "Store owner can update units"
  on public.store_units for update
  to authenticated
  using ((select public.is_store_owner()))
  with check ((select public.is_store_owner()));

-- ---------------------------------------------------------------------------
-- 3. Estoque por loja
-- ---------------------------------------------------------------------------

alter table public.catalog_products
  add column if not exists unit_stock jsonb not null default '[]'::jsonb;

-- O estoque atual vai para a Galeria Portuense (só na primeira vez).
update public.catalog_products
  set unit_stock = (
    select coalesce(jsonb_agg(jsonb_build_object(
      'unit', 'galeria-portuense',
      'size', v->>'size',
      'color', v->>'color',
      'quantity', greatest(0, coalesce((v->>'quantity')::numeric, 0))::integer
    ) order by ord), '[]'::jsonb)
    from jsonb_array_elements(coalesce(variant_stock, '[]'::jsonb)) with ordinality as s(v, ord)
  )
  where unit_stock = '[]'::jsonb and coalesce(jsonb_array_length(variant_stock), 0) > 0;

-- Confere a grade por loja e recalcula o total (variant_stock) a cada mudança.
create or replace function public.sync_unit_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_unit text;
begin
  if tg_op = 'UPDATE' and new.unit_stock is not distinct from old.unit_stock then
    if new.variant_stock is distinct from old.variant_stock then
      raise exception 'Stock is managed per store';
    end if;
    return new;
  end if;

  -- Painel antigo cadastrando peça com estoque: entra na Galeria, onde chega a mercadoria.
  if tg_op = 'INSERT' and coalesce(new.unit_stock, '[]'::jsonb) = '[]'::jsonb
    and jsonb_typeof(new.variant_stock) = 'array' and jsonb_array_length(new.variant_stock) > 0 then
    select id into v_first_unit from public.store_units order by sort_order, id limit 1;
    new.unit_stock := (
      select coalesce(jsonb_agg(jsonb_build_object(
        'unit', v_first_unit, 'size', v->>'size', 'color', v->>'color',
        'quantity', greatest(0, coalesce((v->>'quantity')::numeric, 0))::integer
      )), '[]'::jsonb)
      from jsonb_array_elements(new.variant_stock) as v
    );
  end if;

  new.unit_stock := coalesce(new.unit_stock, '[]'::jsonb);
  if jsonb_typeof(new.unit_stock) <> 'array' or jsonb_array_length(new.unit_stock) > 2000 then
    raise exception 'Invalid store stock';
  end if;

  if exists (
    select 1 from jsonb_array_elements(new.unit_stock) as e
    where jsonb_typeof(e) <> 'object'
      or not exists (select 1 from public.store_units u where u.id = e->>'unit')
      or length(btrim(coalesce(e->>'size', ''))) not between 1 and 40
      or length(btrim(coalesce(e->>'color', ''))) not between 1 and 80
      or jsonb_typeof(e->'quantity') is distinct from 'number'
      or (e->>'quantity')::numeric < 0
      or (e->>'quantity')::numeric > 100000
      or (e->>'quantity')::numeric <> trunc((e->>'quantity')::numeric)
  ) then
    raise exception 'Invalid store stock';
  end if;

  if (select count(*) from jsonb_array_elements(new.unit_stock))
     <> (select count(distinct concat_ws(chr(31), e->>'unit', e->>'size', e->>'color')) from jsonb_array_elements(new.unit_stock) as e) then
    raise exception 'Invalid store stock';
  end if;

  new.variant_stock := coalesce((
    select jsonb_agg(jsonb_build_object('size', size, 'color', color, 'quantity', quantity) order by first_position)
    from (
      select e->>'size' as size, e->>'color' as color,
             sum((e->>'quantity')::integer)::integer as quantity, min(position) as first_position
      from jsonb_array_elements(new.unit_stock) with ordinality as t(e, position)
      group by 1, 2
    ) as totals
  ), '[]'::jsonb);

  return new;
end;
$$;

drop trigger if exists sync_unit_stock on public.catalog_products;
create trigger sync_unit_stock
  before insert or update on public.catalog_products
  for each row execute function public.sync_unit_stock();

-- Histórico com a loja e com transferências.
alter table public.stock_movements
  add column if not exists unit_id text references public.store_units (id) on delete set null;
alter table public.stock_movements drop constraint if exists stock_movements_reason_check;
alter table public.stock_movements add constraint stock_movements_reason_check check (reason in (
  'entrada', 'ajuste', 'reserva', 'confirmacao', 'venda_balcao', 'cancelamento', 'expiracao', 'transferencia'
));
create index if not exists stock_movements_unit_created_at_idx on public.stock_movements (unit_id, created_at desc);

create or replace function public.log_stock_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := nullif(current_setting('bella.stock_reason', true), '');
  v_order_id uuid := nullif(current_setting('bella.stock_order_id', true), '')::uuid;
  v_order_ref text := nullif(current_setting('bella.stock_order_ref', true), '');
  v_note text := nullif(current_setting('bella.stock_note', true), '');
  v_old jsonb := case when tg_op = 'INSERT' then '[]'::jsonb else coalesce(old.unit_stock, '[]'::jsonb) end;
begin
  insert into public.stock_movements (product_id, product_name, unit_id, size, color, delta, balance_after, reason, order_id, order_reference, note)
  select new.id, new.name,
         coalesce(n.unit, o.unit), coalesce(n.size, o.size), coalesce(n.color, o.color),
         coalesce(n.qty, 0) - coalesce(o.qty, 0),
         coalesce(n.qty, 0),
         coalesce(v_reason, case when coalesce(n.qty, 0) > coalesce(o.qty, 0) then 'entrada' else 'ajuste' end),
         v_order_id, v_order_ref, v_note
  from (
    select v->>'unit' as unit, v->>'size' as size, v->>'color' as color, max(coalesce((v->>'quantity')::numeric, 0))::integer as qty
    from jsonb_array_elements(v_old) as v
    group by 1, 2, 3
  ) as o
  full join (
    select v->>'unit' as unit, v->>'size' as size, v->>'color' as color, max(coalesce((v->>'quantity')::numeric, 0))::integer as qty
    from jsonb_array_elements(coalesce(new.unit_stock, '[]'::jsonb)) as v
    group by 1, 2, 3
  ) as n on n.unit = o.unit and n.size = o.size and n.color = o.color
  where coalesce(n.qty, 0) <> coalesce(o.qty, 0);

  return new;
end;
$$;

drop trigger if exists log_stock_changes on public.catalog_products;
create trigger log_stock_changes
  after insert or update of unit_stock on public.catalog_products
  for each row execute function public.log_stock_changes();

-- Soma (ou tira) unidades de uma variação em uma loja. Nunca deixa o estoque negativo.
create or replace function public.adjust_unit_stock(p_product_id bigint, p_unit_id text, p_size text, p_color text, p_delta integer)
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
  if p_unit_id is null or not exists (select 1 from public.store_units where id = p_unit_id) then
    raise exception 'Invalid store unit';
  end if;

  select unit_stock, name into v_stock, v_name
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
    where s.v->>'unit' = p_unit_id and s.v->>'size' = p_size and s.v->>'color' = p_color
    limit 1;

  if v_index is null then
    if p_delta < 0 then
      raise exception 'Insufficient stock in this store for product %', v_name;
    end if;
    v_new := p_delta;
    v_stock := v_stock || jsonb_build_array(jsonb_build_object('unit', p_unit_id, 'size', p_size, 'color', p_color, 'quantity', v_new));
  else
    v_new := v_current + p_delta;
    if v_new < 0 then
      raise exception 'Insufficient stock in this store for product %', v_name;
    end if;
    v_stock := jsonb_set(v_stock, array[v_index::text, 'quantity'], to_jsonb(v_new));
  end if;

  update public.catalog_products
    set unit_stock = v_stock, updated_at = now()
    where id = p_product_id;

  return v_new;
end;
$$;

drop function if exists public.adjust_variant_stock(bigint, text, text, integer);

-- ---------------------------------------------------------------------------
-- 4. Pedidos ligados à loja
-- ---------------------------------------------------------------------------

alter table public.store_orders
  add column if not exists unit_id text references public.store_units (id) on delete restrict;

update public.store_orders o
  set unit_id = u.id
  from public.store_units u
  where o.unit_id is null and u.name = o.unit->>'name';

-- Venda no balcão antiga com nome de loja fora da lista fica na Galeria.
update public.store_orders set unit_id = 'galeria-portuense' where unit_id is null;

create index if not exists store_orders_unit_created_at_idx on public.store_orders (unit_id, created_at desc);

-- Histórico antigo: o que veio de pedido fica na loja do pedido; o resto, na Galeria.
update public.stock_movements m
  set unit_id = o.unit_id
  from public.store_orders o
  where m.unit_id is null and m.order_id = o.id;
update public.stock_movements set unit_id = 'galeria-portuense' where unit_id is null;

create or replace function public.set_order_unit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select id into new.unit_id from public.store_units where name = new.unit->>'name';
  if new.unit_id is null then
    raise exception 'Invalid store unit';
  end if;
  -- Atendente só registra venda no balcão da própria loja.
  if new.channel = 'balcao' and not public.can_manage_unit(new.unit_id) then
    raise exception 'Not authorized';
  end if;
  return new;
end;
$$;

-- "order_unit" roda antes de "protect_store_order" (ordem alfabética dos gatilhos).
drop trigger if exists order_unit on public.store_orders;
create trigger order_unit
  before insert on public.store_orders
  for each row execute function public.set_order_unit();

-- Tira do estoque da loja do pedido (reserva, confirmação ou venda no balcão).
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
  if v_order.unit_id is null then
    raise exception 'Invalid store unit';
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
    perform public.adjust_unit_stock(
      (v_item->>'productId')::bigint, v_order.unit_id, v_item->>'size', v_item->>'color', -((v_item->>'quantity')::integer)
    );
  end loop;
  perform public.set_stock_context(null);

  update public.store_orders set stock_taken = true, updated_at = now() where id = p_order_id;
end;
$$;

-- Devolve ao estoque da loja do pedido (cancelamento ou reserva vencida).
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
    perform public.adjust_unit_stock(
      (v_item->>'productId')::bigint, coalesce(v_order.unit_id, 'galeria-portuense'), v_item->>'size', v_item->>'color', (v_item->>'quantity')::integer
    );
  end loop;
  perform public.set_stock_context(null);

  update public.store_orders set stock_taken = false, reserved_until = null, updated_at = now() where id = p_order_id;
end;
$$;

-- Ações sobre pedidos: a atendente só mexe nos da loja dela.
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
  if not public.can_manage_unit(v_order.unit_id) then
    raise exception 'Not authorized';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Only pending orders can be confirmed';
  end if;

  if not v_order.stock_taken then
    perform public.take_order_stock(p_order_id, 'confirmacao');
  end if;

  update public.store_orders
    set status = 'confirmed', confirmed_at = now(), reserved_until = null, updated_at = now()
    where id = p_order_id;
end;
$$;

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
  if not public.can_manage_unit(v_order.unit_id) then
    raise exception 'Not authorized';
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
  if not public.can_manage_unit(v_order.unit_id) then
    raise exception 'Not authorized';
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

-- ---------------------------------------------------------------------------
-- 5. Lançar estoque e transferir entre lojas
-- ---------------------------------------------------------------------------

-- Grade de uma loja: cada mudança diz o saldo que a pessoa viu (from) e o novo (to).
-- Se outra venda mexeu na mesma variação nesse meio tempo, nada é salvo.
create or replace function public.set_unit_stock(p_product_id bigint, p_unit_id text, p_changes jsonb, p_reason text default 'ajuste', p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product record;
  v_change jsonb;
  v_from integer;
  v_to integer;
  v_current integer;
begin
  if not exists (select 1 from public.store_units where id = p_unit_id) then
    raise exception 'Invalid store unit';
  end if;
  if not public.can_manage_unit(p_unit_id) then
    raise exception 'Not authorized';
  end if;
  if coalesce(p_reason, '') not in ('entrada', 'ajuste') then
    raise exception 'Invalid stock reason';
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) not between 1 and 500 then
    raise exception 'Invalid stock change';
  end if;

  select id, sizes, colors into v_product from public.catalog_products where id = p_product_id for update;
  if not found then
    raise exception 'Product not found';
  end if;

  perform public.set_stock_context(p_reason, null, null, nullif(left(btrim(coalesce(p_note, '')), 300), ''));
  for v_change in select value from jsonb_array_elements(p_changes)
  loop
    if jsonb_typeof(v_change->'from') is distinct from 'number' or jsonb_typeof(v_change->'to') is distinct from 'number'
      or (v_change->>'from')::numeric <> trunc((v_change->>'from')::numeric)
      or (v_change->>'to')::numeric <> trunc((v_change->>'to')::numeric)
      or (v_change->>'from')::numeric < 0 or (v_change->>'to')::numeric < 0
      or (v_change->>'to')::numeric > 100000 then
      raise exception 'Invalid stock change';
    end if;
    if not (v_product.sizes ? (v_change->>'size'))
      or not exists (select 1 from jsonb_array_elements(v_product.colors) c where c->>'name' = v_change->>'color') then
      raise exception 'Invalid stock change';
    end if;

    v_from := (v_change->>'from')::integer;
    v_to := (v_change->>'to')::integer;
    select coalesce((select (e->>'quantity')::integer from jsonb_array_elements(unit_stock) e
                     where e->>'unit' = p_unit_id and e->>'size' = v_change->>'size' and e->>'color' = v_change->>'color' limit 1), 0)
      into v_current
      from public.catalog_products where id = p_product_id;

    if v_current <> v_from then
      raise exception 'Stock changed meanwhile';
    end if;
    if v_to <> v_from then
      perform public.adjust_unit_stock(p_product_id, p_unit_id, v_change->>'size', v_change->>'color', v_to - v_from);
    end if;
  end loop;
  perform public.set_stock_context(null);

  return (select unit_stock from public.catalog_products where id = p_product_id);
end;
$$;

-- Leva peças de uma loja para a outra (a atendente só envia da própria loja).
create or replace function public.transfer_stock(p_from text, p_to text, p_items jsonb, p_note text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product record;
  v_from_name text;
  v_to_name text;
  v_quantity integer;
  v_total integer := 0;
begin
  select name into v_from_name from public.store_units where id = p_from;
  select name into v_to_name from public.store_units where id = p_to;
  if v_from_name is null or v_to_name is null or p_from = p_to then
    raise exception 'Invalid store unit';
  end if;
  if not public.can_manage_unit(p_from) then
    raise exception 'Not authorized';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception 'Invalid transfer';
  end if;

  perform public.set_stock_context(
    'transferencia', null, null,
    left(v_from_name || ' → ' || v_to_name || coalesce(' · ' || nullif(btrim(coalesce(p_note, '')), ''), ''), 300)
  );
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item->>'productId', '') !~ '^[0-9]{1,18}$'
      or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]{0,4}$' then
      raise exception 'Invalid transfer';
    end if;
    v_quantity := (v_item->>'quantity')::integer;

    select id, sizes, colors into v_product from public.catalog_products where id = (v_item->>'productId')::bigint for update;
    if not found
      or not (v_product.sizes ? (v_item->>'size'))
      or not exists (select 1 from jsonb_array_elements(v_product.colors) c where c->>'name' = v_item->>'color') then
      raise exception 'Invalid transfer';
    end if;

    perform public.adjust_unit_stock(v_product.id, p_from, v_item->>'size', v_item->>'color', -v_quantity);
    perform public.adjust_unit_stock(v_product.id, p_to, v_item->>'size', v_item->>'color', v_quantity);
    v_total := v_total + v_quantity;
  end loop;
  perform public.set_stock_context(null);

  return v_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Equipe (só a dona)
-- ---------------------------------------------------------------------------

create or replace function public.list_store_team()
returns table (user_id uuid, email text, unit_id text, is_me boolean, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_owner() then
    raise exception 'Not authorized';
  end if;
  return query
    select a.user_id, u.email::text, a.unit_id, a.user_id = auth.uid(), a.created_at
    from public.store_admins a
    join auth.users u on u.id = a.user_id
    order by a.unit_id nulls first, u.email;
end;
$$;

create or replace function public.save_store_team_member(p_email text, p_unit_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if not public.is_store_owner() then
    raise exception 'Not authorized';
  end if;
  if p_unit_id is not null and not exists (select 1 from public.store_units where id = p_unit_id) then
    raise exception 'Invalid store unit';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(btrim(coalesce(p_email, ''))) limit 1;
  if v_user_id is null then
    raise exception 'User not found';
  end if;
  if v_user_id = auth.uid() then
    raise exception 'Cannot change your own access';
  end if;

  insert into public.store_admins (user_id, unit_id)
  values (v_user_id, p_unit_id)
  on conflict (user_id) do update set unit_id = excluded.unit_id;
end;
$$;

create or replace function public.remove_store_team_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_store_owner() then
    raise exception 'Not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Cannot change your own access';
  end if;
  delete from public.store_admins where user_id = p_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Quem vê o quê
-- ---------------------------------------------------------------------------

-- Pedidos e histórico: dona vê tudo; atendente, só a loja dela.
drop policy if exists "Store admins can read orders" on public.store_orders;
create policy "Store admins can read orders"
  on public.store_orders for select
  to authenticated
  using ((select public.is_store_owner()) or unit_id = (select public.admin_unit_id()));

drop policy if exists "Store admins can read stock movements" on public.stock_movements;
create policy "Store admins can read stock movements"
  on public.stock_movements for select
  to authenticated
  using ((select public.is_store_owner()) or unit_id = (select public.admin_unit_id()));

-- Catálogo, cupons, configurações, avaliações e lista VIP: só a dona.
drop policy if exists "Store admins can manage catalog" on public.catalog_products;
create policy "Store admins can manage catalog"
  on public.catalog_products for all
  to authenticated
  using ((select public.is_store_owner()))
  with check ((select public.is_store_owner()));

drop policy if exists "Store admins can manage coupons" on public.store_coupons;
create policy "Store admins can manage coupons"
  on public.store_coupons for all
  to authenticated
  using ((select public.is_store_owner()))
  with check ((select public.is_store_owner()));

drop policy if exists "Store admins can update settings" on public.store_settings;
create policy "Store admins can update settings"
  on public.store_settings for update
  to authenticated
  using ((select public.is_store_owner()))
  with check ((select public.is_store_owner()));

drop policy if exists "Store admins can read reviews" on public.product_reviews;
create policy "Store admins can read reviews"
  on public.product_reviews for select
  to authenticated
  using ((select public.is_store_owner()));

drop policy if exists "Store admins can moderate reviews" on public.product_reviews;
create policy "Store admins can moderate reviews"
  on public.product_reviews for update
  to authenticated
  using ((select public.is_store_owner()))
  with check ((select public.is_store_owner()));

drop policy if exists "Store admins can delete reviews" on public.product_reviews;
create policy "Store admins can delete reviews"
  on public.product_reviews for delete
  to authenticated
  using ((select public.is_store_owner()));

drop policy if exists "Store admins can read vip list" on public.vip_subscribers;
create policy "Store admins can read vip list"
  on public.vip_subscribers for select
  to authenticated
  using ((select public.is_store_owner()));

drop policy if exists "Store admins can update vip list" on public.vip_subscribers;
create policy "Store admins can update vip list"
  on public.vip_subscribers for update
  to authenticated
  using ((select public.is_store_owner()))
  with check ((select public.is_store_owner()));

drop policy if exists "Store admins can delete vip list" on public.vip_subscribers;
create policy "Store admins can delete vip list"
  on public.vip_subscribers for delete
  to authenticated
  using ((select public.is_store_owner()));

-- ---------------------------------------------------------------------------
-- 8. Permissões das funções
-- ---------------------------------------------------------------------------

revoke all on function public.admin_unit_id() from public, anon;
revoke all on function public.is_store_owner() from public, anon;
revoke all on function public.can_manage_unit(text) from public, anon;
grant execute on function public.admin_unit_id() to authenticated;
grant execute on function public.is_store_owner() to authenticated;
grant execute on function public.can_manage_unit(text) to authenticated;

revoke all on function public.sync_unit_stock() from public, anon, authenticated;
revoke all on function public.log_stock_changes() from public, anon, authenticated;
revoke all on function public.set_order_unit() from public, anon, authenticated;
revoke all on function public.adjust_unit_stock(bigint, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.take_order_stock(uuid, text) from public, anon, authenticated;
revoke all on function public.return_order_stock(uuid, text) from public, anon, authenticated;

revoke all on function public.confirm_store_order(uuid) from public, anon;
revoke all on function public.update_order_status(uuid, text) from public, anon;
revoke all on function public.cancel_store_order(uuid, text) from public, anon;
revoke all on function public.set_unit_stock(bigint, text, jsonb, text, text) from public, anon;
revoke all on function public.transfer_stock(text, text, jsonb, text) from public, anon;
revoke all on function public.list_store_team() from public, anon;
revoke all on function public.save_store_team_member(text, text) from public, anon;
revoke all on function public.remove_store_team_member(uuid) from public, anon;
grant execute on function public.confirm_store_order(uuid) to authenticated;
grant execute on function public.update_order_status(uuid, text) to authenticated;
grant execute on function public.cancel_store_order(uuid, text) to authenticated;
grant execute on function public.set_unit_stock(bigint, text, jsonb, text, text) to authenticated;
grant execute on function public.transfer_stock(text, text, jsonb, text) to authenticated;
grant execute on function public.list_store_team() to authenticated;
grant execute on function public.save_store_team_member(text, text) to authenticated;
grant execute on function public.remove_store_team_member(uuid) to authenticated;

commit;
