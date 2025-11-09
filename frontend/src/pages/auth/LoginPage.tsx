import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, loginCoach } from '../../services/auth';
import { ROUTES, COLORS } from '../../utils/constants';
import { Logo } from '../../components/common';
import './AuthPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'user' | 'coach'>('user');
  const [formData, setFormData] = useState({
    userName: '',
    passWord: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'user') {
        const response = await loginUser({
          userName: formData.userName,
          passWord: formData.passWord,
        });
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('userType', 'user');
        
        // Redirect to user dashboard
        navigate(ROUTES.DASHBOARD);
      } else {
        const response = await loginCoach({
          userName: formData.userName,
          passWord: formData.passWord,
        });
        
        // Store coach data
        localStorage.setItem('coach', JSON.stringify(response.coach));
        localStorage.setItem('userType', 'coach');
        
        // Redirect to coach dashboard
        navigate(ROUTES.COACH_DASHBOARD);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to={ROUTES.HOME} className="back-link">
          ← Back to Home
        </Link>
        
        <div className="auth-logo">
          <Logo size={48} showText={true} />
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'user' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('user');
                setError('');
              }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${activeTab === 'coach' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('coach');
                setError('');
              }}
            >
              Coach Login
            </button>
          </div>

          <div className="auth-content">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">
              {activeTab === 'user' 
                ? 'Login to continue your fitness journey.'
                : 'Login to access your coach dashboard.'}
            </p>

            {error && (
              <div className="error-message" style={{ color: COLORS.error }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="userName">Username</label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="passWord">Password</label>
                <input
                  type="password"
                  id="passWord"
                  name="passWord"
                  value={formData.passWord}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span>Remember me</span>
                </label>
                <Link to={ROUTES.HOME} className="forgot-password">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
                style={{ backgroundColor: COLORS.info }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to={ROUTES.REGISTER} className="auth-link">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

