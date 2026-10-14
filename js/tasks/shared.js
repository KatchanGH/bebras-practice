/* Shared drawing helpers for task figures. */
(function (root) {
  'use strict';
  var B = root.Bebras;

  /* Square grid figure.
     o.walls  : array of [r,c] shaded cells
     o.marks  : array of {r,c,text,kind}  kind: 'start' | 'goal' | 'plain'
     o.labels : draw column letters (A..) and row numbers (1..)
     o.cell   : cell size in px (default 40) */
  B.gridFigure = function (rows, cols, o) {
    o = o || {};
    var cs = o.cell || 40, pad = o.labels ? 22 : 4;
    var w = cols * cs + pad + 4, h = rows * cs + pad + 4;
    var wall = {};
    (o.walls || []).forEach(function (p) { wall[p[0] + ',' + p[1]] = true; });
    var s = '', r, c;
    if (o.labels) {
      for (c = 0; c < cols; c++) s += '<text class="f-lab" x="' + (pad + c * cs + cs / 2) + '" y="15" text-anchor="middle">' + B.LETTERS[c] + '</text>';
      for (r = 0; r < rows; r++) s += '<text class="f-lab" x="10" y="' + (pad + r * cs + cs / 2 + 5) + '" text-anchor="middle">' + (r + 1) + '</text>';
    }
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      s += '<rect class="' + (wall[r + ',' + c] ? 'f-wall' : 'f-cell') + '" x="' + (pad + c * cs) + '" y="' + (pad + r * cs) +
        '" width="' + cs + '" height="' + cs + '"/>';
    }
    (o.marks || []).forEach(function (m) {
      var cx = pad + m.c * cs + cs / 2, cy = pad + m.r * cs + cs / 2;
      if (m.kind === 'start') s += '<circle class="f-start" cx="' + cx + '" cy="' + cy + '" r="' + (cs * 0.34) + '"/>';
      if (m.kind === 'goal') s += '<rect class="f-goal" x="' + (cx - cs * 0.3) + '" y="' + (cy - cs * 0.3) + '" width="' + (cs * 0.6) + '" height="' + (cs * 0.6) + '" rx="4"/>';
      if (m.text) s += '<text class="f-mark' + (m.kind ? ' f-mark-' + m.kind : '') + '" x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle">' + B.esc(m.text) + '</text>';
    });
    return B.svg(w, h, s, o.label || 'ตาราง');
  };

  B.MOVES = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
  B.ARROW = { U: '↑', D: '↓', L: '←', R: '→' };
  B.cellName = function (r, c) { return B.LETTERS[c] + (r + 1); };

  /* sequence of boxed numbers, e.g. for sorting tasks */
  B.tiles = function (arr) {
    return '<div class="tiles" role="img" aria-label="' + B.esc(arr.join(' ')) + '">' +
      arr.map(function (v) { return '<span class="tile">' + B.esc(v) + '</span>'; }).join('') + '</div>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
