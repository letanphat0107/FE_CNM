import React from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthSwitchProps {
  question: string // Câu hỏi như "Don't have an account?" hoặc "Have an account?"
  buttonText: string // Nút bấm như "Sign up" hoặc "Sign in"
  targetRoute: string // Đường dẫn điều hướng như "/signup" hoặc "/signin"
}

const AuthSwitch: React.FC<AuthSwitchProps> = ({ question, buttonText, targetRoute }) => {
  const navigate = useNavigate()

  return (
    <div className='text-center mt-4'>
      <small className='text-muted'>
        {question}{' '}
        <button 
          onClick={() => navigate(targetRoute)} 
          className='btn btn-link text-decoration-none p-0 align-baseline'
          style={{ color: '#4C68D5' }}
        >
          {buttonText}
        </button>
      </small>
    </div>
  )
}

export default AuthSwitch
