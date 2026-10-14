/* Independent re-solvers. Each one recomputes the answer from task.data with a DIFFERENT method than the generator
   (closed forms, brute force, exhaustive search), then compares with what the task claims. Returns [] if OK, else a list of problems. */
'use strict';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MOVES = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };

function perms(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((v, i) => perms(arr.slice(0, i).concat(arr.slice(i + 1))).forEach(p => out.push([v].concat(p))));
  return out;
}

const S = {};

S['pattern-seq'] = (B, t) => {
  const d = t.data, k = d.k; let v;
  if (d.kind === 'arith') v = d.s + (k - 1) * d.d;
  else if (d.kind === 'alt') v = d.s + d.a * Math.ceil((k - 1) / 2) + d.b * Math.floor((k - 1) / 2);
  else if (d.kind === 'geo') v = d.s * Math.pow(d.r, k - 1);
  else if (d.kind === 'square') v = k * k + d.c;
  else { let m = [[1, 1], [1, 0]], r = [[1, 0], [0, 1]], e = k - 2; // fib via matrix power
    const mul = (x, y) => [[x[0][0]*y[0][0]+x[0][1]*y[1][0], x[0][0]*y[0][1]+x[0][1]*y[1][1]],[x[1][0]*y[0][0]+x[1][1]*y[1][0], x[1][0]*y[0][1]+x[1][1]*y[1][1]]];
    while (e > 0) { if (e & 1) r = mul(r, m); m = mul(m, m); e >>= 1; }
    v = r[0][0] * d.b + r[0][1] * d.a; }
  const p = [];
  if (v !== t.answer) p.push(`answer ${t.answer} vs recomputed ${v}`);
  if (d.shown.length < 4) p.push('too few shown terms');
  return p;
};

S['binary-lamps'] = (B, t) => {
  const d = t.data, p = [], k = d.weights.length;
  if (t.type === 'number') {
    let s = 0; d.bits.forEach((b, i) => { if (b) s += d.weights[i]; });
    if (s !== t.answer) p.push(`read: ${s} vs ${t.answer}`);
  } else {
    let good = 0;
    for (let m = 0; m < (1 << k); m++) {
      const cells = []; let sum = 0;
      for (let i = 0; i < k; i++) { const b = (m >> i) & 1; cells.push(b); sum += b * d.weights[i]; }
      const j = t.judge(cells);
      if (j !== (sum === d.N)) p.push(`judge mismatch for mask ${m}`);
      if (sum === d.N) good++;
    }
    if (good !== 1) p.push(`${good} combinations reach ${d.N}`);
  }
  return p;
};

S['caesar'] = (B, t) => {
  const d = t.data, p = [];
  const sh = (w, s) => [...w].map(c => String.fromCharCode(65 + (((c.charCodeAt(0) - 65 + s) % 26) + 26) % 26)).join('');
  const exp = d.encode ? sh(d.word, d.shift) : d.word;
  if (exp !== t.answer) p.push(`${exp} vs ${t.answer}`);
  if (d.encode && sh(t.answer, -d.shift) !== d.word) p.push('round trip failed');
  if (!B.grade(t, ' ' + exp.toLowerCase() + ' ')) p.push('grading should accept lowercase/space');
  if (B.grade(t, exp + 'X')) p.push('grading accepted wrong text');
  return p;
};

S['sets-count'] = (B, t) => {
  const d = t.data, p = []; const found = [];
  for (let both = 0; both <= Math.min(d.a, d.b); both++) {
    const onlyA = d.a - both, onlyB = d.b - both;
    if (onlyA + onlyB + both + d.none === d.T) found.push({ both, onlyA, onlyB });
  }
  if (found.length !== 1) return ['solutions: ' + found.length];
  const f = found[0], v = f[d.ask];
  if (v !== t.answer) p.push(`${v} vs ${t.answer}`);
  return p;
};

