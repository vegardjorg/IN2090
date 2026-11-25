/* ============================================================
   IN2090 guide · data-sqlskolen.js
   Innhold til SQL-skolen (sql-skolen.html): notasjonstabeller for SQL og relasjonsalgebra,
   spørringer til linjeleseren med forklaring per linje på tre nivåer, Parsons-oppgaver,
   «les spørringen»-øving, radantall, finn feilen, ordliste fra oppgavetekst til SQL og
   skriveguide. Alle spørringene går mot biblioteksdatabasen i data-sql.js, og resultatene
   regnes ut av sql-motor.js når siden lastes (tallene i tekstene er kontrollert mot motoren
   med plan/verktoy-uavhengig node-test i agentens scratch).
   Alt fagstoff er formulert med egne ord. Kildelinjene peker på lysark og eksamen.
   Sitatene i skriveguiden er eksamenstekst og sensorveiledning (H25), gjengitt ordrett med kilde.
   Klassisk script. Lastes etter core.js. Ingen DOM ved lasting.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  function m(s) { return '<span class="mono">' + s + "</span>"; }
  function K(ref) { return { ref: ref, egneOrd: true }; }
  function S() { return [].slice.call(arguments).join("\n"); }
  function t(eli5, normal, teknisk) { return { eli5: eli5, normal: normal, teknisk: teknisk }; }
  /* linje: [kode med innrykk, eli5, normal, teknisk, grense?] */
  function L(code, eli5, normal, teknisk, grense) { var o = { code: code, eli5: eli5, normal: normal, teknisk: teknisk }; if (grense) o.grense = grense; return o; }

  var D = (IN.dataSqlSkolen = {});

  /* ================= Notasjon: SQL ================= */
  D.sqlNotasjon = [
    { kode: "SELECT … FROM … WHERE …;", betyr: "Grunnformen: hvilke kolonner, fra hvilke tabeller, hvilke rader.", eks: "SELECT tittel FROM bok WHERE år &lt; 1900;", mer: ["04-sql.html#fane=anatomi", "Anatomi"] },
    { kode: "WITH, SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, OFFSET", betyr: "Rekkefølgen klausulene <i>skrives</i> i. Den er fast. LIMIT og OFFSET kan bytte plass.", eks: "", mer: ["04-sql.html#fane=anatomi", "Logisk rekkefølge"] },
    { kode: "AS", betyr: "Gir en tabell eller kolonne et nytt navn. Et SELECT-navn kan brukes i ORDER BY, men ikke i WHERE eller HAVING.", eks: "FROM bok AS b · count(*) AS antall", mer: ["04-sql.html#fane=anatomi", "Navneregler"] },
    { kode: "b.tittel", betyr: "Kolonnen tittel i tabellen (eller aliaset) b. Trengs når to tabeller har kolonner med samme navn.", eks: "l.navn, f.navn", mer: ["04-sql.html#fane=join", "Join"] },
    { kode: "'tekst'", betyr: "Tekst og datoer står i enkle fnutter. Store og små bokstaver teller i verdier, ikke i nøkkelord og navn.", eks: "WHERE sted = 'Oslo' · '2026-09-01'", mer: null },
    { kode: "= · != · &lt; · &lt;= · &gt; · &gt;=", betyr: "Sammenligning. Kurset skriver ulikhet som " + m("!=") + " (" + m("&lt;&gt;") + " betyr det samme).", eks: "WHERE år != 1879", mer: null },
    { kode: "AND · OR · NOT", betyr: "Logikk. AND binder sterkere enn OR, så sett parentes rundt OR-delen.", eks: "WHERE (sted = 'Oslo' OR sted = 'Bergen') AND …", mer: ["04-sql.html#fane=anatomi", "Feller"] },
    { kode: "LIKE '%Gynt%'", betyr: m("%") + " står for null eller flere vilkårlige tegn, " + m("_") + " for nøyaktig ett tegn. Bare inne i LIKE.", eks: "WHERE tittel LIKE 'E%'", mer: ["04-sql.html#fane=anatomi", "LIKE"] },
    { kode: "IS NULL · IS NOT NULL", betyr: "Den eneste måten å teste for NULL på. " + m("= NULL") + " gir NULL (ukjent), aldri TRUE.", eks: "WHERE levert IS NULL", mer: ["05-sql-videre.html#fane=null", "NULL"] },
    { kode: "INNER JOIN … ON (…)", betyr: "Koble rader som hører sammen, oftest fremmednøkkel = primærnøkkel. " + m("JOIN") + " alene betyr det samme.", eks: "bok AS b INNER JOIN forfatter AS f ON (b.fid = f.fid)", mer: ["04-sql.html#fane=join", "Join"] },
    { kode: "USING (kol) · NATURAL JOIN", betyr: "USING kobler på én navngitt kolonne. NATURAL JOIN kobler på <i>alle</i> kolonner med likt navn, også dem du ikke tenkte på.", eks: "utlån INNER JOIN bok USING (bid)", mer: ["04-sql.html#fane=join", "NATURAL JOIN-fellen"] },
    { kode: "LEFT / RIGHT / FULL [OUTER] JOIN", betyr: "Ytre join: behold også radene uten partner, med NULL i den andre tabellens kolonner.", eks: "låner AS l LEFT JOIN utlån AS u ON (l.lid = u.lid)", mer: ["05-sql-videre.html#fane=ytre-join", "Ytre join"] },
    { kode: "count(*) · count(kol) · sum · avg · min · max", betyr: "Aggregatfunksjoner. " + m("count(*)") + " teller rader, " + m("count(kol)") + " teller verdier som ikke er NULL.", eks: "SELECT count(*) FROM bok;", mer: ["05-sql-videre.html#fane=aggregering", "Aggregering"] },
    { kode: "GROUP BY … HAVING …", betyr: "Del radene i grupper og filtrer gruppene. Kurset bruker HAVING bare sammen med GROUP BY.", eks: "GROUP BY f.fid HAVING count(*) &gt;= 2", mer: ["05-sql-videre.html#fane=aggregering", "Aggregering"] },
    { kode: "EXISTS · IN · NOT EXISTS · NOT IN", betyr: "Delspørringer i WHERE. EXISTS spør om delspørringen gir minst én rad.", eks: "WHERE NOT EXISTS (SELECT * FROM utlån AS u WHERE u.lid = l.lid)", mer: ["05-sql-videre.html#fane=delsporringer", "Delspørringer"] },
    { kode: "UNION · INTERSECT · EXCEPT [ALL]", betyr: "Mengdeoperatorer mellom to spørringer med like mange kolonner av samme type. Uten ALL fjernes duplikater.", eks: "SELECT lid FROM låner EXCEPT SELECT lid FROM utlån;", mer: ["05-sql-videre.html#fane=mengde", "Mengdeoperatorer"] },
    { kode: "x::float", betyr: "Typekonvertering. Nyttig mot heltallsdivisjon: " + m("7 / 2") + " er 3, " + m("7::float / 2") + " er 3.5.", eks: "sum(sider)::float / count(*)", mer: null },
    { kode: "-- kommentar · ;", betyr: "To bindestreker starter en kommentar ut linja. Semikolon avslutter en setning.", eks: "-- Antar at navn er unikt", mer: null }
  ];

  /* ================= Notasjon: relasjonsalgebra ================= */
  D.raNotasjon = [
    { kode: "π<sub>A, B</sub>(R)", navn: "Projeksjon", betyr: "Behold bare kolonnene A og B. Like rader slås sammen, fordi RA jobber med mengder.", sql: "SELECT DISTINCT A, B FROM R" },
    { kode: "σ<sub>betingelse</sub>(R)", navn: "Seleksjon", betyr: "Behold radene der betingelsen holder. Betingelsen bruker ∧ ∨ ¬ og = ≠ &lt; &gt; ≤ ≥, med konstanter i fnutter.", sql: "SELECT * FROM R WHERE betingelse" },
    { kode: "ρ<sub>A→B</sub>(R)", navn: "Omdøping", betyr: "Gi attributtet A det nye navnet B.", sql: "SELECT A AS B …" },
    { kode: "R × S", navn: "Kryssprodukt", betyr: "Alle kombinasjoner av en rad fra R og en rad fra S (kartesisk produkt).", sql: "FROM R, S" },
    { kode: "R ⋈<sub>betingelse</sub> S", navn: "Theta-join", betyr: "Det samme som σ<sub>betingelse</sub>(R × S): kryssproduktet, men bare kombinasjonene som oppfyller betingelsen.", sql: "R INNER JOIN S ON (betingelse)" },
    { kode: "R ⋈ S", navn: "Naturlig join", betyr: "Join på alle attributter med likt navn. Ett lysark (F02-03) skriver ⋆ for det samme.", sql: "R NATURAL JOIN S" },
    { kode: "R ∪ S · R ∩ S · R ∖ S", navn: "Union, snitt, differanse", betyr: "Krever lik signatur: samme attributtnavn og typer. Kildene skriver differanse på flere måter; vi bruker ∖.", sql: "UNION · INTERSECT · EXCEPT" },
    { kode: "Navn := uttrykk", navn: "Navngitt resultat", betyr: "Gi et mellomresultat et navn og bruk det videre. Gjør lange uttrykk lettere å lese.", sql: "WITH Navn AS (…)" }
  ];

  D.explainNotasjon = t(
    "<p>SQL er som en bestilling i en kafé: du sier <i>hva</i> du vil ha («to boller, uten rosiner»), ikke hvordan bakeren skal lage dem. Relasjonsalgebra er de samme bestillingene skrevet med små tegn, nesten som matte: én sil for radene (σ) og én saks for kolonnene (π).</p>" +
    "<p>Du trenger ikke kunne alle ordene utenat. Du trenger å vite hvilken klosse som gjør hva, og å skrive dem i riktig rekkefølge.</p>",
    "<p>På eksamen skrives SQL som tekst uten en database å kjøre mot. Enkle skrivefeil gir ikke trekk, men du må bruke riktige klausuler i riktig rekkefølge og riktige operatorer (" + m("IS NULL") + ", " + m("LIKE") + ", " + m("HAVING") + ").</p>" +
    "<p>Relasjonsalgebra (RA) er det matematiske språket bak SQL. Den har vært med på eksamen noen ganger, med 5 poeng. Tabellene under viser kursets skrivemåte for begge, og hva hver RA-operator svarer til i SQL.</p>",
    "<p>SQL er deklarativt: spørringen beskriver svaret, og databasen velger selv hvordan det regnes ut. RA er prosedyrisk i den forstand at uttrykket er et tre av operatorer, og det er dette treet en SQL-spørring oversettes til internt. Kurset gir oversettelsen " + m("SELECT k FROM t1, …, tn WHERE u") + " ≈ π<sub>k</sub>(σ<sub>u</sub>(t1 × … × tn)).</p>" +
    "<p>Likhetstegnet er bare «omtrent», fordi RA jobber med <b>mengder</b> og SQL med <b>multimengder</b>: SQL beholder duplikater til du ber om " + m("DISTINCT") + " eller bruker en mengdeoperator uten " + m("ALL") + ".</p>"
  );

  /* Koble RA-operator til SQL (IN.matchTask) */
  D.raMatch = {
    id: "sqlskolen-ra-sql", mode: "match",
    prompt: "<p>Koble hver RA-operator til den SQL-delen som gjør det samme.</p>",
    items: [
      { id: "pi", html: "π<sub>tittel</sub>(bok)", explain: "<p>Projeksjon velger kolonner og fjerner duplikater: " + m("SELECT DISTINCT tittel FROM bok") + ".</p>" },
      { id: "sigma", html: "σ<sub>år &lt; 1900</sub>(bok)", explain: "<p>Seleksjon velger rader: " + m("WHERE år &lt; 1900") + ".</p>" },
      { id: "theta", html: "bok ⋈<sub>bok.fid = forfatter.fid</sub> forfatter", explain: "<p>Theta-join med betingelse: " + m("INNER JOIN … ON (…)") + ".</p>" },
      { id: "kryss", html: "bok × forfatter", explain: "<p>Kryssprodukt uten betingelse: to tabeller i FROM med komma og ingen join-betingelse, 6 · 5 = 30 rader.</p>" },
      { id: "rho", html: "ρ<sub>navn→forfatternavn</sub>(forfatter)", explain: "<p>Omdøping svarer til " + m("AS") + ".</p>" },
      { id: "union", html: "R ∪ S", explain: "<p>Union svarer til " + m("UNION") + " (uten ALL, så duplikater fjernes som i RA).</p>" },
      { id: "diff", html: "R ∖ S", explain: "<p>Differanse svarer til " + m("EXCEPT") + ": radene i R som ikke er i S.</p>" }
    ],
    zones: [
      { id: "z-select", label: m("SELECT DISTINCT tittel FROM bok") },
      { id: "z-where", label: m("WHERE år &lt; 1900") },
      { id: "z-join", label: m("INNER JOIN forfatter ON (…)") },
      { id: "z-from", label: m("FROM bok, forfatter") },
      { id: "z-as", label: m("navn AS forfatternavn") },
      { id: "z-union", label: m("UNION") },
      { id: "z-except", label: m("EXCEPT") }
    ],
    answer: { pi: "z-select", sigma: "z-where", theta: "z-join", kryss: "z-from", rho: "z-as", union: "z-union", diff: "z-except" },
    oppsummering: "<p>Huskeregel: σ er silen (rader, WHERE), π er saksa (kolonner, SELECT). Theta-join er σ på et kryssprodukt, akkurat som en join-betingelse i SQL.</p>",
    kilde: [K("F02-03 (operatorene)"), K("F03-01 lysark 12–13 (SQL til RA, mengde mot multimengde)")]
  };

  /* Et RA-eksempel regnet ut, med to likeverdige skrivemåter */
  D.raEksempel = {
    sporsmal: "Titlene på bøkene skrevet av norske forfattere.",
    nestet: "π<sub>tittel</sub>(bok ⋈<sub>bok.fid = forfatter.fid</sub> σ<sub>land = 'Norge'</sub>(forfatter))",
    steg: ["Norske := σ<sub>land = 'Norge'</sub>(forfatter)", "NorskeBøker := bok ⋈<sub>bok.fid = Norske.fid</sub> Norske", "Svar := π<sub>tittel</sub>(NorskeBøker)"],
    sql: S("SELECT DISTINCT b.tittel", "FROM bok AS b", "  INNER JOIN forfatter AS f ON (b.fid = f.fid)", "WHERE f.land = 'Norge';")
  };

  /* ================= Linjeleser ================= */
  D.linjeleser = [
    { id: "grunnform", label: "Grunnform", tittel: "Bøker fra før 1900 med mer enn 100 sider",
      lines: [
        L("SELECT tittel, år",
          "Vi bestemmer hva som skal stå på lappen til slutt: tittelen og året til hver bok.",
          "Kolonnene i svaret. SELECT skrives først, men brukes nesten sist: først finner databasen radene, så plukker den ut kolonnene.",
          "Projeksjonen, π i RA. Logisk evalueres SELECT etter FROM og WHERE, og derfor finnes et navn du lager her med AS, ikke i WHERE. Duplikater fjernes ikke her. Det gjør bare DISTINCT."),
        L("FROM bok",
          "Vi henter fram bunken med bok-kort. Det er seks kort.",
          "Tabellen det velges fra. FROM er det første databasen ser på.",
          "FROM bygger tabellen resten av spørringen jobber på. Med flere tabeller blir det et kryssprodukt eller en join. Her er det bare bok, med 6 rader."),
        L("WHERE år < 1900",
          "Vi legger bort alle kort med bøker fra 1900 eller senere. Tre kort er igjen.",
          "Behold bare radene der betingelsen er sann. Tre bøker er fra før 1900: Et dukkehjem, Peer Gynt og Folkeeventyr.",
          "Seleksjonen, σ i RA. WHERE ser på én rad om gangen og beholder raden bare hvis hele betingelsen blir TRUE. FALSE og NULL kastes begge."),
        L("  AND sider > 100",
          "Av de tre kortene beholder vi bare de tykke bøkene. Folkeeventyr har ikke noe sidetall på kortet. Vi vet ikke om den er tykk, og da legger vi den bort.",
          "AND betyr at begge deler må holde. Folkeeventyr har " + m("sider") + " lik NULL, så " + m("sider &gt; 100") + " blir NULL, og raden forsvinner. Svaret blir 2 rader.",
          m("NULL &gt; 100") + " gir NULL (ukjent), og " + m("TRUE AND NULL") + " er NULL. WHERE beholder bare TRUE, så Folkeeventyr faller ut. Innrykket viser at linja hører til WHERE. Databasen bryr seg ikke om innrykk.",
          { q: "Hvorfor forsvinner Folkeeventyr, når vi ikke vet at den er tynn?",
            a: "WHERE krever TRUE, og ukjent er ikke nok. Skal bøker uten sidetall være med, må du si det selv: " + m("AND (sider &gt; 100 OR sider IS NULL)") + ", med parentes fordi AND binder sterkere enn OR." }),
        L("ORDER BY år;",
          "Til slutt legger vi kortene i rekkefølge, den eldste boka først.",
          "Sorter svaret stigende på år: Peer Gynt (1867) før Et dukkehjem (1879). Uten ORDER BY er rekkefølgen ikke garantert.",
          "Sorteringen skjer etter SELECT, så her kunne du brukt et AS-navn. Stigende (ASC) er standard, og DESC snur. Semikolonet avslutter setningen.")
      ] },

    { id: "join", label: "Join", tittel: "Hvem har lån ute nå, og hvilken bok?",
      lines: [
        L("SELECT l.navn, b.tittel",
          "På lappen vil vi ha navnet på den som låner, og tittelen på boka.",
          "To kolonner fra to forskjellige tabeller. Bokstaven foran punktumet sier hvilken tabell kolonnen hentes fra.",
          "Prefiksene " + m("l.") + " og " + m("b.") + " er aliasene fra FROM. De er bare påkrevd når et kolonnenavn finnes i flere av tabellene, men de gjør spørringen lettere å lese og er en god vane."),
        L("FROM utlån AS u",
          "Vi starter med lånekortene. Hvert kort er ett lån.",
          "Start i tabellen med én rad per hendelse, her ett lån. " + m("AS u") + " gir tabellen et kort navn.",
          "Eksamensoppgaver starter ofte i en hendelsestabell med sammensatt primærnøkkel, og går ut til de andre tabellene via fremmednøklene."),
        L("  INNER JOIN låner AS l ON (u.lid = l.lid)",
          "Til hvert lånekort finner vi personen med samme lånenummer, og legger de to kortene sammen.",
          "Koble hvert lån til låneren gjennom fremmednøkkelen " + m("lid") + ". Indre join beholder bare lån som har en låner.",
          "Dette er " + m("utlån ⋈<sub>u.lid = l.lid</sub> låner") + ", altså σ på kryssproduktet. Kryssproduktet har 6 · 5 = 30 rader, og betingelsen beholder de 6 som hører sammen.",
          { q: "Hvorfor ON og ikke NATURAL JOIN?",
            a: "NATURAL JOIN kobler på alle kolonner med likt navn. Kommer forfatter med senere, deler den kolonnen " + m("navn") + " med låner, og svaret blir galt uten feilmelding. Sensor har trukket for dette (H19 og H20)." }),
        L("  INNER JOIN bok AS b ON (u.bid = b.bid)",
          "Så finner vi boka med samme boknummer og legger den til i bunken.",
          "Samme mønster en gang til: koble lånet til boka via " + m("bid") + ".",
          "Join-er leses fra venstre mot høyre og bygger én stadig bredere tabell. Rekkefølgen på to indre join-er endrer ikke svaret, så lenge hver ON bare bruker tabeller som alt er nevnt."),
        L("WHERE u.levert IS NULL",
          "Vi beholder bare lånene som ikke har en innleveringsdato. Da er boka fortsatt ute.",
          "Et lån som ikke er levert, har " + m("levert") + " lik NULL. Tre lån er ute.",
          m("IS NULL") + " er det eneste som gir TRUE for en NULL-verdi.",
          { q: "Hvorfor IS NULL og ikke = NULL?",
            a: m("levert = NULL") + " blir NULL for alle rader, så du får 0 rader. Sensor trakk −1 for " + m("!= NULL") + " i stedet for " + m("IS NOT NULL") + " (H20)." }),
        L("ORDER BY l.navn;",
          "Til slutt sorterer vi etter navnet til låneren.",
          "Sorter alfabetisk på navn: Ada, Cato, Ibsen.",
          "Kolonnen må ikke stå i SELECT for å kunne sorteres på, så lenge du ikke bruker DISTINCT.")
      ] },

    { id: "telle", label: "Telle med 0", tittel: "Antall lån per låner, også dem uten lån",
      lines: [
        L("SELECT l.navn, count(u.bid) AS antall",
          "På lappen vil vi ha navnet og hvor mange bøker personen har lånt.",
          "Navnet, og hvor mange lån hver låner har. " + m("count(u.bid)") + " teller bare rader der " + m("u.bid") + " ikke er NULL.",
          "Aggregatet regnes én gang per gruppe. Navnet " + m("antall") + " kan brukes i ORDER BY, men ikke i HAVING.",
          { q: "Hvorfor count(u.bid) og ikke count(*)?",
            a: "Dina har ingen lån, men LEFT JOIN gir henne likevel én rad, med NULL i alle kolonnene fra utlån. " + m("count(*)") + " teller raden og gir 1. " + m("count(u.bid)") + " teller bare verdier som ikke er NULL og gir 0. Sensor trakk −1 for count(*) her (H19 2.5)." }),
        L("FROM låner AS l",
          "Vi starter med personkortene, for alle personer skal være med.",
          "Start i tabellen der <i>alle</i> radene skal med i svaret.",
          "Ved LEFT JOIN er det venstre tabell som beholdes helt. Derfor står låner først."),
        L("  LEFT JOIN utlån AS u ON (l.lid = u.lid)",
          "Til hver person legger vi lånekortene deres. Har personen ingen lån, legger vi på et tomt kort i stedet for å kaste personen.",
          "Ytre join: lånere uten lån blir med, med NULL i lånekolonnene. Dina får én slik rad.",
          "Venstre ytre join gir den indre joinen pluss én rad for hver låner uten partner, fylt ut med NULL.",
          { q: "Hvorfor LEFT JOIN og ikke INNER JOIN?",
            a: "Oppgaven sier «også dem uten lån». INNER JOIN fjerner Dina før tellingen. Sensor trakk −2 for INNER JOIN der rader med 0 skulle vært med (H19 2.5)." }),
        L("GROUP BY l.lid, l.navn",
          "Vi lager én haug per person og teller kortene i hver haug.",
          "Én gruppe per låner. Vi grupperer på " + m("lid") + " også, fordi to lånere kan hete det samme.",
          "Alt i SELECT som ikke står i et aggregat, må stå i GROUP BY. PostgreSQL godtar også bare " + m("GROUP BY l.lid") + ", fordi navnet bestemmes av primærnøkkelen, og sensor trekker ikke for det."),
        L("ORDER BY antall DESC, l.navn;",
          "Den som har lånt mest, kommer først. Har to personer lånt like mye, tar vi dem i alfabetisk rekkefølge.",
          "Flest lån først. Ved likt antall sorteres det på navn.",
          "Navnet " + m("antall") + " fra SELECT er lov her, fordi ORDER BY evalueres etter SELECT. Den andre sorteringskolonnen avgjør bare der den første er lik.")
      ] },

    { id: "having", label: "WHERE og HAVING", tittel: "Forfattere med minst to bøker fra før 1950",
      lines: [
        L("SELECT f.navn, count(*) AS antall",
          "På lappen: forfatterens navn og hvor mange bøker vi talte.",
          "Navnet og antall bøker. Her er " + m("count(*)") + " trygg, fordi indre join bare gir rader som har en bok.",
          "Etter en indre join har hver rad en bok, så " + m("count(*)") + " og " + m("count(b.bid)") + " gir det samme."),
        L("FROM forfatter AS f",
          "Vi tar fram forfatterkortene.",
          "Start i forfatter.",
          "Forfatter har 5 rader. Ferrante har ingen bøker og forsvinner i den indre joinen."),
        L("  INNER JOIN bok AS b ON (f.fid = b.fid)",
          "Vi legger hver bok ved forfatteren sin.",
          "Én rad per bok som har en forfatter: 5 rader. Folkeeventyr har ingen forfatter og er ikke med.",
          "Folkeeventyr har " + m("fid") + " lik NULL. " + m("f.fid = NULL") + " blir aldri TRUE, så den har ingen partner."),
        L("WHERE b.år < 1950",
          "Før vi teller, kaster vi bøkene fra 1950 og senere. Brødrene Løvehjerte (1973) forsvinner.",
          "WHERE filtrerer <i>rader</i> før grupperingen. Lindgren mister sin eneste bok og blir ikke med i noen gruppe.",
          "WHERE evalueres før GROUP BY og ser én rad om gangen. Derfor kan WHERE filtrere på " + m("b.år") + ", men ikke på et aggregat."),
        L("GROUP BY f.fid, f.navn",
          "Vi lager én haug per forfatter: Ibsen får to bøker, Undset og Woolf én hver.",
          "Én gruppe per forfatter. Ibsen 2, Undset 1, Woolf 1.",
          "Hver gruppe blir én rad. Fra nå av kan SELECT og HAVING bare bruke gruppekolonnene og aggregater."),
        L("HAVING count(*) >= 2;",
          "Til slutt beholder vi bare haugene med minst to bøker. Bare Ibsen er igjen.",
          "HAVING filtrerer <i>grupper</i> etter at de er telt. Svaret er Ibsen med 2.",
          "HAVING er en slags WHERE for grupper. Den evalueres etter aggregatene og før SELECT.",
          { q: "Hvorfor HAVING count(*) >= 2 og ikke WHERE count(*) >= 2 eller HAVING antall >= 2?",
            a: "I WHERE finnes ikke gruppene ennå, så et aggregat der er en feil. Sensor trekker −2 for aggregat i WHERE (H20, H23, H25). Navnet " + m("antall") + " lages først i SELECT, som kommer etter HAVING, så du må skrive aggregatet på nytt." })
      ] },

    { id: "notexists", label: "NOT EXISTS", tittel: "Lånere som aldri har lånt noe",
      lines: [
        L("SELECT l.navn",
          "På lappen vil vi bare ha navnet.",
          "Navnet på låneren.",
          "Svaret har én kolonne."),
        L("FROM låner AS l",
          "Vi går gjennom personkortene ett og ett.",
          "Ytre spørring: én rad per låner.",
          "Aliaset " + m("l") + " er viktig. Delspørringen under bruker det for å vite hvilken låner vi står på."),
        L("WHERE NOT EXISTS (",
          "For hver person spør vi: finnes det et lånekort med deres nummer? Svaret må være nei.",
          "Behold låneren hvis delspørringen gir <i>ingen</i> rader.",
          "EXISTS er TRUE når delspørringen gir minst én rad, og NOT EXISTS er TRUE når den er tom. Dette er kursets standardmåte for «ingen», «aldri» og «uten».",
          { q: "Hvorfor NOT EXISTS og ikke NOT IN?",
            a: "Her ville " + m("lid NOT IN (SELECT lid FROM utlån)") + " gitt samme svar, fordi " + m("utlån.lid") + " er del av primærnøkkelen og aldri NULL. Har delspørringen en NULL, gir NOT IN tomt svar. Den fellen står ikke i lysarkene, men NOT EXISTS har den ikke." }),
        L("  SELECT *",
          "Vi bryr oss ikke om hva som står på lånekortet, bare om det finnes et.",
          "Inne i EXISTS spiller det ingen rolle hva du velger. Bare om det kommer rader.",
          "Kolonnene i en EXISTS-delspørring blir aldri brukt. " + m("SELECT *") + " og " + m("SELECT 1") + " betyr det samme."),
        L("  FROM utlån AS u",
          "Vi leter i bunken med lånekort.",
          "Delspørringen ser i utlån.",
          "Delspørringen kjøres (logisk sett) én gang for hver rad i den ytre spørringen."),
        L("  WHERE u.lid = l.lid",
          "Vi ser bare etter lånekort med nummeret til personen vi står på nå.",
          "Her er koblingen: " + m("l.lid") + " kommer fra den ytre spørringen. Det gjør delspørringen <b>korrelert</b>.",
          "En korrelert delspørring refererer til en kolonne i den ytre spørringen, og svaret avhenger av raden vi står på. Uten denne linja ville delspørringen sett på alle lån, og NOT EXISTS hadde vært FALSE for alle."),
        L(");",
          "Ferdig. Bare Dina har ingen lånekort.",
          "Lukk delspørringen. Svaret er Dina.",
          "Svaret er Dina, den eneste med 0 lån.")
      ] },

    { id: "with", label: "WITH og «flest»", tittel: "Låneren eller lånerne med flest lån",
      lines: [
        L("WITH antall_lån AS (",
          "Først lager vi en hjelpelapp vi kan bruke senere: hvor mange lån hver person har.",
          "WITH gir en delspørring et navn, så den kan brukes som en tabell i resten av spørringen.",
          "Navnet fra WITH finnes i alle de etterfølgende spørringene, også i delspørringen nederst. Det svarer til " + m("Navn :=") + " i relasjonsalgebra."),
        L("  SELECT lid, count(*) AS antall",
          "På hjelpelappen skriver vi lånenummeret og antall lån.",
          "Én rad per låner med lån, og hvor mange lån.",
          "Bare lånere som har lån, er med her. Dina mangler, men hun er ikke en kandidat til «flest» uansett."),
        L("  FROM utlån",
          "Vi teller i bunken med lånekort.",
          "Tellingen skjer i utlån.",
          "Det trengs ingen join for å telle, bare for å finne navnet etterpå."),
        L("  GROUP BY lid",
          "Én haug per lånenummer.",
          "Én gruppe per låner: 1 → 2 lån, 2 → 1, 3 → 2, 5 → 1.",
          "Gruppering på fremmednøkkelen er nok her, fordi vi ikke velger andre kolonner."),
        L(")",
          "Hjelpelappen er ferdig.",
          "Slutten på WITH-delen. Ikke noe semikolon her: hele spørringen er én setning.",
          "Et semikolon her ville avsluttet setningen, og WITH-navnet ville ikke funnes i resten."),
        L("SELECT l.navn, a.antall",
          "Nå lager vi den ekte lappen: navn og antall.",
          "Hovedspørringen bruker " + m("antall_lån") + " som en vanlig tabell.",
          "Hovedspørringen henter navnet ved å joine hjelpetabellen med låner."),
        L("FROM antall_lån AS a",
          "Vi bruker hjelpelappen.",
          "Hjelpetabellen fra WITH, med aliaset " + m("a") + ".",
          "Fire rader, én per låner med lån."),
        L("  INNER JOIN låner AS l ON (a.lid = l.lid)",
          "Til hvert nummer finner vi navnet på personen.",
          "Koble på låner for å få navnet.",
          "Vanlig indre join på fremmednøkkelen."),
        L("WHERE a.antall = (SELECT max(antall) FROM antall_lån);",
          "Vi beholder bare de personene som har like mange lån som den som har flest. Ada og Cato har begge 2.",
          "Behold radene der antallet er lik det største antallet. Delspørringen gir ett tall (2), så " + m("=") + " virker. Svaret er Ada og Cato.",
          "Delspørringen er skalar: én rad og én kolonne. Den er ikke korrelert, så den regnes én gang.",
          { q: "Hvorfor ikke ORDER BY antall DESC LIMIT 1?",
            a: "Ada og Cato har begge 2 lån. " + m("LIMIT 1") + " gir bare én av dem, og det er tilfeldig hvem. Med " + m("max") + " i en delspørring får du alle som deler førsteplassen. Eksamensløsninger på «flest» bruker ofte ORDER BY og LIMIT. Står det ingenting om uavgjort, skriv antakelsen din i en kommentar." })
      ] }
  ];

  /* ================= Parsons ================= */
  // linjer: [kode, forklaring]; godta: { linjeindeks: [andre plassindekser] }
  D.parsons = [
    { id: "ibsen", label: "Join", oppgave: "Titlene på alle bøker skrevet av Ibsen, i alfabetisk rekkefølge.",
      linjer: [
        ["SELECT b.tittel", "Bare tittelen skal vises."],
        ["FROM bok AS b", "Start i bok."],
        ["  INNER JOIN forfatter AS f ON (b.fid = f.fid)", "Join mot forfatter, så vi kan filtrere på navnet i stedet for å skrive inn en ID."],
        ["WHERE f.navn = 'Ibsen'", "Filtrer på navnet. Å skrive " + m("b.fid = 1") + " fordi du ser det i dataene, gir trekk."],
        ["ORDER BY b.tittel;", "Sorteringen kommer til slutt."]
      ] },
    { id: "land", label: "GROUP BY og HAVING", oppgave: "For hvert land med minst to bøker: landet og antall bøker, flest først.",
      linjer: [
        ["SELECT f.land, count(*) AS antall", "Landet og antallet. Aggregatet får et navn vi kan sortere på."],
        ["FROM forfatter AS f", "Start i forfatter, der landet står."],
        ["  INNER JOIN bok AS b ON (f.fid = b.fid)", "Én rad per bok med forfatter."],
        ["GROUP BY f.land", "Én gruppe per land."],
        ["HAVING count(*) >= 2", "Filtrer gruppene etter at de er telt. HAVING står etter GROUP BY."],
        ["ORDER BY antall DESC;", "Flest først. DESC er lett å glemme."]
      ] },
    { id: "ikkelevert", label: "WITH og LEFT JOIN", oppgave: "Alle lånere og hvor mange bøker hver av dem har ute nå. Lånere uten bøker ute skal være med med 0.",
      linjer: [
        ["WITH ute AS (", "Filtrer lånene først, i en egen delspørring."],
        ["  SELECT lid, bid", "Låneren og boka."],
        ["  FROM utlån", "Fra utlån."],
        ["  WHERE levert IS NULL", "Bare lån som ikke er levert. IS NULL, ikke = NULL."],
        [")", "WITH-delen slutter. Ikke semikolon."],
        ["SELECT l.navn, count(u.bid) AS antall", "count(u.bid), ikke count(*), så lånere uten treff får 0."],
        ["FROM låner AS l", "Alle lånere skal med, så låner står til venstre."],
        ["  LEFT JOIN ute AS u ON (l.lid = u.lid)", "Ytre join beholder lånere uten noe ute."],
        ["GROUP BY l.lid, l.navn;", "Én gruppe per låner."]
      ] },
    { id: "aldri", label: "NOT EXISTS", oppgave: "Navnet på forfattere som ikke har noen bøker i biblioteket.",
      linjer: [
        ["SELECT f.navn", "Navnet på forfatteren."],
        ["FROM forfatter AS f", "Gå gjennom forfatterne."],
        ["WHERE NOT EXISTS (", "Behold forfatteren hvis delspørringen er tom."],
        ["  SELECT *", "Hva delspørringen velger, spiller ingen rolle."],
        ["  FROM bok AS b", "Let i bok."],
        ["  WHERE b.fid = f.fid", "Den korrelerte betingelsen: bøker av akkurat denne forfatteren."],
        [");", "Lukk delspørringen. Svaret er Ferrante."]
      ] },
    { id: "view", label: "VIEW", oppgave: "Lag et view som viser hver boktittel og hvor mange ganger boka er lånt ut, mest lånt først. Bøker som aldri er lånt, skal med.",
      linjer: [
        ["CREATE VIEW utlånstall AS", "VIEW-oppgaver har vært med hvert år. Uten CREATE VIEW har sensor trukket −3."],
        ["SELECT b.tittel, count(u.lid) AS ganger", "count på en kolonne fra utlån, så bøker uten lån får 0."],
        ["FROM bok AS b", "Alle bøker skal med, så bok står til venstre."],
        ["  LEFT JOIN utlån AS u ON (b.bid = u.bid)", "Ytre join beholder Folkeeventyr."],
        ["GROUP BY b.bid, b.tittel", "Grupper på nøkkelen. To bøker kan ha samme tittel."],
        ["ORDER BY ganger DESC;", "Mest lånt først."]
      ] }
  ];

  /* ================= Les spørringen: hva spør den om? ================= */
  D.lesQuiz = [
    { sql: S("SELECT DISTINCT l.navn", "FROM låner AS l", "  INNER JOIN utlån AS u ON (l.lid = u.lid)", "WHERE u.levert IS NOT NULL;"),
      q: "Hva gir denne spørringen?",
      options: ["Lånere som har levert alle lånene sine", "Lånere som har levert minst ett lån", "Lånere som ikke har noe ute nå", "Alle lånere som har lånt noe"],
      answer: 1,
      explain: "WHERE ser på ett lån om gangen. Én levert bok er nok til at låneren kommer med. Ada er med selv om hun fortsatt har Peer Gynt ute. Svaret er Ada, Bo og Cato. «Alle levert» krever NOT EXISTS, EXCEPT eller en telling i HAVING. Sensor trakk 3 poeng for å blande «for alle» og «finnes» (H20).",
      kilde: [K("Eksamen H2020 oppgave 4 («for alle» mot «finnes»)")] },
    { sql: S("SELECT f.navn", "FROM forfatter AS f", "WHERE NOT EXISTS (", "  SELECT *", "  FROM bok AS b", "  WHERE b.fid = f.fid AND b.år >= 1900", ");"),
      q: "Hvilke forfattere gir den?",
      options: ["Forfattere som har minst én bok fra før 1900", "Forfattere der alle bøkene er fra før 1900, også forfattere uten bøker", "Forfattere der alle bøkene er fra før 1900, men bare de som har bøker", "Forfattere uten bøker"],
      answer: 1,
      explain: "NOT EXISTS er sann når det ikke finnes noen bok fra 1900 eller senere. Det gjelder Ibsen (1867 og 1879), men også Ferrante, som ikke har noen bøker i det hele tatt. «For alle» er sant for en tom mengde. Skal bare forfattere med bøker være med, må du i tillegg kreve at det finnes minst én bok.",
      kilde: [K("F10-02 lysark 11 (måter å finne «uten» på)")] },
    { sql: S("SELECT b.tittel, u.dato", "FROM bok AS b", "  LEFT JOIN utlån AS u ON (b.bid = u.bid)", "WHERE u.levert IS NULL;"),
      q: "Hvilke bøker kommer med?",
      options: ["Bøker som er ute nå", "Bøker som aldri er lånt ut", "Bøker som er ute nå, og bøker som aldri er lånt ut", "Alle bøker"],
      answer: 2,
      explain: "Bøker som er ute, har et lån med " + m("levert") + " lik NULL. Men Folkeeventyr, som aldri er lånt, får også NULL i alle utlån-kolonnene fra LEFT JOIN, og kommer med. Svaret blir 4 rader: Et dukkehjem (Cato), Peer Gynt, Kristin Lavransdatter og Folkeeventyr med dato NULL. Vil du bare ha bøkene som er ute, holder det med INNER JOIN.",
      kilde: [K("F10-01 lysark 8–12 (ytre join)")] },
    { sql: S("SELECT sted, count(*)", "FROM låner", "GROUP BY sted", "HAVING count(*) > 1;"),
      q: "Hva gir den?",
      options: ["Lånere som bor på samme sted som en annen", "Steder der mer enn én låner bor, med antallet", "Antall lånere med kjent sted", "Én rad per låner, med antall lånere på stedet"],
      answer: 1,
      explain: "Én gruppe per sted, og bare grupper med mer enn én rad blir igjen. Svaret er én rad: Oslo med 2. Dina (NULL) havner i en egen gruppe for NULL, men den har bare én rad.",
      kilde: [K("F09-02 lysark 11–12 (GROUP BY og HAVING)")] },
    { ra: "π<sub>navn</sub>(σ<sub>land = 'Norge'</sub>(forfatter))",
      q: "Hvilken SQL svarer til dette RA-uttrykket?",
      options: [m("SELECT DISTINCT navn FROM forfatter WHERE land = 'Norge';"), m("SELECT land FROM forfatter WHERE navn = 'Norge';"), m("SELECT * FROM forfatter WHERE land = 'Norge';"), m("SELECT navn FROM forfatter WHERE land = 'Norge';")],
      answer: 0, godta: [3],
      explain: "σ velger rader (WHERE), π velger kolonner (SELECT). π fjerner duplikater, så det nøyaktige motstykket har DISTINCT. Uten DISTINCT er svaret bare likt «opp til duplikater». Her blir det likt uansett (Ibsen og Undset), så begge godtas. Alternativ 3 beholder alle kolonnene, og alternativ 2 har byttet om på kolonnene.",
      kilde: [K("F03-01 lysark 12–13 (SQL til RA, mengde mot multimengde)")] },
    { ra: "π<sub>tittel</sub>(bok ⋈<sub>bok.fid = forfatter.fid</sub> σ<sub>land = 'Sverige'</sub>(forfatter))",
      q: "Hva gir uttrykket?",
      options: ["Titlene på bøker av svenske forfattere", "Svenske forfattere og titlene deres", "Titlene på alle bøker, og svenske forfattere", "Forfattere som har skrevet en bok om Sverige"],
      answer: 0,
      explain: "Les innenfra og ut: først de svenske forfatterne (σ), så bøkene deres (⋈ på fid), så bare tittelen (π). Svaret er Brødrene Løvehjerte.",
      kilde: [K("F02-03 (RA-operatorene)")] }
  ];

  /* ================= Radantall ================= */
  D.radantall = [
    { sql: "SELECT sted FROM låner WHERE sted != 'Oslo';", fasit: 2,
      forklaring: "Bergen og Skien. Dina har NULL, og " + m("NULL != 'Oslo'") + " er NULL, ikke TRUE." },
    { sql: "SELECT DISTINCT fid FROM bok;", fasit: 5,
      forklaring: "1, 2, 3, 4 og NULL. DISTINCT regner to NULL-er som like, så Folkeeventyrs NULL blir én rad." },
    { sql: S("SELECT *", "FROM forfatter AS f", "  LEFT JOIN bok AS b ON (f.fid = b.fid);"), fasit: 6,
      forklaring: "Fem bøker har forfatter (Ibsen to ganger), og Ferrante får én rad med NULL i bokkolonnene. Folkeeventyr er ikke med, fordi forfatter står til venstre." },
    { sql: S("SELECT tittel", "FROM bok", "WHERE sider > (SELECT avg(sider) FROM bok);"), fasit: 1,
      forklaring: "Gjennomsnittet regnes uten NULL: (120 + 250 + 1000 + 200 + 230) / 5 = 360. Bare Kristin Lavransdatter er tykkere." },
    { sql: S("SELECT lid FROM låner", "EXCEPT", "SELECT lid FROM utlån;"), fasit: 1,
      forklaring: "Lånerne er 1–5, og 1, 2, 3 og 5 har lån. Bare 4 (Dina) er igjen." },
    { sql: "SELECT count(*), count(sted) FROM låner;", fasit: 1,
      forklaring: "Et aggregat uten GROUP BY gir alltid nøyaktig én rad: 5 og 4. " + m("count(sted)") + " hopper over Dinas NULL." }
  ];

  /* ================= Finn feilen ================= */
  D.finnFeil = [
    { oppgave: "Lånere og bøker for lån som ikke er levert.",
      sql: S("SELECT l.navn, b.tittel", "FROM utlån AS u", "  INNER JOIN låner AS l ON (u.lid = l.lid)", "  INNER JOIN bok AS b ON (u.bid = b.bid)", "WHERE u.levert = NULL;"),
      feil: [5], rett: "WHERE u.levert IS NULL;",
      forklaring: m("= NULL") + " blir NULL for hver rad, og svaret får 0 rader uten feilmelding. Bruk " + m("IS NULL") + "." },
    { oppgave: "Forfattere med minst to bøker.",
      sql: S("SELECT f.navn, count(*) AS antall", "FROM forfatter AS f", "  INNER JOIN bok AS b ON (f.fid = b.fid)", "WHERE count(*) >= 2", "GROUP BY f.fid, f.navn;"),
      feil: [4], rett: "HAVING count(*) >= 2  (etter GROUP BY)",
      forklaring: "Aggregater kan ikke stå i WHERE, fordi gruppene ikke finnes ennå. Betingelsen hører hjemme i HAVING, etter GROUP BY. Sensor trekker −2 for dette." },
    { oppgave: "Alle lånere med antall lån, flest først.",
      sql: S("SELECT l.navn, count(u.bid) AS antall", "FROM låner AS l", "  LEFT JOIN utlån AS u ON (l.lid = u.lid)", "GROUP BY l.lid, l.navn", "ORDER BY antall;"),
      feil: [5], rett: "ORDER BY antall DESC;",
      forklaring: "Standard er stigende, så de med færrest kommer først. «Flest først» krever DESC. Sensor trakk −1 for manglende DESC (H19 2.7)." },
    { oppgave: "Tittel og lånedato for hvert lån.",
      sql: S("SELECT b.tittel, u.dato", "FROM bok AS b, utlån AS u", "WHERE u.dato >= '2026-01-01';"),
      feil: [2, 3], rett: "WHERE b.bid = u.bid AND u.dato >= '2026-01-01';  (eller INNER JOIN … ON)",
      forklaring: "Det mangler en join-betingelse. Uten den blir det et kryssprodukt: hver bok sammen med hvert lån, 6 · 6 = 36 rader. Sensor trekker −1 for manglende eller feil join." },
    { oppgave: "Hver låner med antall lån.",
      sql: S("SELECT l.navn, b.tittel, count(*) AS antall", "FROM utlån AS u", "  INNER JOIN låner AS l ON (u.lid = l.lid)", "  INNER JOIN bok AS b ON (u.bid = b.bid)", "GROUP BY l.lid, l.navn;"),
      feil: [1, 5], rett: "SELECT l.navn, count(*) AS antall  (dropp b.tittel, og joinen mot bok trengs ikke)",
      forklaring: m("b.tittel") + " står verken i GROUP BY eller i et aggregat. En låner med to lån har to titler, og databasen vet ikke hvilken den skal vise. PostgreSQL gir feilmelding." }
  ];

  /* ================= Fra oppgavetekst til SQL ================= */
  D.ordliste = [
    ["«for hver …», «per …»", "GROUP BY på nøkkelen til det det telles per", "Gruppér på primærnøkkelen, ikke bare navnet.", ["05-sql-videre.html#fane=aggregering", "Aggregering"]],
    ["«også de som ikke har …», «med 0»", "LEFT JOIN og " + m("count(kol)") + " fra høyre tabell", m("count(*)") + " gir 1 i stedet for 0.", ["05-sql-videre.html#fane=ytre-join", "Ytre join"]],
    ["«ingen», «aldri», «uten»", "NOT EXISTS, NOT IN, EXCEPT eller LEFT JOIN … IS NULL", "NOT IN og NULL i delspørringen.", ["05-sql-videre.html#fane=delsporringer", "Delspørringer"]],
    ["«alle», «bare», «hver eneste»", "NOT EXISTS («finnes ingen som ikke …») eller en telling i HAVING", "Å filtrere rader gir «minst én», ikke «alle».", ["05-sql-videre.html#fane=for-alle", "«For alle»"]],
    ["«minst n», «mer enn n»", "HAVING " + m("count(…) &gt;= n"), "Aggregat i WHERE.", ["05-sql-videre.html#fane=aggregering", "Aggregering"]],
    ["«flest», «høyest», «den største»", "ORDER BY … DESC LIMIT 1, eller " + m("max") + " i en delspørring", "Uavgjort: LIMIT 1 gir bare én.", ["05-sql-videre.html#fane=with", "WITH"]],
    ["«unike», «hvilke», «ingen duplikater»", "DISTINCT", "En join kan gi samme rad flere ganger.", ["04-sql.html#fane=distinct", "DISTINCT"]],
    ["«sortert», «nyeste først»", "ORDER BY, og DESC for synkende", "Manglende ORDER BY gir −2.", ["04-sql.html#fane=distinct", "ORDER BY"]],
    ["«som inneholder …», «begynner med …»", "LIKE med " + m("%"), "= i stedet for LIKE, eller LIKE uten %.", ["04-sql.html#fane=anatomi", "LIKE"]],
    ["«eller»", "OR, med parentes rundt", "AND i stedet for OR.", ["04-sql.html#fane=anatomi", "Feller"]],
    ["«mangler …», «ikke registrert»", "IS NULL", "= NULL gir 0 rader.", ["05-sql-videre.html#fane=null", "NULL"]],
    ["«lag et view»", "CREATE VIEW navn AS SELECT …", "Bare SELECT gir trekk.", ["05-sql-videre.html#fane=eksamen", "Eksamensoppgaver"]],
    ["«hvis én feiler, skal ingen gjennomføres»", "BEGIN; … COMMIT;", "Uten transaksjon kan halve jobben bli gjort.", ["04-sql.html#fane=endring", "Transaksjon"]]
  ];

  /* ================= Skriveguide ================= */
  D.explainSkriv = t(
    "<p>Tenk at du skriver en handleliste til noen som aldri har vært i butikken. De gjør nøyaktig det som står, verken mer eller mindre. Står det «melk», får du kanskje sjokolademelk. Står det «lettmelk, 1 liter», får du det du ville.</p>" +
    "<p>Sensor leser spørringen din på samme måte. Skriv nøyaktig det oppgaven spør om, og skriv en liten lapp ved siden av hvis du har måttet gjette på noe.</p>",
    "<p>Sensor retter ut fra en liste med trekk per feil, og de samme feilene går igjen hvert år. Gode svar har tre ting til felles: de bruker riktig klausul til riktig jobb, de håndterer NULL og rader uten partner med vilje, og de forklarer antakelser i en kommentar.</p>",
    "<p>Oppgavene i SQL-delen bygger på ett felles skjema med eksempeldata, og sensor vurderer om spørringen ville gitt riktig svar på <i>alle</i> lovlige databaser, ikke bare på eksempeldataene. Derfor gir hardkodede ID-er trekk, og derfor må du tenke på NULL, like navn og rader uten partner selv om eksempeldataene ikke har dem. Delpoeng gis per delmål, og følgefeil fra en tidligere oppgave trekkes ikke to ganger.</p>"
  );

  D.oppskrift = [
    "<b>Les oppgaven og finn signalordene.</b> Hvilke kolonner skal svaret ha? Står det «for hver», «alle», «også de som ikke har», «flest» eller «unike»? Se ordlista under.",
    "<b>Finn tabellene i skjemaet.</b> Hvor står opplysningene, og hvilke fremmednøkler går mellom dem? Start gjerne i hendelsestabellen (lån, bestilling, tur).",
    "<b>Skriv FROM med join-ene først.</b> Én " + m("INNER JOIN … ON (…)") + " per fremmednøkkel. LEFT JOIN der rader uten partner skal være med.",
    "<b>WHERE for radene.</b> Filtrer på navn og verdier, aldri på ID-er du har lest av eksempeldataene. " + m("IS NULL") + " for manglende verdier.",
    "<b>GROUP BY og HAVING for gruppene.</b> Grupper på nøkkelen. Betingelser på aggregater i HAVING.",
    "<b>SELECT til slutt.</b> Bare kolonnene oppgaven ber om, med " + m("AS") + " der et navn gjør svaret tydeligere. Alt utenom aggregatene må stå i GROUP BY.",
    "<b>ORDER BY, DESC og LIMIT</b> hvis oppgaven sier «sortert», «flest» eller «de fem første».",
    "<b>Kommentarer.</b> Skriv antakelser og tolkninger med " + m("--") + ". Er oppgaven tvetydig, får en rimelig tolkning med forklaring full uttelling.",
    "<b>Prøv svaret i hodet på eksempeldataene.</b> Ta med raden med NULL og raden uten partner. Gir svaret det oppgaven ber om?"
  ];

  D.sjekkliste = [
    "Hver tabell i FROM er koblet til de andre med en join-betingelse.",
    "Ingen NATURAL JOIN mellom tabeller som deler et kolonnenavn som " + m("navn") + ".",
    "Ingen ID-er hentet fra eksempeldataene.",
    m("IS NULL") + " / " + m("IS NOT NULL") + ", aldri " + m("= NULL") + ".",
    "LEFT JOIN og " + m("count(kol)") + " der rader med 0 skal med.",
    "Ingen aggregater i WHERE.",
    "Alt i SELECT utenfor aggregat står i GROUP BY.",
    "«Alle» er løst med NOT EXISTS eller en telling, ikke bare med WHERE.",
    "ORDER BY og DESC der oppgaven ber om rekkefølge.",
    "CREATE VIEW der oppgaven ber om et view.",
    "Antakelser står i en kommentar."
  ];

  D.skrivOppgave = "Finn navnet på hver låner og hvor mange bøker av Ibsen hver av dem har lånt. Lånere som ikke har lånt noen Ibsen-bok, skal være med med 0. Sorter med flest først.";
  D.skrivDarlig = S(
    "SELECT navn, count(*)",
    "FROM låner NATURAL JOIN utlån NATURAL JOIN bok",
    "WHERE fid = 1",
    "GROUP BY navn");
  D.skrivDarligFeil = [
    m("fid = 1") + " er en ID lest av eksempeldataene. Spørringen skal virke selv om Ibsen får en annen ID. Sensor har trukket 1–2 poeng for hardkodede ID-er (H19, H20).",
    "Indre join fjerner Bo, Dina og låneren Ibsen, som skulle vært med med 0. Sensor har trukket −2 for indre join der rader med 0 skal med (H19 2.5).",
    "NATURAL JOIN gir riktig kobling her, men bare fordi tabellene tilfeldigvis ikke deler andre kolonnenavn. Joines forfatter inn, kobles det også på " + m("navn") + ".",
    m("GROUP BY navn") + " slår sammen to lånere som heter det samme. Grupper på " + m("lid") + ".",
    "Ingen ORDER BY. Manglende ORDER BY gir −2.",
    "Ingen semikolon. Det gir ikke trekk, men skriv det likevel."
  ];
  D.skrivGod = S(
    "-- Antakelse: «bøker av Ibsen» er bøker der forfatteren heter Ibsen.",
    "-- Lånene filtreres først, så lånere uten Ibsen-lån blir med med 0.",
    "WITH ibsen_lån AS (",
    "  SELECT u.lid, u.bid",
    "  FROM utlån AS u",
    "    INNER JOIN bok AS b ON (u.bid = b.bid)",
    "    INNER JOIN forfatter AS f ON (b.fid = f.fid)",
    "  WHERE f.navn = 'Ibsen'",
    ")",
    "SELECT l.navn, count(i.bid) AS antall",
    "FROM låner AS l",
    "  LEFT JOIN ibsen_lån AS i ON (l.lid = i.lid)",
    "GROUP BY l.lid, l.navn",
    "ORDER BY antall DESC;");
  D.skrivGodNoter = [
    "Kommentarene forklarer tolkningen. Sensor oppfordrer til det.",
    "Filteret på Ibsen står i WITH, <i>før</i> den ytre joinen. Står det i WHERE etter LEFT JOIN, forsvinner lånerne uten Ibsen-lån igjen. Å filtrere i WITH først er kursets egen løsning på dette.",
    m("count(i.bid)") + " gir 0 for lånere uten treff.",
    "Gruppering på " + m("lid") + " skiller to lånere med samme navn."
  ];

  /* Ordrett fra eksamen og sensorveiledning H25 (lov å gjengi, med kilde) */
  D.sitatOppgave = {
    tekst: "Du må gjerne inkludere kommentarer i spørringene (gjøres med “–” i SQL). Dersom det er uklarheter eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar om hvilke antagelser og tolkinger du gjør.",
    kilde: "Oppgavetekst: UiO, IN2090, eksamen H2025, innledningen til del 2 (SQL). Samme tekst står i H2023. Tegnet “–” er to bindestreker (--) i SQL."
  };
  D.sitatSensor = {
    intro: "Generelt gjelder følgende (men disse må sees litt i sammenheng med oppgaven):",
    punkter: [
      "-0.5 for manglende kolonner i SELECT",
      "-1 for manglende/feil tabeller i joins i FROM",
      "-1 for manglende begrensning i WHERE",
      "-2 for aggregering (count, sum, osv.) i WHERE-klausulen",
      "-2 for manglende ORDER BY eller GROUP BY",
      "Ingen trekk for å kun ha primærnøkkel i GROUP BY men andre attributter (fra samme tabell) i SELECT (støttes av PostgreSQL)",
      "Ingen trekk for enkle syntaksfeil man enkelt ville funnet ut av om man hadde mulighet til å kjøre spørringen"
    ],
    kilde: "Sensorveiledning: UiO, IN2090, eksamen H2025, del 2 (SQL). Den samme lista står i H2020 og H2023."
  };

  /* RA-svar på eksamen */
  D.raSvar = [
    "Bruk kursets symboler: π, σ, ⋈ med betingelsen senket, ×, ∪, ∩ og ∖.",
    "Les og skriv innenfra og ut: σ nærmest tabellen, π ytterst.",
    "Du trenger ikke DISTINCT. π gir en mengde, så duplikatene forsvinner av seg selv.",
    "Skriv join-betingelsen med tabellnavn foran attributtene (" + m("bok.fid = forfatter.fid") + "). Naturlig join (⋈ uten betingelse) går bare når de felles attributtnavnene er akkurat dem du vil koble på.",
    "Er uttrykket langt, del det opp med " + m(":=") + ". Det er like riktig og lettere å rette.",
    "Kursets RA har ikke ytre join, aggregering eller sortering. Spør oppgaven om slikt, er det SQL som menes."
  ];

  /* ================= Sant/usant om notasjonen ================= */
  D.tf = [
    { s: "I relasjonsalgebra fjerner π duplikater. I SQL gjør SELECT det ikke uten DISTINCT.", answer: true,
      explain: "RA jobber med mengder, SQL med multimengder.", kilde: K("F03-01 lysark 13") },
    { s: "σ velger kolonner, og π velger rader.", answer: false,
      explain: "Motsatt: σ (seleksjon) velger rader og svarer til WHERE. π (projeksjon) velger kolonner og svarer til SELECT." },
    { s: "R ⋈<sub>θ</sub> S er det samme som σ<sub>θ</sub>(R × S).", answer: true,
      explain: "Theta-join er definert slik: kryssproduktet, filtrert på betingelsen." },
    { s: "Union i relasjonsalgebra krever at de to relasjonene har lik signatur.", answer: true,
      explain: "Samme attributtnavn og typer. I SQL må spørringene ha like mange kolonner med kompatible typer." },
    { s: "SQL-nøkkelord må skrives med store bokstaver, ellers feiler spørringen.", answer: false,
      explain: "Nøkkelord og navn skiller ikke mellom store og små bokstaver. Store bokstaver på nøkkelord er bare stil, men en god stil." },
    { s: m("WHERE sted = 'oslo'") + " finner låneren som bor i Oslo.", answer: false,
      explain: "Verdier skiller mellom store og små bokstaver. 'oslo' er ikke lik 'Oslo'." },
    { s: "Et navn laget med AS i SELECT kan brukes i ORDER BY.", answer: true,
      explain: "ORDER BY evalueres etter SELECT. I WHERE og HAVING finnes navnet ikke." },
    { s: "En enkel skrivefeil i SQL, som et manglende komma, gir alltid trekk på eksamen.", answer: false,
      explain: "Sensorveiledningene H23–H25 sier at enkle syntaksfeil man ville funnet ved å kjøre spørringen, ikke gir trekk. Feil klausul eller feil operator er ikke en skrivefeil." }
  ];
})();
