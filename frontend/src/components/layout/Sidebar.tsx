import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const userType = authService.getUserType();
  const user = authService.getStoredUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-container">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <img src="/logo.svg" alt="Persis Logo" className="logo-image" />
            <span className="logo-text">Persis</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {userType === 'user' && (
            <>
              <Link 
                to="/dashboard" 
                className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/ai-coach" 
                className={`nav-item ${location.pathname === '/ai-coach' ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="9" cy="9" r="2" fill="currentColor"/>
                  <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>AI Coach</span>
              </Link>
              <Link 
                to="/coach-requests" 
                className={`nav-item ${location.pathname === '/coach-requests' ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span>Coach Requests</span>
              </Link>
            </>
          )}
          {userType === 'coach' && (
            <>
              <Link 
                to="/coach/dashboard" 
                className={`nav-item ${location.pathname.startsWith('/coach') ? 'active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span>Dashboard</span>
              </Link>
            </>
          )}
          <Link 
            to={userType === 'user' ? '/settings' : '/coach/settings'} 
            className={`nav-item ${(userType === 'user' && location.pathname === '/settings') || (userType === 'coach' && location.pathname === '/coach/settings') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m16.364-8.364l-4.243 4.243M7.879 16.121l-4.243 4.243m14.728 0l-4.243-4.243M7.879 7.879L3.636 3.636" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

