import React, { useEffect, useState, useContext } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'
import axios from 'axios'
import { AppContext } from 'src/contexts/app.context'
import { useNavigate } from 'react-router-dom'
import { setProfileToLS, setAccessTokenToLS, setRefreshTokenToLS } from 'src/utils/auth'
import config from 'src/constants/config'
import { set } from 'lodash'

export default function LoginWithQR() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any | null>(null)
  const [stompClient, setStompClient] = useState<any | null>(null)
  const [expiryTime, setExpiryTime] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()

  const getBrowserInfo = () => {
    const ua = navigator.userAgent
    let browserName = 'Unknown'
    if (ua.indexOf('Chrome') > -1) browserName = 'Chrome'
    else if (ua.indexOf('Safari') > -1) browserName = 'Safari'
    else if (ua.indexOf('Firefox') > -1) browserName = 'Firefox'
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) browserName = 'Internet Explorer'
    else if (ua.indexOf('Edge') > -1) browserName = 'Edge'
    return { browserName, deviceName: navigator.platform || 'Unknown Device' }
  }

  const getLocationHint = () => {
    const timezoneOffset = new Date().getTimezoneOffset() / -60
    return `GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`
  }

  const generateQrCode = async () => {
    try {
      setLoading(true)
      setIsExpired(false)
      setUserInfo(null)
      if (stompClient && stompClient.connected) stompClient.disconnect()

      const { browserName, deviceName } = getBrowserInfo()
      const locationHint = getLocationHint()
      const deviceId = localStorage.getItem('device_id') || `web_${Math.random().toString(36).substring(2, 15)}`
      if (!localStorage.getItem('device_id')) localStorage.setItem('device_id', deviceId)

      const res = await axios.post(`${config.baseUrl}/ola-chat/auth/qr-login/create`, {
        deviceName: `${browserName} on ${deviceName}`,
        deviceId,
        locationHint
      })

      const data = res.data.data
      setQrUrl(data)

      const urlObj = new URL(data)
      const sid = urlObj.searchParams.get('sessionId')
      setSessionId(sid)

      const expiryInSeconds = data.expiresIn || 120
      setExpiryTime(Date.now() + expiryInSeconds * 1000)

      // Log khi thành công
      console.log('QR code URL:', data)
      console.log('Session ID:', sid)
    } catch (err) {
      console.error('Failed to create QR session', err)
      setQrUrl(null)
      setSessionId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!expiryTime) return
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setIsExpired(true)
        clearInterval(timer)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [expiryTime])

  useEffect(() => {
    generateQrCode()
  }, [])

  useEffect(() => {
    if (!sessionId) return
    const socket = new SockJS(`${config.baseUrl}/ola-chat/ws`)
    const client = Stomp.over(socket)
    client.debug = () => {}

    client.connect(
      {},
      () => {
        client.subscribe(`/user/queue/qr-login/${sessionId}`, (message) => {
          try {
            const payload = JSON.parse(message.body)
            if (payload.type === 'USER_INFO_PREVIEW') setUserInfo(payload.user)
            else if (payload.type === 'QR_LOGIN_SUCCESS') {
              const { accessToken, refreshToken, user } = payload
             console.log("Received message:", payload);
              setAccessTokenToLS(accessToken)
              setRefreshTokenToLS(refreshToken)
              setProfileToLS(user)
              setIsAuthenticated(true)
              setProfile(user)
              navigate('/')
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error)
          }
        })
      },
      (error: any) => console.error('WebSocket connection error:', error)
    )

    setStompClient(client)
    return () => {
      if (client && client.connected) client.disconnect(() => console.log('WebSocket disconnected'))
    }
  }, [sessionId, setIsAuthenticated, setProfile, navigate])

  const formatTimeLeft = (seconds: number | null) => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  return (
    <div className='qr-login-container'>
      <div className='container'>
        <div className='row justify-content-center'>
          <div className='col-md-6 col-lg-5'>
            <div className='card shadow my-5'>
              <div className='card-body p-4 text-center'>
                <h3 className='mb-4'>Đăng nhập với QR Code</h3>

                <div className='qr-code-wrapper position-relative mb-3'>
                  {isExpired ? (
                    <div className='expired-overlay d-flex flex-column align-items-center justify-content-center'>
                      <div className='expired-message'>
                        <i className='bi bi-clock-history fs-1 text-secondary mb-2'></i>
                        <p className='fs-5 fw-bold text-secondary'>Mã QR đã hết hạn</p>
                        <button className='btn btn-primary' onClick={generateQrCode}>
                          <i className='bi bi-arrow-clockwise me-2'></i>
                          Tạo mã QR mới
                        </button>
                      </div>
                    </div>
                  ) : qrUrl ? (
                    <QRCodeSVG
                      value={qrUrl}
                      size={256}
                      level='H'
                      includeMargin={true}
                      imageSettings={{
                        src: 'https://i.imgur.com/i9QFbVN.png',
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true
                      }}
                    />
                  ) : (
                    <div className='qr-loader d-flex justify-content-center align-items-center' style={{ height: 256 }}>
                      <div className='spinner-border text-primary' role='status'>
                        <span className='visually-hidden'>Đang tải...</span>
                      </div>
                    </div>
                  )}
                </div>

                {!isExpired && timeLeft !== null && (
                  <div className='expiry-timer mb-3'>
                    <span className='badge bg-light text-dark'>
                      <i className='bi bi-clock me-1'></i>
                      Hết hạn trong {formatTimeLeft(timeLeft)}
                    </span>
                  </div>
                )}

                <p className='text-muted mb-4'>
                  Mở ứng dụng Ola Chat trên điện thoại và quét mã QR để đăng nhập tự động.
                </p>

                {userInfo && (
                  <div className='user-preview alert alert-info d-flex align-items-center'>
                    <img
                      src={userInfo.avatar || 'https://via.placeholder.com/64'}
                      alt='User Avatar'
                      className='rounded-circle me-3'
                      style={{ width: 64, height: 64 }}
                    />
                    <div className='text-start'>
                      <div className='fw-bold'>{userInfo.displayName}</div>
                      <div className='text-muted'>@{userInfo.username}</div>
                      <small>Xác nhận đăng nhập trên thiết bị di động của bạn</small>
                    </div>
                  </div>
                )}

                <div className='d-flex justify-content-center'>
                  <button className='btn btn-outline-primary mt-3' onClick={generateQrCode}>
                    {loading ? (
                      <>
                        <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <i className='bi bi-arrow-repeat me-2'></i>
                        Tạo mã QR mới
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className='card-footer bg-light text-center py-3'>
                <small className='text-muted'>
                  Hoặc quay lại{' '}
                  <a href='/login' className='text-decoration-none'>
                    đăng nhập thông thường
                  </a>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS styles for QR code display */}
      <style>{`
        .qr-code-wrapper {
          margin: 0 auto;
          width: 256px;
          height: 256px;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .expired-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.9);
          z-index: 10;
          border-radius: 8px;
        }
        
        .expired-message {
          padding: 20px;
          text-align: center;
        }
        
        @media (max-width: 576px) {
          .qr-code-wrapper {
            width: 200px;
            height: 200px;
          }
        }
      `}</style>
    </div>
  )
}
