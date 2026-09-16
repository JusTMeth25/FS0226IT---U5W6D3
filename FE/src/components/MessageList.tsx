import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDown } from 'lucide-react'
import type { UiMessage } from '../hooks/useChat'
import { MessageItem } from './MessageItem'
import './MessageList.css'

const STICK_THRESHOLD_PX = 120

interface Props {
  messages: UiMessage[]
  footer?: ReactNode
}

/** Scrollable thread that follows new content while the user is at the bottom. */
export function MessageList({ messages, footer }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const [showJump, setShowJump] = useState(false)

  function handleScroll() {
    const element = scrollRef.current
    if (!element) return
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight
    stickRef.current = distance < STICK_THRESHOLD_PX
    setShowJump(!stickRef.current)
  }

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (element && stickRef.current) {
      element.scrollTop = element.scrollHeight
    }
  }, [messages, footer])

  function jumpToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className="thread-wrap">
      <div className="thread" ref={scrollRef} onScroll={handleScroll}>
        <div className="thread__inner">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          {footer}
        </div>
      </div>
      <button
        className={`jump${showJump ? ' is-visible' : ''}`}
        onClick={jumpToBottom}
        aria-label="Vai in fondo"
        tabIndex={showJump ? 0 : -1}
      >
        <ArrowDown size={16} />
      </button>
    </div>
  )
}
