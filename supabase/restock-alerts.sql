-- "Avise-me quando chegar": clientes deixam o WhatsApp em uma peça esgotada
-- e a loja vê a lista no painel /admin.
-- Execute no SQL Editor do Supabase (depois de setup.sql). Pode ser executado mais de uma vez.

begin;

create table if not exists public.restock_requests (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.catalog_products (id) on delete cascade,
  product_name text not null,
  size text not null,
  color text not null,
  customer_name text,
  phone text not null,
  phone_digits text not null,
  status text not null default 'waiting' check (status in ('waiting', 'notified')),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

create index if not exists restock_requests_status_created_at_idx
  on public.restock_requests (status, created_at desc);
create index if not exists restock_requests_phone_created_at_idx
  on public.restock_requests (phone_digits, created_at desc);
create unique index if not exists restock_requests_waiting_unique_idx
  on public.restock_requests (product_id, size, color, phone_digits)
  where status = 'waiting';

alter table public.restock_requests enable row level security;
revoke all on table public.restock_requests from public, anon, authenticated;
grant select, update, delete on table public.restock_requests to authenticated;

drop policy if exists "Store admins can read restock requests" on public.restock_requests;
create policy "Store admins can read restock requests"
  on public.restock_requests for select
  to authenticated
  using ((select public.is_store_admin()));

drop policy if exists "Store admins can update restock requests" on public.restock_requests;
create policy "Store admins can update restock requests"
  on public.restock_requests for update
  to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "Store admins can delete restock requests" on public.restock_requests;
create policy "Store admins can delete restock requests"
  on public.restock_requests for delete
  to authenticated
  using ((select public.is_store_admin()));

-- Clientes não acessam a tabela: só registram o pedido de aviso por esta função.
create or replace function public.create_restock_request(p_request jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id bigint;
  v_product record;
  v_size text := btrim(coalesce(p_request->>'size', ''));
  v_color text := btrim(coalesce(p_request->>'color', ''));
  v_name text := nullif(btrim(coalesce(p_request->>'name', '')), '');
  v_phone text := btrim(coalesce(p_request->>'phone', ''));
  v_digits text := regexp_replace(coalesce(p_request->>'phone', ''), '\D', '', 'g');
begin
  if p_request is null or jsonb_typeof(p_request) is distinct from 'object' or pg_column_size(p_request) > 4096 then
    raise exception 'Invalid restock request';
  end if;

  if coalesce(p_request->>'productId', '') !~ '^[0-9]{1,18}$' then
    raise exception 'Invalid restock request';
  end if;
  v_product_id := (p_request->>'productId')::bigint;

  if length(v_digits) not between 10 and 13 or length(v_phone) > 30 then
    raise exception 'Invalid customer phone';
  end if;
  if length(v_size) not between 1 and 40 or length(v_color) not between 1 and 80
    or coalesce(length(v_name), 0) > 120 then
    raise exception 'Invalid restock request';
  end if;

  select id, name, sizes, colors into v_product
    from public.catalog_products
    where id = v_product_id and is_available;
  if not found
    or not (v_product.sizes ? v_size)
    or not exists (select 1 from jsonb_array_elements(v_product.colors) as c where c->>'name' = v_color) then
    raise exception 'Invalid restock request';
  end if;

  -- Anti-spam: no máximo 10 avisos por WhatsApp por dia e 60 no total em 10 minutos.
  if (select count(*) from public.restock_requests
      where phone_digits = v_digits and created_at > now() - interval '1 day') >= 10
    or (select count(*) from public.restock_requests
      where created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'Too many restock requests';
  end if;

  insert into public.restock_requests (product_id, product_name, size, color, customer_name, phone, phone_digits)
  values (v_product.id, v_product.name, v_size, v_color, v_name, v_phone, v_digits)
  on conflict (product_id, size, color, phone_digits) where status = 'waiting' do nothing;
end;
$$;

revoke all on function public.create_restock_request(jsonb) from public;
grant execute on function public.create_restock_request(jsonb) to anon, authenticated;

commit;
