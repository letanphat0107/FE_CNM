// src/components/VideoCall.tsx
import React, { useEffect, useRef } from 'react'
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'
import { useLocation, useNavigate } from 'react-router-dom'

// ZEGOCLOUD configuration
const APP_ID = 1156880137
const APP_SECRET = 'c76047c678d4f96165fa27342c94cd97'
const APP_SIGN = '5531bb962ce40abc4d6036f8729941950d8ca8f0853effd9c9908ae4e532af9e'

interface VideoCallProps {
  channelName: string
  userId: string
  displayName?: string
  avatarUrl?: string
  partnerAvatar?: string
  partnerName?: string
  onCallEnd?: () => void
}

const VideoCall: React.FC<VideoCallProps> = ({
  channelName,
  userId,
  displayName = 'You',
  partnerAvatar,
  partnerName,
  onCallEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Set document title
    const title = `Cuộc gọi video với ${partnerName || 'Người dùng'}`
    document.title = title

    const runVideoCall = async () => {
      try {
        // Ensure we have valid values
        const roomID = channelName || 'default-room'
        const userID = userId || `user_${Math.floor(Math.random() * 10000)}`
        const userName = displayName || 'User'

        console.log('Starting video call with:', {
          roomID,
          userID,
          userName,
          appID: APP_ID
        })

        // Generate Kit Token - use App Sign for testing only
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(APP_ID, APP_SECRET, roomID, userID, userName)

        // Create instance
        const zp = ZegoUIKitPrebuilt.create(kitToken)

        // Join room
        zp.joinRoom({
          container: containerRef.current!,
          sharedLinks: [
            {
              name: 'Liên kết mời tham gia',
              url: window.location.href
            }
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall // Sử dụng mode phù hợp - OneONoneCall cho cuộc gọi 1-1
          },
          showRoomTimer: true,
          showRoomDetailsButton: true,
          showTurnOffRemoteCameraButton: false,
          showTurnOffRemoteMicrophoneButton: false,
          showRemoveUserButton: false,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: false, // Không cần thiết cho cuộc gọi 1-1
          showTextChat: true,
          showUserList: true,
          maxUsers: 2,
          layout: 'Auto',
          showLayoutButton: false,
          onJoinRoom: () => {
            console.log('Joined room successfully:', roomID)
          },
          onLeaveRoom: () => {
            console.log('Left room:', roomID)
            if (onCallEnd) {
              onCallEnd()
            }
            // Quay lại trang trước hoặc đóng tab nếu mở tab mới
            window.close()
          },
          showLeavingView: true,
          preJoinViewConfig: {
            title: `Cuộc gọi với ${partnerName || 'Người dùng'}`
          },
          branding: {
            logoURL: 'https://i.imgur.com/i9QFbVN.png' // Logo của ứng dụng nếu có
          }
        })
      } catch (error) {
        console.error('Error starting video call:', error)
        alert('Không thể bắt đầu cuộc gọi. Vui lòng thử lại sau.')
      }
    }

    runVideoCall()

    return () => {
      // Clean up
      document.title = 'Ola Chat'
    }
  }, [channelName, userId, displayName, partnerName, onCallEnd])

  return (
    <div className='video-call-page'>
      <div
        ref={containerRef}
        className='video-call-container'
        style={{
          width: '100%',
          height: '100vh',
          backgroundColor: '#1a1619'
        }}
      />
    </div>
  )
}

// Wrapper component to get URL parameters
const VideoCallWrapper: React.FC = () => {
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)

  const channelName = queryParams.get('channelName') || ''
  const userId = queryParams.get('userId') || ''
  const displayName = queryParams.get('displayName') || ''
  const partnerAvatar = queryParams.get('partnerAvatar') || ''
  const partnerName = queryParams.get('partnerName') || ''

  return (
    <VideoCall
      channelName={channelName}
      userId={userId}
      displayName={displayName}
      partnerAvatar={partnerAvatar}
      partnerName={partnerName}
    />
  )
}

export default VideoCallWrapper
