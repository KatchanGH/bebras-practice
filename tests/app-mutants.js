/* Mutation check for the exam UI/scoring layer: break core.js / app.js one way at a time and confirm tests/e2e.js fails.
   Usage: PLAYWRIGHT_MODULE=<path> node tests/app-mutants.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const src = path.join(__dirname, '..');
const M = [
  ['core.js', "A: { right: 6, wrong: 2 }", "A: { right: 6, wrong: 1 }", 'wrong-answer penalty changed'],
  ['core.js', "res.score = Math.max(0, res.raw);", "res.score = res.raw;", 'score no longer floored at 0'],
  ['core.js', "res.raw -= p.wrong;", "res.raw -= 0;", 'wrong answers not penalised'],
  ['core.js', "return Number(txt) === task.answer;", "return Number(txt) !== task.answer;", 'number grading inverted'],
  ['core.js', "var rng = B.makeRng(B.hashSeed(code + '|' + presetId));", "var rng = B.makeRng(B.hashSeed(code + '|' + presetId + Math.random()));", 'exam not reproducible from code'],
  ['core.js', "case 'choice': return typeof ans === 'number';", "case 'choice': return typeof ans === 'string';", 'chosen option not recognised as an answer'],
  ['app.js', "flags: E.flags,", "flags: [],", 'flags not saved for resume'],
  ['app.js', "if (left <= 0) {", "if (left <= -99999999) {", 'time-up never submits'],
  ['app.js', "answers: saved && Array.isArray(saved.answers) ? saved.answers.slice() : [],", "answers: [],", 'resume loses answers'],
  ['app.js', "E.answers[E.idx] = v; persist(); renderNav();\n    });", "persist(); renderNav();\n    });", 'answers never recorded']
];
let survived = 0;
M.forEach(([file, from, to, label]) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bebras-app-mut-'));
  ['index.html', 'css', 'js'].forEach(f => fs.cpSync(path.join(src, f), path.join(tmp, f), { recursive: true }));
  const f = path.join(tmp, 'js', file), text = fs.readFileSync(f, 'utf8');
  if (text.split(from).length !== 2) { console.log(`?? "${label}": pattern not found exactly once`); survived++; return; }
  fs.writeFileSync(f, text.replace(from, to));
  const r = cp.spawnSync('node', [path.join(__dirname, 'e2e.js'), path.join(tmp, 'index.html')], { encoding: 'utf8', timeout: 240000 });
  const caught = r.status !== 0;
  console.log(`${caught ? 'caught  ' : 'SURVIVED'} ${label}`);
  if (!caught) survived++;
  fs.rmSync(tmp, { recursive: true, force: true });
});
console.log(survived ? `\n${survived} mutant(s) not caught` : `\nall ${M.length} mutants caught`);
process.exit(survived ? 1 : 0);
