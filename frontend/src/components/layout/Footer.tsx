import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE, ROUTES, COLORS } from '../../utils/constants';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ backgroundColor: COLORS.secondary, borderTop: `2px solid ${COLORS.accent}` }}>
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          </div>
          <p className="footer-tagline">{APP_TAGLINE}</p>
          <p className="footer-description">
            Transform your fitness journey with AI-powered coaching, real-time form correction, and personalized guidance.
          </p>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Product</h3>
          <ul className="footer-links">
            <li><Link to={ROUTES.HOME}>Features</Link></li>
            <li><Link to={ROUTES.HOME}>How it Works</Link></li>
            <li><Link to={ROUTES.HOME}>Pricing</Link></li>
            <li><Link to={ROUTES.HOME}>About</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Resources</h3>
          <ul className="footer-links">
            <li><Link to={ROUTES.HOME}>Documentation</Link></li>
            <li><Link to={ROUTES.HOME}>Support</Link></li>
            <li><Link to={ROUTES.HOME}>Blog</Link></li>
            <li><Link to={ROUTES.HOME}>Community</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Legal</h3>
          <ul className="footer-links">
            <li><Link to={ROUTES.HOME}>Privacy Policy</Link></li>
            <li><Link to={ROUTES.HOME}>Terms of Service</Link></li>
            <li><Link to={ROUTES.HOME}>Cookie Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 {APP_NAME}. All rights reserved. Inspired by Greek mythology.</p>
      </div>
    </footer>
  );
};

export default Footer;

