export type Post = {
  postId: number
  createdBy: User
  content: string
  attachments: Attachment[]
  privacy: 'PUBLIC' | 'PRIVATE' | 'FRIENDS' // enum tùy backend
  createdAt: string
  updatedAt: string | null
  likedUsers: User[]
  comments: Comment[]
  originalPostId: number | null
  originalPost: Post | null // đệ quy nếu là post share
}

export type Attachment = {
  userId: string
  mediaId: number
  fileUrl: string
  fileType: string
  originalFileName: string
  publicId: string
}

export type User = {
  userId: string
  username: string
  displayName: string
  avatar: string
}

export type Comment = {
  commentId: number
  content: string
  createdAt: string
  updatedAt: string | null
  commentedBy: User
  replies: Comment[] // hỗ trợ lồng nhau
}

export type PagingPost = {
  createdBy: User
  totalPages: number
  currentPage: number
  pageSize: number
  posts: Post[]
}
