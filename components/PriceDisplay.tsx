'use client';

import { formatCurrency } from '@/lib/utils';

interface PriceDisplayProps {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isLoading?: boolean;
}

export default function PriceDisplay({ 
  quantity, 
  unitPrice, 
  totalPrice, 
  isLoading = false 
}: PriceDisplayProps) {
  if (isLoading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 'var(--space-8)'
      }}>
        <div className="modern-spinner" style={{
          marginBottom: 'var(--space-4)',
          justifyContent: 'center'
        }}>
          <div className="modern-spinner-dot"></div>
          <div className="modern-spinner-dot"></div>
          <div className="modern-spinner-dot"></div>
        </div>
        <p style={{ color: 'var(--text-bright-tertiary)' }}>Calculating price...</p>
      </div>
    );
  }

  if (!quantity || quantity < 50) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 'var(--space-8)'
      }}>
        <p style={{ color: 'var(--text-bright-tertiary)' }}>
          Enter a quantity of at least 50 pieces to see pricing.
        </p>
      </div>
    );
  }

  if (quantity > 599) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 'var(--space-8)'
      }}>
        <p style={{ color: 'var(--text-bright-tertiary)', marginBottom: 'var(--space-4)' }}>
          For quantities above 599 pieces, please contact us for custom pricing.
        </p>
        <a
          href="https://wa.me/60137482481?text=Hi%20Teevent!%20I%27d%20like%20to%20get%20a%20quote%20for%20more%20than%20599%20lanyards."
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ display: 'inline-block' }}
        >
          Contact Us for Pricing
        </a>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 'var(--space-8)'
    }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 'var(--space-2)'
        }}>
          <span style={{ color: 'var(--text-bright-secondary)' }}>Quantity</span>
          <span>{quantity} pieces</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 'var(--space-2)'
        }}>
          <span style={{ color: 'var(--text-bright-secondary)' }}>Unit Price</span>
          <span>{formatCurrency(unitPrice)}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 'var(--space-2)'
        }}>
          <span style={{ color: 'var(--text-bright-secondary)' }}>Delivery</span>
          <span>Free</span>
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
          <span>Total Price</span>
          <span style={{ color: 'var(--text-bright-primary)' }}>
            {formatCurrency(totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}

