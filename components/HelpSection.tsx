export default function HelpSection() {
  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: 'var(--space-10)',
      paddingTop: 'var(--space-6)',
      borderTop: '1px solid var(--color-gray-200)'
    }}>
      <p style={{ 
        fontSize: 'var(--text-base)',
        color: 'var(--text-bright-secondary)',
        margin: 0
      }}>
        Need more help?{' '}
        <a
          href="https://wa.me/60137482481?text=Hi%20Teevent!%20I%20need%20help%20with%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'underline'
          }}
        >
          Contact us
        </a>
        .
      </p>
    </div>
  );
}

