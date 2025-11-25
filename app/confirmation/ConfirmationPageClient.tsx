'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types/order';
import HelpSection from '@/components/HelpSection';

export default function ConfirmationPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('order_number') || searchParams.get('orderNumber');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    if (orderNumberParam) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderNumberParam]);

  const fetchOrder = async () => {
    if (!orderNumberParam) return;
    
    try {
      const response = await fetch(`/api/get-order?order_number=${encodeURIComponent(orderNumberParam)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      setOrder(data.data);
    } catch (err) {
      // Failed to fetch order
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
          <p style={{ color: 'var(--text-bright-secondary)' }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container section-padding">
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-bright-secondary)' }}>Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Success Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <i className="bi bi-check-circle-fill" style={{
            fontSize: 'var(--text-6xl)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-4)',
            display: 'block'
          }}></i>
          <h1 style={{ 
            fontSize: 'var(--text-4xl)', 
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-4)'
          }}>
            Order Confirmed!
          </h1>
          <p style={{ 
            fontSize: 'var(--text-lg)',
            color: 'var(--text-bright-secondary)',
            marginBottom: 'var(--space-4)'
          }}>
            We've received your order.
          </p>
        </div>

        {/* Payment Verification Status */}
        <div style={{ 
          background: 'var(--bg-bright-secondary)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          <i className="bi bi-clock-history" style={{
            fontSize: 'var(--text-3xl)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-3)',
            display: 'block'
          }}></i>
          <p style={{ 
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-bright-primary)',
            marginBottom: 'var(--space-2)'
          }}>
            Verifying Payment
          </p>
          <p style={{ 
            fontSize: 'var(--text-base)',
            color: 'var(--text-bright-secondary)',
            margin: 0,
            lineHeight: '1.6'
          }}>
            We're matching your payment with Order Number <strong>{order.order_number}</strong>. Verification typically takes 1–2 business hours. You'll be notified once your payment is confirmed.
          </p>
        </div>

        {/* Primary Next Step: Design Submission */}
        <div style={{ marginTop: 'var(--space-16)', marginBottom: 'var(--space-16)' }}>
          <h3 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)',
            textAlign: 'center'
          }}>
            Next: Send Your Design File
          </h3>
          <a
            href={`https://wa.me/60137482481?text=Hi%20Teevent!%20My%20order%20number%20is%20${encodeURIComponent(order.order_number)}.%20I%20have%20completed%20payment%20and%20would%20like%20to%20send%20my%20design%20file.`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ 
              display: 'block',
              width: '100%',
              textDecoration: 'none',
              textAlign: 'center',
              padding: 'var(--space-4)',
              fontSize: 'var(--text-lg)',
              borderRadius: '9999px'
            }}
          >
            Send Design File via WhatsApp
          </a>
          <p style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-bright-secondary)',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            Sending your design now ensures the fastest production timeline.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)'
          }}>
            Order Details
          </h2>
          
          {/* Order Number - Most Prominent */}
          <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-gray-200)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-2)' }}>
              Order Number
            </p>
            <p style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 'var(--font-weight-bold)', 
              color: 'var(--text-bright-primary)', 
              margin: 0,
              letterSpacing: '0.05em',
              display: 'inline'
            }}>
              {order.order_number}
            </p>
            {' '}
            <button
              onClick={() => handleCopy(order.order_number, 'Order number copied.')}
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

          {/* Information Grid */}
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                Total Price
              </p>
              <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                {formatCurrency(order.total_price)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                Quantity
              </p>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                {order.quantity} pieces
              </p>
            </div>
            {order.promo_code && order.discount_amount && order.discount_amount > 0 && (
              <div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                  Promo Code Applied
                </p>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                  {order.promo_code} (-{formatCurrency(order.discount_amount)})
                </p>
              </div>
            )}
          </div>

          {/* Lanyard Specs */}
          <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-gray-200)' }}>
            <p style={{ 
              fontSize: 'var(--text-sm)',
              color: 'var(--text-bright-tertiary)',
              marginBottom: 'var(--space-2)'
            }}>
              Lanyard Specs
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-bright-secondary)'
            }}>
              <li style={{ marginBottom: 'var(--space-1)' }}>• 2cm width</li>
              <li style={{ marginBottom: 'var(--space-1)' }}>• 2-sided color printing</li>
              <li>• Single lobster hook</li>
            </ul>
          </div>

          {/* Shipping Information */}
          <div>
            <h3 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-3)',
              color: 'var(--text-bright-primary)'
            }}>
              Shipping Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {order.shipping_name && (
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                    Shipping Name
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.shipping_name}
                  </p>
                </div>
              )}
              {order.shipping_address_line1 && (
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                    Shipping Address
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.shipping_address_line1}
                    {order.shipping_address_line2 && `, ${order.shipping_address_line2}`}
                    {order.shipping_city && `, ${order.shipping_city}`}
                    {order.shipping_postal_code && `, ${order.shipping_postal_code}`}
                  </p>
                </div>
              )}
              {order.customer_email && (
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                    Email Address
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.customer_email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <a
            href={`/track?order_number=${encodeURIComponent(order.order_number)}`}
            style={{ 
              display: 'inline-block', 
              textDecoration: 'none',
              padding: 'var(--space-3) var(--space-6)',
              fontSize: 'var(--text-base)',
              borderRadius: '9999px',
              border: '2px solid var(--color-primary)',
              color: 'var(--color-primary)',
              fontWeight: 'var(--font-weight-medium)',
              background: 'transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.color = 'var(--color-white)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
          >
            Track Your Order
          </a>
        </div>

        <HelpSection />
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
    </div>
  );
}


