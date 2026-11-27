/* ============================================================
   IN2090 guide · data-er.js
   Blokk 1 · ER-modellering: ER-figurer (format.md § 4), quiz, sant/usant,
   JA/NEI-øving og stegene i «Fra tekst til diagram».
   Alt fagstoff er formulert med egne ord (plan/innhold/01-er.md). Eksemplene
   (festivalen og det «krypterte» diagrammet) er laget for guiden.
   Konvensjon: ledd[].kard står på streken mellom den entiteten og romben
   (rett ved romben). total: true = dobbel strek på den samme streken.
   Klassisk script, lastes etter core.js og viz-er.js. Setter IN.dataEr.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  function K(ref) { return { ref: ref, egneOrd: true }; }

  /* ---------- Figurer ---------- */
  var FIG_TEGNEFORKLARING = {
    entiteter: [
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [0, 0],
        attr: [ { navn: "Artistnr", nokkel: true },
                { navn: "Kunstnernavn", nokkel: true },
                { navn: "Land" },
                { navn: "Sjanger", flerverdi: true } ] },
      { id: "PLATESELSKAP", navn: "PLATESELSKAP", svak: false, pos: [2, 0],
        attr: [ { navn: "Orgnr", nokkel: true }, { navn: "Navn" } ] }
    ],
    relasjoner: [
      { id: "KONTRAKT", navn: "KONTRAKT", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "ARTIST", kard: "N", total: false },
                { entitet: "PLATESELSKAP", kard: "1", total: true } ],
        attr: [ { navn: "Signert", ang: 90 } ] }
    ],
    merknad: "To uavhengige nøkler på ARTIST (Artistnr og Kunstnernavn, hver understreket for seg). Sjanger er flerverdi. Signert er et relasjonsattributt: datoen gjelder kontrakten, ikke artisten alene."
  };

  var FIG_ATTRIBUTTER = {
    entiteter: [
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [0, 0.3],
        attr: [ { navn: "Epost", nokkel: true },
                { navn: "Mobil", nokkel: true },
                { navn: "Navn", deler: [ { navn: "Fornavn" }, { navn: "Etternavn" } ] },
                { navn: "Fdato" },
                { navn: "Alder", avledet: true },
                { navn: "Språk", flerverdi: true } ] },
      { id: "PASS", navn: "FESTIVALPASS", svak: false, pos: [1.75, 0.3],
        attr: [ { navn: "Passkode", nokkel: true, ang: 30, deler: [ { navn: "År" }, { navn: "Løpenr" } ] },
                { navn: "Type", ang: -90 } ] }
    ],
    relasjoner: [],
    merknad: "FRIVILLIG har to uavhengige nøkler. FESTIVALPASS har én sammensatt nøkkel: Passkode er understreket, År og Løpenr ikke."
  };

  var FIG_RELASJONER = {
    entiteter: [
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [1, 0],
        attr: [ { navn: "Artistnr", nokkel: true }, { navn: "Kunstnernavn" } ] },
      { id: "PLATESELSKAP", navn: "PLATESELSKAP", svak: false, pos: [3, 0],
        attr: [ { navn: "Orgnr", nokkel: true }, { navn: "Navn" } ] },
      { id: "INSTRUMENT", navn: "INSTRUMENT", svak: false, pos: [1, 2],
        attr: [ { navn: "Navn", nokkel: true } ] }
    ],
    relasjoner: [
      { id: "KONTRAKT", navn: "KONTRAKT", identifiserende: false, pos: [2, 0],
        ledd: [ { entitet: "ARTIST", kard: "N", total: false },
                { entitet: "PLATESELSKAP", kard: "1", total: true } ],
        attr: [] },
      { id: "BEHERSKER", navn: "BEHERSKER", identifiserende: false, pos: [1, 1],
        ledd: [ { entitet: "ARTIST", kard: "M", total: false },
                { entitet: "INSTRUMENT", kard: "N", total: true } ],
        attr: [ { navn: "Nivå", ang: 0 } ] },
      { id: "OPPVARMING", navn: "OPPVARMING", identifiserende: false, pos: [0, 0],
        ledd: [ { entitet: "ARTIST", kard: "N", total: false, rolle: "hovedartist" },
                { entitet: "ARTIST", kard: "M", total: false, rolle: "oppvarming" } ],
        attr: [] }
    ],
    merknad: "OPPVARMING er rekursiv: to streker fra ARTIST til samme rombe, med rollenavn."
  };

  var FIG_SJEF = {
    entiteter: [
      { id: "SCENE", navn: "SCENE", svak: false, pos: [0, 0],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Kapasitet" } ] },
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [2, 0],
        attr: [ { navn: "Epost", nokkel: true } ] }
    ],
    relasjoner: [
      { id: "SJEF", navn: "SJEF", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "SCENE", kard: "1", total: true },
                { entitet: "FRIVILLIG", kard: "1", total: false } ],
        attr: [] }
    ],
    merknad: "1:1. Hver scene har nøyaktig én sjef (dobbel strek ved SCENE og 1 ved FRIVILLIG). En frivillig er sjef for høyst én scene og trenger ikke være sjef."
  };

  var FIG_SVAK = {
    entiteter: [
      { id: "SCENE", navn: "SCENE", svak: false, pos: [0, 0],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Kapasitet" } ] },
      { id: "KONSERT", navn: "KONSERT", svak: true, pos: [2, 0],
        attr: [ { navn: "Start", delvisNokkel: true },
                { navn: "Slutt" },
                { navn: "Varighet", avledet: true } ] },
      { id: "LATPLASS", navn: "LÅTPLASS", svak: true, pos: [2, 1.7],
        attr: [ { navn: "Nr", delvisNokkel: true }, { navn: "Låttittel" } ] }
    ],
    relasjoner: [
      { id: "PA", navn: "PÅ", identifiserende: true, pos: [1, 0],
        ledd: [ { entitet: "SCENE", kard: "1", total: false },
                { entitet: "KONSERT", kard: "N", total: true } ],
        attr: [] },
      { id: "I_LISTE", navn: "I_LISTE", identifiserende: true, pos: [2, 0.85],
        ledd: [ { entitet: "KONSERT", kard: "1", total: false },
                { entitet: "LATPLASS", kard: "N", total: true } ],
        attr: [] }
    ],
    merknad: "To nivåer: en LÅTPLASS identifiseres av scenens navn, konsertens start og plassens nr."
  };

  var FIG_TERNAER = {
    entiteter: [
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [0, 0],
        attr: [ { navn: "Epost", nokkel: true } ] },
      { id: "SCENE", navn: "SCENE", svak: false, pos: [2, 0],
        attr: [ { navn: "Navn", nokkel: true } ] },
      { id: "OPPGAVE", navn: "OPPGAVE", svak: false, pos: [1, 2],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Beskrivelse" } ] }
    ],
    relasjoner: [
      { id: "VAKT", navn: "VAKT", identifiserende: false, pos: [1, 1],
        ledd: [ { entitet: "FRIVILLIG", kard: "M", total: false },
                { entitet: "SCENE", kard: "N", total: false },
                { entitet: "OPPGAVE", kard: "1", total: true } ],
        attr: [ { navn: "Timer", ang: 0 } ] }
    ],
    merknad: "1 ved OPPGAVE: gitt (frivillig, scene) høyst én oppgave. Dobbel strek ved OPPGAVE: hver oppgave brukes i minst én vakt."
  };

  var FIG_TRE_BINAERE = {
    entiteter: [
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [0, 0], attr: [ { navn: "Epost", nokkel: true } ] },
      { id: "SCENE", navn: "SCENE", svak: false, pos: [2, 0], attr: [ { navn: "Navn", nokkel: true } ] },
      { id: "OPPGAVE", navn: "OPPGAVE", svak: false, pos: [1, 2], attr: [ { navn: "Navn", nokkel: true } ] }
    ],
    relasjoner: [
      { id: "JOBBER_PA", navn: "JOBBER_PÅ", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "FRIVILLIG", kard: "M", total: false }, { entitet: "SCENE", kard: "N", total: false } ], attr: [] },
      { id: "KAN", navn: "KAN", identifiserende: false, pos: [0, 1],
        ledd: [ { entitet: "FRIVILLIG", kard: "M", total: false }, { entitet: "OPPGAVE", kard: "N", total: true } ], attr: [] },
      { id: "TRENGER", navn: "TRENGER", identifiserende: false, pos: [2, 1],
        ledd: [ { entitet: "SCENE", kard: "M", total: false }, { entitet: "OPPGAVE", kard: "N", total: true } ], attr: [] }
    ],
    merknad: "Kontrast: tre binære relasjoner. Ada jobber på Teltet og Månescenen og kan bar og sikkerhet, men modellen sier ikke hvilken oppgave hun har på hvilken scene. Timer har ingen naturlig plass."
  };

  var FIG_FESTIVAL = {
    entiteter: [
      { id: "PLATESELSKAP", navn: "PLATESELSKAP", svak: false, pos: [0, 0],
        attr: [ { navn: "Orgnr", nokkel: true }, { navn: "Navn" } ] },
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [2, 0],
        attr: [ { navn: "Artistnr", nokkel: true }, { navn: "Kunstnernavn", nokkel: true },
                { navn: "Land" }, { navn: "Sjanger", flerverdi: true } ] },
      { id: "KONSERT", navn: "KONSERT", svak: true, pos: [4, 0],
        attr: [ { navn: "Start", delvisNokkel: true }, { navn: "Slutt" },
                { navn: "Varighet", avledet: true, ang: 0 } ] },
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [2, 2],
        attr: [ { navn: "Epost", nokkel: true },
                { navn: "Navn", deler: [ { navn: "Fornavn" }, { navn: "Etternavn" } ] },
                { navn: "Fdato" }, { navn: "Alder", avledet: true } ] },
      { id: "SCENE", navn: "SCENE", svak: false, pos: [4, 2],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Kapasitet" } ] },
      { id: "OPPGAVE", navn: "OPPGAVE", svak: false, pos: [3, 4],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Beskrivelse" } ] }
    ],
    relasjoner: [
      { id: "KONTRAKT", navn: "KONTRAKT", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "ARTIST", kard: "N", total: false },
                { entitet: "PLATESELSKAP", kard: "1", total: true } ], attr: [] },
      { id: "SPILLER", navn: "SPILLER", identifiserende: false, pos: [3, 0],
        ledd: [ { entitet: "ARTIST", kard: "M", total: false },
                { entitet: "KONSERT", kard: "N", total: true } ],
        attr: [ { navn: "Honorar" } ] },
      { id: "PA", navn: "PÅ", identifiserende: true, pos: [4, 1],
        ledd: [ { entitet: "SCENE", kard: "1", total: false },
                { entitet: "KONSERT", kard: "N", total: true } ], attr: [] },
      { id: "SJEF", navn: "SJEF", identifiserende: false, pos: [3, 2],
        ledd: [ { entitet: "SCENE", kard: "1", total: true },
                { entitet: "FRIVILLIG", kard: "1", total: false } ], attr: [] },
      { id: "VAKT", navn: "VAKT", identifiserende: false, pos: [3, 3],
        ledd: [ { entitet: "FRIVILLIG", kard: "M", total: false },
                { entitet: "SCENE", kard: "N", total: false },
                { entitet: "OPPGAVE", kard: "1", total: true } ],
        attr: [ { navn: "Timer" } ] }
    ],
    merknad: "Gjennomgående eksempel. Realiseres i blokk 2. Antakelse: artister og frivillige trenger ikke delta i SPILLER, SJEF eller VAKT."
  };

  var FIG_KRYPTO = {
    entiteter: [
      { id: "GLIM", navn: "GLIM", svak: false, pos: [0, 0],
        attr: [ { navn: "Zap", nokkel: true }, { navn: "Wox", flerverdi: true } ] },
      { id: "FASK", navn: "FASK", svak: false, pos: [2, 0],
        attr: [ { navn: "Kod", nokkel: true, ang: 10, deler: [ { navn: "Ka" }, { navn: "Kb" } ] },
                { navn: "Lum", ang: -90 } ] },
      { id: "TROD", navn: "TROD", svak: true, pos: [0, 1.8],
        attr: [ { navn: "Nib", delvisNokkel: true }, { navn: "Pek", avledet: true } ] }
    ],
    relasjoner: [
      { id: "SKAV", navn: "SKAV", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "GLIM", kard: "M", total: true },
                { entitet: "FASK", kard: "N", total: false } ],
        attr: [ { navn: "Dut", ang: -90 } ] },
      { id: "BRIN", navn: "BRIN", identifiserende: true, pos: [0, 0.9],
        ledd: [ { entitet: "GLIM", kard: "1", total: false },
                { entitet: "TROD", kard: "N", total: true } ], attr: [] },
      { id: "VOLP", navn: "VOLP", identifiserende: false, pos: [2, 1.8],
        ledd: [ { entitet: "TROD", kard: "1", total: false },
                { entitet: "FASK", kard: "1", total: true } ], attr: [] }
    ],
    merknad: "Øvingsdiagram med meningsløse navn, laget for guiden."
  };

  /* ---------- Stegene i «Fra tekst til diagram» (bygger FIG_FESTIVAL opp) ----------
     Hvert steg velger et delsett av FIG_FESTIVAL:
       ent:   entiteter som er med (id-er)
       attr:  entiteter som har fått attributtene sine
       rel:   relasjoner som er tegnet
       kard:  relasjoner som har fått kardinalitet og deltakelse
       relAttr: relasjoner som har fått relasjonsattributtet */
  var STERKE = ["PLATESELSKAP", "ARTIST", "FRIVILLIG", "SCENE", "OPPGAVE"];
  var ALLE = STERKE.concat(["KONSERT"]);

  function del(sel) {
    function has(list, id) { return (list || []).indexOf(id) >= 0; }
    return {
      entiteter: FIG_FESTIVAL.entiteter.filter(function (e) { return has(sel.ent, e.id); }).map(function (e) {
        return { id: e.id, navn: e.navn, svak: e.svak, pos: e.pos, attr: has(sel.attr, e.id) ? e.attr : [] };
      }),
      relasjoner: FIG_FESTIVAL.relasjoner.filter(function (r) { return has(sel.rel, r.id); }).map(function (r) {
        var full = has(sel.kard, r.id);
        return { id: r.id, navn: r.navn, identifiserende: r.identifiserende, pos: r.pos,
          ledd: r.ledd.map(function (l) { return full ? l : { entitet: l.entitet }; }),
          attr: has(sel.relAttr, r.id) ? r.attr : [] };
      })
    };
  }

  var FESTIVAL_STEG = [
    { tag: "Steg 1 · entiteter",
      sel: { ent: STERKE },
      text: {
        eli5: "Først ringer vi rundt <b>tingene</b> i teksten: artister, plateselskaper, scener, frivillige og oppgaver. Hver ting blir en boks. Alle har noe unikt som skiller dem fra hverandre.",
        normal: "Entitetene er ARTIST, PLATESELSKAP, SCENE, FRIVILLIG og OPPGAVE. Alle har en egen nøkkel (pkt. 1, 2, 3, 6 og 8), så de tegnes som vanlige rektangler.",
        teknisk: "Vi tar med de substantivene som har egen identitet og egne egenskaper: ARTIST, PLATESELSKAP, SCENE, FRIVILLIG og OPPGAVE. Hver har en nøkkel som er unik alene (pkt. 1, 2, 3, 6, 8), og er derfor en vanlig (sterk) entitetstype."
      } },
    { tag: "Steg 2 · svak entitet?",
      sel: { ent: STERKE },
      text: {
        eli5: "Konserter er også ting, men starttidspunktet er bare unikt <i>på én scene</i>. To scener kan ha konsert kl. 20. Konserten trenger scenen for å bli unik, så vi venter med den til slutt.",
        normal: "KONSERT har ingen egen nøkkel: starttidspunktet er «bare unikt på den scenen» (pkt. 4). Den er altså svak. Etter kursets rekkefølge tegnes den til slutt, når den identifiserende entiteten SCENE er på plass.",
        teknisk: "Pkt. 4 sier at Start bare er unik innenfor en scene. Det gjør KONSERT til en svak entitet med SCENE som identifiserende entitet. Vi utsetter den, slik at både SCENE og den identifiserende relasjonen er tegnet når den svake nøkkelen skal fullføres."
      } },
    { tag: "Steg 3 · attributter (ARTIST)",
      sel: { ent: STERKE, attr: ["ARTIST"] },
      text: {
        eli5: "Nå skriver vi det som står på artistens «kort». Nummeret og kunstnernavnet er begge unike, så begge får strek under. En artist kan ha flere sjangre, så sjanger får en dobbel ring.",
        normal: "ARTIST: Artistnr og Kunstnernavn understrekes <b>hver for seg</b> («unikt … og unikt …»), Sjanger blir dobbel oval («én eller flere sjangre»), Land er et vanlig attributt (pkt. 1).",
        teknisk: "To uavhengige nøkler gir to understrekede ovaler, ikke én sammensatt nøkkel: hver verdi identifiserer artisten alene. Sjanger er et flerverdiattributt og kan derfor ikke være nøkkel (pkt. 1)."
      } },
    { tag: "Steg 3 · attributter (resten)",
      sel: { ent: STERKE, attr: STERKE },
      text: {
        eli5: "Den frivilliges navn har to biter, fornavn og etternavn, så det deler seg i to små ringer. Alderen kan vi regne ut fra fødselsdatoen, så den tegnes med stiplet ring.",
        normal: "FRIVILLIG: Epost understreket, Navn sammensatt av Fornavn og Etternavn («består av»), Fdato vanlig og Alder stiplet («kan regnes ut», pkt. 6). PLATESELSKAP, SCENE og OPPGAVE får nøkkel og ett vanlig attributt hver (pkt. 2, 3, 8).",
        teknisk: "Det sammensatte attributtet Navn er ikke nøkkel, så ingen av ovalene understrekes. Alder er utledbar fra Fdato og dagens dato. Diagrammet sier ikke hvordan, bare <i>at</i> den kan utledes (pkt. 6)."
      } },
    { tag: "Steg 4 · relasjoner",
      sel: { ent: STERKE, attr: STERKE, rel: ["KONTRAKT", "SJEF", "VAKT"], relAttr: ["VAKT"] },
      text: {
        eli5: "Så tegner vi <b>forholdene</b> som romber: artister har kontrakt med plateselskaper, en frivillig er sjef for en scene, og en vakt binder sammen hvem, hvor og hva. Timene gjelder hele vakten, så de henger på romben.",
        normal: "KONTRAKT (ARTIST–PLATESELSKAP, pkt. 2), SJEF (SCENE–FRIVILLIG, pkt. 7) og VAKT, som er <b>ternær</b> fordi pkt. 8 snakker om frivillig, scene og oppgave samtidig («gitt … og …»). Timer er et relasjonsattributt på VAKT. SPILLER kommer når KONSERT er tegnet.",
        teknisk: "VAKT er ternær, ikke tre binære: skrankene i pkt. 8 handler om kombinasjoner av to deltakere, og Timer avhenger av hele trippelen. SPILLER (pkt. 5) går til den svake KONSERT og tegnes derfor sammen med den."
      } },
    { tag: "Steg 5 · KONTRAKT",
      sel: { ent: STERKE, attr: STERKE, rel: ["KONTRAKT", "SJEF", "VAKT"], relAttr: ["VAKT"], kard: ["KONTRAKT"] },
      text: {
        eli5: "En artist kan bare ha ett plateselskap, så vi skriver 1 ved plateselskapet. Et plateselskap kan ha mange artister, så N ved artisten. Plateselskapene <i>må</i> ha minst én artist, så deres strek blir dobbel.",
        normal: "1 ved PLATESELSKAP («høyst ett»), N ved ARTIST («mange»), dobbel strek ved PLATESELSKAP («vi lagrer bare plateselskaper som har minst én artist», pkt. 2). Streken ved ARTIST er enkel.",
        teknisk: "Øvre skranke for ARTIST står på motpartens strek: 1 ved PLATESELSKAP. Nedre skranke for PLATESELSKAP står på dens egen strek: dobbel = total deltakelse (pkt. 2)."
      } },
    { tag: "Steg 5 · SJEF",
      sel: { ent: STERKE, attr: STERKE, rel: ["KONTRAKT", "SJEF", "VAKT"], relAttr: ["VAKT"], kard: ["KONTRAKT", "SJEF"] },
      text: {
        eli5: "Hver scene har nøyaktig én sjef. Det er to ting: høyst én (1 ved den frivillige) og minst én (dobbel strek ved scenen). En frivillig kan være sjef for høyst én scene, så 1 ved scenen også.",
        normal: "1 ved begge, dobbel strek ved SCENE («nøyaktig én scenesjef», «høyst én scene», pkt. 7). Streken ved FRIVILLIG er enkel: en frivillig trenger ikke være sjef.",
        teknisk: "«Nøyaktig én» er to skranker: øvre (1 ved FRIVILLIG) og nedre (total deltakelse for SCENE). Begge retninger har høyst én, så relasjonen er 1:1 (pkt. 7)."
      } },
    { tag: "Steg 5 · VAKT",
      sel: { ent: STERKE, attr: STERKE, rel: ["KONTRAKT", "SJEF", "VAKT"], relAttr: ["VAKT"], kard: ["KONTRAKT", "SJEF", "VAKT"] },
      text: {
        eli5: "For en vakt holder vi to ting fast og teller den tredje. En frivillig på én scene har bare én oppgave der, så 1 ved oppgaven. De andre kan være mange. Alle oppgaver er brukt, så oppgavens strek blir dobbel.",
        normal: "1 ved OPPGAVE, N ved SCENE, M ved FRIVILLIG og dobbel strek ved OPPGAVE. Tallene kommer fra de tre «gitt»-setningene, og den doble streken fra «alle oppgaver er brukt i minst én vakt» (pkt. 8).",
        teknisk: "I en ternær relasjon sier tallet ved E hvor mange E det kan være gitt én kombinasjon av de to andre. 1 ved OPPGAVE uttrykker at (frivillig, scene) bestemmer oppgaven. Total deltakelse for OPPGAVE kommer fra siste krav i pkt. 8."
      } },
    { tag: "Steg 6 · den svake entiteten",
      sel: { ent: ALLE, attr: ALLE, rel: ["KONTRAKT", "SJEF", "VAKT", "PA"], relAttr: ["VAKT"], kard: ["KONTRAKT", "SJEF", "VAKT", "PA"] },
      text: {
        eli5: "Nå kommer konserten. Den får dobbel boks fordi den trenger scenen, og starttidspunktet får stiplet strek under. Den doble romben PÅ viser hvilken scene som gjør konserten unik.",
        normal: "KONSERT: dobbelt rektangel, Start med stiplet understrek, Slutt vanlig og Varighet stiplet oval. PÅ er dobbel rombe med 1 ved SCENE og N og dobbel strek ved KONSERT. Streken ved SCENE er enkel: «trenger ikke ha noen» (pkt. 4).",
        teknisk: "Den identifiserende relasjonen har låst form: 1 ved den identifiserende entiteten og total deltakelse for den svake. Full nøkkel for KONSERT blir (Scene.Navn, Start). Nøkkelen til SCENE legges <i>ikke</i> inn som attributt i ER, den kommer først ved realiseringen (pkt. 4)."
      } },
    { tag: "Steg 6 · SPILLER",
      sel: { ent: ALLE, attr: ALLE, rel: ["KONTRAKT", "SJEF", "VAKT", "PA", "SPILLER"], relAttr: ["VAKT", "SPILLER"], kard: ["KONTRAKT", "SJEF", "VAKT", "PA", "SPILLER"] },
      text: {
        eli5: "Til slutt kobler vi artister og konserter. En konsert må ha minst én artist (dobbel strek ved konserten), og en artist kan spille mange konserter. Honoraret gjelder én artist på én konsert, så det henger på romben.",
        normal: "SPILLER: M ved ARTIST, N ved KONSERT, dobbel strek ved KONSERT («minst én artist»). Honorar er et relasjonsattributt fordi det gjelder paret (artist, konsert) (pkt. 5).",
        teknisk: "Honorar avhenger av kombinasjonen (artist, konsert), ikke av noen av dem alene. Derfor står det på romben. På ARTIST ville det mistet koblingen til konserten (pkt. 5)."
      } },
    { tag: "Ferdig · antakelser",
      sel: { ent: ALLE, attr: ALLE, rel: ["KONTRAKT", "SJEF", "VAKT", "PA", "SPILLER"], relAttr: ["VAKT", "SPILLER"], kard: ["KONTRAKT", "SJEF", "VAKT", "PA", "SPILLER"] },
      text: {
        eli5: "Sjekk til slutt at hver strek har et tall, og at du har bestemt om hver strek er enkel eller dobbel. Der teksten ikke sier noe, skriver du ned hva du har antatt.",
        normal: "Sjekk hver relasjon: tall på begge strekene og et valg om enkel eller dobbel strek på begge sider. Antakelse ved figuren: «Teksten krever ikke at artister og frivillige deltar i noe, så strekene ved dem er enkle.»",
        teknisk: "Kontrollen til slutt: hvert element skal kunne pekes tilbake på en formulering i teksten. Der teksten er taus, velges partiell deltakelse og antakelsen skrives kort ved figuren, med henvisning til punktet."
      } }
  ];
  FESTIVAL_STEG.forEach(function (s) { s.fig = del(s.sel); });

  /* ---------- Flervalg (per fane) ---------- */
  var QUIZ = {
    notasjon: [
      { q: "Hvordan tegnes «hver scene har <b>nøyaktig én</b> scenesjef» i SJEF (SCENE–FRIVILLIG)?",
        options: ["1 ved FRIVILLIG og enkel strek ved SCENE.",
                  "1 ved FRIVILLIG og dobbel strek ved SCENE.",
                  "1 ved SCENE og dobbel strek ved FRIVILLIG.",
                  "Tallet 1 alene ved SCENE."],
        answer: 1,
        explain: "«Nøyaktig én» er to skranker: høyst én (1 på motpartens strek, altså ved FRIVILLIG) og minst én (dobbel strek ved scenen selv). 1 alene betyr bare «høyst én».",
        kilde: K("lysarket om ER-relasjoner s. 3–4") }
    ],
    attributter: [
      { q: "«En frivillig har både en unik e-post og et unikt mobilnummer.» Hvordan tegnes nøklene?",
        options: ["Én oval «Kontakt» med barna Epost og Mobil, der Kontakt er understreket.",
                  "To ovaler, Epost og Mobil, begge understreket.",
                  "Epost understreket og Mobil som dobbel oval.",
                  "Bare Epost understreket, fordi en entitet bare kan ha én nøkkel."],
        answer: 1,
        explain: "Hver av dem er unik alene, og det er to nøkler. A ville bety at bare paret er unikt. I ER kan en entitet ha flere nøkler (valget av primærnøkkel kommer først ved realiseringen).",
        kilde: K("ER-notat s. 7") }
    ],
    relasjoner: [
      { q: "I KONTRAKT står 1 ved PLATESELSKAP og N ved ARTIST, med dobbel strek ved PLATESELSKAP. Hva følger av diagrammet?",
        options: ["Et plateselskap har høyst én artist.",
                  "En artist har høyst ett plateselskap.",
                  "Hver artist må ha et plateselskap.",
                  "Et plateselskap kan lagres uten artister."],
        answer: 1,
        explain: "Tallet ved PLATESELSKAP teller plateselskaper per artist. Den doble streken gjelder PLATESELSKAP, så C og D er feil.",
        kilde: K("lysarket om ER-relasjoner s. 3–4") }
    ],
    svake: [
      { q: "«En konsert har et starttidspunkt som bare er unikt på den scenen den går på.» Hvilken tegning er riktig?",
        options: ["KONSERT i vanlig rektangel med Start understreket.",
                  "KONSERT i dobbelt rektangel, Start med stiplet understrek, dobbel rombe til SCENE, 1 ved SCENE og dobbel strek ved KONSERT.",
                  "KONSERT i dobbelt rektangel, vanlig rombe til SCENE.",
                  "SCENE i dobbelt rektangel, fordi konsertene er avhengige av den."],
        answer: 1,
        explain: "Det er den svake entiteten som får dobbel boks og stiplet nøkkel, og relasjonen til den identifiserende entiteten skal være en dobbel rombe. C mangler den identifiserende relasjonen (−1 hos sensor).",
        kilde: K("lysarket om svake entiteter s. 3–5") }
    ],
    ternaere: [
      { q: "I VAKT står 1 ved OPPGAVE, N ved SCENE og M ved FRIVILLIG. Hvilken påstand følger?",
        options: ["En frivillig har høyst én oppgave totalt.",
                  "En scene har høyst én frivillig per oppgave.",
                  "Gitt en frivillig og en scene finnes høyst én oppgave.",
                  "En oppgave kan bare brukes på én scene."],
        answer: 2,
        explain: "I en ternær relasjon sier tallet ved E hvor mange E det kan være gitt én kombinasjon av de to andre. 1 ved OPPGAVE holder (frivillig, scene) fast.",
        kilde: K("lysarket om ternære relasjoner s. 2–5") }
    ],
    "tekst-til-diagram": [
      { q: "«En konsert har minst én artist, og en artist kan spille på mange konserter.» Hvor skal den doble streken stå i SPILLER?",
        options: ["Ved ARTIST.", "Ved KONSERT.", "Ved begge.", "Ingen steder, «minst én» uttrykkes med tallet 1."],
        answer: 1,
        explain: "Det er konsertene som <i>må</i> delta. Nedre skranke vises med strektypen ved den entiteten som må delta, ikke med et tall.",
        kilde: K("lysarket om ER-relasjoner s. 4") }
    ],
    eer: [
      { q: "<span class=\"mono\">Gjest = {1,2,3,4}</span>, <span class=\"mono\">Vip = {1,2}</span>, <span class=\"mono\">Presse = {2,3}</span>. Hvilken kombinasjon av krav tillater instansen?",
        options: ["Total og disjunkt.", "Total og overlappende.", "Partiell og disjunkt.", "Partiell og overlappende."],
        answer: 3,
        explain: "Gjest 2 er i begge subklassene (ikke disjunkt), og gjest 4 er i ingen (ikke total).",
        kilde: K("lysarket om uttrykkskraft s. 4–9") }
    ]
  };

  /* ---------- Sant/usant for hele blokken ---------- */
  var TF = [
    { s: "Et flerverdiattributt kan være nøkkel.", answer: false, blokk: "attributter",
      explain: "Én entitet har flere verdier, så verdien kan ikke identifisere den.", kilde: K("lysarket om ER-entiteter s. 7") },
    { s: "Et attributt på en relasjon kan være nøkkel.", answer: false, blokk: "relasjoner",
      explain: "Relasjonsattributter kan aldri være nøkler.", kilde: K("lysarket om ER-relasjoner s. 5") },
    { s: "En stiplet oval viser hvordan verdien regnes ut.", answer: false, blokk: "attributter",
      explain: "Den sier bare at verdien kan utledes, ikke hvordan.", kilde: K("lysarket om ER-entiteter s. 6–9") },
    { s: "Dobbel strek ved E betyr at hver E må være med i relasjonen minst én gang.", answer: true, blokk: "notasjon",
      explain: "Dobbel strek er total deltakelse, altså minst én.", kilde: K("lysarket om ER-relasjoner s. 4") },
    { s: "«Nøyaktig én» tegnes med 1 alene.", answer: false, blokk: "notasjon",
      explain: "Det krever også dobbel strek ved entiteten selv. 1 alene betyr «høyst én».", kilde: K("lysarket om ER-relasjoner s. 3–4") },
    { s: "En svak entitet har alltid total deltakelse i den identifiserende relasjonen.", answer: true, blokk: "svake",
      explain: "Den kan ikke finnes uten den identifiserende entiteten.", kilde: K("lysarket om svake entiteter s. 3–5") },
    { s: "En svak entitet kan bare ha én identifiserende entitet.", answer: false, blokk: "svake",
      explain: "Den kan ha flere identifiserende entiteter og flere nivåer.", kilde: K("lysarket om svake entiteter s. 5") },
    { s: "En ternær relasjon kan alltid byttes ut med tre binære uten at noe går tapt.", answer: false, blokk: "ternaere",
      explain: "Da går kombinasjonen av de tre tapt.", kilde: K("lysarket om ternære relasjoner s. 7") },
    { s: "Hver forekomst av en ternær relasjon relaterer nøyaktig tre entiteter.", answer: true, blokk: "ternaere",
      explain: "En ternær relasjon relaterer alltid tre entiteter samtidig.", kilde: K("lysarket om ternære relasjoner s. 2–5") },
    { s: "Kurset bruker tall som 2 eller 5 for kardinalitet når teksten sier det.", answer: false, blokk: "notasjon",
      explain: "Kurset skiller bare mellom 1 og mange (en bokstav som N eller M).", kilde: K("lysarket om ER-relasjoner s. 3–4") },
    { s: "Når en konto kan være både til-konto og fra-konto, bør KONTO deles i to entiteter.", answer: false, blokk: "relasjoner",
      explain: "Bruk én entitet med to relasjoner (eller én rekursiv). Sensor trakk 2 poeng for oppdelingen i H2023.", kilde: false },
    { s: "I en sammensatt nøkkel er hver del unik for seg.", answer: false, blokk: "attributter",
      explain: "Bare kombinasjonen av delene er unik.", kilde: K("ER-notat s. 7") }
  ];

  /* ---------- JA/NEI på FIG_KRYPTO ---------- */
  var LESE = [
    { s: "En TROD er unikt identifisert av sin Nib-verdi alene.", answer: false,
      explain: "Nib har stiplet understrek og TROD er svak: nøkkelen er GLIM sin Zap + Nib." },
    { s: "Hver TROD er BRIN-relatert til nøyaktig én GLIM.", answer: true,
      explain: "Dobbel strek ved TROD (minst én) og 1 ved GLIM (høyst én)." },
    { s: "En GLIM kan være BRIN-relatert til mange TROD.", answer: true,
      explain: "N står ved TROD." },
    { s: "Hver GLIM er SKAV-relatert til minst én FASK.", answer: true,
      explain: "Dobbel strek ved GLIM i SKAV." },
    { s: "Én FASK kan være SKAV-relatert til mange GLIM.", answer: true,
      explain: "M står ved GLIM." },
    { s: "Hver FASK er SKAV-relatert til minst én GLIM.", answer: false,
      explain: "Enkel strek ved FASK i SKAV." },
    { s: "Dut er en egenskap ved FASK alene.", answer: false,
      explain: "Dut henger på romben SKAV og gjelder paret (GLIM, FASK)." },
    { s: "En TROD kan være VOLP-relatert til to ulike FASK.", answer: false,
      explain: "1 står ved FASK. Påstanden teller FASK-er per TROD, så det er tallet ved FASK som avgjør." },
    { s: "Dersom det finnes en FASK i databasen, finnes det også en GLIM.", answer: true,
      explain: "Dobbel strek ved FASK i VOLP gir en TROD, og en TROD krever en GLIM (svak entitet, identifiserende relasjon)." },
    { s: "To ulike FASK kan ha samme Ka-verdi.", answer: true,
      explain: "Kod er en sammensatt nøkkel. Bare kombinasjonen (Ka, Kb) er unik." },
    { s: "En GLIM kan ha flere Wox-verdier.", answer: true,
      explain: "Wox er tegnet som dobbel oval (flerverdi)." },
    { s: "Diagrammet viser hvordan Pek regnes ut.", answer: false,
      explain: "Stiplet oval sier bare <i>at</i> Pek kan utledes." }
  ];

  IN.dataEr = {
    fig: {
      tegneforklaring: FIG_TEGNEFORKLARING,
      attributter: FIG_ATTRIBUTTER,
      relasjoner: FIG_RELASJONER,
      sjef: FIG_SJEF,
      svak: FIG_SVAK,
      ternaer: FIG_TERNAER,
      treBinaere: FIG_TRE_BINAERE,
      festival: FIG_FESTIVAL,
      krypto: FIG_KRYPTO
    },
    festivalSteg: FESTIVAL_STEG,
    quiz: QUIZ,
    tf: TF,
    lese: LESE
  };
})();
