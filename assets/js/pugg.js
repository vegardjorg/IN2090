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
    var dir = 0, kø = [], kan = {}, cur = null, snudd = false, runde = 0, pos = 0;
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

    /* ---------- Oppsett ----------
       Kortet har tre faste soner: spørsmål, knapperad, svar. Spørsmåls- og svarsonen får høyden
       til det høyeste kortet i stokken (målt ved første visning og når bredden endrer seg), så
       knappene står på samme sted fra kort til kort og ingenting hopper når du snur. */
    host.innerHTML = "";
    var root = el("div", { class: "pg", tabindex: "-1", role: "group", "aria-label": "Puggekort: " + (deck.tittel || deck.id) });
    host.appendChild(root);

    var kort = el("div", { class: "pg-kort" });
    root.appendChild(kort);
    var topp = el("div", { class: "pg-topp" });
    kort.appendChild(topp);
    var status = el("span", { class: "pg-status", "aria-live": "polite" });
    topp.appendChild(status);
    var retningKnapper = [];
    if (deck.vend) {
      var navn = deck.retning || ["Forside → bakside", "Bakside → forside"];
      var grp = el("div", { class: "pg-dir", role: "group", "aria-label": "Retning" });
      navn.forEach(function (t, i) {
        var b = el("button", { type: "button", "aria-pressed": i === 0 ? "true" : "false", text: t });
        b.addEventListener("click", function () { if (dir !== i) { dir = i; start(); maal(true); } });
        retningKnapper.push(b); grp.appendChild(b);
      });
      topp.appendChild(grp);
    }
    var bar = el("div", { class: "pg-bar", "aria-hidden": "true" }, el("span"));
    kort.appendChild(bar);

    var forside = el("div", { class: "pg-side pg-for" });
    var knapper = el("div", { class: "pg-knapper" });
    var bakside = el("div", { class: "pg-side pg-bak", id: uid + "-bak", "aria-live": "polite" });
    kort.appendChild(forside); kort.appendChild(knapper); kort.appendChild(bakside);

    var bSnu = el("button", { class: "btn primary pg-snu", type: "button", "aria-controls": uid + "-bak", html: "Vis svaret <kbd>mellomrom</kbd>" });
    var bMer = el("button", { class: "btn pg-mer", type: "button", html: "↻ Øv mer <kbd>F</kbd>" });
    var bKan = el("button", { class: "btn pg-kan", type: "button", html: "✓ Kan den <kbd>J</kbd>" });
    var bNy = el("button", { class: "btn primary pg-snu", type: "button", text: "↺ Øv hele stokken på nytt" });
    var bForr = el("button", { class: "btn pg-nav", type: "button", "aria-label": "Forrige kort (pil venstre)", title: "Forrige kort (←)", text: "‹" });
    var bNeste = el("button", { class: "btn pg-nav", type: "button", "aria-label": "Neste kort uten å svare (pil høyre)", title: "Neste kort (→)", text: "›" });
    knapper.appendChild(bForr); knapper.appendChild(bSnu); knapper.appendChild(bMer); knapper.appendChild(bKan); knapper.appendChild(bNy); knapper.appendChild(bNeste);

    var bunn = el("div", { class: "pg-bunn" });
    var liste = el("details", { class: "pg-liste" });
    var listeSum = el("summary", { text: "Alle kortene" });
    liste.appendChild(listeSum);
    var bReset = el("button", { class: "btn sm ghost", type: "button", text: "↺ Nullstill" });
    bunn.appendChild(liste); bunn.appendChild(bReset);
    root.appendChild(bunn);
    var listeInnhold = el("div", { class: "pg-liste-inn" });
    root.appendChild(listeInnhold);

    var forkl = el("details", { class: "pg-forkl" });
    forkl.appendChild(el("summary", { text: "Om denne stokken" }));
    if (deck.intro) forkl.appendChild(el("div", { class: "pg-intro", html: deck.intro }));
    forkl.appendChild(el("p", { class: "small muted", text: "Svar høyt eller på papir før du snur. Trykk «Kan den» bare når du hadde det helt riktig; da forsvinner kortet. «Øv mer» legger det tilbake noen plasser lenger ned." }));
    root.appendChild(forkl);

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
    function tegnBak(n, k) {
      tegnSide(n, baksideAv(k));
      if (k.kilde) n.appendChild(el("p", { class: "pg-kilde", text: "Kilde: " + k.kilde }));
    }
    function forsideAv(k) { return dir === 0 ? k.a : k.b; }
    function baksideAv(k) { return dir === 0 ? k.b : k.a; }

    /* ---------- Fast høyde: mål høyeste for- og bakside i stokken ---------- */
    var maaltBredde = 0, maaltDir = -1;
    function maal(tving) {
      var w = forside.clientWidth;
      if (!w || (!tving && w === maaltBredde && dir === maaltDir)) return;
      maaltBredde = w; maaltDir = dir;
      var m = el("div", { class: "pg-side", "aria-hidden": "true", style: "position:absolute;left:-9999px;top:0;visibility:hidden;width:" + w + "px" });
      kort.appendChild(m);
      var hFor = 0, hBak = 0;
      deck.kort.forEach(function (k) {
        m.className = "pg-side pg-for"; tegnSide(m, forsideAv(k)); hFor = Math.max(hFor, m.getBoundingClientRect().height);
        m.className = "pg-side pg-bak"; tegnBak(m, k); hBak = Math.max(hBak, m.getBoundingClientRect().height);
      });
      kort.removeChild(m);
      forside.style.minHeight = Math.ceil(hFor) + "px";
      bakside.style.minHeight = Math.ceil(hBak) + "px";
    }
    if (typeof ResizeObserver === "function") {
      var ventRO = 0;
      new ResizeObserver(function () { clearTimeout(ventRO); ventRO = setTimeout(function () { maal(false); }, 30); }).observe(kort);
    }

    /* ---------- Flyt ---------- */
    function oppdaterStatus() {
      var n = deck.kort.length, k = Object.keys(kan).length;
      status.innerHTML = "";
      status.appendChild(el("b", { text: "Kan " + k + "/" + n }));
      status.appendChild(document.createTextNode(kø.length ? " · kort " + (pos % kø.length + 1) + " av " + kø.length : " · ingen igjen"));
      bForr.disabled = bNeste.disabled = kø.length < 2;
      bar.firstChild.style.width = (n ? Math.round(100 * k / n) : 0) + "%";
      retningKnapper.forEach(function (b, i) { b.setAttribute("aria-pressed", i === dir ? "true" : "false"); });
      listeSum.textContent = "Alle kortene (" + n + ")";
    }
    function knappeModus(m) { // "snu" | "svar" | "ferdig"
      bSnu.hidden = m !== "snu"; bMer.hidden = m !== "svar"; bKan.hidden = m !== "svar"; bNy.hidden = m !== "ferdig";
      knapper.setAttribute("data-modus", m);
    }
    function plassholder() {
      bakside.innerHTML = "";
      bakside.appendChild(el("div", { class: "pg-plass", html: "<span>Svaret kommer her når du snur kortet.</span>" +
        "<span class=\"pg-plass-pc\">Mellomrom snur · J kan · F øv mer · ← → blar</span>" +
        "<span class=\"pg-plass-mob\">Sveip kortet til siden for å bla</span>" }));
    }
    function visNeste() {
      maal(false);
      snudd = false;
      cur = kø.length ? kø[0] : null;
      root.classList.remove("pg-snudd");
      if (!cur) {
        forside.innerHTML = "";
        forside.appendChild(el("div", { class: "pg-tekst pg-ferdig", html: "<b>Alle kortene sitter.</b><br>Ta stokken igjen om noen dager, eller øv hele stokken på nytt nå." }));
        bakside.innerHTML = "";
        knappeModus("ferdig");
        oppdaterStatus(); tegnListe();
        return;
      }
      tegnSide(forside, forsideAv(cur));
      plassholder();
      knappeModus("snu");
      oppdaterStatus();
    }
    function snu() {
      if (!cur || snudd) return;
      maal(false);
      snudd = true;
      tegnBak(bakside, cur);
      root.classList.add("pg-snudd");
      knappeModus("svar");
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
      (kø.length ? bSnu : bNy).focus();
    }
    function start() {
      kan = last();
      kø = bland(deck.kort.filter(function (k) { return !kan[k.id]; })); pos = 0;
      runde++;
      visNeste(); tegnListe();
    }
    function nullstill() {
      kan = {}; lagre();
      kø = bland(deck.kort.slice()); pos = 0;
      visNeste(); tegnListe();
      bSnu.focus();
    }

    /* ---------- Lista over alle kort (med «Ta tilbake» for dem du kan) ---------- */
    function tegnListe() {
      listeInnhold.hidden = !liste.open;
      if (!liste.open) return;
      listeInnhold.innerHTML = "";
      var ul = el("ul", { class: "pg-liste-ul" });
      deck.kort.forEach(function (k) {
        var s = forsideAv(k), tekst = k.navn || (typeof s === "string" ? s : s.html);
        if (tekst && tekst.indexOf("<svg") >= 0) tekst = ""; // grunnsymbol: navngi fra baksiden
        if (!tekst && s && s.pre) tekst = s.pre.split("\n").slice(0, 2).join(" · ").replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
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

    /* ---------- Bla uten å svare ----------
       bla(steg) roterer bunken: neste kort legges bakerst, forrige hentes fram igjen. pos sier hvor
       i runden du er. Knappene og tastene gir en kort skli-inn; på mobil følger kortet fingeren. */
    var rolig = false;
    try { rolig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    function bla(steg) {
      if (kø.length < 2) return;
      if (steg > 0) { kø.push(kø.shift()); pos++; }
      else { kø.unshift(kø.pop()); pos = (pos - 1 + kø.length) % kø.length; }
      visNeste();
    }
    function sett(x, ms) { // flytt kortet x px sidelengs, med eller uten overgang
      kort.style.transition = ms ? "transform " + ms + "ms ease-out, opacity " + ms + "ms ease-out" : "none";
      kort.style.transform = x ? "translateX(" + x + "px) rotate(" + (x / 40).toFixed(2) + "deg)" : "";
      kort.style.opacity = x ? String(Math.max(0.35, 1 - Math.abs(x) / (kort.offsetWidth * 1.4))) : "";
    }
    var animTimer = 0;
    function glidInn(steg) { // nytt kort sklir inn fra siden det kommer fra
      if (rolig) return;
      clearTimeout(animTimer);
      sett(steg * Math.min(90, kort.offsetWidth * 0.25), 0);
      void kort.offsetWidth;
      sett(0, 160);
    }
    function blaAnim(steg) { if (kø.length < 2) return; bla(steg); glidInn(steg); }
    bForr.addEventListener("click", function () { blaAnim(-1); });
    bNeste.addEventListener("click", function () { blaAnim(1); });

    /* Dra med fingeren: kortet følger, slipp langt nok ut for neste/forrige, ellers fjærer det tilbake.
       touch-action: pan-y på kortet lar siden scrolle loddrett som vanlig. */
    var dra = null, varDra = false;
    kort.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" || !e.isPrimary || kø.length < 2) return;
      dra = { x: e.clientX, y: e.clientY, dx: 0, låst: false, id: e.pointerId };
    });
    kort.addEventListener("pointermove", function (e) {
      if (!dra || e.pointerId !== dra.id) return;
      var dx = e.clientX - dra.x, dy = e.clientY - dra.y;
      if (!dra.låst) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { dra = null; return; } // loddrett: vanlig scroll
        if (Math.abs(dx) < 8) return;
        dra.låst = true;
        try { kort.setPointerCapture(e.pointerId); } catch (er) {}
      }
      dra.dx = dx;
      sett(dx, 0);
    });
    function slipp(e) {
      if (!dra || (e && e.pointerId !== dra.id)) return;
      var d = dra; dra = null;
      if (!d.låst) return;
      varDra = true; setTimeout(function () { varDra = false; }, 50);
      var w = kort.offsetWidth, steg = d.dx < 0 ? 1 : -1;
      if (Math.abs(d.dx) < Math.min(90, w * 0.22)) { sett(0, 180); return; } // ikke langt nok: tilbake
      if (rolig) { sett(0, 0); bla(steg); return; }
      sett(-steg * w * 1.1, 150);
      clearTimeout(animTimer);
      animTimer = setTimeout(function () {
        bla(steg);
        sett(steg * w * 0.6, 0);
        void kort.offsetWidth;
        sett(0, 170);
      }, 150);
    }
    kort.addEventListener("pointerup", slipp);
    kort.addEventListener("pointercancel", function (e) { if (dra && dra.låst) { dra = null; sett(0, 180); } else dra = null; });
    // Et drag skal ikke også trykke på knappen det startet på
    kort.addEventListener("click", function (e) { if (varDra) { e.stopPropagation(); e.preventDefault(); } }, true);

    bSnu.addEventListener("click", snu);
    bNy.addEventListener("click", nullstill);
    bKan.addEventListener("click", function () { svar(true); });
    bMer.addEventListener("click", function () { svar(false); });
    bReset.addEventListener("click", function () {
      var ok = true;
      try { ok = window.confirm("Nullstille kortstokken? Alle kortene kommer tilbake i bunken."); } catch (e) {}
      if (ok) nullstill();
    });

    /* ---------- Hurtigtaster ----------
       Virker for kortstokken som er synlig, uten at du må klikke i den først (så lenge fokus står på
       siden eller i kortstokken, ikke i et skjemafelt eller på en annen knapp/fane). */
    document.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      if (!root.offsetParent) return; // kortstokken vises ikke (annen fane)
      var t = e.target, tag = t && t.tagName;
      var iStokken = root.contains(t), påSiden = t === document.body || t === document.documentElement || !t;
      if (!iStokken && !påSiden) return;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "SUMMARY") return;
      var k = e.key, påKnapp = tag === "BUTTON";
      if ((k === " " || k === "Enter") && !snudd && cur) { if (påKnapp && t !== bSnu) return; e.preventDefault(); snu(); }
      else if (snudd && (k === "j" || k === "J" || k === "1")) { e.preventDefault(); svar(true); }
      else if (snudd && (k === "f" || k === "F" || k === "2")) { e.preventDefault(); svar(false); }
      else if (k === "ArrowRight") { e.preventDefault(); blaAnim(1); }
      else if (k === "ArrowLeft") { e.preventDefault(); blaAnim(-1); }
      else if ((k === "s" || k === "S") && !snudd && cur) { e.preventDefault(); snu(); }
    });

    start();
    return { reset: nullstill };
  };
})();
