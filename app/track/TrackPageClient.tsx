'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/order';
import { Shipment } from '@/types/shipment';
import { supabase } from '@/lib/supabase';
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
  const [isVerified, setIsVerified] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    orderNumber: '',
    lastFourDigits: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loadingShipment, setLoadingShipment] = useState(false);

  const normalizeOrderNumber = (value: string) => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return '';
    return trimmed.startsWith('INV-') ? trimmed : `INV-${trimmed.replace(/^INV/, '').replace(/^-/, '')}`;
  };

  // Check for existing session on load
  useEffect(() => {
    const checkExistingSession = async () => {
      // Check if order number is in URL
      if (orderNumberParam) {
        const normalizedParam = normalizeOrderNumber(orderNumberParam);
        setVerificationForm(prev => ({ ...prev, orderNumber: normalizedParam }));
      }

      // Try to fetch order with existing session (cookie will be sent automatically)
      // If session exists and is valid, order will load
      // If not, user will need to verify
    if (orderNumberParam) {
      const normalizedParam = normalizeOrderNumber(orderNumberParam);
        await fetchOrderWithSession(normalizedParam);
    } else {
      setLoading(false);
    }
    };

    checkExistingSession();
  }, [orderNumberParam]);

  const fetchOrderWithSession = async (orderNumber: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `/api/get-order?order_number=${encodeURIComponent(orderNumber)}`;
      
      const response = await fetch(url, {
        credentials: 'include' // Include cookies
      });
      const data = await response.json();

      if (!response.ok) {
        // Session expired or invalid - need to verify
        if (response.status === 401) {
          setIsVerified(false);
          setOrder(null);
          setError(null); // Don't show error, just show verification form
        } else {
        setError(data.error || 'Failed to fetch order');
        setOrder(null);
        }
        setLoading(false);
        return;
      }

      if (data.success && data.data) {
        setOrder(data.data);
        setIsVerified(true);
        setError(null);
        
        // Fetch shipment if order is shipped
        if (data.data.status === 'order_shipped' || data.data.status === 'completed') {
          fetchShipment(data.data.order_number);
        }
      } else {
        setIsVerified(false);
        setError('Order not found.');
        setOrder(null);
      }
    } catch (err: any) {
      setIsVerified(false);
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

  const handleVerification = async () => {
    if (!verificationForm.orderNumber.trim() || !verificationForm.lastFourDigits.trim()) {
      setError('Please enter both order number and last 4 digits of phone number.');
      return;
    }

    const normalizedOrderNumber = normalizeOrderNumber(verificationForm.orderNumber);
    if (!normalizedOrderNumber) {
      setError('Please enter a valid order number.');
      return;
    }

    if (verificationForm.lastFourDigits.trim().length !== 4) {
      setError('Please enter the last 4 digits of your phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          order_number: normalizedOrderNumber,
          last_four_digits: verificationForm.lastFourDigits.trim().replace(/\D/g, '')
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Use the error message from the API (which is more specific)
        setError(data.error || 'The order number and phone do not match.');
        setIsVerified(false);
        setOrder(null);
        setLoading(false);
        return;
      }

      // Verification successful
      setOrder(data.data);
      setIsVerified(true);
      setSessionToken(data.session_token);
      setError(null);
      
      // Fetch shipment if order is shipped
      if (data.data.status === 'order_shipped' || data.data.status === 'completed') {
        fetchShipment(data.data.order_number);
      }
      
      // Update URL to include order number
      router.push(`/track?order_number=${encodeURIComponent(normalizedOrderNumber)}`, { scroll: false });
    } catch (err) {
      setError('Failed to verify. Please try again.');
      setIsVerified(false);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchShipment = async (orderNumber: string) => {
    setLoadingShipment(true);
    try {
      // Fetch the most recent shipment for this order
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_number', orderNumber)
        .order('shipped_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!error && shipments) {
        setShipment(shipments as Shipment);
      }
    } catch (err) {
      console.error('Failed to fetch shipment:', err);
    } finally {
      setLoadingShipment(false);
    }
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
    <div className="container section-padding" style={!isVerified ? { 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      margin: '0 auto',
      paddingTop: 'var(--space-8)',
      paddingBottom: 'var(--space-8)',
      maxWidth: '1200px'
    } : {
      margin: '0 auto',
      maxWidth: '1200px'
    }}>
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        <h1 className="page-title" style={{ 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-8)',
          textAlign: !isVerified ? 'center' : 'left'
        }}>
          Track Your Order
        </h1>

        {/* Verification Form */}
        {!isVerified && (
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)', textAlign: 'left' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-bright-primary)',
                marginBottom: 'var(--space-2)'
              }}>
                Order Number
              </label>
              <input
                type="text"
                value={verificationForm.orderNumber}
                onChange={(e) => setVerificationForm(prev => ({
                  ...prev,
                  orderNumber: e.target.value
                }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleVerification();
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
                  marginBottom: 'var(--space-4)'
                }}
              />
              <label style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-bright-primary)',
                marginBottom: 'var(--space-2)'
              }}>
                Last 4 Digits of Phone Number (billing or shipping)
              </label>
              <input
                type="text"
                value={verificationForm.lastFourDigits}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setVerificationForm(prev => ({
                    ...prev,
                    lastFourDigits: digits
                  }));
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleVerification();
                  }
                }}
                placeholder="1234"
                maxLength={4}
                className="floating-label-input"
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-base)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-bright-primary)',
                  color: 'var(--text-bright-primary)',
                  marginBottom: 'var(--space-4)'
                }}
              />
              <button
                onClick={handleVerification}
                disabled={loading}
                className="btn-primary"
                style={{ 
                  width: '100%',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-base)',
                  borderRadius: '9999px',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying...' : 'Track'}
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
              {order.status === 'order_shipped' ? (
                <>
                  {/* Shipped Status Banner */}
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
                      Shipped
                    </h3>
                    <p style={{
                      fontSize: 'var(--text-base)',
                      color: 'var(--text-bright-secondary)',
                      margin: 0
                    }}>
                      Your order has been shipped.
                    </p>
                  </div>

                  {/* Estimated Delivery Date Banner */}
                  {shipment && (
                    <>
                      <div style={{
                        padding: 'var(--space-3)',
                        background: 'var(--bg-bright-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                        marginBottom: 'var(--space-4)'
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
                            const shippedDate = new Date(shipment.shipped_at);
                            const deliveryDate1 = new Date(shippedDate);
                            deliveryDate1.setDate(shippedDate.getDate() + 1);
                            const deliveryDate2 = new Date(shippedDate);
                            deliveryDate2.setDate(shippedDate.getDate() + 2);
                            
                            const formatDate = (date: Date) => {
                              return date.toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                              });
                            };
                            
                            return `${formatDate(deliveryDate1)} - ${formatDate(deliveryDate2)}`;
                          })()}
                        </p>
                      </div>

                      {/* Track Order Button */}
                      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                        <a
                          href={shipment.courier_tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{
                            display: 'inline-block',
                            padding: 'var(--space-3) var(--space-6)',
                            borderRadius: '9999px',
                            textDecoration: 'none'
                          }}
                        >
                          Track Order on {shipment.courier}
                        </a>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
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
                  
                  {/* Estimated Delivery Date Banner - Hide for completed orders */}
                  {order.status !== 'completed' && (
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
                  )}
                </>
              )}
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
                    Total
                  </p>
                  <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {formatCurrency(order.total_price)}
                  </p>
                </div>

                {/* Canva Design Link */}
                {order.design_file_url && (
                  <div style={{ 
                    marginTop: 'var(--space-4)',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--color-gray-200)'
                  }}>
                    <p style={{ 
                      fontSize: 'var(--text-sm)', 
                      color: 'var(--text-bright-secondary)', 
                      marginBottom: 'var(--space-2)',
                      margin: 0
                    }}>
                      Canva Design Link
                    </p>
                    <a
                      href={order.design_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        fontSize: 'var(--text-base)',
                        color: 'var(--color-primary)',
                        textDecoration: 'underline',
                        wordBreak: 'break-all',
                        lineHeight: '1.5',
                        marginTop: 'var(--space-1)'
                      }}
                    >
                      {order.design_file_url}
                    </a>
                  </div>
                )}
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
                    Billing
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
                    {order.customer_email && (
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                        {order.customer_email}
                      </p>
                    )}
                    {order.billing_address_line1 && (
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                        {[
                          order.billing_address_line1,
                          order.billing_address_line2,
                          [order.billing_postal_code, order.billing_city, order.billing_state].filter(Boolean).join(', '),
                          order.billing_country
                        ].filter(Boolean).join(', ')}
                      </p>
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
                    Shipping
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
                    {order.customer_email && (
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                        {order.customer_email}
                      </p>
                    )}
                    {order.shipping_address_line1 && (
                      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                        {[
                          order.shipping_address_line1,
                          order.shipping_address_line2,
                          [order.shipping_postal_code, order.shipping_city, order.shipping_state].filter(Boolean).join(', '),
                          order.shipping_country
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Download Invoice Button */}
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
              <button
                onClick={async () => {
                  if (!order || downloadingInvoice) return;
                  
                  setDownloadingInvoice(true);
                  
                  try {
                    // Generate download token
                    const response = await fetch('/api/generate-invoice-token', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include', // Include cookies for session
                      body: JSON.stringify({
                        order_number: order.order_number
                      })
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success || !data.token) {
                      alert('Failed to generate download link. Please try again.');
                      setDownloadingInvoice(false);
                      return;
                    }

                    // Create temporary anchor element for download (works on mobile Safari)
                    const downloadUrl = `/api/invoice/${data.token}`;
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `invoice-${order.order_number}.pdf`;
                    link.target = '_blank';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Reset loading state after a short delay
                    setTimeout(() => {
                      setDownloadingInvoice(false);
                    }, 1000);
                  } catch (err) {
                    alert('Failed to download invoice. Please try again.');
                    console.error('Invoice download error:', err);
                    setDownloadingInvoice(false);
                  }
                }}
                disabled={downloadingInvoice}
                className="btn-primary"
                style={{ 
                  display: 'inline-block',
                  textAlign: 'center',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-base)',
                  borderRadius: '9999px',
                  width: '220px',
                  border: 'none',
                  cursor: downloadingInvoice ? 'not-allowed' : 'pointer',
                  opacity: downloadingInvoice ? 0.6 : 1
                }}
              >
                {downloadingInvoice ? (
                  <div className="modern-spinner" style={{ display: 'inline-flex' }}>
                    <div className="modern-spinner-dot"></div>
                    <div className="modern-spinner-dot"></div>
                    <div className="modern-spinner-dot"></div>
                  </div>
                ) : (
                  'Download Invoice'
                )}
              </button>
            </div>

            {/* Track Another Order Button */}
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <button
                onClick={() => {
                  setOrder(null);
                  setIsVerified(false);
                  setVerificationForm({ orderNumber: '', lastFourDigits: '' });
                  setError(null);
                  setSessionToken(null);
                  router.push('/track');
                }}
                style={{ 
                  display: 'inline-block',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--text-base)',
                  borderRadius: '9999px',
                  border: '2px solid var(--color-primary)',
                  color: 'var(--color-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '220px'
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

