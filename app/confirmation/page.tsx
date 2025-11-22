'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types/order';

// Force dynamic rendering - uses searchParams
export const dynamic = 'force-dynamic';

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('order_number') || searchParams.get('orderNumber');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container section-padding">
        <div style={{ textAlign: 'center' }}>
          <p>Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
            Your order has been confirmed.
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
            margin: 0
          }}>
            We're verifying your payment. You'll be notified once confirmed.
          </p>
        </div>

        {/* WhatsApp Button */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <a
            href={`https://wa.me/60137482481?text=${encodeURIComponent(`Hi Teevent! I'd like to send my design file for order ${order.order_number}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-4) var(--space-6)',
              fontSize: 'var(--text-lg)',
              borderRadius: 'var(--radius-xl)',
              textDecoration: 'none'
            }}
          >
            <i className="bi bi-whatsapp" style={{ fontSize: 'var(--text-xl)' }}></i>
            Send Design File via WhatsApp
          </a>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ 
            fontSize: 'var(--text-2xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-6)'
          }}>
            Order Details
          </h2>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <p style={{ 
              color: 'var(--text-bright-tertiary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-1)'
            }}>
              Order Number
            </p>
            <p style={{ 
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              {order.order_number}
            </p>
          </div>

          {/* Lanyard Details */}
          <div style={{ 
            marginBottom: 'var(--space-6)',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--color-gray-200)'
          }}>
            <p style={{ 
              color: 'var(--text-bright-tertiary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-3)'
            }}>
              Lanyard Specifications
            </p>
            <ul style={{ 
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: 'var(--text-base)',
              color: 'var(--text-bright-primary)'
            }}>
              <li style={{ marginBottom: 'var(--space-2)' }}>2cm width</li>
              <li style={{ marginBottom: 'var(--space-2)' }}>2-sided color printing</li>
              <li style={{ marginBottom: 'var(--space-2)' }}>Single lobster hook</li>
            </ul>
          </div>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--color-gray-200)'
          }}>
            <div>
              <p style={{ 
                color: 'var(--text-bright-tertiary)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-1)'
              }}>
                Quantity
              </p>
              <p style={{ fontSize: 'var(--text-lg)' }}>
                {order.quantity} pieces
              </p>
            </div>
            <div>
              <p style={{ 
                color: 'var(--text-bright-tertiary)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-1)'
              }}>
                Unit Price
              </p>
              <p style={{ fontSize: 'var(--text-lg)' }}>
                {formatCurrency(order.unit_price)}
              </p>
            </div>
            <div>
              <p style={{ 
                color: 'var(--text-bright-tertiary)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-1)'
              }}>
                Total Amount
              </p>
              <p style={{ 
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-bright-primary)'
              }}>
                {formatCurrency(order.total_price)}
              </p>
            </div>
          </div>

          {/* Expected Delivery Date */}
          <div style={{ 
            marginBottom: 'var(--space-6)',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--color-gray-200)'
          }}>
            <i className="bi bi-calendar" style={{
              fontSize: '24px',
              color: 'var(--text-bright-primary)',
              marginBottom: 'var(--space-2)',
              display: 'block'
            }}></i>
            <p style={{ 
              fontSize: 'var(--text-base)',
              lineHeight: '1.6',
              color: 'var(--text-bright-secondary)',
              margin: '0 0 var(--space-1) 0'
            }}>
              Estimated delivery:{' '}
              <span style={{
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-bright-primary)'
              }}>
                {(() => {
                  const deliveryDate = new Date(order.created_at);
                  deliveryDate.setDate(deliveryDate.getDate() + 14); // 2 weeks from order date
                  return deliveryDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                })()}
              </span>
            </p>
            <p style={{
              fontSize: 'var(--text-sm)',
              lineHeight: '1.5',
              color: 'var(--text-bright-tertiary)',
              margin: 'var(--space-2) 0 0 0'
            }}>
              May arrive earlier or later depending on production availability
            </p>
          </div>
        </div>

        {/* Payment Protection */}
        <div style={{ 
          marginTop: 'var(--space-8)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--color-gray-500)',
          textAlign: 'center'
        }}>
          <i className="bi bi-shield-fill-check" style={{
            fontSize: '32px',
            color: 'var(--text-bright-primary)',
            marginBottom: 'var(--space-3)',
            display: 'block'
          }}></i>
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
            Your payment is protected. 
            If your design cannot be produced, 
            you'll receive a full refund. No questions asked.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <a
            href={`/track?order_number=${encodeURIComponent(order.order_number)}`}
            className="btn-primary"
            style={{ 
              display: 'inline-block',
              padding: 'var(--space-4) var(--space-6)',
              fontSize: 'var(--text-lg)',
              borderRadius: 'var(--radius-xl)',
              textDecoration: 'none'
            }}
          >
            Track Your Order
          </a>
        </div>

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
    </div>
  );
}

