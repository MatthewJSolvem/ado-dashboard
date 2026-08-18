/* ========================================================================
   ADO Ops Console — shared left-hand navigation
   Call ADONav.render('pageKey') once, right after <body> opens.
   ======================================================================== */

const ADONav = (function () {
  const PAGES = [
    { key: 'dashboard', href: 'index.html', label: 'Morning Dashboard',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>' },
    { key: 'tracker', href: 'master-tracker-review.html', label: 'Master Tracker Review',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
    { key: 'capacity', href: 'team-capacity-planner.html', label: 'Team Capacity Planner',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 15l2 2 4-4"/></svg>' },
    { key: 'client', href: 'client-investigation.html', label: 'Client Investigation',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' },
    { key: 'leaderboard', href: 'leaderboard.html', label: 'Leaderboard',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4"/></svg>' },
    { key: 'cims', href: 'cims-compare.html', label: 'CIMS vs DevOps',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M13 7h5a2 2 0 0 1 2 2v3M11 17H6a2 2 0 0 1-2-2v-3"/></svg>' },
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function render(activeKey) {
    const cfg = (window.ADOSession && ADOSession.load()) || null;
    const connected = !!(cfg && cfg.org && cfg.project);

    const navItems = PAGES.map(function (p) {
      const cls = 'nav-item' + (p.key === activeKey ? ' active' : '');
      return '<a class="' + cls + '" href="' + p.href + '"><span class="ico">' + p.ico + '</span>' + p.label + '</a>';
    }).join('');

    const html =
      '<aside class="app-sidebar">' +
        '<div class="brand"><div class="mark">A</div><div><div class="name">ADO Ops Console</div><div class="sub">Azure DevOps</div></div></div>' +
        '<nav>' +
          '<div class="nav-label">Reports</div>' +
          navItems +
        '</nav>' +
        '<div class="connection" id="sidebar-connection">' +
          '<div class="row"><span class="dot off" id="sidebar-dot"></span><span class="label" id="sidebar-conn-label">Checking…</span></div>' +
          '<div class="path" id="sidebar-conn-path">—</div>' +
          '<a class="switch" href="login.html">Switch connection →</a>' +
        '</div>' +
        '<div class="sidebar-footer">Runs entirely in your browser.<br>Nothing is sent anywhere but Azure DevOps.</div>' +
      '</aside>';

    document.body.classList.add('shell-body');
    document.body.insertAdjacentHTML('afterbegin', html);

    // best-effort initial paint; a page that confirms a working session later
    // should call updateConnection(cfg) to guarantee the badge matches reality
    updateConnection(cfg);
  }

  // Call this once a page has actually confirmed (or failed to confirm) a
  // usable session, so the badge always matches what's really being used —
  // never just what storage looked like at the instant the sidebar painted.
  function updateConnection(cfg) {
    const dot = document.getElementById('sidebar-dot');
    const label = document.getElementById('sidebar-conn-label');
    const path = document.getElementById('sidebar-conn-path');
    if (!dot || !label || !path) return;
    const connected = !!(cfg && cfg.org && cfg.project);
    dot.className = 'dot' + (connected ? '' : ' off');
    label.textContent = connected ? 'Connected' : 'No connection';
    path.innerHTML = connected
      ? escapeHtml(cfg.org) + ' / ' + escapeHtml(cfg.project) + (cfg.team ? '<br>' + escapeHtml(cfg.team) : '')
      : 'Not connected';
  }

  return { render: render, updateConnection: updateConnection };
})();
