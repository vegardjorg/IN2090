/* ============================================================
   IN2090 guide · data-mock.js
   Mock-eksamen: en prøveeksamen i samme form som H2023–H2025 (modellering 30 / SQL 50 /
   FD og normalisering 20, 4 timer). Alle oppgavene er laget for guiden, med eget skjema
   (bysykkeldatabasen) og egne ER-figurer. Ingen tekst er hentet fra eksamenene.
   Fasitene er regnet ut for hånd og SQL-fasitene kjørt med assets/js/sql-motor.js.

   IN.dataMock = {
     minutter, deler: [{ id, navn, poeng, minutter }],
     skjema, db: { skjema, idag, datasett: { eksempel, felle } },
     oppgaver: [{ key, del, nr, title, points, tema, oppgave (html), figur?, auto?, sql?, fritekst?,
                  perfekt: { type: "mock", svar, hvorfor, anslag }, tips }]
   }
   auto: { type: "janei" | "flervalg", regel: { riktig, feil, blankt, min }, intro, items }
   sql:  { fasit, godta?, hint?, tester?, krav?, utenView? }  (spec til IN.sqlTask)
   Klassisk script, ingen DOM. Lastes før side-mock.js.
   ============================================================ */
(function () {
  "use strict";
  var W = typeof window !== "undefined" ? window : globalThis;
  var IN = (W.IN = W.IN || {});

  /* ---------------- Databaseskjema: bysykkel ---------------- */
  var K_STASJON = ["sid", "navn", "bydel", "plasser"];
  var STASJON = [
    [1, "Jernbanetorget", "Sentrum", 20],
    [2, "Birkelunden", "Grünerløkka", 12],
    [3, "Olaf Ryes plass", "Grünerløkka", 10],
    [4, "Majorstuen", "Frogner", 15],
    [5, "Tøyen torg", "Gamle Oslo", 8],
    [6, "Vippetangen", "Sentrum", 6],
    [7, "Ullevål", "Nordre Aker", 10]
  ];
  var K_SYKKEL = ["sykkelid", "modell", "elektrisk", "stasjon"];
  var SYKKEL = [
    [101, "Classic", false, 1],
    [102, "Classic", false, 1],
    [103, "Lyn", true, 3],
    [104, "Lyn", true, null],
    [105, "Classic", false, 4],
    [106, "Lyn", true, 5],
    [107, "Tråkk", false, null]
  ];
  var K_KUNDE = ["kid", "navn", "fodt"];
  var KUNDE = [
    [1, "Ada", 1999], [2, "Birk", 1985], [3, "Cora", null], [4, "Dag", 2003], [5, "Eli", 1990], [6, "Frode", 1978]
  ];
  var K_TUR = ["tid", "sykkelid", "kid", "fra", "til", "dato", "minutter"];
  var TUR = [
    [1, 101, 1, 1, 2, "2026-11-02", 14],
    [2, 103, 1, 2, 4, "2026-11-02", 22],
    [3, 103, 2, 4, 3, "2026-11-03", 25],
    [4, 105, 3, 4, 4, "2026-11-03", 9],
    [5, 102, 2, 2, 1, "2026-11-05", 12],
    [6, 106, 4, 3, 5, "2026-11-10", 18],
    [7, 104, 5, 5, null, "2026-11-25", null],
    [8, 101, 1, 2, 1, "2026-11-12", 15],
    [9, 107, 2, 1, null, "2026-11-24", null],
    [10, 103, 4, 3, 2, "2026-10-30", 7]
  ];

  var SKJEMA = {
    tittel: "Bysykkeldatabasen (mock-eksamen)",
    intro: "<p>Du jobber for et bysykkelselskap. Databasen har stasjoner, sykler, kunder og turer. " +
      "Radene under er eksempeldata. Spørringene dine skal virke for alle lovlige data, ikke bare for disse radene. NULL vises som en tom celle.</p>" +
      "<p>Du må gjerne skrive kommentarer i spørringene med <span class=\"mono\">--</span>. Er noe uklart, skriv hvilken tolkning du velger.</p>",
    tabeller: [
      { navn: "stasjon",
        beskrivelse: "En stasjon har en unik ID <span class=\"mono\">sid</span>, et navn, bydelen den ligger i og antall plasser for sykler. CHECK <span class=\"mono\">(plasser &gt; 0)</span>.",
        kolonner: [
          { navn: "sid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true },
          { navn: "bydel", type: "text", notNull: true },
          { navn: "plasser", type: "int", notNull: true }
        ],
        eksempel: { kolonner: K_STASJON, rader: STASJON } },
      { navn: "sykkel",
        beskrivelse: "En sykkel har en unik ID, en modell og om den er elektrisk. <span class=\"mono\">stasjon</span> er stasjonen sykkelen står på nå. Den er NULL når sykkelen er ute på tur eller på verkstedet.",
        kolonner: [
          { navn: "sykkelid", type: "int", pk: true },
          { navn: "modell", type: "text", notNull: true },
          { navn: "elektrisk", type: "boolean", notNull: true },
          { navn: "stasjon", type: "int", fk: "stasjon(sid)" }
        ],
        eksempel: { kolonner: K_SYKKEL, rader: SYKKEL } },
      { navn: "kunde",
        beskrivelse: "En kunde har en unik ID <span class=\"mono\">kid</span>, et navn og fødselsår (kan være NULL). To kunder kan ha samme navn.",
        kolonner: [
          { navn: "kid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true },
          { navn: "fodt", type: "int" }
        ],
        eksempel: { kolonner: K_KUNDE, rader: KUNDE } },
      { navn: "tur",
        beskrivelse: "En tur har en unik ID <span class=\"mono\">tid</span>, sykkelen, kunden, stasjonen turen startet på (<span class=\"mono\">fra</span>), stasjonen den endte på (<span class=\"mono\">til</span>), datoen og varigheten i minutter. " +
          "Er sykkelen ikke levert ennå, er både <span class=\"mono\">til</span> og <span class=\"mono\">minutter</span> NULL. CHECK <span class=\"mono\">(minutter &gt;= 0)</span>.",
        kolonner: [
          { navn: "tid", type: "int", pk: true },
          { navn: "sykkelid", type: "int", notNull: true, fk: "sykkel(sykkelid)" },
          { navn: "kid", type: "int", notNull: true, fk: "kunde(kid)" },
          { navn: "fra", type: "int", notNull: true, fk: "stasjon(sid)" },
          { navn: "til", type: "int", fk: "stasjon(sid)" },
          { navn: "dato", type: "date", notNull: true },
          { navn: "minutter", type: "int" }
        ],
        eksempel: { kolonner: K_TUR, rader: TUR } }
    ],
    merknad: "Laget for guiden. Dagens dato i oppgavene er 25.11.2026."
  };

  /* Testdatabasen («felle») for selvrettingen: like navn, uavgjort, turer i oktober,
     en stasjon som bare er brukt som endestasjon, og en kunde uten turer. */
  var FELLE = {
    stasjon: STASJON.concat([
      [8, "Schous plass", "Grünerløkka", 9],
      [9, "Bislett", "St. Hanshaugen", 7]
    ]),
    sykkel: SYKKEL.concat([
      [108, "Lyn", true, 8], [109, "Classic", false, 8], [110, "Lyn", true, null]
    ]),
    kunde: KUNDE.concat([
      [7, "Ada", 2001], [8, "Gry", 1995], [9, "Hedda", 2000]
    ]),
    tur: TUR.concat([
      [11, 108, 7, 8, 8, "2026-11-20", 51],
      [12, 109, 8, 6, 7, "2026-10-15", 200],
      [13, 110, 6, 8, null, "2026-11-25", null]
    ])
  };

  var DB = {
    skjema: SKJEMA, idag: "2026-11-25",
    datasett: {
      eksempel: { stasjon: STASJON, sykkel: SYKKEL, kunde: KUNDE, tur: TUR },
      felle: FELLE
    }
  };

  /* ---------------- ER-figurer ---------------- */
  // 1.1: vårt fullpoengssvar
  var ER_HYTTE = {
    entiteter: [
      { id: "REGION", navn: "REGION", pos: [0, 0],
        attr: [{ navn: "Navn", nokkel: true, ang: 200 }, { navn: "Telefon", ang: 340 }] },
      { id: "HYTTE", navn: "HYTTE", pos: [0, 2],
        attr: [{ navn: "Hyttenavn", nokkel: true, ang: 215 }, { navn: "Høyde", ang: 180 },
               { navn: "Adresse", ang: 145, deler: [{ navn: "Gate" }, { navn: "Postnr" }, { navn: "Poststed" }] }] },
      { id: "ROM", navn: "ROM", svak: true, pos: [0, 4],
        attr: [{ navn: "Romnr", delvisNokkel: true, ang: 180 }, { navn: "Senger", ang: 110 }] },
      { id: "MEDLEM", navn: "MEDLEM", pos: [2, 2],
        attr: [{ navn: "Mnr", nokkel: true, ang: 300 }, { navn: "Navn", ang: 340 }, { navn: "Fødselsår", ang: 15 },
               { navn: "Telefon", flerverdi: true, ang: 50 }, { navn: "Alder", avledet: true, ang: 260 }] },
      { id: "TUR", navn: "TUR", pos: [2, 4],
        attr: [{ navn: "Turnr", nokkel: true, ang: 20 }, { navn: "Navn", ang: 70 }, { navn: "Lengde", ang: 330 }] }
    ],
    relasjoner: [
      { id: "LIGGER_I", navn: "LIGGER_I", pos: [0, 1],
        ledd: [{ entitet: "HYTTE", kard: "N", total: true }, { entitet: "REGION", kard: "1", total: false }], attr: [] },
      { id: "HAR_ROM", navn: "HAR_ROM", identifiserende: true, pos: [0, 3],
        ledd: [{ entitet: "ROM", kard: "N", total: true }, { entitet: "HYTTE", kard: "1", total: true }], attr: [] },
      { id: "VERT", navn: "VERT_FOR", pos: [1, 2],
        ledd: [{ entitet: "HYTTE", kard: "1", total: false }, { entitet: "MEDLEM", kard: "1", total: false }],
        attr: [{ navn: "Startdato", ang: 270 }] },
      { id: "LEDER", navn: "LEDER", pos: [1, 3.2],
        ledd: [{ entitet: "HYTTE", kard: "N", total: false }, { entitet: "MEDLEM", kard: "1", total: false },
               { entitet: "TUR", kard: "M", total: false }], attr: [] }
    ],
    merknad: "Tallet står på streken nær romben og gjelder entiteten streken går til: «1» mot REGION betyr at en hytte ligger i høyst én region. Dobbel strek er total deltakelse."
  };

  // 1.2: diagram med meningsløse navn
  var ER_JANEI = {
    entiteter: [
      { id: "VOR", navn: "VOR", pos: [0, 0], attr: [{ navn: "vid", nokkel: true, ang: 200 }, { navn: "kel", flerverdi: true, ang: 270 }] },
      { id: "DUN", navn: "DUN", svak: true, pos: [0, 2], attr: [{ navn: "dn", delvisNokkel: true, ang: 160 }, { navn: "ra", ang: 20 }] },
      { id: "PIX", navn: "PIX", pos: [2, 0], attr: [{ navn: "p1", nokkel: true, ang: 300 }, { navn: "p2", nokkel: true, ang: 60 }] }
    ],
    relasjoner: [
      { id: "GAR", navn: "GAR", identifiserende: true, pos: [0, 1],
        ledd: [{ entitet: "DUN", kard: "N", total: true }, { entitet: "VOR", kard: "1", total: false }], attr: [] },
      { id: "TOK", navn: "TOK", pos: [1, 0],
        ledd: [{ entitet: "VOR", kard: "M", total: true }, { entitet: "PIX", kard: "N", total: false }],
        attr: [{ navn: "tid", ang: 90 }] }
    ],
    merknad: "vid, p1 og p2 er understreket hver for seg. kel er dobbel oval. DUN er svak entitet med svak nøkkel dn (stiplet understrek). Dobbel strek fra VOR til TOK og fra DUN til GAR."
  };

  // 1.3: kurssenteret som skal realiseres
  var ER_KURS = {
    entiteter: [
      { id: "KURSHOLDER", navn: "KURSHOLDER", pos: [0, 0],
        attr: [{ navn: "Ansattnr", nokkel: true, ang: 230 }, { navn: "Navn", ang: 270 }, { navn: "Epost", flerverdi: true, ang: 180 }] },
      { id: "KURS", navn: "KURS", pos: [2, 0],
        attr: [{ navn: "Kode", nokkel: true, ang: 240 }, { navn: "Tittel", ang: 290 }, { navn: "Pris", ang: 330 }] },
      { id: "DELTAKER", navn: "DELTAKER", pos: [4, 0],
        attr: [{ navn: "Pnr", nokkel: true, ang: 270 }, { navn: "Navn", ang: 20 }] },
      { id: "ROM", navn: "ROM", pos: [0, 2],
        attr: [{ navn: "Romnr", nokkel: true, ang: 150 }, { navn: "Plasser", ang: 210 }] },
      { id: "OKT", navn: "ØKT", svak: true, pos: [2, 2],
        attr: [{ navn: "Nr", delvisNokkel: true, ang: 20 }, { navn: "Dato", ang: 90 }] }
    ],
    relasjoner: [
      { id: "ANSVARLIG", navn: "ANSVARLIG", pos: [1, 0],
        ledd: [{ entitet: "KURSHOLDER", kard: "1", total: false }, { entitet: "KURS", kard: "N", total: true }], attr: [] },
      { id: "PAMELDT", navn: "PÅMELDT", pos: [3, 0],
        ledd: [{ entitet: "KURS", kard: "N", total: false }, { entitet: "DELTAKER", kard: "M", total: false }],
        attr: [{ navn: "Betalt", ang: 270 }] },
      { id: "STYRER", navn: "STYRER", pos: [0, 1],
        ledd: [{ entitet: "KURSHOLDER", kard: "1", total: false }, { entitet: "ROM", kard: "1", total: true }], attr: [] },
      { id: "HAR_OKT", navn: "HAR_ØKT", identifiserende: true, pos: [2, 1],
        ledd: [{ entitet: "KURS", kard: "1", total: true }, { entitet: "OKT", kard: "N", total: true }], attr: [] },
      { id: "HOLDES_I", navn: "HOLDES_I", pos: [1, 2],
        ledd: [{ entitet: "ROM", kard: "1", total: false }, { entitet: "OKT", kard: "N", total: true }], attr: [] }
    ],
    merknad: "Ansattnr, Kode, Pnr og Romnr er nøkler. Epost er dobbel oval. ØKT er svak entitet med svak nøkkel Nr. Dobbel strek fra KURS til ANSVARLIG, fra ROM til STYRER, fra ØKT til HAR_ØKT og HOLDES_I, og fra KURS til HAR_ØKT."
  };

  var RADVALG = ["0", "1", "2", "3", "4", "5", "&gt;5"];
  var NF = ["1NF", "2NF", "3NF", "BCNF"];

  /* ================================================================ oppgaver */
  var O = [];

  /* ---------------------------------------------------------- 1.1 */
  O.push({
    key: "MOCK-1.1", del: 1, nr: "1.1", title: "ER-modell for en turistforening", points: 15,
    tema: ["svak entitet", "ternær relasjon", "sammensatt attributt", "flerverdiattributt", "utledbart attributt", "1:1 med attributt"],
    oppgave: "<p>En turistforening driver hytter i fjellet og trenger en database. Lag en ER-modell (Chen-notasjon, slik kurset bruker) som får med informasjonen under. Merk nøkler, kardinaliteter og deltakelse på alle relasjoner.</p>" +
      "<ol>" +
      "<li>En region identifiseres av et unikt navn og har et telefonnummer til regionkontoret.</li>" +
      "<li>En hytte identifiseres av et unikt hyttenavn. Den har en høyde over havet og en adresse som består av gate, postnummer og poststed.</li>" +
      "<li>Hver hytte ligger i nøyaktig én region. En region kan ha mange hytter, men det finnes også regioner uten hytter.</li>" +
      "<li>Hver hytte har ett eller flere rom. Et rom identifiseres av romnummeret sammen med hytta det ligger i (mange hytter har et rom 1). Et rom har et antall senger.</li>" +
      "<li>Et medlem identifiseres av et medlemsnummer og har navn, fødselsår og ett eller flere telefonnumre. Alderen til medlemmet skal kunne regnes ut fra fødselsåret.</li>" +
      "<li>Et medlem kan være vert for høyst én hytte, og en hytte har høyst én vert. Vi vil vite datoen vertskapet startet.</li>" +
      "<li>En tur identifiseres av et turnummer og har et navn og en lengde i km. En tur kan gå fra flere hytter. For hver kombinasjon av tur og hytte den går fra, er det én guide (et medlem) som leder turen. Et medlem kan lede mange turer fra mange hytter.</li>" +
      "</ol>" +
      "<p>Tegn på papir (eller i et tegneprogram), slik du ville gjort på skissearket. Skriv antakelsene dine som kommentarer.</p>",
    fritekst: "Antakelser og kommentarer til modellen (tegningen gjør du på papir)",
    perfekt: {
      type: "mock",
      intro: "<p>Ett fullpoengssvar. Andre plasseringer og navn er like riktige så lenge nøkler, kardinaliteter og deltakelse stemmer.</p>",
      svar: [
        { del: "Modell", er: ER_HYTTE,
          tekst: "<p>Gå gjennom punktene ett for ett og tegn bit for bit.</p>",
          etter: "<ul>" +
            "<li><b>Punkt 1–2:</b> REGION og HYTTE er vanlige entiteter. Adresse er et sammensatt attributt med tre deler.</li>" +
            "<li><b>Punkt 3:</b> LIGGER_I er 1:N. «Nøyaktig én region» gir total deltakelse (dobbel strek) for HYTTE. «Regioner uten hytter» gir partiell deltakelse for REGION.</li>" +
            "<li><b>Punkt 4:</b> ROM trenger hytta for å bli unikt, så ROM er en svak entitet (dobbelt rektangel) med svak nøkkel Romnr (stiplet understrek). HAR_ROM er identifiserende relasjon (dobbel rombe) med 1 mot HYTTE. Begge sider er totale: et rom hører alltid til en hytte, og hver hytte har minst ett rom.</li>" +
            "<li><b>Punkt 5:</b> Telefon er flerverdiattributt (dobbel oval). Alder er utledbart (stiplet oval).</li>" +
            "<li><b>Punkt 6:</b> VERT_FOR er 1:1 med partiell deltakelse på begge sider. Startdato er et attributt på relasjonen, ikke på HYTTE eller MEDLEM.</li>" +
            "<li><b>Punkt 7:</b> LEDER er én ternær relasjon mellom TUR, HYTTE og MEDLEM. Gitt en tur og en hytte er det én guide, så det står 1 mot MEDLEM. Mot TUR og HYTTE står det M og N.</li>" +
            "</ul>",
          poeng: ["REGION med nøkkel (1p)", "HYTTE med sammensatt adresse og LIGGER_I med riktig kardinalitet og deltakelse (3p)",
                  "ROM som svak entitet, identifiserende relasjon og svak nøkkel (3p)", "MEDLEM med flerverdi og utledbart attributt (3p)",
                  "VERT_FOR 1:1 med attributt (2p)", "Ternær LEDER med 1 mot MEDLEM (3p)"] }
      ],
      hvorfor: {
        eli5: "<p>Tenk på et rom på en hytte: «rom 1» betyr ingenting før du vet hvilken hytte. Derfor trenger rommet hytta for å ha et navn, og det er det den doble firkanten forteller. En tur fra en hytte med én guide er en avtale mellom tre ting på en gang, og da trenger du én rombe som binder alle tre sammen.</p>",
        normal: "<p>Sensor gir poeng per punkt i oppgaveteksten, og den svake entiteten og den ternære relasjonen veier mest. De vanligste trekkene er kardinalitet eller deltakelse på feil side, glemt dobbel rombe eller stiplet understrek, og at relasjonsattributtet Startdato havner på en entitet. Tre binære relasjoner i stedet for LEDER sier noe annet: de kan ikke uttrykke at det er én guide per kombinasjon av tur og hytte.</p>",
        teknisk: "<p>Den ternære LEDER har kardinaliteten 1 mot MEDLEM. Det betyr at (tur, hytte) bestemmer guiden, og ved realisering blir {tur, hytte} kandidatnøkkel i relasjonen. Tre binære relasjoner TUR–HYTTE, TUR–MEDLEM og HYTTE–MEDLEM gir ikke den samme skranken, fordi kombinasjonen kan settes sammen av par som aldri hørte sammen.</p>" +
          "<p>ROM får nøkkelen (Hyttenavn, Romnr) gjennom HAR_ROM. En svak entitet har alltid total deltakelse og 1 på eiersiden. Alder er utledbart, så den blir ikke en kolonne ved realisering.</p>"
      },
      anslag: ["Per punkt som i H2023/H2024: 1–3 poeng, mest for svak entitet og ternær relasjon.",
               "−0,5 for riktig kardinalitet eller total deltakelse på feil side, −1 for feil eller manglende.",
               "−1 for manglende markering av nøkkel, flerverdi eller svak entitet, −1 for manglende identifiserende relasjon.",
               "Tvetydige punkter godtas begge veier når antakelsen står skrevet."]
    },
    tips: ["Skriv punktnummeret ved hver del av tegningen, så finner sensor poengene.", "Les «nøyaktig én», «én eller flere» og «kan» som deltakelse: de første to gir dobbel strek."]
  });

  /* ---------------------------------------------------------- 1.2 */
  O.push({
    key: "MOCK-1.2", del: 1, nr: "1.2", title: "Les et ER-diagram (JA/NEI)", points: 5,
    tema: ["lese ER", "svak entitet", "total deltakelse", "relasjonsattributt"],
    oppgave: "<p>Et team har laget ER-diagrammet under. Navnene gir ingen mening, så du må lese alt ut av notasjonen. Svar JA hvis påstanden er modellert av diagrammet, og NEI hvis ikke.</p>" +
      "<p>Riktig svar gir 1 poeng, galt svar gir −1 poeng, og blankt gir 0. Hele oppgaven gir aldri under 0 poeng.</p>",
    figur: { er: ER_JANEI, cap: "Diagrammet til oppgave 1.2." },
    auto: {
      type: "janei", regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
      items: [
        { s: "En DUN er unikt identifisert av verdien til dn alene.", answer: false,
          explain: "<p>DUN er en svak entitet (dobbelt rektangel), og dn er bare en svak nøkkel (stiplet understrek). En DUN identifiseres av dn sammen med nøkkelen til eieren, altså vid fra VOR.</p>" },
        { s: "Hver VOR er TOK-relatert til minst én PIX.", answer: true,
          explain: "<p>Streken fra VOR til TOK er dobbel. Det er total deltakelse: hver VOR må være med i minst ett TOK-par.</p>" },
        { s: "Dersom det finnes en DUN i databasen, finnes det også minst én PIX.", answer: true,
          explain: "<p>Følg kjeden: en DUN må ha en eier-VOR (svak entitet, total deltakelse i GAR). Den VOR-en må være TOK-relatert til minst én PIX (total deltakelse i TOK). Altså finnes en PIX.</p>" },
        { s: "Hver PIX har nøyaktig én verdi for tid.", answer: false,
          explain: "<p>tid henger på romben TOK. Det er et attributt per par (VOR, PIX), ikke per PIX. En PIX kan være med i mange par (M mot VOR), eller i ingen (partiell deltakelse). Da har den mange eller ingen tid-verdier.</p>" },
        { s: "En PIX er unikt identifisert av p2 alene.", answer: true,
          explain: "<p>p1 og p2 er understreket hver for seg. Det betyr to uavhengige nøkler, og hver av dem identifiserer en PIX alene.</p>" }
      ]
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "Fasit", tekst: "<p>1 NEI · 2 JA · 3 JA · 4 NEI · 5 JA. Forklaringen står ved hver påstand når du har rettet.</p>" }],
      hvorfor: {
        eli5: "<p>Et ER-diagram er et kart med egne tegn: dobbel strek betyr «må», dobbel firkant betyr «trenger en eier for å ha navn», og en oval på en rombe hører til avtalen, ikke til tingen. Når du kan tegnene, trenger du ikke vite hva VOR og PIX er.</p>",
        normal: "<p>Ta påstandene én om gangen og finn akkurat den markeringen den handler om: understreking, stiplet understrek, dobbel strek eller hvor attributtet henger. Med −1 for galt svar lønner det seg ikke å gjette.</p>",
        teknisk: "<p>Påstand 3 krever at du følger to totale deltakelser etter hverandre: svak entitet → eier (alltid total) og eier → TOK (dobbel strek). Påstand 4 tester at et relasjonsattributt er en funksjon av paret, ikke av den ene entiteten. Det blir det bare hvis entiteten kan være med i høyst ett par og har total deltakelse.</p>"
      },
      anslag: ["Automatisk rettet: +1 riktig, −1 galt, 0 blankt, aldri under 0 (samme regel som H2023 1.2 og H2024 1.2)."]
    },
    tips: ["Med ±1 er forventet gevinst ved gjetting 0. La være å svare når du ikke vet."]
  });

  /* ---------------------------------------------------------- 1.3 */
  O.push({
    key: "MOCK-1.3", del: 1, nr: "1.3", title: "Realiser kurssenteret", points: 10,
    tema: ["realisering", "svak entitet", "1:1", "1:N", "M:N", "flerverdiattributt"],
    oppgave: "<p>Realiser ER-modellen under til et relasjonsskjema. Skjemaet skal være korrekt, effektivt (ingen unødvendige tabeller og få NULL-verdier) og tydelig. Følg realiseringsalgoritmen og forklar valgene du tar.</p>" +
      "<p>For hver relasjon: oppgi navnet og attributtene, uten datatyper og uten SQL. Marker kandidatnøkler (KN), valgt primærnøkkel (PN) og fremmednøkler (FN) slik: <span class=\"mono\">FN: A → S(B)</span>.</p>",
    figur: { er: ER_KURS, cap: "Modellen til oppgave 1.3." },
    fritekst: "Ditt relasjonsskjema, for eksempel Kurs(Kode, …) med KN, PN og FN under",
    perfekt: {
      type: "mock",
      svar: [
        { del: "Skjema",
          fig: { draw: function (h) { IN.mockFig.skjema13(h); }, cap: "Skjemaet tegnet: én boks per relasjon, primærnøkkelen understreket, og en pil fra hver fremmednøkkel til nøkkelen den viser til. Eksamen krever bare tekstformen under." },
          skjema: "Kursholder(Ansattnr, Navn)\n  KN, PN: {Ansattnr}\n\nEpost(Ansattnr, Epost)\n  KN, PN: {Ansattnr, Epost}\n  FN: Ansattnr → Kursholder(Ansattnr)\n\n" +
            "Kurs(Kode, Tittel, Pris, Ansvarlig)\n  KN, PN: {Kode}\n  FN: Ansvarlig → Kursholder(Ansattnr)\n\n" +
            "Rom(Romnr, Plasser, Styrer)\n  KN: {Romnr}, {Styrer}\n  PN: {Romnr}\n  FN: Styrer → Kursholder(Ansattnr)\n\n" +
            "Økt(Kode, Nr, Dato, Romnr)\n  KN, PN: {Kode, Nr}\n  FN: Kode → Kurs(Kode)\n      Romnr → Rom(Romnr)\n\n" +
            "Deltaker(Pnr, Navn)\n  KN, PN: {Pnr}\n\nPåmeldt(Pnr, Kode, Betalt)\n  KN, PN: {Pnr, Kode}\n  FN: Pnr → Deltaker(Pnr)\n      Kode → Kurs(Kode)",
          etter: "<p><b>Valgene:</b></p><ul>" +
            "<li><b>Entiteter:</b> Kursholder, Kurs, Deltaker og Rom blir egne relasjoner med nøkkelen sin som PN.</li>" +
            "<li><b>Svak entitet:</b> Økt får PN = eierens PN + svak nøkkel, {Kode, Nr}, og FN til Kurs. HAR_ØKT er dermed realisert og skal ikke få en egen relasjon.</li>" +
            "<li><b>ANSVARLIG (1:N):</b> FN på N-siden, Ansvarlig i Kurs. Kurs har total deltakelse, så kolonnen blir aldri NULL. En egen relasjon ville vært unødvendig.</li>" +
            "<li><b>STYRER (1:1):</b> Bare Rom har total deltakelse, så vi slår ikke sammen. FN-en legges i Rom (den totale siden), så den aldri er NULL. Hadde vi lagt den i Kursholder, ville alle som ikke styrer et rom fått NULL. Hver kursholder styrer høyst ett rom, så Styrer er også en KN.</li>" +
            "<li><b>HOLDES_I (1:N):</b> FN Romnr i Økt.</li>" +
            "<li><b>PÅMELDT (M:N):</b> egen relasjon med PN = begge FN-ene. Relasjonsattributtet Betalt er ikke del av nøkkelen.</li>" +
            "<li><b>Flerverdi:</b> Epost blir egen relasjon der alle attributtene er nøkkel.</li></ul>",
          poeng: ["Kurs med Ansvarlig som FN (1,5p)", "Kursholder (0,5p)", "Epost som egen relasjon (1p)", "Rom med Styrer som FN og KN (2p)",
                  "Økt med {Kode, Nr} og to FN (2p)", "Deltaker (0,5p)", "Påmeldt med sammensatt PN (1,5p)", "Valgene forklart (1p)"] }
      ],
      hvorfor: {
        eli5: "<p>Hver boks i tegningen blir en tabell. En pil «én til mange» blir en lapp på den som det finnes mange av, der det står hvem den hører til. «Mange til mange» trenger en egen liste, fordi ingen av sidene har plass til alle lappene sine.</p>",
        normal: "<p>Algoritmen går i fast rekkefølge: entiteter, svake entiteter, 1:1, 1:N, M:N, flerverdiattributter. For hver 1:1 og 1:N velger du mellom FN og egen relasjon, og du begrunner det med færre NULL-verdier. Sensor trekker for manglende forklaring og for å realisere den identifiserende relasjonen to ganger.</p>",
        teknisk: "<p>1:1 med total deltakelse på bare én side: FN-en på den totale siden er NOT NULL og UNIQUE, så den blir en ekstra kandidatnøkkel. Sammenslåing krever total deltakelse på begge sider, ellers må en av sidene fylles med NULL. For den svake entiteten er FN-en til eieren en del av PN, og det er nettopp det den identifiserende relasjonen betyr. Relasjonsattributter som Betalt kan aldri være del av KN.</p>"
      },
      anslag: ["0,5–1 poeng per entitet, 1–2 poeng per relasjon eller svak entitet, og 1 poeng for forklaringene.",
               "−0,5 for manglende KN-, PN- eller FN-markering, −0,5 per valg uten forklaring.",
               "−0,5 for å realisere HAR_ØKT som egen relasjon i tillegg."]
    },
    tips: ["Skriv valgene underveis: «1:N, FN på N-siden fordi …».", "En 1:1 der bare én side er total: FN på den totale siden."]
  });

  /* ---------------------------------------------------------- 2.1 */
  O.push({
    key: "MOCK-2.1", del: 2, nr: "2.1", title: "Hvor mange rader?", points: 10,
    tema: ["radantall", "NULL", "LEFT JOIN", "NATURAL JOIN", "OFFSET", "NOT EXISTS"],
    oppgave: "<p>Gitt eksempeldataene i bysykkeldatabasen: hvor mange rader returnerer hver spørring?</p>" +
      "<p>Riktig svar gir 2 poeng, galt svar gir −0,5 poeng, og blankt gir 0. Hele oppgaven gir aldri under 0 poeng.</p>",
    auto: {
      type: "flervalg", regel: { riktig: 2, feil: -0.5, blankt: 0, min: 0 },
      items: [
        { q: "<p>Spørring 1</p>", sql: "SELECT minutter\nFROM tur\nWHERE minutter > 10 OR minutter <= 10;", options: RADVALG, answer: 6,
          explain: "<p>Betingelsen ser ut til å gjelde alle rader, men for de to turene der minutter er NULL, gir begge sammenligningene NULL (ukjent). NULL OR NULL er NULL, og WHERE beholder bare sanne rader. 10 − 2 = 8 rader, altså «&gt;5».</p>" },
        { q: "<p>Spørring 2</p>", sql: "SELECT *\nFROM kunde NATURAL JOIN stasjon;", options: RADVALG, answer: 0,
          explain: "<p>NATURAL JOIN kobler på alle kolonner med samme navn. kunde og stasjon har bare <span class=\"mono\">navn</span> felles. Ingen kunde heter det samme som en stasjon, så resultatet er tomt: 0 rader.</p>" },
        { q: "<p>Spørring 3</p>", sql: "SELECT k.navn\nFROM kunde AS k\n  LEFT JOIN tur AS t ON (k.kid = t.kid)\nWHERE t.til IS NULL;", options: RADVALG, answer: 3,
          explain: "<p>LEFT JOIN gir én rad per tur, pluss Frode med NULL i alle tur-kolonnene. WHERE beholder radene der til er NULL: Frode (ingen tur), Eli (tur 7, ikke levert) og Birk (tur 9, ikke levert). 3 rader.</p>" },
        { q: "<p>Spørring 4</p>", sql: "SELECT fra, count(*)\nFROM tur\nGROUP BY fra\nHAVING count(*) >= 2\nORDER BY fra\nLIMIT 2 OFFSET 1;", options: RADVALG, answer: 2,
          explain: "<p>Turer per startstasjon: 1 → 2, 2 → 3, 3 → 2, 4 → 2, 5 → 1. HAVING beholder stasjon 1, 2, 3 og 4. OFFSET 1 hopper over stasjon 1, og LIMIT 2 tar stasjon 2 og 3. 2 rader.</p>" },
        { q: "<p>Spørring 5</p>", sql: "SELECT s.navn\nFROM stasjon AS s\nWHERE NOT EXISTS (\n  SELECT *\n  FROM sykkel AS y\n  WHERE y.stasjon = s.sid AND y.elektrisk\n);", options: RADVALG, answer: 5,
          explain: "<p>Elsyklene er 103 (stasjon 3), 104 (ingen stasjon) og 106 (stasjon 5). Stasjonene uten elsykkel er 1, 2, 4, 6 og 7. 5 rader.</p>" }
      ]
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "Fasit", tekst: "<p>1 «&gt;5» (8 rader) · 2 «0» · 3 «3» · 4 «2» · 5 «5». Forklaringen står ved hver spørring når du har rettet.</p>" }],
      hvorfor: {
        eli5: "<p>Datamaskinen er veldig bokstavelig. Spør du «er tallet over 10 eller ikke?» om en tom lapp, svarer den «vet ikke», og da kastes lappen. Gå gjennom tabellene med fingeren og tell, i stedet for å gjette hva spørringen «mener».</p>",
        normal: "<p>Kjør spørringen for hånd i klausulrekkefølgen: FROM og join først, så WHERE, GROUP BY, HAVING, SELECT, ORDER BY og til slutt LIMIT og OFFSET. De faste fellene er NULL i WHERE, kolonner med samme navn i NATURAL JOIN, og raden med bare NULL etter LEFT JOIN.</p>",
        teknisk: "<p>WHERE beholder bare rader der betingelsen er sann. NULL OR NULL er NULL, mens NULL OR TRUE er TRUE. Etter LEFT JOIN har rader uten partner NULL i alle kolonnene fra høyre side, så <span class=\"mono\">t.til IS NULL</span> fanger både «ingen tur» og «tur uten til». NOT EXISTS er sann når delspørringen er tom for den gjeldende ytre raden.</p>"
      },
      anslag: ["Automatisk rettet: +2 riktig, −0,5 galt, 0 blankt, aldri under 0 (samme regel som H2023–H2025)."]
    },
    tips: ["Med +2/−0,5 lønner det seg å gjette når du kan utelukke noe: du trenger bare å være mer enn 20 % sikker."]
  });

  /* ---------------------------------------------------------- 2.2 */
  O.push({
    key: "MOCK-2.2", del: 2, nr: "2.2", title: "Elsykkelturer fra Grünerløkka", points: 5,
    tema: ["join", "WHERE", "ORDER BY", "boolean"],
    oppgave: "<p>Skriv en spørring som finner dato, kundens navn og antall minutter for alle turer med elsykkel som startet på en stasjon i bydelen Grünerløkka. Den nyeste turen skal stå først.</p>",
    sql: {
      fasit: "SELECT t.dato, k.navn, t.minutter\nFROM tur AS t\n  INNER JOIN sykkel AS y ON (t.sykkelid = y.sykkelid)\n  INNER JOIN stasjon AS s ON (t.fra = s.sid)\n  INNER JOIN kunde AS k ON (t.kid = k.kid)\nWHERE y.elektrisk AND s.bydel = 'Grünerløkka'\nORDER BY t.dato DESC;",
      godta: ["SELECT t.dato, k.navn, t.minutter\nFROM tur AS t\n  INNER JOIN sykkel AS y ON (t.sykkelid = y.sykkelid)\n  INNER JOIN stasjon AS s ON (t.fra = s.sid)\n  INNER JOIN kunde AS k ON (t.kid = k.kid)\nWHERE y.elektrisk = true AND s.bydel = 'Grünerløkka'\nORDER BY t.dato DESC;"],
      hint: ["Du trenger fire tabeller: tur, sykkel (elektrisk), stasjon (bydel) og kunde (navn).", "Startstasjonen er <code>t.fra</code>, ikke <code>y.stasjon</code>. Sykkelen kan ha flyttet seg etterpå."],
      tester: "en ny stasjon på Grünerløkka, to kunder som heter Ada og en tur som ikke er levert"
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "SQL", tekst: "<p>Join tur med sykkel, stasjon (på <span class=\"mono\">fra</span>) og kunde, filtrer på elsykkel og bydel, og sorter synkende.</p>", sqlFasit: true,
        poeng: ["Riktige tabeller og join-betingelser (2p)", "Betingelsene på elektrisk og bydel (2p)", "ORDER BY dato DESC (1p)"] }],
      hvorfor: {
        eli5: "<p>Informasjonen ligger i fire skuffer. Du må legge lappene fra hver skuff ved siden av hverandre, slik at turen, sykkelen, stasjonen og kunden havner på samme rad, og så plukke ut radene du vil ha.</p>",
        normal: "<p>Hver join kobler en fremmednøkkel i tur med primærnøkkelen den peker på. Startstasjonen er <span class=\"mono\">fra</span>. Bruker du <span class=\"mono\">y.stasjon</span>, får du stasjonen sykkelen står på nå, og det er et annet spørsmål.</p>",
        teknisk: "<p>tur har to fremmednøkler til stasjon (fra og til). Derfor må join-betingelsen si hvilken. NATURAL JOIN ville ikke virket: kunde og stasjon har begge <span class=\"mono\">navn</span>. elektrisk er boolean, så den kan stå alene i WHERE. Hardkodede ID-er (for eksempel <span class=\"mono\">s.sid IN (2, 3)</span>) gir trekk, fordi spørringen skal virke for alle data.</p>"
      },
      anslag: ["−1 for manglende eller feil tabell i FROM, −1 per manglende betingelse, −0,5 for manglende kolonne, −1 for manglende DESC.", "−1 for hardkodede ID-er i stedet for bydel."]
    },
    tips: ["Skriv join-betingelsene med ON, ikke NATURAL JOIN, når to tabeller har en kolonne som heter navn."]
  });

  /* ---------------------------------------------------------- 2.3 */
  O.push({
    key: "MOCK-2.3", del: 2, nr: "2.3", title: "Antall turer per kunde", points: 5,
    tema: ["LEFT JOIN", "GROUP BY", "count(kolonne)"],
    oppgave: "<p>Skriv en spørring som for hver kunde finner kid, navn og antall turer kunden har tatt. Kunder som aldri har syklet, skal være med med 0.</p>",
    sql: {
      fasit: "SELECT k.kid, k.navn, count(t.tid) AS antall\nFROM kunde AS k\n  LEFT JOIN tur AS t ON (k.kid = t.kid)\nGROUP BY k.kid, k.navn;",
      hint: ["«Også de med 0» betyr LEFT JOIN fra kunde.", "Tell en kolonne fra tur, for eksempel <code>count(t.tid)</code>. <code>count(*)</code> teller raden med NULL som 1."],
      tester: "to kunder som heter Ada og en kunde uten turer"
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "SQL", tekst: "<p>LEFT JOIN fra kunde, grupper på kunden og tell en kolonne fra tur.</p>", sqlFasit: true,
        poeng: ["LEFT JOIN fra kunde (2p)", "GROUP BY på kid (1p)", "count(t.tid) og ikke count(*) (2p)"] }],
      hvorfor: {
        eli5: "<p>Du skal lage en liste over alle kundene og sette en strek for hver tur. En kunde uten turer skal også stå på lista, med null streker. Teller du linjer på lista i stedet for streker, får den kunden én for mye.</p>",
        normal: "<p>En indre join kaster kunder uten turer. LEFT JOIN beholder dem med NULL i tur-kolonnene. <span class=\"mono\">count(t.tid)</span> teller bare verdier som ikke er NULL, og gir derfor 0 for dem.</p>",
        teknisk: "<p>Grupper på kid, ikke bare navn, fordi to kunder kan hete det samme. PostgreSQL godtar <span class=\"mono\">k.navn</span> i SELECT når gruppen er på PN-en kid, men det skader ikke å ha den med i GROUP BY. <span class=\"mono\">count(*)</span> teller rader, og raden fra LEFT JOIN uten partner er en rad.</p>"
      },
      anslag: ["−2 for indre join (kunder med 0 mangler).", "−1 for count(*) i stedet for count(kolonne).", "−1 for GROUP BY bare på navn."]
    },
    tips: ["Etter LEFT JOIN: tell alltid en kolonne fra høyre tabell."]
  });

  /* ---------------------------------------------------------- 2.4 */
  O.push({
    key: "MOCK-2.4", del: 2, nr: "2.4", title: "Stasjoner som aldri er brukt", points: 5,
    tema: ["NOT EXISTS", "delspørring", "«ingen»"],
    oppgave: "<p>Skriv en spørring som finner navn og bydel på stasjonene der ingen tur verken har startet eller endt.</p>",
    sql: {
      fasit: "SELECT s.navn, s.bydel\nFROM stasjon AS s\nWHERE NOT EXISTS (\n  SELECT *\n  FROM tur AS t\n  WHERE t.fra = s.sid OR t.til = s.sid\n);",
      godta: [
        "SELECT s.navn, s.bydel\nFROM stasjon AS s\n  LEFT JOIN tur AS t ON (t.fra = s.sid OR t.til = s.sid)\nWHERE t.tid IS NULL;",
        "SELECT navn, bydel\nFROM stasjon\nWHERE sid NOT IN (SELECT fra FROM tur)\n  AND sid NOT IN (SELECT til FROM tur WHERE til IS NOT NULL);"
      ],
      hint: ["«Ingen tur» er en «for alle»-betingelse. Bruk NOT EXISTS, ikke en vanlig join.", "Både fra og til må sjekkes. En stasjon som bare er brukt som endestasjon, skal ikke med."],
      tester: "én stasjon som bare er brukt som endestasjon, én som bare er brukt som startstasjon og én som aldri er brukt"
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "SQL", tekst: "<p>NOT EXISTS med en korrelert delspørring som ser etter turer som starter eller ender på stasjonen.</p>", sqlFasit: true,
        etter: "<p>Andre riktige løsninger er LEFT JOIN … IS NULL og to NOT IN. Bruker du NOT IN på <span class=\"mono\">til</span>, må NULL-verdiene filtreres bort i delspørringen. Ellers blir svaret tomt (det er en tilleggsfelle som kurset ikke tar opp, men den er grunnen til at NOT EXISTS er tryggest).</p>",
        poeng: ["NOT EXISTS eller tilsvarende «ingen» (3p)", "Både fra og til sjekket (1p)", "Riktige kolonner (1p)"] }],
      hvorfor: {
        eli5: "<p>Du leter etter stasjoner som aldri har sett en sykkel komme eller gå. Da må du se gjennom alle turene for hver stasjon og sjekke at ingen av dem passer. Det holder ikke å finne én tur som går et annet sted.</p>",
        normal: "<p>«Ingen tur» kan ikke uttrykkes med en vanlig join og WHERE, for den ser på én rad om gangen. Med NOT EXISTS spør du for hver stasjon: finnes det en tur som starter eller ender her? Er svaret nei, er stasjonen med.</p>",
        teknisk: "<p>Delspørringen er korrelert: <span class=\"mono\">s.sid</span> viser til raden i den ytre spørringen. NOT EXISTS er sann når delspørringen gir tomt resultat. Kurset viser fire måter å finne «uten» på: EXCEPT, NOT IN, NOT EXISTS og LEFT JOIN … IS NULL.</p>"
      },
      anslag: ["−3 for en løsning som finner «minst én tur et annet sted» i stedet for «ingen tur».", "−1 for å sjekke bare fra eller bare til."]
    },
    tips: ["«Ingen», «aldri» og «ikke noen» er signalordene for NOT EXISTS."]
  });

  /* ---------------------------------------------------------- 2.5 */
  O.push({
    key: "MOCK-2.5", del: 2, nr: "2.5", title: "VIEW med stasjonsstatus", points: 8,
    tema: ["VIEW", "LEFT JOIN", "GROUP BY", "aritmetikk"],
    oppgave: "<p>Lag et view <span class=\"mono\">stasjonsstatus</span> med én rad per stasjon og kolonnene <span class=\"mono\">sid</span>, <span class=\"mono\">navn</span>, <span class=\"mono\">sykler</span> og <span class=\"mono\">ledige</span>. " +
      "<span class=\"mono\">sykler</span> er antall sykler som står på stasjonen nå, og <span class=\"mono\">ledige</span> er antall plasser minus antall sykler. Stasjoner uten sykler skal være med.</p>",
    sql: {
      fasit: "SELECT s.sid, s.navn, count(y.sykkelid) AS sykler,\n       s.plasser - count(y.sykkelid) AS ledige\nFROM stasjon AS s\n  LEFT JOIN sykkel AS y ON (y.stasjon = s.sid)\nGROUP BY s.sid, s.navn, s.plasser;",
      hint: ["Øvingen kan ikke kjøre CREATE VIEW. Skriv SELECT-delen her, og husk <code>CREATE VIEW stasjonsstatus AS</code> foran på eksamen.", "LEFT JOIN fra stasjon og <code>count(y.sykkelid)</code>, så stasjoner uten sykler får 0."],
      tester: "tre stasjoner uten sykler og en stasjon med to sykler",
      krav: [{ kolonner: ["sid", "navn", "sykler", "ledige"], tekst: "Kolonnene skal hete sid, navn, sykler og ledige." }],
      utenView: true
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "SQL", tekst: "<p>Viewet er en lagret spørring: LEFT JOIN fra stasjon til sykkel, grupper per stasjon, og regn ut ledige plasser fra antallet.</p>",
        sql: "CREATE VIEW stasjonsstatus AS\nSELECT s.sid, s.navn, count(y.sykkelid) AS sykler,\n       s.plasser - count(y.sykkelid) AS ledige\nFROM stasjon AS s\n  LEFT JOIN sykkel AS y ON (y.stasjon = s.sid)\nGROUP BY s.sid, s.navn, s.plasser;", sqlTabell: true,
        poeng: ["CREATE VIEW med riktig navn (2p)", "LEFT JOIN og GROUP BY per stasjon (3p)", "count(y.sykkelid) og ledige som plasser − antall (2p)", "Kolonnenavnene (1p)"] }],
      hvorfor: {
        eli5: "<p>Et view er en oppskrift som får et navn. Hver gang noen spør etter stasjonsstatus, lager databasen tabellen på nytt etter oppskriften, så tallene alltid er ferske.</p>",
        normal: "<p>Som i 2.3 må stasjoner uten sykler være med, så det blir LEFT JOIN og count på en kolonne fra sykkel. <span class=\"mono\">plasser</span> brukes utenfor et aggregat og må derfor stå i GROUP BY (eller følge av PN-en sid).</p>",
        teknisk: "<p>Et view lagrer spørringen, ikke resultatet. Aritmetikk med aggregat i SELECT er lov: <span class=\"mono\">s.plasser − count(…)</span> regnes ut én gang per gruppe. Kolonnenavnene i viewet kommer fra AS-aliasene. Uten alias får kolonnen navnet <span class=\"mono\">count</span> eller <span class=\"mono\">?column?</span>.</p>"
      },
      anslag: ["−3 for manglende CREATE VIEW (som H2020).", "−2 for indre join (stasjoner uten sykler mangler).", "−1 for count(*)."]
    },
    tips: ["En VIEW-oppgave har vært med hvert år. Skriv CREATE VIEW navn AS først, så glemmer du det ikke."]
  });

  /* ---------------------------------------------------------- 2.6 */
  O.push({
    key: "MOCK-2.6", del: 2, nr: "2.6", title: "Mest sykling i november", points: 10,
    tema: ["WITH", "aggregat", "maks med likhet", "dato", "NULL"],
    oppgave: "<p>Skriv en spørring som finner navnet på kunden eller kundene som har syklet flest minutter til sammen i november 2026, og hvor mange minutter det var. " +
      "Turer som ikke er levert (minutter er NULL), skal ikke telles. Er flere kunder like gode, skal alle være med.</p>",
    sql: {
      fasit: "WITH per_kunde AS (\n  SELECT kid, sum(minutter) AS totalt\n  FROM tur\n  WHERE dato >= '2026-11-01' AND dato < '2026-12-01'\n    AND minutter IS NOT NULL\n  GROUP BY kid\n)\nSELECT k.navn, p.totalt\nFROM per_kunde AS p\n  INNER JOIN kunde AS k ON (p.kid = k.kid)\nWHERE p.totalt = (SELECT max(totalt) FROM per_kunde);",
      godta: ["WITH per_kunde AS (\n  SELECT kid, sum(minutter) AS totalt\n  FROM tur\n  WHERE extract(month FROM dato) = 11 AND extract(year FROM dato) = 2026\n  GROUP BY kid\n)\nSELECT k.navn, p.totalt\nFROM per_kunde AS p\n  INNER JOIN kunde AS k ON (p.kid = k.kid)\nWHERE p.totalt = (SELECT max(totalt) FROM per_kunde);"],
      hint: ["Lag først en WITH-tabell med summen per kid for november.", "Flest «med likhet» løses med <code>= (SELECT max(…) …)</code>, ikke <code>ORDER BY … LIMIT 1</code>."],
      tester: "to kunder som begge heter Ada og har like mange minutter, og en kunde med mange minutter i oktober"
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "SQL", tekst: "<p>Del opp: først summen per kunde i november, så sammenligningen med maksimum.</p>", sqlFasit: true,
        etter: "<p>Datofilteret kan også skrives med <span class=\"mono\">extract(month FROM dato) = 11</span>. Filteret <span class=\"mono\">minutter IS NOT NULL</span> endrer ikke svaret her, fordi sum og max hopper over NULL. Uten filteret får Eli (bare en tur som ikke er levert) summen NULL i WITH-tabellen. Med filteret får Eli ingen rad der, og det er ryddigere. Det viser også sensor at du har tenkt på det.</p>",
        poeng: ["WITH (eller delspørring) med sum per kunde (3p)", "Riktig filter på november (2p)", "Maks med likhet, for eksempel = (SELECT max …) (3p)", "Join med kunde for navnet (2p)"] }],
      hvorfor: {
        eli5: "<p>Først skriver du opp hvor mange minutter hver kunde syklet i november. Så finner du det største tallet på lista. Til slutt ringer du rundt alle som har akkurat det tallet. Tar du bare den første på lista, kan du glemme noen som har like mye.</p>",
        normal: "<p>WITH gir et navn til mellomresultatet, så du kan bruke det to ganger: én gang for å finne radene og én gang for å finne maksimum. LIMIT 1 gir feil svar ved likhet, og sensor trekker for det når oppgaven sier «alle».</p>",
        teknisk: "<p>Aggregat kan ikke stå i WHERE, så maksimum må regnes ut i en egen delspørring. <span class=\"mono\">sum</span> ignorerer NULL, og en kunde med bare NULL får summen NULL. Den forsvinner av seg selv, fordi <span class=\"mono\">NULL = max</span> er NULL. Datoer skrives som strenger <span class=\"mono\">'2026-11-01'</span>, og et halvåpent intervall (&lt; 1. desember) slipper unna spørsmålet om hvor mange dager måneden har.</p>"
      },
      anslag: ["Delpoeng etter delmål, som H2019 2.8 og H2020 S6.", "−3 for ORDER BY … LIMIT 1 når flere kan være like gode.", "−2 for aggregat i WHERE i stedet for en delspørring eller HAVING."]
    },
    tips: ["Del store oppgaver i WITH-steg og skriv en kommentar per steg. Da får du delpoeng selv om et steg er feil."]
  });

  /* ---------------------------------------------------------- 2.7 */
  O.push({
    key: "MOCK-2.7", del: 2, nr: "2.7", title: "Skadetabell og transaksjon", points: 7,
    tema: ["CREATE TABLE", "skranker", "INSERT", "UPDATE", "transaksjon"],
    oppgave: "<p><b>a)</b> Lag tabellen <span class=\"mono\">skade</span> med kolonnene <span class=\"mono\">sykkelid</span>, <span class=\"mono\">dato</span> og <span class=\"mono\">beskrivelse</span>. " +
      "sykkelid skal peke på en sykkel. En sykkel kan bare få én skademelding per dato. Beskrivelsen må finnes og være minst 5 tegn lang. <span class=\"et-p\">(4p)</span></p>" +
      "<p><b>b)</b> Skriv SQL som i én transaksjon registrerer at sykkel 105 ble skadet i dag med beskrivelsen «Punktert forhjul», og tar sykkelen ut av stasjonen (setter stasjon til NULL). Enten skal begge endringene skje, eller ingen. <span class=\"et-p\">(3p)</span></p>",
    fritekst: "Din SQL for a) og b)",
    perfekt: {
      type: "mock",
      svar: [
        { del: "a)", sql: "CREATE TABLE skade (\n  sykkelid int REFERENCES sykkel(sykkelid),\n  dato date,\n  beskrivelse text NOT NULL CHECK (length(beskrivelse) >= 5),\n  PRIMARY KEY (sykkelid, dato)\n);",
          tekst: "<p>Sammensatt primærnøkkel gir «én melding per sykkel per dato». PRIMARY KEY gjør også begge kolonnene NOT NULL.</p>",
          etter: "<p>NOT NULL trengs på beskrivelse, fordi en CHECK slipper gjennom NULL.</p>",
          poeng: ["Kolonner med typer (1p)", "PRIMARY KEY (sykkelid, dato) (1p)", "REFERENCES sykkel (1p)", "NOT NULL og CHECK på lengden (1p)"] },
        { del: "b)", sql: "BEGIN;\nINSERT INTO skade VALUES (105, current_date, 'Punktert forhjul');\nUPDATE sykkel\nSET stasjon = NULL\nWHERE sykkelid = 105;\nCOMMIT;",
          tekst: "<p>BEGIN og COMMIT rundt begge setningene. Feiler en av dem, rulles alt tilbake.</p>",
          poeng: ["BEGIN … COMMIT (1p)", "INSERT med riktige verdier (1p)", "UPDATE med WHERE (1p)"] }
      ],
      hvorfor: {
        eli5: "<p>Skjemaet er reglene for hva som får stå i tabellen, og databasen sier nei til alt som bryter dem. En transaksjon er som å flytte en sykkel fra ett sted til et annet: enten er den flyttet helt, eller så står den der den sto.</p>",
        normal: "<p>Hver setning i oppgaveteksten blir én skranke: «peke på» blir REFERENCES, «én per dato» blir sammensatt PRIMARY KEY, og «må finnes og være minst 5 tegn» blir NOT NULL og CHECK. Transaksjonen sørger for at du aldri får en skademelding uten at sykkelen er tatt ut, eller omvendt.</p>",
        teknisk: "<p>CHECK er oppfylt når uttrykket er sant eller NULL, så <span class=\"mono\">CHECK (length(beskrivelse) &gt;= 5)</span> alene slipper gjennom NULL. PRIMARY KEY er UNIQUE og NOT NULL, og det kan bare være én per tabell. En UPDATE uten WHERE ville tatt alle syklene ut av stasjonene, og det er en klassisk feil.</p>"
      },
      anslag: ["Som H2025 2.3: poeng per skranke og per del av transaksjonen.", "Enkle syntaksfeil gir ikke trekk."]
    },
    tips: ["Gå gjennom oppgaveteksten setning for setning og skriv én skranke per krav."]
  });

  /* ---------------------------------------------------------- 3.1 */
  var R3 = "<p>Relasjonen <span class=\"mono\">R(A, B, C, D, E, F)</span> har de funksjonelle avhengighetene</p>" +
    "<p class=\"mono\">AB → C &nbsp;&nbsp; C → A &nbsp;&nbsp; C → D &nbsp;&nbsp; D → E</p>" +
    "<p>og ingen andre ikke-trivielle FD-er enn dem som følger av disse.</p>";
  O.push({
    key: "MOCK-3.1", del: 3, nr: "3.1", title: "Nøkkelattributter (JA/NEI)", points: 6,
    tema: ["kandidatnøkler", "nøkkelattributt"],
    oppgave: R3 + "<p>Er attributtet et nøkkelattributt? Riktig svar gir 1 poeng, galt svar −1 poeng, blankt 0. Oppgaven gir aldri under 0 poeng.</p>",
    fritekst: "Kladd: kandidatnøklene og tillukningene dine",
    auto: {
      type: "janei", regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
      items: [
        { s: "A", answer: true, explain: "<p>A er med i kandidatnøkkelen ABF.</p>" },
        { s: "B", answer: true, explain: "<p>B står aldri på en høyreside og er med i alle kandidatnøkler.</p>" },
        { s: "C", answer: true, explain: "<p>C er med i kandidatnøkkelen BCF.</p>" },
        { s: "D", answer: false, explain: "<p>BDF⁺ = {B, D, E, F} mangler A og C, og alle andre supernøkler med D inneholder ABF eller BCF. D er ikke med i noen kandidatnøkkel.</p>" },
        { s: "E", answer: false, explain: "<p>E står bare på en høyreside (D → E) og er aldri med i en kandidatnøkkel.</p>" },
        { s: "F", answer: true, explain: "<p>F står ikke i noen FD. Ingen kan bestemme F, så den er med i alle kandidatnøkler.</p>" }
      ]
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "Kandidatnøkler",
        tekst: "<ul><li><b>Alltid med</b> (aldri på en høyreside): B og F. <b>Aldri med</b> (bare på høyresider): E. <b>Kanskje med:</b> A, C, D.</li>" +
          "<li>(BF)⁺ = {B, F}. Ikke nok.</li>" +
          "<li>(ABF)⁺: AB → C gir C, C → D gir D, D → E gir E. = R. <b>KN.</b></li>" +
          "<li>(BCF)⁺: C → A gir A, C → D gir D, D → E gir E. = R. <b>KN.</b></li>" +
          "<li>(BDF)⁺: D → E gir E. = {B, D, E, F}. Ikke SN.</li>" +
          "<li>Alle større kombinasjoner inneholder ABF eller BCF (AD gir ABDF ⊇ ABF, og så videre).</li></ul>" +
          "<p>Kandidatnøklene er <b>{A, B, F}</b> og <b>{B, C, F}</b>. Nøkkelattributtene er A, B, C og F. D og E er ikke-nøkkelattributter.</p>" }],
      hvorfor: {
        eli5: "<p>Noen bokstaver kan ingen andre lage. De må alltid være med i nøkkelen. Så prøver du å legge til én og én av de andre og ser om du kan lage hele alfabetet. Hver bokstav som er med i minst én slik minste løsning, er et nøkkelattributt.</p>",
        normal: "<p>Nøkkelattributt betyr «med i minst én kandidatnøkkel». Det betyr ikke «med i primærnøkkelen» og ikke «med i alle». Finn derfor alle kandidatnøklene først, med kursets metode: alltid med, aldri med, og så utvid.</p>",
        teknisk: "<p>B og F står ikke på noen høyreside, så de er med i hver KN. E står bare til høyre og er med i ingen. Søket går over delmengder av {A, C, D} lagt til BF, i stigende størrelse. ABF og BCF er supernøkler, og ingen ekte delmengde av dem er det. D gir ikke noe nytt utover E, så D havner ikke i en minimal nøkkel.</p>"
      },
      anslag: ["Automatisk rettet: +1 riktig, −1 galt, 0 blankt, aldri under 0 (som H2023 3.1 og H2024 3.1)."]
    },
    tips: ["Regn ut alle KN-ene på kladd før du svarer. Med ±1 koster ett galt svar like mye som ett riktig gir."]
  });

  /* ---------------------------------------------------------- 3.2 */
  O.push({
    key: "MOCK-3.2", del: 3, nr: "3.2", title: "Normalform per FD", points: 4,
    tema: ["normalform", "2NF", "3NF", "BCNF"],
    oppgave: R3 + "<p>Hvilken er den høyeste normalformen FD-en (alene) oppfyller? Riktig svar gir 1 poeng, galt svar −0,5 poeng, blankt 0. Oppgaven gir aldri under 0 poeng. Kandidatnøklene fra 3.1 kan brukes.</p>",
    auto: {
      type: "flervalg", regel: { riktig: 1, feil: -0.5, blankt: 0, min: 0 },
      items: [
        { q: "<p class=\"mono\">AB → C</p>", options: NF, answer: 2,
          explain: "<p>AB er ikke en supernøkkel (F mangler), så BCNF brytes. C er et nøkkelattributt (med i BCF), så 3NF holder. Svaret er 3NF.</p>" },
        { q: "<p class=\"mono\">C → A</p>", options: NF, answer: 2,
          explain: "<p>C er ikke en supernøkkel. A er et nøkkelattributt (med i ABF), så 3NF holder. Svaret er 3NF.</p>" },
        { q: "<p class=\"mono\">C → D</p>", options: NF, answer: 0,
          explain: "<p>C er ikke en supernøkkel, og D er ikke et nøkkelattributt, så 3NF brytes. C er en ekte delmengde av kandidatnøkkelen BCF, så det er en partiell avhengighet, og 2NF brytes også. Svaret er 1NF.</p>" },
        { q: "<p class=\"mono\">D → E</p>", options: NF, answer: 1,
          explain: "<p>D er ikke en supernøkkel, og E er ikke et nøkkelattributt, så 3NF brytes. D er ikke en del av noen kandidatnøkkel, så 2NF holder. Svaret er 2NF.</p>" }
      ]
    },
    perfekt: {
      type: "mock",
      svar: [{ del: "Fasit", tekst: "<p>AB → C: 3NF · C → A: 3NF · C → D: 1NF · D → E: 2NF. Hele R er derfor bare på 1NF (den laveste blant FD-ene).</p>" }],
      hvorfor: {
        eli5: "<p>For hver regel stiller du tre spørsmål i fast rekkefølge, som en sjekkliste. Første «nei» som stopper deg, forteller hvilket trinn regelen står på.</p>",
        normal: "<p>Kursets algoritme for X → A: (1) Er X en supernøkkel? Ja gir BCNF. (2) Er A et nøkkelattributt? Ja gir 3NF. (3) Er X en del av en kandidatnøkkel? Ja gir 1NF, nei gir 2NF.</p>",
        teknisk: "<p>2NF forbyr bare at et ikke-nøkkelattributt avhenger av en ekte del av en KN. C → D er nettopp det: C ⊂ BCF og D er ikke-nøkkelattributt. D → E bryter 3NF (transitiv avhengighet via D), men D er ikke del av noen KN, så 2NF holder. AB → C og C → A er de klassiske 3NF-tilfellene der høyresiden er et nøkkelattributt.</p>"
      },
      anslag: ["Vår regel: +1 riktig, −0,5 galt, 0 blankt, aldri under 0 (H2024 3.2 brukte +2/−0,5 på fire FD-er)."]
    },
    tips: ["Svar på spørsmål 2 før 3: en FD med nøkkelattributt på høyresiden bryter aldri 2NF."]
  });

  /* ---------------------------------------------------------- 3.3 */
  O.push({
    key: "MOCK-3.3", del: 3, nr: "3.3", title: "Tapsfri dekomposisjon til BCNF", points: 10,
    tema: ["BCNF-dekomposisjon", "tillukning", "tapsfri"],
    oppgave: "<p>Relasjonen <span class=\"mono\">S(A, B, C, D, E, F)</span> har de funksjonelle avhengighetene</p>" +
      "<p class=\"mono\">A → B &nbsp;&nbsp; B → C &nbsp;&nbsp; AD → E &nbsp;&nbsp; E → F</p>" +
      "<p>Dekomponer S tapsfritt til BCNF med algoritmen fra kurset. Vis hvert steg: hvilken FD du deler på, tillukningen, de nye relasjonene, og kandidatnøkler og FD-er for hver av dem.</p>",
    fritekst: "Dine steg i dekomposisjonen",
    perfekt: {
      type: "mock",
      intro: "<p>Kandidatnøkkel for S: A og D står aldri på en høyreside, og (AD)⁺ = {A, D, B, C, E, F} = S. Eneste KN er <b>{A, D}</b>. FD-ene A → B, B → C og E → F bryter BCNF, fordi venstresidene ikke er supernøkler.</p>",
      svar: [
        { del: "Oversikt", fig: { draw: function (h) { IN.mockFig.tre33(h); }, cap: "Hele dekomposisjonen som et tre. Stegene under forklarer hver deling." } },
        { del: "Steg 1", tekst: "<p>Del på <span class=\"mono\">A → B</span>. A⁺ = {A, B, C}.</p>" +
            "<ul><li><span class=\"mono\">S₁(A, B, C)</span> med FD-ene A → B og B → C. KN: {A}.</li>" +
            "<li><span class=\"mono\">S₂(A, D, E, F)</span> med FD-ene AD → E og E → F. KN: {A, D}.</li></ul>",
          poeng: ["Riktig tillukning A⁺ (1p)", "S₁(A⁺) og S₂(A ∪ (S − A⁺)) (1p)", "FD-er og KN for begge (2p)"] },
        { del: "Steg 2", tekst: "<p>S₁ er ikke på BCNF: B → C, og B er ikke SN i S₁. Del på <span class=\"mono\">B → C</span>. B⁺ = {B, C}.</p>" +
            "<ul><li><span class=\"mono\">S₁₁(B, C)</span> med B → C. KN: {B}. BCNF.</li>" +
            "<li><span class=\"mono\">S₁₂(A, B)</span> med A → B. KN: {A}. BCNF.</li></ul>",
          poeng: ["Ser at B → C bryter BCNF i S₁ (1p)", "Riktig deling med FD-er og KN (2p)"] },
        { del: "Steg 3", tekst: "<p>S₂ er ikke på BCNF: E → F, og E er ikke SN i S₂. Del på <span class=\"mono\">E → F</span>. E⁺ = {E, F}.</p>" +
            "<ul><li><span class=\"mono\">S₂₁(E, F)</span> med E → F. KN: {E}. BCNF.</li>" +
            "<li><span class=\"mono\">S₂₂(A, D, E)</span> med AD → E. KN: {A, D}. BCNF.</li></ul>",
          poeng: ["Ser at E → F bryter BCNF i S₂ (1p)", "Riktig deling med FD-er og KN (2p)"] },
        { del: "Svar", tekst: "<p><span class=\"mono\">S₁₁(B, C)</span>, <span class=\"mono\">S₁₂(A, B)</span>, <span class=\"mono\">S₂₁(E, F)</span>, <span class=\"mono\">S₂₂(A, D, E)</span>. Alle er på BCNF.</p>" +
            "<p>Hvert steg er tapsfritt etter Fagins teorem: fellesattributtene i en deling er Y, og Y → Y⁺ holder, så fellesattributtene bestemmer den ene delen.</p>" +
            "<p>Starter du med B → C eller E → F, ender du med de samme fire relasjonene. Det er også riktig.</p>" }
      ],
      hvorfor: {
        eli5: "<p>Du har en stor tabell der noen opplysninger gjentas igjen og igjen. Hver gang du finner en regel som gjør at noe gjentas, flytter du den regelen og det den bestemmer ut i en egen liten tabell, og lar en «lapp» stå igjen så du kan sette tabellene sammen igjen.</p>",
        normal: "<p>Algoritmen: velg en FD Y → A som bryter BCNF, regn ut Y⁺, og lag S₁(Y⁺) og S₂(Y og alt som ikke er i Y⁺). Fortsett med hver del, med bare de FD-ene som har alle attributtene sine i delen. Stopp når alle deler er på BCNF. Sensor trekker for manglende FD-er, feil tillukning og feil KN på delrelasjonene, og mye for manglende forklaring.</p>",
        teknisk: "<p>I S₁(A, B, C) gjelder fortsatt B → C, fordi både B og C er med. I S₂(A, D, E, F) gjelder AD → E og E → F. A → B kan ikke brukes der, fordi B er flyttet ut. Hver deling S(X) → S₁(Y⁺), S₂(Y ∪ (X − Y⁺)) er tapsfri, fordi fellesattributtene er Y og Y → Y⁺. Det er Fagins teorem.</p>"
      },
      anslag: ["4 poeng for første steg, 3 for hvert av de neste (som H2020/H2023: 5–7 for første splitt, 2,5–4 for hvert videre steg).",
               "−1 per manglende eller feil FD på en delrelasjon, −1 for feil tillukning, −1 for feil KN.",
               "−3 når forklaringen mangler."]
    },
    tips: ["Skriv KN og FD-er for hver ny relasjon. Det er der de fleste poengene ligger, ikke i sluttsvaret."]
  });

  IN.dataMock = {
    minutter: 240,
    deler: [
      { id: "del1", nr: 1, navn: "Modellering", poeng: 30, minutter: 70, tekst: "ER-tegning, lese et ER-diagram og realisering." },
      { id: "del2", nr: 2, navn: "SQL", poeng: 50, minutter: 120, tekst: "Radantall, fire spørringer, et view og en transaksjon på bysykkeldatabasen." },
      { id: "del3", nr: 3, navn: "FD og normalisering", poeng: 20, minutter: 40, tekst: "Nøkkelattributter, normalform per FD og BCNF-dekomposisjon." }
    ],
    skjema: SKJEMA,
    db: DB,
    er: { hytte: ER_HYTTE, janei: ER_JANEI, kurs: ER_KURS },
    oppgaver: O
  };
})();
