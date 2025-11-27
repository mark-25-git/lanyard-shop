'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/order';
import { OrderEmail, EmailType } from '@/types/order-email';
import { Shipment, CourierWebsite } from '@/types/shipment';
import { generateTrackingUrl } from '@/lib/tracking-url';

const statusOptions: OrderStatus[] = [
  'pending',
  'payment_pending',
  'payment_pending_verification',
  'paid',
  'design_file_pending',
  'design_file_received',
  'in_production',
  'order_shipped',
  'completed',
  'cancelled',
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [paymentReference, setPaymentReference] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Email and shipment tracking
  const [orderEmails, setOrderEmails] = useState<OrderEmail[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [couriers, setCouriers] = useState<CourierWebsite[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingShipments, setLoadingShipments] = useState(false);
  
  // Modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingEmailType, setPendingEmailType] = useState<EmailType | null>(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  
  // Shipment form
  const [shipmentForm, setShipmentForm] = useState({
    courier: '',
    trackingNumber: '',
    trackingUrl: '',
  });

  useEffect(() => {
    // Check Supabase authentication
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          // Redirect to login with return URL
          router.push(`/admin/login?redirect=${encodeURIComponent(`/admin/orders/${orderId}`)}`);
          return;
        }

        // Verify user is admin (check by email)
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
        if (adminEmail && session.user.email !== adminEmail) {
          await supabase.auth.signOut();
          router.push(`/admin/login?redirect=${encodeURIComponent(`/admin/orders/${orderId}`)}`);
          return;
        }

        // Authenticated - fetch order
        setCheckingAuth(false);
        fetchOrder();
      } catch (err) {
        router.push(`/admin/login?redirect=${encodeURIComponent(`/admin/orders/${orderId}`)}`);
      }
    };

    checkAuth();
  }, [orderId, router]);

  // Fetch emails and shipments when order is loaded
  useEffect(() => {
    if (order) {
      fetchOrderEmails();
      fetchShipments();
      fetchCouriers();
    }
  }, [order]);

  const fetchOrderEmails = async () => {
    if (!order) return;
    setLoadingEmails(true);
    try {
      const response = await fetch(`/api/get-order-emails?order_number=${encodeURIComponent(order.order_number)}`);
      const data = await response.json();
      if (data.success) {
        setOrderEmails(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch order emails:', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const fetchShipments = async () => {
    if (!order) return;
    setLoadingShipments(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_number', order.order_number)
        .order('shipped_at', { ascending: false });

      if (!error && data) {
        setShipments(data as Shipment[]);
      }
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
    } finally {
      setLoadingShipments(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const response = await fetch('/api/get-courier-websites');
      const data = await response.json();
      if (data.success) {
        setCouriers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch couriers:', err);
    }
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      // Get session token for API request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/admin/login?redirect=${encodeURIComponent(`/admin/orders/${orderId}`)}`);
        return;
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push(`/admin/login?redirect=${encodeURIComponent(`/admin/orders/${orderId}`)}`);
          return;
        }
        throw new Error(data.error || 'Failed to fetch order');
      }

      setOrder(data.data);
      setSelectedStatus(data.data.status);
      setPaymentReference(data.data.payment_reference || '');
    } catch (err) {
      alert('Failed to load order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order) return;

    // Check if status change requires email approval
    if (selectedStatus === 'paid' && order.status !== 'paid') {
      setPendingEmailType('payment_confirmed');
      setShowEmailModal(true);
      return;
    }

    if (selectedStatus === 'order_shipped' && order.status !== 'order_shipped') {
      // Show shipment creation modal first
      setShowShipmentModal(true);
      return;
    }

    if (selectedStatus === 'completed' && order.status !== 'completed') {
      setPendingEmailType('order_completed');
      setShowEmailModal(true);
      return;
    }

    // No email required, proceed with status update
    await performStatusUpdate();
  };

  const handleCancelEmailModal = () => {
    setShowEmailModal(false);
    setPendingEmailType(null);
    // Reset status to current order status
    if (order) {
      setSelectedStatus(order.status);
    }
  };

  const handleCancelShipmentModal = () => {
    setShowShipmentModal(false);
    setShipmentForm({ courier: '', trackingNumber: '', trackingUrl: '' });
    // Reset status to current order status
    if (order) {
      setSelectedStatus(order.status);
    }
  };

  const performStatusUpdate = async () => {
    if (!order) return;

    setUpdating(true);
    try {
      // Get session token for API request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/admin/login?redirect=${encodeURIComponent(`/admin/orders/${orderId}`)}`);
        return;
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: selectedStatus,
          payment_reference: paymentReference || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/admin/login?redirect=${encodeURIComponent(`/admin/orders/${orderId}`)}`);
          return;
        }
        throw new Error(data.error || 'Failed to update order');
      }

      setOrder(data.data);
      
      // Show success notification
      setNotificationMessage('Order updated successfully.');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    } catch (err) {
      // Show error notification
      setNotificationMessage(err instanceof Error ? err.message : 'Failed to update order.');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!order || !shipmentForm.courier || !shipmentForm.trackingNumber) {
      setNotificationMessage('Please fill in all required fields.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    setCreatingShipment(true);
    try {
      const response = await fetch('/api/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          courier: shipmentForm.courier,
          courier_tracking_number: shipmentForm.trackingNumber,
          courier_tracking_url: shipmentForm.trackingUrl || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create shipment');
      }

      // Refresh shipments
      await fetchShipments();

      // Update order status to order_shipped if not already
      if (order.status !== 'order_shipped') {
        await performStatusUpdate();
      }

      // Close shipment modal and show email modal
      setShowShipmentModal(false);
      setPendingEmailType('order_shipped');
      setShowEmailModal(true);
      
      // Reset form
      setShipmentForm({ courier: '', trackingNumber: '', trackingUrl: '' });
    } catch (err) {
      setNotificationMessage(err instanceof Error ? err.message : 'Failed to create shipment.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setCreatingShipment(false);
    }
  };

  const handleSendEmail = async (emailType: EmailType) => {
    if (!order) return;

    setSendingEmail(true);
    try {
      const response = await fetch('/api/manual-send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          email_type: emailType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      // Refresh emails
      await fetchOrderEmails();

      setNotificationMessage('Email sent successfully.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      setNotificationMessage(err instanceof Error ? err.message : 'Failed to send email.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEmailModalConfirm = async () => {
    if (!pendingEmailType) return;

    // If status needs to be updated (not already updated), do it first
    if (selectedStatus !== order?.status) {
      await performStatusUpdate();
    }
    
    // Send email
    await handleSendEmail(pendingEmailType);

    // Close modal
    setShowEmailModal(false);
    setPendingEmailType(null);
  };

  const handleCourierChange = (courierName: string) => {
    const courier = couriers.find(c => c.courier_name === courierName);
    setShipmentForm(prev => ({
      ...prev,
      courier: courierName,
      trackingUrl: courier ? generateTrackingUrl(courier.tracking_url_template, prev.trackingNumber || '') : prev.trackingUrl,
    }));
  };

  const handleTrackingNumberChange = (trackingNumber: string) => {
    const courier = couriers.find(c => c.courier_name === shipmentForm.courier);
    setShipmentForm(prev => ({
      ...prev,
      trackingNumber,
      trackingUrl: courier ? generateTrackingUrl(courier.tracking_url_template, trackingNumber) : prev.trackingUrl,
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (checkingAuth || loading) {
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
          <p style={{ color: 'var(--text-bright-secondary)' }}>
            {checkingAuth ? 'Checking authentication...' : 'Loading order...'}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container section-padding">
        <div style={{ textAlign: 'center' }}>
          <p>Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-2) var(--space-4)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-bright-card)',
              color: 'var(--text-bright-primary)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)'
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ 
            fontSize: 'var(--text-4xl)', 
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-2)'
          }}>
            Order Details
          </h1>
          <p style={{ 
            fontSize: 'var(--text-xl)',
            color: 'var(--text-bright-secondary)'
          }}>
            {order.order_number}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          {/* Left Column: Order Information */}
          <div>
            {/* Order Status Update */}
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-6)'
              }}>
                Update Order Status
              </h2>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: 'var(--space-2)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 'var(--space-6)' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: 'var(--space-2)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  Payment Reference
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Bank transfer reference number"
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={updating || selectedStatus === order.status}
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  padding: 'var(--space-3) var(--space-6)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                {updating ? 'Updating...' : 'Update Order'}
              </button>
            </div>

            {/* Customer Information */}
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-6)'
              }}>
                Customer Information
              </h2>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ 
                  color: 'var(--text-bright-tertiary)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--space-1)'
                }}>
                  Name
                </p>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {order.customer_name}
                </p>
              </div>

              {order.event_or_organization_name && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <p style={{ 
                    color: 'var(--text-bright-tertiary)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    Event / Organization
                  </p>
                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {order.event_or_organization_name}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ 
                  color: 'var(--text-bright-tertiary)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--space-1)'
                }}>
                  Email
                </p>
                <p style={{ fontSize: 'var(--text-lg)' }}>
                  {order.customer_email}
                </p>
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ 
                  color: 'var(--text-bright-tertiary)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--space-1)'
                }}>
                  Phone
                </p>
                <p style={{ fontSize: 'var(--text-lg)' }}>
                  {order.customer_phone}
                </p>
              </div>
            </div>

            {/* Billing Address */}
            {order.billing_name && (
              <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ 
                  fontSize: 'var(--text-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-6)'
                }}>
                  Billing Address
                </h2>

                <div style={{ lineHeight: '1.8', color: 'var(--text-bright-secondary)' }}>
                  <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                    {order.billing_name}
                  </p>
                  <p>{order.billing_address_line1}</p>
                  {order.billing_address_line2 && <p>{order.billing_address_line2}</p>}
                  <p>
                    {order.billing_postal_code} {order.billing_city}, {order.billing_state}
                  </p>
                  <p>{order.billing_country}</p>
                  <p style={{ marginTop: 'var(--space-2)' }}>
                    <strong>Phone:</strong> {order.billing_phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.billing_email}
                  </p>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.shipping_name && (
              <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ 
                  fontSize: 'var(--text-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-6)'
                }}>
                  Shipping Address
                </h2>

                <div style={{ lineHeight: '1.8', color: 'var(--text-bright-secondary)' }}>
                  {order.event_or_organization_name && (
                    <p style={{ 
                      fontWeight: 'var(--font-weight-semibold)', 
                      marginBottom: 'var(--space-2)',
                      color: 'var(--text-bright-primary)'
                    }}>
                      {order.event_or_organization_name}
                    </p>
                  )}
                  <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                    {order.shipping_name}
                  </p>
                  <p>{order.shipping_address_line1}</p>
                  {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                  <p>
                    {order.shipping_postal_code} {order.shipping_city}, {order.shipping_state}
                  </p>
                  <p>{order.shipping_country}</p>
                  <p style={{ marginTop: 'var(--space-2)' }}>
                    <strong>Phone:</strong> {order.shipping_phone}
                  </p>
                </div>
              </div>
            )}

            {/* Email Tracking */}
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-6)'
              }}>
                Email Tracking
              </h2>

              {loadingEmails ? (
                <p style={{ color: 'var(--text-bright-secondary)' }}>Loading emails...</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
                        <th style={{ 
                          textAlign: 'left', 
                          padding: 'var(--space-3)', 
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-bright-tertiary)'
                        }}>
                          Email Type
                        </th>
                        <th style={{ 
                          textAlign: 'left', 
                          padding: 'var(--space-3)', 
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-bright-tertiary)'
                        }}>
                          Status
                        </th>
                        <th style={{ 
                          textAlign: 'left', 
                          padding: 'var(--space-3)', 
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-bright-tertiary)'
                        }}>
                          Sent At
                        </th>
                        <th style={{ 
                          textAlign: 'center', 
                          padding: 'var(--space-3)', 
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-bright-tertiary)'
                        }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: 'order_confirmation' as EmailType, label: 'Order Confirmation' },
                        { type: 'payment_confirmed' as EmailType, label: 'Payment Confirmed' },
                        { type: 'order_shipped' as EmailType, label: 'Order Shipped' },
                        { type: 'order_completed' as EmailType, label: 'Order Completed' },
                      ].map(({ type, label }) => {
                        const email = orderEmails.find(e => e.email_type === type);
                        return (
                          <tr key={type} style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                            <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                              {label}
                            </td>
                            <td style={{ padding: 'var(--space-3)' }}>
                              {email?.status === 'sent' ? (
                                <span style={{
                                  display: 'inline-block',
                                  padding: 'var(--space-1) var(--space-3)',
                                  borderRadius: '9999px',
                                  fontSize: 'var(--text-xs)',
                                  fontWeight: 'var(--font-weight-medium)',
                                  background: '#d1fae5',
                                  color: '#065f46'
                                }}>
                                  Sent
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-block',
                                  padding: 'var(--space-1) var(--space-3)',
                                  borderRadius: '9999px',
                                  fontSize: 'var(--text-xs)',
                                  fontWeight: 'var(--font-weight-medium)',
                                  background: '#fef3c7',
                                  color: '#92400e'
                                }}>
                                  Pending
                                </span>
                              )}
                            </td>
                            <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)' }}>
                              {email?.sent_at ? formatDate(email.sent_at) : '-'}
                            </td>
                            <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                              <button
                                onClick={() => handleSendEmail(type)}
                                disabled={sendingEmail}
                                style={{
                                  padding: 'var(--space-2) var(--space-4)',
                                  fontSize: 'var(--text-sm)',
                                  border: '1px solid var(--color-primary)',
                                  borderRadius: 'var(--radius-lg)',
                                  background: 'transparent',
                                  color: 'var(--color-primary)',
                                  cursor: sendingEmail ? 'not-allowed' : 'pointer',
                                  opacity: sendingEmail ? 0.6 : 1
                                }}
                              >
                                Send
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Shipments */}
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--space-6)'
              }}>
                <h2 style={{ 
                  fontSize: 'var(--text-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  Shipments
                </h2>
                {order.status === 'order_shipped' || order.status === 'completed' ? (
                  <button
                    onClick={() => setShowShipmentModal(true)}
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      fontSize: 'var(--text-sm)',
                      border: '1px solid var(--color-primary)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-primary)',
                      color: 'var(--color-white)',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Shipment
                  </button>
                ) : null}
              </div>

              {loadingShipments ? (
                <p style={{ color: 'var(--text-bright-secondary)' }}>Loading shipments...</p>
              ) : shipments.length === 0 ? (
                <p style={{ color: 'var(--text-bright-secondary)' }}>No shipments yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {shipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--bg-bright-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-gray-200)'
                      }}
                    >
                      <div style={{ marginBottom: 'var(--space-2)' }}>
                        <strong style={{ fontSize: 'var(--text-base)' }}>Courier:</strong>{' '}
                        <span style={{ fontSize: 'var(--text-base)' }}>{shipment.courier}</span>
                      </div>
                      <div style={{ marginBottom: 'var(--space-2)' }}>
                        <strong style={{ fontSize: 'var(--text-base)' }}>Tracking Number:</strong>{' '}
                        <span style={{ fontSize: 'var(--text-base)' }}>{shipment.courier_tracking_number}</span>
                      </div>
                      <div style={{ marginBottom: 'var(--space-2)' }}>
                        <strong style={{ fontSize: 'var(--text-base)' }}>Shipped At:</strong>{' '}
                        <span style={{ fontSize: 'var(--text-base)' }}>{formatDate(shipment.shipped_at)}</span>
                      </div>
                      <a
                        href={shipment.courier_tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: 'var(--space-2)',
                          padding: 'var(--space-2) var(--space-4)',
                          background: 'var(--color-primary)',
                          color: 'var(--color-white)',
                          borderRadius: 'var(--radius-lg)',
                          textDecoration: 'none',
                          fontSize: 'var(--text-sm)'
                        }}
                      >
                        Track Package →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div>
            <div className="card" style={{ padding: 'var(--space-6)', position: 'sticky', top: 'var(--space-8)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-6)'
              }}>
                Order Summary
              </h2>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)'
                }}>
                  <span style={{ color: 'var(--text-bright-secondary)' }}>Quantity:</span>
                  <span>{order.quantity} pieces</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)'
                }}>
                  <span style={{ color: 'var(--text-bright-secondary)' }}>Unit Price:</span>
                  <span>{formatCurrency(order.unit_price)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid var(--color-gray-200)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--font-weight-bold)'
                }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>
                    {formatCurrency(order.total_price)}
                  </span>
                </div>
              </div>

              <div style={{ 
                marginTop: 'var(--space-6)',
                padding: 'var(--space-4)',
                background: 'var(--bg-bright-secondary)',
                borderRadius: 'var(--radius-xl)'
              }}>
                <p style={{ 
                  color: 'var(--text-bright-tertiary)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--space-2)'
                }}>
                  Status
                </p>
                <p style={{ 
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textTransform: 'capitalize'
                }}>
                  {order.status.replace('_', ' ')}
                </p>
              </div>

              {order.payment_reference && (
                <div style={{ 
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  background: 'var(--bg-bright-secondary)',
                  borderRadius: 'var(--radius-xl)'
                }}>
                  <p style={{ 
                    color: 'var(--text-bright-tertiary)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    Payment Reference
                  </p>
                  <p style={{ 
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    {order.payment_reference}
                  </p>
                </div>
              )}

              {order.payment_confirmed_at && (
                <div style={{ 
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  background: 'var(--bg-bright-secondary)',
                  borderRadius: 'var(--radius-xl)'
                }}>
                  <p style={{ 
                    color: 'var(--text-bright-tertiary)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    Payment Confirmed
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)' }}>
                    {formatDate(order.payment_confirmed_at)}
                  </p>
                </div>
              )}

              <div style={{ 
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-6)',
                borderTop: '1px solid var(--color-gray-200)'
              }}>
                <p style={{ 
                  color: 'var(--text-bright-tertiary)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--space-2)'
                }}>
                  Order Date
                </p>
                <p style={{ fontSize: 'var(--text-sm)' }}>
                  {formatDate(order.created_at)}
                </p>
              </div>

              {order.design_file_url && (
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <p style={{ 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--text-bright-tertiary)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    Design File:
                  </p>
                  <a
                    href={order.design_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: 'var(--space-2) var(--space-4)',
                      background: 'var(--bg-bright-secondary)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--color-primary)',
                      textDecoration: 'underline',
                      fontSize: 'var(--text-sm)'
                    }}
                  >
                    View Design
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Approval Modal */}
      {showEmailModal && pendingEmailType && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)'
          }}
          onClick={() => {
            setShowEmailModal(false);
            setPendingEmailType(null);
          }}
        >
          <div
            style={{
              background: 'var(--bg-bright-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              maxWidth: '500px',
              width: '100%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCancelEmailModal}
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
                background: 'none',
                border: 'none',
                fontSize: 'var(--text-2xl)',
                color: 'var(--text-bright-secondary)',
                cursor: 'pointer',
                padding: 0,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
            <h3 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)'
            }}>
              Send Email?
            </h3>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-bright-secondary)' }}>
              Do you want to send the {pendingEmailType.replace('_', ' ')} email to the customer?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEmailModal}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'transparent',
                  color: 'var(--text-bright-primary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailModalConfirm}
                disabled={sendingEmail || updating}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-white)',
                  cursor: (sendingEmail || updating) ? 'not-allowed' : 'pointer',
                  opacity: (sendingEmail || updating) ? 0.6 : 1
                }}
              >
                {sendingEmail || updating ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Creation Modal */}
      {showShipmentModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)'
          }}
          onClick={handleCancelShipmentModal}
        >
          <div
            style={{
              background: 'var(--bg-bright-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              maxWidth: '600px',
              width: '100%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
              <button
                onClick={handleCancelShipmentModal}
                style={{
                  position: 'absolute',
                  top: 'var(--space-4)',
                  right: 'var(--space-4)',
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--text-bright-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            <h3 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-6)'
            }}>
              Create Shipment
            </h3>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-2)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Courier *
              </label>
              <select
                value={shipmentForm.courier}
                onChange={(e) => handleCourierChange(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="">Select courier...</option>
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.courier_name}>
                    {courier.courier_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-2)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Tracking Number *
              </label>
              <input
                type="text"
                value={shipmentForm.trackingNumber}
                onChange={(e) => handleTrackingNumberChange(e.target.value)}
                className="input-field"
                placeholder="Enter tracking number"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-2)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Tracking URL {!shipmentForm.courier && '(Required if courier not in list)'}
              </label>
              <input
                type="text"
                value={shipmentForm.trackingUrl}
                onChange={(e) => setShipmentForm(prev => ({ ...prev, trackingUrl: e.target.value }))}
                className="input-field"
                placeholder="Will auto-fill if courier is selected"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelShipmentModal}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'transparent',
                  color: 'var(--text-bright-primary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShipment}
                disabled={creatingShipment || !shipmentForm.courier || !shipmentForm.trackingNumber}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-white)',
                  cursor: (creatingShipment || !shipmentForm.courier || !shipmentForm.trackingNumber) ? 'not-allowed' : 'pointer',
                  opacity: (creatingShipment || !shipmentForm.courier || !shipmentForm.trackingNumber) ? 0.6 : 1
                }}
              >
                {creatingShipment ? 'Creating...' : 'Create Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          zIndex: 1001,
          whiteSpace: 'nowrap',
          WebkitAnimation: 'slideUpFade 0.3s ease-out, fadeOut 0.3s ease-in 2.7s',
          animation: 'slideUpFade 0.3s ease-out, fadeOut 0.3s ease-in 2.7s',
          WebkitAnimationFillMode: 'forwards',
          animationFillMode: 'forwards'
        }}>
          {notificationMessage}
        </div>
      )}
    </div>
  );
}

