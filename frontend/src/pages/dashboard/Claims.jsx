import React, { useState } from 'react';
import { Info, ChevronDown, X, Clock, CloudRain, AlertTriangle } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

const Claims = () => {
  const [showHow, setShowHow] = useState(false);
  const { activeClaim, claimHistory, payoutHistory, loading, error } = useDashboardData();

  if (loading) return <div className="dash-page active">Loading...</div>;

  const latestPayout = payoutHistory?.[0];
  const claimCount = claimHistory?.length || 0;
  const lossCounter = Math.max(0, Math.min(5, activeClaim?.loss_counter || 0));

  return (
    <div className="dash-page active">
      {error && (
        <div className="alert-bar orange" style={{marginBottom:'16px'}}>
          <div className="ab-icon"><AlertTriangle color="#FB8C00" size={24} /></div>
          <div className="ab-text">
            <div className="ab-title">Claims data partial</div>
            <div className="ab-sub">{error}</div>
          </div>
        </div>
      )}

      <div className="claims-header">
        <div>
          <div className="page-title">My Claims</div>
          <div className="page-sub" style={{marginBottom:0}}>We open and handle all claims on our own. You never need to do anything.</div>
        </div>
        <div className="how-claims-dropdown">
          <button className={`how-claims-btn ${showHow ? 'open' : ''}`} onClick={() => setShowHow(!showHow)}>
            <Info size={16} />
            How Claims Work
            <ChevronDown size={14} style={{transform: showHow ? '' : 'rotate(180deg)', transition: '.3s'}} />
          </button>
          {showHow && (
            <div className="how-claims-panel open" style={{display:'block'}}>
              <div className="hcp-header"><div className="hcp-header-title">How Claims Work - 3 Steps</div><div className="hcp-header-sub">Everything is automatic. You never need to do anything.</div></div>
              <div className="hcp-body">
                <div className="hcp-step"><div className="hcp-num">1</div><div className="hcp-content"><div className="hcp-title">A problem hits your city</div><div className="hcp-body">The government sends an alert. We see it within 15 minutes and open your claim right away.</div></div></div>
                <div className="hcp-step"><div className="hcp-num">2</div><div className="hcp-content"><div className="hcp-title">We check your earnings every day</div><div className="hcp-body">We check your earnings every night. If below 50% of normal for 5 consecutive days - you qualify.</div></div></div>
                <div className="hcp-step" style={{marginBottom:0}}><div className="hcp-num">3</div><div className="hcp-content"><div className="hcp-title">Money goes to your UPI</div><div className="hcp-body">No form. No call. No office. Money reaches your UPI within 48–72 hours.</div></div></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="claim-tracker">
        <div className="ct-label">{activeClaim ? `Claim #${activeClaim.id}` : 'No active claim'}</div>
        <div className="ct-title">{activeClaim ? `Status: ${activeClaim.status}` : 'Nothing currently being monitored'}</div>
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
          {activeClaim
            ? `${activeClaim.loss_counter || 0} low-money days recorded. ${activeClaim.days_of_loss ? `${activeClaim.days_of_loss} days of loss total.` : 'Monitoring continues.'}`
            : 'Once weather or disruption triggers a claim, it will show up here automatically.'}
        </div>
      </div>

      <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.1rem',fontWeight:800,color:'var(--navy)',margin:'20px 0 14px'}}>How much will you get?</div>
      <div className="card" style={{marginBottom:'24px'}}>
        <div className="payout-row"><div className="p-days">1–4 days</div><div className="p-track"><div style={{width:'100%',height:'100%',borderRadius:'8px',background:'#F0F4F8',display:'flex',alignItems:'center',padding:'0 12px'}}><span style={{fontSize:'.78rem',color:'var(--muted)',fontWeight:700}}>No payout yet</span></div></div></div>
        <div className="payout-row"><div className="p-days">5 days</div><div className="p-track"><div className="p-fill" style={{width:'70%',background:'var(--orange)'}}><span>70% of cover</span></div></div></div>
        <div className="payout-row"><div className="p-days">6 days</div><div className="p-track"><div className="p-fill" style={{width:'85%',background:'var(--blue2)'}}><span>85% of cover</span></div></div></div>
        <div className="payout-row"><div className="p-days">7 days</div><div className="p-track"><div className="p-fill" style={{width:'100%',background:'var(--green2)'}}><span>100% of cover</span></div></div></div>
      </div>

      <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.1rem',fontWeight:800,color:'var(--navy)',marginBottom:'14px'}}>Past Claims</div>
      {claimCount > 0 ? (
        claimHistory.map((claim) => (
          <div className="past-claim" key={claim.id}>
            <div className="pc-ico"><CloudRain color="var(--blue2)" size={24} /></div>
            <div>
              <div className="pc-title">Claim #{claim.id}</div>
              <div className="pc-sub">{claim.status} · {claim.days_of_loss || 0} days</div>
            </div>
            <div className="pc-right">
              <div className="pc-amt">₹{claim.payout_amount?.toLocaleString('en-IN') || '0'}</div>
              <div className="pc-tag">{claim.status}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="card">No claim history yet.</div>
      )}

      {latestPayout && (
        <div style={{marginTop:'16px',fontSize:'.86rem',color:'var(--muted)'}}>
          Latest payout: ₹{Number(latestPayout.amount).toLocaleString('en-IN')} to {latestPayout.upi_id}
        </div>
      )}
    </div>
  );
};

export default Claims;
