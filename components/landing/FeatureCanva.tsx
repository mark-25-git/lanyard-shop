'use client';

import { useTranslation } from 'react-i18next';

export default function FeatureCanva() {
  const { t } = useTranslation();
  // Template URLs - Google Drive direct download links and Canva template
  const canvaTemplateUrl = process.env.NEXT_PUBLIC_CANVA_TEMPLATE_URL || 'https://www.canva.com/design/DAG587WOoLU/lop1q3BFx1sqp3N219pEDQ/view?utm_content=DAG587WOoLU&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview';
  
  // Google Drive direct download links
  const aiTemplateUrl = process.env.NEXT_PUBLIC_AI_TEMPLATE_URL || 'https://drive.google.com/uc?export=download&id=1VAaxqrVQgvx4lKlS2N36Nwzzw2eqEF4f';
  const psTemplateUrl = process.env.NEXT_PUBLIC_PS_TEMPLATE_URL || 'https://drive.google.com/uc?export=download&id=1Q4iny7yGrZkS0Ls4hM56WfM6PtmUtBOc';

  return (
    <div style={{ textAlign: 'left', width: '100%', height: '100%' }}>
      <div className="preview-content-scaler">
        <h2 style={{ 
            fontSize: 'var(--text-xl)', // One tier down from 2xl for feature preview
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)',
            textAlign: 'left'
        }}>
            {t('canvaPreview.title')}{' '}
            <span style={{ color: 'var(--text-bright-tertiary)' }}>
                {t('canvaPreview.subtitle')}
            </span>
        </h2>
        <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            
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
                >
                <img 
                    src="/images/upload/canva-icon.webp" 
                    alt="Canva Template" 
                    style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}



