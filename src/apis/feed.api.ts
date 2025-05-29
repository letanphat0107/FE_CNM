import { de } from 'date-fns/locale'
import { PagingPost, Post } from 'src/types/post.type'
import { SuccessResponse } from 'src/types/utils.type'
import http from 'src/utils/http'

// Feed
export const URL_POST_NEW_FEED = 'ola-chat/api/posts'
export const URL_GET_FEED_BY_ID = 'ola-chat/api/posts/1'
export const URL_GET_MY_FEED = 'ola-chat/api/posts'
export const URL_DELETE_FEED = 'ola-chat/api/posts'
export const URL_UPDATE_FEED = 'ola-chat/api/posts' //body newFiles, filesToDelete, content
export const URL_SHARE_FEED = 'ola-chat/api/posts' // body content , privacy
export const URL_UPDATE_PRIVACY = 'ola-chat/api/posts/1/privacy' // body privacy
export const URL_GET_LIST_SHARED_FEED = 'ola-chat/api/posts/8/shares'

// Interact with Feed
export const URL_LIKE_FEED = 'ola-chat/api/posts/3/like'
export const URL_UNLIKE_FEED = 'ola-chat/api/posts/3/like'
export const URL_GET_LIST_USER_LIKED = 'ola-chat/api/posts/3/likes'

// Comment
export const URL_REPLY_FEED = 'ola-chat/api/posts/15/comments'
export const URL_REPLY_COMMENT = 'ola-chat/api/posts/comments/7/replies'
export const URL_GET_LIST_COMMENT = 'ola-chat/api/posts/3/comments/hierarchy'
export const URL_DELETE_COMMENT = 'ola-chat/api/posts/comments/7'
export const URL_UPDATE_COMMENT = 'ola-chat/api/posts/comments/6'

// Media uploaded
export const URL_GET_MEDIA = 'ola-chat/api/media/user?userId=1356e1b3-3217-47ee-b28f-feeaeb42942e'
export const URL_DELETE_MEDIA = 'ola-chat/api/media/1'

// For home page
export const URL_GET_HOME_FEED = 'ola-chat/api/posts/feed'

// Posts of user: Stalk someone's posts
export const URL_GET_USER_POSTS = 'ola-chat/api/posts/user/1356e1b3-3217-47ee-b28f-feeaeb42942e/posts'

// Search
export const URL_SEARCH_FEED = 'ola-chat/api/posts/search'

// Favorite feed
export const URL_FAVORITE_FEED = 'ola-chat/api/posts/favorites'
export const URL_ADD_FAVORITE_FEED = 'ola-chat/api/posts/8/favorite'
export const URL_REMOVE_FAVORITE_FEED = 'ola-chat/api/posts/9/favorite'

const feedApi = {
  postNewFeed(body: FormData) {
    return http.post<SuccessResponse<Post>>(URL_POST_NEW_FEED, body, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  getMyFeed(params: { page: number; size: number }) {
    return http.get<SuccessResponse<PagingPost>>(URL_GET_MY_FEED, { params })
  },
  deleteFeed(postId: number) {
    return http.delete<SuccessResponse<Post>>(`${URL_DELETE_FEED}/${postId}`)
  },
  updateFeed(postId: number, body: FormData) {
    return http.put<SuccessResponse<Post>>(`${URL_UPDATE_FEED}/${postId}`, body, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
    shareFeed(postId: number, body: { content: string; privacy: 'PUBLIC' | 'PRIVATE' | 'FRIENDS' }) {
    return http.post<SuccessResponse<Post>>(`${URL_SHARE_FEED}/${postId}/share`, body)
  }
}

export default feedApi
