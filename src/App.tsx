import React, { useContext, useEffect, useState } from 'react'
import './App.css'

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import useRouteElements from './useRouteElements'
import { AppContext } from './contexts/app.context'
import { LocalStorageEventTarget } from './utils/auth'
import { HelmetProvider } from 'react-helmet-async'
import ErrorBoundary from './components/common/ErrorBoundary'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { messaging } from './firebase'
import { getToken, onMessage, isSupported } from 'firebase/messaging'
import axios from 'axios'
import config from './constants/config'

/**
 * Khi url thay đổi thì các component nào dùng các hook như
 * useRoutes, useParmas, useSearchParams,...
 * sẽ bị re-render.
 * Ví dụ component `App` dưới đây bị re-render khi mà url thay đổi
 * vì dùng `useRouteElements` (đây là customhook của `useRoutes`)
 */

function App() {
  const routeElements = useRouteElements()
  const { reset, isAuthenticated, profile } = useContext(AppContext)
  const [isRegistered, setIsRegistered] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<string>('')
  
  // Reset listener
  useEffect(() => {
    LocalStorageEventTarget.addEventListener('clearLS', reset)
    return () => {
      LocalStorageEventTarget.removeEventListener('clearLS', reset)
    }
  }, [reset])

  // Initialize notification permission state
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Handle FCM setup and registration when user is authenticated
  useEffect(() => {
    const registerDeviceToken = async () => {
      try {
        // Check if browser supports notifications and Firebase messaging
        if (!('Notification' in window)) {
          console.log('This browser does not support notifications')
          return
        }
        
        const isMessagingSupported = await isSupported()
        if (!isMessagingSupported || !messaging) {
          console.log('Firebase messaging is not supported in this browser')
          return
        }

        // Request notification permission
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        console.log('Notification permission:', permission)

        if (permission !== 'granted') {
          console.log('Notification permission denied')
          return
        }

        // Get FCM token
        const vapidKey =  'BJbxOi7Y9tXk7aRsqO4J5V2StvDH_gl91dpum7WJKciqv2XqQoEeV84KZj0gN5aO3b-9vYInXEBmRgEuDgLV_1o'
        const token = await getToken(messaging, {
          vapidKey
        })
        
        if (!token) {
          console.log('No registration token available')
          return
        }

        console.log('FCM Token:', token)

        // Check if token has been sent already
        const lastToken = localStorage.getItem('lastFCMToken')
        const userId = profile?.userId
        
        if (!userId) {
          console.log('User is not authenticated')
          return
        }

        // Only send token if it's new or for a different user
        const lastUserId = localStorage.getItem('lastFCMUserId')
        if (token !== lastToken || userId !== lastUserId) {
          // Device information for better identification
          const deviceInfo = {
            browser: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }

          // Register device token with backend
          const response = await axios.post(`${config.baseUrl}/ola-chat/api/notifications/register-device`, {
            userId,
            token,
            deviceId: `web_${btoa(navigator.userAgent).slice(0, 16)}`
          })

          console.log('Device registration successful:', response.data)
          localStorage.setItem('lastFCMToken', token)
          localStorage.setItem('lastFCMUserId', userId)
          setIsRegistered(true)
          
          // Show toast notification
          toast.success('Thông báo đẩy đã được kích hoạt')
        } else {
          console.log('Token already registered for this user')
          setIsRegistered(true)
        }
      } catch (error) {
        console.error('Error registering device for notifications:', error)
        toast.error('Không thể đăng ký thông báo')
      }
    }

    // Set up notification handling
    const setupNotifications = async () => {
      if (!messaging) return

      // Handle foreground messages
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Received foreground message:', payload)
        
        // Show toast notification for foreground messages
        const notification = payload.notification
        if (notification?.title && notification?.body) {
          toast(
            <div>
              <div className="fw-bold">{notification.title}</div>
              <div>{notification.body}</div>
            </div>,
            { 
              icon: () => <div>{notification.icon || '🔔'}</div>,
              autoClose: 5000,
              onClick: () => {
                // Handle notification click - navigate to relevant page
                if (payload.data?.url) {
                  window.location.href = payload.data.url
                }
              }
            }
          )
        }
      })

      return unsubscribe
    }

    // Only register if user is authenticated and not registered yet
    if (isAuthenticated && profile?.userId && !isRegistered) {
      registerDeviceToken()
    }

    // Setup notifications handler
    let unsubscribe: any
    if (isAuthenticated && notificationPermission === 'granted') {
      setupNotifications().then(unsub => {
        if (unsub) unsubscribe = unsub
      })
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [isAuthenticated, profile, isRegistered, notificationPermission])

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ToastContainer 
          position='top-right' 
          autoClose={2000} 
          hideProgressBar={false} 
          theme='light' 
        />
        {routeElements}
      </ErrorBoundary>
    </HelmetProvider>
  )
}

export default App