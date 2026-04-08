import { RevealOnScroll } from '../ui/RevealOnScroll';

const certs = [
  {
    variant: 'gold',
    type: '[CERTIFICATION]',
    title: 'Google Cloud Associate Cloud Engineer',
    year: '2024',
  },
  {
    variant: 'purple',
    type: '[TITLE EARNED]',
    title: 'Spotlight Award — Bringing Innovation',
    year: 'Ingram Micro · 2023',
  },
  {
    variant: 'purple',
    type: '[TITLE EARNED]',
    title: 'Spotlight Award — Driving Results',
    year: 'Ingram Micro · 2024',
  },
  {
    variant: 'gold',
    type: '[EDUCATION]',
    title: 'B.E. in Information Technology',
    year: 'VPP College of Engineering, Mumbai · 2022',
  },
];

export function CertificationsSection() {
  return (
    <section id="certifications" className="section" style={{ background: 'var(--color-abyss)' }}>
      <div className="container">
        <RevealOnScroll>
          <h2 className="section-heading">TITLES EARNED</h2>
        </RevealOnScroll>

        <div className="certs-grid">
          {certs.map((c, idx) => (
            <RevealOnScroll key={c.title} delay={idx * 0.1}>
              <div className={`cert-badge ${c.variant}`}>
                <div className="cert-badge-shimmer" />
                <p className="cert-label">{c.type}</p>
                <h3 className="cert-title">{c.title}</h3>
                <p className="cert-year">{c.year}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
