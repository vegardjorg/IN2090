/* ============================================================
   IN2090 guide · data-fd.js
   Blokk 6 (FD) og blokk 7 (normalisering): FD-motor, demoer og øving.

   IN.fd      Ren motor uten DOM: parsing, tillukning X⁺, kandidatnøkler
              (alltid / aldri / kanskje med), normalform per FD, BCNF-dekomposisjon
              (S₁(Y⁺), S₂(Y ∪ (X − Y⁺))), instanssjekk, utfylling av «?», projeksjon
              og naturlig join, og svarmaler i eksamensformat.
   IN.fdDemo  Stegspillere og små verktøy for sidene 06-fd.html og 07-normalisering.html.
   IN.dataFd / IN.dataNorm  Flervalg per fane og sant/usant for hver side.

   Alt innhold er skrevet med egne ord (plan/innhold/06-fd.md og 07-normalisering.md).
   Notasjon etter plan/vranglaere.md: X⁺, «tillukning», SN/KN, nøkkelattributt.
   Klassisk script. Lastes etter core.js, pseudocode.js, stepplayer.js og viz-relation.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var F = (IN.fd = IN.fd || {});

  /* ================================================================
     1. Mengder og formatering
     ================================================================ */
  function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
  function has(a, x) { return a.indexOf(x) >= 0; }
  function uniq(a) { var o = []; a.forEach(function (x) { if (!has(o, x)) o.push(x); }); return o; }
  function union(a, b) { return uniq(a.concat(b)); }
  function minus(a, b) { return a.filter(function (x) { return !has(b, x); }); }
  function inter(a, b) { return a.filter(function (x) { return has(b, x); }); }
  function subset(a, b) { for (var i = 0; i < a.length; i++) if (!has(b, a[i])) return false; return true; }
  function eqSet(a, b) { a = uniq(a); b = uniq(b); return a.length === b.length && subset(a, b); }
  function proper(a, b) { return subset(a, b) && uniq(a).length < uniq(b).length; }
  function order(a, ref) {
    var r = uniq(a);
    r.sort(function (x, y) {
      var i = ref.indexOf(x), j = ref.indexOf(y);
      return (i < 0 ? 1e9 : i) - (j < 0 ? 1e9 : j);
    });
    return r;
  }
  function flat(aa) { var o = []; aa.forEach(function (a) { o = o.concat(a); }); return o; }
  function combos(arr, k) {
    var out = [];
    (function rec(start, acc) {
      if (acc.length === k) { out.push(acc.slice()); return; }
      for (var i = start; i < arr.length; i++) { acc.push(arr[i]); rec(i + 1, acc); acc.pop(); }
    })(0, []);
    return out;
  }
  function subsetsBySize(arr) {          // alle delmengder, minste først (∅ først)
    var out = [];
    for (var k = 0; k <= arr.length; k++) out = out.concat(combos(arr, k));
    return out;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function isLetters(a) { return a.length > 0 && a.every(function (x) { return x.length === 1; }); }
  function side(a) { return isLetters(a) ? a.join("") : a.join(", "); }
  function fdText(fd) { return side(fd.lhs) + " → " + side(fd.rhs); }
  function setText(a) { return a && a.length ? "{" + a.join(", ") + "}" : "∅"; }
  function plusName(X) {
    if (!X.length) return "∅⁺";
    if (X.length === 1) return X[0] + "⁺";
    return isLetters(X) ? "(" + X.join("") + ")⁺" : "{" + X.join(", ") + "}⁺";
  }
  function relText(navn, a) { return navn + "(" + a.join(", ") + ")"; }
  function grouped(fdl) {               // slå sammen splittede FD-er med lik venstreside
    var g = [];
    fdl.forEach(function (f) {
      var hit = null;
      for (var i = 0; i < g.length; i++) if (eqSet(g[i].lhs, f.lhs)) { hit = g[i]; break; }
      if (hit) hit.rhs = union(hit.rhs, f.rhs); else g.push({ lhs: f.lhs.slice(), rhs: f.rhs.slice() });
    });
    return g.map(fdText).join(", ");
  }
  function knList(K) { return K.length ? K.map(setText).join(", ") : "ingen"; }
  function listText(a) { return a.length ? a.join(", ") : "ingen"; }

  F.util = { has: has, uniq: uniq, union: union, minus: minus, inter: inter, subset: subset, eqSet: eqSet,
    proper: proper, order: order, combos: combos, esc: esc, side: side, fdText: fdText, setText: setText,
    plusName: plusName, relText: relText, grouped: grouped, knList: knList };

  /* ================================================================
     2. Parsing
     ================================================================ */
  function parseSide(s) {
    s = trim(String(s).replace(/[{}()]/g, " "));
    if (!s) return [];
    if (s.indexOf(",") >= 0) return uniq(s.split(",").map(trim).filter(Boolean));
    var t = s.replace(/\s+/g, "");
    if (/^[A-ZÆØÅ]+$/.test(t)) return uniq(t.split(""));
    return uniq(s.split(/\s+/));
  }
  function parseFD(s) {
    s = trim(s);
    var id = null, m = /^(FD\d+)\s*:?\s+/.exec(s);
    if (m) { id = m[1]; s = s.slice(m[0].length); }
    var p = s.split(/\s*(?:→|->)\s*/);
    if (p.length !== 2) return null;
    var l = parseSide(p[0]), r = parseSide(p[1]);
    if (!l.length || !r.length) return null;
    return { id: id, lhs: l, rhs: r };
  }
  function mkRel(navn, attrs, fdl) {
    var a = typeof attrs === "string" ? parseSide(attrs) : attrs.slice();
    return { navn: navn, attrs: a, fds: fdl.map(function (x) { return typeof x === "string" ? parseFD(x) : x; }) };
  }
  F.parseSide = parseSide; F.parseFD = parseFD; F.rel = mkRel;

  /* Egen input: «ABCDE; A->B, BC->D; X=AC».
     Bokstaver: FD-ene skilles med komma. Lange navn: «billettnr, konsert, sete; billettnr -> konsert | konsert, sete -> billettnr».
     Tillegg: X=…, KN=… (flere skilles med komma for bokstaver, | for navn), velg=Y->A. */
  F.parseSpec = function (str) {
    var parts = String(str || "").split(";").map(trim).filter(Boolean);
    if (!parts.length) return { error: "Skriv relasjonen først, for eksempel <span class=\"mono\">ABCDE; A->B, BC->D</span>." };
    var head = parts[0], navn = "R", m = /^([A-Za-zÆØÅæøå_][A-Za-z0-9ÆØÅæøå_]*)\s*\((.*)\)\s*$/.exec(head);
    if (m) { navn = m[1]; head = m[2]; }
    var attrs = parseSide(head);
    if (!attrs.length) return { error: "Fant ingen attributter i «" + esc(parts[0]) + "»." };
    if (attrs.length > 10) return { error: "Høyst 10 attributter i demoen (du skrev " + attrs.length + ")." };
    var letters = isLetters(attrs), out = { navn: navn, attrs: attrs, fds: [], opt: {} };
    for (var i = 1; i < parts.length; i++) {
      var p = parts[i], mo = /^(X|KN|velg)\s*=\s*(.*)$/i.exec(p);
      if (mo) { out.opt[mo[1].toLowerCase()] = mo[2]; continue; }
      var pieces = letters ? p.replace(/\s+/g, "").split(",") : p.split("|");
      for (var j = 0; j < pieces.length; j++) {
        var pc = trim(pieces[j]);
        if (!pc) continue;
        var fd = parseFD(pc);
        if (!fd) return { error: "Forstår ikke FD-en «" + esc(pc) + "». Skriv for eksempel <span class=\"mono\">AB->C</span>." };
        var ukjent = minus(fd.lhs.concat(fd.rhs), attrs);
        if (ukjent.length) return { error: "«" + esc(ukjent.join(", ")) + "» er ikke et attributt i " + esc(navn) + "." };
        out.fds.push(fd);
      }
    }
    if (!out.fds.length) return { error: "Fant ingen FD-er. Skriv dem etter semikolon: <span class=\"mono\">ABCDE; A->B, BC->D</span>." };
    if (out.opt.x != null) {
      out.X = parseSide(out.opt.x);
      var uk = minus(out.X, attrs);
      if (!out.X.length || uk.length) return { error: "X må være attributter i " + esc(navn) + ", for eksempel <span class=\"mono\">X=AC</span>." };
    }
    if (out.opt.kn != null) {
      var ks = letters ? out.opt.kn.replace(/\s+/g, "").split(",") : out.opt.kn.split("|");
      out.kn = ks.map(parseSide).filter(function (k) { return k.length; });
      for (var q = 0; q < out.kn.length; q++) if (minus(out.kn[q], attrs).length) return { error: "KN må bestå av attributter i " + esc(navn) + "." };
    }
    if (out.opt.velg != null) {
      out.velg = parseFD(out.opt.velg);
      if (!out.velg) return { error: "velg= må være en FD, for eksempel <span class=\"mono\">velg=D->E</span>." };
    }
    out.rel = { navn: navn, attrs: attrs, fds: out.fds };
    return out;
  };

  /* ================================================================
     3. Tillukning, splitting og nøkler
     ================================================================ */
  /* Tillukning: start med X. Bruk den første FD-en i lista som gir noe nytt, og begynn så på toppen igjen.
     prefer (valgfri) = FD-indekser som prøves først, i den rekkefølgen (for å følge en håndregnet rekkefølge). */
  F.closure = function (X, fdl, prefer) {
    var plus = uniq(X.slice()), steps = [];
    function ok(f) { return f && subset(f.lhs, plus) && !subset(f.rhs, plus); }
    for (var guard = 0; guard < 200; guard++) {
      var fired = -1, p, i;
      if (prefer) for (p = 0; p < prefer.length; p++) if (ok(fdl[prefer[p]])) { fired = prefer[p]; break; }
      if (fired < 0) for (i = 0; i < fdl.length; i++) if (ok(fdl[i])) { fired = i; break; }
      if (fired < 0) break;
      var add = minus(fdl[fired].rhs, plus);
      steps.push({ i: fired, fd: fdl[fired], added: add, before: plus.slice(), after: plus.concat(add) });
      plus = plus.concat(add);
    }
    return { plus: plus, steps: steps };
  };
  F.isSN = function (X, attrs, fdl) { return subset(attrs, F.closure(X, fdl).plus); };

  /* Splitt høyresidene til ett attributt og fjern trivielle deler (A ∈ X). */
  F.split = function (fdl) {
    var out = [];
    fdl.forEach(function (f, fi) {
      f.rhs.forEach(function (a) {
        if (has(f.lhs, a)) return;
        for (var i = 0; i < out.length; i++) if (out[i].rhs[0] === a && eqSet(out[i].lhs, f.lhs)) return;
        out.push({ id: f.id, lhs: f.lhs.slice(), rhs: [a], src: fi });
      });
    });
    return out;
  };

  /* Kursets grupper: alltid med (aldri til høyre), aldri med (bare til høyre), kanskje med (resten). */
  F.classify = function (attrs, fdl) {
    var s = F.split(fdl), L = [], H = [];
    s.forEach(function (f) { L = union(L, f.lhs); H = union(H, f.rhs); });
    return {
      alltid: attrs.filter(function (a) { return !has(H, a); }),
      aldri: attrs.filter(function (a) { return has(H, a) && !has(L, a); }),
      kanskje: attrs.filter(function (a) { return has(H, a) && has(L, a); })
    };
  };

  function minimalText(X, attrs, fdl) {
    if (X.length === 1) return "Ett attributt kan ikke gjøres mindre, så " + setText(X) + " er minimal.";
    var parts = X.map(function (a) {
      var Y = minus(X, [a]);
      return plusName(Y) + " = " + setText(order(F.closure(Y, fdl).plus, attrs));
    });
    return "Minimal: " + parts.join(", ") + ". Ingen av dem er hele relasjonen.";
  }

  /* Alle kandidatnøkler med kursets metode. Stegene har line = linje i pseudokoden FinnKN. */
  F.keys = function (attrs, fdl) {
    var c = F.classify(attrs, fdl), M = c.kanskje, kn = [], steps = [];
    steps.push({ type: "klass", line: 4 });
    for (var k = 0; k <= M.length; k++) {
      var cs = combos(M, k), skipped = [], tests = [];
      cs.forEach(function (S) {
        var X = order(c.alltid.concat(S), attrs);
        var hit = kn.filter(function (K) { return subset(K, X); })[0];
        if (hit) skipped.push({ X: X, K: hit }); else tests.push(X);
      });
      if (skipped.length) steps.push({ type: "skip", k: k, list: skipped, line: 9 });
      tests.forEach(function (X) {
        var pl = order(F.closure(X, fdl).plus, attrs), sn = subset(attrs, pl);
        if (sn) kn.push(X);
        steps.push({ type: "test", k: k, X: X, plus: pl, status: sn ? "KN" : "ikke SN", line: 10 });
      });
      if (k === 0 && kn.length) break;          // «alltid med» er SN: eneste KN
      if (cs.length && !tests.length) break;     // hele nivået er hoppet over: større mengder også
    }
    steps.push({ type: "done", line: 11 });
    var na = order(flat(kn), attrs);
    return { kn: kn, alltid: c.alltid, aldri: c.aldri, kanskje: c.kanskje, nokkelattr: na, ikke: minus(attrs, na), steps: steps };
  };

  /* ================================================================
     4. Normalform per FD
     ================================================================ */
  var RANK = { BCNF: 4, "3NF": 3, "2NF": 2, "1NF": 1 };
  F.RANK = RANK;
  /* opts.kn = oppgitte KN (H24-formatet «FD-en alene»): SN betyr da at X inneholder en KN. */
  F.nf = function (attrs, fdl, opts) {
    opts = opts || {};
    var s = F.split(fdl), gitt = !!(opts.kn && opts.kn.length);
    var K = gitt ? opts.kn.map(function (k) { return order(k, attrs); }) : F.keys(attrs, fdl).kn;
    var na = order(flat(K), attrs), rows = [];
    s.forEach(function (f) {
      var X = f.lhs, A = f.rhs[0], row = { fd: f, X: X, A: A, plus: null, nokkel: null, del: null, delKN: null };
      if (gitt) row.sn = K.some(function (k) { return subset(k, X); });
      else { row.plus = order(F.closure(X, fdl).plus, attrs); row.sn = subset(attrs, row.plus); }
      if (row.sn) row.nf = "BCNF";
      else {
        row.nokkel = has(na, A);
        if (row.nokkel) row.nf = "3NF";
        else {
          row.delKN = K.filter(function (k) { return proper(X, k); })[0] || null;
          row.del = !!row.delKN;
          row.nf = row.del ? "1NF" : "2NF";
        }
      }
      rows.push(row);
    });
    var low = "BCNF", lowRow = null;
    rows.forEach(function (r) { if (RANK[r.nf] < RANK[low]) { low = r.nf; lowRow = r; } });
    return { attrs: attrs, kn: K, gitt: gitt, nokkelattr: na, ikke: minus(attrs, na), rows: rows, nf: low, svakest: lowRow };
  };

  /* ================================================================
     5. BCNF-dekomposisjon (kursets algoritme)
     ================================================================ */
  /* opts: { prefix: "S", navn: { "1": "Konsert", "21": "Kjøper", … }, velg: { "": "C -> D" } }
     Hver delrelasjon får de oppgitte (splittede) FD-ene som ligger helt inne i den.
     projOK = samme KN og samme BCNF-svar som en full projeksjon av FD-ene (kontroll). */
  F.bcnf = function (navn, attrs, fdl, opts) {
    opts = opts || {};
    var S = F.split(fdl), prefix = opts.prefix || "S", names = opts.navn || {}, velg = opts.velg || {}, nodes = [];
    function build(path, X, parent) {
      var mine = S.filter(function (f) { return subset(f.lhs, X) && subset(f.rhs, X); });
      var ks = F.keys(X, mine);
      var node = { path: path, navn: path === "" ? navn : (names[path] || prefix + path), attrs: X, fds: mine,
        kn: ks.kn, idx: nodes.length, parent: parent, children: [] };
      node.borte = parent ? parent.fds.filter(function (f) { return !has(mine, f); }) : [];
      nodes.push(node);
      node.brudd = mine.filter(function (f) { return !subset(X, F.closure(f.lhs, mine).plus); });
      projCheck(node, S);
      if (node.brudd.length) {
        var v = node.brudd[0], want = velg[path] ? (typeof velg[path] === "string" ? parseFD(velg[path]) : velg[path]) : null;
        if (want) {
          var w = node.brudd.filter(function (f) { return eqSet(f.lhs, want.lhs) && has(want.rhs, f.rhs[0]); })[0];
          if (w) v = w;
        }
        node.valgt = v; node.Y = v.lhs;
        node.Yplus = order(F.closure(v.lhs, mine).plus, X);
        var s1 = node.Yplus, s2 = order(union(v.lhs, minus(X, node.Yplus)), X);
        node.children = [build(path + "1", s1, node), build(path + "2", s2, node)];
      }
      return node;
    }
    var root = build("", order(attrs, attrs), null);
    var leaves = nodes.filter(function (n) { return !n.children.length; });
    return {
      root: root, nodes: nodes, leaves: leaves,
      resultat: navn + " ⟶ {" + leaves.map(function (n) { return relText(n.navn, n.attrs); }).join(", ") + "}",
      projOK: nodes.every(function (n) { return n.projOK; })
    };
  };
  function projCheck(node, allFds) {
    var X = node.attrs, subs = subsetsBySize(X).filter(function (Y) { return Y.length; });
    var trueKN = [], hidden = false;
    subs.forEach(function (Y) {
      var c = inter(F.closure(Y, allFds).plus, X);
      var sn = subset(X, c);
      if (sn && !trueKN.some(function (K) { return subset(K, Y); })) trueKN.push(Y);
      if (!sn && minus(c, Y).length) hidden = true;
    });
    var sameKN = trueKN.length === node.kn.length && trueKN.every(function (K) {
      return node.kn.some(function (k) { return eqSet(k, K); });
    });
    node.fullKN = trueKN;
    node.projOK = sameKN && (hidden === (node.brudd.length > 0));
  }

  /* ================================================================
     6. Instanser: sjekk FD-er og fyll inn «?»
     ================================================================ */
  function isNull(v) { return v === null || v === undefined || v === "NULL"; }
  F.checkInstance = function (cols, rows, fdl) {
    var res = fdl.map(function (f) {
      var li = f.lhs.map(function (a) { return cols.indexOf(a); }), ri = f.rhs.map(function (a) { return cols.indexOf(a); });
      var groups = {}, keys = [];
      rows.forEach(function (r, i) {
        if (li.some(function (j) { return isNull(r[j]); })) return;
        var key = li.map(function (j) { return String(r[j]); }).join("\u0001");
        if (!groups[key]) { groups[key] = []; keys.push(key); }
        groups[key].push(i);
      });
      var brudd = [];
      keys.forEach(function (key) {
        var g = groups[key];
        for (var a = 0; a < g.length; a++) for (var b = a + 1; b < g.length; b++) {
          ri.forEach(function (rj) {
            var va = rows[g[a]][rj], vb = rows[g[b]][rj];
            if (isNull(va) || isNull(vb) || String(va) !== String(vb))
              brudd.push({ rader: [g[a], g[b]], kol: cols[rj], ki: rj, verdier: [va, vb], gruppe: key.split("\u0001").join(", ") });
          });
        }
      });
      return {
        fd: f, brudd: brudd, ok: !brudd.length,
        grupper: keys.map(function (k) { return { verdi: k.split("\u0001").join(", "), rader: groups[k] }; })
      };
    });
    return { fd: res, ok: res.every(function (r) { return r.ok; }) };
  };

  F.fill = function (cols, rows, fdl) {
    var S = F.split(fdl), R = rows.map(function (r) { return r.slice(); }), steps = [];
    function isQ(v) { return v === "?"; }
    var changed = true;
    while (changed) {
      changed = false;
      for (var i = 0; i < R.length; i++) for (var c = 0; c < cols.length; c++) {
        if (!isQ(R[i][c])) continue;
        for (var fi = 0; fi < S.length; fi++) {
          var f = S[fi];
          if (f.rhs[0] !== cols[c]) continue;
          var li = f.lhs.map(function (a) { return cols.indexOf(a); });
          if (li.some(function (j) { return isQ(R[i][j]); })) continue;
          var match = [];
          for (var j = 0; j < R.length; j++) {
            if (j === i || isQ(R[j][c])) continue;
            if (li.every(function (x) { return !isQ(R[j][x]) && String(R[j][x]) === String(R[i][x]); })) match.push(j);
          }
          if (!match.length) continue;
          var v = R[match[0]][c];
          R[i][c] = v;
          steps.push({ rad: i, kol: c, fd: f, match: match, verdi: v, rader: R.map(function (r) { return r.slice(); }) });
          changed = true;
          break;
        }
      }
    }
    var rest = 0;
    R.forEach(function (r) { r.forEach(function (v) { if (isQ(v)) rest++; }); });
    return { rows: R, steps: steps, check: F.checkInstance(cols, R, fdl), rest: rest };
  };

  F.project = function (t, keep) {
    var idx = keep.map(function (k) { return t.kolonner.indexOf(k); }), seen = {}, rader = [];
    t.rader.forEach(function (r) {
      var row = idx.map(function (i) { return r[i]; }), key = JSON.stringify(row);
      if (!seen[key]) { seen[key] = 1; rader.push(row); }
    });
    return { kolonner: keep.slice(), rader: rader };
  };
  F.njoin = function (a, b) {
    var common = inter(a.kolonner, b.kolonner), extra = minus(b.kolonner, a.kolonner), rader = [];
    a.rader.forEach(function (ra) {
      b.rader.forEach(function (rb) {
        var ok = common.every(function (c) { return String(ra[a.kolonner.indexOf(c)]) === String(rb[b.kolonner.indexOf(c)]); });
        if (ok) rader.push(ra.concat(extra.map(function (c) { return rb[b.kolonner.indexOf(c)]; })));
      });
    });
    return { kolonner: a.kolonner.concat(extra), rader: rader };
  };

  /* ================================================================
     7. Svarmaler (ren tekst i eksamensformat)
     ================================================================ */
  F.svarNF = function (rel, opts) {
    var r = F.nf(rel.attrs, rel.fds, opts), L = [];
    L.push(relText(rel.navn, rel.attrs) + ", FD: " + rel.fds.map(fdText).join(", ") + ".");
    if (r.gitt) L.push("KN (oppgitt): " + knList(r.kn) + ".");
    else {
      var k = F.keys(rel.attrs, rel.fds);
      L.push("Alltid med: " + listText(k.alltid) + ". Aldri med: " + listText(k.aldri) + ". Kanskje med: " + listText(k.kanskje) + ".");
      L.push("KN: " + knList(r.kn) + " (hver har tillukning lik hele " + rel.navn + " og er minimal).");
    }
    L.push("Nøkkelattributter: " + listText(r.nokkelattr) + ".  Ikke-nøkkelattributter: " + listText(r.ikke) + ".");
    L.push("");
    r.rows.forEach(function (w) {
      L.push("FD " + fdText(w.fd) + ":");
      if (w.sn) {
        L.push("  " + side(w.X) + " er SN" + (r.gitt ? " (inneholder en KN)" : " fordi " + plusName(w.X) + " = " + setText(w.plus)) + "  → ikke brudd på BCNF");
      } else {
        L.push("  " + side(w.X) + " er ikke SN" + (r.gitt ? " (inneholder ingen KN)" : " fordi " + plusName(w.X) + " = " + setText(w.plus)) + "  → brudd på BCNF");
        L.push("  " + w.A + (w.nokkel ? " er nøkkelattributt  → ikke brudd på 3NF" : " er ikke nøkkelattributt  → brudd på 3NF"));
        if (!w.nokkel) L.push("  " + side(w.X) + (w.del ? " er en ekte del av KN-en " + setText(w.delKN) + "  → brudd på 2NF" : " er ikke en ekte del av noen KN  → ikke brudd på 2NF"));
      }
      L.push("  ⇒ FD-en gir " + w.nf);
    });
    L.push("");
    L.push(rel.navn + " er på den laveste av disse: " + r.nf + (r.svakest ? " (på grunn av " + fdText(r.svakest.fd) + ")." : "."));
    return L.join("\n");
  };
  F.svarBCNF = function (rel, opts) {
    var res = F.bcnf(rel.navn, rel.attrs, rel.fds, opts), L = [];
    function pad(s, n) { while (s.length < n) s += " "; return s; }
    function line(n) {
      return "  " + pad(relText(n.navn, n.attrs), 22) + " FD: " + pad(grouped(n.fds) || "ingen", 18) + " KN: " + knList(n.kn) +
        (n.children.length ? "" : "  BCNF");
    }
    L.push(relText(rel.navn, rel.attrs) + ", FD: " + rel.fds.map(fdText).join(", ") + ". KN: " + knList(res.root.kn) + ".");
    if (!res.root.children.length) {
      L.push("Alle venstresider er supernøkler, så " + rel.navn + " er allerede på BCNF.");
      return L.join("\n");
    }
    res.nodes.forEach(function (n) {
      if (!n.children.length) return;
      L.push("");
      L.push((n.parent ? n.navn + ": " : "") + fdText(n.valgt) + " bryter BCNF fordi " + plusName(n.Y) + " = " + setText(n.Yplus) +
        " ≠ " + (n.parent ? n.navn : rel.navn) + ". Dekomponerer på " + fdText(n.valgt) + ":");
      n.children.forEach(function (c) { L.push(line(c)); });
    });
    L.push("");
    L.push("Resultat: " + res.resultat + ".");
    L.push("Hvert steg er tapsfritt etter Fagins teorem: venstresiden Y er felles og bestemmer hele S₁ (Y → Y⁺).");
    return L.join("\n");
  };

  /* ================================================================
     8. Eksempler (alle fra innholdsfilene eller eksamensbanken)
     ================================================================ */
  var BILLETT = mkRel("Billett", ["billettnr", "konsert", "sete", "kjøper", "epost", "artist", "scene", "dato"], [
    "FD1 billettnr → konsert, sete, kjøper",
    "FD2 konsert → artist, scene, dato",
    "FD3 scene, dato → konsert",
    "FD4 konsert, sete → billettnr",
    "FD5 kjøper → epost"
  ]);
  var EX = (F.EX = {
    billett: BILLETT,
    tillEks2: mkRel("R", "ABCDEF", ["AB → C", "C → D", "D → B", "A → E", "E → F"]),
    quizTill: mkRel("R", "ABCDE", ["A → C", "C → D", "BD → E"]),
    quizKN: mkRel("R", "ABCD", ["A → B", "BC → D", "D → A"]),
    h2019_31: mkRel("R", "ABCDEFG", ["A → C", "C → B, D", "A, B → D, F", "B, E → G"]),
    knEks1: mkRel("R", "ABCDE", ["A → B", "B → A", "AC → D", "D → E"]),
    h2020_R1: mkRel("R", "ABCD", ["A → BC", "BC → A", "D → B", "B → D"]),
    h2023_31: mkRel("R", "ABCDE", ["A → B", "B → C", "C → A", "C → D"]),
    h2024_31: mkRel("R", "ABCDEF", ["AC → CE", "B → F", "D → B", "DE → A"]),
    h2025: mkRel("R", "ABCD", ["A → B", "B → C"]),
    trening: mkRel("Trening", ["utøver", "øvelse", "trener"], ["utøver, øvelse → trener", "trener → øvelse"]),
    // KN = {A, B} (A og B står aldri til høyre, AB⁺ = ABCDE). Før: AB → E, som ga eneste KN = {A, B, C}.
    nfEks3: mkRel("R", "ABCDE", ["AB → C", "BC → D", "D → E"]),
    h2024_32: mkRel("R", "ABCDEF", ["DE → F", "ACE → B", "B → A", "B → D"]),
    h2019_32: mkRel("R", "ABCDEF", ["A → C", "B → D", "AB → F", "AD → E"]),
    h2020_R2: mkRel("R", "ABCD", ["D → B", "C → AD", "B → D", "A → C"]),
    relEks1: mkRel("R", "ABCD", ["AB → C", "C → A", "B → D"]),
    relEks2: mkRel("R", "ABCD", ["AB → C", "C → D"]),
    relEks2b: mkRel("R", "ABCD", ["AB → C", "C → D", "C → A", "C → B"]),
    bcnfEks1: mkRel("R", "ABCDEF", ["A → B", "B → C", "D → E", "AD → F"]),
    h2023_33: mkRel("R", "ABCDE", ["B → E", "AB → C", "E → D", "C → A"]),
    h2024_33: mkRel("R", "ABCDEF", ["A → B", "A → D", "CE → F", "EF → B"]),
    h2020_R3: mkRel("Student", ["id", "navn", "veileder", "oppgave", "institutt"], ["id → navn", "oppgave → veileder", "oppgave → institutt"]),
    quizBcnf: mkRel("R", "ABCDE", ["AB → C", "C → D", "D → E"]),
    vakt: mkRel("Vakt", ["ansatt", "avdeling", "etasje", "dag"], ["ansatt → avdeling", "avdeling → etasje"]),
    fyllB: mkRel("R", "ABCDE", ["AB → C", "C → D", "D → A", "E → B"]),
    h2023_32: mkRel("R", "ABCDEF", ["AB → C", "B → D", "D → E", "F → A", "E → B"])
  });
  EX.billettNavn = { "1": "Konsert", "2": "B2", "21": "Kjøper", "22": "Salg" };

  var VAKT_INST = (F.VAKT_INST = {
    I: [["Per", "Lager", 1, "man"], ["Per", "Lager", 1, "tir"], ["Kari", "Kasse", 2, "man"]],
    II: [["Per", "Lager", 1, "man"], ["Kari", "Lager", 2, "tir"], ["Ola", "Kasse", 2, "man"]],
    III: [["Per", "Lager", 1, "man"], ["Per", "Kasse", 2, "tir"], ["Kari", "Kasse", 2, "man"]],
    IV: [["Per", "Lager", 1, "man"], ["Ola", "Kasse", 1, "tir"], ["Kari", "Kasse", 1, "ons"]],
    V: [["Per", "Lager", 1, "man"], ["Per", null, 1, "tir"]]
  });
  var VAKT_MD = (F.VAKT_MD = [
    { instans: "I", fd: "ansatt → avdeling", gruppe: "Per", brudd: false, tekst: "Per står to ganger, begge med Lager. Samme ansatt, samme avdeling." },
    { instans: "I", fd: "avdeling → etasje", gruppe: "Lager", brudd: false, tekst: "Lager står med etasje 1 begge ganger. Instans I bryter ingen av FD-ene." },
    { instans: "II", fd: "avdeling → etasje", gruppe: "Lager", brudd: true, tekst: "Lager står med både etasje 1 og etasje 2. Da er <span class=\"mono\">avdeling → etasje</span> brutt." },
    { instans: "III", fd: "ansatt → avdeling", gruppe: "Per", brudd: true, tekst: "Per står med både Lager og Kasse. Da er <span class=\"mono\">ansatt → avdeling</span> brutt." },
    { instans: "IV", fd: "avdeling → etasje", gruppe: "Kasse", brudd: false, tekst: "Kasse har etasje 1 i begge radene. At Lager også ligger i etasje 1, er lov: vi sammenligner bare rader med lik venstreside." },
    { instans: "V", fd: "ansatt → avdeling", gruppe: "Per", brudd: true, tekst: "Per har Lager i én rad og ukjent avdeling (NULL) i den andre. Sensor i H2025 3.1 regnet dette som brudd, fordi NULL betyr ukjent og gir tvetydighet. Det er en eksamenskonvensjon, ikke en definisjon fra lysarkene." }
  ]);
  var H25_INST = (F.H25_INST = {
    "Instans I": [["1", "x", "y", "9"], ["1", "x", "y", "8"], ["2", "w", "z", "7"]],
    "Instans II": [["1", "x", "y", "9"], ["1", "x", "z", "8"], ["2", "w", "z", "7"]],
    "Instans III": [["1", "x", "y", "9"], ["1", "w", "y", "9"], ["2", "w", "y", "7"]],
    "Instans IV": [["1", "x", "y", "9"], ["1", null, "y", "9"]]
  });
  var FYLL = (F.FYLL = {
    B: [[1, 2, 3, 4, 5], [6, 2, 7, 8, 9], ["?", 1, 3, 4, 7], [6, "?", 7, 8, 5], [1, 2, "?", 4, 9], [6, 4, 7, "?", 6]],
    H2023: [[1, 2, "?", 4, 5, 6], ["?", 3, 4, 8, 9, 7], [1, 2, 5, "?", 5, 7], [2, 3, 5, 8, "?", 1], [1, "?", 5, 4, 5, 8]]
  });

  /* Håndregnede forklaringer fra innholdsfilene (egne ord). */
  var MD = (F.MD = {
    tillEks1: [
      "Start: X⁺ = X = {scene, dato, sete}.",
      "scene og dato er begge med, så FD3 kan brukes. konsert kommer til.",
      "konsert er med nå. FD2 gir artist, scene og dato, men scene og dato var der fra før. Bare artist er nytt.",
      "Både konsert og sete er med, så FD4 gir billettnr.",
      "billettnr er med. FD1 gir konsert, sete og kjøper, og bare kjøper er nytt.",
      "kjøper er med, så FD5 gir epost.",
      "Ingen FD gir noe nytt. X⁺ inneholder alle åtte attributtene, så {scene, dato, sete} er en supernøkkel."
    ],
    tillEks2: {
      prefer: [3, 4, 1, 2],
      tekst: [
        "Start: X⁺ = AC.",
        "A er med, så A → E gir E.",
        "E er med, så E → F gir F.",
        "C er med, så C → D gir D.",
        "D er med, så D → B gir B.",
        "AB → C gir ikke noe nytt. Ferdig: (AC)⁺ = ABCDEF, så AC er en supernøkkel. Rekkefølgen er en annen enn motoren ville valgt, men svaret blir det samme."
      ]
    },
    knEks1: [
      { X: ["C"], status: "ikke SN", tekst: "Start med «alltid med». Ingen FD har bare C på venstresiden, så C⁺ = {C}." },
      { X: ["A", "C"], status: "KN", tekst: "A → B, AC → D og D → E gir alt. Verken A⁺ eller C⁺ er alt, så AC er minimal." },
      { X: ["B", "C"], status: "KN", tekst: "B → A gir A, og så går det som over. B⁺ = {A, B} og C⁺ = {C}, så BC er minimal." },
      { X: ["C", "D"], status: "ikke SN", tekst: "D gir bare E. Ingenting gir A eller B." },
      { X: ["A", "C", "D"], status: "hoppet over", tekst: "Inneholder KN-en AC og kan ikke være minimal. Det samme gjelder ABC, BCD og ABCD." },
      { status: "ferdig", tekst: "KN = {A, C} og {B, C}. Nøkkelattributter: A, B, C. D og E er ikke-nøkkelattributter, selv om D står på en venstreside." }
    ],
    knBillett: [
      { X: [], status: "ikke SN", tekst: "«Alltid med» er tom, så vi starter med ∅ og prøver deretter enkeltattributter fra «kanskje med»." },
      { X: ["billettnr"], status: "KN", tekst: "FD1 gir konsert, sete og kjøper. FD2 gir artist, scene og dato. FD5 gir epost. Alt er med." },
      { X: ["konsert"], status: "ikke SN", tekst: "Mangler billettnr, sete, kjøper og epost. sete, kjøper, scene og dato alene feiler også." },
      { X: ["konsert", "sete"], status: "KN", tekst: "FD4 gir billettnr, og billettnr gir resten. Verken konsert⁺ eller sete⁺ er alt, så paret er minimalt." },
      { X: ["scene", "dato"], status: "ikke SN", tekst: "Mangler sete. Alle de andre parene uten billettnr feiler også, fordi sete eller konsert mangler." },
      { X: ["scene", "dato", "sete"], status: "KN", tekst: "FD3 gir konsert, og så gir FD4 billettnr. Ingen av parene inni er SN, så tripelen er minimal." },
      { X: ["konsert", "kjøper", "scene", "dato"], status: "ikke SN", tekst: "Den eneste firermengden som ikke inneholder en KN. Den mangler sete, og uten billettnr kan ingenting gi sete." },
      { status: "ferdig", tekst: "KN = {billettnr}, {konsert, sete} og {scene, dato, sete}. Snarvei: sete kommer bare fra billettnr, og billettnr bare fra konsert og sete. En KN må derfor ha billettnr eller sete, og med sete trengs konsert (direkte eller via scene og dato)." }
    ],
    nfBillett: {
      "billettnr → konsert": "billettnr⁺ er alle åtte, så venstresiden er SN. Det samme gjelder de to neste radene.",
      "konsert → artist": "konsert⁺ = {konsert, artist, scene, dato}, ikke SN. artist er ikke med i noen KN. konsert er en ekte del av {konsert, sete}. 2NF er brutt.",
      "konsert → scene": "Ikke SN, men scene er med i KN-en {scene, dato, sete}.",
      "konsert → dato": "Som over: dato er et nøkkelattributt.",
      "scene, dato → konsert": "{scene, dato}⁺ mangler sete og mer, så ikke SN. konsert er med i KN-en {konsert, sete}.",
      "konsert, sete → billettnr": "{konsert, sete} er selv en KN.",
      "kjøper → epost": "kjøper⁺ = {kjøper, epost}. epost er ikke-nøkkel, og kjøper er ikke med i noen KN. 2NF holder, men 3NF er brutt."
    },
    bcnfEks1: [
      "A er ikke SN (A⁺ = {A, B, C}). S1 = A⁺. S2 = A pluss det som ikke er i A⁺, altså D, E og F.",
      "A er KN i S1. B → C bryter BCNF, fordi B⁺ = {B, C} ikke er hele S1.",
      "Eneste FD har SN på venstresiden. BCNF.",
      "A er SN. BCNF.",
      "A → B og B → C er borte, fordi B og C ikke er i S2. D⁺ = {D, E}, så D er ikke SN.",
      "Eneste FD har SN på venstresiden. BCNF.",
      "AD er KN, og AD → F er eneste FD. BCNF.",
      "R ⟶ {S11(B, C), S12(A, B), S21(D, E), S22(A, D, F)}. Starter du med B → C, får du de samme fire tabellene."
    ],
    bcnfBillett: [
      "konsert er ikke SN. konsert⁺ tar med seg artist, scene og dato. konsert blir også værende i resten, slik at tabellene kan joines.",
      "Begge venstresidene (konsert og {scene, dato}) er SN i denne tabellen. BCNF.",
      "FD2 og FD3 er borte, fordi artist, scene og dato ikke er med. kjøper er ikke SN.",
      "Eneste FD har SN på venstresiden. BCNF.",
      "Begge venstresidene er KN. BCNF.",
      "Billett ⟶ {Konsert, Kjøper, Salg}. Starter du med kjøper → epost, får du de samme tre tabellene. Navnene settes på etterpå."
    ]
  });

  /* ================================================================
     9. Demoer (DOM, bare i nettleseren)
     ================================================================ */
  var Demo = (IN.fdDemo = IN.fdDemo || {});
  function E(tag, attrs, kids) { return IN.el(tag, attrs, kids); }
  function host(h) { return typeof h === "string" ? IN.qs(h) : h; }
  function errStage(st, msg) {
    IN.clear(st);
    st.appendChild(E("div", { class: "fdv" }, [E("p", { class: "fdv-err", html: msg })]));
  }
  function fdListEl(rel, cls) {
    var ul = E("ul", { class: "fdv-fdlist " + (cls || "") });
    rel.fds.forEach(function (f) { ul.appendChild(E("li", { class: "mono", text: (f.id ? f.id + "  " : "") + fdText(f) })); });
    return ul;
  }
  function headEl(rel) {
    return E("div", { class: "fdv-head" }, [
      E("span", { class: "fdv-rel mono", text: relText(rel.navn, rel.attrs) }), fdListEl(rel, "inline")
    ]);
  }
  function pill(nf, txt) { return E("span", { class: "nf-pill nf-" + nf, text: txt || nf }); }
  function specInput(parseKind) {
    return function (str) {
      var p = F.parseSpec(str);
      if (p.error) return [{ error: p.error }];
      if (parseKind === "X" && !p.X) return [{ error: "Legg til hvilken mengde du vil ta tillukningen av, for eksempel <span class=\"mono\">; X=AC</span>." }];
      return [{ rel: p.rel, X: p.X, kn: p.kn, velg: p.velg }];
    };
  }

  /* ---------- Pseudokode ---------- */
  var ALGO = (Demo.ALGO = {
    tillukning: {
      name: "Tillukning", params: "X, F", input: "En mengde attributter X og FD-ene F", output: "X⁺, alt X bestemmer",
      lines: [
        { code: "X⁺ ← X", indent: 1,
          eli5: "Start med det du allerede har.",
          normal: "Tillukningen inneholder alltid X selv.",
          teknisk: "X → X er triviell, så X ⊆ X⁺. Glemmer du X i svaret, er tillukningen feil." },
        { code: "while en FD Y → Z i F har Y ⊆ X⁺ and Z ⊄ X⁺ do", indent: 1,
          eli5: "Finnes det en regel der du har alt på venstre side, og som gir noe nytt?",
          normal: "Let etter en FD der hele venstresiden allerede er med, og høyresiden har minst ett nytt attributt.",
          teknisk: "Løkka går så lenge X⁺ ikke er lukket under F. Den stopper fordi X⁺ bare vokser og R er endelig.",
          grense: { q: "Hvorfor hele Y og ikke bare en del av Y?", a: "AB → C sier noe om rader med lik A og lik B. Har du bare B, vet du ingenting om C. Derfor er B⁺ = {B} når B bare står til venstre sammen med A." } },
        { code: "X⁺ ← X⁺ ∪ Z", indent: 2,
          eli5: "Legg det nye i kurven.",
          normal: "Legg høyresiden til. Det som var med fra før, telles ikke dobbelt.",
          teknisk: "Fra X → Y (fordi Y ⊆ X⁺) og Y → Z følger X → Z ved transitivitet." },
        { code: "return X⁺", indent: 1,
          eli5: "Ingen nye brikker faller. Det du har, er svaret.",
          normal: "Ingen FD gir noe nytt. Inneholder X⁺ alle attributtene, er X en supernøkkel.",
          teknisk: "X⁺ er den minste mengden som inneholder X og er lukket under F. X → A følger av F nøyaktig når A ∈ X⁺.",
          grense: { q: "Hvorfor gå gjennom lista på nytt etter hvert nytt attributt?", a: "Et nytt attributt kan gjøre en FD du allerede har sett på, brukbar. Stopp først når en hel runde ikke gir noe." } }
      ]
    },
    kn: {
      name: "FinnKN", params: "R, F", input: "Relasjonen R og FD-ene F", output: "Alle kandidatnøklene",
      lines: [
        { code: "A ← attributtene som aldri står på en høyreside", indent: 1,
          eli5: "Brikker ingen andre kan lage. De må alltid med.",
          normal: "«Alltid med»: ingen FD kan gi dem, så de er med i alle KN.",
          teknisk: "R − H, der H er attributtene på høyresidene. De ligger aldri i X⁺ uten å være i X." },
        { code: "N ← attributtene som bare står på høyresider", indent: 1,
          eli5: "Brikker som bare blir laget og aldri lager noe. De trengs aldri.",
          normal: "«Aldri med»: de kan alltid utledes, og de hjelper ikke til å utlede noe annet.",
          teknisk: "H − L, der L er attributtene på venstresidene. Å fjerne dem fra en SN endrer ikke tillukningen." },
        { code: "M ← resten", indent: 1,
          eli5: "De usikre brikkene, som vi må prøve.",
          normal: "«Kanskje med»: står både til venstre og til høyre.",
          teknisk: "L ∩ H. Søket går bare over delmengder av M." },
        { code: "KN ← ∅", indent: 1,
          normal: "Ingen nøkler funnet ennå." },
        { code: "for k ← 0 to antall(M) do", indent: 1,
          eli5: "Prøv først uten ekstra brikker, så med én, så med to …",
          normal: "Prøv de minste kombinasjonene først. Da ser du minimaliteten med en gang.",
          teknisk: "Stigende størrelse gjør at en SN som ikke inneholder en funnet KN, er minimal." },
        { code: "for each S ⊆ M med k attributter do", indent: 2,
          normal: "Alle kombinasjoner av k attributter fra «kanskje med»." },
        { code: "X ← A ∪ S", indent: 3,
          normal: "Kandidaten er «alltid med» pluss kombinasjonen." },
        { code: "if X inneholder en KN fra før then hopp over X", indent: 3,
          eli5: "Har du alt en kortere beskrivelse inni, er denne for lang.",
          normal: "En mengde som inneholder en KN, er en SN, men ikke minimal.",
          teknisk: "Overmengder av en KN kan aldri være KN. Er et helt nivå hoppet over, er alle større mengder det også, og søket kan stoppe." },
        { code: "else if X⁺ = R then legg X til i KN", indent: 3,
          eli5: "Peker beskrivelsen ut én rad, og er den kort nok? Da er den en nøkkel.",
          normal: "Regn ut tillukningen. Er den hele R, er X en ny KN.",
          teknisk: "SN-test med tillukning. Minimaliteten følger av søkerekkefølgen.",
          grense: { q: "Hvorfor er ABC ikke en KN selv om (ABC)⁺ = R?", a: "Fordi den inneholder en mindre SN, for eksempel AC. En KN må være minimal." } },
        { code: "return KN", indent: 1,
          normal: "Alle kombinasjoner er prøvd eller hoppet over. Nøkkelattributtene er unionen av KN-ene.",
          grense: { q: "Hvorfor ikke stoppe ved første KN?", a: "Det kan finnes flere, og normalformene avhenger av alle nøkkelattributtene." } }
      ]
    },
    nf: {
      name: "Normalform", params: "R, F", input: "R og FD-ene F, splittet til X → A", output: "Normalformen til hver FD og til R",
      lines: [
        { code: "finn alle KN, og dermed nøkkelattributtene", indent: 1,
          eli5: "Først må du vite hva som identifiserer en rad.",
          normal: "Uten alle KN-ene kan du ikke svare på spørsmål 2 og 3.",
          teknisk: "Nøkkelattributtene er unionen av alle KN-er, ikke bare primærnøkkelen." },
        { code: "for each X → A i F do", indent: 1,
          normal: "Hver FD for seg, med ett attributt på høyresiden." },
        { code: "if X⁺ = R then X → A gir BCNF", indent: 2,
          eli5: "Er det nøkkelen som bestemmer? Da er alt i orden.",
          normal: "Spørsmål 1: er X en supernøkkel? Ja gir BCNF. Nei betyr at BCNF er brutt.",
          teknisk: "BCNF-kravet: venstresiden er en SN." },
        { code: "else if A er nøkkelattributt then X → A gir 3NF", indent: 2,
          eli5: "Bestemmer den bare en del av en nøkkel? Det tåles litt bedre.",
          normal: "Spørsmål 2: er A med i minst én KN? Ja gir 3NF. Nei betyr at 3NF er brutt.",
          teknisk: "Unntaket som skiller 3NF fra BCNF.",
          grense: { q: "Hvorfor 3NF og ikke BCNF når A er nøkkelattributt?", a: "BCNF krever SN på venstresiden uten unntak. 3NF godtar at A er med i en KN." } },
        { code: "else if X ⊂ en KN then X → A gir 1NF", indent: 2,
          eli5: "Hører opplysningen bare til en del av nøkkelen? Det er verst.",
          normal: "Spørsmål 3: er X en ekte del av en KN? Ja betyr at 2NF er brutt, og FD-en gir 1NF.",
          teknisk: "Partiell avhengighet til et ikke-nøkkelattributt.",
          grense: { q: "Hvorfor ekte delmengde?", a: "Er X hele KN-en, er X en SN, og da svarte du ja allerede på spørsmål 1." } },
        { code: "else X → A gir 2NF", indent: 2,
          normal: "X er ikke en del av noen KN (for eksempel en blanding med et ikke-nøkkelattributt). 2NF holder, men 3NF er brutt." },
        { code: "return den laveste normalformen", indent: 1,
          eli5: "Kjettingen er ikke sterkere enn det svakeste leddet.",
          normal: "Relasjonen er på den laveste normalformen blant FD-ene.",
          teknisk: "Normalformene er krav til alle ikke-trivielle FD-er, så svaret er minimum over FD-ene." }
      ]
    },
    bcnf: {
      name: "BCNF", params: "R(X), F", input: "R(X) med FD-ene F (splittet)", output: "En tapsfri dekomposisjon der alle relasjonene er på BCNF",
      lines: [
        { code: "if alle FD-er i F har SN på venstresiden then return R", indent: 1,
          eli5: "Ingen regel er på feil sted. Ferdig med denne boksen.",
          normal: "Finn KN-ene og sjekk hver FD. Er alle venstresidene supernøkler, er R på BCNF.",
          teknisk: "Basistilfellet. En relasjon med to attributter er alltid her." },
        { code: "velg Y → A i F der Y ikke er SN", indent: 1,
          normal: "Velg én FD som bryter BCNF. Valget kan gi ulike, like riktige resultater.",
          teknisk: "Rekkefølgen påvirker resultatet, men alle valg gir BCNF og tapsfrihet." },
        { code: "regn ut Y⁺", indent: 1,
          normal: "Tillukningen regnes med FD-ene som gjelder for R akkurat nå.",
          teknisk: "Feil tillukning gir −1 på eksamen." },
        { code: "S₁ ← Y⁺ ; S₂ ← Y ∪ (X − Y⁺)", indent: 1,
          eli5: "Klipp ut alt regelen styrer, og la limet (Y) ligge igjen i begge bitene.",
          normal: "S₁ får hele tillukningen. S₂ får Y pluss alt som ikke er i Y⁺. Karlsen skriver S₂(Y, X/Y⁺).",
          teknisk: "Snittet er Y, og Y → Y⁺ = S₁. Etter Fagins teorem er steget tapsfritt.",
          grense: { q: "Hvorfor S₁(Y⁺) og ikke bare S₁(Y, A)?", a: "Algoritmen tar med hele tillukningen. Med bare (Y, A) trengs ofte flere steg." } },
        { code: "F₁, F₂ ← FD-ene i F som ligger helt inne i S₁ og S₂", indent: 1,
          normal: "En FD blir med bare hvis alle attributtene dens er med i delrelasjonen. Finn så KN på nytt.",
          teknisk: "Kursets forenkling. I eksemplene her gir den samme svar som en full projeksjon (kontrollert)." },
        { code: "return BCNF(S₁, F₁) ∪ BCNF(S₂, F₂)", indent: 1,
          normal: "Gjenta for begge delene til alle er på BCNF.",
          teknisk: "Terminerer: S₁ mangler noe fra X (Y er ikke SN), og S₂ mangler A." }
      ]
    }
  });
  function pseudoFor(pcHost, key) {
    var h = host(pcHost);
    return h && IN.pseudo && IN.pseudo.render ? IN.pseudo.render(h, ALGO[key]) : null;
  }

  /* ---------- Tillukning ---------- */
  function closureSteps(cfg) {
    if (cfg.error) return [{ error: cfg.error }];
    var r = cfg.rel, X = uniq(cfg.X), cl = F.closure(X, r.fds, cfg.prefer), tx = cfg.tekst || [], out = [];
    out.push({ rel: r, X: X, plus: X.slice(), nye: [], fired: -1, line: 2, tag: "Start",
      text: tx[0] || ("Start med " + plusName(X) + " = " + setText(X) + ". Tillukningen inneholder alltid X selv.") });
    cl.steps.forEach(function (c, k) {
      var gammel = minus(c.fd.rhs, c.added);
      out.push({ rel: r, X: X, plus: c.after, nye: c.added, fired: c.i, line: 4,
        tag: "Steg " + (k + 1) + ": " + (c.fd.id || fdText(c.fd)),
        text: tx[k + 1] || ("Hele venstresiden (" + side(c.fd.lhs) + ") er med, så " + fdText(c.fd) + " kan brukes. Nytt: " +
          c.added.join(", ") + (gammel.length ? ". " + gammel.join(", ") + " var med fra før." : ".")) });
    });
    var sn = subset(r.attrs, cl.plus), ferdig = order(cl.plus, r.attrs);
    out.push({ rel: r, X: X, plus: cl.plus, nye: [], fired: -1, line: 5, final: true, sn: sn, tag: "Ferdig",
      text: tx[cl.steps.length + 1] || ("Ingen FD gir noe nytt. " + plusName(X) + " = " + setText(ferdig) + ". " +
        (sn ? "Det er alle attributtene, så " + setText(X) + " er en supernøkkel."
            : "Mangler " + minus(r.attrs, cl.plus).join(", ") + ", så " + setText(X) + " er ikke en supernøkkel.")) });
    return out;
  }
  F.closureSteps = closureSteps;
  function renderClosure(s, ctx) {
    var st = ctx.stage;
    if (s.error) { errStage(st, s.error); return; }
    IN.clear(st);
    var box = E("div", { class: "fdv fdv-closure" });
    box.appendChild(E("div", { class: "fdv-head" }, [E("span", { class: "fdv-rel mono", text: relText(s.rel.navn, s.rel.attrs) })]));
    box.appendChild(E("p", { class: "fdv-now" }, [
      E("b", { class: "mono", text: plusName(s.X) + " = " }), E("span", { class: "mono", text: setText(s.plus) })
    ]));
    var chips = E("div", { class: "fdv-chips", role: "list", "aria-label": "Attributtene i " + s.rel.navn });
    s.rel.attrs.forEach(function (a) {
      var c = has(s.X, a) ? "c-x0" : has(s.nye, a) ? "c-new" : has(s.plus, a) ? "c-in" : "c-out";
      var lbl = c === "c-x0" ? "i X" : c === "c-new" ? "nytt" : c === "c-in" ? "lagt til" : "ikke med";
      chips.appendChild(E("span", { class: "ch " + c, role: "listitem", title: lbl, "aria-label": a + ": " + lbl, text: a }));
    });
    box.appendChild(chips);
    var ul = E("ul", { class: "fdv-fds" });
    s.rel.fds.forEach(function (f, i) {
      var cls, note;
      if (i === s.fired) { cls = "fire"; note = "brukes nå: + " + s.nye.join(", "); }
      else if (subset(f.lhs, s.plus)) {
        if (subset(f.rhs, s.plus)) { cls = "done"; note = "gir ikke noe nytt"; }
        else { cls = "ready"; note = "kan brukes"; }
      } else { cls = "blocked"; note = "mangler " + minus(f.lhs, s.plus).join(", "); }
      ul.appendChild(E("li", { class: cls }, [
        E("span", { class: "mono", text: (f.id ? f.id + "  " : "") + fdText(f) }), " ",
        E("span", { class: "note small", text: note })
      ]));
    });
    box.appendChild(ul);
    if (s.final) box.appendChild(E("p", { class: "fdv-verdict" }, [
      pill(s.sn ? "BCNF" : "1NF", s.sn ? "supernøkkel" : "ikke supernøkkel"), " ",
      E("span", { class: "mono", text: plusName(s.X) + " = " + setText(order(s.plus, s.rel.attrs)) })
    ]));
    st.appendChild(box);
  }
  Demo.tillukning = function (spHost, pcHost) {
    var pc = pseudoFor(pcHost, "tillukning");
    var B = EX.billett;
    return IN.stepPlayer(host(spHost), {
      presets: {
        "Billett: {scene, dato, sete}⁺": [{ rel: B, X: ["scene", "dato", "sete"], tekst: MD.tillEks1 }],
        "Billett: {konsert, kjøper}⁺": [{ rel: B, X: ["konsert", "kjøper"] }],
        "(AC)⁺": [{ rel: EX.tillEks2, X: ["A", "C"], prefer: MD.tillEks2.prefer, tekst: MD.tillEks2.tekst }],
        "B⁺": [{ rel: EX.tillEks2, X: ["B"] }],
        "H2019 3.1: A⁺": [{ rel: EX.h2019_31, X: ["A"] }],
        "H2019 3.1: B⁺": [{ rel: EX.h2019_31, X: ["B"] }]
      },
      generate: function (inp) { return closureSteps(inp[0]); },
      render: renderClosure,
      parseInput: specInput("X"),
      inputLabel: "ABCDE; A->B, BC->D; X=AC",
      inputAria: "Egen relasjon, FD-er og X",
      pseudo: pc
    });
  };

  /* ---------- Kandidatnøkler ---------- */
  function klassText(c) {
    return "Sorter attributtene. Alltid med (står aldri til høyre): <b>" + esc(listText(c.alltid)) +
      "</b>. Aldri med (bare til høyre): <b>" + esc(listText(c.aldri)) + "</b>. Kanskje med: <b>" + esc(listText(c.kanskje)) + "</b>." +
      (c.alltid.length ? "" : " «Alltid med» er tom, så søket starter med ∅.");
  }
  function knSteps(cfg) {
    if (cfg.error) return [{ error: cfg.error }];
    var r = cfg.rel, c = F.classify(r.attrs, r.fds), res = F.keys(r.attrs, r.fds), out = [], kn = [], log = [];
    function push(s) { s.rel = r; s.c = c; s.kn = kn.slice(); s.log = log.slice(); out.push(s); }
    push({ type: "klass", line: 4, tag: "Sorter", text: klassText(c) });
    if (cfg.md) {
      cfg.md.forEach(function (m) {
        if (m.status === "ferdig") return;
        var X = order(m.X, r.attrs);
        if (m.status === "hoppet over") {
          log.push({ X: X, plus: null, status: "hoppet over" });
          push({ type: "skip", list: [{ X: X, K: kn.filter(function (K) { return subset(K, X); })[0] }], line: 9, tag: "Hopp over", text: m.tekst });
          return;
        }
        var pl = order(F.closure(X, r.fds).plus, r.attrs);
        if (m.status === "KN") kn.push(X);
        log.push({ X: X, plus: pl, status: m.status });
        push({ type: "test", X: X, plus: pl, status: m.status, line: 10, tag: "Test " + setText(X), text: m.tekst });
      });
      var last = cfg.md[cfg.md.length - 1];
      push({ type: "done", line: 11, tag: "Ferdig", text: last.tekst, na: order(flat(kn), r.attrs) });
      return out;
    }
    res.steps.forEach(function (s) {
      if (s.type === "klass") return;
      if (s.type === "skip") {
        s.list.forEach(function (x) { log.push({ X: x.X, plus: null, status: "hoppet over" }); });
        push({ type: "skip", list: s.list, line: 9, tag: "Hopp over (" + (c.alltid.length + s.k) + " attributter)",
          text: "Disse inneholder en KN vi har funnet, og kan ikke være minimale: " +
            esc(s.list.map(function (x) { return setText(x.X); }).join(", ")) + "." });
        return;
      }
      if (s.type === "test") {
        if (s.status === "KN") kn.push(s.X);
        log.push({ X: s.X, plus: s.plus, status: s.status });
        push({ type: "test", X: s.X, plus: s.plus, status: s.status, line: 10, tag: "Test " + setText(s.X),
          text: esc(plusName(s.X) + " = " + setText(s.plus) + ". ") + (s.status === "KN"
            ? "Det er hele " + esc(r.navn) + ", så " + esc(setText(s.X)) + " er en KN. " + esc(minimalText(s.X, r.attrs, r.fds))
            : "Mangler " + esc(minus(r.attrs, s.plus).join(", ")) + ", så " + esc(setText(s.X)) + " er ikke en SN.") });
        return;
      }
      var na = order(flat(kn), r.attrs);
      push({ type: "done", line: 11, tag: "Ferdig", na: na,
        text: "Alle kombinasjoner er prøvd eller hoppet over. KN = " + esc(knList(kn)) + ". Nøkkelattributter: " + esc(listText(na)) +
          ". Ikke-nøkkelattributter: " + esc(listText(minus(r.attrs, na))) + "." });
    });
    return out;
  }
  F.knSteps = knSteps;
  function grpEl(navn, a, cls) {
    return E("div", { class: "fdv-grp " + cls }, [E("span", { class: "lbl small", text: navn }), E("span", { class: "mono", text: listText(a) })]);
  }
  function statusPill(st) {
    if (st === "KN") return pill("BCNF", "KN");
    if (st === "hoppet over") return pill("2NF", "hoppet over");
    return pill("1NF", "ikke SN");
  }
  function renderKN(s, ctx) {
    var st = ctx.stage;
    if (s.error) { errStage(st, s.error); return; }
    IN.clear(st);
    var box = E("div", { class: "fdv fdv-kn" });
    box.appendChild(headEl(s.rel));
    box.appendChild(E("div", { class: "fdv-grps" }, [
      grpEl("Alltid med", s.c.alltid, "g-alltid"), grpEl("Aldri med", s.c.aldri, "g-aldri"), grpEl("Kanskje med", s.c.kanskje, "g-kanskje")
    ]));
    if (s.type === "test") box.appendChild(E("p", { class: "fdv-now" }, [
      E("span", { class: "mono", text: "X = " + setText(s.X) + "   " + plusName(s.X) + " = " + setText(s.plus) }), " ", statusPill(s.status)
    ]));
    if (s.type === "skip") box.appendChild(E("p", { class: "fdv-now small" }, [
      statusPill("hoppet over"), " ",
      E("span", { class: "mono", text: s.list.map(function (x) { return setText(x.X) + (x.K ? " ⊇ " + setText(x.K) : ""); }).join("   ") })
    ]));
    if (s.type === "done") box.appendChild(E("p", { class: "fdv-now" }, [
      E("b", { text: "KN: " }), E("span", { class: "mono", text: knList(s.kn) }), E("br"),
      E("span", { class: "small", text: "Nøkkelattributter: " + listText(s.na) + ". Ikke-nøkkel: " + listText(minus(s.rel.attrs, s.na)) + "." })
    ]));
    else box.appendChild(E("p", { class: "small" }, [E("b", { text: "Funnet så langt: " }), E("span", { class: "mono", text: knList(s.kn) })]));
    if (s.log.length) {
      var shown = s.log.slice(-8), tb = E("tbody");
      shown.forEach(function (l, i) {
        tb.appendChild(E("tr", { class: i === shown.length - 1 && s.type !== "done" ? "cur" : null }, [
          E("td", { class: "mono", text: setText(l.X) }),
          E("td", { class: "mono", text: l.plus ? setText(l.plus) : "–" }),
          E("td", null, [statusPill(l.status)])
        ]));
      });
      box.appendChild(E("div", { class: "table-wrap" }, [E("table", { class: "cmp-table fdv-log" }, [
        E("caption", { class: "small muted", text: s.log.length > 8 ? "Siste 8 av " + s.log.length + " tester" : "Testet så langt" }),
        E("thead", null, [E("tr", null, [E("th", { text: "X" }), E("th", { text: "X⁺" }), E("th", { text: "Status" })])]), tb
      ])]));
    }
    st.appendChild(box);
  }
  Demo.kn = function (spHost, pcHost) {
    var pc = pseudoFor(pcHost, "kn");
    return IN.stepPlayer(host(spHost), {
      presets: {
        "A → B, B → A, AC → D, D → E": [{ rel: EX.knEks1, md: MD.knEks1 }],
        "Billett": [{ rel: EX.billett, md: MD.knBillett }],
        "Billett (alle tester)": [{ rel: EX.billett }],
        "H2020 R1": [{ rel: EX.h2020_R1 }],
        "H2023 3.1": [{ rel: EX.h2023_31 }],
        "H2024 3.1": [{ rel: EX.h2024_31 }],
        "H2025 3.2a": [{ rel: EX.h2025 }],
        "Trening": [{ rel: EX.trening }]
      },
      generate: function (inp) { return knSteps(inp[0]); },
      render: renderKN,
      parseInput: specInput(),
      inputLabel: "ABCDE; A->B, B->A, AC->D, D->E",
      inputAria: "Egen relasjon og FD-er",
      pseudo: pc
    });
  };

  /* ---------- Sjekk en mengde i Billett (fane nokler) ---------- */
  Demo.nokkelSjekk = function (h) {
    h = host(h); if (!h) return;
    var B = EX.billett, keys = F.keys(B.attrs, B.fds), valgt = ["billettnr", "kjøper"];
    var wrap = E("div", { class: "fdv fdv-sjekk card" }), boxes = E("div", { class: "fdv-chips" }), out = E("div", { class: "fdv-out", "aria-live": "polite" });
    B.attrs.forEach(function (a) {
      var id = "ns-" + a.replace(/[^a-z]/gi, "_");
      var cb = E("input", { type: "checkbox", id: id, checked: has(valgt, a) ? true : null,
        onchange: function () { valgt = B.attrs.filter(function (x) { return IN.qs("#ns-" + x.replace(/[^a-z]/gi, "_"), wrap).checked; }); paint(); } });
      boxes.appendChild(E("label", { class: "ch ch-cb", for: id }, [cb, " " + a]));
    });
    wrap.appendChild(E("p", { class: "small", text: "Kryss av en mengde X i Billett:" }));
    wrap.appendChild(boxes); wrap.appendChild(out);
    function paint() {
      IN.clear(out);
      if (!valgt.length) { out.appendChild(E("p", { class: "small muted", text: "Velg minst ett attributt." })); return; }
      var pl = order(F.closure(valgt, B.fds).plus, B.attrs), sn = subset(B.attrs, pl);
      var kn = sn && keys.kn.some(function (k) { return eqSet(k, valgt); });
      var inni = keys.kn.filter(function (k) { return subset(k, valgt); });
      out.appendChild(E("p", { class: "mono", text: plusName(valgt) + " = " + setText(pl) }));
      var p = E("p");
      p.appendChild(pill(sn ? "BCNF" : "1NF", sn ? "SN" : "ikke SN")); p.appendChild(document.createTextNode(" "));
      p.appendChild(pill(kn ? "BCNF" : "2NF", kn ? "KN" : "ikke KN"));
      p.appendChild(document.createTextNode(" " + (sn ? (kn ? "Minimal: ingen ekte delmengde er SN." :
        "Ikke minimal: den inneholder KN-en " + inni.map(setText).join(" og ") + ".") :
        "Mangler " + minus(B.attrs, pl).join(", ") + ".")));
      out.appendChild(p);
    }
    paint();
    h.appendChild(wrap);
  };

  /* ---------- Normalform per FD ---------- */
  function nfSteps(cfg) {
    if (cfg.error) return [{ error: cfg.error }];
    var r = cfg.rel, res = F.nf(r.attrs, r.fds, { kn: cfg.kn }), out = [], reveal = res.rows.map(function () { return 0; });
    var md = cfg.md || {};
    function push(s) { s.res = res; s.rel = r; s.reveal = reveal.slice(); out.push(s); }
    push({ cur: -1, line: 2, tag: "Forbered",
      text: (res.gitt ? "KN er oppgitt: " + esc(knList(res.kn)) + ". En venstreside er da SN når den inneholder en KN."
        : "Finn alle KN først (blokk 6): " + esc(knList(res.kn)) + ".") +
        " Nøkkelattributter: " + esc(listText(res.nokkelattr)) + ". Ikke-nøkkel: " + esc(listText(res.ikke)) + "." +
        (r.fds.length !== res.rows.length ? " FD-ene er splittet til ett attributt på høyresiden." : "") });
    res.rows.forEach(function (w, i) {
      var f = fdText(w.fd), extra = md[f] ? " " + md[f] : "";
      var snTxt = res.gitt ? (w.sn ? side(w.X) + " inneholder en KN" : side(w.X) + " inneholder ingen KN")
        : plusName(w.X) + " = " + setText(w.plus);
      reveal[i] = 1;
      if (w.sn) { reveal[i] = 4; push({ cur: i, line: 4, tag: f, text: "Spørsmål 1: " + esc(snTxt) + ". Venstresiden er SN, så FD-en gir <b>BCNF</b>." + extra }); return; }
      push({ cur: i, line: 4, tag: f, text: "Spørsmål 1: " + esc(snTxt) + ". Ikke SN, så BCNF er brutt. Videre til spørsmål 2." });
      reveal[i] = 2;
      if (w.nokkel) { reveal[i] = 4; push({ cur: i, line: 5, tag: f, text: "Spørsmål 2: " + esc(w.A) + " er et nøkkelattributt. FD-en gir <b>3NF</b>." + extra }); return; }
      push({ cur: i, line: 5, tag: f, text: "Spørsmål 2: " + esc(w.A) + " er ikke med i noen KN, så 3NF er brutt. Videre til spørsmål 3." });
      reveal[i] = 4;
      push({ cur: i, line: w.del ? 6 : 7, tag: f, text: "Spørsmål 3: " + (w.del
        ? esc(side(w.X)) + " er en ekte del av KN-en " + esc(setText(w.delKN)) + ". 2NF er brutt, så FD-en gir <b>1NF</b>."
        : esc(side(w.X)) + " er ikke en ekte del av noen KN. 2NF holder, så FD-en gir <b>2NF</b>.") + extra });
    });
    push({ cur: res.svakest ? res.rows.indexOf(res.svakest) : -1, line: 8, final: true, tag: "Resultat",
      text: esc(r.navn) + " er på <b>" + res.nf + "</b>" + (res.svakest ? ", fordi " + esc(fdText(res.svakest.fd)) + " er den svakeste FD-en." : ": alle FD-ene har SN på venstresiden.") });
    return out;
  }
  F.nfSteps = nfSteps;
  function renderNF(s, ctx) {
    var st = ctx.stage;
    if (s.error) { errStage(st, s.error); return; }
    IN.clear(st);
    var res = s.res, box = E("div", { class: "fdv fdv-nf" });
    box.appendChild(headEl(s.rel));
    box.appendChild(E("p", { class: "small" }, [
      E("b", { text: res.gitt ? "KN (oppgitt): " : "KN: " }), E("span", { class: "mono", text: knList(res.kn) }),
      " · ", E("b", { text: "Nøkkelattributter: " }), E("span", { class: "mono", text: listText(res.nokkelattr) })
    ]));
    var tb = E("tbody");
    res.rows.forEach(function (w, i) {
      var rv = s.reveal[i];
      function cell(n, txt) { return E("td", { class: rv >= n ? null : "muted" }, rv >= n ? txt : ""); }
      var c1 = w.sn ? "ja" : "nei" + (w.plus ? " (" + plusName(w.X) + " = " + setText(w.plus) + ")" : "");
      var c2 = w.sn ? "–" : (w.nokkel ? "ja" : "nei");
      var c3 = w.sn || w.nokkel ? "–" : (w.del ? "ja, " + side(w.X) + " ⊂ " + side(w.delKN) : "nei");
      tb.appendChild(E("tr", { class: i === s.cur ? "cur" : null }, [
        E("td", { class: "mono", text: fdText(w.fd) }),
        cell(1, E("span", { class: "small", text: c1 })), cell(2, E("span", { class: "small", text: rv >= 4 && w.sn ? "–" : c2 })),
        cell(3, E("span", { class: "small", text: rv >= 4 && (w.sn || w.nokkel) ? "–" : c3 })),
        E("td", null, rv >= 4 ? [pill(w.nf)] : "")
      ]));
    });
    box.appendChild(E("div", { class: "table-wrap" }, [E("table", { class: "cmp-table fdv-nftab" }, [
      E("thead", null, [E("tr", null, [E("th", { text: "FD" }), E("th", { text: "1. X SN?" }), E("th", { text: "2. A nøkkelattr.?" }),
        E("th", { text: "3. X ekte del av KN?" }), E("th", { text: "NF" })])]), tb
    ])]));
    if (s.final) box.appendChild(E("p", { class: "fdv-verdict" }, [E("b", { text: s.rel.navn + " er på " }), pill(res.nf)]));
    st.appendChild(box);
  }
  Demo.nf = function (spHost, pcHost) {
    var pc = pseudoFor(pcHost, "nf");
    return IN.stepPlayer(host(spHost), {
      presets: {
        "Billett": [{ rel: EX.billett, md: MD.nfBillett }],
        "Bokstaver (alle fire nivåer)": [{ rel: EX.tillEks2 }],
        "KN gitt: {A, B}": [{ rel: EX.nfEks3, kn: [["A", "B"]] }],
        "H2019 3.2": [{ rel: EX.h2019_32, kn: [["A", "B"]] }],
        "H2020 R2": [{ rel: EX.h2020_R2 }],
        "H2024 3.2": [{ rel: EX.h2024_32, kn: [["A", "C", "E"], ["B", "C", "E"]] }],
        "H2025 3.2b": [{ rel: EX.h2025 }]
      },
      generate: function (inp) { return nfSteps(inp[0]); },
      render: renderNF,
      parseInput: specInput(),
      inputLabel: "ABCDE; AB->C, C->D  (valgfritt: ; KN=AB)",
      inputAria: "Egen relasjon, FD-er og eventuelt oppgitte KN",
      pseudo: pc
    });
  };
  /* Hele relasjonens NF (fane nf-relasjon): samme spiller, andre eksempler, uten pseudokode. */
  Demo.nfRelasjon = function (spHost) {
    return IN.stepPlayer(host(spHost), {
      presets: {
        "AB → C, C → A, B → D": [{ rel: EX.relEks1 }],
        "Før: AB → C, C → D": [{ rel: EX.relEks2 }],
        "Etter: + C → A, C → B": [{ rel: EX.relEks2b }],
        "Trening": [{ rel: EX.trening }]
      },
      generate: function (inp) { return nfSteps(inp[0]); },
      render: renderNF,
      parseInput: specInput(),
      inputLabel: "ABC; AB->C, C->A",
      inputAria: "Egen relasjon og FD-er"
    });
  };

  /* ---------- BCNF-dekomposisjon ---------- */
  function bcnfSteps(cfg) {
    if (cfg.error) return [{ error: cfg.error }];
    var r = cfg.rel, opts = { prefix: cfg.prefix, navn: cfg.navn, velg: cfg.velg ? { "": cfg.velg } : null };
    var res = F.bcnf(r.navn, r.attrs, r.fds, opts), tx = cfg.tekst || [], out = [];
    res.nodes.forEach(function (n, i) {
      var t = tx[i];
      if (!t) {
        var borte = n.borte.length ? "Borte fra forelderen: " + esc(n.borte.map(fdText).join(", ")) + " (ikke alle attributtene er med). " : "";
        var knT = "KN: " + esc(knList(n.kn)) + ". ";
        if (n.children.length) {
          t = borte + knT + esc(fdText(n.valgt)) + " bryter BCNF, fordi " + esc(plusName(n.Y)) + " = " + esc(setText(n.Yplus)) + " ikke er hele " + esc(n.navn) +
            ". S₁ = " + esc(plusName(n.Y)) + " gir " + esc(relText(n.children[0].navn, n.children[0].attrs)) + ". S₂ = " + esc(side(n.Y)) +
            " pluss det som ikke er i " + esc(plusName(n.Y)) + ", altså " + esc(relText(n.children[1].navn, n.children[1].attrs)) + ".";
        } else {
          t = borte + knT + (n.fds.length ? "Alle venstresidene er SN i " + esc(n.navn) + ", så den er på BCNF." :
            esc(n.navn) + " har ingen ikke-trivielle FD-er igjen. Den er på BCNF, og KN er alle attributtene.");
        }
      }
      if (!n.projOK) t += " <i>Merk: en full projeksjon av FD-ene gir et annet svar for " + esc(n.navn) + " (KN " + esc(knList(n.fullKN)) + "). Kursets oppgaver er laget slik at dette ikke skjer.</i>";
      out.push({ res: res, rel: r, cur: i, line: n.children.length ? 5 : 2, tag: n.navn + (n.children.length ? ": dekomponer" : ": BCNF"), text: t });
    });
    out.push({ res: res, rel: r, cur: res.nodes.length, final: true, line: 7, tag: "Resultat",
      text: tx[res.nodes.length] || (res.root.children.length ? esc(res.resultat) + ". Hvert steg er tapsfritt etter Fagins teorem: Y er felles og bestemmer hele S₁."
        : esc(r.navn) + " er allerede på BCNF, så ingen dekomposisjon trengs.") });
    return out;
  }
  F.bcnfSteps = bcnfSteps;
  function renderBCNF(s, ctx) {
    var st = ctx.stage;
    if (s.error) { errStage(st, s.error); return; }
    IN.clear(st);
    var res = s.res, box = E("div", { class: "fdv fdv-bcnf" });
    function nodeEl(n) {
      var li = E("li"), visited = n.idx <= s.cur;
      var nb = E("div", { class: "fdv-node" + (n.idx === s.cur ? " cur" : "") + (visited ? "" : " pending") + (visited && !n.children.length ? " ok" : "") });
      nb.appendChild(E("div", { class: "nm mono", html: "<b>" + esc(n.navn) + "</b>(" + esc(n.attrs.join(", ")) + ")" }));
      if (visited) {
        nb.appendChild(E("div", { class: "small" }, [E("span", { class: "k", text: "FD: " }), E("span", { class: "mono", text: grouped(n.fds) || "ingen" })]));
        nb.appendChild(E("div", { class: "small" }, [E("span", { class: "k", text: "KN: " }), E("span", { class: "mono", text: knList(n.kn) })]));
        if (n.children.length) nb.appendChild(E("div", { class: "st small" }, [pill("1NF", "brudd"), " ",
          E("span", { class: "mono", text: fdText(n.valgt) + " · " + plusName(n.Y) + " = " + setText(n.Yplus) })]));
        else nb.appendChild(E("div", { class: "st small" }, [pill("BCNF", "BCNF ✓")]));
      } else nb.appendChild(E("div", { class: "small muted", text: "ikke sjekket ennå" }));
      li.appendChild(nb);
      if (n.children.length && visited) {
        var ul = E("ul");
        n.children.forEach(function (c) { ul.appendChild(nodeEl(c)); });
        li.appendChild(ul);
      }
      return li;
    }
    box.appendChild(E("div", { class: "fdv-head" }, [E("span", { class: "fdv-rel mono", text: relText(s.rel.navn, s.rel.attrs) }), fdListEl(s.rel, "inline")]));
    box.appendChild(E("ul", { class: "fdv-tree" }, [nodeEl(res.root)]));
    if (s.final) box.appendChild(E("p", { class: "fdv-verdict mono", text: res.root.children.length ? res.resultat : s.rel.navn + " er på BCNF" }));
    st.appendChild(box);
  }
  Demo.bcnf = function (spHost, pcHost) {
    var pc = pseudoFor(pcHost, "bcnf");
    return IN.stepPlayer(host(spHost), {
      presets: {
        "A → B, B → C, D → E, AD → F": [{ rel: EX.bcnfEks1, tekst: MD.bcnfEks1 }],
        "Billett": [{ rel: EX.billett, navn: EX.billettNavn, tekst: MD.bcnfBillett }],
        "Trening (3NF)": [{ rel: EX.trening }],
        "H2020 R3": [{ rel: EX.h2020_R3, prefix: "T" }],
        "H2023 3.3": [{ rel: EX.h2023_33 }],
        "H2024 3.3": [{ rel: EX.h2024_33 }],
        "H2025 3.3 (videre til BCNF)": [{ rel: EX.h2025, prefix: "R" }],
        "Velg C → D": [{ rel: EX.quizBcnf, velg: "C → D" }]
      },
      generate: function (inp) { return bcnfSteps(inp[0]); },
      render: renderBCNF,
      parseInput: specInput(),
      inputLabel: "ABCDEF; A->B, B->C, D->E, AD->F  (valgfritt: ; velg=D->E)",
      inputAria: "Egen relasjon og FD-er for BCNF-dekomposisjon",
      pseudo: pc
    });
  };

  /* ---------- FD-er og instanser ---------- */
  function instStep(navn, cols, rows, fd, tekst, extra) {
    var chk = F.checkInstance(cols, rows, [fd]).fd[0], marks = {}, celler = {};
    var li = fd.lhs.map(function (a) { return cols.indexOf(a); }), ri = fd.rhs.map(function (a) { return cols.indexOf(a); });
    var gr = extra && extra.gruppe != null ? chk.grupper.filter(function (g) { return g.verdi === String(extra.gruppe); })[0] : null;
    var brRows = [];
    chk.brudd.forEach(function (b) { brRows = union(brRows, b.rader); });
    if (gr) gr.rader.forEach(function (i) { marks[i] = has(brRows, i) ? "brudd" : "keep"; });
    else {
      chk.grupper.forEach(function (g) { if (g.rader.length > 1) g.rader.forEach(function (i) { marks[i] = has(brRows, i) ? "brudd" : "keep"; }); });
    }
    Object.keys(marks).forEach(function (i) {
      li.forEach(function (j) { celler[i + "," + j] = "hit"; });
      if (marks[i] === "brudd") ri.forEach(function (j) { celler[i + "," + j] = "hit"; });
    });
    if (!tekst) {
      var multi = chk.grupper.filter(function (g) { return g.rader.length > 1; });
      if (chk.brudd.length) {
        var b = chk.brudd[0];
        tekst = "To rader har " + esc(side(fd.lhs)) + " = " + esc(b.gruppe) + ", men ulik " + esc(b.kol) + " (" +
          b.verdier.map(function (v) { return isNull(v) ? "NULL" : esc(v); }).join(" og ") + "). " + esc(fdText(fd)) + " er brutt." +
          (b.verdier.some(isNull) ? " NULL regnes som ukjent (H2025-konvensjonen)." : "");
      } else if (multi.length) {
        tekst = "Radene med lik " + esc(side(fd.lhs)) + " (" + esc(multi.map(function (g) { return g.verdi; }).join("; ")) + ") har også lik " + esc(side(fd.rhs)) + ". Ingen brudd.";
      } else tekst = "Ingen to rader har lik " + esc(side(fd.lhs)) + ", så " + esc(fdText(fd)) + " kan ikke brytes her.";
    }
    return { navn: navn, cols: cols, rows: rows, fd: fd, ok: chk.ok, marks: marks, celler: celler, tag: navn + " · " + fdText(fd), text: tekst };
  }
  function instSummary(rel, inst, cols) {
    var rad = Object.keys(inst).map(function (k) {
      var c = F.checkInstance(cols, inst[k], rel.fds), brutt = c.fd.filter(function (x) { return !x.ok; }).map(function (x) { return fdText(x.fd); });
      return { navn: k, brutt: brutt };
    });
    return { summary: rad, tag: "Oppsummert",
      text: "En instans kan bare <b>motbevise</b> en FD. «NEI» betyr bare at akkurat disse radene ikke bryter FD-ene." };
  }
  function instSteps(cfg) {
    var r = cfg.rel, cols = cfg.cols || r.attrs, out = [];
    if (cfg.md) {
      cfg.md.forEach(function (m) {
        var fd = parseFD(m.fd), rows = cfg.inst[m.instans];
        out.push(instStep("Instans " + m.instans, cols, rows, fd, m.tekst, { gruppe: m.gruppe }));
      });
    } else {
      Object.keys(cfg.inst).forEach(function (k) {
        r.fds.forEach(function (fd) { out.push(instStep(k, cols, cfg.inst[k], fd)); });
      });
    }
    out.push(instSummary(r, cfg.inst, cols));
    return out;
  }
  F.instSteps = instSteps;
  function renderInst(s, ctx) {
    var st = ctx.stage; IN.clear(st);
    var box = E("div", { class: "fdv fdv-inst" });
    if (s.summary) {
      var tb = E("tbody");
      s.summary.forEach(function (x) {
        tb.appendChild(E("tr", null, [E("td", { text: x.navn }),
          E("td", null, [x.brutt.length ? pill("1NF", "JA, bryter") : pill("BCNF", "NEI")]),
          E("td", { class: "mono small", text: x.brutt.length ? x.brutt.join(", ") : "–" })]));
      });
      box.appendChild(E("div", { class: "table-wrap" }, [E("table", { class: "cmp-table" }, [
        E("thead", null, [E("tr", null, [E("th", { text: "Instans" }), E("th", { text: "Bryter FD-ene?" }), E("th", { text: "Brutt FD" })])]), tb])]));
      st.appendChild(box); return;
    }
    box.appendChild(E("p", { class: "fdv-now" }, [E("b", { text: s.navn + " " }), E("span", { class: "mono", text: fdText(s.fd) }), " ",
      s.ok ? pill("BCNF", "holder her") : pill("1NF", "brutt")]));
    IN.vizTable(box, { kolonner: s.cols, rader: s.rows, marks: { rader: s.marks, celler: s.celler } }, { compact: true });
    st.appendChild(box);
  }
  Demo.instans = function (spHost) {
    var h25 = mkRel("R", "ABCD", ["A → B", "B → C"]);
    return IN.stepPlayer(host(spHost), {
      presets: {
        "Vakt (eksempel A)": [{ rel: EX.vakt, inst: VAKT_INST, md: VAKT_MD }],
        "Vakt (alle FD-er)": [{ rel: EX.vakt, inst: VAKT_INST }],
        "H2025 3.1": [{ rel: h25, inst: H25_INST }]
      },
      customInput: false,
      generate: function (inp) { return instSteps(inp[0]); },
      render: renderInst,
      legend: [{ color: "var(--color-tone-ok)", label: "lik venstreside, lik høyreside" }, { color: "var(--color-tone-danger)", label: "lik venstreside, ulik høyreside (brudd)" }]
    });
  };

  /* ---------- Fyll inn «?» ---------- */
  function fillSteps(cfg) {
    var r = cfg.rel, res = F.fill(r.attrs, cfg.rows, r.fds), tx = cfg.tekst || [], out = [], q = {};
    cfg.rows.forEach(function (row, i) { row.forEach(function (v, j) { if (v === "?") q[i + "," + j] = "hit"; }); });
    out.push({ cols: r.attrs, rows: cfg.rows, marks: {}, celler: q, tag: "Start",
      text: tx[0] || "Hver «?» skal få den eneste verdien som gjør at instansen oppfyller FD-ene. Finn en FD med den ukjente kolonnen på høyresiden og en annen rad med samme venstreside." });
    res.steps.forEach(function (s, k) {
      var marks = {}, celler = {};
      marks[s.rad] = "new";
      s.match.forEach(function (j) { marks[j] = "hit"; });
      celler[s.rad + "," + s.kol] = "hit";
      var lhsV = s.fd.lhs.map(function (a) { return a + " = " + s.rader[s.rad][r.attrs.indexOf(a)]; }).join(", ");
      out.push({ cols: r.attrs, rows: s.rader, marks: marks, celler: celler, tag: "r" + (s.rad + 1) + "." + r.attrs[s.kol] + " = " + s.verdi + " (" + fdText(s.fd) + ")",
        text: tx[k + 1] || ("r" + (s.rad + 1) + " har " + esc(lhsV) + ". " + s.match.map(function (j) { return "r" + (j + 1); }).join(" og ") +
          " har det samme og " + esc(r.attrs[s.kol]) + " = " + esc(s.verdi) + ", så " + esc(fdText(s.fd)) + " krever " + esc(r.attrs[s.kol]) + " = " + esc(s.verdi) + ".") });
    });
    out.push({ cols: r.attrs, rows: res.rows, marks: {}, celler: {}, tag: "Kontroll", ok: res.check.ok,
      text: tx[res.steps.length + 1] || ((res.check.ok ? "Sjekk at de nye verdiene ikke skaper brudd: ingen FD er brutt i den utfylte tabellen." : "Obs: den utfylte tabellen bryter en FD.") +
        (res.rest ? " " + res.rest + " celle(r) kunne ikke avgjøres." : "")) });
    return out;
  }
  F.fillSteps = fillSteps;
  function renderFill(s, ctx) {
    var st = ctx.stage; IN.clear(st);
    var box = E("div", { class: "fdv fdv-fill" });
    var navn = s.rows.map(function (r, i) { return ["r" + (i + 1)].concat(r); });
    var marks = {}, celler = {};
    Object.keys(s.marks).forEach(function (k) { marks[k] = s.marks[k]; });
    Object.keys(s.celler).forEach(function (k) { var p = k.split(","); celler[p[0] + "," + (+p[1] + 1)] = s.celler[k]; });
    IN.vizTable(box, { kolonner: ["rad"].concat(s.cols), rader: navn, marks: { rader: marks, celler: celler } }, { compact: true });
    if (s.ok != null) box.appendChild(E("p", { class: "fdv-verdict" }, [s.ok ? pill("BCNF", "ingen brudd") : pill("1NF", "brudd")]));
    st.appendChild(box);
  }
  Demo.fyll = function (spHost) {
    return IN.stepPlayer(host(spHost), {
      presets: {
        "Eksempel B": [{ rel: EX.fyllB, rows: FYLL.B, tekst: [
          "R(A, B, C, D, E) med AB → C, C → D, D → A og E → B. E står ikke på noen høyreside, så E kan aldri fylles inn fra FD-ene.",
          "r3 har D = 4. r1 har også D = 4 og A = 1, så D → A krever A = 1.",
          "r4 har E = 5, som r1. Der er B = 2, så E → B krever B = 2.",
          "r5 har samme A og B som r1 (1 og 2), så AB → C krever C = 3.",
          "r6 har C = 7. r2 og r4 har også C = 7, og begge har D = 8.",
          "Sjekk at de nye verdiene ikke skaper brudd. D = 8 i r6 krever A = 6 via D → A, og r6 har A = 6. Ingen FD er brutt."
        ] }],
        "H2023 3.2": [{ rel: EX.h2023_32, rows: FYLL.H2023 }]
      },
      customInput: false,
      generate: function (inp) { return fillSteps(inp[0]); },
      render: renderFill,
      legend: [{ color: "var(--color-tone-info)", label: "raden som fylles inn" }, { color: "var(--color-tone-ok)", label: "rad med samme venstreside" }]
    });
  };

  /* ---------- Billett: holder FD-en i dataene? (fane fd-begrep) ---------- */
  var BILLETT_RADER = (F.BILLETT_RADER = [
    [1, "K1", 12, "Ola", "ola@x.no", "Aurora", "Sentrum", "2026-03-01"],
    [2, "K1", 13, "Kari", "kari@x.no", "Aurora", "Sentrum", "2026-03-01"],
    [3, "K2", 12, "Ola", "ola@x.no", "Sigrid", "Rockefeller", "2026-03-02"],
    [4, "K3", 1, "Per", "per@x.no", "Aurora", "Sentrum", "2026-03-09"]
  ]);
  var BILLETT_KAND = (F.BILLETT_KAND = [
    { fd: "konsert → artist", regel: true, tekst: "FD2 sier at en konsert har én artist. K1 står to ganger, begge med Aurora." },
    { fd: "artist → konsert", regel: false, tekst: "Ikke en FD: én artist kan holde flere konserter. Aurora står med både K1 og K3, så dataene motbeviser den." },
    { fd: "kjøper → epost", regel: true, tekst: "FD5. Ola står to ganger, begge med samme adresse." },
    { fd: "sete → konsert", regel: false, tekst: "Ikke en FD: sete 12 finnes på flere konserter (K1 og K2)." },
    { fd: "billettnr → konsert", regel: true, tekst: "Fra FD1. Ingen to rader har samme billettnr, så den kan ikke brytes her. Instansen kan heller ikke bevise den." },
    { fd: "scene → artist", regel: false, tekst: "Ikke oppgitt, og den holder tilfeldigvis i disse radene (Sentrum har bare Aurora). En instans kan ikke bevise en FD. Neste konsert på Sentrum kan ha en annen artist." }
  ]);
  Demo.billettSjekk = function (h) {
    h = host(h); if (!h) return;
    var B = EX.billett, wrap = E("div", { class: "fdv fdv-sjekk card" });
    var sel = E("select", { "aria-label": "Velg en FD å sjekke", onchange: function () { paint(); } });
    BILLETT_KAND.forEach(function (k, i) { sel.appendChild(E("option", { value: String(i), text: k.fd })); });
    var out = E("div", { "aria-live": "polite" });
    wrap.appendChild(E("label", { class: "small" }, ["Sjekk ", sel, " mot radene:"]));
    wrap.appendChild(out);
    function paint() {
      IN.clear(out);
      var k = BILLETT_KAND[+sel.value], fd = parseFD(k.fd), s = instStep("Billett", B.attrs, BILLETT_RADER, fd, " ");
      out.appendChild(E("p", null, [s.ok ? pill("BCNF", "brytes ikke her") : pill("1NF", "brutt i dataene"), " ",
        k.regel ? pill("3NF", "er en regel i skjemaet") : pill("2NF", "ikke en regel")]));
      IN.vizTable(out, { kolonner: B.attrs, rader: BILLETT_RADER, marks: { rader: s.marks, celler: s.celler } }, { compact: true });
      out.appendChild(E("p", { class: "small", text: k.tekst }));
    }
    paint();
    h.appendChild(wrap);
  };

  /* ---------- Tapsfri dekomposisjon ---------- */
  var VAKT3 = (F.VAKT3 = { kolonner: ["ansatt", "avdeling", "etasje"], rader: [["Per", "Lager", 1], ["Kari", "Kasse", 1]] });
  function tapsSteps() {
    var T = VAKT3, a1 = F.project(T, ["ansatt", "etasje"]), a2 = F.project(T, ["avdeling", "etasje"]), j1 = F.njoin(a1, a2);
    var b1 = F.project(T, ["avdeling", "etasje"]), b2 = F.project(T, ["ansatt", "avdeling"]), j2 = F.njoin(b2, b1);
    function orig(row) { return T.rader.some(function (r) { return T.kolonner.every(function (c, i) { return String(r[i]) === String(row[j1.kolonner.indexOf(c)]); }); }); }
    var falske = {};
    j1.rader.forEach(function (r, i) { falske[i] = orig(r) ? "keep" : "drop"; });
    var j2v = { kolonner: T.kolonner, rader: j2.rader.map(function (r) { return T.kolonner.map(function (c) { return r[j2.kolonner.indexOf(c)]; }); }) };
    return [
      { tabs: [{ navn: "Vakt", t: T }], tag: "Utgangspunkt", text: "Vakt(ansatt, avdeling, etasje) med ansatt → avdeling og avdeling → etasje. To rader." },
      { tabs: [{ navn: "S₁ = π<sub>ansatt, etasje</sub>", t: a1 }, { navn: "S₂ = π<sub>avdeling, etasje</sub>", t: a2 }], tag: "Dårlig deling: felles etasje",
        text: "Del på etasje. Alle attributtene er med, men fellesattributtet etasje bestemmer verken ansatt eller avdeling." },
      { tabs: [{ navn: "S₁ ⋈ S₂", t: j1, marks: falske }], tag: "Join gir falske rader",
        text: "Joinen gir " + j1.rader.length + " rader. " + Object.keys(falske).filter(function (k) { return falske[k] === "drop"; }).length +
          " av dem fantes ikke (overstreket). Vi vet ikke lenger hvor Per jobber. Flere rader betyr mindre kunnskap: det er dette «tap» betyr." },
      { tabs: [{ navn: "S₁ = π<sub>avdeling, etasje</sub>", t: b1 }, { navn: "S₂ = π<sub>ansatt, avdeling</sub>", t: b2 }], tag: "God deling: felles avdeling",
        text: "Del i stedet på avdeling → etasje, slik BCNF-algoritmen gjør: avdeling⁺ = {avdeling, etasje} blir S₁. Fellesattributtet avdeling bestemmer hele resten av S₁." },
      { tabs: [{ navn: "S₂ ⋈ S₁", t: j2v }], tag: "Join gir originalen",
        text: "Joinen gir nøyaktig de " + j2v.rader.length + " opprinnelige radene. Fagins teorem: fellesattributtet bestemmer resten av én av delene, så dekomposisjonen er tapsfri for alle lovlige instanser." }
    ];
  }
  F.tapsSteps = tapsSteps;
  Demo.tapsfri = function (spHost) {
    return IN.stepPlayer(host(spHost), {
      initial: [1], customInput: false,
      generate: function () { return tapsSteps(); },
      render: function (s, ctx) {
        var st = ctx.stage; IN.clear(st);
        var box = E("div", { class: "fdv fdv-taps" }), row = E("div", { class: "fdv-tabs" });
        s.tabs.forEach(function (x) {
          var cell = E("div");
          IN.vizTable(cell, { navn: x.navn, kolonner: x.t.kolonner, rader: x.t.rader, marks: x.marks ? { rader: x.marks } : null }, { compact: true });
          row.appendChild(cell);
        });
        box.appendChild(row); st.appendChild(box);
      },
      legend: [{ color: "var(--color-tone-ok)", label: "ekte rad" }, { color: "var(--color-tone-danger)", label: "falsk rad fra joinen" }]
    });
  };

  /* ---------- Svarmal-generator (fane svarform) ---------- */
  Demo.svar = function (h) {
    h = host(h); if (!h) return;
    var PRE = {
      bcnf: {
        "A → B, B → C, D → E, AD → F": { rel: EX.bcnfEks1 },
        "Billett": { rel: EX.billett, navn: EX.billettNavn },
        "H2023 3.3": { rel: EX.h2023_33 },
        "H2024 3.3": { rel: EX.h2024_33 },
        "H2020 R3": { rel: EX.h2020_R3, prefix: "T" }
      },
      nf: {
        "Bokstaver (alle fire nivåer)": { rel: EX.tillEks2 },
        "Billett": { rel: EX.billett },
        "AB → C, C → A, B → D": { rel: EX.relEks1 },
        "H2024 3.2 (KN oppgitt)": { rel: EX.h2024_32, kn: [["A", "C", "E"], ["B", "C", "E"]] }
      }
    };
    var type = "bcnf", wrap = E("div", { class: "fdv fdv-svar card" });
    var tSel = E("select", { "aria-label": "Type svar", onchange: function () { type = tSel.value; fillPresets(); paint(PRE[type][pSel.value]); } }, [
      E("option", { value: "bcnf", text: "BCNF-dekomposisjon" }), E("option", { value: "nf", text: "Normalform" })]);
    var pSel = E("select", { "aria-label": "Eksempel", onchange: function () { paint(PRE[type][pSel.value]); } });
    var fld = E("input", { type: "text", class: "mono", placeholder: "ABCDE; B->E, AB->C, E->D, C->A", "aria-label": "Egen relasjon og FD-er" });
    var go = E("button", { class: "btn sm", type: "button", text: "Lag svar", onclick: function () {
      var p = F.parseSpec(fld.value);
      if (p.error) { IN.clear(out); out.appendChild(E("p", { class: "fdv-err", html: p.error })); return; }
      paint({ rel: p.rel, kn: p.kn, velg: p.velg });
    } });
    fld.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go.click(); } });
    var out = E("div", { "aria-live": "polite" });
    function fillPresets() {
      IN.clear(pSel);
      Object.keys(PRE[type]).forEach(function (k) { pSel.appendChild(E("option", { value: k, text: k })); });
    }
    function paint(cfg) {
      IN.clear(out);
      var txt = type === "bcnf" ? F.svarBCNF(cfg.rel, { prefix: cfg.prefix, navn: cfg.navn, velg: cfg.velg ? { "": cfg.velg } : null })
        : F.svarNF(cfg.rel, { kn: cfg.kn });
      out.appendChild(E("pre", { class: "fdv-pre", text: txt }));
    }
    wrap.appendChild(E("div", { class: "btn-row" }, [E("label", { class: "small" }, ["Svar for ", tSel]), E("label", { class: "small" }, ["Eksempel ", pSel])]));
    wrap.appendChild(E("div", { class: "btn-row" }, [E("span", { class: "small", text: "Eget:" }), fld, go]));
    wrap.appendChild(out);
    fillPresets(); paint(PRE[type][pSel.value]);
    h.appendChild(wrap);
  };

  /* ================================================================
     10. Øving: flervalg per fane og sant/usant
     ================================================================ */
  IN.dataFd = {
    faner: { "fd-begrep": "Hva er en FD?", "fd-instans": "FD-er og instanser", tillukning: "Tillukning", nokler: "Nøkler", "finn-kn": "Finn alle KN" },
    quiz: {
      "fd-begrep": [
        { q: "Billett har billettnr → konsert og konsert → artist. Hvilken FD følger av disse to?",
          options: ["artist → billettnr", "billettnr → artist", "konsert → billettnr", "artist → konsert"], answer: 1,
          explain: "Transitivitet: billettnr bestemmer konsert, og konsert bestemmer artist, så billettnr bestemmer artist. FD-er gjelder bare i pilens retning." },
        { q: "Hva betyr FD-en AB → C?",
          options: ["A → C eller B → C", "To rader med lik A og lik B har lik C", "To rader med lik C har lik A og lik B", "A og B er kandidatnøkler"], answer: 1,
          explain: "Venstresiden er mengden {A, B}. Det er kombinasjonen som bestemmer C, ikke hver av dem alene." }
      ],
      "fd-instans": [
        { q: "R(A, B, C) med FD-en A → B. Hvilken instans bryter FD-en?",
          options: ["(1, x, p), (2, x, q)", "(1, x, p), (1, x, q)", "(1, x, p), (1, y, p)", "(1, x, p), (2, y, p)"], answer: 2,
          explain: "Bare der to rader har lik A og ulik B: A = 1 med både x og y. Lik B for ulik A (første alternativ) er lov." },
        { q: "R(A, B, C) med FD-en B → C har radene (1, x, 5) og (2, x, ?). Hva må ? være?",
          options: ["5", "1", "2", "Kan ikke avgjøres"], answer: 0,
          explain: "Begge radene har B = x, så B → C krever samme C: 5." }
      ],
      tillukning: [
        { q: "R(A, B, C, D, E) har FD-ene A → C, C → D og BD → E. Hva er {A, B}⁺?",
          options: ["{A, B, C}", "{A, B, C, D}", "{A, B, C, D, E}", "{A, B}"], answer: 2,
          explain: "A → C gir C, og C → D gir D. Nå er både B og D med, så BD → E gir E. Alt er med." }
      ],
      nokler: [
        { q: "I Billett er KN-ene {billettnr}, {konsert, sete} og {scene, dato, sete}. Hvilket attributt er IKKE et nøkkelattributt?",
          options: ["sete", "scene", "kjøper", "konsert"], answer: 2,
          explain: "kjøper står på venstresiden i kjøper → epost, men er ikke med i noen KN. De tre andre er med i minst én." }
      ],
      "finn-kn": [
        { q: "R(A, B, C, D, E) har FD-ene A → C, C → D og BD → E. Hvilke KN-er har R?",
          options: ["Bare {A}", "Bare {A, B}", "{A, B} og {B, D}", "{A, B, D}"], answer: 1,
          explain: "A og B står aldri til høyre og er derfor med i alle KN. {A, B}⁺ = R, så {A, B} er eneste KN. {B, D}⁺ = {B, D, E} mangler A." },
        { q: "R(A, B, C, D) har FD-ene A → B, BC → D og D → A. Hvilke KN-er har R?",
          options: ["Bare {A, C}", "{A, C}, {B, C} og {C, D}", "Bare {C}", "{A, C} og {B, C}"], answer: 1,
          explain: "C står aldri til høyre, og C⁺ = {C}. AC, BC og CD gir alle hele R: AC via A → B og BC → D, BC via BC → D og D → A, CD via D → A og A → B. Alle tre er minimale." }
      ]
    },
    tf: [
      { fane: "fd-instans", s: "Hvis FD-en X → A holder i dataene som ligger i tabellen, gjelder den for skjemaet.", answer: false,
        explain: "En instans kan bare motbevise en FD. FD-er er regler for alle lovlige tilstander og må oppgis." },
      { fane: "tillukning", s: "Hvis X → A følger av FD-ene, så er A ∈ X⁺.", answer: true,
        explain: "X⁺ er nettopp alle attributter som X bestemmer." },
      { fane: "nokler", s: "X er en supernøkkel hvis og bare hvis X⁺ inneholder alle attributtene i R.", answer: true,
        explain: "Dette er kursets test for SN." },
      { fane: "nokler", s: "Enhver kandidatnøkkel er en supernøkkel.", answer: true,
        explain: "En KN er en minimal SN." },
      { fane: "nokler", s: "Enhver supernøkkel er en kandidatnøkkel.", answer: false,
        explain: "{billettnr, kjøper} er SN, men ikke minimal." },
      { fane: "finn-kn", s: "Et attributt som aldri står på en høyreside, er med i alle kandidatnøkler.", answer: true,
        explain: "Ingen FD kan utlede det, så uten det blir X⁺ aldri hele R." },
      { fane: "nokler", s: "Et attributt som står på venstresiden i en FD, er alltid et nøkkelattributt.", answer: false,
        explain: "kjøper i Billett og D i eksemplet med A → B, B → A, AC → D, D → E står til venstre, men er ikke med i noen KN." },
      { fane: "nokler", s: "Et nøkkelattributt er et attributt som er med i primærnøkkelen.", answer: false,
        explain: "Det holder å være med i minst én KN. sete er nøkkelattributt i Billett selv om PN kan være {billettnr}." },
      { fane: "fd-begrep", s: "AB → A er en triviell FD.", answer: true,
        explain: "Høyresiden står allerede på venstresiden." },
      { fane: "fd-begrep", s: "Hvis X → Y og Y → Z, så gjelder X → Z.", answer: true,
        explain: "FD-er er transitive." },
      { fane: "finn-kn", s: "Hvis ingen attributter er i «alltid med»-gruppen, har relasjonen ingen kandidatnøkkel.", answer: false,
        explain: "R er alltid en SN, så det finnes alltid minst én KN. Billett har tre, selv om «alltid med» er tom." },
      { fane: "tillukning", s: "Tillukningen {A}⁺ kan være lik {A}.", answer: true,
        explain: "Hvis ingen FD har bare A på venstresiden, kommer ingenting til. B⁺ = {B} i eksempel 2." }
    ]
  };
  IN.dataNorm = {
    faner: { normalformer: "Normalformer", "nf-per-fd": "NF per FD", "nf-relasjon": "Hele relasjonen", "bcnf-dekomp": "BCNF-dekomposisjon", tapsfri: "Tapsfri", svarform: "Svarform" },
    quiz: {
      normalformer: [
        { q: "Hvilken FD bryter 3NF, men ikke 2NF, i Billett?",
          options: ["konsert → artist", "konsert → scene", "kjøper → epost", "billettnr → kjøper"], answer: 2,
          explain: "kjøper er ikke SN, og epost er ikke-nøkkel, så 3NF er brutt. kjøper er ikke del av noen KN, så 2NF holder. konsert → artist bryter 2NF, konsert → scene er 3NF, og billettnr → kjøper er BCNF." }
      ],
      "nf-per-fd": [
        { q: "R(A, B, C, D) har KN {A, B}. Hvilken normalform tilsier FD-en B → C alene?",
          options: ["BCNF", "3NF", "2NF", "1NF"], answer: 3,
          explain: "B er ikke SN, C er ikke-nøkkel, og B er en ekte del av KN-en {A, B}. 2NF er brutt, så 1NF." },
        { q: "R(A, B, C, D) har KN {A, B} og {B, C}. Hvilken normalform tilsier FD-en C → A alene?",
          options: ["BCNF", "3NF", "2NF", "1NF"], answer: 1,
          explain: "C er ikke SN, men A er et nøkkelattributt (med i {A, B}). Unntaket i 3NF gjelder." }
      ],
      "nf-relasjon": [
        { q: "FD-ene i en relasjon gir hver for seg BCNF, 3NF og 2NF. Hvilken normalform har relasjonen?",
          options: ["BCNF", "3NF", "2NF", "1NF"], answer: 2,
          explain: "Relasjonen er på den laveste normalformen blant FD-ene." },
        { q: "R(A, B, C) har AB → C og C → A. Hvilken normalform har R?",
          options: ["BCNF", "3NF", "2NF", "1NF"], answer: 1,
          explain: "KN er {A, B} og {B, C}. AB → C har SN på venstresiden. C → A har ikke det, men A er et nøkkelattributt. Laveste er 3NF. Dette er kursets standardeksempel på 3NF uten BCNF." }
      ],
      "bcnf-dekomp": [
        { q: "R(A, B, C, D, E) har AB → C, C → D og D → E (KN {A, B}). Hva blir første steg når du dekomponerer på C → D?",
          options: ["S₁(C, D, E), S₂(A, B, C)", "S₁(C, D), S₂(A, B, C, E)", "S₁(C, D), S₂(A, B, D, E)", "S₁(C, D, E), S₂(A, B)"], answer: 0,
          explain: "C⁺ = {C, D, E} blir S₁. S₂ = C pluss det som ikke er i C⁺, altså A og B. C må være med i begge." }
      ],
      tapsfri: [
        { q: "R(A, B, C) har bare FD-en A → B. Hvilken dekomposisjon er garantert tapsfri?",
          options: ["S₁(A, B), S₂(A, C)", "S₁(A, B), S₂(B, C)", "S₁(A, C), S₂(B, C)", "S₁(A), S₂(B, C)"], answer: 0,
          explain: "Fellesattributtet A bestemmer B, altså hele resten av S₁. Med B felles kan (1, x, p) og (2, x, q) gi fire rader etter join." },
        { q: "Billett deles i Konsert(konsert, artist, scene, dato) og B2(billettnr, konsert, sete, kjøper, epost). Hvilken FD gjør at Fagins teorem gir tapsfrihet?",
          options: ["konsert → artist, scene, dato", "kjøper → epost", "billettnr → kjøper", "scene, dato → konsert"], answer: 0,
          explain: "Fellesattributtet er konsert. Det bestemmer hele resten av Konsert (artist, scene, dato), og da er delingen tapsfri." }
      ],
      svarform: [
        { q: "Hva må du oppgi for hver ny relasjon i en BCNF-dekomposisjon på eksamen?",
          options: ["Bare attributtene", "Attributtene og primærnøkkelen", "Attributtene, FD-ene, KN-ene og om den er på BCNF, med begrunnelse", "Bare sluttresultatet på én linje"], answer: 2,
          explain: "Sensor trekker −1 per manglende eller feil FD og KN, og −3 når forklaringene mangler. Sluttlinjen kommer i tillegg." }
      ]
    },
    tf: [
      { fane: "normalformer", s: "En relasjon på BCNF er også på 3NF.", answer: true,
        explain: "BCNF ⊆ 3NF: er X en SN, holder også 3NF-kravet." },
      { fane: "normalformer", s: "En FD X → A der A er et nøkkelattributt, kan aldri bryte 2NF.", answer: true,
        explain: "2NF stiller bare krav når A er et ikke-nøkkelattributt. En slik FD er alltid minst 3NF." },
      { fane: "nf-per-fd", s: "Hvis X er en supernøkkel, oppfyller X → A BCNF.", answer: true,
        explain: "Det er hele BCNF-kravet." },
      { fane: "nf-relasjon", s: "En relasjon er på den høyeste normalformen som en av FD-ene gir.", answer: false,
        explain: "Den laveste. Normalformen er et krav til alle FD-ene." },
      { fane: "nf-per-fd", s: "B, C → D bryter 2NF når KN er {A, B} og D er et ikke-nøkkelattributt.", answer: false,
        explain: "{B, C} er ikke en delmengde av {A, B}. FD-en bryter 3NF, men ikke 2NF." },
      { fane: "bcnf-dekomp", s: "En relasjon med bare to attributter er alltid på BCNF.", answer: true,
        explain: "En ikke-triviell FD i R(A, B) er A → B eller B → A, og venstresiden er da en SN." },
      { fane: "bcnf-dekomp", s: "I BCNF-algoritmen inneholder S₂ alle attributtene i Y⁺.", answer: false,
        explain: "S₂ = Y ∪ (X − Y⁺). Bare Y fra Y⁺ blir med, resten ligger i S₁." },
      { fane: "tapsfri", s: "BCNF-algoritmen gir alltid en tapsfri dekomposisjon.", answer: true,
        explain: "I hvert steg er Y felles og Y → Y⁺ = S₁. Fagins teorem gir tapsfrihet." },
      { fane: "tapsfri", s: "S₁(A, B) og S₂(A, C) er en tapsfri dekomposisjon av R(A, B, C) dersom A → C.", answer: true,
        explain: "Fagin: fellesattributtet bestemmer resten av én av delene (her S₂)." },
      { fane: "svarform", s: "Et skjema på BCNF er alltid et godt design.", answer: false,
        explain: "Du kan splitte til BCNF og likevel ende med tabeller som burde vært én." },
      { fane: "svarform", s: "ER-realisering garanterer et skjema på BCNF.", answer: false,
        explain: "Bare 1NF er garantert. ER kan ikke uttrykke alle FD-er." },
      { fane: "nf-relasjon", s: "Et skjema med flere tabeller er på den laveste normalformen blant tabellene.", answer: true,
        explain: "Hele skjemaet er ikke sterkere enn den svakeste tabellen." }
    ]
  };
})();
