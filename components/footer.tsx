"use client";

import Link from "next/link";
import MainImage from "@/public/MainLogoLearn.png";
import Image from "next/image";

export default function Footer() {
  return (
    <>
      <style>{`
        .footer { background: #1d4ed8; color: rgba(255,255,255,0.75); font-size: 14px; }
        .footer-main {
          max-width: 1100px; margin: 0 auto; padding: 52px 36px 40px;
          display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 40px;
        }
        .brand-logo {
          display: flex; align-items: center; gap: 8px;
          font-size: 17px; font-weight: 600; color: #fff;
          margin-bottom: 14px; text-decoration: none;
        }
        .brand-logo-icon {
          width: 28px; height: 28px; background: rgba(255,255,255,0.18);
          border-radius: 7px; display: flex; align-items: center;
          justify-content: center; font-size: 14px; font-weight: 700;
        }
        .brand-desc {
          font-size: 13.5px; color: rgba(255,255,255,0.6);
          line-height: 1.65; max-width: 230px; margin-bottom: 22px;
        }
        .newsletter-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 8px; letter-spacing: 0.3px; }
        .newsletter-wrap { display: flex; max-width: 230px; margin-bottom: 18px; }
        .newsletter-input {
          flex: 1; padding: 8px 12px; font-size: 13px;
          background: rgba(255,255,255,0.1); border: 0.5px solid rgba(255,255,255,0.2);
          border-right: none; border-radius: 8px 0 0 8px; color: #fff; outline: none;
          transition: background 0.15s;
        }
        .newsletter-input::placeholder { color: rgba(255,255,255,0.35); }
        .newsletter-input:focus { background: rgba(255,255,255,0.15); }
        .newsletter-btn {
          padding: 8px 14px; background: rgba(255,255,255,0.18);
          border: 0.5px solid rgba(255,255,255,0.2); border-radius: 0 8px 8px 0;
          color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .newsletter-btn:hover { background: rgba(255,255,255,0.26); }
        .social-row { display: flex; gap: 8px; }
        .social-btn {
          width: 34px; height: 34px; border-radius: 8px;
          background: rgba(255,255,255,0.1); border: 0.5px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.75); font-size: 17px; cursor: pointer;
          transition: background 0.15s, color 0.15s; text-decoration: none;
        }
        .social-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }
        .col-heading {
          font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
          text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 14px;
        }
        .link-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .link-list li a {
          font-size: 13.5px; color: rgba(255,255,255,0.7); text-decoration: none;
          transition: color 0.15s; display: inline-flex; align-items: center; gap: 5px;
        }
        .link-list li a:hover { color: #fff; }
        .footer-divider {
          max-width: 1100px; margin: 0 auto;
          border: none; border-top: 0.5px solid rgba(255,255,255,0.12);
        }
        .footer-bottom {
          max-width: 1100px; margin: 0 auto; padding: 18px 36px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .footer-copy { font-size: 12.5px; color: rgba(255,255,255,0.45); }
        .footer-legal { display: flex; gap: 20px; }
        .footer-legal a {
          font-size: 12.5px; color: rgba(255,255,255,0.45);
          text-decoration: none; transition: color 0.15s;
        }
        .footer-legal a:hover { color: rgba(255,255,255,0.8); }
        .hiring-badge {
          font-size: 11px; background: rgba(255,255,255,0.15);
          color: #fff; padding: 1px 7px; border-radius: 20px; vertical-align: middle;
        }
        @media (max-width: 768px) {
          .footer-main { grid-template-columns: 1fr 1fr; gap: 28px; }
          .brand-col { grid-column: 1 / -1; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .footer-main { grid-template-columns: 1fr; padding: 36px 20px 28px; }
          .footer-bottom { padding: 16px 20px; }
        }
      `}</style>

      <footer className="footer">
        <div className="footer-main">

          {/* Brand column */}
          <div className="brand-col">
            <Link href="/" className="brand-logo">
              <Image src={MainImage} alt="Logo" width={140} height={150} />
            </Link>
            <p className="brand-desc">
              Empowering Sri Lankan learners and educators through quality online courses, skill development, and career-focused learning opportunities.
            </p>

            <p className="newsletter-label">Stay in the loop</p>
            <div className="newsletter-wrap">
              <input className="newsletter-input" type="email" placeholder="your@email.com" />
              <button className="newsletter-btn">Subscribe</button>
            </div>

            <div className="social-row">
              <a className="social-btn" href="#" aria-label="Twitter / X">𝕏</a>
              <a className="social-btn" href="#" aria-label="LinkedIn">in</a>
              <a className="social-btn" href="#" aria-label="YouTube">▶</a>
              <a className="social-btn" href="#" aria-label="Instagram">◎</a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="col-heading">Platform</p>
            <ul className="link-list">
              <li><Link href="/menu">Courses</Link></li>
              <li><Link href="#">Live sessions</Link></li>
              <li><Link href="#">Certificates</Link></li>
              <li><Link href="#">Analytics</Link></li>
              <li><Link href="#">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="col-heading">Company</p>
            <ul className="link-list">
              <li><Link href="/about">About us</Link></li>
              <li><Link href="#">Blog</Link></li>
              <li>
                <Link href="#">
                  Careers <span className="hiring-badge">Hiring</span>
                </Link>
              </li>
              <li><Link href="#">Press kit</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="col-heading">Support</p>
            <ul className="link-list">
              <li><Link href="#">Help centre</Link></li>
              <li><Link href="#">Community</Link></li>
              <li><Link href="/location">Hours &amp; location</Link></li>
              <li><Link href="#">Documentation</Link></li>
              <li><Link href="#">Status</Link></li>
            </ul>
          </div>

        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <span className="footer-copy">
            &copy; {new Date().getFullYear()} Sell It Pro. All rights reserved.
          </span>
          <nav className="footer-legal" aria-label="Legal links">
            <Link href="#">Privacy policy</Link>
            <Link href="#">Terms of service</Link>
            <Link href="#">Cookie settings</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}