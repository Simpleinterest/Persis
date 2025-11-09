import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const userType = authService.getUserType();
  const user = authService.getStoredUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Persis</span>
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              {userType === 'user' && (
                <Link to="/ai-coach" className="nav-link">
                  AI Coach
                </Link>
              )}
              {userType === 'coach' && (
                <Link to="/coach/dashboard" className="nav-link">
                  Dashboard
                </Link>
              )}
              <Link to="/settings" className="nav-link">
                Settings
              </Link>
              <div className="user-info">
                <span className="username">
                  {user && (user as any).userName}
                </span>
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link register-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

