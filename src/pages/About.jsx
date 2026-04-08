import { AboutSection } from '../components/sections/AboutSection';
import { SkillsSection } from '../components/sections/SkillsSection';
import { CertificationsSection } from '../components/sections/CertificationsSection';
import { Footer } from '../components/layout/Footer';

export default function About() {
  return (
    <>
      <AboutSection />
      <SkillsSection />
      <CertificationsSection />
      <Footer />
    </>
  );
}
