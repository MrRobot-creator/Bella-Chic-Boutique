/*
 * Roda automaticamente depois de `npm run build` (script "postbuild").
 *
 * 1. Troca __SITE_URL__ no build/index.html pelo endereço real do site,
 *    para a prévia do link (Open Graph) funcionar no WhatsApp e no Instagram.
 * 2. Gera build/robots.txt e build/sitemap.xml.
 *
 * O endereço vem de REACT_APP_SITE_URL (variável de ambiente ou .env.production/.env.local).
 * Sem ela, usa o domínio que a Vercel ou a Netlify informam durante o build.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const buildDir = path.resolve(root, process.env.BUILD_PATH || 'build')

const readEnvFile = (file) => {
  try {
    return fs.readFileSync(path.join(root, file), 'utf8')
      .split(/\r?\n/)
      .reduce((env, line) => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
        return env
      }, {})
  } catch {
    return {}
  }
}

const fileEnv = { ...readEnvFile('.env'), ...readEnvFile('.env.local'), ...readEnvFile('.env.production'), ...readEnvFile('.env.production.local') }
const withProtocol = (host) => (host ? (/^https?:\/\//.test(host) ? host : `https://${host}`) : '')

const siteUrl = withProtocol(
  process.env.REACT_APP_SITE_URL ||
  fileEnv.REACT_APP_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.URL ||
  ''
).replace(/\/+$/, '')

const indexPath = path.join(buildDir, 'index.html')
if (!fs.existsSync(indexPath)) {
  console.error(`[seo] ${indexPath} não encontrado. Rode "npm run build" primeiro.`)
  process.exit(1)
}

fs.writeFileSync(indexPath, fs.readFileSync(indexPath, 'utf8').split('__SITE_URL__').join(siteUrl))

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /admin',
  siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ''
].filter(Boolean).join('\n') + '\n'
fs.writeFileSync(path.join(buildDir, 'robots.txt'), robots)

if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10)
  const pages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/termos-e-condicoes', priority: '0.3', changefreq: 'yearly' },
    { loc: '/privacidade', priority: '0.3', changefreq: 'yearly' }
  ]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>
`
  fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), sitemap)
  console.log(`[seo] Prévia de link, robots.txt e sitemap.xml gerados para ${siteUrl}`)
} else {
  console.warn('[seo] REACT_APP_SITE_URL não definido: a prévia de link (Open Graph) e o sitemap.xml ficam incompletos.')
  console.warn('[seo] Defina REACT_APP_SITE_URL=https://seudominio.com.br na hospedagem e publique de novo.')
}
