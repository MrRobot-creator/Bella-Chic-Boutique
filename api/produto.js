/*
 * Função da Vercel para os links de peça (/produto/1-vestido-dress).
 *
 * Devolve a mesma página do site, mas com a foto, o nome e o preço da peça nas
 * tags de prévia (Open Graph) e nos dados estruturados do Google. Assim, ao
 * compartilhar o link no WhatsApp ou no Instagram aparece a peça, e o Google
 * consegue listar cada peça.
 *
 * Se algo der errado (Supabase fora do ar, peça excluída), devolve a página
 * normal do site, que abre a vitrine.
 */

const SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || ''
const SITE_URL = (process.env.REACT_APP_SITE_URL || '').replace(/\/+$/, '')

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]))

const formatPrice = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const slugify = (value) => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const productIdFromPath = (value) => {
  const match = String(value || '').match(/^\/?(?:produto\/)?(\d{1,18})(?:-[^/?#]*)?\/?$/)
  return match ? match[1] : null
}

const setMeta = (html, attribute, name, content) => {
  const pattern = new RegExp(`<meta ${attribute}="${name.replace(/[:.]/g, '\\$&')}" content="[^"]*"\\s*/?>`)
  const tag = `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `${tag}</head>`)
}

/** Troca título, descrição, prévia e dados estruturados pelos da peça. */
const renderProductHtml = (html, product, origin) => {
  const url = `${origin}/produto/${product.id}-${slugify(product.name)}`
  const stock = Array.isArray(product.variant_stock)
    ? product.variant_stock.reduce((total, variant) => total + Math.max(0, Number(variant.quantity) || 0), 0)
    : 0
  const available = product.is_available && stock > 0
  const colors = Array.isArray(product.colors) ? product.colors.length : 0
  const title = `${product.name} | Bella Chic Boutique`
  const summary = [
    `${formatPrice(product.price)} no Pix`,
    colors > 1 ? `${colors} cores` : '',
    available ? '' : 'Esgotado: avise-me quando chegar'
  ].filter(Boolean).join(' · ')
  const description = `${summary}. ${String(product.description || '').replace(/\s+/g, ' ').trim()}`.slice(0, 200)

  let page = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
  page = setMeta(page, 'name', 'description', description)
  page = setMeta(page, 'property', 'og:type', 'product')
  page = setMeta(page, 'property', 'og:title', title)
  page = setMeta(page, 'property', 'og:description', description)
  page = setMeta(page, 'property', 'og:url', url)
  page = setMeta(page, 'property', 'og:image', product.image)
  page = setMeta(page, 'property', 'og:image:alt', product.name)
  page = setMeta(page, 'name', 'twitter:title', title)
  page = setMeta(page, 'name', 'twitter:description', description)
  page = setMeta(page, 'name', 'twitter:image', product.image)
  page = page
    .replace(/<meta property="og:image:width" content="[^"]*"\s*\/?>/, '')
    .replace(/<meta property="og:image:height" content="[^"]*"\s*\/?>/, '')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${escapeHtml(url)}" />`)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image],
    description: String(product.description || '').slice(0, 500),
    category: product.category,
    brand: { '@type': 'Brand', name: 'Bella Chic Boutique' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: Number(product.price).toFixed(2),
      availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  }
  const json = JSON.stringify(structuredData).replace(/</g, '\\u003c')
  return page.replace('</head>', `<script type="application/ld+json">${json}</script></head>`)
}

const fetchProduct = async (id) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  const columns = 'id,name,description,category,price,image,colors,variant_stock,is_available'
  const response = await fetch(`${SUPABASE_URL}/rest/v1/catalog_products?id=eq.${id}&select=${columns}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  })
  if (!response.ok) return null
  const rows = await response.json()
  return Array.isArray(rows) && rows[0] ? rows[0] : null
}

const handler = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const ownOrigin = `${protocol}://${host}`
  const origin = SITE_URL || ownOrigin

  let html = ''
  try {
    const page = await fetch(`${ownOrigin}/index.html`)
    html = page.ok ? await page.text() : ''
  } catch {
    html = ''
  }

  if (!html) {
    res.statusCode = 302
    res.setHeader('Location', '/')
    res.end()
    return
  }

  try {
    const id = productIdFromPath((req.query && req.query.slug) || req.url)
    const product = id ? await fetchProduct(id) : null
    if (product && product.image) html = renderProductHtml(html, product, origin)
  } catch {
    // Sem os dados da peça, a página normal do site resolve.
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
  res.end(html)
}

module.exports = handler
module.exports.renderProductHtml = renderProductHtml
module.exports.productIdFromPath = productIdFromPath
