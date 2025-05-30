import { NavLink, Outlet } from 'react-router-dom'

export default function SettingsLayout() {
  return (
    <div className="container mt-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 mb-4">
          <div className="list-group shadow-sm rounded">
            <NavLink 
              to="general" 
              className={({ isActive }) => 
                `list-group-item list-group-item-action ${isActive ? 'active fw-semibold' : ''}`
              }>
              General
            </NavLink>
            <NavLink 
              to="account" 
              className={({ isActive }) => 
                `list-group-item list-group-item-action ${isActive ? 'active fw-semibold' : ''}`
              }>
              Account
            </NavLink>
            <NavLink
              to="history-login" 
              className={({ isActive }) => 
                `list-group-item list-group-item-action ${isActive ? 'active fw-semibold' : ''}`
              }>
              History Login
            </NavLink>
            <NavLink 
              to="logout" 
              className="list-group-item list-group-item-action">
              Logout
            </NavLink>
          </div>
        </div>

        {/* Main content */}
        <div className="col-md-9">
          <div className="shadow-sm p-3 bg-white rounded">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}


