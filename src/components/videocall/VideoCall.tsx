// src/components/VideoCall.tsx
import React, { useEffect, useRef, useState } from 'react'
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'

// Lấy thông tin từ biến môi trường
const APP_ID = '0aeec49e7a0b423e87150186568b81c7'
const TOKEN =
  '007eJxTYGCckLA6IOvj++t7cnofrxLfvXBDgZBSg9bW4zuPTN7562+EAoNBYmpqsollqnmiQZKJkXGqhbmhqYGhhZmpmUWShWGy+XYt04yGQEYGjfj1LIwMEAjiszMU5efnGhoZMzAAAGWTIbM='

interface VideoCallProps {
  channelName: string
  userId: string
  displayName?: string
  avatarUrl?: string
  partnerAvatar?: string // Thêm avatar của đối tác
  partnerName?: string // Thêm tên của đối tác
  onLeaveCall?: () => void // Callback khi rời cuộc gọi
}

const VideoCall: React.FC<VideoCallProps> = ({
  channelName,
  userId,
  displayName,
  avatarUrl = 'https://randomuser.me/api/portraits/men/1.jpg',
  partnerAvatar = 'https://randomuser.me/api/portraits/women/1.jpg',
  partnerName = 'Người dùng',
  onLeaveCall,
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
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)

  // Chuẩn bị thông tin hiển thị
  const title = `Cuộc gọi với ${displayName || 'Người dùng khác'}`

  useEffect(() => {
    document.title = title

    const joinChannel = async () => {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        console.log('User published', user.uid)

        if (mediaType === 'video') {
          const remoteContainer = document.getElementById(`user-container-${user.uid}`)
          const videoElement = document.getElementById(`user-video-${user.uid}`)

          if (remoteContainer && videoElement) {
            user.videoTrack?.play(videoElement)

            // Cập nhật trạng thái video của người dùng từ xa
            setRemoteUsers((prev) =>
              prev.map((u) => (u.uid === user.uid.toString() ? { ...u, videoEnabled: true } : u))
            )
          } else {
            // Nếu container chưa tồn tại, tạo mới user trong state
            const remoteUser = {
              uid: user.uid.toString(),
              videoEnabled: true,
              audioEnabled: true,
              avatar: partnerAvatar, // Sử dụng avatar của đối tác
              name: partnerName // Sử dụng tên của đối tác
            }

            setRemoteUsers((prev) => {
              if (!prev.some((u) => u.uid === user.uid.toString())) {
                return [...prev, remoteUser]
              }
              return prev
            })

            // Video sẽ được render trong useEffect khi remoteUsers thay đổi
          }
        }

        if (mediaType === 'audio') {
          user.audioTrack?.play()

          // Cập nhật trạng thái audio của người dùng từ xa
          setRemoteUsers((prev) => prev.map((u) => (u.uid === user.uid.toString() ? { ...u, audioEnabled: true } : u)))
        }
      })

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          // Cập nhật trạng thái khi người dùng tắt video
          setRemoteUsers((prev) => prev.map((u) => (u.uid === user.uid.toString() ? { ...u, videoEnabled: false } : u)))
        }

        if (mediaType === 'audio') {
          // Cập nhật trạng thái khi người dùng tắt audio
          setRemoteUsers((prev) => prev.map((u) => (u.uid === user.uid.toString() ? { ...u, audioEnabled: false } : u)))
        }
      })

      client.on('user-left', (user) => {
        // Xóa user khỏi danh sách khi họ rời đi
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid.toString()))
      })

      try {
        // Sử dụng userId làm uid để đảm bảo người dùng có id cố định
        const uid = parseInt(userId.replace(/\D/g, '').substring(0, 8)) || null
        await client.join(APP_ID, channelName, TOKEN || null, uid)
        console.log('Joined channel successfully with UID:', uid)

        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        localAudioTrackRef.current = microphoneTrack
        localVideoTrackRef.current = cameraTrack

        if (localVideoRef.current) {
          cameraTrack.play(localVideoRef.current)
        }

        await client.publish([microphoneTrack, cameraTrack])

        setJoined(true)
      } catch (error) {
        console.error('Error joining channel:', error)
      }
    }

    joinChannel()

    return () => {
      leaveCall()
    }
  }, [channelName, userId, avatarUrl, partnerAvatar, partnerName])

  // Effect để kết xuất video của người dùng từ xa khi remoteUsers thay đổi
  useEffect(() => {
    remoteUsers.forEach((user) => {
      const remoteContainer = document.getElementById(`user-container-${user.uid}`)
      const videoElement = document.getElementById(`user-video-${user.uid}`)

      if (!remoteContainer || !videoElement) return

      const remoteUser = clientRef.current?.remoteUsers.find((ru) => ru.uid.toString() === user.uid)

      if (remoteUser?.videoTrack && user.videoEnabled) {
        remoteUser.videoTrack.play(videoElement)
      }
    })
  }, [remoteUsers])

  const leaveCall = async () => {
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

    // Đóng cửa sổ sau khi rời khỏi cuộc gọi nếu là tab mới
    // window.close();
  }

  const toggleMute = () => {
    if (localAudioTrackRef.current) {
      const isMuted = localAudioTrackRef.current.muted
      localAudioTrackRef.current.setMuted(!isMuted)
      setIsLocalAudioEnabled(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      const isEnabled = localVideoTrackRef.current.enabled
      localVideoTrackRef.current.setEnabled(!isEnabled)
      setIsLocalVideoEnabled(!isEnabled)
    }
  }

  return (
    <div className='video-call-container p-3'>
      <div className='video-call-header mb-3'>
        <h2>{title}</h2>
        <p>ID phòng: {channelName}</p>
        <div className='call-timer text-center'>
          <span className='badge bg-dark p-2'>00:00</span>
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
      </div>
    </div>
  )
}

export default VideoCall
