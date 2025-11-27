import Link from 'next/link';

export default function Home() {
  return (
    <div className="container section-padding">
      <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="page-title" style={{ 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-6)'
        }}>
          Custom Lanyard Ordering
        </h1>
        <p style={{ 
          fontSize: 'var(--text-lg)', 
          color: 'var(--text-bright-secondary)',
          marginBottom: 'var(--space-8)'
        }}>
          Order high-quality custom lanyards with 2cm width, 2-sided color printing, and single lobster hook.
        </p>
        <Link href="/customize" className="btn-primary">
          Start Your Order
        </Link>
      </div>
    </div>
  );
}











