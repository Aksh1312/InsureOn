import React, { useState } from 'react';
import { Info, ChevronDown, X, Clock, CloudRain, AlertTriangle } from 'lucide-react';

const Claims = () => {
  const [showHow, setShowHow] = useState(false);

  return (
    <div className="dash-page active">
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
        <div className="ct-label">Claim #2024-OCT-012</div>
        <div className="ct-title">Heavy Rain - Chennai, October</div>
        <div className="day-dots">
          <div className="day-dot loss"><div className="dd-ico"><X color="#fff" size={14} /></div>Day 1</div>
          <div className="day-dot loss"><div className="dd-ico"><X color="#fff" size={14} /></div>Day 2</div>
          <div className="day-dot loss"><div className="dd-ico"><X color="#fff" size={14} /></div>Day 3</div>
          <div className="day-dot wait"><div className="dd-ico"><Clock color="var(--muted)" size={14} /></div>Day 4</div>
          <div className="day-dot wait"><div className="dd-ico"><Clock color="var(--muted)" size={14} /></div>Day 5</div>
        </div>
        <div className="ct-note">3 low-money days confirmed. <strong>2 more days needed.</strong> If both qualify - <strong>₹1,960 sent to UPI on Day 5.</strong></div>
      </div>

      <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.1rem',fontWeight:800,color:'var(--navy)',margin:'20px 0 14px'}}>How much will you get?</div>
      <div className="card" style={{marginBottom:'24px'}}>
        <div className="payout-row"><div className="p-days">1–4 days</div><div className="p-track"><div style={{width:'100%',height:'100%',borderRadius:'8px',background:'#F0F4F8',display:'flex',alignItems:'center',padding:'0 12px'}}><span style={{fontSize:'.78rem',color:'var(--muted)',fontWeight:700}}>No payout yet</span></div></div></div>
        <div className="payout-row"><div className="p-days">5 days</div><div className="p-track"><div className="p-fill" style={{width:'70%',background:'var(--orange)'}}><span>₹1,960 (70%)</span></div></div></div>
        <div className="payout-row"><div className="p-days">6 days</div><div className="p-track"><div className="p-fill" style={{width:'85%',background:'var(--blue2)'}}><span>₹2,380 (85%)</span></div></div></div>
        <div className="payout-row"><div className="p-days">7 days</div><div className="p-track"><div className="p-fill" style={{width:'100%',background:'var(--green2)'}}><span>₹2,800 - Full</span></div></div></div>
      </div>

      <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.1rem',fontWeight:800,color:'var(--navy)',marginBottom:'14px'}}>Past Claims</div>
      <div className="past-claim">
        <div className="pc-ico"><CloudRain color="var(--blue2)" size={24} /></div>
        <div>
          <div className="pc-title">Heavy Rain - August 2024</div>
          <div class="pc-sub">7 days · UPI transfer</div>
        </div>
        <div className="pc-right">
          <div className="pc-amt">₹2,800</div>
          <div className="pc-tag">Paid</div>
        </div>
      </div>
      <div className="past-claim">
        <div className="pc-ico"><AlertTriangle color="var(--blue2)" size={24} /></div>
        <div>
          <div className="pc-title">Cyclone - May 2024</div>
          <div class="pc-sub">5 days · UPI transfer</div>
        </div>
        <div className="pc-right">
          <div className="pc-amt">₹1,960</div>
          <div className="pc-tag">Paid</div>
        </div>
      </div>
    </div>
  );
};

export default Claims;
