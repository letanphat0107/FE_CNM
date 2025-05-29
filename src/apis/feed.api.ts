import { Post } from "src/types/post.type";
import { SuccessResponse } from "src/types/utils.type";
import http from "src/utils/http";

// Feed
export const URL_POST_NEW_FEED = '/ola-chat/api/posts';
export const URL_GET_FEED = 'ola-chat/api/posts/1';
export const URL_GET_MY_FEED = 'ola-chat/api/posts?page=0&size=10';
export const URL_DELETE_FEED = "ola-chat/api/posts/13";
export const URL_UPDATE_FEED = "ola-chat/api/posts/3"; //body newFiles, filesToDelete
export const URL_SHARE_FEED = "ola-chat/api/posts/1/share"; // body content , privacy
export const URL_UPDATE_PRIVACY = "ola-chat/api/posts/1/privacy"; // body privacy
export const URL_GET_LIST_SHARED_FEED = "ola-chat/api/posts/8/shares";

// Interact with Feed
export const URL_LIKE_FEED = "ola-chat/api/posts/3/like";
export const URL_UNLIKE_FEED = "ola-chat/api/posts/3/like";
export const URL_GET_LIST_USER_LIKED = "ola-chat/api/posts/3/likes";

// Comment
export const URL_REPLY_FEED = "ola-chat/api/posts/15/comments";
export const URL_REPLY_COMMENT = "ola-chat/api/posts/comments/7/replies";
export const URL_GET_LIST_COMMENT = "ola-chat/api/posts/3/comments/hierarchy";
export const URL_DELETE_COMMENT = "ola-chat/api/posts/comments/7";
export const URL_UPDATE_COMMENT = "ola-chat/api/posts/comments/6";

// Media uploaded
export const URL_GET_MEDIA = "ola-chat/api/media/user?userId=1356e1b3-3217-47ee-b28f-feeaeb42942e";
export const URL_DELETE_MEDIA= "ola-chat/api/media/1";

// For home page
export const URL_GET_HOME_FEED = "ola-chat/api/posts/feed";

// Posts of user: Stalk someone's posts
export const URL_GET_USER_POSTS = "ola-chat/api/posts/user/1356e1b3-3217-47ee-b28f-feeaeb42942e/posts";

// Search
export const URL_SEARCH_FEED = "ola-chat/api/posts/search";

// Favorite feed
export const URL_FAVORITE_FEED = "ola-chat/api/posts/favorites";
export const URL_ADD_FAVORITE_FEED = "ola-chat/api/posts/8/favorite";
export const URL_REMOVE_FAVORITE_FEED = "ola-chat/api/posts/9/favorite";

const feedApi = {
    postNewFeed(body: FormData) {
        return http.post<SuccessResponse<Post>>(URL_POST_NEW_FEED, body, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}

export default feedApi;