/* ============================================================
   IN2090 guide · data-ordliste.js  (formatet er portert fra IN2120 begreper-data.js 2026-11-26)
   Forkortelser og sentrale begreper (IN.BEGREPER). Kilden for verktøytipsene i løpende
   tekst (begrep-tips.js). Lastes etter symboler.js, før begrep-tips.js.
   (Ikke det samme som data-begreper.js, som er øvingsdataene til blokk 0.)

   Skrivemåten følger kurset (plan/vranglaere.md): KN/PN/FN/SN, «tillukning», «svak nøkkel»,
   «identifiserende entitet», nøkkelattributt = med i minst én KN. Alle tekster er egne ord.

   Felt per oppslag (som i IN2120):
     ord, full (fullform for forkortelser), txt (én til to setninger), forveks (valgfri),
     b (blokk 0–10 der begrepet hører hjemme), mc (mønstre, store/små teller),
     m (mønstre uten forskjell på store/små), ctx/nctx, ikke (sider der det aldri markeres).
   Bare første forekomst per seksjon/kort markeres. Forkortelser (med full) viser fullformen
   også i ubesvarte øvinger; vanlige begreper får tips først når øvingen er rettet.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  /* Norske bøyningsendelser etter en forkortelse: KN-en, FD-er, FD-ene, BCNF-brudd tas ikke med */
  var S = "(?:-(?:en|er|et|ene|ens|erne)|s)?";
  function A() { return Array.prototype.map.call(arguments, function (x) { return x + S; }); }

  var B = {
    /* ---------- 0 · Begreper og relasjonsmodellen ---------- */
    sn: { ord: "SN", full: "supernøkkel", b: 0, mc: A("SN"),
      txt: "En mengde attributter der ingen to rader kan ha like verdier. Alle attributtene i tabellen er alltid en SN." },
    kn: { ord: "KN", full: "kandidatnøkkel", b: 0, mc: A("KN"),
      txt: "En minimal supernøkkel: fjerner du ett attributt, er den ikke lenger en SN. En tabell kan ha flere KN-er." },
    pn: { ord: "PN", full: "primærnøkkel", b: 0, mc: A("PN"),
      txt: "Den ene kandidatnøkkelen vi velger som hovednøkkel. I SQL: PRIMARY KEY, som betyr UNIQUE og NOT NULL." },
    fn: { ord: "FN", full: "fremmednøkkel", b: 0, mc: A("FN"),
      txt: "Attributter som peker på en kandidatnøkkel i en annen (eller samme) tabell. Hver verdi som ikke er NULL, må finnes der den peker." },
    dbms: { ord: "DBMS", full: "database management system", b: 0, mc: A("R?DBMS"),
      txt: "Programmet som lagrer dataene og kjører spørringene, for eksempel PostgreSQL. RDBMS er et relasjonelt DBMS." },
    sql: { ord: "SQL", full: "Structured Query Language", b: 4, mc: ["SQL"],
      txt: "Språket for å lage tabeller og stille spørringer mot en relasjonsdatabase. Kurset bruker PostgreSQL." },
    tuppel: { ord: "tuppel", b: 0, m: ["tuppel(?:et|en|er|ene)?"],
      txt: "Én rad i en relasjon: én verdi for hvert attributt." },
    signatur: { ord: "signatur", b: 0, m: ["signatur(?:en|er|ene)?"],
      txt: "Navnet på relasjonen med attributtene, for eksempel Student(snr, navn). Union, snitt og differanse krever lik signatur." },
    nokkelattr: { ord: "nøkkelattributt", b: 6, m: ["(?:ikke-)?nøkkelattributt(?:et|er|ene)?"],
      forveks: "Betyr ikke «er med i PN» eller «er med i alle KN-er»: det holder å være med i én.",
      txt: "Et attributt som er med i minst én kandidatnøkkel. Andre attributter er ikke-nøkkelattributter." },
    multimengde: { ord: "multimengde", b: 4, m: ["multimengde(?:n|r|ne)?"],
      txt: "En samling der det samme kan forekomme flere ganger. SQL-tabeller og svar er multimengder, mens RA bruker mengder." },

    /* ---------- 1 · ER ---------- */
    er: { ord: "ER", full: "entity-relationship (entitet–relasjon)", b: 1, mc: A("ER"),
      txt: "Modell med entitetstyper (rektangler), relasjonstyper (romber) og attributter (ovaler). Kurset bruker Chen-notasjon." },
    eer: { ord: "EER", full: "enhanced entity-relationship (utvidet ER)", b: 2, mc: A("EER"),
      txt: "ER utvidet med subklasser: inklusjon, disjunkthet og totalitet." },
    svakentitet: { ord: "svak entitet", b: 1, m: ["svake? entitet(?:en|er|ene)?", "svake entitetstyper?"],
      txt: "En entitet som ikke har en nøkkel alene. Den identifiseres av den identifiserende entiteten sammen med sin svake nøkkel (stiplet understrek)." },
    kardinalitet: { ord: "kardinalitet", b: 1, m: ["kardinalitet(?:en|er|ene)?"],
      txt: "Øvre skranke på en deltakelse: 1 eller mange (N/M). Tallet ved E sier hvor mange E den andre siden kan relateres til." },
    deltakelse: { ord: "deltakelse", b: 1, m: ["(?:total|partiell) deltakelse"],
      txt: "Nedre skranke: enkel strek er partiell (minst 0), dobbel strek er total (minst 1)." },

    /* ---------- 3 · Relasjonsalgebra ---------- */
    ra: { ord: "RA", full: "relasjonsalgebra", b: 3, mc: A("RA"),
      txt: "Operatorer som tar relasjoner inn og gir en relasjon ut: π, σ, ρ, ×, ⋈, ∪, ∩ og ∖." },

    /* ---------- 4–5 · SQL ---------- */
    ddl: { ord: "DDL", full: "Data Definition Language", b: 4, mc: ["DDL"],
      txt: "Den delen av SQL som lager og endrer tabeller: CREATE, ALTER og DROP." },
    skranke: { ord: "skranke", b: 4, m: ["skranke(?:n|r|ne)?"],
      txt: "En regel databasen håndhever, for eksempel PRIMARY KEY, UNIQUE, NOT NULL, REFERENCES og CHECK." },
    korrelert: { ord: "korrelert delspørring", b: 5, m: ["korrelert(?:e)? delspørring(?:en|er|ene)?"],
      txt: "En delspørring som bruker en kolonne fra den ytre spørringen, og derfor regnes ut på nytt for hver ytre rad." },

    /* ---------- 6–7 · FD og normalisering ---------- */
    fd: { ord: "FD", full: "funksjonell avhengighet", b: 6, mc: A("FD"),
      txt: "X → Y betyr at to rader med like X-verdier alltid har like Y-verdier. En instans kan motbevise en FD, men aldri bevise den." },
    tillukning: { ord: "tillukning", b: 6, m: ["tillukning(?:en|er|ene)?"],
      txt: "X⁺: alle attributtene X bestemmer via FD-ene. X er en supernøkkel når X⁺ er hele tabellen." },
    triviell: { ord: "triviell FD", b: 6, m: ["(?:ikke-)?trivielle? FD(?:-(?:en|er|ene))?"],
      txt: "En FD X → Y der Y ⊆ X. Den holder alltid og teller ikke når du sjekker normalform." },
    nf1: { ord: "1NF", full: "første normalform", b: 7, mc: A("1NF"),
      txt: "Alle verdier er atomære. Kurset antar at det alltid holder." },
    nf2: { ord: "2NF", full: "andre normalform", b: 7, mc: A("2NF"),
      txt: "Ingen ikke-nøkkelattributt avhenger av en ekte del av en kandidatnøkkel (ingen partiell avhengighet)." },
    nf3: { ord: "3NF", full: "tredje normalform", b: 7, mc: A("3NF"),
      txt: "For hver ikke-triviell X → A: X er en supernøkkel, eller A er et nøkkelattributt." },
    bcnf: { ord: "BCNF", full: "Boyce–Codd normalform", b: 7, mc: A("BCNF"),
      txt: "For hver ikke-triviell X → A er X en supernøkkel. Strengest av normalformene i kurset." },
    tapsfri: { ord: "tapsfri dekomposisjon", b: 7, m: ["tapsfri(?:e|tt)?(?: dekomposisjon(?:en|er|ene)?)?"],
      txt: "Når du joiner delene igjen, får du nøyaktig den opprinnelige tabellen, ingen falske rader." },
    fagin: { ord: "Fagins teorem", b: 7, m: ["Fagins teorem"],
      txt: "R(X, Y, Z) delt i S₁(X, Y) og S₂(X, Z) er tapsfri hvis X → Y eller X → Z: fellesattributtene bestemmer en av delene." },

    /* ---------- 8 · Views, transaksjoner og programmering ---------- */
    acid: { ord: "ACID", full: "atomicity, consistency, isolation, durability", b: 8, mc: ["ACID"],
      txt: "Garantiene for en transaksjon: alt eller ingenting, gyldig tilstand før og etter, ingen innblanding fra andre, og varig etter COMMIT." },
    transaksjon: { ord: "transaksjon", b: 8, m: ["transaksjon(?:en|er|ene)?"],
      txt: "En gruppe SQL-setninger som utføres som én enhet: BEGIN … COMMIT, eller ROLLBACK for å angre alt." },
    matview: { ord: "materialisert view", b: 8, m: ["materialisert(?:e)? view(?:et|s|ene)?"],
      txt: "Et view der svaret er lagret. Det er raskt å lese, men må oppdateres med REFRESH når tabellene endres." },
    jdbc: { ord: "JDBC", full: "Java Database Connectivity", b: 8, mc: A("JDBC"),
      txt: "Javas API for å koble til en database og kjøre SQL, med Connection, PreparedStatement og ResultSet." },
    json: { ord: "JSON", full: "JavaScript Object Notation", b: 8, mc: A("JSON"),
      txt: "Tekstformat for strukturerte data med objekter og lister. PostgreSQL har egne typer for det (json og jsonb)." },
    api: { ord: "API", full: "application programming interface", b: 8, mc: A("API"),
      txt: "Grensesnittet et program bruker for å snakke med et annet, her biblioteket som snakker med databasen." },

    /* ---------- 9 · Sikkerhet ---------- */
    sqlinj: { ord: "SQL-injection", b: 9, m: ["SQL[- ]injection(?:s|en)?"],
      txt: "Angrep der brukerinput blir tolket som en del av SQL-koden. Forsvaret er parametriserte spørringer (prepared statements), ikke å lime sammen strenger." },
    cia: { ord: "CIA", full: "confidentiality, integrity, availability", b: 9, mc: ["CIA"],
      txt: "De tre sikkerhetsmålene: bare de som har lov får lese, data er korrekte, og tjenesten er tilgjengelig." },

    /* ---------- 10 · Indekser ---------- */
    btre: { ord: "B-tre", b: 10, m: ["B\\+?-tre(?:et|er|ne)?"],
      txt: "Balansert søketre med mange barn per node. Gir rask oppslag på både likhet og intervall (<, >, BETWEEN)." }
  };

  var BLOKK = {
    0: ["00-begreper.html", "begreper", "Begreper"],
    1: ["01-er.html", "er", "ER-modellering"],
    2: ["02-realisering.html", "realisering", "Realisering"],
    3: ["03-relasjonsalgebra.html", "relasjonsalgebra", "Relasjonsalgebra"],
    4: ["04-sql.html", "sql", "SQL"],
    5: ["05-sql-videre.html", "sql-videre", "SQL videregående"],
    6: ["06-fd.html", "fd", "FD"],
    7: ["07-normalisering.html", "normalisering", "Normalisering"],
    8: ["08-sql-programmering.html", "sql-programmering", "Views og programmering"],
    9: ["09-sikkerhet.html", "sikkerhet", "Sikkerhet"],
    10: ["10-indekser.html", "indekser", "Indekser"]
  };

  function get(id) { return B[id] || null; }
  function tittel(e) { return e ? e.ord + (e.full ? " · " + e.full : "") : ""; }
  function se(e) {
    var b = e && BLOKK[e.b];
    return b ? "Se blokk " + e.b + " · " + b[2] : "";
  }

  IN.BEGREPER = { list: B, BLOKK: BLOKK, get: get, tittel: tittel, se: se };
})();
