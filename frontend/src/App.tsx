import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header, Footer } from './components/layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CVAnalyzer from './components/CVAnalyzer';
import { ROUTES } from './utils/constants';
import { isAuthenticated } from './services/auth';
=======
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AICoachChat from './pages/user/AICoachChat';
>>>>>>> 98682c67e80ca06b9af63f4494785bd5f204cfe2
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
<<<<<<< HEAD
        <AppLayout>
          <Routes>
            <Route path={ROUTES.HOME} element={<LandingPage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path="/cv-analyzer" element={<CVAnalyzer />} />
            {/* Protected routes will be added in subsequent steps */}
          </Routes>
        </AppLayout>
=======
        <Routes>
          <Route path="/" element={<Navigate to="/ai-coach" replace />} />
          <Route path="/ai-coach" element={<AICoachChat />} />
        </Routes>
>>>>>>> 98682c67e80ca06b9af63f4494785bd5f204cfe2
      </div>
    </Router>
  );
}

export default App;
