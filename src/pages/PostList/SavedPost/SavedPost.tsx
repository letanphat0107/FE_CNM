import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from 'src/contexts/app.context'
import { Post } from 'src/types/post.type'
import feedApi from 'src/apis/feed.api'
import { toast } from 'react-toastify'
import PostItem from 'src/components/common/PostItem/PostItem'

export default function SavedPosts() {
  const { profile } = useContext(AppContext)
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showComments, setShowComments] = useState<Record<number, boolean>>({})
  const [statsData, setStatsData] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0
  })

  // Fetch saved posts when component mounts
  useEffect(() => {
    fetchSavedPosts()
  }, [])

  // Update stats whenever saved posts change
  useEffect(() => {
    if (savedPosts.length > 0) {
      setStatsData({
        totalPosts: savedPosts.length,
        totalLikes: savedPosts.reduce((acc, post) => acc + post.likedUsers.length, 0),
        totalComments: savedPosts.reduce((acc, post) => acc + (post.comments ? post.comments.length : 0), 0)
      })
    }
  }, [savedPosts])

  // Fetch saved posts
  const fetchSavedPosts = async () => {
    try {
      setLoading(true)
      const response = await feedApi.getFavoriteFeed()
      setSavedPosts(response.data.data)
    } catch (error) {
      console.error('Failed to fetch saved posts:', error)
      toast.error('Failed to load saved posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle comments visibility
  const toggleComments = (postId: number) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Handle adding a comment
  const handleAddComment = async (postId: number, content: string) => {
    if (!content.trim()) return

    try {
      // Call API to add comment
      // const response = await feedApi.addComment(postId, { content })

      // Update local state
      // setSavedPosts((prev) =>
      //   prev.map((post) => {
      //     if (post.postId === postId) {
      //       return {
      //         ...post,
      //         comments: [...post.comments, response.data.data]
      //       }
      //     }
      //     return post
      //   })
      // )

      toast.success('Comment added successfully!')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Failed to add comment. Please try again.')
    }
  }

  // Handle unsaving a post
  const handleSavePost = async (postId: number) => {
    try {
      // Update UI first (optimistic update)
      setSavedPosts((prevPosts) => prevPosts.filter((post) => post.postId !== postId))

      // Call API to remove from favorites
      await feedApi.removeFavoriteFeed(postId)
      toast.success('Post removed from favorites successfully!')
    } catch (error) {
      console.error('Failed to remove from favorites:', error)
      toast.error('Failed to remove post from favorites')

      // Revert on error
      fetchSavedPosts()
    }
  }

  // Handle liking a post
  const handleLikePost = async (postId: number) => {
    try {
      // Find the post
      const post = savedPosts.find((p) => p.postId === postId)
      if (!post || !profile) return

      // Check if already liked
      const isAlreadyLiked = post.likedUsers.some((user) => user.userId === profile.userId)

      // Optimistic update
      const updatedPosts = savedPosts.map((post) => {
        if (post.postId === postId) {
          if (isAlreadyLiked) {
            return {
              ...post,
              likedUsers: post.likedUsers.filter((user) => user.userId !== profile.userId)
            }
          } else {
            return {
              ...post,
              likedUsers: [
                ...post.likedUsers,
                {
                  userId: profile.userId,
                  username: profile.username,
                  displayName: profile.displayName,
                  avatar: profile.avatar || ''
                }
              ]
            }
          }
        }
        return post
      })

      setSavedPosts(updatedPosts)

      // Call API
      if (isAlreadyLiked) {
        await feedApi.unlikeFeed(postId)
      } else {
        await feedApi.likeFeed(postId)
      }
    } catch (error) {
      console.error('Failed to update like status:', error)
      toast.error('Failed to update like status. Please try again.')

      // Revert on error
      fetchSavedPosts()
    }
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

  return (
    <div className='saved-posts-container'>
      <div className='container py-4'>
        <div className='row'>
          <div className='col-md-8'>
            {loading ? (
              <div className='text-center py-5'>
                <div className='spinner-border text-primary' role='status'>
                  <span className='visually-hidden'>Loading...</span>
                </div>
                <p className='mt-2'>Loading your saved posts...</p>
              </div>
            ) : savedPosts.length === 0 ? (
              <div className='text-center py-5'>
                <div className='mb-3'>
                  <i className='bi bi-bookmark fs-1 text-muted'></i>
                </div>
                <h5>No saved posts</h5>
                <p className='text-muted'>Posts you save will appear here.</p>
              </div>
            ) : (
              <div className='posts-container'>
                {savedPosts.map((post) => (
                  <PostItem
                    key={post.postId}
                    post={{ ...post, isSaved: true }} // Force isSaved to true
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
                    onSave={(postId) => handleSavePost(postId)}
                    dropdownActions={{
                      edit: false,
                      delete: false,
                      save: true,
                      report: true,
                      editAudience: false
                    }}
                    showComments={showComments}
                    toggleComments={(postId) => toggleComments(postId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className='col-md-4'>
            <div className='card'>
              <div className='card-header bg-white'>
                <h5 className='mb-0'>Collection Statistics</h5>
              </div>
              <div className='card-body'>
                <div className='d-flex justify-content-between mb-3'>
                  <div className='text-center'>
                    <h5>{statsData.totalPosts}</h5>
                    <div className='text-muted small'>Saved Posts</div>
                  </div>
                  <div className='text-center'>
                    <h5>{statsData.totalLikes}</h5>
                    <div className='text-muted small'>Total Likes</div>
                  </div>
                  <div className='text-center'>
                    <h5>{statsData.totalComments}</h5>
                    <div className='text-muted small'>Comments</div>
                  </div>
                </div>
                <hr />
                <div className='mb-3'>
                  <h6 className='mb-2'>Content Categories</h6>
                  {/* Simple placeholder for categories */}
                  {(() => {
                    // Determine post types (has images, has videos, text-only)
                    const withImages = savedPosts.filter((p) =>
                      p.attachments?.some((a) => a.fileType.startsWith('image/'))
                    ).length
                    const withVideos = savedPosts.filter((p) =>
                      p.attachments?.some((a) => a.fileType.startsWith('video/'))
                    ).length
                    const textOnly = savedPosts.length - withImages - withVideos
                    const total = savedPosts.length || 1 // Avoid division by zero

                    return (
                      <div>
                        <div className='progress-stacked mb-2'>
                          <div
                            className='progress-bar bg-primary'
                            role='progressbar'
                            style={{ width: `${(withImages / total) * 100}%` }}
                            aria-valuenow={(withImages / total) * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            title={`With Images: ${withImages} posts`}
                          ></div>
                          <div
                            className='progress-bar bg-success'
                            role='progressbar'
                            style={{ width: `${(withVideos / total) * 100}%` }}
                            aria-valuenow={(withVideos / total) * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            title={`With Videos: ${withVideos} posts`}
                          ></div>
                          <div
                            className='progress-bar bg-info'
                            role='progressbar'
                            style={{ width: `${(textOnly / total) * 100}%` }}
                            aria-valuenow={(textOnly / total) * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            title={`Text Only: ${textOnly} posts`}
                          ></div>
                        </div>
                        <div className='d-flex justify-content-between small'>
                          <span>
                            <i className='bi bi-image me-1 text-primary'></i> With Images
                          </span>
                          <span>
                            <i className='bi bi-camera-video me-1 text-success'></i> With Videos
                          </span>
                          <span>
                            <i className='bi bi-file-text me-1 text-info'></i> Text Only
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            <div className='card mt-4'>
              <div className='card-header bg-white'>
                <h5 className='mb-0'>Recently Saved</h5>
              </div>
              <div className='card-body p-0'>
                <ul className='list-group list-group-flush'>
                  {savedPosts.slice(0, 3).map((post, index) => (
                    <li key={index} className='list-group-item'>
                      <div className='d-flex'>
                        <div className='flex-shrink-0'>
                          <div
                            className='bg-light rounded-circle p-2 d-flex align-items-center justify-content-center'
                            style={{ width: '40px', height: '40px' }}
                          >
                            <i className='bi bi-bookmark'></i>
                          </div>
                        </div>
                        <div className='ms-3'>
                          <div>
                            {post.createdBy.displayName} • {formatPostTime(post.createdAt)}
                          </div>
                          <small className='text-muted text-truncate d-block' style={{ maxWidth: '200px' }}>
                            {post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content}
                          </small>
                          <small
                            className='text-primary'
                            onClick={() => handleSavePost(post.postId)}
                            style={{ cursor: 'pointer' }}
                          >
                            Remove
                          </small>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='card-footer bg-white text-center'>
                <button
                  className='btn btn-sm btn-outline-primary rounded-pill'
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Manage All Saved Posts
                </button>
              </div>
            </div>

            <div className='card mt-4'>
              <div className='card-header bg-white'>
                <h5 className='mb-0'>Tips</h5>
              </div>
              <div className='card-body'>
                <p className='text-muted mb-2'>How to use saved posts:</p>
                <ul className='text-muted small mb-0'>
                  <li>Click the bookmark icon on any post to save it</li>
                  <li>Create collections to organize your saved content</li>
                  <li>Access your saved posts anytime, even offline</li>
                  <li>Remove posts when you no longer need them</li>
                </ul>
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
    </div>
  )
}
