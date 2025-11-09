import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import coachService, { Student } from '../../services/coachService';
import './CoachDashboard.css';

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await coachService.getStudents();
      setStudents(data);
    } catch (error: any) {
      console.error('Failed to load students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await coachService.requestStudentByUsername(username, message);
      setSuccess('Request sent successfully!');
      setShowAddStudentModal(false);
      setUsername('');
      setMessage('');
      setTimeout(() => loadStudents(), 1000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send request');
    }
  };

  const handleStudentClick = (studentId: string) => {
    navigate(`/coach/students/${studentId}`);
  };

  const totalStudents = students.length;
  const activeStudents = students.length;

  return (
    <div className="coach-dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="header-actions">
            <select className="time-filter">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button 
              className="add-student-btn"
              onClick={() => setShowAddStudentModal(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add Student
            </button>
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-header">
              <h3 className="card-title">Total Students</h3>
              <div className="card-trend positive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>+12%</span>
              </div>
            </div>
            <div className="card-value">{totalStudents}</div>
          </div>

          <div className="summary-card">
            <div className="card-header">
              <h3 className="card-title">Active Students</h3>
              <div className="card-trend negative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>-5%</span>
              </div>
            </div>
            <div className="card-value">{activeStudents}</div>
          </div>

          <div className="summary-card large">
            <div className="card-header">
              <h3 className="card-title">Performance Overview</h3>
            </div>
            <div className="performance-chart">
              <div className="chart-placeholder">
                <p>Performance trends will be displayed here</p>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-header">
              <h3 className="card-title">Average Improvement</h3>
              <div className="card-trend positive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>+8%</span>
              </div>
            </div>
            <div className="card-value">35.52%</div>
          </div>
        </div>

        <div className="students-section">
          <div className="section-header">
            <h2 className="section-title">My Students</h2>
            <button className="view-all-btn">View All</button>
          </div>

          {loading ? (
            <div className="loading-state">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <p>No students yet. Add your first student to get started!</p>
            </div>
          ) : (
            <div className="students-table">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Join Date</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr 
                      key={student._id}
                      className="student-row"
                      onClick={() => handleStudentClick(student._id)}
                    >
                      <td>
                        <div className="student-info">
                          <div className="student-avatar">
                            {student.profile?.avatar ? (
                              <img src={student.profile.avatar} alt={student.userName} />
                            ) : (
                              <div className="avatar-placeholder">
                                {student.userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="student-name">
                              {student.profile?.fullName || student.userName}
                            </div>
                            <div className="student-username">@{student.userName}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {student.createdAt 
                          ? new Date(student.createdAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '75%' }}></div>
                        </div>
                        <span className="progress-text">75%</span>
                      </td>
                      <td>
                        <span className="status-badge active">Active</span>
                      </td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStudentClick(student._id);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Student</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddStudentModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddStudent}>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter student username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message (Optional)</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional message for the student"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAddStudentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard;
