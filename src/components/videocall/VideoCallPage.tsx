// import React, { useContext, useEffect } from 'react'
// import { useParams, useNavigate } from 'react-router-dom'
// import VideoCall from './VideoCall'
// import { AppContext } from 'src/contexts/app.context'

// const VideoCallPage: React.FC = () => {
//   const navigate = useNavigate()
//   const { channelId, partnerId, partnerAvt, partnerName } = useParams<{
//     channelId: string
//     partnerId: string
//     partnerAvt: string
//     partnerName: string
//   }>()

//   const { profile } = useContext(AppContext)

//   // Hàm này sẽ được gọi khi người dùng nhấn nút kết thúc cuộc gọi
//   const handleLeaveCall = () => {
//     // Nếu đang ở tab mới, đóng tab
//     if (window.opener) {
//       window.close()
//     } else {
//       // Nếu không phải tab mới, điều hướng về trang trước
//       navigate(-1)
//     }
//   }

//   useEffect(() => {
//     // Xử lý full-screen khi vào trang video call
//     const handleFullScreen = () => {
//       try {
//         document.documentElement.requestFullscreen()
//       } catch (error) {
//         console.error('Could not enter fullscreen mode', error)
//       }
//     }

//     // Bắt sự kiện ESC để thoát cuộc gọi
//     const handleEscKey = (event: KeyboardEvent) => {
//       if (event.key === 'Escape') {
//         navigate(-1) // Quay về trang trước đó
//       }
//     }

//     // Yêu cầu sử dụng fullscreen khi trang được tải
//     // handleFullScreen();

//     // Thêm event listener để bắt sự kiện ESC
//     document.addEventListener('keydown', handleEscKey)

//     // Cleanup
//     return () => {
//       document.removeEventListener('keydown', handleEscKey)
//       if (document.fullscreenElement) {
//         document.exitFullscreen().catch((err) => {
//           console.error('Error exiting fullscreen', err)
//         })
//       }
//     }
//   }, [navigate])

//   // Kiểm tra xem có đủ thông tin để bắt đầu cuộc gọi không
//   if (!channelId || !profile) {
//     return (
//       <div className='video-call-error container mt-5 text-center'>
//         <div className='card p-5 shadow'>
//           <h3>Thông tin cuộc gọi không hợp lệ</h3>
//           <p className='mb-4'>Vui lòng quay lại trang chính để bắt đầu cuộc gọi mới.</p>
//           <button className='btn btn-primary' onClick={() => window.close()}>
//             Đóng cửa sổ
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // Giải mã URL các tham số
//   const decodedPartnerName = decodeURIComponent(partnerName || '')
//   const decodedPartnerAvt = decodeURIComponent(partnerAvt || '')

//   return (
//     <div
//       className='video-call-page'
//       style={{
//         backgroundColor: '#1a2236',
//         minHeight: '100vh',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         color: 'white',
//         padding: '20px'
//       }}
//     >
//       <div className='container'>
//         <VideoCall
//           channelName={channelId}
//           userId={profile.userId}
//           displayName={profile.displayName || 'Người dùng'}
//           avatarUrl={profile?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'}
//           partnerAvatar={decodedPartnerAvt || 'https://randomuser.me/api/portraits/women/1.jpg'}
//           partnerName={decodedPartnerName || 'Người dùng'}
//           onCallEnd={() => console.log("Call ended")}
//         />
//       </div>
//     </div>
//   )
// }

// export default VideoCallPage

import React from 'react'

export default function VideoCallPage() {
  return (
    <div>VideoCallPage</div>
  )
}

