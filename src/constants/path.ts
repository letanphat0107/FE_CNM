const path = {
  //Authentication
  login: '/login',
  signup: '/signup',
  verifyPhone: '/verify-phone',
  resetPassword: '/reset-password',
  forgotPassword: '/forgot-password',
  verifyOTP: '/verify-otp',
  checkInbox: '/check-inbox',
  loginEmail: '/login-email',
  verifyOTPFEmail: '/verify-otp-email',

  // Dashboard
  dashboard: '/',
  home: '/home',
  profile: '/profile',
  messages: '/messages',
  friends: '/friends',
  notifications: '/notifications',

   // Profile sub-routes
   myPosts: '/profile/my-posts',
   savedPosts: '/profile/saved-posts',
 
   // Settings
   generalSetting: '/profile/settings/general',
   accountSetting: '/profile/settings/account',
   logoutSetting: '/profile/settings/logout',
   historyLogin: '/profile/settings/history-login',

   //video call
   videoCall: '/video-call',

}

export default path
