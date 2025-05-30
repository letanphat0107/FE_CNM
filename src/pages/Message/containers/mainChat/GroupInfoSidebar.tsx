import { useState, useRef, useEffect } from 'react'
import { FaUserPlus, FaUserMinus, FaTrash, FaUserShield, FaChevronLeft, FaSignOutAlt } from 'react-icons/fa'
import { BsThreeDots } from 'react-icons/bs'
import { Conversation, Participant } from 'src/types/message.type'
import { User } from 'src/types/user.type'
import { toast } from 'react-toastify'
import groupAPI from 'src/apis/group.api'
import { Modal } from 'react-bootstrap'

interface GroupInfoSidebarProps {
  show: boolean
  onHide: () => void
  conversation: Conversation
  participants: Participant[]
  onAddMember: () => void
  currentUserId: string
  isAdmin?: boolean

  onMemberRemoved?: (memberId: string) => void
  onMemberPromoted?: (memberId: string) => void
  onGroupDissolved?: (groupId: string) => void
  onLeaveGroup?: (groupId: string) => void
  onDemoteModerator?: (memberId: string) => void
  onTransferOwnership?: (newOwnerId: string) => void
}

const GroupInfoSidebar = ({
  show,
  onHide,
  conversation,
  participants,
  onAddMember,
  currentUserId,
  isAdmin = true,
  onMemberRemoved,
  onMemberPromoted,
  onGroupDissolved,
  onLeaveGroup,
  onDemoteModerator,
  onTransferOwnership
}: GroupInfoSidebarProps) => {
  const [showMemberList, setShowMemberList] = useState(false)
  const [showMemberOptions, setShowMemberOptions] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'promote' | 'demote' | 'dissolve' | 'leave' | null
    memberId?: string
    memberName?: string
  } | null>(null)
  const [blockRejoin, setBlockRejoin] = useState(false)
  const [showTransferOwnerModal, setShowTransferOwnerModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);

  const optionsRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown options khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowMemberOptions(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Tìm vai trò của user
  const getUserRole = (user: Participant) => {
    if (user.role === 'ADMIN') return 'Trưởng nhóm'
    if (user.role === 'MODERATOR') return 'Phó nhóm'
    return 'Thành viên'
  }

  // Cập nhật các hàm xử lý khi thực hiện các hành động quản lý nhóm

  // Xử lý khi xóa thành viên
  const handleRemoveMember = async (memberId: string) => {
    try {
      await groupAPI.removeMember(conversation.id, memberId)
      toast.success('Đã xóa thành viên khỏi nhóm')

      if (onMemberRemoved) {
        onMemberRemoved(memberId)
      }

      setShowMemberOptions(null)
      setConfirmAction(null)
      setBlockRejoin(false) // Reset checkbox chặn tham gia lại
    } catch (error) {
      toast.error('Không thể xóa thành viên')
      console.error(error)
    }
  }

  // Xử lý khi thăng chức thành viên thành phó nhóm
  const handlePromoteMember = async (memberId: string) => {
    try {
      await groupAPI.addModerator(conversation.id, memberId)
      toast.success('Đã thêm thành viên làm phó nhóm')

      if (onMemberPromoted) {
        onMemberPromoted(memberId)
      }

      setShowMemberOptions(null)
      setConfirmAction(null)
    } catch (error) {
      toast.error('Không thể thăng chức thành viên')
      console.error(error)
    }
  }

  // Xử lý khi giải tán nhóm
  const handleDissolveGroup = async () => {
    try {
      await groupAPI.dissolution(conversation.id)
      toast.success('Đã giải tán nhóm')

      if (onGroupDissolved) {
        onGroupDissolved(conversation.id)
      }

      setShowMemberOptions(null)
      setConfirmAction(null)
    } catch (error) {
      toast.error('Không thể giải tán nhóm')
      console.error(error)
    }
  }

  const handleDemoteModerator = async (memberId: string) => {
    try {
      await groupAPI.removeModerator(conversation.id, memberId);
      toast.success('Đã gỡ quyền phó nhóm');
      
      if (onDemoteModerator) {
        onDemoteModerator(memberId);
      }
      
      setShowMemberOptions(null);
      setConfirmAction(null);
    } catch (error) {
      toast.error('Không thể gỡ quyền phó nhóm');
      console.error(error);
    }
  };

  // Thêm hàm xử lý rời nhóm
  const handleLeaveGroup = async () => {
    try {
      await groupAPI.leaveGroup(conversation.id);
      
      if (onLeaveGroup) {
        onLeaveGroup(conversation.id);
      }
      
      onHide();
    } catch (error) {
      toast.error('Không thể rời khỏi nhóm');
      console.error(error);
    }
  };

  // Thêm hàm chuyển quyền cho người khác
  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) {
      toast.error('Vui lòng chọn người nhận quyền trưởng nhóm');
      return;
    }

    try {
      await groupAPI.transferOwner(conversation.id, selectedNewOwner);
      toast.success('Đã chuyển quyền trưởng nhóm');
      
      if (onTransferOwnership) {
        onTransferOwnership(selectedNewOwner);
      }

      setShowTransferOwnerModal(false);
      
      // Sau khi chuyển quyền, có thể tự động rời nhóm
      await handleLeaveGroup();
    } catch (error) {
      toast.error('Không thể chuyển quyền trưởng nhóm');
      console.error(error);
    }
  };

  // Kiểm tra xem người đang đăng nhập có phải là admin không
  const isCurrentUserAdmin = participants.some(
    p => p.userId === currentUserId && p.role === 'ADMIN'
  );

  // Kiểm tra xem người đang đăng nhập có phải là moderator không
  const isCurrentUserModerator = participants.some(
    p => p.userId === currentUserId && p.role === 'MODERATOR'
  );

  return (
    <>
      <div
        className='group-info-sidebar position-absolute'
        style={{
          top: 0,
          right: 0,
          width: '300px',
          height: '100%',
          zIndex: 1000,
          transition: 'transform 0.3s ease',
          display: show ? 'block' : 'none',
          transform: show ? 'translateX(0)' : 'translateX(100%)',
          overflowY: 'auto',
          boxShadow: '-5px 0 15px rgba(0,0,0,0.1)',
          backgroundColor: '#F1F4F9',
          color: '#0C1024'
        }}
      >
        {!showMemberList ? (
          // Màn hình chính của sidebar
          <>
            <div className='p-3 border-bottom border-secondary'>
              <div className='d-flex justify-content-between align-items-center mb-3'>
                <h5 className='mb-0'>Thông tin nhóm</h5>
                <button className='btn-close btn-close-black' onClick={onHide}></button>
              </div>

              <div className='text-center mb-3'>
                <img
                  src={conversation.avatar || 'https://via.placeholder.com/80'}
                  alt='Group avatar'
                  className='rounded-circle'
                  style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                />
                <h6 className='mt-2'>{conversation.name}</h6>
              </div>
            </div>

            <div className='p-3 border-bottom border-secondary'>
              <div
                className='d-flex justify-content-between align-items-center cursor-pointer'
                onClick={() => setShowMemberList(true)}
                style={{ cursor: 'pointer' }}
              >
                <h6>Thành viên nhóm</h6>
                <span className='badge bg-secondary'>{participants.length}</span>
              </div>

              <div className='mt-2 overflow-auto' style={{ maxHeight: '200px' }}>
                {/* Hiển thị 5 thành viên đầu tiên */}
                {participants.slice(0, 5).map((participant) => (
                  <div key={participant.userId} className='d-flex align-items-center p-2'>
                    <img
                      src={participant.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'}
                      alt={participant.displayName}
                      className='rounded-circle me-2'
                      style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                    />
                    <div>
                      <div>{participant.displayName}</div>
                      <small className='text-muted'>{getUserRole(participant)}</small>
                    </div>
                  </div>
                ))}

                {participants.length > 5 && (
                  <div className='text-center mt-2'>
                    <button className='btn btn-sm btn-outline-secondary' onClick={() => setShowMemberList(true)}>
                      Xem tất cả
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className='p-3'>
              <h6 className='mb-3'>Quản lý nhóm</h6>
              <div className='list-group border-0'>
                <button
                  className='list-group-item list-group-item-action d-flex align-items-center border-0'
                  style={{ backgroundColor: '#F1F4F9', color: '#0C1024' }}
                  onClick={onAddMember}
                >
                  <FaUserPlus className='me-3' />
                  Thêm thành viên
                </button>
                {/* Button rời nhóm - hiển thị cho tất cả */}
                <button
                  className='list-group-item list-group-item-action d-flex align-items-center border-0 text-danger'
                  style={{ backgroundColor: '#F1F4F9', color: '#0C1024' }}
                  onClick={() => {
                    if (isCurrentUserAdmin) {
                      // Nếu là admin, phải chuyển quyền trước
                      setShowTransferOwnerModal(true);
                    } else {
                      // Nếu không phải admin, có thể rời nhóm trực tiếp
                      setConfirmAction({ type: 'leave' });
                    }
                  }}
                >
                  <FaSignOutAlt className='me-3' />
                  Rời nhóm
                </button>
                {isAdmin && (
                  <button
                    className='list-group-item list-group-item-action d-flex align-items-center border-0 text-danger'
                    style={{ backgroundColor: '#F1F4F9' }}
                    onClick={() => setConfirmAction({ type: 'dissolve' })}
                  >
                    <FaTrash className='me-3' />
                    Giải tán nhóm
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          // Màn hình danh sách thành viên
          <div className='h-100 d-flex flex-column'>
            <div className='p-3 border-bottom border-secondary'>
              <div className='d-flex align-items-center'>
                <button className='btn btn-sm btn-light me-2' onClick={() => setShowMemberList(false)}>
                  <FaChevronLeft />
                </button>
                <h5 className='mb-0'>Thành viên</h5>
              </div>
            </div>

            <div className='p-3'>
              <button className='btn btn-outline-primary w-100 mb-3' style={{borderColor: '#4C68D5', color: "#4C68D5"}} onClick={onAddMember}>
                <FaUserPlus className='me-2' /> Thêm thành viên
              </button>

              <h6 className='d-flex align-items-center justify-content-between'>
                Danh sách thành viên ({participants.length})
              </h6>

              <div className='overflow-auto' style={{ flex: 1, height: 'calc(100vh - 290px)', maxHeight: '100%' }}>
                {/* Trưởng nhóm */}
                {participants
                  .filter((participant) => participant.role === 'ADMIN')
                  .map((admin) => (
                    <div key={admin.userId} className='d-flex align-items-center p-2 border-bottom'>
                      <img
                        src={admin.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'}
                        alt={admin.displayName}
                        className='rounded-circle me-2'
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                      <div className='flex-grow-1'>
                        <div>{admin.displayName}</div>
                        <small className=''>Trưởng nhóm</small>
                      </div>
                    </div>
                  ))}

                {/* Phó nhóm */}
                {participants
                  .filter((participant) => participant.role === 'MODERATOR')
                  .map((mod) => (
                    <div key={mod.userId} className='d-flex align-items-center p-2 border-bottom position-relative'>
                      <img
                        src={mod.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'}
                        alt={mod.displayName}
                        className='rounded-circle me-2'
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                      <div className='flex-grow-1'>
                        <div>{mod.displayName}</div>
                        <small className=''>Phó nhóm</small>
                      </div>

                      {isAdmin && mod.userId !== currentUserId && (
                        <div className='position-relative'>
                          <button className='btn btn-sm btn-light' onClick={() => setShowMemberOptions(mod.userId)}>
                            <BsThreeDots />
                          </button>

                          {showMemberOptions === mod.userId && (
                            <div
                              ref={optionsRef}
                              className='position-absolute end-0 bg-white shadow rounded py-1'
                              style={{
                                border: 'none',
                                background: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                width: '150px'
                              }}
                            >
                              {/* Thêm nút gỡ quyền phó nhóm */}
                          <button
                            className='dropdown-item text-start w-100 py-2 px-3'
                            onClick={() => {
                              setConfirmAction({
                                type: 'demote',
                                memberId: mod.userId,
                                memberName: mod.displayName
                              });
                              setShowMemberOptions(null);
                            }}
                            style={{
                              border: 'none',
                              background: 'none',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            Gỡ quyền phó nhóm
                          </button>
                              <button
                                className='dropdown-item text-start w-100 py-2 px-3 text-danger'
                                onClick={() => {
                                  setConfirmAction({
                                    type: 'delete',
                                    memberId: mod.userId,
                                    memberName: mod.displayName
                                  })
                                  setShowMemberOptions(null)
                                }}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                              >
                                Xóa khỏi nhóm
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                {/* Thành viên thường */}
                {participants
                  .filter((participant) => participant.role !== 'ADMIN' && participant.role !== 'MODERATOR')
                  .map((member) => (
                    <div key={member.userId} className='d-flex align-items-center p-2 border-bottom'>
                      <img
                        src={member.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtuphMb4mq-EcVWhMVT8FCkv5dqZGgvn_QiA&s'}
                        alt={member.displayName}
                        className='rounded-circle me-2'
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                      <div className='flex-grow-1'>
                        <div>{member.displayName}</div>
                        <small className=''>Thành viên</small>
                      </div>

                      {isAdmin && member.userId !== currentUserId && (
                        <div className='position-relative'>
                          <button className='btn btn-sm btn-light' onClick={() => setShowMemberOptions(member.userId)}>
                            <BsThreeDots />
                          </button>

                          {showMemberOptions === member.userId && (
                            <div
                              ref={optionsRef}
                              className='position-absolute bg-white shadow rounded py-1'
                              style={{
                                zIndex: 10,
                                width: '150px',
                                right: '0',
                                top: '100%',
                                border: '1px solid #e9ecef',
                                marginTop: '5px'
                              }}
                            >
                              <button
                                className='dropdown-item text-start w-100 py-2 px-3'
                                onClick={() => {
                                  setConfirmAction({
                                    type: 'promote',
                                    memberId: member.userId,
                                    memberName: member.displayName
                                  })
                                  setShowMemberOptions(null)
                                }}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                              >
                                Thêm phó nhóm
                              </button>
                              <button
                                className='dropdown-item text-start w-100 py-2 px-3 text-danger'
                                onClick={() => {
                                  setConfirmAction({
                                    type: 'delete',
                                    memberId: member.userId,
                                    memberName: member.displayName
                                  })
                                  setShowMemberOptions(null)
                                }}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                              >
                                Xóa khỏi nhóm
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thêm modal xác nhận gỡ quyền phó nhóm */}
      <Modal show={confirmAction?.type === 'demote'} onHide={() => setConfirmAction(null)} centered size='sm'>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Gỡ quyền phó nhóm của {confirmAction?.memberName}?</p>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-secondary' onClick={() => setConfirmAction(null)}>
            Đóng
          </button>
          <button
            className='btn btn-primary'
            onClick={() => {
              if (confirmAction?.memberId) {
                handleDemoteModerator(confirmAction.memberId);
              }
            }}
          >
            Đồng ý
          </button>
        </Modal.Footer>
      </Modal>

      {/* Thêm modal xác nhận rời nhóm */}
      <Modal show={confirmAction?.type === 'leave'} onHide={() => setConfirmAction(null)} centered size='sm'>
        <Modal.Header closeButton>
          <Modal.Title>Rời nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn rời khỏi nhóm?</p>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-secondary' onClick={() => setConfirmAction(null)}>
            Hủy
          </button>
          <button className='btn btn-primary' onClick={handleLeaveGroup}>
            Rời nhóm
          </button>
        </Modal.Footer>
      </Modal>

      {/* Thêm modal chuyển quyền trưởng nhóm */}
      <Modal show={showTransferOwnerModal} onHide={() => setShowTransferOwnerModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chuyển quyền trưởng nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Chọn người để chuyển quyền trưởng nhóm trước khi rời nhóm:</p>
          <div className='mt-3' style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {participants
              .filter(p => p.userId !== currentUserId && p.role === 'MODERATOR')
              .map(user => (
                <div 
                  key={user.userId} 
                  className={`d-flex align-items-center p-2 border rounded mb-2 ${
                    selectedNewOwner === user.userId ? 'bg-light' : ''
                  }`}
                  onClick={() => setSelectedNewOwner(user.userId)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={user.avatar || 'https://via.placeholder.com/40'}
                    alt={user.displayName}
                    className='rounded-circle me-2'
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                  <div>
                    <div>{user.displayName}</div>
                    <small className='text-muted'>Phó nhóm</small>
                  </div>
                  {selectedNewOwner === user.userId && (
                    <div className='ms-auto'>
                      <i className='fas fa-check text-primary'></i>
                    </div>
                  )}
                </div>
              ))}
              
            {participants.filter(p => p.userId !== currentUserId && p.role === 'MODERATOR').length === 0 && (
              <div className='alert alert-warning'>
                <p>Không có phó nhóm nào để chuyển quyền. Vui lòng thêm ít nhất một phó nhóm trước khi rời nhóm.</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-secondary' onClick={() => setShowTransferOwnerModal(false)}>
            Hủy
          </button>
          <button 
            className='btn btn-primary' 
            onClick={handleTransferOwnership}
            disabled={!selectedNewOwner || participants.filter(p => p.role === 'MODERATOR').length === 0}
            style={{backgroundColor: '#4C68D5'}}
          >
            Chuyển quyền & Rời nhóm
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận xóa thành viên */}
      <Modal show={confirmAction?.type === 'delete'} onHide={() => setConfirmAction(null)} centered size='sm'>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Xóa thành viên này khỏi nhóm?</p>
          <div className='form-check'>
            <input
              type='checkbox'
              className='form-check-input'
              id='blockRejoin'
              checked={blockRejoin}
              onChange={(e) => setBlockRejoin(e.target.checked)}
            />
            <label className='form-check-label' htmlFor='blockRejoin'>
              Chặn người này tham gia lại
            </label>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-secondary' onClick={() => setConfirmAction(null)}>
            Đóng
          </button>
          <button
            className='btn btn-primary'
            onClick={() => {
              if (confirmAction?.memberId) {
                handleRemoveMember(confirmAction.memberId)
              }
            }}
          >
            Đồng ý
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận thăng chức thành viên */}
      <Modal show={confirmAction?.type === 'promote'} onHide={() => setConfirmAction(null)} centered size='sm'>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Thêm {confirmAction?.memberName} làm phó nhóm?</p>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-secondary' onClick={() => setConfirmAction(null)}>
            Đóng
          </button>
          <button
            className='btn btn-primary'
            onClick={() => {
              if (confirmAction?.memberId) {
                handlePromoteMember(confirmAction.memberId)
              }
            }}
          >
            Đồng ý
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận giải tán nhóm */}
      <Modal show={confirmAction?.type === 'dissolve'} onHide={() => setConfirmAction(null)} centered size='sm'>
        <Modal.Header closeButton>
          <Modal.Title>Giải tán nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Mời tất cả mọi người rời nhóm và xóa tin nhắn? Nhóm đã giải tán sẽ KHÔNG THỂ khôi phục.</p>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-secondary' onClick={() => setConfirmAction(null)}>
            Không
          </button>
          <button className='btn btn-danger' onClick={handleDissolveGroup}>
            Giải tán nhóm
          </button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default GroupInfoSidebar
