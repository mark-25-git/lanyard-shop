'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';

const LANYARD_IMAGES = [
  '/images/landing/lanyard/bdcjuly2025.webp',
  '/images/landing/lanyard/bdcnov2025.webp',
  '/images/landing/lanyard/bloodmooncircus.webp',
  // First TEDx UTAR appears in row 2
  '/images/landing/lanyard/tedxutar.webp',
  '/images/landing/lanyard/choralexchange8.webp',
  '/images/landing/lanyard/fms.webp',
  '/images/landing/lanyard/insightignition.webp',
  '/images/landing/lanyard/nsc.webp',
  '/images/landing/lanyard/sdgxi.webp',
  '/images/landing/lanyard/ses9.webp',
  '/images/landing/lanyard/upo.webp',
  // The Santa Village appears in the last row
  '/images/landing/lanyard/thesantavillage.webp',
];

// Pattern: 2, 3, 2, 3, 2 (12 items total) for a balanced honeycomb effect
const ROW_COUNTS = [2, 3, 2, 3, 2];

// Background gradients for each lanyard image (135°)
const LANYARD_GRADIENTS: Record<string, string> = {
  '/images/landing/lanyard/bdcjuly2025.webp': 'linear-gradient(135deg, #c2a362, #852f25)',
  '/images/landing/lanyard/ses9.webp': 'linear-gradient(135deg, #dedad4, #211d1d)',
  '/images/landing/lanyard/upo.webp': 'linear-gradient(135deg, #bfa986, #344f74)',
  '/images/landing/lanyard/insightignition.webp': 'linear-gradient(135deg, #b5afac, #662019)',
  '/images/landing/lanyard/tedxutar.webp': 'linear-gradient(135deg, #a8a19f, #640f1a)',
  '/images/landing/lanyard/fms.webp': 'linear-gradient(135deg, #dbd3ce, #9e3a16)',
  '/images/landing/lanyard/nsc.webp': 'linear-gradient(135deg, #bab6b4, #444243)',
  '/images/landing/lanyard/bdcnov2025.webp': 'linear-gradient(135deg, #d9d2ce, #426c7b)',
  '/images/landing/lanyard/choralexchange8.webp': 'linear-gradient(135deg, #d5d0ce, #726d8a)',
  '/images/landing/lanyard/bloodmooncircus.webp': 'linear-gradient(135deg, #b9b3b1, #5a2e2a)',
  '/images/landing/lanyard/sdgxi.webp': 'linear-gradient(135deg, #bab4b3, #384147)',
  '/images/landing/lanyard/thesantavillage.webp': 'linear-gradient(135deg, #cbcbc4, #ae8267)',
};

interface ActiveItem {
  src: string;
  rect: DOMRect;
}

