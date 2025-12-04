export default function TestimonialsSection() {
  return (
    <section className="landing-section section-padding testimonials-section">
      <div className="container">
        <h2 className="hero-title testimonials-title fade-in">
          The new way to make custom lanyard.
        </h2>
        <div className="testimonials-grid-landing">
          {/* Testimonial Card 1 - The Professional */}
          <div className="landing-card testimonial-card-landing fade-in">
            <div className="testimonial-content">
              <p className="testimonial-text">
                I find Teevent fast, accurate, and very trustworthy.
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-info">
                <p className="author-details">
                  <span className="author-name">Camy</span>
                  Organizer, The Santa Village Event, UTAR
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial Card 2 - The Student / Gen Z */}
          <div className="landing-card testimonial-card-landing fade-in">
            <div className="testimonial-content">
              <p className="testimonial-text">
                As an introvert, I like it better than the old way! The Teevent website has every information I need... I don't have to ask and wait for the answer. Truly time-efficient and introvert-friendly.
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-info">
                <p className="author-details">
                  <span className="author-name">Tong</span>
                  Student, CSMU
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

