import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import {
  getConsent,
  initAnalytics,
  isAnalyticsConfigured,
  onConsentChange,
  setConsent,
  trackPageView
} from '../../services/analytics'

const Banner = styled.div`
  position: fixed;
  z-index: 1200;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 760px;
  margin: 0 auto;
  padding: 16px 18px;
  border: 1px solid #f4c3cc;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(167, 47, 72, .16);
  color: #604a4e;
  font-size: 13px;
  line-height: 1.5;
  p { flex: 1; }
  a { color: #a72f48; text-decoration: underline; }
  .actions { display: flex; gap: 8px; flex-shrink: 0; }
  button { padding: 9px 16px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .accept { background: #c2405b; color: #fff; }
  .accept:hover { background: #a72f48; }
  .decline { border: 1px solid #ead8d9; background: #fff; color: #684b50; }
  .decline:hover { background: #fde9eb; }
  button:focus-visible { outline: 2px solid #c2405b; outline-offset: 2px; }
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    font-size: 12px;
    .actions button { flex: 1; }
  }
`

/** Envia a visualização de página ao Analytics a cada troca de rota (o site é de página única). */
export const AnalyticsTracker = () => {
  const location = useLocation()

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    // Aguarda o título da página ser atualizado antes de registrar.
    const timer = window.setTimeout(() => trackPageView(location.pathname), 50)
    return () => window.clearTimeout(timer)
  }, [location.pathname])

  return null
}

const CookieConsent = () => {
  const location = useLocation()
  const [choice, setChoice] = useState(getConsent)

  useEffect(() => onConsentChange(() => setChoice(getConsent())), [])

  if (!isAnalyticsConfigured() || choice !== null || location.pathname.startsWith('/admin')) return null

  return (
    <Banner role="region" aria-label="Aviso de cookies">
      <p>
        Usamos cookies do Google Analytics para entender como o site é usado e melhorar sua experiência.
        Você pode aceitar ou recusar. <Link to="/privacidade">Saiba mais</Link>.
      </p>
      <div className="actions">
        <button type="button" className="decline" onClick={() => setConsent('denied')}>Recusar</button>
        <button type="button" className="accept" onClick={() => setConsent('granted')}>Aceitar</button>
      </div>
    </Banner>
  )
}

export default CookieConsent
