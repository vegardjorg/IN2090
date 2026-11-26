/* ============================================================
   IN2090 guide · symboler.js  (mekanismen er kopiert fra IN2010-guiden 2026-11-25)
   Symbolordliste for forklaringer og kode (IN.SYMBOLER) +
   en skanner som finner symbolene i ren tekst (IN.SYMBOLER.scan).
   Lastes rett etter core.js. Selve verktøytipset (IN.symbolTips) ligger i core.js,
   og pseudocode.js bruker skanneren i tokenizeren.

   Ordlisten følger plan/vranglaere.md (kursets notasjon: relasjonsalgebra, logikk,
   mengder, FD og beskrivelseslogikk i F13). Tekstene er egne ord.
   Ikke legg inn symboler kurset ikke bruker (÷ og ⟕ ⟖ ⟗ er ikke i kurset).
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  /* Hvert symbol: vis (slik det står i teksten), navn (kort), txt (én linje på kursnivå), eks (eksempel). */
  var S = {
    /* ---------- Relasjonsalgebra ---------- */
    proj:   { vis: "π", navn: "projeksjon",
              txt: "π_{A,B}(R) beholder bare kolonnene A og B. RA bruker mengder, så rader som blir like, slås sammen til én.",
              eks: "π_{navn}(Student) gir navnene, hvert navn én gang. Som SELECT DISTINCT navn i SQL." },
    sel:    { vis: "σ", navn: "seleksjon",
              txt: "σ_{betingelse}(R) beholder radene som oppfyller betingelsen. Kolonnene er de samme som før.",
              eks: "σ_{poeng > 50}(Søker) er det samme som WHERE poeng > 50." },
    rho:    { vis: "ρ", navn: "omdøping",
              txt: "ρ_{A→B}(R) gir attributtet A det nye navnet B. Brukes når navnene må være like (union) eller ikke må kollidere (join).",
              eks: "ρ_{Fagkode→Kode}(Kurs) gjør at Kurs kan joines med en tabell som har kolonnen Kode." },
    join:   { vis: "⋈", navn: "join",
              txt: "Med betingelse under (⋈_θ) kobler den rader fra begge sider som oppfyller θ, altså σ_θ(R × S). Uten betingelse er det naturlig join: like attributtnavn må ha like verdier, og fellesattributtene vises én gang.",
              eks: "Student ⋈ Tatt kobler hver student med fagene sine via snr." },
    njoin:  { vis: "⋆", navn: "naturlig join",
              txt: "F02-03 og ukesoppgavene skriver naturlig join som R ⋆ S. Andre lysark og denne guiden skriver R ⋈ S. Det er det samme.",
              eks: "Student ⋆ Tatt = Student ⋈ Tatt." },
    kryss:  { vis: "×", navn: "kartesisk produkt",
              txt: "R × S parer hver rad i R med hver rad i S. Antall rader blir |R| · |S|.",
              eks: "3 rader i R og 4 i S gir 12 rader. Som FROM R, S uten WHERE." },
    union:  { vis: "∪", navn: "union",
              txt: "A ∪ B er alt som er i A, i B eller i begge. For relasjoner krever det lik signatur (samme attributter).",
              eks: "{A, B} ∪ {B, C} = {A, B, C}. I SQL: UNION." },
    snitt:  { vis: "∩", navn: "snitt",
              txt: "A ∩ B er det som er i både A og B. For relasjoner krever det lik signatur.",
              eks: "{A, B} ∩ {B, C} = {B}. I SQL: INTERSECT." },
    diff:   { vis: "∖", navn: "differanse",
              txt: "A ∖ B er det som er i A, men ikke i B. For relasjoner krever det lik signatur.",
              eks: "{A, B, C} ∖ {B} = {A, C}. I SQL: EXCEPT." },
    tilord: { vis: ":=", navn: "navngitt resultat",
              txt: "Navn := uttrykk gir et mellomresultat et navn, så det kan brukes i neste uttrykk.",
              eks: "Unge := σ_{alder < 20}(Person), deretter π_{navn}(Unge)." },

    /* ---------- Logikk ---------- */
    og:     { vis: "∧", navn: "og",
              txt: "a ∧ b er sant bare når både a og b er sanne. Det er AND i SQL.",
              eks: "σ_{by = 'Oslo' ∧ alder > 30}(Person)." },
    eller:  { vis: "∨", navn: "eller",
              txt: "a ∨ b er sant når minst én av dem er sann. Det er OR i SQL.",
              eks: "σ_{by = 'Oslo' ∨ by = 'Bergen'}(Person)." },
    ikke:   { vis: "¬", navn: "ikke",
              txt: "¬a er sant når a er usann. Det er NOT i SQL.",
              eks: "∀x ¬(Vip(x) ∧ Presse(x)): ingen er både Vip og Presse." },
    alle:   { vis: "∀", navn: "for alle",
              txt: "∀x (…) betyr at det i parentesen gjelder for hver eneste x.",
              eks: "∀x (Vip(x) → Gjest(x)): hver Vip er også en Gjest." },
    finnes: { vis: "∃", navn: "det finnes",
              txt: "∃x (…) betyr at det i parentesen gjelder for minst én x.",
              eks: "∃x Vip(x): det finnes minst én Vip." },
    ekv:    { vis: "⇔", navn: "hvis og bare hvis",
              txt: "a ⇔ b betyr at a og b er sanne i nøyaktig de samme tilfellene.",
              eks: "X er en supernøkkel ⇔ X⁺ er alle attributtene." },
    neq:    { vis: "≠", navn: "ikke lik",
              txt: "a ≠ b er sant når a og b er forskjellige. I SQL skrives det != eller <>. Er en av sidene NULL, blir svaret ukjent, ikke sant.",
              eks: "σ_{by ≠ 'Oslo'}(Person) er WHERE by != 'Oslo'." },

    /* ---------- Mengder og FD ---------- */
    "in":   { vis: "∈", navn: "er element i",
              txt: "x ∈ M betyr at x er med i mengden M. t ∈ R betyr at tuppelet t er en rad i R.",
              eks: "A ∈ {A, B}. En FD X → A er triviell når A ∈ X." },
    notin:  { vis: "∉", navn: "er ikke element i",
              txt: "x ∉ M betyr at x ikke er med i M.",
              eks: "C ∉ {A, B}." },
    sub:    { vis: "⊆", navn: "delmengde",
              txt: "X ⊆ Y betyr at alt i X også er i Y. X kan være lik Y.",
              eks: "{A} ⊆ {A, B}. En FD X → Y er triviell når Y ⊆ X." },
    esub:   { vis: "⊂", navn: "ekte delmengde",
              txt: "X ⊂ Y betyr at X er med i Y, men ikke er hele Y.",
              eks: "En KN er minimal: ingen ekte delmengde av den er en supernøkkel." },
    tom:    { vis: "∅", navn: "tom mengde",
              txt: "Mengden uten elementer.",
              eks: "Student ∩ Ansatt = ∅: ingen er begge deler." },
    till:   { vis: "X⁺", navn: "tillukning",
              txt: "X⁺ er alle attributtene X bestemmer via FD-ene. Start med X, og legg til høyresiden av hver FD der hele venstresiden allerede er med.",
              eks: "A → B og B → C gir A⁺ = {A, B, C}. X er en supernøkkel når X⁺ er alle attributtene i R." },
    ikkeFD: { vis: "↛", navn: "bestemmer ikke",
              txt: "X ↛ Y betyr at FD-en X → Y ikke holder: to rader kan ha lik X og ulik Y.",
              eks: "navn ↛ fødselsdato, siden to personer kan hete det samme." },
    dek:    { vis: "⟶", navn: "dekomponeres til",
              txt: "R ⟶ {S₁, S₂} betyr at R deles opp i tabellene S₁ og S₂, og hvert attributt i R havner i minst én av dem.",
              eks: "R(A, B, C) ⟶ {S₁(A, B), S₂(A, C)} er tapsfri hvis A → B eller A → C (Fagins teorem)." },

    /* ---------- Beskrivelseslogikk (F13) ---------- */
    dlsub:  { vis: "⊑", navn: "subklasse (beskrivelseslogikk)",
              txt: "C ⊑ D betyr at alt som er C, også er D. Det er F13s skrivemåte for en subklasse.",
              eks: "Vip ⊑ Gjest: hver Vip er en Gjest." },
    dlog:   { vis: "⊓", navn: "og (beskrivelseslogikk)",
              txt: "C ⊓ D er det som er både C og D, som snitt av klassene.",
              eks: "Vip ⊓ Presse ⊑ ⊥: ingen er både Vip og Presse." },
    dleller:{ vis: "⊔", navn: "eller (beskrivelseslogikk)",
              txt: "C ⊔ D er det som er C eller D (eller begge), som union av klassene.",
              eks: "Gjest ⊑ Vip ⊔ Presse: hver Gjest er Vip eller Presse (totalitet)." },
    bunn:   { vis: "⊥", navn: "ingenting (tom klasse)",
              txt: "⊥ er klassen uten medlemmer. C ⊑ ⊥ betyr at C alltid er tom.",
              eks: "Vip ⊓ Presse ⊑ ⊥ sier at Vip og Presse er disjunkte." }
  };

  /* Enkelttegn → id i S. */
  var CHAR = { "π": "proj", "σ": "sel", "ρ": "rho", "⋈": "join", "⋆": "njoin", "∪": "union", "∩": "snitt",
    "∖": "diff", "∧": "og", "∨": "eller", "¬": "ikke", "∀": "alle", "∃": "finnes", "⇔": "ekv", "≠": "neq",
    "∈": "in", "∉": "notin", "⊆": "sub", "⊂": "esub", "∅": "tom", "⁺": "till", "↛": "ikkeFD", "⟶": "dek",
    "⊑": "dlsub", "⊓": "dlog", "⊔": "dleller", "⊥": "bunn" };

  /* Mønstre som dekker flere tegn. Rekkefølgen teller (første treff på samme sted vinner).
     × bare mellom navn (R × S, (…) × S), ikke i «5×100 p» eller «3 × 4». */
  var MULTI = [
    { id: "till",   re: /(?:\b[A-Za-zÆØÅæøå]{1,8}|\})⁺/g },
    { id: "kryss",  re: /(?<=[A-Za-zÆØÅæøå)₀-₉]\s?)×(?=\s?[A-Za-zÆØÅæøå(πσρ])/g },
    { id: "tilord", re: /(?<=[A-Za-zÆØÅæøå₀-₉] ?):=(?= ?\S)/g }
  ];

  function escRe(c) { return c.replace(/[\\^$.*+?()[\]{}|\/-]/g, "\\$&"); }
  /* Hurtigtest: finnes det i det hele tatt et kandidattegn i teksten? Bygges fra CHAR og MULTI. */
  function anyRe() {
    var parts = Object.keys(CHAR).map(escRe);
    MULTI.forEach(function (p) { parts.push(p.re.source); });
    return parts.length ? new RegExp(parts.join("|")) : null;
  }
  var ANY = anyRe();

  /* scan(text) → [{ i, n, id, open?, close?, single? }] sortert, uten overlapp. */
  function scan(text) {
    if (!text || !ANY || !ANY.test(text)) return [];
    var hits = [];
    MULTI.forEach(function (p) {
      p.re.lastIndex = 0;
      var m;
      while ((m = p.re.exec(text)) !== null) {
        var h = { i: m.index, n: m[0].length, id: p.id };
        if (p.wrap) { h.open = 1; h.close = 1; }
        hits.push(h);
        if (!m[0].length) p.re.lastIndex++;
      }
    });
    for (var i = 0; i < text.length; i++) {
      var id = CHAR[text.charAt(i)];
      if (id) hits.push({ i: i, n: 1, id: id, single: 1 });
    }
    // Lengste/første treff vinner; enkelttegn inne i et mønster forkastes.
    hits.sort(function (a, b) { return a.i - b.i || b.n - a.n; });
    var out = [], end = -1;
    hits.forEach(function (h) {
      if (h.i < end) return;
      out.push(h); end = h.i + h.n;
    });
    return out;
  }

  /* Oppslag for et treff: { vis, navn, txt, eks }. */
  function entry(id) { return S[id] || null; }

  IN.SYMBOLER = { list: S, CHAR: CHAR, scan: scan, entry: entry };
})();
