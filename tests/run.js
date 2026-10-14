/* Answer-key test: generates many tasks per generator and checks them against independent solvers.
   Usage: node tests/run.js [seedsPerGenerator]   (default 1500) */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const solvers = require('./solvers');

const root = process.env.BEBRAS_ROOT || path.join(__dirname, '..');
const ctx = {}; vm.createContext(ctx);
['js/core.js', 'js/tasks/shared.js', 'js/tasks/level-a.js', 'js/tasks/level-b.js', 'js/tasks/level-c.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
const B = ctx.Bebras;

const N = Number(process.argv[2]) || 1500;
let failures = 0, checks = 0;
const fail = (id, seed, msg) => { failures++; if (failures <= 40) console.log(`FAIL ${id} seed=${seed}: ${msg}`); };

const TYPES = ['choice', 'number', 'text', 'grid', 'program'];
B.registry.forEach(def => {
  const prompts = new Set(), typeCount = {}; let tMs = 0;
  if (!solvers[def.id]) { fail(def.id, '-', 'no independent solver written'); return; }
  for (let i = 0; i < N; i++) {
    const seed = B.hashSeed(def.id + ':' + i);
    let t; const t0 = Date.now();
    try { t = B.buildTask(def, seed); } catch (e) { fail(def.id, seed, 'generator threw: ' + e.message); continue; }
    tMs = Math.max(tMs, Date.now() - t0);
    checks++;
    typeCount[t.type] = (typeCount[t.type] || 0) + 1;
    // structure
    if (!TYPES.includes(t.type)) fail(def.id, seed, 'bad type ' + t.type);
    const all = [t.prompt, t.explain, t.solution || '', (t.options || []).join(' ')].join(' ');
    if (/undefined|NaN|\[object|null/.test(all)) fail(def.id, seed, 'bad text in prompt/explain: ' + (all.match(/.{0,30}(undefined|NaN|\[object|null).{0,30}/) || [''])[0]);
    if (!t.prompt || !t.explain) fail(def.id, seed, 'missing prompt/explain');
    if ((t.prompt.match(/<svg/g) || []).length !== (t.prompt.match(/<\/svg>/g) || []).length) fail(def.id, seed, 'unbalanced svg');
    if (t.type === 'choice') {
      if (!Number.isInteger(t.answer) || t.answer < 0 || t.answer >= t.options.length) fail(def.id, seed, 'answer index out of range');
      if (new Set(t.options).size !== t.options.length) fail(def.id, seed, 'duplicate option text');
      if (t.options.length < 3) fail(def.id, seed, 'fewer than 3 options');
    }
    if (t.type === 'number' && !Number.isFinite(t.answer)) fail(def.id, seed, 'non-finite answer');
    if ((t.type === 'grid' || t.type === 'program') && (typeof t.judge !== 'function' || !t.solution)) fail(def.id, seed, 'grid/program needs judge + solution');
    // grading round trips
    if (t.type === 'choice') {
      if (!B.grade(t, t.answer)) fail(def.id, seed, 'grade rejects correct option');
      for (let k = 0; k < t.options.length; k++) if (k !== t.answer && B.grade(t, k)) fail(def.id, seed, 'grade accepts wrong option ' + k);
    }
    if (t.type === 'number') {
      if (!B.grade(t, String(t.answer))) fail(def.id, seed, 'grade rejects correct number');
      if (B.grade(t, String(t.answer + 1))) fail(def.id, seed, 'grade accepts wrong number');
      if (B.grade(t, '')) fail(def.id, seed, 'grade accepts blank');
    }
    // determinism
    if (i < 100) { const t2 = B.buildTask(def, seed); if (t2.prompt !== t.prompt || t2.explain !== t.explain) fail(def.id, seed, 'not deterministic'); }
    prompts.add(t.prompt + '|' + (t.options || []).join('|'));
    // independent solver
    let probs; try { probs = solvers[def.id](B, t); } catch (e) { probs = ['solver threw: ' + e.message]; }
    probs.forEach(m => fail(def.id, seed, m));
  }
  const minDistinct = Math.min(200, Math.floor(N * 0.5));
  if (prompts.size < minDistinct) fail(def.id, '-', 'low variety: only ' + prompts.size + ' distinct tasks in ' + N);
  console.log(`${def.level} ${def.id.padEnd(14)} ${N} tasks, ${String(prompts.size).padStart(4)} distinct, types ${JSON.stringify(typeCount)}, slowest ${tMs}ms`);
});

// exam composition + scoring
const codes = ['AAAAAA', 'K7M2QX', 'D20261103', 'ZZZ999'];
['quick', 'junior', 'senior'].forEach(p => codes.forEach(c => {
  const items = B.composeExam(c, p), pr = B.PRESETS[p];
  const cnt = { A: 0, B: 0, C: 0 }; items.forEach(i => cnt[i.level]++);
  ['A', 'B', 'C'].forEach(l => { if (cnt[l] !== pr.counts[l]) fail('exam', c, `${p}: level ${l} count ${cnt[l]} != ${pr.counts[l]}`); });
  if (JSON.stringify(items) !== JSON.stringify(B.composeExam(c, p))) fail('exam', c, 'composeExam not deterministic');
  const tasks = items.map(B.buildItem);
  const perfect = tasks.map(t => t.type === 'choice' ? t.answer : String(t.answer));
  const hasInteractive = tasks.some(t => t.type === 'grid' || t.type === 'program');
  const answers = tasks.map((t, i) => (t.type === 'grid' || t.type === 'program') ? undefined : perfect[i]);
  const sc = B.scoreExam(tasks, answers);
  const expect = tasks.reduce((s, t) => s + (t.type === 'grid' || t.type === 'program' ? 0 : B.POINTS[t.level].right), 0);
  if (sc.raw !== expect) fail('exam', c, `${p}: score ${sc.raw} != ${expect}`);
  checks++;
}));
const fresh = new Set(); for (let i = 0; i < 40; i++) fresh.add(B.newCode(() => (i * 7919 % 1000) / 1000 + (i % 3) * 0.001));
// scoring rules
{
  const mk = (level, ans) => ({ level, type: 'number', answer: ans });
  const r = B.scoreExam([mk('A', 5), mk('B', 5), mk('C', 5), mk('A', 5)], ['5', '6', undefined, '5']);
  if (r.raw !== 6 - 3 + 6 || r.right !== 2 || r.wrong !== 1 || r.blank !== 1) fail('score', '-', JSON.stringify(r));
  const z = B.scoreExam([mk('C', 1)], ['2']);
  if (z.score !== 0 || z.raw !== -4) fail('score', '-', 'floor at zero: ' + JSON.stringify(z));
  checks += 2;
}
console.log(`\n${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
