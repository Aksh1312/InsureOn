import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <div className="footer-logo">Insure<span>On</span></div>
          <div className="footer-desc">The first automated gig worker insurance.<br />Protecting you against city-wide risks.</div>
        </div>
        <div className="footer-links">
          <h4>Policy</h4>
          <a href="#">Coverage Details</a>
          <a href="#">Exclusions</a>
          <a href="#">Claim Process</a>
        </div>
        <div className="footer-links">
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Contact</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; 2026 InsureOn. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