S['rle-pixels'] = (B, t) => {
  const d = t.data, p = [], n = d.n;
  const dec = nums => { const r = []; let c = 0; nums.forEach(x => { for (let i = 0; i < x; i++) r.push(c); c ^= 1; }); return r; };
  if (t.type === 'grid') {
    d.codes.forEach((cd, i) => { if (dec(cd).join('') !== d.image[i].join('')) p.push('code row ' + i + ' does not decode to image'); if (dec(cd).length !== n) p.push('row width'); });
    const flat = [].concat(...d.image);
    if (!t.judge(flat)) p.push('judge rejects the true image');
    for (let i = 0; i < flat.length; i++) { const m = flat.slice(); m[i] ^= 1; if (t.judge(m)) p.push('judge accepts image with cell ' + i + ' flipped'); }
  } else {
    const target = d.image[d.row], good = [];
    d.options.forEach((o, i) => { const r = dec(o.split(' ').map(Number)); if (r.length === n && r.join('') === target.join('')) good.push(i); });
    if (good.length !== 1) p.push('options matching: ' + good.length);
    else if (good[0] !== t.answer) p.push('answer index mismatch');
    if (new Set(d.options).size !== d.options.length) p.push('duplicate options');
  }
  return p;
};

S['robot-trace'] = (B, t) => {
  const d = t.data, p = [];
  const expand = []; d.items.forEach(it => { if (it.rep) for (let k = 0; k < it.rep; k++) expand.push(...it.body); else expand.push(it.m); });
  const wall = new Set(d.walls.map(w => w.join(',')));
  let x = d.start[1], y = d.start[0];
  expand.forEach(m => { const nx = x + MOVES[m][1], ny = y + MOVES[m][0]; if (nx < 0 || ny < 0 || nx >= d.cols || ny >= d.rows || wall.has(ny + ',' + nx)) return; x = nx; y = ny; });
  const label = LETTERS[x] + (y + 1);
  const good = d.options.map((o, i) => o === label ? i : -1).filter(i => i >= 0);
  if (good.length !== 1 || good[0] !== t.answer) p.push(`label ${label}, matching options ${good}, answer ${t.answer}`);
  if (new Set(d.options).size !== d.options.length) p.push('duplicate options');
  if (wall.has(d.start.join(','))) p.push('start on a wall');
  return p;
};

S['shortest-path'] = (B, t) => {
  const d = t.data, p = [];
  // Bellman-Ford
  const dist = Array(d.n).fill(Infinity); dist[d.from] = 0;
  for (let it = 0; it < d.n; it++) d.edges.forEach(e => { if (dist[e.u] + e.w < dist[e.v]) dist[e.v] = dist[e.u] + e.w; if (dist[e.v] + e.w < dist[e.u]) dist[e.u] = dist[e.v] + e.w; });
  // exhaustive simple paths
  let best = Infinity;
  const adj = Array.from({ length: d.n }, () => []);
  d.edges.forEach(e => { adj[e.u].push([e.v, e.w]); adj[e.v].push([e.u, e.w]); });
  (function dfs(u, seen, cost) { if (cost >= best) return; if (u === d.to) { best = cost; return; } adj[u].forEach(([v, w]) => { if (!seen.has(v)) { seen.add(v); dfs(v, seen, cost + w); seen.delete(v); } }); })(d.from, new Set([d.from]), 0);
  if (dist[d.to] !== t.answer) p.push(`BF ${dist[d.to]} vs ${t.answer}`);
  if (best !== t.answer) p.push(`DFS ${best} vs ${t.answer}`);
  const key = new Set(); d.edges.forEach(e => { const k = Math.min(e.u, e.v) + '-' + Math.max(e.u, e.v); if (key.has(k)) p.push('duplicate edge ' + k); key.add(k); });
  return p;
};

