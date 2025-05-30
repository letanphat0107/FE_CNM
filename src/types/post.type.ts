export type Post = {
  postId: number
  content: string
  createdAt: string
  updatedAt: string | null
  privacy: string
  createdBy: User
  attachments: Attachment[]
  likedUsers: User[]
  comments: Comment[]
  isSaved?: boolean // Thêm trường này để theo dõi trạng thái save
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

// For list shared posts
export type PostShare = {
  shareId: number
  sharedBy: User
  sharedAt: string // ISO datetime string
}
