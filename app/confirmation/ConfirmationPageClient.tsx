'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types/order';
import HelpSection from '@/components/HelpSection';
import { useTranslation } from 'react-i18next';

export default function ConfirmationPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const tokenParam = searchParams.get('token');
  // Support legacy order_number for backward compatibility during transition
  const orderNumberParam = searchParams.get('order_number') || searchParams.get('orderNumber');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Prevent duplicate API calls (React StrictMode in dev causes double-invocation)
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls
    if (hasFetchedRef.current) {
      return;
    }

    if (tokenParam) {
      hasFetchedRef.current = true;
      fetchOrderByToken();
    } else if (orderNumberParam) {
      // Legacy support: fallback to old method
      hasFetchedRef.current = true;
      fetchOrderByNumber();
    } else {
      setError(t('confirmation.errors.invalidLink'));
      setLoading(false);
    }
  }, [tokenParam, orderNumberParam]);

  const fetchOrderByToken = async () => {
    if (!tokenParam) return;
    
    try {
      const response = await fetch(`/api/confirmation/${encodeURIComponent(tokenParam)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        // Token expired or invalid
        setError(t('confirmation.errors.linkExpired'));
        setOrder(null);
        return;
      }

      setOrder(data.data);
      setError(null);
    } catch (err) {
      setError(t('confirmation.errors.loadFailed'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderByNumber = async () => {
    if (!orderNumberParam) return;
    
    try {
      const response = await fetch(`/api/get-order?order_number=${encodeURIComponent(orderNumberParam)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('confirmation.errors.fetchFailed'));
      }

      setOrder(data.data);
      setError(null);
    } catch (err) {
      setError(t('confirmation.errors.loadOrderFailed'));
      setOrder(null);
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
      alert(t('confirmation.notifications.copyFailed'));
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
          <p style={{ color: 'var(--text-bright-secondary)' }}>{t('confirmation.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container section-padding" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        margin: '0 auto',
        paddingTop: 'var(--space-8)',
        paddingBottom: 'var(--space-8)',
        maxWidth: '1200px'
      }}>
        <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: 'var(--text-3xl)', 
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('confirmation.errors.linkExpiredTitle')}
          </h1>
          <p style={{ 
            fontSize: 'var(--text-lg)',
            color: 'var(--text-bright-secondary)',
            marginBottom: 'var(--space-6)',
            lineHeight: '1.6'
          }}>
            {error.replace('This page can only be viewed once for security reasons. ', '')}
          </p>
          <a
            href="/track"
            className="btn-primary"
            style={{ 
              display: 'inline-block',
              textDecoration: 'none',
              padding: 'var(--space-3) var(--space-6)',
              fontSize: 'var(--text-base)',
              borderRadius: '9999px'
            }}
          >
            {t('confirmation.errors.goToTracking')}
          </a>
        </div>
      </div>
    );
  }

  if (!order) {
    if (!loading) {
      return (
        <div className="container section-padding">
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-bright-secondary)' }}>{t('confirmation.errors.orderNotFound')}</p>
          </div>
        </div>
      );
    }
    return null; // Still loading
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
          <h1 className="page-title" style={{ 
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('confirmation.title')}
          </h1>
          <p style={{ 
            fontSize: 'var(--text-lg)',
            color: 'var(--text-bright-secondary)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('confirmation.subtitle')}
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
            {t('confirmation.verifyingPayment.title')}
          </p>
          <p style={{ 
            fontSize: 'var(--text-base)',
            color: 'var(--text-bright-secondary)',
            margin: 0,
            lineHeight: '1.6'
          }}
            dangerouslySetInnerHTML={{
              __html: t('confirmation.verifyingPayment.description', { 
                orderNumber: order.order_number
              }).replace('{{orderNumber}}', `<strong>${order.order_number}</strong>`)
            }}
          />
        </div>

        {/* Primary Next Step: Design Submission */}
        <div style={{ marginTop: 'var(--space-16)', marginBottom: 'var(--space-16)' }}>
          <h3 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)',
            textAlign: 'center'
          }}>
            {t('confirmation.nextStep.title')}
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
            {t('confirmation.nextStep.button')}
          </a>
          <p style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-bright-secondary)',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            {t('confirmation.nextStep.note')}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('confirmation.orderDetails.title')}
          </h2>
          
          {/* Order Number - Most Prominent */}
          <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-gray-200)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-2)' }}>
              {t('confirmation.orderDetails.orderNumber')}
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
              onClick={() => handleCopy(order.order_number, t('confirmation.notifications.orderNumberCopied'))}
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
              {t('payment.copy')}
            </button>
          </div>

          {/* Information Grid */}
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                {t('confirmation.orderDetails.total')}
              </p>
              <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-bright-primary)', margin: 0 }}>
                {formatCurrency(order.total_price)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                {t('confirmation.orderDetails.quantity')}
              </p>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                {order.quantity} {t('pricingPreview.pieces')}
              </p>
            </div>
            {order.promo_code && order.discount_amount && order.discount_amount > 0 && (
              <div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                  {t('confirmation.orderDetails.promoCodeApplied')}
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
              {t('payment.lanyardSpecs')}
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-bright-secondary)'
            }}>
              <li style={{ marginBottom: 'var(--space-1)' }}>• {t('pricingPreview.spec2cm')}</li>
              <li style={{ marginBottom: 'var(--space-1)' }}>• {t('pricingPreview.spec2sided')}</li>
              <li>• {t('pricingPreview.specHook')}</li>
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
              {t('confirmation.orderDetails.shippingInformation')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {order.shipping_name && (
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                    {t('confirmation.orderDetails.recipientName')}
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.shipping_name}
                  </p>
                  {order.shipping_phone && (
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 'var(--space-1) 0 0 0' }}>
                      {order.shipping_phone}
                    </p>
                  )}
                </div>
              )}
              {order.shipping_address_line1 && (
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', marginBottom: 'var(--space-1)' }}>
                    {t('confirmation.orderDetails.shippingAddress')}
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
                    {t('confirmation.orderDetails.emailAddress')}
                  </p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                    {order.customer_email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div style={{ 
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: 'var(--text-sm)',
            color: '#92400e',
            margin: 0,
            lineHeight: '1.6'
          }}
            dangerouslySetInnerHTML={{
              __html: t('confirmation.importantNotice', { 
                orderNumber: order.order_number
              }).replace('{{orderNumber}}', `<strong>${order.order_number}</strong>`)
            }}
          />
        </div>

        {/* Secondary Actions */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <a
            href="/track"
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
            {t('confirmation.trackOrderButton')}
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


