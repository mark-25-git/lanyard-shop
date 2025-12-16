'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function SimplicitySection() {
  const { t } = useTranslation();

  useEffect(() => {
    const textContainer = document.getElementById('textContainer');
    const hiddenContent = document.getElementById('hiddenContent');
    const readMoreBtn = document.getElementById('readMoreBtn');

    if (!textContainer || !hiddenContent || !readMoreBtn) return;

    let isExpanded = false;

    const toggleReadMore = () => {
      isExpanded = !isExpanded;

      if (isExpanded) {
        textContainer.classList.add('expanded');
        hiddenContent.style.display = 'block';
        readMoreBtn.textContent = 'Show Less';
      } else {
        textContainer.classList.remove('expanded');
        hiddenContent.style.display = 'none';
        readMoreBtn.textContent = 'Read More';
        textContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    readMoreBtn.addEventListener('click', toggleReadMore);

    return () => {
      readMoreBtn.removeEventListener('click', toggleReadMore);
    };
  }, []);

  return (
      <section className="landing-section section-padding simplicity-section">
        <div className="container">
          <div className="simplicity-content">
            <h2 className="hero-title simplicity-title fade-in">
            {t('simplicity.title')}
            </h2>
            <p className="simplicity-subtitle fade-in">
            {t('simplicity.step1')}<br />
            {t('simplicity.step2')}<br />
            {t('simplicity.step3')}<br />
            {t('simplicity.done')}<br />
            <br />
            {t('simplicity.why')}
          </p>
          
          {/* <div className="founder-note fade-in">
            <h3 className="founder-note-title">Words from us</h3>
            
            <div
              id="textContainer"
              className="founder-note-content"
            >
              <p>
                You might wonder how we can give you a price for your custom lanyards right away. While others ask so many questions first.
              </p>
              
              <p>
                The honest truth is simpler than you think. Pricing comes down to just one thing—how many lanyards you need. We offer one beautifully simple option: a 2cm-wide lanyard with color printing on both sides. And the price depends only on your quantity. That's it.
              </p>
              
              <div id="hiddenContent" style={{ display: 'none' }}>
                <p>
                  So why do some suppliers make it feel so complicated? Sometimes they ask lots of questions not to calculate your actual cost, but to figure out how much you might be willing to pay. The price you get can end up depending more on what you say than what you're actually ordering.
                </p>
                
                <p>
                  We just believe pricing should be clear and fair. That's why we put all our prices where everyone can see them. You know what everything costs before you even start. No long conversations needed. You see the price right away, you compare your options, and you decide what feels right for you.
                </p>
                
                <p>
                  Because that's how ordering should work. It works like any online shop you love. You choose what you need. You see the price update instantly. You upload your design. You place your order. Simple.
                </p>
                
                <p>
                  No negotiations. No wondering. Just clear prices. Clear options. A simple, honest way to get what you need. It makes life easier.
                </p>
              </div>
            </div>
            <button id="readMoreBtn" className="simplicity-read-more fade-in">
              Read More
            </button>
          </div> */}
        </div>
        </div>
      </section>
  );
}

