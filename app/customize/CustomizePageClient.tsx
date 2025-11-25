'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuantitySelector from '@/components/QuantitySelector';
import PriceDisplay from '@/components/PriceDisplay';
import TemplateDownload from '@/components/TemplateDownload';
import LanyardCarousel from '@/components/LanyardCarousel';
import HelpSection from '@/components/HelpSection';
import CustomCheckbox from '@/components/CustomCheckbox';

interface SocialProofStats {
  text: string;
}

interface CustomizePageClientProps {
  initialStats: {
    unique_events: number;
    lanyards_delivered: number;
    complaints: number;
  };
}

export default function CustomizePageClient({ initialStats }: CustomizePageClientProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(100);
  const [priceData, setPriceData] = useState<{
    unitPrice: number;
    totalPrice: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvaLink, setCanvaLink] = useState('');
  const [freeDesignReview, setFreeDesignReview] = useState(true);

  // Stats data kept for future use on product landing page
  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  // Use initial stats from server (no fetch needed)
  // Kept for future use on product landing page
  const socialProofStats: SocialProofStats[] = [
    {
      text: `Trusted by ${formatNumber(initialStats.unique_events)} Events`
    },
    {
      text: `${formatNumber(initialStats.lanyards_delivered)} Lanyards Delivered`
    },
    {
      text: `${formatNumber(initialStats.complaints)} Complaints`
    }
  ];

  useEffect(() => {
    calculatePrice();
  }, [quantity]);

  const calculatePrice = async () => {
    if (quantity < 50) {
      setPriceData(null);
      setError(null);
      return;
    }

    if (quantity >= 600) {
      setPriceData(null);
      setError(null); // No error, just show contact message in PriceDisplay
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate price');
      }

      setPriceData({
        unitPrice: data.data.unit_price,
        totalPrice: data.data.total_price,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate price');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (priceData && quantity >= 50) {
      // Store quantity and price in sessionStorage for checkout
      sessionStorage.setItem('orderQuantity', quantity.toString());
      sessionStorage.setItem('orderUnitPrice', priceData.unitPrice.toString());
      sessionStorage.setItem('orderTotalPrice', priceData.totalPrice.toString());
      // Store Canva link if provided
      if (canvaLink.trim()) {
        sessionStorage.setItem('canvaLink', canvaLink.trim());
      }
      router.push('/checkout');
    }
  };

  return (
    <>
      <div className="container section-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'var(--text-4xl)', 
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-8)'
          }}>
            Customize your lanyard.
          </h1>


          <div style={{ marginBottom: 'var(--space-8)' }}>
            {/* Your lanyard will have */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-4)'
              }}>
                Your lanyard will have
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-6)',
                  alignItems: 'stretch'
                }}>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0,
                    color: 'var(--text-bright-secondary)',
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start'
                  }}>
                    <li style={{ marginBottom: 'var(--space-2)' }}>2cm width</li>
                    <li style={{ marginBottom: 'var(--space-2)' }}>2-sided color printing</li>
                    <li style={{ marginBottom: 'var(--space-2)' }}>Single lobster hook</li>
                  </ul>
                  <div style={{
                    flex: '1',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'flex-end'
                  }}>
                    <LanyardCarousel />
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-4)'
              }}>
                Quantity.{' '}
                <span style={{ color: 'var(--text-bright-tertiary)' }}>
                  How many do you need?
                </span>
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={50}
                  max={undefined}
                />
                {quantity > 0 && quantity < 50 && (
                  <div style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'var(--bg-bright-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-bright-primary)'
                  }}>
                    <p style={{ marginBottom: 'var(--space-2)' }}>
                      50pcs lanyard is only{' '}
                      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>RM195</span>.
                      {' '}
                      <button
                        type="button"
                        onClick={() => setQuantity(50)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                          font: 'inherit'
                        }}
                      >
                        Order 50?
                      </button>
                    </p>
                    <p style={{ marginTop: 'var(--space-2)' }}>
                      For quantity less than 50,{' '}
                      <a
                        href="https://wa.me/60137482481?text=Hi%20Teevent!%20I%27d%20like%20to%20order%20less%20than%2050%20lanyards."
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--color-primary)',
                          textDecoration: 'underline'
                        }}
                      >
                        contact us
                      </a>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Design Template */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-4)'
              }}>
                Use our template.{' '}
                <span style={{ color: 'var(--text-bright-tertiary)' }}>
                  Design directly in our template to avoid misalignment.
                </span>
              </h2>
              <TemplateDownload />
              <p style={{
                marginTop: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-bright-secondary)',
                lineHeight: '1.6'
              }}>
                By using our template, we can avoid the size adjustment process.
              </p>
              <p style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-bright-secondary)',
                lineHeight: '1.6'
              }}>
                During size adjustment process, your design might be misaligned.
              </p>
            </div>

            {/* Canva Link Input */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-4)'
              }}>
                Designed with{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #01c3cc 0%, #7c2be8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  Canva
                </span>
                ?{' '}
                <span style={{ color: 'var(--text-bright-tertiary)' }}>
                  Share your design link (optional)
                </span>
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <div className="floating-label-wrapper">
                  <input
                    type="url"
                    value={canvaLink}
                    onChange={(e) => setCanvaLink(e.target.value)}
                    className={`floating-label-input ${canvaLink ? 'has-value' : ''}`}
                    placeholder=" "
                  />
                  <label className="floating-label">
                    Canva Design Link (Optional)
                  </label>
                </div>
                <p style={{
                  marginTop: 'var(--space-3)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-bright-tertiary)'
                }}>
                  If you have used our template and designed in Canva, paste link here.
                </p>
              </div>
              <div style={{
                marginTop: 'var(--space-4)'
              }}>
                <CustomCheckbox
                  checked={freeDesignReview}
                  onChange={() => setFreeDesignReview(true)}
                  label="Get free design review by us before production."
                  id="free-design-review"
                  labelStyle={{ fontSize: 'var(--text-base)' }}
                />
              </div>
            </div>

            {/* Other Design File Instruction */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ 
                fontSize: 'var(--text-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-4)'
              }}>
                If you're using PS or AI, you'll be instructed to send it to us after payment.
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width price section - breaks out of container */}
      <div style={{ 
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        marginBottom: 0,
        background: '#f1f3f5'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)'
        }}>
          <PriceDisplay
            quantity={quantity}
            unitPrice={priceData?.unitPrice || 0}
            totalPrice={priceData?.totalPrice || 0}
            isLoading={loading}
          />

          {/* Estimated Delivery Date */}
          {priceData && quantity >= 50 && (
            <div style={{
              marginTop: 'var(--space-6)',
              padding: 'var(--space-4)',
              textAlign: 'center'
            }}>
              <i className="bi bi-calendar" style={{
                fontSize: 'var(--text-2xl)',
                color: 'var(--text-bright-primary)',
                marginBottom: 'var(--space-2)',
                display: 'block'
              }}></i>
              <p style={{
                fontSize: 'var(--text-base)',
                lineHeight: '1.6',
                color: 'var(--text-bright-secondary)',
                margin: '0'
              }}>
                Estimated delivery:{' '}
                <span style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-bright-primary)'
                }}>
                  {(() => {
                    const deliveryDate = new Date();
                    deliveryDate.setDate(deliveryDate.getDate() + 14); // 2 weeks from today
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
          )}


          {/* Checkout Button - Moved inside price section */}
          {error && (
            <div style={{
              marginTop: 'var(--space-6)',
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: 'var(--radius-xl)',
              fontSize: 'var(--text-sm)',
            }}>
              {error}
            </div>
          )}

          {priceData && quantity >= 50 && quantity < 600 && (
            <div style={{ 
              marginTop: 'var(--space-6)',
              paddingBottom: 'var(--space-6)'
            }}>
              <button
                onClick={handleCheckout}
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  padding: 'var(--space-4)',
                  fontSize: 'var(--text-lg)',
                  borderRadius: 'var(--radius-xl)'
                }}
              >
                Check Out
              </button>
            </div>
          )}
          {quantity >= 600 && (
            <div style={{ 
              marginTop: 'var(--space-6)',
              paddingBottom: 'var(--space-6)'
            }}>
              <button
                disabled
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  padding: 'var(--space-4)',
                  fontSize: 'var(--text-lg)',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  borderRadius: 'var(--radius-xl)'
                }}
              >
                Check Out
              </button>
              <p style={{
                marginTop: 'var(--space-3)',
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-bright-tertiary)'
              }}>
                Please contact us for orders of 600+ pieces
              </p>
            </div>
          )}
          {quantity > 0 && quantity < 50 && (
            <div style={{ 
              marginTop: 'var(--space-6)',
              paddingBottom: 'var(--space-6)'
            }}>
              <button
                disabled
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  padding: 'var(--space-4)',
                  fontSize: 'var(--text-lg)',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  borderRadius: 'var(--radius-xl)'
                }}
              >
                Check Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Continue with rest of content */}
      <div className="container section-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <HelpSection />
        </div>
      </div>
    </>
  );
}


