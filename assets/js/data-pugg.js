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
  var K_REAL = "F06-02 s3–18 og realiseringsnotatet (realiseringh26) s2–11";

  /* ---------- Grunnsymboler: små frittstående SVG-er med samme klasser som viz-er.js ---------- */
  function mini(w, h, indre, navn) {
    return "<svg class=\"er-svg pg-mini\" viewBox=\"0 0 " + w + " " + h + "\" width=\"" + w + "\" height=\"" + h + "\" role=\"img\" aria-label=\"" + navn + "\">" + indre + "</svg>";
  }
  function rekt(x, y, w, h, kl) { return "<rect x=\"" + x + "\" y=\"" + y + "\" width=\"" + w + "\" height=\"" + h + "\" class=\"" + kl + "\"/>"; }
  function oval(cx, cy, rx, ry, kl) { return "<ellipse cx=\"" + cx + "\" cy=\"" + cy + "\" rx=\"" + rx + "\" ry=\"" + ry + "\" class=\"" + kl + "\"/>"; }
  function rombe(cx, cy, w, h, k, kl) {
    var p = [[cx, cy - h / 2 + k], [cx + w / 2 - k * 1.8, cy], [cx, cy + h / 2 - k], [cx - w / 2 + k * 1.8, cy]].map(function (q) { return q.join(","); }).join(" ");
    return "<polygon points=\"" + p + "\" class=\"" + kl + "\"/>";
  }
  function strek(x1, y1, x2, y2) { return "<line x1=\"" + x1 + "\" y1=\"" + y1 + "\" x2=\"" + x2 + "\" y2=\"" + y2 + "\" class=\"er-line\"/>"; }
  function tekst(x, y, t, kl) { return "<text x=\"" + x + "\" y=\"" + y + "\" text-anchor=\"middle\" class=\"" + kl + "\">" + t + "</text>"; }
  function G(id, figur, svar, spm) { var k = { id: id, kilde: K_GRUNN, a: "<div class=\"pg-mini-h\">" + figur + "</div>", b: svar }; if (spm) k.spm = spm; return k; }
  var K_GRUNN = "F05-01 s4–9, F05-02 s2–5, F05-03 s3–5";
  var grunnsymboler = [
    G("g-rekt", mini(160, 60, rekt(20, 10, 120, 40, "er-ent"), "rektangel"),
      "<b>Rektangel</b> = entitetstype (f.eks. ANSATT). Navnet skrives med STORE bokstaver."),
    G("g-dobbel-rekt", mini(160, 60, rekt(20, 10, 120, 40, "er-ent") + rekt(25, 15, 110, 30, "er-ent er-inner"), "dobbelt rektangel"),
      "<b>Dobbelt rektangel</b> = svak entitetstype: den kan ikke identifiseres alene, bare sammen med den identifiserende entiteten."),
    G("g-rombe", mini(160, 70, rombe(80, 35, 130, 60, 0, "er-rel"), "liggende rombe"),
      "<b>Liggende rombe (diamant)</b> = relasjonstype, f.eks. JOBBER_I. Strekene fra den går til entitetene som deltar."),
    G("g-dobbel-rombe", mini(160, 70, rombe(80, 35, 130, 60, 0, "er-rel") + rombe(80, 35, 130, 60, 5, "er-rel er-inner"), "dobbel rombe"),
      "<b>Dobbel rombe</b> = identifiserende relasjon: relasjonen mellom en svak entitet og dens identifiserende entitet. Den svake entiteten er alltid relatert til nøyaktig én via den."),
    G("g-oval", mini(160, 50, oval(80, 25, 55, 18, "er-attr"), "oval"),
      "<b>Oval (ellipse)</b> = attributt. Den kobles med en strek til entiteten eller relasjonen den hører til."),
    G("g-dobbel-oval", mini(160, 50, oval(80, 25, 55, 18, "er-attr") + oval(80, 25, 50, 13, "er-attr er-inner"), "dobbel oval"),
      "<b>Dobbel oval</b> = flerverdiattributt: kan ha flere verdier for samme entitet (f.eks. flere telefonnumre). Kan ikke være nøkkel."),
    G("g-stiplet-oval", mini(160, 50, oval(80, 25, 55, 18, "er-attr er-derived"), "stiplet oval"),
      "<b>Stiplet oval</b> = utledbart attributt: kan regnes ut fra andre data (f.eks. alder fra fødselsdato). Tas ikke med ved realisering."),
    G("g-understrek", mini(160, 50, oval(80, 25, 55, 18, "er-attr") + tekst(80, 29, "navn", "er-attr-t er-key"), "oval med understreket navn"),
      "<b>Understreket navn i ovalen</b> = nøkkelattributt: verdien er unik for hver entitet.", "Hva betyr det understrekede navnet i ovalen?"),
    G("g-stiplet-understrek", mini(160, 50, oval(80, 25, 55, 18, "er-attr") + tekst(80, 29, "navn", "er-attr-t") + "<line x1=\"64\" y1=\"33\" x2=\"96\" y2=\"33\" class=\"er-pkey-u\"/>", "oval med stiplet understrek"),
      "<b>Stiplet understrek</b> = svak nøkkel på en svak entitet. Den identifiserer bare sammen med nøkkelen til den identifiserende entiteten.", "Hva betyr den stiplede understreken under navnet?"),
    G("g-sammensatt", mini(200, 100, strek(100, 32, 55, 75) + strek(100, 32, 145, 75) + oval(100, 25, 45, 16, "er-attr") + oval(55, 80, 40, 14, "er-attr") + oval(145, 80, 40, 14, "er-attr"), "oval med to ovaler under"),
      "<b>Oval med egne ovaler under</b> = sammensatt attributt (f.eks. navn = fornavn + etternavn). Ved realisering beholdes bare bladene.", "Hva betyr det at ovalen har egne ovaler under seg?"),
    G("g-enkel-strek", mini(220, 60, strek(90, 30, 140, 30) + rekt(10, 12, 80, 36, "er-ent") + rombe(175, 30, 70, 46, 0, "er-rel"), "enkel strek mellom entitet og relasjon"),
      "<b>Enkel strek</b> mellom entitet og relasjon = partiell deltakelse: en entitet <i>kan</i> stå utenfor relasjonen (minst 0).", "Hva betyr den enkle streken mellom rektangelet og romben?"),
    G("g-dobbel-strek", mini(220, 60, strek(90, 27.5, 140, 27.5) + strek(90, 32.5, 140, 32.5) + rekt(10, 12, 80, 36, "er-ent") + rombe(175, 30, 70, 46, 0, "er-rel"), "dobbel strek mellom entitet og relasjon"),
      "<b>Dobbel strek</b> mellom entitet og relasjon = total deltakelse: hver entitet <i>må</i> være med i relasjonen minst én gang.", "Hva betyr den doble streken mellom rektangelet og romben?"),
    G("g-tall", mini(220, 60, strek(90, 30, 140, 30) + rekt(10, 12, 80, 36, "er-ent") + rombe(175, 30, 70, 46, 0, "er-rel") + tekst(128, 24, "N", "er-kard"), "bokstaven N på streken ved rombe"),
      "<b>1, N eller M på streken</b> (nær romben) = kardinalitet. Tallet ved entitet E sier hvor mange E den andre siden kan kobles til: 1 = høyst én, N/M = mange.", "Hva betyr bokstaven N på streken ved romben?")
  ];

  /* ============================================================
     1. ER-symboler: figur ↔ betydning
     ============================================================ */
  var symboler = {
    id: "er-symboler",
    tittel: "ER-symboler",
    vend: true,
    retning: ["Figur → betydning", "Betydning → figur"],
    spm: ["Hva betyr dette ER-symbolet?", "Hvordan tegnes dette i ER? Skisser det før du snur."],
    intro: "<p>Først grunnsymbolene alene (rektangel, rombe, oval, doble og stiplede former, streker), så de samme symbolene i små figurer. Snu retningen for å øve andre veien: da får du betydningen og skal se figuren for deg (tegn den gjerne på papir).</p>",
    kort: grunnsymboler.concat([
      { id: "entitet", kilde: K_ER, spm: "Hva betyr rektangelet ANSATT?",
        a: { er: fig([E("e", "ANSATT", [0, 0], [A("Navn")])]) },
        b: "<b>Entitet(stype)</b>: rektangel med navnet i STORE bokstaver. Ovalene rundt er attributtene." },
      { id: "svak", kilde: K_SVAK, spm: "Hva betyr det doble rektangelet ROM, den doble romben HAR og den stiplede understreken under Romnr?",
        a: { er: fig([E("b", "BYGNING", [0, 0], [A("Bnr", { nokkel: true })]), E("r", "ROM", [2, 0], [A("Romnr", { delvisNokkel: true })], true)],
                     [R("h", "HAR", [1, 0], [L("b", "1", false), L("r", "N", true)], [], true)]) },
        b: "<b>Svak entitet</b> (dobbelt rektangel, ROM) med <b>identifiserende relasjon</b> (dobbel rombe, HAR) til den identifiserende entiteten BYGNING. Romnr er en <b>svak nøkkel</b> (stiplet understrek). Den svake siden har alltid total deltakelse (dobbel strek), og det står 1 ved BYGNING." },
      { id: "relasjon", kilde: K_ER, spm: "Hva betyr romben TAR, og hva sier M og N på strekene?",
        a: { er: fig([E("s", "STUDENT", [0, 0]), E("e", "EMNE", [2, 0])], [R("t", "TAR", [1, 0], [L("s", "M"), L("e", "N")])]) },
        b: "<b>Relasjon(stype)</b>: rombe med strek til hver entitet som deltar. Bokstavene ved strekene er kardinaliteten (her mange-til-mange)." },
      { id: "attributt", kilde: K_ER, spm: "Hva betyr ovalen Tittel?",
        a: { er: fig([E("e", "BOK", [0, 0], [A("Tittel")])]) },
        b: "<b>Attributt</b>: oval koblet til entiteten (eller relasjonen) med en strek." },
      { id: "nokkel", kilde: K_ER, spm: "Hva betyr det understrekede attributtet ISBN?",
        a: { er: fig([E("e", "BOK", [0, 0], [A("ISBN", { nokkel: true }), A("Tittel")])]) },
        b: "<b>Nøkkelattributt</b>: navnet er understreket. To bøker kan ikke ha samme ISBN." },
      { id: "to-nokler", kilde: K_ER, spm: "Hva betyr det at både Regnr og Chassisnr er understreket hver for seg?",
        a: { er: fig([E("e", "BIL", [0, 0], [A("Regnr", { nokkel: true }), A("Chassisnr", { nokkel: true }), A("Farge")])]) },
        b: "<b>To uavhengige nøkler</b>: hver er understreket for seg. Regnr alene identifiserer en bil, og Chassisnr alene gjør det også. (Det betyr <i>ikke</i> at de to sammen er nøkkelen.)" },
      { id: "delvis", kilde: K_SVAK, spm: "Hva betyr den stiplede understreken under Romnr?",
        a: { er: fig([E("r", "ROM", [0, 0], [A("Romnr", { delvisNokkel: true }), A("Areal")], true)]) },
        b: "<b>Svak nøkkel</b> (stiplet understrek) på en svak entitet. Den skiller bare rommene <i>innenfor samme bygning</i>; full identifikasjon får du sammen med nøkkelen til den identifiserende entiteten." },
      { id: "sammensatt", kilde: K_ER, spm: "Hva betyr det at Navn har egne ovaler (Fornavn, Etternavn)?",
        a: { er: fig([E("e", "PERSON", [0, 0], [A("Pnr", { nokkel: true }), A("Navn", { deler: [A("Fornavn"), A("Etternavn")] })])]) },
        b: "<b>Sammensatt attributt</b>: Navn er bygd av egne ovaler (Fornavn, Etternavn). Ved realisering beholdes bare bladene." },
      { id: "sammensatt-nokkel", kilde: K_ER, spm: "Hva betyr det at Id er understreket og har ovalene Selskap og Løpenr under seg?",
        a: { er: fig([E("e", "FLY", [0, 0], [A("Id", { nokkel: true, deler: [A("Selskap"), A("Løpenr")] }), A("Modell")])]) },
        b: "<b>Sammensatt nøkkel</b>: forelderen (Id) er understreket. Det er kombinasjonen Selskap + Løpenr som identifiserer, ikke hver del for seg." },
      { id: "flerverdi", kilde: K_ER, spm: "Hva betyr den doble ovalen Telefon?",
        a: { er: fig([E("e", "PERSON", [0, 0], [A("Pnr", { nokkel: true }), A("Telefon", { flerverdi: true })])]) },
        b: "<b>Flerverdiattributt</b> (dobbel oval): en person kan ha flere telefonnumre. Et flerverdiattributt kan aldri være nøkkel." },
      { id: "avledet", kilde: K_ER, spm: "Hva betyr den stiplede ovalen Alder?",
        a: { er: fig([E("e", "PERSON", [0, 0], [A("Pnr", { nokkel: true }), A("Fødselsdato"), A("Alder", { avledet: true })])]) },
        b: "<b>Utledbart attributt</b> (stiplet oval): Alder kan regnes ut fra Fødselsdato. Det tas ikke med når modellen realiseres." },
      { id: "relattr", kilde: K_ER, spm: "Hva betyr ovalen Karakter som henger på romben TAR?",
        a: { er: fig([E("s", "STUDENT", [0, 0]), E("e", "EMNE", [2, 0])], [R("t", "TAR", [1, 0], [L("s", "M"), L("e", "N")], [A("Karakter")])]) },
        b: "<b>Attributt på en relasjon</b>: Karakter hører til kombinasjonen student + emne, ikke til en av dem alene. Et relasjonsattributt er aldri nøkkel." },
      { id: "total", kilde: K_ER, spm: "Hva betyr den doble streken ved ANSATT og den enkle streken ved AVDELING?",
        a: { er: fig([E("a", "ANSATT", [0, 0]), E("d", "AVDELING", [2, 0])], [R("j", "JOBBER_I", [1, 0], [L("a", "N", true), L("d", "1", false)])]) },
        b: "<b>Dobbel strek = total deltakelse</b> (minst 1): hver ansatt <i>må</i> jobbe i en avdeling. <b>Enkel strek = partiell</b> (minst 0): en avdeling kan stå uten ansatte." },
      { id: "kard-lesing", kilde: K_ER, spm: "Hva betyr 1 ved FORLAG og N ved BOK?",
        a: { er: fig([E("b", "BOK", [0, 0]), E("f", "FORLAG", [2, 0])], [R("u", "UTGITT_AV", [1, 0], [L("b", "N"), L("f", "1")])]) },
        b: "<b>Lesing av kardinalitet</b>: tallet ved en entitet E sier hvor mange E den <i>andre</i> siden kan kobles til. 1 ved FORLAG: en bok har høyst ett forlag. N ved BOK: et forlag kan ha mange bøker." },
      { id: "ternaer", kilde: K_TER, spm: "Hva betyr én rombe med tre entiteter, og hvordan leses N, M og K?",
        a: { er: fig([E("l", "LEVERANDØR", [0, 0]), E("d", "DEL", [2, 0]), E("p", "PROSJEKT", [1, 1])],
                     [R("v", "LEVERER", [1, 0], [L("l", "N"), L("d", "M"), L("p", "K")])]) },
        b: "<b>Ternær relasjon</b>: én rombe med tre deltakere. Tallet ved E sier: gitt én kombinasjon av de to andre, hvor mange E. En ternær relasjon er <i>ikke</i> det samme som tre binære." }
    ])
  };

  /* Retning «betydning → figur»: baksideteksten navngir symbolet («Dobbel rombe = …») og ville
     røpt svaret. bFor er en beskrivelse uten symbolnavnet; svaret er figuren på forsiden (k.a). */
  var BFOR = {
    "g-rekt": "En entitetstype, f.eks. ANSATT.",
    "g-dobbel-rekt": "En svak entitetstype: den kan bare identifiseres sammen med den identifiserende entiteten.",
    "g-rombe": "En relasjonstype, f.eks. JOBBER_I, med streker til entitetene som deltar.",
    "g-dobbel-rombe": "En identifiserende relasjon mellom en svak entitet og dens identifiserende entitet.",
    "g-oval": "Et attributt.",
    "g-dobbel-oval": "Et flerverdiattributt, f.eks. flere telefonnumre for samme person.",
    "g-stiplet-oval": "Et utledbart attributt, f.eks. alder, som kan regnes ut fra fødselsdato.",
    "g-understrek": "Et nøkkelattributt: verdien er unik for hver entitet.",
    "g-stiplet-understrek": "En svak nøkkel på en svak entitet.",
    "g-sammensatt": "Et sammensatt attributt, f.eks. navn = fornavn + etternavn.",
    "g-enkel-strek": "Partiell deltakelse: en entitet kan stå utenfor relasjonen (minst 0).",
    "g-dobbel-strek": "Total deltakelse: hver entitet må være med i relasjonen minst én gang.",
    "g-tall": "Kardinaliteten «mange» på den ene siden av en relasjon.",
    "entitet": "Entitetstypen ANSATT med attributtet Navn.",
    "svak": "ROM kan bare identifiseres sammen med BYGNING (nøkkel Bnr), via relasjonen HAR. Romnr skiller rommene innenfor én bygning. En bygning har mange rom.",
    "relasjon": "Relasjonstypen TAR mellom STUDENT og EMNE, mange-til-mange.",
    "attributt": "Entitetstypen BOK med attributtet Tittel.",
    "nokkel": "Entitetstypen BOK, der ISBN er unik for hver bok, og attributtet Tittel.",
    "to-nokler": "BIL, der Regnr alene og Chassisnr alene hver identifiserer en bil, og attributtet Farge.",
    "delvis": "ROM, som bare kan identifiseres sammen med en annen entitet. Romnr skiller rommene innenfor den. Også attributtet Areal.",
    "sammensatt": "PERSON med nøkkel Pnr og attributtet Navn, som består av Fornavn og Etternavn.",
    "sammensatt-nokkel": "FLY, identifisert av kombinasjonen Selskap + Løpenr (samlet som Id), og attributtet Modell.",
    "flerverdi": "PERSON med nøkkel Pnr og Telefon, der en person kan ha flere telefonnumre.",
    "avledet": "PERSON med nøkkel Pnr, Fødselsdato og Alder, som kan regnes ut fra fødselsdatoen.",
    "relattr": "STUDENT TAR EMNE (mange-til-mange), og Karakter hører til kombinasjonen student + emne.",
    "total": "ANSATT JOBBER_I AVDELING: hver ansatt må jobbe i én avdeling, en avdeling kan ha mange ansatte eller ingen.",
    "kard-lesing": "BOK UTGITT_AV FORLAG: en bok har høyst ett forlag, et forlag kan ha mange bøker. Ingen må delta.",
    "ternaer": "Én relasjon LEVERER mellom LEVERANDØR, DEL og PROSJEKT, med N, M og K."
  };
  symboler.kort.forEach(function (k) { if (BFOR[k.id]) k.bFor = BFOR[k.id]; });

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
        "Svak entitet: PN = PN-en til den identifiserende entiteten + den svake nøkkelen, og den lånte PN-en er også FN. Den identifiserende relasjonen (HAR) realiseres ikke på nytt."),
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
        "Flerverdiattributt: egen relasjon med nøkkelen til entiteten som har attributtet, som FN. Nøkkelen er alle attributtene i den nye relasjonen."),
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
    spm: ["Hva heter dette, hva gjør det, og hva tilsvarer det i SQL?", "Hvordan skrives dette i relasjonsalgebra?"],
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
  function q(id, k, a, b, spm) { var o = { id: id, kilde: k, a: a, b: b }; if (spm) o.spm = spm; return o; }
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

  /* ============================================================
     7. Begreper
     ============================================================ */
  var begreper = {
    id: "begreper",
    tittel: "Begreper",
    vend: true,
    retning: ["Begrep → forklaring", "Forklaring → begrep"],
    spm: ["Hva betyr begrepet?", "Hvilket begrep forklares her?"],
    intro: "<p>Ordene kurset bruker. Forklar begrepet med egne ord før du snur, eller snu retningen og finn ordet ut fra forklaringen.</p>",
    kort: [
      q("database", "F01-01", "Database", "En samling data som er organisert slik at den er lett å lagre, finne og endre."),
      q("dbms", "F01-01", "DBMS (databasehåndteringssystem)", "Et system som lar brukerne definere, opprette, vedlikeholde og kontrollere tilgangen til databasen, f.eks. PostgreSQL. Det passer på integritet og sikkerhet."),
      q("relasjon", "F02-01", "Relasjon (i relasjonsmodellen)", "En tabell: en mengde tupler som alle har de samme attributtene."),
      q("tuppel", "F02-01", "Tuppel", "En rad i en relasjon: én verdi for hvert attributt."),
      q("attributt", "F02-01", "Attributt", "En kolonne i en relasjon. Har et navn og et domene (en type)."),
      q("domene", "F02-01", "Domene", "Mengden lovlige verdier et attributt kan ha, f.eks. heltall eller tekst."),
      q("skjema-instans", "F02-01 s6, F08-02 s3", "Signatur, skjema og instans", "<b>Signaturen</b> er navnet og attributtene, f.eks. Ansatt(Anr, Navn). Et <b>relasjonsskjema</b> er en mengde signaturer. <b>Instansen</b> er tuplene som ligger i relasjonen på et gitt tidspunkt.", ["Hva betyr hvert av de tre begrepene?", "Hvilke tre begreper forklares her?"]),
      q("sn", K_FD, "Supernøkkel (SN)", "En mengde attributter som identifiserer hvert tuppel: to ulike tupler kan aldri være like på alle attributtene i den."),
      q("kn", K_FD, "Kandidatnøkkel (KN)", "En minimal supernøkkel: fjerner du ett attributt, er den ikke lenger supernøkkel."),
      q("pn", "F06-02 s4", "Primærnøkkel (PN)", "Den kandidatnøkkelen du velger å bruke til å identifisere tuplene."),
      q("fn", "F04-01, F06-02", "Fremmednøkkel (FN)", "Attributter som må ha en verdi som finnes i en kandidatnøkkel (oftest PN) i en annen (eller samme) relasjon. I SQL: REFERENCES."),
      q("nokkelattributt", K_NF, "Nøkkelattributt", "Et attributt som er med i minst én kandidatnøkkel."),
      q("entitet", "F05-01", "Entitet vs. entitetstype", "En <b>entitet</b> er én konkret ting (en bestemt ansatt). <b>Entitetstypen</b> er klassen av like ting (ANSATT), tegnet som rektangel.", ["Hva er forskjellen på de to?", "Hvilke to begreper skilles her?"]),
      q("relasjonstype", "F05-02", "Relasjonstype (i ER)", "En sammenheng mellom entitetstyper, f.eks. JOBBER_I mellom ANSATT og AVDELING. Tegnes som rombe. Ikke det samme som en relasjon (tabell) i relasjonsmodellen."),
      q("kardinalitet", "F05-02 s3–4", "Kardinalitet", "Høyeste antall en entitet kan kobles til gjennom en relasjon: 1 eller mange (N/M)."),
      q("deltakelse", "F05-02 s4", "Deltakelse (total/partiell)", "Laveste antall: <b>total</b> (dobbel strek) betyr at hver entitet må være med minst én gang; <b>partiell</b> (enkel strek) betyr at den kan stå utenfor.", ["Hva betyr total og partiell deltakelse, og hvordan tegnes de?", "Hvilket begrep forklares her, med begge variantene?"]),
      q("svak-entitet", K_SVAK, "Svak entitet", "En entitetstype med en nøkkel (svak nøkkel) som bare er unik sammen med nøkkelen til den identifiserende entiteten, via en identifiserende relasjon."),
      q("skranke", "F04-01 s6–10, F04-02", "Skranke", "En regel dataene må følge, f.eks. NOT NULL, UNIQUE, PRIMARY KEY, REFERENCES eller CHECK. DBMS-et avviser endringer som bryter den."),
      q("null", "F03-02 s13–15", "NULL", "Markør for en ukjent eller manglende verdi. Sammenligning med NULL gir ukjent (NULL), ikke sann eller usann."),
      q("mengde-multimengde", "F02-03, F10-02", "Mengde vs. multimengde", "En <b>mengde</b> har ingen duplikater (relasjonsalgebra). En <b>multimengde</b> kan ha duplikater (SQL, så lenge du ikke bruker DISTINCT eller UNION/INTERSECT/EXCEPT uten ALL).", ["Hva er forskjellen på de to?", "Hvilke to begreper skilles her?"]),
      q("fd-begrep", K_FD, "Funksjonell avhengighet (FD)", "X → Y: to tupler som er like på X, er også like på Y."),
      q("tapsfri", K_NF, "Tapsfri dekomponering", "En oppdeling av R i mindre relasjoner der en naturlig join av delene gir tilbake nøyaktig R, uten ekstra (falske) tupler."),
      q("view", "F04-03 s3, s7", "View", "En lagret spørring med navn som kan brukes som en tabell. Dataene lagres ikke på nytt (med mindre det er et materialisert view)."),
      q("indeks", "F13-01 s3, s6–9", "Indeks", "En indeksstruktur (B-tre eller hash) som lar databasen raskt finne rader ut fra verdiene i én eller flere kolonner. PRIMARY KEY gir automatisk en B-tre-indeks.")
    ]
  };

  /* ============================================================
     8. FD-oppgaver: finn nøkler og normalform
     ============================================================ */
  var K_FDO = "F07-02 s7–11, F08-01 s3–5, F08-02 s6–7";
  function fo(id, oppg, svar, merk) { return { id: id, kilde: K_FDO, a: { pre: oppg, etter: merk || "Finn kandidatnøklene og høyeste normalform relasjonen er på." }, b: svar }; }
  var fdOppg = {
    id: "fd-oppgaver",
    tittel: "FD-oppgaver",
    intro: "<p>Små FD-mengder du løser i hodet eller på papir. Fremgangsmåten: (1) attributter som aldri står på høyresiden, er med i alle kandidatnøkler, (2) regn tillukningen av dem, (3) still de tre spørsmålene for hver FD. Relasjonen har den laveste normalformen blant FD-ene.</p>",
    kort: [
      fo("fo-kjede", "R(A, B, C)\nF = { A → B,  B → C }",
        "<p><b>KN: {A}</b>. A står aldri på høyresiden, og A⁺ = {A, B, C}.</p><p>A → B: A er SN → BCNF.<br>B → C: B er ikke SN, C er ikke nøkkelattributt, B er ikke del av en KN → <b>2NF</b>.</p><p>R er på <b>2NF</b>.</p>"),
      fo("fo-2nf", "R(A, B, C, D)\nF = { AB → C,  C → D }",
        "<p><b>KN: {A, B}</b>. A og B står aldri på høyresiden, og {A, B}⁺ = {A, B, C, D}.</p><p>AB → C: BCNF.<br>C → D: C er ikke SN, D er ikke nøkkelattributt, C er ikke del av en KN → 2NF.</p><p>R er på <b>2NF</b>.</p>"),
      fo("fo-1nf", "R(A, B, C, D)\nF = { AB → C,  B → D }",
        "<p><b>KN: {A, B}</b>. {A, B}⁺ = {A, B, C, D}.</p><p>B → D: B er ikke SN, D er ikke nøkkelattributt, og B er en <i>ekte del</i> av KN-en {A, B} → bryter 2NF.</p><p>R er bare på <b>1NF</b>.</p>"),
      fo("fo-3nf", "R(A, B, C)\nF = { AB → C,  C → B }",
        "<p><b>KN: {A, B} og {A, C}</b>. A står aldri på høyresiden. A⁺ = {A}, men {A, B}⁺ = {A, C}⁺ = {A, B, C}.</p><p>AB → C: BCNF.<br>C → B: C er ikke SN, men B er et nøkkelattributt → <b>3NF</b>.</p><p>R er på <b>3NF</b> (ikke BCNF).</p>"),
      fo("fo-sykel", "R(A, B, C)\nF = { A → B,  B → C,  C → A }",
        "<p><b>KN: {A}, {B} og {C}</b>. Hvert attributt bestemmer alle de andre via sykelen.</p><p>Venstresiden i hver FD er en supernøkkel → R er på <b>BCNF</b>.</p>"),
      fo("fo-fem", "R(A, B, C, D, E)\nF = { A → B,  BC → D,  D → E }",
        "<p><b>KN: {A, C}</b>. A og C står aldri på høyresiden, og {A, C}⁺ = {A, C, B, D, E}. Da er {A, C} den eneste KN-en.</p><p>A → B: A er en ekte del av KN-en, og B er ikke nøkkelattributt → bryter 2NF.</p><p>R er bare på <b>1NF</b>.</p>"),
      fo("fo-tillukning", "R(A, B, C, D, E)\nF = { A → B,  B → C,  CD → E }",
        "<p>{A, D}⁺: start med {A, D}. A → B gir B, B → C gir C, CD → E gir E. Altså {A, D}⁺ = {A, B, C, D, E}, så {A, D} er en SN.</p><p>A og D står aldri på høyresiden, så <b>{A, D} er den eneste KN-en</b>.</p>",
        "Regn ut {A, D}⁺. Er {A, D} en kandidatnøkkel?"),
      fo("fo-bcnf", "R(A, B, C, D)\nF = { AB → C,  C → D }\nKN: {A, B}",
        "<p>Bruddet er C → D (C er ikke SN). C⁺ = {C, D}.</p><p>S₁ = C⁺ = <b>S₁(C, D)</b> med KN {C}.<br>S₂ = C ∪ (R − C⁺) = <b>S₂(A, B, C)</b> med KN {A, B}.</p><p>Begge er på BCNF, og oppdelingen er tapsfri (fellesattributtet C bestemmer alt i S₁).</p>",
        "Del R tapsfritt opp til BCNF."),
      fo("fo-fagin", "R(A, B, C)\nF = { A → B }\nOppdeling: S₁(A, B) og S₂(A, C)",
        "<p><b>Ja, tapsfri.</b> Fellesattributtet er A, og A → B, så A bestemmer alt i S₁. Da sier Fagins teorem at joinen av S₁ og S₂ gir tilbake nøyaktig R.</p>",
        "Er oppdelingen tapsfri? Begrunn.")
    ]
  };

  /* ============================================================
     9. SQL-mønstre
     ============================================================ */
  var K_SQLM = "F09-01 s5, F09-02, F09-03, F10-01, F10-02 og repetisjon_sql";
  var SKJEMA = "kunde(kid, navn, sted)\nordre(oid, kid → kunde, dato, belop)";
  function sm(id, oppg, sqlTekst, merk, skjema) { return { id: id, kilde: K_SQLM, a: { html: oppg, pre: skjema || SKJEMA }, b: { pre: sqlTekst, etter: merk } }; }
  var sqlMonstre = {
    id: "sql-monstre",
    tittel: "SQL-mønstre",
    spm: "Skriv SQL-spørringen mot skjemaet over.",
    intro: "<p>Oppgavetypene som går igjen på eksamen, hver med sitt faste mønster. Skriv spørringen på papir før du snur. Det finnes ofte flere riktige svar; baksiden viser ett vanlig.</p>",
    kort: [
      sm("m-null-ordre", "Antall ordre per kunde, <b>også kunder med 0 ordre</b>.",
        "SELECT k.kid, k.navn, count(o.oid) AS antall\nFROM kunde AS k\n     LEFT JOIN ordre AS o ON o.kid = k.kid\nGROUP BY k.kid, k.navn;",
        "LEFT JOIN beholder kundene uten ordre. Tell <code>o.oid</code>, ikke <code>*</code>: <code>count(*)</code> ville gitt 1 for dem."),
      sm("m-uten", "Kunder som <b>aldri</b> har lagt inn en ordre.",
        "SELECT k.navn\nFROM kunde AS k\nWHERE NOT EXISTS (\n  SELECT * FROM ordre AS o WHERE o.kid = k.kid\n);",
        "Alternativer: <code>NOT IN (SELECT kid FROM ordre)</code> (bare når <code>kid</code> aldri er NULL: én NULL gir 0 rader), <code>EXCEPT</code> eller <code>LEFT JOIN … WHERE o.oid IS NULL</code>."),
      sm("m-hoyest", "Ordren(e) med <b>høyest beløp</b>. Er det likt, skal alle med.",
        "SELECT oid, belop\nFROM ordre\nWHERE belop = (SELECT max(belop) FROM ordre);",
        "Lysarkene viser også <code>ORDER BY belop DESC LIMIT 1</code>. Merk: den gir bare én rad og mister rader med lik verdi."),
      sm("m-snitt", "Ordre med beløp <b>over gjennomsnittet</b>.",
        "SELECT oid, belop\nFROM ordre\nWHERE belop > (SELECT avg(belop) FROM ordre);",
        "Aggregatet kan ikke stå rett i WHERE; legg det i en delspørring."),
      sm("m-having", "Kunder med <b>minst 3 ordre</b>.",
        "SELECT kid, count(*) AS antall\nFROM ordre\nGROUP BY kid\nHAVING count(*) >= 3;",
        "Betingelser på aggregater står i HAVING, etter GROUP BY."),
      sm("m-sum-sortert", "Total omsetning per kunde (navn), <b>størst først</b>.",
        "SELECT k.navn, sum(o.belop) AS total\nFROM kunde AS k\n     JOIN ordre AS o ON o.kid = k.kid\nGROUP BY k.kid, k.navn\nORDER BY total DESC;",
        "Grupper på nøkkelen (kid) i tillegg til navn, så to kunder med samme navn ikke slås sammen. ORDER BY kan bruke aliaset."),
      sm("m-par", "Alle <b>par av kunder</b> som bor på samme sted (hvert par én gang).",
        "SELECT a.navn, b.navn\nFROM kunde AS a\n     JOIN kunde AS b ON a.sted = b.sted\nWHERE a.kid < b.kid;",
        "Self-join med to aliaser. <code>a.kid &lt; b.kid</code> fjerner både (x, x) og speilparet (y, x)."),
      sm("m-for-alle", "Studenter som tar <b>alle</b> emner.",
        "SELECT s.navn\nFROM student AS s\nWHERE NOT EXISTS (\n  SELECT * FROM emne AS e\n  WHERE NOT EXISTS (\n    SELECT * FROM tar AS t\n    WHERE t.sid = s.sid AND t.ekode = e.ekode\n  )\n);",
        "«For alle» = «det finnes ikke et emne studenten ikke tar». Alternativ: <code>SELECT sid FROM tar GROUP BY sid HAVING count(DISTINCT ekode) = (SELECT count(*) FROM emne)</code>.",
        "student(sid, navn)\nemne(ekode, tittel)\ntar(sid → student, ekode → emne)")
    ]
  };

  IN.PUGG = [symboler, lesing, realisering, ratype, begreper, fd, fdOppg, sql, sqlMonstre];
})();
