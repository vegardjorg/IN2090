/* IN2090 · eksamensbank H2023. Kilde: UiO, IN2090 eksamen H2023 + databaseskjema + sensorveiledning.
   Oppgavetekst og sensorveiledning ordrett. Våre svar (svar/hvorfor/losning/tips) med egne ord. */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var BANK = (window.IN_EXAM_BANK = window.IN_EXAM_BANK || {});
  IN.PERFEKT = IN.PERFEKT || {};

  /* ---------- Databaseskjema (vedlegg) ---------- */
  var SKJEMA = {
    tittel: "Databaseskjema for eksamen IN2090H23",
    intro: "<p>Du har fått jobb som databaseekspert for Metrologisk Institutt, hvor de har en database som inneholder informasjon om områder, sensorer, og målinger av nedbør, vind og temperatur. Databasen er laget med følgende SQL-script:</p>" +
      "<pre>CREATE TABLE område (\n      oid int PRIMARY KEY,\n      navn text NOT NULL,\n      areal float NOT NULL\n);\n\nCREATE TABLE sensor (\n      sid int PRIMARY KEY,\n      oid int REFERENCES område(oid),\n      vedlikeholdt date\n);\n\nCREATE TABLE måling (\n      sid int REFERENCES sensor(sid),\n      tidspunkt timestamp,\n      nedbør float,\n      vind float,\n      temp float,\n      PRIMARY KEY (sid, tidspunkt)\n);</pre>" +
      "<p><b>Eksempeldata</b></p><p>Under (på neste side) følger eksempler på hvordan tabellene kan se ut. Spørringene dine kan ikke anta at dataene ser slik ut, med mindre dette står i oppgaven. NULL er representert som blank/manglende verdi (f.eks. har den tredje raden i måling en vind som er NULL).</p>",
    tabeller: [
      {
        navn: "område",
        beskrivelse: "Tabellen område beskriver områder, og inneholder en unik område-ID oid, navnet på område i navn, samt områdets areal i kvadratkilometer.",
        kolonner: [
          { navn: "oid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true },
          { navn: "areal", type: "float", notNull: true }
        ],
        eksempel: {
          kolonner: ["oid", "navn", "areal"],
          rader: [
            [1, "Oslo", 454.12],
            [2, "Bærum", 192.29],
            [3, "Lillestrøm", 456.61],
            [4, "Gjøvik", 672.25],
            [5, "Trondheim", 528.6],
            [6, "Kristiansand", 644.16]
          ]
        }
      },
      {
        navn: "sensor",
        beskrivelse: "Tabellen sensor beskriver værsensorer som er plassert i de ulike områdene. Hver sensor har en unik sensor-ID sid, en referanse oid til området sensoren er plassert i, samt en dato for sist sensoren ble vedlikehold. Merk at det kan være mange sensorer i samme område, og disse vil da være plassert på ulike steder innenfor område.",
        kolonner: [
          { navn: "sid", type: "int", pk: true },
          { navn: "oid", type: "int", fk: "område(oid)" },
          { navn: "vedlikeholdt", type: "date" }
        ],
        eksempel: {
          kolonner: ["sid", "oid", "vedlikeholdt"],
          rader: [
            [1, 1, "2023-12-01"],
            [2, 1, "2022-11-24"],
            [3, 1, "2021-02-09"],
            [4, 2, "2020-08-02"],
            [5, 3, "2021-09-11"],
            [6, 3, "2022-11-13"],
            [7, 6, "2022-03-31"],
            [8, 4, "2021-10-04"]
          ]
        }
      },
      {
        navn: "måling",
        beskrivelse: "Den siste tabellen, måling beskriver målinger gjort av de ulike sensorene. Tabellen har en referanse sid til sensoren som har gjort målingen, samt et tidspunkt i tidspunkt for når målingen ble utført. Disse to kolonnene er til sammen unik, og utgjør målings primærnøkkel. Videre inneholder tabellen tre kolonner, nedbør, vind og temp som henholdsvis beskriver målt nedbørsmengde (i millimeter siden sist måling), vindstyrke i meter per sekund, og temperatur i celsius. Merk at sensorene av og til kan feile i enkeltmålinger, og de vil da ikke rapportere noen verdi for den målingen. Databasen vil da inneholde NULL for slike feilmålinger.",
        kolonner: [
          { navn: "sid", type: "int", pk: true, fk: "sensor(sid)" },
          { navn: "tidspunkt", type: "timestamp", pk: true },
          { navn: "nedbør", type: "float" },
          { navn: "vind", type: "float" },
          { navn: "temp", type: "float" }
        ],
        eksempel: {
          kolonner: ["sid", "tidspunkt", "nedbør", "vind", "temp"],
          rader: [
            [2, "2023-12-02 12:00:00", 0, 0.3, -1],
            [2, "2023-12-02 12:01:00", 0.1, 0.4, -1.1],
            [2, "2023-12-02 12:02:11", 0, null, -1.1],
            [3, "2023-11-30 09:01:30", 0, 0, 2.1],
            [3, "2023-11-30 09:04:01", 1.1, 4.1, 2],
            [3, "2023-12-01 11:57:46", 0.9, 3.2, -0.8],
            [7, "2023-10-16 16:11:47", 0.3, 7.9, 3.6],
            [2, "2023-12-04 12:11:20", null, null, -6.3],
            [7, "2023-10-16 16:11:59", 0, 7.8, 3.7],
            [7, "2023-10-17 16:15:22", 0.1, 7.8, null],
            [8, "2023-11-09 22:48:12", 3.6, 0.5, -12.3],
            [4, "2023-11-16 03:11:01", 0.7, 0.7, null],
            [4, "2023-11-16 04:11:02", 0.1, 0.8, -7.5]
          ]
        }
      }
    ],
    merknad: "Primærnøkkelen i måling er sammensatt: (sid, tidspunkt). NULL står som null i eksempelradene. «sist sensoren ble vedlikehold» er ordrett fra vedlegget."
  };

  /* ---------- ER-figurer fra arket ---------- */
  var ER_HEMMELIG = {
    entiteter: [
      { id: "AK", navn: "AK", svak: false, pos: [0, 0],
        attr: [ { navn: "Asso", flerverdi: true }, { navn: "Agn", nokkel: true } ] },
      { id: "BO", navn: "BO", svak: true, pos: [0, 2],
        attr: [ { navn: "Boks", delvisNokkel: true } ] },
      { id: "CU", navn: "CU", svak: false, pos: [2, 1],
        attr: [ { navn: "Chi", nokkel: true }, { navn: "Chow" } ] }
    ],
    relasjoner: [
      { id: "RAB", navn: "RAB", identifiserende: true, pos: [0, 1],
        ledd: [ { entitet: "AK", kard: "1", total: false },
                { entitet: "BO", kard: "N", total: true } ],
        attr: [] },
      { id: "RACB", navn: "RACB", identifiserende: false, pos: [1, 1],
        ledd: [ { entitet: "AK", kard: "M", total: false },
                { entitet: "CU", kard: "1", total: false },
                { entitet: "BO", kard: "N", total: true } ],
        attr: [] }
    ],
    isa: [],
    merknad: "Figure 1: Hemmelig-modell. RAB er en identifiserende relasjon (dobbel rombe) mellom eieren AK og den svake entiteten BO. RACB er ternær, og BO har total deltakelse (dobbel strek) i både RAB og RACB."
  };

  var ER_NETTAVIS = {
    entiteter: [
      { id: "JOURNALIST", navn: "JOURNALIST", svak: false, pos: [0, 0],
        attr: [ { navn: "Epost", avledet: true }, { navn: "Navn" }, { navn: "Brukernavn", nokkel: true } ] },
      { id: "ARTIKKEL", navn: "ARTIKKEL", svak: false, pos: [2, 0],
        attr: [ { navn: "AID", nokkel: true }, { navn: "Tittel" }, { navn: "Innhold" }, { navn: "Dato" },
                { navn: "Nøkkelord", flerverdi: true } ] },
      { id: "REDAKTOR", navn: "REDAKTØR", svak: false, pos: [0, 1],
        attr: [ { navn: "Epost", nokkel: true },
                { navn: "RID", nokkel: true, deler: [ { navn: "RedNr" }, { navn: "AvisNr" } ] },
                { navn: "Navn" } ] },
      { id: "TEMA", navn: "TEMA", svak: false, pos: [1, 2],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Beskrivelse" } ] }
    ],
    relasjoner: [
      { id: "SKREVET", navn: "SKREVET", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "JOURNALIST", kard: "N", total: false },
                { entitet: "ARTIKKEL", kard: "N", total: true } ],
        attr: [] },
      { id: "GODKJENT", navn: "GODKJENT", identifiserende: false, pos: [1, 1],
        ledd: [ { entitet: "REDAKTOR", kard: "1", total: false },
                { entitet: "ARTIKKEL", kard: "N", total: true } ],
        attr: [ { navn: "Dato" } ] },
      { id: "RELATERT", navn: "RELATERT", identifiserende: false, pos: [3, 1],
        ledd: [ { entitet: "ARTIKKEL", kard: "N", total: false },
                { entitet: "ARTIKKEL", kard: "M", total: false } ],
        attr: [] },
      { id: "FOR", navn: "FOR", identifiserende: false, pos: [0, 2],
        ledd: [ { entitet: "REDAKTOR", kard: "N", total: true },
                { entitet: "TEMA", kard: "M", total: true } ],
        attr: [] },
      { id: "INNEN", navn: "INNEN", identifiserende: false, pos: [2, 2],
        ledd: [ { entitet: "TEMA", kard: "1", total: false },
                { entitet: "ARTIKKEL", kard: "N", total: false } ],
        attr: [] }
    ],
    isa: [],
    merknad: "Figure 2: ER-modell over databasen til en nettavis. Epost hos JOURNALIST er stiplet (utledbart). RID hos REDAKTØR er en sammensatt nøkkel (RedNr, AvisNr), og REDAKTØR har i tillegg nøkkelen Epost. RELATERT er en rekursiv M:N-relasjon på ARTIKKEL."
  };

  /* ---------- Vårt ER-svar til 1.1 ---------- */
  var ER_BANK_SVAR = {
    entiteter: [
      { id: "KUNDE", navn: "KUNDE", svak: false, pos: [1, 0],
        attr: [ { navn: "Personnr", nokkel: true }, { navn: "Navn" } ] },
      { id: "FAKTURA", navn: "FAKTURA", svak: false, pos: [3, 0],
        attr: [ { navn: "KID", nokkel: true }, { navn: "Beløp" }, { navn: "Forfallsdato" } ] },
      { id: "KONTO", navn: "KONTO", svak: false, pos: [1, 2],
        attr: [ { navn: "Kontonr", nokkel: true, deler: [
                    { navn: "Prefiks", deler: [ { navn: "Registernr" }, { navn: "Gruppenr" } ] },
                    { navn: "Suffiks", deler: [ { navn: "Kundenr" }, { navn: "Kontrollsiffer" } ] } ] },
                { navn: "Balanse" },
                { navn: "Type", avledet: true } ] },
      { id: "TRANSAKSJON", navn: "TRANSAKSJON", svak: true, pos: [3, 2],
        attr: [ { navn: "Tidspunkt", delvisNokkel: true }, { navn: "Verdi" } ] }
    ],
    relasjoner: [
      { id: "EIER", navn: "EIER", identifiserende: false, pos: [0, 1],
        ledd: [ { entitet: "KUNDE", kard: "1", total: false },
                { entitet: "KONTO", kard: "N", total: true } ], attr: [] },
      { id: "DISPONERER", navn: "DISPONERER", identifiserende: false, pos: [1, 1],
        ledd: [ { entitet: "KUNDE", kard: "M", total: false },
                { entitet: "KONTO", kard: "N", total: false } ], attr: [] },
      { id: "SENDT_TIL", navn: "SENDT_TIL", identifiserende: false, pos: [2, 0],
        ledd: [ { entitet: "KUNDE", kard: "1", total: false },
                { entitet: "FAKTURA", kard: "N", total: true } ], attr: [] },
      { id: "UTFORTE", navn: "UTFØRTE", identifiserende: false, pos: [2, 1],
        ledd: [ { entitet: "KUNDE", kard: "1", total: false },
                { entitet: "TRANSAKSJON", kard: "N", total: true } ], attr: [] },
      { id: "BETALER", navn: "BETALER", identifiserende: false, pos: [3, 1],
        ledd: [ { entitet: "FAKTURA", kard: "1", total: false },
                { entitet: "TRANSAKSJON", kard: "1", total: false } ], attr: [] },
      { id: "FRA", navn: "FRA", identifiserende: true, pos: [2, 2],
        ledd: [ { entitet: "KONTO", kard: "1", total: false },
                { entitet: "TRANSAKSJON", kard: "N", total: true } ], attr: [] },
      { id: "TIL", navn: "TIL", identifiserende: true, pos: [2, 3],
        ledd: [ { entitet: "KONTO", kard: "1", total: false },
                { entitet: "TRANSAKSJON", kard: "N", total: true } ], attr: [] }
    ],
    isa: [],
    merknad: "TRANSAKSJON er svak med to eiere (fra-konto og til-konto) og den delvise nøkkelen Tidspunkt. KONTO er én entitet som deltar i to identifiserende relasjoner, FRA og TIL."
  };

  var SQL_GENERELT = "<p>Generelt gjelder følgende (men disse må sees litt i sammenheng med oppgaven):</p><ul>" +
    "<li>-0.5 for manglende kolonner i SELECT</li>" +
    "<li>-1 for manglende/feil tabeller i joins i FROM</li>" +
    "<li>-1 for manglende begrensning i WHERE</li>" +
    "<li>-2 for aggregering (count, sum, osv.) i WHERE-klausulen</li>" +
    "<li>-2 for manglende ORDER BY eller GROUP BY</li>" +
    "<li>Ingen trekk for å kun ha primærnøkkel i GROUP BY men andre attributter (fra samme tabell) i SELECT (støttes av PostgreSQL)</li>" +
    "<li>Ingen trekk for enkle syntaksfeil man enkelt ville funnet ut av om man hadde mulighet til å kjøre spørringen</li></ul>";

  var REALISERING_INSTRUKS = "<p>Realiser denne modellen til et relasjonelt databaseskjema. Det resulterende databaseskjemaet skal være korrekt (samsvare med modellen), effektivt (unngå overflødige tabeller og kolonner med mange NULL-verdier), og tydelig (bør være lett å forstå). Bruk algoritmen for realisering for å lage et slikt skjema, og forklar eventuelle valg du tar underveis. For hver relasjon, oppgi relasjonens navn, og navnet til hvert attributt. Du trenger ikke oppgi datatyper for attributtene, og du skal ikke bruke SQL i denne oppgaven. Gjør det tydelig hvilke attributter som utgjør kandidatnøkler og fremmenøkler. Dersom det er flere kandidatnøkler, marker også valgt primærnøkkel. F.eks. bruk understreking for å markere kandidatnøkler, fet skrift for primærnøkler, og piler for å markere fremmednøkler (f.eks. “T(A) -&gt; S(B)” for å uttrykke at relasjon T sin attributt A er en fremmednøkkel som peker på relasjon S sin B attributt).</p>" +
    "<p><i>Figure 2: ER-modell over databasen til en nettavis</i></p>" +
    "<p>Om du ønsker å ha bilde større eller i en egen tab, høyreklikk på bildet og velg “Se bildet/View Image”.</p>";

  BANK["H2023"] = {
    year: "H2023",
    dato: "13.12.2023",
    varighet: "4 timer (09:00–13:00)",
    hjelpemidler: "Alle trykte og skrevne hjelpemidler tillatt.",
    deler: [
      { navn: "Modellering og realisering", poeng: 30 },
      { navn: "SQL", poeng: 50 },
      { navn: "Relasjonsmodellen, normalformer og dekomposisjon", poeng: 20 }
    ],
    skjema: SKJEMA,
    er: { "1.2": ER_HEMMELIG, "1.3": ER_NETTAVIS },
    oppgaver: [

      /* ================= 1.1 ================= */
      {
        key: "H2023-1.1", year: "H2023", oppgave_nr: "Oppgave 1.1", ark: "ER: Bank",
        title: "ER-modell for en bank", points: 15, block: "er",
        tema: ["svak entitet", "to eiere", "sammensatt nøkkel", "utledbart attributt", "1:1", "M:N"],
        ordrett: true,
        oppgave: "<p>Du er ansatt av en bank som skal lage en ny database over deres kunder, konti (flertall av “konto” er “konti”) og transaksjoner. Databasen skal inneholde følgende informasjon:</p><ol>" +
          "<li>Kunder identifiseres med deres personnummer, og har ellers et navn.</li>" +
          "<li>En konto har et unikt kontonummer. Kontonummeret består av en prefiks og en suffiks, hvor prefiksen igjen består av et registernummer og et gruppenummer, mens suffiksen består av et kundenummer og et kontrollsiffer (f.eks. vil kontonummeret 1234 56 78901 ha prefiks 1234 56 og suffiks 78901, hvor 1234 er registernummeret, 56 er gruppenummeret, 7890 er kundenummeret og 1 er kontrollsifferet). Ellers har hver konto en balanse (altså mengden kroner på kontoen), samt en type (f.eks. <code>sparekonto</code>, <code>forbrukskonto</code>, osv.). Typen er derimot utledbar fra kontonummeret.</li>" +
          "<li>Hver konto eies av nøyaktig én kunde. En kunde kan eie mange konti, men trenger ikke eie noen. Videre kan en konto disponeres av mange kunder, og en kunde kan disponere mange konti.</li>" +
          "<li>Banken ønsker også å lagre alle transaksjoner. En transaksjon blir utført fra én konto til en annen konto på et gitt tidspunkt. Kombinasjonen av tidspunktet, til-kontoen og fra-kontoen er unik for transaksjoner. Ellers kan en konto være innvolvert i mange transaksjoner, både som til-konto og fra-konto. Videre har transaksjoner en verdi, som er beløpet som overføres.</li>" +
          "<li>Ettersom mange kunder kan disponere en konto ønsker banken også å lagre hvilken kunde som utførte transaksjonen. En transaksjon må utføres av en kunde, men kan høyst bli utført av én kunde. En kunde kan utføre mange transaksjoner, men trenger ikke å ha utført noen transaksjoner.</li>" +
          "<li>Til slutt ønsker banken å lagre fakturaer. En faktura identifiseres med et unikt KID-nummer, og har ellers et beløp og en forfallsdato. En faktura er til nøyaktig én kunde. En kunde kan derimot få mange faktura, men trenger ikke å ha fått noen fakturaer.</li>" +
          "<li>En transaksjon kan brukes for å betale en faktura. Banken ønsker derfor også å lagre hvilke transaksjoner som eventuelt betaler en faktura. En faktura kan høyst bli betalt av én transaksjon, og en transaksjon kan maks betale én faktura. Derimot trenger ikke en faktura bli betalt av noen transaksjon, og en transaksjon trenger heller ikke betale en faktura.</li></ol>" +
          "<p>Lag derfor en ER-modell som inneholder informasjonen over.</p><ul>" +
          "<li>I denne oppgaven skal du svare med digital håndtegning. Bruk eget skisseark (utdelt). Se instruksjon for utfylling av skisseark i lenken under oppgavelinjen.</li>" +
          "<li>Tegn og skriv tydelig.</li>" +
          "<li>Du må gjerne dele modellen opp i deler (f.eks. over flere sider), men sørg for at det fremkommer tydelig hvilke deler av modellen som besvarer hvilke deler av oppgaven.</li>" +
          "<li>Du må gjerne inkludere kommentarer i modellene. Dersom det er uklarheter eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar til modellene dine om hvilke antagelser og tolkninger du eventuelt gjør.</li></ul>",
        avvik: null,
        losning: [
          "Gå gjennom punktene ett for ett og lag én bit av modellen per punkt. Sensor gir 2 poeng per punkt og 3 for punkt 4.",
          "Punkt 1 og 6: KUNDE (Personnr som nøkkel, Navn) og FAKTURA (KID som nøkkel, Beløp, Forfallsdato).",
          "Punkt 2: KONTO med Kontonr som sammensatt nøkkel i to nivåer (Prefiks med Registernr og Gruppenr, Suffiks med Kundenr og Kontrollsiffer), Balanse og Type som stiplet oval fordi den kan utledes.",
          "Punkt 3: EIER er 1:N med total deltakelse for KONTO (nøyaktig én eier). DISPONERER er M:N og partiell på begge sider.",
          "Punkt 4: TRANSAKSJON er en svak entitet. Den identifiseres av fra-kontoen, til-kontoen og Tidspunkt (delvis nøkkel). Bruk to identifiserende relasjoner, FRA og TIL, mot den samme entiteten KONTO.",
          "Punkt 5: UTFØRTE er 1:N fra KUNDE til TRANSAKSJON med total deltakelse for TRANSAKSJON.",
          "Punkt 6 og 7: en relasjon mellom KUNDE og FAKTURA (1:N, total for FAKTURA) og en 1:1-relasjon BETALER mellom FAKTURA og TRANSAKSJON, partiell på begge sider."
        ],
        tips: [
          "Ikke del KONTO i to entiteter (TIL-KONTO og FRA-KONTO). Sensor trekker 2 poeng for det. Bruk heller to relasjoner til samme entitet.",
          "Når kombinasjonen «tidspunkt + til-konto + fra-konto» er unik, er det et tegn på en svak entitet med to eiere.",
          "Marker både svak entitet (dobbelt rektangel) og identifiserende relasjon (dobbel rombe). Mangler begge, gir det −2.",
          "Sett kardinalitet og total deltakelse på riktig side. «Nøyaktig én» betyr 1 på den andre siden og dobbel strek på sin egen side."
        ],
        del1: null
      },

      /* ================= 1.2 ================= */
      {
        key: "H2023-1.2", year: "H2023", oppgave_nr: "Oppgave 1.2", ark: "ER: Hemmelig",
        title: "Les et «hemmelig» ER-diagram", points: 5, block: "er",
        tema: ["lese ER", "svak entitet", "ternær relasjon", "total deltakelse", "flerverdiattributt"],
        ordrett: true,
        oppgave: "<p>En hemmelig organisasjon (så hemmelig at selv navnet er hemmelig) trenger hjelp fra deg til å forstå et ER-diagram for en database de har. Innholdet i databasen er fryktelig hemmelig, og ER-diagrammet for databasen er derfor kryptert.</p>" +
          "<p>Organisasjonen trenger hjelp til å vite hvilke av disse setningene er sanne i henhold til ER-diagrammet. Kryss av “JA” dersom du mener setningen er modellert av ER-diagrammet, og “NEI” hvis ikke.</p>" +
          "<p>Hvert riktig svar gir 1 poeng, hvert uriktige svar gir -1 poeng, og hvert ubesvart gir 0 poeng. Total poengsum for hele oppgaven vil ikke være lavere enn 0.</p>" +
          "<p><i>Figure 1: Hemmelig-modell</i></p>",
        avvik: null,
        losning: [
          "Les først figuren: AK har nøkkelen Agn og flerverdiattributtet Asso. BO er svak med delvis nøkkel Boks og eies av AK gjennom den identifiserende relasjonen RAB.",
          "RACB er ternær: M ved AK, 1 ved CU og N ved BO, og BO har dobbel strek (total deltakelse).",
          "Svarene blir JA, NEI, JA, JA, NEI."
        ],
        tips: [
          "Med +1/−1 lønner det seg ikke å gjette. Hopp over en påstand du er usikker på.",
          "Total deltakelse sier noe om entiteten på *den* siden streken er dobbel. AK har enkel strek mot RAB, så en AK trenger ingen BO.",
          "Et flerverdiattributt kan ha null verdier. Dobbel oval betyr «mange», ikke «minst én»."
        ],
        del1: {
          type: "janei",
          regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
          intro: "<p>Organisasjonen trenger hjelp til å vite hvilke av disse setningene er sanne i henhold til ER-diagrammet. Kryss av “JA” dersom du mener setningen er modellert av ER-diagrammet, og “NEI” hvis ikke.</p>",
          items: [
            { s: "En AK er unikt identifisert med dens Agn-verdi.", answer: true,
              explain: "<p>Agn er understreket med heltrukken linje på den vanlige entiteten AK, så det er nøkkelen til AK.</p>" },
            { s: "Alle AK er relatert til minst én BO.", answer: false,
              explain: "<p>Streken fra AK til RAB er enkel, så AK har partiell deltakelse. En AK kan finnes uten noen BO. Det er BO som må ha en AK, ikke omvendt.</p>" },
            { s: "Dersom det finnes en BO i databasen, vil det også finnes en CU.", answer: true,
              explain: "<p>BO har dobbel strek mot RACB, altså total deltakelse. Hver BO må være med i minst én RACB-forekomst, og hver slik forekomst har en CU. Da må det finnes minst én CU.</p>" },
            { s: "Gitt en CU og en BO, så kan disse være RACB-relatert til mange AK.", answer: true,
              explain: "<p>I en ternær relasjon leser vi tallet ved AK slik: gitt én kombinasjon av de to andre (CU og BO), hvor mange AK kan de knyttes til? Ved AK står M, altså mange.</p>" },
            { s: "En AK må alltid ha minst én Asso-verdi.", answer: false,
              explain: "<p>Asso er et flerverdiattributt (dobbel oval). Det betyr at det kan være mange verdier, men diagrammet krever ikke at det finnes noen.</p>" }
          ]
        }
      },

      /* ================= 1.3 ================= */
      {
        key: "H2023-1.3", year: "H2023", oppgave_nr: "Oppgave 1.3", ark: "Realisering:",
        title: "Realiser nettavis-modellen", points: 10, block: "realisering",
        tema: ["realisering", "1:N som fremmednøkkel", "M:N", "rekursiv relasjon", "flerverdiattributt", "flere kandidatnøkler", "utledbart attributt"],
        ordrett: true,
        oppgave: REALISERING_INSTRUKS,
        avvik: "Sensorveiledningens løsningsforslag har noen skrivefeil: «Atrikkel», «jounralist»/«Jounralist» og én gang «(tema) -&gt; Tema(tittel)» der det skal være Tema(navn), fordi TEMA har nøkkelen Navn og ikke noe attributt som heter tittel. Senere i samme tekst står det riktig Tema(navn). Vårt svar bruker Tema(navn).",
        losning: [
          "Vanlige entiteter først: Journalist, Artikkel, Redaktør og Tema, hver med nøkkelen fra figuren. Epost hos JOURNALIST er stiplet (utledbart) og tas ikke med.",
          "Redaktør har to kandidatnøkler: {epost} og {rednr, avisnr}. Det sammensatte attributtet RID blir til bladattributtene rednr og avisnr. Velg én som primærnøkkel, for eksempel epost fordi den er kort.",
          "Det finnes ingen svake entiteter og ingen 1:1-relasjoner i figuren.",
          "1:N: GODKJENT blir fremmednøkkel til Redaktør i Artikkel, sammen med relasjonsattributtet Dato. Artikkel har total deltakelse, så kolonnen blir aldri NULL. INNEN blir også fremmednøkkel til Tema i Artikkel. Den kan være NULL fordi deltakelsen er partiell, og dette valget skal begrunnes.",
          "M:N: SKREVET, FOR og RELATERT blir egne relasjoner der begge fremmednøklene til sammen er primærnøkkel. RELATERT peker to ganger på Artikkel, så den trenger to forskjellige kolonnenavn.",
          "Flerverdiattributtet Nøkkelord blir en egen relasjon med artikkelens nøkkel og ordet, og begge er med i nøkkelen."
        ],
        tips: [
          "Skriv en kort begrunnelse for hvert valg (fremmednøkkel eller egen tabell). Hver manglende forklaring koster 0,5.",
          "Marker kandidatnøkler, primærnøkkel og fremmednøkler på hver relasjon. Hver manglende markering koster 0,5.",
          "Utledbare attributter skal ikke realiseres. Ta bare med bladene av et sammensatt attributt.",
          "Ved en rekursiv relasjon (RELATERT) trenger du to kolonner med ulike navn som begge peker på Artikkel(aid)."
        ],
        del1: null
      },

      /* ================= 2.1 ================= */
      {
        key: "H2023-2.1", year: "H2023", oppgave_nr: "Oppgave 2.1", ark: "Flervalg",
        title: "Hvor mange rader? (fem spørringer)", points: 10, block: "sql",
        tema: ["DISTINCT", "LIMIT", "NULL-sammenligning", "NOT EXISTS", "EXCEPT ALL"],
        ordrett: true,
        oppgave: "<p>Oppgavene i denne delen er om SQL. Alle oppgavene vil bruke det samme databaseskjemaet, og en beskrivelse av dette er vedlagt som PDF for hver oppgave.</p>" +
          "<p>Du må gjerne inkludere kommentarer i spørringene (gjøres med “–” i SQL). Dersom det er uklarheter eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar om hvilke antagelser og tolkinger du gjør.</p>" +
          "<p><b>2.1 Flervalg (10)</b></p>" +
          "<p>Anta at databasen inneholder nøyaktig de dataene som er vist i eksempel-dataene i den vedlagte PDFen. For hver spørring under, oppgi hvor mange rader det er i resultatet. Hvert riktig svar gir 2 poeng, mens hvert uriktige svar gir -0.5 poeng. Blankt svar/ubesvart gir 0 poeng. Laveste poengsum på hele oppgaven er 0.</p>",
        avvik: null,
        losning: [
          "Kjør hver spørring for hånd på eksempeldataene i vedlegget.",
          "1: sensorene 5–8 ligger i områdene 3, 3, 6 og 4. DISTINCT gir {3, 4, 6}, altså 3 rader.",
          "2: område 1 har sensorene 1, 2 og 3. LIMIT 4 kutter ingenting, så svaret er 3.",
          "3: bare radene med (0, 0) og (0.7, 0.7) gir sann. Rader med NULL gir NULL og faller bort, så svaret er 2.",
          "4: bare Trondheim (oid 5) har ingen sensor, så svaret er 1.",
          "5: {1,1,1,2,3,3,6,4} EXCEPT ALL {1,2,3,4,5,6} gir {1,1,3}, altså 3 rader."
        ],
        tips: [
          "Med +2/−0,5 lønner det seg å svare selv om du er usikker.",
          "LIMIT er bare en øvre grense. Den legger aldri til rader.",
          "EXCEPT ALL trekker fra én forekomst per forekomst på høyre side. Vanlig EXCEPT fjerner duplikater først."
        ],
        del1: {
          type: "radantall",
          regel: { riktig: 2, feil: -0.5, blankt: 0, min: 0 },
          intro: "<p>Anta at databasen inneholder nøyaktig de dataene som er vist i eksempel-dataene i den vedlagte PDFen. For hver spørring under, oppgi hvor mange rader det er i resultatet. Hvert riktig svar gir 2 poeng, mens hvert uriktige svar gir -0.5 poeng. Blankt svar/ubesvart gir 0 poeng. Laveste poengsum på hele oppgaven er 0.</p>",
          items: [
            { q: "<p>1.</p>", sql: "SELECT DISTINCT oid\nFROM sensor\nWHERE sid >= 5;",
              options: ["0", "1", "2", "3", "4"], answer: 3,
              explain: "<p>Sensorene med sid ≥ 5 er 5, 6, 7 og 8, med oid 3, 3, 6 og 4. DISTINCT fjerner den doble 3-eren, så vi står igjen med 3, 6 og 4: tre rader.</p>" },
            { q: "<p>2.</p>", sql: "SELECT *\nFROM sensor\nWHERE oid = 1\nLIMIT 4;",
              options: ["0", "1", "2", "3", "4"], answer: 3,
              explain: "<p>Bare sensorene 1, 2 og 3 ligger i område 1. LIMIT 4 betyr «høyst 4», så resultatet har tre rader.</p>" },
            { q: "<p>3.</p>", sql: "SELECT * FROM måling\nWHERE nedbør = vind;",
              options: ["0", "1", "2", "3", "4"], answer: 2,
              explain: "<p>Gå gjennom radene: bare (sid 3, 09:01:30) med 0 = 0 og (sid 4, 03:11:01) med 0.7 = 0.7 er like. Radene der nedbør eller vind er NULL, gir NULL (ukjent) i sammenligningen, og WHERE beholder bare rader der betingelsen er sann. Svaret er to rader.</p>" },
            { q: "<p>4.</p>", sql: "SELECT *\nFROM område AS o\nWHERE NOT EXISTS (\n  SELECT * FROM sensor AS s\n  WHERE s.oid = o.oid\n);",
              options: ["0", "1", "2", "3", "4"], answer: 1,
              explain: "<p>Spørringen finner områder uten sensorer. Sensorene ligger i områdene 1, 2, 3, 4 og 6. Bare Trondheim (oid 5) mangler sensor, så svaret er én rad.</p>" },
            { q: "<p>5.</p>", sql: "SELECT oid FROM sensor\nEXCEPT ALL\nSELECT oid FROM område;",
              options: ["0", "1", "2", "3", "4"], answer: 3,
              explain: "<p>Venstre side er multimengden {1, 1, 1, 2, 3, 3, 6, 4}. Høyre side har hver oid 1–6 én gang. EXCEPT ALL fjerner én forekomst av hver verdi som finnes til høyre, og da blir {1, 1, 3} igjen. Det er tre rader. Uten ALL ville svaret vært 0.</p>" }
          ]
        }
      },

      /* ================= 2.2 ================= */
      {
        key: "H2023-2.2", year: "H2023", oppgave_nr: "Oppgave 2.2", ark: "Vedlikehold i Oslo",
        title: "Vedlikeholdsdatoer i Oslo", points: 5, block: "sql",
        tema: ["JOIN", "WHERE", "ORDER BY"],
        ordrett: true,
        oppgave: "<p>Skriv en spørring som finner alle vedlikeholdsdatoer for sensorer i Oslo sortert kronologisk.</p>",
        avvik: null,
        losning: [
          "Datoene står i sensor, mens navnet «Oslo» står i område. Koble tabellene på oid.",
          "Filtrer på o.navn = 'Oslo', ikke på et oid-tall du har funnet i eksempeldataene.",
          "Sorter stigende på vedlikeholdt. Det er det «kronologisk» betyr."
        ],
        tips: [
          "Ikke hardkod oid = 1. Spørringen skal virke på alle data, ikke bare på eksempeldataene.",
          "Glemmer du ORDER BY, koster det 2 poeng."
        ],
        del1: null
      },

      /* ================= 2.3 ================= */
      {
        key: "H2023-2.3", year: "H2023", oppgave_nr: "Oppgave 2.3", ark: "Gjennomsnittstemperatur i Bærum",
        title: "Snittemperatur i Bærum ved regn eller vind", points: 5, block: "sql-videre",
        tema: ["avg", "join over tre tabeller", "AND/OR og parenteser"],
        ordrett: true,
        oppgave: "<p>Skriv en spørring som finner gjennomsnittstemperaturen i Bærum når det regner (nedbør er større enn 0) eller blåser mye (mer enn 5 m/s vind).</p>",
        avvik: null,
        losning: [
          "Målingene står i måling, og områdenavnet står i område. Gå via sensor: måling → sensor → område.",
          "Filtrer på områdenavnet og på værforholdet. Sett parentes rundt OR-delen, ellers binder AND sterkest og du får med målinger fra hele landet.",
          "Bruk avg(temp) uten GROUP BY. Hele svaret er ett tall."
        ],
        tips: [
          "«nedbør &gt; 0 OR vind &gt; 5» må stå i parentes når den kombineres med AND.",
          "avg hopper over NULL-verdier i temp, så du trenger ikke filtrere dem bort selv."
        ],
        del1: null
      },

      /* ================= 2.4 ================= */
      {
        key: "H2023-2.4", year: "H2023", oppgave_nr: "Oppgave 2.4", ark: "Få sensorer",
        title: "Tre områder med færrest sensorer per km²", points: 5, block: "sql-videre",
        tema: ["LEFT JOIN", "count(kolonne)", "GROUP BY", "ORDER BY", "LIMIT"],
        ordrett: true,
        oppgave: "<p>Skriv en spørring som finner navn på de tre områdene med færrest sensorer per kvadratkilometer Det kan forekomme områder uten sensorer, og disse skal også med. Hint: Dersom et område har areal A og N sensorer vil det ha N/A sensorer per kvadratkilometer</p>",
        avvik: null,
        losning: [
          "Områder uten sensorer skal med. Bruk derfor LEFT JOIN fra område til sensor.",
          "Tell med count(s.sid). Den gir 0 for et område uten sensorer, mens count(*) ville gitt 1.",
          "Grupper per område og sorter stigende på count(s.sid) / o.areal. Ta de tre første med LIMIT 3.",
          "På eksempeldataene blir svaret Trondheim (0), Gjøvik (≈ 0,00149) og Kristiansand (≈ 0,00155)."
        ],
        tips: [
          "INNER JOIN mister områdene uten sensorer. Dette er nøyaktig det oppgaven advarer mot.",
          "count(*) etter LEFT JOIN teller NULL-raden som én sensor.",
          "Ta med areal (eller bare oid) i GROUP BY. Det er nok å gruppere på primærnøkkelen."
        ],
        del1: null
      },

      /* ================= 2.5 ================= */
      {
        key: "H2023-2.5", year: "H2023", oppgave_nr: "Oppgave 2.5", ark: "Analyse",
        title: "VIEW som fyller inn manglende vind", points: 10, block: "sql-videre",
        tema: ["CREATE VIEW", "UNION ALL", "korrelert delspørring", "avg", "IS NULL", "::date"],
        ordrett: true,
        oppgave: "<p>I målingene kan det som sagt være noen NULL-verdier, og disse kan gi problemer i enkelte analyser hvor dataene brukes. Skriv derfor en SQL-kommando som lager et VIEW med navn <code>analyse_vind</code> som inneholder <code>sid</code>, <code>tidspunkt</code> og <code>vind</code>-verdiene fra <code>måling</code>-tabellen, men som erstatter alle NULL-verdier i <code>vind</code>-kolonnen med gjennomsnittet av målingene (som ikke er NULL) fra samme sensor på samme dag.</p>" +
          "<p>Innholdet i viewet kan f.eks. se slik ut (om dataene er slik som i eksempeldataene):</p>" +
          "<pre> sid |      tidspunkt      | vind\n-----+---------------------+------\n   2 | 2023-12-02 12:00:00 |  0.3\n   2 | 2023-12-02 12:01:00 |  0.4\n   3 | 2023-11-30 09:01:30 |    0\n   3 | 2023-11-30 09:04:01 |  4.1\n   3 | 2023-12-01 11:57:46 |  3.2\n   7 | 2023-10-16 16:11:47 |  7.9\n   7 | 2023-10-16 16:11:59 |  7.8\n   7 | 2023-10-17 16:15:22 |  7.8\n   8 | 2023-11-09 22:48:12 |  0.5\n   4 | 2023-11-16 03:11:01 |  0.7\n   4 | 2023-11-16 04:11:02 |  0.8\n   2 | 2023-12-02 12:02:11 | 0.35</pre>" +
          "<p>Hint: Du kan omgjøre et timestamp til en date ved å caste den til date, altså <code>tidspunkt::date</code> henter ut dato-verdien i tidspunkt.</p>",
        avvik: null,
        losning: [
          "Del radene i to: de som har vind, og de som mangler vind. Slå dem sammen med UNION ALL.",
          "Den første delen tar sid, tidspunkt og vind rett fra måling der vind IS NOT NULL.",
          "Den andre delen tar radene der vind IS NULL og regner ut erstatningen med en korrelert delspørring: snittet av vind for samme sid der tidspunkt::date er lik.",
          "avg ignorerer NULL, så delspørringen bruker bare målte verdier. Finnes det ingen andre målinger den dagen, blir snittet NULL.",
          "Pakk det hele inn i CREATE VIEW analyse_vind AS …."
        ],
        tips: [
          "Bruk UNION ALL, ikke UNION. UNION fjerner like rader, og det er ikke meningen her.",
          "Sammenlign datoen med ::date. Ellers sammenligner du hele tidspunktet, og da finner du bare målingen selv.",
          "Bruk IS NULL og IS NOT NULL. Sammenligningen «= NULL» gir alltid NULL (ukjent) og velger ingen rader.",
          "Eksempelutskriften mangler raden for sid 2 den 4. desember, der det ikke finnes noe snitt. Begge varianter står i sensorveiledningen. Skriv hva du har valgt i en kommentar."
        ],
        del1: null
      },

      /* ================= 2.6 ================= */
      {
        key: "H2023-2.6", year: "H2023", oppgave_nr: "Oppgave 2.6", ark: "Nedbørsmengder",
        title: "Område med høyest snittnedbør per dag i 2023", points: 10, block: "sql-videre",
        tema: ["WITH", "GROUP BY i to nivåer", "HAVING", "::date", "ORDER BY DESC", "LIMIT"],
        ordrett: true,
        oppgave: "<p>Skriv en spørring som finner navnet på område med høyest gjennomsnittlig nedbørsmengde per dag i 2023. Ta kun med områder og dager som har mer enn 10 målinger. Du kan i denne oppgaven anta at alle målinger på nedbør har en verdi (altså ikke er NULL). Du kan også anta at summen av alle nedbør-verdier for et område for en dag er den totale nedbørsmengden for det område den dagen. Hint: Du kan bruke <code>tidspunkt::date</code> for å hente ut datoen/dagen for en måling.</p>",
        avvik: "Sensorveiledningens løsningsforslag avgrenser året med «m.tidspunkt &lt;= '2023-12-31'::date». Datoen blir da tolket som midnatt, så målinger senere på nyttårsaften faller bort. Vårt svar bruker derfor «&lt; '2024-01-01'».",
        losning: [
          "Steg 1 (WITH): regn ut total nedbør per område per dag. Koble måling til sensor for å få oid, begrens til 2023, grupper på oid og tidspunkt::date, og behold med HAVING bare grupper med mer enn 10 målinger.",
          "Steg 2 (WITH): ta snittet av dagstotalene per område.",
          "Steg 3: koble til område for å få navnet, sorter synkende på snittet og ta første rad.",
          "Oppgaven kan også leses som «områder med mer enn 10 dager med målinger». Sensor gir full uttelling for begge tolkningene, men skriv tolkningen din i en kommentar."
        ],
        tips: [
          "To nivåer med aggregering (sum per dag, så snitt per område) krever to steg. Du kan ikke skrive avg(sum(…)) i samme SELECT.",
          "Betingelsen «mer enn 10 målinger» gjelder grupper og hører derfor hjemme i HAVING, ikke i WHERE.",
          "Husk DESC når du skal ha den høyeste verdien.",
          "Avgrens året med et halvåpent intervall (fra og med 1. januar 2023 til, men ikke med, 1. januar 2024)."
        ],
        del1: null
      },

      /* ================= 2.7 ================= */
      {
        key: "H2023-2.7", year: "H2023", oppgave_nr: "Oppgave 2.7", ark: "Programmering med SQL",
        title: "Oppdater vedlikeholdsdato uten SQL-injection", points: 5, block: "sql-programmering",
        tema: ["Python/Java", "UPDATE", "parametrisert spørring", "SQL-injection", "commit"],
        ordrett: true,
        oppgave: "<p>Metrologisk Institutt vedlikeholder alle sensorer med jevne mellomrom, og alle sensorer i et område blir vanligvis vedlikeholdt på samme dag.</p>" +
          "<p>I denne oppgaven skal du derfor lage en funksjon/metode i Java eller Python som er del av et større program som vedlikeholderne bruker. Metoden/funksjonen du lager skal brukes for å oppdatere <code>vedlikeholdt</code>-datoene i <code>sensor</code>-tabellen til dagens dato etter en slik vedlikeholdsrunde. Du kan velge om du ønsker å bruke Python eller Java i denne oppgaven. For Python skal funksjonens signatur se slik ut:</p>" +
          "<pre>def vedlikeholdt(conn, omrade):\n    # TODO</pre>" +
          "<p>For Java ser metode-signaturen slik ut:</p>" +
          "<pre>void vedlikeholdt(Connection conn, String omrade) throws SQLException {\n    // TODO\n}</pre>" +
          "<p>Funksjonen/metoden tar to argumenter, et tilkoblingsobjekt <code>conn</code> med en aktiv tilkobling til databasen, samt en streng-verdi <code>omrade</code> fra brukeren som inneholder navnet på område som vedlikeholderen har gått runde i. Funksjonen skal så lage og eksekvere en SQL-kommando som oppdaterer <code>vedlikeholdt</code>-datoen til alle sensorer i det angitte område til dagens dato. (I SQL er dagens dato tilgjengelig via <code>current_date</code>.)</p>" +
          "<p>Du trenger ikke håndtere feilmeldinger (Exception) eller liknende i oppgaven, men løsningen din skal ikke være sårbar for SQL-injection-angrep via <code>omrade</code>-strengen.</p>",
        avvik: null,
        losning: [
          "Lag en UPDATE på sensor som setter vedlikeholdt = current_date for sensorene i området. Sensoren kjenner bare oid, så finn oid med en delspørring på område.navn.",
          "Send områdenavnet som parameter, ikke ved å lime det inn i strengen: %s i psycopg (Python) eller ? i en PreparedStatement (Java).",
          "Kjør kommandoen og gjør commit, slik at endringen blir lagret."
        ],
        tips: [
          "Strengkonkatenering (\"… navn = '\" + omrade + \"'\") gjør koden sårbar for SQL-injection. Det er hele poenget med oppgaven.",
          "Bruk IN i stedet for = foran delspørringen hvis flere områder kan ha samme navn. Navn er ikke UNIQUE i skjemaet.",
          "I psycopg skal parameterne være en tuppel: (omrade,) med komma."
        ],
        del1: null
      },

      /* ================= 3.1 ================= */
      {
        key: "H2023-3.1", year: "H2023", oppgave_nr: "Oppgave 3.1", ark: "Nøkler (flervalg)",
        title: "Hvilke attributter er nøkkelattributter?", points: 5, block: "fd",
        tema: ["kandidatnøkler", "nøkkelattributt", "tillukning"],
        ordrett: true,
        oppgave: "<p>Gitt følgende relasjon</p><p>R(A, B, C, D, E)</p><p>med følgende FDer:</p><ol><li>A → B</li><li>B → C</li><li>C → A</li><li>C → D</li></ol>" +
          "<p>Angi for hvert attributt hvorvidt det er et nøkkelattributt (JA) eller ikke (NEI). Hvert riktige svar gir 1 poeng, mens hvert gale svar gir -1 poeng. Ubesvart gir alltid 0 poeng. Laveste poengsum for hele oppgaven er 0.</p>",
        avvik: null,
        losning: [
          "E står aldri på en høyreside, så E må være med i alle kandidatnøkler.",
          "A, B og C bestemmer hverandre i en ring (A → B → C → A), og C → D gir D. Da er A⁺ = B⁺ = C⁺ = ABCD.",
          "Kandidatnøklene blir AE, BE og CE. D står bare på høyresider og er ikke med i noen av dem.",
          "Svar: A JA, B JA, C JA, D NEI, E JA."
        ],
        tips: [
          "Nøkkelattributt betyr «med i minst én kandidatnøkkel», ikke «med i primærnøkkelen».",
          "Attributter som aldri står på høyresiden, er med i alle nøkler. Attributter som bare står på høyresiden, er med i ingen."
        ],
        del1: {
          type: "janei",
          regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
          intro: "<p>Er attributtet et nøkkelattributt i R? (R(A, B, C, D, E) med FD-ene A → B, B → C, C → A, C → D.)</p>",
          items: [
            { s: "A", answer: true, explain: "<p>AE⁺ = ABCDE, og verken A eller E alene er nok. AE er en kandidatnøkkel, så A er et nøkkelattributt.</p>" },
            { s: "B", answer: true, explain: "<p>B⁺ = ABCD, så BE⁺ = ABCDE. BE er en kandidatnøkkel.</p>" },
            { s: "C", answer: true, explain: "<p>C⁺ = ABCD, så CE er en kandidatnøkkel.</p>" },
            { s: "D", answer: false, explain: "<p>D står bare på høyresiden (C → D) og bestemmer ingenting. Ingen minimal nøkkel trenger D, så D er ikke et nøkkelattributt.</p>" },
            { s: "E", answer: true, explain: "<p>E står aldri på en høyreside, så ingen kan utlede E. Den må være med i alle kandidatnøkler.</p>" }
          ]
        }
      },

      /* ================= 3.2 ================= */
      {
        key: "H2023-3.2", year: "H2023", oppgave_nr: "Oppgave 3.2", ark: "Funksjonelle avhengigheter (flervalg)",
        title: "Fyll inn «?» ut fra FD-ene", points: 5, block: "fd",
        tema: ["FD i en instans", "funksjonell avhengighet"],
        ordrett: true,
        oppgave: "<p>Gitt følgende relasjon:</p><p>R(A, B, C, D, E, F)</p><p>med følgende funksjonelle avhengigheter:</p><ol><li>AB → C</li><li>B → D</li><li>D → E</li><li>F → A</li><li>E → B</li></ol><p>og med følgende tupler:</p>" +
          "<table class=\"et-tab\"><thead><tr><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr></thead><tbody>" +
          "<tr><td>1</td><td>2</td><td>?</td><td>4</td><td>5</td><td>6</td></tr>" +
          "<tr><td>?</td><td>3</td><td>4</td><td>8</td><td>9</td><td>7</td></tr>" +
          "<tr><td>1</td><td>2</td><td>5</td><td>?</td><td>5</td><td>7</td></tr>" +
          "<tr><td>2</td><td>3</td><td>5</td><td>8</td><td>?</td><td>1</td></tr>" +
          "<tr><td>1</td><td>?</td><td>5</td><td>4</td><td>5</td><td>8</td></tr></tbody></table>" +
          "<p>I tuplene over er det én verdi per attributt som er erstattet med <code>?</code>, og din oppgave er å finne riktig verdi basert på de andre verdiene og de funksjonelle avhengighetene. Altså, for hvert attributt, angi verdien som dens <code>?</code> må erstattes med for at relasjonen skal være riktig i henhold til de funksjonelle avhengighetene:</p>" +
          "<p>Hvert riktige svar gir 1 poeng, ubesvart gir 0 og uriktig svar gir -0.5 poeng. Laveste poengsum på hele oppgaven er 0.</p>",
        avvik: "Sensorveiledningens utfylte tabell viser A = 3 i fjerde rad, men arket har A = 2 der. Det må være en skrivefeil, fordi den raden ikke har noen «?» i A. Svarene i sensorveiledningen (1, 2, 5, 4, 9) stemmer med arket.",
        losning: [
          "For hver «?»: finn en FD med det ukjente attributtet på høyresiden der venstresiden er kjent i raden.",
          "Let så etter en annen rad med samme venstreside. Da må høyresiden også være lik.",
          "A: F → A, og F = 7 finnes også i rad 3 med A = 1. C: AB → C, og AB = (1,2) finnes i rad 1 med C = 5 (rad 3). D: B → D, og B = 2 gir D = 4. E: D → E, og D = 8 gir E = 9. B: E → B, og E = 5 gir B = 2."
        ],
        tips: [
          "Velg en FD der *bare* høyresiden er ukjent. Venstresiden må være kjent i raden.",
          "Med +1/−0,5 lønner det seg å svare selv om du er litt usikker."
        ],
        del1: {
          type: "verdi",
          regel: { riktig: 1, feil: -0.5, blankt: 0, min: 0 },
          intro: "<p>Altså, for hvert attributt, angi verdien som dens <code>?</code> må erstattes med for at relasjonen skal være riktig i henhold til de funksjonelle avhengighetene:</p>",
          items: [
            { q: "<p>A</p>", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], answer: 0,
              explain: "<p>«?» i A står i raden med F = 7. Raden (1, 2, 5, ?, 5, 7) har også F = 7 og A = 1. F → A gir A = 1.</p>" },
            { q: "<p>B</p>", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], answer: 1,
              explain: "<p>«?» i B står i raden med E = 5. Første rad har E = 5 og B = 2. E → B gir B = 2.</p>" },
            { q: "<p>C</p>", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], answer: 4,
              explain: "<p>«?» i C står i raden med A = 1, B = 2. Tredje rad har samme A og B og C = 5. AB → C gir C = 5.</p>" },
            { q: "<p>D</p>", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], answer: 3,
              explain: "<p>«?» i D står i raden med B = 2. Første rad har B = 2 og D = 4. B → D gir D = 4.</p>" },
            { q: "<p>E</p>", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], answer: 8,
              explain: "<p>«?» i E står i raden med D = 8. Andre rad har D = 8 og E = 9. D → E gir E = 9.</p>" }
          ]
        }
      },

      /* ================= 3.3 ================= */
      {
        key: "H2023-3.3", year: "H2023", oppgave_nr: "Oppgave 3.3", ark: "Tapsfri dekomposisjon",
        title: "Dekomponer R(A,B,C,D,E) tapsfritt til BCNF", points: 10, block: "normalisering",
        tema: ["BCNF-algoritmen", "tillukning", "kandidatnøkler", "tapsfri dekomposisjon"],
        ordrett: true,
        oppgave: "<p>Gitt følgende relasjon:</p><p>R(A, B, C, D, E)</p><p>med kandidatnøklene AB, BC, samt følgende funksjonelle avhengigheter:</p><ol><li>B → E</li><li>AB → C</li><li>E → D</li><li>C → A</li></ol>" +
          "<p>Dekomponer R tapsfritt til BCNF. Vis stegene du gjør og list opp kandidatnøkler og funksjonelle avhengigheter på alle relasjonene underveis.</p>",
        avvik: "Sensorveiledningens løsningsforslag oppgir KN E for S12(E, B) med FD 1 (B → E). Det stemmer ikke. E⁺ = ED, så E bestemmer ikke B. Kandidatnøkkelen i S12 er B. Vårt svar bruker B.",
        losning: [
          "Finn en FD som bryter BCNF, altså en der venstresiden ikke er en supernøkkel. B → E, E → D og C → A bryter alle.",
          "Del på én av dem med algoritmen: S₁ = X⁺ og S₂ = X ∪ (resten). Oppgi kandidatnøkler og FD-er for hver del.",
          "Fortsett med delene som fortsatt bryter BCNF. Tre splitter trengs til sammen.",
          "Sluttresultatet blir (E, D), (B, E), (C, A) og (B, C), uansett hvilken bryter du starter med."
        ],
        tips: [
          "Sensor gir 5 poeng for første splitt og 2,5 for hver av de to neste. Hver splitt må ha nøkler og FD-er.",
          "Vis tillukningen hver gang. Feil tillukning koster 1 poeng.",
          "Uten forklaring trekkes det 3 poeng. Skriv én setning per steg om hvorfor du deler.",
          "Ta bare med de FD-ene som har alle attributtene sine i delrelasjonen."
        ],
        del1: null
      }
    ]
  };

  /* =====================================================================
     PERFEKTE SVAR (våre egne) + sensorveiledning ordrett
     ===================================================================== */

  IN.PERFEKT["H2023-1.1"] = {
    type: "skjonn",
    svar: [
      { del: "Modell",
        tekst: "<p>Fire entiteter: KUNDE, KONTO, FAKTURA og den svake entiteten TRANSAKSJON. Kommentarer som står på skissearket:</p><ul>" +
          "<li>Punkt 2: Kontonr er en sammensatt nøkkel i to nivåer. Type er utledbar (stiplet oval).</li>" +
          "<li>Punkt 3: EIER (1 ved KUNDE, N ved KONTO, dobbel strek ved KONTO). DISPONERER (M:N, partiell begge veier).</li>" +
          "<li>Punkt 4: TRANSAKSJON er svak med delvis nøkkel Tidspunkt og to identifiserende relasjoner, FRA og TIL, begge mot KONTO (1 ved KONTO, N og dobbel strek ved TRANSAKSJON). Antakelse: fra-konto og til-konto er forskjellige, som teksten sier («til en annen konto»).</li>" +
          "<li>Punkt 5: UTFØRTE (1 ved KUNDE, N og dobbel strek ved TRANSAKSJON).</li>" +
          "<li>Punkt 6: SENDT_TIL (1 ved KUNDE, N og dobbel strek ved FAKTURA).</li>" +
          "<li>Punkt 7: BETALER (1 ved FAKTURA, 1 ved TRANSAKSJON, partiell på begge sider).</li></ul>",
        er: ER_BANK_SVAR,
        poeng: ["Punkt 1: KUNDE med nøkkel og navn (2p)", "Punkt 2: KONTO med sammensatt nøkkel og utledbar type (2p)",
                "Punkt 3: EIER og DISPONERER med riktige tall og streker (2p)", "Punkt 4: svak TRANSAKSJON med FRA og TIL (3p)",
                "Punkt 5: UTFØRTE (2p)", "Punkt 6: FAKTURA og SENDT_TIL (2p)", "Punkt 7: BETALER 1:1 (2p)"] }
    ],
    hvorfor: {
      eli5: "<p>Tenk deg et arkivskap for banken. Hver kunde har sin egen mappe, og hver konto har sitt eget kort. En overføring har ikke noe eget nummer. Du finner den igjen bare ved å si «fra denne kontoen, til den kontoen, akkurat da». Derfor henger den fast i to kontokort, og den kan ikke stå alene i arkivet.</p>",
      normal: "<p>Den viktigste biten er punkt 4. En transaksjon har ingen egen nøkkel. Den blir unik først når vi kjenner fra-kontoen, til-kontoen og tidspunktet. Da er den en svak entitet med to eiere. Vi tegner den som dobbelt rektangel, kobler den med to doble romber (FRA og TIL) til KONTO, og stiplet-understreker Tidspunkt. Resten er vanlige binære relasjoner, der tekstens «nøyaktig én», «høyst én» og «trenger ikke» oversettes til 1/N og enkel/dobbel strek.</p>",
      teknisk: "<p>«Kombinasjonen av tidspunkt, til-konto og fra-konto er unik» sier at TRANSAKSJON identifiseres delvis av egne attributter (Tidspunkt) og delvis av to eiere. Eierne er samme entitetstype i to roller. Riktig modell er derfor én KONTO-entitet med to identifiserende relasjoner. Hver av dem har 1 på eiersiden og N med total deltakelse på den svake siden, slik en identifiserende relasjon alltid skal ha. To kopier av KONTO ville betydd to forskjellige mengder kontoer, og sensor trekker for det.</p>" +
        "<p>Kardinalitetene leses fra den andre siden: «hver konto eies av nøyaktig én kunde» gir 1 ved KUNDE og dobbel strek ved KONTO. BETALER er 1:1 og partiell på begge sider, fordi teksten sier «høyst én» begge veier og «trenger ikke» begge veier. Kontonummeret modelleres som et sammensatt nøkkelattributt. Bare forelderen Kontonr er understreket, og Type tegnes stiplet fordi den kan utledes fra nummeret.</p>"
    },
    sensor: {
      deler: [
        { del: "Fasit", fasit: "<p>Løsningsforslag</p><p>Se Figur 1.</p>",
          kriterier: "<p>Sensorveiledning</p><ul>" +
            "<li>Generelt, 2 poeng per punkt i oppgaveteksten, men 3 poeng for punkt 4 (den svake entiteten)</li>" +
            "<li>-0.5 for feil plassering av total deltakelse eller riktig kardinalitet, men feil plassering</li>" +
            "<li>-1 for feil kardinalitet eller manglende total deltakelse</li>" +
            "<li>-2 for manglende kardinalitet på hele relasjonen</li>" +
            "<li>-1 for manglende attributt-markeringer (nøkkel eller multi-valued)</li>" +
            "<li>-1 for manglende/feil plassering av vanlig attributt</li>" +
            "<li>-2 for både manglende markering av svak entitet og identifiserende relasjon (-1 for kun å mangle én av dem)</li>" +
            "<li>-2 for å dele KONTO opp i to entiteter (en TIL-KONTRO og en FRA-KONTO)</li></ul>" }
      ],
      merknad: "Figur 1 (Bank-modell) i sensorveiledningen er et bilde og gjengis ikke her. Den har samme oppbygning som vårt svar, men kaller relasjonen mellom KUNDE og FAKTURA «TIL» og relasjonen mellom FAKTURA og TRANSAKSJON «BETALT_AV». «TIL-KONTRO» er ordrett fra sensorveiledningen (skrivefeil for TIL-KONTO)."
    }
  };

  IN.PERFEKT["H2023-1.3"] = {
    type: "skjonn",
    svar: [
      { del: "Skjema",
        tekst: "<p>Algoritmen i kursets rekkefølge: entiteter, svake entiteter (ingen), 1:1 (ingen), 1:N, M:N og flerverdiattributter. Valgene:</p><ul>" +
          "<li><b>Utledbart attributt:</b> Epost hos JOURNALIST er stiplet og realiseres ikke.</li>" +
          "<li><b>Sammensatt nøkkel:</b> RID blir til rednr og avisnr. Redaktør får to kandidatnøkler. Vi velger epost som primærnøkkel fordi det er én kolonne og derfor enklere å peke på.</li>" +
          "<li><b>GODKJENT (1:N):</b> fremmednøkkel i Artikkel. Hver artikkel har total deltakelse, så kolonnen er aldri NULL, og datoen for godkjenningen følger med som godkjent_dato.</li>" +
          "<li><b>INNEN (1:N):</b> fremmednøkkel i Artikkel. Deltakelsen er partiell, så tema kan være NULL. Vi antar at de fleste artikler har et tema, slik at dette gir færre tabeller uten mange NULL-verdier. Hadde få artikler hatt tema, ville en egen relasjon Innen(aid, tema) vært bedre.</li>" +
          "<li><b>SKREVET, FOR, RELATERT (M:N):</b> egne relasjoner der nøkkelen er begge fremmednøklene sammen.</li>" +
          "<li><b>Nøkkelord (flerverdi):</b> egen relasjon der begge attributtene er nøkkel.</li></ul>" +
          "<p>Understrek = kandidatnøkkel, fet = primærnøkkel. Her er det skrevet som KN/PN/FN under hver relasjon.</p>",
        skjema: "Journalist(brukernavn, navn)\n  KN/PN: {brukernavn}\n\n" +
          "Redaktør(epost, rednr, avisnr, navn)\n  KN: {epost}, {rednr, avisnr}\n  PN: {epost}\n\n" +
          "Tema(navn, beskrivelse)\n  KN/PN: {navn}\n\n" +
          "Artikkel(aid, tittel, innhold, dato, godkjent_av, godkjent_dato, tema)\n  KN/PN: {aid}\n  FN: Artikkel(godkjent_av) -> Redaktør(epost)\n  FN: Artikkel(tema) -> Tema(navn)\n\n" +
          "Skrevet(brukernavn, aid)\n  KN/PN: {brukernavn, aid}\n  FN: Skrevet(brukernavn) -> Journalist(brukernavn)\n  FN: Skrevet(aid) -> Artikkel(aid)\n\n" +
          "For(redaktør, tema)\n  KN/PN: {redaktør, tema}\n  FN: For(redaktør) -> Redaktør(epost)\n  FN: For(tema) -> Tema(navn)\n\n" +
          "Relatert(aid1, aid2)\n  KN/PN: {aid1, aid2}\n  FN: Relatert(aid1) -> Artikkel(aid)\n  FN: Relatert(aid2) -> Artikkel(aid)\n\n" +
          "Nøkkelord(aid, ord)\n  KN/PN: {aid, ord}\n  FN: Nøkkelord(aid) -> Artikkel(aid)",
        poeng: ["Journalist, Redaktør, Tema, Artikkel (4 × 1p)", "GODKJENT, INNEN, SKREVET, FOR (4 × 1p)",
                "RELATERT med to fremmednøkler (1,5p)", "Nøkkelord (0,5p)"] }
    ],
    hvorfor: {
      eli5: "<p>Hver boks i tegningen blir én tabell. En strek der den ene siden bare har én partner (som «én redaktør godkjenner artikkelen»), blir en ekstra kolonne hos den andre. Er det mange på begge sider, trenger koblingen sin egen tabell. Og et felt som kan ha mange verdier, som nøkkelord, får også sin egen lille tabell.</p>",
      normal: "<p>For 1:N legger vi en fremmednøkkel på N-siden. Hver artikkel har høyst én redaktør som godkjente den og høyst ett tema, så begge får plass som kolonner i Artikkel. M:N kan ikke lagres som én kolonne, fordi en artikkel kan ha mange journalister og en journalist mange artikler. Da trenger vi koblingstabeller der nøkkelen er paret av fremmednøkler. Det samme gjelder RELATERT, men der peker begge kolonnene på Artikkel og må ha ulike navn. Flerverdiattributtet Nøkkelord blir en egen tabell fordi en celle bare kan ha én verdi (1NF).</p>",
      teknisk: "<p>Målet er korrekt, effektivt og tydelig. Fremmednøkler for GODKJENT og INNEN i Artikkel gir færrest tabeller. For GODKJENT blir det heller ingen NULL-verdier, fordi ARTIKKEL har total deltakelse. Relasjonsattributtet Dato flytter med fremmednøkkelen. Det blir aldri del av en nøkkel, og vi gir det et nytt navn (godkjent_dato) for ikke å kollidere med artikkelens egen dato.</p>" +
        "<p>Total deltakelse i FOR og SKREVET kan ikke håndheves med primær- og fremmednøkler alene, så det er greit at skjemaet ikke uttrykker det. Redaktør har to kandidatnøkler fordi både Epost og RID er understreket. Begge skal markeres, og den valgte primærnøkkelen skal skilles ut. Utledbare attributter droppes, og av sammensatte attributter beholdes bare bladene.</p>"
    },
    sensor: {
      deler: [
        { del: "Fasit",
          fasit: "<p>Løsningsforslag</p><p>Bruker her KN, PN og FK som forkortelse for henholdsvis kandidatnøkler, primærnøkkel, og fremmednøkkel.</p><p>Starter med å realisere vanlige entiteter:</p>" +
            "<pre>Journalist(brukernavn, navn)\n- KN/PN: {brukernavn}\n\nArtikkel(aid, tittel, innhold, dato)\n- KN:PN: {aid}\n\nRedaktør(epost, rednr, avisnr, navn)\n- KN: {epost}, {rednr, avisnr}\n- PN: {epost}\n\nTema(navn, beskrivelse)\n- KN/PN: {navn}</pre>" +
            "<p>Velger her {epost} som PN for Redaktør ettersom det er kortere og en naturlig attributt å bruke som referanse til en redaktør.</p>" +
            "<p>Ingen svake entiteter eller 1:1-relasjoner, så realiserer så 1:N-relasjoner. Velger å realisere GODKJENT som fremmednøkkel i Atrikkel ettersom alle artikler har en redaktør som har godkjent artikkelen:</p>" +
            "<pre>Artikkel(aid, tittel, innhold, dato, redaktør, godkjent_dato)\n- KN:PN: {aid}\n- FN: (redaktør) -&gt; Redaktør(epost)</pre>" +
            "<p>Velger videre å realisere INNEN som fremmednøkkel i ARTIKKEL ettersom det virker naturlig at de fleste artikler har et tema:</p>" +
            "<pre>Artikkel(aid, tittel, innhold, dato, redaktør, godkjent_dato, tema)\n- KN:PN: {aid}\n- FN: (redaktør) -&gt; Redaktør(epost)\n       (tema) -&gt; Tema(navn)</pre>" +
            "<p>Realiserer så M:N-relasjonene som egne relasjoner:</p>" +
            "<pre>For(redaktør, tema)\n- KN/PN: {redaktør, tema}\n- FN: (redaktør) -&gt; Redaktør(epost)\n       (tema) -&gt; Tema(tittel)\n\nSkrevet(journalist, artikkel)\n- KN/PN: {journalist, artikkel}\n- FN: (jounralist) -&gt; Jounralist(brukernavn)\n       (artikkel) -&gt; Artikkel(aid)\n\nRelatert(artikkel1, artikkel2)\n- KN/PN: {artikkel1, artikkel2}\n- FN: (artikkel1) -&gt; Artikkel(aid)\n       (artikkel2) -&gt; Artikkel(aid)</pre>" +
            "<p>Til slutt realiserer vi flerverdi-attributten:</p>" +
            "<pre>Nøkkelord(artikkel, ord)\n- KN/PN: {artikkel, ord)\n- FN: (artikkel) -&gt; Artikkel(aid)</pre>" +
            "<p>Hele skjemaet blir da:</p>" +
            "<pre>Journalist(brukernavn, navn)\n- KN/PN: {brukernavn}\n\nArtikkel(aid, tittel, innhold, dato, redaktør, godkjent_dato, tema)\n- KN:PN: {aid}\n- FN: (redaktør) -&gt; Redaktør(epost)\n       (tema) -&gt; Tema(navn)\n\nRedaktør(epost, rednr, avisnr, navn)\n- KN: {epost}, {rednr, avisnr}\n- PN: {epost}\n\nTema(navn, beskrivelse)\n- KN/PN: {navn}\n\nFor(redaktør, tema)\n- KN/PN: {redaktør, tema}\n- FN: (redaktør) -&gt; Redaktør(epost)\n       (tema) -&gt; Tema(navn)\n\nSkrevet(journalist, artikkel)\n- KN/PN: {journalist, artikkel}\n- FN: (jounralist) -&gt; Journalist(brukernavn)\n       (artikkel) -&gt; Artikkel(aid)\n\nRelatert(artikkel1, artikkel2)\n- KN/PN: {artikkel1, artikkel2}\n- FN: (artikkel1) -&gt; Artikkel(aid)\n       (artikkel2) -&gt; Artikkel(aid)\n\nNøkkelord(artikkel, ord)\n- KN/PN: {artikkel, ord)\n- FN: (artikkel) -&gt; Artikkel(aid)</pre>",
          kriterier: "<p>Sensorveiledning</p><ul><li>1 for hver vanlige entitet</li><li>1 poeng for hver relasjon, og 1.5 for RELATERT</li><li>0.5 for multi-valued attributten</li></ul>" +
            "<p>Trekk:</p><ul><li>-0.5 for manglende attributt</li><li>-0.5 for manglende markering av kandidatnøkler og primærnøkkel</li><li>-0.5 for manglende fremmednøkkelmarkering</li><li>-0.5 for manglende forklaring på valg</li></ul>" }
      ],
      merknad: "Skrivefeilene er beholdt ordrett: «Atrikkel», «jounralist», «Jounralist», «{artikkel, ord)» og «KN:PN». «(tema) -&gt; Tema(tittel)» under For skal være Tema(navn), slik det står i det samlede skjemaet. Sensorveiledningen forklarer FK i innledningen, men bruker FN i selve skjemaet."
    }
  };

  IN.PERFEKT["H2023-2.2"] = {
    type: "eksamen",
    svar: [
      { del: "Spørring",
        tekst: "<p>Koble sensor til område, filtrer på navnet og sorter stigende på dato.</p>",
        sql: "SELECT s.vedlikeholdt\nFROM sensor AS s\n  INNER JOIN område AS o ON (s.oid = o.oid)\nWHERE o.navn = 'Oslo'\nORDER BY s.vedlikeholdt; -- stigende = kronologisk",
        poeng: ["Riktig join mellom sensor og område", "WHERE på navnet 'Oslo'", "ORDER BY vedlikeholdt (stigende)"] }
    ],
    hvorfor: {
      eli5: "<p>Sensorene vet bare hvilket nummer området deres har, ikke hva det heter. Først slår vi opp hvilket nummer Oslo har, så plukker vi ut sensorene med det nummeret og legger datoene i rekkefølge fra eldst til nyest.</p>",
      normal: "<p>Navnet «Oslo» finnes bare i område, og datoene finnes bare i sensor. Vi trenger derfor en join på oid. WHERE tar bare med Oslo, og ORDER BY uten DESC sorterer fra tidligste til seneste dato. På eksempeldataene blir svaret 2021-02-09, 2022-11-24 og 2023-12-01.</p>",
      teknisk: "<p>Vi bruker en indre join fordi bare sensorer som faktisk ligger i et område, kan ligge i Oslo. Vi filtrerer på navn i stedet for oid, slik at spørringen ikke avhenger av eksempeldataene. Sensor trekker for hardkodede nøkler. ORDER BY er stigende som standard. Har en sensor NULL i vedlikeholdt, havner den sist i PostgreSQL. Det er greit her, men du kan legge til «AND s.vedlikeholdt IS NOT NULL» hvis du bare vil ha faktiske datoer.</p>"
    },
    sensor: {
      deler: [
        { del: "Løsningsforslag", fasit: "",
          sql: "SELECT vedlikeholdt\nFROM område JOIN sensor USING (oid)\nWHERE navn = 'Oslo'\nORDER BY vedlikeholdt;",
          kriterier: SQL_GENERELT }
      ],
      merknad: "Sensorveiledningen har ingen egne punkter for 2.2. Den generelle listen for SQL-delen gjelder."
    }
  };

  IN.PERFEKT["H2023-2.3"] = {
    type: "eksamen",
    svar: [
      { del: "Spørring",
        tekst: "<p>Join over tre tabeller, filter med parentes rundt OR og avg over temp.</p>",
        sql: "SELECT avg(m.temp) AS snittemp\nFROM måling AS m\n  INNER JOIN sensor AS s ON (m.sid = s.sid)\n  INNER JOIN område AS o ON (s.oid = o.oid)\nWHERE o.navn = 'Bærum'\n  AND (m.nedbør > 0 OR m.vind > 5); -- regn eller mye vind",
        poeng: ["Join måling–sensor–område", "Filter på Bærum", "(nedbør &gt; 0 OR vind &gt; 5) i parentes", "avg(temp)"] }
    ],
    hvorfor: {
      eli5: "<p>Vi samler alle målingene fra Bærum der det enten regnet eller blåste kraftig, og regner ut snittet av temperaturene i den bunken.</p>",
      normal: "<p>Måling vet bare hvilken sensor som målte, og sensor vet hvilket område den står i. Derfor kobler vi måling → sensor → område. Betingelsen «regn eller mye vind» må stå i parentes. Ellers binder AND sterkere enn OR, og alle målinger med vind over 5 fra hele landet blir tatt med. avg gir ett tall for alle radene som er igjen. På eksempeldataene er det bare én Bærum-måling med temperatur (−7,5), så svaret blir −7,5.</p>",
      teknisk: "<p>Uten parentes blir uttrykket (navn = 'Bærum' AND nedbør &gt; 0) OR vind &gt; 5, som er en helt annen spørring. Målinger der nedbør eller vind er NULL, gir NULL (ukjent) i sammenligningen. De tas bare med hvis den andre delen av OR er sann. avg ignorerer NULL i temp, så målinger uten temperatur påvirker ikke snittet. Vi trenger ingen GROUP BY fordi vi vil ha ett tall for hele utvalget.</p>"
    },
    sensor: {
      deler: [
        { del: "Løsningsforslag", fasit: "",
          sql: "SELECT avg(temp) AS gj_temp\nFROM område AS o\n       JOIN sensor AS s USING (oid)\n       JOIN måling AS m USING (sid)\nWHERE o.navn = 'Bærum' AND\n         (nedbør > 0 OR vind > 5);",
          kriterier: SQL_GENERELT }
      ],
      merknad: "Sensorveiledningen har ingen egne punkter for 2.3. Den generelle listen for SQL-delen gjelder."
    }
  };

  IN.PERFEKT["H2023-2.4"] = {
    type: "eksamen",
    svar: [
      { del: "Spørring",
        tekst: "<p>LEFT JOIN slik at områder uten sensorer kommer med, count(s.sid) for å telle 0 riktig, og sortering på sensorer per km².</p>",
        sql: "SELECT o.navn\nFROM område AS o\n  LEFT JOIN sensor AS s ON (o.oid = s.oid) -- områder uten sensorer skal med\nGROUP BY o.oid, o.navn, o.areal\nORDER BY count(s.sid) / o.areal -- sensorer per km², færrest først\nLIMIT 3;",
        poeng: ["LEFT JOIN fra område", "count(s.sid), ikke count(*)", "GROUP BY per område", "ORDER BY N/A stigende", "LIMIT 3"] }
    ],
    hvorfor: {
      eli5: "<p>Vi lager en liste over alle områdene, også dem som ikke har én eneste sensor. For hvert område teller vi sensorene og deler på hvor stort området er. Så tar vi de tre som kommer dårligst ut.</p>",
      normal: "<p>En vanlig join mister områder som ikke har noen sensor, og det er nettopp dem som har færrest. LEFT JOIN beholder dem med NULL i sensorkolonnene. count(s.sid) teller bare verdier som ikke er NULL, så slike områder får 0. Vi deler på arealet og sorterer stigende. På eksempeldataene blir svaret Trondheim (0 sensorer), Gjøvik (1/672,25) og Kristiansand (1/644,16).</p>",
      teknisk: "<p>count(*) teller rader. Etter en LEFT JOIN har et område uten sensorer én rad med NULL-er, og count(*) gir da 1. count(s.sid) gir 0. Vi grupperer på o.oid, fordi to områder kan ha samme navn. o.navn og o.areal tas med for tydelighets skyld, selv om PostgreSQL godtar dem når primærnøkkelen står i GROUP BY. count gir et heltall og areal er float, så divisjonen blir float og ikke heltallsdivisjon. Vi kan sortere på et uttrykk med aggregat uten å vise det i SELECT, slik at bare navnet står i resultatet.</p>"
    },
    sensor: {
      deler: [
        { del: "Løsningsforslag", fasit: "",
          sql: "SELECT o.navn, count(s.sid)/o.areal AS sensorer_per_areal\nFROM område AS o LEFT JOIN sensor AS s ON (o.oid = s.oid)\nGROUP BY o.oid, o.navn, o.areal\nORDER BY sensorer_per_areal\nLIMIT 3;\n\n-- eventuelt, for å ekskludere sensorer_per_areal\n\nSELECT navn FROM (\n   SELECT o.navn, count(s.sid)/o.areal AS sensorer_per_areal\n   FROM område AS o LEFT JOIN sensor AS s ON (o.oid = s.oid)\n   GROUP BY o.oid, o.navn, o.areal\n   ORDER BY sensorer_per_areal\n   LIMIT 3\n) AS t;",
          kriterier: SQL_GENERELT }
      ],
      merknad: "Sensorveiledningen har ingen egne punkter for 2.4. Den generelle listen for SQL-delen gjelder. Den andre varianten (delspørringen) står bare i sensorveiledningen, ikke i det separate løsningsforslaget."
    }
  };

  IN.PERFEKT["H2023-2.5"] = {
    type: "eksamen",
    svar: [
      { del: "VIEW",
        tekst: "<p>To deler slått sammen med UNION ALL: målte verdier som de er, og manglende verdier erstattet med dagssnittet for samme sensor.</p>",
        sql: "CREATE VIEW analyse_vind AS\n-- 1) målinger der vind finnes, tas med uendret\nSELECT sid, tidspunkt, vind\nFROM måling\nWHERE vind IS NOT NULL\nUNION ALL\n-- 2) målinger der vind mangler: snittet for samme sensor samme dag\nSELECT m.sid, m.tidspunkt,\n       (SELECT avg(d.vind)\n        FROM måling AS d\n        WHERE d.sid = m.sid\n          AND d.tidspunkt::date = m.tidspunkt::date\n          AND d.vind IS NOT NULL) AS vind\nFROM måling AS m\nWHERE m.vind IS NULL;\n-- Antakelse: finnes ingen målt vind for sensoren den dagen,\n-- blir vind fortsatt NULL (det finnes ikke noe snitt å bruke).",
        poeng: ["CREATE VIEW analyse_vind", "Rader med vind tas med uendret", "NULL-rader erstattes med avg for samme sid og samme ::date", "UNION ALL / riktig kolonner"] }
    ],
    hvorfor: {
      eli5: "<p>Noen ganger glemmer en værmåler å skrive ned vinden. Da gjetter vi ved å ta gjennomsnittet av det den samme måleren skrev ned resten av den dagen. Tabellen vi lager, viser alle målingene, men med gjetningen fylt inn der det var tomt.</p>",
      normal: "<p>Vi deler radene i to grupper. Har raden en vindverdi, tar vi den med som den er. Mangler verdien, regner en delspørring ut snittet av vind for samme sensor der datoen er den samme. Den kobles til den ytre raden med d.sid = m.sid og d.tidspunkt::date = m.tidspunkt::date. Til slutt slår UNION ALL sammen gruppene. For sid 2 den 2. desember blir den tomme verdien (0,3 + 0,4) / 2 = 0,35, akkurat som i eksempelet.</p>",
      teknisk: "<p>Delspørringen er korrelert: den kjøres én gang per ytre rad med m.sid og m.tidspunkt som parametre. avg ignorerer NULL, så «d.vind IS NOT NULL» er strengt tatt overflødig, men det gjør intensjonen tydelig. Finnes det ingen målte verdier den dagen (sid 2 den 4. desember), gir avg over en tom mengde NULL, og raden står igjen med NULL. Eksempelutskriften tar ikke med den raden. Det tilsvarer variant 1 i sensorveiledningen, som bruker en self-join med GROUP BY. Der faller raden bort, fordi joinen ikke finner noen partner. Begge variantene står i sensorveiledningen.</p>" +
        "<p>UNION ALL er riktig fordi delene er disjunkte (vind er enten NULL eller ikke), og vi ønsker ikke duplikatfjerning. Uten ::date ville betingelsen sammenlignet hele tidspunkt, og da ville bare raden selv matche.</p>"
    },
    sensor: {
      deler: [
        { del: "Løsningsforslag", fasit: "",
          sql: "CREATE VIEW analyse_vind AS\nSELECT sid, tidspunkt, vind\nFROM måling\nWHERE vind IS NOT NULL\nUNION ALL\nSELECT m.sid, m.tidspunkt, avg(o.vind)\nFROM måling AS m JOIN måling AS o USING (sid)\nWHERE m.tidspunkt::date = o.tidspunkt::date AND\n         m.vind IS NULL AND\n         o.vind IS NOT NULL\nGROUP BY m.sid, m.tidspunkt::date;\n\n-- eller eventuelt følgende\n-- (men denne vil kunne ha NULL-verdier for vind\n-- dersom det ikke finnes noen andre målinger for en sensor på samme dag)\n\nCREATE VIEW analyse_vind AS\nSELECT sid, tidspunkt, vind\nFROM måling\nWHERE vind IS NOT NULL\nUNION ALL\nSELECT sid, tidspunkt,\n   (SELECT avg(vind)\n    FROM måling AS o\n    WHERE o.sid = m.sid AND\n              o.tidspunkt::date = m.tidspunkt::date AND\n              o.vind IS NOT NULL\n   ) AS vind\nFROM måling AS m\nWHERE vind IS NULL;",
          kriterier: SQL_GENERELT }
      ],
      merknad: "I sensorveiledningen slutter første variant med «GROUP BY m.sid, m.tidspunkt::date». Den vil ikke kjøre i PostgreSQL, fordi m.tidspunkt står i SELECT uten å være gruppert. Det separate løsningsforslaget har «GROUP BY m.sid, m.tidspunkt», som er riktig. Gjengitt ordrett fra sensorveiledningen. Sensorveiledningen har ingen egne punkter for 2.5."
    }
  };

  IN.PERFEKT["H2023-2.6"] = {
    type: "eksamen",
    svar: [
      { del: "Spørring",
        tekst: "<p>To WITH-steg: dagstotal per område (med HAVING på antall målinger) og snitt per område. Til slutt navn, sortert synkende.</p>",
        sql: "WITH\n  -- total nedbør per område per dag i 2023, bare dager med mer enn 10 målinger\n  dagstotal AS (\n    SELECT s.oid, m.tidspunkt::date AS dag, sum(m.nedbør) AS nedbør\n    FROM måling AS m\n      INNER JOIN sensor AS s ON (m.sid = s.sid)\n    WHERE m.tidspunkt >= '2023-01-01' AND m.tidspunkt < '2024-01-01'\n    GROUP BY s.oid, m.tidspunkt::date\n    HAVING count(*) > 10\n  ),\n  -- gjennomsnitt av dagstotalene per område\n  snitt AS (\n    SELECT oid, avg(nedbør) AS snitt_per_dag\n    FROM dagstotal\n    GROUP BY oid\n  )\nSELECT o.navn\nFROM snitt AS sn\n  INNER JOIN område AS o ON (sn.oid = o.oid)\nORDER BY sn.snitt_per_dag DESC\nLIMIT 1; -- ved likt snitt velges ett av områdene",
        poeng: ["Begrensning til 2023", "sum per område og dag (GROUP BY oid, ::date)", "HAVING count(*) &gt; 10", "avg per område", "navn, ORDER BY DESC, LIMIT 1"] }
    ],
    hvorfor: {
      eli5: "<p>Først legger vi sammen all nedbøren i hvert område for hver dag, men bare de dagene det ble målt ofte nok. Så finner vi ut hvor mye det i snitt regnet per dag i hvert område. Til slutt peker vi på området som kom høyest.</p>",
      normal: "<p>Oppgaven har to nivåer med aggregering. Først blir det sum per (område, dag), deretter snitt av disse summene per område. Det kan ikke gjøres i én SELECT, så vi bruker to WITH-delspørringer. Kravet «mer enn 10 målinger» gjelder hver gruppe (område + dag) og står derfor i HAVING. Til slutt kobler vi til område for å få navnet og sorterer synkende.</p>",
      teknisk: "<p>Hvis du skriver avg(sum(nedbør)), får du en feil, fordi aggregater ikke kan nøstes i samme gruppering. WITH gjør det mulig å gruppere to ganger. Måling må kobles til sensor fordi oid bare står der. Grupperingen på m.tidspunkt::date gjør hver kalenderdag til én gruppe. Året avgrenses med et halvåpent intervall. Sammenligner du med «&lt;= '2023-12-31'», blir datoen tolket som midnatt, og målinger senere på nyttårsaften faller bort.</p>" +
        "<p>Oppgaven er tvetydig: «områder og dager som har mer enn 10 målinger» kan også bety at et område totalt må ha mer enn 10 målinger. Sensor godtar begge tolkningene. Vi velger «mer enn 10 målinger per område per dag» og skriver det i en kommentar. LIMIT 1 velger ett område ved likt snitt. Vil du ha med alle, kan du sammenligne med max i en egen delspørring.</p>"
    },
    sensor: {
      deler: [
        { del: "Løsningsforslag", fasit: "",
          sql: "WITH\n   nedbør_pd AS (\n      SELECT s.oid, tidspunkt::date, sum(m.nedbør) AS nedbør_pd\n      FROM måling AS m JOIN sensor AS s USING (sid)\n      WHERE '2023-01-01'::date <= m.tidspunkt AND\n                m.tidspunkt <= '2023-12-31'::date -- kan også bruke current_date\n      GROUP BY s.oid, tidspunkt::date\n      HAVING count(*) > 10\n   ),\n   nedbør_gj AS (\n      SELECT oid, avg(nedbør_pd) AS nedbør_gj\n      FROM nedbør_pd\n      GROUP BY oid\n   )\n\nSELECT o.navn\nFROM nedbør_gj AS g JOIN område AS o USING (oid)\nORDER BY nedbør_gj DESC\nLIMIT 1;",
          kriterier: SQL_GENERELT + "<p>Sensorveiledning</p><ul><li>Oppgaven var litt tvetydig om man kun skal ta med de områdene med 10 dager med målinger totalt, eller kun ta med dagene for et område med 10 målinger per dag. Begge disse tolkningene gir full uttelling.</li></ul>" }
      ],
      merknad: "Sensorveiledningens løsning bruker «m.tidspunkt &lt;= '2023-12-31'::date». Det utelater målinger tatt etter midnatt 31. desember. Se avvik."
    }
  };

  IN.PERFEKT["H2023-2.7"] = {
    type: "eksamen",
    svar: [
      { del: "Python (psycopg)",
        tekst: "<p>Parametrisert UPDATE der områdenavnet sendes som parameter, ikke limes inn i SQL-strengen.</p>",
        sql: "def vedlikeholdt(conn, omrade):\n    sql = (\"UPDATE sensor \"\n           \"SET vedlikeholdt = current_date \"\n           \"WHERE oid IN (SELECT oid FROM område WHERE navn = %s);\")\n    cur = conn.cursor()\n    cur.execute(sql, (omrade,))  # verdien sendes separat: ingen injection\n    conn.commit()",
        poeng: ["Riktig UPDATE med current_date", "Delspørring/join for å finne oid fra navn", "Parametrisert spørring (%s + tuppel)", "commit"] },
      { del: "Java (JDBC), alternativ",
        tekst: "<p>Samme idé med PreparedStatement og ?.</p>",
        sql: "void vedlikeholdt(Connection conn, String omrade) throws SQLException {\n    String sql = \"UPDATE sensor \"\n               + \"SET vedlikeholdt = current_date \"\n               + \"WHERE oid IN (SELECT oid FROM område WHERE navn = ?);\";\n    PreparedStatement ps = conn.prepareStatement(sql);\n    ps.setString(1, omrade);   // verdien bindes, ikke limes inn\n    ps.executeUpdate();\n    conn.commit();           // trengs hvis autocommit er av\n}",
        poeng: ["PreparedStatement med ?", "setString(1, omrade)", "executeUpdate/execute", "commit"] }
    ],
    hvorfor: {
      eli5: "<p>Hvis du skriver det brukeren sier rett inn i kommandoen til databasen, kan en lur bruker skrive inn en ekstra kommando i stedet for et stedsnavn. Derfor gir vi databasen kommandoen og stedsnavnet hver for seg. Da blir stedsnavnet alltid lest som tekst og aldri som en ordre.</p>",
      normal: "<p>Sensor-tabellen har bare oid, så vi finner oid for området med en delspørring på navn og oppdaterer alle sensorer med den oid-en. Områdenavnet kommer fra brukeren, og derfor bruker vi en parametrisert spørring: %s i Python eller ? i Java. Databasedriveren sender verdien separat, så tegn som ' eller ; i navnet kan ikke endre selve SQL-kommandoen. Til slutt gjør vi commit, slik at endringen blir lagret.</p>",
      teknisk: "<p>Med strengkonkatenering kunne omrade = \"x'; DROP TABLE sensor; --\" ført til at en helt annen kommando ble kjørt. Med parametrisert spørring blir verdien bundet som en literal etter at spørringen er tolket, og strukturen kan ikke endres. Vi bruker IN i stedet for =, fordi navn ikke er UNIQUE i område. Hvis to områder heter det samme, ville «= (SELECT …)» gitt kjøretidsfeil. I psycopg må parameterlisten være en tuppel eller liste, derfor (omrade,). Kurset viser commit eksplisitt. I psycopg er autocommit av som standard, så uten commit forsvinner endringen når tilkoblingen lukkes.</p>"
    },
    sensor: {
      deler: [
        { del: "Python", fasit: "<p>Løsningsforslag</p>",
          sql: "def vedlikeholdt(conn, omrade):\n      cur = conn.cursor()\n      cur.execute(\"UPDATE sensor \"\n                         \"SET vedlikeholdt = current_date \"\n                         \"WHERE oid = (SELECT oid FROM område WHERE navn = %s);\",\n                         (omrade,))\n      conn.commit()",
          kriterier: "" },
        { del: "Java", fasit: "",
          sql: "void vedlikeholdt(Connection conn, String omrade) throws SQLException {\n      PreparedStatement stmt = conn.prepareStatement(\n            \"UPDATE sensor \" +\n            \"SET vedlikeholdt = current_date \" +\n            \"WHERE oid = (SELECT oid FROM område WHERE navn = ?);\"\n      );\n      stmt.setString(1, omrade);\n      stmt.execute();\n      conn.commit();\n}",
          kriterier: SQL_GENERELT }
      ],
      merknad: "Sensorveiledningen har ingen egne punkter for 2.7. Den generelle listen for SQL-delen er tatt med. Sensors løsning bruker «oid = (SELECT …)». Det feiler hvis to områder har samme navn, og derfor bruker vårt svar IN."
    }
  };

  IN.PERFEKT["H2023-3.3"] = {
    type: "eksamen",
    svar: [
      { del: "Steg 1",
        tekst: "<p>Kandidatnøkler i R er AB og BC (oppgitt). E → D bryter BCNF fordi E⁺ = ED ≠ ABCDE, så E er ikke en supernøkkel. Vi deler på E → D:</p>" +
          "<ul><li>S₁(E, D) = E⁺. KN: E. FD: E → D. BCNF, fordi E er supernøkkel.</li>" +
          "<li>S₂(A, B, C, E) = E ∪ (R − E⁺). KN: AB, BC. FD-er: B → E, AB → C, C → A.</li></ul>",
        poeng: ["Velger en FD som bryter BCNF, med begrunnelse", "Riktig tillukning E⁺ = ED", "Riktige KN og FD-er på begge deler (5p)"] },
      { del: "Steg 2",
        tekst: "<p>I S₂ bryter B → E, fordi B⁺ (innenfor S₂) = BE og B ikke er supernøkkel. Vi deler S₂:</p>" +
          "<ul><li>S₂₁(B, E) = B⁺. KN: B. FD: B → E. BCNF.</li>" +
          "<li>S₂₂(A, B, C). KN: AB, BC. FD-er: AB → C, C → A.</li></ul>",
        poeng: ["Riktig splitt med KN og FD-er (2,5p)"] },
      { del: "Steg 3",
        tekst: "<p>I S₂₂ bryter C → A, fordi C⁺ = CA og C ikke er supernøkkel (AB → C har AB som supernøkkel og bryter ikke). Vi deler S₂₂:</p>" +
          "<ul><li>S₂₂₁(C, A) = C⁺. KN: C. FD: C → A. BCNF.</li>" +
          "<li>S₂₂₂(B, C). KN: BC. Ingen ikke-trivielle FD-er. BCNF.</li></ul>" +
          "<p><b>Resultat:</b> (E, D), (B, E), (C, A), (B, C). Hver splitt er tapsfri etter Fagins teorem, fordi fellesattributtene (E, B og C) bestemmer hele den første delen.</p>",
        skjema: "R(A, B, C, D, E)  KN: AB, BC\n  E → D bryter BCNF, E⁺ = ED\n  S1(E, D)        KN: E    FD: E → D\n  S2(A, B, C, E)  KN: AB, BC   FD: B → E, AB → C, C → A\n    B → E bryter BCNF i S2, B⁺ = BE\n    S21(B, E)     KN: B    FD: B → E\n    S22(A, B, C)  KN: AB, BC   FD: AB → C, C → A\n      C → A bryter BCNF i S22, C⁺ = CA\n      S221(C, A)  KN: C    FD: C → A\n      S222(B, C)  KN: BC   (ingen ikke-trivielle FD-er)",
        poeng: ["Riktig splitt med KN og FD-er (2,5p)", "Forklaring av hvert steg"] }
    ],
    hvorfor: {
      eli5: "<p>Tenk på en stor tabell der den samme informasjonen står mange ganger, for eksempel at en bestemt E alltid hører sammen med en bestemt D. Hver slik «regel» som ikke handler om hele nøkkelen, flytter vi ut i en egen liten tabell. Så gjør vi det samme med restene til ingen slike regler er igjen. Ingenting går tapt, fordi tabellene fortsatt deler en kolonne som limer dem sammen igjen.</p>",
      normal: "<p>BCNF krever at alle venstresider er supernøkler. Her er B, E og C alene ikke det, så B → E, E → D og C → A bryter alle. Algoritmen tar én bryter om gangen, regner ut tillukningen X⁺ og lager to deler: X⁺, og X sammen med resten. Deretter sjekker vi hver del på nytt med FD-ene som passer inn i den. Etter tre splitter er alle delene på BCNF. Startrekkefølgen spiller ingen rolle for resultatet her. Sensorveiledningen starter med B → E og ender med de samme fire relasjonene.</p>",
      teknisk: "<p>Hvert steg er tapsfritt etter Fagins teorem. Fellesattributtet er X, og X → X⁺ holder, så X bestemmer hele den ene delen. For å finne FD-ene på en delrelasjon tar vi med FD-ene som bare bruker dens attributter, og sjekker tillukninger internt. I S₂(A, B, C, E) forsvinner D, men B → E, AB → C og C → A er fortsatt med. Nøklene er fortsatt AB og BC, fordi B må være med (B står aldri på en høyreside), B⁺ = BE er ikke nok, og både A og C fullfører nøkkelen.</p>" +
        "<p>I S₂₂(A, B, C) er AB → C ikke et brudd, fordi AB er kandidatnøkkel. C → A er et brudd. Relasjonen er faktisk på 3NF (A er nøkkelattributt), men ikke på BCNF. Etter splitten finnes AB → C ikke lenger i noen delrelasjon. Det er en kjent følge av BCNF-algoritmen og står ikke i veien for at dekomposisjonen er tapsfri. Merk også at i (B, E) er nøkkelen B og ikke E, fordi E⁺ = ED ikke inneholder B.</p>"
    },
    sensor: {
      deler: [
        { del: "Løsningsforslag",
          fasit: "<p>Starter med å finne en FD som bryter med BCNF, og ser at B → E bryter med BCNF: Vi dekomponerer så med hensyn på denne, B<sup>+</sup> = BED:</p><ul>" +
            "<li>Første relasjon i dekomponeringen av R blir S<sub>1</sub>(B, E, D), med KN B og FDene 1 og 3. Her ser vi at FD 3 (E → D) bryter så dekomponerer videre med denne, E<sup>+</sup> = ED<ul>" +
            "<li>Førse relasjon i dekomponeringen av S<sub>1</sub> blir S<sub>11</sub>(E, D) med KN E og FD 3. Denne ser vi er på BCNF ettersom FD 3 ikke bryter med BCNF.</li>" +
            "<li>Den andre relasjonen i dekomponeringen av S<sub>1</sub> er S<sub>12</sub>(E, B) med KN E og FD 1, og også denne er på BCNF av samme grunn som over.</li></ul></li>" +
            "<li>Den andre relasjonen i dekomponeringen av R er S<sub>2</sub>(B, A, C) med KN AB og BC, og FDer 2 og 4. Her ser vi at FD 4 (C → A) bryter, så dekomponerer videre med hensyn på denne, C<sup>+</sup> = CA:<ul>" +
            "<li>Første relasjon blir da S<sub>21</sub>(C, A) med KN C og FD 4, som vi er på BCNF.</li>" +
            "<li>Andre relasjon blir S<sub>22</sub>(C, B) med KN CB og ingen FDer og er derfor på BCNF.</li></ul></li></ul>" +
            "<p>Altså kan R dekomponeres tapsfritt til S<sub>11</sub>(E, D) S<sub>12</sub>(E, B) S<sub>21</sub>(C, A) S<sub>22</sub>(C, B) med kandidatnøkler og FDer som vist over.</p>",
          kriterier: "<p>Sensorveiledning</p><ul>" +
            "<li>5 poeng for riktig første dekomponering (inkludert nøkler og FDer på de nye relasjonene), altså dekomomponeringen av R til to nye relasjoner</li>" +
            "<li>2.5 poeng for hver av de to andre dekomponeringene (inkludert nøkler og FDer på de nye relasjonene)</li>" +
            "<li>-1 poeng for manglende/feil FD på relasjon</li>" +
            "<li>-1 poeng for feil utregning av tillukning</li>" +
            "<li>-1 poeng for manglende/feil kandidatnøkler</li>" +
            "<li>-3 poeng for ingen forklaringer</li></ul>" }
      ],
      merknad: "Sensorveiledningen gir S12(E, B) KN E. Riktig er KN B, fordi B → E holder, mens E⁺ = ED ikke inneholder B. Skrivefeilene «Førse», «som vi er på BCNF» og «dekomomponeringen» er beholdt ordrett. Vårt svar starter med E → D. Sensor starter med B → E. Begge er gyldige og gir de samme fire relasjonene."
    }
  };
})();
