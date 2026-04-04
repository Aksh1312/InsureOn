import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Info } from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="dash-page active">
      <div className="page-title">My Profile</div>
      <div className="page-sub">Your details and account settings</div>

      <div className="card" style={{textAlign:'center',marginBottom:'20px',padding:'36px'}}>
        <div className="profile-avatar" style={{margin:'0 auto'}}>{user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}</div>
        <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.4rem',fontWeight:800}}>{user.full_name}</div>
        <div style={{fontSize:'.88rem',color:'var(--muted)',marginTop:'4px'}}>Member since {new Date().getFullYear()}</div>
        <div style={{marginTop:'12px'}}><span className="tag tag-orange">Zone A</span> &nbsp; <span className="tag tag-green">Tier 1</span></div>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-title">Personal Details</div>
        <div className="info-row"><div className="ir-label">Full name</div><div className="ir-val">{user.full_name}</div></div>
        <div className="info-row"><div className="ir-label">Email</div><div className="ir-val">{user.email}</div></div>
        <div className="info-row"><div className="ir-label">Pincode</div><div className="ir-val">{user.pincode}</div></div>
        <div className="info-row"><div className="ir-label">Weekly Income</div><div className="ir-val">₹{user.income}</div></div>
      </div>

      <div className="card" style={{marginBottom:'16px'}}>
        <div className="card-title">Risk Score</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
          <div>
            <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'2rem',fontWeight:800,color:'var(--orange)'}}>2.10</div>
            <div style={{fontSize:'.82rem',color:'var(--muted)'}}>Your personal risk number</div>
          </div>
          <span className="tag" style={{background:'#FFF4E0',color:'#E65100',fontSize:'.88rem',padding:'8px 16px'}}>Higher Risk</span>
        </div>
        <div className="info-row"><div className="ir-label">Zone (Zone A, 30%)</div><div className="ir-val">High → 3 pts</div></div>
        <div className="info-row"><div className="ir-label">Pincode problem history (25%)</div><div className="ir-val">High → 3 pts</div></div>
        <div className="info-row"><div className="ir-label">Work hours (20%)</div><div className="ir-val">Low → 1 pt</div></div>
        <div className="info-row"><div className="ir-label">When you work (15%)</div><div className="ir-val">Afternoon → 1 pt</div></div>
        <div className="info-row"><div className="ir-label">Past claims (10%)</div><div className="ir-val">0 claims → 1 pt</div></div>
        <div style={{background:'var(--blue-light)',borderRadius:'10px',padding:'12px',marginTop:'12px',fontSize:'.83rem',color:'var(--blue)',display:'flex',alignItems:'center',gap:'8px'}}>
          <Info size={16} color="var(--blue2)" style={{flexShrink:0}} />
          Work in afternoon slots instead of night to bring your risk number down and pay less each week.
        </div>
      </div>
    </div>
  );
};

export default Profile;
