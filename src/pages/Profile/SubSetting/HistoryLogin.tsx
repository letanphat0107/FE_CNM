import React, { useContext, useEffect, useState } from 'react'
import userApi from 'src/apis/user.api'
import { AppContext } from 'src/contexts/app.context'
import { LoginHistoryItem } from 'src/types/history.type'
import { profile } from 'console'

export default function HistoryLogin() {
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const { profile } = useContext(AppContext)

  useEffect(() => {
    const fetchLoginHistory = async () => {
      if(!profile) return
      try {
        const res = await userApi.getHistoryLogin(profile.userId)
        setLoginHistory(res.data.data)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Đã xảy ra lỗi không xác định')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLoginHistory()
  }, [])

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString('vi-VN')
  }

  if (loading) return <div>Đang tải dữ liệu...</div>
  if (error) return <div className='text-danger'>{error}</div>

  return (
  <div className="container mt-3">
    <h3 className="mb-4">🕘 Lịch sử đăng nhập</h3>
    {loginHistory.length === 0 ? (
      <div className="alert alert-info">Không có lịch sử đăng nhập nào.</div>
    ) : (
      <div className="row row-cols-1 g-3">
        {loginHistory.map((item, index) => (
          <div key={index} className="col">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <div className="mb-2">
                  <strong>Thiết bị:</strong> {item.userAgent}
                </div>
                <div className="mb-2">
                  <strong>Thời gian đăng nhập:</strong> {formatDateTime(item.loginTime)}
                </div>
                <div className="mb-2">
                  <strong>Thời gian đăng xuất:</strong>{' '}
                  {item.logoutTime ? formatDateTime(item.logoutTime) : 'Chưa đăng xuất'}
                </div>
                <div>
                  <strong>Trạng thái:</strong>{' '}
                  <span
                    className={`badge ${
                      item.status === 'SUCCESS'
                        ? 'bg-success'
                        : item.status === 'FAILED'
                        ? 'bg-danger'
                        : 'bg-secondary'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

}
