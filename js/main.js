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
  const howItWorksUrl = '/pages/how_it_works.html';
  document.querySelectorAll('.connect-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const orig = this.textContent;
      this.textContent = 'Opening…';
      this.style.background = 'var(--salmon)';
      this.style.color = '#fff';
      this.style.borderColor = 'var(--salmon)';

      setTimeout(() => {
        window.location.href = howItWorksUrl;
      }, 500);

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
  const steps = document.querySelectorAll('.step');
  if (steps.length) {
    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          steps.forEach((s) => s.classList.remove('step-active'));
          entry.target.classList.add('step-active');
        }
      });
    }, { threshold: 0.8 });
    steps.forEach((s) => stepObserver.observe(s));
  }
})();
