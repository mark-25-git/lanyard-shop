'use client';

import { useEffect, useState } from 'react';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  onSent?: (email: string) => void;
}

export default function QuotationModal({
  isOpen,
  onClose,
  quantity,
  unitPrice,
  totalPrice,
  onSent,
}: QuotationModalProps) {
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const closeButton = document.getElementById('quotation-modal-close');
      if (closeButton) {
        closeButton.focus();
      }
    } else {
      document.body.style.overflow = '';
      // Reset form when modal closes
      setContactName('');
      setEmail('');
      setCompanyName('');
      setIsSending(false);
      setErrorMessage(null);
    }

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

  const handleConfirm = async () => {
    if (!contactName.trim() || !email.trim()) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/send-quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactName: contactName.trim(),
          email: email.trim(),
          companyName: companyName.trim() || undefined,
          quantity,
          unitPrice,
          totalPrice,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        const message =
          data?.error ||
          'Unable to send quotation right now. Please try again in a moment.';
        setErrorMessage(message);
        setIsSending(false);
        return;
      }

      if (onSent) {
        onSent(email.trim());
      }

      onClose();
    } catch (error) {
      console.error('Error sending quotation:', error);
      setErrorMessage(
        'Something went wrong while sending the quotation. Please try again.'
      );
      setIsSending(false);
    }
  };

  const isFormValid = contactName.trim() !== '' && email.trim() !== '';

  if (!isOpen) return null;

  return (
    <div 
      className="quotation-modal" 
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('modal-overlay')) {
          onClose();
        }
      }}
    >
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="quotation-modal-content" onClick={(e) => e.stopPropagation()}>
        <button 
          id="quotation-modal-close"
          className="modal-close" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="quotation-modal-body">
          <div className="modal-header">
            <h2 className="modal-title">Get Your Quotation</h2>
            <p className="modal-subtitle">
              We'll email you a formal PDF quotation.
            </p>
          </div>

          <div className="modal-details">
            <div className="floating-label-wrapper">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={`floating-label-input ${contactName ? 'has-value' : ''}`}
                placeholder=" "
                required
              />
              <label className="floating-label">
                Contact Name <span className="required-asterisk">*</span>
              </label>
            </div>

            <div className="floating-label-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`floating-label-input ${email ? 'has-value' : ''}`}
                placeholder=" "
                required
              />
              <label className="floating-label">
                Email Address <span className="required-asterisk">*</span>
              </label>
            </div>

            <div className="floating-label-wrapper">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={`floating-label-input ${companyName ? 'has-value' : ''}`}
                placeholder=" "
              />
              <label className="floating-label">
                Company/Organization Name (Optional)
              </label>
            </div>
          </div>

          <div className="quotation-modal-actions">
            {errorMessage && (
              <p
                style={{
                  marginBottom: 'var(--space-3)',
                  color: '#b91c1c',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {errorMessage}
              </p>
            )}
            <button
              onClick={handleConfirm}
              disabled={!isFormValid || isSending}
              className="btn-primary quotation-modal-confirm"
            >
              {isSending ? 'Sending…' : 'Send Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


