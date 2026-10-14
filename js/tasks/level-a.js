/* Level A tasks (easiest group: 6 points for a correct answer). */
(function (root) {
  'use strict';
  var B = root.Bebras;
  var L = B.LETTERS;

  /* ================= 1. ลำดับตัวเลข ================= */
  B.register({
    id: 'pattern-seq', topic: 'แบบรูปและลำดับ', title: 'ลำดับตัวเลข', level: 'A',
    gen: function (rng) {
      var kind = rng.pick(['arith', 'alt', 'geo', 'fib', 'square']);
      var d = { kind: kind }, seq = [], shown, k, rule, i;
      if (kind === 'arith') {
        var down = rng.chance(0.3);
        d.s = down ? rng.int(70, 99) : rng.int(1, 20);
        d.d = down ? -rng.int(3, 6) : rng.int(2, 9);
        shown = 5; k = rng.int(8, 12);
        for (i = 0; i < k; i++) seq.push(i === 0 ? d.s : seq[i - 1] + d.d);
        rule = (down ? 'ลดลงทีละ ' + (-d.d) : 'เพิ่มขึ้นทีละ ' + d.d) + ' ทุกพจน์';
      } else if (kind === 'alt') {
        d.s = rng.int(1, 10); d.a = rng.int(1, 5); d.b = rng.int(6, 9);
        shown = 6; k = rng.int(9, 11);
        for (i = 0; i < k; i++) seq.push(i === 0 ? d.s : seq[i - 1] + (i % 2 === 1 ? d.a : d.b));
        rule = 'บวก ' + d.a + ' และ ' + d.b + ' สลับกัน (เริ่มที่บวก ' + d.a + ')';
      } else if (kind === 'geo') {
        d.s = rng.int(1, 3); d.r = rng.pick([2, 3]);
        shown = 4; k = d.r === 2 ? rng.int(7, 9) : rng.int(6, 7);
        for (i = 0; i < k; i++) seq.push(i === 0 ? d.s : seq[i - 1] * d.r);
        rule = 'คูณด้วย ' + d.r + ' ทุกพจน์';
      } else if (kind === 'fib') {
        d.a = rng.int(1, 4); d.b = rng.int(1, 5);
        shown = 6; k = rng.int(8, 9);
        for (i = 0; i < k; i++) seq.push(i === 0 ? d.a : i === 1 ? d.b : seq[i - 1] + seq[i - 2]);
        rule = 'พจน์ถัดไป = ผลบวกของสองพจน์ก่อนหน้า';
      } else {
        d.c = rng.int(-3, 5);
        shown = 5; k = rng.int(8, 11);
        for (i = 0; i < k; i++) seq.push((i + 1) * (i + 1) + d.c);
        rule = 'พจน์ที่ n = n × n ' + (d.c >= 0 ? '+ ' + d.c : '− ' + (-d.c));
      }
      d.shown = seq.slice(0, shown); d.k = k;
      var ans = seq[k - 1];
      return {
        type: 'number', data: d, answer: ans,
        prompt: '<p>ลำดับตัวเลขต่อไปนี้เป็นไปตามกฎข้อหนึ่ง</p><p class="seq">' + d.shown.join(', ') + ', …</p>' +
          '<p>พจน์ที่ <b>' + k + '</b> ของลำดับนี้คือเลขอะไร?</p>',
        explain: '<p>กฎคือ: ' + rule + '</p><p>ไล่ต่อไปจนถึงพจน์ที่ ' + k + ': ' + seq.join(', ') + '</p><p>คำตอบคือ <b>' + ans + '</b></p>'
      };
    }
  });

  /* ================= 2. หลอดไฟไบนารี ================= */
  B.register({
    id: 'binary-lamps', topic: 'การแทนข้อมูล (ไบนารี)', title: 'แผงหลอดไฟ', level: 'A',
    gen: function (rng) {
      var k = rng.chance(0.5) ? 5 : 6, w = [], i;
      for (i = 0; i < k; i++) w.push(Math.pow(2, i));
      if (rng.chance(0.5)) w.reverse();
      if (rng.chance(0.5)) {            // อ่านค่าจากหลอดที่ติด
        var bits = [], N = 0;
        do { bits = []; N = 0; for (i = 0; i < k; i++) { var b = rng.chance(0.5) ? 1 : 0; bits.push(b); N += b * w[i]; } } while (N === 0);
        var inner = '';
        for (i = 0; i < k; i++) {
          inner += '<circle class="' + (bits[i] ? 'f-lamp-on' : 'f-lamp-off') + '" cx="' + (30 + i * 52) + '" cy="40" r="20"/>' +
            '<text class="f-lab" x="' + (30 + i * 52) + '" y="82" text-anchor="middle">' + w[i] + '</text>';
        }
        var lit = []; for (i = 0; i < k; i++) if (bits[i]) lit.push(w[i]);
        return {
          type: 'number', data: { weights: w, bits: bits, N: N }, answer: N,
          prompt: '<p>แผงไฟของบีเวอร์มีหลอด ' + k + ' ดวง ตัวเลขใต้หลอดคือ "ค่าประจำหลอด" ตัวเลขที่แผงแสดงคือ <b>ผลรวมค่าประจำหลอดที่ติดสว่าง</b> (วงกลมสีทึบ = ติด)</p>' +
            B.svg(30 + k * 52, 96, inner, 'แผงหลอดไฟ ' + k + ' ดวง ค่าประจำหลอด ' + w.join(' ') + ' ติด ' + bits.join('')) +
            '<p>แผงนี้แสดงตัวเลขอะไร?</p>',
          explain: '<p>หลอดที่ติด: ' + lit.join(' + ') + ' = <b>' + N + '</b></p>'
        };
      }
      var T, pop;                        // สร้างตัวเลขเป้าหมายด้วยการกดหลอด
      do { T = rng.int(3, Math.pow(2, k) - 2); pop = 0; for (i = 0; i < k; i++) if ((T >> i) & 1) pop++; } while (pop < 2);
      var onW = w.filter(function (x) { return (T & x) !== 0; });
      return {
        type: 'grid', data: { weights: w, N: T },
        grid: { rows: 1, cols: k, labels: w.map(String), shape: 'lamp' },
        judge: function (cells) { var s = 0; for (var j = 0; j < k; j++) if (cells[j]) s += w[j]; return s === T; },
        prompt: '<p>แผงไฟมีหลอด ' + k + ' ดวง ตัวเลขใต้หลอดคือค่าประจำหลอด และตัวเลขที่แผงแสดงคือผลรวมค่าของหลอดที่ติดสว่าง</p>' +
          '<p>ให้เปิดหลอดไฟ (แตะที่หลอด) เพื่อให้แผงแสดงเลข <b>' + T + '</b></p>',
        solution: 'เปิดหลอดค่า ' + onW.join(', '),
        explain: '<p>เริ่มจากหลอดค่ามากที่สุดที่ไม่เกินเป้าหมายแล้วไล่ลงมา: ' + T + ' = ' + onW.slice().sort(function (a, b) { return b - a; }).join(' + ') + '</p>' +
          '<p>แต่ละหลอดมีค่าเป็นสองเท่าของหลอดก่อนหน้า จึงมีวิธีเปิดไฟที่ได้ ' + T + ' เพียงแบบเดียว</p>'
      };
    }
  });

  /* ================= 3. รหัสซีซาร์ ================= */
  var WORDS = ['BEAVER', 'LOGIC', 'ROBOT', 'CODE', 'GRAPH', 'LOOP', 'DATA', 'BYTE', 'PIXEL', 'ARRAY',
    'STACK', 'QUEUE', 'INPUT', 'TREE', 'NODE', 'SORT', 'FLOW', 'BINARY', 'MATRIX', 'SCRATCH', 'PYTHON', 'WEB', 'CHIP', 'DAM'];
  function shiftWord(word, s) {
    return word.split('').map(function (ch) { return L[(L.indexOf(ch) + s + 26) % 26]; }).join('');
  }
  B.register({
    id: 'caesar', topic: 'การเข้ารหัส', title: 'รหัสเลื่อนตัวอักษร', level: 'A',
    gen: function (rng) {
      var word = rng.pick(WORDS), s = rng.int(1, 6), encode = rng.chance(0.5);
      var alpha = '<div class="alpha" aria-label="ตัวอักษร A ถึง Z">' + L.split('').map(function (ch) { return '<span>' + ch + '</span>'; }).join('') + '</div>';
      var cipher = shiftWord(word, s);
      var ans = encode ? cipher : word;
      return {
        type: 'text', data: { word: word, shift: s, encode: encode }, answer: ans,
        prompt: '<p>บีเวอร์ใช้รหัสลับ: <b>เลื่อนตัวอักษรแต่ละตัวไปข้างหน้า ' + s + ' ตำแหน่ง</b> ในตัวอักษร A–Z ' +
          '(ถ้าเลยตัว Z ให้วนกลับไปเริ่มที่ A) เช่น ถ้าเลื่อน 1 ตำแหน่ง A กลายเป็น B และ Z กลายเป็น A</p>' + alpha +
          (encode
            ? '<p>ถ้าต้องการส่งคำว่า <b class="mono">' + word + '</b> จะต้องส่งรหัสว่าอะไร? (พิมพ์ตัวอักษรภาษาอังกฤษตัวพิมพ์ใหญ่)</p>'
            : '<p>บีเวอร์ได้รับรหัส <b class="mono">' + cipher + '</b> คำจริงคืออะไร? (พิมพ์ตัวอักษรภาษาอังกฤษตัวพิมพ์ใหญ่)</p>'),
        explain: encode
          ? '<p>เลื่อนไปข้างหน้า ' + s + ' ตำแหน่งทีละตัว: ' + word.split('').map(function (ch, i) { return ch + '→' + cipher[i]; }).join(', ') + '</p><p>คำตอบคือ <b>' + ans + '</b></p>'
          : '<p>ต้องเลื่อนกลับ ' + s + ' ตำแหน่งทีละตัว: ' + cipher.split('').map(function (ch, i) { return ch + '→' + word[i]; }).join(', ') + '</p><p>คำตอบคือ <b>' + ans + '</b></p>'
      };
    }
  });

  /* ================= 4. จำนวนในกลุ่ม (เซต) ================= */
  var PAIRS = [
    ['เล่นฟุตบอล', 'เล่นบาสเกตบอล'], ['เลี้ยงแมว', 'เลี้ยงสุนัข'], ['ชอบวิชาคณิตศาสตร์', 'ชอบวิชาวิทยาศาสตร์'],
    ['ดื่มชา', 'ดื่มกาแฟ'], ['ขี่จักรยานมาโรงเรียน', 'เดินมาโรงเรียน'], ['เคยใช้ Scratch', 'เคยใช้ Python']
  ];
  B.register({
    id: 'sets-count', topic: 'การนับและเซต', title: 'นับสมาชิกสองกลุ่ม', level: 'A',
    gen: function (rng) {
      var pair = rng.pick(PAIRS);
      var both = rng.int(2, 9), onlyA = rng.int(2, 12), onlyB = rng.int(2, 12), none = rng.int(0, 8);
      var T = both + onlyA + onlyB + none, a = both + onlyA, b = both + onlyB;
      var ask = rng.pick(['both', 'onlyA', 'onlyB']);
      var ans = ask === 'both' ? both : ask === 'onlyA' ? onlyA : onlyB;
      var q = ask === 'both' ? 'กี่คนที่' + pair[0] + 'และ' + pair[1] + 'ทั้งสองอย่าง'
        : ask === 'onlyA' ? 'กี่คนที่' + pair[0] + 'อย่างเดียว (ไม่' + pair[1] + ')'
          : 'กี่คนที่' + pair[1] + 'อย่างเดียว (ไม่' + pair[0] + ')';
      return {
        type: 'number', data: { T: T, a: a, b: b, none: none, ask: ask }, answer: ans,
        prompt: '<p>ในกลุ่มเพื่อนของบีเวอร์มีทั้งหมด <b>' + T + '</b> คน มี <b>' + a + '</b> คนที่' + pair[0] +
          ' มี <b>' + b + '</b> คนที่' + pair[1] + ' และมี <b>' + none + '</b> คนที่ไม่ได้ทำทั้งสองอย่างเลย</p><p>' + q + '?</p>',
        explain: '<p>คนที่ทำอย่างน้อยหนึ่งอย่าง = ' + T + ' − ' + none + ' = ' + (T - none) + ' คน</p>' +
          '<p>ผลรวม ' + a + ' + ' + b + ' = ' + (a + b) + ' นับคนที่ทำทั้งสองอย่างซ้ำสองครั้ง ส่วนเกินคือ ' + (a + b) + ' − ' + (T - none) + ' = ' + both + ' คน (ทำทั้งสองอย่าง)</p>' +
          '<p>ทำ' + pair[0] + 'อย่างเดียว = ' + a + ' − ' + both + ' = ' + onlyA + ' คน, ทำ' + pair[1] + 'อย่างเดียว = ' + b + ' − ' + both + ' = ' + onlyB + ' คน</p>' +
          '<p>คำตอบคือ <b>' + ans + '</b></p>'
      };
    }
  });

  /* ================= 5. ภาพพิกเซลกับรหัสความยาวต่อเนื่อง ================= */
  function randomRow(rng, cols) {
    var row = [], colour = rng.chance(0.5) ? 1 : 0;
    while (row.length < cols) {
      var len = rng.int(1, Math.min(cols - row.length, 3));
      for (var j = 0; j < len; j++) row.push(colour);
      colour = 1 - colour;
    }
    return row;
  }
  function encodeRow(row) {               // เริ่มนับสีขาว (0) เสมอ
    var nums = [], cur = 0, count = 0;
    row.forEach(function (v) {
      if (v === cur) count++; else { nums.push(count); cur = v; count = 1; }
    });
    nums.push(count);
    return nums;
  }
  function decodeRow(nums) {
    var row = [], cur = 0;
    nums.forEach(function (n) { for (var j = 0; j < n; j++) row.push(cur); cur = 1 - cur; });
    return row;
  }
  function sameArr(x, y) { return x.length === y.length && x.every(function (v, i) { return v === y[i]; }); }
  function validCode(nums, cols) {
    var sum = 0;
    for (var i = 0; i < nums.length; i++) { if (nums[i] < (i === 0 ? 0 : 1)) return false; sum += nums[i]; }
    return sum === cols;
  }
  B.register({
    id: 'rle-pixels', topic: 'การบีบอัดข้อมูล', title: 'รหัสภาพขาว-ดำ', level: 'A',
    gen: function (rng) {
      var n = rng.chance(0.5) ? 5 : 6, img, black, r, c;
      do {
        img = []; black = 0;
        for (r = 0; r < n; r++) { var row = randomRow(rng, n); img.push(row); row.forEach(function (v) { black += v; }); }
      } while (black < n + 1 || black > n * n - n - 1);
      var codes = img.map(encodeRow);
      var rule = '<p>บีเวอร์เก็บภาพขาว-ดำขนาด ' + n + '×' + n + ' ช่อง โดยเขียนรหัสทีละแถว: ตัวเลขแต่ละตัวบอก<b>จำนวนช่องที่ติดกันสีเดียวกัน</b> ' +
        'เรียงจากซ้ายไปขวา และสีสลับกันไปเรื่อยๆ โดย<b>เริ่มที่สีขาวเสมอ</b> (ถ้าแถวเริ่มด้วยช่องดำ ตัวแรกจะเป็น 0) ' +
        'เช่น <span class="mono">2 3 1</span> = ขาว 2, ดำ 3, ขาว 1</p>';
      if (rng.chance(0.55)) {              // วาดภาพจากรหัส
        var list = '<ol class="codes">' + codes.map(function (cd) { return '<li class="mono">' + cd.join(' ') + '</li>'; }).join('') + '</ol>';
        var flat = [].concat.apply([], img);
        return {
          type: 'grid', data: { n: n, codes: codes, image: img },
          grid: { rows: n, cols: n, shape: 'cell' },
          judge: function (cells) { for (var i = 0; i < n * n; i++) if ((cells[i] ? 1 : 0) !== flat[i]) return false; return true; },
          prompt: rule + '<p>ภาพหนึ่งมีรหัสแต่ละแถว (จากบนลงล่าง) ดังนี้</p>' + list + '<p>จงวาดภาพนี้ โดยแตะช่องที่ต้องการให้เป็นสีดำ</p>',
          solution: 'ภาพที่ถูกต้อง: ' + img.map(function (rw) { return rw.map(function (v) { return v ? '■' : '□'; }).join(''); }).join(' / '),
          explain: '<p>อ่านรหัสแต่ละแถว: ' + codes.map(function (cd, i) { return 'แถว ' + (i + 1) + ' = ' + cd.join(' ') + ' → ' + img[i].map(function (v) { return v ? '■' : '□'; }).join(''); }).join('<br>') + '</p>'
        };
      }
      var target = rng.int(0, n - 1), nums = codes[target], cand = {}, opts = [], tries = 0;
      cand[nums.join(' ')] = true;
      while (opts.length < 3 && tries < 400) {
        tries++;
        var t = rng.int(0, 2), c2;
        if (t === 0) c2 = nums.slice().reverse();
        else if (t === 1) c2 = nums[0] === 0 ? nums.slice(1) : [0].concat(nums);
        else { c2 = nums.slice(); var i = rng.int(0, c2.length - 2), dir = rng.chance(0.5) ? 1 : -1; c2[i] += dir; c2[i + 1] -= dir; }
        var key = c2.join(' ');
        if (!validCode(c2, n) || cand[key] || sameArr(decodeRow(c2), img[target])) continue;
        cand[key] = true; opts.push(key);
      }
      while (opts.length < 3) {            // เผื่อสร้างตัวลวงไม่พอ: ใช้รหัสของแถวอื่นที่ต่างจากแถวเป้าหมาย
        var other = encodeRow(randomRow(rng, n)), ok = other.join(' ');
        if (!cand[ok] && !sameArr(decodeRow(other), img[target])) { cand[ok] = true; opts.push(ok); }
      }
      var all = rng.shuffle([nums.join(' ')].concat(opts));
      var inner = '';
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
        inner += '<rect class="' + (img[r][c] ? 'f-fill' : 'f-cell') + '" x="' + (26 + c * 32) + '" y="' + (4 + r * 32) + '" width="32" height="32"/>';
      }
      for (r = 0; r < n; r++) inner += '<text class="f-lab" x="12" y="' + (26 + r * 32) + '" text-anchor="middle">' + (r + 1) + '</text>';
      return {
        type: 'choice', data: { n: n, image: img, row: target, options: all }, options: all.map(function (s) { return '<span class="mono">' + s + '</span>'; }),
        answer: all.indexOf(nums.join(' ')),
        prompt: rule + B.svg(30 + n * 32, 8 + n * 32, inner, 'ภาพขาวดำ ' + n + ' คูณ ' + n) +
          '<p>แถวที่ <b>' + (target + 1) + '</b> (นับจากบน) ของภาพนี้มีรหัสตรงกับข้อใด?</p>',
        explain: '<p>แถวที่ ' + (target + 1) + ' เป็น ' + img[target].map(function (v) { return v ? '■' : '□'; }).join('') +
          ' นับช่องที่ติดกันสีเดียวกันโดยเริ่มจากสีขาว ได้ <span class="mono">' + nums.join(' ') + '</span></p>'
      };
    }
  });

  /* ================= 6. หุ่นยนต์เดินตามโปรแกรม ================= */
  function runTrace(items, start, wallSet, rows, cols, flat) {
    var r = start[0], c = start[1];
    function step(m) {
      var d = B.MOVES[m], nr = r + d[0], nc = c + d[1];
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
      if (wallSet && wallSet[nr + ',' + nc]) return;
      r = nr; c = nc;
    }
    items.forEach(function (it) {
      if (it.rep) { for (var k = 0; k < (flat ? 1 : it.rep); k++) it.body.forEach(step); } else step(it.m);
    });
    return [r, c];
  }
  B.register({
    id: 'robot-trace', topic: 'อัลกอริทึมและโปรแกรม', title: 'หุ่นยนต์เดินตามโปรแกรม', level: 'A',
    gen: function (rng) {
      var rows = 5, cols = 5, walls = [], wallSet = {}, start, i, items, len;
      var cells = []; for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) cells.push([r, c]);
      var sh = rng.shuffle(cells); start = sh[0];
      for (i = 1; i <= rng.int(3, 5); i++) { walls.push(sh[i]); wallSet[sh[i][0] + ',' + sh[i][1]] = true; }
      var dirs = ['U', 'D', 'L', 'R'];
      do {
        items = []; len = 0;
        var nItems = rng.int(3, 5);
        for (i = 0; i < nItems; i++) {
          if (rng.chance(0.4)) {
            var rep = rng.int(2, 3), body = []; for (var j = 0; j < rng.int(1, 2); j++) body.push(rng.pick(dirs));
            items.push({ rep: rep, body: body }); len += rep * body.length;
          } else { items.push({ m: rng.pick(dirs) }); len++; }
        }
      } while (len > 14 || !items.some(function (it) { return it.rep; }) && rng.chance(0.5));
      var fin = runTrace(items, start, wallSet, rows, cols, false), ans = B.cellName(fin[0], fin[1]);
      var seen = {}; seen[ans] = true; var opts = [ans];
      [runTrace(items, start, null, rows, cols, false), runTrace(items, start, wallSet, rows, cols, true)].forEach(function (p) {
        var nm = B.cellName(p[0], p[1]);
        if (!seen[nm] && !wallSet[p[0] + ',' + p[1]]) { seen[nm] = true; opts.push(nm); }
      });
      var free = rng.shuffle(cells.filter(function (p) { return !wallSet[p[0] + ',' + p[1]]; }));
      for (i = 0; opts.length < 4; i++) { var nm2 = B.cellName(free[i][0], free[i][1]); if (!seen[nm2]) { seen[nm2] = true; opts.push(nm2); } }
      opts = rng.shuffle(opts);
      var progText = items.map(function (it) {
        return it.rep ? '<span class="rep">ทำซ้ำ ' + it.rep + ' ครั้ง: [' + it.body.map(function (m) { return B.ARROW[m]; }).join(' ') + ']</span>' : '<span class="mv">' + B.ARROW[it.m] + '</span>';
      }).join('');
      var path = [start], rr = start[0], cc = start[1];
      return {
        type: 'choice', data: { rows: rows, cols: cols, start: start, walls: walls, items: items, options: opts }, options: opts, answer: opts.indexOf(ans),
        prompt: '<p>หุ่นยนต์เริ่มที่วงกลมในตาราง ทำตามคำสั่งทีละคำสั่งจากซ้ายไปขวา ↑ = ขึ้น, ↓ = ลง, ← = ซ้าย, → = ขวา ' +
          'ถ้าคำสั่งนั้นจะทำให้ชนช่องสีเทา (กำแพง) หรือออกนอกตาราง หุ่นยนต์จะ<b>อยู่ที่เดิม</b>แล้วทำคำสั่งถัดไป</p>' +
          B.gridFigure(rows, cols, { labels: true, walls: walls, marks: [{ r: start[0], c: start[1], kind: 'start', text: 'เริ่ม' }], label: 'ตารางหุ่นยนต์' }) +
          '<div class="prog" aria-label="โปรแกรม">' + progText + '</div><p>เมื่อจบโปรแกรม หุ่นยนต์อยู่ที่ช่องใด?</p>',
        explain: '<p>เริ่มที่ ' + B.cellName(start[0], start[1]) + ' แล้วเดินตามคำสั่ง (คำสั่งที่ชนกำแพงให้ข้าม) จะจบที่ <b>' + ans + '</b></p>' +
          '<p>ข้อควรระวัง: ในบล็อก "ทำซ้ำ" ต้องทำทุกคำสั่งในวงเล็บซ้ำตามจำนวนครั้งที่กำหนด</p>'
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
