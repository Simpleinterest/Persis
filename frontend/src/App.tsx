import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AICoachChat from './pages/user/AICoachChat';
import StudentDashboard from './pages/user/StudentDashboard';
import CoachRequests from './pages/user/CoachRequests';
import StudentSettings from './pages/user/StudentSettings';
import CoachDashboard from './pages/coach/CoachDashboard';
import StudentDetail from './pages/coach/StudentDetail';
import CoachSettings from './pages/coach/CoachSettings';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireUser>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-coach" 
            element={
              <ProtectedRoute requireUser>
                <AICoachChat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach-requests" 
            element={
              <ProtectedRoute requireUser>
                <CoachRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute requireUser>
                <StudentSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/dashboard" 
            element={
              <ProtectedRoute requireCoach>
                <CoachDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/students/:studentId" 
            element={
              <ProtectedRoute requireCoach>
                <StudentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/settings" 
            element={
              <ProtectedRoute requireCoach>
                <CoachSettings />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;