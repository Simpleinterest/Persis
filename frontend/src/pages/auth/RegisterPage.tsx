import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { RegisterUserRequest, RegisterCoachRequest } from '../../types/auth.types';
import Navbar from '../../components/layout/Navbar';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
  const [isUserRegister, setIsUserRegister] = useState(true);
  const [userName, setUserName] = useState('');
  const [passWord, setPassWord] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (passWord !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passWord.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      if (isUserRegister) {
        const userData: RegisterUserRequest = {
          userName,
          passWord,
          profile: {
            fullName: fullName || undefined,
            email: email || undefined,
          },
        };
        await authService.registerUser(userData);
        navigate('/ai-coach');
      } else {
        const coachData: RegisterCoachRequest = {
          userName,
          passWord,
          profile: {
            fullName: fullName || undefined,
            email: email || undefined,
          },
        };
        await authService.registerCoach(coachData);
        navigate('/coach/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Navbar />
      <div className="register-container">
        <div>
          <div className="register-header">
          <h1>Join Persis</h1>
          <p className="tagline">Start your fitness journey today.</p>
        </div>

        <div className="register-tabs">
          <button
            className={`tab ${isUserRegister ? 'active' : ''}`}
            onClick={() => {
              setIsUserRegister(true);
              setError('');
            }}
          >
            User Registration
          </button>
          <button
            className={`tab ${!isUserRegister ? 'active' : ''}`}
            onClick={() => {
              setIsUserRegister(false);
              setError('');
            }}
          >
            Coach Registration
          </button>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="userName">Username *</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Choose a username"
              required
              minLength={3}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name (optional)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com (optional)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="passWord">Password *</label>
            <input
              id="passWord"
              type="password"
              value={passWord}
              onChange={(e) => setPassWord(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Registering...' : isUserRegister ? 'Register as User' : 'Register as Coach'}
          </button>
        </form>

        <div className="login-link">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/login')}
            >
              Login here
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

