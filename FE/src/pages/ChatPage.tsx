import { useParams } from 'react-router'
import { ConversationPage } from './ConversationPage'
import { NewChatPage } from './NewChatPage'

export function ChatPage() {
  const { id } = useParams()
  // key: each conversation gets fresh state when switching chats
  return id ? <ConversationPage key={id} id={id} /> : <NewChatPage />
}
