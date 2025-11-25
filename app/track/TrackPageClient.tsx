'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/order';
import HelpSection from '@/components/HelpSection';

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

  const normalizeOrderNumber = (value: string) => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return '';
    return trimmed.startsWith('INV-') ? trimmed : `INV-${trimmed.replace(/^INV/, '').replace(/^-/, '')}`;
  };

  useEffect(() => {
    if (orderNumberParam) {
      const normalizedParam = normalizeOrderNumber(orderNumberParam);
      setSearchInput(normalizedParam);
      fetchOrderByNumber(normalizedParam);
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
    const normalized = normalizeOrderNumber(searchInput);
    if (!normalized) {
      alert('Please enter an order number');
      return;
    }

    setSearchInput(normalized);
    router.push(`/track?order_number=${encodeURIComponent(normalized)}`);
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
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="e.g. INV-2511255ZX50E or 2511255ZX50E"
                className="floating-label-input"
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-base)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-bright-primary)',
                  color: 'var(--text-bright-primary)',
                  marginBottom: 'var(--space-3)'
                }}
              />
              <button
                onClick={handleSearch}
                className="btn-primary"
                style={{ 
                  width: '100%',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-base)',
                  borderRadius: '9999px'
                }}
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
            {/* Order Status */}
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--space-4)'
              }}>
                <h2 style={{ 
                  fontSize: 'var(--text-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  margin: 0
                }}>
                  Order Status
                </h2>
                <p style={{ 
                  fontSize: 'var(--text-base)', 
                  color: 'var(--text-bright-secondary)',
                  margin: 0
                }}>
                  {order.order_number}
                </p>
              </div>
              {(() => {
                const currentStatus = statusSteps.find(s => s.status === order.status);
                if (!currentStatus) return null;
                
                return (
                  <div style={{ 
                    textAlign: 'center',
                    background: 'var(--bg-bright-secondary)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    <h3 style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-primary)',
                      marginBottom: 'var(--space-1)'
                    }}>
                      {currentStatus.label}
                    </h3>
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
              
              {/* Estimated Delivery Date Banner */}
              <div style={{
                padding: 'var(--space-3)',
                background: 'var(--bg-bright-secondary)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-bright-secondary)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  <i className="bi bi-truck" style={{
                    marginRight: 'var(--space-2)',
                    color: 'var(--color-primary)'
                  }}></i>
                  Estimated delivery: {(() => {
                    const deliveryDate = new Date(order.created_at);
                    deliveryDate.setDate(deliveryDate.getDate() + 14); // 2 weeks from order date
                    return deliveryDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    });
                  })()}
                </p>
              </div>
            </div>

            {/* Order Details Card - Full Width */}
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <h3 style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-4)'
              }}>
                Order Details
              </h3>
              
              {/* Lanyard Specs Subsection */}
              <div style={{ 
                marginBottom: 'var(--space-4)',
                paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--color-gray-200)'
              }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>
                    Order Number
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.order_number}
                  </p>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>
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
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>
                    Quantity
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.quantity} pieces
                  </p>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>
                    Unit Price
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {formatCurrency(order.unit_price)}
                  </p>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>
                    Delivery
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    Free
                  </p>
                </div>
                {order.promo_code && order.discount_amount && order.discount_amount > 0 && (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'var(--space-3)',
                      paddingTop: 'var(--space-3)',
                      borderTop: '1px solid var(--color-gray-200)'
                    }}>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>
                        Subtotal
                      </p>
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', fontWeight: 'var(--font-weight-medium)', margin: 0 }}>
                        {formatCurrency(order.unit_price * order.quantity)}
                      </p>
                    </div>
                    <div style={{ 
                      marginTop: 'var(--space-3)'
                    }}>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0, marginBottom: 'var(--space-2)' }}>
                        Promo Code Applied
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                          {order.promo_code}
                        </p>
                        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                          -{formatCurrency(order.discount_amount)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 'var(--space-3)',
                  marginTop: 'var(--space-2)',
                  borderTop: '2px solid var(--color-gray-200)'
                }}>
                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    Total Price
                  </p>
                  <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Billing and Shipping Addresses - Side by Side */}
            <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 'var(--space-6)' }}>
              {/* Billing Address Card */}
              {order.billing_name && (
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
                      {order.billing_name || order.customer_name}
                    </p>
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                      {order.billing_phone || order.customer_phone}
                    </p>
                    {order.billing_address_line1 && (
                      <>
                        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                          {order.billing_address_line1}
                        </p>
                        {order.billing_address_line2 && (
                          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                            {order.billing_address_line2}
                          </p>
                        )}
                        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                          {[order.billing_postal_code, order.billing_city, order.billing_state].filter(Boolean).join(', ')}
                        </p>
                        {order.billing_country && (
                          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                            {order.billing_country}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping Address Card */}
              {order.shipping_name && (
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
                    {order.shipping_address_line1 && (
                      <>
                        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                          {order.shipping_address_line1}
                        </p>
                        {order.shipping_address_line2 && (
                          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                            {order.shipping_address_line2}
                          </p>
                        )}
                        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                          {[order.shipping_postal_code, order.shipping_city, order.shipping_state].filter(Boolean).join(', ')}
                        </p>
                        {order.shipping_country && (
                          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                            {order.shipping_country}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Download Invoice Button */}
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
              <a
                href={`/api/invoice/${order.order_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ 
                  display: 'block',
                  width: '100%',
                  textDecoration: 'none',
                  textAlign: 'center',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-base)',
                  borderRadius: '9999px'
                }}
              >
                Download Invoice
              </a>
            </div>

            {/* Search Again Button */}
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <button
                onClick={() => {
                  setOrder(null);
                  setSearchInput('');
                  setError(null);
                  router.push('/track');
                }}
                style={{ 
                  width: '100%',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-base)',
                  borderRadius: '9999px',
                  border: '2px solid var(--color-primary)',
                  color: 'var(--color-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  background: 'transparent',
                  cursor: 'pointer',
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
                Track Another Order
              </button>
            </div>
          </>
        )}

        <HelpSection />
      </div>
    </div>
  );
}

