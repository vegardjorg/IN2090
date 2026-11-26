/* ============================================================
   IN2090 guide · side-ra.js  (blokk 3 · relasjonsalgebra)
   1) En liten evaluator for kursets relasjonsalgebra (ren JS, ingen avhengigheter):
      π σ ρ × ⋈ (med betingelse og naturlig) ∪ ∩ ∖ og «Navn := uttrykk».
      Mengdesemantikk: duplikater fjernes etter hver operasjon.
   2) UI: uttrykkstre med stegvis evaluering (IN.stepPlayer + IN.vizTable),
      små demoer, felle-utforsker og øving «skriv RA-uttrykket selv».

   IN.ra.parse(tekst)            → [{ navn?, expr }]   (kaster { message } ved feil)
   IN.ra.run(tekst, db)          → { verdi, steg, prog }
   IN.ra.html(expr)              → uttrykket som HTML med senket skrift
   IN.raSide.player(host, opts)  → stegspiller med tre og tabeller
   IN.raSide.mini(host, tekst, opts), .cases(host, cases), .ovelse(host, oppgaver), .lab(host)
   Klassisk script. Lastes etter core.js, stepplayer.js, viz-relation.js og data-ra.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  /* ================= Evaluator ================= */
  function Err(msg) { this.message = msg; }
  function fail(msg) { throw new Err(msg); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function low(s) { return String(s).toLowerCase(); }

  /* ---------- Tokenizer ---------- */
  var IDSTART = /[A-Za-zÆØÅæøåÄÖÜäöüÉé_]/, IDCHAR = /[A-Za-zÆØÅæøåÄÖÜäöüÉé_0-9.]/;
  var QUOTES = "'’‘\"´`";
  function tokenize(src) {
    var out = [], i = 0, n = src.length;
    while (i < n) {
      var c = src[i];
      if (/\s/.test(c)) { if (c === "\n") out.push({ k: "nl" }); i++; continue; }
      if (c === ";") { out.push({ k: "nl" }); i++; continue; }
      var two = src.substr(i, 2);
      if (two === ":=") { out.push({ k: "sym", v: ":=" }); i += 2; continue; }
      if (two === "->") { out.push({ k: "sym", v: "→" }); i += 2; continue; }
      if (two === "<=") { out.push({ k: "sym", v: "≤" }); i += 2; continue; }
      if (two === ">=") { out.push({ k: "sym", v: "≥" }); i += 2; continue; }
      if (two === "!=" || two === "<>") { out.push({ k: "sym", v: "≠" }); i += 2; continue; }
      if (c === "_" && (src[i + 1] === "{" || src[i + 1] === "[")) { out.push({ k: "sym", v: "SUB(" }); i += 2; continue; }
      if (c === "{" || c === "[") { out.push({ k: "sym", v: "SUB(" }); i++; continue; }
      if (c === "}" || c === "]") { out.push({ k: "sym", v: "SUB)" }); i++; continue; }
      if (QUOTES.indexOf(c) >= 0) {
        var j = i + 1, s = "";
        while (j < n && QUOTES.indexOf(src[j]) < 0) s += src[j++];
        if (j >= n) fail("En tekstkonstant mangler avsluttende fnutt: '" + s);
        out.push({ k: "str", v: s }); i = j + 1; continue;
      }
      if (/[0-9]/.test(c)) {
        var m = /^[0-9]+(\.[0-9]+)?/.exec(src.slice(i));
        out.push({ k: "num", v: m[0] }); i += m[0].length; continue;
      }
      if (IDSTART.test(c)) {
        var k = i;
        while (k < n && IDCHAR.test(src[k])) k++;
        var id = src.slice(i, k);
        // pi_{…}: understreken hører til senket skrift, ikke til navnet
        if (/_$/.test(id) && (src[k] === "{" || src[k] === "[")) { id = id.slice(0, -1); k--; }
        id = id.replace(/\.$/, "");
        out.push({ k: "id", v: id }); i = i + id.length; continue;
      }
      var map = { "π": "π", "σ": "σ", "ρ": "ρ", "×": "×", "⋈": "⋈", "⨝": "⋈", "⋆": "⋆", "*": "⋆", "∪": "∪", "∩": "∩",
        "∖": "∖", "\\": "∖", "−": "∖", "-": "∖", "(": "(", ")": ")", ",": ",", "=": "=", "≠": "≠", "<": "<", ">": ">",
        "≤": "≤", "≥": "≥", "¬": "¬", "!": "¬", "∧": "∧", "∨": "∨", "→": "→" };
      if (map[c]) { out.push({ k: "sym", v: map[c] }); i++; continue; }
      fail("Ukjent tegn «" + c + "».");
    }
    return out;
  }

  /* ---------- Parser ---------- */
  var KW = { pi: "π", sigma: "σ", rho: "ρ", union: "∪", snitt: "∩", intersect: "∩", minus: "∖", except: "∖",
    join: "⋈", natjoin: "⋆", x: "×", and: "∧", og: "∧", or: "∨", eller: "∨", not: "¬", ikke: "¬" };
  function kw(t) { return t && t.k === "id" ? KW[low(t.v)] || null : null; }

  function Parser(toks) { this.t = toks; this.i = 0; this.nid = 0; }
  Parser.prototype.peek = function (o) { return this.t[this.i + (o || 0)]; };
  Parser.prototype.isSym = function (v, o) { var t = this.peek(o); return !!t && t.k === "sym" && t.v === v; };
  Parser.prototype.eat = function (v, hva) {
    if (this.isSym(v)) return this.t[this.i++];
    var t = this.peek();
    fail("Forventet «" + (v === "SUB(" ? "_{" : v === "SUB)" ? "}" : v) + "»" + (hva ? " " + hva : "") + (t ? ", men fant «" + (t.v || "linjeskift") + "»." : ", men uttrykket sluttet."));
  };
  Parser.prototype.node = function (o) { o.id = this.nid++; return o; };
  Parser.prototype.opAt = function () {
    var t = this.peek();
    if (!t) return null;
    if (t.k === "sym") return t.v;
    return kw(t);
  };
  Parser.prototype.program = function () {
    var stm = [];
    while (this.i < this.t.length) {
      if (this.peek().k === "nl") { this.i++; continue; }
      var navn = null;
      if (this.peek().k === "id" && this.isSym(":=", 1)) { navn = this.peek().v; this.i += 2; }
      this.nid = 0;
      var e = this.setExpr();
      if (this.i < this.t.length && this.peek().k !== "nl") fail("Uventet «" + this.peek().v + "» etter et ferdig uttrykk. Mangler det en operator eller en parentes?");
      stm.push({ navn: navn, expr: e });
    }
    if (!stm.length) fail("Skriv et uttrykk først.");
    return stm;
  };
  Parser.prototype.setExpr = function () {
    var l = this.joinExpr();
    for (;;) {
      var op = this.opAt();
      if (op !== "∪" && op !== "∩" && op !== "∖") return l;
      this.i++;
      var r = this.joinExpr();
      l = this.node({ t: "bin", op: op, l: l, r: r });
    }
  };
  Parser.prototype.joinExpr = function () {
    var l = this.unary();
    for (;;) {
      var op = this.opAt();
      if (op !== "×" && op !== "⋈" && op !== "⋆") return l;
      this.i++;
      if (op === "⋈" && this.isSym("SUB(")) {
        this.i++;
        var c = this.cond();
        this.eat("SUB)", "etter join-betingelsen");
        l = this.node({ t: "bin", op: "⋈θ", cond: c, l: l, r: this.unary() });
      } else l = this.node({ t: "bin", op: op === "×" ? "×" : "⋈", l: l, r: this.unary() });
    }
  };
  Parser.prototype.unary = function () {
    var t = this.peek();
    if (!t) fail("Uttrykket sluttet for tidlig.");
    var op = t.k === "sym" ? t.v : kw(t);
    if (op === "π" || op === "σ" || op === "ρ") {
      this.i++;
      if (!this.isSym("SUB(")) fail(op + " trenger noe i senket skrift, for eksempel " + (op === "π" ? "π_{navn}(R)" : op === "σ" ? "σ_{by = 'Oslo'}(R)" : "ρ_{navn→fornavn}(R)") + ".");
      this.i++;
      var node;
      if (op === "π") node = { t: "proj", attrs: this.refList() };
      else if (op === "σ") node = { t: "sel", cond: this.cond() };
      else node = { t: "ren", pairs: this.renList() };
      this.eat("SUB)", "etter den senkede skriften til " + op);
      node.arg = this.unary();
      return this.node(node);
    }
    if (t.k === "sym" && t.v === "(") {
      this.i++;
      var e = this.setExpr();
      this.eat(")", "for å lukke parentesen");
      return e;
    }
    if (t.k === "id") { this.i++; return this.node({ t: "rel", name: t.v }); }
    fail("Forventet en relasjon, en parentes eller π/σ/ρ, men fant «" + (t.v || "linjeskift") + "».");
  };
  Parser.prototype.ref = function () {
    var t = this.peek();
    if (!t || t.k !== "id") fail("Forventet et attributtnavn" + (t ? ", men fant «" + (t.v || "linjeskift") + "»." : "."));
    this.i++;
    return t.v;
  };
  Parser.prototype.refList = function () {
    var a = [this.ref()];
    while (this.isSym(",")) { this.i++; a.push(this.ref()); }
    return a;
  };
  Parser.prototype.renList = function () {
    var a = [];
    do {
      if (a.length) this.i++;
      var from = this.ref();
      if (!this.isSym("→")) fail("ρ skrives attributt→nytt navn, for eksempel ρ_{navn→fornavn}(R).");
      this.i++;
      a.push([from, this.ref()]);
    } while (this.isSym(","));
    return a;
  };
  Parser.prototype.cond = function () {
    var l = this.condAnd();
    while (this.opAt() === "∨") { this.i++; l = { t: "or", a: l, b: this.condAnd() }; }
    return l;
  };
  Parser.prototype.condAnd = function () {
    var l = this.condNot();
    while (this.opAt() === "∧") { this.i++; l = { t: "and", a: l, b: this.condNot() }; }
    return l;
  };
  Parser.prototype.condNot = function () {
    if (this.opAt() === "¬") { this.i++; return { t: "not", a: this.condNot() }; }
    if (this.isSym("(")) {
      // ( betingelse )  – men ( kan også starte en operand i en sammenligning; vi har ingen aritmetikk, så det er alltid en betingelse
      this.i++;
      var c = this.cond();
      this.eat(")", "i betingelsen");
      return c;
    }
    var l = this.operand();
    var op = this.opAt();
    if (["=", "≠", "<", ">", "≤", "≥"].indexOf(op) < 0) fail("Forventet en sammenligning (=, ≠, <, >, ≤, ≥) i betingelsen" + (this.peek() ? ", men fant «" + (this.peek().v || "linjeskift") + "»." : "."));
    this.i++;
    return { t: "cmp", op: op, l: l, r: this.operand() };
  };
  Parser.prototype.operand = function () {
    var t = this.peek();
    if (!t) fail("Betingelsen sluttet for tidlig.");
    if (t.k === "str") { this.i++; return { t: "lit", v: t.v, str: true }; }
    if (t.k === "num") { this.i++; return { t: "lit", v: +t.v, str: false }; }
    if (t.k === "id") { this.i++; return { t: "attr", ref: t.v }; }
    fail("Forventet et attributt eller en konstant i betingelsen, men fant «" + (t.v || "linjeskift") + "».");
  };

  /* ---------- Relasjoner som verdier ---------- */
  // { cols: [{ n, t }], rows: [[…]] }  · n = attributtnavn, t = relasjonen kolonnen kommer fra
  function key(r) { return JSON.stringify(r.map(function (v) { return v == null ? null : String(v); })); }
  function dedupe(rows) {
    var seen = {}, out = [];
    rows.forEach(function (r) { var k = key(r); if (!seen[k]) { seen[k] = 1; out.push(r); } });
    return out;
  }
  function colNames(rel) {
    return rel.cols.map(function (c) {
      var dup = rel.cols.filter(function (d) { return low(d.n) === low(c.n); }).length > 1;
      return dup && c.t ? c.t + "." + c.n : c.n;
    });
  }
  function resolve(rel, ref) {
    var dot = ref.lastIndexOf("."), t = dot > 0 ? ref.slice(0, dot) : null, n = dot > 0 ? ref.slice(dot + 1) : ref;
    var hits = [];
    rel.cols.forEach(function (c, i) { if (low(c.n) === low(n) && (!t || low(c.t || "") === low(t))) hits.push(i); });
    if (hits.length === 1) return hits[0];
    var navn = colNames(rel).join(", ");
    if (!hits.length) fail("Finner ikke attributtet «" + ref + "». Her finnes: " + navn + ".");
    if (t) fail("«" + ref + "» passer på flere kolonner. Begge sidene har " + n + " fra " + t + ". Bruk ρ for å gi den ene et annet navn.");
    fail("«" + ref + "» er tvetydig: det finnes flere kolonner som heter " + n + ". Skriv tabellnavnet foran, for eksempel " + colNames(rel).filter(function (x) { return low(x.split(".").pop()) === low(n); })[0] + ".");
  }
  function num(v) { return typeof v === "number" ? v : /^-?[0-9]+(\.[0-9]+)?$/.test(String(v)) ? +v : NaN; }
  function cmpVals(a, op, b) {
    var x = num(a), y = num(b), c;
    if (!isNaN(x) && !isNaN(y)) c = x < y ? -1 : x > y ? 1 : 0;
    else { a = String(a); b = String(b); c = a < b ? -1 : a > b ? 1 : 0; }
    return op === "=" ? c === 0 : op === "≠" ? c !== 0 : op === "<" ? c < 0 : op === ">" ? c > 0 : op === "≤" ? c <= 0 : c >= 0;
  }
  function compileCond(cond, rel) {
    function opnd(o) {
      if (o.t === "lit") return function () { return o.v; };
      var i = resolve(rel, o.ref);
      return function (r) { return r[i]; };
    }
    if (cond.t === "cmp") { var l = opnd(cond.l), r = opnd(cond.r); return function (row) { return cmpVals(l(row), cond.op, r(row)); }; }
    if (cond.t === "not") { var a = compileCond(cond.a, rel); return function (row) { return !a(row); }; }
    var x = compileCond(cond.a, rel), y = compileCond(cond.b, rel);
    return cond.t === "and" ? function (row) { return x(row) && y(row); } : function (row) { return x(row) || y(row); };
  }

  /* ---------- Tekst og HTML for uttrykk ---------- */
  function opndStr(o) { return o.t === "lit" ? (o.str ? "'" + o.v + "'" : String(o.v)) : o.ref; }
  function condStr(c, parent) {
    if (c.t === "cmp") return opndStr(c.l) + " " + c.op + " " + opndStr(c.r);
    if (c.t === "not") return "¬(" + condStr(c.a) + ")";
    var s = condStr(c.a, c.t) + (c.t === "and" ? " ∧ " : " ∨ ") + condStr(c.b, c.t);
    return parent === "and" && c.t === "or" ? "(" + s + ")" : s;
  }
  function subHtml(node) {
    if (node.t === "proj") return node.attrs.join(", ");
    if (node.t === "sel" || node.op === "⋈θ") return condStr(node.cond);
    if (node.t === "ren") return node.pairs.map(function (p) { return p[0] + "→" + p[1]; }).join(", ");
    return "";
  }
  function opSym(node) { return node.t === "proj" ? "π" : node.t === "sel" ? "σ" : node.t === "ren" ? "ρ" : node.op === "⋈θ" ? "⋈" : node.op; }
  function label(node) {
    if (node.t === "rel") return esc(node.name);
    var s = subHtml(node);
    return opSym(node) + (s ? "<sub>" + esc(s) + "</sub>" : "");
  }
  function prec(node) { return node.t !== "bin" ? 3 : /^(∪|∩|∖)$/.test(node.op) ? 1 : 2; }
  function html(node) {
    if (node.t === "rel") return esc(node.name);
    if (node.t !== "bin") return label(node) + "(" + html(node.arg) + ")";
    var l = html(node.l), r = html(node.r);
    if (prec(node.l) < prec(node)) l = "(" + l + ")";
    if (node.r.t === "bin") r = "(" + r + ")";
    return l + " " + label(node) + " " + r;
  }
  function short(node) {
    if (node.t === "rel") return esc(node.name);
    if (node.t !== "bin") return label(node) + "(…)";
    return (node.l.t === "rel" ? esc(node.l.name) : "…") + " " + label(node) + " " + (node.r.t === "rel" ? esc(node.r.name) : "…");
  }

  /* ---------- Evaluering med steg ---------- */
  function lookup(name, env, db) {
    var k = Object.keys(env).filter(function (x) { return low(x) === low(name); })[0];
    if (k) return { v: env[k], navn: k, egen: true };
    k = Object.keys(db).filter(function (x) { return low(x) === low(name); })[0];
    if (!k) fail("Finner ingen relasjon som heter «" + name + "». Tabellene er: " + Object.keys(db).concat(Object.keys(env)).join(", ") + ".");
    var t = db[k];
    return { v: { cols: t.kolonner.map(function (c) { return { n: typeof c === "string" ? c : c.navn, t: k }; }), rows: t.rader.map(function (r) { return r.slice(); }) }, navn: k, pk: t.pk };
  }
  function signature(rel) { return rel.cols.map(function (c) { return low(c.n); }); }
  function plural(n, en, flere) { return n + " " + (n === 1 ? en : flere); }
  function T(eli5, normal, teknisk) { return { eli5: eli5, normal: normal, teknisk: teknisk }; }

  function evalNode(node, env, db, steps, stmt) {
    if (node.t === "rel") { var lk = lookup(node.name, env, db); node._val = lk.v; node._pk = lk.pk; return lk.v; }
    if (node.t !== "bin") {
      var a = evalNode(node.arg, env, db, steps, stmt), s = { stmt: stmt, node: node.id, ins: [], out: null };
      if (node.t === "sel") {
        var f = compileCond(node.cond, a), keep = {}, rows = [];
        a.rows.forEach(function (r, i) { if (f(r)) { keep[i] = "keep"; rows.push(r); } else keep[i] = "drop"; });
        var v = { cols: a.cols, rows: rows }, c = esc(condStr(node.cond));
        s.ins.push({ node: node.arg, v: a, rader: keep });
        s.tag = "σ: velg rader";
        s.text = T(
          "<p>Vi ser på radene én og én og beholder bare dem der <span class=\"mono\">" + c + "</span> stemmer. " + plural(rows.length, "rad", "rader") + " av " + a.rows.length + " slapp gjennom. Kolonnene er de samme som før.</p>",
          "<p>σ beholder radene der <span class=\"mono\">" + c + "</span> er sann: " + rows.length + " av " + a.rows.length + ". Alle kolonnene blir med videre.</p>",
          "<p><span class=\"mono\">σ<sub>" + c + "</sub>(R) = { t ∈ R | betingelsen holder for t }</span>. Signaturen er uendret, og " + rows.length + " av " + a.rows.length + " tupler oppfyller betingelsen.</p>");
        node._val = v; s.out = v; steps.push(s); return v;
      }
      if (node.t === "proj") {
        var idx = node.attrs.map(function (r) { return resolve(a, r); });
        var all = a.rows.map(function (r) { return idx.map(function (i) { return r[i]; }); });
        var pv = { cols: idx.map(function (i) { return a.cols[i]; }), rows: dedupe(all) };
        var kolm = {}, an = colNames(a);
        an.forEach(function (n, i) { kolm[n] = idx.indexOf(i) >= 0 ? "sel" : "drop"; });
        s.ins.push({ node: node.arg, v: a, kolonner: kolm });
        var dup = all.length - pv.rows.length, lst = esc(node.attrs.join(", "));
        s.tag = "π: velg kolonner";
        s.text = T(
          "<p>Vi klipper bort alle kolonnene unntatt <span class=\"mono\">" + lst + "</span>." + (dup ? " Da ble noen rader helt like, og like rader teller bare én gang. Derfor ble " + all.length + " rader til " + pv.rows.length + "." : "") + "</p>",
          "<p>π beholder bare <span class=\"mono\">" + lst + "</span>." + (dup ? " " + plural(dup, "rad", "rader") + " ble like og forsvant, fordi resultatet er en mengde (" + all.length + " → " + pv.rows.length + "). I SQL måtte du skrevet <span class=\"mono\">SELECT DISTINCT</span> for å få det samme." : " Ingen rader ble like, så antallet er det samme.") + "</p>",
          "<p><span class=\"mono\">π<sub>" + lst + "</sub>(R) = { t[" + lst + "] | t ∈ R }</span>. Relasjonsalgebra er mengdebasert, så duplikater fjernes" + (dup ? ": " + all.length + " tupler gir " + pv.rows.length + " ulike." : ". Her ble ingen tupler like.") + "</p>");
        node._val = pv; s.out = pv; steps.push(s); return pv;
      }
      // ρ
      var cols = a.cols.map(function (c) { return { n: c.n, t: c.t }; }), nye = {};
      node.pairs.forEach(function (p) { var i = resolve(a, p[0]); cols[i] = { n: p[1], t: a.cols[i].t }; nye[i] = 1; });
      var rv = { cols: cols, rows: a.rows };
      s.ins.push({ node: node.arg, v: a });
      s.outCols = nye;
      var par = esc(node.pairs.map(function (p) { return p[0] + " → " + p[1]; }).join(", "));
      s.tag = "ρ: gi nytt navn";
      s.text = T(
        "<p>Vi bytter bare navnelappen på kolonnen (" + par + "). Innholdet i radene er akkurat det samme.</p>",
        "<p>ρ gir nye attributtnavn (" + par + "). Radene er uendret. Omdøping brukes for å styre hva naturlig join kobler på, eller for å gjøre to relasjoner union-kompatible.</p>",
        "<p><span class=\"mono\">ρ<sub>A→B</sub></span> endrer bare signaturen. Det er nyttig foran ⋈ (styre hvilke navn som er like) og foran ∪, ∩ og ∖, som krever samme signatur.</p>");
      node._val = rv; s.out = rv; steps.push(s); return rv;
    }
    // Binære
    var L = evalNode(node.l, env, db, steps, stmt), R = evalNode(node.r, env, db, steps, stmt);
    var st = { stmt: stmt, node: node.id, ins: [{ node: node.l, v: L }, { node: node.r, v: R }], out: null };
    var nL = L.rows.length, nR = R.rows.length, out;
    if (node.op === "×" || node.op === "⋈θ") {
      var pc = { cols: L.cols.concat(R.cols), rows: [] };
      L.rows.forEach(function (a1) { R.rows.forEach(function (b1) { pc.rows.push(a1.concat(b1)); }); });
      if (node.op === "×") {
        out = pc;
        st.tag = "×: alle kombinasjoner";
        st.text = T(
          "<p>Hver rad til venstre settes sammen med hver rad til høyre, som å lage alle mulige par. " + nL + " · " + nR + " = " + pc.rows.length + " rader. Mange av parene hører ikke sammen. Det fikser vi med en σ etterpå.</p>",
          "<p>Kryssproduktet tar med alle attributtene fra begge sider og alle kombinasjoner av rader: " + nL + " · " + nR + " = " + pc.rows.length + ". Kolonner med samme navn skilles med relasjonsnavnet foran.</p>",
          "<p><span class=\"mono\">R × S</span> har signaturen til R etterfulgt av S og " + nL + " · " + nR + " = " + pc.rows.length + " tupler. Det tilsvarer <span class=\"mono\">FROM R, S</span> i SQL.</p>");
      } else {
        var g = compileCond(node.cond, pc), jr = pc.rows.filter(g), cc = esc(condStr(node.cond));
        out = { cols: pc.cols, rows: jr };
        st.tag = "⋈ med betingelse";
        st.text = T(
          "<p>Vi lager alle par av rader (" + nL + " · " + nR + " = " + pc.rows.length + ") og beholder bare parene der <span class=\"mono\">" + cc + "</span> stemmer. " + plural(jr.length, "par", "par") + " hører sammen.</p>",
          "<p>Join med betingelse: av " + pc.rows.length + " kombinasjoner oppfyller " + jr.length + " betingelsen <span class=\"mono\">" + cc + "</span>. Alle attributtene fra begge sider er med, også begge kopiene av en kolonne med samme navn.</p>",
          "<p><span class=\"mono\">R ⋈<sub>" + cc + "</sub> S ≡ σ<sub>" + cc + "</sub>(R × S)</span>: " + pc.rows.length + " tupler i produktet, " + jr.length + " oppfyller betingelsen. Det tilsvarer <span class=\"mono\">R JOIN S ON (" + cc + ")</span>.</p>");
      }
    } else if (node.op === "⋈") {
      var sl = signature(L), sr = signature(R), common = [];
      sl.forEach(function (n, i) { var j = sr.indexOf(n); if (j >= 0) common.push([i, j]); });
      common.forEach(function (p) {
        if (sl.filter(function (x) { return x === sl[p[0]]; }).length > 1 || sr.filter(function (x) { return x === sr[p[1]]; }).length > 1)
          fail("Naturlig join: «" + L.cols[p[0]].n + "» finnes flere ganger på én av sidene. Bruk ρ eller π først, så det bare finnes én.");
      });
      var dropR = common.map(function (p) { return p[1]; });
      var ocols = L.cols.concat(R.cols.filter(function (_, j) { return dropR.indexOf(j) < 0; }));
      var orows = [];
      L.rows.forEach(function (a2) {
        R.rows.forEach(function (b2) {
          if (common.every(function (p) { return String(a2[p[0]]) === String(b2[p[1]]); }))
            orows.push(a2.concat(b2.filter(function (_, j) { return dropR.indexOf(j) < 0; })));
        });
      });
      out = { cols: ocols, rows: dedupe(orows) };
      var navn = common.map(function (p) { return L.cols[p[0]].n; });
      st.common = navn;
      if (!common.length) {
        st.tag = "Felle: ingen felles attributter";
        st.kind = "swap";
        st.text = T(
          "<p>Naturlig join kobler på kolonner som heter det samme. Her heter <b>ingen</b> kolonner det samme, så det finnes ingenting å koble på. Da blir hver rad satt sammen med hver rad: " + nL + " · " + nR + " = " + out.rows.length + " rader. Det er nesten aldri det du vil.</p>",
          "<p><b>Ingen felles attributtnavn.</b> Da blir naturlig join det samme som kryssproduktet: " + nL + " · " + nR + " = " + out.rows.length + " rader. Bruk ρ for å gi kolonnene du vil koble på samme navn, eller skriv join med betingelse.</p>",
          "<p>Med tom mengde felles attributter er betingelsen i naturlig join tom (alltid sann), så <span class=\"mono\">R ⋈ S = R × S</span>, her " + out.rows.length + " tupler. Lysarket om naturlig join sier dette rett ut.</p>");
      } else {
        var nm = esc(navn.join(", "));
        st.tag = common.length > 1 ? "Naturlig join på " + common.length + " attributter" : "Naturlig join";
        if (common.length > 1) st.kind = "swap";
        st.text = T(
          "<p>Vi setter sammen rader som har lik verdi i kolonnen" + (common.length > 1 ? "e" : "") + " <span class=\"mono\">" + nm + "</span>, og tar bare med kolonnen én gang. " + plural(out.rows.length, "rad", "rader") + " passet." + (common.length > 1 ? " Pass på: <b>alle</b> kolonnene med likt navn må være like. Var det meningen?" : "") + "</p>",
          "<p>Naturlig join kobler på alle attributter med likt navn: <span class=\"mono\">" + nm + "</span>. Felles attributter tas med én gang. " + plural(out.rows.length, "rad", "rader") + "." + (common.length > 1 ? " <b>Sjekk at du mente å koble på alle disse.</b> Heter to kolonner tilfeldigvis det samme (som <span class=\"mono\">navn</span>), må du bruke ρ først." : "") + "</p>",
          "<p><span class=\"mono\">R ⋈ S</span> = π over alle attributtene (felles én gang) av <span class=\"mono\">σ<sub>R.A = S.A for alle felles A</sub>(R × S)</span>. Felles her: <span class=\"mono\">" + nm + "</span>, " + plural(out.rows.length, "tuppel", "tupler") + ".</p>");
      }
      st.ins[0].kolonner = {}; st.ins[1].kolonner = {};
      var ln = colNames(L), rn = colNames(R);
      common.forEach(function (p) { st.ins[0].kolonner[ln[p[0]]] = "sel"; st.ins[1].kolonner[rn[p[1]]] = "sel"; });
    } else {
      var a3 = signature(L), b3 = signature(R);
      var same = a3.length === b3.length && a3.every(function (n) { return b3.indexOf(n) >= 0 && a3.filter(function (x) { return x === n; }).length === 1; });
      if (!same) fail("«" + node.op + "» krever samme signatur på begge sider. Venstre har (" + colNames(L).join(", ") + "), høyre har (" + colNames(R).join(", ") + "). Bruk π og ρ så de får de samme attributtnavnene.");
      var perm = a3.map(function (n) { return b3.indexOf(n); });
      var Rr = R.rows.map(function (r) { return perm.map(function (j) { return r[j]; }); });
      var rk = {}; Rr.forEach(function (r) { rk[key(r)] = 1; });
      var lk2 = {}; L.rows.forEach(function (r) { lk2[key(r)] = 1; });
      var mL = {}, mR = {};
      if (node.op === "∪") {
        out = { cols: L.cols, rows: dedupe(L.rows.concat(Rr)) };
        R.rows.forEach(function (r, j) { mR[j] = lk2[key(Rr[j])] ? "drop" : "new"; });
        st.tag = "∪: union";
        st.text = T(
          "<p>Vi legger radene fra begge sider i samme haug. En rad som finnes på begge sider, tas bare med én gang. Resultatet har " + plural(out.rows.length, "rad", "rader") + ".</p>",
          "<p>Union gir alle rader som finnes i minst én av relasjonene: " + nL + " + " + nR + " rader, men like rader telles én gang, så resultatet har " + out.rows.length + ". Grønne rader er nye fra høyre side, overstrekte fantes allerede.</p>",
          "<p><span class=\"mono\">R ∪ S = { t | t ∈ R ∨ t ∈ S }</span>. Krever samme signatur. Svarer til <span class=\"mono\">UNION</span> i SQL, som også fjerner duplikater.</p>");
      } else if (node.op === "∩") {
        out = { cols: L.cols, rows: L.rows.filter(function (r) { return rk[key(r)]; }) };
        L.rows.forEach(function (r, i) { mL[i] = rk[key(r)] ? "keep" : "drop"; });
        st.tag = "∩: snitt";
        st.text = T(
          "<p>Vi beholder bare radene som står på <b>begge</b> sider. " + plural(out.rows.length, "rad", "rader") + " finnes i begge.</p>",
          "<p>Snitt gir radene som finnes i begge relasjonene: " + out.rows.length + " av " + nL + " rader til venstre finnes også til høyre.</p>",
          "<p><span class=\"mono\">R ∩ S = { t | t ∈ R ∧ t ∈ S }</span>. Krever samme signatur. Svarer til <span class=\"mono\">INTERSECT</span>.</p>");
      } else {
        out = { cols: L.cols, rows: L.rows.filter(function (r) { return !rk[key(r)]; }) };
        L.rows.forEach(function (r, i) { mL[i] = rk[key(r)] ? "drop" : "keep"; });
        st.tag = "∖: differanse";
        st.text = T(
          "<p>Vi tar radene til venstre og stryker alle som også står til høyre. Igjen blir " + plural(out.rows.length, "rad", "rader") + ".</p>",
          "<p>Differansen gir radene til venstre som <b>ikke</b> finnes til høyre: " + out.rows.length + " av " + nL + ". Rekkefølgen betyr noe: R ∖ S er ikke det samme som S ∖ R.</p>",
          "<p><span class=\"mono\">R ∖ S = { t | t ∈ R ∧ t ∉ S }</span>. Krever samme signatur. Svarer til <span class=\"mono\">EXCEPT</span>. Differanse er måten å si «ingen» og «bare» på i relasjonsalgebra.</p>");
      }
      st.ins[0].rader = mL; st.ins[1].rader = mR;
    }
    node._val = out; st.out = out; steps.push(st); return out;
  }

  function walk(node, fn) { fn(node); if (node.arg) walk(node.arg, fn); if (node.l) { walk(node.l, fn); walk(node.r, fn); } }
  function leaves(node) { var a = []; walk(node, function (x) { if (x.t === "rel") a.push(x); }); return a; }

  IN.ra = {
    parse: function (src) { return new Parser(tokenize(String(src || ""))).program(); },
    run: function (src, db) {
      var prog = IN.ra.parse(src), env = {}, steps = [], last = null;
      prog.forEach(function (stm, si) {
        var start = { stmt: si, node: -1, start: true, ins: [], out: null };
        steps.push(start);
        var before = steps.length;
        last = evalNode(stm.expr, env, db, steps, si);
        if (stm.expr.t === "rel") steps.push({ stmt: si, node: stm.expr.id, ins: [], out: last, tag: "Bare en relasjon", text: T("<p>Uttrykket er bare tabellen selv.</p>", "<p>Uttrykket er bare relasjonen, uten operatorer.</p>", "<p>En relasjon alene er også et gyldig uttrykk.</p>") });
        var bl = leaves(stm.expr).map(function (x) { return x.name; });
        start.tag = stm.navn ? "Nytt navn: " + stm.navn : (prog.length > 1 ? "Siste uttrykk" : "Uttrykket som tre");
        start.text = T(
          "<p>Treet leses nedenfra og opp. Nederst står tabellene (" + esc(bl.join(", ")) + "). Hver boks over gjør noe med det som kommer nedenfra.</p>",
          "<p>Bladene er relasjonene (" + esc(bl.join(", ")) + "). Hver indre node er en operator som tar resultatet fra barna. Vi evaluerer nedenfra og opp, " + plural(steps.length - before, "operator", "operatorer") + " i alt." + (stm.navn ? " Resultatet får navnet <span class=\"mono\">" + esc(stm.navn) + "</span> og kan brukes i senere uttrykk." : "") + "</p>",
          "<p>Uttrykket er et tre der bladene er relasjonsnavn og de indre nodene er operatorer. Hver operator tar én eller to relasjoner og gir en ny relasjon, så nodene kan settes sammen fritt (algebraen er lukket)." + (stm.navn ? " <span class=\"mono\">" + esc(stm.navn) + " := …</span> gir resultatet et navn." : "") + "</p>");
        if (stm.navn) {
          env[stm.navn] = { cols: last.cols.map(function (c) { return { n: c.n, t: stm.navn }; }), rows: last.rows };
        }
      });
      var fin = { stmt: prog.length - 1, node: -2, ins: [], out: last, tag: "Ferdig", kind: "sorted",
        text: T("<p>Dette er svaret: " + plural(last.rows.length, "rad", "rader") + ".</p>",
          "<p>Resultatet har " + plural(last.rows.length, "rad", "rader") + " og attributtene " + esc(colNames(last).join(", ")) + ".</p>",
          "<p>Resultatrelasjonen har signaturen (" + esc(colNames(last).join(", ")) + ") og " + plural(last.rows.length, "tuppel", "tupler") + ". Den er en mengde.</p>") };
      steps.push(fin);
      return { verdi: last, steg: steps, prog: prog };
    },
    html: html, label: label, condStr: condStr, colNames: colNames, key: key,
    /* Sammenlign to resultater som mengder. Kolonner matches på navn; ellers på plass. */
    compare: function (a, b) {
      var an = signature(a), bn = signature(b);
      if (an.length !== bn.length) return { ok: false, why: "kol", msg: "Du har " + plural(an.length, "kolonne", "kolonner") + " (" + colNames(a).join(", ") + "), men svaret skal ha " + bn.length + " (" + colNames(b).join(", ") + ")." };
      var sameNames = an.every(function (n) { return bn.indexOf(n) >= 0; });
      var perm = sameNames ? bn.map(function (n) { return an.indexOf(n); }) : bn.map(function (_, i) { return i; });
      var ak = {}, bk = {};
      a.rows.forEach(function (r) { ak[key(perm.map(function (j) { return r[j]; }))] = 1; });
      b.rows.forEach(function (r) { bk[key(r)] = 1; });
      var miss = Object.keys(bk).filter(function (k) { return !ak[k]; }), extra = Object.keys(ak).filter(function (k) { return !bk[k]; });
      if (!miss.length && !extra.length) return { ok: true, names: sameNames, msg: sameNames ? "" : "Radene stemmer, men kolonnene heter (" + colNames(a).join(", ") + "), mens forslaget bruker (" + colNames(b).join(", ") + "). Det er greit når det er tydelig hva du mener." };
      function show(ks) { return ks.slice(0, 3).map(function (k) { return "(" + JSON.parse(k).join(", ") + ")"; }).join(", ") + (ks.length > 3 ? " …" : ""); }
      return { ok: false, why: "rader", msg: (miss.length ? "Mangler " + plural(miss.length, "rad", "rader") + ": " + show(miss) + ". " : "") + (extra.length ? "Har " + plural(extra.length, "rad", "rader") + " for mye: " + show(extra) + "." : "") };
    }
  };

  /* ================= UI ================= */
  if (typeof document === "undefined") return;
  var el = IN.el, clear = IN.clear;
  var MAXROWS = 30;

  function relToTable(v, navn, marks, pk) {
    var names = colNames(v), rows = v.rows, cap = null;
    if (rows.length > MAXROWS) { cap = "Viser " + MAXROWS + " av " + rows.length + " rader."; rows = rows.slice(0, MAXROWS); }
    return { navn: navn, kolonner: names.map(function (n) { return { navn: n, pk: pk && pk.indexOf(n) >= 0 }; }), rader: rows, marks: marks || null, caption: cap, tom: "(tom relasjon, ingen rader)" };
  }

  /* ---------- Tre ---------- */
  function layout(root) {
    var nodes = [], leafN = 0, depth = 0;
    (function place(n, d) {
      depth = Math.max(depth, d);
      var kids = n.t === "rel" ? [] : n.arg ? [n.arg] : [n.l, n.r];
      kids.forEach(function (k) { place(k, d + 1); });
      n._d = d;
      n._x = kids.length ? kids.reduce(function (s, k) { return s + k._x; }, 0) / kids.length : leafN++ + 0.5;
      n._kids = kids;
      nodes.push(n);
    })(root, 0);
    return { nodes: nodes, leaves: leafN, depth: depth };
  }
  function textLen(n) { var s = n.t === "rel" ? n.name : subHtml(n); return String(s).length + 2; }
  function drawTree(host, root, state, onPick) {
    var L = layout(root);
    /* Bredden per blad styres av blader og binære noder. Unære noder står alene på sin rad over barnet og får bredere plass. */
    function unary(n) { return n.t !== "rel" && !!n.arg; }
    var px = function (n) { return textLen(n) * 7.2 + 16; };
    var slot = Math.min(230, Math.max(96, Math.max.apply(null, L.nodes.filter(function (n) { return !unary(n); }).map(px))));
    var uMax = Math.min(260, Math.max.apply(null, [0].concat(L.nodes.filter(unary).map(px))));
    var W = Math.max(L.leaves * slot, uMax + 16, 160), ROW = 58, H = (L.depth + 1) * ROW + 6;
    var wrap = el("div", { class: "ra-tree-scroll" });
    var box = el("div", { class: "ra-tree", style: "width:" + W + "px;height:" + H + "px" });
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", W); svg.setAttribute("height", H); svg.setAttribute("aria-hidden", "true");
    function X(n) { return n._x * slot; }
    function Y(n) { return n._d * ROW + 22; }
    L.nodes.forEach(function (n) {
      n._kids.forEach(function (k) {
        var ln = document.createElementNS(NS, "line");
        ln.setAttribute("x1", X(n)); ln.setAttribute("y1", Y(n)); ln.setAttribute("x2", X(k)); ln.setAttribute("y2", Y(k));
        ln.setAttribute("class", "ra-edge" + (state.done(k) ? " done" : ""));
        svg.appendChild(ln);
      });
    });
    box.appendChild(svg);
    L.nodes.forEach(function (n) {
      var cls = "ra-node" + (n.t === "rel" ? " leaf" : "") + (state.active(n) ? " active" : state.done(n) ? " done" : "");
      var b = el(n.t === "rel" || !onPick ? "span" : "button", { class: cls, style: "left:" + X(n) + "px;top:" + Y(n) + "px;max-width:" + (unary(n) ? Math.max(slot - 8, Math.min(260, 2 * Math.min(X(n), W - X(n)) - 8)) : slot - 8) + "px", html: label(n) });
      if (b.tagName === "BUTTON") { b.type = "button"; b.title = "Gå til dette steget"; b.addEventListener("click", function () { onPick(n); }); }
      box.appendChild(b);
    });
    wrap.appendChild(box);
    host.appendChild(wrap);
    return wrap;
  }

  /* ---------- Stegspiller ---------- */
  function insTable(inp, i) {
    var n = inp.node, marks = {};
    if (inp.rader) marks.rader = inp.rader;
    if (inp.kolonner) marks.kolonner = inp.kolonner;
    return relToTable(inp.v, (i === 0 && n.t !== "rel" ? "Inn: " : n.t !== "rel" ? "Inn: " : "") + short(n), marks, n._pk);
  }
  function stepNode(prog, s) {
    if (s.node < 0) return null;
    var found = null;
    walk(prog[s.stmt].expr, function (x) { if (x.id === s.node) found = x; });
    return found;
  }

  function renderProgram(host, prog, active) {
    var box = el("div", { class: "ra-prog mono", "aria-label": "Uttrykket" });
    prog.forEach(function (stm, i) {
      box.appendChild(el("div", { class: "ra-prog-line" + (i === active && prog.length > 1 ? " on" : ""), html: (stm.navn ? esc(stm.navn) + " := " : "") + html(stm.expr) }));
    });
    host.appendChild(box);
  }

  function makePlayer(host, opts) {
    if (typeof host === "string") host = IN.qs(host);
    var db = opts.db || IN.dataRa.db;
    var res = null, player = null, errBox = el("div", { class: "ra-err", role: "alert", hidden: true });
    var root = el("div", { class: "ra-player" });
    host.appendChild(root);
    var bar = null, input = null;
    if (opts.presets) {
      bar = el("div", { class: "ra-presets" });
      bar.appendChild(el("span", { class: "lbl small", text: "Eksempler:" }));
      Object.keys(opts.presets).forEach(function (k) {
        bar.appendChild(el("button", { class: "btn sm", type: "button", text: k, onclick: function () { load(opts.presets[k]); } }));
      });
      root.appendChild(bar);
    }
    if (opts.edit !== false) {
      var ed = el("div", { class: "ra-edit" });
      input = el("textarea", { class: "ra-input mono", rows: "2", spellcheck: "false", "aria-label": "Relasjonsalgebrauttrykk" });
      var go = el("button", { class: "btn primary sm", type: "button", text: "Evaluer", onclick: function () { load(input.value); } });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); go.click(); } });
      ed.appendChild(symbolBar(input));
      ed.appendChild(input);
      ed.appendChild(el("div", { class: "ra-edit-row" }, [go, el("span", { class: "small muted", html: "Skriv med symbolene eller med ord: <span class=\"mono\">pi[navn](sigma[by='Oslo'](Student))</span>. Flere linjer gir <span class=\"mono\">Navn := …</span>. Ctrl+Enter evaluerer." })]));
      root.appendChild(ed);
    }
    root.appendChild(errBox);
    var stageHost = el("div");
    root.appendChild(stageHost);

    function load(src) {
      if (input) input.value = src;
      try { res = IN.ra.run(src, db); }
      catch (e) {
        if (!(e instanceof Err)) { if (window.console) console.error(e); }
        errBox.hidden = false; errBox.textContent = "Kan ikke evaluere: " + (e && e.message ? e.message : String(e));
        return;
      }
      errBox.hidden = true;
      clear(stageHost);
      player = IN.stepPlayer(stageHost, {
        generate: function () { return res.steg; },
        initial: [0],
        customInput: false,
        render: draw
      });
    }
    function idxOf(stmt, id) {
      for (var i = 0; i < res.steg.length; i++) if (res.steg[i].stmt === stmt && res.steg[i].node === id) return i;
      return -1;
    }
    function draw(s, ctx) {
      clear(ctx.stage);
      var stage = el("div", { class: "ra-stage" });
      ctx.stage.appendChild(stage);
      var prog = res.prog;
      renderProgram(stage, prog, s.stmt);
      var cur = stepNode(prog, s), fin = s.node === -2;
      var doneIds = {};
      for (var i = 0; i <= ctx.index; i++) { var q = res.steg[i]; if (q.stmt === s.stmt && q.node >= 0) doneIds[q.node] = 1; }
      drawTree(stage, prog[s.stmt].expr, {
        active: function (n) { return cur && n.id === cur.id; },
        done: function (n) { return fin || n.t === "rel" || doneIds[n.id]; }
      }, function (n) { var k = idxOf(s.stmt, n.id); if (k >= 0 && player) player.goto(k); });
      var row = el("div", { class: "rel-row ra-tabs" });
      if (s.start) {
        var seen = {};
        leaves(prog[s.stmt].expr).forEach(function (lf) {
          if (seen[low(lf.name)]) return; seen[low(lf.name)] = 1;
          IN.vizTable(row, relToTable(lf._val, esc(lf.name), null, lf._pk), { compact: true });
        });
      } else {
        (s.ins || []).forEach(function (inp, i) { IN.vizTable(row, insTable(inp, i), { compact: true }); });
        if (s.out) {
          var om = s.outCols ? { kolonner: {} } : null;
          if (om) colNames(s.out).forEach(function (n, i) { if (s.outCols[i]) om.kolonner[n] = "new"; });
          var nav = fin ? (prog[s.stmt].navn ? esc(prog[s.stmt].navn) + " = resultat" : "Resultat") : "Ut: " + (cur ? short(cur) : "");
          var w = IN.vizTable(row, relToTable(s.out, nav, om), {});
          w.classList.add("ra-out");
        }
      }
      stage.appendChild(row);
    }
    if (opts.initial) load(opts.initial);
    else if (opts.presets) load(opts.presets[Object.keys(opts.presets)[0]]);
    return { load: load };
  }

  function symbolBar(input) {
    var bar = el("div", { class: "ra-symbar", role: "group", "aria-label": "Sett inn symbol" });
    [["π_{}", "π"], ["σ_{}", "σ"], ["ρ_{}", "ρ"], [" × ", "×"], [" ⋈ ", "⋈"], [" ⋈_{} ", "⋈θ"], [" ∪ ", "∪"], [" ∩ ", "∩"], [" ∖ ", "∖"],
     ["→", "→"], [" ∧ ", "∧"], [" ∨ ", "∨"], ["¬", "¬"], [" ≠ ", "≠"], [" ≤ ", "≤"], [" ≥ ", "≥"], [" := ", ":="]].forEach(function (p) {
      bar.appendChild(el("button", { class: "btn sm ra-sym", type: "button", text: p[1], title: "Sett inn " + p[0].trim(),
        onclick: function () {
          var a = input.selectionStart || 0, b = input.selectionEnd || 0, v = input.value, ins = p[0];
          input.value = v.slice(0, a) + ins + v.slice(b);
          var pos = a + ins.length - (/\{\}/.test(ins) ? (ins.length - ins.indexOf("{}") - 1) : 0);
          input.focus(); input.setSelectionRange(pos, pos);
        } }));
    });
    return bar;
  }

  /* ---------- Liten demo: uttrykk → inn og ut ---------- */
  function mini(host, src, opts) {
    if (typeof host === "string") host = IN.qs(host);
    opts = opts || {};
    var db = opts.db || IN.dataRa.db;
    var box = el("div", { class: "ra-mini" });
    host.appendChild(box);
    try {
      var r = IN.ra.run(src, db);
      var p = r.prog[r.prog.length - 1];
      box.appendChild(el("div", { class: "ra-mini-expr mono", html: r.prog.map(function (s) { return (s.navn ? esc(s.navn) + " := " : "") + html(s.expr); }).join("<br>") }));
      var row = el("div", { class: "rel-row" });
      var vis = opts.inn || leaves(p.expr).map(function (x) { return x.name; });
      var seen = {};
      vis.forEach(function (nm) {
        if (seen[low(nm)]) return; seen[low(nm)] = 1;
        var t = db[nm];
        if (t) IN.vizTable(row, { navn: nm, kolonner: t.kolonner.map(function (c) { return { navn: c, pk: (t.pk || []).indexOf(c) >= 0 }; }), rader: t.rader }, { compact: true });
      });
      if (opts.mellom) {
        var lastSel = null;
        r.steg.forEach(function (s) { if (s.node >= 0 && s.stmt === r.prog.length - 1 && s.ins.length === 1 && (s.ins[0].rader || s.ins[0].kolonner)) lastSel = s; });
        if (lastSel) IN.vizTable(row, insTable(lastSel.ins[0], 0), { compact: true });
      }
      row.appendChild(el("div", { class: "ra-arrow", "aria-hidden": "true", text: "⇒" }));
      var w = IN.vizTable(row, relToTable(r.verdi, "Resultat"), {});
      w.classList.add("ra-out");
      box.appendChild(row);
      if (opts.note) box.appendChild(el("p", { class: "small ra-mini-note", html: opts.note }));
    } catch (e) {
      box.appendChild(el("p", { class: "ra-err", text: "Feil i demoen: " + (e && e.message) }));
      if (window.console) console.error(e);
    }
    return box;
  }

  /* ---------- Velg mellom tilfeller (fellene) ---------- */
  function cases(host, list) {
    if (typeof host === "string") host = IN.qs(host);
    var bar = el("div", { class: "ra-presets", role: "group", "aria-label": "Velg tilfelle" });
    var out = el("div", { class: "ra-case", "aria-live": "polite" });
    host.appendChild(bar); host.appendChild(out);
    var btns = [];
    function show(i) {
      btns.forEach(function (b, j) { b.setAttribute("aria-pressed", i === j ? "true" : "false"); });
      clear(out);
      var c = list[i];
      if (c.tekst) out.appendChild(el("div", { class: "callout " + (c.type || "eksempel") }, [el("span", { class: "lbl", text: c.lbl || "Hva skjer" }), el("span", { html: c.tekst })]));
      mini(out, c.uttrykk, { note: c.note });
    }
    list.forEach(function (c, i) {
      var b = el("button", { class: "btn sm", type: "button", text: c.knapp, onclick: function () { show(i); } });
      btns.push(b); bar.appendChild(b);
    });
    show(0);
  }

  /* ---------- Øving: skriv uttrykket selv ---------- */
  function ovelse(host, oppg, opts) {
    if (typeof host === "string") host = IN.qs(host);
    opts = opts || {};
    var db = opts.db || IN.dataRa.db;
    var store = IN.store || { get: function (k, d) { return d; }, set: function () {} };
    oppg.forEach(function (o, i) {
      var sk = "in2090:ra-ovelse:" + o.id;
      var card = el("div", { class: "card ra-ov" });
      card.appendChild(el("h4", { class: "ra-ov-h", html: (i + 1) + ". " + o.tittel + (o.eksamen ? ' <span class="tag">' + o.eksamen + "</span>" : "") }));
      card.appendChild(el("p", { html: o.tekst }));
      var inp = el("textarea", { class: "ra-input mono", rows: "2", spellcheck: "false", "aria-label": "Ditt uttrykk for oppgave " + (i + 1) });
      inp.value = store.get(sk, "") || "";
      var fb = el("div", { class: "ra-fb", "aria-live": "polite" });
      var vis = el("div");
      var check = el("button", { class: "btn primary sm", type: "button", text: "Sjekk", onclick: function () {
        clear(fb); clear(vis);
        store.set(sk, inp.value);
        var fasit = IN.ra.run(o.fasit, db).verdi, mine;
        try { mine = IN.ra.run(inp.value, db).verdi; }
        catch (e) { fb.appendChild(el("p", { class: "ra-err", text: "Kan ikke evaluere: " + (e && e.message ? e.message : e) })); return; }
        var c = IN.ra.compare(mine, fasit);
        fb.appendChild(el("p", { class: c.ok ? "ra-ok" : "ra-bad", html: (c.ok ? "<b>Riktig resultat.</b> " : "<b>Ikke helt.</b> ") + esc(c.msg || "") + (c.ok && o.etter ? " " + o.etter : "") }));
        if (!c.ok && o.hint) fb.appendChild(el("p", { class: "small", html: "<b>Hint:</b> " + o.hint }));
        IN.vizTable(vis, relToTable(mine, "Ditt resultat"), { compact: true });
        if (IN.intoView) IN.intoView(fb);
      } });
      var lf = el("button", { class: "btn sm", type: "button", text: "Vis et forslag", onclick: function () {
        clear(vis);
        vis.appendChild(el("p", { class: "mono ra-mini-expr", html: IN.ra.parse(o.fasit).map(function (s) { return (s.navn ? esc(s.navn) + " := " : "") + html(s.expr); }).join("<br>") }));
        if (o.forklaring) vis.appendChild(el("p", { class: "small", html: o.forklaring }));
        IN.vizTable(vis, relToTable(IN.ra.run(o.fasit, db).verdi, "Forventet resultat"), { compact: true });
      } });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); check.click(); } });
      card.appendChild(symbolBar(inp));
      card.appendChild(inp);
      card.appendChild(el("div", { class: "ra-edit-row" }, [check, lf]));
      card.appendChild(fb);
      card.appendChild(vis);
      host.appendChild(card);
    });
  }

  IN.raSide = { player: makePlayer, mini: mini, cases: cases, ovelse: ovelse, tree: drawTree };
})();
