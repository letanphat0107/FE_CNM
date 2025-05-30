import { Conversation, Message, Participant } from 'src/types/message.type'
import http from 'src/utils/http'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import config from 'src/constants/config'

import { SuccessResponse } from 'src/types/utils.type'

export const BASE_URL = 'ola-chat/api/conversations'
export const URL_DELETE_MESSAGE = 'ola-chat/api/messages'

let stompClient: Client | null = null

const messageAPI = {
  getConversations(userId?: string) {
    return http.get<SuccessResponse<Conversation[]>>(`${BASE_URL}?userId=${userId}`)
  },

  getParticipants(conversationId: string) {
    return http.get<Participant[]>(`${BASE_URL}/${conversationId}/users`)
  },
  getMessages(conversationId: string, params: { page?: number; size?: number; sortDirection?: string } = {}) {
    const { page = 0, size = 10, sortDirection = 'desc' } = params
    return http.get<Message[]>(
      `${BASE_URL}/${conversationId}/messages`,
      { params: { page, size, sortDirection } }
    )
  },

  connectToWebSocket(conversationIds: string[], onMessageReceived: (conversationId: string, message: any) => void) {
    // Đóng kết nối cũ nếu có
    if (stompClient && stompClient.active) {
      stompClient.deactivate()
    }

    const socket = new SockJS(`${config.baseUrl}ola-chat/ws`)
    stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log(str)
      },
      reconnectDelay: 5000
    })

    stompClient.onConnect = () => {
      console.log('Kết nối WebSocket thành công')
      conversationIds.forEach((conversationId) => {
        stompClient?.subscribe(`/user/${conversationId}/private`, (message) => {
          const newMsg = JSON.parse(message.body)
          console.log('📥 Nhận tin nhắn mới:', newMsg)

          // Gọi callback để component xử lý
          onMessageReceived(conversationId, newMsg)
        })
      })
    }

    stompClient.activate()
    return stompClient
  },

  disconnectWebSocket() {
    if (stompClient && stompClient.active) {
      stompClient.deactivate()
      stompClient = null
    }
  },

  // sendMessage(conversationId: string, message: any) {
  //   if (stompClient && stompClient.active) {
  //     stompClient.publish({
  //       destination: `/app/chat/${conversationId}`,
  //       body: JSON.stringify(message)
  //     })
  //     return true
  //   } else {
  //     console.error('WebSocket không được kết nối')
  //     return false
  //   }
  // },

  // Lấy Client hiện tại (nếu cần sử dụng bên ngoài)
  getStompClient() {
    return stompClient
  },
  deleteMessage( messageId: string) {
    return http.delete<SuccessResponse<null>>(`${URL_DELETE_MESSAGE}/${messageId}/hiddenForUser`)
  }
}

export default messageAPI
