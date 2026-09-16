import { createContext, useContext } from 'react'
import type { ConversationSummary, Info } from '../api/types'

export interface ConversationsValue {
  conversations: ConversationSummary[]
  loading: boolean
  /** Agent configuration exposed by the backend (never contains the API key) */
  info: Info | null
  backendDown: boolean
  refresh: () => Promise<void>
  create: () => Promise<ConversationSummary>
  rename: (id: string, title: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const ConversationsContext = createContext<ConversationsValue | null>(null)

export function useConversations(): ConversationsValue {
  const value = useContext(ConversationsContext)
  if (!value) throw new Error('useConversations must be used inside ConversationsProvider')
  return value
}
