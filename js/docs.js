(function () {
  'use strict';

  const pages = {
    'index.html': ['Monitoring overview', 'Understand the monitoring platform', '<p class="doc-lead">Equate is a two-plane SNMP monitoring platform. The customer plane observes devices locally; the cloud plane owns durable monitoring state, API contracts, and visualization.</p><h2>What Equate monitors</h2><p>Site, device, interface, health, component, and collector operational telemetry are persisted in PostgreSQL and presented through the read-only dashboard API.</p><h2>What Equate does not do</h2><p>It does not provide device-console access, cloud-side credential editing, automatic enrollment, or an inbound cloud management path.</p>'],
    'quickstart.html': ['Deployment path', 'Move from inventory to dashboard', '<p class="doc-lead">A deployment starts by choosing the supported profile, applying cloud migrations, validating the collector configuration, and proving the MQTT-to-API path.</p><h2>Prepare the collector</h2><p>Configure site and collector identity, environment references for SNMP communities, allowed device inventory, and outbound MQTT/TLS trust.</p><h2>Validate before activation</h2><p>Validate the complete configuration, then confirm collector health, readiness, and visible telemetry through the API/dashboard path.</p>'],
    'requirements.html': ['Requirements', 'Plan the customer and cloud planes', '<p class="doc-lead">The collector needs L2/L3 reachability to configured SNMPv2c devices, outbound TCP to the MQTT broker, a trusted CA, and environment-provided secrets.</p><h2>Customer-plane requirements</h2><p>Run the collector where it can poll devices. Keep static inventory read-only and retain a writable local state area for the SQLite outbox and managed inventory.</p><h2>Cloud-plane requirements</h2><p>Deploy MQTT/TLS transport, ingestion, PostgreSQL, Backend API, and dashboard services. Apply migrations before enabling collectors.</p>'],
    'agent-install.html': ['Collector setup', 'Configure a local monitoring collector', '<p class="doc-lead">The SNMP Collector is the customer-plane service. It polls devices, evaluates local health evidence, buffers telemetry, and publishes outward.</p><h2>Inventory and secret references</h2><p>Inventory records reference SNMP community environment-variable names; plaintext communities never belong in YAML. Static inventory remains authoritative for identity and connectivity fields.</p><h2>Local operations</h2><p>The collector validates and reloads configuration transactionally. Its operator TUI uses a local Unix socket, not a public management endpoint.</p>'],
    'cellular.html': ['Telemetry transport', 'Reliable, outbound delivery', '<p class="doc-lead">Equate uses authenticated MQTT/TLS with QoS 1 to carry versioned device, interface, health, and heartbeat telemetry from collector to cloud.</p><h2>Durable outbox</h2><p>The collector persists an event before publishing and deletes it only after broker acknowledgement. Polling continues while transport is unavailable.</p><h2>Cloud ingestion</h2><p>Ingestion validates route and body identity, deduplicates events, writes monitoring data transactionally, then acknowledges delivery.</p>'],
    'dashboard.html': ['Dashboard', 'Present persisted monitoring evidence', '<p class="doc-lead">The dashboard is a read-only presentation layer that consumes the Backend API. It distinguishes live and demo modes and refreshes monitoring views on a five-second default interval.</p><h2>Overview and detail</h2><p>All-sites summaries show device totals and separate healthy, warning, direct-critical, and dependency-impacted counts. Device and interface views expose identity, status, telemetry, components, and history when available.</p><h2>Honest data</h2><p>Absent telemetry remains empty rather than being fabricated as zero. The dashboard does not recompute collector health evidence.</p>'],
    'sites.html': ['Sites, devices, and interfaces', 'Navigate from aggregate state to evidence', '<p class="doc-lead">Site detail preserves dense, searchable device visibility. Device detail adds vendor/profile identity, health reason and dependencies, component readings, metric histories, and interfaces.</p><h2>Interfaces</h2><p>Selected interfaces expose metadata, administration and operational state, counters, errors, speed, and traffic history.</p><h2>Dependency evidence</h2><p>Upstream IDs, unavailable upstreams, and root-cause IDs remain explicit fields instead of a dashboard-inferred topology.</p>'],
    'access.html': ['Operating boundaries', 'Keep control where observation happens', '<p class="doc-lead">The cloud dashboard cannot edit inventory, thresholds, dependencies, discovery candidates, or credentials. Those are authenticated local collector-TUI operations.</p><h2>Local changes</h2><p>Collector mutations use revision-bound prepare/commit workflows, explicit confirmation, reload validation, and secret-free local audit records.</p><h2>Cloud access</h2><p>The Backend API provides read-only monitoring resources and can use Google OIDC in deployed environments.</p>'],
    'alerts.html': ['Health states', 'Describe impact without overclaiming', '<p class="doc-lead">Health is evaluated locally because the collector observes both polling results and the configured dependency DAG.</p><h2>States</h2><p><strong>Healthy</strong> means reachable and below temperature policy. <strong>Warning</strong> means reachable at or above temperature policy. <strong>Critical</strong> means directly unreachable after the failure threshold. <strong>Unknown</strong> means every configured upstream path is unavailable.</p><h2>Important distinction</h2><p>Unknown is visually distinct from Critical and excluded from direct-critical counts. CPU, memory, and power do not set health state in v2.</p>'],
    'api.html': ['Read-only API', 'Monitoring resources for frontend clients', '<p class="doc-lead">The Backend API reads PostgreSQL monitoring state and supplies site, device, interface, metric, alert, and test-config resources under the <code>/api</code> prefix.</p><h2>Response behavior</h2><p>Status remains compatible as 0 Unknown, 1 Healthy, 2 Warning, and 3 Critical. Device details retain explicit reasons, dependency arrays, components, and history.</p><h2>Boundary</h2><p>The API does not poll SNMP, process MQTT, write telemetry samples, configure devices, or expose console access.</p>'],
    'audit.html': ['Local operational audit', 'Track collector-side mutations', '<p class="doc-lead">Successful and failed local collector mutations append to a secret-free audit log. This applies to approved inventory, discovery, threshold, dependency, and reload workflows.</p><h2>What is excluded</h2><p>Audit records never contain SNMP communities, MQTT passwords, certificates, environment values, or raw payload bodies.</p><h2>Scope</h2><p>This is a collector-local operational control, not a published promise about user-session audit retention or external export.</p>'],
    'security-model.html': ['Security model', 'Technical boundaries in the monitoring architecture', '<p class="doc-lead">Collectors establish outbound-only TLS-authenticated MQTT connections from customer networks. No cloud service, public HTTP endpoint, or dashboard client manages devices, inventory, or credentials in the customer plane.</p><h2>Secret handling</h2><p>Communities are environment references. Telemetry, cloud APIs, logs, and dashboards must not expose communities, TLS material, local paths, or operator controls.</p><h2>Least privilege</h2><p>MQTT ACLs, separated database roles, API read-only access, and local Unix-socket controls reduce the exposed surface.</p>']
  };

  const file = (window.location.pathname.split('/').pop() || 'index.html');
  const page = pages[file] || pages['index.html'];
  const sidebar = document.getElementById('docs-sidebar');
  const content = document.querySelector('.docs-content');
  const navigation = [
    ['Overview', [['index.html', 'Monitoring overview'], ['quickstart.html', 'Deployment path'], ['requirements.html', 'Requirements']]],
    ['Collector', [['agent-install.html', 'Collector setup'], ['cellular.html', 'Telemetry transport']]],
    ['Dashboard', [['dashboard.html', 'Dashboard'], ['sites.html', 'Sites, devices, and interfaces'], ['alerts.html', 'Health states']]],
    ['Reference', [['access.html', 'Operating boundaries'], ['api.html', 'Read-only API'], ['audit.html', 'Local operational audit'], ['security-model.html', 'Security model']]]
  ];

  if (sidebar) {
    sidebar.innerHTML = `<div class="sidebar-search"><div class="sidebar-search-wrap"><input id="docs-search" class="sidebar-search-input" type="search" placeholder="Search docs..." autocomplete="off"/><div id="search-results"></div></div></div>${navigation.map(([label, links]) => `<div class="sidebar-section"><span class="sidebar-section-label">${label}</span><ul class="sidebar-nav">${links.map(([href, text]) => `<li><a href="/pages/docs/${href}" class="${href === file ? 'active' : ''}">${text}</a></li>`).join('')}</ul></div>`).join('')}`;
  }

  if (content) {
    document.title = `${page[0]} — Docs — Equate`;
    content.innerHTML = `<div class="docs-breadcrumb"><a href="/pages/docs/index.html">Docs</a><span class="sep">›</span><span class="current">${page[0]}</span></div><section id="doc-content"><h1>${page[1]}</h1>${page[2]}<div class="doc-callout doc-callout-note"><span class="doc-callout-icon">ℹ</span><div>Curated product documentation based on the Equate monitoring architecture. See the <a href="/pages/how_it_works.html">architecture overview</a> for a visual model.</div></div></section>`;
    document.body.classList.add('docs-ready');
  }

  document.querySelectorAll('.nav-links a[href="/pages/pricing.html"]').forEach((link) => { link.textContent = 'Deployment planning'; });
  document.querySelectorAll('.modal-eyebrow').forEach((label) => { label.lastChild.textContent = 'deployment_planning'; });
  document.querySelectorAll('.modal-heading').forEach((heading) => { heading.textContent = 'Talk to the Equate team'; });
  document.querySelectorAll('.modal-sub').forEach((copy) => { copy.textContent = 'Tell us about your monitoring environment.'; });

  const toggle = document.getElementById('sidebar-toggle');
  if (toggle && sidebar) toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  const search = document.getElementById('docs-search');
  const results = document.getElementById('search-results');
  if (search && results) search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    const matches = navigation.flatMap(([, links]) => links).filter(([, label]) => label.toLowerCase().includes(query));
    results.innerHTML = query ? matches.map(([href, label]) => `<a class="search-result-item" href="/pages/docs/${href}">${label}</a>`).join('') || '<div class="search-result-item">No matching docs.</div>' : '';
    results.classList.toggle('open', Boolean(query));
  });
}());
