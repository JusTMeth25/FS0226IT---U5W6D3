import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError, errorMessage } from '../api/http'
import { streamChat } from '../api/stream'
import type { Message, Usage } from '../api/types'

export type ChatPhase = 'loading' | 'ready' | 'thinking' | 'streaming'

export interface UiMessage extends Message {
  /** User message shown before the backend confirms it was saved */
  pending?: boolean
  /** Assistant answer still arriving */
  streaming?: boolean
  /** Shown while waiting, e.g. "model overloaded, retrying" */
  statusNote?: string
  /** Stream stopped by the user */
  interrupted?: boolean
}

interface Options {
  /** True for a brand-new chat: there is nothing to load */
  skipInitialLoad: boolean
  /** Called when the conversation changes on the server (title, order in the list) */
  onConversationChanged: () => void
}

export function useChat(conversationId: string, { skipInitialLoad, onConversationChanged }: Options) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [phase, setPhase] = useState<ChatPhase>(skipInitialLoad ? 'ready' : 'loading')
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<ApiError | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const onChangedRef = useRef(onConversationChanged)

  useEffect(() => {
    onChangedRef.current = onConversationChanged
  })

  const loadUsage = useCallback(
    () =>
      api.getUsage(conversationId).then(setUsage, () => {
        // Usage is decorative: ignore failures
      }),
    [conversationId],
  )

  useEffect(() => {
    void loadUsage()
    if (skipInitialLoad) return
    let cancelled = false
    api
      .getConversation(conversationId)
      .then((detail) => {
        if (!cancelled) setMessages(detail.messages)
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof ApiError ? e : new ApiError(errorMessage(e), 0))
      })
      .finally(() => {
        if (!cancelled) setPhase('ready')
      })
    return () => {
      cancelled = true
    }
  }, [conversationId, skipInitialLoad, loadUsage])

  /** Runs one streaming exchange; resolves false when the user message was not saved. */
  const run = useCallback(
    async (path: string, body: unknown, userContent: string | null): Promise<boolean> => {
      const controller = new AbortController()
      abortRef.current = controller
      const stamp = Date.now()
      const tempUserId = `temp-user-${stamp}`
      const draftId = `draft-${stamp}`
      const now = new Date().toISOString()
      let userSaved = userContent === null

      setError(null)
      setPhase('thinking')
      setMessages((current) => [
        ...current,
        ...(userContent === null
          ? []
          : [{ id: tempUserId, role: 'USER' as const, content: userContent, createdAt: now, tokens: null, pending: true }]),
        { id: draftId, role: 'ASSISTANT', content: '', createdAt: now, tokens: null, streaming: true },
      ])

      const replace = (id: string, update: (message: UiMessage) => UiMessage | null) =>
        setMessages((current) =>
          current.flatMap((message) => {
            if (message.id !== id) return [message]
            const next = update(message)
            return next ? [next] : []
          }),
        )

      try {
        await streamChat(
          path,
          body,
          {
            onUser: (saved) => {
              userSaved = true
              replace(tempUserId, () => saved)
              onChangedRef.current()
            },
            onStatus: (note) => replace(draftId, (draft) => ({ ...draft, statusNote: note })),
            onDelta: (text) => {
              setPhase('streaming')
              replace(draftId, (draft) => ({ ...draft, content: draft.content + text }))
            },
            onDone: ({ message }) => replace(draftId, () => message),
            onError: (message) => {
              replace(draftId, () => null)
              setError(message)
            },
          },
          controller.signal,
        )
      } catch (e) {
        if (controller.signal.aborted) {
          replace(draftId, (draft) => (draft.content ? { ...draft, streaming: false, interrupted: true } : null))
        } else {
          replace(draftId, () => null)
          if (!userSaved) replace(tempUserId, () => null)
          setError(errorMessage(e))
        }
      } finally {
        abortRef.current = null
        setPhase('ready')
        onChangedRef.current()
        void loadUsage()
      }
      return userSaved
    },
    [loadUsage],
  )

  const send = useCallback(
    (content: string) => run(`/conversations/${conversationId}/messages`, { content }, content),
    [conversationId, run],
  )

  const regenerate = useCallback(
    () => run(`/conversations/${conversationId}/regenerate`, undefined, null),
    [conversationId, run],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const dismissError = useCallback(() => setError(null), [])

  return { messages, phase, error, loadError, usage, send, regenerate, stop, dismissError }
}
