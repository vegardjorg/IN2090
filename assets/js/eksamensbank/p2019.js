/* IN2090 · eksamensbank P2019 (PRØVEEKSAMEN, ikke ordinær eksamen).
   Kilde: UiO, IN2090 «Prøveeksamen 2019» (proveeskamen.pdf) + løsningsforslag til samme sett (losning.pdf,
   samme tittel og samme oppgavetekst med løsninger lagt inn).
   Det finnes ingen sensorveiledning for prøveeksamen, så `sensor` er utelatt overalt.
   Oppgavetekst ordrett. Løsningsforslaget er ALLTID parafrasert: våre svar (svar/hvorfor/losning/tips) og
   all SQL er skrevet med egne ord. Feil i løsningsforslaget er markert i svarets `etter` («Merk om løsningsforslaget»).
   Telles ikke med i vektingen i plan/eksamensmonster.md (bare i kolonnen «med prøver»). */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var BANK = (window.IN_EXAM_BANK = window.IN_EXAM_BANK || {});
  IN.PERFEKT = IN.PERFEKT || {};

  function kilde(nr) { return "Oppgavetekst: UiO, IN2090, prøveeksamen 2019, oppgave " + nr; }
  var LF_MERK = "<p><b>Merk om løsningsforslaget:</b> ";

  /* ---------- Databaseskjemaet for oppgave 3–9 ---------- */
  var SKJEMA = {
    tittel: "Produkter, ingredienser og maskiner (oppgave 3–9)",
    intro: "<p>I disse oppgavene skal vi bruke følgende databaseskjema som beskriver spiselige produkter og hva som kreves for å lage " +
      "produktene (primærnøklene er understreket):</p>" +
      "<p>produkt(<u>produktID</u>, navn, tid)<br>ingrediens(<u>ingrediensID</u>, navn, pris)<br>maskin(<u>maskinID</u>, navn, plassering)<br>" +
      "ingrediens_for(<u>ingrediensID, produktID</u>, antall)<br>brukes_i(<u>maskinID, produktID</u>)</p>" +
      "<p>med følgende fremmednøkler:</p>" +
      "<p>ingrediens_for(ingrediensID) refererer til ingrediens(ingrediensID)<br>ingrediens_for(produktID) refererer til produkt(produktID)<br>" +
      "brukes_i(maskinID) refererer til maskin(maskinID)<br>brukes_i(produktID) refererer til produkt(produktID)</p>" +
      "<p>Et produkt består av en unik produktID og et navn gitt ved en streng, og et heltall større enn 0 som angir antall sekunder prosessen " +
      "for å lage produktet tar; en ingrediens består av en unik ingrediensID, et navn gitt ved en streng, og en pris per stykk gitt ved en " +
      "positiv float; maskin har en unik ID gitt ved maskinID, et navn gitt ved en streng, samt en unik plassering (gitt ved en kode som i " +
      "databasen representeres som en streng med maksslengde 7) i fabrikken; for å lage et produkt brukes en mengde ingredienser, og disse er " +
      "beskrevet i relasjonen ingrediens_for, merk at en ingrediens kan bli brukt flere ganger i samme produkt beskrevet av attributten antall " +
      "(hvor det er snakk om et antall i henhold til en passende oppmåling, f.eks. kan det for vann være snakk om milliliter, for mel kan det " +
      "være gram, mens for gjær kan det være pakker); i tillegg til ingredienser kreves ulike maskiner for å lage et produkt, og hvilket maskin " +
      "som kreves av hvilket produkt er beskrevet i relasjonen brukes_i.</p>" +
      "<p>For eksempel kan en database over skjema over se slik ut:</p>",
    tabeller: [
      { navn: "produkt", beskrivelse: "",
        kolonner: [
          { navn: "produktID", type: "int", pk: true },
          { navn: "navn", type: "text" },
          { navn: "tid", type: "int" }
        ],
        eksempel: { kolonner: ["produktID", "navn", "tid"], rader: [[0, "Ris", 480], [1, "Brød", 10800], [2, "Knekk", 600], [3, "Marsipan", 1200]] } },
      { navn: "ingrediens", beskrivelse: "",
        kolonner: [
          { navn: "ingrediensID", type: "int", pk: true },
          { navn: "navn", type: "text" },
          { navn: "pris", type: "float" }
        ],
        eksempel: { kolonner: ["ingrediensID", "navn", "pris"],
          rader: [[0, "Riskorn", 5.5], [1, "Vann", 1.0], [2, "Mandel", 9.9], [3, "Sukker", 3.0], [4, "Mel", 1.9], [5, "Gjær", 1.2], [6, "Salt", 1.8]] } },
      { navn: "maskin", beskrivelse: "",
        kolonner: [
          { navn: "maskinID", type: "int", pk: true },
          { navn: "navn", type: "text" },
          { navn: "plassering", type: "varchar(7)" }
        ],
        unike: [["plassering"]],
        eksempel: { kolonner: ["maskinID", "navn", "plassering"],
          rader: [[0, "Kjele", "L-324-N"], [1, "Panne", "L-110-S"], [2, "Elter", "L-956-S"], [3, "Saltkvern", "L-998-V"], [4, "Kaffekvern", "L-778-Ø"], [5, "Ovn", "L-324-S"]] } },
      { navn: "ingrediens_for", beskrivelse: "",
        kolonner: [
          { navn: "ingrediensID", type: "int", pk: true, fk: "ingrediens(ingrediensID)" },
          { navn: "produktID", type: "int", pk: true, fk: "produkt(produktID)" },
          { navn: "antall", type: "int" }
        ],
        eksempel: { kolonner: ["ingrediensID", "produktID", "antall"],
          rader: [[0, 0, 8], [1, 1, 10], [1, 0, 8], [2, 3, 15], [3, 2, 20], [3, 3, 15], [4, 1, 10], [5, 1, 1], [6, 1, 2], [6, 0, 1]] } },
      { navn: "brukes_i", beskrivelse: "",
        kolonner: [
          { navn: "maskinID", type: "int", pk: true, fk: "maskin(maskinID)" },
          { navn: "produktID", type: "int", pk: true, fk: "produkt(produktID)" }
        ],
        eksempel: { kolonner: ["maskinID", "produktID"], rader: [[0, 0], [1, 2], [2, 1], [2, 3], [3, 1], [5, 1]] } }
    ],
    merknad: "Arket oppgir ikke datatyper i skjemalisten. Typene her er våre antakelser ut fra beskrivelsen (heltall for tid, float for pris, " +
      "streng med maks 7 tegn for plassering). Ingrediensnavnene i eksempeldataene har stor forbokstav ('Salt'), mens oppgave 6 skriver 'salt'. " +
      "Det finnes ingen 'Havsalt' i eksempeldataene (oppgave 7). «maksslengde» står slik på arket."
  };

  /* ---------- ER-diagrammet i oppgave 2 (fra arket) ---------- */
  var ER_2 = {
    entiteter: [
      { id: "BYGG", navn: "BYGG", svak: false, pos: [0, 1],
        attr: [{ navn: "ByggNr", nokkel: true }, { navn: "Navn" },
               { navn: "Adresse", deler: [{ navn: "Nummer" }, { navn: "Gate" }, { navn: "Postnummer" }] }] },
      { id: "ROM", navn: "ROM", svak: true, pos: [2, 1],
        attr: [{ navn: "RomNr", delvisNokkel: true }, { navn: "Etasje", avledet: true }, { navn: "Utstyr", flerverdi: true }] },
      { id: "AKTIVITET", navn: "Aktivitet", svak: false, pos: [2, 3],
        attr: [{ navn: "Navn", nokkel: true }, { navn: "Tidspunkt" }] }
    ],
    relasjoner: [
      { id: "INNEHOLDER", navn: "INNEHOLDER", identifiserende: true, pos: [1, 0],
        ledd: [{ entitet: "BYGG", kard: "1", total: false }, { entitet: "ROM", kard: "N", total: true }], attr: [] },
      { id: "RESEPSJON", navn: "RESEPSJON", identifiserende: false, pos: [1, 2],
        ledd: [{ entitet: "BYGG", kard: "1", total: false }, { entitet: "ROM", kard: "1", total: false }],
        attr: [{ navn: "Åpningstid" }] },
      { id: "STED", navn: "STED", identifiserende: false, pos: [2, 2],
        ledd: [{ entitet: "ROM", kard: "M", total: false }, { entitet: "AKTIVITET", kard: "N", total: true }], attr: [] }
    ],
    merknad: "Tegnet etter ER-diagrammet på arket. ROM er svak med RomNr som svak nøkkel, Etasje er utledbar og Utstyr er flerverdi."
  };

  /* ---------- Vårt ER-svar på oppgave 1 (Chen-notasjon) ---------- */
  var ER_1_SVAR = {
    entiteter: [
      { id: "LAND", navn: "LAND", svak: false, pos: [1, 1],
        attr: [{ navn: "Navn", nokkel: true }, { navn: "Språk", flerverdi: true }, { navn: "Valuta" }, { navn: "Innbyggertall", avledet: true }] },
      { id: "REGION", navn: "REGION", svak: false, pos: [3, 1], attr: [{ navn: "Navn", nokkel: true }] },
      { id: "BY", navn: "BY", svak: true, pos: [5, 1],
        attr: [{ navn: "Navn", delvisNokkel: true }, { navn: "Innbyggertall" },
               { navn: "Ordfører", deler: [{ navn: "Partinavn" }, { navn: "Personnavn" }] }] },
      { id: "AVTALE", navn: "AVTALE", svak: false, pos: [0, 3],
        attr: [{ navn: "AvtaleID", nokkel: true }, { navn: "Klausul", flerverdi: true }] },
      { id: "ORGANISASJON", navn: "ORGANISASJON", svak: false, pos: [1, 4], attr: [{ navn: "Navn", nokkel: true }] }
    ],
    relasjoner: [
      { id: "NABO", navn: "NABO", identifiserende: false, pos: [0, 1],
        ledd: [{ entitet: "LAND", kard: "N", total: false, rolle: "land" }, { entitet: "LAND", kard: "M", total: false, rolle: "nabo" }],
        attr: [{ navn: "Grenselengde" }] },
      { id: "TILHØRER", navn: "TILHØRER", identifiserende: false, pos: [2, 1],
        ledd: [{ entitet: "LAND", kard: "1", total: true }, { entitet: "REGION", kard: "N", total: true }], attr: [] },
      { id: "INNEHOLDER", navn: "INNEHOLDER", identifiserende: true, pos: [4, 1],
        ledd: [{ entitet: "REGION", kard: "1", total: true }, { entitet: "BY", kard: "N", total: true }], attr: [] },
      { id: "HOVEDSTAD", navn: "HOVEDSTAD", identifiserende: false, pos: [3, 2],
        ledd: [{ entitet: "LAND", kard: "1", total: true }, { entitet: "BY", kard: "1", total: false }], attr: [] },
      { id: "MEDLEM", navn: "MEDLEM", identifiserende: false, pos: [1, 3],
        ledd: [{ entitet: "LAND", kard: "N", total: false }, { entitet: "AVTALE", kard: "1", total: false },
               { entitet: "ORGANISASJON", kard: "1", total: true }], attr: [] }
    ],
    merknad: "Tallet ved en entitet sier hvor mange av den entiteten den andre siden (eller de to andre sidene i MEDLEM) kan knyttes til. " +
      "BY er svak med REGION som identifiserende entitet. Innbyggertall på LAND er utledbart (stiplet oval)."
  };

  BANK["P2019"] = {
    year: "P2019",
    prove: true,
    navn: "Prøveeksamen 2019",
    hjelpemidler: "Ikke oppgitt på arket",
    merknad: "Prøveeksamen (øvingssett), ikke en ordinær eksamen. Arket har ingen dato eller varighet. Det finnes ingen sensorveiledning, " +
      "bare et løsningsforslag, som her er gjengitt med egne ord. Poengene er arkets, men settet telles ikke med i vektingen av eksamensmønsteret.",
    deler: [{ navn: "Modellering", poeng: 30 }, { navn: "SQL", poeng: 50 }, { navn: "Relasjonsmodellen", poeng: 20 }],
    skjema: SKJEMA,
    er: { "2": ER_2 },
    oppgaver: [
      /* ===================== Modellering ===================== */
      {
        key: "P2019-1", year: "P2019", oppgave_nr: "Oppgave 1", kilde: kilde(1), ark: "Modellering", title: "Land, regioner og byer",
        points: 20, block: "er", tema: ["svak entitet", "ternær relasjon", "rekursiv relasjon", "flerverdiattributt", "utledbart attributt", "sammensatt attributt", "1:1", "total deltakelse"], ordrett: true,
        oppgave: "<p>I denne oppgaven skal vi lage en ER-modell som beskriver land, regioner og byer. Tegn tydelig. Modellen skal inneholde følgende informasjon:</p><ol>" +
          "<li>Et land har et unikt navn, en mengde offisielle språk, og en valuta. I tillegg har land et innbygertall som kan utledes fra dens byers inbygertall (se under).</li>" +
          "<li>En region har et unikt navn.</li>" +
          "<li>En region er inneholdt i nøyaktig ett land, og en by tilhører nøyaktig én region. Et land må inneholde minst én region, men kan inneholde mange. " +
          "En region må ha minst en tilhørende by, men kan ha mange.</li>" +
          "<li>En by har et navn som kun er unikt innad i regionen den tilhører. For å unikt kunne identifisere en by må vi vite både dens navn og regionen den tilhører sitt navn.</li>" +
          "<li>Hvert land har nøyaktig én by som hovedstad. En by kan kun være hovedstad for ett land.</li>" +
          "<li>En by har i tillegg til sitt navn (nevt over), et innbyggertall og en ordfører bestående av et partinavn og personnavn (f.eks. er ordføreren i Oslo (\"SV\", \"Marianne Borgen\")).</li>" +
          "<li>Et land kan ha mange andre land som naboland og et land kan være nabo til mange land. Når to land er naboer er det tilknyttet en grenselengde " +
          "(altså lengden på grensen mellom de to landene) til dette naboskapet. F.eks. kan vi si at Norge er nabo med Sverige med en grenselengde på 1630km.</li>" +
          "<li>Et land kan være medlem i en organisasjon under en avtale (hint: Bruk en ternær relasjon). En organisasjon er unikt identifisert av et navn " +
          "(f.eks. \"EU\" eller \"NATO\"). En avtale er unikt identifisert av en avtale-ID og har i tellegg en mengde klausuler. Et land kan, med en bestemt avtale, " +
          "kun være med i en organisasjon; et land kan kun ha én avtale med en bestemt organisasjon; men en organisasjon kan ha mange medlemsland med samme avtale. " +
          "I tillegg må en organisasjon ha minst ett medlemsland med en avtale.</li></ol>",
        avvik: "Prøveeksamen: ingen sensorveiledning, bare et løsningsforslag (en figur), som ikke er gjengitt. Skrivefeilene «innbygertall», «inbygertall», «nevt» og «tellegg» står slik på arket.",
        losning: [
          "Finn entitetene: LAND, REGION, BY, AVTALE og ORGANISASJON. Språk og klausuler er bare mengder av verdier og blir flerverdiattributter.",
          "Innbyggertallet til et land kan regnes ut fra byene og blir et utledbart attributt (stiplet oval).",
          "Byens navn er bare unikt innenfor regionen. Det gjør BY til en svak entitet med Navn som svak nøkkel og REGION som identifiserende entitet. Region har et unikt navn, så den kan identifisere byen.",
          "TILHØRER (LAND–REGION) er 1:N med total deltakelse på begge sider: hver region ligger i nøyaktig ett land, og hvert land har minst én region.",
          "Den identifiserende relasjonen mellom REGION og BY har 1 ved REGION og total deltakelse for BY (alltid for en svak entitet), og også for REGION, siden en region må ha minst én by.",
          "HOVEDSTAD er 1:1. LAND har total deltakelse (nøyaktig én hovedstad), mens de fleste byer ikke er hovedstad.",
          "NABO er en rekursiv M:N-relasjon på LAND med attributtet Grenselengde.",
          "MEDLEM er ternær. Les én kombinasjon om gangen: land + avtale gir høyst én organisasjon (1 ved ORGANISASJON), land + organisasjon gir høyst én avtale (1 ved AVTALE), og organisasjon + avtale kan ha mange land (N ved LAND). ORGANISASJON har total deltakelse."
        ],
        tips: [
          "«Kun unikt innad i …» og «må vite både dens navn og …» er signalordene for svak entitet. Tegn dobbelt rektangel, dobbel rombe og stiplet understrek.",
          "Ternær kardinalitet: hold to sider fast og spør hvor mange av den tredje. Skriv resonnementet som kommentar.",
          "«Nøyaktig én» er total deltakelse pluss 1, «minst én» er total deltakelse.",
          "Ordfører består av to deler og blir et sammensatt attributt, ikke en egen entitet."
        ],
        del1: null
      },
      {
        key: "P2019-2", year: "P2019", oppgave_nr: "Oppgave 2", kilde: kilde(2), ark: "Realisering", title: "Bygg, rom og aktiviteter til relasjoner",
        points: 10, block: "realisering", tema: ["realisering", "svak entitet", "1:1", "M:N", "flerverdiattributt", "sammensatt attributt", "utledbart attributt"], ordrett: true,
        oppgave: "<p>Realiser følgende ER-diagram til et databaseskjema:</p>" +
          "<p>Bruk <u>understreking</u> for å markere kandidatnøkler, og bruk i tillegg <b>fet skrift</b> for den valgte primærnøkkelen. " +
          "List i tillegg opp alle fremmednøkler på formen T(A) → P(B) (her er attributt(ene) A i T en fremmednøkkel som refererer til attributt(ene) B i P). " +
          "Skriv også opp eventuelle valg du tar underveis.</p>",
        avvik: "På arket står ER-diagrammet mellom første og andre setning. Her er det tegnet på nytt under oppgaveteksten. " +
          "I ren tekst bruker vi kursets format (KN, PN og FN på egne linjer) i stedet for understreking og fet skrift.",
        losning: [
          "Vanlige entiteter: BYGG (sammensatt Adresse blir Nummer, Gate og Postnummer) og Aktivitet.",
          "Svak entitet: ROM får PN = ByggNr fra den identifiserende entiteten + den svake nøkkelen RomNr, og ByggNr blir FN til Bygg. INNEHOLDER er dermed realisert og skal ikke få en egen tabell.",
          "Etasje er utledbar og tas ikke med. Utstyr er flerverdi og får en egen tabell der alle attributtene er nøkkel.",
          "RESEPSJON er 1:1 uten total deltakelse. Vi legger FN-en i Bygg (de fleste bygg har trolig en resepsjon, mens nesten ingen rom er resepsjon), og Åpningstid følger med. FN-en må bestå av begge attributtene i ROMs nøkkel.",
          "STED er M:N og blir en egen tabell med FN-ene til Rom og Aktivitet som PN."
        ],
        tips: [
          "Skriv én setning per valg, særlig for 1:1-relasjonen: hvilken side og hvorfor.",
          "En FN til en svak entitet må ta med hele den sammensatte nøkkelen (ByggNr og RomNr).",
          "FN-en for en 1:1 med partiell deltakelse er unik, men kan være NULL, og er derfor ikke en kandidatnøkkel.",
          "Dropp utledbare attributter, og lag aldri en egen tabell for den identifiserende relasjonen."
        ],
        del1: null
      },

      /* ===================== SQL ===================== */
      {
        key: "P2019-3", year: "P2019", oppgave_nr: "Oppgave 3", kilde: kilde(3), ark: "SQL", title: "CREATE TABLE med alle skrankene",
        points: 10, block: "sql", tema: ["CREATE TABLE", "PRIMARY KEY", "REFERENCES", "UNIQUE", "CHECK", "skranker"], ordrett: true,
        oppgave: "<p>Skriv et SQL-script som oppretter skjemaet beskrevet over. Alle skrankene beskrevet i teksten over skal med i skjemaet.</p>",
        avvik: null,
        losning: [
          "Les beskrivelsen og finn hver skranke: unik ID (PRIMARY KEY), tid større enn 0 (CHECK), positiv pris (CHECK), unik plassering på høyst 7 tegn (varchar(7) UNIQUE).",
          "Koblingstabellene får sammensatt PRIMARY KEY (understreket i skjemaet) og REFERENCES for hver fremmednøkkel.",
          "Opprett tabellene som blir referert til (produkt, ingrediens, maskin) før koblingstabellene.",
          "En CHECK slipper gjennom NULL. Vil du sikre at hvert produkt faktisk har en tid og en pris, må du også skrive NOT NULL. Vi tar det med, fordi teksten sier at et produkt «består av» disse verdiene."
        ],
        tips: [
          "Rekkefølgen betyr noe: REFERENCES til en tabell som ikke finnes ennå, gir feil.",
          "«Unik» om en ikke-nøkkelkolonne betyr UNIQUE. «Unik ID» betyr PRIMARY KEY.",
          "Sjekk stavingen av kolonnenavn som fremmednøkler peker på. En skrivefeil i én tabell får REFERENCES i en annen til å feile."
        ],
        del1: null
      },
      {
        key: "P2019-4", year: "P2019", oppgave_nr: "Oppgave 4", kilde: kilde(4), ark: "SQL", title: "Produkter med tid under 60 eller over 120 sekunder",
        points: 5, block: "sql", tema: ["WHERE", "OR", "sammenligning"], ordrett: true,
        oppgave: "<p>Skriv en spørring som finner alle produkter som lages av en prosess som enten bruker mindre enn 60 eller mer enn 120 sekunder. " +
          "Skriv opp navnet på produktet og tiden.</p>",
        avvik: null,
        losning: [
          "Bare tabellen produkt trengs.",
          "«Mindre enn 60» er tid &lt; 60 og «mer enn 120» er tid &gt; 120. Grensene selv skal ikke med.",
          "Koble de to betingelsene med OR, siden én av dem holder.",
          "På eksempeldataene er alle tidene over 120, så alle fire produktene kommer med."
        ],
        tips: [
          "Les grensene nøye: «mindre enn» er &lt;, ikke &lt;=.",
          "AND i stedet for OR gir alltid tomt svar her, for ingen tid kan være både under 60 og over 120."
        ],
        del1: null
      },
      {
        key: "P2019-5", year: "P2019", oppgave_nr: "Oppgave 5", kilde: kilde(5), ark: "SQL", title: "Produkter med ingrediens, men uten maskin",
        points: 5, block: "sql-videre", tema: ["delspørring", "NOT EXISTS", "EXISTS", "EXCEPT", "NOT IN"], ordrett: true,
        oppgave: "<p>Skriv en spørring som finner navnet på alle produkter som har minst én inngrediens, men som ikke trenger noen maskiner.</p>",
        avvik: "«inngrediens» står slik på arket.",
        losning: [
          "To krav: det finnes en rad i ingrediens_for for produktet, og det finnes ingen rad i brukes_i.",
          "«Minst én» løses med EXISTS (eller en join), «ingen» med NOT EXISTS (eller NOT IN / EXCEPT).",
          "Alternativ: ta produktID-ene i ingrediens_for EXCEPT produktID-ene i brukes_i, og slå opp navnene med IN.",
          "På eksempeldataene bruker alle fire produktene minst én maskin, så svaret er tomt."
        ],
        tips: [
          "«Ikke noen» er et «for alle»-krav. En vanlig join mot brukes_i med en ulikhet finner bare produkter med en annen maskin, ikke produkter uten maskin.",
          "Bruker du en join mot ingrediens_for for «minst én», får du én rad per ingrediens. Husk DISTINCT.",
          "NOT IN gir tomt svar hvis delspørringen inneholder NULL (tilleggsfelle, står ikke i kursmaterialet). Her er produktID del av PN i brukes_i og kan ikke være NULL."
        ],
        del1: null
      },
      {
        key: "P2019-6", year: "P2019", oppgave_nr: "Oppgave 6", kilde: kilde(6), ark: "SQL", title: "Antall produkter med salt og en kvern",
        points: 5, block: "sql-videre", tema: ["count", "DISTINCT", "INNER JOIN", "LIKE"], ordrett: true,
        oppgave: "<p>Skriv en spørring som finner antallet produkter som inneholder ingrediensen med navnet ’salt’ og krever en maskin med ’kvern’ som del av navnet.</p>",
        avvik: null,
        losning: [
          "Kjeden ingrediens → ingrediens_for → produkt → brukes_i → maskin må joines.",
          "Filtrer på ingrediensnavnet og på maskinnavn LIKE '%kvern%'.",
          "Tell produktene med count(DISTINCT …). Et produkt med salt og to kverner gir to rader etter joinen og skal bare telles én gang.",
          "På eksempeldataene heter ingrediensen 'Salt' med stor S, så 'salt' gir 0. Med 'Salt' blir svaret 1 (Brød, som bruker Saltkvern)."
        ],
        tips: [
          "count(*) etter en join teller rader, ikke produkter. Spør deg selv om samme produkt kan dukke opp flere ganger.",
          "Strengsammenligning skiller mellom store og små bokstaver. Bruk verdien slik oppgaven skriver den, og skriv gjerne en kommentar om forskjellen fra eksempeldataene.",
          "Sjekk tabellnavnene mot skjemaet: tabellen heter produkt, ikke produkter."
        ],
        del1: null
      },
      {
        key: "P2019-7", year: "P2019", oppgave_nr: "Oppgave 7", kilde: kilde(7), ark: "SQL", title: "INSERT med ID-er slått opp med SELECT",
        points: 5, block: "sql", tema: ["INSERT", "INSERT … SELECT", "delspørring"], ordrett: true,
        oppgave: "<p>Skriv en SQL-kommando som setter inn et nytt tuppel (m, p) i brukes_i slik at m er maskinIDen til maskinen med navn ’Saltkvern’ " +
          "og p er produktet med navn ’Havsalt’.</p>",
        avvik: null,
        losning: [
          "Vi kjenner bare navnene, så ID-ene må slås opp i maskin og produkt.",
          "INSERT INTO … SELECT setter inn alle radene spørringen gir. Her gir den én rad: ID-en til Saltkvern sammen med ID-en til Havsalt.",
          "Alternativ: INSERT … VALUES med to skalare delspørringer, én for hver ID. Den feiler hvis et navn ikke finnes (NULL i primærnøkkelen) eller finnes flere ganger.",
          "På eksempeldataene finnes ikke Havsalt, så INSERT … SELECT setter inn 0 rader."
        ],
        tips: [
          "Skriv kolonnelisten i INSERT INTO brukes_i (maskinID, produktID). Da er det tydelig hvilken verdi som havner hvor.",
          "Ikke hardkod ID-en (3) til Saltkvern. Kommandoen skal virke på alle data."
        ],
        del1: null
      },
      {
        key: "P2019-8", year: "P2019", oppgave_nr: "Oppgave 8", kilde: kilde(8), ark: "SQL", title: "VIEW materialkostnad",
        points: 10, block: "sql-videre", tema: ["VIEW", "GROUP BY", "sum", "count", "ORDER BY"], ordrett: true,
        oppgave: "<p>Materialkostnaden til et produkt antar vi er lik prisen til alle ingrediensene som inngår i produktet. Skriv en SQL-kommando som lager " +
          "et view som inneholder materialkostnaden til hvert produkt. Viewet skal inneholde produktIDen, navnet, materialkostnaden for hvert produkt, " +
          "samt antall ingredienser som inngår i produktet. Gi viewet navnet materialkostnad og kolonnene henholdsvis produktID, navn, kostnad og antall. " +
          "Sorter viewet på materialkostnad fra dyrest til billigst.</p>",
        avvik: null,
        losning: [
          "Prisen er per stykk, og ingrediens_for sier hvor mange stykk (antall) produktet bruker. Kostnaden for én ingrediens i ett produkt er derfor pris × antall.",
          "Join produkt, ingrediens_for og ingrediens, grupper per produkt og summer pris × antall.",
          "«Antall ingredienser» tolker vi som hvor mange ulike ingredienser produktet har, altså antall rader i ingrediens_for. PN-en (ingrediensID, produktID) gjør at hver ingrediens står én gang per produkt.",
          "Kolonnenavnene gis i parentes etter viewnavnet. Sorter med ORDER BY … DESC.",
          "På eksempeldataene: Marsipan 193,5 (2), Knekk 60 (1), Ris 53,8 (3) og Brød 33,8 (4)."
        ],
        tips: [
          "Glemmer du å gange med antall, får du bare summen av stykkprisene. Skriv tolkningen din som kommentar.",
          "PostgreSQL tillater ORDER BY i et view, men en spørring mot viewet kan sortere på nytt. Sorteringen gjelder når du leser hele viewet.",
          "Produkter uten ingredienser faller bort med INNER JOIN. Oppgave 9 sier at alle produkter har minst én ingrediens, så det er greit her."
        ],
        del1: null
      },
      {
        key: "P2019-9", year: "P2019", oppgave_nr: "Oppgave 9", kilde: kilde(9), ark: "SQL", title: "De 5 dyreste produktene å produsere",
        points: 10, block: "sql-videre", tema: ["WITH", "GROUP BY", "count", "ORDER BY", "LIMIT", "VIEW"], ordrett: true,
        oppgave: "<p>Total kostnad for å produsere hvert produkt er materialkostnaden pluss 100 kroner per maskin som kreves i produksjonen av produktet " +
          "pluss 10 kroner per sekund det tar å lage produktet (fra tid-kolonnen i produkt). Skriv en spørring som finner produktIDen på de 5 dyreste " +
          "produktene å produsere. Skriv ut produktID, navn og total kostnad per produkt. Du kan bruke viewet mateialkostnad(produktID, navn, kostnad, antall) " +
          "som ble laget i forrige oppgave. Du kan anta at alle produkter bruker minst én maskin og har minst én ingrediens.</p>" +
          "<p>Hint: Det kan være lurt å finne kostnaden for maskinene og kostnaden for tiden i hver sin delspørring først, og så til slutt plusse alt dette " +
          "sammen med materialkostnaden.</p>",
        avvik: "«mateialkostnad» står slik på arket. Viewet heter materialkostnad.",
        losning: [
          "Steg 1: maskinkostnaden per produkt er 100 × antall rader i brukes_i, gruppert per produktID.",
          "Steg 2: tidskostnaden er 10 × tid fra produkt.",
          "Steg 3: join viewet materialkostnad med de to delresultatene på produktID og legg sammen de tre kostnadene.",
          "Sorter på totalen med DESC og ta de fem første med LIMIT 5.",
          "På eksempeldataene: Brød 108 333,8, Marsipan 12 293,5, Knekk 6160 og Ris 4953,8. Det finnes bare fire produkter."
        ],
        tips: [
          "Viewet har allerede navn, så du trenger ikke produkt for navnet, bare for tiden.",
          "Gi summen et eget navn (f.eks. total_kostnad). Da blir ORDER BY entydig, selv om flere kolonner i FROM heter kostnad.",
          "Uten forutsetningen om minst én maskin måtte maskinkostnaden ha vært hentet med LEFT JOIN, ellers forsvinner produkter uten maskin."
        ],
        del1: null
      },

      /* ===================== Relasjonsmodellen ===================== */
      {
        key: "P2019-10", year: "P2019", oppgave_nr: "Oppgave 10", kilde: kilde(10), ark: "Relasjonsmodellen", title: "Kandidatnøkler i P(A, B, C, D, E, F, G)",
        points: 5, block: "fd", tema: ["kandidatnøkkel", "tillukning", "FD"], ordrett: true,
        oppgave: "<p>Gitt følgende relasjon:</p><p>P(A, B, C, D, E, F, G)</p><p>og følgende FDer:</p>" +
          "<p>C → A, E<br>A, B → D<br>B → C<br>G → B</p>" +
          "<p>Hvilke kandidatnøkler har P? Vis hvordan du kommer frem til svaret.</p>",
        avvik: null,
        losning: [
          "Attributter som aldri står på en høyreside, må være med i alle kandidatnøkler: F (står ikke i noen FD) og G.",
          "Attributter som bare står på høyresider, er med i ingen kandidatnøkkel: D og E.",
          "Regn {F, G}⁺: G → B gir B, B → C gir C, C → A, E gir A og E, og A, B → D gir D. Altså hele P.",
          "Hver kandidatnøkkel må inneholde F og G. Siden {F, G} allerede er en supernøkkel, er enhver annen supernøkkel en utvidelse av den og ikke minimal. Eneste kandidatnøkkel er {F, G}."
        ],
        tips: [
          "Start alltid med «aldri på høyresiden»-gruppen og regn tillukningen av den. Er den hele relasjonen, er du ferdig.",
          "Glem ikke attributter som ikke står i noen FD i det hele tatt (her F). De er med i alle nøkler.",
          "Vis tillukningen steg for steg med FD-en du bruker. Det er forklaringen oppgaven ber om."
        ],
        del1: null
      },
      {
        key: "P2019-11", year: "P2019", oppgave_nr: "Oppgave 11", kilde: kilde(11), ark: "Relasjonsmodellen", title: "Normalformen til R(A, B, C, D)",
        points: 5, block: "normalisering", tema: ["normalform", "2NF", "kandidatnøkkel", "nøkkelattributt"], ordrett: true,
        oppgave: "<p>Gitt følgende relasjon:</p><p>R(A, B, C, D)</p><p>og FDene:</p><p>A → B<br>B → C</p>" +
          "<p>Hva er normalformen til R? Forklar hvordan du kommer frem til svaret.</p>",
        avvik: null,
        losning: [
          "Finn nøklene: A og D står aldri på en høyreside, C bare på en høyreside. {A, D}⁺ = {A, D, B, C}, så {A, D} er eneste kandidatnøkkel.",
          "Nøkkelattributter er A og D. B og C er ikke-nøkkelattributter.",
          "A → B: A er ikke supernøkkel (bryter BCNF), B er ikke nøkkelattributt (bryter 3NF), og A er en ekte del av kandidatnøkkelen (bryter 2NF). Denne FD-en gir 1NF.",
          "B → C: B er ikke supernøkkel og C er ikke nøkkelattributt, men B er ikke del av noen kandidatnøkkel. Denne gir 2NF.",
          "Den laveste normalformen avgjør: R er på 1NF."
        ],
        tips: [
          "Uten nøklene kan du ikke avgjøre normalformen. Finn dem først og skriv dem opp.",
          "Gå gjennom de tre spørsmålene i fast rekkefølge for hver FD: supernøkkel? nøkkelattributt på høyresiden? venstresiden en ekte del av en KN?",
          "D står ikke i noen FD, men må likevel med i nøkkelen. Det er derfor A alene ikke er nøkkel."
        ],
        del1: null
      },
      {
        key: "P2019-12", year: "P2019", oppgave_nr: "Oppgave 12", kilde: kilde(12), ark: "Relasjonsmodellen", title: "Dekomponer T(A, B, C, D) tapsfritt til BCNF",
        points: 10, block: "normalisering", tema: ["BCNF", "tapsfri dekomposisjon", "tillukning", "kandidatnøkkel"], ordrett: true,
        oppgave: "<p>Gitt relasjonen:</p><p>T(A, B, C, D)</p><p>med følgende FDer:</p><p>A → B<br>B → C<br>C → D</p>" +
          "<p>Dekomponer relasjonen T tapsfritt til BCNF ved å bruke algoritmen for tapsfri dekomposisjon.</p>",
        avvik: null,
        losning: [
          "Nøkler: A står aldri på en høyreside, og {A}⁺ = {A, B, C, D}. Eneste kandidatnøkkel er {A}.",
          "A → B bryter ikke BCNF. B → C gjør det, fordi B ikke er supernøkkel.",
          "{B}⁺ = {B, C, D}. Del T i S₁(B, C, D) og S₂(A, B).",
          "S₂(A, B): nøkkel {A}, FD A → B. På BCNF.",
          "S₁(B, C, D): nøkkel {B}, FD-er B → C og C → D. C → D bryter BCNF. {C}⁺ = {C, D}, så S₁ deles i S₁₁(C, D) og S₁₂(B, C).",
          "S₁₁(C, D): nøkkel {C}, FD C → D. S₁₂(B, C): nøkkel {B}, FD B → C. Begge er på BCNF.",
          "Resultat: S₂(A, B), S₁₁(C, D) og S₁₂(B, C). Hvert steg er tapsfritt etter Fagins teorem."
        ],
        tips: [
          "Oppgi nøkler og FD-er for hver ny tabell. Det er der poengene ligger i dekomposisjonsoppgaver.",
          "Starter du med C → D i stedet, får du de samme tre tabellene, bare i en annen rekkefølge.",
          "Den ene delen er alltid Y⁺, den andre er Y pluss resten. Da er tapsfriheten sikret."
        ],
        del1: null
      }
    ]
  };

  /* =====================================================================
     Perfekte svar (egne ord; ingen sensorveiledning finnes)
     ===================================================================== */

  IN.PERFEKT["P2019-1"] = {
    type: "skjonn",
    svar: [{
      del: "1",
      tekst: "<ul>" +
        "<li><b>LAND</b>: nøkkel <u>Navn</u>, flerverdiattributtet Språk (dobbel oval), Valuta og det utledbare attributtet Innbyggertall (stiplet oval).</li>" +
        "<li><b>REGION</b>: nøkkel <u>Navn</u>.</li>" +
        "<li><b>BY</b> er svak (dobbelt rektangel) med svak nøkkel Navn (stiplet understrek), Innbyggertall og det sammensatte attributtet Ordfører (Partinavn, Personnavn).</li>" +
        "<li><b>TILHØRER</b> (LAND 1, REGION N), total deltakelse for begge.</li>" +
        "<li><b>INNEHOLDER</b> er identifiserende (dobbel rombe) mellom REGION (1) og BY (N), total deltakelse for begge.</li>" +
        "<li><b>HOVEDSTAD</b> (1:1), total deltakelse for LAND, partiell for BY.</li>" +
        "<li><b>NABO</b> er rekursiv M:N på LAND med attributtet Grenselengde.</li>" +
        "<li><b>MEDLEM</b> er ternær: N ved LAND, 1 ved AVTALE og 1 ved ORGANISASJON. ORGANISASJON har total deltakelse. AVTALE har nøkkel <u>AvtaleID</u> og flerverdiattributtet Klausul.</li></ul>" +
        "<p>Kommentar på arket: «En by identifiseres av navnet sammen med regionens navn, derfor er BY svak med REGION som identifiserende entitet.»</p>",
      er: ER_1_SVAR,
      etter: LF_MERK + "Figuren i løsningsforslaget har samme struktur som vårt svar (svak BY under REGION, HOVEDSTAD 1:1 og ternær MEDLEM med N ved LAND). " +
        "Arket har ingen poengfordeling, så poengene under er vårt eget forslag.</p>",
      poeng: ["LAND med nøkkel, flerverdi- og utledbart attributt", "BY som svak entitet med identifiserende relasjon og sammensatt Ordfører", "TILHØRER og HOVEDSTAD med kardinalitet og deltakelse", "NABO med Grenselengde", "ternær MEDLEM med riktige kardinaliteter og total deltakelse"]
    }],
    hvorfor: {
      eli5: "<p>Tenk på et kart: land er delt i regioner, og regioner er delt i byer. «Storgata by» betyr ingenting før du sier hvilken region den ligger i, så byen henger fast i regionen sin. Medlemskap er et møte mellom tre ting på én gang: landet, organisasjonen og avtalen.</p>",
      normal: "<p>Når et navn bare er unikt innenfor noe annet, blir entiteten svak, og det andre blir identifiserende entitet. «Minst én» og «nøyaktig én» oversettes til total deltakelse, og «høyst én» til kardinalitet 1. Naboskap er en relasjon fra LAND til LAND med en egen verdi, grenselengden. Medlemskapet trenger en ternær relasjon fordi landet, organisasjonen og avtalen hører sammen i ett faktum.</p>",
      teknisk: "<p>I en ternær relasjon leses kardinaliteten ved én entitet ved å holde de to andre fast. Land + avtale gir én organisasjon og land + organisasjon gir én avtale, så det står 1 ved både ORGANISASJON og AVTALE. Organisasjon + avtale kan ha mange land, og derfor står N ved LAND. Den svake entiteten BY har alltid total deltakelse og 1 ved den identifiserende entiteten. Kravet om at en region må ha minst én by, gir i tillegg total deltakelse for REGION. HOVEDSTAD er 1:1 begge veier, men bare LAND har total deltakelse. Innbyggertallet til et land kan regnes ut fra byene og lagres derfor ikke som et vanlig attributt.</p>"
    }
  };

  IN.PERFEKT["P2019-2"] = {
    type: "eksamen",
    svar: [{
      del: "2",
      tekst: "<p>Realisering etter algoritmen (entiteter, svake entiteter, 1:1, M:N, flerverdiattributter):</p>",
      skjema: "Bygg(ByggNr, Navn, Nummer, Gate, Postnummer, Resepsjon_byggnr, Resepsjon_romnr, Åpningstid)\n" +
        "  KN/PN: {ByggNr}\n  FN: Bygg(Resepsjon_byggnr, Resepsjon_romnr) -> Rom(ByggNr, RomNr)\n\n" +
        "Rom(ByggNr, RomNr)\n  KN/PN: {ByggNr, RomNr}\n  FN: Rom(ByggNr) -> Bygg(ByggNr)\n\n" +
        "Aktivitet(Navn, Tidspunkt)\n  KN/PN: {Navn}\n\n" +
        "Sted(Aktivitet, ByggNr, RomNr)\n  KN/PN: {Aktivitet, ByggNr, RomNr}\n  FN: Sted(Aktivitet) -> Aktivitet(Navn)\n  FN: Sted(ByggNr, RomNr) -> Rom(ByggNr, RomNr)\n\n" +
        "Utstyr(ByggNr, RomNr, Utstyr)\n  KN/PN: {ByggNr, RomNr, Utstyr}\n  FN: Utstyr(ByggNr, RomNr) -> Rom(ByggNr, RomNr)",
      etter: "<p><b>Valg:</b></p><ul>" +
        "<li>Adresse er sammensatt, så bare bladene Nummer, Gate og Postnummer tas med.</li>" +
        "<li>ROM er svak: PN er ByggNr fra den identifiserende entiteten pluss RomNr. INNEHOLDER er dermed uttrykt gjennom FN-en og realiseres ikke på nytt.</li>" +
        "<li>Etasje er utledbar og tas ikke med.</li>" +
        "<li>RESEPSJON (1:1, partiell på begge sider): ingen sammensmelting. FN-en legges i Bygg, fordi de fleste bygg har en resepsjon, mens nesten ingen rom er en resepsjon. Det gir færre NULL. Åpningstid følger med. FN-paret er unikt, men kan være NULL og er derfor ikke en kandidatnøkkel.</li>" +
        "<li>Diagrammet sier ikke at resepsjonen må ligge i samme bygg, så FN-en tar med både Resepsjon_byggnr og Resepsjon_romnr. Antar man at den alltid ligger i samme bygg, er Resepsjon_byggnr lik ByggNr og kan fjernes i etterkant.</li>" +
        "<li>STED (M:N) blir en egen tabell. Total deltakelse for Aktivitet kan ikke håndheves med fremmednøkler alene.</li>" +
        "<li>Flerverdiattributtet Utstyr blir en egen tabell med alle attributtene som nøkkel.</li></ul>" +
        LF_MERK + "Løsningsforslaget kaller Postnummer for postnr og attributtene for resepsjonen rBygg, rRom og rÅpningstid. Det gjør samme valg for RESEPSJON som oss.</p>",
      poeng: ["Bygg og Aktivitet med nøkler og attributter", "Rom med sammensatt PN og FN", "RESEPSJON med begrunnelse og sammensatt FN", "Sted (M:N)", "Utstyr (flerverdi)"]
    }],
    hvorfor: {
      eli5: "<p>Vi gjør tegningen om til tabeller etter en fast oppskrift. Et rom har bare nummer innenfor bygget, så romtabellen får byggets nummer i tillegg. Resepsjonen er en lapp på bygget som peker på ett av rommene. Aktiviteter og rom er «mange til mange» og trenger sin egen koblingstabell.</p>",
      normal: "<p>Vanlige entiteter blir tabeller med nøklene sine, og den svake entiteten arver nøkkelen til den identifiserende entiteten. 1:1 løses med en fremmednøkkel på siden som gir færrest NULL, mens M:N og flerverdiattributter alltid blir egne tabeller. Utledbare attributter lagres ikke.</p>",
      teknisk: "<p>Rom har den sammensatte PN-en {ByggNr, RomNr}, og derfor må alle fremmednøkler til Rom bestå av to attributter. For RESEPSJON er ingen av sidene total, så sammensmelting ville gitt NULL-rader. Vi velger Bygg-siden fordi nesten alle bygg har en resepsjon. Fremmednøkkelen blir unik på grunn av 1:1, men kan være NULL og er derfor ikke en kandidatnøkkel. I Sted er PN unionen av de to fremmednøklene, fordi ett rom kan ha mange aktiviteter og én aktivitet kan være i mange rom.</p>"
    }
  };

  IN.PERFEKT["P2019-3"] = {
    type: "eksamen",
    svar: [{
      del: "3",
      sql: "CREATE TABLE produkt (\n  produktID int PRIMARY KEY,\n  navn text NOT NULL,\n  tid int NOT NULL CHECK (tid > 0)\n);\n\n" +
        "CREATE TABLE ingrediens (\n  ingrediensID int PRIMARY KEY,\n  navn text NOT NULL,\n  pris float NOT NULL CHECK (pris > 0)\n);\n\n" +
        "CREATE TABLE maskin (\n  maskinID int PRIMARY KEY,\n  navn text NOT NULL,\n  plassering varchar(7) UNIQUE\n);\n\n" +
        "CREATE TABLE ingrediens_for (\n  ingrediensID int REFERENCES ingrediens (ingrediensID),\n  produktID int REFERENCES produkt (produktID),\n  antall int,\n  PRIMARY KEY (ingrediensID, produktID)\n);\n\n" +
        "CREATE TABLE brukes_i (\n  maskinID int REFERENCES maskin (maskinID),\n  produktID int REFERENCES produkt (produktID),\n  PRIMARY KEY (maskinID, produktID)\n);",
      tekst: "<p>Skrankene fra teksten: PRIMARY KEY for hver unike ID og for de understrekede kolonnene i koblingstabellene, CHECK for tid &gt; 0 og pris &gt; 0, " +
        "varchar(7) UNIQUE for plassering og REFERENCES for de fire fremmednøklene. NOT NULL på navn, tid og pris er et eget valg (teksten sier at et produkt «består av» dem), " +
        "og det stopper NULL, som en CHECK ellers slipper gjennom.</p>",
      etter: LF_MERK + "Løsningsforslaget skriver kolonnen «ingrdiensID» i ingrediens. Da finnes ingen ingrediens(ingrediensID), og REFERENCES i ingrediens_for feiler. " +
        "Løsningsforslaget har ikke NOT NULL.</p>",
      poeng: ["primærnøkler (også sammensatte)", "fremmednøkler med REFERENCES", "CHECK på tid og pris", "varchar(7) UNIQUE på plassering", "riktig rekkefølge på tabellene"]
    }],
    hvorfor: {
      eli5: "<p>Vi bygger fem skuffer og skriver reglene på hver: ingen like ID-er, tiden må være over null, prisen må være positiv, og to maskiner kan ikke stå på samme plass. Koblingsskuffene får bare inneholde ID-er som finnes i de andre skuffene.</p>",
      normal: "<p>Hver setning i beskrivelsen blir en skranke. «Unik ID» blir PRIMARY KEY, «større enn 0» og «positiv» blir CHECK, «unik plassering» blir UNIQUE og «maks lengde 7» blir varchar(7). Koblingstabellene får sammensatt primærnøkkel og to fremmednøkler.</p>",
      teknisk: "<p>PRIMARY KEY betyr UNIQUE og NOT NULL. En CHECK forkaster bare rader der betingelsen er usann, og sammenligning med NULL gir NULL (ukjent), så NULL slipper gjennom. Derfor trengs NOT NULL hvis verdien alltid skal finnes. UNIQUE på plassering tillater flere NULL, men aldri to like koder. Den sammensatte PN-en i ingrediens_for sier at hver ingrediens står én gang per produkt, med mengden i antall. Tabeller som blir referert til, må opprettes først.</p>"
    }
  };

  IN.PERFEKT["P2019-4"] = {
    type: "eksamen",
    svar: [{
      del: "4",
      sql: "SELECT navn, tid\nFROM produkt\nWHERE tid < 60\n   OR tid > 120;",
      tabell: { kolonner: ["navn", "tid"], rader: [["Ris", 480], ["Brød", 10800], ["Knekk", 600], ["Marsipan", 1200]] },
      tekst: "<p>Resultatet på eksempeldataene (alle tidene er over 120):</p>",
      etter: LF_MERK + "Løsningsforslaget bruker tid &lt;= 60 OR tid &gt;= 120. Det tar med produkter på nøyaktig 60 og 120 sekunder, som oppgaven utelukker («mindre enn» og «mer enn»). " +
        "Det gir samme svar på eksempeldataene, men ikke generelt.</p>",
      poeng: ["riktige kolonner", "strenge ulikheter &lt; og &gt;", "OR mellom betingelsene"]
    }],
    hvorfor: {
      eli5: "<p>Vi går gjennom produktlisten og tar med dem som er raske (under ett minutt) eller trege (over to minutter). Det holder å være det ene.</p>",
      normal: "<p>«Enten … eller» betyr at én av betingelsene må holde, og det er OR. «Mindre enn» og «mer enn» er strenge ulikheter, så 60 og 120 selv skal ikke med.</p>",
      teknisk: "<p>WHERE beholder rader der betingelsen er sann. Med OR holder det at ett ledd er sant. Det samme kan skrives NOT (tid BETWEEN 60 AND 120), fordi BETWEEN tar med begge grensene. Skriver man &lt;= og &gt;=, kommer grenseverdiene feilaktig med.</p>"
    }
  };

  IN.PERFEKT["P2019-5"] = {
    type: "eksamen",
    svar: [{
      del: "5",
      sql: "SELECT p.navn\nFROM produkt AS p\nWHERE EXISTS (\n    SELECT 1\n    FROM ingrediens_for AS inf\n    WHERE inf.produktID = p.produktID\n  )\n  AND NOT EXISTS (\n    SELECT 1\n    FROM brukes_i AS b\n    WHERE b.produktID = p.produktID\n  );",
      tekst: "<p>På eksempeldataene bruker alle produktene minst én maskin, så resultatet er tomt.</p>",
      etter: "<p>En likeverdig løsning med mengdeoperator:</p>",
      poeng: ["krav om minst én ingrediens", "krav om ingen maskin (NOT EXISTS, NOT IN eller EXCEPT)", "riktig kolonne, ingen duplikater"]
    }, {
      del: "5 (alternativ)",
      sql: "SELECT navn\nFROM produkt\nWHERE produktID IN (\n  SELECT produktID FROM ingrediens_for\n  EXCEPT\n  SELECT produktID FROM brukes_i\n);"
    }],
    hvorfor: {
      eli5: "<p>Vi sjekker hvert produkt: står det på ingredienslisten? Og står det ikke på maskinlisten? Bare produkter som svarer ja og så nei, kommer med.</p>",
      normal: "<p>EXISTS spør om det finnes minst én rad, og NOT EXISTS om det ikke finnes noen. Begge delspørringene ser på produktet vi står på. Med EXCEPT tar vi produktene med ingredienser og trekker fra produktene med maskiner.</p>",
      teknisk: "<p>Delspørringene er korrelerte: de bruker p.produktID fra den ytre raden. Fordi vi bare tester om rader finnes, blir hvert produkt med høyst én gang, uten DISTINCT. «Ingen maskin» er et krav om fravær og kan ikke løses med en vanlig join. En join mot brukes_i gir bare produkter som har en maskin. NOT EXISTS er trygt også om kolonner kan være NULL, mens NOT IN gir tomt svar hvis delspørringen inneholder NULL (tilleggsfelle, står ikke i kursmaterialet).</p>"
    }
  };

  IN.PERFEKT["P2019-6"] = {
    type: "eksamen",
    svar: [{
      del: "6",
      sql: "SELECT count(DISTINCT p.produktID) AS antall\nFROM produkt AS p\n  INNER JOIN ingrediens_for AS inf ON (inf.produktID = p.produktID)\n  INNER JOIN ingrediens AS i ON (i.ingrediensID = inf.ingrediensID)\n  INNER JOIN brukes_i AS b ON (b.produktID = p.produktID)\n  INNER JOIN maskin AS m ON (m.maskinID = b.maskinID)\nWHERE i.navn = 'salt'\n  AND m.navn LIKE '%kvern%';",
      tekst: "<p>Med 'salt' slik oppgaven skriver det, gir eksempeldataene 0, fordi ingrediensen der heter 'Salt'. Med 'Salt' blir svaret 1: Brød har salt og bruker Saltkvern. " +
        "Ris har også salt, men bruker bare Kjele.</p>",
      etter: LF_MERK + "Løsningsforslaget joiner fra tabellen «produkter», som ikke finnes (den heter produkt), og teller med count(*). " +
        "count(*) teller rader etter joinen, så et produkt med salt og to kverner (Saltkvern og Kaffekvern) ville blitt telt to ganger. Oppgaven spør om antall produkter, så count(DISTINCT …) er riktig.</p>",
      poeng: ["join av alle fem tabellene", "filter på ingrediensnavn og LIKE '%kvern%'", "count(DISTINCT produktID)"]
    }],
    hvorfor: {
      eli5: "<p>Vi følger trådene fra hvert produkt til ingrediensene og til maskinene. Står det salt på den ene lista og en kvern på den andre, setter vi et kryss ved produktet, men bare ett kryss per produkt, uansett hvor mange kverner det bruker.</p>",
      normal: "<p>Joinen gir én rad per kombinasjon av ingrediens og maskin for hvert produkt. WHERE beholder kombinasjonene med salt og en kvern. count(DISTINCT p.produktID) teller hvert produkt én gang.</p>",
      teknisk: "<p>Etter joinen kan samme produkt stå på flere rader. Hvis det bruker to kverner, blir det to rader med salt. count(*) teller rader og blir for høyt, mens count(DISTINCT …) teller ulike verdier. LIKE '%kvern%' finner delstrengen hvor som helst i navnet. Både LIKE og = skiller mellom store og små bokstaver, så 'salt' treffer ikke 'Salt'.</p>"
    }
  };

  IN.PERFEKT["P2019-7"] = {
    type: "eksamen",
    svar: [{
      del: "7",
      sql: "INSERT INTO brukes_i (maskinID, produktID)\nSELECT m.maskinID, p.produktID\nFROM maskin AS m\n  CROSS JOIN produkt AS p\nWHERE m.navn = 'Saltkvern'\n  AND p.navn = 'Havsalt';",
      tekst: "<p>SELECT-en gir én rad med de to ID-ene, og INSERT setter den inn. Eksempeldataene har ikke Havsalt, så der settes 0 rader inn.</p>",
      etter: "<p>Variant med VALUES og to skalare delspørringer. Den feiler hvis et av navnene mangler eller finnes flere ganger:</p>",
      poeng: ["INSERT INTO brukes_i", "ID-ene slås opp med navn (ikke hardkodet)", "riktig rekkefølge på kolonnene"]
    }, {
      del: "7 (variant)",
      sql: "INSERT INTO brukes_i (maskinID, produktID)\nVALUES (\n  (SELECT maskinID FROM maskin WHERE navn = 'Saltkvern'),\n  (SELECT produktID FROM produkt WHERE navn = 'Havsalt')\n);"
    }],
    hvorfor: {
      eli5: "<p>Vi vet navnene, men tabellen vil ha numrene. Derfor slår vi opp nummeret til Saltkvern og nummeret til Havsalt og legger paret inn i lista.</p>",
      normal: "<p>INSERT kan ta radene fra en SELECT i stedet for faste verdier. SELECT-en kombinerer maskinen og produktet med de riktige navnene og gir paret av ID-er.</p>",
      teknisk: "<p>CROSS JOIN lager alle par av maskiner og produkter, og WHERE beholder paret med riktige navn. Finnes ett av navnene ikke, blir resultatet tomt, og INSERT setter inn 0 rader i stedet for å feile. Med VALUES og skalare delspørringer gir et manglende navn NULL, og primærnøkkelen stopper raden. Gir en delspørring flere rader, feiler kommandoen.</p>"
    }
  };

  IN.PERFEKT["P2019-8"] = {
    type: "eksamen",
    svar: [{
      del: "8",
      sql: "CREATE VIEW materialkostnad (produktID, navn, kostnad, antall) AS\nSELECT p.produktID, p.navn,\n       sum(inf.antall * i.pris),\n       count(inf.ingrediensID)\nFROM produkt AS p\n  INNER JOIN ingrediens_for AS inf ON (inf.produktID = p.produktID)\n  INNER JOIN ingrediens AS i ON (i.ingrediensID = inf.ingrediensID)\nGROUP BY p.produktID, p.navn\nORDER BY sum(inf.antall * i.pris) DESC;",
      tabell: { kolonner: ["produktid", "navn", "kostnad", "antall"],
        rader: [[3, "Marsipan", 193.5, 2], [2, "Knekk", 60, 1], [0, "Ris", 53.8, 3], [1, "Brød", 33.8, 4]] },
      tekst: "<p>Innholdet i viewet på eksempeldataene (Ris: 8 × 5,5 + 8 × 1,0 + 1 × 1,8 = 53,8):</p>",
      poeng: ["CREATE VIEW med riktige navn på view og kolonner", "join av de tre tabellene", "sum(pris × antall) og count per produkt med GROUP BY", "ORDER BY … DESC"]
    }],
    hvorfor: {
      eli5: "<p>For hvert produkt går vi gjennom oppskriften: så mange stykk av hver ingrediens, ganger stykkprisen. Vi legger sammen alt og teller hvor mange ulike ingredienser oppskriften har. Det dyreste produktet står øverst.</p>",
      normal: "<p>Joinen gir én rad per ingrediens i hvert produkt. GROUP BY samler radene per produkt, sum gir kostnaden og count antall ingredienser. Kolonnenavnene står i parentes etter viewnavnet, og ORDER BY … DESC sorterer fra dyrest til billigst.</p>",
      teknisk: "<p>Prisen er per stykk og antall er mengden, så kostnaden for én rad er antall × pris, og summen per gruppe er materialkostnaden. count(inf.ingrediensID) teller rader i gruppen. Primærnøkkelen (ingrediensID, produktID) sier at det er det samme som antall ulike ingredienser. Vi grupperer på produktID og tar med navn i GROUP BY, slik at navn kan stå i SELECT. Kolonnelisten etter viewnavnet navngir kolonnene utad. Inne i SELECT har summen ikke noe alias, så vi gjentar uttrykket i ORDER BY (alternativt kan summen få AS kostnad).</p>"
    }
  };

  IN.PERFEKT["P2019-9"] = {
    type: "eksamen",
    svar: [{
      del: "9",
      sql: "WITH\n  maskiner AS (\n    SELECT produktID, 100 * count(*) AS mkost\n    FROM brukes_i\n    GROUP BY produktID\n  ),\n  tidsbruk AS (\n    SELECT produktID, 10 * tid AS tkost\n    FROM produkt\n  )\n" +
        "SELECT mk.produktID, mk.navn, mk.kostnad + ma.mkost + t.tkost AS total_kostnad\nFROM materialkostnad AS mk\n  INNER JOIN maskiner AS ma ON (ma.produktID = mk.produktID)\n  INNER JOIN tidsbruk AS t ON (t.produktID = mk.produktID)\nORDER BY total_kostnad DESC\nLIMIT 5;",
      tabell: { kolonner: ["produktid", "navn", "total_kostnad"],
        rader: [[1, "Brød", 108333.8], [3, "Marsipan", 12293.5], [2, "Knekk", 6160], [0, "Ris", 4953.8]] },
      tekst: "<p>Resultatet på eksempeldataene (Brød: 33,8 + 3 × 100 + 10 800 × 10 = 108 333,8). Det finnes bare fire produkter.</p>",
      poeng: ["maskinkostnad per produkt med GROUP BY", "tidskostnad 10 × tid", "join med viewet og sum av de tre", "ORDER BY … DESC LIMIT 5"]
    }],
    hvorfor: {
      eli5: "<p>Prisen for å lage noe er tre regninger lagt sammen: ingrediensene, leien for maskinene og tiden. Vi regner ut hver regning for seg, legger dem sammen per produkt og viser de fem største.</p>",
      normal: "<p>Hver kostnad regnes i sitt eget WITH-steg: maskinene telles per produkt og ganges med 100, og tiden ganges med 10. Så joines alt på produktID med viewet fra oppgave 8, kostnadene legges sammen, og vi sorterer synkende og tar fem.</p>",
      teknisk: "<p>Maskinkostnaden er et aggregat per produkt og må regnes før joinen med viewet. Ellers ville joinen mot brukes_i gitt flere rader per produkt, og materialkostnaden ville blitt lagt til flere ganger. INNER JOIN er greit fordi oppgaven lover at alle produkter har minst én maskin og én ingrediens. Totalen får et eget navn, så ORDER BY peker entydig på den. LIMIT 5 kutter etter sorteringen.</p>"
    }
  };

  IN.PERFEKT["P2019-10"] = {
    type: "eksamen",
    svar: [{
      del: "10",
      tekst: "<p><b>Steg 1.</b> F står ikke i noen FD og G står aldri på en høyreside. Begge må være med i alle kandidatnøkler. D og E står bare på høyresider og er med i ingen.</p>" +
        "<p><b>Steg 2.</b> {F, G}⁺: start med F, G. G → B gir B. B → C gir C. C → A, E gir A og E. A, B → D gir D. {F, G}⁺ = {A, B, C, D, E, F, G}.</p>" +
        "<p><b>Steg 3.</b> {F, G} er en supernøkkel. Den er minimal, for {F}⁺ = {F} og {G}⁺ = {A, B, C, D, E, G} mangler F. Alle andre kandidatnøkler måtte inneholdt F og G og vært en ekte utvidelse av {F, G}, og da er de ikke minimale.</p>" +
        "<p><b>Svar:</b> P har én kandidatnøkkel, {F, G}.</p>",
      poeng: ["riktig kandidatnøkkel {F, G}", "tillukningen vist steg for steg", "begrunnelse for at det ikke finnes flere"]
    }],
    hvorfor: {
      eli5: "<p>F og G kan ingen andre regne ut, så de må alltid være med. Når vi starter med F og G, kan vi regne ut alt det andre, én regel om gangen. Da trenger vi ikke flere.</p>",
      normal: "<p>Et attributt som aldri står på en høyreside, kan ikke bestemmes av noe annet og må være med i hver nøkkel. Regner vi tillukningen av F og G og får hele relasjonen, er {F, G} en supernøkkel. Alle andre nøkler måtte inneholdt {F, G} og ville ikke vært minimale.</p>",
      teknisk: "<p>En kandidatnøkkel er en minimal supernøkkel, altså en X med X⁺ lik hele relasjonen der ingen ekte delmengde har samme egenskap. Siden F og G må være med i alle kandidatnøkler og {F, G} allerede er en supernøkkel, er {F, G} den eneste. Ellers måtte en annen nøkkel ha vært en ekte overmengde av den, og det strider mot minimalitet.</p>"
    }
  };

  IN.PERFEKT["P2019-11"] = {
    type: "eksamen",
    svar: [{
      del: "11",
      tekst: "<p><b>Nøkler.</b> A og D står aldri på en høyreside, C bare på en høyreside. {A, D}⁺ = {A, D, B, C}, altså hele R. Eneste kandidatnøkkel er {A, D}. Nøkkelattributter: A og D.</p>" +
        "<p><b>A → B.</b> A er ikke supernøkkel: brudd på BCNF. B er ikke nøkkelattributt: brudd på 3NF. A er en ekte del av kandidatnøkkelen {A, D}: brudd på 2NF. Denne FD-en gir 1NF.</p>" +
        "<p><b>B → C.</b> B er ikke supernøkkel og C er ikke nøkkelattributt, så BCNF og 3NF brytes. B er ikke del av noen kandidatnøkkel, så 2NF holder. Denne FD-en gir 2NF.</p>" +
        "<p><b>Svar:</b> Den laveste normalformen blant FD-ene er 1NF, så R er på 1NF.</p>",
      poeng: ["kandidatnøkkelen {A, D}", "algoritmen brukt på hver FD", "svaret 1NF"]
    }],
    hvorfor: {
      eli5: "<p>For å slå opp en rad trenger vi både A og D. Men B kan regnes ut fra bare A, altså fra en bit av nøkkelen. Det er den «dårligste» feilen en tabell kan ha i kurset, og den gir den laveste normalformen.</p>",
      normal: "<p>En FD der venstresiden bare er en del av nøkkelen og høyresiden ikke er et nøkkelattributt, kalles en partiell avhengighet. Den bryter 2NF. A → B er nettopp en slik FD, så R er bare på 1NF, selv om B → C alene ville gitt 2NF.</p>",
      teknisk: "<p>Algoritmen stiller tre spørsmål til hver FD X → A: Er X en supernøkkel? Er A et nøkkelattributt? Er X en ekte delmengde av en kandidatnøkkel? A → B svarer nei, nei, ja og gir 1NF. B → C svarer nei, nei, nei og gir 2NF. Normalformen til relasjonen er minimum over alle FD-ene, altså 1NF.</p>"
    }
  };

  IN.PERFEKT["P2019-12"] = {
    type: "eksamen",
    svar: [{
      del: "12",
      tekst: "<p><b>Nøkler i T.</b> A står aldri på en høyreside. {A}⁺ = {A, B, C, D}, så eneste kandidatnøkkel er {A}.</p>" +
        "<p><b>Steg 1.</b> A → B bryter ikke BCNF. B → C bryter BCNF, fordi B ikke er supernøkkel. {B}⁺ = {B, C, D}. Vi deler T i</p>" +
        "<ul><li>S₁(B, C, D) = S₁({B}⁺), med kandidatnøkkel {B} og FD-ene B → C og C → D</li>" +
        "<li>S₂(A, B) = S₂({B} ∪ (T ∖ {B}⁺)), med kandidatnøkkel {A} og FD-en A → B. På BCNF.</li></ul>" +
        "<p><b>Steg 2.</b> I S₁ bryter C → D BCNF, fordi C ikke er supernøkkel i S₁. {C}⁺ = {C, D}. Vi deler S₁ i</p>" +
        "<ul><li>S₁₁(C, D), med kandidatnøkkel {C} og FD-en C → D. På BCNF.</li>" +
        "<li>S₁₂(B, C), med kandidatnøkkel {B} og FD-en B → C. På BCNF.</li></ul>" +
        "<p><b>Resultat:</b> S₂(A, B), S₁₁(C, D), S₁₂(B, C). Hvert steg er tapsfritt etter Fagins teorem: i første steg bestemmer fellesattributtet B hele S₁, i andre steg bestemmer C hele S₁₁.</p>",
      etter: LF_MERK + "Løsningsforslaget kommer til de samme tre tabellene. Om S₁₂(C, B) sier det at «det samme» gjelder som for S₁₁, der C er nøkkel. " +
        "I S₁₂ er det B som er kandidatnøkkel (FD-en er B → C), ikke C. Det er den vi oppgir over.</p>",
      poeng: ["kandidatnøkkel for T", "første deling med {B}⁺ og nøkler/FD-er for begge deler", "andre deling med {C}⁺ og nøkler/FD-er for begge deler", "riktig sluttresultat på BCNF"]
    }],
    hvorfor: {
      eli5: "<p>Tabellen har en kjede: A gir B, B gir C og C gir D. Hver gang en del av kjeden bestemmer noe uten å være nøkkel, flytter vi den biten ut i en egen liten tabell. Til slutt har hver tabell bare ett ledd i kjeden.</p>",
      normal: "<p>Algoritmen finner en FD som bryter BCNF, regner tillukningen av venstresiden og deler tabellen i to: én med tillukningen og én med venstresiden pluss resten. Så gjentar vi for hver del til alle er på BCNF. Kjeden A → B → C → D ender som tre tabeller med to attributter hver.</p>",
      teknisk: "<p>Delingen S₁(Y⁺) og S₂(Y ∪ (X ∖ Y⁺)) har Y som fellesattributter, og Y bestemmer hele S₁. Etter Fagins teorem er delingen da tapsfri. FD-ene som gjelder i en del, er de som bare bruker attributter fra delen, også slike som følger av andre (B → D gjelder i S₁, men følger av B → C og C → D). Hver sluttabell har bare én ikke-triviell FD, og venstresiden er nøkkelen der, så alle er på BCNF.</p>"
    }
  };
})();
