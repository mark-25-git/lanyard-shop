'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { generateOrderNumber } from '@/lib/pricing';

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || 'MAYBANK';
// BANK_ACCOUNT is validated server-side when needed
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '';
const BANK_ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'Teevent Enterprise';

interface CheckoutData {
  quantity: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  billing: any;
  shipping: any;
  design_file_url?: string | null; // Canva link if provided
  event_or_organization_name?: string | null; // Event/org name if provided
}

interface PaymentData {
  quantity: number;
  unit_price: number;
  total_price: number;
  checkoutData: CheckoutData;
}

export default function PaymentPage() {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      // Get checkout data from sessionStorage
      const checkoutDataStr = sessionStorage.getItem('checkoutData');
      if (!checkoutDataStr) {
        router.push('/customize');
        return;
      }

      const checkoutData: CheckoutData = JSON.parse(checkoutDataStr);
      
      // Validate quantity exists
      if (!checkoutData.quantity || checkoutData.quantity < 50) {
        router.push('/customize');
        return;
      }

      // SECURITY: Recalculate price server-side - never trust client-provided prices
      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: checkoutData.quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate price');
      }

      // Store validated server-calculated price
      setPaymentData({
        quantity: checkoutData.quantity,
        unit_price: data.data.unit_price,
        total_price: data.data.total_price,
        checkoutData,
      });

      // Generate order number for payment reference
      setOrderNumber(generateOrderNumber());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, message: string) => {
    try {
      // Safari-compatible clipboard copy
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers/Safari
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          // Fallback copy failed silently
        }
        document.body.removeChild(textArea);
      }
      
      setNotificationMessage(message);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } catch (err) {
      // Copy failed silently
      alert('Failed to copy. Please copy manually.');
    }
  };

  if (loading) {
    return (
      <div className="container section-padding">
        <div style={{ textAlign: 'center' }}>
          <div className="modern-spinner" style={{
            marginBottom: 'var(--space-4)',
            justifyContent: 'center'
          }}>
            <div className="modern-spinner-dot"></div>
            <div className="modern-spinner-dot"></div>
            <div className="modern-spinner-dot"></div>
          </div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section-padding">
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ color: '#dc2626', marginBottom: 'var(--space-4)' }}>{error}</p>
          <button
            onClick={() => router.push('/customize')}
            className="btn-primary"
          >
            Return to Customize
          </button>
        </div>
      </div>
    );
  }

  if (!BANK_ACCOUNT) {
    return (
      <div className="container section-padding">
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ color: '#dc2626', marginBottom: 'var(--space-4)' }}>
            Bank account information is not configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: 'var(--text-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-6)'
        }}>
          Checkout
        </h1>

        {/* Apple-style Payment Protection Guarantee */}
        <div style={{ 
          marginBottom: 'var(--space-10)',
          padding: 'var(--space-8) 0',
          textAlign: 'center'
        }}>
          <i className="bi bi-shield-fill-check" style={{
            fontSize: '32px',
            color: 'var(--text-bright-primary)',
            marginBottom: 'var(--space-3)',
            display: 'block'
          }}></i>
          <h2 style={{ 
            fontSize: '28px',
            fontWeight: '600',
            margin: '0 0 var(--space-3) 0',
            color: 'var(--text-bright-primary)',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            Your payment is protected.
          </h2>
          
          <p style={{ 
            fontSize: '17px',
            lineHeight: '1.47059',
            color: 'var(--text-bright-secondary)',
            margin: '0',
            maxWidth: '520px',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontWeight: '400'
          }}>
            If we determine your design cannot be produced, 
            you'll receive a full refund. No questions asked.
          </p>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ 
            fontSize: 'var(--text-2xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-6)'
          }}>
            Bank Transfer Details
          </h2>

          <div style={{ 
            background: 'var(--bg-bright-secondary)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-6)'
          }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ 
                color: 'var(--text-bright-tertiary)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-1)'
              }}>
                Bank Name
              </p>
              <p style={{ 
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {BANK_NAME}
              </p>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ 
                color: 'var(--text-bright-tertiary)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-1)'
              }}>
                Account Number
              </p>
              <p style={{ 
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                wordBreak: 'break-all',
                display: 'inline'
              }}>
                {BANK_ACCOUNT}
              </p>
              {' '}
              <button
                onClick={() => handleCopy(BANK_ACCOUNT, 'Account number copied.')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-primary)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline'
                }}
              >
                Copy
              </button>
            </div>

            <div>
              <p style={{ 
                color: 'var(--text-bright-tertiary)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-1)'
              }}>
                Account Name
              </p>
              <p style={{ 
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {BANK_ACCOUNT_NAME}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <p style={{ 
              color: 'var(--text-bright-tertiary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-2)'
            }}>
              Order Number (Include in payment reference)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <p style={{ 
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary)',
                letterSpacing: '0.05em',
                margin: 0
              }}>
                {orderNumber}
              </p>
              <button
                onClick={() => handleCopy(orderNumber, 'Order number copied.')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-primary)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-bold)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-gray-200)'
          }}>
            <span>Total Amount</span>
            <span style={{ color: 'var(--text-bright-primary)' }}>
              {formatCurrency(paymentData.total_price)}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
          <button
            onClick={async () => {
              if (!paymentData || !orderNumber) return;
              
              setSubmitting(true);
              
              try {
                // Create order in Supabase with the order number
                const response = await fetch('/api/create-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    quantity: paymentData.quantity,
                    unit_price: paymentData.unit_price,
                    total_price: paymentData.total_price,
                    order_number: orderNumber, // Use the pre-generated order number
                    customer_name: paymentData.checkoutData.customer_name,
                    customer_email: paymentData.checkoutData.customer_email,
                    customer_phone: paymentData.checkoutData.customer_phone,
                    billing: paymentData.checkoutData.billing,
                    shipping: paymentData.checkoutData.shipping,
                    design_file_url: paymentData.checkoutData.design_file_url || null, // Canva link if provided
                    event_or_organization_name: paymentData.checkoutData.event_or_organization_name || null, // Event/org name if provided
                  }),
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to create order');
                }

                // Clear session storage
                sessionStorage.removeItem('checkoutData');

                // Redirect to confirmation page
                router.push(`/confirmation?order_number=${encodeURIComponent(orderNumber)}`);
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to create order. Please try again.');
                setSubmitting(false);
              }
            }}
            disabled={submitting || !orderNumber}
            className="btn-primary"
            style={{
              width: '100%',
              padding: 'var(--space-4)',
              fontSize: 'var(--text-lg)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)'
            }}
          >
            {submitting ? (
              <div className="modern-spinner">
                <div className="modern-spinner-dot"></div>
                <div className="modern-spinner-dot"></div>
                <div className="modern-spinner-dot"></div>
              </div>
            ) : (
              "I've Made the Payment"
            )}
          </button>
          <p style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-bright-tertiary)',
            textAlign: 'center'
          }}>
            Clicking this button will submit your order.
          </p>
        </div>
      </div>

      {/* Floating notification */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          left: '50%',
          WebkitTransform: 'translateX(-50%)',
          transform: 'translateX(-50%)',
          background: 'var(--color-black)',
          color: 'var(--color-white)',
          padding: 'var(--space-3) var(--space-6)',
          borderRadius: '9999px',
          fontSize: 'var(--text-sm)',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          WebkitAnimation: 'slideUpFade 0.3s ease-out, fadeOut 0.3s ease-in 4.7s',
          animation: 'slideUpFade 0.3s ease-out, fadeOut 0.3s ease-in 4.7s',
          WebkitAnimationFillMode: 'forwards',
          animationFillMode: 'forwards'
        }}>
          {notificationMessage}
        </div>
      )}

      {/* Help Text */}
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
    </div>
  );
}

