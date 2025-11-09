import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
    window.location.reload(); // Force refresh to update UI
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    
    if (location.pathname === '/') {
      // If we're on the landing page, scroll to the section
      const scrollToSection = () => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerHeight = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      };
      
      // Small delay to ensure DOM is ready
      setTimeout(scrollToSection, 50);
    } else {
      // If we're on a different page, navigate to landing page with hash
      navigate(`/#${sectionId}`);
    }
  };

  return (
    <header className="public-header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <img src="/logo.png" alt="Persis Logo" className="logo-image" />
          <span className="logo-text">Persis</span>
        </Link>
        <nav className="header-nav-center">
          <a 
            href="#features" 
            className="nav-link"
            onClick={(e) => handleNavClick(e, 'features')}
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="nav-link"
            onClick={(e) => handleNavClick(e, 'how-it-works')}
          >
            How it Works
          </a>
        </nav>
        <div className="header-nav-right">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="nav-link-login">Log In</Link>
              <button onClick={handleGetStarted} className="header-cta-button">
                Get Started
              </button>
            </>
          ) : (
            <>
              <button onClick={handleLogout} className="nav-link-login">
                Logout
              </button>
              <button onClick={handleGetStarted} className="header-cta-button">
                Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

