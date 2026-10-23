// Effort estimator — shared by Dev Planner and Unicorn.
//
// ADO items often have no estimate. Rather than give every one the same flat
// number, this estimates effort from what the work is about:
//   1. Similar work: compare the item's title/description with items that DO
//      have real hours (actual completed work, original estimate or remaining
//      work) using TF-IDF cosine similarity, and take the similarity-weighted
//      median of the closest matches.
//   2. Complexity: when nothing similar exists, scale a baseline by the
//      complexity score (Low 0.5x, Medium 1x, High 2x). The baseline is the
//      team's median real estimate for that type when there are enough, else
//      the configured fallback hours.
// Every estimate carries its source, confidence and basis so the UI can show
// where the number came from. These are estimates, not ADO data.
(function (global) {
  const STOP = new Set(('a an the and or but if then else of to in on at by for with from as is are was were be been being it its this that these those ' +
    'not no yes can could should would will may might do does did done have has had having i we you he she they them our your their my me us ' +
    'when where which who whom what why how all any some each every more most other such only own same so than too very just also into out up down over under ' +
    'again once here there about after before between during through above below off per via etc please need needs needed issue bug task item work fix fixed error ' +
    'new old get got set use used using make made').split(/\s+/));

  function stripHtml(html) {
    if (!html) return '';
    return String(html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function stem(w) {
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 4 && /es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function tokenize(title, description) {
    // the title is the clearest statement of the topic, so it counts double
    const text = (String(title || '') + ' ') .repeat(2) + stripHtml(description).slice(0, 700);
    const tf = new Map();
    (text.toLowerCase().match(/[a-z0-9]{3,}/g) || []).forEach(raw => {
      if (STOP.has(raw) || /^\d+$/.test(raw)) return;
      const w = stem(raw);
      if (w.length < 3 || STOP.has(w)) return;
      tf.set(w, (tf.get(w) || 0) + 1);
    });
    return tf;
  }
  function median(arr) {
    if (!arr.length) return null;
    const s = arr.slice().sort((a, b) => a - b), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function weightedMedian(pairs) { // [{v, w}]
    const s = pairs.slice().sort((a, b) => a.v - b.v);
    const total = s.reduce((t, p) => t + p.w, 0);
    let acc = 0;
    for (const p of s) { acc += p.w; if (acc >= total / 2) return p.v; }
    return s[s.length - 1].v;
  }
  const roundHalf = (h) => Math.round(h * 2) / 2;
  const clamp = (h) => Math.max(0.5, Math.min(40, h));

  // cfg: { field, items, complexityFn(title, description) -> {label}, fallbackByType, hoursOf(it) -> number|null }
  function build(cfg) {
    const field = cfg.field;
    const refs = [];
    const df = new Map();
    (cfg.items || []).forEach(it => {
      const hours = cfg.hoursOf(it);
      if (!(hours > 0)) return;
      const tf = tokenize(field(it, 'System.Title'), field(it, 'System.Description'));
      if (!tf.size) return;
      refs.push({ id: it.id, type: field(it, 'System.WorkItemType'), hours, tf, title: field(it, 'System.Title') });
      tf.forEach((_, w) => df.set(w, (df.get(w) || 0) + 1));
    });
    const N = refs.length;
    const idf = (w) => Math.log((N + 1) / ((df.get(w) || 0) + 1)) + 1;
    const vec = (tf) => {
      const v = new Map(); let norm = 0;
      tf.forEach((c, w) => { const x = (1 + Math.log(c)) * idf(w); v.set(w, x); norm += x * x; });
      return { v, norm: Math.sqrt(norm) || 1 };
    };
    refs.forEach(r => { r.vec = vec(r.tf); });

    const typeMedians = {};
    const byType = {};
    refs.forEach(r => { (byType[r.type] = byType[r.type] || []).push(r.hours); });
    Object.keys(byType).forEach(t => { if (byType[t].length >= 3) typeMedians[t] = median(byType[t]); });
    const overallMedian = refs.length >= 5 ? median(refs.map(r => r.hours)) : null;
    const cache = new Map();

    function baselineFor(type) {
      if (typeMedians[type]) return { hours: typeMedians[type], from: `team median for ${type}s (${byType[type].length} with real hours)` };
      if (overallMedian) return { hours: overallMedian, from: `team median (${refs.length} items with real hours)` };
      const fb = cfg.fallbackByType || {};
      return { hours: fb[type] || fb._default || 4, from: 'configured fallback hours' };
    }

    function estimate(it) {
      if (cache.has(it.id)) return cache.get(it.id);
      const type = field(it, 'System.WorkItemType');
      const title = field(it, 'System.Title'), desc = field(it, 'System.Description');
      const tf = tokenize(title, desc);
      let out = null;
      if (tf.size && refs.length) {
        const q = vec(tf);
        const scored = [];
        for (const r of refs) {
          if (r.id === it.id) continue;
          let dot = 0;
          const [small, big] = q.v.size <= r.vec.v.size ? [q.v, r.vec.v] : [r.vec.v, q.v];
          small.forEach((x, w) => { const y = big.get(w); if (y) dot += x * y; });
          let sim = dot / (q.norm * r.vec.norm);
          if (r.type === type) sim *= 1.1;
          if (sim >= 0.2) scored.push({ r, sim: Math.min(1, sim) });
        }
        scored.sort((a, b) => b.sim - a.sim);
        const top = scored.slice(0, 5);
        const avgSim = top.length ? top.reduce((t, x) => t + x.sim, 0) / top.length : 0;
        if (top.length >= 2 || (top.length === 1 && top[0].sim >= 0.5)) {
          const hours = clamp(roundHalf(weightedMedian(top.map(x => ({ v: x.r.hours, w: x.sim })))));
          const confidence = top.length >= 3 && avgSim >= 0.4 ? 'high' : (top.length >= 2 && avgSim >= 0.3) || top[0].sim >= 0.5 ? 'medium' : 'low';
          out = { hours, source: 'similar', confidence,
            neighbours: top.map(x => ({ id: x.r.id, hours: x.r.hours, sim: Math.round(x.sim * 100) / 100, title: x.r.title })),
            basis: `similar to ${top.map(x => '#' + x.r.id + ' (' + x.r.hours + 'h)').join(', ')}` };
        }
      }
      if (!out) {
        const base = baselineFor(type);
        const cx = (cfg.complexityFn ? cfg.complexityFn(title, desc) : null) || {};
        const score = typeof cx.score === 'number' ? cx.score : (cx.label === 'High' ? 7 : cx.label === 'Low' ? 1.5 : 3.5);
        // continuous scaling so items don't all collapse onto one number: score 3.5 = baseline
        const factor = Math.max(0.5, Math.min(2.5, 0.5 + score / 7));
        out = { hours: clamp(roundHalf(base.hours * factor)), source: 'complexity', confidence: 'low', neighbours: [],
          basis: `complexity score ${Math.round(score * 10) / 10} (${cx.label || 'Medium'}) x ${Math.round(factor * 100) / 100} of the ${base.from} (${Math.round(base.hours * 10) / 10}h)` };
      }
      cache.set(it.id, out);
      return out;
    }
    return { estimate, refCount: refs.length, typeMedians, overallMedian };
  }

  global.ADOEffort = { build, tokenize };
})(typeof window !== 'undefined' ? window : globalThis);
