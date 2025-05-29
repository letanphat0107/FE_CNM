export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'MESSAGE'
  | 'MENTION'
  | 'GROUP'
  | 'SYSTEM'
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'POST_SHARE'
  | 'POST_COMMENT_REPLY'
  

export interface NotificationResponse {
  content: Notification[]
  totalPages: number
  totalElements: number
}

export interface Notification {
  id: string
  title: string
  body: string
  senderId: string
  receiverId: string
  type: NotificationType
  read: boolean
  createdAt: string
}
