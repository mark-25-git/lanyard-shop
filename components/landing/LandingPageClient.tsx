'use client';

import { useEffect } from 'react';
import HeroSection from '@/components/landing/HeroSection';
import TrustBar from '@/components/landing/TrustBar';
import FeatureSection from '@/components/landing/FeatureSection';
import LanyardShowcaseSection from '@/components/landing/LanyardShowcaseSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import SimplicitySection from '@/components/landing/SimplicitySection';
import SampleAssuranceSection from '@/components/landing/SampleAssuranceSection';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/layout/Footer';

interface LandingPageClientProps {
  lanyardsDelivered: number;
}

export default function LandingPageClient({ lanyardsDelivered }: LandingPageClientProps) {
  useEffect(() => {
    // Fade-in animation on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main>
      <HeroSection />
      <TrustBar lanyardsDelivered={lanyardsDelivered} />
      <FeatureSection />
      <LanyardShowcaseSection />
      <TestimonialsSection />
      <SimplicitySection />
      <SampleAssuranceSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}



