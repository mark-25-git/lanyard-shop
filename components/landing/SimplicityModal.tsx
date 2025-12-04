'use client';

import { useEffect } from 'react';

interface SimplicityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimplicityModal({ isOpen, onClose }: SimplicityModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus management
      const closeButton = document.getElementById('simplicity-modal-close');
      if (closeButton) {
        closeButton.focus();
      }
    } else {
      document.body.style.overflow = '';
    }

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="simplicity-modal" 
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('modal-overlay')) {
          onClose();
        }
      }}
    >
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="simplicity-modal-content" onClick={(e) => e.stopPropagation()}>
        <button 
          id="simplicity-modal-close"
          className="modal-close" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="simplicity-modal-body">
          <div className="simplicity-modal-header">
            <h3 className="simplicity-modal-title">Why ordering at Teevent is simple</h3>
          </div>
          
          <div className="simplicity-modal-article">
            <p>
              You might wonder how we can give you a price right away while other suppliers ask so many questions first.
            </p>
            
            <p>
              Here's the simple truth. Pricing for custom lanyards really comes down to one thing: how many you need. We offer one standard option: a 2cm width lanyard with color printing on both sides. That's it. The price depends on your quantity, nothing else.
            </p>
            
            <p>
              So why do some suppliers make it complicated? Sometimes they ask lots of questions not to calculate your price, but to figure out how much you might pay. The price you get can depend more on your answers than on what you're actually ordering.
            </p>
            
            <p>
              We think pricing should be clear and fair. That's why we put our prices where everyone can see them. You know what everything costs before you start. No long conversations needed. You see the price right away, compare your options, and decide what works for you.
            </p>
            
            <p>
              That's why ordering works like any other online shop. You pick your options. You see the price update. You upload your design. You place your order. Simple, because it should be.
            </p>
            
            <p>
              No negotiations. No wondering. Just clear prices, clear options, and a simple way to order. That's how it should work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

