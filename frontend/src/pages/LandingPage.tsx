import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import authService from '../services/authService';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  // Handle hash navigation on page load
  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.substring(1);
      setTimeout(() => {
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
      }, 100);
    }
  }, [location.hash]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/ai-coach');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="landing-page">
      <Header />
      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                <span className="hero-title-main">Train Smarter with</span>
                <span className="hero-title-accent">AI-Powered</span>
                <span className="hero-title-end">Coaching</span>
              </h1>
              <p className="hero-description">
                Transform your fitness journey with real-time form correction, comprehensive progress tracking, 
                and personalized coaching powered by cutting-edge AI technology.
              </p>
              <div className="hero-actions">
                <button onClick={handleGetStarted} className="hero-cta-primary">
                  Start Free Trial
                </button>
                <button className="hero-cta-secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7z" fill="currentColor"/>
                  </svg>
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-placeholder">
                {/* Placeholder for hero image */}
              </div>
              <button className="preview-button">Preview</button>
            </div>
          </div>
        </section>

        <section id="features" className="features-section">
          <div className="section-container">
            <h2 className="section-title">Why Choose Persis?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="9" cy="9" r="2" fill="currentColor"/>
                    <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="feature-title">AI Coach</h3>
                <p className="feature-description">
                  Get instant feedback and personalized coaching from our AI-powered fitness coach. 
                  Ask questions, get workout plans, and receive real-time guidance.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <h3 className="feature-title">Live Form Analysis</h3>
                <p className="feature-description">
                  Real-time computer vision analyzes your exercise form during live workouts. 
                  Get instant corrections to prevent injuries and maximize effectiveness.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                <h3 className="feature-title">Human Coaches</h3>
                <p className="feature-description">
                  Connect with certified human coaches who can set custom parameters for your AI coach 
                  and provide expert guidance tailored to your needs.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 7l-5-5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 21l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="feature-title">Progress Tracking</h3>
                <p className="feature-description">
                  Track your physical progress over time with detailed analytics and insights. 
                  Monitor your improvements and stay motivated on your fitness journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-it-works-section">
          <div className="section-container">
            <h2 className="section-title">How It Works</h2>
            <div className="steps-container">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3 className="step-title">Sign Up</h3>
                  <p className="step-description">
                    Create your account as a user or coach. It's free and takes less than a minute.
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3 className="step-title">Connect with AI Coach</h3>
                  <p className="step-description">
                    Start chatting with your AI fitness coach. Ask questions, get workout plans, 
                    and receive personalized guidance.
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3 className="step-title">Start Live Training</h3>
                  <p className="step-description">
                    Activate live mode to get real-time form analysis. The AI coach watches your 
                    movements and provides instant feedback.
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3 className="step-title">Track Progress</h3>
                  <p className="step-description">
                    Monitor your improvements over time. Connect with human coaches for additional 
                    support and customized training parameters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section className="cta-section">
          <div className="section-container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Transform Your Fitness Journey?</h2>
              <p className="cta-description">
                Join thousands of users who are already achieving their fitness goals with Persis.
              </p>
              <button onClick={handleGetStarted} className="cta-button">
                Start Free Trial
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
