import { RevealOnScroll } from '../ui/RevealOnScroll';
import { useUser }        from '../../context/UserContext';

export function CertificationsSection() {
  const { userData } = useUser();
  const certs = userData?.certifications ?? [];

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
