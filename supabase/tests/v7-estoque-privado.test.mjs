/*
 * Testes do supabase/v7-estoque-privado.sql num Postgres local (PGlite), sem tocar no banco real.
 *
 * Como rodar (na mesma pasta usada pelos testes da v3 a v6):
 *   cd %TEMP%\bella-sqltest
 *   copy <projeto>\supabase\tests\v7-estoque-privado.test.mjs .
 *   node v7-estoque-privado.test.mjs <caminho do projeto>
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
await expectError('v7 exige a v5 antes', async () => {
  const empty = new PGlite()
  await empty.exec('create table public.catalog_products (id bigint primary key)')
  await empty.exec(sql('v7-estoque-privado.sql'))
}, 'v5-unidades.sql')
await db.exec(sql('v7-estoque-privado.sql'))
await db.exec(sql('v7-estoque-privado.sql'))
check('v7 roda duas vezes sem erro', true)

console.log('\nTabela sem estoque para quem não é da equipe:')
await expectError('visitante não lê variant_stock', () => asAnon(() => db.query('select variant_stock from public.catalog_products')), 'permission denied')
await expectError('visitante não lê unit_stock', () => asAnon(() => db.query('select unit_stock from public.catalog_products')), 'permission denied')
await expectError('cliente logada não lê o estoque', () => asCustomer(() => db.query('select variant_stock from public.catalog_products')), 'permission denied')
await expectError('select * na tabela é recusado', () => asAnon(() => db.query('select * from public.catalog_products')), 'permission denied')
check('visitante lê as colunas da vitrine', (await asAnon(() => db.query('select id, name, updated_at from public.catalog_products'))).rows.length === 2)
await expectError('visitante não chama cap_stock', () => asAnon(() => db.query(`select public.cap_stock('[]'::jsonb, 5)`)), 'permission denied')

console.log('\nget_catalog:')
const anonRows = await catalogAs(asAnon)
check('visitante recebe as duas peças', anonRows.length === 2)
check('40 em estoque vira 5 para o visitante', stockOf(anonRows, 1)[0].quantity === 5, JSON.stringify(stockOf(anonRows, 1)))
check('estoque por loja também vem limitado', stockOf(anonRows, 1, 'unit_stock').every((entry) => entry.quantity <= 5), JSON.stringify(stockOf(anonRows, 1, 'unit_stock')))
check('cliente logada também recebe limitado', stockOf(await catalogAs(asCustomer), 1)[0].quantity === 5)
const ownerRows = await catalogAs(asOwner)
check('a dona recebe o estoque real', stockOf(ownerRows, 1)[0].quantity === 40, JSON.stringify(stockOf(ownerRows, 1)))
check('a dona recebe o estoque real por loja', stockOf(ownerRows, 1, 'unit_stock').some((entry) => entry.quantity === 40))
check('a ordem das variações não muda', stockOf(anonRows, 3).map((v) => v.size).join() === stockOf(ownerRows, 3).map((v) => v.size).join())
check('campos da variação ficam iguais', stockOf(anonRows, 3)[0].size === 'P' && stockOf(anonRows, 3)[0].color === 'Branco')

console.log('\nNúmeros baixos e pedidos:')
const sale = order([item(3, 'P', 'Branco', 5), item(3, 'M', 'Branco', 4)])
await createOrder(sale)
const afterSale = await catalogAs(asAnon)
const p = stockOf(afterSale, 3).find((v) => v.size === 'P')
const m = stockOf(afterSale, 3).find((v) => v.size === 'M')
check('pedido do visitante continua reservando', p.quantity === 5 && m.quantity === 5, JSON.stringify([p, m]))
const second = order([item(3, 'P', 'Branco', 4)])
await createOrder(second)
const low = stockOf(await catalogAs(asAnon), 3).find((v) => v.size === 'P')
check('abaixo de 5, o visitante vê o número (últimas unidades)', low.quantity === 1, JSON.stringify(low))
check('o estoque real baixou certo', await galeriaQty(3, 'P', 'Branco') === 1)

console.log('\nPainel:')
await asOwner(() => db.query(`update public.catalog_products set name = 'Blusa Básica Nova' where id = 3 returning id`))
check('a dona salva a peça pedindo só o id de volta', (await one('select name from public.catalog_products where id = 3')).name === 'Blusa Básica Nova')
const inserted = await asOwner(() => db.query(`insert into public.catalog_products (id, name, category, description, price, image, sizes, colors, is_available)
  values (10, 'Saia', 'Saias', 'Saia', 60, 'https://x/s.jpg', '["P"]', '[{"name":"Preto","hex":"#000"}]', true) returning id`))
check('a dona cria peça nova', Boolean(inserted.rows[0]?.id))

console.log(`\n${passed} verificações ok, ${failures.length} com problema.`)
if (failures.length) {
  console.log('Falharam:\n- ' + failures.join('\n- '))
  process.exit(1)
}
