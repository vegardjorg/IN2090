/* ============================================================
   IN2090 guide · sql-panser.js   (PROTOTYPE, ikke montert)
   «Under panseret»: hvilke faser en SQL-spørring går gjennom, og i hvilken fase en feil oppdages.

     IN.sqlPanser(host, scenario, opts) → { el, vis(scenario) }
       scenario: se data-sql-panser.js. Kan også være en streng (SQL) eller resultatet av fraMotor.
       opts.db: motor-database (standard: biblioteksdatabasen via IN.sqlMotor.lagDb, hvis motoren finnes)
       opts.pipelineHref: lenke til klausulkortene for samme spørring (valgfri)
     IN.sqlPanser.fraMotor(sql, db) → scenario bygd fra IN.sqlMotor (parse/run/trace). Uten motor: bare tegn + grammatikk.
     IN.sqlPanser.kort(el, { klausul, steg?, demo?, tekst? }) → <details> med én setning «under panseret»
       i et klausulkort. Kalles av sql-pipeline.js hvis den finnes. Vises bare når bryteren er på.
     IN.sqlPanser.på() / .sett(bool)   global bryter, lagret i localStorage «in2090:panser» ("1"/"0"),
       lukket som standard. Endring sendes som window-hendelsen «in:panser».
     IN.sqlPanser.fase(feil, fraParse) → "tegn"|"parse"|"semantikk"|"kjoring" ut fra motorens feil.kode.

   Fasene: tegn → parse → semantikk → plan (logisk rekkefølge) → kjoring → svar.
   Fase 1–2 og fase 4 er forenklinger av PostgreSQL og merkes slik i visningen.
   Klassisk script. Bruker IN.level hvis core.js er lastet, IN.sqlMotor hvis sql-motor.js er lastet.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var NOKKEL = "in2090:panser";

  /* ---------------- Hjelpere ---------------- */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null || attrs[k] === false) continue;
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function lagre(k, v) { try { if (IN.store) IN.store.set(k, v); else localStorage.setItem(k, v); } catch (e) {} }
  function hent(k) { try { return IN.store ? IN.store.get(k, null) : localStorage.getItem(k); } catch (e) { return null; } }
  function nivaa() { return IN.level && IN.level.get ? IN.level.get() : "normal"; }
  function velg(v) { if (v == null) return ""; if (typeof v === "string") return v; var l = nivaa(); return v[l] || v.normal || v.teknisk || v.eli5 || ""; }
  function mono(s) { return '<span class="mono">' + esc(s) + "</span>"; }
  function cell(v) { return v === null || v === undefined ? '<i class="panser-null">NULL</i>' : esc(v); }
  function normSql(s) { return String(s || "").replace(/--[^\n]*/g, "").replace(/\s+/g, " ").replace(/\s*;\s*$/, "").trim().toLowerCase(); }

  /* ---------------- Bryteren (global) ---------------- */
  function på() { return hent(NOKKEL) === "1"; }
  function sett(v) {
    lagre(NOKKEL, v ? "1" : "0");
    try { window.dispatchEvent(new CustomEvent("in:panser", { detail: !!v })); } catch (e) {}
  }

  /* ---------------- Tegn (egen liten tokenizer med posisjoner) ---------------- */
  var KW = {};
  ("select from where group by having order asc desc limit offset distinct all as on join inner left right full outer cross natural using " +
    "and or not in exists between like ilike is null true false union intersect except with case when then else end nulls first last").split(" ")
    .forEach(function (w) { KW[w] = 1; });
  var FN = { count: 1, sum: 1, avg: 1, min: 1, max: 1, coalesce: 1, upper: 1, lower: 1, length: 1, round: 1 };
  var RE = /(--[^\n]*)|('(?:[^']|'')*'?)|("(?:[^"]|"")*"?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_æøåÆØÅ][A-Za-z0-9_æøåÆØÅ]*)|(<>|!=|<=|>=|\|\||::)|(\s+)|([\s\S])/g;
  function tokens(sql) {
    var ut = [], m, s = String(sql || "");
    RE.lastIndex = 0;
    while ((m = RE.exec(s)) !== null) {
      var t = { raw: m[0], pos: m.index, end: m.index + m[0].length };
      if (m[1]) t.t = "cmt";
      else if (m[2]) { t.t = "str"; if (!/^'(?:[^']|'')*'$/.test(m[2])) t.bad = true; }
      else if (m[3]) { t.t = "qid"; if (!/^"(?:[^"]|"")*"$/.test(m[3]) || m[3].length < 2) t.bad = true; }
      else if (m[4]) t.t = "num";
      else if (m[5]) {
        var lw = m[5].toLowerCase(), neste = s.slice(t.end).match(/^\s*\(/);
        t.t = FN[lw] && neste ? "fn" : KW[lw] ? "kw" : "id"; t.v = lw;
      }
      else if (m[6]) t.t = "op";
      else if (m[7]) t.t = "ws";
      else t.t = "tegn";
      ut.push(t);
    }
    return ut;
  }
  var TCLS = { kw: "sql-kw", fn: "sql-fn", id: "sql-id", qid: "sql-id", str: "sql-str", num: "sql-num", op: "sql-op", cmt: "sql-cmt" };
  var TNAVN = { kw: "nøkkelord", fn: "funksjon", id: "navn", qid: "navn i \"\"", str: "streng", num: "tall", op: "tegn", tegn: "tegn", cmt: "kommentar" };
  function farg(s) {
    return tokens(s).map(function (t) { return TCLS[t.t] ? '<span class="' + TCLS[t.t] + '">' + esc(t.raw) + "</span>" : esc(t.raw); }).join("");
  }
  function kodeHtml(sql, fra, til) {
    if (fra == null || til == null || til <= fra) return farg(sql);
    return farg(sql.slice(0, fra)) + '<mark class="panser-merk">' + farg(sql.slice(fra, til)) + "</mark>" + farg(sql.slice(til));
  }

  /* ---------------- Klausuler på øverste nivå ---------------- */
  var SKRIV = { "WITH": 0, "SELECT": 1, "FROM": 2, "WHERE": 3, "GROUP BY": 4, "HAVING": 5, "ORDER BY": 6, "LIMIT": 7, "OFFSET": 7 };
  var LOGISK = ["WITH", "FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "DISTINCT", "ORDER BY", "LIMIT", "OFFSET"];
  var SPOR = ["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT / OFFSET"];
  function klausuler(sql) {
    var tk = tokens(sql), dyp = 0, ut = [], cur = null, mengde = false;
    for (var i = 0; i < tk.length; i++) {
      var t = tk[i];
      if (t.t === "tegn" && t.raw === "(") { dyp++; continue; }
      if (t.t === "tegn" && t.raw === ")") { dyp = Math.max(0, dyp - 1); continue; }
      if (dyp || t.t !== "kw") continue;
      var k = null, slutt = t.end;
      if (t.v === "union" || t.v === "intersect" || t.v === "except") { mengde = true; break; }
      if (t.v === "select" || t.v === "from" || t.v === "where" || t.v === "having" || t.v === "limit" || t.v === "offset" || t.v === "with") k = t.v.toUpperCase();
      else if (t.v === "group" || t.v === "order") {
        for (var j = i + 1; j < tk.length && tk[j].t === "ws"; j++) {}
        if (tk[j] && tk[j].v === "by") { k = t.v.toUpperCase() + " BY"; slutt = tk[j].end; }
      }
      if (!k) continue;
      if (cur) { cur.end = t.pos; }
      cur = { k: k, pos: t.pos, kwEnd: slutt, end: sql.length };
      if (k === "SELECT") {
        for (var d = i + 1; d < tk.length && tk[d].t === "ws"; d++) {}
        if (tk[d] && tk[d].v === "distinct") cur.distinct = true;
      }
      ut.push(cur);
    }
    ut.forEach(function (c) { c.tekst = sql.slice(c.pos, c.end).replace(/;\s*$/, "").replace(/\s+/g, " ").trim(); });
    // Rekkefølgefeil: en klausul med lavere (eller samme) skriveplass enn en som alt er lest.
    var maks = -1, sist = null, feil = null;
    ut.forEach(function (c) {
      if (feil) return;
      var r = SKRIV[c.k];
      var tillatt = r > maks || (c.k === "LIMIT" && sist === "OFFSET") || (c.k === "OFFSET" && sist === "LIMIT");
      if (!tillatt) feil = c;
      else { maks = Math.max(maks, r); sist = c.k; }
    });
    var lest = feil ? ut.slice(0, ut.indexOf(feil)) : ut;
    return { liste: ut, feil: feil, lest: lest, mengde: mengde };
  }
  function klausulVed(kl, pos) {
    var hit = null;
    kl.liste.forEach(function (c) { if (pos >= c.pos && pos < c.end) hit = c; });
    return hit;
  }
  function finnMerk(sql, merk) {
    if (!merk) return null;
    var tekst = typeof merk === "string" ? merk : merk.tekst, fra = 0;
    if (merk.etter) { var e = sql.indexOf(merk.etter); if (e >= 0) fra = e + merk.etter.length; }
    var i = sql.indexOf(tekst, fra);
    return i < 0 ? null : [i, i + tekst.length];
  }

  /* ---------------- Faser ---------------- */
  var FASER = [
    { id: "tegn", navn: "Les tegnene", under: "ord og tegn" },
    { id: "parse", navn: "Grammatikk", under: "skriverekkefølgen" },
    { id: "semantikk", navn: "Navn og regler", under: "finnes alt?" },
    { id: "plan", navn: "Logisk rekkefølge", under: "hva svaret er" },
    { id: "kjoring", navn: "Kjøring", under: "rad for rad" },
    { id: "svar", navn: "Svar", under: "tabellen ut" }
  ];
  function fIndeks(id) { for (var i = 0; i < FASER.length; i++) if (FASER[i].id === id) return i; return -1; }

  var KODE_FASE = {
    tegn: ["kommentar", "streng", "tegn"],
    parse: ["syntaks", "parentes", "semikolon", "flere", "tom"],
    semantikk: ["aggregat", "aggregat-where", "aggregat-", "alias", "alias-for-tidlig", "argumenter", "dato", "delsporring-kolonner", "distinct-order",
      "dobbel-anforsel", "dobbelt-alias", "dobbelt-with", "mengde-kolonner", "mengde-typer", "nostet-aggregat", "order-mengde", "type", "tvetydig",
      "ugruppert", "ukjent-alias", "ukjent-funksjon", "ukjent-kolonne", "ukjent-tabell"],
    kjoring: ["null-divisjon", "delsporring-rader", "grense"]
  };
  var KODE_SJEKK = { "ugruppert": "gruppering", "type": "type", "dato": "type", "argumenter": "type", "mengde-typer": "type", "nostet-aggregat": "aggregat" };
  function faseFor(feil, fraParse) {
    if (!feil) return null;
    if (feil.fase) return feil.fase;            // når motoren leverer fasen selv
    var k = String(feil.kode || "");
    for (var f in KODE_FASE) if (KODE_FASE[f].indexOf(k) >= 0) return f;
    if (/^aggregat/.test(k)) return "semantikk";
    if (k === "ikke-stottet" || k === "intern") return "stottes-ikke";
    return fraParse ? "parse" : "semantikk";
  }
  function sjekkFor(feil) {
    if (!feil) return null;
    if (feil.sjekk) return feil.sjekk;
    var k = String(feil.kode || "");
    if (KODE_SJEKK[k]) return KODE_SJEKK[k];
    if (/^aggregat/.test(k)) return "aggregat";
    return "navn";
  }

  var SJEKKER = [
    { id: "navn", t: "Finnes tabellene og kolonnene, og er navnene entydige?" },
    { id: "type", t: "Passer typene sammen (tall med tall, tekst med tekst)?" },
    { id: "aggregat", t: "Står aggregatene bare der grupper finnes (SELECT, HAVING, ORDER BY)?" },
    { id: "gruppering", t: "Har hver kolonne i SELECT én verdi per gruppe?" }
  ];

  var GENERELL = {
    tegn: { normal: "Den første fasen deler teksten i ord: nøkkelord, navn, strenger, tall og tegn. Den vet ingenting om tabeller eller klausuler, så feil her handler om tegn som ikke henger sammen, for eksempel en streng som aldri slutter." },
    parse: { normal: "Grammatikken sjekker at ordene står i en lovlig rekkefølge. Den vet ikke om tabellene finnes, og den har ikke sett på data. Derfor peker meldingen på ordet der grammatikken slutter å stemme." },
    semantikk: { normal: "Spørringen er grammatisk riktig, men når navnene slås opp og reglene sjekkes, stemmer noe ikke. Dette skjer før én eneste rad er lest, så feilen gjelder uansett hva som står i tabellene." },
    kjoring: { normal: "Spørringen er lovlig og blir kjørt. Det som går galt, skjer først når radene regnes ut, så det avhenger av dataene." },
    ok: { normal: "Alle fasene går gjennom. Se den logiske rekkefølgen og radtallene gjennom kjøringen." },
    felle: { normal: "Spørringen er lovlig, så databasen gir ingen feilmelding. Men øvingens tolk ser et mønster som ofte gir feil svar." },
    "stottes-ikke": { normal: "Øvingens tolk støtter ikke denne delen av SQL, så panseret kan ikke vise den. Det betyr ikke at spørringen er feil i PostgreSQL." }
  };

  /* ---------------- Scenario fra motoren ---------------- */
  var _db = null;
  function standardDb() {
    if (_db) return _db;
    if (IN.sqlMotor && IN.sqlMotor.lagDb && IN.dataSql && IN.dataSql.skjema) _db = IN.sqlMotor.lagDb(IN.dataSql.skjema, IN.dataSql.rader, "2026-11-25");
    return _db;
  }
  var FELLE_KODER = { "lik-null": 1, "not-in-null": 1, "count-stjerne-ytre": 1 };
  function kjedeFraTrace(steg) {
    return (steg || []).map(function (s) {
      var med = (s.merker || []).filter(function (m) { return m !== "drop"; }).length;
      if (s.klausul === "GROUP BY" && s.grupper) {
        var u = {}; s.grupper.forEach(function (g) { u[g] = 1; });
        return [s.klausul, Object.keys(u).length, "grupper"];
      }
      if (s.klausul === "HAVING") return [s.klausul, med, "grupper"];
      return [s.klausul, s.klausul === "FROM" || s.klausul === "WITH" ? (s.rader || []).length : med];
    });
  }
  function fraMotor(sql, db) {
    var sc = { sql: sql, egen: true, tittel: "Din spørring" };
    var M = IN.sqlMotor;
    if (!M || !M.parse) {
      var kl = klausuler(sql), bad = tokens(sql).filter(function (t) { return t.bad; })[0];
      if (bad) { sc.fase = "tegn"; sc.utfall = "feil"; sc.posisjon = [bad.pos, sql.length]; }
      else if (kl.feil) { sc.fase = "parse"; sc.utfall = "feil"; sc.posisjon = [kl.feil.pos, kl.feil.kwEnd]; }
      else { sc.fase = null; sc.utfall = "ukjent"; }
      sc.utenMotor = true;
      return sc;
    }
    var p = M.parse(sql);
    if (p.feil) {
      sc.fase = faseFor(p.feil, true); sc.utfall = "feil"; sc.motorFeil = p.feil;
      return sc;
    }
    db = db || standardDb();
    var r = M.trace(sql, db, { idag: (db && db.idag) || "2026-11-25" });
    sc.merknader = r.merknader || [];
    sc.kjede = kjedeFraTrace(r.steg);
    sc.steg = r.steg;
    if (r.feil) {
      sc.fase = faseFor(r.feil, false); sc.utfall = sc.fase === "stottes-ikke" ? "stottes-ikke" : "feil"; sc.motorFeil = r.feil;
      sc.sjekk = sjekkFor(r.feil);
      if (r.feil.kode === "aggregat-where") sc.orden = { brukes: "WHERE", finnes: "GROUP BY", hva: "gruppene" };
      if ((r.feil.kode === "alias-for-tidlig" || r.feil.kode === "ukjent-kolonne") && r.feil.pos != null) {
        // Et navn som bare finnes som AS-navn i SELECT, brukt i WHERE/HAVING/GROUP BY: «brukes før det lages».
        var kl = klausuler(sql), c = klausulVed(kl, r.feil.pos), navn = sql.slice(r.feil.pos, r.feil.slutt);
        var sel = kl.liste.filter(function (x) { return x.k === "SELECT"; })[0];
        var erAlias = sel && new RegExp("\\bAS\\s+" + navn.replace(/[^\wæøåÆØÅ]/g, "") + "\\b", "i").test(sel.tekst);
        if (c && c.k !== "SELECT" && (r.feil.kode === "alias-for-tidlig" || erAlias) && LOGISK.indexOf(c.k) < LOGISK.indexOf("SELECT"))
          sc.orden = { brukes: c.k, finnes: "SELECT", hva: "navnet " + navn };
      }
      return sc;
    }
    // Motoren retter enkelte navnefeil og kjører likevel (merknad «rettet-…»). PostgreSQL ville stoppet i navnefasen.
    var rettet = sc.merknader.filter(function (m) { return /^rettet-/.test(m.kode); })[0];
    if (rettet) {
      sc.fase = "semantikk"; sc.utfall = "feil"; sc.sjekk = "navn";
      sc.motorFeil = { kode: rettet.kode, melding: rettet.tekst };
      return sc;
    }
    sc.svar = { kolonner: r.kolonner, rader: r.rader };
    var felle = sc.merknader.filter(function (m) { return FELLE_KODER[m.kode]; });
    sc.utfall = felle.length ? "felle" : "ok";
    sc.fase = felle.length ? "kjoring" : null;
    sc.felleTekst = felle.map(function (m) { return m.tekst; });
    var w = (r.steg || []).filter(function (s) { return s.klausul === "WHERE"; })[0];
    if (w && felle.length) sc.traceTabell = w;
    return sc;
  }
  // Supplerer et håndskrevet scenario med motorens feilposisjon og melding (hvis motoren finnes).
  function medMotor(sc, db) {
    if (sc.egen || !IN.sqlMotor || !IN.sqlMotor.parse) return sc;
    var m;
    try { m = fraMotor(sc.sql, db); } catch (e) { return sc; }
    var ut = {}; for (var k in sc) ut[k] = sc[k];
    if (m.motorFeil) ut.motorFeil = m.motorFeil;
    ut.motorFase = m.fase; ut.motorUtfall = m.utfall;
    if (!ut.svar && m.svar) ut.svar = m.svar;
    return ut;
  }

  /* ---------------- Visningen ---------------- */
  var NIVAA_NAVN = { intro: "intro", eksamen: "eksamen", dypere: "dypere" };
  var teller = 0;

  function sqlPanser(host, scenario, opts) {
    if (typeof host === "string") host = document.querySelector(host);
    opts = opts || {};
    var id = "panser-" + (++teller);
    var root = h("section", { class: "panser", "aria-label": "Under panseret" });
    var bryter = h("button", { type: "button", class: "panser-bryter", "aria-controls": id, "aria-pressed": "false" });
    var topp = h("div", { class: "panser-topp" }, [bryter, h("span", { class: "panser-hint", text: "Hva databasen gjør med spørringen, fase for fase" })]);
    var kropp = h("div", { class: "panser-kropp", id: id });
    root.appendChild(topp); root.appendChild(kropp);
    host.appendChild(root);

    var historikk = [], gjeldende = null, valgtFase = null;

    function syncBryter() {
      var p = på();
      bryter.setAttribute("aria-pressed", p ? "true" : "false");
      bryter.innerHTML = '<span class="panser-knott" aria-hidden="true"></span>' + (p ? "Skjul under panseret" : "Vis under panseret");
      kropp.hidden = !p;
      root.classList.toggle("panser-på", p);
      if (p && !kropp.firstChild && gjeldende) tegn();
    }
    bryter.addEventListener("click", function () { sett(!på()); });
    window.addEventListener("in:panser", syncBryter);
    window.addEventListener("storage", function (e) { if (e.key === NOKKEL) syncBryter(); });
    if (IN.level && IN.level.onChange) IN.level.onChange(function () { if (på() && gjeldende) tegn(); });

    function vis(sc, push) {
      if (typeof sc === "string") sc = fraMotor(sc, opts.db);
      if (push && gjeldende) historikk.push(gjeldende); else if (!push) historikk = [];
      gjeldende = medMotor(sc, opts.db);
      valgtFase = null;
      if (på()) tegn(); else kropp.innerHTML = "";
      if (push && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start" });
    }

    function statuser(sc) {
      var st = {}, fi = sc.fase && sc.fase !== "stottes-ikke" ? fIndeks(sc.fase) : -1;
      FASER.forEach(function (f, i) {
        if (sc.utfall === "feil") st[f.id] = i < fi ? "ok" : i === fi ? "feil" : "aldri";
        else if (sc.utfall === "felle") st[f.id] = i < fi ? "ok" : "felle";
        else if (sc.utfall === "stottes-ikke") st[f.id] = i < 3 ? "ok" : "ukjent";
        else if (sc.utfall === "ukjent") st[f.id] = i < 2 ? "ok" : "ukjent";
        else st[f.id] = "ok";
      });
      return st;
    }
    function posisjon(sc) {
      var mf = sc.motorFeil;
      if (mf && mf.pos != null) {
        var slutt = mf.slutt != null ? mf.slutt : mf.pos + 1;
        if (sc.fase === "tegn") slutt = Math.max(slutt, sc.sql.replace(/\s+$/, "").length);
        return [mf.pos, slutt];
      }
      if (sc.posisjon) return sc.posisjon;
      if (sc.fase === "tegn") { var b = tokens(sc.sql).filter(function (t) { return t.bad; })[0]; if (b) return [b.pos, sc.sql.replace(/\s+$/, "").length]; }
      if (sc.fase === "parse") { var kl = klausuler(sc.sql); if (kl.feil) return [kl.feil.pos, kl.feil.kwEnd]; }
      if (sc.merk) return finnMerk(sc.sql, sc.merk);
      return null;
    }

    function tegn() {
      var sc = gjeldende; if (!sc) return;
      kropp.innerHTML = "";
      var st = statuser(sc), pos = posisjon(sc);
      if (!valgtFase) valgtFase = sc.fase && sc.fase !== "stottes-ikke" ? sc.fase : (sc.utfall === "ok" ? "plan" : "parse");

      // Overskrift
      var hode = h("div", { class: "panser-hode" });
      if (historikk.length) hode.appendChild(h("button", { type: "button", class: "panser-tilbake", text: "← Tilbake", onclick: function () { gjeldende = historikk.pop(); valgtFase = null; tegn(); } }));
      if (sc.tittel) hode.appendChild(h("h4", { class: "panser-tittel", text: sc.tittel }));
      if (sc.nivaa) hode.appendChild(h("span", { class: "panser-niv panser-niv-" + sc.nivaa, text: NIVAA_NAVN[sc.nivaa] || sc.nivaa }));
      if (sc.tillegg) hode.appendChild(h("span", { class: "panser-niv panser-niv-tillegg", text: "ikke i lysarkene", title: "Tilleggsfelle: korrekt PostgreSQL, men ikke nevnt i kursmaterialet" }));
      kropp.appendChild(hode);

      // SQL
      var pre = h("pre", { class: "panser-sql", html: kodeHtml(sc.sql, pos && pos[0], pos && pos[1]) });
      kropp.appendChild(pre);

      // Fasekjeden
      var kjede = h("ol", { class: "panser-faser", "aria-label": "Fasene spørringen går gjennom" });
      FASER.forEach(function (f, i) {
        var s = st[f.id];
        var ikon = s === "ok" ? "✓" : s === "feil" ? "✗" : s === "felle" ? "!" : s === "aldri" ? "–" : "?";
        var lbl = { ok: "gikk gjennom", feil: "feilen oppdages her", felle: "ingen feil, men svaret blir feil", aldri: "databasen kommer aldri hit", ukjent: "ukjent" }[s];
        var b = h("button", {
          type: "button", class: "panser-fase f-" + s + (valgtFase === f.id ? " valgt" : ""),
          "aria-pressed": valgtFase === f.id ? "true" : "false", title: f.navn + ": " + lbl,
          "aria-label": (i + 1) + ". " + f.navn + ", " + lbl,
          onclick: function () { valgtFase = f.id; tegn(); }
        }, [
          h("span", { class: "pf-nr", "aria-hidden": "true", text: ikon }),
          h("span", { class: "pf-navn", text: f.navn }),
          h("span", { class: "pf-under", text: f.under })
        ]);
        kjede.appendChild(h("li", null, [b]));
      });
      kropp.appendChild(kjede);

      // Hovedmelding
      kropp.appendChild(melding(sc));

      // Fasedetalj
      var fd = h("div", { class: "panser-detalj", role: "region", "aria-label": "Detaljer for fasen " + (FASER[fIndeks(valgtFase)] || {}).navn });
      var s = st[valgtFase];
      if (s === "aldri") fd.appendChild(h("p", { class: "panser-aldri", html: "Databasen kommer aldri hit. Feilen ble oppdaget i fasen <b>" + esc(FASER[fIndeks(sc.fase)].navn) + "</b>, så denne fasen kjøres ikke." }));
      else ({ tegn: dTegn, parse: dParse, semantikk: dSem, plan: dPlan, kjoring: dKjor, svar: dSvar })[valgtFase](fd, sc, s, pos);
      kropp.appendChild(fd);

      // Rettet versjon
      if (sc.rettet) {
        kropp.appendChild(h("div", { class: "panser-rettet" }, [
          h("button", { type: "button", class: "btn panser-rett-knapp", text: "Kjør den rettede spørringen gjennom panseret",
            onclick: function () { vis(rettetScenario(sc), true); } }),
          h("pre", { class: "panser-sql panser-sql-liten", html: farg(sc.rettet) })
        ]));
      }
      if (opts.pipelineHref) kropp.appendChild(h("p", { class: "panser-lenke", html: '<a href="' + esc(opts.pipelineHref) + '">Se mellomtabellene i klausulkortene →</a>' }));
    }

    function rettetScenario(sc) {
      var r = (IN.sqlMotor && IN.sqlMotor.parse) ? fraMotor(sc.rettet, opts.db) : { sql: sc.rettet, utfall: "ok", fase: null, egen: true };
      r.tittel = "Rettet: " + (sc.tittel || "");
      return r;
    }

    function melding(sc) {
      var box = h("div", { class: "panser-melding m-" + (sc.utfall || "ok") });
      if (sc.utfall === "feil") {
        var fnavn = FASER[fIndeks(sc.fase)].navn;
        box.appendChild(h("p", { class: "pm-hvor", html: "Stopper i fasen <b>" + esc(fnavn) + "</b>. Spørringen kjøres aldri." }));
        if (sc.pg) box.appendChild(h("div", { class: "pm-pg" }, [
          h("span", { class: "pm-lbl", text: "PostgreSQL ville sagt" }),
          h("code", { class: "pm-kode", text: sc.pg }),
          sc.norsk ? h("span", { class: "pm-norsk", text: "Altså: " + sc.norsk }) : null
        ]));
        if (sc.motorFeil && sc.motorFeil.melding) box.appendChild(h("div", { class: "pm-motor" }, [
          h("span", { class: "pm-lbl", text: "Øvingens tolk sier" }),
          h("span", { text: sc.motorFeil.melding })
        ]));
      } else if (sc.utfall === "felle") {
        box.appendChild(h("p", { class: "pm-hvor", html: "<b>Ingen feilmelding.</b> Alle fasene går gjennom, men svaret er ikke det du ville ha." }));
        (sc.felleTekst || []).forEach(function (t) { box.appendChild(h("div", { class: "pm-motor" }, [h("span", { class: "pm-lbl", text: "Øvingens tolk merker" }), h("span", { text: t })])); });
      } else if (sc.utfall === "stottes-ikke") {
        box.appendChild(h("p", { class: "pm-hvor", text: (sc.motorFeil && sc.motorFeil.melding) || "Øvingens tolk støtter ikke dette." }));
      } else if (sc.utfall === "ukjent") {
        box.appendChild(h("p", { class: "pm-hvor", text: "Øvingens tolk er ikke lastet, så bare de to første fasene kan sjekkes her." }));
      } else {
        box.appendChild(h("p", { class: "pm-hvor", html: "<b>Alle fasene går gjennom.</b>" }));
      }
      var hv = sc.hvorfor ? velg(sc.hvorfor) : velg(GENERELL[sc.utfall === "feil" ? sc.fase : sc.utfall] || GENERELL.ok);
      if (hv) box.appendChild(h("div", { class: "pm-hvorfor" }, [h("span", { class: "pm-lbl", text: sc.utfall === "feil" ? "Hvorfor akkurat her" : "Hva som skjer" }), h("div", { html: hv })]));
      if (sc.sensor) box.appendChild(h("p", { class: "pm-sensor", html: "<b>Eksamen:</b> " + esc(sc.sensor) }));
      return box;
    }

    /* --- Fase 1: tegn --- */
    function dTegn(fd, sc, s) {
      fd.appendChild(h("p", { class: "pd-intro", html: "Teksten deles i ord. Her ser du ordene databasen fant, med typen under." + forenkling("I PostgreSQL leser grammatikken ett ord om gangen mens den bygger spørringen, så fase 1 og 2 går hånd i hånd. De vises hver for seg fordi feilene er så ulike.") }));
      var rad = h("div", { class: "pd-brikker" });
      tokens(sc.sql).forEach(function (t) {
        if (t.t === "ws") return;
        var b = h("span", { class: "pd-brikke b-" + t.t + (t.bad ? " b-feil" : "") }, [
          h("span", { class: "pd-b-ord", text: t.raw.length > 40 ? t.raw.slice(0, 38) + "…" : t.raw }),
          h("span", { class: "pd-b-type", text: t.bad ? (t.t === "str" ? "streng uten slutt" : "navn uten slutt") : TNAVN[t.t] })
        ]);
        rad.appendChild(b);
      });
      fd.appendChild(rad);
      if (s === "feil") fd.appendChild(h("p", { class: "pd-feil", html: "Strengen starter, men den avsluttende fnutten kommer aldri. Alt etter " + mono("'") + " blir en del av strengen, også semikolonet." }));
      else if (/"/.test(sc.sql)) fd.appendChild(h("p", { class: "pd-note", html: "Legg merke til at " + mono("\"…\"") + " leses som et <b>navn</b>, ikke som en streng. Bare " + mono("'…'") + " er en streng." }));
    }

    /* --- Fase 2: grammatikk --- */
    function dParse(fd, sc, s) {
      var kl = klausuler(sc.sql);
      fd.appendChild(h("p", { class: "pd-intro", text: "Grammatikken har faste plasser for klausulene. Parseren går fra venstre mot høyre og kan aldri gå tilbake til en plass den har passert." }));
      var bad = s === "feil" ? kl.feil : null;
      var tilstede = {}; kl.lest.forEach(function (c) { tilstede[c.k === "LIMIT" || c.k === "OFFSET" ? "LIMIT / OFFSET" : c.k] = c; });
      var maks = -1; kl.lest.forEach(function (c) { maks = Math.max(maks, SKRIV[c.k]); });
      var badSlot = bad ? (bad.k === "LIMIT" || bad.k === "OFFSET" ? "LIMIT / OFFSET" : bad.k) : null;
      var spor = h("ol", { class: "pd-spor", "aria-label": "Plassene i grammatikken" });
      SPOR.forEach(function (slot) {
        var r = slot === "LIMIT / OFFSET" ? 7 : SKRIV[slot], c = tilstede[slot];
        var cls = c ? "sp-lest" : "sp-tom";
        if (bad && slot === badSlot) cls += " sp-hjem";
        if (bad && !c && r > maks) cls = "sp-ventet";
        var li = h("li", { class: "pd-slot " + cls }, [h("span", { class: "sp-navn", text: slot })]);
        if (c) li.appendChild(h("span", { class: "sp-tekst", text: c.tekst.length > 34 ? c.tekst.slice(0, 32) + "…" : c.tekst }));
        else if (bad && slot === badSlot) li.appendChild(h("span", { class: "sp-tekst", text: "her hører " + bad.k + " hjemme" }));
        else if (bad && r > maks) li.appendChild(h("span", { class: "sp-tekst", text: "kan fortsatt komme" }));
        else li.appendChild(h("span", { class: "sp-tekst", text: c ? "" : "(ikke brukt)" }));
        spor.appendChild(li);
      });
      fd.appendChild(spor);
      if (bad) {
        var forrige = kl.lest[kl.lest.length - 1];
        var ventet = SPOR.filter(function (slot) { return (slot === "LIMIT / OFFSET" ? 7 : SKRIV[slot]) > maks; });
        fd.appendChild(h("p", { class: "pd-feil", html: "Parseren har lest " + (forrige ? mono(forrige.k) : "starten") + " og ventet " +
          (ventet.length ? ventet.map(mono).join(", ") + " eller " : "") + "slutten av spørringen. Så fant den " + mono(bad.k) +
          ", som hører hjemme på en plass den allerede har passert." }));
      } else if (s === "feil" && sc.motorFeil) {
        fd.appendChild(h("p", { class: "pd-feil", text: sc.motorFeil.melding }));
      } else if (s === "feil") {
        fd.appendChild(h("p", { class: "pd-feil", text: "Grammatikken stopper ved det markerte ordet i spørringen." }));
      } else {
        fd.appendChild(h("p", { class: "pd-ok", text: "Alle klausulene står på lovlige plasser. Parseren vet nå hvordan spørringen er bygd, men ikke om navnene finnes." }));
        if (kl.mengde) fd.appendChild(h("p", { class: "pd-note", text: "Spørringen har UNION, INTERSECT eller EXCEPT. Her vises bare den første delen." }));
      }
    }

    /* --- Fase 3: navn og regler --- */
    function dSem(fd, sc, s) {
      fd.appendChild(h("p", { class: "pd-intro", html: "Nå slås hvert navn opp i skjemaet, og reglene sjekkes. Ingen rader er lest ennå." + forenkling("PostgreSQL gjør disse sjekkene mens den går gjennom spørringen, ikke i en fast liste. Rekkefølgen her er bare for å vise hva som sjekkes.") }));
      var sj = s === "feil" ? (sc.sjekk || sjekkFor(sc.motorFeil) || "navn") : null, forbi = false;
      var ul = h("ul", { class: "pd-sjekker" });
      SJEKKER.forEach(function (c) {
        var cls = !sj ? "sj-ok" : c.id === sj ? "sj-feil" : forbi ? "sj-ikke" : "sj-ok";
        if (c.id === sj) forbi = true;
        var ik = cls === "sj-ok" ? "✓" : cls === "sj-feil" ? "✗" : "–";
        ul.appendChild(h("li", { class: cls }, [h("span", { class: "sj-ikon", "aria-hidden": "true", text: ik }), h("span", { text: c.t }),
          cls === "sj-ikke" ? h("span", { class: "sj-merk", text: "ikke sjekket" }) : null]));
      });
      fd.appendChild(ul);
      if (sc.orden) fd.appendChild(ordenStripe(sc));
      if (sc.grupper) {
        var g = h("div", { class: "pd-grupper" });
        g.appendChild(h("p", { class: "pd-note", html: "Slik ville gruppene sett ut. Hver gruppe skal bli <b>én</b> rad:" }));
        sc.grupper.forEach(function (gr) {
          var flere = gr.verdier.length > 1;
          g.appendChild(h("div", { class: "pd-gruppe" + (flere ? " gr-flere" : "") }, [
            h("span", { class: "gr-nokkel", text: gr.nokkel }),
            h("span", { class: "gr-verdier", html: gr.verdier.map(esc).join(flere ? ' <span class="gr-eller">eller</span> ' : "") }),
            flere ? h("span", { class: "gr-spm", text: "hvilken?" }) : null
          ]));
        });
        fd.appendChild(g);
      }
      if (s === "ok") fd.appendChild(h("p", { class: "pd-ok", text: "Alle navn finnes, typene passer, og aggregatene står på lovlige steder. Spørringen er gyldig." }));
    }
    function ordenStripe(sc) {
      var o = sc.orden, kl = klausuler(sc.sql), har = {};
      kl.liste.forEach(function (c) { har[c.k] = 1; if (c.distinct) har.DISTINCT = 1; });
      har[o.brukes] = 1; har[o.finnes] = 1;
      var rekke = LOGISK.filter(function (k) { return har[k]; });
      var wrap = h("div", { class: "pd-orden" }, [h("p", { class: "pd-note", html: "I den logiske rekkefølgen kommer " + mono(o.brukes) + " før " + mono(o.finnes) + ", så " + esc(o.hva) + " finnes ikke ennå der det brukes:" })]);
      var ol = h("ol", { class: "pd-orden-rekke" });
      rekke.forEach(function (k, i) {
        var cls = k === o.brukes ? "or-brukes" : k === o.finnes ? "or-finnes" : "";
        ol.appendChild(h("li", { class: cls }, [h("span", { class: "or-nr", text: String(i + 1) }), h("span", { class: "or-k", text: k }),
          k === o.brukes ? h("span", { class: "or-merk", text: "brukes her" }) : k === o.finnes ? h("span", { class: "or-merk", text: o.hva + " lages her" }) : null]));
      });
      wrap.appendChild(ol);
      return wrap;
    }

    /* --- Fase 4: logisk rekkefølge --- */
    function dPlan(fd, sc) {
      var kl = klausuler(sc.sql), liste = kl.liste.slice();
      fd.appendChild(h("p", { class: "pd-intro", html: "Spørringen skrives i én rekkefølge, men svaret er definert av en annen. Fargene viser samme klausul i begge listene." +
        forenkling("Den logiske rekkefølgen sier <em>hva</em> svaret skal være. PostgreSQL lager en plan og kan regne ut ting i en annen rekkefølge, så lenge svaret blir det samme. Hvordan planen lages, er ikke pensum (F13-02).") }));
      var skrevet = [], logisk = [];
      liste.forEach(function (c) {
        skrevet.push({ k: c.k, tekst: c.tekst });
        if (c.k === "SELECT" && c.distinct) skrevet[skrevet.length - 1].distinct = true;
      });
      LOGISK.forEach(function (k) {
        if (k === "DISTINCT") { var s0 = liste.filter(function (c) { return c.k === "SELECT" && c.distinct; })[0]; if (s0) logisk.push({ k: "DISTINCT", tekst: "DISTINCT" }); return; }
        liste.forEach(function (c) { if (c.k === k) logisk.push({ k: k, tekst: c.tekst }); });
      });
      function kol(tittel, arr) {
        var ol = h("ol", { class: "pd-plan-liste" });
        arr.forEach(function (c) { ol.appendChild(h("li", { class: "pl-k pl-" + c.k.replace(/\s+/g, "").toLowerCase() }, [h("b", { text: c.k }), h("span", { class: "pl-tekst", text: c.k === "DISTINCT" ? "fjern like rader" : c.tekst.replace(new RegExp("^" + c.k.replace(" ", "\\s+"), "i"), "").trim() })])); });
        return h("div", { class: "pd-plan-kol" }, [h("h5", { text: tittel }), ol]);
      }
      fd.appendChild(h("div", { class: "pd-plan" }, [kol("Slik skrives den", skrevet), kol("Slik regnes den ut", logisk)]));
      var harAlias = /\bAS\s+[A-Za-zæøåÆØÅ_]/i.test((liste.filter(function (c) { return c.k === "SELECT"; })[0] || {}).tekst || "");
      if (harAlias) fd.appendChild(h("p", { class: "pd-note", html: "Navn fra " + mono("AS") + " i SELECT lages på steg " + (logisk.map(function (c) { return c.k; }).indexOf("SELECT") + 1) + ". De kan brukes i det som kommer etter (ORDER BY), men ikke i WHERE eller HAVING." }));
    }

    /* --- Fase 5: kjøring --- */
    function dKjor(fd, sc, s) {
      fd.appendChild(h("p", { class: "pd-intro", text: "Nå leses radene, og betingelsene regnes ut i den logiske rekkefølgen." }));
      if (sc.kjede && sc.kjede.length) {
        var k = h("ol", { class: "pd-kjede", "aria-label": "Antall rader gjennom kjøringen" });
        sc.kjede.forEach(function (x) {
          k.appendChild(h("li", { class: x[1] === 0 ? "kj-null" : "" }, [h("span", { class: "kj-k", text: x[0] }), h("span", { class: "kj-n", text: x[1] + " " + (x[2] === "grupper" ? (x[1] === 1 ? "gruppe" : "grupper") : (x[1] === 1 ? "rad" : "rader")) })]));
        });
        fd.appendChild(k);
      }
      var t = sc.tabell;
      if (t) {
        var tab = h("table", { class: "pd-tab" }), tr = h("tr");
        t.kolonner.forEach(function (c) { tr.appendChild(h("th", { text: c })); });
        if (t.uttrykk) { tr.appendChild(h("th", { class: "pd-utt", text: t.uttrykk })); tr.appendChild(h("th", { text: "med?" })); }
        tab.appendChild(h("thead", null, [tr]));
        var tb = h("tbody");
        t.rader.forEach(function (r, i) {
          var v = t.verdier ? t.verdier[i] : undefined, med = v === true;
          var row = h("tr", { class: (t.verdier ? (med ? "pt-med" : "pt-ute") : "") + (t.uthev === i ? " pt-uthev" : "") });
          r.forEach(function (c) { row.appendChild(h("td", { html: cell(c) })); });
          if (t.uttrykk) {
            row.appendChild(h("td", { class: "pd-utt" }, [h("span", { class: "tv tv-" + (v === true ? "t" : v === false ? "f" : "n"), text: v === true ? "TRUE" : v === false ? "FALSE" : "NULL" })]));
            row.appendChild(h("td", { class: "pt-medcelle", text: med ? "ja" : "nei" }));
          }
          tb.appendChild(row);
        });
        tab.appendChild(tb);
        fd.appendChild(h("div", { class: "pd-tab-wrap" }, [tab]));
        if (t.uttrykk) fd.appendChild(h("p", { class: "pd-note", text: "WHERE beholder bare rader der betingelsen er TRUE. FALSE og NULL er begge «ikke med»." }));
      } else if (sc.traceTabell) {
        var w = sc.traceTabell, tab2 = h("table", { class: "pd-tab" }), tr2 = h("tr");
        w.kolonner.forEach(function (c) { tr2.appendChild(h("th", { text: c })); }); tr2.appendChild(h("th", { text: "med?" }));
        tab2.appendChild(h("thead", null, [tr2]));
        var tb2 = h("tbody");
        w.rader.forEach(function (r, i) {
          var med = w.merker[i] !== "drop", row = h("tr", { class: med ? "pt-med" : "pt-ute" });
          r.forEach(function (c) { row.appendChild(h("td", { html: cell(c) })); });
          row.appendChild(h("td", { class: "pt-medcelle", text: med ? "ja" : "nei" }));
          tb2.appendChild(row);
        });
        tab2.appendChild(tb2);
        fd.appendChild(h("p", { class: "pd-note", text: "WHERE-steget fra øvingens tolk:" }));
        fd.appendChild(h("div", { class: "pd-tab-wrap" }, [tab2]));
      }
      if (s === "feil") fd.appendChild(h("p", { class: "pd-feil", text: (sc.motorFeil && sc.motorFeil.melding) || "Feilen oppstår mens radene regnes ut." }));
      else if (s === "ok" && !sc.kjede) fd.appendChild(h("p", { class: "pd-note", text: "Last inn øvingens tolk for å se radtallene." }));
    }

    /* --- Fase 6: svar --- */
    function dSvar(fd, sc, s) {
      var sv = sc.svar;
      if (!sv) { fd.appendChild(h("p", { class: "pd-note", text: "Svaret er ikke beregnet her. Last inn øvingens tolk for å se det." })); return; }
      fd.appendChild(h("p", { class: "pd-intro", text: sv.rader.length + (sv.rader.length === 1 ? " rad" : " rader") + " i svaret." + (s === "felle" ? " Ingen feilmelding, men sjekk om det er det du ville ha." : "") }));
      var tab = h("table", { class: "pd-tab" }), tr = h("tr");
      sv.kolonner.forEach(function (c) { tr.appendChild(h("th", { text: c })); });
      tab.appendChild(h("thead", null, [tr]));
      var tb = h("tbody");
      if (!sv.rader.length) tb.appendChild(h("tr", null, [h("td", { class: "pd-tom", colspan: String(sv.kolonner.length || 1), text: "(ingen rader)" })]));
      sv.rader.forEach(function (r) { var row = h("tr"); r.forEach(function (c) { row.appendChild(h("td", { html: cell(c) })); }); tb.appendChild(row); });
      tab.appendChild(tb);
      fd.appendChild(h("div", { class: "pd-tab-wrap" }, [tab]));
    }

    function forenkling(tekst) {
      return ' <span class="panser-forenkling" tabindex="0" title="' + esc(tekst.replace(/<[^>]+>/g, "")) + '">forenkling</span><span class="panser-forenkling-tekst">' + tekst + "</span>";
    }

    syncBryter();
    if (scenario) vis(scenario);
    return { el: root, vis: function (sc) { vis(sc, false); } };
  }

  /* ---------------- Merknad i klausulkort ---------------- */
  var kortLytter = false;
  function kort(el, o) {
    if (typeof el === "string") el = document.querySelector(el);
    if (!el) return null;
    o = o || {};
    var gml = el.querySelector(":scope > .panser-kort"); if (gml) gml.parentNode.removeChild(gml);
    var k = String(o.klausul || "").toUpperCase().replace(/\s+/g, " ");
    if (/JOIN/.test(k)) k = /^FROM/.test(k) ? "FROM" : "JOIN";
    var data = (IN.dataSqlPanser && IN.dataSqlPanser.kort) || {};
    var tekst = o.tekst || data[k];
    if (!tekst) return null;
    var d = h("details", { class: "panser-kort" }, [
      h("summary", null, [h("span", { class: "panser-kort-ikon", "aria-hidden": "true", text: "⚙" }), " Under panseret"]),
      h("p", { html: tekst })
    ]);
    d.hidden = !på();
    if (!kortLytter) {   // én felles lytter, så kort som tegnes på nytt ikke samler opp lyttere
      kortLytter = true;
      window.addEventListener("in:panser", function () {
        var p = på(); [].forEach.call(document.querySelectorAll(".panser-kort"), function (n) { n.hidden = !p; });
      });
    }
    el.appendChild(d);
    return d;
  }

  /* Ett panel med knapper for flere scenarier (brukes på blokksidene).
     Knappene vises bare når laget er slått på. */
  function velger(host, ider, opts) {
    if (typeof host === "string") host = document.querySelector(host);
    if (!host) return null;
    var alle = (IN.dataSqlPanser && IN.dataSqlPanser.scenarier) || [];
    var sc = ider.map(function (id) { return alle.filter(function (s) { return s.id === id; })[0]; }).filter(Boolean);
    if (!sc.length) return null;
    var panel = sqlPanser(host, sc[0], opts);
    if (sc.length < 2) return panel;
    var rad = h("div", { class: "panser-velg", role: "group", "aria-label": "Velg eksempel" });
    sc.forEach(function (s, i) {
      var b = h("button", { type: "button", class: "panser-velg-btn", "aria-pressed": i === 0 ? "true" : "false", text: s.tittel });
      b.addEventListener("click", function () {
        [].forEach.call(rad.children, function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        panel.vis(s);
      });
      rad.appendChild(b);
    });
    var topp = panel.el.querySelector(".panser-topp");
    topp.parentNode.insertBefore(rad, topp.nextSibling);
    function sync() { rad.hidden = !på(); }
    sync();
    window.addEventListener("in:panser", sync);
    window.addEventListener("storage", function (e) { if (e.key === NOKKEL) sync(); });
    return panel;
  }

  sqlPanser.velger = velger;
  sqlPanser.kort = kort;
  sqlPanser.fraMotor = fraMotor;
  sqlPanser.fase = faseFor;
  sqlPanser.på = på;
  sqlPanser.sett = sett;
  sqlPanser.klausuler = klausuler;
  sqlPanser.tokens = tokens;
  sqlPanser.FASER = FASER;
  sqlPanser.normSql = normSql;
  sqlPanser.finn = function (sql) {
    var n = normSql(sql), sc = (IN.dataSqlPanser && IN.dataSqlPanser.scenarier) || [];
    for (var i = 0; i < sc.length; i++) if (normSql(sc[i].sql) === n) return sc[i];
    return null;
  };
  IN.sqlPanser = sqlPanser;
})();
