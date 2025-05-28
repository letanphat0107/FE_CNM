// src/components/VideoCall.tsx
import React, { useEffect, useRef, useState } from 'react'
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'

// Đảm bảo App ID giống với Flutter
const APP_ID = '3d8544a8d6eb45e385188b8ce83259ad'
// Để trống TOKEN nếu bạn đã cấu hình Agora Console cho phép không cần token
const TOKEN = null

interface VideoCallProps {
  channelName: string
  userId: string
  displayName?: string
  avatarUrl?: string
  partnerAvatar?: string
  partnerName?: string
}

const VideoCall: React.FC<VideoCallProps> = ({
  channelName,
  userId,
  displayName,
  avatarUrl = 'https://randomuser.me/api/portraits/men/1.jpg',
  partnerAvatar = 'https://randomuser.me/api/portraits/women/1.jpg',
  partnerName = 'Người dùng',
}) => {
  const [joined, setJoined] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<
    Array<{
      uid: string
      videoEnabled: boolean
      audioEnabled: boolean
      avatar: string
      name: string
    }>
  >([])
  const [isLocalVideoEnabled, setIsLocalVideoEnabled] = useState(true)
  const [isLocalAudioEnabled, setIsLocalAudioEnabled] = useState(true)
  const [callTime, setCallTime] = useState(0)
  const [hasError, setHasError] = useState(false)

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Chuẩn bị thông tin hiển thị
  const title = `Cuộc gọi với ${displayName || 'Người dùng khác'}`

  // Định dạng thời gian cuộc gọi
  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  useEffect(() => {
    document.title = title

    // Khi component mount, bắt đầu timer
    timerRef.current = setInterval(() => {
      setCallTime((prev) => prev + 1)
    }, 1000)

    const joinChannel = async () => {
      try {
        console.log('Initializing Agora client...')
        // Khởi tạo client với cấu hình tương thích với Flutter
        const client = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8'
        })
        clientRef.current = client

        // Xử lý sự kiện người dùng xuất bản media
        client.on('user-published', async (user, mediaType) => {
          try {
            console.log(`User ${user.uid} published ${mediaType}`)
            await client.subscribe(user, mediaType)

            if (mediaType === 'video') {
              console.log(`Subscribing to video from user ${user.uid}`)

              // Tìm hoặc tạo container cho video của người dùng từ xa
              const remoteContainer = document.getElementById(`user-container-${user.uid}`)
              const videoElement = document.getElementById(`user-video-${user.uid}`)

              if (remoteContainer && videoElement) {
                console.log(`Playing video from user ${user.uid} in existing element`)
                user.videoTrack?.play(videoElement)

                // Cập nhật trạng thái video của người dùng từ xa
                setRemoteUsers((prev) =>
                  prev.map((u) => (u.uid === user.uid.toString() ? { ...u, videoEnabled: true } : u))
                )
              } else {
                console.log(`Creating new remote user for ${user.uid}`)
                // Nếu container chưa tồn tại, tạo mới user trong state
                const remoteUser = {
                  uid: user.uid.toString(),
                  videoEnabled: true,
                  audioEnabled: true,
                  avatar: partnerAvatar,
                  name: partnerName
                }

                setRemoteUsers((prev) => {
                  if (!prev.some((u) => u.uid === user.uid.toString())) {
                    console.log(`Adding new remote user ${user.uid} to state`)
                    return [...prev, remoteUser]
                  }
                  return prev
                })

                // Video sẽ được render trong useEffect khi remoteUsers thay đổi
              }
            }

            if (mediaType === 'audio') {
              console.log(`Playing audio from user ${user.uid}`)
              user.audioTrack?.play()

              // Cập nhật trạng thái audio của người dùng từ xa
              setRemoteUsers((prev) => {
                const existingUserIndex = prev.findIndex((u) => u.uid === user.uid.toString())

                if (existingUserIndex >= 0) {
                  // User đã tồn tại, cập nhật trạng thái audio
                  const updatedUsers = [...prev]
                  updatedUsers[existingUserIndex] = {
                    ...updatedUsers[existingUserIndex],
                    audioEnabled: true
                  }
                  return updatedUsers
                } else {
                  // User chưa tồn tại, thêm mới với audio enabled
                  return [
                    ...prev,
                    {
                      uid: user.uid.toString(),
                      videoEnabled: false,
                      audioEnabled: true,
                      avatar: partnerAvatar,
                      name: partnerName
                    }
                  ]
                }
              })
            }
          } catch (err) {
            console.error('Error handling user published event:', err)
          }
        })

        // Xử lý sự kiện người dùng hủy xuất bản media
        client.on('user-unpublished', (user, mediaType) => {
          try {
            console.log(`User ${user.uid} unpublished ${mediaType}`)

            if (mediaType === 'video') {
              // Cập nhật trạng thái khi người dùng tắt video
              setRemoteUsers((prev) =>
                prev.map((u) => (u.uid === user.uid.toString() ? { ...u, videoEnabled: false } : u))
              )
            }

            if (mediaType === 'audio') {
              // Cập nhật trạng thái khi người dùng tắt audio
              setRemoteUsers((prev) =>
                prev.map((u) => (u.uid === user.uid.toString() ? { ...u, audioEnabled: false } : u))
              )
            }
          } catch (err) {
            console.error('Error handling user unpublished event:', err)
          }
        })

        // Xử lý sự kiện người dùng rời khỏi kênh
        client.on('user-left', (user) => {
          try {
            console.log(`User ${user.uid} left the channel`)
            // Xóa user khỏi danh sách khi họ rời đi
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid.toString()))
          } catch (err) {
            console.error('Error handling user left event:', err)
          }
        })

        try {
          console.log('Trying to join channel:', channelName)

          // Quan trọng: Sử dụng uid từ 1-999999
          // Trong Flutter bạn dùng uid=0, nên web không nên dùng uid=0
          // Để đảm bảo không trùng với mobile client
          const uid = Math.floor(Math.random() * 999000) + 1000

          console.log('Joining with UID:', uid)
          await client.join(APP_ID, channelName, TOKEN, uid)
          console.log('Joined channel successfully with UID:', uid)

          console.log('Creating local tracks...')
          const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
            {
              // Cấu hình audio để tương thích với mobile
              AEC: true, // echo cancellation
              ANS: true, // automatic noise suppression
              AGC: true // automatic gain control
            },
            {
              // Cấu hình video để tương thích với mobile
              encoderConfig: {
                width: 640,
                height: 480,
                frameRate: 15,
                bitrateMin: 400,
                bitrateMax: 800
              },
              facingMode: 'user'
            }
          )

          localAudioTrackRef.current = microphoneTrack
          localVideoTrackRef.current = cameraTrack

          console.log('Playing local video...')
          if (localVideoRef.current) {
            cameraTrack.play(localVideoRef.current)
          }

          console.log('Publishing local tracks...')
          await client.publish([microphoneTrack, cameraTrack])
          console.log('Published local tracks successfully')

          setJoined(true)
        } catch (error) {
          console.error('Error joining channel:', error)
          setHasError(true)
        }
      } catch (error) {
        console.error('Error initializing Agora client:', error)
        setHasError(true)
      }
    }

    joinChannel()

    // Cleanup khi component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      leaveCall()
    }
  }, [channelName, userId])

  // Effect để kết xuất video của người dùng từ xa khi remoteUsers thay đổi
  useEffect(() => {
    console.log('Remote users updated:', remoteUsers)

    remoteUsers.forEach((user) => {
      console.log(`Processing remote user: ${user.uid}, video enabled: ${user.videoEnabled}`)

      const remoteContainer = document.getElementById(`user-container-${user.uid}`)
      const videoElement = document.getElementById(`user-video-${user.uid}`)

      if (!remoteContainer || !videoElement) {
        console.log(`Container or video element not found for user ${user.uid}`)
        return
      }

      const remoteUser = clientRef.current?.remoteUsers.find((ru) => ru.uid.toString() === user.uid)

      console.log(
        `Found remote user with matching UID: ${remoteUser?.uid}, has video track: ${!!remoteUser?.videoTrack}`
      )

      if (remoteUser?.videoTrack && user.videoEnabled) {
        console.log(`Playing video for remote user ${user.uid}`)

        // Đảm bảo video được play trong element
        try {
          remoteUser.videoTrack.play(videoElement, { fit: 'cover' })
        } catch (err) {
          console.error(`Error playing remote video for user ${user.uid}:`, err)
        }
      } else {
        console.log(`Cannot play video for user ${user.uid} - video track unavailable or disabled`)
      }
    })
  }, [remoteUsers])

  // Hàm rời khỏi cuộc gọi
  const leaveCall = async () => {
    console.log('Leaving call...')

    try {
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop()
        localVideoTrackRef.current.close()
      }

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop()
        localAudioTrackRef.current.close()
      }

      if (clientRef.current) {
        await clientRef.current.leave()
      }

      setJoined(false)

      // Gọi callback nếu có
      // if (onLeaveCall) {
      //   onLeaveCall()
      // }
    } catch (error) {
      console.error('Error while leaving call:', error)
      // Vẫn thử gọi callback nếu có lỗi
      // if (onLeaveCall) {
      //   onLeaveCall()
      // }
    }
  }

  // Bật/tắt micro
  const toggleMute = () => {
    if (localAudioTrackRef.current) {
      const isMuted = localAudioTrackRef.current.muted
      localAudioTrackRef.current.setMuted(!isMuted)
      setIsLocalAudioEnabled(!isMuted)
    }
  }

  // Bật/tắt camera
  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      const isEnabled = localVideoTrackRef.current.enabled
      localVideoTrackRef.current.setEnabled(!isEnabled)
      setIsLocalVideoEnabled(!isEnabled)
    }
  }

  return (
    <div className='video-call-container p-3'>
      <div className='video-call-header mb-3 d-flex justify-content-between align-items-center'>
        <h2>{title}</h2>
        <div className='call-timer'>
          <span className='badge bg-dark p-2'>{formatCallTime(callTime)}</span>
        </div>
      </div>

      <div className='video-call-content'>
        <div
          className='video-grid'
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center'
          }}
        >
          {/* Local Video Container */}
          <div
            className='video-participant-container'
            style={{
              width: '320px',
              height: '280px',
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#1f1f1f',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {isLocalVideoEnabled ? (
              <div
                id='local-player'
                ref={localVideoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 1
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1
                }}
              >
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid white'
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt='Your Avatar'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      // Fallback nếu image không load được
                      e.currentTarget.src = 'https://via.placeholder.com/150?text=User'
                    }}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                zIndex: 2
              }}
            >
              Bạn {!isLocalAudioEnabled && '(Đã tắt mic)'}
            </div>
          </div>

          {/* Remote Video Containers */}
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              className='video-participant-container'
              id={`user-container-${user.uid}`}
              style={{
                width: '320px',
                height: '280px',
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#1f1f1f',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {user.videoEnabled ? (
                <div
                  id={`user-video-${user.uid}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 1
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1
                  }}
                >
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '3px solid white'
                    }}
                  >
                    <img
                      src={user.avatar || avatarUrl}
                      alt='User Avatar'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        // Fallback nếu image không load được
                        e.currentTarget.src = 'https://via.placeholder.com/150?text=User'
                      }}
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  zIndex: 2
                }}
              >
                {user.name} {!user.audioEnabled && '(Đã tắt mic)'}
              </div>
            </div>
          ))}
        </div>

        <div
          className='video-controls mt-5'
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '1rem 0'
          }}
        >
          <button
            onClick={toggleMute}
            className={`btn ${isLocalAudioEnabled ? 'btn-light' : 'btn-danger'} rounded-circle`}
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
            title={isLocalAudioEnabled ? 'Tắt mic' : 'Bật mic'}
          >
            <i className={`fas ${isLocalAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'} fa-lg`}></i>
          </button>

          <button
            onClick={toggleVideo}
            className={`btn ${isLocalVideoEnabled ? 'btn-light' : 'btn-danger'} rounded-circle`}
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
            title={isLocalVideoEnabled ? 'Tắt camera' : 'Bật camera'}
          >
            <i className={`fas ${isLocalVideoEnabled ? 'fa-video' : 'fa-video-slash'} fa-lg`}></i>
          </button>

          <button
            onClick={leaveCall}
            className='btn btn-danger rounded-circle'
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
            title='Kết thúc cuộc gọi'
          >
            <i className='fas fa-phone-slash fa-lg'></i>
          </button>
        </div>

        {remoteUsers.length === 0 && joined && (
          <div
            className='waiting-message text-center mt-4 p-3'
            style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '8px'
            }}
          >
            <i className='fas fa-spinner fa-spin me-2'></i>
            <p className='mb-0'>Đang chờ người khác tham gia cuộc gọi...</p>
          </div>
        )}

        {hasError && (
          <div className='error-message text-center text-danger mt-4 p-3'>
            <i className='fas fa-exclamation-triangle me-2'></i>
            <p className='mb-0'>Đã xảy ra lỗi khi kết nối. Vui lòng thử lại.</p>
          </div>
        )}

        {/* Debug UI - Có thể ẩn trong production */}
        <div className='debug-info mt-4 small text-muted'>
          <div>Channel ID: {channelName}</div>
          <div>Remote users: {remoteUsers.length}</div>
          {remoteUsers.map((user) => (
            <div key={user.uid}>
              User {user.uid}: Video {user.videoEnabled ? 'ON' : 'OFF'}, Audio {user.audioEnabled ? 'ON' : 'OFF'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VideoCall
