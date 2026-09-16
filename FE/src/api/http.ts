import type { ConversationDetail, ConversationSummary, Info, Usage } from './types'

export const NETWORK_ERROR = 'Impossibile contattare il server. Verifica che il backend sia avviato.'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.'
}

/** Builds a readable error from a failed response (the backend always sends { message }). */
export async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json()
    if (body && typeof body.message === 'string') {
      return new ApiError(body.message, response.status)
    }
  } catch {
    // Not JSON: usually the Vite proxy answering because the backend is down
  }
  if (response.status >= 500) {
    return new ApiError(NETWORK_ERROR, response.status)
  }
  return new ApiError(`Errore inatteso (${response.status}).`, response.status)
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(NETWORK_ERROR, 0)
  }
  if (!response.ok) {
    throw await toApiError(response)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export const api = {
  info: () => request<Info>('GET', '/info'),
  listConversations: () => request<ConversationSummary[]>('GET', '/conversations'),
  createConversation: () => request<ConversationSummary>('POST', '/conversations'),
  getConversation: (id: string) => request<ConversationDetail>('GET', `/conversations/${id}`),
  renameConversation: (id: string, title: string) =>
    request<ConversationSummary>('PATCH', `/conversations/${id}`, { title }),
  deleteConversation: (id: string) => request<void>('DELETE', `/conversations/${id}`),
  getUsage: (id: string) => request<Usage>('GET', `/conversations/${id}/usage`),
}