export default function LanyardShowcaseSection() {
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Timer ref to handle cleanup of closing animations
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to track ongoing expansion animations
  const expansionRafRef = useRef<number | null>(null);
  
  // Keep track of the latest activeItem for event handlers
  const activeItemRef = useRef<ActiveItem | null>(null);
  useEffect(() => {
    activeItemRef.current = activeItem;
  }, [activeItem]);

  const MODAL_WIDTH = 500;
  const MODAL_HEIGHT = 600;

  // Lock page scroll on mobile & tablet only when modal is expanded
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Match main layout breakpoints: treat widths < 1024px as tablet/mobile
    const isTabletOrMobile = window.innerWidth < 1024;
    if (!isTabletOrMobile) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    if (isExpanded) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalBodyOverflow || '';
      document.documentElement.style.overflow = originalHtmlOverflow || '';
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow || '';
      document.documentElement.style.overflow = originalHtmlOverflow || '';
    };
  }, [isExpanded]);

  const handleCardHover = (src: string, element: HTMLDivElement) => {
    // If already active
    if (activeItem?.src === src) {
        // If we are currently closing (isExpanded is false), we should re-expand it immediately
        // This handles the case where user leaves and quickly returns to the same item
        if (!isExpanded) {
            // Clear pending close timer
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
            // Force re-expansion
            setIsExpanded(true);
        }
        return;
    }

    // If there is a pending close timer, clear it to prevent race conditions
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const rect = element.getBoundingClientRect();
    
    // 1. Set active item (mounts clone at origin)
    setActiveItem({ src, rect });
    // 2. Reset expansion state (so it starts at origin)
    setIsExpanded(false);
  };

  const closeModal = useCallback(() => {
    // Animate back to origin
    setIsExpanded(false);
    
    // Clear any existing timer first
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    // Wait for transition (500ms) then unmount
    closeTimerRef.current = setTimeout(() => {
      setActiveItem(null);
      closeTimerRef.current = null;
    }, 500);
  }, []);

  const handleCardClick = (src: string, element: HTMLDivElement) => {
    if (activeItem?.src === src) {
      closeModal();
    } else {
      handleCardHover(src, element);
    }
  };

  const handleCardInteraction = (src: string, e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    if (e.type === 'click') {
      handleCardClick(src, element);
    } else {
      handleCardHover(src, element);
    }
  };

  // Effect: Trigger expansion after mount
  useEffect(() => {
    if (activeItem && !isExpanded) {
        // Cancel any existing pending expansion
        if (expansionRafRef.current) {
            cancelAnimationFrame(expansionRafRef.current);
        }

        expansionRafRef.current = requestAnimationFrame(() => {
            expansionRafRef.current = requestAnimationFrame(() => {
                // CRITICAL CHECK:
                // If closeTimerRef is set, it means the user triggered a close (mouse leave)
                // while we were waiting for the next frame.
                // In that case, DO NOT expand.
                if (closeTimerRef.current) return;

                setIsExpanded(true);
                expansionRafRef.current = null;
            });
        });
    }
    
    // Cleanup: cancel any pending frames if activeItem changes or component unmounts
    return () => {
        if (expansionRafRef.current) {
            cancelAnimationFrame(expansionRafRef.current);
        }
    };
  }, [activeItem]); // Only re-run when activeItem changes (new item hovered)

  const handleBackdropClick = () => {
    closeModal();
  };

  // Mouse tracking to close when leaving the origin area
  useEffect(() => {
    if (!activeItem) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const currentItem = activeItemRef.current;
      if (!currentItem) return;

      const { rect } = currentItem;
      const BUFFER = 30;

      const isOverOrigin =
        e.clientX >= rect.left - BUFFER &&
        e.clientX <= rect.right + BUFFER &&
        e.clientY >= rect.top - BUFFER &&
        e.clientY <= rect.bottom + BUFFER;

      if (!isOverOrigin) {
        closeModal();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [activeItem, closeModal]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Calculate dynamic styles based on state
  const cloneStyle = useMemo(() => {
    if (!activeItem) return null;

    const base: React.CSSProperties = {};

    // Position & size
    if (!isExpanded) {
      base.left = `${activeItem.rect.left}px`;
      base.top = `${activeItem.rect.top}px`;
      base.width = `${activeItem.rect.width}px`;
      base.height = `${activeItem.rect.height}px`;
    } else {
      if (typeof window !== 'undefined') {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const targetW = Math.min(MODAL_WIDTH, winW * 0.9);
        const targetH = Math.min(MODAL_HEIGHT, winH * 0.8);
        const targetX = (winW - targetW) / 2;
        const targetY = (winH - targetH) / 2;
        base.left = `${targetX}px`;
        base.top = `${targetY}px`;
        base.width = `${targetW}px`;
        base.height = `${targetH}px`;
      }
    }

    // Background: match the circular card gradient in expanded state
    if (isExpanded) {
      const gradient = LANYARD_GRADIENTS[activeItem.src];
      if (gradient) {
        base.background = gradient;
      }
    }

    return base;
  }, [activeItem, isExpanded]);

  // Build rows
  let cursor = 0;
  const rows: string[][] = [];
  ROW_COUNTS.forEach((count) => {
    rows.push(LANYARD_IMAGES.slice(cursor, cursor + count));
    cursor += count;
  });

  return (
    <>
      <section className="landing-section section-padding lanyard-showcase-section">
        <div className="container">
          <h2 className="hero-title lanyard-showcase-title fade-in">
            Hardware as good as Software.
          </h2>
          <div className="beehive-container" id="gallery-root">
            {rows.map((rowImages, rowIndex) => (
              <div key={rowIndex} className="beehive-row">
                {rowImages.map((src, imgIndex) => (
                  <div
                    key={`${rowIndex}-${imgIndex}`}
                    className={`product-card ${rowIndex > 0 ? 'tucked' : ''}`}
                    style={{ background: LANYARD_GRADIENTS[src] || undefined }}
                    onMouseEnter={(e) => handleCardInteraction(src, e)}
                    onClick={(e) => handleCardInteraction(src, e)}
                  >
                    <Image
                      src={src}
                      alt={`Lanyard ${rowIndex * 10 + imgIndex + 1}`}
                      width={100}
                      height={100}
                      className="product-image"
                      unoptimized
                    />
                  </div>
                ))}
                {rowIndex < rows.length - 1 && <div className="break" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Backdrop 
          Only 'active' (pointer-events: auto) when fully expanded.
          When closing (!isExpanded), it should not block clicks/hovers on the grid.
      */}
      <div
        className={`backdrop ${isExpanded ? 'active' : ''}`}
        onClick={handleBackdropClick}
      />

      {/* Expanded Clone */}
      {activeItem && cloneStyle && (
        <div
          className={`product-clone ${isExpanded ? 'expanded' : ''}`}
          style={cloneStyle}
        >
          <Image
            src={activeItem.src}
            alt="Expanded lanyard"
            fill
            className="product-clone-image"
            unoptimized
            priority
          />
        </div>
      )}
    </>
  );
}
