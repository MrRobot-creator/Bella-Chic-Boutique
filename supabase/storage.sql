insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bella-chic-products',
  'bella-chic-products',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'bella-chic-products');

drop policy if exists "Store admins can upload product images" on storage.objects;
create policy "Store admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bella-chic-products'
    and (select public.is_store_admin())
  );

drop policy if exists "Store admins can update product images" on storage.objects;
create policy "Store admins can update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bella-chic-products'
    and (select public.is_store_admin())
  )
  with check (
    bucket_id = 'bella-chic-products'
    and (select public.is_store_admin())
  );

drop policy if exists "Store admins can delete product images" on storage.objects;
create policy "Store admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bella-chic-products'
    and (select public.is_store_admin())
  );
