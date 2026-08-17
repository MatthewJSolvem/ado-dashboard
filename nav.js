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
    { key: 'weekly', href: 'weekly-team-report.html', label: 'Weekly Team Report',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' },
    { key: 'client', href: 'client-investigation.html', label: 'Client Investigation',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' },
    { key: 'leaderboard', href: 'leaderboard.html', label: 'Leaderboard',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4"/></svg>' },
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

    const path = connected
      ? escapeHtml(cfg.org) + ' / ' + escapeHtml(cfg.project) + (cfg.team ? '<br>' + escapeHtml(cfg.team) : '')
      : 'Not connected';

    const html =
      '<aside class="app-sidebar">' +
        '<div class="brand"><div class="mark">A</div><div><div class="name">ADO Ops Console</div><div class="sub">Azure DevOps</div></div></div>' +
        '<nav>' +
          '<div class="nav-label">Reports</div>' +
          navItems +
        '</nav>' +
        '<div class="connection">' +
          '<div class="row"><span class="dot' + (connected ? '' : ' off') + '"></span><span class="label">' + (connected ? 'Connected' : 'No connection') + '</span></div>' +
          '<div class="path">' + path + '</div>' +
          '<a class="switch" href="login.html">Switch connection →</a>' +
        '</div>' +
        '<div class="sidebar-footer">Runs entirely in your browser.<br>Nothing is sent anywhere but Azure DevOps.</div>' +
      '</aside>';

    document.body.classList.add('shell-body');
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  return { render: render };
})();
