/* Bebras Practice — core: seeded RNG, task registry, grading, scoring, exam composition.
   Works in the browser (classic script) and in Node (tests load it with vm). */
(function (root) {
  'use strict';
  var B = root.Bebras = root.Bebras || {};

  /* ---------- registry ---------- */
  B.registry = [];
  B.register = function (def) { B.registry.push(def); };
  B.findDef = function (id) {
    for (var i = 0; i < B.registry.length; i++) if (B.registry[i].id === id) return B.registry[i];
    return null;
  };

  /* ---------- seeded random ---------- */
  B.hashSeed = function (str) {            // FNV-1a -> uint32
    var h = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  B.makeRng = function (seed) {            // mulberry32
    var a = seed >>> 0;
    function next() {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var r = {
      next: next,
      int: function (lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      chance: function (p) { return next() < p; },
      shuffle: function (arr) {
        var c = arr.slice();
        for (var i = c.length - 1; i > 0; i--) {
          var j = Math.floor(next() * (i + 1)); var t = c[i]; c[i] = c[j]; c[j] = t;
        }
        return c;
      },
      sample: function (arr, k) { return r.shuffle(arr).slice(0, k); }
    };
    return r;
  };

  /* ---------- small helpers ---------- */
  B.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  B.LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  B.svg = function (w, h, inner, label) {
    return '<svg class="fig" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" role="img" aria-label="' +
      B.esc(label || '') + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  };
  B.thaiDigits = function (s) {            // ๐-๙ -> 0-9
    return String(s).replace(/[๐-๙]/g, function (c) { return String(c.charCodeAt(0) - 0x0E50); });
  };

  /* ---------- build a task from a generator ---------- */
  B.buildTask = function (def, seed) {
    var t = def.gen(B.makeRng(seed));
    t.defId = def.id; t.level = def.level; t.topic = def.topic; t.title = def.title; t.seed = seed;
    return t;
  };

  /* ---------- grading ---------- */
  B.normText = function (s) { return B.thaiDigits(s == null ? '' : s).trim().replace(/\s+/g, '').toUpperCase(); };

  B.isAnswered = function (task, ans) {
    if (ans === undefined || ans === null) return false;
    switch (task.type) {
      case 'choice': return typeof ans === 'number';
      case 'number': case 'text': return String(ans).trim() !== '';
      case 'grid': return Array.isArray(ans) && ans.some(function (v) { return !!v; });
      case 'program': return Array.isArray(ans) && ans.length > 0;
    }
    return false;
  };

  B.grade = function (task, ans) {
    if (!B.isAnswered(task, ans)) return false;
    switch (task.type) {
      case 'choice': return ans === task.answer;
      case 'number':
        var txt = B.thaiDigits(ans).trim().replace(',', '.');
        if (!/^-?\d+(\.\d+)?$/.test(txt)) return false;
        return Number(txt) === task.answer;
      case 'text': return B.normText(ans) === B.normText(task.answer);
      case 'grid': case 'program': return !!task.judge(ans);
    }
    return false;
  };

  /* ---------- scoring (international pattern; the real Thai exam may differ) ---------- */
  B.POINTS = { A: { right: 6, wrong: 2 }, B: { right: 9, wrong: 3 }, C: { right: 12, wrong: 4 } };

  B.scoreExam = function (tasks, answers) {
    var res = { raw: 0, score: 0, max: 0, right: 0, wrong: 0, blank: 0, status: [], byLevel: {} };
    tasks.forEach(function (t, i) {
      var p = B.POINTS[t.level];
      var bl = res.byLevel[t.level] = res.byLevel[t.level] || { total: 0, right: 0, wrong: 0, blank: 0 };
      bl.total++; res.max += p.right;
      var ans = answers[i], st;
      if (!B.isAnswered(t, ans)) { st = 'blank'; res.blank++; bl.blank++; }
      else if (B.grade(t, ans)) { st = 'right'; res.right++; bl.right++; res.raw += p.right; }
      else { st = 'wrong'; res.wrong++; bl.wrong++; res.raw -= p.wrong; }
      res.status.push(st);
    });
    res.score = Math.max(0, res.raw);
    return res;
  };

  /* ---------- exam composition ---------- */
  B.PRESETS = {
    quick:  { label: 'ซ้อมสั้น',                 note: '5 ข้อ • 15 นาที',  counts: { A: 2, B: 2, C: 1 }, minutes: 15 },
    junior: { label: 'ชุดเต็ม ระดับต้น (เทียบ ม.ต้น)', note: '12 ข้อ • 45 นาที', counts: { A: 5, B: 4, C: 3 }, minutes: 45 },
    senior: { label: 'ชุดเต็ม ระดับสูง (เทียบ ม.ปลาย)', note: '15 ข้อ • 45 นาที', counts: { A: 3, B: 6, C: 6 }, minutes: 45 }
  };

  B.composeExam = function (code, presetId) {
    var preset = B.PRESETS[presetId];
    var rng = B.makeRng(B.hashSeed(code + '|' + presetId));
    var items = [];
    ['A', 'B', 'C'].forEach(function (lv) {
      var pool = B.registry.filter(function (d) { return d.level === lv; });
      var queue = [];
      for (var i = 0; i < preset.counts[lv]; i++) {
        if (!queue.length) queue = rng.shuffle(pool);
        var def = queue.shift();
        items.push({ defId: def.id, level: lv, seed: B.hashSeed(code + '|' + presetId + '|' + items.length + '|' + def.id) });
      }
    });
    return items;
  };
  B.buildItem = function (item) { return B.buildTask(B.findDef(item.defId), item.seed); };

  /* A short human-friendly code for a fresh random set */
  B.newCode = function (rand) {
    rand = rand || Math.random;
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 6; i++) s += chars.charAt(Math.floor(rand() * chars.length));
    return s;
  };
})(typeof window !== 'undefined' ? window : globalThis);
