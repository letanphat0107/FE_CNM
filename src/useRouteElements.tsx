import React, { useContext } from 'react'
import { Navigate, useRoutes, Outlet } from 'react-router-dom'

import Login from './pages/Login'
import SignUpPage from './pages/Register'
import VerifyPhone from './pages/verifyOTP/VerifyPhone'
import ResetPassword from './components/auth/ResetPassword'
import ForgotPassword from './components/auth/ForgotPassword'
import VerifyOTP from './components/auth/VerifyOTP'
import CheckInbox from './components/auth/CheckInbox'
import LoginEmail from './components/auth/LoginEmail'

import Layout from './pages/DashboardPage'
import Home from './pages/HomePage/HomePage'
import Profile from './pages/Profile'
import Notifications from './pages/Notification/Notifications'

import path from './constants/path'
import SettingsLayout from './pages/Profile/SubSetting/SettingsLayout'
import GeneralSetting from './pages/Profile/SubSetting/GeneralSetting'
import AccountSetting from './pages/Profile/SubSetting/AccountSetting'
import LogoutSetting from './pages/Profile/SubSetting/LogoutSetting'
import VerifyOTPFEmail from './components/auth/VerifyOTPFEmail'
import HistoryLogin from './pages/Profile/SubSetting/HistoryLogin'
import Messages from './pages/Message/page'
import { AppContext } from './contexts/app.context'
import FriendLayout from './pages/Friend/FriendLayout'
import FriendList from './pages/Friend/MainContent/FriendList'
import GroupList from './pages/Friend/MainContent/GroupList'
import InviteList from './pages/Friend/MainContent/InviteList'
import GroupInvites from './pages/Friend/MainContent/GroupInvites'
import MyPost from './pages/PostList/MyPost'
import SavedPost from './pages/PostList/SavedPost'
import VideoCallWrapper from './components/videocall/VideoCall'

function ProtectedRoute() {
  const { isAuthenticated } = useContext(AppContext)
  return isAuthenticated ? <Outlet /> : <Navigate to={path.login} />
}

function RejectedRoute() {
  const { isAuthenticated } = useContext(AppContext)
  return !isAuthenticated ? <Outlet /> : <Navigate to={path.home} />
}

export default function useRouteElements() {
  const routeElements = useRoutes([
    // Rejected routes (chỉ vào được khi chưa login)
    {
      path: '',
      element: <RejectedRoute />,
      children: [
        {
          index: true,
          element: <Navigate to={path.login} replace />
        },
        {
          path: '',
          children: [
            { path: path.login, element: <Login /> },
            { path: path.signup, element: <SignUpPage /> },
            { path: path.verifyPhone, element: <VerifyPhone /> },
            { path: path.resetPassword, element: <ResetPassword /> },
            { path: path.forgotPassword, element: <ForgotPassword /> },
            { path: path.verifyOTP, element: <VerifyOTP /> },
            { path: path.checkInbox, element: <CheckInbox /> },
            { path: path.loginEmail, element: <LoginEmail /> },
            { path: path.verifyOTPFEmail, element: <VerifyOTPFEmail /> }
          ]
        }
      ]
    },

    // Protected routes (cần login mới vào được)
    {
      path: '',
      element: <ProtectedRoute />,
      children: [
        {
          path: '/',
          element: <Layout />, // Layout chung (sidebar + header)
          children: [
            { path: path.home, element: <Home /> },
            {
              path: path.profile.slice(1),
              element: <Profile />,
              children: [
                { path: 'my-posts', element: <MyPost /> },
                { path: 'saved-posts', element: <SavedPost /> },
                {
                  path: 'settings',
                  element: <SettingsLayout />,
                  children: [
                    { path: 'general', element: <GeneralSetting /> },
                    { path: 'account', element: <AccountSetting /> },
                    { path: 'logout', element: <LogoutSetting /> },
                    { path: 'history-login', element: <HistoryLogin /> }
                  ]
                }
              ]
            },
            { path: path.messages.slice(1), element: <Messages /> },
            {
              path: 'friends',
              element: <FriendLayout />,
              children: [
                { path: '', element: <FriendList /> },
                { path: 'groups', element: <GroupList /> },
                { path: 'invites', element: <InviteList /> },
                { path: 'group-invites', element: <GroupInvites /> }
              ]
            },

            { path: path.notifications.slice(1), element: <Notifications /> }
          ]
        }
      ]
    },

    // Redirect dashboard về login (hoặc nơi khác nếu muốn)
    {
      path: path.dashboard,
      element: <Navigate to={path.login} replace />
    },

    {
      path:"/video-call",
       element:<VideoCallWrapper />
    }
  ])

  return routeElements
}
