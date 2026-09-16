import { ApiError, NETWORK_ERROR, toApiError } from './http'
import type { DoneEvent, Message } from './types'

export interface StreamHandlers {
  onUser?: (message: Message) => void
  onDelta: (text: string) => void
  /** Progress note while the backend retries an overloaded model */
  onStatus?: (message: string) => void
  onDone: (event: DoneEvent) => void
  onError: (message: string) => void
}

/**
 * POSTs to a backend SSE endpoint and dispatches its events.
 * EventSource only supports GET, so the stream is read by hand with fetch.
 *
 * Throws ApiError when the request is rejected before the stream starts
 * (validation, not found, backend down) and AbortError when aborted.
 */
export async function streamChat(
  path: string,
  body: unknown,
  handlers: StreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new ApiError(NETWORK_ERROR, 0)
  }
  if (!response.ok || !response.body) {
    throw await toApiError(response)
  }

  let finished = false
  const dispatch = (rawEvent: string) => {
    let event = 'message'
    const data: string[] = []
    for (const line of rawEvent.split('\n')) {
      if (!line || line.startsWith(':')) continue
      const colon = line.indexOf(':')
      const field = colon === -1 ? line : line.slice(0, colon)
      let value = colon === -1 ? '' : line.slice(colon + 1)
      if (value.startsWith(' ')) value = value.slice(1)
      if (field === 'event') event = value
      else if (field === 'data') data.push(value)
    }
    if (data.length === 0) return
    const payload = JSON.parse(data.join('\n'))
    switch (event) {
      case 'user':
        handlers.onUser?.(payload as Message)
        break
      case 'status':
        handlers.onStatus?.((payload as { message: string }).message)
        break
      case 'delta':
        handlers.onDelta((payload as { text: string }).text)
        break
      case 'done':
        finished = true
        handlers.onDone(payload as DoneEvent)
        break
      case 'error':
        finished = true
        handlers.onError((payload as { message: string }).message)
        break
    }
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer = (buffer + value).replace(/\r\n?/g, '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        dispatch(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
    }
  } catch (error) {
    if (signal.aborted) throw error
    handlers.onError('La connessione con il server si è interrotta durante la risposta.')
    return
  }
  if (buffer.trim()) dispatch(buffer)
  if (!finished) {
    handlers.onError('La connessione con il server si è interrotta durante la risposta.')
  }
}
