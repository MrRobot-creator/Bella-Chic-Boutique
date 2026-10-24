alter table public.catalog_products
  add column if not exists images jsonb not null default '[]'::jsonb;
