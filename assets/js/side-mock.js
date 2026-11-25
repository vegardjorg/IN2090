/* ============================================================
   IN2090 guide · side-mock.js
   Mock-eksamen (mock.html): tidtaker, oppgavekortene, selvretting og resultatoversikt.
   Data: IN.dataMock (data-mock.js). Krever core.js, viz-relation.js, viz-er.js,
   sql-motor.js og sql-oppgave.js.

   Lagring (alt med prefiks in2090:):
     in2090:mock:tid          { start: ms | null, brukt: ms }      tidtakeren
     in2090:mock:modus        "eksamen" | "ovelse"                 skjul fasit til innlevering?
     in2090:mock:levert       "1" når prøven er levert
     in2090:mock:svar:<key>   fritekstsvaret
     in2090:mock:poeng:<key>  egne poeng (selvvurdering)
     in2090:tf:mock-<nr>, in2090:quiz:mock:mock-<nr>, in2090:sql:mock:<id>  (core.js / sql-oppgave.js)
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var P = "in2090:mock:";
  var el, qs, D, dbs = null, auto = {}, kortListe = [];

  function store(k, v) { if (v === undefined) return IN.store.get(P + k, null); IN.store.set(P + k, v); }
  function fjern(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function fmtP(x) { return (Math.round(x * 10) / 10).toString().replace(".", ","); }
  function send(navn) { try { document.dispatchEvent(new CustomEvent(navn)); } catch (e) {} }

  /* ---------------- Modus: skjul fasit til prøven er levert ---------------- */
  function levert() { return store("levert") === "1"; }
  function modus() { return store("modus") === "ovelse" ? "ovelse" : "eksamen"; }
  function oppdaterModus() {
    var skjul = modus() === "eksamen" && !levert();
    document.body.classList.toggle("mock-skjul", skjul);
    document.body.classList.toggle("mock-levert", levert());
    IN.qsa("[data-mock-status]").forEach(function (n) {
      n.innerHTML = levert() ? "<b>Levert.</b> Fasit, forklaringer og poeng er åpne i alle oppgavene."
        : skjul ? "<b>Eksamensmodus.</b> Fasit og forklaringer er skjult til du leverer."
        : "<b>Øvingsmodus.</b> Du kan sjekke og se fasit underveis.";
    });
    IN.qsa("[data-mock-modus]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-mock-modus") === modus() ? "true" : "false");
      b.disabled = levert();
    });
    IN.qsa("[data-mock-lever]").forEach(function (b) { b.disabled = levert(); });
  }
  function lever() {
    if (levert()) return;
    var ok = true;
    try { ok = window.confirm("Levere prøven? Da åpnes fasit og forklaringer, og svarene på avkrysningsoppgavene låses."); } catch (e) {}
    if (!ok) return;
    store("levert", "1");
    stoppKlokke();
    Object.keys(auto).forEach(function (k) { var a = auto[k]; if (a.h && !a.sjekket()) a.h.check(); });
    oppdaterModus();
    tegnResultat();
    if (IN.tabs && location.hash !== "#fane=resultat") location.hash = "fane=resultat";
  }
  function startPaaNytt() {
    var ok = true;
    try { ok = window.confirm("Slette alle svarene, poengene og tiden i mock-eksamenen og starte på nytt?"); } catch (e) {}
    if (!ok) return;
    var slett = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (k.indexOf(P) === 0 || k.indexOf("in2090:tf:mock-") === 0 || k.indexOf("in2090:quiz:mock:") === 0 || k.indexOf("in2090:sql:mock:") === 0)) slett.push(k);
      }
    } catch (e) {}
    slett.forEach(fjern);
    location.hash = "";
    location.reload();
  }

  /* ---------------- Tidtaker ---------------- */
  var tikk = null;
  function tid() {
    var t = null;
    try { t = JSON.parse(store("tid") || "null"); } catch (e) {}
    if (!t || typeof t !== "object") t = { start: null, brukt: 0 };
    if (typeof t.brukt !== "number" || !isFinite(t.brukt)) t.brukt = 0;
    if (t.start != null && (typeof t.start !== "number" || !isFinite(t.start))) t.start = null;
    return t;
  }
  function lagreTid(t) { store("tid", JSON.stringify(t)); }
  function brukt(t) { return t.brukt + (t.start != null ? Date.now() - t.start : 0); }
  function hms(ms) {
    var neg = ms < 0, s = Math.floor(Math.abs(ms) / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (neg ? "−" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (x < 10 ? "0" : "") + x;
  }
  function tegnKlokke() {
    var t = tid(), total = D.minutter * 60000, igjen = total - brukt(t), gaar = t.start != null;
    var tekst = igjen >= 0 ? hms(igjen) : "Tiden er ute (" + hms(igjen) + ")";
    var tone = igjen <= 0 ? "ute" : igjen <= 15 * 60000 ? "fare" : igjen <= 30 * 60000 ? "varsel" : "";
    IN.qsa("[data-mock-tid]").forEach(function (n) { n.textContent = tekst; });
    IN.qsa(".mock-klokke").forEach(function (n) {
      n.className = "mock-klokke" + (tone ? " " + tone : "") + (gaar ? " gaar" : "");
    });
    var pille = qs("#mock-pille");
    if (pille) {
      pille.hidden = !(gaar || t.brukt > 0) || levert();
      pille.className = "mock-pille" + (tone ? " " + tone : "") + (gaar ? "" : " pause");
      pille.querySelector(".mock-pille-tid").textContent = igjen >= 0 ? hms(igjen) : "Tiden er ute";
      pille.querySelector(".mock-pille-st").textContent = gaar ? "igjen" : "pause";
    }
    var bStart = qs("#mock-start"), bPause = qs("#mock-pause");
    if (bStart) { bStart.disabled = gaar || levert(); bStart.textContent = t.brukt > 0 ? "▶ Fortsett" : "▶ Start prøven"; }
    if (bPause) bPause.disabled = !gaar;
    // Hvilken del bør du jobbe med nå?
    var plan = qs("#mock-naa");
    if (plan) {
      var min = brukt(t) / 60000, acc = 5, naa = null;   // 5 minutter til å lese gjennom settet først
      for (var i = 0; i < D.deler.length; i++) { acc += D.deler[i].minutter; if (min < acc) { naa = D.deler[i]; break; } }
      plan.textContent = !gaar && !t.brukt ? "" : naa ? "Etter planen bør du nå jobbe med del " + naa.nr + " (" + naa.navn + ")." : igjen > 0 ? "Etter planen er du i buffertiden: les over og fyll ut det som mangler." : "";
    }
  }
  function startKlokke() {
    var t = tid(); if (t.start != null) return;
    t.start = Date.now(); lagreTid(t); kjørTikk(); tegnKlokke();
  }
  function stoppKlokke() {
    var t = tid(); if (t.start == null) return;
    t.brukt += Date.now() - t.start; t.start = null; lagreTid(t);
    if (tikk) { clearInterval(tikk); tikk = null; }
    tegnKlokke();
  }
  function nullstillKlokke() {
    var ok = true;
    try { ok = window.confirm("Nullstille tidtakeren?"); } catch (e) {}
    if (!ok) return;
    if (tikk) { clearInterval(tikk); tikk = null; }
    lagreTid({ start: null, brukt: 0 }); tegnKlokke();
  }
  function kjørTikk() { if (!tikk) tikk = setInterval(tegnKlokke, 1000); }

  function lagKlokke(host) {
    var box = el("div", { class: "mock-klokke card" }, [
      el("div", { class: "mock-klokke-tid" }, [el("span", { class: "mock-klokke-lbl small muted", text: "Tid igjen" }), el("span", { class: "mock-klokke-v mono", "data-mock-tid": "", text: "4:00:00" })]),
      el("div", { class: "mock-klokke-knapper" }, [
        el("button", { class: "btn primary", type: "button", id: "mock-start", text: "▶ Start prøven", onclick: startKlokke }),
        el("button", { class: "btn", type: "button", id: "mock-pause", text: "❚❚ Pause", onclick: stoppKlokke }),
        el("button", { class: "btn", type: "button", text: "↺ Nullstill tiden", onclick: nullstillKlokke })
      ]),
      el("p", { class: "small muted mock-naa", id: "mock-naa", "aria-live": "polite" })
    ]);
    host.appendChild(box);
  }

  /* ---------------- Poeng ---------------- */
  function autoPoeng(o) {
    var a = auto[o.key]; if (!a || !a.h) return null;
    var c = a.h.counts(), r = o.auto.regel;
    var p = c.right * r.riktig + c.wrong * r.feil + c.blank * (r.blankt || 0);
    return { poeng: Math.max(r.min != null ? r.min : -Infinity, p), c: c, sjekket: a.sjekket() };
  }
  function egnePoeng(o) {
    var v = parseFloat(String(store("poeng:" + o.key) || "").replace(",", "."));
    return isFinite(v) ? Math.max(0, Math.min(o.points, v)) : null;
  }
  function poengFelt(o, idSuffix) {
    var id = "mock-p-" + o.key.replace(/\W/g, "") + "-" + idSuffix;
    var inp = el("input", { type: "number", id: id, class: "mock-poeng-inp", min: "0", max: String(o.points), step: "0.5", inputmode: "decimal" });
    var v = egnePoeng(o); if (v != null) inp.value = String(v);
    inp.addEventListener("change", function () {
      var x = parseFloat(String(inp.value).replace(",", "."));
      if (inp.value === "" || !isFinite(x)) { store("poeng:" + o.key, ""); inp.value = ""; }
      else { x = Math.max(0, Math.min(o.points, Math.round(x * 2) / 2)); inp.value = String(x); store("poeng:" + o.key, String(x)); }
      send("in:mock-poeng");
    });
    document.addEventListener("in:mock-poeng", function () {
      if (document.activeElement === inp) return;
      var y = egnePoeng(o); inp.value = y == null ? "" : String(y);
    });
    return el("span", { class: "mock-poeng" }, [
      el("label", { for: id, class: "small", text: "Dine poeng" }), inp, el("span", { class: "small muted", text: "av " + o.points })]);
  }

  /* ---------------- Oppgavekortene ---------------- */
  function sjekketNaa(host) { return !!host.querySelector(".qz-item.is-right, .qz-item.is-wrong, .qz-item.is-blank"); }

  function autoDel(o, host) {
    var r = o.auto.regel, holder = el("div", { class: "mock-auto" });
    host.appendChild(holder);
    function resultat(c) {
      var p = c.right * r.riktig + c.wrong * r.feil, sum = Math.max(r.min || 0, p);
      send("in:mock-poeng");
      return "<p class=\"mock-res\"><b>" + fmtP(sum) + " av " + o.points + " poeng</b> etter eksamensregelen: " +
        c.right + " × " + fmtP(r.riktig) + (c.wrong ? " − " + c.wrong + " × " + fmtP(-r.feil) : "") +
        (c.blank ? " (" + c.blank + " blank" + (c.blank === 1 ? "" : "e") + " gir 0)" : "") +
        (p < 0 ? ", men aldri under 0" : "") + ".</p>";
    }
    var note = "Riktig " + fmtP(r.riktig) + " · galt −" + fmtP(-r.feil) + " · blankt 0";
    var h;
    if (o.auto.type === "janei") {
      h = IN.tfTest(holder, o.auto.items.map(function (it) { return { s: it.s, answer: it.answer, explain: it.explain, kilde: false }; }),
        { id: "mock-" + o.nr, instant: false, lock: true, labels: ["JA", "NEI"], keepOrder: true, note: note, checkLabel: "Rett denne oppgaven", result: resultat, report: function () {} });
    } else {
      h = IN.quiz(holder, o.auto.items.map(function (it) {
        return { q: it.q, options: it.options, answer: it.answer, explain: it.explain,
          render: it.sql ? function (n) { IN.sqlBlock(n, it.sql); } : null };
      }), { id: "mock-" + o.nr, instant: false, lock: true, inline: true, note: note, checkLabel: "Rett denne oppgaven", result: resultat, report: function () {} });
    }
    auto[o.key] = { h: h, sjekket: function () { return sjekketNaa(holder); } };
    // Var oppgaven rettet før siden ble lastet på nytt, vises poengsummen igjen
    if (h && sjekketNaa(holder)) {
      var res = holder.querySelector(".qz-result"); if (res) res.innerHTML = resultat(h.counts());
    }
  }

  function friTekst(o, host) {
    var id = "mock-svar-" + o.key.replace(/\W/g, "");
    var ta = el("textarea", { id: id, class: "mock-svar", rows: "6", spellcheck: "false", placeholder: "Skriv her …" });
    ta.value = store("svar:" + o.key) || "";
    var t = null;
    ta.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { store("svar:" + o.key, ta.value); }, 300); });
    host.appendChild(el("div", { class: "mock-fri" }, [el("label", { for: id, class: "small", text: o.fritekst }), ta]));
  }

  function kjørFasit(sql) {
    if (!dbs || !IN.sqlMotor) return null;
    var r = IN.sqlMotor.run(sql, dbs.eksempel);
    return r && !r.feil ? { navn: "Resultat på eksempeldataene", kolonner: r.kolonner, rader: r.rader } : null;
  }
  function klarPerfekt(o) {
    var pf = {}, k;
    for (k in o.perfekt) if (Object.prototype.hasOwnProperty.call(o.perfekt, k)) pf[k] = o.perfekt[k];
    pf.svar = (o.perfekt.svar || []).map(function (sv) {
      var s = {}, j;
      for (j in sv) if (Object.prototype.hasOwnProperty.call(sv, j) && j !== "sqlFasit" && j !== "sqlTabell") s[j] = sv[j];
      if (sv.sqlFasit && o.sql) { s.sql = o.sql.fasit; s.tabell = kjørFasit(o.sql.fasit); }
      if (sv.sqlTabell && o.sql) s.tabell = kjørFasit(o.sql.fasit);
      if (!s.tabell) delete s.tabell;
      return s;
    });
    return pf;
  }

  function lagOppgave(o, host) {
    var node = el("div", { class: "mock-opg" });
    node.appendChild(el("div", { class: "mock-tekst", html: o.oppgave }));
    if (o.figur && o.figur.er) {
      var fig = el("figure", { class: "exam-fig mock-fig" }), fh = el("div", { class: "exam-fig-h" });
      fig.appendChild(fh);
      if (o.figur.cap || o.figur.er.merknad) fig.appendChild(el("figcaption", { html: (o.figur.cap ? o.figur.cap + " " : "") + (o.figur.er.merknad || "") }));
      node.appendChild(fig);
      try { IN.vizEr(fh, o.figur.er, { fit: true, title: "ER-diagram til oppgave " + o.nr }); } catch (e) { if (window.console) console.error(e); }
    }
    var svar = el("div", { class: "mock-svarfelt" });
    node.appendChild(svar);
    if (o.auto) autoDel(o, svar);
    if (o.sql && dbs) {
      var spec = { id: "mock-" + o.nr, tittel: "Ditt svar på " + o.nr, tekst: o.sql.utenView
          ? "<p class=\"small muted\">Skriv SELECT-delen av viewet her for å kjøre og sjekke den. På eksamen skriver du hele <span class=\"mono\">CREATE VIEW</span>-setningen.</p>"
          : "<p class=\"small muted\">Kjør og Sjekk finnes ikke på eksamen, men her kan du prøve spørringen mot eksempeldataene og en testdatabase.</p>",
        fasit: o.sql.fasit, godta: o.sql.godta, hint: o.sql.hint, tester: o.sql.tester, krav: o.sql.krav };
      var kort = IN.sqlTask(svar, spec, { dbs: dbs });
      if (kort) IN.qsa(".sqlo-knapper button", kort).forEach(function (b) {
        if (/fasit/i.test(b.textContent)) b.classList.add("mock-fasitknapp");
        if (/^Hint$/.test(b.textContent)) b.classList.add("mock-hintknapp");
      });
    }
    if (o.fritekst) friTekst(o, svar);
    if (!o.auto) svar.appendChild(el("div", { class: "mock-selv" }, [poengFelt(o, "kort"),
      el("span", { class: "small muted mock-selv-tekst", text: "Sammenlign med «Løsning» og poenglista der, og sett poengene selv." })]));

    var card = IN.examTask(host, {
      id: "opg-" + o.nr.replace(".", "-"), key: o.key, year: "Mock", oppgave_nr: "Oppgave " + o.nr, title: o.title, points: o.points,
      oppgave: node, perfekt: klarPerfekt(o), tips: o.tips,
      kilde: "Øvingsoppgave laget for guiden (ikke fra en eksamen)"
    });
    if (card) kortListe.push(card);
  }

  function lagDel(nr, host) {
    var del = D.deler[nr - 1];
    host.appendChild(el("p", { class: "mock-delhode" }, [
      el("b", { text: "Del " + del.nr + " · " + del.poeng + " poeng" }),
      el("span", { class: "muted", text: " · forslag: " + del.minutter + " minutter. " + del.tekst })]));
    D.oppgaver.filter(function (o) { return o.del === nr; }).forEach(function (o) { lagOppgave(o, host); });
    host.appendChild(el("div", { class: "mock-videre" }, nr < 3
      ? [el("a", { class: "btn", href: "#fane=del" + (nr + 1), text: "Videre til del " + (nr + 1) + " →" })]
      : [el("a", { class: "btn", href: "#fane=resultat", text: "Til innlevering og resultat →" })]));
  }

  /* ---------------- Resultat ---------------- */
  function tegnResultat() {
    var host = qs("#mock-resultat"); if (!host) return;
    IN.clear(host);
    var tbl = el("table", { class: "cmp-table mock-tabell" }), tb = el("tbody");
    tbl.appendChild(el("thead", null, el("tr", null, [
      el("th", { scope: "col", text: "Oppgave" }), el("th", { scope: "col", text: "Maks" }),
      el("th", { scope: "col", text: "Poeng" }), el("th", { scope: "col", text: "Hvordan" })])));
    var tot = 0, totMaks = 0, mangler = 0;
    D.deler.forEach(function (del) {
      var sum = 0, maks = 0;
      tb.appendChild(el("tr", { class: "mock-delrad" }, el("th", { colspan: "4", scope: "colgroup", text: "Del " + del.nr + " · " + del.navn })));
      D.oppgaver.filter(function (o) { return o.del === del.nr; }).forEach(function (o) {
        maks += o.points;
        var celle = el("td", { class: "mock-p-celle" }), hvordan = el("td", { class: "small" });
        if (o.auto) {
          var a = autoPoeng(o);
          if (a && a.sjekket) { sum += a.poeng; celle.appendChild(el("b", { text: fmtP(a.poeng) })); hvordan.textContent = "Rettet automatisk: " + a.c.right + " riktig, " + a.c.wrong + " galt, " + a.c.blank + " blankt."; }
          else { mangler++; celle.appendChild(el("span", { class: "muted", text: "–" })); hvordan.textContent = (a ? a.c.answered : 0) + " av " + o.auto.items.length + " besvart. Rettes når du leverer" + (modus() === "ovelse" ? " (eller med «Rett denne oppgaven»)." : "."); }
        } else {
          celle.appendChild(poengFelt(o, "res"));
          var v = egnePoeng(o);
          if (v != null) sum += v; else mangler++;
          var t = "Selvvurdering mot «Løsning».";
          if (o.sql && IN.progress && IN.progress.get) {
            var pr = IN.progress.get("sql:" + IN.pageId() + ":mock-" + o.nr);
            if (pr && pr.max && pr.best >= pr.max) t += " Spørringen ga riktig resultat i selvrettingen.";
          }
          hvordan.textContent = t;
        }
        tb.appendChild(el("tr", null, [el("td", null, el("a", { href: "#fane=del" + o.del, text: o.nr + " " + o.title })), el("td", { text: String(o.points) }), celle, hvordan]));
      });
      tot += sum; totMaks += maks;
      tb.appendChild(el("tr", { class: "mock-sumrad" }, [el("td", { text: "Sum del " + del.nr }), el("td", { text: String(maks) }), el("td", null, el("b", { text: fmtP(sum) })), el("td")]));
    });
    tbl.appendChild(tb);
    tbl.appendChild(el("tfoot", null, el("tr", { class: "mock-totrad" }, [el("th", { scope: "row", text: "Totalt" }), el("td", { text: String(totMaks) }), el("td", null, el("b", { text: fmtP(tot) })), el("td", { class: "small", text: mangler ? mangler + " oppgave" + (mangler === 1 ? "" : "r") + " mangler poeng." : "Alle oppgavene har poeng." })])));
    host.appendChild(el("div", { class: "table-wrap" }, tbl));
    var t = tid(), b = brukt(t);
    host.appendChild(el("p", { class: "small muted", text: (b > 0 ? "Brukt tid: " + hms(b) + " av " + D.minutter / 60 + " timer." : "Tidtakeren er ikke startet.") +
      (mangler ? " " + mangler + " oppgave" + (mangler === 1 ? "" : "r") + " mangler poeng." : "") }));
  }

  /* ---------------- Montering ---------------- */
  function init() {
    el = IN.el; qs = IN.qs; D = IN.dataMock;
    if (!D) return;
    try { if (IN.sqlTask && IN.sqlTask.lagDbs && IN.sqlMotor) dbs = IN.sqlTask.lagDbs(D.db, 11); } catch (e) { if (window.console) console.error("[mock] lagDbs", e); }
    var feil = function (navn, fn) { try { fn(); } catch (e) { if (window.console) console.error("[mock] " + navn, e); } };

    feil("klokke", function () { var h = qs("#mock-klokke"); if (h) lagKlokke(h); });
    feil("skjema", function () { var h = qs("#mock-skjema"); if (h) IN.schema(h, D.skjema, { open: false, pin: true }); });
    [1, 2, 3].forEach(function (n) { feil("del" + n, function () { var h = qs("#mock-del" + n); if (h) lagDel(n, h); }); });

    IN.qsa("[data-mock-modus]").forEach(function (b) {
      b.addEventListener("click", function () { if (levert()) return; store("modus", b.getAttribute("data-mock-modus")); oppdaterModus(); tegnResultat(); });
    });
    IN.qsa("[data-mock-lever]").forEach(function (b) { b.addEventListener("click", lever); });
    IN.qsa("[data-mock-nytt]").forEach(function (b) { b.addEventListener("click", startPaaNytt); });

    document.addEventListener("in:mock-poeng", function () { var r = qs("#mock-resultat"); if (r && !r.contains(document.activeElement)) tegnResultat(); });
    document.addEventListener("in:shown", function (e) { if (e.target && e.target.getAttribute && e.target.getAttribute("data-panel") === "resultat") tegnResultat(); });
    // «Videre til del …»: fanen byttes av core.js (hashchange); rull opp til fanelinja
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest(".mock-videre a, a.mock-tilfane");
      if (!a) return;
      setTimeout(function () {
        var bar = qs(".tabs"); if (!bar) return;
        var top = bar.getBoundingClientRect().top + window.pageYOffset - (IN.stickyH ? IN.stickyH() : 0) - 8;
        window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
      }, 30);
    });

    oppdaterModus();
    tegnResultat();
    tegnKlokke();
    if (tid().start != null) kjørTikk();
  }

  IN.mockSide = { init: init, tegnResultat: tegnResultat };
})();
