'use client';

export default function TemplateDownload() {
  // Template URLs - Google Drive direct download links and Canva template
  const canvaTemplateUrl = process.env.NEXT_PUBLIC_CANVA_TEMPLATE_URL || 'https://www.canva.com/design/DAG587WOoLU/lop1q3BFx1sqp3N219pEDQ/view?utm_content=DAG587WOoLU&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview';
  
  // Google Drive direct download links
  // AI file: 1VAaxqrVQgvx4lKlS2N36Nwzzw2eqEF4f
  // PS file: 1Q4iny7yGrZkS0Ls4hM56WfM6PtmUtBOc
  const aiTemplateUrl = process.env.NEXT_PUBLIC_AI_TEMPLATE_URL || 'https://drive.google.com/uc?export=download&id=1VAaxqrVQgvx4lKlS2N36Nwzzw2eqEF4f';
  const psTemplateUrl = process.env.NEXT_PUBLIC_PS_TEMPLATE_URL || 'https://drive.google.com/uc?export=download&id=1Q4iny7yGrZkS0Ls4hM56WfM6PtmUtBOc';

  return (
    <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
      <p style={{ 
        color: 'var(--text-bright-secondary)',
        marginBottom: 'var(--space-4)',
        fontSize: 'var(--text-base)',
        lineHeight: '1.5'
      }}>
        Download whichever file format you're familiar with.
      </p>
      
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 'var(--space-12)',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <a
          href={canvaTemplateUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            border: '1px solid var(--color-gray-300)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            transition: 'all var(--transition-base)',
            background: 'var(--bg-bright-card)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 122, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-gray-300)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <img 
            src="/images/upload/canva-icon.webp" 
            alt="Canva Template" 
            style={{ width: '64px', height: '64px', objectFit: 'cover' }}
          />
        </a>
        <a
          href={psTemplateUrl}
          download
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            border: '1px solid var(--color-gray-300)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            transition: 'all var(--transition-base)',
            background: 'var(--bg-bright-card)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 122, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-gray-300)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <img 
            src="/images/upload/photoshop-icon.webp" 
            alt="Download PS File" 
            style={{ width: '64px', height: '64px', objectFit: 'cover' }}
          />
        </a>
        <a
          href={aiTemplateUrl}
          download
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            border: '1px solid var(--color-gray-300)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            transition: 'all var(--transition-base)',
            background: 'var(--bg-bright-card)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 122, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-gray-300)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <img 
            src="/images/upload/illustrator-icon.webp" 
            alt="Download AI File" 
            style={{ width: '64px', height: '64px', objectFit: 'cover' }}
          />
        </a>
      </div>
    </div>
  );
}


