import HeroPreview from './HeroPreview';

export default function HeroSection() {
  return (
    <section className="hero lanyard-landing-hero landing-section section-padding" itemScope itemType="https://schema.org/WebPageElement">
      <div className="hero-content">
        <h1 className="hero-title fade-in" itemProp="headline">
          Built to save your time and effort.<br />
          Teevent is the best place to order custom lanyards.
        </h1>
        <div className="lanyard-landing-hero-preview-wrapper fade-in">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

