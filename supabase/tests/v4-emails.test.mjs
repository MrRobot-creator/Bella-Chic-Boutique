/*
 * Testes do supabase/v4-emails.sql num Postgres local (PGlite), sem tocar no banco real
 * e sem mandar e-mail de verdade: o envio pelo Resend é simulado.
 *
 * Como rodar (na mesma pasta usada pelo teste da v3):
 *   cd %TEMP%\bella-sqltest
 *   copy <projeto>\supabase\tests\v4-emails.test.mjs .
 *   node v4-emails.test.mjs <caminho do projeto> [pasta para salvar os e-mails gerados]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

const projectDir = process.argv[2] || process.cwd()
const outputDir = process.argv[3]
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
const asCustomer = (fn) => asRole('authenticated', CUSTOMER, fn)

const expectError = async (name, fn, text) => {
  try {
    await fn()
    check(name, false, '(esperava erro)')
  } catch (error) {
    check(name, String(error.message).toLowerCase().includes(text.toLowerCase()), `(erro: ${error.message})`)
  }
}

// CRC16 do Pix, igual ao src/utils/pix.ts, para conferir o código gerado pelo banco.
const crc16 = (payload) => {
  let crc = 0xffff
  for (const byte of Buffer.from(payload, 'utf8')) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

let phoneCounter = 0
const pickup = { type: 'Retirada na loja', street: '', houseNumber: '', complement: '', neighborhood: '', postalCode: '', deliveryCity: '', referencePoint: '', deliveryNotes: '', deliveryFee: null }
const delivery = { ...pickup, type: 'Entrega', street: 'Rua das Flores', houseNumber: '120', neighborhood: 'Batista Campos', deliveryCity: 'Belém', deliveryFee: 12 }
const order = ({ email = 'maria@example.com', name = 'Maria Souza Lima', fulfillment = pickup, payment = 'Pix', items } = {}) => ({
  reference: `BC-${(Date.now() + phoneCounter).toString(16).toUpperCase().padStart(16, '0')}`,
  customer: { name, phone: `(91) 98888-${String(1000 + ++phoneCounter)}`, email },
  items: items || [{ productId: 2, size: 'M', color: 'Bege', quantity: 2 }],
  unit: { name: 'Galeria Portuense', address: 'Tv. Padre Eutíquio, 1055', attendant: 'Galeria Portuense', storePhone: '5591980648559' },
  fulfillment,
  payment
})
const createOrder = (payload) => asAnon(() => one('select public.create_store_order($1::jsonb) as r', [JSON.stringify(payload)])).then((row) => row.r)
const orderByRef = (ref) => one('select * from public.store_orders where reference = $1', [ref])
const sent = () => rows('select * from net.captured order by id')
const lastSent = () => one('select * from net.captured order by id desc limit 1')
const sentCount = async () => (await one('select count(*)::int as n from net.captured')).n
const saved = {}

console.log('Preparando banco parecido com o Supabase...')
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth; create schema storage; create schema net; create schema vault;
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

  -- pg_net simulado: guarda o pedido de envio em vez de chamar o Resend.
  create table net.captured (id bigserial primary key, url text, body jsonb, headers jsonb, timeout integer);
  create table net._http_response (id bigint primary key, status_code integer, content text, error_msg text);
  create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds integer default 5000)
  returns bigint language plpgsql as $$
  declare v_id bigint;
  begin
    if current_setting('test.fail_http', true) = 'on' then raise exception 'rede fora do ar'; end if;
    insert into net.captured (url, body, headers, timeout) values (url, body, headers, timeout_milliseconds) returning id into v_id;
    return v_id;
  end;
  $$;
  -- Cofre simulado.
  create table vault.decrypted_secrets (id uuid default gen_random_uuid(), name text, decrypted_secret text);
`)

for (const file of ['setup.sql', 'order-management.sql', 'order-protection.sql', 'restock-alerts.sql', 'storage.sql', 'v3-gestao.sql', 'v5-unidades.sql']) {
  await db.exec(sql(file))
}
await db.exec(`
  insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.com'), ('${CUSTOMER}', 'cliente@example.com');
  insert into public.store_admins (user_id) values ('${ADMIN}');
  insert into public.catalog_products (id, name, category, description, price, image, sizes, colors, variant_stock, is_available) values
    (1, 'Vestido <Dress> & Cia', 'Vestidos', 'Vestido', 75, 'https://x/1.jpg', '["U"]', '[{"name":"Rosa","hex":"#ff0000"}]',
       '[{"size":"U","color":"Rosa","quantity":20}]', true),
    (2, 'Conjunto Marrant', 'Conjuntos', 'Conjunto', 150, 'https://x/2.jpg', '["M"]', '[{"name":"Bege","hex":"#eeddcc"}]',
       '[{"size":"M","color":"Bege","quantity":40}]', true);
`)

console.log('\nInstalação:')
await expectError('v4 exige a v3 antes', async () => {
  const empty = new PGlite()
  await empty.exec(sql('v4-emails.sql'))
}, 'v3-gestao.sql')
await db.exec(sql('v4-emails.sql'))
await db.exec(sql('v4-emails.sql'))
check('v4 roda duas vezes sem erro', true)
check('e-mails começam desligados', (await one('select order_emails_enabled from public.store_settings')).order_emails_enabled === false)

console.log('\nAjudantes:')
check('Pix igual ao exemplo do Banco Central', (await one(`select public.pix_payload('123e4567-e12b-12d1-a456-426655440000', 'Fulano de Tal', 'BRASILIA', null, null) as p`)).p
  === '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D')
const pixWithValue = (await one(`select public.pix_payload('+5591980648559', 'Bella Chic Boutique', 'Belém', 312, 'BC-7F3A21AA00000000') as p`)).p
check('Pix com valor e cidade sem acento', pixWithValue.includes('5406312.00') && pixWithValue.includes('6005Belem') && pixWithValue.slice(-4) === crc16(pixWithValue.slice(0, -4)))
check('valor em reais', (await one(`select public.brl(1234.5) as a, public.brl(0) as b, public.brl(75) as c`)).a === 'R$ 1.234,50'
  && (await one(`select public.brl(0) as b`)).b === 'R$ 0,00' && (await one(`select public.brl(75) as c`)).c === 'R$ 75,00')
check('escapa HTML', (await one(`select public.html_escape($1) as t`, [`<a href="x">Ana & 'Bia'</a>`])).t === '&lt;a href=&quot;x&quot;&gt;Ana &amp; &#39;Bia&#39;&lt;/a&gt;')

console.log('\nDesligado:')
const off = await createOrder(order())
check('com e-mails desligados, pedido não manda nada', (await sentCount()) === 0 && (await one('select count(*)::int as n from public.email_log')).n === 0, off.reference)

console.log('\nConfiguração:')
await expectError('cliente logada não liga os e-mails', () => asCustomer(async () => {
  const result = await db.query(`update public.store_settings set order_emails_enabled = true where id = 1 returning id`)
  if (!result.rows.length) throw new Error('row-level security: nada atualizado')
}), 'row-level security')
await expectError('remetente precisa ter domínio', () => asAdmin(() => db.query(`update public.store_settings set email_from = 'bella chic' where id = 1`)), 'store_settings_email_check')
await expectError('endereço do site precisa ser https sem barra no fim', () => asAdmin(() => db.query(`update public.store_settings set site_url = 'http://bellachic.com.br/' where id = 1`)), 'store_settings_email_check')
await asAdmin(() => db.query(`update public.store_settings set order_emails_enabled = true,
  email_from = 'Bella Chic Boutique <pedidos@bellachicboutique.com.br>', site_url = 'https://bellachicboutique.com.br',
  free_shipping_min = 400 where id = 1`))
await asAdmin(() => db.query(`update public.store_units set pix_key = '+5591980648559', pix_name = 'Bella Chic Boutique', pix_city = 'Belem' where id = 'galeria-portuense'`))
await asAdmin(() => db.query(`update public.store_units set pix_key = 'cidadenova@example.com', pix_name = 'Bella Chic CN', pix_city = 'Ananindeua' where id = 'cidade-nova-4'`))
check('administradora configura remetente e site', (await one('select email_from from public.store_settings')).email_from.includes('pedidos@'))

console.log('\nSem chave no cofre:')
const noKey = await createOrder(order({ email: 'semchave@example.com' }))
const noKeyLog = await one(`select * from public.email_log l join public.store_orders o on o.id = l.order_id where o.reference = $1`, [noKey.reference])
check('pedido é criado mesmo sem a chave do Resend', Boolean(await orderByRef(noKey.reference)))
check('falta da chave fica registrada no histórico', noKeyLog && noKeyLog.error.includes('resend_api_key') && (await sentCount()) === 0)

await db.exec(`insert into vault.decrypted_secrets (name, decrypted_secret) values ('resend_api_key', 're_teste_123')`)

console.log('\nPedido recebido:')
const placed = await createOrder(order({ name: 'Maria<script>alert(1)</script> Souza', fulfillment: delivery }))
const placedOrder = await orderByRef(placed.reference)
const received = await lastSent()
check('envia para a API do Resend', received && received.url === 'https://api.resend.com/emails' && received.timeout === 10000)
check('usa a chave do cofre', received.headers.Authorization === 'Bearer re_teste_123')
check('vai para o e-mail da cliente, com o remetente da loja', received.body.to[0] === 'maria@example.com' && received.body.from.includes('pedidos@bellachicboutique.com.br'))
check('assunto com o número do pedido', received.body.subject === `Recebemos seu pedido ${placed.reference}`)
check('sem campos vazios na chamada', !('reply_to' in received.body))
const receivedHtml = received.body.html
check('nome digitado não vira HTML', !receivedHtml.includes('<script') && receivedHtml.includes('Oi, Mariascriptalertscri!'))
check('mostra as peças, entrega e total', receivedHtml.includes('2x Conjunto Marrant') && receivedHtml.includes('R$ 300,00') && receivedHtml.includes('Entrega em Rua das Flores 120, Batista Campos, Belém') && receivedHtml.includes(`R$ ${312},00`))
check('avisa até quando as peças ficam separadas', /separamos suas peças até <b>\d\dh\d\d de \d\d\/\d\d<\/b>/.test(receivedHtml))
const pixCode = (receivedHtml.match(/(000201[^<]+6304[0-9A-F]{4})/) || [])[1] || ''
check('Pix copia e cola com valor do pedido e CRC válido', pixCode.includes('5406312.00') && pixCode.slice(-4) === crc16(pixCode.slice(0, -4)), pixCode)
check('Pix usa o número do pedido como identificador', pixCode.includes(placed.reference.replace(/[^A-Za-z0-9]/g, '').slice(0, 25)))
check('logo e links usam o endereço do site', receivedHtml.includes('https://bellachicboutique.com.br/icon-192.png'))
check('botão leva ao WhatsApp da loja', receivedHtml.includes('https://wa.me/5591980648559'))
saved.recebido = receivedHtml

console.log('\nEtapas do pedido:')
await asAdmin(() => db.query('select public.confirm_store_order($1)', [placedOrder.id]))
const confirmed = await lastSent()
check('confirmado manda e-mail', confirmed.body.subject === `Pedido ${placed.reference} confirmado` && confirmed.body.html.includes('Pix copia e cola'))
saved.confirmado = confirmed.body.html
await asAdmin(() => db.query(`select public.update_order_status($1, 'paid')`, [placedOrder.id]))
const paid = await lastSent()
check('pago manda e-mail sem Pix', paid.body.subject.startsWith('Pagamento recebido') && !paid.body.html.includes('Pix copia e cola'))
saved.pago = paid.body.html
await asAdmin(() => db.query(`select public.update_order_status($1, 'shipped')`, [placedOrder.id]))
const shipped = await lastSent()
check('entrega manda "saiu para entrega"', shipped.body.subject === 'Seu pedido saiu para entrega')
saved.enviado = shipped.body.html
await asAdmin(() => db.query(`select public.update_order_status($1, 'delivered')`, [placedOrder.id]))
const delivered = await lastSent()
check('entregue manda link de avaliação', delivered.body.html.includes(`https://bellachicboutique.com.br/avaliar/${placedOrder.review_token}`))
saved.entregue = delivered.body.html
check('cada etapa marcada no Resend', JSON.stringify((await sent()).slice(-5).map((row) => row.body.tags[0].value)) === JSON.stringify(['recebido', 'confirmed', 'paid', 'shipped', 'delivered']))

const before = await sentCount()
await db.query(`select public.send_order_email($1, 'delivered')`, [placedOrder.id])
check('a mesma etapa não manda e-mail duas vezes', (await sentCount()) === before)

const pickupOrder = await createOrder(order({ email: 'Ana.Retira@Example.com ', payment: 'Cartão de crédito' }))
const pickupRow = await orderByRef(pickupOrder.reference)
check('e-mail da cliente vai em minúsculas e sem espaço', (await lastSent()).body.to[0] === 'ana.retira@example.com')
check('cartão não mostra Pix', !(await lastSent()).body.html.includes('Pix copia e cola'))
await asAdmin(() => db.query('select public.confirm_store_order($1)', [pickupRow.id]))
await asAdmin(() => db.query(`select public.update_order_status($1, 'shipped')`, [pickupRow.id]))
check('retirada manda "pronto para retirar"', (await lastSent()).body.subject === 'Seu pedido está pronto para retirar')
saved.retirada = (await lastSent()).body.html

await asAdmin(() => db.query(`select public.transfer_stock('galeria-portuense', 'cidade-nova-4', '[{"productId":2,"size":"M","color":"Bege","quantity":2}]'::jsonb, null)`))
const cidadeOrder = await createOrder({ ...order({ email: 'cidade@example.com' }), unit: { name: 'Cidade Nova 4', address: 'Av. Dr. Nonato Sanova, 161A', attendant: 'Cidade Nova — atendente 1', storePhone: '5591980408420' } })
const cidadePix = ((await lastSent()).body.html.match(/(000201[^<]+6304[0-9A-F]{4})/) || [])[1] || ''
check('pedido da Cidade Nova leva o Pix da Cidade Nova', cidadePix.includes('cidadenova@example.com') && cidadePix.slice(-4) === crc16(cidadePix.slice(0, -4)) && Boolean(cidadeOrder.reference))
check('pedido da Galeria leva o Pix da Galeria', pixCode.includes('+5591980648559'))

const toCancel = await createOrder(order({ email: 'cancela@example.com' }))
const toCancelId = (await orderByRef(toCancel.reference)).id
await asAdmin(() => db.query('select public.cancel_store_order($1, $2)', [toCancelId, 'A cliente pediu <b>outra cor</b>']))
const cancelled = await lastSent()
check('cancelado manda e-mail com o motivo escapado', cancelled.body.subject === `Pedido ${toCancel.reference} cancelado` && cancelled.body.html.includes('A cliente pediu &lt;b&gt;outra cor&lt;/b&gt;'))
saved.cancelado = cancelled.body.html

const stale = await createOrder(order({ email: 'parado@example.com' }))
await db.query(`update public.store_orders set created_at = now() - interval '72 hours' where reference = $1`, [stale.reference])
await asAdmin(() => db.query('select public.release_expired_reservations()'))
check('pedido cancelado sozinho também avisa a cliente', (await orderByRef(stale.reference)).status === 'cancelled' && (await lastSent()).body.to[0] === 'parado@example.com')

console.log('\nQuando não manda:')
let count = await sentCount()
await createOrder(order({ email: '' }))
check('pedido sem e-mail não manda nada', (await sentCount()) === count)
await asAdmin(() => db.query('select public.register_store_sale($1::jsonb)', [JSON.stringify({ unitName: 'Galeria Portuense', payment: 'Pix', items: [{ productId: 1, size: 'U', color: 'Rosa', quantity: 1 }] })]))
check('venda no balcão não manda e-mail', (await sentCount()) === count)
await db.exec(`set test.fail_http = 'on'`)
const offline = await createOrder(order({ email: 'offline@example.com' }))
await db.exec(`set test.fail_http = 'off'`)
check('Resend fora do ar não impede o pedido', Boolean(await orderByRef(offline.reference)) && (await sentCount()) === count)
check('erro de envio fica no histórico', (await one(`select l.error from public.email_log l join public.store_orders o on o.id = l.order_id where o.reference = $1`, [offline.reference])).error.includes('rede fora do ar'))
await asAdmin(() => db.query(`update public.store_settings set order_emails_enabled = false where id = 1`))
await createOrder(order({ email: 'desligado@example.com' }))
check('desligar no painel para os envios', (await sentCount()) === count)
await asAdmin(() => db.query(`update public.store_settings set order_emails_enabled = true, email_reply_to = 'bellachicboutique12@gmail.com' where id = 1`))
await createOrder(order({ email: 'resposta@example.com' }))
check('responder para vai no e-mail', (await lastSent()).body.reply_to === 'bellachicboutique12@gmail.com')

console.log('\nPainel e segurança:')
await expectError('visitante não lê o histórico de e-mails', () => asAnon(() => db.query('select * from public.email_log')), 'permission denied')
check('cliente logada não vê o histórico', (await asCustomer(() => rows('select * from public.email_log'))).length === 0)
await expectError('visitante não monta e-mail', () => asAnon(() => db.query(`select public.send_order_email($1, 'paid')`, [placedOrder.id])), 'permission denied')
await expectError('cliente não monta e-mail', () => asCustomer(() => db.query(`select public.send_order_email($1, 'paid')`, [placedOrder.id])), 'permission denied')
await expectError('visitante não lê conteúdo de e-mail', () => asAnon(() => db.query(`select public.order_email_content(o, 'paid') from public.store_orders o limit 1`)), 'permission denied')
await expectError('visitante não manda e-mail de teste', () => asAnon(() => db.query(`select public.send_test_order_email('a@b.com')`)), 'permission denied')
await expectError('cliente não manda e-mail de teste', () => asCustomer(() => db.query(`select public.send_test_order_email('a@b.com')`)), 'not authorized')
await expectError('cliente não vê os últimos envios', () => asCustomer(() => db.query('select * from public.recent_order_emails(10)')), 'not authorized')
await db.query(`insert into net._http_response (id, status_code, content) select request_id, 200, '{"id":"x"}' from public.email_log where request_id is not null`)
const recent = await asAdmin(() => rows('select * from public.recent_order_emails(50)'))
check('administradora vê os últimos envios com a resposta', recent.length >= 10 && recent.some((row) => row.status_code === 200) && recent.some((row) => row.error))
count = await sentCount()
await asAdmin(() => db.query(`select public.send_test_order_email('dona@example.com')`))
const test = await lastSent()
check('e-mail de teste sai para a administradora', (await sentCount()) === count + 1 && test.body.to[0] === 'dona@example.com' && test.body.subject.startsWith('[Teste]'))
saved.teste = test.body.html

if (outputDir) {
  mkdirSync(outputDir, { recursive: true })
  for (const [name, html] of Object.entries(saved)) writeFileSync(join(outputDir, `${name}.html`), html)
  console.log(`\nE-mails gerados salvos em ${outputDir}`)
}

console.log(`\n${passed} verificações ok, ${failures.length} com problema.`)
if (failures.length) {
  console.log('Falharam:\n- ' + failures.join('\n- '))
  process.exit(1)
}
