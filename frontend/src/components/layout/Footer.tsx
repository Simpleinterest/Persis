import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="public-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <Link to="/" className="footer-logo">
              <img src="/logo.svg" alt="Persis Logo" className="footer-logo-image" />
              <span className="footer-logo-text">Persis</span>
            </Link>
            <p className="footer-description">
              AI-powered fitness coaching platform that helps you achieve your fitness goals with personalized guidance and real-time form analysis.
            </p>
          </div>
          <div className="footer-section">
            <h3 className="footer-heading">Product</h3>
            <ul className="footer-links">
              <li><Link to="/#features">Features</Link></li>
              <li><Link to="/#how-it-works">How It Works</Link></li>
              <li><Link to="/register">Get Started</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3 className="footer-heading">Account</h3>
            <ul className="footer-links">
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3 className="footer-heading">About</h3>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Persis. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

