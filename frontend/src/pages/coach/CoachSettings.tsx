import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import coachService from '../../services/coachService';
import authService from '../../services/authService';
import { Coach } from '../../types/auth.types';
import './CoachSettings.css';

const CoachSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [coach, setCoach] = useState<Coach | null>(null);
  const [formData, setFormData] = useState({
    userName: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    specialization: '',
    sports: [] as string[],
    newPassword: '',
    confirmPassword: '',
  });

  const [newSport, setNewSport] = useState('');

  useEffect(() => {
    loadCoachProfile();
  }, []);

  const loadCoachProfile = async () => {
    try {
      setLoading(true);
      const coachData = await coachService.getCoachProfile();
      setCoach(coachData);
      setFormData({
        userName: coachData.userName || '',
        fullName: coachData.profile?.fullName || '',
        email: coachData.profile?.email || '',
        phoneNumber: coachData.profile?.phoneNumber || '',
        bio: coachData.profile?.bio || '',
        specialization: coachData.profile?.specialization || '',
        sports: coachData.sports || [],
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          specialization: formData.specialization,
        },
        sports: formData.sports,
      };

      // Add password if provided
      if (formData.newPassword) {
        updateData.passWord = formData.newPassword;
      }

      await coachService.updateCoachProfile(updateData);

      // Update local storage with new coach data
      const updatedCoach = await coachService.getCoachProfile();
      localStorage.setItem('user', JSON.stringify(updatedCoach));

      setSuccess('Profile updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));

      // Reload profile to get latest data
      await loadCoachProfile();
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
                <label htmlFor="specialization">Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g., Strength Training, Yoga, Cardio"
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
                  placeholder="Tell us about your coaching experience and expertise..."
                />
                <span className="char-count">{formData.bio.length}/500</span>
              </div>
            </div>
          </div>

          {/* Sports Section */}
          <div className="settings-section">
            <h2>Sports & Specialties</h2>
            <div className="form-group">
              <label htmlFor="newSport">Add Sport/Specialty</label>
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
                  placeholder="Enter a sport or specialty"
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

export default CoachSettings;

