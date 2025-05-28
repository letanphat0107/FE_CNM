import { useState } from 'react'
import ImagePreviewModal from 'src/components/chat/ImagePreviewModal'
import MessageActions from 'src/components/chat/MessageActions'
import VideoPreviewModal from 'src/components/chat/VideoPreviewModal'
import { Message, Participant } from 'src/types/message.type'

interface Props {
  message: Message
  currentUserId: string
  participants: Participant[]
  conversationType: string
  onRecall: (messageId: string) => void
  onForward: (message: Message) => void // Thêm prop này
}

const MessageItem = ({ message, currentUserId, participants, conversationType, onRecall, onForward }: Props) => {
  const [isHovered, setIsHovered] = useState(false)
  const isMine = message.senderId === currentUserId
  const isSending = (message as any).isSending
  const isError = (message as any).isError
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewVideo, setPreviewVideo] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const sender = participants.find((u) => u.userId === message.senderId)
  const avatar = sender?.avatar || '/default-avatar.png'
  const displayName = sender?.displayName || ''

  const handleHover = (isHovered: boolean) => {
    setIsHovered(isHovered)
  }

  const handleForward = () => {
    onForward(message)
  }

  const getExtension = (url?: string | null) => {
    if (!url) return ''
    const cleanUrl = url.split('?')[0]
    return cleanUrl.split('.').pop()?.toLowerCase() || ''
  }

  const renderMedia = () => {
    const mediaCount = message.mediaUrls?.length || 0
    const [loadedIndexes, setLoadedIndexes] = useState<number[]>([])

    const handleImageLoad = (index: number) => {
      setLoadedIndexes((prev) => [...prev, index])
    }

    const getGridColumns = () => {
      if (mediaCount === 1) return '1fr'
      if (mediaCount <= 3) return 'repeat(2, 1fr)'
      return 'repeat(2, 1fr)'
    }

    return (
      <div
        className='d-grid'
        style={{
          gridTemplateColumns: getGridColumns(),
          gap: '8px',
          maxWidth: '100%',
          width: '100%',
          borderRadius: '10px'
        }}
      >
        {message.mediaUrls?.map((url, index) => {
          const ext = getExtension(url)
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
          const isVideo = ['mp4', 'webm', 'ogg'].includes(ext)
          const isPdf = ext === 'pdf'
          const isDoc = ['doc', 'docx'].includes(ext)

          if (!url) {
            return (
              <p key={index} className='text-muted small'>
                Đường dẫn không hợp lệ
              </p>
            )
          }

          if (isImage) {
            return (
              <div key={index} className='position-relative' style={{ height: '150px', width: '100%' }}>
                {(isSending || !loadedIndexes.includes(index)) && (
                  <div className='position-absolute top-50 start-50 translate-middle'>
                    <div
                      className='spinner-border text-primary'
                      role='status'
                      style={{ width: '2rem', height: '2rem' }}
                    />
                  </div>
                )}
                <img
                  src={url}
                  alt={`media-${index}`}
                  onLoad={() => handleImageLoad(index)}
                  className='img-fluid rounded'
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    display: loadedIndexes.includes(index) ? 'block' : 'none',
                    opacity: isSending ? 0.6 : 1,
                    filter: isError ? 'grayscale(100%) blur(1px)' : 'none'
                  }}
                  onClick={() => setPreviewImage(url)}
                />
              </div>
            )
          } else if (isVideo) {
            return (
              <div key={index} className='position-relative' style={{ height: '150px', width: '100%' }}>
                <video
                  ref={(video) => {
                    if (video) {
                      video.onplay = (e) => {
                        // Tạm dừng tất cả video khác khi một video được phát
                        document.querySelectorAll('video').forEach((v) => {
                          if (v !== video) v.pause()
                        })
                      }
                    }
                  }}
                  controls
                  className='rounded'
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    opacity: isSending ? 0.6 : 1,
                    filter: isError ? 'grayscale(100%) blur(1px)' : 'none'
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    document.querySelectorAll('video').forEach((v) => v.pause())
                    setPreviewVideo(url)
                  }}
                >
                  <source src={url} type='video/mp4' />
                  Trình duyệt không hỗ trợ phát video.
                </video>
              </div>
            )
          } else if (isPdf || isDoc) {
            return (
              <div
                key={index}
                className='bg-light border rounded d-flex align-items-center justify-content-start p-2 mb-2'
                style={{ height: '50px', cursor: 'pointer' }}
                onClick={() => window.open(url, '_blank')}
              >
                <i className={`fas ${isPdf ? 'fa-file-pdf text-danger' : 'fa-file-word text-primary'} me-2`}></i>
                <span className='text-truncate small' style={{ maxWidth: '80%' }}>
                  {decodeURIComponent(url.split('/').pop() || '')} ne
                </span>
              </div>
            )
          } else {
            return (
              // <p key={index} className='text-muted small'>
              //   Định dạng không hỗ trợ {url}
              // </p>
              <div
                key={index}
                className='border rounded d-flex align-items-center justify-content-between p-3 mb-2'
                style={{ height: '80px', backgroundColor: '#daebff' }}
              >
                <div
                  className='d-flex align-items-center'
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => window.open(url, '_blank')}
                >
                  <i
                    className={`fas ${isPdf ? 'fa-file-pdf text-danger' : 'fa-file-word text-primary'} fa-3x me-3`}
                  ></i>
                  <span className='text-truncate small' style={{ maxWidth: '80%' }}>
                    {decodeURIComponent(url.split('/').pop() || '')}
                  </span>
                </div>

                <div className='d-flex align-items-center gap-3'>
                  {/* Xem trước */}
                  <i
                    className='fas fa-eye text-secondary'
                    style={{ cursor: 'pointer' }}
                    title='Xem trước'
                    onClick={() => window.open(url, '_blank')}
                  ></i>

                  {/* Tải xuống */}
                  <i
                    className='fas fa-download text-success'
                    style={{ cursor: 'pointer' }}
                    title='Tải xuống'
                    onClick={(e) => {
                      e.stopPropagation() // Ngăn không click ra ngoài
                      const a = document.createElement('a')
                      a.href = url
                      a.download = decodeURIComponent(url.split('/').pop() || 'file')
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                    }}
                  ></i>
                </div>
              </div>
            )
          }
        })}
      </div>
    )
  }

  const renderContent = () => {
    if (message.recalled) {
      return <p className='mb-0 text-muted fst-italic'>Tin nhắn đã được thu hồi</p>
    }
    
    if (message.type === 'SYSTEM') {
      return (
        <div className='text-center my-2'>
          <p className='mb-0 text-muted small fst-italic'>{message.content}</p>
        </div>
      )
    }

    // Kiểm tra nếu là tin nhắn chuyển tiếp
    const isForwarded = (message as any).isForwarded;
    
    // Render phần nội dung tin nhắn
    const contentJSX = (
      <>
        {/* Hiển thị thông báo là tin nhắn chuyển tiếp */}
        {isForwarded && (
          <div className="mb-1">
            <small className="text-muted fst-italic">
              <i className="fas fa-share me-1"></i>
              Tin nhắn đã được chuyển tiếp
            </small>
          </div>
        )}
        
        {/* Nội dung tin nhắn */}
        {message.type === 'TEXT' && (
          <div
            className={`rounded-3 shadow-sm ${isMine ? 'text-white' : 'text-dark'}`}
            style={{
              backgroundColor: isMine ? '#6174D9' : '#F1F4F9',
              padding: '10px 15px'
            }}
          >
            <p className='mb-0'>{message.content}</p>
          </div>
        )}
        
        {/* Media content */}
        {message.type === 'MEDIA' && (
          <>
            {message.content && (
              <div
                className={`rounded-3 shadow-sm ${isMine ? 'text-white' : 'text-dark'} p-3`}
                style={{
                  backgroundColor: isMine ? '#6174D9' : '#F1F4F9'
                }}
              >
                <p className='mb-0'>{message.content}</p>
              </div>
            )}
            <div className={`mt-2 ${isMine ? 'align-self-end' : 'align-self-start'}`}>{renderMedia()}</div>
            {isError && <div className='text-danger small mt-1 text-center'>Gửi thất bại. Vui lòng thử lại.</div>}
          </>
        )}
        
        {/* Sticker */}
        {message.type === 'STICKER' && (
          <div style={{ maxWidth: '180px', maxHeight: '180px' }}>
            <img
              src={message.mediaUrls?.[0] || ''}
              alt='sticker'
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '12px',
                opacity: isSending ? 0.6 : 1,
                filter: isError ? 'grayscale(100%) blur(1px)' : 'none',
                cursor: 'pointer'
              }}
              onClick={() => setPreviewImage(message.mediaUrls?.[0] || null)}
            />
          </div>
        )}
      </>
    );

    return contentJSX;
  }

  return (
    <div
      className={`d-flex my-2 ${message.type === 'SYSTEM' ? 'justify-content-center w-100' : isMine ? 'justify-content-end' : 'justify-content-start'}`}
      onMouseEnter={() => message.type !== 'SYSTEM' && handleHover(true)}
      onMouseLeave={() => message.type !== 'SYSTEM' && handleHover(false)}
    >
      {!isMine && message.type !== 'SYSTEM' && (
        <div className='me-2'>
          <img
            src={avatar && avatar !== '/default-avatar.png' 
              ? avatar 
              : 'https://res.cloudinary.com/dm5ulzy7n/image/upload/v1748307746/z6642578626786_9c3f5e5b519e59140f14558806ec7d00--dfca98f0-c6cb-46ed-b57b-e87de3e712ce.jpg'}
            alt='avatar'
            className='rounded-circle'
            style={{ width: '28px', height: '28px', objectFit: 'cover' }}
          />
        </div>
      )}

      <div
        className={`d-flex flex-column ${
          message.type === 'SYSTEM'
            ? 'align-items-center text-center'
            : isMine
              ? 'align-items-end'
              : 'align-items-start'
        }`}
        style={{ maxWidth: message.type === 'SYSTEM' ? '90%' : '70%' }}
      >
        {!isMine && message.type !== 'SYSTEM' && conversationType === 'GROUP' && (
          <span className='small mb-1'>{displayName}</span>
        )}

        <div
          className={`d-flex align-items-center position-relative ${message.type === 'SYSTEM' ? 'justify-content-center' : ''}`}
          style={{ maxWidth: '100%' }}
        >
          {renderContent()}

          {isHovered && message.type !== 'SYSTEM' && (
            <div
              className='position-absolute'
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                [isMine ? 'left' : 'right']: '-100px',
                zIndex: 1,
                display: 'flex',
                gap: '10px',
                backgroundColor: 'white',
                borderRadius: '6px',
                padding: '5px'
              }}
            >
              <MessageActions messageId={message.id} handleRecall={onRecall} handleForward={handleForward} />
            </div>
          )}
        </div>

        {message.type !== 'SYSTEM' && (
          <div className='text-muted small' style={{ fontSize: '0.75rem', marginTop: '5px' }}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
        )}
      </div>

      {previewImage && (
        <ImagePreviewModal imageUrls={[previewImage]} initialIndex={0} onClose={() => setPreviewImage(null)} />
      )}

      {previewVideo && (
        <VideoPreviewModal videoUrls={[previewVideo]} initialIndex={0} onClose={() => setPreviewVideo(null)} />
      )}
    </div>
  )
}

export default MessageItem
