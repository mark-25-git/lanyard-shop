'use client';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-links">
            <a
              href="https://www.instagram.com/team_teevent/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Instagram
            </a>
            <a
              href="mailto:team.teevent@gmail.com"
              className="footer-link"
              id="emailLink"
            >
              Email
            </a>
            <a
              href="https://wa.me/60137482481"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              WhatsApp
            </a>
          </div>
          <div className="footer-center">
            <div className="footer-logo">
              <img
                src="/images/landing/teevent.svg"
                alt="Teevent - Custom Event Merchandise Malaysia"
                className="footer-logo-image"
              />
            </div>
            <div className="footer-company-info">
              <p>Teevent Enterprise (202503285823)</p>
            </div>
          </div>
        </div>
        <div className="footer-copyright">
          <p>© 2025 Teevent Enterprise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


