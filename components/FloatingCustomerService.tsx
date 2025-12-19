'use client';

import Image from 'next/image';

export default function FloatingCustomerService() {
  return (
    <a
      href="https://wa.me/60137482481?text=Hi%20Teevent!%20I%20need%20help%20with%20my%20order."
      target="_blank"
      rel="noopener noreferrer"
      className="floating-customer-service"
      aria-label="Contact customer service via WhatsApp"
    >
      <Image
        src="/images/customer-service.jpeg"
        alt="Customer Service"
        width={80}
        height={80}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </a>
  );
}

