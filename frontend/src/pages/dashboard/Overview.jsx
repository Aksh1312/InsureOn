import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AlertTriangle, Calendar, IndianRupee, TrendingUp, Trophy, X, Clock } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const Overview = () => {
  const { user } = useContext(AuthContext);
  const { profile, activePolicy: policy, activeClaim: claim, payoutHistory, loading, error } = useDashboardData();

  if (loading) return <div className="dash-page active">Loading...</div>;

  const weeklyCoverage = policy?.weekly_coverage ?? profile?.weekly_coverage ?? 2800;
  const weeklyPremium = policy?.weekly_premium ?? profile?.weekly_premium ?? 120;
  const dailyAverage = profile?.avg_daily_income ?? (user?.income ? Number(user.income) / 7 : 1000);
  const totalPaid = payoutHistory?.reduce((sum, payout) => sum + (Number(payout.amount) || 0), 0) || 0;
  const payoutOnWay = claim ? (claim.payout_amount ?? 0) : 0;
  const lossCounter = Math.max(0, Math.min(5, claim?.loss_counter || 0));
  const regionLabel = user?.region || 'your city';

  return (
    <div className="dash-page active">
      {error && (
        <div className="alert-bar orange" style={{marginBottom:'16px'}}>
          <div className="ab-icon"><AlertTriangle color="#FB8C00" size={24} /></div>
          <div className="ab-text">
            <div className="ab-title">Dashboard data unavailable</div>
            <div className="ab-sub">{error}</div>
          </div>
        </div>
      )}

      <div className="hero-banner">
        <div className="hb-left">
          <div className="hb-greet">Good morning</div>
          <div className="hb-name">{profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'User'}</div>
          <div className="hb-status"><div className="hb-dot"></div>{policy?.is_active ? 'Your cover is ON - Active' : 'No active policy yet'}</div>
        </div>
        <div className="hb-right">
          <div className="hb-box"><div className="hb-val">₹{weeklyCoverage.toLocaleString('en-IN')}</div><div className="hb-lbl">Max payout</div></div>
          <div className="hb-box"><div className="hb-val">₹{weeklyPremium.toLocaleString('en-IN')}</div><div className="hb-lbl">Per week</div></div>
        </div>
      </div>

      {claim && (
        <div className="alert-bar orange">
          <div className="ab-icon"><AlertTriangle color="#FB8C00" size={24} /></div>
          <div className="ab-text">
            <div className="ab-title">Alert active - {regionLabel}</div>
            <div className="ab-sub">Your claim is open. We are monitoring your earnings automatically.</div>
          </div>
        </div>
      )}

      <div className="claim-tracker">
        <div className="ct-label">{claim ? 'Active Claim - Watching now' : 'No active claim'}</div>
        <div className="ct-title">{claim ? `Claim #${claim.id}` : 'Nothing being monitored yet'}</div>
        <div className="day-dots">
          {[1, 2, 3, 4, 5].map((day) => {
            const isLossDay = day <= lossCounter;
            return (
              <div key={day} className={`day-dot ${isLossDay ? 'loss' : 'wait'}`}>
                <div className="dd-ico">
                  {isLossDay ? <X color="#fff" size={14} /> : <Clock color="var(--muted)" size={14} />}
                </div>
                Day {day}
              </div>
            );
          })}
        </div>
        <div className="ct-note">
          {claim
            ? `Current status: ${claim.status}. ${claim.loss_counter || 0} low-money days recorded.`
            : 'Once a weather event opens a claim, monitoring details will appear here.'}
        </div>
      </div>

      <div className="grid-4" style={{marginBottom:'24px'}}>
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={28} color="var(--blue2)" /></div>
          <div className="stat-val">{policy ? 1 : 0}</div>
          <div className="stat-lbl">Weeks covered</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><IndianRupee size={28} color="var(--orange)" /></div>
          <div className="stat-val" style={{color:'var(--orange)'}}>₹{Number(payoutOnWay).toLocaleString('en-IN')}</div>
          <div className="stat-lbl">{claim ? 'Payout on the way' : 'No payout in progress'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={28} color="var(--navy)" /></div>
          <div className="stat-val">₹{Number(dailyAverage).toFixed(0)}</div>
          <div className="stat-lbl">Your daily average</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Trophy size={28} color="var(--green2)" /></div>
          <div className="stat-val" style={{color:'var(--green)'}}>₹{Number(totalPaid).toLocaleString('en-IN')}</div>
          <div className="stat-lbl">Total paid to you</div>
        </div>
      </div>

      <div className="premium-bar" style={{marginBottom:'20px'}}>
        <div className="pb-left">
          <div className="pb-label">Payment due Monday</div>
          <div className="pb-amt">₹{weeklyPremium.toLocaleString('en-IN')}</div>
          <div className="pb-sub">Auto-pay is ON · UPI</div>
        </div>
        <button className="pb-btn">Pay Now</button>
      </div>
    </div>
  );
};

export default Overview;
