import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Info } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const { profile, riskScore, loading, error } = useDashboardData();

  if (loading) return <div className="dash-page active">Loading...</div>;

  if (!user && !profile) return null;

  const displayName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const zoneLabel = profile?.zone ? `Zone ${profile.zone}` : 'Zone A';
  const tierLabel = profile?.tier ? `${profile.tier}` : 'Tier 1';
  const riskValue = riskScore?.total_score ?? 2.1;
  const riskCategory = riskScore?.risk_category ?? 'HIGH';
  const pincode = profile?.pincode || user?.pincode || '400001';
  const income = profile?.avg_weekly_income || user?.income || 0;

  return (
    <div className="dash-page active">
      <div className="page-title">My Profile</div>
      <div className="page-sub">Your details and account settings</div>

      {error && (
        <div className="alert-bar orange" style={{marginBottom:'16px'}}>
          <div className="ab-icon"><Info color="#FB8C00" size={24} /></div>
          <div className="ab-text">
            <div className="ab-title">Profile data partial</div>
            <div className="ab-sub">{error}</div>
          </div>
        </div>
      )}

      <div className="card" style={{textAlign:'center',marginBottom:'20px',padding:'36px'}}>
        <div className="profile-avatar" style={{margin:'0 auto'}}>{initials}</div>
        <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.4rem',fontWeight:800}}>{displayName}</div>
        <div style={{fontSize:'.88rem',color:'var(--muted)',marginTop:'4px'}}>Member since {new Date().getFullYear()}</div>
        <div style={{marginTop:'12px'}}><span className="tag tag-orange">{zoneLabel}</span> &nbsp; <span className="tag tag-green">{tierLabel}</span></div>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-title">Personal Details</div>
        <div className="info-row"><div className="ir-label">Full name</div><div className="ir-val">{displayName}</div></div>
        <div className="info-row"><div className="ir-label">Email</div><div className="ir-val">{user?.email}</div></div>
        <div className="info-row"><div className="ir-label">Pincode</div><div className="ir-val">{pincode}</div></div>
        <div className="info-row"><div className="ir-label">Weekly Income</div><div className="ir-val">₹{income}</div></div>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-title">Risk Score</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
          <div>
            <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'2rem',fontWeight:800,color:'var(--orange)'}}>{Number(riskValue).toFixed(2)}</div>
            <div style={{fontSize:'.82rem',color:'var(--muted)'}}>Your personal risk number</div>
          </div>
          <span className="tag" style={{background:'#FFF4E0',color:'#E65100',fontSize:'.88rem',padding:'8px 16px'}}>{riskCategory}</span>
        </div>
        <div className="info-row"><div className="ir-label">Zone</div><div className="ir-val">{profile?.zone || 'Zone A'}</div></div>
        <div className="info-row"><div className="ir-label">Pincode</div><div className="ir-val">{pincode}</div></div>
        <div className="info-row"><div className="ir-label">Weekly hours</div><div className="ir-val">{profile?.avg_weekly_hours ?? 'N/A'}</div></div>
        <div className="info-row"><div className="ir-label">Shift</div><div className="ir-val">{profile?.primary_shift || 'Afternoon'}</div></div>
        <div className="info-row"><div className="ir-label">Weekly income baseline</div><div className="ir-val">₹{profile?.avg_weekly_income ?? income}</div></div>
        <div style={{background:'var(--blue-light)',borderRadius:'10px',padding:'12px',marginTop:'12px',fontSize:'.83rem',color:'var(--blue)',display:'flex',alignItems:'center',gap:'8px'}}>
          <Info size={16} color="var(--blue2)" style={{flexShrink:0}} />
          Work in afternoon slots instead of night to bring your risk number down and pay less each week.
        </div>
      </div>
    </div>
  );
};

export default Profile;
