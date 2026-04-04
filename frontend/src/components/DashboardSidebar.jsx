import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, TrendingUp, Shield, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const DashboardSidebar = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      <nav id="dash-nav">
        <div className="dash-logo">Insure<span>On</span></div>
        <div className="dash-user">
          <div className="dash-avatar">{user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}</div>
          <div className="dash-name">{user?.full_name || 'User'}</div>
          <div className="dash-logout" onClick={logout}>Sign out</div>
        </div>
      </nav>

      <div id="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">Main</div>
          <Link to="/dashboard" className={`sidebar-item ${isActive('/dashboard')}`} style={{textDecoration:'none'}}>
            <div className="si-icon"><Home size={18} /></div>
            Overview
          </Link>
          <Link to="/dashboard/claims" className={`sidebar-item ${isActive('/dashboard/claims')}`} style={{textDecoration:'none'}}>
            <div className="si-icon"><ClipboardList size={18} /></div>
            Claims Tracker
          </Link>
          <Link to="/dashboard/earnings" className={`sidebar-item ${isActive('/dashboard/earnings')}`} style={{textDecoration:'none'}}>
            <div className="si-icon"><TrendingUp size={18} /></div>
            Earnings Shield
          </Link>
        </div>
        
        <div className="sidebar-section">
          <div className="sidebar-label">Account</div>
          <Link to="/dashboard/policy" className={`sidebar-item ${isActive('/dashboard/policy')}`} style={{textDecoration:'none'}}>
            <div className="si-icon"><Shield size={18} /></div>
            My Policy
          </Link>
          <Link to="/dashboard/profile" className={`sidebar-item ${isActive('/dashboard/profile')}`} style={{textDecoration:'none'}}>
            <div className="si-icon"><User size={18} /></div>
            Profile & Settings
          </Link>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
