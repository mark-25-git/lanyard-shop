export default function StructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teevent.my';
  const logoUrl = `${siteUrl}/images/landing/teevent.svg`;

  // Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Teevent',
    url: siteUrl,
    logo: logoUrl,
    description: 'Built to save your time and effort. Teevent is the best place to order custom lanyards.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+60-13-748-2481',
      contactType: 'Customer Service',
      areaServed: 'MY',
      availableLanguage: 'en',
    },
    sameAs: [
      'https://www.instagram.com/team_teevent/',
      'https://www.facebook.com/people/Teevent/61577531619434/',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MY',
      addressRegion: 'Malaysia',
    },
  };

  // Service Schema (Lanyard Ordering Service)
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Custom Lanyard Ordering Service',
    description: 'Order custom lanyards online with instant pricing. No sign-up needed.',
    provider: {
      '@type': 'Organization',
      name: 'Teevent',
      url: siteUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Malaysia',
    },
    serviceType: 'Custom Lanyard Manufacturing and Printing',
  };

  // WebSite Schema with SearchAction
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Teevent',
    url: siteUrl,
    description: 'The best place to order custom lanyards.',
    publisher: {
      '@type': 'Organization',
      name: 'Teevent',
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

