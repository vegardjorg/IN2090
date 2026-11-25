/* ============================================================
   IN2090 guide · data-ra.js  (blokk 3 · relasjonsalgebra)
   Egne eksempeltabeller, forhåndsvalgte uttrykk, felle-tilfeller, øvingsoppgaver,
   flervalg og sant/usant. Alt er eget innhold (ikke kopiert fra lysark eller LF).
   Notasjon etter plan/vranglaere.md A3: π σ ρ × ⋈ (betingelse senket, naturlig uten) ∪ ∩ ∖ :=.
   Klassisk script, setter IN.dataRa. Evaluatoren ligger i side-ra.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  var db = {
    Student: { kolonner: ["snr", "navn", "by"], pk: ["snr"], rader: [
      [1, "Ada", "Oslo"], [2, "Bo", "Bergen"], [3, "Cy", "Oslo"], [4, "Di", "Tromsø"]] },
    Emne: { kolonner: ["kode", "tittel", "sp"], pk: ["kode"], rader: [
      ["IN2090", "Databaser", 10], ["IN2010", "Algoritmer", 10], ["EXPHIL", "Filosofi", 10]] },
    Tatt: { kolonner: ["snr", "kode", "kar"], pk: ["snr", "kode"], rader: [
      [1, "IN2090", "A"], [1, "IN2010", "A"], [2, "IN2090", "B"], [3, "IN2090", "A"], [3, "EXPHIL", "C"]] },
    Foreleser: { kolonner: ["kode", "navn"], pk: ["kode"], rader: [
      ["IN2090", "Eva"], ["IN2010", "Finn"], ["EXPHIL", "Gro"]] },
    Kunde: { kolonner: ["Kundenr", "Navn", "Telefonnr", "Post_postnr"], pk: ["Kundenr"], rader: [
      [101, "Kari", "90011111", "1350"], [102, "Per", "90022222", "0150"], [103, "Liv", "90033333", "1350"], [104, "Ola", "90044444", "5003"]] },
    "Båt": { kolonner: ["Kortnavn", "Eksemplar", "Kundenr"], pk: ["Kortnavn", "Eksemplar"], rader: [
      ["Snekke", 1, 101], ["Snekke", 2, 103], ["Seiler", 1, 101], ["Jolle", 1, 104]] }
  };

  /* Uttrykkene til stegspilleren (fanen «Uttrykkstre»). */
  var presets = {
    "Navn med A": "π_{navn}(σ_{kar = 'A'}(Student ⋈ Tatt))",
    "Join med betingelse": "π_{navn, kode}(Student ⋈_{Student.snr = Tatt.snr} Tatt)",
    "σ over ×": "σ_{Student.snr = Tatt.snr}(Student × Tatt)",
    "Felle: ingen felles": "Student ⋈ Emne",
    "Felle: to felles": "π_{navn, kode}(Student ⋈ Tatt ⋈ Foreleser)",
    "Løst med ρ": "π_{navn, foreleser}(Student ⋈ Tatt ⋈ ρ_{navn→foreleser}(Foreleser))",
    "Ingen emner (∖)": "π_{navn}(Student ⋈ (π_{snr}(Student) ∖ π_{snr}(Tatt)))",
    "Både og (∩)": "π_{navn}(Student ⋈ (π_{snr}(σ_{kode = 'IN2090'}(Tatt)) ∩ π_{snr}(σ_{kode = 'IN2010'}(Tatt))))",
    "Bare A (med :=)": "MedA := π_{snr}(σ_{kar = 'A'}(Tatt))\nIkkeA := π_{snr}(σ_{kar ≠ 'A'}(Tatt))\nπ_{navn}(Student ⋈ (MedA ∖ IkkeA))",
    "H2025 1.3 b": "π_{Navn, Telefonnr}(Kunde ⋈_{Kunde.Kundenr = Båt.Kundenr} Båt)"
  };

  /* Naturlig join: tre tilfeller og løsningen. */
  var joinCases = [
    { knapp: "Én felles kolonne", uttrykk: "Student ⋈ Tatt", type: "eksempel", lbl: "Slik det skal være",
      tekst: "Student og Tatt har bare <span class=\"mono\">snr</span> felles. Naturlig join kobler hver student med emnene hun har tatt, og <span class=\"mono\">snr</span> står bare én gang. Di har ikke tatt noe, så hun er ikke med." },
    { knapp: "Ingen felles: ×", uttrykk: "Student ⋈ Emne", type: "felle", lbl: "Felle",
      tekst: "Student og Emne har <b>ingen</b> attributter med likt navn. Da har naturlig join ingenting å koble på og blir kryssproduktet: 4 · 3 = 12 rader, der hver student er «koblet» med hvert emne. Uttrykket er lovlig, så du får ingen feilmelding. Du får bare feil svar." },
    { knapp: "To felles: tomt", uttrykk: "Student ⋈ Tatt ⋈ Foreleser", type: "felle", lbl: "Felle",
      tekst: "Den andre joinen har to felles navn: <span class=\"mono\">kode</span> (som vi vil koble på) og <span class=\"mono\">navn</span> (studentens navn og foreleserens navn, som tilfeldigvis heter det samme). Naturlig join krever at <b>begge</b> er like, og ingen student heter det samme som foreleseren sin. Svaret blir tomt. H2020 trakk 1 poeng for den samme feilen med <span class=\"mono\">NATURAL JOIN</span> i SQL." },
    { knapp: "Løst med ρ", uttrykk: "Student ⋈ Tatt ⋈ ρ_{navn→foreleser}(Foreleser)", type: "snarvei", lbl: "Løsning",
      tekst: "Gi foreleserens navn et annet navn med ρ før joinen. Nå er <span class=\"mono\">kode</span> det eneste felles attributtet. Alternativet er join med betingelse, der du selv skriver hva som skal være likt." }
  ];

  var setCases = [
    { knapp: "Riktig: ∩", uttrykk: "π_{snr}(σ_{kode = 'IN2090'}(Tatt)) ∩ π_{snr}(σ_{kode = 'IN2010'}(Tatt))", type: "eksempel", lbl: "Både IN2090 og IN2010",
      tekst: "Finn studentene som har tatt IN2090, finn studentene som har tatt IN2010, og ta snittet av de to mengdene. Bare student 1 er i begge." },
    { knapp: "Feil: ∧ i én σ", uttrykk: "σ_{kode = 'IN2090' ∧ kode = 'IN2010'}(Tatt)", type: "felle", lbl: "Felle",
      tekst: "σ ser på én rad om gangen. Ingen rad kan ha kode lik både IN2090 og IN2010, så svaret er alltid tomt. «Både og» på tvers av rader krever ∩ (eller en join av to kopier)." },
    { knapp: "∪ = ∨ (H2024 2.4)", uttrykk: "π_{snr}(σ_{by = 'Oslo'}(Student)) ∪ π_{snr}(σ_{by = 'Bergen'}(Student))", type: "eksempel", lbl: "Ekvivalens",
      tekst: "Begge sidene henter fra samme relasjon. Da gir unionen det samme som én σ der betingelsene er bundet sammen med ∨: <span class=\"mono\">π<sub>snr</sub>(σ<sub>by = 'Oslo' ∨ by = 'Bergen'</sub>(Student))</span>. Det er nøyaktig ideen i H2024 2.4, der en <span class=\"mono\">UNION</span> skulle skrives om med <span class=\"mono\">OR</span>." },
    { knapp: "Samme med ∨", uttrykk: "π_{snr}(σ_{by = 'Oslo' ∨ by = 'Bergen'}(Student))", type: "snarvei", lbl: "Samme svar",
      tekst: "Én σ med ∨ gir samme mengde: {1, 2, 3}. Med to <i>ulike</i> relasjoner virker ikke dette, og da trengs ∪." }
  ];

  var forAlleCases = [
    { knapp: "Minst én A", uttrykk: "π_{navn}(σ_{kar = 'A'}(Student ⋈ Tatt))", type: "eksempel", lbl: "Finnes",
      tekst: "σ plukker rader med A. Det gir studenter som har fått A i <b>minst ett</b> emne: Ada og Cy." },
    { knapp: "Bare A", uttrykk: "π_{navn}(Student ⋈ (π_{snr}(σ_{kar = 'A'}(Tatt)) ∖ π_{snr}(σ_{kar ≠ 'A'}(Tatt))))", type: "snarvei", lbl: "For alle",
      tekst: "«Bare A» betyr «har A og har <b>ingen</b> annen karakter». Ta dem med A og trekk fra dem som har noe annet enn A. Cy har en C og forsvinner. Bare Ada er igjen." }
  ];

  /* Øving: skriv uttrykket selv. Fasit sammenlignes som mengde. */
  var ovinger = [
    { id: "oslo", tittel: "Navn på studenter i Oslo", tekst: "Finn navnet på alle studenter som bor i Oslo.",
      fasit: "π_{navn}(σ_{by = 'Oslo'}(Student))", hint: "σ på by først, så π på navn. Konstanter skrives i fnutter: <span class=\"mono\">'Oslo'</span>." },
    { id: "kunde1350", tittel: "Kunder i postnummer 1350", eksamen: "som H2025 1.3 a", tekst: "Finn navn og kundenummer for alle kunder med postnummer 1350 (tabellen Kunde).",
      fasit: "π_{Kundenr, Navn}(σ_{Post_postnr = '1350'}(Kunde))", hint: "Samme mønster som over: σ innerst, π ytterst." },
    { id: "baat", tittel: "Kunder med minst én båt", eksamen: "som H2025 1.3 b", tekst: "Finn navn og telefonnummer for alle kunder som har minst én båt (tabellene Kunde og Båt).",
      fasit: "π_{Navn, Telefonnr}(Kunde ⋈_{Kunde.Kundenr = Båt.Kundenr} Båt)",
      hint: "En join med Båt beholder bare kunder som har en båt. Kari har to båter, men π fjerner duplikatet.",
      forklaring: "Naturlig join <span class=\"mono\">Kunde ⋈ Båt</span> gir det samme her, fordi Kundenr er det eneste felles navnet. Det må du sjekke i skjemaet hver gang." },
    { id: "ada", tittel: "Emnene Ada har tatt", tekst: "Finn tittelen på alle emner som Ada har tatt.",
      fasit: "π_{tittel}(σ_{navn = 'Ada'}(Student) ⋈ Tatt ⋈ Emne)",
      hint: "Student ⋈ Tatt kobler på snr, og videre ⋈ Emne kobler på kode. Sjekk at det ikke finnes andre felles navn." },
    { id: "ingen", tittel: "Studenter uten emner", tekst: "Finn studentnummeret til alle studenter som ikke har tatt noe emne.",
      fasit: "π_{snr}(Student) ∖ π_{snr}(Tatt)",
      hint: "«Ikke» blir differanse: alle studenter minus dem som står i Tatt. Begge sidene må ha samme signatur, derfor π<sub>snr</sub> på begge." },
    { id: "begge", tittel: "Både IN2090 og IN2010", tekst: "Finn navnet på studentene som har tatt både IN2090 og IN2010.",
      fasit: "π_{navn}(Student ⋈ (π_{snr}(σ_{kode = 'IN2090'}(Tatt)) ∩ π_{snr}(σ_{kode = 'IN2010'}(Tatt))))",
      hint: "Én σ med ∧ på kode gir alltid tomt svar. Lag to mengder med snr og ta snittet. Koble så til Student for å få navnet." },
    { id: "foreleser", tittel: "Student og foreleser", tekst: "Lag en relasjon med studentens navn og navnet på foreleseren for hvert emne studenten har tatt. Gi kolonnene navnene <span class=\"mono\">navn</span> og <span class=\"mono\">foreleser</span>.",
      fasit: "π_{navn, foreleser}(Student ⋈ Tatt ⋈ ρ_{navn→foreleser}(Foreleser))",
      hint: "Student og Foreleser har begge attributtet <span class=\"mono\">navn</span>. Med naturlig join rett på Foreleser blir svaret tomt. Bruk ρ." },
    { id: "bareA", tittel: "Bare A", tekst: "Finn navnet på studentene som har fått A i <b>alle</b> emnene de har tatt (og som har tatt minst ett).",
      fasit: "π_{navn}(Student ⋈ (π_{snr}(σ_{kar = 'A'}(Tatt)) ∖ π_{snr}(σ_{kar ≠ 'A'}(Tatt))))",
      hint: "«Alle er A» er det samme som «har A, og ingen er noe annet». Bruk differanse. Du kan dele opp med <span class=\"mono\">MedA := …</span> på egne linjer." },
    { id: "ingenA", tittel: "Emner uten A", tekst: "Finn tittelen på emnene der ingen har fått A.",
      fasit: "π_{tittel}(Emne ⋈ (π_{kode}(Emne) ∖ π_{kode}(σ_{kar = 'A'}(Tatt))))",
      hint: "Alle emnekoder minus kodene som har en A. Koble resten med Emne for å få tittelen." }
  ];

  /* Fanenavn til sant/usant-merket. */
  var faner = { grunnlag: "Grunnlag", unaere: "π σ ρ", join: "× og ⋈", mengde: "∪ ∩ ∖", tre: "Uttrykkstre", sql: "SQL ↔ RA" };

  var quiz = {
    grunnlag: [
      { q: "Hva får du alltid tilbake fra en operator i relasjonsalgebra?",
        options: ["En ny relasjon", "Et tall", "En endret versjon av tabellen i databasen", "En liste med rader i en bestemt rekkefølge"], answer: 0,
        explain: "Hver operator tar én eller to relasjoner og gir en ny relasjon. Derfor kan operatorene settes inn i hverandre. Tabellene i databasen endres ikke." },
      { q: "<span class=\"mono\">π<sub>by</sub>(Student)</span> på eksempeltabellen (Oslo, Bergen, Oslo, Tromsø). Hvor mange rader?",
        options: ["3", "4", "2", "1"], answer: 0,
        explain: "Relasjonsalgebra er mengdebasert. De to Oslo-radene blir like og telles én gang: Oslo, Bergen, Tromsø. <span class=\"mono\">SELECT by FROM Student</span> i SQL gir 4." },
      { q: "Hva gjør <span class=\"mono\">Oslofolk := σ<sub>by = 'Oslo'</sub>(Student)</span>?",
        options: ["Gir resultatet navnet Oslofolk, så det kan brukes i senere uttrykk", "Lager en ny tabell i databasen", "Sammenligner Oslofolk med uttrykket", "Endrer Student"], answer: 0,
        explain: "<span class=\"mono\">:=</span> gir et mellomresultat et navn. Det gjør lange uttrykk lettere å lese og skrive, men endrer ikke databasen." }
    ],
    unaere: [
      { q: "Hva er forskjellen på π og σ?",
        options: ["π velger kolonner, σ velger rader", "π velger rader, σ velger kolonner", "Begge velger rader", "π omdøper, σ velger kolonner"], answer: 0,
        explain: "π (projeksjon) beholder attributtene i listen. σ (seleksjon) beholder tuplene som oppfyller betingelsen og alle attributtene." },
      { q: "Hvorfor virker ikke <span class=\"mono\">σ<sub>by = 'Oslo'</sub>(π<sub>navn</sub>(Student))</span>?",
        options: ["π har allerede fjernet by, så σ finner ikke attributtet", "σ må alltid stå ytterst", "Konstanten må skrives uten fnutter", "π og σ kan ikke kombineres"], answer: 0,
        explain: "Operatoren innerst kjøres først. Etter <span class=\"mono\">π<sub>navn</sub></span> finnes bare navn. Bytt rekkefølge: <span class=\"mono\">π<sub>navn</sub>(σ<sub>by = 'Oslo'</sub>(Student))</span>." },
      { q: "Hvilket uttrykk gir Emne med kolonnen <span class=\"mono\">tittel</span> omdøpt til <span class=\"mono\">navn</span>?",
        options: ["ρ<sub>tittel→navn</sub>(Emne)", "ρ<sub>navn→tittel</sub>(Emne)", "π<sub>navn</sub>(Emne)", "σ<sub>tittel = navn</sub>(Emne)"], answer: 0,
        explain: "Kursets skrivemåte er gammelt navn, pil, nytt navn: <span class=\"mono\">ρ<sub>A→B</sub></span> omdøper A til B." },
      { q: "<span class=\"mono\">σ<sub>kode = 'IN2090' ∧ kar ≠ 'A'</sub>(Tatt)</span>. Hvor mange rader (Tatt har (1, IN2090, A), (1, IN2010, A), (2, IN2090, B), (3, IN2090, A), (3, EXPHIL, C))?",
        options: ["1", "0", "2", "3"], answer: 0,
        explain: "Bare (2, IN2090, B) har både kode IN2090 og en annen karakter enn A." }
    ],
    join: [
      { q: "Student har 4 rader og Emne 3. De har ingen attributtnavn felles. Hvor mange rader gir <span class=\"mono\">Student ⋈ Emne</span>?",
        options: ["12", "0", "7", "Feilmelding"], answer: 0,
        explain: "Uten felles attributter blir naturlig join kryssproduktet: 4 · 3 = 12. Ingen feilmelding, bare et svar som nesten aldri er det du ville ha." },
      { q: "Hva er <span class=\"mono\">R ⋈<sub>R.a = S.b</sub> S</span> per definisjon?",
        options: ["σ<sub>R.a = S.b</sub>(R × S)", "π<sub>a, b</sub>(R × S)", "R ∩ S", "R × S med a og b slått sammen"], answer: 0,
        explain: "Join med betingelse er kryssproduktet fulgt av en seleksjon på betingelsen. Begge kopiene av kolonnene blir med." },
      { q: "R(a, b, c) og S(b, c, d). Hva kobler <span class=\"mono\">R ⋈ S</span> på?",
        options: ["b og c", "Bare b", "Ingenting, det blir ×", "a og d"], answer: 0,
        explain: "Naturlig join kobler på <b>alle</b> attributter med likt navn. Vil du bare koble på b, må du omdøpe c på en av sidene med ρ." },
      { q: "Hvor mange kolonner har <span class=\"mono\">Student ⋈ Tatt</span> når Student er (snr, navn, by) og Tatt er (snr, kode, kar)?",
        options: ["5", "6", "3", "4"], answer: 0,
        explain: "Felles snr tas med én gang: snr, navn, by, kode, kar. Med join med betingelse <span class=\"mono\">Student.snr = Tatt.snr</span> ville snr stått to ganger (6 kolonner)." }
    ],
    mengde: [
      { q: "Hvorfor er <span class=\"mono\">π<sub>snr</sub>(Student) ∪ π<sub>kode</sub>(Tatt)</span> ikke lov?",
        options: ["Sidene har ikke samme signatur", "Union krever at relasjonene er like store", "∪ kan bare brukes på hele tabeller", "snr er en primærnøkkel"], answer: 0,
        explain: "∪, ∩ og ∖ krever samme signatur: samme attributtnavn og typer. Her heter det ene attributtet snr og det andre kode." },
      { q: "Hvilket uttrykk gir studentnumrene som <b>ikke</b> har tatt noe emne?",
        options: ["π<sub>snr</sub>(Student) ∖ π<sub>snr</sub>(Tatt)", "π<sub>snr</sub>(Tatt) ∖ π<sub>snr</sub>(Student)", "π<sub>snr</sub>(Student) ∩ π<sub>snr</sub>(Tatt)", "σ<sub>snr ≠ snr</sub>(Student × Tatt)"], answer: 0,
        explain: "Alle studenter minus dem som finnes i Tatt. Rekkefølgen betyr noe. Den andre veien gir studenter i Tatt som ikke finnes i Student, altså ingen." },
      { q: "«Studenter som bare har fått A». Hva er riktig idé?",
        options: ["De med A, minus de som har en annen karakter", "σ<sub>kar = 'A'</sub> og så π", "De med A, snitt de med en annen karakter", "σ<sub>kar = 'A' ∧ kar ≠ 'B'</sub>"], answer: 0,
        explain: "σ<sub>kar = 'A'</sub> gir studenter med <i>minst én</i> A. «Bare» og «ingen» uttrykkes med differanse." }
    ],
    tre: [
      { q: "I hvilken rekkefølge evalueres et RA-tre?",
        options: ["Nedenfra og opp: bladene først, roten sist", "Ovenfra og ned: roten først", "Fra venstre mot høyre uansett nivå", "Alle nodene samtidig"], answer: 0,
        explain: "En operator trenger resultatet fra barna sine. Bladene er relasjonene, roten gir svaret." },
      { q: "Hva står i bladene i et RA-tre?",
        options: ["Relasjonene (tabellene)", "Betingelsene", "Operatorene π og σ", "Kolonnenavnene"], answer: 0,
        explain: "Bladene er relasjonsnavn. Operatorene står i de indre nodene, med betingelser og attributtlister i senket skrift." },
      { q: "Hvor mange barn har ⋈-noden i treet?",
        options: ["To", "Én", "Null", "Så mange som det finnes felles kolonner"], answer: 0,
        explain: "×, ⋈, ∪, ∩ og ∖ er binære (to argumenter). π, σ og ρ er unære (ett argument)." }
    ],
    sql: [
      { q: "Hvilket RA-uttrykk svarer til spørringen?",
        render: function (n) { IN.sqlBlock(n, "SELECT navn\nFROM Student\nWHERE by = 'Oslo';"); },
        options: ["π<sub>navn</sub>(σ<sub>by = 'Oslo'</sub>(Student))", "σ<sub>navn</sub>(π<sub>by = 'Oslo'</sub>(Student))", "σ<sub>by = 'Oslo'</sub>(π<sub>navn</sub>(Student))", "π<sub>navn, by</sub>(Student)"], answer: 0,
        explain: "SELECT blir π, WHERE blir σ, FROM blir relasjonen. π står ytterst. σ inn i π-en ville ikke fungert, fordi by da allerede er borte." },
      { q: "Hvilket RA-uttrykk svarer til spørringen?",
        render: function (n) { IN.sqlBlock(n, "SELECT s.navn, t.kode\nFROM Student AS s, Tatt AS t\nWHERE s.snr = t.snr AND t.kar = 'A';"); },
        options: ["π<sub>navn, kode</sub>(σ<sub>Student.snr = Tatt.snr ∧ kar = 'A'</sub>(Student × Tatt))", "π<sub>navn, kode</sub>(Student × Tatt)", "σ<sub>kar = 'A'</sub>(Student) ⋈ Tatt", "π<sub>navn, kode</sub>(σ<sub>kar = 'A'</sub>(Student ∪ Tatt))"], answer: 0,
        explain: "Flere tabeller i FROM blir ×, og WHERE blir σ over produktet. Det samme kan skrives med join: <span class=\"mono\">π<sub>navn, kode</sub>(σ<sub>kar = 'A'</sub>(Student ⋈<sub>Student.snr = Tatt.snr</sub> Tatt))</span>." },
      { q: "Hvilken SQL svarer til <span class=\"mono\">π<sub>snr</sub>(Student) ∖ π<sub>snr</sub>(Tatt)</span>?",
        options: ["SELECT snr FROM Student EXCEPT SELECT snr FROM Tatt;", "SELECT snr FROM Student UNION SELECT snr FROM Tatt;", "SELECT snr FROM Student, Tatt WHERE Student.snr != Tatt.snr;", "SELECT snr FROM Student INTERSECT SELECT snr FROM Tatt;"], answer: 0,
        explain: "Differanse er <span class=\"mono\">EXCEPT</span>. Svaret med <span class=\"mono\">!=</span> over produktet gir alle studenter som har minst én rad i Tatt med et <i>annet</i> snr, som er noe helt annet." },
      { q: "<span class=\"mono\">SELECT by FROM Student;</span> gir 4 rader. Hvor mange gir <span class=\"mono\">π<sub>by</sub>(Student)</span>?",
        options: ["3", "4", "1", "Det kommer an på rekkefølgen"], answer: 0,
        explain: "SQL gir en multimengde og beholder begge Oslo-radene. RA gir en mengde. π svarer egentlig til <span class=\"mono\">SELECT DISTINCT</span>." },
      { q: "Hva kan <b>ikke</b> uttrykkes med operatorene i kursets relasjonsalgebra?",
        options: ["Antall emner per student (GROUP BY og count)", "Studenter som ikke har tatt noe emne", "Navn på studenter med A", "Studenter som har tatt både IN2090 og IN2010"], answer: 0,
        explain: "Kursets RA har π, σ, ρ, ×, ⋈, ∪, ∩ og ∖. Aggregering, sortering og ytre join finnes bare i SQL i dette kurset." }
    ]
  };

  var tf = [
    { fane: "grunnlag", s: "En operator i relasjonsalgebra endrer tabellene i databasen.", answer: false, explain: "Operatorene gir nye relasjoner og lar de opprinnelige stå urørt." },
    { fane: "grunnlag", s: "Relasjonsalgebra er mengdebasert, så et resultat har aldri to like rader.", answer: true, explain: "Duplikater forsvinner. SQL er multimengdebasert og trenger DISTINCT for det samme." },
    { fane: "unaere", s: "σ kan fjerne kolonner.", answer: false, explain: "σ fjerner rader og beholder alle kolonnene. Kolonner fjernes med π." },
    { fane: "unaere", s: "π<sub>a</sub>(R) kan ha færre rader enn R.", answer: true, explain: "Rader som blir like etter projeksjonen, telles bare én gang." },
    { fane: "unaere", s: "ρ<sub>A→B</sub>(R) omdøper B til A.", answer: false, explain: "Pilen går fra gammelt til nytt navn: A blir til B." },
    { fane: "join", s: "Naturlig join mellom to relasjoner uten felles attributtnavn gir en tom relasjon.", answer: false, explain: "Den gir kryssproduktet. Det er fellen: uttrykket er lovlig, men svaret blir altfor stort." },
    { fane: "join", s: "Naturlig join kobler på alle attributter som heter det samme, også dem du ikke tenkte på.", answer: true, explain: "Heter to kolonner tilfeldigvis det samme (som navn), kobles det på dem også. Bruk ρ eller join med betingelse." },
    { fane: "join", s: "R ⋈<sub>θ</sub> S er det samme som σ<sub>θ</sub>(R × S).", answer: true, explain: "Det er definisjonen av join med betingelse i kurset." },
    { fane: "mengde", s: "R ∖ S og S ∖ R gir alltid det samme.", answer: false, explain: "Differanse er ikke symmetrisk. R ∖ S er det som finnes i R, men ikke i S." },
    { fane: "mengde", s: "∪, ∩ og ∖ krever at begge relasjonene har samme signatur.", answer: true, explain: "Samme attributtnavn og typer. Bruk π og ρ for å få det til." },
    { fane: "mengde", s: "σ<sub>kode = 'IN2090' ∧ kode = 'IN2010'</sub>(Tatt) gir studentene som har tatt begge emnene.", answer: false, explain: "En rad har bare én kode, så svaret er tomt. Bruk ∩ av to projeksjoner." },
    { fane: "tre", s: "I et RA-tre er roten den siste operasjonen som utføres.", answer: true, explain: "Treet evalueres nedenfra og opp, så roten gir sluttresultatet." },
    { fane: "sql", s: "SELECT k FROM t WHERE u svarer til π<sub>k</sub>(σ<sub>u</sub>(t)), bortsett fra duplikater.", answer: true, explain: "SQL beholder duplikater, RA gjør det ikke. Med DISTINCT blir de like." },
    { fane: "sql", s: "Kursets relasjonsalgebra har en egen operator for ytre join.", answer: false, explain: "Ytre join finnes bare i SQL i dette kurset (LEFT, RIGHT og FULL JOIN)." }
  ];

  /* Fasit står først i kildeteksten over. Flytt den til en fast, varierende plass (deterministisk,
     så lagrede svar fortsatt passer). */
  Object.keys(quiz).forEach(function (f, fi) {
    quiz[f].forEach(function (q, i) {
      var len = q.options.length, k = (i * 3 + fi + 1) % len, s = (len - k) % len;
      q.options = q.options.slice(s).concat(q.options.slice(0, s));
      q.answer = (q.answer - s + len) % len;
    });
  });

  IN.dataRa = { db: db, presets: presets, joinCases: joinCases, setCases: setCases, forAlleCases: forAlleCases, ovinger: ovinger, quiz: quiz, tf: tf, faner: faner };
})();
