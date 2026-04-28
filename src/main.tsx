import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

const swBase = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${swBase}sw.js`, { scope: swBase })
  })
}
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { VisitorProvider } from './context/VisitorContext'
import { SiteGate } from './components/SiteGate'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <SiteGate>
            <AuthProvider>
              <CartProvider>
                <VisitorProvider>
                  <App />
                </VisitorProvider>
              </CartProvider>
            </AuthProvider>
          </SiteGate>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
