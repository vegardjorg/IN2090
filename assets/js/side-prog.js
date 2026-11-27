/* ============================================================
   IN2090 guide · side-prog.js
   Blokk 8 · Views, transaksjoner og SQL fra program (08-sql-programmering.html).

   IN.prog.code(host, lang, tekst, { mark?: [linjeindeks], tittel? })  Python/Java med farger
   IN.prog.viewDemo(host)     VIEW mot MATERIALIZED VIEW på biblioteksdataene
   IN.prog.txDemo(host)       overføring med og uten BEGIN … COMMIT / ROLLBACK (IN.sqlSteps)
   IN.prog.injDemo(host)      strengsammensetting mot parameter, med ferdigregnede svar
   IN.prog.langSwitch(host)   Python/Java-bryter for hele siden (in2090:prog-lang)
   IN.prog.bank(host)         eksamensoppgavene om programmering, VIEW og transaksjon
   Data: IN.prog.explain, IN.prog.quiz, IN.prog.tf.
   Klassisk script. Lastes etter core.js, sql-lang.js, pseudocode.js, stepplayer.js,
   viz-relation.js, eksamensbanken og bank.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var el = IN.el, P = (IN.prog = IN.prog || {});

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function m(s) { return '<span class="mono">' + s + "</span>"; }
  function L() { return [].slice.call(arguments).join("\n"); }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  /* ================= Biblioteksdatabasen (samme rader som blokk 4 og 5) ================= */
  var LAANER = { 1: "Ada", 2: "Bo", 3: "Cato", 4: "Dina", 5: "Ibsen" };
  var BOK = { 10: "Et dukkehjem", 11: "Peer Gynt", 12: "Kristin Lavransdatter", 13: "Mrs Dalloway", 14: "Brødrene Løvehjerte", 15: "Folkeeventyr" };
  var UTLAAN0 = [[10, 1, "2026-09-01", "2026-09-10"], [11, 1, "2026-09-05", null], [13, 2, "2026-09-07", "2026-09-20"],
    [10, 3, "2026-10-01", null], [14, 3, "2026-10-02", "2026-10-15"], [12, 5, "2026-10-03", null]];
  var K_UTLAAN = [{ navn: "bid", pk: true, fk: "bok" }, { navn: "lid", pk: true, fk: "låner" }, { navn: "dato", pk: true }, "levert"];

  /* ================= Kodevisning for Python og Java ================= */
  var KW = {
    py: "def return for in import if else elif while with as not and or True False None print".split(" "),
    java: "void throws new while if else return try catch int String boolean class public static null true false".split(" ")
  };
  var TYPER = { Connection: 1, PreparedStatement: 1, Statement: 1, ResultSet: 1, SQLException: 1, DriverManager: 1, Class: 1 };
  function tokLine(line, lang) {
    var kw = {}; KW[lang].forEach(function (w) { kw[w] = 1; });
    var re = lang === "py"
      ? /(#[^\n]*)|("(?:[^"\\]|\\.)*"?)|(\b\d+\b)|([A-Za-z_æøåÆØÅ][A-Za-z0-9_æøåÆØÅ]*)|(\s+)|([\s\S])/g
      : /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"?)|(\b\d+\b)|([A-Za-z_æøåÆØÅ][A-Za-z0-9_æøåÆØÅ]*)|(\s+)|([\s\S])/g;
    var out = "", t;
    while ((t = re.exec(line)) !== null) {
      if (t[1]) out += '<span class="sql-cmt">' + esc(t[1]) + "</span>";
      else if (t[2]) {
        // plassholdere (%s og ?) inne i strengen markeres for seg
        out += '<span class="sql-str">' + esc(t[2]).replace(/%s|\?/g, function (p) { return '<span class="pg-ph">' + p + "</span>"; }) + "</span>";
      }
      else if (t[3]) out += '<span class="sql-num">' + t[3] + "</span>";
      else if (t[4]) {
        var w = t[4], call = /^\s*\(/.test(line.slice(re.lastIndex));
        if (kw[w]) out += '<span class="sql-kw">' + w + "</span>";
        else if (TYPER[w]) out += '<span class="pg-type">' + w + "</span>";
        else if (call) out += '<span class="sql-fn">' + esc(w) + "</span>";
        else out += esc(w);
      }
      else out += esc(t[0]);
    }
    return out;
  }
  P.code = function (host, lang, text, opts) {
    if (typeof host === "string") host = IN.qs(host);
    opts = opts || {};
    var mark = opts.mark || [];
    var box = el("div", { class: "pg-code-box" });
    var head = el("div", { class: "pg-code-head" }, [el("span", { class: "pg-lang", text: lang === "py" ? "Python (psycopg2)" : "Java (JDBC)" })]);
    if (opts.tittel) head.appendChild(el("span", { class: "pg-code-title", html: opts.tittel }));
    box.appendChild(head);
    var pre = el("pre", { class: "pg-code" }), code = el("code");
    code.innerHTML = String(text).split("\n").map(function (ln, i) {
      return '<span class="pg-ln' + (mark.indexOf(i) >= 0 ? " pg-hl" : "") + '">' + (tokLine(ln, lang) || " ") + "</span>";
    }).join("\n");
    pre.appendChild(code); box.appendChild(pre);
    host.appendChild(box);
    return box;
  };

  /* ================= Språkbryter (Python/Java) for hele siden ================= */
  var langSubs = [];
  P.lang = function () { var v = IN.store.get("in2090:prog-lang", "py"); return v === "java" ? "java" : "py"; };
  P.onLang = function (fn) { langSubs.push(fn); fn(P.lang()); };
  P.langSwitch = function (host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var row = el("div", { class: "btn-row pg-langsw", role: "group", "aria-label": "Velg programmeringsspråk" });
    row.appendChild(el("span", { class: "small muted", text: "Vis kode i:" }));
    var bs = [["py", "Python"], ["java", "Java"]].map(function (p) {
      var b = el("button", { class: "btn sm", type: "button", text: p[1], onclick: function () {
        IN.store.set("in2090:prog-lang", p[0]);
        langSubs.forEach(function (fn) { fn(p[0]); });
      } });
      b._l = p[0]; row.appendChild(b); return b;
    });
    host.appendChild(row);
    P.onLang(function (l) { bs.forEach(function (b) { b.setAttribute("aria-pressed", b._l === l ? "true" : "false"); }); });
  };
  /* Kodepar: viser Python eller Java etter bryteren. */
  P.codePair = function (host, py, java, opts) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    opts = opts || {};
    var a = el("div"), b = el("div");
    P.code(a, "py", py, { mark: opts.markPy, tittel: opts.tittel });
    P.code(b, "java", java, { mark: opts.markJava, tittel: opts.tittel });
    host.appendChild(a); host.appendChild(b);
    P.onLang(function (l) { a.hidden = l !== "py"; b.hidden = l !== "java"; });
  };

  /* ================= VIEW mot MATERIALIZED VIEW ================= */
  function viewRows(utl) {
    return utl.filter(function (r) { return r[3] === null; }).map(function (r) { return [LAANER[r[1]], BOK[r[0]], r[2]]; });
  }
  function key(r) { return r.join("|"); }
  P.viewDemo = function (host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var st;
    function reset() { st = { utl: UTLAAN0.map(function (r) { return r.slice(); }), mat: viewRows(UTLAAN0), sql: null, msg: null, ny: {}, endret: {}, brukt: {} }; }
    reset();
    var bar = el("div", { class: "btn-row pg-actions" });
    var out = el("div", { class: "pg-view-out", "aria-live": "polite" });
    var ACT = [
      { id: "ins", label: "INSERT: Dina låner Mrs Dalloway", sql: "INSERT INTO utlån VALUES (13, 4, '2026-11-25', NULL);",
        run: function () { st.utl.push([13, 4, "2026-11-25", null]); st.ny[st.utl.length - 1] = 1;
          st.msg = "Én ny rad i <b>utlån</b>. Viewet viser den med en gang, fordi spørringen kjøres på nytt. Det materialiserte viewet vet ingenting om den ennå."; } },
      { id: "upd", label: "UPDATE: Cato leverer Et dukkehjem", sql: "UPDATE utlån SET levert = '2026-11-25'\nWHERE bid = 10 AND lid = 3 AND dato = '2026-10-01';",
        run: function () { st.utl[3][3] = "2026-11-25"; st.endret["3,3"] = 1;
          st.msg = "Lånet har fått en leveringsdato, så det er ikke lenger «utlånt nå». Viewet har mistet raden. Det materialiserte viewet viser den fortsatt."; } },
      { id: "ref", label: "REFRESH MATERIALIZED VIEW", sql: "REFRESH MATERIALIZED VIEW utlånt_nå_m;",
        run: function () { st.mat = viewRows(st.utl);
          st.msg = "Spørringen er kjørt på nytt, og svaret er lagret på nytt. Nå er de to like igjen, helt til neste endring."; } }
    ];
    var btns = {};
    ACT.forEach(function (a) {
      btns[a.id] = el("button", { class: "btn sm", type: "button", text: a.label, onclick: function () {
        a.run(); st.sql = a.sql; if (a.id !== "ref") st.brukt[a.id] = 1; paint();
      } });
      bar.appendChild(btns[a.id]);
    });
    bar.appendChild(el("button", { class: "btn sm ghost", type: "button", text: "Start på nytt", onclick: function () { reset(); paint(); } }));
    host.appendChild(bar); host.appendChild(out);

    function paint() {
      clear(out);
      btns.ins.disabled = !!st.brukt.ins; btns.upd.disabled = !!st.brukt.upd;
      if (st.sql) IN.sqlBlock(out, st.sql);
      out.appendChild(el("p", { class: "pg-msg", html: st.msg || "Trykk på en kommando over. Viewet og det materialiserte viewet starter med det samme svaret: tre lån som ikke er levert." }));
      var v = viewRows(st.utl), vk = {}, mk = {};
      v.forEach(function (r) { vk[key(r)] = 1; }); st.mat.forEach(function (r) { mk[key(r)] = 1; });
      var rm = {}; Object.keys(st.ny).forEach(function (i) { rm[i] = "new"; });
      var vm = {}; v.forEach(function (r, i) { if (!mk[key(r)]) vm[i] = "new"; });
      var mm = {}, stale = false; st.mat.forEach(function (r, i) { if (!vk[key(r)]) { mm[i] = "drop"; stale = true; } });
      if (v.length !== st.mat.length || Object.keys(vm).length) stale = true;
      var row = el("div", { class: "rel-row pg-rel-row" });
      IN.vizTable(row, { navn: "utlån (tabell)", kolonner: K_UTLAAN, rader: st.utl, marks: { rader: rm, celler: st.endret } }, { compact: true });
      IN.vizTable(row, { navn: "utlånt_nå (VIEW)", kolonner: ["navn", "tittel", "dato"], rader: v, marks: { rader: vm },
        caption: "Regnes ut på nytt hver gang. Alltid i takt med tabellen." }, { compact: true });
      IN.vizTable(row, { navn: "utlånt_nå_m (MATERIALIZED)", kolonner: ["navn", "tittel", "dato"], rader: st.mat, marks: { rader: mm },
        caption: stale ? '<b class="pg-stale">Utdatert.</b> Lagret svar fra forrige REFRESH.' : "Lagret svar. I takt med tabellen akkurat nå." }, { compact: true });
      out.appendChild(row);
    }
    paint();
  };

  /* ================= Transaksjon: overføring mellom to kontoer ================= */
  var K_KONTO = [{ navn: "id", pk: true }, "eier", "saldo"];
  function konto(a, b, navn, marks) { return { navn: navn, kolonner: K_KONTO, rader: [[1, "Ada", a], [2, "Bo", b]], marks: marks || {} }; }
  function par(oa, ob, la, lb, mo, ml) {
    return [konto(oa, ob, "konto, sett fra denne økta", mo), konto(la, lb, "konto, lagret (det andre ser)", ml)];
  }
  var C = function (r) { var o = {}; o[r + ",2"] = "hit"; return { celler: o }; };
  var U1 = function (x) { return "UPDATE konto SET saldo = saldo - " + x + " WHERE id = 1;"; };
  var U2 = function (x) { return "UPDATE konto SET saldo = saldo + " + x + " WHERE id = 2;"; };
  var START = { tekst: { eli5: "Ada har 50 kroner og Bo har 200. Til sammen 250. Saldoen kan aldri bli under 0.",
    normal: "Startsituasjon: Ada 50, Bo 200, sum 250. Tabellen har " + m("CHECK (saldo &gt;= 0)") + ".",
    teknisk: "Startsituasjon: Ada 50, Bo 200, sum 250. Skranken " + m("CHECK (saldo &gt;= 0)") + " sjekkes for hver rad som endres." } };
  var TX = {
    uten: { label: "Uten transaksjon, 100 kr", sql: L(U1(100), U2(100)), steg: [
      { tekst: START.tekst, tabeller: par(50, 200, 50, 200) },
      { line: 1, tekst: { eli5: "Ada skulle fått −50. Det er ikke lov, så databasen sier nei. Ingenting endres.",
          normal: "<b>ERROR</b>: Ada ville fått −50, og CHECK avviser raden. Kommandoen feiler og endrer ingenting.",
          teknisk: "<b>ERROR</b>: den nye raden bryter " + m("CHECK (saldo &gt;= 0)") + ". Uten BEGIN er kommandoen sin egen transaksjon, så bare den rulles tilbake." },
        tabeller: par(50, 200, 50, 200) },
      { line: 2, tekst: { eli5: "Men den neste beskjeden blir likevel gjort: Bo får 100 kroner. Nå finnes det 350 kroner, selv om ingen har betalt. Det var dette vi ville unngå.",
          normal: "Den andre kommandoen kjøres likevel og lagres med en gang. Bo har 300, sum 350: hundre kroner har oppstått fra ingenting.",
          teknisk: "Kommando 2 er en egen, vellykket transaksjon og blir lagret. Databasen er konsistent etter skrankene (ingen CHECK er brutt), men ikke etter det vi mente: summen har økt med 100." },
        tabeller: par(50, 300, 50, 300, C(1), C(1)) }
    ] },
    commitFeil: { label: "BEGIN … COMMIT, 100 kr", sql: L("BEGIN;", U1(100), U2(100), "COMMIT;"), steg: [
      { tekst: START.tekst, tabeller: par(50, 200, 50, 200) },
      { line: 1, tekst: { eli5: "Nå sier vi først: «Det som kommer nå, hører sammen.»", normal: "BEGIN starter en transaksjon. Kommandoene som følger, hører sammen.",
          teknisk: "BEGIN starter en transaksjon. Endringene blir synlige for andre først ved COMMIT." }, tabeller: par(50, 200, 50, 200) },
      { line: 2, tekst: { eli5: "Ada kan ikke betale. Databasen sier nei, og nå vet den at hele pakken har feilet.",
          normal: "<b>ERROR</b>: CHECK avviser. Transaksjonen er nå ødelagt (avbrutt).",
          teknisk: "<b>ERROR</b>: CHECK-brudd. PostgreSQL merker transaksjonen som avbrutt (aborted)." }, tabeller: par(50, 200, 50, 200) },
      { line: 3, tekst: { eli5: "Beskjeden om å gi Bo penger blir ikke gjort, fordi pakken allerede har feilet.",
          normal: "<b>ERROR</b>: transaksjonen er avbrutt, så kommandoen ignoreres. Bo får ingenting.",
          teknisk: "<b>ERROR</b>: «current transaction is aborted, commands ignored until end of transaction block». Alle kommandoer ignoreres til transaksjonen avsluttes." },
        tabeller: par(50, 200, 50, 200) },
      { line: 4, tekst: { eli5: "Vi ber om å lagre, men databasen angrer alt i stedet. Ada og Bo har like mye som før. Ingen penger er borte, og ingen har kommet til.",
          normal: "COMMIT på en avbrutt transaksjon blir til ROLLBACK. Ingenting er endret, og summen er fortsatt 250. Alt eller ingenting.",
          teknisk: "PostgreSQL svarer ROLLBACK på COMMIT fordi transaksjonen er avbrutt. Atomicity: ingen av endringene er utført." },
        tabeller: par(50, 200, 50, 200) }
    ] },
    commitOk: { label: "BEGIN … COMMIT, 30 kr", sql: L("BEGIN;", U1(30), U2(30), "COMMIT;"), steg: [
      { tekst: START.tekst, tabeller: par(50, 200, 50, 200) },
      { line: 1, tekst: "BEGIN starter en transaksjon.", tabeller: par(50, 200, 50, 200) },
      { line: 2, tekst: { eli5: "Ada betaler 30. Det ser vi selv, men de andre ser det ikke ennå.",
          normal: "Ada har 20 i denne økta. Endringen er ikke lagret, så andre ser fortsatt 50.",
          teknisk: "Endringen er gjort i transaksjonen, men ikke lagret. Andre økter ser den gamle verdien (isolation)." },
        tabeller: par(20, 200, 50, 200, C(0)) },
      { line: 3, tekst: "Bo har 230 i denne økta. Fortsatt ikke lagret.", tabeller: par(20, 230, 50, 200, { celler: { "0,2": "hit", "1,2": "hit" } }) },
      { line: 4, tekst: { eli5: "Nå lagres begge endringene samtidig. Summen er fortsatt 250.",
          normal: "COMMIT lagrer begge endringene på én gang. Nå ser alle 20 og 230, og summen er 250.",
          teknisk: "COMMIT gjør begge endringene synlige samtidig og varige (durability)." },
        tabeller: par(20, 230, 20, 230, { celler: { "0,2": "hit", "1,2": "hit" } }, { celler: { "0,2": "hit", "1,2": "hit" } }) }
    ] },
    rollback: { label: "BEGIN … ROLLBACK, 30 kr", sql: L("BEGIN;", U1(30), U2(30), "ROLLBACK;"), steg: [
      { tekst: START.tekst, tabeller: par(50, 200, 50, 200) },
      { line: 1, tekst: "BEGIN starter en transaksjon.", tabeller: par(50, 200, 50, 200) },
      { line: 2, tekst: "Ada har 20 i denne økta, ikke lagret.", tabeller: par(20, 200, 50, 200, C(0)) },
      { line: 3, tekst: "Bo har 230 i denne økta, ikke lagret.", tabeller: par(20, 230, 50, 200, { celler: { "0,2": "hit", "1,2": "hit" } }) },
      { line: 4, tekst: { eli5: "Vi angrer hele pakken. Alt blir som før, selv om ingenting gikk galt.",
          normal: "ROLLBACK angrer alt siden BEGIN. Ada har 50 og Bo 200 igjen.",
          teknisk: "ROLLBACK forkaster transaksjonen. Ingen av endringene ble noen gang synlige for andre." },
        tabeller: par(50, 200, 50, 200) }
    ] }
  };
  P.txDemo = function (host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var bar = el("div", { class: "btn-row", role: "group", "aria-label": "Velg script" });
    var stage = el("div");
    host.appendChild(bar); host.appendChild(stage);
    var bs = Object.keys(TX).map(function (k) {
      var b = el("button", { class: "btn sm", type: "button", text: TX[k].label, onclick: function () { show(k); } });
      b._k = k; bar.appendChild(b); return b;
    });
    function show(k) {
      bs.forEach(function (b) { b.setAttribute("aria-pressed", b._k === k ? "true" : "false"); });
      clear(stage);
      IN.sqlSteps(stage, { sql: TX[k].sql, steg: TX[k].steg });
    }
    show("uten");
  };

  /* ================= SQL-injection: sammensetting mot parameter ================= */
  var LAAN_AV = { Ada: ["Et dukkehjem", "Peer Gynt"], Bo: ["Mrs Dalloway"], Cato: ["Et dukkehjem", "Brødrene Løvehjerte"], Dina: [], Ibsen: ["Kristin Lavransdatter"] };
  var ALLE = ["Et dukkehjem", "Peer Gynt", "Mrs Dalloway", "Et dukkehjem", "Brødrene Løvehjerte", "Kristin Lavransdatter"];
  var Q_HODE = "SELECT b.tittel FROM utlån AS u\n  INNER JOIN låner AS l ON (u.lid = l.lid)\n  INNER JOIN bok AS b ON (u.bid = b.bid)\nWHERE l.navn = ";
  var PRESET = ["Ada", "Dina", "O'Hara", "Ada' OR 'a' = 'a", "x'; DROP TABLE utlån; --"];
  P.injDemo = function (host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var row = el("div", { class: "btn-row" });
    var inp = el("input", { type: "text", class: "pg-input", "aria-label": "Navn på låner", value: "Ada", spellcheck: "false", autocomplete: "off" });
    row.appendChild(el("label", { class: "small", text: "navn = " }));
    row.appendChild(inp);
    var pre = el("div", { class: "btn-row pg-presets", role: "group", "aria-label": "Eksempler på input" });
    PRESET.forEach(function (p) {
      pre.appendChild(el("button", { class: "btn sm ghost", type: "button", text: p, onclick: function () { inp.value = p; paint(); } }));
    });
    var out = el("div", { class: "grid cols-2 pg-inj", "aria-live": "polite" });
    host.appendChild(row); host.appendChild(pre); host.appendChild(out);
    inp.addEventListener("input", paint);

    function lån(v) { return Object.prototype.hasOwnProperty.call(LAAN_AV, v) ? LAAN_AV[v] : null; }
    function resTab(navn, rader, cap) {
      return { navn: navn, kolonner: ["tittel"], rader: rader.map(function (t) { return [t]; }), caption: cap, tom: "0 rader" };
    }
    function paint() {
      clear(out);
      var v = inp.value, quotes = (v.match(/'/g) || []).length;
      var a = el("div", { class: "pg-col pg-bad" }), b = el("div", { class: "pg-col pg-good" });
      a.appendChild(el("h5", { html: "Strengsammensetting <span class=\"tag\">sårbar</span>" }));
      b.appendChild(el("h5", { html: "Parameter (%s eller ?) <span class=\"tag\">trygg</span>" }));
      // Sårbar: brukerens tekst blir en del av SQL-en
      IN.sqlBlock(a, Q_HODE + "'" + v + "';");
      var msg, tab = null;
      if (quotes === 0) { tab = resTab("svar", lån(v) || []); msg = "Ingen fnutter i input, så spørringen blir som programmereren mente."; }
      else if (v === "Ada' OR 'a' = 'a") { tab = resTab("svar", ALLE); msg = "<b>Injection.</b> " + m("OR 'a' = 'a'") + " er sant for alle rader, så du får alle seks lånene, også andres."; }
      else if (v === "x'; DROP TABLE utlån; --") { msg = "<b>Injection.</b> Fnutten avslutter strengen, " + m(";") + " avslutter spørringen, og " + m("DROP TABLE utlån") + " blir en ny kommando. " + m("--") + " gjør resten til en kommentar. Har programmet rett til det, er tabellen borte."; }
      else if (quotes % 2 === 1) { msg = "<b>ERROR: syntaksfeil.</b> Fnutten i navnet avslutter strengen for tidlig. Et helt vanlig navn får programmet til å krasje."; }
      else { msg = "Fnuttene i input endrer hvordan databasen leser spørringen. Demoen kjører den ikke, men det er ikke lenger spørringen programmereren skrev."; }
      a.appendChild(el("p", { class: "pg-msg", html: msg }));
      if (tab) IN.vizTable(a, tab, { compact: true });
      // Trygg: spørringen er fast, verdien sendes for seg
      IN.sqlBlock(b, Q_HODE + "%s;   -- verdien sendes for seg");
      b.appendChild(el("p", { class: "pg-msg", html: "Verdien: " + m(esc("'" + v.replace(/'/g, "''") + "'")) + ". Databasen leser den bare som tekst, aldri som SQL." +
        (lån(v) ? "" : " Ingen låner heter akkurat dette, så svaret er tomt.") }));
      IN.vizTable(b, resTab("svar", lån(v) || []), { compact: true });
      out.appendChild(a); out.appendChild(b);
    }
    paint();
  };

  /* ================= Eksamensoppgavene for siden ================= */
  // bank.js tar én block og én tema-streng. Siden trenger oppgaver fra tre blokker (programmering,
  // VIEW i sql-videre, transaksjon i sql), så vi gir IN.examBank en filtrert kopi av banken og
  // setter den ekte tilbake rett etterpå. Alt skjer synkront. (Forslag om tema-liste: plan/requests/sql-programmering.md.)
  var VIS = { "VIEW": 1, "CREATE VIEW": 1, "BEGIN/COMMIT": 1 };
  function hører(o) { return o.block === "sql-programmering" || (o.tema || []).some(function (t) { return VIS[t]; }); }
  P.bank = function (host) {
    var ekte = window.IN_EXAM_BANK || {}, kopi = {};
    Object.keys(ekte).forEach(function (y) {
      var ex = ekte[y], ny = {};
      for (var k in ex) if (Object.prototype.hasOwnProperty.call(ex, k)) ny[k] = ex[k];
      ny.oppgaver = (ex.oppgaver || []).filter(hører);
      if (ny.oppgaver.length) kopi[y] = ny;
    });
    window.IN_EXAM_BANK = kopi;
    try { return IN.examBank(host, {}); }
    finally { window.IN_EXAM_BANK = ekte; }
  };

  /* ================= Nivåtekster ================= */
  P.explain = {
    views: {
      eli5: "<p>Tenk deg at du hver dag spør bibliotekaren: «Hvem har bøker som ikke er levert?» Hun må lete i tre permer hver gang. Et <b>view</b> er en lapp der spørsmålet står ferdig skrevet, med et navn på. Du sier bare navnet, og hun leter på nytt. Svaret er alltid ferskt.</p>" +
        "<p>Et <b>materialisert view</b> er at hun skriver svaret på et ark og gir deg arket. Det går fort å lese, men arket blir gammelt når noen låner eller leverer, helt til du ber henne skrive det på nytt.</p>",
      normal: "<p>Et <b>VIEW</b> er en navngitt spørring. Du lager det med " + m("CREATE VIEW navn AS SELECT …") + ", og etterpå kan du bruke navnet i FROM som om det var en tabell. Databasen lagrer bare spørringen, ikke svaret. Viewet regnes derfor ut på nytt hver gang det brukes, og er alltid i takt med tabellene.</p>" +
        "<p>Views brukes til spørringer som går igjen, til å bygge lag over tabellene, og til å vise utledbare verdier (som alder) uten å lagre dem. Et <b>MATERIALIZED VIEW</b> lagrer svaret som en tabell på disk. Det er raskt å spørre mot, men oppdateres bare når du kjører " + m("REFRESH MATERIALIZED VIEW") + ".</p>",
      teknisk: "<p>Et view er en spørring med navn, lagret i databasen. Når en spørring bruker viewet, settes definisjonen inn som en delspørring i FROM. " + m("SELECT … FROM v WHERE …") + " er altså det samme som " + m("SELECT … FROM (definisjonen) AS v WHERE …") + ". Derfor tar et vanlig view ingen plass og trenger aldri oppdateres: det finnes ikke noe lagret svar som kan bli gammelt. Prisen er at spørringen kjøres hver gang.</p>" +
        "<p>Et materialisert view snur dette. Svaret beregnes én gang og lagres som en vanlig tabell, så oppslag er like raske som mot en tabell. Men databasen holder det ikke oppdatert av seg selv. Du må kjøre " + m("REFRESH MATERIALIZED VIEW") + " når tabellene under har endret seg.</p>"
    },
    transaksjoner: {
      eli5: "<p>Når du bytter kort med en venn, skal begge kortene skifte eier, ikke bare det ene. Går noe galt midt i, vil du at byttet ikke skal ha skjedd i det hele tatt.</p><p>En <b>transaksjon</b> er et løfte fra databasen: enten blir alt i pakken gjort, eller ingenting. BEGIN betyr «nå starter pakken». COMMIT betyr «gjør det ferdig og lagre». ROLLBACK betyr «angre alt i pakken».</p>",
      normal: "<p>En <b>transaksjon</b> samler flere SQL-kommandoer til én enhet. Du starter med " + m("BEGIN;") + " og avslutter med " + m("COMMIT;") + ". Feiler én kommando underveis, blir ingen av endringene lagret.</p>" +
        "<p>Det klassiske eksemplet er en overføring: trekk 100 fra én konto og legg 100 til en annen. Uten transaksjon kan det første steget feile mens det andre går gjennom. Vil du angre selv, avslutter du med " + m("ROLLBACK;") + " i stedet. Uten BEGIN kjører PostgreSQL hver kommando som sin egen lille transaksjon.</p>",
      teknisk: "<p>Lysarkene beskriver transaksjoner med fire krav, <b>ACID</b> (se under). I PostgreSQL gjør en feil inne i en transaksjon at resten av kommandoene ignoreres, og COMMIT blir da til ROLLBACK. Det er derfor et helt script bør kjøres som én transaksjon: enten står alt der etterpå, eller ingenting.</p>" +
        "<p>Endringer inne i en transaksjon ser bare økta selv. Andre ser dem først etter COMMIT. Det er isolasjonskravet i praksis. Hvordan databasen får til dette når mange kjører samtidig (låsing og samtidighetskontroll), er ikke pensum.</p>"
    },
    program: {
      eli5: "<p>Et program som bruker en database, er som et bud. Først må budet finne fram og vise legitimasjon (<b>tilkoblingen</b>). Så skriver budet spørsmålet på en lapp, leverer den og tar med svaret tilbake.</p><p>Det viktige: det brukeren skriver inn, skal legges ved som et eget vedlegg, ikke skrives rett inn i spørsmålet. Ellers kan en lur bruker skrive noe som endrer selve spørsmålet.</p>",
      normal: "<p>Programmer sender SQL til databasen som tekst. Du trenger to ting: en <b>tilkobling</b> (Connection) med databasenavn, bruker og passord, og en <b>spørrings-eksekverer</b> laget fra tilkoblingen (cursor i Python, Statement eller PreparedStatement i Java). Den kjører spørringen med " + m("execute") + ".</p>" +
        "<p>Svaret hentes som en liste av tupler (" + m("fetchall()") + " i Python) eller gås gjennom rad for rad i et ResultSet (" + m("next()") + " og " + m("getString(…)") + " i Java). Verdier fra brukeren sendes som <b>parametre</b>: " + m("%s") + " i psycopg og " + m("?") + " i en PreparedStatement.</p>",
      teknisk: "<p>Fordi SQL-en er en streng, er det fristende å lime inn brukerens input med +. Da blandes data og kommandoer, og en fnutt i input kan endre hva spørringen gjør (<b>SQL-injection</b>). Med parametrisering sendes spørringen med plassholdere og verdiene hver for seg, så databasen aldri leser verdien som SQL.</p>" +
        "<p>I psycopg skriver du " + m("%s") + " uten fnutter og gir verdiene som en tuppel: " + m("cur.execute(sql, (navn,))") + ". I JDBC lager du en PreparedStatement med " + m("?") + " og fyller inn med " + m("setString(1, navn)") + ", der nummereringen starter på 1. Endringer må lagres: psycopg lagrer ingenting før " + m("conn.commit()") + ".</p>"
    }
  };

  /* ================= Flervalg per fane ================= */
  P.quiz = {
    views: [
      { q: "Hva lagrer databasen når du kjører " + m("CREATE VIEW v AS SELECT …") + "?", options: ["Svaret på spørringen, som en tabell", "Bare spørringen, under navnet v", "En kopi av alle tabellene spørringen bruker", "Ingenting, viewet forsvinner når økta avsluttes"], answer: 1,
        explain: "Et vanlig view er en navngitt spørring. Svaret regnes ut på nytt hver gang viewet brukes. Det er det materialiserte viewet som lagrer svaret." },
      { q: "En ny rad settes inn i en tabell som et MATERIALIZED VIEW bygger på. Hva skjer med det materialiserte viewet?", options: ["Det oppdateres med en gang", "Ingenting, før noen kjører REFRESH MATERIALIZED VIEW", "Det slettes", "INSERT feiler"], answer: 1,
        explain: "Et materialisert view er et lagret svar. Det oppdateres ikke av seg selv. Du må kjøre " + m("REFRESH MATERIALIZED VIEW navn;") + "." },
      { q: "Oppgaven sier «Lag et view som viser …». Du skriver en korrekt SELECT, men glemmer " + m("CREATE VIEW") + ". Hva har sensor gjort før?", options: ["Ingen trekk, spørringen er riktig", "Trukket 3 poeng (H2020 S5)", "Gitt 0 poeng", "Trukket 0,5 poeng"], answer: 1,
        explain: "Sensorveiledningen for H2020 trakk −3 for manglende CREATE VIEW. Skriv alltid " + m("CREATE VIEW navn AS") + " foran spørringen når oppgaven ber om et view." }
    ],
    transaksjoner: [
      { q: "Du kjører " + m("BEGIN;") + ", to UPDATE-er der den første bryter en CHECK, og så " + m("COMMIT;") + ". Hva er lagret etterpå (PostgreSQL)?", options: ["Bare den andre UPDATE-en", "Begge, fordi COMMIT tvinger det gjennom", "Ingen av dem", "Den første, uten CHECK"], answer: 2,
        explain: "Feilen gjør transaksjonen avbrutt. Den andre UPDATE-en ignoreres, og COMMIT blir til ROLLBACK. Alt eller ingenting." },
      { q: "Hvilken ACID-egenskap sier at endringer som er lagret med COMMIT, fortsatt finnes etter en omstart?", options: ["Atomicity", "Consistency", "Isolation", "Durability"], answer: 3,
        explain: "Durability: det som er lagret, blir værende. Atomicity er alt eller ingenting, consistency er at skrankene holder, og isolation er at samtidige transaksjoner gir samme svar som om de kjørte etter hverandre." },
      { q: "Et script lager en tabell og setter inn data. Det skal ikke bli liggende en tom tabell hvis INSERT feiler. Hva gjør du?", options: ["Setter INSERT før CREATE TABLE", "Pakker hele scriptet inn i BEGIN; … COMMIT;", "Bruker CREATE TABLE IF NOT EXISTS", "Kjører scriptet to ganger"], answer: 1,
        explain: "Det er mønsteret i H2025 2.3 og repetisjonsoppgave 7. IF NOT EXISTS hindrer feil når tabellen finnes fra før, men gjør ikke kommandoene til én enhet." }
    ],
    program: [
      { q: "Hvilken linje er trygg mot SQL-injection i Python (psycopg2)?", options: [
          m("cur.execute(\"… WHERE navn = '\" + navn + \"';\")"),
          m("cur.execute(\"… WHERE navn = %s;\", (navn,))"),
          m("cur.execute(\"… WHERE navn = '%s';\" % navn)"),
          m("cur.execute(\"… WHERE navn = '%s';\", (navn,))")], answer: 1,
        explain: "Bare alternativ 2 sender verdien for seg. Alternativ 3 bruker Pythons %-operator, som limer inn teksten før execute ser den. Det er sammensetting i forkledning. Alternativ 4 har fnutter rundt %s. psycopg setter selv inn fnuttene, så du får dem dobbelt." },
      { q: "Hvilket nummer har den første plassholderen i " + m("stmt.setString(…, omrade)") + " i JDBC?", options: ["0", "1", "Navnet på kolonnen", "Det spiller ingen rolle"], answer: 1,
        explain: "Plassholderne nummereres fra 1, i den rekkefølgen " + m("?") + " står i spørringen. Det samme gjelder kolonnenumrene i " + m("res.getString(1)") + "." },
      { q: "Funksjonen kjører en UPDATE med psycopg2, men endringen finnes ikke når du sjekker i psql etterpå. Hva mangler mest sannsynlig?", options: [m("cur.fetchall()"), m("conn.commit()"), "Semikolon i SQL-en", m("conn.close()")], answer: 1,
        explain: "psycopg starter en transaksjon ved første kommando og lagrer ingenting før " + m("conn.commit()") + ". Avsluttes programmet uten commit, forsvinner endringen. I JDBC er autocommit på som standard, så der lagres den med en gang." }
    ]
  };

  /* ================= Sant/usant ================= */
  P.tf = [
    { s: "Et vanlig VIEW tar like mye plass som en tabell med det samme innholdet.", answer: false, tema: "VIEW",
      explain: "Bare spørringen lagres. Svaret regnes ut hver gang viewet brukes." },
    { s: "Et VIEW kan brukes i FROM som om det var en tabell.", answer: true, tema: "VIEW",
      explain: "Det er hele poenget. Definisjonen settes inn som en delspørring." },
    { s: "Et MATERIALIZED VIEW oppdateres automatisk når tabellene det bygger på endres.", answer: false, tema: "VIEW",
      explain: "Du må kjøre " + m("REFRESH MATERIALIZED VIEW navn;") + ". Til da viser det det gamle svaret." },
    { s: "Et view kan gi tilbake et utledbart attributt, som alder, uten at det lagres.", answer: true, tema: "VIEW",
      explain: "Utledbare attributter droppes ved realisering. Et view kan regne dem ut igjen fra lagrede verdier, for eksempel fødselsdato." },
    { s: "Uten BEGIN kjører PostgreSQL hver kommando som sin egen transaksjon.", answer: true, tema: "Transaksjon",
      explain: "Derfor kan den andre UPDATE-en i en overføring gå gjennom selv om den første feiler, hvis du ikke bruker BEGIN." },
    { s: "ROLLBACK angrer bare den siste kommandoen i transaksjonen.", answer: false, tema: "Transaksjon",
      explain: "ROLLBACK angrer alt siden BEGIN." },
    { s: "Consistency i ACID betyr at ingen skranker er brutt når en transaksjon har lyktes.", answer: true, tema: "Transaksjon",
      explain: "Slik lysarkene definerer det. En overføring som skaper penger, bryter ingen skranke, så det må transaksjonen sørge for." },
    { s: "I psycopg2 skal plassholderen skrives " + m("'%s'") + " med fnutter når verdien er tekst.", answer: false, tema: "Program",
      explain: "Skriv " + m("%s") + " uten fnutter. psycopg setter inn fnutter og escaper verdien selv." },
    { s: "I psycopg2 må parametrene gis som en tuppel, så én verdi skrives " + m("(navn,)") + ".", answer: true, tema: "Program",
      explain: m("(navn)") + " er bare navn i parentes. Kommaet gjør det til en tuppel." },
    { s: "Med en PreparedStatement og " + m("?") + " kan en fnutt i brukerens input ikke endre spørringen.", answer: true, tema: "Program",
      explain: "Verdien sendes for seg og leses alltid som data." },
    { s: "I JDBC er autocommit av som standard, så du må alltid kalle " + m("conn.commit()") + ".", answer: false, tema: "Program",
      explain: "Det er motsatt: autocommit er på som standard i JDBC. Det er i psycopg2 at du må kalle commit. Se merknaden om H2023 2.7." }
  ];
})();
