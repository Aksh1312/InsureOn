import React, { useContext } from 'react';
import { Calendar, IndianRupee, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Earnings = () => {
  const { user } = useContext(AuthContext);

  const dailyAvg = user?.income ? Math.round(user.income / 7) : 1000;
  const cutoff = Math.round(dailyAvg / 2);

  return (
    <div className="dash-page active">
      <div className="page-title">My Earnings</div>
      <div className="page-sub">Your daily money history - used to work out your insurance starting point</div>

      <div className="grid-4" style={{marginBottom:'24px'}}>
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={28} color="var(--blue2)" /></div>
          <div className="stat-val">₹{dailyAvg}</div>
          <div className="stat-lbl">Your daily average</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><IndianRupee size={28} color="var(--orange)" /></div>
          <div className="stat-val">₹{dailyAvg * 4}</div>
          <div className="stat-lbl">This week so far</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={28} color="var(--green2)" /></div>
          <div className="stat-val">{(dailyAvg * 20).toLocaleString()}</div>
          <div className="stat-lbl">This month (₹)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={28} color="var(--navy)" /></div>
          <div className="stat-val">22 hrs</div>
          <div className="stat-lbl">Avg hours/week</div>
        </div>
      </div>

      <div className="card" style={{marginBottom:'20px'}}>
        <div className="card-title">This week's earnings vs your normal</div>
        <div style={{fontSize:'.82rem',color:'var(--muted)',marginBottom:'16px'}}>
          The cutoff (₹{cutoff}) is half your daily average. If your earnings go below this for 5 days - your payout starts.
        </div>
        <div className="earn-row"><div className="earn-day">Mon</div><div className="earn-track"><div className="earn-bar" style={{width:'85%',background:'var(--green2)'}}><span>₹{(dailyAvg * 0.85).toFixed(0)}</span></div></div><div className="earn-amt" style={{color:'var(--green2)'}}>₹{(dailyAvg * 0.85).toFixed(0)}</div></div>
        <div className="earn-row"><div className="earn-day">Tue</div><div className="earn-track"><div className="earn-bar" style={{width:'95%',background:'var(--green2)'}}><span>₹{(dailyAvg * 0.95).toFixed(0)}</span></div></div><div className="earn-amt" style={{color:'var(--green2)'}}>₹{(dailyAvg * 0.95).toFixed(0)}</div></div>
        <div className="earn-row"><div className="earn-day">Wed</div><div className="earn-track"><div className="earn-bar" style={{width:'22%',background:'var(--red2)'}}><span>₹{(dailyAvg * 0.22).toFixed(0)}</span></div></div><div className="earn-amt" style={{color:'var(--red2)'}}>₹{(dailyAvg * 0.22).toFixed(0)} -</div></div>
        <div className="earn-row"><div className="earn-day">Thu</div><div className="earn-track"><div className="earn-bar" style={{width:'18%',background:'var(--red2)'}}><span>₹{(dailyAvg * 0.18).toFixed(0)}</span></div></div><div className="earn-amt" style={{color:'var(--red2)'}}>₹{(dailyAvg * 0.18).toFixed(0)} -</div></div>
        <div className="earn-row"><div className="earn-day">Fri</div><div className="earn-track"><div className="earn-bar" style={{width:'25%',background:'var(--red2)'}}><span>₹{(dailyAvg * 0.25).toFixed(0)}</span></div></div><div className="earn-amt" style={{color:'var(--red2)'}}>₹{(dailyAvg * 0.25).toFixed(0)} -</div></div>
        
        <div style={{fontSize:'.8rem',color:'var(--orange)',fontWeight:700,marginTop:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
          <AlertTriangle size={16} color="var(--orange)" style={{flexShrink:0}} />
          3 low days spotted. Claim is open and watching.
        </div>
      </div>

      <div className="card">
        <div className="card-title">How your daily average is worked out</div>
        <div className="info-row"><div className="ir-label">Total earnings last 4 weeks</div><div className="ir-val">₹{user?.income ? (user.income * 4).toLocaleString() : '24,000'}</div></div>
        <div className="info-row"><div className="ir-label">Days you worked in last 4 weeks</div><div class="ir-val">24 days</div></div>
        <div className="info-row"><div className="ir-label">Your daily average</div><div className="ir-val" style={{color:'var(--blue)',fontSize:'1.05rem'}}>₹{dailyAvg}/day</div></div>
        <div className="info-row"><div className="ir-label">Half of that (your cutoff)</div><div className="ir-val" style={{color:'var(--orange)'}}>₹{cutoff}/day</div></div>
        <div style={{background:'var(--blue-light)',borderRadius:'10px',padding:'12px 14px',marginTop:'12px',fontSize:'.83rem',color:'var(--blue)',lineHeight:1.6}}>
          Any day you earn <strong>below ₹{cutoff}</strong> during a problem counts as a lost day. 5 lost days in a row = money sent to your UPI.
        </div>
      </div>
    </div>
  );
};

export default Earnings;
