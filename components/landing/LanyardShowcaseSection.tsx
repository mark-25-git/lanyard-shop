'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

const LANYARD_IMAGES = [
  '/images/landing/lanyard/bdcjuly2025.webp',
  '/images/landing/lanyard/bdcnov2025.webp',
  '/images/landing/lanyard/bloodmooncircus.webp',
  '/images/landing/lanyard/tedxutar.webp',
  '/images/landing/lanyard/choralexchange8.webp',
  '/images/landing/lanyard/fms.webp',
  '/images/landing/lanyard/insightignition.webp',
  '/images/landing/lanyard/nsc.webp',
  '/images/landing/lanyard/sdgxi.webp',
  '/images/landing/lanyard/ses9.webp',
  '/images/landing/lanyard/upo.webp',
  '/images/landing/lanyard/thesantavillage.webp',
];

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

export default function LanyardShowcaseSection() {
  const { t } = useTranslation();

  // Carousel scroll functionality
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeDotIndex, setActiveDotIndex] = useState(0);

  const checkScrollability = useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Calculate which card is most visible
  const updateActiveDot = useCallback(() => {
    if (!carouselRef.current) return;
    
    const carousel = carouselRef.current;
    const scrollLeft = carousel.scrollLeft;
    const containerWidth = carousel.clientWidth;
    const centerX = scrollLeft + containerWidth / 2;
    
    // Find the card closest to center
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2 - carousel.getBoundingClientRect().left + scrollLeft;
      const distance = Math.abs(centerX - cardCenterX);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    setActiveDotIndex(closestIndex);
  }, []);

  useEffect(() => {
    // Check scrollability after images load
    const checkAfterLoad = () => {
      setTimeout(() => {
        checkScrollability();
        updateActiveDot();
      }, 100);
    };
    
    checkScrollability();
    updateActiveDot();
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      checkScrollability();
      updateActiveDot();
    };

    carousel.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkAfterLoad);
    window.addEventListener('load', checkAfterLoad);

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkAfterLoad);
      window.removeEventListener('load', checkAfterLoad);
    };
  }, [checkScrollability, updateActiveDot]);


  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    const scrollTo = direction === 'left' 
      ? carouselRef.current.scrollLeft - scrollAmount
      : carouselRef.current.scrollLeft + scrollAmount;
    
    carouselRef.current.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    });
  };

  // Touch/swipe support - snap to one card on tablet/mobile
  const touchStartX = useRef<number | null>(null);
  const lastTouchX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const initialScrollLeft = useRef<number>(0);

  const centerCard = useCallback((index: number) => {
    if (!carouselRef.current || !cardRefs.current[index]) return;
    
    const card = cardRefs.current[index];
    const carousel = carouselRef.current;
    const carouselRect = carousel.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const scrollLeft = carousel.scrollLeft;
    const cardLeft = cardRect.left - carouselRect.left + scrollLeft;
    const containerWidth = carousel.clientWidth;
    const cardWidth = cardRect.width;
    const targetScroll = cardLeft - (containerWidth / 2) + (cardWidth / 2);
    
    // Update active dot immediately
    setActiveDotIndex(index);
    
    carousel.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
    
    // Update after scroll completes
    setTimeout(() => {
      updateActiveDot();
      checkScrollability();
    }, 300);
  }, [updateActiveDot, checkScrollability]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    
    // Only apply snap behavior on tablet/mobile
    const isTabletOrMobile = window.innerWidth <= 1024;
    if (!isTabletOrMobile) {
      // Desktop: allow free scrolling
      touchStartX.current = e.touches[0].clientX;
      lastTouchX.current = e.touches[0].clientX;
      isDragging.current = true;
      return;
    }
    
    touchStartX.current = e.touches[0].clientX;
    lastTouchX.current = e.touches[0].clientX;
    initialScrollLeft.current = carouselRef.current.scrollLeft;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!carouselRef.current || !isDragging.current || lastTouchX.current === null) return;
    
    const isTabletOrMobile = window.innerWidth <= 1024;
    if (!isTabletOrMobile) {
      // Desktop: free scrolling
      const currentX = e.touches[0].clientX;
      const diffX = lastTouchX.current - currentX;
      carouselRef.current.scrollLeft += diffX;
      lastTouchX.current = currentX;
      return;
    }
    
    // Tablet/Mobile: follow finger but will snap on release
    const currentX = e.touches[0].clientX;
    const diffX = lastTouchX.current - currentX;
    carouselRef.current.scrollLeft += diffX;
    lastTouchX.current = currentX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !carouselRef.current) return;
    
    const isTabletOrMobile = window.innerWidth <= 1024;
    
    if (isTabletOrMobile && touchStartX.current !== null && lastTouchX.current !== null) {
      // Tablet/Mobile: snap to nearest card
      const swipeDistance = touchStartX.current - lastTouchX.current;
      const minSwipeDistance = 30; // Minimum swipe to trigger card change
      
      let targetIndex = activeDotIndex;
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        // Determine direction and target card
        if (swipeDistance > 0) {
          // Swiped left - go to next card
          targetIndex = Math.min(activeDotIndex + 1, LANYARD_IMAGES.length - 1);
        } else {
          // Swiped right - go to previous card
          targetIndex = Math.max(activeDotIndex - 1, 0);
        }
      }
      
      // Center the target card
      centerCard(targetIndex);
    }
    
    isDragging.current = false;
    
    // Update scrollability and active dot
    setTimeout(() => {
      checkScrollability();
      updateActiveDot();
    }, 100);
    
    // Reset touch tracking
    touchStartX.current = null;
    lastTouchX.current = null;
  };


  return (
    <>
      <section className="landing-section section-padding lanyard-showcase-section">
        <div className="container">
          <h2 className="hero-title lanyard-showcase-title fade-in">
            {t('showcase.title')}
          </h2>
          <div className="carousel-wrapper">
            {canScrollLeft && (
              <button
                className="carousel-nav carousel-prev"
                onClick={() => scrollCarousel('left')}
                aria-label="Previous"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <div
              className="carousel-container"
              ref={carouselRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {LANYARD_IMAGES.map((src, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) {
                      cardRefs.current[index] = el;
                    }
                  }}
                  className="product-card"
                  style={{ background: LANYARD_GRADIENTS[src] || undefined }}
                >
                  <Image
                    src={src}
                    alt={`Lanyard ${index + 1}`}
                    width={360}
                    height={432}
                    className="product-image"
                    unoptimized
                  />
                </div>
              ))}
            </div>
            {canScrollRight && (
              <button
                className="carousel-nav carousel-next"
                onClick={() => scrollCarousel('right')}
                aria-label="Next"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
          {/* Dot Navigation Indicators */}
          <div className="carousel-dots">
            {(() => {
              const totalDots = LANYARD_IMAGES.length;
              const maxVisible = 5;
              
              // Calculate which dots to show
              let startIndex = 0;
              let endIndex = Math.min(maxVisible - 1, totalDots - 1);
              
              if (totalDots > maxVisible) {
                // Center the active dot when possible
                const halfVisible = Math.floor(maxVisible / 2);
                startIndex = Math.max(0, activeDotIndex - halfVisible);
                endIndex = Math.min(totalDots - 1, startIndex + maxVisible - 1);
                
                // Adjust if we're near the end
                if (endIndex - startIndex < maxVisible - 1) {
                  startIndex = Math.max(0, endIndex - maxVisible + 1);
                }
              }
              
              const visibleDots = [];
              for (let i = startIndex; i <= endIndex; i++) {
                visibleDots.push(i);
              }
              
              return visibleDots.map((index) => (
                <div
                  key={index}
                  className={`carousel-dot ${activeDotIndex === index ? 'active' : ''}`}
                  aria-label={`Slide ${index + 1}`}
                />
              ));
            })()}
          </div>
        </div>
      </section>
    </>
  );
}
