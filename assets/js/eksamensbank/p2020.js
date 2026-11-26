/* IN2090 · eksamensbank P2020 = PRØVEEKSAMEN høsten 2020 (ikke en ordinær eksamen).
   Kilde: UiO, IN2090 prøveeksamen H2020 (in2090h20-proveeksamen.pdf) + løsningsforslag (in2090h20_proveeksamen_losning.pdf).
   Det finnes INGEN sensorveiledning for prøveeksamen, så feltet «sensor» er tomt med vilje.
   Oppgavetekst ordrett. Løsningsforslaget er alltid gjengitt med egne ord, og all SQL og RA her er vår egen.
   Prøveeksamen teller ikke med i vektingen av eksamensmønsteret (plan/eksamensmonster.md regner den separat).
   Arket nummererer oppgavene 1–13 fortløpende over de tre delene. */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var BANK = (window.IN_EXAM_BANK = window.IN_EXAM_BANK || {});
  IN.PERFEKT = IN.PERFEKT || {};

  /* ---------- Databaseskjemaet for SQL-delen og oppgave 11 ---------- */
  var SKJEMA = {
    tittel: "Julenissens Verksted (barn, gave, ønskeliste)",
    intro: "<p>Du er ansatt som ny databaseadministrator hos Julenissens Verksted, hvor det er mye som skal gjøres før jul. Databasen til " +
      "Julenissen er laget av følgende SQL-script:</p>" +
      "<pre>CREATE TABLE barn(\n    bid int PRIMARY KEY,\n    navn text NOT NULL,\n    snill boolean NOT NULL\n);\n\n" +
      "CREATE TABLE gave(\n    gid int PRIMARY KEY,\n    navn text NOT NULL,\n    nyttig boolean NOT NULL\n);\n\n" +
      "CREATE TABLE ønskeliste(\n    barn int REFERENCES barn(bid),\n    gave int REFERENCES gave(gid)\n);</pre>" +
      "<p>Tabellen barn inneholder informasjon om alle barn, hvor hvert barn har en unik ID (bid), et navn og en boolsk verdi som er sann om " +
      "barnet har vært snill det siste året og usann hvis ikke.</p>" +
      "<p>Tabellen gave inneholder informasjon om gavene som Julenissens Verksted kan lage. Hver gave har en unik ID (gid), et navn samt en " +
      "boolsk verdi som sier om gaven er en nyttig gave eller ikke.</p>" +
      "<p>Den siste tabellen, ønskeliste, inneholder alle barns ønsker, hvor hver rad inneholder et barns ID sammen med IDen til en gave det " +
      "barnet ønsker seg. Merk: Et barn kan ønske seg mange gaver og en gave kan naturligvis bli ønsket av mange barn.</p>" +
      "<p>Under er et eksempel på hvordan databasen kan se ut.</p>",
    tabeller: [
      { navn: "barn", beskrivelse: "",
        kolonner: [
          { navn: "bid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true },
          { navn: "snill", type: "boolean", notNull: true }
        ],
        eksempel: { kolonner: ["bid", "navn", "snill"],
          rader: [[0, "Ola", "t"], [1, "Kari", "t"], [2, "Per", "f"], [3, "Nils", "t"], [4, "Mari", "f"], [5, "Kine", "f"], [6, "Jasmin", "t"]] } },
      { navn: "gave", beskrivelse: "",
        kolonner: [
          { navn: "gid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true },
          { navn: "nyttig", type: "boolean", notNull: true }
        ],
        eksempel: { kolonner: ["gid", "navn", "nyttig"],
          rader: [[0, "Lekebil", "f"], [1, "Sokker", "t"], [2, "Sykkel", "t"], [3, "Lekepistol", "f"], [4, "Dataspill", "f"],
                  [5, "Fuglebrett", "t"], [6, "Dukke", "f"], [7, "Bok", "t"]] } },
      { navn: "ønskeliste", beskrivelse: "",
        kolonner: [
          { navn: "barn", type: "int", fk: "barn(bid)" },
          { navn: "gave", type: "int", fk: "gave(gid)" }
        ],
        eksempel: { kolonner: ["barn", "gave"],
          rader: [[1, 0], [1, 6], [0, 6], [0, 5], [3, 2], [5, 1], [5, 3], [5, 4], [4, 3], [4, 0], [6, 7]] } }
    ],
    merknad: "Skjemaet står i selve oppgaveteksten på prøveeksamen (ingen egen skjemafil). ønskeliste har ingen primærnøkkel, så det samme ønsket " +
      "kan i prinsippet stå to ganger. Kolonnene i ønskeliste heter barn og gave, altså det samme som tabellene de peker på, og ikke bid og gid. " +
      "Eksempeldataene har ingen gave som heter hoppestokk eller Genser."
  };

  /* ---------- ER-modellen i oppgave 4 (fra arket) ---------- */
  var ER_4 = {
    entiteter: [
      { id: "BRIKKE", navn: "BRIKKE", svak: false, pos: [4, 0],
        attr: [{ navn: "Farge", avledet: true }, { navn: "Symbol", nokkel: true }, { navn: "Verdi" }] },
      { id: "PARTI", navn: "PARTI", svak: false, pos: [1, 2],
        attr: [{ navn: "ID", nokkel: true }, { navn: "TID", deler: [{ navn: "Start" }, { navn: "Slutt" }] }] },
      { id: "TREKK", navn: "TREKK", svak: true, pos: [4, 2],
        attr: [{ navn: "Flytt", delvisNokkel: true, deler: [{ navn: "FraRute" }, { navn: "TilRute" }] }] },
      { id: "ÅPNING", navn: "ÅPNING", svak: false, pos: [4, 4],
        attr: [{ navn: "Navn", nokkel: true }, { navn: "ECO", nokkel: true }] },
      { id: "SPILLER", navn: "SPILLER", svak: false, pos: [1, 5],
        attr: [{ navn: "Navn" }, { navn: "Klubb" }, { navn: "Rating" }, { navn: "Personnr", nokkel: true }] }
    ],
    relasjoner: [
      { id: "FLYTTER", navn: "FLYTTER", identifiserende: true, pos: [4, 1],
        ledd: [{ entitet: "BRIKKE", kard: "1", total: false }, { entitet: "TREKK", kard: "N", total: true }], attr: [] },
      { id: "DEL_AV", navn: "DEL_AV", identifiserende: false, pos: [3, 2],
        ledd: [{ entitet: "PARTI", kard: "M", total: true }, { entitet: "TREKK", kard: "N", total: false }],
        attr: [{ navn: "TrekkNummer" }] },
      { id: "SORT_SPILLER", navn: "SORT_SPILLER", identifiserende: false, pos: [0, 3],
        ledd: [{ entitet: "PARTI", kard: "N", total: true }, { entitet: "SPILLER", kard: "1", total: false }], attr: [] },
      { id: "HVIT_SPILLER", navn: "HVIT_SPILLER", identifiserende: false, pos: [2, 3],
        ledd: [{ entitet: "PARTI", kard: "N", total: true }, { entitet: "SPILLER", kard: "1", total: false }], attr: [] },
      { id: "HAR_ÅPNING", navn: "HAR_ÅPNING", identifiserende: false, pos: [3, 4],
        ledd: [{ entitet: "PARTI", kard: "N", total: true }, { entitet: "ÅPNING", kard: "1", total: false }],
        attr: [{ navn: "Variasjon" }] },
      { id: "BESTÅR_AV", navn: "BESTÅR_AV", identifiserende: false, pos: [4, 3],
        ledd: [{ entitet: "TREKK", kard: "N", total: false }, { entitet: "ÅPNING", kard: "M", total: true }],
        attr: [{ navn: "TrekkNummer" }] },
      { id: "FORETREKKER", navn: "FORETREKKER", identifiserende: false, pos: [3, 5],
        ledd: [{ entitet: "SPILLER", kard: "N", total: true }, { entitet: "ÅPNING", kard: "M", total: false }], attr: [] }
    ],
    merknad: "Tegnet etter figur 1 på arket. Doble streker (total deltakelse) står ved PARTI i DEL_AV, SORT_SPILLER, HVIT_SPILLER og HAR_ÅPNING, " +
      "ved TREKK i FLYTTER, ved ÅPNING i BESTÅR_AV og ved SPILLER i FORETREKKER. Farge er et utledbart attributt (stiplet oval), og Flytt er en sammensatt svak nøkkel."
  };

  /* ---------- Våre ER-svar (Chen-notasjon) ---------- */
  var ER_1_SVAR = {
    entiteter: [
      { id: "BRUKER", navn: "BRUKER", svak: false, pos: [0, 0],
        attr: [{ navn: "ID", nokkel: true }, { navn: "Epost", nokkel: true }, { navn: "Passord" }, { navn: "Registrert" },
               { navn: "Navn", deler: [{ navn: "Fornavn" }, { navn: "Etternavn" }] }, { navn: "Bosted" }, { navn: "Telefonnr", flerverdi: true }] },
      { id: "ORGANISASJON", navn: "ORGANISASJON", svak: false, pos: [2, 0],
        attr: [{ navn: "Navn", nokkel: true }, { navn: "Nettside" }] }
    ],
    relasjoner: [
      { id: "TILKNYTTET", navn: "TILKNYTTET", identifiserende: false, pos: [1, 0],
        ledd: [{ entitet: "BRUKER", kard: "N", total: true }, { entitet: "ORGANISASJON", kard: "M", total: false }], attr: [] }
    ],
    merknad: "ID og Epost er to separate nøkler. Brukergruppen til en organisasjon er her rett og slett brukerne som er TILKNYTTET den, så den trenger ingen egen entitet."
  };

  var ER_2_SVAR = {
    entiteter: [
      { id: "BRUKER", navn: "BRUKER", svak: false, pos: [0, 0], attr: [{ navn: "ID", nokkel: true }] },
      { id: "MAPPE", navn: "MAPPE", svak: false, pos: [0, 2], attr: [{ navn: "Sti", nokkel: true }] },
      { id: "FIL", navn: "FIL", svak: true, pos: [2, 2],
        attr: [{ navn: "Filnavn", delvisNokkel: true }, { navn: "Språk" }] }
    ],
    relasjoner: [
      { id: "OPPRETTET", navn: "OPPRETTET", identifiserende: false, pos: [0, 1],
        ledd: [{ entitet: "BRUKER", kard: "1", total: true }, { entitet: "MAPPE", kard: "N", total: true }], attr: [] },
      { id: "INNEHOLDER", navn: "INNEHOLDER", identifiserende: true, pos: [1, 2],
        ledd: [{ entitet: "MAPPE", kard: "1", total: false }, { entitet: "FIL", kard: "N", total: true }], attr: [] },
      { id: "LASTET_OPP", navn: "LASTET_OPP", identifiserende: false, pos: [1, 1],
        ledd: [{ entitet: "BRUKER", kard: "1", total: false }, { entitet: "FIL", kard: "N", total: true }],
        attr: [{ navn: "Tidspunkt" }] },
      { id: "ENDRET", navn: "ENDRET", identifiserende: false, pos: [2, 0],
        ledd: [{ entitet: "BRUKER", kard: "N", total: false }, { entitet: "FIL", kard: "M", total: false }],
        attr: [{ navn: "Tidspunkt" }] }
    ],
    merknad: "BRUKER er tegnet med bare nøkkelen fra oppgave 1. FIL er svak: filnavnet er bare unikt innen mappen. Tidspunktet for opplasting kunne også stått på FIL, siden hver fil lastes opp nøyaktig én gang."
  };

  var ER_3_SVAR = {
    entiteter: [
      { id: "BRUKER", navn: "BRUKER", svak: false, pos: [0, 2], attr: [{ navn: "ID", nokkel: true }] },
      { id: "RETTIGHET", navn: "RETTIGHET", svak: false, pos: [3, 0],
        attr: [{ navn: "Kode", nokkel: true }, { navn: "Navn", flerverdi: true }] },
      { id: "OPERASJON", navn: "OPERASJON", svak: false, pos: [3, 2], attr: [{ navn: "Navn", nokkel: true }] },
      { id: "FIL", navn: "FIL", svak: true, pos: [1, 4], attr: [{ navn: "Filnavn", delvisNokkel: true }] }
    ],
    relasjoner: [
      { id: "ER_GITT", navn: "ER_GITT", identifiserende: false, pos: [1, 0],
        ledd: [{ entitet: "BRUKER", kard: "N", total: false }, { entitet: "RETTIGHET", kard: "M", total: false }], attr: [] },
      { id: "KREVER", navn: "KREVER", identifiserende: false, pos: [3, 1],
        ledd: [{ entitet: "RETTIGHET", kard: "1", total: true }, { entitet: "OPERASJON", kard: "1", total: true }], attr: [] },
      { id: "UTFØRER", navn: "UTFØRER", identifiserende: false, pos: [1, 2],
        ledd: [{ entitet: "BRUKER", kard: "N", total: false }, { entitet: "OPERASJON", kard: "M", total: false },
               { entitet: "FIL", kard: "P", total: true }], attr: [] }
    ],
    merknad: "BRUKER og FIL er tegnet med bare nøklene fra oppgave 1 og 2 (FIL er fortsatt svak og identifiseres via MAPPE som i oppgave 2). " +
      "UTFØRER er ternær, og FIL har total deltakelse fordi opprettelsen av hver fil er en operasjonsutførelse."
  };

  /* ---------- Felles tekst ---------- */
  var PROVE_AVVIK = "Dette er prøveeksamen høsten 2020, ikke en ordinær eksamen. Det finnes ingen sensorveiledning, så poengene per del er ukjente utover totalen på arket.";
  var PROVE_INTRO = "<p><b>Prøveeksamen:</b> det finnes ingen sensorveiledning for denne oppgaven. Svaret under er vårt eget, sjekket mot " +
    "instituttets løsningsforslag. «Gir poeng for» er vårt anslag over hva en sensor ser etter, ikke en offisiell poengfordeling.</p>";
  var MOD_INTRO = "<p><b>1 Modellering (40)</b></p><p>Lag en ER-modell for databasen til et nettsted (kalt FileShare) som har som formål å gjøre " +
    "det mulig for brukere å lagre, konvertere og dele filer.</p><ul>" +
    "<li>Du må gjerne dele modellen opp i deler (f.eks. over flere sider), men sørg for at det fremkommer tydelig hvilke deler av modellen som besvarer hvilke oppgaver.</li>" +
    "<li>Du må gjerne inkludere kommentarer i modellene. Dersom det er uklarheter eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar " +
    "til modellene dine om hvilke antagelser og tolkninger du eventuelt gjør.</li>" +
    "<li>Dersom du ser at det er mulig å modellere deler av oppgaven på flere ulike måter, diskuter kort hvordan din fremgangsmåte er i forhold til de ulike alternativene.</li>" +
    "<li>Tegn og skriv tydelig.</li></ul>";
  var SQL_AVVIK = "Databaseskjemaet og eksempeldataene står én gang i årets databaseskjema over.";
  function kilde(nr) { return "Oppgavetekst: UiO, IN2090, prøveeksamen høsten 2020, oppgave " + nr; }

  var EKS_7 = "<table class=\"tbl\"><thead><tr><th>bid</th><th>barn</th><th>gid</th><th>gave</th><th>snill</th><th>nyttig</th></tr></thead><tbody>" +
    [["6", "Jasmin", "7", "Bok", "t", "t"], ["1", "Kari", "6", "Dukke", "t", "f"], ["1", "Kari", "0", "Lekebil", "t", "f"],
     ["5", "Kine", "4", "Dataspill", "f", "f"], ["5", "Kine", "3", "Lekepistol", "f", "f"], ["5", "Kine", "1", "Sokker", "f", "t"],
     ["4", "Mari", "0", "Lekebil", "f", "f"], ["4", "Mari", "3", "Lekepistol", "f", "f"], ["3", "Nils", "2", "Sykkel", "t", "t"],
     ["0", "Ola", "6", "Dukke", "t", "f"], ["0", "Ola", "5", "Fuglebrett", "t", "t"]]
      .map(function (r) { return "<tr><td>" + r.join("</td><td>") + "</td></tr>"; }).join("") + "</tbody></table>";

  BANK["P2020"] = {
    year: "P2020", prove: true,
    navn: "Prøveeksamen 2020", dato: "Høsten 2020", varighet: "4 timer",
    hjelpemidler: "Alle hjelpemidler tillatt",
    merknad: "Prøveeksamen, ikke ordinær eksamen. Det finnes ingen sensorveiledning, bare et løsningsforslag, som her er gjengitt med egne ord. " +
      "Prøveeksamen teller ikke med i vektingen av eksamensmønsteret. Forsiden skriver «Tillatte hjelpemider» og «maksimal peongsum».",
    deler: [{ navn: "Modellering", poeng: 40 }, { navn: "SQL", poeng: 40 }, { navn: "Relasjonsmodellen og dekomponering", poeng: 20 }],
    skjema: SKJEMA,
    er: { "4": ER_4 },
    oppgaver: [
      /* ===================== 1 Modellering ===================== */
      {
        key: "P2020-1", year: "P2020", oppgave_nr: "Oppgave 1", kilde: kilde(1),
        ark: "Brukere", title: "FileShare: brukere og organisasjoner",
        points: 7, block: "er", tema: ["entitet", "nøkkel", "sammensatt attributt", "flerverdiattributt", "M:N", "total deltakelse"], ordrett: true,
        oppgave: MOD_INTRO + "<p><b>1 Brukere (7)</b></p>" +
          "<p>Lag en ER-modell som fanger opp informasjon om brukere og brukergrupper på FileShare: En viktig funksjon for nettstedet FileShare er " +
          "å kunne holde orden på informasjon om brukerne som er registrert på nettsiden. For enkelhets skyld identifiserer FileShare sine brukere " +
          "internt med unike IDer (f.eks. 324). Informasjon som kreves av brukere av FileShare er e-postadresse, passord (kryptert, selvfølgelig), " +
          "og tidspunktet da brukeren registrerte seg på FileShare. FileShare tillater ikke brukere å registrere mer enn én e-postadresse, og den " +
          "samme adressen kan ikke benyttes av flere brukere. I tillegg kan brukere legge inn navn (bestående av for- og etternavn), stedet der " +
          "brukeren bor, samt brukerens telefonnumre (potensielt fler nummere per bruker).</p>" +
          "<p>Brukere organiseres i brukergrupper som er tilknyttet organisasjoner. FileShare lagrer navnet på organisasjonen brukergruppe er " +
          "tilknyttet, samt organisasjonens nettside. Organisasjoner har et unikt navn. Hver bruker er tilknyttet én eller fler organisasjoner, og " +
          "en organisasjon kan ha mange brukere.</p>",
        avvik: PROVE_AVVIK,
        losning: [
          "BRUKER får to separate nøkler: ID og Epost (én adresse per bruker, og ingen adresse deles).",
          "Passord og registreringstidspunkt er vanlige attributter. Navn er sammensatt (Fornavn, Etternavn), Telefonnr er flerverdi, og bostedet er et vanlig attributt.",
          "ORGANISASJON har Navn som nøkkel og Nettside.",
          "TILKNYTTET er M:N. «Én eller fler organisasjoner» gir total deltakelse for BRUKER."
        ],
        tips: [
          "«Unik» om to ulike attributter betyr to nøkler, hver understreket for seg, ikke én sammensatt nøkkel.",
          "Teksten nevner både brukergrupper og organisasjoner. Skriv en kommentar om hvordan du tolker det. Løsningsforslaget kaller entiteten BRUKERGRUPPE, men gir den organisasjonens attributter.",
          "Sammensatt (Navn) og flerverdi (Telefonnr) har hver sin tegning: barneovaler og dobbel oval. Ikke bland dem."
        ],
        del1: null
      },
      {
        key: "P2020-2", year: "P2020", oppgave_nr: "Oppgave 2", kilde: kilde(2),
        ark: "Filer og mapper", title: "FileShare: mapper og filer (svak entitet)",
        points: 13, block: "er", tema: ["svak entitet", "identifiserende relasjon", "1:N", "M:N", "relasjonsattributt", "total deltakelse"], ordrett: true,
        oppgave: "<p><b>2 Filer og mapper (13)</b></p>" +
          "<p>Utvid modellen med informasjon om filer og mapper og hvordan de lagres på FileShare: En av kjernefunksjonene til FileShare er å lagre " +
          "informasjon om filer lastet opp av brukere på FileShare. Hver bruker kan opprette én eller fler mapper, men en mappe er opprettet av " +
          "nøyaktig én bruker. Hver mappe har en unik sti (f.eks. /home/jon/xls/). En mappe kan så inneholde potensielt mange filer.</p>" +
          "<p>Filer kan lastes opp av brukere, og blir lagret i filsystemet til FileShare. Filene identifiseres internt av en unik kombinasjon av " +
          "mappen der filen er lagret i filsystemet og filens navn (f.eks. lønn.xls). FileShare vil lagre informasjon om hvilke brukere som lastet " +
          "opp hvilke filer, samt når hver fil ble lastet opp til FileShare. I tillegg til navn og lokasjon må FileShare for filer også lagre " +
          "informasjon om språket til filen. F.eks. test.pdf er et dokument skrevet på engelsk. For eksekverbare filer vil språket være " +
          "programmeringsspråket filene ble skrevet i (f.eks. run.exe ble skrevet i C). En fil kan bli lastet opp av nøyaktig én bruker, men en " +
          "bruker kan laste opp mange filer.</p>" +
          "<p>Brukere kan også endre filer, og FilShare ønsker å lagre når en bruker sist endret en fil (altså kun ett tidspunkt per kombinasjon av " +
          "bruker og fil). Hver bruker kan endre mange filer, og hver fil kan endres av mange brukere.</p>",
        avvik: PROVE_AVVIK + " Den felles innledningen til modelleringsdelen står i oppgave 1.",
        losning: [
          "MAPPE har Sti som nøkkel. OPPRETTET er 1:N fra BRUKER til MAPPE, med total deltakelse på begge sider («én eller fler mapper», «nøyaktig én bruker»).",
          "En fil identifiseres av mappen pluss filnavnet, så FIL blir en svak entitet med Filnavn som svak nøkkel. Den identifiserende entiteten er MAPPE, via den identifiserende relasjonen INNEHOLDER. Språk er et vanlig attributt på FIL.",
          "LASTET_OPP er 1:N fra BRUKER til FIL med total deltakelse for FIL (nøyaktig én opplaster). Tidspunktet står på relasjonen (eller på FIL).",
          "ENDRET er M:N mellom BRUKER og FIL med attributtet Tidspunkt. Bare ett tidspunkt per par passer med at et relasjonsattributt har én verdi per par."
        ],
        tips: [
          "«Identifiseres av en unik kombinasjon av mappen og filens navn» er signalordet for svak entitet. Marker både dobbelt rektangel og dobbel rombe.",
          "Mappen er en egen entitet, ikke et attributt på filen, fordi den har sin egen nøkkel og opprettes av en bruker.",
          "Sjekk at «sist endret» kan stå på en M:N-relasjon: én verdi per par bruker–fil er akkurat det et relasjonsattributt gir.",
          "Opplastingstidspunktet kan flyttes til FIL fordi hver fil har nøyaktig én opplasting. Realiseringen blir den samme uansett. Si det gjerne i en kommentar."
        ],
        del1: null
      },
      {
        key: "P2020-3", year: "P2020", oppgave_nr: "Oppgave 3", kilde: kilde(3),
        ark: "Operasjoner", title: "FileShare: operasjoner og rettigheter (ternær)",
        points: 10, block: "er", tema: ["ternær relasjon", "1:1", "M:N", "flerverdiattributt", "total deltakelse"], ordrett: true,
        oppgave: "<p><b>3 Operasjoner (10)</b></p>" +
          "<p>Støtte for å utføre operasjoner på de lagrede filene er en annen viktig funksjon hos FileShare. En operasjon har et unikt navn " +
          "(f.eks. FlyttFil eller KjørFil). Operasjoner krever rettigheter for å kunne kjøre. Men for å gjøre det enkelt har FileShare laget " +
          "nøyaktig én rettighet per operasjon. Altså krever hver operasjon næyaktig én rettigheter og en rettighet er påkrevd for nøyaktig én " +
          "operasjon. Rettigheter er identifisert med en kode, og kan ha en eller fler navn, f.eks. Administrator eller Eier.</p>" +
          "<p>Brukere kan ha ingen eller fler rettigheter, og hver rettighet kan naturligvis være gitt til mange brukere.</p>" +
          "<p>Brukere kan utføre operasjoner på filer. F.eks. “Brukeren 324 utførte KjørFil-operasjonen på filen run.exe (i mappen /home/jon/xls)”. " +
          "En bruker kan utføre mange operasjoner på samme fil; en operasjon kan utføres på mange filer av en bruker; og en operasjon kan utføres " +
          "av mange brukere på samme fil. Ettersom opprettelsen av en fil også blir lagret som en operasjon vil alle filer være del av minst én " +
          "operasjonsutførelse.</p>",
        avvik: PROVE_AVVIK + " Den felles innledningen til modelleringsdelen står i oppgave 1.",
        losning: [
          "OPERASJON har Navn som nøkkel. RETTIGHET har Kode som nøkkel og Navn som flerverdiattributt («en eller fler navn»).",
          "KREVER er 1:1 med total deltakelse på begge sider («nøyaktig én» begge veier).",
          "ER_GITT er M:N mellom BRUKER og RETTIGHET, partiell på begge sider («ingen eller fler»).",
          "Utførelsen kobler tre ting på én gang: bruker, operasjon og fil. Det blir den ternære relasjonen UTFØRER med «mange» på alle tre leddene.",
          "Hver fil er med i minst én utførelse, så FIL har total deltakelse i UTFØRER."
        ],
        tips: [
          "Les de tre «mange»-setningene som én hver: gitt to av deltakerne, hvor mange av den tredje? Alle tre svarene er «mange», altså N, M og P.",
          "Tre binære relasjoner kan ikke si hvilken bruker som kjørte hvilken operasjon på hvilken fil. Det er derfor oppgaven trenger en ternær relasjon.",
          "1:1 med total deltakelse på begge sider betyr at RETTIGHET og OPERASJON kunne vært slått sammen. Å beholde dem hver for seg følger teksten og er tydeligst. Nevn valget i en kommentar."
        ],
        del1: null
      },
      {
        key: "P2020-4", year: "P2020", oppgave_nr: "Oppgave 4", kilde: kilde(4),
        ark: "Realisering", title: "Sjakk: parti, spiller, trekk og åpning til relasjoner",
        points: 10, block: "realisering", tema: ["realisering", "svak entitet", "1:N", "M:N", "sammensatt attributt", "utledbart attributt", "to kandidatnøkler"], ordrett: true,
        oppgave: "<p><b>4 Realisering (10)</b></p>" +
          "<p>Realiser ER-modellen i figur 1 til et relasjonsdatabaseskjema. Relasjonsdatabaseskjemaet skal være korrekt (tilsvare ER-modellen), " +
          "effektivt (unngå redundans og begrens antallet tabeller), og tydelig (lett å forstå). Bruk realiseringsalgoritmen for å danne et slikt " +
          "relasjonsdatabaseskjema. For hver relasjon, spesifiser relasjonens navn og navnet til hvert attributt. Du skal ikke spesifisere " +
          "datatyper/domener for attributtene, og ikke benytte SQL i denne oppgaven. Marker primærnøkler med én understrek. Dersom en relasjon har " +
          "flere kandidatnøkler, marker alle kandidatnøkler med én strek, og primærnøkkelen med fet skrift i tillegg. Skriv fremmednøkler enten med " +
          "ord (T(A) referer til S(B)) eller på formen T(A) → S(B) for å indikere at relasjon T sin A-attributt er en fremmednøkkel som peker på " +
          "relasjon S sin B-attributt.</p>",
        avvik: PROVE_AVVIK + " ER-modellen (figur 1 på arket) er tegnet på nytt under oppgaven. Uten understreking og fet skrift bruker vi kursets " +
          "tekstformat (KN, PN og FN på egne linjer).",
        losning: [
          "Vanlige entiteter: Parti (den sammensatte TID blir Start og Slutt), Spiller, Brikke (Farge er utledbart og droppes) og Åpning (to KN, Navn og ECO).",
          "Svak entitet: Trekk får PN-en til den identifiserende entiteten (Symbol) pluss den svake nøkkelen, som er sammensatt (FraRute, TilRute). FLYTTER blir ikke en egen tabell.",
          "Ingen 1:1. De tre 1:N-relasjonene fra PARTI (HVIT_SPILLER, SORT_SPILLER, HAR_ÅPNING) blir fremmednøkler i Parti, og Variasjon følger med.",
          "M:N: DEL_AV, BESTÅR_AV og FORETREKKER blir egne tabeller. PN er alle fremmednøkkelattributtene, og TrekkNummer er et vanlig attributt.",
          "Ingen flerverdiattributter. Resultatet er åtte tabeller."
        ],
        tips: [
          "Fremmednøkkelen til en svak entitet er sammensatt: (Symbol, FraRute, TilRute) peker samlet på Trekk. Skriv den som én FN, ikke tre.",
          "To relasjoner mellom samme par entiteter (HVIT_SPILLER og SORT_SPILLER) gir to fremmednøkler med hvert sitt navn.",
          "Total deltakelse på N-siden av en 1:N betyr at fremmednøkkelen ikke kan være NULL. Total deltakelse i en M:N (som PARTI i DEL_AV) kan ikke håndheves med fremmednøkler.",
          "Utledbare attributter (stiplet oval) tas ikke med. Sammensatte attributter blir bare bladene.",
          "Begrunn valg av PN når det finnes flere KN, som for Åpning."
        ],
        del1: null
      },

      /* ===================== 2 SQL ===================== */
      {
        key: "P2020-5", year: "P2020", oppgave_nr: "Oppgave 5", kilde: kilde(5),
        ark: "Snille barn", title: "UPDATE: barn 0 er ikke snill lenger",
        points: 5, block: "sql", tema: ["UPDATE", "WHERE"], ordrett: true,
        oppgave: "<p><b>2 SQL (40)</b></p><p><b>5 Snille barn (5)</b></p>" +
          "<p>Skriv en SQL-kommando som oppdaterer barnet med <code>bid</code> lik <code>0</code> sin <code>snill</code>-verdi til <code>false</code>.</p>",
        avvik: PROVE_AVVIK + " " + SQL_AVVIK,
        losning: [
          "UPDATE endrer rader som finnes. SET sier hvilken kolonne som får ny verdi, og WHERE sier hvilke rader.",
          "Filtrer på primærnøkkelen bid, så treffer kommandoen nøyaktig ett barn (Ola i eksempeldataene)."
        ],
        tips: [
          "Uten WHERE blir alle barna usnille. Det er den klassiske UPDATE-feilen.",
          "Boolske verdier skrives false/true uten fnutter."
        ],
        del1: null
      },
      {
        key: "P2020-6", year: "P2020", oppgave_nr: "Oppgave 6", kilde: kilde(6),
        ark: "Nyttige gaver", title: "Barn som ønsker seg nyttige gaver som starter med «Sokker»",
        points: 5, block: "sql", tema: ["INNER JOIN", "LIKE", "boolsk kolonne"], ordrett: true,
        oppgave: "<p><b>6 Nyttige gaver (5)</b></p>" +
          "<p>Skriv en spørring som finner alle barn som ønsker seg nyttige gaver som har navn som starter med strengen <code>'Sokker'</code>. " +
          "Spørringen skal returnere navnet på barnet og navnet på gaven.</p>",
        avvik: PROVE_AVVIK + " " + SQL_AVVIK,
        losning: [
          "Barnenavn og gavenavn ligger i hver sin tabell, og ønskeliste kobler dem. Join alle tre.",
          "Behold radene der gaven er nyttig og navnet starter med Sokker (LIKE 'Sokker%').",
          "Begge tabellene har kolonnen navn, så gi kolonnene i SELECT hvert sitt alias.",
          "På eksempeldataene: én rad, Kine og Sokker."
        ],
        tips: [
          "«Starter med» er 'Sokker%'. '%Sokker%' betyr «inneholder».",
          "NATURAL JOIN virker ikke her: barn og gave har begge kolonnen navn, og ønskeliste bruker kolonnenavnene barn og gave, ikke bid og gid.",
          "En boolsk kolonne kan stå alene i WHERE: WHERE g.nyttig betyr det samme som WHERE g.nyttig = true."
        ],
        del1: null
      },
      {
        key: "P2020-7", year: "P2020", oppgave_nr: "Oppgave 7", kilde: kilde(7),
        ark: "Oversikts-VIEW", title: "VIEW oversikt: ett ønske per rad, sortert",
        points: 5, block: "sql-videre", tema: ["VIEW", "INNER JOIN", "ORDER BY", "alias"], ordrett: true,
        oppgave: "<p><b>7 Oversikts-VIEW (5)</b></p>" +
          "<p>Skriv en SQL-kommando som lager et VIEW som heter <code>oversikt</code> og inneholder én rad for hvert ønske med <code>bid</code> og " +
          "navnet på barnet som har ønsket, <code>gid</code> og navnet på gaven som er ønsket, hvorvidt barnet har vært snill, og hvorvidt gaven er " +
          "nyttig. VIEWet skal være sortert først på barnets navn, og så på gavens navn i alfabetisk rekkefølge.</p>" +
          "<p>Innholdet i VIEWet kan f.eks. se slik ut:</p>" + EKS_7,
        avvik: PROVE_AVVIK + " " + SQL_AVVIK,
        losning: [
          "Samme join som i oppgave 6: barn, ønskeliste og gave.",
          "Kolonnene bid, barnets navn (alias barn), gid, gavens navn (alias gave), snill og nyttig, i den rekkefølgen eksempelet viser.",
          "ORDER BY barnets navn og deretter gavens navn.",
          "Pakk spørringen inn i CREATE VIEW oversikt AS …. Viewet gir de 11 radene i eksempelet."
        ],
        tips: [
          "Aliasene barn og gave er viktige. De senere oppgavene bruker kolonnenavnene i viewet.",
          "Skriv ORDER BY b.navn, g.navn. Da er det helt klart hvilken kolonne du mener: ønskeliste har også kolonner som heter barn og gave.",
          "Sorteringen i et view gjelder bare når du leser hele viewet. Bruker du viewet i en ny spørring, må du sortere på nytt hvis rekkefølgen betyr noe."
        ],
        del1: null
      },
      {
        key: "P2020-8", year: "P2020", oppgave_nr: "Oppgave 8", kilde: kilde(8),
        ark: "Like ønkser", title: "Par av ulike barn med samme ønske (self-join)",
        points: 5, block: "sql", tema: ["self-join", "DISTINCT", "alias"], ordrett: true,
        oppgave: "<p><b>8 Like ønkser (5)</b></p>" +
          "<p>Skriv en SQL-spørring som finner alle par av <i>ulike</i> barn som har ønsket seg det samme. Svaret skal kun inneholde unike rader. " +
          "Du kan benytte <code>VIEW</code>et fra oppgave 7 om du ønsker.</p>",
        avvik: PROVE_AVVIK + " " + SQL_AVVIK,
        losning: [
          "Join ønskeliste med seg selv på samme gave. Da står to ønsker om samme gave på samme rad.",
          "Krev at de to barna er ulike. Med &lt; i stedet for != får hvert par bare én rekkefølge.",
          "Join med barn to ganger for å få navnene, og bruk DISTINCT slik at to barn med flere felles ønsker bare gir én rad.",
          "På eksempeldataene: (Ola, Kari) via Dukke, (Kari, Mari) via Lekebil og (Mari, Kine) via Lekepistol. Med != får du de samme parene i begge rekkefølger, altså 6 rader."
        ],
        tips: [
          "En self-join trenger to aliaser for samme tabell (ø1 og ø2, b1 og b2).",
          "Uten betingelsen på ulike barn pares hvert barn med seg selv.",
          "Løsningsforslaget bruker != og får begge rekkefølgene. Begge tolkningene av «par» er rimelige. Skriv en kommentar om hvilken du velger."
        ],
        del1: null
      },
      {
        key: "P2020-9", year: "P2020", oppgave_nr: "Oppgave 9", kilde: kilde(9),
        ark: "Populære gaver", title: "Topp 3 nyttige og topp 3 unyttige gaver",
        points: 10, block: "sql-videre", tema: ["WITH", "GROUP BY", "count", "ORDER BY", "LIMIT", "UNION"], ordrett: true,
        oppgave: "<p><b>9 Populære gaver (10)</b></p>" +
          "<p>Skriv en spørring som finner de tre mest populære nyttige gavene, og de tre mest populære unyttige gavene. Resultatet skal inneholde " +
          "navn på gaven, antall barn som ønsker gaven, samt hvorvidt den er nyttig eller ikke. Du kan benytte view’et fra oppgave 7.</p>",
        avvik: PROVE_AVVIK + " " + SQL_AVVIK,
        losning: [
          "Tell først antall barn per gave (GROUP BY gaven, count av barna).",
          "Ta de tre øverste blant de nyttige og de tre øverste blant de unyttige, hver for seg, med ORDER BY antall DESC og LIMIT 3.",
          "Slå sammen de to topplistene med UNION ALL. Legg hver toppliste i en egen WITH-del, for ORDER BY og LIMIT kan ikke stå rett inne i en del av en UNION.",
          "På eksempeldataene har alle de nyttige gavene ett ønske hver. Med navnet som tiebreaker blir det Bok, Fuglebrett og Sokker. De unyttige er Dukke, Lekebil og Lekepistol med to ønsker hver."
        ],
        tips: [
          "ORDER BY … LIMIT 3 rett før UNION er en syntaksfeil i PostgreSQL. Bruk WITH (eller parenteser rundt hver del).",
          "ønskeliste har ingen primærnøkkel. count(DISTINCT barn) teller barn, ikke rader, hvis samme ønske står to ganger.",
          "Grupper på gid, ikke bare navnet, så to gaver med samme navn ikke slås sammen.",
          "Ved likt antall er det tilfeldig hvem som kommer med i topp 3. Legg til en tiebreaker (her navnet) og nevn det."
        ],
        del1: null
      },
      {
        key: "P2020-10", year: "P2020", oppgave_nr: "Oppgave 10", kilde: kilde(10),
        ark: "Gaveliste", title: "Gaveliste: snille får alt, usnille nyttig eller Genser",
        points: 10, block: "sql-videre", tema: ["WITH", "UNION ALL", "NOT EXISTS", "konstant i SELECT"], ordrett: true,
        oppgave: "<p><b>10 Gaveliste (10)</b></p>" +
          "<p>Skriv en spørring som tilordner gaver til barn i henhold til følgende regler:</p><ul>" +
          "<li>Snille barn får alt de ønsker seg</li>" +
          "<li>Usnille får kun nyttige ting de ønsker seg. Om de ikke ønsker seg noen nyttige ting får de gaven med navn <code>'Genser'</code>.</li></ul>" +
          "<p>Spørringen skal skrive ut navnet på barnet og navnet på gaven. Merk, du kan bruke view’et fra oppgave 7.</p>",
        avvik: PROVE_AVVIK + " " + SQL_AVVIK,
        losning: [
          "Del opp i tre grupper som hver gir rader (barn, gave), og slå dem sammen med UNION ALL.",
          "Gruppe 1: snille barn og alle gavene de ønsker seg.",
          "Gruppe 2: usnille barn og de nyttige gavene de ønsker seg. Legg den i WITH, siden gruppe 3 trenger den.",
          "Gruppe 3: usnille barn som ikke finnes i gruppe 2, med konstanten 'Genser' som gave. Ta utgangspunkt i barn-tabellen, så også usnille barn uten ønsker kommer med.",
          "På eksempeldataene (uten endringen fra oppgave 5): 9 rader. Ola, Kari, Nils og Jasmin får ønskene sine (6 rader), Kine får Sokker, og Per og Mari får Genser."
        ],
        tips: [
          "Genser finnes ikke i gave-tabellen. Skriv den som en konstant i SELECT: 'Genser' AS gave.",
          "Per har ingen ønsker i det hele tatt. Starter du fra ønskelisten (eller viewet), forsvinner han, og han skal ha Genser.",
          "«Har ingen nyttige ønsker» er en «finnes ikke»-betingelse. Bruk NOT EXISTS (eller NOT IN på bid, som aldri er NULL).",
          "Har du kjørt UPDATE-en fra oppgave 5, er Ola usnill, og da får han bare Fuglebrett."
        ],
        del1: null
      },

      /* ===================== 3 Relasjonsmodellen og dekomponering ===================== */
      {
        key: "P2020-11", year: "P2020", oppgave_nr: "Oppgave 11", kilde: kilde(11),
        ark: "Relasjonsalgebra", title: "RA: navn på barn som ønsker seg hoppestokk",
        points: 5, block: "relasjonsalgebra", tema: ["relasjonsalgebra", "seleksjon", "projeksjon", "join"], ordrett: true,
        oppgave: "<p><b>3 Relasjonsmodellen og dekomponering (20)</b></p><p><b>11 Relasjonsalgebra (5)</b></p>" +
          "<p>I denne oppgaven skal du bruke samme databaseskjame som oppgavene i SQL.</p>" +
          "<p>Sriv et uttrykk i relasjonsalgebraen som finner navn på alle barn som ønsker seg <code>hoppestokk</code>.</p>",
        avvik: PROVE_AVVIK + " " + SQL_AVVIK,
        losning: [
          "Velg gaven med σ på navnet, og behold bare gid med π. Da forsvinner gavens navn-kolonne, som ellers ville kollidert med barnets.",
          "Join med ønskeliste på gave = gid, og behold barnets ID (kolonnen barn).",
          "Join med barn på bid = barn, og projiser til navn.",
          "Eksempeldataene har ingen hoppestokk, så svaret der er tomt."
        ],
        tips: [
          "Kolonnene i ønskeliste heter barn og gave, ikke bid og gid. Skriv derfor join-betingelsen med begge navnene (bid = barn).",
          "Både barn og gave har attributtet navn. Projiser bort gavens navn (eller døp det om med ρ) før du joiner, så er det ingen tvil om hvilket navn du får.",
          "π i relasjonsalgebra fjerner duplikater. Du trenger ikke noe tilsvarende DISTINCT.",
          "Skriv gjerne uttrykket i steg med navngitte mellomresultater (Navn := …). Det er lettere å lese og å rette."
        ],
        del1: null
      },
      {
        key: "P2020-12", year: "P2020", oppgave_nr: "Oppgave 12", kilde: kilde(12),
        ark: "Nøkler", title: "Finn alle kandidatnøkler i R(A, B, C, D, E)",
        points: 5, block: "fd", tema: ["kandidatnøkkel", "tillukning", "FD"], ordrett: true,
        oppgave: "<p><b>12 Nøkler (5)</b></p>" +
          "<p>Gitt følgende relasjon</p><p>R(A, B, C, D, E)</p><p>med FDene</p>" +
          "<ol><li>A → B</li><li>BC → D</li><li>DE → A</li></ol>" +
          "<p>Hvilke kandidatnøkler har R? Vis hvordan du kommer frem til svaret.</p>",
        avvik: PROVE_AVVIK,
        losning: [
          "C og E står aldri på en høyreside, så de er med i alle kandidatnøkler. Alle attributtene som står på en høyreside (A, B, D), står også på en venstreside, så ingen kan strykes på forhånd.",
          "{C, E}⁺ = {C, E}. Ingen FD har en venstreside inne i CE, så CE er ikke nok.",
          "Utvid med ett attributt om gangen: {A, C, E}⁺: A → B gir B, BC → D gir D. Hele R.",
          "{B, C, E}⁺: BC → D gir D, DE → A gir A. Hele R.",
          "{C, D, E}⁺: DE → A gir A, A → B gir B. Hele R.",
          "Alle tre er minimale, fordi CE alene ikke er nok. Enhver annen supernøkkel inneholder CE og minst ett av A, B og D, og altså en av disse tre. Kandidatnøklene er ACE, BCE og CDE."
        ],
        tips: [
          "Start med attributtene som aldri står på en høyreside. De må med i alle nøkler.",
          "Utvid med ett attributt om gangen og regn tillukning. Når en mengde er en nøkkel, trenger du ikke prøve noen mengde som inneholder den.",
          "Vis tillukningen for hver kandidat. «Vis hvordan» betyr at regningen gir poengene."
        ],
        del1: null
      },
      {
        key: "P2020-13", year: "P2020", oppgave_nr: "Oppgave 13", kilde: kilde(13),
        ark: "Tapsfri dekomponering", title: "Dekomponer R(A, B, C, D, E, F) tapsfritt til BCNF",
        points: 10, block: "normalisering", tema: ["BCNF", "tapsfri dekomposisjon", "tillukning", "kandidatnøkkel"], ordrett: true,
        oppgave: "<p><b>13 Tapsfri dekomponering (10)</b></p>" +
          "<p>Gitt følgende relasjon</p><p>R(A, B, C, D, E, F)</p><p>med kandidatnøkler AB og CD, og FDer:</p>" +
          "<ol><li>AB → C</li><li>AB → D</li><li>CD → A</li><li>CD → B</li><li>A → E</li><li>C → F</li></ol>" +
          "<p>Dekomponer relasjonen tapsfritt til BCNF. Vis hvordan du kommer frem til svaret. For hver relasjon du får underveis i dekomponeringen, " +
          "list opp hvilke FDer som holder, og hvilke kandidatnøkler relasjonen har.</p>",
        avvik: PROVE_AVVIK,
        losning: [
          "Kontroller nøklene: {A, B}⁺ og {C, D}⁺ er begge hele R. Ingen enkeltattributt er nøkkel ({A}⁺ = AE, {C}⁺ = CF), så de oppgitte nøklene stemmer.",
          "FD 1–4 har en supernøkkel på venstresiden. A → E bryter BCNF, fordi A ikke er supernøkkel.",
          "{A}⁺ = {A, E}. Del i S₁(A, E) og S₂(A, B, C, D, F). S₁ har FD-en A → E og nøkkelen A, og er på BCNF.",
          "S₂ har FD 1–4 og C → F, og nøklene AB og CD. C → F bryter BCNF i S₂.",
          "{C}⁺ i S₂ = {C, F}. Del S₂ i S₂₁(C, F) og S₂₂(A, B, C, D). S₂₁ har C → F og nøkkelen C. S₂₂ har FD 1–4 og nøklene AB og CD. Begge er på BCNF.",
          "Resultat: S₁(A, E), S₂₁(C, F) og S₂₂(A, B, C, D). Hver deling er tapsfri etter Fagins teorem, fordi fellesattributtet (først A, så C) er nøkkel i den ene delen."
        ],
        tips: [
          "Bruk tillukningen av venstresiden som den ene delen (X⁺) og X pluss resten som den andre. Da er tapsfriheten gitt.",
          "Skriv opp FD-er og kandidatnøkler for hver ny relasjon, også de mellomliggende (S₂). Oppgaven ber eksplisitt om det.",
          "Du kan like gjerne starte med C → F. Du ender med de samme tre tabellene.",
          "Sjekk alltid oppgitte nøkler med tillukning. Her stemmer de."
        ],
        del1: null
      }
    ]
  };

  /* =====================================================================
     Perfekte svar (egne ord; ingen sensorveiledning finnes for prøveeksamen)
     ===================================================================== */

  IN.PERFEKT["P2020-1"] = {
    type: "skjonn",
    intro: PROVE_INTRO,
    svar: [{
      del: "1",
      tekst: "<ul><li><b>BRUKER</b> med nøklene <u>ID</u> og <u>Epost</u> (hver for seg), Passord, Registrert, det sammensatte attributtet Navn (Fornavn, Etternavn), " +
        "Bosted og flerverdiattributtet Telefonnr.</li>" +
        "<li><b>ORGANISASJON</b> med nøkkelen <u>Navn</u> og Nettside.</li>" +
        "<li><b>TILKNYTTET</b> (M:N) mellom dem, med total deltakelse for BRUKER.</li></ul>" +
        "<p>Kommentar på tegningen: «Vi tolker brukergruppen til en organisasjon som brukerne som er tilknyttet den. Den har ingen egne opplysninger og trenger derfor ingen egen entitet.»</p>",
      er: ER_1_SVAR,
      poeng: ["BRUKER med to separate nøkler", "sammensatt Navn og flerverdi Telefonnr", "ORGANISASJON med nøkkel", "TILKNYTTET M:N med total deltakelse for BRUKER"]
    }],
    hvorfor: {
      eli5: "<p>Hver bruker har et kort med nummer, e-post, passord og når de meldte seg inn. Navnet består av to deler, og telefonnumrene er en hel liste. Brukere kan høre til flere klubber, og en klubb kan ha mange medlemmer.</p>",
      normal: "<p>ID og e-post er unike hver for seg, så begge blir nøkler. Navnet har deler og blir et sammensatt attributt, mens telefonnumrene er flere verdier av samme slag og blir et flerverdiattributt. «Én eller fler organisasjoner» og «mange brukere» gir en M:N-relasjon der brukeren må delta minst én gang.</p>",
      teknisk: "<p>Et sammensatt attributt består av forskjellige deler (fornavn og etternavn), mens et flerverdiattributt er en mengde verdier av samme type. Ved realisering blir det første til flere kolonner og det andre til en egen tabell. Total deltakelse for BRUKER i TILKNYTTET kommer fra «én eller fler». Organisasjonens side er partiell, siden teksten bare sier at den <i>kan</i> ha mange brukere. Løsningsforslaget kaller entiteten BRUKERGRUPPE med organisasjonens navn og nettside, så de to tolkningene gir samme modell.</p>"
    }
  };

  IN.PERFEKT["P2020-2"] = {
    type: "skjonn",
    intro: PROVE_INTRO,
    svar: [{
      del: "2",
      tekst: "<ul><li><b>MAPPE</b> med nøkkelen <u>Sti</u>. <b>OPPRETTET</b>: 1 ved BRUKER, N ved MAPPE, total deltakelse på begge sider.</li>" +
        "<li><b>FIL</b> er en svak entitet med svak nøkkel <u>Filnavn</u> (stiplet understrek) og attributtet Språk. Den identifiserende entiteten er MAPPE, via den identifiserende relasjonen <b>INNEHOLDER</b> (1 ved MAPPE, N og total deltakelse ved FIL).</li>" +
        "<li><b>LASTET_OPP</b>: 1 ved BRUKER, N ved FIL, total deltakelse for FIL, attributtet Tidspunkt.</li>" +
        "<li><b>ENDRET</b>: M:N mellom BRUKER og FIL med attributtet Tidspunkt (sist endret).</li></ul>",
      er: ER_2_SVAR,
      poeng: ["MAPPE og OPPRETTET med riktige kardinaliteter og total deltakelse", "FIL som svak entitet med INNEHOLDER som identifiserende relasjon", "LASTET_OPP 1:N med tidspunkt", "ENDRET M:N med tidspunkt"]
    }],
    hvorfor: {
      eli5: "<p>Filnavnet «lønn.xls» kan finnes i mange mapper, så en fil er bare entydig når du vet hvilken mappe den ligger i. Derfor henger filen fast i mappen sin. Hver fil har én som lastet den opp, men mange kan ha endret den.</p>",
      normal: "<p>Filen identifiseres av mappen pluss filnavnet, og det er definisjonen på en svak entitet. «Én eller fler mapper» og «nøyaktig én bruker» gir total deltakelse på begge sider av OPPRETTET. Opplastingen er 1:N, og endringene er M:N med ett tidspunkt per par.</p>",
      teknisk: "<p>En svak entitet har total deltakelse og 1 ved den identifiserende entiteten i den identifiserende relasjonen. Den svake nøkkelen (Filnavn) er bare unik innen én mappe. «Kun ett tidspunkt per kombinasjon av bruker og fil» passer med et relasjonsattributt på en M:N, som har nøyaktig én verdi per par. I en 1:N-relasjon kan et relasjonsattributt flyttes til N-siden uten tap. Derfor kan opplastingstidspunktet stå på FIL, og realiseringen blir den samme.</p>"
    }
  };

  IN.PERFEKT["P2020-3"] = {
    type: "skjonn",
    intro: PROVE_INTRO,
    svar: [{
      del: "3",
      tekst: "<ul><li><b>OPERASJON</b> med nøkkelen <u>Navn</u>. <b>RETTIGHET</b> med nøkkelen <u>Kode</u> og flerverdiattributtet Navn.</li>" +
        "<li><b>KREVER</b>: 1 på begge sider, total deltakelse på begge sider.</li>" +
        "<li><b>ER_GITT</b>: M:N mellom BRUKER og RETTIGHET, partiell på begge sider.</li>" +
        "<li><b>UTFØRER</b>: ternær mellom BRUKER (N), OPERASJON (M) og FIL (P), med total deltakelse for FIL.</li></ul>" +
        "<p>Kommentar på tegningen: «KREVER er 1:1 og total begge veier, så RETTIGHET og OPERASJON kunne vært slått sammen. Vi holder dem adskilt fordi teksten beskriver dem som to ting.»</p>",
      er: ER_3_SVAR,
      poeng: ["OPERASJON og RETTIGHET med nøkler og flerverdi Navn", "KREVER 1:1 med total deltakelse", "ER_GITT M:N", "ternær UTFØRER med riktige kardinaliteter og total deltakelse for FIL"]
    }],
    hvorfor: {
      eli5: "<p>Hver operasjon har sin egen nøkkel (rettighet), og hver nøkkel passer til én operasjon. En utførelse er en logglinje: «bruker 324 kjørte KjørFil på run.exe». Den trenger alle tre opplysningene samtidig, så den blir én rombe med tre streker.</p>",
      normal: "<p>«Nøyaktig én» begge veier gir 1:1 med total deltakelse på begge sider. Rettighetene kan ha flere navn, altså et flerverdiattributt. Utførelsen er ternær fordi den kobler bruker, operasjon og fil i ett faktum. Alle tre leddene er «mange», og alle filer må delta.</p>",
      teknisk: "<p>Kardinaliteten i en ternær relasjon leses slik: gitt én kombinasjon av de to andre deltakerne, hvor mange av denne kan det være? Teksten gir «mange» for alle tre, så leddene får N, M og P. Tre binære relasjoner (bruker–operasjon, bruker–fil, operasjon–fil) mister informasjon: de kan ikke si hvilken bruker som kjørte hvilken operasjon på hvilken fil. «Alle filer er del av minst én operasjonsutførelse» er total deltakelse for FIL i den ternære relasjonen.</p>"
    }
  };

  IN.PERFEKT["P2020-4"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "4",
      tekst: "<p>Realisering etter algoritmen (entiteter, svake entiteter, 1:1, 1:N, M:N, flerverdiattributter):</p>",
      skjema: "Spiller(Personnr, Navn, Klubb, Rating)\n  KN/PN: {Personnr}\n\n" +
        "Brikke(Symbol, Verdi)\n  KN/PN: {Symbol}\n\n" +
        "Åpning(ECO, Navn)\n  KN: {ECO}, {Navn}\n  PN: ECO\n\n" +
        "Parti(ID, Start, Slutt, HvitSpiller, SortSpiller, Åpning, Variasjon)\n  KN/PN: {ID}\n" +
        "  FN: Parti(HvitSpiller) -> Spiller(Personnr)\n  FN: Parti(SortSpiller) -> Spiller(Personnr)\n  FN: Parti(Åpning) -> Åpning(ECO)\n\n" +
        "Trekk(Symbol, FraRute, TilRute)\n  KN/PN: {Symbol, FraRute, TilRute}\n  FN: Trekk(Symbol) -> Brikke(Symbol)\n\n" +
        "DelAv(Parti, Symbol, FraRute, TilRute, TrekkNummer)\n  KN/PN: {Parti, Symbol, FraRute, TilRute}\n" +
        "  FN: DelAv(Parti) -> Parti(ID)\n  FN: DelAv(Symbol, FraRute, TilRute) -> Trekk(Symbol, FraRute, TilRute)\n\n" +
        "BestårAv(Åpning, Symbol, FraRute, TilRute, TrekkNummer)\n  KN/PN: {Åpning, Symbol, FraRute, TilRute}\n" +
        "  FN: BestårAv(Åpning) -> Åpning(ECO)\n  FN: BestårAv(Symbol, FraRute, TilRute) -> Trekk(Symbol, FraRute, TilRute)\n\n" +
        "Foretrekker(Spiller, Åpning)\n  KN/PN: {Spiller, Åpning}\n" +
        "  FN: Foretrekker(Spiller) -> Spiller(Personnr)\n  FN: Foretrekker(Åpning) -> Åpning(ECO)",
      etter: "<p><b>Valg:</b></p><ul>" +
        "<li>Den sammensatte TID blir Start og Slutt. Det utledbare attributtet Farge tas ikke med.</li>" +
        "<li>Åpning har to kandidatnøkler. ECO er valgt som PN fordi den er en kort, standardisert kode. Navn er fortsatt KN (UNIQUE, NOT NULL).</li>" +
        "<li>TREKK er svak: PN er Symbol fra den identifiserende entiteten pluss den sammensatte svake nøkkelen (FraRute, TilRute). FLYTTER realiseres ikke på nytt.</li>" +
        "<li>HVIT_SPILLER, SORT_SPILLER og HAR_ÅPNING er 1:N med PARTI på N-siden. Fremmednøklene legges i Parti, og Variasjon følger med. Fordi PARTI har total deltakelse, kan HvitSpiller, SortSpiller og Åpning ikke være NULL.</li>" +
        "<li>DEL_AV, BESTÅR_AV og FORETREKKER er M:N og blir egne tabeller. TrekkNummer er et relasjonsattributt og er derfor ikke med i nøkkelen.</li>" +
        "<li>Total deltakelse i M:N-relasjonene (PARTI i DEL_AV, ÅPNING i BESTÅR_AV, SPILLER i FORETREKKER) kan ikke håndheves med fremmednøkler.</li></ul>" +
        "<p><b>Merk:</b> Fordi TrekkNummer ikke er med i nøkkelen, kan det samme trekket (samme brikke fra og til samme rute) bare stå én gang per parti. " +
        "Det følger av ER-modellen (M:N), ikke av realiseringen. Løsningsforslaget kommer til de samme åtte tabellene. Det skriver Symbol feil som «Symol» i to fremmednøkler.</p>",
      poeng: ["fire vanlige entiteter med riktige attributter og nøkler", "Trekk med sammensatt PN og FN til Brikke", "tre 1:N som FN i Parti", "tre M:N-tabeller med sammensatte FN til Trekk", "begrunnede valg"]
    }],
    hvorfor: {
      eli5: "<p>Vi gjør tegningen om til tabeller etter en fast oppskrift. Et trekk som «springer fra g1 til f3» gir bare mening sammen med brikken, så brikkens symbol blir en del av trekkets nøkkel. Hvert parti har én hvit spiller, én sort spiller og én åpning, og de skrives rett inn i partitabellen. Alt som er «mange til mange», får en egen tabell.</p>",
      normal: "<p>Algoritmen går i fast rekkefølge. Vanlige entiteter blir tabeller med bare de enkle attributtene. Den svake entiteten Trekk får nøkkelen til Brikke pluss sin egen svake nøkkel. 1:N blir en fremmednøkkel på N-siden, og her er alle tre i Parti. M:N blir egne tabeller der nøkkelen er alle fremmednøklene.</p>",
      teknisk: "<p>Når den svake nøkkelen er sammensatt, blir PN-en i Trekk tre attributter: Symbol, FraRute og TilRute. Alle tabeller som peker på Trekk, må derfor ha en sammensatt fremmednøkkel med de samme tre attributtene. To 1:N-relasjoner mellom PARTI og SPILLER gir to fremmednøkler til samme tabell, og de trenger hvert sitt rollenavn (HvitSpiller, SortSpiller). Total deltakelse på N-siden av en 1:N blir NOT NULL på fremmednøkkelen. Total deltakelse i en M:N krever at det finnes minst én rad i koblingstabellen, og det kan ikke uttrykkes med fremmednøkler.</p>"
    }
  };

  IN.PERFEKT["P2020-5"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "5",
      sql: "UPDATE barn\nSET snill = false\nWHERE bid = 0;",
      tekst: "<p>Kommandoen endrer én rad (Ola).</p>",
      poeng: ["UPDATE … SET snill = false", "WHERE bid = 0"]
    }],
    hvorfor: {
      eli5: "<p>Vi finner kortet til barn nummer 0 og visker ut «snill» og skriver «ikke snill».</p>",
      normal: "<p>UPDATE endrer rader som allerede finnes. SET gir den nye verdien, og WHERE avgrenser til barnet med bid 0.</p>",
      teknisk: "<p>Siden bid er primærnøkkel, treffer WHERE høyst én rad. Uten WHERE ville alle radene i barn blitt oppdatert. false er en boolsk konstant og skrives uten fnutter.</p>"
    }
  };

  IN.PERFEKT["P2020-6"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "6",
      sql: "SELECT b.navn AS barn, g.navn AS gave\nFROM barn AS b\n  INNER JOIN ønskeliste AS ø ON (ø.barn = b.bid)\n  INNER JOIN gave AS g ON (g.gid = ø.gave)\nWHERE g.nyttig\n  AND g.navn LIKE 'Sokker%';",
      tekst: "<p>Resultatet på eksempeldataene:</p>",
      tabell: { kolonner: ["barn", "gave"], rader: [["Kine", "Sokker"]] },
      poeng: ["join av barn, ønskeliste og gave", "nyttig-betingelsen", "LIKE 'Sokker%'", "barnets og gavens navn i SELECT"]
    }],
    hvorfor: {
      eli5: "<p>Vi går gjennom ønskelappene, slår opp hvem som skrev lappen og hvilken gave det gjelder, og beholder bare lappene der gaven er nyttig og heter noe som starter med «Sokker».</p>",
      normal: "<p>ønskeliste kobler barn og gave. To joins gir én rad per ønske med begge navnene. WHERE beholder de nyttige gavene med riktig start på navnet.</p>",
      teknisk: "<p>LIKE 'Sokker%' betyr at navnet begynner med Sokker, og % matcher resten. LIKE skiller mellom store og små bokstaver. Joinene skrives med ON fordi kolonnenavnene ikke stemmer overens (ø.barn mot b.bid). Begge tabellene har kolonnen navn, så aliasene barn og gave gjør resultatet entydig.</p>"
    }
  };

  IN.PERFEKT["P2020-7"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "7",
      sql: "CREATE VIEW oversikt AS\nSELECT b.bid, b.navn AS barn, g.gid, g.navn AS gave, b.snill, g.nyttig\nFROM barn AS b\n  INNER JOIN ønskeliste AS ø ON (ø.barn = b.bid)\n  INNER JOIN gave AS g ON (g.gid = ø.gave)\nORDER BY b.navn, g.navn;",
      tekst: "<p>Viewet gir de 11 radene i eksempelet i oppgaven, i samme rekkefølge.</p>",
      poeng: ["CREATE VIEW oversikt AS", "riktige kolonner med aliasene barn og gave", "join av de tre tabellene", "ORDER BY barnets navn, så gavens navn"]
    }],
    hvorfor: {
      eli5: "<p>Et view er en lagret spørring med et navn. Vi lager en ferdig oversikt over alle ønskene med navnene på plass, så vi slipper å skrive den samme joinen om og om igjen.</p>",
      normal: "<p>Viewet er joinen fra oppgave 6 uten filter, med alle kolonnene oppgaven ber om. ORDER BY sorterer først på barnets navn og så på gavens navn.</p>",
      teknisk: "<p>Et view lagrer spørringen, ikke dataene, så det viser alltid gjeldende innhold. Vi sorterer på b.navn og g.navn, ikke på aliasene barn og gave. Aliasene ville også virket i PostgreSQL, men ønskeliste har kolonner med de samme navnene, og da er det tryggest å skrive tabellkolonnen. Sorteringen i viewet er ingen garanti når viewet brukes inne i en annen spørring. Der må du sortere på nytt.</p>"
    }
  };

  IN.PERFEKT["P2020-8"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "8",
      sql: "SELECT DISTINCT b1.navn AS barn1, b2.navn AS barn2\nFROM ønskeliste AS ø1\n  INNER JOIN ønskeliste AS ø2 ON (ø1.gave = ø2.gave AND ø1.barn < ø2.barn)\n  INNER JOIN barn AS b1 ON (b1.bid = ø1.barn)\n  INNER JOIN barn AS b2 ON (b2.bid = ø2.barn);",
      tekst: "<p>Resultatet på eksempeldataene (rekkefølgen er ikke bestemt):</p>",
      tabell: { kolonner: ["barn1", "barn2"], rader: [["Ola", "Kari"], ["Kari", "Mari"], ["Mari", "Kine"]] },
      etter: "<p>Med <code>ø1.barn != ø2.barn</code> i stedet for &lt; får du hvert par i begge rekkefølger, altså 6 rader. Det er løsningsforslagets tolkning, og den er like gyldig. " +
        "Med viewet fra oppgave 7 blir det samme: join oversikt med seg selv på gid og krev ulik bid.</p>",
      poeng: ["self-join på samme gave", "betingelse om ulike barn", "navnene via barn (eller viewet)", "DISTINCT"]
    }],
    hvorfor: {
      eli5: "<p>Vi legger ønskelappene ved siden av hverandre to og to. Står det samme gave på begge lappene og det er to forskjellige barn, har vi et par. Hvert par skriver vi bare opp én gang.</p>",
      normal: "<p>En self-join kobler tabellen med seg selv, så to ønsker om samme gave havner på samme rad. ø1.barn &lt; ø2.barn fjerner både barnet med seg selv og den speilvendte kopien av hvert par. DISTINCT fjerner duplikater når to barn har flere felles ønsker.</p>",
      teknisk: "<p>Uten betingelse på barna gir self-joinen også (x, x) og både (x, y) og (y, x). Med != forsvinner (x, x), og med &lt; forsvinner i tillegg den ene rekkefølgen. DISTINCT trengs fordi to barn med k felles gaver gir k like rader. Vi sammenligner bid og ikke navn, slik at to forskjellige barn med samme navn fortsatt regnes som ulike. Gruppering på navn ville slått dem sammen.</p>"
    }
  };

  IN.PERFEKT["P2020-9"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "9",
      sql: "WITH\n  per_gave AS (\n    SELECT g.gid, g.navn, g.nyttig, count(DISTINCT ø.barn) AS antall_barn\n    FROM gave AS g\n      LEFT JOIN ønskeliste AS ø ON (ø.gave = g.gid)\n    GROUP BY g.gid, g.navn, g.nyttig\n  ),\n" +
        "  topp_nyttige AS (\n    SELECT navn, antall_barn, nyttig\n    FROM per_gave\n    WHERE nyttig\n    ORDER BY antall_barn DESC, navn\n    LIMIT 3\n  ),\n" +
        "  topp_unyttige AS (\n    SELECT navn, antall_barn, nyttig\n    FROM per_gave\n    WHERE NOT nyttig\n    ORDER BY antall_barn DESC, navn\n    LIMIT 3\n  )\n" +
        "SELECT navn, antall_barn, nyttig FROM topp_nyttige\nUNION ALL\nSELECT navn, antall_barn, nyttig FROM topp_unyttige;",
      tekst: "<p>Resultatet på eksempeldataene:</p>",
      tabell: { kolonner: ["navn", "antall_barn", "nyttig"],
        rader: [["Bok", 1, "t"], ["Fuglebrett", 1, "t"], ["Sokker", 1, "t"], ["Dukke", 2, "f"], ["Lekebil", 2, "f"], ["Lekepistol", 2, "f"]] },
      etter: "<p>Alle de fire nyttige gavene har ett ønske hver. Navnet som tiebreaker gjør at Sykkel faller ut. Uten tiebreaker er det tilfeldig hvilke tre som kommer med.</p>" +
        "<p><b>Merk om løsningsforslaget:</b> Det skriver ORDER BY og LIMIT rett i den første delen av en UNION, uten parenteser. Det er en syntaksfeil i PostgreSQL, " +
        "og den siste ORDER BY … LIMIT 3 ville dessuten gjelde hele unionen. Hver del må pakkes inn, enten i parenteser eller i WITH som over.</p>",
      poeng: ["antall barn per gave med GROUP BY", "topp 3 for nyttige og for unyttige hver for seg", "ORDER BY … DESC med LIMIT 3", "UNION av de to listene, gyldig syntaks"]
    }],
    hvorfor: {
      eli5: "<p>Vi teller hvor mange barn som vil ha hver gave. Så lager vi to pallplasser, én for nyttige og én for unyttige gaver, og setter de tre mest ønskede på hver. Til slutt legger vi de to listene etter hverandre.</p>",
      normal: "<p>Først teller vi ønsker per gave med GROUP BY. Så tar vi topp 3 i hver gruppe med ORDER BY … DESC LIMIT 3, hver i sin WITH-del. UNION ALL slår dem sammen.</p>",
      teknisk: "<p>LIMIT gjelder hele spørringen den står i, så to separate topplister krever to separate spørringer. I en UNION kan en del bare ha ORDER BY og LIMIT hvis den står i parenteser. Det er enklest å løse med WITH. count(DISTINCT ø.barn) teller barn og ikke rader, fordi ønskeliste mangler primærnøkkel. LEFT JOIN tar med gaver uten ønsker (antall 0), og det betyr noe hvis det finnes færre enn tre ønskede gaver i en gruppe. Vi grupperer på gid, fordi to gaver kan ha samme navn. UNION ALL er nok, fordi de to listene ikke kan overlappe (nyttig er sann i den ene og usann i den andre).</p>"
    }
  };

  IN.PERFEKT["P2020-10"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "10",
      sql: "WITH\n  usnille_nyttige AS (\n    SELECT b.bid, b.navn AS barn, g.navn AS gave\n    FROM barn AS b\n      INNER JOIN ønskeliste AS ø ON (ø.barn = b.bid)\n      INNER JOIN gave AS g ON (g.gid = ø.gave)\n    WHERE NOT b.snill AND g.nyttig\n  )\n" +
        "SELECT b.navn AS barn, g.navn AS gave\nFROM barn AS b\n  INNER JOIN ønskeliste AS ø ON (ø.barn = b.bid)\n  INNER JOIN gave AS g ON (g.gid = ø.gave)\nWHERE b.snill\n" +
        "UNION ALL\nSELECT barn, gave\nFROM usnille_nyttige\n" +
        "UNION ALL\nSELECT b.navn, 'Genser'\nFROM barn AS b\nWHERE NOT b.snill\n  AND NOT EXISTS (\n    SELECT 1\n    FROM usnille_nyttige AS u\n    WHERE u.bid = b.bid\n  );",
      tekst: "<p>Resultatet på eksempeldataene, uten endringen fra oppgave 5 (rekkefølgen er ikke bestemt):</p>",
      tabell: { kolonner: ["barn", "gave"],
        rader: [["Kari", "Lekebil"], ["Kari", "Dukke"], ["Ola", "Dukke"], ["Ola", "Fuglebrett"], ["Nils", "Sykkel"], ["Jasmin", "Bok"],
                ["Kine", "Sokker"], ["Per", "Genser"], ["Mari", "Genser"]] },
      etter: "<p>Per har ingen ønsker og Mari ønsker seg bare unyttige ting, så begge får Genser. Kine får Sokker, men ikke Lekepistol eller Dataspill.</p>" +
        "<p><b>Merk om løsningsforslaget:</b> Det definerer WITH-delen som <code>usnille_uten_ønkser</code>, men leser fra <code>usnille_uten_ønsker</code>. " +
        "Navnene er ulike, så spørringen feiler slik den står. Ideen (tre deler slått sammen med UNION ALL, og Genser til usnille barn uten nyttige ønsker) er den samme som over.</p>",
      poeng: ["snille barn med alle ønskene", "usnille barn med bare nyttige ønsker", "Genser til usnille uten nyttige ønsker, også dem uten ønsker", "UNION ALL med navn på barn og gave"]
    }],
    hvorfor: {
      eli5: "<p>Nissen lager tre bunker. I den første ligger alt de snille barna ønsket seg. I den andre ligger de nyttige tingene de usnille ønsket seg. Usnille barn som ikke fikk noe i bunke to, får en genser i bunke tre. Så legger han bunkene sammen.</p>",
      normal: "<p>Hver regel blir en egen SELECT med kolonnene barn og gave, og UNION ALL legger dem etter hverandre. Den tredje delen trenger å vite hvem som allerede fikk en nyttig gave, så den delen står i WITH og brukes to ganger.</p>",
      teknisk: "<p>«Får Genser hvis de ikke ønsker seg noen nyttige ting» er en «finnes ikke»-betingelse. Vi skriver den med NOT EXISTS mot WITH-delen. NOT IN på bid virker også her, fordi bid aldri er NULL. Den tredje delen må ta utgangspunkt i barn og ikke i ønskeliste, ellers forsvinner usnille barn uten ønsker. 'Genser' er en konstant i SELECT, siden gaven ikke finnes i gave-tabellen. Alle delene i en UNION må ha like mange kolonner med kompatible typer. Kolonnenavnene i resultatet kommer fra den første delen.</p>"
    }
  };

  IN.PERFEKT["P2020-11"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "11",
      tekst: "<p>I steg med navngitte mellomresultater:</p>" +
        "<p>H := π<sub>gid</sub>(σ<sub>navn = 'hoppestokk'</sub>(gave))<br>" +
        "Ø := π<sub>barn</sub>(ønskeliste ⋈<sub>gave = gid</sub> H)<br>" +
        "Svar := π<sub>navn</sub>(barn ⋈<sub>bid = barn</sub> Ø)</p>" +
        "<p>Eller som ett uttrykk:</p>" +
        "<p>π<sub>navn</sub>(barn ⋈<sub>bid = barn</sub> π<sub>barn</sub>(ønskeliste ⋈<sub>gave = gid</sub> π<sub>gid</sub>(σ<sub>navn = 'hoppestokk'</sub>(gave))))</p>" +
        "<p>På eksempeldataene er svaret tomt, fordi ingen gave heter hoppestokk.</p>",
      etter: "<p><b>Merk om løsningsforslaget:</b> Det skriver joinene som ⋈<sub>bid</sub> og ⋈<sub>gid</sub>, altså som om ønskeliste hadde attributtene bid og gid. " +
        "Attributtene i ønskeliste heter barn og gave, så join-betingelsen må nevne begge navnene (bid = barn og gave = gid). Ideen er den samme: velg gaven, behold bare gid, og join deg frem til barnets navn.</p>",
      poeng: ["σ på gavens navn", "join via ønskeliste med riktige join-betingelser", "π til barnets navn uten navnekollisjon"]
    }],
    hvorfor: {
      eli5: "<p>σ er en sil og π er en saks. Vi siler ut hoppestokken i gavelisten og klipper bort alt unntatt nummeret. Så limer vi den mot ønskelappene og deretter mot barnelisten, og klipper til slutt ut barnenavnene.</p>",
      normal: "<p>Uttrykket tilsvarer SQL-spørringen SELECT b.navn FROM barn JOIN ønskeliste ON … JOIN gave ON … WHERE gave.navn = 'hoppestokk'. Seleksjonen står innerst, så joinene jobber med færrest mulig rader. Projeksjonene underveis fjerner kolonner vi ikke trenger.</p>",
      teknisk: "<p>R ⋈<sub>θ</sub> S er definert som σ<sub>θ</sub>(R × S). Både barn og gave har attributtet navn. Projiserer vi gave ned til gid før joinen, er det bare barnets navn igjen, og π<sub>navn</sub> er entydig. Alternativet er å døpe om med ρ<sub>navn→gavenavn</sub>. Fordi relasjonsalgebra er mengdebasert, gir et barn som har ønsket seg hoppestokk to ganger likevel bare én rad. Naturlig join ville ikke virket uten omdøping: ønskeliste deler ingen attributtnavn med barn eller gave.</p>"
    }
  };

  IN.PERFEKT["P2020-12"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "12",
      tekst: "<p>Kandidatnøklene er <b>ACE</b>, <b>BCE</b> og <b>CDE</b>.</p>",
      skjema: "Aldri på høyresiden: C, E  -> med i alle KN\n" +
        "Bare på høyresiden: ingen\n\n" +
        "{C, E}⁺ = {C, E}                     ikke SN\n" +
        "{A, C, E}⁺: A -> B, BC -> D          = {A, B, C, D, E}  KN\n" +
        "{B, C, E}⁺: BC -> D, DE -> A         = {A, B, C, D, E}  KN\n" +
        "{C, D, E}⁺: DE -> A, A -> B          = {A, B, C, D, E}  KN\n\n" +
        "Alle andre SN inneholder CE og minst ett av A, B, D,\nog altså en av de tre KN-ene. De er ikke minimale.",
      poeng: ["C og E i alle nøkler, med begrunnelse", "tillukning av CE og utvidelsene", "alle tre nøklene og at det ikke finnes flere"]
    }],
    hvorfor: {
      eli5: "<p>C og E kan ingen andre regler gi deg, så de må alltid være med fra start. Med bare C og E kommer du ingenting. Legger du til én av A, B eller D, setter reglene i gang en kjedereaksjon som gir deg alt.</p>",
      normal: "<p>Et attributt som aldri står på en høyreside, kan ikke utledes og må derfor være med i alle kandidatnøkler. CE alene er ikke nok, så vi prøver CE pluss ett attributt til. A, B og D gir hver for seg hele R gjennom en kjede av FD-er.</p>",
      teknisk: "<p>X er en supernøkkel når X⁺ = R, og en kandidatnøkkel når ingen ekte delmengde er en supernøkkel. ACE, BCE og CDE er minimale fordi den eneste delmengden som kan være aktuell, CE, har CE⁺ = CE. De andre delmengdene mangler C eller E og kan ikke være supernøkler. Mengder med fire eller fem attributter inneholder alltid en av de tre, og er ikke minimale. Legg merke til syklusen A → B, BC → D, DE → A: med C og E på plass gir hvert av A, B og D de to andre.</p>"
    }
  };

  IN.PERFEKT["P2020-13"] = {
    type: "eksamen",
    intro: PROVE_INTRO,
    svar: [{
      del: "13",
      tekst: "<p>Vi deler på én BCNF-brytende FD om gangen og bruker tillukningen av venstresiden:</p>",
      skjema: "R(A, B, C, D, E, F)\n  KN: {A, B}, {C, D}\n  FD: AB -> C, AB -> D, CD -> A, CD -> B, A -> E, C -> F\n" +
        "  A -> E bryter BCNF (A er ikke supernøkkel). {A}⁺ = {A, E}\n\n" +
        "S₁(A, E)\n  KN: {A}\n  FD: A -> E\n  BCNF: ja\n\n" +
        "S₂(A, B, C, D, F)\n  KN: {A, B}, {C, D}\n  FD: AB -> C, AB -> D, CD -> A, CD -> B, C -> F\n" +
        "  C -> F bryter BCNF (C er ikke supernøkkel). {C}⁺ = {C, F}\n\n" +
        "S₂₁(C, F)\n  KN: {C}\n  FD: C -> F\n  BCNF: ja\n\n" +
        "S₂₂(A, B, C, D)\n  KN: {A, B}, {C, D}\n  FD: AB -> C, AB -> D, CD -> A, CD -> B\n  BCNF: ja (alle venstresider er supernøkler)\n\n" +
        "Resultat: S₁(A, E), S₂₁(C, F), S₂₂(A, B, C, D)",
      etter: "<p>Dekomposisjonen er tapsfri etter Fagins teorem: hver deling skjer langs en FD X → Y der X er fellesattributtet for de to delene og er nøkkel i den ene " +
        "(A i S₁, C i S₂₁). En naturlig join av delene gir derfor nøyaktig R tilbake. Løsningsforslaget kommer til de samme tre relasjonene.</p>",
      poeng: ["første dekomponering med FD-er og nøkler", "andre dekomponering med FD-er og nøkler", "tillukninger og begrunnelse for hvert steg"]
    }],
    hvorfor: {
      eli5: "<p>Tabellen blander tre slags opplysninger: noe som bare handler om A (E), noe som bare handler om C (F), og selve koblingen mellom A, B, C og D. Vi gir hver av dem sin egen tabell, og limer vi dem sammen igjen, får vi den opprinnelige tabellen tilbake.</p>",
      normal: "<p>BCNF krever at alle venstresider er supernøkler. A → E og C → F har venstresider som bare er en del av en nøkkel, så de bryter BCNF. Vi trekker hver av dem ut i en egen tabell med venstresiden som nøkkel. Igjen står S₂₂ med de fire nøkkel-FD-ene, og der er alle venstresider supernøkler.</p>",
      teknisk: "<p>Algoritmen: finn X → Y som bryter BCNF, regn X⁺, og del R i S₁ = X⁺ og S₂ = X ∪ (R − X⁺). Etter hver deling gjelder bare FD-ene som har alle attributtene sine i delen (strengt tatt projeksjonen av FD-mengden). I S₂ gjelder også avledede FD-er som AB → F, men de har en supernøkkel på venstresiden og endrer ingenting. S₂₂ har to kandidatnøkler og er likevel på BCNF, fordi hver FD har en av dem på venstresiden. Rekkefølgen spiller ingen rolle her: starter du med C → F, ender du med de samme tre tabellene.</p>"
    }
  };
})();
