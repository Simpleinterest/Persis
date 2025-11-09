import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AICoachChat from './pages/user/AICoachChat';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/ai-coach" replace />} />
          <Route path="/ai-coach" element={<AICoachChat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
