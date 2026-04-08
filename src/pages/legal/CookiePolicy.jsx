const updated = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

export default function CookiePolicy() {
  return (
    <div className="legal-page">
      <h1>Cookie Policy</h1>
      <p className="legal-date">Last updated: {updated}</p>

      <p>
        This Cookie Policy explains how Sumit Thakur's portfolio website handles
        browser storage. We believe in transparency and keeping things simple.
      </p>

      <h2>Do We Use Cookies?</h2>
      <p>
        <strong>No.</strong> This website does not use any tracking cookies, advertising
        cookies, or third-party analytics cookies.
      </p>

      <h2>What We Do Store</h2>
      <ul>
        <li>
          <strong>cookie-accepted</strong> (localStorage, not a cookie) — A single
          key-value pair written to your browser's localStorage when you dismiss the
          cookie notice. It stores only "1" (a truthy flag) and contains no personal
          data. It persists until you clear your browser's site data.
        </li>
      </ul>

      <h2>Third-Party Scripts</h2>
      <ul>
        <li>
          <strong>Google Fonts</strong> — Fonts are loaded from Google's CDN. Google
          may store a short-lived cache cookie. We have no control over Google's
          cookies; consult{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google's Privacy Policy
          </a>{' '}
          for details.
        </li>
        <li>
          <strong>Vercel Analytics</strong> — Vercel's privacy-first analytics system
          does not set cookies and does not track individual users.
        </li>
      </ul>

      <h2>How to Clear Stored Data</h2>
      <p>
        To clear the localStorage flag, open your browser's developer tools (F12),
        go to Application → Local Storage → <code>this domain</code>, and delete the{' '}
        <code>cookie-accepted</code> key. The cookie notice will reappear on your next visit.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email{' '}
        <a href="mailto:sumitln2000@gmail.com">sumitln2000@gmail.com</a>.
      </p>
    </div>
  );
}
