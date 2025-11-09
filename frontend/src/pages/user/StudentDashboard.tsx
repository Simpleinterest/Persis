import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import userService from '../../services/userService';
import RadarChartComponent from '../../components/dashboard/RadarChart';
import CalendarHeatmap from '../../components/dashboard/CalendarHeatmap';
import SessionReviewComponent from '../../components/dashboard/SessionReview';
import CommonMistakesChart from '../../components/dashboard/CommonMistakesChart';
import './StudentDashboard.css';

interface ProgressData {
  date: Date;
  formScore: number;
  exerciseType: string;
  analysisType: string;
  duration: number;
  sportMetrics?: any[];
  timestampedFeedback?: any[];
  sessionId?: string;
}

interface ProgressStats {
  avgFormScore: number;
  totalSessions: number;
  totalDuration: number;
  improvementTrend: number;
  exerciseCounts: { [key: string]: number };
}

interface CommonMistake {
  mistake: string;
  count: number;
}

interface SessionReview {
  sessionId: string;
  feedback: Array<{
    timestamp: Date;
    feedback: string;
    category: 'form' | 'safety' | 'technique' | 'encouragement';
    severity: 'low' | 'medium' | 'high';
  }>;
  date: Date;
}

interface SportMetric {
  name: string;
  value: number;
  unit?: string;
  target?: number;
}

interface Coach {
  _id: string;
  userName: string;
  profile?: {
    fullName?: string;
    avatar?: string;
  };
  sports?: string[];
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | '2years'>('month');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bodyWeight: '',
    height: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [commonMistakes, setCommonMistakes] = useState<CommonMistake[]>([]);
  const [sessionReviews, setSessionReviews] = useState<SessionReview[]>([]);
  const [aggregatedSportMetrics, setAggregatedSportMetrics] = useState<SportMetric[]>([]);
  const [calendarData, setCalendarData] = useState<Array<{ date: Date; duration: number; sessions: number }>>([]);

  useEffect(() => {
    loadUserProfile();
    loadProgressData();
    loadCoaches();
  }, [selectedPeriod, selectedSport]);

  const loadUserProfile = async () => {
    try {
      const userData = await userService.getUserProfile();
      setUser(userData);
      setProfileForm({
        bodyWeight: userData.bodyWeight?.toString() || '',
        height: userData.height?.toString() || '',
      });
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProgress(selectedPeriod, selectedSport !== 'all' ? selectedSport : undefined);
      setProgressData(data.progressData.map((d: any) => ({
        ...d,
        date: new Date(d.date),
        timestampedFeedback: d.timestampedFeedback ? d.timestampedFeedback.map((f: any) => ({
          ...f,
          timestamp: new Date(f.timestamp),
        })) : [],
      })));
      setStats(data.statistics);
      setCommonMistakes(data.commonMistakes || []);
      setSessionReviews((data.sessionReviews || []).map((sr: any) => ({
        ...sr,
        date: new Date(sr.date),
        feedback: sr.feedback.map((f: any) => ({
          ...f,
          timestamp: new Date(f.timestamp),
        })),
      })));
      
      // Aggregate sport metrics for radar chart
      if (selectedSport !== 'all') {
        const sportData = data.progressData.filter((d: any) => d.exerciseType === selectedSport);
        const metricsMap = new Map<string, { values: number[]; target?: number; unit?: string }>();
        
        sportData.forEach((d: any) => {
          if (d.sportMetrics && Array.isArray(d.sportMetrics)) {
            d.sportMetrics.forEach((m: any) => {
              if (metricsMap.has(m.name)) {
                const existing = metricsMap.get(m.name)!;
                existing.values.push(m.value);
                if (m.target && !existing.target) existing.target = m.target;
                if (m.unit && !existing.unit) existing.unit = m.unit;
              } else {
                metricsMap.set(m.name, {
                  values: [m.value],
                  target: m.target,
                  unit: m.unit,
                });
              }
            });
          }
        });
        
        const aggregated: SportMetric[] = Array.from(metricsMap.entries()).map(([name, data]) => ({
          name,
          value: data.values.reduce((sum, v) => sum + v, 0) / data.values.length, // Average
          target: data.target,
          unit: data.unit,
        }));
        
        setAggregatedSportMetrics(aggregated);
      } else {
        setAggregatedSportMetrics([]);
      }
      
      // Prepare calendar heatmap data
      const calendarMap = new Map<string, { duration: number; sessions: number }>();
      data.progressData.forEach((d: any) => {
        const dateKey = new Date(d.date).toISOString().split('T')[0];
        const existing = calendarMap.get(dateKey);
        if (existing) {
          existing.duration += d.duration || 0;
          existing.sessions += 1;
        } else {
          calendarMap.set(dateKey, {
            duration: d.duration || 0,
            sessions: 1,
          });
        }
      });
      
      const calendarDataArray = Array.from(calendarMap.entries()).map(([dateKey, data]) => ({
        date: new Date(dateKey),
        duration: data.duration,
        sessions: data.sessions,
      }));
      
      setCalendarData(calendarDataArray);
    } catch (error: any) {
      console.error('Failed to load progress data:', error);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const loadCoaches = async () => {
    try {
      const coachesData = await userService.getUserCoaches();
      setCoaches(coachesData);
    } catch (error: any) {
      console.error('Failed to load coaches:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await userService.updateUserProfile({
        bodyWeight: profileForm.bodyWeight ? parseFloat(profileForm.bodyWeight) : undefined,
        height: profileForm.height ? parseFloat(profileForm.height) : undefined,
      });
      setSuccess('Profile updated successfully!');
      setShowProfileModal(false);
      loadUserProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update profile');
    }
  };


  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Calculate chart data
  const getChartData = () => {
    if (progressData.length === 0) return { labels: [], scores: [] };
    
    // Group by date and calculate average scores
    const dateMap: { [key: string]: { scores: number[]; count: number } } = {};
    progressData.forEach(d => {
      const dateKey = formatDate(d.date);
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { scores: [], count: 0 };
      }
      dateMap[dateKey].scores.push(d.formScore);
      dateMap[dateKey].count++;
    });

    const labels = Object.keys(dateMap).sort();
    const scores = labels.map(key => {
      const data = dateMap[key];
      return Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length);
    });

