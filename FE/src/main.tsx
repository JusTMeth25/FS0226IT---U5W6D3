// Global styles first, so component styles can override them
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { ConversationsProvider } from './context/ConversationsProvider.tsx'
import { ToastProvider } from './context/ToastProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ConversationsProvider>
          <App />
        </ConversationsProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
