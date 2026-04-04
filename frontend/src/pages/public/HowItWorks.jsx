import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList, IndianRupee } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';

const HowItWorks = () => {
  return (
    <div id="public-site">
      <PublicNavbar />
      
      <div id="pub-how" className="active">
        <section className="hero" style={{padding:'70px 6% 80px'}}>
          <div className="hero-kicker"><span></span>Simple process</div>
          <h1 style={{fontSize:'2.6rem'}}>How InsureOn Works</h1>
          <p className="hero-sub">Three steps. No forms. Money in your UPI within 48 hours of qualifying.</p>
        </section>
        <section className="pub-section">
          <div className="section-tag">The Process</div>
          <h2 className="section-title">What happens when a problem hits your city</h2>
          <div className="steps-grid" style={{marginBottom:'48px'}}>
            <div className="step-card">
              <div className="step-num">1</div>
              <div className="step-icon">
                <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'var(--orange-pale)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <AlertTriangle size={26} color="var(--orange)" />
                </div>
              </div>
              <div className="step-title">We spot the problem first</div>
              <div className="step-body">Our system checks government alerts every 15 minutes. When a serious problem is declared in your city, we know within minutes.</div>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <div className="step-icon">
                <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'var(--blue-light)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <ClipboardList size={26} color="var(--blue2)" />
                </div>
              </div>
              <div className="step-title">Your claim opens by itself</div>
              <div className="step-body">We open your claim right away. No form, no call needed. We then start checking your daily money every night.</div>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <div className="step-icon">
                <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'var(--green-light)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <IndianRupee size={26} color="var(--green2)" />
                </div>
              </div>
              <div className="step-title">Money goes to your UPI</div>
              <div className="step-body">If your money stays below half of normal for 5 days in a row - we send your payout straight to your UPI ID within 48–72 hours.</div>
            </div>
          </div>
          <h2 className="section-title">How much will you get?</h2>
          <p className="section-sub">The more days you lose, the more you get. Simple.</p>
          <div className="card" style={{maxWidth:'600px'}}>
            <div className="payout-row"><div className="p-days">1–4 days</div><div className="p-track"><div style={{width:'100%',height:'100%',borderRadius:'8px',background:'#F0F4F8',display:'flex',alignItems:'center',padding:'0 12px'}}><span style={{fontSize:'.78rem',color:'var(--muted)',fontWeight:700}}>No payout - not enough days yet</span></div></div></div>
            <div className="payout-row"><div className="p-days">5 days</div><div className="p-track"><div className="p-fill" style={{width:'70%',background:'var(--orange)'}}><span>70% of your cover</span></div></div></div>
            <div className="payout-row"><div className="p-days">6 days</div><div className="p-track"><div className="p-fill" style={{width:'85%',background:'var(--blue2)'}}><span>85% of your cover</span></div></div></div>
            <div className="payout-row"><div className="p-days">7 days</div><div className="p-track"><div className="p-fill" style={{width:'100%',background:'var(--green2)'}}><span>100% of your cover</span></div></div></div>
          </div>
        </section>
        <section className="pub-section gray" style={{textAlign:'center'}}>
          <h2 className="section-title">Ready to get protected?</h2>
          <p style={{fontSize:'1rem',color:'var(--muted)',marginBottom:'28px'}}>Takes 2 minutes to sign up. Starts from ₹15/week.</p>
          <Link to="/signup" className="btn btn-primary" style={{fontSize:'1.1rem'}}>Create Free Account &rarr;</Link>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorks;
