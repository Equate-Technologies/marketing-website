/* ══════════════════════════════════════════════════
   EQUATE — Shared Nav Logic  (js/nav.js)
   Load on every page BEFORE page-specific scripts.
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Active nav link ── */
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    // Match by filename or section
    const isHome    = (path === '/' || path.endsWith('index.html')) && (href === '#' || href === '/' || href === 'index.html');
    const isActive  = !isHome && href !== '#' && path.includes(href.replace('../', '').replace('.html', ''));
    if (isHome || isActive) a.classList.add('active');
  });

  /* ── Hide / show nav on scroll ── */
  const navbar    = document.querySelector('nav');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > lastScrollY && current > 80) {
      navbar.classList.add('hidden');
    } else {
      navbar.classList.remove('hidden');
    }
    lastScrollY = current;
  }, { passive: true });

  /* ── Dark mode toggle ── */
  const themeToggle = document.getElementById('theme-toggle');
  const root        = document.documentElement;

  const saved = localStorage.getItem('equate-theme') || 'light';
  root.setAttribute('data-theme', saved);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('equate-theme', next);
    });
  }

  /* ── Waitlist modal (shared) ── */
  const modal        = document.getElementById('waitlist-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalClose   = document.getElementById('modal-close');
  const waitlistForm = document.getElementById('waitlist-form');
  const emailInput   = document.getElementById('waitlist-email');
  const nameInput    = document.getElementById('waitlist-name');
  const submitBtn    = document.getElementById('waitlist-submit');
  const formDefault  = document.getElementById('form-default');
  const formSuccess  = document.getElementById('form-success');
  const formError    = document.getElementById('form-error');
  const errorMsg     = document.getElementById('error-message');

  const API_ENDPOINT = 'YOUR_API_GATEWAY_URL';

  function openModal() {
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { if (nameInput) nameInput.focus(); else if (emailInput) emailInput.focus(); }, 100);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(resetForm, 300);
  }

  function resetForm() {
    if (waitlistForm) waitlistForm.reset();
    setFormState('default');
  }

  function setFormState(state) {
    if (formDefault) formDefault.hidden = state !== 'default';
    if (formSuccess) formSuccess.hidden = state !== 'success';
    if (formError)   formError.hidden   = state !== 'error';
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled    = loading;
    submitBtn.textContent = loading ? 'Submitting...' : 'Join the waitlist';
  }

  // Open from any trigger
  document.querySelectorAll('[data-waitlist]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  });

  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  if (modalClose)   modalClose.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const name  = nameInput  ? nameInput.value.trim()  : '';
      if (!email) return;

      setLoading(true);

      try {
        const payload = { email };
        if (name) payload.name = name;

        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Something went wrong.');
        }

        setFormState('success');
      } catch (err) {
        if (errorMsg) errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
        setFormState('error');
      } finally {
        setLoading(false);
      }
    });
  }

  /* ── Scroll-triggered fade-up animations ── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

  /* Expose openModal globally so page scripts can call it */
  window.equateOpenModal = openModal;
})();
