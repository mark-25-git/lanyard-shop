export default function Header() {
  // Link to main site homepage
  const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://teevent.my';
  
  return (
    <header className="header" itemScope itemType="https://schema.org/WPHeader">
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <a href={mainSiteUrl} aria-label="Go to Teevent homepage">
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

