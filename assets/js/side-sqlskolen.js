/* ============================================================
   IN2090 guide · side-sqlskolen.js
   Oppstart for sql-skolen.html: notasjon, linjeleser, Parsons (IN.sortTask fra dra.js),
   les spørringen (flervalg, radantall, finn feilen, prøv selv) og skriveguide.
   Resultattabellene regnes ut av sql-motor.js på biblioteksdatabasen (IN.dataSql.skjema),
   så tallene i teksten og tabellene kommer fra samme kilde.
   Bruker IN.dataSqlSkolen (data-sqlskolen.js). Klassisk script, lastes sist.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var el = IN.el, qs = IN.qs, D = IN.dataSqlSkolen;
  var SIDE = "sql-skolen";

  function safe(navn, fn) { try { fn(); } catch (e) { if (window.console) console.error("[sql-skolen] " + navn, e); } }
  function tok(code) { return IN.sql && IN.sql.tokenize ? IN.sql.tokenize(code) : String(code); }
  function mono(html) { return '<span class="mono">' + html + "</span>"; }
  /* Tabellcelle med etikett (data-l), så tabellen kan stables som kort på smal skjerm */
  function td(tr, html, lbl, cls) { var c = el("td", { html: html, "data-l": lbl }); if (cls) c.className = cls; tr.appendChild(c); return c; }

  /* ---------- Biblioteksdatabasen i motoren ---------- */
  var db = null;
  function getDb() {
    if (!db && IN.sqlMotor && IN.dataSql) db = IN.sqlMotor.lagDb(IN.dataSql.skjema, null, "2026-11-25");
    return db;
  }
  function kjor(sql) { var d = getDb(); return d ? IN.sqlMotor.run(sql, d) : { feil: { melding: "SQL-motoren er ikke lastet." }, rader: [], kolonner: [] }; }
  function feilBoks(host, f) {
    var box = el("div", { class: "sqlo-feil", role: "alert" });
    box.appendChild(el("p", { text: f.melding || "Spørringen kunne ikke kjøres." }));
    if (f.linjeTekst != null && f.kol) {
      var len = Math.max(1, Math.min((f.slutt || f.pos + 1) - f.pos, f.linjeTekst.length - f.kol + 1));
      box.appendChild(el("pre", { class: "sqlo-feil-linje", text: f.linjeTekst + "\n" + new Array(f.kol).join(" ") + new Array(len + 1).join("^") }));
    }
    host.appendChild(box);
  }
  function resultat(host, sql, navn) {
    var r = kjor(sql);
    if (r.feil) { feilBoks(host, r.feil); return r; }
    IN.vizTable(host, { navn: navn || "resultat", kolonner: r.kolonner, rader: r.rader, tom: "(ingen rader)" }, { compact: true });
    return r;
  }
  /* Velger-knapper som i Pseudokode-skolen */
  function velger(host, liste, vis) {
    liste.forEach(function (a) {
      host.appendChild(el("button", { class: "btn sm", type: "button", "data-id": a.id, text: a.label, "aria-pressed": "false",
        onclick: function () { vis(a.id); } }));
    });
    return function marker(id) {
      IN.qsa("button", host).forEach(function (b) {
        var on = b.getAttribute("data-id") === id;
        b.classList.toggle("primary", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };
  }
  function byId(liste, id) { for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i]; return liste[0]; }

  /* ================= Notasjon ================= */
  function notasjon() {
    safe("ex-notasjon", function () { IN.explain("#ex-notasjon", D.explainNotasjon, { label: "Forklaring:" }); });
    safe("not-sql", function () {
      var tb = qs("#not-sql-tbody");
      D.sqlNotasjon.forEach(function (r) {
        var tr = el("tr");
        td(tr, mono(r.kode), "Skrivemåte", "sqs-hode");
        td(tr, r.betyr, "Betyr");
        td(tr, r.eks ? mono(r.eks) : "", "Eksempel", r.eks ? "" : "sqs-tom");
        td(tr, r.mer ? '<a href="' + r.mer[0] + '">' + r.mer[1] + "</a>" : "", "Mer", r.mer ? "" : "sqs-tom");
        tb.appendChild(tr);
      });
    });
    safe("not-ra", function () {
      var tb = qs("#not-ra-tbody");
      D.raNotasjon.forEach(function (r) {
        var tr = el("tr");
        td(tr, r.kode, "Skrives", "sqs-ra sqs-hode");
        td(tr, "<b>" + r.navn + ".</b> " + r.betyr, "Betyr");
        td(tr, mono(r.sql), "I SQL");
        tb.appendChild(tr);
      });
    });
    safe("ra-eksempel", function () {
      var h = qs("#ra-eksempel"), e = D.raEksempel;
      h.appendChild(el("p", { html: "<b>Spørsmål:</b> " + e.sporsmal }));
      h.appendChild(el("p", { class: "small muted", text: "Alt i ett uttrykk:" }));
      h.appendChild(el("p", { class: "sqs-ra sqs-ra-blokk", html: e.nestet }));
      h.appendChild(el("p", { class: "small muted", text: "Det samme med navngitte mellomresultater:" }));
      h.appendChild(el("div", { class: "sqs-ra sqs-ra-blokk", html: e.steg.join("<br>") }));
      h.appendChild(el("p", { class: "small muted", text: "Og som SQL. DISTINCT gjør svaret til en mengde, som i RA:" }));
      IN.sqlBlock(h, e.sql);
      resultat(h, e.sql, "svaret");
    });
    safe("ra-match", function () { IN.matchTask("#ra-match", D.raMatch, { side: SIDE }); });
    safe("tf-notasjon", function () {
      IN.tfTest("#tf-notasjon", D.tf.map(function (it) {
        return { s: it.s, answer: it.answer, explain: it.explain, kilde: it.kilde || false };
      }), { id: "sqlskolen-tf" });
    });
  }

  /* ================= Linjeleser ================= */
  function algoFra(q) {
    return { lang: "sql", name: q.id, lines: q.lines.map(function (l) {
      var sp = l.code.match(/^ */)[0].length;
      var o = { code: l.code.slice(sp), indent: Math.floor(sp / 2), eli5: l.eli5, normal: l.normal, teknisk: l.teknisk };
      if (l.grense) o.grense = l.grense;
      return o;
    }) };
  }
  function linjeleser() {
    var pick = qs("#ll-picker"), tittel = qs("#ll-title"), exp = qs("#ll-explainer"), res = qs("#ll-resultat");
    var algos = {};
    var marker = velger(pick, D.linjeleser, vis);
    function vis(id) {
      var q = byId(D.linjeleser, id);
      if (!algos[q.id]) algos[q.id] = algoFra(q);
      tittel.textContent = q.tittel;
      IN.pseudo.explainer(exp, algos[q.id], { levelSwitch: true, dedupe: false });
      IN.clear(res);
      res.appendChild(el("p", { class: "small muted", text: "Resultatet på biblioteksdatabasen, regnet ut av guidens SQL-motor:" }));
      resultat(res, q.lines.map(function (l) { return l.code; }).join("\n"), "resultat");
      marker(q.id);
    }
    vis(D.linjeleser[0].id);
  }

  /* ================= Parsons ================= */
  function parsonsSpec(p) {
    var items = p.linjer.map(function (l, i) {
      return { id: "l" + i, html: '<code class="sqs-kode">' + tok(l[0].replace(/^\s+/, "")) + "</code>", explain: "<p>" + l[1] + "</p>" };
    });
    var losning = p.linjer.map(function (l) { return tok(l[0]); }).join("\n");
    return {
      id: "sqlskolen-pa-" + p.id, mode: "sort",
      prompt: "<p><b>Oppgave:</b> " + p.oppgave + "</p><p class=\"small muted\">Sett linjene i riktig rekkefølge. Innrykket er fjernet, så du må lese hva hver linje gjør.</p>",
      items: items,
      answer: items.map(function (it) { return it.id; }),
      godta: p.godta || undefined,
      oppsummering: "<p>Hele spørringen:</p><pre class=\"sqs-pre\">" + losning + "</pre>"
    };
  }
  function parsons() {
    var pick = qs("#pa-picker"), host = qs("#pa-host"), res = qs("#pa-resultat");
    var marker = velger(pick, D.parsons, vis);
    function vis(id) {
      var p = byId(D.parsons, id);
      IN.clear(host); IN.clear(res);
      IN.sortTask(host, parsonsSpec(p), { side: SIDE });
      var sql = p.linjer.map(function (l) { return l[0]; }).join("\n").replace(/^CREATE VIEW \S+ AS\n/, "");
      var d = el("details", { class: "sqs-res" });
      d.appendChild(el("summary", { text: "Vis hva spørringen gir på biblioteksdatabasen" }));
      res.appendChild(d);
      resultat(d, sql, /^CREATE VIEW/.test(p.linjer[0][0]) ? "innholdet i viewet" : "resultat");
      marker(p.id);
    }
    vis(D.parsons[0].id);
  }

  /* ================= Les spørringen ================= */
  function les() {
    safe("les-quiz", function () {
      IN.quiz("#les-quiz", D.lesQuiz.map(function (it) {
        var o = { q: it.q, options: it.options, answer: it.answer, explain: it.explain, kilde: it.kilde };
        if (it.godta) o.godta = it.godta;
        o.render = it.sql ? function (node) { IN.sqlBlock(node, it.sql); }
          : function (node) { node.appendChild(el("p", { class: "sqs-ra sqs-ra-blokk", html: it.ra })); };
        return o;
      }), { id: "sqlskolen-les" });
    });

    safe("radantall", function () {
      var host = qs("#radantall");
      D.radantall.forEach(function (it, i) {
        var card = el("div", { class: "card sqs-rad" });
        card.appendChild(el("h4", { text: "Spørring " + (i + 1) }));
        IN.sqlBlock(card, it.sql);
        var inp = el("input", { type: "text", inputmode: "numeric", autocomplete: "off", class: "sqs-tall", "aria-label": "Antall rader i svaret på spørring " + (i + 1) });
        var ut = el("div", { class: "sqs-rad-ut", "aria-live": "polite" });
        var btn = el("button", { class: "btn sm primary", type: "button", text: "Sjekk" });
        var vis = el("button", { class: "btn sm", type: "button", text: "Vis svaret" });
        function svar(gjettet) {
          IN.clear(ut);
          var r = kjor(it.sql);
          var n = r.feil ? it.fasit : r.rader.length;
          if (gjettet != null) {
            var ok = gjettet === n;
            ut.appendChild(el("p", { class: ok ? "sqs-ok" : "sqs-bad", html: (ok ? "✓ Riktig: " : "✗ Ikke riktig. Svaret er ") + "<b>" + n + (n === 1 ? " rad" : " rader") + "</b>." }));
          } else ut.appendChild(el("p", { html: "Svaret er <b>" + n + (n === 1 ? " rad" : " rader") + "</b>." }));
          ut.appendChild(el("p", { class: "small", html: it.forklaring }));
          if (!r.feil) IN.vizTable(ut, { navn: "resultat", kolonner: r.kolonner, rader: r.rader }, { compact: true });
          if (IN.progress && gjettet != null) IN.progress.solved("sqlskolen-rad", "rad-" + i, gjettet === n ? 1 : 0, 1);
        }
        btn.addEventListener("click", function () {
          // Godta «3», «3 rader», «3.» og desimalkomma; bare tallet teller
          var v = inp.value.trim().replace(",", ".").replace(/^(-?\d+(?:\.\d+)?)\s*(rad|rader|stk)?\.?$/i, "$1");
          if (v === "" || isNaN(+v)) { IN.clear(ut); ut.appendChild(el("p", { class: "small muted", text: "Skriv inn et tall først." })); return; }
          svar(Math.round(+v));
        });
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); btn.click(); } });
        vis.addEventListener("click", function () { svar(null); });
        card.appendChild(el("div", { class: "btn-row sqs-rad-row" }, [el("label", { class: "small", text: "Antall rader:" }), inp, btn, vis]));
        card.appendChild(ut);
        host.appendChild(card);
      });
    });

    safe("finn-feil", function () {
      var host = qs("#ff-host");
      D.finnFeil.forEach(function (it, i) {
        var card = el("div", { class: "card sqs-ff" });
        card.appendChild(el("h4", { text: (i + 1) + ". " + it.oppgave }));
        var kode = el("div");
        card.appendChild(kode);
        var status = el("p", { class: "small sqs-ff-status", "aria-live": "polite", text: "Klikk linja du mener er feil." });
        card.appendChild(status);
        host.appendChild(card);
        var h = IN.sql.render(kode, it.sql, { interactive: true, tooltips: false });
        var losst = false, forsok = 0;
        function fasit(prefix, cls) {
          status.className = "small sqs-ff-status " + cls;
          status.innerHTML = prefix + " " + it.forklaring + "<br><b>Rettet:</b> " + mono(IN.sql.esc(it.rett));
        }
        h.onLineClick(function (n) {
          if (losst) return;
          h.select(n);
          if (it.feil.indexOf(n) >= 0) { losst = true; fasit("✓ Riktig linje.", "sqs-ok"); if (IN.progress) IN.progress.solved("sqlskolen-ff", "ff-" + i, 1, 1); }
          else if (++forsok >= 2) { losst = true; it.feil.forEach(function (x) { var r = h.rowByNo(x); if (r) r.classList.add("sqs-feillinje"); }); fasit("Feilen er på linje " + it.feil.join(" eller ") + ".", "sqs-bad"); }
          else { status.className = "small sqs-ff-status"; status.textContent = "Linje " + n + " er grei. Prøv én gang til."; }
        });
      });
    });

    safe("sandkasse", function () {
      var host = qs("#sandkasse");
      var ta = el("textarea", { class: "sqs-ta", rows: "7", spellcheck: "false", autocapitalize: "off", "aria-label": "SQL-spørring" });
      ta.value = "SELECT l.navn, b.tittel\nFROM utlån AS u\n  INNER JOIN låner AS l ON (u.lid = l.lid)\n  INNER JOIN bok AS b ON (u.bid = b.bid)\nWHERE u.levert IS NULL;";
      var ut = el("div", { "aria-live": "polite" });
      var btn = el("button", { class: "btn sm primary", type: "button", text: "Kjør" });
      function go() {
        IN.clear(ut);
        if (!ta.value.trim()) { ut.appendChild(el("p", { class: "small muted", text: "Skriv en spørring først." })); return; }
        var r = kjor(ta.value);
        if (r.feil) feilBoks(ut, r.feil);
        else IN.vizTable(ut, { navn: "resultat", kolonner: r.kolonner, rader: r.rader, tom: "(ingen rader)" }, { compact: true });
      }
      btn.addEventListener("click", go);
      ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); go(); } });
      host.appendChild(ta);
      host.appendChild(el("div", { class: "btn-row" }, [btn, el("span", { class: "small muted", text: "Ctrl + Enter kjører også." })]));
      host.appendChild(ut);
    });
  }

  /* ================= Skriveguide ================= */
  function skriveguide() {
    safe("ex-skriv", function () { IN.explain("#ex-skriv", D.explainSkriv, { label: "Forklaring:" }); });
    safe("oppskrift", function () {
      var ol = qs("#sg-oppskrift");
      D.oppskrift.forEach(function (s) { ol.appendChild(el("li", { html: s })); });
    });
    safe("sitater", function () {
      var a = qs("#sg-sitat-oppgave");
      a.appendChild(el("blockquote", { class: "sqs-sitat", text: D.sitatOppgave.tekst }));
      a.appendChild(el("p", { class: "qz-kilde", text: D.sitatOppgave.kilde }));
      var b = qs("#sg-sitat-sensor");
      var bq = el("blockquote", { class: "sqs-sitat" });
      bq.appendChild(el("p", { text: D.sitatSensor.intro }));
      var ul = el("ul");
      D.sitatSensor.punkter.forEach(function (p) { ul.appendChild(el("li", { text: p })); });
      bq.appendChild(ul);
      b.appendChild(bq);
      b.appendChild(el("p", { class: "qz-kilde", text: D.sitatSensor.kilde }));
    });
    safe("ordliste", function () {
      var tb = qs("#sg-ordliste");
      D.ordliste.forEach(function (r) {
        var tr = el("tr");
        td(tr, r[0], "Står det", "sqs-hode");
        td(tr, r[1], "Trenger du");
        td(tr, r[2], "Vanlig feil");
        td(tr, '<a href="' + r[3][0] + '">' + r[3][1] + "</a>", "Mer");
        tb.appendChild(tr);
      });
    });
    safe("for-etter", function () {
      qs("#sg-oppgave").innerHTML = "<b>Oppgave:</b> " + D.skrivOppgave;
      var bad = qs("#sg-bad"), good = qs("#sg-good");
      IN.sqlBlock(bad, D.skrivDarlig);
      var ulb = el("ul", { class: "small" }); D.skrivDarligFeil.forEach(function (s) { ulb.appendChild(el("li", { html: s })); }); bad.appendChild(ulb);
      var db1 = el("details", { class: "sqs-res" }); db1.appendChild(el("summary", { text: "Hva den gir" })); bad.appendChild(db1);
      resultat(db1, D.skrivDarlig, "resultat");
      IN.sqlBlock(good, D.skrivGod);
      var ulg = el("ul", { class: "small" }); D.skrivGodNoter.forEach(function (s) { ulg.appendChild(el("li", { html: s })); }); good.appendChild(ulg);
      var db2 = el("details", { class: "sqs-res" }); db2.appendChild(el("summary", { text: "Hva den gir" })); good.appendChild(db2);
      resultat(db2, D.skrivGod, "resultat");
    });
    safe("sjekkliste", function () {
      var host = qs("#sg-sjekk");
      var boxes = [];
      D.sjekkliste.forEach(function (s, i) {
        var id = "sqs-sj-" + i;
        var cb = el("input", { type: "checkbox", id: id });
        boxes.push(cb);
        host.appendChild(el("div", { class: "sqs-sj" }, [cb, el("label", { for: id, html: s })]));
      });
      host.appendChild(el("div", { class: "btn-row" }, [el("button", { class: "btn sm", type: "button", text: "↺ Nullstill",
        onclick: function () { boxes.forEach(function (b) { b.checked = false; }); } })]));
    });
    safe("ra-svar", function () {
      var ul = qs("#sg-ra");
      D.raSvar.forEach(function (s) { ul.appendChild(el("li", { html: s })); });
    });
  }

  IN.sqlSkolen = {
    init: function () {
      safe("skjema", function () { IN.schema("#skjema", IN.dataSql.skjema, { open: false, pin: true }); });
      safe("notasjon", notasjon);
      safe("linjeleser", linjeleser);
      safe("parsons", parsons);
      safe("les", les);
      safe("skriveguide", skriveguide);
    },
    _parsonsSpec: parsonsSpec
  };
})();
