/* ============================================================
   IN2090 guide · data-crash.js
   Stegdata for crash course-løypa (crash.html), i samme rekkefølge som eksamen:
   0 spilleregler, 1 ER, 2 realisering (og RA), 3 SQL, 4 FD og normalisering, 5 generalprøve.
   Vekt = forventede eksamenspoeng steget dekker (sum 100 over hele løypa), regnet ut fra
   plan/eksamensmonster.md (H2019, H2020, H2023–H2025). min = minstelengde: E (Ekspress),
   S (Standard), G (Grundig). tid = anslåtte minutter, tidG = ekstra minutter i Grundig.
   Alt er skrevet med egne ord, og eksemplene bruker egne skjemaer (ikke eksamensskjemaene).
   Trenger bare core.js (IN.progress) for IN.crashProgress. Klassisk script.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  function t(e, n, k) { return { eli5: e, normal: n, teknisk: k }; }

  /* Eksamenskortene: id → [blokk, poeng, tittel, år, oppgavenr., banknøkkel]
     id = banknøkkelen med «.» byttet til «_» (som bank.js), og kortet har element-id «o-<id>».
     Blokken er side-id-en i IN.PAGES, så kortet på emnesiden har fremdriftsnøkkel kort:<blokk>:o-<id>.
     Kortet i løypa har kort:crash:o-<id>. Status = den nyeste av de to. */
  var KORT = {
    "H2019-1_1": ["er", 7, "Kandidater og arbeidsgiver", "H2019", "1.1", "H2019-1.1"],
    "H2019-1_2": ["er", 18, "Intervjuer (svak entitet og ternær relasjon)", "H2019", "1.2", "H2019-1.2"],
    "H2019-1_3": ["realisering", 15, "Book, Author, Publisher og Chapter til relasjoner", "H2019", "1.3", "H2019-1.3"],
    "H2019-2_1": ["sql", 10, "Lovlig eller ulovlig? PK, FK, UNIQUE, CHECK og CASCADE", "H2019", "2.1", "H2019-2.1"],
    "H2019-2_2": ["sql", 5, "Band startet etter 2000 eller med «King» i navnet", "H2019", "2.2", "H2019-2.2"],
    "H2019-2_3": ["sql-videre", 5, "Timer popmusikk fra band startet på 90-tallet", "H2019", "2.3", "H2019-2.3"],
    "H2019-2_4": ["sql-videre", 5, "Personer født på en startdato eller utgivelsesdato", "H2019", "2.4", "H2019-2.4"],
    "H2019-2_5": ["sql-videre", 5, "Band med færre enn 3 sanger (også 0)", "H2019", "2.5", "H2019-2.5"],
    "H2019-2_6": ["sql-videre", 5, "Slett album uten sanger", "H2019", "2.6", "H2019-2.6"],
    "H2019-2_7": ["sql-videre", 5, "VIEW med de 10 nyeste albumene", "H2019", "2.7", "H2019-2.7"],
    "H2019-2_8": ["sql-videre", 10, "Band med super-album (over én time)", "H2019", "2.8", "H2019-2.8"],
    "H2019-3_1": ["fd", 6, "Tillukning av {A} og {B}, attributter i alle nøkler", "H2019", "3.1", "H2019-3.1"],
    "H2019-3_2": ["normalisering", 4, "Normalform for hver FD", "H2019", "3.2", "H2019-3.2"],
    "H2020-M1": ["er", 5, "Brukere og kredittkort (1:1)", "H2020", "M1", "H2020-M1"],
    "H2020-M2": ["er", 15, "Produkter, bestillinger og bestillingslinjer", "H2020", "M2", "H2020-M2"],
    "H2020-M3": ["er", 10, "Ønskelister, anbefalinger (ternær) og anmeldelser", "H2020", "M3", "H2020-M3"],
    "H2020-M4": ["realisering", 10, "Musikkalbum, band og sangere til relasjoner", "H2020", "M4", "H2020-M4"],
    "H2020-S1": ["sql", 5, "Hvilke tupler er med? LIKE og INNER JOIN", "H2020", "S1", "H2020-S1"],
    "H2020-S2": ["sql", 5, "Morgendagens værmelding for byer i Italia", "H2020", "S2", "H2020-S2"],
    "H2020-S3": ["sql-videre", 5, "Sum nedbør og snittvind i romjulsuka per by", "H2020", "S3", "H2020-S3"],
    "H2020-S4": ["sql-videre", 5, "Byer uten regn og vind fra julaften ut året", "H2020", "S4", "H2020-S4"],
    "H2020-S5": ["sql-videre", 10, "VIEW Steder: byer og POIs med dagens vær (UNION)", "H2020", "S5", "H2020-S5"],
    "H2020-S6": ["sql-videre", 10, "Byen i Frankrike med opphold, minst 3 kaféer og flest museer", "H2020", "S6", "H2020-S6"],
    "H2020-R1": ["fd", 5, "Finn alle kandidatnøkler i R(A, B, C, D)", "H2020", "R1", "H2020-R1"],
    "H2020-R2": ["normalisering", 5, "Normalform for R(A, B, C, D) (feil i oppgaveteksten)", "H2020", "R2", "H2020-R2"],
    "H2020-R3": ["normalisering", 10, "Dekomponer Student tapsfritt til BCNF", "H2020", "R3", "H2020-R3"],
    "H2023-1_1": ["er", 15, "ER-modell for en bank", "H2023", "1.1", "H2023-1.1"],
    "H2023-1_2": ["er", 5, "Les et «hemmelig» ER-diagram", "H2023", "1.2", "H2023-1.2"],
    "H2023-1_3": ["realisering", 10, "Realiser nettavis-modellen", "H2023", "1.3", "H2023-1.3"],
    "H2023-2_1": ["sql", 10, "Hvor mange rader? (fem spørringer)", "H2023", "2.1", "H2023-2.1"],
    "H2023-2_2": ["sql", 5, "Vedlikeholdsdatoer i Oslo", "H2023", "2.2", "H2023-2.2"],
    "H2023-2_3": ["sql-videre", 5, "Snittemperatur i Bærum ved regn eller vind", "H2023", "2.3", "H2023-2.3"],
    "H2023-2_4": ["sql-videre", 5, "Tre områder med færrest sensorer per km²", "H2023", "2.4", "H2023-2.4"],
    "H2023-2_5": ["sql-videre", 10, "VIEW som fyller inn manglende vind", "H2023", "2.5", "H2023-2.5"],
    "H2023-2_6": ["sql-videre", 10, "Område med høyest snittnedbør per dag i 2023", "H2023", "2.6", "H2023-2.6"],
    "H2023-2_7": ["sql-programmering", 5, "Oppdater vedlikeholdsdato uten SQL-injection", "H2023", "2.7", "H2023-2.7"],
    "H2023-3_1": ["fd", 5, "Hvilke attributter er nøkkelattributter?", "H2023", "3.1", "H2023-3.1"],
    "H2023-3_2": ["fd", 5, "Fyll inn «?» ut fra FD-ene", "H2023", "3.2", "H2023-3.2"],
    "H2023-3_3": ["normalisering", 10, "Dekomponer R(A,B,C,D,E) tapsfritt til BCNF", "H2023", "3.3", "H2023-3.3"],
    "H2024-1_1": ["er", 11, "ER-modell for et bibliotek", "H2024", "1.1", "H2024-1.1"],
    "H2024-1_2": ["er", 5, "Les et ER-diagram (JA/NEI)", "H2024", "1.2", "H2024-1.2"],
    "H2024-1_3": ["realisering", 12, "Realiser utleiebyrå-modellen", "H2024", "1.3", "H2024-1.3"],
    "H2024-2_1": ["sql-videre", 12, "Hvor mange rader? (6 spørringer)", "H2024", "2.1", "H2024-2.1"],
    "H2024-2_2": ["sql", 5, "Turer raskere enn 40 km/t", "H2024", "2.2", "H2024-2.2"],
    "H2024-2_3": ["sql-videre", 5, "Standardsjåfør for mer enn én buss", "H2024", "2.3", "H2024-2.3"],
    "H2024-2_4": ["sql", 5, "Skriv om UNION-spørringen uten UNION", "H2024", "2.4", "H2024-2.4"],
    "H2024-2_5": ["sql-videre", 8, "VIEW: turer der sjåføren ikke var standardsjåfør", "H2024", "2.5", "H2024-2.5"],
    "H2024-2_6": ["sql-videre", 10, "Fyll tabellen overtid for oktober 2024", "H2024", "2.6", "H2024-2.6"],
    "H2024-3_1": ["fd", 6, "Nøkkelattributter (JA/NEI)", "H2024", "3.1", "H2024-3.1"],
    "H2024-3_2": ["normalisering", 8, "Normalform per FD", "H2024", "3.2", "H2024-3.2"],
    "H2024-3_3": ["normalisering", 13, "Tapsfri dekomposisjon til BCNF", "H2024", "3.3", "H2024-3.3"],
    "H2025-1_1": ["er", 18, "Fritidsbåt-firmaet: ER-modell", "H2025", "1.1", "H2025-1.1"],
    "H2025-1_2": ["realisering", 7, "Fritidsbåt-firmaet: realisering", "H2025", "1.2", "H2025-1.2"],
    "H2025-1_3": ["relasjonsalgebra", 5, "Relasjonsalgebra på båtskjemaet", "H2025", "1.3", "H2025-1.3"],
    "H2025-2_1": ["sql", 10, "Hvor mange rader? (5 spørringer)", "H2025", "2.1", "H2025-2.1"],
    "H2025-2_2": ["sql", 5, "Oppgaver med frist i dag", "H2025", "2.2", "H2025-2.2"],
    "H2025-2_3": ["sql", 7, "CREATE TABLE + INSERT i én transaksjon", "H2025", "2.3", "H2025-2.3"],
    "H2025-2_4": ["sql-videre", 5, "UPDATE: ansvarlig = prosjektleder", "H2025", "2.4", "H2025-2.4"],
    "H2025-2_5": ["sql-videre", 7, "Lengden til store prosjekter", "H2025", "2.5", "H2025-2.5"],
    "H2025-2_6": ["sql-videre", 8, "VIEW prosjektstatus (prosent ferdig)", "H2025", "2.6", "H2025-2.6"],
    "H2025-2_7": ["sql-videre", 8, "Timeregnskap per ansatt (også 0)", "H2025", "2.7", "H2025-2.7"],
    "H2025-3_1": ["fd", 4, "Bryter instansen FD-ene?", "H2025", "3.1", "H2025-3.1"],
    "H2025-3_2": ["fd", 5, "Kandidatnøkler og høyeste normalform", "H2025", "3.2", "H2025-3.2"],
    "H2025-3_3": ["normalisering", 6, "Første BCNF-steg og tapsfrihet", "H2025", "3.3", "H2025-3.3"],
    "H2025-3_4": ["normalisering", 5, "Legg til FD-er slik at R blir BCNF", "H2025", "3.4", "H2025-3.4"]
  };

  var LENGDER = [
    { id: "E", navn: "Ekspress", omtrent: "~5 t", tekst: "De ti stegene som gir mest poeng per time (omtrent 73 av 100 poeng). 1–2 eksamensoppgaver per steg." },
    { id: "S", navn: "Standard", omtrent: "~11 t", tekst: "Alle oppgavetypene som går igjen, 1–2 eksamensoppgaver hver, og en generalprøve med hele H2024 på tid." },
    { id: "G", navn: "Grundig", omtrent: "~20 t", tekst: "Alt i Standard, pluss alle de andre eksamensoppgavene fra 2019–2025 og de sjeldne temaene (RA, SQL fra program). Tøm repetisjonskøen." }
  ];

  /* Lenke: [side, fane, element-id eller null, tekst], eller { href, tekst } for en fil.
     eksempel: lenker som over, eller { sql, tekst? } (kodeblokk) eller { html } (egen tekst). */
  var PDF = { href: "assets/eksamensnotater.pdf", tekst: "Eksamensnotatene (PDF, til utskrift)" };

  var ETAPPER = [
    /* ===================== 0 · SPILLEREGLER ===================== */
    { nr: 0, navn: "Spilleregler", hvor: "Før du begynner", steg: [
      { id: "0", tittel: "Slik er eksamen bygd opp, og slik rettes den", vekt: 0, min: "E", tid: 10,
        hvorfor: "Gir ingen poeng i seg selv, men reglene bestemmer hvordan du henter poeng i alt annet. Eksamen er 4 timer (forsiden til H2025 sa 6 timer, så sjekk forsiden ditt år) og 100 poeng i tre deler: modellering, SQL og FD/normalisering. H2023–H2025 var <b>alle trykte og skrevne hjelpemidler</b> tillatt.",
        kjerne: t(
          "Eksamen har tre rom. I det første tegner du hvordan ting henger sammen (ER) og gjør tegningen om til tabeller. I det andre skriver du spørsmål til databasen (SQL). I det tredje rydder du tabeller så de ikke gjentar seg (FD og normalisering). Noen spørsmål gir minuspoeng hvis du svarer feil, så du må vite når det lønner seg å gjette. Du får ha med deg alt du har skrevet ut, så lag en god jukselapp.",
          "<p>Fordelingen har vært ganske fast: <b>modellering</b> (ER og realisering) 28–40 p, <b>SQL</b> 40–50 p og <b>FD og normalisering</b> 10–27 p. Oppgave 1 er alltid ER-tegning. SQL-delen starter med et «hvor mange rader?»-flervalg og går fra enkle til store spørringer. Del 3 har alltid en BCNF-dekomposisjon.</p><p>Flere oppgaver rettes automatisk med minuspoeng, men aldri under 0 per oppgave. Med 4 timer og 100 poeng har du 2,4 minutter per poeng. Alle trykte og skrevne hjelpemidler er lov, så skriv ut notater du kjenner godt.</p>",
          "<p>Poengreglene (H2023–H2025): JA/NEI-påstander ±1, radantall +2/−0,5, FD-verdier +1/−0,5, normalform per FD +2/−0,5 (H2024), FD-instanser ±1 (H2025). Minst 0 per oppgave.</p><p>Forventet gevinst ved ren gjetning: med ±1 og to valg er den 0,5 · 1 − 0,5 · 1 = 0, så svar bare når du er mer enn 50 % sikker. Med +2/−0,5 og fire alternativer er den 0,25 · 2 − 0,75 · 0,5 = +0,125, så der lønner det seg å svare på alt. Grensen for +2/−0,5 er 20 % sannsynlighet for riktig svar.</p>"),
        les: [PDF, ["sql-videre", "radantall", "del1-radantall", "SQL videregående → Hvor mange rader?"], ["normalisering", "svarform", "svar-gen", "Normalisering → Svarform"]],
        oppskrift: [
          "<b>Les hele settet</b> i 5 minutter og fordel tiden: omtrent 2,4 minutter per poeng.",
          "<b>Oppgave 1 (ER)</b> gir mange poeng, men ikke bli sittende: sett av omtrent 40 minutter.",
          "<b>JA/NEI med ±1:</b> svar bare når du er mer enn 50 % sikker. <b>Radantall med +2/−0,5:</b> svar på alt.",
          "<b>Forklar valgene</b> i realisering og dekomposisjon. Manglende forklaring koster (−2 i realisering H2020, −3 i dekomposisjon).",
          "<b>Skriv antakelser</b> som kommentarer, i SQL med <code>--</code>. Tvetydige oppgaver gir full uttelling for rimelige tolkninger.",
          "<b>Skriv ut</b> eksamensnotatene før eksamen. Alle trykte og skrevne hjelpemidler er lov."
        ],
        eksempel: [],
        oppgaver: [],
        sjekk: [{ type: "quiz", items: [
          { q: "Eksamen er 4 timer og 100 poeng. Hvor mange minutter har du per poeng?", options: ["1,5", "2,4", "3", "4"], answer: 1,
            explain: "240 minutter delt på 100 poeng er 2,4 minutter per poeng. En oppgave på 10 p får altså omtrent 24 minutter." },
          { q: "En JA/NEI-påstand gir +1 for riktig og −1 for galt. Du er 50/50. Lønner det seg å svare?", options: ["Ja, alltid", "Nei: forventet gevinst er 0. Svar når du er mer enn 50 % sikker", "Bare på siste påstand", "Ja, fordi blankt gir −1"], answer: 1,
            explain: "0,5 · 1 − 0,5 · 1 = 0. Blankt gir 0, så gjetting hjelper ikke i snitt. Er du 70 % sikker, er forventningen +0,4." },
          { q: "Radantall gir +2 for riktig og −0,5 for galt. Du gjetter helt tilfeldig blant fire alternativer. Forventet poeng?", options: ["−0,5", "0", "+0,125", "+0,5"], answer: 2,
            explain: "0,25 · 2 − 0,75 · 0,5 = 0,5 − 0,375 = +0,125. Det lønner seg å svare, og enda mer når du kan utelukke et alternativ." },
          { q: "Hvilke hjelpemidler var tillatt på IN2090-eksamen H2023–H2025?", options: ["Ingen", "Én håndskrevet A4-side", "Alle trykte og skrevne", "Bare læreboka"], answer: 2,
            explain: "Alle trykte og skrevne hjelpemidler. Ta med noe du kjenner godt, for eksempel eksamensnotatene, så du finner fram raskt." }
        ] }],
        feller: [
          "Å svare på JA/NEI-påstander du ikke vet noe om. Med ±1 lønner det seg ikke i snitt.",
          "Å la radantall-spørsmål stå blanke. Med +2/−0,5 lønner det seg å svare.",
          "Å bruke en time på ER-tegningen og få dårlig tid til SQL, som er den største delen."
        ] }
    ] },

    /* ===================== 1 · ER ===================== */
    { nr: 1, navn: "ER-modellering", hvor: "Oppgave 1, 15–30 p", steg: [
      { id: "1a", tittel: "Tegne ER-diagram fra en kravtekst", vekt: 10, min: "E", tid: 35, tidG: 40,
        hvorfor: "ER-tegningen er alltid oppgave 1 og har gitt 15–30 p. Sensor gir poeng per punkt i kravteksten (H2024: 1 p per punkt). Trekk: −0,5 for riktig kardinalitet eller total deltakelse på feil side, −1 for feil kardinalitet eller manglende total deltakelse, −1 for manglende nøkkel- eller flerverdimarkering.",
        kjerne: t(
          "Du lager et kart over det butikken bryr seg om. Tingene (kunde, bok) blir bokser. Egenskapene (navn, pris) blir ovaler. Hvordan tingene henger sammen (låner, skriver) blir ruter mellom boksene. På strekene skriver du 1 eller N for hvor mange, og en dobbel strek betyr «må være med».",
          "<p><b>Entitet</b> = rektangel, navn i versaler. <b>Attributt</b> = oval, og <b>nøkkelattributtet</b> har navnet understreket. Flerverdiattributt = dobbel oval, utledbart = stiplet oval, sammensatt = oval med under-ovaler. <b>Relasjon</b> = rombe.</p><p><b>Kardinalitet</b> (1, N eller M) står på streken nær romben. Tallet ved entitet E sier hvor mange E den andre siden kan relateres til: BOK N – UTGITT – 1 FORLAG betyr at en bok har høyst ett forlag. <b>Total deltakelse</b> (minst én) = dobbel strek. Enkel strek = partiell (kan være 0).</p>",
          "<p>Les kravteksten punkt for punkt. Substantiver med egen identitet blir entiteter, egenskaper blir attributter, verb blir relasjoner. For hver relasjon svarer du på to spørsmål for hver side: høyst hvor mange (1 eller N), og minst hvor mange (0 = enkel strek, 1 = dobbel strek). «Nøyaktig én» er total deltakelse og 1.</p><p>Relasjonsattributter henger på romben og kan aldri være nøkkel. Del ikke én entitet i to roller (H2023: −2 for TIL-KONTO og FRA-KONTO). Bruk to relasjoner til samme entitet i stedet.</p>"),
        les: [["er", "notasjon", null, "ER → Notasjon"], ["er", "relasjoner", null, "ER → Relasjoner og kardinalitet"], ["er", "tekst-til-diagram", "steg-festival", "ER → Fra tekst til diagram"]],
        oppskrift: [
          "Nummerer punktene i kravteksten og kryss av når hvert punkt er tegnet. Sensor retter punkt for punkt.",
          "Tegn entitetene først, med nøkkelattributtet understreket.",
          "Legg til relasjonene. Skriv 1 eller N på hver strek: «høyst hvor mange av denne kan én på den andre siden ha?»",
          "Sett dobbel strek der kravteksten sier «må», «alltid» eller «hver … har minst én».",
          "Merk flerverdi (dobbel oval), sammensatte og utledbare attributter.",
          "Skriv antakelser som kommentar når teksten er tvetydig. Begge tolkninger kan gi full uttelling."
        ],
        eksempel: [["er", "tekst-til-diagram", "steg-festival", "Stegvis: fra kravtekst til diagram (festivaleksempelet)"]],
        oppgaver: ["H2024-1_1"],
        ekstra: ["H2020-M1", "H2019-1_1"],
        sjekk: [{ type: "quiz", items: [
          { q: "BOK N – UTGITT_AV – 1 FORLAG. Hva betyr 1-tallet ved FORLAG?", options: ["Det finnes bare ett forlag", "En bok har høyst ett forlag", "Et forlag har høyst én bok", "Hver bok må ha et forlag"], answer: 1,
            explain: "Tallet ved en entitet sier hvor mange av den den andre siden kan relateres til. «Må ha» er deltakelse (dobbel strek), ikke kardinalitet." },
          { q: "Kravteksten sier «hver ansatt jobber i nøyaktig én avdeling». Hva tegner du ved relasjonen?", options: ["1 ved AVDELING og enkel strek fra ANSATT", "1 ved AVDELING og dobbel strek fra ANSATT", "N ved AVDELING og dobbel strek fra AVDELING", "Bare 1 ved ANSATT"], answer: 1,
            explain: "«Høyst én» gir 1 ved AVDELING. «Minst én» gir total deltakelse, altså dobbel strek fra ANSATT til romben." },
          { q: "En person kan ha flere telefonnumre. Hvordan tegner du telefon?", options: ["Vanlig oval", "Dobbel oval (flerverdiattributt)", "Stiplet oval", "Egen entitet med nøkkel"], answer: 1,
            explain: "Flere verdier av samme attributt = flerverdiattributt, tegnet som dobbel oval. Stiplet oval er utledbart." },
          { q: "En overføring går fra én konto til én annen konto. Hva er riktig modellering?", options: ["To entiteter: FRA-KONTO og TIL-KONTO", "Én entitet KONTO med to relasjoner (FRA og TIL) til OVERFØRING", "Ett flerverdiattributt konto på OVERFØRING", "Én ternær relasjon med KONTO to ganger"], answer: 1,
            explain: "Å dele én entitet i to roller ga −2 på H2023. Bruk to relasjoner mellom de samme entitetene." }
        ] }],
        feller: [
          "Kardinaliteten på feil side (−0,5). Husk: tallet ved E sier hvor mange E den andre siden kan ha.",
          "Glemt total deltakelse der teksten sier «må» eller «alltid» (−1).",
          "Nøkkelattributt som ikke er understreket (−1).",
          "Én entitet delt i to roller (H2023: −2)."
        ] },

      { id: "1b", tittel: "Svake entiteter og ternære relasjoner", vekt: 7, min: "E", tid: 35, tidG: 50,
        hvorfor: "Nesten alle ER-oppgavene har en svak entitet, og ofte en ternær relasjon. De gir flest poeng per punkt (H2023 og H2024: 3 p for den svake entiteten). Manglende markering av svak entitet eller identifiserende relasjon koster −1 til −2.",
        kjerne: t(
          "En svak entitet er som et romnummer: «rom 101» betyr ingenting alene, du må vite hvilket bygg. Derfor henger den alltid fast i den identifiserende entiteten sin. En ternær relasjon er når tre ting må nevnes samtidig for at det skal gi mening, som «lærer, fag og klasse» i en timeplan.",
          "<p><b>Svak entitet</b> = dobbelt rektangel. Den kan bare identifiseres sammen med den identifiserende entiteten, gjennom en <b>identifiserende relasjon</b> (dobbel rombe). Den svake entiteten har alltid total deltakelse (dobbel strek) og 1 ved den identifiserende entiteten. Den <b>svake nøkkelen</b> har stiplet understrek.</p><p><b>Ternær relasjon</b> = én rombe med tre streker. Kardinaliteten ved en entitet svarer på: gitt én kombinasjon av de to andre, hvor mange av denne?</p>",
          "<p>En ternær relasjon er ikke det samme som tre binære: tre binære husker bare parene, ikke hvilken trippel som faktisk hører sammen. Velg ternær når kravteksten knytter tre ting til én hendelse (en anbefaling er gitt av én bruker, om ett produkt, til én annen bruker). En svak entitet kan ha flere identifiserende entiteter og flere nivåer. Nøkkelen blir nøkkelen til den identifiserende entiteten pluss den svake nøkkelen.</p>"),
        les: [["er", "svake", "fig-svak", "ER → Svake entiteter"], ["er", "ternaere", "fig-ternaer", "ER → Ternære relasjoner"], ["er", "ternaere", "fig-trebinaere", "Ternær mot tre binære"]],
        oppskrift: [
          "Spør: kan denne tingen identifiseres alene? Hvis nei: dobbelt rektangel, stiplet svak nøkkel, dobbel rombe til den identifiserende entiteten.",
          "Tegn dobbel strek fra den svake entiteten og 1 ved den identifiserende entiteten.",
          "Spør: knytter teksten tre ting til samme hendelse? Da en ternær rombe.",
          "Sett kardinalitet på hver av de tre strekene: «gitt de to andre, hvor mange av denne?»",
          "Forklar valget av ternær med én setning."
        ],
        eksempel: [["er", "svake", "fig-svak", "Figuren med svak entitet"], ["er", "ternaere", "fig-ternaer", "Figuren med ternær relasjon"]],
        oppgaver: ["H2023-1_1"],
        ekstra: ["H2019-1_2", "H2020-M3", "H2020-M2", "H2025-1_1"],
        sjekk: [{ type: "quiz", items: [
          { q: "Et rom identifiseres med romnummer innenfor et bygg. Hvordan modellerer du ROM?", options: ["Vanlig entitet med romnummer som nøkkel", "Svak entitet: stiplet romnummer, dobbel rombe til BYGG, dobbel strek fra ROM og 1 ved BYGG", "Flerverdiattributt på BYGG", "Ternær relasjon mellom ROM, BYGG og romnummer"], answer: 1,
            explain: "Romnummeret er bare unikt innenfor bygget. Da er ROM en svak entitet med BYGG som identifiserende entitet." },
          { q: "UNDERVISER(LÆRER, FAG, KLASSE) er ternær, med 1 ved LÆRER. Hva betyr det?", options: ["Hver lærer underviser bare ett fag", "Gitt et fag og en klasse, er det høyst én lærer", "Det finnes bare én lærer", "Hver klasse har én lærer i alle fag"], answer: 1,
            explain: "I en ternær relasjon leser du kardinaliteten ved en entitet med de to andre faste." },
          { q: "Hvorfor kan du ikke alltid bytte en ternær relasjon med tre binære?", options: ["Det kan du alltid", "Tre binære husker bare parene, ikke hvilken kombinasjon av tre som hører sammen", "Binære relasjoner kan ikke ha kardinalitet", "Ternære relasjoner er ikke lov i kurset"], answer: 1,
            explain: "Fra parene (lærer, fag), (fag, klasse) og (lærer, klasse) kan du ikke alltid gjenskape hvilke tripler som faktisk finnes." },
          { q: "Hva står ved den identifiserende entiteten i en identifiserende relasjon?", options: ["N", "1", "M", "Ingenting"], answer: 1,
            explain: "Gjennom hver identifiserende relasjon har en svak entitet nøyaktig én identifiserende entitet: 1 ved den identifiserende entiteten og dobbel strek fra den svake entiteten." }
        ] }],
        feller: [
          "Svak entitet uten dobbel rombe, eller med vanlig (heltrukken) understrek på den svake nøkkelen.",
          "Glemt dobbel strek fra den svake entiteten.",
          "Tre binære relasjoner der teksten beskriver én hendelse med tre deltakere."
        ] },

      { id: "1c", tittel: "Lese et ER-diagram (JA/NEI)", vekt: 4, min: "S", tid: 15, tidG: 10,
        hvorfor: "H2023 og H2024 hadde en oppgave der du leser et diagram med meningsløse navn og svarer JA eller NEI på påstander (5 p, ±1). Det er raske poeng hvis du kan lesereglene, og minuspoeng hvis du gjetter.",
        kjerne: t(
          "Du får et kart med rare navn og skal svare på om påstander om kartet stemmer. Det er som å lese et skilt: du må vite hva tallene og de doble strekene betyr.",
          "<p>Tallet ved entitet E sier hvor mange E den andre siden kan relateres til. Dobbel strek betyr at alle av den entiteten må være med i relasjonen. En svak entitet identifiseres av nøkkelen til den identifiserende entiteten og sin svake nøkkel. Navnene betyr ingenting, så les bare symbolene.</p>",
          "<p>Påstandene tester typisk: øvre skranke (kan en A ha flere B?), nedre skranke (kan en A stå uten B?), nøkler i svake entiteter, og om en relasjon er ternær. Med ±1 er forventningen 0 ved gjetting, så svar bare når du har lest symbolet.</p>"),
        les: [["er", "lese", null, "ER → Lese diagrammer"], ["er", "lese", "fig-krypto", "Øvingsdiagrammet med meningsløse navn"]],
        oppskrift: [
          "Finn relasjonen påstanden handler om, og les tallet ved entiteten det spørres om.",
          "«Kan … ha flere» handler om tallet (1 eller N). «Må … ha» handler om streken (enkel eller dobbel).",
          "Er du i tvil om et symbol: la påstanden stå. Gjetting gir 0 i snitt med ±1."
        ],
        eksempel: [["er", "lese", "fig-krypto", "Diagrammet med meningsløse navn"]],
        oppgaver: ["H2024-1_2"],
        ekstra: ["H2023-1_2"],
        sjekk: [{ type: "quiz", items: [
          { q: "A N – R – 1 B, enkel strek på begge sider. «Hver A er relatert til høyst én B.»", options: ["JA", "NEI"], answer: 0,
            explain: "Tallet ved B er 1, og det sier hvor mange B en A kan ha." },
          { q: "Samme diagram. «Hver A må være relatert til en B.»", options: ["JA", "NEI"], answer: 1,
            explain: "Enkel strek fra A betyr partiell deltakelse: en A kan stå uten B." },
          { q: "Dobbel strek fra B til R. «Det kan finnes en B som ikke er med i R.»", options: ["JA", "NEI"], answer: 1,
            explain: "Dobbel strek er total deltakelse: hver B er med minst én gang." }
        ] }],
        feller: [
          "Å lese tallet ved feil entitet.",
          "Å blande «høyst» (tallet) og «minst» (streken)."
        ] }
    ] },

    /* ===================== 2 · REALISERING ===================== */
    { nr: 2, navn: "Realisering og RA", hvor: "Oppgave 1, 7–15 p", steg: [
      { id: "2a", tittel: "Realisering: fra ER-diagram til relasjoner", vekt: 11, min: "E", tid: 35, tidG: 60,
        hvorfor: "Kommer hvert år (7–15 p, typisk 10–12) med samme instruks. Sensor gir 0,5–1 p per entitet og 1–1,5 p per relasjon. Trekk på −0,5 for manglende attributt, manglende markering av KN, PN eller FN og for hvert valg som ikke er forklart (H2020: −2 hvis ingen valg er forklart). Å realisere den identifiserende relasjonen en gang til gir også trekk.",
        kjerne: t(
          "Du gjør tegningen om til tabeller. Hver boks blir en tabell. Strekene blir «henvisninger» fra en tabell til en annen, som en lapp der det står «se kunde nr. 7». Noen ganger trenger du en egen tabell bare for å holde styr på hvem som hører sammen med hvem.",
          "<p>Fast rekkefølge: <b>entiteter</b> → <b>svake entiteter</b> (PN = PN-en til den identifiserende entiteten + svak nøkkel, pluss FN) → <b>1-1</b> (FN på én side, eller sammensmelting hvis begge har total deltakelse) → <b>1-N</b> (FN på N-siden) → <b>M-N</b> (egen relasjon, PN = begge FN-ene) → <b>flerverdi</b> (egen relasjon, KN = alle attributtene) → <b>ternære</b> (alltid egen relasjon).</p><p>Svarform: <code>Lån(lnr, bok, dager)</code>, så linjer med <code>KN: {lnr}</code>, <code>PN: {lnr}</code> og <code>FN: bok → Bok(bnr)</code>. Ingen datatyper, ingen SQL. Forklar hvert valg i én setning.</p>",
          "<p>Mål: færrest mulig relasjoner og NULL-verdier. 1-N kan også realiseres som egen relasjon, men FN på N-siden gir færre relasjoner. Har N-siden partiell deltakelse, blir FN-en NULL for noen rader, og det kan være verdt å nevne. Ternær: står det 1 ved én entitet, utgjør FN-ene til de to andre en KN. Relasjonsattributter blir aldri del av KN eller PN. Utledbare attributter droppes, og av sammensatte beholdes bare bladene.</p>"),
        les: [["realisering", "algoritmen", "algo-pseudo", "Realisering → Algoritmen"], ["realisering", "en-til-en", null, "Realisering → 1-1"], ["realisering", "naere", null, "Realisering → Ternære og N-ære"]],
        oppskrift: [
          "Gå gjennom diagrammet i fast rekkefølge: entiteter, svake, 1-1, 1-N, M-N, flerverdi, ternære.",
          "Skriv hver relasjon som <code>Navn(attributter)</code> med KN, PN og FN på egne linjer.",
          "Svak entitet: ta med PN-en til den identifiserende entiteten som FN og la den være en del av PN. Ikke lag en egen relasjon for den identifiserende relasjonen.",
          "1-1 og 1-N: si hvor FN-en havner og hvorfor (gjerne «færre NULL-verdier»).",
          "Sjekk at hvert attributt i diagrammet står et sted, og at ingen relasjon mangler PN."
        ],
        eksempel: [["realisering", "hele", "steg-hele", "Stegvis: et helt diagram realisert"]],
        oppgaver: ["H2024-1_3"],
        ekstra: ["H2023-1_3", "H2020-M4", "H2019-1_3", "H2025-1_2"],
        sjekk: [{ type: "quiz", items: [
          { q: "Hver ansatt jobber i høyst én avdeling, og en avdeling har mange ansatte. Hvor legger du FN-en?", options: ["I Avdeling", "I Ansatt: avdnr → Avdeling(avdnr)", "Egen relasjon er påkrevd", "I begge"], answer: 1,
            explain: "1-N: FN på N-siden, altså i Ansatt. En egen relasjon er også lov, men gir flere relasjoner." },
          { q: "M-N-relasjonen SKREVET_AV mellom BOK og FORFATTER har attributtet rekkefølge. Hva er PN i SkrevetAv?", options: ["{bok, forfatter, rekkefølge}", "{bok, forfatter}", "{rekkefølge}", "{bok}"], answer: 1,
            explain: "PN i en M-N-relasjon er FN-ene til begge sider. Relasjonsattributter blir aldri del av PN." },
          { q: "PERSON(pnr) har flerverdiattributtet telefon. Hvordan realiseres det?", options: ["Kolonnen telefon i Person", "Telefon(pnr, telefon) med KN {pnr, telefon} og FN pnr → Person(pnr)", "Telefon(telefon) med PN {telefon}", "Det droppes"], answer: 1,
            explain: "Flerverdiattributter blir egen relasjon der alle attributtene sammen er KN." },
          { q: "Den svake entiteten ROM (svak nøkkel romnr) har identifiserende entitet BYGG(bnr). Hva er PN i Rom?", options: ["{romnr}", "{bnr, romnr}", "{bnr}", "Rom trenger en egen relasjon for den identifiserende relasjonen"], answer: 1,
            explain: "PN = PN-en til den identifiserende entiteten + den svake nøkkelen. Den identifiserende relasjonen er dermed realisert og skal ikke realiseres en gang til." },
          { q: "1-1 der bare den ene siden har total deltakelse. Kan du smelte sammen til én relasjon?", options: ["Ja, alltid", "Nei: sammensmelting krever total deltakelse på begge sider. Legg FN på én side, helst den med total deltakelse", "Ja, hvis begge har samme PN", "Nei, 1-1 krever alltid egen relasjon"], answer: 1,
            explain: "Med FN på siden med total deltakelse blir den aldri NULL." }
        ] }],
        feller: [
          "Manglende forklaring av valgene (−0,5 per valg, H2020: −2 hvis ingen er forklart).",
          "Den identifiserende relasjonen realisert en gang til.",
          "Datatyper eller CREATE TABLE i svaret. Oppgaven vil ha relasjonsskjemaer.",
          "Relasjonsattributtet tatt med i PN-en til en M-N-relasjon."
        ] },

      { id: "2b", tittel: "Relasjonsalgebra (sjeldent)", vekt: 1, min: "G", tid: 20,
        hvorfor: "RA var med på H2025 (5 p), men ikke 2019–2024. Lav prioritet, men en kort runde gjør at du ikke står helt tom.",
        kjerne: t(
          "Relasjonsalgebra er SQL skrevet med matte-tegn. Du velger rader (σ), velger kolonner (π) og setter tabeller sammen (⋈).",
          "<p><code>σ_{betingelse}(R)</code> velger rader, <code>π_{A,B}(R)</code> velger kolonner, <code>R ⋈_{betingelse} S</code> er join, <code>ρ_{A→B}(R)</code> gir nytt navn, og <code>∪ ∩ \\</code> er mengdeoperasjoner. <code>SELECT k FROM t WHERE u</code> tilsvarer <code>π_k(σ_u(t))</code>.</p>",
          "<p>RA er mengdebasert, så duplikater forsvinner. SQL-svar er multimengder. Theta-join er <code>σ_{betingelse}(R × S)</code>. Divisjon og ytre join er ikke i kurset. Skriv gjerne mellomresultater med navn: <code>Oslo := σ_{by='Oslo'}(Kunde)</code>.</p>"),
        les: [["relasjonsalgebra", "tre", null, "Relasjonsalgebra → uttrykkstre steg for steg"], ["relasjonsalgebra", "join", null, "Relasjonsalgebra → × og ⋈"]],
        oppskrift: [
          "Oversett oppgaven til SQL i hodet først.",
          "Skriv det innenfra og ut: join, så σ, så π til slutt.",
          "Gi mellomresultater navn med <code>:=</code> når uttrykket blir langt."
        ],
        eksempel: [{ html: "<p>«Navn på kunder i Oslo som har en båt»: <code>π_{navn}(σ_{by='Oslo'}(Kunde ⋈_{Kunde.knr=Båt.eier} Båt))</code>. Egen modell, ikke eksamensskjemaet.</p>" }],
        oppgaver: ["H2025-1_3"],
        sjekk: [{ type: "quiz", items: [
          { q: "Hva tilsvarer SELECT navn FROM kunde WHERE by = 'Oslo' i RA?", options: ["σ_{navn}(π_{by='Oslo'}(Kunde))", "π_{navn}(σ_{by='Oslo'}(Kunde))", "Kunde × Oslo", "ρ_{navn}(Kunde)"], answer: 1,
            explain: "σ velger rader (WHERE), π velger kolonner (SELECT)." },
          { q: "To kunder bor i Oslo. Hvor mange rader har π_{by}(σ_{by='Oslo'}(Kunde))?", options: ["2", "1", "0", "Det kommer an på PN"], answer: 1,
            explain: "RA er mengdebasert, så duplikater forsvinner. SQL uten DISTINCT ville gitt 2 rader." }
        ] }],
        feller: [
          "π og σ byttet om.",
          "Ytre join eller divisjon. De er ikke i kurset."
        ] }
    ] },

    /* ===================== 3 · SQL ===================== */
    { nr: 3, navn: "SQL", hvor: "Oppgave 2, 40–50 p", steg: [
      { id: "3a", tittel: "Hvor mange rader? (radantall-flervalget)", vekt: 8, min: "E", tid: 25, tidG: 45,
        hvorfor: "SQL-delen starter med et flervalg der du sier hvor mange rader 5–6 spørringer gir på eksempeldataene (10–12 p, +2 for riktig og −0,5 for galt H2023–H2025). Det tester presis semantikk: DISTINCT, LIMIT/OFFSET, NULL, NOT EXISTS, EXCEPT ALL, NATURAL JOIN og FULL JOIN.",
        kjerne: t(
          "Du er databasen. Du får noen små tabeller og en spørring, og skal gjøre jobben for hånd: ta radene, kast de som ikke passer, og tell hva som er igjen. Det vanskelige er de rare reglene, for eksempel at «ukjent» (NULL) aldri er lik noe, heller ikke seg selv.",
          "<p>Kjør spørringen i den rekkefølgen databasen gjør: FROM og JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT/OFFSET. Tell rader etter hvert steg.</p><p>Regler å kunne: sammenligning med NULL gir NULL, så raden faller bort i WHERE. Aggregat uten GROUP BY gir alltid én rad (også når WHERE fjerner alt: <code>count(*)</code> blir 0). LEFT JOIN beholder alle rader fra venstre, FULL JOIN fra begge. UNION fjerner duplikater, UNION ALL gjør det ikke. EXCEPT ALL trekker fra antall forekomster.</p>",
          "<p>NATURAL JOIN joiner på alle like kolonnenavn. En NATURAL self-join (<code>t AS t1 NATURAL JOIN t AS t2</code>, samme tabell to ganger krever alias) gir tilbake tabellen bare når ingen verdier er NULL, fordi en rad med NULL ikke matcher seg selv. <code>LIMIT n OFFSET m</code> hopper over m rader og tar så høyst n. <code>count(kol)</code> teller ikke NULL, <code>count(*)</code> teller rader.</p><p>Poengregelen +2/−0,5 gjør at det lønner seg å svare selv når du må gjette (forventning +0,125 med fire alternativer).</p>"),
        les: [["sql-videre", "radantall", "del1-radantall", "SQL videregående → Hvor mange rader?"], ["sql-videre", "null", null, "SQL videregående → NULL"], ["sql-videre", "mengde", "so-demo", "SQL videregående → Mengdeoperasjoner"]],
        oppskrift: [
          "Skriv ned radene i hver tabell (eller pek på dem i vedlegget).",
          "Gjør FROM/JOIN først og tell radene i mellomresultatet.",
          "Gå videre klausul for klausul. Stryk rader der WHERE blir usann eller NULL.",
          "Se etter fellene: DISTINCT, aggregat uten GROUP BY, LIMIT/OFFSET, NULL, ALL.",
          "Svar på alle. Med +2/−0,5 lønner det seg."
        ],
        eksempel: [["sql-videre", "radantall", "del1-radantall", "Øvingssettet med radantall"]],
        oppgaver: ["H2025-2_1"],
        ekstra: ["H2024-2_1", "H2023-2_1", "H2020-S1"],
        sjekk: [{ type: "quiz", items: [
          { q: "SELECT count(*) FROM t WHERE false; Hvor mange rader?", options: ["0", "1", "NULL", "Feilmelding"], answer: 1,
            explain: "Aggregat uten GROUP BY gir alltid én rad. Her er verdien 0." },
          { q: "R har x-verdiene 1, 1, 2 og S har 1. Hvor mange rader gir SELECT x FROM R EXCEPT ALL SELECT x FROM S?", options: ["1", "2", "3", "0"], answer: 1,
            explain: "EXCEPT ALL trekker fra én 1-er: {1, 1, 2} − {1} = {1, 2}. Uten ALL ville svaret vært {2}, altså én rad." },
          { q: "t har 5 rader. Hvor mange rader gir SELECT * FROM t LIMIT 2 OFFSET 4?", options: ["0", "1", "2", "5"], answer: 1,
            explain: "OFFSET 4 hopper over fire rader. Bare én er igjen, og LIMIT 2 tar høyst to." },
          { q: "t(a) har verdiene 1, NULL og 3. Hvor mange rader gir SELECT * FROM t WHERE a != 1?", options: ["1", "2", "3", "0"], answer: 0,
            explain: "NULL != 1 gir NULL, ikke sann, så den raden faller bort. Bare 3 blir igjen." },
          { q: "t har 4 forskjellige rader, og én av dem har NULL i en kolonne. Hvor mange rader gir SELECT * FROM t AS t1 NATURAL JOIN t AS t2?", options: ["4", "3", "16", "0"], answer: 1,
            explain: "NATURAL JOIN sammenligner alle kolonnene. Raden med NULL matcher ikke seg selv, fordi NULL = NULL gir NULL." },
          { q: "Du står mellom to alternativer på et radantall-spørsmål (+2/−0,5). Lønner det seg å svare?", options: ["Nei", "Ja: 0,5 · 2 − 0,5 · 0,5 = +0,75"], answer: 1,
            explain: "Forventet gevinst er positiv så lenge sjansen for riktig svar er over 20 %." }
        ] }],
        feller: [
          "Å glemme at aggregat uten GROUP BY gir én rad.",
          "Å tro at NULL = NULL er sann.",
          "Å lese UNION som UNION ALL, eller omvendt.",
          "Å la spørsmål stå blanke når gjetting lønner seg."
        ] },

      { id: "3b", tittel: "Enkle spørringer: SELECT, JOIN, WHERE og LIKE", vekt: 6, min: "E", tid: 20, tidG: 40,
        hvorfor: "Hvert år kommer 2–3 enkle spørringer på 5 p. Trekk: −0,5 for manglende kolonne i SELECT, −1 for manglende tabell i FROM, −1 for manglende begrensning i WHERE, −2 for LIKE uten <code>%</code>, −1 for <code>=</code> i stedet for LIKE, −2 for AND i stedet for OR, og −1 til −2 for hardkodede ID-er.",
        kjerne: t(
          "Du ber databasen om noe, akkurat som når du spør en bibliotekar: «gi meg titlene (SELECT) på bøkene (FROM) som kom ut etter 2000 (WHERE)». Trenger du noe fra to hyller, setter du hyllene sammen med JOIN.",
          "<p>Grunnformen er <code>SELECT … FROM … WHERE …</code>. Tabeller kobles med <code>INNER JOIN … ON (a.x = b.y)</code> langs fremmednøklene i skjemaet. <code>LIKE '%data%'</code> finner tekst som inneholder «data». Sett parentes rundt OR når den står sammen med AND.</p>",
          "<p>Join mot tabellen med navnet i stedet for å skrive inn en ID du ser i eksempeldataene (<code>lid = 3</code> ga −1). NATURAL JOIN joiner på alle like kolonnenavn og gir trekk når begge tabellene har for eksempel <code>navn</code>. Bruk DISTINCT når en join kan gi samme svar flere ganger. Enkle syntaksfeil og datoformat gir ikke trekk.</p>"),
        les: [["sql", "anatomi", "steg-anatomi", "SQL → Anatomien til en spørring"], ["sql", "join", "steg-innerjoin", "SQL → INNER JOIN"], ["sql", "join", "steg-natural", "SQL → NATURAL JOIN og fellen"]],
        oppskrift: [
          "Finn tabellene du trenger og join-stien mellom dem (fremmednøklene i skjemaet).",
          "Skriv FROM med <code>INNER JOIN … ON (…)</code> for hver kobling.",
          "WHERE: ta med alle betingelsene, med parentes rundt OR.",
          "SELECT: akkurat kolonnene oppgaven ber om. DISTINCT hvis joinen kan gi duplikater.",
          "Skriv antakelser som <code>--</code>-kommentar."
        ],
        eksempel: [
          { tekst: "Egen modell: bok(bnr, tittel, år) og lån(lnr, bok, dager). Titler på bøker fra etter 2000, eller med «data» i tittelen, som er lånt ut minst én gang:",
            sql: "SELECT DISTINCT b.tittel\nFROM bok AS b\n  INNER JOIN lån AS l ON (l.bok = b.bnr)\nWHERE (b.år > 2000 OR b.tittel LIKE '%data%');" },
          ["sql", "join", "steg-innerjoin", "Stegvis INNER JOIN på emnesiden"]
        ],
        oppgaver: ["H2023-2_2"],
        ekstra: ["H2025-2_2", "H2020-S2", "H2019-2_2", "H2024-2_2", "H2024-2_4"],
        sjekk: [{ type: "quiz", items: [
          { q: "WHERE år > 2000 OR navn LIKE 'King'. Hva er galt?", options: ["Ingenting", "LIKE uten % treffer bare navnet «King». Skriv '%King%'", "OR må være AND", "LIKE kan ikke brukes på tekst"], answer: 1,
            explain: "Uten jokertegn virker LIKE som =. Sensor trakk −2 for LIKE uten %." },
          { q: "Hvorfor er NATURAL JOIN risikabelt mellom band(bid, navn) og person(pid, navn, bid)?", options: ["Den joiner på både bid og navn", "Den er tregere", "Den fjerner alle NULL", "Den finnes ikke i PostgreSQL"], answer: 0,
            explain: "NATURAL JOIN bruker alle like kolonnenavn, og da må bandet og personen hete det samme. Bruk INNER JOIN … ON (…)." },
          { q: "Oppgaven gjelder «byer i Italia». Du skriver WHERE lid = 3 fordi Italia har id 3 i eksempeldataene. Hva skjer?", options: ["Full pott", "Trekk: join mot land og filtrer på navnet 'Italia'", "Feilmelding", "Ingen rader"], answer: 1,
            explain: "Spørringen skal virke på alle data, ikke bare eksempeldataene. Hardkodede ID-er ga −1 til −2." },
          { q: "Hva gir WHERE a = 1 AND b = 2 OR b = 3?", options: ["a = 1 og b er 2 eller 3", "(a = 1 og b = 2), eller b = 3 uansett a", "Feilmelding", "Det samme som uten OR"], answer: 1,
            explain: "AND binder sterkere enn OR. Skriv parentes: a = 1 AND (b = 2 OR b = 3)." }
        ] }],
        feller: [
          "LIKE uten % (−2), eller = i stedet for LIKE (−1).",
          "Manglende parentes rundt OR.",
          "Hardkodet ID i stedet for join mot navnet.",
          "NATURAL JOIN mellom tabeller som begge har kolonnen navn."
        ] },

      { id: "3c", tittel: "Aggregering, GROUP BY og HAVING, også de med 0", vekt: 8, min: "E", tid: 30, tidG: 40,
        hvorfor: "Aggregat er med i nesten alle de store SQL-oppgavene, og «også de med 0» går igjen. Trekk: −2 for aggregat i WHERE i stedet for HAVING, −2 for manglende GROUP BY, −2 for INNER JOIN der radene med 0 skal med, og −1 for <code>count(*)</code> i stedet for <code>count(kolonne)</code> med ytre join (H2019 2.5).",
        kjerne: t(
          "GROUP BY er å sortere sokker i hauger etter farge, og så telle hver haug. WHERE kaster sokker før du lager haugene, HAVING kaster hele hauger etterpå. Vil du ha med farger du ikke har noen sokker av (0), må du starte fra lista over alle farger (LEFT JOIN).",
          "<p><code>GROUP BY</code> lager én gruppe per verdi. I SELECT kan du da bare ha grupperingskolonner og aggregater (<code>count</code>, <code>sum</code>, <code>avg</code>, <code>min</code>, <code>max</code>). <b>WHERE</b> filtrerer rader før grupperingen, <b>HAVING</b> filtrerer grupper etterpå og står etter GROUP BY.</p><p>«Også de med 0»: <code>LEFT JOIN</code> fra tabellen der alle skal med, og tell en kolonne fra den andre tabellen: <code>count(l.lnr)</code>. Den teller ikke NULL, så rader uten treff blir 0.</p>",
          "<p>Aggregater hopper over NULL: <code>avg</code> av 2, NULL og 4 er 3. <code>count(*)</code> teller rader, så etter en LEFT JOIN gir den 1 for rader uten treff. PK alene i GROUP BY er nok til å velge de andre kolonnene i tabellen (gir ikke trekk).</p><p><b>Tilleggsfelle:</b> en WHERE-betingelse på høyre tabell etter LEFT JOIN fjerner radene med NULL igjen, så de med 0 forsvinner. Kursets løsning er å filtrere først i en WITH og så LEFT JOIN mot den.</p>"),
        les: [["sql-videre", "aggregering", "steg-groupby", "SQL videregående → GROUP BY"], ["sql-videre", "aggregering", "steg-wherehaving", "WHERE mot HAVING"], ["sql-videre", "ytre-join", "steg-leftjoin", "LEFT JOIN og «også de med 0»"]],
        oppskrift: [
          "Hva er én rad i svaret? Det er det du grupperer på.",
          "Skal alle være med, også de uten treff? Start FROM med den tabellen og bruk LEFT JOIN.",
          "Tell en kolonne fra høyre tabell, ikke <code>count(*)</code>.",
          "Betingelser på enkeltrader i WHERE, betingelser på aggregater i HAVING.",
          "Sjekk at alle kolonner i SELECT står i GROUP BY eller er aggregert."
        ],
        eksempel: [
          { tekst: "Egen modell. Bøker med færre enn 3 lån, også bøker uten lån:",
            sql: "SELECT b.bnr, b.tittel, count(l.lnr) AS antall\nFROM bok AS b\n  LEFT JOIN lån AS l ON (l.bok = b.bnr)\nGROUP BY b.bnr, b.tittel\nHAVING count(l.lnr) < 3;" },
          ["sql-videre", "ytre-join", "steg-leftjoin", "Stegvis LEFT JOIN på emnesiden"]
        ],
        oppgaver: ["H2019-2_5", "H2023-2_4"],
        ekstra: ["H2024-2_3", "H2023-2_3", "H2020-S3", "H2019-2_3"],
        sjekk: [{ type: "quiz", items: [
          { q: "Hva er avg av verdiene 2, NULL og 4?", options: ["2", "3", "NULL", "6"], answer: 1,
            explain: "Aggregater hopper over NULL: (2 + 4) / 2 = 3." },
          { q: "Antall sanger per band, også band uten sanger. Hva teller du etter band LEFT JOIN sang?", options: ["count(*)", "count(s.sid), en kolonne fra sang", "sum(1)", "count(b.bid)"], answer: 1,
            explain: "count(*) og count(b.bid) gir 1 for band uten sanger. count(s.sid) teller ikke NULL og gir 0." },
          { q: "Hvor skal betingelsen count(*) > 2 stå?", options: ["I WHERE", "I HAVING, etter GROUP BY", "I ORDER BY", "I SELECT"], answer: 1,
            explain: "WHERE ser bare enkeltrader. Aggregat i WHERE ga −2." },
          { q: "SELECT by, navn, count(*) FROM … GROUP BY by, der by ikke er en nøkkel. Hva er problemet?", options: ["Ingenting", "navn står verken i GROUP BY eller i et aggregat", "count(*) må stå først", "GROUP BY må stå før FROM"], answer: 1,
            explain: "Én gruppe kan ha mange navn, så databasen vet ikke hvilket den skal vise." },
          { q: "bok LEFT JOIN lån … WHERE l.dager > 10, og du vil ha alle bøker med antall lange lån (også 0). Hva skjer?", options: ["Bøkene uten lange lån kommer med med 0", "WHERE fjerner radene med NULL, så bøkene med 0 forsvinner. Filtrer lånene i en WITH først og LEFT JOIN mot den", "Feilmelding", "Alle bøker får 0"], answer: 1,
            explain: "En tilleggsfelle: NULL > 10 er ikke sann, så radene fra LEFT JOIN uten treff faller bort." }
        ] }],
        feller: [
          "INNER JOIN der de med 0 skal med (−2).",
          "count(*) etter LEFT JOIN (−1).",
          "Aggregat i WHERE (−2).",
          "Tilleggsfelle: WHERE på høyre tabell etter LEFT JOIN."
        ] },

      { id: "3d", tittel: "«Uten», «for alle» og mengdeoperasjoner", vekt: 4, min: "S", tid: 20, tidG: 20,
        hvorfor: "Oppgaver av typen «byer uten regn», «slett album uten sanger» og «personer født på en av datoene» kom på H2019 og H2020 (5 p hver), og NOT EXISTS og EXCEPT dukker også opp i radantall-flervalget.",
        kjerne: t(
          "«Uten» betyr: let etter et eksempel, og ta med raden bare hvis du ikke finner noe. «For alle» betyr: det finnes ingen som mangler.",
          "<p>«Uten X»: <code>WHERE NOT EXISTS (SELECT * FROM x WHERE x.fk = t.id)</code>, eller <code>LEFT JOIN … WHERE x.id IS NULL</code>, eller <code>EXCEPT</code>. «For alle» skrives som «det finnes ingen som ikke …», altså to NOT EXISTS inni hverandre, eller ved å sammenligne antall. <code>UNION</code>, <code>INTERSECT</code> og <code>EXCEPT</code> krever like mange kolonner med samme typer og fjerner duplikater.</p>",
          "<p>NOT EXISTS er korrelert: delspørringen bruker en kolonne fra den ytre raden. <b>Tilleggsfelle:</b> <code>x NOT IN (SELECT y …)</code> gir ingen rader hvis delspørringen inneholder NULL, fordi <code>x != NULL</code> er NULL. NOT EXISTS har ikke det problemet. Bruk DELETE, ikke DROP, når rader skal fjernes (DROP ga −1).</p>"),
        les: [["sql-videre", "delsporringer", "steg-notexists", "SQL videregående → NOT EXISTS"], ["sql-videre", "for-alle", "steg-foralle", "SQL videregående → «For alle»"], ["sql-videre", "mengde", "so-demo", "Mengdeoperasjoner"]],
        oppskrift: [
          "Oversett «uten» til NOT EXISTS med en delspørring som kobler til den ytre raden.",
          "«For alle»: skriv det om til «finnes ingen som ikke …».",
          "Unngå NOT IN når delspørringen kan gi NULL.",
          "Mengdeoperasjoner: sjekk at begge sider har samme kolonner."
        ],
        eksempel: [
          { tekst: "Egen modell. Bøker som aldri er lånt ut:",
            sql: "SELECT b.tittel\nFROM bok AS b\nWHERE NOT EXISTS (\n  SELECT *\n  FROM lån AS l\n  WHERE l.bok = b.bnr\n);" },
          ["sql-videre", "for-alle", "steg-foralle", "Stegvis «for alle» på emnesiden"]
        ],
        oppgaver: ["H2020-S4"],
        ekstra: ["H2019-2_6", "H2019-2_4"],
        sjekk: [{ type: "quiz", items: [
          { q: "x NOT IN (SELECT y FROM s), der kolonnen y har en NULL. Hva får du?", options: ["Riktig svar", "Ingen rader: x != NULL er NULL, så NOT IN blir aldri sann", "Alle rader", "Feilmelding"], answer: 1,
            explain: "En tilleggsfelle. NOT EXISTS gir riktig svar også med NULL." },
          { q: "Album uten sanger skal fjernes. Hva skriver du?", options: ["DROP TABLE album", "DELETE FROM album AS a WHERE NOT EXISTS (SELECT * FROM sang AS s WHERE s.album = a.aid)", "DELETE album", "UPDATE album SET sanger = 0"], answer: 1,
            explain: "DROP fjerner hele tabellen (−1). DELETE med NOT EXISTS fjerner bare radene uten sanger." },
          { q: "Hva er forskjellen på UNION og UNION ALL?", options: ["UNION fjerner duplikater, UNION ALL beholder dem", "UNION ALL fjerner duplikater", "Ingen", "UNION ALL krever like kolonnenavn"], answer: 0,
            explain: "Uten ALL blir svaret en mengde, med ALL en multimengde." }
        ] }],
        feller: [
          "Tilleggsfelle: NOT IN når delspørringen kan inneholde NULL.",
          "DROP i stedet for DELETE (−1).",
          "NOT EXISTS uten kobling til den ytre raden. Da blir den sann eller usann for alle rader samtidig."
        ] },

      { id: "3e", tittel: "VIEW og NULL", vekt: 8, min: "E", tid: 25, tidG: 50,
        hvorfor: "En VIEW-oppgave har vært med hvert år siden 2019 (5–10 p), og NULL-håndtering går igjen fra 2020. Trekk: −3 for manglende <code>CREATE VIEW</code>, −1 for <code>!= NULL</code> i stedet for <code>IS NOT NULL</code>, −2 for å glemme å filtrere bort NULL (H2020 S5) og −1 for manglende DESC.",
        kjerne: t(
          "Et view er en lagret spørring med et navn, som en snarvei. Du skriver spørringen én gang, og etterpå kan du bruke navnet som om det var en tabell.",
          "<p><code>CREATE VIEW navn AS SELECT …;</code> lagrer spørringen. Gi kolonnene navn med <code>AS</code>, så viewet er lett å bruke. NULL sjekkes med <code>IS NULL</code> og <code>IS NOT NULL</code>, aldri med <code>=</code> eller <code>!=</code>.</p>",
          "<p>Prosent og snitt: <code>count</code> og heltallskolonner gir heltallsdivisjon, så <code>3 / 4</code> blir 0. Gang med <code>100.0</code> eller konverter med <code>::float</code>. Et view kan inneholde WITH, GROUP BY, UNION og LEFT JOIN. Vil oppgaven ha med rader der en verdi mangler, bruk LEFT JOIN og tenk gjennom hva NULL skal bli.</p>"),
        les: [["sql-programmering", "views", null, "Views & programmering → Views"], ["sql-videre", "with", null, "SQL videregående → WITH"], ["sql-videre", "null", "steg-notin", "SQL videregående → NULL"], ["sql-videre", "aggregering", "steg-groupby", "GROUP BY"]],
        oppskrift: [
          "Start med <code>CREATE VIEW navn AS</code>. Uten den mister du 3 poeng.",
          "Skriv spørringen som vanlig, og gi alle utregnede kolonner et navn med AS.",
          "Sjekk NULL med IS NULL eller IS NOT NULL.",
          "Prosent: <code>100.0 * …</code> eller <code>::float</code> for å unngå heltallsdivisjon.",
          "Skal noe sorteres «nyeste først» eller «flest først»: husk DESC."
        ],
        eksempel: [
          { tekst: "Egen modell. Et view med antall lån og snittlengde per bok, også bøker uten lån:",
            sql: "CREATE VIEW boklån AS\nSELECT b.bnr, b.tittel,\n       count(l.lnr) AS antall_lån,\n       avg(l.dager) AS snitt_dager\nFROM bok AS b\n  LEFT JOIN lån AS l ON (l.bok = b.bnr)\nGROUP BY b.bnr, b.tittel;" }
        ],
        oppgaver: ["H2025-2_6"],
        ekstra: ["H2024-2_5", "H2020-S5", "H2023-2_5", "H2019-2_7"],
        sjekk: [{ type: "quiz", items: [
          { q: "Oppgaven ber om et view, og du skriver bare SELECT … FROM …. Hva mangler?", options: ["Ingenting", "CREATE VIEW navn AS foran spørringen", "En PRIMARY KEY", "COMMIT"], answer: 1,
            explain: "Manglende CREATE VIEW ga −3." },
          { q: "WHERE vind != NULL. Hva skjer?", options: ["Radene med vind kommer med", "Ingen rader: sammenligning med NULL gir NULL. Skriv IS NOT NULL", "Feilmelding", "Alle rader kommer med"], answer: 1,
            explain: "!= NULL i stedet for IS NOT NULL ga −1." },
          { q: "ferdig og totalt er heltall, 3 og 4. Hva gir ferdig / totalt i PostgreSQL?", options: ["0,75", "0", "1", "NULL"], answer: 1,
            explain: "Heltall delt på heltall gir heltallsdivisjon. Skriv 100.0 * ferdig / totalt eller ferdig::float / totalt." }
        ] }],
        feller: [
          "Glemt CREATE VIEW (−3).",
          "!= NULL eller = NULL (−1).",
          "Heltallsdivisjon i prosentregning.",
          "Glemt DESC (−1), eller overflødig ASC (−0,5)."
        ] },

      { id: "3f", tittel: "WITH og «flest/høyest»", vekt: 7, min: "S", tid: 30, tidG: 60,
        hvorfor: "De store SQL-oppgavene på 8–10 p kombinerer ofte aggregat i flere lag med «flest» eller «høyest». Sensor deler dem i delmål (H2020 S6: 4 + 3 + 3), så hvert riktig lag gir poeng, og tvetydige tolkninger gir full uttelling (H2023 2.6).",
        kjerne: t(
          "En stor oppgave er lettere når du deler den i små biter. WITH lar deg lage en hjelpetabell først, gi den et navn, og bruke den i neste steg. «Flest» finner du ved å sammenligne med den største verdien.",
          "<p><code>WITH navn AS (SELECT …)</code> lager et mellomresultat du kan bruke i resten av spørringen, også flere ganger. «Flest/høyest»: enten <code>ORDER BY … DESC LIMIT 1</code>, eller <code>WHERE n = (SELECT max(n) FROM navn)</code>. Den siste gir alle ved likt, LIMIT 1 gir bare én.</p>",
          "<p>Klausulrekkefølgen er WITH, SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, OFFSET. Aggregat av aggregat (snitt av daglige summer) krever to lag: første lag grupperer per dag i en WITH, andre lag tar snittet per område. Et SELECT-alias kan ikke brukes i WHERE eller HAVING, men WITH-navn kan brukes i alle senere deler.</p>"),
        les: [["sql-videre", "with", "steg-withmax", "SQL videregående → WITH og max"], ["sql-videre", "ytre-join", "eks-yj2", "LEFT JOIN mot et WITH-resultat"]],
        oppskrift: [
          "Del oppgaven i lag: hva må regnes ut først?",
          "Lag ett WITH-ledd per lag, med tydelige kolonnenavn.",
          "«Flest/høyest»: sammenlign med max fra WITH-leddet (gir alle ved likt), eller ORDER BY … DESC LIMIT 1.",
          "Skriv en kommentar om hvordan du tolker likt resultat.",
          "Selv om du ikke rekker hele, skriv lagene du får til. Hvert delmål gir poeng."
        ],
        eksempel: [
          { tekst: "Egen modell. Boka eller bøkene med flest lån:",
            sql: "WITH antall AS (\n  SELECT l.bok, count(*) AS n\n  FROM lån AS l\n  GROUP BY l.bok\n)\nSELECT b.tittel, a.n\nFROM antall AS a\n  INNER JOIN bok AS b ON (b.bnr = a.bok)\nWHERE a.n = (SELECT max(n) FROM antall);" },
          ["sql-videre", "with", "steg-withmax", "Stegvis WITH og max på emnesiden"]
        ],
        oppgaver: ["H2023-2_6"],
        ekstra: ["H2020-S6", "H2019-2_8", "H2025-2_5", "H2025-2_7", "H2024-2_6"],
        sjekk: [{ type: "quiz", items: [
          { q: "Hva er forskjellen på ORDER BY n DESC LIMIT 1 og WHERE n = (SELECT max(n) …)?", options: ["Ingen", "LIMIT 1 gir én rad selv om flere deler førsteplassen. max-varianten gir alle", "max-varianten gir bare én rad", "LIMIT 1 gir den minste"], answer: 1,
            explain: "Skriv gjerne en kommentar om hvordan du tolker likt resultat." },
          { q: "Hvilken klausulrekkefølge er riktig?", options: ["SELECT, WITH, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT", "WITH, SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT", "WITH, FROM, SELECT, GROUP BY, WHERE, HAVING, LIMIT, ORDER BY", "SELECT, FROM, HAVING, WHERE, GROUP BY, ORDER BY, LIMIT, WITH"], answer: 1,
            explain: "WITH kommer først, LIMIT og OFFSET til slutt." },
          { q: "«Området med høyest snittnedbør per dag.» Hva gjør du først?", options: ["max(avg(nedbør))", "Lag en WITH med sum nedbør per område per dag, ta så snittet per område, og finn til slutt det høyeste", "ORDER BY nedbør LIMIT 1", "GROUP BY nedbør"], answer: 1,
            explain: "Aggregat av aggregat krever flere lag, og WITH gjør hvert lag lett å lese." }
        ] }],
        feller: [
          "Aggregat inni aggregat i samme lag.",
          "LIMIT 1 uten å tenke på likt resultat (skriv antakelsen).",
          "SELECT-alias brukt i WHERE.",
          "Å gi opp hele oppgaven. Delmålene gir poeng hver for seg."
        ] },

      { id: "3g", tittel: "CREATE TABLE, INSERT, UPDATE, DELETE og transaksjoner", vekt: 4, min: "S", tid: 20, tidG: 10,
        hvorfor: "H2025 hadde CREATE TABLE + INSERT i én transaksjon (7 p) og en UPDATE (5 p). H2019 hadde lovlig/ulovlig om PK, FK, UNIQUE, CHECK og CASCADE (10 p). Det dukker opp sjeldnere enn spørringer, men er raske poeng.",
        kjerne: t(
          "CREATE TABLE lager en ny tom tabell med regler for hva som får stå der. INSERT legger inn rader, UPDATE endrer dem, DELETE fjerner dem. En transaksjon er «alt eller ingenting»: enten skjer alt, eller ingenting.",
          "<p>Skranker: <code>PRIMARY KEY</code> (= UNIQUE NOT NULL, én per tabell), <code>REFERENCES t(k)</code> (FN), <code>NOT NULL</code>, <code>UNIQUE</code> og <code>CHECK (…)</code>. En transaksjon er <code>BEGIN; … COMMIT;</code>. <code>UPDATE t SET kol = … WHERE …;</code> og <code>DELETE FROM t WHERE …;</code></p>",
          "<p>En CHECK slipper gjennom NULL. Andre KN-er enn PN får <code>UNIQUE NOT NULL</code>. <code>ON DELETE CASCADE</code> på en FN sletter avhengige rader når raden de peker på slettes. Feiler en setning i en transaksjon, blir ingenting av den lagret. UPDATE kan bruke en korrelert delspørring i SET.</p>"),
        les: [["sql", "skranker", null, "SQL → Skranker"], ["sql", "endring", "steg-update", "SQL → UPDATE"], ["sql", "endring", "steg-delete", "SQL → DELETE"]],
        oppskrift: [
          "CREATE TABLE: én kolonne per linje, med type og skranker. PN og FN med.",
          "CHECK for regler som «minst 3 tegn» eller «større enn 0».",
          "Pakk flere setninger som hører sammen i <code>BEGIN; … COMMIT;</code>.",
          "UPDATE og DELETE: glem aldri WHERE, ellers rammes alle rader."
        ],
        eksempel: [
          { tekst: "Egen modell. Tabellen lån med skranker og to rader, i én transaksjon:",
            sql: "BEGIN;\nCREATE TABLE lån (\n  lnr int PRIMARY KEY,\n  bok int NOT NULL REFERENCES bok(bnr),\n  dager int CHECK (dager > 0)\n);\nINSERT INTO lån VALUES (1, 10, 14), (2, 10, 7);\nCOMMIT;" },
          { tekst: "Forleng alle lån av bøker fra før 1950 med en uke:",
            sql: "UPDATE lån\nSET dager = dager + 7\nWHERE bok IN (SELECT bnr FROM bok WHERE år < 1950);" }
        ],
        oppgaver: ["H2025-2_3", "H2025-2_4"],
        ekstra: ["H2019-2_1"],
        sjekk: [{ type: "quiz", items: [
          { q: "dager int CHECK (dager > 0). Du setter inn en rad med dager = NULL. Hva skjer?", options: ["Avvist", "Godtatt: en CHECK slipper gjennom NULL", "dager blir 0", "Feil i CREATE TABLE"], answer: 1,
            explain: "CHECK avviser bare når betingelsen er usann. NULL > 0 er NULL. Vil du stoppe NULL, legg til NOT NULL." },
          { q: "Hva tilsvarer PRIMARY KEY?", options: ["UNIQUE", "NOT NULL", "UNIQUE NOT NULL, og bare én per tabell", "CHECK"], answer: 2,
            explain: "Andre kandidatnøkler får UNIQUE NOT NULL." },
          { q: "En av INSERT-ene mellom BEGIN og COMMIT feiler. Hva blir lagret?", options: ["Ingenting: transaksjonen rulles tilbake", "Radene før feilen", "Alle radene unntatt den som feilet", "Bare CREATE TABLE"], answer: 0,
            explain: "En transaksjon er alt eller ingenting." }
        ] }],
        feller: [
          "UPDATE eller DELETE uten WHERE.",
          "Å tro at CHECK stopper NULL.",
          "Glemt FN (REFERENCES) i CREATE TABLE."
        ] },

      { id: "3h", tittel: "SQL fra et program og SQL-injection (sjeldent)", vekt: 1, min: "G", tid: 15,
        hvorfor: "Bare H2023 hadde en programmeringsoppgave (5 p): oppdatere en rad fra et program uten å åpne for SQL-injection. Lav prioritet, men lett å lære.",
        kjerne: t(
          "Hvis programmet limer det brukeren skriver rett inn i SQL-en, kan en lur bruker skrive SQL selv. Løsningen er å sende brukerens tekst som en verdi ved siden av, ikke som en del av spørringen.",
          "<p>Bruk en parametrisert spørring: plassholder i SQL-en (<code>?</code> i Java/JDBC, <code>%s</code> i Python/psycopg) og verdiene som egne argumenter. Da behandles input alltid som en verdi, aldri som SQL.</p>",
          "<p>Strengkonkatenering (<code>\"… WHERE sid = \" + inn</code>) gir SQL-injection. Med psycopg: <code>cur.execute(\"UPDATE sensor SET vedlikeholdt = %s WHERE sid = %s\", (dato, sid))</code> og så <code>conn.commit()</code>.</p>"),
        les: [["sql-programmering", "program", null, "Views & programmering → SQL fra program"], ["sikkerhet", "injection", null, "Sikkerhet → SQL-injection"]],
        oppskrift: [
          "Skriv SQL-en med plassholdere.",
          "Send verdiene som en egen liste eller tuppel.",
          "Husk commit etter en endring."
        ],
        eksempel: [],
        oppgaver: ["H2023-2_7"],
        sjekk: [{ type: "quiz", items: [
          { q: "Hvorfor er cur.execute(\"… WHERE sid = \" + inn) farlig?", options: ["Det er tregt", "Brukeren kan skrive SQL som blir kjørt. Bruk plassholder og send inn som verdi", "Det virker ikke med tall", "Det er ikke farlig"], answer: 1,
            explain: "Det er SQL-injection. Parametriserte spørringer hindrer det." }
        ] }],
        feller: ["Strengkonkatenering av brukerinput i SQL."] }
    ] },

    /* ===================== 4 · FD OG NORMALISERING ===================== */
    { nr: 4, navn: "FD og normalisering", hvor: "Oppgave 3, 10–27 p", steg: [
      { id: "4a", tittel: "Tillukning, kandidatnøkler og nøkkelattributter", vekt: 6, min: "E", tid: 25, tidG: 40,
        hvorfor: "Hvert år kommer 1–3 korte oppgaver (4–6 p) om tillukning, kandidatnøkler eller nøkkelattributter, ofte som JA/NEI eller avkrysning med minuspoeng. Tillukning og KN trengs også i dekomposisjonen, der feil tillukning og feil KN koster −1 hver.",
        kjerne: t(
          "En FD «A → B» betyr: vet du A, vet du B. Tillukningen av A er alt du kan finne ut hvis du bare vet A. En kandidatnøkkel er et minste sett du kan starte med og finne ut alt.",
          "<p><b>Tillukning</b> <code>X⁺</code>: start med X, og legg til høyresiden av hver FD der venstresiden allerede er med, til ingenting mer kommer til. X er en <b>supernøkkel</b> (SN) hvis <code>X⁺</code> er alle attributtene. En <b>kandidatnøkkel</b> (KN) er en minimal SN. Et <b>nøkkelattributt</b> står i minst én KN.</p>",
          "<p>Triks: et attributt som aldri står på en høyreside, er med i alle KN. Et attributt som bare står på høyresider, er med i ingen. Start med settet som må være med, regn tillukningen, og utvid med ett attributt om gangen. Hopp over supermengder av KN-er du alt har funnet. Nøkkelattributt betyr ikke «i PN» og heller ikke «i alle KN».</p>"),
        les: [["fd", "tillukning", "sp-tillukning", "FD → Tillukning X⁺"], ["fd", "finn-kn", "sp-kn", "FD → Finn alle KN"], ["fd", "nokler", null, "FD → Nøkler"]],
        oppskrift: [
          "Del FD-ene opp så hver høyreside har ett attributt.",
          "Finn attributtene som aldri står på en høyreside. De er med i alle KN.",
          "Regn tillukningen av dem. Er den alt, er det den eneste KN-en.",
          "Ellers: legg til ett og ett attributt (ikke de som bare står på høyresider) og regn tillukningen igjen.",
          "Skriv tillukningene du regner ut. Sensor gir poeng for stegene."
        ],
        eksempel: [
          { html: "<p>R(A, B, C, D, E) med A → B, BC → D og D → A. C og E står aldri på en høyreside, så de er med i alle KN. {C, E}⁺ = {C, E}, ikke SN. {A, C, E}⁺: A → B gir B, BC → D gir D, altså alt. {B, C, E}⁺: BC → D, D → A, alt. {C, D, E}⁺: D → A, A → B, alt. KN: {A, C, E}, {B, C, E} og {C, D, E}. Alle fem attributtene er nøkkelattributter, selv om bare én av KN-ene blir PN.</p>" },
          ["fd", "finn-kn", "sp-kn", "Stegvis på emnesiden"]
        ],
        oppgaver: ["H2024-3_1"],
        ekstra: ["H2023-3_1", "H2020-R1", "H2019-3_1", "H2025-3_2"],
        sjekk: [{ type: "quiz", items: [
          { q: "R(A, B, C, D) med A → B og B → C. Hva er A⁺?", options: ["{A, B}", "{A, B, C}", "{A, B, C, D}", "{A}"], answer: 1,
            explain: "A gir B, og B gir C. D kommer aldri med." },
          { q: "Samme R. Hva er kandidatnøklene?", options: ["{A}", "{A, D}", "{A, B, D}", "{D}"], answer: 1,
            explain: "A og D står aldri på en høyreside, så de er med i alle KN. {A, D}⁺ er alt, så {A, D} er den eneste KN-en." },
          { q: "Hva betyr nøkkelattributt?", options: ["Står i primærnøkkelen", "Står i minst én kandidatnøkkel", "Står i alle kandidatnøkler", "Er selv en kandidatnøkkel"], answer: 1,
            explain: "Det er en vanlig feil å tro at det betyr «i PN» eller «i alle KN»." },
          { q: "Et attributt står aldri på en høyreside. Da er det …", options: ["med i alle KN", "med i ingen KN", "alltid en KN alene", "et ikke-nøkkelattributt"], answer: 0,
            explain: "Ingen FD kan gi deg det, så hver nøkkel må ta det med." }
        ] }],
        feller: [
          "Nøkkelattributt forvekslet med «i PN».",
          "Stoppet etter første KN. Det kan finnes flere.",
          "Tatt med en supermengde av en KN som om den var en KN."
        ] },

      { id: "4b", tittel: "FD-er og instanser", vekt: 2, min: "S", tid: 15,
        hvorfor: "H2023 (fyll inn «?») og H2025 (bryter instansen FD-ene?) hadde korte oppgaver om FD-er og konkrete rader (4–5 p, med minuspoeng).",
        kjerne: t(
          "Hvis «samme klasse betyr samme lærer», kan du ikke ha to rader med samme klasse og forskjellig lærer. Ser du det, er regelen brutt.",
          "<p>En instans <b>bryter</b> <code>X → Y</code> hvis to rader er like på X og ulike på Y. En instans kan motbevise en FD, men aldri bevise at den holder. «Fyll inn ?»: finn en rad med samme X-verdi, så må Y være den samme.</p>",
          "<p>Sjekk hver FD for seg: grupper radene på venstresiden og se om høyresiden er lik innen hver gruppe. Venstresider med flere attributter må være like på alle.</p>"),
        les: [["fd", "fd-instans", "sp-instans", "FD → FD-er og instanser"], ["fd", "fd-instans", "sp-fyll", "Fyll inn «?»"]],
        oppskrift: [
          "Ta én FD om gangen.",
          "Finn rader med lik venstreside.",
          "Er høyresiden ulik i noen av dem, er FD-en brutt."
        ],
        eksempel: [["fd", "fd-instans", "sp-instans", "Stegvis sjekk av en instans"]],
        oppgaver: ["H2023-3_2", "H2025-3_1"],
        sjekk: [{ type: "quiz", items: [
          { q: "Radene (a1, b1) og (a1, b2) står i R(A, B). Holder A → B i instansen?", options: ["Ja", "Nei, den er brutt"], answer: 1,
            explain: "Lik A og ulik B bryter A → B." },
          { q: "En instans bryter ikke A → B. Holder A → B da for R?", options: ["Ja, alltid", "Ikke nødvendigvis: en instans kan motbevise en FD, aldri bevise den"], answer: 1,
            explain: "FD-er er regler for alle lovlige instanser, ikke bare den du ser." }
        ] }],
        feller: ["Å tro at en instans kan bevise en FD."] },

      { id: "4c", tittel: "Normalform per FD og for hele relasjonen", vekt: 4, min: "S", tid: 20, tidG: 20,
        hvorfor: "Normalform per FD kom H2019 og H2024 (4–8 p, +2/−0,5 H2024), og H2020 og H2025 spurte om normalformen til hele relasjonen. H2020 ga 4 p for å bruke algoritmen riktig, 1 p for svaret og −2 uten forklaring.",
        kjerne: t(
          "Normalformer er karakterer for hvor ryddig en tabell er. BCNF er best: bare nøkler bestemmer ting. Hver FD som ikke følger reglene, trekker karakteren ned.",
          "<p>Del høyresidene, og ta hver FD <code>X → A</code> for seg: (1) Er X en SN? Da er FD-en på <b>BCNF</b>. (2) Ellers: er A et nøkkelattributt? Da <b>3NF</b>. (3) Ellers: er X en ekte delmengde av en KN? Da bryter den 2NF og er bare <b>1NF</b>. Hvis ikke er den <b>2NF</b>. Relasjonen er på den laveste normalformen blant FD-ene.</p>",
          "<p>2NF handler bare om ikke-nøkkelattributter som avhenger av en ekte del av en KN. En FD der A er nøkkelattributt, bryter aldri 2NF. Eksempel: R(A, B, C) med AB → C og C → A har KN {A, B} og {B, C}. C → A er 3NF (A er nøkkelattributt), men ikke BCNF. Du trenger alle KN-ene først, ellers kan du ikke vite hva som er nøkkelattributter.</p>"),
        les: [["normalisering", "nf-per-fd", "sp-nf", "Normalisering → Normalform per FD"], ["normalisering", "nf-relasjon", "sp-nfrel", "Normalform for hele relasjonen"], ["normalisering", "normalformer", null, "Normalformene"]],
        oppskrift: [
          "Finn alle KN (steg 4a) og skriv opp nøkkelattributtene.",
          "Del høyresidene så hver FD har ett attributt til høyre.",
          "Gå gjennom de tre spørsmålene for hver FD og skriv svaret med en kort begrunnelse.",
          "Relasjonen får den laveste normalformen."
        ],
        eksempel: [["normalisering", "nf-per-fd", "sp-nf", "Stegvis normalform per FD"]],
        oppgaver: ["H2024-3_2"],
        ekstra: ["H2019-3_2", "H2020-R2"],
        sjekk: [{ type: "quiz", items: [
          { q: "R(A, B, C, D) med AB → C, C → A og B → D. KN er {A, B} og {B, C}. Hvilken normalform har C → A?", options: ["BCNF", "3NF", "2NF", "1NF"], answer: 1,
            explain: "C er ikke SN, men A er et nøkkelattributt (i {A, B}). Da er FD-en på 3NF." },
          { q: "Samme R. Hvilken normalform har B → D?", options: ["BCNF", "3NF", "2NF", "1NF"], answer: 3,
            explain: "B er ikke SN, D er ikke nøkkelattributt, og B er en ekte delmengde av KN-en {A, B}. Det bryter 2NF." },
          { q: "Samme R. Hvilken normalform har hele relasjonen?", options: ["BCNF", "3NF", "2NF", "1NF"], answer: 3,
            explain: "Den laveste blant FD-ene, altså 1NF på grunn av B → D." },
          { q: "X → A der A er nøkkelattributt og X er en del av en KN. Bryter FD-en 2NF?", options: ["Ja", "Nei: 2NF gjelder bare ikke-nøkkelattributter, så FD-en er minst 3NF"], answer: 1,
            explain: "En vanlig felle. Når A er nøkkelattributt, er FD-en på 3NF eller BCNF." }
        ] }],
        feller: [
          "Normalform uten å ha funnet alle KN først.",
          "2NF-fellen: en FD med nøkkelattributt til høyre bryter aldri 2NF.",
          "Svar uten begrunnelse (H2020: −2)."
        ] },

      { id: "4d", tittel: "BCNF-dekomposisjon (tapsfri)", vekt: 9, min: "E", tid: 35, tidG: 45,
        hvorfor: "Hvert år er det én dekomposisjon til BCNF (6–13 p, oftest 10). Sensor gir 5–7 p for første splitt og 2,5–4 p for hvert videre steg. Trekk: −1 per manglende eller feil FD på en delrelasjon, −1 for feil tillukning, −1 for feil KN og −3 når forklaringen mangler.",
        kjerne: t(
          "Er en tabell rotete, deler du den i to. Du tar regelen som lager rot, legger alt den regelen bestemmer i én ny tabell, og resten i en annen. Så gjør du det samme med de nye tabellene til alt er ryddig.",
          "<p>Kursets algoritme: (1) Velg en FD <code>Y → A</code> som bryter BCNF (Y er ikke SN). (2) Regn ut <code>Y⁺</code>. (3) Del R(X) i <code>S₁(Y⁺)</code> og <code>S₂(Y ∪ (X − Y⁺))</code>. (4) Finn FD-ene og KN-ene i hver del, og fortsett med delene som ikke er på BCNF.</p>",
          "<p>Hvert steg er tapsfritt etter Fagins teorem: fellesattributtene i S₁ og S₂ er Y, og Y bestemmer hele S₁ fordi S₁ = Y⁺. FD-ene i en del er de som bare bruker attributter fra delen (regn tillukninger for å finne dem). H2025 hadde en konflikt mellom løsningsforslaget og sensorveiledningen. Følg algoritmen og bruk <code>S₁(Y⁺)</code>.</p>"),
        les: [["normalisering", "bcnf-dekomp", "sp-bcnf", "Normalisering → BCNF-dekomposisjon"], ["normalisering", "tapsfri", "sp-tapsfri", "Tapsfrihet og Fagins teorem"], ["normalisering", "svarform", "svar-gen", "Svarformen sensor vil ha"]],
        oppskrift: [
          "Finn alle KN i R først (steg 4a).",
          "Velg en FD som bryter BCNF, og skriv ned tillukningen av venstresiden.",
          "Skriv S₁(Y⁺) og S₂(Y ∪ (X − Y⁺)).",
          "For hver del: FD-ene som gjelder, KN-ene, og om den er på BCNF.",
          "Gjenta til alle delene er på BCNF. Forklar hvert valg med én setning."
        ],
        eksempel: [
          { html: "<p>R(A, B, C, D) med A → B og B → C. KN: {A, D}. A → B bryter BCNF (A er ikke SN). A⁺ = {A, B, C}, så S₁(A, B, C) med FD A → B, B → C og KN {A}, og S₂(A, D) uten ikke-trivielle FD-er, KN {A, D}, som er på BCNF. S₁ bryter BCNF med B → C (B⁺ = {B, C}): S₃(B, C) med KN {B} og S₄(A, B) med KN {A}. Svar: S₂(A, D), S₃(B, C), S₄(A, B), alle på BCNF.</p>" },
          ["normalisering", "bcnf-dekomp", "sp-bcnf", "Stegvis dekomposisjon på emnesiden"]
        ],
        oppgaver: ["H2023-3_3"],
        ekstra: ["H2024-3_3", "H2020-R3", "H2025-3_3", "H2025-3_4"],
        sjekk: [{ type: "quiz", items: [
          { q: "R(A, B, C, D) med A → B og B → C. Hva gir første splitt på A → B?", options: ["S₁(A, B), S₂(A, C, D)", "S₁(A, B, C), S₂(A, D)", "S₁(A, B, C, D)", "S₁(B, C), S₂(A, B, D)"], answer: 1,
            explain: "S₁ = A⁺ = {A, B, C}, og S₂ = {A} ∪ ({A, B, C, D} − {A, B, C}) = {A, D}." },
          { q: "Er S₁(A, B, C) med A → B og B → C på BCNF?", options: ["Ja", "Nei: B → C, og B er ikke SN i S₁"], answer: 1,
            explain: "B⁺ = {B, C} er ikke hele S₁. Del S₁ videre." },
          { q: "Hvorfor er hvert steg i algoritmen tapsfritt?", options: ["Fordi delene har like mange attributter", "Fagins teorem: fellesattributtene Y bestemmer hele S₁, fordi S₁ = Y⁺", "Fordi BCNF alltid er tapsfritt", "Det er det ikke alltid"], answer: 1,
            explain: "Fagins teorem: en todeling er tapsfri hvis fellesattributtene bestemmer resten av en av delene." },
          { q: "Hva må du skrive for hver delrelasjon?", options: ["Bare attributtene", "Attributtene, FD-ene som gjelder i delen, KN-ene og en kort forklaring", "Bare KN-ene", "CREATE TABLE"], answer: 1,
            explain: "Manglende FD-er koster −1 hver, feil KN −1 og manglende forklaring −3." }
        ] }],
        feller: [
          "S₁(Y, A) i stedet for S₁(Y⁺). Følg algoritmen.",
          "Glemt FD-er eller KN for en delrelasjon (−1 hver).",
          "Ingen forklaring (−3).",
          "Stoppet før alle delene er på BCNF."
        ] }
    ] },

    /* ===================== 5 · GENERALPRØVE ===================== */
    { nr: 5, navn: "Generalprøve", hvor: "Hele H2024 på tid", steg: [
      { id: "5", tittel: "Generalprøve: hele H2024 på 4 timer", vekt: 0, min: "S", tid: 250, spesial: "generalprove",
        hvorfor: "Ingen nye poeng, men du øver på tidsbruken og ser hvor du fortsatt mister poeng. H2024 er det siste settet med vanlig 4-timers format og summerer til 100 p.",
        kjerne: t(
          "Nå later du som det er eksamen. Sett på klokka, ta oppgavene i rekkefølge, og se hvor langt du kommer.",
          "<p>Løs hele H2024 i rekkefølge på 4 timer, med de samme hjelpemidlene du får på eksamen. Tidtakeren fordeler tiden etter poengene (2,4 minutter per poeng). Rett deg selv med løsningene i kortene etterpå, og merk hvert kort.</p>",
          "<p>Sammenlign tidsbruken med fordelingen i tabellen. Bruker du mye mer enn 2,4 minutter per poeng på ER, øv på å tegne raskere. Kortene du merker «Må øve mer», havner i repetisjonskøen.</p>"),
        les: [PDF],
        oppskrift: [
          "Skriv ut eksamensnotatene og legg fram papir.",
          "Start tidtakeren og ta oppgavene i rekkefølge.",
          "Går du over tiden på en oppgave, gå videre og kom tilbake.",
          "Rett deg selv etterpå og merk hvert kort «Fikk det til» eller «Må øve mer»."
        ],
        eksempel: [],
        oppgaver: [],
        sjekk: [],
        feller: ["Å se på løsningene underveis.", "Å bruke for lang tid på oppgave 1."] }
    ] }
  ];

  /* Generalprøven: H2024 i rekkefølge. kort = id i KORT (kortet står i et av stegene over). */
  var GENERALPROVE = {
    eksamen: "H2024",
    minutter: 240,
    rader: [
      { nr: "1.1", tittel: "ER-modell for et bibliotek", p: 11, kort: "H2024-1_1" },
      { nr: "1.2", tittel: "Les et ER-diagram (JA/NEI)", p: 5, kort: "H2024-1_2" },
      { nr: "1.3", tittel: "Realiser utleiebyrå-modellen", p: 12, kort: "H2024-1_3" },
      { nr: "2.1", tittel: "Hvor mange rader?", p: 12, kort: "H2024-2_1" },
      { nr: "2.2", tittel: "Turer raskere enn 40 km/t", p: 5, kort: "H2024-2_2" },
      { nr: "2.3", tittel: "Standardsjåfør for mer enn én buss", p: 5, kort: "H2024-2_3" },
      { nr: "2.4", tittel: "Skriv om UNION-spørringen", p: 5, kort: "H2024-2_4" },
      { nr: "2.5", tittel: "VIEW: turer uten standardsjåfør", p: 8, kort: "H2024-2_5" },
      { nr: "2.6", tittel: "Fyll tabellen overtid", p: 10, kort: "H2024-2_6" },
      { nr: "3.1", tittel: "Nøkkelattributter (JA/NEI)", p: 6, kort: "H2024-3_1" },
      { nr: "3.2", tittel: "Normalform per FD", p: 8, kort: "H2024-3_2" },
      { nr: "3.3", tittel: "Tapsfri dekomposisjon til BCNF", p: 13, kort: "H2024-3_3" }
    ]
  };

  IN.CRASH = {
    versjon: 1,
    terskel: 0.7,           // andel riktige i en sjekk som regnes som bestått
    lengder: LENGDER,
    kort: KORT,
    etapper: ETAPPER,
    generalprove: GENERALPROVE
  };

  /* ============================================================
     Fremdrift for løypa: IN.crashProgress(L?)
     Trenger bare core.js (IN.progress) og denne fila. Sjekkene leses via nøklene i registeret.
     ============================================================ */
  var C = IN.CRASH, RANK = { E: 0, S: 1, G: 2 }, LEN = Object.create(null), STEPS = [], BYID = Object.create(null);
  LENGDER.forEach(function (L) { LEN[L.id] = L; });
  ETAPPER.forEach(function (e) { e.steg.forEach(function (s) { s.etappe = e; STEPS.push(s); BYID[s.id] = s; }); });

  function allRecs() { return (IN.progress && IN.progress.all()) || {}; }
  function state() {
    var r = (IN.progress && IN.progress.get("crash:state")) || {};
    return { lengde: LEN[r.lengde] ? r.lengde : "S", sist: BYID[r.sist] ? r.sist : null };
  }
  function inLen(s, L) { return RANK[s.min] <= RANK[L]; }
  function stepsIn(L) { return STEPS.filter(function (s) { return inLen(s, L); }); }
  function minutes(s, L) { return (s.tid || 0) + (L === "G" ? (s.tidG || 0) : 0); }
  function ratio(rec) {
    if (!rec || !rec.max) return 0;
    return (rec.best != null ? rec.best : (rec.score || 0)) / rec.max;
  }
  function checkKey(s, i, c) { return c.type + ":crash:sjekk-" + s.id + "-" + i; }
  /* Nøkkelen kortet får i løypa, og den kortet har på emnesiden */
  function kortKey(k) { return KORT[k] ? "kort:crash:o-" + k : null; }
  function kortKeys(k) { var c = KORT[k]; return c ? ["kort:crash:o-" + k, "kort:" + c[0] + ":o-" + k] : []; }
  /* Den nyeste av postene for kortet (løypa eller emnesiden) bestemmer: {status, t} eller null */
  function kortRec(k, all) {
    var best = null;
    kortKeys(k).forEach(function (key) { var r = all[key]; if (r && (!best || (r.t || 0) > (best.t || 0))) best = r; });
    return best;
  }
  function kortStatus(rec) { return rec && rec.status ? rec.status : null; }
  function kortState(k, all) { return kortStatus(kortRec(k, all || allRecs())); }

  /* Status for ett steg: { done, queue, started, via, hvorfor } */
  function stepStatus(s, all) {
    var okT = 0, ovT = 0, started = false, via = null, ov = [];
    var self = all["crash:steg:" + s.id];
    if (self && self.status === "ok") { okT = self.t || 1; via = "egenvurdering"; }
    if (self && self.status === "ovmer") { ovT = self.t || 1; ov.push({ type: "steg", t: ovT }); }
    if (self && self.status) started = true;
    (s.sjekk || []).forEach(function (c, i) {
      var rec = all[checkKey(s, i, c)];
      if (!rec) return;
      started = true;
      if (ratio(rec) >= (c.terskel || C.terskel)) { okT = Math.max(okT, rec.t || 1); via = via || "sjekk"; }
    });
    var cards = (s.oppgaver || []).filter(function (k) { return KORT[k]; });
    var allOk = cards.length > 0, cardOkT = 0;
    cards.forEach(function (k) {
      var r = kortRec(k, all);
      if (kortStatus(r) === "ok") { cardOkT = Math.max(cardOkT, r.t || 1); started = true; }
      else allOk = false;
    });
    if (allOk) { okT = Math.max(okT, cardOkT); via = via || "kort"; }
    (s.oppgaver || []).concat(s.ekstra || []).forEach(function (k) {
      var r = kortRec(k, all);
      if (kortStatus(r) === "ovmer") { ovT = Math.max(ovT, r.t || 1); started = true; ov.push({ type: "kort", id: k, t: r.t || 1 }); }
    });
    var queue = ovT > okT;
    return { done: okT > 0, queue: queue, started: started, via: via,
      hvorfor: queue ? ov.filter(function (x) { return x.t > okT; }).map(function (x) { return x.id ? { type: x.type, id: x.id } : { type: x.type }; }) : [] };
  }
  function statusAll(L, all) {
    all = all || allRecs();
    var out = {};
    STEPS.forEach(function (s) { out[s.id] = stepStatus(s, all, L); });
    return out;
  }
  function fortsettTarget(L, st, sist) {
    if (sist && BYID[sist] && inLen(BYID[sist], L) && !st[sist].done) return sist;
    var list = stepsIn(L);
    for (var i = 0; i < list.length; i++) if (!st[list[i].id].done) return list[i].id;
    return null;
  }

  /* Sammendrag for valgt lengde (L, ellers crash:state.lengde, ellers "S").
     dekket/total er poeng (vekt). Etapper uten poeng (0 og 5): bruk ferdigeSteg/antallSteg. */
  IN.crashProgress = function (L) {
    var stt = state();
    L = LEN[L] ? L : stt.lengde;
    var st = statusAll(L), list = stepsIn(L);
    var total = 0, dekket = 0, ferdige = 0, alle100 = 0, tid = 0;
    STEPS.forEach(function (s) { if (st[s.id].done) alle100 += s.vekt; });
    list.forEach(function (s) {
      total += s.vekt; tid += minutes(s, L);
      if (st[s.id].done) { dekket += s.vekt; ferdige++; }
    });
    var f = fortsettTarget(L, st, stt.sist), fs = f ? BYID[f] : null;
    var ko = STEPS.filter(function (s) { return st[s.id].queue; })
      .sort(function (a, b) { return b.vekt - a.vekt; }).map(function (s) { return s.id; });
    var startet = !!stt.sist || STEPS.some(function (s) { return st[s.id].started || st[s.id].done; });
    var utenfor = STEPS.filter(function (s) { return !inLen(s, L) && st[s.id].done; }).length;
    return {
      lengde: L, lengdeNavn: LEN[L].navn, sist: stt.sist, startet: startet, ferdigeUtenfor: utenfor,
      dekket: dekket, total: total, prosent: total ? Math.round(100 * dekket / total) : 0,
      alle100: alle100,
      ferdigeSteg: ferdige, antallSteg: list.length, minutter: tid,
      fortsett: fs ? { id: fs.id, tittel: fs.tittel, etappe: fs.etappe.nr, etappeNavn: fs.etappe.navn, href: "crash.html#steg=" + fs.id } : null,
      etapper: ETAPPER.map(function (e) {
        var inL = e.steg.filter(function (s) { return inLen(s, L); }), d = 0, t2 = 0, n = 0;
        inL.forEach(function (s) { t2 += s.vekt; if (st[s.id].done) { d += s.vekt; n++; } });
        return { id: e.nr, tittel: e.navn, dekket: d, total: t2, ferdigeSteg: n, antallSteg: inL.length };
      }),
      ovmer: ko.length, ko: ko,
      status: st
    };
  };
  IN.crashProgress.state = state;
  IN.crashProgress.statusAll = statusAll;
  IN.crashProgress.fortsettTarget = fortsettTarget;
  IN.crashProgress.inLen = inLen;
  IN.crashProgress.stepsIn = stepsIn;
  IN.crashProgress.minutes = minutes;
  IN.crashProgress.ratio = ratio;
  IN.crashProgress.checkKey = checkKey;
  IN.crashProgress.kortKey = kortKey;
  IN.crashProgress.kortKeys = kortKeys;
  IN.crashProgress.kortRec = kortRec;
  IN.crashProgress.kortStatus = kortStatus;
  IN.crashProgress.kortState = kortState;
  IN.crashProgress.steps = STEPS;
  IN.crashProgress.byId = BYID;
})();
