import { NavLink, Outlet } from 'react-router-dom'

export default function SettingsLayout() {
  return (
    <div className='container mt-4'>
      <div className='row'>
        {/* Sidebar */}
        <div className='col-md-3 mb-4'>
          <div className='list-group shadow-sm rounded'>
            <NavLink
              to='general'
              className='list-group-item list-group-item-action'
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#4C68D5' : '',
                color: isActive ? '#ffffff' : '',
                fontWeight: isActive ? '600' : '',
                border: 'none'
              })}
            >
              General
            </NavLink>

            <NavLink
              to='account'
              className='list-group-item list-group-item-action'
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#4C68D5' : '',
                color: isActive ? '#ffffff' : '',
                fontWeight: isActive ? '600' : '',
                border: 'none'
              })}
            >
              Account
            </NavLink>

            <NavLink
              to='history-login'
              className='list-group-item list-group-item-action'
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#4C68D5' : '',
                color: isActive ? '#ffffff' : '',
                fontWeight: isActive ? '600' : '',
                border: 'none'
              })}
            >
              History Login
            </NavLink>

            <NavLink
              to='logout'
              className='list-group-item list-group-item-action'
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#4C68D5' : '',
                color: isActive ? '#ffffff' : '',
                fontWeight: isActive ? '600' : '',
                border: 'none'
              })}
            >
              Logout
            </NavLink>
          </div>
        </div>

        {/* Main content */}
        <div className='col-md-9'>
          <div className='shadow-sm p-3 bg-white rounded'>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
