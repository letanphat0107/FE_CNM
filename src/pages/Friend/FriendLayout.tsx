import { NavLink, Outlet } from 'react-router-dom'
import { HiOutlineUserGroup, HiOutlineUserAdd } from 'react-icons/hi'
import { BsSearch, BsPersonPlus } from 'react-icons/bs'
import { AiOutlineUsergroupAdd } from 'react-icons/ai'
import { useState } from 'react'
import MakeFriendModal from 'src/components/friend/MakeFriend/MakeFriendModal'
import CreateGroupModal from 'src/components/friend/CreateGroup/CreateGroupModal'

export default function FriendLayout() {
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)

  return (
    <div className='container-fluid p-0' style={{ overflowY: 'hidden'             ,boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
            borderRadius: '8px'}}>
      <div className='row g-0'>
        {/* Fixed Sidebar */}
        <div className='col-md-3' style={{ position: 'sticky', top: 0, height: '100vh' }}>
          <div className='bg-white border-end' style={{ height: '100%', overflowY: 'auto' }}>
            <div className='p-3'>
              <div className='d-flex align-items-center mb-4'>
                <div className='input-group'>
                  <span className='input-group-text bg-light border-0'>
                    <BsSearch />
                  </span>
                  <input type='text' className='form-control bg-light border-0' placeholder='Tìm kiếm' />
                </div>
                <button className='btn btn-light ms-2' title='Thêm bạn' onClick={() => setShowAddFriendModal(true)}>
                  <BsPersonPlus />
                </button>
                <button className='btn btn-light ms-2' title='Tạo nhóm' onClick={() => setShowCreateGroupModal(true)}>
                  <AiOutlineUsergroupAdd />
                </button>
              </div>
              <ul className='nav flex-column'>
                <li className='nav-item mb-2'>
                  <NavLink
                    to=''
                    className={({ isActive }) =>
                      `nav-link d-flex align-items-center fw-medium ${isActive ? 'text-dark bg-light rounded' : 'text-secondary'}`
                    }
                    end
                  >
                    <HiOutlineUserGroup className='me-2' size={20} />
                    <span>Danh sách bạn bè</span>
                  </NavLink>
                </li>
                <li className='nav-item mb-2'>
                  <NavLink
                    to='groups'
                    className={({ isActive }) =>
                      `nav-link d-flex align-items-center fw-medium ${isActive ? 'text-dark bg-light rounded' : 'text-secondary'}`
                    }
                  >
                    <HiOutlineUserGroup className='me-2' size={20} />
                    <span>Danh sách nhóm và cộng đồng</span>
                  </NavLink>
                </li>
                <li className='nav-item mb-2'>
                  <NavLink
                    to='invites'
                    className={({ isActive }) =>
                      `nav-link d-flex align-items-center fw-medium ${isActive ? 'text-dark bg-light rounded' : 'text-secondary'}`
                    }
                  >
                    <HiOutlineUserAdd className='me-2' size={20} />
                    <span>Lời mời kết bạn</span>
                  </NavLink>
                </li>
                <li className='nav-item mb-2'>
                  <NavLink
                    to='group-invites'
                    className={({ isActive }) =>
                      `nav-link d-flex align-items-center fw-medium ${isActive ? 'text-dark bg-light rounded' : 'text-secondary'}`
                    }
                  >
                    <HiOutlineUserGroup className='me-2' size={20} />
                    <span>Lời mời vào nhóm và cộng đồng</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className='col-md-9 bg-white' style={{ height: '100vh', overflowY: 'auto' }}>
          <div className='p-4'>
            <Outlet />
          </div>
        </div>
      </div>

      {/* Sử dụng các component Modal */}
      <MakeFriendModal 
        show={showAddFriendModal} 
        onHide={() => setShowAddFriendModal(false)} 
      />
      
      <CreateGroupModal 
        show={showCreateGroupModal} 
        onHide={() => setShowCreateGroupModal(false)} 
      />
    </div>
  )
}