/* ============================================================
   IN2090 guide · sql-bygger.js
   SQL-spørringsbyggeren: et lite spill som driller rekkefølgen på klausulene og de vanlige feilene.
     IN.sqlBygger(host, opts) → { el, start(nivå), meny(), destroy() }

   Fire nivåer (oppgavene ligger i data-sql-bygger.js, IN.dataSqlBygger):
     1 Skriverekkefølge   sett klausulordene i den rekkefølgen de skrives
     2 Bygg spørringen    sett sammen brikker til en spørring som løser oppgaven; lokkebrikker skal velges bort
     3 Logisk rekkefølge  sett klausulene i den rekkefølgen databasen evaluerer dem
     4 Finn feilen        trykk på linja som er gal, og velg hvorfor

   Samspill som i dra.js: «trykk og trykk» er hovedmåten (trykk på en brikke under, så havner den nederst i
   spørringen; trykk på en linje for å velge den, så på en annen linje for å flytte den dit). Dra med
   Pointer Events kommer i tillegg (grepet ☰ har touch-action: none). Tastatur: Enter/Mellomrom legger til
   og løfter, ↑/↓ flytter, Mellomrom slipper, Esc angrer, Delete tar ut, Alt+↑/↓ flytter direkte.
   Alt meldes i en aria-live-region.

   Retting: en oppbygning er riktig når den passer med fasiten eller et av alternativene i godta
   (grupper i fasiten kan stå i valgfri rekkefølge, f.eks. AND-ledd og LIMIT/OFFSET). På nivå 2 kjøres
   en oppbygning uten lokkebrikker i IN.sqlMotor hvis den finnes: gir den samme resultat som fasiten,
   godtas den, så riktig PostgreSQL aldri underkjennes.

   Poeng, rekke og tid kan slås av (in2090:bygger:innst). Beste runde per nivå lagres i
   in2090:bygger:beste:<nivå>. Fremdrift: IN.progress.solved("bygger", "nivaa-<n>" | "blandet", riktige, antall).
   Ved feil vises «Hvorfor?» hvis IN.sqlPanser finnes: IN.sqlPanser(host, { sql, fasit, db, melding, oppgave }).

   opts: { data?: (standard IN.dataSqlBygger), nivaer?: [1,2,…], blokk?: 4|5, oppgaver?: [id,…],
           runde?: 8, blandet?: true (vis «Blandet runde»), start?: nivå (hopp rett inn), tittel?: false }
   Klassisk script. Lastes etter core.js (og gjerne sql-lang.js, viz-relation.js, data-sql.js, sql-motor.js).
   Ingen DOM ved lasting, så rettelogikken kan testes i node (IN.sqlBygger.logic).
   ============================================================ */
