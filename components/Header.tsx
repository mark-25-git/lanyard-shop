export default function Header() {
  return (
    <header className="header" itemScope itemType="https://schema.org/WPHeader">
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <a href="/" aria-label="Go to Teevent homepage">
          <img
            src="/images/teevent-logo.svg"
            alt="Teevent - Custom Event Merchandise Malaysia"
            className="logo"
            itemProp="logo"
          />
        </a>
      </nav>
    </header>
  );
}

