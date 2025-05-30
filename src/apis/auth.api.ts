import { AuthResponse } from 'src/types/auth.type'
import http from 'src/utils/http'

export const URL_LOGIN = 'ola-chat/auth/login'
export const URL_REGISTER = 'ola-chat/users'
export const URL_LOGOUT = 'ola-chat/auth/logout'
export const URL_REFRESH_TOKEN = 'ola-chat/auth/refresh'
export const URL_CREATE_QR_CODE = 'ola-chat/auth/qr-login/create' // { "deviceName": "Chrome on Windows", "deviceId": "111", "locationHint": "Hồ Chí Minh" }

const authApi = {
  registerAccount(body: { email: string; password: string }) {
    return http.post<AuthResponse>(URL_REGISTER, body)
  },
  login(body: { username: string; password: string }) {
    return http.post<AuthResponse>(URL_LOGIN, body)
  },
  logout(body: { accessToken: string; refreshToken: string }) {
    return http.post(URL_LOGOUT, body)
  }
}

export default authApi
