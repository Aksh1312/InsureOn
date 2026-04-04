import React from 'react';
import { Link } from 'react-router-dom';

const PublicNavbar = () => {
  return (
    <nav id="public-nav">
      <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
        Insure<span>On</span>
      </Link>
      <div className="pub-nav-links">
        <Link to="/">Home</Link>
        <Link to="/how-it-works">How It Works</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/smartwork">SmartWork</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup" className="nav-cta">Sign Up Free</Link>
      </div>
    </nav>
  );
};

export default PublicNavbar;
