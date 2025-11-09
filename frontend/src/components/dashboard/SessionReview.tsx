import React, { useState } from 'react';
import { format } from 'date-fns';
import './SessionReview.css';

interface TimestampedFeedback {
  timestamp: Date;
  feedback: string;
  category: 'form' | 'safety' | 'technique' | 'encouragement';
  severity: 'low' | 'medium' | 'high';
}

interface SessionReview {
  sessionId: string;
  feedback: TimestampedFeedback[];
  date: Date;
}

interface SessionReviewProps {
  sessions: SessionReview[];
  selectedSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
}

const SessionReviewComponent: React.FC<SessionReviewProps> = ({ 
  sessions, 
  selectedSessionId,
  onSessionSelect 
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
    if (onSessionSelect) {
      onSessionSelect(sessionId);
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'safety':
        return '#ef4444';
      case 'form':
        return '#F0E68C';
      case 'technique':
        return '#3b82f6';
      case 'encouragement':
        return '#10b981';
      default:
        return 'rgba(255, 255, 255, 0.7)';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="session-review-container">
        <div className="session-review-empty">
          <p>No session reviews available</p>
          <p className="empty-hint">Complete live training sessions to see detailed feedback!</p>
        </div>
      </div>
    );
  }

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="session-review-container">
      <div className="session-review-header">
        <h3>Session Reviews</h3>
        <span className="session-count">{sessions.length} session(s)</span>
      </div>
      <div className="sessions-list">
        {sortedSessions.map((session) => {
          const isExpanded = expandedSessions.has(session.sessionId);
          const feedbackCount = session.feedback.length;
          
          return (
            <div key={session.sessionId} className="session-card">
              <div 
                className="session-header"
                onClick={() => toggleSession(session.sessionId)}
              >
                <div className="session-info">
                  <div className="session-date">
                    {format(new Date(session.date), 'MMM d, yyyy • h:mm a')}
                  </div>
                  <div className="session-stats">
                    <span className="feedback-count">{feedbackCount} feedback{feedbackCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="session-actions">
                  <button className="expand-button">
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="session-feedback">
                  {session.feedback.length === 0 ? (
                    <div className="no-feedback">No feedback available for this session</div>
                  ) : (
                    session.feedback.map((item, index) => (
                      <div key={index} className="feedback-item">
                        <div className="feedback-header">
                          <span className="feedback-time">
                            {format(new Date(item.timestamp), 'HH:mm:ss')}
                          </span>
                          <span 
                            className="feedback-category"
                            style={{ color: getCategoryColor(item.category) }}
                          >
                            {item.category}
                          </span>
                          <span className="feedback-severity">
                            {getSeverityIcon(item.severity)}
                          </span>
                        </div>
                        <div className="feedback-text">{item.feedback}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionReviewComponent;

