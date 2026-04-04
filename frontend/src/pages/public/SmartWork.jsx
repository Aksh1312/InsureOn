import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';
import { Clock, Trophy, Moon, Zap, AlertTriangle, CloudRain, Map } from 'lucide-react';

const SmartWork = () => {
  const [activeTab, setActiveTab] = useState('parttime');

  return (
    <div id="public-site">
      <PublicNavbar />
      
      <div id="pub-smartwork" className="active">
        <section className="sw-hero">
          <div className="sw-hero-kicker"><span></span>Free with every plan</div>
          <h1 style={{fontSize:'clamp(2.2rem,5vw,3.4rem)',fontWeight:800,color:'#fff',lineHeight:1.1,marginBottom:'18px',maxWidth:'620px'}}>
            Don't just <em style={{color:'#81C784',fontStyle:'normal'}}>protect</em> your money.<br/>
            <em style={{color:'var(--orange)',fontStyle:'normal'}}>Grow</em> it every week.
          </h1>
          <p style={{fontSize:'1.05rem',color:'rgba(255,255,255,.7)',maxWidth:'520px',lineHeight:1.7,marginBottom:'28px'}}>SmartWork gives every InsureOn member personalised weekly tips - best time to work, best zones in your city, when to avoid going out. Zero effort. Delivered every Monday.</p>
          <div style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
            <Link to="/signup" className="btn btn-primary">Get SmartWork Free &rarr;</Link>
            <Link to="/pricing" className="btn btn-outline">See plans</Link>
          </div>
        </section>

        <section className="pub-section gray">
          <div className="section-tag">Sample Tips</div>
          <h2 className="section-title">See what your Monday tips look like</h2>
          <p className="section-sub">Tips are personalised based on whether you work part-time or full-time. Here is a real example for each type of worker.</p>

          <div className="sw-tabs">
            <button className={`sw-tab ${activeTab === 'parttime' ? 'active' : ''}`} onClick={() => setActiveTab('parttime')}>
              <Clock size={14} style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}} />
              Part-time Worker (Sandeep)
            </button>
            <button className={`sw-tab ${activeTab === 'fulltime' ? 'active' : ''}`} onClick={() => setActiveTab('fulltime')}>
              <Trophy size={14} style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}} />
              Full-time Worker (Sriram)
            </button>
          </div>

          <div className="sw-tab-content active">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',alignItems:'stretch'}}>
                <div className="week-sample" style={{height:'100%'}}>
                    <div className="ws-header">
                        <div className="ws-header-left">
                            <span>SmartWork Tips - This Week</span>
                            <small>Sent Monday 8:00 AM</small>
                        </div>
                    </div>
                    <div className="ws-body">
                        {activeTab === 'parttime' ? (
                            <>
                            <div className="ws-tip" style={{background:'var(--green-light)'}}>
                                <div className="ws-tip-icon" style={{background:'var(--green2)'}}><Moon size={16} color="#fff" /></div>
                                <div>
                                    <div className="ws-tip-title" style={{color:'var(--green)'}}>Best Time: Weekday evenings 7–9 PM</div>
                                    <div className="ws-tip-body">Dinner rush - highest order density.</div>
                                </div>
                            </div>
                            <div className="ws-tip" style={{background:'var(--red-light)'}}>
                                <div className="ws-tip-icon" style={{background:'var(--red2)'}}><CloudRain size={16} color="#fff" /></div>
                                <div>
                                    <div className="ws-tip-title" style={{color:'var(--red2)'}}>⚠ Stay home Wednesday - City alert</div>
                                    <div className="ws-tip-body">IMD alert active. Roads not safe. Your cover is watching earnings.</div>
                                </div>
                            </div>
                            </>
                        ) : (
                            <>
                            <div className="ws-tip" style={{background:'var(--blue-light)'}}>
                                <div className="ws-tip-icon" style={{background:'var(--blue2)'}}><Map size={16} color="#fff" /></div>
                                <div>
                                    <div className="ws-tip-title" style={{color:'var(--blue)'}}>Zone rotation: Office → Residential</div>
                                    <div className="ws-tip-body">Weekdays: office zones for lunch. Evenings: residential for dinner.</div>
                                </div>
                            </div>
                            <div className="ws-tip" style={{background:'var(--orange-pale)'}}>
                                <div className="ws-tip-icon" style={{background:'var(--orange)'}}><Zap size={16} color="#fff" /></div>
                                <div>
                                    <div className="ws-tip-title" style={{color:'var(--orange)'}}>Shift structure: Late morning + Evening</div>
                                    <div className="ws-tip-body">Split shifts recommended. Avoid mid-afternoon.</div>
                                </div>
                            </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SmartWork;
