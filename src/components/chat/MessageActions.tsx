import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import messageAPI from 'src/apis/message.api'
import DeleteMessageModal from './DeleteMessageModal'

interface MessageActionsProps {
  handleRecall: (messageId: string) => void
  handleForward: () => void
  messageId: string
  handleDelete?: (messageId: string) => void // Thêm prop xóa tin nhắn
}

const emojiList = ['❤️', '😆', '😮', '😢', '😡', '👍', '👎']

const MessageActions = ({ handleRecall, handleForward, messageId, handleDelete }: MessageActionsProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleReact = () => {
    console.log('React action triggered')
    // Xử lý hành động React tại đây
  }

  const handleCopy = () => {
    console.log('Copy action triggered')
    setShowDropdown(false)
    // Thêm logic copy nội dung tại đây
  }

  // Hiện modal xác nhận
  const onDeleteClick = () => {
    setShowDeleteModal(true)
  }

  // Xử lý xóa tin nhắn
  const confirmDelete = async () => {
    if (!messageId || isDeleting) return
    
    try {
      setIsDeleting(true)
      
      await messageAPI.deleteMessage(messageId)
      toast.success('Đã xóa tin nhắn')
      
      // Gọi callback xóa tin nhắn nếu có
      if (handleDelete) {
        handleDelete(messageId)
      }
      
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Failed to delete message:', error)
      toast.error('Không thể xóa tin nhắn')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className='message-actions'>
        <svg
          onClick={handleForward}
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          className='action-icon'
          style={{ cursor: 'pointer' }}
        >
          <path
            d='M7 17L17 7M17 7H8M17 7V16'
            stroke='#b0b0b0'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>

        <svg
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          fill='#b0b0b0'
          viewBox='0 0 1000 1000'
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          className='action-icon'
          style={{ cursor: 'pointer' }}
        >
          <path d='M500 70q-117 0-217 59-97 57-154 154-59 100-59 217t59 217q57 97 154 154 100 59 217 59t217-59q97-57 154-154 59-100 59-217t-59-217q-57-97-154-154-100-59-217-59zm189 233q21 0 38.5 12t25.5 31.5 4 40-19 35.5-36 19.5-40.5-4-31-26T619 373q0-29 20.5-49.5T689 303zm-377 0q29 0 49 20.5t20 49.5-20 49.5-49 20.5-49.5-20.5T242 373t20.5-49.5T311 303h1zm472 255q-9 70-49.5 126.5t-102 89T500 806t-132.5-32.5-102-89T216 558q-2-15 8.5-27t25.5-12h500q15 0 25.5 12t8.5 27z' />
        </svg>

        {showEmojiPicker && (
          <div
            ref={pickerRef}
            className='mt-1'
            style={{
              position: 'absolute',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 15,
              padding: '6px 8px',
              display: 'flex',
              gap: '8px',
              top: '100%',
              left: 0
            }}
          >
            {emojiList.map((emoji) => (
              <span
                key={emoji}
                style={{
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease-in-out'
                }}
                onClick={() => {
                  console.log(`Reacted with: ${emoji}`)
                  setShowEmojiPicker(false)
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}

        <div ref={dropdownRef} className='position-relative'>
          <svg
            onClick={() => setShowDropdown((prev) => !prev)}
            viewBox='0 0 24 24'
            fill='none'
            width='20'
            height='20'
            className='action-icon'
            style={{ cursor: 'pointer' }}
          >
            <circle cx='18' cy='12' r='1.5' transform='rotate(90 18 12)' fill='#b0b0b0' />
            <circle cx='12' cy='12' r='1.5' transform='rotate(90 12 12)' fill='#b0b0b0' />
            <circle cx='6' cy='12' r='1.5' transform='rotate(90 6 12)' fill='#b0b0b0' />
          </svg>

          {showDropdown && (
            <div
              className='dropdown-menu show'
              style={{ display: 'block', position: 'absolute', top: '120%', left: 0, zIndex: 1000 }}
            >
              <button className='dropdown-item' onClick={handleCopy}>
                <i className="fas fa-copy me-2"></i> Sao chép
              </button>
              <button
                className='dropdown-item'
                onClick={() => {
                  handleRecall(messageId)
                  setShowDropdown(false)
                }}
              >
                <i className="fas fa-undo me-2"></i> Thu hồi
              </button>
              <button
                className='dropdown-item'
                onClick={onDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="fas fa-trash fa-fw text-danger me-2"></i>
                )}
                Xóa tin nhắn
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      <DeleteMessageModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  )
}

export default MessageActions
