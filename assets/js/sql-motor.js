/* ============================================================
   IN2090 guide · sql-motor.js
   En liten SQL-tolk i ren JS med PostgreSQL-semantikk for kursets utvalg (read-only SELECT).
     IN.sqlMotor.run(sql, db, {idag})   → { kolonner, typer, rader, ordnet, orden, feil?, merknader[] }
     IN.sqlMotor.parse(sql)             → { ast, feil?, merknader[], setninger }
     IN.sqlMotor.trace(sql, db, {idag}) → { steg:[{klausul, tekst, fra:[a,b], kolonner, rader, merker, grupper?}], feil? }
     IN.sqlMotor.lagDb(skjema, rader, idag) → db   (skjema som IN.dataSql.skjema, rader: {tabellnavn: [[…]]})
     IN.sqlMotor.features(ast)          → { "UNION": true, "NOT EXISTS": true, … } (til oppgavekrav)
   db: { tabeller: { navn: { kolonner: [{navn, type, pk?, fk?}], rader: [[…]] } }, idag?: "YYYY-MM-DD" }
   Verdier: null = NULL, tall, tekst, true/false, datoer som "YYYY-MM-DD".
   Ingen eval, ingen nettverk. Grense på antall mellomrader (MAKS_RADER).
   Feilmeldinger er norske og laget fra maler med linje og kolonne.
   Klassisk script, virker fra file:// og i node (setter window.IN).
   ============================================================ */
