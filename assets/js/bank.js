/* ============================================================
   IN2090 guide · bank.js
   Eksamensbanken på blokksidene og øving på de automatisk rettede oppgavene.

   IN.examBank(host, { block: "sql-videre" | ["er","eer"], years?: ["H2024", …], tema?: "GROUP BY",
                       skjema?: true (vis årets skjema over oppgavene, standard true når noen oppgave er SQL) })
     Henter oppgavene fra window.IN_EXAM_BANK (filene i assets/js/eksamensbank/), nyeste år først,
     med årsfilter, årets databaseskjema (kan festes) og ER-figurer fra arket.
   IN.del1(host, del1, { id }) → radantall / JA-NEI / flervalg med eksamensregelen
     (riktig +2, galt −0,5, blankt 0, minst 0 eller det arket sier).
   Format: plan/format.md. Klassisk script, lastes etter core.js (og sql-lang.js, viz-relation.js, viz-er.js).
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var el = IN.el, clear = IN.clear;

  function num(x) { return String(Math.round(x * 100) / 100).replace(".", ","); }
  function sgn(x) { return (x > 0 ? "+" : x < 0 ? "−" : "") + num(Math.abs(x)); }
  // Høst etter vår; en prøveeksamen (P2019) står like før ordinær høsteksamen samme år
  function yearKey(y) { var m = /^([HVP])(\d{4})$/.exec(y || ""); return m ? +m[2] * 2 + (m[1] === "H" ? 1 : m[1] === "P" ? 0.5 : 0) : 0; }
  function yearLabel(y) { var m = /^P(\d{4})$/.exec(y || ""); return m ? "Prøve " + m[1] : y; }
  function taskNr(o) { var k = String(o.key || ""), i = k.indexOf("-"); return i >= 0 ? k.slice(i + 1) : null; }

  /* ---------- Del 1: automatisk rettede oppgaver ---------- */
  IN.del1 = function (host, d, opts) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host || !d || !d.items || !d.items.length) return null;
    opts = opts || {};
    var r = d.regel || { riktig: 1, feil: 0, blankt: 0, min: 0 };
    var rr = r.riktig != null ? r.riktig : 1, rf = r.feil || 0, rb = r.blankt || 0;
    // Regel per punkt (it.regel) overstyrer fellesregelen. avkrysning: bare kryss (JA) teller, tomme bokser gir 0.
    var kryss = !!d.avkrysning && d.type === "janei";
    function ruleOf(it) {
      var x = (it && it.regel) || {};
      return { riktig: x.riktig != null ? x.riktig : rr, feil: x.feil != null ? x.feil : rf, blankt: x.blankt != null ? x.blankt : rb };
    }
    var varies = d.items.some(function (it) { var q = ruleOf(it); return q.riktig !== rr || q.feil !== rf; });
    var maxP = d.items.reduce(function (s, it) { return s + (kryss && !it.answer ? 0 : ruleOf(it).riktig); }, 0);
    var wrap = el("div", { class: "del1" });
    var regel = kryss
      ? (varies ? "Eksamensregelen: poeng per riktig kryss varierer mellom delene (se teksten over), galt kryss " + (rf ? sgn(rf) : "0") + ", tom boks 0"
                : "Eksamensregelen: riktig kryss " + sgn(rr) + ", galt kryss " + (rf ? sgn(rf) : "0") + ", tom boks 0")
      : (varies ? "Eksamensregelen: poengene varierer mellom punktene (se teksten over)"
                : "Eksamensregelen: riktig " + sgn(rr) + ", galt " + (rf ? sgn(rf) : "0") + ", blankt " + (rb ? sgn(rb) : "0"));
    regel += (r.min != null ? ", aldri under " + num(r.min) + " poeng totalt" : "") + ". Maks " + num(maxP) + " poeng.";
    var gjett = !varies && rf < 0 ? " Står du i tvil, regn på om det lønner seg å " + (kryss ? "krysse" : "gjette") + ": med " + sgn(rf) + " for galt lønner det seg når du er mer enn " + Math.round(100 * (-rf) / (rr - rf)) + " % sikker." : "";
    wrap.appendChild(el("p", { class: "del1-regel small", html: "<b>" + regel + "</b>" + (kryss ? " Velg «Kryss av» for boksene du ville krysset av på eksamen." : "") + gjett }));
    var box = el("div"); wrap.appendChild(box);
    host.appendChild(wrap);
    function sqlRender(it) { return it.sql ? function (node) { IN.sqlBlock(node, it.sql); } : null; }
    function result(c) {
      var p = 0, nR = 0, nW = 0, nB = 0, pR = 0, pW = 0;
      (c.detail || []).forEach(function (x) {
        var it = d.items[x.id], q = ruleOf(it);
        if (kryss) {
          if (x.value === true) { if (x.right) { nR++; pR += q.riktig; } else { nW++; pW += q.feil; } }
          else nB++;
        } else if (!x.answered) { nB++; p += q.blankt; }
        else if (x.right) { nR++; pR += q.riktig; } else { nW++; pW += q.feil; }
      });
      p += pR + pW;
      if (r.min != null) p = Math.max(r.min, p);
      var w = kryss ? [nR === 1 ? "riktig kryss" : "riktige kryss", nW === 1 ? "galt kryss" : "gale kryss", "uten kryss"] : ["riktig", "galt", "blankt"];
      return '<p class="del1-sum"><b>Med eksamensregelen: ' + num(p) + " av " + num(maxP) + " poeng.</b> " +
        nR + " " + w[0] + " (" + (nR ? sgn(pR) : "0") + "), " + nW + " " + w[1] + " (" + (nW && pW ? sgn(pW) : "0") + "), " +
        nB + " " + w[2] + ".</p>";
    }
    var common = { id: opts.id || null, result: result, checkLabel: "Rett som på eksamen", keepOrder: true };
    var ret;
    if (d.type === "janei") {
      var tf = {}; for (var k in common) tf[k] = common[k];
      tf.labels = kryss ? ["Kryss av", "Ikke kryss"] : ["JA", "NEI"];
      ret = IN.tfTest(box, d.items.map(function (it) {
        return { s: it.s || it.q, answer: !!it.answer, explain: it.explain || "", kilde: false, render: sqlRender(it) };
      }), tf);
    } else {
      ret = IN.quiz(box, d.items.map(function (it) {
        return { q: it.q || it.s || "", options: it.options, answer: it.answer, godta: it.godta, explain: it.explain || "", render: sqlRender(it) };
      }), common);
    }
    // Sensorveiledningen for del 1-oppgaven (ordrett), når den finnes: d.sensor = { fasit, kriterier, merknad }
    if (d.sensor) {
      var sd = el("details", { class: "et-pf-sensor del1-sensor" });
      sd.appendChild(el("summary", { text: "Sensorveiledningen sier (ordrett)" }));
      if (opts.kilde) sd.appendChild(el("p", { class: "et-pf-src", text: opts.kilde }));
      var bq = el("blockquote", { class: "sensor" });
      [d.sensor.fasit, d.sensor.kriterier].forEach(function (v) {
        if (v == null || v === "") return;
        var x = el("div", { class: "et-sv-fasit" });
        x.innerHTML = Array.isArray(v) ? "<ul>" + v.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul>" : String(v);
        bq.appendChild(x);
      });
      IN.richParts(bq, d.sensor);
      sd.appendChild(bq);
      if (d.sensor.merknad) sd.appendChild(el("p", { class: "et-pf-merknad", html: "<b>Merk:</b> " + d.sensor.merknad }));
      wrap.appendChild(sd);
    }
    return ret;
  };

  /* ---------- Eksamensbanken for én blokk ---------- */
  function collect(opts) {
    var bank = window.IN_EXAM_BANK || {}, blocks = [].concat(opts.block || []), out = [];
    Object.keys(bank).forEach(function (y) {
      var ex = bank[y];
      (ex.oppgaver || []).forEach(function (o) {
        if (blocks.length && blocks.indexOf(o.block) < 0) return;
        if (opts.years && opts.years.indexOf(ex.year || y) < 0) return;
        if (opts.tema && !(o.tema || []).some(function (t) { return t.toLowerCase() === opts.tema.toLowerCase(); })) return;
        out.push({ ex: ex, y: ex.year || y, o: o });
      });
    });
    return out.sort(function (a, b) { return yearKey(b.y) - yearKey(a.y); });
  }

  function oppgaveNode(x) {
    var o = x.o, wrap = el("div", { class: "bank-oppg" });
    if (o.oppgave) { var t = el("div"); t.innerHTML = o.oppgave; wrap.appendChild(t); }
    var nr = taskNr(o), fig = x.ex.er && nr && x.ex.er[nr];
    if (fig) {
      var f = el("figure", { class: "exam-fig et-er" }), h = el("div", { class: "exam-fig-h" });
      f.appendChild(h);
      f.appendChild(el("figcaption", { class: "small muted", text: "ER-diagrammet fra eksamensarket, tegnet på nytt." }));
      wrap.appendChild(f);
      if (typeof IN.vizEr === "function") { try { IN.vizEr(h, fig); } catch (e) { if (window.console) console.error(e); } }
    }
    if (o.del1) {
      var d = el("div", { class: "bank-del1" });
      wrap.appendChild(d);
      var nr2 = taskNr(o);
      IN.del1(d, o.del1, { id: "del1-" + o.key, kilde: x.ex.prove ? "Kilde: prøveeksamen IN2090 " + x.y.slice(1) + (nr2 ? ", oppgave " + nr2 : "") + " (fasit regnet ut av oss)"
        : "Kilde: sensorveiledning IN2090 " + x.y + (nr2 ? ", oppgave " + nr2 : "") });
    }
    return wrap;
  }

  IN.examBank = function (host, opts) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return null;
    opts = opts || {};
    var all = collect(opts);
    clear(host);
    if (!all.length) {
      host.appendChild(el("p", { class: "muted", text: "Ingen eksamensoppgaver i banken for denne blokken ennå." }));
      return null;
    }
    var years = [];
    all.forEach(function (x) { if (years.indexOf(x.y) < 0) years.push(x.y); });
    var pts = all.reduce(function (s, x) { return s + (+x.o.points || 0); }, 0);
    host.appendChild(el("p", { class: "bank-sum small", html: "<b>" + all.length + " oppgaver</b> fra " + years.length +
      (years.length === 1 ? " eksamen" : " eksamener") + " (" + years.map(yearLabel).join(", ") + "), til sammen " + num(pts) + " poeng." }));

    var bar = el("div", { class: "bank-years", role: "group", "aria-label": "Vis år" });
    var list = el("div", { class: "bank-list" });
    host.appendChild(bar); host.appendChild(list);
    var built = {};
    function paint(sel) {
      IN.qsa("button", bar).forEach(function (b) { b.setAttribute("aria-pressed", b._y === sel ? "true" : "false"); });
      IN.qsa(".bank-year", list).forEach(function (s) { s.hidden = sel !== "*" && s._y !== sel; });
    }
    [["*", "Alle år"]].concat(years.map(function (y) { return [y, yearLabel(y)]; })).forEach(function (p) {
      var b = el("button", { class: "btn sm", type: "button", text: p[1], onclick: function () { paint(p[0]); } });
      b._y = p[0]; bar.appendChild(b);
    });

    years.forEach(function (y) {
      var items = all.filter(function (x) { return x.y === y; }), ex = items[0].ex;
      var sec = el("section", { class: "bank-year" }); sec._y = y;
      var meta = [ex.dato, ex.varighet].filter(Boolean).join(" · ");
      sec.appendChild(el("h3", { class: "bank-yh", html: (ex.prove ? (ex.navn || yearLabel(y)) : y) + (meta ? ' <span class="muted small">' + meta + "</span>" : "") }));
      var wantSchema = opts.skjema != null ? opts.skjema : items.some(function (x) { return /^sql|relasjonsalgebra/.test(x.o.block || ""); });
      if (wantSchema && ex.skjema && IN.schema) IN.schema(sec, ex.skjema, { open: false, year: y });
      var cards = el("div", { class: "bank-cards" });
      sec.appendChild(cards);
      items.forEach(function (x) {
        var o = x.o, data = {};
        for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) data[k] = o[k];
        data.id = "o-" + String(o.key).replace(/[^A-Za-z0-9_-]/g, "_");
        data.oppgave = oppgaveNode(x);
        IN.examTask(cards, data);
      });
      list.appendChild(sec);
      built[y] = true;
    });
    paint("*");

    // Dyplenke: #o-H2024-2_3 åpner kortet
    var h = (location.hash || "").slice(1), card = h && document.getElementById(h);
    if (card && card.tagName === "DETAILS" && host.contains(card)) { card.open = true; setTimeout(function () { card.scrollIntoView({ block: "start" }); }, 0); }
    return { count: all.length, years: years };
  };

  /* Alle del 1-oppgaver på tvers av år (til en egen øvingsside senere). */
  IN.examBank.del1Items = function (filter) {
    return collect(filter || {}).filter(function (x) { return x.o.del1; });
  };
})();
