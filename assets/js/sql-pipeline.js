/* ============================================================
   IN2090 guide · sql-pipeline.js
   SQL-spørringen som en kjede av klausulkort i LOGISK rekkefølge
   (FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT).
   Hvert kort viser klausulteksten og radtallet («6 → 3»). Kortet som er åpent,
   viser mellomtabellen rett under seg. Fanen «Skrives» viser den samme SQL-en i
   skriverekkefølge med samme fargekoding.

   IN.sqlPipeline(host, demo, opts) → { el, modell, goto(i), next(), prev() }
     demo: et IN.dataSql.steg-objekt ({ sql, tabeller, steg:[…] })
           ELLER et trace fra IN.sqlMotor.trace: { steg:[{klausul, tekst, fra:[a,b], kolonner, rader,
           merker:["keep"|"drop"|"new"…], grupper?}] } eller bare lista. Med trace bør opts.sql være satt.
     opts: { id?: "groupBy" (nøkkel i KART; finnes ellers ved oppslag i IN.dataSql.steg),
             kart?: egen kortliste (se KART), sql?: tekst (for trace), tabeller?: inndata (for trace),
             gjett?: false (slår av «Gjett først» helt), start?: trinnindeks,
             panser?: false | function (el, info) }
   Adaptere (rene funksjoner, kan brukes alene):
     IN.sqlPipeline.fraSteg(demo, kart) → modell     IN.sqlPipeline.fraTrace(trace, sql, opts) → modell
     IN.sqlPipeline.segmenter(sql) → [{ key, start, end, l0, l1 }]  (klausulene på toppnivå)
     IN.sqlPipeline.KART: kortoppsettet for de 17 demoene i data-sql.js (klausul per steg).
   Under panseret: finnes IN.sqlPanser, kalles IN.sqlPanser.kort(el, { klausul, steg, demo }) for hvert
   kort som tegnes, med et tomt div.sp-panser som vert. Ellers skjer ingenting.
   Ren DOM, ingen stegspiller, ingen autospill. Klassisk script.
   Lastes etter core.js, sql-lang.js og viz-relation.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var el = IN.el, clear = IN.clear;

  /* ================= Hjelpere ================= */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function tok(s) { return IN.sql && IN.sql.tokenize ? IN.sql.tokenize(s) : esc(s); }
  function colName(c) { return typeof c === "string" ? c : c.navn; }
  function suffix(n) { n = String(n); var i = n.lastIndexOf("."); return (i >= 0 ? n.slice(i + 1) : n).toLowerCase(); }
  function prefix(n) { n = String(n); var i = n.indexOf("."); return i > 0 ? n.slice(0, i).toLowerCase() : ""; }
  function same(a, b) { return a === b || (a != null && b != null && String(a) === String(b)); }
  function rowsOf(t) { return t && t.rader ? t.rader : []; }
  function rowMarks(t) { return (t && t.marks && t.marks.rader) || {}; }
  function hasMark(t, m) { var rm = rowMarks(t); return Object.keys(rm).some(function (k) { return rm[k] === m; }); }
  function countMark(t, m) { var rm = rowMarks(t); return Object.keys(rm).filter(function (k) { return rm[k] === m; }).length; }
  function kept(t) { return rowsOf(t).length - countMark(t, "drop"); }
  function copyT(t, extra) { var o = {}; for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) o[k] = t[k]; if (extra) for (var j in extra) o[j] = extra[j]; return o; }
  function list(arr) { var m = {}; arr.forEach(function (c, i) { if (c) m[i] = c; }); return { rader: m }; }
  function tvVal(v) {
    if (v === true || v === "TRUE") return "TRUE";
    if (v === false || v === "FALSE") return "FALSE";
    return v === null || v === undefined ? "NULL" : null;
  }
  // Sannhetsverdi-kolonne: alle verdier TRUE/FALSE/NULL og minst én TRUE/FALSE
  function tvCols(t) {
    var out = [];
    (t.kolonner || []).forEach(function (c, j) {
      var any = false, ok = rowsOf(t).length > 0;
      rowsOf(t).forEach(function (r) { var v = tvVal(r[j]); if (v === null) ok = false; else if (v !== "NULL") any = true; });
      if (ok && any) out.push(j);
    });
    return out;
  }
  function stripT(t) {   // uten merker og uten sannhetsverdi-kolonner (til «Gjett først»)
    var tv = tvCols(t), keep = (t.kolonner || []).map(function (_, j) { return j; }).filter(function (j) { return tv.indexOf(j) < 0; });
    return { navn: t.navn, kolonner: keep.map(function (j) { return t.kolonner[j]; }), rader: rowsOf(t).map(function (r) { return keep.map(function (j) { return r[j]; }); }), tom: t.tom };
  }
  function utenDrop(t) {
    var rm = rowMarks(t), rader = [], mk = [];
    rowsOf(t).forEach(function (r, i) { if (rm[i] !== "drop") { rader.push(r); mk.push(rm[i] === "new" ? "new" : null); } });
    return { navn: t.navn, kolonner: t.kolonner, rader: rader, marks: list(mk) };
  }
  function grpIds(t) {   // grp1..grpN-merker → gruppeindeks per rad, ellers null
    var rm = rowMarks(t), ids = [], any = false;
    rowsOf(t).forEach(function (_, i) { var m = /^grp(\d+)$/.exec(rm[i] || ""); ids.push(m ? +m[1] - 1 : null); if (m) any = true; });
    return any ? ids : null;
  }
  function uniq(a) { var s = {}, o = []; a.forEach(function (x) { var k = String(x); if (!s[k]) { s[k] = 1; o.push(x); } }); return o; }
  function plur(n, en, flere) { return n + " " + (n === 1 ? en : flere); }
  var touch = !!(window.matchMedia && !matchMedia("(hover: hover) and (pointer: fine)").matches);

  /* ================= Klausuler og segmenter ================= */
  var KL = {
    "WITH": "with", "FROM": "from", "WHERE": "where", "DELSPØRRING": "where", "GROUP BY": "group", "HAVING": "having",
    "SELECT": "select", "ORDER BY": "order", "LIMIT": "limit", "UPDATE": "endre", "SET": "endre", "DELETE": "endre",
    "UNION": "mengde", "UNION ALL": "mengde", "INTERSECT": "mengde", "INTERSECT ALL": "mengde", "EXCEPT": "mengde", "EXCEPT ALL": "mengde"
  };
  function klCls(k) { return "spl-k-" + (KL[String(k).toUpperCase()] || "annet"); }
  var SEG_RE = /^(WITH|SELECT|FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET|UPDATE|SET|DELETE|INSERT|UNION|INTERSECT|EXCEPT|(?:(?:INNER|CROSS|NATURAL|(?:LEFT|RIGHT|FULL)(?:\s+OUTER)?)\s+)?JOIN)\b/i;
  function segKey(w) {
    w = w.toUpperCase().replace(/\s+/g, " ");
    if (/JOIN$/.test(w)) return "FROM";
    if (w === "OFFSET") return "LIMIT";
    return w;
  }
  function parenDelta(line) {
    var s = line.replace(/'(?:[^']|'')*'?/g, "").replace(/--.*$/, ""), d = 0;
    for (var i = 0; i < s.length; i++) { if (s[i] === "(") d++; else if (s[i] === ")") d--; }
    return d;
  }
  function segmenter(sql) {
    var lines = String(sql || "").split("\n"), pos = 0, depth = 0, segs = [], cur = null;
    lines.forEach(function (ln, i) {
      var t = ln.replace(/^\s+/, ""), m = depth <= 0 ? SEG_RE.exec(t) : null;
      if (m) {
        var key = segKey(m[1]);
        if (!cur || cur.key !== key || !(key === "FROM" || key === "LIMIT")) {
          cur = { key: key, start: pos + (ln.length - t.length), end: pos + ln.length, l0: i + 1, l1: i + 1 };
          segs.push(cur);
        }
      } else if (!cur && t) {
        cur = { key: "?", start: pos, end: pos + ln.length, l0: i + 1, l1: i + 1 }; segs.push(cur);
      }
      if (cur) { cur.end = pos + ln.length; cur.l1 = i + 1; }
      depth += parenDelta(ln);
      pos += ln.length + 1;
    });
    segs.forEach(function (s) { var txt = sql.slice(s.start, s.end); s.end = s.start + txt.replace(/\s+$/, "").length; });
    return segs;
  }
  function segTekst(sql, s) { return sql.slice(s.start, s.end).replace(/;\s*$/, ""); }

  /* ================= Kortoppsett for de 17 demoene =================
     Hvert kort: { k: klausul, steg: [indekser i demo.steg eller syntetiske steg], vis?: visning eller liste per steg,
       seg?: segmentnøkler (standard [k]), sql?: egen klausultekst, etikett?, gjett?: {steg, svar, valg, sporsmal} | false,
       merke?: tekst i radtall-merket, kolSel?: kolonner som utheves }
     Visninger: tabell (standard), rutenett (kryssprodukt), join (side om side), natural, grupper, having,
       korrelert («for hver ytre rad»), select (projeksjon).
     Syntetiske steg: { syn: "fra", tab: 0 } = inndatatabell nr. 0 som FROM-trinn;
       { syn: "grupper", fra: 1, kol: [0], agg: {navn, kol} } = grupper tabellen i steg 1 på kolonne 0.
     Tekst i syntetiske steg er skrevet her (egne ord) og kan flyttes til data-sql.js ved migreringen. */
  var KART = {
    whereNull: [
      { k: "FROM", steg: [0] },
      { k: "WHERE", steg: [1], gjett: { valg: [1, 2, 3, 6] } },
      { k: "SELECT", steg: [2] }
    ],
    anatomi: [
      { k: "FROM", steg: [0], vis: "join" },
      { k: "WHERE", steg: [1] },
      { k: "SELECT", steg: [2] },
      { k: "ORDER BY", steg: [3], kolSel: ["dato"] },
      { k: "LIMIT", steg: [4, 5] }
    ],
    innerJoin: [
      { k: "FROM", steg: [0, 1, 2], vis: ["rutenett", "rutenett", "join"], gjett: { steg: 1, sporsmal: "Hvor mange av de 30 parene gir ON-betingelsen TRUE?" } },
      { k: "SELECT", steg: [3] }
    ],
    naturalFelle: [
      { k: "FROM", steg: [0, 1, 2], vis: "natural", merke: "6 → 6 → 0 rader", gjett: { steg: 2, valg: [0, 1, 5, 6], sporsmal: "Hvor mange rader gir den siste NATURAL JOIN-en?" } },
      { k: "SELECT", steg: [3] }
    ],
    selvjoin: [
      { k: "FROM", steg: [0], vis: "join", gjett: { valg: [3, 5, 6, 7], sporsmal: "Hvor mange par gir l1.sted = l2.sted?" } },
      { k: "WHERE", steg: [1] },
      { k: "SELECT", steg: [2] }
    ],
    update: [
      { k: "WHERE", steg: [0], merke: "3 av 6 treffes", gjett: { svar: 3, valg: [0, 2, 3, 6], sporsmal: "Hvor mange rader treffes av WHERE?" } },
      { k: "SET", seg: ["UPDATE", "SET"], steg: [1], merke: "3 endres" }
    ],
    "delete": [
      { k: "WHERE", steg: [0], merke: "3 av 6 treffes", gjett: { svar: 3, valg: [0, 3, 6], sporsmal: "Hvor mange rader står igjen etter DELETE?" } },
      { k: "DELETE", steg: [1], merke: "6 → 3 rader" }
    ],
    groupBy: [
      { k: "FROM", steg: [0], vis: "join" },
      { k: "GROUP BY", steg: [1, 2], vis: "grupper" },
      { k: "HAVING", steg: [3], vis: "having" },
      { k: "SELECT", steg: [4] }
    ],
    whereHaving: [
      { k: "FROM", steg: [0], vis: "join" },
      { k: "WHERE", steg: [1] },
      { k: "GROUP BY", steg: [2], vis: "grupper" },
      { k: "HAVING", steg: [3], vis: "having" },
      { k: "SELECT", steg: [4] }
    ],
    notExists: [
      { k: "FROM", steg: [{ syn: "fra", tab: 0 }] },
      { k: "WHERE", steg: [0, 1, 2, 3, 4], vis: "korrelert", gjett: { steg: 0, svar: 1, valg: [0, 1, 4, 5], sporsmal: "Hvor mange forfattere blir igjen etter WHERE NOT EXISTS?" } },
      { k: "SELECT", steg: [5] }
    ],
    forAlle: [
      { k: "FROM", steg: [{ syn: "fra", tab: 0 }] },
      { k: "WHERE", steg: [0, 1, 2, 3, 4], vis: "korrelert", gjett: { steg: 0, svar: 2, valg: [1, 2, 3, 5], sporsmal: "Hvor mange lånere blir igjen etter WHERE NOT EXISTS?" } },
      { k: "SELECT", steg: [5] }
    ],
    withMax: [
      { k: "WITH", steg: [0] },
      { k: "FROM", steg: [2], vis: "join" },
      { k: "WHERE", steg: [1, 3], gjett: { steg: 1 } },
      { k: "SELECT", steg: [4] }
    ],
    leftJoin: [
      { k: "FROM", steg: [0, 1, 2, 3], vis: ["rutenett", "rutenett", "join", "join"], gjett: { steg: 3, sporsmal: "Hvor mange rader gir LEFT JOIN?" } },
      { k: "SELECT", steg: [4] }
    ],
    whereFelle: [
      { k: "FROM", steg: [0], vis: "join", gjett: { valg: [5, 6, 7], sporsmal: "Hvor mange rader gir LEFT JOIN?" } },
      { k: "WHERE", steg: [1], gjett: { valg: [2, 3, 4, 5] } },
      { k: "GROUP BY", steg: [2], vis: "grupper" },
      { k: "SELECT", steg: [3] }
    ],
    withRiktig: [
      { k: "WITH", steg: [0] },
      { k: "FROM", steg: [1], vis: "join", gjett: { valg: [3, 5, 6, 7], sporsmal: "Hvor mange rader gir LEFT JOIN okt?" } },
      { k: "GROUP BY", steg: [{ syn: "grupper", fra: 1, kol: [0], agg: { navn: "count(o.bid)", kol: 2 }, tekstFra: 2 }], vis: "grupper" },
      { k: "SELECT", steg: [{ syn: "resultat", fra: 2, tekst: { eli5: "Til slutt skriver vi navnet og tallet for hver haug. Alle fem lånerne står på lista.",
        normal: "<b>SELECT l.navn, count(o.bid) AS antall:</b> én rad per gruppe, 5 rader. Ada, Bo og Dina står med 0.",
        teknisk: "<b>SELECT</b> lager én rad per gruppe. Ingen WHERE har kastet NULL-radene, så alle lånerne er med, og <span class=\"mono\">count(o.bid)</span> gir 0 der det ikke finnes lån i oktober." } }] }
    ],
    notInNull: [
      { k: "FROM", steg: [{ syn: "fra", tab: 0 }] },
      { k: "WHERE", steg: [0, 1], gjett: { steg: 1, valg: [0, 1, 4, 5] } },
      { k: "SELECT", steg: [2] }
    ],
    notInFiks: [
      { k: "FROM", steg: [{ syn: "fra", tab: 0 }] },
      { k: "WHERE", steg: [0, 1], gjett: { steg: 1, valg: [0, 1, 4, 5] } },
      { k: "SELECT", steg: [2] }
    ]
  };

  /* ================= Adapter 1: D.steg → modell ================= */
  function finnId(demo) {
    var S = IN.dataSql && IN.dataSql.steg;
    if (!S) return null;
    for (var k in S) if (S[k] === demo) return k;
    return null;
  }
  function stegTabeller(s) { return s.tabeller || (s.tabell ? [s.tabell] : []); }

  function fraSteg(demo, kart) {
    var sql = String(demo.sql || "").replace(/\r\n?/g, "\n").replace(/^\n+|\s+$/g, "");
    var segs = segmenter(sql);
    var M = { kilde: "steg", sql: sql, segs: segs, kort: [], demo: demo, inndata: demo.tabeller || [] };
    var steps = demo.steg || [];
    if (!kart) {   // utled: steg.klausul, ellers segmentet linja ligger i; like naboer slås sammen
      kart = [];
      steps.forEach(function (s, i) {
        var k = s.klausul;
        if (!k && s.line != null) { var sg = segs.filter(function (x) { return s.line >= x.l0 && s.line <= x.l1; })[0]; k = sg ? sg.key : null; }
        k = k || "?";
        var last = kart[kart.length - 1];
        if (last && last.k === k) last.steg.push(i); else kart.push({ k: k, steg: [i] });
      });
    }
    kart.forEach(function (kc, ci) {
      var card = { k: kc.k, cls: klCls(kc.k), etikett: kc.etikett || null, merke: kc.merke || null, kolSel: kc.kolSel || null, steg: [], gjett: null };
      var keys = kc.seg || [kc.k === "DELSPØRRING" ? "WHERE" : kc.k];
      card.segs = []; segs.forEach(function (sg, si) { if (keys.indexOf(sg.key) >= 0) card.segs.push(si); });
      card.sql = kc.sql || card.segs.map(function (si) { return segTekst(sql, segs[si]); }).join("\n") || kc.k;
      kc.steg.forEach(function (ref, j) {
        var vis = Array.isArray(kc.vis) ? kc.vis[j] : kc.vis;
        var sub;
        if (typeof ref === "number") {
          var s = steps[ref] || {};
          sub = { tekst: s.tekst, tabeller: stegTabeller(s), kilde: s, nr: ref };
        } else sub = synt(ref, steps, M, card);
        sub.vis = vis || sub.vis || autoVis(sub, card);
        card.steg.push(sub);
      });
      if (kc.gjett !== false) card.gjett = lagGjett(card, kc.gjett || {});
      M.kort.push(card);
    });
    efterbehandle(M);
    return M;
  }
  function autoVis(sub, card) {
    var t = sub.tabeller[0];
    if (card.k === "HAVING") return "having";
    if (t && grpIds(t)) return "grupper";
    if (card.k === "SELECT") return "select";
    return "tabell";
  }
  function synt(ref, steps, M, card) {
    if (ref.syn === "fra") {
      var t = M.inndata[ref.tab || 0];
      var first = card.sql.split("\n")[0];
      return { tekst: ref.tekst || ("<b>" + esc(first) + ":</b> alle " + rowsOf(t).length + " radene. Hver av dem er en ytre rad som WHERE skal sjekke."), tabeller: [t], syn: true };
    }
    if (ref.syn === "grupper") {
      var src = stegTabeller(steps[ref.fra])[0], kol = ref.kol || [0];
      var ids = [], map = {}, n = 0;
      rowsOf(src).forEach(function (r) { var key = JSON.stringify(kol.map(function (j) { return r[j]; })); if (!(key in map)) map[key] = n++; ids.push(map[key]); });
      var agg = null, ut = null;
      if (ref.agg) {
        var verdier = []; for (var g = 0; g < n; g++) verdier.push(0);
        rowsOf(src).forEach(function (r, i) { if (ref.agg.kol == null || r[ref.agg.kol] !== null) verdier[ids[i]]++; });
        agg = { navn: ref.agg.navn, verdier: verdier };
        var forste = []; rowsOf(src).forEach(function (r, i) { if (forste[ids[i]] == null) forste[ids[i]] = r; });
        var gk = kol.map(function (j) { return src.kolonner[j]; });
        // ut: én rad per gruppe (grupperingskolonnene + navnet ved siden av, hvis det står rett etter + aggregatet)
        var ekstra = kol.length === 1 && src.kolonner.length > kol[0] + 1 ? [kol[0] + 1] : [];
        ut = { navn: "én rad per gruppe", kolonner: gk.concat(ekstra.map(function (j) { return src.kolonner[j]; })).concat([ref.agg.navn]),
          rader: forste.map(function (r, g) { return kol.concat(ekstra).map(function (j) { return r[j]; }).concat([verdier[g]]); }) };
      }
      var tk = ref.tekstFra != null ? steps[ref.tekstFra].tekst : ref.tekst;
      return { tekst: tk, tabeller: [copyT(src, { navn: "gruppert", marks: null })], gid: ids, agg: agg, ut: ut, syn: true };
    }
    if (ref.syn === "resultat") {
      var st = steps[ref.fra] || {};
      return { tekst: ref.tekst || st.tekst, tabeller: stegTabeller(st), syn: true, vis: "select" };
    }
    return { tekst: ref.tekst || "", tabeller: ref.tabeller || (ref.tabell ? [ref.tabell] : []), syn: true };
  }

  /* ================= Adapter 2: trace fra sql-motor → modell ================= */
  var FILTER = { "WHERE": 1, "HAVING": 1, "LIMIT": 1 };
  function fraTrace(trace, sql, opts) {
    opts = opts || {};
    var steps = Array.isArray(trace) ? trace : (trace && trace.steg) || [];
    sql = String(sql || (trace && trace.sql) || "");
    var M = { kilde: "trace", sql: sql, segs: [], kort: [], demo: trace, inndata: opts.tabeller || [] };
    steps.forEach(function (st) {
      var k = String(st.klausul || "?").toUpperCase();
      var merker = st.merker || [];
      var harDrop = merker.some(function (m) { return m === "drop"; }) || FILTER[k];
      var mk = merker.map(function (m) { return m === "keep" ? (harDrop ? "keep" : null) : m; });
      var t = { navn: st.navn || k, kolonner: st.kolonner || [], rader: st.rader || [], marks: list(mk) };
      var card = { k: k, cls: klCls(k), etikett: null, steg: [], gjett: null, segs: [] };
      card.sql = st.tekst || k;
      if (st.fra && sql) { M.segs.push({ key: k, start: st.fra[0], end: st.fra[1] }); card.segs = [M.segs.length - 1]; }
      var sub = { tekst: null, tabeller: [t], kilde: st, auto: true };
      if (k === "GROUP BY" && st.grupper) { sub.vis = "grupper"; sub.gid = st.grupper; }
      else if (k === "HAVING") { sub.vis = "having"; sub.hgid = st.grupper || null; }
      else if (k === "SELECT") sub.vis = "select";
      else sub.vis = "tabell";
      card.steg.push(sub);
      M.kort.push(card);
    });
    // Skrives-visningen trenger segmentene i skriverekkefølge
    var order = M.segs.map(function (s, i) { return i; }).sort(function (a, b) { return M.segs[a].start - M.segs[b].start; });
    var remap = {}; order.forEach(function (o, i) { remap[o] = i; });
    M.segs = order.map(function (o) { return M.segs[o]; });
    M.kort.forEach(function (c) { c.segs = c.segs.map(function (s) { return remap[s]; }); });
    M.kort.forEach(function (c) { if (opts.gjett !== false && (c.k === "WHERE" || c.k === "HAVING")) c.gjett = lagGjett(c, {}); });
    efterbehandle(M);
    M.kort.forEach(function (c) { c.steg.forEach(function (s) { if (s.auto) s.tekst = autoTekst(c, s, M); }); });
    return M;
  }
  function autoTekst(c, s, M) {
    var t = s.tabeller[0], n = rowsOf(t).length, k = kept(t);
    switch (c.k) {
      case "FROM": return "<b>FROM</b> gir " + plur(n, "rad", "rader") + ".";
      case "WHERE": return "<b>WHERE</b> beholder " + k + " av " + plur(n, "rad", "rader") + ": bare de der betingelsen er TRUE.";
      case "GROUP BY": var g = uniq(s.gid || []).length; return "<b>GROUP BY</b> deler " + plur(n, "rad", "rader") + " i " + plur(g, "gruppe", "grupper") + ".";
      case "HAVING": return "<b>HAVING</b> beholder " + k + " av " + plur(n, "gruppe", "grupper") + ".";
      case "SELECT": return "<b>SELECT</b> gir " + plur(n, "rad", "rader") + " med " + (t.kolonner.length === 1 ? "kolonnen " : "kolonnene ") + t.kolonner.map(function (x) { return '<span class="mono">' + esc(colName(x)) + "</span>"; }).join(", ") + ".";
      case "ORDER BY": return "<b>ORDER BY</b> sorterer radene.";
      case "LIMIT": return "<b>LIMIT</b> beholder " + k + " av " + plur(n, "rad", "rader") + ".";
      case "WITH": return "<b>WITH " + esc((s.kilde && s.kilde.navn) || "") + "</b> regnes ut først: " + plur(n, "rad", "rader") + ".";
      default: return "<b>" + esc(c.k) + "</b>: " + plur(n, "rad", "rader") + ".";
    }
  }

  /* ================= Felles etterbehandling av modellen ================= */
  function efterbehandle(M) {
    M.kort.forEach(function (c, ci) { c.i = ci; });
    M.kort.forEach(function (c, ci) {
      c.join = c.k === "FROM" ? joinInfo(M, c) : null;
      if (c.steg.some(function (s) { return s.vis === "korrelert"; })) korrelertFerdig(M, c);
      c.steg.forEach(function (s, si) { s.card = ci; s.i = si; });
    });
    // flat trinnliste
    M.trinn = [];
    M.kort.forEach(function (c) { c.steg.forEach(function (s, si) { M.trinn.push({ c: c.i, s: si }); }); });
    // legende: hvilke merker finnes?
    var keys = {};
    M.kort.forEach(function (c) {
      c.steg.forEach(function (s) {
        if (s.vis === "rutenett") keys.grid = 1;
        if (s.vis === "grupper" || s.vis === "having") keys.grp = 1;
        if (s.vis === "join") keys.ingen = 1;
        s.tabeller.forEach(function (t) {
          if (!t) return;
          var rm = rowMarks(t);
          Object.keys(rm).forEach(function (k) { var m = rm[k]; if (/^grp/.test(m)) keys.grp = 1; else keys[m] = 1; });
          if (tvCols(t).length) keys.tv = 1;
        });
      });
    });
    if (M.kort.some(function (c) { return c.k === "SELECT"; })) keys.cdrop = 1;
    M.legende = keys;
  }

  // «For hver ytre rad»: legg til et sluttrinn med alle utfallene og lag kortets ut-tabell
  function korrelertFerdig(M, c) {
    var subs = c.steg.filter(function (s) { return s.vis === "korrelert"; });
    var last = subs[subs.length - 1], outer = last.tabeller[0], rm = rowMarks(outer);
    var next = M.kort[c.i + 1], res = next ? next.steg[0].tabeller[0] : null;
    var utfall = rowsOf(outer).map(function (r, i) {
      if (rm[i] === "keep" || rm[i] === "drop") return rm[i];
      if (!res) return "keep";
      var rc = (res.kolonner || []).map(colName), oc = (outer.kolonner || []).map(colName);
      var j = rc.length ? oc.map(suffix).indexOf(suffix(rc[0])) : -1;
      if (j < 0) return "keep";
      return rowsOf(res).some(function (x) { return same(x[0], r[j]); }) ? "keep" : "drop";
    });
    var ferdig = copyT(outer, { marks: list(utfall) });
    var k = utfall.filter(function (u) { return u === "keep"; }).length;
    c.steg.push({ vis: "korrelert", ferdig: true, syn: true, tabeller: [ferdig],
      tekst: "<b>Alle ytre rader er sjekket:</b> " + k + " av " + rowsOf(outer).length + " består. Delspørringen ble kjørt " + rowsOf(outer).length + " ganger, én gang per rad." });
    c.ut = utenDrop(ferdig);
  }

  /* ---------- JOIN: hvilke tabeller, aliaser og ON-kolonner ---------- */
  var NAVN = "([^\\s(),;]+)", KWNOT = "(?!(?:INNER|LEFT|RIGHT|FULL|JOIN|NATURAL|CROSS|ON|WHERE|GROUP|ORDER)\\b)";
  var RE_FROM = new RegExp("FROM\\s+" + NAVN + "(?:\\s+(?:AS\\s+)?" + KWNOT + NAVN + ")?", "i");
  var RE_JOIN = new RegExp("(?:(INNER|LEFT|RIGHT|FULL)\\s+(?:OUTER\\s+)?)?JOIN\\s+" + NAVN + "(?:\\s+(?:AS\\s+)?" + KWNOT + NAVN + ")?\\s+ON\\s*\\(?\\s*([^\\s=()]+)\\s*=\\s*([^\\s=()]+)", "i");
  function finnTabell(M, navn) {
    navn = String(navn).toLowerCase();
    var t = M.inndata.filter(function (x) { return String(x.navn).toLowerCase() === navn; })[0];
    if (t) return t;
    for (var i = 0; i < M.kort.length; i++) {
      if (M.kort[i].k !== "WITH") continue;
      var s = M.kort[i].steg[0], tt = s && s.tabeller[0];
      if (tt && String(tt.navn).toLowerCase() === navn) return tt;
    }
    return null;
  }
  function joinInfo(M, c) {
    var txt = c.sql.replace(/\s+/g, " ");
    if (/NATURAL\s+JOIN/i.test(txt)) {
      var names = [], re = /(?:FROM|NATURAL\s+JOIN)\s+([^\s(),;]+)/gi, m;
      while ((m = re.exec(txt))) names.push(m[1]);
      var tabs = names.map(function (n) { return finnTabell(M, n); });
      return tabs.every(Boolean) ? { natural: true, tabeller: tabs } : null;
    }
    var f = RE_FROM.exec(txt), j = RE_JOIN.exec(txt);
    if (!f || !j) return null;
    var L = finnTabell(M, f[1]), R = finnTabell(M, j[2]);
    if (!L || !R) return null;
    return { type: (j[1] || "INNER").toUpperCase(), venstre: { tab: L, navn: f[1], alias: (f[2] || f[1]).toLowerCase() },
      hoyre: { tab: R, navn: j[2], alias: (j[3] || j[2]).toLowerCase() }, on: [j[4], j[5]] };
  }
  // radindeksen i inndatatabellen som en rad i joinresultatet kom fra (−1 = ingen / NULL-utfylt)
  function kildeRad(side, res, r) {
    var tc = side.tab.kolonner.map(function (x) { return suffix(colName(x)); });
    var map = [];
    res.kolonner.forEach(function (c, j) { var n = colName(c); if (prefix(n) === side.alias) { var k = tc.indexOf(suffix(n)); if (k >= 0) map.push([j, k]); } });
    if (!map.length) return -1;
    if (map.every(function (p) { return r[p[0]] === null; })) return -1;
    var rows = rowsOf(side.tab);
    for (var i = 0; i < rows.length; i++) if (map.every(function (p) { return r[p[0]] === rows[i][p[1]] || same(r[p[0]], rows[i][p[1]]); })) return i;
    return -1;
  }

  /* ---------- «Gjett først» ---------- */
  function lagGjett(card, g) {
    var isJoin = card.k === "FROM" && card.steg.length && (card.join || card.steg.some(function (s) { return s.vis === "rutenett" || s.vis === "join" || s.vis === "natural"; }));
    var filt = card.k === "WHERE" || card.k === "HAVING" || isJoin;
    if (!filt && g.steg == null && g.svar == null) return null;
    var si = g.steg;
    if (si == null) {
      si = -1;
      card.steg.forEach(function (s, i) { if (si < 0 && s.tabeller[0] && hasMark(s.tabeller[0], "drop")) si = i; });
      if (si < 0) si = card.steg.length - 1;
    }
    var sub = card.steg[si]; if (!sub) return null;
    var t = sub.tabeller[0], svar = g.svar;
    if (svar == null) svar = t ? kept(t) : 0;
    var n = t ? rowsOf(t).length : svar;
    var enhet = card.k === "HAVING" ? ["gruppe", "grupper"] : ["rad", "rader"];
    var valg = g.valg;
    if (!valg) {
      var c = [svar]; if (n !== svar) c.push(n);
      [svar - 1, svar + 1, 0, svar + 2].forEach(function (x) { if (x >= 0 && c.indexOf(x) < 0 && c.length < 4) c.push(x); });
      valg = c;
    }
    if (valg.indexOf(svar) < 0) valg = valg.concat([svar]);
    valg = valg.slice().sort(function (a, b) { return a - b; });
    var sp = g.sporsmal || (card.k === "WHERE" ? "Hvor mange rader blir igjen etter WHERE?" : card.k === "HAVING" ? "Hvor mange grupper blir igjen etter HAVING?" : "Hvor mange rader gir joinen?");
    return { steg: si, svar: svar, valg: valg, sporsmal: sp, enhet: enhet, svart: null };
  }

  /* ---------- Radtall per kort ---------- */
  function mainT(sub) { return sub && sub.tabeller && sub.tabeller[0]; }
  function utTabell(c) {
    if (c.ut) return c.ut;
    var s = c.steg[c.steg.length - 1];
    if (s.ut) return s.ut;
    var t = mainT(s);
    return t ? utenDrop(t) : { kolonner: [], rader: [] };
  }
  function telling(M, c) {
    if (c.merke) return { inn: null, ut: null, txt: c.merke };
    var first = mainT(c.steg[0]), ut = rowsOf(utTabell(c)).length, inn, enhet = "rader";
    if (c.k === "GROUP BY") {
      var gs = c.steg.filter(function (s) { return s.vis === "grupper"; })[0];
      var ids = gs ? (gs.gid || grpIds(mainT(gs)) || []) : [];
      inn = rowsOf(mainT(gs || c.steg[0])).length; ut = uniq(ids.filter(function (x) { return x != null; })).length;
      return { inn: inn, ut: ut, txt: plur(inn, "rad", "rader") + " → " + plur(ut, "gruppe", "grupper"), enhet: "grupper" };
    }
    if (c.k === "HAVING") enhet = "grupper";
    if (c.k === "SELECT" || c.k === "ORDER BY" || c.k === "WITH") return { inn: ut, ut: ut, txt: plur(ut, "rad", "rader") };
    if (c.join && !c.join.natural) inn = rowsOf(c.join.venstre.tab).length + " × " + rowsOf(c.join.hoyre.tab).length;
    else {
      var fs = c.gjett ? c.steg[c.gjett.steg] : c.steg.filter(function (s) { return mainT(s) && hasMark(mainT(s), "drop"); })[0];
      if (c.steg.some(function (s) { return s.vis === "korrelert"; })) fs = c.steg[0];
      inn = rowsOf(mainT(fs || c.steg[0])).length;
    }
    var en = enhet === "grupper" ? ["gruppe", "grupper"] : ["rad", "rader"];
    return { inn: inn, ut: ut, txt: (inn === ut ? "" : inn + " → ") + plur(ut, en[0], en[1]) };
  }

  /* ================= Visninger ================= */
  function tabell(host, t, opts) { return IN.vizTable(host, t, opts || {}); }
  function medKolSel(t, cols) {
    if (!cols || !t) return t;
    var km = {}; (t.kolonner || []).forEach(function (c) { var n = colName(c); if (cols.indexOf(suffix(n)) >= 0 || cols.indexOf(n) >= 0) km[n] = "sel"; });
    var marks = copyT(t.marks || {}, { kolonner: km });
    return copyT(t, { marks: marks });
  }

  function visTabell(host, sub, c, strip) {
    var row = el("div", { class: "rel-row" });
    sub.tabeller.forEach(function (t, i) {
      if (!t) return;
      var tt = strip && i === 0 ? stripT(t) : medKolSel(t, c.kolSel);
      tabell(row, tt);
    });
    host.appendChild(row);
  }

  /* ---------- Kryssprodukt som rutenett ---------- */
  function visRutenett(host, sub, c, strip, ui) {
    var t = mainT(sub), cols = t.kolonner.map(colName);
    var tvi = tvCols(t), tv = tvi.length ? tvi[tvi.length - 1] : -1;
    var lp = prefix(cols[0]), li = [], ri = [];
    cols.forEach(function (n, j) { if (j === tv) return; if (prefix(n) === lp) li.push(j); else ri.push(j); });
    var on = tv >= 0 ? cols[tv].split("=").map(function (x) { return x.trim(); }) : (c.join ? c.join.on : []);
    function keyOf(r, idx) { return JSON.stringify(idx.map(function (j) { return r[j]; })); }
    var L = [], R = [], Lm = {}, Rm = {}, cell = {};
    t.rader.forEach(function (r) {
      var lk = keyOf(r, li), rk = keyOf(r, ri);
      if (!(lk in Lm)) { Lm[lk] = L.length; L.push(r); }
      if (!(rk in Rm)) { Rm[rk] = R.length; R.push(r); }
      cell[Lm[lk] + "," + Rm[rk]] = tv >= 0 && !strip ? tvVal(r[tv]) : "·";
    });
    function disp(idx) {
      var best = idx.filter(function (j) { return /^(navn|tittel)$/.test(suffix(cols[j])); })[0];
      return best != null ? best : idx[Math.min(1, idx.length - 1)];
    }
    var ld = disp(li), rd = disp(ri);
    var lk = on.map(function (n) { return cols.indexOf(n); }).filter(function (j) { return li.indexOf(j) >= 0; })[0];
    var rk = on.map(function (n) { return cols.indexOf(n); }).filter(function (j) { return ri.indexOf(j) >= 0; })[0];
    function keyTxt(r, j) { return j == null ? "" : suffix(cols[j]) + " " + (r[j] === null ? "NULL" : r[j]); }
    var fig = el("figure", { class: "rel spl-gridfig" });
    fig.appendChild(el("figcaption", { class: "rel-name", html: esc(t.navn || "") + ' <span class="rel-count">' + L.length + " × " + R.length + " = " + t.rader.length + " par</span>" }));
    var sc = el("div", { class: "rel-scroll" }), tab = el("table", { class: "spl-grid" });
    var hr = el("tr", {}, [el("th", { class: "spl-gcorner", scope: "col", html: esc(cols[ld]) + "<br>× " + esc(cols[rd]) })]);
    R.forEach(function (r) { hr.appendChild(el("th", { scope: "col" }, [el("span", { class: "spl-gl", text: r[rd] === null ? "NULL" : String(r[rd]) }), el("span", { class: "spl-gk", text: keyTxt(r, rk) })])); });
    tab.appendChild(el("thead", {}, [hr]));
    var tb = el("tbody"), cnt = { TRUE: 0, FALSE: 0, NULL: 0 };
    L.forEach(function (lr, a) {
      var tr = el("tr", {}, [el("th", { scope: "row" }, [el("span", { class: "spl-gl", text: String(lr[ld]) }), el("span", { class: "spl-gk", text: keyTxt(lr, lk) })])]);
      R.forEach(function (rr, b) {
        var v = cell[a + "," + b] || "·"; if (cnt[v] != null) cnt[v]++;
        var sym = v === "TRUE" ? "✓" : v === "FALSE" ? "✗" : v === "NULL" ? "?" : "·";
        tr.appendChild(el("td", { class: "spl-gc spl-gc-" + (v === "·" ? "x" : v), title: lr[ld] + " × " + rr[rd] + (v === "·" ? "" : ": " + v), "aria-label": lr[ld] + " og " + rr[rd] + (v === "·" ? ": ett par" : ": " + v), text: sym }));
      });
      tb.appendChild(tr);
    });
    tab.appendChild(tb); sc.appendChild(tab); fig.appendChild(sc);
    var cap = tv >= 0 && !strip
      ? "Hver rute er ett par i kryssproduktet. <span class=\"spl-gc-TRUE spl-sym\">✓</span> TRUE: " + cnt.TRUE + " · <span class=\"spl-gc-FALSE spl-sym\">✗</span> FALSE: " + cnt.FALSE + " · <span class=\"spl-gc-NULL spl-sym\">?</span> NULL: " + cnt.NULL + ". Bare ✓ blir med."
      : "Hver rute er ett par i kryssproduktet: alle " + t.rader.length + " kombinasjonene.";
    fig.appendChild(el("div", { class: "rel-cap small", html: cap }));
    host.appendChild(fig);
    if (!strip) {
      var key = sub.card + ":" + sub.i, open = !!ui.liste[key];
      var b = el("button", { class: "btn sm ghost spl-listbtn", type: "button", "aria-expanded": open ? "true" : "false",
        text: open ? "Skjul lista" : "Vis som liste (" + t.rader.length + " rader)" });
      b.addEventListener("click", function () { ui.liste[key] = !ui.liste[key]; ui.paint(); });
      host.appendChild(b);
      if (open) tabell(host, t, { compact: true });
    }
  }

  /* ---------- JOIN side om side ---------- */
  var NDOT = 6;
  function dot(i) { return el("span", { class: "spl-dot spl-d" + (i % NDOT), text: String(i + 1), "aria-hidden": "true" }); }
  function leggTilPrikker(fig, perRow, ingen, label) {
    var thr = fig.querySelector("thead tr");
    if (thr) thr.insertBefore(el("th", { class: "spl-dotc", scope: "col", "aria-label": label || "par", text: "⋈" }), thr.firstChild);
    IN.qsa("tbody tr", fig).forEach(function (tr, i) {
      var td = el("td", { class: "spl-dotc" });
      (perRow[i] || []).forEach(function (d) { td.appendChild(dot(d)); });
      if (perRow[i] && perRow[i].length) td.setAttribute("aria-label", "par med rad " + perRow[i].map(function (d) { return d + 1; }).join(" og "));
      tr.insertBefore(td, tr.firstChild);
      if (ingen && ingen[i]) tr.classList.add("spl-ingen");
    });
  }
  function visJoin(host, sub, c, strip) {
    var J = c.join, res = mainT(sub);
    if (!J || J.natural || !res) return visTabell(host, sub, c, false);
    var L = J.venstre, R = J.hoyre;
    var lp = [], rp = [], resDots = [];
    rowsOf(L.tab).forEach(function () { lp.push([]); }); rowsOf(R.tab).forEach(function () { rp.push([]); });
    rowsOf(res).forEach(function (r) {
      var a = kildeRad(L, res, r), b = kildeRad(R, res, r);
      if (a >= 0 && b >= 0) { if (lp[a].indexOf(a) < 0) lp[a].push(a); if (rp[b].indexOf(a) < 0) rp[b].push(a); }
      resDots.push(a >= 0 ? [a] : []);
    });
    var onL = J.on.filter(function (n) { return prefix(n) === L.alias; }).map(suffix);
    var onR = J.on.filter(function (n) { return prefix(n) === R.alias; }).map(suffix);
    if (L.alias === R.alias) { onL = [suffix(J.on[0])]; onR = [suffix(J.on[1])]; }
    function inn(side, keys, nm) {
      var km = {}; side.tab.kolonner.forEach(function (x) { var n = colName(x); if (keys.indexOf(n.toLowerCase()) >= 0) km[n] = "sel"; });
      return { navn: nm, kolonner: side.tab.kolonner, rader: side.tab.rader, marks: { kolonner: km } };
    }
    var wrap = el("div", { class: "spl-join" });
    var row = el("div", { class: "rel-row spl-jin" });
    var aNavn = esc(L.navn) + (L.alias !== L.navn.toLowerCase() ? " AS " + esc(L.alias) : "");
    var bNavn = esc(R.navn) + (R.alias !== R.navn.toLowerCase() ? " AS " + esc(R.alias) : "");
    var fa = tabell(row, inn(L, onL, aNavn), { compact: true });
    row.appendChild(el("div", { class: J.type === "LEFT" ? "spl-jop spl-jop-txt" : "spl-jop", "aria-hidden": "true", text: J.type === "LEFT" ? "LEFT JOIN" : "⋈" }));   // ⟕ er ikke kursnotasjon (vranglaere.md)
    var fb = tabell(row, inn(R, onR, bNavn), { compact: true });
    wrap.appendChild(row);
    var onTxt = '<span class="mono">' + esc(J.type) + " JOIN … ON (" + esc(J.on[0]) + " = " + esc(J.on[1]) + ")</span>";
    if (strip) {
      wrap.appendChild(el("p", { class: "small spl-jcap", html: "Uthevet kolonne: den " + onTxt + " sammenligner." }));
      host.appendChild(wrap); return;
    }
    var lIngen = lp.map(function (x) { return !x.length; }), rIngen = rp.map(function (x) { return !x.length; });
    leggTilPrikker(fa, lp, lIngen, "radnummer");
    leggTilPrikker(fb, rp, rIngen, "partner i " + L.navn);
    var nL = lIngen.filter(Boolean).length, nR = rIngen.filter(Boolean).length;
    var bits = [];
    if (nL) bits.push(nL + " i " + esc(L.navn) + (J.type === "LEFT" ? " (bevares med NULL)" : ""));
    if (nR) bits.push(nR + " i " + esc(R.navn));
    wrap.appendChild(el("p", { class: "small spl-jcap", html: onTxt + ". Samme nummer = samme par." +
      (bits.length ? " Uten partner (stiplet): " + bits.join(" og ") + "." : " Alle radene har partner.") }));
    var rf = tabell(wrap, res);
    leggTilPrikker(rf, resDots, null, "par");
    host.appendChild(wrap);
  }

  /* ---------- NATURAL JOIN: felles kolonnenavn ---------- */
  function visNatural(host, sub, c, strip) {
    var J = c.join;
    if (J && J.natural) {
      var k = sub.i, acc = [];
      J.tabeller.slice(0, k + 1).forEach(function (t) { t.kolonner.forEach(function (x) { var n = colName(x); if (acc.indexOf(n) < 0) acc.push(n); }); });
      var right = J.tabeller[k + 1];
      if (right) {
        var rc = right.kolonner.map(colName), felles = rc.filter(function (n) { return acc.indexOf(n) >= 0; });
        var box = el("div", { class: "spl-nat" });
        function line(label, names) {
          var p = el("div", { class: "spl-natl" }, [el("span", { class: "spl-natn", html: label })]);
          names.forEach(function (n) { p.appendChild(el("span", { class: "spl-chip mono" + (felles.indexOf(n) >= 0 ? " spl-felles" : ""), text: n })); });
          return p;
        }
        box.appendChild(line(k === 0 ? esc(J.tabeller[0].navn) : "mellomresultatet", acc));
        box.appendChild(line("NATURAL JOIN " + esc(right.navn), rc));
        box.appendChild(el("p", { class: "small", html: "Felles kolonnenavn: " + felles.map(function (n) { return '<b class="mono">' + esc(n) + "</b>"; }).join(" og ") +
          ". Joinen krever lik verdi i " + (felles.length === 1 ? "den" : "alle " + felles.length) + "." }));
        host.appendChild(box);
      }
    }
    if (!strip) visTabell(host, sub, c, false);
  }

  /* ---------- GROUP BY som blokker, HAVING på blokker ---------- */
  function gruppeTabell(host, t, gid, o) {
    o = o || {};
    var cols = t.kolonner.map(colName), order = [], byG = {};
    rowsOf(t).forEach(function (r, i) { var g = gid[i]; if (g == null) g = -1 - i; if (!(g in byG)) { byG[g] = []; order.push(g); } byG[g].push(i); });
    var ng = order.length;
    var fig = el("figure", { class: "rel spl-gfig" });
    fig.appendChild(el("figcaption", { class: "rel-name", html: esc(o.navn || t.navn || "") + ' <span class="rel-count">' + plur(rowsOf(t).length, "rad", "rader") + " · " + plur(ng, "gruppe", "grupper") + "</span>" }));
    var sc = el("div", { class: "rel-scroll" }), tab = el("table", { class: "rel-tab spl-gtab" });
    var hr = el("tr");
    t.kolonner.forEach(function (c) { hr.appendChild(el("th", { scope: "col", class: (typeof c === "object" && c.pk) ? "pk" : null, text: colName(c) })); });
    if (o.agg) hr.appendChild(el("th", { scope: "col", class: "spl-aggh", text: o.agg.navn }));
    tab.appendChild(el("thead", {}, [hr]));
    order.forEach(function (g, gi) {
      var tb = el("tbody", { class: "spl-gb spl-g" + (gi % NDOT) });
      var gm = o.gmerk ? o.gmerk[gi] : null;
      byG[g].forEach(function (ri, k) {
        var tr = el("tr", { class: gm === "drop" ? "r-drop" : gm === "keep" ? "spl-gkeep" : null });
        rowsOf(t)[ri].forEach(function (v) {
          var td = el("td");
          if (v === null) td.appendChild(el("span", { class: "rel-null", text: "NULL" })); else td.textContent = String(v);
          tr.appendChild(td);
        });
        if (o.agg && k === 0) {
          var a = el("td", { class: "spl-agg rel-tv", rowspan: String(byG[g].length) });
          var v = o.agg.verdier[gi];
          a.appendChild(el("b", { text: v === null || v === undefined ? "NULL" : String(v) }));
          if (o.agg.tv && o.agg.tv[gi]) a.appendChild(el("span", { class: "rel-tvc rel-tvc-" + o.agg.tv[gi], text: o.agg.tv[gi] }));
          tr.appendChild(a);
        }
        tb.appendChild(tr);
      });
      tab.appendChild(tb);
    });
    sc.appendChild(tab); fig.appendChild(sc);
    if (o.cap) fig.appendChild(el("div", { class: "rel-cap small", html: o.cap }));
    host.appendChild(fig);
    return fig;
  }
  function visGrupper(host, sub, c, strip) {
    var t = mainT(sub), gid = sub.gid || grpIds(t) || [];
    var row = el("div", { class: "rel-row" });
    gruppeTabell(row, copyT(t, { marks: null }), gid, { agg: sub.agg, cap: sub.agg ? null : "Hver blokk er én gruppe. Fargen er bare et skille." });
    host.appendChild(row);
  }
  function forrigeGrupper(M, ci) {
    for (var i = ci - 1; i >= 0; i--) {
      var s = M.kort[i].steg.filter(function (x) { return x.vis === "grupper"; })[0];
      if (s) return { t: mainT(s), gid: s.gid || grpIds(mainT(s)) || [] };
    }
    return null;
  }
  function visHaving(host, sub, c, strip, ui) {
    var H = mainT(sub), G = forrigeGrupper(ui.M, c.i);
    if (!G) return visTabell(host, sub, c, strip);
    var gcols = G.t.kolonner.map(function (x) { return colName(x).toLowerCase(); });
    var hcols = H.kolonner.map(colName);
    var aggJ = hcols.map(function (n, j) { return j; }).filter(function (j) { return gcols.indexOf(hcols[j].toLowerCase()) < 0; });
    var trace = c.steg[0].kilde && c.steg[0].kilde.merker && ui.M.kilde === "trace";
    var showJ = trace && aggJ.length > 1 ? aggJ.slice(0, -1) : aggJ;
    // gruppenes rekkefølge i G (første forekomst) ↔ HAVING-radene
    var order = []; G.gid.forEach(function (g) { if (g != null && order.indexOf(g) < 0) order.push(g); });
    var hm = rowMarks(H), byG = {};
    rowsOf(H).forEach(function (r, i) { var g = sub.hgid ? sub.hgid[i] : order[i]; byG[g] = { r: r, m: hm[i] }; });
    var verdier = [], tv = [], gmerk = [];
    order.forEach(function (g) {
      var h = byG[g]; if (!h) { verdier.push(""); tv.push(null); gmerk.push(null); return; }
      verdier.push(showJ.map(function (j) { return h.r[j] === null ? "NULL" : h.r[j]; }).join(", "));
      var v = trace ? tvVal(h.r[h.r.length - 1]) : (h.m === "keep" ? "TRUE" : h.m === "drop" ? "FALSE" : null);
      tv.push(strip ? null : v); gmerk.push(strip ? null : (h.m === "keep" || h.m === "drop" ? h.m : null));
    });
    var row = el("div", { class: "rel-row" });
    gruppeTabell(row, copyT(G.t, { marks: null }), G.gid, { navn: H.navn || "HAVING",
      agg: { navn: showJ.map(function (j) { return hcols[j]; }).join(", "), verdier: verdier, tv: tv }, gmerk: gmerk,
      cap: strip ? "Regn ut betingelsen for hver blokk." : "HAVING ser på hver blokk under ett. Grupper der betingelsen ikke er TRUE, forsvinner helt." });
    host.appendChild(row);
  }

  /* ---------- Korrelert delspørring: «for hver ytre rad» ---------- */
  function visKorrelert(host, sub, c, strip, ui) {
    var subs = c.steg, outer = mainT(sub), rm = rowMarks(outer);
    var oc = outer.kolonner.map(colName), dj = oc.map(suffix).indexOf("navn"); if (dj < 0) dj = Math.min(1, oc.length - 1);
    if (strip) {
      var r0 = el("div", { class: "rel-row" });
      tabell(r0, copyT(outer, { marks: null }), { compact: true });
      ui.M.inndata.slice(1).forEach(function (t) { tabell(r0, t, { compact: true }); });
      host.appendChild(r0);
      return;
    }
    var nav = el("div", { class: "spl-kor", role: "group", "aria-label": "For hver ytre rad" });
    nav.appendChild(el("span", { class: "spl-korl small", text: "For hver ytre rad:" }));
    rowsOf(outer).forEach(function (r, i) {
      var st = rm[i] === "hit" ? "cur" : rm[i] === "keep" ? "keep" : rm[i] === "drop" ? "drop" : "venter";
      var b = el("button", { class: "spl-korb spl-kor-" + st, type: "button", "aria-current": st === "cur" ? "step" : null,
        "aria-label": r[dj] + (st === "keep" ? ": med" : st === "drop" ? ": droppes" : st === "cur" ? ": sjekkes nå" : ": ikke sjekket"),
        text: (st === "keep" ? "✓ " : st === "drop" ? "✗ " : "") + r[dj] });
      b.addEventListener("click", function () { ui.goto(ui.idx(c.i, i)); });
      nav.appendChild(b);
    });
    var bf = el("button", { class: "spl-korb" + (sub.ferdig ? " spl-kor-cur" : " spl-kor-venter"), type: "button", text: "Ferdig", "aria-current": sub.ferdig ? "step" : null });
    bf.addEventListener("click", function () { ui.goto(ui.idx(c.i, subs.length - 1)); });
    nav.appendChild(bf);
    host.appendChild(nav);
    var row = el("div", { class: "rel-row spl-korrow" });
    sub.tabeller.forEach(function (t, i) { tabell(row, t, i ? { compact: false } : {}); if (i === 0 && sub.tabeller.length > 1) row.appendChild(el("div", { class: "spl-jop", "aria-hidden": "true", text: "→" })); });
    host.appendChild(row);
  }

  /* ---------- SELECT: kolonnene som forsvinner, dempet ---------- */
  function projeksjon(prev, res) {
    if (!prev || !res || !rowsOf(res).length || rowsOf(prev).length !== rowsOf(res).length) return null;
    var pc = prev.kolonner.map(colName), rc = res.kolonner.map(colName), brukt = {}, map = [];
    function likeVerdier(pj, rj) { return rowsOf(res).every(function (r, i) { return same(r[rj], rowsOf(prev)[i][pj]); }); }
    for (var j = 0; j < rc.length; j++) {
      var hit = -1;
      for (var k = 0; k < pc.length && hit < 0; k++) if (!brukt[k] && suffix(pc[k]) === suffix(rc[j]) && likeVerdier(k, j)) hit = k;
      for (k = 0; k < pc.length && hit < 0; k++) if (!brukt[k] && likeVerdier(k, j)) hit = k;
      if (hit < 0) return null;
      brukt[hit] = 1; map.push(hit);
    }
    return map;
  }
  function visSelect(host, sub, c, strip, ui) {
    var res = mainT(sub), prevC = ui.M.kort[c.i - 1], prev = prevC ? utTabell(prevC) : null;
    var map = projeksjon(prev, res);
    var row = el("div", { class: "rel-row" });
    if (map) {
      var km = {}, pc = prev.kolonner.map(colName);
      pc.forEach(function (n, k) { km[n] = map.indexOf(k) >= 0 ? "sel" : "drop"; });
      var f = tabell(row, { navn: "før SELECT", kolonner: prev.kolonner, rader: prev.rader, marks: { kolonner: km } }, { compact: true });
      var ths = IN.qsa("thead th", f);
      map.forEach(function (k, j) {
        var rn = colName(res.kolonner[j]);
        if (ths[k] && suffix(rn) !== suffix(pc[k])) ths[k].appendChild(el("span", { class: "spl-as", text: "AS " + rn }));
      });
      row.appendChild(el("div", { class: "spl-jop", "aria-hidden": "true", text: "→" }));
    }
    sub.tabeller.forEach(function (t) { tabell(row, t); });
    host.appendChild(row);
    if (map && map.length < prev.kolonner.length) host.appendChild(el("p", { class: "small muted spl-selcap", text: "Dempet: kolonner som ikke står i SELECT. De forsvinner først her, etter WHERE og GROUP BY." }));
  }

  var VIS = { tabell: visTabell, rutenett: visRutenett, join: visJoin, natural: visNatural, grupper: visGrupper, having: visHaving, korrelert: visKorrelert, select: visSelect };

  /* ================= Legende ================= */
  var LEG = [
    ["keep", "r-keep", "beholdes"], ["drop", "r-drop", "fjernes (dempet)"], ["new", "r-new", "ny rad, fylt ut med NULL"],
    ["hit", "r-hit", "raden det gjelder nå"], ["ingen", "spl-sw-ingen", "uten partner i joinen"], ["grp", "spl-sw-grp", "én blokk per gruppe"],
    ["cdrop", "spl-sw-cdrop", "kolonne som forsvinner i SELECT"]
  ];
  function legende(M) {
    var box = el("div", { class: "legend spl-legend", "aria-label": "Fargeforklaring" });
    LEG.forEach(function (L) {
      if (!M.legende[L[0]]) return;
      box.appendChild(el("span", { class: "item" }, [el("span", { class: "sw rel-sw " + L[1], "aria-hidden": "true" }), el("span", { text: L[2] })]));
    });
    if (M.legende.tv || M.legende.grid) box.appendChild(el("span", { class: "item", html: '<span class="rel-tvc rel-tvc-TRUE">TRUE</span> <span class="rel-tvc rel-tvc-FALSE">FALSE</span> <span class="rel-tvc rel-tvc-NULL">NULL</span> sannhetsverdi (bare TRUE slipper gjennom)' }));
    if (M.legende.grid) box.appendChild(el("span", { class: "item", html: '<span class="spl-sym spl-gc-TRUE">✓</span> <span class="spl-sym spl-gc-FALSE">✗</span> <span class="spl-sym spl-gc-NULL">?</span> i rutenettet' }));
    return box;
  }

  /* ================= Komponenten ================= */
  var GJETT_KEY = "in2090:sqlpipe-gjett";
  function store(k, d) { try { return IN.store ? IN.store.get(k, d) : d; } catch (e) { return d; } }
  function storeSet(k, v) { try { if (IN.store) IN.store.set(k, v); } catch (e) {} }
  var uidN = 0;

  IN.sqlPipeline = function (host, demo, opts) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host || !demo) return null;
    opts = opts || {};
    var erTrace = Array.isArray(demo) || (demo.steg && demo.steg[0] && demo.steg[0].klausul && demo.steg[0].merker);
    var id = opts.id || (erTrace ? null : finnId(demo));
    var M = erTrace ? fraTrace(demo, opts.sql, opts) : fraSteg(demo, opts.kart || (id && KART[id]) || null);
    if (opts.gjett === false) M.kort.forEach(function (c) { c.gjett = null; });
    var uid = "spl" + (++uidN);
    var st = { cur: Math.max(0, Math.min(opts.start || 0, M.trinn.length - 1)), modus: "kjor", skjul: false,
      gjett: opts.gjett !== false && store(GJETT_KEY, "1") !== "0", sett: {} };
    if (M.trinn.length) st.sett[M.trinn[st.cur].c] = true;
    else { host.appendChild(el("p", { class: "small muted", text: "(Ingen trinn å vise.)" })); return null; }
    var ui = { M: M, liste: {}, paint: paint, goto: goto, idx: function (c, s) { for (var i = 0; i < M.trinn.length; i++) if (M.trinn[i].c === c && M.trinn[i].s === s) return i; return 0; } };

    var root = el("div", { class: "spl", id: uid, role: "region", "aria-label": "SQL i logisk rekkefølge" });
    // Verktøylinje (står øverst og flytter seg aldri)
    var bPrev = el("button", { class: "btn sm", type: "button", html: "← Forrige", onclick: function () { step(-1); } });
    var bNext = el("button", { class: "btn sm primary spl-next", type: "button", html: "Neste →", onclick: function () { step(1); } });
    var pos = el("span", { class: "spl-pos small" });
    var tabK = el("button", { class: "seg-btn", type: "button", "aria-pressed": "true", text: "Kjøres", title: "Klausulene i logisk rekkefølge" });
    var tabS = el("button", { class: "seg-btn", type: "button", "aria-pressed": "false", text: "Skrives", title: "Slik skrives spørringen" });
    tabK.addEventListener("click", function () { st.modus = "kjor"; paint(); });
    tabS.addEventListener("click", function () { st.modus = "skriv"; paint(); });
    var seg = el("div", { class: "level-mini spl-modus", role: "group", "aria-label": "Visning" }, [tabK, tabS]);
    var cbG = el("input", { type: "checkbox" }), cbH = el("input", { type: "checkbox" });
    cbG.checked = st.gjett;
    function nyHoyde() { cards.forEach(function (x) { x.body.style.minHeight = ""; }); }
    cbG.addEventListener("change", function () { st.gjett = cbG.checked; storeSet(GJETT_KEY, st.gjett ? "1" : "0"); nyHoyde(); paint(); });
    cbH.addEventListener("change", function () { st.skjul = cbH.checked; root.classList.toggle("spl-skjul", st.skjul); nyHoyde(); paint(); });
    var lbG = el("label", { class: "spl-cb small" }, [cbG, " Gjett først"]);
    var lbH = el("label", { class: "spl-cb small" }, [cbH, " Skjul fjernede"]);
    var harGjett = M.kort.some(function (c) { return c.gjett; });
    var bar = el("div", { class: "spl-bar" }, [el("div", { class: "spl-nav" }, [bPrev, bNext, pos]), el("div", { class: "spl-opt" }, [seg, harGjett ? lbG : null, lbH])]);
    root.appendChild(bar);
    if (!touch) root.appendChild(el("div", { class: "spl-hint small muted", html: 'Piltastene <span class="kbd">←</span> <span class="kbd">→</span> blar når demoen har fokus.' }));
    root.appendChild(legende(M));
    var live = el("div", { class: "spl-live", "aria-live": "polite" });
    root.appendChild(live);
    var main = el("div", { class: "spl-main" });
    root.appendChild(main);
    host.appendChild(root);

    // Kortene bygges én gang; innholdet i det åpne kortet tegnes på nytt
    var cards = M.kort.map(function (c, ci) {
      var bid = uid + "-b" + ci;
      var head = el("button", { class: "spl-head", type: "button", "aria-expanded": "false", "aria-controls": bid });
      head.appendChild(el("span", { class: "spl-nr", text: String(ci + 1) }));
      var mid = el("span", { class: "spl-mid" });
      if (c.etikett) mid.appendChild(el("span", { class: "spl-tag", text: c.etikett }));
      mid.appendChild(el("code", { class: "spl-sql", html: c.sql.split("\n").map(tok).join("\n") }));
      head.appendChild(mid);
      var cnt = el("span", { class: "spl-cnt" });
      head.appendChild(cnt);
      head.addEventListener("click", function () { goto(ui.idx(ci, 0)); });
      var body = el("div", { class: "spl-body", id: bid, hidden: true });
      var art = el("section", { class: "spl-card " + c.cls }, [head, body]);
      return { head: head, body: body, cnt: cnt, art: art };
    });
    var list = el("ol", { class: "spl-list" });
    cards.forEach(function (x) { list.appendChild(el("li", {}, [x.art])); });
    var skriv = el("div", { class: "spl-skriv", hidden: true });

    main.appendChild(list); main.appendChild(skriv);

    function step(d) {
      var t = M.trinn[st.cur], c = M.kort[t.c];
      if (d > 0 && gatePending(c, t.s)) { c.gjett.svart = "hopp"; paint(true); return; }
      goto(st.cur + d);
    }
    function goto(i) {
      if (i < 0 || i >= M.trinn.length) return;
      var oldC = M.trinn[st.cur].c;
      st.cur = i;
      st.sett[M.trinn[i].c] = true;   // kort man har vært på, viser radtallet selv med «Gjett først» på
      if (M.trinn[i].c !== oldC) cards[oldC].body.style.minHeight = "";
      paint(true);
      var h = cards[M.trinn[i].c].head, r = h.getBoundingClientRect();
      if (r.top < 0 || r.bottom > (window.innerHeight || 800)) { try { h.scrollIntoView({ block: "nearest" }); } catch (e) {} }
    }
    function gatePending(c, si) { return st.gjett && c.gjett && c.gjett.steg === si && c.gjett.svart == null; }
    function gateBlocks(ci) {   // et tidligere kort med ubesvart gjett skjuler radtallene etter seg
      for (var i = 0; i <= ci; i++) { var g = M.kort[i].gjett; if (st.gjett && g && g.svart == null) return i; }
      return -1;
    }

    function renderSub(host, c, sub, maler) {
      clear(host);
      var pending = gatePending(c, sub.i);
      var g = c.gjett;
      if (c.steg.length > 1 && sub.vis !== "korrelert") {
        var dots = el("div", { class: "spl-sub small", role: "group", "aria-label": "Deltrinn" }, [el("span", { text: "Deltrinn " + (sub.i + 1) + " av " + c.steg.length })]);
        c.steg.forEach(function (s2, k) {
          var b = el("button", { class: "spl-subd" + (k === sub.i ? " on" : ""), type: "button", "aria-label": "Deltrinn " + (k + 1), "aria-current": k === sub.i ? "step" : null });
          b.addEventListener("click", function () { goto(ui.idx(c.i, k)); });
          dots.appendChild(b);
        });
        host.appendChild(dots);
      }
      if (g && st.gjett && g.steg === sub.i) host.appendChild(gateEl(c, pending));
      if (!pending) host.appendChild(el("div", { class: "spl-txt", html: IN.level && IN.level.pick ? IN.level.pick(sub.tekst) : (sub.tekst || "") }));
      var view = el("div", { class: "spl-view" });
      try { (VIS[sub.vis] || visTabell)(view, sub, c, pending, ui); }
      catch (e) { if (window.console) console.error("[sql-pipeline] " + sub.vis, e); clear(view); visTabell(view, sub, c, pending, ui); }
      host.appendChild(view);
      var pans = el("div", { class: "sp-panser" });
      host.appendChild(pans);
      if (maler) return;
      var info = { klausul: c.k, steg: sub.kilde || sub, demo: M.demo, kort: c.i, deltrinn: sub.i };
      try {
        if (typeof opts.panser === "function") opts.panser(pans, info);
        else if (opts.panser !== false && IN.sqlPanser && typeof IN.sqlPanser.kort === "function") IN.sqlPanser.kort(pans, info);
      } catch (e2) { if (window.console) console.error("[sql-pipeline] panser", e2); }
    }
    function gateEl(c, pending) {
      var g = c.gjett, box = el("div", { class: "spl-gjett" + (pending ? "" : " ferdig") });
      if (pending) {
        box.appendChild(el("p", { class: "spl-gq", html: "<b>Gjett først:</b> " + esc(g.sporsmal) }));
        var row = el("div", { class: "spl-gbtns", role: "group", "aria-label": "Svaralternativer" });
        g.valg.forEach(function (v) {
          var b = el("button", { class: "btn sm", type: "button", text: String(v) });
          b.addEventListener("click", function () { g.svart = v; paint(true); focusNext(); });
          row.appendChild(b);
        });
        var skip = el("button", { class: "btn sm ghost", type: "button", text: "Vis svaret" });
        skip.addEventListener("click", function () { g.svart = "hopp"; paint(true); focusNext(); });
        row.appendChild(skip);
        box.appendChild(row);
      } else {
        var e = g.enhet, ok = g.svart === g.svar;
        box.appendChild(el("p", { class: "spl-gr " + (g.svart === "hopp" ? "hopp" : ok ? "ok" : "feil"), html:
          g.svart === "hopp" ? "Svaret: <b>" + plur(g.svar, e[0], e[1]) + "</b>."
          : ok ? "<b>Riktig:</b> " + plur(g.svar, e[0], e[1]) + "."
          : "<b>Ikke helt.</b> Du svarte " + g.svart + ", men det blir <b>" + plur(g.svar, e[0], e[1]) + "</b>. Se hvorfor under." }));
      }
      return box;
    }
    function focusNext() { try { bNext.focus(); } catch (e) {} }

    function paint(announce) {
      var t = M.trinn[st.cur], c = M.kort[t.c], sub = c.steg[t.s];
      bPrev.disabled = st.cur === 0;
      var pend = gatePending(c, t.s);
      bNext.disabled = st.cur >= M.trinn.length - 1 && !pend;
      bNext.innerHTML = pend ? "Vis svaret →" : "Neste →";
      pos.textContent = "Trinn " + (st.cur + 1) + " av " + M.trinn.length;
      tabK.setAttribute("aria-pressed", st.modus === "kjor" ? "true" : "false"); tabK.classList.toggle("on", st.modus === "kjor");
      tabS.setAttribute("aria-pressed", st.modus === "skriv" ? "true" : "false"); tabS.classList.toggle("on", st.modus === "skriv");
      cbH.disabled = !M.kort.some(function (k) { return k.steg.some(function (s) { return s.tabeller.some(function (x) { return x && hasMark(x, "drop"); }) || s.vis === "having"; }); });
      var block = gateBlocks(M.kort.length - 1);
      cards.forEach(function (x, ci) {
        var cc = M.kort[ci], open = ci === t.c, tl = telling(M, cc);
        var skjult = block >= 0 && (ci === block || (ci > block && !st.sett[ci]));
        var txt = tl.txt;
        if (skjult) txt = tl.inn != null && ci === block ? tl.inn + " → ?" : "?";
        x.cnt.textContent = txt;
        x.head.setAttribute("aria-expanded", open ? "true" : "false");
        x.art.classList.toggle("open", open);
        x.art.classList.toggle("done", ci < t.c);
        x.body.hidden = !open;
        if (open) {
          if (!x.body.style.minHeight) measure(x.body, cc);
          renderSub(x.body, cc, sub);
        }
      });
      if (st.modus === "skriv") { list.hidden = true; skriv.hidden = false; paintSkriv(t.c); } else { list.hidden = false; skriv.hidden = true; }
      if (announce) {
        var tl2 = telling(M, c);
        live.textContent = "Trinn " + (st.cur + 1) + " av " + M.trinn.length + ". " + c.k + (c.steg.length > 1 ? ", deltrinn " + (t.s + 1) + " av " + c.steg.length : "") +
          (pend ? ". Gjett først: " + c.gjett.sporsmal : ". " + cards[t.c].cnt.textContent + ".");
      }
    }
    // stabil høyde: kortets tekst og tabeller måles for alle deltrinn, og det høyeste blir minstehøyden
    function measure(body, c) {
      var max = 0;
      body.hidden = false;
      c.steg.forEach(function (s) { renderSub(body, c, s, true); max = Math.max(max, body.offsetHeight); });
      // et ubesvart gjett tar opp mindre plass enn svaret; mål svaret også, så kortet ikke vokser når det vises
      var g = c.gjett;
      if (g && g.svart == null) {
        g.svart = "hopp";
        try { renderSub(body, c, c.steg[g.steg], true); max = Math.max(max, body.offsetHeight); } finally { g.svart = null; }
      }
      body.style.minHeight = max ? max + "px" : "";
    }
    function paintSkriv(curC) {
      clear(skriv);
      var sql = M.sql;
      if (!sql) { skriv.appendChild(el("p", { class: "small muted", text: "(Ingen SQL-tekst å vise.)" })); return; }
      var segUse = M.segs.map(function () { return []; });
      M.kort.forEach(function (c) { c.segs.forEach(function (si) { segUse[si].push(c.i); }); });
      var pre = el("pre", { class: "spl-pre mono" }), p = 0, html = "";
      M.segs.forEach(function (s, si) {
        if (s.start > p) html += tok(sql.slice(p, s.start));
        var users = segUse[si], cls = users.length ? M.kort[users[0]].cls : "spl-k-annet";
        html += '<span class="spl-wseg ' + cls + (users.indexOf(curC) >= 0 ? " cur" : "") + '" data-c="' + (users[0] != null ? users[0] : "") + '">' +
          (users.length ? '<sup class="spl-wnr">' + users.map(function (u) { return u + 1; }).join(",") + "</sup>" : "") + tok(sql.slice(s.start, s.end)) + "</span>";
        p = s.end;
      });
      if (p < sql.length) html += tok(sql.slice(p));
      pre.innerHTML = html;
      IN.qsa(".spl-wseg[data-c]", pre).forEach(function (sp) {
        var c = sp.getAttribute("data-c"); if (c === "") return;
        sp.setAttribute("role", "button"); sp.setAttribute("tabindex", "0");
        sp.setAttribute("aria-label", "Gå til kort " + (+c + 1));
        function go() { st.modus = "kjor"; goto(ui.idx(+c, 0)); }
        sp.addEventListener("click", go);
        sp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
      skriv.appendChild(pre);
      var ord = el("p", { class: "small spl-ord" }, [el("span", { text: "Kjøres: " })]);
      M.kort.forEach(function (c, i) {
        if (i) ord.appendChild(document.createTextNode(" → "));
        ord.appendChild(el("span", { class: "spl-ordk " + c.cls + (i === curC ? " cur" : ""), text: (i + 1) + " " + (c.etikett || c.k) }));
      });
      skriv.appendChild(ord);
      skriv.appendChild(el("p", { class: "small muted", text: "Tallet ved hver klausul er plassen i den logiske rekkefølgen. Trykk på en klausul for å se mellomtabellen." }));
    }

    root.addEventListener("keydown", function (e) {
      var tg = e.target && e.target.tagName;
      if (tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === "Home") { e.preventDefault(); goto(0); }
      else if (e.key === "End") { e.preventDefault(); goto(M.trinn.length - 1); }
    });
    function stickyTop() { try { bar.style.top = (IN.stickyH ? IN.stickyH() : 0) + "px"; } catch (e) {} }
    var rt = null;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { stickyTop(); cards.forEach(function (x) { x.body.style.minHeight = ""; }); paint(false); }, 200);
    });
    if (IN.level && IN.level.onChange) IN.level.onChange(function () { cards.forEach(function (x) { x.body.style.minHeight = ""; }); paint(false); });
    stickyTop();
    paint(false);

    return {
      el: root, modell: M,
      goto: function (i) { goto(i); }, next: function () { step(1); }, prev: function () { step(-1); }
    };
  };

  IN.sqlPipeline.fraSteg = fraSteg;
  IN.sqlPipeline.fraTrace = fraTrace;
  IN.sqlPipeline.segmenter = segmenter;
  IN.sqlPipeline.KART = KART;
})();
