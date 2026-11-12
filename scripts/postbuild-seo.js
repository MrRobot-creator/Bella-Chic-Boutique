/*
 * Roda automaticamente depois de `npm run build` (script "postbuild").
 *
 * 1. Troca __SITE_URL__ no build/index.html pelo endereço real do site,
 *    para a prévia do link (Open Graph) funcionar no WhatsApp e no Instagram.
 * 2. Gera build/robots.txt. O sitemap.xml é montado na hora por api/sitemap.js.
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
  'Disallow: /avaliar/',
  siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ''
].filter(Boolean).join('\n') + '\n'
fs.writeFileSync(path.join(buildDir, 'robots.txt'), robots)

if (siteUrl) {
  console.log(`[seo] Prévia de link e robots.txt gerados para ${siteUrl}`)
} else {
  console.warn('[seo] REACT_APP_SITE_URL não definido: a prévia de link (Open Graph) fica incompleta.')
  console.warn('[seo] Defina REACT_APP_SITE_URL=https://seudominio.com.br na hospedagem e publique de novo.')
}
