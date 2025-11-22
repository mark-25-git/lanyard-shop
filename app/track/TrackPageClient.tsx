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

export default function TrackPageClient() {
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

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: 'var(--text-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-8)'
        }}>
          Track Your Order
        </h1>

        {/* Search Section */}
        {!order && (
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
            <h2 style={{ 
              fontSize: 'var(--text-2xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)'
            }}>
              Enter Order Number
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Enter order number"
                className="floating-label-input"
                style={{
                  flex: 1,
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-base)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-bright-primary)',
                  color: 'var(--text-bright-primary)'
                }}
              />
              <button
                onClick={handleSearch}
                className="btn-primary"
                style={{ padding: 'var(--space-3) var(--space-6)' }}
              >
                Search
              </button>
            </div>
            {error && (
              <div style={{
                padding: 'var(--space-3)',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-sm)',
                marginTop: 'var(--space-4)'
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Order Details */}
        {order && (
          <>
            {/* Order Status Timeline */}
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-6)'
              }}>
                Order Status
              </h2>
              <div style={{ position: 'relative' }}>
                {statusSteps.map((step, index) => {
                  const currentStepIndex = statusSteps.findIndex(s => s.status === order.status);
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.status} style={{
                      display: 'flex',
                      gap: 'var(--space-4)',
                      marginBottom: index < statusSteps.length - 1 ? 'var(--space-6)' : 0,
                      position: 'relative'
                    }}>
                      {/* Timeline Line */}
                      {index < statusSteps.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: '12px',
                          top: '32px',
                          width: '2px',
                          height: 'calc(100% + var(--space-6))',
                          background: isCompleted ? 'var(--color-primary)' : 'var(--color-gray-300)',
                          zIndex: 0
                        }} />
                      )}

                      {/* Status Icon */}
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isCompleted ? 'var(--color-primary)' : 'var(--color-gray-300)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 1,
                        position: 'relative'
                      }}>
                        {isCompleted && (
                          <i className="bi bi-check" style={{
                            color: 'var(--color-white)',
                            fontSize: 'var(--text-sm)'
                          }}></i>
                        )}
                      </div>

                      {/* Status Content */}
                      <div style={{ flex: 1, paddingTop: '2px' }}>
                        <h3 style={{
                          fontSize: 'var(--text-lg)',
                          fontWeight: isCurrent ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                          color: isCurrent ? 'var(--color-primary)' : 'var(--text-bright-primary)',
                          marginBottom: 'var(--space-1)'
                        }}>
                          {step.label}
                        </h3>
                        <p style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-bright-secondary)',
                          margin: 0
                        }}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Information */}
            <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {/* Order Details Card */}
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <h3 style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-4)'
                }}>
                  Order Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                      Order Number
                    </p>
                    <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                      {order.order_number}
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
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                      Unit Price
                    </p>
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                      {formatCurrency(order.unit_price)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                      Total Price
                    </p>
                    <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                      {formatCurrency(order.total_price)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                      Order Date
                    </p>
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Address Card */}
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <h3 style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-4)'
                }}>
                  Billing Address
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {order.event_or_organization_name && (
                    <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                      {order.event_or_organization_name}
                    </p>
                  )}
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.customer_name}
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.customer_phone}
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0, whiteSpace: 'pre-line' }}>
                    {order.billing_address}
                  </p>
                </div>
              </div>

              {/* Shipping Address Card */}
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <h3 style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-4)'
                }}>
                  Shipping Address
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {order.event_or_organization_name && (
                    <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                      {order.event_or_organization_name}
                    </p>
                  )}
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.shipping_name}
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.shipping_phone}
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0, whiteSpace: 'pre-line' }}>
                    {order.shipping_address}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Invoice Button */}
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
              <a
                href={`/api/invoice/${order.order_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                Download Invoice
              </a>
            </div>

            {/* Search Again Button */}
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setOrder(null);
                  setSearchInput('');
                  setError(null);
                  router.push('/track');
                }}
                className="btn-primary"
                style={{ background: 'var(--color-gray-600)' }}
              >
                Track Another Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

