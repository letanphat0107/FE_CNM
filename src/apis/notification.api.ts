import { register } from "module"
import { Notification, NotificationResponse } from "src/types/notifycation.type"
import { SuccessResponse } from "src/types/utils.type"
import http from "src/utils/http"

export const URL_SU_FCM = "ola-chat/api/notifications/register-device" // body: {     "userId": "1114",     "token" : "2224",     "deviceId": "3334" }
export const URL_GET_NOTIFICATION = "ola-chat/api/notifications"
export const URL_MASK_READ_NOTIFICATION = "ola-chat/api/notifications"

const notificationAPI = {
    registerFCMToken(userId: string, token: string, deviceId: string) {
        return http.post(URL_SU_FCM, {
            userId,
            token,
            deviceId
        })
    },
    getNotifycations(page: number = 0, size: number = 10, sort: string = "asc") {
        return http.get<SuccessResponse<NotificationResponse>>(URL_GET_NOTIFICATION, {
            params: {
                page,
                size,
                sort
            }
        })
    },
    markAsRead(notificationId: string) {
        return http.put<SuccessResponse<Notification>>(
            `${URL_MASK_READ_NOTIFICATION}/${notificationId}/read`
        )
    }
}

export default notificationAPI