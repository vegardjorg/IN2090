/* ============================================================
   IN2090 guide · data-begreper.js
   Data for blokk 0 (00-begreper.html): eksempelrelasjonene Rom og Booking, nøkkelreglene,
   flervalg per fane, sant/usant og to dra-øvinger.
   Alt er formulert med egne ord. Rom og Booking er guidens egne eksempler.
   Kildelinjene peker på lysark (F01-01, F02-01, 02-eksempler, F04-01, F07-02) og Waaler 08-notat.
   Feltet «sitat» brukes ikke.
   IN.dataBegreper = { rom, booking, regler, quiz, tf, faner, dra }
   Klassisk script. Lastes etter core.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  function K(ref) { return { ref: ref, egneOrd: true }; }
  function m(s) { return '<span class="mono">' + s + "</span>"; }

  /* ---------- Eksempelrelasjonene ---------- */
  var ROM_ATTR = ["romkode", "bygning", "romnr", "etasje", "plasser"];
  var rom = {
    navn: "Rom",
    kolonner: ROM_ATTR.slice(),
    rader: [
      ["R01", "Ifi", "1101", 1, 40],
      ["R02", "Ifi", "2269", 2, 40],
      ["R03", "Fysikk", "1101", 1, 120],
      ["R04", "Fysikk", "3110", 3, 20],
      ["R05", "Kjemi", "2269", 2, 40]
    ]
  };
  var booking = {
    navn: "Booking",
    kolonner: ["romkode", "dato", "emne"],
    rader: [
      ["R01", "2026-12-01", "IN2090"],
      ["R03", "2026-12-01", "IN2010"],
      ["R07", "2026-12-02", "IN2090"],
      ["R01", "2026-12-02", "IN1000"]
    ]
  };
  /* Reglene (antakelsene) for Rom: kandidatnøklene. Alt annet følger av dem. */
  var regler = {
    attrs: ROM_ATTR,
    kn: [["romkode"], ["bygning", "romnr"]],
    tekst: [
      "Hvert rom har sin egen romkode.",
      "Romnummeret er unikt innenfor én bygning, men samme nummer kan finnes i flere bygninger.",
      "Mange rom kan ligge i samme etasje og ha like mange plasser, også i samme bygning."
    ]
  };

  /* ---------- Flervalg per fane ---------- */
  var quiz = {
    database: [
      { q: "Hva er forskjellen på en database og et DBMS?",
        options: ["Ingen, det er to ord for det samme", "Databasen er dataene, DBMS-et er programmet som lar oss definere, lage, vedlikeholde og styre tilgangen til dem", "DBMS er en database med tabeller, en database har ikke tabeller", "Databasen er programmet, DBMS-et er filene på disken"], answer: 1,
        explain: "En database er bare en samling data. Et databasesystem (DBMS) er programvaren rundt. I dagligtale brukes «database» om begge, men på eksamen lønner det seg å skille.",
        kilde: K("F01-01 lysark 9 (databasesystemer)") },
      { q: "Hva får du med en relasjonsdatabase som du ikke får med et regneark?",
        options: ["Kolonner og rader", "Fast struktur, et spørrespråk, tilgangskontroll og skranker som holder dataene riktige", "At dataene overlever en omstart", "At dataene kan sorteres"], answer: 1,
        explain: "Kolonner, rader og sortering har regnearket også, og filer overlever en omstart. Det databasen gir i tillegg, er blant annet en fast struktur, SQL, programmeringsgrensesnitt, sikkerhet og integritet.",
        kilde: K("F01-01 lysark 3–8 (motivasjon)") }
    ],
    relasjon: [
      { q: "Hvilken av disse er en tuppel i Rom?",
        options: [m("Rom(romkode, bygning, romnr, etasje, plasser)"), m("(R02, Ifi, 2269, 2, 40)"), m("plasser"), m("int")], answer: 1,
        explain: "En tuppel er én rad med én verdi per attributt. Det første alternativet er signaturen, " + m("plasser") + " er et attributt og " + m("int") + " er et domene.",
        kilde: K("F02-01 lysark 5–8") },
      { q: "To relasjoner har samme signatur og de samme tuplene, men radene og kolonnene står i en annen rekkefølge. Er de like?",
        options: ["Ja, fordi både attributtene og tuplene er mengder", "Nei, rekkefølgen på radene er en del av relasjonen", "Bare hvis kolonnene står i samme rekkefølge", "Det kommer an på primærnøkkelen"], answer: 0,
        explain: "En mengde har ingen rekkefølge, og en tuppel er formelt et sett av par (attributt, verdi). Derfor er både rad- og kolonnerekkefølgen uten betydning.",
        kilde: K("F02-01 lysark 5, 8 og 12") }
    ],
    nokler: [
      { q: "Reglene for Rom gir kandidatnøklene {romkode} og {bygning, romnr}. Hva er {romkode, etasje}?",
        options: ["En kandidatnøkkel", "En supernøkkel, men ikke en kandidatnøkkel", "Ikke en supernøkkel", "En fremmednøkkel"], answer: 1,
        explain: "Den inneholder {romkode}, så ingen to rom kan ha like verdier i den. Men etasje kan fjernes uten at den slutter å være en supernøkkel, så den er ikke minimal.",
        kilde: K("02-eksempler lysark 3–4 (finn super- og kandidatnøkler), F07-02 lysark 7 (minimal)") },
      { q: "I instansen av Rom har ingen to rader samme verdier i {bygning, etasje}. Hva kan du konkludere?",
        options: ["{bygning, etasje} er en supernøkkel", "{bygning, etasje} er en kandidatnøkkel", "Ingenting om nøkkelen: dataene kan bare vise at noe ikke er en nøkkel", "Romkode er overflødig"], answer: 2,
        explain: "Nøkler er regler for alle lovlige tilstander. To rom i samme etasje i samme bygning er lov, selv om det tilfeldigvis ikke finnes nå. Instansen kan motbevise en nøkkel, men aldri bevise den.",
        kilde: K("02-eksempler lysark 4 (antakelsene avgjør nøklene)") },
      { q: "Booking har " + m("FN: romkode → Rom(romkode)") + ". Hvilken rad bryter fremmednøkkelen?",
        options: [m("(R01, 2026-12-01, IN2090)"), m("(R03, 2026-12-01, IN2010)"), m("(R07, 2026-12-02, IN2090)"), m("(R01, 2026-12-02, IN1000)")], answer: 2,
        explain: "R07 finnes ikke i Rom. At R01 står to ganger i Booking, er lov: en fremmednøkkel trenger ikke være unik i tabellen den står i.",
        kilde: K("02-eksempler lysark 5 (fremmednøkler mot eksempeldata)") }
    ]
  };

  var faner = { database: "Database og DBMS", relasjon: "Relasjonsmodellen", nokler: "Nøkler" };

  /* ---------- Sant/usant ---------- */
  var tf = [
    { fane: "database", s: "Et DBMS er programvaren som lar oss definere, lage, vedlikeholde og styre tilgangen til en database.", answer: true,
      explain: "Databasen er dataene, DBMS-et er systemet rundt dem.", kilde: K("F01-01 lysark 9") },
    { fane: "database", s: "SQL er deklarativt: du sier hva du vil ha, ikke hvordan det skal hentes.", answer: true,
      explain: "Databasesystemet finner selv ut hvordan svaret regnes ut.", kilde: K("F01-01 lysark 12") },
    { fane: "relasjon", s: "En relasjon i relasjonsmodellen kan inneholde to like tupler.", answer: false,
      explain: "Tuplene utgjør en mengde, og en mengde har ikke duplikater. SQL-tabeller er derimot multimengder.", kilde: K("F02-01 lysark 5") },
    { fane: "relasjon", s: "To attributter i samme relasjon kan ha samme navn hvis de har ulik type.", answer: false,
      explain: "Navnet identifiserer attributtet. Det må være unikt innenfor relasjonen.", kilde: K("F02-01 lysark 7") },
    { fane: "relasjon", s: "NULL markerer at en verdi mangler eller er ukjent.", answer: true,
      explain: "NULL er ikke tallet 0 og ikke en tom tekst.", kilde: K("F02-01 lysark 9") },
    { fane: "relasjon", s: "En signatur består av relasjonens navn og attributtene (med domener), og et relasjonsskjema er en mengde signaturer.", answer: true,
      explain: "Signaturen forteller hva du trenger for å bruke relasjonen. Skjemaet er signaturene for hele databasen.", kilde: K("F02-01 lysark 6") },
    { fane: "nokler", s: "Enhver kandidatnøkkel er en supernøkkel.", answer: true,
      explain: "En kandidatnøkkel er en minimal supernøkkel.", kilde: K("F07-02 lysark 7–8") },
    { fane: "nokler", s: "Hvis X er en supernøkkel, er også enhver mengde som inneholder X en supernøkkel.", answer: true,
      explain: "Er to rader ulike i X, er de også ulike i en større mengde. Derfor er hele relasjonen alltid en supernøkkel.", kilde: K("F07-02 lysark 7–8") },
    { fane: "nokler", s: "En relasjon kan ha flere primærnøkler.", answer: false,
      explain: "Den kan ha flere kandidatnøkler, men vi velger én av dem som primærnøkkel. I SQL får de andre UNIQUE NOT NULL.", kilde: K("F04-01 lysark 8") },
    { fane: "nokler", s: "Et attributt som ikke er med i primærnøkkelen, er et ikke-nøkkelattributt.", answer: false,
      explain: "Nøkkelattributt betyr «med i minst én kandidatnøkkel». bygning og romnr er nøkkelattributter i Rom selv om PN er {romkode}.", kilde: K("Waaler 08-notat lysark 9 (nøkkelattributt)") },
    { fane: "nokler", s: "Verdiene i en fremmednøkkel må finnes i den kolonnen de peker på.", answer: true,
      explain: "Det er hele poenget med en fremmednøkkel. I SQL lages den med REFERENCES. Unntaket er NULL: en fremmednøkkel kan være NULL (om kolonnen ikke er NOT NULL), og da sjekkes den ikke. Det testes ofte i «lovlig eller ulovlig?»-oppgaver (H2019 2.1).", kilde: K("F04-01 lysark 10 (REFERENCES)") },
    { fane: "nokler", s: "I SQL betyr PRIMARY KEY det samme som UNIQUE NOT NULL, og en tabell kan bare ha én.", answer: true,
      explain: "Andre kandidatnøkler skrives med UNIQUE NOT NULL.", kilde: K("F04-01 lysark 8") }
  ];

  /* ---------- Dra-øvinger ---------- */
  var DRA_BEGREP = {
    id: "begreper-match", mode: "match", tittel: "Hva er hva i Rom?",
    intro: "<p>Koble hver bit av Rom-eksempelet til riktig begrep. Hvert begrep brukes én gang.</p>",
    prompt: "<p>Bitene er hentet fra tabellen Rom og skjemaet med Rom og Booking.</p>",
    zones: [
      { id: "relasjon", label: "Relasjon (tabell)" },
      { id: "tuppel", label: "Tuppel (rad)" },
      { id: "attributt", label: "Attributt (kolonne)" },
      { id: "domene", label: "Domene (type)" },
      { id: "signatur", label: "Signatur" },
      { id: "skjema", label: "Relasjonsskjema" }
    ],
    items: [
      { id: "i-tuppel", html: m("(R04, Fysikk, 3110, 3, 20)"), explain: "<p>Én verdi per attributt: en tuppel.</p>" },
      { id: "i-signatur", html: m("Rom(romkode, bygning, romnr, etasje, plasser)"), explain: "<p>Navn og attributter, uten data: signaturen.</p>" },
      { id: "i-domene", html: m("int"), explain: "<p>Typen til et attributt, som " + m("plasser") + ", er domenet.</p>" },
      { id: "i-attributt", html: m("etasje"), explain: "<p>En kolonne med navn og type: et attributt.</p>" },
      { id: "i-skjema", html: "Signaturene til både Rom og Booking", explain: "<p>Et relasjonsskjema er en mengde signaturer.</p>" },
      { id: "i-relasjon", html: "Signaturen til Rom sammen med de fem radene", explain: "<p>En relasjon er en signatur og en mengde tupler.</p>" }
    ],
    answer: { "i-tuppel": "tuppel", "i-signatur": "signatur", "i-domene": "domene", "i-attributt": "attributt", "i-skjema": "skjema", "i-relasjon": "relasjon" },
    kilde: [K("F02-01 lysark 5–8"), K("02-eksempler lysark 2")]
  };

  var DRA_NOKKEL = {
    id: "begreper-sn", mode: "bucket", tittel: "Supernøkkel, kandidatnøkkel eller ingen av delene?",
    intro: "<p>Bruk reglene for Rom: romkode er unik, og romnr er unikt innenfor én bygning. Ikke se på dataene, de kan bare motbevise.</p>",
    prompt: "<p>" + m("Rom(romkode, bygning, romnr, etasje, plasser)") + ". Sorter mengdene.</p>" +
      '<details class="grense"><summary>Hint: kandidatnøklene</summary><p>' + m("{romkode}") + " og " + m("{bygning, romnr}") + ". En mengde er en supernøkkel hvis den inneholder minst én av dem.</p></details>",
    zones: [
      { id: "kn", label: "Kandidatnøkkel", hint: "minimal supernøkkel" },
      { id: "sn", label: "Supernøkkel, ikke KN", hint: "har noe overflødig" },
      { id: "ikke", label: "Ikke supernøkkel" }
    ],
    items: [
      { id: "s1", html: m("{bygning, romnr}"), explain: "<p>Unik etter regel 2, og verken bygning eller romnr er unik alene. KN.</p>" },
      { id: "s2", html: m("{romkode, etasje}"), explain: "<p>Inneholder " + m("{romkode}") + ", men etasje er overflødig. SN, ikke KN.</p>" },
      { id: "s3", html: m("{romnr}"), explain: "<p>1101 finnes både på Ifi og i Fysikk. Ikke SN.</p>" },
      { id: "s4", html: m("{romkode}"), explain: "<p>Unik etter regel 1, og en mengde med ett attributt kan ikke gjøres mindre. KN.</p>" },
      { id: "s5", html: m("{bygning, etasje}"), explain: "<p>Unik i dagens data, men to rom i samme etasje i samme bygning er lov. Ikke SN.</p>" },
      { id: "s6", html: m("{bygning, romnr, plasser}"), explain: "<p>Inneholder " + m("{bygning, romnr}") + ". plasser er overflødig. SN, ikke KN.</p>" },
      { id: "s7", html: m("{romnr, etasje, plasser}"), explain: "<p>Inneholder ingen av KN-ene. Samme romnr, etasje og plasser kan finnes i to bygninger. Ikke SN.</p>" },
      { id: "s8", html: m("{romkode, bygning, romnr}"), explain: "<p>Inneholder begge KN-ene, så den er ikke minimal. SN, ikke KN.</p>" }
    ],
    answer: { s1: "kn", s2: "sn", s3: "ikke", s4: "kn", s5: "ikke", s6: "sn", s7: "ikke", s8: "sn" },
    oppsummering: "<p>KN: " + m("{romkode}") + " og " + m("{bygning, romnr}") + ". Alle mengder som inneholder en av dem, er supernøkler. Nøkkelattributtene er romkode, bygning og romnr.</p>",
    kilde: [K("02-eksempler lysark 3–4 (finn super- og kandidatnøkler)")]
  };

  IN.dataBegreper = { rom: rom, booking: booking, regler: regler, quiz: quiz, tf: tf, faner: faner, dra: [DRA_BEGREP, DRA_NOKKEL] };
})();
