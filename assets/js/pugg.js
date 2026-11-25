/* ============================================================
   IN2090 guide · pugg.js
   Puggemotor (flashcards): én kortstokk om gangen. Du ser forsiden, tenker, snur kortet,
   og sier selv om det satt. «Kan den» tar kortet ut av bunken. «Øv mer» legger det tilbake
   litt lenger ned, så det kommer igjen og igjen til det sitter. «Nullstill» tar alle inn igjen.

   IN.pugg(host, deck, opts) → { reset() }
     deck = { id, tittel, intro?, vend?: true|false,   vend: kortene kan øves begge veier
              retning?: ["Figur → betydning", "Betydning → figur"],
              kort: [{ id, a: side, b: side, kilde?: "F05-01 lysark 7" }] }
     side = "html" | { html?, er?: <figur for IN.vizEr>, pre?: "monospace-tekst", etter?: "html" }
     opts = { side?: progress-side }

   Lagring: in2090:pugg:<deck.id>:<retning> = { k: { <kort-id>: <fingeravtrykk> } }
     Et kort regnes bare som «kan» hvis innholdet er uendret siden du merket det (fingeravtrykk),
     så et rettet eller nytt kort kommer tilbake i bunken. Ødelagt lagring gir en tom liste.
   Fremdrift: IN.progress.solved("pugg", "<deck.id>-<retning>", antall du kan, antall kort).
   Tastatur (når fokus er i kortstokken): mellomrom/Enter snur, J eller 1 = kan, F eller 2 = øv mer.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var PREFIX = "in2090:pugg:";
  var N_OM = 0;

  function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function sideTekst(s) { return typeof s === "string" ? s : JSON.stringify(s || ""); }
  function fp(k) { return hash(sideTekst(k.a) + "|" + sideTekst(k.b)); }
  function bland(arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }

  IN.pugg = function (host, deck, opts) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host || !deck || !deck.kort || !deck.kort.length) return null;
    opts = opts || {};
    var el = IN.el, uid = "pg" + (++N_OM);
    var dir = 0, kø = [], kan = {}, cur = null, snudd = false, runde = 0;
    var byId = {};
    deck.kort.forEach(function (k) { byId[k.id] = k; });

    function nøkkel() { return PREFIX + deck.id + ":" + dir; }
    function last() {
      var o = null;
      try { o = JSON.parse(IN.store.get(nøkkel(), "null")); } catch (e) { o = null; }
      var ut = {};
      if (o && o.k && typeof o.k === "object" && !Array.isArray(o.k)) {
        Object.keys(o.k).forEach(function (id) { if (byId[id] && o.k[id] === fp(byId[id])) ut[id] = o.k[id]; });
      }
      return ut;
    }
    function lagre() {
      IN.store.set(nøkkel(), JSON.stringify({ k: kan }));
      var n = Object.keys(kan).length;
      if (IN.progress && IN.progress.solved) IN.progress.solved("pugg", deck.id + "-" + dir, n, deck.kort.length);
    }

    /* ---------- Oppsett ---------- */
    host.innerHTML = "";
    var root = el("div", { class: "pg", tabindex: "-1", role: "group", "aria-label": "Puggekort: " + (deck.tittel || deck.id) });
    host.appendChild(root);
    if (deck.intro) root.appendChild(el("div", { class: "pg-intro", html: deck.intro }));

    var verktøy = el("div", { class: "pg-tools" });
    root.appendChild(verktøy);
    var retningKnapper = [];
    if (deck.vend) {
      var navn = deck.retning || ["Forside → bakside", "Bakside → forside"];
      var grp = el("div", { class: "pg-dir", role: "group", "aria-label": "Retning" });
      navn.forEach(function (t, i) {
        var b = el("button", { class: "btn sm", type: "button", "aria-pressed": i === 0 ? "true" : "false", text: t });
        b.addEventListener("click", function () { if (dir !== i) { dir = i; start(); } });
        retningKnapper.push(b); grp.appendChild(b);
      });
      verktøy.appendChild(grp);
    }
    var status = el("div", { class: "pg-status", "aria-live": "polite" });
    verktøy.appendChild(status);
    var bar = el("div", { class: "pg-bar", "aria-hidden": "true" }, el("span"));
    root.appendChild(bar);

    var kort = el("div", { class: "pg-kort" });
    var forside = el("div", { class: "pg-side pg-for" });
    var skille = el("div", { class: "pg-skille", "aria-hidden": "true" });
    var bakside = el("div", { class: "pg-side pg-bak", id: uid + "-bak" });
    kort.appendChild(forside); kort.appendChild(skille); kort.appendChild(bakside);
    root.appendChild(kort);

    var knapper = el("div", { class: "pg-knapper" });
    var bSnu = el("button", { class: "btn primary", type: "button", "aria-controls": uid + "-bak", text: "Vis svaret" });
    var bKan = el("button", { class: "btn pg-kan", type: "button", text: "✓ Kan den" });
    var bMer = el("button", { class: "btn pg-mer", type: "button", text: "↻ Øv mer" });
    knapper.appendChild(bSnu); knapper.appendChild(bMer); knapper.appendChild(bKan);
    root.appendChild(knapper);
    root.appendChild(el("p", { class: "small muted pg-hint", text: "Si svaret høyt eller skriv det ned før du snur. Vær ærlig: «Kan den» bare når du hadde det helt riktig. Tastatur: mellomrom snur, J = kan, F = øv mer." }));

    var ferdig = el("div", { class: "pg-ferdig", hidden: "" });
    root.appendChild(ferdig);

    var bunn = el("div", { class: "pg-bunn" });
    var bReset = el("button", { class: "btn sm ghost", type: "button", text: "↺ Nullstill kortstokken" });
    bunn.appendChild(bReset);
    root.appendChild(bunn);
    var liste = el("details", { class: "pg-liste" });
    liste.appendChild(el("summary", { text: "Alle kortene i stokken" }));
    var listeInnhold = el("div");
    liste.appendChild(listeInnhold);
    root.appendChild(liste);

    /* ---------- Tegning av én side ---------- */
    function tegnSide(n, s) {
      n.innerHTML = "";
      if (s == null) return;
      if (typeof s === "string") { n.appendChild(el("div", { class: "pg-tekst", html: s })); return; }
      if (s.html) n.appendChild(el("div", { class: "pg-tekst", html: s.html }));
      if (s.er) {
        var fig = el("figure", { class: "exam-fig pg-fig" }), fh = el("div", { class: "exam-fig-h" });
        fig.appendChild(fh); n.appendChild(fig);
        if (typeof IN.vizEr === "function") { try { IN.vizEr(fh, s.er, { fit: true, title: "ER-figur på puggekortet" }); } catch (e) { if (window.console) console.error(e); } }
      }
      if (s.pre) n.appendChild(el("pre", { class: "pg-pre", text: s.pre }));
      if (s.etter) n.appendChild(el("div", { class: "pg-tekst pg-etter", html: s.etter }));
    }
    function forsideAv(k) { return dir === 0 ? k.a : k.b; }
    function baksideAv(k) { return dir === 0 ? k.b : k.a; }

    /* ---------- Flyt ---------- */
    function oppdaterStatus() {
      var n = deck.kort.length, k = Object.keys(kan).length;
      status.textContent = "Kan " + k + " av " + n + " · " + kø.length + " igjen i bunken";
      bar.firstChild.style.width = (n ? Math.round(100 * k / n) : 0) + "%";
      retningKnapper.forEach(function (b, i) { b.setAttribute("aria-pressed", i === dir ? "true" : "false"); });
    }
    function visNeste() {
      snudd = false;
      cur = kø.length ? kø[0] : null;
      var tom = !cur;
      kort.hidden = tom; knapper.hidden = tom; ferdig.hidden = !tom;
      root.classList.toggle("pg-snudd", false);
      if (tom) {
        ferdig.innerHTML = "";
        ferdig.appendChild(el("p", { class: "pg-ferdig-t", html: "<b>Alle kortene sitter.</b> Ta stokken igjen om noen dager, eller nullstill den nå for en ny runde." }));
        ferdig.appendChild(el("button", { class: "btn primary", type: "button", text: "↺ Øv hele stokken på nytt", onclick: nullstill }));
        oppdaterStatus(); tegnListe();
        return;
      }
      tegnSide(forside, forsideAv(cur));
      bakside.innerHTML = ""; bakside.hidden = true; skille.hidden = true;
      bSnu.hidden = false; bKan.hidden = true; bMer.hidden = true;
      oppdaterStatus();
    }
    function snu() {
      if (!cur || snudd) return;
      snudd = true;
      tegnSide(bakside, baksideAv(cur));
      if (cur.kilde) bakside.appendChild(el("p", { class: "pg-kilde small muted", text: "Kilde: " + cur.kilde }));
      bakside.hidden = false; skille.hidden = false;
      root.classList.add("pg-snudd");
      bSnu.hidden = true; bKan.hidden = false; bMer.hidden = false;
      bMer.focus();
    }
    function svar(satt) {
      if (!cur || !snudd) return;
      var k = kø.shift();
      if (satt) { kan[k.id] = fp(k); lagre(); }
      else {
        // Tilbake i bunken, men ikke rett etter seg selv: plass 3 (eller sist i en liten bunke)
        var p = Math.min(kø.length, 3);
        kø.splice(p, 0, k);
      }
      visNeste();
      tegnListe();
      (kø.length ? bSnu : ferdig.querySelector("button") || root).focus();
    }
    function start() {
      kan = last();
      kø = bland(deck.kort.filter(function (k) { return !kan[k.id]; }));
      runde++;
      visNeste(); tegnListe();
    }
    function nullstill() {
      kan = {}; lagre();
      kø = bland(deck.kort.slice());
      visNeste(); tegnListe();
      bSnu.focus();
    }

    /* ---------- Lista over alle kort (med «Ta tilbake» for dem du kan) ---------- */
    function tegnListe() {
      if (!liste.open) return;
      listeInnhold.innerHTML = "";
      var ul = el("ul", { class: "pg-liste-ul" });
      deck.kort.forEach(function (k) {
        var s = forsideAv(k), tekst = k.navn || (typeof s === "string" ? s : s.html);
        if (!tekst) { // Figur på forsiden: bruk starten av baksiden som navn i lista
          var bs = baksideAv(k), tmp = document.createElement("div");
          tmp.innerHTML = typeof bs === "string" ? bs : (bs.html || bs.pre || "");
          tekst = "(figur) " + (tmp.textContent || "").slice(0, 70) + "…";
          tekst = tekst.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
        }
        var li = el("li", { class: kan[k.id] ? "pg-li-kan" : "" });
        li.appendChild(el("span", { class: "pg-li-t", html: (kan[k.id] ? "✓ " : "") + tekst }));
        if (kan[k.id]) li.appendChild(el("button", { class: "btn sm ghost", type: "button", text: "Ta tilbake", onclick: function () {
          delete kan[k.id]; lagre();
          kø.push(k); if (kø.length === 1) visNeste(); else oppdaterStatus();
          tegnListe();
        } }));
        ul.appendChild(li);
      });
      listeInnhold.appendChild(ul);
    }
    liste.addEventListener("toggle", tegnListe);

    bSnu.addEventListener("click", snu);
    bKan.addEventListener("click", function () { svar(true); });
    bMer.addEventListener("click", function () { svar(false); });
    bReset.addEventListener("click", function () {
      var ok = true;
      try { ok = window.confirm("Nullstille kortstokken? Alle kortene kommer tilbake i bunken."); } catch (e) {}
      if (ok) nullstill();
    });
    root.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target && e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SUMMARY") return;
      var k = e.key;
      if ((k === " " || k === "Enter") && !snudd && cur) { if (t === "BUTTON" && e.target !== bSnu) return; e.preventDefault(); snu(); }
      else if (snudd && (k === "j" || k === "J" || k === "1")) { e.preventDefault(); svar(true); }
      else if (snudd && (k === "f" || k === "F" || k === "2")) { e.preventDefault(); svar(false); }
    });

    start();
    return { reset: nullstill };
  };
})();
