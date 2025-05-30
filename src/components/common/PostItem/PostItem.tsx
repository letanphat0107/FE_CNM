import React, { useState, useContext, useEffect } from 'react'
import { Post, PostShare, User } from 'src/types/post.type'
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
  onUpdatePrivacy?: (postId: number, privacy: 'PUBLIC' | 'PRIVATE' | 'FRIENDS') => void // Thêm callback này
  dropdownActions?: {
    edit?: boolean
    delete?: boolean
    save?: boolean
    report?: boolean
    editAudience?: boolean
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
  onUpdatePrivacy,
  dropdownActions = {
    edit: true,
    delete: true,
    save: true,
    report: true,
    editAudience: true
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

  // Thêm state cho audience modal
  const [showAudienceModal, setShowAudienceModal] = useState<boolean>(false)
  const [selectedPrivacy, setSelectedPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'FRIENDS'>(post.privacy)
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState<boolean>(false)

  // Thêm các state và function xử lý like/dislike
  // Thêm state mới cho phần likes
  const [likedUsers, setLikedUsers] = useState<User[]>(post.likedUsers || [])
  const [isLiking, setIsLiking] = useState<boolean>(false)
  const [isLiked, setIsLiked] = useState<boolean>(
    currentUser ? post.likedUsers.some((user) => user.userId === currentUser.userId) : false
  )
  const [loadingLikedUsers, setLoadingLikedUsers] = useState<boolean>(false)
  const [hasMoreLikes, setHasMoreLikes] = useState<boolean>(true)
  const [likePage, setLikePage] = useState<number>(0)

  // Xác định xem post này có hiển thị comments hay không
  const isCommentsVisible = typeof showComments === 'boolean' ? showComments : showComments && showComments[post.postId]

  // Kiểm tra xem người dùng hiện tại có phải là người tạo bài viết không
  const isOwner = currentUser && post.createdBy && currentUser.userId === post.createdBy.userId

  // Thêm state cho hiển thị modal shares, likes, comments
  const [showSharesModal, setShowSharesModal] = useState<boolean>(false)
  const [showLikesModal, setShowLikesModal] = useState<boolean>(false)
  const [showAllCommentsModal, setShowAllCommentsModal] = useState<boolean>(false)
  const [sharedUsers, setSharedUsers] = useState<PostShare[]>([])
  const [loadingShares, setLoadingShares] = useState<boolean>(false)
  const [page, setPage] = useState<number>(0)
  const [hasMoreShares, setHasMoreShares] = useState<boolean>(true)

  // Fetch số lượng shares khi component mount
  useEffect(() => {
    const fetchShareCount = async () => {
      try {
        const response = await feedApi.getListSharedFeed(post.postId, {
          page: 0,
          size: 5 // Chỉ lấy 5 người chia sẻ gần nhất để hiển thị số lượng
        })
        setSharedUsers(response.data.data)
      } catch (error) {
        console.error('Failed to fetch share count:', error)
      }
    }

    fetchShareCount()
  }, [post.postId])

  // Fetch người share post
  const fetchSharedUsers = async (reset: boolean = false) => {
    try {
      setLoadingShares(true)
      const newPage = reset ? 0 : page

      const response = await feedApi.getListSharedFeed(post.postId, {
        page: newPage,
        size: 10
      })

      const data = response.data.data

      if (reset) {
        setSharedUsers(data)
      } else {
        setSharedUsers((prev) => [...prev, ...data])
      }

      setHasMoreShares(data.length === 10)
      if (!reset) {
        setPage((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Failed to fetch shared users:', error)
      toast.error('Failed to load shared users.')
    } finally {
      setLoadingShares(false)
    }
  }

  // Hiển thị modal shares
  const handleShowSharesModal = async () => {
    setPage(0)
    setSharedUsers([])
    setShowSharesModal(true)
    await fetchSharedUsers(true)
  }

  // Load more shares
  const handleLoadMoreShares = () => {
    if (!loadingShares && hasMoreShares) {
      fetchSharedUsers()
    }
  }

  // Hiển thị modal comments
  const handleShowAllCommentsModal = () => {
    setShowAllCommentsModal(true)
    // Ở đây có thể fetch tất cả comments từ API nếu cần
  }

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

  // Xử lý cập nhật quyền riêng tư
  const handleUpdatePrivacy = async () => {
    if (!onUpdatePrivacy || selectedPrivacy === post.privacy) {
      setShowAudienceModal(false)
      return
    }

    try {
      setIsUpdatingPrivacy(true)
      await onUpdatePrivacy(post.postId, selectedPrivacy)
      setShowAudienceModal(false)
      toast.success('Audience updated successfully!')
    } catch (error) {
      console.error('Failed to update audience:', error)
      toast.error('Failed to update audience.')
    } finally {
      setIsUpdatingPrivacy(false)
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

  // Hàm xử lý like/unlike post
  const handleToggleLike = async () => {
    if (isLiking || !currentUser || !onLike) return

    try {
      setIsLiking(true)

      if (isLiked) {
        // Unlike post
        await feedApi.unlikeFeed(post.postId)
        setLikedUsers((prev) => prev.filter((user) => user.userId !== currentUser.userId))
        setIsLiked(false)
      } else {
        // Like post
        await feedApi.likeFeed(post.postId)
        // Thêm current user vào danh sách liked users
        setLikedUsers((prev) => [
          {
            userId: currentUser.userId,
            username: currentUser.username,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar || ''
          },
          ...prev
        ])
        setIsLiked(true)
      }

      // Gọi callback để cập nhật state ở component cha nếu cần
      onLike(post.postId)
    } catch (error) {
    } finally {
      setIsLiking(false)
    }
  }

  // Fetch danh sách người like với phân trang
  const fetchLikedUsers = async (reset: boolean = false) => {
    try {
      setLoadingLikedUsers(true)
      const newPage = reset ? 0 : likePage

      const response = await feedApi.getListUserLiked(post.postId, {
        page: newPage,
        size: 10
      })

      const data = response.data.data

      if (reset) {
        setLikedUsers(data)
      } else {
        setLikedUsers((prev) => [...prev, ...data])
      }

      setHasMoreLikes(data.length === 10)

      if (!reset) {
        setLikePage((prev) => prev + 1)
      }
    } catch (error) {
    } finally {
      setLoadingLikedUsers(false)
    }
  }

  // Hiển thị modal likes
  const handleShowLikesModal = async () => {
    setLikePage(0)
    setShowLikesModal(true)
    await fetchLikedUsers(true)
  }

  // Load more likes
  const handleLoadMoreLikes = () => {
    if (!loadingLikedUsers && hasMoreLikes) {
      fetchLikedUsers()
    }
  }

  return (
    <>
      <div className='post-card card mb-4'>
        <div className='card-body'>
          {/* Post header */}
          <div className='d-flex justify-content-between align-items-center mb-3'>
            <div className='d-flex align-items-center'>
              <img
                src={profile?.avatar || 'https://via.placeholder.com/48'}
                className='rounded-circle me-2'
                alt={profile?.displayName}
                width='48'
                height='48'
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/48'
                }}
              />
              <div>
                <h6 className='mb-0'>{profile?.displayName}</h6>
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
                  <i className='fas fa-ellipsis-v'></i>
                </button>
                <ul className='dropdown-menu dropdown-menu-end'>
                  {isOwner && dropdownActions?.edit && onEdit && (
                    <li>
                      <button className='dropdown-item' onClick={() => onEdit(post)}>
                        Edit post
                      </button>
                    </li>
                  )}
                  {isOwner && dropdownActions?.editAudience && onUpdatePrivacy && (
                    <li>
                      <button className='dropdown-item' onClick={() => setShowAudienceModal(true)}>
                        <i className='bi bi-people me-2'></i>Edit audience
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

          {/* Thêm phần hiển thị số lượng like, comment, shares */}
          <div className='d-flex justify-content-between align-items-center mb-2 mt-3'>
            <div className='d-flex align-items-center'>
              {post.likedUsers.length > 0 && (
                <div
                  className='me-3 d-flex align-items-center post-stat'
                  onClick={handleShowLikesModal}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className='bg-primary rounded-circle p-1 me-1 d-flex align-items-center justify-content-center'
                    style={{ width: '20px', height: '20px' }}
                  >
                    <i className='fas fa-thumbs-up text-white small'></i>
                  </div>
                  <span className='text-muted small'>{post.likedUsers.length}</span>
                </div>
              )}
            </div>

            <div className='d-flex'>
              {post.comments && post.comments.length > 0 && (
                <div
                  className='me-3 text-muted small post-stat'
                  onClick={handleShowAllCommentsModal}
                  style={{ cursor: 'pointer' }}
                >
                  {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                </div>
              )}

              {/* Hiển thị số lượng shares - khi click vào sẽ mở modal danh sách */}
              <div className='text-muted small post-stat' onClick={handleShowSharesModal} style={{ cursor: 'pointer' }}>
                {sharedUsers.length > 0 ? `${sharedUsers.length} shares` : 'View shares'}
              </div>
            </div>
          </div>

          {/* Đường kẻ phân cách */}
          <div className='border-top mb-2'></div>

          {/* Post actions*/}
          <div className='d-flex border-top border-bottom py-2 mt-3'>
            {onLike && (
              <button
                className={`btn ${isLiked ? 'btn-primary text-white' : 'btn-light'} flex-grow-1 d-flex align-items-center justify-content-center`}
                onClick={handleToggleLike}
                disabled={isLiking}
              >
                <i className={`bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} me-2`}></i>
                {isLiking ? 'Liking' : isLiked ? 'Liked' : 'Like'}
              </button>
            )}

            {toggleComments && (
              <button
                className='btn btn-light flex-grow-1 d-flex align-items-center justify-content-center'
                onClick={() => toggleComments(post.postId)}
              >
                <i className='bi bi-chat me-2'></i> Comment
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
        </div>
      </div>

      {/* Di chuyển tất cả các modal ra ngoài div post-card */}
      {/* Share Post Modal */}
      {showShareModal && (
        <div
          className='modal show d-block'
          tabIndex={-1}
          role='dialog'
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050 // Đảm bảo modal hiển thị trên tất cả các phần tử khác
          }}
        >
          <div
            className='modal-dialog modal-dialog-centered'
            role='document'
            style={{ maxWidth: '500px', margin: '0 auto' }}
          >
            <div className='modal-content' style={{ maxHeight: '90vh', overflow: 'hidden' }}>
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
                <div className='post-content-scroll' style={{ maxHeight: '350px', overflowY: 'auto', padding: '16px' }}>
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
                                  +{post.attachments.filter((att) => att.fileType.startsWith('image/')).length - 1} more
                                  images
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
                      <i className='fas fa-user-friends text-primary'></i> {/* bạn bè */}
                    </button>
                    <button className='btn btn-light rounded-circle me-1'>
                      <i className='fas fa-smile text-warning'></i> {/* emoji */}
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

      {/* Edit Audience Modal */}
      {showAudienceModal && (
        <div
          className='modal show d-block'
          tabIndex={-1}
          role='dialog'
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
          }}
        >
          <div className='modal-dialog modal-dialog-centered' role='document'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Select audience</h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowAudienceModal(false)}
                  aria-label='Close'
                ></button>
              </div>

              <div className='modal-body'>
                <div className='mb-3'>
                  <h6>Who can see your post?</h6>
                  <p className='text-muted small'>
                    Your post may show up in News Feed, on your profile, in search results, and in Messenger
                  </p>
                </div>

                <div className='audience-options'>
                  {/* Public option */}
                  <div
                    className={`audience-option d-flex align-items-center p-3 rounded mb-2 ${selectedPrivacy === 'PUBLIC' ? 'bg-light border' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPrivacy('PUBLIC')}
                  >
                    <div className='audience-icon bg-secondary bg-opacity-10 p-2 rounded-circle me-3'>
                      <i className='bi bi-globe fs-5'></i>
                    </div>
                    <div className='audience-details flex-grow-1'>
                      <h6 className='mb-0'>Public</h6>
                      <p className='text-muted small mb-0'>Anyone on or off the platform</p>
                    </div>
                    <div className='form-check'>
                      <input
                        className='form-check-input'
                        type='radio'
                        name='audience'
                        checked={selectedPrivacy === 'PUBLIC'}
                        onChange={() => setSelectedPrivacy('PUBLIC')}
                      />
                    </div>
                  </div>

                  {/* Friends option */}
                  <div
                    className={`audience-option d-flex align-items-center p-3 rounded mb-2 ${selectedPrivacy === 'FRIENDS' ? 'bg-light border' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPrivacy('FRIENDS')}
                  >
                    <div className='audience-icon bg-primary bg-opacity-10 p-2 rounded-circle me-3'>
                      <i className='bi bi-people-fill fs-5 text-primary'></i>
                    </div>
                    <div className='audience-details flex-grow-1'>
                      <h6 className='mb-0'>Friends</h6>
                      <p className='text-muted small mb-0'>Your friends on the platform</p>
                    </div>
                    <div className='form-check'>
                      <input
                        className='form-check-input'
                        type='radio'
                        name='audience'
                        checked={selectedPrivacy === 'FRIENDS'}
                        onChange={() => setSelectedPrivacy('FRIENDS')}
                      />
                    </div>
                  </div>

                  {/* Only me option */}
                  <div
                    className={`audience-option d-flex align-items-center p-3 rounded ${selectedPrivacy === 'PRIVATE' ? 'bg-light border' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPrivacy('PRIVATE')}
                  >
                    <div className='audience-icon bg-danger bg-opacity-10 p-2 rounded-circle me-3'>
                      <i className='bi bi-lock-fill fs-5 text-danger'></i>
                    </div>
                    <div className='audience-details flex-grow-1'>
                      <h6 className='mb-0'>Only me</h6>
                      <p className='text-muted small mb-0'>Only you can see your post</p>
                    </div>
                    <div className='form-check'>
                      <input
                        className='form-check-input'
                        type='radio'
                        name='audience'
                        checked={selectedPrivacy === 'PRIVATE'}
                        onChange={() => setSelectedPrivacy('PRIVATE')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className='modal-footer d-flex justify-content-between'>
                <button type='button' className='btn btn-outline-secondary' onClick={() => setShowAudienceModal(false)}>
                  Cancel
                </button>
                <button
                  type='button'
                  className='btn btn-primary'
                  onClick={handleUpdatePrivacy}
                  disabled={isUpdatingPrivacy || selectedPrivacy === post.privacy}
                >
                  {isUpdatingPrivacy ? (
                    <>
                      <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                      Updating...
                    </>
                  ) : (
                    'Done'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal danh sách người share */}
      {showSharesModal && (
        <div
          className='modal show d-block'
          tabIndex={-1}
          role='dialog'
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
          }}
        >
          <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable' role='document'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>People who shared this</h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowSharesModal(false)}
                  aria-label='Close'
                ></button>
              </div>

              <div className='modal-body p-0' style={{ maxHeight: '70vh' }}>
                {loadingShares && sharedUsers.length === 0 ? (
                  <div className='text-center py-4'>
                    <div className='spinner-border text-primary' role='status'>
                      <span className='visually-hidden'>Loading...</span>
                    </div>
                    <p className='mt-2'>Loading shared users...</p>
                  </div>
                ) : sharedUsers.length === 0 ? (
                  <div className='text-center py-4'>
                    <i className='bi bi-share fs-1 text-muted'></i>
                    <p className='mt-2'>No one has shared this post yet</p>
                  </div>
                ) : (
                  <ul className='list-group list-group-flush'>
                    {sharedUsers.map((share) => (
                      <li key={share.shareId} className='list-group-item'>
                        <div className='d-flex align-items-center justify-content-between p-2'>
                          <div className='d-flex align-items-center'>
                            <img
                              src={share.sharedBy.avatar || 'https://via.placeholder.com/40'}
                              className='rounded-circle me-3'
                              alt={share.sharedBy.displayName}
                              width='40'
                              height='40'
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'
                              }}
                            />
                            <div>
                              <h6 className='mb-0'>{share.sharedBy.displayName}</h6>
                              <div className='d-flex align-items-center'>
                                <small className='text-muted'>{formatPostTime(share.sharedAt)}</small>
                                {/* Hiển thị privacy icon nếu API trả về */}
                                <small className='text-muted ms-2'>
                                  <i className='bi bi-globe'></i>
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className='dropdown'>
                            <button className='btn btn-sm btn-light rounded-circle' type='button'>
                              <i className='bi bi-three-dots'></i>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Load more button */}
                {hasMoreShares && sharedUsers.length > 0 && (
                  <div className='text-center p-3 border-top'>
                    <button className='btn btn-sm btn-light' onClick={handleLoadMoreShares} disabled={loadingShares}>
                      {loadingShares ? (
                        <>
                          <span
                            className='spinner-border spinner-border-sm me-2'
                            role='status'
                            aria-hidden='true'
                          ></span>
                          Loading...
                        </>
                      ) : (
                        'Load more'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal danh sách người like */}
      {showLikesModal && (
        <div
          className='modal show d-block'
          tabIndex={-1}
          role='dialog'
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
          }}
        >
          <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable' role='document'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>People who liked this</h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowLikesModal(false)}
                  aria-label='Close'
                ></button>
              </div>

              <div className='modal-body p-0' style={{ maxHeight: '70vh' }}>
                {loadingLikedUsers && likedUsers.length === 0 ? (
                  <div className='text-center py-4'>
                    <div className='spinner-border text-primary' role='status'>
                      <span className='visually-hidden'>Loading...</span>
                    </div>
                    <p className='mt-2'>Loading likes...</p>
                  </div>
                ) : likedUsers.length > 0 ? (
                  <ul className='list-group list-group-flush'>
                    {likedUsers.map((user) => (
                      <li key={user.userId} className='list-group-item'>
                        <div className='d-flex align-items-center p-2'>
                          <img
                            src={user.avatar || 'https://via.placeholder.com/40'}
                            className='rounded-circle me-3'
                            alt={user.displayName}
                            width='40'
                            height='40'
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'
                            }}
                          />
                          <div className='flex-grow-1'>
                            <h6 className='mb-0'>{user.displayName}</h6>
                            <small className='text-muted'>@{user.username}</small>
                          </div>

                          {/* Hiển thị nút Follow nếu người dùng hiện tại không phải là người này */}
                          {currentUser && currentUser.userId !== user.userId && (
                            <button className='btn btn-sm btn-outline-primary rounded-pill'>Follow</button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className='text-center py-4'>
                    <i className='bi bi-heart fs-1 text-muted'></i>
                    <p className='mt-2'>No one has liked this post yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị tất cả comments */}
      {showAllCommentsModal && (
        <div
          className='modal show d-block'
          tabIndex={-1}
          role='dialog'
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
          }}
        >
          <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg' role='document'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Comments</h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowAllCommentsModal(false)}
                  aria-label='Close'
                ></button>
              </div>

              <div className='modal-body' style={{ maxHeight: '70vh' }}>
                {/* Post preview */}
                <div className='post-preview mb-4'>
                  <div className='d-flex align-items-center mb-2'>
                    <img
                      src={post.createdBy.avatar || 'https://via.placeholder.com/40'}
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
                  <p className='mb-0'>
                    {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                  </p>
                </div>

                <hr />

                {/* Comments list */}
                {post.comments && post.comments.length > 0 ? (
                  <div className='comments-list'>
                    {post.comments.map((comment) => (
                      <div key={comment.commentId} className='mb-4'>
                        <div className='d-flex'>
                          <img
                            src={comment.commentedBy.avatar || 'https://via.placeholder.com/40'}
                            className='rounded-circle me-2'
                            alt={comment.commentedBy.displayName}
                            width='40'
                            height='40'
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'
                            }}
                          />
                          <div className='flex-grow-1'>
                            <div className='bg-light rounded p-3'>
                              <h6 className='mb-1'>{comment.commentedBy.displayName}</h6>
                              <p className='mb-1'>{comment.content}</p>
                            </div>
                            <div className='d-flex mt-1 align-items-center'>
                              <small className='text-muted'>{formatPostTime(comment.createdAt)}</small>
                              <button className='btn btn-sm text-primary ms-2'>Reply</button>
                            </div>

                            {/* Nested replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className='replies ms-4 mt-3'>
                                {comment.replies.map((reply) => (
                                  <div key={reply.commentId} className='d-flex mb-3'>
                                    <img
                                      src={reply.commentedBy.avatar || 'https://via.placeholder.com/32'}
                                      className='rounded-circle me-2'
                                      alt={reply.commentedBy.displayName}
                                      width='32'
                                      height='32'
                                      onError={(e) => {
                                        ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/32'
                                      }}
                                    />
                                    <div className='flex-grow-1'>
                                      <div className='bg-light rounded p-2'>
                                        <h6 className='mb-1'>{reply.commentedBy.displayName}</h6>
                                        <p className='mb-0'>{reply.content}</p>
                                      </div>
                                      <div className='d-flex mt-1 align-items-center'>
                                        <small className='text-muted'>{formatPostTime(reply.createdAt)}</small>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-4'>
                    <i className='bi bi-chat-text fs-1 text-muted'></i>
                    <p className='mt-2'>No comments yet</p>
                  </div>
                )}

                {/* Add new comment */}
                <div className='add-comment d-flex mt-3'>
                  <img
                    src={currentUser?.avatar || 'https://via.placeholder.com/40'}
                    className='rounded-circle me-2'
                    alt='Your profile'
                    width='40'
                    height='40'
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'
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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PostItem
