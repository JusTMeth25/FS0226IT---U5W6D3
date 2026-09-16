import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from '../api/http'
import type { ConversationSummary, Info } from '../api/types'
import { ConversationsContext } from './conversations'

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<Info | null>(null)
  const [backendDown, setBackendDown] = useState(false)

  const refresh = useCallback(
    () =>
      Promise.all([api.listConversations(), api.info()]).then(
        ([list, currentInfo]) => {
          setConversations(list)
          setInfo(currentInfo)
          setBackendDown(false)
          setLoading(false)
        },
        (error: unknown) => {
          setBackendDown(!(error instanceof ApiError) || error.status === 0 || error.status >= 500)
          setLoading(false)
        },
      ),
    [],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Retry every few seconds while the backend is unreachable
  useEffect(() => {
    if (!backendDown) return
    const timer = setInterval(() => void refresh(), 5000)
    return () => clearInterval(timer)
  }, [backendDown, refresh])

  const create = useCallback(async () => {
    const conversation = await api.createConversation()
    setConversations((current) => [conversation, ...current])
    return conversation
  }, [])

  const rename = useCallback(async (id: string, title: string) => {
    const updated = await api.renameConversation(id, title)
    setConversations((current) => current.map((c) => (c.id === id ? updated : c)))
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.deleteConversation(id)
    setConversations((current) => current.filter((c) => c.id !== id))
  }, [])

  const value = useMemo(
    () => ({ conversations, loading, info, backendDown, refresh, create, rename, remove }),
    [conversations, loading, info, backendDown, refresh, create, rename, remove],
  )

  return <ConversationsContext value={value}>{children}</ConversationsContext>
}
