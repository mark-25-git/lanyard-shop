'use client';

import { useEffect, useState, useRef } from 'react';
import QuantitySelector from '@/components/QuantitySelector';
import LanyardCarousel from '@/components/LanyardCarousel';
import PriceDisplay from '@/components/PriceDisplay';

// Smooth scroll helper for slower, eased animation inside preview container
function smoothScrollTo(container: HTMLElement, targetScrollTop: number, duration = 1600) {
  const start = container.scrollTop;
  const change = targetScrollTop - start;
  const startTime = performance.now();

  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease in-out cubic for a smooth feel
    const easeInOutCubic =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    container.scrollTop = start + change * easeInOutCubic;

    if (elapsed < duration) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
}

export default function FeaturePricing() {
  const [quantity, setQuantity] = useState(50); // Start at 50 for auto-player
  const [priceData, setPriceData] = useState<{ unitPrice: number; totalPrice: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); // Start stopped; will enable when in view
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const priceCardRef = useRef<HTMLDivElement>(null);
  const isInCycleRef = useRef(false); // Track if we're in the middle of an auto-play cycle
  const rootRef = useRef<HTMLDivElement | null>(null); // Root container for IntersectionObserver
  const hasRunOnceRef = useRef(false); // Track if auto-player has already run once this session

  // Price calculation effect
  useEffect(() => {
    const calculatePrice = async () => {
      if (quantity < 50 || quantity >= 600) {
        setPriceData(null);
        setLoading(false);
        return;
      }

      setLoading(true);

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
        // For the landing preview, silently fail and leave priceData as null
        console.error('Failed to calculate price for preview', err);
        setPriceData(null);
      } finally {
        setLoading(false);
      }
    };

    calculatePrice();
  }, [quantity]);

  // Auto-player effect - initialize when isAutoPlaying changes
  useEffect(() => {
    if (!isAutoPlaying) {
      // Clear interval if auto-play is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isInCycleRef.current = false;
      return;
    }

    // Start the auto-player cycle
    const startCycle = () => {
      // Don't start if already in cycle
      if (isInCycleRef.current) return;
      
      // Mark that we're starting a cycle
      isInCycleRef.current = true;

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set initial quantity to 50
      setQuantity(50);

      // Auto-increment from 50 to 100
      intervalRef.current = setInterval(() => {
        setQuantity((prev) => {
          if (prev >= 100) {
            // Reached 100, stop incrementing
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            // Wait for price calculation (almost immediate), then scroll
            setTimeout(() => {
              if (priceCardRef.current) {
                // Check if price card is visible
                const rect = priceCardRef.current.getBoundingClientRect();
                // Find the scrollable container (either .lanyard-landing-hero-preview or .feature-pricing-preview)
                const container = priceCardRef.current.closest('.feature-pricing-preview') as HTMLElement;
                
                if (container) {
                  const containerRect = container.getBoundingClientRect();
                  // Check if element is substantially visible (e.g., at least 80%)
                  const isVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
                  
                  // Always scroll if not fully visible, or just to be safe since we want to highlight it
                  if (!isVisible || true) { // Force scroll to ensure user sees it
                    // Calculate target scroll so price card is centered
                    const currentScroll = container.scrollTop;
                    // Position relative to container top
                    const elementTop = rect.top - containerRect.top + currentScroll;
                    // Center it: elementTop - (containerHeight/2) + (elementHeight/2)
                    const targetScrollTop = elementTop - (containerRect.height / 2) + (rect.height / 2);
                    
                    smoothScrollTo(container, Math.max(0, targetScrollTop), 1600);
                  }
                }
              }
              
              // Wait 2 seconds to show price, then stop auto-player
              setTimeout(() => {
                isInCycleRef.current = false; // Reset cycle flag
                setIsAutoPlaying(false); // Run only once
              }, 2000);
            }, 0); // Immediate scroll after update
            
            return prev;
          }
          
          // Increment by 10
          return prev + 10;
        });
      }, 800); // 800ms interval
    };

    // Start the cycle
    startCycle();

    // Cleanup on unmount or when isAutoPlaying becomes false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isInCycleRef.current = false;
    };
  }, [isAutoPlaying]); // Only depend on isAutoPlaying

  // Start auto-player only when the feature preview scrolls into view (once per session)
  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl || hasRunOnceRef.current) return; // Don't observe if already run

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only start if scrolled into view and hasn't run before
          if (entry.isIntersecting && !hasRunOnceRef.current) {
            hasRunOnceRef.current = true; // Mark as run - prevents restart if scrolled back into view
            setIsAutoPlaying(true); // Start auto-player
          }
        });
      },
      {
        threshold: 0.4, // At least 40% of the preview in view
      }
    );

    observer.observe(rootEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="lanyard-landing-hero-preview feature-pricing-preview">
      <div className="preview-content-scaler">
        <div className="lanyard-landing-hero-preview-content">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
            {/* Your lanyard will have */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h2
                style={{
                  fontSize: 'var(--text-xl)', // One tier down from 2xl
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-4)',
                  textAlign: 'left',
                }}
              >
                Your lanyard will have
              </h2>
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-4)',
                    alignItems: 'stretch',
                  }}
                >
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      color: 'var(--text-bright-secondary)',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                    }}
                  >
                    <li style={{ marginBottom: 'var(--space-2)' }}>2cm width</li>
                    <li style={{ marginBottom: 'var(--space-2)' }}>2-sided color printing</li>
                    <li style={{ marginBottom: 'var(--space-2)' }}>Single lobster hook</li>
                  </ul>
                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'stretch',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <LanyardCarousel />
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h2
                style={{
                  fontSize: 'var(--text-xl)', // One tier down from 2xl
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-4)',
                  textAlign: 'left',
                }}
              >
                Quantity.{' '}
                <span style={{ color: 'var(--text-bright-tertiary)' }}>
                  How many do you need?
                </span>
              </h2>
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={50}
                  max={undefined}
                  readOnly={true}
                />
              </div>
            </div>

            {/* Price preview (matches customize page behavior) */}
            <div ref={priceCardRef} className="card" style={{ padding: 'var(--space-4)' }}>
              <PriceDisplay
                quantity={quantity}
                unitPrice={priceData?.unitPrice || 0}
                totalPrice={priceData?.totalPrice || 0}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

