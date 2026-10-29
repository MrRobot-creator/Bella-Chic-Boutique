/*
 * Google Analytics 4, carregado somente depois que a visitante aceita os cookies.
 * Sem REACT_APP_GA_ID, nada é carregado e o aviso de cookies não aparece.
 */

type ConsentChoice = 'granted' | 'denied'
type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }

export const GA_ID = (process.env.REACT_APP_GA_ID || '').trim()
const CONSENT_KEY = 'bella_chic_cookie_consent'
const CONSENT_EVENT = 'bella-chic-consent-change'

let loaded = false

export const isAnalyticsConfigured = () => /^G-[A-Z0-9]+$/i.test(GA_ID)

export const getConsent = (): ConsentChoice | null => {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

const loadAnalytics = () => {
  if (!isAnalyticsConfigured()) return
  ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = false
  if (loaded) return
  loaded = true
  const w = window as GtagWindow
  w.gtag = function gtagShim() {
    // O gtag.js precisa receber o objeto "arguments" original.
    // eslint-disable-next-line prefer-rest-params
    (w.dataLayer = w.dataLayer || []).push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(script)
}

export const setConsent = (choice: ConsentChoice) => {
  try {
    localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    // Sem armazenamento, a escolha vale só para esta visita.
  }
  if (choice === 'granted') {
    loadAnalytics()
    trackPageView(window.location.pathname)
  } else if (loaded) {
    // Desliga o envio de dados do Google Analytics nesta visita.
    ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true
  }
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export const clearConsent = () => {
  try {
    localStorage.removeItem(CONSENT_KEY)
  } catch {
    // ignora
  }
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export const onConsentChange = (listener: () => void) => {
  window.addEventListener(CONSENT_EVENT, listener)
  return () => window.removeEventListener(CONSENT_EVENT, listener)
}

/** Chamado ao abrir o site: carrega o Analytics se a visitante já aceitou antes. */
export const initAnalytics = () => {
  if (getConsent() === 'granted') loadAnalytics()
}

const canTrack = () => loaded && getConsent() === 'granted'

export const trackPageView = (path: string) => {
  if (!canTrack() || path.startsWith('/admin')) return
  ;(window as GtagWindow).gtag?.('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title
  })
}

export const trackEvent = (name: string, params: Record<string, unknown> = {}) => {
  if (!canTrack() || window.location.pathname.startsWith('/admin')) return
  ;(window as GtagWindow).gtag?.('event', name, params)
}