S['sort-swaps'] = (B, t) => {
  const d = t.data, p = [], n = d.list.length;
  const target = d.list.slice().sort((a, b) => a - b).join(',');
  const start = d.list.join(','), dist = new Map([[start, 0]]), q = [d.list.slice()];
  for (let h = 0; h < q.length; h++) {
    const cur = q[h], k = cur.join(',');
    if (k === target) { if (dist.get(k) !== t.answer) p.push(`BFS ${dist.get(k)} vs ${t.answer}`); return p; }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (d.adjacent && j !== i + 1) continue;
      const nx = cur.slice(); [nx[i], nx[j]] = [nx[j], nx[i]]; const nk = nx.join(',');
      if (!dist.has(nk)) { dist.set(nk, dist.get(k) + 1); q.push(nx); }
    }
  }
  return ['target not reached'];
};

S['halving'] = (B, t) => {
  const d = t.data, memo = new Map();
  const f = n => {
    if (n <= 1) return 0; if (memo.has(n)) return memo.get(n);
    let best = Infinity;
    if (d.kind === 'guess') { for (let a = 1; a < n; a++) best = Math.min(best, 1 + Math.max(f(a), f(n - a))); }
    else { for (let a = 1; 2 * a <= n; a++) best = Math.min(best, 1 + Math.max(f(a), f(n - 2 * a))); }
    memo.set(n, best); return best;
  };
  const v = f(d.N);
  return v === t.answer ? [] : [`minimax ${v} vs ${t.answer}`];
};

S['path-count'] = (B, t) => {
  const d = t.data, wall = new Set(d.walls.map(w => w.join(','))); let cnt = 0;
  (function dfs(r, c) { if (r >= d.R || c >= d.C || wall.has(r + ',' + c)) return; if (r === d.R - 1 && c === d.C - 1) { cnt++; return; } dfs(r + 1, c); dfs(r, c + 1); })(0, 0);
  return cnt === t.answer ? [] : [`DFS ${cnt} vs ${t.answer}`];
};

S['robot-grid'] = (B, t) => {
  const d = t.data, p = [], n = d.n, wall = new Set(d.walls.map(w => w.join(',')));
  const run = seq => { let r = d.start[0], c = d.start[1]; for (const m of seq) { const nr = r + MOVES[m][0], nc = c + MOVES[m][1]; if (nr < 0 || nc < 0 || nr >= n || nc >= n || wall.has(nr + ',' + nc)) continue; r = nr; c = nc; } return r === d.goal[0] && c === d.goal[1]; };
  // iterative deepening, remembering one solution
  let sol = null, depth;
  const dfs = (seq, left) => { if (left === 0) return run(seq); for (const m of 'UDLR') { seq.push(m); if (dfs(seq, left - 1)) return true; seq.pop(); } return false; };
  for (depth = 0; depth <= d.max; depth++) { const seq = []; if (dfs(seq, depth)) { sol = seq.slice(); break; } }
  if (!sol) return ['no solution within max'];
  if (sol.length !== d.max) p.push(`shortest is ${sol.length}, task says ${d.max}`);
  if (!t.judge(sol)) p.push('judge rejects the shortest solution');
  if (t.judge(sol.concat(['U']))) { if (!run(sol.concat(['U']))) { /* fine: judge must reject when run fails */ } else p.push('judge accepted a too-long program'); }
  if (t.judge([])) p.push('judge accepted empty program');
  // random wrong programs must agree with the independent runner
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 300; i++) { const len = 1 + Math.floor(rnd() * (d.max + 2)), seq = []; for (let j = 0; j < len; j++) seq.push('UDLR'[Math.floor(rnd() * 4)]); const exp = len <= d.max && run(seq); if (t.judge(seq) !== exp) p.push('judge disagrees with runner on ' + seq.join('')); }
  return p;
};

S['stack-train'] = (B, t) => {
  const d = t.data, p = [], reach = new Set();
  (function dfs(next, stack, out) {
    if (out.length === d.n) { reach.add(out.join(' ')); return; }
    if (next <= d.n) dfs(next + 1, stack.concat([next]), out);
    if (stack.length) dfs(next, stack.slice(0, -1), out.concat([stack[stack.length - 1]]));
  })(1, [], []);
  const flags = d.options.map(o => reach.has(o.join(' ')));
  if (flags.filter(Boolean).length !== 1) p.push('reachable options: ' + flags.filter(Boolean).length);
  if (flags.indexOf(true) !== t.answer) p.push('answer index mismatch');
  if (new Set(d.options.map(o => o.join(' '))).size !== d.options.length) p.push('duplicate options');
  return p;
};

