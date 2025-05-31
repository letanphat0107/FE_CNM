import { useContext, useState, useRef, useEffect } from 'react' // Thêm useEffect
import './HomePageCS.css'
import { AppContext } from 'src/contexts/app.context'
import { Attachment, Post, User, Comment } from 'src/types/post.type'
import feedApi from 'src/apis/feed.api'
import { toast } from 'react-toastify'
import PostItem from 'src/components/common/PostItem/PostItem'

export default function HomePage() {
  const { profile } = useContext(AppContext)
  const [newComment, setNewComment] = useState<string>('')
  const [showComments, setShowComments] = useState<boolean>(false)
  const [showPostModal, setShowPostModal] = useState<boolean>(false)
  const [postContent, setPostContent] = useState<string>('')
  const [postPrivacy, setPostPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'FRIENDS'>('PUBLIC')
  const [isMediaTabActive, setIsMediaTabActive] = useState<boolean>(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileInputKey, setFileInputKey] = useState<number>(0)
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false)
  const [showShareModal, setShowShareModal] = useState<boolean>(false)
  const [postToShare, setPostToShare] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Mock user để sử dụng khi cần
  const mockUser: User = {
    userId: profile?.userId || 'user1',
    username: profile?.username || 'robert.fox',
    displayName: profile?.displayName || 'Robert Fox',
    avatar:
      profile?.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'
  }

  // Lấy dữ liệu từ API khi component mount
  useEffect(() => {
    const fetchHomeFeed = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await feedApi.getHomeFeed()

        if (response && response.data && response.data.data) {
          console.log('Fetched posts:', response.data.data)
          setPosts(response.data.data)
        } else {
          console.error('Invalid response format:', response)
          setError('Invalid response format from server')
        }
      } catch (error) {
        console.error('Failed to fetch home feed:', error)
        setError('Failed to load posts. Please try again later.')
        toast.error('Failed to load posts. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHomeFeed()
  }, [])

  // Suggested friends phù hợp với interface User mới
  const suggestedFriends: User[] = [
    {
      userId: 'sf1',
      username: 'baothong',
      displayName: 'Bảo Thông',
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'
    },
    {
      userId: 'sf2',
      username: 'nguyenvana',
      displayName: 'Nguyễn Văn A',
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'
    }
  ]

  const MAX_FILES = 10 // Giới hạn số lượng tệp

  // Xử lý tải file lên
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)

      // Kiểm tra xem có vượt quá giới hạn không
      const totalFiles = uploadedFiles.length + filesArray.length
      if (totalFiles > MAX_FILES) {
        alert(`You can only upload up to ${MAX_FILES} files. Please remove some files first.`)
        setFileInputKey((prev) => prev + 1) // Reset input
        return
      }

      setUploadedFiles((prevFiles) => [...prevFiles, ...filesArray])
      setFileInputKey((prev) => prev + 1)
    }
  }

  // Xóa file đã tải lên
  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles]
    newFiles.splice(index, 1)
    setUploadedFiles(newFiles)
  }

  // Xử lý tạo bài viết mới
  const handleCreatePost = async () => {
    try {
      if (!postContent.trim() && uploadedFiles.length === 0) return

      const formData = new FormData()
      formData.append('content', postContent)
      formData.append('privacy', postPrivacy)

      uploadedFiles.forEach((file) => {
        formData.append('files', file)
      })

      setIsCreatingPost(true)

      const response = await feedApi.postNewFeed(formData)
      const newPost = response.data.data
      setPosts([newPost, ...posts])
      setPostContent('')
      setUploadedFiles([])
      setShowPostModal(false)
      toast.success('Post created successfully!')
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post. Please try again.')
    } finally {
      setIsCreatingPost(false)
    }
  }

  // Xử lý thêm comment
  const handleAddComment = async (postId: number, content: string) => {
    if (!content.trim()) return

    try {
      // Đây là nơi bạn sẽ gọi API để thêm comment
      // Ví dụ: const response = await commentApi.addComment(postId, content);

      // Cập nhật UI tạm thời
      const updatedPosts = posts.map((post) => {
        if (post.postId === postId) {
          const newComment: Comment = {
            commentId: Date.now(),
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            commentedBy: {
              userId: profile?.userId || 'current-user',
              username: profile?.username || 'current.user',
              displayName: profile?.displayName || 'You',
              avatar: profile?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'
            },
            replies: []
          }

          return {
            ...post,
            comments: [...post.comments, newComment]
          }
        }
        return post
      })

      setPosts(updatedPosts)
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Failed to add comment. Please try again.')
    }
  }

  // Styles for image grid based on number of images
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

  // Xử lý like post
  const handleLikePost = async (postId: number) => {
    try {
      // Cập nhật UI ngay lập tức (optimistic update)
      const updatedPosts = posts.map((post) => {
        if (post.postId === postId) {
          const isAlreadyLiked = post.likedUsers.some((user) => user.userId === profile?.userId)

          if (isAlreadyLiked) {
            // Unlike post
            return {
              ...post,
              likedUsers: post.likedUsers.filter((user) => user.userId !== profile?.userId)
            }
          } else {
            // Like post
            return {
              ...post,
              likedUsers: [
                ...(post.likedUsers || []),
                {
                  userId: profile?.userId || 'current-user',
                  username: profile?.username || 'current.user',
                  displayName: profile?.displayName || 'You',
                  avatar: profile?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'
                }
              ]
            }
          }
        }
        return post
      })

      setPosts(updatedPosts)

      // Gọi API thực tế
      const isAlreadyLiked = posts
        .find((p) => p.postId === postId)
        ?.likedUsers.some((u) => u.userId === profile?.userId)

      if (isAlreadyLiked) {
        await feedApi.unlikeFeed(postId)
      } else {
        await feedApi.likeFeed(postId)
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error)
      toast.error('Failed to update like status. Please try again.')

      // Revert optimistic update if API call fails
      const originalPosts = await feedApi.getHomeFeed()
      setPosts(originalPosts.data.data)
    }
  }

  function handleEditButtonClick(post: Post): void {
    setPostContent(post.content)
    setPostPrivacy(post.privacy as 'PUBLIC' | 'PRIVATE' | 'FRIENDS')

    if (post.attachments && post.attachments.length > 0) {
      setIsMediaTabActive(true)
    } else {
      setUploadedFiles([])
    }

    // Show the post modal in edit mode
    setShowPostModal(true)
  }

  const handleDeletePost = async (postId: number) => {
    try {
      // Optimistic update
      const originalPosts = [...posts]
      setPosts(posts.filter((post) => post.postId !== postId))

      // Call API
      await feedApi.deleteFeed(postId)
      toast.success('Post deleted successfully!')
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('Failed to delete post. Please try again.')

      // Revert optimistic update
      const response = await feedApi.getHomeFeed()
      setPosts(response.data.data)
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
      } else {
        await feedApi.addFavoriteFeed(postId)
      }

      // Thông báo thành công
      toast.success(isSaved ? 'Post removed from favorites successfully!' : 'Post saved to favorites successfully!')
    } catch (error) {
      console.error('Failed to update favorite status:', error)
      toast.error('Failed to update favorite status')

      // Revert optimistic update if API call fails
      const originalPosts = await feedApi.getHomeFeed()
      setPosts(originalPosts.data.data)
    }
  }

  function handleReportPost(postId: number): void {
    // Implement post reporting logic here
    toast.info('Post reported successfully!')
  }

  function toggleComments(): void {
    setShowComments(!showComments)
  }

  // Định nghĩa hàm xử lý share post
  const handleSharePost = async (post: Post, content: string, privacy: 'PUBLIC' | 'PRIVATE' | 'FRIENDS') => {
    try {
      // // Gọi API share post
      // await feedApi.shareFeed(post.postId, {
      //   content: content,
      //   privacy: privacy
      // })

      toast.success('Post shared successfully!')
    } catch (error) {
      console.error('Failed to share post:', error)
      toast.error('Failed to share post. Please try again.')
    }
  }

  return (
    <div className='homepage bg-transparent' style={{ padding: '0px' }}>
      <div className='container pb-5'>
        <div className='row'>
          {/* Main sidebar - with hidden scrollbar */}
          <div
            className='col-md-8 main-content-column'
            style={{
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              scrollBehavior: 'smooth',
              msOverflowStyle: 'none'
            }}
          >
            {/* CSS inline để ẩn thanh cuộn trên Chrome/Safari/các trình duyệt khác */}
            <style>
              {`
                .main-content-column::-webkit-scrollbar {
                  display: none;
                }
                .main-content-column {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}
            </style>

            {/* Create post section */}
            <div className='create-post-card card mb-4'>
              <div className='card-body'>
                <div className='d-flex align-items-center mb-3'>
                  <div className='me-3'>
                    <img
                      src={
                        profile?.avatar ||
                        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'
                      }
                      className='rounded-circle'
                      alt='Profile'
                      width='44'
                      height='44'
                    />
                  </div>

                  <div
                    className='form-control bg-light border-0 rounded-pill flex-grow-1 text-muted'
                    onClick={() => setShowPostModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    Bạn đang nghĩ gì?
                  </div>
                </div>
                <div className='d-flex justify-content-between align-items-center'>
                  <div className='d-flex align-items-center ms-5'>
                  <button
                    className='btn d-flex align-items-center'
                    onClick={() => {
                    setShowPostModal(true)
                    setIsMediaTabActive(true)
                    }}
                  >
                    <img
                    src='https://res.cloudinary.com/dm5ulzy7n/image/upload/v1748540582/Media--f6775c54-bd58-4ec1-9515-2cf9de95da09.png'
                    alt='Media'
                    className='me-2'
                    width='20'
                    height='20'
                    />
                    Add Media
                  </button>
                  
                  <button className='btn d-flex align-items-center ml-3'>
                    <i className='fas fa-video text-danger me-2'></i>
                    Livestream
                  </button>
                  </div>
                  <button className='btn btn-primary rounded-pill px-4' onClick={() => setShowPostModal(true)}>
                  Post
                  </button>
                </div>
              </div>
            </div>

            {/* Create Post Modal */}
            {showPostModal && (
              <div
                className='modal show d-block'
                tabIndex={-1}
                role='dialog'
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <div className='modal-dialog' role='document' style={{ maxWidth: '500px', margin: '2rem auto' }}>
                  <div className='modal-content' style={{ maxHeight: '660px' }}>
                    <div className='modal-header'>
                      <h5 className='modal-title'>Create post</h5>
                      <button
                        type='button'
                        className='btn-close'
                        onClick={() => setShowPostModal(false)}
                        aria-label='Close'
                      ></button>
                    </div>

                    <div className='modal-body p-0'>
                      <div className='d-flex align-items-center p-3 border-bottom'>
                        <img
                          src={
                            profile?.avatar ||
                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'
                          }
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
                              {postPrivacy}
                            </button>
                            <ul className='dropdown-menu'>
                              <li>
                                <button className='dropdown-item' onClick={() => setPostPrivacy('PUBLIC')}>
                                  Public
                                </button>
                              </li>
                              <li>
                                <button className='dropdown-item' onClick={() => setPostPrivacy('PRIVATE')}>
                                  Only me
                                </button>
                              </li>
                              <li>
                                <button className='dropdown-item' onClick={() => setPostPrivacy('FRIENDS')}>
                                  Friends
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Scroll area for content and images */}
                      <div
                        className='post-content-scroll'
                        style={{ maxHeight: '350px', overflowY: 'auto', padding: '16px' }}
                      >
                        <textarea
                          className='form-control border-0 mb-3'
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          rows={3}
                          placeholder="What's on your mind?"
                          style={{ resize: 'none' }}
                        ></textarea>

                        {/* Display uploaded images in grid layout */}
                        {uploadedFiles.length > 0 && (
                          <div className='post-images-preview mb-3'>
                            {/* Action buttons above grid */}
                            <div className='d-flex justify-content-between align-items-center mb-2'>
                              <button
                                className='btn d-flex align-items-center'
                                onClick={(e) => {
                                  e.preventDefault()
                                  fileInputRef.current?.click()
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
                                <i className='bi bi-plus-square-fill me-2'></i>
                                Add photos/videos
                              </button>
                              <button
                                className='btn d-flex align-items-center'
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                  borderRadius: '20px',
                                  padding: '6px 12px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                  fontSize: '14px',
                                  fontWeight: 500
                                }}
                              >
                                <i className='bi bi-pencil-fill me-2'></i>
                                Edit all
                              </button>
                            </div>

                            {/* Image grid */}
                            <div
                              className={`image-grid image-grid-${Math.min(uploadedFiles.length, 4)}`}
                              style={gridStyles[Math.min(uploadedFiles.length, 4)]}
                            >
                              {uploadedFiles
                                .slice(0, uploadedFiles.length > 4 ? 4 : uploadedFiles.length)
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
                                    {index === 3 && uploadedFiles.length > 4 && (
                                      <div className='position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 text-white'>
                                        <h3>+{uploadedFiles.length - 4}</h3>
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
                                        removeFile(index)
                                      }}
                                    >
                                      <i className='bi bi-x'></i>
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {uploadedFiles.length === 0 && (
                          <div className='text-center py-4 border rounded mb-3'>
                            <input
                              type='file'
                              multiple
                              className='d-none'
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept='image/*,video/*'
                              key={`file-input-${fileInputKey}`}
                            />
                            <button className='btn btn-light' onClick={() => fileInputRef.current?.click()}>
                              <i className='bi bi-plus-circle me-2'></i>
                              Add photos/videos
                            </button>
                            <p className='text-muted small mt-1'>or drag and drop</p>
                          </div>
                        )}
                      </div>

                      <div className='d-flex align-items-center justify-content-between border-top border-bottom p-2'>
                        <div className='ms-2'>Add to your post</div>

                        <div className='d-flex align-items-center'>
                          <button
                            className='btn btn-light rounded-circle me-1'
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <i className='fas fa-image text-success'></i> {/* ảnh */}
                          </button>

                          <button className='btn btn-light rounded-circle me-1'>
                            <i className='fas fa-user-friends text-primary'></i> {/* bạn bè */}
                          </button>

                          <button className='btn btn-light rounded-circle me-1'>
                            <i className='far fa-smile text-warning'></i> {/* emoji */}
                          </button>

                          <button className='btn btn-light rounded-circle me-1'>
                            <i className='fas fa-map-marker-alt text-danger'></i> {/* vị trí */}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className='modal-footer'>
                      <button
                        type='button'
                        className='btn btn-primary w-100 rounded-pill'
                        onClick={handleCreatePost}
                        disabled={(!postContent.trim() && uploadedFiles.length === 0) || isCreatingPost}
                      >
                        {isCreatingPost ? (
                          <>
                            <span
                              className='spinner-border spinner-border-sm me-2'
                              role='status'
                              aria-hidden='true'
                            ></span>
                            Posting...
                          </>
                        ) : (
                          'Post'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className='text-center my-5 p-5'>
                <div className='spinner-border text-primary' role='status'>
                  <span className='visually-hidden'>Loading...</span>
                </div>
                <p className='mt-3'>Loading posts...</p>
              </div>
            )}

            {/* Error state */}
            {!isLoading && error && (
              <div className='alert alert-danger' role='alert'>
                {error}
                <button className='btn btn-outline-danger ms-3' onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && posts.length === 0 && (
              <div className='text-center my-5 p-5 border rounded bg-light'>
                <i className='bi bi-newspaper fs-1 text-muted mb-3'></i>
                <h4>No posts yet</h4>
                <p className='text-muted'>Be the first to share something with your friends!</p>
                <button className='btn btn-primary' onClick={() => setShowPostModal(true)}>
                  Create Post
                </button>
              </div>
            )}

            {/* Posts */}
            {!isLoading &&
              !error &&
              posts.map((post) => (
                <PostItem
                  key={post.postId}
                  post={post}
                  currentUser={{
                    userId: profile?.userId || '',
                    username: profile?.username || '',
                    displayName: profile?.displayName || '',
                    avatar: profile?.avatar || ''
                  }}
                  onComment={(postId, content) => handleAddComment(postId, content)}
                  onLike={(postId) => handleLikePost(postId)}
                  onEdit={(post) => handleEditButtonClick(post)}
                  onDelete={(postId) => handleDeletePost(postId)}
                  onSave={(postId) => handleSavePost(postId)}
                  onReport={(postId) => handleReportPost(postId)}
                  onShare={(post, content, privacy) => handleSharePost(post, content, privacy)}
                  dropdownActions={{
                    edit: true,
                    delete: true,
                    save: true,
                    report: true,
                    editAudience: false
                  }}
                  showComments={showComments}
                  toggleComments={toggleComments}
                />
              ))}
          </div>

          {/* Right sidebar */}
          <div className='col-md-4'>
            <div className='card'>
              <div className='card-header bg-white'>
                <h5 className='mb-0'>Suggested Friends</h5>
              </div>
              <div className='card-body p-0'>
                <ul className='list-group list-group-flush'>
                  {suggestedFriends.map((friend) => (
                    <li
                      key={friend.userId}
                      className='list-group-item d-flex justify-content-between align-items-center'
                    >
                      <div className='d-flex align-items-center'>
                        <img
                          src={friend.avatar}
                          className='rounded-circle me-2'
                          alt={friend.displayName}
                          width='40'
                          height='40'
                        />
                        <div>
                          <h6 className='mb-0'>{friend.displayName}</h6>
                          <small className='text-muted'>@{friend.username}</small>
                        </div>
                      </div>
                      <button className='btn btn-sm btn-outline-primary rounded-circle'>
                        <i className='bi bi-plus'></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className='card mt-4'>
              <div className='card-body text-center text-muted'>
                <small>© 2023 DevCut. All rights reserved.</small>
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
    </div>
  )
}
