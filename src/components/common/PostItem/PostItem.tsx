import React, { useState, useContext } from 'react'
import { Post, User } from 'src/types/post.type'
import { AppContext } from 'src/contexts/app.context'
import { toast } from 'react-toastify'
import feedApi from 'src/apis/feed.api'
import './PostItem.css'

export interface PostItemProps {
  post: Post
  currentUser?: User | null
  onComment?: (postId: number, content: string) => void
  onLike?: (postId: number) => void
  onShare?: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (postId: number) => void
  onReport?: (postId: number) => void
  onSave?: (postId: number) => void
  dropdownActions?: {
    edit?: boolean
    delete?: boolean
    save?: boolean
    report?: boolean
    custom?: Array<{
      label: string
      onClick: (post: Post) => void
      className?: string
    }>
  }
  showComments?: boolean | Record<number, boolean>
  toggleComments?: (postId: number) => void
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  currentUser,
  onComment,
  onLike,
  onShare,
  onEdit,
  onDelete,
  onReport,
  onSave,
  dropdownActions = {
    edit: true,
    delete: true,
    save: true,
    report: true
  },
  showComments,
  toggleComments
}) => {
  const { profile } = useContext(AppContext)
  const [newComment, setNewComment] = useState<string>('')
  // State cho modal share
  const [showShareModal, setShowShareModal] = useState<boolean>(false)
  const [shareContent, setShareContent] = useState<string>('')
  const [sharePrivacy, setSharePrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'FRIENDS'>('PUBLIC')
  const [isSharing, setIsSharing] = useState<boolean>(false)

  // Xác định xem post này có hiển thị comments hay không
  const isCommentsVisible = typeof showComments === 'boolean' ? showComments : showComments && showComments[post.postId]

  // Kiểm tra xem người dùng hiện tại có phải là người tạo bài viết không
  const isOwner = currentUser && currentUser.userId === post.createdBy.userId

  // Xử lý thêm comment
  const handleAddComment = () => {
    if (!newComment.trim() || !onComment) return
    onComment(post.postId, newComment)
    setNewComment('')
  }

  // Xử lý share post
  const handleOpenShareModal = () => {
    setShareContent('') // Reset content
    setSharePrivacy('PUBLIC') // Reset privacy setting
    setShowShareModal(true)
  }

  // Xử lý submit share
  const handleShareSubmit = async () => {
    try {
      setIsSharing(true)

      // Gọi API để share post
      await feedApi.shareFeed(post.postId, {
        content: shareContent,
        privacy: sharePrivacy
      })

      // Đóng modal và thông báo thành công
      setShowShareModal(false)
      toast.success('Post shared successfully!')

      // Nếu có callback onShare thì gọi
      if (onShare) {
        onShare(post)
      }
    } catch (error) {
      console.error('Failed to share post:', error)
      toast.error('Failed to share post. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  // Hàm định dạng thời gian
  const formatPostTime = (dateString: string): string => {
    const now = new Date()
    const postDate = new Date(dateString)
    const diffMs = now.getTime() - postDate.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    }

    const diffHours = Math.round(diffMins / 60)
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    }

    const diffDays = Math.round(diffHours / 24)
    if (diffDays === 1) {
      return 'Yesterday'
    }

    return postDate.toLocaleDateString()
  }

  // Styles for image grid
  const gridStyles: Record<number, React.CSSProperties> = {
    1: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '300px',
      gap: '4px'
    },
    2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '200px',
      gap: '4px'
    },
    3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '150px 150px',
      gap: '4px'
    },
    4: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '150px 150px',
      gap: '4px'
    }
  }

  return (
    <div className='post-card card mb-4'>
      <div className='card-body'>
        {/* Post header */}
        <div className='d-flex justify-content-between align-items-center mb-3'>
          <div className='d-flex align-items-center'>
            <img
              src={post.createdBy.avatar || 'https://via.placeholder.com/48'}
              className='rounded-circle me-2'
              alt={post.createdBy.displayName}
              width='48'
              height='48'
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/48'
              }}
            />
            <div>
              <h6 className='mb-0'>{post.createdBy.displayName}</h6>
              <small className='text-muted d-block'>{formatPostTime(post.createdAt)}</small>
            </div>
          </div>

          {/* Dropdown menu with configurable actions */}
          {(dropdownActions?.edit ||
            dropdownActions?.delete ||
            dropdownActions?.save ||
            dropdownActions?.report ||
            (dropdownActions?.custom && dropdownActions.custom.length > 0)) && (
            <div className='dropdown'>
              <button className='btn' data-bs-toggle='dropdown'>
                <i className='bi bi-three-dots-vertical'></i>
              </button>
              <ul className='dropdown-menu dropdown-menu-end'>
                {isOwner && dropdownActions?.edit && onEdit && (
                  <li>
                    <button className='dropdown-item' onClick={() => onEdit(post)}>
                      Edit post
                    </button>
                  </li>
                )}
                {isOwner && dropdownActions?.delete && onDelete && (
                  <li>
                    <button className='dropdown-item text-danger' onClick={() => onDelete(post.postId)}>
                      Delete post
                    </button>
                  </li>
                )}
                {dropdownActions?.save && onSave && (
                  <li>
                    <button className='dropdown-item' onClick={() => onSave(post.postId)}>
                      Save post
                    </button>
                  </li>
                )}
                {dropdownActions?.report && onReport && (
                  <li>
                    <button className='dropdown-item' onClick={() => onReport(post.postId)}>
                      Report
                    </button>
                  </li>
                )}

                {/* Custom dropdown items */}
                {dropdownActions?.custom &&
                  dropdownActions.custom.map((item, index) => (
                    <li key={index}>
                      <button className={`dropdown-item ${item.className || ''}`} onClick={() => item.onClick(post)}>
                        {item.label}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Post content */}
        <p>{post.content}</p>

        {/* Post images if any */}
        {post.attachments &&
          post.attachments.length > 0 &&
          post.attachments.some((att) => att.fileType.startsWith('image/')) && (
            <div className='post-images mb-3'>
              <div
                className={`image-grid image-grid-${Math.min(
                  post.attachments.filter((att) => att.fileType.startsWith('image/')).length,
                  4
                )}`}
                style={
                  gridStyles[Math.min(post.attachments.filter((att) => att.fileType.startsWith('image/')).length, 4)]
                }
              >
                {post.attachments
                  .filter((att) => att.fileType.startsWith('image/'))
                  .slice(0, 4)
                  .map((attachment, index) => (
                    <div
                      key={attachment.mediaId}
                      className='image-item position-relative'
                      style={{
                        height: '100%',
                        width: '100%',
                        overflow: 'hidden'
                      }}
                    >
                      {/* If this is the 4th image and we have more than 4 images */}
                      {index === 3 &&
                        post.attachments.filter((att) => att.fileType.startsWith('image/')).length > 4 && (
                          <div className='position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 text-white'>
                            <h3>+{post.attachments.filter((att) => att.fileType.startsWith('image/')).length - 4}</h3>
                          </div>
                        )}
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.originalFileName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/300x200?text=Image+not+available'
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Post actions - Cập nhật phần này */}
        <div className='d-flex border-top border-bottom py-2 mt-3'>
          {onLike && (
            <button
              className='btn btn-light flex-grow-1 d-flex align-items-center justify-content-center'
              onClick={() => onLike(post.postId)}
            >
              <i className='bi bi-hand-thumbs-up me-2'></i> Like ({post.likedUsers.length})
            </button>
          )}

          {toggleComments && (
            <button
              className='btn btn-light flex-grow-1 d-flex align-items-center justify-content-center'
              onClick={() => toggleComments(post.postId)}
            >
              <i className='bi bi-chat me-2'></i> Comment ({post.comments?.length || 0})
            </button>
          )}

          {/* Chỉnh sửa nút Share để mở modal */}
          <button
            className='btn btn-light flex-grow-1 d-flex align-items-center justify-content-center'
            onClick={handleOpenShareModal}
          >
            <i className='bi bi-share me-2'></i> Share
          </button>
        </div>

        {/* Comments section */}
        {isCommentsVisible && (
          <div className='comments-section mt-3'>
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.commentId} className='comment d-flex mb-3'>
                  <img
                    src={comment.commentedBy.avatar || 'https://via.placeholder.com/36'}
                    className='rounded-circle me-2'
                    alt={comment.commentedBy.displayName}
                    width='36'
                    height='36'
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/36'
                    }}
                  />
                  <div className='comment-bubble'>
                    <div className='bg-light rounded p-2'>
                      <h6 className='mb-0'>{comment.commentedBy.displayName}</h6>
                      <p className='mb-0'>{comment.content}</p>
                    </div>
                    <small className='text-muted'>{formatPostTime(comment.createdAt)}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-center text-muted my-3'>No comments yet</p>
            )}

            {/* Add comment */}
            {onComment && currentUser && (
              <div className='add-comment d-flex mt-3'>
                <img
                  src={currentUser.avatar || 'https://via.placeholder.com/36'}
                  className='rounded-circle me-2'
                  alt={currentUser.displayName}
                  width='36'
                  height='36'
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/36'
                  }}
                />
                <div className='input-group'>
                  <input
                    type='text'
                    className='form-control rounded-pill'
                    placeholder='Write a comment...'
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button className='btn btn-primary rounded-circle ms-2' onClick={handleAddComment}>
                    <i className='bi bi-send'></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share Post Modal */}
        {showShareModal && (
          <div
            className='modal show d-block'
            tabIndex={-1}
            role='dialog'
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className='modal-dialog' role='document' style={{ maxWidth: '500px', margin: '2rem auto' }}>
              <div className='modal-content' style={{ maxHeight: '660px' }}>
                <div className='modal-header'>
                  <h5 className='modal-title'>Share post</h5>
                  <button
                    type='button'
                    className='btn-close'
                    onClick={() => setShowShareModal(false)}
                    aria-label='Close'
                  ></button>
                </div>

                <div className='modal-body p-0'>
                  <div className='d-flex align-items-center p-3 border-bottom'>
                    <img
                      src={profile?.avatar || 'https://via.placeholder.com/40'}
                      className='rounded-circle me-2'
                      alt={profile?.displayName || 'Profile'}
                      width='40'
                      height='40'
                    />
                    <div>
                      <h6 className='mb-0'>{profile?.displayName || 'User'}</h6>
                      <div className='dropdown'>
                        <button
                          className='btn btn-sm btn-outline-secondary dropdown-toggle'
                          type='button'
                          data-bs-toggle='dropdown'
                          aria-expanded='false'
                        >
                          <i className='bi bi-lock-fill me-1'></i>
                          {sharePrivacy}
                        </button>
                        <ul className='dropdown-menu'>
                          <li>
                            <button className='dropdown-item' onClick={() => setSharePrivacy('PUBLIC')}>
                              Public
                            </button>
                          </li>
                          <li>
                            <button className='dropdown-item' onClick={() => setSharePrivacy('PRIVATE')}>
                              Only me
                            </button>
                          </li>
                          <li>
                            <button className='dropdown-item' onClick={() => setSharePrivacy('FRIENDS')}>
                              Friends
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Scroll area for content and shared post */}
                  <div
                    className='post-content-scroll'
                    style={{ maxHeight: '350px', overflowY: 'auto', padding: '16px' }}
                  >
                    <textarea
                      className='form-control border-0 mb-3'
                      value={shareContent}
                      onChange={(e) => setShareContent(e.target.value)}
                      rows={3}
                      placeholder="What's on your mind?"
                      style={{ resize: 'none' }}
                    ></textarea>

                    {/* Shared Post Preview */}
                    <div className='shared-post-preview border rounded mb-3'>
                      <div className='p-3'>
                        <div className='d-flex align-items-center mb-2'>
                          <img
                            src={post.createdBy.avatar || 'https://via.placeholder.com/32'}
                            className='rounded-circle me-2'
                            alt={post.createdBy.displayName}
                            width='32'
                            height='32'
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/32'
                            }}
                          />
                          <div>
                            <h6 className='mb-0'>{post.createdBy.displayName}</h6>
                            <small className='text-muted'>{formatPostTime(post.createdAt)}</small>
                          </div>
                        </div>

                        {/* Original post content - truncated */}
                        <p className='mb-2'>
                          {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                        </p>

                        {/* Original post image (if any) - show only first image */}
                        {post.attachments &&
                          post.attachments.length > 0 &&
                          post.attachments.some((att) => att.fileType.startsWith('image/')) && (
                            <div className='shared-post-image'>
                              <img
                                src={
                                  post.attachments.find((att) => att.fileType.startsWith('image/'))?.fileUrl ||
                                  'https://via.placeholder.com/300x150?text=Image+not+available'
                                }
                                alt='Post image'
                                className='img-fluid rounded'
                                style={{ maxHeight: '150px', width: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src =
                                    'https://via.placeholder.com/300x150?text=Image+not+available'
                                }}
                              />
                              {post.attachments.filter((att) => att.fileType.startsWith('image/')).length > 1 && (
                                <div className='mt-1 text-center'>
                                  <small className='text-muted'>
                                    +{post.attachments.filter((att) => att.fileType.startsWith('image/')).length - 1}{' '}
                                    more images
                                  </small>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className='d-flex align-items-center justify-content-between border-top border-bottom p-2'>
                    <div className='ms-2'>Share with your audience</div>
                    <div className='d-flex align-items-center'>
                      <button className='btn btn-light rounded-circle me-1'>
                        <i className='bi bi-people-fill text-primary'></i> {/* bạn bè */}
                      </button>
                      <button className='btn btn-light rounded-circle me-1'>
                        <i className='bi bi-emoji-smile text-warning'></i> {/* emoji */}
                      </button>
                    </div>
                  </div>
                </div>

                <div className='modal-footer'>
                  <button
                    type='button'
                    className='btn btn-primary w-100 rounded-pill'
                    onClick={handleShareSubmit}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <>
                        <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                        Sharing...
                      </>
                    ) : (
                      'Share post'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PostItem