S['logic-liars'] = (B, t) => {
  const d = t.data, n = d.stmts.length, truth = (st, h) => st.t === 'T' ? h[st.x] : st.t === 'L' ? !h[st.x] : st.t === 'AND' ? (h[st.x] && h[st.y]) : (h[st.x] || h[st.y]);
  const sols = [];
  const rec = (i, h) => { if (i === n) { if (d.stmts.every((st, k) => truth(st, h) === h[k])) sols.push(h.slice()); return; } for (const v of [true, false]) { h[i] = v; rec(i + 1, h); } };
  rec(0, []);
  if (sols.length !== 1) return ['solutions: ' + sols.length];
  const c = sols[0].filter(Boolean).length;
  return c === t.answer ? [] : [`${c} vs ${t.answer}`];
};

S['automaton'] = (B, t) => {
  const d = t.data;
  // one-hot vector times 0/1 transition matrices
  const mat = ch => d.tr.map(row => [0, 1, 2].map(j => row[ch === 'a' ? 0 : 1] === j ? 1 : 0));
  let cnt = 0;
  d.strs.forEach(s => { let v = [1, 0, 0]; for (const ch of s) { const m = mat(ch); v = [0, 1, 2].map(j => v.reduce((a, x, i) => a + x * m[i][j], 0)); } if (v[d.acc] === 1) cnt++; });
  return cnt === t.answer ? [] : [`${cnt} vs ${t.answer}`];
};

S['water-jugs'] = (B, t) => {
  const { a, b, t: target } = t.data;
  let layer = new Set(['0,0']), seen = new Set(layer), steps = 0;
  while (layer.size) {
    for (const s of layer) { const [x, y] = s.split(',').map(Number); if (x === target || y === target) return steps === t.answer ? [] : [`${steps} vs ${t.answer}`]; }
    const next = new Set();
    for (const s of layer) {
      const [x, y] = s.split(',').map(Number);
      const cand = [[a, y], [x, b], [0, y], [x, 0]];
      const tr = Math.min(x, b - y); cand.push([x - tr, y + tr]);
      const tl = Math.min(y, a - x); cand.push([x + tl, y - tl]);
      cand.forEach(c => { const k = c.join(','); if (!seen.has(k)) { seen.add(k); next.add(k); } });
    }
    layer = next; steps++;
  }
  return ['unreachable'];
};

S['graph-coloring'] = (B, t) => {
  const d = t.data, p = [], n = d.n;
  const ok = k => { const tot = Math.pow(k, n); for (let code = 0; code < tot; code++) { const col = []; let c = code; for (let i = 0; i < n; i++) { col.push(c % k); c = Math.floor(c / k); } if (d.edges.every(([u, v]) => col[u] !== col[v])) return true; } return false; };
  if (!ok(t.answer)) p.push(`${t.answer} colors not enough`);
  if (t.answer > 1 && ok(t.answer - 1)) p.push(`${t.answer - 1} colors suffice`);
  return p;
};

S['critical-path'] = (B, t) => {
  const d = t.data; let best = 0;
  const succ = Array.from({ length: d.n }, () => []);
  d.deps.forEach((ds, i) => ds.forEach(q => succ[q].push(i)));
  d.deps.forEach((ds, i) => { if (ds.some(q => q >= i)) throw new Error('bad dependency order'); });
  (function dfs(u, sum) { sum += d.dur[u]; if (sum > best) best = sum; succ[u].forEach(v => dfs(v, sum)); })(0, 0);
  for (let s = 1; s < d.n; s++) if (!d.deps[s].length) (function dfs(u, sum) { sum += d.dur[u]; if (sum > best) best = sum; succ[u].forEach(v => dfs(v, sum)); })(s, 0);
  return best === t.answer ? [] : [`longest chain ${best} vs ${t.answer}`];
};

module.exports = S;
