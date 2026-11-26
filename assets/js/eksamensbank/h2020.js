/* IN2090 · eksamensbank H2020. Kilde: UiO, IN2090 eksamen 16.12.2020 (hjemmeeksamen, in2090h20_eksamen.pdf),
   databaseskjema (in2090h20_databaseskjema.pdf) + sensorveiledning (in2090h20_eksamen_sensorveiledning.pdf).
   Oppgavetekst og sensorveiledning ordrett. Våre svar (svar/hvorfor/losning/tips) med egne ord.
   Arket nummererer oppgavene 1–4, 1–6 og 1–3 innen hver del; nøklene bruker M (modellering), S (SQL) og R (relasjonsmodellen). */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var BANK = (window.IN_EXAM_BANK = window.IN_EXAM_BANK || {});
  IN.PERFEKT = IN.PERFEKT || {};

  /* ---------- Databaseskjemaet for SQL-delen ---------- */
  var SKJEMA = {
    tittel: "Land, byer, værmeldinger og interessante steder (POI)",
    intro: "<p>Du har fått tak i en database som inneholder informasjon om land, byer, værmeldinger og interessante steder " +
      "(“Points of interest” (POI)). Databasen er laget av følgende SQL-script:</p>" +
      "<pre>CREATE TABLE land (\n      lid int PRIMARY KEY,\n      navn text NOT NULL\n);\n\n" +
      "CREATE TABLE by (\n      bid int PRIMARY KEY,\n      navn text NOT NULL,\n      lid int REFERENCES land(lid)\n);\n\n" +
      "CREATE TABLE poi (\n      pid int PRIMARY KEY,\n      navn text NOT NULL,\n      adresse text,\n      bid int REFERENCES by(bid),\n      type text NOT NULL\n);\n\n" +
      "CREATE TABLE værmelding (\n      bid int REFERENCES by(bid),\n      dato date,\n      nedbør float NOT NULL,\n      vind int NOT NULL,\n      PRIMARY KEY(bid, dato)\n);</pre>" +
      "<p>Land er altså kun beskrevet med en ID (lid) og navn. Byer har også en egen ID (bid), et navn, samt en peker til hvilket land byen er i.</p>" +
      "<p>Interessante steder, altså poi-tabellen, beskriver steder av interesse, slik som kaféer, museer, kulturminner, osv. Disse har en egen " +
      "ID (pid), et navn, kanskje en adresse, en peker til hvilken by stedet ligger i, samt hva slags sted det er (f.eks. kafé dersom steder er en kafé).</p>" +
      "<p>Værmeldinger består av en peker til byen værmeldingen gjelder for, datoen for værmeldingen, samt antall millimeter nedbør og " +
      "vindstyrke det meldes den dagen.</p>" +
      "<p><b>Eksempeldata:</b> Under følger eksempler på hvordan tabellene kan se ut. Spørringene dine kan ikke anta at dataene ser slik ut, " +
      "med mindre dette står i oppgaven.</p>",
    tabeller: [
      { navn: "land", beskrivelse: "",
        kolonner: [
          { navn: "lid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true }
        ],
        eksempel: { kolonner: ["lid", "navn"],
          rader: [[1, "Norge"], [2, "Frankrike"], [3, "Italia"], [4, "Tyskland"], [5, "Sverige"], [6, "Storbritannia"], [7, "USA"]] } },
      { navn: "by", beskrivelse: "",
        kolonner: [
          { navn: "bid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true },
          { navn: "lid", type: "int", fk: "land(lid)" }
        ],
        eksempel: { kolonner: ["bid", "navn", "lid"],
          rader: [[1, "Oslo", 1], [2, "Kristiansand", 1], [3, "Bergen", 1], [4, "Roma", 3], [5, "Firenze", 3], [6, "Paris", 2], [7, "Lyon", 2],
                  [8, "Berlin", 4], [9, "Bremen", 4], [10, "Hamburg", 4], [11, "Stockholm", 5], [12, "Gøteborg", 5], [13, "London", 6], [14, "New York", 7]] } },
      { navn: "poi", beskrivelse: "",
        kolonner: [
          { navn: "pid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true },
          { navn: "adresse", type: "text" },
          { navn: "bid", type: "int", fk: "by(bid)" },
          { navn: "type", type: "text", notNull: true }
        ],
        eksempel: { kolonner: ["pid", "navn", "adresse", "bid", "type"],
          rader: [[1, "Linken", null, 3, "Utsiktspunkt"], [2, "Slottet", "Karl Johansgate 1", 1, "Slott"], [3, "Eiffeltårnet", "5 avenue Anatole", 6, "Kulturminne"],
                  [4, "Lyse Kloster", "Edne 121", 3, "Kulturminne"], [5, "Berlinmuren", null, 8, "Kulturminne"], [6, "Maemo", "Dronning Eufemias gate 23", 1, "Restaurant"],
                  [7, "Kaf Kafe", "Jacobsfjorden 4", 3, "Kafé"], [8, "Kilden", "Sjølystveien 2", 2, "Konserthus"], [9, "London Bro", "London SE1 9RA", 13, "Bro"],
                  [10, "Frihetsgudinnen", "NY 10004", 14, "Kulturminne"], [11, "Feffo", "Via Delle Fornaci 2/4/6", 4, "Kafé"], [12, "Frantzén", "Klara Norra kyrkogata", 11, "Restaurant"],
                  [13, "Aker Brygge", "Støperigata 2", 1, "Brygge"], [14, "Caracallas Termer", "Viale delle Terme di Caracalla", 4, "Kulturminne"],
                  [15, "Grefsenkollen Restaurant", "Grefsenkollveien 100", 1, "Restaurant"], [16, "Villa Bardini", "Costa S. Giorgio, 2-4", 4, "Kulturminne"]] } },
      { navn: "værmelding", beskrivelse: "",
        kolonner: [
          { navn: "bid", type: "int", pk: true, fk: "by(bid)" },
          { navn: "dato", type: "date", pk: true },
          { navn: "nedbør", type: "float", notNull: true },
          { navn: "vind", type: "int", notNull: true }
        ],
        eksempel: { kolonner: ["bid", "dato", "nedbør", "vind"],
          rader: [[1, "2020-12-17", 1.1, 2], [1, "2020-12-18", 0, 1], [2, "2020-12-17", 3.4, 5], [2, "2020-12-19", 2.1, 2], [3, "2020-12-17", 10.7, 8],
                  [3, "2020-12-18", 11.2, 9], [4, "2020-12-17", 0, 1], [4, "2020-12-20", 0, 2], [5, "2020-12-17", 1.3, 6], [5, "2020-12-19", 0.1, 2],
                  [6, "2020-12-17", 0, 2], [8, "2020-12-17", 0.1, 0], [7, "2020-12-21", 5.4, 6], [3, "2020-12-19", 21.2, 6], [14, "2020-12-24", 5.1, 4],
                  [14, "2020-12-23", 1.2, 1], [10, "2020-12-17", 3.1, 0], [9, "2020-12-31", 0, 0], [1, "2020-12-19", 0.1, 3], [13, "2020-12-18", 0.7, 6]] } }
    ],
    merknad: "Skjemaet ble levert som et eget PDF-vedlegg til hver SQL-oppgave. Adressen til Linken og Berlinmuren er tom (NULL) i eksempeldataene. " +
      "«by» er et nøkkelord i SQL (GROUP BY, ORDER BY), men ikke reservert i PostgreSQL, så tabellnavnet virker der. Eksempeldataene har ingen POI med type 'Museum'."
  };

  /* ---------- ER-modellen i Modellering oppgave 4 (fra arket) ---------- */
  var ER_M4 = {
    entiteter: [
      { id: "MUSIC_ALBUM", navn: "MUSIC_ALBUM", svak: false, pos: [0, 1],
        attr: [{ navn: "Id", nokkel: true }, { navn: "Name" }, { navn: "Price" }, { navn: "WebPage", nokkel: true }] },
      { id: "SONG", navn: "SONG", svak: true, pos: [2, 0],
        attr: [{ navn: "SongNr", delvisNokkel: true }, { navn: "Name" }, { navn: "Duration" }] },
      { id: "RECORD_HOUSE", navn: "RECORD_HOUSE", svak: false, pos: [2, 1],
        attr: [{ navn: "PhoneNr", flerverdi: true }, { navn: "Name" }, { navn: "OrgNr", nokkel: true }] },
      { id: "MUSIC_BAND", navn: "MUSIC_BAND", svak: false, pos: [1, 3],
        attr: [{ navn: "ContactInfo", deler: [{ navn: "Email" }, { navn: "Phone" }] }, { navn: "Name" }, { navn: "Id", nokkel: true }] },
      { id: "SINGER", navn: "SINGER", svak: false, pos: [3, 3],
        attr: [{ navn: "Id", nokkel: true }, { navn: "Name" }] }
    ],
    relasjoner: [
      { id: "CONSISTS_OF", navn: "CONSISTS_OF", identifiserende: true, pos: [1, 0],
        ledd: [{ entitet: "MUSIC_ALBUM", kard: "1", total: false }, { entitet: "SONG", kard: "N", total: true }], attr: [] },
      { id: "RECORDED_BY", navn: "RECORDED_BY", identifiserende: false, pos: [1, 1],
        ledd: [{ entitet: "MUSIC_ALBUM", kard: "N", total: false }, { entitet: "RECORD_HOUSE", kard: "1", total: false }],
        attr: [{ navn: "RecordingDate" }] },
      { id: "HAS_DISCOUNT_WITH", navn: "HAS_DISCOUNT_WITH", identifiserende: false, pos: [2, 2],
        ledd: [{ entitet: "MUSIC_BAND", kard: "N", total: false }, { entitet: "RECORD_HOUSE", kard: "M", total: false }],
        attr: [{ navn: "DiscountAmount" }] },
      { id: "CREATED_BY", navn: "CREATED_BY", identifiserende: false, pos: [0, 3],
        ledd: [{ entitet: "MUSIC_ALBUM", kard: "N", total: false }, { entitet: "MUSIC_BAND", kard: "1", total: false }], attr: [] },
      { id: "HAS_MEMBER", navn: "HAS_MEMBER", identifiserende: false, pos: [2, 3],
        ledd: [{ entitet: "MUSIC_BAND", kard: "N", total: true }, { entitet: "SINGER", kard: "M", total: true }],
        attr: [{ navn: "StartDate" }] },
      { id: "HAS_MANAGER", navn: "HAS_MANAGER", identifiserende: false, pos: [2, 4],
        ledd: [{ entitet: "MUSIC_BAND", kard: "1", total: false }, { entitet: "SINGER", kard: "1", total: false }],
        attr: [{ navn: "AppointmentDate" }] },
      { id: "MENTORS", navn: "MENTORS", identifiserende: false, pos: [3, 4],
        ledd: [{ entitet: "SINGER", kard: "1", total: false, rolle: "Mentor" }, { entitet: "SINGER", kard: "N", total: false, rolle: "Mentee" }], attr: [] }
    ],
    merknad: "Tegnet etter ER-modellen på arket. Arket viste i tillegg den samme modellen i ORM2, som ikke er gjengitt her."
  };

  /* ---------- Våre ER-svar (Chen-notasjon) ---------- */
  var ER_M1_SVAR = {
    entiteter: [
      { id: "BRUKER", navn: "BRUKER", svak: false, pos: [0, 0],
        attr: [{ navn: "Brukernavn", nokkel: true }, { navn: "Email", nokkel: true }, { navn: "Navn" }] },
      { id: "KREDITTKORT", navn: "KREDITTKORT", svak: false, pos: [2, 0],
        attr: [{ navn: "Kortnummer", nokkel: true }, { navn: "Utløpsdato" }] }
    ],
    relasjoner: [
      { id: "BENYTTER", navn: "BENYTTER", identifiserende: false, pos: [1, 0],
        ledd: [{ entitet: "BRUKER", kard: "1", total: false }, { entitet: "KREDITTKORT", kard: "1", total: false }],
        attr: [{ navn: "Registrert_dato" }] }
    ],
    merknad: "Brukernavn og Email er to separate nøkler. Registreringsdatoen hører til koblingen bruker–kort og står derfor på relasjonen."
  };

  var ER_M2_SVAR = {
    entiteter: [
      { id: "BRUKER", navn: "BRUKER", svak: false, pos: [0, 0], attr: [{ navn: "Brukernavn", nokkel: true }] },
      { id: "BESTILLING", navn: "BESTILLING", svak: false, pos: [0, 2],
        attr: [{ navn: "Bestillingsnummer", nokkel: true }, { navn: "Dato" }, { navn: "Pris" },
               { navn: "Leveringsadresse", deler: [{ navn: "Land" }, { navn: "By" }, { navn: "Postkode" },
                 { navn: "Gateadresse", deler: [{ navn: "Gatenavn" }, { navn: "Nummer" }] }] }] },
      { id: "BESTILLINGSLINJE", navn: "BESTILLINGSLINJE", svak: true, pos: [2, 2],
        attr: [{ navn: "Linjenummer", delvisNokkel: true }, { navn: "Antall" }] },
      { id: "PRODUKT", navn: "PRODUKT", svak: false, pos: [2, 4],
        attr: [{ navn: "ProduktID", nokkel: true }, { navn: "Navn" }] },
      { id: "LEVERANDØR", navn: "LEVERANDØR", svak: false, pos: [4, 3],
        attr: [{ navn: "ID", nokkel: true }, { navn: "Epost", flerverdi: true }] }
    ],
    relasjoner: [
      { id: "PLASSERT", navn: "PLASSERT", identifiserende: false, pos: [0, 1],
        ledd: [{ entitet: "BRUKER", kard: "1", total: false }, { entitet: "BESTILLING", kard: "N", total: true }], attr: [] },
      { id: "INNEHOLDER", navn: "INNEHOLDER", identifiserende: true, pos: [1, 2],
        ledd: [{ entitet: "BESTILLING", kard: "1", total: true }, { entitet: "BESTILLINGSLINJE", kard: "N", total: true }], attr: [] },
      { id: "HAR_PRODUKT", navn: "HAR_PRODUKT", identifiserende: false, pos: [2, 3],
        ledd: [{ entitet: "BESTILLINGSLINJE", kard: "N", total: true }, { entitet: "PRODUKT", kard: "1", total: false }], attr: [] },
      { id: "HAR_LEVERANDØR", navn: "HAR_LEVERANDØR", identifiserende: false, pos: [3, 2],
        ledd: [{ entitet: "BESTILLINGSLINJE", kard: "N", total: true }, { entitet: "LEVERANDØR", kard: "1", total: false }], attr: [] },
      { id: "SELGER", navn: "SELGER", identifiserende: false, pos: [3, 4],
        ledd: [{ entitet: "LEVERANDØR", kard: "N", total: false }, { entitet: "PRODUKT", kard: "M", total: false }], attr: [] }
    ],
    merknad: "BRUKER er tegnet med bare nøkkelen fra oppgave 1. Leveringsadresse er sammensatt, og delen Gateadresse er igjen sammensatt av Gatenavn og Nummer. " +
      "Modellen kan ikke uttrykke at leverandøren på en bestillingslinje faktisk selger produktet. Det skriver vi som en kommentar."
  };

  var ER_M3_SVAR = {
    entiteter: [
      { id: "BRUKER", navn: "BRUKER", svak: false, pos: [1, 0], attr: [{ navn: "Brukernavn", nokkel: true }] },
      { id: "PRODUKT", navn: "PRODUKT", svak: false, pos: [1, 4], attr: [{ navn: "ProduktID", nokkel: true }] },
      { id: "ØNSKELISTE", navn: "ØNSKELISTE", svak: true, pos: [3, 2],
        attr: [{ navn: "Navn", delvisNokkel: true }, { navn: "Dato_laget" }] }
    ],
    relasjoner: [
      { id: "ANMELDER", navn: "ANMELDER", identifiserende: false, pos: [0, 2],
        ledd: [{ entitet: "BRUKER", kard: "N", total: false }, { entitet: "PRODUKT", kard: "M", total: false }],
        attr: [{ navn: "Stjerner" }, { navn: "Beskrivelse" }] },
      { id: "ANBEFALER", navn: "ANBEFALER", identifiserende: false, pos: [1, 2],
        ledd: [{ entitet: "BRUKER", kard: "K", total: false, rolle: "anbefaler" }, { entitet: "BRUKER", kard: "N", total: false, rolle: "mottaker" },
               { entitet: "PRODUKT", kard: "M", total: false }],
        attr: [{ navn: "Dato" }] },
      { id: "LAGER", navn: "LAGER", identifiserende: true, pos: [3, 0],
        ledd: [{ entitet: "BRUKER", kard: "1", total: false }, { entitet: "ØNSKELISTE", kard: "N", total: true }], attr: [] },
      { id: "INNEHOLDER_PRODUKT", navn: "INNEHOLDER_PRODUKT", identifiserende: false, pos: [3, 4],
        ledd: [{ entitet: "ØNSKELISTE", kard: "N", total: false }, { entitet: "PRODUKT", kard: "M", total: false }], attr: [] }
    ],
    merknad: "BRUKER og PRODUKT er tegnet med bare nøklene fra oppgave 1 og 2. ANBEFALER er ternær med to roller for BRUKER (den som anbefaler og den som mottar)."
  };

  /* ---------- Felles tekst ---------- */
  var MOD_INTRO = "<p><b>Modellering (40%)</b></p><p>Lag en ER- (eller ORM2-) modell for en database for en nettbutikk.</p><ul>" +
    "<li>Du må gjerne dele modellen opp i deler (f.eks. over flere sider), men sørg for at det fremkommer tydelig hvilke deler av modellen som besvarer hvilke oppgaver.</li>" +
    "<li>Du må gjerne inkludere kommentarer i modellene. Dersom det er uklarheter eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar " +
    "til modellene dine om hvilke antagelser og tolkninger du eventuelt gjør.</li>" +
    "<li>Dersom du ser at det er mulig å modellere deler av oppgaven på flere ulike måter, diskuter kort hvordan din fremgangsmåte er i forhold til de ulike alternativene.</li>" +
    "<li>Tegn og skriv tydelig.</li></ul>";
  var SQL_INTRO = "<p><b>SQL (40%)</b></p><p>Oppgavene i denne delen er om SQL. Alle oppgavene vil bruke det samme databaseskjemaet, og en beskrivelse " +
    "av dette er vedlagt som PDF for hver oppgave.</p><p>Du må gjerne inkludere kommentarer i spørringene (gjøres med “--” i SQL). Dersom det er " +
    "uklarheter eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar om hvilke antagelser og tolkinger du gjør.</p>";
  var SV_MOD_GENERELT = "<p><b>Generelt:</b></p><ul>" +
    "<li>-0.5 for feil plassering av total deltakelse eller riktig kardinalitet, men feil plassering</li>" +
    "<li>-1 for feil kardinalitet eller manglende total deltakelse</li>" +
    "<li>-2 for manglende kardinalitet på hele relasjonen</li>" +
    "<li>-1 for manglende attributt-markeringer (nøkkel eller multi-valued)</li>" +
    "<li>-1 for manglende/feil plassering av vanlig attributt</li>" +
    "<li>-2 for både manglende markering av svak entitet og identifiserende relasjon (-1 for kun å mangle én av dem)</li></ul>";
  var SV_SQL_GENERELT = "<p><b>Generelt:</b></p><ul>" +
    "<li>-1 for NATURAL JOIN mellom f.eks. land og by (inkluderer da navn)</li>" +
    "<li>-1 for manglende/feil tabeller i joins i FROM</li>" +
    "<li>-0.5 for manglende kolonner i SELECT</li>" +
    "<li>-1 for manglende begrensning i WHERE (f.eks. mangle land.navn = 'Italia' i oppg. 2)</li>" +
    "<li>Ingen trekk for å bruke GROUP BY på navn</li>" +
    "<li>Ingen trekk for å kun ha primærnøkkel i GROUP BY men andre attributter (fra samme tabell) i SELECT (støttes av PostgreSQL)</li></ul>";
  var HJEMME_AVVIK = "Hjemmeeksamen med alle hjelpemidler tillatt og 30 minutter ekstra tid til å laste opp tegninger. ";
  var ORM_AVVIK = "Arket lot deg velge mellom ER og ORM2. ORM2 er ikke pensum i IN2090 nå, så svaret vårt bruker bare ER (Chen-notasjon).";
  function kilde(del, nr, tot) { return "Oppgavetekst: UiO, IN2090, H2020, " + del + " oppgave " + nr + " (oppgave " + tot + " av 13 i Inspera)"; }
  function skilde(del, nr) { return "Kilde: sensorveiledning IN2090 H2020, " + del + " oppgave " + nr; }

  var S5_EKS = "<table class=\"tbl\"><thead><tr><th>navn</th><th>posisjon</th><th>nedbør</th><th>vind</th></tr></thead><tbody>" +
    [["Oslo", "Norge", "1.1", "2"], ["Kilden", "Sjølystveien 2", "3.4", "5"], ["Eiffeltårnet", "5 avenue Anatole", "0", "2"],
     ["Grefsenkolloen Restaurant", "Grefsenkollveien 100", "1.1", "2"], ["Villa Bardini", "Costa S. Giorgio, 2-4", "0", "1"],
     ["Berlin", "Tyskland", "0.1", "0"], ["Kristiansand", "Norge", "3.4", "5"], ["Aker Brygge", "Støperigata 2", "1.1", "2"],
     ["Roma", "Italia", "0", "1"], ["Kaf Kafe", "Jacobsfjorden 4", "10.7", "8"], ["Feffo", "Via Delle Fornaci 2/4/6", "0", "1"],
     ["Maemo", "Dronning Eufemias gate 23", "1.1", "2"], ["Firenze", "Italia", "1.3", "6"], ["Bergen", "Norge", "10.7", "8"],
     ["Lyse Kloster", "Edne 121", "10.7", "8"], ["Paris", "Frankrike", "0", "2"], ["Caracallas Termer", "Viale delle Terme di Caracalla", "0", "1"],
     ["Hamburg", "Tyskland", "3.1", "0"], ["Slottet", "Karl Johansgate 1", "1.1", "2"]]
      .map(function (r) { return "<tr><td>" + r.join("</td><td>") + "</td></tr>"; }).join("") + "</tbody></table>";

  BANK["H2020"] = {
    year: "H2020", dato: "16.12.2020", varighet: "4 timer (09:00–13:00) + 30 min ekstratid, hjemmeeksamen",
    hjelpemidler: "Alle hjelpemidler tillatt",
    deler: [{ navn: "Modellering", poeng: 40 }, { navn: "SQL", poeng: 40 }, { navn: "Normalformer og dekomposisjon", poeng: 20 }],
    skjema: SKJEMA,
    er: { "M4": ER_M4 },
    oppgaver: [
      /* ===================== Modellering ===================== */
      {
        key: "H2020-M1", year: "H2020", oppgave_nr: "Modellering, oppgave 1", kilde: kilde("Modellering", 1, 1),
        ark: "Brukere", title: "Brukere og kredittkort (1:1)",
        points: 5, block: "er", tema: ["entitet", "nøkkel", "1:1", "relasjonsattributt"], ordrett: true,
        oppgave: MOD_INTRO + "<p><b>1 Brukere (5)</b></p>" +
          "<p>Lag en modell som fanger grunnleggende informasjon om brukerne av nettbutikken:</p>" +
          "<p>For hver bruker skal databasen kunne lagre brukernavn til hver bruker (brukernavnet er unikt blant brukere), navnet til brukeren, " +
          "og email-adressen brukeren benyttet for å lage kontoen (email-adressen er også unik blant brukere). Videre skal databasen kunne lagre " +
          "informasjon om kredittkort som brukerne kan benytte for kjøp i nettbutikken. Databasen skal kunne lagre høyst ett kredittkort per bruker, " +
          "og et kredittkort skal ikke kunne benyttes av fler brukere (altså, en bruker kan ha ingen eller ett kredittkort og et kredittkort kan bli " +
          "brukt av ingen eller én bruker). Databasen skal lagre datoen brukeren registrerte kredittkortet i nettbutikken. Videre skal " +
          "kredittkortnummeret og utløpsdatoen for kortet lagres.</p>",
        avvik: HJEMME_AVVIK + ORM_AVVIK,
        losning: [
          "BRUKER blir en entitet med to separate nøkler, Brukernavn og Email, pluss Navn.",
          "KREDITTKORT blir en entitet med Kortnummer som nøkkel og Utløpsdato.",
          "Relasjonen BENYTTER er 1:1 med partiell deltakelse på begge sider («ingen eller ett», «ingen eller én»).",
          "Registreringsdatoen beskriver koblingen og legges på relasjonen."
        ],
        tips: [
          "«Ingen eller én» på begge sider betyr 1:1 uten total deltakelse. Sensor gir 2 av 5 poeng bare for relasjonen.",
          "To unike attributter blir to understrekede nøkler, ikke én sammensatt nøkkel.",
          "Datoen kan også stå på KREDITTKORT, siden et kort har høyst én bruker. På relasjonen er det likevel tydeligst. Skriv en kommentar om valget."
        ],
        del1: null
      },
      {
        key: "H2020-M2", year: "H2020", oppgave_nr: "Modellering, oppgave 2", kilde: kilde("Modellering", 2, 2),
        ark: "Produkter", title: "Produkter, bestillinger og bestillingslinjer",
        points: 15, block: "er", tema: ["svak entitet", "M:N", "1:N", "flerverdiattributt", "sammensatt attributt", "total deltakelse"], ordrett: true,
        oppgave: "<p><b>2 Produkter (15)</b></p>" +
          "<p>Utvid modellen med informasjon om produkter solgt på nettbutikken, og produktene kjøpt av brukerne:</p>" +
          "<p>For produkter solgt i nettbutikken skal databasen lagre navnet til produktet (f.eks. “Samsung TV 65 inch”) og en unik identifikator " +
          "til produktet (f.eks. p1283). Produkter er solgt av en leverandør (en leverandør kan selge mange produkter, og samme produkt kan bli solgt " +
          "av ulike leverandører). For hver leverandør skal databasen lagre en unik ID (f.eks. s112) og en mengde epost-adresser som skal brukes for " +
          "kontakt med leverandøren (f.eks. en salgs-email-adresse, en kunde-kontakt-email-adresse, osv.).</p>" +
          "<p>Brukere kjøper produkter ved å legge inn bestillinger i nettbutikken. En bruker kan legge inn flere bestillinger. En bestilling kan " +
          "derimot kun bli lagt inn av én bruker. Ingen bestillinger skal kunne lagres i databasen uten å ha blitt plassert av en bruker. For hver " +
          "bestilling skal følgende informasjon lagres: bestillingsnummeret (unikt), datoen bestillingen ble lagt inn, prisen på bestillingen, " +
          "adressen bestillingen skal leveres til (inneholder land, by, postkode, og gateadresse som igjen består av gatenavn og nummer). Videre " +
          "består en bestilling av en eller fler bestillingslinjer (dette er mekanismen som tillater en bestilling å inneholde fler produkter).</p>" +
          "<p>Hver bestillingslinje inneholder nøyaktig ett produkt, nøyaktig én leverandør (leverandøren som selger produktet), og antall enheter " +
          "av det produktet som er bestilt. Hver bestillingslinje har et nummer som er unikt innen samme bestilling. For eksempel, en bestilling med " +
          "id 0123 inneholder to bestillingslinjer: bestillingslinje #1 består av 3 enheter av produktet p1283 solgt av leverandør s112; " +
          "bestillingslinje #2 består av 1 enhet av produkt p3245 solgt av leverandør s122.</p>",
        avvik: ORM_AVVIK + " Den felles innledningen til modelleringsdelen står i oppgave 1.",
        losning: [
          "PRODUKT (ProduktID, Navn) og LEVERANDØR (ID, Epost som flerverdiattributt) knyttes med SELGER, som er M:N.",
          "BESTILLING får Bestillingsnummer som nøkkel, Dato, Pris og Leveringsadresse som et sammensatt attributt. Gateadresse er igjen sammensatt av Gatenavn og Nummer.",
          "PLASSERT er 1:N fra BRUKER til BESTILLING, med total deltakelse for BESTILLING («ingen bestillinger … uten å ha blitt plassert av en bruker»).",
          "BESTILLINGSLINJE har et nummer som bare er unikt innen bestillingen, så den blir en svak entitet med Linjenummer som svak nøkkel, eid av BESTILLING via den identifiserende relasjonen INNEHOLDER. Antall står på linjen.",
          "«En eller fler bestillingslinjer» gir også total deltakelse for BESTILLING i INNEHOLDER.",
          "Hver linje har nøyaktig ett produkt og nøyaktig én leverandør: to N:1-relasjoner med total deltakelse på linjesiden."
        ],
        tips: [
          "«Unikt innen samme bestilling» er signalordet for svak entitet. Marker både entiteten og den identifiserende relasjonen, for sensor trekker for hver markering som mangler.",
          "«Hver linje har nøyaktig ett produkt» gir to markeringer: 1 ved PRODUKT (en linje knyttes til høyst ett produkt) og dobbel strek fra BESTILLINGSLINJE (hver linje må ha et produkt, altså total deltakelse). Det samme gjelder leverandøren.",
          "En sammensatt del av et sammensatt attributt (Gateadresse) tegnes med egne ovaler ut fra delen.",
          "Skriv som kommentar at modellen ikke kan sikre at leverandøren på linjen faktisk selger produktet. Det viser at du har tenkt over det."
        ],
        del1: null
      },
      {
        key: "H2020-M3", year: "H2020", oppgave_nr: "Modellering, oppgave 3", kilde: kilde("Modellering", 3, 3),
        ark: "Ønskelister, anbefalinger og anmeldelser", title: "Ønskelister, anbefalinger (ternær) og anmeldelser",
        points: 10, block: "er", tema: ["svak entitet", "ternær relasjon", "M:N", "roller", "relasjonsattributt"], ordrett: true,
        oppgave: "<p><b>3 Ønskelister, anbefalinger og anmeldelser (10)</b></p>" +
          "<p>Utvid modellen videre med informasjon om produkt-ønskelister, anbefalinger og anmeldelser på nettbutikken:</p>" +
          "<p>Databasen skal kunne lagre:</p><ul>" +
          "<li>Produktanmeldelser: En bruker kan anmelde flere produkter og det samme produktet kan bli anmeldt av mange brukere. For hver anmeldelse " +
          "skal databasen lagre antall stjerner brukeren ga det anmeldte produktet, sammen med en tekstuell beskrivelse.</li>" +
          "<li>Ønskelister: En bruker skal kunne lage mange ønskelister, men en ønskeliste kan kun tilhøre én bruker. Hver ønskeliste skal ha et navn " +
          "som er unikt blant brukerens ønskelister. I tillegg skal det lagres datoen brukeren laget ønskelisten. En ønskeliste kan inneholde mange " +
          "produkter. For eksempel, brukeren “joedoe” lager en ønskeliste med navn “Bøker” som inneholder produktene Bok1, Bok2 og Bok3. Naturligvis " +
          "skal andre brukere kunne lage ønskelister som inneholder de samme produktene som ønskelisten til “joedoe”.</li>" +
          "<li>Produktanbefalinger: En bruker skal kunne anbefale produkter til andre brukere. En bruker kan anbefale mange produkter til samme bruker, " +
          "et produkt kan anbefales av mange brukere til samme bruker, og en bruker kan bli anbefalt mange produkter av en bruker (hint: bruk en " +
          "ternær relasjon). Datoen for anbefalingen skal også lagres.</li></ul>",
        avvik: ORM_AVVIK + " Den felles innledningen til modelleringsdelen står i oppgave 1.",
        losning: [
          "Anmeldelser: M:N-relasjonen ANMELDER mellom BRUKER og PRODUKT med attributtene Stjerner og Beskrivelse.",
          "Ønskelister: navnet er bare unikt blant brukerens egne lister, så ØNSKELISTE blir en svak entitet (Navn som svak nøkkel, Dato_laget) eid av BRUKER via den identifiserende relasjonen LAGER.",
          "En ønskeliste kan inneholde mange produkter, og et produkt kan stå på mange lister: M:N-relasjonen INNEHOLDER_PRODUKT.",
          "Anbefalinger: en ternær relasjon ANBEFALER med tre ledd, to til BRUKER (rollene anbefaler og mottaker) og ett til PRODUKT. Alle sidene er «mange», og Dato står på relasjonen."
        ],
        tips: [
          "Når samme entitet deltar to ganger i én relasjon, må leddene ha roller. Ellers vet ingen hvem som anbefaler og hvem som mottar.",
          "Ternære relasjoner gir 4 av 10 poeng her. Tegn tre streker fra én rombe og sett kardinalitet på alle tre.",
          "«Unikt blant brukerens ønskelister» betyr svak entitet, akkurat som bestillingslinjene i oppgave 2."
        ],
        del1: null
      },
      {
        key: "H2020-M4", year: "H2020", oppgave_nr: "Modellering, oppgave 4", kilde: kilde("Modellering", 4, 4),
        ark: "Realisering", title: "Musikkalbum, band og sangere til relasjoner",
        points: 10, block: "realisering", tema: ["realisering", "svak entitet", "1:1", "1:N", "M:N", "rekursiv relasjon", "flerverdiattributt", "sammensatt attributt"], ordrett: true,
        oppgave: "<p><b>4 Realisering (10)</b></p>" +
          "<p>Realiser følgende modell (enten ER-modellen eller ORM2-modellen) til et relasjonelt databaseskjema. Det resulterende databaseskjemaet " +
          "skal være korrekt (ekvivalent med modellen), effektivt (unngå overflødige tabeller), og tydelig (bør være lett å forstå). Bruk algoritmen " +
          "for realisering for å lage et slikt skjema, og forklar eventuelle valg du tar underveis.</p>" +
          "<p>For hver relasjon, oppgi relasjonens navn, og navnet til hvert attributt. Du trenger ikke oppgi datatyper for attributtene, og du skal " +
          "ikke bruke SQL i denne oppgaven. Bruk understreking for å markere kandidatnøkler. Dersom det er flere kandidatnøkler, bruk fet skrift for " +
          "å markere valgt primærnøkkel. Bruk piler for å markere fremmednøkler (f.eks. “T(A) -&gt; S(B)” for å uttrykke at relasjon T sin attributt " +
          "A er en fremmednøkkel som peker på relasjon S sin B attributt). Om du ønsker å ha bilde større eller i en egen tab, høyreklikk på bildet " +
          "og velg “Se bildet/View Image”.</p>",
        avvik: "Arket viste både en ER-modell og en ORM2-modell. Bare ER-modellen er tegnet på nytt her, fordi ORM2 ikke er pensum lenger. " +
          "Uten Inspera bruker vi kursets tekstformat (KN, PN og FN på egne linjer) i stedet for understreking og fet skrift.",
        losning: [
          "Vanlige entiteter: Music_album (to KN, Id og WebPage), Record_house, Music_band (sammensatt ContactInfo blir Email og Phone) og Singer.",
          "Svak entitet: Song får Id fra den identifiserende entiteten pluss SongNr som PN, med FN til Music_album. CONSISTS_OF skal ikke bli en egen tabell.",
          "1:N RECORDED_BY og CREATED_BY: FN på N-siden (Music_album), og RecordingDate følger med.",
          "1:1 HAS_MANAGER (partiell på begge sider): FN i Music_band, fordi de fleste band trolig har en manager, mens de fleste sangere ikke er manager. AppointmentDate følger med.",
          "Rekursiv 1:N MENTORS: en mentee har én mentor, så FN-en Mentor legges i Singer og peker til Singer selv.",
          "M:N HAS_MEMBER og HAS_DISCOUNT_WITH blir egne tabeller med begge FN-ene som PN. Flerverdiattributtet PhoneNr blir en egen tabell."
        ],
        tips: [
          "Sensor gir 1 poeng per relasjon og bare 0,5 per vanlig entitet. Bruk tiden på å begrunne 1:1- og 1:N-valgene, og husk at det koster −2 å ikke forklare noe som helst.",
          "En rekursiv relasjon realiseres som en vanlig 1:N, men fremmednøkkelen peker tilbake til samme tabell. Gi den et rollenavn (Mentor).",
          "Total deltakelse i HAS_MEMBER kan ikke håndheves med fremmednøkler alene. Det er greit å nevne, men gir ikke trekk å la være."
        ],
        del1: null
      },

      /* ===================== SQL ===================== */
      {
        key: "H2020-S1", year: "H2020", oppgave_nr: "SQL, oppgave 1", kilde: kilde("SQL", 1, 5),
        ark: "Flervalg", title: "Hvilke tupler er med? LIKE og INNER JOIN",
        points: 5, block: "sql", tema: ["LIKE", "INNER JOIN", "USING", "OR"], ordrett: true,
        oppgave: SQL_INTRO + "<p><b>1 Flervalg (5)</b></p>" +
          "<p>Dersom dataene i databasen er lik eksempeldataene i PDFen, hvilke av følgende tupler vil være med i resultatet på følgende spørring:</p>" +
          "<pre>SELECT by.navn AS by, poi.navn AS land\nFROM by INNER JOIN poi USING (bid)\nWHERE by.navn LIKE '%r%i%' OR\n      poi.navn LIKE '%er';</pre>",
        avvik: "På arket er dette avkrysningsbokser der flere kan være riktige. Her er hver boks en JA/NEI-påstand (JA = kryss av). " +
          "Etter sensorveiledningen gir hvert riktig kryss +1 og hvert galt kryss −1. Boksene du lar stå tomme, gir 0.",
        losning: [
          "Join først: hver POI står sammen med byen den ligger i (via bid). Par der POI-en ligger i en annen by, finnes ikke i resultatet i det hele tatt.",
          "'%r%i%' betyr «inneholder en liten r, og senere en liten i». Det gjelder Berlin, Kristiansand og Paris, men ikke Roma (stor R), Firenze (i før r) eller Bergen.",
          "'%er' betyr «slutter på er»: Lyse Kloster og Caracallas Termer.",
          "Treff: (Berlin, Berlinmuren), (Kristiansand, Kilden), (Paris, Eiffeltårnet), (Bergen, Lyse Kloster) og (Roma, Caracallas Termer)."
        ],
        tips: [
          "Sjekk først om paret i det hele tatt finnes etter joinen. Bentsebrua finnes ikke i dataene, Frihetsgudinnen ligger i New York, Maemo i Oslo og Villa Bardini i Roma.",
          "LIKE skiller mellom store og små bokstaver: 'Roma' har stor R og treffer ikke '%r%i%'.",
          "Aliaset «AS land» på poi.navn er villedende. Det endrer bare kolonnenavnet, ikke hvilke rader som kommer med.",
          "Med −1 for galt kryss lønner det seg ikke å gjette."
        ],
        del1: {
          type: "janei",
          avkrysning: true,
          regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
          intro: "<p>Dersom dataene i databasen er lik eksempeldataene i PDFen, hvilke av følgende tupler vil være med i resultatet på følgende spørring:</p>" +
            "<pre>SELECT by.navn AS by, poi.navn AS land\nFROM by INNER JOIN poi USING (bid)\nWHERE by.navn LIKE '%r%i%' OR\n      poi.navn LIKE '%er';</pre>",
          items: [
            { s: "(Berlin, Berlinmuren)", answer: true, explain: "<p>Ja. Berlinmuren ligger i Berlin, og «Berlin» har r og senere i.</p>" },
            { s: "(Oslo, Slottet)", answer: false, explain: "<p>Nei. Paret finnes etter joinen, men «Oslo» har ingen r, og «Slottet» slutter ikke på er.</p>" },
            { s: "(Kristiansand, Kilden)", answer: true, explain: "<p>Ja. Kilden ligger i Kristiansand, og «Kristiansand» har r og senere i.</p>" },
            { s: "(Paris, Eiffeltårnet)", answer: true, explain: "<p>Ja. «Paris» har r og senere i.</p>" },
            { s: "(Oslo, Bentsebrua)", answer: false, explain: "<p>Nei. Bentsebrua finnes ikke i poi-tabellen.</p>" },
            { s: "(London, London Bro)", answer: false, explain: "<p>Nei. «London» har ingen r, og «London Bro» slutter på ro.</p>" },
            { s: "(Berlin, Frihetsgudinnen)", answer: false, explain: "<p>Nei. Frihetsgudinnen ligger i New York (bid 14), så paret oppstår aldri i joinen.</p>" },
            { s: "(Oslo, Aker Brygge)", answer: false, explain: "<p>Nei. Ingen av betingelsene holder: «Aker Brygge» slutter på ge.</p>" },
            { s: "(Bergen, Lyse Kloster)", answer: true, explain: "<p>Ja. «Bergen» har ingen i, men «Lyse Kloster» slutter på er.</p>" },
            { s: "(Roma, Caracallas Termer)", answer: true, explain: "<p>Ja. «Roma» treffer ikke (stor R), men «Caracallas Termer» slutter på er.</p>" },
            { s: "(Firenze, Villa Bardini)", answer: false, explain: "<p>Nei. Villa Bardini ligger i Roma (bid 4), ikke i Firenze, så paret finnes ikke.</p>" },
            { s: "(Kristiansand, Maemo)", answer: false, explain: "<p>Nei. Maemo ligger i Oslo, så paret finnes ikke.</p>" }
          ]
        }
      },
      {
        key: "H2020-S2", year: "H2020", oppgave_nr: "SQL, oppgave 2", kilde: kilde("SQL", 2, 6),
        ark: "Italiensk værmelding", title: "Morgendagens værmelding for byer i Italia",
        points: 5, block: "sql", tema: ["INNER JOIN", "WHERE", "ORDER BY", "dato"], ordrett: true,
        oppgave: "<p><b>2 Italiensk værmelding (5)</b></p>" +
          "<p>Skriv en SQL-spørring som finner morgendagens (17.12.2020) værmelding for alle byer i Italia. Spørringen skal skrive ut navnet på " +
          "byen, antall millimeter regn og vindstyrken. Sorter resultatet alfabetisk på bynavn.</p>",
        avvik: "Databaseskjemaet og eksempeldataene står én gang i årets databaseskjema over.",
        losning: [
          "Landnavnet står i land, byene i by og værmeldingene i værmelding. Join alle tre.",
          "Filtrer på l.navn = 'Italia' og datoen '2020-12-17'.",
          "Sorter med ORDER BY på bynavnet.",
          "På eksempeldataene: Firenze (1.3, 6) og Roma (0, 1)."
        ],
        tips: [
          "Ikke filtrer på lid = 3. Det gir −1, fordi spørringen skal virke uansett hvilken ID Italia har.",
          "Manglende sortering koster −1.",
          "NATURAL JOIN mellom land og by gir −1: begge har kolonnen navn, så joinen krever at bynavnet er lik landnavnet."
        ],
        del1: null
      },
      {
        key: "H2020-S3", year: "H2020", oppgave_nr: "SQL, oppgave 3", kilde: kilde("SQL", 3, 7),
        ark: "Ukesmelding for jula", title: "Sum nedbør og snittvind i romjulsuka per by",
        points: 5, block: "sql-videre", tema: ["GROUP BY", "sum", "avg", "dato"], ordrett: true,
        oppgave: "<p><b>3 Ukesmelding for jula (5)</b></p>" +
          "<p>Skriv en SQL-spørring som finner navn, totalt antall millimeter nedbør og gjennomsnittlig vindstyrke i romjulsuka (altså fra og med " +
          "dato 24.12.2020 til og med dato 31.12.2020) for hver by.</p>",
        avvik: "Databaseskjemaet og eksempeldataene står én gang i årets databaseskjema over.",
        losning: [
          "Join by og værmelding, og behold bare datoene fra og med 2020-12-24 til og med 2020-12-31.",
          "Grupper per by (bid og navn), og regn ut sum(nedbør) og avg(vind).",
          "På eksempeldataene: Bremen (0, 0) og New York (5.1, 4)."
        ],
        tips: [
          "Grupper på bid i tillegg til navn, slik at to byer med samme navn ikke slås sammen. Sensor trekker ikke for GROUP BY på navn alene.",
          "Manglende GROUP BY koster −2.",
          "«Til og med 31.12» betyr &lt;= '2020-12-31' (eller &lt; '2021-01-01')."
        ],
        del1: null
      },
      {
        key: "H2020-S4", year: "H2020", oppgave_nr: "SQL, oppgave 4", kilde: kilde("SQL", 4, 8),
        ark: "Byer uten regn", title: "Byer uten regn og vind fra julaften ut året",
        points: 5, block: "sql-videre", tema: ["NOT EXISTS", "NOT IN", "HAVING", "delspørring"], ordrett: true,
        oppgave: "<p><b>4 Byer uten regn (5)</b></p>" +
          "<p>Skriv en SQL-spørring som finner navn på alle byer hvor det ikke er meldt noe regn og ikke noe vind fra og med julaften (24.12.2020) " +
          "og ut året. Spørringen skal skrive ut navnet på byene. Du kan anta at vi har værmelding (og både nedbør og vindstyrke) for alle byer " +
          "hver dag i julen.</p>",
        avvik: "Databaseskjemaet og eksempeldataene står én gang i årets databaseskjema over.",
        losning: [
          "En by skal med når det ikke finnes noen værmelding i perioden med nedbør eller vind. Det er en «finnes ikke»-betingelse.",
          "Skriv den med NOT EXISTS: for hver by, se etter en melding i perioden der nedbør &gt; 0 eller vind &gt; 0.",
          "En annen riktig løsning grupperer meldingene per by og krever at sum(nedbør) = 0 og sum(vind) = 0 i HAVING.",
          "Under antakelsen i oppgaven (melding for alle byer hver dag) gir de to løsningene samme svar."
        ],
        tips: [
          "Fellen er å skrive WHERE nedbør = 0 AND vind = 0. Det gir byer med minst én rolig dag, ikke byer med bare rolige dager (−3).",
          "Aggregater kan ikke stå i WHERE (−2). Bruk HAVING.",
          "Eksempeldataene oppfyller ikke antakelsen. Der gir NOT EXISTS 13 byer (alle uten meldinger med vind eller nedbør i perioden), mens HAVING-varianten gir bare Bremen, fordi den krever minst én melding."
        ],
        del1: null
      },
      {
        key: "H2020-S5", year: "H2020", oppgave_nr: "SQL, oppgave 5", kilde: kilde("SQL", 5, 9),
        ark: "Steder og vær", title: "VIEW Steder: byer og POIs med dagens vær (UNION)",
        points: 10, block: "sql-videre", tema: ["VIEW", "UNION", "IS NOT NULL", "current_date"], ordrett: true,
        oppgave: "<p><b>5 Steder og vær (10)</b></p>" +
          "<p>Skriv en SQL-kommando som lager et VIEW med navn Steder som viser dagens værmelding (nedbør i mm. og vindstyrke) for både byer og " +
          "POIs i samme tabell.</p>" +
          "<p>Du kan anta at dagens dato finnes i variabelen current_date (slik som i PostgreSQL). VIEWet skal ha 4 kolonner, en med navnet på " +
          "stedet, en med plassering som er landet dersom stedet er en by og adressen dersom stedet er en POI, samt nedbør og vindstyrke. For POIs " +
          "er nedbør og vindstyrke lik byen den befinner seg i sin nedbør og vindstyrke. Vi er kun interessert i steder som faktisk har en posisjon, " +
          "altså skal posisjon aldri være NULL. F.eks. kan innholdet i VIEWet se slik ut:</p>" + S5_EKS,
        avvik: "Databaseskjemaet og eksempeldataene står én gang i årets databaseskjema over. Eksempeltabellen skriver «Grefsenkolloen Restaurant», mens poi-tabellen har «Grefsenkollen Restaurant».",
        losning: [
          "Del 1, byene: join by, land og værmelding, og ta med bynavnet, landnavnet som posisjon, nedbør og vind for dagens dato.",
          "Del 2, POI-ene: join poi med værmelding via bid. POI-en får byens vær. Ta med navnet, adressen som posisjon, nedbør og vind for dagens dato.",
          "Fjern POI-er uten adresse med adresse IS NOT NULL. Landnavn er NOT NULL i skjemaet, så byene trenger ingen slik sjekk.",
          "Slå sammen de to delene med UNION ALL (eller UNION), og pakk alt inn i CREATE VIEW steder AS …",
          "Med dagens dato lik 2020-12-17 gir viewet 19 rader på eksempeldataene: 8 byer og 11 POI-er."
        ],
        tips: [
          "Sammenligning med NULL (adresse != NULL) gir NULL (ukjent) og fjerner alle rader. Bruk IS NOT NULL (−1 ellers, −2 hvis NULL-adressene ikke fjernes).",
          "Kolonnenavnene i et UNION-resultat kommer fra første del. Gi kolonnen navnet posisjon med AS (−1 ellers).",
          "Begge delene i en UNION må ha like mange kolonner med kompatible typer."
        ],
        del1: null
      },
      {
        key: "H2020-S6", year: "H2020", oppgave_nr: "SQL, oppgave 6", kilde: kilde("SQL", 6, 10),
        ark: "Ferieplanlegging", title: "Byen i Frankrike med opphold, minst 3 kaféer og flest museer",
        points: 10, block: "sql-videre", tema: ["WITH", "GROUP BY", "HAVING", "max", "LEFT JOIN"], ordrett: true,
        oppgave: "<p><b>6 Ferieplanlegging (10)</b></p>" +
          "<p>La oss si at du skal reise på ferie til Frankrike og ønsker å finne ut hvilken by du skal reise til for å gå tur og se på museer. " +
          "Skriv derfor en SQL-spørring som finner den byen i Frankrike med opphold (0 mm. nedbør) i morgen (17.12.2020), som har minst 3 kaféer " +
          "og som har flest museer.</p>",
        avvik: "Databaseskjemaet og eksempeldataene står én gang i årets databaseskjema over. På eksempeldataene er svaret tomt: Paris har opphold, men ingen kaféer.",
        losning: [
          "Del opp i steg med WITH. Først byene i Frankrike med 0 mm nedbør 2020-12-17.",
          "Så beholder du de av dem som har minst tre POI-er med type 'Kafé' (GROUP BY per by og HAVING count(*) &gt;= 3).",
          "Tell museene per gjenværende by. Bruk LEFT JOIN mot museene og count(m.pid), slik at byer med 0 museer også er med.",
          "Plukk byen eller byene med høyest antall ved å sammenligne med max() over tellingen. Da kommer alle med ved likt antall."
        ],
        tips: [
          "Sensor delte poengene i tre: 4 for byene med opphold og kaféer, 3 for å finne flest museer og 3 for å sette det sammen. Selv en halv løsning gir altså poeng.",
          "ORDER BY … DESC LIMIT 1 godtas, men gir bare én by ved uavgjort. max()-varianten gir alle.",
          "Filtrer museene i et eget steg (WITH) før LEFT JOIN, slik kurset gjør. Tilleggsfelle (står ikke i kursmaterialet): en betingelse på museumstypen i WHERE etter LEFT JOIN fjerner NULL-radene, så byer uten museer forsvinner. Den ytre joinen virker da som en indre join.",
          "Oppgaven kan også leses slik at «flest museer» gjelder alle byer i Frankrike, ikke bare dem med opphold og minst 3 kaféer. Sensors løsningsforslag har en egen alternativ løsning for den tolkningen.",
          "Eksempeldataene har ingen 'Museum'. Sensor godtok 'Kulturminne' i stedet."
        ],
        del1: null
      },

      /* ===================== Relasjonsmodellen og normalformer ===================== */
      {
        key: "H2020-R1", year: "H2020", oppgave_nr: "Relasjonsmodellen, oppgave 1", kilde: kilde("Relasjonsmodellen og normalformer", 1, 11),
        ark: "Nøkler", title: "Finn alle kandidatnøkler i R(A, B, C, D)",
        points: 5, block: "fd", tema: ["kandidatnøkkel", "tillukning", "FD"], ordrett: true,
        oppgave: "<p><b>Relasjonsmodellen og normalformer (20%)</b></p><p><b>1 Nøkler (5)</b></p>" +
          "<p>Gitt følgende relasjon</p><p>R(A, B, C, D)</p><p>og følgende FDer:</p>" +
          "<ol><li>A -&gt; BC</li><li>BC -&gt; A</li><li>D -&gt; B</li><li>B -&gt; D</li></ol>" +
          "<p>Hvilke kandidatnøkler har relasjonen?</p>",
        avvik: "På arket er dette 15 avkrysningsbokser der flere kan være riktige. Her er hver boks en JA/NEI-påstand (JA = kryss av). " +
          "Etter sensorveiledningen gir hvert riktig kryss +1,67 og hvert galt kryss −1,67. Boksene du lar stå tomme, gir 0.",
        losning: [
          "Alle fire attributtene står på høyresiden i minst én FD. Snarveien «et attributt som aldri står på en høyreside, er med i alle kandidatnøkler» gir oss derfor ingenting her. Vi må regne tillukning, fra de minste mengdene og opp.",
          "{A}⁺: A -&gt; BC gir B og C, og B -&gt; D gir D. {A}⁺ = {A, B, C, D}, så A er en kandidatnøkkel.",
          "{B}⁺ = {B, D} og {D}⁺ = {B, D}. {C}⁺ = {C}. Ingen av disse er nøkler alene.",
          "{B, C}⁺: BC -&gt; A gir A, og B -&gt; D gir D. Hele R, og verken B eller C alene er nøkkel, så BC er en kandidatnøkkel.",
          "{C, D}⁺: D -&gt; B gir B, og BC -&gt; A gir A. Hele R, så CD er en kandidatnøkkel.",
          "Alle andre mengder som er supernøkler, inneholder A, BC eller CD og er derfor ikke minimale. Svaret er A, BC og CD."
        ],
        tips: [
          "Start med de minste mengdene og regn tillukning. En mengde som inneholder en kandidatnøkkel, er aldri selv en kandidatnøkkel.",
          "Når B og D bestemmer hverandre, kan de bytte plass i nøkler: BC og CD er nøkler av samme grunn.",
          "Et galt kryss koster like mye som et riktig gir. Kryss bare av det du har regnet ut."
        ],
        del1: {
          type: "janei",
          avkrysning: true,
          regel: { riktig: 1.67, feil: -1.67, blankt: 0, min: 0 },
          intro: "<p>Gitt følgende relasjon R(A, B, C, D) og følgende FDer: A -&gt; BC, BC -&gt; A, D -&gt; B, B -&gt; D. Hvilke kandidatnøkler har relasjonen?</p>",
          items: [
            { s: "A", answer: true, explain: "<p>Ja. {A}⁺ = {A, B, C, D}, og én enkelt attributt er alltid minimal.</p>" },
            { s: "B", answer: false, explain: "<p>Nei. {B}⁺ = {B, D}.</p>" },
            { s: "C", answer: false, explain: "<p>Nei. {C}⁺ = {C}. Ingen FD har bare C på venstresiden.</p>" },
            { s: "D", answer: false, explain: "<p>Nei. {D}⁺ = {B, D}.</p>" },
            { s: "AB", answer: false, explain: "<p>Nei. Supernøkkel, men ikke minimal, siden A alene er nøkkel.</p>" },
            { s: "AC", answer: false, explain: "<p>Nei. Inneholder A og er derfor ikke minimal.</p>" },
            { s: "AD", answer: false, explain: "<p>Nei. Inneholder A og er derfor ikke minimal.</p>" },
            { s: "BC", answer: true, explain: "<p>Ja. BC -&gt; A og B -&gt; D gir hele R, og verken B eller C alene er nøkkel.</p>" },
            { s: "BD", answer: false, explain: "<p>Nei. {B, D}⁺ = {B, D}. C kommer aldri med.</p>" },
            { s: "CD", answer: true, explain: "<p>Ja. D -&gt; B gir B, og så gir BC -&gt; A oss A. Verken C eller D alene er nøkkel.</p>" },
            { s: "ABC", answer: false, explain: "<p>Nei. Inneholder både A og BC.</p>" },
            { s: "ABD", answer: false, explain: "<p>Nei. Inneholder A.</p>" },
            { s: "ACD", answer: false, explain: "<p>Nei. Inneholder A og CD.</p>" },
            { s: "BCD", answer: false, explain: "<p>Nei. Inneholder BC og CD.</p>" },
            { s: "ABCD", answer: false, explain: "<p>Nei. Hele relasjonen er en supernøkkel, men langt fra minimal.</p>" }
          ]
        }
      },
      {
        key: "H2020-R2", year: "H2020", oppgave_nr: "Relasjonsmodellen, oppgave 2", kilde: kilde("Relasjonsmodellen og normalformer", 2, 12),
        ark: "Normalformer", title: "Normalform for R(A, B, C, D) (feil i oppgaveteksten)",
        points: 5, block: "normalisering", tema: ["normalform", "BCNF", "3NF", "2NF", "tillukning", "nøkkelattributt"], ordrett: true,
        oppgave: "<p><b>2 Normalformer (5)</b></p>" +
          "<p>Gitt følgende relasjon</p><p>R(A, B, C, D)</p><p>med kandidatnøklene AB og C og følgende FDer</p>" +
          "<ol><li>D -&gt; B</li><li>C -&gt; AD</li><li>B -&gt; D</li><li>A -&gt; C</li></ol>" +
          "<p>Hvilken normalform har relasjonen. Vis hvordan du kommer frem til svaret.</p>",
        avvik: "Oppgaveteksten har en feil: med disse FDene er {A}⁺ = {A, B, C, D}, så A er en kandidatnøkkel alene, og AB er ikke minimal. " +
          "De riktige kandidatnøklene er A og C. Feilen ble rettet under eksamen, men sent, så sensor godtok både svaret under premisset i teksten (AB og C, gir 1NF) " +
          "og svaret med de riktige nøklene (A og C, gir 2NF).",
        losning: [
          "Kontroller nøklene først: {A}⁺ = {A, C, D, B} og {C}⁺ = {C, A, D, B}, mens {B}⁺ = {D}⁺ = {B, D}. Kandidatnøklene er A og C.",
          "Nøkkelattributter er A og C. B og D er ikke-nøkkelattributter.",
          "D -&gt; B: D er ikke supernøkkel (bryter BCNF), B er ikke nøkkelattributt (bryter 3NF), D er ikke del av en kandidatnøkkel (2NF holder).",
          "C -&gt; AD og A -&gt; C: venstresiden er supernøkkel, så BCNF holder.",
          "B -&gt; D: samme mønster som D -&gt; B, altså 2NF.",
          "Laveste normalform over alle FD-ene: R er på 2NF. (Godtar man premisset AB og C, blir B en ekte del av nøkkelen AB, og B -&gt; D gir 1NF.)"
        ],
        tips: [
          "Kontroller alltid oppgitte nøkler med tillukning. Her avslører {A}⁺ feilen på et halvt minutt, og det gir et godt inntrykk å påpeke den.",
          "Del opp FD-er med flere attributter på høyresiden (C -&gt; AD blir C -&gt; A og C -&gt; D).",
          "Forklar for hver FD hvilken normalform den gir. Svar uten forklaring gir −2.",
          "Normalformen til R er den laveste du finner over alle FD-ene."
        ],
        del1: null
      },
      {
        key: "H2020-R3", year: "H2020", oppgave_nr: "Relasjonsmodellen, oppgave 3", kilde: kilde("Relasjonsmodellen og normalformer", 3, 13),
        ark: "Tapsfri dekomposisjon", title: "Dekomponer Student tapsfritt til BCNF",
        points: 10, block: "normalisering", tema: ["BCNF", "tapsfri dekomposisjon", "tillukning", "kandidatnøkkel"], ordrett: true,
        oppgave: "<p><b>2 Tapsfri dekomposisjon (10)</b></p>" +
          "<p>Gitt følgende relasjon Student(id, navn, veileder, oppgave, institutt) med kandidatnøkler {id, oppgave} og FDer</p>" +
          "<ol><li>id -&gt; navn</li><li>oppgave -&gt; veileder</li><li>oppgave -&gt; institutt</li></ol>" +
          "<p>Dekomponer relasjonen tapsfritt til BCNF. Beskriv hvordan du kommer frem til resultatet, og list opp nøkler og FDer for alle tabeller underveis.</p>",
        avvik: "Arket nummererer denne oppgaven «2» (samme nummer som oppgaven før). Det er den tredje oppgaven i delen.",
        losning: [
          "Finn en FD som bryter BCNF: id -&gt; navn, fordi id ikke er supernøkkel.",
          "Regn {id}⁺ = {id, navn} og del i T1(id, navn) og T2(id, veileder, oppgave, institutt). T1 har nøkkel id og FD-en id -&gt; navn, og er på BCNF.",
          "T2 har nøkkel {id, oppgave} og FD-ene oppgave -&gt; veileder og oppgave -&gt; institutt. oppgave er ikke supernøkkel, så T2 bryter BCNF.",
          "Regn {oppgave}⁺ = {oppgave, veileder, institutt} og del T2 i T21(oppgave, veileder, institutt) og T22(id, oppgave).",
          "T21 har nøkkel oppgave og er på BCNF. T22 har ingen ikke-trivielle FD-er, nøkkelen er {id, oppgave}, og den er på BCNF.",
          "Hver deling er tapsfri etter Fagins teorem: de felles attributtene (først id, så oppgave) bestemmer resten av den ene delen, altså er de nøkkel i den delen."
        ],
        tips: [
          "Bruk tillukningen av venstresiden til å lage den ene tabellen: X⁺ og resten pluss X. Da er tapsfriheten automatisk.",
          "Sensor trekker −1 per manglende FD eller nøkkel. Skriv opp nøkler og FD-er for hver ny tabell, også for T22 (ingen ikke-trivielle FD-er).",
          "Du kan starte med oppgave -&gt; veileder, institutt i stedet. Du får de samme tre tabellene."
        ],
        del1: null
      }
    ]
  };

  /* =====================================================================
     Perfekte svar
     ===================================================================== */

  IN.PERFEKT["H2020-M1"] = {
    type: "skjonn",
    svar: [{
      del: "1",
      tekst: "<ul><li><b>BRUKER</b> med nøklene <u>Brukernavn</u> og <u>Email</u> (hver for seg) og Navn.</li>" +
        "<li><b>KREDITTKORT</b> med nøkkelen <u>Kortnummer</u> og Utløpsdato.</li>" +
        "<li><b>BENYTTER</b> mellom dem med 1 på begge sider, partiell deltakelse på begge sider og attributtet Registrert_dato.</li></ul>",
      er: ER_M1_SVAR,
      poeng: ["BRUKER med to nøkler (2p)", "BENYTTER 1:1, partiell, med dato (2p)", "KREDITTKORT med nøkkel (1p)"]
    }],
    hvorfor: {
      eli5: "<p>En bruker kan ha ett kort i lommeboka eller ingen, og et kort kan bare høre til én bruker. Datoen kortet ble lagt inn er en lapp som henger på selve koblingen mellom bruker og kort.</p>",
      normal: "<p>Bruker og kredittkort er to ting med egne opplysninger, altså to entiteter. Brukernavn og email er unike hver for seg og blir to nøkler. Siden begge sider kan være «ingen eller én», er relasjonen 1:1 uten total deltakelse.</p>",
      teknisk: "<p>1:1 med partiell deltakelse på begge sider betyr at vi ikke kan slå entitetene sammen, og at hver side kan eksistere alene. Registreringsdatoen er et faktum om paret bruker–kort, så den hører naturlig hjemme på relasjonen. Ved realisering ville den fulgt fremmednøkkelen. Kortnummer er en naturlig nøkkel for kortet, fordi to kort aldri har samme nummer.</p>"
    },
    sensor: {
      kilde: skilde("Modellering", 1),
      deler: [{ del: "1", kriterier: SV_MOD_GENERELT + "<ul><li>2 poeng for BRUKER</li><li>2 poeng for BENYTTER</li><li>1 poeng for KREDITTKORT</li></ul>" }],
      merknad: "Løsningsforslaget viser til en figur («Se figur 1 eller figur 2 (ORM2).») som ikke er gjengitt. Der er BENYTTER 1:1 mellom BRUKER og KREDITTKORT."
    }
  };

  IN.PERFEKT["H2020-M2"] = {
    type: "skjonn",
    svar: [{
      del: "2",
      tekst: "<ul>" +
        "<li><b>PRODUKT</b> (<u>ProduktID</u>, Navn) og <b>LEVERANDØR</b> (<u>ID</u>, Epost som flerverdiattributt), koblet med <b>SELGER</b> (M:N).</li>" +
        "<li><b>BESTILLING</b> (<u>Bestillingsnummer</u>, Dato, Pris, Leveringsadresse sammensatt av Land, By, Postkode og Gateadresse, der Gateadresse igjen består av Gatenavn og Nummer).</li>" +
        "<li><b>PLASSERT</b>: 1 ved BRUKER, N ved BESTILLING, total deltakelse for BESTILLING.</li>" +
        "<li><b>BESTILLINGSLINJE</b> er en svak entitet med svak nøkkel <u>Linjenummer</u> og Antall, eid av BESTILLING via den identifiserende relasjonen <b>INNEHOLDER</b> (1 ved BESTILLING, N ved linjen, total deltakelse på begge sider).</li>" +
        "<li><b>HAR_PRODUKT</b> og <b>HAR_LEVERANDØR</b>: N ved BESTILLINGSLINJE og 1 ved PRODUKT og LEVERANDØR, total deltakelse for linjen.</li></ul>" +
        "<p>Kommentar på tegningen: «Modellen sikrer ikke at leverandøren på en linje faktisk selger produktet (SELGER). Det må sjekkes på annen måte.»</p>",
      er: ER_M2_SVAR,
      poeng: ["BESTILLING med sammensatt adresse (2p)", "PRODUKT og LEVERANDØR (1p + 1p)", "BESTILLINGSLINJE med INNEHOLDER (3p)", "SELGER, PLASSERT, HAR_PRODUKT og HAR_LEVERANDØR (2p hver)"]
    }],
    hvorfor: {
      eli5: "<p>En bestilling er som en handlelapp med nummererte linjer. Linje 1 og linje 2 gir bare mening på akkurat den lappen, og derfor henger linjene fast i bestillingen. På hver linje står ett produkt, én butikk som selger det, og hvor mange du vil ha.</p>",
      normal: "<p>Linjenummeret er bare unikt innen én bestilling, så bestillingslinjen er en svak entitet. Den kan ikke identifiseres uten bestillingsnummeret. «Ingen bestilling uten bruker» og «en eller flere linjer» blir total deltakelse. «Nøyaktig ett produkt og nøyaktig én leverandør» blir N:1-relasjoner med total deltakelse for linjen.</p>",
      teknisk: "<p>Den svake entiteten har alltid total deltakelse i den identifiserende relasjonen. Her har også den identifiserende entiteten total deltakelse, fordi en bestilling har minst én linje. Leveringsadressen er et sammensatt attributt i to nivåer. Epost-adressene til en leverandør er en mengde enkle verdier, altså et flerverdiattributt. SELGER (M:N) og koblingene fra linjen er uavhengige relasjoner, så ER-modellen kan ikke uttrykke at paret produkt–leverandør på linjen må finnes i SELGER. Den slags skranker skriver vi som kommentar. Det finnes en utvidelse av ER der en hel relasjon (her SELGER) kan behandles som en enhet som linjen kobles til. Den kalles også aggregering, men har ingenting med aggregering i SQL (sum, count) å gjøre, og den står ikke i lysarkene.</p>"
    },
    sensor: {
      kilde: skilde("Modellering", 2),
      deler: [{ del: "2", kriterier: SV_MOD_GENERELT + "<ul><li>2 poeng for BESTILLING</li><li>1 poeng for hver av PRODUKT og LEVERANDØR</li>" +
        "<li>3 poeng for BESTILLINGSLINJE (inkludert INNEHOLDER)</li><li>2 poeng for hver relasjon (utenom INNEHOLDER)</li></ul>" }],
      merknad: "Løsningsforslaget viser til en figur («Se figur 1 eller figur 2 (ORM2).») som ikke er gjengitt. Der er Bestillingslinje svak via INNEHOLDER, med HAR_PRODUKT og HAR_LEVERANDØR som N:1, PLASSERT som 1:N og SELGER som M:N."
    }
  };

  IN.PERFEKT["H2020-M3"] = {
    type: "skjonn",
    svar: [{
      del: "3",
      tekst: "<ul>" +
        "<li><b>ANMELDER</b> (M:N) mellom BRUKER og PRODUKT med attributtene Stjerner og Beskrivelse.</li>" +
        "<li><b>ØNSKELISTE</b> er en svak entitet med svak nøkkel <u>Navn</u> og Dato_laget, eid av BRUKER via den identifiserende relasjonen <b>LAGER</b> (1 ved BRUKER, N og total deltakelse ved ØNSKELISTE).</li>" +
        "<li><b>INNEHOLDER_PRODUKT</b> (M:N) mellom ØNSKELISTE og PRODUKT.</li>" +
        "<li><b>ANBEFALER</b> er ternær: to ledd til BRUKER med rollene <i>anbefaler</i> (K) og <i>mottaker</i> (N), og ett ledd til PRODUKT (M). Attributtet Dato står på relasjonen.</li></ul>",
      er: ER_M3_SVAR,
      poeng: ["ØNSKELISTE med LAGER (3p)", "ternær ANBEFALER med roller og dato (4p)", "ANMELDER med attributter (2p)", "INNEHOLDER_PRODUKT (1p)"]
    }],
    hvorfor: {
      eli5: "<p>En ønskeliste heter for eksempel «Bøker», men mange personer kan ha en liste med det navnet. Derfor henger listen fast i eieren sin. En anbefaling er et lite kort der det står hvem som anbefaler, hvem som får tipset og hvilket produkt det gjelder. Tre ting på ett kort, altså én rombe med tre streker.</p>",
      normal: "<p>Ønskelisten er svak fordi navnet bare er unikt per bruker. Anmeldelser og innholdet i ønskelister er vanlige M:N-relasjoner. Anbefalingen kobler tre deltakere, der BRUKER er med to ganger i ulike roller, så den blir ternær med rollenavn.</p>",
      teknisk: "<p>En ternær relasjon trengs når faktumet bare gir mening med alle tre deltakerne samtidig. Tre binære relasjoner (anbefaler–produkt, mottaker–produkt, anbefaler–mottaker) kan ikke si hvem som anbefalte hva til hvem. Når samme entitetstype opptrer i to ledd, skiller rollene dem. Oppgaven sier at gitt to av deltakerne kan det være mange av den tredje, så alle tre leddene er «mange». Anmeldelsens stjerner og tekst beskriver paret bruker–produkt og står derfor på relasjonen.</p>"
    },
    sensor: {
      kilde: skilde("Modellering", 3),
      deler: [{ del: "3", kriterier: SV_MOD_GENERELT + "<ul><li>3 poeng for ØNSKELISTE inkludert LAGER</li><li>4 poeng for ANBEFALER_PRODUKT_TIL</li>" +
        "<li>2 poeng for ANMELDER</li><li>1 poeng for INNEHOLDER</li></ul>" }],
      merknad: "Løsningsforslaget viser til en figur («Se figur 1 (ER) eller figur 2 (ORM2).») som ikke er gjengitt. Der heter den ternære relasjonen ANBEFALER_PRODUKT_TIL, og relasjonen mellom ØNSKELISTE og PRODUKT heter INNEHOLDER."
    }
  };

  IN.PERFEKT["H2020-M4"] = {
    type: "eksamen",
    svar: [{
      del: "4",
      tekst: "<p>Realisering etter algoritmen (entiteter, svak entitet, 1:1, 1:N, M:N, flerverdiattributt):</p>",
      skjema: "Music_album(Id, Web_page, Name, Price, Recorded_by, Recording_date, Created_by)\n" +
        "  KN: {Id}, {Web_page}\n  PN: Id\n  FN: Music_album(Recorded_by) -> Record_house(OrgNr)\n  FN: Music_album(Created_by) -> Music_band(Id)\n\n" +
        "Song(Album_id, SongNr, Name, Duration)\n  KN/PN: {Album_id, SongNr}\n  FN: Song(Album_id) -> Music_album(Id)\n\n" +
        "Record_house(OrgNr, Name)\n  KN/PN: {OrgNr}\n\n" +
        "Record_house_phone(OrgNr, PhoneNr)\n  KN/PN: {OrgNr, PhoneNr}\n  FN: Record_house_phone(OrgNr) -> Record_house(OrgNr)\n\n" +
        "Music_band(Id, Name, Email, Phone, Manager, Appointment_date)\n  KN/PN: {Id}\n  FN: Music_band(Manager) -> Singer(Id)\n\n" +
        "Singer(Id, Name, Mentor)\n  KN/PN: {Id}\n  FN: Singer(Mentor) -> Singer(Id)\n\n" +
        "Has_member(Band_id, Singer_id, Start_date)\n  KN/PN: {Band_id, Singer_id}\n  FN: Has_member(Band_id) -> Music_band(Id)\n  FN: Has_member(Singer_id) -> Singer(Id)\n\n" +
        "Has_discount_with(Band_id, OrgNr, Discount_amount)\n  KN/PN: {Band_id, OrgNr}\n  FN: Has_discount_with(Band_id) -> Music_band(Id)\n  FN: Has_discount_with(OrgNr) -> Record_house(OrgNr)",
      etter: "<p><b>Valg:</b></p><ul>" +
        "<li>Music_album har to kandidatnøkler. Id er valgt som PN fordi den er kort og stabil.</li>" +
        "<li>ContactInfo er sammensatt, så bare delene Email og Phone tas med.</li>" +
        "<li>SONG er svak: PN er Id (Album_id) fra den identifiserende entiteten pluss SongNr. CONSISTS_OF realiseres ikke på nytt.</li>" +
        "<li>RECORDED_BY og CREATED_BY (1:N): FN på N-siden i Music_album. Det sparer to tabeller, og RecordingDate følger med.</li>" +
        "<li>HAS_MANAGER (1:1, partiell på begge sider): FN-en Manager legges i Music_band, fordi de fleste band trolig har en manager, mens de fleste sangere ikke er manager. Det gir færre NULL. Manager er unik (1:1), men kan være NULL og er derfor ikke en kandidatnøkkel.</li>" +
        "<li>MENTORS (rekursiv 1:N): en mentee har én mentor, så Mentor legges i Singer og peker til Singer selv.</li>" +
        "<li>HAS_MEMBER og HAS_DISCOUNT_WITH (M:N) blir egne tabeller. Relasjonsattributtene er ikke del av nøkkelen.</li>" +
        "<li>Flerverdiattributtet PhoneNr blir Record_house_phone med alle attributtene som nøkkel.</li></ul>",
      poeng: ["4 vanlige entiteter (0,5p hver)", "Song med sammensatt nøkkel og FN (1,5p)", "6 relasjoner (1p hver)", "Record_house_phone (0,5p)"]
    }],
    hvorfor: {
      eli5: "<p>Vi gjør tegningen om til tabeller etter en fast oppskrift. Hver boks blir en tabell. En sang får albumets nummer på seg, siden «spor 3» bare gir mening sammen med albumet. Når hvert album bare har ett plateselskap og ett band, skriver vi dem rett inn i albumtabellen. «Mange til mange» trenger en egen tabell.</p>",
      normal: "<p>Algoritmen går i fast rekkefølge: entiteter, svake entiteter, 1:1, 1:N, M:N og flerverdiattributter. 1:1 og 1:N løses med en fremmednøkkel på den siden som gir færrest NULL, og relasjonsattributtene følger med. M:N og flerverdiattributter blir alltid egne tabeller. Den rekursive MENTORS er bare en 1:N der begge ender er Singer.</p>",
      teknisk: "<p>For en 1:N legger vi FN-en på N-siden, fordi hver rad der har høyst én verdi. For en 1:1 uten total deltakelse kan vi ikke slå sammen. Vi velger siden der fremmednøkkelen oftest har en verdi, og den blir unik, men ikke en kandidatnøkkel, fordi den kan være NULL. Den svake entiteten får PN = PN-en til den identifiserende entiteten + svak nøkkel, og den PN-en er samtidig FN. Dermed er den identifiserende relasjonen allerede uttrykt, og en egen tabell ville vært overflødig (sensor trekker for det). Total deltakelse i HAS_MEMBER kan ikke uttrykkes med fremmednøkler og må eventuelt sikres med andre mekanismer.</p>"
    },
    sensor: {
      kilde: skilde("Modellering", 4),
      deler: [{
        del: "4",
        fasit: "<p><b>Løsninsforslag</b></p>",
        skjema: "• MusicAlbum(Id, Webpage, Name, Price, RecordedBy, RecordedDate, CreatedBy)\n• RecordHouse(OrgNr, Name)\n• MusicBand(Id, Name, Email, Phone, Manager, AppointmentDate)\n" +
          "• Singer(Id, Name, Mentor)\n• Song(SongNr, Album, Name, Duration)\n• HasMember(Band, Singer, StartDate)\n• HasDicountWith(RecordHouse, Band, DiscountAmount)\n" +
          "• RecourdHousePhone(RecordHouse, PhoneNr)\n\nhvor\n\n• Song(Album) → MusicAlbum(Id)\n• MusicAlbum(RecordedBy) → RecordHouse(OrgNr)\n• Band(Manager) → Singer(Id)\n" +
          "• Singer(Mentor) → Singer(Id)\n• MusicAlbum(CreatedBy) → MusicBand(Id)\n• HasMember(Band) → MusicBand(Id)\n• HasMember(Singer) → Singer(Id)\n" +
          "• HasDiscountWith(RecordHouse) → RecordHouse(OrgNr)\n• HasDiscountWith(Band) → MusicBand(Id)\n• RecordHousePhone(RecordHouse) → RecordHouse(OrdNr)",
        etter: "<p>Valg:</p><ul><li>Id som primærnøkkel for MusicAlbum.</li>" +
          "<li>Realiserer HAS_MANAGER som attributt Manager i Band, siden det virker mer sannsynlig at et band har en manager enn at en bestemt sanger " +
          "er manager for et band. Dette vil derfor redusere antall NULL-verdier i databasen.</li>" +
          "<li>Realiserer RECORDED_BY som attributt RecordedBy i MusicAlbum for å redusere antall relasjoner</li>" +
          "<li>Realiserer MENTORS som attributt i Singer, og antar at det er vanlig å ha mentorer</li>" +
          "<li>Realiserer CREATED_BY som attributt i MusicAlbum, og antar at det er vanlig at album er laget av band</li></ul>",
        kriterier: "<p><b>Sensorveiledning</b></p><ul><li>0.5 for hver vanlige entitet</li>" +
          "<li>1.5 poeng for den svake entieten (inkludert den identifiserende relasjonen)</li><li>1 poeng for hver relasjon</li>" +
          "<li>0.5 for multi-valued attributten</li></ul><p><b>Trekk:</b></p><ul><li>-0.5 for manglende attributt</li>" +
          "<li>-0.5 for manglende markering av kanidatnøkler og primærnøkkel</li><li>-0.5 for manglende fremmednøkkelmarkering</li>" +
          "<li>-0.5 for manglende forklaring på valg (eller -2 om ingen forklaring på hele oppgaven)</li>" +
          "<li>-0.5 for å realisere den identifiserende relasjonen dobbelt</li></ul>"
      }],
      merknad: "Understreking og fet skrift fra løsningsforslaget kommer ikke med i ren tekst. Skrivefeilene står slik i sensorveiledningen: «Løsninsforslag», «HasDicountWith», «RecourdHousePhone», " +
        "«RecordHouse(OrdNr)» (for OrgNr), «Band(Manager)» (for MusicBand), «entieten» og «kanidatnøkler». Attributtet heter RecordingDate i modellen, men RecordedDate i løsningsforslaget."
    }
  };

  IN.PERFEKT["H2020-S2"] = {
    type: "eksamen",
    svar: [{
      del: "2",
      sql: "SELECT b.navn, v.nedbør, v.vind\nFROM land AS l\n  INNER JOIN by AS b ON (b.lid = l.lid)\n  INNER JOIN værmelding AS v ON (v.bid = b.bid)\nWHERE l.navn = 'Italia'\n  AND v.dato = '2020-12-17'\nORDER BY b.navn;",
      tabell: { kolonner: ["navn", "nedbør", "vind"], rader: [["Firenze", 1.3, 6], ["Roma", 0, 1]] },
      tekst: "<p>Resultatet på eksempeldataene:</p>",
      poeng: ["join av land, by og værmelding", "filter på landnavn og dato", "riktige kolonner", "ORDER BY bynavn"]
    }],
    hvorfor: {
      eli5: "<p>Vi finner Italia i landlisten, ser hvilke byer som ligger der, og slår opp værmeldingen for 17. desember for hver av dem. Til slutt sorterer vi byene alfabetisk.</p>",
      normal: "<p>Landnavnet, bynavnet og været ligger i hver sin tabell, så vi joiner dem. WHERE plukker ut Italia og riktig dato, og ORDER BY sorterer på bynavn.</p>",
      teknisk: "<p>Vi filtrerer på landnavnet og ikke på lid = 3, slik at spørringen ikke avhenger av hvilke ID-er dataene tilfeldigvis har. Joinene skrives med ON (eller USING), ikke NATURAL JOIN: land og by har begge kolonnen navn, og NATURAL JOIN ville da krevd at bynavnet er lik landnavnet. ORDER BY uten DESC sorterer stigende, altså alfabetisk.</p>"
    },
    sensor: {
      kilde: skilde("SQL", 2),
      deler: [{
        del: "2",
        sql: "SELECT b.navn, v.nedbør, v.vind\nFROM land AS l\n        INNER JOIN by AS b USING (lid)\n        INNER JOIN værmelding AS v USING (bid)\nWHERE l.navn = 'Italia' AND v.dato = '2020-12-17'\nORDER BY b.navn;",
        kriterier: SV_SQL_GENERELT + "<p><b>Oppgave 2:</b></p><ul><li>-1 for manglende sortering</li><li>-1 for by.lid = 3 i WHERE</li>" +
          "<li>-2 for å ikke begrense til Italia (hverken joine med land eller begrense i WHERE)</li><li>Ingen trekk for feil datoformat (slik som '17.12.2020')</li></ul>"
      }],
      merknad: "De generelle punktene gjelder hele SQL-delen og er tatt med i hver oppgave."
    }
  };

  IN.PERFEKT["H2020-S3"] = {
    type: "eksamen",
    svar: [{
      del: "3",
      sql: "SELECT b.navn, sum(v.nedbør) AS total_nedbør, avg(v.vind) AS snitt_vind\nFROM by AS b\n  INNER JOIN værmelding AS v ON (v.bid = b.bid)\nWHERE v.dato >= '2020-12-24'\n  AND v.dato <= '2020-12-31'\nGROUP BY b.bid, b.navn;",
      tabell: { kolonner: ["navn", "total_nedbør", "snitt_vind"], rader: [["Bremen", 0, 0], ["New York", 5.1, 4]] },
      tekst: "<p>Resultatet på eksempeldataene (rekkefølgen er ikke bestemt):</p>",
      poeng: ["join av by og værmelding", "datointervall med begge grenser inkludert", "GROUP BY per by", "sum og avg"]
    }],
    hvorfor: {
      eli5: "<p>For hver by samler vi værmeldingene fra julaften til nyttårsaften i en bunke. Så legger vi sammen regnet og regner ut gjennomsnittet av vinden i hver bunke.</p>",
      normal: "<p>WHERE beholder bare meldingene i romjulsuka. GROUP BY lager én gruppe per by, og sum og avg regner ut for hver gruppe.</p>",
      teknisk: "<p>WHERE filtrerer radene før grupperingen, så aggregatene ser bare romjulsdagene. Vi grupperer på bid, fordi to byer kan ha samme navn. navn er med i GROUP BY for å kunne stå i SELECT (PostgreSQL godtar det også uten, fordi bid er primærnøkkelen). Byer uten meldinger i perioden kommer ikke med. Det er rimelig her, siden det ikke finnes noe å summere for dem.</p>"
    },
    sensor: {
      kilde: skilde("SQL", 3),
      deler: [{
        del: "3",
        sql: "SELECT b.navn, sum(v.nedbør) AS sum_nedbør, avg(v.vind) AS avg_vind\nFROM by AS b INNER JOIN værmelding AS v USING (bid)\nWHERE v.dato >= '2020-12-24' AND v.dato <= '2020-12-31'\nGROUP BY b.bid, b.navn;",
        kriterier: SV_SQL_GENERELT + "<p><b>Oppgave 3:</b></p><ul><li>-2 for manglende GROUP BY</li></ul>"
      }],
      merknad: "De generelle punktene gjelder hele SQL-delen og er tatt med i hver oppgave."
    }
  };

  IN.PERFEKT["H2020-S4"] = {
    type: "eksamen",
    svar: [{
      del: "4",
      sql: "SELECT b.navn\nFROM by AS b\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM værmelding AS v\n  WHERE v.bid = b.bid\n    AND v.dato >= '2020-12-24'\n    AND v.dato <= '2020-12-31'\n    AND (v.nedbør > 0 OR v.vind > 0)\n);",
      tekst: "<p>Under antakelsen i oppgaven (melding for alle byer hver dag) gir dette byene der alle meldingene i perioden har 0 nedbør og 0 vind. " +
        "Eksempeldataene oppfyller ikke antakelsen, så der kommer også byer uten meldinger med (13 byer, alle unntatt New York).</p>",
      poeng: ["riktig datointervall", "«finnes ikke en dag med regn eller vind», ikke «finnes en rolig dag»", "OR mellom nedbør og vind inne i delspørringen"]
    }],
    hvorfor: {
      eli5: "<p>Vi går gjennom byene én og én og leter etter en eneste dag i romjula med regn eller vind. Finner vi ingen slik dag, skriver vi opp byen.</p>",
      normal: "<p>«Ikke noe regn og ikke noe vind i hele perioden» er det samme som «det finnes ingen dag i perioden med regn eller vind». Det er akkurat det NOT EXISTS uttrykker.</p>",
      teknisk: "<p>Den naive varianten WHERE nedbør = 0 AND vind = 0 svarer på «finnes det en rolig dag?», mens oppgaven spør om alle dager. «For alle» skrives i SQL som «det finnes ikke et moteksempel». Vi foretrekker NOT EXISTS fremfor NOT IN, fordi NOT IN gir NULL (ukjent) hvis delspørringen inneholder NULL (tilleggsfelle, står ikke i kursmaterialet). Her er bid i værmelding del av primærnøkkelen og kan ikke være NULL, så sensors NOT IN-variant er også trygg. HAVING-varianten (sum = 0) virker under antakelsen, men den mister byer uten meldinger, mens NOT EXISTS tar dem med.</p>"
    },
    sensor: {
      kilde: skilde("SQL", 4),
      deler: [{
        del: "4",
        sql: ["SELECT navn\nFROM by\nWHERE bid NOT IN (\n   SELECT bid\n   FROM værmelding\n   WHERE dato >= '2020-12-24' AND\n         dato < '2021-01-01' AND\n         (nedbør > 0 OR vind > 0)\n);",
              "-- eller\nSELECT b.navn\nFROM by AS b INNER JOIN værmelding AS v USING (bid)\nWHERE dato >= '2020-12-24' AND\n      dato < '2021-01-01'\nGROUP BY b.bid, b.navn\nHAVING sum(v.nedbør) = 0 AND sum(v.vind) = 0;"],
        kriterier: SV_SQL_GENERELT + "<p><b>Oppgave 4:</b></p><ul><li>-2 for aggregering i WHERE-klausulen</li><li>-3 poeng for følgende:" +
          "<pre>SELECT DISTINCT b.navn\nFROM by AS b INNER JOIN værmelding AS v USING(bid)\nWHERE nedbør = 0 AND vind = 0 AND\n      dato >= '2020-12-24' AND dato &lt; '20201-01-01'</pre></li></ul>"
      }],
      merknad: "«eller» står som tekst mellom de to spørringene i sensorveiledningen og er her lagt inn som en SQL-kommentar. Datoen '20201-01-01' i trekkeksempelet er en skrivefeil i sensorveiledningen. De generelle punktene gjelder hele SQL-delen."
    }
  };

  IN.PERFEKT["H2020-S5"] = {
    type: "eksamen",
    svar: [{
      del: "5",
      sql: "CREATE VIEW steder AS\nSELECT b.navn, l.navn AS posisjon, v.nedbør, v.vind\nFROM by AS b\n  INNER JOIN land AS l ON (l.lid = b.lid)\n  INNER JOIN værmelding AS v ON (v.bid = b.bid)\nWHERE v.dato = current_date\nUNION ALL\nSELECT p.navn, p.adresse AS posisjon, v.nedbør, v.vind\nFROM poi AS p\n  INNER JOIN værmelding AS v ON (v.bid = p.bid)\nWHERE v.dato = current_date\n  AND p.adresse IS NOT NULL;",
      tekst: "<p>Med dagens dato lik 2020-12-17 inneholder viewet de samme 19 radene som eksempelet i oppgaven (8 byer og 11 POI-er). Linken og Berlinmuren mangler adresse og er ikke med.</p>",
      poeng: ["CREATE VIEW", "byene med landnavn som posisjon", "POI-ene med byens vær og adresse som posisjon", "adresse IS NOT NULL", "kolonnen heter posisjon"]
    }],
    hvorfor: {
      eli5: "<p>Vi lager to lister, en over byer med land og vær og en over severdigheter med adresse og byens vær. Så stifter vi listene sammen til én. Severdigheter uten adresse lar vi ligge.</p>",
      normal: "<p>UNION stabler resultatet av to spørringer med samme antall kolonner. Første del gir byene, andre del POI-ene, som arver været fra byen sin via bid. IS NOT NULL fjerner POI-ene uten adresse, og viewet lagrer det hele under navnet steder.</p>",
      teknisk: "<p>Kolonnenavnene i en UNION kommer fra første del, så det er der posisjon må navngis. POI-delen trenger ikke tabellen by, fordi poi.bid kan joines rett mot værmelding.bid. Testen adresse != NULL gir NULL (ukjent) for alle rader og ville fjernet alle POI-ene, så vi må bruke IS NOT NULL. UNION ALL beholder duplikater, mens UNION må sammenligne radene for å fjerne dem, så UNION ALL gjør mindre arbeid. Sensor godtar begge. Her kan en by og en POI i prinsippet ha like rader, og da er det riktig at begge vises. current_date gjør at viewet alltid viser dagens vær.</p>"
    },
    sensor: {
      kilde: skilde("SQL", 5),
      deler: [{
        del: "5",
        sql: "CREATE VIEW steder AS\nSELECT b.navn, l.navn AS posisjon, v.nedbør, v.vind\nFROM land AS l INNER JOIN by AS b USING (lid)\n       INNER JOIN værmelding AS v USING (bid)\nWHERE v.dato = current_date -- l.navn er markert med NOT NULL\nUNION ALL -- også greit med UNION\nSELECT p.navn, p.adresse AS posisjon, v.nedbør, v.vind\nFROM poi AS p INNER JOIN by AS b USING (bid)\n       INNER JOIN værmelding AS v USING (bid)\nWHERE v.dato = current_date AND p.adresse IS NOT NULL;",
        kriterier: SV_SQL_GENERELT + "<p><b>Oppgave 5:</b></p><ul><li>-2 for manglende fjerning av adresser som er NULL</li>" +
          "<li>-1 for ulikehet med NULL (f.eks. adresse != NULL)</li><li>-1 for å mangle å gi navn til posisjon-kolonnen</li><li>-3 for manglende CREATE VIEW</li></ul>"
      }],
      merknad: "De generelle punktene gjelder hele SQL-delen og er tatt med i hver oppgave."
    }
  };

  IN.PERFEKT["H2020-S6"] = {
    type: "eksamen",
    svar: [{
      del: "6",
      sql: "WITH\n  opphold AS (\n    SELECT b.bid, b.navn\n    FROM by AS b\n      INNER JOIN land AS l ON (l.lid = b.lid)\n      INNER JOIN værmelding AS v ON (v.bid = b.bid)\n    WHERE l.navn = 'Frankrike'\n      AND v.dato = '2020-12-17'\n      AND v.nedbør = 0\n  ),\n" +
        "  med_kafeer AS (\n    SELECT o.bid, o.navn\n    FROM opphold AS o\n      INNER JOIN poi AS p ON (p.bid = o.bid)\n    WHERE p.type = 'Kafé'\n    GROUP BY o.bid, o.navn\n    HAVING count(*) >= 3\n  ),\n" +
        "  museum AS (\n    SELECT pid, bid\n    FROM poi\n    WHERE type = 'Museum'\n  ),\n" +
        "  antall AS (\n    SELECT k.bid, k.navn, count(m.pid) AS antall_museer\n    FROM med_kafeer AS k\n      LEFT JOIN museum AS m ON (m.bid = k.bid)\n    GROUP BY k.bid, k.navn\n  )\n" +
        "SELECT navn, antall_museer\nFROM antall\nWHERE antall_museer = (SELECT max(antall_museer) FROM antall);",
      tekst: "<p>På eksempeldataene er svaret tomt: Paris er den eneste franske byen med opphold 17.12, men har ingen kaféer. " +
        "Vi testet spørringen på egne data (Paris med 3 kaféer og 2 museer, Nice med 3 kaféer og 1 museum), og den ga Paris med 2.</p>",
      poeng: ["byer i Frankrike med 0 mm nedbør og minst 3 kaféer (4p)", "telling av museer per by og valg av den høyeste (3p)", "stegene satt riktig sammen (3p)"]
    }],
    hvorfor: {
      eli5: "<p>Vi siler i flere omganger. Først byene i Frankrike med oppholdsvær i morgen, så de av dem med minst tre kaféer. Deretter teller vi museene i hver by som er igjen, og velger byen med flest.</p>",
      normal: "<p>Oppgaven har flere betingelser oppå hverandre, og WITH lar oss ta dem én om gangen med et navn på hvert steg. Kafékravet er en telling, så det trenger GROUP BY og HAVING. Til slutt sammenligner vi med det største antallet museer for å finne vinneren.</p>",
      teknisk: "<p>Kaféer og museer må telles i hvert sitt steg. Joiner vi begge inn samtidig, ganges radene og tellingene blir feil. LEFT JOIN mot et forhåndsfiltrert museum-steg med count(m.pid) gir 0 for byer uten museer i stedet for å miste dem. Filteret på type står i WITH-steget. Som tilleggsfelle (ikke fra kursmaterialet): i WHERE etter en LEFT JOIN ville filteret fjernet NULL-radene, og byer uten museer ville forsvunnet som ved en indre join. Sammenligningen med max() gir alle byer ved uavgjort, mens ORDER BY … LIMIT 1 velger én tilfeldig. Sensors løsningsforslag bruker selv begge variantene (LIMIT 1 i hovedløsningen, max() i alternativet). «Minst 3» blir &gt;= 3.</p>"
    },
    sensor: {
      kilde: skilde("SQL", 6),
      deler: [{
        del: "6",
        sql: ["WITH\n   opphold_og_kafeer AS (\n      SELECT b.bid, b.navn\n      FROM land AS l\n              INNER JOIN by AS b USING (lid)\n              INNER JOIN værmelding AS v USING (bid)\n              INNER JOIN poi AS p USING (bid)\n      WHERE l.navn = 'Frankrike' AND\n               v.dato = '2020-12-17' AND\n               v.nedbør = 0 AND\n               p.type = 'Kafé'\n      GROUP BY b.bid, b.navn\n      HAVING count(*) >= 3\n   )\nSELECT o.navn, count(*) AS antall_museer\nFROM opphold_og_kafeer AS o INNER JOIN poi AS p USING (bid)\nWHERE p.type = 'Museum'\nGROUP BY o.bid, o.navn\nORDER BY antall_museer DESC\nLIMIT 1;",
              "-- Alternativ løsning, hvor man antar at “flest museer” gjelder for alle byer i\n-- Frankrike (ikke bare dem med opphold og minst 3 kaféer):\nWITH\n   opphold_og_kafeer AS (\n      SELECT b.bid, b.navn\n      FROM land AS l\n              INNER JOIN by AS b USING (lid)\n              INNER JOIN værmelding AS v USING (bid)\n              INNER JOIN poi AS p USING (bid)\n      WHERE l.navn = 'Frankrike' AND\n                v.dato = '2020-12-17' AND\n                v.nedbør = 0 AND\n                p.type = 'Kafé'\n      GROUP BY b.bid, b.navn\n      HAVING count(*) >= 3\n   ),\n   antall_museer AS (\n      SELECT b.bid, count(*) AS antall_museer\n      FROM by AS b\n              INNER JOIN land AS l USING (lid)\n              INNER JOIN poi AS p USING (bid)\n      WHERE p.type = 'Museum' AND l.navn = 'Frankrike'\n      GROUP BY b.bid, b.navn\n   ),\n   flest_museer AS (\n      SELECT *\n      FROM antall_museer\n      WHERE antall_museer = (SELECT max(antall_museer) FROM antall_museer)\n   )\nSELECT ok.navn, fm.antall_museer\nFROM oppholde_og_kafeer AS ok\n        INNER JOIN flest_museer AS fm USING (bid);"],
        kriterier: SV_SQL_GENERELT + "<p><b>Oppgave 6:</b></p><ul><li>4 for å riktig finne byer med 0 nedbør og mer enn 3 kaféer</li>" +
          "<li>3 for å finne by med flest museer</li><li>3 for å klare å sette resultatene sammen</li>" +
          "<li>Ingen trekk for å sette type = 'Kulturminne' fremfor type = 'Museum'</li></ul>"
      }],
      merknad: "Overskriften «Alternativ løsning …» står som tekst i sensorveiledningen og er her lagt inn som SQL-kommentar. Alternativet bruker «oppholde_og_kafeer» i FROM, men WITH-steget heter opphold_og_kafeer, så spørringen feiler slik den står. " +
        "Sensorpunktet sier «mer enn 3 kaféer», mens oppgaven og løsningsforslaget bruker «minst 3» (&gt;= 3). Den første løsningen mister byer med 0 museer (INNER JOIN), og LIMIT 1 velger bare én by ved uavgjort. De generelle punktene gjelder hele SQL-delen."
    }
  };

  IN.PERFEKT["H2020-R2"] = {
    type: "eksamen",
    svar: [{
      del: "2",
      tekst: "<p><b>Kontroller nøklene først.</b> {A}⁺: A -&gt; C, C -&gt; AD gir D, D -&gt; B gir B. {A}⁺ = {A, B, C, D}. A er altså en kandidatnøkkel alene, og AB er ikke minimal. " +
        "{C}⁺ = {A, B, C, D}, mens {B}⁺ = {D}⁺ = {B, D}. Kandidatnøklene er <b>A og C</b>, og nøkkelattributtene er A og C.</p>" +
        "<p>Splitt C -&gt; AD i C -&gt; A og C -&gt; D, og gå gjennom hver FD:</p><ol>" +
        "<li>D -&gt; B: D er ikke supernøkkel (brudd på BCNF). B er ikke nøkkelattributt (brudd på 3NF). D er ikke en ekte del av en kandidatnøkkel, så 2NF holder. <b>2NF</b>.</li>" +
        "<li>C -&gt; A og C -&gt; D: C er supernøkkel. <b>BCNF</b>.</li>" +
        "<li>B -&gt; D: B er ikke supernøkkel og D ikke nøkkelattributt, men B er ikke del av en kandidatnøkkel. <b>2NF</b>.</li>" +
        "<li>A -&gt; C: A er supernøkkel. <b>BCNF</b>.</li></ol>" +
        "<p><b>Svar: R er på 2NF</b> (den laveste over alle FD-ene).</p>" +
        "<p>Kommentar: «Oppgaven oppgir AB og C som nøkler, men {A}⁺ viser at A alene er nøkkel. Bruker man likevel AB og C, er B et nøkkelattributt og en ekte del av AB. Da gir B -&gt; D 1NF (partiell avhengighet), mens D -&gt; B og A -&gt; C gir 3NF, og R er på 1NF.»</p>",
      poeng: ["riktig bruk av algoritmen på hver FD (4p)", "riktig normalform totalt (1p)", "forklaring for hver FD"]
    }],
    hvorfor: {
      eli5: "<p>Først sjekker vi hvem som egentlig er «sjefer» i tabellen, altså kandidatnøklene. Det viser seg at A er sjef helt alene. Så går vi gjennom hver regel og spør hvor ille den er. Den verste regelen bestemmer karakteren til hele tabellen.</p>",
      normal: "<p>Normalformalgoritmen spør tre ting for hver FD: er venstresiden en supernøkkel, er høyresiden et nøkkelattributt, og er venstresiden en ekte del av en kandidatnøkkel? Svaret avhenger av hvilke nøkler vi har. Derfor regner vi tillukning først og oppdager at A alene er nøkkel. Med nøklene A og C bryter D -&gt; B og B -&gt; D 3NF, men ikke 2NF.</p>",
      teknisk: "<p>Et nøkkelattributt er et attributt som er med i minst én kandidatnøkkel. Med de riktige nøklene A og C er B og D ikke-nøkkelattributter, og B og D er ikke delmengder av noen kandidatnøkkel. Da bryter D -&gt; B og B -&gt; D 3NF, fordi venstresiden ikke er en supernøkkel og høyresiden ikke er et nøkkelattributt. 2NF holder likevel, fordi venstresiden ikke er en ekte delmengde av noen kandidatnøkkel (ingen partiell avhengighet). R er derfor på 2NF. Under oppgavens premiss (AB og C) blir B et nøkkelattributt. Da tilfredsstiller D -&gt; B 3NF, mens B -&gt; D blir en partiell avhengighet av nøkkelen AB, og R havner på 1NF. Sensor godtok begge svarene fordi feilen ble opplyst sent.</p>"
    },
    sensor: {
      kilde: skilde("Relasjonsmodellen og normalformer", 2),
      deler: [{
        del: "2",
        fasit: "<p>Det er en skrivefeil i oppgaven. A er ihht. FDene en kandidatnøkkel alene, så AB er derfor ikke en kandidatnøkkel.</p>" +
          "<p>Dette ble opplyst om under eksamen, men etter at en del hadde løst oppgaven. Det er derfor to mulige løsninger av oppgaven, en hvor man " +
          "antar at AB og C er kandidatnøklene, og en hvor man antar at A og B er kandidatnøklene.</p>" +
          "<p><b>Løsning om AB og C er kandidatnøkler:</b></p><ol>" +
          "<li>D -&gt; B (3NF)<ul><li>D er ikke en supernøkkel, brudd på BCNF.</li><li>B er en nøkkelattributt, så ikke brudd på 3NF.</li></ul></li>" +
          "<li>(Splitter FDen opp i to):<ul><li>C -&gt; A (BCNF): C er en supernøkkel, ikke brudd på BCNF.</li><li>C -&gt; D (BCNF): C er en supernøkkel, ikke brudd på BCNF.</li></ul></li>" +
          "<li>B -&gt; D (1NF)<ul><li>B er ikke en supernøkkel, brudd på BCNF.</li><li>D er en ikke nøkkelattributt, så brudd på 3NF.</li><li>B er del av en kandidatnøkkel, så brudd på 2NF.</li></ul></li>" +
          "<li>A -&gt; C (3NF)<ul><li>A er ikke en supernøkkel, brudd på BCNF.</li><li>C er en nøkkelattributt, så ikke brudd på 3NF.</li></ul></li></ol>" +
          "<p>Altså er R på 1NF.</p>" +
          "<p><b>Løsning om A og C er kandidatnøkler:</b></p><ol>" +
          "<li>D -&gt; B (2NF)<ul><li>D er ikke en supernøkkel, brudd på BCNF.</li><li>B er ikke nøkkelattributt, så brudd på 3NF.</li><li>D er ikke en del av en kandidatnøkkel, så ikke brudd på 2NF.</li></ul></li>" +
          "<li>(Splitter FDen opp i to):<ul><li>C -&gt; A (BCNF): C er en supernøkkel, ikke brudd på BCNF.</li><li>C -&gt; D (BCNF): C er en supernøkkel, ikke brudd på BCNF.</li></ul></li>" +
          "<li>B -&gt; D (2NF)<ul><li>B er ikke en supernøkkel, brudd på BCNF.</li><li>D er en ikke nøkkelattributt, så brudd på 3NF.</li><li>B er ikke en del av en kandidatnøkkel, så ikke brudd på 2NF.</li></ul></li>" +
          "<li>A -&gt; C (BCNF)<ul><li>A er en supernøkkel, så ikke brudd på BCNF.</li></ul></li></ol>" +
          "<p>Altså er R på 2NF.</p>",
        kriterier: "<ul><li>4 poeng for riktig bruk av algoritmen på hver FD</li><li>1 poeng for riktig normalform totalt</li><li>-2 poeng for ingen forklaringer</li>" +
          "<li>Ikke trekk om man begynner rett på FD 3. (og stopper etter denne) om man antar AB og C som kandidatnøkler</li></ul>"
      }],
      merknad: "Sensorveiledningen skriver «en hvor man antar at A og B er kandidatnøklene», men mener A og C, slik overskriften på den andre løsningen sier. " +
        "I den første løsningen sier punkt 4 at A ikke er supernøkkel. Det følger premisset, men med FD-ene er {A}⁺ hele R, og det er nettopp feilen i oppgaven."
    }
  };

  IN.PERFEKT["H2020-R3"] = {
    type: "eksamen",
    svar: [{
      del: "3",
      tekst: "<p>Vi deler på én BCNF-brytende FD om gangen og bruker tillukningen av venstresiden:</p>",
      skjema: "Student(id, navn, veileder, oppgave, institutt)\n  KN: {id, oppgave}\n  FD: id -> navn, oppgave -> veileder, oppgave -> institutt\n" +
        "  id -> navn bryter BCNF (id er ikke supernøkkel). {id}⁺ = {id, navn}\n\n" +
        "T1(id, navn)\n  KN: {id}\n  FD: id -> navn\n  BCNF: ja (id er supernøkkel)\n\n" +
        "T2(id, veileder, oppgave, institutt)\n  KN: {id, oppgave}\n  FD: oppgave -> veileder, oppgave -> institutt\n" +
        "  oppgave -> veileder bryter BCNF (oppgave er ikke supernøkkel). {oppgave}⁺ = {oppgave, veileder, institutt}\n\n" +
        "T21(oppgave, veileder, institutt)\n  KN: {oppgave}\n  FD: oppgave -> veileder, oppgave -> institutt\n  BCNF: ja\n\n" +
        "T22(id, oppgave)\n  KN: {id, oppgave}\n  FD: ingen ikke-trivielle\n  BCNF: ja\n\n" +
        "Resultat: T1(id, navn), T21(oppgave, veileder, institutt), T22(id, oppgave)",
      etter: "<p>Dekomposisjonen er tapsfri etter Fagins teorem: hver deling skjer langs en FD X -&gt; Y der X er felles for de to delene og X er nøkkel i den ene delen " +
        "(id i T1, oppgave i T21). En naturlig join av delene gir derfor nøyaktig den opprinnelige relasjonen tilbake.</p>",
      poeng: ["første dekomponering med nøkler og FD-er (6p)", "andre dekomponering med nøkler og FD-er (4p)", "forklaring underveis"]
    }],
    hvorfor: {
      eli5: "<p>Tabellen blander opplysninger om studenten (navnet) med opplysninger om oppgaven (veileder og institutt). Vi flytter studentnavnene til én tabell og oppgaveopplysningene til en annen. Igjen står en liten tabell som bare sier hvilken student som har hvilken oppgave.</p>",
      normal: "<p>BCNF krever at alle venstresider er supernøkler. id -&gt; navn og oppgave -&gt; veileder, institutt har venstresider som bare er en del av nøkkelen. Vi trekker hver av dem ut i en egen tabell med venstresiden som nøkkel. Fordi delingen skjer langs FD-ene, kan vi joine tabellene sammen igjen uten å miste eller finne på rader.</p>",
      teknisk: "<p>Algoritmen: finn en FD X -&gt; Y som bryter BCNF, regn X⁺, og del R i R1 = X⁺ og R2 = X ∪ (R − X⁺). De felles attributtene er X, og X er supernøkkel i R1, så delingen er tapsfri etter Fagins teorem. Etter hver deling må vi finne hvilke FD-er som gjelder i hver del (bare de med alle attributtene i delen) og nye kandidatnøkler. T22 har ingen ikke-trivielle FD-er, og en relasjon uten slike er alltid på BCNF. Rekkefølgen spiller ingen rolle her. Starter vi med oppgave -&gt; veileder, institutt, ender vi med de samme tre tabellene.</p>"
    },
    sensor: {
      kilde: skilde("Relasjonsmodellen og normalformer", 3),
      deler: [{
        del: "3",
        fasit: "<p>Dekomponerer med hensyn på id -&gt; navn (id ikke supernøkkel så brudd på BCNF) først og får T1(id, navn) og T2(id, veileder, oppgave, institutt). " +
          "For T1 holder kun den første FDen, og har dermed kandidatnøkkel id, og er dermed på BCNF.</p>" +
          "<p>For T2 holder oppgave -&gt; veileder og oppgave -&gt; institutt og har dermed kandidatnøkkel {id, oppgave}. Den første av de to FDene bryter med BCNF. " +
          "Dekomponerer T2 videre og får T21(oppgave, veileder, institutt) og T22(id, oppgave). For T21 holder FDene 2. og 3. og har da kandidatnøkkel oppgave og er " +
          "den dermed på BCNF. For T22 holder ingen av FDene, og den er dermed også på BCNF.</p>" +
          "<p>Student kan dermed dekomponeres tapsfritt til T1(id, navn), T21(oppgave, veileder, institutt) og T22(id, oppgave).</p>",
        kriterier: "<ul><li>6 poeng for riktig første dekomponering (inkludert nøkler og FDer på de nye relasjonene)</li>" +
          "<li>4 poeng for riktig andre dekomponering (inkludert nøkler og FDer på de nye relasjonene)</li>" +
          "<li>-1 poeng for manglende/feil FD på relasjon</li><li>-1 poeng for feil utregning av tillukning</li>" +
          "<li>-1 poeng for manglende/feil kandidatnøkler</li><li>-3 poeng for ingen forklaringer</li></ul>"
      }]
    }
  };
})();
