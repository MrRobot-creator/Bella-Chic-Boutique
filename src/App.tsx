import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import GlobalStyle from './styles/global'
import { theme } from './styles/theme'
import Home from './pages/Home'
import Admin from './pages/Admin'
import LegalPage from './pages/Legal'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="/termos-e-condicoes" element={<LegalPage />} />
          <Route path="/privacidade" element={<LegalPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
