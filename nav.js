/* ========================================================================
   ADO Ops Console — shared left-hand navigation
   Call ADONav.render('pageKey') once, right after <body> opens.

   Includes a "Gen Z Mode" toggle in the sidebar that swaps chrome copy
   (headings, buttons, labels, nav items, section titles, table column
   headers) between normal and Gen Z phrasing. It deliberately never
   touches table cell values, badges, or stat numbers — only UI chrome —
   so real ticket data is never altered.
   ======================================================================== */

const ADONav = (function () {
  const PAGES = [
    { key: 'dashboard', href: 'index.html', label: 'Morning Dashboard',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>' },
    { key: 'tracker', href: 'master-tracker-review.html', label: 'Master Tracker Review',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
    { key: 'capacity', href: 'team-capacity-planner.html', label: 'Team Capacity Planner',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 15l2 2 4-4"/></svg>' },
    { key: 'resource', href: 'resource-review.html', label: 'Resource Review',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/><path d="M15 3.5a4 4 0 0 1 0 7.6"/></svg>' },
    { key: 'client', href: 'client-investigation.html', label: 'Client Investigation',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' },
    { key: 'crm', href: 'crm-clients.html', label: 'Client Relationship Manager',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { key: 'leaderboard', href: 'leaderboard.html', label: 'Leaderboard',
      ico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4"/></svg>' },
  ];

  const GENZ_KEY = 'ado-genz-mode';

  // exact-phrase swaps checked first (case-sensitive, trimmed match)
  const GENZ_PHRASES = {
    'Dashboard': 'Dash', 'Reports': 'Tea', 'Report': 'Tea',
    'Connected': 'Vibin', 'No connection': 'Big No Cap', 'Not connected': 'Big No Cap',
    'Checking…': 'Hol up…', 'Switch connection →': 'Switch the vibe →',
    'Runs entirely in your browser.': 'Runs 100% in yo browser, no cap.',
    'Nothing is sent anywhere but Azure DevOps.': "Ain't nothing leaving the chat 'cept straight to Azure DevOps, fr fr.",
    'Morning Dashboard': 'AM Dash', 'Master Tracker Review': 'Tracker Recap, Bestie',
    'Team Capacity Planner': 'Capacity Check', 'Client Investigation': 'Client Deep-Dive',
    'Leaderboard': 'Clout Board', 'Client Relationship Manager': 'CRM, No Cap',
    'Resource Review': 'Squad Check', 'Review Team': 'Run the Check',
    'Connect →': 'Link Up →', 'Load Dashboard': 'Pull Up the Dash',
    'Refresh Review': 'Run It Back', 'Export CSV': 'Yeet to CSV', 'Load Data': 'Pull the Tea',
    'Copy summary': 'Yeet the Recap', 'Report mode': 'Client-Safe Mode',
  };

  // fallback whole-word swaps, only ever applied inside safelisted chrome
  // elements (never table cells / badges / stat numbers)
  const GENZ_WORDS = [
    [/\bgood\b/gi, 'bussin'], [/\bgreat\b/gi, 'bussin'], [/\berrors?\b/gi, 'big yikes'],
    [/\bloading\b/gi, 'hol up'], [/\bdone\b/gi, 'bet'], [/\bclosed\b/gi, 'closed fr fr'],
    [/\bopen\b/gi, 'still poppin'], [/\bconnect\b/gi, 'link up'], [/\bconnection\b/gi, 'the link'],
    [/\bweekly\b/gi, 'every week fr'], [/\bsummary\b/gi, 'the tea'], [/\bstatus\b/gi, 'the sitch'],
    [/\breview\b/gi, 'recap'], [/\bsearch\b/gi, 'dig up'], [/\bcompare\b/gi, 'clock the diff'],
    [/\bmismatch(es)?\b/gi, 'not it, sis'], [/\baligned\b/gi, 'in sync, no cap'],
  ];

  const SAFE_SELECTOR = [
    'h1', 'h2', '.subtitle', 'button', 'label', '.nav-item', '.brand .name', '.brand .sub',
    '.sidebar-footer', 'th', '#sidebar-conn-label', '.switch',
  ].join(', ');

  function transformText(s) {
    const trimmed = s.trim();
    if (GENZ_PHRASES[trimmed] != null) {
      return s.replace(trimmed, GENZ_PHRASES[trimmed]);
    }
    let out = s;
    GENZ_WORDS.forEach(([re, repl]) => { out = out.replace(re, repl); });
    return out;
  }

  function genzifyEl(el) {
    if (el.dataset.genzApplied === '1') return;
    if (el.closest('[data-genz-skip]')) return;
    const original = el.textContent;
    if (!original || !original.trim()) return;
    el.dataset.genzOrig = original;
    el.textContent = transformText(original);
    el.dataset.genzApplied = '1';
  }
  function ungenzifyEl(el) {
    if (el.dataset.genzApplied !== '1') return;
    el.textContent = el.dataset.genzOrig;
    delete el.dataset.genzApplied;
    delete el.dataset.genzOrig;
  }

  function applyGenZMode(on, root) {
    (root || document).querySelectorAll(SAFE_SELECTOR).forEach(el => on ? genzifyEl(el) : ungenzifyEl(el));
  }

  function isGenZOn() {
    try { return localStorage.getItem(GENZ_KEY) === '1'; } catch (e) { return false; }
  }
  function setGenZ(on) {
    try { localStorage.setItem(GENZ_KEY, on ? '1' : '0'); } catch (e) {}
    applyGenZMode(on);
  }
  function toggleGenZ(on) { setGenZ(!!on); }

  function ensureGenZStyle() {
    if (document.getElementById('genz-style')) return;
    const style = document.createElement('style');
    style.id = 'genz-style';
    style.textContent = `
      .genz-row { display:flex; align-items:center; justify-content:space-between; gap:8px;
        margin:4px 12px 10px; padding:9px 10px; border-radius:8px; background:var(--sb-bg-raised); border:1px solid var(--sb-border); }
      .genz-row .genz-label { font-size:12px; font-weight:600; color:var(--sb-text); }
      .genz-switch { position:relative; width:34px; height:19px; flex:0 0 auto; }
      .genz-switch input { opacity:0; width:0; height:0; }
      .genz-switch .slider { position:absolute; inset:0; background:#3a4157; border-radius:20px; cursor:pointer; transition:.15s; }
      .genz-switch .slider:before { content:''; position:absolute; width:14px; height:14px; left:2.5px; top:2.5px;
        background:#fff; border-radius:50%; transition:.15s; }
      .genz-switch input:checked + .slider { background:var(--sb-accent); }
      .genz-switch input:checked + .slider:before { transform:translateX(15px); }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function render(activeKey) {
    const cfg = (window.ADOSession && ADOSession.load()) || null;
    const connected = !!(cfg && cfg.org && cfg.project);
    const genzOn = isGenZOn();

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
        '<div class="genz-row">' +
          '<span class="genz-label">Gen Z Mode</span>' +
          '<label class="genz-switch"><input type="checkbox" id="genz-toggle-input" ' + (genzOn ? 'checked' : '') + ' onchange="ADONav.toggleGenZ(this.checked)"><span class="slider"></span></label>' +
        '</div>' +
        '<div class="connection" id="sidebar-connection">' +
          '<div class="row"><span class="dot off" id="sidebar-dot"></span><span class="label" id="sidebar-conn-label">Checking…</span></div>' +
          '<div class="path" id="sidebar-conn-path">—</div>' +
          '<a class="switch" href="login.html">Switch connection →</a>' +
        '</div>' +
        '<div class="sidebar-footer">Runs entirely in your browser.<br>Nothing is sent anywhere but Azure DevOps.</div>' +
      '</aside>';

    ensureGenZStyle();
    document.body.classList.add('shell-body');
    document.body.insertAdjacentHTML('afterbegin', html);

    // best-effort initial paint; a page that confirms a working session later
    // should call updateConnection(cfg) to guarantee the badge matches reality
    updateConnection(cfg);

    // sidebar itself is in the DOM now — genz-ify it immediately if enabled
    if (genzOn) applyGenZMode(true);

    // the rest of the page (h1, buttons, section titles...) hasn't parsed
    // yet since render() runs right after <body> opens — catch it once the
    // document finishes loading
    document.addEventListener('DOMContentLoaded', function () {
      if (isGenZOn()) applyGenZMode(true);
    });
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
    if (isGenZOn()) genzifyEl(label);
    path.innerHTML = connected
      ? escapeHtml(cfg.org) + ' / ' + escapeHtml(cfg.project) + (cfg.team ? '<br>' + escapeHtml(cfg.team) : '')
      : 'Not connected';
  }

  return { render: render, updateConnection: updateConnection, toggleGenZ: toggleGenZ, applyGenZMode: applyGenZMode, isGenZOn: isGenZOn };
})();
