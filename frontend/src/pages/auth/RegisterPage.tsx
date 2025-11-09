import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, registerCoach } from '../../services/auth';
import { ROUTES, COLORS, GENDER_OPTIONS, COMMON_SPORTS } from '../../utils/constants';
import { Logo } from '../../components/common';
import { RegisterUserData, RegisterCoachData } from '../../types';
import './AuthPage.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'user' | 'coach'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User form data
  const [userFormData, setUserFormData] = useState<RegisterUserData>({
    userName: '',
    passWord: '',
    profile: {
      fullName: '',
      email: '',
      phoneNumber: '',
      bio: '',
    },
    bodyWeight: undefined,
    height: undefined,
    gender: '',
    sports: [],
    age: undefined,
  });

  // Coach form data
  const [coachFormData, setCoachFormData] = useState<RegisterCoachData>({
    userName: '',
    passWord: '',
    sports: [],
    profile: {
      fullName: '',
      email: '',
      phoneNumber: '',
      bio: '',
      specialization: '',
    },
  });

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setUserFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
    } else {
      setUserFormData(prev => ({
        ...prev,
        [name]: name === 'age' || name === 'bodyWeight' || name === 'height' 
          ? (value ? Number(value) : undefined)
          : value,
      }));
    }
  };

  const handleUserSportToggle = (sport: string) => {
    setUserFormData(prev => {
      const currentSports = prev.sports || [];
      const newSports = currentSports.includes(sport)
        ? currentSports.filter(s => s !== sport)
        : [...currentSports, sport];
      return { ...prev, sports: newSports };
    });
  };

  const handleCoachChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setCoachFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
    } else {
      setCoachFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCoachSportToggle = (sport: string) => {
    setCoachFormData(prev => {
      const currentSports = prev.sports || [];
      const newSports = currentSports.includes(sport)
        ? currentSports.filter(s => s !== sport)
        : [...currentSports, sport];
      return { ...prev, sports: newSports };
    });
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clean up undefined values
      const cleanedData: RegisterUserData = {
        userName: userFormData.userName,
        passWord: userFormData.passWord,
        ...(userFormData.profile?.fullName && { profile: userFormData.profile }),
        ...(userFormData.bodyWeight && { bodyWeight: userFormData.bodyWeight }),
        ...(userFormData.height && { height: userFormData.height }),
        ...(userFormData.gender && { gender: userFormData.gender }),
        ...(userFormData.sports && userFormData.sports.length > 0 && { sports: userFormData.sports }),
        ...(userFormData.age && { age: userFormData.age }),
      };

      const response = await registerUser(cleanedData);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('userType', 'user');
      
      // Redirect to user dashboard
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clean up undefined values
      const cleanedData: RegisterCoachData = {
        userName: coachFormData.userName,
        passWord: coachFormData.passWord,
        ...(coachFormData.sports && coachFormData.sports.length > 0 && { sports: coachFormData.sports }),
        ...(coachFormData.profile && Object.keys(coachFormData.profile).length > 0 && {
          profile: coachFormData.profile,
        }),
      };

      const response = await registerCoach(cleanedData);
      
      // Store coach data
      localStorage.setItem('coach', JSON.stringify(response.coach));
      localStorage.setItem('userType', 'coach');
      
      // Redirect to coach dashboard
      navigate(ROUTES.COACH_DASHBOARD);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
              Register
            </button>
            <button
              className={`auth-tab ${activeTab === 'coach' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('coach');
                setError('');
              }}
            >
              Coach Register
            </button>
          </div>

          <div className="auth-content">
            <h2 className="auth-title">Create Your Account</h2>
            <p className="auth-subtitle">
              {activeTab === 'user' 
                ? 'Start your fitness journey with Persis.'
                : 'Join as a coach and help athletes reach their goals.'}
            </p>

            {error && (
              <div className="error-message" style={{ color: COLORS.error }}>
                {error}
              </div>
            )}

            {activeTab === 'user' ? (
              <form onSubmit={handleUserSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="userName">Username *</label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={userFormData.userName}
                    onChange={handleUserChange}
                    placeholder="Choose a username"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="passWord">Password *</label>
                  <input
                    type="password"
                    id="passWord"
                    name="passWord"
                    value={userFormData.passWord}
                    onChange={handleUserChange}
                    placeholder="Create a password (min 6 characters)"
                    required
                    minLength={6}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="profile.fullName">Full Name</label>
                    <input
                      type="text"
                      id="profile.fullName"
                      name="profile.fullName"
                      value={userFormData.profile?.fullName || ''}
                      onChange={handleUserChange}
                      placeholder="Your full name"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="profile.email">Email</label>
                    <input
                      type="email"
                      id="profile.email"
                      name="profile.email"
                      value={userFormData.profile?.email || ''}
                      onChange={handleUserChange}
                      placeholder="your@email.com"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="age">Age</label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={userFormData.age || ''}
                      onChange={handleUserChange}
                      placeholder="Age"
                      min="0"
                      max="150"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={userFormData.gender || ''}
                      onChange={handleUserChange}
                      className="form-input"
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bodyWeight">Weight (lbs)</label>
                    <input
                      type="number"
                      id="bodyWeight"
                      name="bodyWeight"
                      value={userFormData.bodyWeight || ''}
                      onChange={handleUserChange}
                      placeholder="Weight"
                      min="0"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="height">Height (inches)</label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      value={userFormData.height || ''}
                      onChange={handleUserChange}
                      placeholder="Height"
                      min="0"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profile.bio">Bio</label>
                  <textarea
                    id="profile.bio"
                    name="profile.bio"
                    value={userFormData.profile?.bio || ''}
                    onChange={handleUserChange}
                    placeholder="Tell us about your fitness goals..."
                    rows={3}
                    maxLength={500}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Sports (Select all that apply)</label>
                  <div className="sports-selection">
                    {COMMON_SPORTS.slice(0, 8).map(sport => (
                      <label key={sport} className="sport-checkbox">
                        <input
                          type="checkbox"
                          checked={userFormData.sports?.includes(sport) || false}
                          onChange={() => handleUserSportToggle(sport)}
                        />
                        <span>{sport}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                  style={{ backgroundColor: COLORS.info }}
                >
                  {loading ? 'Creating account...' : 'Register'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCoachSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="coachUserName">Username *</label>
                  <input
                    type="text"
                    id="coachUserName"
                    name="userName"
                    value={coachFormData.userName}
                    onChange={handleCoachChange}
                    placeholder="Choose a username"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="coachPassWord">Password *</label>
                  <input
                    type="password"
                    id="coachPassWord"
                    name="passWord"
                    value={coachFormData.passWord}
                    onChange={handleCoachChange}
                    placeholder="Create a password (min 6 characters)"
                    required
                    minLength={6}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="coachProfile.fullName">Full Name</label>
                    <input
                      type="text"
                      id="coachProfile.fullName"
                      name="profile.fullName"
                      value={coachFormData.profile?.fullName || ''}
                      onChange={handleCoachChange}
                      placeholder="Your full name"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="coachProfile.email">Email</label>
                    <input
                      type="email"
                      id="coachProfile.email"
                      name="profile.email"
                      value={coachFormData.profile?.email || ''}
                      onChange={handleCoachChange}
                      placeholder="your@email.com"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="coachProfile.specialization">Specialization</label>
                  <input
                    type="text"
                    id="coachProfile.specialization"
                    name="profile.specialization"
                    value={coachFormData.profile?.specialization || ''}
                    onChange={handleCoachChange}
                    placeholder="e.g., Strength & Conditioning"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="coachProfile.bio">Bio</label>
                  <textarea
                    id="coachProfile.bio"
                    name="profile.bio"
                    value={coachFormData.profile?.bio || ''}
                    onChange={handleCoachChange}
                    placeholder="Tell us about your coaching experience..."
                    rows={3}
                    maxLength={500}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Sports Specialization (Select all that apply)</label>
                  <div className="sports-selection">
                    {COMMON_SPORTS.slice(0, 8).map(sport => (
                      <label key={sport} className="sport-checkbox">
                        <input
                          type="checkbox"
                          checked={coachFormData.sports?.includes(sport) || false}
                          onChange={() => handleCoachSportToggle(sport)}
                        />
                        <span>{sport}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                  style={{ backgroundColor: COLORS.info }}
                >
                  {loading ? 'Creating account...' : 'Register as Coach'}
                </button>
              </form>
            )}

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="auth-link">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

