alter table public.catalog_products
  add column if not exists size_fit text;
