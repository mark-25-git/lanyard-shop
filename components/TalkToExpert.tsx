'use client';

import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils';
import { trackEvent } from '@/lib/ga';

interface TalkToExpertProps {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: 'primary' | 'secondary';
}

export default function TalkToExpert({ 
  quantity, 
  unitPrice, 
  totalPrice,
  variant = 'primary'
}: TalkToExpertProps) {
  const { t } = useTranslation();

  // Generate WhatsApp message with order details
  const message = t('talkToExpert.whatsappMessage', {
    quantity: quantity,
    unitPrice: formatCurrency(unitPrice),
    totalPrice: formatCurrency(totalPrice),
  });

  const whatsappUrl = `https://wa.me/60137482481?text=${encodeURIComponent(message)}`;

  const handleClick = () => {
    trackEvent('talk_to_expert_click', {
      location: variant === 'primary' ? 'price_section' : 'quantity_section',
      quantity,
      unitPrice,
      totalPrice,
    });
  };

  if (variant === 'secondary') {
    // Subtle link style for secondary placement
    return (
      <p style={{
        marginTop: 'var(--space-3)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-bright-secondary)',
        textAlign: 'center'
      }}>
        {t('talkToExpert.secondaryLink')}{' '}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'underline',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {t('talkToExpert.linkText')}
        </a>
        .
      </p>
    );
  }

  // Primary button style
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="btn-secondary"
      style={{
        display: 'block',
        width: '100%',
        padding: 'var(--space-4)',
        fontSize: 'var(--text-lg)',
        borderRadius: 'var(--radius-xl)',
        textAlign: 'center',
        textDecoration: 'none'
      }}
    >
      {t('talkToExpert.primaryButton')}
    </a>
  );
}

