import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import './Composer.css'

const MAX_LENGTH = 8000
const COUNTER_FROM = 6000
const MAX_HEIGHT = 220

interface Props {
  /** Resolves false when the message was not accepted: the text is put back */
  onSend: (text: string) => Promise<boolean> | boolean
  onStop?: () => void
  /** Agent is answering: the send button becomes a stop button */
  streaming?: boolean
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function Composer({ onSend, onStop, streaming = false, disabled = false, placeholder, autoFocus }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`
  }, [text])

  const trimmed = text.trim()
  const canSend = !disabled && !streaming && trimmed.length > 0 && text.length <= MAX_LENGTH

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!canSend) return
    setText('')
    const accepted = await onSend(trimmed)
    if (!accepted) {
      setText((current) => current || trimmed)
    }
    textareaRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form className={`composer${disabled ? ' is-disabled' : ''}`} onSubmit={submit}>
      <textarea
        ref={textareaRef}
        className="composer__input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Scrivi un messaggio a Nova…'}
        rows={1}
        maxLength={MAX_LENGTH}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label="Messaggio"
      />
      <div className="composer__footer">
        <span className="composer__hint">
          <kbd>Invio</kbd> per inviare · <kbd>Shift</kbd>+<kbd>Invio</kbd> per andare a capo
        </span>
        {text.length >= COUNTER_FROM && (
          <span className={`composer__counter${text.length >= MAX_LENGTH ? ' is-full' : ''}`}>
            {text.length}/{MAX_LENGTH}
          </span>
        )}
        {streaming ? (
          <button type="button" className="composer__button composer__button--stop" onClick={onStop} aria-label="Interrompi risposta" title="Interrompi">
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button type="submit" className="composer__button" disabled={!canSend} aria-label="Invia messaggio" title="Invia">
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </form>
  )
}
