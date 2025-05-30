import React, { useContext } from 'react'
import { AppContext } from 'src/contexts/app.context'

export default function AccountSetting() {
  const { profile } = useContext(AppContext)

  if (!profile) {
    return <div className="text-center mt-5">Đang tải thông tin...</div>
  }

  const fields = [
    { label: 'Họ tên', value: profile.displayName },
    { label: 'Biệt danh', value: profile.nickname || 'Chưa có' },
    { label: 'Tên người dùng', value: profile.username },
    { label: 'Email', value: profile.email },
    { label: 'Ngày sinh', value: profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Chưa cập nhật' },
    { label: 'Tiểu sử', value: profile.bio || 'Chưa có' },
    { label: 'Trạng thái', value: profile.status },
    { label: 'Vai trò', value: profile.role },
    { label: 'Đăng nhập qua', value: profile.authProvider },
    { label: 'Ngày tạo', value: new Date(profile.createdAt).toLocaleString() },
    { label: 'Cập nhật lúc', value: new Date(profile.updatedAt).toLocaleString() }
  ]

  return (
    <div className="container mt-2">
      <h2 className="mb-4 text-start">👤 Thông tin tài khoản</h2>
      <div className="card shadow-sm p-4">
        <div className="row">
          {fields.map((item, index) => (
            <div key={index} className="col-md-6 mb-3">
              <label className="form-label fw-semibold text-muted">{item.label}</label>
              <div className="form-control-plaintext text-dark">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
