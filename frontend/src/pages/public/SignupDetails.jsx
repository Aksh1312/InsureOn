import React, { useContext, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';

const SignupDetails = () => {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const baseData = useMemo(() => location.state?.basicData || null, [location.state]);
  const [formData, setFormData] = useState({
    platform: 'zomato',
    region: 'Mumbai',
    custom_region: '',
    avg_weekly_hours: 22,
    primary_shift: 'afternoon',
    is_multi_platform: false,
    upi_id: '',
  });
  const [options, setOptions] = useState({
    platforms: ['zomato', 'swiggy', 'dunzo', 'blinkit', 'other'],
    shifts: ['morning', 'afternoon', 'night'],
    zone_cities: {
      A: ['chennai', 'mumbai', 'kolkata'],
      B: ['bengaluru', 'hyderabad', 'ahmedabad'],
      C: ['delhi', 'pune', 'jaipur'],
    },
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await api.get('/onboarding/options');
        if (!mounted) return;
        setOptions(response.data);
      } catch (err) {
        // Keep UI usable with fallback defaults.
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const cityOptions = useMemo(() => {
    const entries = Object.entries(options.zone_cities || {});
    const items = [];
    entries.forEach(([zone, cities]) => {
      (cities || []).forEach((city) => {
        items.push({
          value: city,
          label: `${city.charAt(0).toUpperCase()}${city.slice(1)} (Zone ${zone})`,
        });
      });
    });
    items.push({ value: 'Other', label: 'Other city' });
    return items;
  }, [options.zone_cities]);

  if (!baseData) {
    return (
      <div id="pub-signup" style={{ display: 'block' }}>
        <div className="auth-wrap">
          <div className="auth-box fade-up" style={{ maxWidth: '500px' }}>
            <div className="auth-logo">Insure<span>On</span></div>
            <div className="auth-sub">Please complete step 1 before this page.</div>
            <Link to="/signup" className="form-btn" style={{ textAlign: 'center', marginTop: '12px', display: 'block' }}>
              Go to Signup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.region === 'Other' && !formData.custom_region.trim()) {
      setError('Please enter your city when selecting Other.');
      return;
    }

    try {
      await signup({
        ...baseData,
        platform: formData.platform,
        region: formData.region === 'Other' ? formData.custom_region.trim() : formData.region,
        avg_weekly_hours: Number(formData.avg_weekly_hours),
        primary_shift: formData.primary_shift,
        is_multi_platform: Boolean(formData.is_multi_platform),
        upi_id: formData.upi_id || `${baseData.email.split('@')[0]}@upi`,
      });
      navigate('/dashboard');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).filter(Boolean).join(' '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Signup failed. Check your details and try again.');
      }
    }
  };

  return (
    <div id="pub-signup" style={{ display: 'block' }}>
      <div className="auth-wrap">
        <form className="auth-box fade-up" onSubmit={handleSubmit} style={{ maxWidth: '560px' }}>
          <div className="auth-logo">Insure<span>On</span></div>
          <div className="auth-sub">Step 2 of 2: policy and risk details.</div>

          {error && <div style={{ color: 'var(--red2)', marginBottom: '15px', fontSize: '.85rem' }}>{error}</div>}

          {loadingOptions && <div style={{ color: 'var(--muted)', marginBottom: '10px', fontSize: '.82rem' }}>Loading policy options...</div>}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Delivery Platform</label>
              <select className="form-input" name="platform" value={formData.platform} onChange={handleChange} required>
                {(options.platforms || []).map((platform) => (
                  <option key={platform} value={platform}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">City / Region</label>
              <select className="form-input" name="region" value={formData.region} onChange={handleChange} required>
                {cityOptions.map((city) => (
                  <option key={city.value} value={city.value}>{city.label}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.region === 'Other' && (
            <div className="form-group">
              <label className="form-label">Custom City / Region</label>
              <input
                className="form-input"
                name="custom_region"
                type="text"
                placeholder="Enter your city"
                value={formData.custom_region}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Average Weekly Hours</label>
              <input
                className="form-input"
                name="avg_weekly_hours"
                type="number"
                min="1"
                placeholder="E.g. 32"
                value={formData.avg_weekly_hours}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Primary Shift</label>
              <select className="form-input" name="primary_shift" value={formData.primary_shift} onChange={handleChange} required>
                {(options.shifts || []).map((shift) => (
                  <option key={shift} value={shift}>{shift.charAt(0).toUpperCase() + shift.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">UPI ID (optional)</label>
            <input
              className="form-input"
              name="upi_id"
              type="text"
              placeholder="E.g. name@upi"
              value={formData.upi_id}
              onChange={handleChange}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              id="is_multi_platform"
              name="is_multi_platform"
              type="checkbox"
              checked={formData.is_multi_platform}
              onChange={handleChange}
            />
            <label htmlFor="is_multi_platform" className="form-label" style={{ margin: 0 }}>I work on multiple platforms</label>
          </div>

          <button type="submit" className="form-btn">Finish Signup &rarr;</button>
          <div className="auth-switch"><Link to="/signup">Back to step 1</Link></div>
        </form>
      </div>
    </div>
  );
};

export default SignupDetails;