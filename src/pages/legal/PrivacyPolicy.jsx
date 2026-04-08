import { Link } from 'react-router-dom';

const updated = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <p className="legal-date">Last updated: {updated}</p>

      <p>
        This is the personal portfolio of <strong>Sumit Thakur</strong>, a software engineer
        based in Mumbai, India. <br />Contact:{' '}
        <a href="mailto:sumitln2000@gmail.com">sumitln2000@gmail.com</a>
      </p>

      <h2>What Data We Collect</h2>
      <ul>
        <li>Contact form submissions — name, email address, and message text.</li>
        <li>
          Analytics data — page views and approximate location (fully anonymised,
          no personal identifiers stored).
        </li>
      </ul>

      <h2>How We Use It</h2>
      <ul>
        <li>
          Contact form submissions are transmitted to the site owner via the WhatsApp
          API (CallMeBot) for follow-up. They are not stored in any database.
        </li>
        <li>
          Analytics data is used solely to understand visitor behaviour and improve the
          site experience.
        </li>
      </ul>

      <h2>Third-Party Services</h2>
      <ul>
        <li>
          <strong>Vercel Analytics</strong> — privacy-first, GDPR-compliant analytics.
          No cookies are set or personal data stored.
        </li>
        <li>
          <strong>CallMeBot / WhatsApp API</strong> — used only to relay contact form
          messages to the site owner's personal number. Messages are not retained by
          this service beyond delivery.
        </li>
        <li>
          <strong>Google Fonts</strong> — fonts are loaded from Google's CDN. Google
          may log IP addresses in accordance with their own privacy policy.
        </li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        Form submissions are not stored in any database on this site.
        Vercel Analytics retains anonymised data for up to 90 days, per Vercel's policy.
      </p>

      <h2>Your Rights (GDPR / India IT Act 2000)</h2>
      <p>
        You have the right to request access to, correction of, or deletion of any
        personal data we may hold. To exercise these rights, email{' '}
        <a href="mailto:sumitln2000@gmail.com">sumitln2000@gmail.com</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        This site uses no tracking or advertising cookies. A single non-tracking
        localStorage entry (<code>cookie-accepted</code>) is written when you dismiss
        the cookie notice. See our{' '}
        <Link to="/cookie-policy">Cookie Policy</Link> for details.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. The "Last updated" date above
        will reflect any changes. Continued use of the site constitutes acceptance of
        the updated policy.
      </p>
    </div>
  );
}
