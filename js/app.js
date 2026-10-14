/* Bebras Practice — user interface: home, timed exam, results, single-topic practice. */
(function () {
  'use strict';
  var B = window.Bebras;
  var $ = function (id) { return document.getElementById(id); };
  var esc = B.esc;
  var KEY_CUR = 'bebras.current.v1', KEY_HIST = 'bebras.history.v1', KEY_THEME = 'bebras.theme';

  /* ---------- storage (every access guarded: it can be blocked or empty) ---------- */
  function load(key, fallback) {
    try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, val) { try { window.localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ } }
  function drop(key) { try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ } }

  /* ---------- screens ---------- */
  var SCREENS = ['home', 'exam', 'result', 'practice'];
  function show(name, noFocus) {
    SCREENS.forEach(function (s) { $(s).hidden = (s !== name); });
    var el = $(name); el.setAttribute('tabindex', '-1');
    window.scrollTo(0, 0);
    if (!noFocus) { var h = el.querySelector('h1,h2'); (h || el).setAttribute('tabindex', '-1'); (h || el).focus({ preventScroll: true }); }
  }

  /* ---------- confirm dialog ---------- */
  function ask(title, body, yesLabel, onYes) {
    var d = $('dlg');
    if (!d.showModal) { if (window.confirm(title + '\n' + body.replace(/<[^>]+>/g, ''))) onYes(); return; }
    $('dlgTitle').textContent = title; $('dlgBody').innerHTML = body; $('dlgYes').textContent = yesLabel;
    var done = function (yes) { d.close(); $('dlgYes').onclick = $('dlgNo').onclick = null; if (yes) onYes(); };
    $('dlgYes').onclick = function () { done(true); }; $('dlgNo').onclick = function () { done(false); };
    d.showModal();
  }

  /* ---------- theme ---------- */
  (function () {
    var t = load(KEY_THEME, null);
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    $('themeBtn').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      if (!cur) cur = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next); save(KEY_THEME, next);
    });
  })();

  /* ---------- answer widgets ---------- */
  function ansHtml(task, ans) {
    if (!B.isAnswered(task, ans)) return '<span class="muted">ไม่ได้ตอบ</span>';
    switch (task.type) {
      case 'choice': return '<b>' + B.LETTERS[ans] + '</b> ' + task.options[ans];
      case 'number': case 'text': return esc(ans);
      case 'grid':
        if (task.grid.shape === 'lamp') {
          var lit = []; task.grid.labels.forEach(function (l, i) { if (ans[i]) lit.push(l); });
          return 'เปิดหลอดค่า ' + (lit.join(', ') || '—');
        }
        var out = [];
        for (var r = 0; r < task.grid.rows; r++) {
          var line = ''; for (var c = 0; c < task.grid.cols; c++) line += ans[r * task.grid.cols + c] ? '■' : '□';
          out.push(line);
        }
        return '<span class="mono">' + out.join(' / ') + '</span>';
      case 'program': return ans.map(function (m) { return B.ARROW[m]; }).join(' ');
    }
    return '';
  }
  function keyHtml(task) {
    switch (task.type) {
      case 'choice': return '<b>' + B.LETTERS[task.answer] + '</b> ' + task.options[task.answer];
      case 'number': case 'text': return esc(task.answer);
      default: return esc(task.solution);
    }
  }

  /* Draw the answer input for a task. onChange(value) is called on every change (undefined = cleared). */
  function renderAnswer(area, task, ans, onChange) {
    area.innerHTML = '';
    var el;
    if (task.type === 'choice') {
      el = document.createElement('ul'); el.className = 'opts'; el.setAttribute('role', 'radiogroup'); el.setAttribute('aria-label', 'ตัวเลือก');
      task.options.forEach(function (o, i) {
        var li = document.createElement('li');
        li.innerHTML = '<label><input type="radio" name="opt" value="' + i + '"' + (ans === i ? ' checked' : '') + '><span class="ltr">' + B.LETTERS[i] + '</span><span>' + o + '</span></label>';
        li.querySelector('input').addEventListener('change', function () { onChange(i); });
        el.appendChild(li);
      });
      area.appendChild(el);
    } else if (task.type === 'number' || task.type === 'text') {
      var lab = document.createElement('label'); lab.className = 'alabel'; lab.setAttribute('for', 'ansBox');
      lab.textContent = task.type === 'number' ? 'คำตอบ (ตัวเลข)' : 'คำตอบ (พิมพ์ตัวอักษรภาษาอังกฤษ)';
      var inp = document.createElement('input'); inp.type = 'text'; inp.id = 'ansBox'; inp.className = 'ans-input';
      inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('autocapitalize', 'off');
      if (task.type === 'number') inp.setAttribute('inputmode', 'decimal');
      inp.value = ans == null ? '' : String(ans);
      inp.addEventListener('input', function () { onChange(inp.value.trim() === '' ? undefined : inp.value); });
      area.appendChild(lab); area.appendChild(inp);
    } else if (task.type === 'grid') {
      var rows = task.grid.rows, cols = task.grid.cols, cells = [], i;
      for (i = 0; i < rows * cols; i++) cells.push(!!(ans && ans[i]));
      var note = document.createElement('p'); note.className = 'muted small'; note.textContent = 'แตะเพื่อเปิด/ปิด';
      var box = document.createElement('div');
      if (task.grid.shape === 'lamp') {
        box.className = 'lamps'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'หลอดไฟ');
      } else {
        box.className = 'gridans cell'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'ตารางภาพ ' + rows + ' คูณ ' + cols);
        box.style.gridTemplateColumns = 'repeat(' + cols + ', 44px)';
      }
      cells.forEach(function (on, idx) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
        var holder = b;
        if (task.grid.shape === 'lamp') {
          holder = document.createElement('div'); holder.className = 'lamp';
          b.setAttribute('aria-label', 'หลอดค่า ' + task.grid.labels[idx]);
          var w = document.createElement('span'); w.className = 'w'; w.textContent = task.grid.labels[idx];
          holder.appendChild(b); holder.appendChild(w);
        } else {
          b.setAttribute('aria-label', 'แถว ' + (Math.floor(idx / cols) + 1) + ' คอลัมน์ ' + (idx % cols + 1));
        }
        b.addEventListener('click', function () {
          cells[idx] = !cells[idx]; b.setAttribute('aria-pressed', cells[idx] ? 'true' : 'false');
          onChange(cells.some(function (v) { return v; }) ? cells.slice() : undefined);
        });
        box.appendChild(holder);
      });
      area.appendChild(note); area.appendChild(box);
    } else if (task.type === 'program') {
      var seq = Array.isArray(ans) ? ans.slice() : [], max = task.program.max;
      var info = document.createElement('p'); info.className = 'muted small';
      var pbox = document.createElement('div'); pbox.className = 'progbox'; pbox.setAttribute('aria-live', 'polite');
      var cm = document.createElement('div'); cm.className = 'cmds';
      var btns = [];
      var refresh = function () {
        pbox.innerHTML = seq.length ? seq.map(function (m) { return '<span class="step">' + B.ARROW[m] + '</span>'; }).join('') : '<span class="muted small">ยังไม่มีคำสั่ง — กดปุ่มลูกศรด้านล่าง</span>';
        pbox.setAttribute('aria-label', seq.length ? 'โปรแกรม: ' + seq.map(function (m) { return B.ARROW[m]; }).join(' ') : 'ยังไม่มีคำสั่ง');
        info.textContent = 'ใช้แล้ว ' + seq.length + ' จาก ' + max + ' คำสั่ง';
        btns.forEach(function (b) { if (b.dataset.cmd) b.disabled = seq.length >= max; });
      };
      var fire = function () { refresh(); onChange(seq.length ? seq.slice() : undefined); };
      task.program.cmds.forEach(function (m) {
        var b = document.createElement('button'); b.type = 'button'; b.dataset.cmd = m; b.textContent = B.ARROW[m];
        b.setAttribute('aria-label', { U: 'ขึ้น', D: 'ลง', L: 'ซ้าย', R: 'ขวา' }[m]);
        b.addEventListener('click', function () { if (seq.length < max) { seq.push(m); fire(); } });
        btns.push(b); cm.appendChild(b);
      });
      var back = document.createElement('button'); back.type = 'button'; back.textContent = '⌫ ลบตัวท้าย';
      back.addEventListener('click', function () { seq.pop(); fire(); });
      var clr = document.createElement('button'); clr.type = 'button'; clr.textContent = 'ล้างทั้งหมด';
      clr.addEventListener('click', function () { seq = []; fire(); });
      cm.appendChild(back); cm.appendChild(clr); btns.push(back, clr);
      area.appendChild(pbox); area.appendChild(info); area.appendChild(cm);
      refresh();
    }
  }

  /* ============================== EXAM ============================== */
  var E = null;   // current exam state

  function persist() {
    if (!E || E.done) return;
    save(KEY_CUR, { code: E.code, preset: E.preset, answers: E.answers, flags: E.flags, idx: E.idx, endsAt: E.endsAt, startedAt: E.startedAt });
  }
  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function startExam(code, preset, saved) {
    var P = B.PRESETS[preset], items = B.composeExam(code, preset), now = Date.now();
    E = {
      code: code, preset: preset, items: items, tasks: items.map(B.buildItem),
      answers: saved && Array.isArray(saved.answers) ? saved.answers.slice() : [],
      flags: saved && Array.isArray(saved.flags) ? saved.flags.slice() : [],
      idx: saved && saved.idx < items.length ? saved.idx : 0,
      startedAt: saved && saved.startedAt || now,
      endsAt: saved && saved.endsAt || now + P.minutes * 60000, done: false
    };
    $('examName').textContent = P.label; $('examCode').textContent = 'รหัส ' + code;
    show('exam');
    renderNav(); renderQuestion(false); persist(); startTimer();
  }
  var timerId = null;
  function startTimer() {
    clearInterval(timerId);
    var tick = function () {
      var left = E.endsAt - Date.now(), t = $('timer');
      t.textContent = fmt(left); t.classList.toggle('low', left <= 300000);
      if (left <= 0) { clearInterval(timerId); finishExam(true); }
    };
    tick(); timerId = setInterval(tick, 500);
  }
  function renderNav() {
    var nav = $('nav'); nav.innerHTML = '';
    E.tasks.forEach(function (t, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = String(i + 1);
      var done = B.isAnswered(t, E.answers[i]), flag = !!E.flags[i];
      b.className = (i === E.idx ? 'cur ' : '') + (done ? 'done ' : '') + (flag ? 'flag' : '');
      b.setAttribute('aria-label', 'ข้อ ' + (i + 1) + (done ? ' ตอบแล้ว' : ' ยังไม่ได้ตอบ') + (flag ? ' ทำเครื่องหมายไว้' : ''));
      if (i === E.idx) b.setAttribute('aria-current', 'step');
      b.addEventListener('click', function () { go(i); });
      nav.appendChild(b);
    });
  }
  function renderQuestion(focus) {
    var t = E.tasks[E.idx], p = B.POINTS[t.level], c = $('qcard');
    c.innerHTML = '<div class="qhead"><h2 tabindex="-1">ข้อ ' + (E.idx + 1) + ' จาก ' + E.tasks.length + '</h2>' +
      '<span class="badge">ระดับ ' + t.level + ' · ถูก +' + p.right + ' ผิด −' + p.wrong + '</span></div>' +
      '<div class="prompt">' + t.prompt + '</div><div id="ansArea"></div>' +
      '<div class="row" style="margin-top:12px"><button type="button" id="flagBtn" aria-pressed="false">⚑ ทำเครื่องหมายไว้ทบทวน</button>' +
      '<button type="button" id="clearBtn">ล้างคำตอบข้อนี้</button></div>';
    renderAnswer($('ansArea'), t, E.answers[E.idx], function (v) {
      E.answers[E.idx] = v; persist(); renderNav();
    });
    var fb = $('flagBtn');
    fb.setAttribute('aria-pressed', E.flags[E.idx] ? 'true' : 'false');
    fb.addEventListener('click', function () {
      E.flags[E.idx] = !E.flags[E.idx]; fb.setAttribute('aria-pressed', E.flags[E.idx] ? 'true' : 'false'); persist(); renderNav();
    });
    $('clearBtn').addEventListener('click', function () {
      E.answers[E.idx] = undefined; persist(); renderNav(); renderAnswer($('ansArea'), t, undefined, function (v) { E.answers[E.idx] = v; persist(); renderNav(); });
    });
    $('prevBtn').disabled = E.idx === 0; $('nextBtn').disabled = E.idx === E.tasks.length - 1;
    if (focus) { window.scrollTo(0, 0); c.querySelector('h2').focus({ preventScroll: true }); }
  }
  function go(i) { if (!E || i < 0 || i >= E.tasks.length) return; E.idx = i; persist(); renderNav(); renderQuestion(true); }

  function finishExam(timeUp) {
    if (!E || E.done) return;
    E.done = true; clearInterval(timerId); drop(KEY_CUR);
    var res = B.scoreExam(E.tasks, E.answers), P = B.PRESETS[E.preset];
    var hist = load(KEY_HIST, []); if (!Array.isArray(hist)) hist = [];
    hist.unshift({ t: Date.now(), code: E.code, preset: E.preset, score: res.score, max: res.max, right: res.right, wrong: res.wrong, blank: res.blank });
    save(KEY_HIST, hist.slice(0, 30));
    renderResult(res, P, timeUp);
  }
  var STATUS = { right: 'ถูก', wrong: 'ผิด', blank: 'ไม่ได้ตอบ' };
  function renderResult(res, P, timeUp) {
    var used = Math.min(E.endsAt, Date.now()) - E.startedAt;
    var lv = ['A', 'B', 'C'].filter(function (l) { return res.byLevel[l]; }).map(function (l) {
      var b = res.byLevel[l];
      return '<tr><th scope="row">ระดับ ' + l + '</th><td>' + b.total + '</td><td>' + b.right + '</td><td>' + b.wrong + '</td><td>' + b.blank + '</td></tr>';
    }).join('');
    $('summary').innerHTML =
      (timeUp ? '<p class="note">หมดเวลา ระบบส่งข้อสอบให้อัตโนมัติ</p>' : '') +
      '<h2>' + esc(P.label) + ' · รหัส ' + esc(E.code) + '</h2>' +
      '<div class="score">' + res.score + ' <span class="muted" style="font-size:1.1rem">/ ' + res.max + ' คะแนน</span></div>' +
      '<p class="muted small">ใช้เวลา ' + fmt(used) + ' จาก ' + P.minutes + ' นาที' + (res.raw < 0 ? ' · คะแนนดิบติดลบ จึงปัดเป็น 0' : '') + '</p>' +
      '<div class="stat"><div><b>' + res.right + '</b>ตอบถูก</div><div><b>' + res.wrong + '</b>ตอบผิด</div><div><b>' + res.blank + '</b>ไม่ได้ตอบ</div></div>' +
      '<table class="mini"><thead><tr><th></th><th scope="col">ข้อ</th><th scope="col">ถูก</th><th scope="col">ผิด</th><th scope="col">ว่าง</th></tr></thead><tbody>' + lv + '</tbody></table>' +
      '<p class="muted small">ตอบผิดถูกหักคะแนน ส่วนข้อที่ไม่ตอบไม่ถูกหัก — ถ้าเดาไม่ได้เลยปล่อยว่างจะปลอดภัยกว่า (ตามกติกาสากล ของจริงอาจต่างออกไป)</p>';
    $('reviews').innerHTML = '<h2>ทบทวนทีละข้อ</h2>' + E.tasks.map(function (t, i) {
      var st = res.status[i];
      return '<details class="review"' + (st !== 'right' ? ' open' : '') + '><summary>ข้อ ' + (i + 1) + ' · ' + esc(t.title) + ' <span class="pill ' + st + '">' + STATUS[st] + '</span></summary>' +
        '<div class="prompt">' + t.prompt + '</div>' +
        '<p><b>คำตอบของคุณ:</b> ' + ansHtml(t, E.answers[i]) + '</p>' +
        '<p><b>เฉลย:</b> ' + keyHtml(t) + '</p>' +
        '<div class="expl"><b>วิธีคิด</b>' + t.explain + '</div></details>';
    }).join('');
    $('againSame').dataset.code = E.code; $('againSame').dataset.preset = E.preset; $('againNew').dataset.preset = E.preset;
    show('result');
    renderHome();
  }

  /* ============================== PRACTICE ============================== */
  var PR = null;
  function startPractice(defId) {
    PR = { def: B.findDef(defId) };
    $('pTitle').textContent = PR.def.title; show('practice'); nextPractice(false);
  }
  function nextPractice(focus) {
    var seed = Math.floor(Math.random() * 4294967296), t = B.buildTask(PR.def, seed);
    PR.task = t; PR.ans = undefined; PR.checked = false;
    var c = $('pcard');
    c.innerHTML = '<div class="qhead"><span class="badge">ระดับ ' + t.level + '</span><span class="muted small">' + esc(t.topic) + '</span></div>' +
      '<div class="prompt">' + t.prompt + '</div><div id="pAns"></div><div id="pFb" role="status" aria-live="polite"></div>';
    renderAnswer($('pAns'), t, undefined, function (v) { PR.ans = v; });
    $('pCheck').disabled = false;
    if (focus) window.scrollTo(0, 0);
  }
  $('pCheck').addEventListener('click', function () {
    if (!PR || PR.checked) return;
    var t = PR.task, fb = $('pFb');
    if (!B.isAnswered(t, PR.ans)) { fb.innerHTML = '<div class="fb wrong">ยังไม่ได้ตอบ — ใส่คำตอบก่อนแล้วกดตรวจ</div>'; return; }
    PR.checked = true; $('pCheck').disabled = true;
    var ok = B.grade(t, PR.ans);
    $('pAns').querySelectorAll('input,button').forEach(function (x) { x.disabled = true; });
    fb.innerHTML = '<div class="fb ' + (ok ? 'right' : 'wrong') + '">' + (ok ? 'ถูกต้อง! 🎉' : 'ยังไม่ถูก') + '</div>' +
      (ok ? '' : '<p style="margin-top:10px"><b>เฉลย:</b> ' + keyHtml(t) + '</p>') +
      '<div class="expl"><b>วิธีคิด</b>' + t.explain + '</div>';
  });
  $('pNext').addEventListener('click', function () { nextPractice(true); });
  $('pBack').addEventListener('click', function () { show('home'); });

  /* ============================== HOME ============================== */
  var chosenPreset = 'junior';
  function dailyCode() {
    var d = new Date(); return 'D' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  }
  function renderHome() {
    var ps = $('presets'); ps.innerHTML = '';
    Object.keys(B.PRESETS).forEach(function (id) {
      var P = B.PRESETS[id], l = document.createElement('label');
      l.innerHTML = '<input type="radio" name="preset" value="' + id + '"' + (id === chosenPreset ? ' checked' : '') + '><span><b>' + esc(P.label) + '</b><br><span class="muted small">' + esc(P.note) + '</span></span>';
      l.querySelector('input').addEventListener('change', function () { chosenPreset = id; });
      ps.appendChild(l);
    });
    var tp = $('topics'); tp.innerHTML = '';
    B.registry.forEach(function (d) {
      var b = document.createElement('button'); b.type = 'button';
      b.innerHTML = '<b>' + esc(d.title) + '</b> <span class="badge">' + d.level + '</span><br><span class="muted small">' + esc(d.topic) + '</span>';
      b.addEventListener('click', function () { startPractice(d.id); });
      tp.appendChild(b);
    });
    var hist = load(KEY_HIST, []);
    if (!Array.isArray(hist)) hist = [];
    $('histCard').hidden = !hist.length;
    $('hist').innerHTML = hist.slice(0, 10).map(function (h) {
      var P = B.PRESETS[h.preset];
      return '<li><span>' + new Date(h.t).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) + ' · ' + esc(P ? P.label : h.preset) + ' · <span class="mono">' + esc(h.code) + '</span></span><b>' + h.score + ' / ' + h.max + '</b></li>';
    }).join('');
    var cur = load(KEY_CUR, null);
    if (cur && B.PRESETS[cur.preset] && cur.code) {
      var items = B.composeExam(cur.code, cur.preset), n = 0;
      (cur.answers || []).forEach(function (a, i) { if (a !== null && a !== undefined && a !== '' ) n++; });
      $('resumeInfo').textContent = 'ชุด "' + B.PRESETS[cur.preset].label + '" รหัส ' + cur.code + ' · ตอบแล้ว ' + n + ' จาก ' + items.length + ' ข้อ · ' +
        (cur.endsAt > Date.now() ? 'เหลือเวลา ' + fmt(cur.endsAt - Date.now()) : 'หมดเวลาแล้ว (กด "ทำต่อ" เพื่อดูผล)');
      $('resumeCard').hidden = false;
    } else $('resumeCard').hidden = true;
  }
  function cleanCode() { return $('codeInput').value.replace(/\s+/g, '').toUpperCase(); }
  function begin(code, preset) {
    var go = function () { drop(KEY_CUR); startExam(code, preset); };
    if (load(KEY_CUR, null)) ask('เริ่มชุดใหม่?', 'มีข้อสอบที่ทำค้างอยู่ ถ้าเริ่มชุดใหม่ ชุดที่ค้างจะหายไป', 'เริ่มชุดใหม่', go); else go();
  }
  $('newCode').addEventListener('click', function () { $('codeInput').value = B.newCode(); });
  $('startBtn').addEventListener('click', function () {
    var code = cleanCode();
    if (!code) { code = B.newCode(); $('codeInput').value = code; }
    begin(code, chosenPreset);
  });
  $('dailyBtn').addEventListener('click', function () { $('codeInput').value = dailyCode(); begin(dailyCode(), chosenPreset); });
  $('resumeBtn').addEventListener('click', function () {
    var cur = load(KEY_CUR, null); if (!cur) { renderHome(); return; }
    startExam(cur.code, cur.preset, cur);
  });
  $('discardBtn').addEventListener('click', function () { ask('ทิ้งข้อสอบที่ค้างอยู่?', 'คำตอบที่ทำไว้จะหายไป', 'ทิ้งชุดนี้', function () { drop(KEY_CUR); renderHome(); }); });
  $('clearHist').addEventListener('click', function () { ask('ล้างประวัติ?', 'ผลสอบที่บันทึกไว้ในเครื่องนี้จะถูกลบ', 'ล้างประวัติ', function () { drop(KEY_HIST); renderHome(); }); });

  /* exam controls */
  $('prevBtn').addEventListener('click', function () { go(E.idx - 1); });
  $('nextBtn').addEventListener('click', function () { go(E.idx + 1); });
  $('finishBtn').addEventListener('click', function () {
    var blank = E.tasks.filter(function (t, i) { return !B.isAnswered(t, E.answers[i]); }).length;
    var flagged = E.flags.filter(Boolean).length;
    ask('ส่งข้อสอบ?',
      (blank ? 'ยังไม่ได้ตอบ <b>' + blank + '</b> ข้อ. ' : 'ตอบครบทุกข้อแล้ว. ') + (flagged ? 'มี <b>' + flagged + '</b> ข้อที่ทำเครื่องหมายไว้. ' : '') + 'ส่งแล้วแก้ไม่ได้',
      'ส่งข้อสอบ', function () { finishExam(false); });
  });
  $('homeBtn').addEventListener('click', function () { renderHome(); show('home'); });
  $('againNew').addEventListener('click', function () { var p = $('againNew').dataset.preset; chosenPreset = p; renderHome(); $('codeInput').value = B.newCode(); show('home'); });
  $('againSame').addEventListener('click', function () { var d = $('againSame').dataset; drop(KEY_CUR); startExam(d.code, d.preset); });
  window.addEventListener('beforeunload', function (e) { if (E && !E.done && !$('exam').hidden) { e.preventDefault(); e.returnValue = ''; } });

  $('codeInput').value = B.newCode();
  renderHome();
  show('home', true);
})();
