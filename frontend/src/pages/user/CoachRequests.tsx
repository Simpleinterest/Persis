import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import userService, { CoachRequest } from '../../services/userService';
import './CoachRequests.css';

const CoachRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CoachRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await userService.getCoachRequests();
      setRequests(data);
    } catch (error: any) {
      console.error('Failed to load coach requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await userService.acceptCoachRequest(requestId);
      await loadRequests();
    } catch (error: any) {
      console.error('Failed to accept request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await userService.rejectCoachRequest(requestId);
      await loadRequests();
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  return (
    <div className="coach-requests-page">
      <Sidebar />
      <div className="requests-main">
        <div className="requests-header">
          <h1 className="requests-title">Coach Requests</h1>
          <p className="requests-subtitle">Manage requests from coaches to become your trainer</p>
        </div>

        {loading ? (
          <div className="loading-state">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <p>No pending coach requests</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-info">
                  <div className="coach-avatar">
                    {typeof request.coachId === 'object' && request.coachId.profile?.avatar ? (
                      <img src={request.coachId.profile.avatar} alt={request.coachId.userName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {typeof request.coachId === 'object' ? request.coachId.userName.charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                  </div>
                  <div className="request-details">
                    <h3 className="coach-name">
                      {typeof request.coachId === 'object' 
                        ? (request.coachId.profile?.fullName || request.coachId.userName)
                        : 'Coach'
                      }
                    </h3>
                    <p className="coach-username">
                      @{typeof request.coachId === 'object' ? request.coachId.userName : 'coach'}
                    </p>
                    {request.message && (
                      <p className="request-message">{request.message}</p>
                    )}
                    <p className="request-date">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="request-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => handleAccept(request._id)}
                  >
                    Accept
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleReject(request._id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachRequests;

