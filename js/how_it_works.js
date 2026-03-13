(function () {
  'use strict';

  const STATUS_LOOKUP = {
    online: { label: 'Online', className: 'status-online' },
    oob: { label: 'OOB Active', className: 'status-oob' },
    degraded: { label: 'Degraded', className: 'status-warning' },
    offline: { label: 'Offline', className: 'status-offline' }
  };

  const STATES = {
    'state-up': {
      statuses: { NY1: 'online', TX2: 'online', LA3: 'online', CH4: 'online' },
      log: [
        '<span class="ev-time">[--:--:--]</span> All systems nominal',
        '<span class="ev-time">[--:--:--]</span> TX2: Primary link OK · latency 12ms',
        '<span class="ev-time">[--:--:--]</span> TX2: Agent heartbeat <span class="ev-info">&hearts;</span> seq=847',
        '<span class="ev-time">[--:--:--]</span> CH4: Primary link OK degraded (packet loss 3%)',
        '<span class="ev-time">[--:--:--]</span> CH4: Agent heartbeat <span class="ev-info">&hearts;</span> seq=1204',
        '<span class="ev-time">[--:--:--]</span> Alert: None active'
      ],
      explainer: {
        heading: "Everything's healthy.",
        body: "The Equate agent at TX2 is sending heartbeats every 15 seconds over the cellular link. The primary internet connection is fully operational. Your dashboard is green across the board, and Equate is silently confirming everything is fine."
      },
      highlightTx2: false,
      topology: {
        nodes: {
          TX2: { detail: 'Agent' },
          NET: { detail: 'Primary · Stable', pill: 'Primary active', activePath: 'primary' },
          AWS: { detail: 'Broker · 12ms' },
          UI: { detail: 'Session OK' }
        },
        connectors: {
          'site-net': { label: 'Primary', status: 'healthy', active: true },
          'net-aws': { label: 'Broker', status: 'healthy', active: true },
          'aws-ui': { label: 'Dashboard', status: 'healthy', active: true }
        }
      }
    },
    'state-down': {
      statuses: { NY1: 'online', TX2: 'oob', LA3: 'online', CH4: 'online' },
      log: [
        '<span class="ev-time">[14:22:01]</span> TX2: Primary link DOWN',
        '<span class="ev-time">[14:22:01]</span> TX2: Missed heartbeat #1',
        '<span class="ev-time">[14:22:16]</span> TX2: Missed heartbeat #2',
        '<span class="ev-time">[14:22:31]</span> TX2: Missed heartbeat #3 - threshold reached',
        '<span class="ev-time">[14:22:31]</span> ALERT fired -> Slack #network-ops',
        '<span class="ev-time">[14:22:31]</span> ALERT fired -> PagerDuty P2',
        '<span class="ev-time">[14:22:32]</span> TX2: Cellular OOB link OK ACTIVE via LTE',
        '<span class="ev-time">[14:22:33]</span> TX2: OOB session available - Connect now'
      ],
      explainer: {
        heading: 'Primary link failed. OOB kicked in automatically.',
        body: 'When three consecutive heartbeats were missed (45 seconds), Equate declared the primary link down and immediately fired alerts to your team. The cellular OOB link was already active — it is always on. Engineers can now open a terminal directly to TX2 without dispatching anyone.'
      },
      highlightTx2: true,
      topology: {
        nodes: {
          TX2: { detail: 'Agent' },
          NET: { detail: 'Cellular · Active', pill: 'OOB active', pillState: 'active' },
          AWS: { detail: 'Broker · 12ms' },
          UI: { detail: 'Session OK' }
        },
        connectors: {
          'site-net': { label: 'Primary', status: 'failed', active: false },
          'net-aws': { label: 'Broker', status: 'healthy', active: true },
          'aws-ui': { label: 'Dashboard', status: 'healthy', active: true }
        }
      }
    },
    'state-degraded': {
      statuses: { NY1: 'online', TX2: 'degraded', LA3: 'online', CH4: 'online' },
      log: [
        '<span class="ev-time">[09:15:44]</span> TX2: Packet loss detected - 8.3%',
        '<span class="ev-time">[09:15:44]</span> TX2: Latency spike - 340ms avg (threshold: 150ms)',
        '<span class="ev-time">[09:15:45]</span> TX2: Degradation alert -> email sent',
        '<span class="ev-time">[09:15:45]</span> TX2: Primary link still UP - OOB standby',
        '<span class="ev-time">[09:15:45]</span> TX2: Agent heartbeat <span class="ev-info">&hearts;</span> seq=302 (normal)',
        '<span class="ev-time">[09:15:46]</span> Monitoring: elevated check frequency (5s)'
      ],
      explainer: {
        heading: "Something's wrong — before it becomes an outage.",
        body: "Packet loss and elevated latency at TX2 triggered a degradation alert. The primary link is still up, so no OOB session is needed yet. Equate increases its check frequency and keeps watching."
      },
      highlightTx2: true,
      topology: {
        nodes: {
          TX2: { detail: 'Agent' },
          NET: { detail: 'Cellular · Active', pill: 'OOB active', pillState: 'active' },
          AWS: { detail: 'Broker · 12ms' },
          UI: { detail: 'Session OK' }
        },
        connectors: {
          'site-net': { label: 'Primary', status: 'degraded', active: true },
          'net-aws': { label: 'Broker', status: 'healthy', active: true },
          'aws-ui': { label: 'Dashboard', status: 'healthy', active: true }
        }
      }
    }
  };

  const demoPanel = document.querySelector('.demo-panel');
  const tabButtons = Array.from(document.querySelectorAll('.scenario-tab'));
  const logRoot = document.querySelector('[data-log]');
  const explainer = document.querySelector('[data-explainer]');
  const explainerHeading = explainer?.querySelector('.explainer-heading');
  const explainerBody = explainer?.querySelector('.explainer-body');
  const tx2Row = document.querySelector('.site-row[data-site="TX2"]');
  const siteRows = Array.from(document.querySelectorAll('.site-row'));
  const topoNodes = Array.from(document.querySelectorAll('.topo-node'));
  const topoConnectors = Array.from(document.querySelectorAll('.topo-connector'));
  const topoNodeMap = topoNodes.reduce((acc, node) => {
    if (node.dataset.node) acc[node.dataset.node] = node;
    return acc;
  }, {});
  const topoConnectorMap = topoConnectors.reduce((acc, connector) => {
    if (connector.dataset.connector) acc[connector.dataset.connector] = connector;
    return acc;
  }, {});

  let logTimers = [];
  let explainerTimer = null;

  function clearLogTimers() {
    logTimers.forEach((timer) => clearTimeout(timer));
    logTimers = [];
  }

  function renderLog(lines) {
    if (!logRoot) return;
    clearLogTimers();
    logRoot.innerHTML = '';

    lines.forEach((line, index) => {
      const timer = setTimeout(() => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = line;
        logRoot.appendChild(entry);
        window.requestAnimationFrame(() => entry.classList.add('visible'));
      }, index * 200);

      logTimers.push(timer);
    });
  }

  function updateExplainer({ heading, body }) {
    if (!explainer || !explainerHeading || !explainerBody) return;
    explainer.classList.add('is-fading');
    if (explainerTimer) {
      clearTimeout(explainerTimer);
    }
    explainerTimer = setTimeout(() => {
      explainerHeading.textContent = heading;
      explainerBody.textContent = body;
      explainer.classList.remove('is-fading');
    }, 280);
  }

  function updateStatuses(statusMap) {
    siteRows.forEach((row) => {
      const site = row.dataset.site;
      const targetStatus = statusMap[site];
      if (!targetStatus) return;
      const definition = STATUS_LOOKUP[targetStatus] || STATUS_LOOKUP.online;
      const badge = row.querySelector('.status-badge');
      if (!badge) return;
      badge.className = `status-badge ${definition.className}`;
      badge.innerHTML = `<span class="status-dot"></span>${definition.label}`;
    });
  }

  function updateTopology(config = {}) {
    const { nodes = {}, connectors = {} } = config;

    Object.entries(nodes).forEach(([key, nodeState]) => {
      const node = topoNodeMap[key];
      if (!node) return;
      const detailEl = node.querySelector('[data-node-detail]');
      if (detailEl && nodeState.detail) {
        detailEl.textContent = nodeState.detail;
      }
      const pillEl = node.querySelector('[data-node-pill]');
      if (pillEl) {
        if (nodeState.pill) {
          pillEl.textContent = nodeState.pill;
          pillEl.hidden = false;
        } else {
          pillEl.hidden = true;
        }
        if (nodeState.pillState) {
          pillEl.dataset.pillState = nodeState.pillState;
        } else {
          delete pillEl.dataset.pillState;
        }
      }
      if (nodeState.activePath) {
        node.setAttribute('data-active-path', nodeState.activePath);
      } else {
        node.removeAttribute('data-active-path');
      }
    });

    Object.entries(connectors).forEach(([key, connectorState]) => {
      const connector = topoConnectorMap[key];
      if (!connector) return;
      const labelEl = connector.querySelector('[data-connector-label]');
      if (labelEl && connectorState.label) {
        labelEl.textContent = connectorState.label;
      }
      connector.dataset.state = connectorState.status || 'standby';
      connector.dataset.active = connectorState.active ? 'true' : 'false';
    });

  }

  function updateState(stateKey) {
    const state = STATES[stateKey];
    if (!state) return;

    if (demoPanel) {
      demoPanel.setAttribute('data-state', stateKey);
    }

    tabButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.state === stateKey);
    });

    updateStatuses(state.statuses);
    updateTopology(state.topology);

    if (tx2Row) {
      tx2Row.classList.toggle('affected', !!state.highlightTx2);
    }

    renderLog(state.log);
    updateExplainer(state.explainer);
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      updateState(button.dataset.state);
    });
  });

  updateState('state-up');
}());
