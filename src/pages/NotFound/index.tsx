import { useEffect } from 'react'
import styled from 'styled-components'
import { colors, fonts } from '../../styles/tokens'
import { storeConfig } from '../../config/store'
import { createWhatsAppUrl } from '../../services/whatsapp'

const Box = styled.main`
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  padding: 40px 16px;
  background: ${colors.blushSoft};
  text-align: center;
  .eyebrow { color: ${colors.gold}; font-size: 12px; font-weight: 600; letter-spacing: 2.4px; text-transform: uppercase; }
  h1 { color: ${colors.plum}; font: 400 clamp(30px, 5vw, 42px)/1.15 ${fonts.serif}; }
  p { max-width: 420px; color: ${colors.muted}; font-size: 15px; line-height: 1.6; }
  .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 8px; }
  a { min-height: 46px; display: inline-flex; align-items: center; padding: 0 22px; border-radius: 999px; font: 600 14px ${fonts.sans}; }
  .primary { background: ${colors.rose}; color: ${colors.white}; }
  .primary:hover { background: ${colors.roseDark}; }
  .secondary { border: 1px solid ${colors.lineStrong}; background: ${colors.white}; color: ${colors.plum}; }
`

/** Endereço que não existe: antes abria a vitrine como se fosse a página inicial. */
const NotFound = () => {
  useEffect(() => {
    document.title = `Página não encontrada | ${storeConfig.name}`
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.appendChild(robots)
    return () => { robots.remove() }
  }, [])

  return (
    <Box>
      <span className="eyebrow">{storeConfig.name}</span>
      <h1>Página não encontrada</h1>
      <p>O link pode estar errado ou a peça saiu do catálogo. Veja as novidades na vitrine ou fale com a gente.</p>
      <div className="actions">
        <a className="primary" href="/#catalogo">Ver o catálogo</a>
        <a className="secondary" href={createWhatsAppUrl('Olá! Estava procurando uma peça no site.', storeConfig.whatsappContacts[0].number)} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
      </div>
    </Box>
  )
}

export default NotFound
