/* ============================================================
   IN2090 guide · data-pugg.js
   Kortstokkene til puggekortene (pugg.html, motor i pugg.js).
   All notasjon følger plan/vranglaere.md (Chen-notasjon slik kurset tegner den).
   ISA er bevisst utelatt: kurset viser ikke et grafisk ISA-symbol i lysarkene.
   Kildelinjene peker på lysark/notat i 2090/slides/ (parafrasert, aldri sitat).
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  /* ---------- Små hjelpere for ER-figurer ---------- */
  function E(id, navn, pos, attr, svak) { return { id: id, navn: navn, pos: pos, attr: attr || [], svak: !!svak }; }
  function R(id, navn, pos, ledd, attr, ident) { return { id: id, navn: navn, pos: pos, ledd: ledd, attr: attr || [], identifiserende: !!ident }; }
  function L(entitet, kard, total) { return { entitet: entitet, kard: kard, total: !!total }; }
  function A(navn, o) { var a = { navn: navn }; if (o) for (var k in o) a[k] = o[k]; return a; }
  function fig(ent, rel) { return { entiteter: ent, relasjoner: rel || [] }; }

  var K_ER = "F05-01 (attributter), F05-02 s2–5 (relasjoner, kardinalitet), Waaler ER-notat s8";
  var K_SVAK = "F05-03 s3–5, F06-02 s5";
  var K_TER = "F06-01 s3–7, F06-02 s18";
  var K_REAL = "F06-02 s3–18 og realiseringsnotatet (realiseringh26) s2–9";

  /* ============================================================
     1. ER-symboler: figur ↔ betydning
     ============================================================ */
  var symboler = {
    id: "er-symboler",
    tittel: "ER-symboler",
    vend: true,
    retning: ["Figur → betydning", "Betydning → figur"],
    intro: "<p>Hvert kort viser ett symbol fra kursets ER-notasjon. Snu retningen for å øve andre veien: da får du betydningen og skal se figuren for deg (tegn den gjerne på papir).</p>",
    kort: [
      { id: "entitet", kilde: K_ER,
        a: { er: fig([E("e", "ANSATT", [0, 0], [A("Navn")])]) },
        b: "<b>Entitet(stype)</b>: rektangel med navnet i STORE bokstaver. Ovalene rundt er attributtene." },
      { id: "svak", kilde: K_SVAK,
        a: { er: fig([E("b", "BYGNING", [0, 0], [A("Bnr", { nokkel: true })]), E("r", "ROM", [2, 0], [A("Romnr", { delvisNokkel: true })], true)],
                     [R("h", "HAR", [1, 0], [L("b", "1", false), L("r", "N", true)], [], true)]) },
        b: "<b>Svak entitet</b> (dobbelt rektangel, ROM) med <b>identifiserende relasjon</b> (dobbel rombe, HAR) til eieren BYGNING. Romnr er en <b>svak nøkkel</b> (stiplet understrek). Den svake siden har alltid total deltakelse (dobbel strek), og det står 1 ved eieren." },
      { id: "relasjon", kilde: K_ER,
        a: { er: fig([E("s", "STUDENT", [0, 0]), E("e", "EMNE", [2, 0])], [R("t", "TAR", [1, 0], [L("s", "M"), L("e", "N")])]) },
        b: "<b>Relasjon(stype)</b>: rombe med strek til hver entitet som deltar. Bokstavene ved strekene er kardinaliteten (her mange-til-mange)." },
      { id: "attributt", kilde: K_ER,
        a: { er: fig([E("e", "BOK", [0, 0], [A("Tittel")])]) },
        b: "<b>Attributt</b>: oval koblet til entiteten (eller relasjonen) med en strek." },
      { id: "nokkel", kilde: K_ER,
        a: { er: fig([E("e", "BOK", [0, 0], [A("ISBN", { nokkel: true }), A("Tittel")])]) },
        b: "<b>Nøkkelattributt</b>: navnet er understreket. To bøker kan ikke ha samme ISBN." },
      { id: "to-nokler", kilde: K_ER,
        a: { er: fig([E("e", "BIL", [0, 0], [A("Regnr", { nokkel: true }), A("Chassisnr", { nokkel: true }), A("Farge")])]) },
        b: "<b>To uavhengige nøkler</b>: hver er understreket for seg. Regnr alene identifiserer en bil, og Chassisnr alene gjør det også. (Det betyr <i>ikke</i> at de to sammen er nøkkelen.)" },
      { id: "delvis", kilde: K_SVAK,
        a: { er: fig([E("r", "ROM", [0, 0], [A("Romnr", { delvisNokkel: true }), A("Areal")], true)]) },
        b: "<b>Svak nøkkel</b> (stiplet understrek) på en svak entitet. Den skiller bare rommene <i>innenfor samme eier</i>; full identifikasjon får du sammen med eierens nøkkel." },
      { id: "sammensatt", kilde: K_ER,
        a: { er: fig([E("e", "PERSON", [0, 0], [A("Pnr", { nokkel: true }), A("Navn", { deler: [A("Fornavn"), A("Etternavn")] })])]) },
        b: "<b>Sammensatt attributt</b>: Navn er bygd av egne ovaler (Fornavn, Etternavn). Ved realisering beholdes bare bladene." },
      { id: "sammensatt-nokkel", kilde: K_ER,
        a: { er: fig([E("e", "FLY", [0, 0], [A("Id", { nokkel: true, deler: [A("Selskap"), A("Løpenr")] }), A("Modell")])]) },
        b: "<b>Sammensatt nøkkel</b>: forelderen (Id) er understreket. Det er kombinasjonen Selskap + Løpenr som identifiserer, ikke hver del for seg." },
      { id: "flerverdi", kilde: K_ER,
        a: { er: fig([E("e", "PERSON", [0, 0], [A("Pnr", { nokkel: true }), A("Telefon", { flerverdi: true })])]) },
        b: "<b>Flerverdiattributt</b> (dobbel oval): en person kan ha flere telefonnumre. Et flerverdiattributt kan aldri være nøkkel." },
      { id: "avledet", kilde: K_ER,
        a: { er: fig([E("e", "PERSON", [0, 0], [A("Pnr", { nokkel: true }), A("Fødselsdato"), A("Alder", { avledet: true })])]) },
        b: "<b>Utledbart attributt</b> (stiplet oval): Alder kan regnes ut fra Fødselsdato. Det tas ikke med når modellen realiseres." },
      { id: "relattr", kilde: K_ER,
        a: { er: fig([E("s", "STUDENT", [0, 0]), E("e", "EMNE", [2, 0])], [R("t", "TAR", [1, 0], [L("s", "M"), L("e", "N")], [A("Karakter")])]) },
        b: "<b>Attributt på en relasjon</b>: Karakter hører til kombinasjonen student + emne, ikke til en av dem alene. Et relasjonsattributt er aldri nøkkel." },
      { id: "total", kilde: K_ER,
        a: { er: fig([E("a", "ANSATT", [0, 0]), E("d", "AVDELING", [2, 0])], [R("j", "JOBBER_I", [1, 0], [L("a", "N", true), L("d", "1", false)])]) },
        b: "<b>Dobbel strek = total deltakelse</b> (minst 1): hver ansatt <i>må</i> jobbe i en avdeling. <b>Enkel strek = partiell</b> (minst 0): en avdeling kan stå uten ansatte." },
      { id: "kard-lesing", kilde: K_ER,
        a: { er: fig([E("b", "BOK", [0, 0]), E("f", "FORLAG", [2, 0])], [R("u", "UTGITT_AV", [1, 0], [L("b", "N"), L("f", "1")])]) },
        b: "<b>Lesing av kardinalitet</b>: tallet ved en entitet E sier hvor mange E den <i>andre</i> siden kan kobles til. 1 ved FORLAG: en bok har høyst ett forlag. N ved BOK: et forlag kan ha mange bøker." },
      { id: "ternaer", kilde: K_TER,
        a: { er: fig([E("l", "LEVERANDØR", [0, 0]), E("d", "DEL", [2, 0]), E("p", "PROSJEKT", [1, 1])],
                     [R("v", "LEVERER", [1, 0], [L("l", "N"), L("d", "M"), L("p", "K")])]) },
        b: "<b>Ternær relasjon</b>: én rombe med tre deltakere. Tallet ved E sier: gitt én kombinasjon av de to andre, hvor mange E. En ternær relasjon er <i>ikke</i> det samme som tre binære." }
    ]
  };

  /* ============================================================
     2. ER-lesing i volum: alle kombinasjoner av 1/N og total/partiell
     ============================================================ */
  var PAR = [
    { a: "ANSATT", b: "AVDELING", r: "JOBBER_I" },
    { a: "FORFATTER", b: "BOK", r: "SKRIVER" },
    { a: "PASIENT", b: "LEGE", r: "BEHANDLES_AV" },
    { a: "KUNDE", b: "KONTO", r: "EIER" }
  ];
  function mengde(kard, total) {
    if (kard === "1") return total ? "nøyaktig én" : "høyst én (0 eller 1)";
    return total ? "minst én (1 eller flere)" : "null eller flere";
  }
  function lesekort() {
    var ut = [], i = 0;
    ["1", "N"].forEach(function (ka) {
      ["1", "N"].forEach(function (kb) {
        [true, false].forEach(function (ta) {
          [true, false].forEach(function (tb) {
            var p = PAR[i % PAR.length]; i++;
            var kbv = kb === "N" ? (ka === "N" ? "M" : "N") : "1";
            var f = fig([E("a", p.a, [0, 0]), E("b", p.b, [2, 0])], [R("r", p.r, [1, 0], [L("a", ka, ta), L("b", kbv, tb)])]);
            // Kardinaliteten ved B sier hvor mange B én A kan kobles til, og omvendt.
            var sa = "Hver " + p.a + " er knyttet til <b>" + mengde(kb, ta) + "</b> " + p.b + " gjennom " + p.r + ".";
            var sb = "Hver " + p.b + " er knyttet til <b>" + mengde(ka, tb) + "</b> " + p.a + " gjennom " + p.r + ".";
            var type = ka === "1" && kb === "1" ? "1-1" : (ka === "N" && kb === "N" ? "mange-til-mange" : "1-N");
            ut.push({ id: "les-" + ka + kb + (ta ? "T" : "p") + (tb ? "T" : "p"), kilde: K_ER,
              a: { er: f, etter: "Si én setning for hver entitet: hvor mange av den andre kan den kobles til, minst og høyst?" },
              b: "<p>" + sa + "</p><p>" + sb + "</p><p class=\"small muted\">Type: " + type + ". Tallet ved en entitet gjelder antallet <i>av den entiteten</i> per element på den andre siden. Dobbel strek gir minst 1, enkel strek minst 0.</p>" });
          });
        });
      });
    });
    return ut;
  }
  function ter(id, kl, kd, kp, svar) {
    return { id: id, kilde: K_TER,
      a: { er: fig([E("l", "LEVERANDØR", [0, 0]), E("d", "DEL", [2, 0]), E("p", "PROSJEKT", [1, 1])],
                   [R("v", "LEVERER", [1, 0], [L("l", kl), L("d", kd), L("p", kp)])]),
           etter: "Hva sier kardinalitetene?" },
      b: svar };
  }
  var lesing = {
    id: "er-lesing",
    tittel: "Les ER-figuren",
    intro: "<p>Volumtrening i å lese kardinalitet og deltakelse. Alle 16 kombinasjoner av 1/N og enkel/dobbel strek for en binær relasjon, pluss ternære. Regelen: <b>tallet ved E sier hvor mange E den andre siden kan kobles til</b>. Dobbel strek betyr at hver E må være med minst én gang.</p>",
    kort: lesekort().concat([
      ter("ter-nnn", "N", "M", "K", "<p>Ingen begrensning: en leverandør kan levere hvilken som helst del til hvilket som helst prosjekt, og alle kombinasjoner kan forekomme. Ved realisering blir alle tre fremmednøklene til sammen primærnøkkelen.</p>"),
      ter("ter-1p", "N", "M", "1", "<p>1 ved PROSJEKT: <b>gitt én leverandør og én del</b> finnes høyst ett prosjekt den delen leveres til fra den leverandøren. Ved realisering blir {Leverandør, Del} en kandidatnøkkel.</p>"),
      ter("ter-1l", "1", "M", "K", "<p>1 ved LEVERANDØR: <b>gitt én del og ett prosjekt</b> er det høyst én leverandør som leverer den delen til prosjektet. Ved realisering blir {Del, Prosjekt} en kandidatnøkkel.</p>"),
      ter("ter-1d", "N", "1", "K", "<p>1 ved DEL: <b>gitt én leverandør og ett prosjekt</b> leveres høyst én del. Ved realisering blir {Leverandør, Prosjekt} en kandidatnøkkel.</p>")
    ])
  };

  /* ============================================================
     3. Realisering: ER-figur → relasjonsskjema
     ============================================================ */
  function real(id, f, skjema, regel) { return { id: id, kilde: K_REAL, a: { er: f, etter: "Realiser figuren: relasjoner, KN/PN og FN." }, b: { pre: skjema, etter: regel } }; }
  var realisering = {
    id: "realisering",
    tittel: "Realisering",
    intro: "<p>Fra ER-figur til relasjonsskjema. Skriv skjemaet selv før du snur, i formatet <code>Relasjon(Attr, …)</code> med KN, PN og FN under. Rekkefølgen i kurset: entiteter, svake entiteter, 1-1, 1-N, mange-til-mange, flerverdiattributter, ternære.</p>",
    kort: [
      { id: "rekkefolge", kilde: K_REAL,
        a: "I hvilken rekkefølge realiserer du en ER-modell?",
        b: "<ol><li>Entiteter</li><li>Svake entiteter</li><li>1-1-relasjoner</li><li>1-N-relasjoner</li><li>Mange-til-mange-relasjoner</li><li>Flerverdiattributter</li><li>Ternære (og høyere) relasjoner</li></ol>" },
      real("r-entitet",
        fig([E("p", "PERSON", [0, 0], [A("Pnr", { nokkel: true }), A("Navn", { deler: [A("Fornavn"), A("Etternavn")] }), A("Fødselsdato"), A("Alder", { avledet: true })])]),
        "Person(Pnr, Fornavn, Etternavn, Fødselsdato)\n  PN: {Pnr}",
        "Sammensatt attributt: bare bladene (Fornavn, Etternavn). Utledbart attributt (Alder) droppes."),
      real("r-to-nokler",
        fig([E("b", "BIL", [0, 0], [A("Regnr", { nokkel: true }), A("Chassisnr", { nokkel: true }), A("Farge")])]),
        "Bil(Regnr, Chassisnr, Farge)\n  KN: {Regnr}, {Chassisnr}\n  PN: {Regnr}",
        "To understrekede attributter er to kandidatnøkler. Velg én som primærnøkkel."),
      real("r-svak",
        fig([E("b", "BYGNING", [0, 0], [A("Bnr", { nokkel: true }), A("Adresse")]), E("r", "ROM", [2, 0], [A("Romnr", { delvisNokkel: true }), A("Areal")], true)],
            [R("h", "HAR", [1, 0], [L("b", "1", false), L("r", "N", true)], [], true)]),
        "Bygning(Bnr, Adresse)\n  PN: {Bnr}\nRom(Bnr, Romnr, Areal)\n  PN: {Bnr, Romnr}\n  FN: Bnr → Bygning(Bnr)",
        "Svak entitet: PN = eierens PN + den svake nøkkelen, og eierens PN er også FN. Den identifiserende relasjonen (HAR) realiseres ikke på nytt."),
      real("r-1n",
        fig([E("a", "ANSATT", [0, 0], [A("Anr", { nokkel: true }), A("Navn")]), E("d", "AVDELING", [2, 0], [A("Avdnr", { nokkel: true })])],
            [R("j", "JOBBER_I", [1, 0], [L("a", "N", true), L("d", "1", false)], [A("Startdato")])]),
        "Avdeling(Avdnr)\n  PN: {Avdnr}\nAnsatt(Anr, Navn, Avdnr, Startdato)\n  PN: {Anr}\n  FN: Avdnr → Avdeling(Avdnr)",
        "1-N: fremmednøkkel på N-siden (Ansatt, siden en ansatt har høyst én avdeling). Relasjonsattributtet (Startdato) følger med dit."),
      real("r-mn",
        fig([E("s", "STUDENT", [0, 0], [A("Snr", { nokkel: true })]), E("e", "EMNE", [2, 0], [A("Kode", { nokkel: true })])],
            [R("t", "TAR", [1, 0], [L("s", "M"), L("e", "N")], [A("Karakter")])]),
        "Student(Snr)\n  PN: {Snr}\nEmne(Kode)\n  PN: {Kode}\nTar(Snr, Kode, Karakter)\n  PN: {Snr, Kode}\n  FN: Snr → Student(Snr)\n  FN: Kode → Emne(Kode)",
        "Mange-til-mange: egen relasjon. PN = alle fremmednøklene sammen. Relasjonsattributtet havner her."),
      real("r-11-begge",
        fig([E("a", "ANSATT", [0, 0], [A("Anr", { nokkel: true }), A("Navn")]), E("k", "KONTRAKT", [2, 0], [A("Knr", { nokkel: true }), A("Lønn")])],
            [R("h", "HAR", [1, 0], [L("a", "1", true), L("k", "1", true)])]),
        "Ansatt(Anr, Navn, Knr, Lønn)\n  KN: {Anr}, {Knr}\n  PN: {Anr}",
        "1-1 med total deltakelse på begge sider: de to kan slås sammen til én relasjon. Begge nøklene blir kandidatnøkler."),
      real("r-11-en",
        fig([E("d", "AVDELING", [0, 0], [A("Avdnr", { nokkel: true })]), E("a", "ANSATT", [2, 0], [A("Anr", { nokkel: true })])],
            [R("l", "LEDES_AV", [1, 0], [L("d", "1", true), L("a", "1", false)])]),
        "Ansatt(Anr)\n  PN: {Anr}\nAvdeling(Avdnr, Leder)\n  KN: {Avdnr}, {Leder}\n  PN: {Avdnr}\n  FN: Leder → Ansatt(Anr)",
        "Ikke total deltakelse på begge sider, så ingen sammenslåing (det er bare lov når begge er totale). Legg FN på én side, helst den totale (da blir det ingen NULL). Fordi AVDELING har total deltakelse, blir Leder også en kandidatnøkkel. På en partiell side ville den bare vært FN. Alternativene er FN på den andre siden eller en egen relasjon."),
      real("r-flerverdi",
        fig([E("p", "PERSON", [0, 0], [A("Pnr", { nokkel: true }), A("Navn"), A("Telefon", { flerverdi: true })])]),
        "Person(Pnr, Navn)\n  PN: {Pnr}\nTelefon(Pnr, Telefon)\n  PN: {Pnr, Telefon}\n  FN: Pnr → Person(Pnr)",
        "Flerverdiattributt: egen relasjon med eierens nøkkel som FN. Nøkkelen er alle attributtene i den nye relasjonen."),
      real("r-ternaer",
        fig([E("l", "LEVERANDØR", [0, 0], [A("Lnr", { nokkel: true })]), E("d", "DEL", [2, 0], [A("Dnr", { nokkel: true })]), E("p", "PROSJEKT", [1, 1], [A("Pnr", { nokkel: true })])],
            [R("v", "LEVERER", [1, 0], [L("l", "N"), L("d", "M"), L("p", "K")])]),
        "Leverer(Lnr, Dnr, Pnr)\n  PN: {Lnr, Dnr, Pnr}\n  FN: Lnr → Leverandør(Lnr)\n  FN: Dnr → Del(Dnr)\n  FN: Pnr → Prosjekt(Pnr)",
        "Ternær relasjon: alltid egen relasjon. Uten 1 noe sted er PN alle tre fremmednøklene."),
      real("r-ternaer-1",
        fig([E("l", "LEVERANDØR", [0, 0], [A("Lnr", { nokkel: true })]), E("d", "DEL", [2, 0], [A("Dnr", { nokkel: true })]), E("p", "PROSJEKT", [1, 1], [A("Pnr", { nokkel: true })])],
            [R("v", "LEVERER", [1, 0], [L("l", "N"), L("d", "M"), L("p", "1")])]),
        "Leverer(Lnr, Dnr, Pnr)\n  KN: {Lnr, Dnr}\n  PN: {Lnr, Dnr}\n  FN: Lnr → Leverandør(Lnr)\n  FN: Dnr → Del(Dnr)\n  FN: Pnr → Prosjekt(Pnr)",
        "1 ved PROSJEKT: gitt leverandør og del finnes høyst ett prosjekt. Da er fremmednøklene til de <i>andre</i> sidene ({Lnr, Dnr}) en kandidatnøkkel."),
      real("r-sammensatt-nokkel",
        fig([E("f", "FLY", [0, 0], [A("Id", { nokkel: true, deler: [A("Selskap"), A("Løpenr")] }), A("Modell")])]),
        "Fly(Selskap, Løpenr, Modell)\n  PN: {Selskap, Løpenr}",
        "Sammensatt nøkkel: bladene blir attributter, og nøkkelen er alle bladene sammen.")
    ]
  };

  /* ============================================================
     4. Relasjonsalgebra-tegn
     ============================================================ */
  function ra(id, tegn, navn, svar) { return { id: id, kilde: "F02-03 s4–14", a: "<span class=\"pg-tegn\">" + tegn + "</span>", b: "<b>" + navn + "</b>. " + svar }; }
  var ratype = {
    id: "ra-tegn",
    tittel: "Relasjonsalgebra",
    vend: true,
    retning: ["Tegn → betydning", "Betydning → tegn"],
    intro: "<p>Tegnene i relasjonsalgebraen slik kurset skriver dem, med hva de tilsvarer i SQL. Divisjon og ytre join i relasjonsalgebra er ikke pensum.</p>",
    kort: [
      ra("sigma", "σ<sub>betingelse</sub>(R)", "Seleksjon", "Velger <i>radene</i> som oppfyller betingelsen. Tilsvarer <code>WHERE</code>."),
      ra("pi", "π<sub>A,B</sub>(R)", "Projeksjon", "Velger <i>kolonnene</i> A og B og fjerner duplikater (mengde). Tilsvarer <code>SELECT DISTINCT A, B</code>."),
      ra("rho", "ρ<sub>A→B</sub>(R)", "Omdøping", "Gir attributtet A nytt navn B. Tilsvarer <code>AS</code>."),
      ra("kryss", "R × S", "Kartesisk produkt", "Alle kombinasjoner av rader fra R og S. Tilsvarer <code>FROM R, S</code> uten betingelse (eller <code>CROSS JOIN</code>)."),
      ra("theta", "R ⋈<sub>betingelse</sub> S", "Join (theta-join)", "Kartesisk produkt fulgt av seleksjon: σ<sub>betingelse</sub>(R × S). Tilsvarer <code>R JOIN S ON betingelse</code>."),
      ra("naturlig", "R ⋈ S", "Naturlig join", "Joiner på alle attributter med samme navn og beholder dem bare én gang. Tilsvarer <code>NATURAL JOIN</code>. Uten senket betingelse er det naturlig join (F08-02 skriver det slik). Relasjonsalgebra-forelesningen F02-03 skriver ⋆ for det samme."),
      ra("union", "R ∪ S", "Union", "Rader som er i R eller S (eller begge). R og S må ha samme attributter. Tilsvarer <code>UNION</code>."),
      ra("snitt", "R ∩ S", "Snitt", "Rader som er i både R og S. Tilsvarer <code>INTERSECT</code>."),
      ra("diff", "R ∖ S", "Differanse", "Rader i R som ikke er i S. Tilsvarer <code>EXCEPT</code>."),
      ra("tilordning", "T := uttrykk", "Tilordning", "Gir et mellomresultat et navn så du kan bruke det videre. Tilsvarer omtrent <code>WITH T AS (…)</code>.")
    ]
  };

  /* ============================================================
     5. FD og normalformer
     ============================================================ */
  var K_FD = "F07-02 s2–11, Waaler FD-notat (07) s2–16", K_NF = "F07-03 s5–9, F08-01 s5, F08-02 s6–7, Waaler NF-notat (08) s9–24";
  function q(id, k, a, b) { return { id: id, kilde: k, a: a, b: b }; }
  var fd = {
    id: "fd",
    tittel: "FD og normalformer",
    intro: "<p>Definisjoner og algoritmer fra FD og normalisering. Si definisjonen med egne ord før du snur.</p>",
    kort: [
      q("fd-def", K_FD, "Hva betyr den funksjonelle avhengigheten X → Y?", "To rader som er like på X, må også være like på Y. X bestemmer Y."),
      q("tillukning", K_FD, "Hvordan regner du ut tillukningen X⁺?", "Start med X⁺ = X. Gå gjennom FD-ene: hvis venstresiden er med i X⁺, legg til høyresiden. Gjenta til ingenting nytt kommer til."),
      q("sn", K_FD, "Når er X en supernøkkel (SN)?", "Når X⁺ er hele relasjonen (alle attributtene i R)."),
      q("kn", K_FD, "Hva er en kandidatnøkkel (KN)?", "En <i>minimal</i> supernøkkel: fjerner du ett attributt, er den ikke lenger supernøkkel."),
      q("pn", K_FD, "Hva er en primærnøkkel (PN)?", "Den kandidatnøkkelen du velger å bruke."),
      q("nokkelattr", K_NF, "Hva er et nøkkelattributt?", "Et attributt som er med i minst én kandidatnøkkel."),
      q("triks-venstre", K_FD, "Et attributt står aldri på høyresiden av noen FD. Hva vet du da om kandidatnøklene?", "Det er med i <b>alle</b> kandidatnøkler (ingenting annet kan bestemme det)."),
      q("triks-hoyre", K_FD, "Et attributt står bare på høyresider, aldri på venstresider. Hva vet du da?", "Det er ikke med i <b>noen</b> kandidatnøkkel (det kan alltid utledes fra noe annet)."),
      q("2nf", K_NF, "Når bryter en FD X → A med 2NF?", "Når A ikke er et nøkkelattributt og X er en <i>ekte delmengde</i> av en kandidatnøkkel (A avhenger av bare en del av en nøkkel)."),
      q("3nf", K_NF, "Når er en FD X → A i 3NF?", "Når X er en supernøkkel, <b>eller</b> A er et nøkkelattributt."),
      q("bcnf", K_NF, "Når er en FD X → A i BCNF?", "Når X er en supernøkkel. Ingen unntak."),
      q("tre-sporsmal", K_NF, "Hvilke tre spørsmål stiller du for hver FD X → A for å finne normalformen?", "<ol><li>Er X en supernøkkel? Ja → BCNF for denne FD-en.</li><li>Er A et nøkkelattributt? Ja → 3NF.</li><li>Er X en ekte delmengde av en kandidatnøkkel? Nei → 2NF. Ja → bare 1NF.</li></ol>Relasjonen har den laveste normalformen blant FD-ene."),
      q("bcnf-algo", K_NF, "Hvordan deler du R ved et BCNF-brudd X → Y?", "Regn ut X⁺. Del R i S₁ = X⁺ og S₂ = X ∪ (R − X⁺). Fortsett på delene til alle er i BCNF."),
      q("fagin", K_NF, "Hva sier Fagins teorem?", "Deler du R i S₁ og S₂ der fellesattributtene bestemmer alt i S₁ (eller alt i S₂), er dekomponeringen tapsfri: joinen av delene gir tilbake nøyaktig R.")
    ]
  };

  /* ============================================================
     6. SQL-regler
     ============================================================ */
  var K_SQL = "F03-02, F04-01/02, F09-02, F10-01/02 (SQL)";
  var sql = {
    id: "sql-regler",
    tittel: "SQL-regler",
    intro: "<p>Reglene som oftest gir trekk på eksamen. Svar før du snur.</p>",
    kort: [
      q("rekkefolge", K_SQL, "I hvilken rekkefølge står leddene i en SELECT-spørring?", "<code>WITH · SELECT · FROM · WHERE · GROUP BY · HAVING · ORDER BY · LIMIT · OFFSET</code> (LIMIT og OFFSET kan bytte plass)."),
      q("alias", K_SQL, "Kan du bruke et alias fra SELECT i WHERE eller HAVING?", "Nei. WHERE og HAVING regnes ut før SELECT. Gjenta uttrykket i stedet (ORDER BY kan bruke aliaset)."),
      q("aggr-where", K_SQL, "Hvor setter du en betingelse på <code>count(*)</code> eller <code>sum(…)</code>?", "I <code>HAVING</code>, etter <code>GROUP BY</code>. Aggregater kan ikke stå i WHERE."),
      q("count", K_SQL, "Forskjellen på <code>count(*)</code> og <code>count(kol)</code>?", "<code>count(*)</code> teller alle radene. <code>count(kol)</code> teller bare radene der kol ikke er NULL."),
      q("tom", K_SQL, "Hva gir <code>sum</code>, <code>avg</code> og <code>count</code> når det ikke finnes rader, eller kolonnen bare har NULL?", "<code>sum</code>, <code>avg</code>, <code>min</code> og <code>max</code> gir NULL. <code>count(kol)</code> gir 0. <code>count(*)</code> gir 0 uten rader, men teller radene selv om kolonnen er NULL."),
      q("null-sml", K_SQL, "Hva gir <code>x = NULL</code>?", "NULL (ukjent), aldri sann. Raden kommer ikke med i WHERE. Bruk <code>IS NULL</code>."),
      q("null-logikk", K_SQL, "Hva blir <code>NULL AND false</code> og <code>NULL OR true</code>?", "<code>NULL AND false</code> = false. <code>NULL OR true</code> = true. Ellers blir det NULL."),
      q("check", K_SQL, "Slipper <code>CHECK (pris &gt; 0)</code> gjennom en rad der pris er NULL?", "Ja. CHECK avviser bare når betingelsen er <i>usann</i>; NULL er ukjent og slipper gjennom. Legg til NOT NULL om det trengs."),
      q("pk", K_SQL, "Hva er <code>PRIMARY KEY</code> det samme som?", "<code>UNIQUE</code> + <code>NOT NULL</code> (og det kan bare være én primærnøkkel per tabell)."),
      q("natural", K_SQL, "Hva joiner <code>NATURAL JOIN</code> på?", "Alle kolonner som har samme navn i begge tabellene. Lett å få feil hvis to tabeller tilfeldigvis har f.eks. en kolonne <code>navn</code> begge steder."),
      q("left-count", K_SQL, "Du vil telle ordre per kunde og ta med kunder med 0 ordre. Hvordan?", "<code>LEFT JOIN</code> fra kunde til ordre, og <code>count(o.ordrenr)</code>, ikke <code>count(*)</code> (som ville gitt 1 for kunder uten ordre)."),
      q("having", K_SQL, "Hva krever HAVING i kurset?", "En <code>GROUP BY</code> (HAVING filtrerer grupper)."),
      q("union-all", K_SQL, "Forskjellen på <code>UNION</code> og <code>UNION ALL</code>?", "<code>UNION</code> gir en mengde (duplikater fjernes). <code>UNION ALL</code> beholder duplikatene (multimengde). Det samme gjelder INTERSECT/EXCEPT og ALL-variantene."),
      q("uten", K_SQL, "Nevn fire måter å skrive «X uten Y» på i SQL.", "<ol><li><code>EXCEPT</code></li><li><code>NOT IN (SELECT …)</code></li><li><code>NOT EXISTS (SELECT …)</code></li><li><code>LEFT JOIN … WHERE y.kol IS NULL</code></li></ol>")
    ]
  };

  IN.PUGG = [symboler, lesing, realisering, ratype, fd, sql];
})();
