alter table public.catalog_products
  add column if not exists variant_stock jsonb not null default '[]'::jsonb;
