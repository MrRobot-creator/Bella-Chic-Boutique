/*
 * Testes do supabase/v8-video.sql num Postgres local (PGlite), sem tocar no banco real.
 *
 * Como rodar (na mesma pasta usada pelos testes da v3 a v6):
 *   cd %TEMP%\bella-sqltest
 *   copy <projeto>\supabase\tests\v8-video.test.mjs .
 *   node v8-video.test.mjs <caminho do projeto>
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

const projectDir = process.argv[2] || process.cwd()
const sql = (file) => readFileSync(join(projectDir, 'supabase', file), 'utf8')

const db = new PGlite()
let passed = 0
const failures = []
const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1
    console.log(`  ok  ${name}`)
  } else {
    failures.push(name)
    console.log(`  FALHOU  ${name} ${detail}`)
  }
}
const one = async (query, params = []) => (await db.query(query, params)).rows[0]

const OWNER = '00000000-0000-4000-8000-000000000001'

const asRole = async (role, uid, fn) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${role};`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}
const asAnon = (fn) => asRole('anon', null, fn)
const asOwner = (fn) => asRole('authenticated', OWNER, fn)

const expectError = async (name, fn, text) => {
  try {
    await fn()
    check(name, false, '(esperava erro)')
  } catch (error) {
    check(name, String(error.message).toLowerCase().includes(text.toLowerCase()), `(erro: ${error.message})`)
  }
}

const galeriaQty = async (productId, size, color) => (await one(
  `select coalesce((select (e->>'quantity')::int from jsonb_array_elements(unit_stock) e
     where e->>'unit' = 'galeria-portuense' and e->>'size' = $2 and e->>'color' = $3), 0) as q
   from public.catalog_products where id = $1`, [productId, size, color])).q

let counter = 0
const galeria = { name: 'Galeria Portuense', address: 'Tv. Padre Eutíquio, 1055', attendant: 'Galeria Portuense', storePhone: '5591980648559' }
const pickup = { type: 'Retirada na loja', street: '', houseNumber: '', complement: '', neighborhood: '', postalCode: '', deliveryCity: '', referencePoint: '', deliveryNotes: '', deliveryFee: null }
const item = (productId, size, color, quantity) => ({ productId, name: `Peça ${productId}`, size, color, quantity, unitPrice: 50 })
const order = (items, phone) => ({
  reference: `BC-${(++counter).toString(16).toUpperCase().padStart(16, '0')}`,
  customer: { name: 'Maria Souza', phone: phone || `(91) 98888-${String(2000 + counter)}`, email: `maria${counter}@example.com` },
  items,
  unit: galeria,
  fulfillment: pickup,
  payment: 'Pix'
})
const createOrder = (payload) => asAnon(() => one('select public.create_store_order($1::jsonb) as r', [JSON.stringify(payload)])).then((row) => row.r)
const orderId = async (payload) => (await one('select id from public.store_orders where reference = $1', [payload.reference])).id

console.log('Preparando banco parecido com o Supabase...')
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, created_at timestamptz default now());
  alter table storage.objects enable row level security;
  grant select, insert, delete on storage.objects to anon, authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
  $$;
  grant execute on function storage.foldername(text) to anon, authenticated;
`)
for (const file of ['setup.sql', 'order-management.sql', 'order-protection.sql', 'restock-alerts.sql', 'storage.sql', 'v3-gestao.sql']) {
  await db.exec(sql(file))
}
await db.exec(`
  insert into auth.users (id, email) values ('${OWNER}', 'dona@example.com');
  insert into public.store_admins (user_id) values ('${OWNER}');
  insert into public.catalog_products (id, name, category, description, price, image, sizes, colors, variant_stock, is_available) values
    (1, 'Vestido Dress', 'Vestidos', 'Vestido', 50, 'https://x/1.jpg', '["U"]', '[{"name":"Rosa","hex":"#ff0000"}]',
       '[{"size":"U","color":"Rosa","quantity":40}]', true),
    (3, 'Blusa Básica', 'Blusas', 'Blusa', 50, 'https://x/3.jpg', '["P","M","G","GG","XG"]', '[{"name":"Branco","hex":"#ffffff"}]',
       '[{"size":"P","color":"Branco","quantity":10},{"size":"M","color":"Branco","quantity":10},{"size":"G","color":"Branco","quantity":10},{"size":"GG","color":"Branco","quantity":10},{"size":"XG","color":"Branco","quantity":10}]', true);
`)
await db.exec(sql('v5-unidades.sql'))

await db.exec(sql('v6-limites.sql'))

const stockOf = (rows, id, field = 'variant_stock') => rows.find((row) => Number(row.id) === id)[field]
const catalogAs = (who) => who(() => db.query('select * from public.get_catalog() order by id')).then((result) => result.rows)
const asCustomer = (fn) => asRole('authenticated', '00000000-0000-4000-8000-000000000099', fn)

console.log('\nInstalação:')
await expectError('v8 exige a v7 antes', async () => {
  const empty = new PGlite()
  await empty.exec('create table public.catalog_products (id bigint primary key)')
  await empty.exec(sql('v8-video.sql'))
}, 'v7-estoque-privado.sql')
await db.exec(sql('v7-estoque-privado.sql'))
await db.exec(sql('v8-video.sql'))
await db.exec(sql('v8-video.sql'))
check('v8 roda duas vezes sem erro', true)

console.log('\nVídeo da peça:')
const link = 'https://abc.supabase.co/storage/v1/object/public/bella-chic-videos/1.mp4'
await asOwner(() => db.query('update public.catalog_products set video = $1 where id = 1 returning id', [link]))
check('a dona salva o vídeo', (await one('select video from public.catalog_products where id = 1')).video === link)
await expectError('link sem https é recusado', () => asOwner(() => db.query(`update public.catalog_products set video = 'javascript:alert(1)' where id = 1 returning id`)), 'catalog_products_video_https')
await expectError('visitante não troca o vídeo', async () => {
  const result = await asAnon(() => db.query(`update public.catalog_products set video = null where id = 1 returning id`))
  if (!result.rows.length) throw new Error('permission denied (nenhuma linha)')
}, 'permission denied')

const visitor = await catalogAs(asAnon)
check('visitante recebe o vídeo pela get_catalog', visitor.find((row) => Number(row.id) === 1).video === link)
check('peça sem vídeo vem vazia', visitor.find((row) => Number(row.id) === 3).video === null)
check('visitante continua com estoque limitado a 5', stockOf(visitor, 3).every((entry) => entry.quantity <= 5))
const staff = await catalogAs(asOwner)
check('a equipe continua com o estoque real', stockOf(staff, 3).some((entry) => entry.quantity === 10))
const direct = await asAnon(() => db.query('select id, video from public.catalog_products where id = 1'))
check('visitante lê a coluna video da tabela', direct.rows[0].video === link)
await expectError('visitante continua sem ler o estoque da tabela', () => asAnon(() => db.query('select variant_stock from public.catalog_products')), 'permission denied')

console.log('\nPasta dos vídeos:')
const bucket = await one(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'bella-chic-videos'`)
check('pasta pública de 30 MB', bucket.public === true && Number(bucket.file_size_limit) === 31457280)
check('só aceita MP4, MOV e WebM', JSON.stringify(bucket.allowed_mime_types) === JSON.stringify(['video/mp4', 'video/quicktime', 'video/webm']))
const photos = await one(`select file_size_limit from storage.buckets where id = 'bella-chic-products'`)
check('as fotos continuam com 5 MB', Number(photos.file_size_limit) === 5242880)
await asOwner(() => db.query(`insert into storage.objects (bucket_id, name) values ('bella-chic-videos', 'a.mp4') returning id`))
check('a dona envia vídeo', true)
await expectError('cliente logada não envia vídeo', () => asCustomer(() => db.query(`insert into storage.objects (bucket_id, name) values ('bella-chic-videos', 'b.mp4') returning id`)), 'row-level security')
await expectError('visitante não envia vídeo', () => asAnon(() => db.query(`insert into storage.objects (bucket_id, name) values ('bella-chic-videos', 'c.mp4') returning id`)), 'row-level security')

console.log(`\n${passed} verificações ok, ${failures.length} com problema.`)
if (failures.length) {
  console.log('Falharam:\n- ' + failures.join('\n- '))
  process.exit(1)
}
