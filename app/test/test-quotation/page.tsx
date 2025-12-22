'use client';

import { useState, useEffect } from 'react';
import { QuotationData } from '@/components/QuotationPDF';

// Mock quotation data for testing
const mockQuotation: QuotationData = {
  quotationNumber: 'QUO-251124H69YSR',
  quotationDate: new Date().toISOString(),
  contactName: 'John Doe',
  email: 'john@example.com',
  companyName: 'Elite Expo Sdn Bhd',
  quantity: 100,
  unitPrice: 2.50,
  totalPrice: 250.00,
};

const mockBankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '501413889262';

// Convert image to base64 data URI
async function imageToDataUri(imagePath: string): Promise<string> {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to data URI:', error);
    return ''; // Return empty string if image can't be loaded
  }
}

export default function TestQuotationPage() {
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [logoDataUri, setLogoDataUri] = useState<string>('');

  // Block in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      window.location.href = '/404';
      return;
    }
  }, []);

  // Load logo on component mount
  useEffect(() => {
    // Skip in production
    if (process.env.NODE_ENV === 'production') return;
    const loadLogo = async () => {
      const logoUri = await imageToDataUri('/images/teevent-logo.png');
      setLogoDataUri(logoUri);
    };
    loadLogo();
  }, []);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      // Call API route to generate PDF
      const response = await fetch('/api/test-quotation-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation: mockQuotation,
          logoDataUri: logoDataUri || '',
          bankAccount: mockBankAccount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get PDF blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Quotation PDF Preview</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={generatePDF}
          disabled={generating}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? 'Generating PDF...' : 'Generate & Preview PDF'}
        </button>
      </div>

      {pdfUrl && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <a
              href={pdfUrl}
              download="test-quotation.pdf"
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block',
                marginRight: '10px',
              }}
            >
              Download PDF
            </a>
            <button
              onClick={() => {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Clear Preview
            </button>
          </div>
          
          <iframe
            src={pdfUrl}
            width="100%"
            height="800px"
            style={{ border: '1px solid #ccc', borderRadius: '5px' }}
            title="PDF Preview"
          />
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>Mock Quotation Data:</h2>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(mockQuotation, null, 2)}
        </pre>
      </div>
    </div>
  );
}


