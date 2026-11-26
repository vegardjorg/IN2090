/* ============================================================
   IN2090 guide · data-sql-ovelser.js
   «Skriv SQL»-oppgaver på bibliotekdatabasen (blokk 4 og 5).
   Eksempeldataene er de samme som i IN.dataSql (data-sql.js). Testdatabasen («felle») har
   10–24 rader per tabell med NULL, rader uten partner, likt sidetall og like navn
   (to lånere som heter Ada, to forfattere som heter Lindgren, en låner som heter Ibsen).
   Hver oppgave: fasit, godta (andre riktige løsninger), krav, hint, tester (hva testdatabasen
   prøver), feil (kjente gale løsninger og hvilket datasett som avslører dem; brukes av testene).
   Lastes etter data-sql.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var D = IN.dataSql || {};

  var FELLE = {
    forfatter: [
      [1, "Ibsen", "Norge"], [2, "Undset", "Norge"], [3, "Woolf", "England"], [4, "Lindgren", "Sverige"], [5, "Ferrante", null],
      [6, "Hamsun", "Norge"], [7, "Lindgren", "Norge"], [8, "Austen", "England"], [9, "Collett", "Norge"], [10, "Tolkien", "England"]
    ],
    bok: [
      [10, "Et dukkehjem", 1, 1879, 120], [11, "Peer Gynt", 1, 1867, 250], [12, "Kristin Lavransdatter", 2, 1920, 1000],
      [13, "Mrs Dalloway", 3, 1925, 200], [14, "Brødrene Løvehjerte", 4, 1973, 230], [15, "Folkeeventyr", null, 1841, null],
      [16, "Sult", 6, 1890, 220], [17, "Markens grøde", 6, 1917, null], [18, "Vildanden", 1, 1884, 1000],
      [19, "Pippi Langstrømpe", 4, 1945, 160], [20, "Amtmandens døtre", 9, 1854, 300], [21, "Hobbiten", 10, 1937, 340],
      [22, "Vinternatt", 7, 1900, 180], [23, "Til fyret", 3, 1927, 200], [24, "Ukjent dagbok", null, null, 90],
      [25, "Sult", 6, 1934, 330]
    ],
    "låner": [
      [1, "Ada", "Oslo"], [2, "Bo", "Bergen"], [3, "Cato", "Oslo"], [4, "Dina", null], [5, "Ibsen", "Skien"],
      [6, "Anne", "Trondheim"], [7, "Ada", "Oslo"], [8, "Erik", null], [9, "Frida", "Oslo"], [10, "Gro", "Tromsø"],
      [11, "Hans", "Drammen"], [12, "Ivar", "Oslo"], [13, "Lindgren", "Malmö"]
    ],
    "utlån": [
      [10, 1, "2026-09-01", "2026-09-10"], [11, 1, "2026-09-05", null], [13, 2, "2026-09-07", "2026-09-20"],
      [10, 3, "2026-10-01", null], [14, 3, "2026-10-02", "2026-10-15"], [12, 5, "2026-10-03", null],
      [16, 6, "2026-09-30", "2026-10-05"],
      [18, 7, "2026-10-01", "2026-10-08"], [10, 7, "2026-10-10", "2026-10-20"], [10, 7, "2026-11-01", "2026-11-05"], [13, 7, "2026-11-03", "2026-11-10"],
      [21, 8, "2026-10-12", "2026-10-30"], [19, 8, "2026-10-14", "2026-10-20"],
      [17, 10, "2026-10-20", null],
      [20, 12, "2026-08-15", "2026-08-30"], [11, 12, "2026-10-05", "2026-10-25"], [10, 12, "2026-10-06", "2026-10-26"], [18, 12, "2026-10-07", "2026-10-27"],
      [14, 2, "2026-10-15", "2026-10-16"],
      [22, 11, "2026-10-18", "2026-10-28"], [18, 11, "2026-11-02", "2026-11-12"]
    ]
  };

  var oppgaver = [
    /* ---------------- Blokk 4: grunnleggende SQL ---------------- */
    {
      id: "b4-01", blokk: 4, tittel: "Bøker fra før 1900",
      tekst: "<p>Vis <code>tittel</code> og <code>år</code> for alle bøker som er utgitt før år 1900. Den eldste boka skal stå først.</p>",
      fasit: "SELECT tittel, år\nFROM bok\nWHERE år < 1900\nORDER BY år;",
      hint: ["Før 1900 betyr at år 1900 ikke skal være med.", "Sorter med <code>ORDER BY år</code>. Stigende (ASC) er standard."],
      tester: "én bok er utgitt nøyaktig i 1900, og én bok mangler år",
      feil: [
        { sql: "SELECT tittel, år FROM bok WHERE år <= 1900 ORDER BY år;", fanger: "felle", hvorfor: "<= tar med Vinternatt fra 1900" },
        { sql: "SELECT tittel, år FROM bok WHERE år < 1900 ORDER BY år DESC;", fanger: "eksempel", hvorfor: "feil sorteringsretning" }
      ]
    },
    {
      id: "b4-02", blokk: 4, tittel: "Navn med liten a",
      tekst: "<p>Vis <code>lid</code> og <code>navn</code> for lånere som har en liten <code>a</code> et sted i navnet.</p>",
      fasit: "SELECT lid, navn\nFROM låner\nWHERE navn LIKE '%a%';",
      hint: ["<code>%</code> står for null eller flere vilkårlige tegn.", "LIKE skiller mellom store og små bokstaver. ILIKE gjør det ikke."],
      tester: "en låner heter Anne (stor A, ingen liten a)",
      feil: [
        { sql: "SELECT lid, navn FROM låner WHERE navn ILIKE '%a%';", fanger: "felle", hvorfor: "ILIKE tar med Anne" },
        { sql: "SELECT lid, navn FROM låner WHERE navn LIKE 'a%';", fanger: "eksempel", hvorfor: "bare navn som starter med liten a (ingen)" }
      ]
    },
    {
      id: "b4-03", blokk: 4, tittel: "Lånere uten sted",
      tekst: "<p>Vis <code>lid</code> og <code>navn</code> for lånere der vi ikke vet hvor de bor.</p>",
      fasit: "SELECT lid, navn\nFROM låner\nWHERE sted IS NULL;",
      hint: ["Ukjent sted er lagret som NULL.", "<code>sted = NULL</code> blir aldri sant, fordi sammenligning med NULL gir NULL (ukjent). Bruk <code>IS NULL</code>."],
      tester: "to lånere mangler sted",
      feil: [
        { sql: "SELECT lid, navn FROM låner WHERE lid = 4;", fanger: "felle", hvorfor: "hardkodet lid finner ikke Erik" },
        { sql: "SELECT lid, navn FROM låner WHERE sted = NULL;", fanger: "eksempel", hvorfor: "= NULL gir 0 rader" }
      ]
    },
    {
      id: "b4-04", blokk: 4, tittel: "Bøker av norske forfattere",
      tekst: "<p>Vis <code>tittel</code> og forfatterens <code>navn</code> for alle bøker skrevet av en forfatter fra Norge.</p>",
      fasit: "SELECT b.tittel, f.navn\nFROM bok AS b\n  JOIN forfatter AS f ON (b.fid = f.fid)\nWHERE f.land = 'Norge';",
      hint: ["Landet står i <code>forfatter</code>, tittelen i <code>bok</code>. Koble dem med en join på <code>fid</code>.", "Ikke skriv navnene på forfatterne. Spørringen skal virke selv om det kommer nye norske forfattere."],
      tester: "det finnes flere norske forfattere enn Ibsen og Undset",
      feil: [
        { sql: "SELECT b.tittel, f.navn FROM bok AS b JOIN forfatter AS f ON (b.fid = f.fid) WHERE f.navn = 'Ibsen' OR f.navn = 'Undset';", fanger: "felle", hvorfor: "navnene er hardkodet" },
        { sql: "SELECT b.tittel, f.navn FROM bok AS b JOIN forfatter AS f ON (b.fid = f.fid) WHERE f.fid IN (1, 2);", fanger: "felle", hvorfor: "ID-ene er hardkodet" }
      ]
    },
    {
      id: "b4-05", blokk: 4, tittel: "Alle utlån med navn",
      tekst: "<p>Vis én rad for hvert utlån med lånerens navn, bokas tittel og forfatterens navn. Kall kolonnene <code>låner</code>, <code>tittel</code> og <code>forfatter</code>.</p>",
      fasit: "SELECT l.navn AS låner, b.tittel, f.navn AS forfatter\nFROM utlån AS u\n  JOIN låner AS l ON (u.lid = l.lid)\n  JOIN bok AS b ON (u.bid = b.bid)\n  JOIN forfatter AS f ON (b.fid = f.fid);",
      hint: ["Du trenger alle de fire tabellene. Start i <code>utlån</code> og join de andre én etter én.", "Én rad per utlån: samme låner kan ha lånt samme bok to ganger, og da skal begge være med."],
      tester: "en låner har lånt samme bok to ganger",
      feil: [
        { sql: "SELECT DISTINCT l.navn AS låner, b.tittel, f.navn AS forfatter FROM utlån AS u JOIN låner AS l ON (u.lid = l.lid) JOIN bok AS b ON (u.bid = b.bid) JOIN forfatter AS f ON (b.fid = f.fid);", fanger: "felle", hvorfor: "DISTINCT slår sammen to utlån av samme bok" },
        { sql: "SELECT l.navn AS låner, b.tittel, f.navn AS forfatter FROM utlån AS u, låner AS l, bok AS b, forfatter AS f WHERE u.lid = l.lid AND u.bid = b.bid;", fanger: "eksempel", hvorfor: "mangler betingelsen mellom bok og forfatter" }
      ]
    },
    {
      id: "b4-06", blokk: 4, tittel: "Lånere av Ibsen",
      tekst: "<p>Vis <code>lid</code> og <code>navn</code> for lånere som har lånt minst én bok skrevet av Ibsen. Hver låner skal bare stå én gang.</p>",
      fasit: "SELECT DISTINCT l.lid, l.navn\nFROM låner AS l\n  JOIN utlån AS u ON (l.lid = u.lid)\n  JOIN bok AS b ON (u.bid = b.bid)\n  JOIN forfatter AS f ON (b.fid = f.fid)\nWHERE f.navn = 'Ibsen';",
      hint: ["Gå fra låner via utlån og bok til forfatter.", "En låner som har lånt to Ibsen-bøker, gir to rader i joinen. Bruk DISTINCT."],
      tester: "Ibsen har skrevet en tredje bok, Vildanden, og en låner har bare lånt den",
      feil: [
        { sql: "SELECT DISTINCT l.lid, l.navn FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) JOIN bok AS b ON (u.bid = b.bid) WHERE b.bid IN (10, 11);", fanger: "felle", hvorfor: "bøkene er hardkodet" },
        { sql: "SELECT DISTINCT l.lid, l.navn FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) JOIN bok AS b ON (u.bid = b.bid) WHERE b.fid = 1;", fanger: "perm", hvorfor: "fid er hardkodet" },
        { sql: "SELECT l.lid, l.navn FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) JOIN bok AS b ON (u.bid = b.bid) JOIN forfatter AS f ON (b.fid = f.fid) WHERE f.navn = 'Ibsen';", fanger: "eksempel", hvorfor: "uten DISTINCT kommer Ada to ganger" }
      ]
    },
    {
      id: "b4-07", blokk: 4, tittel: "De tre tykkeste bøkene",
      tekst: "<p>Vis <code>tittel</code> og <code>sider</code> for de tre bøkene med flest sider, den tykkeste først. Bøker der vi ikke vet sidetallet, skal ikke være med.</p>",
      fasit: "SELECT tittel, sider\nFROM bok\nWHERE sider IS NOT NULL\nORDER BY sider DESC\nLIMIT 3;",
      hint: ["Sorter synkende med <code>ORDER BY sider DESC</code>, og ta de tre første med <code>LIMIT 3</code>.", "I PostgreSQL kommer NULL først når du sorterer synkende. Fjern dem med <code>WHERE sider IS NOT NULL</code>. <code>NULLS LAST</code> alene gir samme svar her, men tar med bøker uten sidetall hvis færre enn tre har sidetall."],
      tester: "flere bøker har 1000 sider, og flere bøker har over 230 sider",
      feil: [
        { sql: "SELECT tittel, sider FROM bok WHERE sider >= 230 ORDER BY sider DESC;", fanger: "felle", hvorfor: "grensen er tilpasset eksempeldataene i stedet for LIMIT" },
        { sql: "SELECT tittel, sider FROM bok ORDER BY sider DESC LIMIT 3;", fanger: "eksempel", hvorfor: "NULL kommer først ved DESC" }
      ]
    },
    {
      id: "b4-08", blokk: 4, tittel: "Lånere som bor på samme sted",
      tekst: "<p>Finn alle par av lånere som bor på samme sted. Vis <code>navn1</code> og <code>navn2</code>. Hvert par skal stå én gang, med låneren med lavest <code>lid</code> som <code>navn1</code>.</p>",
      fasit: "SELECT l1.navn AS navn1, l2.navn AS navn2\nFROM låner AS l1\n  JOIN låner AS l2 ON (l1.sted = l2.sted)\nWHERE l1.lid < l2.lid;",
      hint: ["Join <code>låner</code> med seg selv. Gi tabellen to aliaser, for eksempel <code>l1</code> og <code>l2</code>.", "<code>l1.lid &lt; l2.lid</code> fjerner både paret med seg selv og paret i motsatt rekkefølge."],
      tester: "fem lånere bor i Oslo, og to av dem heter Ada",
      feil: [
        { sql: "SELECT l1.navn AS navn1, l2.navn AS navn2 FROM låner AS l1 JOIN låner AS l2 ON (l1.sted = l2.sted) WHERE l1.navn < l2.navn;", fanger: "felle", hvorfor: "sammenligner navn i stedet for nøkkel" },
        { sql: "SELECT l1.navn AS navn1, l2.navn AS navn2 FROM låner AS l1 JOIN låner AS l2 ON (l1.sted = l2.sted) WHERE l1.lid <> l2.lid;", fanger: "eksempel", hvorfor: "<> gir hvert par to ganger" }
      ]
    },

    /* ---------------- Blokk 5: aggregering, delspørringer, ytre join, mengder ---------------- */
    {
      id: "b5-01", blokk: 5, tittel: "Antall bøker per forfatter",
      tekst: "<p>Vis forfatterens <code>navn</code> og <code>antall</code> bøker for hver forfatter som har minst én bok i databasen.</p>",
      fasit: "SELECT f.navn, count(*) AS antall\nFROM forfatter AS f\n  JOIN bok AS b ON (f.fid = b.fid)\nGROUP BY f.fid, f.navn;",
      hint: ["Join forfatter og bok, og grupper per forfatter.", "Grupper på nøkkelen <code>f.fid</code>, ikke bare på navnet. To forfattere kan ha samme navn."],
      tester: "to forskjellige forfattere heter Lindgren",
      feil: [
        { sql: "SELECT f.navn, count(*) AS antall FROM forfatter AS f JOIN bok AS b ON (f.fid = b.fid) GROUP BY f.navn;", fanger: "felle", hvorfor: "gruppering på navn slår sammen de to Lindgren" },
        { sql: "SELECT f.navn, count(*) AS antall FROM forfatter AS f LEFT JOIN bok AS b ON (f.fid = b.fid) GROUP BY f.fid, f.navn;", fanger: "eksempel", hvorfor: "LEFT JOIN og count(*) gir Ferrante 1" }
      ]
    },
    {
      id: "b5-02", blokk: 5, tittel: "Flere utlån i oktober",
      tekst: "<p>Vis <code>navn</code> og <code>antall</code> utlån for lånere som lånte mer enn én bok i oktober 2026 (datoen i <code>utlån.dato</code>).</p>",
      fasit: "SELECT l.navn, count(*) AS antall\nFROM låner AS l\n  JOIN utlån AS u ON (l.lid = u.lid)\nWHERE u.dato >= '2026-10-01' AND u.dato < '2026-11-01'\nGROUP BY l.lid, l.navn\nHAVING count(*) > 1;",
      godta: ["SELECT l.navn, count(*) AS antall\nFROM låner AS l\n  JOIN utlån AS u ON (l.lid = u.lid)\nWHERE u.dato BETWEEN '2026-10-01' AND '2026-10-31'\nGROUP BY l.lid, l.navn\nHAVING count(*) > 1;"],
      hint: ["Filtrer på dato i WHERE (før grupperingen), og på antallet i HAVING (etter).", "Oktober har både en start og en slutt. Husk den øvre grensen."],
      tester: "noen lånere har også utlån i august og november",
      feil: [
        { sql: "SELECT l.navn, count(*) AS antall FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) WHERE u.dato >= '2026-10-01' GROUP BY l.lid, l.navn HAVING count(*) > 1;", fanger: "felle", hvorfor: "mangler øvre grense, tar med november" },
        { sql: "SELECT l.navn, count(*) AS antall FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) WHERE u.dato >= '2026-10-01' AND u.dato < '2026-11-01' GROUP BY l.lid, l.navn;", fanger: "eksempel", hvorfor: "mangler HAVING" }
      ]
    },
    {
      id: "b5-03", blokk: 5, tittel: "Alle forfattere med antall bøker",
      tekst: "<p>Vis <code>navn</code> og <code>antall</code> bøker for <em>alle</em> forfattere. Forfattere uten bøker skal stå med 0.</p>",
      fasit: "SELECT f.navn, count(b.bid) AS antall\nFROM forfatter AS f\n  LEFT JOIN bok AS b ON (f.fid = b.fid)\nGROUP BY f.fid, f.navn;",
      hint: ["En vanlig join mister forfatterne uten bøker. Bruk LEFT JOIN.", "<code>count(*)</code> teller også raden med NULL som LEFT JOIN lager. Tell en kolonne fra <code>bok</code> som aldri er NULL for en ekte bok, som <code>b.bid</code>."],
      tester: "en bok mangler sidetall, og to forfattere heter Lindgren",
      feil: [
        { sql: "SELECT f.navn, count(*) AS antall FROM forfatter AS f LEFT JOIN bok AS b ON (f.fid = b.fid) GROUP BY f.fid, f.navn;", fanger: "eksempel", hvorfor: "count(*) gir Ferrante 1" },
        { sql: "SELECT f.navn, count(b.sider) AS antall FROM forfatter AS f LEFT JOIN bok AS b ON (f.fid = b.fid) GROUP BY f.fid, f.navn;", fanger: "felle", hvorfor: "count(b.sider) hopper over Markens grøde (sider er NULL)" },
        { sql: "SELECT f.navn, count(b.bid) AS antall FROM forfatter AS f LEFT JOIN bok AS b ON (f.fid = b.fid) GROUP BY f.navn;", fanger: "felle", hvorfor: "gruppering på navn slår sammen de to Lindgren" }
      ]
    },
    {
      id: "b5-04", blokk: 5, tittel: "Tykkere enn gjennomsnittet",
      tekst: "<p>Vis <code>tittel</code> og <code>sider</code> for bøkene som har flere sider enn gjennomsnittet for alle bøker (bøker uten sidetall teller ikke med i snittet).</p>",
      fasit: "SELECT tittel, sider\nFROM bok\nWHERE sider > (SELECT avg(sider) FROM bok);",
      hint: ["Du kan ikke skrive <code>avg(sider)</code> rett i WHERE. Regn ut snittet i en delspørring.", "<code>avg</code> hopper over NULL. <code>sum(sider) / count(*)</code> gjør ikke det, og i tillegg blir heltallsdivisjon rundet ned."],
      tester: "snittet er et annet tall, og to bøker mangler sidetall",
      feil: [
        { sql: "SELECT tittel, sider FROM bok WHERE sider > 360;", fanger: "felle", hvorfor: "snittet er hardkodet" },
        { sql: "SELECT tittel, sider FROM bok WHERE sider > (SELECT sum(sider) / count(*) FROM bok);", fanger: "felle", hvorfor: "count(*) teller bøker uten sidetall" }
      ]
    },
    {
      id: "b5-05", blokk: 5, tittel: "Forfattere uten bøker",
      tekst: "<p>Vis <code>navn</code> på forfatterne som ikke har noen bok i databasen.</p>",
      fasit: "SELECT f.navn\nFROM forfatter AS f\nWHERE NOT EXISTS (\n  SELECT *\n  FROM bok AS b\n  WHERE b.fid = f.fid\n);",
      godta: ["SELECT f.navn\nFROM forfatter AS f\n  LEFT JOIN bok AS b ON (f.fid = b.fid)\nWHERE b.bid IS NULL;"],
      hint: ["«Ingen bok finnes for forfatteren» kan skrives med NOT EXISTS og en delspørring som ser på samme <code>fid</code>.", "Pass på NOT IN: <code>bok.fid</code> har en NULL (Folkeeventyr), og da gir NOT IN 0 rader. (Tilleggsfelle, står ikke i kursmaterialet. Kursets løsninger bruker NOT IN på kolonner som ikke kan være NULL.)"],
      tester: "en forfatter uten bøker har et land registrert",
      feil: [
        { sql: "SELECT navn FROM forfatter WHERE land IS NULL;", fanger: "felle", hvorfor: "sjekker land i stedet for bøker" },
        { sql: "SELECT navn FROM forfatter WHERE fid NOT IN (SELECT fid FROM bok);", fanger: "eksempel", hvorfor: "NOT IN med en NULL i delspørringen gir 0 rader" }
      ]
    },
    {
      id: "b5-06", blokk: 5, tittel: "Lånere som har levert alt",
      tekst: "<p>Vis <code>navn</code> på lånerne som har levert tilbake alle bøkene de har lånt. Lånere som aldri har lånt noe, skal også være med.</p>",
      fasit: "SELECT l.navn\nFROM låner AS l\nWHERE NOT EXISTS (\n  SELECT *\n  FROM utlån AS u\n  WHERE u.lid = l.lid AND u.levert IS NULL\n);",
      hint: ["Snu det: en låner har levert alt hvis det ikke finnes noe utlån fra låneren som mangler levert-dato.", "Ikke levert betyr <code>levert IS NULL</code>."],
      tester: "to lånere heter Ada, og bare den ene har levert alt",
      feil: [
        { sql: "SELECT l.navn FROM låner AS l LEFT JOIN utlån AS u ON (l.lid = u.lid) GROUP BY l.navn HAVING count(u.bid) = count(u.levert);", fanger: "felle", hvorfor: "gruppering på navn slår sammen de to Ada" },
        { sql: "SELECT DISTINCT l.navn FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) WHERE u.levert IS NOT NULL;", fanger: "eksempel", hvorfor: "tar med lånere som har levert minst én bok, og mister de uten utlån" }
      ]
    },
    {
      id: "b5-07", blokk: 5, tittel: "Har lånt alle Ibsen-bøkene",
      tekst: "<p>Vis <code>navn</code> på lånerne som har lånt <em>alle</em> bøkene som Ibsen har skrevet.</p>",
      fasit: "SELECT l.navn\nFROM låner AS l\nWHERE NOT EXISTS (\n  SELECT *\n  FROM bok AS b\n    JOIN forfatter AS f ON (b.fid = f.fid)\n  WHERE f.navn = 'Ibsen'\n    AND NOT EXISTS (\n      SELECT *\n      FROM utlån AS u\n      WHERE u.bid = b.bid AND u.lid = l.lid\n    )\n);",
      godta: ["SELECT l.navn\nFROM låner AS l\n  JOIN utlån AS u ON (l.lid = u.lid)\n  JOIN bok AS b ON (u.bid = b.bid)\n  JOIN forfatter AS f ON (b.fid = f.fid)\nWHERE f.navn = 'Ibsen'\nGROUP BY l.lid, l.navn\nHAVING count(DISTINCT b.bid) = (\n  SELECT count(*)\n  FROM bok AS b2\n    JOIN forfatter AS f2 ON (b2.fid = f2.fid)\n  WHERE f2.navn = 'Ibsen'\n);"],
      hint: ["«For alle» skrives med to NOT EXISTS: det finnes ingen Ibsen-bok som låneren ikke har lånt.", "Med telling: tell <em>forskjellige</em> bøker per låner (count(DISTINCT …)), og sammenlign med antall Ibsen-bøker regnet ut i en delspørring."],
      tester: "Ibsen har tre bøker, og en låner har lånt samme Ibsen-bok to ganger",
      feil: [
        { sql: "SELECT l.navn FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) JOIN bok AS b ON (u.bid = b.bid) JOIN forfatter AS f ON (b.fid = f.fid) WHERE f.navn = 'Ibsen' GROUP BY l.lid, l.navn HAVING count(DISTINCT b.bid) = 2;", fanger: "felle", hvorfor: "antallet Ibsen-bøker er hardkodet" },
        { sql: "SELECT l.navn FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) JOIN bok AS b ON (u.bid = b.bid) JOIN forfatter AS f ON (b.fid = f.fid) WHERE f.navn = 'Ibsen' GROUP BY l.lid, l.navn HAVING count(*) = (SELECT count(*) FROM bok AS b2 JOIN forfatter AS f2 ON (b2.fid = f2.fid) WHERE f2.navn = 'Ibsen');", fanger: "felle", hvorfor: "count(*) teller to utlån av samme bok" }
      ]
    },
    {
      id: "b5-08", blokk: 5, tittel: "Flest utlån",
      tekst: "<p>Bruk WITH. Vis <code>navn</code> og <code>antall</code> utlån for låneren med flest utlån. Er det flere som deler førsteplassen, skal alle være med.</p>",
      fasit: "WITH utlånstall AS (\n  SELECT l.lid, l.navn, count(*) AS antall\n  FROM låner AS l\n    JOIN utlån AS u ON (l.lid = u.lid)\n  GROUP BY l.lid, l.navn\n)\nSELECT navn, antall\nFROM utlånstall\nWHERE antall = (SELECT max(antall) FROM utlånstall);",
      krav: [{ med: "WITH", tekst: "Oppgaven ber deg bruke WITH." }],
      hint: ["Lag først en WITH-tabell med antall utlån per låner.", "<code>ORDER BY … LIMIT 1</code> mister dem som deler førsteplassen. Sammenlign med <code>max(antall)</code> i stedet."],
      tester: "to lånere deler førsteplassen, og to lånere heter Ada",
      feil: [
        { sql: "WITH t AS (SELECT l.navn, count(*) AS antall FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) GROUP BY l.navn) SELECT navn, antall FROM t WHERE antall = (SELECT max(antall) FROM t);", fanger: "felle", hvorfor: "gruppering på navn gir Ada 6 utlån" },
        { sql: "WITH t AS (SELECT l.lid, l.navn, count(*) AS antall FROM låner AS l JOIN utlån AS u ON (l.lid = u.lid) GROUP BY l.lid, l.navn) SELECT navn, antall FROM t ORDER BY antall DESC LIMIT 1;", fanger: "eksempel", hvorfor: "LIMIT 1 mister den som deler førsteplassen" }
      ]
    },
    {
      id: "b5-09", blokk: 5, tittel: "Utlån i september",
      tekst: "<p>Vis <code>navn</code> og <code>antall</code> utlån i september 2026 for <em>alle</em> lånere. De som ikke lånte noe i september, skal stå med 0.</p>",
      fasit: "WITH september AS (\n  SELECT *\n  FROM utlån\n  WHERE dato >= '2026-09-01' AND dato < '2026-10-01'\n)\nSELECT l.navn, count(s.bid) AS antall\nFROM låner AS l\n  LEFT JOIN september AS s ON (l.lid = s.lid)\nGROUP BY l.lid, l.navn;",
      godta: ["SELECT l.navn, count(u.bid) AS antall\nFROM låner AS l\n  LEFT JOIN utlån AS u\n    ON (l.lid = u.lid AND u.dato >= '2026-09-01' AND u.dato < '2026-10-01')\nGROUP BY l.lid, l.navn;"],
      hint: ["Filtrerer du på dato i WHERE etter LEFT JOIN, forsvinner lånerne uten utlån i september. Filtrer i en WITH først, eller legg betingelsen i ON.", "Tell <code>s.bid</code>, ikke <code>*</code>, så de uten utlån får 0."],
      tester: "en låner har et utlån i august, og to lånere heter Ada",
      feil: [
        { sql: "WITH s AS (SELECT * FROM utlån WHERE dato < '2026-10-01') SELECT l.navn, count(s.bid) AS antall FROM låner AS l LEFT JOIN s ON (l.lid = s.lid) GROUP BY l.lid, l.navn;", fanger: "felle", hvorfor: "mangler nedre grense, tar med august" },
        { sql: "SELECT l.navn, count(u.bid) AS antall FROM låner AS l LEFT JOIN utlån AS u ON (l.lid = u.lid) WHERE u.dato >= '2026-09-01' AND u.dato < '2026-10-01' GROUP BY l.lid, l.navn;", fanger: "eksempel", hvorfor: "WHERE etter LEFT JOIN fjerner dem med 0" }
      ]
    },
    {
      id: "b5-10", blokk: 5, tittel: "Både forfatter og låner",
      tekst: "<p>Bruk INTERSECT. Vis hvert <code>navn</code> som finnes både blant forfatterne og blant lånerne.</p>",
      fasit: "SELECT navn FROM forfatter\nINTERSECT\nSELECT navn FROM låner;",
      krav: [{ med: "INTERSECT", tekst: "Oppgaven ber deg bruke INTERSECT." }],
      hint: ["Begge sidene av INTERSECT må ha like mange kolonner av samme type.", "INTERSECT fjerner duplikater, så hvert navn kommer én gang."],
      tester: "to forfattere heter Lindgren, og en låner heter også Lindgren",
      feil: [
        { sql: "SELECT f.navn FROM forfatter AS f JOIN låner AS l ON (f.navn = l.navn);", fanger: "felle", hvorfor: "joinen gir Lindgren to ganger (og bruker ikke INTERSECT)" },
        { sql: "SELECT navn FROM forfatter UNION SELECT navn FROM låner;", fanger: "eksempel", hvorfor: "UNION gir alle navnene" }
      ]
    },
    {
      id: "b5-11", blokk: 5, tittel: "Bøker som aldri er lånt",
      tekst: "<p>Vis <code>tittel</code> på bøkene som aldri har vært lånt ut.</p>",
      fasit: "SELECT b.tittel\nFROM bok AS b\nWHERE NOT EXISTS (\n  SELECT *\n  FROM utlån AS u\n  WHERE u.bid = b.bid\n);",
      godta: ["SELECT tittel\nFROM bok\nWHERE bid IN (\n  SELECT bid FROM bok\n  EXCEPT\n  SELECT bid FROM utlån\n);","SELECT tittel\nFROM bok\nWHERE bid NOT IN (SELECT bid FROM utlån);"],
      hint: ["«Aldri lånt» betyr at det ikke finnes noe utlån med bokas <code>bid</code>.", "Her er NOT IN trygt, fordi <code>utlån.bid</code> er en del av primærnøkkelen og aldri er NULL."],
      tester: "fire bøker er aldri lånt, bare to av dem mangler forfatter, og to bøker heter Sult (bare den ene er lånt)",
      feil: [
        { sql: "SELECT tittel FROM bok WHERE fid IS NULL;", fanger: "felle", hvorfor: "sjekker forfatter i stedet for utlån" },
        { sql: "SELECT DISTINCT b.tittel FROM bok AS b JOIN utlån AS u ON (b.bid <> u.bid);", fanger: "eksempel", hvorfor: "<> i joinen gir nesten alle bøkene" },
        { sql: "SELECT tittel FROM bok EXCEPT SELECT b.tittel FROM bok AS b JOIN utlån AS u ON (b.bid = u.bid);", fanger: "felle", hvorfor: "EXCEPT på tittel fjerner også Sult fra 1934, fordi den andre Sult er lånt" }
      ]
    },
    {
      id: "b5-12", blokk: 5, tittel: "Lånepoeng",
      tekst: "<p>En låner får 2 poeng for hvert utlån og 3 ekstra poeng for hvert utlån som ikke er levert. Vis <code>navn</code> og <code>poeng</code> for alle lånere. De uten utlån skal stå med 0, ikke NULL. Tips: lag poengradene med UNION ALL, og gjør NULL om til 0 med <code>coalesce(sum(…), 0)</code>. coalesce står ikke i lysarkene, og på eksamen tillot oppgaveteksten NULL i en lignende oppgave (H2025 2.7), men her krever vi 0.</p>",
      fasit: "WITH poengrader AS (\n  SELECT lid, 2 AS poeng FROM utlån\n  UNION ALL\n  SELECT lid, 3 AS poeng FROM utlån WHERE levert IS NULL\n)\nSELECT l.navn, coalesce(sum(p.poeng), 0) AS poeng\nFROM låner AS l\n  LEFT JOIN poengrader AS p ON (l.lid = p.lid)\nGROUP BY l.lid, l.navn;",
      hint: ["UNION fjerner like rader. To utlån gir to like rader <code>(lid, 2)</code>, og da forsvinner den ene. Bruk UNION ALL.", "<code>sum</code> av ingen rader er NULL. Bruk <code>coalesce(sum(…), 0)</code>."],
      tester: "to lånere heter Ada",
      feil: [
        { sql: "WITH p AS (SELECT lid, 2 AS poeng FROM utlån UNION SELECT lid, 3 AS poeng FROM utlån WHERE levert IS NULL) SELECT l.navn, coalesce(sum(p.poeng), 0) AS poeng FROM låner AS l LEFT JOIN p ON (l.lid = p.lid) GROUP BY l.lid, l.navn;", fanger: "eksempel", hvorfor: "UNION fjerner like poengrader" },
        { sql: "WITH p AS (SELECT lid, 2 AS poeng FROM utlån UNION ALL SELECT lid, 3 AS poeng FROM utlån WHERE levert IS NULL) SELECT l.navn, coalesce(sum(p.poeng), 0) AS poeng FROM låner AS l LEFT JOIN p ON (l.lid = p.lid) GROUP BY l.navn;", fanger: "felle", hvorfor: "gruppering på navn slår sammen de to Ada" },
        { sql: "WITH p AS (SELECT lid, 2 AS poeng FROM utlån UNION ALL SELECT lid, 3 AS poeng FROM utlån WHERE levert IS NULL) SELECT l.navn, sum(p.poeng) AS poeng FROM låner AS l LEFT JOIN p ON (l.lid = p.lid) GROUP BY l.lid, l.navn;", fanger: "eksempel", hvorfor: "uten coalesce får Dina NULL" }
      ]
    }
  ];

  IN.sqlOvelser = {
    databaser: {
      bibliotek: { skjema: D.skjema, idag: "2026-11-25", datasett: { eksempel: D.rader, felle: FELLE } }
    },
    oppgaver: oppgaver
  };
})();
