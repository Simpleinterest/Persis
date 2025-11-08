import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, COLORS, APP_NAME, APP_TAGLINE } from '../utils/constants';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Train Smarter with <span className="highlight">AI-Powered</span> Coaching
          </h1>
          <p className="hero-description">
            Transform your fitness journey with real-time form correction, comprehensive progress tracking, 
            and personalized coaching powered by cutting-edge AI technology.
          </p>
          <div className="hero-actions">
            <Link to={ROUTES.REGISTER} className="btn-hero-primary">
              Start Free Trial
            </Link>
            <Link to={ROUTES.HOME} className="btn-hero-secondary">
              Watch Demo
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-placeholder">
            <svg width="100%" height="100%" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Placeholder for workout image - Greek warrior/fitness inspired */}
              <rect width="400" height="500" fill="#2C2C2C" rx="12"/>
              <circle cx="200" cy="150" r="60" fill="#D4AF37" opacity="0.3"/>
              <rect x="170" y="200" width="60" height="200" fill="#F5F5DC" opacity="0.2" rx="30"/>
              <circle cx="140" cy="220" r="20" fill="#D4AF37" opacity="0.4"/>
              <circle cx="260" cy="220" r="20" fill="#D4AF37" opacity="0.4"/>
              <text x="200" y="380" textAnchor="middle" fill="#F5F5DC" fontSize="18" fontFamily="Georgia">
                Workout Image
              </text>
            </svg>
          </div>
          <button className="preview-btn">Preview</button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Why Choose {APP_NAME}?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI-Powered Coaching</h3>
              <p className="feature-description">
                Get instant feedback and personalized guidance from our advanced AI coach. 
                Analyze your form in real-time and receive corrections as you work out.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Progress Tracking</h3>
              <p className="feature-description">
                Track your weight plate benchmarks, body weight, and fitness goals over time. 
                Visualize your progress with comprehensive graphs and analytics.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Human Coaches</h3>
              <p className="feature-description">
                Connect with professional coaches who can customize your AI training plan. 
                Get personalized advice and support from experienced fitness experts.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Form Correction</h3>
              <p className="feature-description">
                Improve your technique with real-time form analysis. Our AI detects form issues 
                and provides instant corrections to help you lift safely and effectively.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📹</div>
              <h3 className="feature-title">Video Analysis</h3>
              <p className="feature-description">
                Upload videos of your workouts for detailed analysis. Get comprehensive feedback 
                on your form, technique, and areas for improvement.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Live Mode</h3>
              <p className="feature-description">
                Stream your workouts live and receive real-time form corrections. Our AI watches 
                you work out and provides instant feedback to optimize your training.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3 className="step-title">Sign Up</h3>
              <p className="step-description">
                Create your account as a user or coach. Set up your profile with your fitness goals, 
                stats, and preferences.
              </p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3 className="step-title">Connect</h3>
              <p className="step-description">
                Users can connect with coaches, and coaches can manage their students. 
                Coaches can set custom AI parameters for personalized training.
              </p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3 className="step-title">Train</h3>
              <p className="step-description">
                Start your workout with AI coaching. Get real-time form corrections, 
                track your progress, and chat with your AI or human coach.
              </p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3 className="step-title">Improve</h3>
              <p className="step-description">
                Review your progress, analyze your form, and continuously improve. 
                Our AI and coaches help you reach your fitness goals faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2 className="cta-title">Ready to Transform Your Fitness Journey?</h2>
          <p className="cta-description">
            Join {APP_NAME} today and experience the future of fitness coaching.
          </p>
          <Link to={ROUTES.REGISTER} className="btn-cta">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

