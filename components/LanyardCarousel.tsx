'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const images = [
  '/images/customize/2cm-width.webp',
  '/images/customize/lobster-hook.webp',
  '/images/customize/lobster-hook1.webp',
];

export default function LanyardCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Switch every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '300px',
      height: '100%',
      overflow: 'hidden',
      marginLeft: 'auto'
    }}>
      {images.map((src, index) => (
        <div
          key={src}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Image
            src={src}
            alt={`Lanyard feature ${index + 1}`}
            width={400}
            height={300}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      ))}
    </div>
  );
}

