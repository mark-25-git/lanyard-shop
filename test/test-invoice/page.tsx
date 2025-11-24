'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/types/order';

// Mock order data for testing
// Using fixed dates to avoid hydration errors
const mockOrder: Order = {
  id: 'test-123',
  order_number: 'INV-251124H69YSR',
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '+60 12-345 6789',
  event_or_organization_name: 'Tech Conference 2024',
  billing_address_line1: '123 Main Street',
  billing_address_line2: 'Suite 100',
  billing_city: 'Kuala Lumpur',
  billing_state: 'Selangor',
  billing_postal_code: '50000',
  billing_country: 'Malaysia',
  quantity: 100,
  unit_price: 2.50,
  total_price: 250.00,
  status: 'paid',
  payment_method: 'Bank Transfer',
  payment_reference: 'REF123456',
  created_at: '2024-11-24T10:00:00.000Z',
  updated_at: '2024-11-24T10:00:00.000Z',
};

const mockBankAccount = '501413889262';

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

export default function TestInvoicePage() {
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
      const response = await fetch('/api/test-invoice-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: mockOrder,
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
      <h1 style={{ marginBottom: '20px' }}>Invoice PDF Preview</h1>
      
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
              download="test-invoice.pdf"
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
        <h2>Mock Order Data:</h2>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(mockOrder, null, 2)}
        </pre>
      </div>
    </div>
  );
}

