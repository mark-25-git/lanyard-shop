'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { generateOrderNumber } from '@/lib/pricing';
import HelpSection from '@/components/HelpSection';
import FloatingCustomerService from '@/components/FloatingCustomerService';
import { trackEvent } from '@/lib/ga';
import { useTranslation } from 'react-i18next';

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
  promo_code?: string | null; // Promo code if applied
}

interface PaymentData {
  quantity: number;
  unit_price: number;
  total_price: number;
  checkoutData: CheckoutData;
  promo_code?: string | null;
  discount_amount?: number;
}

export default function PaymentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

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

      // Load promo code from sessionStorage if exists
      const storedPromoCode = sessionStorage.getItem('promoCode');
      const storedDiscountInfo = sessionStorage.getItem('discountInfo');
      let promoCode: string | null = null;
      let discountAmount = 0;
      let finalTotal = data.data.total_price;

      if (storedPromoCode && storedDiscountInfo) {
        try {
          const discountInfo = JSON.parse(storedDiscountInfo);
          promoCode = discountInfo.code;
          discountAmount = discountInfo.discount_amount;
          finalTotal = discountInfo.final_total;
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Store validated server-calculated price
      setPaymentData({
        quantity: checkoutData.quantity,
        unit_price: data.data.unit_price,
        total_price: finalTotal,
        checkoutData,
        promo_code: promoCode,
        discount_amount: discountAmount,
      });

      // Generate order number for payment reference
      setOrderNumber(generateOrderNumber());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payment.errors.loadFailed'));
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
      alert(t('payment.notifications.copyFailed'));
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
            {t('payment.returnToCustomize')}
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
            {t('payment.bankNotConfigured')}
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
        <h1 className="page-title" style={{ 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-6)'
        }}>
          {t('payment.title')}
        </h1>

        {/* Prominent Total Amount Section */}
        <div style={{ 
          padding: 'var(--space-8)', 
          marginBottom: 'var(--space-4)',
          background: 'var(--bg-bright-secondary)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-bright-secondary)',
            marginBottom: 'var(--space-2)'
          }}>
            {t('payment.totalAmountToPay')}
          </p>
          <p style={{
            fontSize: 'var(--text-5xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-bright-primary)',
            margin: 0
          }}>
            {formatCurrency(paymentData.total_price)}
          </p>
        </div>

        {/* Order Summary Section */}
        <div className="card" style={{ 
          padding: 'var(--space-6)', 
          marginBottom: 'var(--space-4)'
        }}>
          <h3 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('payment.orderSummary')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Lanyard Specs */}
            <div>
              <p style={{ 
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-secondary)',
                marginBottom: 'var(--space-2)'
              }}>
                Lanyard Specs
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: 'var(--text-sm)',
                color: 'var(--text-bright-primary)'
              }}>
                <li style={{ marginBottom: 'var(--space-1)' }}>• {t('pricingPreview.spec2cm')}</li>
                <li style={{ marginBottom: 'var(--space-1)' }}>• {t('pricingPreview.spec2sided')}</li>
                <li>• {t('pricingPreview.specHook')}</li>
              </ul>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-secondary)'
              }}>
                {t('pricingPreview.labelQuantity')}
              </span>
              <span style={{ 
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                {paymentData.quantity} {t('pricingPreview.pieces')}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-secondary)'
              }}>
                {t('pricingPreview.labelUnitPrice')}
              </span>
              <span style={{ 
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                {formatCurrency(paymentData.unit_price)}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-secondary)'
              }}>
                {t('pricingPreview.labelDelivery')}
              </span>
              <span style={{ 
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                {t('pricingPreview.valueFree')}
              </span>
            </div>
            {/* Promo Code Discount Display */}
            {paymentData.promo_code && paymentData.discount_amount && paymentData.discount_amount > 0 && (
              <div style={{ 
                marginTop: 'var(--space-3)',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--color-gray-200)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-2)'
                }}>
                  <span style={{ 
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-bright-secondary)'
                  }}>
                    {t('checkout.summary.subtotal')}
                  </span>
                  <span style={{ 
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-bright-primary)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    {formatCurrency(paymentData.unit_price * paymentData.quantity)}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-bright-secondary)'
                  }}>
                    {t('checkout.promo.inputLabel')} ({paymentData.promo_code})
                  </span>
                  <span style={{ 
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-bright-primary)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    -{formatCurrency(paymentData.discount_amount)}
                  </span>
                </div>
              </div>
            )}
            <div style={{ 
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-gray-200)',
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'var(--space-2)'
            }}>
              <span style={{ 
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-bright-primary)'
              }}>
                {t('pricingPreview.labelTotal')}
              </span>
              <span style={{ 
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-bright-primary)'
              }}>
                {formatCurrency(paymentData.total_price)}
              </span>
            </div>
            {/* Canva Design Link - Moved below Total */}
            {paymentData.checkoutData.design_file_url && (
              <div style={{ 
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--color-gray-200)'
              }}>
                <p style={{ 
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-bright-secondary)',
                  marginBottom: 'var(--space-2)'
                }}>
                  Your Canva Design Link
                </p>
                <a
                  href={paymentData.checkoutData.design_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-primary)',
                    textDecoration: 'underline',
                    wordBreak: 'break-all',
                    display: 'block'
                  }}
                >
                  {paymentData.checkoutData.design_file_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Design Confirmation Banner */}
        <div style={{
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
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
            {t('payment.designConfirmation')}
          </p>
        </div>

        {/* Delivery Confirmation Banner */}
        <div style={{
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
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
            {t('customize.delivery.estimatedLabel')} {(() => {
              const deliveryDate = new Date();
              deliveryDate.setDate(deliveryDate.getDate() + 14); // 2 weeks from today
              return deliveryDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              });
            })()}
          </p>
        </div>

        {/* Payment Method Section */}
        <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ 
            fontSize: 'var(--text-2xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-6)'
          }}>
            {t('payment.paymentMethod')}
          </h2>

          {/* Bank Transfer Option */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)'
            }}>
              <i className="bi bi-bank" style={{
                fontSize: 'var(--text-2xl)',
                color: 'var(--color-primary)'
              }}></i>
              <span style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {t('payment.duitnowBankTransfer')}
              </span>
            </div>

            {/* Step 1 */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-primary)',
                margin: 0
              }}>
                {t('payment.step1')}
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-bright-primary)',
                margin: '0 0 var(--space-4) 0'
              }}
                dangerouslySetInnerHTML={{
                  __html: t('payment.step2', { 
                    amount: formatCurrency(paymentData.total_price)
                  }).replace('{{amount}}', `<strong>${formatCurrency(paymentData.total_price)}</strong>`)
                }}
              />

              {/* Bank Transfer Details */}
              <div style={{ 
                background: 'var(--bg-bright-secondary)',
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)'
              }}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <p style={{ 
                    color: 'var(--text-bright-tertiary)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    {t('payment.bankName')}
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
                    {t('payment.accountNumber')}
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
                    onClick={() => handleCopy(BANK_ACCOUNT, t('payment.notifications.accountNumberCopied'))}
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
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <button
                      onClick={() => setShowQRModal(true)}
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
                      {t('payment.showQR')}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <p style={{ 
                    color: 'var(--text-bright-tertiary)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    {t('payment.recipientReference')}
                  </p>
                  <p style={{ 
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-bright-primary)',
                    letterSpacing: '0.05em',
                    margin: 0,
                    display: 'inline'
                  }}>
                    {orderNumber}
                  </p>
                  {' '}
                  <button
                    onClick={() => {
                      // Extract the part after the dash (e.g., INV-2511255ZX50E -> 2511255ZX50E)
                      const referencePart = orderNumber.includes('-') 
                        ? orderNumber.substring(orderNumber.indexOf('-') + 1)
                        : orderNumber;
                      handleCopy(referencePart, t('payment.notifications.recipientReferenceCopied'));
                    }}
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

                <div>
                  <p style={{ 
                    color: 'var(--text-bright-tertiary)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    {t('payment.accountName')}
                  </p>
                  <p style={{ 
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    {BANK_ACCOUNT_NAME}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Protection Guarantee - moved above button */}
        <div style={{ 
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          background: 'var(--bg-bright-secondary)',
          borderRadius: 'var(--radius-xl)'
        }}>
          <i className="bi bi-shield-fill-check" style={{
            fontSize: 'var(--text-3xl)',
            color: 'var(--text-bright-primary)',
            marginBottom: 'var(--space-3)',
            display: 'block'
          }}></i>
          <h2 style={{ 
            fontSize: 'var(--text-3xl)',
            fontWeight: '600',
            margin: '0 0 var(--space-3) 0',
            color: 'var(--text-bright-primary)',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            {t('payment.moneyBackGuarantee')}
          </h2>
          
          <p style={{ 
            fontSize: 'var(--text-base)',
            lineHeight: '1.47059',
            color: 'var(--text-bright-secondary)',
            margin: '0',
            maxWidth: '520px',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontWeight: '400'
          }}>
            {t('payment.guaranteeText')}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={async () => {
              if (!paymentData || !orderNumber) return;
              
              setSubmitting(true);
              
              try {
                trackEvent('payment_confirm_click', {
                  location: 'payment_page',
                  quantity: paymentData.quantity,
                });
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
                    promo_code: paymentData.promo_code || null, // Promo code if applied
                    discount_amount: paymentData.discount_amount || 0, // Discount amount
                  }),
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to create order');
                }

                // Clear session storage
                sessionStorage.removeItem('checkoutData');
                sessionStorage.removeItem('promoCode');
                sessionStorage.removeItem('discountInfo');

                // Redirect to confirmation page with token
                const confirmationToken = data.data?.confirmation_token;
                if (confirmationToken) {
                  router.push(`/confirmation?token=${encodeURIComponent(confirmationToken)}`);
                } else {
                  // Fallback to order number if token not available (shouldn't happen)
                  console.error('Confirmation token not received from API');
                  router.push(`/confirmation?order_number=${encodeURIComponent(orderNumber)}`);
                }
              } catch (err) {
                alert(err instanceof Error ? err.message : t('payment.errors.createOrderFailedRetry'));
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
              t('payment.confirmPaymentButton')
            )}
          </button>
          <p style={{
            marginTop: 'var(--space-4)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-bright-secondary)',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            {t('payment.verificationNote')}
          </p>
          <p style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-bright-secondary)',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            {t('payment.designFilesNote')}
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

      <HelpSection />

      {/* QR Code Modal */}
      {showQRModal && (
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
          onClick={() => setShowQRModal(false)}
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
              onClick={() => setShowQRModal(false)}
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
              marginBottom: 'var(--space-4)',
              textAlign: 'center'
            }}>
              {t('payment.qrModal.title')}
            </h3>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)'
            }}>
              <img
                src="/images/payment/payment-qr.png"
                alt="Payment QR Code"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 'var(--radius-lg)'
                }}
              />
            </div>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-bright-secondary)',
              textAlign: 'center',
              margin: 0
            }}>
              {t('payment.qrModal.scanText')}
            </p>
          </div>
        </div>
      )}

      <FloatingCustomerService />
    </div>
  );
}

