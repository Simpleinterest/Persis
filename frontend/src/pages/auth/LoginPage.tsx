import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [isUserLogin, setIsUserLogin] = useState(true);
  const [userName, setUserName] = useState('');
  const [passWord, setPassWord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isUserLogin) {
        await authService.loginUser({ userName, passWord });
        navigate('/ai-coach');
      } else {
        await authService.loginCoach({ userName, passWord });
        navigate('/coach/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div>
          <div className="login-header">
            <h1>Persis</h1>
            <p className="tagline">Every rep matters.</p>
          </div>

          <div className="login-tabs">
            <button
              className={`tab ${isUserLogin ? 'active' : ''}`}
              onClick={() => {
                setIsUserLogin(true);
                setError('');
              }}
            >
              User Login
            </button>
            <button
              className={`tab ${!isUserLogin ? 'active' : ''}`}
              onClick={() => {
                setIsUserLogin(false);
                setError('');
              }}
            >
              Coach Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="userName">Username</label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="passWord">Password</label>
              <input
                id="passWord"
                type="password"
                value={passWord}
                onChange={(e) => setPassWord(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Logging in...' : isUserLogin ? 'Login as User' : 'Login as Coach'}
            </button>
          </form>

          <div className="register-link">
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/register')}
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

