/*
 * Testes do supabase/v5-unidades.sql (duas lojas) num Postgres local (PGlite), sem tocar no banco real.
 *
 * Como rodar (na mesma pasta usada pelos testes da v3 e da v4):
 *   cd %TEMP%\bella-sqltest
 *   copy <projeto>\supabase\tests\v5-unidades.test.mjs .
 *   node v5-unidades.test.mjs <caminho do projeto>
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
const rows = async (query, params = []) => (await db.query(query, params)).rows

const OWNER = '00000000-0000-4000-8000-000000000001'
const GALERIA = '00000000-0000-4000-8000-000000000002'
const CIDADE = '00000000-0000-4000-8000-000000000003'
const CUSTOMER = '00000000-0000-4000-8000-000000000004'

const asRole = async (role, uid, fn) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${role};`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}
const asAnon = (fn) => asRole('anon', null, fn)
const asUser = (uid, fn) => asRole('authenticated', uid, fn)
const asOwner = (fn) => asUser(OWNER, fn)

const expectError = async (name, fn, text) => {
  try {
    await fn()
    check(name, false, '(esperava erro)')
  } catch (error) {
    check(name, String(error.message).toLowerCase().includes(text.toLowerCase()), `(erro: ${error.message})`)
  }
}

const unitQty = async (productId, unit, size, color) => (await one(
  `select coalesce((select (e->>'quantity')::int from jsonb_array_elements(unit_stock) e where e->>'unit' = $2 and e->>'size' = $3 and e->>'color' = $4), 0) as q
   from public.catalog_products where id = $1`, [productId, unit, size, color])).q
const totalQty = async (productId, size, color) => (await one(
  `select coalesce((select (v->>'quantity')::int from jsonb_array_elements(variant_stock) v where v->>'size' = $2 and v->>'color' = $3), -1) as q
   from public.catalog_products where id = $1`, [productId, size, color])).q

let counter = 0
const units = {
  galeria: { name: 'Galeria Portuense', address: 'Tv. Padre Eutíquio, 1055', attendant: 'Galeria Portuense', storePhone: '5591980648559' },
  cidade: { name: 'Cidade Nova 4', address: 'Av. Dr. Nonato Sanova, 161A', attendant: 'Cidade Nova — atendente 1', storePhone: '5591980408420' }
}
const pickup = { type: 'Retirada na loja', street: '', houseNumber: '', complement: '', neighborhood: '', postalCode: '', deliveryCity: '', referencePoint: '', deliveryNotes: '', deliveryFee: null }
const order = (unit, items) => ({
  reference: `BC-${(++counter).toString(16).toUpperCase().padStart(16, '0')}`,
  customer: { name: 'Maria Souza', phone: `(91) 98888-${String(2000 + counter)}`, email: `maria${counter}@example.com` },
  items,
  unit: units[unit],
  fulfillment: pickup,
  payment: 'Pix'
})
const createOrder = (payload) => asAnon(() => one('select public.create_store_order($1::jsonb) as r', [JSON.stringify(payload)])).then((row) => row.r)
const orderByRef = (ref) => one('select * from public.store_orders where reference = $1', [ref])
const setStock = (uid, productId, unit, changes, reason = 'ajuste') =>
  asUser(uid, () => db.query('select public.set_unit_stock($1, $2, $3::jsonb, $4)', [productId, unit, JSON.stringify(changes), reason]))
const transfer = (uid, from, to, items, note = null) =>
  asUser(uid, () => one('select public.transfer_stock($1, $2, $3::jsonb, $4) as n', [from, to, JSON.stringify(items), note])).then((row) => row.n)

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
  insert into auth.users (id, email) values
    ('${OWNER}', 'dona@example.com'), ('${GALERIA}', 'galeria@example.com'), ('${CIDADE}', 'cidade@example.com'), ('${CUSTOMER}', 'cliente@example.com');
  insert into public.store_admins (user_id) values ('${OWNER}');
  insert into public.catalog_products (id, name, category, description, price, image, sizes, colors, variant_stock, is_available) values
    (1, 'Vestido Dress', 'Vestidos', 'Vestido', 75, 'https://x/1.jpg', '["U"]', '[{"name":"Rosa","hex":"#ff0000"},{"name":"Preto","hex":"#000000"}]',
       '[{"size":"U","color":"Rosa","quantity":10},{"size":"U","color":"Preto","quantity":0}]', true),
    (2, 'Conjunto Marrant', 'Conjuntos', 'Conjunto', 150, 'https://x/2.jpg', '["P","M"]', '[{"name":"Bege","hex":"#eeddcc"}]',
       '[{"size":"P","color":"Bege","quantity":4},{"size":"M","color":"Bege","quantity":2}]', true);
  update public.store_settings set pix_key = '+5591980648559', pix_name = 'Bella Chic Boutique', pix_city = 'Belem' where id = 1;
`)

console.log('\nInstalação:')
await expectError('v5 exige a v3 antes', async () => {
  const empty = new PGlite()
  await empty.exec(sql('v5-unidades.sql'))
}, 'v3-gestao.sql')
const movementsBefore = (await one('select count(*)::int as n from public.stock_movements')).n
await db.exec(sql('v5-unidades.sql'))
await db.exec(sql('v5-unidades.sql'))
check('v5 roda duas vezes sem erro', true)
check('cria as duas lojas', (await rows('select id from public.store_units order by sort_order')).map((row) => row.id).join(',') === 'galeria-portuense,cidade-nova-4')
check('Pix que existia vale para as duas lojas', (await one(`select count(*)::int as n from public.store_units where pix_key = '+5591980648559'`)).n === 2)
check('estoque atual foi para a Galeria', (await unitQty(1, 'galeria-portuense', 'U', 'Rosa')) === 10 && (await unitQty(1, 'cidade-nova-4', 'U', 'Rosa')) === 0)
check('total continua igual', (await totalQty(1, 'U', 'Rosa')) === 10 && (await totalQty(2, 'P', 'Bege')) === 4)
check('migração não entra no histórico', (await one('select count(*)::int as n from public.stock_movements')).n === movementsBefore)
check('histórico antigo fica na Galeria', movementsBefore > 0 && (await one(`select count(*)::int as n from public.stock_movements where unit_id is distinct from 'galeria-portuense'`)).n === 0)
const rerun = await one(`select unit_stock from public.catalog_products where id = 1`)
await db.exec(sql('v5-unidades.sql'))
check('rodar de novo não duplica o estoque', JSON.stringify((await one(`select unit_stock from public.catalog_products where id = 1`)).unit_stock) === JSON.stringify(rerun.unit_stock))

await db.exec(`
  insert into public.store_admins (user_id, unit_id) values ('${GALERIA}', 'galeria-portuense'), ('${CIDADE}', 'cidade-nova-4');
`)

console.log('\nPapéis:')
check('dona é dona', (await asOwner(() => one('select public.is_store_owner() as ok'))).ok === true)
check('atendente não é dona', (await asUser(GALERIA, () => one('select public.is_store_owner() as ok'))).ok === false)
check('atendente sabe a própria loja', (await asUser(CIDADE, () => one('select public.admin_unit_id() as u'))).u === 'cidade-nova-4')
check('atendente continua no painel', (await asUser(CIDADE, () => one('select public.is_store_admin() as ok'))).ok === true)
await expectError('visitante não chama as funções de papel', () => asAnon(() => db.query('select public.is_store_owner()')), 'permission denied')

console.log('\nLançar estoque por loja:')
await setStock(OWNER, 1, 'cidade-nova-4', [{ size: 'U', color: 'Rosa', from: 0, to: 3 }], 'entrada')
check('dona lança estoque na Cidade Nova', (await unitQty(1, 'cidade-nova-4', 'U', 'Rosa')) === 3)
check('total soma as duas lojas', (await totalQty(1, 'U', 'Rosa')) === 13)
const entry = await one(`select * from public.stock_movements order by id desc limit 1`)
check('histórico registra a loja e o motivo', entry.unit_id === 'cidade-nova-4' && entry.reason === 'entrada' && entry.delta === 3 && entry.balance_after === 3)
await expectError('saldo desatualizado não salva', () => setStock(OWNER, 1, 'cidade-nova-4', [{ size: 'U', color: 'Rosa', from: 1, to: 5 }]), 'stock changed meanwhile')
await setStock(CIDADE, 1, 'cidade-nova-4', [{ size: 'U', color: 'Rosa', from: 3, to: 2 }], 'ajuste')
check('atendente corrige a contagem da própria loja', (await unitQty(1, 'cidade-nova-4', 'U', 'Rosa')) === 2)
check('correção fica como ajuste', (await one(`select reason from public.stock_movements order by id desc limit 1`)).reason === 'ajuste')
await expectError('atendente não mexe no estoque da outra loja', () => setStock(CIDADE, 1, 'galeria-portuense', [{ size: 'U', color: 'Rosa', from: 10, to: 20 }]), 'not authorized')
await expectError('tamanho que a peça não tem é recusado', () => setStock(OWNER, 1, 'galeria-portuense', [{ size: 'GG', color: 'Rosa', from: 0, to: 1 }]), 'invalid stock change')
await expectError('quantidade negativa é recusada', () => setStock(OWNER, 1, 'galeria-portuense', [{ size: 'U', color: 'Rosa', from: 10, to: -1 }]), 'invalid stock change')
await expectError('loja inexistente é recusada', () => setStock(OWNER, 1, 'outra-loja', [{ size: 'U', color: 'Rosa', from: 0, to: 1 }]), 'invalid store unit')
await expectError('visitante não lança estoque', () => asAnon(() => db.query(`select public.set_unit_stock(1, 'galeria-portuense', '[]'::jsonb, 'ajuste', null)`)), 'permission denied')

console.log('\nProteções da grade:')
await expectError('painel antigo não troca o total direto', () => asOwner(() => db.query(`update public.catalog_products set variant_stock = '[{"size":"U","color":"Rosa","quantity":99}]' where id = 1`)), 'managed per store')
await expectError('grade com loja desconhecida é recusada', () => asOwner(() => db.query(`update public.catalog_products set unit_stock = '[{"unit":"x","size":"U","color":"Rosa","quantity":1}]' where id = 1`)), 'invalid store stock')
await expectError('grade com variação repetida é recusada', () => asOwner(() => db.query(`update public.catalog_products set unit_stock = '[{"unit":"galeria-portuense","size":"U","color":"Rosa","quantity":1},{"unit":"galeria-portuense","size":"U","color":"Rosa","quantity":2}]' where id = 1`)), 'invalid store stock')
const attendantUpdate = await asUser(GALERIA, () => db.query(`update public.catalog_products set price = 1 where id = 1 returning id`))
check('atendente não edita a peça', attendantUpdate.rows.length === 0 && Number((await one('select price from public.catalog_products where id = 1')).price) === 75)
await expectError('atendente não cadastra peça', () => asUser(GALERIA, () => db.query(`insert into public.catalog_products (name, category, description, price, image) values ('x', 'x', 'x', 1, 'x')`)), 'row-level security')
await asOwner(() => db.query(`update public.catalog_products set name = 'Vestido Dress' where id = 1`))
check('dona edita a peça sem mexer no estoque', (await totalQty(1, 'U', 'Rosa')) === 12)
await asOwner(() => db.query(`insert into public.catalog_products (id, name, category, description, price, image, sizes, colors, variant_stock) values
  (3, 'Blusa', 'Blusas', 'Blusa', 45, 'https://x/3.jpg', '["P"]', '[{"name":"Branca","hex":"#ffffff"}]', '[{"size":"P","color":"Branca","quantity":5}]')`))
check('peça nova do painel antigo entra na Galeria', (await unitQty(3, 'galeria-portuense', 'P', 'Branca')) === 5 && (await totalQty(3, 'P', 'Branca')) === 5)
check('vitrine lê o estoque das duas lojas', (await asAnon(() => one('select unit_stock from public.catalog_products where id = 1'))).unit_stock.length >= 2)

console.log('\nTransferência:')
const moved = await transfer(OWNER, 'galeria-portuense', 'cidade-nova-4', [{ productId: 2, size: 'P', color: 'Bege', quantity: 3 }], 'Reposição da semana')
check('dona transfere da Galeria para a Cidade Nova', moved === 3 && (await unitQty(2, 'galeria-portuense', 'P', 'Bege')) === 1 && (await unitQty(2, 'cidade-nova-4', 'P', 'Bege')) === 3)
check('transferência não muda o total', (await totalQty(2, 'P', 'Bege')) === 4)
const transferRows = await rows(`select unit_id, delta, reason, note from public.stock_movements where reason = 'transferencia' order by id`)
check('histórico mostra saída e entrada com as lojas', transferRows.length === 2 && transferRows[0].unit_id === 'galeria-portuense' && transferRows[0].delta === -3
  && transferRows[1].unit_id === 'cidade-nova-4' && transferRows[1].delta === 3 && transferRows[0].note === 'Galeria Portuense → Cidade Nova 4 · Reposição da semana')
await expectError('não transfere mais do que a loja tem', () => transfer(OWNER, 'galeria-portuense', 'cidade-nova-4', [{ productId: 2, size: 'P', color: 'Bege', quantity: 5 }]), 'insufficient stock in this store')
check('transferência que falhou não muda nada', (await unitQty(2, 'galeria-portuense', 'P', 'Bege')) === 1 && (await unitQty(2, 'cidade-nova-4', 'P', 'Bege')) === 3)
await expectError('atendente não tira peça da outra loja', () => transfer(CIDADE, 'galeria-portuense', 'cidade-nova-4', [{ productId: 2, size: 'P', color: 'Bege', quantity: 1 }]), 'not authorized')
await transfer(CIDADE, 'cidade-nova-4', 'galeria-portuense', [{ productId: 2, size: 'P', color: 'Bege', quantity: 1 }])
check('atendente envia peça da própria loja', (await unitQty(2, 'cidade-nova-4', 'P', 'Bege')) === 2 && (await unitQty(2, 'galeria-portuense', 'P', 'Bege')) === 2)
await expectError('não transfere para a mesma loja', () => transfer(OWNER, 'galeria-portuense', 'galeria-portuense', [{ productId: 2, size: 'P', color: 'Bege', quantity: 1 }]), 'invalid store unit')

console.log('\nPedidos do site por loja:')
const cidadeOrder = await createOrder(order('cidade', [{ productId: 2, size: 'P', color: 'Bege', quantity: 2 }]))
const cidadeRow = await orderByRef(cidadeOrder.reference)
check('pedido fica ligado à loja escolhida', cidadeRow.unit_id === 'cidade-nova-4')
check('pedido baixa só o estoque da loja escolhida', (await unitQty(2, 'cidade-nova-4', 'P', 'Bege')) === 0 && (await unitQty(2, 'galeria-portuense', 'P', 'Bege')) === 2)
check('reserva entra no histórico da loja', (await one(`select unit_id from public.stock_movements where order_reference = $1`, [cidadeOrder.reference])).unit_id === 'cidade-nova-4')
await expectError('loja sem a peça recusa o pedido mesmo com estoque na outra', () => createOrder(order('cidade', [{ productId: 2, size: 'M', color: 'Bege', quantity: 1 }])), 'insufficient stock in this store')
check('pedido recusado não deixa nada separado', (await unitQty(2, 'galeria-portuense', 'M', 'Bege')) === 2)
const galeriaOrder = await createOrder(order('galeria', [{ productId: 2, size: 'M', color: 'Bege', quantity: 1 }]))
const galeriaRow = await orderByRef(galeriaOrder.reference)
check('pedido na Galeria baixa da Galeria', (await unitQty(2, 'galeria-portuense', 'M', 'Bege')) === 1)

console.log('\nCada atendente vê a sua loja:')
const seenByGaleria = await asUser(GALERIA, () => rows('select reference from public.store_orders'))
check('atendente da Galeria só vê pedidos da Galeria', seenByGaleria.length === 1 && seenByGaleria[0].reference === galeriaOrder.reference)
check('atendente da Cidade Nova só vê os dela', (await asUser(CIDADE, () => rows('select unit_id from public.store_orders'))).every((row) => row.unit_id === 'cidade-nova-4'))
check('dona vê pedidos das duas lojas', (await asOwner(() => rows('select reference from public.store_orders'))).length === 2)
await expectError('atendente não confirma pedido da outra loja', () => asUser(GALERIA, () => db.query('select public.confirm_store_order($1)', [cidadeRow.id])), 'not authorized')
await expectError('atendente não cancela pedido da outra loja', () => asUser(GALERIA, () => db.query('select public.cancel_store_order($1, null)', [cidadeRow.id])), 'not authorized')
await asUser(CIDADE, () => db.query('select public.confirm_store_order($1)', [cidadeRow.id]))
await expectError('atendente não avança etapa da outra loja', () => asUser(GALERIA, () => db.query(`select public.update_order_status($1, 'paid')`, [cidadeRow.id])), 'not authorized')
await asUser(CIDADE, () => db.query(`select public.update_order_status($1, 'paid')`, [cidadeRow.id]))
check('atendente da loja confirma e avança o pedido', (await orderByRef(cidadeOrder.reference)).status === 'paid')
await asOwner(() => db.query('select public.cancel_store_order($1, $2)', [galeriaRow.id, 'Cliente desistiu']))
check('cancelar devolve à loja do pedido', (await unitQty(2, 'galeria-portuense', 'M', 'Bege')) === 2 && (await unitQty(2, 'cidade-nova-4', 'M', 'Bege')) === 0)
const galeriaHistory = await asUser(GALERIA, () => rows('select unit_id from public.stock_movements'))
check('atendente só vê o histórico da própria loja', galeriaHistory.length > 0 && galeriaHistory.every((row) => row.unit_id === 'galeria-portuense'))
check('dona vê o histórico das duas lojas', new Set((await asOwner(() => rows('select unit_id from public.stock_movements'))).map((row) => row.unit_id)).size === 2)

const expiring = await createOrder(order('cidade', [{ productId: 1, size: 'U', color: 'Rosa', quantity: 1 }]))
check('reserva da Cidade Nova baixa da Cidade Nova', (await unitQty(1, 'cidade-nova-4', 'U', 'Rosa')) === 1)
await db.query(`update public.store_orders set reserved_until = now() - interval '1 minute' where reference = $1`, [expiring.reference])
await db.query('select public.release_expired_reservations()')
check('reserva vencida volta para a mesma loja', (await unitQty(1, 'cidade-nova-4', 'U', 'Rosa')) === 2 && (await unitQty(1, 'galeria-portuense', 'U', 'Rosa')) === 10)

console.log('\nVenda no balcão:')
const sale = (unitName) => ({ unitName, unitAddress: '', payment: 'Dinheiro', items: [{ productId: 1, size: 'U', color: 'Rosa', quantity: 1 }] })
await asUser(GALERIA, () => db.query('select public.register_store_sale($1::jsonb)', [JSON.stringify(sale('Galeria Portuense'))]))
check('atendente vende no balcão da própria loja', (await unitQty(1, 'galeria-portuense', 'U', 'Rosa')) === 9)
await expectError('atendente não registra venda na outra loja', () => asUser(GALERIA, () => db.query('select public.register_store_sale($1::jsonb)', [JSON.stringify(sale('Cidade Nova 4'))])), 'not authorized')
await asOwner(() => db.query('select public.register_store_sale($1::jsonb)', [JSON.stringify(sale('Cidade Nova 4'))]))
check('dona registra venda em qualquer loja', (await unitQty(1, 'cidade-nova-4', 'U', 'Rosa')) === 1)
await expectError('balcão sem a peça na loja é recusado', () => asOwner(() => db.query('select public.register_store_sale($1::jsonb)', [JSON.stringify({ ...sale('Cidade Nova 4'), items: [{ productId: 3, size: 'P', color: 'Branca', quantity: 1 }] })])), 'insufficient stock in this store')
await expectError('loja fora da lista é recusada', () => asOwner(() => db.query('select public.register_store_sale($1::jsonb)', [JSON.stringify(sale('Loja Nova'))])), 'invalid store unit')

console.log('\nSó a dona:')
check('atendente não vê cupons', (await asUser(GALERIA, () => rows('select code from public.store_coupons'))).length === 0)
check('dona vê cupons', (await asOwner(() => rows('select code from public.store_coupons'))).length >= 1)
check('atendente não muda configurações', (await asUser(GALERIA, () => db.query(`update public.store_settings set free_shipping_min = 1 where id = 1 returning id`))).rows.length === 0)
check('atendente não muda o Pix das lojas', (await asUser(GALERIA, () => db.query(`update public.store_units set pix_key = 'x@x.com' returning id`))).rows.length === 0)
await asOwner(() => db.query(`update public.store_units set pix_key = 'cidadenova@example.com', pix_name = 'Bella Chic CN', pix_city = 'Ananindeua' where id = 'cidade-nova-4'`))
check('dona cadastra o Pix de cada loja', (await one(`select pix_key from public.store_units where id = 'cidade-nova-4'`)).pix_key === 'cidadenova@example.com'
  && (await one(`select pix_key from public.store_units where id = 'galeria-portuense'`)).pix_key === '+5591980648559')
check('visitante lê o Pix das lojas (vai no Pix copia e cola)', (await asAnon(() => rows('select id, pix_key from public.store_units'))).length === 2)
await expectError('visitante não muda o Pix', () => asAnon(() => db.query(`update public.store_units set pix_key = 'x'`)), 'permission denied')
check('atendente não lê a lista VIP', (await asUser(GALERIA, () => rows('select id from public.vip_subscribers'))).length === 0)

console.log('\nEquipe:')
const team = await asOwner(() => rows('select * from public.list_store_team()'))
check('dona vê a equipe com e-mail e loja', team.length === 3 && team.find((member) => member.email === 'cidade@example.com').unit_id === 'cidade-nova-4' && team.find((member) => member.is_me).unit_id === null)
await expectError('atendente não vê a equipe', () => asUser(GALERIA, () => db.query('select * from public.list_store_team()')), 'not authorized')
await asOwner(() => db.query(`select public.save_store_team_member('Cliente@Example.com', 'galeria-portuense')`))
check('dona adiciona atendente pelo e-mail', (await asUser(CUSTOMER, () => one('select public.admin_unit_id() as u'))).u === 'galeria-portuense')
await asOwner(() => db.query(`select public.save_store_team_member('cliente@example.com', 'cidade-nova-4')`))
check('dona troca a loja da atendente', (await asUser(CUSTOMER, () => one('select public.admin_unit_id() as u'))).u === 'cidade-nova-4')
await expectError('e-mail sem conta é avisado', () => asOwner(() => db.query(`select public.save_store_team_member('ninguem@example.com', null)`)), 'user not found')
await expectError('dona não muda o próprio acesso', () => asOwner(() => db.query(`select public.save_store_team_member('dona@example.com', 'galeria-portuense')`)), 'cannot change your own access')
await expectError('atendente não adiciona ninguém', () => asUser(GALERIA, () => db.query(`select public.save_store_team_member('cliente@example.com', null)`)), 'not authorized')
await asOwner(() => db.query('select public.remove_store_team_member($1)', [CUSTOMER]))
check('dona tira alguém da equipe', (await asUser(CUSTOMER, () => one('select public.is_store_admin() as ok'))).ok === false)
await expectError('dona não se tira da equipe', () => asOwner(() => db.query('select public.remove_store_team_member($1)', [OWNER])), 'cannot change your own access')

console.log('\nSegurança:')
await expectError('ninguém chama a função interna de estoque', () => asOwner(() => db.query(`select public.adjust_unit_stock(1, 'galeria-portuense', 'U', 'Rosa', 50)`)), 'permission denied')
await expectError('visitante não transfere', () => asAnon(() => db.query(`select public.transfer_stock('galeria-portuense', 'cidade-nova-4', '[]'::jsonb, null)`)), 'permission denied')
await expectError('visitante não vê a equipe', () => asAnon(() => db.query('select * from public.list_store_team()')), 'permission denied')
check('estoque nunca ficou negativo', (await one(`select count(*)::int as n from public.catalog_products, jsonb_array_elements(unit_stock) e where (e->>'quantity')::int < 0`)).n === 0)
check('total sempre igual à soma das lojas', (await one(`
  select count(*)::int as n from public.catalog_products p, jsonb_array_elements(p.variant_stock) v
  where (v->>'quantity')::int <> (select coalesce(sum((e->>'quantity')::int), 0) from jsonb_array_elements(p.unit_stock) e where e->>'size' = v->>'size' and e->>'color' = v->>'color')`)).n === 0)

console.log(`\n${passed} verificações ok, ${failures.length} com problema.`)
if (failures.length) {
  console.log('Falharam:\n- ' + failures.join('\n- '))
  process.exit(1)
}
