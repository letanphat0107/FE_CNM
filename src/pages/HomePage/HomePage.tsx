import { useContext, useState, useRef } from 'react'
import './HomePage.css'
import { AppContext } from 'src/contexts/app.context'

interface User {
  id: string
  name: string
  avatar: string
  title: string
}

interface Comment {
  id: string
  user: User
  content: string
  createdAt: string
}

interface Post {
  id: string
  user: User
  content: string
  createdAt: string
  likes: number
  comments: Comment[]
  images?: string[] // Thêm trường để lưu trữ hình ảnh
}

export default function HomePage() {
  const { profile } = useContext(AppContext)
  const [newComment, setNewComment] = useState<string>('')
  const [showComments, setShowComments] = useState<boolean>(false)
  const [showPostModal, setShowPostModal] = useState<boolean>(false)
  const [postContent, setPostContent] = useState<string>('')
  const [postPrivacy, setPostPrivacy] = useState<string>('PUBLIC')
  const [isMediaTabActive, setIsMediaTabActive] = useState<boolean>(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileInputKey, setFileInputKey] = useState<number>(0)

  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      user: {
        id: 'user1',
        name: profile?.displayName || 'Robert Fox',
        avatar:
          profile?.avatar ||
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s',
        title: 'Digital Marketer'
      },
      content:
        "In today's fast-paced, digitally driven world, digital marketing is not just a strategy, it's a necessity for businesses of all sizes. ✍️",
      createdAt: '7 hours ago',
      likes: 15,
      comments: [
        {
          id: 'comment1',
          user: {
            id: 'user2',
            name: 'Bảo Thông',
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s',
            title: 'Project Manager'
          },
          content: "Absolutely agree! Digital presence is everything in today's market.",
          createdAt: '5 hours ago'
        }
      ]
    }
  ])

  const suggestedFriends: User[] = [
    {
      id: 'sf1',
      name: 'Bảo Thông',
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s',
      title: 'Financial Analyst'
    },
    {
      id: 'sf2',
      name: 'Nguyễn Văn A',
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s',
      title: 'Project Manager'
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
  const handleCreatePost = () => {
    if (!postContent.trim() && uploadedFiles.length === 0) return

    // Giả định chuyển đổi File thành URL cho bài viết (trong thực tế bạn sẽ upload lên server)
    const imageUrls = uploadedFiles.map((file) => URL.createObjectURL(file))

    const newPost: Post = {
      id: `post${Date.now()}`,
      user: {
        id: 'currentUser',
        name: profile?.displayName || 'You',
        avatar: profile?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
        title: profile?.bio || 'Software Developer'
      },
      content: postContent,
      createdAt: 'Just now',
      likes: 0,
      comments: [],
      images: imageUrls
    }

    setPosts([newPost, ...posts])
    setPostContent('')
    setUploadedFiles([])
    setShowPostModal(false)
  }

  // Xử lý thêm comment
  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return

    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: `comment${Date.now()}`,
              user: {
                id: 'currentUser',
                name: profile?.displayName || 'You',
                avatar: profile?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
                title: profile?.bio || 'Software Developer'
              },
              content: newComment,
              createdAt: 'Just now'
            }
          ]
        }
      }
      return post
    })

    setPosts(updatedPosts)
    setNewComment('')
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

  return (
    <div className='homepage'>
      <div className='container pb-5'>
        <div className='row'>
          {/* Main sidebar - with hidden scrollbar */}
          <div
            className='col-md-8 main-content-column'
            style={{
              maxHeight: 'calc(100vh - 80px)', // Chiều cao tối đa (trừ đi header)
              overflowY: 'auto', // Cho phép cuộn dọc
              scrollbarWidth: 'none', // Ẩn thanh cuộn trên Firefox
              scrollBehavior: 'smooth',
              msOverflowStyle: 'none' // Ẩn thanh cuộn trên IE/Edge
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
                    What's on your mind?
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
                        <div>
                          <button
                            className='btn btn-light rounded-circle me-1'
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <i className='bi bi-image text-success'></i>
                          </button>
                          <button className='btn btn-light rounded-circle me-1'>
                            <i className='bi bi-people-fill text-primary'></i>
                          </button>
                          <button className='btn btn-light rounded-circle me-1'>
                            <i className='bi bi-emoji-smile text-warning'></i>
                          </button>
                          <button className='btn btn-light rounded-circle me-1'>
                            <i className='bi bi-geo-alt-fill text-danger'></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className='modal-footer'>
                      <button
                        type='button'
                        className='btn btn-primary w-100 rounded-pill'
                        onClick={handleCreatePost}
                        disabled={!postContent.trim() && uploadedFiles.length === 0}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Posts */}
            {posts.map((post) => (
              <div key={post.id} className='post-card card mb-4'>
                <div className='card-body'>
                  {/* Post header */}
                  <div className='d-flex justify-content-between align-items-center mb-3'>
                    <div className='d-flex align-items-center'>
                      <img
                        src={post.user.avatar}
                        className='rounded-circle me-2'
                        alt={post.user.name}
                        width='48'
                        height='48'
                      />
                      <div>
                        <h6 className='mb-0'>{post.user.name}</h6>
                        <small className='text-muted'>{post.user.title}</small>
                        <small className='text-muted d-block'>{post.createdAt}</small>
                      </div>
                    </div>
                    <div className='dropdown'>
                      <button className='btn' data-bs-toggle='dropdown'>
                        <i className='bi bi-three-dots-vertical'></i>
                      </button>
                      <ul className='dropdown-menu dropdown-menu-end'>
                        <li>
                          <button className='dropdown-item'>Edit</button>
                        </li>
                        <li>
                          <button className='dropdown-item'>Delete</button>
                        </li>
                        <li>
                          <button className='dropdown-item'>Report</button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Post content */}
                  <p>{post.content}</p>

                  {/* Post images if any */}
                  {post.images && post.images.length > 0 && (
                    <div className='post-images mb-3'>
                      <div className={`image-grid image-grid-${Math.min(post.images.length, 4)}`}>
                        {post.images.slice(0, 4).map((img, index) => (
                          <div key={index} className='image-item'>
                            <img src={img} alt={`Post image ${index + 1}`} className='img-fluid rounded' />
                          </div>
                        ))}
                      </div>
                      {post.images.length > 4 && (
                        <div className='text-center mt-2'>
                          <button className='btn btn-sm btn-light'>+{post.images.length - 4} more</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post actions */}
                  <div className='d-flex border-top border-bottom py-2 mt-3'>
                    <button className='btn btn-light flex-grow-1 d-flex align-items-center justify-content-center'>
                      <i className='bi bi-hand-thumbs-up me-2'></i> Like
                    </button>
                    <button
                      className='btn btn-light flex-grow-1 d-flex align-items-center justify-content-center'
                      onClick={() => setShowComments(!showComments)}
                    >
                      <i className='bi bi-chat me-2'></i> Comment
                    </button>
                  </div>

                  {/* Comments section */}
                  {showComments && (
                    <div className='comments-section mt-3'>
                      {post.comments.map((comment) => (
                        <div key={comment.id} className='comment d-flex mb-3'>
                          <img
                            src={comment.user.avatar}
                            className='rounded-circle me-2'
                            alt={comment.user.name}
                            width='36'
                            height='36'
                          />
                          <div className='comment-bubble'>
                            <div className='bg-light rounded p-2'>
                              <h6 className='mb-0'>{comment.user.name}</h6>
                              <p className='mb-0'>{comment.content}</p>
                            </div>
                            <small className='text-muted'>{comment.createdAt}</small>
                          </div>
                        </div>
                      ))}

                      {/* Add comment */}
                      <div className='add-comment d-flex mt-3'>
                        <img
                          src={
                            profile?.avatar ||
                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'
                          }
                          className='rounded-circle me-2'
                          alt='Your profile'
                          width='36'
                          height='36'
                        />
                        <div className='input-group'>
                          <input
                            type='text'
                            className='form-control rounded-pill'
                            placeholder='Write a comment...'
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          />
                          <button
                            className='btn btn-primary rounded-circle ms-2'
                            onClick={() => handleAddComment(post.id)}
                          >
                            <i className='bi bi-send'></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                    <li key={friend.id} className='list-group-item d-flex justify-content-between align-items-center'>
                      <div className='d-flex align-items-center'>
                        <img
                          src={friend.avatar}
                          className='rounded-circle me-2'
                          alt={friend.name}
                          width='40'
                          height='40'
                        />
                        <div>
                          <h6 className='mb-0'>{friend.name}</h6>
                          <small className='text-muted'>{friend.title}</small>
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
