/* ============================================================
   IN2090 guide · stepplayer.js  (kopiert fra IN2010-guiden 2026-11-25)
   Generisk steg-spiller: Forrige / Spill / Neste / Nullstill,
   piltaster, autospill, presets + egen input, steg-teller,
   nivåstyrt forklaringsboks, synkronisert pseudokode. Klassisk script.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var el = IN.el, clear = IN.clear;

  /* opts:
     { generate(input)->steps, presets:{navn:input}, render(step,ctx),
       pseudo: handle, legend:[{cls,label}], speed, parseInput, inputLabel,
       inputAria (standard «Egen input»), customInput:false (skjul «Eget:»-feltet),
       countControl:{min,max,unit} (unit standard «elementer») } */
  IN.stepPlayer = function (host, opts) {
    if (typeof host === "string") host = IN.qs(host);
    opts = opts || {};
    var speed = opts.speed || 900;
    var parseInput = opts.parseInput || function (s) {
      return s.split(",").map(function (x) { return parseInt(x.trim(), 10); })
              .filter(function (x) { return !isNaN(x); }).slice(0, 10);
    };

    var wrap = el("div", { class: "stepplayer" });

    // Presets + egen input
    var presetRow = null;
    if (opts.presets) {
      presetRow = el("div", { class: "sp-presets" });
      presetRow.appendChild(el("span", { class: "lbl", text: "Eksempler:" }));
      Object.keys(opts.presets).forEach(function (navn) {
        presetRow.appendChild(el("button", {
          class: "btn sm", type: "button", text: navn,
          onclick: function () { setInput(opts.presets[navn]); }
        }));
      });
      wrap.appendChild(presetRow);
      // Egen linje: egen input (felt + Bruk samlet) og antall − / +
      var toolRow = el("div", { class: "sp-presets sp-tools" });
      if (opts.customInput !== false) {
        var fld = el("input", { type: "text", placeholder: opts.inputLabel || "f.eks. 5,1,4,2,8", "aria-label": opts.inputAria || "Egen input" });
        var go = el("button", { class: "btn sm", type: "button", text: "Bruk",
          onclick: function () { var v = parseInput(fld.value); if (v.length) setInput(v); } });
        fld.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go.click(); } });
        toolRow.appendChild(el("span", { class: "sp-custom" }, [el("span", { class: "lbl", text: "Eget:" }), fld, go]));
      }
      // Flere / færre elementer (med fornuftige grenser)
      if (opts.countControl) {
        var cmin = opts.countControl.min || 3, cmax = opts.countControl.max || 9, cunit = opts.countControl.unit || "elementer";
        var cval = el("span", { class: "cval", "aria-live": "polite" });
        var bMinus = el("button", { class: "btn sm", type: "button", title: "Færre " + cunit, "aria-label": "Færre " + cunit, text: "−",
          onclick: function () { if (input && input.length > cmin) { input = input.slice(0, -1); regen(); countUpdate(); } } });
        var bPlus = el("button", { class: "btn sm", type: "button", title: "Flere " + cunit, "aria-label": "Flere " + cunit, text: "+",
          onclick: function () { if (input && input.length < cmax) { input = input.concat([1 + Math.floor(Math.random() * 9)]); regen(); countUpdate(); } } });
        countUpdate = function () {
          var n = input ? input.length : 0;
          cval.textContent = n + " " + cunit;
          bMinus.disabled = n <= cmin; bPlus.disabled = n >= cmax;
        };
        toolRow.appendChild(el("span", { class: "sp-count" }, [
          el("span", { class: "lbl", text: "Antall:" }), bMinus, cval, bPlus
        ]));
      }
      if (toolRow.childNodes.length) wrap.appendChild(toolRow);
    }

    var stage = el("div", { class: "sp-stage", tabindex: "0", role: "group", "aria-label": "Visualisering" });
    // Rammen rundt scenen har en diskret bunnlinje: hurtigtaster til venstre, «Steg x av y» til høyre.
    var counter = el("span", { class: "sp-counter", "aria-live": "polite" });
    var hint = el("span", { class: "sp-hint",
      html: (window.matchMedia && matchMedia("(hover: none)").matches)
        ? "Trykk «Neste» og «Forrige» for å gå steg for steg."
        : "Hold musa over demoen: <span class=\"kbd\">←</span> <span class=\"kbd\">→</span> for steg · <span class=\"kbd\">mellomrom</span> spill/pause" });
    wrap.appendChild(el("div", { class: "sp-frame" }, [stage, el("div", { class: "sp-foot" }, [hint, counter])]));
    // Mobil: aktiv kodelinje rett under scenen (vises bare under 620 px, se styles.css)
    var pcLine = el("div", { class: "sp-pcline", hidden: "", "aria-hidden": "true" });
    wrap.appendChild(pcLine);

    // Kontroller
    var bPrev = el("button", { class: "btn sm", type: "button", html: "← Forrige", onclick: function () { step(-1); } });
    var bPlay = el("button", { class: "btn primary sm", type: "button", text: "▶ Spill av", onclick: togglePlay });
    var bNext = el("button", { class: "btn sm", type: "button", html: "Neste →", onclick: function () { step(1); } });
    var bReset = el("button", { class: "btn sm", type: "button", text: "↺ Nullstill", onclick: function () { goto(0); } });
    var scope = IN.levelScope({ initial: opts.initial_level || null });
    wrap.appendChild(el("div", { class: "sp-controls" }, [bPrev, bPlay, bNext, bReset, scope.el]));

    var explain = el("div", { class: "sp-explain" });
    wrap.appendChild(explain);

    if (opts.legend) {
      var lg = el("div", { class: "legend" });
      opts.legend.forEach(function (it) {
        var word = legendWord(it), lab = String(it.label || "");
        var txt = el("span");
        var vm = word && /^([^\s:]{1,6}): (.+)$/.exec(lab);   // «k: minste så langt» → «Kandidat (k): minste så langt»
        if (vm) {
          txt.appendChild(el("span", { class: "lw", text: word + " (" + vm[1] + "): " }));
          txt.appendChild(document.createTextNode(vm[2]));
        } else if (word) {
          txt.appendChild(el("span", { class: "lw", text: word + ": " }));
          txt.appendChild(document.createTextNode(lowerFirst(dropWord(lab, word))));
        } else txt.textContent = fixedFirst(it, lab);
        lg.appendChild(el("span", { class: "item" }, [
          it.cls === "tried" ? el("span", { class: "sw sw-tried" })
                             : el("span", { class: "sw", style: "background:" + (it.color || cssVar(it.cls)) }),
          txt
        ]));
      });
      wrap.appendChild(lg);
    }

    clear(host); host.appendChild(wrap);

    /* Faste ord i fargeforklaringen (samme ord for samme farge, se ordboken i ui-revisjon-farger.md 3.2):
       Nå (compare) · Ferdig (sorted) · Funnet (target, bare når det er et funn) · Ny (min) · Bytt / Feil (swap).
       Ordet settes bare der det stemmer; ellers står forklaringen som før. it.word overstyrer (false = ingen). */
    function legendWord(it) {
      if (it.word === false) return null;
      if (typeof it.word === "string") return it.word;
      var l = String(it.label || ""), w = null;
      if (it.color) return null;
      if (it.cls === "compare") w = "Nå";
      else if (it.cls === "sorted") w = /i bruk|kanten finnes|kan nås/i.test(l) ? null : "Ferdig";
      else if (it.cls === "target") w = /svar/i.test(l) ? null : /funnet|duplikat|etterfølger/i.test(l) ? "Funnet" : null;
      else if (it.cls === "min") w = /^(ny|satt inn|skrevet|legges inn)/i.test(l) ? "Ny" : /så langt/i.test(l) ? "Kandidat" : null;
      else if (it.cls === "swap") w = /bytt/i.test(l) ? "Bytt" : /frigjort|fjern|roter|merke/i.test(l) ? null : "Feil";
      if (!w) return null;
      // Står ordet allerede først, trengs det ikke to ganger.
      if (l.toLowerCase().indexOf(w.toLowerCase()) === 0) return null;
      return w;
    }
    // Begynner forklaringen allerede med det faste ordet («byttet», «ferdig på plass»), får den stor forbokstav.
    function fixedFirst(it, lab) {
      var w = { compare: "nå", sorted: "ferdig", target: "funnet", min: "ny", swap: "bytt" }[it.cls];
      return w && !it.color && lab.toLowerCase().indexOf(w) === 0 ? lab.charAt(0).toUpperCase() + lab.slice(1) : lab;
    }
    // Ordet står nå først, så det tas bort lenger ut: «Besøkt / ferdig» → «besøkt», «sammenlignes nå» → «sammenlignes».
    function dropWord(lab, w) {
      var out = lab.replace(new RegExp("\\s*/\\s*" + w + "(?![a-zæøå])", "i"), "")
                   .replace(new RegExp("\\s+" + w + "(?![a-zæøå])(?=\\s*(\\(|$))", "i"), "");
      return out || lab;
    }
    function lowerFirst(s) {
      // «Gjeldende node» → «gjeldende node», men ikke «LCA», «A1[i]» eller «Free(D)».
      return /^[A-ZÆØÅ]([a-zæøå]|\s[a-zæøå])/.test(s) && !/^[A-ZÆØÅ][a-zæøå]*\(/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
    }

    /* Hendelsen i steget (F4): s.kind, ellers utledet fra søylemerkene eller stikkordet.
       Gir en prikk foran stikkordet og en strek på aktiv kodelinje i samme farge. Uten treff: ingen. */
    var KIND_RX = [
      ["swap", /^(bytt(et)?( array)?$|bytte trengs|pivot plassert|høyrerotasjon|venstrerotasjon|ubalanse|ikke funnet|diamant|sykel!|feil\b|for skjev)/i],
      ["target", /^(funnet|treff|par!|lca =|fant s)/i],
      ["min", /^(ny node|satt inn|ny minste|nytt minste|mindre funnet|antatt minste|minste = |bedre vei)/i],
      ["sorted", /^(ferdig|på plass|allerede på plass|står riktig|i orden|løkka ferdig|runde ferdig|rehash ferdig|sortert|delsortert)/i],
      ["compare", /^(sammenlign|sjekk\b|midten)/i]
    ];
    function kindOf(s) {
      if (s.kind) return s.kind;
      var m = s.marks;
      if (m && m.swap != null && !(Array.isArray(m.swap) && !m.swap.length)) return "swap";
      var t = String(s.tag || "");
      for (var i = 0; i < KIND_RX.length; i++) if (KIND_RX[i][1].test(t)) return KIND_RX[i][0];
      return null;
    }
    var evRows = [];
    function markRows(kind) {
      evRows.forEach(function (r) { r.className = r.className.replace(/\s?ev-[a-z]+/g, ""); });
      evRows = (IN.pseudo && IN.pseudo._hl) ? IN.pseudo._hl.slice() : [];
      if (kind) evRows.forEach(function (r) { r.classList.add("ev-" + kind); });
      // Mobil (F11): aktiv kodelinje som én linje under scenen
      var r = evRows[0];
      if (r) {
        var ln = r.querySelector(".ln"), code = r.querySelector(".pc-txt") || r.querySelector(".code");
        pcLine.innerHTML = "";
        pcLine.appendChild(el("span", { class: "ln", text: "Linje " + (ln ? ln.textContent : "") + " ·" }));
        pcLine.appendChild(el("span", { class: "code", html: code ? code.innerHTML : "" }));
        pcLine.className = "sp-pcline" + (kind ? " ev-" + kind : "");
        pcLine.hidden = false;
      } else pcLine.hidden = true;
    }

    function cssVar(cls) {
      var map = { compare: "--c-compare", min: "--c-min", swap: "--c-swap", sorted: "--c-sorted", target: "--c-target", "default": "--c-default" };
      return "var(" + (map[cls] || "--c-default") + ")";
    }

    var steps = [], idx = 0, timer = null, input = null;
    // (countUpdate er satt over når countControl finnes – ikke overskriv den)
    var countUpdate = countUpdate || function () {};

    function setInput(inp) { input = inp.slice(); regen(); countUpdate(); }
    function regen() {
      steps = opts.generate(input) || [];
      goto(0);
    }
    function goto(i) {
      stopPlay();
      idx = Math.max(0, Math.min(steps.length - 1, i));
      renderStep();
    }
    function step(d) { stopPlay(); if (idx + d >= 0 && idx + d < steps.length) { idx += d; renderStep(); } }

    function renderStep() {
      var s = steps[idx] || {};
      opts.render(s, { stage: stage, level: scope.get(), index: idx, total: steps.length });
      if (IN.pseudo) IN.pseudo._hl = [];
      if (opts.pseudo && s.line != null) opts.pseudo.highlight(s.line);
      else if (opts.pseudo) opts.pseudo.clear();
      var kind = kindOf(s);
      markRows(kind);
      paintExplain(s, kind);
      counter.textContent = "Steg " + (idx + 1) + " av " + steps.length;
      // Flytt fokus før knappen blir deaktivert, så tastaturbrukere ikke havner øverst på siden
      var atStart = idx === 0, atEnd = idx >= steps.length - 1;
      if (atEnd && document.activeElement === bNext) bPrev.focus();
      if (atStart && document.activeElement === bPrev && !atEnd) bNext.focus();
      bPrev.disabled = atStart;
      bNext.disabled = atEnd;
    }
    function paintExplain(s, kind) {
      clear(explain);
      var txt = IN.level.pick(s.text, scope.get());
      if (kind === undefined) kind = kindOf(s);
      if (s.tag) {
        var tl = el("span", { class: "tagline" });
        if (kind) tl.appendChild(el("span", { class: "vl-dot is-" + kind, "aria-hidden": "true" }));
        tl.appendChild(document.createTextNode(s.tag));
        explain.appendChild(tl);
      }
      explain.appendChild(el("span", { html: txt || "" }));
      if (IN.symbolTips) IN.symbolTips(explain);
    }

    function togglePlay() {
      if (timer) stopPlay();
      else {
        if (idx >= steps.length - 1) goto(0);
        timer = setInterval(function () {
          if (idx >= steps.length - 1) { stopPlay(); return; }
          idx++; renderStep();
        }, speed);
        bPlay.textContent = "❚❚ Pause";
        bPlay.classList.remove("primary");
      }
    }
    function stopPlay() {
      if (timer) { clearInterval(timer); timer = null; }
      bPlay.textContent = "▶ Spill av";
      bPlay.classList.add("primary");
    }

    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
    });

    // Snarveier (piltaster / mellomrom): virker når pekeren er over demoen,
    // slik at vi ikke stjeler sidens egen scrolling når demoen bare ligger synlig lenger nede.
    // (Tastaturbrukere: fokusér scenen – egen handler over gjelder da.)
    var hovering = false;
    wrap.addEventListener("mouseenter", function () { hovering = true; });
    wrap.addEventListener("mouseleave", function () { hovering = false; });
    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented) return;
      if (!hovering) return;                            // bare når musa er over demoen
      if (wrap.offsetParent === null) return;           // demoen ligger i en skjult fane
      if (!steps.length) return;
      var ae = document.activeElement, tag = ae && ae.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (ae && ae.isContentEditable)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === " " && tag !== "BUTTON" && tag !== "A") { e.preventDefault(); togglePlay(); }
    });

    // Nivåbytte (lokalt eller fra toppen): tegn forklaring + visualisering på nytt
    scope.onChange(function () { if (steps.length) renderStep(); });

    // Når fanen vises første gang (fra core.js tabs-event): sørg for layout
    var shown = false;
    // Hendelsen sendes på fane-panelet (som ligger utenfor host), så vi lytter der.
    var panelEl = (host.closest && host.closest("[data-panel]")) || host;
    panelEl.addEventListener("in:shown", function () { if (!shown && steps.length) { shown = true; renderStep(); } });

    // Init
    if (opts.initial) setInput(opts.initial);
    else if (opts.presets) setInput(opts.presets[Object.keys(opts.presets)[0]]);

    return {
      goto: goto, next: function () { step(1); }, prev: function () { step(-1); },
      setInput: setInput, get steps() { return steps; }, get index() { return idx; }
    };
  };
})();
