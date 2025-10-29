import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './pages/App.jsx'
import { I18nProvider } from './i18n/i18nContext.jsx'
import { AlertProvider } from './contexts/AlertContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <AlertProvider>
        <App />
      </AlertProvider>
    </I18nProvider>
  </StrictMode>,
)
