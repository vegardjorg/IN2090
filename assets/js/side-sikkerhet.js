/* ============================================================
   IN2090 guide · side-sikkerhet.js (blokk 9 · Sikkerhet)
   Forklaringer på tre nivåer, flervalg, sant/usant og injection-demoen.
     IN.sikkerhet.EX                  {id: {eli5, normal, teknisk}}
     IN.sikkerhet.quiz[fane]          flervalg per fane
     IN.sikkerhet.tf                  sant/usant for hele blokken
     IN.sikkerhet.injectionDemo(host) strengsammensetting mot parameter, kjørt i sql-motor.js
   Kilder: F12-01 (sikkerhet i databaser), F12-02 (sikkerhet i programmer), F12 eksempler.
   Alt formulert med egne ord. Eget eksempel (bok og bruker), ikke lysarkenes webshop.
   Klassisk script. Krever core.js, sql-motor.js og viz-relation.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});
  var S = (IN.sikkerhet = IN.sikkerhet || {});

  S.faner = { mal: "Mål og tilgang", grant: "GRANT og REVOKE", injection: "SQL-injection" };

  /* ---------- Forklaringer ---------- */
  S.EX = {
    "ex-cia": {
      eli5: "<p>Tenk på en dagbok med lås. Bare du skal kunne lese den (konfidensialitet). Ingen andre skal kunne skrive i den eller rive ut sider (integritet). Og du må selv kunne åpne den når du vil (tilgjengelighet). En lås som er så god at du ikke får åpnet dagboka selv, er ikke god sikkerhet.</p>",
      normal: "<p>De tre målene trekker litt i hver sin retning. Strenge regler beskytter konfidensialitet og integritet, men gjør det tyngre å bruke dataene. Sikkerhet i en database handler derfor om å gi hver bruker <i>nøyaktig</i> den tilgangen jobben krever: nok til å gjøre jobben, ikke mer.</p>",
      teknisk: "<p>Konfidensialitet handler om hvem som kan <i>lese</i>, integritet om hvem som kan <i>endre</i>, og tilgjengelighet om at de som har lov, faktisk <i>får</i> tilgang. Et angrep kan ramme flere mål på en gang: <span class=\"mono\">DROP TABLE</span> ødelegger både integritet og tilgjengelighet.</p><p>Databasen er bare ett ledd i systemet. Klient, backend og nettverk kan også ha hull, så hvert ledd må sikres for seg. Man må også vite hva hvert ledd antar om de andre.</p>"
    },
    "ex-roller": {
      eli5: "<p>På en skole har alle lærere nøkkel til lærerværelset. Rektor deler ikke ut én og én nøkkel med egne regler til hver lærer. Hun sier «du er lærer», og da får du de samme nøklene som alle andre lærere. Slutter du, leverer du inn lærerrollen, og alle nøklene forsvinner på en gang.</p>",
      normal: "<p>Du kan gi rettigheter direkte til hver bruker, men med mange brukere blir det fort rot: hvem har hva, og hvorfor? Derfor lager man <b>roller</b> som samler rettighetene som hører sammen, for eksempel «bibliotekar». Brukerne får rollen, og rettighetene følger med. Det kalles rollebasert tilgangskontroll (Role-based Access Control).</p>",
      teknisk: "<p>I PostgreSQL er en bruker bare en rolle som kan logge inn: <span class=\"mono\">CREATE USER</span> er det samme som <span class=\"mono\">CREATE ROLE … LOGIN</span>. Når du gir en rolle til en annen rolle, blir mottakeren medlem og får rollens rettigheter. Alle databaser, tabeller og views har en eier, og eieren har alle rettigheter på objektet sitt.</p>"
    },
    "ex-grant": {
      eli5: "<p>GRANT er å gi noen en nøkkel: «du får lov til å lese i denne skuffen». REVOKE er å ta nøkkelen tilbake. Har du ikke fått en nøkkel, er skuffen låst for deg.</p>",
      normal: "<p>Utgangspunktet er at en bruker <b>ikke</b> har lov til noe på tabeller andre eier. Alt må gis med GRANT. Du sier hva som er lov (SELECT, INSERT, UPDATE, DELETE, ALL …), på hvilket objekt (tabell, view, skjema, database) og til hvem (en rolle eller en bruker). REVOKE tar bort en rettighet på samme måte. Rettigheter på én tabell sier ingenting om andre tabeller.</p>",
      teknisk: "<p><span class=\"mono\">GRANT &lt;rettigheter&gt; ON &lt;objekt&gt; TO &lt;rolle&gt;;</span> og <span class=\"mono\">REVOKE &lt;rettigheter&gt; ON &lt;objekt&gt; FROM &lt;rolle&gt;;</span>. Rettigheter kan gis helt ned på kolonnenivå: <span class=\"mono\">GRANT UPDATE (tittel) ON bok TO …</span>. Gis rettigheten til en rolle, får alle medlemmene den.</p><p>Et view er et eget objekt med egne rettigheter. Gir du SELECT på et view som bare viser en opptelling, kan brukeren lese opptellingen uten å få lese tabellen bak.</p>"
    },
    "ex-injection": {
      eli5: "<p>Tenk deg at du gir en robot en lapp: «Hent boka som heter ___». En lur person skriver ikke en boktittel i feltet, men «ingenting, og riv ned hele bokhylla». Roboten leser hele lappen som én ordre og gjør begge deler. Den skjønner ikke at det i feltet skulle stå et navn og ikke en ny ordre.</p>",
      normal: "<p>Når programmet limer inndata rett inn i SQL-strengen, kan databasen ikke se hvor programmererens kode slutter og brukerens tekst begynner. En apostrof i inndataene avslutter strengen i SQL-en, og resten blir lest som SQL. Tre ting må være til stede: et program som kjører SQL, inndata fra brukeren som blir en del av spørringen, og at programmet ikke skiller mellom data og kommando.</p>",
      teknisk: "<p>Strengsammensetting lager SQL-teksten <i>før</i> databasen ser den, så skillet mellom kode og data forsvinner. <span class=\"mono\">'</span> lukker strengen, <span class=\"mono\">--</span> gjør resten av linja til en kommentar (så den avsluttende apostrofen forsvinner), og <span class=\"mono\">;</span> starter en ny setning. Med <span class=\"mono\">UNION</span> kan angriperen hente data fra andre tabeller, så lenge antall kolonner passer.</p><p>Angrepet krever lite kunnskap om koden: å prøve en apostrof og se om det kommer en feilmelding, er ofte nok til å finne hullet.</p>"
    },
    "ex-param": {
      eli5: "<p>Nå har lappen en egen rute: «Hent boka som heter [ ]». Det som står i ruta, er alltid bare et navn, uansett hva det er. Står det «riv ned bokhylla» i ruta, leter roboten etter en bok med det rare navnet, finner ingen og gjør ingenting farlig.</p>",
      normal: "<p>Med en parametrisert spørring skriver du SQL-en med en plassholder (<span class=\"mono\">%s</span> i psycopg, <span class=\"mono\">?</span> i Java) og sender verdien for seg. Verdien blir alltid behandlet som en verdi, aldri som SQL. Bonusen er at helt vanlige inndata med apostrof, som «Rock'n'roll-boka», også virker.</p>",
      teknisk: "<p>Spørringen og parameterne går hver sin vei til databasen. I Java lager <span class=\"mono\">conn.prepareStatement(sql)</span> en <span class=\"mono\">PreparedStatement</span> der <span class=\"mono\">?</span> er plassholder, og <span class=\"mono\">setString(1, verdi)</span> fyller inn første plassholder (nummereringen starter på 1). I psycopg gir du parameterne som andre argument til <span class=\"mono\">execute</span>, som en tuppel: <span class=\"mono\">(tittel,)</span>.</p><p>Plassholderen kan bare stå der en <i>verdi</i> skal stå. Den kan ikke erstatte tabellnavn, kolonnenavn eller nøkkelord.</p>"
    }
  };

  /* ---------- Flervalg ---------- */
  S.quiz = {
    mal: [
      { q: "En angriper henter ut alle passordene fra brukertabellen. Hvilket mål er først og fremst brutt?",
        options: ["Konfidensialitet", "Integritet", "Tilgjengelighet"], answer: 0,
        explain: "Noen fikk <i>lese</i> data de ikke skulle se. Det er konfidensialitet. Ingenting ble endret eller gjort utilgjengelig." },
      { q: "En angriper setter alle sine egne bestillinger til «betalt». Hvilket mål er brutt?",
        options: ["Konfidensialitet", "Integritet", "Tilgjengelighet"], answer: 1,
        explain: "Dataene er ikke lenger korrekte, fordi en uautorisert bruker har endret dem. Det er integritet." },
      { q: "Backend logger inn i databasen med én felles databasebruker for alle brukerne av appen. Hvem sjekker da hva hver enkelt person har lov til?",
        options: ["Databasesystemet", "Backend", "Ingen, det trengs ikke"], answer: 1,
        explain: "Databasen ser bare én bruker og kan ikke skille personene. Backend må autentisere og sjekke rettigheter, og databasen må stole på at backend gjør det riktig." }
    ],
    grant: [
      { q: "Rettighetene er <span class=\"mono\">GRANT SELECT ON bok TO laaner;</span>, <span class=\"mono\">GRANT SELECT, INSERT, UPDATE ON utlaan TO bibliotekar;</span>, <span class=\"mono\">GRANT bibliotekar TO kari;</span> og <span class=\"mono\">GRANT laaner TO per;</span>. Kan per kjøre <span class=\"mono\">SELECT * FROM utlaan;</span>?",
        options: ["Ja", "Nei"], answer: 1,
        explain: "per har rollen laaner, og laaner har bare SELECT på bok. Ingen har gitt laaner noe på utlaan." },
      { q: "Samme rettigheter. Kan kari kjøre <span class=\"mono\">SELECT * FROM bok;</span>?",
        options: ["Ja, bibliotekar er jo en «større» rolle", "Nei"], answer: 1,
        explain: "Rettigheter følger ikke av at en rolle virker viktigere. bibliotekar har bare fått rettigheter på utlaan. Skal kari lese bok, må bibliotekar (eller kari) få SELECT på bok, for eksempel med <span class=\"mono\">GRANT laaner TO bibliotekar;</span>." },
      { q: "Så kjøres <span class=\"mono\">REVOKE INSERT ON utlaan FROM bibliotekar;</span>. Hva kan kari nå gjøre med utlaan?",
        options: ["SELECT og UPDATE", "Ingenting", "SELECT, INSERT og UPDATE som før"], answer: 0,
        explain: "REVOKE tar bare bort det som står i kommandoen. SELECT og UPDATE er igjen, og kari får dem gjennom rollen." },
      { q: "Lånerne skal se hvor mange bøker hver forfatter har, men ikke selve tabellen bok. Hvordan?",
        options: ["GRANT SELECT (forfatter) ON bok TO laaner;", "Lag et view med opptellingen og gi SELECT på viewet", "REVOKE SELECT ON bok FROM laaner; holder"], answer: 1,
        explain: "Et view er et eget objekt med egne rettigheter. Lånerne får lese viewet uten å få lese tabellen bak det. Kolonnerettighet ville fortsatt latt dem lese forfatterkolonnen rad for rad." }
    ],
    injection: [
      { q: "Koden er <span class=\"mono\">cur.execute(\"SELECT * FROM bok WHERE tittel = '\" + tittel + \"';\")</span>. Hva gjør inndataene <span class=\"mono\">' OR TRUE--</span>?",
        options: ["Gir en syntaksfeil", "Gir alle radene i bok", "Gir ingen rader"], answer: 1,
        explain: "Spørringen blir <span class=\"mono\">… WHERE tittel = '' OR TRUE--';</span>. <span class=\"mono\">--</span> gjør den siste apostrofen til en kommentar, og <span class=\"mono\">OR TRUE</span> gjør betingelsen sann for alle rader." },
      { q: "Hva er riktig måte å sende inn tittel på i psycopg?",
        options: ["cur.execute(\"… WHERE tittel = %s;\", (tittel,))", "cur.execute(\"… WHERE tittel = '%s';\" % tittel)", "cur.execute(\"… WHERE tittel = '\" + tittel.replace(\";\", \"\") + \"';\")"], answer: 0,
        explain: "Bare det første er parametrisert: verdien sendes som eget argument (en tuppel). Det andre er strengsammensetting med en annen skrivemåte. Det tredje fjerner semikolon, men <span class=\"mono\">' OR TRUE--</span> virker fortsatt." },
      { q: "I Java: hva fyller inn den første <span class=\"mono\">?</span> i en PreparedStatement?",
        options: ["stmt.setString(0, tittel);", "stmt.setString(1, tittel);", "stmt.execute(tittel);"], answer: 1,
        explain: "Plassholderne nummereres fra 1. Etterpå kjører du <span class=\"mono\">stmt.execute()</span> eller <span class=\"mono\">stmt.executeQuery()</span> uten argumenter." },
      { q: "Programmet er sårbart for injection, men databasebrukeren det logger inn med, har bare SELECT på bok. Hva skjer med <span class=\"mono\">x'; DROP TABLE bok;--</span>?",
        options: ["Tabellen slettes likevel", "Databasen nekter DROP, fordi brukeren ikke eier tabellen", "Spørringen gir alle bøkene"], answer: 1,
        explain: "Bare eieren kan slette en tabell. Riktige rettigheter i databasen begrenser skaden selv om programmet har et hull. Hullet er der fortsatt, så parametre trengs uansett." }
    ]
  };

  /* ---------- Sant/usant ---------- */
  S.tf = [
    { fane: "mal", s: "Tilgjengelighet betyr at brukerne kan se og endre de dataene de har fått tilgang til.", answer: true,
      explain: "Ja. En database som er så låst at de som har lov, ikke kommer til, oppfyller ikke målet." },
    { fane: "mal", s: "Er databasen godt sikret, trenger ikke klienten og backend å tenke på sikkerhet.", answer: false,
      explain: "Hull kan finnes i alle ledd. Sikkerhet er en helhetlig oppgave, og hvert ledd må sikres." },
    { fane: "mal", s: "Roller gjør det lettere å holde styr på rettigheter når mange brukere trenger de samme rettighetene.", answer: true,
      explain: "Det er hele poenget med rollebasert tilgangskontroll: du gir rettighetene til rollen én gang og rollen til brukerne." },
    { fane: "grant", s: "REVOKE SELECT ON bok FROM laaner; fjerner alle rettighetene laaner har.", answer: false,
      explain: "REVOKE fjerner bare rettighetene som står i kommandoen, her SELECT på bok." },
    { fane: "grant", s: "GRANT UPDATE (tittel) ON bok TO bibliotekar; lar bibliotekar endre tittel, men ikke forfatter.", answer: true,
      explain: "Rettigheter kan gis på kolonnenivå." },
    { fane: "grant", s: "Gir du en rettighet til en rolle, får alle brukere med rollen rettigheten.", answer: true,
      explain: "Medlemmer av rollen arver rollens rettigheter." },
    { fane: "injection", s: "Inndataene Rock'n'roll-boka gir en feil når de limes inn mellom to apostrofer i SQL-strengen.", answer: true,
      explain: "Den første apostrofen i tittelen lukker strengen for tidlig, og resten blir ugyldig SQL. Det er det første tegnet på et injection-hull." },
    { fane: "injection", s: "Det holder å fjerne alle semikolon fra inndataene for å stoppe SQL-injection.", answer: false,
      explain: "<span class=\"mono\">' OR TRUE--</span> og <span class=\"mono\">' AND FALSE UNION SELECT …--</span> trenger ikke semikolon. Bruk parametriserte spørringer." },
    { fane: "injection", s: "En PreparedStatement med ? hindrer SQL-injection gjennom verdien som settes inn.", answer: true,
      explain: "Verdien behandles alltid som data og blir aldri lest som SQL." },
    { fane: "injection", s: "En plassholder kan brukes for et tabellnavn, for eksempel SELECT * FROM ?.", answer: false,
      explain: "Plassholdere kan bare stå der en verdi skal stå, ikke i stedet for tabellnavn, kolonnenavn eller nøkkelord." },
    { fane: "injection", s: "Med UNION kan en angriper hente data fra en annen tabell enn den spørringen gjelder.", answer: true,
      explain: "Så lenge antall kolonner passer, legges radene fra den andre tabellen til i resultatet." }
  ];

  /* ---------- Injection-demoen ---------- */
  var SKJEMA = { tabeller: [
    { navn: "bok", kolonner: [{ navn: "bid", type: "int", pk: true }, { navn: "tittel", type: "text" }, { navn: "forfatter", type: "text" }] },
    { navn: "bruker", kolonner: [{ navn: "brukernavn", type: "text", pk: true }, { navn: "passord", type: "text" }] }
  ] };
  var RADER = {
    bok: [[1, "Sult", "Knut Hamsun"], [2, "Kristin Lavransdatter", "Sigrid Undset"], [3, "Naiv. Super.", "Erlend Loe"], [4, "Rock'n'roll-boka", "Ola Nordmann"]],
    bruker: [["ada", "hemmelig1"], ["bibliotekar", "bok123"], ["per", "sommer2026"]]
  };
  var PRESETS = [
    { navn: "Vanlig søk", v: "Sult" },
    { navn: "Apostrof i tittelen", v: "Rock'n'roll-boka" },
    { navn: "Alle rader", v: "' OR TRUE--" },
    { navn: "Hent passord", v: "' AND FALSE UNION SELECT brukernavn, passord FROM bruker--" },
    { navn: "Slett tabellen", v: "x'; DROP TABLE bok;--" }
  ];
  var FOR = "SELECT tittel, forfatter FROM bok WHERE tittel = '", ETTER = "';";
  var KODE = {
    python: {
      konk: "def finn_bok(conn, tittel):\n    cur = conn.cursor()\n    cur.execute(\"SELECT tittel, forfatter FROM bok \"\n                \"WHERE tittel = '\" + tittel + \"';\")   # sårbar\n    return cur.fetchall()",
      param: "def finn_bok(conn, tittel):\n    cur = conn.cursor()\n    cur.execute(\"SELECT tittel, forfatter FROM bok \"\n                \"WHERE tittel = %s;\", (tittel,))\n    return cur.fetchall()"
    },
    java: {
      konk: "Statement stmt = conn.createStatement();\nResultSet res = stmt.executeQuery(\n    \"SELECT tittel, forfatter FROM bok \" +\n    \"WHERE tittel = '\" + tittel + \"';\");   // sårbar",
      param: "PreparedStatement stmt = conn.prepareStatement(\n    \"SELECT tittel, forfatter FROM bok \" +\n    \"WHERE tittel = ?;\");\nstmt.setString(1, tittel);\nResultSet res = stmt.executeQuery();"
    }
  };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* Skanner SQL-teksten som PostgreSQL leser den: strenger i '…' ('' er en apostrof inne i strengen),
     -- kommentar til linjeslutt, ; mellom setninger. Gir klassen til hvert tegn og setningene uten kommentarer. */
  function skann(sql) {
    var kl = [], setn = [], cur = "", iStr = false, iKom = false;
    for (var i = 0; i < sql.length; i++) {
      var c = sql[i];
      if (iKom) { if (c === "\n") { iKom = false; cur += c; } kl.push("kom"); continue; }
      if (iStr) { cur += c; kl.push("str"); if (c === "'") iStr = false; continue; }
      if (c === "'") { iStr = true; cur += c; kl.push("str"); continue; }
      if (c === "-" && sql[i + 1] === "-") { iKom = true; kl.push("kom"); continue; }
      if (c === ";") { kl.push("semi"); setn.push(cur.trim()); cur = ""; continue; }
      cur += c; kl.push("kode");
    }
    if (cur.trim()) setn.push(cur.trim());
    return { klasser: kl, setninger: setn.filter(Boolean), aapenStreng: iStr };
  }

  function visSql(sql, inn0, inn1) {
    var k = skann(sql).klasser, html = "", seg = null, buf = "";
    function flush() { if (buf) html += '<span class="' + seg + '">' + esc(buf) + "</span>"; buf = ""; }
    for (var i = 0; i < sql.length; i++) {
      var c = "sik-c-" + k[i] + (i >= inn0 && i < inn1 ? " sik-inn" : "");
      if (c !== seg) { flush(); seg = c; }
      buf += sql[i];
    }
    flush();
    return html;
  }

  function tabellerI(setning) {
    var out = [], re = /\b(?:from|join)\s+([A-Za-z_æøåÆØÅ][\wæøåÆØÅ]*)/gi, m;
    while ((m = re.exec(setning))) out.push(m[1].toLowerCase());
    return out;
  }

  S.injectionDemo = function (host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host || !IN.sqlMotor) return;
    var el = IN.el;
    var st = { modus: "konk", sprak: "python", begrenset: false, v: PRESETS[0].v };
    var wrap = el("div", { class: "sik-demo" });

    function knapperad(label, valg, nokkel) {
      var rad = el("div", { class: "btn-row", role: "group", "aria-label": label });
      rad.appendChild(el("span", { class: "small muted sik-lbl", text: label }));
      valg.forEach(function (p) {
        var b = el("button", { class: "btn sm", type: "button", text: p[1], onclick: function () { st[nokkel] = p[0]; tegn(); } });
        b._v = p[0]; rad.appendChild(b);
      });
      rad._sync = function () { IN.qsa("button", rad).forEach(function (b) { b.setAttribute("aria-pressed", st[nokkel] === b._v ? "true" : "false"); }); };
      return rad;
    }
    var radModus = knapperad("Programmet bruker:", [["konk", "Strengsammensetting"], ["param", "Parameter"]], "modus");
    var radSprak = knapperad("Språk:", [["python", "Python (psycopg)"], ["java", "Java (JDBC)"]], "sprak");
    wrap.appendChild(radModus); wrap.appendChild(radSprak);

    var kode = el("pre", { class: "sik-kode", "aria-label": "Programkoden" });
    wrap.appendChild(kode);

    var radPre = el("div", { class: "btn-row", role: "group", "aria-label": "Eksempler på inndata" });
    radPre.appendChild(el("span", { class: "small muted sik-lbl", text: "Prøv:" }));
    PRESETS.forEach(function (p) {
      radPre.appendChild(el("button", { class: "btn sm ghost", type: "button", text: p.navn, title: p.v,
        onclick: function () { st.v = p.v; inp.value = p.v; tegn(); } }));
    });
    wrap.appendChild(radPre);

    var lab = el("label", { class: "sik-field" });
    lab.appendChild(el("span", { class: "small", html: "Brukeren skriver inn <span class=\"mono\">tittel</span>:" }));
    var inp = el("input", { type: "text", value: st.v, spellcheck: "false", autocomplete: "off", "aria-label": "Inndata fra brukeren" });
    inp.addEventListener("input", function () { st.v = inp.value; tegn(); });
    lab.appendChild(inp);
    wrap.appendChild(lab);

    var chk = el("input", { type: "checkbox", id: "sik-begrens" });
    chk.addEventListener("change", function () { st.begrenset = chk.checked; tegn(); });
    var cl = el("label", { class: "sik-chk small", "for": "sik-begrens" });
    cl.appendChild(chk);
    cl.appendChild(document.createTextNode(" Appens databasebruker har bare SELECT på bok (og eier ingen tabeller)"));
    wrap.appendChild(cl);

    var ut = el("div", { class: "sik-ut", "aria-live": "polite" });
    wrap.appendChild(ut);
    host.appendChild(wrap);

    function db() { return IN.sqlMotor.lagDb(SKJEMA, RADER); }

    function resultat(box, r, navn) {
      if (r.feil) {
        box.appendChild(el("p", { class: "sik-feil", html: "<b>Feil fra databasen:</b> " + esc(r.feil.melding) }));
        return false;
      }
      var t = el("div", { class: "sik-tab" });
      box.appendChild(t);
      IN.vizTable(t, { navn: navn || "Resultat", kolonner: r.kolonner, rader: r.rader }, { compact: true });
      return true;
    }

    function tegn() {
      radModus._sync(); radSprak._sync();
      kode.textContent = KODE[st.sprak][st.modus];
      IN.clear(ut);
      var v = st.v;
      if (st.modus === "param") {
        var mal = "SELECT tittel, forfatter FROM bok WHERE tittel = " + (st.sprak === "java" ? "?" : "%s") + ";";
        ut.appendChild(el("p", { class: "small sik-h", text: "Dette får databasen:" }));
        ut.appendChild(el("pre", { class: "sik-sql", html: '<span class="sik-kode-t">' + esc(mal) + "</span>" }));
        ut.appendChild(el("p", { class: "sik-param", html: "Parameter 1 = <span class=\"sik-inn\">" + (v ? esc(v) : "<i>tom tekst</i>") + "</span>" }));
        var r = IN.sqlMotor.run("SELECT tittel, forfatter FROM bok WHERE tittel = '" + v.replace(/'/g, "''") + "';", db());
        resultat(ut, r);
        ut.appendChild(el("p", { class: "small muted", html: r.rader && r.rader.length
          ? "Verdien er bare data. Databasen sammenligner <span class=\"mono\">tittel</span> med akkurat denne teksten, apostrofer og alt."
          : "Ingen bok heter akkurat dette. Apostrofer, <span class=\"mono\">--</span> og <span class=\"mono\">;</span> i verdien er bare tegn i en tekst, ikke SQL." }));
        return;
      }
      var sql = FOR + v + ETTER, sk = skann(sql);
      ut.appendChild(el("p", { class: "small sik-h", html: "Dette får databasen (<span class=\"sik-inn\">brukerens tekst</span> er merket, <span class=\"sik-c-kom\">kommentar</span> er grå):" }));
      ut.appendChild(el("pre", { class: "sik-sql", html: visSql(sql, FOR.length, FOR.length + v.length) }));
      var setn = sk.setninger;
      if (setn.length > 1) ut.appendChild(el("p", { class: "small", html: "<b>Strengen inneholder " + setn.length + " SQL-setninger.</b> Drivere som psycopg kjører alle setningene i strengen etter hverandre." }));
      var d = db();
      for (var i = 0; i < setn.length; i++) {
        var s = setn[i], ord = (s.match(/^\s*(\w+)/) || [, ""])[1].toUpperCase();
        var box = el("div", { class: "sik-setn" });
        if (setn.length > 1) box.appendChild(el("p", { class: "small muted", html: "Setning " + (i + 1) + ": <span class=\"mono\">" + esc(s.length > 70 ? s.slice(0, 67) + "…" : s) + "</span>" }));
        ut.appendChild(box);
        if (ord === "SELECT") {
          var andre = tabellerI(s).filter(function (t) { return t !== "bok"; });
          if (st.begrenset && andre.length) {
            box.appendChild(el("p", { class: "sik-nekt", html: "<b>Nektet:</b> appens databasebruker har ikke SELECT på <span class=\"mono\">" + esc(andre[0]) + "</span> (PostgreSQL: <span class=\"mono\">permission denied for table " + esc(andre[0]) + "</span>)." }));
            break;
          }
          var r2 = IN.sqlMotor.run(s + ";", d);
          if (!resultat(box, r2)) {
            if (i === 0) box.appendChild(el("p", { class: "small muted", text: "Programmet krasjer. Det er ikke farlig i seg selv, men det røper at inndataene blir lest som SQL." }));
            break;
          }
          if (r2.rader && r2.rader.length > 1 && /\bunion\b/i.test(s)) box.appendChild(el("p", { class: "sik-brudd", html: "<b>Konfidensialitet brutt:</b> radene kommer fra <span class=\"mono\">bruker</span>, men står under kolonnenavnene fra bok." }));
          else if (/\bor\b/i.test(v) && r2.rader && r2.rader.length === RADER.bok.length) box.appendChild(el("p", { class: "sik-brudd", html: "<b>Alle radene:</b> betingelsen er sann for hver rad. I et innloggingsskjema ville dette sluppet angriperen inn uten passord." }));
        } else if (ord) {
          var endre = /^(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)$/.test(ord);
          if (st.begrenset && endre) {
            box.appendChild(el("p", { class: "sik-nekt", html: "<b>Nektet:</b> " + (ord === "DROP" || ord === "ALTER"
              ? "bare eieren av tabellen kan " + (ord === "DROP" ? "slette" : "endre") + " den (PostgreSQL: <span class=\"mono\">must be owner of table bok</span>)."
              : "appens databasebruker har bare SELECT (PostgreSQL: <span class=\"mono\">permission denied</span>).") +
              " Hullet i programmet er der fortsatt, men skaden stopper i databasen." }));
          } else if (endre) {
            box.appendChild(el("p", { class: "sik-brudd", html: "<b>" + ord + " blir kjørt.</b> " + (ord === "DROP"
              ? "Tabellen bok er borte (demoen later bare som). Det rammer både integritet og tilgjengelighet."
              : "Dataene blir endret uten at noen hadde lov (demoen later bare som). Det rammer integriteten.") }));
          } else box.appendChild(el("p", { class: "small muted", text: "Demoen kjører bare SELECT og endringskommandoer." }));
        }
      }
    }
    tegn();
  };
})();
