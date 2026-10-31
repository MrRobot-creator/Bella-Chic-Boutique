/*
 * Testes do supabase/v6-limites.sql num Postgres local (PGlite), sem tocar no banco real.
 *
 * Como rodar (na mesma pasta usada pelos testes da v3, v4 e v5):
 *   cd %TEMP%\bella-sqltest
 *   copy <projeto>\supabase\tests\v6-limites.test.mjs .
 *   node v6-limites.test.mjs <caminho do projeto>
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

console.log('\nInstalação:')
await expectError('v6 exige a v3 antes', async () => {
  const empty = new PGlite()
  await empty.exec(sql('v6-limites.sql'))
}, 'v3-gestao.sql')
await db.exec(sql('v6-limites.sql'))
await db.exec(sql('v6-limites.sql'))
check('v6 roda duas vezes sem erro', true)
await expectError('visitante não chama a função da trava', () => asAnon(() => db.query('select public.limit_site_orders()')), 'permission denied')

console.log('\nQuantidade por pedido:')
const five = order([item(1, 'U', 'Rosa', 5)])
await createOrder(five)
check('5 unidades da mesma peça passam', await galeriaQty(1, 'U', 'Rosa') === 35)
await expectError('6 unidades da mesma peça são recusadas', () => createOrder(order([item(1, 'U', 'Rosa', 6)])), 'too many units of the same item')
check('pedido recusado não reserva nada', await galeriaQty(1, 'U', 'Rosa') === 35)
const sizes = ['P', 'M', 'G', 'GG']
await createOrder(order(sizes.map((size) => item(3, size, 'Branco', 5))))
check('20 peças no total passam', await galeriaQty(3, 'P', 'Branco') === 5)
await expectError('21 peças no total são recusadas', () => createOrder(order([...sizes.map((size) => item(3, size, 'Branco', 5)), item(3, 'XG', 'Branco', 1)])), 'too many units in one order')
check('pedido de 21 não mexe no estoque', await galeriaQty(3, 'XG', 'Branco') === 10)

console.log('\nPedidos reservados por WhatsApp:')
const phone = '(91) 97777-1234'
const open = []
for (let i = 0; i < 3; i += 1) {
  const payload = order([item(1, 'U', 'Rosa', 1)], phone)
  await createOrder(payload)
  open.push(payload)
}
check('3 pedidos reservados do mesmo WhatsApp passam', true)
await expectError('o 4º pedido reservado é recusado', () => createOrder(order([item(1, 'U', 'Rosa', 1)], phone)), 'too many open orders from this phone')
check('outro WhatsApp continua comprando', Boolean(await createOrder(order([item(1, 'U', 'Rosa', 1)], '(91) 96666-0000'))))
const cancelId = await orderId(open[0])
await asOwner(() => db.query('select public.cancel_store_order($1, $2)', [cancelId, 'teste']))
check('depois de cancelar um, o mesmo WhatsApp volta a pedir', Boolean(await createOrder(order([item(1, 'U', 'Rosa', 1)], phone))))
const confirmId = await orderId(open[1])
await asOwner(() => db.query('select public.confirm_store_order($1)', [confirmId]))
check('pedido confirmado não conta no limite', Boolean(await createOrder(order([item(1, 'U', 'Rosa', 1)], phone))))
// Reserva só vence 2 h depois do pedido: a trava antiga (3 pedidos em 30 min) já não pega pedidos tão antigos.
await db.exec(`update public.store_orders set created_at = now() - interval '3 hours', reserved_until = now() - interval '1 hour'
  where customer_phone_digits = '91977771234'`)
check('reserva vencida não conta no limite', Boolean(await createOrder(order([item(1, 'U', 'Rosa', 1)], phone))))

console.log(`\n${passed} verificações ok, ${failures.length} com problema.`)
if (failures.length) {
  console.log('Falharam:\n- ' + failures.join('\n- '))
  process.exit(1)
}
