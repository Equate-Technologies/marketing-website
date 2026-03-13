/* ══════════════════════════════════════════════════
   EQUATE — Docs Logic  (js/docs.js)
   nav.js must be loaded first.
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Sidebar toggle (mobile) ── */
  const sidebar    = document.querySelector('.docs-sidebar');
  const toggleBtn  = document.getElementById('sidebar-toggle');
  const overlay    = document.createElement('div');

  overlay.style.cssText = `
    position:fixed;inset:0;z-index:85;background:rgba(0,0,0,.4);
    backdrop-filter:blur(2px);display:none;
  `;
  document.body.appendChild(overlay);

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  /* ── Sidebar search ── */
  const searchInput   = document.getElementById('docs-search');
  const searchResults = document.getElementById('search-results');

  // All indexable nav items
  const navItems = [];
  document.querySelectorAll('.sidebar-nav a').forEach((a) => {
    navItems.push({
      href:    a.getAttribute('href'),
      title:   a.textContent.trim(),
      section: a.closest('.sidebar-section')
                ?.querySelector('.sidebar-section-label')
                ?.textContent.trim() || '',
    });
  });

  function renderResults(query) {
    if (!query || !searchResults) return;
    const q = query.toLowerCase();
    const matches = navItems.filter((item) =>
      item.title.toLowerCase().includes(q) || item.section.toLowerCase().includes(q)
    );

    if (!matches.length) {
      searchResults.innerHTML = `<div class="search-result-item" style="color:var(--ink-muted)">No results for "<strong>${escapeHtml(query)}</strong>"</div>`;
    } else {
      searchResults.innerHTML = matches.slice(0, 8).map((item) => `
        <a class="search-result-item" href="${item.href}">
          <span class="search-result-section">${escapeHtml(item.section)}</span>
          ${highlight(item.title, query)}
        </a>
      `).join('');
    }

    searchResults.classList.add('open');
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function highlight(text, query) {
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return escapeHtml(text).replace(re, '<strong>$1</strong>');
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim();
      if (val.length < 2) {
        if (searchResults) searchResults.classList.remove('open');
        return;
      }
      renderResults(val);
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (searchResults) searchResults.classList.remove('open');
      }, 150);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2) renderResults(searchInput.value.trim());
    });
  }

  /* ── Table of Contents: active section highlighting ── */
  const tocLinks = document.querySelectorAll('.docs-toc a');
  const headings = document.querySelectorAll('.docs-content h2, .docs-content h3');

  if (tocLinks.length && headings.length) {
    const headingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tocLinks.forEach((a) => {
            a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-60px 0px -60% 0px' });

    headings.forEach((h) => {
      if (h.id) headingObserver.observe(h);
    });
  }

  /* ── Code copy buttons ── */
  document.querySelectorAll('.code-copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.code-block');
      if (!block) return;
      const code = block.querySelector('code');
      if (!code) return;
      navigator.clipboard.writeText(code.innerText).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        btn.style.color = '#22c55e';
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.style.color = '';
        }, 1800);
      });
    });
  });

  /* ── Active sidebar link based on current URL (multi-page docs) ── */
  const pathname = window.location.pathname;
  const pathNorm = pathname.replace(/\/$/, '/index.html');
  const currentFile = pathNorm.split('/').pop() || 'index.html';

  document.querySelectorAll('.sidebar-nav a').forEach((a) => {
    let href = (a.getAttribute('href') || '').replace(/#.*$/, '').replace(/^\\.\\//, '');
    if (href === '' || href === 'index.html') href = 'index.html';
    if (currentFile === href) a.classList.add('active');
  });

})();
