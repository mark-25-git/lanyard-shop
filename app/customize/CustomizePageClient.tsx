'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QuantitySelector from '@/components/QuantitySelector';
import PriceDisplay from '@/components/PriceDisplay';
import TemplateDownload from '@/components/TemplateDownload';
import LanyardCarousel from '@/components/LanyardCarousel';

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
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canvaLink, setCanvaLink] = useState('');

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  // Use initial stats from server (no fetch needed)
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

  // Seamless vertical carousel for social proof stats
  useEffect(() => {
    // Don't start carousel if stats haven't loaded yet
    if (socialProofStats.length === 0) return;

    const SLIDE_DURATION_MS = 3000; // 3 seconds per slide
    const TRANSITION_DURATION_MS = 500; // CSS transition duration
    const RESET_BUFFER_MS = 50; // Small buffer before reset

    let resetTimeout: NodeJS.Timeout | null = null;

    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => {
        // If we're already at the clone, reset immediately (shouldn't happen, but safety check)
        if (prev === socialProofStats.length) {
          setIsTransitioning(false);
          setTimeout(() => {
            setCurrentStatIndex(0);
            setTimeout(() => {
              setIsTransitioning(true);
            }, 20);
          }, 0);
          return prev; // Return current to prevent increment
        }

        // Clear any pending reset
        if (resetTimeout) {
          clearTimeout(resetTimeout);
          resetTimeout = null;
        }

        const nextIndex = prev + 1;
        
        // If we're about to show the clone (index equals length), show it with transition
        if (nextIndex === socialProofStats.length) {
          // Schedule reset immediately after transition completes (not after full slide duration)
          // This keeps the interval timing consistent
          resetTimeout = setTimeout(() => {
            // Disable transition for instant reset
            setIsTransitioning(false);
            // Reset to 0 instantly (clone looks identical to first item)
            setCurrentStatIndex(0);
            // Re-enable transition after a tiny delay for next slide
            setTimeout(() => {
              setIsTransitioning(true);
            }, 20);
          }, TRANSITION_DURATION_MS + RESET_BUFFER_MS);
          
          return socialProofStats.length; // Show clone with smooth transition
        }
        
        return nextIndex;
      });
    }, SLIDE_DURATION_MS);

    return () => {
      clearInterval(interval);
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
    };
  }, [socialProofStats.length]);

  useEffect(() => {
    calculatePrice();
  }, [quantity]);

  const calculatePrice = async () => {
    if (quantity < 50) {
      setPriceData(null);
      setError(null);
      return;
    }

    if (quantity > 599) {
      setPriceData(null);
      setError('For quantities above 599 pieces, please contact us for custom pricing.');
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

          {/* Social Proof Stats - Vertical Carousel */}
          <div style={{ 
            marginBottom: 'var(--space-8)',
            height: '32px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center'
          }}>
            {/* Container for all stats stacked vertically */}
            <div 
              ref={carouselRef}
              style={{
                height: `${(socialProofStats.length + 1) * 32}px`, // Total height: 4 items × 32px = 128px
                transform: `translateY(-${currentStatIndex * 32}px)`, // Move by exact pixel amount
                transition: isTransitioning 
                  ? 'transform 0.5s ease-in-out'
                  : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
                maxWidth: 'fit-content'
              }}
            >
              {/* Original items */}
              {socialProofStats.map((stat, index) => (
                <div
                  key={`original-${index}`}
                  style={{
                    height: '32px',
                    minHeight: '32px',
                    maxHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <i className="bi bi-patch-check-fill" style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-primary)'
                  }}></i>
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-bright-secondary)',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {stat.text}
                  </span>
                </div>
              ))}
              {/* Clone of first item for seamless loop */}
              <div
                key="clone-0"
                style={{
                  height: '32px',
                  minHeight: '32px',
                  maxHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <i className="bi bi-patch-check-fill" style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-primary)'
                }}></i>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-bright-secondary)',
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {socialProofStats[0].text}
                </span>
              </div>
            </div>
          </div>

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
                  Your design prints exactly as you intended.
                </span>
              </h2>
              <TemplateDownload />
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
        marginBottom: 'var(--space-8)',
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
                fontSize: '24px',
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

          {/* Order Number & WhatsApp Instructions */}
          {priceData && quantity >= 50 && (
            <div style={{ 
              marginTop: 'var(--space-6)',
              padding: 'var(--space-6)',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: 'var(--text-base)',
                lineHeight: '1.6',
                color: 'var(--text-bright-secondary)',
                margin: '0 0 var(--space-2) 0'
              }}>
                After payment, you'll receive an order number.
              </p>
              <p style={{ 
                fontSize: 'var(--text-base)',
                lineHeight: '1.6',
                color: 'var(--text-bright-secondary)',
                margin: '0'
              }}>
                Send your design file via WhatsApp with your order number.
              </p>
            </div>
          )}

          {/* Apple-style Refund Guarantee */}
          {priceData && quantity >= 50 && (
            <div style={{ 
              marginTop: 'var(--space-8)',
              padding: 'var(--space-8) 0',
              textAlign: 'center'
            }}>
              <i className="bi bi-shield-fill-check" style={{
                fontSize: '32px',
                color: 'var(--text-bright-primary)',
                marginBottom: 'var(--space-3)',
                display: 'block'
              }}></i>
              <h2 style={{ 
                fontSize: '28px',
                fontWeight: '600',
                margin: '0 0 var(--space-3) 0',
                color: 'var(--text-bright-primary)',
                letterSpacing: '-0.02em',
                lineHeight: '1.2'
              }}>
                Your payment is protected.
              </h2>
              
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
                If we determine your design cannot be produced, 
                you'll receive a full refund. No questions asked.
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

          {priceData && quantity >= 50 && (
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
    </>
  );
}


