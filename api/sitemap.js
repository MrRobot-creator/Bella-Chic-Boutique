/*
 * Função da Vercel para o /sitemap.xml.
 *
 * Monta a lista de páginas na hora, a partir das peças ativas no Supabase.
 * Assim, toda peça cadastrada no /admin entra no sitemap sem precisar
 * publicar o site de novo. A Vercel guarda a resposta por 1 hora.
 *
 * Se o Supabase não responder, devolve o sitemap só com as páginas fixas.
 */

const SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || ''
const SITE_URL = (process.env.REACT_APP_SITE_URL || '').replace(/\/+$/, '')

const slugify = (value) => String(value)
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[char]))

const fetchProducts = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return []
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/catalog_products?is_available=eq.true&select=id,name,updated_at&order=id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: AbortSignal.timeout(8000) }
  )
  if (!response.ok) return []
  const rows = await response.json()
  return Array.isArray(rows) ? rows : []
}

/** Gera o XML do sitemap. `products` são linhas de catalog_products (id, name, updated_at). */
const buildSitemap = (origin, products, today) => {
  const pages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    ...products.map((row) => ({
      loc: `/produto/${row.id}-${slugify(row.name)}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: String(row.updated_at || '').slice(0, 10)
    })),
    { loc: '/termos-e-condicoes', priority: '0.3', changefreq: 'yearly' },
    { loc: '/privacidade', priority: '0.3', changefreq: 'yearly' }
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url>
    <loc>${escapeXml(origin + page.loc)}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>
`
}

const handler = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const origin = SITE_URL || `${protocol}://${host}`

  let products = []
  try {
    products = await fetchProducts()
  } catch {
    // Sem o Supabase, o sitemap sai só com as páginas fixas.
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.end(buildSitemap(origin, products, new Date().toISOString().slice(0, 10)))
}

module.exports = handler
module.exports.buildSitemap = buildSitemap
