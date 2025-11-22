'use client';

import { useState, useEffect } from 'react';

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number; // Max is 599, quantities above require contact
}

export default function QuantitySelector({ 
  value, 
  onChange, 
  min = 50, 
  max = 599 
}: QuantitySelectorProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  // Sync localValue when value prop changes
  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= max) {
      onChange(numValue);
    } else if (newValue === '' || newValue === '0') {
      // Allow empty or 0 for user input, but don't update the value
      onChange(0);
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(localValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      setLocalValue('1');
      onChange(1);
    } else if (numValue > max) {
      setLocalValue(max.toString());
      onChange(max);
    } else {
      setLocalValue(numValue.toString());
      onChange(numValue);
    }
  };

  const increment = () => {
    const newValue = Math.min(value + 10, max);
    setLocalValue(newValue.toString());
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(value - 10, 1);
    setLocalValue(newValue.toString());
    onChange(newValue);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      gap: 'var(--space-4)',
      flexWrap: 'wrap'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-2)',
        border: '1px solid var(--color-gray-300)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-1)'
      }}>
        <button
          type="button"
          onClick={decrement}
          disabled={value <= 1}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            border: 'none',
            background: 'transparent',
            cursor: value <= 1 ? 'not-allowed' : 'pointer',
            opacity: value <= 1 ? 0.5 : 1,
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-primary)'
          }}
        >
          −
        </button>
        <input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={1}
          max={max}
          step={10}
          className="quantity-input-no-spinner"
          style={{
            width: '100px',
            textAlign: 'center',
            border: 'none',
            outline: 'none',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            padding: 'var(--space-2)'
          }}
        />
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            border: 'none',
            background: 'transparent',
            cursor: value >= max ? 'not-allowed' : 'pointer',
            opacity: value >= max ? 0.5 : 1,
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-primary)'
          }}
        >
          +
        </button>
      </div>
      {value >= max && (
        <span style={{ 
          color: 'var(--text-bright-tertiary)', 
          fontSize: 'var(--text-sm)',
          width: '100%',
          textAlign: 'center'
        }}>
          • For {max + 1}+ pieces, <a 
            href="https://wa.me/60137482481?text=Hi%20Teevent!%20I%27d%20like%20to%20get%20a%20quote%20for%20more%20than%20599%20lanyards."
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
          >
            contact us
          </a>
        </span>
      )}
    </div>
  );
}

