import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Imports from both branches, combined ---
import AICoachChat from './pages/user/AICoachChat';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';

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
          
          {/* --- This is your branch's 'LandingPage' --- */}
          {/* I've added it to the path "/landing" so it doesn't 
              conflict with the root redirect above. */}
          <Route path="/landing" element={<LandingPage />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;