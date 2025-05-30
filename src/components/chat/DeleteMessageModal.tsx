import React from 'react'
import { Modal, Button } from 'react-bootstrap'

interface DeleteMessageModalProps {
  show: boolean
  onHide: () => void
  onConfirm: () => void
  isDeleting: boolean
}

const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({ show, onHide, onConfirm, isDeleting }) => {
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Xóa tin nhắn</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Tin nhắn này sẽ được xóa khỏi cuộc trò chuyện đối với bạn.</p>
        <p className="text-muted">Lưu ý: Người khác vẫn có thể nhìn thấy tin nhắn này.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
          Hủy bỏ
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Đang xóa...
            </>
          ) : (
            'Xóa tin nhắn'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default DeleteMessageModal