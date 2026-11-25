/* ============================================================
   IN2090 guide · side-crash.js
   Logikken på crash.html: lengdevalg (Ekspress/Standard/Grundig), fast fremdriftslinje,
   repetisjonskø, etapper og steg (kjerne, oppskrift, eksempel, eksamenskort, sjekk, feller),
   generalprøve med tidtaker, overføringskode og nullstilling.
   Data og fremdriftsregler: data-crash.js (IN.CRASH, IN.crashProgress).
   Eksamenskortene bygges direkte fra eksamensbanken (window.IN_EXAM_BANK), med samme
   oppgavetekst, ER-figur, del 1 og skjema som på emnesidene. Lenkene til emnesidene har
   &fra=crash&steg=…, så core.js viser «← Tilbake til løypa» der.
   ============================================================ */
(function () {
  "use strict";
  var IN = window.IN, C = IN && IN.CRASH;
  if (!C || !IN.crashProgress) return;
  var el = IN.el, qs = IN.qs, qsa = IN.qsa, clear = IN.clear;
  var P = IN.progress;
  var CP = IN.crashProgress;
  var LEN = Object.create(null); C.lengder.forEach(function (L) { LEN[L.id] = L; });
  var HREF = {}, READY = {};
  IN.PAGES.forEach(function (p) { HREF[p.id] = p.href; READY[p.id] = !!p.ready; });
  var STEPS = CP.steps, BYID = CP.byId;
  var state = CP.state, inLen = CP.inLen, stepsIn = CP.stepsIn, minutes = CP.minutes;
  var checkKey = CP.checkKey, kortState = CP.kortState;
  function setState(patch) { if (P) P.set("crash:state", patch); }
  function fmtTid(m) {
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return h + " t" + (r ? " " + r + " min" : "");
  }

  /* ---------- Lenker ---------- */
  function link(page, fane, oppg, stepId) {
    var h = [];
    if (fane) h.push("fane=" + fane);
    if (oppg) h.push("oppg=" + oppg);
    h.push("fra=crash"); h.push("steg=" + stepId);
    return (HREF[page] || (/\.html$/.test(page) ? page : page + ".html")) + "#" + h.join("&");
  }
  /* Kortet på emnesiden (bare når siden er klar) */
  function kortPageHref(k, stepId) {
    var c = C.kort[k];
    return c && READY[c[0]] ? link(c[0], "eksamen", "o-" + k, stepId) : null;
  }
  function kortTittel(k) { var c = C.kort[k]; return c ? c[3] + " " + c[4] + " · " + c[2] : k; }
  /* Kort → stegene der det står (oppgaver eller ekstra) */
  var KORT_STEG = {};
  STEPS.forEach(function (s) {
    (s.oppgaver || []).concat(s.ekstra || []).forEach(function (k) {
      var l = KORT_STEG[k] = KORT_STEG[k] || [];
      if (l.indexOf(s.id) < 0) l.push(s.id);
    });
  });

  /* ---------- Eksamenskortene fra banken ---------- */
  function bankEntry(k) {
    var c = C.kort[k], bank = window.IN_EXAM_BANK || {};
    if (!c) return null;
    var ex = bank[c[3]];
    if (!ex) return null;
    var o = null;
    (ex.oppgaver || []).forEach(function (x) { if (x.key === c[5]) o = x; });
    return o ? { ex: ex, o: o, y: c[3] } : null;
  }
  function oppgaveNode(x) {
    var o = x.o, wrap = el("div", { class: "bank-oppg" });
    if (/^sql|relasjonsalgebra/.test(o.block || "") && x.ex.skjema && IN.schema) {
      try { IN.schema(wrap, x.ex.skjema, { open: false, year: x.y }); } catch (e) { if (window.console) console.error(e); }
    }
    if (o.oppgave) { var t = el("div"); t.innerHTML = o.oppgave; wrap.appendChild(t); }
    var nr = String(o.key).slice(String(o.key).indexOf("-") + 1);
    var fig = x.ex.er && x.ex.er[nr];
    if (fig) {
      var f = el("figure", { class: "exam-fig et-er" }), h = el("div", { class: "exam-fig-h" });
      f.appendChild(h);
      f.appendChild(el("figcaption", { class: "small muted", text: "ER-diagrammet fra eksamensarket, tegnet på nytt." }));
      wrap.appendChild(f);
      if (typeof IN.vizEr === "function") { try { IN.vizEr(h, fig); } catch (e2) { if (window.console) console.error(e2); } }
    }
    if (o.del1 && IN.del1) {
      var d = el("div", { class: "bank-del1" });
      wrap.appendChild(d);
      try { IN.del1(d, o.del1, { id: "del1-" + o.key, kilde: "Kilde: sensorveiledning IN2090 " + x.y + ", oppgave " + nr }); }
      catch (e3) { if (window.console) console.error(e3); }
    }
    return wrap;
  }
  function kortLink(k, s) {
    var c = C.kort[k], href = kortPageHref(k, s.id);
    return el(href ? "a" : "span", href ? { href: href, class: "cr-kort" } : { class: "cr-kort" }, [
      el("span", { class: "et-year", text: c[3] }),
      el("span", { class: "cr-ktit", text: c[2] }),
      el("span", { class: "cr-pts", text: c[1] + " p" })
    ]);
  }
  /* Ett kort i «Din tur»: selve eksamenskortet, flatt, med egenvurdering (kort:crash:o-<id>) */
  function kortItem(k, s) {
    var c = C.kort[k]; if (!c) return null;
    var li = el("li", { class: "cr-kli", "data-kid": k });
    var x = bankEntry(k), card = null;
    if (x) {
      var data = {};
      for (var p in x.o) if (Object.prototype.hasOwnProperty.call(x.o, p)) data[p] = x.o[p];
      data.id = "o-" + k;
      try {
        data.oppgave = oppgaveNode(x);
        card = IN.examTask(li, data, { variant: "flat" });
        card = card && card.nodeType === 1 ? card : qs("details.examtask", li);
      } catch (e) { if (window.console) console.error(e); clear(li); card = null; }
    }
    if (card) {
      li.classList.add("is-inline");
      card.addEventListener("toggle", function () {
        if (!card.open) return;
        var body = li.closest(".cr-sbody");
        if (body) qsa("details.examtask[open]", body).forEach(function (o) { if (o !== card) o.open = false; });
      });
      var href = kortPageHref(k, s.id);
      var row = el("p", { class: "cr-kles small" }, [el("span", { class: "cr-kstat small", "data-kort": k }), " "]);
      if (href) row.appendChild(el("a", { href: href, text: "Samme oppgave på emnesiden →" }));
      li.appendChild(row);
    } else {
      li.appendChild(kortLink(k, s));
      li.appendChild(el("span", { class: "cr-kstat small", "data-kort": k }));
    }
    return li;
  }

  /* ---------- Toppen: lengde, totaler, fortsett ---------- */
  function buildLenPicker() {
    var host = qs("#cr-len"); clear(host);
    C.lengder.forEach(function (L) {
      var mins = stepsIn(L.id).reduce(function (a, s) { return a + minutes(s, L.id); }, 0);
      var b = el("button", { class: "seg-btn cr-len-btn", type: "button", role: "radio", "data-len": L.id,
        html: "<b>" + L.navn + "</b><span>≈ " + fmtTid(mins) + "</span>" });
      b.addEventListener("click", function () { setLength(L.id, "top"); });
      host.appendChild(b);
    });
    host.addEventListener("keydown", function (ev) {
      var dir = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      ev.preventDefault();
      var ids = C.lengder.map(function (L) { return L.id; });
      var ni = (ids.indexOf(state().lengde) + dir + ids.length) % ids.length;
      setLength(ids[ni], "top");
      qsa(".cr-len-btn", host)[ni].focus();
    });
    qsa("[data-cr-timer]").forEach(function (sp) {
      var L = sp.getAttribute("data-cr-timer");
      if (!LEN[L]) return;
      var mins = stepsIn(L).reduce(function (a, s) { return a + minutes(s, L); }, 0);
      sp.textContent = String(Math.max(1, Math.round(mins / 60)));
    });
  }

  var noteTimer = null;
  function setLength(L, src) {
    if (!LEN[L]) return;
    var changed = state().lengde !== L;
    var open = qsa("details.cr-step[open]").filter(function (d) { return !d.hidden; }), anchor = null, top0 = 0, kept = [];
    open.forEach(function (d) {
      var id = d.getAttribute("data-step"), r = d.getBoundingClientRect();
      if (changed && !inLen(BYID[id], L)) { forced[id] = true; kept.push(id); }
      if (!anchor && r.bottom > stickyOff() && r.top < window.innerHeight) { anchor = d; top0 = r.top; }
    });
    var foc = document.activeElement;
    if (changed) setState({ lengde: L });
    render();
    if (anchor) { var dy = anchor.getBoundingClientRect().top - top0; if (Math.abs(dy) > 1) window.scrollTo({ top: window.pageYOffset + dy, behavior: "instant" }); }
    if (foc && foc !== document.activeElement && document.contains(foc)) try { foc.focus({ preventScroll: true }); } catch (e) {}
    if (!changed) return;
    var pr = CP(L), txt;
    if (!pr.startet) txt = LEN[L].navn + ": " + pr.antallSteg + " steg, ca. " + fmtTid(pr.minutter) + ".";
    else txt = "Byttet til " + LEN[L].navn + ": " + pr.antallSteg + " steg, du har fullført " + pr.ferdigeSteg + " av dem." +
      (pr.ferdigeUtenfor ? " " + pr.ferdigeUtenfor + " fullførte steg utenfor " + LEN[L].navn + " er lagret." : "");
    if (kept.length) txt += " Steg " + kept.join(", ") + " er ikke med i " + LEN[L].navn + ", men står åpent til du lukker det.";
    var top = qs("#cr-len-note"), sn = qs("#cr-stick-note");
    top.textContent = txt;
    sn.textContent = src === "stick" ? txt : "";
    sn.classList.toggle("on", src === "stick");
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { top.textContent = ""; sn.textContent = ""; sn.classList.remove("on"); }, 7000);
  }

  function goAction(pr) {
    var f = pr.fortsett;
    if (f) return { kind: "steg", id: f.id, long: pr.startet ? "Fortsett: steg " + f.id + " · " + f.tittel + " →" : "Start løypa →",
      short: pr.startet ? "Fortsett →" : "Start →" };
    if (pr.ko.length) return { kind: "ko", long: "Ta repetisjonskøen →", short: "Repeter →" };
    return null;
  }
  function runAction(btn) {
    var k = btn.dataset.kind;
    if (k === "steg" && btn.dataset.go) openStep(btn.dataset.go, true);
    else if (k === "ko") scrollToEl(qs("#cr-queue"), qs("#cr-qlist a"));
  }

  function paintTop(pr) {
    var L = pr.lengde, top = qs("#cr-top");
    top.classList.toggle("is-fresh", !pr.startet);
    top.classList.toggle("is-started", pr.startet);
    qs("#cr-start-hint").textContent = pr.startet
      ? "Du er i gang. Du kan bytte lengde når som helst, uten å miste noe."
      : "Velg lengde, så starter du her.";
    qsa(".cr-len-btn").forEach(function (b) {
      var on = b.getAttribute("data-len") === L;
      b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false");
      b.setAttribute("tabindex", on ? "0" : "-1");
    });
    qs("#cr-len-txt").textContent = LEN[L].tekst;
    var a = goAction(pr), btn = qs("#cr-fortsett"), txt = qs("#cr-fortsett-txt");
    btn.hidden = !a;
    btn.dataset.kind = a ? a.kind : ""; btn.dataset.go = a && a.id ? a.id : "";
    if (a) btn.textContent = a.long;
    txt.textContent = pr.fortsett ? "" : "Alle stegene i " + pr.lengdeNavn + " er dekket. " +
      (pr.ko.length ? "Ta repetisjonskøen, eller velg en lengre løype." : "Velg en lengre løype, eller ta stegene du vil friske opp.");
  }

  /* ---------- Fast fremdriftslinje ---------- */
  var stick = null, mainBtnVisible = true;
  function paintStick(pr) {
    if (!stick) return;
    var a = goAction(pr), go = qs("#cr-stick-go"), bar = qs("#cr-stick-bar");
    qs("#cr-stick-fill").style.width = pr.prosent + "%";
    qs("#cr-stick-pct").textContent = pr.prosent + " %";
    qs("#cr-stick-ab").textContent = pr.ferdigeSteg + "/" + pr.antallSteg + " steg";
    bar.setAttribute("aria-valuenow", String(pr.prosent));
    bar.setAttribute("aria-valuetext", pr.prosent + " % av " + pr.lengdeNavn + "-løypa dekket, " + pr.ferdigeSteg + " av " + pr.antallSteg + " steg");
    bar.title = pr.ferdigeSteg + " av " + pr.antallSteg + " steg i " + pr.lengdeNavn + " (prosenten vekter stegene etter hvor mange poeng de pleier å gi på eksamen)";
    go.dataset.kind = a ? a.kind : ""; go.dataset.go = a && a.id ? a.id : "";
    if (a) go.textContent = a.short;
    go.hidden = !a;
    var sel = qs("#cr-stick-len");
    if (sel.value !== pr.lengde) sel.value = pr.lengde;
    syncStick();
  }
  function syncStick() {
    if (!stick) return;
    var mb = qs("#cr-fortsett"), off = stickBottom();
    if (mb.hidden) mainBtnVisible = false;
    else { var r = mb.getBoundingClientRect(); mainBtnVisible = r.bottom > off && r.top < window.innerHeight; }
    var go = qs("#cr-stick-go");
    go.classList.toggle("is-away", mainBtnVisible);
    go.setAttribute("aria-hidden", mainBtnVisible ? "true" : "false");
    go.tabIndex = mainBtnVisible ? -1 : 0;
  }
  function placeStick() {
    if (!stick) return;
    var t = Math.max(0, IN.stickyH(stick) - 8);
    stick.style.top = t + "px";
    document.documentElement.style.setProperty("--cr-stick-off", (t + stick.offsetHeight + 8) + "px");
  }
  function stickBottom() { return stick ? stick.getBoundingClientRect().bottom : IN.stickyH(); }
  function stickyOff() {
    var h = IN.stickyH();
    if (stick && getComputedStyle(stick).position === "sticky") h = Math.max(h, (parseFloat(stick.style.top) || 0) + stick.offsetHeight + 8);
    return h;
  }
  function scrollToEl(target, focusEl) {
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.pageYOffset - stickyOff();
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    if (focusEl) try { focusEl.focus({ preventScroll: true }); } catch (e) {}
  }
  function initStick() {
    stick = qs("#cr-stick"); if (!stick) return;
    var sel = qs("#cr-stick-len");
    clear(sel);
    C.lengder.forEach(function (L) { sel.appendChild(el("option", { value: L.id, text: L.navn })); });
    sel.addEventListener("change", function () { setLength(sel.value, "stick"); });
    qs("#cr-stick-go").addEventListener("click", function () { runAction(this); });
    qs("#cr-stick-ov").addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "instant" });
      var mb = qs("#cr-fortsett");
      try { (mb.hidden ? qs(".cr-len-btn.on") : mb).focus({ preventScroll: true }); } catch (er) {}
    });
    var raf = 0;
    window.addEventListener("scroll", function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; syncStick(); }); }, { passive: true });
    window.addEventListener("resize", function () { placeStick(); syncStick(); });
    placeStick();
    setTimeout(placeStick, 300);
  }

  function paintQueue(pr) {
    var host = qs("#cr-qlist"); clear(host);
    if (!pr.ko.length) {
      host.appendChild(el("li", { class: "muted small cr-qempty", text: "Tom. Merk et steg eller et eksamenskort «Må øve mer», så havner det her." }));
      return;
    }
    pr.ko.forEach(function (id) {
      var s = BYID[id], why = queueWhy(id, (pr.status[id] && pr.status[id].hvorfor) || []);
      var a = el("a", { href: "#steg=" + s.id + (why.kort ? "&kort=" + why.kort : ""), text: "Steg " + s.id + " · " + s.tittel });
      host.appendChild(el("li", {}, [a, s.vekt ? el("span", { class: "cr-pts", text: s.vekt + " p" }) : null,
        why.txt ? el("span", { class: "cr-qwhy small muted", text: why.txt }) : null]));
    });
  }
  function queueWhy(id, list) {
    var txt = [], seen = {}, first = null;
    list.forEach(function (w) {
      if (w.type === "kort") {
        if (seen[w.id]) return; seen[w.id] = 1;
        if (!first) first = w.id;
        var other = (KORT_STEG[w.id] || []).filter(function (x) { return x !== id; });
        txt.push("Øv mer på " + kortTittel(w.id) + (other.length ? " (også i steg " + other.join(", ") + ")" : ""));
      } else if (w.type === "steg") {
        if (!seen._s) txt.push("Du merket steget «Må øve mer»");
        seen._s = 1;
      }
    });
    return { txt: txt.join(" · "), kort: first };
  }

  /* ---------- Etapper og steg ---------- */
  var showAll = {};
  var forced = {};

  function statusIcon(x) {
    if (x.queue) return { cls: "q", txt: "↻", lbl: "Må øves mer" };
    if (x.done) return { cls: "ok", txt: "✓", lbl: "Dekket" };
    if (x.started) return { cls: "half", txt: "◐", lbl: "Påbegynt" };
    return { cls: "todo", txt: "", lbl: "Ikke startet" };
  }

  function buildEtapper() {
    var host = qs("#cr-etapper"); clear(host);
    C.etapper.forEach(function (e) {
      var sec = el("section", { class: "card cr-etappe", id: "etappe-" + e.nr, "aria-labelledby": "etappe-h-" + e.nr });
      sec.appendChild(el("div", { class: "cr-ehead" }, [
        el("h2", { id: "etappe-h-" + e.nr, html: '<span class="cr-enr">' + e.nr + "</span> " + e.navn }),
        el("span", { class: "cr-ehvor small muted", text: e.hvor })
      ]));
      sec.appendChild(el("div", { class: "cr-ebar-row" }, [
        el("div", { class: "cr-bar", "aria-hidden": "true" }, el("span", { class: "cr-ebar-fill" })),
        el("span", { class: "cr-ecount small muted" })
      ]));
      var list = el("div", { class: "cr-steps" });
      e.steg.forEach(function (s) { list.appendChild(buildStep(s)); });
      sec.appendChild(list);
      var tog = el("button", { class: "btn sm ghost cr-etog", type: "button" });
      tog.addEventListener("click", function () { showAll[e.nr] = !showAll[e.nr]; render(); });
      sec.appendChild(tog);
      host.appendChild(sec);
    });
  }

  function buildStep(s) {
    var d = el("details", { class: "cr-step", id: "steg-" + s.id, "data-step": s.id });
    d.appendChild(el("summary", { class: "cr-ssum" }, [
      el("span", { class: "cr-sico", "aria-hidden": "true" }),
      el("span", { class: "cr-sid", text: s.id }),
      el("span", { class: "cr-stit", text: s.tittel }),
      el("span", { class: "cr-smeta" }, [
        s.vekt ? el("span", { class: "cr-pts", text: s.vekt + " p" }) : null,
        el("span", { class: "cr-tid small muted" }),
        el("span", { class: "cr-min", title: "Med fra " + LEN[s.min].navn, text: s.min })
      ]),
      el("span", { class: "sr-only cr-sstat" })
    ]));
    var body = el("div", { class: "cr-sbody" });
    d.appendChild(body);
    d._ensure = function () {
      if (!d._built) { d._built = true; buildBody(s, body); }
    };
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      d._ensure();
      if (state().sist !== s.id) setState({ sist: s.id });
      try { history.replaceState(null, "", "#steg=" + s.id); } catch (e) {}
    });
    return d;
  }

  function h3(t) { return el("h3", { class: "cr-h", text: t }); }
  function linkList(arr, s) {
    var ul = el("ul", { class: "cr-links" });
    arr.forEach(function (l) {
      if (Array.isArray(l)) ul.appendChild(el("li", {}, el("a", { href: link(l[0], l[1], l[2], s.id), text: l[3] || "Åpne" })));
      else if (l && l.href) ul.appendChild(el("li", {}, el("a", { href: l.href, target: "_blank", rel: "noopener", text: l.tekst || l.href })));
    });
    return ul;
  }
  function exampleList(arr, s, body) {
    var links = [];
    arr.forEach(function (x) {
      if (Array.isArray(x) || (x && x.href)) { links.push(x); return; }
      if (!x) return;
      var box = el("div", { class: "cr-eks" });
      if (x.tekst) box.appendChild(el("p", { class: "small", text: x.tekst }));
      if (x.html) box.appendChild(el("div", { html: x.html }));
      if (x.sql) {
        if (IN.sqlBlock) IN.sqlBlock(box, x.sql);
        else box.appendChild(el("pre", { text: x.sql }));
      }
      body.appendChild(box);
    });
    if (links.length) body.appendChild(linkList(links, s));
  }

  /* Etter «Fikk det til»: en linje rett under kortet som peker videre */
  function nextPrompt(li) {
    var old = qs(".cr-nextp", li); if (old) old.remove();
    var k = li.getAttribute("data-kid");
    if (kortState(k) !== "ok" || !li.classList.contains("is-inline")) return;
    var ul = li.parentNode, stepEl = li.closest(".cr-step"), s = stepEl && BYID[stepEl.getAttribute("data-step")];
    if (!s) return;
    var sibs = qsa(":scope > li.cr-kli", ul), i = sibs.indexOf(li), nxt = null;
    for (var j = 1; j < sibs.length && !nxt; j++) {
      var cand = sibs[(i + j) % sibs.length];
      if (kortState(cand.getAttribute("data-kid")) !== "ok") nxt = cand;
    }
    var row = el("div", { class: "cr-nextp", role: "status" });
    if (nxt) {
      var b = el("button", { class: "btn sm primary", type: "button", text: "Neste oppgave: " + kortTittel(nxt.getAttribute("data-kid")) + " ↓" });
      b.addEventListener("click", function () { openCard(stepEl, nxt.getAttribute("data-kid")); });
      row.appendChild(el("span", { class: "small", text: "✓ Lagret." }));
      row.appendChild(b);
    } else {
      var done = CP.statusAll(state().lengde)[s.id].done;
      row.appendChild(el("span", { class: "small", text: done ? "✓ Lagret. Steget er dekket." : "✓ Lagret. Alle kortene her er merket." }));
      var nb = el("button", { class: "btn sm primary", type: "button", text: "Neste steg →" });
      nb.addEventListener("click", function () { goNext(s, nb); });
      row.appendChild(nb);
    }
    li.appendChild(row);
  }
  function openCard(stepEl, k) {
    var li = qs('li.cr-kli[data-kid="' + k + '"]', stepEl); if (!li) return false;
    var ex = li.closest("details.cr-ekstra"); if (ex) ex.open = true;
    var card = qs("details.examtask", li);
    if (card) card.open = true;
    scrollToEl(li, card ? qs("summary", card) : qs("a", li));
    return true;
  }
  function goNext(s, btn) {
    var list = stepsIn(state().lengde), idx = list.indexOf(s), n = idx >= 0 ? list[idx + 1] : null;
    if (idx < 0) {   // steget er utenfor valgt lengde: neste steg i løypa som er med
      var all = STEPS, at = all.indexOf(s);
      for (var i = at + 1; i < all.length && !n; i++) if (inLen(all[i], state().lengde)) n = all[i];
    }
    if (!n) { btn.textContent = "Dette var siste steg i løypa"; btn.disabled = true; return; }
    var cur = document.getElementById("steg-" + s.id); if (cur) cur.open = false;
    openStep(n.id, true);
  }
  function doneRule(s) {
    var n = (s.oppgaver || []).filter(function (k) { return C.kort[k]; }).length, deler = [];
    if (n) deler.push(n === 1 ? "oppgaven under er merket «Fikk det til»" : "alle de " + n + " oppgavene under er merket «Fikk det til»");
    if (s.sjekk && s.sjekk.length) deler.push("sjekken er bestått (minst " + Math.round(100 * C.terskel) + " % riktige)");
    if (!n && !(s.sjekk && s.sjekk.length)) deler.push("du har merket steget «Fikk det til»");
    return "Ferdig når " + deler.join(", eller ") + ". «Må øve mer» setter steget i repetisjonskøen.";
  }

  function buildBody(s, body) {
    var L = state().lengde;
    body.appendChild(el("div", { class: "callout sensor cr-hvorfor" }, [
      el("div", { class: "lbl", text: "Hvorfor" + (s.vekt ? " · ~" + s.vekt + " poeng" : "") }),
      el("p", { html: s.hvorfor })
    ]));
    body.appendChild(el("p", { class: "cr-regel small", text: doneRule(s) }));
    body.appendChild(h3("Kjernen på 2 minutter"));
    var kh = el("div", { class: "cr-kjerne" });
    body.appendChild(kh);
    IN.explain(kh, s.kjerne, { label: "Nivå:" });
    if (s.les && s.les.length) {
      body.appendChild(el("p", { class: "small muted cr-lesmer", text: "Vil du ha mer? Les på emnesiden:" }));
      body.appendChild(linkList(s.les, s));
    }
    if (s.oppskrift && s.oppskrift.length) {
      body.appendChild(h3("Oppskrift: slik får du full pott"));
      body.appendChild(el("ol", { class: "cr-ol", html: s.oppskrift.map(function (x) { return "<li>" + x + "</li>"; }).join("") }));
    }
    if (s.eksempel && s.eksempel.length) {
      body.appendChild(h3("Gjennomgått eksempel"));
      exampleList(s.eksempel, s, body);
    }
    if (s.spesial === "generalprove") buildGeneral(s, body);
    else if ((s.oppgaver && s.oppgaver.length) || (s.ekstra && s.ekstra.length)) {
      body.appendChild(h3("Din tur"));
      if (s.oppgaver && s.oppgaver.length) {
        body.appendChild(el("p", { class: "small muted", text: "Løs på papir først og åpne løsningen etterpå. Merk kortet nederst med «Fikk det til» eller «Må øve mer»." }));
        var ul = el("ul", { class: "cr-klist" });
        s.oppgaver.forEach(function (k) { var li = kortItem(k, s); if (li) ul.appendChild(li); });
        body.appendChild(ul);
      }
      if (s.ekstra && s.ekstra.length) {
        var ex = el("details", { class: "cr-ekstra" });
        if (L === "G") ex.open = true;
        ex.appendChild(el("summary", { text: "Flere eksamensoppgaver (Grundig): " + s.ekstra.length }));
        var ul2 = el("ul", { class: "cr-klist" });
        s.ekstra.forEach(function (k) { var li = kortItem(k, s); if (li) ul2.appendChild(li); });
        ex.appendChild(ul2);
        body.appendChild(ex);
      }
    }
    var kortSteg = (s.oppgaver || []).some(function (k) { return C.kort[k]; });
    var hasCheck = s.sjekk && s.sjekk.length;
    if (hasCheck) body.appendChild(h3("Sjekk"));
    (s.sjekk || []).forEach(function (c, i) { buildCheck(s, c, i, body); });
    if (!kortSteg && !hasCheck) { body.appendChild(h3("Egenvurdering")); body.appendChild(selfMark(s)); }
    if (s.feller && s.feller.length) {
      body.appendChild(el("div", { class: "callout felle cr-feller" }, [
        el("div", { class: "lbl", text: "Feller som koster poeng" }),
        el("ul", { html: s.feller.map(function (x) { return "<li>" + x + "</li>"; }).join("") })
      ]));
    }
    var nx = el("button", { class: "btn sm cr-next", type: "button", text: "Neste steg →" });
    nx.addEventListener("click", function () { goNext(s, nx); });
    body.appendChild(el("div", { class: "cr-nextrow" }, nx));
    paintCards(body);
    paintChecks(s, body);
  }

  function buildCheck(s, c, i, body) {
    var hid = "sjekk-" + s.id + "-" + i;
    var wrap = el("div", { class: "cr-check", "data-ck": checkKey(s, i, c), "data-terskel": c.terskel || C.terskel });
    var res = el("p", { class: "cr-ckres small", "aria-live": "polite" });
    if (c.type === "quiz") {
      var host = el("div", { id: hid, class: "cr-quiz" });
      wrap.appendChild(host);
      wrap.appendChild(el("div", { class: "cr-ckbar" }, res));
      body.appendChild(wrap);
      IN.quiz(host, c.items);
    }
  }
  function paintChecks(s, root) {
    var all = P ? P.all() : {};
    qsa(".cr-check", root).forEach(function (w) {
      var rec = all[w.getAttribute("data-ck")], r = qs(".cr-ckres", w);
      if (!r) return;
      var ter = parseFloat(w.getAttribute("data-terskel")) || C.terskel;
      if (!rec || !rec.max) { r.textContent = ""; r.className = "cr-ckres small"; return; }
      var b = rec.best != null ? rec.best : rec.score || 0, ok = b / rec.max >= ter;
      r.className = "cr-ckres small " + (ok ? "ok" : "no");
      r.textContent = (ok ? "✓ Bestått. " : "Ikke bestått ennå. ") + "Beste forsøk: " + Math.round(b * 10) / 10 + " av " + rec.max +
        (ok ? "" : " (trenger " + Math.round(ter * 100) + " %).");
    });
  }
  function selfMark(s) {
    var key = "crash:steg:" + s.id;
    var wrap = el("div", { class: "et-self cr-self", role: "group", "aria-label": "Egenvurdering av steget" });
    var bOk = el("button", { class: "btn sm et-self-ok", type: "button", text: "✓ Fikk det til" });
    var bOv = el("button", { class: "btn sm et-self-ov", type: "button", text: "↻ Må øve mer" });
    function pick(v) { var r = P.get(key); P.set(key, { status: r && r.status === v ? null : v }); }
    bOk.addEventListener("click", function () { pick("ok"); });
    bOv.addEventListener("click", function () { pick("ovmer"); });
    wrap.appendChild(el("span", { class: "et-self-q muted small", text: "Hele steget:" }));
    wrap.appendChild(bOk); wrap.appendChild(bOv);
    wrap._paint = function (all) {
      var r = all[key], v = r && r.status;
      bOk.setAttribute("aria-pressed", v === "ok" ? "true" : "false");
      bOv.setAttribute("aria-pressed", v === "ovmer" ? "true" : "false");
    };
    return wrap;
  }
  function paintCards(root) {
    var all = P ? P.all() : {};
    qsa("[data-kort]", root).forEach(function (sp) {
      var k = sp.getAttribute("data-kort"), v = CP.kortStatus(CP.kortRec(k, all));
      var r = CP.kortRec(k, all), elsewhere = r && all["kort:crash:o-" + k] !== r;
      sp.className = "cr-kstat small" + (v === "ok" ? " ok" : v === "ovmer" ? " q" : "");
      sp.textContent = v === "ok" ? "✓ Fikk det til" : v === "ovmer" ? "↻ Øv mer" : "";
      if (v && elsewhere) sp.textContent += " (merket på emnesiden)";
    });
    qsa(".cr-self", root).forEach(function (w) { if (w._paint) w._paint(all); });
    qsa("li.cr-kli.is-inline", root).forEach(function (li) {
      var has = qs(".cr-nextp", li), ok = kortState(li.getAttribute("data-kid")) === "ok";
      if (!ok && has) has.remove();
      else if (ok && has) nextPrompt(li);
    });
  }

  /* ---------- Generalprøven med tidtaker (lagres ikke) ---------- */
  function buildGeneral(s, body) {
    var G = C.generalprove;
    body.appendChild(h3("Din tur: hele " + G.eksamen + " i rekkefølge"));
    var totP = G.rader.reduce(function (a, r) { return a + r.p; }, 0);
    var ctl = el("div", { class: "cr-timer" });
    var inp = el("input", { type: "number", min: "30", max: "600", step: "10", value: String(G.minutter), id: "cr-gp-min", class: "cr-gp-min", inputmode: "numeric" });
    var disp = el("output", { class: "cr-clock", "aria-live": "off", for: "cr-gp-min" });
    var bStart = el("button", { class: "btn sm primary", type: "button", text: "Start tidtaker" });
    var bReset = el("button", { class: "btn sm ghost", type: "button", text: "Nullstill" });
    ctl.appendChild(el("div", { class: "cr-tr-row" }, [el("label", { class: "small", for: "cr-gp-min", text: "Total tid (minutter):" }), inp]));
    ctl.appendChild(el("div", { class: "cr-tr-row" }, [disp, bStart, bReset]));
    ctl.appendChild(el("p", { class: "small muted", text: "Eksamen er 4 timer (240 minutter), altså 2,4 minutter per poeng. H2025 hadde 6 timer ifølge forsiden, så sjekk eksamensinformasjonen ditt år. Tidtakeren lagres ikke." }));
    body.appendChild(ctl);

    var tw = el("div", { class: "table-wrap" });
    var tbl = el("table", { class: "cmp-table cr-gp" });
    tbl.appendChild(el("thead", {}, el("tr", {}, [el("th", { text: "Nr." }), el("th", { text: "Oppgave" }), el("th", { text: "Poeng" }), el("th", { text: "Tid" })])));
    var tb = el("tbody");
    G.rader.forEach(function (r) {
      var hjem = (KORT_STEG[r.kort] || [])[0];
      var href = hjem ? "#steg=" + hjem + "&kort=" + r.kort : "#steg=" + s.id;
      var stat = el("span", { class: "cr-kstat small", "data-kort": r.kort });
      var tr = el("tr", {}, [
        el("td", { text: r.nr }),
        el("td", {}, [el("a", { href: href, text: r.tittel }), hjem ? el("span", { class: "small muted", text: " (steg " + hjem + ")" }) : null, " ", stat]),
        el("td", { text: r.p + " p" }),
        el("td", { class: "cr-gp-t" })
      ]);
      tr._p = r.p;
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); tw.appendChild(tbl); body.appendChild(tw);
    body.appendChild(el("p", { class: "small muted", text: "Lenkene åpner kortet i steget der oppgaven hører hjemme. Merk det der etter at du har rettet deg selv." }));

    var rows = qsa("tr", tb), timer = null, startAt = 0, used = 0, running = false;
    function total() { var v = parseInt(inp.value, 10); return (isFinite(v) && v > 0 ? v : G.minutter) * 60; }
    function alloc() {
      var T = total() / 60, acc = 0;
      rows.forEach(function (tr) {
        var m = Math.round(T * tr._p / totP);
        tr._from = acc; acc += T * tr._p / totP; tr._to = acc;
        qs(".cr-gp-t", tr).textContent = m + " min";
      });
    }
    function fmt(sec) {
      sec = Math.max(0, Math.round(sec));
      var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60;
      return (h ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (x < 10 ? "0" : "") + x;
    }
    function elapsed() { return used + (running ? (Date.now() - startAt) / 1000 : 0); }
    function tick() {
      var e = elapsed(), left = total() - e, em = e / 60;
      disp.textContent = left > 0 ? fmt(left) + " igjen" : "Tiden er ute";
      disp.classList.toggle("ute", left <= 0);
      rows.forEach(function (tr) {
        tr.classList.toggle("cr-now", (running || used > 0) && em >= tr._from && em < tr._to);
      });
      if (left <= 0 && running) { used = total(); running = false; clearInterval(timer); bStart.textContent = "Start tidtaker"; }
    }
    bStart.addEventListener("click", function () {
      if (running) { used = elapsed(); running = false; clearInterval(timer); bStart.textContent = "Fortsett"; }
      else { if (elapsed() >= total()) used = 0; startAt = Date.now(); running = true; timer = setInterval(tick, 1000); bStart.textContent = "Pause"; }
      inp.disabled = running || used > 0;
      tick();
    });
    bReset.addEventListener("click", function () {
      running = false; used = 0; clearInterval(timer); bStart.textContent = "Start tidtaker"; inp.disabled = false; tick();
    });
    inp.addEventListener("input", function () { alloc(); tick(); });
    alloc(); tick();
    body.appendChild(h3("Egenvurdering"));
    body.appendChild(selfMark(s));
  }

  /* ---------- Maling av status ---------- */
  function render() {
    var pr = IN.crashProgress(), L = pr.lengde, st = pr.status;
    paintTop(pr);
    paintQueue(pr);
    C.etapper.forEach(function (e, ei) {
      var sec = document.getElementById("etappe-" + e.nr); if (!sec) return;
      var es = pr.etapper[ei];
      var out = e.steg.length - es.antallSteg;
      var n = es.antallSteg, nd = es.ferdigeSteg;
      qs(".cr-ebar-fill", sec).style.width = (n ? Math.round(100 * nd / n) : 0) + "%";
      qs(".cr-ecount", sec).textContent = n
        ? nd + " av " + n + " steg" + (es.total ? " · " + es.dekket + " av " + es.total + " p" : "")
        : "Ikke med i " + LEN[L].navn;
      sec.classList.toggle("cr-utenfor", !n);
      e.steg.forEach(function (s) {
        var d = document.getElementById("steg-" + s.id);
        d.hidden = !(inLen(s, L) || showAll[e.nr] || forced[s.id]);
        d.classList.toggle("cr-ekstra-steg", !inLen(s, L));
        var x = st[s.id], ic = statusIcon(x), ico = qs(".cr-sico", d);
        ico.className = "cr-sico " + ic.cls; ico.textContent = ic.txt;
        qs(".cr-sstat", d).textContent = ic.lbl;
        d.classList.toggle("is-done", x.done);
        qs(".cr-tid", d).textContent = minutes(s, L) + " min";
        if (d._built) { paintCards(d); paintChecks(s, d); }
      });
      var tog = qs(".cr-etog", sec);
      tog.hidden = !out; tog.style.display = out ? "" : "none";
      tog.textContent = showAll[e.nr] ? "Skjul steg utenfor " + LEN[L].navn : "Vis " + out + " steg utenfor " + LEN[L].navn;
    });
    paintStick(pr);
  }

  /* ---------- Åpne steg (dyplenke #steg=…&kort=…) ---------- */
  function openStep(id, scroll, kort) {
    var s = BYID[id]; if (!s) return;
    if (!inLen(s, state().lengde)) { forced[id] = true; render(); }
    var d = document.getElementById("steg-" + id); if (!d) return;
    d.hidden = false;
    d.open = true;
    d._ensure();
    if (kort) {
      setTimeout(function () { if (!openCard(d, kort) && scroll) scrollToEl(d, qs("summary", d)); }, 30);
      return;
    }
    if (!scroll) return;
    var go = function () {
      var top = d.getBoundingClientRect().top + window.pageYOffset - stickyOff();
      window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    };
    setTimeout(go, 30); setTimeout(go, 350);
    try { d.querySelector("summary").focus({ preventScroll: true }); } catch (e) {}
  }
  function fromHash() {
    var m = location.hash.match(/steg=([\w-]+)/), k = location.hash.match(/kort=([\w-]+)/);
    if (m && BYID[m[1]]) openStep(m[1], true, k && C.kort[k[1]] ? k[1] : null);
  }

  /* ---------- Overføring og nullstilling ---------- */
  function initTools() {
    var code = qs("#cr-code"), msg = qs("#cr-tr-msg"), copy = qs("#cr-copy");
    qs("#cr-export").addEventListener("click", function () {
      code.value = P.exportCode();
      copy.hidden = false;
      msg.textContent = "Koden er laget. Kopier den og lim den inn på den andre enheten.";
      code.select();
    });
    copy.addEventListener("click", function () {
      var done = function () { msg.textContent = "Kopiert."; };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code.value).then(done, function () { code.select(); document.execCommand("copy"); done(); });
        else { code.select(); document.execCommand("copy"); done(); }
      } catch (e) { msg.textContent = "Kunne ikke kopiere automatisk. Merk teksten og kopier selv."; }
    });
    qs("#cr-import").addEventListener("click", function () {
      var v = code.value.trim();
      if (!v) { msg.textContent = "Lim inn en kode først."; return; }
      msg.textContent = P.importCode(v) ? "Importert. Fremdriften er oppdatert." : "Koden kunne ikke leses. Sjekk at hele koden er med.";
    });
    qs("#cr-reset").addEventListener("click", function () {
      if (!window.confirm("Nullstille all fremdrift? Dette sletter løypa, egenvurderingene på eksamenskortene og testresultatene på alle sidene i IN2090-guiden, på denne enheten. Det kan ikke angres, med mindre du har en overføringskode.")) return;
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (k && k.indexOf("in2090:quiz:crash:") === 0) localStorage.removeItem(k);
        }
      } catch (e) {}
      P.clear();
      location.hash = "";
      location.reload();
    });
  }

  /* ---------- Oppstart ---------- */
  function start() {
    if (!P) return;
    buildLenPicker();
    buildEtapper();
    initStick();
    render();
    initTools();
    qs("#cr-fortsett").addEventListener("click", function () { runAction(this); });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#steg="]');
      if (!a) return;
      e.preventDefault();
      var h = a.getAttribute("href"), id = (h.match(/steg=([\w-]+)/) || [])[1], k = (h.match(/kort=([\w-]+)/) || [])[1];
      try { history.replaceState(null, "", h); } catch (er) {}
      openStep(id, true, k && C.kort[k] ? k : null);
    });
    var pend = null;
    function soon() { if (pend) return; pend = setTimeout(function () { pend = null; render(); }, 30); }
    document.addEventListener("in:progress", soon);
    document.addEventListener("in:progress", function (e) {
      var key = e.detail && e.detail.key; if (!key || key.indexOf("kort:") !== 0) return;
      qsa("li.cr-kli.is-inline").forEach(function (li) {
        if (key !== "kort:crash:o-" + li.getAttribute("data-kid")) return;
        var c = qs("details.examtask", li);
        if (c && c.open) nextPrompt(li);
      });
    });
    window.addEventListener("storage", function (e) { if (!e.key || e.key === P.KEY) soon(); });
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
