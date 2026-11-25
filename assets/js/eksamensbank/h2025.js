/* IN2090 · eksamensbank H2025. Kilde: UiO, IN2090 eksamen H2025 + databaseskjema + sensorveiledning.
   Oppgavetekst og sensorveiledning ordrett. Våre svar (svar/hvorfor/losning/tips) med egne ord.
   Alt fra sensorveiledningsfila (også delene merket «Løsningsforslag») står ordrett i sensor-feltene.
   Den separate LF-fila er bare brukt som kontroll og er aldri gjengitt ordrett. */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var BANK = (window.IN_EXAM_BANK = window.IN_EXAM_BANK || {});
  IN.PERFEKT = IN.PERFEKT || {};

  /* ---------------------------------------------------------------- skjema */

  var SKJEMA = {
    tittel: "Databaseskjema for eksamen IN2090H25",
    intro:
      "<p>Du har fått jobb som databaseadministrator for et stort firma med navn Oppgaveløseren. " +
      "Firmaet utfører prosjekter, hvor hvert prosjekt er delt inn i ulike oppgaver. Hvert prosjekt har en leder, " +
      "og hver oppgave er tildelt én ansatt som er ansvarlig for oppgaven. Databaseskjemaet er laget av følgende kommandoer:</p>" +
      "<pre>CREATE TABLE ansatt (\n    aid int PRIMARY KEY,\n    navn text NOT NULL\n);\n\n" +
      "CREATE TABLE prosjekt (\n    navn text PRIMARY KEY,\n    leder int NOT NULL REFERENCES ansatt(aid)\n);\n\n" +
      "CREATE TABLE oppgave (\n    oid int PRIMARY KEY,\n    beskrivelse text NOT NULL,\n    ansvarlig int REFERENCES ansatt(aid),\n" +
      "    frist date NOT NULL,\n    ferdig date\n);\n\n" +
      "CREATE TABLE medlem (\n    prosjekt text REFERENCES prosjekt(navn),\n    ansatt int REFERENCES ansatt(aid),\n" +
      "    PRIMARY KEY(prosjekt, ansatt)\n);</pre>" +
      "<p><b>Eksempeldata</b></p>" +
      "<p>Under (på neste side) følger eksempler på hvordan tabellene <i>kan</i> se ut. Spørringene dine kan ikke anta at " +
      "dataene ser slik ut, med mindre dette står i oppgaven. NULL er representert som blank/manglende verdi " +
      "(f.eks. har den 2. raden i oppgave en ansvarlig som er NULL).</p>",
    tabeller: [
      {
        navn: "ansatt",
        beskrivelse: "Tabellen ansatt beskriver de ansatte som jobber i firmaet, og inneholder en unik ansatt-ID aid og navnet på den ansatte.",
        kolonner: [
          { navn: "aid", type: "int", pk: true },
          { navn: "navn", type: "text", notNull: true }
        ],
        eksempel: {
          kolonner: ["aid", "navn"],
          rader: [[1, "Kari"], [2, "Ole"], [3, "Nasir"], [4, "Bo"], [5, "Berit"]]
        }
      },
      {
        navn: "prosjekt",
        beskrivelse: "Tabellen prosjekt beskriver prosjektene til firmaet. Hvert prosjekt har en unik ID pid, et navn, samt en referanse leder til den ansatte som leder prosjektet.",
        kolonner: [
          { navn: "pid", type: "int", pk: true },
          { navn: "navn", type: "text" },
          { navn: "leder", type: "int", notNull: true, fk: "ansatt(aid)" }
        ],
        eksempel: {
          kolonner: ["pid", "navn", "leder"],
          rader: [
            [1, "Ny nettside", 2],
            [2, "Jobbportal", 3],
            [3, "Billettsystem", 5],
            [4, "Sikre internett", 2],
            [5, "Fiks klimaendringene", 3]
          ]
        }
      },
      {
        navn: "oppgave",
        beskrivelse: "Tabellen oppgave beskriver oppgavene på de ulike prosjektene. Tabellen har en unik oppgave-ID oid, en tekstlig beskrivelse, en referanse ansvarlig til den ansatte som er ansvarlig for oppgaven, en dato frist som angir når oppgaven må være gjort, samt en kolonne ferdig som sier om og eventuelt når oppgaven ble gjort (denne kolonnen er NULL frem til oppgaven faktisk er gjort).",
        kolonner: [
          { navn: "oid", type: "int", pk: true },
          { navn: "beskrivelse", type: "text", notNull: true },
          { navn: "ansvarlig", type: "int", fk: "ansatt(aid)" },
          { navn: "prosjekt", type: "int", fk: "prosjekt(pid)" },
          { navn: "frist", type: "date", notNull: true },
          { navn: "ferdig", type: "date" }
        ],
        eksempel: {
          kolonner: ["oid", "beskrivelse", "ansvarlig", "prosjekt", "frist", "ferdig"],
          rader: [
            [1, "Lag overordnet struktur", 1, 2, "2025-12-13", "2025-12-12"],
            [2, "Bestem design", null, 1, "2025-12-14", "2025-12-13"],
            [3, "Bestem funksjonaliet", 5, 3, "2026-01-03", null],
            [4, "Lag liste over alle nettsider", 2, 4, "2025-12-15", null],
            [5, "Lag CO2-støvsuger", 4, 5, "2025-12-14", null],
            [6, "Anvend CO2-støvsuger", null, 5, "2025-12-15", null],
            [7, "Sikre hver nettside", 1, 4, "2025-12-23", null],
            [8, "Lag arbeidsgruppe", 3, 2, "2025-12-11", "2025-12-11"]
          ]
        }
      },
      {
        navn: "medlem",
        beskrivelse: "Den siste tabellen, medlem sier hvilke ansatte (via ansatte-referansen) som et medlem på hvilke prosjekt (via prosjekt-referansen).",
        kolonner: [
          { navn: "prosjekt", type: "int", pk: true, fk: "prosjekt(pid)" },
          { navn: "ansatt", type: "int", pk: true, fk: "ansatt(aid)" }
        ],
        eksempel: {
          kolonner: ["ansatt", "prosjekt"],
          rader: [[1, 2], [1, 4], [2, 1], [2, 4], [3, 2], [3, 5], [4, 5], [5, 3]]
        }
      }
    ],
    merknad:
      "Vedlegget har tre feil som henger sammen. (1) CREATE-skriptet gjør navn til primærnøkkel i prosjekt og har ingen pid, " +
      "mens teksten og eksempeldataene har pid. (2) CREATE TABLE oppgave mangler kolonnen prosjekt, som finnes i eksempeldataene. " +
      "(3) medlem.prosjekt er text og peker på prosjekt(navn) i skriptet, men eksempeldataene har heltall (pid). " +
      "Tabellene over viser skjemaet slik teksten og eksempeldataene beskriver det (pid som PN, oppgave.prosjekt og medlem.prosjekt som FN til prosjekt(pid)), " +
      "og alle våre svar bruker denne tolkningen. Sensorveiledningen sier at også løsninger uten oppgave.prosjekt " +
      "(der prosjektet finnes via den ansvarliges medlemskap) gir full uttelling. Merk også at eksempeldataene skriver " +
      "«funksjonaliet» (skrivefeil i originalen) og at medlem vises med kolonnene i rekkefølgen ansatt, prosjekt."
  };

  /* ---------------------------------------------------- vårt ER-svar (1.1) */

  var ER_SVAR = {
    entiteter: [
      {
        id: "KUNDE", navn: "KUNDE", svak: false, pos: [0, 1],
        attr: [
          { navn: "Kundenr", nokkel: true },
          { navn: "Navn" },
          { navn: "Telefonnr", nokkel: true },
          { navn: "Porttelefon", flerverdi: true },
          { navn: "Postadresse", deler: [{ navn: "Gatenavn" }, { navn: "Gatenr" }, { navn: "Postnr" }] },
          { navn: "Fakturaadresse", deler: [{ navn: "Gatenavn" }, { navn: "Gatenr" }, { navn: "Postnr" }] }
        ]
      },
      {
        id: "BAT", navn: "BÅT", svak: true, pos: [2, 1],
        attr: [{ navn: "Eksemplar", delvisNokkel: true }]
      },
      {
        id: "BATTYPE", navn: "BÅTTYPE", svak: false, pos: [4, 1],
        attr: [{ navn: "Kortnavn", nokkel: true }, { navn: "Modell" }, { navn: "Typebetegnelse" }]
      },
      {
        id: "BAS", navn: "BÅS", svak: false, pos: [4, 2],
        attr: [{ navn: "Nummer", nokkel: true }, { navn: "Bredde" }, { navn: "Dybde" }]
      },
      {
        id: "ARBEIDSORDRE", navn: "ARBEIDSORDRE", svak: false, pos: [2, 3],
        attr: [{ navn: "Ordrenr", nokkel: true }, { navn: "Beskrivelse" }]
      },
      {
        id: "FAKTURA", navn: "FAKTURA", svak: false, pos: [0, 3],
        attr: [{ navn: "Fakturanr", nokkel: true }, { navn: "Beløp" }]
      }
    ],
    relasjoner: [
      {
        id: "ANSVARLIG", navn: "ANSVARLIG", identifiserende: false, pos: [1, 1],
        ledd: [
          { entitet: "KUNDE", kard: "1", total: false },
          { entitet: "BAT", kard: "N", total: true }
        ]
      },
      {
        id: "TYPE", navn: "TYPE", identifiserende: true, pos: [3, 1],
        ledd: [
          { entitet: "BAT", kard: "N", total: true },
          { entitet: "BATTYPE", kard: "1", total: false }
        ]
      },
      {
        id: "LIGGER_I", navn: "LIGGER_I", identifiserende: false, pos: [3, 2],
        ledd: [
          { entitet: "BAT", kard: "1", total: false },
          { entitet: "BAS", kard: "1", total: false }
        ]
      },
      {
        id: "VEDLIKEHOLD", navn: "VEDLIKEHOLD", identifiserende: false, pos: [2, 2],
        ledd: [
          { entitet: "BAT", kard: "1", total: false },
          { entitet: "ARBEIDSORDRE", kard: "N", total: true }
        ]
      },
      {
        id: "FOR", navn: "FOR", identifiserende: false, pos: [1, 3],
        ledd: [
          { entitet: "ARBEIDSORDRE", kard: "1", total: false },
          { entitet: "FAKTURA", kard: "1", total: true }
        ]
      },
      {
        id: "SENDT_TIL", navn: "SENDT_TIL", identifiserende: false, pos: [0, 2],
        ledd: [
          { entitet: "KUNDE", kard: "1", total: false },
          { entitet: "FAKTURA", kard: "N", total: false }
        ],
        attr: [{ navn: "Dato" }]
      }
    ],
    merknad:
      "Vårt eget forslag. Tallet ved en entitet sier hvor mange av den entiteten den andre siden kan knyttes til " +
      "(en båt har høyst 1 kunde, derfor 1 ved KUNDE i ANSVARLIG). Dobbel strek = total deltakelse."
  };

  /* ER-figuren («Figure 1: ER-modell») fra sensorveiledningsfila, gjengitt som data med figurens egne navn. */
  var ER_SENSOR = {
    entiteter: [
      {
        id: "KUNDE", navn: "KUNDE", svak: false, pos: [0, 1],
        attr: [
          { navn: "Kundenr.", nokkel: true },
          { navn: "Navn" },
          { navn: "Postadresse", deler: [{ navn: "Gatenavn" }, { navn: "Gatenr." }, { navn: "Postnr." }] },
          { navn: "Fakturaadresse", deler: [{ navn: "Gatenavn" }, { navn: "Gatenr." }, { navn: "Postnr." }] },
          { navn: "Telefonnr.", nokkel: true },
          { navn: "Portåpnenr.", flerverdi: true }
        ]
      },
      { id: "BAT", navn: "BÅT", svak: true, pos: [2, 1], attr: [{ navn: "Eksemplar", delvisNokkel: true }] },
      {
        id: "BATTYPE", navn: "BÅTTYPE", svak: false, pos: [4, 1],
        attr: [{ navn: "Kortnavn", nokkel: true }, { navn: "Modellnavn" }, { navn: "Typebetegnelse" }]
      },
      {
        id: "BAS", navn: "BÅS", svak: false, pos: [4, 2],
        attr: [{ navn: "Nummer", nokkel: true }, { navn: "Bredde" }, { navn: "Dybde" }]
      },
      {
        id: "ARBEIDSORDRE", navn: "ARBEIDSORDRE", svak: false, pos: [2, 3],
        attr: [{ navn: "Ordrenr.", nokkel: true }, { navn: "Arbeidsbeskr." }]
      },
      {
        id: "FAKTURA", navn: "FAKTURA", svak: false, pos: [0, 3],
        attr: [{ navn: "Fakturanr.", nokkel: true }, { navn: "Beløp" }]
      }
    ],
    relasjoner: [
      {
        id: "ANSVARLIG", navn: "ANSVARLIG", identifiserende: false, pos: [1, 1],
        ledd: [{ entitet: "KUNDE", kard: "1", total: false }, { entitet: "BAT", kard: "N", total: true }]
      },
      {
        id: "TYPE", navn: "TYPE", identifiserende: true, pos: [3, 1],
        ledd: [{ entitet: "BAT", kard: "N", total: true }, { entitet: "BATTYPE", kard: "1", total: false }]
      },
      {
        id: "VEDLIKEHOLD", navn: "VEDLIKEHOLD", identifiserende: false, pos: [2, 2],
        ledd: [{ entitet: "BAT", kard: "1", total: false }, { entitet: "ARBEIDSORDRE", kard: "N", total: true }]
      },
      {
        id: "LIGGER_I", navn: "LIGGER_I", identifiserende: false, pos: [3, 2],
        ledd: [{ entitet: "BAT", kard: "1", total: false }, { entitet: "BAS", kard: "1", total: false }]
      },
      {
        id: "FOR", navn: "FOR", identifiserende: false, pos: [1, 3],
        ledd: [{ entitet: "FAKTURA", kard: "1", total: true }, { entitet: "ARBEIDSORDRE", kard: "1", total: false }]
      },
      {
        id: "SENDT_TIL", navn: "SENDT_TIL", identifiserende: false, pos: [0, 2],
        ledd: [{ entitet: "KUNDE", kard: "1", total: false }, { entitet: "FAKTURA", kard: "N", total: false }],
        attr: [{ navn: "DatoSendt" }]
      }
    ],
    merknad: "Figur 1 i sensorveiledningsfila («En mulig korrekt ER-modell er som følger:»), overført til data. Plasseringen følger originalen omtrent."
  };

  /* ------------------------------------------------- felles sensortekst */

  var SQL_GENERELT =
    "<p>Generelt gjelder følgende (men disse må sees litt i sammenheng med oppgaven):</p><ul>" +
    "<li>-0.5 for manglende kolonner i SELECT</li>" +
    "<li>-1 for manglende/feil tabeller i joins i FROM</li>" +
    "<li>-1 for manglende begrensning i WHERE</li>" +
    "<li>-2 for aggregering (count, sum, osv.) i WHERE-klausulen</li>" +
    "<li>-2 for manglende ORDER BY eller GROUP BY</li>" +
    "<li>Ingen trekk for å kun ha primærnøkkel i GROUP BY men andre attributter (fra samme tabell) i SELECT (støttes av PostgreSQL)</li>" +
    "<li>Ingen trekk for enkle syntaksfeil man enkelt ville funnet ut av om man hadde mulighet til å kjøre spørringen</li>" +
    "<li>Merk: Det var en skrivefeil i databaseskjema-dokumentet som var vedlagt eksamen, hvor CREATE-kommandoen for oppgave " +
    "manglet prosjekt-kolonnen. Denne var derimot oppgitt i eksempeldataene. Dersom noen har løst oppgavene uten denne kolonnen, " +
    "og da f.eks. antatt at prosjektet til en oppgave er gitt ved den ansvarliges prosjekt-medlemskap (via medlemskap-tabellen) " +
    "skal dette også gi full uttelling.</li></ul>";

  var SQL_MERKNAD =
    "Sensorveiledningen har ingen egne kriterier for denne oppgaven utover de generelle punktene for SQL-delen. " +
    "SQL-en er gjengitt ordrett fra sensorveiledningsfila, der den står under overskriften «Løsningsforslag».";

  /* Ordrett fra sensorveiledningsfila (in2090h25_eksamen_sensur.pdf), under «Løsningsforslag». */
  var SENSOR_SQL = {
    "2.2":
      "SELECT o.beskrivelse, a.navn\n" +
      "FROM oppgave AS o JOIN ansatt AS a ON (o.ansvarlig = a.aid)\n" +
      "WHERE o.frist = current_date;",
    "2.3":
      "BEGIN;\n\n" +
      "CREATE TABLE emneord (\n" +
      "    oppgave int REFERENCES oppgave(oid),\n" +
      "    ord text CHECK (length(ord) >= 3)\n" +
      ");\n\n" +
      "INSERT INTO emneord VALUES\n" +
      "(1, 'Struktur'),\n" +
      "(2, 'Design'),\n" +
      "(2, 'CSS');\n\n" +
      "COMMIT;",
    "2.4":
      "UPDATE oppgave\n" +
      "SET ansvarlig = (\n" +
      "        SELECT leder\n" +
      "        FROM prosjekt\n" +
      "        WHERE pid = prosjekt\n" +
      "    )\n" +
      "WHERE ansvarlig IS NULL;",
    "2.5":
      "WITH\n" +
      "  store_prosjekter AS (\n" +
      "    SELECT p.pid, p.navn\n" +
      "    FROM prosjekt AS p JOIN medlem AS m ON (p.pid = m.prosjekt)\n" +
      "    GROUP BY p.pid, p.navn\n" +
      "    HAVING count(*) > 3\n" +
      "  )\n" +
      "SELECT p.navn, max(o.frist) - min(o.frist) AS lengde\n" +
      "FROM store_prosjekter AS p JOIN oppgave AS o ON (p.pid = o.prosjekt)\n" +
      "GROUP BY pid, navn;",
    "2.6":
      "CREATE VIEW prosjektstatus AS\n" +
      "WITH\n" +
      "  antall AS (\n" +
      "    SELECT prosjekt, count(ferdig) AS f, count(*) AS t\n" +
      "    FROM oppgave\n" +
      "    GROUP BY prosjekt\n" +
      "  )\n" +
      "SELECT p.navn,\n" +
      "       100 * (f::float/t) AS prosent_ferdig\n" +
      "FROM antall\n" +
      "     JOIN prosjekt AS p ON (prosjekt = p.pid)\n" +
      "ORDER BY prosent_ferdig DESC;",
    "2.7":
      "WITH\n" +
      "  timer AS (\n" +
      "    SELECT ansvarlig AS ansatt, 7 AS ant_timer\n" +
      "    FROM oppgave\n" +
      "    UNION ALL\n" +
      "    SELECT p.leder AS ansatt, 2 AS ant_timer\n" +
      "    FROM prosjekt AS p JOIN oppgave AS o ON (p.pid = o.prosjekt)\n" +
      "  )\n" +
      "SELECT a.navn, sum(t.ant_timer) AS timer_totalt\n" +
      "FROM ansatt AS a\n" +
      "     LEFT JOIN timer AS t ON (a.aid = t.ansatt)\n" +
      "GROUP BY a.aid, a.navn;"
  };

  var FD_INTRO =
    "<p>Vi betrakter relasjonen:</p><p class=\"et-c\"><i>R</i>(<i>A</i>, <i>B</i>, <i>C</i>, <i>D</i>)</p>" +
    "<p>med følgende funksjonelle avhengigheter:</p><ul><li><i>A</i> → <i>B</i></li><li><i>B</i> → <i>C</i></li></ul>";

  var FD_SAMME =
    "<p>Vi bruker samme relasjon og FDer som forrige oppgave, altså:</p><p class=\"et-c\"><i>R</i>(<i>A</i>, <i>B</i>, <i>C</i>, <i>D</i>)</p>" +
    "<p>med følgende funksjonelle avhengigheter:</p><ul><li><i>A</i> → <i>B</i></li><li><i>B</i> → <i>C</i></li></ul>";

  var FD_IGJEN =
    "<p>Vi bruker igjen samme relasjon og FDer som forrige oppgave, altså:</p><p class=\"et-c\"><i>R</i>(<i>A</i>, <i>B</i>, <i>C</i>, <i>D</i>)</p>" +
    "<p>med følgende funksjonelle avhengigheter:</p><ul><li><i>A</i> → <i>B</i></li><li><i>B</i> → <i>C</i></li></ul>";

  function instans(navn, hode, rader) {
    var h = "<p><b>" + navn + "</b></p><table><thead><tr>";
    for (var i = 0; i < hode.length; i++) h += "<th>" + hode[i] + "</th>";
    h += "</tr></thead><tbody>";
    for (var r = 0; r < rader.length; r++) {
      h += "<tr>";
      for (var c = 0; c < rader[r].length; c++) h += "<td>" + rader[r][c] + "</td>";
      h += "</tr>";
    }
    return h + "</tbody></table>";
  }

  var ABCD = ["A", "B", "C", "D"];
  var RADER_TALL = ["0", "1", "2", "3", "4", "5"];

  /* ---------------------------------------------------------------- oppgaver */

  var OPPGAVER = [
    /* ===================== Del 1 ===================== */
    {
      key: "H2025-1.1", year: "H2025", oppgave_nr: "Oppgave 1.1", ark: "ER-modell",
      title: "Fritidsbåt-firmaet: ER-modell", points: 18, block: "er",
      tema: ["svak entitet", "identifiserende relasjon", "sammensatt attributt", "flerverdiattributt", "1-1", "relasjonsattributt"],
      ordrett: true,
      oppgave:
        "<p>Lag et ER-diagram basert på beskrivelsen i oppgaveteksten under. Sørg for å inkludere: entitetstyper, attributter, nøkler, " +
        "relasjonstyper, kardinaliteter, flerverdiattributter og eventuelle sammensatte attributter. For hver relasjonstype, husk å oppgi " +
        "kardinalitet og marker om hver side har total eller partiell deltakelse.</p>" +
        "<p>Du skal modellere informasjon som et fritidsbåt-firma skal bruke som grunnlag for å designe en database-løsning. Databasen skal " +
        "inneholde informasjon om kunder, kundenes båter, og fakturaer som sendes etter at vedlikeholdsarbeid er utført. Lag ER-diagram ut fra " +
        "følgende beskrivelse.</p>" +
        "<p>En kunde identifiseres med kundenummer. Kunden har et navn. I tillegg har kunden en postadresse og en fakturaadresse. Begge disse " +
        "adressene er satt sammen av gatenavn, gatenummer, og postnummer. Kunden skal ha et unikt telefonnummer som kunden kan nås på. I tillegg " +
        "kan kunden ha registrert en eller flere andre telefonnummer som kunden kan ringe inn fra for å åpne porten til en havn utenfor åpningstid. " +
        "Merk at de ekstra telefonnumrene er knyttet til kunden, ikke til båten.</p>" +
        "<p>Firma har et register over båttyper. En båttype er identifisert ved et kortnavn, og inneholder dessuten data om modell og " +
        "typebetegnelse. For eksempel kan BE6 være kortnavn for modellen BRIG EAGLE 6 med typebetegnelse RIB.</p>" +
        "<p>En kunde uten en båt kan være registrert i systemet. Men dersom en båt er registrert, må den ha en unik kunde som står som ansvarlig " +
        "for båten. Den må også være registrert med én (og bare én) båttype. Flere båter kan ha samme båttype. En båt identifiseres med båttype og " +
        "eksemplar, der eksemplar skiller ulike forekomster av samme båttype. For eksempel, hvis det er registrert to ulike båter av modell BRIG " +
        "EAGLE 6, vil disse kunne identifiseres som BE6-1 og BE6-2. Hvis båten ligger i firmaets havn, skal det registreres hvilken bås båten " +
        "ligger i. Båsen identifiseres med et nummer og har tilknyttet informasjon om bredde og dybde. En bås kan være tom eller ha én båt, men " +
        "ikke flere båter på samme tid.</p>" +
        "<p>Båttypene hentes ned fra et eksternt register, så det vil alltid være mange flere båttyper i databasen enn båter.</p>" +
        "<p>Når firmaet avtaler å gjøre vedlikehold på en båt, opprettes en unik arbeidsordre, identifisert med et ordrenummer, med tilhørende " +
        "arbeidsbeskrivelse. En arbdisordre gjelder bare for én båt. Når vedlikeholdet er ferdig, opprettes en faktura med unikt fakturanummer og " +
        "fakturabeløp. Hver arbeidsordre gir opphav til nøyaktig én faktura, og hver faktura hører til nøyaktig én arbeidsordre. Det registreres " +
        "så dato for når faktura og tilhørende arbeidsordre sendes til kunden som skal betale fakturaen (det trenger ikke være båtens eier).</p>",
      avvik: null,
      losning: [
        "Gå gjennom teksten setning for setning og noter substantivene som har egen identitet: kunde, båttype, båt, bås, arbeidsordre og faktura blir entiteter.",
        "Kunde får to nøkler (kundenummer og det unike telefonnummeret, understreket hver for seg), to sammensatte adresser med gatenavn, gatenummer og postnummer, og et flerverdiattributt for de ekstra porttelefonene.",
        "Båt identifiseres av båttype + eksemplar. Da er båt en svak entitet med eksemplar som delvis nøkkel, eid av båttype gjennom en identifiserende relasjon (dobbel rombe, total deltakelse og N på båtsiden, 1 på båttypesiden).",
        "Båttype har partiell deltakelse fordi det alltid finnes mange typer uten båter. Kunde har partiell deltakelse i ANSVARLIG (kunder uten båt er lov), mens båt er total.",
        "Bås–båt er 1-1 og partiell på begge sider: en båt trenger ikke ligge i havna, og en bås kan stå tom.",
        "Båt 1–N arbeidsordre, total for arbeidsordre (gjelder alltid én båt). Arbeidsordre 1–1 faktura, total for faktura.",
        "Teksten sier at hver arbeidsordre gir «nøyaktig én faktura», og ordrett ville det betydd total deltakelse også for arbeidsordre. Vi leser det likevel som partiell deltakelse, fordi arbeidsordren opprettes før vedlikeholdet og fakturaen finnes først når arbeidet er ferdig. Sensors figur gjør det samme. Skriv tolkningen som kommentar.",
        "Den som betaler er ikke nødvendigvis eieren, så faktura må knyttes direkte til kunde med en egen relasjon (N–1). Datoen for utsending legges som attributt på denne relasjonen."
      ],
      tips: [
        "Sensor gir poeng i fire bolker: entiteter og nøkler, relasjoner og kardinaliteter, bås/arbeidsordre/faktura og attributttypene. Sørg for at alle fire er synlige i tegningen.",
        "Skriv kardinalitet og total/partiell på begge sider av hver rombe. Dette er de vanligste trekkene.",
        "Når teksten sier «identifiseres med X og Y» der X er en annen entitet, er det et sterkt hint om svak entitet. Marker både dobbelt rektangel, dobbel rombe og stiplet understrek på den delvise nøkkelen.",
        "Ikke heng betalerkunden på båten. Teksten sier eksplisitt at betaler kan være en annen enn eieren.",
        "Skriv antakelsene dine som korte kommentarer på arket (for eksempel hvorfor arbeidsordre er partiell i FOR)."
      ],
      del1: null
    },
    {
      key: "H2025-1.2", year: "H2025", oppgave_nr: "Oppgave 1.2", ark: "Oversettelse til relasjonsmodellen",
      title: "Fritidsbåt-firmaet: realisering", points: 7, block: "realisering",
      tema: ["svak entitet", "flerverdiattributt", "sammensatt attributt", "1-1", "1-N", "fremmednøkkel"],
      ordrett: true,
      oppgave:
        "<p>Oversett ER-modellen til et relasjonsskjema. Oppgi relasjoner (tabeller) med primærnøkler og fremmednøkler.</p>",
      avvik: null,
      losning: [
        "Hver vanlig entitet blir én relasjon med sine enkle attributter. Sammensatte attributter flates ut til bladnodene (Post_gatenavn, Post_gatenr, …).",
        "Flerverdiattributtet (porttelefonene) blir en egen relasjon med kundens nøkkel + telefonnummeret, der alle attributtene utgjør nøkkelen.",
        "Den svake entiteten båt får primærnøkkel = eierens nøkkel (Kortnavn) + delvis nøkkel (Eksemplar). Den identifiserende relasjonen TYPE realiseres ikke en gang til.",
        "1-N-relasjonene (ANSVARLIG, VEDLIKEHOLD, SENDT_TIL) blir fremmednøkler på N-siden.",
        "1-1-relasjonene: FOR legges som fremmednøkkel i faktura (siden faktura har total deltakelse, blir den aldri NULL). LIGGER_I legges i båt (partiell på begge sider, så vi velger én side og godtar NULL).",
        "Oppgi KN, PN og FN for hver relasjon og begrunn valgene."
      ],
      tips: [
        "Sensor gir egne poeng for flerverdiattributtet i egen tabell og for de fire fremmednøklene båt → kunde, båt → båttype, arbeidsordre → båt og faktura → arbeidsordre.",
        "En fremmednøkkel til en svak entitet er sammensatt: (Kortnavn, Eksemplar) → Båt(Kortnavn, Eksemplar).",
        "Slå bare sammen to entiteter i en 1-1-relasjon hvis begge sider har total deltakelse. Her har arbeidsordre partiell deltakelse, så de holdes adskilt.",
        "Bruk de samme attributtnavnene i KN/PN/FN-linjene som i selve relasjonen. Det er lett å bytte navn underveis."
      ],
      del1: null
    },
    {
      key: "H2025-1.3", year: "H2025", oppgave_nr: "Oppgave 1.3", ark: "Relasjonsalgebra",
      title: "Relasjonsalgebra på båtskjemaet", points: 5, block: "relasjonsalgebra",
      tema: ["projeksjon", "seleksjon", "theta-join"],
      ordrett: true,
      oppgave:
        "<p>I denne oppgaven skal du bruke relasjonsskjemaet du laget i forrige oppgave.</p><ol>" +
        "<li>Skriv et relasjonsalgebrauttrykk som finner navn og kundenummer for alle kunder som bor i postnummer 1350.</li>" +
        "<li>Skriv et relasjonsalgebrauttrykk som finner navn og telefonnummer for alle kunder som har minst én båt.</li></ol>",
      avvik: null,
      losning: [
        "1: Velg ut kunderadene med riktig postnummer i postadressen (σ), og behold bare de to ønskede kolonnene (π).",
        "2: Koble Kunde og Båt på kundenummeret (join med betingelse), og projiser til navn og telefonnummer. Fordi relasjonsalgebra er mengdebasert, kommer en kunde med flere båter bare med én gang."
      ],
      tips: [
        "Bruk attributtnavnene fra ditt eget skjema i 1.2. Sensor gir 0 poeng for feil tabeller eller feil operatorer, men 0,5 poeng ved småfeil når hovedideen er riktig.",
        "Ved join der begge sider har samme attributtnavn, skriv betingelsen med tabellnavn foran: Kunde.Kundenr = Båt.Kundenr.",
        "Husk at π fjerner duplikater i relasjonsalgebra. Du trenger ikke noe tilsvarende DISTINCT."
      ],
      del1: null
    },

    /* ===================== Del 2 ===================== */
    {
      key: "H2025-2.1", year: "H2025", oppgave_nr: "Oppgave 2.1", ark: "Flervalg",
      title: "Hvor mange rader? (5 spørringer)", points: 10, block: "sql",
      tema: ["LIKE", "NATURAL JOIN", "NULL", "LIMIT/OFFSET", "NOT EXISTS"],
      ordrett: true,
      oppgave:
        "<p>Anta at databasen inneholder nøyaktig de dataene som er vist i eksempel-dataene i den vedlagte PDFen. For hver spørring under, " +
        "oppgi hvor mange rader det er i resultatet. Hvert riktig svar gir 2 poeng, mens hvert uriktige svar gir -0.5 poeng. Blankt " +
        "svar/ubesvart gir 0 poeng. Laveste poengsum på hele oppgaven er 0.</p>",
      avvik: null,
      losning: [
        "Bruk eksempeldataene: ansatt har 5 rader (Kari, Ole, Nasir, Bo, Berit) og prosjekt har 5 rader med lederne 2, 3, 5, 2, 3.",
        "Kjør hver spørring for hånd og tell radene. Svarene er 3, 5, 0, 0 og 2, det samme som sensorveiledningen.",
        "1: navn med liten i er Kari, Nasir og Berit, altså 3.",
        "2: NATURAL JOIN av prosjekt med seg selv joiner på alle kolonnene, så hver rad passer bare med seg selv. Svaret er 5, ikke 25 (det ville vært kryssproduktet).",
        "3: navn != navn er aldri sann (og NULL om navn er NULL), altså 0. 4: OFFSET 5 hopper over alle de 5 radene, altså 0.",
        "5: ansatte som ikke leder noe prosjekt er Kari og Bo, altså 2."
      ],
      tips: [
        "Med +2 for riktig og −0,5 for galt lønner det seg å svare selv om du er usikker.",
        "LIKE skiller mellom store og små bokstaver: '%i%' treffer ikke en stor I.",
        "NATURAL JOIN kobler på alle kolonner med samme navn. Med en tabell mot seg selv er det alle kolonnene."
      ],
      del1: {
        type: "radantall",
        regel: { riktig: 2, feil: -0.5, blankt: 0, min: 0 },
        /* Ordrett fra sensorveiledningsfila. */
        sensor: { fasit: "<p><b>Løsning</b></p><ol><li>3</li><li>5</li><li>0</li><li>0</li><li>2</li></ol>", merknad: "Stemmer med våre utregninger." },
        intro:
          "<p>Anta at databasen inneholder nøyaktig de dataene som er vist i eksempel-dataene i den vedlagte PDFen. For hver spørring under, " +
          "oppgi hvor mange rader det er i resultatet.</p>",
        items: [
          {
            q: "<p>1.</p>",
            sql: "SELECT *\nFROM ansatt\nWHERE navn LIKE '%i%';",
            options: RADER_TALL, answer: 3,
            explain: "<p>Mønsteret '%i%' krever en liten i et sted i navnet. Kari, Nasir og Berit har det. Ole og Bo har det ikke. Det gir 3 rader.</p>"
          },
          {
            q: "<p>2.</p>",
            sql: "SELECT *\nFROM prosjekt AS p1\n  NATURAL JOIN prosjekt AS p2;",
            options: RADER_TALL, answer: 5,
            explain: "<p>Når tabellen joines med seg selv, er <i>alle</i> kolonnene felles, så NATURAL JOIN krever at hele raden er lik. " +
              "Hver rad passer bare med seg selv, og resultatet er de 5 prosjektene. (Det samme gjelder om man bruker CREATE-skriptets " +
              "versjon uten pid. En rad med NULL i en kolonne ville derimot falt bort, fordi NULL = NULL ikke er sant.)</p>"
          },
          {
            q: "<p>3.</p>",
            sql: "SELECT *\nFROM ansatt\nWHERE navn != navn;",
            options: RADER_TALL, answer: 0,
            explain: "<p>En verdi er aldri ulik seg selv, så betingelsen er usann for alle rader. Hadde navn vært NULL, ville sammenligningen gitt NULL (ukjent), og raden ville heller ikke kommet med. 0 rader.</p>"
          },
          {
            q: "<p>4.</p>",
            sql: "SELECT *\nFROM prosjekt\nLIMIT 1\nOFFSET 5;",
            options: RADER_TALL, answer: 0,
            explain: "<p>OFFSET 5 hopper over de 5 første radene. Prosjekt har akkurat 5 rader, så det er ingenting igjen å hente ut med LIMIT 1. 0 rader.</p>"
          },
          {
            q: "<p>5.</p>",
            sql: "SELECT *\nFROM ansatt AS a\nWHERE NOT EXISTS (\n  SELECT *\n  FROM prosjekt AS p\n  WHERE a.aid = p.leder\n);",
            options: RADER_TALL, answer: 2,
            explain: "<p>Spørringen finner ansatte som ikke leder noe prosjekt. Lederne er 2, 3 og 5 (2 og 3 leder to hver). Igjen blir Kari (1) og Bo (4), altså 2 rader.</p>"
          }
        ]
      }
    },
    {
      key: "H2025-2.2", year: "H2025", oppgave_nr: "Oppgave 2.2", ark: "Oppgaver i dag",
      title: "Oppgaver med frist i dag", points: 5, block: "sql",
      tema: ["JOIN", "WHERE", "current_date", "LEFT JOIN"],
      ordrett: true,
      oppgave:
        "<p>Skriv en SQL-spørring som finner beskrivelse og navn på ansvarlig ansatt på alle oppgaver med frist i dag. " +
        "<i>Hint:</i> Du kan bruke <code>current_date</code> for dagens dato.</p>",
      avvik: null,
      losning: [
        "Koble oppgave til ansatt via ansvarlig = aid for å få navnet.",
        "Filtrer på frist = current_date.",
        "Oppgaver uten ansvarlig (NULL) forsvinner med vanlig join. Vil du ha med alle oppgavene, bruker du LEFT JOIN, og da blir navnet NULL for dem. Skriv en kommentar om valget."
      ],
      tips: [
        "Bruk den innebygde current_date, ikke en hardkodet dato.",
        "Manglende tabell i join gir −1, og manglende WHERE-begrensning gir −1."
      ],
      del1: null
    },
    {
      key: "H2025-2.3", year: "H2025", oppgave_nr: "Oppgave 2.3", ark: "Emneord",
      title: "CREATE TABLE + INSERT i én transaksjon", points: 7, block: "sql",
      tema: ["CREATE TABLE", "CHECK", "REFERENCES", "INSERT", "BEGIN/COMMIT"],
      ordrett: true,
      oppgave:
        "<p>Skriv en SQL-kommando som oppretter ny tabell med navn <code>emneord</code> som skal ha følgende kolonner:</p><ul>" +
        "<li><code>oppgave</code> som er en fremmenøkkel til <code>oppgave(oid)</code></li>" +
        "<li><code>ord</code> som har typen <code>text</code> og må ha en lengde på 3 eller mer (du kan bruke funksjonen <code>length</code> " +
        "for å finne lengden av en <code>text</code>, f.eks. <code>length('hei') = 3</code>)</li></ul>" +
        "<p>Skriv også en SQL-kommando som gjør at tabellen inneholder følgende data:</p>" +
        "<pre> oppgave |   ord\n---------+----------\n       1 | Struktur\n       2 | Design\n       2 | CSS</pre>" +
        "<p>De to kommandoene skal kjøres som én transaksjon, altså hvis én feiler så feiler begge.</p>",
      avvik: null,
      losning: [
        "Start transaksjonen med BEGIN.",
        "Lag tabellen: oppgave som int med REFERENCES oppgave(oid), og ord som text med CHECK (length(ord) &gt;= 3).",
        "Sett inn de tre radene med én INSERT og flere VALUES-tupler. Tekstverdier står i enkle fnutter.",
        "Avslutt med COMMIT. I PostgreSQL kan også CREATE TABLE inngå i en transaksjon."
      ],
      tips: [
        "Begge kommandoene må stå mellom BEGIN og COMMIT. Det er dette «én transaksjon» betyr.",
        "Husk at CHECK slipper gjennom NULL. Vil du stoppe tomme ord, legg til NOT NULL.",
        "Skriv tallene uten fnutter (oppgave er int) og ordene med fnutter."
      ],
      del1: null
    },
    {
      key: "H2025-2.4", year: "H2025", oppgave_nr: "Oppgave 2.4", ark: "Oppgaver uten ansvarlige",
      title: "UPDATE: ansvarlig = prosjektleder", points: 5, block: "sql-videre",
      tema: ["UPDATE", "korrelert delspørring", "IS NULL"],
      ordrett: true,
      oppgave:
        "<p>Skriv en SQL-kommando som setter ansvarlig lik prosjektlederen for prosjektet som oppgaven tilhører, for alle oppgaver med " +
        "<code>NULL</code> som ansvarlig.</p>",
      avvik:
        "Oppgaven trenger kolonnen oppgave.prosjekt, som mangler i CREATE-skriptet, fordi skjemaet har feil. Vi bruker eksempeldataenes versjon (oppgave.prosjekt → prosjekt(pid)). " +
        "Sensorveiledningen gir generelt full uttelling for å finne prosjektet via den ansvarliges medlemskap (medlem). Det kan ikke virke her, fordi oppgaven gjelder nettopp radene der ansvarlig er NULL.",
      losning: [
        "Bare rader med ansvarlig IS NULL skal endres. Det hører hjemme i WHERE-delen av UPDATE.",
        "Den nye verdien hentes med en delspørring som slår opp lederen til prosjektet som raden peker på. Delspørringen er korrelert, fordi den bruker kolonnen prosjekt fra raden som oppdateres.",
        "På eksempeldataene får oppgave 2 ansvarlig 2 (leder for prosjekt 1), og oppgave 6 får ansvarlig 3 (leder for prosjekt 5)."
      ],
      tips: [
        "Skriv IS NULL, ikke = NULL. = NULL gir NULL (ukjent) og oppdaterer ingenting.",
        "Glemmer du WHERE, blir alle oppgavene overskrevet med prosjektlederen.",
        "Gi tabellen et alias (UPDATE oppgave AS o), så blir det tydelig hvilken kolonne delspørringen viser til."
      ],
      del1: null
    },
    {
      key: "H2025-2.5", year: "H2025", oppgave_nr: "Oppgave 2.5", ark: "Prosjektlengde",
      title: "Lengden til store prosjekter", points: 7, block: "sql-videre",
      tema: ["GROUP BY", "HAVING", "max/min", "delspørring", "datoaritmetikk"],
      ordrett: true,
      oppgave:
        "<p>La lengden til et prosjekt være antall dager fra første frist til siste frist på oppgavene til prosjektet (husk at i SQL kan man " +
        "ta differansen mellom to datoer ved å ta den ene minus den andre, og får da en <code>int</code> som sier hvor mange dager det er mellom " +
        "datoene). La videre et stort prosjekt være et prosjekt med flere enn 3 medlemmer.</p>" +
        "<p>Skrive en spørring som finner lengden til store prosjekter.</p>",
      avvik:
        "Oppgaven trenger kolonnen oppgave.prosjekt og pid i prosjekt, men skjemaet har feil og CREATE-skriptet mangler begge. Vi følger eksempeldataene.",
      losning: [
        "Finn først de store prosjektene: grupper medlem per prosjekt og behold gruppene med HAVING count(*) &gt; 3.",
        "Lengden er max(frist) − min(frist) over oppgavene i hvert prosjekt. Det krever GROUP BY per prosjekt.",
        "Hold de to tellingene adskilt. Teller du medlemmer etter å ha joinet både medlem og oppgave i samme spørring, blir hvert medlem talt én gang per oppgave.",
        "På eksempeldataene har ingen prosjekter mer enn 2 medlemmer, så svaret er tomt. Det er riktig."
      ],
      tips: [
        "Betingelsen på antall medlemmer er en betingelse på en gruppe. Den skal i HAVING, ikke WHERE (−2 for aggregat i WHERE).",
        "«Flere enn 3» betyr &gt; 3, ikke &gt;= 3.",
        "Et prosjekt uten oppgaver har ingen lengde. Skriv en kommentar om at det faller bort."
      ],
      del1: null
    },
    {
      key: "H2025-2.6", year: "H2025", oppgave_nr: "Oppgave 2.6", ark: "Prosent ferdig",
      title: "VIEW prosjektstatus (prosent ferdig)", points: 8, block: "sql-videre",
      tema: ["CREATE VIEW", "count(kol) vs count(*)", "heltallsdivisjon", "ORDER BY DESC"],
      ordrett: true,
      oppgave:
        "<p>Skriv en SQL-kommando som oppretter et VIEW med navn <code>prosjektstatus</code> som inneholder navn på prosjektet og hvor mange " +
        "prosent av oppgavene på prosjektet som er ferdige (altså <code>100 * (F/T)</code>, hvor <code>F</code> er antall ferdige oppgaver på " +
        "prosjektet og <code>T</code> er antall oppgaver på prosjektet totalt). Denne siste kolonnen skal ha navn <code>prosent_ferdig</code>. " +
        "Resultatet skal være sortert på <code>prosent_ferdig</code> fra høyest til lavest.</p>",
      avvik:
        "Oppgaven trenger kolonnen oppgave.prosjekt og pid i prosjekt, men skjemaet har feil og CREATE-skriptet mangler begge. Vi følger eksempeldataene.",
      losning: [
        "Grupper oppgavene per prosjekt.",
        "F er count(ferdig): count på en kolonne hopper over NULL, og ferdig er NULL til oppgaven er gjort. T er count(*), altså alle oppgavene.",
        "Gjør om til desimaltall før du deler (for eksempel ::float). Ellers blir 1/2 til 0 med heltallsdivisjon.",
        "Gi kolonnen navnet prosent_ferdig, sorter med ORDER BY prosent_ferdig DESC og pakk alt inn i CREATE VIEW prosjektstatus AS …"
      ],
      tips: [
        "Manglende CREATE VIEW og manglende DESC er klassiske trekk fra tidligere år.",
        "count(ferdig) mot count(*) er hele poenget med oppgaven. Begge med count(*) gir 100 % overalt.",
        "Med indre join kommer prosjekter uten oppgaver ikke med. Det er bra her, ellers ville du delt på 0."
      ],
      del1: null
    },
    {
      key: "H2025-2.7", year: "H2025", oppgave_nr: "Oppgave 2.7", ark: "Timeregnskap",
      title: "Timeregnskap per ansatt (også 0)", points: 8, block: "sql-videre",
      tema: ["WITH", "UNION ALL", "LEFT JOIN", "sum", "GROUP BY"],
      ordrett: true,
      oppgave:
        "<p>Vi antar at det tar en ansatt 7 timer å gjennomføre én oppgave de er ansvarlige for. Videre antar vi at en ansatt som leder et " +
        "prosjekt bruker 2 timer med oppfølging per oppgave som er del av prosjektet. Skriv en SQL-spørring som finner ut hvor mange timer hver " +
        "ansatt jobber, samt navnet på den ansatte. Merk at det kan være ansatte som ikke jobber noen timer, og disse skal også med i resultatet " +
        "(da enten med 0 eller <code>NULL</code> som antall timer).</p>",
      avvik:
        "Oppgaven trenger kolonnen oppgave.prosjekt og pid i prosjekt, men skjemaet har feil og CREATE-skriptet mangler begge. Vi følger eksempeldataene.",
      losning: [
        "Lag én «timeliste» med en rad per arbeidsbit: (ansvarlig, 7) for hver oppgave og (leder, 2) for hver oppgave i prosjekter vedkommende leder.",
        "Slå de to delene sammen med UNION ALL. Vanlig UNION fjerner like rader, og da forsvinner timer (to oppgaver gir begge raden (1, 7)).",
        "LEFT JOIN ansatt mot timelista, så ansatte uten timer også kommer med, og summer per ansatt med GROUP BY.",
        "Eksempeldata: Kari 14, Ole 7 + 6 = 13, Nasir 7 + 8 = 15, Bo 7, Berit 7 + 2 = 9."
      ],
      tips: [
        "INNER JOIN der rader med 0 skal med, ga −2 i H2019 (oppgave 2.5, band med 0 sanger). Her ville ansatte uten timer forsvunnet.",
        "Unngå å joine ansatt mot både oppgave (som ansvarlig) og prosjekt + oppgave (som leder) i én og samme FROM. Radene ganges da med hverandre, og summen blir for stor.",
        "Oppgaven godtar NULL for ansatte uten timer, så du trenger ingen funksjon som gjør NULL om til 0."
      ],
      del1: null
    },

    /* ===================== Del 3 ===================== */
    {
      key: "H2025-3.1", year: "H2025", oppgave_nr: "Oppgave 3.1", ark: "Funksjonelle avhengigheter og instanser",
      title: "Bryter instansen FD-ene?", points: 4, block: "fd",
      tema: ["FD i instans", "motbevis", "NULL"],
      ordrett: true,
      oppgave:
        FD_INTRO +
        "<p>Nedenfor ser du fire instanser av <i>R</i>. Avgjør om instansen bryter med noen av FDene. Du får 1 poeng per riktig svar, -1 poeng " +
        "per galt svar, og 0 poeng for ubesvart. Minimum poengsum for hele oppgaven er 0 poeng.</p>" +
        "<p><b>Bryter instansen noen av FD-ene?</b></p>",
      avvik:
        "Oppgavearket gir 4 poeng, men sensorveiledningen skriver «3.1 (5 poeng)». Delene summerer til 20 bare med 4 poeng, så vi bruker 4. " +
        "Sensorveiledningens «Full score: Bare Instans I er riktig» betyr at Instans I er den eneste som <i>ikke</i> bryter FD-ene.",
      losning: [
        "For hver FD X → Y: finn rader som er like på X. Hvis de har ulik Y, er FD-en brutt.",
        "Instans I: begge radene med A = 1 har B = x, og alle med B = x har C = y. Ingen brudd.",
        "Instans II: B = x opptrer med både C = y og C = z, så B → C brytes.",
        "Instans III: A = 1 opptrer med både B = x og B = w, så A → B brytes.",
        "Instans IV: A = 1 gir B = x i én rad og NULL i den andre. Sensorveiledningen regner dette som brudd, fordi NULL tolkes som ukjent."
      ],
      tips: [
        "Med ±1 per svar bør du la være å svare hvis du er usikker.",
        "En instans kan bare motbevise en FD, aldri bevise den.",
        "NULL i instansoppgaver er en eksamenskonvensjon fra H25-sensoren. Lysarkene definerer det ikke. Skriv antakelsen din."
      ],
      del1: {
        type: "janei",
        regel: { riktig: 1, feil: -1, blankt: 0, min: 0 },
        /* Ordrett fra sensorveiledningsfila (løsningsforslag + sensorveiledning). */
        sensor: {
          fasit:
            "<p><b>Løsningsforslag</b></p>" +
            "<p>Instans I: NEI<br>Instans II: JA<br>Instans III: JA<br>Instans IV: JA</p>" +
            "<p>Altså, bare Instans I bryter ikke noen FD-er.</p>" +
            "<p>Forklaring:</p><ul>" +
            "<li>Instans I: A = 1 gir konsistent B = x og C = y. B = x gir konsistent C = y. (NEI)</li>" +
            "<li>Instans II: B = x gir både C = y og C = z, altså bryter B → C. (JA)</li>" +
            "<li>Instans III: A = 1 gir B = x og B = w, altså bryter A → B. (JA)</li>" +
            "<li>Instans IV: A = 1 gir B = x og B = NULL → bryter A → B. (JA)</li></ul>",
          kriterier:
            "<p><b>3.1 (5 poeng)</b><br>- 1 poeng per riktig vurdert instans.<br>- Full score: Bare Instans I er riktig.<br>" +
            "- Delvis trekning ved uklare begrunnelser.<br>- NULL tolkes som ukjent, altså gir FD-brudd hvis det fører til tvetydighet.</p>",
          merknad: "Stemmer med våre svar. Sensorveiledningen oppgir 5 poeng, arket 4 (se avvik)."
        },
        intro: FD_INTRO + "<p><b>Bryter instansen noen av FD-ene?</b></p>",
        items: [
          {
            s: instans("Instans I", ABCD, [["1", "x", "y", "9"], ["1", "x", "y", "8"], ["2", "w", "z", "7"]]),
            answer: false,
            explain: "<p>NEI. Radene med A = 1 er like på B (x), og radene med B = x er like på C (y). Den siste raden har både ny A og ny B, så den kan ikke skape konflikt. At D varierer, spiller ingen rolle, for ingen FD har D på høyresiden.</p>"
          },
          {
            s: instans("Instans II", ABCD, [["1", "x", "y", "9"], ["1", "x", "z", "8"], ["2", "w", "z", "7"]]),
            answer: true,
            explain: "<p>JA. De to første radene har B = x, men C = y og C = z. Det bryter B → C. (A → B holder, for begge har B = x.)</p>"
          },
          {
            s: instans("Instans III", ABCD, [["1", "x", "y", "9"], ["1", "w", "y", "9"], ["2", "w", "y", "7"]]),
            answer: true,
            explain: "<p>JA. De to første radene har A = 1, men B = x og B = w. Det bryter A → B. (B → C holder, for C er y overalt.)</p>"
          },
          {
            s: instans("Instans IV", ABCD, [["1", "x", "y", "9"], ["1", "NULL", "y", "9"]]),
            answer: true,
            explain: "<p>JA, etter sensorveiledningen: «NULL tolkes som ukjent, altså gir FD-brudd hvis det fører til tvetydighet.» " +
              "Med A = 1 i begge radene kan vi ikke vite at B er den samme, så A → B regnes som brutt. Dette er en konvensjon for denne eksamenen og ikke noe lysarkene definerer.</p>"
          }
        ]
      }
    },
    {
      key: "H2025-3.2", year: "H2025", oppgave_nr: "Oppgave 3.2", ark: "Nøkler og normalformer",
      title: "Kandidatnøkler og høyeste normalform", points: 5, block: "fd",
      tema: ["tillukning", "kandidatnøkkel", "2NF", "partiell avhengighet"],
      ordrett: true,
      oppgave:
        FD_SAMME +
        "<p><b>a)</b> Finn alle kandidatnøkler i <i>R</i>. <span class=\"et-p\">(3p)</span></p>" +
        "<p><b>b)</b> Bestem hvilken høyeste normalform (1NF, 2NF, 3NF eller BCNF) <i>R</i> er i. Begrunn kort. <span class=\"et-p\">(2p)</span></p>",
      avvik: null,
      losning: [
        "a) A og D står aldri på en høyreside, så de må være med i alle kandidatnøkler. Tillukningen {A, D}⁺ = {A, B, C, D} = R, så {A, D} er en supernøkkel. Den er minimal, fordi A⁺ = {A, B, C} og D⁺ = {D} ikke er hele R. Da er {A, D} eneste kandidatnøkkel.",
        "b) Ta FD-ene én for én. A → B: A er ikke supernøkkel (BCNF brytes), B er ikke nøkkelattributt (3NF brytes), og A er en ekte del av kandidatnøkkelen {A, D} (2NF brytes). R er derfor bare på 1NF.",
        "B → C bryter 3NF, fordi B ikke er supernøkkel og C ikke er nøkkelattributt. 2NF holder for denne FD-en, fordi B ikke er en ekte del av noen kandidatnøkkel. Det er A → B som drar R ned til 1NF."
      ],
      tips: [
        "Huskeregelen for nøkler: et attributt som aldri står på en høyreside, er med i alle kandidatnøkler.",
        "2NF handler bare om ikke-nøkkelattributter som avhenger av en ekte del av en kandidatnøkkel. Sjekk begge betingelsene.",
        "Vis tillukningene. Det er det sensor ser etter i en begrunnelse."
      ],
      del1: null
    },
    {
      key: "H2025-3.3", year: "H2025", oppgave_nr: "Oppgave 3.3", ark: "Tapsfri dekomponering",
      title: "Første BCNF-steg og tapsfrihet", points: 6, block: "normalisering",
      tema: ["BCNF-algoritmen", "tillukning", "Fagins teorem", "tapsfri"],
      ordrett: true,
      oppgave:
        FD_IGJEN +
        "<p>Bruk standardalgoritmen for tapsfri dekomponering.</p>" +
        "<p><b>a)</b> Identifiser en FD som bryter BCNF. <span class=\"et-p\">(1p)</span></p>" +
        "<p><b>b)</b> Utfør første trinn av BCNF-dekomponeringen av <i>R</i>, slik at <i>R</i> blir dekomponert til to relasjoner <i>R</i>1 og " +
        "<i>R</i>2 ved å bruke FDen du identifiserte i a). Oppgi de nye relasjonene med atributter. <span class=\"et-p\">(3p)</span></p>" +
        "<p><b>c)</b> Er denne dekomponeringen tapsfri? Begrunn kort. <span class=\"et-p\">(2p)</span></p>",
      avvik:
        "Sensorveiledningen og løsningsforslaget er uenige om b). Sensorveiledningen sier R1(A, B), R2(A, C, D). " +
        "Løsningsforslaget (og standardalgoritmen) gir R1(A, B, C), R2(A, D), fordi første del skal være tillukningen A⁺ = {A, B, C}. " +
        "Vårt svar følger algoritmen. Sensorens variant er også tapsfri, men den er ikke det standardalgoritmen gir.",
      losning: [
        "a) A → B bryter BCNF fordi A⁺ = {A, B, C} ≠ R, så A er ikke supernøkkel. (B → C ville også fungert: B⁺ = {B, C} gir R1(B, C) og R2(A, B, D).)",
        "b) Algoritmen: med Y = A er Y⁺ = {A, B, C}. Del R i S₁(Y⁺) = R1(A, B, C) og S₂(Y ∪ (R − Y⁺)) = R2(A, D).",
        "R1 har kandidatnøkkel {A} og FD-ene A → B og B → C. R2 har kandidatnøkkel {A, D} og ingen ikke-trivielle FD-er.",
        "c) Ja. Fellesattributtet er A, og A → BC, altså bestemmer A hele R1. Ifølge Fagins teorem er dekomponeringen da tapsfri.",
        "Til info: R1 er ennå ikke på BCNF (B → C), så neste trinn ville delt R1 videre i (B, C) og (A, B)."
      ],
      tips: [
        "Første del er alltid hele tillukningen Y⁺, ikke bare Y og høyresiden i FD-en.",
        "Oppgi FD-er og kandidatnøkler for de nye relasjonene selv om oppgaven ikke krever det eksplisitt. Det har gitt trekk når det mangler.",
        "Tapsfrihet begrunnes med at fellesattributtene bestemmer resten av én av delene."
      ],
      del1: null
    },
    {
      key: "H2025-3.4", year: "H2025", oppgave_nr: "Oppgave 3.4", ark: "Stramme inn med flere funksjonelle avhengigheter",
      title: "Legg til FD-er slik at R blir BCNF", points: 5, block: "normalisering",
      tema: ["BCNF", "supernøkkel", "tillukning"],
      ordrett: true,
      oppgave:
        FD_IGJEN +
        "<p>Vi ønsker å beholde relasjonen <i>R</i>(<i>A</i>, <i>B</i>, <i>C</i>, <i>D</i>) uten å dekomponere den, men i stedet legge til flere " +
        "funksjonelle avhengigheter slik at <i>R</i> blir i BCNF.</p>" +
        "<p>Foreslå ett konkret sett med nye funksjonelle avhengigheter som kan legges til de opprinnelige (<i>A</i> → <i>B</i> og <i>B</i> → <i>C</i>) " +
        "slik at <i>R</i> kommer i BCNF. Begrunn kort at den resulterende mengden av funksjonelle avhengigheter faktisk gir BCNF.</p>",
      avvik: null,
      losning: [
        "BCNF krever at venstresiden i hver ikke-triviell FD er en supernøkkel. Vi kan ikke fjerne A → B eller B → C, så både A og B må bli supernøkler.",
        "Gjør B til supernøkkel ved å la B bestemme det som mangler: legg til B → A og B → D. Da er B⁺ = {A, B, C, D}.",
        "A blir også supernøkkel: A → B gir B, og så gir B resten. A⁺ = {A, B, C, D}.",
        "Kontroller at ingen andre FD-er kan bryte: alle mengder uten A og B (C, D, CD) har bare seg selv i tillukningen, så de gir bare trivielle FD-er. Alle ikke-trivielle FD-er har derfor A eller B på venstresiden, og R er på BCNF."
      ],
      tips: [
        "Å legge til bare A → D er ikke nok. Da er A supernøkkel, men B → C bryter fortsatt BCNF, fordi B⁺ = {B, C}.",
        "Sensor vil se at du har sjekket alle ikke-trivielle FD-er, ikke bare de du la til. Vis tillukningene.",
        "Flere svar er riktige. Det som teller, er at både A og B blir supernøkler og at du begrunner det."
      ],
      del1: null
    }
  ];

  BANK["H2025"] = {
    year: "H2025",
    dato: "12.12.2025",
    varighet: "6 timer",
    hjelpemidler: "Alle trykte og skrevne hjelpemidler tillatt.",
    merknad:
      "Forsiden oppgir 6 timer (13:00–19:00). Forsiden kaller del 1 «Modellering og realisering (30)», " +
      "mens overskriften i oppgavesettet er «ER-modellering, relasjonsmodellen og relasjonsalgebra (30)».",
    deler: [
      { navn: "ER-modellering, relasjonsmodellen og relasjonsalgebra", poeng: 30 },
      {
        navn: "SQL", poeng: 50,
        intro:
          "<p>Oppgavene i denne delen er om SQL. Alle oppgavene vil bruke det samme databaseskjemaet, og en beskrivelse av dette er vedlagt " +
          "som PDF for hver oppgave.</p><p>Du må gjerne inkludere kommentarer i spørringene (gjøres med “--” i SQL). Dersom det er uklarheter " +
          "eller tvetydigheter i oppgavebeskrivelsen, bruk sunn fornuft og skriv en kommentar om hvilke antagelser og tolkinger du gjør.</p>"
      },
      { navn: "Relasjonsmodellen, normalformer og dekomposisjon", poeng: 20 }
    ],
    skjema: SKJEMA,
    er: {},
    oppgaver: OPPGAVER
  };

  /* ============================================================ PERFEKT */

  IN.PERFEKT["H2025-1.1"] = {
    type: "skjonn",
    svar: [
      {
        del: "",
        tekst:
          "<p>Seks entiteter: KUNDE, BÅTTYPE, BÅT (svak), BÅS, ARBEIDSORDRE og FAKTURA.</p><ul>" +
          "<li><b>KUNDE</b>: Kundenr og Telefonnr er nøkler (understreket hver for seg). Postadresse og Fakturaadresse er sammensatte " +
          "(Gatenavn, Gatenr, Postnr). Porttelefon er et flerverdiattributt (dobbel oval).</li>" +
          "<li><b>BÅTTYPE</b>: Kortnavn (nøkkel), Modell, Typebetegnelse.</li>" +
          "<li><b>BÅT</b> er svak (dobbelt rektangel) med delvis nøkkel Eksemplar (stiplet understrek). Den identifiseres gjennom " +
          "<b>TYPE</b> (dobbel rombe): N og total ved BÅT, 1 og partiell ved BÅTTYPE (mange typer har ingen båt).</li>" +
          "<li><b>ANSVARLIG</b>: 1 ved KUNDE (partiell, kunder uten båt er lov), N ved BÅT (total, hver båt har én ansvarlig).</li>" +
          "<li><b>BÅS</b>: Nummer (nøkkel), Bredde, Dybde. <b>LIGGER_I</b> er 1-1 og partiell på begge sider.</li>" +
          "<li><b>ARBEIDSORDRE</b>: Ordrenr (nøkkel), Beskrivelse. <b>VEDLIKEHOLD</b>: 1 ved BÅT (partiell), N ved ARBEIDSORDRE (total).</li>" +
          "<li><b>FAKTURA</b>: Fakturanr (nøkkel), Beløp. <b>FOR</b> er 1-1: total ved FAKTURA, partiell ved ARBEIDSORDRE. " +
          "Teksten sier «nøyaktig én faktura» per arbeidsordre, men vi leser det som partiell deltakelse, fordi arbeidsordren finnes før fakturaen " +
          "(fakturaen lages først når arbeidet er ferdig). Sensors figur gjør det samme.</li>" +
          "<li><b>SENDT_TIL</b> mellom FAKTURA (N, partiell, fordi den ikke er sendt ennå) og KUNDE (1, partiell). Attributtet Dato står på relasjonen. " +
          "Betaleren kobles direkte, fordi det ikke trenger å være båtens eier.</li></ul>",
        er: ER_SVAR,
        poeng: [
          "Entiteter og nøkler, med to separate nøkler på KUNDE og Kortnavn på BÅTTYPE (3–4p)",
          "Relasjoner med kardinalitet og total/partiell deltakelse på begge sider (3–4p)",
          "BÅS med 1-1, ARBEIDSORDRE med VEDLIKEHOLD og FAKTURA med FOR/SENDT_TIL (2–3p)",
          "Sammensatte adresser og flerverdiattributtet Porttelefon (1–2p)",
          "Svak entitet BÅT med delvis nøkkel og identifiserende relasjon TYPE"
        ]
      }
    ],
    hvorfor: {
      eli5:
        "<p>Tenk på et båtverksted med et kartotek. Hver kunde har et kort med nummer, navn, to adresser og telefonnumre. Hver båt har en lapp " +
        "som sier «BE6, eksemplar nr. 1». Lappen gir bare mening sammen med båttypen, akkurat som «leilighet 3» bare gir mening sammen med " +
        "gateadressen. Derfor er båten «svak»: den låner identiteten fra båttypen. En arbeidsordre hører til én båt. Når jobben er ferdig, kommer " +
        "det én regning, og den kan sendes til en annen kunde enn den som eier båten.</p>",
      normal:
        "<p>Vi lager en entitet for hver ting som har sin egen identitet. Båt identifiseres av båttype + eksemplar. Den har altså ingen egen " +
        "nøkkel og blir en svak entitet med båttype som eier. Kardinalitetene leses rett ut av teksten: «én (og bare én) båttype» gir 1 ved " +
        "BÅTTYPE og total deltakelse for BÅT, og «kunde uten båt kan være registrert» gir partiell deltakelse for KUNDE. Faktura og arbeidsordre " +
        "er 1-1, men arbeidsordren finnes før fakturaen, så bare fakturasiden er total. Betaleren er en egen relasjon til KUNDE, siden den kan " +
        "være en annen enn eieren. Sendedatoen er en egenskap ved selve utsendingen og legges derfor på relasjonen.</p>",
      teknisk:
        "<p>Svak entitet brukes når den delvise nøkkelen (Eksemplar) bare er unik innenfor en eier (BÅTTYPE). I den identifiserende relasjonen " +
        "har den svake entiteten alltid total deltakelse, og det står 1 på eiersiden. At det står N på båtsiden, kommer av at én båttype kan ha mange båter. " +
        "Det er vanlig for svake entiteter, men ingen regel. At det «alltid finnes flere båttyper enn båter», er et hint om at " +
        "BÅTTYPE har partiell deltakelse. Telefonnummeret er unikt og blir derfor en ekstra nøkkel. Porttelefonene er mange per kunde og blir et " +
        "flerverdiattributt. Adressene er sammensatte, så realiseringen kan beholde bladnodene. For 1-1-relasjoner er det deltakelsen som avgjør " +
        "realiseringen senere: FOR er total bare på fakturasiden, så fremmednøkkelen bør ligge i FAKTURA. Dato på SENDT_TIL kunne også stått på " +
        "FAKTURA, fordi relasjonen er N-1, men på relasjonen viser den tydeligere hva datoen gjelder.</p>"
    },
    sensor: {
      deler: [
        {
          del: "1.1 (18 poeng)",
          fasit: "<p><b>Løsningsforslag</b></p><p>En mulig korrekt ER-modell er som følger:</p><p><i>Figure 1: ER-modell</i></p>",
          er: ER_SENSOR,
          kriterier:
            "<ul><li>3–4 p: Korrekte entitetstyper og nøkler</li>" +
            "<li>3–4 p: Korrekte relasjoner og kardinaliteter</li>" +
            "<li>2–3 p: Riktig modellering av bås, arbeidsordre, faktura</li>" +
            "<li>1–2 p: Sammensatte attributter og flerverdiattributt riktig</li>" +
            "<li>Delvis trekk ved feil kardinalitet eller mangler</li>" +
            "<li>Store feil gir maks 5–6 p</li></ul>"
        }
      ],
      merknad:
        "Intervallene i sensorveiledningen summerer til 9–13 av 18 poeng. Hvordan resten fordeles, står ikke. " +
        "Figuren i sensorveiledningsfila (gjengitt som data i feltet er) gjør de samme hovedvalgene som oss (svak BÅT eid av BÅTTYPE, total FAKTURA og partiell ARBEIDSORDRE i FOR, " +
        "sendedato som relasjonsattributt, SENDT_TIL partiell på begge sider). " +
        "Ordet «arbdisordre» er en skrivefeil i oppgaveteksten og er beholdt."
    }
  };

  IN.PERFEKT["H2025-1.2"] = {
    type: "skjonn",
    svar: [
      {
        del: "",
        tekst:
          "<p>Realisert fra vår ER-modell i 1.1. Valgene våre:</p><ul>" +
          "<li>Sammensatte adresser flates ut til bladnodene med prefiks (Post_, Faktura_).</li>" +
          "<li>Porttelefon (flerverdi) får egen relasjon, der begge attributtene utgjør nøkkelen. Nummeret heter Porttelefonnr, så det ikke forveksles med hovednummeret Telefonnr i Kunde.</li>" +
          "<li>Båt (svak) får PN = Båttypens nøkkel + Eksemplar. TYPE realiseres ikke separat.</li>" +
          "<li>ANSVARLIG og VEDLIKEHOLD (1-N) blir FN på N-siden: Kundenr i Båt og (Kortnavn, Eksemplar) i Arbeidsordre. Båt og arbeidsordre er " +
          "total på N-siden, så disse FN-ene blir aldri NULL.</li>" +
          "<li>FOR (1-1, total for faktura) blir FN i Faktura, som aldri er NULL der. Ordrenr i Faktura blir derfor også en kandidatnøkkel. Vi slår ikke " +
          "sammen med Arbeidsordre, fordi arbeidsordre kan finnes uten faktura.</li>" +
          "<li>LIGGER_I (1-1, partiell på begge sider) blir FN i Båt. Båsnr er NULL for båter som ikke ligger i havna, og skal være unik når den finnes. " +
          "Det sparer en egen relasjon.</li>" +
          "<li>SENDT_TIL (N-1) blir FN Betaler i Faktura sammen med datoen. Begge er NULL til fakturaen er sendt.</li></ul>",
        skjema:
          "Kunde(Kundenr, Navn, Telefonnr, Post_gatenavn, Post_gatenr, Post_postnr, Faktura_gatenavn, Faktura_gatenr, Faktura_postnr)\n" +
          "  KN: {Kundenr}, {Telefonnr}\n  PN: {Kundenr}\n\n" +
          "Porttelefon(Kundenr, Porttelefonnr)\n" +
          "  KN: {Kundenr, Porttelefonnr}\n  PN: {Kundenr, Porttelefonnr}\n  FN: Kundenr → Kunde(Kundenr)\n\n" +
          "Båttype(Kortnavn, Modell, Typebetegnelse)\n" +
          "  KN: {Kortnavn}\n  PN: {Kortnavn}\n\n" +
          "Bås(Nummer, Bredde, Dybde)\n" +
          "  KN: {Nummer}\n  PN: {Nummer}\n\n" +
          "Båt(Kortnavn, Eksemplar, Kundenr, Båsnr)\n" +
          "  KN: {Kortnavn, Eksemplar}\n  PN: {Kortnavn, Eksemplar}\n" +
          "  FN: Kortnavn → Båttype(Kortnavn)\n  FN: Kundenr → Kunde(Kundenr)\n  FN: Båsnr → Bås(Nummer)   -- unik, kan være NULL\n\n" +
          "Arbeidsordre(Ordrenr, Beskrivelse, Kortnavn, Eksemplar)\n" +
          "  KN: {Ordrenr}\n  PN: {Ordrenr}\n  FN: (Kortnavn, Eksemplar) → Båt(Kortnavn, Eksemplar)\n\n" +
          "Faktura(Fakturanr, Beløp, Ordrenr, Betaler, Dato_sendt)\n" +
          "  KN: {Fakturanr}, {Ordrenr}\n  PN: {Fakturanr}\n" +
          "  FN: Ordrenr → Arbeidsordre(Ordrenr)\n  FN: Betaler → Kunde(Kundenr)",
        poeng: [
          "Kunde, Båttype og Båt riktig, med sammensatt PN i Båt (2p)",
          "Flerverdiattributtet i egen relasjon Porttelefon (1p)",
          "FN-ene Båt → Kunde, Båt → Båttype, Arbeidsordre → Båt og Faktura → Arbeidsordre (1–2p)",
          "Bås, LIGGER_I og SENDT_TIL realisert med begrunnelse"
        ]
      }
    ],
    hvorfor: {
      eli5:
        "<p>Hver boks i tegningen blir en tabell. En pil fra én boks til en annen blir en kolonne som «peker» til den andre tabellen, akkurat som " +
        "et kundenummer på en båtlapp. Kunden kan ha mange porttelefoner, og de får plass i en egen liten liste. En båt heter «BE6, nr. 1», så " +
        "båttabellen trenger begge delene for å vite hvilken båt det er.</p>",
      normal:
        "<p>Algoritmen er fast: entiteter først, så svake entiteter, så 1-1 og 1-N, så M-N og flerverdiattributter. For 1-N legger vi alltid " +
        "fremmednøkkelen på N-siden, for der har hver rad bare én verdi. For 1-1 velger vi siden med total deltakelse, så kolonnen aldri blir NULL. " +
        "Den svake entiteten tar med seg eierens nøkkel som del av sin egen. Derfor trenger den identifiserende relasjonen ingen tabell.</p>",
      teknisk:
        "<p>Målet er færrest mulig relasjoner og NULL-verdier. FOR er total bare for FAKTURA. Ordrenr i Faktura er da NOT NULL og unik, og blir en " +
        "ekstra kandidatnøkkel. Å slå sammen Faktura og Arbeidsordre krever total deltakelse på begge sider, og det har vi ikke. LIGGER_I er partiell " +
        "på begge sider. Uansett side gir en FN NULL-verdier, mens en egen relasjon Ligger_i(Kortnavn, Eksemplar, Båsnr) med to KN-er gir null NULL-er " +
        "mot én tabell ekstra. Begge valgene er forsvarlige når de begrunnes. Fremmednøkkelen til den svake entiteten Båt er sammensatt: " +
        "(Kortnavn, Eksemplar). Vi kaller FN-en til betaleren Betaler, så den ikke forveksles med eierens Kundenr.</p>"
    },
    sensor: {
      deler: [
        {
          del: "1.2 (7 poeng)",
          fasit:
            "<p><b>Løsningsforslag</b></p>" +
            "<p><b>Kunde</b>(Kundenr, Navn, Post_gatenavn, Post_gatenummer, Post_postnummer, Faktura_gatenavn, Faktura_gatenummer, Faktura_postnummer, Hovedtelefon)<br>" +
            "KN: {Kundenr}, {Telefonnr}<br>PN: {Kundenr}</p>" +
            "<p><b>Porttelefon</b>(Kundenr, Telefon)<br>KN: {Kundenr, Telefon}<br>PN: {Kundenr, Telefon}<br>FN: Kundenr → Kunde(Kundenr)</p>" +
            "<p><b>Båttype</b>(Kortnavn, Modell, Typebetegnelse)<br>KN: {Kortnavn}<br>PN: {Kortnavn}</p>" +
            "<p><b>Bås</b>(BåsNr, Bredde, Dybde)<br>KN: {Nummer}<br>PN: {Nummer}</p>" +
            "<p><b>Båt</b>(Kortnavn, Eksemplar, Kundenr, BåsNr)<br>KN: {Kortnavn, Eksemplar}<br>PN: {Kortnavn, Eksemplar}<br>" +
            "FN1: Kortnavn → Båttype(Kortnavn)<br>FN2: Kundenr → Kunde(Kundenr)<br>FN3: BåsNr → Bås(BåsNr)</p>" +
            "<p><b>Arbeidsordre</b>(Ordrenr, Kortnavn, Eksemplar, Arbeidsbeskrivelse)<br>KN: {Ordrenr}<br>PN: {Ordrenr}<br>" +
            "FN: (Kortnavn, Eksemplar) → Båt(Kortnavn, Eksemplar)</p>" +
            "<p><b>Faktura</b>(Fakturanr, Ordrenr, Beløp, Kundenr, DatoSendt)<br>KN: {Fakturanr}<br>PN: {Fakturanr}<br>" +
            "FN1: Ordrenr → Arbeidsordre(Ordrenr)<br>FN2: Kundenr → Kunde(Kundenr)</p>",
          kriterier:
            "<ul><li>2 p: Riktig Kunde, Båttype, Båt</li>" +
            "<li>1 p: Multiverdiattributt i egen tabell</li>" +
            "<li>1–2 p: Korrekte FN-er (Båt → Kunde, Båt → Båttype, Arbeidsordre → Båt, Faktura → Arbeidsordre)</li></ul>"
        }
      ],
      merknad:
        "Kriteriene summerer til 4–5 av 7 poeng, og resten er ikke beskrevet. Sensor skriver «Multiverdiattributt», mens kurset sier flerverdiattributt. " +
        "Skjemaet i sensorveiledningsfila (gjengitt ordrett over) har noen interne uoverensstemmelser: kandidatnøkkelen oppgis som Telefonnr mens attributtet heter " +
        "Hovedtelefon, Bås-relasjonen har attributtet BåsNr mens nøkkelen oppgis som Nummer, og Ordrenr i Faktura er ikke merket som kandidatnøkkel selv " +
        "om FOR er 1-1. Vårt svar bruker gjennomgående samme navn."
    }
  };

  IN.PERFEKT["H2025-1.3"] = {
    type: "eksamen",
    svar: [
      {
        del: "1.",
        tekst:
          "<p>π<sub>Kundenr, Navn</sub>(σ<sub>Post_postnr = '1350'</sub>(Kunde))</p>" +
          "<p>Vi tolker «bor i» som postadressen. Postnummer behandles som tekst (norske postnumre kan starte med 0).</p>",
        poeng: ["Seleksjon på postnummeret i postadressen", "Projeksjon til Kundenr og Navn"]
      },
      {
        del: "2.",
        tekst:
          "<p>π<sub>Navn, Telefonnr</sub>(Kunde ⋈<sub>Kunde.Kundenr = Båt.Kundenr</sub> Båt)</p>" +
          "<p>Join-en beholder bare kunder som har minst én båt. Kunder med flere båter gir flere rader i join-en, men projeksjonen fjerner duplikatene, " +
          "fordi relasjonsalgebra er mengdebasert. Telefonnr er hovednummeret fra Kunde.</p>",
        poeng: ["Join Kunde med Båt på kundenummer", "Projeksjon til Navn og Telefonnr"]
      }
    ],
    hvorfor: {
      eli5:
        "<p>σ er en sil: den slipper bare gjennom radene som passer. π er en saks: den klipper bort kolonnene du ikke vil ha. ⋈ limer sammen to lister " +
        "der kundenummeret er det samme, så du ser hvem som har båt.</p>",
      normal:
        "<p>Oppgave 1 er en vanlig «velg rader, så kolonner»: σ med betingelsen på postnummer innerst, π ytterst. Oppgave 2 trenger to relasjoner. " +
        "En join med betingelse på kundenummer gir bare kunder som har en båt, og π plukker ut navn og telefon. Det tilsvarer SELECT … FROM Kunde JOIN Båt ON ….</p>",
      teknisk:
        "<p>SELECT k FROM t WHERE u svarer til π<sub>k</sub>(σ<sub>u</sub>(t)). Theta-join R ⋈<sub>θ</sub> S er definert som σ<sub>θ</sub>(R × S), " +
        "så et svar med kryssprodukt og seleksjon er like riktig. «Minst én» uttrykkes med join (eksistens). Man trenger ikke telle, fordi π i relasjonsalgebra " +
        "gir en mengde. Naturlig join (⋈ uten betingelse) ville også fungert hvis Kundenr er det eneste felles attributtnavnet i Kunde og Båt. " +
        "Det må du sjekke mot ditt eget skjema. Kurset skriver naturlig join på to måter: ett lysark bruker ⋆, andre bruker ⋈ uten senket skrift. Begge betyr det samme.</p>"
    },
    sensor: {
      deler: [
        {
          del: "1.3 (5 poeng)",
          fasit:
            "<p><b>Løsningsforslag</b></p>" +
            "<p>1. π<sub>Kundenr,Navn</sub>(σ<sub>Post_postnummer=1350</sub>(Kunde))</p>" +
            "<p>2. π<sub>Navn,Hovedtelefon</sub>(Kunde ⋈<sub>Kunde.Kundenr=Båt.Kundenr</sub> Båt)</p>",
          kriterier:
            "<p>1 p per deloppgave (1–5).<br>0,5 p for småfeil dersom hovedideen er riktig.<br>0 p ved feil tabeller eller feil operatorer.</p>"
        }
      ],
      merknad:
        "Sensorveiledningen sier «1 p per deloppgave (1–5)», men oppgaven har bare to deloppgaver og er verdt 5 poeng. Fordelingen er derfor uklar. " +
        "Løsningsforslaget i sensorveiledningsfila bruker ⋈ med join-betingelse i senket skrift, slik kurset gjør, og sammenligner postnummeret med tallet 1350 uten fnutter. Begge deler er greit."
    }
  };

  IN.PERFEKT["H2025-2.2"] = {
    type: "eksamen",
    svar: [
      {
        del: "",
        tekst: "<p>LEFT JOIN tar med også oppgaver uten ansvarlig (navnet blir da NULL). Vil man bare ha oppgaver med en ansvarlig, kan man bruke vanlig JOIN.</p>",
        sql:
          "-- Tar med alle oppgaver med frist i dag, også de uten ansvarlig (navn blir NULL)\n" +
          "SELECT o.beskrivelse, a.navn\n" +
          "FROM oppgave AS o\n" +
          "  LEFT JOIN ansatt AS a ON (o.ansvarlig = a.aid)\n" +
          "WHERE o.frist = current_date;",
        poeng: ["Join oppgave–ansatt på ansvarlig = aid", "WHERE o.frist = current_date", "Beskrivelse og navn i SELECT"]
      }
    ],
    hvorfor: {
      eli5:
        "<p>Du har en liste over oppgaver og en liste over folk. Du ser på oppgavene som skal være ferdige i dag, og slår opp navnet på den som har ansvaret.</p>",
      normal:
        "<p>Navnet står i ansatt, mens fristen står i oppgave, så vi må koble tabellene. Koblingen går fra ansvarlig til aid. current_date gir dagens dato, " +
        "så spørringen virker hver dag uten endringer.</p>",
      teknisk:
        "<p>Kolonnen ansvarlig kan være NULL. Med INNER JOIN gir ansvarlig = aid da NULL (ukjent), og raden forsvinner. Teksten sier «alle oppgaver», " +
        "og derfor bruker vi LEFT JOIN, som beholder oppgaven og fyller navn med NULL. Filteret står på oppgave (venstre tabell) og påvirker derfor " +
        "ikke ytre-join-effekten. Tilleggsfelle (står ikke i kursmaterialet): hadde vi filtrert på en kolonne fra ansatt i WHERE, ville radene med NULL forsvunnet igjen, " +
        "og den ytre joinen ville virket som en indre join.</p>"
    },
    sensor: { deler: [{ del: "Løsningsforslag", fasit: "", sql: SENSOR_SQL["2.2"], kriterier: SQL_GENERELT }], merknad: SQL_MERKNAD + " Løsningsforslaget bruker vanlig (indre) join og tar altså ikke med oppgaver uten ansvarlig. Sensorveiledningen sier ikke noe om LEFT JOIN. Vårt svar bygger på tolkningen «alle oppgaver», som en kommentar i svaret bør nevne." }
  };

  IN.PERFEKT["H2025-2.3"] = {
    type: "eksamen",
    svar: [
      {
        del: "",
        tekst: "<p>Begge kommandoene står mellom BEGIN og COMMIT. Feiler én av dem, rulles hele transaksjonen tilbake. NOT NULL og primærnøkkelen er ekstra, men fornuftige.</p>",
        sql:
          "BEGIN;\n\n" +
          "CREATE TABLE emneord (\n" +
          "  oppgave int NOT NULL REFERENCES oppgave(oid),\n" +
          "  ord text NOT NULL CHECK (length(ord) >= 3),  -- CHECK slipper gjennom NULL, derfor NOT NULL\n" +
          "  PRIMARY KEY (oppgave, ord)                   -- ekstra: samme ord ikke to ganger per oppgave\n" +
          ");\n\n" +
          "INSERT INTO emneord (oppgave, ord) VALUES\n" +
          "  (1, 'Struktur'),\n" +
          "  (2, 'Design'),\n" +
          "  (2, 'CSS');\n\n" +
          "COMMIT;",
        poeng: [
          "CREATE TABLE emneord med oppgave som FN til oppgave(oid)",
          "ord text med CHECK (length(ord) &gt;= 3)",
          "INSERT av de tre radene",
          "BEGIN … COMMIT rundt begge kommandoene"
        ]
      }
    ],
    hvorfor: {
      eli5:
        "<p>En transaksjon er som en pakke: enten kommer hele pakken fram, eller ingenting. Vi lager en ny liste med emneord og fyller den med tre " +
        "ord. Regelen «minst tre bokstaver» sørger for at ingen skriver inn for korte ord.</p>",
      normal:
        "<p>REFERENCES oppgave(oid) gjør oppgave til en fremmednøkkel, så du bare kan bruke oppgave-ID-er som finnes. CHECK (length(ord) &gt;= 3) " +
        "avviser for korte ord. BEGIN starter transaksjonen og COMMIT lagrer alt på én gang. Feiler INSERT, finnes heller ikke tabellen etterpå.</p>",
      teknisk:
        "<p>En CHECK-skranke avviser bare rader der betingelsen blir FALSE. Er ord NULL, blir length(ord) &gt;= 3 NULL, og raden slipper gjennom. Derfor " +
        "legger vi til NOT NULL. I PostgreSQL kan også CREATE TABLE angres som en del av transaksjonen: feiler INSERT, forsvinner tabellen igjen. Ikke alle databasesystemer kan det. CSS har lengde 3 og oppfyller " +
        "kravet (&gt;= 3, ikke &gt; 3). Oppgave 1 og 2 finnes i eksempeldataene, så fremmednøkkelen er oppfylt.</p>"
    },
    sensor: { deler: [{ del: "Løsningsforslag", fasit: "", sql: SENSOR_SQL["2.3"], kriterier: SQL_GENERELT }], merknad: SQL_MERKNAD + " «fremmenøkkel» er en skrivefeil i oppgaveteksten og er beholdt." }
  };

  IN.PERFEKT["H2025-2.4"] = {
    type: "eksamen",
    svar: [
      {
        del: "",
        tekst: "<p>Delspørringen henter lederen til prosjektet som den aktuelle oppgaveraden hører til. WHERE sørger for at bare rader uten ansvarlig endres.</p>",
        sql:
          "-- Antar oppgave.prosjekt -> prosjekt(pid), slik eksempeldataene viser\n" +
          "UPDATE oppgave AS o\n" +
          "SET ansvarlig = (\n" +
          "  SELECT p.leder\n" +
          "  FROM prosjekt AS p\n" +
          "  WHERE p.pid = o.prosjekt\n" +
          ")\n" +
          "WHERE o.ansvarlig IS NULL;",
        poeng: ["UPDATE oppgave SET ansvarlig = …", "Korrelert delspørring som henter leder for riktig prosjekt", "WHERE ansvarlig IS NULL"]
      }
    ],
    hvorfor: {
      eli5:
        "<p>Noen oppgaver har ingen som passer på dem. For hver slik oppgave ser vi hvilket prosjekt den hører til, og gir ansvaret til sjefen for det prosjektet.</p>",
      normal:
        "<p>UPDATE går gjennom radene i oppgave én etter én. For hver rad der ansvarlig IS NULL, kjøres delspørringen med radens egen prosjekt-verdi, " +
        "og lederen settes inn. Delspørringen gir nøyaktig én verdi, fordi pid er primærnøkkel i prosjekt.</p>",
      teknisk:
        "<p>Delspørringen er korrelert: o.prosjekt viser til raden som oppdateres, så den beregnes per rad. Den må gi høyst én rad. Det er garantert, " +
        "fordi den filtrerer på primærnøkkelen. Skulle et prosjekt mangle, blir resultatet NULL, og ansvarlig forblir NULL. " +
        "Betingelsen må være IS NULL. ansvarlig = NULL gir NULL (ukjent) for alle rader, og ingenting blir oppdatert. " +
        "På eksempeldataene endres to rader: oppgave 2 får 2 og oppgave 6 får 3.</p>"
    },
    sensor: { deler: [{ del: "Løsningsforslag", fasit: "", sql: SENSOR_SQL["2.4"], kriterier: SQL_GENERELT }], merknad: SQL_MERKNAD }
  };

  IN.PERFEKT["H2025-2.5"] = {
    type: "eksamen",
    svar: [
      {
        del: "",
        tekst: "<p>Store prosjekter finnes i en egen delspørring på medlem. Lengden regnes på oppgavene. Slik telles medlemmer og oppgaver hver for seg.</p>",
        sql:
          "-- Prosjekter uten oppgaver har ingen lengde og faller bort\n" +
          "SELECT p.pid, p.navn, max(o.frist) - min(o.frist) AS lengde\n" +
          "FROM prosjekt AS p\n" +
          "  INNER JOIN oppgave AS o ON (o.prosjekt = p.pid)\n" +
          "WHERE p.pid IN (\n" +
          "  SELECT m.prosjekt\n" +
          "  FROM medlem AS m\n" +
          "  GROUP BY m.prosjekt\n" +
          "  HAVING count(*) > 3      -- stort prosjekt: flere enn 3 medlemmer\n" +
          ")\n" +
          "GROUP BY p.pid, p.navn;",
        poeng: [
          "Finne store prosjekter med GROUP BY og HAVING count(*) &gt; 3",
          "Lengde som max(frist) - min(frist)",
          "GROUP BY per prosjekt i hovedspørringen"
        ]
      }
    ],
    hvorfor: {
      eli5:
        "<p>Først finner vi prosjektene med mange folk (fire eller flere). Så ser vi på alle fristene i hvert av dem og regner ut hvor mange dager det er " +
        "fra den første til den siste.</p>",
      normal:
        "<p>«Flere enn 3 medlemmer» gjelder en hel gruppe av rader i medlem, så den hører hjemme i HAVING etter GROUP BY. Lengden er forskjellen mellom " +
        "siste og første frist, altså max minus min innenfor hvert prosjekt. På eksempeldataene har ingen prosjekter mer enn to medlemmer, så resultatet er tomt.</p>",
      teknisk:
        "<p>Fellen er å joine prosjekt, medlem og oppgave i én spørring og bruke HAVING count(*) &gt; 3. Da teller count(*) medlemmer × oppgaver. Et prosjekt " +
        "med 2 medlemmer og 2 oppgaver gir 4 rader og blir feilaktig «stort». Med delspørringen (eller en WITH) telles medlemmene for seg. " +
        "count(*) er riktig der, fordi PN (prosjekt, ansatt) hindrer dobbeltregistrering. Datodifferansen gir et heltall i PostgreSQL. " +
        "p.navn kan stå i SELECT, fordi pid er gruppert.</p>"
    },
    sensor: { deler: [{ del: "Løsningsforslag", fasit: "", sql: SENSOR_SQL["2.5"], kriterier: SQL_GENERELT }], merknad: SQL_MERKNAD + " «Skrive en spørring» er en skrivefeil i oppgaveteksten og er beholdt." }
  };

  IN.PERFEKT["H2025-2.6"] = {
    type: "eksamen",
    svar: [
      {
        del: "",
        tekst: "<p>count(o.ferdig) teller bare ferdige oppgaver (ferdig er NULL ellers), og count(*) teller alle. ::float hindrer heltallsdivisjon.</p>",
        sql:
          "CREATE VIEW prosjektstatus AS\n" +
          "SELECT p.navn,\n" +
          "       100 * count(o.ferdig)::float / count(*) AS prosent_ferdig\n" +
          "FROM prosjekt AS p\n" +
          "  INNER JOIN oppgave AS o ON (o.prosjekt = p.pid)  -- prosjekter uten oppgaver tas ikke med (ville gitt deling på 0)\n" +
          "GROUP BY p.pid, p.navn\n" +
          "ORDER BY prosent_ferdig DESC;",
        poeng: [
          "CREATE VIEW prosjektstatus AS",
          "F = count(ferdig), T = count(*) per prosjekt med GROUP BY",
          "Unngå heltallsdivisjon og kall kolonnen prosent_ferdig",
          "ORDER BY prosent_ferdig DESC"
        ]
      }
    ],
    hvorfor: {
      eli5:
        "<p>For hvert prosjekt teller vi hvor mange oppgaver som er ferdige og hvor mange det er i alt, og regner ut prosenten. Et VIEW er en lagret spørring " +
        "som du kan bruke som om det var en tabell.</p>",
      normal:
        "<p>Vi grupperer oppgavene per prosjekt. count(ferdig) hopper over NULL, så den teller bare ferdige oppgaver, mens count(*) teller alle. " +
        "Deler man to heltall, kuttes desimalene. 1/2 blir 0. Derfor gjør vi om til float før divisjonen. Resultatet sorteres synkende.</p>",
      teknisk:
        "<p>Operatoren :: binder sterkere enn * og /, så count(o.ferdig)::float gjør telleren til flyttall, og hele uttrykket blir flyttall. " +
        "INNER JOIN gjør at prosjekter uten oppgaver ikke kommer med. Med LEFT JOIN ville count(o.oid) blitt 0, og divisjonen feilet. " +
        "På eksempeldataene gir viewet prosjekt 1 og 2 med 100 og prosjekt 3, 4 og 5 med 0. ORDER BY i et VIEW er lov i PostgreSQL, og oppgaven ber om det.</p>"
    },
    sensor: { deler: [{ del: "Løsningsforslag", fasit: "", sql: SENSOR_SQL["2.6"], kriterier: SQL_GENERELT }], merknad: SQL_MERKNAD }
  };

  IN.PERFEKT["H2025-2.7"] = {
    type: "eksamen",
    svar: [
      {
        del: "",
        tekst: "<p>Timelista har én rad per arbeidsbit. UNION ALL beholder like rader. LEFT JOIN tar med ansatte uten timer (sum blir NULL, noe oppgaven godtar).</p>",
        sql:
          "WITH arbeid AS (\n" +
          "  -- 7 timer per oppgave man er ansvarlig for\n" +
          "  SELECT o.ansvarlig AS aid, 7 AS timer\n" +
          "  FROM oppgave AS o\n" +
          "  WHERE o.ansvarlig IS NOT NULL\n" +
          "  UNION ALL\n" +
          "  -- 2 timer per oppgave i prosjekter man leder\n" +
          "  SELECT p.leder AS aid, 2 AS timer\n" +
          "  FROM prosjekt AS p\n" +
          "    INNER JOIN oppgave AS o ON (o.prosjekt = p.pid)\n" +
          ")\n" +
          "SELECT a.aid, a.navn, sum(ar.timer) AS timer  -- NULL for ansatte uten timer\n" +
          "FROM ansatt AS a\n" +
          "  LEFT JOIN arbeid AS ar ON (ar.aid = a.aid)\n" +
          "GROUP BY a.aid, a.navn;",
        poeng: [
          "7 timer per ansvarlig oppgave",
          "2 timer per oppgave i prosjekter den ansatte leder",
          "Slå sammen med UNION ALL (ikke UNION)",
          "LEFT JOIN fra ansatt, sum og GROUP BY per ansatt"
        ]
      }
    ],
    hvorfor: {
      eli5:
        "<p>Vi skriver en lapp for hver arbeidsbit: «Kari, 7 timer», «Ole, 2 timer» og så videre. Så samler vi lappene per person og legger sammen. " +
        "De som ikke har noen lapper, skal også stå på lista.</p>",
      normal:
        "<p>Timer kommer fra to kilder: oppgaver man er ansvarlig for, og oppgaver i prosjekter man leder. Vi lager én rad per bidrag fra hver kilde og " +
        "stabler dem med UNION ALL. Deretter kobler vi alle ansatte til denne lista med LEFT JOIN og summerer. På eksempeldataene får Kari 14, Ole 13, " +
        "Nasir 15, Bo 7 og Berit 9 timer.</p>",
      teknisk:
        "<p>UNION fjerner duplikater. Kari er ansvarlig for to oppgaver og ville da bare fått én rad (1, 7), altså 7 timer i stedet for 14. UNION ALL " +
        "beholder multimengden. Å legge begge kildene i samme FROM med to ytre join ville gitt et kryssprodukt per ansatt (ansvar × ledelse), og summene " +
        "ville blitt for store. Derfor stabler vi først og aggregerer etterpå. sum over bare NULL-verdier (ansatt uten treff) gir NULL, som oppgaven godtar. " +
        "Filteret IS NOT NULL i første del er ikke nødvendig, men gjør hensikten tydelig.</p>"
    },
    sensor: { deler: [{ del: "Løsningsforslag", fasit: "", sql: SENSOR_SQL["2.7"], kriterier: SQL_GENERELT }], merknad: SQL_MERKNAD }
  };

  IN.PERFEKT["H2025-3.2"] = {
    type: "eksamen",
    svar: [
      {
        del: "a)",
        tekst:
          "<p>A og D står aldri på en høyreside, så de er med i alle kandidatnøkler.</p>" +
          "<p>{A, D}⁺: start med {A, D}, A → B gir B, B → C gir C, altså {A, B, C, D} = R. {A, D} er supernøkkel.</p>" +
          "<p>Minimal: A⁺ = {A, B, C} og D⁺ = {D}, ingen av dem er R. Alle andre supernøkler inneholder {A, D}.</p>" +
          "<p><b>Eneste kandidatnøkkel: {A, D}.</b></p>",
        poeng: ["{A, D} med tillukning som begrunnelse (3p)"]
      },
      {
        del: "b)",
        tekst:
          "<p>Nøkkelattributter: A og D. Ikke-nøkkelattributter: B og C.</p><ul>" +
          "<li>A → B: A er ikke supernøkkel (BCNF brytes). B er ikke nøkkelattributt (3NF brytes). A er en ekte delmengde av kandidatnøkkelen {A, D} (2NF brytes).</li>" +
          "<li>B → C: B er ikke supernøkkel, og C er ikke nøkkelattributt (3NF brytes). B er ikke del av noen kandidatnøkkel, så 2NF holder for denne.</li></ul>" +
          "<p><b>R er på 1NF</b>, fordi A → B er en partiell avhengighet.</p>",
        poeng: ["1NF med begrunnelse: partiell avhengighet A → B (2p)"]
      }
    ],
    hvorfor: {
      eli5:
        "<p>En nøkkel er det du trenger å vite for å finne nøyaktig én rad. Ingenting forteller deg A eller D, så du må kjenne begge. Når B allerede " +
        "bestemmes av bare halve nøkkelen (A), lagres den samme opplysningen om og om igjen. Det er det dårligste nivået, 1NF.</p>",
      normal:
        "<p>Vi finner nøklene med tillukning: {A, D} når hele R, og ingen mindre mengde gjør det. Normalform sjekkes FD for FD. A → B har venstreside " +
        "som bare er en del av nøkkelen, og høyreside som ikke er nøkkelattributt. Det er nettopp en partiell avhengighet, som bryter 2NF.</p>",
      teknisk:
        "<p>Prosedyren for hver ikke-triviell X → A: (1) er X supernøkkel? Hvis ikke, brytes BCNF. (2) er A et nøkkelattributt? Hvis ikke, brytes 3NF. " +
        "(3) er X en ekte delmengde av en kandidatnøkkel? Hvis ja, brytes også 2NF. For A → B svarer vi nei, nei, ja, og da er R på 1NF. " +
        "Normalformen til skjemaet er den laveste vi finner blant FD-ene. Det holder å finne én FD som bryter 2NF.</p>"
    },
    sensor: {
      deler: [
        {
          del: "a)",
          fasit:
            "<p><b>Løsningsforslag</b></p><p>a) Kandidatnøkkel:</p><ul>" +
            "<li>Fra A → B → C får vi at A bestemmer B og C.</li>" +
            "<li>D bestemmes ikke av noen FD-er.</li>" +
            "<li>Dermed må nøkkelen inkludere D.</li></ul>" +
            "<p>Kandidatnøkkel:<br>{A, D}</p>",
          kriterier: "<p>a) {A, D} er eneste kandidatnøkkel. (3 poeng)</p>"
        },
        {
          del: "b)",
          fasit:
            "<p>b) Normalform:</p><ul>" +
            "<li>1NF: Ja (atomære verdier).</li>" +
            "<li>2NF: Brytes, fordi A → B og A → C er avhengigheter fra del av sammensatt nøkkel {A, D}.</li>" +
            "<li>Dermed også ikke 3NF og ikke BCNF.</li></ul>" +
            "<p>Høyeste normalform: 1NF.</p>",
          kriterier: "<p>b) R er kun i 1NF, pga. delvis nøkkelavhengighet. (2 poeng)</p>"
        }
      ],
      merknad:
        "Sensorveiledningen stemmer med vårt svar. Løsningsforslagets begrunnelse i a) nevner bare D, men A er også med i alle kandidatnøkler, " +
        "fordi A heller aldri står på en høyreside. Det er derfor {A, D} og ikke bare «noe med D» som er nøkkelen."
    }
  };

  IN.PERFEKT["H2025-3.3"] = {
    type: "eksamen",
    svar: [
      {
        del: "a)",
        tekst: "<p>A → B bryter BCNF: A⁺ = {A, B, C} ≠ R, så A er ikke supernøkkel.</p>",
        poeng: ["Riktig FD med begrunnelse (1p)"]
      },
      {
        del: "b)",
        tekst:
          "<p>Med Y = A og Y⁺ = {A, B, C}:</p>" +
          "<p>R(A, B, C, D) ⟶ { R1(A, B, C), R2(A, D) }</p><ul>" +
          "<li>R1 = S₁(Y⁺) = (A, B, C). FD-er: A → B, B → C. Kandidatnøkkel: {A}.</li>" +
          "<li>R2 = S₂(Y ∪ (R − Y⁺)) = (A, D). Ingen ikke-trivielle FD-er. Kandidatnøkkel: {A, D}.</li></ul>",
        poeng: ["R1(A, B, C) og R2(A, D) fra tillukningen A⁺ (3p)"]
      },
      {
        del: "c)",
        tekst:
          "<p>Ja. Fellesattributtet er A, og A → BC, altså bestemmer A hele R1 (A er nøkkel i R1). Etter Fagins teorem er dekomponeringen da tapsfri. " +
          "Det gjelder alle steg i BCNF-algoritmen.</p>",
        poeng: ["Tapsfri, fordi fellesattributtet A er nøkkel i R1 (2p)"]
      }
    ],
    hvorfor: {
      eli5:
        "<p>Vi klipper tabellen i to biter som kan limes sammen igjen uten at noe blir feil. Limet er A. Fordi A alene forteller alt om B og C, finnes det " +
        "bare én måte å lime på, og ingen falske rader dukker opp.</p>",
      normal:
        "<p>BCNF-algoritmen tar en FD som bryter, regner ut tillukningen av venstresiden og lager én relasjon av den (A, B, C). Den andre relasjonen er " +
        "venstresiden pluss alt som ble til overs (A, D). Fordi A bestemmer resten av den første delen, gir en join av delene tilbake nøyaktig R.</p>",
      teknisk:
        "<p>Fagins teorem: R(X, Y, Z) ⟶ S₁(X, Y), S₂(X, Z) er tapsfri hvis X → Y eller X → Z. Her er X = A, Y = BC og Z = D, og A → BC holder. " +
        "Å ta hele Y⁺ inn i S₁ (ikke bare A, B) gjør at alle FD-ene som følger av A, havner i samme del. R1 er fortsatt ikke på BCNF, fordi B → C og " +
        "B⁺ = {B, C}. Neste trinn deler R1 i (B, C) og (A, B). Sensorens alternativ R1(A, B), R2(A, C, D) er også tapsfritt, fordi A → B, men det er ikke " +
        "det første trinnet standardalgoritmen gir.</p>"
    },
    sensor: {
      deler: [
        {
          del: "a)",
          fasit: "<p><b>Løsningsforslag</b></p><p>a) FD-en A → B bryter BCNF siden A ikke er supernøkkel.</p>",
          kriterier: "<p>a) A → B bryter BCNF (1 poeng)</p>"
        },
        {
          del: "b)",
          fasit: "<p>b) Første trinn av BCNF-dekomponering:</p><ul><li>R1(A, B, C)</li><li>R2(A, D)</li></ul>",
          kriterier: "<p>b) R1(A, B), R2(A, C, D) (3 poeng)</p>"
        },
        {
          del: "c)",
          fasit: "<p>c) Tapsfrihet:<br>Ja. A er fellesattributt og nøkkel i R1.<br>Dette tilfredsstiller tapsfrihetskriteriet.</p>",
          kriterier: "<p>c) Tapsfri fordi A er nøkkel i R1 (2 poeng)</p>"
        }
      ],
      merknad:
        "Avvik: løsningsforslaget og sensorkriteriene i samme fil er uenige om b). Kriteriet R1(A, B), R2(A, C, D) følger ikke standardalgoritmen, " +
        "som setter første del lik tillukningen A⁺ = {A, B, C}. Løsningsforslaget gir R1(A, B, C), R2(A, D), og det gjør også vårt svar. " +
        "Det er ukjent hva sensor i praksis godtok."
    }
  };

  IN.PERFEKT["H2025-3.4"] = {
    type: "eksamen",
    svar: [
      {
        del: "",
        tekst:
          "<p>Legg til <b>B → A</b> og <b>B → D</b>. Hele mengden blir da { A → B, B → C, B → A, B → D }.</p><ul>" +
          "<li>B⁺ = {B, C, A, D} = R, så B er supernøkkel.</li>" +
          "<li>A⁺: A → B gir B, og så gir B → C, A, D resten. A⁺ = R, så A er supernøkkel.</li>" +
          "<li>Mengder uten A og B: C⁺ = {C}, D⁺ = {D}, {C, D}⁺ = {C, D}. De gir bare trivielle FD-er.</li></ul>" +
          "<p>Hver ikke-triviell FD har dermed A eller B på venstresiden, altså en supernøkkel. R er på BCNF.</p>" +
          "<p>(Andre sett fungerer også, for eksempel B → A og A → D. Bare A → D er ikke nok, fordi B → C da fortsatt har B⁺ = {B, C}.)</p>",
        poeng: ["Konkrete FD-er som gjør både A og B til supernøkler", "Tillukningene A⁺ og B⁺ vist", "Begrunnelse for at alle ikke-trivielle FD-er har supernøkkel på venstresiden"]
      }
    ],
    hvorfor: {
      eli5:
        "<p>BCNF betyr at bare «nøkler» får bestemme ting. A og B bestemmer allerede noe, og det kan vi ikke ta bort. Da gjør vi dem til fullverdige nøkler " +
        "i stedet, ved å si at de bestemmer alt.</p>",
      normal:
        "<p>Vi kan ikke fjerne FD-er, bare legge til. Både A → B og B → C må derfor få en supernøkkel på venstresiden. B kjenner i dag bare C, så vi lar B " +
        "bestemme A og D også. Da når B⁺ hele R. Siden A bestemmer B, når A⁺ også hele R. Alle venstresider som betyr noe, er nå supernøkler.</p>",
      teknisk:
        "<p>Det holder ikke å sjekke FD-ene som står listet. BCNF gjelder alle ikke-trivielle FD-er som følger av mengden. Den enkleste måten å vise det på " +
        "er å se at enhver mengde X med ikke-triviell tillukning inneholder A eller B. Mengder med A eller B er supernøkler (A⁺ = B⁺ = R), og " +
        "delmengdene av {C, D} har tillukning lik seg selv. Etter endringen er R(A, B, C, D) med kandidatnøklene {A} og {B} på BCNF. Kandidatnøkkelen {A, D} " +
        "fra 3.2 er ikke lenger minimal.</p>"
    },
    sensor: {
      deler: [
        {
          del: "3.4 (5 poeng)",
          fasit:
            "<p><b>Løsningsforslag</b></p><p>Et mulig sett med FD-er som gjør R til BCNF:</p>" +
            "<ul><li>B → A</li><li>A → D</li></ul>" +
            "<p>Med disse får vi:</p>" +
            "<ul><li>A∗ = {A, B, C, D} (A → B → C og A → D)</li><li>B∗ = {A, B, C, D} (B → A, B → C og A → D)</li></ul>" +
            "<p>Dermed er både A og B supernøkler.<br>Alle ikke-trivielle FD-er har supernøkkel på venstresiden, altså R er i BCNF.<br>" +
            "Andre sett som gjør A og B til supernøkler kan også godtas.</p>",
          kriterier:
            "<ul><li>Full score for et sett av FD-er som gjør A og B til supernøkler med riktig begrunnelse - Må vise at alle ikke-trivielle FD-er dermed " +
            "har supernøkkel på venstresiden.</li>" +
            "<li>Eksempel gitt i løsningsforslaget får full score, men alternative løsninger kan også godtas dersom analysen er korrekt</li></ul>"
        }
      ],
      merknad:
        "Løsningsforslaget (gjengitt ordrett over) skriver tillukning som A∗ og B∗. Det er en skrivefeil for A⁺ og B⁺, som kurset bruker. " +
        "Løsningsforslagets eksempelsett er et annet enn vårt, men begge gjør A og B til supernøkler."
    }
  };
})();
