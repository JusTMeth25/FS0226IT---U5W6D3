import { useMemo, useRef, useState, type FormEvent } from 'react'
import { NavLink, useMatch, useNavigate } from 'react-router'
import { Check, MessageSquareDashed, PanelLeftClose, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { errorMessage } from '../api/http'
import type { ConversationSummary } from '../api/types'
import { useConversations } from '../context/conversations'
import { useToast } from '../context/toast'
import { DATE_GROUPS, dateGroupIndex, shortModel } from '../utils/format'
import { NovaOrb } from './NovaOrb'
import './Sidebar.css'

interface Props {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapsed: () => void
  onCloseMobile: () => void
}

type Mode = 'view' | 'rename' | 'confirm-delete'

function ConversationItem({ conversation, onNavigate }: { conversation: ConversationSummary; onNavigate: () => void }) {
  const { rename, remove } = useConversations()
  const { notify } = useToast()
  const navigate = useNavigate()
  const active = useMatch(`/c/${conversation.id}`) !== null
  const [mode, setMode] = useState<Mode>('view')
  const [draft, setDraft] = useState(conversation.title)
  // Enter, Escape and blur can all end editing: only the first one counts
  const editClosedRef = useRef(false)

  function startRename() {
    editClosedRef.current = false
    setDraft(conversation.title)
    setMode('rename')
  }

  function cancelRename() {
    editClosedRef.current = true
    setMode('view')
  }

  async function submitRename(event: FormEvent) {
    event.preventDefault()
    if (editClosedRef.current) return
    editClosedRef.current = true
    const title = draft.trim()
    setMode('view')
    if (!title || title === conversation.title) return
    try {
      await rename(conversation.id, title)
    } catch (error) {
      notify(errorMessage(error), 'error')
    }
  }

  async function confirmDelete() {
    try {
      await remove(conversation.id)
      notify('Chat eliminata', 'success')
      if (active) navigate('/')
    } catch (error) {
      notify(errorMessage(error), 'error')
      setMode('view')
    }
  }

  if (mode === 'rename') {
    return (
      <form className="conv conv--editing" onSubmit={submitRename}>
        <input
          className="conv__input"
          value={draft}
          maxLength={100}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onBlur={submitRename}
          onKeyDown={(event) => event.key === 'Escape' && cancelRename()}
          aria-label="Nuovo titolo"
        />
      </form>
    )
  }

  return (
    <div className={`conv${active ? ' is-active' : ''}${mode === 'confirm-delete' ? ' is-confirming' : ''}`}>
      <NavLink to={`/c/${conversation.id}`} className="conv__link" onClick={onNavigate} title={conversation.title}>
        {mode === 'confirm-delete' ? 'Eliminare questa chat?' : conversation.title}
      </NavLink>
      <div className="conv__actions">
        {mode === 'confirm-delete' ? (
          <>
            <button className="conv__action conv__action--danger" onClick={confirmDelete} aria-label="Conferma eliminazione">
              <Check size={15} />
            </button>
            <button className="conv__action" onClick={() => setMode('view')} aria-label="Annulla">
              <X size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              className="conv__action"
              onClick={startRename}
              aria-label="Rinomina chat"
              title="Rinomina"
            >
              <Pencil size={14} />
            </button>
            <button className="conv__action" onClick={() => setMode('confirm-delete')} aria-label="Elimina chat" title="Elimina">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function Sidebar({ collapsed, mobileOpen, onToggleCollapsed, onCloseMobile }: Props) {
  const { conversations, loading, info, backendDown } = useConversations()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const [now] = useState(() => new Date())

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const buckets: ConversationSummary[][] = DATE_GROUPS.map(() => [])
    for (const conversation of conversations) {
      if (needle && !conversation.title.toLowerCase().includes(needle)) continue
      buckets[dateGroupIndex(conversation.updatedAt, now)].push(conversation)
    }
    return buckets.map((items, index) => ({ label: DATE_GROUPS[index], items })).filter((group) => group.items.length)
  }, [conversations, query, now])

  const status = backendDown
    ? { tone: 'down', label: 'Backend non raggiungibile' }
    : info && !info.aiConfigured
      ? { tone: 'warn', label: 'AI non configurata' }
      : { tone: 'ok', label: info ? shortModel(info.model) : 'Connessione…' }

  return (
    <>
      <div className={`sidebar-backdrop${mobileOpen ? ' is-visible' : ''}`} onClick={onCloseMobile} />
      <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
        <div className="sidebar__top">
          <NavLink to="/" className="brand" onClick={onCloseMobile}>
            <NovaOrb size="sm" />
            <span className="brand__name">Nova</span>
          </NavLink>
          <button className="icon-btn sidebar__collapse" onClick={onToggleCollapsed} aria-label="Nascondi barra laterale" title="Nascondi barra laterale">
            <PanelLeftClose size={18} />
          </button>
          <button className="icon-btn sidebar__close" onClick={onCloseMobile} aria-label="Chiudi menu">
            <X size={18} />
          </button>
        </div>

        <button
          className="new-chat"
          onClick={() => {
            navigate('/')
            onCloseMobile()
          }}
          title="Nuova chat (Ctrl+Shift+O)"
        >
          <Plus size={18} />
          <span>Nuova chat</span>
          <kbd>Ctrl ⇧ O</kbd>
        </button>

        <label className="search">
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca nelle chat"
            aria-label="Cerca nelle chat"
          />
        </label>

        <nav className="sidebar__list" aria-label="Conversazioni">
          {loading ? (
            <div className="sidebar__skeleton">
              {[70, 55, 80, 45, 65].map((width, index) => (
                <span key={index} style={{ width: `${width}%` }} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="sidebar__empty">
              <MessageSquareDashed size={28} />
              <p>{query ? 'Nessuna chat trovata' : 'Nessuna conversazione. Inizia a scrivere!'}</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="conv-group">
                <h2 className="conv-group__label">{group.label}</h2>
                {group.items.map((conversation) => (
                  <ConversationItem key={conversation.id} conversation={conversation} onNavigate={onCloseMobile} />
                ))}
              </section>
            ))
          )}
        </nav>

        <footer className="sidebar__footer" title={info ? `Modello: ${info.model}` : undefined}>
          <span className={`status-dot status-dot--${status.tone}`} />
          <div className="sidebar__status">
            <span className="sidebar__status-label">{status.tone === 'ok' ? 'Nova è online' : 'Attenzione'}</span>
            <span className="sidebar__status-model">{status.label}</span>
          </div>
        </footer>
      </aside>
    </>
  )
}
