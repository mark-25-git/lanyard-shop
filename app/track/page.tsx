'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/order';

const statusSteps: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'pending', label: 'Order Placed', description: 'Your order has been received.' },
  { status: 'payment_pending', label: 'Payment Pending', description: 'Waiting for payment.' },
  { status: 'payment_pending_verification', label: 'Verifying Payment', description: 'We are verifying your payment.' },
  { status: 'paid', label: 'Payment Confirmed', description: 'Payment received and confirmed.' },
  { status: 'design_file_pending', label: 'Awaiting Design File', description: 'Waiting for your design file via WhatsApp.' },
  { status: 'design_file_received', label: 'Design File Received', description: 'Your design file has been received.' },
  { status: 'in_production', label: 'In Production', description: 'Your lanyards are being manufactured.' },
  { status: 'order_shipped', label: 'Shipped', description: 'Your order has been shipped.' },
  { status: 'completed', label: 'Completed', description: 'Your order has been delivered.' },
  { status: 'cancelled', label: 'Cancelled', description: 'Order has been cancelled.' },
];

export default function TrackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get('order_number') || searchParams.get('orderNumber');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderNumberParam) {
      fetchOrderByNumber(orderNumberParam);
    } else {
      setLoading(false);
    }
  }, [orderNumberParam]);

  const fetchOrderByNumber = async (number: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/get-order?order_number=${encodeURIComponent(number)}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch order');
        setOrder(null);
        setLoading(false);
        return;
      }

      if (data.success && data.data) {
        setOrder(data.data);
        setError(null);
      } else {
        setError('Order not found');
        setOrder(null);
      }
    } catch (err: any) {
      // Failed to fetch order
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load order. Please try again.');
      }
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchInput.trim()) {
      alert('Please enter an order number');
      return;
    }

    // Navigate to the track page with order number as query parameter
    router.push(`/track?order_number=${encodeURIComponent(searchInput.trim())}`);
  };


  if (loading && !order) {
    return (
      <div className="container section-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container section-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'var(--text-4xl)', 
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-6)',
            textAlign: 'center'
          }}>
            Track Your Order
          </h1>

          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <p style={{ 
              marginBottom: 'var(--space-4)',
              color: 'var(--text-bright-secondary)'
            }}>
              Enter your order number to track your order:
            </p>
            <div className="responsive-flex" style={{ gap: 'var(--space-3)' }}>
              <input
                type="text"
                value={searchInput || orderNumberParam || ''}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g., INV-250121A3B9C2"
                className="input-field"
                style={{ flex: 1 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <button
                onClick={handleSearch}
                className="btn-primary"
                style={{ minWidth: '100px' }}
              >
                Track
              </button>
            </div>
            {error && !loading && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius-xl)',
                fontSize: 'var(--text-sm)',
              }}>
                {error}
                {orderNumberParam && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    Order number: <strong>{orderNumberParam}</strong>
                  </div>
                )}
              </div>
            )}
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

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: 'var(--text-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          Track Your Order
        </h1>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ 
            marginBottom: 'var(--space-4)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-gray-200)'
          }}>
            <p style={{ 
              fontSize: 'var(--text-sm)', 
              color: 'var(--text-bright-tertiary)',
              marginBottom: 'var(--space-1)'
            }}>
              Order Number
            </p>
            <p style={{ 
              fontSize: 'var(--text-lg)', 
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              {order.order_number}
            </p>
          </div>

          {/* Download Invoice Button */}
          <div style={{ 
            marginTop: 'var(--space-4)',
            textAlign: 'center'
          }}>
            <a
              href={`/api/invoice/${encodeURIComponent(order.order_number)}`}
              download
              className="btn-primary"
              style={{ 
                display: 'inline-block',
                padding: 'var(--space-3) var(--space-6)',
                fontSize: 'var(--text-base)',
                borderRadius: 'var(--radius-xl)',
                textDecoration: 'none'
              }}
            >
              <i className="bi bi-download" style={{ marginRight: 'var(--space-2)' }}></i>
              Download Invoice
            </a>
          </div>

          {/* Current Status Display */}
          {(() => {
            const currentStatus = statusSteps.find(s => s.status === order.status);
            if (!currentStatus) return null;

            return (
              <div style={{ 
                marginTop: 'var(--space-6)',
                padding: 'var(--space-6)',
                background: 'var(--bg-bright-secondary)',
                borderRadius: 'var(--radius-xl)',
                textAlign: 'center'
              }}>
                <p style={{ 
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-bright-primary)',
                  marginBottom: 'var(--space-2)'
                }}>
                  {currentStatus.label}
                </p>
                <p style={{ 
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-bright-secondary)',
                  margin: 0
                }}>
                  {currentStatus.description}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Order Details */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)'
          }}>
            Order Details
          </h2>
          
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-bright-secondary)' }}>Quantity</span>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{order.quantity} pieces</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-bright-secondary)' }}>Unit Price</span>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{formatCurrency(order.unit_price)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--color-gray-200)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              <span>Total</span>
              <span>{formatCurrency(order.total_price)}</span>
            </div>
          </div>
        </div>

        {/* Billing Address */}
        {order.billing_address_line1 && (
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)'
            }}>
              Billing Address
            </h2>
            <div style={{ color: 'var(--text-bright-secondary)' }}>
              {order.event_or_organization_name && (
                <p style={{ 
                  marginBottom: 'var(--space-2)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-bright-primary)'
                }}>
                  {order.event_or_organization_name}
                </p>
              )}
              <p style={{ marginBottom: 'var(--space-2)' }}>{order.billing_name}</p>
              {order.billing_email && (
                <p style={{ marginBottom: 'var(--space-2)' }}>{order.billing_email}</p>
              )}
              {order.billing_phone && (
                <p style={{ marginBottom: 'var(--space-2)' }}>{order.billing_phone}</p>
              )}
              <p style={{ marginBottom: 'var(--space-2)' }}>{order.billing_address_line1}</p>
              {order.billing_address_line2 && (
                <p style={{ marginBottom: 'var(--space-2)' }}>{order.billing_address_line2}</p>
              )}
              <p style={{ marginBottom: 'var(--space-2)' }}>
                {order.billing_city}, {order.billing_state} {order.billing_postal_code}
              </p>
              <p>{order.billing_country}</p>
            </div>
          </div>
        )}

        {/* Shipping Address */}
        {order.shipping_address_line1 && (
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)'
            }}>
              Shipping Address
            </h2>
            <div style={{ color: 'var(--text-bright-secondary)' }}>
              {order.event_or_organization_name && (
                <p style={{ 
                  marginBottom: 'var(--space-2)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-bright-primary)'
                }}>
                  {order.event_or_organization_name}
                </p>
              )}
              <p style={{ marginBottom: 'var(--space-2)' }}>{order.shipping_name}</p>
              <p style={{ marginBottom: 'var(--space-2)' }}>{order.shipping_address_line1}</p>
              {order.shipping_address_line2 && (
                <p style={{ marginBottom: 'var(--space-2)' }}>{order.shipping_address_line2}</p>
              )}
              <p style={{ marginBottom: 'var(--space-2)' }}>
                {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
              </p>
              <p>{order.shipping_country}</p>
            </div>
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
    </div>
  );
}


