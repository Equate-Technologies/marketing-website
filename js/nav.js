/* ══════════════════════════════════════════════════
   EQUATE — Shared Nav Logic  (js/nav.js)
   Load on every page BEFORE page-specific scripts.
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Site base (GitHub Pages project sites live under /repo-name) ── */
  const SITE_ROOTS = { css: 1, js: 1, pages: 1, images: 1, index: 1 };

  function detectSiteBase() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src || '';
      const idx = src.indexOf('/js/nav.js');
      if (idx === -1) continue;
      try {
        const pathOnly = new URL(src).pathname;
        const basePath = pathOnly.slice(0, pathOnly.indexOf('/js/nav.js'));
        return basePath || '';
      } catch (e) { /* ignore */ }
    }
    const segs = window.location.pathname.split('/').filter(Boolean);
    if (segs.length && !SITE_ROOTS[segs[0].replace(/\.html$/, '')] && !segs[0].endsWith('.html')) {
      return '/' + segs[0];
    }
    return '';
  }

  function withBase(url, base) {
    if (!base || !url || url.charAt(0) !== '/' || url.charAt(1) === '/') return url;
    if (url === base || url.indexOf(base + '/') === 0) return url;
    return base + url;
  }

  const siteBase = detectSiteBase();
  if (siteBase) {
    document.querySelectorAll('[href^="/"], [src^="/"]').forEach(function (el) {
      const attr = el.hasAttribute('href') ? 'href' : 'src';
      const raw = el.getAttribute(attr);
      const next = withBase(raw, siteBase);
      if (next !== raw) el.setAttribute(attr, next);
    });
  }

  /* ── Active nav link ── */
  const path = window.location.pathname;

  // #region agent log
  (function debugNavPaths() {
    const links = Array.from(document.querySelectorAll('a[href*="how_it_works"], .nav-links a, .nav-actions a[href], .nav-logo'));
    const linkData = links.map((a) => {
      const raw = a.getAttribute('href') || '';
      return {
        raw: raw,
        resolved: a.href,
        isRootAbsolute: raw.charAt(0) === '/',
        includesBase: !siteBase || raw.indexOf(siteBase) === 0
      };
    });
    fetch('http://127.0.0.1:7357/ingest/7a5ab7ee-cf72-4adf-bb90-b7154a264734', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'e0168e' },
      body: JSON.stringify({
        sessionId: 'e0168e',
        runId: 'post-fix',
        hypothesisId: 'A',
        location: 'nav.js:path-probe',
        message: 'GH Pages path/base probe after rewrite',
        data: {
          href: window.location.href,
          pathname: path,
          siteBase: siteBase,
          linkData: linkData
        },
        timestamp: Date.now()
      })
    }).catch(function () {});

    document.querySelectorAll('a[href*="how_it_works"], .nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        fetch('http://127.0.0.1:7357/ingest/7a5ab7ee-cf72-4adf-bb90-b7154a264734', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'e0168e' },
          body: JSON.stringify({
            sessionId: 'e0168e',
            runId: 'post-fix',
            hypothesisId: 'A',
            location: 'nav.js:nav-click',
            message: 'Nav/CTA click after rewrite',
            data: {
              raw: a.getAttribute('href') || '',
              resolved: a.href,
              siteBase: siteBase,
              includesBase: !siteBase || (a.getAttribute('href') || '').indexOf(siteBase) === 0
            },
            timestamp: Date.now()
          })
        }).catch(function () {});
      });
    });
  })();
  // #endregion

  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const hrefPath = href.replace(siteBase, '');
    // Match by filename or section
    const isHome    = (path === '/' || path === siteBase + '/' || path.endsWith('index.html')) && (hrefPath === '#' || hrefPath === '/' || hrefPath === 'index.html' || hrefPath === '/index.html');
    const isActive  = !isHome && hrefPath !== '#' && path.includes(hrefPath.replace('../', '').replace('.html', ''));
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
