/* Drawings. Every picture on the site is drawn here as SVG in the site's own
   tokens, so it follows the light/dark theme and weighs next to nothing.

   PortfolioArt.figure(name)  a project illustration — `art` in portfolio-data.js
   PortfolioArt.icon(name)    a 24px line icon — `icon` in portfolio-data.js

   Each returns an SVG element, or null for a name it doesn't know, so a
   project with no drawing simply shows none. The markup below is static —
   nothing from the data file is ever parsed as SVG. */
(function (window, document) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var uid = 0;

  function parse(markup, attrs) {
    var holder = document.createElementNS(NS, "svg");
    holder.innerHTML = markup;
    var node = holder.firstElementChild;
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function seeded(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
  }

  function f(n) { return Math.round(n * 10) / 10; }

  /* ── Voter segmentation: households on a grid, cut into segments ──────── */

  function segments() {
    var COLS = 12, ROWS = 8, S = 32, X0 = 48, Y0 = 64;
    var seeds = [[1.5, 1.5], [6.5, 0.8], [10.5, 2.5], [9.5, 6.5], [3.5, 6], [5.5, 3.8]];
    var tint = ["t1", "t2", "t3", "v1", "t2", "v2"];
    var owner = [];
    for (var r = 0; r < ROWS; r++) {
      owner.push([]);
      for (var c = 0; c < COLS; c++) {
        var best = 0, bestD = Infinity;
        seeds.forEach(function (s, k) {
          var d = Math.pow(c + 0.5 - s[0], 2) + Math.pow(r + 0.5 - s[1], 2) * 1.2;
          if (d < bestD) { bestD = d; best = k; }
        });
        owner[r].push(best);
      }
    }

    var cells = "", edges = "", homes = "", centres = [];
    var rand = seeded(4242);
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        var x = X0 + c * S, y = Y0 + r * S, k = owner[r][c];
        cells += '<rect class="' + tint[k] + '" x="' + x + '" y="' + y + '" width="' + S + '" height="' + S + '"/>';
        if (c < COLS - 1 && owner[r][c + 1] !== k) edges += "M" + (x + S) + " " + y + "v" + S;
        if (r < ROWS - 1 && owner[r + 1][c] !== k) edges += "M" + x + " " + (y + S) + "h" + S;
        /* A household is a cluster of voters that always moves together. */
        var n = Math.floor(rand() * 3);
        for (var h = 0; h < n; h++) {
          var hx = x + 8 + rand() * 16, hy = y + 8 + rand() * 16;
          var members = 2 + Math.floor(rand() * 3);
          centres.push([hx, hy]);
          for (var m = 0; m < members; m++) {
            var a = m / members * Math.PI * 2 + rand();
            homes += '<circle cx="' + f(hx + Math.cos(a) * 3.2) + '" cy="' + f(hy + Math.sin(a) * 3.2) + '" r="1.7"/>';
          }
        }
      }
    }
    /* Ring the household nearest the middle of the map. */
    var mid = [X0 + 7.5 * S, Y0 + 3.5 * S];
    var pick = centres.reduce(function (best, c) {
      var d = Math.pow(c[0] - mid[0], 2) + Math.pow(c[1] - mid[1], 2);
      return d < best.d ? { c: c, d: d } : best;
    }, { c: mid, d: Infinity }).c;
    var fx = f(pick[0]), fy = f(pick[1]);

    return parse(
      '<svg viewBox="0 0 480 360" role="img" aria-label="Households on a grid, partitioned into six contiguous segments with no household split">' +
      '<text class="a-cap" x="48" y="40">segments 06 · split households 00</text>' +
      '<g class="a-cells">' + cells + '</g>' +
      '<g class="a-grid">' + Array.apply(null, Array(COLS + 1)).map(function (_, i) {
        return '<path d="M' + (X0 + i * S) + ' ' + Y0 + 'v' + ROWS * S + '"/>';
      }).join("") + Array.apply(null, Array(ROWS + 1)).map(function (_, i) {
        return '<path d="M' + X0 + ' ' + (Y0 + i * S) + 'h' + COLS * S + '"/>';
      }).join("") + '</g>' +
      '<g class="a-dots">' + homes + '</g>' +
      '<path class="a-edge" d="' + edges + '"/>' +
      '<rect class="a-frame" x="' + X0 + '" y="' + Y0 + '" width="' + COLS * S + '" height="' + ROWS * S + '"/>' +
      '<circle class="a-ring" cx="' + fx + '" cy="' + fy + '" r="10"/>' +
      '<path class="a-lead" d="M' + fx + ' ' + (fy - 11) + 'V' + 52 + 'H' + 432 + '"/>' +
      '<text class="a-note" x="432" y="46" text-anchor="end">1 family = 1 unit</text>' +
      '</svg>');
  }

  /* ── Compaction passes: three lanes, chainage sections, a GPS trace ───── */

  function passes() {
    var X0 = 64, X1 = 448, Y0 = 84, LANE = 64, SECTIONS = 6;
    var W = (X1 - X0) / SECTIONS;
    var counts = [[4, 6, 7, 8, 6, 5], [8, 8, 9, 8, 7, 6], [3, 5, 6, 7, 7, 4]];
    var lanes = ["L", "C", "R"];
    var heat = "", nums = "", labels = "", ticks = "";

    counts.forEach(function (row, l) {
      var y = Y0 + l * LANE;
      labels += '<text class="a-cap" x="36" y="' + (y + LANE / 2 + 4) + '">' + lanes[l] + '</text>';
      row.forEach(function (n, s) {
        var x = X0 + s * W;
        heat += '<rect x="' + f(x) + '" y="' + y + '" width="' + f(W) + '" height="' + LANE + '" style="fill-opacity:' + f(n / 9 * 0.34) + '"/>';
        nums += '<text x="' + f(x + W - 8) + '" y="' + (y + 16) + '" text-anchor="end">' + n + '</text>';
      });
    });
    for (var s = 0; s <= SECTIONS; s++) {
      var x = X0 + s * W;
      ticks += '<path d="M' + f(x) + ' ' + (Y0 - 6) + 'V' + (Y0 + 3 * LANE + 6) + '"/>';
      labels += '<text class="a-cap" x="' + f(x) + '" y="' + (Y0 + 3 * LANE + 24) + '" text-anchor="middle">0+' + String(s * 100).padStart(3, "0") + '</text>';
    }

    /* Out along the centre lane, back again, out once more: three passes. */
    var yc = Y0 + LANE + LANE / 2;
    var legs = [[X0 + 10, X1 - 14, yc - 4], [X1 - 14, X0 + 70, yc + 8], [X0 + 70, X1 - 60, yc + 20]];
    var trace = "", fixes = "", sensors = "";
    legs.forEach(function (leg, i) {
      trace += (i ? "L" : "M") + leg[0] + " " + leg[2] + "L" + leg[1] + " " + leg[2];
      var dir = leg[1] > leg[0] ? 1 : -1;
      for (var p = leg[0]; dir > 0 ? p <= leg[1] : p >= leg[1]; p += dir * 13) {
        fixes += '<circle cx="' + p + '" cy="' + leg[2] + '" r="1.9"/>';
      }
      for (var q = leg[0] + dir * 40; dir > 0 ? q <= leg[1] : q >= leg[1]; q += dir * 118) {
        sensors += '<path d="M' + q + ' ' + (leg[2] - 5) + 'l5 5-5 5-5-5z"/>';
      }
    });
    var end = legs[2];

    return parse(
      '<svg viewBox="0 0 480 360" role="img" aria-label="A road in three lanes cut into chainage sections, shaded by how many compaction passes each received, with a GPS trace of a roller making three passes">' +
      '<text class="a-cap" x="36" y="44">passes / section / lane</text>' +
      '<g class="a-legend"><circle cx="300" cy="40" r="2.4" class="a-fix"/><text class="a-cap" x="308" y="44">1 Hz GPS</text>' +
      '<path class="a-sensor" d="M388 35l5 5-5 5-5-5z"/><text class="a-cap" x="398" y="44">~2 min</text></g>' +
      '<g class="a-heat">' + heat + '</g>' +
      '<g class="a-grid">' + ticks +
      '<path d="M' + X0 + ' ' + (Y0 + LANE) + 'H' + X1 + 'M' + X0 + ' ' + (Y0 + 2 * LANE) + 'H' + X1 + '" class="a-lane"/></g>' +
      '<rect class="a-frame" x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + 3 * LANE + '"/>' +
      '<g class="a-num">' + nums + '</g>' +
      '<path class="a-trace" d="' + trace + '"/>' +
      '<g class="a-fix">' + fixes + '</g>' +
      '<g class="a-sensor">' + sensors + '</g>' +
      '<g transform="translate(' + (end[1] + 4) + ' ' + (end[2] - 11) + ')" class="a-roller">' +
      '<rect x="0" y="0" width="30" height="22" rx="4"/><rect class="a-drum" x="26" y="-3" width="9" height="28" rx="3"/></g>' +
      labels +
      '</svg>');
  }

  /* ── Strength MMA: the site in a browser window, and what search did ──── */

  function site() {
    var id = "stripes-" + (++uid);
    return parse(
      '<svg viewBox="0 0 480 360" role="img" aria-label="The Strength MMA website in a browser window, with 34% of traffic from organic search">' +
      '<defs><pattern id="' + id + '" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">' +
      '<rect width="4" height="10" class="a-stripe"/></pattern></defs>' +
      '<rect class="a-window" x="32" y="36" width="392" height="280" rx="8"/>' +
      '<path class="a-rule" d="M32 64H424"/>' +
      '<circle class="a-dot" cx="50" cy="50" r="4"/><circle class="a-dot" cx="63" cy="50" r="4"/><circle class="a-dot" cx="76" cy="50" r="4"/>' +
      '<rect class="a-url" x="150" y="42" width="160" height="16" rx="8"/>' +
      '<text class="a-cap" x="230" y="54" text-anchor="middle">strengthmma.com</text>' +
      '<rect class="a-hero" x="48" y="80" width="360" height="124" rx="4"/>' +
      '<rect x="48" y="80" width="360" height="124" rx="4" fill="url(#' + id + ')"/>' +
      '<text class="a-display" x="68" y="140">STRENGTH</text>' +
      '<text class="a-display a-display-acc" x="68" y="178">MMA</text>' +
      '<rect class="a-cta" x="300" y="164" width="92" height="24" rx="3"/>' +
      '<text class="a-cta-t" x="346" y="180" text-anchor="middle">Book a trial</text>' +
      '<g class="a-cards">' +
      '<rect x="48" y="220" width="112" height="80" rx="4"/><rect x="172" y="220" width="112" height="80" rx="4"/><rect x="296" y="220" width="112" height="80" rx="4"/></g>' +
      '<g class="a-bars">' +
      '<rect x="60" y="264" width="72" height="6" rx="3"/><rect x="60" y="278" width="52" height="6" rx="3"/>' +
      '<rect x="184" y="264" width="80" height="6" rx="3"/><rect x="184" y="278" width="48" height="6" rx="3"/>' +
      '<rect x="308" y="264" width="64" height="6" rx="3"/><rect x="308" y="278" width="76" height="6" rx="3"/></g>' +
      '<g class="a-bars a-bars-acc"><rect x="60" y="234" width="26" height="18" rx="3"/><rect x="184" y="234" width="26" height="18" rx="3"/><rect x="308" y="234" width="26" height="18" rx="3"/></g>' +
      '<g transform="translate(404 262)">' +
      '<circle class="a-donut-bg" r="50"/><circle class="a-donut-track" r="36"/>' +
      '<circle class="a-donut" r="36" pathLength="100" stroke-dasharray="34 66" transform="rotate(-90)"/>' +
      '<text class="a-donut-v" y="6" text-anchor="middle">34%</text>' +
      '<text class="a-cap" y="22" text-anchor="middle">organic</text></g>' +
      '</svg>');
  }

  var FIGURES = { segments: segments, passes: passes, site: site };

  /* ── Icons: 24 × 24, 1.6 stroke, round caps ───────────────────────────── */

  var ICONS = {
    excavator: '<rect x="1.8" y="16.3" width="13.6" height="4.6" rx="2.3"/><circle cx="4.6" cy="18.6" r=".7"/><circle cx="12.6" cy="18.6" r=".7"/><path d="M3.2 16.3V9.8h4.9l2.6 3.4v3.1"/><path d="M5.4 9.8V7.4"/><path d="M9.6 11.8L15.2 3.8l6.4 5.4"/><path d="M21.6 9.2v4.6l-3.8 1.4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/><path d="M3.5 5l2-2M20.5 5l-2-2"/>',
    cube: '<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M4 7.4l8 4.6 8-4.6M12 12v9.2"/>',
    moon: '<path d="M19.5 14.2A7.5 7.5 0 0 1 9.8 4.5a7.5 7.5 0 1 0 9.7 9.7z"/><path d="M16 3.5v3M14.5 5h3"/>',
    pin: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8.5h16M9 8.5V21"/><path d="M12 14.8l1.8 1.8 3.4-4"/>',
    car: '<path d="M3.5 16.5v-3.2l2-4.8A1.8 1.8 0 0 1 7.2 7.3h9.6a1.8 1.8 0 0 1 1.7 1.2l2 4.8v3.2"/><path d="M3.5 13.3h17"/><circle cx="7.5" cy="16.8" r="1.8"/><circle cx="16.5" cy="16.8" r="1.8"/><path d="M9.3 16.8h5.4"/>'
  };

  function icon(name) {
    if (!ICONS[name]) return null;
    return parse('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>');
  }

  window.PortfolioArt = {
    figure: function (name) { return FIGURES[name] ? FIGURES[name]() : null; },
    icon: icon
  };
})(window, document);
