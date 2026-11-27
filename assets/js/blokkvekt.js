/* blokkvekt.js — stolper for eksamensvekt øverst på blokksidene (IN2090, mønsteret er hentet fra IN2120 2026-11-27).
   Finner <p class="blokk-vekt"> og legger til stolper med poeng per ordinær eksamen (H2019–H2025, ikke prøveeksamener)
   fra eksamensbanken. Skalaen er felles for alle blokkene: høyeste år i en blokk = full høyde.
   Lastes etter eksamensbank/*.js. Snittet i teksten står fast i HTML-en: regn det ut på nytt når banken endres. */
(function () {
  "use strict";
  var IN = window.IN, BANK = window.IN_EXAM_BANK || {};
  if (!IN || !IN.el) return;
  /* Oppgavens block → blokksiden (body[data-page]) der oppgaven står i eksamensbanken */
  var BLOCK2PAGE = {
    er: "er", eer: "er", realisering: "realisering", relasjonsalgebra: "relasjonsalgebra",
    sql: "sql", "sql-videre": "sql-videre", fd: "fd", normalisering: "normalisering",
    "sql-programmering": "sql-programmering"
  };
  function pageOf(o) {
    // SQL-injection-oppgaven (H2023) står på sikkerhetssiden
    if (o.block === "sql-programmering" && /injection/i.test(o.title || "")) return "sikkerhet";
    return BLOCK2PAGE[o.block];
  }
  function yearKey(y) { var m = /^H(\d{4})$/.exec(y); return m ? +m[1] : 0; }
  function num(x) { return String(Math.round(x * 100) / 100).replace(".", ","); }

  function bygg() {
    var host = document.querySelector(".blokk-vekt");
    var side = IN.pageId ? IN.pageId() : "";
    if (!host || !side || host.querySelector(".bv-spark")) return;
    var YEARS = Object.keys(BANK).filter(function (y) { return yearKey(y) && !BANK[y].prove; })
      .sort(function (a, b) { return yearKey(a) - yearKey(b); });
    if (!YEARS.length) return;
    var pts = {}, tot = {}, maks = 0;   // pts[side][år]
    YEARS.forEach(function (y) {
      (BANK[y].oppgaver || []).forEach(function (o) {
        var p = pageOf(o), v = +o.points || 0;
        tot[y] = (tot[y] || 0) + v;
        if (!p) return;
        pts[p] = pts[p] || {}; pts[p][y] = (pts[p][y] || 0) + v;
      });
    });
    Object.keys(pts).forEach(function (p) { YEARS.forEach(function (y) { maks = Math.max(maks, pts[p][y] || 0); }); });
    var mine = pts[side];
    if (!mine) return;
    function pst(y) { return Math.round((mine[y] || 0) / (tot[y] || 1) * 100); }
    var spark = IN.el("span", { class: "bv-spark", role: "img",
      "aria-label": "Poeng per eksamen: " + YEARS.map(function (y) {
        return y + " " + num(mine[y] || 0) + " p (" + pst(y) + " %)";
      }).join(", ") });
    YEARS.forEach(function (y) {
      var v = mine[y] || 0, i = IN.el("i", { title: y + ": " + num(v) + " p, " + pst(y) + " % av eksamen" });
      i.style.height = Math.max(v ? 8 : 0, Math.round(v / (maks || 1) * 100)) + "%";
      spark.appendChild(IN.el("span", { class: "bv-sparkc" }, [i, IN.el("b", { text: y.slice(3) })]));
    });
    host.appendChild(spark);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bygg); else bygg();
})();
