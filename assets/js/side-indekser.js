/* ============================================================
   IN2090 guide · side-indekser.js  (blokk 10 · Indekser)
   IN.indekser = { faner, quiz, tf, demo(host) }
   Demo: «finn rader med og uten indeks» på en liten tabell lagret i
   seks diskblokker. Telleren viser antall diskblokker som leses.
   Kilde: F13-01 (indeksstrukturer) og F13-02 (spørreprosessering),
   formulert med egne ord. Eksempeldata er laget for guiden.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------- Eksempeltabellen: vare(vnr, navn, pris), tre rader per blokk ---------- */
  var RADER = [
    [1, "Kaffe", 45], [2, "Te", 30], [3, "Kakao", 55],
    [4, "Melk", 20], [5, "Brød", 35], [6, "Ost", 90],
    [7, "Smør", 60], [8, "Egg", 40], [9, "Juice", 25],
    [10, "Eple", 10], [11, "Pære", 15], [12, "Banan", 45],
    [13, "Ris", 50], [14, "Pasta", 28], [15, "Mel", 18],
    [16, "Sukker", 22], [17, "Salt", 12], [18, "Honning", 75]
  ].map(function (r, i) { return { vnr: r[0], navn: r[1], pris: r[2], blokk: Math.floor(i / 3) }; });
  var NBLOKK = 6;

  /* B-tre (forenklet): én rotnode og tre løvnoder med sorterte verdier og pekere. */
  var ROT = [25, 45];
  var sortert = RADER.slice().sort(function (a, b) { return a.pris - b.pris || a.vnr - b.vnr; });
  var LOV = [[], [], []];
  sortert.forEach(function (r) { LOV[r.pris < ROT[0] ? 0 : r.pris < ROT[1] ? 1 : 2].push(r); });
  var LOVTEKST = ["under 25", "25 til 44", "45 og over"];

  /* Hash-indeks: h(pris) = pris mod 7 gir adresse 0–6. */
  var M = 7;
  function h(v) { return v % M; }
  var BOTTE = []; for (var i = 0; i < M; i++) BOTTE.push([]);
  sortert.forEach(function (r) { BOTTE[h(r.pris)].push(r); });

  var SPM = {
    lik45: { navn: "pris = 45", sql: "SELECT *\nFROM vare\nWHERE pris = 45;", fra: 45, til: 45 },
    lik33: { navn: "pris = 33", sql: "SELECT *\nFROM vare\nWHERE pris = 33;", fra: 33, til: 33 },
    intervall: { navn: "pris BETWEEN 10 AND 15", sql: "SELECT *\nFROM vare\nWHERE pris BETWEEN 10 AND 15;", fra: 10, til: 15 }
  };
  var MODUS = { scan: "Uten indeks", btre: "B-tre på pris", hash: "Hash på pris" };

  function treffer(r, q) { return r.pris >= q.fra && r.pris <= q.til; }
  function radTekst(r) { return "vnr " + r.vnr + " " + esc(r.navn) + " (" + r.pris + ")"; }
  function blokkerFor(rader) {
    var s = {}; rader.forEach(function (r) { s[r.blokk] = 1; });
    return Object.keys(s).map(Number).sort(function (a, b) { return a - b; });
  }
  function lesBlokker(steps, rader, q, intro) {
    blokkerFor(rader).forEach(function (b, k) {
      var hit = RADER.filter(function (r) { return r.blokk === b && treffer(r, q); });
      steps.push({ les: { type: "blokk", i: b },
        tekst: (k === 0 && intro ? intro + " " : "") + "Følger pekeren til blokk " + (b + 1) + " og henter " + hit.map(radTekst).join(" og ") + "." });
    });
  }

  /* Steggenerator. Hvert steg leser én diskblokk (indeksnode, hash-adresse eller datablokk). */
  function lagSteg(qid, modus) {
    var q = SPM[qid], steps = [];
    if (modus === "scan") {
      for (var b = 0; b < NBLOKK; b++) {
        var hit = RADER.filter(function (r) { return r.blokk === b && treffer(r, q); });
        steps.push({ les: { type: "blokk", i: b },
          tekst: "Leser blokk " + (b + 1) + ". " + (hit.length ? "Treff: " + hit.map(radTekst).join(" og ") + "." : "Ingen treff her.") });
      }
      steps[steps.length - 1].tekst += " Hele tabellen er lest. Databasen kan ikke stoppe ved første treff, fordi flere rader kan ha samme pris.";
      return steps;
    }
    var funnet = RADER.filter(function (r) { return treffer(r, q); });
    if (modus === "btre") {
      var l = q.fra < ROT[0] ? 0 : q.fra < ROT[1] ? 1 : 2;
      steps.push({ les: { type: "rot" },
        tekst: "Leser rotnoden [" + ROT.join(" | ") + "]. " + q.fra + (l === 0 ? " er under 25" : l === 1 ? " ligger mellom 25 og 44" : " er 45 eller mer") + ", så vi går til løv " + (l + 1) + "." });
      var iLov = LOV[l].filter(function (r) { return treffer(r, q); });
      steps.push({ les: { type: "lov", i: l },
        tekst: "Leser løv " + (l + 1) + ". " + (iLov.length
          ? "Verdiene ligger sortert. " + (q.fra === q.til ? q.fra + " står her " + (iLov.length === 2 ? "to ganger" : "én gang") : "Fra " + q.fra + " leser vi bortover til første verdi over " + q.til + ": " + iLov.map(function (r) { return r.pris; }).join(", ")) + ", med pekere til " + blokkerFor(iLov).map(function (b) { return "blokk " + (b + 1); }).join(" og ") + "."
          : q.fra + " finnes ikke i løvet. Ingen rader har denne prisen, og vi er ferdige uten å lese tabellen.") });
      lesBlokker(steps, funnet, q);
      return steps;
    }
    // hash
    if (q.fra === q.til) {
      var a = h(q.fra), iB = BOTTE[a].filter(function (r) { return treffer(r, q); });
      steps.push({ les: { type: "botte", i: a },
        tekst: "Regner ut h(" + q.fra + ") = " + q.fra + " mod 7 = " + a + " og leser adresse " + a + ". " + (iB.length
          ? "Lista har " + iB.length + " pekere for " + q.fra + " (andre verdier på samme adresse hoppes over)."
          : "Ingen peker for " + q.fra + " her, så ingen rader har denne prisen.") });
      lesBlokker(steps, funnet, q);
      return steps;
    }
    for (var v = q.fra; v <= q.til; v++) {
      var ad = h(v), tr = BOTTE[ad].filter(function (r) { return r.pris === v; });
      steps.push({ les: { type: "botte", i: ad },
        tekst: (v === q.fra ? "Hash sier ingenting om rekkefølge, så vi må slå opp hver mulig pris fra " + q.fra + " til " + q.til + " (her er prisene hele kroner). " : "") +
          "h(" + v + ") = " + ad + ": " + (tr.length ? "peker for " + v + "." : "ingen " + v + ".") });
    }
    lesBlokker(steps, funnet, q);
    steps[steps.length - 1].tekst += " Her ble det flere lesinger enn å lese hele tabellen.";
    return steps;
  }

  function antall(qid, modus) { return lagSteg(qid, modus).length; }

  /* ---------- Tegning ---------- */
  function chip(r, cls, medPeker) {
    return '<span class="ix-chip' + (cls ? " " + cls : "") + '">' + r.pris + (medPeker ? '<small>→b' + (r.blokk + 1) + "</small>" : "") + "</span>";
  }

  function tegn(st) {
    var q = SPM[st.q], steg = st.steps.slice(0, st.n);
    var lest = { blokk: {}, lov: {}, botte: {}, rot: false };
    steg.forEach(function (s) { if (s.les.type === "rot") lest.rot = true; else lest[s.les.type][s.les.i] = 1; });
    var na = st.n ? st.steps[st.n - 1].les : null;
    function cur(type, i) { return na && na.type === type && (i === undefined || na.i === i); }
    var ferdig = st.n >= st.steps.length;

    var ix = "";
    if (st.m === "btre") {
      ix += '<div class="ix-cap">Indeks (B-tre, forenklet)</div><div class="ix-tre">' +
        '<div class="ix-node ix-rot' + (lest.rot ? " lest" : "") + (cur("rot") ? " na" : "") + '"><span class="ix-nlbl">rot</span>' +
        ROT.map(function (k) { return '<span class="ix-chip key">' + k + "</span>"; }).join("") + "</div>" +
        '<div class="ix-lover">' + LOV.map(function (lv, li) {
          return '<div class="ix-node' + (lest.lov[li] ? " lest" : "") + (cur("lov", li) ? " na" : "") + '"><span class="ix-nlbl">løv ' + (li + 1) + " · " + LOVTEKST[li] + "</span>" +
            lv.map(function (r) { return chip(r, lest.lov[li] && treffer(r, q) ? "hit" : "", true); }).join("") + "</div>";
        }).join("") + "</div></div>";
    } else if (st.m === "hash") {
      ix += '<div class="ix-cap">Indeks (hash, h(pris) = pris mod 7)</div><div class="ix-hash">' + BOTTE.map(function (bt, bi) {
        return '<div class="ix-node' + (lest.botte[bi] ? " lest" : "") + (cur("botte", bi) ? " na" : "") + '"><span class="ix-nlbl">adresse ' + bi + "</span>" +
          (bt.length ? bt.map(function (r) { return chip(r, lest.botte[bi] && treffer(r, q) ? "hit" : "", true); }).join("") : '<span class="muted small">tom</span>') + "</div>";
      }).join("") + "</div>";
    } else {
      ix += '<div class="ix-cap">Ingen indeks på pris</div><p class="small muted ix-ingen">Databasen vet ikke hvor radene med riktig pris ligger, og må lese blokk for blokk.</p>';
    }

    var tab = '<div class="ix-cap">Tabellen vare på disk (tre rader per blokk)</div><div class="ix-blokker">';
    for (var b = 0; b < NBLOKK; b++) {
      tab += '<div class="ix-blokk' + (lest.blokk[b] ? " lest" : "") + (cur("blokk", b) ? " na" : "") + '"><span class="ix-nlbl">blokk ' + (b + 1) + "</span>" +
        RADER.filter(function (r) { return r.blokk === b; }).map(function (r) {
          return '<div class="ix-rad' + (lest.blokk[b] && treffer(r, q) ? " hit" : "") + '"><span>' + r.vnr + "</span><span>" + esc(r.navn) + "</span><span>" + r.pris + "</span></div>";
        }).join("") + "</div>";
    }
    tab += "</div>";

    st.ui.index.innerHTML = ix;
    st.ui.tabell.innerHTML = tab;
    st.ui.teller.innerHTML = "Diskblokker lest: <b>" + st.n + "</b>" + (ferdig ? " (ferdig)" : " av " + st.steps.length);
    st.ui.tekst.textContent = st.n ? st.steps[st.n - 1].tekst : "Trykk «Neste steg» for å lese første diskblokk.";
    st.ui.neste.disabled = ferdig; st.ui.alt.disabled = ferdig; st.ui.forrige.disabled = st.n === 0;
    if (ferdig) {
      st.ui.sum.innerHTML = "<b>Sammenlign for " + esc(q.navn) + ":</b> " + Object.keys(MODUS).map(function (m) {
        return esc(MODUS[m]) + " " + antall(st.q, m) + " blokker";
      }).join(" · ") + ".";
      st.ui.sum.hidden = false;
    } else st.ui.sum.hidden = true;
  }

  function knapper(host, valg, aktiv, onPick, label) {
    var row = IN.el("div", { class: "btn-row", role: "group", "aria-label": label });
    Object.keys(valg).forEach(function (k) {
      var b = IN.el("button", { class: "btn sm", type: "button", "aria-pressed": k === aktiv ? "true" : "false", html: esc(valg[k].navn || valg[k]) });
      b.addEventListener("click", function () {
        IN.qsa("button", row).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        onPick(k);
      });
      row.appendChild(b);
    });
    host.appendChild(row);
  }

  function demo(host) {
    if (typeof host === "string") host = IN.qs(host);
    if (!host) return;
    var st = { q: "lik45", m: "scan", n: 0, steps: [], ui: {} };
    var wrap = IN.el("div", { class: "ix-demo" });
    host.appendChild(wrap);
    wrap.appendChild(IN.el("div", { class: "ix-lbl small muted", text: "Spørring" }));
    knapper(wrap, SPM, st.q, function (k) { st.q = k; nytt(); }, "Velg spørring");
    wrap.appendChild(IN.el("div", { class: "ix-lbl small muted", text: "Indeks" }));
    knapper(wrap, MODUS, st.m, function (k) { st.m = k; nytt(); }, "Velg indeks");
    var sqlHost = IN.el("div", { class: "ix-sql" });
    wrap.appendChild(sqlHost);
    var ctl = IN.el("div", { class: "btn-row" });
    st.ui.forrige = IN.el("button", { class: "btn sm", type: "button", text: "← Forrige" });
    st.ui.neste = IN.el("button", { class: "btn sm primary", type: "button", text: "Neste steg →" });
    st.ui.alt = IN.el("button", { class: "btn sm", type: "button", text: "Vis alle" });
    var nul = IN.el("button", { class: "btn sm ghost", type: "button", text: "Start på nytt" });
    [st.ui.forrige, st.ui.neste, st.ui.alt, nul].forEach(function (b) { ctl.appendChild(b); });
    wrap.appendChild(ctl);
    st.ui.teller = IN.el("div", { class: "ix-teller" });
    st.ui.tekst = IN.el("p", { class: "ix-tekst", "aria-live": "polite" });
    wrap.appendChild(st.ui.teller); wrap.appendChild(st.ui.tekst);
    st.ui.index = IN.el("div", { class: "ix-indeks" });
    st.ui.tabell = IN.el("div", { class: "ix-tabell" });
    wrap.appendChild(st.ui.index); wrap.appendChild(st.ui.tabell);
    st.ui.sum = IN.el("p", { class: "ix-sum small" });
    wrap.appendChild(st.ui.sum);

    st.ui.neste.addEventListener("click", function () { if (st.n < st.steps.length) { st.n++; tegn(st); } });
    st.ui.forrige.addEventListener("click", function () { if (st.n > 0) { st.n--; tegn(st); } });
    st.ui.alt.addEventListener("click", function () { st.n = st.steps.length; tegn(st); });
    nul.addEventListener("click", function () { st.n = 0; tegn(st); });

    function nytt() {
      st.steps = lagSteg(st.q, st.m); st.n = 0;
      IN.clear(sqlHost);
      if (IN.sqlBlock) IN.sqlBlock(sqlHost, SPM[st.q].sql);
      else sqlHost.appendChild(IN.el("pre", { text: SPM[st.q].sql }));
      tegn(st);
    }
    nytt();
  }

  /* ---------- Øving ---------- */
  var faner = { indeks: "Hva er en indeks?", strukturer: "B-tre og hash", nar: "Når hjelper den?", lage: "CREATE INDEX" };

  var quiz = {
    indeks: [
      { q: "Hvorfor er databaseindekser laget for å gi så få diskoppslag som mulig?",
        options: ["Disken har for lite plass til hele tabellen", "Å lese fra disk tar omtrent 10 000 ganger lengre tid enn å lese fra RAM", "SQL krever at hver spørring leser høyst én blokk", "Indeksen ligger i RAM og må lastes på nytt hver gang"], answer: 1,
        explain: "Tabeller og indekser ligger på disk. Det er antall diskoppslag som koster tid, så indeksstrukturene er bygget for å holde det tallet lavt." },
      { q: "Hva har et oppslag på én verdi og en join til felles?",
        options: ["Begge er søk etter rader med bestemte verdier i en kolonne", "Begge krever GROUP BY", "Begge leser alltid hele tabellen", "Ingenting, de bruker helt ulike strukturer"], answer: 0,
        explain: "En join på a.x = b.y er et søk etter rader i b med en bestemt verdi i y. Derfor hjelper den samme indeksen både WHERE og join." }
    ],
    strukturer: [
      { q: "Spørringen har WHERE pris BETWEEN 100 AND 200. Hvilken indeks på pris passer best?",
        options: ["Hash-indeks", "B-tre-indeks", "Begge er like gode", "Ingen indeks kan brukes til dette"], answer: 1,
        explain: "Løvnodene i B-treet ligger sortert, så databasen finner 100 og leser bortover til 200. En hash-indeks må slå opp hver mulig verdi for seg." },
      { q: "Hvorfor er en node i et B-tre like stor som en diskblokk?",
        options: ["Da kan noden ha bare to barn", "Da koster hver node ett diskoppslag, og mange barn per node gjør treet lavt", "Da blir hash-funksjonen raskere", "Det er bare en konvensjon uten betydning"], answer: 1,
        explain: "Én node leses i ett diskoppslag. Med mange barn per node trengs få nivåer, og et oppslag blir noen få diskoppslag selv i en stor tabell." },
      { q: "Hva ligger på adressen hash-funksjonen gir for en verdi?",
        options: ["Selve tabellen, sortert", "En liste med pekere til radene som har verdien", "Rotnoden i et B-tre", "Alle verdiene i et intervall"], answer: 1,
        explain: "Hash-funksjonen oversetter verdien til en adresse. Der ligger pekerne til radene med den verdien." }
    ],
    nar: [
      { q: "ansatt(aid, navn, avdeling) har PRIMARY KEY (aid) og ingen andre indekser. Hvilken betingelse får automatisk hjelp av en indeks?",
        options: ["WHERE navn = 'Kari'", "WHERE aid = 7", "WHERE avdeling = 'IT'", "Ingen av dem"], answer: 1,
        explain: "PRIMARY KEY gir automatisk en B-tre-indeks på aid. For navn og avdeling må du lage indeksen selv med CREATE INDEX." },
      { q: "Hvem bestemmer om en indeks brukes når en SELECT kjøres?",
        options: ["Du, ved å skrive indeksnavnet i FROM", "Databasen, når den velger hvordan spørringen skal utføres", "Indeksen brukes alltid hvis den finnes", "Den som lagde tabellen"], answer: 1,
        explain: "Du skriver spørringen som vanlig. Databasen finner selv ut om indeksen lønner seg, som en del av spørreprosesseringen." }
    ],
    lage: [
      { q: "Hvilken setning lager en indeks på kolonnen pris i tabellen vare?",
        options: ["CREATE INDEX pris_idx ON vare(pris);", "CREATE INDEX vare(pris) AS pris_idx;", "ALTER TABLE vare ADD INDEX pris;", "SELECT INDEX pris FROM vare;"], answer: 0,
        explain: "Formen er CREATE INDEX navn ON tabell(kolonner);. Databasen velger selv en passende struktur, typisk B-tre." },
      { q: "Hva skjer med CREATE INDEX ix ON vare(kategori, pris);?",
        options: ["To indekser, én på hver kolonne", "Én indeks over begge kolonnene samtidig", "En feil, fordi bare én kolonne er lov", "En indeks bare på pris"], answer: 1,
        explain: "Lister du flere kolonner, blir det én indeks over kombinasjonen av dem." }
    ]
  };

  var tf = [
    { fane: "indeks", s: "Databaseindekser ligger på disk, ikke bare i minnet.", answer: true,
      explain: "Det er derfor de er bygget for å gi få diskoppslag." },
    { fane: "strukturer", s: "Et B-tre er et binærtre: hver node har høyst to barn.", answer: false,
      explain: "I et B-tre kan hver node ha mange barn. Det er nettopp det som gjør treet lavt." },
    { fane: "strukturer", s: "En hash-indeks er like god som et B-tre til intervallsøk.", answer: false,
      explain: "Hash er raskest for oppslag på én konkret verdi, men kan ikke brukes direkte for intervaller. Da må hver mulig verdi slås opp for seg." },
    { fane: "strukturer", s: "Verdiene i løvnodene i et B-tre har pekere til radene sine i tabellen.", answer: true,
      explain: "Indeksen inneholder ikke radene selv, bare verdiene og pekere til der radene ligger." },
    { fane: "nar", s: "PRIMARY KEY gir automatisk en B-tre-indeks på kolonnen.", answer: true,
      explain: "Derfor er joins over primærnøkler alltid ganske effektive." },
    { fane: "nar", s: "REFERENCES lager automatisk en indeks på fremmednøkkelkolonnen.", answer: false,
      explain: "Lysarkene nevner bare PRIMARY KEY som gir indeks automatisk. Vil du søke eller joine på en fremmednøkkel, lager du indeksen selv (PostgreSQL gjør det ikke for REFERENCES)." },
    { fane: "nar", s: "I en SELECT må du oppgi hvilken indeks databasen skal bruke.", answer: false,
      explain: "Databasen velger selv. Spørringen skrives likt med og uten indeks, og svaret blir det samme." },
    { fane: "lage", s: "CREATE INDEX over to kolonner lager to separate indekser.", answer: false,
      explain: "Det blir én indeks over begge kolonnene samtidig." },
    { fane: "lage", s: "Hver indeks på en tabell gjør INSERT, UPDATE og DELETE litt dyrere.", answer: true,
      explain: "Indeksen må holdes oppdatert når radene endres. Dette står ikke på lysarkene, men er grunnen til at man ikke indekserer alle kolonner." }
  ];

  IN.indekser = { faner: faner, quiz: quiz, tf: tf, demo: demo, _lagSteg: lagSteg };
})();
