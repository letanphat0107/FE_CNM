import { useContext, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import userApi from 'src/apis/user.api'
import { AppContext } from 'src/contexts/app.context'

export default function Profile() {
  const { profile, setProfile } = useContext(AppContext)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      setIsCollapsed(scrollContainer.scrollTop > 10) // 👈 dùng scrollTop đúng chỗ
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  const handleScroll = () => {
    const scrollTop = window.scrollY
    setIsCollapsed(scrollTop > 50) // 👈 chỉnh ngưỡng theo ý muốn
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className='container-fluid p-0' style={{ height: '100vh', overflow: 'hidden' }}>
      {/* User Card */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: 'white',
                 boxShadow: `
      0 -2px 5px rgba(0, 0, 0, 0.08),   /* Top */
      0  2px 5px rgba(0, 0, 0, 0.08),   /* Bottom */
     -2px 0 5px rgba(0, 0, 0, 0.06),    /* Left */
      2px 0 5px rgba(0, 0, 0, 0.06)     /* Right */
    `
        }}
      >
        <div
          className='container'
          style={{
            padding: '0px',
     
          }}
        >
          <div
            className={`card  transition-all ${isCollapsed ? 'p-2' : 'p-4'}`}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              backgroundColor: 'white',
              transition: 'all 0.3s ease',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              borderBottomLeftRadius: '0px',
              borderBottomRightRadius: '0px',

    
            }}
          >
            <div className='row'>
              {/* Avatar + Info - Left Column */}
              <div className='col-md-8 d-flex align-items-center'>
                <img
                  src={
                    profile?.avatar
                      ? profile.avatar
                      : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'
                  }
                  className='rounded-circle me-4'
                  width={isCollapsed ? 44 : 100}
                  height={isCollapsed ? 44 : 100}
                  style={{ objectFit: 'cover', transition: 'all 0.3s ease' }}
                />

                {isCollapsed ? (
                  <h6 className='fw-bold mb-0'>{profile?.displayName || 'Robert Fox'}</h6>
                ) : (
                  <div>
                    <h4 className='mb-1 fw-bold'>{profile?.displayName || 'Robert Fox'}</h4>
                    <div className='text-secondary'>@{profile?.username || 'robert'}</div>
                    <div className='text-secondary'>{profile?.role || 'Software Engineer'}</div>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div className='col-md-4 d-flex align-items-center justify-content-end'>
                  <div className='d-flex gap-4 text-center'>
                    {/* Stats - Right Column */}
                    <div className='col-md-4 d-flex align-items-center justify-content-end'>
                      <div className='d-flex gap-4 text-center'>
                        <div className='px-2'>
                          <div className='fw-bold fs-4'>2</div>
                          <div className='text-secondary'>Posts</div>
                        </div>
                        <div className='px-2'>
                          <div className='fw-bold fs-4'>0</div>
                          <div className='text-secondary'>Followers</div>
                        </div>
                        <div className='px-2'>
                          <div className='fw-bold fs-4'>0</div>
                          <div className='text-secondary'>Following</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nav Tabs - Simplified and cleaner */}
          <ul className='nav pb-2 pt-2 nav-tabs border-top border-0' style={{ backgroundColor: 'white' }}>
            <li className='nav-item'>
              <NavLink
                to='my-posts'
                className={({ isActive }) =>
                  `nav-link px-4 ${isActive ? 'fw-bold text-dark border-0' : 'text-secondary'}`
                }
              >
                My Posts
              </NavLink>
            </li>
            <li className='nav-item'>
              <NavLink
                to='saved-posts'
                className={({ isActive }) =>
                  `nav-link px-4 ${isActive ? 'fw-bold text-dark border-0' : 'text-secondary'}`
                }
              >
                Saved Posts
              </NavLink>
            </li>
            <li className='nav-item'>
              <NavLink
                to='settings'
                className={({ isActive }) =>
                  `nav-link px-4 ${isActive ? 'fw-bold text-dark border-0' : 'text-secondary'}`
                }
              >
                Settings
              </NavLink>
            </li>
          </ul>
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          height: 'calc(100vh - 300px)', // hoặc dynamic nếu cần
          overflowY: 'auto'
        }}
      >
        <Outlet />
      </div>

      {/* Nội dung động */}
    </div>
  )
}
