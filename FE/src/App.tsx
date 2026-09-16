import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import { Sidebar } from './components/Sidebar'
import { LayoutContext } from './context/layout'
import { ChatPage } from './pages/ChatPage'
import './App.css'

const COLLAPSED_KEY = 'nova.sidebarCollapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora__blob aurora__blob--violet" />
      <span className="aurora__blob aurora__blob--cyan" />
      <span className="aurora__blob aurora__blob--pink" />
      <span className="aurora__grid" />
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    setCollapsed((current) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, String(!current))
      } catch {
        // Storage not available: the choice just is not remembered
      }
      return !current
    })
  }, [])

  // Ctrl/Cmd + Shift + O: new chat (same shortcut as ChatGPT)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        navigate('/')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const layout = useMemo(
    () => ({ sidebarCollapsed: collapsed, toggleSidebar, openMobileSidebar: () => setMobileOpen(true) }),
    [collapsed, toggleSidebar],
  )

  return (
    <LayoutContext value={layout}>
      <Aurora />
      <div className="app">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapsed={toggleSidebar}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <main className="app__main">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/c/:id" element={<ChatPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </LayoutContext>
  )
}
