/* ══════════════════════════════════════════════════
  EQUATE — Landing Page Logic  (js/main.js)
  nav.js must be loaded first for shared behavior.
  ══════════════════════════════════════════════════ */

// All modal / dark mode / scroll is handled in nav.js.
// This file handles anything landing-page specific.

(function () {
  'use strict';

  /* ── Hero visual: animated status dots ── */
  // Cycle the OOB pulse dot color
  const oobDots = document.querySelectorAll('.status-oob .status-dot');
  // These animate via CSS; nothing extra needed.

  /* ── Connect button micro-interaction ── */
  document.querySelectorAll('.connect-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const orig = this.textContent;
      this.textContent = 'Opening…';
      this.style.background = 'var(--salmon)';
      this.style.color = '#fff';
      this.style.borderColor = 'var(--salmon)';
      setTimeout(() => {
        this.textContent = orig;
        this.style.background = '';
        this.style.color = '';
        this.style.borderColor = '';
      }, 1200);
    });
  });

  /* ── Steps: highlight active step on scroll ── */
  // (Hero visual steps in how-section)
  const stepNodes = Array.from(document.querySelectorAll('.how-section .step'));
  let headingHovered = false;
  let hoverInterval = null;
  let cycleIndex = 0;
  const howHeading = document.querySelector('.how-section .section-heading');

  const highlightStepAt = (index) => {
    stepNodes.forEach((step, idx) => {
      step.classList.toggle('step-active', idx === index);
    });
  };

  if (stepNodes.length) {
    const stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!headingHovered && entry.isIntersecting) {
            const entryIndex = stepNodes.indexOf(entry.target);
            if (entryIndex !== -1) {
              highlightStepAt(entryIndex);
            }
          }
        });
      },
      { threshold: 0.8 }
    );
    stepNodes.forEach((step) => stepObserver.observe(step));
  }

  const cycleStep = () => {
    cycleIndex = (cycleIndex + 1) % stepNodes.length;
    highlightStepAt(cycleIndex);
  };

  if (howHeading && stepNodes.length) {
    howHeading.addEventListener('mouseenter', () => {
      if (hoverInterval) {
        clearInterval(hoverInterval);
      }
      headingHovered = true;
      const activeIndex = stepNodes.findIndex((step) => step.classList.contains('step-active'));
      cycleIndex = activeIndex >= 0 ? activeIndex : 0;
      cycleStep();
      hoverInterval = setInterval(cycleStep, 900);
    });

    howHeading.addEventListener('mouseleave', () => {
      headingHovered = false;
      if (hoverInterval) {
        clearInterval(hoverInterval);
        hoverInterval = null;
      }
      cycleIndex = 0;
      highlightStepAt(0);
    });
  }
})();
