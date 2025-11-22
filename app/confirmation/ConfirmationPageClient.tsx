'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types/order';

export default function ConfirmationPageClient() {
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
            href={`https://wa.me/60137482481?text=Hi%20Teevent!%20My%20order%20number%20is%20${encodeURIComponent(order.order_number)}.%20I%20have%20completed%20payment%20and%20would%20like%20to%20send%20my%20design%20file.`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Send Design File via WhatsApp
          </a>
        </div>

        {/* Order Details */}
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)'
          }}>
            Order Details
          </h2>
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
                Total Price
              </p>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                {formatCurrency(order.total_price)}
              </p>
            </div>
          </div>
        </div>

        {/* Track Order Button */}
        <div style={{ textAlign: 'center' }}>
          <a
            href={`/track?order_number=${encodeURIComponent(order.order_number)}`}
            className="btn-primary"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Track Your Order
          </a>
        </div>
      </div>
    </div>
  );
}

