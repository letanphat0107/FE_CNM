import { useMutation } from '@tanstack/react-query'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import userApi from 'src/apis/user.api'
import path from 'src/constants/path'
import { AppContext } from 'src/contexts/app.context'
import { setProfileToLS } from 'src/utils/auth'

export default function GeneralSetting() {
  const { profile, setProfile } = useContext(AppContext)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    nickname: profile?.nickname || '',
    bio: profile?.bio || '',
    dob: profile?.dob || '',
    email: profile?.email || ''
  })

  // Hiển thị preview ảnh đại diện
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar || null)

  const getProfile = async () => {
      try {
        const res = await userApi.getProfile()
        setProfile(res.data.data)
      } catch (error) {
        toast.error('Server error')
      }
    }

  useEffect(() => {
    getProfile()
  }, [setProfile])

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await userApi.uploadAvatar(formData)
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Upload ảnh thành công!')
    },
    onError: (error: any) => {
      toast.error('Upload ảnh thất bại!')
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await userApi.updateProfile(data)
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Cập nhật thông tin thành công!')
      
      // Cập nhật thông tin trong localStorage và context
      const updatedProfile = { ...profile, ...data.data }
      setProfileToLS(updatedProfile)
      setProfile(updatedProfile)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Cập nhật thông tin thất bại!'
      toast.error(errorMessage)
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Kiểm tra các trường bắt buộc
    if (!formData.displayName?.trim()) {
      toast.error('Vui lòng nhập tên hiển thị')
      return
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      toast.error('Định dạng email không hợp lệ')
      return
    }
    
    // Tạo promise array để thực hiện các mutations
    const mutations: Promise<any>[] = []
    
    // Nếu có file ảnh, thêm mutation upload ảnh
    if (selectedFile) {
      mutations.push(uploadAvatarMutation.mutateAsync(selectedFile))
    }
    
    // Tạo và điền FormData cho cập nhật thông tin
    const profileFormData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        profileFormData.append(key, value)
      }
    })

    console.log(profileFormData)
    
    // Thêm mutation cập nhật thông tin cá nhân
    mutations.push(updateProfileMutation.mutateAsync(profileFormData))
    
    // Thực hiện tất cả mutations
    Promise.all(mutations)
      .then(() => {
        getProfile()
      })
      .catch((error) => {
        console.error('Error updating profile:', error)
      })
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh tối đa là 5MB')
        return
      }
      
      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn tệp hình ảnh')
        return
      }
      
      setSelectedFile(file)
      
      // Tạo URL preview cho file đã chọn
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
      
      // Cleanup URL khi component unmount
      return () => URL.revokeObjectURL(fileUrl)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return ''
    
    // Kiểm tra xem dateString có phải định dạng DD/MM/YYYY
    const parts = dateString.split('/')
    if (parts.length === 3) {
      // Chuyển từ DD/MM/YYYY sang YYYY-MM-DD cho input type="date"
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    
    // Kiểm tra xem có phải định dạng ISO (có chứa 'T')
    if (dateString.includes('T')) {
      try {
        const date = new Date(dateString)
        // Trả về định dạng YYYY-MM-DD cho input type="date"
        return date.toISOString().split('T')[0]
      } catch (error) {
        console.error('Lỗi chuyển đổi ngày:', error)
        return ''
      }
    }
    formData.dob = formatDateForApi(dateString) // Cập nhật lại giá trị nếu không phải định dạng hỗ trợ
    return dateString // Trả về nguyên giá trị nếu không phải định dạng hỗ trợ
  }
  
  const formatDateForApi = (dateString: string) => {
    if (!dateString) return ''
    
    // Chuyển đổi từ YYYY-MM-DD (định dạng của input) sang DD/MM/YYYY (định dạng API)
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    // Chuyển đổi định dạng ngày từ input (YYYY-MM-DD) sang định dạng API (DD/MM/YYYY)
    const formattedDate = value ? formatDateForApi(value) : ''
    
    setFormData(prev => ({
      ...prev,
      dob: formattedDate
    }))
  }

  return (
    <div className='container mt-2'>
      <h2 className='mb-4'>Cập nhật thông tin cá nhân</h2>
      <form onSubmit={handleSubmit} className='border p-4 rounded shadow-sm'>
        {/* Avatar upload section */}
        <div className='mb-4 text-center'>
          <div className='position-relative d-inline-block mb-3'>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                className="rounded-circle" 
                alt="Avatar" 
                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
              />
            ) : (
              <div 
                className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                style={{ width: '120px', height: '120px' }}
              >
                <i className="bi bi-person-circle fs-1 text-secondary"></i>
              </div>
            )}
          </div>
          
          <div className='mb-3'>
            <label className='btn btn-outline-secondary'>
              <i className="bi bi-upload me-2"></i>
              Chọn ảnh đại diện
              <input
                type='file'
                accept='image/*'
                className='d-none'
                onChange={handleFileChange}
              />
            </label>
            <div className='text-muted small mt-1'>Định dạng JPG, PNG. Tối đa 5MB.</div>
          </div>
        </div>
        
        {/* Personal information fields */}
        <div className='mb-3'>
          <label className='form-label'>Tên hiển thị <span className="text-danger">*</span></label>
          <input
            type='text'
            className='form-control'
            name='displayName'
            value={formData.displayName}
            onChange={handleInputChange}
            placeholder='Nhập tên hiển thị'
            required
          />
        </div>
        
        <div className='mb-3'>
          <label className='form-label'>Nickname</label>
          <input
            type='text'
            className='form-control'
            name='nickname'
            value={formData.nickname}
            onChange={handleInputChange}
            placeholder='Nhập nickname'
          />
        </div>
        
        <div className='mb-3'>
          <label className='form-label'>Ngày sinh</label>
          <input
            type='date'
            className='form-control'
            name='dob'
            value={formatDateForInput(formData.dob)}
            onChange={handleDateChange}
          />
        </div>
        
        <div className='mb-3'>
          <label className='form-label'>Email</label>
          <input
            type='email'
            className='form-control'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            placeholder='your.email@example.com'
          />

        </div>
        
        <div className='mb-4'>
          <label className='form-label'>Tiểu sử</label>
          <textarea
            className='form-control'
            name='bio'
            value={formData.bio}
            onChange={handleInputChange}
            placeholder='Giới thiệu bản thân'
            rows={4}
            maxLength={300}
          />
          <div className="form-text text-end">{formData.bio?.length || 0}/300</div>
        </div>
        
        {/* Submit button */}
        <div className='text-center'>
          <button 
            type='submit' 
            className='btn btn-primary py-2 px-4'
            disabled={uploadAvatarMutation.isPending || updateProfileMutation.isPending}
          >
            {(uploadAvatarMutation.isPending || updateProfileMutation.isPending) ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang lưu...
              </>
            ) : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
      
      <div className='text-end mb-5 mt-3'>
        <a href={path.resetPassword} className='text-decoration-none text-primary'>
          <i className="bi bi-key me-1"></i> Cập nhật mật khẩu
        </a>
      </div>
    </div>
  )
}