import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div id="pub-login" className="active">
      <div className="auth-wrap">
        <form className="auth-box fade-up" onSubmit={handleLogin}>
          <div className="auth-logo">Insure<span>On</span></div>
          <div className="auth-sub">Welcome back. Login to see your cover & payouts.</div>
          
          {error && <div style={{color:'var(--red2)',marginBottom:'15px',fontSize:'.85rem'}}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              type="email" 
              placeholder="Enter your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className="form-input" 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="form-btn">Login &rarr;</button>
          <div className="auth-switch">Don't have an account? <Link to="/signup">Sign up free</Link></div>
        </form>
      </div>
    </div>
  );
};

export default Login;
