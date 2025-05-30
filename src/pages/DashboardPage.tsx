import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/ProfileNavigation'
import { useContext, useEffect, useState } from 'react'
import userApi from 'src/apis/user.api'
import { AppContext } from 'src/contexts/app.context'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'

import { messaging, getToken, onMessage } from '../firebase'
import { MessagePayload } from 'firebase/messaging'
import notificationAPI from 'src/apis/notification.api'

export default function DashboardPage() {
  const { profile, setProfile, refreshConversations, refreshListFriend } = useContext(AppContext)
  const [token, setToken] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const vapidKey = 'BJbxOi7Y9tXk7aRsqO4J5V2StvDH_gl91dpum7WJKciqv2XqQoEeV84KZj0gN5aO3b-9vYInXEBmRgEuDgLV_1o'

  // Lấy hoặc tạo deviceId
  useEffect(() => {
    // Kiểm tra nếu đã có deviceId trong localStorage
    let storedDeviceId = localStorage.getItem('deviceId')

    if (!storedDeviceId) {
      // Nếu chưa có, tạo mới và lưu vào localStorage
      storedDeviceId = uuidv4()
      localStorage.setItem('deviceId', storedDeviceId)
    }

    setDeviceId(storedDeviceId)
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      try {
        const res = await userApi.getProfile()
        setProfile(res.data.data)
      } catch (error) {
        toast.error('Server error')
      }
    }
    getProfile()
  }, [setProfile])

  // Đăng ký FCM token
  useEffect(() => {
    if (!profile?.userId || !deviceId) return

    const registerFCMToken = async (fcmToken: string) => {
      try {
        await notificationAPI.registerFCMToken(profile.userId, fcmToken, deviceId)
        console.log('FCM token registered successfully')
      } catch (error) {
        console.error('Error registering FCM token:', error)
      }
    }

    if (token) {
      registerFCMToken(token)
    }
  }, [token, profile?.userId, deviceId])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          // Lấy token FCM
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              interface FCMTokenError extends Error {
                code?: string
                message: string
              }

              getToken(messaging, {
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
              })
                .then((currentToken: string | null) => {
                  if (currentToken) {
                    setToken(currentToken)
                  } else {
                    console.warn('No token received.')
                  }
                })
                .catch((err: FCMTokenError) => {
                  console.error('An error occurred while retrieving token. ', err)
                })
            }
          })
        })
        .catch((err) => {
          console.error('SW registration failed:', err)
        })
      // Nhận notification khi app đang mở
      onMessage(messaging, (payload: MessagePayload) => {
        console.log('Message received: ', payload)
        // Hiển thị thông báo toast khi nhận được tin nhắn
        if (payload.notification) {
          const { title, body } = payload.notification

          if (payload.data) {
            const { type } = payload.data
            if (type === 'FRIEND_REQUEST') {
              toast.info(
                <div>
                  {title && <strong>{title}</strong>}
                  {body && <p className='mb-0'>{body}</p>}
                </div>,
                {
                  autoClose: 5000,
                  position: 'top-right'
                }
              )
              refreshConversations()
              refreshListFriend()
            } else if (type === 'GROUP') {
              refreshConversations()
            }
          }
        }
      })
    }
  }, [])

  return (
    <div className='d-flex flex-column vh-100'>
      <Header />
      <div className='d-flex flex-grow-1 bac' style={{ backgroundColor: '#f8f8f8', padding: '30px 48px' }}>
        <Sidebar />
        <main
          className='flex-grow-1 ms-5 me-0'
          style={{
            height: 'calc(100vh - 120px)',
            marginRight: '48px'
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
