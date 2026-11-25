/* ============================================================
   IN2090 guide · sql-oppgave.js
   «Skriv SQL»-oppgaver med automatisk retting (design B i plan/interaktive-ovinger.md).

   IN.sqlTask(host, spec, opts) → element
     spec: { id, tittel, tekst (html), fasit, godta?: [sql], krav?: [{ med|uten: "UNION", tekst }],
             hint?: [html], tester?: "kort tekst om testdatabasen" }
     opts: { dbs: { eksempel, felle, perm } (fra IN.sqlTask.lagDbs), skjema? }
   IN.sqlTask.vurder(spec, sql, dbs) → ren vurdering uten DOM (brukes også av testene)
   IN.sqlTask.lagDbs(dbSpec, frø) → { eksempel, felle, perm }
   Monteres automatisk i <div data-sql-ovelser="4"> med oppgavene fra IN.sqlOvelser der blokk = 4.

   Vurdering: kjør på eksempeldataene, så på feller-databasen og en permutert kopi.
   Feil = PostgreSQL avviser spørringen, resultatet er feil, eller et oppgavekrav er brutt.
   Alt annet (store/små bokstaver, semikolon, AS …) er merknader.
   Utkast: in2090:sql:<side>:<id>. Fremdrift: IN.progress.solved("sql", id, …).
   Klassisk script. Lastes etter core.js, sql-lang.js, viz-relation.js og sql-motor.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var M = function () { return IN.sqlMotor; };

  function lagDbs(dbSpec, frø) {
    var mo = M();
    var eks = mo.lagDb(dbSpec.skjema, dbSpec.datasett.eksempel, dbSpec.idag);
    var fel = dbSpec.datasett.felle ? mo.lagDb(dbSpec.skjema, dbSpec.datasett.felle, dbSpec.idag) : null;
    return { eksempel: eks, felle: fel, perm: mo.permuter(fel || eks, frø || 7) };
  }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  var DS_NAVN = { eksempel: "eksempeldataene", felle: "testdatabasen", perm: "en stokket testdatabase" };

  function sjekkKrav(spec, run) {
    var f = run.features || {}, brudd = [];
    (spec.krav || []).forEach(function (k) {
      if (k.med && !f[k.med]) brudd.push(k.tekst || "Oppgaven krever " + k.med + ".");
      if (k.uten && f[k.uten]) brudd.push(k.tekst || "Oppgaven skal løses uten " + k.uten + ".");
      if (k.kolonner) {
        var ok = k.kolonner.length === run.kolonner.length && k.kolonner.every(function (c, i) { return String(run.kolonner[i]).toLowerCase() === c; });
        if (!ok) brudd.push(k.tekst || "Kolonnene skal hete " + k.kolonner.join(", ") + ".");
      }
    });
    return brudd;
  }

  // Ren vurdering
  function vurder(spec, sql, dbs) {
    var mo = M(), cache = spec._fasitCache || (spec._fasitCache = {});
    function fasitPå(ds) {
      if (!cache[ds]) cache[ds] = [spec.fasit].concat(spec.godta || []).map(function (f) { return mo.run(f, dbs[ds]); });
      return cache[ds];
    }
    var svar = mo.run(sql, dbs.eksempel), ut = { run: svar, merknader: [], datasett: "eksempel" };
    if (svar.feil) { ut.status = "feil-sql"; ut.merknader = svar.merknader.filter(function (m) { return m.nar === "alltid"; }); return ut; }
    var dsListe = ["eksempel"].concat(dbs.felle ? ["felle"] : []).concat(dbs.perm ? ["perm"] : []), feilet = null;
    for (var i = 0; i < dsListe.length; i++) {
      var ds = dsListe[i], s = ds === "eksempel" ? svar : mo.run(sql, dbs[ds]);
      if (s.feil) { feilet = { ds: ds, run: s, sml: { ok: false, melding: s.feil.melding } }; break; }
      var fl = fasitPå(ds), best = null;
      for (var j = 0; j < fl.length; j++) {
        if (fl[j].feil) continue;
        var r = mo.sammenlign(fl[j], s);
        if (r.ok) { best = { ok: true, sml: r, fasit: fl[j] }; break; }
        if (!best) best = { ok: false, sml: r, fasit: fl[j] };
      }
      if (!best) { feilet = { ds: ds, run: s, sml: { ok: false, melding: "Fasiten kjører ikke (intern feil)." } }; break; }
      if (!best.ok) { feilet = { ds: ds, run: s, sml: best.sml, fasit: best.fasit }; break; }
      if (ds === "eksempel") { ut.smlEks = best.sml; ut.fasitEks = best.fasit; }
    }
    var kravBrudd = sjekkKrav(spec, svar);
    var riktig = !feilet && !kravBrudd.length;
    ut.merknader = svar.merknader.filter(function (m) { return m.nar === "alltid" || !riktig; });
    if (ut.smlEks && ut.smlEks.merknader) ut.smlEks.merknader.forEach(function (t) { ut.merknader.push({ kode: "kolonnenavn", tekst: t, nar: "alltid" }); });
    if (riktig && svar.harDistinct && !svar.distinctFjernet) {
      var fasHar = fasitPå("eksempel")[0].harDistinct;
      if (!fasHar) ut.merknader.push({ kode: "unodig-distinct", tekst: "DISTINCT trengs ikke her: resultatet har ingen duplikater uten. Det teller ikke som feil, men en unødig DISTINCT kan skjule en join som gir duplikater.", nar: "alltid" });
    }
    ut.kravBrudd = kravBrudd;
    if (feilet) { ut.status = "feil"; ut.datasett = feilet.ds; ut.feilRun = feilet.run; ut.sml = feilet.sml; ut.fasit = feilet.fasit; }
    else if (kravBrudd.length) ut.status = "krav";
    else ut.status = "riktig";
    return ut;
  }

  /* ---------- DOM ---------- */
  var el, clear;
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function uthev(src) {
    if (!(IN.sql && IN.sql.tokenize)) return esc(src);
    return String(src).split("\n").map(function (l) { try { return IN.sql.tokenize(l); } catch (e) { return esc(l); } }).join("\n");
  }
  function lagTabell(host, run, opts) {
    opts = opts || {};
    return IN.vizTable(host, { navn: opts.navn || null, kolonner: run.kolonner, rader: run.rader, marks: opts.marks, tom: "(ingen rader)" }, { compact: true });
  }
  // Diff: svarets rader (keep/drop) etterfulgt av manglende rader (new), med fasitens kolonnerekkefølge
  function diffTabell(host, svarRun, sml, fasitRun, navn) {
    var perm = sml.perm || svarRun.kolonner.map(function (_, i) { return i; });
    var rader = [], marks = {};
    svarRun.rader.forEach(function (r, i) { rader.push(perm.map(function (j) { return r[j]; })); marks[i] = sml.svarMerker ? sml.svarMerker[i] : "keep"; });
    (sml.mangler || []).forEach(function (r) { marks[rader.length] = "new"; rader.push(r.slice()); });
    IN.vizTable(host, { navn: navn, kolonner: fasitRun.kolonner, rader: rader, marks: { rader: marks } }, { compact: true });
    host.appendChild(el("p", { class: "sqlo-legend small", html:
      '<span class="sqlo-sw r-keep"></span> lik fasiten · <span class="sqlo-sw r-drop"></span> rad for mye · <span class="sqlo-sw r-new"></span> mangler i ditt svar' }));
  }
  function feilBoks(host, f) {
    var box = el("div", { class: "sqlo-feil", role: "alert" });
    box.appendChild(el("p", { class: "sqlo-feil-tekst", text: f.melding }));
    if (f.linjeTekst != null && f.kol) {
      var pre = el("pre", { class: "sqlo-feil-linje" });
      var len = Math.max(1, Math.min((f.slutt || f.pos + 1) - f.pos, f.linjeTekst.length - f.kol + 1));
      pre.appendChild(document.createTextNode(f.linjeTekst + "\n" + new Array(f.kol).join(" ") + new Array(len + 1).join("^")));
      box.appendChild(pre);
    }
    if (f.kode !== "ikke-stottet" && f.kode !== "grense" && f.kjorer === false)
      box.appendChild(el("p", { class: "small sqlo-feil-sensor", text: "På eksamen: sensor trekker normalt ikke for en liten skrivefeil, men spørringen kjører ikke." }));
    host.appendChild(box);
  }
  function merknadListe(host, merknader) {
    if (!merknader || !merknader.length) return;
    var d = el("div", { class: "sqlo-merk" });
    d.appendChild(el("p", { class: "sqlo-merk-lbl small", text: "Merknader (teller ikke som feil)" }));
    var ul = el("ul", { class: "small" });
    merknader.forEach(function (m) { ul.appendChild(el("li", { text: m.tekst })); });
    d.appendChild(ul);
    host.appendChild(d);
  }
  function hintListe(host, merknader) {
    if (!merknader || !merknader.length) return;
    var d = el("div", { class: "sqlo-merk sqlo-hint" });
    d.appendChild(el("p", { class: "sqlo-merk-lbl small", text: "Dette kan være grunnen" }));
    var ul = el("ul", { class: "small" });
    merknader.forEach(function (m) { ul.appendChild(el("li", { text: m.tekst })); });
    d.appendChild(ul);
    host.appendChild(d);
  }
  function datasettTabeller(host, db) {
    var row = el("div", { class: "sqlo-tabeller" });
    Object.keys(db.tabeller).forEach(function (tn) {
      var t = db.tabeller[tn];
      IN.vizTable(row, { navn: tn, kolonner: t.kolonner.map(function (c) { return { navn: c.navn, pk: c.pk }; }), rader: t.rader }, { compact: true });
    });
    host.appendChild(row);
  }

  function sqlTask(host, spec, opts) {
    el = IN.el; clear = IN.clear;
    if (typeof host === "string") host = IN.qs(host);
    opts = opts || {};
    var dbs = opts.dbs, side = (IN.pageId ? IN.pageId() : "side"), key = "in2090:sql:" + side + ":" + spec.id;
    var kort = el("article", { class: "sqlo", id: "sql-" + spec.id });
    var hode = el("div", { class: "sqlo-hode" });
    hode.appendChild(el("h4", { class: "sqlo-tittel", text: spec.tittel }));
    var merke = el("span", { class: "sqlo-status small", "aria-live": "polite" });
    hode.appendChild(merke);
    kort.appendChild(hode);
    kort.appendChild(el("div", { class: "sqlo-tekst", html: spec.tekst }));

    // Redigering: textarea over en uthevet <pre>
    var lbl = "sqlo-ta-" + spec.id;
    kort.appendChild(el("label", { class: "sr-only", for: lbl, text: "Din SQL for oppgaven " + spec.tittel }));
    var ed = el("div", { class: "sqlo-ed" }), pre = el("pre", { class: "sqlo-pre", "aria-hidden": "true" });
    var ta = el("textarea", { id: lbl, class: "sqlo-ta", rows: "4", autocapitalize: "off", autocorrect: "off", autocomplete: "off", spellcheck: "false",
      placeholder: "SELECT …", "aria-describedby": "sqlo-kbd-" + spec.id });
    ed.appendChild(pre); ed.appendChild(ta);
    kort.appendChild(ed);
    kort.appendChild(el("p", { id: "sqlo-kbd-" + spec.id, class: "sqlo-kbd small muted", text: "Ctrl+Enter kjører spørringen." }));
    function tegn() {
      pre.innerHTML = uthev(ta.value) + "\n";
      ta.style.height = "auto"; ta.style.height = Math.max(ta.scrollHeight, 96) + "px";
    }
    var lagreT = null;
    function lagre() { clearTimeout(lagreT); lagreT = setTimeout(function () { IN.store.set(key, ta.value); }, 300); }
    ta.addEventListener("input", function () {
      var v = ta.value, n = v.replace(/[‘’‚‛′´]/g, "'").replace(/[“”„‟″]/g, '"');
      if (n !== v) { var a = ta.selectionStart, b = ta.selectionEnd; ta.value = n; ta.setSelectionRange(a, b); }
      tegn(); lagre();
    });
    ta.addEventListener("keydown", function (ev) {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); if (ev.shiftKey) sjekk(); else kjør(); }
    });
    ta.value = IN.store.get(key, "") || "";

    var knapper = el("div", { class: "sqlo-knapper" });
    var bKjor = el("button", { class: "btn", type: "button", text: "▶ Kjør", onclick: function () { kjør(); } });
    var bSjekk = el("button", { class: "btn primary", type: "button", text: "Sjekk", onclick: function () { sjekk(); } });
    var bHint = spec.hint && spec.hint.length ? el("button", { class: "btn", type: "button", text: "Hint", onclick: function () { visHint(); } }) : null;
    var bFasit = el("button", { class: "btn", type: "button", text: "Vis fasit", "aria-expanded": "false", onclick: function () { visFasit(); } });
    var bNull = el("button", { class: "btn", type: "button", text: "↺ Nullstill", onclick: function () { nullstill(); } });
    [bKjor, bSjekk, bHint, bFasit, bNull].forEach(function (b) { if (b) knapper.appendChild(b); });
    kort.appendChild(knapper);
    var hintBoks = el("div", { class: "sqlo-hintboks" }), ut = el("div", { class: "sqlo-ut", "aria-live": "polite" }), fasitBoks = el("div", { class: "sqlo-fasit", hidden: true });
    kort.appendChild(hintBoks); kort.appendChild(ut); kort.appendChild(fasitBoks);
    host.appendChild(kort);
    tegn();

    var hintN = 0;
    function visHint() {
      if (hintN >= spec.hint.length) return;
      if (!hintN) hintBoks.appendChild(el("p", { class: "sqlo-merk-lbl small", text: "Hint" }));
      hintBoks.appendChild(el("p", { class: "small sqlo-hint-linje", html: (hintN + 1) + ". " + spec.hint[hintN] }));
      hintN++;
      if (hintN >= spec.hint.length) { bHint.disabled = true; bHint.textContent = "Ingen flere hint"; }
    }
    function status(tekst, cls) { merke.textContent = tekst; merke.className = "sqlo-status small" + (cls ? " " + cls : ""); }
    function visLagret() {
      var p = IN.progress && IN.progress.get ? IN.progress.get("sql:" + side + ":" + spec.id) : null;
      if (p && p.max && p.best >= p.max) status("✓ Løst", "ok"); else status("", "");
    }
    visLagret();

    function kjør() {
      clear(ut);
      if (!ta.value.trim()) { ut.appendChild(el("p", { class: "small muted", text: "Skriv en spørring først." })); return; }
      var r = M().run(ta.value, dbs.eksempel);
      if (r.feil) feilBoks(ut, r.feil);
      else {
        ut.appendChild(el("p", { class: "small muted sqlo-info", text: "Resultat på eksempeldataene (" + r.rader.length + (r.rader.length === 1 ? " rad" : " rader") + "). Trykk Sjekk for å få det rettet." }));
        lagTabell(ut, r);
      }
      merknadListe(ut, r.merknader.filter(function (m) { return m.nar === "alltid"; }));
    }
    function sjekk() {
      clear(ut);
      if (!ta.value.trim()) { ut.appendChild(el("p", { class: "small muted", text: "Skriv en spørring først." })); return; }
      var v = vurder(spec, ta.value, dbs);
      if (v.status === "feil-sql") {
        feilBoks(ut, v.run.feil);
        merknadListe(ut, v.merknader);
        status("Kjører ikke", "feil");
        lagreFremdrift(0);
        return;
      }
      var hint = v.merknader.filter(function (m) { return m.nar === "feil"; }), merk = v.merknader.filter(function (m) { return m.nar !== "feil"; });
      if (v.status === "riktig") {
        ut.appendChild(el("p", { class: "sqlo-ok", html: "<b>Riktig!</b> Samme resultat som fasiten på eksempeldataene og på testdatabasene." }));
        lagTabell(ut, v.run);
        merknadListe(ut, merk);
        status("✓ Løst", "ok");
        lagreFremdrift(1);
        return;
      }
      if (v.status === "krav") {
        ut.appendChild(el("p", { class: "sqlo-nei", html: "<b>Resultatet er riktig, men oppgaven har et krav du ikke oppfyller:</b> " + esc(v.kravBrudd.join(" ")) }));
        merknadListe(ut, merk);
        status("Ikke helt", "feil"); lagreFremdrift(0);
        return;
      }
      // feil resultat
      var ds = v.datasett;
      if (v.feilRun && v.feilRun.feil) {
        ut.appendChild(el("p", { class: "sqlo-nei", html: "<b>Spørringen kjører på eksempeldataene, men ikke på " + DS_NAVN[ds] + ":</b>" }));
        feilBoks(ut, v.feilRun.feil);
      } else if (ds === "eksempel") {
        ut.appendChild(el("p", { class: "sqlo-nei", html: "<b>Ikke riktig ennå.</b> " + esc(v.sml.melding) }));
        if (v.sml.grunn === "kolonner") { lagTabell(ut, v.run, { navn: "Ditt resultat" }); lagTabell(ut, v.fasit, { navn: "Fasiten" }); }
        else if (v.sml.grunn === "rekkefolge") { lagTabell(ut, v.run, { navn: "Ditt resultat", marks: { rader: (function () { var m = {}; m[v.sml.forsteAvvik] = "drop"; return m; })() } }); }
        else diffTabell(ut, v.run, v.sml, v.fasit, "Ditt resultat mot fasiten");
      } else {
        var tekst = "<b>Riktig på eksempeldataene, men feil på " + DS_NAVN[ds] + "</b>" + (ds === "felle" && spec.tester ? " der " + esc(spec.tester) : ds === "perm" ? " der ID-ene og radrekkefølgen er stokket om" : "") + ". " + esc(v.sml.melding);
        ut.appendChild(el("p", { class: "sqlo-nei", html: tekst }));
        var vis = el("button", { class: "btn sm", type: "button", text: "Vis testdataene og diffen", "aria-expanded": "false" });
        var skjult = el("div", { class: "sqlo-diff", hidden: true });
        vis.addEventListener("click", function () {
          var paa = skjult.hidden; skjult.hidden = !paa; vis.setAttribute("aria-expanded", paa ? "true" : "false");
          if (paa && !skjult.firstChild) {
            if (v.sml.grunn === "kolonner" || v.sml.grunn === "rekkefolge") { lagTabell(skjult, v.feilRun, { navn: "Ditt resultat" }); lagTabell(skjult, v.fasit, { navn: "Fasiten" }); }
            else diffTabell(skjult, v.feilRun, v.sml, v.fasit, "Ditt resultat mot fasiten på " + DS_NAVN[ds]);
            skjult.appendChild(el("p", { class: "small sqlo-merk-lbl", text: "Tabellene i " + DS_NAVN[ds] }));
            datasettTabeller(skjult, dbs[ds]);
          }
        });
        ut.appendChild(vis); ut.appendChild(skjult);
      }
      hintListe(ut, hint);
      merknadListe(ut, merk);
      status("Ikke riktig ennå", "feil");
      lagreFremdrift(0);
    }
    function lagreFremdrift(score) { if (IN.progress && IN.progress.solved) IN.progress.solved("sql", spec.id, score, 1); if (score) status("✓ Løst", "ok"); }
    function visFasit() {
      var paa = fasitBoks.hidden;
      fasitBoks.hidden = !paa; bFasit.setAttribute("aria-expanded", paa ? "true" : "false"); bFasit.textContent = paa ? "Skjul fasit" : "Vis fasit";
      if (paa && !fasitBoks.firstChild) {
        fasitBoks.appendChild(el("p", { class: "sqlo-merk-lbl small", text: "Fasit" }));
        IN.sqlBlock(fasitBoks, spec.fasit);
        var r = M().run(spec.fasit, dbs.eksempel);
        if (!r.feil) lagTabell(fasitBoks, r, { navn: "Resultat på eksempeldataene" });
        if (spec.forklaring) fasitBoks.appendChild(el("p", { class: "small", html: spec.forklaring }));
        if (spec.godta && spec.godta.length) {
          fasitBoks.appendChild(el("p", { class: "sqlo-merk-lbl small", text: spec.godta.length === 1 ? "Også riktig" : "Også riktige" }));
          spec.godta.forEach(function (g) { IN.sqlBlock(fasitBoks, g); });
        }
      }
    }
    function nullstill() {
      ta.value = ""; IN.store.set(key, ""); tegn(); clear(ut); clear(hintBoks); hintN = 0;
      if (bHint) { bHint.disabled = false; bHint.textContent = "Hint"; }
      fasitBoks.hidden = true; bFasit.textContent = "Vis fasit"; bFasit.setAttribute("aria-expanded", "false");
      ta.focus();
    }
    return kort;
  }

  sqlTask.vurder = vurder;
  sqlTask.lagDbs = lagDbs;
  IN.sqlTask = sqlTask;

  // Automatisk montering
  function monter() {
    var data = IN.sqlOvelser;
    if (!data || !IN.sqlMotor || !IN.qsa || !IN.el) return;
    el = IN.el; clear = IN.clear;
    IN.qsa("[data-sql-ovelser]").forEach(function (host) {
      if (host.getAttribute("data-montert")) return;
      host.setAttribute("data-montert", "1");
      var blokk = host.getAttribute("data-sql-ovelser"), liste = data.oppgaver.filter(function (o) { return String(o.blokk) === blokk; });
      var dbCache = {};
      host.appendChild(el("p", { class: "small muted", html: "Skriv spørringen selv og trykk <b>Sjekk</b>. Svaret kjøres på eksempeldataene og på to testdatabaser med feller (NULL, rader uten partner, like navn). Store og små bokstaver, semikolon og AS gir bare merknader. Spørringen må likevel være gyldig i PostgreSQL." }));
      var dbNavn = (liste[0] && liste[0].db) || "bibliotek", dbSpec = data.databaser[dbNavn];
      if (dbSpec && IN.schema) {
        var det = el("details", { class: "sqlo-skjema" });
        det.appendChild(el("summary", { text: "Tabellene (bibliotekdatabasen)" }));
        host.appendChild(det);
        IN.schema(det, dbSpec.skjema, { open: true, pin: false });
      }
      liste.forEach(function (o) {
        var spec = data.databaser[o.db || "bibliotek"];
        var dbs = lagDbs(spec, hash(o.id));
        dbCache[o.id] = dbs;
        sqlTask(host, o, { dbs: dbs });
      });
    });
  }
  if (typeof document !== "undefined" && document.addEventListener) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", monter);
    else monter();
  }
  sqlTask.monter = monter;
})();
