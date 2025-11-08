import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME, ROUTES, COLORS } from '../../utils/constants';
import { isAuthenticated } from '../../services/auth';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('coach');
    localStorage.removeItem('userType');
    navigate(ROUTES.HOME);
  };

  return (
    <header className="header" style={{ backgroundColor: COLORS.secondary, borderBottom: `2px solid ${COLORS.accent}` }}>
      <div className="header-container">
        <Link to={ROUTES.HOME} className="header-logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" stroke="#D4AF37" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="16" r="4" fill="#D4AF37"/>
              <path d="M 16 2 Q 24 8 24 16" stroke="#D4AF37" strokeWidth="2" fill="none"/>
              <path d="M 16 2 Q 8 8 8 16" stroke="#D4AF37" strokeWidth="2" fill="none"/>
              <path d="M 16 30 Q 24 24 24 16" stroke="#D4AF37" strokeWidth="2" fill="none"/>
              <path d="M 16 30 Q 8 24 8 16" stroke="#D4AF37" strokeWidth="2" fill="none"/>
              <circle cx="24" cy="16" r="2" fill="#D4AF37"/>
              <circle cx="8" cy="16" r="2" fill="#D4AF37"/>
            </svg>
          </div>
          <span className="logo-text">{APP_NAME}</span>
        </Link>

        <nav className="header-nav">
          <Link to={ROUTES.HOME} className="nav-link">Features</Link>
          <Link to={ROUTES.HOME} className="nav-link">How it Works</Link>
          <Link to={ROUTES.HOME} className="nav-link">Pricing</Link>
        </nav>

        <div className="header-actions">
          {authenticated ? (
            <>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="btn-secondary">
                Log In
              </Link>
              <Link to={ROUTES.REGISTER} className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

