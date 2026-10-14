/* End-to-end test in a real browser (Playwright + Chromium).
   Usage: node tests/e2e.js [path-to-index.html]
   Needs: playwright (set PLAYWRIGHT_MODULE to its path if it is not installed locally),
          CHROMIUM (path to the chromium binary, optional). */
'use strict';
const path = require('path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const page_url = 'file://' + path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));

let failures = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { failures++; console.log('FAIL: ' + msg); } };

function bfs(d) {          // independent shortest-path solver for the robot-grid task
  const wall = new Set(d.walls.map(w => w[0] + ',' + w[1]));
  const M = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
  const prev = { [d.start.join(',')]: null }, q = [d.start];
  while (q.length) {
    const [r, c] = q.shift();
    for (const m of 'UDLR') {
      const nr = r + M[m][0], nc = c + M[m][1], k = nr + ',' + nc;
      if (nr < 0 || nc < 0 || nr >= d.n || nc >= d.n || wall.has(k) || k in prev) continue;
      prev[k] = { from: r + ',' + c, m }; q.push([nr, nc]);
    }
  }
  const out = []; let cur = d.goal.join(',');
  while (prev[cur]) { out.unshift(prev[cur].m); cur = prev[cur].from; }
  return out;
}

(async () => {
  const browser = await pw.chromium.launch({
    executablePath: process.env.CHROMIUM || (require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined),
    args: ['--no-sandbox']
  });
  const ctx = await browser.newContext({ viewport: { width: 360, height: 760 } });
  await ctx.addInitScript(() => {            // controllable clock offset, to test time-up without waiting
    const real = Date.now.bind(Date); window.__off = 0; Date.now = () => real() + window.__off;
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  async function taskInfo(code, preset) {
    return page.evaluate(([c, p]) => Bebras.composeExam(c, p).map(Bebras.buildItem).map(t => ({
      type: t.type, level: t.level, answer: t.answer, data: t.data, grid: t.grid, nopts: (t.options || []).length, defId: t.defId
    })), [code, preset]);
  }
  async function answerCorrect(t) {
    if (t.type === 'choice') await page.check('input[name=opt][value="' + t.answer + '"]');
    else if (t.type === 'number' || t.type === 'text') await page.fill('#ansBox', String(t.answer));
    else if (t.type === 'grid') {
      if (t.grid.shape === 'lamp') {
        const bs = await page.$$('#ansArea .lamps button');
        for (let i = 0; i < bs.length; i++) if (t.data.N & t.data.weights[i]) await bs[i].click();
      } else {
        const bs = await page.$$('#ansArea .gridans button'), flat = [].concat(...t.data.image);
        for (let i = 0; i < bs.length; i++) if (flat[i]) await bs[i].click();
      }
    } else if (t.type === 'program') {
      for (const m of bfs(t.data)) await page.click('#ansArea .cmds button[data-cmd="' + m + '"]');
    }
  }
  async function wrongAnswer(t) {        // a definitely-wrong answer, or null to leave blank
    if (t.type === 'choice') { await page.check('input[name=opt][value="' + ((t.answer + 1) % t.nopts) + '"]'); return true; }
    if (t.type === 'number') { await page.fill('#ansBox', String(t.answer + 1)); return true; }
    return false;
  }
  async function start(code, preset) {
    await page.goto(page_url); await page.evaluate(() => localStorage.clear()); await page.reload();
    await page.fill('#codeInput', code);
    await page.check('input[name=preset][value="' + preset + '"]');
    await page.click('#startBtn');
    await page.waitForSelector('#exam:not([hidden])');
  }
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  /* 1. perfect run on every preset */
  for (const preset of ['quick', 'junior', 'senior']) {
    const code = 'E2E' + preset.toUpperCase().slice(0, 3);
    await start(code, preset);
    const tasks = await taskInfo(code, preset);
    ok(await page.$$eval('#nav button', b => b.length) === tasks.length, preset + ': nav button count');
    ok((await page.textContent('#timer')).match(/^\d\d:\d\d$/), preset + ': timer format');
    for (let i = 0; i < tasks.length; i++) {
      ok((await page.textContent('#qcard h2')).includes('ข้อ ' + (i + 1) + ' จาก ' + tasks.length), preset + ': heading q' + (i + 1));
      await answerCorrect(tasks[i]);
      ok(await overflow() <= 0, preset + ': horizontal overflow on q' + (i + 1) + ' (' + tasks[i].defId + ')');
      if (i < tasks.length - 1) await page.click('#nextBtn');
    }
    ok(await page.$$eval('#nav button.done', b => b.length) === tasks.length, preset + ': all marked done');
    await page.click('#finishBtn'); await page.click('#dlgYes');
    await page.waitForSelector('#result:not([hidden])');
    const max = tasks.reduce((s, t) => s + { A: 6, B: 9, C: 12 }[t.level], 0);
    const sc = await page.textContent('#summary .score');
    ok(sc.replace(/\s+/g, ' ').startsWith(max + ' /'), preset + ': perfect score ' + max + ', page shows "' + sc.trim() + '"');
    ok(await page.$$eval('#reviews .pill.right', p => p.length) === tasks.length, preset + ': every review is "ถูก"');
    ok(await overflow() <= 0, preset + ': overflow on result page');
  }

  /* 2. wrong + blank scoring */
  {
    await start('E2EWRONG', 'junior');
    const tasks = await taskInfo('E2EWRONG', 'junior');
    let exp = 0, right = 0, wrong = 0, blank = 0;
    const P = { A: [6, 2], B: [9, 3], C: [12, 4] };
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (i % 3 === 0) { await answerCorrect(t); exp += P[t.level][0]; right++; }
      else if (await wrongAnswer(t)) { exp -= P[t.level][1]; wrong++; }
      else blank++;
      if (i < tasks.length - 1) await page.click('#nextBtn');
    }
    await page.click('#finishBtn');
    ok((await page.textContent('#dlgBody')).includes('ยังไม่ได้ตอบ'), 'confirm dialog mentions unanswered');
    await page.click('#dlgYes'); await page.waitForSelector('#result:not([hidden])');
    const sc = (await page.textContent('#summary .score')).trim().split(/\s+/)[0];
    ok(Number(sc) === Math.max(0, exp), 'mixed scoring: expected ' + Math.max(0, exp) + ' got ' + sc);
    const counts = await page.$$eval('#summary .stat b', b => b.map(x => Number(x.textContent)));
    ok(JSON.stringify(counts) === JSON.stringify([right, wrong, blank]), 'stat counts ' + counts + ' vs ' + [right, wrong, blank]);
  }

  /* 2b. everything wrong -> raw score negative, shown as 0 */
  {
    await start('E2EALLBAD', 'junior');
    const tasks = await taskInfo('E2EALLBAD', 'junior');
    for (let i = 0; i < tasks.length; i++) { await wrongAnswer(tasks[i]); if (i < tasks.length - 1) await page.click('#nextBtn'); }
    await page.click('#finishBtn'); await page.click('#dlgYes'); await page.waitForSelector('#result:not([hidden])');
    ok((await page.textContent('#summary .score')).trim().startsWith('0 /'), 'all wrong: score floored at 0');
    ok((await page.textContent('#summary')).includes('ติดลบ'), 'all wrong: negative raw score explained');
  }

  /* 3. resume after reload, answers kept */
  {
    await start('E2ERES', 'quick');
    const tasks = await taskInfo('E2ERES', 'quick');
    await answerCorrect(tasks[0]); await page.click('#nextBtn'); await answerCorrect(tasks[1]);
    await page.click('#flagBtn');
    await page.reload();
    ok(await page.isVisible('#resumeCard'), 'resume card visible after reload');
    await page.click('#resumeBtn'); await page.waitForSelector('#exam:not([hidden])');
    ok(await page.$$eval('#nav button.done', b => b.length) === 2, 'resume keeps 2 answered');
    ok(await page.$$eval('#nav button.flag', b => b.length) === 1, 'resume keeps flag');
    ok((await page.textContent('#qcard h2')).includes('ข้อ 2'), 'resume goes back to question 2');
  }

  /* 4. time up auto-submits; unanswered choice questions must count as blank, not wrong */
  {
    await start('E2ETIME', 'junior');
    const tt = await taskInfo('E2ETIME', 'junior');
    ok(tt.some(t => t.type === 'choice'), 'time-up test set contains a multiple-choice question');
    await page.evaluate(() => { window.__off = 46 * 60000; });
    await page.waitForSelector('#result:not([hidden])', { timeout: 5000 });
    ok((await page.textContent('#summary')).includes('หมดเวลา'), 'time-up notice shown');
    ok((await page.textContent('#summary .score')).trim().startsWith('0 /'), 'time-up with nothing answered scores 0');
    const cnt = await page.$$eval('#summary .stat b', b => b.map(x => Number(x.textContent)));
    ok(JSON.stringify(cnt) === JSON.stringify([0, 0, tt.length]), 'time-up: every question counted as unanswered, got ' + cnt);
    ok((await page.textContent('#summary')).includes('0 ผิด') === false, 'no negative score from blanks');
  }

  /* 5. practice mode: wrong then right feedback, and the hub's own history */
  {
    await page.goto(page_url);
    const nTopics = await page.$$eval('#topics button', b => b.length);
    ok(nTopics === 17, 'topic buttons: ' + nTopics);
    await page.click('#topics button:nth-child(4)');        // sets-count (number)
    await page.waitForSelector('#practice:not([hidden])');
    await page.click('#pCheck');
    ok((await page.textContent('#pFb')).includes('ยังไม่ได้ตอบ'), 'practice: blank is refused');
    await page.fill('#ansBox', '-1'); await page.click('#pCheck');
    ok((await page.textContent('#pFb')).includes('ยังไม่ถูก'), 'practice: wrong answer feedback');
    ok(await page.isDisabled('#ansBox'), 'practice: input locked after checking');
    await page.click('#pNext');
    const t = await page.evaluate(() => null);
    ok(!(await page.isDisabled('#ansBox')), 'practice: new task unlocked');
  }

  /* 6. every generator renders in the page without errors, in light and dark */
  {
    await page.goto(page_url);
    const ids = await page.evaluate(() => Bebras.registry.map(d => d.id));
    for (const id of ids) {
      await page.evaluate(id => { document.querySelectorAll('#topics button')[Bebras.registry.findIndex(d => d.id === id)].click(); }, id);
      await page.waitForSelector('#practice:not([hidden])');
      ok(await overflow() <= 0, 'practice overflow for ' + id);
      await page.click('#pBack');
    }
  }

  ok(errors.length === 0, 'browser errors: ' + errors.join(' | '));
  console.log(`\n${checks} checks, ${failures} failures`);
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
