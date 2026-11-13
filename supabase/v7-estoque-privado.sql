-- v7-estoque-privado.sql — a cliente deixa de receber as quantidades reais do estoque.
-- Rodar no SQL Editor do Supabase depois da v5-unidades.sql e da v6-limites.sql. Pode rodar mais de uma vez.
--
-- Por quê: qualquer visitante lia a tabela catalog_products inteira, com o estoque de cada loja.
-- Agora:
--   * a tabela só entrega as colunas da vitrine (sem variant_stock e unit_stock);
--   * o site lê o catálogo pela função get_catalog(): a equipe (store_admins) recebe o estoque real;
--     os outros recebem cada quantidade limitada a 5 (o máximo por pedido da v6). Isso basta para a
--     sacola, a troca de loja e o "Últimas unidades", sem mostrar quanto a loja tem.
-- As funções de pedido, balcão, estoque e transferência leem a tabela como dona (security definer): nada muda nelas.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_products' and column_name = 'unit_stock'
  ) then
    raise exception 'Rode supabase/v5-unidades.sql antes deste arquivo.';
  end if;
end;
$$;

-- Quantidades acima do limite viram o limite; a ordem e os outros campos ficam iguais.
create or replace function public.cap_stock(p_stock jsonb, p_cap integer)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when p_stock is null or jsonb_typeof(p_stock) <> 'array' then p_stock
    else coalesce((
      select jsonb_agg(
        case when jsonb_typeof(item.entry -> 'quantity') = 'number'
          then jsonb_set(item.entry, '{quantity}', to_jsonb(least((item.entry ->> 'quantity')::numeric, p_cap)))
          else item.entry
        end
        order by item.position)
      from jsonb_array_elements(p_stock) with ordinality as item(entry, position)
    ), '[]'::jsonb)
  end
$$;

revoke all on function public.cap_stock(jsonb, integer) from public, anon, authenticated;

create or replace function public.get_catalog()
returns table (
  id bigint,
  name text,
  category text,
  description text,
  price numeric,
  old_price numeric,
  image text,
  images jsonb,
  sizes jsonb,
  size_fit text,
  colors jsonb,
  tag text,
  is_available boolean,
  updated_at timestamptz,
  variant_stock jsonb,
  unit_stock jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with access as (select public.is_store_admin() as staff)
  select
    p.id, p.name, p.category, p.description, p.price, p.old_price, p.image, p.images, p.sizes, p.size_fit,
    p.colors, p.tag, p.is_available, p.updated_at,
    case when access.staff then p.variant_stock else public.cap_stock(p.variant_stock, 5) end,
    case when access.staff then p.unit_stock else public.cap_stock(p.unit_stock, 5) end
  from public.catalog_products p
  cross join access
$$;

revoke all on function public.get_catalog() from public;
grant execute on function public.get_catalog() to anon, authenticated;

-- A tabela continua legível, mas só nas colunas da vitrine.
revoke select on public.catalog_products from anon, authenticated;
grant select (
  id, name, category, description, price, old_price, image, images, sizes, size_fit,
  colors, tag, is_available, created_at, updated_at
) on public.catalog_products to anon, authenticated;

notify pgrst, 'reload schema';
