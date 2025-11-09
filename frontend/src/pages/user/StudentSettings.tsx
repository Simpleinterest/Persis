import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import userService from '../../services/userService';
import authService from '../../services/authService';
import { User } from '../../types/auth.types';
import './StudentSettings.css';

const StudentSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    userName: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    bodyWeight: '',
    height: '',
    gender: 'Prefer not to say',
    sports: [] as string[],
    age: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [newSport, setNewSport] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUserProfile();
      setUser(userData);
      setFormData({
        userName: userData.userName || '',
        fullName: userData.profile?.fullName || '',
        email: userData.profile?.email || '',
        phoneNumber: userData.profile?.phoneNumber || '',
        bio: userData.profile?.bio || '',
        bodyWeight: userData.bodyWeight?.toString() || '',
        height: userData.height?.toString() || '',
        gender: userData.gender || 'Prefer not to say',
        sports: userData.sports || [],
        age: userData.age?.toString() || '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setError('Failed to load profile. Please try again.');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');
  };

  const handleAddSport = () => {
    if (newSport.trim() && !formData.sports.includes(newSport.trim())) {
      setFormData(prev => ({
        ...prev,
        sports: [...prev.sports, newSport.trim()],
      }));
      setNewSport('');
    }
  };

  const handleRemoveSport = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.filter(s => s !== sport),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validate password change if new password is provided
      if (formData.newPassword || formData.confirmPassword) {
        if (!formData.newPassword) {
          setError('Please enter a new password');
          setSaving(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError('New password must be at least 6 characters long');
          setSaving(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match');
          setSaving(false);
          return;
        }
      }

      // Prepare update data
      const updateData: any = {
        userName: formData.userName,
        profile: {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          bio: formData.bio,
        },
        bodyWeight: formData.bodyWeight ? parseFloat(formData.bodyWeight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        gender: formData.gender,
        sports: formData.sports,
        age: formData.age ? parseInt(formData.age) : undefined,
      };

      // Add password if provided
      if (formData.newPassword) {
        updateData.passWord = formData.newPassword;
      }

      await userService.updateUserProfile(updateData);

      // Update local storage with new user data
      const updatedUser = await userService.getUserProfile();
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));

      // Reload profile to get latest data
      await loadUserProfile();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <Sidebar />
        <div className="settings-content">
          <div className="settings-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <Sidebar />
      <div className="settings-content">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        {error && <div className="settings-error">{error}</div>}
        {success && <div className="settings-success">{success}</div>}

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Profile Information Section */}
          <div className="settings-section">
            <h2>Profile Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="userName">Username</label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                />
                <span className="char-count">{formData.bio.length}/500</span>
              </div>
            </div>
          </div>

          {/* Physical Information Section */}
          <div className="settings-section">
            <h2>Physical Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="bodyWeight">Body Weight (kg)</label>
                <input
                  type="number"
                  id="bodyWeight"
                  name="bodyWeight"
                  value={formData.bodyWeight}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="height">Height (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="0"
                  max="150"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sports Section */}
          <div className="settings-section">
            <h2>Sports & Interests</h2>
            <div className="form-group">
              <label htmlFor="newSport">Add Sport</label>
              <div className="sport-input-group">
                <input
                  type="text"
                  id="newSport"
                  value={newSport}
                  onChange={(e) => setNewSport(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSport();
                    }
                  }}
                  placeholder="Enter a sport or activity"
                />
                <button type="button" onClick={handleAddSport} className="add-sport-btn">
                  Add
                </button>
              </div>
            </div>
            {formData.sports.length > 0 && (
              <div className="sports-list">
                {formData.sports.map((sport, index) => (
                  <span key={index} className="sport-tag">
                    {sport}
                    <button
                      type="button"
                      onClick={() => handleRemoveSport(sport)}
                      className="remove-sport-btn"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="settings-section">
            <h2>Change Password</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <p className="password-info">To change your password, enter a new password below. Note: The current password verification is not required for security reasons, but please ensure you are the account owner.</p>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password (min 6 characters)"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="settings-actions">
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSettings;

