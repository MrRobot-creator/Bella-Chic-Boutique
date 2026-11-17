-- v8-video.sql — vídeo de demonstração nas peças.
-- Rodar no SQL Editor do Supabase depois da v7-estoque-privado.sql. Pode rodar mais de uma vez.
--
-- O que faz:
--   * coluna catalog_products.video (link público do vídeo; vazio = peça sem vídeo);
--   * get_catalog() passa a devolver o vídeo (o resto continua igual à v7);
--   * pasta de arquivos bella-chic-videos, só para vídeos de até 30 MB (MP4, MOV ou WebM).
--     Fica separada das fotos para as fotos manterem o limite de 5 MB.
-- Pode rodar antes de publicar o código novo: o site atual ignora a coluna nova.

do $$
begin
  if to_regprocedure('public.cap_stock(jsonb, integer)') is null then
    raise exception 'Rode supabase/v7-estoque-privado.sql antes deste arquivo.';
  end if;
end;
$$;

alter table public.catalog_products
  add column if not exists video text;

alter table public.catalog_products
  drop constraint if exists catalog_products_video_https;
alter table public.catalog_products
  add constraint catalog_products_video_https check (video is null or video ~ '^https://');

-- A lista de colunas mudou: precisa apagar e criar de novo (mesma lógica da v7).
drop function if exists public.get_catalog();
create function public.get_catalog()
returns table (
  id bigint,
  name text,
  category text,
  description text,
  price numeric,
  old_price numeric,
  image text,
  images jsonb,
  video text,
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
    p.id, p.name, p.category, p.description, p.price, p.old_price, p.image, p.images, p.video, p.sizes, p.size_fit,
    p.colors, p.tag, p.is_available, p.updated_at,
    case when access.staff then p.variant_stock else public.cap_stock(p.variant_stock, 5) end,
    case when access.staff then p.unit_stock else public.cap_stock(p.unit_stock, 5) end
  from public.catalog_products p
  cross join access
$$;

revoke all on function public.get_catalog() from public;
grant execute on function public.get_catalog() to anon, authenticated;

grant select (video) on public.catalog_products to anon, authenticated;

-- Pasta dos vídeos: pública para ver, só a equipe envia, troca ou apaga.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bella-chic-videos',
  'bella-chic-videos',
  true,
  31457280,
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product videos are publicly readable" on storage.objects;
create policy "Product videos are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'bella-chic-videos');

drop policy if exists "Store admins can upload product videos" on storage.objects;
create policy "Store admins can upload product videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bella-chic-videos' and (select public.is_store_admin()));

drop policy if exists "Store admins can update product videos" on storage.objects;
create policy "Store admins can update product videos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'bella-chic-videos' and (select public.is_store_admin()))
  with check (bucket_id = 'bella-chic-videos' and (select public.is_store_admin()));

drop policy if exists "Store admins can delete product videos" on storage.objects;
create policy "Store admins can delete product videos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bella-chic-videos' and (select public.is_store_admin()));

notify pgrst, 'reload schema';
