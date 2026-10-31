import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import GlobalStyle from './styles/global'
import { theme } from './styles/theme'
import Home from './pages/Home'
import CookieConsent, { AnalyticsTracker } from './components/CookieConsent'

// Páginas fora da vitrine carregam só quando abertas (o site principal fica mais leve).
const Admin = lazy(() => import('./pages/Admin'))
const LegalPage = lazy(() => import('./pages/Legal'))
const ReviewPage = lazy(() => import('./pages/Review'))
const NotFound = lazy(() => import('./pages/NotFound'))

const HomeOrNotFound = () => {
  const { pathname } = useLocation()
  return pathname === '/' || pathname.startsWith('/produto/') ? <Home /> : <NotFound />
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AnalyticsTracker />
        <Suspense fallback={<p style={{ padding: 40, textAlign: 'center', color: '#7A6567' }}>Carregando...</p>}>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="/termos-e-condicoes" element={<LegalPage />} />
          <Route path="/privacidade" element={<LegalPage />} />
          <Route path="/avaliar/:token" element={<ReviewPage />} />
          {/* /produto/:id-nome abre a vitrine já com a peça aberta; uma rota só para a vitrine não recarregar ao fechar a peça */}
          <Route path="*" element={<HomeOrNotFound />} />
        </Routes>
        </Suspense>
        <CookieConsent />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
