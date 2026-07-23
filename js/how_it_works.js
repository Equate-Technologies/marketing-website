(function () {
  'use strict';

  const diagrams = document.querySelectorAll('.plane, .diagram-card, .health-card');

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  diagrams.forEach((diagram) => observer.observe(diagram));
}());
