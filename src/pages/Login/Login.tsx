'use client'

import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContainer } from '../../components/layout/AuthContainer'
import AuthButton from '../../components/common/auth/AuthButton'
import DividerWithBootstrap from '../../components/common/auth/Divider'
import AuthSwitch from '../../components/common/auth/AuthSwitchProps '
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Button from 'src/components/common/Button/Button'

import Input from 'src/components/common/Input/Input'

import { schema, Schema } from 'src/utils/rules'
import { useMutation } from '@tanstack/react-query'
import authApi from 'src/apis/auth.api'
import { isAxiosUnprocessableEntityError } from 'src/utils/utils'
import { ErrorResponse } from 'src/types/utils.type'

import { AppContext } from 'src/contexts/app.context'
import path from 'src/constants/path'
import { v4 as uuidv4 } from 'uuid'

type FormData = Pick<Schema, 'username' | 'password'>
const loginSchema = schema.pick(['username', 'password'])

export default function LoginPage() {
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('profile')
  })

  let storedDeviceId = uuidv4()
  localStorage.setItem('deviceId', storedDeviceId)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(loginSchema)
  })

  //Handle login with data from database
  const loginMutation = useMutation({
    mutationFn: (body: Omit<FormData, 'confirm_password'>) => authApi.login(body)
  })
  const onSubmit = handleSubmit((data) => {
    setIsLoading(true)
    const requestBody = {
      username: data.username, // Sử dụng 'username' là số điện thoại
      password: data.password,
      deviceId: `${storedDeviceId}`
    }

    loginMutation.mutate(requestBody, {
      onSuccess: (data) => {
        setIsAuthenticated(true)
        setProfile(data.data.data.user)
        navigate('/home')
        window.location.reload()
        setIsLoading(false)
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError<ErrorResponse<FormData>>(error)) {
          const formError = error.response?.data.data
          if (formError) {
            Object.keys(formError).forEach((key) => {
              setError(key as keyof FormData, {
                message: formError[key as keyof FormData],
                type: 'Server'
              })
            })
          }
        }
        setIsLoading(false)
      }
    })
  })

  //Handle login with Google
  async function handleGoogleLogin() {
    try {
      const { google } = window

      const client = google.accounts.oauth2.initTokenClient({
        client_id: '714231235616-eg8j97emftncuiif0o4rsf21o4bdfeso.apps.googleusercontent.com',
        scope: 'profile email',
        callback: async (response: GoogleOAuthResponse) => {
          const idToken = response.access_token

          // Gửi token lên backend để xác thực
          const result = await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: idToken })
          })

          if (result.ok) {
            const data = await result.json()
            console.log('Login success:', data)
            localStorage.setItem('authToken', data.token) // Lưu token vào localStorage
          } else {
            console.error('Google Login failed')
          }
        }
      })

      // Hiển thị popup đăng nhập Google
      client.requestAccessToken()
    } catch (error) {
      console.error('Error during Google login:', error)
    }
  }

  //Handle login with Email: Navigate to login-email page
  async function handleEmailLogin() {
    navigate('/login-email')
  }

  return (
    <AuthContainer>
      <div className='card shadow-sm py-4'>
        <div className='card-body p-4'>
          <AuthButton
            onClick={handleGoogleLogin}
            icon={
              <img src='https://www.svgrepo.com/show/303108/google-icon-logo.svg' alt='Google' width='20' height='20' />
            }
            text='Đăng nhập với Google'
          />

          <AuthButton
            onClick={handleEmailLogin}
            icon={
              <img
                src='https://icons.veryicon.com/png/o/business/official-icon-library-of-alibaba/email-fill.png'
                alt='Google'
                width='20'
                height='20'
              />
            }
            text='Đăng nhập với Email'
          />

          <DividerWithBootstrap />

          <form onSubmit={onSubmit} noValidate>
            <Input
              name='username'
              register={register}
              type='text'
              className='mb-3'
              errorMessage={errors.username?.message}
              placeholder='Username'
            />
            <Input
              name='password'
              register={register}
              type='password'
              className='mb-3'
              errorMessage={errors.password?.message}
              placeholder='Password'
              autoComplete='on'
            />

            <div className='text-end mb-5'>
              <a href='/forgot-password' className='text-decoration-none'>
                Quên mật khẩu?
              </a>
            </div>

            <Button type='submit' loading={isLoading} style={{ backgroundColor: '#4C68D5', color: '#fff' }}>
              Đăng nhập
            </Button>
          </form>

          <AuthSwitch question='Bạn chưa có tài khoản?' buttonText='Đăng kí' targetRoute={path.verifyPhone} />
        </div>
      </div>
    </AuthContainer>
  )
}
