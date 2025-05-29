import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from 'src/contexts/app.context'
import { Post } from 'src/types/post.type'
import feedApi from 'src/apis/feed.api'
import { toast } from 'react-toastify'
import './MyPost.css'

export default function MyPost() {
  const { profile } = useContext(AppContext)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [newComment, setNewComment] = useState<string>('')
  const [showComments, setShowComments] = useState<Record<number, boolean>>({})

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
  const handleAddComment = async (postId: number) => {
    if (!newComment.trim()) return

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
      // Here you would call the API to delete the post
      // For now, we'll just update the UI optimistically
      setPosts(posts.filter((post) => post.postId !== postId))
      toast.success('Post deleted successfully!')
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('Failed to delete post.')
    }
  }

  return (
    <div className='my-posts-container'>
      <div className='container py-4'>
        <h2 className='mb-4 text-center'>My Posts</h2>

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
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            {/* Posts */}
            {posts.map((post) => (
              <div key={post.postId} className='post-card card mb-4'>
                <div className='card-body'>
                  {/* Post header */}
                  <div className='d-flex justify-content-between align-items-center mb-3'>
                    <div className='d-flex align-items-center'>
                      <img
                        src={profile?.avatar || 'https://res.cloudinary.com/dm5ulzy7n/image/upload/v1748307746/z6642578626786_9c3f5e5b519e59140f14558806ec7d00--dfca98f0-c6cb-46ed-b57b-e87de3e712ce.jpg'}
                        className='rounded-circle me-2'
                        alt={profile?.displayName}
                        width='48'
                        height='48'
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dm5ulzy7n/image/upload/v1748307746/z6642578626786_9c3f5e5b519e59140f14558806ec7d00--dfca98f0-c6cb-46ed-b57b-e87de3e712ce.jpg'
                        }}
                      />
                      <div>
                        <h6 className='mb-0'>{profile?.displayName}</h6>
                        <small className='text-muted d-block'>{formatPostTime(post.createdAt)}</small>
                      </div>
                    </div>
                    <div className='dropdown'>
                      <button className='btn' data-bs-toggle='dropdown'>
                        <i className="fas fa-ellipsis-v"></i>

                      </button>
                      <ul className='dropdown-menu dropdown-menu-end'>
                        <li>
                          <button className='dropdown-item'>Edit</button>
                        </li>
                        <li>
                          <button className='dropdown-item text-danger' onClick={() => handleDeletePost(post.postId)}>
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
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
                        >
                          {post.attachments
                            .filter((att) => att.fileType.startsWith('image/'))
                            .slice(0, 4)
                            .map((attachment, index) => (
                              <div key={attachment.mediaId} className='image-item'>
                                <img
                                  src={attachment.fileUrl}
                                  alt={attachment.originalFileName}
                                  className='img-fluid rounded'
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src =
                                      'https://via.placeholder.com/300x200?text=Image+not+available'
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                        {post.attachments.filter((att) => att.fileType.startsWith('image/')).length > 4 && (
                          <div className='text-center mt-2'>
                            <button className='btn btn-sm btn-light'>
                              +{post.attachments.filter((att) => att.fileType.startsWith('image/')).length - 4} more
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Post actions */}
                  <div className='d-flex border-top border-bottom py-2 mt-3'>
                    <button className='btn btn-light flex-grow-1 d-flex align-items-center justify-content-center'>
                      <i className='bi bi-hand-thumbs-up me-2'></i> Like ({post.likedUsers.length})
                    </button>
                    <button
                      className='btn btn-light flex-grow-1 d-flex align-items-center justify-content-center'
                      onClick={() => toggleComments(post.postId)}
                    >
                      <i className='bi bi-chat me-2'></i> Comment ({post.comments?.length || 0})
                    </button>
                  </div>

                  {/* Comments section */}
                  {showComments[post.postId] && (
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
                      <div className='add-comment d-flex mt-3'>
                        <img
                          src={profile?.avatar || 'https://via.placeholder.com/36'}
                          className='rounded-circle me-2'
                          alt='Your profile'
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
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.postId)}
                          />
                          <button
                            className='btn btn-primary rounded-circle ms-2'
                            onClick={() => handleAddComment(post.postId)}
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

            {/* Load more button */}
            {hasMore && (
              <div className='text-center mb-4'>
                <button className='btn btn-outline-primary rounded-pill px-4' onClick={loadMore} disabled={loading}>
                  {loading ? (
                    <>
                      <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
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
    </div>
  )
}
