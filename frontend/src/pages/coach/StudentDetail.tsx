import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import coachService, { Student } from '../../services/coachService';
import './StudentDetail.css';

interface PerformanceData {
  date: string;
  score: number;
  formScore: number;
  goalProgress: number;
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
}

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('weekly');
  const [videoAnalyses, setVideoAnalyses] = useState<any[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeTab, setActiveTab] = useState<'performance' | 'videos' | 'analyses' | 'ai-parameters'>('performance');
  const [aiParameters, setAiParameters] = useState<string>('');
  const [loadingParameters, setLoadingParameters] = useState(false);
  const [savingParameters, setSavingParameters] = useState(false);
  const [parametersSuccess, setParametersSuccess] = useState('');
  const [parametersError, setParametersError] = useState('');

  useEffect(() => {
    if (studentId) {
      loadStudentData();
      loadPerformanceData();
      loadGoals();
      loadVideoAnalyses();
      loadUploadedVideos();
      loadAIParameters();
    }
  }, [studentId, selectedTimeRange]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const response = await coachService.getStudent(studentId!);
      setStudent(response.student);
      if (response.performanceData) {
        setPerformanceData(response.performanceData);
      }
      if (response.goals) {
        setGoals(response.goals);
      }
    } catch (error: any) {
      console.error('Failed to load student:', error);
      // Fallback to mock data if API fails
      loadPerformanceData();
      loadGoals();
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = () => {
    // Mock performance data - fallback if API doesn't return data
    const mockData: PerformanceData[] = [
      { date: 'Mon', score: 85, formScore: 78, goalProgress: 65 },
      { date: 'Tue', score: 88, formScore: 82, goalProgress: 70 },
      { date: 'Wed', score: 82, formScore: 75, goalProgress: 68 },
      { date: 'Thu', score: 90, formScore: 85, goalProgress: 75 },
      { date: 'Fri', score: 87, formScore: 80, goalProgress: 72 },
      { date: 'Sat', score: 92, formScore: 88, goalProgress: 78 },
      { date: 'Sun', score: 89, formScore: 84, goalProgress: 76 },
    ];
    setPerformanceData(mockData);
  };

  const loadGoals = () => {
    // Mock goals data - fallback if API doesn't return data
    const mockGoals: Goal[] = [
      { id: '1', title: 'Squat Form Improvement', target: 100, current: 75, unit: '%' },
      { id: '2', title: 'Weight Loss', target: 20, current: 12, unit: 'lbs' },
      { id: '3', title: 'Strength Increase', target: 50, current: 35, unit: 'lbs' },
      { id: '4', title: 'Endurance', target: 30, current: 22, unit: 'min' },
    ];
    setGoals(mockGoals);
  };

  const loadVideoAnalyses = async () => {
    if (!studentId) return;
    try {
      setLoadingVideos(true);
      const analyses = await coachService.getStudentVideoAnalyses(studentId, 'live');
      setVideoAnalyses(analyses);
    } catch (error: any) {
      console.error('Failed to load video analyses:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadUploadedVideos = async () => {
    if (!studentId) return;
    try {
      setLoadingVideos(true);
      const videos = await coachService.getStudentVideos(studentId);
      setUploadedVideos(videos);
    } catch (error: any) {
      console.error('Failed to load uploaded videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadAIParameters = async () => {
    if (!studentId) return;
    try {
      setLoadingParameters(true);
      const parameters = await coachService.getStudentAIParameters(studentId);
      setAiParameters(parameters);
    } catch (error: any) {
      console.error('Failed to load AI parameters:', error);
      setParametersError('Failed to load AI parameters');
    } finally {
      setLoadingParameters(false);
    }
  };

  const handleSaveAIParameters = async () => {
    if (!studentId) return;
    try {
      setSavingParameters(true);
      setParametersError('');
      setParametersSuccess('');
      await coachService.updateStudentAIParameters(studentId, aiParameters);
      setParametersSuccess('AI parameters saved successfully!');
      setTimeout(() => setParametersSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to save AI parameters:', error);
      setParametersError(error.response?.data?.error || 'Failed to save AI parameters');
    } finally {
      setSavingParameters(false);
    }
  };

  if (loading) {
    return (
      <div className="student-detail">
        <Sidebar />
        <div className="detail-main">
          <div className="loading-state">Loading student data...</div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-detail">
        <Sidebar />
        <div className="detail-main">
          <div className="error-state">Student not found</div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const averageScore = performanceData.length > 0
    ? Math.round(performanceData.reduce((sum, d) => sum + d.score, 0) / performanceData.length)
    : 0;
  const averageFormScore = performanceData.length > 0
    ? Math.round(performanceData.reduce((sum, d) => sum + d.formScore, 0) / performanceData.length)
    : 0;
  const formImprovement = performanceData.length > 1
    ? ((performanceData[performanceData.length - 1].formScore - performanceData[0].formScore) / performanceData[0].formScore * 100).toFixed(1)
    : '0';
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.current / g.target * 100), 0) / goals.length)
    : 0;

  return (
    <div className="student-detail">
      <Sidebar />
      <div className="detail-main">
        <div className="detail-header">
          <button className="back-btn" onClick={() => navigate('/coach/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </button>
          <div className="header-right">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
                onClick={() => setActiveTab('performance')}
              >
                Performance
              </button>
              <button 
                className={`tab ${activeTab === 'analyses' ? 'active' : ''}`}
                onClick={() => setActiveTab('analyses')}
              >
                Live Analyses
              </button>
              <button 
                className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
                onClick={() => setActiveTab('videos')}
              >
                Videos
              </button>
              <button 
                className={`tab ${activeTab === 'ai-parameters' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai-parameters')}
              >
                AI Settings
              </button>
            </div>
            {activeTab === 'performance' && (
              <select 
                className="time-filter"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>
        </div>

        <div className="student-profile-header">
          <div className="profile-info">
            <div className="student-avatar-large">
              {student.profile?.avatar ? (
                <img src={student.profile.avatar} alt={student.userName} />
              ) : (
                <div className="avatar-placeholder-large">
                  {student.userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="student-name-large">
                {student.profile?.fullName || student.userName}
              </h1>
              <p className="student-username-large">@{student.userName}</p>
              {student.profile?.bio && (
                <p className="student-bio">{student.profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards - Only show in performance tab */}
        {activeTab === 'performance' && (
          <>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-header">
                  <h3 className="card-title">Average Performance</h3>
                  <div className="card-trend positive">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>+5%</span>
                  </div>
                </div>
                <div className="card-value">{averageScore}</div>
              </div>

              <div className="summary-card">
                <div className="card-header">
                  <h3 className="card-title">Form Score</h3>
                  <div className="card-trend positive">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>+{formImprovement}%</span>
                  </div>
                </div>
                <div className="card-value">{averageFormScore}</div>
              </div>

              <div className="summary-card large">
                <div className="card-header">
                  <h3 className="card-title">Performance Trends</h3>
                </div>
                <div className="performance-chart-container">
                  {performanceData.length > 0 ? (
                    <>
                      <div className="chart-labels">
                        <div className="chart-y-axis">
                          <span>100</span>
                          <span>75</span>
                          <span>50</span>
                          <span>25</span>
                          <span>0</span>
                        </div>
                        <div className="chart-area">
                          <svg className="performance-chart" viewBox="0 0 400 150" preserveAspectRatio="none">
                            <polyline
                              points={performanceData.map((d, i) => {
                                const x = (i * (360 / (performanceData.length - 1 || 1))) + 30;
                                const y = 150 - (d.score * 1.5);
                                return `${x},${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke="#F0E68C"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <polyline
                              points={performanceData.map((d, i) => {
                                const x = (i * (360 / (performanceData.length - 1 || 1))) + 30;
                                const y = 150 - (d.formScore * 1.5);
                                return `${x},${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke="#4ade80"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeDasharray="5,5"
                            />
                          </svg>
                          <div className="chart-x-axis">
                            {performanceData.map((d, i) => (
                              <span key={`${d.date}-${i}`}>{d.date}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="chart-legend">
                        <div className="legend-item">
                          <div className="legend-color" style={{ backgroundColor: '#F0E68C' }}></div>
                          <span>Performance Score</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color" style={{ backgroundColor: '#4ade80' }}></div>
                          <span>Form Score</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="chart-placeholder">
                      <p>No performance data available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-card">
                <div className="card-header">
                  <h3 className="card-title">Goal Progress</h3>
                  <div className="card-trend positive">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>+8%</span>
                  </div>
                </div>
                <div className="card-value">{overallProgress}%</div>
              </div>
            </div>

            {/* Form Improvement Section */}
            <div className="form-improvement-section">
              <h2 className="section-title">Form Improvement</h2>
              <div className="improvement-chart-container">
                <div className="improvement-bars">
                  {performanceData.map((data, index) => (
                    <div key={index} className="improvement-bar-item">
                      <div className="bar-label">{data.date}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill"
                          style={{ width: `${data.formScore}%` }}
                        ></div>
                        <span className="bar-value">{data.formScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Goals Section */}
        {activeTab === 'performance' && (
          <div className="goals-section">
            <div className="section-header">
              <h2 className="section-title">Goal Progress</h2>
            </div>
            <div className="goals-grid">
              {goals.map((goal) => {
                const progress = (goal.current / goal.target) * 100;
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <h3 className="goal-title">{goal.title}</h3>
                      <span className="goal-percentage">{Math.round(progress)}%</span>
                    </div>
                    <div className="goal-progress-bar">
                      <div 
                        className="goal-progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="goal-stats">
                      <span className="goal-current">{goal.current} {goal.unit}</span>
                      <span className="goal-target">of {goal.target} {goal.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Analyses Section */}
        {activeTab === 'analyses' && (
          <div className="video-analyses-section">
            <div className="section-header">
              <h2 className="section-title">Live Footage Analyses</h2>
              <p className="section-subtitle">AI summaries from student's live workout sessions</p>
            </div>
            {loadingVideos ? (
              <div className="loading-state">Loading analyses...</div>
            ) : videoAnalyses.length === 0 ? (
              <div className="empty-state">
                <p>No live footage analyses available yet.</p>
              </div>
            ) : (
              <div className="analyses-list">
                {videoAnalyses.map((analysis) => (
                  <div key={analysis._id} className="analysis-card">
                    <div className="analysis-header">
                      <div className="analysis-type-badge live">Live Session</div>
                      <div className="analysis-date">
                        {new Date(analysis.createdAt).toLocaleDateString()} {new Date(analysis.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="analysis-content">
                      <p className="analysis-summary">{analysis.summary || analysis.feedback}</p>
                      {analysis.metrics && (
                        <div className="analysis-metrics">
                          {analysis.metrics.score && (
                            <div className="metric-item">
                              <span className="metric-label">Score:</span>
                              <span className="metric-value">{analysis.metrics.score}/100</span>
                            </div>
                          )}
                          {analysis.metrics.exerciseType && (
                            <div className="metric-item">
                              <span className="metric-label">Exercise:</span>
                              <span className="metric-value">{analysis.metrics.exerciseType}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Uploaded Videos Section */}
        {activeTab === 'videos' && (
          <div className="uploaded-videos-section">
            <div className="section-header">
              <h2 className="section-title">Student Videos</h2>
              <p className="section-subtitle">Videos shared by the student for analysis</p>
            </div>
            {loadingVideos ? (
              <div className="loading-state">Loading videos...</div>
            ) : uploadedVideos.length === 0 ? (
              <div className="empty-state">
                <p>No videos shared by the student yet.</p>
              </div>
            ) : (
              <div className="videos-grid">
                {uploadedVideos.map((video) => (
                  <div key={video._id} className="video-card">
                    <div className="video-player">
                      {video.videoUrl ? (
                        <video 
                          src={video.videoUrl} 
                          controls
                          className="video-element"
                        />
                      ) : (
                        <div className="video-placeholder">No video available</div>
                      )}
                    </div>
                    <div className="video-info">
                      <div className="video-header">
                        <div className="video-type-badge uploaded">Uploaded</div>
                        <div className="video-date">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {video.summary && (
                        <p className="video-summary">{video.summary}</p>
                      )}
                      {video.feedback && (
                        <div className="video-feedback">
                          <h4>AI Analysis:</h4>
                          <p>{video.feedback}</p>
                        </div>
                      )}
                      {video.metrics && (
                        <div className="video-metrics">
                          {video.metrics.score && (
                            <div className="metric-item">
                              <span className="metric-label">Score:</span>
                              <span className="metric-value">{video.metrics.score}/100</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Parameters Section */}
        {activeTab === 'ai-parameters' && (
          <div className="ai-parameters-section">
            <div className="section-header">
              <h2 className="section-title">AI Coach Parameters</h2>
              <p className="section-subtitle">Customize how the AI coach interacts with this student</p>
            </div>
            
            {parametersError && (
              <div className="error-message">{parametersError}</div>
            )}
            {parametersSuccess && (
              <div className="success-message">{parametersSuccess}</div>
            )}

            {loadingParameters ? (
              <div className="loading-state">Loading AI parameters...</div>
            ) : (
              <div className="parameters-form">
                <div className="form-group">
                  <label htmlFor="ai-parameters" className="form-label">
                    Coach Instructions
                  </label>
                  <p className="form-description">
                    Enter specific instructions for the AI coach when interacting with this student. 
                    For example: "This student has a state game in 2 days, please give advice for them relating to the game as they train."
                  </p>
                  <textarea
                    id="ai-parameters"
                    className="parameters-textarea"
                    value={aiParameters}
                    onChange={(e) => setAiParameters(e.target.value)}
                    placeholder="Example: This student has a state game in 2 days, please give advice for them relating to the game as they train. Focus on maintaining form while increasing intensity gradually."
                    rows={10}
                  />
                  <div className="character-count">
                    {aiParameters.length} characters
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    className="btn-save"
                    onClick={handleSaveAIParameters}
                    disabled={savingParameters}
                  >
                    {savingParameters ? 'Saving...' : 'Save Parameters'}
                  </button>
                  <button
                    className="btn-clear"
                    onClick={() => {
                      setAiParameters('');
                      setParametersError('');
                      setParametersSuccess('');
                    }}
                    disabled={savingParameters || !aiParameters}
                  >
                    Clear
                  </button>
                </div>

                <div className="parameters-info">
                  <h3>How it works:</h3>
                  <ul>
                    <li>These instructions are added to the AI coach's system prompt for this student</li>
                    <li>The AI will consider these parameters when providing feedback during live sessions and chat conversations</li>
                    <li>You can update these parameters at any time to adapt to the student's changing needs</li>
                    <li>Examples: competition dates, injury recovery focus, specific technique improvements, training intensity preferences</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;

