import HeroPreview from './HeroPreview';

export default function HeroSection() {
  return (
    <section className="hero lanyard-landing-hero landing-section section-padding" itemScope itemType="https://schema.org/WebPageElement">
      <div className="hero-content">
        <h1 className="hero-title fade-in" itemProp="headline">
          Built to save your time and effort.<br />
          Teevent is the best place to order custom lanyard.
        </h1>
      </div>
      <div className="lanyard-landing-hero-image fade-in">
        <div className="feature-image-wrapper feature-preview-wrapper">
          <img 
            src="/images/landing/lanyard-landing-hero-bg.webp" 
            alt="Custom lanyard product showcase" 
            className="feature-image"
          />
          <div className="white-card-overlay">
            <HeroPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

