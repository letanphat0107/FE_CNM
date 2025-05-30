import { useContext, useEffect, useState } from 'react'
import Conversations from './containers/conversations'
import ChatBox from './containers/mainChat/chatBox'
import { UserDTO } from 'src/types/user.type'
import { Conversation } from 'src/types/message.type'
import { AppContext } from 'src/contexts/app.context'

const Messages = () => {
  const {profile, setSelectedConversation} = useContext(AppContext)

  // Xử lý khi người dùng nhấn vào một cuộc trò chuyện
  const handleSelectConversation = (conversationId: Conversation) => {
    setSelectedConversation(conversationId)
  }

  return (
    <div className='d-flex flex-row w-100 h-100 bg-white' style={{            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
            borderRadius: '8px'}}>
      <Conversations onPress={handleSelectConversation} />
      <ChatBox currentUserId={profile?.userId || '' } />
    </div>
  )
}

export default Messages
