import { Link } from 'react-router-dom';
import { GitFork, Link2, Mail } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export function Footer() {
  const year = new Date().getFullYear();
  const { userData } = useUser();
  const contact = userData?.contact ?? {};
  const github = userData?.github ?? {};
  const meta = userData?.meta ?? {};

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="footer-inner">
        <div>
          <p className="footer-copy">
            © {year} {meta.displayName ?? 'CodeAether'}. Powered by{' '}
            <a href="https://codeaether.vercel.com" style={{ color: 'var(--color-system-400)' }}>CodeAether</a>
            .<br />
            Fonts: Google Fonts (OFL) · Icons: Lucide React (ISC)
          </p>
          <div className="footer-social">
            {github.username && (
              <a
                className="social-link"
                href={`https://github.com/${github.username}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
              >
                <GitFork size={14} />
              </a>
            )}
            {contact.linkedin && (
              <a
                className="social-link"
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
              >
                <Link2 size={14} />
              </a>
            )}
            {contact.email && (
              <a
                className="social-link"
                href={`mailto:${contact.email}`}
                aria-label="Send email"
              >
                <Mail size={14} />
              </a>
            )}
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
