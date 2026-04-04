import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Public
import Home from './pages/public/Home';
import HowItWorks from './pages/public/HowItWorks';
import Pricing from './pages/public/Pricing';
import SmartWork from './pages/public/SmartWork';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';

// Dashboard
import DashboardSidebar from './components/DashboardSidebar';
import Overview from './pages/dashboard/Overview';
import Claims from './pages/dashboard/Claims';
import Earnings from './pages/dashboard/Earnings';
import Policy from './pages/dashboard/Policy';
import Profile from './pages/dashboard/Profile';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  
  if (loading) {
     return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'var(--bg)'}}>Loading...</div>;
  }
  
  if (!token) return <Navigate to="/login" replace />;
  
  return (
    <div id="dashboard-site">
      <DashboardSidebar />
      <div id="dash-body">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/smartwork" element={<SmartWork />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/dashboard" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
      <Route path="/dashboard/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
      <Route path="/dashboard/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
      <Route path="/dashboard/policy" element={<ProtectedRoute><Policy /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
