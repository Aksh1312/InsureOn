import React, { useContext } from 'react';
import { CloudRain, Shield, AlertTriangle, Zap, HelpCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';

const Policy = () => {
  const { user } = useContext(AuthContext);
  const { activePolicy, profile, premiumBreakdown, loading, error } = useDashboardData();

  if (loading) return <div className="dash-page active">Loading...</div>;

  const coverage = activePolicy?.weekly_coverage ?? profile?.weekly_coverage ?? 2800;
  const premium = activePolicy?.weekly_premium ?? profile?.weekly_premium ?? 120;
  const planNo = activePolicy?.id || user?.id || '9841';
  const pincode = profile?.pincode || user?.pincode || '400001';
  const zone = profile?.zone || premiumBreakdown?.zone || 'A';
  const tier = profile?.tier || premiumBreakdown?.tier || 'TIER_1';
  const basePremium = premiumBreakdown?.base_premium ?? premiumBreakdown?.weekly_premium ?? premium;
  const appliedLoadings = premiumBreakdown?.applied_loadings || [];
  const appliedDiscounts = premiumBreakdown?.applied_discounts || [];
  const labelMap = {
    coastal_pincode: 'Coastal/flood-prone area',
    short_waiting: 'Shorter waiting period',
    no_claim_6_months: 'No claims in 6 months',
    multi_platform: 'Multi-platform worker',
    annual_upfront: 'Annual payment upfront',
    safe_worker: 'Safe Worker reward',
    low_risk_score: 'Low risk score',
  };
  const formatAdjustments = (items) =>
    items.length ? items.map((item) => labelMap[item] || item).join(', ') : 'None';

  return (
    <div className="dash-page active">
      {error && (
        <div className="alert-bar orange" style={{marginBottom:'16px'}}>
          <div className="ab-icon"><AlertTriangle color="#FB8C00" size={24} /></div>
          <div className="ab-text">
            <div className="ab-title">Policy data partial</div>
            <div className="ab-sub">{error}</div>
          </div>
        </div>
      )}

      <div className="page-title">My Plan</div>
      <div className="page-sub">Everything about your cover in one place</div>

      <div className="policy-hero">
        <div className="ph-label">Active Weekly Cover</div>
        <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.3rem',fontWeight:800,marginBottom:'8px'}}>You Are Protected</div>
        <div className="ph-amount">₹{Number(coverage).toLocaleString('en-IN')}</div>
        <div className="ph-sub">Most you can get per bad week</div>
      </div>

      <div className="premium-bar" style={{marginBottom:'24px'}}>
        <div className="pb-left">
          <div className="pb-label">Next payment due Monday</div>
          <div className="pb-amt">₹{Number(premium).toLocaleString('en-IN')} / week</div>
          <div className="pb-sub">Auto-pay ON &bull; {user?.email || 'user@upi'}</div>
        </div>
        <button className="pb-btn">Pay Now</button>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-title">Plan Details</div>
        <div className="info-row"><div className="ir-label">Plan number</div><div className="ir-val">#IO-2026-{planNo}</div></div>
        <div className="info-row"><div className="ir-label">Name</div><div className="ir-val">{user?.email?.split('@')[0] || 'User'}</div></div>
        <div className="info-row"><div className="ir-label">Pincode</div><div className="ir-val">{pincode}</div></div>
        <div className="info-row"><div className="ir-label">Risk Zone</div><div className="ir-val"><span className="tag tag-red">Zone {zone} - {zone === 'A' ? 'High' : zone === 'B' ? 'Moderate' : 'Low'} Risk</span></div></div>
        <div className="info-row"><div className="ir-label">Tier</div><div className="ir-val"><span className="tag tag-orange">{tier}</span></div></div>
        <div className="info-row"><div className="ir-label">Plan status</div><div className="ir-val"><span className="tag tag-green">{activePolicy?.is_active ? 'Active' : 'Inactive'}</span></div></div>
        <div className="info-row"><div className="ir-label">Email</div><div className="ir-val">{user?.email || 'user@example.com'}</div></div>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-title">Premium Breakdown</div>
        <div className="info-row"><div className="ir-label">Base premium</div><div className="ir-val">₹{Number(basePremium).toLocaleString('en-IN')}</div></div>
        <div className="info-row"><div className="ir-label">Final premium</div><div className="ir-val">₹{Number(premium).toLocaleString('en-IN')}</div></div>
        <div className="info-row"><div className="ir-label">Applied loadings</div><div className="ir-val">{formatAdjustments(appliedLoadings)}</div></div>
        <div className="info-row"><div className="ir-label">Applied discounts</div><div className="ir-val">{formatAdjustments(appliedDiscounts)}</div></div>
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