(function () {
  "use strict";
  var W = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
  var IN = (W.IN = W.IN || {});
  var PREF = "in2090:bygger:";
  var uidN = 0;

  /* ---------------- Rene hjelpere (testbare uten DOM) ---------------- */
  var SKRIV = { WITH: 0, SELECT: 1, FROM: 2, JOIN: 3, WHERE: 4, "GROUP BY": 5, HAVING: 6, "ORDER BY": 8, LIMIT: 9, OFFSET: 9 };
  var LOGISK = { WITH: 0, FROM: 1, JOIN: 2, WHERE: 3, "GROUP BY": 4, HAVING: 5, SELECT: 6, "ORDER BY": 7, LIMIT: 8, OFFSET: 8 };
  var PREFIKS = [["WITH", "WITH"], ["SELECT", "SELECT"], ["FROM", "FROM"], ["NATURAL JOIN", "JOIN"], ["INNER JOIN", "JOIN"],
    ["LEFT OUTER JOIN", "JOIN"], ["LEFT JOIN", "JOIN"], ["RIGHT JOIN", "JOIN"], ["FULL JOIN", "JOIN"], ["CROSS JOIN", "JOIN"],
    ["JOIN", "JOIN"], ["WHERE", "WHERE"], ["GROUP BY", "GROUP BY"], ["HAVING", "HAVING"], ["ORDER BY", "ORDER BY"],
    ["LIMIT", "LIMIT"], ["OFFSET", "OFFSET"], ["UNION", "SETOP"], ["INTERSECT", "SETOP"], ["EXCEPT", "SETOP"]];

  // Hvorfor-tekster ved feil rekkefølge. Nøkkel "A|B": A står foran B, men skal komme etter.
  var SKRIV_PAR = {
    "HAVING|GROUP BY": "HAVING filtrerer gruppene som GROUP BY lager.",
    "GROUP BY|WHERE": "Radene filtreres med WHERE før de grupperes.",
    "HAVING|WHERE": "WHERE filtrerer rader, HAVING filtrerer grupper senere.",
    "LIMIT|ORDER BY": "Først sorteres svaret, så kuttes det.",
    "OFFSET|ORDER BY": "Først sorteres svaret, så hoppes det over rader.",
    "FROM|SELECT": "En spørring skrives SELECT … FROM …: først hva du vil se, så hvor det kommer fra.",
    "SELECT|WITH": "WITH står helt først, foran hovedspørringen som bruker den.",
    "FROM|WITH": "WITH står helt først, foran hovedspørringen som bruker den.",
    "JOIN|FROM": "JOIN hører til FROM og skrives rett etter tabellen den kobler til.",
    "WHERE|JOIN": "Join-ene er en del av FROM. WHERE kommer etter hele FROM-delen.",
    "WHERE|FROM": "WHERE filtrerer radene fra FROM og skrives etter den."
  };
  var SKRIV_A = {
    "ORDER BY": "ORDER BY står nesten sist: den sorterer det ferdige svaret.",
    LIMIT: "LIMIT står helt til slutt.", OFFSET: "OFFSET står helt til slutt, sammen med LIMIT."
  };
  var SKRIV_ALLE = "Skriverekkefølgen er WITH, SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.";
  var LOGISK_A = {
    SELECT: "SELECT regnes ut sent, etter at radene er filtrert og gruppert. Derfor kan ikke WHERE bruke et alias fra SELECT.",
    HAVING: "HAVING filtrerer grupper, så gruppene må finnes først.",
    "GROUP BY": "GROUP BY grupperer radene som er igjen etter WHERE.",
    WHERE: "WHERE filtrerer radene som FROM har bygget, én rad om gangen.",
    JOIN: "JOIN er en del av FROM: tabellen bygges før noe annet.",
    FROM: "FROM kan bruke WITH-tabellene, så de regnes ut først.",
    "ORDER BY": "ORDER BY sorterer det ferdige svaret. Derfor kan den bruke aliasene fra SELECT.",
    LIMIT: "LIMIT kutter helt til slutt, etter sorteringen.", OFFSET: "OFFSET hopper over rader helt til slutt, etter sorteringen."
  };

  function plain(s) {
    return String(s == null ? "" : s).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function klausulAv(t) {
    var s = plain(t).toUpperCase();
    for (var i = 0; i < PREFIKS.length; i++) {
      var p = PREFIKS[i][0];
      if (s === p || s.indexOf(p + " ") === 0) return PREFIKS[i][1];
    }
    return null;
  }
  function klNavn(kl) { return kl === "SETOP" ? "mengdeoperator" : kl; }

  /* Normaliser en oppgave fra data. */
  function normalize(o) {
    var niva = +o.niva || 1;
    var src = niva === 4 ? (o.linjer || []) : (o.brikker || []);
    var brikker = src.map(function (b) {
      var c = { id: String(b.id), t: String(b.t), k: String(b.k || b.id), pre: b.pre || null, lokke: b.lokke || null, mangler: b.mangler || null };
      c.kl = b.kl || c.pre || klausulAv(b.t);
      return c;
    });
    var byId = {};
    brikker.forEach(function (c) { byId[c.id] = c; });
    var fasiter = o.fasit ? [o.fasit].concat(o.godta || []) : [];
    return {
      id: String(o.id), niva: niva, blokk: o.blokk || null, tema: o.tema || "", tekst: o.tekst || "", brikker: brikker, byId: byId,
      fasiter: fasiter, hint: o.hint || "", etter: o.etter || "", sql: o.sql || null, resultat: o.resultat || null,
      feil: (o.feil || []).map(String), grunner: o.grunner || [], riktig: o.riktig == null ? 0 : +o.riktig, rettet: o.rettet || null,
      forklaring: o.forklaring || "", setop: brikker.some(function (c) { return c.kl === "SETOP"; }), raw: o
    };
  }
  function flat(F) { var out = []; F.forEach(function (e) { if (Array.isArray(e)) out.push.apply(out, e.map(String)); else out.push(String(e)); }); return out; }
  function sameMulti(a, b) {
    if (a.length !== b.length) return false;
    var x = a.slice().sort(), y = b.slice().sort();
    for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }
  function minus(a, b) {             // multimengde a − b
    var rest = b.slice(), out = [];
    a.forEach(function (k) { var i = rest.indexOf(k); if (i >= 0) rest.splice(i, 1); else out.push(k); });
    return out;
  }
  /* Passer nøkkelsekvensen med fasiten? Et element i F er en nøkkel eller en liste av nøkler i valgfri rekkefølge. */
  function matchF(F, keys) {
    var p = 0;
    for (var i = 0; i < F.length; i++) {
      var e = F[i];
      if (Array.isArray(e)) {
        var seg = keys.slice(p, p + e.length);
        if (seg.length < e.length || !sameMulti(seg, e.map(String))) return false;
        p += e.length;
      } else {
        if (keys[p] !== String(e)) return false;
        p++;
      }
    }
    return p === keys.length;
  }
  /* Første plass der sekvensen avviker fra fasiten (for et generelt hint). */
  function forsteAvvik(F, keys) {
    var p = 0;
    for (var i = 0; i < F.length; i++) {
      var e = F[i];
      if (Array.isArray(e)) {
        var rest = e.map(String);
        for (var j = 0; j < e.length; j++, p++) { var ix = rest.indexOf(keys[p]); if (ix < 0) return p; rest.splice(ix, 1); }
      } else { if (keys[p] !== String(e)) return p; p++; }
    }
    return p < keys.length ? p : -1;
  }
  function keysOf(nt, ids) { return ids.map(function (id) { return nt.byId[id] ? nt.byId[id].k : "?"; }); }

  /* Teksten på en brikke der den står i spørringen: betingelser får WHERE/HAVING eller AND foran. */
  function visTekst(nt, ids, i) {
    var c = nt.byId[ids[i]];
    if (!c) return "";
    if (!c.pre) return c.t;
    var forrige = i > 0 ? nt.byId[ids[i - 1]] : null;
    return (forrige && forrige.pre === c.pre ? "AND " : c.pre + " ") + c.t;
  }
  function erInnrykk(nt, ids, i) {
    var c = nt.byId[ids[i]];
    if (!c) return false;
    if (c.kl === "JOIN" && nt.niva !== 1) return true;
    if (c.pre && i > 0 && nt.byId[ids[i - 1]] && nt.byId[ids[i - 1]].pre === c.pre) return true;
    return false;
  }
  function sqlAv(nt, ids) {
    return ids.map(function (id, i) { return (erInnrykk(nt, ids, i) ? "  " : "") + visTekst(nt, ids, i); }).join("\n") + ";";
  }
  /* Fasit-SQL i skriverekkefølge (nivå 2 lages fra fasiten, nivå 3/4 står i data). */
  function fasitSql(nt) {
    if (nt.niva === 4) return nt.rettet;
    if (nt.sql) return nt.sql;
    if (nt.niva === 2 && nt.fasiter.length) return sqlAv(nt, idsFraNokler(nt, flat(nt.fasiter[0])));
    return null;
  }
  function idsFraNokler(nt, keys) {
    var brukt = {};
    return keys.map(function (k) {
      for (var i = 0; i < nt.brikker.length; i++) {
        var c = nt.brikker[i];
        if (c.k === k && !brukt[c.id]) { brukt[c.id] = 1; return c.id; }
      }
      return null;
    }).filter(Boolean);
  }

  function rekkefolgeMelding(nt, ids, F) {
    var keys = keysOf(nt, ids), logisk = nt.niva === 3, tab = logisk ? LOGISK : SKRIV;
    if (!nt.setop) {
      for (var i = 0; i < ids.length; i++) {
        var a = nt.byId[ids[i]].kl, ra = tab[a];
        if (ra == null) continue;
        for (var j = i + 1; j < ids.length; j++) {
          var b = nt.byId[ids[j]].kl, rb = tab[b];
          if (rb != null && ra > rb) {
            if (logisk) return klNavn(a) + " evalueres etter " + klNavn(b) + ". " + (LOGISK_A[a] || "");
            return klNavn(a) + " må komme etter " + klNavn(b) + ". " + (SKRIV_PAR[a + "|" + b] || SKRIV_A[a] || SKRIV_ALLE);
          }
        }
      }
    }
    var p = forsteAvvik(F, keys);
    return "Rekkefølgen stemmer ikke helt" + (p >= 0 ? ": sjekk linje " + (p + 1) : "") + "." + (nt.hint ? " " + nt.hint : "");
  }

  /* Rett en oppbygning (nivå 1–3). → { ok, type, melding, id?, fasitIx? }
     type: riktig | tom | lokke | rekkefolge | mangler | ekstra */
  function grade(nt, ids) {
    if (!ids || !ids.length) return { ok: false, type: "tom", melding: "Legg brikker i spørringen først." };
    var keys = keysOf(nt, ids), i;
    for (i = 0; i < ids.length; i++) {
      var c = nt.byId[ids[i]];
      if (c && c.lokke) return { ok: false, type: "lokke", id: c.id, linje: i + 1, melding: c.lokke };
    }
    for (i = 0; i < nt.fasiter.length; i++) if (matchF(nt.fasiter[i], keys)) return { ok: true, type: "riktig", fasitIx: i };
    for (i = 0; i < nt.fasiter.length; i++) {
      if (sameMulti(flat(nt.fasiter[i]), keys)) return { ok: false, type: "rekkefolge", fasitIx: i, melding: rekkefolgeMelding(nt, ids, nt.fasiter[i]) };
    }
    // Nærmeste fasit: færrest brikker for mye eller for lite
    var best = -1, bestD = 1e9, mangl = null, ekstra = null;
    nt.fasiter.forEach(function (F, fi) {
      var f = flat(F), m = minus(f, keys), x = minus(keys, f), d = m.length + x.length;
      if (d < bestD) { bestD = d; best = fi; mangl = m; ekstra = x; }
    });
    if (best < 0) return { ok: false, type: "ekstra", melding: "Denne oppgaven mangler fasit." };
    if (ekstra.length) {
      var eid = ids[keys.indexOf(ekstra[0])], ec = nt.byId[eid];
      return { ok: false, type: "ekstra", id: eid, fasitIx: best, linje: ids.indexOf(eid) + 1,
        melding: "Linje " + (ids.indexOf(eid) + 1) + " («" + plain(ec.pre ? ec.pre + " " + ec.t : ec.t) + "») hører ikke med i denne spørringen." };
    }
    var mc = nt.brikker.filter(function (c) { return c.k === mangl[0]; })[0];
    var hvilken = mc ? (mc.pre ? "en " + klNavn(mc.pre) + "-betingelse" : mc.kl ? "en " + klNavn(mc.kl) + "-del" : "en brikke") : "en brikke";
    return { ok: false, type: "mangler", fasitIx: best,
      melding: "Det mangler " + (mangl.length > 1 ? mangl.length + " brikker, blant annet " : "") + hvilken + "." + (mc && mc.mangler ? " " + mc.mangler : "") };
  }
  /* Nivå 4: valgt linje og valgt grunn (indeks i nt.grunner). */
  function gradeFeil(nt, linjeId, grunnIx) {
    var linjeOk = nt.feil.indexOf(String(linjeId)) >= 0, grunnOk = +grunnIx === nt.riktig;
    return { ok: linjeOk && grunnOk, linjeOk: linjeOk, grunnOk: grunnOk };
  }
  function shuffle(a, rnd) {
    rnd = rnd || Math.random;
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  /* Startrekkefølgen i brikkebunken: stokket, og aldri slik at trykk i bunkens rekkefølge gir fasiten. */
  function bunke(nt, rnd) {
    var ids = shuffle(nt.brikker.map(function (c) { return c.id; }), rnd);
    for (var n = 0; n < ids.length; n++) {
      var keys = keysOf(nt, ids.filter(function (id) { return !nt.byId[id].lokke; }));
      var hit = nt.fasiter.some(function (F) { return matchF(F, keys); });
      if (!hit || ids.length < 2) break;
      ids.push(ids.shift());
    }
    return ids;
  }
  function moveTo(arr, id, idx) {
    var a = arr.filter(function (x) { return x !== id; });
    idx = Math.max(0, Math.min(a.length, idx));
    a.splice(idx, 0, id);
    return a;
  }
  function tid(ms) {
    var s = Math.max(0, Math.round(ms / 1000)), m = Math.floor(s / 60);
    return m + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }
  function bedre(ny, gml) {
    if (!gml || !gml.max) return true;
    var a = ny.score / ny.max, b = gml.score / gml.max;
    if (a !== b) return a > b;
    if (ny.tid != null && gml.tid != null) return ny.tid < gml.tid;
    return ny.tid != null && gml.tid == null;
  }

  /* ---------------- Motor (valgfri) ---------------- */
  var dbCache = null;
  function motorDb() {
    if (dbCache) return dbCache;
    if (!IN.sqlMotor || !IN.sqlMotor.lagDb || !IN.dataSql || !IN.dataSql.skjema) return null;
    try { dbCache = IN.sqlMotor.lagDb(IN.dataSql.skjema, null, null); } catch (e) { dbCache = null; }
    return dbCache;
  }
  function kjor(sql) {
    var db = motorDb();
    if (!db || !sql) return null;
    try { return IN.sqlMotor.run(sql, db, {}); } catch (e) { return null; }
  }
  /* Gir sql samme resultat som fasiten? (null = kan ikke avgjøres) */
  function sammeSomFasit(nt, sql) {
    var f = kjor(fasitSql(nt)), s = kjor(sql);
    if (!f || !s || f.feil) return null;
    if (s.feil) return { ok: false, feil: s.feil };
    // Ber oppgaven om en rekkefølge, må svaret ha ORDER BY (en tilfeldig riktig rekkefølge er ikke nok)
    if (f.ordnet && !s.ordnet) return { ok: false, grunn: "mangler ORDER BY" };
    try { var r = IN.sqlMotor.sammenlign(f, s); return { ok: !!r.ok, r: r }; } catch (e) { return null; }
  }

  /* ---------------- Komponenten ---------------- */
  IN.sqlBygger = function (host, opts) {
    if (typeof host === "string") host = IN.qs ? IN.qs(host) : document.querySelector(host);
    opts = opts || {};
    var data = opts.data || IN.dataSqlBygger;
    if (!host || !data || !data.oppg) return null;
    if (host._sbOff) host._sbOff();
    while (host.firstChild) host.removeChild(host.firstChild);
    var el = IN.el, uid = "sb" + (++uidN);

    var alle = data.oppg.map(normalize).filter(function (t) {
      if (opts.nivaer && opts.nivaer.indexOf(t.niva) < 0) return false;
      if (opts.blokk && t.blokk && t.blokk !== opts.blokk) return false;
      if (opts.oppgaver && opts.oppgaver.indexOf(t.id) < 0) return false;
      return true;
    });
    var nivaer = (data.nivaer || []).filter(function (n) { return alle.some(function (t) { return t.niva === n.n; }); });
    var rundeN = opts.runde || 8;

    function lesJson(k, d) { try { var v = JSON.parse(IN.store.get(PREF + k, "null")); return v == null ? d : v; } catch (e) { return d; } }
    function skrivJson(k, v) { IN.store.set(PREF + k, JSON.stringify(v)); }
    var innst = lesJson("innst", {});
    if (typeof innst !== "object" || !innst) innst = {};
    if (innst.poeng == null) innst.poeng = true;
    if (innst.tid == null) innst.tid = false;

    var wrap = el("div", { class: "sb" });
    var live = el("span", { class: "qz-live", "aria-live": "polite" });
    function say(t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); }
    var view = el("div", { class: "sb-view" });
    wrap.appendChild(view); wrap.appendChild(live);
    host.appendChild(wrap);

    var R = null;          // runden
    var T = null;          // oppgaven: { nt, build, bunke, sel, kb, done, res, forsok, valgtLinje, grunnRek, vist }
    var timer = null, drag = null, suppressClick = false, raf = null;

    /* ---------- Meny ---------- */
    function beste(key) { var b = lesJson("beste:" + key, null); return b && b.max ? b : null; }
    function besteTekst(b) { return b ? "Beste: " + b.score + "/" + b.max + (b.tid != null ? " · " + tid(b.tid) : "") : "Ikke spilt ennå"; }
    function mkSwitch(label, on, fn) {
      var b = el("button", { class: "qz-switch", type: "button", role: "switch", "aria-checked": on ? "true" : "false" }, [
        el("span", { class: "qz-track", "aria-hidden": "true" }, el("span", { class: "qz-thumb" })), el("span", { text: label })]);
      b.addEventListener("click", function () { var v = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", v ? "true" : "false"); fn(v); });
      return b;
    }
    function visMeny() {
      stopTimer(); R = null; T = null;
      clearView();
      var m = el("div", { class: "sb-meny" });
      if (opts.tittel !== false) m.appendChild(el("p", { class: "sb-intro", html: data.intro || "Velg et nivå. En runde er noen få korte oppgaver." }));
      var list = el("div", { class: "sb-nivaer" });
      nivaer.forEach(function (n) {
        var ant = alle.filter(function (t) { return t.niva === n.n; }).length;
        var b = el("button", { class: "sb-niva", type: "button", "data-niva": String(n.n) }, [
          el("span", { class: "sb-niva-n", "aria-hidden": "true", text: String(n.n) }),
          el("span", { class: "sb-niva-txt" }, [el("b", { text: n.navn }), el("span", { class: "sb-niva-kort", text: n.kort }),
            el("span", { class: "sb-niva-best", text: Math.min(ant, rundeN) + " oppgaver · " + besteTekst(beste("nivaa-" + n.n)) })])]);
        b.addEventListener("click", function () { start(n.n); });
        list.appendChild(b);
      });
      if (opts.blandet !== false && nivaer.length > 1) {
        var bb = el("button", { class: "sb-niva sb-niva-mix", type: "button", "data-niva": "blandet" }, [
          el("span", { class: "sb-niva-n", "aria-hidden": "true", text: "∗" }),
          el("span", { class: "sb-niva-txt" }, [el("b", { text: "Blandet runde" }), el("span", { class: "sb-niva-kort", text: "Litt fra hvert nivå, fra lett til vanskelig." }),
            el("span", { class: "sb-niva-best", text: besteTekst(beste("blandet")) })])]);
        bb.addEventListener("click", function () { start("blandet"); });
        list.appendChild(bb);
      }
      m.appendChild(list);
      var inn = el("div", { class: "sb-innst" }, [
        mkSwitch("Poeng og rekke", innst.poeng, function (v) { innst.poeng = v; skrivJson("innst", innst); }),
        mkSwitch("Tidtaking", innst.tid, function (v) { innst.tid = v; skrivJson("innst", innst); })]);
      m.appendChild(inn);
      view.appendChild(m);
    }

    /* ---------- Runde ---------- */
    function velgOppgaver(niva) {
      if (niva === "blandet") {
        var plan = { 1: 2, 2: 3, 3: 2, 4: 3 }, ut = [];
        nivaer.forEach(function (n) {
          var p = shuffle(alle.filter(function (t) { return t.niva === n.n; }).slice());
          ut = ut.concat(p.slice(0, plan[n.n] || 2));
        });
        return ut;
      }
      var pool = shuffle(alle.filter(function (t) { return t.niva === niva; }).slice());
      return pool.slice(0, rundeN).sort(function (a, b) { return (a.raw.vansk || 0) - (b.raw.vansk || 0); });
    }
    function start(niva) {
      var liste = velgOppgaver(niva);
      if (!liste.length) return;
      R = { niva: niva, key: niva === "blandet" ? "blandet" : "nivaa-" + niva, liste: liste, i: 0, poeng: 0, rekke: 0, besteRekke: 0,
        utfall: [], t0: Date.now(), poengPa: innst.poeng, tidPa: innst.tid };
      if (R.tidPa) startTimer();
      nyOppgave();
      fokus(".sb-tekst", true);
    }
    function nyOppgave() {
      var nt = R.liste[R.i];
      T = { nt: nt, build: [], bunke: nt.niva === 4 ? [] : bunke(nt), sel: null, kb: null, done: false, res: null, forsok: 0,
        valgtLinje: null, grunnRek: nt.niva === 4 ? shuffle(nt.grunner.map(function (_, i) { return i; })) : null, valgtGrunn: null, vist: false, panser: false };
      tegn();
    }
    function startTimer() { stopTimer(); timer = setInterval(function () { var s = view.querySelector(".sb-tid"); if (s && R) s.textContent = tid(Date.now() - R.t0); }, 1000); }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function clearView() { endDrag(); while (view.firstChild) view.removeChild(view.firstChild); }

    function nivaNavn(n) { var x = (data.nivaer || []).filter(function (v) { return v.n === n; })[0]; return x ? x.navn : "Nivå " + n; }

    /* ---------- Tegning av en oppgave ---------- */
    var refs = {};
    function tegn(fokusInfo) {
      if (!R || !T) return;
      var nt = T.nt;
      clearView();
      refs = { chips: {} };
      var top = el("div", { class: "sb-top" });
      var tilbake = el("button", { class: "btn sm ghost sb-back", type: "button", text: "← Nivåer" });
      tilbake.addEventListener("click", function () { visMeny(); fokus(".sb-niva", false); });
      top.appendChild(tilbake);
      top.appendChild(el("span", { class: "sb-title", text: (R.niva === "blandet" ? "Blandet · " : "") + "Nivå " + nt.niva + " · " + nivaNavn(nt.niva) }));
      var stats = el("span", { class: "sb-stats" });
      if (R.poengPa) {
        stats.appendChild(el("span", { class: "sb-st", title: "Riktig på første forsøk", text: "✓ " + R.poeng }));
        stats.appendChild(el("span", { class: "sb-st", title: "Rekke", text: "Rekke " + R.rekke }));
      }
      if (R.tidPa) stats.appendChild(el("span", { class: "sb-st sb-tid", title: "Tid", text: tid(Date.now() - R.t0) }));
      top.appendChild(stats);
      view.appendChild(top);

      var prog = el("div", { class: "sb-prog" });
      var dots = el("span", { class: "sb-dots", "aria-hidden": "true" });
      R.liste.forEach(function (_, i) {
        var u = R.utfall[i];
        dots.appendChild(el("span", { class: "sb-dot" + (i === R.i ? " cur" : "") + (u === true ? " ok" : u === false ? " no" : "") }));
      });
      prog.appendChild(dots);
      prog.appendChild(el("span", { class: "sb-progtxt", text: "Oppgave " + (R.i + 1) + " av " + R.liste.length }));
      view.appendChild(prog);

      var oppg = el("div", { class: "sb-task" });
      oppg.appendChild(el("p", { class: "sb-tekst", tabindex: "-1", html: nt.tekst }));
      if (nt.niva === 4) tegnFeil(oppg); else tegnBygg(oppg);
      view.appendChild(oppg);
      if (fokusInfo) gjenopprettFokus(fokusInfo);
    }

    function tok(s) { return IN.sql && IN.sql.tokenize ? IN.sql.tokenize(s) : esc(s); }
    function chipLabel(c, txt, iBunke) {
      var lbl = el("span", { class: "sb-lbl mono" });
      if (c.pre && iBunke) {
        lbl.appendChild(el("span", { class: "sb-pre", text: c.pre + " / AND" }));
        lbl.appendChild(el("span", { html: tok(c.t) }));
      } else lbl.innerHTML = tok(txt);
      return lbl;
    }

    function tegnBygg(oppg) {
      var nt = T.nt;
      var hintId = uid + "-hint";
      var bygg = el("ol", { class: "sb-build" + (T.build.length ? "" : " is-empty"), "aria-label": nt.niva === 3 ? "Rekkefølgen din" : "Spørringen din", "data-sone": "build" });
      T.build.forEach(function (id, i) {
        var c = nt.byId[id], txt = visTekst(nt, T.build, i);
        var st = T.done && T.res ? (T.res.ok ? " correct" : (T.res.id === id ? " wrong" : "")) : (T.res && !T.res.ok && T.res.id === id ? " wrong" : "");
        var b = el("button", { class: "sb-chip" + (T.sel === id ? " sel" : "") + (T.kb && T.sel === id ? " is-lifted" : "") + st + (erInnrykk(nt, T.build, i) ? " sb-ind" : ""),
          type: "button", "aria-pressed": T.sel === id ? "true" : "false", "aria-describedby": hintId, "data-id": id, "data-sone": "build",
          "aria-label": "Linje " + (i + 1) + " av " + T.build.length + ": " + plain(txt) }, [
          el("span", { class: "sb-grip", "aria-hidden": "true", text: "☰" }),
          el("span", { class: "sb-num", "aria-hidden": "true", text: String(i + 1) }),
          chipLabel(c, txt, false)]);
        b.disabled = T.done;
        koble(b, id, "build");
        refs.chips[id] = b;
        bygg.appendChild(el("li", { class: "sb-row" }, b));
      });
      if (!T.build.length) bygg.appendChild(el("li", { class: "sb-empty", text: nt.niva === 1 ? "Trykk på klausulene under i den rekkefølgen de skrives." : nt.niva === 3 ? "Trykk på klausulene under i den rekkefølgen de evalueres." : "Trykk på brikkene under for å bygge spørringen." }));
      refs.build = bygg;

      var rest = T.bunke.filter(function (id) { return T.build.indexOf(id) < 0; });
      var bunkeEl = el("div", { class: "sb-pool", role: "group", "aria-label": "Brikker som ikke er brukt", "data-sone": "pool" });
      rest.forEach(function (id) {
        var c = nt.byId[id];
        var b = el("button", { class: "sb-chip sb-pchip", type: "button", "aria-describedby": hintId, "data-id": id, "data-sone": "pool",
          "aria-label": plain((c.pre ? c.pre + " eller AND " : "") + c.t) + (T.sel ? ". Settes inn foran valgt linje." : ". Legges til nederst.") }, [
          el("span", { class: "sb-grip", "aria-hidden": "true", text: "☰" }), chipLabel(c, c.t, true)]);
        b.disabled = T.done;
        koble(b, id, "pool");
        refs.chips[id] = b;
        bunkeEl.appendChild(b);
      });
      if (!rest.length) bunkeEl.appendChild(el("span", { class: "sb-pool-empty", text: "Alle brikkene er brukt." }));
      bunkeEl.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest(".sb-chip")) return;
        if (T.sel && !T.done) taUt(T.sel);
      });
      refs.pool = bunkeEl;

      oppg.appendChild(bygg);
      var poolWrap = el("div", { class: "sb-poolwrap" + (T.done ? " is-done" : "") }, [
        el("p", { class: "sb-lbl-h", text: nt.niva === 2 ? "Brikker (ikke alle hører med)" : "Brikker" }), bunkeEl]);
      oppg.appendChild(poolWrap);
      oppg.appendChild(el("p", { class: "sb-hint", id: hintId, text: "Trykk på en brikke for å legge den nederst. Trykk på en linje for å velge den, og så på en annen linje for å flytte den dit, eller dra i ☰. Tastatur: Enter løfter, ↑/↓ flytter, Enter slipper, Esc angrer, Delete tar ut." }));

      var act = el("div", { class: "sb-actions" });
      if (!T.done) {
        var bSjekk = el("button", { class: "btn primary sb-sjekk", type: "button", text: T.forsok ? "Sjekk igjen" : "Sjekk" });
        bSjekk.addEventListener("click", sjekk);
        bSjekk.disabled = !T.build.length;
        act.appendChild(bSjekk);
        var bUt = el("button", { class: "btn sb-taut", type: "button", text: "Ta ut" });
        bUt.disabled = !T.sel;
        bUt.addEventListener("click", function () { if (T.sel) taUt(T.sel); });
        act.appendChild(bUt);
        var bTom = el("button", { class: "btn ghost", type: "button", text: "Tøm" });
        bTom.disabled = !T.build.length;
        bTom.addEventListener("click", function () { T.build = []; T.sel = null; T.kb = null; T.res = null; tegn({ sel: ".sb-pchip" }); say("Spørringen er tømt."); });
        act.appendChild(bTom);
        if (T.forsok) {
          var bFasit = el("button", { class: "btn ghost", type: "button", text: "Vis fasit" });
          bFasit.addEventListener("click", visFasit);
          act.appendChild(bFasit);
        }
      } else act.appendChild(nesteKnapp());
      oppg.appendChild(act);
      tegnTilbakemelding(oppg);
    }

    function nesteKnapp() {
      var siste = R.i >= R.liste.length - 1;
      var b = el("button", { class: "btn primary sb-neste", type: "button", text: siste ? "Se resultatet" : "Neste →" });
      b.addEventListener("click", function () { if (siste) slutt(); else { R.i++; nyOppgave(); fokus(".sb-tekst", true); } });
      return b;
    }

    function tegnTilbakemelding(oppg) {
      var nt = T.nt;
      if (!T.res && !T.vist) return;
      var fb = el("div", { class: "sb-fb " + (T.res && T.res.ok ? "is-ok" : T.vist && !T.res ? "is-info" : "is-no"), role: "status" });
      if (T.res) {
        var tekst = T.res.ok ? (T.res.annen ? "Riktig, med en annen oppbygning enn fasiten. Resultatet er det samme." : T.forsok > 1 ? "Riktig nå." : "Riktig.") : T.res.melding;
        fb.appendChild(el("p", { class: "sb-fb-main" }, [el("b", { "aria-hidden": "true", text: T.res.ok ? "✓ " : "✗ " }), el("span", { html: esc(tekst) })]));
      }
      if (T.vist && (!T.res || !T.res.ok)) fb.appendChild(el("p", { class: "sb-fb-sub", text: "Fasiten står under." }));
      if (T.res && !T.res.ok && !T.done) {
        var omv = el("p", { class: "sb-fb-sub", text: "Rett opp og trykk «Sjekk igjen», eller se fasiten. Oppgaven teller ikke som riktig på første forsøk." });
        fb.appendChild(omv);
      }
      if (T.res && !T.res.ok && typeof IN.sqlPanser === "function" && nt.niva !== 1) {
        var pBtn = el("button", { class: "btn sm ghost sb-hvorfor", type: "button", "aria-expanded": T.panser ? "true" : "false", text: "Hvorfor?" });
        var panel = el("div", { class: "sb-panser", hidden: !T.panser });
        pBtn.addEventListener("click", function () {
          T.panser = !T.panser; pBtn.setAttribute("aria-expanded", T.panser ? "true" : "false"); panel.hidden = !T.panser;
          if (T.panser && !panel.firstChild) apnePanser(panel);
        });
        fb.appendChild(pBtn); fb.appendChild(panel);
        if (T.panser) apnePanser(panel);
      }
      oppg.appendChild(fb);
      if (T.done || T.vist) tegnFasit(oppg);
    }
    function apnePanser(panel) {
      var nt = T.nt;
      var sql = nt.niva === 4 ? nt.brikker.map(function (c) { return c.t; }).join("\n") + ";" : sqlAv(nt, T.build);
      try { IN.sqlPanser(panel, { sql: sql, fasit: fasitSql(nt), db: motorDb(), melding: T.res ? T.res.melding : "", oppgave: nt.id, kilde: "sql-bygger" }); }
      catch (e) { if (W.console) console.error("[sql-bygger] sqlPanser", e); }
    }

    function tegnFasit(oppg) {
      var nt = T.nt, box = el("div", { class: "sb-res" });
      if (nt.niva === 1) {
        var F = nt.fasiter[0];
        box.appendChild(el("p", { class: "sb-res-h", text: "Skriverekkefølgen" }));
        box.appendChild(el("p", { class: "sb-orden mono", text: flat(F).map(function (k) { var c = nt.brikker.filter(function (b) { return b.k === k; })[0]; return c ? plain(c.t) : k; }).join(" → ") }));
      } else if (nt.niva === 3) {
        var ids = idsFraNokler(nt, flat(nt.fasiter[0]));
        var to = el("div", { class: "sb-to" });
        var sk = el("ol", { class: "sb-to-col" }), lo = el("ol", { class: "sb-to-col" });
        (nt.raw.skriv || nt.brikker.map(function (c) { return c.id; })).forEach(function (id) { var c = nt.byId[id]; if (c) sk.appendChild(el("li", { html: tok(c.t) })); });
        ids.forEach(function (id) { lo.appendChild(el("li", { html: tok(nt.byId[id].t) })); });
        to.appendChild(el("div", {}, [el("p", { class: "sb-res-h", text: "Slik skrives den" }), sk]));
        to.appendChild(el("div", {}, [el("p", { class: "sb-res-h", text: "Slik evalueres den" }), lo]));
        box.appendChild(to);
      } else if (nt.niva === 2) {
        box.appendChild(el("p", { class: "sb-res-h", text: T.res && T.res.ok ? "Spørringen" : "Fasit" }));
        box.appendChild(kode(T.res && T.res.ok ? sqlAv(nt, T.build) : fasitSql(nt)));
        if (nt.fasiter.length > 1) box.appendChild(el("p", { class: "sb-note", text: "Det finnes mer enn én riktig løsning her. Alle variantene med samme resultat godtas." }));
      }
      if (nt.etter) box.appendChild(el("div", { class: "sb-etter", html: nt.etter }));
      if (nt.niva !== 1) visResultat(box, T.res && T.res.ok && nt.niva === 2 ? sqlAv(nt, T.build) : fasitSql(nt));
      oppg.appendChild(box);
    }
    function kode(sql) {
      var pre = el("pre", { class: "sb-code" });
      pre.innerHTML = String(sql || "").split("\n").map(tok).join("\n");
      return pre;
    }
    function visResultat(box, sql) {
      var nt = T.nt, r = kjor(sql), kilde = "Kjørt på bibliotekdatabasen";
      var tab = null;
      if (r && !r.feil) tab = { kolonner: r.kolonner, rader: r.rader };
      else if (nt.resultat) { tab = { kolonner: nt.resultat.kolonner, rader: nt.resultat.rader }; kilde = "Resultat på bibliotekdatabasen"; }
      if (!tab) return;
      tab.navn = "Resultat";
      var holder = el("div", { class: "sb-tab" });
      if (IN.vizTable) IN.vizTable(holder, tab, { compact: true });
      else {
        var t = el("table", { class: "rel-tab" }), hr = el("tr");
        tab.kolonner.forEach(function (k) { hr.appendChild(el("th", { text: typeof k === "string" ? k : k.navn })); });
        t.appendChild(el("thead", {}, hr));
        var tb = el("tbody");
        tab.rader.forEach(function (rad) { var tr = el("tr"); rad.forEach(function (v) { tr.appendChild(el("td", { text: v == null ? "NULL" : String(v) })); }); tb.appendChild(tr); });
        t.appendChild(tb); holder.appendChild(t);
      }
      box.appendChild(holder);
      box.appendChild(el("p", { class: "sb-note", text: kilde + "." }));
    }

    /* ---------- Nivå 4: finn feilen ---------- */
    function tegnFeil(oppg) {
      var nt = T.nt;
      var ol = el("ol", { class: "sb-lines", "aria-label": "Spørringen. Trykk på linja som er gal." });
      nt.brikker.forEach(function (c, i) {
        var cls = "sb-line" + (T.valgtLinje === c.id ? " sel" : "");
        if (T.done) {
          if (nt.feil.indexOf(c.id) >= 0) cls += " is-feil";
          else if (T.valgtLinje === c.id) cls += " wrong";
        }
        var b = el("button", { class: cls, type: "button", "aria-pressed": T.valgtLinje === c.id ? "true" : "false", "data-id": c.id,
          "aria-label": "Linje " + (i + 1) + ": " + plain(c.t) + (T.done && nt.feil.indexOf(c.id) >= 0 ? ". Gal linje." : "") }, [
          el("span", { class: "sb-num", "aria-hidden": "true", text: String(i + 1) }),
          el("span", { class: "sb-lbl mono", html: tok(c.t) })]);
        b.disabled = T.done;
        b.addEventListener("click", function () {
          if (T.done) return;
          T.valgtLinje = T.valgtLinje === c.id ? null : c.id;
          tegn({ sel: '.sb-line[data-id="' + c.id + '"]' });
          say(T.valgtLinje ? "Linje " + (i + 1) + " valgt. Velg hvorfor den er gal." : "Valget er angret.");
        });
        ol.appendChild(el("li", {}, b));
      });
      oppg.appendChild(ol);
      if (T.valgtLinje || T.done) {
        var linjeNr = nt.brikker.map(function (c) { return c.id; }).indexOf(T.valgtLinje) + 1;
        var gr = el("div", { class: "sb-grunner", role: "group", "aria-label": "Hvorfor er linja gal?" });
        gr.appendChild(el("p", { class: "sb-lbl-h", text: T.done ? "Grunnen" : "Hvorfor er linje " + linjeNr + " gal?" }));
        T.grunnRek.forEach(function (gi) {
          var cls = "sb-grunn";
          if (T.done) { if (gi === nt.riktig) cls += " correct"; else if (gi === T.valgtGrunn) cls += " wrong"; }
          var b = el("button", { class: cls, type: "button", "data-g": String(gi), "aria-pressed": T.valgtGrunn === gi ? "true" : "false" }, [
            el("span", { class: "sb-grunn-mark", "aria-hidden": "true", text: T.done ? (gi === nt.riktig ? "✓" : gi === T.valgtGrunn ? "✗" : "") : "" }),
            el("span", { html: nt.grunner[gi] })]);
          b.disabled = T.done;
          b.addEventListener("click", function () { velgGrunn(gi); });
          gr.appendChild(b);
        });
        oppg.appendChild(gr);
      } else oppg.appendChild(el("p", { class: "sb-hint", text: "Trykk på linja som er gal. Da kommer valgene for hvorfor." }));
      if (T.done) {
        var r = T.resF, fb = el("div", { class: "sb-fb " + (r.ok ? "is-ok" : "is-no"), role: "status" });
        var linjer = nt.feil.map(function (id) { return nt.brikker.map(function (c) { return c.id; }).indexOf(id) + 1; });
        var main = r.ok ? "Riktig." : !r.linjeOk ? "Feilen står på linje " + linjer.join(" eller ") + "." : "Riktig linje, men en annen grunn.";
        fb.appendChild(el("p", { class: "sb-fb-main" }, [el("b", { "aria-hidden": "true", text: r.ok ? "✓ " : "✗ " }), el("span", { text: main })]));
        fb.appendChild(el("p", { class: "sb-fb-sub", html: nt.grunner[nt.riktig] }));
        if (!r.ok && typeof IN.sqlPanser === "function") {
          var pBtn = el("button", { class: "btn sm ghost sb-hvorfor", type: "button", "aria-expanded": "false", text: "Hvorfor?" });
          var panel = el("div", { class: "sb-panser", hidden: true });
          pBtn.addEventListener("click", function () {
            var on = panel.hidden; panel.hidden = !on; pBtn.setAttribute("aria-expanded", on ? "true" : "false");
            if (on && !panel.firstChild) apnePanser(panel);
          });
          fb.appendChild(pBtn); fb.appendChild(panel);
        }
        oppg.appendChild(fb);
        var box = el("div", { class: "sb-res" });
        box.appendChild(el("p", { class: "sb-res-h", text: "Rettet spørring" }));
        box.appendChild(kode(nt.rettet));
        if (nt.forklaring) box.appendChild(el("div", { class: "sb-etter", html: nt.forklaring }));
        visResultat(box, nt.rettet);
        oppg.appendChild(box);
        oppg.appendChild(el("div", { class: "sb-actions" }, nesteKnapp()));
      }
    }
    function velgGrunn(gi) {
      if (T.done || !T.valgtLinje) return;
      T.valgtGrunn = gi;
      T.resF = gradeFeil(T.nt, T.valgtLinje, gi);
      T.done = true;
      registrer(T.resF.ok);
      tegn({ sel: ".sb-neste" });
      say(T.resF.ok ? "Riktig." : (T.resF.linjeOk ? "Riktig linje, men en annen grunn. " : "Feil linje. ") + plain(T.nt.grunner[T.nt.riktig]));
    }

    /* ---------- Handlinger (nivå 1–3) ---------- */
    function txtOf(id) { var c = T.nt.byId[id]; return plain(c.pre ? c.pre + " " + c.t : c.t); }
    function endret() { T.res = null; }
    function leggTil(id) {
      if (T.done) return;
      var at = T.sel && T.build.indexOf(T.sel) >= 0 ? T.build.indexOf(T.sel) : T.build.length;
      var rest = T.bunke.filter(function (x) { return T.build.indexOf(x) < 0; }), ri = rest.indexOf(id);
      T.build.splice(at, 0, id);
      T.sel = null; T.kb = null; endret();
      var rest2 = rest.filter(function (x) { return x !== id; });
      var neste = rest2[Math.min(ri, rest2.length - 1)];
      tegn({ sel: neste ? '.sb-pchip[data-id="' + neste + '"]' : ".sb-sjekk" });
      say(txtOf(id) + " lagt inn som linje " + (at + 1) + " av " + T.build.length + ".");
    }
    function taUt(id) {
      if (T.done) return;
      var i = T.build.indexOf(id);
      if (i < 0) return;
      T.build.splice(i, 1);
      T.sel = null; T.kb = null; endret();
      var nb = T.build[Math.min(i, T.build.length - 1)];
      tegn({ sel: nb ? '.sb-chip[data-sone="build"][data-id="' + nb + '"]' : '.sb-pchip[data-id="' + id + '"]' });
      say(txtOf(id) + " er tatt ut.");
    }
    function flytt(id, idx, behold) {
      if (T.done) return;
      T.build = moveTo(T.build, id, idx);
      if (!behold) { T.sel = null; T.kb = null; }
      endret();
      tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + id + '"]' });
      say(txtOf(id) + (behold ? ": linje " : " flyttet til linje ") + (T.build.indexOf(id) + 1) + " av " + T.build.length + ".");
    }
    function klikk(id, sone) {
      if (suppressClick) { suppressClick = false; return; }
      if (T.done) return;
      if (sone === "pool") { leggTil(id); return; }
      if (T.sel === id) { T.sel = null; T.kb = null; tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + id + '"]' }); say("Valget er angret."); return; }
      if (T.sel) { flytt(T.sel, T.build.indexOf(id)); return; }
      T.sel = id; T.kb = null;
      tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + id + '"]' });
      say(txtOf(id) + " valgt. Trykk på en annen linje for å flytte den dit, på en brikke for å sette den inn foran, eller på Ta ut.");
    }
    function erAkt(e) { return e.key === " " || e.key === "Spacebar" || e.key === "Enter"; }
    function tast(e, id, sone) {
      if (T.done) return;
      var k = e.key;
      if (sone === "pool") return;               // vanlig knapp: Enter/Mellomrom gir klikk
      var i = T.build.indexOf(id);
      if (e.altKey && (k === "ArrowUp" || k === "ArrowDown")) {
        e.preventDefault();
        var j = i + (k === "ArrowUp" ? -1 : 1);
        if (j < 0 || j >= T.build.length) { say(j < 0 ? "Allerede først." : "Allerede sist."); return; }
        flytt(id, j); return;
      }
      if (k === "Delete" || k === "Backspace") { e.preventDefault(); taUt(id); return; }
      if (k === "Escape" || k === "Esc") {
        if (!T.sel) return;
        e.preventDefault();
        if (T.kb && T.sel === id && i !== T.kb.from) { var fra = T.kb.from; T.sel = null; T.kb = null; T.build = moveTo(T.build, id, fra); tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + id + '"]' }); say("Angret. Tilbake på linje " + (fra + 1) + "."); return; }
        T.sel = null; T.kb = null; tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + id + '"]' }); say("Valget er angret."); return;
      }
      if (erAkt(e)) {
        e.preventDefault();
        if (T.sel === id && T.kb) { T.sel = null; T.kb = null; tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + id + '"]' }); say(txtOf(id) + " lagt på linje " + (i + 1) + "."); return; }
        if (T.sel && T.sel !== id) { flytt(T.sel, i); return; }
        if (T.sel === id) { T.sel = null; T.kb = null; tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + id + '"]' }); say("Valget er angret."); return; }
        T.sel = id; T.kb = { from: i };
        tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + id + '"]' });
        say(txtOf(id) + " løftet. Flytt med pil opp og ned, slipp med Enter, Esc angrer.");
        return;
      }
      if (T.sel === id && T.kb && (k === "ArrowUp" || k === "ArrowDown")) {
        e.preventDefault();
        var b2 = i + (k === "ArrowUp" ? -1 : 1);
        if (b2 < 0 || b2 >= T.build.length) { say(b2 < 0 ? "Allerede først." : "Allerede sist."); return; }
        flytt(id, b2, true);
      }
    }
    function koble(b, id, sone) {
      b.addEventListener("click", function () { klikk(id, sone); });
      b.addEventListener("keydown", function (e) { tast(e, id, sone); });
      if (sone === "build") b.addEventListener("keyup", function (e) { if (e.key === " " || e.key === "Spacebar") e.preventDefault(); });
      b.addEventListener("pointerdown", function (e) { pDown(e, id, sone, b); });
    }

    function sjekk() {
      if (T.done) return;
      var nt = T.nt, res = grade(nt, T.build);
      if (res.type === "tom") { T.res = res; tegn({ sel: ".sb-sjekk" }); say(res.melding); return; }
      if (!res.ok && nt.niva === 2 && res.type !== "lokke" && IN.sqlMotor) {
        var s = sammeSomFasit(nt, sqlAv(nt, T.build));
        if (s && s.ok) res = { ok: true, type: "riktig", annen: true };
      }
      T.forsok++;
      T.res = res;
      if (res.ok) { T.done = true; T.sel = null; T.kb = null; }
      if (T.forsok === 1) registrer(res.ok);
      tegn({ sel: res.ok ? ".sb-neste" : ".sb-fb" });
      say((res.ok ? "Riktig. " : "Ikke riktig. ") + (res.ok ? "" : plain(res.melding)));
    }
    function visFasit() {
      T.vist = true; T.done = true; T.sel = null; T.kb = null;
      tegn({ sel: ".sb-neste" });
      say("Fasiten vises.");
    }
    function registrer(ok) {
      if (R.utfall[R.i] != null) return;
      R.utfall[R.i] = ok;
      if (ok) { R.poeng++; R.rekke++; R.besteRekke = Math.max(R.besteRekke, R.rekke); }
      else R.rekke = 0;
    }

    /* ---------- Slutt på runden ---------- */
    function slutt() {
      stopTimer();
      var ms = Date.now() - R.t0, max = R.liste.length;
      var rec = { score: R.poeng, max: max, tid: R.tidPa ? ms : null, t: Date.now() };
      var gml = beste(R.key), ny = bedre(rec, gml);
      if (ny) skrivJson("beste:" + R.key, rec);
      if (IN.progress && IN.progress.solved) IN.progress.solved("bygger", R.key, R.poeng, max);
      clearView();
      var s = el("div", { class: "sb-slutt" });
      s.appendChild(el("h4", { class: "sb-slutt-h", tabindex: "-1", text: "Runden er ferdig" }));
      var linje = R.poeng + " av " + max + " riktig på første forsøk";
      if (R.poengPa) linje += " · lengste rekke " + R.besteRekke;
      if (R.tidPa) linje += " · " + tid(ms);
      s.appendChild(el("p", { class: "sb-slutt-tall", text: linje }));
      if (ny && gml) s.appendChild(el("p", { class: "sb-note", text: "Ny beste runde på dette nivået." }));
      else if (gml) s.appendChild(el("p", { class: "sb-note", text: besteTekst(gml) + "." }));
      var ol = el("ol", { class: "sb-sluttliste" });
      R.liste.forEach(function (nt, i) {
        var ok = R.utfall[i] === true;
        ol.appendChild(el("li", { class: ok ? "is-ok" : "is-no" }, [el("span", { class: "sb-mk", "aria-hidden": "true", text: ok ? "✓" : "✗" }),
          el("span", { class: "qz-sr", text: ok ? "Riktig: " : "Ikke riktig første gang: " }), el("span", { html: plain(nt.tekst).length > 90 ? esc(plain(nt.tekst).slice(0, 88)) + "…" : esc(plain(nt.tekst)) })]));
      });
      s.appendChild(ol);
      var bNy = el("button", { class: "btn primary", type: "button", text: "Ny runde" });
      bNy.addEventListener("click", function () { start(R.niva); });
      var bM = el("button", { class: "btn", type: "button", text: "Velg nivå" });
      bM.addEventListener("click", function () { visMeny(); fokus(".sb-niva", false); });
      s.appendChild(el("div", { class: "sb-actions" }, [bNy, bM]));
      view.appendChild(s);
      fokus(".sb-slutt-h", true);
      say("Runden er ferdig. " + linje + ".");
    }

    /* ---------- Fokus ---------- */
    function fokus(sel, scroll) {
      var n = view.querySelector(sel);
      if (!n) return;
      try { n.focus({ preventScroll: !scroll }); } catch (e) { n.focus(); }
    }
    function gjenopprettFokus(info) {
      if (!info || !info.sel) return;
      var inne = wrap.contains(document.activeElement) || document.activeElement === document.body || !document.activeElement;
      if (!inne) return;
      var n = view.querySelector(info.sel);
      if (n && !n.disabled) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }
    }

    /* ---------- Dra med Pointer Events ---------- */
    function pDown(e, id, sone, b) {
      if (T.done || (e.button != null && e.button !== 0)) return;
      var grep = !!(e.target.closest && e.target.closest(".sb-grip"));
      if (!grep && e.pointerType !== "mouse" && e.pointerType !== "pen") return;   // berøring utenfor grepet: la siden rulle
      drag = { id: id, sone: sone, b: b, pid: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, on: false, mal: null, idx: null };
      if (grep) e.preventDefault();
      b.addEventListener("pointermove", pMove);
      b.addEventListener("pointerup", pUp);
      b.addEventListener("pointercancel", pCancel);
      try { b.setPointerCapture(e.pointerId); } catch (er) {}
    }
    function startDrag() {
      drag.on = true;
      var r = drag.b.getBoundingClientRect();
      drag.dx = drag.x0 - r.left; drag.dy = drag.y0 - r.top;
      var g = drag.b.cloneNode(true);
      g.removeAttribute("id"); g.setAttribute("aria-hidden", "true");
      g.className = "sb-chip sb-ghost sel";
      g.style.width = Math.min(r.width, W.innerWidth - 16) + "px";
      document.body.appendChild(g);
      drag.ghost = g;
      drag.b.classList.add("is-dragging");
      say(txtOf(drag.id) + " løftet.");
      tick();
    }
    function malFor(x, y) {
      var t = document.elementFromPoint(x, y), z = t && t.closest ? t.closest("[data-sone]") : null;
      if (z && view.contains(z)) {
        var s = z.getAttribute("data-sone");
        if (s === "build" || s === "pool") return s;
      }
      if (refs.build) {             // litt slingringsmonn rundt spørringen
        var r = refs.build.getBoundingClientRect();
        if (x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 24 && y <= r.bottom + 24) return "build";
      }
      return null;
    }
    function byggIndeks(y) {
      var idx = 0;
      T.build.forEach(function (id) {
        if (id === drag.id) return;
        var c = refs.chips[id];
        if (!c) return;
        var r = c.getBoundingClientRect();
        if (y > r.top + r.height / 2) idx++;
      });
      return idx;
    }
    function track() {
      if (!drag || !drag.on) return;
      drag.ghost.style.transform = "translate(" + Math.round(drag.x - drag.dx) + "px," + Math.round(drag.y - drag.dy) + "px)";
      var mal = malFor(drag.x, drag.y), idx = mal === "build" ? byggIndeks(drag.y) : null;
      if (mal === drag.mal && idx === drag.idx) return;
      drag.mal = mal; drag.idx = idx;
      if (refs.build) {
        refs.build.classList.toggle("is-over", mal === "build");
        Array.prototype.forEach.call(refs.build.children, function (li) { li.classList.remove("drop-before", "drop-after"); });
        if (mal === "build") {
          var andre = T.build.filter(function (x) { return x !== drag.id; });
          if (idx < andre.length && refs.chips[andre[idx]]) refs.chips[andre[idx]].parentNode.classList.add("drop-before");
          else if (andre.length && refs.chips[andre[andre.length - 1]]) refs.chips[andre[andre.length - 1]].parentNode.classList.add("drop-after");
        }
      }
      if (refs.pool) refs.pool.classList.toggle("is-over", mal === "pool" && drag.sone === "build");
    }
    function tick() {
      if (!drag || !drag.on) { raf = null; return; }
      var kant = 56, h = W.innerHeight, v = 0;
      if (drag.y < kant) v = -Math.ceil((kant - drag.y) / 4);
      else if (drag.y > h - kant) v = Math.ceil((drag.y - (h - kant)) / 4);
      if (v) { W.scrollBy(0, v); drag.mal = undefined; track(); }
      raf = W.requestAnimationFrame(tick);
    }
    function pMove(e) {
      if (!drag || e.pointerId !== drag.pid) return;
      drag.x = e.clientX; drag.y = e.clientY;
      if (!drag.on) { if (Math.abs(drag.x - drag.x0) + Math.abs(drag.y - drag.y0) < 6) return; startDrag(); }
      e.preventDefault();
      track();
    }
    function endDrag() {
      if (!drag) return null;
      var b = drag.b;
      b.removeEventListener("pointermove", pMove);
      b.removeEventListener("pointerup", pUp);
      b.removeEventListener("pointercancel", pCancel);
      try { b.releasePointerCapture(drag.pid); } catch (er) {}
      if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
      b.classList.remove("is-dragging");
      if (raf) { W.cancelAnimationFrame(raf); raf = null; }
      var d = drag; drag = null;
      return d;
    }
    function pUp(e) {
      if (!drag || e.pointerId !== drag.pid) return;
      var d = endDrag();
      if (!d.on) return;                          // bare et trykk: klikket tar seg av det
      suppressClick = true; setTimeout(function () { suppressClick = false; }, 400);
      if (d.mal === "build") {
        T.sel = null; T.kb = null;
        if (d.sone === "pool") {
          T.build.splice(Math.max(0, Math.min(T.build.length, d.idx)), 0, d.id); endret();
          tegn({ sel: '.sb-chip[data-sone="build"][data-id="' + d.id + '"]' });
          say(txtOf(d.id) + " lagt inn som linje " + (T.build.indexOf(d.id) + 1) + ".");
        } else flytt(d.id, d.idx);
      } else if (d.mal === "pool" && d.sone === "build") taUt(d.id);
      else { tegn(); say("Ikke flyttet."); }
    }
    function pCancel() { var d = endDrag(); if (d && d.on) { tegn(); say("Avbrutt."); } }

    function onDocKey(e) { if ((e.key === "Escape" || e.key === "Esc") && T && T.sel && !wrap.contains(document.activeElement)) { T.sel = null; T.kb = null; tegn(); } }
    document.addEventListener("keydown", onDocKey);
    host._sbOff = function () { stopTimer(); endDrag(); document.removeEventListener("keydown", onDocKey); host._sbOff = null; };

    if (opts.start != null && (opts.start === "blandet" || nivaer.some(function (n) { return n.n === opts.start; }))) start(opts.start);
    else visMeny();

    return {
      el: wrap, start: start, meny: visMeny, destroy: function () { if (host._sbOff) host._sbOff(); },
      // For selvtesten
      _state: function () { return { R: R, T: T }; }
    };
  };

  IN.sqlBygger.logic = { normalize: normalize, grade: grade, gradeFeil: gradeFeil, matchF: matchF, flat: flat, sqlAv: sqlAv,
    fasitSql: fasitSql, idsFraNokler: idsFraNokler, visTekst: visTekst, klausulAv: klausulAv, bunke: bunke, rekkefolgeMelding: rekkefolgeMelding,
    sammeSomFasit: sammeSomFasit, kjor: kjor, bedre: bedre, keysOf: keysOf, SKRIV: SKRIV, LOGISK: LOGISK,
    _nullstillDb: function () { dbCache = null; } };
})();
