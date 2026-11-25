/* ============================================================
   IN2090 guide · side-begreper.js
   Demoer for blokk 0 (00-begreper.html):
     IN.begreper.snSjekk(host)   «Er dette en supernøkkel?» på Rom: velg attributter, se om
                                 instansen motbeviser og hva reglene sier (SN / KN / ingen).
     IN.begreper.tabeller(host)  Rom og Booking med PN og FN markert.
     IN.begreper.dra(host)       dra-øvingene fra IN.dataBegreper.dra (IN.dragTask fra dra.js).
   Klassisk script. Lastes etter core.js, viz-relation.js, dra.js og data-begreper.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var el = IN.el;

  function setStr(a) { return "{" + a.join(", ") + "}"; }
  function contains(big, small) { return small.every(function (x) { return big.indexOf(x) >= 0; }); }

  /* Ren logikk (testbar): finn første par rader som er like i attributtene, og hva reglene sier. */
  function vurder(D, valgt) {
    var R = D.rom, idx = valgt.map(function (a) { return R.kolonner.indexOf(a); });
    var par = null;
    for (var i = 0; i < R.rader.length && !par; i++)
      for (var j = i + 1; j < R.rader.length && !par; j++)
        if (idx.every(function (k) { return String(R.rader[i][k]) === String(R.rader[j][k]); })) par = [i, j];
    var sn = D.regler.kn.some(function (kn) { return contains(valgt, kn); });
    var kn = sn && D.regler.kn.some(function (k) { return k.length === valgt.length && contains(valgt, k); });
    var inne = D.regler.kn.filter(function (k) { return contains(valgt, k); });
    return { par: par, sn: sn, kn: kn, inne: inne };
  }

  function snSjekk(host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var D = IN.dataBegreper, valgt = [];
    var box = el("div", { class: "card bg-sn" });
    box.appendChild(el("div", { class: "small", html: "<b>Reglene for Rom:</b>" }));
    box.appendChild(el("ul", { class: "small bg-regler" }, D.regler.tekst.map(function (t) { return el("li", { text: t }); })));
    var knapper = el("div", { class: "btn-row", role: "group", "aria-label": "Velg attributter" });
    D.rom.kolonner.forEach(function (a) {
      var b = el("button", { type: "button", class: "btn sm", "aria-pressed": "false", text: a });
      b.addEventListener("click", function () {
        var k = valgt.indexOf(a);
        if (k >= 0) valgt.splice(k, 1); else valgt.push(a);
        b.setAttribute("aria-pressed", k >= 0 ? "false" : "true");
        tegn();
      });
      knapper.appendChild(b);
    });
    var nullstill = el("button", { type: "button", class: "btn sm ghost", text: "↺ Tøm" });
    nullstill.addEventListener("click", function () {
      valgt = [];
      IN.qsa("button[aria-pressed]", knapper).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      tegn();
    });
    knapper.appendChild(nullstill);
    box.appendChild(knapper);
    var tabHost = el("div");
    var svar = el("div", { class: "bg-svar", "aria-live": "polite" });
    box.appendChild(tabHost);
    box.appendChild(svar);
    host.appendChild(box);

    function linje(cls, html) { return el("p", { class: "bg-linje " + cls, html: html }); }

    function tegn() {
      IN.clear(tabHost); IN.clear(svar);
      // Kolonnerekkefølge fast, uavhengig av klikkrekkefølge
      var v = D.rom.kolonner.filter(function (a) { return valgt.indexOf(a) >= 0; });
      var t = { navn: D.rom.navn, kolonner: D.rom.kolonner, rader: D.rom.rader, marks: { kolonner: {}, rader: {} } };
      v.forEach(function (a) { t.marks.kolonner[a] = "sel"; });
      if (!v.length) {
        IN.vizTable(tabHost, t, { compact: true });
        svar.appendChild(linje("", "Velg ett eller flere attributter over."));
        return;
      }
      var r = vurder(D, v);
      if (r.par) { t.marks.rader[r.par[0]] = "hit"; t.marks.rader[r.par[1]] = "hit"; }
      IN.vizTable(tabHost, t, { compact: true });
      var X = '<span class="mono">' + setStr(v) + "</span>";
      if (r.par) {
        svar.appendChild(linje("bg-nei", "<b>Dataene:</b> rad " + (r.par[0] + 1) + " og " + (r.par[1] + 1) + " har like verdier i " + X + ". Allerede her ser vi at " + X + " ikke er en supernøkkel."));
      } else {
        svar.appendChild(linje("", "<b>Dataene:</b> ingen to rader er like i " + X + ". Det motbeviser ikke nøkkelen, men kan heller ikke bevise den. Se reglene."));
      }
      if (r.kn) {
        svar.appendChild(linje("bg-ja", "<b>Reglene:</b> " + X + " er en <b>kandidatnøkkel</b>. Ingen to rom kan ha like verdier her, og ingen ekte delmengde er nok."));
      } else if (r.sn) {
        var over = v.filter(function (a) { return !r.inne.some(function (k) { return k.indexOf(a) >= 0; }); });
        svar.appendChild(linje("bg-ja", "<b>Reglene:</b> " + X + " er en <b>supernøkkel</b>, fordi den inneholder " +
          r.inne.map(function (k) { return '<span class="mono">' + setStr(k) + "</span>"; }).join(" og ") +
          ". Den er ikke en kandidatnøkkel" + (over.length ? ": " + over.join(", ") + " er overflødig." : ", fordi den inneholder begge kandidatnøklene og kan gjøres mindre.")));
      } else {
        svar.appendChild(linje("bg-nei", "<b>Reglene:</b> " + X + " er <b>ikke</b> en supernøkkel. Den inneholder verken " +
          '<span class="mono">{romkode}</span> eller <span class="mono">{bygning, romnr}</span>, så to lovlige rom kan få like verdier.'));
        if (!r.par) svar.appendChild(linje("bg-merk", "Her er dataene unike, men nøkkelen holder ikke. Det er derfor nøkler bestemmes av reglene, ikke av radene."));
      }
    }
    tegn();
  }

  function tabeller(host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var D = IN.dataBegreper;
    var g = el("div", { class: "grid cols-2 bg-tab" });
    var a = el("div"), b = el("div");
    g.appendChild(a); g.appendChild(b);
    host.appendChild(g);
    IN.vizTable(a, { navn: "Rom", kolonner: [{ navn: "romkode", pk: true }, "bygning", "romnr", "etasje", "plasser"], rader: D.rom.rader,
      caption: "PN: {romkode}. KN: {romkode}, {bygning, romnr}." }, { compact: true });
    IN.vizTable(b, { navn: "Booking", kolonner: [{ navn: "romkode", pk: true, fk: "Rom" }, { navn: "dato", pk: true }, "emne"], rader: D.booking.rader,
      caption: "PN: {romkode, dato}. FN: romkode → Rom(romkode). Én av radene bryter fremmednøkkelen." }, { compact: true });
  }

  var TYPE = { sort: "Sortere", bucket: "Bøtter", match: "Koble" };
  function dra(host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host || !IN.dragTask) return;
    IN.dataBegreper.dra.forEach(function (ov) {
      var card = el("div", { class: "card dra-card", id: "dra-" + ov.id });
      card.appendChild(el("h4", null, [document.createTextNode(ov.tittel), el("span", { class: "tag dra-type", text: TYPE[ov.mode] || "" })]));
      if (ov.intro) card.appendChild(el("div", { class: "dra-intro", html: ov.intro }));
      var h = el("div");
      card.appendChild(h);
      host.appendChild(card);
      try { IN.dragTask(h, ov, { side: "begreper" }); } catch (e) { if (window.console) console.error("[side-begreper] " + ov.id, e); }
    });
  }

  IN.begreper = { snSjekk: snSjekk, tabeller: tabeller, dra: dra, vurder: vurder };
})();
