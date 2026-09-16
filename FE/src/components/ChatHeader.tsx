import { Brain, Coins, Cpu, KeyRound, Menu, PanelLeftOpen, ServerCrash } from 'lucide-react'
import type { Usage } from '../api/types'
import { useConversations } from '../context/conversations'
import { useLayout } from '../context/layout'
import { formatNumber, shortModel } from '../utils/format'
import './ChatHeader.css'

interface Props {
  title: string
  usage?: Usage | null
}

export function ChatHeader({ title, usage }: Props) {
  const { sidebarCollapsed, toggleSidebar, openMobileSidebar } = useLayout()
  const { info, backendDown } = useConversations()

  return (
    <>
      <header className="chat-header">
        <button className="icon-btn only-mobile" onClick={openMobileSidebar} aria-label="Apri menu">
          <Menu size={19} />
        </button>
        {sidebarCollapsed && (
          <button className="icon-btn only-desktop" onClick={toggleSidebar} aria-label="Mostra barra laterale" title="Mostra barra laterale">
            <PanelLeftOpen size={18} />
          </button>
        )}

        <h1 className="chat-header__title">{title}</h1>

        <div className="chat-header__chips">
          {usage && usage.calls > 0 && (
            <span
              className="chip"
              title={`Prompt: ${formatNumber(usage.promptTokens)} · Risposte: ${formatNumber(usage.completionTokens)} · Chiamate: ${usage.calls}`}
            >
              <Coins size={14} />
              {formatNumber(usage.totalTokens)}
              <span className="chip__unit">token</span>
            </span>
          )}
          {info && (
            <span
              className="chip chip--model"
              title={`Modello: ${info.model} · il contesto include gli ultimi ${info.historyMaxMessages} messaggi`}
            >
              <Cpu size={14} />
              <span className="chip__model-name">{shortModel(info.model)}</span>
              {info.reasoningEnabled && (
                <span className="chip__badge">
                  <Brain size={11} />
                  reasoning
                </span>
              )}
            </span>
          )}
        </div>
      </header>

      {backendDown ? (
        <div className="banner banner--error" role="alert">
          <ServerCrash size={16} />
          Il backend non risponde. Avvia Spring Boot sulla porta 8080: riprovo in automatico.
        </div>
      ) : (
        info &&
        !info.aiConfigured && (
          <div className="banner banner--warn" role="alert">
            <KeyRound size={16} />
            Chiave OpenRouter o modello non configurati sul server: puoi navigare le chat, ma Nova non potrà rispondere.
          </div>
        )
      )}
    </>
  )
}
