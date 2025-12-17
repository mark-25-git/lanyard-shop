"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number; // Optional max limit (removed default 599 limit)
  readOnly?: boolean; // Optional read-only mode for auto-play
  showVolumeBenefits?: boolean; // Optional flag to show/hide 600+ volume benefits card
  showButtons?: boolean; // Optional flag to show/hide increment/decrement buttons
  placeholder?: number; // Optional placeholder value for the input (used in hero)
}

export default function QuantitySelector({ 
  value, 
  onChange, 
  min = 50, 
  max,
  readOnly = false,
  showVolumeBenefits = true,
  showButtons = true,
  placeholder,
}: QuantitySelectorProps) {
  const { t } = useTranslation();
  const [isDirty, setIsDirty] = useState(false);
  const [localValue, setLocalValue] = useState(
    placeholder !== undefined ? '' : value.toString()
  );

  // Sync localValue when value prop changes
  useEffect(() => {
    // If we have a placeholder and the user hasn't typed yet,
    // keep the input visually empty so the placeholder shows.
    if (placeholder !== undefined && !isDirty) {
      return;
    }
    setLocalValue(value.toString());
  }, [value, placeholder, isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsDirty(true);
    
    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && (max === undefined || numValue <= max)) {
      onChange(numValue);
    } else if (newValue === '' || newValue === '0') {
      // For placeholder usage, falling back to the placeholder keeps UX simple.
      if (placeholder !== undefined) {
        onChange(placeholder);
      } else {
        // Allow empty or 0 for user input, but don't update the value meaningfully
        onChange(0);
      }
    } else if (!isNaN(numValue) && numValue > 0) {
      // Allow any positive number (no max limit)
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(localValue, 10);
    if (placeholder !== undefined && (localValue === '' || isNaN(numValue))) {
      // If nothing entered, keep the field visually empty and rely on placeholder.
      setLocalValue('');
      onChange(placeholder);
      return;
    }

    if (isNaN(numValue) || numValue < 1) {
      setLocalValue('1');
      onChange(1);
    } else if (max !== undefined && numValue > max) {
      setLocalValue(max.toString());
      onChange(max);
    } else {
      setLocalValue(numValue.toString());
      onChange(numValue);
    }
  };

  const increment = () => {
    const newValue = max !== undefined ? Math.min(value + 10, max) : value + 10;
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
      display: "flex", 
      justifyContent: "center",
      alignItems: "center",
      gap: "var(--space-4)",
      flexWrap: "wrap"
    }}>
      {showButtons ? (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "var(--space-2)",
          border: "1px solid var(--color-gray-300)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-1)"
        }}>
          <button
            type="button"
            onClick={decrement}
            disabled={value <= 1 || readOnly}
            style={{
              padding: "var(--space-2) var(--space-4)",
              border: "none",
              background: "transparent",
              cursor: (value <= 1 || readOnly) ? "not-allowed" : "pointer",
              opacity: (value <= 1 || readOnly) ? 0.5 : 1,
              fontSize: "var(--text-xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-primary)"
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
            readOnly={readOnly}
            placeholder={placeholder !== undefined ? placeholder.toString() : undefined}
            className="quantity-input-no-spinner"
            style={{
              width: "100px",
              textAlign: "center",
              border: "none",
              outline: "none",
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-weight-semibold)",
              padding: "var(--space-2)",
              cursor: readOnly ? "default" : "text"
            }}
          />
          <button
            type="button"
            onClick={increment}
            disabled={(max !== undefined && value >= max) || readOnly}
            style={{
              padding: "var(--space-2) var(--space-4)",
              border: "none",
              background: "transparent",
              cursor: ((max !== undefined && value >= max) || readOnly) ? "not-allowed" : "pointer",
              opacity: ((max !== undefined && value >= max) || readOnly) ? 0.5 : 1,
              fontSize: "var(--text-xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-primary)"
            }}
          >
            +
          </button>
        </div>
      ) : (
        <input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={1}
          max={max}
          step={10}
          readOnly={readOnly}
          placeholder={placeholder !== undefined ? placeholder.toString() : undefined}
          className="quantity-input-no-spinner"
          style={{
            width: "100px",
            textAlign: "center",
            border: "1px solid var(--color-gray-300)",
            borderRadius: "var(--radius-xl)",
            outline: "none",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--font-weight-semibold)",
            padding: "var(--space-2)",
            cursor: readOnly ? "default" : "text"
          }}
        />
      )}
      {showVolumeBenefits && value >= 600 && (
        <div style={{ 
          width: "100%",
          marginTop: "var(--space-4)",
          padding: "var(--space-6)",
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          borderRadius: "var(--radius-lg)",
          textAlign: "left"
        }}>
          <p style={{ 
            color: "var(--text-bright-primary)", 
            fontSize: "var(--text-base)",
            fontWeight: "var(--font-weight-semibold)",
            margin: "0 0 var(--space-4) 0"
          }}>
            {t("volumeBenefits.title")}
          </p>
          <ul style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 var(--space-4) 0",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)"
          }}>
            {(t("volumeBenefits.items", { returnObjects: true }) as string[]).map((item, index) => (
              <li key={index} style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                color: "var(--text-bright-primary)",
                fontSize: "var(--text-base)"
              }}>
                <i className="bi bi-check" style={{
                  color: "var(--color-primary)",
                  fontSize: "var(--text-lg)",
                  flexShrink: 0
                }}></i>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <a 
              href={`https://wa.me/60137482481?text=Hi%20Teevent!%20I%27d%20like%20to%20get%20a%20quote%20for%20${value}%20lanyards.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                display: "inline-block",
                textDecoration: "none",
                padding: "var(--space-3) var(--space-6)",
                fontSize: "var(--text-base)",
                borderRadius: "9999px",
                border: "2px solid var(--color-primary)",
                color: "var(--color-primary)",
                fontWeight: "var(--font-weight-medium)",
                background: "transparent",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-primary)";
                e.currentTarget.style.color = "var(--color-white)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-primary)";
              }}
            >
              {t("volumeBenefits.contactButton")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

