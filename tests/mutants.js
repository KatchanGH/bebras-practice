/* Mutation check: deliberately break the generators one at a time and confirm tests/run.js notices.
   If a mutant survives, the test suite has a blind spot.   Usage: node tests/mutants.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const src = path.join(__dirname, '..');
const M = [
  ['pattern-seq', 'level-a.js', "seq[i - 1] + d.d)", "seq[i - 1] + d.d + 1)"],
  ['binary-lamps', 'level-a.js', "return s === T; }", "return s >= T; }"],
  ['caesar', 'level-a.js', "(L.indexOf(ch) + s + 26) % 26", "(L.indexOf(ch) - s + 26) % 26"],
  ['sets-count', 'level-a.js', "var T = both + onlyA + onlyB + none,", "var T = both + onlyA + onlyB + none + 1,"],
  ['rle-pixels', 'level-a.js', "    nums.push(count);\n    return nums;", "    return nums;"],
  ['robot-trace', 'level-a.js', "if (wallSet && wallSet[nr + ',' + nc]) return;", ""],
  ['shortest-path', 'level-b.js', "answer: res.dist[8],", "answer: res.dist[7],"],
  ['sort-swaps', 'level-b.js', "if (a[i] > a[j]) c++;", "if (a[i] < a[j]) c++;"],
  ['halving', 'level-b.js', "base = guess ? 2 : 3", "base = guess ? 2 : 2"],
  ['path-count', 'level-b.js', "(r > 0 ? dp[r - 1][c] : 0) + (c > 0 ? dp[r][c - 1] : 0)", "(r > 0 ? dp[r - 1][c] : 0) + (c > 0 ? dp[r][c - 1] : 0) + 1"],
  ['robot-grid', 'level-b.js', "if (seq.length > K) return false;", "if (seq.length > K + 1) return false;"],
  ['stack-train', 'level-b.js', "if (next > n) return false;", "if (next > n) return true;"],
  ['logic-liars', 'level-c.js', "case 'AND': return h[st.x] && h[st.y];", "case 'AND': return h[st.x] || h[st.y];"],
  ['automaton', 'level-c.js', "tr[s][ch === 'a' ? 0 : 1]; }); return s;", "tr[s][ch === 'a' ? 1 : 0]; }); return s;"],
  ['water-jugs', 'level-c.js', "var pa = Math.min(x, b - y)", "var pa = Math.min(x, b)"],
  ['graph-coloring', 'level-c.js', "for (var c = 0; c < k; c++) {", "for (var c = 0; c < k + 1; c++) {"],
  ['critical-path', 'level-c.js', "if (fin[p] > st) st = fin[p];", "if (fin[p] < st) st = fin[p];"]
];
let survived = 0;
M.forEach(([id, file, from, to]) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bebras-mut-'));
  fs.cpSync(path.join(src, 'js'), path.join(tmp, 'js'), { recursive: true });
  const f = path.join(tmp, 'js', 'tasks', file), text = fs.readFileSync(f, 'utf8');
  if (text.split(from).length !== 2) { console.log(`?? ${id}: pattern not found exactly once`); survived++; return; }
  fs.writeFileSync(f, text.replace(from, to));
  const r = cp.spawnSync('node', [path.join(__dirname, 'run.js'), '400'], { env: Object.assign({}, process.env, { BEBRAS_ROOT: tmp }), encoding: 'utf8', timeout: 120000 });
  const caught = r.status !== 0 && (r.stdout || '').includes('FAIL ' + id);
  console.log(`${caught ? 'caught  ' : 'SURVIVED'} ${id}`);
  if (!caught) { survived++; console.log((r.stdout || '').split('\n').slice(0, 3).join('\n')); }
  fs.rmSync(tmp, { recursive: true, force: true });
});
console.log(survived ? `\n${survived} mutant(s) not caught` : `\nall ${M.length} mutants caught`);
process.exit(survived ? 1 : 0);
