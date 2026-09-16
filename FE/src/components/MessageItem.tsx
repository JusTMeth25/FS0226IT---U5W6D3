import { memo } from 'react'
import { Coins, RefreshCw } from 'lucide-react'
import type { UiMessage } from '../hooks/useChat'
import { formatNumber, formatTime } from '../utils/format'
import { CopyButton } from './CopyButton'
import { Markdown } from './Markdown'
import { NovaOrb } from './NovaOrb'
import './MessageItem.css'

function ThinkingIndicator({ note }: { note?: string }) {
  return (
    <div className="thinking-wrap">
      <div className="thinking">
        <span className="thinking__text">Nova sta pensando</span>
        <span className="thinking__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      {note && (
        <p className="thinking__note" role="status">
          <RefreshCw size={13} />
          {note}
        </p>
      )}
    </div>
  )
}

export const MessageItem = memo(function MessageItem({ message }: { message: UiMessage }) {
  if (message.role === 'USER') {
    return (
      <div className={`msg msg--user${message.pending ? ' is-pending' : ''}`}>
        <div className="msg__bubble">{message.content}</div>
        {!message.pending && (
          <div className="msg__actions">
            <time className="msg__time">{formatTime(message.createdAt)}</time>
            <CopyButton getText={() => message.content} label="Copia messaggio" />
          </div>
        )}
      </div>
    )
  }

  const waitingFirstToken = message.streaming && !message.content

  return (
    <div className="msg msg--assistant">
      <div className="msg__avatar">
        <NovaOrb size="sm" active={message.streaming} />
      </div>
      <div className="msg__body">
        <div className="msg__meta">
          <span className="msg__name">Nova</span>
          {!message.streaming && <time className="msg__time">{formatTime(message.createdAt)}</time>}
        </div>

        {waitingFirstToken ? (
          <ThinkingIndicator note={message.statusNote} />
        ) : (
          <div className={`markdown${message.streaming ? ' is-streaming' : ''}`}>
            <Markdown content={message.content} />
          </div>
        )}

        {message.interrupted && (
          <p className="msg__note">
            Hai interrotto la risposta. Il server la completa comunque: riapri la chat per leggerla tutta.
          </p>
        )}

        {!message.streaming && message.content && (
          <div className="msg__actions">
            <CopyButton getText={() => message.content} label="Copia risposta" />
            {message.tokens != null && (
              <span className="msg__tokens" title="Token consumati da questa risposta (prompt + risposta)">
                <Coins size={12} />
                {formatNumber(message.tokens)} token
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
