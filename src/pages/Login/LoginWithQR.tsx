import React, { useEffect, useState, useContext } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'
import axios from 'axios'
import { AppContext } from 'src/contexts/app.context'
import { useNavigate } from 'react-router-dom'
import { setProfileToLS, setAccessTokenToLS, setRefreshTokenToLS } from 'src/utils/auth'
import { toast } from 'react-toastify'
import config from 'src/constants/config'
import { PauseIcon } from '@giphy/react-components'

export default function LoginWithQR() {
  // State để quản lý QR code và thông tin người dùng
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any | null>(null)
  const [stompClient, setStompClient] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Context và navigation
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()

  // Tạo mã QR mới
  const generateQrCode = async () => {
    try {
      // Bắt đầu loading và reset dữ liệu
      setLoading(true)
      setUserInfo(null)

      // Ngắt kết nối WebSocket trước đó nếu có
      if (stompClient && stompClient.connected) {
        console.log('Disconnecting previous WebSocket connection')
        stompClient.disconnect()
      }

      console.log('Creating QR code session...')
      // Gọi API tạo QR code session
      const res = await axios.post(`${config.baseUrl || 'http://localhost:8081'}/ola-chat/auth/qr-login/create`, {
        deviceName: 'Web Browser',
        deviceId: `web_${Math.random().toString(36).substring(2, 9)}`,
        locationHint: window.navigator.language || 'Unknown'
      })

      // Kiểm tra và log kết quả
      console.log('API Response:', res.data)

      // Lưu URL QR code từ response
      const url = res.data.data
      if (!url) {
        throw new Error('Invalid response: missing QR URL')
      }

      setQrUrl(url)
      console.log('QR code URL:', url)

      // Trích xuất sessionId từ URL
      try {
        const urlObj = new URL(url)
        const sid = urlObj.searchParams.get('sessionId')
        if (!sid) throw new Error('No sessionId in QR URL')

        setSessionId(sid)
        console.log('Session ID:', sid)
      } catch (e) {
        console.error('Error extracting sessionId:', e)
        throw new Error('Failed to process QR URL')
      }
    } catch (err) {
      console.error('Failed to create QR session:', err)
      toast.error('Không thể tạo mã QR. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  // Khởi tạo QR code khi component mount
  useEffect(() => {
    generateQrCode()

    // Cleanup khi unmount
    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect()
      }
    }
  }, [])

  // Thiết lập kết nối WebSocket khi có sessionId
  useEffect(() => {
    if (!sessionId) return

    console.log('Setting up WebSocket connection for session:', sessionId)

    // Tạo kết nối SockJS và STOMP client
    const socket = new SockJS(`${config.baseUrl || 'http://localhost:8081'}/ola-chat/ws`)
    const client = Stomp.over(socket)

    // Tắt debug log của STOMP
    client.debug = () => {}

    // Kết nối đến server
    client.connect(
      {},
      // Success callback
      () => {
        console.log('WebSocket connected successfully')

        // Subscribe đến channel riêng cho session này
        client.subscribe(`/user/queue/qr-login/${sessionId}`, (message) => {
          try {
            const payload = JSON.parse(message.body)
            console.log('Received WebSocket message:', payload)
            setAccessTokenToLS(payload.accessToken)
            setRefreshTokenToLS(payload.refreshToken)
            setIsAuthenticated(true)

            localStorage.setItem('accessToken', payload.accessToken)
            localStorage.setItem('refreshToken', payload.refreshToken)
            localStorage.setItem('profile', JSON.stringify(payload.user))

            navigate('/')

            if (payload.type === 'USER_INFO_PREVIEW') {
              // Hiển thị thông tin người dùng đang quét QR
              console.log('User scanning QR:', payload.user)
              setUserInfo(payload.user)
            } else if (payload.type === 'QR_LOGIN_SUCCESS') {
              // Xử lý đăng nhập thành công
              console.log('Login successful!', payload)

              // Trích xuất token từ payload
              // QUAN TRỌNG: Đây là phần đã sửa để đảm bảo nhận đúng cấu trúc token
              const token = payload.token
              const user = payload.user

              if (!token || !user) {
                console.error('Missing authentication data:', { token, user })
                toast.error('Thông tin đăng nhập không hợp lệ')
                return
              }

              console.log('Authentication data:', { token, user })

              // Lưu token và thông tin người dùng
              setAccessTokenToLS(token.accessToken)
              if (token.refreshToken) {
                setRefreshTokenToLS(token.refreshToken)
              }
              setProfileToLS(user)

              // Cập nhật trạng thái đăng nhập
              setIsAuthenticated(true)
              setProfile(user)

              // Thông báo thành công
              toast.success('Đăng nhập thành công!')

              // Chuyển hướng đến trang chủ
              setTimeout(() => navigate('/'), 1000)
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error)
          }
        })
      },
      // Error callback
      (error: any) => {
        console.error('WebSocket connection error:', error)
        toast.error('Lỗi kết nối. Vui lòng thử lại sau.')
      }
    )

    // Lưu STOMP client để có thể disconnect sau này
    setStompClient(client)

    // Cleanup khi effect chạy lại hoặc component unmount
    return () => {
      if (client && client.connected) {
        console.log('Disconnecting WebSocket')
        client.disconnect()
      }
    }
  }, [sessionId, setIsAuthenticated, setProfile, navigate])

  return (
    <div className='container py-5'>
      <div className='row justify-content-center'>
        <div className='col-md-6'>
          <div className='card shadow'>
            <div className='card-body text-center p-5'>
              <h2 className='mb-4'>Đăng nhập bằng QR Code</h2>

              {qrUrl ? (
                <div className='mb-4'>
                  <QRCodeSVG value={qrUrl} size={256} level='H' includeMargin={true} className='border p-2 rounded' />
                  <p className='mt-3'>Quét QR bằng ứng dụng Ola Chat để đăng nhập</p>
                </div>
              ) : (
                <div className='d-flex justify-content-center align-items-center' style={{ height: '256px' }}>
                  <div className='spinner-border text-primary' role='status'>
                    <span className='visually-hidden'>Đang tạo QR...</span>
                  </div>
                </div>
              )}

              <button className='btn btn-primary' onClick={generateQrCode} disabled={loading}>
                {loading ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                    Đang tạo...
                  </>
                ) : (
                  'Tạo QR mới'
                )}
              </button>

              {userInfo && (
                <div className='mt-4 p-3 border rounded bg-light'>
                  <h5>Người dùng đang quét:</h5>
                  <div className='d-flex align-items-center justify-content-center'>
                    <img
                      src={userInfo.avatar}
                      alt='avatar'
                      className='rounded-circle me-3'
                      style={{ width: 64, height: 64 }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/64'
                      }}
                    />
                    <div className='text-start'>
                      <p className='mb-0'>
                        <strong>{userInfo.displayName || userInfo.name}</strong>
                      </p>
                      <small className='text-muted'>@{userInfo.username}</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className='card-footer text-center'>
              <p className='mb-0'>
                Hoặc <a href='/login'>đăng nhập</a> bằng phương thức thông thường
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
