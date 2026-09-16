import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Code2, Compass, Lightbulb, PenLine } from 'lucide-react'
import { errorMessage } from '../api/http'
import { ChatHeader } from '../components/ChatHeader'
import { Composer } from '../components/Composer'
import { NovaOrb } from '../components/NovaOrb'
import { useConversations } from '../context/conversations'
import { useToast } from '../context/toast'
import './ChatPage.css'

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: 'Spiegami un concetto',
    prompt: 'Spiegami come fa un chatbot a "ricordare" la conversazione, come se avessi 12 anni.',
  },
  {
    icon: Code2,
    title: 'Scrivi del codice',
    prompt: 'Scrivi un custom hook React in TypeScript che applica il debounce a un valore, con un esempio d’uso.',
  },
  {
    icon: PenLine,
    title: 'Aiutami a scrivere',
    prompt: 'Scrivi una breve email cordiale per chiedere un giorno di ferie al mio responsabile.',
  },
  {
    icon: Compass,
    title: 'Pianifica qualcosa',
    prompt: 'Organizzami un weekend di due giorni a Torino con un budget contenuto.',
  },
]

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Nottambulo?'
  if (hour < 13) return 'Buongiorno'
  if (hour < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

export function NewChatPage() {
  const { create, backendDown } = useConversations()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [hello] = useState(greeting)

  async function start(text: string): Promise<boolean> {
    if (creating) return false
    setCreating(true)
    try {
      const conversation = await create()
      // The conversation page sends the first message as soon as it mounts
      navigate(`/c/${conversation.id}`, { state: { pendingMessage: text } })
      return true
    } catch (error) {
      notify(errorMessage(error), 'error')
      setCreating(false)
      return false
    }
  }

  return (
    <div className="chat">
      <ChatHeader title="Nuova chat" />
      <div className="welcome">
        <div className="welcome__hero">
          <NovaOrb size="lg" active={creating} />
          <h2 className="welcome__title">
            {hello}, <span className="gradient-text">sono Nova</span>
          </h2>
          <p className="welcome__subtitle">Chiedimi qualsiasi cosa: idee, codice, testi, piani. Ricordo tutta la conversazione.</p>
        </div>

        <div className="welcome__composer">
          <Composer onSend={start} disabled={creating || backendDown} autoFocus placeholder="Da dove iniziamo?" />
        </div>

        <div className="suggestions">
          {SUGGESTIONS.map(({ icon: Icon, title, prompt }, index) => (
            <button
              key={title}
              className="suggestion"
              style={{ animationDelay: `${120 + index * 70}ms` }}
              onClick={() => void start(prompt)}
              disabled={creating || backendDown}
            >
              <span className="suggestion__icon">
                <Icon size={18} />
              </span>
              <span className="suggestion__title">{title}</span>
              <span className="suggestion__prompt">{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
