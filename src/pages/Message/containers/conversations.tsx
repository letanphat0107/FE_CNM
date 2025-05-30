import { useContext, useEffect, useState, useRef } from 'react'
import { Conversation, Message, Participant } from 'src/types/message.type'
import { AppContext } from 'src/contexts/app.context'
import messageAPI from 'src/apis/message.api'
import { useWebSocket } from 'src/contexts/websocket.context'

// Add the animation as a CSS-in-JS style in the component
const fadeInMoveAnimation = `
  @keyframes fadeInMove {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

interface Props {
  onPress: (conversationId: Conversation) => void
}

const Conversations = ({ onPress }: Props) => {
  const { profile, refreshConversationsFlag, selectedConversation, setSelectedConversation } = useContext(AppContext)
  const { subscribe, unsubscribe } = useWebSocket()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const selectedConversationRef = useRef(selectedConversation)
  const [unreadMap, setUnreadMap] = useState<{ [key: string]: number }>({})
  const subscriptionsRef = useRef<string[]>([])

  const sortConversationsByDate = (conversations: Conversation[]) => {
    return [...conversations].sort((a, b) => {
      const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
      const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
      return dateB - dateA
    })
  }

  async function getConversations() {
    try {
      const response = await messageAPI.getConversations(profile?.userId)
      const data = response.data.data
      const sortedData = sortConversationsByDate(data)

      setConversations(sortedData)

      setSelectedConversation(null)
      selectedConversationRef.current = null
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

  // Lấy danh sách cuộc trò chuyện từ API
  useEffect(() => {
    getConversations()
  }, [refreshConversationsFlag])

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  // Đăng ký lắng nghe tin nhắn mới cho tất cả cuộc trò chuyện
  useEffect(() => {
    if (conversations.length > 0 && profile) {
      // Hủy đăng ký các subscription cũ
      subscriptionsRef.current.forEach((id) => {
        if (id) unsubscribe(id)
      })

      subscriptionsRef.current = []

      // Đăng ký subscription mới cho mỗi cuộc trò chuyện
      conversations.forEach((conversation) => {
        const subId = subscribe(`/user/${conversation.id}/private`, (message) => {
          handleMessageReceived(conversation.id, message)
        })

        if (subId) {
          subscriptionsRef.current.push(subId)
        }
      })
    }

    return () => {
      // Hủy đăng ký khi component unmount
      subscriptionsRef.current.forEach((id) => {
        if (id) unsubscribe(id)
      })
    }
  }, [conversations, profile, subscribe, unsubscribe])

  // Xử lý khi có tin nhắn mới
  const handleMessageReceived = (conversationId: string, message: any) => {
    // Update unread count if this isn't the selected conversation
    if (conversationId !== selectedConversationRef.current?.id) {
      setUnreadMap((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1
      }))
    }

    // Update the lastMessage in conversations and resort
    setConversations((prevConversations) => {
      // First update the lastMessage for the conversation
      const updatedConversations = prevConversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              content: message.content,
              createdAt: new Date().toISOString(),
              senderId: message.senderId,
              type: message.type
            }
          }
        }
        return conv
      })

      return sortConversationsByDate(updatedConversations)
    })
  }

  const getPartner = async (conversationId: string): Promise<Participant | undefined> => {
    try {
      const res = await messageAPI.getParticipants(conversationId)
      const data = res.data
      const partner = data.find((participant) => participant.userId !== profile?.userId)
      return partner
    } catch (err) {
      console.error('Fetch participants error:', err)
      return undefined
    }
  }

  useEffect(() => {
    const fetchPartners = async () => {
      for (const conversation of conversations) {
        if (conversation.type === 'PRIVATE' && !conversation.partner) {
          const partner = await getPartner(conversation.id)
          if (partner) {
            setConversations((prev) => prev.map((conv) => (conv.id === conversation.id ? { ...conv, partner } : conv)))
          }
        }
      }
    }

    fetchPartners()
  }, [conversations])

  const handleConversationSelect = (conversation: Conversation) => {
    const con = conversations.find((conv) => conv.id === conversation.id)
    setSelectedConversation(con || null)

    // Reset số tin nhắn chưa đọc khi chọn cuộc trò chuyện
    setUnreadMap((prev) => ({
      ...prev,
      [conversation.id]: 0
    }))

    onPress(conversation)
  }

  return (
    <>
      <style>{fadeInMoveAnimation}</style>
      <div className='chat-list border-end' style={{ width: '100%', maxWidth: '268px' }}>
        <div className='d-flex justify-content-between align-items-center px-4 py-3 border-bottom'>
          <h6 className='mb-0'>Tin nhắn</h6>
          <div className='d-flex align-items-center gap-3'>
            <span className='text-muted' style={{ fontSize: '13px' }}>
              Trực tuyến
            </span>
            <button className='btn btn-link text-dark p-0'>
              <i className='fas fa-ellipsis-h'></i>
            </button>
          </div>
        </div>

        <div
          className='chat-list-content'
          style={{ textAlign: 'left', maxHeight: 'calc(100vh - 290px)', overflowY: 'auto' }}
        >
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`chat-item px-3 py-2 mb-2 rounded shadow-sm border 
    ${selectedConversation?.id === conversation.id ? 'bg-light ' : 'bg-white border-light'}
    hover:bg-[#f5f5f5]`}
              style={{
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                animation: 'fadeInMove 0.4s ease-out'
              }}
              onClick={() => handleConversationSelect(conversation)}
            >
              {/* Hiển thị avatar và tên người dùng hoặc tên nhóm */}

              <div className='d-flex align-items-start position-relative'>
                <img
                  src={
                    conversation.type === 'GROUP'
                      ? conversation.avatar ||
                        'https://png.pngtree.com/element_our/png_detail/20181021/group-avatar-icon-design-vector-png_141882.jpg'
                      : conversation.partner?.avatar ||
                        'https://res.cloudinary.com/dm5ulzy7n/image/upload/v1748307746/z6642578626786_9c3f5e5b519e59140f14558806ec7d00--dfca98f0-c6cb-46ed-b57b-e87de3e712ce.jpg'
                  }
                  alt='Avatar'
                  className='rounded-circle me-3'
                  style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                />
                <div className='flex-grow-1 overflow-hidden'>
                  <p className='mb-1 text-dark fw-semibold' style={{ fontSize: '15px' }}>
                    {conversation.type === 'GROUP'
                      ? conversation.name || 'Nhóm không tên'
                      : conversation.partner?.displayName || 'Người dùng ẩn danh'}
                  </p>
                  <p
                    className='mb-0 text-muted'
                    style={{
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '180px'
                    }}
                  >
                    {conversation.lastMessage?.content || '...'}
                  </p>
                </div>

                {/* Hiển thị badge số tin nhắn chưa đọc */}
                {unreadMap[conversation.id] > 0 && (
                  <span
                    className='badge bg-primary rounded-pill position-absolute'
                    style={{ top: '10px', right: '5px' }}
                  >
                    {unreadMap[conversation.id]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className='new-message-section border-top px-4 py-3 bg-white' style={{ position: 'sticky', bottom: 0 }}>
          <div
            className='d-flex align-items-center justify-content-center text-muted'
            style={{ fontSize: '14px', cursor: 'pointer' }}
          >
            <i className='far fa-edit me-2'></i>
            Tin nhắn mới
          </div>
        </div>
      </div>
    </>
  )
}

export default Conversations
