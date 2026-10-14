/* Level C tasks (hardest group: 12 points for a correct answer). */
(function (root) {
  'use strict';
  var B = root.Bebras;
  var L = B.LETTERS;

  /* ================= 1. พูดจริง-โกหก ================= */
  function evalStmt(st, h) {
    switch (st.t) {
      case 'T': return h[st.x];
      case 'L': return !h[st.x];
      case 'AND': return h[st.x] && h[st.y];
      default: return h[st.x] || h[st.y];       // 'OR'
    }
  }
  function solveLiars(stmts) {
    var n = stmts.length, sols = [];
    for (var mask = 0; mask < (1 << n); mask++) {
      var h = [], i;
      for (i = 0; i < n; i++) h.push(((mask >> i) & 1) === 1);
      var ok = true;
      for (i = 0; i < n && ok; i++) if (h[i] !== evalStmt(stmts[i], h)) ok = false;
      if (ok) sols.push(h);
    }
    return sols;
  }
  function stmtText(st) {
    var nm = function (i) { return L[i]; };
    switch (st.t) {
      case 'T': return nm(st.x) + ' พูดความจริง';
      case 'L': return nm(st.x) + ' โกหก';
      case 'AND': return nm(st.x) + ' กับ ' + nm(st.y) + ' พูดความจริงทั้งคู่';
      default: return nm(st.x) + ' หรือ ' + nm(st.y) + ' (อย่างน้อยหนึ่งคน) พูดความจริง';
    }
  }
  B.register({
    id: 'logic-liars', topic: 'ตรรกะ', title: 'ใครพูดความจริง', level: 'C',
    gen: function (rng) {
      var stmts, sols, tries = 0, n = rng.chance(0.65) ? 4 : 3, i;
      do {
        stmts = [];
        for (i = 0; i < n; i++) {
          var t = rng.pick(['T', 'L', 'AND', 'OR']);
          var x = rng.int(0, n - 1); while (x === i) x = rng.int(0, n - 1);
          var y = rng.int(0, n - 1); while (y === i || y === x) y = rng.int(0, n - 1);
          stmts.push({ t: t, x: x, y: y });
        }
        sols = solveLiars(stmts); tries++;
        if (tries > 1500 && n === 4) { n = 3; tries = 0; }
      } while (sols.length !== 1);
      var h = sols[0], cnt = h.filter(function (v) { return v; }).length;
      return {
        type: 'number', data: { stmts: stmts }, answer: cnt,
        prompt: '<p>บนเกาะแห่งหนึ่งมีบีเวอร์ ' + n + ' ตัว ชื่อ ' + L.slice(0, n).split('').join(', ') + ' บีเวอร์แต่ละตัวเป็นได้เพียงอย่างเดียว คือ ' +
          '<b>พูดความจริงเสมอ</b> หรือ <b>โกหกเสมอ</b> (ทุกประโยคที่พูดเป็นเท็จ) แต่ละตัวพูดหนึ่งประโยค:</p><ul class="says">' +
          stmts.map(function (s, k) { return '<li><b>' + L[k] + '</b>: "' + stmtText(s) + '"</li>'; }).join('') +
          '</ul><p>มีบีเวอร์กี่ตัวที่พูดความจริง?</p>',
        explain: '<p>ลองทุกกรณีว่าใครพูดจริงหรือโกหก (' + (1 << n) + ' กรณี) แล้วตรวจว่าประโยคของแต่ละตัวสอดคล้องกับสถานะของตัวนั้นหรือไม่ ' +
          '(คนพูดจริง ประโยคต้องจริง / คนโกหก ประโยคต้องเท็จ) มีกรณีเดียวที่ไม่ขัดแย้ง คือ ' +
          h.map(function (v, k) { return L[k] + (v ? ' พูดจริง' : ' โกหก'); }).join(', ') + ' ดังนั้นมีผู้พูดความจริง <b>' + cnt + '</b> ตัว</p>'
      };
    }
  });

  /* ================= 2. เครื่องสถานะ ================= */
  function runDfa(tr, start, str) {
    var s = start; str.split('').forEach(function (ch) { s = tr[s][ch === 'a' ? 0 : 1]; }); return s;
  }
  B.register({
    id: 'automaton', topic: 'เครื่องสถานะ', title: 'เครื่องอ่านสายอักษร', level: 'C',
    gen: function (rng) {
      var tr, acc, strs, cnt, tries = 0, i;
      do {
        tr = []; for (i = 0; i < 3; i++) tr.push([rng.int(0, 2), rng.int(0, 2)]);
        acc = rng.int(0, 2);
        var set = {}; strs = [];
        while (strs.length < 5) {
          var len = rng.int(3, 6), s = ''; for (i = 0; i < len; i++) s += rng.pick(['a', 'b']);
          if (!set[s]) { set[s] = true; strs.push(s); }
        }
        cnt = strs.filter(function (s) { return runDfa(tr, 0, s) === acc; }).length; tries++;
      } while ((cnt < 1 || cnt > 4) && tries < 500);
      var head = '<tr><th scope="col">สถานะ</th><th scope="col">อ่านเจอ a</th><th scope="col">อ่านเจอ b</th></tr>';
      var rowsHtml = tr.map(function (row, s) {
        return '<tr><th scope="row">' + (s === 0 ? '▶ ' : '') + 'S' + s + (s === acc ? ' ◎' : '') + '</th><td>S' + row[0] + '</td><td>S' + row[1] + '</td></tr>';
      }).join('');
      return {
        type: 'number', data: { tr: tr, acc: acc, strs: strs }, answer: cnt,
        prompt: '<p>เครื่องอ่านสายอักษรมี 3 สถานะ คือ S0, S1, S2 เริ่มต้นที่สถานะ <b>S0 (▶)</b> เครื่องอ่านตัวอักษร a และ b <b>ทีละตัวจากซ้ายไปขวา</b> ' +
          'แล้วเปลี่ยนสถานะตามตาราง เมื่ออ่านจนครบ ถ้าเครื่องอยู่ที่สถานะ <b>S' + acc + ' (◎)</b> ถือว่า "ยอมรับ"</p>' +
          '<table class="mini fsm"><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table>' +
          '<p>ในสายอักษร 5 สายนี้ เครื่องยอมรับกี่สาย?</p><p class="mono strs">' + strs.join(' &nbsp; ') + '</p>',
        explain: '<ul>' + strs.map(function (s) {
          var cur = 0, path = ['S0'];
          s.split('').forEach(function (ch) { cur = tr[cur][ch === 'a' ? 0 : 1]; path.push('S' + cur); });
          return '<li><span class="mono">' + s + '</span>: ' + path.join(' → ') + (cur === acc ? ' ✓ ยอมรับ' : ' ✗ ไม่ยอมรับ') + '</li>';
        }).join('') + '</ul><p>ยอมรับ <b>' + cnt + '</b> สาย</p>'
      };
    }
  });

  /* ================= 3. ตวงน้ำ ================= */
  function jugsSolve(a, b, t) {
    var key = function (s) { return s[0] + ',' + s[1]; };
    var dist = {}, prev = {}, q = [[0, 0]]; dist['0,0'] = 0;
    for (var h = 0; h < q.length; h++) {
      var s = q[h], x = s[0], y = s[1];
      if (x === t || y === t) {
        var path = [], cur = s;
        while (key(cur) !== '0,0') { var pr = prev[key(cur)]; path.unshift({ act: pr.act, to: cur }); cur = pr.from; }
        return { steps: dist[key(s)], path: path };
      }
      var pa = Math.min(x, b - y), pb = Math.min(y, a - x);
      [['เติมถัง ' + a + ' ลิตร', [a, y]], ['เติมถัง ' + b + ' ลิตร', [x, b]], ['เทน้ำทิ้งจากถัง ' + a + ' ลิตร', [0, y]], ['เทน้ำทิ้งจากถัง ' + b + ' ลิตร', [x, 0]],
        ['เทจากถัง ' + a + ' ไปถัง ' + b, [x - pa, y + pa]], ['เทจากถัง ' + b + ' ไปถัง ' + a, [x + pb, y - pb]]].forEach(function (m) {
        var k = key(m[1]);
        if (dist[k] === undefined) { dist[k] = dist[key(s)] + 1; prev[k] = { from: s, act: m[0] }; q.push(m[1]); }
      });
    }
    return null;
  }
  function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
  B.register({
    id: 'water-jugs', topic: 'การวางแผนและค้นหา', title: 'ตวงน้ำด้วยถังสองใบ', level: 'C',
    gen: function (rng) {
      var a, b, t, res, tries = 0;
      do {
        a = rng.int(3, 9); b = rng.int(a + 1, 14); t = rng.int(1, b);
        res = (t === a || t === b || t % gcd(a, b) !== 0) ? null : jugsSolve(a, b, t); tries++;
      } while ((!res || res.steps < 4 || res.steps > 13) && tries < 3000);
      return {
        type: 'number', data: { a: a, b: b, t: t }, answer: res.steps,
        prompt: '<p>บีเวอร์มีถังน้ำสองใบ จุได้ <b>' + a + ' ลิตร</b> และ <b>' + b + ' ลิตร</b> ถังไม่มีขีดบอกปริมาตร (รู้ได้แค่ว่า "เต็ม" หรือ "ว่าง") และมีน้ำจากแม่น้ำใช้ได้ไม่จำกัด ' +
          'เริ่มต้นถังทั้งสองว่างเปล่า การกระทำหนึ่งครั้งคือ</p><ul><li>เติมน้ำให้เต็มถังใดถังหนึ่ง</li><li>เทน้ำในถังใดถังหนึ่งทิ้งให้หมด</li>' +
          '<li>เทน้ำจากถังหนึ่งไปอีกถังหนึ่ง จนกว่าถังต้นทางจะหมด หรือถังปลายทางจะเต็ม</li></ul>' +
          '<p>ต้องการให้<b>ถังใดถังหนึ่งมีน้ำพอดี ' + t + ' ลิตร</b> ต้องทำอย่างน้อยกี่การกระทำ?</p>',
        explain: '<p>จดสถานะ (น้ำในถัง ' + a + ' ลิตร, น้ำในถัง ' + b + ' ลิตร) แล้วค้นหาทีละการกระทำ ได้ว่าเร็วที่สุดคือ <b>' + res.steps + '</b> การกระทำ ตัวอย่าง:</p><ol>' +
          res.path.map(function (p) { return '<li>' + p.act + ' → (' + p.to[0] + ', ' + p.to[1] + ')</li>'; }).join('') + '</ol>'
      };
    }
  });

  /* ================= 4. ระบายสีกราฟ ================= */
  function colorable(n, adj, k) {
    var col = []; for (var i = 0; i < n; i++) col.push(-1);
    function rec(v) {
      if (v === n) return true;
      for (var c = 0; c < k; c++) {
        var ok = true;
        for (var u = 0; u < v; u++) if (adj[v][u] && col[u] === c) { ok = false; break; }
        if (ok) { col[v] = c; if (rec(v + 1)) return true; col[v] = -1; }
      }
      return false;
    }
    return rec(0) ? col.slice() : null;
  }
  function chromatic(n, adj) { for (var k = 1; k <= n; k++) if (colorable(n, adj, k)) return k; return n; }
  B.register({
    id: 'graph-coloring', topic: 'กราฟ', title: 'ระบายสีให้ต่างกัน', level: 'C',
    gen: function (rng) {
      var n = 6, adj, edges, target = rng.pick([3, 3, 4]), tries = 0, i, j, chi;
      do {
        adj = []; edges = [];
        for (i = 0; i < n; i++) { adj.push([]); for (j = 0; j < n; j++) adj[i].push(false); }
        for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (rng.chance(0.5)) { adj[i][j] = adj[j][i] = true; edges.push([i, j]); }
        chi = chromatic(n, adj); tries++;
        if (tries > 3000) target = 3;
      } while ((chi !== target || edges.length < 7 || edges.length > 11 || adj.some(function (r) { return !r.some(function (v) { return v; }); })) && tries < 6000);
      var cx = 130, cy = 108, rad = 84, s = '';
      var pos = function (k) { var ang = -Math.PI / 2 + k * 2 * Math.PI / n; return [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]; };
      edges.forEach(function (e) { var a = pos(e[0]), b = pos(e[1]); s += '<line class="f-edge" x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"/>'; });
      for (i = 0; i < n; i++) { var p = pos(i); s += '<circle class="f-node" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="16"/><text class="f-nt" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 5).toFixed(1) + '" text-anchor="middle">' + (i + 1) + '</text>'; }
      var col = colorable(n, adj, chi), names = ['แดง', 'เขียว', 'น้ำเงิน', 'เหลือง'];
      return {
        type: 'number', data: { n: n, edges: edges }, answer: chi,
        prompt: '<p>บีเวอร์ 6 ตัว (วงกลมหมายเลข 1–6) เส้นเชื่อมระหว่างสองตัวหมายถึง "สองตัวนี้อยู่ใกล้กันและเสียงดังรบกวนกัน" ' +
          'ครูต้องแจกหมวกสีให้ทุกตัว โดย<b>ตัวที่มีเส้นเชื่อมถึงกันต้องได้หมวกคนละสี</b></p>' +
          B.svg(260, 216, s, 'กราฟบีเวอร์ 6 ตัวและเส้นเชื่อม') + '<p>ใช้หมวกกี่สีน้อยที่สุด?</p>',
        explain: '<p>ตัวอย่างการแจกสีด้วย ' + chi + ' สี: ' + col.map(function (c, k) { return (k + 1) + '=' + names[c]; }).join(', ') +
          '</p><p>และใช้ ' + (chi - 1) + ' สีไม่ได้ เพราะ' + (chi === 4 ? 'มีกลุ่มบีเวอร์ที่เชื่อมถึงกันทุกคู่ หรือโครงสร้างที่บังคับให้ต้องใช้อย่างน้อย 4 สี' : chi === 3 ? 'มีวงที่เชื่อมกันครบสามตัว หรือวงรอบแบบจำนวนคี่ ซึ่งต้องใช้อย่างน้อย 3 สี' : 'มีคู่ที่เชื่อมกัน') +
          ' ดังนั้นคำตอบคือ <b>' + chi + '</b></p>'
      };
    }
  });

  /* ================= 5. เส้นทางวิกฤต ================= */
  B.register({
    id: 'critical-path', topic: 'การวางแผนงาน', title: 'สร้างเขื่อนให้เสร็จเร็วที่สุด', level: 'C',
    gen: function (rng) {
      var n = 6, dur = [], deps = [], i, j;
      do {
        dur = []; deps = [];
        for (i = 0; i < n; i++) {
          dur.push(rng.int(1, 5));
          var d = [];
          if (i > 0) { var want = rng.int(0, Math.min(2, i)); d = rng.sample(Array.apply(null, Array(i)).map(function (_, q) { return q; }), want).sort(); }
          deps.push(d);
        }
      } while (deps.filter(function (d) { return d.length > 0; }).length < 4);
      var fin = [];
      for (i = 0; i < n; i++) { var st = 0; deps[i].forEach(function (p) { if (fin[p] > st) st = fin[p]; }); fin.push(st + dur[i]); }
      var ans = Math.max.apply(null, fin);
      var rowsHtml = '';
      for (i = 0; i < n; i++) rowsHtml += '<tr><th scope="row">' + L[i] + '</th><td>' + dur[i] + '</td><td>' + (deps[i].length ? deps[i].map(function (p) { return L[p]; }).join(', ') : '—') + '</td></tr>';
      return {
        type: 'number', data: { n: n, dur: dur, deps: deps }, answer: ans,
        prompt: '<p>ฝูงบีเวอร์ต้องทำงาน 6 อย่างเพื่อสร้างเขื่อน แต่ละงานใช้เวลาตามตาราง (วัน) และงานจะ<b>เริ่มได้ก็ต่อเมื่องานที่ต้องทำก่อนเสร็จครบทุกงาน</b> ' +
          'บีเวอร์มีจำนวนมากพอ จึงทำงานหลายอย่างพร้อมกันได้ไม่จำกัด</p>' +
          '<table class="mini"><thead><tr><th scope="col">งาน</th><th scope="col">ใช้เวลา (วัน)</th><th scope="col">ต้องทำงานเหล่านี้ให้เสร็จก่อน</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
          '<p>ใช้เวลาน้อยที่สุดกี่วัน จึงทำงานครบทั้ง 6 อย่างเสร็จ?</p>',
        explain: '<p>หาว่าแต่ละงานเสร็จเร็วที่สุดวันไหน = (วันที่งานก่อนหน้าเสร็จช้าที่สุด) + เวลาของงานนั้น</p><ul>' +
          fin.map(function (f, k) { return '<li>งาน ' + L[k] + ' เสร็จวันที่ ' + f + '</li>'; }).join('') + '</ul><p>งานสุดท้ายเสร็จวันที่ <b>' + ans + '</b> (คือความยาวของ "เส้นทางที่ยาวที่สุด")</p>'
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
