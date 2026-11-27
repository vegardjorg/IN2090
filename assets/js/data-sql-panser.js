/* ============================================================
   IN2090 guide · data-sql-panser.js
   Håndskrevne scenarier til IN.sqlPanser («under panseret»), på biblioteksdatabasen fra data-sql.js.
   Alle radtall og svar er kontrollert mot sql-motor.js (plan/proto/sql-panser.html, «Sjekk mot motoren»).
   PostgreSQL-meldingene (feltet pg) er PostgreSQLs egne feiltekster. All annen tekst er skrevet med egne ord.

   Scenario: {
     id, tittel, nivaa: "intro"|"eksamen"|"dypere", tema,
     sql,
     fase:  "tegn"|"parse"|"semantikk"|"kjoring"|null   fasen der feilen oppdages / fellen viser seg (null = alt går bra)
     utfall: "feil"|"felle"|"ok",
     pg?:    PostgreSQL-meldingen,  norsk?: norsk gjengivelse,
     hvorfor: { eli5, normal, teknisk }   hvorfor det skjer i akkurat denne fasen,
     sjekk?:  "navn"|"type"|"aggregat"|"gruppering"   (semantikk) hvilken sjekk som slår ut,
     orden?:  { brukes, finnes, hva }    (semantikk) «brukes her, finnes først der» i logisk rekkefølge,
     grupper?: [{ nokkel, verdier[] }]   (ugruppert kolonne),
     tabell?: { kolonner[], uttrykk, rader: [[celle…]], verdier: [true|false|null] }  (kjøring, rad for rad),
     kjede?:  [[klausul, antall, "grupper"?]]   radtall gjennom den logiske rekkefølgen,
     svar?:   { kolonner, rader },
     sensor?: eksamensrelevans,  rettet?: sql,  rettetTekst?: html,  tillegg?: true (ikke i lysarkene)
   }
   Klassisk script. Ingen avhengigheter.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  function S() { return [].slice.call(arguments).join("\n"); }

  var SC = [
    {
      id: "riktig", tittel: "En spørring som går hele veien", nivaa: "intro", tema: "Logisk rekkefølge",
      sql: S("SELECT l.navn, count(*) AS antall",
        "FROM låner AS l",
        "  INNER JOIN utlån AS u ON (l.lid = u.lid)",
        "WHERE u.dato >= '2026-09-05'",
        "GROUP BY l.lid, l.navn",
        "HAVING count(*) >= 2",
        "ORDER BY antall DESC;"),
      fase: null, utfall: "ok",
      hvorfor: {
        eli5: "Databasen leser først hva du har skrevet, sjekker at alle navnene finnes, og så gjør den jobben i sin egen rekkefølge: først henter den alle lånene, så kaster den de gamle, så legger den lånene i hauger per person, teller haugene og tar vare på de store. Til slutt skriver den ut navnet og tallet.",
        normal: "Legg merke til at spørringen skrives med SELECT først, men regnes ut nesten sist: FROM og joinen bygger radene, WHERE filtrerer dem, GROUP BY lager grupper, HAVING filtrerer gruppene, og først da regner SELECT ut kolonnene og navnet <span class=\"mono\">antall</span>. Derfor kan ORDER BY bruke <span class=\"mono\">antall</span>, mens HAVING må skrive <span class=\"mono\">count(*)</span> på nytt.",
        teknisk: "Skriverekkefølgen er fast i grammatikken (grupperingslysarket s. 12), mens svaret er definert av den logiske rekkefølgen FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. Navnereglene følger av den: et SELECT-alias finnes i ORDER BY, men ikke i WHERE eller HAVING (grupperingslysarket s. 13). Databasen kan regne ut svaret på en annen måte enn denne rekkefølgen, så lenge resultatet blir det samme."
      },
      kjede: [["FROM", 6], ["WHERE", 5], ["GROUP BY", 4, "grupper"], ["HAVING", 1, "grupper"], ["SELECT", 1], ["ORDER BY", 1]],
      svar: { kolonner: ["navn", "antall"], rader: [["Cato", 2]] }
    },
    {
      id: "rekkefolge", tittel: "Klausulene i feil rekkefølge", nivaa: "intro", tema: "Grammatikk",
      sql: S("SELECT tittel",
        "FROM bok",
        "ORDER BY år",
        "WHERE sider > 100;"),
      fase: "parse", utfall: "feil",
      pg: 'ERROR:  syntax error at or near "WHERE"',
      norsk: "Syntaksfeil ved «WHERE».",
      hvorfor: {
        eli5: "Det er som en oppskrift der det står «server», og så «skrell potetene». Kokken leser oppskriften før han begynner, ser at rekkefølgen er umulig, og nekter å starte. Ingen poteter er rørt.",
        normal: "Grammatikken bestemmer rekkefølgen klausulene skal skrives i. Etter ORDER BY er bare LIMIT, OFFSET eller slutten av spørringen lov. Parseren har allerede passert plassen der WHERE kunne stått, og stopper. Databasen har ikke sett på en eneste rad, fordi den ikke vet hva spørringen betyr ennå.",
        teknisk: "Feilen fanges av parseren, som bare ser på ordene og grammatikken. Den vet ikke om tabellen <span class=\"mono\">bok</span> finnes, og den har ikke lest data. Derfor peker meldingen på ordet der grammatikken slutter å stemme, ikke på hva du mente. Rett ved å flytte WHERE opp foran ORDER BY. Merk: sensor trekker normalt ikke for slike syntaksfeil (H2023, H2025), men spørringen kjører ikke."
      },
      rettet: S("SELECT tittel", "FROM bok", "WHERE sider > 100", "ORDER BY år;"),
      sensor: "Ingen trekk for enkle syntaksfeil (H2023/H25), men spørringen kjører ikke."
    },
    {
      id: "dobbelfnutt", tittel: "\"Oslo\" i doble anførselstegn", nivaa: "intro", tema: "Navn og regler",
      sql: S("SELECT navn",
        "FROM låner",
        "WHERE sted = \"Oslo\";"),
      fase: "semantikk", utfall: "feil", sjekk: "navn", merk: "\"Oslo\"",
      pg: 'ERROR:  column "Oslo" does not exist',
      norsk: "Kolonnen «Oslo» finnes ikke.",
      hvorfor: {
        eli5: "For databasen betyr enkle fnutter «dette er en tekst», mens doble fnutter betyr «dette er navnet på en kolonne». Du spurte altså om steder som er lik kolonnen Oslo, og den kolonnen finnes ikke.",
        normal: "Allerede når teksten deles i ord, blir <span class=\"mono\">\"Oslo\"</span> lest som et <em>navn</em>, ikke som en streng. Grammatikken er helt i orden, så feilen oppdages først når navnene slås opp: det finnes ingen kolonne som heter Oslo. Strenger skrives med enkle anførselstegn: <span class=\"mono\">'Oslo'</span>.",
        teknisk: "I PostgreSQL er <span class=\"mono\">\"…\"</span> et sitert navn (identifikator), og <span class=\"mono\">'…'</span> er en streng. Grammatikken godtar <span class=\"mono\">sted = navn</span>, for å sammenligne to kolonner er lov. Derfor kommer feilen i navneoppslaget, ikke i parseren. (SQLite godtar dette og gjør det om til en streng. PostgreSQL gjør ikke det.)"
      },
      rettet: S("SELECT navn", "FROM låner", "WHERE sted = 'Oslo';")
    },
    {
      id: "aggwhere", tittel: "Aggregat i WHERE", nivaa: "eksamen", tema: "Navn og regler",
      sql: S("SELECT fid, count(*)",
        "FROM bok",
        "WHERE count(*) > 1",
        "GROUP BY fid;"),
      fase: "semantikk", utfall: "feil", sjekk: "aggregat", merk: { tekst: "count(*)", etter: "WHERE" },
      orden: { brukes: "WHERE", finnes: "GROUP BY", hva: "gruppene" },
      pg: "ERROR:  aggregate functions are not allowed in WHERE",
      norsk: "Aggregatfunksjoner er ikke lov i WHERE.",
      hvorfor: {
        eli5: "WHERE er en dørvakt som ser på én person om gangen. Du ber dørvakten slippe inn «de som er mer enn én». Det kan ikke dørvakten svare på, for han ser bare én person, og gruppene lages først inne i salen.",
        normal: "WHERE ser på én rad om gangen, og det skjer <em>før</em> GROUP BY har laget gruppene. <span class=\"mono\">count(*)</span> teller rader i en gruppe, men i WHERE finnes det ingen grupper å telle i ennå. Databasen ser det uten å se på data: den vet hvor aggregater er lov. Et filter på grupper skal stå i HAVING.",
        teknisk: "Grammatikken tillater et uttrykk etter WHERE, og <span class=\"mono\">count(*) > 1</span> er et uttrykk, så parseren godtar spørringen. Feilen fanges i navne- og regelsjekken, som vet at aggregater bare kan regnes ut per gruppe, altså i SELECT, HAVING og ORDER BY. HAVING er «en slags WHERE for grupper» (grupperingslysarket s. 11)."
      },
      rettet: S("SELECT fid, count(*)", "FROM bok", "GROUP BY fid", "HAVING count(*) > 1;"),
      sensor: "−2 for aggregat i WHERE i stedet for HAVING (H2023, H2025, og i én oppgave i H2020)."
    },
    {
      id: "alias", tittel: "SELECT-alias brukt i WHERE", nivaa: "eksamen", tema: "Navn og regler",
      sql: S("SELECT tittel, sider / 100 AS hundre",
        "FROM bok",
        "WHERE hundre > 2;"),
      fase: "semantikk", utfall: "feil", sjekk: "navn", merk: { tekst: "hundre", etter: "WHERE" },
      orden: { brukes: "WHERE", finnes: "SELECT", hva: "navnet hundre" },
      pg: 'ERROR:  column "hundre" does not exist',
      norsk: "Kolonnen «hundre» finnes ikke.",
      hvorfor: {
        eli5: "Det er som å be noen hente «den røde koppen» før noen har malt den rød. Fargen kommer senere, så akkurat nå finnes det ingen rød kopp.",
        normal: "Navnet <span class=\"mono\">hundre</span> lages i SELECT, og SELECT kommer nesten sist i den logiske rekkefølgen. WHERE kommer før, så når WHERE skal slå opp navnet, finnes bare kolonnene i <span class=\"mono\">bok</span>. Skriv uttrykket på nytt: <span class=\"mono\">WHERE sider / 100 > 2</span>. I ORDER BY hadde <span class=\"mono\">hundre</span> virket, for den kommer etter SELECT.",
        teknisk: "Navneoppslaget i WHERE ser bare tabellene i FROM. Kurset sier det som en regel: SELECT-navn kan brukes i ORDER BY og i ytre spørringer, ikke i WHERE eller HAVING (grupperingslysarket s. 13). PostgreSQL sier bare at kolonnen ikke finnes. Den sier ikke at det er et alias, så meldingen er lett å misforstå."
      },
      rettet: S("SELECT tittel, sider / 100 AS hundre", "FROM bok", "WHERE sider / 100 > 2;")
    },
    {
      id: "ugruppert", tittel: "Kolonne som ikke er gruppert", nivaa: "eksamen", tema: "Navn og regler",
      sql: S("SELECT f.navn, b.tittel, count(*)",
        "FROM forfatter AS f",
        "  INNER JOIN bok AS b ON (f.fid = b.fid)",
        "GROUP BY f.fid, f.navn;"),
      fase: "semantikk", utfall: "feil", sjekk: "gruppering", merk: "b.tittel",
      pg: 'ERROR:  column "b.tittel" must appear in the GROUP BY clause or be used in an aggregate function',
      norsk: "Kolonnen «b.tittel» må stå i GROUP BY eller i en aggregatfunksjon.",
      grupper: [
        { nokkel: "Ibsen", verdier: ["Et dukkehjem", "Peer Gynt"] },
        { nokkel: "Undset", verdier: ["Kristin Lavransdatter"] },
        { nokkel: "Woolf", verdier: ["Mrs Dalloway"] },
        { nokkel: "Lindgren", verdier: ["Brødrene Løvehjerte"] }
      ],
      hvorfor: {
        eli5: "Du har lagt bøkene i én haug per forfatter og vil skrive én lapp per haug. På lappen skal det stå én tittel. Men Ibsen-haugen har to bøker. Hvilken skal du skrive? Det vet ingen, så databasen nekter.",
        normal: "Etter GROUP BY blir hver gruppe til én rad. Hver kolonne i SELECT må derfor ha <em>én</em> verdi per gruppe. <span class=\"mono\">f.navn</span> har det, for det er det vi grupperer på. <span class=\"mono\">count(*)</span> har det, for det regnes ut per gruppe. Men gruppen Ibsen har to titler, og databasen kan ikke velge. Regelen sjekkes før kjøring, så den gjelder selv om alle gruppene tilfeldigvis hadde én tittel. Rettingen grupperer også på <span class=\"mono\">f.fid</span>: to forfattere med samme navn blir ellers slått sammen til én gruppe.",
        teknisk: "GROUP BY-regelen sjekkes ut fra spørringen, ikke ut fra dataene: hver kolonne utenfor aggregat må være gruppert. PostgreSQL har ett unntak. Grupperer du på primærnøkkelen, kan du bruke de andre kolonnene i samme tabell, fordi de da er bestemt av nøkkelen. Sensor gir ikke trekk for det (H2023, H2025). Velg <span class=\"mono\">GROUP BY f.navn, b.tittel</span>, et aggregat som <span class=\"mono\">max(b.tittel)</span> eller ta kolonnen ut."
      },
      rettet: S("SELECT f.navn, count(*)", "FROM forfatter AS f", "  INNER JOIN bok AS b ON (f.fid = b.fid)", "GROUP BY f.fid, f.navn;"),
      sensor: "−2 for manglende GROUP BY (H2020, H2025). Ingen trekk for å gruppere på primærnøkkelen."
    },
    {
      id: "likenull", tittel: "= NULL i stedet for IS NULL", nivaa: "eksamen", tema: "Kjøring",
      sql: S("SELECT navn",
        "FROM låner",
        "WHERE sted = NULL;"),
      fase: "kjoring", utfall: "felle",
      tabell: {
        kolonner: ["navn", "sted"], uttrykk: "sted = NULL",
        rader: [["Ada", "Oslo"], ["Bo", "Bergen"], ["Cato", "Oslo"], ["Dina", null], ["Ibsen", "Skien"]],
        verdier: [null, null, null, null, null]
      },
      kjede: [["FROM", 5], ["WHERE", 0], ["SELECT", 0]],
      svar: { kolonner: ["navn"], rader: [] },
      hvorfor: {
        eli5: "NULL betyr «vet ikke». Spør du «er Dinas sted lik vet-ikke?», er svaret også «vet ikke». Det gjelder Ada og Oslo også. Dørvakten slipper bare inn dem som får et klart ja, så ingen kommer inn.",
        normal: "Spørringen er helt lovlig, så alle fasene før kjøring er grønne. Feilen viser seg først når radene regnes ut: en sammenligning med NULL blir NULL («ukjent») for hver eneste rad, også for Dina. WHERE beholder bare rader der betingelsen er TRUE, så svaret blir tomt. Databasen sier ingenting. Bruk <span class=\"mono\">sted IS NULL</span>.",
        teknisk: "<span class=\"mono\">x = NULL</span> er et gyldig uttrykk med typen boolean, så verken grammatikken eller regelsjekken har noe å klage på. Sannhetsverdien NULL oppstår i kjøringen (lysarket om WHERE s. 12–15), og WHERE behandler NULL som «ikke med». <span class=\"mono\">IS NULL</span> er et eget predikat som alltid gir TRUE eller FALSE."
      },
      rettet: S("SELECT navn", "FROM låner", "WHERE sted IS NULL;"),
      sensor: "−1 for != NULL i stedet for IS NOT NULL (H2020 S5)."
    },
    {
      id: "countstjerne", tittel: "count(*) etter LEFT JOIN", nivaa: "eksamen", tema: "Kjøring",
      sql: S("SELECT f.navn, count(*) AS antall",
        "FROM forfatter AS f",
        "  LEFT JOIN bok AS b ON (f.fid = b.fid)",
        "GROUP BY f.fid, f.navn;"),
      fase: "kjoring", utfall: "felle",
      tabell: {
        kolonner: ["f.navn", "count(*)", "count(b.bid)"], uttrykk: null,
        rader: [["Ibsen", 2, 2], ["Undset", 1, 1], ["Woolf", 1, 1], ["Lindgren", 1, 1], ["Ferrante", 1, 0]],
        verdier: null, uthev: 4
      },
      kjede: [["FROM", 6], ["GROUP BY", 5, "grupper"], ["SELECT", 5]],
      svar: { kolonner: ["navn", "antall"], rader: [["Ibsen", 2], ["Undset", 1], ["Woolf", 1], ["Lindgren", 1], ["Ferrante", 1]] },
      hvorfor: {
        eli5: "Ferrante har ingen bøker, men LEFT JOIN gir henne likevel en tom lapp så hun ikke blir glemt. <span class=\"mono\">count(*)</span> teller lapper, og da får hun 1. Teller du bøker i stedet, får hun 0.",
        normal: "Alt er lovlig, så fasene før kjøring er grønne. LEFT JOIN beholder Ferrante med NULL i alle bok-kolonnene. <span class=\"mono\">count(*)</span> teller rader, og den raden finnes. <span class=\"mono\">count(b.bid)</span> hopper over NULL og gir 0, som er det oppgaven nesten alltid vil ha.",
        teknisk: "Aggregatene hopper over NULL, unntatt <span class=\"mono\">count(*)</span>, som teller rader (lysarket om ytre join s. 2). Etter en ytre join er NULL-raden en ekte rad i mellomtabellen. Kurset legger vekt på å telle en kolonne fra den andre tabellen (lysarket om ytre join s. 10)."
      },
      rettet: S("SELECT f.navn, count(b.bid) AS antall", "FROM forfatter AS f", "  LEFT JOIN bok AS b ON (f.fid = b.fid)", "GROUP BY f.fid, f.navn;"),
      sensor: "−1 for count(*) i stedet for count(kolonne) med ytre join (H2019 2.5)."
    },
    {
      id: "notin", tittel: "NOT IN når delspørringen har NULL", nivaa: "dypere", tema: "Kjøring", tillegg: true,
      sql: S("SELECT navn",
        "FROM forfatter",
        "WHERE fid NOT IN (SELECT fid FROM bok);"),
      fase: "kjoring", utfall: "felle",
      tabell: {
        kolonner: ["navn", "fid"], uttrykk: "fid NOT IN (1, 1, 2, 3, 4, NULL)",
        rader: [["Ibsen", 1], ["Undset", 2], ["Woolf", 3], ["Lindgren", 4], ["Ferrante", 5]],
        verdier: [false, false, false, false, null]
      },
      kjede: [["FROM", 5], ["WHERE", 0], ["SELECT", 0]],
      svar: { kolonner: ["navn"], rader: [] },
      hvorfor: {
        eli5: "Du spør «er Ferrante ingen av disse forfatterne?». En av bøkene har ukjent forfatter. Kanskje det er Ferrante? Svaret blir «vet ikke», og da kommer hun ikke med.",
        normal: "Delspørringen gir 1, 1, 2, 3, 4 og NULL, fordi Folkeeventyr ikke har forfatter. For Ferrante betyr <span class=\"mono\">5 NOT IN (…)</span> det samme som <span class=\"mono\">5 != 1 AND … AND 5 != NULL</span>. Det siste leddet er NULL, så hele uttrykket blir NULL, og WHERE dropper raden. Ingen feil, bare et tomt svar. <span class=\"mono\">NOT EXISTS</span> har ikke dette problemet.",
        teknisk: "Dette står ikke i lysarkene, og kursets løsningsforslag bruker NOT IN på kolonner som ikke kan være NULL. Fellen oppstår bare i kjøringen og bare med disse dataene: hadde Folkeeventyr hatt en forfatter, hadde spørringen gitt Ferrante. Derfor kan ingen sjekk før kjøring fange den."
      },
      rettet: S("SELECT navn", "FROM forfatter AS f", "WHERE NOT EXISTS (SELECT * FROM bok AS b WHERE b.fid = f.fid);")
    },
    {
      id: "streng", tittel: "Strengen slutter aldri", nivaa: "dypere", tema: "Les tegnene",
      sql: S("SELECT navn",
        "FROM låner",
        "WHERE sted = 'Oslo;"),
      fase: "tegn", utfall: "feil",
      pg: "ERROR:  unterminated quoted string at or near \"'Oslo;\"",
      norsk: "Strengen ved «'Oslo;» blir aldri avsluttet.",
      hvorfor: {
        eli5: "Fnutten betyr «nå kommer en tekst». Databasen leter etter fnutten som avslutter teksten, men den kommer aldri. Da vet den ikke hvor teksten slutter og resten av spørringen begynner.",
        normal: "Før grammatikken kan sjekkes, må teksten deles i ord. En <span class=\"mono\">'</span> starter en streng, og alt fram til neste <span class=\"mono\">'</span> hører til den, også semikolonet. Her kommer det ingen ny fnutt, så strengen sluker resten av spørringen, og det er umulig å vite hvor den slutter.",
        teknisk: "Dette er den aller første fasen (lexer). Den vet ingenting om SELECT eller tabeller, bare hvilke tegn som hører sammen. I PostgreSQL går denne fasen og grammatikken hånd i hånd, men feilen er av en annen type: den handler om tegnene, ikke om rekkefølgen på klausulene."
      },
      rettet: S("SELECT navn", "FROM låner", "WHERE sted = 'Oslo';")
    }
  ];

  /* Korte merknader til klausulkortene (IN.sqlPanser.kort). Én setning per klausul, egne ord. */
  var KORT = {
    "WITH": "WITH-tabellen regnes ut først, og navnet kan brukes i resten av spørringen.",
    "FROM": "FROM kjøres først. Alle tabellene og join-ene blir én mellomtabell før noe annet skjer.",
    "JOIN": "ON sjekkes for hvert radpar. Bare par der betingelsen er TRUE blir med (NULL er ikke TRUE).",
    "WHERE": "WHERE ser én rad om gangen. Gruppene finnes ikke ennå, så aggregater kan ikke stå her, og SELECT-navn finnes ikke ennå.",
    "GROUP BY": "Fra nå av er hver gruppe én rad. Kolonner som ikke er gruppert, må inn i et aggregat.",
    "HAVING": "HAVING ser én gruppe om gangen, så aggregater er lov. SELECT-navn finnes fortsatt ikke.",
    "SELECT": "SELECT regnes ut nesten sist. Her lages navnene med AS, så de kan brukes i ORDER BY, men ikke tidligere.",
    "DISTINCT": "DISTINCT fjerner like rader etter SELECT. To NULL-er regnes som like her.",
    "ORDER BY": "ORDER BY kommer etter SELECT, så navn fra AS kan brukes. NULL sorteres sist ved stigende rekkefølge.",
    "LIMIT": "LIMIT og OFFSET kutter til slutt. Uten ORDER BY er det tilfeldig hvilke rader du får.",
    "OFFSET": "OFFSET hopper over rader etter sorteringen, rett før LIMIT kutter."
  };

  IN.dataSqlPanser = { scenarier: SC, kort: KORT };
})();
