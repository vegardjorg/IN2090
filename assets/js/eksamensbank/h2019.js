/* IN2090 · eksamensbank H2019. Kilde: UiO, IN2090/INF1300 eksamen 6.12.2019 (in2090-h19_bm.pdf)
   + løsningsforslag med sensorveiledning (sensorveiledning-eksamen-in2090-19.pdf).
   Oppgavetekst og sensorveiledning ordrett. Våre svar (svar/hvorfor/losning/tips) med egne ord. */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var BANK = (window.IN_EXAM_BANK = window.IN_EXAM_BANK || {});
  IN.PERFEKT = IN.PERFEKT || {};

  /* ---------- Databaseskjemaet for oppgave 2.2–2.8 ---------- */
  var SKJEMA = {
    tittel: "Sjanger, band, personer, album og sanger (oppgave 2.2–2.8)",
    intro: "<p>Sjanger(sjangerID, navn)<br>Band(bandID, navn, startet, sjangerID)<br>Person(personID, navn, født)<br>" +
      "Medlem(personID, bandID)<br>Album(albumID, bandID, navn, utgitt)<br>Sang(sangID, navn, spilletid, albumID)</p>" +
      "<p>med følgende fremmednøkler:</p>" +
      "<p>Band(sjangerID) refererer til Sjanger(sjangerID)<br>Meldem(personID) refererer til Person(personID)<br>" +
      "Medlem(bandID) refererer til Band(bandID)<br>Album(bandID) refererer til Band(bandID)<br>Sang(albumID) refererer til Album(albumID)</p>" +
      "<p>En sjanger består av en unik sjangerID og et navn (f.eks. 'pop' eller 'metal'); et band har en unik bandID, et navn, " +
      "en dato som sier når bandet ble startet og en sjangerID som peker på sjangeren bandet spiller i; en person har en unik personID, " +
      "et navn og en dato personen er født; personer kan være medlem i et band og er beksrevet i relasjonen Medlem (merk at en person " +
      "kan være medlem i mange band og et band kan ha mange medlemmer); et album består av en unik albumID, et navn, bandIDen til bandet " +
      "som lagde albummet, og en dato for når albummet ble utgitt; en sang har en unik sangID, et navn, en spilletid i sekunder, og en " +
      "albumID som sier hvilket album sangen er en del av.</p>" +
      "<p>For eksempel kan databasen inneholde følgende data:</p>",
    tabeller: [
      { navn: "Sjanger", beskrivelse: "",
        kolonner: [
          { navn: "sjangerID", type: "int", pk: true },
          { navn: "navn", type: "text" }
        ],
        eksempel: { kolonner: ["sjangerID", "Navn"], rader: [[0, "Pop"], [1, "Rock"], [2, "Metal"]] } },
      { navn: "Band", beskrivelse: "",
        kolonner: [
          { navn: "bandID", type: "int", pk: true },
          { navn: "navn", type: "text" },
          { navn: "startet", type: "date" },
          { navn: "sjangerID", type: "int", fk: "Sjanger(sjangerID)" }
        ],
        eksempel: { kolonner: ["bandID", "navn", "startet", "sjangerID"],
          rader: [[0, "Blue Floyd", "1985-01-19", 1], [1, "Bettany Swords", "1991-12-01", 0], [2, "Shallow Violett", "1989-04-23", 1]] } },
      { navn: "Person", beskrivelse: "",
        kolonner: [
          { navn: "personID", type: "int", pk: true },
          { navn: "navn", type: "text" },
          { navn: "født", type: "date" }
        ],
        eksempel: { kolonner: ["personID", "navn", "født"],
          rader: [[0, "Peter Smith", "1963-02-09"], [1, "Mary Green", "1978-08-16"], [2, "Bettany Evans", "1981-09-09"]] } },
      { navn: "Medlem", beskrivelse: "",
        kolonner: [
          { navn: "personID", type: "int", fk: "Person(personID)" },
          { navn: "bandID", type: "int", fk: "Band(bandID)" }
        ],
        eksempel: { kolonner: ["personID", "bandID"], rader: [[0, 0], [1, 2], [2, 1], [1, 0]] } },
      { navn: "Album", beskrivelse: "",
        kolonner: [
          { navn: "albumID", type: "int", pk: true },
          { navn: "bandID", type: "int", fk: "Band(bandID)" },
          { navn: "navn", type: "text" },
          { navn: "utgitt", type: "date" }
        ],
        eksempel: { kolonner: ["albumID", "bandID", "navn", "utgitt"],
          rader: [[0, 0, "Surfin", "1986-02-07"], [1, 1, "Love", "1999-11-09"], [2, 0, "Fog on the grass", "1990-03-13"]] } },
      { navn: "Sang", beskrivelse: "",
        kolonner: [
          { navn: "sangID", type: "int", pk: true },
          { navn: "navn", type: "text" },
          { navn: "spilletid", type: "int" },
          { navn: "albumID", type: "int", fk: "Album(albumID)" }
        ],
        eksempel: { kolonner: ["sangID", "navn", "spilletid", "albumID"],
          rader: [[0, "Board", 231, 0], [1, "Miss you", 126, 1], [2, "Sharks around", 322, 0], [3, "Fog on the grass", 401, 2], [4, "Biking in the sun", 209, 2]] } }
    ],
    merknad: "Arket oppgir ikke datatyper eller primærnøkler. Typene og PN-markeringen her er våre antakelser ut fra beskrivelsen " +
      "(«unik …ID», datoer og «spilletid i sekunder»). Medlem har ingen oppgitt nøkkel. «Meldem(personID)» i fremmednøkkellisten er " +
      "en skrivefeil på arket for Medlem(personID). Beskrivelsen skriver sjangernavnene med liten forbokstav ('pop'), mens " +
      "eksempeldataene har 'Pop'. Arket gjentar skjemaet, beskrivelsen og eksempeldataene i hver av oppgavene 2.2–2.8."
  };

  /* ---------- ER-modellen i oppgave 1.3 (fra arket) ---------- */
  var ER_13 = {
    entiteter: [
      { id: "BOOK", navn: "BOOK", svak: false, pos: [0, 1],
        attr: [{ navn: "Title" }, { navn: "ISBN", nokkel: true }, { navn: "Web_address", nokkel: true }] },
      { id: "AUTHOR", navn: "AUTHOR", svak: false, pos: [2, 1],
        attr: [{ navn: "Name", deler: [{ navn: "First_name" }, { navn: "Last_name" }] },
               { navn: "Phone_number" }, { navn: "Id", nokkel: true }] },
      { id: "CHAPTER", navn: "CHAPTER", svak: true, pos: [0, 3],
        attr: [{ navn: "Chapter_number", delvisNokkel: true }, { navn: "Title" }] },
      { id: "PUBLISHER", navn: "PUBLISHER", svak: false, pos: [3, 3],
        attr: [{ navn: "Pid", nokkel: true }, { navn: "Office", flerverdi: true }] }
    ],
    relasjoner: [
      { id: "IS_AUTHORED_BY", navn: "IS_AUTHORED_BY", identifiserende: false, pos: [1, 0],
        ledd: [{ entitet: "BOOK", kard: "N", total: true }, { entitet: "AUTHOR", kard: "M", total: true }], attr: [] },
      { id: "HAS_MAIN_CONTACT", navn: "HAS_MAIN_CONTACT", identifiserende: false, pos: [1, 1],
        ledd: [{ entitet: "BOOK", kard: "1", total: false }, { entitet: "AUTHOR", kard: "1", total: false }],
        attr: [{ navn: "Email" }] },
      { id: "CONTAINS", navn: "CONTAINS", identifiserende: true, pos: [0, 2],
        ledd: [{ entitet: "BOOK", kard: "1", total: false }, { entitet: "CHAPTER", kard: "N", total: true }], attr: [] },
      { id: "HAS_CONTRACT_WITH", navn: "HAS_CONTRACT_WITH", identifiserende: false, pos: [3, 2],
        ledd: [{ entitet: "AUTHOR", kard: "N", total: false }, { entitet: "PUBLISHER", kard: "M", total: false }],
        attr: [{ navn: "Amount" }] },
      { id: "IS_PUBLISHED_BY", navn: "IS_PUBLISHED_BY", identifiserende: false, pos: [2, 3],
        ledd: [{ entitet: "BOOK", kard: "N", total: false }, { entitet: "PUBLISHER", kard: "1", total: false }],
        attr: [{ navn: "Publication_year" }] }
    ],
    merknad: "Tegnet etter ER-modellen på arket. Arket viste i tillegg den samme modellen i ORM2, som ikke er gjengitt her."
  };

  /* ---------- Våre ER-svar (Chen-notasjon) ---------- */
  var ER_11_SVAR = {
    entiteter: [
      { id: "KANDIDAT", navn: "KANDIDAT", svak: false, pos: [0, 0],
        attr: [{ navn: "Personnr", nokkel: true }, { navn: "Email", nokkel: true }, { navn: "Navn" }, { navn: "Adresse" }] },
      { id: "ARBEIDSGIVER", navn: "ARBEIDSGIVER", svak: false, pos: [2, 0],
        attr: [{ navn: "Id", nokkel: true }, { navn: "Navn" },
               { navn: "Kontaktinfo", deler: [{ navn: "Telefonnr" }, { navn: "Email" }, { navn: "Adresse" }] }] }
    ],
    relasjoner: [
      { id: "JOBBER_FOR", navn: "JOBBER_FOR", identifiserende: false, pos: [1, 0],
        ledd: [{ entitet: "KANDIDAT", kard: "N", total: false }, { entitet: "ARBEIDSGIVER", kard: "1", total: false }],
        attr: [{ navn: "Jobbtittel" }] }
    ],
    merknad: "Personnr og Email er to uavhengige nøkler og understrekes hver for seg. Jobbtittel kan også stå på KANDIDAT (sensor godtar begge)."
  };

  var ER_12_SVAR = {
    entiteter: [
      { id: "KANDIDAT", navn: "KANDIDAT", svak: false, pos: [0, 0], attr: [{ navn: "Personnr", nokkel: true }] },
      { id: "INTERVJU", navn: "INTERVJU", svak: true, pos: [0, 2],
        attr: [{ navn: "Nummer", delvisNokkel: true }, { navn: "Dato" }, { navn: "Tidspunkt" }] },
      { id: "INTERVJUER", navn: "INTERVJUER", svak: false, pos: [3, 2],
        attr: [{ navn: "Ansatt_id", nokkel: true }, { navn: "Telefonnr", flerverdi: true }] },
      { id: "EMNE", navn: "EMNE", svak: false, pos: [1, 4],
        attr: [{ navn: "Navn", nokkel: true }, { navn: "Test", flerverdi: true }] }
    ],
    relasjoner: [
      { id: "DELTAR_PÅ", navn: "DELTAR_PÅ", identifiserende: true, pos: [0, 1],
        ledd: [{ entitet: "KANDIDAT", kard: "1", total: false }, { entitet: "INTERVJU", kard: "N", total: true }], attr: [] },
      { id: "HOLDT_AV_OM", navn: "HOLDT_AV_OM", identifiserende: false, pos: [1, 2],
        ledd: [{ entitet: "INTERVJU", kard: "N", total: false }, { entitet: "INTERVJUER", kard: "M", total: false },
               { entitet: "EMNE", kard: "K", total: false }], attr: [] },
      { id: "ER_ANSVARLIG_FOR", navn: "ER_ANSVARLIG_FOR", identifiserende: false, pos: [2, 3],
        ledd: [{ entitet: "INTERVJUER", kard: "1", total: false }, { entitet: "EMNE", kard: "1", total: true }], attr: [] },
      { id: "ER_SERTIFISERT_PÅ", navn: "ER_SERTIFISERT_PÅ", identifiserende: false, pos: [3, 4],
        ledd: [{ entitet: "INTERVJUER", kard: "M", total: true }, { entitet: "EMNE", kard: "N", total: false }],
        attr: [{ navn: "Dato" }, { navn: "Utsteder" }] }
    ],
    merknad: "KANDIDAT er tegnet med bare nøkkelen, slik oppgaven tillater når modellen deles i to. " +
      "Tallet ved en entitet sier hvor mange av den entiteten den andre siden kan knyttes til: ved EMNE står 1 i ER_ANSVARLIG_FOR fordi en intervjuer er ansvarlig for høyst ett emne."
  };

  /* ---------- Felles tekst fra sensorveiledningen ---------- */
  var SV_MOD_GENERELT = "<p><b>Generelt</b></p><ul>" +
    "<li>-0.5 for feil plassering av total deltakelse eller riktig kardinalitet, men feil plassering</li>" +
    "<li>-1 for feil kardinalitet eller manglende total deltakelse</li>" +
    "<li>-2 for manglende kardinalitet på hele relasjonen</li>" +
    "<li>-1 for manglende attributt-markeringer (nøkkel eller multi-valued)</li>" +
    "<li>-2 for manglende nøkkel-attributt, multivalued-attributt, el.</li>" +
    "<li>-1 for manglende/feil plassering av vanlig attributt</li>" +
    "<li>-2 for manglende markering av svak entitet eller identifiserende relasjon</li></ul>";
  var SV_SQL_GENERELT = "<p>For denne og de neste oppgavene:</p><ul>" +
    "<li>-2 for manglende %</li><li>-1 for = fremfor LIKE</li><li>-2 for AND i stedet for OR</li>" +
    "<li>-1 for manglende eller ekstra kolonner</li></ul>" +
    "<p>Ingen trekk for sammenlikning direkte med årstall, håndtere datoer som strenger, el. (INF1300 og tidligere IN2090 " +
    "gjennomgikk ikke håndtering av datoer i detalj.)</p>";
  var ORM_AVVIK = "Arket lot deg velge mellom ER og ORM2. ORM2 er ikke pensum i IN2090 nå, så svaret vårt bruker bare ER (Chen-notasjon). " +
    "Eksamen gjaldt både IN2090 og INF1300, og hjelpemidlene var to lærebøker og fire håndskrevne sider (nå er alle trykte og skrevne hjelpemidler tillatt).";

  BANK["H2019"] = {
    year: "H2019", dato: "06.12.2019", varighet: "4 timer (14:30–18:30)",
    hjelpemidler: "Læreboka Elmasri &amp; Navathe: Fundamentals of Database Systems, Global Edition, 7th Edition (læreboken brukt i IN2090, fom. 2019). " +
      "Læreboka Halpin &amp; Morgan: Information Modelling and Relational Databases, Second Edition (læreboken brukt i INF1300 og IN2090 høsten 2018). " +
      "4 håndskrevne A4-sider med notater (2 ark hvis det er skrevet på begge sider)",
    deler: [{ navn: "Modellering", poeng: 40 }, { navn: "SQL", poeng: 50 }, { navn: "Relasjonsmodellen", poeng: 10 }],
    skjema: SKJEMA,
    er: { "1.3": ER_13 },
    oppgaver: [
      /* ===================== 1 Modellering ===================== */
      {
        key: "H2019-1.1", year: "H2019", oppgave_nr: "Oppgave 1.1", ark: "Modellering: Kandidater", title: "Kandidater og arbeidsgiver",
        points: 7, block: "er", tema: ["entitet", "nøkkel", "sammensatt attributt", "1:N", "relasjonsattributt"], ordrett: true,
        oppgave: "<p>I denne (og neste) oppgave skal du lage en modell for en database som inneholder informasjon om intervjukandidater " +
          "(for programmvareutviklere) og intervjuene de deltar på. Du velger selv om du vil lage modellen i ER (første side i vedlagt dokument " +
          "gir oversikt over ERs notasjon) eller ORM2 (side 2 over utover i vedlagt dokument gir oversikt over ORM2s notasjon).</p>" +
          "<p>Modellene skal tegnes på papir ved hjelp av Scantron. Du kan velge om du vil lage én stor modell for begge oppgavene, eller om du " +
          "vil dele dem opp i to modeller. Dersom du velger å dele modellen opp i to, trenger du kun å tegne inn entitetene (og deres nøkler) for " +
          "de entitetene du trenger fra oppgave 1 i modellen for oppgave 2. Du må gjerne inkludere kommentarer til modellene. Skriv og tegn tydelig.</p>" +
          "<p>Modellen vi skal lage i denne første oppgaven skal modellere kandidater:</p><ol>" +
          "<li>For hver kandidat skal databasen kunne lagre et personnummer som er unikt for alle kandidater, et navn, en adresse, samt en email " +
          "(som også er unik for hver kandidat).</li>" +
          "<li>Videre skal databasen inneholde informasjon om den nåværende arbeidsgiveren til hver kandidat. Dersom kandidaten er arbeidsledig " +
          "skal ingen arbeidsgiver lagres. Dersom kandidaten har flere enn én arbeidsgiver (f.eks. dersom kandidaten har to deltidsjobber) er vi " +
          "kun interessert i én av dem. (Altså, hver kandidat har maksimalt en arbeidsgiver i vår database). En arbeidsgiver kan ha mange " +
          "kandidater som ansatte. For hver kandidat ønsker vi også å lagre kandidatens nåværende jobbtittel (f.eks. \"produktansvarlig\").</li>" +
          "<li>For hver arbeidsgiver er vi interessert i å lagre en unik ID, et navn, og kontaktinformasjon. Kontakinformasjonen består igjen av " +
          "telefonnummer, email og addresse.</li></ol>" +
          "<p><i>I denne oppgaven skal du svare med digital håndtegning. Bruk eget skisseark (utdelt). Se instruksjon for utfylling av skisseark i lenken under oppgavelinjen.</i></p>",
        avvik: ORM_AVVIK,
        losning: [
          "Les kravene punkt for punkt og finn substantivene: kandidat og arbeidsgiver blir entiteter.",
          "KANDIDAT får Personnr og Email som to separate nøkler (begge er unike hver for seg), pluss Navn og Adresse.",
          "ARBEIDSGIVER får Id som nøkkel, Navn og et sammensatt attributt Kontaktinfo med Telefonnr, Email og Adresse.",
          "Relasjonen mellom dem er N:1: en kandidat har høyst én arbeidsgiver (1 ved ARBEIDSGIVER), en arbeidsgiver kan ha mange kandidater (N ved KANDIDAT).",
          "Ingen total deltakelse: kandidater kan være arbeidsledige, og en arbeidsgiver trenger ikke ha kandidater i databasen.",
          "Jobbtittel hører egentlig til ansettelsesforholdet, så den passer som attributt på relasjonen. På KANDIDAT godtas også."
        ],
        tips: [
          "To unike attributter betyr to nøkler. Understrek begge, hver for seg. Én understrek under begge ville betydd én sammensatt nøkkel.",
          "«Består igjen av» er signalordet for et sammensatt attributt.",
          "Sensor trekker −1 per feil kardinalitet og −0,5 for riktig tall på feil side. Sjekk lesingen: tallet ved ARBEIDSGIVER sier hvor mange arbeidsgivere én kandidat kan ha.",
          "Skriv en kort kommentar om valg du tar, for eksempel hvor du plasserer jobbtittelen."
        ],
        del1: null
      },
      {
        key: "H2019-1.2", year: "H2019", oppgave_nr: "Oppgave 1.2", ark: "Modellering: Intervjuer", title: "Intervjuer (svak entitet og ternær relasjon)",
        points: 18, block: "er", tema: ["svak entitet", "ternær relasjon", "flerverdiattributt", "1:1", "total deltakelse"], ordrett: true,
        oppgave: "<p>Vi skal fortsette på modellen om kandidater fra forrige oppgave. I denne oppgaven skal vi modellere intervjuene.</p>" +
          "<p>I likhet med forrige oppgave kan du velge mellom ER og ORM, og modellen skal lages på papir. Du kan velge om du vil lage én stor " +
          "modell for begge oppgavene, eller om du vil dele dem opp i to modeller. Dersom du velger å dele modellen opp i to, trenger du kun å " +
          "tegne inn entitetene (og deres nøkler) for de entitetene du trenger fra den forige modellen.</p>" +
          "<p>Modellen du skal lage i denne oppgaven skal inneholde informasjon om intervjuer:</p><ol>" +
          "<li>For hver kandidat skal databasen kunne lagre hvilke intrvjuer en kandiat deltar på. Hvert intervju har et intervjunummer, samt en " +
          "dato og et tidspunkt hvor intervjuet ble holdt. Intervjuer kan unikt identifiseres med kombinasjonen av dets intervjunummer og " +
          "personnummeret til kandidaten som deltok på intervjuet. For eksempel: kandidaten med personnummer #123 deltar på intervju #1 holdt " +
          "18.12.19 klokken 14:00; kandidaten med personnummer #123 deltar på intervju #2 dato 21.12.2019 klokken 15:00; kandidaten med " +
          "personnummer #456 deltar på intervju #1 dato 21.12.2019 klokken 15:00, osv.</li>" +
          "<li>Intervjuene blir holdt av en intervjuer på et bestemt emne (hint: bruk en ternær relasjon). Hvert emne har et unikt navn (f.eks. " +
          "\"datastrukturer\") og en mengde tester (i databasen vil vi bare representere testene med et navn). Hver intervjuer har en ansatt-id " +
          "og en mengde telefonnummer.</li>" +
          "<li>Databasen skal kunne lagre at mange intervju kan bli holdt av mange intervjuere for mange emner (med andre ord: gitt et intervju " +
          "og en intervjuer, så kan vi ha mange emner; gitt et intervju og et emne, kan vi ha mange intervjuere; og gitt et emne og en intervjuer " +
          "kan vi ha mange intervju). For eksempel: kandidat med personnummer #123 deltar på intervju #1 holdt av intervjuer med ansatt-id #111 " +
          "om emne \"datastrukturer\"; kandidat med personnummer #456 deltar på intervju med nummer #1 holdt av intervjuer med ansattnummer #111 " +
          "om emne \"Java-programmering\", osv.</li>" +
          "<li>Videre skal databasen kunne lagre at hver intervjuer er sertifisert på minst ett emne (men kan være sertifisert på flere). Hvert " +
          "emne kan ha mange sertifiserte intervjuere. Sertifisering på et emne skjer på en bestemt dato og av en gitt sertifikatutsteder. " +
          "(F.eks. intervjuer med ansatt-id #111 er sertifisert i emne \"datastrukturer\" fra dato 19.01.19 av Universitetet i Oslo.)</li>" +
          "<li>I tillegg har hvert emne nøyaktig én ansvarlig intervjuer (f.eks. den som er ansvarlig for å lage testene for emnet). En inertvjuer " +
          "kan være ansvarlig for maksimalt ett emne (men en intervjuer trenger ikke være ansvarlig for et emne).</li></ol>" +
          "<p><i>I denne oppgaven skal du svare med digital håndtegning. Bruk eget skisseark (utdelt). Se instruksjon for utfylling av skisseark i lenken under oppgavelinjen.</i></p>",
        avvik: ORM_AVVIK + " Skrivefeilene «intrvjuer», «kandiat», «forige» og «inertvjuer» står slik på arket.",
        losning: [
          "Et intervju identifiseres av intervjunummeret sammen med kandidatens personnummer. Det gjør INTERVJU til en svak entitet med Nummer som delvis nøkkel, eid av KANDIDAT gjennom en identifiserende relasjon (DELTAR_PÅ).",
          "INTERVJU har total deltakelse i DELTAR_PÅ, og det står 1 ved KANDIDAT (hvert intervju har én kandidat).",
          "EMNE får Navn som nøkkel og Test som flerverdiattributt. INTERVJUER får Ansatt_id som nøkkel og Telefonnr som flerverdiattributt.",
          "Punkt 3 beskriver en ternær relasjon der alle tre sidene er «mange»: HOLDT_AV_OM med N, M og K.",
          "Sertifisering er M:N mellom INTERVJUER og EMNE med attributtene Dato og Utsteder. Hver intervjuer er sertifisert på minst ett emne, så INTERVJUER har total deltakelse.",
          "Ansvar er 1:1: hvert emne har nøyaktig én ansvarlig (total deltakelse for EMNE og 1 ved INTERVJUER), og en intervjuer er ansvarlig for høyst ett emne (1 ved EMNE, partiell for INTERVJUER)."
        ],
        tips: [
          "«Kan unikt identifiseres med kombinasjonen av dets nummer og … til kandidaten» er standardformuleringen for svak entitet. Marker både dobbelt rektangel, dobbel rombe og stiplet understrek: sensor trekker for hver markering som mangler.",
          "«Nøyaktig én» betyr total deltakelse pluss kardinalitet 1. «Minst ett» betyr total deltakelse.",
          "Hintet om ternær relasjon er en gave. Tre binære relasjoner uttrykker ikke det samme.",
          "Sensor godtok også at en kandidat bare kan delta på ett intervju, fordi teksten ikke sier det eksplisitt. Skriv antakelsen som kommentar.",
          "Ansatt-id er ikke sagt å være unik, men sensor trekker ikke uansett. Det er naturlig å gjøre den til nøkkel."
        ],
        del1: null
      },
      {
        key: "H2019-1.3", year: "H2019", oppgave_nr: "Oppgave 1.3", ark: "Realisering", title: "Book, Author, Publisher og Chapter til relasjoner",
        points: 15, block: "realisering", tema: ["realisering", "svak entitet", "1:1", "1:N", "M:N", "flerverdiattributt", "sammensatt attributt"], ordrett: true,
        oppgave: "<p>Realiser enten ER-modellen eller ORM2-modellen vist under til et databaseskjema ved å bruke algoritmen for realisering. " +
          "Forklar eventuelle valg du tar underveis.</p>" +
          "<p>Bruk <u>understreking</u> for å markere kandidatnøkler. Bruk i tillegg <b>fet skrift</b> for å markere primærnøkkelen for hver " +
          "relasjon (du finner knapper for understreking og fet skrift i menyen over). List også opp alle fremmednøkler på formen T(A) -&gt; P(B) " +
          "(her er attributten(e) A i T fremmednøkkel som referere til relasjon P sin(e) B attributt(er)).</p>" +
          "<p>ER-modell:</p>",
        avvik: "Arket viste både en ER-modell og en ORM2-modell. Bare ER-modellen er tegnet på nytt her, fordi ORM2 ikke er pensum lenger. " +
          "Uten Inspera bruker vi kursets tekstformat (KN, PN og FN på egne linjer) i stedet for understreking og fet skrift.",
        losning: [
          "Vanlige entiteter: Book (to kandidatnøkler, ISBN og Web_address; vi velger ISBN som PN), Author (sammensatt Name blir First_name og Last_name) og Publisher.",
          "Svak entitet: Chapter får eierens nøkkel ISBN pluss den delvise nøkkelen Chapter_number som PN, og ISBN blir FN til Book. Den identifiserende relasjonen CONTAINS skal ikke realiseres en gang til.",
          "1:1 HAS_MAIN_CONTACT: ingen av sidene har total deltakelse, så vi slår ikke sammen. Vi legger FN-en i Book (de fleste bøker har trolig en kontaktperson, mens mange forfattere ikke er kontakt for noen bok), og relasjonsattributtet Email følger med.",
          "1:N IS_PUBLISHED_BY: FN til Publisher på N-siden (Book), sammen med Publication_year.",
          "M:N IS_AUTHORED_BY og HAS_CONTRACT_WITH blir egne relasjoner med begge FN-ene som PN. Amount følger med kontrakten.",
          "Flerverdiattributtet Office blir en egen relasjon der alle attributtene utgjør nøkkelen."
        ],
        tips: [
          "Følg algoritmens rekkefølge og skriv én setning per valg. Sensor trekker −1 for manglende forklaring på 1:1- og 1:N-valgene.",
          "Ikke lag en egen tabell for CONTAINS i tillegg til Chapter. Det koster −2 i denne sensorveiledningen.",
          "Med to kandidatnøkler i Book skal begge markeres som KN, og én velges som PN.",
          "Total deltakelse i IS_AUTHORED_BY kan ikke håndheves med fremmednøkler alene. Det trenger du ikke løse, men du kan nevne det."
        ],
        del1: null
      },

      /* ===================== 2 SQL ===================== */
      {
        key: "H2019-2.1", year: "H2019", oppgave_nr: "Oppgave 2.1", ark: "Skranker og SQL", title: "Lovlig eller ulovlig? PK, FK, UNIQUE, CHECK og CASCADE",
        points: 10, block: "sql", tema: ["skranker", "PRIMARY KEY", "UNIQUE", "REFERENCES", "CHECK", "CASCADE", "INSERT", "UPDATE", "DELETE"], ordrett: true,
        oppgave: "<p>Gitt en database laget av følgende SQL-script:</p>" +
          "<pre>CREATE TABLE art (\n aid int PRIMARY KEY,\n navn text NOT NULL,\n type text CHECK (type = 'Pattedyr' OR type = 'Fisk' OR type = 'Fugl')\n);\n\n" +
          "CREATE TABLE dyr (\n did int PRIMARY KEY,\n navn text NOT NULL,\n mor_til int UNIQUE REFERENCES dyr(did),\n aid int REFERENCES art(aid)\n);\n\n" +
          "INSERT INTO art VALUES\n(0, 'Katt', 'Pattedyr'),\n(1, 'Hund', 'Pattedyr'),\n(2, 'Gris', 'Pattedyr'),\n(3, 'Spurv', 'Fugl');\n\n" +
          "INSERT INTO dyr VALUES\n(0, 'Doglas', NULL, 1),\n(1, 'Mons', NULL, 0),\n(2, 'Plutina', 0, 1),\n(3, 'Princess', NULL, 2),\n(4, 'Caterine', 1, 0);</pre>" +
          "<p>For hver av SQL-kommandoene under, avgjør om de er lovlige i henhold til databaseskjemaet over (altså, kommandoen lykkes uten error) " +
          "eller ulovlige i henhold til databaseskjemaet over (altså kommandoen feiler og gir error).</p>",
        avvik: null,
        losning: [
          "Vurder hver kommando for seg mot startdataene (kommandoene kjøres ikke etter hverandre).",
          "Sjekk skrankene én etter én: PRIMARY KEY (ny did/aid?), NOT NULL, CHECK på type, UNIQUE på mor_til, og fremmednøklene mor_til → dyr(did) og aid → art(aid).",
          "Brukte mor_til-verdier er 0 (Plutina) og 1 (Caterine). Det avgjør UNIQUE-spørsmålene.",
          "Ved DELETE: blir raden referert fra en annen rad? Uten ON DELETE CASCADE gir det error.",
          "DROP TABLE … CASCADE fjerner også fremmednøkkelskranken som peker inn i tabellen, så den lykkes."
        ],
        tips: [
          "UNIQUE tillater flere NULL-verdier, men to like ikke-NULL-verdier gir error.",
          "En UPDATE som treffer flere rader, kan bryte UNIQUE selv om hver rad isolert ser grei ut.",
          "Med −1,25 for galt svar lønner det seg bare å svare når du er over 50 % sikker."
        ],
        del1: {
          type: "flervalg",
          regel: { riktig: 1.25, feil: -1.25, blankt: 0, min: 0 },
          intro: "<p>For hver av SQL-kommandoene under, avgjør om de er lovlige i henhold til databaseskjemaet over (altså, kommandoen lykkes uten error) eller ulovlige i henhold til databaseskjemaet over (altså kommandoen feiler og gir error).</p>",
          items: [
            { q: "<p><code>DROP TABLE art CASCADE;</code></p>", options: ["Ulovlig", "Lovlig"], answer: 1,
              explain: "<p>Lovlig. CASCADE gjør at fremmednøkkelskranken fra dyr(aid) til art fjernes sammen med tabellen. Selve dataene i dyr blir stående.</p>" },
            { q: "<p><code>INSERT INTO dyr VALUES (6, 'Timmy', NULL, 2);</code></p>", options: ["Ulovlig", "Lovlig"], answer: 1,
              explain: "<p>Lovlig. did 6 er ny, mor_til er NULL (UNIQUE godtar flere NULL), og arten med aid 2 finnes.</p>" },
            { q: "<p><code>UPDATE dyr SET mor_til = 3 WHERE did = 0;</code></p>", options: ["Ulovlig", "Lovlig"], answer: 1,
              explain: "<p>Lovlig. Dyret med did 3 finnes, og ingen annen rad har mor_til = 3, så både fremmednøkkelen og UNIQUE holder.</p>" },
            { q: "<p><code>UPDATE dyr SET mor_til = 4 WHERE mor_til IS NULL;</code></p>", options: ["Ulovlig", "Lovlig"], answer: 0,
              explain: "<p>Ulovlig. Tre rader (did 0, 1 og 3) har mor_til NULL og ville alle fått verdien 4. Det bryter UNIQUE på mor_til.</p>" },
            { q: "<p><code>DELETE FROM dyr WHERE did = 3;</code></p>", options: ["Ulovlig", "Lovlig"], answer: 1,
              explain: "<p>Lovlig. Ingen rad har mor_til = 3, så ingen fremmednøkkel peker på Princess.</p>" },
            { q: "<p><code>INSERT INTO art VALUES (4, 'Flue', 'Innsekt');</code></p>", options: ["Ulovlig", "Lovlig"], answer: 0,
              explain: "<p>Ulovlig. 'Innsekt' er ikke en av de tre verdiene CHECK-skranken tillater.</p>" },
            { q: "<p><code>INSERT INTO dyr VALUES (7, 'Mona', 1, 0);</code></p>", options: ["Ulovlig", "Lovlig"], answer: 0,
              explain: "<p>Ulovlig. Caterine har allerede mor_til = 1, og UNIQUE tillater ikke en ny rad med samme verdi.</p>" },
            { q: "<p><code>DELETE FROM dyr WHERE navn = 'Mons';</code></p>", options: ["Ulovlig", "Lovlig"], answer: 0,
              explain: "<p>Ulovlig. Mons har did 1, og Caterine peker på ham via mor_til = 1. Fremmednøkkelen har ingen ON DELETE-regel, så slettingen avvises.</p>" }
          ]
        }
      },
      {
        key: "H2019-2.2", year: "H2019", oppgave_nr: "Oppgave 2.2", ark: "Band etter 2000", title: "Band startet etter 2000 eller med «King» i navnet",
        points: 5, block: "sql", tema: ["WHERE", "LIKE", "OR", "dato"], ordrett: true,
        oppgave: "<p>I denne (og de neste) oppgaven skal du bruke følgende databaseskjema: […]</p>" +
          "<p>Oppgave: Skriv en spørring som finner alle band som enten ble startet etter år 2000 eller inneholder strengen 'King' i navnet. " +
          "Skriv ut navnet på bandet og datoen bandet ble startet.</p>",
        avvik: "Skjemaet, beskrivelsen og eksempeldataene som arket gjentar i hver oppgave 2.2–2.8, står én gang i årets databaseskjema over.",
        losning: [
          "Bare tabellen band trengs.",
          "To betingelser der én av dem holder: koble dem med OR.",
          "«Etter år 2000» tolker vi som startet fra og med 2001-01-01. Sensor godtok også >= '2000-01-01'.",
          "Delstrengen 'King' hvor som helst i navnet: LIKE '%King%'."
        ],
        tips: [
          "Manglende % gir −2, = i stedet for LIKE −1 og AND i stedet for OR −2.",
          "LIKE skiller mellom store og små bokstaver, så skriv 'King' akkurat slik oppgaven gjør.",
          "Skriv tolkningen av «etter 2000» som en kommentar med --."
        ],
        del1: null
      },
      {
        key: "H2019-2.3", year: "H2019", oppgave_nr: "Oppgave 2.3", ark: "Timer Pop-musikk fra 90s", title: "Timer popmusikk fra band startet på 90-tallet",
        points: 5, block: "sql-videre", tema: ["sum", "aggregering", "INNER JOIN", "dato"], ordrett: true,
        oppgave: "<p>I denne (og de neste) oppgaven skal du bruke følgende databaseskjema: […]</p>" +
          "<p>Oppgave: Skriv en spørring som finner antall timer med musikk fra sjangeren 'Pop' laget av band startet mellom år 1990 og 2000. " +
          "Merk: En time er 3600 sekunder.</p>",
        avvik: "Skjemaet og eksempeldataene står én gang i årets databaseskjema over.",
        losning: [
          "Kjeden sjanger → band → album → sang må joines for å komme fra sjangernavnet til spilletiden.",
          "Filtrer på sjangernavnet 'Pop' (ikke på sjangerID 0) og på startdato i 1990-årene.",
          "Svaret er én total, så det trengs ingen GROUP BY. Summer spilletid og del på 3600.0 for å få timer med desimaler.",
          "På eksempeldataene: Bettany Swords (Pop, startet 1991) har én sang på 126 sekunder, altså 0,035 timer."
        ],
        tips: [
          "Ikke hardkod sjangerID = 0. Det gir −2, fordi spørringen skal virke på alle data.",
          "count i stedet for sum gir −1. GROUP BY per band gir −1 fordi oppgaven spør om totalen.",
          "NATURAL JOIN ga −2 her: band, album, sang og sjanger har alle en kolonne som heter navn.",
          "Del på 3600.0 og ikke 3600, ellers kan heltallsdivisjon kutte bort desimalene (sensor godtok det likevel)."
        ],
        del1: null
      },
      {
        key: "H2019-2.4", year: "H2019", oppgave_nr: "Oppgave 2.4", ark: "Personer født på interessant dato", title: "Personer født på en startdato eller utgivelsesdato",
        points: 5, block: "sql-videre", tema: ["IN", "delspørring", "UNION"], ordrett: true,
        oppgave: "<p>I denne (og de neste) oppgaven skal du bruke følgende databaseskjema: […]</p>" +
          "<p>Oppgave: Skriv en spørring som finner navnet på alle personer født på en dato hvor det enten ble startet et nytt band, eller ble gitt ut et nytt album.</p>",
        avvik: "Skjemaet og eksempeldataene står én gang i årets databaseskjema over.",
        losning: [
          "Det er snakk om et hvilket som helst band og album, ikke bandet personen er medlem i. Medlem-tabellen trengs altså ikke.",
          "Sjekk om fødselsdatoen finnes blant startdatoene eller blant utgivelsesdatoene, med to IN-delspørringer koblet med OR (eller én IN mot en UNION).",
          "Med IN blir hver person med høyst én gang, uansett hvor mange band eller album som har samme dato."
        ],
        tips: [
          "Å joine via Medlem (bare bandene personen spiller i) gir −3: det svarer på et annet spørsmål.",
          "Et kryssprodukt av person, band og album med OR gir −2. UNION ALL av to joins gir unødvendige duplikater (−1).",
          "På eksempeldataene er svaret tomt. Det er helt i orden, for spørringen skal virke på alle data."
        ],
        del1: null
      },
      {
        key: "H2019-2.5", year: "H2019", oppgave_nr: "Oppgave 2.5", ark: "Sanger per band", title: "Band med færre enn 3 sanger (også 0)",
        points: 5, block: "sql-videre", tema: ["LEFT JOIN", "GROUP BY", "HAVING", "count"], ordrett: true,
        oppgave: "<p>I denne (og de neste) oppgaven skal du bruke følgende databaseskjema: […]</p>" +
          "<p>Oppgave: Skriv en spørring som finner antall sanger hvert band har laget (altså antall sanger på alle deres album til sammen) for " +
          "band som har laget færre enn 3 sanger. Skriv ut bandIDen, navnet på bandet og antall sanger.</p>" +
          "<p>Merk: Det kan finnes band som ikke har gitt ut noen album ennå eller band som kun har utgitt album uten sanger, disse skal også " +
          "med i resultatet med antall sanger lik 0.</p>",
        avvik: "Skjemaet og eksempeldataene står én gang i årets databaseskjema over.",
        losning: [
          "Band uten album eller uten sanger skal med, så vi bruker LEFT JOIN fra band til album og videre til sang.",
          "Grupper per band (bandID og navn).",
          "Tell sang-ID-ene med count(s.sangID). Den teller ikke NULL, så band uten sanger får 0.",
          "Filtrer gruppene med HAVING count(s.sangID) &lt; 3, siden betingelsen gjelder et aggregat.",
          "På eksempeldataene: Bettany Swords får 1 og Shallow Violett 0. Blue Floyd har 4 sanger og faller bort."
        ],
        tips: [
          "count(*) teller også NULL-radene fra LEFT JOIN, slik at band uten sanger får 1. Det gir −1.",
          "INNER JOIN mister bandene med 0 sanger (−2).",
          "Begge LEFT JOIN-ene må være ytre. Er den andre en INNER JOIN, forsvinner band med tomme album igjen."
        ],
        del1: null
      },
      {
        key: "H2019-2.6", year: "H2019", oppgave_nr: "Oppgave 2.6", ark: "Slett tomme album", title: "Slett album uten sanger",
        points: 5, block: "sql-videre", tema: ["DELETE", "NOT EXISTS", "NOT IN", "delspørring"], ordrett: true,
        oppgave: "<p>I denne (og de neste) oppgaven skal du bruke følgende databaseskjema: […]</p>" +
          "<p>Oppgave: Skrive en SQL-kommando som sletter alle album som ikke har noen tilhørende sanger.</p>",
        avvik: "Skjemaet og eksempeldataene står én gang i årets databaseskjema over. «Skrive» står slik på arket.",
        losning: [
          "Bruk DELETE FROM album (ikke DROP, som fjerner hele tabellen).",
          "Et album skal slettes når det ikke finnes noen sang med samme albumID: WHERE NOT EXISTS (…) eller albumID NOT IN (SELECT albumID FROM sang).",
          "Ingen tabell peker på album bortsett fra sang, og de albumene som slettes, har nettopp ingen sanger. Derfor bryter slettingen ingen fremmednøkler.",
          "På eksempeldataene har alle album sanger, så ingen rader slettes."
        ],
        tips: [
          "DROP i stedet for DELETE gir −1. Joins i FROM gir −2, og inner join med en NOT NULL-sjekk gir −4.",
          "NOT EXISTS er tryggest. NOT IN gir tomt resultat hvis delspørringen inneholder NULL (her kan sang.albumID i prinsippet være NULL).",
          "Sensor ga full uttelling for å tilpasse forrige oppgave riktig, også om den var feil (ingen følgefeil)."
        ],
        del1: null
      },
      {
        key: "H2019-2.7", year: "H2019", oppgave_nr: "Oppgave 2.7", ark: "Nyeste album", title: "VIEW med de 10 nyeste albumene",
        points: 5, block: "sql-videre", tema: ["VIEW", "GROUP BY", "ORDER BY", "LIMIT", "count"], ordrett: true,
        oppgave: "<p>I denne (og de neste) oppgaven skal du bruke følgende databaseskjema: […]</p>" +
          "<p>Oppgave: Skriv en SQL-kommando som lager et view med navn \"nyeste_album\" som inneholder de 10 nyeste albummene. Viewet skal for " +
          "hvert av albummene vise albummets navn og navnet på bandet som utga albummet, datoen albummet er gitt ut, samt antall sanger på " +
          "albummet. Sorter viewet etter når albummet er utgitt, hvor det nyeste er først.</p>" +
          "<p>(Merk: Du kan her anta at alle album har minst én sang)</p>",
        avvik: "Skjemaet og eksempeldataene står én gang i årets databaseskjema over.",
        losning: [
          "Join album, band og sang, og grupper per album for å telle sangene.",
          "Album og band har begge kolonnen navn. Gi kolonnene i viewet egne navn med AS (album og band).",
          "Sorter på utgitt med DESC og ta de ti første med LIMIT 10.",
          "Pakk det hele inn i CREATE VIEW nyeste_album AS …",
          "På eksempeldataene: Love (1999), Fog on the grass (1990) og Surfin (1986), med 1, 2 og 2 sanger."
        ],
        tips: [
          "Manglende LIMIT eller ORDER BY gir −2, manglende DESC −1, og en overflødig ASC −0,5.",
          "To kolonner med samme navn i et view gir feil i PostgreSQL. Navngi dem (−0,5 hvis ikke).",
          "Siden alle album har minst én sang, holder INNER JOIN mot sang her."
        ],
        del1: null
      },
      {
        key: "H2019-2.8", year: "H2019", oppgave_nr: "Oppgave 2.8", ark: "Super-album", title: "Band med super-album (over én time)",
        points: 10, block: "sql-videre", tema: ["WITH", "GROUP BY", "HAVING", "sum", "count"], ordrett: true,
        oppgave: "<p>I denne (og de neste) oppgaven skal du bruke følgende databaseskjema: […]</p>" +
          "<p>Oppgave: Skriv navnet på alle band som har gitt ut et super-album. Et super-album er et album med spilletid på mer enn en time " +
          "(3600 sekunder). Skriv ut bandIDen, navnet på bandet, samt antall super-album bandet har utgitt.</p>" +
          "<p>Hint: Det kan være lurt å først finne \"albumID\" til alle super-album i en egen spørring (f.eks. med WITH). Deretter kan man finne " +
          "bandet som har laget albummene, og telle opp.</p>",
        avvik: "Skjemaet og eksempeldataene står én gang i årets databaseskjema over.",
        losning: [
          "Steg 1 (WITH super_album): grupper sang per albumID og behold albumene der sum(spilletid) &gt; 3600.",
          "Steg 2: join band med album og super_album, grupper per band og tell albumene med count(*).",
          "Band uten super-album skal ikke med, så INNER JOIN er riktig her.",
          "På eksempeldataene er det lengste albumet 610 sekunder, så resultatet er tomt."
        ],
        tips: [
          "Sensor delte poengene i to: 5 for delspørringen som finner super-albumene og 5 for opptellingen per band. Selv en halv løsning gir altså poeng.",
          "Aggregatet sum(spilletid) må stå i HAVING, ikke i WHERE.",
          "Manglende antall gir −3 og manglende GROUP BY −2."
        ],
        del1: null
      },

      /* ===================== 3 Relasjonsmodellen ===================== */
      {
        key: "H2019-3.1", year: "H2019", oppgave_nr: "Oppgave 3.1", ark: "FDer", title: "Tillukning av {A} og {B}, attributter i alle nøkler",
        points: 6, block: "fd", tema: ["tillukning", "kandidatnøkkel", "FD"], ordrett: true,
        oppgave: "<p>Gitt følgende relasjon:</p><p>R(A, B, C, D, E, F, G)</p><p>og følgende funksjonelle avhengigheter (FDer):</p>" +
          "<p>A → C<br>C → B, D<br>A, B → D, F<br>B, E → G</p>" +
          "<p><b>Huk av attributtene som er med i tillukningen til {A}.</b></p>" +
          "<p><b>Huk av attributtene som er med i tillukningen til {B}.</b></p>" +
          "<p><b>Huk av attributtene som må være med i alle kandidatnøkler.</b></p>",
        avvik: "På arket står svaralternativene som avkrysningsbokser i en blandet rekkefølge. Her er hver boks en JA/NEI-påstand (JA = kryss av), i arkets rekkefølge. " +
          "Poengregelen er ulik for de tre delene: +0,4 / +2 / +1 per riktig kryss og −1 per galt kryss. Boksene du lar stå tomme, gir 0.",
        losning: [
          "{A}⁺: start med A. A → C gir C. C → B, D gir B og D. Nå er A og B med, så A, B → D, F gir F. B, E → G kan ikke brukes uten E. Altså {A}⁺ = {A, B, C, D, F}.",
          "{B}⁺: ingen FD har B alene (eller noe som bare består av B) på venstresiden, så {B}⁺ = {B}.",
          "Attributter som aldri står på en høyreside, må være med i alle kandidatnøkler: A og E.",
          "Kontroll: {A, E}⁺ = {A, B, C, D, F} ∪ {E} og så G via B, E → G, altså hele R. Dermed er {A, E} den eneste kandidatnøkkelen, og nettopp A og E er med i alle."
        ],
        tips: [
          "Tillukningen inneholder alltid attributtene du startet med. Husk å krysse av A i {A}⁺ og B i {B}⁺.",
          "Ett galt kryss koster −1, mens et riktig kryss i første del bare gir +0,4. Kryss bare av det du har regnet deg frem til.",
          "Triks for nøkler: aldri på høyresiden betyr med i alle KN, og bare på høyresiden betyr med i ingen."
        ],
        del1: {
          type: "janei",
          avkrysning: true,
          regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
          intro: "<p>Gitt følgende relasjon: R(A, B, C, D, E, F, G) og følgende funksjonelle avhengigheter (FDer): A → C, C → B, D, A, B → D, F, B, E → G</p>",
          items: [
            { s: "Tillukningen til {A}: B", answer: true, regel: { riktig: 0.4, feil: -1 }, explain: "<p>Ja. A → C og så C → B.</p>" },
            { s: "Tillukningen til {A}: E", answer: false, regel: { riktig: 0.4, feil: -1 }, explain: "<p>Nei. E står aldri på en høyreside, så den kommer bare med hvis du starter med den.</p>" },
            { s: "Tillukningen til {A}: G", answer: false, regel: { riktig: 0.4, feil: -1 }, explain: "<p>Nei. G krever B, E → G, og E er ikke med.</p>" },
            { s: "Tillukningen til {A}: F", answer: true, regel: { riktig: 0.4, feil: -1 }, explain: "<p>Ja. Når A og B er med, gir A, B → D, F oss F.</p>" },
            { s: "Tillukningen til {A}: A", answer: true, regel: { riktig: 0.4, feil: -1 }, explain: "<p>Ja. Tillukningen inneholder alltid startmengden.</p>" },
            { s: "Tillukningen til {A}: C", answer: true, regel: { riktig: 0.4, feil: -1 }, explain: "<p>Ja, direkte fra A → C.</p>" },
            { s: "Tillukningen til {A}: D", answer: true, regel: { riktig: 0.4, feil: -1 }, explain: "<p>Ja, fra C → B, D.</p>" },
            { s: "Tillukningen til {B}: D", answer: false, regel: { riktig: 2, feil: -1 }, explain: "<p>Nei. D kommer bare fra C eller fra A og B sammen.</p>" },
            { s: "Tillukningen til {B}: F", answer: false, regel: { riktig: 2, feil: -1 }, explain: "<p>Nei. F krever både A og B.</p>" },
            { s: "Tillukningen til {B}: G", answer: false, regel: { riktig: 2, feil: -1 }, explain: "<p>Nei. G krever både B og E.</p>" },
            { s: "Tillukningen til {B}: B", answer: true, regel: { riktig: 2, feil: -1 }, explain: "<p>Ja, og det er det eneste: ingen FD kan brukes med bare B, så {B}⁺ = {B}.</p>" },
            { s: "Tillukningen til {B}: C", answer: false, regel: { riktig: 2, feil: -1 }, explain: "<p>Nei. C kommer bare fra A.</p>" },
            { s: "Tillukningen til {B}: A", answer: false, regel: { riktig: 2, feil: -1 }, explain: "<p>Nei. A står aldri på en høyreside.</p>" },
            { s: "Tillukningen til {B}: E", answer: false, regel: { riktig: 2, feil: -1 }, explain: "<p>Nei. E står aldri på en høyreside.</p>" },
            { s: "Må være med i alle kandidatnøkler: C", answer: false, regel: { riktig: 1, feil: -1 }, explain: "<p>Nei. C bestemmes av A, så den eneste nøkkelen {A, E} trenger ikke C.</p>" },
            { s: "Må være med i alle kandidatnøkler: D", answer: false, regel: { riktig: 1, feil: -1 }, explain: "<p>Nei. D står bare på høyresider og er derfor i ingen kandidatnøkkel.</p>" },
            { s: "Må være med i alle kandidatnøkler: F", answer: false, regel: { riktig: 1, feil: -1 }, explain: "<p>Nei. F står bare på en høyreside.</p>" },
            { s: "Må være med i alle kandidatnøkler: G", answer: false, regel: { riktig: 1, feil: -1 }, explain: "<p>Nei. G står bare på en høyreside.</p>" },
            { s: "Må være med i alle kandidatnøkler: E", answer: true, regel: { riktig: 1, feil: -1 }, explain: "<p>Ja. E står aldri på en høyreside, så ingen annen kombinasjon kan bestemme den.</p>" },
            { s: "Må være med i alle kandidatnøkler: B", answer: false, regel: { riktig: 1, feil: -1 }, explain: "<p>Nei. B bestemmes av C (og dermed av A).</p>" },
            { s: "Må være med i alle kandidatnøkler: A", answer: true, regel: { riktig: 1, feil: -1 }, explain: "<p>Ja. A står aldri på en høyreside.</p>" }
          ]
        }
      },
      {
        key: "H2019-3.2", year: "H2019", oppgave_nr: "Oppgave 3.2", ark: "Normalformer", title: "Normalform for hver FD",
        points: 4, block: "normalisering", tema: ["normalform", "BCNF", "3NF", "2NF", "nøkkelattributt"], ordrett: true,
        oppgave: "<p>Gitt følgende relasjon</p><p>R(<u>A, B</u>, C, D, E, F)</p>" +
          "<p>hvor kandidatnøkkelen er understreket. (Vi har altså kun én kandidatnøkkel, {A, B} )</p>" +
          "<p><b>For hver av FDene under, anta at FDen gjelder for relasjonen R over, og bruk algoritmen for normalformer til å avgjøre hvilken " +
          "normalform FDen (alene) tilsier at R er på.</b></p>",
        avvik: null,
        losning: [
          "Eneste kandidatnøkkel er {A, B}, så nøkkelattributtene er A og B. C, D, E og F er ikke-nøkkelattributter.",
          "A → C: A er ikke supernøkkel (brudd på BCNF), C er ikke nøkkelattributt (brudd på 3NF), og A er en ekte del av nøkkelen (brudd på 2NF). Altså 1NF.",
          "B → D: samme resonnement som over. 1NF.",
          "A, B → F: venstresiden er en supernøkkel. BCNF.",
          "A, D → E: {A, D} er ikke supernøkkel og E er ikke nøkkelattributt, så BCNF og 3NF brytes. Men {A, D} er ikke en ekte del av noen kandidatnøkkel (D er ikke i nøkkelen), så 2NF holder. 2NF."
        ],
        tips: [
          "Gå gjennom algoritmens tre spørsmål i fast rekkefølge: supernøkkel? nøkkelattributt på høyresiden? venstresiden en ekte del av en KN?",
          "2NF brytes bare når venstresiden er en <i>ekte delmengde</i> av en kandidatnøkkel. {A, D} inneholder A, men er ikke en delmengde av {A, B}.",
          "Kolonnerekkefølgen på arket var 3NF, 2NF, BCNF, 1NF. Les overskriftene før du krysser av."
        ],
        del1: {
          type: "normalform",
          regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
          intro: "<p>For hver av FDene under, anta at FDen gjelder for relasjonen R over, og bruk algoritmen for normalformer til å avgjøre hvilken normalform FDen (alene) tilsier at R er på.</p>",
          items: [
            { q: "<p>A -&gt; C</p>", options: ["3NF", "2NF", "BCNF", "1NF"], answer: 3,
              explain: "<p>1NF. A er en ekte del av kandidatnøkkelen {A, B}, og C er ikke et nøkkelattributt: en partiell avhengighet.</p>" },
            { q: "<p>B -&gt; D</p>", options: ["3NF", "2NF", "BCNF", "1NF"], answer: 3,
              explain: "<p>1NF. Samme mønster: B er en ekte del av nøkkelen, og D er ikke nøkkelattributt.</p>" },
            { q: "<p>A, B -&gt; F</p>", options: ["3NF", "2NF", "BCNF", "1NF"], answer: 2,
              explain: "<p>BCNF. Venstresiden er selve kandidatnøkkelen og dermed en supernøkkel.</p>" },
            { q: "<p>A, D -&gt; E</p>", options: ["3NF", "2NF", "BCNF", "1NF"], answer: 1,
              explain: "<p>2NF. {A, D} er ikke supernøkkel og E er ikke nøkkelattributt (bryter 3NF), men {A, D} er ikke en ekte delmengde av {A, B}, så 2NF holder.</p>" }
          ]
        }
      }
    ]
  };

  /* =====================================================================
     Perfekte svar
     ===================================================================== */

  IN.PERFEKT["H2019-1.1"] = {
    type: "skjonn",
    svar: [{
      del: "1.1",
      tekst: "<p>To entiteter og én relasjon:</p><ul>" +
        "<li><b>KANDIDAT</b> med nøklene <u>Personnr</u> og <u>Email</u> (hver for seg), og Navn og Adresse.</li>" +
        "<li><b>ARBEIDSGIVER</b> med nøkkelen <u>Id</u>, Navn og det sammensatte attributtet Kontaktinfo (Telefonnr, Email, Adresse).</li>" +
        "<li><b>JOBBER_FOR</b> mellom dem: N ved KANDIDAT og 1 ved ARBEIDSGIVER, partiell deltakelse på begge sider, og attributtet Jobbtittel på relasjonen.</li></ul>" +
        "<p>Kommentar på arket: «Jobbtittel er lagt på relasjonen fordi den beskriver ansettelsen og bare finnes når kandidaten har en arbeidsgiver.»</p>",
      er: ER_11_SVAR,
      poeng: ["KANDIDAT med to nøkler og attributter (2p)", "relasjonen med riktig kardinalitet og deltakelse (2p)", "ARBEIDSGIVER med nøkkel og sammensatt kontaktinfo (3p)"]
    }],
    hvorfor: {
      eli5: "<p>Tenk på et kartotek med kort for kandidater og kort for arbeidsplasser. Hvert kandidatkort kan ha en lapp som peker til høyst én arbeidsplass, og på lappen skriver vi stillingen. En arbeidsplass kan ha mange slike lapper som peker på seg.</p>",
      normal: "<p>Kandidat og arbeidsgiver er to ting vi lagrer egne opplysninger om, så de blir entiteter. Personnummer og email er unike hver for seg og blir to nøkler. Kontaktinformasjonen består av tre deler og blir et sammensatt attributt. En kandidat har høyst én arbeidsgiver, mens en arbeidsgiver kan ha mange kandidater, så relasjonen er N:1 uten total deltakelse.</p>",
      teknisk: "<p>Kardinaliteten leses slik at tallet ved en entitet sier hvor mange av den den andre siden kan knyttes til: 1 ved ARBEIDSGIVER fordi én kandidat har høyst én arbeidsgiver. Ingen av sidene har total deltakelse: arbeidsledige kandidater finnes, og ingenting sier at en arbeidsgiver må ha en kandidat. Jobbtittelen er en egenskap ved forholdet og ikke ved personen alene. Legger vi den på relasjonen, slipper vi en jobbtittel uten arbeidsgiver. Sensor godtar begge plasseringene, så det viktigste er nøklene, det sammensatte attributtet og riktig kardinalitet.</p>"
    },
    sensor: {
      deler: [{
        del: "1.1",
        kriterier: "<p>Merk: Adresse på kandidater ble ikke nevnt i den engelske versjonen. Ingen trekk dersom denne mangler.</p>" +
          SV_MOD_GENERELT + "<p><b>Detaljert poengfordeling:</b></p><ul><li>2 for KANDIDAT</li><li>2 for relasjonen</li><li>3 for ARBEIDSGIVER</li></ul>" +
          "<p>Greit om JobbTittel plasseres på relasjonen JOBBER_FOR (altså ingen trekk).</p>"
      }],
      merknad: "Løsningsforslagets ER- og ORM2-figur er ikke gjengitt. I figuren heter relasjonen HAR_NÅVÆRENDE_ARBEIDSGIVER og jobbtittelen står på KANDIDAT, mens sensorpunktet kaller relasjonen JOBBER_FOR."
    }
  };

  IN.PERFEKT["H2019-1.2"] = {
    type: "skjonn",
    svar: [{
      del: "1.2",
      tekst: "<ul>" +
        "<li><b>INTERVJU</b> er en svak entitet (dobbelt rektangel) med delvis nøkkel <u>Nummer</u> (stiplet understrek), Dato og Tidspunkt.</li>" +
        "<li><b>DELTAR_PÅ</b> er den identifiserende relasjonen (dobbel rombe): 1 ved KANDIDAT, N ved INTERVJU, total deltakelse for INTERVJU.</li>" +
        "<li><b>EMNE</b> med nøkkel <u>Navn</u> og flerverdiattributtet Test (dobbel oval). <b>INTERVJUER</b> med nøkkel <u>Ansatt_id</u> og flerverdiattributtet Telefonnr.</li>" +
        "<li><b>HOLDT_AV_OM</b> er ternær mellom INTERVJU (N), INTERVJUER (M) og EMNE (K): mange på alle tre sider.</li>" +
        "<li><b>ER_SERTIFISERT_PÅ</b> (M:N) med attributtene Dato og Utsteder. INTERVJUER har total deltakelse (minst ett emne).</li>" +
        "<li><b>ER_ANSVARLIG_FOR</b> (1:1): 1 ved begge entitetene, total deltakelse for EMNE (nøyaktig én ansvarlig), partiell for INTERVJUER.</li></ul>" +
        "<p>Kommentar på arket: «Antar at en kandidat kan delta på flere intervjuer. KANDIDAT er bare tegnet med nøkkelen fra 1.1.»</p>",
      er: ER_12_SVAR,
      poeng: ["INTERVJU som svak entitet med DELTAR_PÅ (4p)", "ternær HOLDT_AV_OM med N/M/K (4p)", "EMNE og INTERVJUER med nøkler og flerverdiattributter (2p + 2p)", "ER_ANSVARLIG_FOR med kardinaliteter og total deltakelse (3p)", "ER_SERTIFISERT_PÅ med kardinaliteter, total deltakelse og attributter (3p)"]
    }],
    hvorfor: {
      eli5: "<p>Et intervju har bare et løpenummer per kandidat, litt som «samtale nr. 2 med Kari». Nummeret alene sier ingenting, så intervjuet henger fast i kandidaten sin. Et intervju er et møte mellom tre ting på én gang: intervjuet, den som spør, og temaet. Derfor tegner vi én rombe med tre streker.</p>",
      normal: "<p>Intervjuer identifiseres med nummer pluss kandidatens personnummer, og det er definisjonen på en svak entitet. Den ternære relasjonen trengs fordi en kombinasjon av intervju, intervjuer og emne er ett faktum. Tre binære relasjoner kan ikke si hvilken intervjuer som tok hvilket emne i hvilket intervju. Ordene «minst ett» og «nøyaktig én» oversettes til total deltakelse, og «maksimalt ett» til kardinalitet 1.</p>",
      teknisk: "<p>Den svake entiteten har alltid total deltakelse i den identifiserende relasjonen og 1 på eiersiden, fordi hvert intervju hører til nøyaktig én kandidat. I den ternære relasjonen sier punkt 3 at gitt to av deltakerne kan det være mange av den tredje, så alle tre sidene er «mange». For 1:1-ansvaret skal vi lese begge retninger: hvert emne har nøyaktig én ansvarlig (total for EMNE og 1 ved INTERVJUER), og hver intervjuer er ansvarlig for høyst ett emne (1 ved EMNE, partiell). Sertifiseringen har egne attributter (dato og utsteder) som hører til paret intervjuer–emne, og derfor står de på relasjonen. Tester og telefonnummer er mengder av enkle verdier og blir flerverdiattributter.</p>"
    },
    sensor: {
      deler: [{
        del: "1.2",
        kriterier: SV_MOD_GENERELT + "<p><b>Detaljert poengfordeling:</b></p><ul>" +
          "<li>4 for INTERVJU med DELTAR_PÅ-relasjonen<br>(Merk: Ikke sagt eksplisitt hvor mange intervjuer en kandidat kan delta på, både 1 og N godtas.)</li>" +
          "<li>4 for den ternære relasjonen HOLDT_AV_OM eller alternativ modellering (se under)</li>" +
          "<li>2 for hver av EMNE og INTERVJUER (med attributter)<br>(Merk: Ansatt_id ikke sagt at skal være unik, ikke trekk for om unik/ikke unik.)</li>" +
          "<li>3 for ER_ANSVARLIG_FOR med kardinaliteter</li>" +
          "<li>3 for ER_SERTIFISERT_PÅ med kardinaliteter</li></ul>"
      }],
      merknad: "Løsningsforslaget er en figur og er ikke gjengitt. Det viser også en alternativ modellering som sensor godtar. Alternativet modellerer hver kombinasjon som en svak entitet DELINTERVJU eid av INTERVJU, med binære relasjoner til INTERVJUER og EMNE."
    }
  };

  IN.PERFEKT["H2019-1.3"] = {
    type: "eksamen",
    svar: [{
      del: "1.3",
      tekst: "<p>Realisering etter algoritmen (entiteter, svake entiteter, 1:1, 1:N, M:N, flerverdiattributter):</p>",
      skjema: "Book(ISBN, Web_address, Title, Publisher, Publication_year, Main_contact, Contact_email)\n" +
        "  KN: {ISBN}, {Web_address}\n  PN: ISBN\n  FN: Book(Publisher) -> Publisher(Pid)\n  FN: Book(Main_contact) -> Author(Id)\n\n" +
        "Author(Id, First_name, Last_name, Phone_number)\n  KN/PN: {Id}\n\n" +
        "Publisher(Pid)\n  KN/PN: {Pid}\n\n" +
        "Chapter(ISBN, Chapter_number, Title)\n  KN/PN: {ISBN, Chapter_number}\n  FN: Chapter(ISBN) -> Book(ISBN)\n\n" +
        "Authored_by(ISBN, Author_id)\n  KN/PN: {ISBN, Author_id}\n  FN: Authored_by(ISBN) -> Book(ISBN)\n  FN: Authored_by(Author_id) -> Author(Id)\n\n" +
        "Contract(Author_id, Pid, Amount)\n  KN/PN: {Author_id, Pid}\n  FN: Contract(Author_id) -> Author(Id)\n  FN: Contract(Pid) -> Publisher(Pid)\n\n" +
        "Publisher_office(Pid, Office)\n  KN/PN: {Pid, Office}\n  FN: Publisher_office(Pid) -> Publisher(Pid)",
      etter: "<p><b>Valg:</b></p><ul>" +
        "<li>Book har to kandidatnøkler. ISBN er valgt som PN fordi det er den vanlige identifikatoren for bøker.</li>" +
        "<li>Name i AUTHOR er sammensatt, så bare bladene First_name og Last_name tas med.</li>" +
        "<li>CHAPTER er svak: PN er eierens ISBN pluss Chapter_number. CONTAINS realiseres ikke på nytt.</li>" +
        "<li>HAS_MAIN_CONTACT (1:1, partiell på begge sider): ingen sammensmelting. FN-en legges i Book, fordi de fleste bøker har en kontaktperson, mens mange forfattere ikke er kontakt for noen bok. Det gir færre NULL. Email på relasjonen blir Contact_email. Main_contact er unik (1:1), men kan være NULL og er derfor ikke en kandidatnøkkel.</li>" +
        "<li>IS_PUBLISHED_BY (1:N): FN på N-siden, altså Publisher og Publication_year i Book, i stedet for en egen tabell.</li>" +
        "<li>IS_AUTHORED_BY og HAS_CONTRACT_WITH (M:N) blir egne relasjoner. Amount hører til kontrakten og er ikke del av nøkkelen.</li>" +
        "<li>Flerverdiattributtet Office blir Publisher_office med alle attributtene som nøkkel.</li></ul>",
      poeng: ["Book, Author og Publisher med nøkler og attributter (2p hver)", "Chapter med sammensatt nøkkel og FN (3p)", "de to M:N-relasjonene (1p hver)", "1:1 og 1:N med begrunnelse (2p hver)"]
    }],
    hvorfor: {
      eli5: "<p>Vi gjør tegningen om til tabeller etter en fast oppskrift. Hver boks blir en tabell. Et kapittel får bokas nummer på seg, siden «kapittel 3» bare gir mening sammen med boka. Forbindelser der hver bok har høyst én av noe, blir en ekstra kolonne i boktabellen, mens «mange til mange» trenger sin egen tabell.</p>",
      normal: "<p>Algoritmen går i en fast rekkefølge. Vanlige entiteter blir relasjoner med nøklene sine, og den svake entiteten Chapter arver bokas nøkkel. 1:1 og 1:N løses med en fremmednøkkel på riktig side for å unngå ekstra tabeller, mens M:N og flerverdiattributter alltid blir egne relasjoner. Valgene for 1:1 og 1:N må forklares, og målet er færrest mulig tabeller og NULL-verdier.</p>",
      teknisk: "<p>For 1:1 uten total deltakelse på noen side kan vi ikke slå sammen, for da må én av entitetene finnes for at den andre kan lagres. Vi velger siden der fremmednøkkelen oftest har en verdi (Book), så NULL-verdiene blir færrest. Fremmednøkkelen blir bare kandidatnøkkel når den siden har total deltakelse. Ved 1:N gir FN på N-siden én verdi per rad, og relasjonsattributtet følger med. Den svake entiteten får PN = eierens PN + delvis nøkkel, og eierens PN blir samtidig FN, så CONTAINS er allerede uttrykt. I M:N-tabellene er relasjonsattributter som Amount aldri del av nøkkelen, fordi én kontrakt per par forfatter–forlag er det modellen sier.</p>"
    },
    sensor: {
      deler: [{
        del: "1.3",
        fasit: "<p>Realiseringen gir følgende databaseskjema:</p>",
        skjema: "Book(ISBN, WebAddr, Title, ContactAuth, ContactEmail, Publisher, Year)\nAuthor(Id, FName, LName, Phone)\nPublisher(Pid)\nChapter(ISBN, ChNr, Title)\nBookAuthor(ISBN, Aid)\nAuthorPublisherContract(Aid, Pid, Amount)\nOffices(Pid, Office)\n\n" +
          "hvor vi har følgende fremmednøkler:\nBook(ContactAuth) → Author(Id)\nBook(Publisher) → Publisher(Pid)\nChapter(ISBN) → Book(ISBN)\nBookAuthor(ISBN) → Book(ISBN)\nBookAuthor(Aid) → Author(Id)\nAuthorPublisherContract(Aid) → Author(Id)\nAuthorPublisherContract(Pid) → Publisher(Id)\nOffices(Pid) → Publisher(Id)",
        etter: "<p>Av de to kandidatnøklene for BOOK har vi valgt ISBN som primærnøkkel da dette virker mest naturlig. Vi har videre valgt å legge " +
          "HAS_MAIN_CONTACT-relasjonen inn i relasjonen Book, ettersom det er naturlig å anta at de fleste bøker har en hovedkontantperson. Vi har " +
          "også valgt å legge IS_PUBLISHED_BY inn i Book, ettersom det er naturlig å anta at de fleste bøker har et forlag/publisher.</p>",
        kriterier: "<p><b>Poengfordeling:</b></p><ul><li>2 for alle (ikke-svake) entiteter</li><li>3 for CHAPTER</li><li>1 for mange-til-mange-relasjoner</li>" +
          "<li>2 for en-til-en -og en-til-mange-relasjoner</li></ul><p><b>Trekk:</b></p><ul>" +
          "<li>-0.5 for manglende eller feil plassering av attributt</li>" +
          "<li>-1 for manglende kandidat- eller primærnøkkel-markering (men kun -0.5 dersom har primærnøkkel-markering men ikke kandidatnøkkel-markering)</li>" +
          "<li>-1 for manglende fremmednøkkel-markering</li>" +
          "<li>-1 for færre eller flere attributter i nøkkel enn nødvendig</li>" +
          "<li>-1 for manglende forklaring på valg av realisering av en-til-en og en-til-mange-relasjoner</li>" +
          "<li>-2 for å realisere CONTAINS dobbelt (en for svake CHAPTER og en for relasjonen selv)</li></ul>"
      }],
      merknad: "Understreking og fet skrift fra løsningsforslaget kommer ikke med i ren tekst. Løsningsforslaget skriver «Publisher(Id)» i to fremmednøkler, men attributtet heter Pid, og «hovedkontantperson» er en skrivefeil. " +
        "Poengene ser ut til å gjelde per element: 2 × 3 vanlige entiteter + 3 for CHAPTER + 1 × 2 M:N + 2 × 2 for 1:1 og 1:N = 15."
    }
  };

  IN.PERFEKT["H2019-2.2"] = {
    type: "eksamen",
    svar: [{
      del: "2.2",
      sql: "-- Tolker «etter år 2000» som fra og med 2001\nSELECT navn, startet\nFROM band\nWHERE startet >= '2001-01-01'\n   OR navn LIKE '%King%';",
      tekst: "<p>Én tabell, to betingelser koblet med OR. På eksempeldataene er svaret tomt.</p>",
      poeng: ["riktige kolonner", "LIKE med % på begge sider", "OR mellom betingelsene", "riktig datogrense"]
    }],
    hvorfor: {
      eli5: "<p>Vi blar gjennom bandlisten og tar med alle band som enten er nye nok eller har «King» et sted i navnet. Det holder at ett av kravene stemmer.</p>",
      normal: "<p>«Enten … eller» betyr at en rad skal med når minst én av betingelsene er sann, og det er nettopp OR. LIKE '%King%' finner strengen hvor som helst i navnet fordi % står for en vilkårlig tekst, også tom.</p>",
      teknisk: "<p>WHERE beholder rader der betingelsen er sann. Med OR holder det at ett ledd er sant. Datoer i formatet 'ÅÅÅÅ-MM-DD' kan sammenlignes direkte med en dato-kolonne. Grensen 2001-01-01 tar med alt fra og med 2001, som er den strenge tolkningen av «etter år 2000». LIKE skiller mellom store og små bokstaver, så mønsteret må ha stor K slik oppgaven skriver det.</p>"
    },
    sensor: {
      deler: [{
        del: "2.2",
        sql: "SELECT navn, startet\n  FROM band\n WHERE startet >= '2000-01-01' OR\n       navn LIKE '%King%';",
        etter: "<p>Også greit om antar at etter 2000 betyr startet &gt;= '2001-01-01'.</p>",
        kriterier: SV_SQL_GENERELT
      }]
    }
  };

  IN.PERFEKT["H2019-2.3"] = {
    type: "eksamen",
    svar: [{
      del: "2.3",
      sql: "SELECT sum(s.spilletid) / 3600.0 AS timer\nFROM sjanger AS sj\n  INNER JOIN band AS b ON (b.sjangerID = sj.sjangerID)\n  INNER JOIN album AS a ON (a.bandID = b.bandID)\n  INNER JOIN sang AS s ON (s.albumID = a.albumID)\nWHERE sj.navn = 'Pop'\n  AND b.startet >= '1990-01-01'\n  AND b.startet < '2000-01-01';",
      tekst: "<p>På eksempeldataene gir spørringen 0,035 (én poplåt på 126 sekunder fra Bettany Swords).</p>",
      poeng: ["join av alle fire tabellene", "filter på sjangernavn og 90-tallet", "sum (ikke count) uten GROUP BY", "/3600.0"]
    }],
    hvorfor: {
      eli5: "<p>Vi følger trådene fra «Pop» til bandene, fra bandene til albumene og fra albumene til sangene. Så legger vi sammen alle sekundene og regner om til timer.</p>",
      normal: "<p>Informasjonen ligger spredt i fire tabeller, så vi må joine dem i kjede. WHERE plukker ut popband startet på 90-tallet. sum over hele resultatet gir én total, og deling på 3600.0 gjør sekunder om til timer.</p>",
      teknisk: "<p>Når SELECT bare inneholder et aggregat og ingen GROUP BY, behandles alle radene som én gruppe, og det er nettopp «totalt antall timer». Joinene skrives med eksplisitt ON (eller USING) og ikke NATURAL JOIN, fordi alle tabellene har en kolonne som heter navn og NATURAL JOIN ville krevd like navn også der. Desimaltallet 3600.0 hindrer heltallsdivisjon. Vi filtrerer på navnet 'Pop' og ikke på en hardkodet ID, slik at spørringen virker uansett hvilken ID sjangeren har.</p>"
    },
    sensor: {
      deler: [{
        del: "2.3",
        sql: "SELECT sum(s.spilletid)/3600.0 AS timer\n  FROM sjanger AS sj\n       INNER JOIN band AS b USING (sjangerID)\n       INNER JOIN album AS a USING (bandID)\n       INNER JOIN sang AS s USING (albumID)\n WHERE sj.navn = 'Pop' AND\n       b.startet >= '1990-01-01' AND\n       b.startet < '2000-01-01';",
        kriterier: "<ul><li>-2 for manglende /3600.0 (men OK om ikke tar med desimalet)</li><li>-2 for manglende uttrykk i WHERE</li><li>-2 for sjangerid = 0 el.</li>" +
          "<li>-1 for count i stedet for sum</li><li>-2 for manglende aggregering</li><li>-2 for manglende/feil tabeller i joins</li>" +
          "<li>-2 for meningsløs GROUP BY (f.eks. på album.navn)</li><li>-2 for NATURAL JOIN</li><li>-1 for å finne antall timer per band (med GROUP BY)</li></ul>" +
          "<p>Ingen trekk for sammenlikning direkte med årstall, håndtere datoer som strenger, el. (INF1300 og tidligere IN2090 gjennomgikk ikke håndtering av datoer i detalj.)</p>"
      }]
    }
  };

  IN.PERFEKT["H2019-2.4"] = {
    type: "eksamen",
    svar: [{
      del: "2.4",
      sql: "SELECT p.navn\nFROM person AS p\nWHERE p.født IN (SELECT startet FROM band)\n   OR p.født IN (SELECT utgitt FROM album);",
      tekst: "<p>Ingen personer i eksempeldataene er født på en slik dato, så resultatet er tomt der.</p>",
      poeng: ["sammenligner fødselsdato med alle startdatoer og alle utgivelsesdatoer", "OR (eller UNION) mellom de to", "ingen kobling via Medlem", "ingen unødvendige duplikater"]
    }],
    hvorfor: {
      eli5: "<p>Vi lager to lister med «spesielle datoer»: dagene et band startet og dagene et album kom ut. Så sjekker vi hver person: står bursdagen deres på en av listene?</p>",
      normal: "<p>IN med en delspørring spør om verdien finnes i en liste. Vi trenger to lister, startdatoer og utgivelsesdatoer, og en person skal med hvis datoen finnes i minst én av dem. Oppgaven sier ikke at bandet må være personens eget, så Medlem skal ikke brukes.</p>",
      teknisk: "<p>Hver person-rad testes én gang mot delspørringene, så en person kommer med høyst én gang selv om flere band eller album deler datoen. En join mot band og album ville gitt én rad per treff, og da trengs DISTINCT eller UNION for å fjerne duplikatene. Et kryssprodukt med OR er både tregt og feil når band eller album er tomme, fordi produktet da blir tomt. Delspørringene her har ingen NULL-problemer: IN gir sann så snart én verdi er lik.</p>"
    },
    sensor: {
      deler: [{
        del: "2.4",
        sql: ["SELECT navn\n  FROM person\n WHERE født IN (\n   SELECT startet\n   FROM band\n   UNION\n   SELECT utgitt\n   FROM album\n );",
              "-- eller med OR:\nSELECT navn\n  FROM person\n WHERE født IN (\n   SELECT startet\n   FROM band\n ) OR født IN (\n   SELECT utgitt\n   FROM album\n );",
              "-- eller med union av joins:\nSELECT p.navn\n  FROM person AS p\n       INNER JOIN band AS b ON (p.født = b.startet)\nUNION\nSELECT p.navn\n  FROM person AS p\n       INNER JOIN album AS a ON (p.født = a.utgitt);"],
        kriterier: "<ul><li>-1 for unødvendige duplikater (f.eks. UNION ALL i union av joins)</li>" +
          "<li>-2 om spørringen bruker kryssprodukt av person, band, album og OR</li>" +
          "<li>-3 for å finne personer født på samme dato som bandet personen spiller i ble startet eller ga ut et album (joins og OR)</li></ul>"
      }],
      merknad: "Linjene «eller med OR:» og «eller med union av joins:» står som tekst mellom spørringene i løsningsforslaget. Her er de lagt inn som SQL-kommentarer."
    }
  };

  IN.PERFEKT["H2019-2.5"] = {
    type: "eksamen",
    svar: [{
      del: "2.5",
      sql: "SELECT b.bandID, b.navn, count(s.sangID) AS antall_sanger\nFROM band AS b\n  LEFT JOIN album AS a ON (a.bandID = b.bandID)\n  LEFT JOIN sang AS s ON (s.albumID = a.albumID)\nGROUP BY b.bandID, b.navn\nHAVING count(s.sangID) < 3;",
      tabell: { kolonner: ["bandid", "navn", "antall_sanger"], rader: [[1, "Bettany Swords", 1], [2, "Shallow Violett", 0]] },
      tekst: "<p>Resultatet på eksempeldataene:</p>",
      poeng: ["LEFT JOIN begge steder", "count(s.sangID), ikke count(*)", "GROUP BY per band", "HAVING &lt; 3"]
    }],
    hvorfor: {
      eli5: "<p>Vi skriver opp alle band, også de som ikke har laget noe ennå. Ved siden av hvert band teller vi sangene. Et band uten sanger får en tom plass, og tomme plasser teller som null. Til slutt beholder vi bandene med under tre sanger.</p>",
      normal: "<p>LEFT JOIN beholder alle band selv når de mangler album eller sanger, og fyller da inn NULL. count(s.sangID) teller bare verdier som ikke er NULL, så slike band får 0. HAVING filtrerer på antallet etter grupperingen.</p>",
      teknisk: "<p>Etter de to ytre joinene har et band uten album én rad der alle album- og sangkolonnene er NULL. count(*) ville telt den raden som 1, mens count(s.sangID) gir 0. Betingelsen «færre enn 3» gjelder et aggregat og må derfor stå i HAVING: WHERE filtrerer rader før grupperingen og kan ikke se tellingen. Andre LEFT JOIN må også være ytre. Ellers fjerner den radene med NULL i albumID, og band med tomme album forsvinner igjen.</p>"
    },
    sensor: {
      deler: [{
        del: "2.5",
        sql: "SELECT b.bandID, b.navn, count(s.sangID) AS antall_sanger\n  FROM band AS b\n       LEFT OUTER JOIN album AS a USING (bandID)\n       LEFT OUTER JOIN sang AS s USING (albumID)\nGROUP BY b.bandID, b.navn -- b.navn ikke nødvendig (i PostgreSQL)\nHAVING count(s.sangID) < 3;",
        kriterier: "<ul><li>-1 for * i count</li><li>-2 for INNER JOIN men ellers korrekt</li><li>-2 for manglende HAVING eller GROUP BY</li></ul>"
      }]
    }
  };

  IN.PERFEKT["H2019-2.6"] = {
    type: "eksamen",
    svar: [{
      del: "2.6",
      sql: "DELETE FROM album AS a\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM sang AS s\n  WHERE s.albumID = a.albumID\n);",
      tekst: "<p>På eksempeldataene har alle album minst én sang, så ingen rader slettes.</p>",
      poeng: ["DELETE, ikke DROP", "betingelse som finner album uten sanger", "ingen join i FROM"]
    }],
    hvorfor: {
      eli5: "<p>Vi går gjennom albumhylla og kaster hvert album der vi ikke finner en eneste sang som hører til det.</p>",
      normal: "<p>DELETE fjerner rader, mens DROP fjerner hele tabellen. NOT EXISTS sjekker for hvert album om det finnes en sang som peker på det, og sletter albumet bare når svaret er nei.</p>",
      teknisk: "<p>Delspørringen er korrelert: den bruker a.albumID fra den ytre raden og kjøres for hvert album. NOT EXISTS blir sann bare når delspørringen er tom. Vi velger det fremfor NOT IN, fordi NOT IN gir NULL (ukjent) for alle album hvis sang.albumID noen gang er NULL, og da slettes ingenting. Slettingen bryter ingen fremmednøkler, siden sang er den eneste tabellen som peker på album, og albumene vi sletter, har nettopp ingen sanger.</p>"
    },
    sensor: {
      deler: [{
        del: "2.6",
        sql: "DELETE FROM album\nWHERE albumID NOT IN (\n  SELECT albumID\n  FROM sang\n);",
        kriterier: "<ul><li>-1 for DROP fremfor DELETE</li><li>-2 for (outer) joins i FROM (men ellers riktig)</li><li>-4 for inner join i FROM med NOT NULL-sjekk el.</li>" +
          "<li>5 poeng for riktig tilpassning av spørring fra forige oppgave (selvom spørringen fra forrige oppgave er feil, trekker ikke for følgefeil)</li></ul>"
      }]
    }
  };

  IN.PERFEKT["H2019-2.7"] = {
    type: "eksamen",
    svar: [{
      del: "2.7",
      sql: "CREATE VIEW nyeste_album AS\nSELECT a.navn AS album, b.navn AS band, a.utgitt, count(s.sangID) AS antall_sanger\nFROM album AS a\n  INNER JOIN band AS b ON (b.bandID = a.bandID)\n  INNER JOIN sang AS s ON (s.albumID = a.albumID)\nGROUP BY a.albumID, a.navn, b.navn, a.utgitt\nORDER BY a.utgitt DESC\nLIMIT 10;",
      tabell: { kolonner: ["album", "band", "utgitt", "antall_sanger"],
        rader: [["Love", "Bettany Swords", "1999-11-09", 1], ["Fog on the grass", "Blue Floyd", "1990-03-13", 2], ["Surfin", "Blue Floyd", "1986-02-07", 2]] },
      tekst: "<p>Innholdet i viewet på eksempeldataene:</p>",
      poeng: ["CREATE VIEW med riktig navn", "navngitte kolonner (album og band)", "telling per album med GROUP BY", "ORDER BY utgitt DESC", "LIMIT 10"]
    }],
    hvorfor: {
      eli5: "<p>Vi lager en lagret «utsikt» som alltid viser de ti ferskeste albumene øverst, med bandnavn og hvor mange sanger hvert album har.</p>",
      normal: "<p>Et view er en lagret spørring. Inni grupperer vi per album og teller sangene, sorterer på utgivelsesdato med nyeste først (DESC) og tar de ti første med LIMIT. Album og band har begge kolonnen navn, så kolonnene i viewet må få egne navn.</p>",
      teknisk: "<p>Rekkefølgen er GROUP BY, så ORDER BY, så LIMIT: først lages én rad per album med tellingen, så sorteres radene og kuttes etter ti. Vi grupperer på a.albumID, slik at to album med samme navn ikke slås sammen. PostgreSQL godtar ikke to kolonner med samme navn i et view, og derfor trengs AS album og AS band. Oppgaven lover at alle album har minst én sang, så INNER JOIN mot sang mister ingen album.</p>"
    },
    sensor: {
      deler: [{
        del: "2.7",
        sql: "CREATE VIEW nyeste_album(navn, band, utgitt , antall_sanger) AS\nSELECT a.navn, b.navn, a.utgitt , count(*)\nFROM album AS a\n     INNER JOIN band AS b USING (bandID)\n     INNER JOIN sang AS s USING (albumID)\nGROUP BY a.albumID , a.navn, b.navn, a.utgitt\nORDER BY a.utgitt DESC\nLIMIT 10;",
        kriterier: "<ul><li>-0.5 for å ikke nanvgi kolonnene (fikse navnkonflikten med navn)</li><li>-2 for manglende LIMIT eller ORDER BY-klausul</li>" +
          "<li>-2 for ikke å telle antall sanger</li><li>-1 for manglende GROUP BY (men teller sanger)</li>" +
          "<li>-0.5 for manglende kolonner i GROUP BY (Merk: a.navn, a.utgitt ikke nødvendig)</li><li>-1 for manglenede DESC og -0.5 for eksplisitt ASC</li></ul>"
      }],
      merknad: "«nanvgi» og «manglenede» er skrivefeil i sensorveiledningen."
    }
  };

  IN.PERFEKT["H2019-2.8"] = {
    type: "eksamen",
    svar: [{
      del: "2.8",
      sql: "WITH\n  super_album AS (\n    SELECT albumID\n    FROM sang\n    GROUP BY albumID\n    HAVING sum(spilletid) > 3600\n  )\nSELECT b.bandID, b.navn, count(*) AS antall_super_album\nFROM band AS b\n  INNER JOIN album AS a ON (a.bandID = b.bandID)\n  INNER JOIN super_album AS sa ON (sa.albumID = a.albumID)\nGROUP BY b.bandID, b.navn;",
      tekst: "<p>På eksempeldataene er det lengste albumet 610 sekunder, så resultatet er tomt. Med en grense på 500 sekunder ville Blue Floyd fått 2.</p>",
      poeng: ["delspørring som finner super-albumene (5p)", "join til band, GROUP BY per band og telling (5p)"]
    }],
    hvorfor: {
      eli5: "<p>Først lager vi en liste over album som varer mer enn en time. Så går vi gjennom bandene og teller hvor mange av albumene deres som står på lista.</p>",
      normal: "<p>Oppgaven har to aggregeringer oppå hverandre: først summere spilletid per album, så telle super-album per band. WITH lar oss gjøre det første steget for seg og gi resultatet et navn. Deretter er det en vanlig join og en GROUP BY per band.</p>",
      teknisk: "<p>Et aggregat kan ikke stå inne i et annet i samme spørring, så summen per album må beregnes i et eget steg. I super_album filtrerer HAVING på sum(spilletid), siden betingelsen gjelder gruppen og ikke enkeltrader. INNER JOIN mot super_album beholder bare super-albumene, og count(*) per band teller dem. Band uten super-album skal ikke vises, så her er indre join riktig.</p>"
    },
    sensor: {
      deler: [{
        del: "2.8",
        sql: "WITH\n  super_album AS (\n    SELECT albumID\n    FROM sang\n    GROUP BY albumID\n    HAVING sum(spilletid) > 3600\n  )\nSELECT b.bandID, b.navn, count(*) AS antall\nFROM band AS b\n     INNER JOIN album AS a USING (bandID)\n     INNER JOIN super_album AS sa USING (albumID)\nGROUP BY b.bandID, b.navn;",
        kriterier: "<ul><li>5 for riktig delspørring som finner alle super-album</li><li>5 for riktig delspørring som finner antallet super-album per band</li>" +
          "<li>-3 for manglende antall album</li><li>-2 for manglende GROUP BY</li></ul>"
      }]
    }
  };
})();
