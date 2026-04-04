import React, { useContext } from 'react';
import { CloudRain, Shield, AlertTriangle, Zap, HelpCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Policy = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="dash-page active">
      <div className="page-title">My Plan</div>
      <div className="page-sub">Everything about your cover in one place</div>

      <div className="policy-hero">
        <div className="ph-label">Active Weekly Cover</div>
        <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.3rem',fontWeight:800,marginBottom:'8px'}}>You Are Protected</div>
        <div className="ph-amount">₹2,800</div>
        <div className="ph-sub">Most you can get per bad week</div>
      </div>

      <div className="premium-bar" style={{marginBottom:'24px'}}>
        <div className="pb-left">
          <div className="pb-label">Next payment due Monday</div>
          <div className="pb-amt">₹120 / week</div>
          <div className="pb-sub">Auto-pay ON &bull; user@upi</div>
        </div>
        <button className="pb-btn">Pay Now</button>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-title">Plan Details</div>
        <div className="info-row"><div className="ir-label">Plan number</div><div className="ir-val">#IO-2026-{user?.id || '9841'}</div></div>
        <div className="info-row"><div className="ir-label">Name</div><div className="ir-val">{user?.full_name || 'User'}</div></div>
        <div className="info-row"><div className="ir-label">Pincode</div><div className="ir-val">{user?.pincode || '400001'}</div></div>
        <div className="info-row"><div className="ir-label">Risk Zone</div><div className="ir-val"><span className="tag tag-red">Zone A - High Risk</span></div></div>
        <div className="info-row"><div className="ir-label">Tier</div><div className="ir-val"><span className="tag tag-orange">Tier 1 - Part-time</span></div></div>
        <div className="info-row"><div className="ir-label">Plan status</div><div className="ir-val"><span className="tag tag-green">Active</span></div></div>
        <div className="info-row"><div className="ir-label">Email</div><div className="ir-val">{user?.email || 'user@example.com'}</div></div>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-title">What is covered</div>
        <div className="info-row">
          <div className="ir-label" style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <CloudRain size={16} color="var(--blue2)" style={{flexShrink:0}} /> Heavy rain &amp; Floods
          </div>
          <div className="ir-val"><span className="tag tag-green">Covered</span></div>
        </div>
        <div className="info-row">
          <div className="ir-label" style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <Zap size={16} color="var(--blue2)" style={{flexShrink:0}} /> Storms &amp; Cyclones
          </div>
          <div className="ir-val"><span className="tag tag-green">Covered</span></div>
        </div>
        <div className="info-row">
          <div className="ir-label" style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <Shield size={16} color="var(--navy)" style={{flexShrink:0}} /> Lockdowns &amp; Curfews
          </div>
          <div className="ir-val"><span className="tag tag-green">Covered</span></div>
        </div>
        <div className="info-row">
          <div className="ir-label" style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <AlertTriangle size={16} color="var(--yellow)" style={{flexShrink:0}} /> Earthquakes &amp; Disasters
          </div>
          <div className="ir-val"><span className="tag tag-green">Covered</span></div>
        </div>
        <div className="info-row">
          <div className="ir-label" style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <HelpCircle size={16} color="var(--muted)" style={{flexShrink:0}} /> App shutdowns
          </div>
          <div className="ir-val"><span className="tag tag-blue">Optional add-on</span></div>
        </div>
      </div>
    </div>
  );
};

export default Policy;
