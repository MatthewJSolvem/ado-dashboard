/* ========================================================================
   ADO Ops Console — shared session helper
   One place that knows how connection details (org/project/team/PAT/
   recipient) are stored and shared across every screen.

   - sessionStorage: cleared when the tab/browser closes. Always written.
   - localStorage:   only written when the user ticks "stay signed in on
                      this device" at login, so the PAT persists across visits.
   ======================================================================== */

const ADOSession = (function () {
  const KEY = 'ado-session';
  const PROFILES_KEY = 'ado-profiles';

  function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  function load() {
    let cfg = safeParse(sessionStorage.getItem(KEY));
    if (!cfg) {
      // hydrate this tab's session from a remembered device login, if any
      cfg = safeParse(localStorage.getItem(KEY));
      if (cfg) { try { sessionStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }
    }
    return cfg || null;
  }

  function save(cfg, remember) {
    const data = JSON.stringify(cfg);
    try { sessionStorage.setItem(KEY, data); } catch (e) {}
    try {
      if (remember) localStorage.setItem(KEY, data);
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function clear() {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  function isConnected() {
    const cfg = load();
    return !!(cfg && cfg.org && cfg.project && cfg.pat);
  }

  // Redirects to login if there's no usable connection yet. Call at the
  // top of every report page. Returns the config (or null, mid-redirect).
  function requireSession() {
    const cfg = load();
    if (!cfg || !cfg.org || !cfg.project || !cfg.pat) {
      const back = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
      location.replace('login.html?next=' + back);
      return null;
    }
    return cfg;
  }

  // Fills form fields (by element id) from the stored session, if present.
  function hydrateInputs(map) {
    const cfg = load();
    if (!cfg) return cfg;
    Object.keys(map).forEach(function (cfgKey) {
      const el = document.getElementById(map[cfgKey]);
      if (el && cfg[cfgKey] != null) el.value = cfg[cfgKey];
    });
    return cfg;
  }

  function loadProfiles() {
    return safeParse(localStorage.getItem(PROFILES_KEY)) || {};
  }

  function logout() {
    clear();
    location.href = 'login.html';
  }

  return { load, save, clear, isConnected, requireSession, hydrateInputs, loadProfiles, logout };
})();