    return { labels, scores };
  };

  const chartData = getChartData();
  const maxScore = chartData.scores.length > 0 ? Math.max(...chartData.scores, 100) : 100;
  const minScore = chartData.scores.length > 0 ? Math.min(...chartData.scores, 0) : 0;
  const scoreRange = maxScore - minScore || 1; // Avoid division by zero

  return (
    <div className="student-dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">My Dashboard</h1>
            <p className="dashboard-subtitle">Track your fitness progress and achievements</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowProfileModal(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Update Profile
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Time Period Filters */}
        <div className="period-filters">
          <button
            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            Week
          </button>
          <button
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            Month
          </button>
          <button
            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('year')}
          >
            Year
          </button>
          <button
            className={`period-btn ${selectedPeriod === '2years' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('2years')}
          >
            2+ Years
          </button>
        </div>

        {/* Sport Selector */}
        <div className="sport-selector-section">
          <label htmlFor="sport-select" className="sport-select-label">Filter by Sport:</label>
          <select
            id="sport-select"
            className="sport-select"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            <option value="all">All Sports</option>
            {stats && stats.exerciseCounts && Object.keys(stats.exerciseCounts).map((sport) => (
              <option key={sport} value={sport}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.avgFormScore}</h3>
                <p className="stat-label">Average Form Score</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalSessions}</h3>
                <p className="stat-label">Total Sessions</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{formatDuration(stats.totalDuration)}</h3>
                <p className="stat-label">Total Training Time</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {stats.improvementTrend >= 0 ? (
                    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </div>
              <div className="stat-content">
                <h3 className={`stat-value ${stats.improvementTrend >= 0 ? 'positive' : 'negative'}`}>
                  {stats.improvementTrend >= 0 ? '+' : ''}{stats.improvementTrend}
                </h3>
                <p className="stat-label">Improvement Trend</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Chart */}
        <div className="progress-chart-section">
          <h2 className="section-title">Form Score Progress</h2>
          {loading ? (
            <div className="loading-state">Loading progress data...</div>
          ) : chartData.labels.length === 0 ? (
            <div className="empty-state">
              <p>No progress data available for this period.</p>
              <p>Start training with the AI coach to see your progress!</p>
            </div>
          ) : (
            <div className="chart-container">
              <div className="chart-y-axis">
                <span>{maxScore}</span>
                <span>{Math.round((maxScore + minScore) / 2)}</span>
                <span>{minScore}</span>
              </div>
              <div className="chart-area">
                <svg 
                  className="progress-chart" 
                  viewBox={`0 0 ${Math.max(chartData.labels.length * 50, 400)} 200`} 
                  preserveAspectRatio="xMidYMid meet"
                  style={{ width: '100%', minHeight: '300px' }}
                >
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F0E68C" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#F0E68C" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  {chartData.scores.length > 0 && (
                    <>
                      <polyline
                        points={chartData.scores.map((score, i) => {
                          const x = i * 50 + 25;
                          const y = 200 - ((score - minScore) / scoreRange) * 180 - 10;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#F0E68C"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {chartData.scores.length > 1 && (
                        <polygon
                          points={`25,190 ${chartData.scores.map((score, i) => {
                            const x = i * 50 + 25;
                            const y = 200 - ((score - minScore) / scoreRange) * 180 - 10;
                            return `${x},${y}`;
                          }).join(' ')} ${chartData.scores.length * 50 - 25},190`}
                          fill="url(#scoreGradient)"
                        />
                      )}
                    </>
                  )}
                </svg>
                <div className="chart-x-axis">
                  {chartData.labels.map((label, i) => (
                    <span key={i} className="chart-label">{label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sport-Specific Metrics (Radar Chart) */}
        {selectedSport !== 'all' && aggregatedSportMetrics.length > 0 && (
          <RadarChartComponent data={aggregatedSportMetrics} sport={selectedSport} />
        )}

        {/* Calendar Heatmap */}
        {calendarData.length > 0 && (
          <CalendarHeatmap data={calendarData} />
        )}

        {/* Common Mistakes Chart */}
        {commonMistakes.length > 0 && (
          <CommonMistakesChart data={commonMistakes} />
        )}

        {/* Session Reviews */}
        {sessionReviews.length > 0 && (
          <SessionReviewComponent sessions={sessionReviews} />
        )}

        {/* Exercise Breakdown */}
        {stats && stats.exerciseCounts && Object.keys(stats.exerciseCounts).length > 0 && (
          <div className="exercise-breakdown">
            <h2 className="section-title">Exercise Breakdown</h2>
            <div className="exercise-list">
              {Object.entries(stats.exerciseCounts).map(([exercise, count]) => (
                <div key={exercise} className="exercise-item">
                  <div className="exercise-name">{exercise}</div>
                  <div className="exercise-bar">
                    <div 
                      className="exercise-bar-fill"
                      style={{ width: `${(count / stats.totalSessions) * 100}%` }}
                    ></div>
                  </div>
                  <div className="exercise-count">{count} sessions</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaches Section */}
        <div className="coaches-section">
          <div className="section-header">
            <h2 className="section-title">My Coaches</h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/coach-requests')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                Coach Requests
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setShowCoachModal(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Info
              </button>
            </div>
          </div>
          {coaches.length === 0 ? (
            <div className="empty-state">
              <p>You don't have any coaches yet.</p>
              <p>Add a coach to get personalized guidance!</p>
            </div>
          ) : (
            <div className="coaches-list">
              {coaches.map((coach) => (
                <div key={coach._id} className="coach-card">
                  <div className="coach-avatar">
                    {coach.profile?.avatar ? (
                      <img src={coach.profile.avatar} alt={coach.userName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {coach.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="coach-info">
                    <h3 className="coach-name">{coach.profile?.fullName || coach.userName}</h3>
                    <p className="coach-username">@{coach.userName}</p>
                    {coach.sports && coach.sports.length > 0 && (
                      <div className="coach-sports">
                        {coach.sports.map((sport, i) => (
                          <span key={i} className="sport-tag">{sport}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Profile</h2>
              <button 
                className="modal-close"
                onClick={() => setShowProfileModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="bodyWeight">Body Weight (lbs)</label>
                  <input
                    type="number"
                    id="bodyWeight"
                    value={profileForm.bodyWeight}
                    onChange={(e) => setProfileForm({ ...profileForm, bodyWeight: e.target.value })}
                    placeholder="Enter your weight"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="height">Height (inches)</label>
                  <input
                    type="number"
                    id="height"
                    value={profileForm.height}
                    onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                    placeholder="Enter your height"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Coach Modal */}
      {showCoachModal && (
        <div className="modal-overlay" onClick={() => setShowCoachModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Coach</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCoachModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                To add a coach, coaches need to send you a request first. You can:
              </p>
              <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.8' }}>
                <li>Wait for a coach to send you a request</li>
                <li>Accept requests on the <strong>Coach Requests</strong> page</li>
                <li>Contact coaches directly and ask them to send you a request</li>
              </ul>
              <div style={{ padding: '1rem', backgroundColor: 'rgba(240, 230, 140, 0.1)', borderRadius: '8px', border: '1px solid rgba(240, 230, 140, 0.2)' }}>
                <p style={{ margin: 0, color: '#F0E68C', fontSize: '0.9rem' }}>
                  <strong>Tip:</strong> Coaches can find you by your username and send you a request.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setShowCoachModal(false);
                  setError('');
                }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={() => {
                  setShowCoachModal(false);
                  navigate('/coach-requests');
                }}
              >
                Go to Coach Requests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

