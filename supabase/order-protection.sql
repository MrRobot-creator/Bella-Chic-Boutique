-- Proteções extras para os pedidos do site.
-- Execute no SQL Editor do Supabase DEPOIS de supabase/order-management.sql.
-- Pode ser executado mais de uma vez sem problema.
--
-- O que faz, antes de gravar cada pedido:
--   1. Limita pedidos repetidos (anti-spam): no máximo 3 pedidos pendentes por telefone
--      em 30 minutos e 40 pedidos no total em 10 minutos.
--   2. Cupom Bella10: uma vez por cliente (mesmo e-mail OU mesmo telefone),
--      contando pedidos pendentes e confirmados. Pedido cancelado libera o cupom.
--   3. Frete: recalcula a taxa no servidor e recusa valor diferente da tabela da loja.
--   4. Confere se a unidade e o WhatsApp da loja são os oficiais.
--
-- Se mudar telefones, unidades ou valores de frete em src/config/store.ts ou
-- src/services/delivery.ts, atualize também a função abaixo e execute de novo.

begin;

alter table public.store_orders
  add column if not exists customer_phone_digits text
    generated always as (regexp_replace(coalesce(customer->>'phone', ''), '\D', '', 'g')) stored;

alter table public.store_orders
  add column if not exists customer_email_normalized text
    generated always as (nullif(lower(btrim(coalesce(customer->>'email', ''))), '')) stored;

create index if not exists store_orders_phone_created_at_idx
  on public.store_orders (customer_phone_digits, created_at desc);

create index if not exists store_orders_coupon_customer_idx
  on public.store_orders (coupon_code, customer_email_normalized, customer_phone_digits)
  where coupon_code is not null;

create index if not exists store_orders_created_at_idx
  on public.store_orders (created_at desc);

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
  v_sent_fee numeric(10, 2);
begin
  -- 1. Anti-spam
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

  -- 4. Unidade e WhatsApp oficiais (mesmos dados de src/config/store.ts)
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

  -- 3. Frete (mesma regra de src/services/delivery.ts)
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

    if jsonb_typeof(new.fulfillment->'deliveryFee') = 'number' then
      v_sent_fee := (new.fulfillment->>'deliveryFee')::numeric;
    end if;

    if v_sent_fee is distinct from v_expected_fee then
      raise exception 'Invalid delivery fee';
    end if;
  else
    new.fulfillment := jsonb_set(new.fulfillment, '{deliveryFee}', 'null'::jsonb);
  end if;

  -- 2. Cupom uma vez por cliente
  if new.coupon_code is not null then
    if v_email is null then
      raise exception 'Coupon requires email';
    end if;

    if exists (
      select 1 from public.store_orders
      where coupon_code is not null
        and lower(coupon_code) = lower(new.coupon_code)
        and status in ('pending', 'confirmed')
        and (customer_email_normalized = v_email or customer_phone_digits = v_phone)
    ) then
      raise exception 'Coupon already used by this customer';
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

commit;
