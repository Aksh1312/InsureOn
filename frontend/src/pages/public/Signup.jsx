import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const { signup, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    pincode: '',
    income: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        pincode: formData.pincode,
        income: parseFloat(formData.income),
        platform: 'zomato',
        region: 'Mumbai',
        upi_id: `${formData.email.split('@')[0]}@upi`
      });
      // After successful signup, log the user in immediately
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError('Signup failed. Ensure all details are correct.');
    }
  };

  return (
    <div id="pub-signup" style={{display:'block'}}>
      <div className="auth-wrap">
        <form className="auth-box fade-up" onSubmit={handleSignup} style={{maxWidth:'500px'}}>
          <div className="auth-logo">Insure<span>On</span></div>
          <div className="auth-sub">Create your account to get protected.</div>
          
          {error && <div style={{color:'var(--red2)',marginBottom:'15px',fontSize:'.85rem'}}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className="form-input" 
              name="full_name"
              type="text" 
              placeholder="E.g. Rahul Sharma" 
              value={formData.full_name}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              name="email"
              type="email" 
              placeholder="Enter your email" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className="form-input" 
              name="password"
              type="password" 
              placeholder="Create a strong password" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="grid-2">
            <div className="form-group">
                <label className="form-label">Pincode</label>
                <input 
                className="form-input" 
                name="pincode"
                type="text" 
                placeholder="E.g. 400001" 
                value={formData.pincode}
                onChange={handleChange}
                required 
                />
            </div>
            <div className="form-group">
                <label className="form-label">Weekly Income (₹)</label>
                <input 
                className="form-input" 
                name="income"
                type="number" 
                placeholder="E.g. 3000" 
                value={formData.income}
                onChange={handleChange}
                required 
                />
            </div>
          </div>
          <button type="submit" className="form-btn">Create Account &rarr;</button>
          <div className="auth-switch">Already have an account? <Link to="/login">Login</Link></div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
