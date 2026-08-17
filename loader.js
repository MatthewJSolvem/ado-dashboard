/* ========================================================================
   ADO Ops Console — shared loading overlay
   Call ADOLoader.show() right before kicking off a load, then feed it the
   same status text the page already produces (see wireStatus), and it
   hides itself automatically once that text says "Done." or an error
   is shown.
   ======================================================================== */

const ADOLoader = (function () {
  let el = null;
  let fillEl = null;
  let textEl = null;
  let steps = 0;

  function ensure() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'app-loading';
    el.id = 'app-loading';
    el.innerHTML =
      '<div class="box">' +
        '<div class="spinner"></div>' +
        '<div class="text" id="app-loading-text">Connecting…</div>' +
        '<div class="track"><div class="fill" id="app-loading-fill"></div></div>' +
      '</div>';
    const main = document.querySelector('.app-main') || document.body;
    main.appendChild(el);
    fillEl = document.getElementById('app-loading-fill');
    textEl = document.getElementById('app-loading-text');
  }

  function show(initialText) {
    ensure();
    steps = 0;
    fillEl.style.width = '4%';
    textEl.textContent = initialText || 'Connecting…';
    el.style.display = 'flex';
  }

  // Feed it the same text a page already sends to its own status line —
  // the bar climbs a bit further (asymptotically) on every distinct step,
  // so it always looks like it's making real progress without needing to
  // know the exact step count up front.
  function setText(msg) {
    if (!el || el.style.display === 'none') return;
    if (!msg) return;
    if (msg === 'Done.') {
      fillEl.style.width = '100%';
      textEl.textContent = 'Done.';
      setTimeout(hide, 260);
      return;
    }
    steps++;
    const pct = Math.min(94, Math.round(100 * (1 - Math.exp(-steps / 6))));
    fillEl.style.width = pct + '%';
    textEl.textContent = msg;
  }

  function hide() {
    if (el) el.style.display = 'none';
  }

  return { show: show, setText: setText, hide: hide };
})();
