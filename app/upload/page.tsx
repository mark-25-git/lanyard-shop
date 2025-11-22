'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateDownload from '@/components/TemplateDownload';
import DesignUpload from '@/components/DesignUpload';

export default function UploadPage() {
  const router = useRouter();
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [priceData, setPriceData] = useState<{
    unitPrice: number;
    totalPrice: number;
  } | null>(null);

  useEffect(() => {
    // Get data from sessionStorage
    const storedQuantity = sessionStorage.getItem('orderQuantity');
    const storedUnitPrice = sessionStorage.getItem('orderUnitPrice');
    const storedTotalPrice = sessionStorage.getItem('orderTotalPrice');
    const storedDesignUrl = sessionStorage.getItem('orderDesignUrl');

    if (!storedQuantity || !storedUnitPrice || !storedTotalPrice) {
      router.push('/customize');
      return;
    }

    setQuantity(parseInt(storedQuantity, 10));
    setPriceData({
      unitPrice: parseFloat(storedUnitPrice),
      totalPrice: parseFloat(storedTotalPrice),
    });

    // If design was already uploaded, set it
    if (storedDesignUrl) {
      setDesignUrl(storedDesignUrl);
    }
  }, [router]);

  const handleUploadComplete = (url: string) => {
    setDesignUrl(url);
    sessionStorage.setItem('orderDesignUrl', url);
    // Auto-navigate to checkout after successful upload
    setTimeout(() => {
      router.push('/checkout');
    }, 500); // Small delay to show success state
  };

  if (!quantity || !priceData) {
    return null; // Will redirect
  }

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: 'var(--text-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-6)'
        }}>
          Upload your design.
        </h1>

        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ 
              fontSize: 'var(--text-2xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)'
            }}>
              Design Template
            </h2>
            <TemplateDownload />
          </div>

          <div style={{ marginTop: 'var(--space-8)' }}>
            <h2 style={{ 
              fontSize: 'var(--text-2xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)'
            }}>
              Upload Design File
            </h2>
            <DesignUpload
              onUploadComplete={handleUploadComplete}
              initialUrl={designUrl || sessionStorage.getItem('orderDesignUrl')}
            />
          </div>

          {designUrl && (
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
              <p style={{ 
                color: 'var(--text-bright-secondary)',
                marginBottom: 'var(--space-4)'
              }}>
                Design uploaded successfully!
              </p>
              <button
                onClick={() => router.push('/checkout')}
                className="btn-primary"
                style={{ 
                  width: '100%',
                  padding: 'var(--space-4)',
                  fontSize: 'var(--text-lg)'
                }}
              >
                Continue to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

