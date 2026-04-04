import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AlertTriangle, Calendar, IndianRupee, TrendingUp, Trophy, X, Clock, ArrowRight } from 'lucide-react';

const Overview = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="dash-page active">
      <div className="hero-banner">
        <div className="hb-left">
          <div className="hb-greet">Good morning</div>
          <div className="hb-name">{user?.full_name || 'User'}</div>
          <div className="hb-status"><div className="hb-dot"></div>Your cover is ON - Active</div>
        </div>
        <div className="hb-right">
          <div className="hb-box"><div className="hb-val">₹2,800</div><div className="hb-lbl">Max payout</div></div>
          <div className="hb-box"><div className="hb-val">₹120</div><div className="hb-lbl">Per week</div></div>
        </div>
      </div>

      <div className="alert-bar orange">
        <div className="ab-icon"><AlertTriangle color="#FB8C00" size={24} /></div>
        <div className="ab-text">
          <div className="ab-title">Alert active - Chennai</div>
          <div className="ab-sub">Serious weather expected today and tomorrow. <strong>We are already watching your earnings.</strong> No action needed from you.</div>
        </div>
      </div>

      <div className="claim-tracker">
        <div className="ct-label">Active Claim - Watching now</div>
        <div className="ct-title">Heavy Rain - October</div>
        <div className="day-dots">
          <div className="day-dot loss"><div className="dd-ico"><X color="#fff" size={14} /></div>Day 1</div>
          <div className="day-dot loss"><div className="dd-ico"><X color="#fff" size={14} /></div>Day 2</div>
          <div className="day-dot loss"><div className="dd-ico"><X color="#fff" size={14} /></div>Day 3</div>
          <div className="day-dot wait"><div className="dd-ico"><Clock color="var(--muted)" size={14} /></div>Day 4</div>
          <div className="day-dot wait"><div className="dd-ico"><Clock color="var(--muted)" size={14} /></div>Day 5</div>
        </div>
        <div className="ct-note">3 low-money days confirmed. <strong>2 more days needed.</strong> If Day 4 and Day 5 are also low - <strong>₹1,960 will be sent to your UPI automatically.</strong></div>
      </div>

      <div className="grid-4" style={{marginBottom:'24px'}}>
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={28} color="var(--blue2)" /></div>
          <div className="stat-val">6</div>
          <div className="stat-lbl">Weeks covered</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><IndianRupee size={28} color="var(--orange)" /></div>
          <div className="stat-val" style={{color:'var(--orange)'}}>₹1,960</div>
          <div className="stat-lbl">Payout on the way</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={28} color="var(--navy)" /></div>
          <div className="stat-val">₹{user?.income ? (user.income / 7).toFixed(0) : '1,000'}</div>
          <div className="stat-lbl">Your daily average</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Trophy size={28} color="var(--green2)" /></div>
          <div className="stat-val" style={{color:'var(--green)'}}>₹4,760</div>
          <div className="stat-lbl">Total paid to you</div>
        </div>
      </div>

      <div className="premium-bar" style={{marginBottom:'20px'}}>
        <div className="pb-left">
          <div className="pb-label">Payment due Monday</div>
          <div className="pb-amt">₹120</div>
          <div className="pb-sub">Auto-pay is ON · UPI</div>
        </div>
        <button className="pb-btn">Pay Now</button>
      </div>
    </div>
  );
};

export default Overview;
