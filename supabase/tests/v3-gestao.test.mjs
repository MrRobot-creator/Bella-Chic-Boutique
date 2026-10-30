/*
 * Testes do supabase/v3-gestao.sql num Postgres local (PGlite), sem tocar no banco real.
 *
 * Como rodar (fora do projeto, para não mexer nas dependências do site):
 *   mkdir %TEMP%\bella-sqltest && cd %TEMP%\bella-sqltest
 *   npm install @electric-sql/pglite@0.2.17
 *   copy <projeto>\supabase\tests\v3-gestao.test.mjs .
 *   node v3-gestao.test.mjs <caminho do projeto>
 *
 * O script cria versões simples de auth.users, auth.uid() e storage (do Supabase),
 * roda os arquivos SQL na mesma ordem usada em produção e confere cada regra.
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

const ADMIN = '00000000-0000-4000-8000-000000000001'
const CUSTOMER = '00000000-0000-4000-8000-000000000002'
const OTHER = '00000000-0000-4000-8000-000000000003'

const asRole = async (role, uid, fn) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${role};`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}
const asAnon = (fn) => asRole('anon', null, fn)
const asAdmin = (fn) => asRole('authenticated', ADMIN, fn)
const asCustomer = (uid, fn) => asRole('authenticated', uid, fn)

const expectError = async (name, fn, text) => {
  try {
    await fn()
    check(name, false, '(esperava erro)')
  } catch (error) {
    check(name, String(error.message).toLowerCase().includes(text.toLowerCase()), `(erro: ${error.message})`)
  }
}

let refCounter = 0
const reference = () => `BC-${(++refCounter).toString(16).toUpperCase().padStart(16, '0')}`
const pickup = { type: 'Retirada na loja', street: '', houseNumber: '', complement: '', neighborhood: '', postalCode: '', deliveryCity: '', referencePoint: '', deliveryNotes: '', deliveryFee: null }
const delivery = (city, fee) => ({ ...pickup, type: 'Entrega', street: 'Rua A', houseNumber: '10', neighborhood: 'Centro', deliveryCity: city, deliveryFee: fee })
const order = (items, { phone = '(91) 98888-0001', email = 'maria@example.com', coupon, fulfillment = pickup } = {}) => ({
  reference: reference(),
  customer: { name: 'Maria Souza Lima', phone, email },
  items,
  unit: { name: 'Galeria Portuense', address: 'Tv. Padre Eutíquio, 1055', attendant: 'Galeria Portuense', storePhone: '5591980648559' },
  fulfillment,
  payment: 'Pix',
  ...(coupon ? { couponCode: coupon } : {})
})
const createOrder = (payload) => one('select public.create_store_order($1::jsonb) as r', [JSON.stringify(payload)]).then((row) => row.r)
const stockOf = async (productId, size, color) => (await one(
  `select coalesce((select (v->>'quantity')::int from jsonb_array_elements(variant_stock) v where v->>'size' = $2 and v->>'color' = $3), -1) as q
   from public.catalog_products where id = $1`, [productId, size, color])).q
const orderByRef = (ref) => one('select * from public.store_orders where reference = $1', [ref])

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

for (const file of ['setup.sql', 'order-management.sql', 'order-protection.sql', 'restock-alerts.sql', 'storage.sql']) {
  await db.exec(sql(file))
}

await db.exec(`
  insert into auth.users (id, email) values
    ('${ADMIN}', 'admin@example.com'), ('${CUSTOMER}', 'cliente@example.com'), ('${OTHER}', 'outra@example.com');
  insert into public.store_admins (user_id) values ('${ADMIN}');
  insert into public.catalog_products (id, name, category, description, price, image, sizes, colors, variant_stock, is_available) values
    (1, 'Vestido Dress', 'Vestidos', 'Vestido', 75, 'https://x/1.jpg', '["U"]', '[{"name":"Rosa","hex":"#ff0000"},{"name":"Preto","hex":"#000000"}]',
       '[{"size":"U","color":"Rosa","quantity":2},{"size":"U","color":"Preto","quantity":1}]', true),
    (2, 'Conjunto Marrant', 'Conjuntos', 'Conjunto', 150, 'https://x/2.jpg', '["M"]', '[{"name":"Bege","hex":"#eeddcc"}]',
       '[{"size":"M","color":"Bege","quantity":10}]', true),
    (3, 'Blusa Rendada', 'Blusas', 'Blusa', 45, 'https://x/3.jpg', '["P"]', '[{"name":"Branca","hex":"#ffffff"}]',
       '[{"size":"P","color":"Branca","quantity":5}]', false);
`)

console.log('\nCompatibilidade com o site atual (antes da v3):')
const legacy = await asAnon(() => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 1 }], { phone: '(91) 90000-0001' })))
const legacyOrder = await orderByRef(legacy.reference)
await asAdmin(() => db.query('select public.confirm_store_order($1)', [legacyOrder.id]))
check('venda confirmada pela versão antiga baixa o estoque', (await stockOf(2, 'M', 'Bege')) === 9)

console.log('\nRodando v3-gestao.sql duas vezes (precisa ser repetível)...')
await db.exec(sql('v3-gestao.sql'))
await db.exec(sql('v3-gestao.sql'))
check('BELLA10 criado uma vez', (await one(`select count(*)::int as n from public.store_coupons where code = 'BELLA10'`)).n === 1)
check('venda antiga marcada como estoque já baixado', (await orderByRef(legacy.reference)).stock_taken === true)

console.log('\nReserva de peças:')
const a = await asAnon(() => createOrder(order([{ productId: 1, size: 'U', color: 'Rosa', quantity: 2 }], { phone: '(91) 91111-0001' })))
check('pedido do site separa as peças na hora', (await stockOf(1, 'U', 'Rosa')) === 0)
check('pedido devolve o total e o fim da reserva', Number(a.total) === 150 && Boolean(a.reservedUntil))
const aOrder = await orderByRef(a.reference)
check('pedido fica pendente com reserva', aOrder.status === 'pending' && aOrder.stock_taken === true && aOrder.reserved_until !== null)
check('histórico registra a reserva', (await one(`select count(*)::int as n from public.stock_movements where order_reference = $1 and reason = 'reserva' and delta = -2`, [a.reference])).n === 1)
await expectError('segunda cliente não consegue a mesma peça reservada',
  () => asAnon(() => createOrder(order([{ productId: 1, size: 'U', color: 'Rosa', quantity: 1 }], { phone: '(91) 91111-0002' }))),
  'insufficient stock')
await expectError('peça inativa não pode ser pedida',
  () => asAnon(() => createOrder(order([{ productId: 3, size: 'P', color: 'Branca', quantity: 1 }], { phone: '(91) 91111-0003' }))),
  'insufficient stock')

console.log('\nEtapas do pedido e cancelamento com devolução:')
await expectError('visitante não confirma pedido', () => asAnon(() => db.query('select public.confirm_store_order($1)', [aOrder.id])), 'permission denied')
await expectError('cliente logada não confirma pedido', () => asCustomer(CUSTOMER, () => db.query('select public.confirm_store_order($1)', [aOrder.id])), 'not authorized')
await expectError('não marca pago antes de confirmar', () => asAdmin(() => db.query(`select public.update_order_status($1, 'paid')`, [aOrder.id])), 'confirm the order first')
await asAdmin(() => db.query('select public.confirm_store_order($1)', [aOrder.id]))
check('confirmar não baixa o estoque de novo', (await stockOf(1, 'U', 'Rosa')) === 0)
await asAdmin(() => db.query(`select public.update_order_status($1, 'paid')`, [aOrder.id]))
await asAdmin(() => db.query(`select public.update_order_status($1, 'shipped')`, [aOrder.id]))
await expectError('não volta etapa', () => asAdmin(() => db.query(`select public.update_order_status($1, 'paid')`, [aOrder.id])), 'already in this step')
await asAdmin(() => db.query(`select public.update_order_status($1, 'delivered')`, [aOrder.id]))
const aDelivered = await orderByRef(a.reference)
check('datas de pago, enviado e entregue preenchidas', aDelivered.status === 'delivered' && aDelivered.paid_at && aDelivered.shipped_at && aDelivered.delivered_at)
await asAdmin(() => db.query(`select public.cancel_store_order($1, 'Cliente devolveu')`, [aOrder.id]))
check('cancelar venda entregue devolve ao estoque', (await stockOf(1, 'U', 'Rosa')) === 2)
const aCancelled = await orderByRef(a.reference)
check('cancelamento guarda o motivo', aCancelled.status === 'cancelled' && aCancelled.cancel_reason === 'Cliente devolveu' && aCancelled.stock_taken === false)
await expectError('não cancela duas vezes', () => asAdmin(() => db.query('select public.cancel_store_order($1)', [aOrder.id])), 'already cancelled')
const legacyId = (await orderByRef(legacy.reference)).id
await asAdmin(() => db.query('select public.cancel_store_order($1)', [legacyId]))
check('cancelar venda antiga (anterior à v3) também devolve', (await stockOf(2, 'M', 'Bege')) === 10)
check('chamada antiga cancel_store_order(p_order_id) continua funcionando', true)

console.log('\nReserva vencida e pedido parado:')
const c = await asAnon(() => createOrder(order([{ productId: 1, size: 'U', color: 'Preto', quantity: 1 }], { phone: '(91) 92222-0001' })))
await db.query(`update public.store_orders set reserved_until = now() - interval '1 minute' where reference = $1`, [c.reference])
const released = (await one('select public.release_expired_reservations() as n')).n
check('reserva vencida volta ao estoque', released === 1 && (await stockOf(1, 'U', 'Preto')) === 1)
const cOrder = await orderByRef(c.reference)
check('pedido continua pendente sem reserva', cOrder.status === 'pending' && cOrder.stock_taken === false)
await asAdmin(() => db.query('select public.confirm_store_order($1)', [cOrder.id]))
check('confirmar depois da reserva vencida separa de novo', (await stockOf(1, 'U', 'Preto')) === 0 && (await orderByRef(c.reference)).status === 'confirmed')
check('histórico registra expiração e confirmação', (await one(`select count(*)::int as n from public.stock_movements where order_reference = $1 and reason in ('expiracao', 'confirmacao')`, [c.reference])).n === 2)

const d = await asAnon(() => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 2 }], { phone: '(91) 93333-0001' })))
await db.query(`update public.store_orders set created_at = now() - interval '49 hours' where reference = $1`, [d.reference])
await db.query('select public.release_expired_reservations()')
const dOrder = await orderByRef(d.reference)
check('pedido parado há 48 h é cancelado sozinho', dOrder.status === 'cancelled' && dOrder.cancel_reason.includes('48'))
check('e as peças voltam ao estoque', (await stockOf(2, 'M', 'Bege')) === 10)

console.log('\nVenda no balcão:')
const sale = await asAdmin(() => one('select public.register_store_sale($1::jsonb) as r', [JSON.stringify({
  unitName: 'Cidade Nova 4', payment: 'Cartão de débito', discount: 5,
  items: [{ productId: 1, size: 'U', color: 'Rosa', quantity: 1 }]
})]).then((row) => row.r))
const saleOrder = await orderByRef(sale.reference)
check('venda no balcão baixa o estoque', (await stockOf(1, 'U', 'Rosa')) === 1)
check('venda no balcão entra como entregue, canal balcão', saleOrder.status === 'delivered' && saleOrder.channel === 'balcao' && Number(saleOrder.discount) === 5)
check('histórico registra a venda no balcão', (await one(`select count(*)::int as n from public.stock_movements where order_reference = $1 and reason = 'venda_balcao'`, [sale.reference])).n === 1)
await expectError('balcão não vende sem estoque', () => asAdmin(() => db.query('select public.register_store_sale($1::jsonb)', [JSON.stringify({
  unitName: 'Cidade Nova 4', payment: 'Pix', items: [{ productId: 1, size: 'U', color: 'Preto', quantity: 1 }]
})])), 'insufficient stock')
await expectError('cliente não registra venda no balcão', () => asCustomer(CUSTOMER, () => db.query('select public.register_store_sale($1::jsonb)', [JSON.stringify({
  unitName: 'Cidade Nova 4', payment: 'Pix', items: [{ productId: 2, size: 'M', color: 'Bege', quantity: 1 }]
})])), 'not authorized')

console.log('\nAjuste manual da grade no painel:')
await asAdmin(() => db.query(`update public.catalog_products set variant_stock = '[{"size":"M","color":"Bege","quantity":13}]' where id = 2`))
const manual = await one(`select reason, delta, balance_after from public.stock_movements where product_id = 2 order by id desc limit 1`)
check('editar a grade registra entrada no histórico', manual.reason === 'entrada' && manual.delta === 3 && manual.balance_after === 13)
await expectError('visitante não lê o histórico', () => asAnon(() => db.query('select * from public.stock_movements')), 'permission denied')

console.log('\nCupons:')
const coupon1 = await asAnon(() => one(`select public.check_coupon('bella10', 350) as r`).then((row) => row.r))
check('BELLA10 vale 10% acima de R$ 300', coupon1.valid === true && Number(coupon1.discount) === 35)
const coupon2 = await asAnon(() => one(`select public.check_coupon('BELLA10', 100) as r`).then((row) => row.r))
check('BELLA10 abaixo do mínimo avisa o motivo', coupon2.valid === false && coupon2.reason === 'min_subtotal')
const coupon3 = await asAnon(() => one(`select public.check_coupon('NAOEXISTE', 500) as r`).then((row) => row.r))
check('cupom inexistente', coupon3.valid === false && coupon3.reason === 'not_found')
const withCoupon = await asAnon(() => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 2 }], { phone: '(91) 94444-0001', email: 'ana@example.com', coupon: 'Bella10' })))
check('pedido com cupom tem desconto calculado no servidor', Number(withCoupon.discount) === 30 && withCoupon.couponCode === 'BELLA10')
await expectError('BELLA10 só uma vez por cliente', () => asAnon(() => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 2 }], { phone: '(91) 94444-0001', email: 'outra@example.com', coupon: 'BELLA10' }))), 'already used')
await asAdmin(() => db.query(`insert into public.store_coupons (code, kind, value, max_uses, once_per_customer) values ('FIXO20', 'fixed', 20, 1, false)`))
const fixed = await asAnon(() => createOrder(order([{ productId: 1, size: 'U', color: 'Rosa', quantity: 1 }], { phone: '(91) 95555-0001', coupon: 'fixo20' })))
check('cupom em reais', Number(fixed.discount) === 20)
await expectError('cupom com limite de usos esgotado', () => asAnon(() => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 1 }], { phone: '(91) 95555-0002', coupon: 'FIXO20' }))), 'limit')
await expectError('visitante não vê a lista de cupons', () => asAnon(() => db.query('select * from public.store_coupons')), 'permission denied')
await asAdmin(() => db.query(`insert into public.store_coupons (code, kind, value, first_purchase_only, once_per_customer) values ('PRIMEIRA', 'percent', 5, true, false)`))
await expectError('cupom de primeira compra recusa quem já comprou', () => asAnon(() => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 1 }], { phone: '(91) 94444-0001', email: 'ana@example.com', coupon: 'PRIMEIRA' }))), 'first purchase')

console.log('\nFrete grátis:')
await asAdmin(() => db.query('update public.store_settings set free_shipping_min = 200 where id = 1'))
const free = await asAnon(() => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 2 }], { phone: '(91) 96666-0001', fulfillment: delivery('Belém', 12) })))
check('acima do mínimo o frete fica grátis', Number(free.deliveryFee) === 0 && Number(free.total) === 300)
const paidShipping = await asAnon(() => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 1 }], { phone: '(91) 96666-0002', fulfillment: delivery('Ananindeua', 0) })))
check('abaixo do mínimo o servidor cobra o frete certo', Number(paidShipping.deliveryFee) === 15 && Number(paidShipping.total) === 165)
await expectError('cliente não altera as configurações', () => asCustomer(CUSTOMER, async () => {
  const result = await db.query('update public.store_settings set free_shipping_min = 1 where id = 1 returning id')
  if (!result.rows.length) throw new Error('permission denied (nenhuma linha alterada)')
}), 'permission denied')
check('visitante lê as configurações públicas', (await asAnon(() => one('select free_shipping_min from public.store_settings'))).free_shipping_min !== undefined)

console.log('\nMeus pedidos:')
const mine = await asCustomer(CUSTOMER, () => createOrder(order([{ productId: 2, size: 'M', color: 'Bege', quantity: 1 }], { phone: '(91) 97777-0001' })))
check('pedido de cliente logada guarda a conta', (await orderByRef(mine.reference)).user_id === CUSTOMER)
check('cliente vê só os próprios pedidos', (await asCustomer(CUSTOMER, () => rows('select reference from public.store_orders'))).map((row) => row.reference).join() === mine.reference)
check('outra cliente não vê', (await asCustomer(OTHER, () => rows('select reference from public.store_orders'))).length === 0)
check('administradora vê todos', (await asAdmin(() => rows('select reference from public.store_orders'))).length > 5)

console.log('\nAvaliações:')
const pendingToken = (await orderByRef(mine.reference)).review_token
check('link de pedido não entregue não abre avaliação', (await asAnon(() => one('select public.get_review_request($1) as r', [pendingToken]))).r === null)
const deliveredToken = saleOrder.review_token
const request = (await asAnon(() => one('select public.get_review_request($1) as r', [deliveredToken]))).r
check('link de pedido entregue mostra as peças, sem dados pessoais', request && request.items.length === 1 && !JSON.stringify(request).includes('phone'))
check('foto só pode ser enviada para link válido', (await asAnon(() => one('select public.review_upload_allowed($1) as ok', [deliveredToken]))).ok === true
  && (await asAnon(() => one('select public.review_upload_allowed($1) as ok', [pendingToken]))).ok === false)
await asAnon(() => db.query(`insert into storage.objects (bucket_id, name) values ('bella-chic-reviews', $1)`, [`${deliveredToken}/foto-1.jpg`]))
await expectError('não envia foto com link inválido', () => asAnon(() => db.query(`insert into storage.objects (bucket_id, name) values ('bella-chic-reviews', $1)`, [`${pendingToken}/foto.jpg`])), 'row-level security')
await asAnon(() => db.query('select public.submit_review($1, 1, 5, $2, $3::jsonb)', [deliveredToken, 'Amei o caimento', JSON.stringify([`${deliveredToken}/foto-1.jpg`])]))
const review = await one('select * from public.product_reviews limit 1')
check('avaliação entra pendente com nome curto', review.status === 'pending' && review.customer_name === 'Cliente')
check('avaliação pendente não aparece no site', (await asAnon(() => rows('select id from public.product_reviews'))).length === 0)
await asAdmin(() => db.query(`update public.product_reviews set status = 'approved', reviewed_at = now()`))
check('avaliação aprovada aparece no site', (await asAnon(() => rows('select id, rating, comment, photos from public.product_reviews'))).length === 1)
await expectError('visitante não vê de qual pedido é a avaliação', () => asAnon(() => db.query('select order_id from public.product_reviews')), 'permission denied')
await expectError('não avalia a mesma peça duas vezes', () => asAnon(() => db.query('select public.submit_review($1, 1, 4, null, null)', [deliveredToken])), 'already sent')
await expectError('foto de outra pasta é recusada', () => asAnon(() => db.query('select public.submit_review($1, 1, 4, null, $2::jsonb)', [deliveredToken, JSON.stringify(['outra/foto.jpg'])])), 'photos')

console.log('\nLista VIP:')
await expectError('não entra sem consentimento', () => asAnon(() => db.query(`select public.join_vip_list($1::jsonb)`, [JSON.stringify({ phone: '(91) 98888-1234', consent: false, consentText: 'Aceito receber mensagens' })])), 'consent')
await asAnon(() => db.query(`select public.join_vip_list($1::jsonb)`, [JSON.stringify({ name: 'Júlia', phone: '(91) 98888-1234', consent: true, consentText: 'Aceito receber mensagens da Bella Chic.' })]))
await asAnon(() => db.query(`select public.join_vip_list($1::jsonb)`, [JSON.stringify({ phone: '91988881234', consent: true, consentText: 'Aceito receber mensagens da Bella Chic.' })]))
check('mesmo WhatsApp não duplica e mantém o nome', (await one(`select count(*)::int as n, max(name) as name from public.vip_subscribers`)).n === 1 && (await one('select name from public.vip_subscribers')).name === 'Júlia')
await expectError('visitante não lê a lista VIP', () => asAnon(() => db.query('select * from public.vip_subscribers')), 'permission denied')
check('administradora lê a lista VIP', (await asAdmin(() => rows('select id from public.vip_subscribers'))).length === 1)

console.log('\nSegurança:')
await expectError('visitante não chama funções internas de estoque', () => asAnon(() => db.query(`select public.adjust_variant_stock(1, 'U', 'Rosa', 50)`)), 'permission denied')
await expectError('cliente logada também não', () => asCustomer(CUSTOMER, () => db.query(`select public.take_order_stock($1, 'reserva')`, [saleOrder.id])), 'permission denied')
await expectError('visitante não chama is_store_admin', () => asAnon(() => db.query('select public.is_store_admin()')), 'permission denied')
check('estoque nunca ficou negativo', (await one(`select count(*)::int as n from public.catalog_products, jsonb_array_elements(variant_stock) v where (v->>'quantity')::int < 0`)).n === 0)

console.log(`\n${passed} verificações ok, ${failures.length} com problema.`)
if (failures.length) {
  console.log('Falharam:\n- ' + failures.join('\n- '))
  process.exit(1)
}
