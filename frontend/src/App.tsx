import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components/layout';
import LandingPage from './pages/LandingPage';
import { ROUTES } from './utils/constants';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path={ROUTES.HOME} element={<LandingPage />} />
            {/* Additional routes will be added in subsequent steps */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

