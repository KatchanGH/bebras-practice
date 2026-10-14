/* Level B tasks (medium group: 9 points for a correct answer). */
(function (root) {
  'use strict';
  var B = root.Bebras;
  var L = B.LETTERS;

  /* ================= 1. เส้นทางสั้นที่สุด ================= */
  function dijkstra(n, edges, src) {
    var dist = [], prev = [], done = [], i;
    for (i = 0; i < n; i++) { dist.push(Infinity); prev.push(-1); done.push(false); }
    dist[src] = 0;
    for (var it = 0; it < n; it++) {
      var u = -1;
      for (i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break;
      done[u] = true;
      edges.forEach(function (e) {
        var v = e.u === u ? e.v : e.v === u ? e.u : -1;
        if (v >= 0 && dist[u] + e.w < dist[v]) { dist[v] = dist[u] + e.w; prev[v] = u; }
      });
    }
    return { dist: dist, prev: prev };
  }
  B.register({
    id: 'shortest-path', topic: 'กราฟและเส้นทาง', title: 'เส้นทางที่สั้นที่สุด', level: 'B',
    gen: function (rng) {
      var edges, tries = 0, ok, res;
      do {
        edges = []; var r, c;
        for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) {
          var id = r * 3 + c;
          if (c < 2 && rng.chance(0.88)) edges.push({ u: id, v: id + 1, w: rng.int(1, 9) });
          if (r < 2 && rng.chance(0.88)) edges.push({ u: id, v: id + 3, w: rng.int(1, 9) });
          if (r < 2 && c < 2 && rng.chance(0.4)) {
            if (rng.chance(0.5)) edges.push({ u: id, v: id + 4, w: rng.int(1, 9) });
            else edges.push({ u: id + 1, v: id + 3, w: rng.int(1, 9) });
          }
        }
        res = dijkstra(9, edges, 0);
        ok = edges.length >= 9 && res.dist[8] !== Infinity;
        tries++;
      } while (!ok && tries < 200);
      if (!ok) { edges = []; for (var q = 0; q < 9; q++) { if (q % 3 < 2) edges.push({ u: q, v: q + 1, w: rng.int(1, 9) }); if (q < 6) edges.push({ u: q, v: q + 3, w: rng.int(1, 9) }); } res = dijkstra(9, edges, 0); }
      var pos = function (i) { return [40 + (i % 3) * 120, 30 + Math.floor(i / 3) * 90]; };
      var s = '';
      edges.forEach(function (e) {
        var a = pos(e.u), b = pos(e.v);
        s += '<line class="f-edge" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
      });
      edges.forEach(function (e) {
        var a = pos(e.u), b = pos(e.v), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        s += '<rect class="f-lblbg" x="' + (mx - 10) + '" y="' + (my - 10) + '" width="20" height="20" rx="4"/>' +
          '<text class="f-wt" x="' + mx + '" y="' + (my + 5) + '" text-anchor="middle">' + e.w + '</text>';
      });
      for (var i = 0; i < 9; i++) {
        var p = pos(i);
        s += '<circle class="' + (i === 0 ? 'f-start' : i === 8 ? 'f-goalnode' : 'f-node') + '" cx="' + p[0] + '" cy="' + p[1] + '" r="17"/>' +
          '<text class="f-nt" x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle">' + L[i] + '</text>';
      }
      var path = [], cur = 8; while (cur >= 0) { path.unshift(L[cur]); cur = res.prev[cur]; }
      return {
        type: 'number', data: { n: 9, edges: edges, from: 0, to: 8 }, answer: res.dist[8],
        prompt: '<p>แผนที่ทางเดินในป่าของบีเวอร์: วงกลมคือจุดนัดพบ เส้นคือทางเดิน และตัวเลขบนเส้นคือ<b>ระยะทาง (นาที)</b> ของทางนั้น</p>' +
          B.svg(320, 240, s, 'แผนที่จุด A ถึง I พร้อมระยะทางบนเส้นทาง') +
          '<p>เส้นทางที่เร็วที่สุดจาก <b>A</b> ไป <b>I</b> ใช้เวลากี่นาที?</p>',
        explain: '<p>เส้นทางที่ใช้เวลาน้อยที่สุดคือ ' + path.join(' → ') + ' รวม <b>' + res.dist[8] + '</b> นาที</p>' +
          '<p>เส้นทางที่ผ่านจุดน้อยที่สุดไม่จำเป็นต้องเร็วที่สุด ต้องบวกเลขบนเส้นทุกเส้นที่ผ่านแล้วเปรียบเทียบหลายเส้นทาง</p>'
      };
    }
  });

  /* ================= 2. เรียงลำดับด้วยการสลับ ================= */
  function inversions(a) { var c = 0; for (var i = 0; i < a.length; i++) for (var j = i + 1; j < a.length; j++) if (a[i] > a[j]) c++; return c; }
  function swapsAny(a) {                      // n − จำนวนวัฏจักร
    var sorted = a.slice().sort(function (x, y) { return x - y; }), idx = a.map(function (v) { return sorted.indexOf(v); });
    var seen = a.map(function () { return false; }), cycles = 0;
    for (var i = 0; i < a.length; i++) if (!seen[i]) { cycles++; var j = i; while (!seen[j]) { seen[j] = true; j = idx[j]; } }
    return a.length - cycles;
  }
  B.register({
    id: 'sort-swaps', topic: 'การเรียงลำดับ', title: 'สลับให้เรียง', level: 'B',
    gen: function (rng) {
      var adjacent = rng.chance(0.5), n = adjacent ? rng.int(5, 6) : rng.int(6, 7), a, ans;
      do {
        a = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], n);
        ans = adjacent ? inversions(a) : swapsAny(a);
      } while (adjacent ? (ans < 4 || ans > 10) : ans < 3);
      var sorted = a.slice().sort(function (x, y) { return x - y; });
      return {
        type: 'number', data: { list: a, adjacent: adjacent }, answer: ans,
        prompt: '<p>บีเวอร์วางแผ่นไม้ที่มีเลขกำกับเรียงเป็นแถว ต้องการเรียงจาก<b>น้อยไปมาก</b></p>' + B.tiles(a) +
          (adjacent
            ? '<p>การสลับแต่ละครั้ง ทำได้เฉพาะ<b>สลับแผ่นไม้ที่อยู่ติดกัน</b>สองแผ่น อย่างน้อยต้องสลับกี่ครั้งจึงจะเรียงได้?</p>'
            : '<p>การสลับแต่ละครั้ง สามารถ<b>เลือกแผ่นไม้สองแผ่นใดก็ได้</b>มาสลับตำแหน่งกัน อย่างน้อยต้องสลับกี่ครั้งจึงจะเรียงได้?</p>'),
        explain: adjacent
          ? '<p>การสลับแผ่นติดกันหนึ่งครั้งแก้ได้เพียง "หนึ่งคู่ที่เรียงผิด" คู่ที่ตัวใหญ่อยู่ก่อนตัวเล็กมี <b>' + ans + '</b> คู่ จึงต้องสลับอย่างน้อย ' + ans + ' ครั้ง (และทำได้พอดีด้วย)</p>'
          : '<p>ลำดับที่ต้องการคือ ' + sorted.join(' ') + ' แผ่นที่อยู่ผิดที่จะวนกันเป็นวง ถ้าวงหนึ่งมี k แผ่นต้องสลับ k − 1 ครั้ง รวมทั้งหมดต้องสลับ <b>' + ans + '</b> ครั้ง</p>'
      };
    }
  });

  /* ================= 3. แบ่งครึ่ง / ชั่งเหรียญ ================= */
  B.register({
    id: 'halving', topic: 'การค้นหาและการแบ่งครึ่ง', title: 'ถามให้น้อยที่สุด', level: 'B',
    gen: function (rng) {
      var guess = rng.chance(0.5), N, base = guess ? 2 : 3, k = 0, p = 1;
      if (guess) { do { N = rng.int(20, 500); } while ((N & (N - 1)) === 0); }
      else { do { N = rng.int(5, 100); } while (N === 9 || N === 27 || N === 81); }
      while (p < N) { p *= base; k++; }
      return {
        type: 'number', data: { N: N, kind: guess ? 'guess' : 'coins' }, answer: k,
        prompt: guess
          ? '<p>บีเวอร์แอบคิดเลขจำนวนเต็มหนึ่งตัวตั้งแต่ <b>1 ถึง ' + N + '</b> เพื่อนถามได้แต่คำถามที่ตอบ "ใช่" หรือ "ไม่ใช่" เช่น "เลขของเธอมากกว่า 40 ไหม?" ' +
            'ถ้าเพื่อนเลือกคำถามได้ดีที่สุดทุกครั้ง ต้องถามอย่างน้อยกี่ข้อจึง<b>รับประกัน</b>ว่าจะรู้เลขที่คิดไว้แน่นอน (แม้โชคร้ายที่สุด)?</p>'
          : '<p>มีเหรียญ <b>' + N + '</b> เหรียญ หน้าตาเหมือนกันทุกประการ แต่มี 1 เหรียญเป็นของปลอมที่ <b>หนักกว่า</b> เล็กน้อย ' +
            'บีเวอร์มีเครื่องชั่งสองแขน (วางเหรียญฝั่งซ้ายและขวา แล้วดูว่าฝั่งไหนหนักกว่า หรือเท่ากัน) ' +
            'ต้องชั่งอย่างน้อยกี่ครั้งจึง<b>รับประกัน</b>ว่าหาเหรียญปลอมเจอ (แม้โชคร้ายที่สุด)?</p>',
        explain: guess
          ? '<p>ทุกคำถามแบ่งตัวเลือกที่เหลือได้มากที่สุดเป็นสองส่วน ถามหนึ่งข้อลดเหลือประมาณครึ่งหนึ่ง ต้องแบ่งครึ่งซ้ำจน 2<sup>k</sup> ≥ ' + N + ' ค่า k ที่น้อยที่สุดคือ <b>' + k + '</b> (2<sup>' + k + '</sup> = ' + p + ')</p>'
          : '<p>การชั่งหนึ่งครั้งมีผลลัพธ์ได้ 3 แบบ (ซ้ายหนัก, ขวาหนัก, เท่ากัน) จึงแบ่งเหรียญเป็น 3 กองใกล้เคียงกันแล้วชั่งสองกอง แต่ละครั้งลดเหลือประมาณหนึ่งในสาม ต้องการ 3<sup>k</sup> ≥ ' + N + ' ค่า k ที่น้อยที่สุดคือ <b>' + k + '</b> (3<sup>' + k + '</sup> = ' + p + ')</p>'
      };
    }
  });

  /* ================= 4. นับเส้นทางในตาราง ================= */
  B.register({
    id: 'path-count', topic: 'การนับและการวางแผน', title: 'นับเส้นทางหุ่นยนต์', level: 'B',
    gen: function (rng) {
      var R = rng.int(4, 5), C = rng.int(4, 5), walls, ans, dp, tries = 0, r, c;
      do {
        walls = []; var set = {};
        var cnt = rng.int(2, 4);
        while (walls.length < cnt) {
          r = rng.int(0, R - 1); c = rng.int(0, C - 1);
          if ((r === 0 && c === 0) || (r === R - 1 && c === C - 1) || set[r + ',' + c]) continue;
          set[r + ',' + c] = true; walls.push([r, c]);
        }
        dp = [];
        for (r = 0; r < R; r++) {
          dp.push([]);
          for (c = 0; c < C; c++) {
            if (set[r + ',' + c]) { dp[r].push(0); continue; }
            if (r === 0 && c === 0) { dp[r].push(1); continue; }
            dp[r].push((r > 0 ? dp[r - 1][c] : 0) + (c > 0 ? dp[r][c - 1] : 0));
          }
        }
        ans = dp[R - 1][C - 1]; tries++;
      } while ((ans < 3 || ans > 40) && tries < 500);
      return {
        type: 'number', data: { R: R, C: C, walls: walls }, answer: ans,
        prompt: '<p>หุ่นยนต์ส่งของเริ่มที่ช่องซ้ายบน (วงกลม) และต้องไปที่ช่องขวาล่าง (สี่เหลี่ยม) หุ่นยนต์เดินได้เพียง 2 ทิศ คือ <b>ไปทางขวา</b> หรือ <b>ลงข้างล่าง</b> ทีละหนึ่งช่อง ' +
          'และเดินผ่านช่องสีเทา (ถูกปิด) ไม่ได้</p>' +
          B.gridFigure(R, C, { walls: walls, marks: [{ r: 0, c: 0, kind: 'start', text: '' }, { r: R - 1, c: C - 1, kind: 'goal', text: '' }], cell: 44, label: 'ตารางเส้นทางหุ่นยนต์' }) +
          '<p>หุ่นยนต์มีวิธีเดินที่ต่างกันกี่แบบ?</p>',
        explain: '<p>ให้นับจำนวนวิธีที่ไปถึงแต่ละช่อง: ช่องหนึ่งมาได้จากช่องด้านบนหรือช่องด้านซ้าย จึงเอาจำนวนวิธีของสองช่องนั้นมารวมกัน (ช่องสีเทาเป็น 0)</p>' +
          '<table class="mini"><tbody>' + dp.map(function (row) { return '<tr>' + row.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' +
          '<p>ช่องขวาล่างมี <b>' + ans + '</b> วิธี</p>'
      };
    }
  });

  /* ================= 5. หุ่นยนต์หาทาง (เขียนโปรแกรมเอง) ================= */
  function bfsGrid(n, wallSet, s, g) {
    var dist = {}, prev = {}, q = [s], key = function (p) { return p[0] + ',' + p[1]; };
    dist[key(s)] = 0;
    for (var h = 0; h < q.length; h++) {
      var p = q[h];
      if (p[0] === g[0] && p[1] === g[1]) break;
      ['U', 'D', 'L', 'R'].forEach(function (m) {
        var d = B.MOVES[m], r = p[0] + d[0], c = p[1] + d[1];
        if (r < 0 || r >= n || c < 0 || c >= n || wallSet[r + ',' + c] || dist[r + ',' + c] !== undefined) return;
        dist[r + ',' + c] = dist[key(p)] + 1; prev[r + ',' + c] = { from: p, m: m }; q.push([r, c]);
      });
    }
    var gk = key(g);
    if (dist[gk] === undefined) return null;
    var path = [], cur = g;
    while (key(cur) !== key(s)) { var pr = prev[key(cur)]; path.unshift(pr.m); cur = pr.from; }
    return { len: dist[gk], path: path };
  }
  B.register({
    id: 'robot-grid', topic: 'อัลกอริทึมและโปรแกรม', title: 'เขียนโปรแกรมให้หุ่นยนต์', level: 'B',
    gen: function (rng) {
      var n = rng.chance(0.5) ? 5 : 6, walls, wallSet, start, goal, res, tries = 0, cells = [], r, c, i;
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) cells.push([r, c]);
      do {
        var sh = rng.shuffle(cells); start = sh[0]; goal = sh[1]; walls = []; wallSet = {};
        var cnt = Math.round(n * n * rng.int(22, 32) / 100);
        for (i = 2; i < 2 + cnt; i++) { walls.push(sh[i]); wallSet[sh[i][0] + ',' + sh[i][1]] = true; }
        res = bfsGrid(n, wallSet, start, goal); tries++;
      } while ((!res || res.len < 6 || res.len > 11) && tries < 2000);
      var K = res.len;
      return {
        type: 'program', data: { n: n, walls: walls, start: start, goal: goal, max: K },
        program: { cmds: ['U', 'D', 'L', 'R'], max: K },
        judge: function (seq) {
          if (seq.length > K) return false;
          var pr = start[0], pc = start[1];
          seq.forEach(function (m) {
            var d = B.MOVES[m], nr = pr + d[0], nc = pc + d[1];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n || wallSet[nr + ',' + nc]) return;
            pr = nr; pc = nc;
          });
          return pr === goal[0] && pc === goal[1];
        },
        prompt: '<p>จงเขียนโปรแกรมสั่งหุ่นยนต์จากวงกลม ไปให้ถึงช่องสี่เหลี่ยม (เป้าหมาย) โดยใช้ปุ่มคำสั่งด้านล่าง หุ่นยนต์ก้าวทีละหนึ่งช่อง ' +
          'ถ้าชนช่องสีเทาหรือขอบตารางจะอยู่ที่เดิม (แต่ยังนับเป็นหนึ่งคำสั่ง)</p>' +
          B.gridFigure(n, n, { labels: true, walls: walls, marks: [{ r: start[0], c: start[1], kind: 'start', text: 'เริ่ม' }, { r: goal[0], c: goal[1], kind: 'goal', text: '' }], label: 'ตารางหุ่นยนต์' }) +
          '<p>ใช้คำสั่ง<b>ไม่เกิน ' + K + ' คำสั่ง</b> และให้หุ่นยนต์หยุดที่ช่องเป้าหมายพอดี</p>',
        solution: 'ตัวอย่างโปรแกรมที่ใช้ ' + K + ' คำสั่ง: ' + res.path.map(function (m) { return B.ARROW[m]; }).join(' '),
        explain: '<p>หาทางที่สั้นที่สุดโดยลองเดินทีละขั้นจากจุดเริ่ม ทุกช่องที่ไปถึงได้ภายใน 1 ก้าว 2 ก้าว … จนถึงเป้าหมาย พบว่าอย่างน้อยต้องใช้ ' + K + ' ก้าว ตัวอย่าง: ' +
          res.path.map(function (m) { return B.ARROW[m]; }).join(' ') + ' (ทางอื่นที่ใช้จำนวนก้าวเท่ากันก็ถูก)</p>'
      };
    }
  });

  /* ================= 6. รถไฟกับทางแยก (stack) ================= */
  function canProduce(perm, n) {
    var stack = [], next = 1;
    for (var i = 0; i < perm.length; i++) {
      var x = perm[i];
      while (stack.length === 0 || stack[stack.length - 1] !== x) {
        if (next > n) return false;
        stack.push(next++);
      }
      stack.pop();
    }
    return true;
  }
  function allPerms(n) {
    var out = [];
    (function rec(cur, left) {
      if (!left.length) { out.push(cur); return; }
      left.forEach(function (v, i) { rec(cur.concat([v]), left.slice(0, i).concat(left.slice(i + 1))); });
    })([], Array.apply(null, Array(n)).map(function (_, i) { return i + 1; }));
    return out;
  }
  function opsFor(perm, n) {
    var stack = [], next = 1, ops = [];
    perm.forEach(function (x) {
      while (stack[stack.length - 1] !== x) { stack.push(next); ops.push('เข้า ' + next); next++; }
      stack.pop(); ops.push('ออก ' + x);
    });
    return ops;
  }
  B.register({
    id: 'stack-train', topic: 'โครงสร้างข้อมูล (สแตก)', title: 'รถไฟกับทางแยกตัน', level: 'B',
    gen: function (rng) {
      var n = rng.chance(0.5) ? 4 : 5, perms = allPerms(n);
      var ident = perms[0].join('');
      var good = perms.filter(function (p) { return p.join('') !== ident && canProduce(p, n); });
      var bad = perms.filter(function (p) { return !canProduce(p, n); });
      var g = rng.pick(good), bs = rng.sample(bad, 3);
      var all = rng.shuffle([g].concat(bs)), ans = all.indexOf(g);
      var why = bs.map(function (p) {
        for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) for (var k = j + 1; k < n; k++)
          if (p[j] < p[k] && p[k] < p[i]) return '<li>' + p.join(' ') + ' เป็นไปไม่ได้: เมื่อขบวน ' + p[i] + ' ออกก่อน แปลว่า ' + p[j] + ' และ ' + p[k] + ' เข้าทางแยกไปแล้ว โดย ' + p[k] + ' เข้าทีหลังจึงอยู่ทับ ' + p[j] + ' ต้องออกก่อน แต่ลำดับนี้ให้ ' + p[j] + ' ออกก่อน ' + p[k] + '</li>';
        return '<li>' + p.join(' ') + ' เป็นไปไม่ได้</li>';
      }).join('');
      return {
        type: 'choice', data: { n: n, options: all.map(function (p) { return p.slice(); }) },
        options: all.map(function (p) { return '<span class="mono">' + p.join(' ') + '</span>'; }), answer: ans,
        prompt: '<p>รถไฟ ' + n + ' ขบวน หมายเลข 1 ถึง ' + n + ' ต่อคิวรอเข้าสถานีตามลำดับ <b>1, 2, …, ' + n + '</b> (หมายเลข 1 อยู่หน้าสุด) สถานีมีทางแยก<b>ตัน</b>หนึ่งทาง ' +
          'ขบวนที่หน้าคิวมีสองทางเลือกเท่านั้น: <b>เข้า</b>ทางแยก หรือ ให้ขบวนที่อยู่<b>ปลายสุดในทางแยก</b> (ขบวนที่เข้าไปล่าสุด) <b>ออก</b>ไปยังทางออก ' +
          'ทางแยกตันจึงคล้ายกองจาน: เข้าทีหลังต้องออกก่อน</p><p>ขบวนที่ออกจากสถานีจะเรียงเป็นลำดับหนึ่ง ลำดับใดต่อไปนี้ <b>เกิดขึ้นได้</b>?</p>',
        explain: '<p>ลำดับที่เป็นไปได้คือ <b>' + g.join(' ') + '</b> ทำได้ดังนี้: ' + opsFor(g, n).join(', ') + '</p><ul>' + why + '</ul>'
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
