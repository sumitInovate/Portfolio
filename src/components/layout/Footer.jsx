import { Link } from 'react-router-dom';
import { GitFork, Link2, Mail } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="footer-inner">
        <div>
          <p className="footer-copy">
            © {year} Sumit Thakur. Designed &amp; built by the hunter himself.
            <br />
            Fonts: Google Fonts (OFL) · Icons: Lucide React (ISC)
            <br />
            3D: Procedurally generated with Three.js
          </p>
          <div className="footer-social">
            <a
              className="social-link"
              href="https://github.com/S-Techofficial"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
            >
              <GitFork size={14} />
            </a>
            <a
              className="social-link"
              href="https://linkedin.com/in/itsmesumit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
            >
              <Link2 size={14} />
            </a>
            <a
              className="social-link"
              href="mailto:sumitln2000@gmail.com"
              aria-label="Send email"
            >
              <Mail size={14} />
            </a>
          </div>
        </div>

        <div className="footer-links" aria-label="Legal links">
          <Link to="/privacy-policy" className="footer-link">PRIVACY POLICY</Link>
          <Link to="/terms-of-use" className="footer-link">TERMS OF USE</Link>
          <Link to="/cookie-policy" className="footer-link">COOKIE POLICY</Link>
        </div>
      </div>
    </footer>
  );
}