(function () {
  "use strict";
  var W = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
  var IN = (W.IN = W.IN || {});

  var MAKS_RADER = 300000;

  /* ---------------- Hjelpere ---------------- */
  function SqlFeil(kode, melding, tok, ekstra) {
    this.kode = kode; this.melding = melding;
    if (tok) { this.pos = tok.pos; this.slutt = tok.end; this.linje = tok.line; this.kol = tok.col; }
    if (ekstra) for (var k in ekstra) this[k] = ekstra[k];
  }
  function feil(kode, melding, tok, ekstra) { throw new SqlFeil(kode, melding, tok, ekstra); }
  function linjePre(tok) { return tok && tok.line ? "Linje " + tok.line + ": " : ""; }
  function bt(s) { return "`" + s + "`"; }

  // Optimal string alignment-avstand (bytte av to naboer teller 1)
  function avstand(a, b) {
    a = String(a); b = String(b);
    var n = a.length, m = b.length, d = [], i, j;
    if (Math.abs(n - m) > 2) return 9;
    for (i = 0; i <= n; i++) { d[i] = [i]; }
    for (j = 0; j <= m; j++) d[0][j] = j;
    for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[n][m];
  }
  // æøå-folding: «laaner», «laner», «utlan» og «utlån» blir like
  function fold(s) {
    return String(s).toLowerCase().replace(/å/g, "a").replace(/aa/g, "a").replace(/ø/g, "o").replace(/oe/g, "o").replace(/æ/g, "a").replace(/ae/g, "a");
  }
  // Ett entydig forslag blant kandidatene, eller null
  function forslag(navn, kand, minLen) {
    var lav = String(navn).toLowerCase(), f = fold(lav), treff = [];
    minLen = minLen || 3;
    kand.forEach(function (k) {
      if (treff.indexOf(k) >= 0 || k === lav) return;
      if (fold(k) === f || (lav.length >= minLen && avstand(lav, k) <= 1)) treff.push(k);
    });
    return treff.length === 1 ? treff[0] : null;
  }

  /* ---------------- Tokenizer ---------------- */
  var OPS3 = [], OPS2 = ["<>", "!=", "<=", ">=", "||", "::"], OPS1 = "(),;.*+-/%=<>[]";
  function erBokstav(c) { return /[A-Za-z_À-ɏ]/.test(c); }
  function erIdTegn(c) { return /[A-Za-z0-9_$À-ɏ]/.test(c); }

  function tokenize(src) {
    var toks = [], i = 0, n = src.length, linjeStart = [0];
    for (var q = 0; q < n; q++) if (src[q] === "\n") linjeStart.push(q + 1);
    function lc(pos) {
      var lo = 0, hi = linjeStart.length - 1;
      while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (linjeStart[mid] <= pos) lo = mid; else hi = mid - 1; }
      return { line: lo + 1, col: pos - linjeStart[lo] + 1 };
    }
    function push(t, v, start, extra) {
      var p = lc(start), tok = { t: t, v: v, raw: src.slice(start, i), pos: start, end: i, line: p.line, col: p.col };
      if (extra) for (var k in extra) tok[k] = extra[k];
      toks.push(tok);
    }
    while (i < n) {
      var c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === "-" && src[i + 1] === "-") { while (i < n && src[i] !== "\n") i++; continue; }
      if (c === "/" && src[i + 1] === "*") {
        var s0 = i; i += 2;
        while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
        if (i >= n) { var p0 = lc(s0); feil("kommentar", "Linje " + p0.line + ": kommentaren som starter med /* blir aldri avsluttet med */.", { pos: s0, end: n, line: p0.line, col: p0.col }); }
        i += 2; continue;
      }
      var start = i;
      if (c === "'") {
        var val = ""; i++;
        for (;;) {
          if (i >= n) {
            var p1 = lc(start);
            feil("streng", "Linje " + p1.line + ": strengen som starter med ' i kolonne " + p1.col + ", blir aldri avsluttet. Mangler du et ' på slutten?",
              { pos: start, end: Math.min(n, start + 1), line: p1.line, col: p1.col });
          }
          if (src[i] === "'") { if (src[i + 1] === "'") { val += "'"; i += 2; continue; } i++; break; }
          val += src[i++];
        }
        push("str", val, start); continue;
      }
      if (c === '"') {
        var qv = ""; i++;
        while (i < n && src[i] !== '"') qv += src[i++];
        if (i >= n) { var p2 = lc(start); feil("streng", "Linje " + p2.line + ': " i kolonne ' + p2.col + ' blir aldri avsluttet. Strenger skrives forresten med enkle anførselstegn: \'tekst\'.', { pos: start, end: start + 1, line: p2.line, col: p2.col }); }
        i++; push("qid", qv, start); continue;
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
        while (i < n && /[0-9]/.test(src[i])) i++;
        var heltall = true;
        if (src[i] === "." && /[0-9]/.test(src[i + 1] || "")) { heltall = false; i++; while (i < n && /[0-9]/.test(src[i])) i++; }
        else if (src[i] === "." && !erIdTegn(src[i + 1] || "")) { heltall = false; i++; }
        if ((src[i] === "e" || src[i] === "E") && /[0-9+-]/.test(src[i + 1] || "")) { heltall = false; i++; if (src[i] === "+" || src[i] === "-") i++; while (i < n && /[0-9]/.test(src[i])) i++; }
        push("num", parseFloat(src.slice(start, i)), start, { int: heltall }); continue;
      }
      if (erBokstav(c)) {
        while (i < n && erIdTegn(src[i])) i++;
        push("id", src.slice(start, i).toLowerCase(), start); continue;
      }
      var two = src.substr(i, 2);
      if (OPS2.indexOf(two) >= 0) { i += 2; push("op", two, start); continue; }
      if (OPS1.indexOf(c) >= 0) { i++; push("op", c, start); continue; }
      var p3 = lc(start); i++;
      feil("tegn", "Linje " + p3.line + ": tegnet " + bt(c) + " forstår jeg ikke her.", { pos: start, end: i, line: p3.line, col: p3.col });
    }
    var pe = lc(n);
    toks.push({ t: "eof", v: "", raw: "", pos: n, end: n, line: pe.line, col: pe.col });
    return toks;
  }

  /* Typografiske anførselstegn (mobiltastatur) og hardt mellomrom → vanlige */
  function normaliser(sql) {
    var s = String(sql == null ? "" : sql), typo = /[‘’‚‛′´“”„‟″]/.test(s);
    var ut = s.replace(/[‘’‚‛′´]/g, "'").replace(/[“”„‟″]/g, '"').replace(/ /g, " ").replace(/\r\n?/g, "\n");
    return { sql: ut, endret: typo };
  }

  /* ---------------- Parser ---------------- */
  var RESERVERT = {};
  ("select from where group by having order limit offset union intersect except all distinct on join inner left right full outer " +
   "cross natural using and or not in is null true false as case when then else end with exists between like ilike asc desc " +
   "into values set lateral fetch window returning").split(" ").forEach(function (w) { RESERVERT[w] = 1; });
  var NOKKELORD = ("select from where group by having order limit offset union intersect except all distinct on join inner left right full " +
    "outer cross natural using and or not in is null true false as case when then else end with exists between like ilike asc desc nulls first last " +
    "any some cast interval current_date extract").split(" ");
  var STARTORD = ["select", "with"];
  var IKKE_STOTTET = { insert: "INSERT", update: "UPDATE", "delete": "DELETE", create: "CREATE", drop: "DROP", alter: "ALTER",
    begin: "BEGIN", commit: "COMMIT", rollback: "ROLLBACK", truncate: "TRUNCATE", grant: "GRANT", revoke: "REVOKE", start: "START" };
  var AGG = { count: 1, sum: 1, avg: 1, min: 1, max: 1 };
  var TYPER = { "int": "int", integer: "int", bigint: "int", smallint: "int", int2: "int", int4: "int", int8: "int", serial: "int",
    numeric: "num", decimal: "num", real: "num", "float": "num", float4: "num", float8: "num", "double": "num",
    text: "text", varchar: "text", "char": "text", character: "text", date: "date", "boolean": "bool", bool: "bool" };

  function Parser(src) {
    this.src = src;
    this.toks = tokenize(src);
    this.p = 0;
    this.parens = [];
    this.roller = [];       // { tok, rolle: "kw"|"fn"|"id" }
    this.notater = [];      // statiske merknader fra parsingen
  }
  var PP = Parser.prototype;
  PP.peek = function (k) { return this.toks[Math.min(this.p + (k || 0), this.toks.length - 1)]; };
  PP.next = function () { var t = this.toks[this.p]; if (t.t !== "eof") this.p++; return t; };
  PP.prev = function () { return this.toks[this.p - 1] || null; };
  PP.isKw = function (w, k) { var t = this.peek(k); return t.t === "id" && t.v === w; };
  PP.acceptKw = function (w) { if (this.isKw(w)) { this.roller.push({ tok: this.peek(), rolle: "kw" }); return this.next(); } return null; };
  PP.isOp = function (o, k) { var t = this.peek(k); return t.t === "op" && t.v === o; };
  PP.acceptOp = function (o) {
    if (!this.isOp(o)) return null;
    var t = this.next();
    if (o === "(") this.parens.push(t);
    else if (o === ")") this.parens.pop();
    return t;
  };
  PP.beskriv = function (t) {
    if (!t || t.t === "eof") return "slutten av spørringen";
    return bt(t.raw);
  };
  PP.ventet = function (hva, hint) {
    var t = this.peek(), pr = this.prev();
    if ((t.t === "eof" || (t.t === "op" && t.v === ";")) && this.parens.length) {
      var op = this.parens[this.parens.length - 1];
      feil("parentes", "Linje " + op.line + ": parentesen som åpnes i kolonne " + op.col + ", blir aldri lukket. Mangler du en )?", op, { ventet: hva });
    }
    var m = linjePre(t) + (pr ? "etter " + bt(pr.raw) + " " : "") + "ventet jeg " + hva + ", men fant " + this.beskriv(t) + ".";
    if (!hint && t.t === "op" && t.v === ")" && !this.parens.length) hint = "Det står en ) for mye.";
    // Et feilstavet nøkkelord (FORM, WERE …) slår alle andre hint
    var kw = pr && pr._implisittAlias ? likerNokkelord(pr.v) : null;
    if (kw) hint = bt(pr.raw) + " ligner på " + kw.toUpperCase() + ". Mente du " + kw.toUpperCase() + "?";
    else if (t.t === "id" && !RESERVERT[t.v]) {
      var kw2 = likerNokkelord(t.v);
      if (kw2 && kw2 !== t.v) hint = bt(t.raw) + " ligner på " + kw2.toUpperCase() + ". Mente du " + kw2.toUpperCase() + "?";
    }
    feil("syntaks", m + (hint ? " " + hint : ""), t, { ventet: hva });
  };
  PP.expectKw = function (w, hva, hint) { var t = this.acceptKw(w); if (!t) this.ventet(hva || w.toUpperCase(), hint); return t; };
  PP.expectOp = function (o, hva, hint) { var t = this.acceptOp(o); if (!t) this.ventet(hva || bt(o), hint); return t; };
  function likerNokkelord(w) {
    w = String(w).toLowerCase();
    var best = null;
    ["select", "from", "where", "group", "order", "having", "limit", "offset", "join", "inner", "left", "right", "distinct", "union", "except", "intersect", "exists", "between", "using", "natural"].forEach(function (k) {
      if (!best && w !== k && w.length >= 3 && avstand(w, k) <= (k.length >= 5 ? 2 : 1)) best = k;
    });
    return best;
  }

  // Et identifikator-token (ikke reservert ord). Returnerer {navn, tok, quoted}
  PP.ident = function (hva) {
    var t = this.peek();
    if (t.t === "qid") { this.next(); return { navn: t.v, tok: t, quoted: true }; }
    if (t.t === "id" && !RESERVERT[t.v]) { this.next(); this.roller.push({ tok: t, rolle: "id" }); return { navn: t.v, tok: t, quoted: false }; }
    this.ventet(hva || "et navn");
  };

  PP.script = function () {
    var setninger = [];
    while (this.acceptOp(";")) {}
    while (this.peek().t !== "eof") {
      var st = this.setning();
      setninger.push(st);
      var t = this.peek();
      if (t.t === "eof") { st.semikolon = false; break; }
      if (this.acceptOp(";")) { st.semikolon = true; while (this.acceptOp(";")) {} continue; }
      if (t.t === "op" && t.v === ")") feil("parentes", linjePre(t) + "her står det en ) for mye. Sjekk at parentesene går opp.", t);
      if (t.t === "id" && (STARTORD.indexOf(t.v) >= 0 || IKKE_STOTTET[t.v]))
        feil("semikolon", linjePre(t) + "en ny setning starter med " + bt(t.raw) + ", men det mangler semikolon (;) etter den forrige. Mellom to setninger må det stå semikolon.", t);
      this.ventet("slutten av spørringen eller ;");
    }
    return setninger;
  };

  PP.setning = function () {
    var t = this.peek();
    if (t.t === "id" && IKKE_STOTTET[t.v])
      feil("ikke-stottet", "Øvingen kan foreløpig bare kjøre spørringer (SELECT). " + IKKE_STOTTET[t.v] + " kommer i en senere versjon. Sammenlign med fasiten i mellomtiden.", t);
    if (t.t === "id" && STARTORD.indexOf(t.v) < 0) {
      var kw = likerNokkelord(t.v);
      feil("syntaks", linjePre(t) + "spørringen må starte med SELECT eller WITH, men starter med " + bt(t.raw) + "." + (kw ? " Mente du " + kw.toUpperCase() + "?" : ""), t);
    }
    return this.query();
  };

  PP.query = function () {
    var start = this.peek(), q = { type: "query", with: [], order: [], limit: null, offset: null, pos: start.pos };
    if (this.acceptKw("with")) {
      if (this.isKw("recursive")) feil("ikke-stottet", linjePre(this.peek()) + "WITH RECURSIVE er ikke pensum og støttes ikke i øvingen.", this.peek());
      do {
        var navn = this.ident("et navn på WITH-tabellen"), kolonner = null;
        if (this.acceptOp("(")) { kolonner = []; do { kolonner.push(this.ident("et kolonnenavn").navn); } while (this.acceptOp(",")); this.expectOp(")", "`)`"); }
        this.expectKw("as", "AS", "Skriv WITH navn AS (SELECT …).");
        var op = this.expectOp("(", "`(`", "Spørringen i WITH skal stå i parentes: WITH navn AS (SELECT …).");
        var sub = this.query();
        var cl = this.expectOp(")", "`)`");
        q.with.push({ navn: navn.navn, tok: navn.tok, kolonner: kolonner, query: sub, fra: [navn.tok.pos, cl.end] });
      } while (this.acceptOp(","));
      if (this.isKw("with")) feil("syntaks", linjePre(this.peek()) + "flere WITH-tabeller skilles med komma, ikke med et nytt WITH: WITH a AS (…), b AS (…) SELECT …", this.peek());
      if (!this.isKw("select") && !this.isOp("(")) this.ventet("SELECT eller komma etter WITH-tabellen");
    }
    q.body = this.setExpr();
    var ot = this.peek();
    if (this.acceptKw("order")) {
      this.expectKw("by", "BY", "Skriv ORDER BY.");
      q.orderTok = ot;
      do {
        var e = this.expr(), it = { expr: e, desc: false, nulls: null };
        if (this.acceptKw("desc")) it.desc = true; else this.acceptKw("asc");
        if (this.acceptKw("nulls")) {
          if (this.acceptKw("first")) it.nulls = "first"; else if (this.acceptKw("last")) it.nulls = "last"; else this.ventet("FIRST eller LAST etter NULLS");
        }
        q.order.push(it);
      } while (this.acceptOp(","));
      q.orderFra = [ot.pos, this.prev().end];
    }
    var lt = this.peek();
    for (var k = 0; k < 2; k++) {
      if (!q.limit && this.acceptKw("limit")) { if (this.acceptKw("all")) q.limit = { type: "null" }; else q.limit = this.expr(); }
      else if (!q.offset && this.acceptKw("offset")) { q.offset = this.expr(); if (this.acceptKw("rows") || this.acceptKw("row")) {} }
    }
    if (q.limit || q.offset) q.limitFra = [lt.pos, this.prev().end];
    if (this.isKw("fetch")) feil("ikke-stottet", linjePre(this.peek()) + "FETCH FIRST støttes ikke i øvingen. Bruk LIMIT.", this.peek());
    q.end = this.prev() ? this.prev().end : start.end;
    return q;
  };

  PP.setExpr = function () {
    var left = this.setTerm();
    while (this.isKw("union") || this.isKw("except")) {
      var t = this.next(); this.roller.push({ tok: t, rolle: "kw" });
      var all = !!this.acceptKw("all"); if (!all) this.acceptKw("distinct");
      var right = this.setTerm();
      left = { type: "setop", op: t.v, all: all, left: left, right: right, tok: t, pos: left.pos, end: right.end };
    }
    return left;
  };
  PP.setTerm = function () {
    var left = this.setPrimary();
    while (this.isKw("intersect")) {
      var t = this.next(); this.roller.push({ tok: t, rolle: "kw" });
      var all = !!this.acceptKw("all"); if (!all) this.acceptKw("distinct");
      var right = this.setPrimary();
      left = { type: "setop", op: "intersect", all: all, left: left, right: right, tok: t, pos: left.pos, end: right.end };
    }
    return left;
  };
  PP.setPrimary = function () {
    if (this.isOp("(")) {
      var op = this.acceptOp("("), q = this.query(); this.expectOp(")", "`)`");
      return { type: "paren", query: q, pos: op.pos, end: this.prev().end };
    }
    if (!this.isKw("select")) {
      var t = this.peek();
      if (t.t === "id" && !RESERVERT[t.v] && likerNokkelord(t.v) === "select") feil("syntaks", linjePre(t) + "ventet jeg SELECT, men fant " + bt(t.raw) + ". Mente du SELECT?", t);
      this.ventet("SELECT");
    }
    return this.select();
  };

  PP.select = function () {
    var st = this.acceptKw("select"), s = { type: "select", distinct: false, items: [], from: [], where: null, groupBy: [], having: null, tok: st, pos: st.pos };
    var dtok = this.acceptKw("distinct");
    if (dtok) {
      s.distinct = true; s.distinctFra = [dtok.pos, dtok.end];
      if (this.isKw("on")) feil("ikke-stottet", linjePre(this.peek()) + "DISTINCT ON er ikke pensum og støttes ikke.", this.peek());
    } else this.acceptKw("all");
    s.clauses = { select: [st.pos] };
    if (this.isKw("from")) feil("syntaks", linjePre(this.peek()) + "SELECT mangler kolonner: skriv hva som skal vises før FROM, for eksempel SELECT navn FROM … eller SELECT * FROM …", this.peek());
    do {
      if (this.isKw("from")) {
        var ft = this.peek();
        feil("syntaks", linjePre(ft) + "det står et komma for mye foran FROM. Etter siste kolonne skal det ikke være komma.", this.prev());
      }
      s.items.push(this.selItem());
    } while (this.acceptOp(","));
    s.clauses.select.push(this.prev().end);
    var slutt = function (self) { return self.prev().end; };
    if (this.acceptKw("from")) {
      var fs = this.prev().pos;
      do { s.from.push(this.fromItem()); } while (this.acceptOp(","));
      s.clauses.from = [fs, slutt(this)];
    } else if (this.peek().t === "id" && !RESERVERT[this.peek().v] || this.peek().t === "str" || this.peek().t === "num") {
      this.ventet("komma eller FROM", "Mangler du et komma mellom kolonnene?");
    }
    if (this.acceptKw("where")) { var ws = this.prev().pos; s.where = this.expr(); s.clauses.where = [ws, slutt(this)]; }
    if (this.isKw("group")) {
      var gs = this.next(); this.roller.push({ tok: gs, rolle: "kw" });
      this.expectKw("by", "BY", "Skriv GROUP BY.");
      do { s.groupBy.push(this.expr()); } while (this.acceptOp(","));
      s.clauses.group = [gs.pos, slutt(this)];
    }
    if (this.acceptKw("having")) { var hs = this.prev().pos; s.having = this.expr(); s.clauses.having = [hs, slutt(this)]; }
    var t = this.peek();
    if (t.t === "id" && t.v === "where" && (s.groupBy.length || s.having))
      feil("syntaks", linjePre(t) + "WHERE må stå før GROUP BY og HAVING. Rekkefølgen er SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.", t);
    if (t.t === "id" && t.v === "from" && s.where) feil("syntaks", linjePre(t) + "FROM må stå før WHERE.", t);
    if (t.t === "id" && t.v === "group" && s.having) feil("syntaks", linjePre(t) + "GROUP BY må stå før HAVING.", t);
    s.end = this.prev().end;
    return s;
  };

  PP.selItem = function () {
    var t = this.peek();
    if (t.t === "op" && t.v === "*") { this.next(); return { star: true, rel: null, pos: t.pos, end: t.end }; }
    if ((t.t === "id" || t.t === "qid") && this.isOp(".", 1) && this.isOp("*", 2)) {
      this.next(); this.next(); var st = this.next();
      if (t.t === "id") this.roller.push({ tok: t, rolle: "id" });
      return { star: true, rel: t.t === "qid" ? t.v : t.v, relTok: t, pos: t.pos, end: st.end };
    }
    var e = this.expr(), it = { expr: e, alias: null, pos: e.pos, end: e.end };
    if (this.acceptKw("as")) {
      var a = this.peek();
      if (a.t === "id" || a.t === "qid") { this.next(); it.alias = a.v; it.aliasTok = a; if (a.t === "id") this.roller.push({ tok: a, rolle: "id" }); }
      else this.ventet("et navn etter AS");
    } else {
      var b = this.peek();
      if ((b.t === "id" && !RESERVERT[b.v]) || b.t === "qid") {
        this.next(); it.alias = b.v; it.aliasTok = b; it.implisitt = true; b._implisittAlias = true;
        if (b.t === "id") this.roller.push({ tok: b, rolle: "id" });
      }
    }
    it.end = this.prev().end;
    return it;
  };

  PP.tablePrimary = function () {
    var t = this.peek(), item;
    if (t.t === "op" && t.v === "(") {
      var op = this.acceptOp("(");
      if (this.isKw("select") || this.isKw("with")) {
        var q = this.query(); this.expectOp(")", "`)`");
        item = { type: "subq", query: q, pos: op.pos };
      } else {
        var inner = this.fromItem(); this.expectOp(")", "`)`");
        inner.pos = op.pos; inner.end = this.prev().end;
        return inner;
      }
    } else if (t.t === "id" && t.v === "lateral") {
      feil("ikke-stottet", linjePre(t) + "LATERAL er ikke pensum og støttes ikke.", t);
    } else {
      var nv = this.ident("et tabellnavn");
      item = { type: "table", navn: nv.navn, tok: nv.tok, quoted: nv.quoted, pos: nv.tok.pos };
    }
    var harAs = !!this.acceptKw("as"), a = this.peek();
    if ((a.t === "id" && !RESERVERT[a.v]) || a.t === "qid") {
      this.next(); item.alias = a.v; item.aliasTok = a; item.aliasUtenAs = !harAs; if (!harAs) a._implisittAlias = true;
      if (a.t === "id") this.roller.push({ tok: a, rolle: "id" });
      if (this.acceptOp("(")) { item.kolAlias = []; do { item.kolAlias.push(this.ident("et kolonnenavn").navn); } while (this.acceptOp(",")); this.expectOp(")", "`)`"); }
    } else if (harAs) this.ventet("et alias etter AS");
    item.end = this.prev().end;
    return item;
  };

  PP.fromItem = function () {
    var left = this.tablePrimary();
    for (;;) {
      var natural = false, kind = null, start = this.peek();
      if (this.acceptKw("natural")) natural = true;
      if (this.acceptKw("cross")) kind = "cross";
      else if (this.acceptKw("inner")) kind = "inner";
      else if (this.acceptKw("left")) { kind = "left"; this.acceptKw("outer"); }
      else if (this.acceptKw("right")) { kind = "right"; this.acceptKw("outer"); }
      else if (this.acceptKw("full")) { kind = "full"; this.acceptKw("outer"); }
      if (!kind && !natural && !this.isKw("join")) break;
      if (this.isKw("outer")) feil("syntaks", linjePre(this.peek()) + "OUTER må ha LEFT, RIGHT eller FULL foran seg: LEFT OUTER JOIN.", this.peek());
      this.expectKw("join", "JOIN");
      var jt = this.prev();
      kind = kind || "inner";
      var right = this.tablePrimary(), j = { type: "join", kind: kind, natural: natural, left: left, right: right, on: null, using: null, tok: jt, pos: left.pos, joinPos: start.pos };
      if (!natural && kind !== "cross") {
        if (this.acceptKw("on")) j.on = this.expr();
        else if (this.acceptKw("using")) {
          this.expectOp("(", "`(`", "USING skrives med parentes: USING (fid).");
          j.using = []; do { j.using.push(this.ident("et kolonnenavn")); } while (this.acceptOp(","));
          this.expectOp(")", "`)`");
        } else {
          this.ventet("ON eller USING", "En " + (kind === "inner" ? "" : kind.toUpperCase() + " ") + "JOIN trenger en betingelse: ON (a.x = b.y) eller USING (x).");
        }
      }
      j.end = this.prev().end;
      left = j;
    }
    return left;
  };

  /* ---- Uttrykk (presedens som i PostgreSQL) ---- */
  PP.expr = function () { return this.orExpr(); };
  function mk(type, o, a, b) { o.type = type; o.pos = a.pos; o.end = (b || a).end; return o; }
  PP.orExpr = function () {
    var l = this.andExpr();
    while (this.acceptKw("or")) { var r = this.andExpr(); l = mk("bin", { op: "or", l: l, r: r }, l, r); }
    return l;
  };
  PP.andExpr = function () {
    var l = this.notExpr();
    while (this.acceptKw("and")) { var r = this.notExpr(); l = mk("bin", { op: "and", l: l, r: r }, l, r); }
    return l;
  };
  PP.notExpr = function () {
    var t = this.peek();
    if (this.acceptKw("not")) { var e = this.notExpr(); return mk("un", { op: "not", e: e }, t, e); }
    return this.isExpr();
  };
  PP.isExpr = function () {
    var l = this.cmpExpr();
    while (this.isKw("is")) {
      this.acceptKw("is");
      var not = !!this.acceptKw("not"), t = this.peek();
      if (this.acceptKw("null")) l = mk("isnull", { e: l, not: not }, l, t);
      else if (this.acceptKw("true") || this.acceptKw("false")) l = mk("istf", { e: l, not: not, v: t.v === "true" }, l, t);
      else if (this.acceptKw("distinct")) { this.expectKw("from", "FROM"); var r = this.cmpExpr(); l = mk("isdist", { l: l, r: r, not: not }, l, r); }
      else this.ventet("NULL etter IS", "Skriv IS NULL eller IS NOT NULL.");
    }
    return l;
  };
  var CMP = { "=": 1, "<>": 1, "!=": 1, "<": 1, ">": 1, "<=": 1, ">=": 1 };
  PP.cmpExpr = function () {
    var l = this.predExpr();
    var t = this.peek();
    if (t.t === "op" && CMP[t.v]) {
      this.next();
      if (this.isKw("any") || this.isKw("some") || this.isKw("all")) {
        var qt = this.next(); this.roller.push({ tok: qt, rolle: "kw" });
        this.expectOp("(", "`(`");
        if (!this.isKw("select") && !this.isKw("with")) this.ventet("en delspørring (SELECT …)");
        var q = this.query(); var c = this.expectOp(")", "`)`");
        return mk("cmpq", { op: t.v, e: l, quant: qt.v === "all" ? "all" : "any", query: q, tok: t }, l, c);
      }
      var r = this.predExpr();
      var n = mk("bin", { op: t.v === "!=" ? "<>" : t.v, raw: t.v, l: l, r: r, tok: t }, l, r);
      var t2 = this.peek();
      if (t2.t === "op" && CMP[t2.v]) feil("syntaks", linjePre(t2) + "to sammenligninger etter hverandre (" + bt(t.v) + " og " + bt(t2.v) + ") går ikke. Skriv a < b AND b < c, eller BETWEEN.", t2);
      return n;
    }
    return l;
  };
  PP.predExpr = function () {
    var l = this.otherExpr();
    for (;;) {
      var save = this.p, not = false, nt = this.peek();
      if (this.isKw("not") && (this.isKw("in", 1) || this.isKw("like", 1) || this.isKw("ilike", 1) || this.isKw("between", 1))) { this.acceptKw("not"); not = true; }
      if (this.acceptKw("between")) {
        this.acceptKw("symmetric");
        var lo = this.otherExpr(); this.expectKw("and", "AND", "BETWEEN skrives x BETWEEN a AND b.");
        var hi = this.otherExpr();
        l = mk("between", { e: l, lo: lo, hi: hi, not: not }, l, hi); continue;
      }
      if (this.acceptKw("in")) {
        var op = this.expectOp("(", "`(`", "IN skal følges av en liste i parentes: IN (1, 2) eller IN (SELECT …).");
        var node = { e: l, not: not };
        if (this.isKw("select") || this.isKw("with")) node.query = this.query();
        else { node.list = []; if (this.isOp(")")) this.ventet("minst én verdi i IN-lista"); do { node.list.push(this.expr()); } while (this.acceptOp(",")); }
        var cl = this.expectOp(")", "`)`", "Mangler du en ) etter lista?");
        l = mk("in", node, l, cl); continue;
      }
      var lt = this.peek();
      if (this.acceptKw("like") || this.acceptKw("ilike")) {
        var pat = this.otherExpr(), esc = null;
        if (this.acceptKw("escape")) esc = this.otherExpr();
        l = mk("like", { e: l, pat: pat, not: not, ci: lt.v === "ilike", esc: esc }, l, pat); continue;
      }
      this.p = save; void nt;
      break;
    }
    return l;
  };
  PP.otherExpr = function () {
    var l = this.addExpr();
    while (this.isOp("||")) { this.next(); var r = this.addExpr(); l = mk("bin", { op: "||", l: l, r: r }, l, r); }
    return l;
  };
  PP.addExpr = function () {
    var l = this.mulExpr();
    while (this.isOp("+") || this.isOp("-")) { var t = this.next(); var r = this.mulExpr(); l = mk("bin", { op: t.v, l: l, r: r, tok: t }, l, r); }
    return l;
  };
  PP.mulExpr = function () {
    var l = this.unary();
    while (this.isOp("*") || this.isOp("/") || this.isOp("%")) { var t = this.next(); var r = this.unary(); l = mk("bin", { op: t.v, l: l, r: r, tok: t }, l, r); }
    return l;
  };
  PP.unary = function () {
    var t = this.peek();
    if (this.isOp("-") || this.isOp("+")) { this.next(); var e = this.unary(); return t.v === "-" ? mk("un", { op: "-", e: e }, t, e) : e; }
    return this.castExpr();
  };
  PP.typeNavn = function () {
    var t = this.peek();
    if (t.t !== "id") this.ventet("et typenavn (int, float, date, text …)");
    this.next();
    var navn = t.v;
    if (navn === "double") { this.acceptKw("precision"); }
    if (navn === "character" && this.acceptKw("varying")) navn = "varchar";
    if (navn === "timestamp" || navn === "time" || navn === "interval") feil("ikke-stottet", linjePre(t) + "typen " + t.raw + " støttes ikke i øvingen ennå (bare date, tall, tekst og boolean).", t);
    var ty = TYPER[navn];
    if (!ty) feil("type", linjePre(t) + "typen " + bt(t.raw) + " kjenner jeg ikke. Bruk int, float, numeric, text, date eller boolean.", t);
    if (this.acceptOp("(")) { do { this.next(); } while (this.acceptOp(",")); this.expectOp(")", "`)`"); }
    return { ty: ty, navn: navn === "float" ? "float8" : navn };
  };
  PP.castExpr = function () {
    var e = this.primary();
    while (this.isOp("::")) { this.next(); var ty = this.typeNavn(); e = mk("cast", { e: e, to: ty.ty, tnavn: ty.navn }, e, this.prev()); }
    return e;
  };
  PP.primary = function () {
    var t = this.peek();
    if (t.t === "num") { this.next(); return mk("num", { v: t.v, int: t.int }, t); }
    if (t.t === "str") { this.next(); return mk("str", { v: t.v }, t); }
    if (t.t === "op" && t.v === "(") {
      var op = this.acceptOp("(");
      if (this.isKw("select") || this.isKw("with")) {
        var q = this.query(); var cl = this.expectOp(")", "`)`");
        return mk("subq", { query: q }, op, cl);
      }
      var e = this.expr();
      if (this.isOp(",")) feil("ikke-stottet", linjePre(this.peek()) + "radverdier som (a, b) støttes ikke i øvingen.", this.peek());
      var c2 = this.expectOp(")", "`)`");
      return mk("paren", { e: e }, op, c2);
    }
    if (t.t === "qid") { this.next(); return this.kolonneRest({ navn: t.v, tok: t, quoted: true }); }
    if (t.t === "op" && t.v === "*") feil("syntaks", linjePre(t) + "* kan bare stå alene i SELECT eller i count(*).", t);
    if (t.t !== "id") this.ventet("en verdi, en kolonne eller et uttrykk");
    var w = t.v;
    if (w === "null") { this.acceptKw("null"); return mk("null", {}, t); }
    if (w === "true" || w === "false") { this.acceptKw(w); return mk("bool", { v: w === "true" }, t); }
    if (w === "exists") {
      this.acceptKw("exists");
      this.expectOp("(", "`(`", "EXISTS skal følges av en delspørring i parentes: EXISTS (SELECT …).");
      if (!this.isKw("select") && !this.isKw("with")) this.ventet("SELECT inne i EXISTS (…)");
      var qe = this.query(); var ce = this.expectOp(")", "`)`");
      return mk("exists", { query: qe }, t, ce);
    }
    if (w === "case") return this.caseExpr();
    if (w === "cast" && this.isOp("(", 1)) {
      this.acceptKw("cast"); this.expectOp("(", "`(`"); var ce1 = this.expr(); this.expectKw("as", "AS", "Skriv CAST(x AS type).");
      var ty = this.typeNavn(); var cc = this.expectOp(")", "`)`");
      return mk("cast", { e: ce1, to: ty.ty, tnavn: ty.navn }, t, cc);
    }
    if (w === "current_date") { this.next(); this.roller.push({ tok: t, rolle: "fn" }); return mk("curdate", {}, t); }
    if ((w === "date") && this.peek(1).t === "str") { this.next(); var s = this.next(); return mk("cast", { e: mk("str", { v: s.v }, s), to: "date", tnavn: "date" }, t, s); }
    if (w === "interval") feil("ikke-stottet", linjePre(t) + "INTERVAL støttes ikke i øvingen ennå. For datoer kan du skrive dato + 14 (antall dager).", t);
    if (w === "extract" && this.isOp("(", 1)) {
      this.next(); this.roller.push({ tok: t, rolle: "fn" }); this.expectOp("(", "`(`");
      var f = this.next(); this.expectKw("from", "FROM", "Skriv extract(year FROM dato).");
      var xe = this.expr(); var xc = this.expectOp(")", "`)`");
      if (["year", "month", "day"].indexOf(f.v) < 0) feil("ikke-stottet", linjePre(f) + "extract støtter year, month og day i øvingen.", f);
      return mk("extract", { felt: f.v, e: xe }, t, xc);
    }
    if (RESERVERT[w]) {
      if (w === "from" || w === "where") this.ventet("et uttrykk", w === "from" ? "Det står kanskje et komma for mye foran FROM?" : null);
      this.ventet("en verdi, en kolonne eller et uttrykk");
    }
    this.next();
    if (this.isOp("(")) return this.funcRest(t);
    this.roller.push({ tok: t, rolle: "id" });
    return this.kolonneRest({ navn: t.v, tok: t, quoted: false });
  };
  PP.kolonneRest = function (first) {
    if (this.isOp(".")) {
      this.next();
      var sec = this.peek();
      if (sec.t === "id" || sec.t === "qid") {
        this.next(); if (sec.t === "id") this.roller.push({ tok: sec, rolle: "id" });
        return { type: "col", rel: first.navn, relTok: first.tok, navn: sec.v, tok: sec, quoted: sec.t === "qid", relQuoted: first.quoted, pos: first.tok.pos, end: sec.end };
      }
      this.ventet("et kolonnenavn etter punktum");
    }
    return { type: "col", rel: null, navn: first.navn, tok: first.tok, quoted: first.quoted, pos: first.tok.pos, end: first.tok.end };
  };
  PP.funcRest = function (t) {
    var name = t.v, node = { name: name, args: [], distinct: false, star: false, tok: t };
    this.roller.push({ tok: t, rolle: "fn" });
    this.acceptOp("(");
    if (this.isOp("*")) { this.next(); node.star = true; if (name !== "count") feil("syntaks", linjePre(t) + bt(name + "(*)") + " finnes ikke. Bare count(*) kan ha *. Mente du " + name + "(kolonne)?", t); }
    else if (!this.isOp(")")) {
      if (this.acceptKw("distinct")) node.distinct = true; else this.acceptKw("all");
      do { node.args.push(this.expr()); } while (this.acceptOp(","));
    }
    var cl = this.expectOp(")", "`)`", "Mangler du en ) etter argumentene til " + name + "?");
    if (this.isKw("over")) feil("ikke-stottet", linjePre(this.peek()) + "vindusfunksjoner (OVER) er ikke pensum og støttes ikke.", this.peek());
    if (this.isKw("filter")) feil("ikke-stottet", linjePre(this.peek()) + "FILTER støttes ikke i øvingen.", this.peek());
    return mk("func", node, t, cl);
  };
  PP.caseExpr = function () {
    var t = this.acceptKw("case"), node = { operand: null, whens: [], els: null };
    if (!this.isKw("when")) node.operand = this.expr();
    while (this.acceptKw("when")) {
      var w = this.expr(); this.expectKw("then", "THEN", "Skriv CASE WHEN … THEN … END.");
      node.whens.push({ when: w, then: this.expr() });
    }
    if (!node.whens.length) this.ventet("WHEN");
    if (this.acceptKw("else")) node.els = this.expr();
    var e = this.expectKw("end", "END", "CASE avsluttes med END.");
    return mk("case", node, t, e);
  };

  /* ---------------- Statisk lint ---------------- */
  function walk(node, fn, depth) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(function (x) { walk(x, fn, depth); }); return; }
    if (fn(node, depth || 0) === false) return;
    for (var k in node) {
      if (k === "tok" || /Tok$/.test(k) || k.charAt(0) === "_") continue;
      var v = node[k];
      if (v && typeof v === "object") walk(v, fn, (depth || 0) + (node.type === "query" ? 1 : 0));
    }
  }

  function features(ast) {
    var f = {};
    walk(ast, function (n) {
      if (n.type === "setop") f[n.op.toUpperCase() + (n.all ? " ALL" : "")] = f[n.op.toUpperCase()] = true;
      if (n.type === "query" && n.with && n.with.length) f.WITH = true;
      if (n.type === "query" && n.order && n.order.length) f["ORDER BY"] = true;
      if (n.type === "query" && n.limit) f.LIMIT = true;
      if (n.type === "exists") f.EXISTS = true;
      if (n.type === "un" && n.op === "not" && n.e.type === "exists") f["NOT EXISTS"] = true;
      if (n.type === "in") { f[n.not ? "NOT IN" : "IN"] = true; if (n.query) f[n.not ? "NOT IN (SELECT)" : "IN (SELECT)"] = true; }
      if (n.type === "join") { f.JOIN = true; f[(n.natural ? "NATURAL " : "") + n.kind.toUpperCase() + " JOIN"] = true; if (n.natural) f.NATURAL = true; if (n.using) f.USING = true; }
      if (n.type === "select") { if (n.distinct) f.DISTINCT = true; if (n.groupBy.length) f["GROUP BY"] = true; if (n.having) f.HAVING = true; if (n.from.length > 1) f["KOMMA-JOIN"] = true; }
      if (n.type === "subq" || (n.type === "in" && n.query) || n.type === "exists" || n.type === "cmpq") f.DELSPØRRING = true;
      if (n.type === "func" && AGG[n.name]) f.AGGREGAT = true;
      if (n.type === "like") f[n.ci ? "ILIKE" : "LIKE"] = true;
      if (n.type === "case") f.CASE = true;
    });
    return f;
  }

  function lintStatisk(par, setninger, ast, sql) {
    var m = [];
    function add(kode, tekst, nar) { m.push({ kode: kode, tekst: tekst, nar: nar || "alltid" }); }
    // Store og små bokstaver
    var kwLav = [], idStor = [], fnStor = [], aaa = [];
    par.roller.forEach(function (r) {
      var raw = r.tok.raw;
      if (r.rolle === "kw" && raw !== raw.toUpperCase()) { if (kwLav.indexOf(raw) < 0) kwLav.push(raw); }
      else if (r.rolle === "id" && raw !== raw.toLowerCase()) { if (idStor.indexOf(raw) < 0) idStor.push(raw); if (/[ÆØÅ]/.test(raw)) aaa.push(raw); }
      else if (r.rolle === "fn" && raw !== raw.toLowerCase()) { if (fnStor.indexOf(raw) < 0) fnStor.push(raw); }
    });
    function liste(a) { return a.slice(0, 3).map(bt).join(", ") + (a.length > 3 ? " …" : ""); }
    if (kwLav.length) add("store-bokstaver-nokkelord", "Du skrev " + liste(kwLav) + ". Kurset skriver nøkkelord med store bokstaver (" + kwLav.slice(0, 3).map(function (s) { return s.toUpperCase(); }).join(", ") + "). Det teller ikke som feil.");
    if (idStor.length) add("store-bokstaver-navn", "Du skrev " + liste(idStor) + ". Kurset skriver tabell- og kolonnenavn med små bokstaver. PostgreSQL gjør dem om til små bokstaver, så det virker likt.");
    if (fnStor.length) add("store-bokstaver-funksjon", "Du skrev " + liste(fnStor) + ". Kurset skriver funksjoner med små bokstaver: " + fnStor.slice(0, 2).map(function (s) { return s.toLowerCase(); }).join(", ") + ". Det teller ikke som feil.");
    if (aaa.length) add("store-aeoa", "Navnet " + bt(aaa[0]) + " har stor Æ, Ø eller Å uten anførselstegn. Ekte PostgreSQL gjør bare A–Z om til små bokstaver, så der finner den ikke tabellen. Skriv navnet med små bokstaver.");
    // Semikolon
    if (setninger.length === 1 && !setninger[0].semikolon) add("semikolon", "Semikolon mangler på slutten. Det teller ikke her, men psql venter på ; før den kjører spørringen.");
    // AS
    var utenAsKol = [], utenAsTab = [];
    walk(ast, function (n) {
      if (n.type === "select") n.items.forEach(function (it) { if (it.implisitt) utenAsKol.push(it.aliasTok.raw); });
      if ((n.type === "table" || n.type === "subq") && n.aliasUtenAs) utenAsTab.push(n.aliasTok.raw);
    });
    if (utenAsKol.length || utenAsTab.length) add("mangler-as", "Kurset skriver AS foran nye navn" + (utenAsTab.length ? ", også for tabeller: " + bt("bok AS b") : ": " + bt("count(*) AS antall")) + ". Uten AS virker det likt (" + liste(utenAsKol.concat(utenAsTab)) + ").");
    // = NULL
    var nullCmp = null;
    walk(ast, function (n) { if (n.type === "bin" && CMP[n.raw || n.op] && (n.l.type === "null" || n.r.type === "null")) nullCmp = nullCmp || n; });
    if (nullCmp) add("lik-null", "Linje " + nullCmp.tok.line + ": " + bt((nullCmp.raw || nullCmp.op) + " NULL") + " blir aldri sant, fordi sammenligning med NULL gir NULL (ukjent). Bruk " + bt((nullCmp.op === "=" ? "IS NULL" : "IS NOT NULL")) + ".");
    // LIMIT uten ORDER BY, HAVING uten GROUP BY, delspørring i FROM uten navn
    walk(ast, function (n) {
      if (n.type === "query" && n.limit && n.limit.type !== "null" && !n.order.length) add("limit-uten-order", "LIMIT uten ORDER BY gir tilfeldige rader. Sorter først, så er det bestemt hvilke rader du får.");
      if (n.type === "select" && n.having && !n.groupBy.length) add("having-uten-group", "Kurset sier at HAVING skal brukes sammen med GROUP BY. PostgreSQL godtar det likevel (hele tabellen blir én gruppe).");
    });
    walk(ast, function (n) {
      if (n.type === "select") n.from.forEach(function f(it) {
        if (it.type === "subq" && !it.alias) add("from-uten-alias", "Delspørringen i FROM har ikke fått et navn. PostgreSQL 16 og nyere godtar det, men kurset (og eldre versjoner) krever et navn: (SELECT …) AS t.");
        if (it.type === "join") { f(it.left); f(it.right); }
      });
    });
    // Hint som bare vises når svaret er feil
    var hk = null, notIn = null, cstar = false, left = false;
    walk(ast, function (n) {
      if (n.type === "bin" && CMP[n.op] && ((n.l.type === "col" && /id$/.test(n.l.navn) && n.r.type === "num") || (n.r.type === "col" && /id$/.test(n.r.navn) && n.l.type === "num"))) hk = hk || n;
      if (n.type === "in" && n.e.type === "col" && /id$/.test(n.e.navn) && n.list && n.list.every(function (x) { return x.type === "num"; })) hk = hk || n;
      if (n.type === "in" && n.not && n.query) notIn = notIn || n;
      if (n.type === "func" && n.name === "count" && n.star) cstar = true;
      if (n.type === "join" && (n.kind === "left" || n.kind === "right" || n.kind === "full")) left = true;
    });
    if (hk) add("hardkodet-id", "Du sammenligner en ID med et fast tall. Det virker på eksempeldataene, men ikke på en annen database. Slå opp med navn eller en join i stedet.", "feil");
    if (notIn) add("not-in-null", "NOT IN med en delspørring gir 0 rader hvis delspørringen gir en NULL. NOT EXISTS er tryggere.", "feil");
    if (cstar && left) add("count-stjerne-ytre", "count(*) teller også raden med NULL som en ytre join lager. Tell en kolonne fra den andre tabellen, for eksempel count(b.bid), så får de uten partner 0.", "feil");
    return m;
  }

  function parse(sqlInn) {
    var nz = normaliser(sqlInn), merknader = [];
    if (nz.endret) merknader.push({ kode: "typografiske", tekst: "Typografiske anførselstegn (’ ” fra mobiltastaturet) er gjort om til vanlige ' og \".", nar: "alltid" });
    var par;
    try {
      if (!nz.sql.trim()) feil("tom", "Skriv en spørring først.", null);
      par = new Parser(nz.sql);
      var setninger = par.script();
      if (!setninger.length) feil("tom", "Skriv en spørring først.", null);
      if (setninger.length > 1) feil("flere", "Svaret har " + setninger.length + " setninger. Skriv bare én spørring (én SELECT).", par.toks[0]);
      var ast = setninger[0];
      merknader = merknader.concat(lintStatisk(par, setninger, ast, nz.sql));
      return { ast: ast, merknader: merknader, sql: nz.sql, tokens: par.toks };
    } catch (e) {
      if (!(e instanceof SqlFeil)) throw e;
      return { feil: utFeil(e, nz.sql), merknader: merknader, sql: nz.sql };
    }
  }
  function utFeil(e, sql) {
    var o = { kode: e.kode, melding: e.melding };
    ["pos", "slutt", "linje", "kol", "ventet", "forslag"].forEach(function (k) { if (e[k] != null) o[k] = e[k]; });
    if (o.linje && sql != null) o.linjeTekst = String(sql).split("\n")[o.linje - 1] || "";
    o.kjorer = false;
    return o;
  }

  /* ---------------- Verdier og typer ---------------- */
  var KOLL = (typeof Intl !== "undefined" && Intl.Collator) ? new Intl.Collator("nb", { sensitivity: "variant" }) : null;
  var DATO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  function normDato(s, tok) {
    var m = DATO.exec(String(s).trim());
    if (m) {
      var y = +m[1], mo = +m[2], d = +m[3], dt = new Date(Date.UTC(y, mo - 1, d));
      if (dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d) return dsTekst(dt);
    }
    feil("dato", linjePre(tok) + "'" + s + "' er ikke en gyldig dato. Skriv datoer som 'ÅÅÅÅ-MM-DD', for eksempel '2026-10-01'.", tok);
  }
  function dsTekst(dt) { function p(n) { return (n < 10 ? "0" : "") + n; } return dt.getUTCFullYear() + "-" + p(dt.getUTCMonth() + 1) + "-" + p(dt.getUTCDate()); }
  function datoDager(s) { var m = DATO.exec(s); return Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000; }
  function dagerDato(n) { return dsTekst(new Date(n * 86400000)); }
  function fam(t) { return t === "int" || t === "num" ? "num" : t; }

  function sammenlign(a, b) {     // ikke-NULL verdier; returnerer -1/0/1
    if (typeof a === "number" && typeof b === "number") return a < b ? -1 : a > b ? 1 : 0;
    if (typeof a === "boolean" && typeof b === "boolean") return a === b ? 0 : a ? 1 : -1;
    if (typeof a === "string" && typeof b === "string") {
      if (a === b) return 0;
      if (DATO.test(a) && DATO.test(b)) return a < b ? -1 : 1;
      if (KOLL) { var c = KOLL.compare(a, b); return c < 0 ? -1 : c > 0 ? 1 : (a < b ? -1 : 1); }
      return a < b ? -1 : 1;
    }
    var sa = String(a), sb = String(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  }
  function likVerdi(a, b) {       // likhet for DISTINCT/GROUP BY/mengdeoperatorer (NULL = NULL)
    if (a === null || b === null) return a === b;
    return sammenlign(a, b) === 0 && (typeof a !== "string" || a === b);
  }
  function nokkel(rad) {
    return rad.map(function (v) {
      if (v === null || v === undefined) return "\u0000N";
      if (typeof v === "number") return "n" + (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : String(v));
      if (typeof v === "boolean") return "b" + v;
      return "s" + v;
    }).join("\u0001");
  }
  function tekstAv(v) {
    if (v === true) return "true"; if (v === false) return "false";
    return String(v);
  }

  /* ---------------- Evaluering ---------------- */
  function Ctx(db, opts) {
    this.db = db; this.idag = (opts && opts.idag) || db.idag || dsTekst(new Date());
    this.n = 0; this.maks = (opts && opts.maksRader) || MAKS_RADER;
    this.merknader = []; this.mk = {};
    this.cache = new Map();
    this.trace = opts && opts.trace ? [] : null;
    this.sql = opts && opts.sql || "";
  }
  Ctx.prototype.tell = function (k, tok) {
    this.n += k;
    if (this.n > this.maks) feil("grense", "Spørringen lager for mange mellomrader (over " + this.maks.toLocaleString("nb-NO") + "). Mangler det en join-betingelse? Et kryssprodukt av flere tabeller blir fort enormt.", tok || null);
  };
  Ctx.prototype.merk = function (kode, tekst, nar) {
    if (this.mk[kode]) return;
    this.mk[kode] = 1; this.merknader.push({ kode: kode, tekst: tekst, nar: nar || "alltid" });
  };

  function tabellNavn(ctx) { return Object.keys(ctx.db.tabeller || {}); }

  // Finn en tabell (WITH først, så databasen). Ukjent navn med ett entydig forslag kjøres med forslaget og gir merknad.
  function finnTabell(ctx, scope, navn, tok) {
    var lav = String(navn).toLowerCase();
    for (var s = scope; s; s = s.parent) if (s.ctes && s.ctes[lav]) return { cte: s.ctes[lav], navn: lav };
    var tab = ctx.db.tabeller || {};
    if (tab[lav]) return { base: tab[lav], navn: lav };
    var kand = tabellNavn(ctx);
    for (var s2 = scope; s2; s2 = s2.parent) if (s2.ctes) kand = kand.concat(Object.keys(s2.ctes));
    var f = forslag(lav, kand, 4);
    if (f) {
      ctx.merk("rettet-tabell-" + lav, linjePre(tok) + "tabellen " + bt(tok.raw) + " finnes ikke, så jeg kjørte med " + bt(f) + ". I PostgreSQL gir dette feil, så skriv " + bt(f) + (/[æøå]/.test(f) ? " (med æ, ø og å)" : "") + ".");
      return finnTabell(ctx, scope, f, tok);
    }
    feil("ukjent-tabell", linjePre(tok) + "tabellen " + bt(tok.raw) + " finnes ikke. Tabellene er " + kand.map(bt).join(", ") + ".", tok);
  }

  function kolMeta(navn, type, rel, ekstra) {
    var c = { navn: navn, type: type || "unknown", rel: rel, hidden: false };
    if (ekstra) for (var k in ekstra) c[k] = ekstra[k];
    return c;
  }
  function typeFraVerdier(rader, j) {
    var t = null;
    for (var i = 0; i < rader.length; i++) {
      var v = rader[i][j]; if (v === null || v === undefined) continue;
      var tv = typeof v === "number" ? (Math.round(v) === v ? "int" : "num") : typeof v === "boolean" ? "bool" : (DATO.test(v) ? "date" : "text");
      if (!t) t = tv; else if (t !== tv) { if (fam(t) === "num" && fam(tv) === "num") t = "num"; else if (t === "date" || tv === "date") t = "text"; }
    }
    return t || "text";
  }

  // FROM-ledd → relasjon { cols, rows, nullbar: {rel:1} }
  function evalFromItem(it, ctx, env, scope) {
    if (it.type === "table") {
      var f = finnTabell(ctx, scope, it.navn, it.tok), rel = (it.alias || f.navn);
      var rel0;
      if (f.cte) {
        var r = hentCte(ctx, f.cte);
        rel0 = { cols: r.meta.map(function (m, j) { return kolMeta(m.navn, m.type, rel, { base: null, j: j }); }), rows: r.rader };
      } else {
        var t = f.base, defs = t.kolonner, pkNavn = defs.filter(function (c) { return c && c.pk; }).map(function (c) { return c.navn; });
        rel0 = { cols: defs.map(function (c, j) { var nv = typeof c === "string" ? c : c.navn, ty = typeof c === "string" ? null : TYPER[String(c.type || "").toLowerCase().replace(/\(.*/, "")] || null;
          return kolMeta(nv, ty || typeFraVerdier(t.rader, j), rel, { base: f.navn, pk: pkNavn.indexOf(nv) >= 0, pkAlle: pkNavn, j: j }); }), rows: t.rader };
      }
      if (it.kolAlias) it.kolAlias.forEach(function (a, j) { if (rel0.cols[j]) rel0.cols[j] = kolMeta(a, rel0.cols[j].type, rel, { base: rel0.cols[j].base, pk: rel0.cols[j].pk, pkAlle: rel0.cols[j].pkAlle }); });
      ctx.tell(rel0.rows.length);
      return { cols: rel0.cols, rows: rel0.rows, nullbar: {}, rels: [{ alias: rel, base: f.cte ? null : f.navn, tok: it.tok, harAlias: !!it.alias }] };
    }
    if (it.type === "subq") {
      var res = evalQuery(it.query, ctx, env ? env.outer : null, scope);
      var alias = it.alias || ("delspørring" + (++ctx._sq || (ctx._sq = 1)));
      var cols = res.meta.map(function (m, j) { return kolMeta(it.kolAlias && it.kolAlias[j] || m.navn, m.type, alias, { base: null }); });
      return { cols: cols, rows: res.rader, nullbar: {}, rels: [{ alias: alias, base: null }] };
    }
    if (it.type === "join") return evalJoin(it, ctx, env, scope);
    throw new Error("ukjent FROM-ledd");
  }

  function evalJoin(j, ctx, env, scope) {
    var L = evalFromItem(j.left, ctx, env, scope), R = evalFromItem(j.right, ctx, env, scope);
    sjekkDobbeltAlias(L, R, j);
    var felles = null, nl = L.cols.length, nr = R.cols.length;
    if (j.natural || j.using) {
      felles = [];
      if (j.natural) {
        L.cols.forEach(function (c) { if (!c.hidden && R.cols.some(function (d) { return !d.hidden && d.navn === c.navn; }) && felles.indexOf(c.navn) < 0) felles.push(c.navn); });
        var lst = felles.length ? felles.join(", ") : "(ingen, så det ble et kryssprodukt)";
        var farlig = felles.length > 1 || felles.indexOf("navn") >= 0;
        ctx.merk("natural", "NATURAL JOIN koblet på " + (felles.length > 1 ? "kolonnene " : "") + lst + "." + (farlig ? " Pass på: den kobler på alle kolonner med samme navn, også de du ikke mente." : " Det virker her, men kurset anbefaler ON eller USING, for NATURAL JOIN kobler på alle kolonner med samme navn."));
      } else {
        j.using.forEach(function (u) {
          var lv = String(u.navn).toLowerCase();
          if (!L.cols.some(function (c) { return !c.hidden && c.navn === lv; })) feil("ukjent-kolonne", linjePre(u.tok) + "kolonnen " + bt(u.tok.raw) + " i USING finnes ikke i tabellen til venstre for JOIN.", u.tok);
          if (!R.cols.some(function (c) { return !c.hidden && c.navn === lv; })) feil("ukjent-kolonne", linjePre(u.tok) + "kolonnen " + bt(u.tok.raw) + " i USING finnes ikke i tabellen til høyre for JOIN.", u.tok);
          felles.push(lv);
        });
      }
    }
    var li = [], ri = [];
    if (felles) felles.forEach(function (nv) {
      var a = L.cols.map(function (c, k) { return !c.hidden && c.navn === nv ? k : -1; }).filter(function (k) { return k >= 0; });
      var b = R.cols.map(function (c, k) { return !c.hidden && c.navn === nv ? k : -1; }).filter(function (k) { return k >= 0; });
      if (a.length > 1 || b.length > 1) feil("tvetydig", linjePre(j.tok) + "kolonnen " + bt(nv) + " finnes flere ganger på én side av JOIN, så den kan ikke brukes i USING/NATURAL.", j.tok);
      li.push(a[0]); ri.push(b[0]);
    });
    var nf = felles ? felles.length : 0;
    var cols = [];
    if (felles) felles.forEach(function (nv, k) { var c = L.cols[li[k]]; cols.push(kolMeta(nv, c.type !== "unknown" ? c.type : R.cols[ri[k]].type, null, { merged: true })); });
    L.cols.forEach(function (c, k) { var d = shallow(c); if (li.indexOf(k) >= 0) d.hidden = true; cols.push(d); });
    R.cols.forEach(function (c, k) { var d = shallow(c); if (ri.indexOf(k) >= 0) d.hidden = true; cols.push(d); });
    var nullL = new Array(nl).fill ? new Array(nl).fill(null) : fillN(nl), nullR = new Array(nr).fill ? new Array(nr).fill(null) : fillN(nr);
    function lag(l, r) {
      var row = [];
      for (var k = 0; k < nf; k++) {
        var a = l ? l[li[k]] : null, b = r ? r[ri[k]] : null;
        row.push(j.kind === "right" ? (r ? b : a) : j.kind === "full" ? (a !== null && l ? a : b) : (l ? a : b));
      }
      return row.concat(l || nullL, r || nullR);
    }
    var jenv = { cols: cols, row: null, outer: env ? env.outer : null, inv: env ? env.inv : null, scope: scope };
    var out = [], rTreff = new Array(R.rows.length);
    ctx.tell(L.rows.length * R.rows.length, j.tok);
    for (var a = 0; a < L.rows.length; a++) {
      var l = L.rows[a], fant = false;
      for (var b = 0; b < R.rows.length; b++) {
        var r = R.rows[b], ok;
        if (j.kind === "cross") ok = true;
        else if (felles) { ok = true; for (var k = 0; k < nf; k++) { var x = l[li[k]], y = r[ri[k]]; if (x === null || y === null || !likVerdi(x, y)) { ok = false; break; } } }
        else { jenv.row = lag(l, r); ok = evalExpr(j.on, jenv, ctx) === true; }
        if (ok) { out.push(lag(l, r)); fant = true; rTreff[b] = true; }
      }
      if (!fant && (j.kind === "left" || j.kind === "full")) out.push(lag(l, null));
    }
    if (j.kind === "right" || j.kind === "full") for (var b2 = 0; b2 < R.rows.length; b2++) if (!rTreff[b2]) out.push(lag(null, R.rows[b2]));
    if (j.on) sjekkUtenAggregat(j.on, "ON");
    var nullbar = {}, k2;
    for (k2 in L.nullbar) nullbar[k2] = 1; for (k2 in R.nullbar) nullbar[k2] = 1;
    if (j.kind === "left" || j.kind === "full") R.rels.forEach(function (x) { nullbar[x.alias] = 1; });
    if (j.kind === "right" || j.kind === "full") L.rels.forEach(function (x) { nullbar[x.alias] = 1; });
    return { cols: cols, rows: out, nullbar: nullbar, rels: L.rels.concat(R.rels) };
  }
  function fillN(n) { var a = []; for (var i = 0; i < n; i++) a.push(null); return a; }
  function shallow(o) { var c = {}; for (var k in o) c[k] = o[k]; return c; }
  function sjekkDobbeltAlias(L, R, j) {
    L.rels.forEach(function (a) { R.rels.forEach(function (b) {
      if (a.alias === b.alias) feil("dobbelt-alias", linjePre(b.tok || j.tok) + "navnet " + bt(a.alias) + " brukes om to tabeller i FROM. Gi dem hvert sitt alias, for eksempel låner AS l1 og låner AS l2.", b.tok || j.tok);
    }); });
  }
  function kryss(A, B, ctx, tok) {
    sjekkDobbeltAlias(A, B, { tok: tok });
    ctx.tell(A.rows.length * B.rows.length, tok);
    var rows = [];
    A.rows.forEach(function (a) { B.rows.forEach(function (b) { rows.push(a.concat(b)); }); });
    var nb = {}, k; for (k in A.nullbar) nb[k] = 1; for (k in B.nullbar) nb[k] = 1;
    return { cols: A.cols.concat(B.cols), rows: rows, nullbar: nb, rels: A.rels.concat(B.rels) };
  }

  function hentCte(ctx, c) {
    if (c.res) return c.res;
    if (c.under) feil("ikke-stottet", "WITH-tabellen " + bt(c.navn) + " bruker seg selv. Rekursive spørringer støttes ikke.", null);
    c.under = true;
    var r = evalQuery(c.node.query, ctx, c.outer, c.scope);
    c.under = false;
    if (c.node.kolonner) r = { meta: r.meta.map(function (m, j) { return { navn: c.node.kolonner[j] || m.navn, type: m.type }; }), rader: r.rader };
    c.res = r;
    return r;
  }

  /* --- Kolonneoppslag --- */
  function resolve(e, env, ctx) {
    var c = e._res;
    if (c && c.cols === env.cols) return c;
    var navn = String(e.navn), lav = e.quoted ? navn : navn.toLowerCase(), rel = e.rel == null ? null : (e.relQuoted ? e.rel : String(e.rel).toLowerCase());
    var hops = 0;
    for (var en = env; en; en = en.outer, hops++) {
      var treff = [];
      for (var k = 0; k < en.cols.length; k++) {
        var col = en.cols[k];
        if (rel != null) { if (col.rel === rel && col.navn === lav) treff.push(k); }
        else if (!col.hidden && col.navn === lav) treff.push(k);
      }
      if (treff.length > 1) {
        var rels = treff.map(function (k) { return en.cols[k].rel; }).filter(function (x) { return x; });
        feil("tvetydig", linjePre(e.tok) + "kolonnen " + bt(e.tok.raw) + " finnes i flere tabeller" + (rels.length ? " (" + rels.join(" og ") + ")" : "") + ". Skriv tabellnavnet eller aliaset foran, for eksempel " + bt((rels[0] || "t") + "." + lav) + ".", e.tok);
      }
      if (treff.length === 1) {
        var res = { cols: env.cols, hops: hops, idx: treff[0], col: en.cols[treff[0]] };
        // marker korrelasjon
        var en2 = env;
        for (var h = 0; h < hops; h++) { if (en2.inv && en2.outer && en2.outer.inv !== en2.inv) en2.inv.korrelert = true; en2 = en2.outer; }
        e._res = res;
        return res;
      }
    }
    return ukjentKolonne(e, env, ctx, rel, lav);
  }
  function ukjentKolonne(e, env, ctx, rel, lav) {
    var alleRels = {}, kand = [], relFins = false;
    for (var en = env; en; en = en.outer) en.cols.forEach(function (c) {
      if (c.rel) alleRels[c.rel] = c.base || 1;
      if (rel != null ? c.rel === rel : !c.hidden) { if (kand.indexOf(c.navn) < 0) kand.push(c.navn); }
      if (rel != null && c.rel === rel) relFins = true;
    });
    if (rel != null && !relFins) {
      var baseTreff = null;
      for (var r in alleRels) if (alleRels[r] === rel) baseTreff = r;
      if (baseTreff) feil("alias", linjePre(e.relTok) + "tabellen " + rel + " har fått aliaset " + bt(baseTreff) + ". Da må du skrive " + bt(baseTreff + "." + lav) + ", ikke " + bt(e.relTok.raw + "." + e.tok.raw) + ".", e.relTok);
      var rf = forslag(rel, Object.keys(alleRels), 4);
      if (rf) {
        ctx.merk("rettet-alias-" + rel, linjePre(e.relTok) + bt(e.relTok.raw) + " finnes ikke i FROM, så jeg brukte " + bt(rf) + ". I PostgreSQL gir dette feil.");
        var e2 = shallow(e); e2.rel = rf; e2.relQuoted = true; delete e2._res;
        var res2 = resolve(e2, env, ctx); e._res = res2; return res2;
      }
      feil("ukjent-alias", linjePre(e.relTok) + bt(e.relTok.raw) + " er ikke en tabell eller et alias i FROM" + (Object.keys(alleRels).length ? " (der står " + Object.keys(alleRels).map(bt).join(", ") + ")" : "") + ".", e.relTok);
    }
    if (e.quoted) feil("dobbel-anforsel", linjePre(e.tok) + "\"" + e.navn + "\" i doble anførselstegn er et kolonnenavn i PostgreSQL, og den kolonnen finnes ikke. Strenger skrives med enkle anførselstegn: '" + e.navn + "'.", e.tok);
    if (env.aliaser && env.aliaser[lav]) feil("alias-for-tidlig", linjePre(e.tok) + bt(e.tok.raw) + " er et navn fra SELECT. " + (env.klausul || "WHERE") + " kjøres før SELECT, så navnet finnes ikke ennå. Skriv uttrykket på nytt i stedet for navnet.", e.tok);
    var raw = e.tok.raw, egennavn = /^[A-ZÆØÅ][a-zæøå]+$/.test(raw);
    var f = egennavn ? null : forslag(lav, kand, 4);
    if (f) {
      ctx.merk("rettet-kolonne-" + lav, linjePre(e.tok) + "kolonnen " + bt(raw) + " finnes ikke, så jeg kjørte med " + bt(f) + ". Mente du " + bt(f) + "? I PostgreSQL gir dette feil.");
      var e3 = shallow(e); e3.navn = f; delete e3._res;
      var res3 = resolve(e3, env, ctx); e._res = res3; return res3;
    }
    var f2 = forslag(lav, kand);
    feil("ukjent-kolonne", linjePre(e.tok) + "kolonnen " + bt(raw) + " finnes ikke" + (rel ? " i " + rel : "") + "." +
      (f2 ? " Mente du " + bt(f2) + "?" : "") +
      (egennavn || env.iSammenligning ? " Er det en tekstverdi? Da skal den stå i enkle anførselstegn: '" + raw + "'." : "") +
      (!f2 && kand.length && kand.length <= 12 ? " Kolonnene som finnes her: " + kand.map(bt).join(", ") + "." : ""), e.tok, { forslag: f2 });
  }
  function hentVerdi(e, env, ctx) {
    var r = resolve(e, env, ctx), en = env;
    for (var h = 0; h < r.hops; h++) en = en.outer;
    var row = en.row;
    return row ? (row[r.idx] === undefined ? null : row[r.idx]) : null;
  }

  /* --- Typer for uttrykk --- */
  function typeOf(e, env, ctx) {
    switch (e.type) {
      case "num": return e.int ? "int" : "num";
      case "str": case "null": return "unknown";
      case "bool": case "isnull": case "istf": case "isdist": case "between": case "in": case "like": case "exists": case "cmpq": return "bool";
      case "col": return resolve(e, env, ctx).col.type;
      case "paren": return typeOf(e.e, env, ctx);
      case "un": return e.op === "not" ? "bool" : typeOf(e.e, env, ctx);
      case "cast": return e.to;
      case "curdate": return "date";
      case "extract": return "num";
      case "subq": { var r = subqRes(e, env, ctx); return r.meta[0] ? r.meta[0].type : "unknown"; }
      case "case": {
        var ts = e.whens.map(function (w) { return typeOf(w.then, env, ctx); }); if (e.els) ts.push(typeOf(e.els, env, ctx));
        return samleType(ts);
      }
      case "func": {
        var n = e.name;
        if (n === "count" || n === "length" || n === "char_length") return "int";
        if (n === "avg" || n === "round") return "num";
        if (n === "sum") { var t = typeOf(e.args[0], env, ctx); return t === "int" ? "int" : "num"; }
        if (n === "min" || n === "max" || n === "abs" || n === "nullif") { var t2 = typeOf(e.args[0], env, ctx); return t2 === "unknown" ? "text" : t2; }
        if (n === "coalesce" || n === "greatest" || n === "least") return samleType(e.args.map(function (a) { return typeOf(a, env, ctx); }));
        return "text";
      }
      case "bin": {
        var o = e.op;
        if (o === "and" || o === "or" || CMP[o]) return "bool";
        if (o === "||") return "text";
        var a = typeOf(e.l, env, ctx), b = typeOf(e.r, env, ctx);
        if (a === "unknown" && b !== "unknown") a = b === "date" ? "int" : b;
        if (b === "unknown" && a !== "unknown") b = a === "date" ? "int" : a;
        if (o === "+" && (a === "date" || b === "date")) return "date";
        if (o === "-" && a === "date") return b === "date" ? "int" : "date";
        if (a === "int" && b === "int") return "int";
        if (a === "unknown" && b === "unknown") return "int";
        return "num";
      }
    }
    return "unknown";
  }
  function samleType(ts) {
    var k = ts.filter(function (t) { return t !== "unknown"; });
    if (!k.length) return "text";
    if (k.every(function (t) { return fam(t) === "num"; })) return k.indexOf("num") >= 0 ? "num" : "int";
    return k[0];
  }
  var TNAVN = { "int": "integer", num: "numeric", text: "text", date: "date", bool: "boolean" };
  function typeSjekk(e, env, ctx) {
    if (e._tsjekk === env.cols) return;
    var a = typeOf(e.l, env, ctx), b = typeOf(e.r, env, ctx);
    if (a !== "unknown" && b !== "unknown" && fam(a) !== fam(b) && !(fam(a) === "date" && fam(b) === "text") && !(fam(a) === "text" && fam(b) === "date"))
      feil("type", linjePre(e.tok) + "kan ikke sammenligne " + TNAVN[a] + " med " + TNAVN[b] + " (" + bt((e.raw || e.op)) + "). Sjekk at du sammenligner riktige kolonner" + (fam(a) === "num" || fam(b) === "num" ? ", og at tall ikke står i anførselstegn" : "") + ".", e.tok);
    e._tsjekk = env.cols;
  }

  // Verdien v (fra et uttrykk med type ty) gjort klar til sammenligning med en verdi av typen andre
  function tving(v, ty, andre, tok) {
    if (v === null || ty !== "unknown" || typeof v !== "string") return v;
    if (andre === "int" || andre === "num") {
      var s = v.trim();
      if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) feil("type", linjePre(tok) + "'" + v + "' er ikke et tall, men sammenlignes med et tall. Tall skrives uten anførselstegn.", tok);
      if (andre === "int" && !/^[+-]?\d+$/.test(s)) feil("type", linjePre(tok) + "'" + v + "' er ikke et heltall.", tok);
      return parseFloat(s);
    }
    if (andre === "date") return normDato(v, tok);
    if (andre === "bool") { var l = v.toLowerCase(); if (["t", "true", "yes", "y", "1", "on"].indexOf(l) >= 0) return true; if (["f", "false", "no", "n", "0", "off"].indexOf(l) >= 0) return false; feil("type", linjePre(tok) + "'" + v + "' er ikke en sannhetsverdi.", tok); }
    return v;
  }

  function tre(a) { return a === true ? true : a === false ? false : null; }
  function og(a, b) { if (a === false || b === false) return false; if (a === null || b === null) return null; return true; }
  function eller(a, b) { if (a === true || b === true) return true; if (a === null || b === null) return null; return false; }
  function ikke(a) { return a === null ? null : !a; }
  function sml(op, a, b) {
    if (a === null || b === null) return null;
    var c = sammenlign(a, b);
    if (op === "=") return c === 0 && (typeof a !== "string" || a === b);
    if (op === "<>") return !(c === 0 && (typeof a !== "string" || a === b));
    if (op === "<") return c < 0; if (op === ">") return c > 0; if (op === "<=") return c <= 0; if (op === ">=") return c >= 0;
  }
  function sannhet(v, tok, hvor) {
    if (v === null || v === true || v === false) return v;
    feil("type", linjePre(tok) + (hvor || "betingelsen") + " må være sann eller usann, men er " + bt(tekstAv(v)) + ". Mangler det en sammenligning (=, <, LIKE …)?", tok);
  }

  function likeRegex(pat, ci, esc) {
    var key = (ci ? "i" : "c") + (esc == null ? "\\" : esc) + pat, cache = likeRegex.c || (likeRegex.c = {});
    if (cache[key]) return cache[key];
    var e = esc == null ? "\\" : esc, out = "^";
    for (var i = 0; i < pat.length; i++) {
      var c = pat[i];
      if (e && c === e && i + 1 < pat.length) { out += pat[++i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); continue; }
      if (c === "%") out += "[\\s\\S]*"; else if (c === "_") out += "[\\s\\S]"; else out += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    var re = new RegExp(out + "$", ci ? "i" : "");
    cache[key] = re;
    return re;
  }

  function subqRes(e, env, ctx) {
    var key = e.query;
    if (ctx.cache.has(key)) return ctx.cache.get(key);
    var res = evalQuery(e.query, ctx, env, env.scope);
    if (!res.inv.korrelert) ctx.cache.set(key, res);
    return res;
  }

  function aggTilstede(e) {
    var f = false;
    walk(e, function (n) { if (n.type === "query") return false; if (n.type === "func" && AGG[n.name]) { f = true; return false; } });
    return f;
  }
  function sjekkUtenAggregat(e, hvor) {
    walk(e, function (n) {
      if (n.type === "query") return false;
      if (n.type === "func" && AGG[n.name])
        feil("aggregat-" + hvor.toLowerCase(), linjePre(n.tok) + "aggregatfunksjoner som " + n.name + "(…) kan ikke stå i " + hvor + "." +
          (hvor === "WHERE" ? " WHERE ser på én rad om gangen, før gruppene finnes. Bruk HAVING etter GROUP BY." : hvor === "GROUP BY" ? " Grupper på kolonner, ikke på aggregater." : ""), n.tok);
    });
  }

  function evalExpr(e, env, ctx) {
    switch (e.type) {
      case "num": return e.v;
      case "str": return e.v;
      case "null": return null;
      case "bool": return e.v;
      case "paren": return evalExpr(e.e, env, ctx);
      case "col": return hentVerdi(e, env, ctx);
      case "curdate": return ctx.idag;
      case "un": {
        var v = evalExpr(e.e, env, ctx);
        if (e.op === "not") return ikke(sannhet(v, e.e.tok || e.tok, "uttrykket etter NOT"));
        if (v === null) return null;
        if (typeof v !== "number") { v = tving(v, typeOf(e.e, env, ctx), "num", e.e.tok); }
        return -v;
      }
      case "isnull": { var x = evalExpr(e.e, env, ctx); return e.not ? x !== null : x === null; }
      case "istf": { var y = evalExpr(e.e, env, ctx); var r = y === e.v; return e.not ? !r : r; }
      case "isdist": { var a1 = evalExpr(e.l, env, ctx), b1 = evalExpr(e.r, env, ctx); var d = !likVerdi(a1, b1); return e.not ? !d : d; }
      case "bin": return evalBin(e, env, ctx);
      case "between": {
        var ty = typeOf(e.e, env, ctx), v0 = evalExpr(e.e, env, ctx), lo = evalExpr(e.lo, env, ctx), hi = evalExpr(e.hi, env, ctx);
        lo = tving(lo, typeOf(e.lo, env, ctx), ty, e.lo.tok); hi = tving(hi, typeOf(e.hi, env, ctx), ty, e.hi.tok);
        v0 = tving(v0, ty, typeOf(e.lo, env, ctx), e.e.tok);
        var rb = og(sml(">=", v0, lo), sml("<=", v0, hi));
        return e.not ? ikke(rb) : rb;
      }
      case "in": {
        var vt = typeOf(e.e, env, ctx), val = evalExpr(e.e, env, ctx), verdier, typer;
        if (e.query) {
          var res = subqRes(e, env, ctx);
          if (res.meta.length !== 1) feil("delsporring-kolonner", linjePre(e.query.body.tok || e.e.tok) + "delspørringen i IN gir " + res.meta.length + " kolonner, men må gi nøyaktig én.", e.query.body.tok || e.e.tok);
          verdier = res.rader.map(function (r) { return r[0]; }); typer = null;
          var st = res.meta[0].type;
          if (vt !== "unknown" && st !== "unknown" && fam(vt) !== fam(st) && fam(vt) !== "date" && fam(st) !== "date") feil("type", linjePre(e.e.tok) + "IN sammenligner " + TNAVN[vt] + " med " + TNAVN[st] + ". Sjekk at delspørringen velger riktig kolonne.", e.e.tok);
          val = tving(val, vt, st, e.e.tok);
        } else {
          verdier = e.list.map(function (x) { return tving(evalExpr(x, env, ctx), typeOf(x, env, ctx), vt, x.tok); });
        }
        if (val === null) return null;
        var harNull = false, funnet = false;
        for (var i = 0; i < verdier.length; i++) { if (verdier[i] === null) harNull = true; else if (sml("=", val, verdier[i])) { funnet = true; break; } }
        var ri = funnet ? true : harNull ? null : false;
        return e.not ? ikke(ri) : ri;
      }
      case "like": {
        var s = evalExpr(e.e, env, ctx), p = evalExpr(e.pat, env, ctx), es = e.esc ? evalExpr(e.esc, env, ctx) : null;
        if (s === null || p === null) return null;
        var t1 = typeOf(e.e, env, ctx);
        if (t1 !== "text" && t1 !== "unknown") feil("type", linjePre(e.e.tok) + "LIKE virker på tekst, men " + bt(ctx.sql.slice(e.e.pos, e.e.end)) + " er " + TNAVN[t1] + ". Skriv " + bt(ctx.sql.slice(e.e.pos, e.e.end) + "::text") + " hvis du vil søke i tallet som tekst.", e.e.tok);
        var m = likeRegex(String(p), e.ci, es).test(String(s));
        return e.not ? !m : m;
      }
      case "exists": { var rx = subqRes(e, env, ctx); return rx.rader.length > 0; }
      case "subq": {
        var rs = subqRes(e, env, ctx);
        if (rs.meta.length !== 1) feil("delsporring-kolonner", linjePre(e.query.body.tok) + "delspørringen brukes som én verdi, men gir " + rs.meta.length + " kolonner.", e.query.body.tok);
        if (rs.rader.length > 1) feil("delsporring-rader", linjePre(e.query.body.tok) + "delspørringen gir " + rs.rader.length + " rader, men brukes som én verdi. Bruk IN, eller sørg for at den gir høyst én rad.", e.query.body.tok);
        return rs.rader.length ? rs.rader[0][0] : null;
      }
      case "cmpq": {
        var rq = subqRes(e, env, ctx), lv = evalExpr(e.e, env, ctx), lt = typeOf(e.e, env, ctx);
        if (rq.meta.length !== 1) feil("delsporring-kolonner", linjePre(e.tok) + "delspørringen etter " + e.quant.toUpperCase() + " må gi én kolonne.", e.tok);
        var op = e.op === "!=" ? "<>" : e.op, acc = e.quant === "all" ? true : false;
        lv = tving(lv, lt, rq.meta[0].type, e.e.tok);
        rq.rader.forEach(function (r) { var c = sml(op, lv, r[0]); acc = e.quant === "all" ? og(acc, c) : eller(acc, c); });
        return acc;
      }
      case "case": {
        if (e.operand) {
          var ov = evalExpr(e.operand, env, ctx), oty = typeOf(e.operand, env, ctx);
          for (var w = 0; w < e.whens.length; w++) { var wv = tving(evalExpr(e.whens[w].when, env, ctx), typeOf(e.whens[w].when, env, ctx), oty, e.whens[w].when.tok); if (sml("=", tving(ov, oty, typeOf(e.whens[w].when, env, ctx)), wv) === true) return evalExpr(e.whens[w].then, env, ctx); }
        } else {
          for (var w2 = 0; w2 < e.whens.length; w2++) if (sannhet(evalExpr(e.whens[w2].when, env, ctx), e.whens[w2].when.tok, "betingelsen i WHEN") === true) return evalExpr(e.whens[w2].then, env, ctx);
        }
        return e.els ? evalExpr(e.els, env, ctx) : null;
      }
      case "cast": return cast(evalExpr(e.e, env, ctx), typeOf(e.e, env, ctx), e.to, e.e.tok || e.tok);
      case "extract": {
        var dv = evalExpr(e.e, env, ctx); if (dv === null) return null;
        dv = cast(dv, typeOf(e.e, env, ctx), "date", e.e.tok);
        var mm = DATO.exec(dv); return e.felt === "year" ? +mm[1] : e.felt === "month" ? +mm[2] : +mm[3];
      }
      case "func": return evalFunc(e, env, ctx);
    }
    throw new Error("ukjent uttrykk " + e.type);
  }

  function cast(v, fra, til, tok) {
    if (v === null) return null;
    if (til === "int") {
      if (typeof v === "number") return Math.round(v);
      if (typeof v === "string") { var s = v.trim(); if (!/^[+-]?\d+$/.test(s)) feil("type", linjePre(tok) + "'" + v + "' kan ikke gjøres om til et heltall.", tok); return parseInt(s, 10); }
      if (typeof v === "boolean") return v ? 1 : 0;
    }
    if (til === "num") {
      if (typeof v === "number") return v;
      if (typeof v === "string") { var t = v.trim(); if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) feil("type", linjePre(tok) + "'" + v + "' kan ikke gjøres om til et tall.", tok); return parseFloat(t); }
    }
    if (til === "text") return tekstAv(v);
    if (til === "date") { if (typeof v === "string") return normDato(v, tok); feil("type", linjePre(tok) + "et tall kan ikke gjøres om til en dato.", tok); }
    if (til === "bool") return tving(String(v), "unknown", "bool", tok);
    return v;
  }

  function evalBin(e, env, ctx) {
    var o = e.op;
    if (o === "and") { var a = sannhet(evalExpr(e.l, env, ctx), e.l.tok, "uttrykket før AND"); if (a === false) return false; return og(a, sannhet(evalExpr(e.r, env, ctx), e.r.tok, "uttrykket etter AND")); }
    if (o === "or") { var b = sannhet(evalExpr(e.l, env, ctx), e.l.tok, "uttrykket før OR"); if (b === true) return true; return eller(b, sannhet(evalExpr(e.r, env, ctx), e.r.tok, "uttrykket etter OR")); }
    var tl = typeOf(e.l, env, ctx), tr = typeOf(e.r, env, ctx);
    var x = evalExpr(e.l, env, ctx), y = evalExpr(e.r, env, ctx);
    if (CMP[o]) {
      typeSjekk(e, env, ctx);
      x = tving(x, tl, tr, e.l.tok); y = tving(y, tr, tl, e.r.tok);
      return sml(o, x, y);
    }
    if (o === "||") { if (x === null || y === null) return null; return tekstAv(x) + tekstAv(y); }
    if (x === null || y === null) return null;
    // aritmetikk
    if (tl === "date" || tr === "date") {
      if (tl === "date" && tr === "date" && o === "-") return datoDager(normDato(x, e.l.tok)) - datoDager(normDato(y, e.r.tok));
      if (o === "+" || o === "-") {
        var d = tl === "date" ? x : y, n = tl === "date" ? y : x, nt = tl === "date" ? tr : tl;
        if (o === "-" && tl !== "date") feil("type", linjePre(e.tok) + "kan ikke trekke en dato fra et tall.", e.tok);
        n = tving(n, nt, "int", e.tok);
        if (typeof n !== "number" || Math.round(n) !== n) feil("type", linjePre(e.tok) + "til en dato kan du legge et helt antall dager (dato + 14).", e.tok);
        return dagerDato(datoDager(normDato(d, e.tok)) + (o === "+" ? n : -n));
      }
      feil("type", linjePre(e.tok) + "operatoren " + bt(o) + " virker ikke på datoer.", e.tok);
    }
    if (tl === "unknown") x = tving(x, tl, tr === "unknown" ? "num" : tr, e.l.tok);
    if (tr === "unknown") y = tving(y, tr, tl === "unknown" ? "num" : tl, e.r.tok);
    if (typeof x !== "number" || typeof y !== "number") feil("type", linjePre(e.tok) + "regneoperatoren " + bt(o) + " virker bare på tall" + (o === "+" && (typeof x === "string" || typeof y === "string") ? ". Tekst skjøtes sammen med ||" : "") + ".", e.tok);
    var heltall = (tl === "int" || tl === "unknown") && (tr === "int" || tr === "unknown");
    switch (o) {
      case "+": return x + y;
      case "-": return x - y;
      case "*": return x * y;
      case "/": if (y === 0) feil("null-divisjon", linjePre(e.tok) + "divisjon med null.", e.tok); return heltall ? Math.trunc(x / y) : x / y;
      case "%": if (y === 0) feil("null-divisjon", linjePre(e.tok) + "divisjon med null.", e.tok); return heltall ? x % y : x % y;
    }
  }

  var SKALAR = { coalesce: 1, nullif: 1, upper: 1, lower: 1, length: 1, char_length: 1, abs: 1, round: 1, greatest: 1, least: 1, concat: 1, substr: 1, substring: 1, trim: 1 };
  function evalFunc(e, env, ctx) {
    var n = e.name;
    if (AGG[n]) {
      if (!env.group) feil("aggregat", linjePre(e.tok) + n + "(…) kan ikke brukes her.", e.tok);
      if (e.args.length !== (e.star ? 0 : 1)) feil("argumenter", linjePre(e.tok) + n + " tar ett argument.", e.tok);
      var rows = env.group.rows, sub = { cols: env.cols, row: null, outer: env.outer, inv: env.inv, scope: env.scope, group: null };
      if (e.star) return rows.length;
      var vals = [];
      for (var i = 0; i < rows.length; i++) { sub.row = rows[i]; var v = evalExpr(e.args[0], sub, ctx); if (v !== null) vals.push(v); }
      if (e.distinct) { var sett = {}, u = []; vals.forEach(function (x) { var k = nokkel([x]); if (!sett[k]) { sett[k] = 1; u.push(x); } }); vals = u; }
      if (n === "count") return vals.length;
      if (!vals.length) return null;
      if (n === "min" || n === "max") return vals.reduce(function (a, b) { var c = sammenlign(a, b); return n === "min" ? (c <= 0 ? a : b) : (c >= 0 ? a : b); });
      var ty = typeOf(e.args[0], sub, ctx);
      vals = vals.map(function (x) { if (typeof x !== "number") { if (ty === "unknown") return tving(x, ty, "num", e.tok); feil("type", linjePre(e.tok) + n + "(…) virker bare på tall, ikke på " + TNAVN[ty] + ".", e.tok); } return x; });
      var sum = vals.reduce(function (a, b) { return a + b; }, 0);
      return n === "sum" ? sum : sum / vals.length;
    }
    if (!SKALAR[n]) feil("ukjent-funksjon", linjePre(e.tok) + "funksjonen " + bt(e.tok.raw) + " kjenner øvingen ikke." + (forslag(n, Object.keys(AGG).concat(Object.keys(SKALAR))) ? " Mente du " + forslag(n, Object.keys(AGG).concat(Object.keys(SKALAR))) + "?" : ""), e.tok);
    if (e.distinct || e.star) feil("syntaks", linjePre(e.tok) + "DISTINCT og * kan bare brukes i aggregatfunksjoner.", e.tok);
    var args = e.args.map(function (a) { return evalExpr(a, env, ctx); });
    function trengs(k) { if (args.length < k) feil("argumenter", linjePre(e.tok) + n + " trenger " + k + " argument" + (k > 1 ? "er" : "") + ".", e.tok); }
    switch (n) {
      case "coalesce": trengs(1); var ct = typeOf(e, env, ctx); for (var j = 0; j < args.length; j++) if (args[j] !== null) return tving(args[j], typeOf(e.args[j], env, ctx), ct, e.args[j].tok); return null;
      case "nullif": trengs(2); return sml("=", args[0], tving(args[1], typeOf(e.args[1], env, ctx), typeOf(e.args[0], env, ctx), e.tok)) === true ? null : args[0];
      case "upper": trengs(1); return args[0] === null ? null : tekstAv(args[0]).toUpperCase();
      case "lower": trengs(1); return args[0] === null ? null : tekstAv(args[0]).toLowerCase();
      case "length": case "char_length": trengs(1); return args[0] === null ? null : tekstAv(args[0]).length;
      case "trim": trengs(1); return args[0] === null ? null : tekstAv(args[0]).trim();
      case "abs": trengs(1); return args[0] === null ? null : Math.abs(tving(args[0], typeOf(e.args[0], env, ctx), "num", e.tok));
      case "round": trengs(1);
        if (args[0] === null || (args.length > 1 && args[1] === null)) return null;
        var f = Math.pow(10, args.length > 1 ? args[1] : 0), xv = tving(args[0], typeOf(e.args[0], env, ctx), "num", e.tok) * f;
        return (xv < 0 ? -Math.round(-xv) : Math.round(xv)) / f;
      case "greatest": case "least": trengs(1);
        var nn = args.filter(function (x) { return x !== null; }); if (!nn.length) return null;
        return nn.reduce(function (a, b) { var c = sammenlign(a, b); return n === "greatest" ? (c >= 0 ? a : b) : (c <= 0 ? a : b); });
      case "concat": return args.map(function (x) { return x === null ? "" : tekstAv(x); }).join("");
      case "substr": case "substring": trengs(2);
        if (args[0] === null || args[1] === null) return null;
        var st = tekstAv(args[0]), fra = args[1] - 1, len = args.length > 2 ? args[2] : st.length;
        var a0 = Math.max(0, fra), b0 = Math.max(0, fra + len); return st.slice(a0, b0);
    }
  }

  /* --- Strukturell nøkkel for uttrykk (GROUP BY-sjekk, DISTINCT + ORDER BY) --- */
  function uKey(e, env, ctx) {
    switch (e.type) {
      case "col": { var r = resolve(e, env, ctx); return "c" + r.hops + ":" + r.idx; }
      case "num": return "n" + e.v; case "str": return "s" + e.v; case "null": return "N"; case "bool": return "b" + e.v;
      case "paren": return uKey(e.e, env, ctx);
      case "bin": return "(" + uKey(e.l, env, ctx) + e.op + uKey(e.r, env, ctx) + ")";
      case "un": return e.op + "(" + uKey(e.e, env, ctx) + ")";
      case "func": return e.name + (e.distinct ? "D" : "") + "(" + (e.star ? "*" : e.args.map(function (a) { return uKey(a, env, ctx); }).join(",")) + ")";
      case "cast": return "cast(" + uKey(e.e, env, ctx) + "," + e.to + ")";
      case "extract": return "ex" + e.felt + "(" + uKey(e.e, env, ctx) + ")";
      case "curdate": return "today";
    }
    return "x" + e.pos + ":" + e.end;
  }

  // Ugrupperte kolonner (PostgreSQL-regelen med primærnøkkel-unntaket)
  function sjekkGruppert(e, env, ctx, gKeys, gCols, hvor) {
    walk(e, function (n) {
      if (n.type === "query") return false;
      if (n.type === "func" && AGG[n.name]) {
        walk(n.args, function (m) { if (m.type === "query") return false; if (m.type === "func" && AGG[m.name]) feil("nostet-aggregat", linjePre(m.tok) + "aggregater kan ikke nøstes (" + n.name + "(" + m.name + "(…))). Regn ut det indre aggregatet i en WITH eller en delspørring først.", m.tok); });
        return false;
      }
      if (n.type !== "col" && n.type !== "num" && n.type !== "str" && gKeys[uKey(n, env, ctx)]) return false;
      if (n.type === "col") {
        var r = resolve(n, env, ctx);
        if (r.hops > 0) return false;
        if (gKeys[uKey(n, env, ctx)]) return false;
        var c = r.col;
        if (c.base && c.pkAlle && c.pkAlle.length && c.pkAlle.every(function (pk) { return gCols[c.rel + "." + pk]; })) return false;
        feil("ugruppert", linjePre(n.tok) + "kolonnen " + bt(ctx.sql.slice(n.pos, n.end)) + " står i " + hvor + ", men verken i GROUP BY eller i en aggregatfunksjon. " +
          "Legg den til i GROUP BY, eller bruk et aggregat som count(…) eller max(…)." + (c.base && c.pkAlle && c.pkAlle.length ? " (Grupperer du på primærnøkkelen " + c.pkAlle.map(function (p) { return c.rel + "." + p; }).join(", ") + ", kan du også velge de andre kolonnene i " + c.rel + ".)" : ""), n.tok);
      }
    });
  }

  /* --- SELECT --- */
  function evalSelect(s, ctx, outer, scope, inv, order) {
    var env0 = { cols: [], row: null, outer: outer, inv: inv, scope: scope, group: null };
    var rel;
    if (s.from.length) {
      rel = evalFromItem(s.from[0], ctx, env0, scope);
      for (var k = 1; k < s.from.length; k++) rel = kryss(rel, evalFromItem(s.from[k], ctx, env0, scope), ctx, s.tok);
    } else rel = { cols: [], rows: [[]], nullbar: {}, rels: [] };
    env0.cols = rel.cols;
    var tr = ctx.trace && inv.topp ? ctx.trace : null, src = ctx.sql;
    function trinn(klausul, fra, kolonner, rader, merker, grupper) {
      if (!tr) return;
      var st = { klausul: klausul, tekst: fra ? src.slice(fra[0], fra[1]) : "", fra: fra || null, kolonner: kolonner, rader: rader.map(function (r) { return r.slice(); }), merker: merker };
      if (grupper) st.grupper = grupper;
      tr.push(st);
    }
    function synlige(cols) { return cols.map(function (c, k) { return c.hidden ? -1 : k; }).filter(function (k) { return k >= 0; }); }
    function navnAv(c) { return (c.rel && !c.merged ? c.rel + "." : "") + c.navn; }
    if (tr && s.from.length) { var vis = synlige(rel.cols); trinn("FROM", s.clauses.from, vis.map(function (k) { return navnAv(rel.cols[k]); }), rel.rows.map(function (r) { return vis.map(function (k) { return r[k]; }); }), rel.rows.map(function () { return "keep"; })); }

    // Utvid * og lag elementene
    var items = [];
    s.items.forEach(function (it) {
      if (it.star) {
        var any = false;
        rel.cols.forEach(function (c, k) {
          if (it.rel == null ? !c.hidden : c.rel === String(it.rel).toLowerCase()) {
            any = true; items.push({ expr: { type: "col", rel: c.rel, relQuoted: true, quoted: true, navn: c.navn, tok: it.relTok || s.tok, pos: it.pos, end: it.end, _res: { cols: rel.cols, hops: 0, idx: k, col: c } }, navn: c.navn, stjerne: true });
          }
        });
        if (it.rel != null && !any) feil("ukjent-alias", linjePre(it.relTok) + bt(it.relTok.raw) + " er ikke en tabell eller et alias i FROM.", it.relTok);
        if (it.rel == null && !s.from.length) feil("syntaks", linjePre(s.tok) + "SELECT * trenger en FROM.", s.tok);
      } else items.push({ expr: it.expr, navn: it.alias != null ? it.alias : utNavn(it.expr, env0, ctx), it: it });
    });
    // Alias uten AS som er navnet på en kolonne: mangler komma?
    s.items.forEach(function (it, ix) {
      if (it.implisitt && rel.cols.some(function (c) { return c.navn === String(it.alias).toLowerCase(); }))
        ctx.merk("komma-alias-" + it.alias, linjePre(it.aliasTok) + bt(it.aliasTok.raw) + " ble tolket som et nytt navn på kolonnen foran (uten AS). Mangler du et komma mellom " + bt(src.slice(it.expr.pos, it.expr.end)) + " og " + bt(it.aliasTok.raw) + "?");
    });
    var aliaser = {};
    s.items.forEach(function (it) { if (it.alias) aliaser[String(it.alias).toLowerCase()] = it; });

    // WHERE
    var rows = rel.rows;
    if (s.where) {
      sjekkUtenAggregat(s.where, "WHERE");
      var wenv = { cols: rel.cols, row: null, outer: outer, inv: inv, scope: scope, group: null, aliaser: aliaser, klausul: "WHERE" };
      var merker = [];
      rows = rows.filter(function (r) { wenv.row = r; var v = sannhet(evalExpr(s.where, wenv, ctx), s.where.tok || s.tok, "WHERE-betingelsen"); merker.push(v === true ? "keep" : "drop"); return v === true; });
      // hint: filter på den nullbare siden av en ytre join
      var nb = false;
      walk(s.where, function (n) {
        if (n.type === "query") return false;
        if (n.type === "isnull") return false;
        if (n.type === "col") { try { var rr = resolve(n, wenv, ctx); if (rr.hops === 0 && rr.col.rel && rel.nullbar[rr.col.rel]) nb = true; } catch (e) {} }
      });
      if (nb) ctx.merk("where-ytre", "WHERE kommer etter joinen. En betingelse på tabellen som kan være NULL etter LEFT JOIN, fjerner radene uten partner, så joinen blir i praksis indre. Legg betingelsen i ON, eller filtrer i en WITH først.", "feil");
      if (tr) { var vis2 = synlige(rel.cols); trinn("WHERE", s.clauses.where, vis2.map(function (k) { return navnAv(rel.cols[k]); }), rel.rows.map(function (r) { return vis2.map(function (k) { return r[k]; }); }), merker); }
    }

    // Gruppering?
    var orderExprs = (order || []).filter(function (o) { return !o.utRef; }).map(function (o) { return o.expr; });
    var harAgg = items.some(function (i) { return aggTilstede(i.expr); }) || !!s.having || orderExprs.some(aggTilstede);
    var grupper = null, genv = { cols: rel.cols, row: null, outer: outer, inv: inv, scope: scope, group: null };
    if (s.groupBy.length || harAgg) {
      var gExprs = s.groupBy.map(function (g) {
        if (g.type === "num" && g.int) {
          var ix = g.v - 1; if (ix < 0 || ix >= items.length) feil("syntaks", linjePre(g.tok) + "GROUP BY " + g.v + " viser til kolonne nummer " + g.v + ", men SELECT har bare " + items.length + ".", g.tok);
          return items[ix].expr;
        }
        if (g.type === "col" && g.rel == null && !rel.cols.some(function (c) { return !c.hidden && c.navn === String(g.navn).toLowerCase(); }) && aliaser[String(g.navn).toLowerCase()]) {
          ctx.merk("alias-group-by", "Du grupperer på navnet " + bt(g.tok.raw) + " fra SELECT. PostgreSQL godtar det, men kurset skriver uttrykket eller kolonnen i GROUP BY.");
          return aliaser[String(g.navn).toLowerCase()].expr;
        }
        return g;
      });
      gExprs.forEach(function (g) { sjekkUtenAggregat(g, "GROUP BY"); });
      var gKeys = {}, gCols = {};
      gExprs.forEach(function (g) {
        gKeys[uKey(g, genv, ctx)] = 1;
        if (g.type === "col" || (g.type === "paren" && g.e.type === "col")) { var gc = g.type === "col" ? g : g.e; var r = resolve(gc, genv, ctx); if (r.hops === 0) gCols[r.col.rel + "." + r.col.navn] = 1; }
      });
      items.forEach(function (i) { sjekkGruppert(i.expr, genv, ctx, gKeys, gCols, "SELECT"); });
      if (s.having) sjekkGruppert(s.having, genv, ctx, gKeys, gCols, "HAVING");
      orderExprs.forEach(function (o) { sjekkGruppert(o, genv, ctx, gKeys, gCols, "ORDER BY"); });
      // merknad: gruppering på navn uten nøkkel
      var harKol = {};
      gExprs.forEach(function (g) { if (g.type === "col") { var r = resolve(g, genv, ctx); if (r.hops === 0 && r.col.base && r.col.pkAlle && r.col.pkAlle.length && !r.col.pk) harKol[r.col.rel] = r.col; } });
      Object.keys(harKol).forEach(function (rl) {
        var c = harKol[rl];
        if (!c.pkAlle.every(function (pk) { return gCols[rl + "." + pk]; }))
          ctx.merk("gruppe-navn", "Du grupperer på " + bt(rl + "." + c.navn) + " uten nøkkelen " + bt(c.pkAlle.map(function (p) { return rl + "." + p; }).join(", ")) + ". To med samme " + c.navn + " havner da i samme gruppe. Grupper på nøkkelen også.");
      });
      // Lag gruppene
      var map = {}, liste = [], gid = [];
      rows.forEach(function (r) {
        genv.row = r;
        var kv = gExprs.map(function (g) { return evalExpr(g, genv, ctx); }), key = nokkel(kv);
        if (!map[key]) { map[key] = { rows: [], id: liste.length }; liste.push(map[key]); }
        map[key].rows.push(r); gid.push(map[key].id);
      });
      if (!s.groupBy.length && !liste.length) liste.push({ rows: [], id: 0 });
      grupper = liste;
      if (tr && s.groupBy.length) { var vis3 = synlige(rel.cols); trinn("GROUP BY", s.clauses.group, vis3.map(function (k) { return navnAv(rel.cols[k]); }), rows.map(function (r) { return vis3.map(function (k) { return r[k]; }); }), rows.map(function () { return "keep"; }), gid); }
      if (s.having) {
        var henv = { cols: rel.cols, row: null, outer: outer, inv: inv, scope: scope, group: null, aliaser: aliaser, klausul: "HAVING" };
        var hm = [];
        var gjenv = grupper.filter(function (g) { henv.group = g; henv.row = g.rows[0] || fillN(rel.cols.length); var v = sannhet(evalExpr(s.having, henv, ctx), s.having.tok || s.tok, "HAVING-betingelsen") === true; hm.push(v ? "keep" : "drop"); return v; });
        if (tr) {
          var gk = gExprs.map(function (g) { return src.slice(g.pos, g.end); });
          trinn("HAVING", s.clauses.having, gk.concat([src.slice(s.having.pos, s.having.end)]), grupper.map(function (g) { genv.row = g.rows[0] || fillN(rel.cols.length); genv.group = g; var row = gExprs.map(function (x) { return evalExpr(x, genv, ctx); }); henv.group = g; henv.row = genv.row; row.push(evalExpr(s.having, henv, ctx)); return row; }), hm, grupper.map(function (g) { return g.id; }));
          genv.group = null;
        }
        grupper = gjenv;
      }
    }

    // SELECT-projeksjon
    var meta = items.map(function (i) { var t = typeOf(i.expr, env0, ctx); return { navn: String(i.navn), type: t === "unknown" ? "text" : t }; });
    var ut = [], kilder = [];
    if (grupper) {
      grupper.forEach(function (g) {
        var en = { cols: rel.cols, row: g.rows[0] || fillN(rel.cols.length), outer: outer, inv: inv, scope: scope, group: g };
        ut.push(items.map(function (i) { return evalExpr(i.expr, en, ctx); })); kilder.push(en);
      });
    } else {
      rows.forEach(function (r) {
        var en = { cols: rel.cols, row: r, outer: outer, inv: inv, scope: scope, group: null };
        ut.push(items.map(function (i) { return evalExpr(i.expr, en, ctx); })); kilder.push(en);
      });
    }
    ctx.tell(ut.length);
    trinn("SELECT", s.clauses.select, meta.map(function (m) { return m.navn; }), ut, ut.map(function () { return "keep"; }));

    // ORDER BY-nøkler (før DISTINCT, men DISTINCT krever at nøklene står i SELECT)
    var nokler = null;
    if (order && order.length) {
      nokler = ut.map(function (row, ri) {
        return order.map(function (o) {
          if (o.utRef != null) return row[o.utRef];
          if (s.distinct) {
            var k2 = uKey(o.expr, env0, ctx), hit = -1;
            items.forEach(function (i, ix) { if (hit < 0 && uKey(i.expr, env0, ctx) === k2) hit = ix; });
            if (hit < 0) feil("distinct-order", linjePre(o.expr.tok) + "med SELECT DISTINCT må det du sorterer på, også stå i SELECT.", o.expr.tok);
            return row[hit];
          }
          var kv = kilder[ri]; kv.aliaser = null;
          var v = evalExpr(o.expr, kv, ctx);
          return v;
        });
      });
    }
    var fjernet = 0;
    if (s.distinct) {
      var sett = {}, ut2 = [], n2 = [], dm = [];
      ut.forEach(function (r, i) { var key = nokkel(r); if (sett[key]) { fjernet++; dm.push("drop"); return; } sett[key] = 1; dm.push("keep"); ut2.push(r); if (nokler) n2.push(nokler[i]); });
      trinn("DISTINCT", s.distinctFra, meta.map(function (m) { return m.navn; }), ut, dm);
      ut = ut2; if (nokler) nokler = n2;
    }
    return { meta: meta, rader: ut, nokler: nokler, distinctFjernet: fjernet, harDistinct: s.distinct };
  }

  function utNavn(e, env, ctx) {
    switch (e.type) {
      case "col": return e.quoted ? e.navn : String(e.navn).toLowerCase();
      case "func": return e.name;
      case "cast": { var n = utNavn(e.e, env, ctx); return n === "?column?" ? e.tnavn : n; }
      case "paren": return utNavn(e.e, env, ctx);
      case "case": return "case";
      case "exists": return "exists";
      case "curdate": return "current_date";
      case "extract": return "extract";
      case "subq": { var b = e.query.body; while (b.type === "setop") b = b.left; if (b.type === "paren") return "?column?"; var it = b.items[0]; return it && !it.star ? (it.alias != null ? it.alias : utNavn(it.expr, env, ctx)) : "?column?"; }
    }
    return "?column?";
  }

  function evalBody(b, ctx, outer, scope, inv, order) {
    if (b.type === "select") return evalSelect(b, ctx, outer, scope, inv, order);
    if (b.type === "paren") { var r = evalQuery(b.query, ctx, outer, scope, inv); return { meta: r.meta, rader: r.rader }; }
    // mengdeoperator
    var L = evalBody(b.left, ctx, outer, scope, inv, null), R = evalBody(b.right, ctx, outer, scope, inv, null);
    var opN = b.op.toUpperCase() + (b.all ? " ALL" : "");
    if (L.meta.length !== R.meta.length) feil("mengde-kolonner", linjePre(b.tok) + opN + " krever like mange kolonner på begge sider, men venstre side har " + L.meta.length + " og høyre side " + R.meta.length + ".", b.tok);
    var meta = L.meta.map(function (m, j) {
      var a = m.type, c = R.meta[j].type;
      if (fam(a) !== fam(c) && !((a === "date" && c === "text") || (a === "text" && c === "date")))
        feil("mengde-typer", linjePre(b.tok) + opN + " kan ikke kombinere " + TNAVN[a] + " og " + TNAVN[c] + " i kolonne " + (j + 1) + " (" + m.navn + " og " + R.meta[j].navn + "). Kolonnene kobles etter plass, ikke etter navn.", b.tok);
      return { navn: m.navn, type: fam(a) === "num" && (a === "num" || c === "num") ? "num" : a };
    });
    var telR = {}, ut = [], k;
    R.rader.forEach(function (r) { k = nokkel(r); telR[k] = (telR[k] || 0) + 1; });
    var merkerL = [];
    if (b.op === "union") {
      if (b.all) ut = L.rader.concat(R.rader);
      else { var s = {}; L.rader.concat(R.rader).forEach(function (r) { k = nokkel(r); if (!s[k]) { s[k] = 1; ut.push(r); } }); }
    } else if (b.op === "intersect") {
      var s2 = {};
      L.rader.forEach(function (r) { k = nokkel(r); if (b.all) { if (telR[k] > 0) { telR[k]--; ut.push(r); merkerL.push("keep"); } else merkerL.push("drop"); } else if (telR[k] && !s2[k]) { s2[k] = 1; ut.push(r); merkerL.push("keep"); } else merkerL.push("drop"); });
    } else {
      var s3 = {};
      L.rader.forEach(function (r) { k = nokkel(r); if (b.all) { if (telR[k] > 0) { telR[k]--; merkerL.push("drop"); } else { ut.push(r); merkerL.push("keep"); } } else if (!telR[k] && !s3[k]) { s3[k] = 1; ut.push(r); merkerL.push("keep"); } else merkerL.push("drop"); });
    }
    ctx.tell(ut.length);
    if (ctx.trace && inv.topp) {
      var rr = b.op === "union" ? L.rader.concat(R.rader) : L.rader;
      var mm = b.op === "union" ? (function () { var seen = {}; return rr.map(function (r) { if (b.all) return "keep"; var kk = nokkel(r); if (seen[kk]) return "drop"; seen[kk] = 1; return "keep"; }); })() : merkerL;
      ctx.trace.push({ klausul: opN, tekst: ctx.sql.slice(b.pos, b.end), fra: [b.tok.pos, b.tok.end], kolonner: meta.map(function (m) { return m.navn; }), rader: rr.map(function (r) { return r.slice(); }), merker: mm });
    }
    return { meta: meta, rader: ut };
  }

  function evalQuery(q, ctx, outer, scope, parentInv) {
    var inv = { korrelert: false, topp: !outer && !parentInv && !ctx._toppBrukt };
    if (inv.topp) ctx._toppBrukt = true;
    var sc = scope;
    if (q.with.length) {
      sc = { parent: scope, ctes: {} };
      q.with.forEach(function (w) {
        var lav = String(w.navn).toLowerCase();
        if (sc.ctes[lav]) feil("dobbelt-with", linjePre(w.tok) + "WITH-navnet " + bt(w.navn) + " er brukt to ganger.", w.tok);
        sc.ctes[lav] = { navn: lav, node: w, outer: outer, scope: sc, res: null };
      });
      // WITH-tabellene evalueres med en gang (samme som PostgreSQL gjør logisk; feil vises også om de ikke brukes)
      var toppNo = inv.topp; inv.topp = false; var lagret = ctx.trace; if (toppNo) ctx.trace = null;
      q.with.forEach(function (w) { hentCte(ctx, sc.ctes[String(w.navn).toLowerCase()]); });
      ctx.trace = lagret; inv.topp = toppNo;
      if (ctx.trace && inv.topp) q.with.forEach(function (w) { var r = sc.ctes[String(w.navn).toLowerCase()].res; ctx.trace.push({ klausul: "WITH", tekst: ctx.sql.slice(w.fra[0], w.fra[1]), fra: w.fra, kolonner: r.meta.map(function (m) { return m.navn; }), rader: r.rader.map(function (x) { return x.slice(); }), merker: r.rader.map(function () { return "keep"; }), navn: w.navn }); });
    }
    // ORDER BY: koble til utkolonner der det går
    var order = null, body = q.body;
    if (q.order.length) {
      var utNavnListe = utkolonneNavn(body, ctx);
      order = q.order.map(function (o) {
        var it = { expr: o.expr, desc: o.desc, nulls: o.nulls, utRef: null };
        if (o.expr.type === "num" && o.expr.int) {
          if (o.expr.v < 1 || (utNavnListe && o.expr.v > utNavnListe.length)) feil("syntaks", linjePre(o.expr.tok) + "ORDER BY " + o.expr.v + " viser til kolonne nummer " + o.expr.v + ", men resultatet har " + (utNavnListe ? utNavnListe.length : "færre") + " kolonner.", o.expr.tok);
          it.utRef = o.expr.v - 1; it.ordinal = true;
        } else if (o.expr.type === "col" && o.expr.rel == null && utNavnListe) {
          var lav = o.expr.quoted ? o.expr.navn : String(o.expr.navn).toLowerCase(), hits = [];
          utNavnListe.forEach(function (nv, j) { if (nv != null && nv === lav) hits.push(j); });
          if (hits.length) it.utRef = hits[0];
        }
        if (it.utRef == null && body.type !== "select") feil("order-mengde", linjePre(o.expr.tok) + "etter " + (body.op ? body.op.toUpperCase() : "") + " kan ORDER BY bare bruke kolonnenavn fra resultatet (eller kolonnenummer).", o.expr.tok);
        return it;
      });
    }
    var res = evalBody(body, ctx, outer, sc, inv, order);
    var rader = res.rader, nokler = res.nokler;
    if (order) order.forEach(function (o) {
      if (o.ordinal && o.utRef >= res.meta.length) feil("syntaks", linjePre(o.expr.tok) + "ORDER BY " + (o.utRef + 1) + " viser til kolonne nummer " + (o.utRef + 1) + ", men resultatet har " + res.meta.length + " kolonner.", o.expr.tok);
    });
    if (order) {
      if (!nokler) nokler = rader.map(function (r) { return order.map(function (o) { return r[o.utRef]; }); });
      var idx = rader.map(function (_, i) { return i; });
      idx.sort(function (a, b) {
        for (var k = 0; k < order.length; k++) {
          var x = nokler[a][k], y = nokler[b][k], o = order[k], nf = o.nulls ? o.nulls === "first" : o.desc;
          if (x === null || y === null) { if (x === y) continue; return (x === null) === nf ? -1 : 1; }
          var c = sammenlign(x, y); if (c) return o.desc ? -c : c;
        }
        return a - b;
      });
      rader = idx.map(function (i) { return rader[i]; });
      nokler = idx.map(function (i) { return nokler[i]; });
      if (ctx.trace && inv.topp) ctx.trace.push({ klausul: "ORDER BY", tekst: ctx.sql.slice(q.orderFra[0], q.orderFra[1]), fra: q.orderFra, kolonner: res.meta.map(function (m) { return m.navn; }), rader: rader.map(function (r) { return r.slice(); }), merker: rader.map(function () { return "keep"; }) });
    }
    if (q.limit || q.offset) {
      var lim = q.limit ? konstTall(q.limit, ctx, "LIMIT") : null, off = q.offset ? konstTall(q.offset, ctx, "OFFSET") : 0;
      var før = rader;
      rader = rader.slice(off || 0, lim == null ? undefined : (off || 0) + lim);
      if (ctx.trace && inv.topp) ctx.trace.push({ klausul: "LIMIT", tekst: ctx.sql.slice(q.limitFra[0], q.limitFra[1]), fra: q.limitFra, kolonner: res.meta.map(function (m) { return m.navn; }), rader: før.map(function (r) { return r.slice(); }), merker: før.map(function (_, i) { return i >= (off || 0) && (lim == null || i < (off || 0) + lim) ? "keep" : "drop"; }) });
    }
    return { meta: res.meta, rader: rader, inv: inv, order: order, distinctFjernet: res.distinctFjernet || 0, harDistinct: !!res.harDistinct };
  }
  function konstTall(e, ctx, hvor) {
    var v = evalExpr(e, { cols: [], row: [], outer: null, inv: null, scope: null }, ctx);
    if (v === null) return null;
    if (typeof v === "string") v = tving(v, "unknown", "int", e.tok);
    if (typeof v !== "number" || v < 0 || Math.round(v) !== v) feil("syntaks", linjePre(e.tok) + hvor + " må være et helt tall som ikke er negativt.", e.tok);
    return v;
  }
  function utkolonneNavn(b) {
    while (b.type === "setop") b = b.left;
    if (b.type === "paren") return utkolonneNavn(b.query.body);
    // Med * kjenner vi ikke kolonneplassene før kjøring; da faller ORDER BY navn tilbake til inndata (riktig for SELECT *)
    if (b.items.some(function (it) { return it.star; })) return null;
    return b.items.map(function (it) {
      if (it.alias != null) return it.aliasTok && it.aliasTok.t === "qid" ? it.alias : String(it.alias).toLowerCase();
      var e = it.expr; while (e.type === "paren") e = e.e;
      if (e.type === "col") return e.quoted ? e.navn : String(e.navn).toLowerCase();
      if (e.type === "func") return e.name;
      if (e.type === "cast" && e.e.type === "col") return String(e.e.navn).toLowerCase();
      return null;
    });
  }

  /* ---------------- Sammenligning av resultater ----------------
     sammenlign(fasit, svar) der begge er run()-resultater (kolonner, rader, ordnet, orden).
     Multimengde; som liste bare når fasiten har ORDER BY, og da bare på sorteringsnøklene
     (rader med lik nøkkel kan stå i hvilken som helst rekkefølge).
     → { ok, grunn, melding, forMange:[rad], mangler:[rad], perm, merknader:[tekst],
         svarMerker:{i:"keep"|"drop"}, forsteAvvik } */
  var EPS = 1e-6;
  function normV(v) {
    if (v === null || v === undefined) return "\u0000NULL";
    if (typeof v === "number") return "n:" + (Math.abs(v - Math.round(v)) < EPS ? String(Math.round(v)) : v.toFixed(6));
    if (typeof v === "boolean") return "b:" + v;
    return "s:" + String(v);
  }
  function rk(r, perm) { return perm.map(function (j) { return normV(r[j]); }).join("\u0001"); }
  function kolonneKart(fk, sk) {
    if (fk.length !== sk.length) return null;
    var lav = sk.map(function (k) { return String(k).toLowerCase(); });
    var perm = fk.map(function (k) { return lav.indexOf(String(k).toLowerCase()); });
    var navnOk = perm.every(function (j) { return j >= 0; }) && perm.filter(function (j, i) { return perm.indexOf(j) === i; }).length === perm.length;
    if (navnOk) return { perm: perm, navn: true };
    return { perm: fk.map(function (_, i) { return i; }), navn: false };
  }
  function sammenlignRes(fasit, svar) {
    var km = kolonneKart(fasit.kolonner, svar.kolonner);
    if (!km) return { ok: false, grunn: "kolonner", melding: "Du har " + svar.kolonner.length + (svar.kolonner.length === 1 ? " kolonne" : " kolonner") + ", fasiten har " + fasit.kolonner.length + "." + (svar.kolonner.length < fasit.kolonner.length ? " Mangler det et komma mellom to kolonner, eller en kolonne?" : ""), merknader: [] };
    var merknader = km.navn || fasit.kolonner.join(",").toLowerCase() === svar.kolonner.join(",").toLowerCase() ? [] :
      ["Kolonnenavnene er ikke de samme som i fasiten (du: " + svar.kolonner.join(", ") + ", fasiten: " + fasit.kolonner.join(", ") + "). Det teller ikke som feil."];
    var idF = fasit.kolonner.map(function (_, i) { return i; });
    var fK = fasit.rader.map(function (r) { return rk(r, idF); }), sK = svar.rader.map(function (r) { return rk(r, km.perm); });
    var teller = {}, forMange = [], mangler = [], svarMerker = {};
    fK.forEach(function (k) { teller[k] = (teller[k] || 0) + 1; });
    sK.forEach(function (k, i) { if (teller[k] > 0) { teller[k]--; svarMerker[i] = "keep"; } else { forMange.push(svar.rader[i]); svarMerker[i] = "drop"; } });
    Object.keys(teller).forEach(function (k) { var plass = fK.indexOf(k); for (var n = 0; n < teller[k]; n++) mangler.push(fasit.rader[plass]); });
    if (forMange.length || mangler.length) {
      var duplikat = forMange.length && !mangler.length && forMange.every(function (r) { return fK.indexOf(rk(r, km.perm)) >= 0; });
      var deler = [];
      if (forMange.length) deler.push("Du har " + forMange.length + (forMange.length === 1 ? " rad" : " rader") + " for mye");
      if (mangler.length) deler.push((deler.length ? "det" : "Det") + " mangler " + mangler.length + (mangler.length === 1 ? " rad" : " rader"));
      return { ok: false, grunn: duplikat ? "duplikater" : "rader", forMange: forMange, mangler: mangler, perm: km.perm, merknader: merknader, svarMerker: svarMerker,
        melding: deler.join(", og ") + "." + (duplikat ? " Radene finnes i fasiten, men for mange ganger: mangler du DISTINCT, eller gir en join duplikater?" : "") };
    }
    if (fasit.ordnet && fasit.orden && fasit.orden.length) {
      var nk = fasit.orden.map(function (o) { return o.kol; });
      var helt = nk.some(function (k) { return k == null; });
      var fN = fasit.rader.map(function (r) { return helt ? rk(r, idF) : rk(r, nk); });
      var sN = svar.rader.map(function (r) { return helt ? rk(r, km.perm) : rk(r, nk.map(function (k) { return km.perm[k]; })); });
      for (var i = 0; i < fN.length; i++) if (fN[i] !== sN[i])
        return { ok: false, grunn: "rekkefolge", forsteAvvik: i, perm: km.perm, merknader: merknader, forMange: [], mangler: [],
          melding: "Radene er riktige, men rekkefølgen avviker fra rad " + (i + 1) + ". Sjekk ORDER BY (og ASC/DESC)." };
    }
    return { ok: true, perm: km.perm, merknader: merknader, forMange: [], mangler: [] };
  }

  /* ---------------- Permutert testdatabase ----------------
     Nye verdier for heltalls-primærnøkler med én kolonne (fremmednøkler følger med), og ny radrekkefølge.
     Avslører spørringer som har hardkodet ID-er eller stoler på rekkefølgen i tabellen. */
  function permuter(db, frø) {
    var s = (frø >>> 0) || 1;
    function rnd() { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }
    function stokk(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    var kart = {}, ut = { tabeller: {}, idag: db.idag };
    Object.keys(db.tabeller).forEach(function (tn) {
      var t = db.tabeller[tn], pk = t.kolonner.map(function (c, j) { return c.pk ? j : -1; }).filter(function (j) { return j >= 0; });
      if (pk.length !== 1 || !/^int/.test(String(t.kolonner[pk[0]].type || "int"))) return;
      var j = pk[0], gamle = t.rader.map(function (r) { return r[j]; }).filter(function (v) { return v !== null; });
      var start = 100 + Math.floor(rnd() * 800), nye = stokk(gamle.map(function (_, i) { return start + i * 3 + Math.floor(rnd() * 3); }));
      var m = {}; gamle.forEach(function (v, i) { m[v] = nye[i]; });
      kart[tn + "(" + t.kolonner[j].navn + ")"] = m;
    });
    Object.keys(db.tabeller).forEach(function (tn) {
      var t = db.tabeller[tn];
      var maps = t.kolonner.map(function (c) {
        if (c.pk && kart[tn + "(" + c.navn + ")"]) return kart[tn + "(" + c.navn + ")"];
        if (c.fk) return kart[String(c.fk).toLowerCase().replace(/\s+/g, "")] || null;
        return null;
      });
      ut.tabeller[tn] = { kolonner: t.kolonner, rader: stokk(t.rader.map(function (r) { return r.map(function (v, k) { return maps[k] && v !== null && maps[k][v] != null ? maps[k][v] : v; }); })) };
    });
    return ut;
  }

  /* ---------------- Offentlig API ---------------- */
  function kjør(sql, db, opts, trace) {
    opts = opts || {};
    var p = parse(sql);
    var out = { kolonner: [], typer: [], rader: [], ordnet: false, orden: [], merknader: p.merknader.slice() };
    if (p.feil) { out.feil = p.feil; return out; }
    out.ast = p.ast; out.features = features(p.ast);
    var ctx = new Ctx(db || { tabeller: {} }, { idag: opts.idag, maksRader: opts.maksRader, trace: trace, sql: p.sql });
    try {
      var res = evalQuery(p.ast, ctx, null, null, null);
      out.kolonner = res.meta.map(function (m) { return m.navn; });
      out.typer = res.meta.map(function (m) { return m.type; });
      out.rader = res.rader;
      out.ordnet = !!(res.order && res.order.length);
      out.orden = (res.order || []).map(function (o) { return { kol: o.utRef, desc: o.desc, nulls: o.nulls }; });
      out.distinctFjernet = res.distinctFjernet; out.harDistinct = res.harDistinct;
    } catch (e) {
      if (!(e instanceof SqlFeil)) {
        if (e && (e instanceof RangeError)) out.feil = { kode: "grense", melding: "Spørringen ble for tung å regne ut. Mangler det en join-betingelse?" };
        else out.feil = { kode: "intern", melding: "Øvingen klarte ikke å kjøre denne spørringen (intern feil: " + (e && e.message) + "). Sammenlign med fasiten, og meld gjerne fra." };
        out.feil.kjorer = null;
      } else { out.feil = utFeil(e, p.sql); out.feil.kjorer = false; }
    }
    out.merknader = out.merknader.concat(ctx.merknader);
    if (trace) out.steg = ctx.trace || [];
    return out;
  }

  function lagDb(skjema, rader, idag) {
    var db = { tabeller: {}, idag: idag || null };
    (skjema.tabeller || []).forEach(function (t) {
      var r = null;
      if (rader) { r = rader[t.navn]; if (!r) Object.keys(rader).forEach(function (k) { if (!r && fold(k) === fold(t.navn)) r = rader[k]; }); }
      if (!r && t.eksempel) r = t.eksempel.rader;
      db.tabeller[String(t.navn).toLowerCase()] = { kolonner: t.kolonner.map(function (c) { return { navn: String(c.navn).toLowerCase(), type: c.type, pk: !!c.pk, fk: c.fk || null }; }), rader: (r || []).map(function (x) { return x.slice(); }) };
    });
    return db;
  }

  IN.sqlMotor = {
    run: function (sql, db, opts) { return kjør(sql, db, opts, false); },
    trace: function (sql, db, opts) { var r = kjør(sql, db, opts, true); return { steg: r.steg || [], feil: r.feil, kolonner: r.kolonner, rader: r.rader, merknader: r.merknader }; },
    parse: parse,
    features: features,
    lagDb: lagDb,
    sammenlign: sammenlignRes,
    permuter: permuter,
    tokenize: tokenize,
    normaliser: normaliser,
    MAKS_RADER: MAKS_RADER,
    _intern: { avstand: avstand, fold: fold, forslag: forslag, nokkel: nokkel, sammenlign: sammenlign }
  };
})();
