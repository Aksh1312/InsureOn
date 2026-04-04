import React, { useContext } from 'react';
import { Calendar, IndianRupee, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';

const Earnings = () => {
  const { user } = useContext(AuthContext);
  const { profile, activeClaim, incomeLogs, loading, error } = useDashboardData();

  if (loading) return <div className="dash-page active">Loading...</div>;

  const dailyAvg = profile?.avg_daily_income ?? (user?.income ? Math.round(user.income / 7) : 1000);
  const cutoff = Math.round(dailyAvg / 2);
  const weeklyTotal = profile?.avg_weekly_income ?? user?.income ?? dailyAvg * 7;
  const hours = profile?.avg_weekly_hours ?? 22;
  const recentLogs = incomeLogs?.length ? incomeLogs.slice(-5).reverse() : [];

  return (
    <div className="dash-page active">
      {error && (
        <div className="alert-bar orange" style={{marginBottom:'16px'}}>
          <div className="ab-icon"><AlertTriangle color="#FB8C00" size={24} /></div>
          <div className="ab-text">
            <div className="ab-title">Earnings data partial</div>
            <div className="ab-sub">{error}</div>
          </div>
        </div>
      )}

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
          <div className="stat-val">₹{Math.round(dailyAvg * 4)}</div>
          <div className="stat-lbl">This week so far</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={28} color="var(--green2)" /></div>
          <div className="stat-val">{Math.round(weeklyTotal * 4).toLocaleString()}</div>
          <div className="stat-lbl">This month (₹)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={28} color="var(--navy)" /></div>
          <div className="stat-val">{hours} hrs</div>
          <div className="stat-lbl">Avg hours/week</div>
        </div>
      </div>

      <div className="card" style={{marginBottom:'20px'}}>
        <div className="card-title">This week's earnings vs your normal</div>
        <div style={{fontSize:'.82rem',color:'var(--muted)',marginBottom:'16px'}}>
          The cutoff (₹{cutoff}) is half your daily average. If your earnings go below this for 5 days - your payout starts.
        </div>
        {recentLogs.length > 0 ? recentLogs.map((log) => {
          const barWidth = Math.max(5, Math.min(100, Math.round((log.income_earned / Math.max(1, log.baseline_income)) * 100)));
          const isLow = log.is_below_threshold;
          return (
            <div className="earn-row" key={log.id}>
              <div className="earn-day">{new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="earn-track">
                <div className="earn-bar" style={{width: `${barWidth}%`, background: isLow ? 'var(--red2)' : 'var(--green2)'}}>
                  <span>₹{Number(log.income_earned).toFixed(0)}</span>
                </div>
              </div>
              <div className="earn-amt" style={{color: isLow ? 'var(--red2)' : 'var(--green2)'}}>
                ₹{Number(log.income_earned).toFixed(0)}{isLow ? ' -' : ''}
              </div>
            </div>
          );
        }) : (
          <div style={{fontSize:'.85rem',color:'var(--muted)'}}>No income logs available yet.</div>
        )}
        
        <div style={{fontSize:'.8rem',color:'var(--orange)',fontWeight:700,marginTop:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
          <AlertTriangle size={16} color="var(--orange)" style={{flexShrink:0}} />
          {activeClaim ? `${activeClaim.loss_counter || 0} low days spotted. Claim is open and watching.` : 'No active claim right now.'}
        </div>
      </div>

      <div className="card">
        <div className="card-title">How your daily average is worked out</div>
        <div className="info-row"><div className="ir-label">Total earnings last 4 weeks</div><div className="ir-val">₹{Number(weeklyTotal).toLocaleString('en-IN')}</div></div>
        <div className="info-row"><div className="ir-label">Days you worked in last 4 weeks</div><div className="ir-val">{hours ? Math.round(hours * 4 / 7) : 24} days</div></div>
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
