'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import FeaturePricing from './FeaturePricing';
import FeatureCanva from './FeatureCanva';
import FeatureTracking from './FeatureTracking';

interface FeatureProps {
  title?: string;
  problem?: string;
  solution?: string;
  copy?: string;
  description?: React.ReactNode; // For merged problem/solution
  visual?: string;
  visualAlt?: string;
  visualComponent?: React.ReactNode; // For React components like FeaturePricing
  reverse?: boolean;
  merged?: boolean; // If true, show only description (no title, no problem/solution split)
}

function Feature({ title, problem, solution, copy, description, visual, visualAlt, visualComponent, reverse = false, merged = false }: FeatureProps) {
  return (
    <div className={`feature-section ${reverse ? 'feature-reverse' : ''}`}>
      <div className="container">
        <div className="landing-card feature-card">
          <div className="feature-content">
            <div className="feature-text">
              {!merged && title && <h3 className="feature-title">{title}</h3>}
              {merged ? (
                <p className="feature-description">{description}</p>
              ) : (
                <>
                  <div className="feature-problem">
                    <p className="feature-label">The Problem:</p>
                    <p className="feature-description">{problem}</p>
                  </div>
                  <div className="feature-solution">
                    <p className="feature-label solution-label">The Teevent Solution:</p>
                    <p className="feature-solution-title">{solution}</p>
                    <p className="feature-description">{copy}</p>
                  </div>
                </>
              )}
            </div>
            <div className="feature-visual">
              {visualComponent ? (
                <div className="feature-image-wrapper feature-preview-wrapper">
                  {visual && (
                    <img
                      src={visual}
                      alt={visualAlt || title || 'Feature visual'}
                      className="feature-image"
                    />
                  )}
                  <div className="white-card-overlay">
                    {visualComponent}
                  </div>
                </div>
              ) : visual ? (
                <div className={`feature-image-wrapper ${visualAlt === 'Instant pricing preview' ? 'feature-preview-wrapper' : ''}`}>
                  <img
                    src={visual}
                    alt={visualAlt || title || 'Feature visual'}
                    className="feature-image"
                  />
                </div>
              ) : (
                <div className="feature-placeholder">
                  <p style={{ color: 'var(--text-bright-muted)' }}>Visual placeholder</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeatureSection() {
  const { t } = useTranslation();

  return (
    <section className="landing-section features-section section-padding">
      <div className="features-container">
        {/* Note: Images need to be added to public/images/landing/ */}
        <Feature
          merged={true}
          description={t('features.feature1')}
          visual="/images/landing/feature1.webp"
          visualAlt="Instant pricing preview"
          visualComponent={<FeaturePricing />}
        />
        <Feature
          merged={true}
          description={t('features.feature2')}
          visual="/images/landing/feature2.webp"
          visualAlt="Design workflow preview"
          visualComponent={<FeatureCanva />}
          reverse={true}
        />
        <Feature
          merged={true}
          description={t('features.feature3')}
          visual="/images/landing/feature3.webp"
          visualAlt="Order tracking preview"
          visualComponent={<FeatureTracking />}
        />
      </div>
    </section>
  );
}

