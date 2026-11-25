/* ============================================================
   IN2090 guide · viz-er.js
   ER-diagram i kursets notasjon (Chen / Elmasri–Navathe) som SVG, fra data (plan/format.md § 4).

   IN.vizEr(host, fig, opts) → <svg>
     entitet      rektangel (dobbelt = svak entitet)
     relasjon     rombe (dobbel = identifiserende relasjon)
     attributt    oval: understreket = nøkkel, stiplet understrek = delvis nøkkel,
                  dobbel oval = flerverdi, stiplet oval = avledet, deler = sammensatt (egne ovaler ut fra den)
     ledd         1 / N / M ved romben, dobbel strek = total deltakelse, rolle som liten tekst
     isa          sirkel med d (disjunkt) / o (overlappende), dobbel strek opp = total spesialisering, ⊂ på strekene ned
   Plassering: pos = [kolonne, rad] i et rutenett (desimaler er lov). Attributtene legges i den
   største ledige vinkelen rundt noden. attr.ang (grader, 0 = høyre, 90 = ned) overstyrer.
   opts: { cell: [bredde, høyde] (standard [230, 160]), title: "tilgjengelig navn",
           bounds: [x, y, b, h] (fast viewBox, f.eks. fra IN.vizEr.bounds(ferdigFigur)),
           fit: true (skaleres til bredden av forelderen i stedet for vannrett skroll) }
   Farger fra temaet (viz.css: .er-*). Klassisk script, lastes etter core.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var NS = "http://www.w3.org/2000/svg";

  function s(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function textW(t, size) { return String(t).length * (size || 13) * 0.6; }

  IN.vizEr = function (host, fig, opts) {
    if (typeof host === "string") host = IN.qs(host);
    opts = opts || {};
    var cw = (opts.cell || [230, 160])[0], ch = (opts.cell || [230, 160])[1];
    var svg = s("svg", { class: "er-svg", role: "img", "aria-label": opts.title || "ER-diagram" });
    var gLines = s("g", { class: "er-lines" }), gShapes = s("g"), gLabels = s("g");
    svg.appendChild(gLines); svg.appendChild(gShapes); svg.appendChild(gLabels);
    var box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    function grow(x0, y0, x1, y1) { box.x0 = Math.min(box.x0, x0); box.y0 = Math.min(box.y0, y0); box.x1 = Math.max(box.x1, x1); box.y1 = Math.max(box.y1, y1); }

    var nodes = {};
    function center(pos) { return [pos[0] * cw + cw / 2, pos[1] * ch + ch / 2]; }
    (fig.entiteter || []).forEach(function (e) {
      var c = center(e.pos || [0, 0]), w = Math.max(96, textW(e.navn, 14) + 28), h = 42;
      nodes[e.id] = { kind: "e", d: e, x: c[0], y: c[1], w: w, h: h, dirs: [] };
    });
    (fig.relasjoner || []).forEach(function (r) {
      var c = center(r.pos || [0, 0]), w = Math.max(110, textW(r.navn, 12) + 46), h = 60;
      nodes[r.id] = { kind: "r", d: r, x: c[0], y: c[1], w: w, h: h, dirs: [] };
    });

    /* Kant fra midten av en node til randen i retning (dx, dy) */
    function edgePoint(n, dx, dy) {
      var len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len, t;
      if (n.kind === "r") t = 1 / (Math.abs(ux) / (n.w / 2) + Math.abs(uy) / (n.h / 2));
      else if (n.kind === "a") t = 1 / Math.sqrt((ux * ux) / ((n.w / 2) * (n.w / 2)) + (uy * uy) / ((n.h / 2) * (n.h / 2)));
      else if (n.kind === "c") t = n.r;
      else t = Math.min(Math.abs(ux) > 1e-6 ? (n.w / 2) / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-6 ? (n.h / 2) / Math.abs(uy) : Infinity);
      return [n.x + ux * t, n.y + uy * t];
    }
    function line(a, b, cls, dbl) {
      var p = edgePoint(a, b.x - a.x, b.y - a.y), q = edgePoint(b, a.x - b.x, a.y - b.y);
      if (!dbl) { gLines.appendChild(s("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: cls || "er-line" })); return [p, q]; }
      var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1, ox = -dy / L * 2.4, oy = dx / L * 2.4;
      [1, -1].forEach(function (k) { gLines.appendChild(s("line", { x1: p[0] + k * ox, y1: p[1] + k * oy, x2: q[0] + k * ox, y2: q[1] + k * oy, class: cls || "er-line" })); });
      return [p, q];
    }
    function ang(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }

    /* Relasjonsledd */
    (fig.relasjoner || []).forEach(function (r) {
      var rn = nodes[r.id];
      (r.ledd || []).forEach(function (l, li) {
        var en = nodes[l.entitet]; if (!en) return;
        // Rekursiv relasjon (samme entitet to ganger): bøy streken litt ut
        var same = (r.ledd || []).filter(function (x) { return x.entitet === l.entitet; }).length > 1;
        var target = en, source = rn, side = 1;
        if (same) {
          // Begge ender forskyves (entiteten ±26, romben ±14) så de to strekene og tallene skilles
          var off = li % 2 ? 26 : -26, dx = en.x - rn.x, dy = en.y - rn.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
          target = { kind: "e", x: en.x - dy / L * off, y: en.y + dx / L * off, w: en.w, h: en.h };
          source = { kind: "r", x: rn.x - dy / L * off * 0.55, y: rn.y + dx / L * off * 0.55, w: rn.w, h: rn.h };
          side = off > 0 ? 1 : -1;
        }
        var pq = line(source, target, "er-line", !!l.total);
        rn.dirs.push(ang(rn, target)); en.dirs.push(ang(en, rn));
        var p = pq[0], q = pq[1], dx2 = q[0] - p[0], dy2 = q[1] - p[1], L2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
        var nx = -dy2 / L2 * side, ny = dx2 / L2 * side;
        if (l.kard) {
          var t = Math.min(22, L2 * 0.35), kx = p[0] + dx2 / L2 * t + nx * 10, ky = p[1] + dy2 / L2 * t + ny * 10;
          gLabels.appendChild(s("text", { x: kx, y: ky + 4, class: "er-kard", "text-anchor": "middle" }, l.kard));
        }
        if (l.rolle) {
          var mx = (p[0] + q[0]) / 2 - nx * 11, my = (p[1] + q[1]) / 2 - ny * 11;
          gLabels.appendChild(s("text", { x: mx, y: my + 4, class: "er-rolle", "text-anchor": "middle" }, l.rolle));
        }
      });
    });

    /* ISA */
    (fig.isa || []).forEach(function (isa, i) {
      var sup = nodes[isa.super]; if (!sup) return;
      var subs = (isa.sub || []).map(function (id) { return nodes[id]; }).filter(Boolean);
      if (!subs.length) return;
      var ax = subs.reduce(function (a, n) { return a + n.x; }, 0) / subs.length, ay = subs.reduce(function (a, n) { return a + n.y; }, 0) / subs.length;
      var c = isa.pos ? center(isa.pos) : [(sup.x + ax) / 2, (sup.y + ay) / 2];
      var cn = { kind: "c", x: c[0], y: c[1], r: 13 };
      line(sup, cn, "er-line", !!isa.total);
      sup.dirs.push(ang(sup, cn));
      subs.forEach(function (sn) {
        var pq = line(cn, sn, "er-line", false);
        sn.dirs.push(ang(sn, cn));
        var mx = (pq[0][0] + pq[1][0]) / 2, my = (pq[0][1] + pq[1][1]) / 2, deg = Math.atan2(pq[1][1] - pq[0][1], pq[1][0] - pq[0][0]) * 180 / Math.PI;
        // ⊂ åpner seg mot underklassen
        gLabels.appendChild(s("text", { x: mx, y: my + 5, class: "er-subset", "text-anchor": "middle", transform: "rotate(" + (deg + 180) + " " + mx + " " + my + ")" }, "⊂"));
      });
      gShapes.appendChild(s("circle", { cx: c[0], cy: c[1], r: 13, class: "er-isa" }));
      var mark = isa.disjunkt === true ? "d" : isa.disjunkt === false ? "o" : "";
      if (mark) gLabels.appendChild(s("text", { x: c[0], y: c[1] + 5, class: "er-isa-t", "text-anchor": "middle" }, mark));
      grow(c[0] - 14, c[1] - 14, c[0] + 14, c[1] + 14);
    });

    /* Attributter i den største ledige vinkelen */
    function freeAngles(dirs, n) {
      if (!n) return [];
      var TAU = Math.PI * 2;
      if (!dirs.length) { var st = -Math.PI / 2; return range(n).map(function (i) { return st + TAU * i / n; }); }
      var ds = dirs.map(function (a) { return (a + TAU) % TAU; }).sort(function (a, b) { return a - b; });
      // Fordel attributtene på gapene etter størrelse
      var gaps = ds.map(function (a, i) { var b = i + 1 < ds.length ? ds[i + 1] : ds[0] + TAU; return { a: a, b: b, len: b - a, k: 0 }; });
      for (var j = 0; j < n; j++) {
        gaps.sort(function (x, y) { return y.len / (y.k + 1) - x.len / (x.k + 1); });
        gaps[0].k++;
      }
      var out = [];
      gaps.forEach(function (g) { for (var m = 1; m <= g.k; m++) out.push(g.a + g.len * m / (g.k + 1)); });
      return out;
    }
    function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

    function drawAttr(a, x, y, parent) {
      var w = Math.max(54, textW(a.navn, 12) + 22), h = 28;
      var an = { kind: "a", x: x, y: y, w: w, h: h };
      line(parent, an, "er-line", false);
      var cls = "er-attr" + (a.avledet ? " er-derived" : "");
      gShapes.appendChild(s("ellipse", { cx: x, cy: y, rx: w / 2, ry: h / 2, class: cls }));
      if (a.flerverdi) gShapes.appendChild(s("ellipse", { cx: x, cy: y, rx: w / 2 - 3.5, ry: h / 2 - 3.5, class: cls + " er-inner" }));
      var t = s("text", { x: x, y: y + 4, class: "er-attr-t" + (a.nokkel ? " er-key" : "") + (a.delvisNokkel ? " er-pkey" : ""), "text-anchor": "middle" }, a.navn);
      gLabels.appendChild(t);
      if (a.delvisNokkel) {
        var tw = textW(a.navn, 12);
        gLabels.appendChild(s("line", { x1: x - tw / 2, y1: y + 7, x2: x + tw / 2, y2: y + 7, class: "er-pkey-u" }));
      }
      grow(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
      return an;
    }
    function placeAttrs(n, attrs) {
      if (!attrs || !attrs.length) return;
      var auto = attrs.filter(function (a) { return a.ang == null; });
      var angles = freeAngles(n.dirs, auto.length), ai = 0;
      attrs.forEach(function (a, idx) {
        var th = a.ang != null ? a.ang * Math.PI / 180 : angles[ai++];
        var rx = n.w / 2 + 58, ry = n.h / 2 + 38;
        // Annenhver attributt litt lenger ut når det er mange
        if (attrs.length > 5 && idx % 2) { rx += 26; ry += 18; }
        var x = n.x + Math.cos(th) * rx, y = n.y + Math.sin(th) * ry;
        var an = drawAttr(a, x, y, n);
        if (a.deler && a.deler.length) {
          // Delene på en rad på tvers av retningen ut fra forelderen. Avstanden velges etter ovalenes
          // bredde (vannrett) og høyde (loddrett), så de ikke dekker hverandre uansett retning.
          var k = a.deler.length, maxW = 0, H = 28;
          a.deler.forEach(function (sub) { maxW = Math.max(maxW, Math.max(54, textW(sub.navn, 12) + 22)); });
          var ux = Math.cos(th), uy = Math.sin(th), px = -uy, py = ux;
          var dist = Math.min(Math.abs(ux) > 1e-3 ? ((an.w + maxW) / 2 + 22) / Math.abs(ux) : Infinity,
                              Math.abs(uy) > 1e-3 ? (H + 30) / Math.abs(uy) : Infinity);
          var gap = Math.min(Math.abs(px) > 1e-3 ? (maxW + 10) / Math.abs(px) : Infinity,
                             Math.abs(py) > 1e-3 ? (H + 10) / Math.abs(py) : Infinity);
          a.deler.forEach(function (sub, si) {
            var o = (si - (k - 1) / 2) * gap, back = Math.abs(si - (k - 1) / 2) * 6;
            drawAttr(sub, x + ux * (dist - back) + px * o, y + uy * (dist - back) + py * o, an);
          });
        }
      });
    }

    /* Tegn nodene */
    Object.keys(nodes).forEach(function (id) {
      var n = nodes[id], d = n.d;
      if (n.kind === "e") {
        gShapes.appendChild(s("rect", { x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h, class: "er-ent" }));
        if (d.svak) gShapes.appendChild(s("rect", { x: n.x - n.w / 2 + 4, y: n.y - n.h / 2 + 4, width: n.w - 8, height: n.h - 8, class: "er-ent er-inner" }));
        gLabels.appendChild(s("text", { x: n.x, y: n.y + 5, class: "er-ent-t", "text-anchor": "middle" }, d.navn));
      } else {
        var pts = function (k) { return [[n.x, n.y - n.h / 2 + k], [n.x + n.w / 2 - k * 1.8, n.y], [n.x, n.y + n.h / 2 - k], [n.x - n.w / 2 + k * 1.8, n.y]].map(function (p) { return p.join(","); }).join(" "); };
        gShapes.appendChild(s("polygon", { points: pts(0), class: "er-rel" }));
        if (d.identifiserende) gShapes.appendChild(s("polygon", { points: pts(5), class: "er-rel er-inner" }));
        gLabels.appendChild(s("text", { x: n.x, y: n.y + 4, class: "er-rel-t", "text-anchor": "middle" }, d.navn));
      }
      grow(n.x - n.w / 2, n.y - n.h / 2, n.x + n.w / 2, n.y + n.h / 2);
    });
    Object.keys(nodes).forEach(function (id) { placeAttrs(nodes[id], nodes[id].d.attr); });

    if (!isFinite(box.x0)) { box = { x0: 0, y0: 0, x1: 100, y1: 40 }; }
    var pad = 12, vb = [box.x0 - pad, box.y0 - pad, box.x1 - box.x0 + pad * 2, box.y1 - box.y0 + pad * 2].map(function (v) { return Math.round(v); });
    svg._bounds = vb;
    if (!host) return svg;   // brukt av IN.vizEr.bounds
    if (opts.bounds) vb = opts.bounds;
    svg.setAttribute("viewBox", vb.join(" "));
    if (opts.fit) svg.setAttribute("width", "100%");   // skaleres ned til bredden av forelderen
    else svg.setAttribute("width", vb[2]);
    svg.style.maxWidth = vb[2] + "px";
    var wrap = IN.el("div", { class: "er-wrap" + (opts.fit ? " er-fit" : "") });
    wrap.appendChild(svg);
    host.appendChild(wrap);
    return svg;
  };

  /* Fast ramme for steg-for-steg-visning: tegn den ferdige figuren én gang og bruk rammen på alle steg.
     var b = IN.vizEr.bounds(figFerdig);  …  IN.vizEr(host, figSteg, { bounds: b, fit: true }) */
  IN.vizEr.bounds = function (fig, opts) { return IN.vizEr(null, fig, opts)._bounds; };

  if (IN.registerEngine) IN.registerEngine("er", { viz: "vizEr", file: "assets/js/viz-er.js", host: "er-host", customInput: false });
})();
