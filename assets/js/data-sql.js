/* ============================================================
   IN2090 guide · data-sql.js
   Felles data og demoer for blokk 4 (SQL) og blokk 5 (SQL videregående).
   Biblioteksdatabasen (forfatter, bok, låner, utlån), skjemaet til IN.schema,
   forhåndsberegnede mellomtabeller til IN.sqlSteps, to små widgets
   (sannhetstabell med NULL og mengdeoperatorer), LIMIT/OFFSET-widget,
   forklaringer på tre nivåer, flervalg, sant/usant og radantall-øving.
   Alle resultater stemmer med plan/innhold/04-sql.md og 05-sql-videre.md
   (kjørt i SQLite, PostgreSQL-avvik regnet for hånd der). Mellomtabellene er
   kontrollert med sqlite3. All tekst er skrevet med egne ord.
   Klassisk script. Lastes etter core.js, sql-lang.js, stepplayer.js og viz-relation.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var D = (IN.dataSql = IN.dataSql || {});

  function S() { return [].slice.call(arguments).join("\n"); }
  function T(navn, kolonner, rader, marks, extra) {
    var t = { navn: navn, kolonner: kolonner, rader: rader };
    if (marks) t.marks = marks;
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) t[k] = extra[k];
    return t;
  }
  // { rader: {i: cls} } fra en funksjon over radindeksene
  function rm(n, fn) { var m = {}; for (var i = 0; i < n; i++) { var c = fn(i); if (c) m[i] = c; } return { rader: m }; }
  function list(arr) { var m = {}; arr.forEach(function (c, i) { if (c) m[i] = c; }); return { rader: m }; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function m(s) { return '<span class="mono">' + s + "</span>"; }

  /* ================= Biblioteksdatabasen ================= */
  var FORF = [[1, "Ibsen", "Norge"], [2, "Undset", "Norge"], [3, "Woolf", "England"], [4, "Lindgren", "Sverige"], [5, "Ferrante", null]];
  var BOK = [[10, "Et dukkehjem", 1, 1879, 120], [11, "Peer Gynt", 1, 1867, 250], [12, "Kristin Lavransdatter", 2, 1920, 1000],
    [13, "Mrs Dalloway", 3, 1925, 200], [14, "Brødrene Løvehjerte", 4, 1973, 230], [15, "Folkeeventyr", null, 1841, null]];
  var LAANER = [[1, "Ada", "Oslo"], [2, "Bo", "Bergen"], [3, "Cato", "Oslo"], [4, "Dina", null], [5, "Ibsen", "Skien"]];
  var UTLAAN = [[10, 1, "2026-09-01", "2026-09-10"], [11, 1, "2026-09-05", null], [13, 2, "2026-09-07", "2026-09-20"],
    [10, 3, "2026-10-01", null], [14, 3, "2026-10-02", "2026-10-15"], [12, 5, "2026-10-03", null]];

  var K_FORF = [{ navn: "fid", pk: true }, "navn", "land"];
  var K_BOK = [{ navn: "bid", pk: true }, "tittel", { navn: "fid", fk: "forfatter" }, "år", "sider"];
  var K_LAANER = [{ navn: "lid", pk: true }, "navn", "sted"];
  var K_UTLAAN = [{ navn: "bid", pk: true, fk: "bok" }, { navn: "lid", pk: true, fk: "låner" }, { navn: "dato", pk: true }, "levert"];

  D.rader = { forfatter: FORF, bok: BOK, laaner: LAANER, utlaan: UTLAAN };
  D.tab = {
    forfatter: T("forfatter", K_FORF, FORF),
    bok: T("bok", K_BOK, BOK),
    laaner: T("låner", K_LAANER, LAANER),
    utlaan: T("utlån", K_UTLAAN, UTLAAN)
  };

  D.skjema = {
    tittel: "Biblioteksdatabasen",
    intro: "<p>Alle eksemplene i blokk 4 og 5 bruker denne lille databasen. Den har med vilje noen NULL-verdier, en forfatter uten bøker, " +
      "en bok uten forfatter, en låner uten lån og en låner som heter det samme som en forfatter. Fest skjemaet, så har du radene for hånden mens du regner.</p>",
    tabeller: [
      { navn: "forfatter", kolonner: [{ navn: "fid", type: "int", pk: true }, { navn: "navn", type: "text", notNull: true }, { navn: "land", type: "text" }],
        eksempel: { kolonner: K_FORF, rader: FORF } },
      { navn: "bok", kolonner: [{ navn: "bid", type: "int", pk: true }, { navn: "tittel", type: "text", notNull: true },
        { navn: "fid", type: "int", fk: "forfatter(fid)" }, { navn: "år", type: "int" }, { navn: "sider", type: "int" }],
        unike: [["tittel", "år"]], beskrivelse: 'CHECK <span class="mono">(sider &gt; 0)</span>.',
        eksempel: { kolonner: K_BOK, rader: BOK } },
      { navn: "låner", kolonner: [{ navn: "lid", type: "int", pk: true }, { navn: "navn", type: "text", notNull: true }, { navn: "sted", type: "text" }],
        eksempel: { kolonner: K_LAANER, rader: LAANER } },
      { navn: "utlån", kolonner: [{ navn: "bid", type: "int", pk: true, fk: "bok(bid)" }, { navn: "lid", type: "int", pk: true, fk: "låner(lid)" },
        { navn: "dato", type: "date", pk: true, notNull: true }, { navn: "levert", type: "date" }],
        beskrivelse: 'Primærnøkkel <span class="mono">(bid, lid, dato)</span>, CHECK <span class="mono">(levert &gt;= dato)</span>. <span class="mono">levert</span> er NULL når boka ikke er levert tilbake.',
        eksempel: { kolonner: K_UTLAAN, rader: UTLAAN } }
    ],
    merknad: "Ferrante har ingen bøker. Folkeeventyr har verken forfatter eller sidetall og er aldri lånt. Dina har ingen lån og ukjent sted. " +
      "Låneren Ibsen heter det samme som forfatteren Ibsen. Lån per låner: Ada 2, Bo 1, Cato 2, Dina 0, Ibsen 1."
  };

  D.createSql = S(
    "CREATE TABLE forfatter (",
    "  fid int PRIMARY KEY,",
    "  navn text NOT NULL,",
    "  land text",
    ");",
    "",
    "CREATE TABLE bok (",
    "  bid int PRIMARY KEY,",
    "  tittel text NOT NULL,",
    "  fid int REFERENCES forfatter(fid),",
    "  år int,",
    "  sider int CHECK (sider > 0),",
    "  CONSTRAINT tittel_år_un UNIQUE (tittel, år)",
    ");",
    "",
    "CREATE TABLE låner (",
    "  lid int PRIMARY KEY,",
    "  navn text NOT NULL,",
    "  sted text",
    ");",
    "",
    "CREATE TABLE utlån (",
    "  bid int REFERENCES bok(bid),",
    "  lid int REFERENCES låner(lid),",
    "  dato date NOT NULL,",
    "  levert date,",
    "  CONSTRAINT utlån_pk PRIMARY KEY (bid, lid, dato),",
    "  CONSTRAINT levert_etter CHECK (levert >= dato)",
    ");");

  /* ================= Hjelpere for mellomtabeller ================= */
  function tv(x) { return x === null ? null : (x ? "TRUE" : "FALSE"); }   // sannhetsverdi som tekst, NULL som null
  function eq(a, b) { return a === null || b === null ? null : a === b; }
  // kryssprodukt forfatter × bok (forfatter først) og bok × forfatter (bok først)
  var X_FB = [], X_BF = [];
  FORF.forEach(function (f) { BOK.forEach(function (b) { X_FB.push([f[0], f[1], b[0], b[1], b[2]]); }); });
  BOK.forEach(function (b) { FORF.forEach(function (f) { X_BF.push([b[0], b[1], b[2], f[0], f[1]]); }); });

  /* ================= Stegvise demoer (IN.sqlSteps) ================= */
  D.steg = {};

  /* ---- Blokk 5 · GROUP BY og HAVING med gruppefarger ---- */
  var JFB = [[1, "Ibsen", 10, "Et dukkehjem"], [1, "Ibsen", 11, "Peer Gynt"], [2, "Undset", 12, "Kristin Lavransdatter"],
    [3, "Woolf", 13, "Mrs Dalloway"], [4, "Lindgren", 14, "Brødrene Løvehjerte"]];
  var K_JFB = ["f.fid", "f.navn", "b.bid", "b.tittel"];
  var GRP = ["grp1", "grp1", "grp2", "grp3", "grp4"];
  var AGG1 = [[1, "Ibsen", 2], [2, "Undset", 1], [3, "Woolf", 1], [4, "Lindgren", 1]];
  D.steg.groupBy = {
    sql: S("SELECT f.navn, count(*) AS antall",
      "FROM forfatter AS f",
      "  INNER JOIN bok AS b ON (f.fid = b.fid)",
      "GROUP BY f.fid, f.navn",
      "HAVING count(*) >= 2;"),
    tabeller: [D.tab.forfatter, D.tab.bok], visInndata: false,
    steg: [
      { line: 3, tekst: { eli5: "Først legger vi hver bok ved siden av forfatteren sin. Ferrante har ingen bok, og Folkeeventyr har ingen forfatter, så de blir liggende igjen.",
        normal: "<b>FROM + INNER JOIN:</b> 5 par. Ferrante (ingen bøker) og Folkeeventyr (<span class=\"mono\">fid</span> er NULL) har ingen partner og er borte.",
        teknisk: "<b>FROM + INNER JOIN</b> bygger tabellen alt det andre jobber på: 5 rader. En indre join beholder bare par der <span class=\"mono\">f.fid = b.fid</span> er TRUE, så Ferrante og Folkeeventyr faller ut før grupperingen i det hele tatt starter." },
        tabell: T("FROM … INNER JOIN", K_JFB, JFB) },
      { line: 4, tekst: { eli5: "Nå sorterer vi radene i hauger, én haug per forfatter. Hver farge er én haug.",
        normal: "<b>GROUP BY f.fid, f.navn:</b> rader med lik verdi i gruppekolonnene havner i samme gruppe. Fire grupper, én farge per gruppe.",
        teknisk: "<b>GROUP BY</b> deler radene i grupper med lik <span class=\"mono\">(f.fid, f.navn)</span>. Fra nå av blir hver gruppe til nøyaktig én rad i svaret, og SELECT kan bare vise grupperte kolonner eller aggregater." },
        tabell: T("gruppert", K_JFB, JFB, list(GRP)) },
      { line: 4, tekst: { eli5: "Vi teller kulene i hver haug: Ibsen har to, de andre én.",
        normal: "<b>Aggregatet</b> <span class=\"mono\">count(*)</span> regnes én gang per gruppe. Hver gruppe blir én rad.",
        teknisk: "Aggregatet regnes per gruppe, etter GROUP BY og før HAVING. Det er derfor HAVING kan bruke <span class=\"mono\">count(*)</span>, mens WHERE ikke kan." },
        tabell: T("én rad per gruppe", ["f.fid", "f.navn", "count(*)"], AGG1, list(["grp1", "grp2", "grp3", "grp4"])) },
      { line: 5, tekst: { eli5: "Nå kaster vi haugene som har færre enn to kuler. Bare Ibsen-haugen er igjen.",
        normal: "<b>HAVING count(*) &gt;= 2</b> er en betingelse på gruppene. Bare Ibsen har minst to bøker.",
        teknisk: "<b>HAVING</b> filtrerer grupper, slik WHERE filtrerer rader. Merk at vi skriver <span class=\"mono\">count(*)</span> på nytt: aliaset <span class=\"mono\">antall</span> lages først i SELECT og finnes ikke ennå (kursets navneregel)." },
        tabell: T("HAVING", ["f.fid", "f.navn", "count(*)"], AGG1, list(["keep", "drop", "drop", "drop"])) },
      { line: 1, tekst: { eli5: "Til slutt skriver vi navnet og tallet på lappen.",
        normal: "<b>SELECT</b> plukker kolonnene og gir <span class=\"mono\">count(*)</span> navnet <span class=\"mono\">antall</span>. Svaret er én rad.",
        teknisk: "<b>SELECT</b> kommer logisk sett etter HAVING. Uten HAVING hadde svaret vært fire rader: Ibsen 2, Undset 1, Woolf 1 og Lindgren 1." },
        tabell: T("resultat", ["navn", "antall"], [["Ibsen", 2]]) }
    ]
  };

  /* ---- Blokk 5 · WHERE før GROUP BY, HAVING etter ---- */
  var JLU = [[1, "Ada", 10, "2026-09-01"], [1, "Ada", 11, "2026-09-05"], [2, "Bo", 13, "2026-09-07"],
    [3, "Cato", 10, "2026-10-01"], [3, "Cato", 14, "2026-10-02"], [5, "Ibsen", 12, "2026-10-03"]];
  var K_JLU = ["l.lid", "l.navn", "u.bid", "u.dato"];
  D.steg.whereHaving = {
    sql: S("SELECT l.navn, count(*) AS lån_i_oktober",
      "FROM låner AS l",
      "  INNER JOIN utlån AS u ON (l.lid = u.lid)",
      "WHERE u.dato >= '2026-10-01'      -- radfilter: før gruppering",
      "GROUP BY l.lid, l.navn",
      "HAVING count(*) > 1;              -- gruppefilter: etter telling"),
    tabeller: [D.tab.laaner, D.tab.utlaan], visInndata: false,
    steg: [
      { line: 3, tekst: "<b>FROM + INNER JOIN:</b> ett par per utlån, 6 rader. Dina har ingen lån og er ikke med.", tabell: T("FROM … INNER JOIN", K_JLU, JLU) },
      { line: 4, tekst: { eli5: "Vi kaster lånene fra september før vi lager hauger.",
        normal: "<b>WHERE</b> ser på én rad om gangen og beholder bare lån fra 1. oktober og senere. Tre rader er igjen.",
        teknisk: "<b>WHERE</b> evalueres per rad, før gruppene finnes. Derfor kan WHERE ikke inneholde et aggregat: det finnes ingen gruppe å telle i ennå." },
        tabell: T("WHERE", K_JLU, JLU, list(["drop", "drop", "drop", "keep", "keep", "keep"])) },
      { line: 5, tekst: "<b>GROUP BY l.lid, l.navn:</b> de tre radene blir to grupper, Cato og Ibsen.",
        tabell: T("gruppert", K_JLU, JLU.slice(3), list(["grp1", "grp1", "grp2"])) },
      { line: 6, tekst: { eli5: "Vi teller haugene og beholder bare den som har mer enn én kule.",
        normal: "<b>HAVING count(*) &gt; 1</b> ser på hver gruppe. Cato har 2, Ibsen 1.",
        teknisk: "<b>HAVING</b> filtrerer på det ferdige aggregatet. Hadde vi flyttet datofilteret til HAVING, måtte det vært en betingelse på gruppen, og den hadde ikke betydd det samme." },
        tabell: T("HAVING", ["l.lid", "l.navn", "count(*)"], [[3, "Cato", 2], [5, "Ibsen", 1]], list(["keep", "drop"])) },
      { line: 1, tekst: "<b>SELECT:</b> navn og antall. Én rad.", tabell: T("resultat", ["navn", "lån_i_oktober"], [["Cato", 2]]) }
    ]
  };

  /* ---- Blokk 5 · NOT EXISTS, korrelert ---- */
  function bokFor(fid) { return BOK.filter(function (b) { return b[2] === fid; }).map(function (b) { return [b[0], b[1], b[2]]; }); }
  var forfStatus = ["drop", "drop", "drop", "drop", "keep"];
  function forfMarks(upto) { return list(FORF.map(function (f, i) { return i < upto ? forfStatus[i] : i === upto ? "hit" : null; })); }
  D.steg.notExists = {
    sql: S("SELECT f.navn",
      "FROM forfatter AS f",
      "WHERE NOT EXISTS (",
      "  SELECT *",
      "  FROM bok AS b",
      "  WHERE b.fid = f.fid",
      ");"),
    tabeller: [D.tab.forfatter, D.tab.bok], visInndata: false,
    steg: FORF.map(function (f, i) {
      var rows = bokFor(f[0]), finnes = rows.length > 0;
      return { line: i === 0 ? 6 : 3,
        tekst: "Ytre rad <b>" + f[1] + "</b> (fid " + f[0] + "): delspørringen ser etter bøker med <span class=\"mono\">b.fid = " + f[0] + "</span>. " +
          (finnes ? "Den finner " + rows.length + (rows.length === 1 ? " bok" : " bøker") + ", så EXISTS er TRUE og <span class=\"mono\">NOT EXISTS</span> er FALSE. " + f[1] + " droppes."
                  : "Den finner ingenting, så EXISTS er FALSE og <span class=\"mono\">NOT EXISTS</span> er TRUE. " + f[1] + " er med.") +
          (i === 0 ? " Delspørringen er <b>korrelert</b>: den bruker <span class=\"mono\">f.fid</span> fra den ytre raden og regnes på nytt for hver forfatter." : ""),
        tabeller: [T("forfatter", K_FORF, FORF, forfMarks(i)), T("delspørringen for fid = " + f[0], ["bid", "tittel", "fid"], rows, null, { tom: "(ingen bøker: tomt svar)" })] };
    }).concat([{ line: 1, tekst: "<b>Resultat:</b> bare Ferrante. Folkeeventyr har <span class=\"mono\">fid</span> lik NULL og passer aldri med noen forfatter, men det påvirker ikke NOT EXISTS.",
      tabell: T("resultat", ["navn"], [["Ferrante"]]) }])
  };

  /* ---- Blokk 5 · WITH og max ---- */
  var PL = [[1, 2], [2, 1], [3, 2], [5, 1]];
  var PLJ = [[1, 2, "Ada"], [2, 1, "Bo"], [3, 2, "Cato"], [5, 1, "Ibsen"]];
  D.steg.withMax = {
    sql: S("WITH per_låner AS (",
      "  SELECT lid, count(*) AS antall",
      "  FROM utlån",
      "  GROUP BY lid",
      ")",
      "SELECT l.navn, p.antall",
      "FROM per_låner AS p",
      "  INNER JOIN låner AS l ON (p.lid = l.lid)",
      "WHERE p.antall = (SELECT max(antall) FROM per_låner);"),
    tabeller: [D.tab.laaner, D.tab.utlaan], visInndata: false,
    steg: [
      { line: 2, tekst: { eli5: "Først lager vi en kladdelapp: hvor mange lån har hver person?",
        normal: "<b>WITH per_låner</b> regnes ut først: antall lån per <span class=\"mono\">lid</span>. Dina (lid 4) har ingen rader i utlån og er ikke med.",
        teknisk: "WITH-tabellen er en navngitt delspørring. Den er synlig i resten av spørringen, også i delspørringen i WHERE. Slik slipper vi å skrive tellingen to ganger." },
        tabell: T("per_låner", ["lid", "antall"], PL) },
      { line: 9, tekst: "<b>Delspørringen i WHERE</b> bruker kladdelappen igjen: <span class=\"mono\">max(antall)</span> er 2. Vi kan ikke skrive <span class=\"mono\">max(count(*))</span>, for aggregater kan ikke nøstes direkte.",
        tabell: T("SELECT max(antall) FROM per_låner", ["max"], [[2]]) },
      { line: 8, tekst: "<b>FROM + INNER JOIN:</b> kladdelappen kobles med <span class=\"mono\">låner</span> for å få navnene.", tabell: T("FROM … INNER JOIN", ["p.lid", "p.antall", "l.navn"], PLJ) },
      { line: 9, tekst: "<b>WHERE p.antall = 2:</b> alle som deler førsteplassen blir med, både Ada og Cato.", tabell: T("WHERE", ["p.lid", "p.antall", "l.navn"], PLJ, list(["keep", "drop", "keep", "drop"])) },
      { line: 6, tekst: "<b>SELECT:</b> to rader. Med <span class=\"mono\">ORDER BY p.antall DESC LIMIT 1</span> hadde du fått bare én av dem, og det er ikke bestemt hvem.",
        tabell: T("resultat", ["navn", "antall"], [["Ada", 2], ["Cato", 2]]) }
    ]
  };

  /* ---- Blokk 5 · LEFT JOIN fra kryssprodukt ---- */
  var K_XFB = ["f.fid", "f.navn", "b.bid", "b.tittel", "b.fid"];
  var X_FB_EQ = X_FB.map(function (r) { return r.concat([tv(eq(r[0], r[4]))]); });
  var LJ = [[1, "Ibsen", 10, "Et dukkehjem", 1], [1, "Ibsen", 11, "Peer Gynt", 1], [2, "Undset", 12, "Kristin Lavransdatter", 2],
    [3, "Woolf", 13, "Mrs Dalloway", 3], [4, "Lindgren", 14, "Brødrene Løvehjerte", 4]];
  D.steg.leftJoin = {
    sql: S("SELECT f.navn, b.tittel",
      "FROM forfatter AS f",
      "  LEFT JOIN bok AS b ON (f.fid = b.fid);"),
    tabeller: [D.tab.forfatter, D.tab.bok], visInndata: false,
    steg: [
      { line: 2, tekst: { eli5: "Tenk deg at du legger hvert forfatterkort ved siden av hver eneste bok, også de som ikke passer. Det blir 30 par.",
        normal: "Tenk deg først <b>kryssproduktet</b> <span class=\"mono\">forfatter × bok</span>: alle 5 × 6 = 30 kombinasjoner.",
        teknisk: "Logisk sett er en join et kryssprodukt etterfulgt av en seleksjon på join-betingelsen. Databasen trenger ikke gjøre det slik, men svaret blir det samme." },
        tabell: T("forfatter × bok", K_XFB, X_FB) },
      { line: 3, tekst: "<b>ON (f.fid = b.fid)</b> sjekkes for hvert par. Bare TRUE beholdes. Folkeeventyr har <span class=\"mono\">b.fid</span> lik NULL, så sammenligningen blir NULL for alle forfatterne.",
        tabell: T("ON-betingelsen", K_XFB.concat(["f.fid = b.fid"]), X_FB_EQ, rm(30, function (i) { return X_FB_EQ[i][5] === "TRUE" ? "keep" : "drop"; })) },
      { line: 3, tekst: "Dette er den <b>indre</b> delen av joinen: 5 par. En INNER JOIN hadde stoppet her.", tabell: T("indre join", K_XFB, LJ) },
      { line: 3, tekst: { eli5: "Ferrante har ikke fått noen bok. LEFT JOIN lar henne stå på lista likevel, med en tom rute ved siden av.",
        normal: "<b>LEFT</b>: forfattere uten partner legges til, med NULL i alle bok-kolonnene. Det gjelder Ferrante.",
        teknisk: "En ytre join er indre join <i>pluss</i> radene uten partner fra den bevarte siden, fylt ut med NULL. Folkeeventyr står på høyre side og bevares ikke. Med <span class=\"mono\">FULL JOIN</span> hadde den også kommet med (7 rader)." },
        tabell: T("LEFT JOIN", K_XFB, LJ.concat([[5, "Ferrante", null, null, null]]), list([null, null, null, null, null, "new"])) },
      { line: 1, tekst: "<b>SELECT f.navn, b.tittel:</b> 6 rader, minst like mange som venstre tabell.",
        tabell: T("resultat", ["navn", "tittel"], [["Ibsen", "Et dukkehjem"], ["Ibsen", "Peer Gynt"], ["Undset", "Kristin Lavransdatter"], ["Woolf", "Mrs Dalloway"], ["Lindgren", "Brødrene Løvehjerte"], ["Ferrante", null]], list([null, null, null, null, null, "new"])) }
    ]
  };

  /* ---- Blokk 5 · WHERE på høyre tabell etter LEFT JOIN (feil) ---- */
  var LJU = [[1, "Ada", 10, "2026-09-01"], [1, "Ada", 11, "2026-09-05"], [2, "Bo", 13, "2026-09-07"],
    [3, "Cato", 10, "2026-10-01"], [3, "Cato", 14, "2026-10-02"], [4, "Dina", null, null], [5, "Ibsen", 12, "2026-10-03"]];
  var LJU_EV = LJU.map(function (r) { return r.concat([r[3] === null ? null : tv(r[3] >= "2026-10-01")]); });
  D.steg.whereFelle = {
    sql: S("SELECT l.navn, count(u.bid) AS antall",
      "FROM låner AS l",
      "  LEFT JOIN utlån AS u ON (l.lid = u.lid)",
      "WHERE u.dato >= '2026-10-01'",
      "GROUP BY l.lid, l.navn;"),
    tabeller: [D.tab.laaner, D.tab.utlaan], visInndata: false,
    steg: [
      { line: 3, tekst: "<b>LEFT JOIN:</b> 6 lån pluss Dina med NULL. 7 rader, alle lånerne er med.", tabell: T("LEFT JOIN", K_JLU, LJU, list([null, null, null, null, null, "new", null])) },
      { line: 4, tekst: { eli5: "Nå kaster vi alt som ikke er fra oktober. Dina har ingen dato, og Ada og Bo har bare lån fra september. Alle tre forsvinner helt.",
        normal: "<b>WHERE</b> kommer <i>etter</i> joinen. For Dina er <span class=\"mono\">u.dato</span> NULL, så betingelsen blir NULL og raden faller ut. Ada og Bo har bare september-lån, så de forsvinner også.",
        teknisk: "WHERE beholder bare TRUE. NULL-raden som LEFT JOIN la til, får NULL i betingelsen og forsvinner. LEFT JOIN-en blir i praksis en indre join. At dette skjer, står ikke rett ut i lysarkene. Det er en tilleggsfelle." },
        tabell: T("WHERE", K_JLU.concat(["u.dato >= '2026-10-01'"]), LJU_EV, list(["drop", "drop", "drop", "keep", "keep", "drop", "keep"])) },
      { line: 5, tekst: "<b>GROUP BY</b> får bare tre rader å jobbe med: Cato og Ibsen.", tabell: T("gruppert", K_JLU, [LJU[3], LJU[4], LJU[6]], list(["grp1", "grp1", "grp2"])) },
      { line: 1, tekst: "<b>Resultat:</b> 2 rader. Ada, Bo og Dina skulle stått med 0, men er borte.", tabell: T("resultat (feil)", ["navn", "antall"], [["Cato", 2], ["Ibsen", 1]]) }
    ]
  };

  /* ---- Blokk 5 · filtrer i WITH først (riktig, kursets måte) ---- */
  var OKT = [[10, 3, "2026-10-01", null], [14, 3, "2026-10-02", "2026-10-15"], [12, 5, "2026-10-03", null]];
  var LJO = [[1, "Ada", null, null], [2, "Bo", null, null], [3, "Cato", 10, "2026-10-01"], [3, "Cato", 14, "2026-10-02"], [4, "Dina", null, null], [5, "Ibsen", 12, "2026-10-03"]];
  D.steg.withRiktig = {
    sql: S("WITH okt AS (",
      "  SELECT *",
      "  FROM utlån",
      "  WHERE dato >= '2026-10-01'",
      ")",
      "SELECT l.navn, count(o.bid) AS antall",
      "FROM låner AS l",
      "  LEFT JOIN okt AS o ON (l.lid = o.lid)",
      "GROUP BY l.lid, l.navn;"),
    tabeller: [D.tab.laaner, D.tab.utlaan], visInndata: false,
    steg: [
      { line: 4, tekst: "<b>WITH okt</b> filtrerer utlånene <i>før</i> joinen: bare oktober-lånene er igjen.", tabell: T("okt", ["bid", "lid", "dato", "levert"], OKT) },
      { line: 8, tekst: "<b>LEFT JOIN okt:</b> lånere uten oktober-lån får NULL i <span class=\"mono\">o</span>-kolonnene. Nå er det ingen WHERE som kaster dem.",
        tabell: T("LEFT JOIN", ["l.lid", "l.navn", "o.bid", "o.dato"], LJO, list(["new", "new", null, null, "new", null])) },
      { line: 6, tekst: { eli5: "Vi teller bare ruter som ikke er tomme. Tomme ruter blir 0.",
        normal: "<b>GROUP BY + count(o.bid):</b> <span class=\"mono\">count</span> av en kolonne hopper over NULL, så Ada, Bo og Dina får 0.",
        teknisk: "<span class=\"mono\">count(o.bid)</span> teller ikke-NULL-verdier i gruppen. <span class=\"mono\">count(*)</span> hadde talt NULL-raden og gitt 1. Samme svar får du med betingelsen i ON: <span class=\"mono\">ON (l.lid = u.lid AND u.dato &gt;= '2026-10-01')</span>." },
        tabell: T("resultat (riktig)", ["navn", "antall"], [["Ada", 0], ["Bo", 0], ["Cato", 2], ["Dina", 0], ["Ibsen", 1]]) }
    ]
  };

  /* ---- Blokk 5 · NOT IN med NULL ---- */
  var NI_EV = [["Ibsen", 1, "FALSE"], ["Undset", 2, "FALSE"], ["Woolf", 3, "FALSE"], ["Lindgren", 4, "FALSE"], ["Ferrante", 5, null]];
  D.steg.notInNull = {
    sql: S("SELECT navn",
      "FROM forfatter",
      "WHERE fid NOT IN (SELECT fid FROM bok);"),
    tabeller: [D.tab.forfatter, D.tab.bok], visInndata: false,
    steg: [
      { line: 3, tekst: "<b>Delspørringen</b> gir <span class=\"mono\">fid</span> for alle bøkene. Folkeeventyr bidrar med en NULL.",
        tabell: T("SELECT fid FROM bok", ["fid"], [[1], [1], [2], [3], [4], [null]], list([null, null, null, null, null, "hit"])) },
      { line: 3, tekst: { eli5: "For Ferrante spør vi: «Er 5 forskjellig fra alle tallene i lista?» Det siste tallet er et spørsmålstegn. Er 5 forskjellig fra et spørsmålstegn? Vet ikke. Da blir hele svaret «vet ikke».",
        normal: "<b>NOT IN</b> for hver forfatter. Ibsen til Lindgren finnes i lista, så det blir FALSE. For Ferrante blir det NULL, ikke TRUE. Alle radene faller ut.",
        teknisk: "<span class=\"mono\">5 NOT IN (1, 1, 2, 3, 4, NULL)</span> betyr <span class=\"mono\">5 != 1 AND 5 != 1 AND 5 != 2 AND 5 != 3 AND 5 != 4 AND 5 != NULL</span>. De fem første leddene er TRUE, det siste er NULL, og <span class=\"mono\">TRUE AND NULL</span> er NULL. WHERE krever TRUE." },
        tabell: T("WHERE fid NOT IN (…)", ["navn", "fid", "fid NOT IN (…)"], NI_EV, list(["drop", "drop", "drop", "drop", "drop"])) },
      { line: 1, tekst: "<b>Resultat: 0 rader</b>, uten feilmelding. <span class=\"mono\">NOT EXISTS</span> hadde gitt Ferrante.", tabell: T("resultat", ["navn"], [], null, { tom: "(0 rader)" }) }
    ]
  };
  D.steg.notInFiks = {
    sql: S("SELECT navn",
      "FROM forfatter",
      "WHERE fid NOT IN (SELECT fid FROM bok WHERE fid IS NOT NULL);"),
    tabeller: [D.tab.forfatter, D.tab.bok], visInndata: false,
    steg: [
      { line: 3, tekst: "Med <span class=\"mono\">WHERE fid IS NOT NULL</span> i delspørringen er NULL-en borte fra lista.", tabell: T("delspørringen", ["fid"], [[1], [1], [2], [3], [4]]) },
      { line: 3, tekst: "Nå blir <span class=\"mono\">5 NOT IN (1, 1, 2, 3, 4)</span> TRUE for Ferrante.",
        tabell: T("WHERE fid NOT IN (…)", ["navn", "fid", "fid NOT IN (…)"], NI_EV.slice(0, 4).concat([["Ferrante", 5, "TRUE"]]), list(["drop", "drop", "drop", "drop", "keep"])) },
      { line: 1, tekst: "<b>Resultat:</b> Ferrante.", tabell: T("resultat", ["navn"], [["Ferrante"]]) }
    ]
  };

  /* ---- Blokk 5 · «for alle» med NOT EXISTS ---- */
  var lStatus = ["drop", "keep", "drop", "keep", "drop"];
  function lMarks(upto) { return list(LAANER.map(function (l, i) { return i < upto ? lStatus[i] : i === upto ? "hit" : null; })); }
  function ulevert(lid) { return UTLAAN.filter(function (u) { return u[1] === lid && u[3] === null; }); }
  function antLaan(lid) { return UTLAAN.filter(function (u) { return u[1] === lid; }).length; }
  D.steg.forAlle = {
    sql: S("SELECT l.navn",
      "FROM låner AS l",
      "WHERE NOT EXISTS (",
      "  SELECT *",
      "  FROM utlån AS u",
      "  WHERE u.lid = l.lid",
      "    AND u.levert IS NULL",
      ");"),
    tabeller: [D.tab.laaner, D.tab.utlaan], visInndata: false,
    steg: LAANER.map(function (l, i) {
      var rows = ulevert(l[0]), n = antLaan(l[0]);
      var t = "Låner <b>" + l[1] + "</b> har " + (n === 0 ? "ingen lån" : n + (n === 1 ? " lån" : " lån")) + ". Delspørringen leter etter et <i>ulevert</i> lån. ";
      if (rows.length) t += "Den finner ett (bok " + rows[0][0] + "), så «alt er levert» er usant. " + l[1] + " droppes.";
      else if (n === 0) t += "Det finnes ingen lån i det hele tatt, så det finnes heller ikke noe ulevert. Påstanden «alle lånene er levert» er <b>tomt sann</b>, og Dina er med.";
      else t += "Den finner ingenting, så alle lånene er levert. " + l[1] + " er med.";
      return { line: i === 0 ? 7 : 3, tekst: t,
        tabeller: [T("låner", K_LAANER, LAANER, lMarks(i)), T("ulevert lån for lid = " + l[0], ["bid", "lid", "dato", "levert"], rows, null, { tom: "(ingen: tomt svar)" })] };
    }).concat([{ line: 1, tekst: "<b>Resultat:</b> Bo og Dina. Vil du ikke ha med lånere uten lån, bruk tellevarianten med indre join (gir bare Bo).",
      tabell: T("resultat", ["navn"], [["Bo"], ["Dina"]]) }])
  };

  /* ---- Blokk 4 · WHERE med NULL ---- */
  var BOK_EV = BOK.map(function (b) {
    var a = tv(b[3] < 1900), c = b[4] === null ? null : tv(b[4] > 100);
    var and = a === "FALSE" || c === "FALSE" ? "FALSE" : (a === null || c === null ? null : "TRUE");
    return [b[1], b[3], b[4], a, c, and];
  });
  D.steg.whereNull = {
    sql: S("SELECT tittel, år",
      "FROM bok",
      "WHERE år < 1900 AND sider > 100;"),
    tabeller: [D.tab.bok], visInndata: false,
    steg: [
      { line: 2, tekst: "<b>FROM bok:</b> alle 6 radene.", tabell: D.tab.bok },
      { line: 3, tekst: { eli5: "For hver bok svarer vi ja, nei eller «vet ikke» på begge spørsmålene. Folkeeventyr er gammel nok, men ingen vet hvor mange sider den har. Da blir svaret «vet ikke», og boka kommer ikke med.",
        normal: "<b>WHERE</b> regnes ut for hver rad og kan bli TRUE, FALSE eller NULL. Bare TRUE gir plass i svaret. For Folkeeventyr er <span class=\"mono\">sider &gt; 100</span> NULL, og <span class=\"mono\">TRUE AND NULL</span> er NULL.",
        teknisk: "Sammenligning med NULL gir NULL (ukjent). AND gir FALSE hvis én side er FALSE, ellers NULL hvis én side er NULL. Folkeeventyr har derfor NULL i hele betingelsen og faller ut, selv om den er fra før 1900." },
        tabell: T("WHERE", ["tittel", "år", "sider", "år < 1900", "sider > 100", "AND"], BOK_EV, rm(6, function (i) { return BOK_EV[i][5] === "TRUE" ? "keep" : "drop"; })) },
      { line: 1, tekst: "<b>SELECT tittel, år:</b> 2 rader.", tabell: T("resultat", ["tittel", "år"], [["Et dukkehjem", 1879], ["Peer Gynt", 1867]]) }
    ]
  };

  /* ---- Blokk 4 · hele løpet (FROM → WHERE → SELECT → ORDER BY → LIMIT) ---- */
  var A_J = [[1, "Ada", 10, "2026-09-01", "2026-09-10"], [1, "Ada", 11, "2026-09-05", null], [2, "Bo", 13, "2026-09-07", "2026-09-20"],
    [3, "Cato", 10, "2026-10-01", null], [3, "Cato", 14, "2026-10-02", "2026-10-15"], [5, "Ibsen", 12, "2026-10-03", null]];
  var K_AJ = ["l.lid", "l.navn", "u.bid", "u.dato", "u.levert"];
  D.steg.anatomi = {
    sql: S("SELECT l.navn, u.dato",
      "FROM låner AS l",
      "  INNER JOIN utlån AS u ON (l.lid = u.lid)",
      "WHERE u.levert IS NULL",
      "ORDER BY u.dato DESC",
      "LIMIT 2;"),
    tabeller: [D.tab.laaner, D.tab.utlaan], visInndata: false,
    steg: [
      { line: 3, tekst: { eli5: "Først legger vi hvert lån ved siden av personen som lånte. Det blir seks par.",
        normal: "<b>1 · FROM + JOIN:</b> tabellen det skal velges fra. Én rad per utlån, 6 rader.",
        teknisk: "<b>1 · FROM</b> med alle join-er evalueres først. Alt senere (WHERE, SELECT, ORDER BY) jobber på denne tabellen, og alle kolonnene fra begge tabellene er tilgjengelige." },
        tabell: T("FROM … INNER JOIN", K_AJ, A_J) },
      { line: 4, tekst: { eli5: "Vi beholder bare lånene der feltet «levert» er tomt.",
        normal: "<b>2 · WHERE u.levert IS NULL:</b> tre lån er ikke levert. Legg merke til <span class=\"mono\">IS NULL</span>: <span class=\"mono\">= NULL</span> hadde gitt 0 rader.",
        teknisk: "<b>2 · WHERE</b> beholder radene der betingelsen er TRUE. <span class=\"mono\">IS NULL</span> er den eneste testen som gir TRUE for en NULL-verdi." },
        tabell: T("WHERE", K_AJ, A_J, list(["drop", "keep", "drop", "keep", "drop", "keep"])) },
      { line: 1, tekst: { eli5: "Vi stryker kolonnene vi ikke trenger. Navn og dato er igjen.",
        normal: "<b>3 · SELECT l.navn, u.dato:</b> uttrykkene regnes ut og kolonnene får navn. Navn laget med <span class=\"mono\">AS</span> finnes først fra nå av.",
        teknisk: "<b>3 · SELECT</b> kommer etter WHERE. Derfor kan ikke WHERE bruke et SELECT-alias, men ORDER BY kan (kursets navneregel). (GROUP BY og HAVING hadde kommet mellom WHERE og SELECT, se blokk 5.)" },
        tabell: T("SELECT", ["navn", "dato"], [["Ada", "2026-09-05"], ["Cato", "2026-10-01"], ["Ibsen", "2026-10-03"]]) },
      { line: 5, tekst: "<b>4 · ORDER BY u.dato DESC:</b> nyeste dato først. Uten ORDER BY har svaret ingen fast rekkefølge.",
        tabell: T("ORDER BY", ["navn", "dato"], [["Ibsen", "2026-10-03"], ["Cato", "2026-10-01"], ["Ada", "2026-09-05"]]) },
      { line: 6, tekst: "<b>5 · LIMIT 2:</b> de to første radene. LIMIT kommer helt til slutt, etter sorteringen.",
        tabell: T("LIMIT", ["navn", "dato"], [["Ibsen", "2026-10-03"], ["Cato", "2026-10-01"], ["Ada", "2026-09-05"]], list(["keep", "keep", "drop"])) },
      { line: 1, tekst: "<b>Resultat:</b> de to siste lånene som ikke er levert.", tabell: T("resultat", ["navn", "dato"], [["Ibsen", "2026-10-03"], ["Cato", "2026-10-01"]]) }
    ]
  };

  /* ---- Blokk 4 · indre join fra kryssprodukt ---- */
  var K_XBF = ["b.bid", "b.tittel", "b.fid", "f.fid", "f.navn"];
  var X_BF_EQ = X_BF.map(function (r) { return r.concat([tv(eq(r[2], r[3]))]); });
  var IJ = [[10, "Et dukkehjem", 1, 1, "Ibsen"], [11, "Peer Gynt", 1, 1, "Ibsen"], [12, "Kristin Lavransdatter", 2, 2, "Undset"],
    [13, "Mrs Dalloway", 3, 3, "Woolf"], [14, "Brødrene Løvehjerte", 4, 4, "Lindgren"]];
  D.steg.innerJoin = {
    sql: S("SELECT b.tittel, f.navn",
      "FROM bok AS b",
      "  INNER JOIN forfatter AS f ON (b.fid = f.fid);"),
    tabeller: [D.tab.bok, D.tab.forfatter], visInndata: false,
    steg: [
      { line: 2, tekst: { eli5: "Vi legger hver bok ved siden av hvert eneste forfatterkort, også de som ikke passer. Seks bøker og fem kort blir 30 par.",
        normal: "<b>Kryssproduktet</b> <span class=\"mono\">bok × forfatter</span>: alle kombinasjoner, 6 × 5 = 30 rader. Det er dette <span class=\"mono\">FROM bok, forfatter</span> gir uten WHERE.",
        teknisk: "<span class=\"mono\">FROM t1, t2</span> er kryssproduktet <span class=\"mono\">t1 × t2</span> fra relasjonsalgebraen. En join er dette kryssproduktet med en seleksjon på join-betingelsen: <span class=\"mono\">σ(b.fid = f.fid)(bok × forfatter)</span>." },
        tabell: T("bok × forfatter", K_XBF, X_BF) },
      { line: 3, tekst: "<b>ON (b.fid = f.fid)</b> sjekkes for hvert par, og bare TRUE beholdes. For Folkeeventyr er <span class=\"mono\">b.fid</span> NULL, så alle fem sammenligningene blir NULL.",
        tabell: T("ON-betingelsen", K_XBF.concat(["b.fid = f.fid"]), X_BF_EQ, rm(30, function (i) { return X_BF_EQ[i][5] === "TRUE" ? "keep" : "drop"; })) },
      { line: 3, tekst: "Igjen står de 5 parene som hører sammen. Ferrante (ingen bøker) og Folkeeventyr (ingen forfatter) har ingen partner. Den implisitte formen <span class=\"mono\">FROM bok AS b, forfatter AS f WHERE b.fid = f.fid</span> gir de samme radene.",
        tabell: T("INNER JOIN", K_XBF, IJ) },
      { line: 1, tekst: "<b>SELECT b.tittel, f.navn:</b> 5 rader.",
        tabell: T("resultat", ["tittel", "navn"], [["Et dukkehjem", "Ibsen"], ["Peer Gynt", "Ibsen"], ["Kristin Lavransdatter", "Undset"], ["Mrs Dalloway", "Woolf"], ["Brødrene Løvehjerte", "Lindgren"]]) }
    ]
  };

  /* ---- Blokk 4 · NATURAL JOIN-fellen ---- */
  var NJ1 = [[1, 10, "Ada", "Oslo"], [1, 11, "Ada", "Oslo"], [2, 13, "Bo", "Bergen"], [3, 10, "Cato", "Oslo"], [3, 14, "Cato", "Oslo"], [5, 12, "Ibsen", "Skien"]];
  var NJ2 = [[10, 1, "Ada", "Et dukkehjem", 1], [11, 1, "Ada", "Peer Gynt", 1], [13, 2, "Bo", "Mrs Dalloway", 3],
    [10, 3, "Cato", "Et dukkehjem", 1], [14, 3, "Cato", "Brødrene Løvehjerte", 4], [12, 5, "Ibsen", "Kristin Lavransdatter", 2]];
  var NJ3 = NJ2.map(function (r) { var f = FORF.filter(function (x) { return x[0] === r[4]; })[0]; return [r[2], r[3], r[4], f[1], tv(r[2] === f[1])]; });
  D.steg.naturalFelle = {
    sql: S("SELECT *",
      "FROM utlån",
      "  NATURAL JOIN låner",
      "  NATURAL JOIN bok",
      "  NATURAL JOIN forfatter;"),
    tabeller: [D.tab.utlaan, D.tab.laaner, D.tab.bok, D.tab.forfatter], visInndata: false,
    steg: [
      { line: 3, tekst: "<b>utlån NATURAL JOIN låner:</b> eneste felles kolonnenavn er <span class=\"mono\">lid</span>. 6 rader, akkurat som ønsket. (Noen kolonner er skjult her.)",
        tabell: T("utlån ⋈ låner (felles: lid)", ["lid", "bid", "navn", "sted"], NJ1) },
      { line: 4, tekst: "<b>… NATURAL JOIN bok:</b> felles kolonne er <span class=\"mono\">bid</span>. Fortsatt 6 rader. Men nå har mellomtabellen en kolonne <span class=\"mono\">navn</span> (lånerens) og en kolonne <span class=\"mono\">fid</span> (bokas).",
        tabell: T("… ⋈ bok (felles: bid)", ["bid", "lid", "navn", "tittel", "fid"], NJ2) },
      { line: 5, tekst: { eli5: "Det siste steget kobler på alle kolonner med samme navn. Både forfatteren og låneren har et «navn», så maskinen krever at de heter det samme. Det gjør de aldri her.",
        normal: "<b>… NATURAL JOIN forfatter:</b> felles kolonner er <span class=\"mono\">fid</span> <b>og</b> <span class=\"mono\">navn</span>. Joinen krever at låneren heter det samme som forfatteren av boka. Låneren Ibsen lånte en bok av Undset, så ingen rad passer.",
        teknisk: "NATURAL JOIN likhetsjoiner på <i>alle</i> felles kolonnenavn. Her blir betingelsen <span class=\"mono\">fid = forfatter.fid AND navn = forfatter.navn</span>. Det andre leddet er FALSE for alle seks radene. Ingen feilmelding, bare et tomt svar." },
        tabell: T("… ⋈ forfatter (felles: fid, navn)", ["navn (låner)", "tittel", "fid", "forfatter.navn", "navn like?"], NJ3, list(["drop", "drop", "drop", "drop", "drop", "drop"])) },
      { line: 1, tekst: "<b>Resultat: 0 rader.</b> Bruk <span class=\"mono\">INNER JOIN … ON</span> (eller <span class=\"mono\">USING</span>) og si nøyaktig hva som skal kobles.",
        tabell: T("resultat", ["…"], [], null, { tom: "(0 rader)" }) }
    ]
  };

  /* ---- Blokk 4 · selvjoin ---- */
  var SJ = [[1, "Ada", "Oslo", 1, "Ada"], [1, "Ada", "Oslo", 3, "Cato"], [2, "Bo", "Bergen", 2, "Bo"], [3, "Cato", "Oslo", 1, "Ada"], [3, "Cato", "Oslo", 3, "Cato"], [5, "Ibsen", "Skien", 5, "Ibsen"]];
  D.steg.selvjoin = {
    sql: S("SELECT l1.navn, l2.navn",
      "FROM låner AS l1",
      "  INNER JOIN låner AS l2 ON (l1.sted = l2.sted)",
      "WHERE l1.lid < l2.lid;"),
    tabeller: [D.tab.laaner], visInndata: false,
    steg: [
      { line: 3, tekst: "<b>Selvjoin:</b> samme tabell to ganger, med aliasene <span class=\"mono\">l1</span> og <span class=\"mono\">l2</span>. 6 par: hver låner med kjent sted paret med seg selv, pluss Ada–Cato og Cato–Ada. Dina er aldri med, heller ikke med seg selv, fordi <span class=\"mono\">NULL = NULL</span> er NULL.",
        tabell: T("låner l1 ⋈ låner l2", ["l1.lid", "l1.navn", "l1.sted", "l2.lid", "l2.navn"], SJ) },
      { line: 4, tekst: "<b>WHERE l1.lid &lt; l2.lid</b> fjerner parene med seg selv og den ene av de to rekkefølgene. Med <span class=\"mono\">!=</span> hadde du fått 2 rader (begge rekkefølger).",
        tabell: T("WHERE", ["l1.lid", "l1.navn", "l1.sted", "l2.lid", "l2.navn"], SJ, list(["drop", "keep", "drop", "drop", "drop", "drop"])) },
      { line: 1, tekst: "<b>Resultat:</b> 1 rad. Gi gjerne kolonnene egne navn (<span class=\"mono\">AS låner1</span>), ellers heter begge <span class=\"mono\">navn</span>.",
        tabell: T("resultat", ["navn", "navn"], [["Ada", "Cato"]]) }
    ]
  };

  /* ---- Blokk 4 · UPDATE og DELETE ---- */
  var UTL_ETTER = [[10, 1, "2026-09-01", "2026-09-10"], [11, 1, "2026-09-05", "2026-09-19"], [13, 2, "2026-09-07", "2026-09-20"],
    [10, 3, "2026-10-01", "2026-10-15"], [14, 3, "2026-10-02", "2026-10-15"], [12, 5, "2026-10-03", "2026-10-17"]];
  D.steg.update = {
    sql: S("UPDATE utlån",
      "SET levert = dato + 14",
      "WHERE levert IS NULL;"),
    tabeller: [D.tab.utlaan], visInndata: false,
    steg: [
      { line: 3, tekst: "<b>WHERE levert IS NULL</b> velger radene som skal endres, med de samme reglene som i SELECT. Tre rader treffes. Med <span class=\"mono\">= NULL</span> hadde ingen rader blitt truffet.",
        tabell: T("utlån: radene WHERE treffer", K_UTLAAN, UTLAAN, list([null, "hit", null, "hit", null, "hit"])) },
      { line: 2, tekst: "<b>SET levert = dato + 14</b> regnes ut for hver truffet rad med radens egen <span class=\"mono\">dato</span>. I PostgreSQL gir <span class=\"mono\">dato + 14</span> datoen 14 dager senere. 3 rader endres.",
        tabell: T("utlån etterpå", K_UTLAAN, UTL_ETTER, { rader: { 1: "new", 3: "new", 5: "new" }, celler: { "1,3": "hit", "3,3": "hit", "5,3": "hit" } }) }
    ]
  };
  D.steg.delete = {
    sql: S("DELETE FROM utlån",
      "WHERE dato < '2026-10-01';"),
    tabeller: [D.tab.utlaan], visInndata: false,
    steg: [
      { line: 2, tekst: "<b>WHERE dato &lt; '2026-10-01'</b>: de tre lånene fra september skal slettes.", tabell: T("utlån", K_UTLAAN, UTLAAN, list(["drop", "drop", "drop", null, null, null])) },
      { line: 1, tekst: "<b>DELETE</b> fjerner dem. Tre rader står igjen. Uten WHERE hadde alle radene blitt slettet.", tabell: T("utlån etterpå", K_UTLAAN, UTLAAN.slice(3)) }
    ]
  };

  /* ================= Widget: sannhetstabell med NULL ================= */
  var VALS = ["TRUE", "FALSE", "NULL"];
  function vAnd(a, b) { return a === "FALSE" || b === "FALSE" ? "FALSE" : (a === "NULL" || b === "NULL" ? "NULL" : "TRUE"); }
  function vOr(a, b) { return a === "TRUE" || b === "TRUE" ? "TRUE" : (a === "NULL" || b === "NULL" ? "NULL" : "FALSE"); }
  function vNot(a) { return a === "TRUE" ? "FALSE" : a === "FALSE" ? "TRUE" : "NULL"; }
  D.logic = { and: vAnd, or: vOr, not: vNot };

  var TT_PRESETS = [
    { navn: "Folkeeventyr: år < 1900 AND sider > 100", a: "TRUE", b: "NULL", op: "and",
      txt: "Fra blokk 4: <span class=\"mono\">1841 &lt; 1900</span> er TRUE, men <span class=\"mono\">NULL &gt; 100</span> er NULL. <span class=\"mono\">TRUE AND NULL</span> er NULL, så boka faller ut av svaret." },
    { navn: "Folkeeventyr: år > 1900 AND sider > 100", a: "FALSE", b: "NULL", op: "and",
      txt: "Én FALSE er nok for AND: <span class=\"mono\">FALSE AND NULL</span> er FALSE, uansett hva den ukjente verdien er." },
    { navn: "Dina: sted = 'Oslo' OR sted != 'Oslo'", a: "NULL", b: "NULL", op: "or",
      txt: "Begge sammenligningene med NULL gir NULL, og <span class=\"mono\">NULL OR NULL</span> er NULL. Derfor gir denne «alltid sanne» betingelsen bare 4 av 5 lånere." },
    { navn: "Bo: sted = 'Oslo' OR lid = 2", a: "FALSE", b: "TRUE", op: "or",
      txt: "Én TRUE er nok for OR. Bo kommer med." },
    { navn: "Dina: NOT (sted = 'Oslo')", a: "NULL", b: "TRUE", op: "not",
      txt: "<span class=\"mono\">NOT NULL</span> er fortsatt NULL. Å snu en ukjent påstand gir en ukjent påstand, så Dina er heller ikke med i <span class=\"mono\">NOT (sted = 'Oslo')</span>." }
  ];

  D.truthTable = function (host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var el = IN.el, st = { a: "TRUE", b: "NULL", op: "and", txt: "" };
    var wrap = el("div", { class: "tt card" });
    var pre = el("div", { class: "tt-presets" }, [el("span", { class: "lbl small", text: "Eksempler fra databasen:" })]);
    TT_PRESETS.forEach(function (p) {
      pre.appendChild(el("button", { class: "btn sm", type: "button", text: p.navn, onclick: function () { st.a = p.a; st.b = p.b; st.op = p.op; st.txt = p.txt; paint(); } }));
    });
    wrap.appendChild(pre);
    var pick = el("div", { class: "tt-pick" });
    function picker(key, label) {
      var g = el("div", { class: "tt-group", role: "group", "aria-label": "Verdien til " + label });
      g.appendChild(el("span", { class: "tt-var mono", text: label + " =" }));
      VALS.forEach(function (v) {
        var b = el("button", { class: "btn sm tt-v tt-" + v, type: "button", "aria-pressed": "false", text: v, onclick: function () { st[key] = v; st.txt = ""; paint(); } });
        b._v = v; b._k = key; g.appendChild(b);
      });
      return g;
    }
    pick.appendChild(picker("a", "a")); pick.appendChild(picker("b", "b"));
    wrap.appendChild(pick);
    var out = el("div", { class: "tt-out", "aria-live": "polite" });
    wrap.appendChild(out);
    var note = el("p", { class: "tt-note small" });
    wrap.appendChild(note);
    var grids = el("div", { class: "tt-grids" });
    wrap.appendChild(grids);
    host.appendChild(wrap);

    function cell(v, on) { return el("td", { class: "tt-c tt-" + v + (on ? " on" : ""), text: v }); }
    function grid(op, fn) {
      var t = el("table", { class: "tt-tab" + (st.op === op ? " cur" : "") });
      var cap = el("caption", { class: "mono", text: op === "and" ? "a AND b" : "a OR b" });
      t.appendChild(cap);
      var hr = el("tr", {}, [el("th", { scope: "col", class: "mono", text: "a \\ b" })]);
      VALS.forEach(function (v) { hr.appendChild(el("th", { scope: "col", text: v })); });
      t.appendChild(el("thead", {}, [hr]));
      var tb = el("tbody");
      VALS.forEach(function (a) {
        var tr = el("tr", {}, [el("th", { scope: "row", text: a })]);
        VALS.forEach(function (b) { tr.appendChild(cell(fn(a, b), a === st.a && b === st.b)); });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      return t;
    }
    function notGrid() {
      var t = el("table", { class: "tt-tab" + (st.op === "not" ? " cur" : "") });
      t.appendChild(el("caption", { class: "mono", text: "NOT a" }));
      t.appendChild(el("thead", {}, [el("tr", {}, [el("th", { scope: "col", text: "a" }), el("th", { scope: "col", text: "NOT a" })])]));
      var tb = el("tbody");
      VALS.forEach(function (a) { tb.appendChild(el("tr", {}, [el("th", { scope: "row", text: a }), cell(vNot(a), a === st.a)])); });
      t.appendChild(tb);
      return t;
    }
    function res(label, v, cur) {
      return el("div", { class: "tt-res" + (cur ? " cur" : "") }, [
        el("span", { class: "mono tt-expr", text: label }),
        el("span", { class: "tt-c tt-" + v, text: v }),
        el("span", { class: "small tt-where", text: v === "TRUE" ? "WHERE beholder raden" : "WHERE kaster raden" })]);
    }
    function paint() {
      IN.qsa(".tt-v", pick).forEach(function (b) { b.setAttribute("aria-pressed", st[b._k] === b._v ? "true" : "false"); });
      IN.clear(out);
      out.appendChild(res(st.a + " AND " + st.b, vAnd(st.a, st.b), st.op === "and"));
      out.appendChild(res(st.a + " OR " + st.b, vOr(st.a, st.b), st.op === "or"));
      out.appendChild(res("NOT " + st.a, vNot(st.a), st.op === "not"));
      note.innerHTML = st.txt || "Huskeregel: én FALSE avgjør AND, én TRUE avgjør OR. Ellers smitter NULL. WHERE (og ON, og HAVING) beholder bare TRUE.";
      IN.clear(grids);
      grids.appendChild(grid("and", vAnd)); grids.appendChild(grid("or", vOr)); grids.appendChild(notGrid());
    }
    paint();
    return { set: function (a, b) { st.a = a; st.b = b; paint(); } };
  };

  /* ================= Widget: mengdeoperatorer ================= */
  var SO_LID_A = [[1], [1], [2], [3], [3], [5]], SO_LID_B = [[1], [2], [3], [4], [5]];
  var SO_N_A = [["Ibsen"], ["Undset"], ["Woolf"], ["Lindgren"], ["Ferrante"]], SO_N_B = [["Ada"], ["Bo"], ["Cato"], ["Dina"], ["Ibsen"]];
  D.setOpsData = [
    { id: "navn", label: "Navn (forfatter og låner)", kol: "navn",
      L: { navn: "SELECT navn FROM forfatter", rader: SO_N_A }, R: { navn: "SELECT navn FROM låner", rader: SO_N_B },
      ops: [
        { op: "UNION", res: [["Ibsen"], ["Undset"], ["Woolf"], ["Lindgren"], ["Ferrante"], ["Ada"], ["Bo"], ["Cato"], ["Dina"]],
          rm: [null, null, null, null, "drop"], txt: "Alle navn fra begge, uten duplikater: <b>9 rader</b>. Ibsen står i begge, men kommer med én gang. Rekkefølgen er ikke garantert." },
        { op: "UNION ALL", res: SO_N_A.concat(SO_N_B), txt: "Listene stiftes sammen uten at noe strykes: <b>10 rader</b>, Ibsen to ganger." },
        { op: "INTERSECT", res: [["Ibsen"]], lm: [0, 0, 0, 0, 0].map(function (x, i) { return i === 0 ? "hit" : null; }), rm: [null, null, null, null, "hit"],
          txt: "Navn som finnes i begge: <b>1 rad</b>, Ibsen. Kolonnene matches etter plass, og verdiene sammenlignes, ikke hvem de tilhører." },
        { op: "EXCEPT", res: [["Undset"], ["Woolf"], ["Lindgren"], ["Ferrante"]], lm: ["drop", "keep", "keep", "keep", "keep"], rm: [null, null, null, null, "hit"],
          txt: "Navn i den første som ikke finnes i den andre: <b>4 rader</b>. Ibsen strykes fordi en låner heter det samme." }
      ] },
    { id: "lid", label: "lid (med duplikater)", kol: "lid",
      L: { navn: "SELECT lid FROM utlån", rader: SO_LID_A }, R: { navn: "SELECT lid FROM låner", rader: SO_LID_B },
      ops: [
        { op: "UNION", res: [[1], [2], [3], [4], [5]], txt: "Hver verdi én gang: <b>5 rader</b>. Duplikatene i utlån (1 og 3 to ganger) forsvinner også." },
        { op: "UNION ALL", res: [[1], [1], [1], [2], [2], [3], [3], [3], [4], [5], [5]], txt: "m + n forekomster: <b>11 rader</b> (6 + 5). Her sortert for å gjøre det lett å telle." },
        { op: "INTERSECT", res: [[1], [2], [3], [5]], lm: ["hit", "hit", "hit", "hit", "hit", "hit"], rm: ["hit", "hit", "hit", null, "hit"],
          txt: "Verdier som finnes i begge, uten duplikater: <b>4 rader</b>. 4 (Dina) finnes bare i låner." },
        { op: "INTERSECT ALL", res: [[1], [2], [3], [5]], lm: ["hit", "drop", "hit", "hit", "drop", "hit"], rm: ["hit", "hit", "hit", "drop", "hit"],
          txt: "min(m, n) forekomster: 1 står 2 ganger til venstre og 1 gang til høyre, så den kommer med én gang. Samme for 3. <b>4 rader.</b>" },
        { op: "EXCEPT", res: [], lm: ["drop", "drop", "drop", "drop", "drop", "drop"], rm: ["hit", "hit", "hit", null, "hit"],
          txt: "Alle lid i utlån finnes i låner (fremmednøkkel), så svaret er <b>tomt</b>." },
        { op: "EXCEPT ALL", res: [[1], [3]], lm: ["drop", "keep", "drop", "drop", "keep", "drop"], rm: ["hit", "hit", "hit", null, "hit"],
          txt: "max(m − n, 0) forekomster: hver forekomst til høyre stryker én til venstre. Igjen står én 1 og én 3: <b>2 rader</b>. Uten ALL hadde svaret vært 0." },
        { op: "EXCEPT", flip: true, res: [[4]], lm: ["drop", "drop", "drop", "keep", "drop"], rm: ["hit", "hit", "hit", "hit", "hit", "hit"],
          txt: "Snudd rekkefølge: lid i låner som ikke finnes i utlån, altså lånere uten lån: <b>1 rad</b> (Dina). EXCEPT er ikke symmetrisk. Dette er en av kursets fire måter å skrive «uten»." }
      ] }
  ];

  D.setOps = function (host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var el = IN.el, ds = D.setOpsData[0], oi = 0;
    var wrap = el("div", { class: "so card" });
    var dsRow = el("div", { class: "so-row", role: "group", "aria-label": "Datasett" }, [el("span", { class: "lbl small", text: "Data:" })]);
    var opRow = el("div", { class: "so-row", role: "group", "aria-label": "Operator" }, [el("span", { class: "lbl small", text: "Operator:" })]);
    var sqlBox = el("div", { class: "so-sql" }), tabs = el("div", { class: "rel-row so-tabs" }), txt = el("p", { class: "so-txt", "aria-live": "polite" });
    wrap.appendChild(dsRow); wrap.appendChild(opRow); wrap.appendChild(sqlBox); wrap.appendChild(tabs); wrap.appendChild(txt);
    host.appendChild(wrap);
    D.setOpsData.forEach(function (d) {
      var b = el("button", { class: "btn sm", type: "button", text: d.label, onclick: function () { ds = d; oi = 0; buildOps(); paint(); } });
      b._d = d; dsRow.appendChild(b);
    });
    function opLabel(o) { return o.flip ? o.op + " (snudd)" : o.op; }
    function buildOps() {
      IN.qsa("button", opRow).forEach(function (b) { b.parentNode.removeChild(b); });
      ds.ops.forEach(function (o, i) {
        var b = el("button", { class: "btn sm mono", type: "button", text: opLabel(o), onclick: function () { oi = i; paint(); } });
        b._i = i; opRow.appendChild(b);
      });
    }
    function paint() {
      IN.qsa("button", dsRow).forEach(function (b) { b.setAttribute("aria-pressed", b._d === ds ? "true" : "false"); });
      IN.qsa("button", opRow).forEach(function (b) { b.setAttribute("aria-pressed", b._i === oi ? "true" : "false"); });
      var o = ds.ops[oi], L = o.flip ? ds.R : ds.L, R = o.flip ? ds.L : ds.R;
      IN.clear(sqlBox); IN.sqlBlock(sqlBox, L.navn + "\n" + o.op + "\n" + R.navn + ";");
      IN.clear(tabs);
      IN.vizTable(tabs, T("venstre", [ds.kol], L.rader, o.lm ? list(o.lm) : null));
      IN.vizTable(tabs, T("høyre", [ds.kol], R.rader, o.rm ? list(o.rm) : null));
      IN.vizTable(tabs, T(opLabel(o), [ds.kol], o.res, rm(o.res.length, function () { return "new"; }), { tom: "(0 rader)" }));
      txt.innerHTML = o.txt;
    }
    buildOps(); paint();
  };

  /* ================= Widget: LIMIT og OFFSET ================= */
  var SORT_AAR = [["Folkeeventyr", 1841], ["Peer Gynt", 1867], ["Et dukkehjem", 1879], ["Kristin Lavransdatter", 1920], ["Mrs Dalloway", 1925], ["Brødrene Løvehjerte", 1973]];
  D.limitOffset = function (host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var el = IN.el, st = { limit: 2, offset: 1 };
    var wrap = el("div", { class: "lo card" });
    var ctl = el("div", { class: "lo-ctl" });
    function stepper(key, label, max) {
      var val = el("span", { class: "mono lo-val", "aria-live": "polite" });
      var minus = el("button", { class: "btn sm", type: "button", text: "−", "aria-label": label + " én mindre", onclick: function () { if (st[key] > 0) { st[key]--; paint(); } } });
      var plus = el("button", { class: "btn sm", type: "button", text: "+", "aria-label": label + " én mer", onclick: function () { if (st[key] < max) { st[key]++; paint(); } } });
      var g = el("span", { class: "lo-step" }, [el("span", { class: "mono", text: label }), minus, val, plus]);
      g._val = val; g._key = key;
      return g;
    }
    var gL = stepper("limit", "LIMIT", 7), gO = stepper("offset", "OFFSET", 7);
    ctl.appendChild(gL); ctl.appendChild(gO);
    var sqlBox = el("div"), tabBox = el("div"), sum = el("p", { class: "lo-sum" });
    wrap.appendChild(ctl); wrap.appendChild(sqlBox); wrap.appendChild(tabBox); wrap.appendChild(sum);
    host.appendChild(wrap);
    function paint() {
      gL._val.textContent = st.limit; gO._val.textContent = st.offset;
      IN.clear(sqlBox); IN.sqlBlock(sqlBox, "SELECT tittel, år\nFROM bok\nORDER BY år\nLIMIT " + st.limit + " OFFSET " + st.offset + ";");
      IN.clear(tabBox);
      IN.vizTable(tabBox, T("bok sortert på år", ["tittel", "år"], SORT_AAR,
        rm(6, function (i) { return i >= st.offset && i < st.offset + st.limit ? "keep" : "drop"; })));
      var n = Math.min(st.limit, Math.max(6 - st.offset, 0));
      sum.innerHTML = "<b>" + n + (n === 1 ? " rad" : " rader") + ".</b> OFFSET hopper over de " + st.offset + " første, og LIMIT tar høyst " + st.limit +
        " av resten: <span class=\"mono\">min(" + st.limit + ", max(6 − " + st.offset + ", 0)) = " + n + "</span>." +
        (st.offset >= 6 ? " OFFSET er så stor at ingen rader er igjen." : "") + (st.limit > 6 - st.offset && st.offset < 6 ? " LIMIT er en øvre grense, ikke et krav." : "");
    }
    paint();
  };

  /* ================= Merker til sidehodet fra eksamensbanken ================= */
  function yearKey(y) { var mm = /^([HV])(\d{4})$/.exec(y || ""); return mm ? +mm[2] * 2 + (mm[1] === "H" ? 1 : 0) : 0; }
  D.badges = function (host, block) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return 0;
    var bank = window.IN_EXAM_BANK || {}, out = [];
    Object.keys(bank).forEach(function (y) {
      var ex = bank[y];
      (ex.oppgaver || []).forEach(function (o) { if (o.block === block) out.push({ y: ex.year || o.year || y, o: o }); });
    });
    out.sort(function (a, b) { return yearKey(b.y) - yearKey(a.y) || String(a.o.key).localeCompare(String(b.o.key), "nb", { numeric: true }); });
    out.forEach(function (x) {
      var id = "o-" + String(x.o.key).replace(/[^A-Za-z0-9_-]/g, "_");
      host.appendChild(IN.el("a", { class: "badge", href: "#fane=eksamen&oppg=" + id,
        html: "<b>" + esc(x.y) + "</b> · " + esc(x.o.title || x.o.oppgave_nr || x.o.key) + (x.o.points ? ' · <span class="pts">' + esc(x.o.points) + "p</span>" : "") }));
    });
    return out.length;
  };

  /* Punkter med sql-felt → render-funksjon til IN.quiz / IN.tfTest */
  D.withSql = function (items) {
    return items.map(function (it) {
      var o = {}; for (var k in it) if (Object.prototype.hasOwnProperty.call(it, k)) o[k] = it[k];
      if (it.sql) o.render = function (node) { IN.sqlBlock(node, it.sql); };
      return o;
    });
  };

  /* ================= Forklaringer på tre nivåer ================= */
  D.explain5 = {
    aggregering: {
      eli5: "<p>Du tømmer en pose med kuler på bordet. <span class=\"mono\">count</span> er å telle alle kulene. <span class=\"mono\">GROUP BY farge</span> er å sortere kulene i hauger etter farge og så telle hver haug for seg.</p><p><span class=\"mono\">WHERE</span> er å kaste de knuste kulene <i>før</i> du lager hauger. <span class=\"mono\">HAVING</span> er å fjerne de haugene som har færre enn to kuler <i>etter</i> at du har telt.</p>",
      normal: "<p>Uten GROUP BY blir hele tabellen én gruppe, og svaret blir én rad. Med <span class=\"mono\">GROUP BY f.fid, f.navn</span> får du én rad per forfatter.</p><p>Alt du skriver i SELECT, må enten stå i GROUP BY eller være inne i en aggregatfunksjon. Ellers vet ikke databasen hvilken av radene i gruppa den skal hente verdien fra.</p><p>Aggregater kan ikke stå i WHERE, fordi WHERE ser på én rad om gangen og gruppene ikke finnes ennå. Det er derfor HAVING finnes. Aggregatene hopper over NULL, unntatt <span class=\"mono\">count(*)</span>, som teller rader.</p>",
      teknisk: "<p>Den logiske rekkefølgen er <span class=\"mono\">FROM → WHERE → GROUP BY → aggregat → HAVING → SELECT → ORDER BY</span>. Hver gruppe blir én rad i svaret. Kolonner som verken grupperes på eller aggregeres, er bare lovlige hvis de er funksjonelt avhengige av gruppekolonnene. I PostgreSQL gjelder det når du grupperer på primærnøkkelen til en tabell: da kan du velge andre kolonner fra samme tabell, og sensor trekker ikke for det.</p><p>Et SELECT-alias kan ikke brukes i HAVING, så skriv <span class=\"mono\">HAVING count(*) &gt;= 2</span>, ikke <span class=\"mono\">HAVING antall &gt;= 2</span>. Typer: <span class=\"mono\">count</span> gir <span class=\"mono\">bigint</span>, <span class=\"mono\">sum</span> av <span class=\"mono\">int</span> gir <span class=\"mono\">bigint</span>, og <span class=\"mono\">avg</span> av <span class=\"mono\">int</span> gir <span class=\"mono\">numeric</span>.</p><p>Grupperer man på en kolonne med NULL, havner alle NULL-ene i <i>én</i> gruppe. Et aggregat uten GROUP BY gir alltid nøyaktig én rad, også på tom input, mens GROUP BY på tom input gir null rader.</p>"
    },
    delsporringer: {
      eli5: "<p>Du vil finne de tykkeste bøkene. Først spør du: «Hvor mange sider har en bok i snitt?» Svaret er 360. Så spør du: «Hvilke bøker har mer enn 360 sider?»</p><p>En delspørring er å stille det første spørsmålet inne i det andre, så du slipper å skrive ned 360 selv.</p>",
      normal: "<p>Det finnes fire vanlige plasser for en delspørring:</p><ul><li><b>Som verdi:</b> <span class=\"mono\">WHERE sider &gt; (SELECT avg(sider) FROM bok)</span>. Delspørringen må gi nøyaktig én verdi.</li><li><b>Med IN:</b> <span class=\"mono\">WHERE lid IN (SELECT lid FROM utlån …)</span>. Delspørringen gir en kolonne med verdier.</li><li><b>Med EXISTS:</b> <span class=\"mono\">WHERE EXISTS (SELECT * FROM … WHERE …)</span>. Sann hvis delspørringen gir minst én rad. Hva den velger, spiller ingen rolle.</li><li><b>I FROM:</b> <span class=\"mono\">FROM (SELECT …) AS t</span>. Delspørringen må få et navn.</li></ul><p>En delspørring med IN eller EXISTS gir aldri duplikater i den ytre spørringen, fordi hver ytre rad bare sjekkes én gang. Det gjør dem nyttige når en join ville gitt samme person flere ganger.</p>",
      teknisk: "<p>En ukorrelert delspørring kan regnes ut én gang. En korrelert delspørring (for eksempel <span class=\"mono\">WHERE u.lid = l.lid</span>, der <span class=\"mono\">l</span> er fra den ytre spørringen) regnes logisk sett ut for hver ytre rad. Navn fra den ytre FROM kan brukes inne i delspørringer, men ikke motsatt.</p><p>En korrelert delspørring i SELECT gir én verdi per rad, og en <span class=\"mono\">count(*)</span> der gir 0 for rader uten treff, i motsetning til en indre join.</p><p><span class=\"mono\">NOT EXISTS</span> er den sikreste måten å skrive «finnes ikke». <span class=\"mono\">NOT IN</span> gir feil svar når delspørringen inneholder NULL (se fanen NULL). Kurset viser at «uten» kan skrives på fire måter: <span class=\"mono\">NOT IN</span>, <span class=\"mono\">NOT EXISTS</span>, <span class=\"mono\">EXCEPT</span> og <span class=\"mono\">LEFT JOIN … IS NULL</span>.</p>"
    },
    with: {
      eli5: "<p>Du lager en kladdelapp først («antall lån per person») og legger den på bordet. Så kan du se på lappen så mange ganger du vil når du svarer på det egentlige spørsmålet («hvem har flest?»).</p>",
      normal: "<p>WITH gjør lange spørringer lesbare. Du deler problemet i steg, gir hvert steg et navn og bygger videre. Det er særlig nyttig når samme mellomresultat trengs to ganger, som i «hvem har flest lån?», der du både må finne det største antallet og hvem som har det.</p><p>WITH-tabellen finnes bare i den ene spørringen den hører til. Den lagres ikke slik et VIEW gjør.</p>",
      teknisk: "<p>WITH er logisk det samme som å skrive delspørringen i FROM, men navnet er synlig i alle etterfølgende spørringer, også i delspørringer i WHERE. Det gjør det mulig å regne ut et maksimum over et aggregat uten å skrive aggregatet to ganger.</p><p>Kursets egne løsninger bruker WITH til å <b>filtrere før en LEFT JOIN</b>, slik at radene som ikke passer filteret, blir med som 0 i stedet for å forsvinne (se fanen Ytre join). Rekursive WITH-spørringer er ikke pensum.</p>"
    },
    "ytre-join": {
      eli5: "<p>Du lager en liste over alle forfatterne og skriver bøkene deres ved siden av. Med vanlig (indre) join stryker du forfattere som ikke har skrevet noe. Med LEFT JOIN lar du dem stå med en tom rute ved siden av.</p>",
      normal: "<p><span class=\"mono\">forfatter LEFT JOIN bok</span> gir alle forfatterne. De som har bøker, får én rad per bok, og Ferrante får én rad med NULL i bok-kolonnene. Dette er det du trenger når oppgaven sier «også de med 0».</p><p>Tell da med <span class=\"mono\">count(b.bid)</span>, ikke <span class=\"mono\">count(*)</span>. <span class=\"mono\">count(*)</span> teller Ferrantes NULL-rad som 1, mens <span class=\"mono\">count(b.bid)</span> hopper over NULL og gir 0.</p>",
      teknisk: "<p>En ytre join er indre join <i>pluss</i> radene uten partner, fylt ut med NULL. Når flere tabeller skal kobles og 0-radene skal bevares, må alle join-ene etter den første LEFT JOIN-en også være ytre. Ellers fjerner den neste indre join-en NULL-radene igjen.</p><p>Betingelser på den høyre tabellen hører hjemme i <span class=\"mono\">ON</span> eller i en WITH som filtrerer først, ikke i WHERE. WHERE evalueres etter joinen, og <span class=\"mono\">u.dato &gt;= '2026-10-01'</span> blir NULL for rader uten partner, så de forsvinner. LEFT JOIN-en blir da i praksis en indre join. Kurset løser dette ved å filtrere i en WITH før joinen. At en WHERE på høyre tabell ødelegger LEFT JOIN, står ikke rett ut i lysarkene. Det er en tilleggsfelle.</p>"
    },
    "null": {
      eli5: "<p>NULL er et spørsmålstegn på et skjema. Spør noen «bor Dina i Oslo?», er svaret «vet ikke». Spør noen «bor Dina <i>ikke</i> i Oslo?», er svaret også «vet ikke».</p><p>Spørsmålstegnet er heller ikke likt et annet spørsmålstegn, for to ukjente ting trenger ikke være det samme.</p>",
      normal: "<p>En betingelse kan få tre utfall: TRUE, FALSE og NULL. Kombinasjonene følger sunn fornuft:</p><ul><li><span class=\"mono\">NULL AND FALSE</span> er FALSE (én FALSE er nok).</li><li><span class=\"mono\">NULL OR TRUE</span> er TRUE (én TRUE er nok).</li><li>Alt annet med NULL i blir NULL, også <span class=\"mono\">NOT</span> av en NULL-betingelse.</li></ul><p>Aritmetikk med NULL gir NULL (<span class=\"mono\">NULL + 10</span>). <span class=\"mono\">count(kol)</span>, <span class=\"mono\">sum</span>, <span class=\"mono\">avg</span>, <span class=\"mono\">min</span> og <span class=\"mono\">max</span> hopper over NULL-verdier. <span class=\"mono\">count(*)</span> teller rader uansett innhold.</p>",
      teknisk: "<p>At WHERE krever TRUE, gjør at både <span class=\"mono\">sted = 'Oslo'</span> og <span class=\"mono\">sted != 'Oslo'</span> utelater Dina. Til sammen gir de 4 rader, ikke 5. Kurset regner det ut på et lite eksempel med alder 2, 4 og NULL: <span class=\"mono\">min</span> gir 2, <span class=\"mono\">avg</span> gir 3, <span class=\"mono\">count(kol)</span> gir 2 og <span class=\"mono\">count(*)</span> gir 3. <span class=\"mono\">sum</span> over null rader gir NULL, mens <span class=\"mono\">count</span> gir 0.</p><p>To ting om typer ved andeler: <span class=\"mono\">count</span> gir <span class=\"mono\">bigint</span>, og <span class=\"mono\">bigint / bigint</span> er heltallsdivisjon i PostgreSQL. Cast én av dem: <span class=\"mono\">count(levert)::float / count(*)</span>.</p><p>DISTINCT og GROUP BY regner NULL-er som like, selv om <span class=\"mono\">NULL = NULL</span> ikke er TRUE. Det gir én NULL-rad eller én NULL-gruppe. <span class=\"mono\">count(DISTINCT kol)</span> hopper over NULL.</p>"
    },
    mengde: {
      eli5: "<p>Du har to gjestelister. UNION er en felles liste der ingen står to ganger. INTERSECT er de som står på begge listene. EXCEPT er de som står på den første, men ikke på den andre. UNION ALL er å stifte listene sammen uten å stryke noen, så noen kan stå to ganger.</p>",
      normal: "<p>Kolonnene matches etter <i>plass</i>, ikke etter navn. Svaret får kolonnenavnene fra den første spørringen.</p><p><span class=\"mono\">UNION ALL</span> er det kurset bruker for å sette sammen delsvar før en aggregering, gjerne med en konstant kolonne: <span class=\"mono\">SELECT lid, 2 AS poeng FROM … UNION ALL SELECT lid, 5 AS poeng FROM …</span>. Her er ALL viktig. Uten ALL forsvinner like rader, og summen blir for liten.</p>",
      teknisk: "<p>Uten ALL er operatorene mengdeoperasjoner som i relasjonsalgebraen (∪, ∩, ∖), og svaret er uten duplikater. Med ALL regnes det med antall forekomster. Forekommer en rad m ganger til venstre og n ganger til høyre, gir <span class=\"mono\">UNION ALL</span> m + n, <span class=\"mono\">INTERSECT ALL</span> min(m, n) og <span class=\"mono\">EXCEPT ALL</span> max(m − n, 0).</p><p>Mengdeoperatorene evalueres etter SELECT og DISTINCT i hver del, men før en ORDER BY som gjelder hele svaret. Mange spørringer med UNION kan skrives om med OR og DISTINCT, og EXCEPT kan skrives med NOT EXISTS.</p>"
    },
    "for-alle": {
      eli5: "<p>«Har alle elevene levert leksene?» kan du sjekke ved å lete etter én elev som <i>ikke</i> har levert. Finner du ingen, har alle levert. Det er dobbel negasjon.</p><p>Det motsatte, «har noen levert?», er mye enklere: du leter etter én som har levert.</p>",
      normal: "<p>Den vanligste eksamensfeilen er å svare på «finnes» når oppgaven spør om «for alle». «Lånere som har levert <i>alle</i> lånene sine» blir feil hvis du bare plukker lånere med <i>ett</i> levert lån (<span class=\"mono\">WHERE levert IS NOT NULL</span> + DISTINCT). Det riktige er å plukke lånere der det <i>ikke finnes</i> et ulevert lån.</p><p>Merk at en låner uten lån oppfyller «alle lånene er levert»: det finnes ingen ulevert lån å vise til. Påstanden er <b>tomt sann</b>. Vil du ikke ha med disse, kreves en join eller en ekstra EXISTS.</p>",
      teknisk: "<p>Mønsteret er <span class=\"mono\">NOT EXISTS (SELECT … WHERE &lt;korrelert&gt; AND NOT &lt;betingelse&gt;)</span>. Gjelder «for alle» en annen tabell («har lånt <i>alle</i> Ibsen-bøkene»), blir det to nivåer: det finnes ingen Ibsen-bok som det ikke finnes et lån av for denne låneren.</p><p>Tellevarianten sammenligner antall: <span class=\"mono\">HAVING count(DISTINCT b.bid) = (SELECT count(*) …)</span> eller <span class=\"mono\">HAVING count(*) = count(u.levert)</span>. Tellevarianten tar ikke med tomt sanne tilfeller når den bruker indre join. Begge variantene er riktige, og sensor vurderer dem etter spørsmålet.</p>"
    },
    radantall: {
      eli5: "<p>Det er som å følge en oppskrift. Du teller hvor mange kaker som er på brettet etter hvert steg: etter at du har bakt dem (FROM), etter at du har kastet de brente (WHERE), etter at du har lagt dem i esker (GROUP BY), og så videre.</p>",
      normal: "<p>Gå gjennom spørringen i denne rekkefølgen:</p><ol><li><b>FROM:</b> Hvor mange rader gir joinen? Kryssprodukt: gang antallene. Indre join: tell parene som passer. LEFT JOIN: parene + venstre rader uten partner. NATURAL JOIN: sjekk <i>alle</i> felles kolonnenavn.</li><li><b>WHERE:</b> Fjern rader der betingelsen er FALSE <i>eller NULL</i>.</li><li><b>GROUP BY:</b> Antall rader blir antall ulike verdier (NULL er én gruppe). Uten GROUP BY, men med aggregat: nøyaktig 1 rad.</li><li><b>HAVING:</b> Fjern grupper.</li><li><b>DISTINCT:</b> Fjern like rader (NULL-er er like).</li><li><b>UNION/INTERSECT/EXCEPT:</b> Fjern duplikater uten ALL.</li><li><b>LIMIT/OFFSET:</b> <span class=\"mono\">min(LIMIT, max(rader − OFFSET, 0))</span>.</li></ol>",
      teknisk: "<p>De vanligste snublesteinene:</p><ul><li>NULL i WHERE eller i join-betingelsen: raden faller ut, også i <span class=\"mono\">x = x</span> og <span class=\"mono\">x != x</span>.</li><li>Aggregat uten GROUP BY gir 1 rad selv om WHERE fjerner alt.</li><li>NATURAL JOIN av en tabell med seg selv gir tabellen tilbake, men bare radene uten NULL.</li><li><span class=\"mono\">navn != navn</span> gir alltid 0 rader.</li><li>OFFSET større enn antall rader gir 0.</li><li><span class=\"mono\">NOT IN</span> mot en liste med NULL gir 0.</li><li>LEFT JOIN gir minst like mange rader som venstre tabell.</li></ul><p>Siden galt svar gir minuspoeng, lønner det seg å la være å svare når du ikke klarer å regne det ut.</p>"
    }
  };

  D.explain4 = {
    anatomi: {
      eli5: "<p>Tenk deg at du spør bibliotekaren: «Gå til bokhylla, plukk ut bøkene som er eldre enn 1900, og les opp tittel og år på dem.» Du sier hvilken hylle, hvilke bøker og hva du vil vite. Du sier ikke hvilken rekkefølge hun skal gå langs hylla i. Det bestemmer hun selv. Svaret hennes er en ny, liten liste.</p>",
      normal: "<p>En enkel spørring har tre deler. <span class=\"mono\">FROM</span> peker på tabellen (eller tabellene). <span class=\"mono\">WHERE</span> er en betingelse som sjekkes for hver rad, og bare radene der betingelsen blir TRUE, kommer med. <span class=\"mono\">SELECT</span> plukker ut kolonnene du vil se, og kan også regne med dem (<span class=\"mono\">sider / 100</span>) eller gi dem nye navn med <span class=\"mono\">AS</span>.</p><p>Betingelser kombineres med <span class=\"mono\">AND</span>, <span class=\"mono\">OR</span> og <span class=\"mono\">NOT</span>. Bruk parenteser når du blander AND og OR. Tekst søkes i med <span class=\"mono\">LIKE</span>, der <span class=\"mono\">%</span> står for «hva som helst, også ingenting» og <span class=\"mono\">_</span> for nøyaktig ett tegn. Svaret har ingen fast rekkefølge før du legger til <span class=\"mono\">ORDER BY</span>, og det kan inneholde like rader, fordi SQL-tabeller er multimengder.</p>",
      teknisk: "<p>En spørring <span class=\"mono\">SELECT k FROM t WHERE b</span> tilsvarer relasjonsalgebrauttrykket <span class=\"mono\">π<sub>k</sub>(σ<sub>b</sub>(t))</span>. Det stemmer bare opp til duplikater, siden relasjonsalgebraen er mengdebasert og SQL er multimengdebasert. For hver rad blir WHERE-betingelsen TRUE, FALSE eller NULL, og bare TRUE gir plass i svaret.</p><p>Den <i>logiske</i> rekkefølgen klausulene evalueres i, forklarer navnereglene: et navn som lages i SELECT, finnes ikke ennå når WHERE evalueres, men det finnes når ORDER BY kjøres. Kurset sier det som en regel: SELECT-navn kan brukes i ORDER BY og i ytre spørringer, men ikke i WHERE eller HAVING. Lysarkene viser skriverekkefølgen og navnereglene. Lista med evalueringsrekkefølgen er vår oppsummering.</p><p>SQL skiller ikke mellom store og små bokstaver i nøkkelord og tabell- og kolonnenavn, men i verdier gjør det det: <span class=\"mono\">'oslo'</span> og <span class=\"mono\">'Oslo'</span> er to ulike verdier.</p>"
    },
    join: {
      eli5: "<p>Du har en bunke med bøker og en bunke med forfatterkort. Kryssproduktet er å legge hver bok ved siden av hvert eneste kort, også de som ikke passer. En join er å bare beholde parene der forfatternummeret på boka er det samme som på kortet. Bøker uten kort, og kort uten bøker, blir liggende igjen.</p>",
      normal: "<p><span class=\"mono\">FROM bok, forfatter</span> gir 6 × 5 = 30 rader, de fleste meningsløse. Legger du til <span class=\"mono\">WHERE bok.fid = forfatter.fid</span>, står bare de fem riktige parene igjen. Det samme kan skrives eksplisitt: <span class=\"mono\">FROM bok AS b INNER JOIN forfatter AS f ON (b.fid = f.fid)</span>. Kurset kaller den første formen <i>implisitt</i> og den andre <i>eksplisitt</i> join. De gir samme svar, men den eksplisitte viser tydeligere hva som kobles.</p><p>Når to tabeller har kolonner med samme navn, må du skrive tabellnavnet eller aliaset foran (<span class=\"mono\">b.fid</span>). Heter kolonnene det samme på begge sider, kan du skrive <span class=\"mono\">USING (fid)</span> i stedet for ON. <span class=\"mono\">JOIN</span> alene betyr <span class=\"mono\">INNER JOIN</span>.</p>",
      teknisk: "<p>Kryssproduktet er × fra relasjonsalgebraen, og <span class=\"mono\">SELECT k FROM t1, …, tn WHERE b</span> tilsvarer <span class=\"mono\">π<sub>k</sub>(σ<sub>b</sub>(t1 × … × tn))</span>. Er betingelsen likhet, kalles det equi-join. Er den en vilkårlig sammenligning (<span class=\"mono\">&lt;</span>, <span class=\"mono\">!=</span>, <span class=\"mono\">LIKE</span>), kalles det theta-join. Alle disse er indre join-er: en rad uten partner forsvinner.</p><p>En selvjoin krever to alias (<span class=\"mono\">låner AS l1, låner AS l2</span>) for at kolonnene skal kunne skilles. <span class=\"mono\">NATURAL JOIN</span> likhetsjoiner på <i>alle</i> felles kolonnenavn og viser hver felles kolonne bare én gang. Det er praktisk, men skjørt: to tabeller som begge har en kolonne <span class=\"mono\">navn</span>, blir også joinet på navn, og da får du ofte et tomt eller galt svar uten feilmelding. Siden NULL aldri er lik noe, faller også rader med NULL i en felles kolonne ut av en naturlig join.</p>"
    },
    distinct: {
      eli5: "<p>Ber du om alle stedene lånerne bor, får du «Oslo» to ganger fordi to lånere bor der. <span class=\"mono\">DISTINCT</span> er som å stryke dubletter på handlelista. <span class=\"mono\">ORDER BY</span> er å legge lista i alfabetisk rekkefølge, og <span class=\"mono\">LIMIT 3</span> er å bare lese opp de tre øverste.</p>",
      normal: "<p>Uten DISTINCT gir <span class=\"mono\">SELECT sted FROM låner</span> fem rader, én per låner. Med DISTINCT står hvert sted én gang. Dinas NULL står også én gang, fordi DISTINCT regner alle NULL-verdier som like.</p><p><span class=\"mono\">ORDER BY</span> kan ha flere kolonner: først sorteres det på den første, og ved likhet på den neste. Standard er stigende (fra minst til størst). <span class=\"mono\">LIMIT</span> og <span class=\"mono\">OFFSET</span> brukes nesten alltid sammen med ORDER BY, ellers er det tilfeldig hvilke rader du får.</p>",
      teknisk: "<p>Projeksjon i relasjonsalgebraen fjerner duplikater automatisk, mens SQL-projeksjon ikke gjør det. Det er derfor oversettelsen <span class=\"mono\">π(σ(…))</span> bare stemmer «opp til duplikater». Multimengder trengs for at aggregering skal virke: to bøker med 200 sider skal telle to ganger i en sum. DISTINCT virker på hele raden, ikke på én kolonne: <span class=\"mono\">SELECT DISTINCT lid, bid</span> fjerner bare rader der <i>begge</i> er like.</p><p>Sorteringen følger typens naturlige orden: tall etter verdi, tekst alfabetisk, datoer kronologisk. Uten ORDER BY har svaret ingen garantert rekkefølge. I PostgreSQL regnes NULL som <i>større</i> enn alle andre verdier ved sortering. NULL havner derfor sist med stigende orden og <b>først</b> med DESC. Dette står ikke i lysarkene, men det påvirker «topp n»-spørringer.</p>"
    },
    skranker: {
      eli5: "<p>Skrankene er reglene på et skjema du fyller ut. «Navn må fylles ut» er NOT NULL. «Lånekortnummeret ditt må ikke være brukt før» er UNIQUE. «Boka du låner, må finnes i katalogen» er en fremmednøkkel. «Sidetallet må være større enn null» er CHECK. Bryter du en regel, blir skjemaet avvist, og ingenting blir lagret.</p>",
      normal: "<p>Skrankene kan skrives rett etter kolonnen (<span class=\"mono\">navn text NOT NULL</span>) eller samlet til slutt med <span class=\"mono\">CONSTRAINT navn …</span>. Den siste formen trengs når skranken gjelder flere kolonner, for eksempel en sammensatt primærnøkkel <span class=\"mono\">PRIMARY KEY (bid, lid, dato)</span> eller <span class=\"mono\">UNIQUE (tittel, år)</span>.</p><p>En tabell kan bare ha én PRIMARY KEY. Andre kandidatnøkler får <span class=\"mono\">UNIQUE NOT NULL</span>. En fremmednøkkel skrives <span class=\"mono\">fid int REFERENCES forfatter(fid)</span>, og da kan du bare sette inn fid-verdier som finnes i forfatter, eller NULL. Du kan heller ikke slette eller endre en forfatter som noen bøker peker på.</p>",
      teknisk: "<p>Skrankene er databasens måte å håndheve skjemaet på. De tilsvarer nøkkelbegrepene fra relasjonsmodellen: PN blir PRIMARY KEY, andre KN blir UNIQUE NOT NULL, og FN blir REFERENCES. Tre NULL-regler er verdt å kunne utenat:</p><ol><li><b>CHECK slipper gjennom NULL.</b> Et CHECK-uttrykk avviser bare når det blir FALSE. <span class=\"mono\">NULL &gt; 0</span> blir NULL, så raden godtas. Vil du stoppe NULL, må du i tillegg ha NOT NULL.</li><li><b>UNIQUE tillater flere NULL.</b> To rader med NULL i en UNIQUE-kolonne regnes ikke som like (standard i PostgreSQL). Det er grunnen til at PRIMARY KEY er UNIQUE <i>og</i> NOT NULL.</li><li><b>En fremmednøkkel kan være NULL</b> med mindre den også har NOT NULL. NULL betyr «peker ikke på noe».</li></ol><p>Typene er strenge: en <span class=\"mono\">int</span>-kolonne godtar bare heltall. En literal som <span class=\"mono\">'2026'</span> er utypet og blir tolket (castet) til kolonnens type. <span class=\"mono\">CREATE TABLE ny AS SELECT …</span> kopierer dataene, men <i>ikke</i> skrankene. <span class=\"mono\">SERIAL</span> gir automatisk økende heltall, og <span class=\"mono\">DEFAULT</span> gir en standardverdi når kolonnen utelates i INSERT.</p>"
    },
    endring: {
      eli5: "<p>INSERT er å skrive et nytt kort i kartoteket. UPDATE er å viske ut og skrive nytt på kort som passer en beskrivelse («alle lån som ikke er levert»). DELETE er å ta ut kortene som passer beskrivelsen. Glemmer du beskrivelsen, gjelder det hele kartoteket.</p>",
      normal: "<p><span class=\"mono\">INSERT INTO låner VALUES (6, 'Eli', 'Tromsø');</span> gir verdiene i kolonnerekkefølgen fra CREATE TABLE. Vil du bare fylle noen kolonner, lister du dem: <span class=\"mono\">INSERT INTO låner(lid, navn) VALUES (6, 'Eli');</span>. Da blir sted NULL, eller DEFAULT-verdien hvis det finnes en.</p><p><span class=\"mono\">UPDATE … SET kol = uttrykk</span> kan bruke radens gamle verdi (<span class=\"mono\">sider = sider + 10</span>). Alle skranker sjekkes ved hver kommando, så en UPDATE eller DELETE kan feile på grunn av en fremmednøkkel. Feiler én rad, utføres ingen av endringene i kommandoen.</p>",
      teknisk: "<p><span class=\"mono\">INSERT INTO t SELECT …</span> setter inn hele svaret fra en spørring, og kolonnene i SELECT må passe med tabellens kolonner i antall og type. WHERE i UPDATE og DELETE følger de samme reglene som i SELECT: bare rader der betingelsen er TRUE, berøres. <span class=\"mono\">WHERE levert = NULL</span> treffer derfor ingen rader.</p><p>Delspørringer er lov i både SET og WHERE. En <i>korrelert</i> delspørring i SET regnes ut på nytt for hver rad, og det er slik du kopierer en verdi fra en annen tabell (H2025 oppgave 2.4, se blokk 5). I PostgreSQL gir <span class=\"mono\">dato + 14</span> datoen 14 dager senere. En transaksjon oppfyller ACID. Det viktigste for eksamen er atomisiteten: feiler én kommando mellom BEGIN og COMMIT, rulles alle tilbake.</p>"
    }
  };

  /* ================= Blokk 5 · flervalg (fanevis) ================= */
  D.quiz5 = {
    aggregering: [
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT lid, count(*)\nFROM utlån\nGROUP BY lid\nHAVING count(*) > 1;",
        options: ["1", "2", "4", "6"], answer: 1,
        explain: "Gruppene er lid 1 (2 lån), 2 (1), 3 (2) og 5 (1). HAVING beholder lid 1 og 3." }
    ],
    "ytre-join": [
      { q: "Hva gir <span class=\"mono\">count(*)</span> for Ferrante i denne spørringen?",
        sql: "SELECT f.navn, count(*)\nFROM forfatter AS f\n  LEFT JOIN bok AS b ON (f.fid = b.fid)\nGROUP BY f.fid, f.navn;",
        options: ["0", "1", "NULL", "Ferrante er ikke med"], answer: 1,
        explain: "LEFT JOIN gir Ferrante én rad med NULL i bok-kolonnene. <span class=\"mono\">count(*)</span> teller den raden. Med <span class=\"mono\">count(b.bid)</span> hadde svaret blitt 0." }
    ],
    "null": [
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT count(*)\nFROM utlån\nWHERE dato > '2027-01-01';",
        options: ["0", "1", "6", "Feil"], answer: 1,
        explain: "Ingen rader passer WHERE, men et aggregat uten GROUP BY gir alltid én rad. Den har verdien 0." }
    ],
    delsporringer: [
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT navn\nFROM forfatter\nWHERE fid NOT IN (SELECT fid FROM bok);",
        options: ["0", "1", "4", "5"], answer: 0,
        explain: "Delspørringen gir 1, 1, 2, 3, 4 og NULL. For Ferrante blir <span class=\"mono\">5 != NULL</span> NULL, så hele NOT IN blir NULL. For de andre er svaret FALSE. <span class=\"mono\">NOT EXISTS</span> hadde gitt Ferrante." }
    ],
    mengde: [
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT lid FROM utlån\nEXCEPT ALL\nSELECT lid FROM låner;",
        options: ["0", "1", "2", "6"], answer: 2,
        explain: "utlån har {1, 1, 2, 3, 3, 5}. Hver forekomst i låner fjerner én. Igjen står én 1 og én 3. Uten ALL ville svaret vært 0." }
    ],
    "for-alle": [
      { q: "Hvilke lånere gir denne betingelsen for låner <span class=\"mono\">l</span>?",
        sql: "NOT EXISTS (SELECT *\n            FROM utlån AS u\n            WHERE u.lid = l.lid\n              AND u.levert IS NULL)",
        options: ["Bo", "Bo og Dina", "Ada, Bo og Cato", "Dina"], answer: 1,
        explain: "Ada, Cato og Ibsen har ulevert lån. Bo har levert alt. Dina har ingen lån, så påstanden er tomt sann." }
    ]
  };

  /* ================= Blokk 5 · sant/usant ================= */
  D.tf5 = [
    { tema: "Aggregering og GROUP BY", s: "<span class=\"mono\">SELECT fid, count(*) FROM bok WHERE count(*) &gt; 1 GROUP BY fid;</span> er lovlig.", answer: false,
      explain: "Aggregater kan ikke stå i WHERE. Bruk <span class=\"mono\">HAVING count(*) &gt; 1</span> etter GROUP BY. Sensor trekker 2 poeng." },
    { tema: "Aggregering og GROUP BY", s: "<span class=\"mono\">SELECT avg(sider) FROM bok;</span> gir 300.", answer: false,
      explain: "avg hopper over NULL og deler 1800 på 5, altså 360. 300 er <span class=\"mono\">sum(sider) / count(*)</span>." },
    { tema: "Aggregering og GROUP BY", s: "<span class=\"mono\">SELECT sted, count(*) FROM låner GROUP BY sted;</span> gir 4 rader.", answer: true,
      explain: "Oslo, Bergen, Skien og én gruppe for NULL." },
    { tema: "Delspørringer", s: "En delspørring i FROM bør få et navn med <span class=\"mono\">AS</span>.", answer: true,
      explain: "PostgreSQL før versjon 16 gir feil uten navn, og navnet trengs når du viser til kolonnene. Fra versjon 16 er det valgfritt, men skriv det alltid." },
    { tema: "WITH", s: "<span class=\"mono\">ORDER BY antall DESC LIMIT 1</span> gir alle som har flest lån.", answer: false,
      explain: "Det gir én rad. Ada og Cato har begge 2, og en av dem forsvinner. Bruk <span class=\"mono\">= (SELECT max(…))</span> for å få begge." },
    { tema: "Ytre join", s: "<span class=\"mono\">SELECT * FROM forfatter AS f FULL JOIN bok AS b ON (f.fid = b.fid);</span> gir 7 rader.", answer: true,
      explain: "Fem par, Ferrante uten bok og Folkeeventyr uten forfatter." },
    { tema: "Ytre join", s: "En WHERE-betingelse på høyre tabell etter en LEFT JOIN beholder radene uten partner.", answer: false,
      explain: "For rader uten partner er kolonnene NULL, så betingelsen blir NULL, og raden faller ut. Filtrer i ON eller i en WITH først. Tilleggsfelle: lysarkene sier det ikke rett ut." },
    { tema: "NULL", s: "<span class=\"mono\">SELECT count(levert) / count(*) FROM utlån;</span> gir 0.5 i PostgreSQL.", answer: false,
      explain: "Begge er <span class=\"mono\">bigint</span>, så det blir heltallsdivisjon: 3 / 6 = 0. Skriv <span class=\"mono\">count(levert)::float / count(*)</span>." },
    { tema: "NULL", s: "<span class=\"mono\">SELECT count(DISTINCT sted) FROM låner;</span> gir 3.", answer: true,
      explain: "Ulike steder er Oslo, Bergen og Skien. count hopper over NULL." },
    { tema: "Mengdeoperatorer", s: "<span class=\"mono\">SELECT navn FROM forfatter UNION SELECT navn FROM låner;</span> gir 10 rader.", answer: false,
      explain: "Ibsen står i begge tabellene og blir bare med én gang, så svaret er 9. UNION ALL gir 10." },
    { tema: "«For alle» og «finnes»", s: "«Lånere som har lånt alle Ibsen-bøkene» kan skrives med to nøstede <span class=\"mono\">NOT EXISTS</span>.", answer: true,
      explain: "Det finnes ingen Ibsen-bok som låneren ikke har lånt. Svaret er Ada." },
    { tema: "«Hvor mange rader?»", s: "<span class=\"mono\">SELECT * FROM bok NATURAL JOIN bok AS b2;</span> gir 6 rader.", answer: false,
      explain: "Det gir 5. Folkeeventyr har NULL i fid og sider, og NULL er ikke lik seg selv." }
  ];

  /* ================= Blokk 5 · «Hvor mange rader?» med eksamensregelen ================= */
  D.del1_5 = {
    type: "radantall",
    regel: { riktig: 2, feil: -0.5, blankt: 0, min: 0 },
    items: [
      { q: "Hvor mange rader?", sql: "SELECT * FROM forfatter, bok;", options: ["5", "11", "30", "36"], answer: 2,
        explain: "Ingen join-betingelse, så det er kryssproduktet: 5 × 6 = 30." },
      { q: "Hvor mange rader?", sql: "SELECT DISTINCT sted FROM låner;", options: ["3", "4", "5", "6"], answer: 1,
        explain: "Oslo, Bergen, NULL og Skien. Oslo står to ganger og blir én. NULL står én gang og <i>teller</i> som en rad." },
      { q: "Hvor mange rader?", sql: "SELECT sted, count(*)\nFROM låner\nGROUP BY sted;", options: ["1", "3", "4", "5"], answer: 2,
        explain: "4 grupper: Oslo, Bergen, Skien og én NULL-gruppe." },
      { q: "Hvor mange rader?", sql: "SELECT count(*)\nFROM utlån\nWHERE dato > '2027-01-01';", options: ["0", "1", "6"], answer: 1,
        explain: "WHERE fjerner alle radene, men et aggregat uten GROUP BY gir alltid én rad (her med verdien 0)." },
      { q: "Hvor mange rader?", sql: "SELECT lid\nFROM utlån\nGROUP BY lid\nHAVING count(*) > 1;", options: ["1", "2", "4", "6"], answer: 1,
        explain: "Gruppene er 1:2, 2:1, 3:2 og 5:1. HAVING beholder lid 1 og 3." },
      { q: "Hvor mange rader?", sql: "SELECT lid\nFROM utlån\nGROUP BY lid\nORDER BY count(*) DESC\nOFFSET 3;", options: ["0", "1", "3", "4"], answer: 1,
        explain: "4 grupper, og OFFSET 3 hopper over de tre første. Én er igjen." },
      { q: "Hvor mange rader?", sql: "SELECT *\nFROM forfatter AS f\n  FULL JOIN bok AS b ON (f.fid = b.fid);", options: ["5", "6", "7", "30"], answer: 2,
        explain: "5 par, pluss Ferrante uten bok, pluss Folkeeventyr uten forfatter." },
      { q: "Hvor mange rader?", sql: "SELECT *\nFROM låner AS l\n  LEFT JOIN utlån AS u ON (l.lid = u.lid);", options: ["5", "6", "7", "30"], answer: 2,
        explain: "De 6 lånene, pluss Dina med NULL. LEFT JOIN gir minst like mange rader som venstre tabell." },
      { q: "Hvor mange rader?", sql: "SELECT navn\nFROM forfatter\nWHERE fid NOT IN (SELECT fid FROM bok);", options: ["0", "1", "4", "5"], answer: 0,
        explain: "Lista fra delspørringen har en NULL (Folkeeventyr). Da blir NOT IN aldri TRUE, bare FALSE eller NULL." },
      { q: "Hvor mange rader?", sql: "SELECT *\nFROM utlån\nWHERE levert != levert;", options: ["0", "3", "6"], answer: 0,
        explain: "En verdi er aldri forskjellig fra seg selv, og for NULL blir det NULL. Aldri TRUE." },
      { q: "Hvor mange rader?", sql: "SELECT *\nFROM utlån\nWHERE levert = levert;", options: ["0", "3", "6"], answer: 1,
        explain: "TRUE bare der levert ikke er NULL. Tre lån er levert." },
      { q: "Hvor mange rader?", sql: "SELECT *\nFROM bok NATURAL JOIN bok AS b2;", options: ["0", "5", "6", "36"], answer: 1,
        explain: "Joinen går på alle kolonnene, så hver rad møter bare seg selv. Folkeeventyr har NULL i fid og sider og faller ut." },
      { q: "Hvor mange rader?", sql: "SELECT lid FROM utlån\nEXCEPT ALL\nSELECT lid FROM låner;", options: ["0", "1", "2", "6"], answer: 2,
        explain: "{1, 1, 2, 3, 3, 5} minus {1, 2, 3, 4, 5}, forekomst for forekomst: én 1 og én 3 er igjen." }
    ]
  };

  /* ================= Blokk 4 · flervalg (fanevis) ================= */
  D.quiz4 = {
    anatomi: [
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT *\nFROM låner\nWHERE sted != 'Oslo';", options: ["1", "2", "3", "5"], answer: 1,
        explain: "Bo (Bergen) og Ibsen (Skien). Ada og Cato bor i Oslo. For Dina er sted NULL, og <span class=\"mono\">NULL != 'Oslo'</span> blir NULL, som ikke er TRUE." }
    ],
    join: [
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT * FROM forfatter, bok;", options: ["5", "6", "11", "30"], answer: 3,
        explain: "Uten join-betingelse får du kryssproduktet: 5 forfattere × 6 bøker = 30 rader." },
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT * FROM låner NATURAL JOIN låner AS l2;", options: ["0", "4", "5", "25"], answer: 1,
        explain: "Naturlig join av en tabell med seg selv joiner på alle kolonnene, så hver rad møter bare seg selv. Dina har NULL i sted, og <span class=\"mono\">NULL = NULL</span> er ikke TRUE, så hennes rad faller ut." },
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT l1.navn, l2.navn\nFROM låner AS l1\n  INNER JOIN låner AS l2 ON (l1.sted = l2.sted);", options: ["2", "4", "6", "25"], answer: 2,
        explain: "Oslo har to lånere, som gir 2 × 2 = 4 par (Ada–Ada, Ada–Cato, Cato–Ada, Cato–Cato). Bergen og Skien gir ett par hver. Dina er ikke med, fordi NULL ikke er lik noe." }
    ],
    distinct: [
      { q: "Hvor mange rader gir spørringen?", sql: "SELECT *\nFROM bok\nORDER BY år\nLIMIT 3 OFFSET 4;", options: ["0", "2", "3", "6"], answer: 1,
        explain: "Tabellen har 6 rader. OFFSET 4 hopper over fire, og da er det bare to igjen. LIMIT 3 er en øvre grense, ikke et krav." }
    ],
    skranker: [
      { q: "Hvilken kommando er lovlig (fra de opprinnelige dataene)?",
        options: ["<span class=\"mono\">INSERT INTO bok VALUES (17, 'Peer Gynt', 1, 1867, 300);</span>", "<span class=\"mono\">UPDATE bok SET sider = NULL WHERE bid = 10;</span>",
          "<span class=\"mono\">DELETE FROM forfatter WHERE fid = 1;</span>", "<span class=\"mono\">INSERT INTO utlån VALUES (13, 9, '2026-11-01', NULL);</span>"], answer: 1,
        explain: "CHECK (sider &gt; 0) slipper gjennom NULL. Det første bryter UNIQUE (tittel, år), det tredje bryter fremmednøkkelen fra bok, og det fjerde bryter fremmednøkkelen til låner (lid 9 finnes ikke)." }
    ]
  };

  /* ================= Blokk 4 · sant/usant ================= */
  D.tf4 = [
    { tema: "Spørringens anatomi", s: "<span class=\"mono\">SELECT tittel FROM bok WHERE tittel LIKE 'e%';</span> gir Et dukkehjem.", answer: false,
      explain: "I PostgreSQL skiller LIKE mellom store og små bokstaver. Tittelen begynner med stor E, så svaret er 0 rader." },
    { tema: "Spørringens anatomi", s: "Et alias laget med <span class=\"mono\">AS</span> i SELECT kan brukes i ORDER BY, men ikke i WHERE.", answer: true,
      explain: "WHERE evalueres før SELECT, så navnet finnes ikke ennå." },
    { tema: "Spørringens anatomi", s: "<span class=\"mono\">SELECT tittel FROM bok WHERE sider &gt; 200 OR fid = 1;</span> gir 4 rader.", answer: true,
      explain: "Et dukkehjem (fid 1), Peer Gynt, Kristin Lavransdatter og Brødrene Løvehjerte. Mrs Dalloway har nøyaktig 200 sider. For Folkeeventyr blir begge deler NULL, og <span class=\"mono\">NULL OR NULL</span> er NULL." },
    { tema: "Join", s: "<span class=\"mono\">FROM bok AS b, forfatter AS f WHERE b.fid = f.fid</span> og <span class=\"mono\">FROM bok AS b INNER JOIN forfatter AS f ON (b.fid = f.fid)</span> gir samme svar.", answer: true,
      explain: "Det er implisitt og eksplisitt skrivemåte for samme indre join." },
    { tema: "Join", s: "<span class=\"mono\">utlån NATURAL JOIN låner NATURAL JOIN bok NATURAL JOIN forfatter</span> gir ett svar per utlån.", answer: false,
      explain: "låner og forfatter har begge kolonnen navn, så det siste steget joiner også på navn. Svaret blir 0 rader." },
    { tema: "DISTINCT og ORDER BY", s: "<span class=\"mono\">SELECT DISTINCT sted FROM låner;</span> gir 3 rader, fordi NULL ikke telles.", answer: false,
      explain: "Svaret har 4 rader: Oslo, Bergen, Skien og én NULL-rad. DISTINCT regner NULL-verdier som like og beholder én av dem. Det er <span class=\"mono\">count(DISTINCT sted)</span> som gir 3." },
    { tema: "DISTINCT og ORDER BY", s: "I PostgreSQL kommer NULL-verdier først når du sorterer med <span class=\"mono\">ORDER BY sider DESC</span>.", answer: true,
      explain: "PostgreSQL regner NULL som større enn alle verdier. Dette står ikke i lysarkene." },
    { tema: "CREATE TABLE og skranker", s: "En kolonne med UNIQUE kan inneholde NULL i flere rader.", answer: true,
      explain: "NULL-verdier regnes ikke som like i en UNIQUE-skranke. Derfor er PRIMARY KEY både UNIQUE og NOT NULL." },
    { tema: "CREATE TABLE og skranker", s: "<span class=\"mono\">CREATE TABLE ny AS SELECT * FROM bok;</span> gir en tabell med samme primærnøkkel som bok.", answer: false,
      explain: "Dataene kopieres, men ikke skrankene." },
    { tema: "CREATE TABLE og skranker", s: "En tabell kan ha to PRIMARY KEY-skranker hvis den har to kandidatnøkler.", answer: false,
      explain: "Bare én PRIMARY KEY per tabell. Den andre kandidatnøkkelen får UNIQUE NOT NULL." },
    { tema: "INSERT, UPDATE og DELETE", s: "<span class=\"mono\">UPDATE utlån SET levert = current_date WHERE levert = NULL;</span> oppdaterer de tre ulevert lånene.", answer: false,
      explain: "<span class=\"mono\">levert = NULL</span> blir NULL for alle rader, så ingen rader oppdateres. Bruk IS NULL." },
    { tema: "INSERT, UPDATE og DELETE", s: "<span class=\"mono\">DELETE FROM bok WHERE bid = 14;</span> lykkes.", answer: false,
      explain: "Et utlån (14, 3, …) peker på boka, og fremmednøkkelen hindrer slettingen." }
  ];

  /* ================= Blokk 4 · «Går denne gjennom?» (skranker) ================= */
  D.skranker = [
    { sql: "INSERT INTO bok VALUES (16, 'Sult', 6, 1890, 220);", answer: false, explain: "<b>Avvises.</b> Fremmednøkkelen: forfatter 6 finnes ikke." },
    { sql: "INSERT INTO bok VALUES (16, 'Sult', NULL, 1890, 220);", answer: true, explain: "<b>Godtas.</b> En fremmednøkkel kan være NULL. Den peker da ikke på noe." },
    { sql: "INSERT INTO bok VALUES (10, 'Sult', 1, 1890, 220);", answer: false, explain: "<b>Avvises.</b> Primærnøkkelen: bid 10 finnes allerede (Et dukkehjem)." },
    { sql: "INSERT INTO bok VALUES (17, 'Peer Gynt', 1, 1867, 300);", answer: false, explain: "<b>Avvises.</b> UNIQUE (tittel, år): Peer Gynt fra 1867 finnes." },
    { sql: "INSERT INTO bok VALUES (17, 'Peer Gynt', 1, 1876, 300);", answer: true, explain: "<b>Godtas.</b> Annet år, så kombinasjonen (tittel, år) er ny. UNIQUE gjelder paret, ikke hver kolonne for seg." },
    { sql: "INSERT INTO bok VALUES (18, 'Notatbok', NULL, NULL, NULL),\n                       (19, 'Notatbok', NULL, NULL, NULL);", answer: true,
      explain: "<b>Godtas.</b> UNIQUE godtar like titler når år er NULL (to NULL-er regnes ikke som like), og CHECK (sider &gt; 0) slipper gjennom NULL." },
    { sql: "UPDATE bok SET sider = 0 WHERE bid = 10;", answer: false, explain: "<b>Avvises.</b> CHECK (sider &gt; 0): 0 &gt; 0 er FALSE." },
    { sql: "UPDATE bok SET sider = NULL WHERE bid = 10;", answer: true, explain: "<b>Godtas.</b> CHECK avviser bare FALSE. <span class=\"mono\">NULL &gt; 0</span> er NULL, så raden slipper gjennom." },
    { sql: "INSERT INTO låner VALUES (6, NULL, 'Oslo');", answer: false, explain: "<b>Avvises.</b> NOT NULL på navn." },
    { sql: "DELETE FROM forfatter WHERE fid = 5;", answer: true, explain: "<b>Godtas.</b> Ingen bøker peker på Ferrante." },
    { sql: "DELETE FROM forfatter WHERE fid = 1;", answer: false, explain: "<b>Avvises.</b> Bok 10 og 11 peker på Ibsen. Fremmednøkler beskytter begge veier." },
    { sql: "DELETE FROM bok WHERE bid = 15;", answer: true, explain: "<b>Godtas.</b> Folkeeventyr er aldri lånt, så ingen utlån peker på den." },
    { sql: "DELETE FROM bok WHERE bid = 14;", answer: false, explain: "<b>Avvises.</b> Et utlån peker på bok 14 (Cato lånte Brødrene Løvehjerte)." },
    { sql: "INSERT INTO utlån VALUES (10, 1, '2026-09-01', NULL);", answer: false, explain: "<b>Avvises.</b> Primærnøkkelen (bid, lid, dato) finnes allerede." },
    { sql: "INSERT INTO utlån VALUES (10, 1, '2026-11-01', NULL);", answer: true, explain: "<b>Godtas.</b> Samme bok og låner, men ny dato. Det er kombinasjonen av alle tre som må være unik." },
    { sql: "INSERT INTO utlån VALUES (13, 4, '2026-11-01', '2026-10-30');", answer: false, explain: "<b>Avvises.</b> CHECK (levert &gt;= dato): boka kan ikke leveres før den er lånt." },
    { sql: "UPDATE låner SET lid = 7 WHERE lid = 4;", answer: true, explain: "<b>Godtas.</b> Dina har ingen utlån, så ingen fremmednøkkel peker på lid 4." },
    { sql: "UPDATE låner SET lid = 7 WHERE lid = 1;", answer: false, explain: "<b>Avvises.</b> To utlån peker på lid 1 (Ada). Å endre nøkkelen ville gjort dem foreldreløse." }
  ];
})();
