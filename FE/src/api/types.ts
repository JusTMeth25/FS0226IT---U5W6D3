export type Role = 'USER' | 'ASSISTANT'

export interface ConversationSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: string
  /** Total tokens of the call that produced this answer (assistant only) */
  tokens: number | null
}

export interface ConversationDetail {
  conversation: ConversationSummary
  messages: Message[]
}

export interface Usage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  calls: number
}

export interface Info {
  model: string
  reasoningEnabled: boolean
  historyMaxMessages: number
  aiConfigured: boolean
}

export interface DoneEvent {
  message: Message
  usage: {
    model: string
    promptTokens: number | null
    completionTokens: number | null
    totalTokens: number | null
  }
}
