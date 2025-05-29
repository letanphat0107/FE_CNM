import { useEffect, useState } from 'react'
import notificationAPI from 'src/apis/notification.api'
import { Notification, NotificationType } from 'src/types/notifycation.type'
import classNames from 'classnames'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import userApi from 'src/apis/user.api'
import { User } from 'src/types/user.type'

// Component hiển thị thời gian tương đối
const RelativeTime = ({ time }: { time: string }) => {
  const formattedTime = () => {
    const date = new Date(time)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`
    } else if (diffMinutes < 24 * 60) {
      const hours = Math.floor(diffMinutes / 60)
      return `${hours} giờ trước`
    } else if (diffMinutes < 48 * 60) {
      return 'hôm qua'
    } else {
      return format(date, 'dd/MM/yyyy', { locale: vi })
    }
  }

  return <span className='text-sm text-gray-500'>{formattedTime()}</span>
}

// Component hiển thị icon dựa vào loại thông báo
const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'FRIEND_REQUEST':
      return <i className='fas fa-user-plus text-blue-500'></i>
    case 'MESSAGE':
      return <i className='fas fa-comment-alt text-green-500'></i>
    case 'MENTION':
      return <i className='fas fa-at text-purple-500'></i>
    case 'GROUP':
      return <i className='fas fa-users text-orange-500'></i>
    case 'SYSTEM':
      return <i className='fas fa-bell text-gray-500'></i>
    case 'POST_LIKE':
      return <i className='fas fa-heart text-red-500'></i>
    case 'POST_COMMENT':
      return <i className='fas fa-comment text-blue-400'></i>
    case 'POST_SHARE':
      return <i className='fas fa-share-alt text-green-400'></i>
    case 'POST_COMMENT_REPLY':
      return <i className='fas fa-reply text-teal-500'></i>
    default:
      return <i className='fas fa-bell text-gray-500'></i>
  }
}

// Interface cho notification với sender info
interface NotificationWithSender extends Notification {
  senderInfo?: User
}

// Component chính
const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [senderCache, setSenderCache] = useState<Record<string, User>>({})

  useEffect(() => {
    fetchNotifications()
  }, [page])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationAPI.getNotifycations(page, 2, 'desc')
      const notificationResponse = response.data.data
      const newNotifications: Notification[] = notificationResponse.content

      if (newNotifications.length === 0 || page >= notificationResponse.totalPages - 1) {
        setHasMore(false)
      } else {
        // Lấy danh sách senderIds để fetch thông tin người gửi
        const senderIds = newNotifications
          .map((notification) => notification.senderId)
          .filter((id): id is string => !!id && !senderCache[id])
          .filter((id, index, self) => self.indexOf(id) === index) // Loại bỏ trùng lặp

        // Nếu có senderIds mới, fetch thông tin người gửi
        if (senderIds.length > 0) {
          const senderInfoMap = { ...senderCache }

          // Fetch thông tin người gửi (có thể một lần hoặc nhiều lần tùy vào API)
          await Promise.all(
            senderIds.map(async (senderId) => {
              try {
                const userResponse = await userApi.getFriendsById(senderId)
                senderInfoMap[senderId] = userResponse.data.data
              } catch (error) {
                console.error(`Failed to fetch sender info for ID: ${senderId}`, error)
              }
            })
          )

          setSenderCache(senderInfoMap)
        }

        // Thêm vào danh sách thông báo
        const notificationsWithSender = newNotifications.map((notification) => {
          return {
            ...notification,
            senderInfo: notification.senderId ? senderCache[notification.senderId] : undefined
          }
        })

        setNotifications((prev) => [...prev, ...notificationsWithSender])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setError('Không thể tải thông báo. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  // Cập nhật notifications khi senderCache thay đổi
  useEffect(() => {
    if (Object.keys(senderCache).length > 0) {
      setNotifications((prev) =>
        prev.map((notification) => {
          if (notification.senderId && senderCache[notification.senderId]) {
            return {
              ...notification,
              senderInfo: senderCache[notification.senderId]
            }
          }
          return notification
        })
      )
    }
  }, [senderCache])

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  // Xử lý khi click vào thông báo
  const handleNotificationClick = async (notification: NotificationWithSender) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notification.read) {
      try {
        await notificationAPI.markAsRead(notification.id)
        // Cập nhật UI
        setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }

    // Chuyển hướng dựa vào loại thông báo
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        // Chuyển đến trang quản lý bạn bè hoặc profile người gửi
        console.log('Navigate to friend request page with ID:', notification.senderId)
        break
      case 'MESSAGE':
        // Chuyển đến cuộc trò chuyện
        console.log('Navigate to conversation with ID:', notification.senderId)
        break
      case 'POST_LIKE':
      case 'POST_COMMENT':
      case 'POST_SHARE':
      case 'POST_COMMENT_REPLY':
        // Chuyển đến bài viết, nếu có metadata chứa postId
        console.log('Navigate to post')
        break
      default:
        console.log('Clicked notification:', notification)
    }
  }

  // Render nội dung thông báo dựa vào loại
  const renderNotificationContent = (notification: NotificationWithSender) => {
    // Dữ liệu mẫu đã có title và body, nên chúng ta sẽ sử dụng chúng
    if (notification.body) {
      return notification.body
    }

    const senderName = notification.senderInfo?.displayName || 'Người dùng'

    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return `${senderName} đã gửi cho bạn lời mời kết bạn.`
      case 'MESSAGE':
        return `Bạn có tin nhắn từ ${senderName}`
      case 'MENTION':
        return `${senderName} đã nhắc đến bạn trong một bài viết.`
      case 'GROUP':
        return `${senderName} đã thêm bạn vào một nhóm.`
      case 'SYSTEM':
        return notification.body || 'Thông báo hệ thống'
      case 'POST_LIKE':
        return `${senderName} đã thích bài viết của bạn.`
      case 'POST_COMMENT':
        return `${senderName} đã bình luận về bài viết của bạn.`
      case 'POST_SHARE':
        return `${senderName} đã chia sẻ bài viết của bạn.`
      case 'POST_COMMENT_REPLY':
        return `${senderName} đã phản hồi bình luận của bạn.`
      default:
        return notification.body || 'Bạn có thông báo mới'
    }
  }

  if (error) {
    return (
      <div className='p-4 text-center text-red-500'>
        <div className='mb-2'>
          <i className='fas fa-exclamation-circle fa-2x'></i>
        </div>
        <div>{error}</div>
        <button
          className='mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          onClick={() => {
            setError(null)
            setPage(0)
            setNotifications([])
            fetchNotifications()
          }}
        >
          Thử lại
        </button>
      </div>
    )
  }

  // Cập nhật phần render HTML của component Notifications
  return (
    <div
      className='notifications-container'
      style={{ boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)', borderRadius: '8px', maxWidth: '100%'}}
    >
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h2 className='fs-3 fw-bold mb-0'>Thông báo mới</h2>
        <button className='btn text-primary border-0'>Xem tất cả</button>
      </div>

      {notifications.length === 0 && !loading ? (
        <div className='text-center py-4 my-3'>
          <div className='mb-3'>
            <i className='far fa-bell fa-3x text-secondary'></i>
          </div>
          <div className='text-secondary'>Bạn không có thông báo nào</div>
        </div>
      ) : (
        <div className='notification-list' style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', scrollbarWidth: 'none' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={classNames('notification-item rounded-4 mb-3 p-3', { 'bg-light': !notification.read })}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className='d-flex'>
                <div className='notification-icon me-3 position-relative'>
                  {notification.type === 'MESSAGE' ? (
                    <div className='notification-circle bg-lavender'>
                      <i className='fas fa-bell text-purple fs-5'></i>
                    </div>
                  ) : notification.senderInfo ? (
                    <img
                      src={
                        notification.senderInfo.avatar ||
                        'https://res.cloudinary.com/dm5ulzy7n/image/upload/v1748307746/z6642578626786_9c3f5e5b519e59140f14558806ec7d00--dfca98f0-c6cb-46ed-b57b-e87de3e712ce.jpg'
                      }
                      alt={notification.senderInfo.displayName}
                      className='rounded-circle'
                      style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          'https://res.cloudinary.com/dm5ulzy7n/image/upload/v1748307746/z6642578626786_9c3f5e5b519e59140f14558806ec7d00--dfca98f0-c6cb-46ed-b57b-e87de3e712ce.jpg'
                      }}
                    />
                  ) : (
                    <div className='notification-circle bg-lavender'>
                      <i className='fas fa-bell text-purple fs-5'></i>
                    </div>
                  )}
                </div>

                <div className='notification-content flex-grow-1'>
                  <div className='notification-title fw-semibold'>{notification.title}</div>
                  <div className='notification-body text-secondary'>{notification.body}</div>
                  <div className='notification-time text-secondary small'>
                    <RelativeTime time={notification.createdAt} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className='text-center py-3'>
              <button onClick={loadMore} disabled={loading} className='btn btn-light rounded-pill px-4'>
                {loading ? 'Đang tải...' : 'Xem thêm'}
              </button>
            </div>
          )}

          {loading && notifications.length > 0 && (
            <div className='text-center py-3'>
              <div className='spinner-border spinner-border-sm text-primary me-2' role='status'>
                <span className='visually-hidden'>Loading...</span>
              </div>
              Đang tải thêm thông báo...
            </div>
          )}
        </div>
      )}
      <style>{`
        .notifications-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 16px;
        }

        .notification-item {
          background-color: #f8f8ff;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .notification-item:hover {
          background-color: #f0f0ff;
        }

        .notification-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #e6e6fa;
        }

        .text-purple {
          color: #6200ee;
        }

        .bg-lavender {
          background-color: #e6e6fa;
        }

        .rounded-4 {
          border-radius: 1rem;
        }
      `}</style>
    </div>
  )
}

export default Notifications
