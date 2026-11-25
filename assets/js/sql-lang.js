/* ============================================================
   IN2090 guide · sql-lang.js
   SQL (PostgreSQL-dialekten kurset bruker) som «språk» i IN.pseudo:
     IN.sql.tokenize(linje)  → HTML med fargeklasser (sql-kw, sql-fn, sql-str, sql-num, sql-cmt)
     IN.sql.algo(tekst, opts) → { lang:"sql", lines:[{code, indent}] } som IN.pseudo.render,
                                 .explainer og .parsons tar imot (ingen «Procedure»-linje).
     IN.sql.render(host, tekst|algo, opts) → handle som IN.pseudo.render (highlight/select/clear).
   Linjeforklaringer: gi lines selv, [{ code, indent, eli5, normal, teknisk, grense? }].
   Klassisk script. Lastes etter core.js; kan stå før eller etter pseudocode.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  var KW = ("select from where group by having order asc desc limit offset distinct all as on join inner left right full outer " +
    "cross natural using and or not in exists between like ilike is null true false union intersect except with recursive " +
    "case when then else end insert into values update set delete create table view drop alter add column primary key " +
    "foreign references unique check default constraint cascade restrict begin commit rollback transaction grant revoke to " +
    "public role user index materialized if replace returning nulls first last any some filter over partition coalesce " +
    "nullif cast int integer bigint smallint serial text varchar char numeric decimal real float boolean date time timestamp").split(" ");
  var KWSET = {}; KW.forEach(function (w) { KWSET[w] = 1; });
  var FN = { count: 1, sum: 1, avg: 1, min: 1, max: 1, upper: 1, lower: 1, length: 1, round: 1, now: 1, extract: 1, string_agg: 1, array_agg: 1, abs: 1 };
  // coalesce/nullif står som nøkkelord over, men vises som funksjoner når de følges av «(».
  FN.coalesce = 1; FN.nullif = 1;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* Gruppene: 1 kommentar · 2 streng · 3 tall · 4 ord · 5 operator på flere tegn · 6 mellomrom · 7 annet tegn */
  var RE = /(--[^\n]*)|('(?:[^']|'')*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_æøåÆØÅ][A-Za-z0-9_æøåÆØÅ]*)|(<>|!=|<=|>=|\|\||::)|(\s+)|([\s\S])/g;

  function tokenize(line) {
    var out = "", m, s = String(line == null ? "" : line);
    RE.lastIndex = 0;
    while ((m = RE.exec(s)) !== null) {
      if (m[1]) out += '<span class="sql-cmt">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="sql-str">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="sql-num">' + m[3] + "</span>";
      else if (m[4]) {
        var w = m[4], lw = w.toLowerCase(), next = s.slice(RE.lastIndex).match(/^\s*\(/);
        if (FN[lw] && next) out += '<span class="sql-fn">' + esc(w) + "</span>";
        else if (KWSET[lw]) out += '<span class="sql-kw">' + esc(w) + "</span>";
        else out += '<span class="sql-id">' + esc(w) + "</span>";
      }
      else if (m[5]) out += '<span class="sql-op">' + esc(m[5]) + "</span>";
      else out += esc(m[0]);
    }
    return out;
  }

  /* Tekst → linjer. Innrykk = antall ledende mellomrom / 2. */
  function algo(text, opts) {
    opts = opts || {};
    var lines = String(text || "").replace(/\r\n?/g, "\n").replace(/^\n+|\s+$/g, "").split("\n").map(function (l) {
      var sp = l.match(/^ */)[0].length;
      return { code: l.slice(sp), indent: Math.floor(sp / 2) };
    });
    return { lang: "sql", name: opts.name || "", lines: lines };
  }

  function render(host, src, opts) {
    var a = typeof src === "string" ? algo(src) : src;
    if (!a.lang) a.lang = "sql";
    opts = opts || {};
    if (opts.tooltips == null) opts.tooltips = a.lines.some(function (l) { return l.normal || l.eli5 || l.teknisk || l.what; });
    return IN.pseudo.render(host, a, opts);
  }

  IN.sql = { tokenize: tokenize, algo: algo, render: render, esc: esc };
})();
