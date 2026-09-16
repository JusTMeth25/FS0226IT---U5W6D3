import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface Props {
  getText: () => string
  label?: string
  showLabel?: boolean
}

export function CopyButton({ getText, label = 'Copia', showLabel = false }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText())
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard not available (e.g. insecure context): nothing to do
    }
  }

  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' is-copied' : ''}`}
      onClick={copy}
      aria-label={copied ? 'Copiato' : label}
      title={copied ? 'Copiato!' : label}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {showLabel && <span>{copied ? 'Copiato' : label}</span>}
    </button>
  )
}
