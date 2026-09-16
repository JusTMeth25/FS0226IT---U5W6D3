import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { MessageSquareOff, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { ChatHeader } from '../components/ChatHeader'
import { Composer } from '../components/Composer'
import { MessageList } from '../components/MessageList'
import { NovaOrb } from '../components/NovaOrb'
import { useConversations } from '../context/conversations'
import { useChat } from '../hooks/useChat'
import './ChatPage.css'

interface LocationState {
  pendingMessage?: string
}

export function ConversationPage({ id }: { id: string }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { conversations, refresh, backendDown } = useConversations()

  // First message typed on the "new chat" page, passed through navigation state
  const [pendingMessage] = useState(() => (location.state as LocationState | null)?.pendingMessage ?? null)
  const pendingSentRef = useRef(false)

  const chat = useChat(id, { skipInitialLoad: pendingMessage !== null, onConversationChanged: refresh })
  const { messages, phase, error, loadError, usage, send, regenerate, stop, dismissError } = chat

  useEffect(() => {
    if (!pendingMessage || pendingSentRef.current) return
    pendingSentRef.current = true
    // Clear the navigation state so a page reload does not send the message again
    navigate(location.pathname, { replace: true, state: null })
    void send(pendingMessage)
  }, [pendingMessage, navigate, location.pathname, send])

  const title = conversations.find((c) => c.id === id)?.title ?? 'Nuova chat'

  useEffect(() => {
    document.title = `${title} · Nova`
    return () => {
      document.title = 'Nova'
    }
  }, [title])

  const busy = phase === 'thinking' || phase === 'streaming'
  const last = messages.at(-1)
  const unanswered = phase === 'ready' && last?.role === 'USER' && !last.pending

  if (loadError) {
    return (
      <div className="chat">
        <ChatHeader title="Chat non disponibile" />
        <div className="state-card">
          <MessageSquareOff size={36} />
          <h2>{loadError.status === 404 ? 'Questa chat non esiste più' : 'Impossibile aprire la chat'}</h2>
          <p>{loadError.message}</p>
          <Link to="/" className="button-primary">
            Inizia una nuova chat
          </Link>
        </div>
      </div>
    )
  }

  const footer = error ? (
    <div className="error-card" role="alert">
      <TriangleAlert size={18} className="error-card__icon" />
      <div className="error-card__body">
        <strong>Nova non è riuscita a rispondere</strong>
        <span>{error}</span>
      </div>
      {unanswered && (
        <button className="button-ghost" onClick={() => void regenerate()}>
          <RotateCcw size={14} />
          Riprova
        </button>
      )}
      <button className="icon-btn" onClick={dismissError} aria-label="Chiudi errore">
        <X size={16} />
      </button>
    </div>
  ) : unanswered ? (
    <div className="regen">
      <span>Questo messaggio non ha ancora una risposta.</span>
      <button className="button-ghost" onClick={() => void regenerate()}>
        <RotateCcw size={14} />
        Genera risposta
      </button>
    </div>
  ) : null

  return (
    <div className="chat">
      <ChatHeader title={title} usage={usage} />

      {phase === 'loading' ? (
        <div className="thread-loading" aria-label="Caricamento chat">
          {[62, 40, 75].map((width, index) => (
            <div key={index} className={`skeleton-msg${index % 2 === 0 ? ' is-right' : ''}`} style={{ width: `${width}%` }} />
          ))}
        </div>
      ) : messages.length === 0 && !footer ? (
        <div className="state-card state-card--soft">
          <NovaOrb size="lg" />
          <h2>Chat vuota</h2>
          <p>Scrivi il primo messaggio per iniziare.</p>
        </div>
      ) : (
        <MessageList messages={messages} footer={footer} />
      )}

      <div className="chat__bottom">
        <Composer
          onSend={send}
          onStop={stop}
          streaming={busy}
          disabled={phase === 'loading' || backendDown}
          autoFocus
        />
        <p className="chat__disclaimer">Nova può sbagliare. Verifica le informazioni importanti.</p>
      </div>
    </div>
  )
}
