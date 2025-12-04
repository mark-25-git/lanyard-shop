'use client';

export default function SampleAssuranceSection() {
  const whatsappUrl =
    'https://wa.me/60137482481?text=Please%20enter%20your%20details%20for%20free%20lanyard%20sample%20delivery.%0ARecipient%20Name:%0APhone%20Number:%0AAddress:';

  return (
    <section
      className="landing-section section-padding simplicity-section sample-assurance-section"
      aria-labelledby="sample-assurance-title"
    >
      <div className="container">
        <div className="simplicity-content">
          <h2
            id="sample-assurance-title"
            className="hero-title simplicity-title fade-in"
          >
            Try it in your hands first.
          </h2>
          <p className="simplicity-subtitle fade-in">
            Want to be sure?<br />
            We send you a lanyard sample. Free.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary simplicity-read-more fade-in"
          >
            Get Free Sample
          </a>
        </div>
      </div>
    </section>
  );
}


