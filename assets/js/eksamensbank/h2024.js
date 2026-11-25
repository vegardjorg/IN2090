/* IN2090 · eksamensbank H2024. Kilde: UiO, IN2090 eksamen H2024 (Inspera-utskrift) + databaseskjema
   + sensorveiledning (in2090h24_eksamen_sensur_corrected_3.pdf).
   Oppgavetekst og sensorveiledning ordrett. Våre svar (svar/hvorfor/losning/tips) med egne ord. */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var BANK = (window.IN_EXAM_BANK = window.IN_EXAM_BANK || {});
  IN.PERFEKT = IN.PERFEKT || {};

  var DELT_SENSOR_2X = "<p>I spørsmål 2.2 til 2.6 skal delvis korrekte løsninger markeres tilsvarende, med en ikke-full og ikke-null poeng.</p>";

  /* ---------------------------------------------------------------- skjema */
  var SKJEMA = {
    tittel: "Databaseskjema for eksamen IN2090H24 (busselskapet)",
    intro: "<p>Du har fått jobb som databaseekspert for et busselskap, hvor de har en database som inneholder informasjon om busser, bussjåfører, bussruter og bussturer. Databasen er laget med følgende SQL-script:</p>" +
      "<p>Under (på neste side) følger eksempler på hvordan tabellene <i>kan</i> se ut. Spørringene dine kan ikke anta at dataene ser slik ut, med mindre dette står i oppgaven. NULL er representert som blank/manglende verdi.</p>" +
      "<p><b>Fra oppgavearket:</b> Oppgavene i denne delen er om SQL. Alle oppgavene vil bruke det samme databaseskjemaet, og en beskrivelse av dette er vedlagt som PDF for hver oppgave.</p>" +
      "<p>Du må gjerne inkludere kommentarer i spørringene (gjøres med \"--\" i SQL). Dersom det er uklarheter eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar om hvilke antagelser og tolkinger du gjør.</p>" +
      "<p>Gitt et intervall I (altså en differanse mellom to tidspunkter) så kan du bruke funksjonen hours(I) for å hente ut antall timer (som et flyttall).</p>",
    tabeller: [
      { navn: "buss",
        beskrivelse: "Tabellen buss beskriver busser. Det inneholder en unik ID bid, unik buss nummer, ID til sjåføren som vanligvis kjører denne bussen standardsid, modellen til bussen, og samt en dato for sist bussen ble vedlikehold.",
        kolonner: [
          { navn: "bid", type: "int", pk: true },
          { navn: "nummer", type: "text", notNull: true },
          { navn: "standardsid", type: "int", fk: "sjafor(sid)" },
          { navn: "modell", type: "text" },
          { navn: "vedlikeholdt", type: "date" }
        ],
        unike: [["nummer"]],
        eksempel: { kolonner: ["bid", "nummer", "standardsid", "modell", "vedlikeholdt"], rader: [
          [1, "AE16070", 8, "Solaris", "2023-12-01"],
          [2, "AB12073", 1, "Solaris", "2023-12-02"],
          [3, "BB22110", 8, "Volvo", "2024-01-06"],
          [4, "DT41118", 7, "Mercedes", "2023-12-01"],
          [5, "LB25313", 7, "Mercedes", "2024-01-06"],
          [6, "FF33665", 2, null, null]
        ] } },
      { navn: "sjafor",
        beskrivelse: "Tabellen sjafor beskriver bussjåfører og inneholder en unik ID sid og hans/hennes navn.",
        kolonner: [
          { navn: "sid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true }
        ],
        eksempel: { kolonner: ["sid", "navn"], rader: [
          [1, "Alex"], [2, "Peter"], [3, "Vilde"], [4, "Sondre"],
          [5, "Ahmed A."], [6, "Alun"], [7, "Ahmed B."], [8, "Monika Amalia"]
        ] } },
      { navn: "rute",
        beskrivelse: "Tabellen rute beskriver buss ruter. Det inneholder en unik ID rid, rute nummer (som kan være ikke unik), rutes lengde i km, og samt startstopp og endestopp.",
        kolonner: [
          { navn: "rid", type: "int", pk: true },
          { navn: "nummer", type: "text", notNull: true },
          { navn: "lengde", type: "float", notNull: true, check: "lengde >= 0" },
          { navn: "startstopp", type: "text", notNull: true },
          { navn: "endestopp", type: "text", notNull: true }
        ],
        eksempel: { kolonner: ["rid", "nummer", "lengde", "startstopp", "endestopp"], rader: [
          [1, "13", 10.2, "Skog", "Teatret"],
          [2, "13", 10.1, "Teatret", "Skog"],
          [3, "13N", 17, "Skog", "Skog"],
          [4, "14", 5, "Trollhytta", "Nidarosgata"],
          [5, "14", 5, "Nidarosgata", "Trollhytta"],
          [6, "Ring", 7.2, "Kyrke", "Kyrke"]
        ] } },
      { navn: "busstur",
        beskrivelse: "Den siste tabellen busstur beskriver bussturer. Det inneholder referanser til buss-, sjafor- og rute ID-er, og samt starttidspunkt stidspunkt og endetidspunkt etidspunkt. ID-et til buss og starttidspunkt er en nøkkel.",
        kolonner: [
          { navn: "bid", type: "int", pk: true, fk: "buss(bid)" },
          { navn: "sid", type: "int", fk: "sjafor(sid)" },
          { navn: "rid", type: "int", fk: "rute(rid)" },
          { navn: "stidspunkt", type: "timestamp", pk: true, notNull: true },
          { navn: "etidspunkt", type: "timestamp", notNull: true }
        ],
        eksempel: { kolonner: ["bid", "sid", "rid", "stidspunkt", "etidspunkt"], rader: [
          [1, 1, 1, "2024-02-01 05:12:00", "2024-02-01 05:34:00"],
          [1, 1, 2, "2024-02-01 05:42:00", "2024-02-01 05:55:00"],
          [1, 1, 1, "2024-02-01 06:12:00", "2024-02-01 06:34:00"],
          [4, 7, 4, "2024-02-01 06:23:00", "2024-02-01 06:38:00"],
          [1, 1, 2, "2024-02-01 06:42:00", "2024-02-01 06:55:00"],
          [4, 7, 5, "2024-02-01 06:50:00", "2024-02-01 07:08:00"],
          [3, 8, 6, "2024-02-01 06:50:00", "2024-02-01 07:20:00"]
        ] } }
    ],
    merknad: "Kjente feil i skriptet: (1) busstur.sid er skrevet REFERENCES sjafor(did), men sjafor har ingen kolonne did. Her er det rettet til sjafor(sid). " +
      "(2) buss opprettes før sjafor, så REFERENCES sjafor(sid) ville feilet hvis skriptet ble kjørt i denne rekkefølgen. " +
      "(3) Eksempeltabellen for buss har overskriften «vedlikehold», mens kolonnen heter vedlikeholdt i skriptet. Her brukes vedlikeholdt. " +
      "(4) hours(I) og Year(.) er funksjoner oppgaven gir deg. De finnes ikke under de navnene i PostgreSQL, men på eksamen skal du bare bruke dem som oppgitt."
  };

  /* ---------------------------------------------------------------- ER-figurer fra arket */
  var ER_DATASPILL = {
    entiteter: [
      { id: "CET", navn: "Cet", svak: false, pos: [1, 0],
        attr: [ { navn: "XXX", nokkel: true }, { navn: "YYY", nokkel: true }, { navn: "ZZZ", flerverdi: true } ] },
      { id: "ALU", navn: "Alu", svak: false, pos: [0, 2], attr: [] },
      { id: "BOH", navn: "Boh", svak: true, pos: [2, 2],
        attr: [ { navn: "UUU", avledet: true }, { navn: "VVV", delvisNokkel: true } ] }
    ],
    relasjoner: [
      { id: "P", navn: "P", identifiserende: false, pos: [0, 1],
        ledd: [ { entitet: "CET", kard: "M", total: true }, { entitet: "ALU", kard: "1", total: true } ],
        attr: [ { navn: "WWW" } ] },
      { id: "R", navn: "R", identifiserende: false, pos: [1, 1.5],
        ledd: [ { entitet: "CET", kard: "K", total: true }, { entitet: "ALU", kard: "N", total: false },
                { entitet: "BOH", kard: "M", total: false } ],
        attr: [] },
      { id: "S", navn: "S", identifiserende: true, pos: [2, 1],
        ledd: [ { entitet: "CET", kard: "1", total: false }, { entitet: "BOH", kard: "1", total: true } ],
        attr: [] }
    ],
    merknad: "XXX og YYY er understreket hver for seg (to nøkler). ZZZ er dobbel oval (flerverdi). UUU er stiplet oval (avledet), VVV har stiplet understrek (svak nøkkel). Dobbel strek = total deltakelse."
  };

  var ER_UTLEIE = {
    entiteter: [
      { id: "LEIETAKER", navn: "Leietaker", svak: false, pos: [0, 1],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Tlfnr" }, { navn: "email", flerverdi: true } ] },
      { id: "EIENDOM", navn: "Eiendom", svak: false, pos: [2, 1],
        attr: [ { navn: "Adresse", nokkel: true, deler: [ { navn: "Postnummer" }, { navn: "By" }, { navn: "Linje1" }, { navn: "Linje2" } ] },
                { navn: "Pris" }, { navn: "NSoverom" } ] },
      { id: "AGENT", navn: "Agent", svak: false, pos: [1, 3],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Tlfnr" } ] },
      { id: "EIEREN", navn: "Eieren", svak: false, pos: [3, 3],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Tlfnr", flerverdi: true }, { navn: "Adresse", avledet: true } ] }
    ],
    relasjoner: [
      { id: "LEIE", navn: "Leie", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "LEIETAKER", kard: "1", total: false }, { entitet: "EIENDOM", kard: "1", total: false } ],
        attr: [ { navn: "Fra" } ] },
      { id: "VISNING", navn: "Visning", identifiserende: false, pos: [1, 2],
        ledd: [ { entitet: "LEIETAKER", kard: "M", total: false }, { entitet: "EIENDOM", kard: "N", total: false },
                { entitet: "AGENT", kard: "K", total: false } ],
        attr: [ { navn: "Dato" } ] },
      { id: "ADMINISTRERE", navn: "Administrere", identifiserende: false, pos: [2, 2.5],
        ledd: [ { entitet: "EIENDOM", kard: "1", total: true }, { entitet: "AGENT", kard: "M", total: false } ],
        attr: [] },
      { id: "EIE", navn: "Eie", identifiserende: false, pos: [3, 2],
        ledd: [ { entitet: "EIENDOM", kard: "1", total: true }, { entitet: "EIEREN", kard: "M", total: true } ],
        attr: [] }
    ],
    merknad: "Tallet står ved den entiteten det gjelder: «1» ved Eiendom i Administrere betyr at hver agent administrerer høyst én eiendom. Dobbel strek fra Eiendom til Administrere og Eie, og fra Eieren til Eie (total deltakelse)."
  };

  /* Vårt eget ER-svar til 1.1 */
  var ER_BIBLIOTEK_SVAR = {
    entiteter: [
      { id: "FORFATTER", navn: "FORFATTER", svak: false, pos: [0, 0],
        attr: [ { navn: "NavnFødt", nokkel: true, deler: [ { navn: "Navn" }, { navn: "Fødselsår" } ] }, { navn: "Dødsår" } ] },
      { id: "BOK", navn: "BOK", svak: true, pos: [0, 2],
        attr: [ { navn: "TittelUtgave", delvisNokkel: true, deler: [ { navn: "Tittel" }, { navn: "Utgave" } ] },
                { navn: "Utgivelsesår" }, { navn: "AntallSider" } ] },
      { id: "BOKHYLLE", navn: "BOKHYLLE", svak: false, pos: [2, 0],
        attr: [ { navn: "Plassering", nokkel: true, deler: [ { navn: "Romnavn" }, { navn: "Veggnummer" }, { navn: "Høyde" } ] },
                { navn: "Kapasitet" } ] },
      { id: "EKSEMPLAR", navn: "EKSEMPLAR", svak: false, pos: [2, 2],
        attr: [ { navn: "Biblioteksnummer", nokkel: true } ] },
      { id: "MEDLEM", navn: "MEDLEM", svak: false, pos: [4, 2],
        attr: [ { navn: "Navn", nokkel: true, deler: [ { navn: "Fornavn" }, { navn: "Etternavn" } ] },
                { navn: "Adresse" }, { navn: "Telefonnr", flerverdi: true } ] }
    ],
    relasjoner: [
      { id: "SKREVET_AV", navn: "SKREVET_AV", identifiserende: true, pos: [0, 1],
        ledd: [ { entitet: "BOK", kard: "N", total: true }, { entitet: "FORFATTER", kard: "1", total: true } ], attr: [] },
      { id: "DEDIKERT", navn: "DEDIKERT_TIL", identifiserende: false, pos: [1, 1],
        ledd: [ { entitet: "BOK", kard: "M", total: true }, { entitet: "BOKHYLLE", kard: "N", total: false } ], attr: [] },
      { id: "STAR_I", navn: "STÅR_I", identifiserende: false, pos: [2, 1],
        ledd: [ { entitet: "EKSEMPLAR", kard: "N", total: false }, { entitet: "BOKHYLLE", kard: "1", total: false } ], attr: [] },
      { id: "AV_BOK", navn: "EKSEMPLAR_AV", identifiserende: false, pos: [1, 2],
        ledd: [ { entitet: "BOK", kard: "1", total: true }, { entitet: "EKSEMPLAR", kard: "N", total: true } ], attr: [] },
      { id: "BEHOLDER", navn: "BEHOLDER", identifiserende: false, pos: [3, 1],
        ledd: [ { entitet: "EKSEMPLAR", kard: "1", total: false }, { entitet: "MEDLEM", kard: "1", total: false } ],
        attr: [ { navn: "FraDato" } ] },
      { id: "LANT_FOR", navn: "LÅNT_FØR", identifiserende: false, pos: [3, 2],
        ledd: [ { entitet: "EKSEMPLAR", kard: "N", total: false }, { entitet: "MEDLEM", kard: "M", total: false } ], attr: [] }
    ],
    merknad: "Antakelser: «året eller dødsfallet» i punkt 1 tolkes som dødsåret (kan være NULL). Navnet til medlemmet er en sammensatt nøkkel med fornavn og etternavn som enkle strenger. EKSEMPLAR er en vanlig entitet fordi biblioteksnummeret er unikt alene."
  };

  /* ================================================================ oppgaver */
  var OPPGAVER = [];

  /* ---------- 1.1 */
  OPPGAVER.push({
    key: "H2024-1.1", year: "H2024", oppgave_nr: "Oppgave 1.1", ark: "ER: Bibliotek", title: "ER-modell for et bibliotek",
    points: 11, block: "er",
    tema: ["svak entitet", "identifiserende relasjon", "sammensatt nøkkel", "flerverdiattributt", "1:1 med attributt", "total deltakelse"],
    ordrett: true,
    oppgave: "<p>Du blir ansatt av et bibliotek for å designe en database for dem, som skal inneholde informasjon om forfattere, bøker, bokeksemplarer, bokhyller og biblioteksmedlemmer. Databasen bør spesielt inneholde følgende informasjon:</p>" +
      "<ol>" +
      "<li>En forfatter identifiseres ved navn og fødselsår, og har også året eller dødsfallet (som muligens er NULL).</li>" +
      "<li>En bok er skrevet av én forfatter, og den identifiseres av tittelen, utgaven (som er et nummer) og forfatteren; den har i tillegg utgivelsesår og antall sider. Dermed kan ulike bøker ha samme tittel og utgave, og hver bok har én og kun én forfatter. Imidlertid kan hver forfatter ha en eller flere bøker skrevet av seg; spesielt antar vi at det ikke er noen forfattere i databasen uten bøkene deres.</li>" +
      "<li>Hver bokhylle identifiseres ved sin plassering, som består av romnavnet i biblioteket, veggnummeret og høyden, som også er et heltall. I tillegg har hver bokhylle kapasitet, som også er et tall.</li>" +
      "<li>Biblioteket har ett eller flere eksemplarer (dvs. forekomster) av hver bok med et unikt biblioteksnummer. Dermed antar vi at det ikke finnes bøker uten bokeksemplarer i biblioteksdatabasen (med andre ord er bøker uten eksemplarer irrelevante for bibliotekets formål).</li>" +
      "<li>Hvert bokeksemplar kan stå i en bokhylle. Det kan ikke være på flere hyller, men det trenger ikke stå på noen hylle, siden det kan lånes av medlemmer (se nedenfor).</li>" +
      "<li>Hver bok (ikke bokeksemplar) har også dedikerte en eller flere hyller – det vil si stedene hvor man bør lete etter eksemplar av denne boken. Merk at hver bokhylle i denne forstand kan være dedikert til et hvilket som helst antall bøker, inkludert ingen.</li>" +
      "<li>Et biblioteksmedlem identifiseres med et navn, som består av for- og etternavnet (begge er muligens sammensatte, men det er ikke nødvendig å modellere dette, fordi hver av de to er bare en streng); i tillegg har hvert medlem en adresse og flere (dvs. et hvilket som helst antall) telefonnumre.</li>" +
      "<li>Hvert biblioteksmedlem kan beholde maksimalt ett bokeksemplar, og omvendt kan hvert bokeksemplar beholdes av maksimalt ett medlem. Dessuten tilskrives beholde-forholdet fra datoen.</li>" +
      "<li>For arkivformål er hvert biblioteksmedlem i tillegg relatert til et hvilket som helst antall bokeksemplarer etter lånet-før relasjon; omvendt kan hver eksemplar være relatert til et hvilket som helst antall medlemer av denne relasjonen.</li>" +
      "</ol>" +
      "<p>Lag derfor en ER-modell som inneholder informasjonen over.</p>" +
      "<ul>" +
      "<li>I denne oppgaven skal du svare med digital håndtegning. Bruk eget skisseark (utdelt). Se instruksjon for utfylling av skisseark i lenken under oppgavelinjen.</li>" +
      "<li>Tegn og skriv tydelig.</li>" +
      "<li>Du må gjerne dele modellen opp i deler (f.eks. over flere sider), men sørg for at det fremkommer tydelig hvilke deler av modellen som besvarer hvilke deler av oppgaven.</li>" +
      "<li>Du må gjerne inkludere kommentarer i modellene. Dersom det er uklarheter eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar til modellene dine om hvilke antagelser og tolkninger du eventuelt gjør.</li>" +
      "</ul>",
    avvik: "Punkt 1 sier «året eller dødsfallet». Det må bety året for dødsfallet (dødsåret), så det er tolket slik i svaret vårt.",
    losning: [
      "Gå gjennom punktene ett for ett og tegn bit for bit. Skriv punktnummeret ved hver bit.",
      "Forfatter: vanlig entitet med en nøkkel satt sammen av navn og fødselsår, pluss dødsår.",
      "Bok: identifiseres av tittel, utgave og forfatter. Den trenger altså forfatteren for å bli unik, og blir derfor en svak entitet (dobbelt rektangel). Tittel og utgave er svak nøkkel (stiplet understrek). Den identifiserende relasjonen (dobbel rombe) har 1 ved forfatteren og total deltakelse på begge sider, siden alle forfattere har minst én bok.",
      "Bokhylle: nøkkelen plassering er et sammensatt attributt med romnavn, veggnummer og høyde. Kapasitet er et vanlig attributt.",
      "Eksemplar: egen entitet med biblioteksnummer som nøkkel. Relasjonen til bok er 1:N med total deltakelse på begge sider (alle bøker har eksemplar, alle eksemplar hører til en bok).",
      "Står i: eksemplar N til 1 bokhylle, partiell på begge sider. Dedikert til: M:N mellom bok og bokhylle, total for bok.",
      "Medlem: nøkkel navn, sammensatt av fornavn og etternavn. Adresse vanlig, telefonnummer flerverdi (dobbel oval).",
      "Beholder: 1:1 mellom medlem og eksemplar, partiell på begge sider, med relasjonsattributtet fra-dato. Lånt før: M:N, partiell på begge sider."
    ],
    tips: [
      "Svak entitet gir flest poeng her (3 av 11). Både det doble rektangelet, den doble romben og den stiplede understreken må være med.",
      "Kardinalitet og deltakelse skal stå på begge sider av hver relasjon. «En eller flere» betyr total deltakelse (dobbel strek), «kan» betyr partiell.",
      "Ikke gjør eksemplar til en svak entitet: biblioteksnummeret er unikt alene.",
      "Datoen i punkt 8 hører til relasjonen, ikke til medlem eller eksemplar.",
      "Skriv tolkningene dine som kommentarer. Sensor gir 0,5 poeng for delvis riktige punkter."
    ],
    del1: null
  });

  /* ---------- 1.2 */
  OPPGAVER.push({
    key: "H2024-1.2", year: "H2024", oppgave_nr: "Oppgave 1.2", ark: "ER: Dataspill", title: "Les et ER-diagram (JA/NEI)",
    points: 5, block: "er",
    tema: ["lese ER", "total deltakelse", "svak entitet", "ternær relasjon", "nøkkel"],
    ordrett: true,
    oppgave: "<p>Du blir kontaktet av et team av dataspilldesignere, som utvikler et spill med et rikt fiksjonsunivers. De er i ferd med å designe en database for spillet sitt og startet med et ER-diagram (se hovedillustrasjon). Entitetene og relasjonene er fra deres univers, så det er ikke overraskende at de ikke gir mening for deg.</p>" +
      "<p>Du kan imidlertid hjelpe teamet ved å sjekke om følgende påstander er sanne eller usanne for diagrammet deres. Kryss av “JA” dersom du mener setningen er modellert av ER-diagrammet, og “NEI” hvis ikke.</p>" +
      "<p>Hvert riktig svar gir 1 poeng, hvert uriktige svar gir -1 poeng, og hvert ubesvart gir 0 poeng. Total poengsum for hele oppgaven vil ikke være lavere enn 0.</p>",
    avvik: null,
    losning: [
      "Les av diagrammet først: Cet har to nøkler (XXX og YYY, understreket hver for seg) og flerverdiattributtet ZZZ. Boh er svak entitet med svak nøkkel VVV og avledet attributt UUU, og eies av Cet gjennom den identifiserende relasjonen S.",
      "Dobbel strek betyr total deltakelse: Cet er total i P og i R, Alu er total i P, og Boh er total i S.",
      "Ta deretter påstandene én om gangen og se etter akkurat den streken eller markeringen påstanden handler om."
    ],
    tips: [
      "Med −1 for galt svar lønner det seg ikke å gjette. La være å svare hvis du er usikker.",
      "En relasjonsattributt (som WWW på P) hører til hvert par i relasjonen. Den blir bare «en egenskap ved Alu» hvis hver Alu kan være med i høyst ett par.",
      "Følg kjeden av total deltakelse: en svak entitet krever en eier, og eieren kan igjen kreve noe annet."
    ],
    del1: {
      type: "janei",
      regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
      intro: "<p>Er setningen modellert av ER-diagrammet?</p>",
      items: [
        { s: "Hver Cet har minst en Alu R-relatert til det.", answer: true,
          explain: "<p>Streken fra Cet til R er dobbel, så hver Cet er med i minst én R-forekomst. Hver slik forekomst består av en Cet, en Alu og en Boh, så Cet-en har da minst én Alu R-relatert til seg. (Sensor: påstand 4, JA.)</p>" },
        { s: "Alu har en attributt WWW (via relasjon P).", answer: false,
          explain: "<p>WWW sitter på relasjonen P. Tallet M ved Cet betyr at én Alu kan være knyttet til mange Cet gjennom P, og hvert av disse parene har sin egen WWW-verdi. En Alu har altså ikke én bestemt WWW-verdi. Hadde det stått 1 ved Cet, kunne WWW vært flyttet over til Alu. (Sensor: påstand 2, NEI.)</p>" },
        { s: "Dersom det finnes en Boh i databasen, vil det også finnes en Alu.", answer: true,
          explain: "<p>Boh er svak og må ha en eier-Cet gjennom S. Cet har total deltakelse i P (og i R), så den Cet-en må være knyttet til en Alu. Altså finnes det en Alu. (Sensor: påstand 5, JA.)</p>" },
        { s: "Boh har en nøkkel eller svak nøkkel.", answer: true,
          explain: "<p>VVV har stiplet understrek, som er kursets markering for svak (delvis) nøkkel. (Sensor: påstand 1, JA.)</p>" },
        { s: "En Cet er unikt identifisert med dens XXX, YYY and ZZZ verdier (sammen).", answer: true,
          explain: "<p>XXX er understreket og er alene en nøkkel. Da er også XXX, YYY og ZZZ sammen nok til å skille alle Cet fra hverandre (det er en supernøkkel). Påstanden sier ikke at kombinasjonen er minimal. (Sensor: påstand 3, JA.)</p>" }
      ]
    }
  });

  /* ---------- 1.3 */
  OPPGAVER.push({
    key: "H2024-1.3", year: "H2024", oppgave_nr: "Oppgave 1.3", ark: "ER: Realisering", title: "Realiser utleiebyrå-modellen",
    points: 12, block: "realisering",
    tema: ["realisering", "1:1 som egen relasjon", "1:N", "ternær relasjon", "flerverdiattributt", "sammensatt nøkkel", "avledet attributt"],
    ordrett: true,
    oppgave: "<p>Realiser modellen i hovedillustrasjon til et relasjonelt databaseskjema.</p>" +
      "<p>Det resulterende databaseskjemaet skal være korrekt (samsvare med modellen), effektivt (unngå overflødige tabeller og kolonner med mange `NULL`-verdier), og tydelig (bør være lett å forstå). Bruk algoritmen for realisering for å lage et slikt skjema, og forklar eventuelle valg du tar underveis. For hver relasjon, oppgi relasjonens navn, og navnet til hvert attributt. Du trenger ikke oppgi datatyper for attributtene, og du skal ikke bruke SQL i denne oppgaven. Gjør det tydelig hvilke attributter som utgjør kandidatnøkler og fremmenøkler. Dersom det er flere kandidatnøkler, marker også valgt primærnøkkel. Bruk piler for å markere fremmednøkler (f.eks. \"T(A) -&gt; S(B)\" for å uttrykke at relasjon T sin attributt A er en fremmednøkkel som peker på relasjon S sin B attributt).</p>" +
      "<p>Om du ønsker å ha bilde større eller i en egen tab, høyreklikk på bildet og velg \"Se bildet/View Image\".</p>",
    avvik: null,
    losning: [
      "Vanlige entiteter først: Leietaker, Agent, Eiendom og Eieren får hver sin relasjon. Den sammensatte nøkkelen Adresse blir de fire bladattributtene Postnummer, By, Linje1 og Linje2. Den avledede Adresse hos Eieren tas ikke med.",
      "Leie (1:1, partiell på begge sider): en egen relasjon unngår NULL-verdier. Begge FN-ene blir kandidatnøkler, og én velges som PN.",
      "Eie (1:N): hver eier eier nøyaktig én eiendom (1 og total deltakelse), så FN legges rett i Eieren uten NULL-verdier.",
      "Administrere (1:N): hver agent har høyst én eiendom, men ikke alle agenter har en. En egen relasjon med agenten som nøkkel unngår NULL i Agent.",
      "Visning (ternær, M/N/K): egen relasjon der FN-ene til alle tre entitetene til sammen er nøkkelen. Dato blir et vanlig attributt.",
      "Flerverdiattributtene email (Leietaker) og Tlfnr (Eieren) får hver sin relasjon der alle attributtene er nøkkel."
    ],
    tips: [
      "Forklar hvert valg (FN i en tabell eller egen relasjon). Sensor trekker 0,5 for hver manglende forklaring.",
      "Les kardinaliteten nøye: tallet ved en entitet sier hvor mange av den entiteten den andre siden kan knyttes til.",
      "Relasjonsattributter som Fra og Dato blir aldri en del av nøkkelen.",
      "Når en relasjon har flere kandidatnøkler (Leie), skal du også markere hvilken som er primærnøkkel."
    ],
    del1: null
  });

  /* ---------- 2.1 */
  var RADVALG = ["<2", "2", "3", "4", "5", ">5"];
  OPPGAVER.push({
    key: "H2024-2.1", year: "H2024", oppgave_nr: "Oppgave 2.1", ark: "SQL: Flervalg", title: "Hvor mange rader? (6 spørringer)",
    points: 12, block: "sql-videre",
    tema: ["NATURAL JOIN", "FULL JOIN", "UNION", "NULL", "GROUP BY", "LIMIT/OFFSET", "NOT EXISTS"],
    ordrett: true,
    oppgave: "<p>Anta at databasen inneholder nøyaktig de dataene som er vist i eksempel-dataene i den vedlagte PDFen. For hver spørring under, oppgi hvor mange rader det er i resultatet. Hvert riktig svar gir 2 poeng, mens hvert uriktige svar gir -0.5 poeng. Blankt svar/ubesvart gir 0 poeng. Laveste poengsum på hele oppgaven er 0.</p>" +
      "<p>Merk at funksjonen Year(.) henter ut året fra en dato.</p>",
    avvik: "Sensor godtok både 4 og 5 rader på spørring 4. Vi regner oss fram til 4 og bruker det som fasit her. Arket bruker typografiske anførselstegn (‘Mercedes’), som vi tolker som vanlige fnutter.",
    losning: [
      "Kjør hver spørring for hånd på eksempeldataene, linje for linje.",
      "Sjekk hvilke kolonner NATURAL JOIN faktisk joiner på, hva FULL JOIN legger til, at UNION fjerner duplikater, og at sammenligning med NULL ikke slipper raden gjennom WHERE.",
      "Ved GROUP BY: tell gruppene først, sorter, og bruk så OFFSET (hopp over) før LIMIT (maks antall)."
    ],
    tips: [
      "Med +2/−0,5 lønner det seg å svare selv om du er litt usikker.",
      "Skriv ned mellomresultatet (for eksempel gruppene med antall) på kladdepapir. Det er lett å telle feil i hodet.",
      "Uten DISTINCT blir duplikater stående i SELECT-resultatet."
    ],
    del1: {
      type: "radantall",
      regel: { riktig: 2, feil: -0.5, blankt: 0, min: 0 },
      intro: "<p>Hvor mange rader vil spørringen returnere?</p>",
      items: [
        { q: "<p>Hvor mange rader vil spørringen returnere?</p>",
          sql: "SELECT nummer\nFROM rute\nWHERE lengde >= 3;",
          options: RADVALG, answer: 5,
          explain: "<p>Alle seks rutene er minst 3 km lange (den korteste er 5 km). Det står ingen DISTINCT, så de like rutenumrene (13, 13, 14, 14) blir stående. Resultatet har 6 rader, altså «&gt;5».</p>" },
        { q: "<p>Hvor mange rader vil spørringen returnere?</p>",
          sql: "SELECT DISTINCT sid, rid\nFROM sjafor NATURAL JOIN busstur\n            NATURAL JOIN rute\nWHERE bid = 3;",
          options: RADVALG, answer: 0,
          explain: "<p>sjafor og busstur har bare sid felles, og busstur og rute har bare rid felles, så de naturlige joinene blir vanlige joiner. Buss 3 har én tur (sjåfør 8, rute 6). Resultatet er 1 rad, altså «&lt;2».</p>" },
        { q: "<p>Hvor mange rader vil spørringen returnere?</p>",
          sql: "SELECT navn\nFROM buss FULL JOIN sjafor\n          ON (standardsid = sid);",
          options: RADVALG, answer: 5,
          explain: "<p>Alle seks bussene har en standardsjåfør som finnes (8, 1, 8, 7, 7, 2), og det gir 6 rader. FULL JOIN tar i tillegg med sjåførene som ikke er standardsjåfør for noen buss (3, 4, 5 og 6), med NULL i busskolonnene. Til sammen 10 rader, altså «&gt;5».</p>" },
        { q: "<p>Hvor mange rader vil spørringen returnere?</p>",
          sql: "SELECT bid\nFROM buss\nWHERE modell = 'Mercedes'\nUNION\nSELECT bid\nFROM buss\nWHERE Year(vedlikeholdt) < 2024;",
          options: RADVALG, answer: 3, godta: [4],
          explain: "<p>Mercedes gir buss 4 og 5. Vedlikeholdt før 2024 gir buss 1, 2 og 4. Buss 6 har NULL, og sammenligningen gir NULL (ukjent), så den kommer ikke med. UNION fjerner den doble 4-eren: {1, 2, 4, 5}, altså 4 rader. Sensor godtok også svaret 5.</p>" },
        { q: "<p>Hvor mange rader vil spørringen returnere?</p>",
          sql: "SELECT count(*) AS c\nFROM busstur\nGROUP BY sid\nORDER BY c\nLIMIT 3\nOFFSET 2;",
          options: RADVALG, answer: 0,
          explain: "<p>Det er tre grupper: sjåfør 1 med 4 turer, sjåfør 7 med 2 og sjåfør 8 med 1. Sortert blir det 1, 2, 4. OFFSET 2 hopper over de to første, så bare én rad (4) er igjen. LIMIT 3 er bare en øvre grense. Resultatet er 1 rad, altså «&lt;2».</p>" },
        { q: "<p>Hvor mange rader vil spørringen returnere?</p>",
          sql: "SELECT *\nFROM busstur AS t1\nWHERE NOT EXISTS (\nSELECT *\nFROM busstur AS t2\nWHERE t1.rid= t2.rid AND\n      t1.stidspunkt < t2.stidspunkt\n);",
          options: RADVALG, answer: 4,
          explain: "<p>En tur blir med hvis ingen tur på samme rute starter senere, altså den siste turen på hver rute. Rute 1 og 2 har to turer hver (bare den siste teller), og rute 4, 5 og 6 har én tur hver. Rute 3 har ingen turer. Det gir 2 + 3 = 5 rader.</p>" }
      ]
    }
  });

  /* ---------- 2.2 */
  OPPGAVER.push({
    key: "H2024-2.2", year: "H2024", oppgave_nr: "Oppgave 2.2", ark: "SQL: Raske bussturer", title: "Turer raskere enn 40 km/t",
    points: 5, block: "sql",
    tema: ["JOIN", "aritmetikk i WHERE", "intervall", "hours()"],
    ordrett: true,
    oppgave: "<p>Skriv en spørring som finner id-er til alle turer der bussen kjørte med høyere hastighet enn 40 km/t.</p>",
    avvik: "busstur har ingen egen tur-ID. Nøkkelen er (bid, stidspunkt), og sensor godtar flere varianter av «id-er».",
    losning: [
      "Farten er rutens lengde (km) delt på turens varighet (timer). Lengden står i rute og varigheten i busstur, så de to tabellene joines på rid.",
      "Varigheten er etidspunkt − stidspunkt (slutt minus start). hours(...) gjør intervallet om til timer.",
      "Velg nøkkelen til turen (bid, stidspunkt). Ta gjerne med sid og rid i tillegg.",
      "På eksempeldataene gir dette 2 turer: de to turene på rute 2 (10,1 km på 13 minutter, omtrent 47 km/t)."
    ],
    tips: [
      "Trekk starten fra slutten, ellers blir varigheten negativ og ingen turer kommer med.",
      "Ved å gange i stedet for å dele (lengde > 40 * timer) slipper du deling på null hvis en tur har varighet 0.",
      "Skriv en kommentar om hva du regner som «id-en» til en tur."
    ],
    del1: null
  });

  /* ---------- 2.3 */
  OPPGAVER.push({
    key: "H2024-2.3", year: "H2024", oppgave_nr: "Oppgave 2.3", ark: "SQL: Multi standard drivere", title: "Standardsjåfør for mer enn én buss",
    points: 5, block: "sql-videre",
    tema: ["GROUP BY", "HAVING", "count", "IN-delspørring"],
    ordrett: true,
    oppgave: "<p>Skriv en spørring som viser navnene på alle sjåfører som er standardsjåfører for mer enn én buss.</p>",
    avvik: null,
    losning: [
      "Knytt hver buss til standardsjåføren sin (buss.standardsid = sjafor.sid).",
      "Grupper per sjåfør og behold bare gruppene med mer enn én buss (HAVING count(*) > 1).",
      "Grupper på sid og ikke bare på navn, slik at to sjåfører med samme navn ikke slås sammen.",
      "Eksempeldataene gir Ahmed B. (buss 4 og 5) og Monika Amalia (buss 1 og 3)."
    ],
    tips: [
      "Betingelser på aggregater hører hjemme i HAVING, ikke i WHERE (sensor trekker vanligvis 2 poeng for det).",
      "En alternativ løsning er sid IN (delspørring med GROUP BY standardsid HAVING count(*) > 1)."
    ],
    del1: null
  });

  /* ---------- 2.4 */
  OPPGAVER.push({
    key: "H2024-2.4", year: "H2024", oppgave_nr: "Oppgave 2.4", ark: "SQL: Busser å vedlikeholde", title: "Skriv om UNION-spørringen uten UNION",
    points: 5, block: "sql",
    tema: ["ekvivalens", "OR", "DISTINCT", "UNION", "NULL"],
    ordrett: true,
    oppgave: "<p>La to spørringer være likeverdige hvis de gir nøyaktig samme svar på alle databaseforekomster. Skriv en spørring som tilsvarer spørring 2.1.4, men som verken bruker UNION eller UNION ALL.</p>" +
      "<p>For din referanse: spørring 2.1.4 er</p>" +
      "<pre>SELECT bid\nFROM buss\nWHERE modell = ‘Mercedes’\nUNION\nSELECT bid\nFROM buss\nWHERE Year(vedlikeholdt) &lt; 2024;</pre>",
    avvik: null,
    losning: [
      "Begge delspørringene leser fra samme tabell, så unionen kan skrives som én spørring der de to betingelsene er slått sammen med OR.",
      "UNION fjerner duplikater. Med DISTINCT er du sikker på at det samme skjer her. Siden bid er primærnøkkel, kan ikke samme bid komme to ganger fra én tabell uansett, men DISTINCT skader ikke.",
      "NULL oppfører seg likt: en buss med NULL i begge kolonnene kommer verken med i unionen eller med OR."
    ],
    tips: [
      "Bruk OR, ikke AND. AND gir bare bussene som oppfyller begge kravene.",
      "Når oppgaven ber om en likeverdig spørring, bør du tenke over duplikater og NULL og skrive en kort kommentar om det."
    ],
    del1: null
  });

  /* ---------- 2.5 */
  OPPGAVER.push({
    key: "H2024-2.5", year: "H2024", oppgave_nr: "Oppgave 2.5", ark: "SQL: Turer uten standardsjåfører", title: "VIEW: turer der sjåføren ikke var standardsjåfør",
    points: 8, block: "sql-videre",
    tema: ["CREATE VIEW", "JOIN", "!=", "NULL"],
    ordrett: true,
    oppgave: "<p>Skriv en SQL-kommando som lager en VIEW av alle turer der sjåføren ikke var standardsjåfør for bussen.</p>",
    avvik: null,
    losning: [
      "Hver tur (busstur) joines med bussen sin (buss) på bid, slik at turens sjåfør og bussens standardsjåfør står på samme rad.",
      "Behold radene der de to er forskjellige.",
      "Tenk på NULL: har bussen ingen standardsjåfør (standardsid er NULL), gir sid != standardsid NULL (ukjent), og turen forsvinner. Vi tolker en slik tur som «ikke standardsjåfør» og tar den med med en egen IS NULL-test.",
      "Pakk spørringen inn i CREATE VIEW navn AS. På eksempeldataene gir viewet de 4 turene med buss 1, der sjåfør 1 kjører en buss som har sjåfør 8 som standardsjåfør."
    ],
    tips: [
      "Glemmer du CREATE VIEW, mister du mye av poengsummen. Selve kommandoen er det oppgaven spør om.",
      "Velg kolonnene eksplisitt eller bruk USING (bid). Da unngår du to kolonner med navnet bid i viewet.",
      "Skriv en kommentar om hvordan du behandler busser uten standardsjåfør."
    ],
    del1: null
  });

  /* ---------- 2.6 */
  OPPGAVER.push({
    key: "H2024-2.6", year: "H2024", oppgave_nr: "Oppgave 2.6", ark: "SQL: Overtid betaling", title: "Fyll tabellen overtid for oktober 2024",
    points: 10, block: "sql-videre",
    tema: ["WITH", "INSERT … SELECT", "GROUP BY i to nivåer", "dato fra timestamp", "sum"],
    ordrett: true,
    oppgave: "<p>La en sjåfør jobbe overtid en bestemt dag hvis de kjører mer enn 6 timer (på turer). La de få utbetalt 1000 kroner i timen for overtidsarbeid (og brøkbetaling er mulig – det vil si at hvis man kjører 7 timer og 12 minutter en dag, får de 1200 kroner ekstra for denne dagen). Skriv en SQL-kommando eller en sekvens av SQL-kommandoer som fyller ut følgende tabell over overtidsbetalingen til hver sjåfør som jobbet overtid i oktober 2024.</p>" +
      "<pre>CREATE TABLE overtid (\nsid int REFERENCES sjafor(sid),\nnavn text REFERENCES sjafor(navn),\nbetaling float CHECK (betaling &gt; 0)\n);</pre>",
    avvik: "navn text REFERENCES sjafor(navn) er ikke gyldig i PostgreSQL, fordi sjafor.navn ikke er UNIQUE. Vi antar at tabellen finnes og bare skal fylles.",
    losning: [
      "Trinn 1 (WITH): regn ut hvor mange timer hver sjåfør kjørte hver dag i oktober 2024. Grupper på sjåfør og dato, og summer varigheten av turene.",
      "Trinn 2: behold dagene med mer enn 6 timer. Overtiden den dagen er timer − 6.",
      "Trinn 3: summer overtiden per sjåfør over hele måneden, gang med 1000, og hent navnet fra sjafor.",
      "Trinn 4: INSERT INTO overtid (sid, navn, betaling) med denne SELECT-en. Bare sjåfører med overtid kommer med, så CHECK (betaling > 0) holder.",
      "Avgrens oktober med stidspunkt >= '2024-10-01' AND stidspunkt < '2024-11-01'. Da kommer 31. oktober med."
    ],
    tips: [
      "Overtid regnes per dag. Summerer du hele måneden først og trekker fra 6 én gang, blir svaret feil.",
      "Skriv antakelser som kommentarer, for eksempel at en tur over midnatt regnes til dagen den startet.",
      "Sensor sier at dette er en vanskelig oppgave og at alt rimelig skal gi en stor del av poengene. Skriv derfor alltid noe, gjerne trinnvis med WITH."
    ],
    del1: null
  });

  /* ---------- 3.1 */
  OPPGAVER.push({
    key: "H2024-3.1", year: "H2024", oppgave_nr: "Oppgave 3.1", ark: "RND: Nøkler", title: "Nøkkelattributter (JA/NEI)",
    points: 6, block: "fd",
    tema: ["kandidatnøkkel", "nøkkelattributt", "tillukning"],
    ordrett: true,
    oppgave: "<p>Gitt relasjon</p><p>R(A, B, C, D, E, F)</p><p>med FDer</p>" +
      "<ol><li>AC → CE</li><li>B → F</li><li>D → B</li><li>DE → A</li></ol>" +
      "<p>Angi for hvert attributt hvorvidt det er et nøkkelattributt (JA) eller ikke (NEI). Hvert riktige svar gir 1 poeng, mens hvert gale svar gir -1 poeng. Ubesvart gir alltid 0 poeng. Laveste poengsum for hele oppgaven er 0.</p>",
    avvik: null,
    losning: [
      "C og D står aldri på en høyreside (C står bare trivielt i AC → CE). De er derfor med i alle kandidatnøkler.",
      "CD⁺ = {C, D, B, F}. A og E mangler, så CD er ikke nok.",
      "ACD⁺: AC → CE gir E, og D → B, B → F gir resten. Det er alt, så ACD er kandidatnøkkel.",
      "CDE⁺: DE → A gir A, og så resten. Det er alt, så CDE er kandidatnøkkel.",
      "B og F kan aldri gjøre CD til en nøkkel (CDB⁺ = CDF⁺ = {B, C, D, F}). Kandidatnøklene er altså ACD og CDE. Nøkkelattributtene er A, C, D og E, mens B og F ikke er nøkkelattributter."
    ],
    tips: [
      "Et nøkkelattributt er med i minst én kandidatnøkkel, ikke nødvendigvis i alle.",
      "Start med attributtene som aldri står på en høyreside, og utvid derfra.",
      "Med −1 for galt svar bør du regne ut tillukningene i stedet for å gjette."
    ],
    del1: {
      type: "janei",
      regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
      intro: "<p>Er attributtet et nøkkelattributt i R?</p>",
      items: [
        { s: "E", answer: true, explain: "<p>E er med i kandidatnøkkelen CDE (CDE⁺ = R fordi DE → A).</p>" },
        { s: "F", answer: false, explain: "<p>F står bare på høyresider (B → F). Det kan da ikke være med i noen minimal nøkkel.</p>" },
        { s: "B", answer: false, explain: "<p>B bestemmes av D, som er med i alle nøkler. Tar du med B i en nøkkel, blir den ikke minimal.</p>" },
        { s: "C", answer: true, explain: "<p>C står aldri (ikke-trivielt) på en høyreside og er derfor med i alle kandidatnøkler.</p>" },
        { s: "D", answer: true, explain: "<p>D står aldri på en høyreside og er derfor med i alle kandidatnøkler.</p>" },
        { s: "A", answer: true, explain: "<p>A er med i kandidatnøkkelen ACD (ACD⁺ = R fordi AC → E).</p>" }
      ]
    }
  });

  /* ---------- 3.2 */
  var NF = ["1NF", "2NF", "3NF", "BCNF"];
  OPPGAVER.push({
    key: "H2024-3.2", year: "H2024", oppgave_nr: "Oppgave 3.2", ark: "RND: Funksjonelle avhengigheter", title: "Normalform per FD",
    points: 8, block: "normalisering",
    tema: ["normalform", "BCNF", "3NF", "2NF", "nøkkelattributt"],
    ordrett: true,
    oppgave: "<p>Gitt relasjon</p><p>R(A, B, C, D, E, F)</p>" +
      "<p>med to kandidatnøkklene ACE og BCE. For hver av FDene under, anta at FDen gjelder for relasjonen R over, og bruk algoritmen for å finne normalform til å avgjøre hvilken normalform FDen (alene) tilsier at R er på.</p>" +
      "<p>Hvert riktige svar gir 2 poeng, hvert uriktige svar gir -0.5 poeng, ubesvart gir 0 poeng, men total poengsum på hele oppgaven vil ikke bli lavere enn 0.</p>",
    avvik: "Arket viser kolonnene i rekkefølgen 2NF, 3NF, 1NF, BCNF. Her står de i stigende rekkefølge.",
    losning: [
      "Nøkkelattributtene er A, B, C og E (med i ACE eller BCE). D og F er ikke nøkkelattributter.",
      "For hver FD X → A: (1) Er X en supernøkkel? Da er FD-en på BCNF. (2) Ellers: er A et nøkkelattributt? Da er den på 3NF. (3) Ellers: er X en ekte del av en kandidatnøkkel? Da brytes 2NF, og svaret er 1NF. Hvis ikke, er svaret 2NF."
    ],
    tips: [
      "Sjekk først om venstresiden inneholder en hel kandidatnøkkel. Det avgjør BCNF med én gang.",
      "2NF handler bare om ikke-nøkkelattributter som avhenger av en ekte del av en kandidatnøkkel.",
      "Med +2/−0,5 lønner det seg å svare."
    ],
    del1: {
      type: "normalform",
      regel: { riktig: 2, feil: -0.5, blankt: 0, min: 0 },
      intro: "<p>Hvilken normal form er FDen (alene) i?</p>",
      items: [
        { q: "<p>DE → F</p>", options: NF, answer: 1,
          explain: "<p>DE er ikke en supernøkkel (C mangler, for eksempel). F er ikke et nøkkelattributt, så 3NF brytes. D er ikke med i noen kandidatnøkkel, så DE er ikke en del av en nøkkel, og 2NF holder. Svaret er 2NF.</p>" },
        { q: "<p>ACE → B</p>", options: NF, answer: 3,
          explain: "<p>ACE er en kandidatnøkkel og dermed en supernøkkel. Svaret er BCNF.</p>" },
        { q: "<p>B → A</p>", options: NF, answer: 2,
          explain: "<p>B er ikke en supernøkkel, så BCNF brytes. A er et nøkkelattributt (med i ACE), så 3NF holder. Svaret er 3NF.</p>" },
        { q: "<p>B → D</p>", options: NF, answer: 0,
          explain: "<p>B er ikke en supernøkkel, og D er ikke et nøkkelattributt. B er en ekte del av kandidatnøkkelen BCE, så D avhenger av en del av en nøkkel. Da brytes 2NF, og svaret er 1NF.</p>" }
      ]
    }
  });

  /* ---------- 3.3 */
  OPPGAVER.push({
    key: "H2024-3.3", year: "H2024", oppgave_nr: "Oppgave 3.3", ark: "RND: Tapsfri dekomposisjon", title: "Tapsfri dekomposisjon til BCNF",
    points: 13, block: "normalisering",
    tema: ["BCNF-algoritmen", "tillukning", "tapsfri dekomposisjon", "kandidatnøkler"],
    ordrett: true,
    oppgave: "<p>Gitt relasjonen R(A, B, C, D, E, F) med kandidatnøkkelen ACE, samt følgende funksjonelle avhengigheter:</p>" +
      "<ol><li>A → B</li><li>A → D</li><li>CE → F</li><li>EF → B</li></ol>" +
      "<p>Dekomponer R tapsfritt til BCNF. Vis stegene du gjør og list opp kandidatnøkler og funksjonelle avhengigheter på alle relasjonene underveis.</p>",
    avvik: null,
    losning: [
      "Finn en FD som bryter BCNF: A → B (A er ikke en supernøkkel).",
      "Regn ut A⁺ = {A, B, D}. Del R i S₁(A, B, D) og S₂(A, C, E, F), der S₂ er A pluss det som ikke er i A⁺.",
      "S₁ har FD-ene A → B og A → D og kandidatnøkkelen A. Den er på BCNF.",
      "S₂ har bare FD-en CE → F (EF → B forsvinner fordi B ikke er med) og kandidatnøkkelen ACE. CE er ikke en supernøkkel, så S₂ må deles videre.",
      "CE⁺ i S₂ = {C, E, F}. Det gir S₂₁(C, E, F) med nøkkel CE og FD-en CE → F (BCNF), og S₂₂(A, C, E) med nøkkel ACE og ingen ikke-trivielle FD-er (BCNF).",
      "Resultatet er S₁(A, B, D), S₂₁(C, E, F) og S₂₂(A, C, E). Hvert steg er tapsfritt fordi fellesattributtene bestemmer hele den ene delen (Fagins teorem)."
    ],
    tips: [
      "For hver ny relasjon: skriv opp kandidatnøkler og FD-er. Hver manglende eller gal FD eller nøkkel gir −1, og manglende forklaring gir −3.",
      "Du kan også starte med CE → F. Da er CE⁺ = {B, C, E, F} i R, og du havner på en annen, men like riktig, dekomposisjon. Bare vis tillukningene riktig.",
      "Ta bare med FD-er der alle attributtene finnes i delrelasjonen (eller som følger av de opprinnelige FD-ene)."
    ],
    del1: null
  });

  /* ================================================================ PERFEKT */

  IN.PERFEKT["H2024-1.1"] = {
    type: "skjonn",
    svar: [
      { del: "", tekst: "<p>ER-modellen er vist som figur. Kommentarer på arket: «året eller dødsfallet» tolkes som dødsår (kan være NULL). Eksemplar er en vanlig entitet fordi biblioteksnummeret er unikt.</p>" +
          "<ul>" +
          "<li><b>Punkt 1:</b> FORFATTER med sammensatt nøkkel (Navn, Fødselsår) og attributtet Dødsår.</li>" +
          "<li><b>Punkt 2:</b> BOK som svak entitet med svak nøkkel (Tittel, Utgave) og attributtene Utgivelsesår og AntallSider. Identifiserende relasjon SKREVET_AV: 1 ved FORFATTER, N ved BOK, total deltakelse for begge.</li>" +
          "<li><b>Punkt 3:</b> BOKHYLLE med sammensatt nøkkel Plassering (Romnavn, Veggnummer, Høyde) og attributtet Kapasitet.</li>" +
          "<li><b>Punkt 4:</b> EKSEMPLAR med nøkkel Biblioteksnummer. EKSEMPLAR_AV: 1 ved BOK, N ved EKSEMPLAR, total deltakelse for begge.</li>" +
          "<li><b>Punkt 5:</b> STÅR_I: 1 ved BOKHYLLE, N ved EKSEMPLAR, partiell for begge.</li>" +
          "<li><b>Punkt 6:</b> DEDIKERT_TIL: M:N mellom BOK og BOKHYLLE, total for BOK, partiell for BOKHYLLE.</li>" +
          "<li><b>Punkt 7:</b> MEDLEM med sammensatt nøkkel Navn (Fornavn, Etternavn), Adresse og flerverdiattributtet Telefonnr.</li>" +
          "<li><b>Punkt 8:</b> BEHOLDER: 1:1 mellom MEDLEM og EKSEMPLAR, partiell for begge, med relasjonsattributtet FraDato.</li>" +
          "<li><b>Punkt 9:</b> LÅNT_FØR: M:N mellom MEDLEM og EKSEMPLAR, partiell for begge.</li>" +
          "</ul>",
        er: ER_BIBLIOTEK_SVAR,
        poeng: [
          "Punkt 1: forfatter med nøkkel (navn, fødselsår) og dødsår (1p)",
          "Punkt 2: bok som svak entitet med svak nøkkel, identifiserende relasjon, riktig kardinalitet og deltakelse (3p)",
          "Punkt 3: bokhylle med sammensatt nøkkel og kapasitet (1p)",
          "Punkt 4: eksemplar med nøkkel og 1:N til bok, total på begge sider (1p)",
          "Punkt 5: står i, N:1 og partiell (1p)",
          "Punkt 6: dedikert til, M:N, total for bok (1p)",
          "Punkt 7: medlem med sammensatt nøkkel, adresse og flerverdi telefon (1p)",
          "Punkt 8: beholder 1:1 med datoattributt på relasjonen (1p)",
          "Punkt 9: lånt før, M:N (1p)"
        ] }
    ],
    hvorfor: {
      eli5: "<p>Tenk deg et ekte bibliotek. En bok, for eksempel «Sult, 2. utgave», er en idé. Eksemplarene er de fysiske bøkene i hyllene. Bokas navn holder ikke for å skille den fra andre bøker, du må også vite hvem som skrev den. Derfor «henger» boka på forfatteren. Eksemplarene har derimot et eget løpenummer og klarer seg selv.</p>",
      normal: "<p>Det viktigste grepet er å se at BOK ikke kan identifiseres alene. Tittel og utgave er bare unike sammen med forfatteren. Da blir BOK en svak entitet med svak nøkkel (Tittel, Utgave) og en identifiserende relasjon til FORFATTER. Ellers handler oppgaven om å oversette ord til streker: «en eller flere» blir total deltakelse, «kan» blir partiell, «maksimalt ett» blir 1, og «hvilket som helst antall» blir N eller M. Datoen i punkt 8 beskriver selve forholdet mellom medlem og eksemplar, så den henger på romben.</p>",
      teknisk: "<p>En entitet er svak når nøkkelen dens trenger nøkkelen til en annen entitet. Her bestemmer (Tittel, Utgave) bare en bok innenfor én forfatter, så BOK får dobbelt rektangel, svak nøkkel med stiplet understrek og en identifiserende relasjon (dobbel rombe). Den har 1 ved eieren og total deltakelse for den svake siden. Fordi alle forfattere har minst én bok, er FORFATTER også total. EKSEMPLAR har derimot en egen global nøkkel og er en vanlig entitet med en vanlig 1:N-relasjon til BOK. «Ingen bøker uten eksemplarer» gir total deltakelse for BOK der. Nøkler som består av flere deler (forfatter, bokhylle, medlem) modelleres som sammensatte attributter med forelderen understreket. Telefonnummer er flerverdi. Et attributt på en 1:1-relasjon (FraDato) kunne i prinsippet flyttes til en av entitetene, men det beskriver forholdet og står derfor på romben.</p>"
    },
    sensor: {
      deler: [ { del: "", fasit: "<p>Se Figur 1.</p>",
        kriterier: "<p>Generelt, 1 poeng per punkt i oppgaveteksten, men 3 poeng per punkt 2 (den svake entiteten). Imidlertid er 0.5 poeng også mulig hvis det er fortjent (og 1 og 2 poeng for punktet 2).</p>" } ],
      merknad: "Figur 1 i sensorveiledningen er ikke gjengitt her. ER-modellen over er vår egen. Sensorfila har overskriften «1 Modellering (25)», men forsiden og oppgavene gir 28 poeng (11 + 5 + 12)."
    }
  };

  IN.PERFEKT["H2024-1.3"] = {
    type: "eksamen",
    svar: [
      { del: "", tekst: "<p>Forkortelser: KN = kandidatnøkkel, PN = primærnøkkel, FN = fremmednøkkel. Valgene er forklart i kommentarene under hver relasjon.</p>",
        skjema:
          "Leietaker(Navn, Tlfnr)\n" +
          "  KN, PN: {Navn}\n\n" +
          "LeietakerEmail(Leietaker, Email)\n" +
          "  KN, PN: {Leietaker, Email}\n" +
          "  FN: LeietakerEmail(Leietaker) -> Leietaker(Navn)\n" +
          "  -- flerverdiattributtet email får egen relasjon\n\n" +
          "Agent(Navn, Tlfnr)\n" +
          "  KN, PN: {Navn}\n\n" +
          "Eiendom(Postnummer, By, Linje1, Linje2, Pris, NSoverom)\n" +
          "  KN, PN: {Postnummer, By, Linje1, Linje2}\n" +
          "  -- den sammensatte nøkkelen Adresse er erstattet av bladattributtene\n\n" +
          "Eieren(Navn, Postnummer, By, Linje1, Linje2)\n" +
          "  KN, PN: {Navn}\n" +
          "  FN: Eieren(Postnummer, By, Linje1, Linje2) -> Eiendom(Postnummer, By, Linje1, Linje2)\n" +
          "  -- Eie (1:N): hver eier eier nøyaktig én eiendom (1 + total deltakelse),\n" +
          "  -- så FN legges i Eieren uten NULL-verdier. Den avledede Adresse er utelatt.\n\n" +
          "EierTlf(Eier, Tlfnr)\n" +
          "  KN, PN: {Eier, Tlfnr}\n" +
          "  FN: EierTlf(Eier) -> Eieren(Navn)\n" +
          "  -- flerverdiattributtet Tlfnr hos Eieren får egen relasjon\n\n" +
          "Leie(Leietaker, Postnummer, By, Linje1, Linje2, Fra)\n" +
          "  KN: {Leietaker}, {Postnummer, By, Linje1, Linje2}\n" +
          "  PN: {Leietaker}\n" +
          "  FN: Leie(Leietaker) -> Leietaker(Navn)\n" +
          "      Leie(Postnummer, By, Linje1, Linje2) -> Eiendom(Postnummer, By, Linje1, Linje2)\n" +
          "  -- 1:1 med partiell deltakelse på begge sider: egen relasjon gir ingen NULL.\n" +
          "  -- PN er Leietaker fordi den er kortest.\n\n" +
          "Administrere(Agent, Postnummer, By, Linje1, Linje2)\n" +
          "  KN, PN: {Agent}\n" +
          "  FN: Administrere(Agent) -> Agent(Navn)\n" +
          "      Administrere(Postnummer, By, Linje1, Linje2) -> Eiendom(Postnummer, By, Linje1, Linje2)\n" +
          "  -- 1:N: hver agent administrerer høyst én eiendom, men agenten har partiell\n" +
          "  -- deltakelse. FN i Agent ville gitt NULL, så vi lager egen relasjon.\n\n" +
          "Visning(Leietaker, Agent, Postnummer, By, Linje1, Linje2, Dato)\n" +
          "  KN, PN: {Leietaker, Agent, Postnummer, By, Linje1, Linje2}\n" +
          "  FN: Visning(Leietaker) -> Leietaker(Navn)\n" +
          "      Visning(Agent) -> Agent(Navn)\n" +
          "      Visning(Postnummer, By, Linje1, Linje2) -> Eiendom(Postnummer, By, Linje1, Linje2)\n" +
          "  -- ternær relasjon med M/N/K: alle tre FN-ene utgjør til sammen nøkkelen,\n" +
          "  -- og Dato er et vanlig attributt.",
        poeng: [
          "Leietaker, Agent, Eiendom og Eieren med riktige attributter og nøkler (1p hver)",
          "Leie, Eie, Administrere og Visning med riktige FN-er og kandidatnøkler (1,5p hver)",
          "Flerverdiattributtene email og Tlfnr (Eieren) i egne relasjoner",
          "Trekk på 0,5 for hvert manglende attributt, manglende KN/PN- eller FN-markering og manglende forklaring"
        ] }
    ],
    hvorfor: {
      eli5: "<p>Hver «boks» i tegningen blir en tabell. Strekene mellom boksene blir enten en henvisning inne i en av tabellene eller en egen liten koblingstabell. Vi velger koblingstabell når henvisningen ellers ville stått tom for mange rader.</p>",
      normal: "<p>Først lager vi én relasjon per entitet. Så ser vi på hver relasjon i diagrammet. Er det én «mange»-side der alle deltar (Eie), legger vi en fremmednøkkel der. Er deltakelsen partiell (Leie, Administrere), ville fremmednøkkelen ofte vært NULL, og da er en egen relasjon bedre. En ternær relasjon blir alltid en egen relasjon. Når alle sidene er «mange», er nøkkelen alle tre fremmednøklene. Flerverdiattributter blir egne relasjoner, og avledede attributter tas ikke med.</p>",
      teknisk: "<p>Algoritmen går i fast rekkefølge: entiteter, svake entiteter, 1:1, 1:N, M:N og ternære, og til slutt flerverdiattributter. For Eie står 1 ved Eiendom og dobbel strek fra Eieren, så hver eier har nøyaktig én eiendom. FN i Eieren blir da aldri NULL. Adressen er ikke en kandidatnøkkel i Eieren, fordi én eiendom kan ha mange eiere (M). For Administrere står også 1 ved Eiendom, men Agent deltar partielt, så en egen relasjon med KN {Agent} unngår NULL-verdier. Den totale deltakelsen til Eiendom kan ikke håndheves med FN alene. Leie er 1:1 med partiell deltakelse på begge sider. Begge FN-ene blir derfor kandidatnøkler i den egne relasjonen, og én velges som PN. I Visning står M, N og K, så ingen delmengde av FN-ene bestemmer resten, og nøkkelen er alle tre. Dato er ikke med i nøkkelen fordi relasjonsattributter aldri er det.</p>"
    },
    sensor: {
      deler: [ { del: "",
        fasit: "<p>Hele skjemaet blir da:</p><pre>Leietaker(Navn, Tlfnr)\n- KN, PN: {Navn}\n\nAgent(Navn, Tlfnr)\n- KN, PN: {Navn}\n\nEiendom(Postnummer, By, Linje1, Linje2, Pris, NSoverom)\n- KN, PN: {Postnummer, By, Linje1, Linje2}\n\nEieren(Navn, Postnummer, By, Linje1, Linje2)\n- KN: {Navn}, {Postnummer, By, Linje1, Linje2}\n- PN: {Navn}\n- FN: (Postnummer, By, Linje1, Linje2) -&gt; Eiendom(Postnummer, By, Linje1, Linje2)\n\nLeie(Ltaker, Postnummer, By, Linje1, Linje2, Fra)\n- KN: {Ltaker}, {Postnummer, By, Linje1, Linje2}\n- PN: {Ltaker}\n- FN: (Ltaker) -&gt; Leietaker(Navn)\n      (Postnummer, By, Linje1, Linje2) -&gt; Eiendom(Postnummer, By, Linje1, Linje2)\n\nAdministrere(Agnt, Postnummer, By, Linje1, Linje2)\n- KN, PN: {Postnummer, By, Linje1, Linje2}\n- FN: (Agnt) -&gt; Agent(Navn)\n      (Postnummer, By, Linje1, Linje2) -&gt; Eiendom(Postnummer, By, Linje1, Linje2)\n\nVisning(Ltaker, Agnt, Postnummer, By, Linje1, Linje2, Dato)\n- KN, PN: {Ltaker, Agnt, Postnummer, By, Linje1, Linje2)\n- FN: (Ltaker) -&gt; Leietaker(Navn)\n      (Agnt) -&gt; Agent(Navn)\n      (Postnummer, By, Linje1, Linje2) -&gt; Eiendom(Postnummer, By, Linje1, Linje2)\n\nTlf(Eir, Tlfnr)\n- KN, PN: {Eir, Tlfnr}\n- FN: (Eir) -&gt; Eieren(Navn)\n\nEml(Ltaker, email)\n- KN, PN: {Ltaker, email}\n- FN: (Ltaker) -&gt; Leietaker(Navn)</pre>",
        kriterier: "<ul><li>1 poeng for hver entitet</li><li>1.5 for hver relasjon</li></ul><p>Trekk:</p><ul><li>-0.5 for manglende attributt</li><li>-0.5 for manglende markering av kandidatnøkler og primærnøkkel</li><li>-0.5 for manglende fremmednøkkelmarkering</li><li>-0.5 for manglende forklaring på valg</li></ul>" } ],
      merknad: "To feil i veiledningens skjema. (1) Administrere har KN, PN {Agnt} i gjennomgangen, men {Postnummer, By, Linje1, Linje2} i oppsummeringen. Etter figuren (1 ved Eiendom) er {Agnt} riktig. Adressen er ikke en nøkkel, fordi en eiendom kan ha mange agenter (M). (2) Eieren får adressen som ekstra kandidatnøkkel, men med M ved Eieren kan én eiendom ha flere eiere. Adressen er derfor ikke en kandidatnøkkel der. Veiledningen begrunner også Leie som egen relasjon med at den har et attributt. Den egentlige grunnen er partiell deltakelse på begge sider (færre NULL-verdier)."
    }
  };

  IN.PERFEKT["H2024-2.2"] = {
    type: "eksamen",
    svar: [
      { del: "", tekst: "<p>Farten er lengde delt på varighet. Vi ganger i stedet for å dele, slik at en tur med varighet 0 ikke gir deling på null.</p>",
        sql: "-- En tur identifiseres av (bid, stidspunkt). sid og rid er tatt med for oversikt.\n" +
             "SELECT bt.bid, bt.stidspunkt, bt.sid, bt.rid\n" +
             "FROM busstur AS bt\n" +
             "  INNER JOIN rute AS r ON (bt.rid = r.rid)\n" +
             "WHERE r.lengde > 40 * hours(bt.etidspunkt - bt.stidspunkt);",
        poeng: [ "Join mellom busstur og rute på rid", "Riktig fartsberegning: lengde / hours(slutt − start) > 40 (eller tilsvarende)", "Turens id (nøkkel eller ID-kolonner) i SELECT" ] }
    ],
    hvorfor: {
      eli5: "<p>Fart er hvor langt du kjører delt på hvor lang tid det tar. Lengden på ruta står i én tabell og tidene for turen i en annen, så vi må slå dem sammen før vi kan regne.</p>",
      normal: "<p>busstur har start- og sluttidspunkt, og rute har lengden i km. Vi joiner på rid og regner ut lengde / timer. Slutt minus start gir et positivt intervall, og hours() gjør det om til timer. Turen har ingen egen ID-kolonne, så vi viser nøkkelen (bid, stidspunkt).</p>",
      teknisk: "<p>Betingelsen lengde / hours(e − s) &gt; 40 er det samme som lengde &gt; 40 · hours(e − s) når varigheten er positiv. Den andre formen tåler varighet 0 uten å gi feil. Rekkefølgen i subtraksjonen er avgjørende: s − e gir et negativt intervall, og da blir farten negativ og ingen rader kommer med. Primærnøkkelen til busstur er (bid, stidspunkt), så den identifiserer turen. Sensor godtar også bid, sid og rid. På eksempeldataene er det bare de to turene på rute 2 (10,1 km på 13 minutter, omtrent 47 km/t) som kommer med.</p>"
    },
    sensor: {
      deler: [ { del: "",
        fasit: "<p>Gis også full poengsum for en eller alle ID-er i tabellen, samt for en kombinasjon av bid og tidspunkt.</p>",
        sql: "SELECT bid, sid, rid\nFROM rute JOIN busstur USING (rid)\nWHERE lengde/hours(stidspunkt - etidspunkt) > 40",
        kriterier: DELT_SENSOR_2X } ],
      merknad: "Sensors SQL regner hours(stidspunkt - etidspunkt), altså start minus slutt. Det gir negativ varighet, og spørringen ville ikke returnert noen rader. Riktig er etidspunkt - stidspunkt."
    }
  };

  IN.PERFEKT["H2024-2.3"] = {
    type: "eksamen",
    svar: [
      { del: "", tekst: "<p>Join sjåfør med bussene der hen er standardsjåfør, grupper per sjåfør og behold gruppene med mer enn én buss.</p>",
        sql: "SELECT s.navn\n" +
             "FROM sjafor AS s\n" +
             "  INNER JOIN buss AS b ON (b.standardsid = s.sid)\n" +
             "GROUP BY s.sid, s.navn   -- sid med, så to like navn ikke slås sammen\n" +
             "HAVING count(*) > 1;",
        poeng: [ "Kobling mellom buss.standardsid og sjafor.sid", "GROUP BY per sjåfør", "HAVING count(*) > 1", "navn i SELECT" ] }
    ],
    hvorfor: {
      eli5: "<p>Lag én haug per sjåfør med alle bussene der hen er fast sjåfør. Tell bussene i hver haug, og skriv opp navnet på dem som har mer enn én.</p>",
      normal: "<p>Hver buss peker på sin standardsjåfør. Joiner vi buss med sjafor og grupperer per sjåfør, gir count(*) hvor mange busser sjåføren er standardsjåfør for. Filteret «mer enn én» gjelder gruppen, så det skal stå i HAVING.</p>",
      teknisk: "<p>WHERE filtrerer rader før grupperingen, mens HAVING filtrerer grupper etter at aggregatene er regnet ut. Derfor må count(*) &gt; 1 stå i HAVING. Vi grupperer på primærnøkkelen sid i tillegg til navn, fordi navn ikke er unikt. To ulike sjåfører med samme navn skal telles hver for seg. Busser med standardsid NULL faller bort i den indre joinen, og det er riktig her. Sensors løsning med sid IN (delspørring med GROUP BY standardsid) er likeverdig. På eksempeldataene gir begge Ahmed B. og Monika Amalia.</p>"
    },
    sensor: {
      deler: [ { del: "", fasit: "",
        sql: "SELECT navn\nFROM sjafor\nWHERE sid IN (\n    SELECT standardsid\n    FROM buss\n    GROUP BY standardsid\n    HAVING count(*) > 1\n);",
        kriterier: DELT_SENSOR_2X } ],
      merknad: "Setningen om delvis korrekte løsninger står under 2.2 i veiledningen, men gjelder 2.2–2.6."
    }
  };

  IN.PERFEKT["H2024-2.4"] = {
    type: "eksamen",
    svar: [
      { del: "", tekst: "<p>Begge delene av unionen leser fra buss, så betingelsene kan slås sammen med OR. DISTINCT gir samme mengdesemantikk som UNION.</p>",
        sql: "SELECT DISTINCT bid   -- UNION fjerner duplikater; bid er PK, men DISTINCT gjør det tydelig\n" +
             "FROM buss\n" +
             "WHERE modell = 'Mercedes' OR Year(vedlikeholdt) < 2024;",
        poeng: [ "Én spørring mot buss uten UNION", "OR mellom de to betingelsene", "DISTINCT (eller begrunnelse for at duplikater ikke kan oppstå)" ] }
    ],
    hvorfor: {
      eli5: "<p>Å lage to lister og så slå dem sammen er det samme som å gå gjennom bussene én gang og ta med hver buss som passer med minst én av reglene.</p>",
      normal: "<p>σ₁(buss) ∪ σ₂(buss) er det samme som σ_{1 ∨ 2}(buss). I SQL betyr det WHERE betingelse1 OR betingelse2. UNION fjerner duplikater, og det gjør DISTINCT også. Siden bid er primærnøkkel, kan ingen bid uansett komme to ganger fra samme tabell.</p>",
      teknisk: "<p>Spørringene er likeverdige på alle forekomster. En rad kommer med i unionen hvis minst én av betingelsene er sann. OR er sann når minst én av sidene er sann. Er den ene siden NULL (ukjent) og den andre usann, blir OR NULL, og raden filtreres bort, akkurat som den ville blitt borte fra begge delspørringene. Duplikater: unionen er en mengde. I én spørring kan samme bid bare komme flere ganger hvis bid ikke er unik. Den er PK, så DISTINCT er strengt tatt overflødig, men den gjør likeverdigheten opplagt.</p>"
    },
    sensor: {
      deler: [ { del: "", fasit: "",
        sql: "SELECT DISTINCT bid\nFROM buss\nWHERE modell = ‘Mercedes’ OR year(vedlikeholdt) < 2024;",
        kriterier: DELT_SENSOR_2X } ],
      merknad: "Sensors SQL har typografiske anførselstegn (‘Mercedes’). I ekte SQL skal det være vanlige fnutter."
    }
  };

  IN.PERFEKT["H2024-2.5"] = {
    type: "eksamen",
    svar: [
      { del: "", tekst: "<p>Join hver tur med bussen sin og behold turene der sjåføren ikke er bussens standardsjåfør. Busser uten standardsjåfør tas med eksplisitt, ellers ville sammenligningen med NULL fjernet dem.</p>",
        sql: "CREATE VIEW turer_uten_standardsjafor AS\n" +
             "SELECT bt.bid, bt.sid, bt.rid, bt.stidspunkt, bt.etidspunkt\n" +
             "FROM busstur AS bt\n" +
             "  INNER JOIN buss AS b ON (bt.bid = b.bid)\n" +
             "WHERE b.standardsid IS NULL      -- bussen har ingen standardsjåfør\n" +
             "   OR bt.sid != b.standardsid;",
        poeng: [ "CREATE VIEW … AS", "Join busstur–buss på bid", "Betingelsen sid != standardsid", "Rimelig håndtering av NULL (kommentar eller IS NULL)" ] }
    ],
    hvorfor: {
      eli5: "<p>Hver buss har en fast sjåfør. Vi går gjennom alle turene og legger merke til dem der noen andre enn den faste sjåføren kjørte. Et VIEW er en lagret spørring som oppfører seg som en tabell.</p>",
      normal: "<p>Sjåføren for turen står i busstur, og standardsjåføren står i buss. Vi joiner derfor på bid og sammenligner. Med CREATE VIEW kan andre spørringer bruke resultatet som en tabell. Hvis standardsid er NULL, gir sid != standardsid NULL (ukjent), og WHERE kaster raden. Vil vi ha med turer på busser uten standardsjåfør, må vi legge til IS NULL.</p>",
      teknisk: "<p>WHERE beholder bare rader der betingelsen er sann. Sammenligning med NULL gir NULL, så uten IS NULL-delen forsvinner turer på busser som mangler standardsjåfør. Vi tolker «sjåføren var ikke standardsjåfør» slik at de skal med. Begge tolkninger bør kommenteres. Vi velger kolonnene fra busstur eksplisitt, slik at viewet ikke får to kolonner med samme navn. Sensors løsning unngår det med USING (bid). På eksempeldataene gir viewet de fire turene med buss 1 (sjåfør 1, standardsjåfør 8).</p>"
    },
    sensor: {
      deler: [ { del: "", fasit: "",
        sql: "CREATE VIEW ikke_standard AS\nSELECT *\nFROM busstur AS bt JOIN buss AS b USING (bid)\nWHERE bt.sid != b.standardsid;",
        kriterier: DELT_SENSOR_2X } ],
      merknad: "Sensors løsning tar ikke med turer på busser der standardsid er NULL. Det er en gyldig tolkning, men den bør kommenteres."
    }
  };

  IN.PERFEKT["H2024-2.6"] = {
    type: "eksamen",
    svar: [
      { del: "", tekst: "<p>Først timer per sjåfør per dag i oktober, så overtid per dag (timer over 6), så summen per sjåfør ganget med 1000. Vi antar at en tur regnes til dagen den starter.</p>",
        sql: "WITH per_dag AS (\n" +
             "  -- kjøretid per sjåfør per dag i oktober 2024\n" +
             "  SELECT bt.sid,\n" +
             "         bt.stidspunkt::date AS dag,\n" +
             "         sum(hours(bt.etidspunkt - bt.stidspunkt)) AS timer\n" +
             "  FROM busstur AS bt\n" +
             "  WHERE bt.stidspunkt >= '2024-10-01'\n" +
             "    AND bt.stidspunkt < '2024-11-01'\n" +
             "  GROUP BY bt.sid, bt.stidspunkt::date\n" +
             ")\n" +
             "INSERT INTO overtid (sid, navn, betaling)\n" +
             "SELECT s.sid, s.navn, sum(p.timer - 6) * 1000\n" +
             "FROM per_dag AS p\n" +
             "  INNER JOIN sjafor AS s ON (p.sid = s.sid)\n" +
             "WHERE p.timer > 6          -- bare dager med overtid\n" +
             "GROUP BY s.sid, s.navn;",
        poeng: [ "Timer per sjåfør per dag (GROUP BY sjåfør og dato)", "Avgrensning til oktober 2024", "Overtid per dag = timer − 6, bare når timer > 6", "Sum per sjåfør × 1000", "INSERT INTO overtid med sid, navn og betaling" ] }
    ],
    hvorfor: {
      eli5: "<p>Tenk deg en timeliste. For hver dag i oktober legger du sammen hvor lenge sjåføren kjørte. Kjørte hen mer enn 6 timer, får hen betalt for timene over 6. Til slutt legger du sammen ekstrabetalingen for hele måneden og skriver den inn i tabellen.</p>",
      normal: "<p>Oppgaven har to grupperinger. Først per sjåfør og dag for å finne dagens kjøretid, så per sjåfør for å summere overtiden. Med WITH kan du regne ut det første trinnet og bruke det som en tabell i det andre. Grensen på 6 timer gjelder hver dag for seg, så den må brukes før summen over måneden. INSERT INTO … SELECT fyller tabellen med resultatet.</p>",
      teknisk: "<p>Overtid er en ikke-lineær funksjon per dag: max(0, t − 6). Derfor kan ikke månedssummen regnes før dagsgrensen er brukt. WITH-delen grupperer på (sid, dato) og summerer hours(e − s). Hovedspørringen beholder bare dagene med timer &gt; 6, summerer (timer − 6) per sjåfør og ganger med 1000. Det gir 7,2 t → 1,2 · 1000 = 1200 kr, som i eksempelet. Avgrensningen med &lt; '2024-11-01' tar med hele 31. oktober. Fordi bare positive beløp settes inn, holder CHECK (betaling &gt; 0). Navnet hentes fra sjafor, slik at det stemmer med sid. I PostgreSQL står WITH foran INSERT.</p>"
    },
    sensor: {
      deler: [ { del: "", fasit: "<p>Denne løsningen forutsetter at det ikke er turer med ulik dato for stidspunkt og etidspunkt, og at det ikke er turer med negativ tid lengde. Selv om denne forutsetningen ikke ble nevnt, bør en student ikke straffes for å gjøre det.</p>",
        sql: "WITH oktdates AS (\n    SELECT DISTINCT Date(stidspunkt) as dt\n    FROM busstur\n    WHERE Date(stidspunkt) >= '2024-10-01'\n        AND Date(stidspunkt) <= '2024-10-30'\n)\nWITH overperday AS (\n    SELECT s.sid, s.navn,\n                hours(sum(bt.etidspunkt - bt.stidspunkt)) - 6 AS oh\n    FROM sjafor AS s JOIN busstur AS bt USING (sid)\n                               JOIN oktdates AS nd\n    WHERE Date(bt.stidspunkt) = nd.dt\n    GROUP BY s.sid, s.navn, nd.dt;\n)\nINSERT INTO overtid\nSELECT sid, navn, sum(oh) * 1000 as\nFROM overperday\nWHERE oh > 0\nGROUP BY sid, navn\nHAVING sum(oh) > 0;",
        kriterier: DELT_SENSOR_2X + "<p>Dette er et vanskelig spørsmål, og derfor bør feil tolereres; alt rimelig skal gis en stor brøkdel av hele 10 poeng.</p>" } ],
      merknad: "Sensors SQL har flere feil. (1) Øvre grense '2024-10-30' utelater 31. oktober. (2) To WITH etter hverandre skal skrives som én WITH med komma. (3) Det står semikolon inne i WITH-delen. (4) JOIN oktdates mangler ON (betingelsen står i WHERE, som bare går i noen dialekter). (5) Det mangler et alias etter «as» i INSERT-delen. Ideen er riktig, men koden kjører ikke slik den står."
    }
  };

  IN.PERFEKT["H2024-3.3"] = {
    type: "eksamen",
    svar: [
      { del: "", tekst:
          "<p><b>Utgangspunkt.</b> R(A, B, C, D, E, F) med KN ACE. A, C og E står aldri på en høyreside, og ACE⁺ = R. ACE er altså eneste KN.</p>" +
          "<p><b>Steg 1.</b> A → B bryter BCNF fordi A ikke er en supernøkkel. A⁺ = {A, B, D}. Vi deler R i<br>" +
          "S₁(A, B, D) = A⁺ og S₂(A, C, E, F) = A ∪ (R − A⁺).</p>" +
          "<ul><li>S₁(A, B, D): FD-er A → B, A → D. KN: A. A er supernøkkel, så S₁ er på BCNF.</li>" +
          "<li>S₂(A, C, E, F): FD-er CE → F (EF → B gjelder ikke, B er ikke med). KN: ACE. CE er ikke supernøkkel, så S₂ er ikke på BCNF.</li></ul>" +
          "<p><b>Steg 2.</b> Del S₂ med hensyn på CE → F. CE⁺ (i S₂) = {C, E, F}.</p>" +
          "<ul><li>S₂₁(C, E, F): FD CE → F. KN: CE. BCNF.</li>" +
          "<li>S₂₂(A, C, E): ingen ikke-trivielle FD-er. KN: ACE. BCNF.</li></ul>" +
          "<p><b>Resultat.</b> R dekomponeres tapsfritt til S₁(A, B, D), S₂₁(C, E, F) og S₂₂(A, C, E). Hvert steg er tapsfritt fordi fellesattributtene (A, deretter CE) bestemmer hele den ene delen (Fagins teorem).</p>",
        poeng: [ "Første dekomponering: brudd, A⁺, S₁ og S₂ med KN og FD-er (7p)", "Dekomponering av S₂: CE⁺, S₂₁ med KN og FD (3p)", "S₂₂ med KN og (ingen) FD-er (3p)", "Trekk: −1 per gal/manglende FD, −1 for gal tillukning, −1 for gale/manglende KN, −3 uten forklaring" ] }
    ],
    hvorfor: {
      eli5: "<p>Hvis noe som ikke er en hel nøkkel bestemmer andre ting, lagres de tingene om og om igjen. Vi flytter dem ut i en egen tabell der det som bestemmer, er nøkkelen. Den gamle tabellen beholder akkurat nok til at vi kan sette det sammen igjen.</p>",
      normal: "<p>BCNF-algoritmen tar én «dårlig» FD om gangen. Vi regner ut tillukningen til venstresiden. Alt den bestemmer, havner i én ny tabell. Venstresiden og resten havner i den andre. Så sjekker vi hver ny tabell for seg med de FD-ene som fortsatt gjelder der. Her trengs to runder: først for A → B (som også tar med D), så for CE → F.</p>",
      teknisk: "<p>I hvert steg velges en FD Y → A som bryter BCNF. Så regnes Y⁺ ut, og X deles i S₁(Y⁺) og S₂(Y ∪ (X − Y⁺)). Fellesattributtene er Y, og Y → Y⁺ holder, så delingen er tapsfri etter Fagins teorem. FD-ene på en delrelasjon er de som bare bruker attributter derfra. EF → B kan ikke brukes i S₂, fordi B er flyttet til S₁. I S₂ er CE⁺ = {C, E, F}, så S₂₁ får nøkkel CE. S₂₂(A, C, E) har ingen ikke-trivielle FD-er, og hele skjemaet er nøkkel. Starter du med CE → F, er CE⁺ = {B, C, E, F} i R (via EF → B), og du må dele videre på EF → B. Resultatet blir annerledes, men like riktig.</p>"
    },
    sensor: {
      deler: [ { del: "",
        fasit: "<p>Starter med å finne en FD som bryter med BCNF, og ser at A → B bryter med BCNF: Vi dekomponerer så med hensyn på denne, A⁺ = A, B, D:</p>" +
          "<ul><li>Første relasjon i dekomponeringen av R blir S₁(A, B, D), med KN A og FDene 1 og 2. Denne ser vi er på BCNF.</li>" +
          "<li>Den andre relasjonen i dekomponeringen av R er S₂(A, C, E, F) med KN ACE og FD 3. Her ser vi at FD 3 (CE → F) bryter, så dekomponerer videre med hensyn på denne, CE⁺ = CEF:" +
          "<ul><li>Første relasjon blir da S₂₁(C, E, F) med KN CE og FD 3, som vi er på BCNF.</li>" +
          "<li>Andre relasjon blir S₂₂(C, E, A) med KN CEA og ingen FDer og er derfor på BCNF.</li></ul></li></ul>" +
          "<p>Relasjon R dekomponeres tapsfritt til S₁(A, B, D), S₂₁(C, E, F) og S₂₂(C, E, A).</p>",
        kriterier: "<ul><li>7 poeng for riktig første dekomponering (inkludert nøkler og FDer på de nye relasjonene), altså dekomomponeringen av R til to nye relasjoner</li>" +
          "<li>3 poeng for hver av de to andre dekomponeringene (inkludert nøkler og FDer på de nye relasjonene)</li>" +
          "<li>-1 poeng for manglende/feil FD på relasjon</li><li>-1 poeng for feil utregning av tillukning</li>" +
          "<li>-1 poeng for manglende/feil kandidatnøkler</li><li>-3 poeng for ingen forklaringer</li></ul>" } ],
      merknad: "«dekomomponeringen» er en skrivefeil i veiledningen og er beholdt ordrett. Veiledningen nevner ikke at FD 4 (EF → B) ikke kan brukes i noen av delrelasjonene."
    }
  };

  /* ================================================================ bank */
  BANK["H2024"] = {
    year: "H2024", dato: "13.12.2024", varighet: "4 timer (09:00–13:00)",
    hjelpemidler: "Alle trykte og skrevne hjelpemidler tillatt.",
    deler: [
      { navn: "Modellering og realisering", poeng: 28 },
      { navn: "SQL", poeng: 45 },
      { navn: "Relasjonsmodellen, normalformer og dekomposisjon", poeng: 27 }
    ],
    skjema: SKJEMA,
    er: { "1.2": ER_DATASPILL, "1.3": ER_UTLEIE },
    oppgaver: OPPGAVER
  };
})();
