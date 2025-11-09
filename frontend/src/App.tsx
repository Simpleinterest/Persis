import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header, Footer } from './components/layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { ROUTES } from './utils/constants';
import { isAuthenticated } from './services/auth';
import './App.css';

// Protected route component (will be used in future steps)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

// Component to conditionally render header and footer
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER;

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <AppLayout>
          <Routes>
            <Route path={ROUTES.HOME} element={<LandingPage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            {/* Protected routes will be added in subsequent steps */}
          </Routes>
        </AppLayout>
      </div>
    </Router>
  );
}

export default App;

