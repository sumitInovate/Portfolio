const updated = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

export default function TermsOfUse() {
  return (
    <div className="legal-page">
      <h1>Terms of Use</h1>
      <p className="legal-date">Last updated: {updated}</p>

      <p>
        Welcome to the personal portfolio of <strong>Sumit Thakur</strong>. By accessing
        or using this website, you agree to be bound by these Terms of Use. If you do not
        agree, please discontinue use of the site immediately.
      </p>

      <h2>1. Purpose</h2>
      <p>
        This website is a personal portfolio for informational purposes only. It showcases
        the professional experience, projects, and skills of Sumit Thakur.
      </p>

      <h2>2. Intellectual Property</h2>
      <ul>
        <li>
          All original content on this site — including text, layout, design, and custom
          code — is the intellectual property of Sumit Thakur, © {new Date().getFullYear()}.
        </li>
        <li>
          You may not reproduce, scrape, redistribute, or repurpose any content without
          prior written permission.
        </li>
        <li>
          3D models are procedurally generated using Three.js and are original works.
        </li>
        <li>
          Fonts are sourced from Google Fonts under the Open Font License (OFL).
          Icons are from Lucide React under the ISC License.
        </li>
      </ul>

      <h2>3. Contact Form</h2>
      <p>
        By submitting the contact form, you confirm that the information provided is
        accurate and that you consent to your message being delivered to the site owner
        via the WhatsApp API. Do not submit sensitive personal data (e.g., financial
        information, passwords) through the contact form.
      </p>

      <h2>4. No Warranties</h2>
      <p>
        This website is provided "as is" without any warranties, express or implied,
        including but not limited to merchantability, fitness for a particular purpose,
        or non-infringement. The site owner makes no guarantee of uptime or availability.
      </p>

      <h2>5. Limitation of Liability</h2>
      <p>
        The site owner shall not be liable for any direct, indirect, incidental, or
        consequential damages arising from the use of, or inability to use, this website
        or its content.
      </p>

      <h2>6. External Links</h2>
      <p>
        This site may contain links to third-party websites. These are provided for
        convenience only. The site owner is not responsible for the content, privacy
        practices, or accuracy of any linked external websites.
      </p>

      <h2>7. Governing Law</h2>
      <p>
        These Terms of Use are governed by the laws of India. Any disputes shall be
        subject to the jurisdiction of courts in Mumbai, Maharashtra.
      </p>

      <h2>8. Changes</h2>
      <p>
        These terms may be updated at any time. Continued use of the site following
        any changes constitutes acceptance of the revised terms.
      </p>

      <p>
        Questions? Contact: <a href="mailto:sumitln2000@gmail.com">sumitln2000@gmail.com</a>
      </p>
    </div>
  );
}
