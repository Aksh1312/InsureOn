import React from 'react';
import { Link } from 'react-router-dom';
import { CloudLightning, Landmark, CheckCircle, CloudRain, Frown, Lock, AlertTriangle, Zap, ThermometerSun, Shield } from 'lucide-react';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';

const Home = () => {
  return (
    <div id="public-site">
      <PublicNavbar />
      
      {/* ── HOME ── */}
      <div id="pub-home" className="active">
        <section className="hero">
          <h1>When bad days stop your work,<br/><em>we pay your salary.</em></h1>
          <p className="hero-sub">InsureOn watches what is happening in your city - bad weather, shutdowns, disasters - and sends money straight to your UPI. No forms. No phone calls. No waiting in lines.</p>
          <p style={{fontSize:'.8rem',color:'rgba(255,255,255,.7)',marginTop:'10px',marginBottom:'15px'}}>
            Premium varies based on your city risk, working hours, and safety score.
          </p>
          <div className="hero-btns">
            <Link to="/signup" className="btn btn-primary">Start from ₹15/week &rarr;</Link>
            <Link to="/how-it-works" className="btn btn-outline">See how it works</Link>
          </div>
          <div className="hero-trust">
            <div className="trust-item"><CloudLightning size={15} color="#FF8A65" /> Payout in 48–72 hours</div>
            <div className="trust-item"><Landmark size={15} color="#FF8A65" /> UPI transfer - no bank visit</div>
            <div className="trust-item"><CheckCircle size={15} color="#FF8A65" /> Works as delivery partners</div>
          </div>
        </section>

        <section className="pub-section">
          <div className="section-tag">The Problem</div>
          <h2 className="section-title">One bad week can wipe out your whole month</h2>
          <p className="section-sub">You work hard every day. But when something big hits your city - orders stop, roads close, and you earn nothing. Your bills don't stop. There is no backup. Until now.</p>
          <div className="grid-3">
            <div className="card" style={{textAlign:'center',padding:'32px 22px'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'14px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'var(--blue-light)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <CloudRain size={28} color="var(--blue2)" />
                </div>
              </div>
              <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.05rem',fontWeight:800,marginBottom:'8px'}}>Bad days shut everything down</div>
              <div style={{fontSize:'.88rem',color:'var(--muted)',lineHeight:1.6}}>Heavy rains, storms, shutdowns, or curfews - the city stops and so do all your orders.</div>
            </div>
            <div className="card" style={{textAlign:'center',padding:'32px 22px'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'14px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'var(--red-light)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Frown size={28} color="var(--red2)" />
                </div>
              </div>
              <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.05rem',fontWeight:800,marginBottom:'8px'}}>Your bills still come</div>
              <div style={{fontSize:'.88rem',color:'var(--muted)',lineHeight:1.6}}>Rent. Food. EMI. They don't pause even when your work does.</div>
            </div>
            <div className="card" style={{textAlign:'center',padding:'32px 22px'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'14px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'var(--orange-pale)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Lock size={28} color="var(--orange)" />
                </div>
              </div>
              <div style={{fontFamily:"'Open Sans',sans-serif",fontSize:'1.05rem',fontWeight:800,marginBottom:'8px'}}>No one helps you</div>
              <div style={{fontSize:'.88rem',color:'var(--muted)',lineHeight:1.6}}>Delivery platforms don't give you money for days you cannot work. You are on your own.</div>
            </div>
          </div>
        </section>

        <section className="pub-section gray">
          <div className="section-tag">What We Cover</div>
          <h2 className="section-title">We protect you from all kinds of bad situations</h2>
          <p className="section-sub">Not just rain - anything that stops you from going out and earning. If your city shuts down and your money drops, we step in.</p>
          <div className="grid-3">
            <div className="card" style={{padding:'26px 22px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'var(--blue-light)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
                 <CloudRain size={24} color="var(--blue2)" />
              </div>
              <div style={{fontWeight:800,fontSize:'1rem',marginBottom:'6px'}}>Heavy Rain &amp; Floods</div>
              <div style={{fontSize:'.86rem',color:'var(--muted)',lineHeight:1.6}}>Streets fill with water, roads close, no orders come in.</div>
            </div>
            <div className="card" style={{padding:'26px 22px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'var(--red-light)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
                 <CloudLightning size={24} color="var(--red2)" />
              </div>
              <div style={{fontWeight:800,fontSize:'1rem',marginBottom:'6px'}}>Storms &amp; Cyclones</div>
              <div style={{fontSize:'.86rem',color:'var(--muted)',lineHeight:1.6}}>Big storms that make it unsafe to go outside at all.</div>
            </div>
            <div className="card" style={{padding:'26px 22px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'var(--orange-pale)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
                 <Lock size={24} color="var(--orange)" />
              </div>
              <div style={{fontWeight:800,fontSize:'1rem',marginBottom:'6px'}}>Lockdowns &amp; Curfews</div>
              <div style={{fontSize:'.86rem',color:'var(--muted)',lineHeight:1.6}}>Government shutdowns, riots, or zone curfews that stop all movement.</div>
            </div>
            <div className="card" style={{padding:'26px 22px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'var(--yellow-light)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
                 <AlertTriangle size={24} color="var(--yellow)" />
              </div>
              <div style={{fontWeight:800,fontSize:'1rem',marginBottom:'6px'}}>Earthquakes &amp; Disasters</div>
              <div style={{fontSize:'.86rem',color:'var(--muted)',lineHeight:1.6}}>Natural events declared as disasters by the government.</div>
            </div>
            <div className="card" style={{padding:'26px 22px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'var(--green-light)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
                 <Zap size={24} color="var(--green2)" />
              </div>
              <div style={{fontWeight:800,fontSize:'1rem',marginBottom:'6px'}}>App Shutdowns (Add-on)</div>
              <div style={{fontSize:'.86rem',color:'var(--muted)',lineHeight:1.6}}>If the delivery app itself stops working for a long time.</div>
            </div>
            <div className="card" style={{padding:'26px 22px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'#FFF0F0',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
                 <ThermometerSun size={24} color="#E53935" />
              </div>
              <div style={{fontWeight:800,fontSize:'1rem',marginBottom:'6px'}}>Extreme Heat &amp; Heatwaves</div>
              <div style={{fontSize:'.86rem',color:'var(--muted)',lineHeight:1.6}}>Government-declared heatwave alerts that make outdoor work dangerous or impossible.</div>
            </div>
          </div>
        </section>

        <section style={{background:'var(--orange)',padding:'60px 6%',textAlign:'center'}}>
          <h2 style={{fontSize:'2rem',fontWeight:800,color:'#fff',marginBottom:'12px'}}>Start your protection today</h2>
          <p style={{color:'rgba(255,255,255,.8)',fontSize:'1rem',marginBottom:'28px'}}>Starting from ₹15/week. Stop anytime. Money in 48 hours.</p>
          <Link to="/signup" className="btn" style={{background:'#fff',color:'var(--orange)',fontSize:'1.1rem'}}>Sign Up - It's Free to Start &rarr;</Link>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
