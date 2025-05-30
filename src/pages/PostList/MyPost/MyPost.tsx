import React, { useContext, useState, useEffect, useRef } from 'react'
import { AppContext } from 'src/contexts/app.context'
import { Post } from 'src/types/post.type'
import feedApi from 'src/apis/feed.api'
import { toast } from 'react-toastify'
import './MyPost.css'
import PostItem from 'src/components/common/PostItem/PostItem'

export default function MyPost() {
  const { profile } = useContext(AppContext)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [newComment, setNewComment] = useState<string>('')
  const [showComments, setShowComments] = useState<Record<number, boolean>>({})

  // Thêm state để quản lý modal chỉnh sửa
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editContent, setEditContent] = useState<string>('')
  const [editPrivacy, setEditPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'FRIENDS'>('PUBLIC')
  const [uploadedFilesEdit, setUploadedFilesEdit] = useState<File[]>([])
  const [filesToDelete, setFilesToDelete] = useState<number[]>([])
  const [isUpdatingPost, setIsUpdatingPost] = useState<boolean>(false)
  const fileInputEditRef = useRef<HTMLInputElement>(null)
  const [fileInputEditKey, setFileInputEditKey] = useState<number>(0)

  // Fetch posts when component mounts
  useEffect(() => {
    fetchMyPosts()
  }, [])

  // Fetch more posts when page changes
  useEffect(() => {
    if (page > 0) {
      fetchMorePosts()
    }
  }, [page])

  // Fetch initial posts
  const fetchMyPosts = async () => {
    try {
      setLoading(true)
      const response = await feedApi.getMyFeed({ page: 0, size: 10 })
      const data = response.data.data
      setPosts(data.posts)
      setHasMore(page < data.totalPages - 1)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      toast.error('Failed to load posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch more posts for infinite scrolling
  const fetchMorePosts = async () => {
    try {
      setLoading(true)
      const response = await feedApi.getMyFeed({ page, size: 10 })
      const data = response.data.data
      setPosts((prev) => [...prev, ...data.posts])
      setHasMore(page < data.totalPages - 1)
    } catch (error) {
      console.error('Failed to fetch more posts:', error)
      toast.error('Failed to load more posts.')
    } finally {
      setLoading(false)
    }
  }

  // Load more posts
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  // Toggle comments visibility
  const toggleComments = (postId: number) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Format post time
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

  // Handle adding a comment
  const handleAddComment = async (postId: number, content: string) => {
    if (!content.trim()) return

    try {
      // Here you would call the API to add a comment
      // For now, we'll just update the UI optimistically
      toast.success('Comment added successfully!')
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Failed to add comment.')
    }
  }

  // Handle post deletion
  const handleDeletePost = async (postId: number) => {
    try {
      await feedApi.deleteFeed(postId)
      setPosts(posts.filter((post) => post.postId !== postId))
      toast.success('Post deleted successfully!')
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('Failed to delete post.')
    }
  }

  // Function để mở modal chỉnh sửa
  const handleEditButtonClick = (post: Post) => {
    setEditingPost(post)
    setEditContent(post.content)
    setEditPrivacy(post.privacy as 'PUBLIC' | 'PRIVATE' | 'FRIENDS')
    setUploadedFilesEdit([])
    setFilesToDelete([])
    setShowEditModal(true)
  }

  // Xử lý thay đổi file trong mode chỉnh sửa
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)

      // Kiểm tra giới hạn tệp
      const existingImages =
        editingPost?.attachments.filter(
          (att) => att.fileType.startsWith('image/') && !filesToDelete.includes(att.mediaId)
        ).length || 0

      const totalFiles = existingImages + uploadedFilesEdit.length + filesArray.length

      if (totalFiles > MAX_FILES) {
        alert(`You can only have up to ${MAX_FILES} files in total. Please remove some files first.`)
        setFileInputEditKey((prev) => prev + 1)
        return
      }

      setUploadedFilesEdit((prevFiles) => [...prevFiles, ...filesArray])
      setFileInputEditKey((prev) => prev + 1)
    }
  }

  // Xóa file mới đã tải lên
  const removeEditFile = (index: number) => {
    const newFiles = [...uploadedFilesEdit]
    newFiles.splice(index, 1)
    setUploadedFilesEdit(newFiles)
  }

  // Đánh dấu file cũ để xóa
  const markFileToDelete = (mediaId: number) => {
    setFilesToDelete((prev) => [...prev, mediaId])
  }

  // Khôi phục file đã đánh dấu xóa
  const restoreFile = (mediaId: number) => {
    setFilesToDelete((prev) => prev.filter((id) => id !== mediaId))
  }

  // Xử lý cập nhật bài viết
  const handleUpdatePost = async () => {
    if (
      !editingPost ||
      (!editContent.trim() &&
        uploadedFilesEdit.length === 0 &&
        editingPost.attachments.filter((att) => !filesToDelete.includes(att.mediaId)).length === 0)
    ) {
      return
    }

    try {
      setIsUpdatingPost(true)

      // Tạo FormData để gửi lên server
      const formData = new FormData()
      formData.append('content', editContent)
      formData.append('privacy', editPrivacy)

      // Thêm các file mới
      uploadedFilesEdit.forEach((file) => {
        formData.append('newFiles', file)
      })

      // Thêm các ID file cần xóa
      filesToDelete.forEach((mediaId) => {
        formData.append('filesToDelete', mediaId.toString())
      })

      // Gọi API cập nhật bài viết
      const response = await feedApi.updateFeed(editingPost.postId, formData)
      const updatedPost = response.data.data

      // Cập nhật state với bài viết đã cập nhật
      setPosts((posts) => posts.map((post) => (post.postId === updatedPost.postId ? updatedPost : post)))

      // Đóng modal và reset state
      setShowEditModal(false)
      setEditingPost(null)
      setUploadedFilesEdit([])
      setFilesToDelete([])

      toast.success('Post updated successfully!')
    } catch (error) {
      console.error('Failed to update post:', error)
      toast.error('Failed to update post. Please try again.')
    } finally {
      setIsUpdatingPost(false)
    }
  }

  // Constants
  const MAX_FILES = 10

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

  function handleLikePost(postId: number): void {
    throw new Error('Function not implemented.')
  }

  // Thêm hàm xử lý cập nhật quyền riêng tư
  const handleUpdatePrivacy = async (postId: number, privacy: 'PUBLIC' | 'PRIVATE' | 'FRIENDS') => {
    try {
      const response = await feedApi.updatePrivacy(postId, { privacy })
      const updatedPost = response.data.data

      // Cập nhật state với bài viết đã cập nhật quyền riêng tư
      setPosts((posts) => posts.map((post) => (post.postId === updatedPost.postId ? updatedPost : post)))

      toast.success('Post audience updated successfully!')
    } catch (error) {
      console.error('Failed to update post audience:', error)
      toast.error('Failed to update post audience.')
    }
  }

  // Cập nhật hàm handleSavePost để gọi API và theo dõi trạng thái save
  const handleSavePost = async (postId: number) => {
    try {
      // Tìm post trong danh sách hiện tại
      const post = posts.find((p) => p.postId === postId)
      if (!post) return

      // Kiểm tra post đã được save chưa
      const isSaved = post.isSaved

      // Cập nhật state tạm thời
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.postId === postId) {
            return { ...p, isSaved: !isSaved }
          }
          return p
        })
      )

      // Gọi API tương ứng
      if (isSaved) {
        await feedApi.removeFavoriteFeed(postId)
        toast.success('Post removed from favorites successfully!')
      } else {
        await feedApi.addFavoriteFeed(postId)
        toast.success('Post saved to favorites successfully!')
      }
    } catch (error) {
      console.error('Failed to update favorite status:', error)
      toast.error('Failed to update favorite status')

      // Revert optimistic update on error
      const response = await feedApi.getMyFeed({ page: 0, size: 10 })
      const data = response.data.data
      setPosts(data.posts)
    }
  }

  return (
    <div className='my-posts-container'>
      <div className='container py-4'>
        <div className='row'>
          {/* Main content column */}
          <div className='col-md-8'>
            {loading && posts.length === 0 ? (
              <div className='text-center py-5'>
                <div className='spinner-border text-primary' role='status'>
                  <span className='visually-hidden'>Loading...</span>
                </div>
                <p className='mt-2'>Loading your posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className='text-center py-5'>
                <div className='mb-3'>
                  <i className='bi bi-file-earmark-post fs-1 text-muted'></i>
                </div>
                <h5>You haven't created any posts yet</h5>
                <p className='text-muted'>When you create posts, they will appear here.</p>
              </div>
            ) : (
              <div
                className='posts-container'
                style={{
                  maxWidth: '100%',
                  margin: '0 auto'
                }}
              >
                {/* Posts */}
                {posts.map((post) => (
                  <PostItem
                    key={post.postId}
                    post={post}
                    currentUser={
                      profile
                        ? {
                            userId: profile.userId,
                            username: profile.username,
                            displayName: profile.displayName,
                            avatar: profile.avatar || ''
                          }
                        : null
                    }
                    onComment={(postId, content) => handleAddComment(postId, content)}
                    onLike={(postId) => handleLikePost(postId)}
                    onEdit={(post) => handleEditButtonClick(post)}
                    onDelete={(postId) => handleDeletePost(postId)}
                    onUpdatePrivacy={handleUpdatePrivacy}
                    onSave={(postId) => {
                      handleSavePost(postId)
                    }}
                    // Chỉ hiển thị Edit và Delete cho MyPost
                    dropdownActions={{
                      edit: true,
                      delete: true,
                      save: true,
                      report: false,
                      editAudience: true
                    }}
                    showComments={showComments}
                    toggleComments={(postId) => toggleComments(postId)}
                  />
                ))}

                {/* Load more button */}
                {hasMore && (
                  <div className='text-center mb-4'>
                    <button className='btn btn-outline-primary rounded-pill px-4' onClick={loadMore} disabled={loading}>
                      {loading ? (
                        <>
                          <span
                            className='spinner-border spinner-border-sm me-2'
                            role='status'
                            aria-hidden='true'
                          ></span>
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className='col-md-4'>
            <div className='card'>
              <div className='card-header bg-white'>
                <h5 className='mb-0'>Post Statistics</h5>
              </div>
              <div className='card-body'>
                <div className='d-flex justify-content-between mb-3'>
                  <div className='text-center'>
                    <h5>{posts.length}</h5>
                    <div className='text-muted small'>Total Posts</div>
                  </div>
                  <div className='text-center'>
                    <h5>
                      {posts.reduce((acc, post) => {
                        return acc + post.likedUsers.length
                      }, 0)}
                    </h5>
                    <div className='text-muted small'>Total Likes</div>
                  </div>
                  <div className='text-center'>
                    <h5>
                      {posts.reduce((acc, post) => {
                        return acc + (post.comments ? post.comments.length : 0)
                      }, 0)}
                    </h5>
                    <div className='text-muted small'>Comments</div>
                  </div>
                </div>
                <hr />
                <div className='mb-3'>
                  <h6 className='mb-2'>Privacy Distribution</h6>
                  <div className='progress-stacked mb-2'>
                    {/* Calculate percentages for each privacy type */}
                    {(() => {
                      const publicCount = posts.filter((p) => p.privacy === 'PUBLIC').length
                      const friendsCount = posts.filter((p) => p.privacy === 'FRIENDS').length
                      const privateCount = posts.filter((p) => p.privacy === 'PRIVATE').length
                      const total = posts.length || 1 // Avoid division by zero

                      return (
                        <>
                          <div
                            className='progress-bar bg-success'
                            role='progressbar'
                            style={{ width: `${(publicCount / total) * 100}%` }}
                            aria-valuenow={(publicCount / total) * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            title={`Public: ${publicCount} posts`}
                          ></div>
                          <div
                            className='progress-bar bg-primary'
                            role='progressbar'
                            style={{ width: `${(friendsCount / total) * 100}%` }}
                            aria-valuenow={(friendsCount / total) * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            title={`Friends: ${friendsCount} posts`}
                          ></div>
                          <div
                            className='progress-bar bg-danger'
                            role='progressbar'
                            style={{ width: `${(privateCount / total) * 100}%` }}
                            aria-valuenow={(privateCount / total) * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            title={`Private: ${privateCount} posts`}
                          ></div>
                        </>
                      )
                    })()}
                  </div>
                  <div className='d-flex justify-content-between small'>
                    <span>
                      <i className='bi bi-globe me-1 text-success'></i> Public
                    </span>
                    <span>
                      <i className='bi bi-people-fill me-1 text-primary'></i> Friends
                    </span>
                    <span>
                      <i className='bi bi-lock-fill me-1 text-danger'></i> Private
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className='card mt-4'>
              <div className='card-header bg-white'>
                <h5 className='mb-0'>Recent Activity</h5>
              </div>
              <div className='card-body p-0'>
                <ul className='list-group list-group-flush'>
                  {posts.slice(0, 3).map((post, index) => (
                    <li key={index} className='list-group-item'>
                      <div className='d-flex'>
                        <div className='flex-shrink-0'>
                          <div
                            className='bg-light rounded-circle p-2 d-flex align-items-center justify-content-center'
                            style={{ width: '40px', height: '40px' }}
                          >
                            <i className='bi bi-pencil'></i>
                          </div>
                        </div>
                        <div className='ms-3'>
                          <div>You posted {formatPostTime(post.createdAt)}</div>
                          <small className='text-muted'>{post.content}</small>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='card-footer bg-white text-center'>
                <button className='btn btn-sm btn-outline-primary rounded-pill'>See All Activity</button>
              </div>
            </div>

            <div className='card mt-4'>
              <div className='card-body text-center text-muted'>
                <small>© 2025 Ola Chat. All rights reserved.</small>
                <div className='mt-2'>
                  <a href='#' className='text-decoration-none text-muted small me-2'>
                    About
                  </a>
                  <a href='#' className='text-decoration-none text-muted small me-2'>
                    Help
                  </a>
                  <a href='#' className='text-decoration-none text-muted small'>
                    Privacy & Terms
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa bài viết */}
      {showEditModal && editingPost && (
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
          <div
            className='modal-dialog modal-dialog-centered'
            role='document'
            style={{ maxWidth: '500px', margin: '0 auto' }}
          >
            <div className='modal-content' style={{ maxHeight: '90vh', overflow: 'hidden' }}>
              <div className='modal-header'>
                <h5 className='modal-title'>Edit post</h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowEditModal(false)}
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
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'
                    }}
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
                        <i className='fas fa-lock me-1'></i>
                        {editPrivacy}
                      </button>
                      <ul className='dropdown-menu'>
                        <li>
                          <button className='dropdown-item' onClick={() => setEditPrivacy('PUBLIC')}>
                            Public
                          </button>
                        </li>
                        <li>
                          <button className='dropdown-item' onClick={() => setEditPrivacy('PRIVATE')}>
                            Only me
                          </button>
                        </li>
                        <li>
                          <button className='dropdown-item' onClick={() => setEditPrivacy('FRIENDS')}>
                            Friends
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Scroll area for content and images */}
                <div className='post-content-scroll' style={{ maxHeight: '350px', overflowY: 'auto', padding: '16px' }}>
                  <textarea
                    className='form-control border-0 mb-3'
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    placeholder="What's on your mind?"
                    style={{ resize: 'none' }}
                  ></textarea>

                  {/* Display existing images that are not marked for deletion */}
                  {editingPost.attachments &&
                    editingPost.attachments.filter(
                      (att) => att.fileType.startsWith('image/') && !filesToDelete.includes(att.mediaId)
                    ).length > 0 && (
                      <div className='post-images-preview mb-3'>
                        <h6 className='mb-2'>Current images</h6>
                        <div
                          className={`image-grid image-grid-${Math.min(
                            editingPost.attachments.filter(
                              (att) => att.fileType.startsWith('image/') && !filesToDelete.includes(att.mediaId)
                            ).length,
                            4
                          )}`}
                          style={
                            gridStyles[
                              Math.min(
                                editingPost.attachments.filter(
                                  (att) => att.fileType.startsWith('image/') && !filesToDelete.includes(att.mediaId)
                                ).length,
                                4
                              )
                            ]
                          }
                        >
                          {editingPost.attachments
                            .filter((att) => att.fileType.startsWith('image/') && !filesToDelete.includes(att.mediaId))
                            .slice(0, 4)
                            .map((attachment, index) => (
                              <div
                                key={attachment.mediaId}
                                className='position-relative'
                                style={{
                                  height: '100%',
                                  width: '100%',
                                  overflow: 'hidden'
                                }}
                              >
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
                                <button
                                  className='btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0 m-1'
                                  style={{ width: '22px', height: '22px', lineHeight: '0' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markFileToDelete(attachment.mediaId)
                                  }}
                                >
                                  <i className='fas fa-times'></i>
                                </button>
                              </div>
                            ))}
                        </div>
                        {editingPost.attachments.filter(
                          (att) => att.fileType.startsWith('image/') && !filesToDelete.includes(att.mediaId)
                        ).length > 4 && (
                          <div className='text-center mt-2'>
                            <button className='btn btn-sm btn-light'>
                              +
                              {editingPost.attachments.filter(
                                (att) => att.fileType.startsWith('image/') && !filesToDelete.includes(att.mediaId)
                              ).length - 4}{' '}
                              more
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Display files marked for deletion with option to restore */}
                  {filesToDelete.length > 0 && (
                    <div className='mb-3'>
                      <h6 className='mb-2'>Files to be removed</h6>
                      <div className='d-flex flex-wrap'>
                        {editingPost.attachments
                          .filter((att) => filesToDelete.includes(att.mediaId))
                          .map((attachment) => (
                            <div key={attachment.mediaId} className='position-relative me-2 mb-2'>
                              <img
                                src={attachment.fileUrl}
                                alt={attachment.originalFileName}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  objectFit: 'cover',
                                  opacity: 0.6
                                }}
                                className='rounded'
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=Image'
                                }}
                              />
                              <button
                                className='btn btn-sm btn-success position-absolute top-0 end-0 rounded-circle p-0'
                                style={{ width: '24px', height: '24px' }}
                                onClick={() => restoreFile(attachment.mediaId)}
                                title='Restore image'
                              >
                                <i className='fas fa-undo'></i>
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Display newly uploaded images */}
                  {uploadedFilesEdit.length > 0 && (
                    <div className='post-images-preview mb-3'>
                      <h6 className='mb-2'>New images</h6>
                      {/* Action buttons above grid */}
                      <div className='d-flex justify-content-between align-items-center mb-2'>
                        <button
                          className='btn d-flex align-items-center'
                          onClick={(e) => {
                            e.preventDefault()
                            fileInputEditRef.current?.click()
                          }}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '20px',
                            padding: '6px 12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          <i className='fas fa-plus-square me-2'></i>
                          Add more photos
                        </button>
                      </div>

                      {/* Image grid */}
                      <div
                        className={`image-grid image-grid-${Math.min(uploadedFilesEdit.length, 4)}`}
                        style={gridStyles[Math.min(uploadedFilesEdit.length, 4)]}
                      >
                        {uploadedFilesEdit
                          .slice(0, uploadedFilesEdit.length > 4 ? 4 : uploadedFilesEdit.length)
                          .map((file, index) => (
                            <div
                              key={index}
                              className='position-relative'
                              style={{
                                height: '100%',
                                width: '100%',
                                overflow: 'hidden'
                              }}
                            >
                              {/* If this is the 4th image and we have more than 4 images */}
                              {index === 3 && uploadedFilesEdit.length > 4 && (
                                <div className='position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 text-white'>
                                  <h3>+{uploadedFilesEdit.length - 4}</h3>
                                </div>
                              )}

                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Upload ${index}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                              <button
                                className='btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0 m-1'
                                style={{ width: '22px', height: '22px', lineHeight: '0' }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeEditFile(index)
                                }}
                              >
                                <i className='fas fa-times'></i>
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Upload new images section */}
                  {uploadedFilesEdit.length === 0 &&
                    editingPost.attachments.filter(
                      (att) => !filesToDelete.includes(att.mediaId) && att.fileType.startsWith('image/')
                    ).length === 0 && (
                      <div className='text-center py-4 border rounded mb-3'>
                        <input
                          type='file'
                          multiple
                          className='d-none'
                          ref={fileInputEditRef}
                          onChange={handleEditFileChange}
                          accept='image/*,video/*'
                          key={`file-input-edit-${fileInputEditKey}`}
                        />
                        <button className='btn btn-light' onClick={() => fileInputEditRef.current?.click()}>
                          <i className='fas fa-plus-circle me-2'></i>
                          Add photos/videos
                        </button>
                        <p className='text-muted small mt-1'>or drag and drop</p>
                      </div>
                    )}

                  {/* Hidden input for adding more files */}
                  <input
                    type='file'
                    multiple
                    className='d-none'
                    ref={fileInputEditRef}
                    onChange={handleEditFileChange}
                    accept='image/*,video/*'
                    key={`file-input-edit-${fileInputEditKey}`}
                  />
                </div>

                <div className='d-flex align-items-center justify-content-between border-top border-bottom p-2'>
                  <div className='ms-2'>Add to your post</div>
                  <div>
                    <button
                      className='btn btn-light rounded-circle me-1'
                      onClick={() => fileInputEditRef.current?.click()}
                    >
                      <i className='fas fa-image text-success'></i>
                    </button>
                    <button className='btn btn-light rounded-circle me-1'>
                      <i className='fas fa-user-friends text-primary'></i>
                    </button>
                    <button className='btn btn-light rounded-circle me-1'>
                      <i className='far fa-smile text-warning'></i>
                    </button>
                    <button className='btn btn-light rounded-circle me-1'>
                      <i className='fas fa-map-marker-alt text-danger'></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className='modal-footer'>
                <button
                  type='button'
                  className='btn btn-primary w-100 rounded-pill'
                  onClick={handleUpdatePost}
                  disabled={
                    (!editContent.trim() &&
                      uploadedFilesEdit.length === 0 &&
                      editingPost.attachments.filter((att) => !filesToDelete.includes(att.mediaId)).length === 0) ||
                    isUpdatingPost
                  }
                >
                  {isUpdatingPost ? (
                    <>
                      <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
