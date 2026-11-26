/* ============================================================
   IN2090 guide · viz-relation.js
   Relasjoner som tabeller, databaseskjema og stegvise SQL-demoer.

   IN.vizTable(host, t, opts) → element
     t: { navn?, kolonner: ["fid", …] | [{ navn, pk?, fk? }], rader: [[…], …],
          marks?: { rader: { <indeks>: "hit"|"keep"|"drop"|"new"|"grp1".."grp4" },
                    kolonner: { <navn>: "sel"|"drop"|"new" }, celler: { "<rad>,<kol>": "hit" } },
          caption?: html, tom?: "tekst når tabellen er tom" }
     NULL vises som «NULL» i kursiv (verdien null i data).
     Kolonner med bare TRUE/FALSE/NULL får .rel-tv og merkelapper (.rel-tvc-TRUE …), uten overstreking.

   IN.vizLegend(host, keys?, opts?) → fargeforklaring for keep/drop/new/hit/grp/tv.

   IN.schema(host, skjema, opts) → element. skjema som i plan/format.md § 3.
     opts.pin (standard true): knapp «Fest skjemaet» som holder det synlig i et sidepanel.

   IN.sqlSteps(host, demo) → stepPlayer med SQL til venstre og tabellen(e) til høyre.
     demo: { sql: "…" | algo, tabeller?: [t, …] (inndata, vises over), steg: [{ line? (1 = første SQL-linje), tekst: html | {eli5,normal,teknisk},
             tabell?: t, tabeller?: [t, …] }], presets?: false }
     Alle mellomresultater er forhåndsberegnet i data (ingen SQL-motor).
   Klassisk script. Lastes etter core.js, sql-lang.js og stepplayer.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var el = IN.el, clear = IN.clear;

  function colName(c) { return typeof c === "string" ? c : c.navn; }
  function cellText(v) { return v === null || v === undefined ? null : String(v); }
  function tvText(v) { return v === true || v === "TRUE" ? "TRUE" : v === false || v === "FALSE" ? "FALSE" : v == null ? "NULL" : null; }
  /* Sannhetsverdi-kolonne: alle verdier er TRUE/FALSE/NULL og minst én er TRUE eller FALSE.
     Slike celler får .rel-tv og en liten merkelapp, og strekes aldri over (de forklarer hvorfor raden faller ut). */
  function tvCols(t) {
    var out = {}, rows = t.rader || [];
    if (!rows.length) return out;
    (t.kolonner || []).forEach(function (_, j) {
      var ok = true, any = false;
      rows.forEach(function (r) { var x = tvText(r[j]); if (x === null) ok = false; else if (x !== "NULL") any = true; });
      if (ok && any) out[j] = true;
    });
    return out;
  }

  IN.vizTable = function (host, t, opts) {
    if (typeof host === "string") host = IN.qs(host);
    opts = opts || {};
    var marks = t.marks || {}, rm = marks.rader || {}, cm = marks.kolonner || {}, cellm = marks.celler || {};
    var pk = t.pk || [];
    var wrap = el("figure", { class: "rel" + (opts.compact ? " rel-compact" : "") });
    if (t.navn) wrap.appendChild(el("figcaption", { class: "rel-name", html: t.navn + (t.rader ? ' <span class="rel-count">' + t.rader.length + (t.rader.length === 1 ? " rad" : " rader") + "</span>" : "") }));
    var scroll = el("div", { class: "rel-scroll" });
    var table = el("table", { class: "rel-tab" });
    var thead = el("thead"), hr = el("tr");
    (t.kolonner || []).forEach(function (c) {
      var n = colName(c), isPk = (typeof c === "object" && c.pk) || pk.indexOf(n) >= 0;
      var th = el("th", { scope: "col", class: (isPk ? "pk " : "") + (cm[n] ? "c-" + cm[n] : "") });
      th.appendChild(el("span", { text: n }));
      if (typeof c === "object" && c.fk) th.appendChild(el("span", { class: "rel-fk", title: "fremmednøkkel til " + c.fk, text: "→" + c.fk }));
      hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);
    var tb = el("tbody");
    var names = (t.kolonner || []).map(colName);
    var tv = tvCols(t);
    if (Object.keys(tv).length) IN.qsa("th", hr).forEach(function (th, j) { if (tv[j]) th.classList.add("rel-tv"); });   // tv er et objekt, ikke en array
    (t.rader || []).forEach(function (r, i) {
      var tr = el("tr", { class: rm[i] ? "r-" + rm[i] : null });
      r.forEach(function (v, j) {
        var txt = cellText(v), cls = [];
        if (cm[names[j]]) cls.push("c-" + cm[names[j]]);
        if (cellm[i + "," + j] || cellm[i + "," + names[j]]) cls.push("x-" + (cellm[i + "," + j] || cellm[i + "," + names[j]]));
        if (tv[j]) cls.push("rel-tv");
        var td = el("td", { class: cls.join(" ") || null });
        if (tv[j]) { var tvv = tvText(v); td.appendChild(el("span", { class: "rel-tvc rel-tvc-" + tvv, text: tvv })); }
        else if (txt === null) td.appendChild(el("span", { class: "rel-null", text: "NULL" }));
        else td.textContent = txt;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    if (!(t.rader || []).length) {
      var tr0 = el("tr", { class: "rel-empty" });
      tr0.appendChild(el("td", { colspan: String(Math.max(1, names.length)), text: t.tom || "(ingen rader)" }));
      tb.appendChild(tr0);
    }
    table.appendChild(tb);
    scroll.appendChild(table);
    wrap.appendChild(scroll);
    if (t.caption) wrap.appendChild(el("div", { class: "rel-cap small", html: t.caption }));
    host.appendChild(wrap);
    return wrap;
  };

  /* ---------- Fargeforklaring for radmerkene ----------
     IN.vizLegend(host, keys?, opts?) → element. keys: ["keep","drop","new","hit","grp","tv"] (standard: alle).
     opts.labels: { keep: "…" } for egne tekster. Bruker de samme klassene som tabellene. */
  var LEG_STD = { keep: "beholdes", drop: "fjernes", "new": "ny rad", hit: "raden det gjelder", grp: "én farge per gruppe", tv: "sannhetsverdi" };
  IN.vizLegend = function (host, keys, opts) {
    if (typeof host === "string") host = IN.qs(host);
    opts = opts || {};
    keys = keys || ["keep", "drop", "new", "hit", "grp", "tv"];
    var lab = opts.labels || {};
    var box = el("div", { class: "legend rel-legend", "aria-label": "Fargeforklaring" });
    keys.forEach(function (k) {
      var txt = lab[k] || LEG_STD[k];
      if (!txt) return;
      if (k === "tv") box.appendChild(el("span", { class: "item", html: '<span class="rel-tvc rel-tvc-TRUE">TRUE</span><span class="rel-tvc rel-tvc-FALSE">FALSE</span><span class="rel-tvc rel-tvc-NULL">NULL</span> ' + txt }));
      else box.appendChild(el("span", { class: "item" }, [el("span", { class: "sw rel-sw " + (k === "grp" ? "rel-sw-grp" : "r-" + k), "aria-hidden": "true" }), el("span", { text: txt })]));
    });
    if (host) host.appendChild(box);
    return box;
  };
  function marksIn(steps) {
    var seen = {};
    (steps || []).forEach(function (s) {
      (s.tabeller || (s.tabell ? [s.tabell] : [])).forEach(function (t) {
        var rm = (t && t.marks && t.marks.rader) || {};
        Object.keys(rm).forEach(function (k) { seen[/^grp/.test(rm[k]) ? "grp" : rm[k]] = 1; });
        if (t && Object.keys(tvCols(t)).length) seen.tv = 1;
      });
    });
    return ["keep", "drop", "new", "hit", "grp", "tv"].filter(function (k) { return seen[k]; });
  }

  /* ---------- Skjema ---------- */
  function schemaBody(skjema) {
    var box = el("div", { class: "schema-body" });
    if (skjema.intro) box.appendChild(el("div", { class: "schema-intro small", html: skjema.intro }));
    var list = el("div", { class: "schema-list" });
    (skjema.tabeller || []).forEach(function (t) {
      var row = el("div", { class: "schema-tab" });
      var line = el("div", { class: "schema-line mono" });
      line.appendChild(el("b", { class: "schema-tn", text: t.navn }));
      line.appendChild(document.createTextNode("("));
      (t.kolonner || []).forEach(function (c, i) {
        if (i) line.appendChild(document.createTextNode(", "));
        var span = el("span", { class: "schema-col" + (c.pk ? " pk" : "") + (c.fk ? " fk" : ""),
          title: [c.type, c.pk ? "primærnøkkel" : null, c.fk ? "fremmednøkkel → " + c.fk : null, c.notNull ? "NOT NULL" : null].filter(Boolean).join(" · ") || null,
          text: c.navn });
        line.appendChild(span);
      });
      line.appendChild(document.createTextNode(")"));
      row.appendChild(line);
      var fks = (t.kolonner || []).filter(function (c) { return c.fk; });
      if (fks.length) row.appendChild(el("div", { class: "schema-fks small", html: fks.map(function (c) { return '<span class="mono">' + t.navn + "(" + c.navn + ")</span> → <span class=\"mono\">" + c.fk + "</span>"; }).join(" · ") }));
      if (t.unike && t.unike.length) row.appendChild(el("div", { class: "schema-fks small", html: "UNIQUE: " + t.unike.map(function (u) { return '<span class="mono">(' + u.join(", ") + ")</span>"; }).join(" · ") }));
      if (t.beskrivelse) row.appendChild(el("div", { class: "schema-desc small", html: t.beskrivelse }));
      if (t.eksempel) IN.vizTable(row, { kolonner: t.eksempel.kolonner, rader: t.eksempel.rader }, { compact: true });
      list.appendChild(row);
    });
    box.appendChild(list);
    box.appendChild(el("p", { class: "schema-legend small muted", html: '<span class="schema-col pk">understreket</span> = primærnøkkel · <span class="schema-col fk">kursiv</span> = fremmednøkkel. Hold over et navn for typen.' }));
    if (skjema.merknad) box.appendChild(el("p", { class: "schema-merknad small", html: "<b>Merk:</b> " + skjema.merknad }));
    return box;
  }

  var pinned = null;
  function pinPanel() {
    var p = IN.qs("#schema-pin");
    if (!p) {
      p = el("aside", { id: "schema-pin", class: "schema-pin", "aria-label": "Festet databaseskjema", hidden: true });
      document.body.appendChild(p);
    }
    return p;
  }
  function unpin() {
    var p = pinPanel(); p.hidden = true; clear(p); pinned = null;
    document.body.classList.remove("has-schema-pin");
    IN.qsa(".schema-pinbtn").forEach(function (b) { b.setAttribute("aria-pressed", "false"); b.textContent = "📌 Fest skjemaet"; });
  }
  function pin(skjema, btn) {
    unpin();
    var p = pinPanel();
    var head = el("div", { class: "schema-pin-head" }, [
      el("b", { text: skjema.tittel || "Databaseskjema" }),
      el("button", { class: "btn sm", type: "button", text: "×", "aria-label": "Lukk det festede skjemaet", onclick: unpin })
    ]);
    p.appendChild(head);
    p.appendChild(schemaBody(skjema));
    p.hidden = false; pinned = skjema;
    document.body.classList.add("has-schema-pin");
    if (btn) { btn.setAttribute("aria-pressed", "true"); btn.textContent = "📌 Festet"; }
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pinned) unpin(); });

  IN.schema = function (host, skjema, opts) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host || !skjema) return null;
    opts = opts || {};
    var det = el("details", { class: "schema card" });
    if (opts.open !== false) det.setAttribute("open", "");
    var sum = el("summary", { class: "schema-sum" }, [el("span", { class: "schema-ic", "aria-hidden": "true", text: "▦" }), el("b", { text: skjema.tittel || "Databaseskjema" })]);
    if (opts.year) sum.appendChild(el("span", { class: "tag", text: opts.year }));
    det.appendChild(sum);
    if (opts.pin !== false) {
      var btn = el("button", { class: "btn sm schema-pinbtn", type: "button", "aria-pressed": "false", text: "📌 Fest skjemaet",
        onclick: function () { if (pinned === skjema) unpin(); else pin(skjema, btn); } });
      det.appendChild(el("div", { class: "schema-tools" }, [btn, el("span", { class: "muted small", text: "Holder skjemaet synlig mens du leser oppgavene, slik vedlegget ligger ved siden av arket." })]));
    }
    det.appendChild(schemaBody(skjema));
    host.appendChild(det);
    return det;
  };

  /* ---------- Stegvis SQL ---------- */
  IN.sqlSteps = function (host, demo) {
    if (typeof host === "string") host = IN.qs(host);
    var wrap = el("div", { class: "grid cols-2 sqlsteps" });
    var left = el("div"), right = el("div");
    wrap.appendChild(left); wrap.appendChild(right);
    host.appendChild(wrap);
    if (demo.tabeller && demo.tabeller.length) {
      var inn = el("details", { class: "sqlsteps-in" }, [el("summary", { html: "<b>Tabellene</b> (" + demo.tabeller.map(function (t) { return t.navn; }).join(", ") + ")" })]);
      if (demo.visInndata !== false) inn.setAttribute("open", "");
      var row = el("div", { class: "rel-row" });
      demo.tabeller.forEach(function (t) { IN.vizTable(row, t, { compact: true }); });
      inn.appendChild(row);
      host.insertBefore(inn, wrap);
    }
    var code = typeof demo.sql === "string" ? IN.sql.algo(demo.sql) : demo.sql;
    var handle = IN.sql.render(left, code, { tooltips: false });
    var steps = demo.steg;
    var player = IN.stepPlayer(right, {
      generate: function () { return steps; },
      initial: [0],
      customInput: false,
      pseudo: handle,
      render: function (s, ctx) {
        var stage = ctx.stage; clear(stage);
        var txt = typeof s.tekst === "string" ? s.tekst : IN.level.pick(s.tekst, ctx.level);
        if (txt) stage.appendChild(el("div", { class: "sqlsteps-txt", html: txt }));
        var ts = s.tabeller || (s.tabell ? [s.tabell] : []);
        var row = el("div", { class: "rel-row" });
        ts.forEach(function (t) { IN.vizTable(row, t); });
        stage.appendChild(row);
      }
    });
    // Hurtigfiks (vurdering-sql-visning trinn 1–2): kontrollene over scenen så de ikke hopper,
    // ingen autospill, og fargeforklaring for merkene demoen bruker.
    var sp = right.querySelector(".stepplayer");
    if (sp) {
      sp.classList.add("sqlsteps-sp");
      var ctr = sp.querySelector(".sp-controls"), frame = sp.querySelector(".sp-frame");
      if (ctr && frame) sp.insertBefore(ctr, frame);
      var keys = marksIn(steps);
      if (keys.length) IN.vizLegend(sp, keys, { labels: { drop: "fjernes", "new": "ny rad (fylt ut med NULL)" } });
    }
    return player;
  };
})();
