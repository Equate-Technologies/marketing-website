(function () {
  'use strict';

  const sections = document.querySelectorAll('.product-section');
  if (sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.15 });

    sections.forEach((section) => observer.observe(section));
  }

  const logContainer = document.querySelector('[data-agent-log]');
  const logLines = [
    '<span class="dim">[12:04:01]</span> equate-agent v1.4.2 started',
    '<span class="dim">[12:04:01]</span> Cellular link: LTE · RSSI <span class="ok">-74 dBm</span>',
    '<span class="dim">[12:04:02]</span> Connecting to <span class="ok">broker.equate.io:443</span>',
    '<span class="dim">[12:04:02]</span> Session authenticated · device_id: <span class="ok">eq-tx2-01</span>',
    '<span class="dim">[12:04:17]</span> <span class="hb">♥</span> heartbeat sent · seq=1',
    '<span class="dim">[12:04:32]</span> <span class="hb">♥</span> heartbeat sent · seq=2',
    '<span class="dim">[12:04:47]</span> <span class="hb">♥</span> heartbeat sent · seq=3',
    '<span class="dim">[12:05:02]</span> <span class="hb">♥</span> heartbeat sent · seq=4'
  ];

  const lineDelay = 950;
  const logAnimationDuration = 4400;
  let lineTimers = [];
  let loopTimer = null;

  function clearTimers() {
    lineTimers.forEach((timer) => clearTimeout(timer));
    lineTimers = [];
    if (loopTimer) {
      clearTimeout(loopTimer);
      loopTimer = null;
    }
  }

  function playLog() {
    if (!logContainer) return;
    clearTimers();
    logContainer.innerHTML = '';

    logLines.forEach((line, index) => {
      const timer = setTimeout(() => {
        const entry = document.createElement('div');
        entry.className = 'log-line';
        entry.innerHTML = line;
        entry.addEventListener('animationend', () => {
          if (entry.parentNode === logContainer) {
            logContainer.removeChild(entry);
          }
        });
        logContainer.appendChild(entry);
      }, index * lineDelay);

      lineTimers.push(timer);
    });

    const totalDuration = logLines.length * lineDelay + logAnimationDuration;
    loopTimer = setTimeout(playLog, totalDuration);
  }

  if (logContainer) {
    playLog();
  }

  const dashboardDeviceCard = document.querySelector('.dashboard-device-card');
  const terminalPanel = document.querySelector('.terminal-panel');

  function syncDashboardPanels() {
    if (!dashboardDeviceCard || !terminalPanel) {
      return;
    }

    const cardHeight = dashboardDeviceCard.offsetHeight;
    const panelHeight = terminalPanel.offsetHeight;
    const targetHeight = Math.max(cardHeight, panelHeight);

    if (!targetHeight) {
      return;
    }

    dashboardDeviceCard.style.minHeight = `${targetHeight}px`;
    terminalPanel.style.minHeight = `${targetHeight}px`;
  }

  if (dashboardDeviceCard && terminalPanel) {
    syncDashboardPanels();

    if (typeof ResizeObserver !== 'undefined') {
      const panelObserver = new ResizeObserver(syncDashboardPanels);
      panelObserver.observe(dashboardDeviceCard);
      panelObserver.observe(terminalPanel);
    }

    window.addEventListener('resize', syncDashboardPanels);
    window.addEventListener('load', syncDashboardPanels);
  }
}());
