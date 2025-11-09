import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CVAnalyzer from './components/CVAnalyzer';
import AICoachChat from './pages/user/AICoachChat';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* --- This is the 'main' branch's app flow --- */}
          {/* It redirects the root path "/" to the login page */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* It protects the /ai-coach route so only logged-in users can see it */}
          <Route 
            path="/ai-coach" 
            element={
              <ProtectedRoute requireUser>
                <AICoachChat />
              </ProtectedRoute>
            } 
          />
          
          {/* CV Analyzer route */}
          <Route path="/cv-analyzer" element={<CVAnalyzer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
