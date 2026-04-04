import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';

const Pricing = () => {
  const [activeZone, setActiveZone] = useState('A');

  return (
    <div id="public-site">
      <PublicNavbar />
      
      <div id="pub-pricing" className="active">
        <section className="hero" style={{padding:'70px 6% 80px'}}>
          <div className="hero-kicker"><span></span>Honest pricing</div>
          <h1 style={{fontSize:'2.6rem'}}>Plans that fit every worker</h1>
          <p className="hero-sub">Your weekly charge depends on your city's risk zone and how many hours you work. No hidden fees. Stop anytime.</p>
        </section>

        <section className="pub-section">
          <div className="section-tag">Choose Your Zone</div>
          <h2 className="section-title">Select your city to see exact prices</h2>
          <p className="section-sub">Your zone is set by your city. Cities with higher flood, storm, or disaster risk have higher premiums - because we pay out more often there.</p>

          <div className="zone-tabs">
            <button className={`zone-tab ${activeZone === 'A' ? 'active' : ''}`} onClick={() => setActiveZone('A')}>
              🔴 Zone A — High Risk
              <span style={{fontSize:'.76rem',fontWeight:600,color:'inherit',display:'block',marginTop:'2px'}}>Chennai · Mumbai · Kolkata · Delhi</span>
            </button>
            <button className={`zone-tab ${activeZone === 'B' ? 'active' : ''}`} onClick={() => setActiveZone('B')}>
              🟡 Zone B — Moderate Risk
              <span style={{fontSize:'.76rem',fontWeight:600,color:'inherit',display:'block',marginTop:'2px'}}>Bengaluru · Hyderabad · Ahmedabad · Pune</span>
            </button>
            <button className={`zone-tab ${activeZone === 'C' ? 'active' : ''}`} onClick={() => setActiveZone('C')}>
              🟢 Zone C — Low Risk
              <span style={{fontSize:'.76rem',fontWeight:600,color:'inherit',display:'block',marginTop:'2px'}}>Jaipur · Surat · Lucknow</span>
            </button>
          </div>

          {activeZone === 'A' && (
            <div className="zone-pricing active">
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
                    <span className="zone-badge-A"><span className="zone-dot" style={{background:'var(--red2)'}}></span>Zone A — High Risk</span>
                    <span style={{fontSize:'.85rem',color:'var(--muted)'}}>Premium rate: 2.5% of coverage</span>
                </div>
                <div className="pricing-grid">
                <div className="price-card">
                    <div className="price-zone">Zone A · Part-time Workers</div>
                    <div className="price-title">Tier 1 — Part-time<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>10–25 hrs/week</small></div>
                    <div className="price-amount">₹35–₹70<small>/week</small></div>
                    <div className="price-coverage">Coverage up to ₹2,800 per bad week</div>
                    <ul className="price-features" style={{marginTop:'16px'}}>
                    <li>Automatic disaster detection</li>
                    <li>UPI payout in 48–72 hours</li>
                    <li>No forms ever</li>
                    </ul>
                    <Link to="/signup" className="price-cta btn-navy">Get Started</Link>
                </div>

                <div className="price-card featured">
                    <div className="price-zone">Zone A · Regular Workers</div>
                    <div className="price-title">Tier 2 — Regular<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>26–40 hrs/week</small></div>
                    <div className="price-amount" style={{color:'var(--orange)'}}>₹90–₹130<small>/week</small></div>
                    <div className="price-coverage">Coverage up to ₹5,150 per bad week</div>
                    <ul className="price-features" style={{marginTop:'16px'}}>
                    <li>Automatic disaster detection</li>
                    <li>UPI payout in 48–72 hours</li>
                    <li>No forms ever</li>
                    </ul>
                    <Link to="/signup" className="price-cta" style={{background:'var(--orange)',color:'#fff'}}>Get Started &rarr;</Link>
                </div>

                <div className="price-card">
                    <div className="price-zone">Zone A · Full-time Workers</div>
                    <div className="price-title">Tier 3 — Full-time<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>41+ hrs/week</small></div>
                    <div className="price-amount">₹150–₹210<small>/week</small></div>
                    <div className="price-coverage">Coverage up to ₹8,400 per bad week</div>
                    <ul className="price-features" style={{marginTop:'16px'}}>
                    <li>Automatic disaster detection</li>
                    <li>UPI payout in 48–72 hours</li>
                    <li>No forms ever</li>
                    </ul>
                    <Link to="/signup" className="price-cta btn-navy">Get Started</Link>
                </div>
                </div>
            </div>
          )}

          {activeZone === 'B' && (
            <div className="zone-pricing active">
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
                    <span className="zone-badge-B"><span className="zone-dot" style={{background:'#e65100'}}></span>Zone B — Moderate Risk</span>
                    <span style={{fontSize:'.85rem',color:'var(--muted)'}}>Premium rate: 1.7% of coverage</span>
                </div>
                <div className="pricing-grid">
                    <div className="price-card">
                        <div className="price-zone">Zone B · Part-time Workers</div>
                        <div className="price-title">Tier 1 — Part-time<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>10–25 hrs/week</small></div>
                        <div className="price-amount">₹25–₹50<small>/week</small></div>
                        <div className="price-coverage">Coverage up to ₹2,800 per bad week</div>
                        <ul className="price-features" style={{marginTop:'16px'}}>
                        <li>Automatic disaster detection</li>
                        <li>UPI payout in 48–72 hours</li>
                        <li>No forms ever</li>
                        </ul>
                        <Link to="/signup" className="price-cta btn-navy">Get Started</Link>
                    </div>
    
                    <div className="price-card featured">
                        <div className="price-zone">Zone B · Regular Workers</div>
                        <div className="price-title">Tier 2 — Regular<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>26–40 hrs/week</small></div>
                        <div className="price-amount" style={{color:'var(--orange)'}}>₹60–₹90<small>/week</small></div>
                        <div className="price-coverage">Coverage up to ₹5,150 per bad week</div>
                        <ul className="price-features" style={{marginTop:'16px'}}>
                        <li>Automatic disaster detection</li>
                        <li>UPI payout in 48–72 hours</li>
                        <li>No forms ever</li>
                        </ul>
                        <Link to="/signup" className="price-cta" style={{background:'var(--orange)',color:'#fff'}}>Get Started &rarr;</Link>
                    </div>
    
                    <div className="price-card">
                        <div className="price-zone">Zone B · Full-time Workers</div>
                        <div className="price-title">Tier 3 — Full-time<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>41+ hrs/week</small></div>
                        <div className="price-amount">₹105–₹145<small>/week</small></div>
                        <div className="price-coverage">Coverage up to ₹8,400 per bad week</div>
                        <ul className="price-features" style={{marginTop:'16px'}}>
                        <li>Automatic disaster detection</li>
                        <li>UPI payout in 48–72 hours</li>
                        <li>No forms ever</li>
                        </ul>
                        <Link to="/signup" className="price-cta btn-navy">Get Started</Link>
                    </div>
                    </div>
            </div>
          )}

          {activeZone === 'C' && (
            <div className="zone-pricing active">
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
                    <span className="zone-badge-C"><span className="zone-dot" style={{background:'var(--green2)'}}></span>Zone C — Low Risk</span>
                    <span style={{fontSize:'.85rem',color:'var(--muted)'}}>Premium rate: 1.2% of coverage</span>
                </div>
                <div className="pricing-grid">
                    <div className="price-card">
                        <div className="price-zone">Zone C · Part-time Workers</div>
                        <div className="price-title">Tier 1 — Part-time<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>10–25 hrs/week</small></div>
                        <div className="price-amount">₹15–₹35<small>/week</small></div>
                        <div className="price-coverage">Coverage up to ₹2,800 per bad week</div>
                        <ul className="price-features" style={{marginTop:'16px'}}>
                        <li>Automatic disaster detection</li>
                        <li>UPI payout in 48–72 hours</li>
                        <li>No forms ever</li>
                        </ul>
                        <Link to="/signup" className="price-cta btn-navy">Get Started</Link>
                    </div>
    
                    <div className="price-card featured">
                        <div className="price-zone">Zone C · Regular Workers</div>
                        <div className="price-title">Tier 2 — Regular<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>26–40 hrs/week</small></div>
                        <div className="price-amount" style={{color:'var(--orange)'}}>₹40–₹60<small>/week</small></div>
                        <div className="price-coverage">Coverage up to ₹5,150 per bad week</div>
                        <ul className="price-features" style={{marginTop:'16px'}}>
                        <li>Automatic disaster detection</li>
                        <li>UPI payout in 48–72 hours</li>
                        <li>No forms ever</li>
                        </ul>
                        <Link to="/signup" className="price-cta" style={{background:'var(--orange)',color:'#fff'}}>Get Started &rarr;</Link>
                    </div>
    
                    <div className="price-card">
                        <div className="price-zone">Zone C · Full-time Workers</div>
                        <div className="price-title">Tier 3 — Full-time<br/><small style={{fontSize:'.85rem',color:'var(--muted)'}}>41+ hrs/week</small></div>
                        <div className="price-amount">₹75–₹100<small>/week</small></div>
                        <div className="price-coverage">Coverage up to ₹8,400 per bad week</div>
                        <ul className="price-features" style={{marginTop:'16px'}}>
                        <li>Automatic disaster detection</li>
                        <li>UPI payout in 48–72 hours</li>
                        <li>No forms ever</li>
                        </ul>
                        <Link to="/signup" className="price-cta btn-navy">Get Started</Link>
                    </div>
                    </div>
            </div>
          )}

        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
