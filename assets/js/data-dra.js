/* ============================================================
   IN2090 guide · data-dra.js
   Dra-og-slipp-øvinger for blokk 1, 2, 4, 5, 6 og 7 (plan/interaktive-ovinger.md del D).
   IN.DRA_OVINGER[side] = [øving, …]   side = "er" | "realisering" | "sql" | "sql-videre" | "fd" | "normalisering"
   IN.draOvinger(host, side, opts?)    tegner alle øvingene for en side og returnerer handlene.

   Alt fagstoff er formulert med egne ord (plan/innhold/01, 02, 04, 05, 06, 07). Festivalen,
   biblioteket og Billett er guidens egne eksempler. Kildelinjene peker på lysark og eksamen,
   aldri med ordrett tekst. Feltet «sitat» brukes ikke.
   FD- og NF-øvingene rettes av FD-motoren IN.fd (data-fd.js) når den er lastet. Uten motoren
   brukes den faste fasiten, og plan/verktoy/test-dra.js sjekker at de to er like.
   Klassisk script. Lastes etter dra.js (og etter data-fd.js på blokk 6 og 7).
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  function K(ref) { return { ref: ref, egneOrd: true }; }
  function m(s) { return '<span class="mono">' + s + "</span>"; }

  /* Fasit fra motoren når den finnes, ellers den faste. */
  function medMotor(fast, beregn) {
    return function () {
      try { if (IN.fd && IN.fd.keys) { var r = beregn(IN.fd); if (r) return r; } } catch (e) { if (window.console) console.error("[data-dra] motor", e); }
      return fast;
    };
  }

  /* ================================================================
     Blokk 1 · ER
     ================================================================ */
  var ER_TEKST = {
    id: "er-tekst", mode: "bucket", tittel: "Fra tekst til diagram: hva blir hva?",
    intro: "<p>Første steg på ER-oppgaven er å sortere ordene i kravteksten. Ting med egen identitet blir entiteter, egenskaper blir attributter, og forhold mellom ting blir relasjoner. Noe i teksten skal ikke modelleres i det hele tatt.</p>",
    prompt: '<div class="callout eksempel"><span class="lbl">Kravtekst</span><p>Ledelsen vil ha en database for festivalen. En artist har et unikt artistnummer og spiller innenfor én eller flere sjangre. Et plateselskap har et unikt organisasjonsnummer, og en artist har kontrakt med høyst ett plateselskap. En konsert går på én scene og har et starttidspunkt og et sluttidspunkt, og varigheten kan regnes ut. Artister spiller på konserter, og vi lagrer honoraret artisten får for konserten.</p></div><p>Legg hvert ord eller uttrykk i bøtta for det det blir i ER-modellen.</p>',
    zones: [
      { id: "ent", label: "Entitet", hint: "rektangel" },
      { id: "attr", label: "Attributt", hint: "oval" },
      { id: "rel", label: "Relasjon", hint: "rombe" },
      { id: "ikke", label: "Modelleres ikke" }
    ],
    items: [
      { id: "artist", html: "artist", explain: "<p>Har egen identitet (unikt artistnummer) og egne egenskaper. Blir entiteten ARTIST.</p>" },
      { id: "honorar", html: "honoraret", explain: "<p>Et attributt, men ikke på ARTIST eller KONSERT. Honoraret gjelder <i>paret</i> artist og konsert, så det henges på romben SPILLER som relasjonsattributt.</p>" },
      { id: "festival", html: "festivalen", explain: "<p>Hele databasen handler om denne ene festivalen. Det finnes ingen forekomster å skille mellom og ingenting å lagre om den, så den blir verken entitet eller attributt.</p>" },
      { id: "kontrakt", html: "har kontrakt med", explain: "<p>Et forhold mellom to entiteter (artist og plateselskap). Blir relasjonen KONTRAKT, med 1 ved PLATESELSKAP fordi en artist har høyst ett.</p>" },
      { id: "sjanger", html: "sjanger", explain: "<p>En egenskap ved artisten. «Én eller flere» gjør den til et <b>flerverdiattributt</b> (dobbel oval).</p>" },
      { id: "konsert", html: "konsert", explain: "<p>Har egne egenskaper (start, slutt) og deltar i relasjoner. Blir en entitet. I det fulle eksempelet er den svak, fordi starttidspunktet bare er unikt på scenen.</p>" },
      { id: "artistnr", html: "artistnummer", explain: "<p>En egenskap ved artisten. «Unikt» gjør det til et <b>nøkkelattributt</b> (understreket).</p>" },
      { id: "spiller", html: "spiller på", explain: "<p>Et forhold mellom artist og konsert. Blir relasjonen SPILLER, og det er her honoraret havner.</p>" },
      { id: "ledelse", html: "ledelsen", explain: "<p>Ledelsen er den som bestiller databasen. Teksten ber ikke om å lagre noe om den, så den modelleres ikke.</p>" },
      { id: "plateselskap", html: "plateselskap", explain: "<p>Har egen nøkkel (organisasjonsnummer). Blir entiteten PLATESELSKAP.</p>" },
      { id: "varighet", html: "varigheten", explain: "<p>Den kan regnes ut fra start og slutt, men skal likevel tegnes: som et <b>utledbart attributt</b> (stiplet oval). Først i realiseringen droppes den.</p>" }
    ],
    answer: { artist: "ent", plateselskap: "ent", konsert: "ent", artistnr: "attr", sjanger: "attr", honorar: "attr", varighet: "attr",
      kontrakt: "rel", spiller: "rel", festival: "ikke", ledelse: "ikke" },
    oppsummering: "<p>Kursets fremgangsmåte: finn entitetene først, så attributtene (med nøkler, flerverdi, sammensatte og utledbare), så relasjonene og relasjonsattributtene. Hvert valg skal kunne begrunnes med en formulering i teksten.</p>",
    kilde: [K("ER-notatet s. 4 (fremgangsmåten)"), K("F05-01 lysark 4–9 (attributtyper)")]
  };

  /* ================================================================
     Blokk 2 · Realisering
     ================================================================ */
  var REAL_FN = {
    id: "real-fn", mode: "bucket", tittel: "Plasser fremmednøkkelen",
    intro: "<p>Festivaldiagrammet fra blokk 1 er under realisering. Tabellene for entitetene finnes allerede. For hver relasjon (og flerverdiattributtet): hvilken tabell får fremmednøkkelen, eller trengs det en ny tabell? Målet er færrest mulig tabeller og færrest mulig NULL-verdier.</p>",
    prompt: "<p>Tabeller som finnes: " + m("Plateselskap(Orgnr, Navn)") + ", " + m("Artist(Artistnr, Kunstnernavn, Land)") + ", " + m("Scene(Navn, Kapasitet)") + ", " + m("Konsert(Start, Slutt)") + " (svak, eier: SCENE) og " + m("Frivillig(Epost, Fornavn, Etternavn, Fdato)") + ".</p>",
    render: function (node) {
      if (!IN.vizEr || !IN.dataReal || !IN.dataReal.fig || !IN.dataReal.fig.festival) return;
      var d = IN.el("details", { class: "dra-fig" }, [IN.el("summary", { text: "Vis ER-diagrammet" })]);
      var h = IN.el("div");
      d.appendChild(h);
      node.appendChild(d);
      try { IN.vizEr(h, IN.dataReal.fig.festival, { title: "Festivalen" }); } catch (e) { node.removeChild(d); }
    },
    zones: [
      { id: "plateselskap", label: "Plateselskap" },
      { id: "artist", label: "Artist" },
      { id: "scene", label: "Scene" },
      { id: "konsert", label: "Konsert" },
      { id: "frivillig", label: "Frivillig" },
      { id: "ny", label: "Ny tabell" }
    ],
    items: [
      { id: "spiller", html: "SPILLER: ARTIST M – N KONSERT, med Honorar",
        explain: "<p>M:N gir alltid egen tabell: " + m("Spiller(Artist, Scene, Start, Honorar)") + " med PN = alle FN-attributtene. Honorar blir en vanlig kolonne der. En FN i Artist eller Konsert ville bare hatt plass til én verdi.</p>" },
      { id: "kontrakt", html: "KONTRAKT: ARTIST N – 1 PLATESELSKAP",
        explain: "<p>1:N gir FN på N-siden: kolonnen " + m("Plateselskap") + " i Artist, med " + m("FN: (Plateselskap) -> Plateselskap(Orgnr)") + ". Det sparer en tabell, mot NULL for artister uten kontrakt. Egen tabell er også en lovlig realisering (ingen NULL, én tabell mer). Begrunn valget.</p>" },
      { id: "sjanger", html: "Sjanger: flerverdiattributt på ARTIST",
        explain: "<p>Flerverdiattributter får alltid egen tabell: " + m("Sjanger(Artist, Sjanger)") + " med KN = alle attributtene og FN til Artist. En kolonne i Artist kan bare holde én verdi.</p>" },
      { id: "pa", html: "PÅ: identifiserende, SCENE 1 – N KONSERT",
        explain: "<p>KONSERT er svak, så tabellen får eierens PN som FN: " + m("Konsert(Scene, Start, Slutt)") + " med PN " + m("{Scene, Start}") + ". Den identifiserende relasjonen er ferdig realisert gjennom denne FN-en og skal ikke realiseres en gang til (H2020 trakk for det).</p>" },
      { id: "vakt", html: "VAKT: FRIVILLIG – SCENE – OPPGAVE (ternær)",
        explain: "<p>Ternære relasjoner gir alltid egen tabell med FN til alle tre. Med 1 ved OPPGAVE bestemmer frivillig og scene oppgaven, så KN blir " + m("{Frivillig, Scene}") + ".</p>" },
      { id: "sjef", html: "SJEF: SCENE 1 – 1 FRIVILLIG, dobbel strek ved SCENE",
        explain: "<p>1:1 med total deltakelse ved SCENE: legg FN-en " + m("Sjef") + " i Scene. Hver scene har nøyaktig én sjef, så det blir ingen NULL, og kolonnen er også en KN. I Frivillig ville de fleste radene fått NULL, og sammenslåing krever total deltakelse på begge sider.</p>" }
    ],
    answer: { kontrakt: "artist", pa: "konsert", sjef: "scene", spiller: "ny", sjanger: "ny", vakt: "ny" },
    godta: { kontrakt: ["ny"] },
    oppsummering: "<p>Huskeregel: FN havner der det står N (1:N) eller på den totale siden (1:1). M:N, flerverdiattributter og ternære relasjoner gir alltid ny tabell. Skriv én setning om hvorfor for hvert valg, for eksamen gir poeng for begrunnelsen.</p>",
    kilde: [K("Realiseringsnotatet (realiseringh26), algoritmen"), K("F06-02 (realisering)")]
  };

  var REAL_KONSTR = {
    id: "real-konstr", mode: "match", tittel: "ER-konstruksjon → hva den blir",
    intro: "<p>Realiseringsalgoritmen har én fast regel for hver byggekloss i ER-diagrammet. Kan du dem, går resten av oppgaven av seg selv.</p>",
    prompt: "<p>Koble hver ER-konstruksjon til det den blir i relasjonsskjemaet.</p>",
    poolLabel: "Resultater",
    zones: [
      { id: "ent", label: "Vanlig entitet" },
      { id: "svak", label: "Svak entitet" },
      { id: "en-n", label: "1:N-relasjon" },
      { id: "m-n", label: "M:N-relasjon" },
      { id: "fler", label: "Flerverdiattributt" },
      { id: "tern", label: "Ternær relasjon med 1 ved én side" },
      { id: "utl", label: "Utledbart attributt" },
      { id: "sam", label: "Sammensatt attributt" }
    ],
    items: [
      { id: "r-fler", html: "Egen tabell der KN er alle attributtene, med FN til entiteten",
        explain: "<p>Én rad per verdi. Siden én entitet har flere verdier, trengs både entitetens nøkkel og verdien for å skille radene, så KN blir alle attributtene.</p>" },
      { id: "r-utl", html: "Droppes",
        explain: "<p>Verdien kan regnes ut fra andre kolonner, så den lagres ikke. Den skal likevel tegnes i ER-diagrammet (stiplet oval).</p>" },
      { id: "r-en-n", html: "FN i tabellen på N-siden",
        explain: "<p>Hver rad på N-siden har høyst én partner, så én kolonne holder. Alternativet er egen tabell med PN = N-sidens PN.</p>" },
      { id: "r-ent", html: "Egen tabell; nøklene blir KN og én av dem PN",
        explain: "<p>Hver vanlig entitet blir en tabell. Hver nøkkel i diagrammet blir en KN, og du velger én som PN.</p>" },
      { id: "r-tern", html: "Egen tabell; FN-ene til de to andre sidene utgjør en KN",
        explain: "<p>Står det 1 ved én side, bestemmer de to andre sammen den siste. Derfor er FN-ene til de to andre sidene nok som KN.</p>" },
      { id: "r-svak", html: "Egen tabell med PN = eierens PN + svak nøkkel, og FN til eieren",
        explain: "<p>Den svake nøkkelen er bare unik innenfor eieren, så eierens PN må med. Den identifiserende relasjonen er ferdig med det.</p>" },
      { id: "r-sam", html: "Bare bladnodene blir kolonner",
        explain: "<p>Forelderen (for eksempel Navn) blir ikke en egen kolonne. Barna (Fornavn, Etternavn) blir det.</p>" },
      { id: "r-m-n", html: "Egen tabell der PN består av FN-ene til begge sidene",
        explain: "<p>Hver side kan ha mange partnere, så forholdet må ha egne rader. Et par kan bare forekomme én gang, så PN = begge FN-ene. Relasjonsattributter blir vanlige kolonner, aldri del av nøkkelen.</p>" }
    ],
    answer: { "r-ent": "ent", "r-svak": "svak", "r-en-n": "en-n", "r-m-n": "m-n", "r-fler": "fler", "r-tern": "tern", "r-utl": "utl", "r-sam": "sam" },
    oppsummering: "<p>Rekkefølgen i algoritmen er: entiteter, svake entiteter, 1:1, 1:N, M:N, flerverdiattributter og til slutt ternære og n-ære relasjoner. Svake entiteter kommer etter eieren fordi de trenger eierens PN.</p>",
    kilde: [K("Realiseringsnotatet (realiseringh26), algoritmen"), K("F06-02 (realisering)")]
  };

  /* ================================================================
     Blokk 4 · SQL
     ================================================================ */
  var SQL_REKKE = {
    id: "sql-rekkefolge", mode: "sort", tittel: "Logisk rekkefølge i en spørring",
    intro: "<p>Du skriver " + m("SELECT") + " først, men databasen bruker den nesten sist. Den logiske rekkefølgen forklarer navnereglene: hvorfor et " + m("AS") + "-navn virker i " + m("ORDER BY") + ", men ikke i " + m("WHERE") + ".</p>",
    prompt: "<p>Sett klausulene i den rekkefølgen de logisk evalueres.</p>",
    items: [
      { id: "select", html: m("SELECT") + ' <span class="muted">uttrykk og AS-navn</span>',
        explain: "<p>Her regnes uttrykkene ut og kolonnene får navn. Derfor finnes ikke et SELECT-navn i WHERE eller HAVING, som kommer før.</p>" },
      { id: "having", html: m("HAVING") + ' <span class="muted">filtrer grupper</span>',
        explain: "<p>Etter grupperingen og aggregatene. HAVING er en slags WHERE for grupper og kan bruke " + m("count(*)") + " og de andre aggregatene.</p>" },
      { id: "from", html: m("FROM") + ' <span class="muted">med alle join-er</span>',
        explain: "<p>Først bygges tabellen det skal velges fra, med alle join-ene. Alt annet jobber på resultatet av denne.</p>" },
      { id: "limit", html: m("LIMIT") + " / " + m("OFFSET"),
        explain: "<p>Helt til slutt kuttes svaret. Det gir bare mening etter sorteringen, ellers vet du ikke hvilke rader du får.</p>" },
      { id: "where", html: m("WHERE") + ' <span class="muted">filtrer rader</span>',
        explain: "<p>Én rad om gangen, og bare rader der betingelsen er TRUE beholdes. Gruppene finnes ikke ennå, så aggregater kan ikke stå her.</p>" },
      { id: "distinct", html: m("DISTINCT") + ' <span class="muted">fjern like rader</span>',
        explain: "<p>Rett etter SELECT: først må radene i svaret finnes, så fjernes duplikatene. Derfor kan " + m("SELECT DISTINCT") + " bare sortere på kolonner som står i SELECT.</p>" },
      { id: "order", html: m("ORDER BY"),
        explain: "<p>Etter SELECT, så SELECT-navnene finnes og kan brukes her.</p>" },
      { id: "group", html: m("GROUP BY"),
        explain: "<p>Radene som overlevde WHERE, deles i grupper med lik verdi i gruppekolonnene. Så regnes aggregatene per gruppe.</p>" }
    ],
    answer: ["from", "where", "group", "having", "select", "distinct", "order", "limit"],
    oppsummering: "<p>Logisk: " + m("FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT") + ". Skriverekkefølgen er en annen: " + m("WITH, SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, OFFSET") + ". Lysarkene gir skriverekkefølgen og navnereglene. Den logiske lista er vår oppsummering av dem.</p>",
    kilde: [K("F09-02 lysark 12–13 (rekkefølge og navneregler)")]
  };

  var SQL_RADER = {
    id: "sql-rader", mode: "bucket", tittel: "Hvilke rader overlever WHERE?",
    intro: "<p>Radantall-oppgavene på eksamen (med minuspoeng for feil kryss) handler om å kjøre spørringen i hodet. Her er det bok-tabellen fra eksempeldatabasen, med én NULL som felle.</p>",
    prompt: "<p>Hvilke rader i " + m("bok") + " er med i svaret?</p>",
    render: function (node) {
      var sql = "SELECT tittel, år\nFROM bok\nWHERE år < 1900 AND sider > 100;";
      if (IN.sqlBlock) IN.sqlBlock(node, sql);
      else node.appendChild(IN.el("pre", { text: sql }));
    },
    zones: [
      { id: "med", label: "Med i svaret" },
      { id: "ikke", label: "Ikke med" }
    ],
    items: [
      { id: "b13", html: "Mrs Dalloway · 1925 · 200 sider", explain: "<p>" + m("1925 < 1900") + " er FALSE, og da er hele AND-en FALSE.</p>" },
      { id: "b10", html: "Et dukkehjem · 1879 · 120 sider", explain: "<p>" + m("1879 < 1900") + " og " + m("120 > 100") + " er begge TRUE.</p>" },
      { id: "b15", html: "Folkeeventyr · 1841 · sider = NULL", explain: "<p>Fellen. " + m("NULL > 100") + " blir NULL, og " + m("TRUE AND NULL") + " blir NULL. WHERE beholder bare rader der betingelsen er TRUE, så raden faller ut.</p>" },
      { id: "b12", html: "Kristin Lavransdatter · 1920 · 1000 sider", explain: "<p>Mange sider, men " + m("1920 < 1900") + " er FALSE.</p>" },
      { id: "b11", html: "Peer Gynt · 1867 · 250 sider", explain: "<p>Begge betingelsene er TRUE.</p>" },
      { id: "b14", html: "Brødrene Løvehjerte · 1973 · 230 sider", explain: "<p>" + m("1973 < 1900") + " er FALSE.</p>" }
    ],
    answer: { b10: "med", b11: "med", b12: "ikke", b13: "ikke", b14: "ikke", b15: "ikke" },
    oppsummering: "<p>Svaret har 2 rader. Med " + m("OR") + " i stedet for " + m("AND") + " hadde Folkeeventyr vært med, fordi " + m("TRUE OR NULL") + " er TRUE.</p>",
    kilde: [K("F03-02 lysark 12–15 (NULL i betingelser)"), K("F03-04 lysark 25")]
  };

  /* ================================================================
     Blokk 5 · SQL videregående
     ================================================================ */
  var SQL_WH = {
    id: "sql-where-having", mode: "bucket", tittel: "WHERE eller HAVING?",
    intro: "<p>Aggregat i WHERE har kostet 2 poeng på flere eksamener. Regelen: WHERE ser på én rad om gangen før grupperingen, HAVING ser på hele grupper etterpå.</p>",
    prompt: "<p>Spørringen teller bøker per forfatter. Hvor skal hver betingelse stå?</p>",
    render: function (node) {
      var sql = "SELECT f.navn, count(*) AS antall\nFROM forfatter AS f\n  INNER JOIN bok AS b ON (f.fid = b.fid)\nWHERE …\nGROUP BY f.fid, f.navn\nHAVING …;";
      if (IN.sqlBlock) IN.sqlBlock(node, sql);
      else node.appendChild(IN.el("pre", { text: sql }));
    },
    zones: [
      { id: "where", label: "WHERE", hint: "per rad, før gruppering" },
      { id: "having", label: "HAVING", hint: "per gruppe, etter telling" }
    ],
    items: [
      { id: "h-cnt", html: m("count(*) >= 2"), explain: "<p>Et aggregat. Antallet finnes først når gruppene er laget, så det må stå i HAVING.</p>" },
      { id: "h-aar", html: m("b.år < 1900"), explain: "<p>Gjelder hver enkelt bok, så det er et radfilter i WHERE. Da telles bare bøker fra før 1900.</p>" },
      { id: "h-avg", html: m("avg(b.sider) > 300"), explain: "<p>Snittet regnes per gruppe. Aggregat → HAVING.</p>" },
      { id: "h-like", html: m("b.tittel LIKE '%e%'"), explain: "<p>Sjekkes for hver bok. Radfilter → WHERE.</p>" },
      { id: "h-land", html: m("f.land = 'Norge'"),
        explain: "<p>En egenskap ved raden, så den naturlige plassen er WHERE. HAVING godtas også: vi grupperer på primærnøkkelen " + m("f.fid") + ", og da tillater PostgreSQL andre kolonner fra samme tabell. WHERE fjerner radene tidligere og er tydeligst.</p>" },
      { id: "h-span", html: m("max(b.år) - min(b.år) > 10"), explain: "<p>Største og minste år i gruppa er aggregater. HAVING.</p>" },
      { id: "h-sider", html: m("b.sider > 200"), explain: "<p>Sidetallet til én bok. Radfilter → WHERE. (Merk at bøker med NULL i sider da faller ut før tellingen.)</p>" },
      { id: "h-sum", html: m("sum(b.sider) >= 400"), explain: "<p>Summen per forfatter er et aggregat. HAVING.</p>" }
    ],
    answer: { "h-cnt": "having", "h-aar": "where", "h-avg": "having", "h-like": "where", "h-land": "where", "h-span": "having", "h-sider": "where", "h-sum": "having" },
    godta: { "h-land": ["having"] },
    oppsummering: "<p>Står det en aggregatfunksjon i betingelsen, hører den hjemme i HAVING. Ellers er WHERE riktig. Bruk ikke SELECT-navnet " + m("antall") + " i HAVING. Skriv " + m("count(*)") + " på nytt.</p>",
    kilde: [K("F09-02 lysark 11–13 (GROUP BY og HAVING)"), K("Sensorveiledning H2020, H2023 og H2025 (aggregat i WHERE)")]
  };

  var SQL_ALLE = {
    id: "sql-for-alle", mode: "bucket", tittel: "«For alle» eller «finnes»?",
    intro: "<p>Den dyreste SQL-feilen på eksamen er å svare på «finnes» når oppgaven spør om «for alle». H2020 trakk 3 poeng for det. Les formuleringen før du skriver noe.</p>",
    prompt: "<p>Hvilken type spørring trenger hver formulering?</p>",
    zones: [
      { id: "alle", label: "For alle", hint: "«alle», «bare», «ingen», «aldri»: NOT EXISTS (… NOT …) eller telling" },
      { id: "finnes", label: "Finnes", hint: "«minst én», «en», «noen»: EXISTS, IN eller join" }
    ],
    items: [
      { id: "a-levert", html: "Lånere der alle lånene er levert", explain: "<p>«Alle». Skriv det som «det finnes ikke et lån som ikke er levert»: " + m("NOT EXISTS (… AND u.levert IS NULL)") + ". Et filter på " + m("levert IS NOT NULL") + " gir lånere med <i>minst ett</i> levert lån.</p>" },
      { id: "a-ulevert", html: "Lånere med minst ett lån som ikke er levert", explain: "<p>«Minst ett» er finnes: en join med " + m("WHERE u.levert IS NULL") + " og DISTINCT, eller EXISTS.</p>" },
      { id: "a-tort", html: "Byer med minst én dag uten nedbør", explain: "<p>Finnes. Det holder at én rad har " + m("nedbør = 0") + ".</p>" },
      { id: "a-ingen", html: "Forfattere der ingen av bøkene har over 500 sider", explain: "<p>«Ingen» betyr «for alle bøkene: ikke over 500». Bruk " + m("NOT EXISTS") + " med betingelsen " + m("sider > 500") + " inni, eller " + m("NOT IN") + ". Med NOT IN må delspørringen ikke kunne gi NULL: én NULL i lista gjør at ingen rader kommer med.</p>" },
      { id: "a-ibsen1", html: "Lånere som har lånt en bok av Ibsen", explain: "<p>Én bok holder. Finnes: join mot utlån, bok og forfatter.</p>" },
      { id: "a-regn", html: "Byer der det aldri har regnet", explain: "<p>«Aldri» = «for alle dager: ingen nedbør». Å filtrere på " + m("nedbør = 0") + " gir byer med minst én tørr dag, som er nettopp feilen sensor trakk for.</p>" },
      { id: "a-ibsen", html: "Lånere som har lånt alle bøkene til Ibsen", explain: "<p>Dobbel negasjon i to nivåer: det finnes ingen Ibsen-bok som låneren ikke har lånt. Eller tell: " + m("count(DISTINCT b.bid)") + " lik antall Ibsen-bøker.</p>" },
      { id: "a-1900", html: "Forfattere med en bok utgitt etter 1900", explain: "<p>Én bok holder. Finnes.</p>" },
      { id: "a-bare", html: "Lånere som bare har lånt norske bøker", explain: "<p>«Bare» = det finnes ikke et lån av en bok som ikke er norsk. For alle. Tenk også på om lånere uten lån skal være med (de oppfyller påstanden tomt).</p>" }
    ],
    answer: { "a-levert": "alle", "a-ulevert": "finnes", "a-tort": "finnes", "a-ingen": "alle", "a-ibsen1": "finnes", "a-regn": "alle", "a-ibsen": "alle", "a-1900": "finnes", "a-bare": "alle" },
    oppsummering: "<p>SQL har ingen «for alle». Skriv den som «det finnes ingen som ikke …»: " + m("NOT EXISTS (SELECT … WHERE <korrelert> AND NOT <betingelse>)") + ", eller sammenlign antall med " + m("HAVING") + ".</p>",
    kilde: [K("F10-02 lysark 9–11 («for alle» og «uten»)"), K("Sensorveiledning H2020 oppgave S4")]
  };

  /* ================================================================
     Blokk 6 · FD
     ================================================================ */
  var KN_ATTR = ["A", "B", "C", "D", "E", "F", "G"];
  var KN_FDS = ["AB → C", "C → D", "D → B", "A → E", "E → F"];
  var FD_KN = {
    id: "fd-kn-grupper", mode: "bucket", tittel: "Kandidatnøkkelmetoden: sorter attributtene",
    intro: "<p>Første steg i kursets metode for å finne alle KN er å se hvor hvert attributt står i FD-ene. Det avgjør om det er <b>alltid med</b>, <b>aldri med</b> eller <b>kanskje med</b> i en kandidatnøkkel.</p>",
    prompt: "<p>" + m("R(A, B, C, D, E, F, G)") + " med FD-ene " + KN_FDS.map(m).join(", ") + ". Hvor står hvert attributt?</p>",
    zones: [
      { id: "venstre", label: "Bare på venstresider", hint: "alltid med" },
      { id: "hoyre", label: "Bare på høyresider", hint: "aldri med" },
      { id: "begge", label: "På begge sider", hint: "kanskje med" },
      { id: "ingen", label: "I ingen FD", hint: "alltid med" }
    ],
    items: [
      { id: "C", html: "C", explain: "<p>Til høyre i " + m("AB → C") + " og til venstre i " + m("C → D") + ". Kanskje med.</p>" },
      { id: "G", html: "G", explain: "<p>Står ikke i noen FD. Ingen FD kan gi G, så G må være med i alle KN, akkurat som et attributt som bare står til venstre. Lett å glemme.</p>" },
      { id: "A", html: "A", explain: "<p>Står til venstre i " + m("AB → C") + " og " + m("A → E") + ", men aldri til høyre. Ingen kan bestemme A, så A er med i alle KN.</p>" },
      { id: "F", html: "F", explain: "<p>Bare til høyre (" + m("E → F") + "). F kan alltid utledes og hjelper ikke til med å utlede noe, så F er ikke med i noen KN.</p>" },
      { id: "D", html: "D", explain: "<p>Til høyre i " + m("C → D") + " og til venstre i " + m("D → B") + ". Kanskje med.</p>" },
      { id: "B", html: "B", explain: "<p>Til høyre i " + m("D → B") + " og til venstre i " + m("AB → C") + ". Kanskje med.</p>" },
      { id: "E", html: "E", explain: "<p>Til høyre i " + m("A → E") + " og til venstre i " + m("E → F") + ". Kanskje med etter regelen, men i dette eksempelet havner E ikke i noen KN, fordi A allerede gir E.</p>" }
    ],
    answer: medMotor(
      { A: "venstre", B: "begge", C: "begge", D: "begge", E: "begge", F: "hoyre", G: "ingen" },
      function (F) {
        var s = F.split(KN_FDS.map(F.parseFD)), L = [], H = [], out = {};
        s.forEach(function (f) { L = F.util.union(L, f.lhs); H = F.util.union(H, f.rhs); });
        KN_ATTR.forEach(function (a) {
          var l = L.indexOf(a) >= 0, h = H.indexOf(a) >= 0;
          out[a] = l && h ? "begge" : l ? "venstre" : h ? "hoyre" : "ingen";
        });
        return out;
      }),
    oppsummering: "<p>Alltid med: A og G. Start med " + m("(AG)⁺ = {A, E, F, G}") + ", som ikke er hele R. Utvid med ett attributt fra «kanskje med»: ABG, ACG og ADG gir alt, mens AEG ikke gjør det. KN = " + m("{A, B, G}") + ", " + m("{A, C, G}") + " og " + m("{A, D, G}") + ".</p>",
    kilde: [K("F07-02 lysark 11–16 (finn alle KN)"), K("Eksamen H2019 oppgave 3.1 (attributter som er med i alle KN)")]
  };

  var BILLETT_ATTR = ["billettnr", "konsert", "sete", "kjøper", "epost", "artist", "scene", "dato"];
  var FD_NOKKEL = {
    id: "fd-nokkelattributt", mode: "bucket", tittel: "Nøkkelattributt eller ikke?",
    intro: "<p>Et nøkkelattributt er med i <b>minst én</b> kandidatnøkkel. Det er ikke det samme som å være med i PN, og ikke det samme som å stå på en venstreside. H2023 og H2024 spurte om dette med JA/NEI og minuspoeng.</p>",
    prompt: "<p>" + m("Billett(billettnr, konsert, sete, kjøper, epost, artist, scene, dato)") + " med FD-ene</p><ul class=\"mono\">" +
      "<li>billettnr → konsert, sete, kjøper</li><li>konsert → artist, scene, dato</li><li>scene, dato → konsert</li><li>konsert, sete → billettnr</li><li>kjøper → epost</li></ul>" +
      "<p>PN er " + m("{billettnr}") + ". Sorter attributtene.</p>" +
      '<details class="grense"><summary>Hint: alle kandidatnøklene</summary><p>' + m("{billettnr}") + ", " + m("{konsert, sete}") + " og " + m("{scene, dato, sete}") + ". Se fanen «Finn alle KN» for utregningen.</p></details>",
    zones: [
      { id: "ja", label: "Nøkkelattributt", hint: "med i minst én KN" },
      { id: "nei", label: "Ikke-nøkkelattributt" }
    ],
    items: [
      { id: "kjøper", html: "kjøper", explain: "<p>Står på en venstreside (" + m("kjøper → epost") + "), men å bestemme noe er ikke det samme som å være med i en KN. kjøper inngår ikke i noen minimal SN.</p>" },
      { id: "sete", html: "sete", explain: "<p>Med i " + m("{konsert, sete}") + " og " + m("{scene, dato, sete}") + ". At PN er " + m("{billettnr}") + ", endrer ikke det. Dette er den typiske feilen.</p>" },
      { id: "artist", html: "artist", explain: "<p>Står bare på høyresider, så den er aldri med i en KN.</p>" },
      { id: "billettnr", html: "billettnr", explain: "<p>" + m("{billettnr}") + " er en KN alene.</p>" },
      { id: "dato", html: "dato", explain: "<p>Med i " + m("{scene, dato, sete}") + ". Det holder med én KN.</p>" },
      { id: "epost", html: "epost", explain: "<p>Bare på høyresiden av " + m("kjøper → epost") + ". Aldri med i en KN.</p>" },
      { id: "konsert", html: "konsert", explain: "<p>Med i " + m("{konsert, sete}") + ".</p>" },
      { id: "scene", html: "scene", explain: "<p>Med i " + m("{scene, dato, sete}") + ", selv om den ikke er med i de to andre KN-ene. «Minst én» er nok.</p>" }
    ],
    answer: medMotor(
      { billettnr: "ja", konsert: "ja", sete: "ja", scene: "ja", dato: "ja", kjøper: "nei", epost: "nei", artist: "nei" },
      function (F) {
        var B = F.EX && F.EX.billett;
        if (!B) return null;
        var na = F.keys(B.attrs, B.fds).nokkelattr, out = {};
        BILLETT_ATTR.forEach(function (a) { out[a] = na.indexOf(a) >= 0 ? "ja" : "nei"; });
        return out;
      }),
    oppsummering: "<p>Nøkkelattributter: billettnr, konsert, sete, scene, dato. Ikke-nøkkelattributter: kjøper, epost, artist. Du trenger <i>alle</i> KN-ene for å svare, ikke bare PN.</p>",
    kilde: [K("Waaler 08-notat lysark 9 (nøkkelattributt)"), K("Eksamen H2023 oppgave 3.1 og H2024 oppgave 3.1 (samme oppgavetype)")]
  };

  /* ================================================================
     Blokk 7 · Normalisering
     ================================================================ */
  // Egen relasjon, ikke den samme som det løste eksempelet på 07 (Bokstaver).
  var NF_ATTR = ["P", "Q", "S", "T", "U", "V", "W"];
  var NF_FDS = ["PQV → W", "PQ → S", "S → P", "Q → T", "T → U"];
  var NF_IDS = ["f1", "f2", "f3", "f4", "f5"];
  var NF_FD = {
    id: "nf-per-fd", mode: "bucket", tittel: "Høyeste normalform per FD",
    intro: "<p>Kursets algoritme stiller tre spørsmål til hver FD " + m("X → Y") + ": Er X en supernøkkel? Er Y et nøkkelattributt? Er X en ekte del av en kandidatnøkkel? Svarene gir BCNF, 3NF, 2NF eller 1NF. Samme format som avkrysningsoppgavene i H2019 og H2024.</p>",
    prompt: "<p>" + m("R(P, Q, S, T, U, V, W)") + " med FD-ene under. Hvilken høyeste normalform tillater hver FD?</p>" +
      '<details class="grense"><summary>Hint: kandidatnøklene</summary><p>Q og V står aldri til høyre, så de er med i hver KN. ' + m("QV⁺ = {Q, T, U, V}") + ", så vi trenger P eller S i tillegg. KN = " + m("{P, Q, V}") + " og " + m("{Q, S, V}") + ". Nøkkelattributter: P, Q, S, V.</p></details>",
    zones: [
      { id: "BCNF", label: "BCNF", hint: "X er SN" },
      { id: "3NF", label: "3NF", hint: "ikke SN, høyresiden er nøkkelattributt" },
      { id: "2NF", label: "2NF", hint: "ikke 3NF, X ikke del av KN" },
      { id: "1NF", label: "1NF", hint: "X ekte del av en KN" }
    ],
    items: [
      { id: "f4", html: m("Q → T"), explain: "<p>" + m("Q⁺ = {Q, T, U}") + ", ikke SN. T er ikke-nøkkel. Q er en ekte del av KN-en " + m("{P, Q, V}") + ", så 2NF er brutt: 1NF.</p>" },
      { id: "f1", html: m("PQV → W"), explain: "<p>PQV er en KN, altså en SN. BCNF.</p>" },
      { id: "f5", html: m("T → U"), explain: "<p>" + m("T⁺ = {T, U}") + ", ikke SN. U er ikke-nøkkel. T er ikke med i noen KN, så 2NF holder: 2NF.</p>" },
      { id: "f3", html: m("S → P"), explain: "<p>" + m("S⁺ = {P, S}") + ", ikke SN. Men P er et nøkkelattributt (med i " + m("{P, Q, V}") + "): 3NF.</p>" },
      { id: "f2", html: m("PQ → S"), explain: "<p>" + m("PQ⁺ = {P, Q, S, T, U}") + ", ikke SN, for V mangler. S er et nøkkelattributt (med i " + m("{Q, S, V}") + "), så 3NF-unntaket slår inn: 3NF.</p>" }
    ],
    answer: medMotor(
      { f1: "BCNF", f2: "3NF", f3: "3NF", f4: "1NF", f5: "2NF" },
      function (F) {
        if (!F.nf) return null;
        var fds = NF_FDS.map(F.parseFD), r = F.nf(NF_ATTR, fds), out = {};
        r.rows.forEach(function (row) { out[NF_IDS[row.fd.src]] = row.nf; });
        return out;
      }),
    oppsummering: "<p>Relasjonen er på den laveste normalformen blant FD-ene: <b>1NF</b>, på grunn av " + m("Q → T") + ". Husk å splitte høyresidene og finne alle KN-ene før du starter.</p>",
    kilde: [K("F08-01 lysark 2–5 (normalform per FD)"), K("Eksamen H2019 oppgave 3.2 og H2024 oppgave 3.2 (samme oppgavetype)")]
  };

  var OV = (IN.DRA_OVINGER = {
    "er": [ER_TEKST],
    "realisering": [REAL_FN, REAL_KONSTR],
    "sql": [SQL_REKKE, SQL_RADER],
    "sql-videre": [SQL_WH, SQL_ALLE],
    "fd": [FD_KN, FD_NOKKEL],
    "normalisering": [NF_FD]
  });

  var TYPE = { sort: "Sortere", bucket: "Bøtter", match: "Koble" };
  /* Tegn alle øvingene for en side. opts går videre til IN.dragTask (instant, lock, side …). */
  IN.draOvinger = function (host, side, opts) {
    if (typeof host === "string") host = IN.qs ? IN.qs(host) : document.querySelector(host);
    var list = OV[side];
    if (!host || !list || !IN.dragTask) return [];
    opts = opts || {};
    return list.map(function (ov) {
      var card = IN.el("div", { class: "card dra-card", id: "dra-" + ov.id });
      card.appendChild(IN.el("h4", null, [document.createTextNode(ov.tittel), IN.el("span", { class: "tag dra-type", text: TYPE[ov.mode] || "" })]));
      if (ov.intro) card.appendChild(IN.el("div", { class: "dra-intro", html: ov.intro }));
      var h = IN.el("div");
      card.appendChild(h);
      host.appendChild(card);
      var o = {};
      Object.keys(opts).forEach(function (k) { o[k] = opts[k]; });
      if (!o.side) o.side = side;
      try { return IN.dragTask(h, ov, o); } catch (e) { if (window.console) console.error("[data-dra] " + ov.id, e); return null; }
    });
  };
})();
