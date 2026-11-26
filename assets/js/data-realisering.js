/* ============================================================
   IN2090 guide · data-realisering.js
   Blokk 2 · Realisering (ER-diagram → relasjonsskjema): ER-figurer (plan/format.md § 4),
   skjemaer i kursets notasjon, stegene for hele festivaleksemplet, pseudokode for
   algoritmen, «Hvor havner fremmednøkkelen?», quiz og sant/usant.
   Alt fagstoff er formulert med egne ord (plan/innhold/02-realisering.md). Festivalen og de
   andre eksemplene er laget for guiden og finnes ikke i kursmaterialet.
   Konvensjon i figurene: ledd[].kard står på streken mellom den entiteten og romben
   (rett ved romben). total: true = dobbel strek på den samme streken.
   Skjema: T(navn, attributter, KN-liste, PN, FN-liste), FN = [[fra…], måltabell, [mål…]].
   Klassisk script, lastes etter core.js og viz-er.js. Setter IN.dataReal.
   Avhenger ikke av data-er.js.
   ============================================================ */
(function () {
  "use strict";
  var IN = (window.IN = window.IN || {});

  function K(ref) { return { ref: ref, egneOrd: true }; }
  function t(eli5, normal, teknisk) { return { eli5: eli5, normal: normal, teknisk: teknisk }; }
  function T(navn, attr, kn, pn, fn, notat) {
    return { navn: navn, attr: attr, kn: kn, pn: pn, fn: fn || [], notat: notat || null };
  }

  /* ---------- Figurer ---------- */
  var FIG_FESTIVAL = {
    entiteter: [
      { id: "PLATESELSKAP", navn: "PLATESELSKAP", svak: false, pos: [0, 0],
        attr: [ { navn: "Orgnr", nokkel: true }, { navn: "Navn" } ] },
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [2, 0],
        attr: [ { navn: "Artistnr", nokkel: true }, { navn: "Kunstnernavn", nokkel: true },
                { navn: "Land" }, { navn: "Sjanger", flerverdi: true } ] },
      { id: "KONSERT", navn: "KONSERT", svak: true, pos: [4, 0],
        attr: [ { navn: "Start", delvisNokkel: true, ang: -95 }, { navn: "Slutt", ang: -35 },
                { navn: "Varighet", avledet: true, ang: 15 } ] },
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [2, 2],
        attr: [ { navn: "Epost", nokkel: true },
                { navn: "Navn", deler: [ { navn: "Fornavn" }, { navn: "Etternavn" } ] },
                { navn: "Fdato" }, { navn: "Alder", avledet: true } ] },
      { id: "SCENE", navn: "SCENE", svak: false, pos: [4, 2],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Kapasitet" } ] },
      { id: "OPPGAVE", navn: "OPPGAVE", svak: false, pos: [3, 4],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Beskrivelse", ang: 135 } ] }
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
    merknad: "Festivalen fra blokk 1. Antakelse: artister og frivillige trenger ikke delta i SPILLER, SJEF eller VAKT."
  };

  var FIG_SCENE_KONSERT = {
    entiteter: [
      { id: "SCENE", navn: "SCENE", svak: false, pos: [0, 0],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Kapasitet" } ] },
      { id: "KONSERT", navn: "KONSERT", svak: true, pos: [2, 0],
        attr: [ { navn: "Start", delvisNokkel: true }, { navn: "Slutt" } ] }
    ],
    relasjoner: [
      { id: "PA", navn: "PÅ", identifiserende: true, pos: [1, 0],
        ledd: [ { entitet: "SCENE", kard: "1", total: false },
                { entitet: "KONSERT", kard: "N", total: true } ], attr: [] }
    ],
    merknad: "KONSERT er svak med SCENE som identifiserende entitet. Det gir PN {Scene, Start} og FN til Scene."
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
    merknad: "To uavhengige nøkler på FRIVILLIG. FESTIVALPASS har én sammensatt nøkkel (Passkode med delene År og Løpenr)."
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

  var FIG_SJEF = {
    entiteter: [
      { id: "SCENE", navn: "SCENE", svak: false, pos: [0, 0],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Kapasitet" } ] },
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [2, 0],
        attr: [ { navn: "Epost", nokkel: true }, { navn: "Fornavn" }, { navn: "Etternavn" }, { navn: "Fdato" } ] }
    ],
    relasjoner: [
      { id: "SJEF", navn: "SJEF", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "SCENE", kard: "1", total: true },
                { entitet: "FRIVILLIG", kard: "1", total: false } ],
        attr: [] }
    ],
    merknad: "1:1. Dobbel strek ved SCENE: hver scene har nøyaktig én sjef. Enkel strek ved FRIVILLIG: de fleste frivillige er ikke sjef."
  };

  var FIG_ARMBAND = {
    entiteter: [
      { id: "PASS", navn: "FESTIVALPASS", svak: false, pos: [0, 0.3],
        attr: [ { navn: "Passkode", nokkel: true, ang: -90, deler: [ { navn: "År" }, { navn: "Løpenr" } ] },
                { navn: "Type", ang: 90 } ] },
      { id: "ARMBAND", navn: "ARMBÅND", svak: false, pos: [2, 0.3],
        attr: [ { navn: "Chipid", nokkel: true }, { navn: "Farge" } ] }
    ],
    relasjoner: [
      { id: "BARER", navn: "BÆRER", identifiserende: false, pos: [1, 0.3],
        ledd: [ { entitet: "PASS", kard: "1", total: true },
                { entitet: "ARMBAND", kard: "1", total: true } ],
        attr: [] }
    ],
    merknad: "1:1 med dobbel strek på begge sider: hvert pass har nøyaktig ett armbånd, og hvert armbånd hører til nøyaktig ett pass."
  };

  var FIG_KONTRAKT = {
    entiteter: [
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [0, 0],
        attr: [ { navn: "Artistnr", nokkel: true },
                { navn: "Kunstnernavn", nokkel: true },
                { navn: "Land" } ] },
      { id: "PLATESELSKAP", navn: "PLATESELSKAP", svak: false, pos: [2, 0],
        attr: [ { navn: "Orgnr", nokkel: true }, { navn: "Navn" } ] }
    ],
    relasjoner: [
      { id: "KONTRAKT", navn: "KONTRAKT", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "ARTIST", kard: "N", total: false },
                { entitet: "PLATESELSKAP", kard: "1", total: true } ],
        attr: [ { navn: "Signert", ang: 90 } ] }
    ],
    merknad: "1:N. N ved ARTIST og 1 ved PLATESELSKAP: hver artist har høyst ett plateselskap. Signert er et relasjonsattributt."
  };

  var FIG_MN = {
    entiteter: [
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [1, 0.2],
        attr: [ { navn: "Artistnr", nokkel: true, ang: 90 } ] },
      { id: "KONSERT", navn: "KONSERT", svak: true, pos: [3, 0.2],
        attr: [ { navn: "Start", delvisNokkel: true, ang: -60 }, { navn: "Slutt", ang: 0 } ] },
      { id: "SCENE", navn: "SCENE", svak: false, pos: [3, 1.6],
        attr: [ { navn: "Navn", nokkel: true, ang: 0 } ] }
    ],
    relasjoner: [
      { id: "OPPVARMING", navn: "OPPVARMING", identifiserende: false, pos: [0, 0.2],
        ledd: [ { entitet: "ARTIST", kard: "N", total: false, rolle: "hovedartist" },
                { entitet: "ARTIST", kard: "M", total: false, rolle: "oppvarmer" } ],
        attr: [] },
      { id: "SPILLER", navn: "SPILLER", identifiserende: false, pos: [2, 0.2],
        ledd: [ { entitet: "ARTIST", kard: "M", total: false },
                { entitet: "KONSERT", kard: "N", total: true } ],
        attr: [ { navn: "Honorar", ang: -90 } ] },
      { id: "PA", navn: "PÅ", identifiserende: true, pos: [3, 0.9],
        ledd: [ { entitet: "SCENE", kard: "1", total: false },
                { entitet: "KONSERT", kard: "N", total: true } ], attr: [] }
    ],
    merknad: "SPILLER er M:N med Honorar på romben. OPPVARMING er rekursiv M:N med rollenavn. KONSERT er svak, så FN-en til den blir sammensatt."
  };

  var FIG_FLERVERDI = {
    entiteter: [
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [0, 0],
        attr: [ { navn: "Artistnr", nokkel: true, ang: -90 }, { navn: "Sjanger", flerverdi: true, ang: 90 } ] },
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [1.4, 0],
        attr: [ { navn: "Epost", nokkel: true, ang: -90 }, { navn: "Språk", flerverdi: true, ang: 90 } ] }
    ],
    relasjoner: [],
    merknad: "Sjanger og Språk er flerverdiattributter (dobbel oval). Hvert av dem blir en egen tabell."
  };

  var FIG_TERNAER = {
    entiteter: [
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [0, 0],
        attr: [ { navn: "Epost", nokkel: true } ] },
      { id: "SCENE", navn: "SCENE", svak: false, pos: [2, 0],
        attr: [ { navn: "Navn", nokkel: true } ] },
      { id: "OPPGAVE", navn: "OPPGAVE", svak: false, pos: [1, 2],
        attr: [ { navn: "Navn", nokkel: true }, { navn: "Beskrivelse", ang: 135 } ] }
    ],
    relasjoner: [
      { id: "VAKT", navn: "VAKT", identifiserende: false, pos: [1, 1],
        ledd: [ { entitet: "FRIVILLIG", kard: "M", total: false },
                { entitet: "SCENE", kard: "N", total: false },
                { entitet: "OPPGAVE", kard: "1", total: true } ],
        attr: [ { navn: "Timer", ang: 0 } ] }
    ],
    merknad: "1 ved OPPGAVE: gitt (frivillig, scene) høyst én oppgave. M og N ved de to andre."
  };

  /* Små figurer til «Hvor havner fremmednøkkelen?» */
  var FIG_TEAM = {
    entiteter: [
      { id: "FRIVILLIG", navn: "FRIVILLIG", svak: false, pos: [0, 0], attr: [ { navn: "Epost", nokkel: true } ] },
      { id: "TEAM", navn: "TEAM", svak: false, pos: [2, 0], attr: [ { navn: "Teamnavn", nokkel: true } ] }
    ],
    relasjoner: [
      { id: "MEDLEM_AV", navn: "MEDLEM_AV", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "FRIVILLIG", kard: "N", total: true },
                { entitet: "TEAM", kard: "1", total: false } ], attr: [] }
    ]
  };
  var FIG_SPILLER_ENKEL = {
    entiteter: [
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [0, 0], attr: [ { navn: "Artistnr", nokkel: true } ] },
      { id: "KONSERT", navn: "KONSERT", svak: true, pos: [2, 0],
        attr: [ { navn: "Start", delvisNokkel: true } ] },
      { id: "SCENE", navn: "SCENE", svak: false, pos: [3.4, 0], attr: [ { navn: "Navn", nokkel: true } ] }
    ],
    relasjoner: [
      { id: "SPILLER", navn: "SPILLER", identifiserende: false, pos: [1, 0],
        ledd: [ { entitet: "ARTIST", kard: "M", total: false },
                { entitet: "KONSERT", kard: "N", total: true } ],
        attr: [ { navn: "Honorar", ang: 90 } ] },
      { id: "PA", navn: "PÅ", identifiserende: true, pos: [2.7, 0],
        ledd: [ { entitet: "SCENE", kard: "1", total: false },
                { entitet: "KONSERT", kard: "N", total: true } ], attr: [] }
    ]
  };
  var FIG_OPPVARMING = {
    entiteter: [
      { id: "ARTIST", navn: "ARTIST", svak: false, pos: [1, 0], attr: [ { navn: "Artistnr", nokkel: true } ] }
    ],
    relasjoner: [
      { id: "OPPVARMING", navn: "OPPVARMING", identifiserende: false, pos: [0, 0],
        ledd: [ { entitet: "ARTIST", kard: "N", total: false, rolle: "hovedartist" },
                { entitet: "ARTIST", kard: "M", total: false, rolle: "oppvarmer" } ], attr: [] }
    ]
  };
  function utenAttr(fig) {
    return {
      entiteter: fig.entiteter.map(function (e) { return { id: e.id, navn: e.navn, svak: e.svak, pos: e.pos, attr: (e.attr || []).filter(function (a) { return a.nokkel || a.delvisNokkel; }) }; }),
      relasjoner: fig.relasjoner.map(function (r) { return { id: r.id, navn: r.navn, identifiserende: r.identifiserende, pos: r.pos, ledd: r.ledd, attr: r.attr }; })
    };
  }

  /* ---------- Skjemaer per fane ---------- */
  var S = {};
  S.konsertNotasjon = [
    T("Konsert", ["Scene", "Start", "Slutt"], [["Scene", "Start"]], ["Scene", "Start"], [[["Scene"], "Scene", ["Navn"]]])
  ];
  S.entiteter = [
    T("Frivillig", ["Epost", "Mobil", "Fornavn", "Etternavn", "Fdato"], [["Epost"], ["Mobil"]], ["Epost"], []),
    T("Festivalpass", ["År", "Løpenr", "Type"], [["År", "Løpenr"]], ["År", "Løpenr"], [])
  ];
  S.svake = [
    T("Scene", ["Navn", "Kapasitet"], [["Navn"]], ["Navn"], []),
    T("Konsert", ["Scene", "Start", "Slutt"], [["Scene", "Start"]], ["Scene", "Start"], [[["Scene"], "Scene", ["Navn"]]]),
    T("Låtplass", ["Scene", "Start", "Nr", "Låttittel"], [["Scene", "Start", "Nr"]], ["Scene", "Start", "Nr"],
      [[["Scene", "Start"], "Konsert", ["Scene", "Start"]]])
  ];
  S.sjef = [
    T("Frivillig", ["Epost", "Fornavn", "Etternavn", "Fdato"], [["Epost"]], ["Epost"], []),
    T("Scene", ["Navn", "Kapasitet", "Sjef"], [["Navn"], ["Sjef"]], ["Navn"], [[["Sjef"], "Frivillig", ["Epost"]]])
  ];
  S.armband = [
    T("Festivalpass", ["År", "Løpenr", "Type", "Chipid", "Farge"], [["År", "Løpenr"], ["Chipid"]], ["År", "Løpenr"], [])
  ];
  S.kontrakt1 = [
    T("Artist", ["Artistnr", "Kunstnernavn", "Land", "Plateselskap", "Signert"], [["Artistnr"], ["Kunstnernavn"]], ["Artistnr"],
      [[["Plateselskap"], "Plateselskap", ["Orgnr"]]]),
    T("Plateselskap", ["Orgnr", "Navn"], [["Orgnr"]], ["Orgnr"], [])
  ];
  S.kontrakt2 = [
    T("Artist", ["Artistnr", "Kunstnernavn", "Land"], [["Artistnr"], ["Kunstnernavn"]], ["Artistnr"], []),
    T("Plateselskap", ["Orgnr", "Navn"], [["Orgnr"]], ["Orgnr"], []),
    T("Kontrakt", ["Artist", "Plateselskap", "Signert"], [["Artist"]], ["Artist"],
      [[["Artist"], "Artist", ["Artistnr"]], [["Plateselskap"], "Plateselskap", ["Orgnr"]]])
  ];
  S.mn = [
    T("Spiller", ["Artist", "Scene", "Start", "Honorar"], [["Artist", "Scene", "Start"]], ["Artist", "Scene", "Start"],
      [[["Artist"], "Artist", ["Artistnr"]], [["Scene", "Start"], "Konsert", ["Scene", "Start"]]]),
    T("Oppvarming", ["Hovedartist", "Oppvarmer"], [["Hovedartist", "Oppvarmer"]], ["Hovedartist", "Oppvarmer"],
      [[["Hovedartist"], "Artist", ["Artistnr"]], [["Oppvarmer"], "Artist", ["Artistnr"]]])
  ];
  S.flerverdi = [
    T("Sjanger", ["Artist", "Sjanger"], [["Artist", "Sjanger"]], ["Artist", "Sjanger"], [[["Artist"], "Artist", ["Artistnr"]]]),
    T("Språk", ["Frivillig", "Språk"], [["Frivillig", "Språk"]], ["Frivillig", "Språk"], [[["Frivillig"], "Frivillig", ["Epost"]]])
  ];
  var VAKT_FN = [[["Frivillig"], "Frivillig", ["Epost"]], [["Scene"], "Scene", ["Navn"]], [["Oppgave"], "Oppgave", ["Navn"]]];
  S.naereA = [
    T("Oppgave", ["Navn", "Beskrivelse"], [["Navn"]], ["Navn"], []),
    T("Vakt", ["Frivillig", "Scene", "Oppgave", "Timer"], [["Frivillig", "Scene"]], ["Frivillig", "Scene"], VAKT_FN)
  ];
  S.naereB = [
    T("Vakt", ["Frivillig", "Scene", "Oppgave", "Timer"], [["Frivillig", "Scene"], ["Frivillig", "Oppgave"]], ["Frivillig", "Scene"], VAKT_FN)
  ];
  S.naereC = [
    T("Vakt", ["Frivillig", "Scene", "Oppgave", "Timer"], [["Frivillig", "Scene", "Oppgave"]], ["Frivillig", "Scene", "Oppgave"], VAKT_FN)
  ];
  S.subA = [
    T("Gjest", ["Gid", "Navn"], [["Gid"]], ["Gid"], []),
    T("Vip", ["Gid", "Bord"], [["Gid"]], ["Gid"], [[["Gid"], "Gjest", ["Gid"]]]),
    T("Presse", ["Gid", "Medium"], [["Gid"]], ["Gid"], [[["Gid"], "Gjest", ["Gid"]]])
  ];
  S.subB = [
    T("Gjest", ["Gid", "Navn", "Bord", "Medium"], [["Gid"]], ["Gid"], [])
  ];
  S.subC = [
    T("Gjest", ["Gid", "Navn"], [["Gid"]], ["Gid"], []),
    T("Vip", ["Vipnr", "Gid", "Bord"], [["Vipnr"]], ["Vipnr"], [[["Gid"], "Gjest", ["Gid"]]]),
    T("Presse", ["Pressenr", "Gid", "Medium"], [["Pressenr"]], ["Pressenr"], [[["Gid"], "Gjest", ["Gid"]]])
  ];

  /* ---------- Hele festivalen, tabell for tabell ---------- */
  var F = {
    plateselskap: T("Plateselskap", ["Orgnr", "Navn"], [["Orgnr"]], ["Orgnr"], []),
    artist0: T("Artist", ["Artistnr", "Kunstnernavn", "Land"], [["Artistnr"], ["Kunstnernavn"]], ["Artistnr"], []),
    artist: T("Artist", ["Artistnr", "Kunstnernavn", "Land", "Plateselskap"], [["Artistnr"], ["Kunstnernavn"]], ["Artistnr"],
      [[["Plateselskap"], "Plateselskap", ["Orgnr"]]]),
    frivillig: T("Frivillig", ["Epost", "Fornavn", "Etternavn", "Fdato"], [["Epost"]], ["Epost"], []),
    scene0: T("Scene", ["Navn", "Kapasitet"], [["Navn"]], ["Navn"], []),
    scene: T("Scene", ["Navn", "Kapasitet", "Sjef"], [["Navn"], ["Sjef"]], ["Navn"], [[["Sjef"], "Frivillig", ["Epost"]]]),
    oppgave: T("Oppgave", ["Navn", "Beskrivelse"], [["Navn"]], ["Navn"], []),
    konsert: T("Konsert", ["Scene", "Start", "Slutt"], [["Scene", "Start"]], ["Scene", "Start"], [[["Scene"], "Scene", ["Navn"]]]),
    spiller: S.mn[0],
    sjanger: S.flerverdi[0],
    vakt: S.naereA[1]
  };
  S.festival = [F.plateselskap, F.artist, F.frivillig, F.scene, F.oppgave, F.konsert, F.spiller, F.sjanger, F.vakt];

  var REGLER = {
    start: "Start", entitet: "Regel 1 · vanlig entitet", svak: "Regel 2 · svak entitet", "1:1": "Regel 3 · 1:1-relasjon",
    "1:N": "Regel 4 · 1:N-relasjon", "M:N": "Regel 5 · M:N-relasjon", flerverdi: "Regel 6 · flerverdiattributt",
    "n-ær": "Regel 7 · ternær / n-ær relasjon", ferdig: "Kontroll"
  };

  var STEG = [
    { regel: "start", line: 1, tag: "Start",
      hl: null,
      text: t("Her er tegningen av festivalen fra blokk 1. Vi skal bygge den om til regneark, ett ark om gangen, i en fast rekkefølge. Arkene dukker opp under tegningen etter hvert.",
              "Vi realiserer festivalen fra blokk 1 med kursets algoritme. Skjemaet under figuren vokser tabell for tabell. Den nyeste tabellen er markert, og ER-elementene steget gjelder, er uthevet i figuren.",
              "Algoritmen tar elementene i fast rekkefølge: vanlige entiteter, svake entiteter, 1:1, 1:N, M:N, flerverdiattributter og til slutt n-ære relasjoner. Rekkefølgen sørger for at hver fremmednøkkel peker på en tabell som allerede finnes. Der vi kan velge, velger vi det som gir færrest tabeller og NULL-verdier.") },
    { regel: "entitet", line: 3, tag: "PLATESELSKAP",
      hl: { e: ["PLATESELSKAP"] }, add: F.plateselskap,
      text: t("Plateselskapet blir et ark med to kolonner: organisasjonsnummer og navn. Nummeret er unikt, så det blir nøkkelen.",
              "PLATESELSKAP blir <span class=\"mono\">Plateselskap(Orgnr, Navn)</span>. Orgnr er den eneste nøkkelen i figuren, så den blir både KN og PN.",
              "En vanlig entitet gir én tabell med de enkle attributtene som kolonner. Hver nøkkel i figuren blir en kandidatnøkkel. Her finnes bare én, og den velges som primærnøkkel.") },
    { regel: "entitet", line: 3, tag: "ARTIST",
      hl: { e: ["ARTIST"], wait: ["Sjanger"] }, add: F.artist0,
      text: t("Artisten har to ting som er unike: nummeret og kunstnernavnet. Begge blir nøkler, men vi må velge én som «hovednøkkel». Sjangrene er en liste, og den får ikke plass i én rute, så den venter.",
              "ARTIST har to uavhengige nøkler, så tabellen får to KN-er: {Artistnr} og {Kunstnernavn}. Vi velger {Artistnr} som PN, men skriver begge KN-ene. Sjanger er et flerverdiattributt og venter til regel 6.",
              "To understrekede ovaler betyr to kandidatnøkler, ikke én sammensatt. Valget av PN påvirker bare hva fremmednøklene peker på. Flerverdiattributtet kan ikke bli en kolonne her, for da ville én celle måtte inneholde flere verdier (brudd på 1NF).") },
    { regel: "entitet", line: 3, tag: "FRIVILLIG",
      hl: { e: ["FRIVILLIG"], a: ["Fornavn", "Etternavn"], drop: ["Alder"] }, add: F.frivillig,
      text: t("Navnet er delt i fornavn og etternavn, så det blir to kolonner. Alderen kan vi regne ut fra fødselsdatoen, så den trenger ikke egen kolonne.",
              "<span class=\"mono\">Frivillig(Epost, Fornavn, Etternavn, Fdato)</span>. Navn er sammensatt, så bare bladene Fornavn og Etternavn blir kolonner. Alder er utledbar og droppes (rødt i figuren).",
              "Et sammensatt attributt flates ut til bladnodene, og selve forelderen forsvinner. Det utledbare attributtet droppes fordi det ville gitt dobbeltlagring som kan bli inkonsistent: Alder kan alltid regnes ut fra Fdato og dagens dato.") },
    { regel: "entitet", line: 3, tag: "SCENE",
      hl: { e: ["SCENE"] }, add: F.scene0,
      text: t("Scenen får et ark med navn og kapasitet. Navnet er unikt.",
              "<span class=\"mono\">Scene(Navn, Kapasitet)</span> med KN og PN {Navn}. Relasjonene til scenen (PÅ, SJEF og VAKT) tas i senere steg.",
              "Entitetstabellene lages først fordi alle de senere stegene trenger PN-ene deres. Relasjonene rundt SCENE venter til sin regel i rekkefølgen.") },
    { regel: "entitet", line: 3, tag: "OPPGAVE",
      hl: { e: ["OPPGAVE"] }, add: F.oppgave,
      text: t("Oppgaven (bar, sikkerhet, rigg) får et ark med navn og beskrivelse.",
              "<span class=\"mono\">Oppgave(Navn, Beskrivelse)</span> med KN og PN {Navn}. Nå har alle de fem vanlige entitetene fått en tabell.",
              "Fem vanlige entiteter gir fem tabeller. Den svake entiteten KONSERT er ikke med ennå, fordi den trenger PN-en til den identifiserende entiteten SCENE.") },
    { regel: "svak", line: 6, tag: "KONSERT og PÅ",
      hl: { e: ["KONSERT", "PÅ", "SCENE"], a: ["Start"], drop: ["Varighet"] }, add: F.konsert,
      text: t("Klokkeslettet til en konsert er bare unikt på én scene. Derfor skriver vi både scenen og starttiden på konsertarket. Scenen peker tilbake til scenearket. Den doble romben PÅ er da ferdig, den trenger ikke eget ark.",
              "<span class=\"mono\">Konsert(Scene, Start, Slutt)</span>: PN = PN-en til den identifiserende entiteten (Scene) + den svake nøkkelen (Start). Scene er også FN til Scene(Navn). Den identifiserende relasjonen PÅ er dermed realisert og får ingen egen tabell. Varighet er utledbar og droppes.",
              "Start er ikke unik alene, så den må kombineres med PN-en til den identifiserende entiteten for å bli en KN. FN-en blir aldri NULL, fordi en svak entitet alltid har nøyaktig én identifiserende entitet. Å realisere PÅ en gang til, som egen tabell eller ekstra FN, gir trekk (−2 i H2019, −0,5 i H2020).") },
    { regel: "1:1", line: 12, tag: "SJEF",
      hl: { e: ["SJEF", "SCENE", "FRIVILLIG"] }, set: F.scene, nye: ["Sjef"],
      text: t("Hver scene har nøyaktig én sjef, men de fleste frivillige er ikke sjef. Skriver vi sjefen på scenearket, blir alle rutene fylt. Skriver vi scenen på frivilligarket, blir mange ruter tomme.",
              "SJEF er 1:1. SCENE har dobbel strek, så FN-en legges i Scene: kolonnen <span class=\"mono\">Sjef</span> peker på Frivillig(Epost). Den er unik (1:1) og aldri NULL (total), og er derfor også en KN. Sammensmelting er ikke lov, fordi FRIVILLIG er partiell.",
              "FN på den totale siden gir ingen NULL. Fordi relasjonen er 1:1, kan samme e-post ikke stå på to scener, så {Sjef} er unik og aldri NULL, altså en kandidatnøkkel. FN på den partielle siden ville gitt NULL for alle som ikke er sjef, og da kunne kolonnen ikke vært en KN.") },
    { regel: "1:N", line: 14, tag: "KONTRAKT",
      hl: { e: ["KONTRAKT", "ARTIST", "PLATESELSKAP"] }, set: F.artist, nye: ["Plateselskap"],
      text: t("Hver artist har høyst ett plateselskap, så det får plass i én rute på artistarket. Et plateselskap har mange artister, og de får ikke plass i én rute.",
              "KONTRAKT er 1:N, og ARTIST har N på sin strek. FN-en legges derfor i Artist: kolonnen <span class=\"mono\">Plateselskap</span> peker på Plateselskap(Orgnr). Det gir én tabell mindre, mot NULL for artister uten kontrakt.",
              "Siden med N på sin egen strek har høyst én partner, så FN-en får plass der. Den er ikke en KN, fordi mange artister kan ha samme plateselskap. Alternativet er en egen tabell med PN = {Artist}. Begge godtas når valget er forklart.") },
    { regel: "M:N", line: 16, tag: "SPILLER",
      hl: { e: ["SPILLER", "ARTIST", "KONSERT"], a: ["Honorar"] }, add: F.spiller,
      text: t("En artist spiller på mange konserter, og en konsert har mange artister. Ingen av arkene har plass til en liste, så vi lager et nytt ark der hver rad er ett par: denne artisten på denne konserten, med honoraret.",
              "SPILLER er M:N og blir alltid en egen tabell. PN er alle FN-attributtene: {Artist, Scene, Start}. FN-en til Konsert er sammensatt, fordi Konsert har PN {Scene, Start}. Honorar er en vanlig kolonne.",
              "Relasjonen er en mengde par, så samme par kan ikke forekomme to ganger. Derfor er alle FN-kolonnene sammen PN. Honorar avhenger av hele paret og er aldri en del av nøkkelen. FN-en må peke på hele PN-en i Konsert, ikke bare på Start.") },
    { regel: "flerverdi", line: 18, tag: "Sjanger",
      hl: { e: ["ARTIST"], a: ["Sjanger"] }, add: F.sjanger,
      text: t("Nå tar vi listen over sjangre. Den får et eget ark der hver rad er én artist og én sjanger.",
              "Sjanger blir <span class=\"mono\">Sjanger(Artist, Sjanger)</span> med FN til Artist. KN er alle attributtene: {Artist, Sjanger}. Samme artist kan stå i mange rader, men hvert par bare én gang.",
              "Flerverdiattributtet flyttes ut for at hver celle skal ha én atomær verdi (1NF). Både artisten og sjangeren gjentas på tvers av rader, så det er bare paret som er unikt.") },
    { regel: "n-ær", line: 20, tag: "VAKT",
      hl: { e: ["VAKT", "FRIVILLIG", "SCENE", "OPPGAVE"], a: ["Timer"] }, add: F.vakt,
      text: t("En vakt er alltid hvem, hvor og hva. En frivillig har bare én oppgave på hver scene, så det holder å vite hvem og hvor for å finne raden.",
              "VAKT er ternær og blir alltid en egen tabell med FN til alle tre. 1 ved OPPGAVE betyr at frivillig og scene bestemmer oppgaven, så KN = {Frivillig, Scene}. Timer er en vanlig kolonne.",
              "1 ved OPPGAVE uttrykker FD-en (frivillig, scene) → oppgave. Da er {Frivillig, Scene} en supernøkkel, og den er minimal fordi både frivillig og scene kan gjentas. Oppgave kan ikke være med i KN-en, for da er den ikke minimal.") },
    { regel: "ferdig", line: 21, tag: "Ferdig · 9 tabeller",
      hl: null,
      text: t("Ferdig! Ni ark. Sjekk at alle bokser og romber er tatt med, og at ingen er tatt med to ganger. Skriv en kort lapp om hvert valg.",
              "Ni tabeller: fem entiteter, Konsert, Spiller, Sjanger og Vakt. PÅ, SJEF og KONTRAKT er realisert med fremmednøkler. Kontroller: har hver tabell en PN, peker hver FN på en KN, og er hver relasjon realisert nøyaktig én gang?",
              "Skjemaet er korrekt og effektivt, men bare 1NF er garantert. ER kan ikke uttrykke alle funksjonelle avhengigheter, så det kan finnes FD-er i domenet som ingen nøkkel fanger opp. Skjemaet håndhever heller ikke total deltakelse på den refererte siden, for eksempel at hvert plateselskap har minst én artist.") }
  ];
  (function snap() {
    var cur = [];
    STEG.forEach(function (s) {
      if (s.add) cur = cur.concat([s.add]);
      if (s.set) cur = cur.map(function (x) { return x.navn === s.set.navn ? s.set : x; });
      s.tabeller = cur.slice();
      s.ny = s.add ? s.add.navn : s.set ? s.set.navn : null;
      s.regelTekst = REGLER[s.regel] || s.regel;
    });
  })();

  /* ---------- Algoritmen som pseudokode (guidens oppsummering av rekkefølgen) ---------- */
  var ALGO = {
    name: "Realiser", params: "ER-modell",
    input: "En ER-modell med entiteter, relasjoner og attributter",
    output: "Et relasjonsskjema med KN, PN og FN for hver tabell",
    lines: [
      { code: "for each vanlig entitet E do", indent: 1,
        eli5: "Først tar vi alle de vanlige boksene, én om gangen.",
        normal: "Regel 1: alle entiteter som ikke er svake.",
        teknisk: "Vanlige entiteter først, fordi alle de senere reglene trenger PN-ene deres." },
      { code: "lag tabell E med de enkle attributtene", indent: 2,
        eli5: "Hver boks blir et ark. Det som kan regnes ut, droppes, og navn med flere deler blir flere kolonner.",
        normal: "Utledbare attributter droppes, sammensatte gir bare bladene, og flerverdiattributter venter til regel 6.",
        teknisk: "Én celle skal ha én verdi (1NF). Derfor flates sammensatte attributter ut, og flerverdiattributter flyttes til egne tabeller senere." },
      { code: "hver nøkkel blir en KN, velg én som PN", indent: 2,
        eli5: "Det som er unikt, blir nøkler. Vi velger én av dem som hovednøkkel.",
        normal: "Skriv alle KN-ene, selv om bare én velges som PN.",
        teknisk: "Valget av PN påvirker bare hva fremmednøklene peker på. Alle KN-ene skal markeres, ellers trekker sensor." },
      { code: "for each svak entitet S do", indent: 1,
        eli5: "Så tar vi de doble boksene, de som trenger en annen boks for å være unike.",
        normal: "Regel 2: svake entiteter. Den identifiserende entiteten må allerede ha en tabell.",
        teknisk: "Er den identifiserende entiteten selv svak, realiseres den først. PN-en vokser da nedover nivåene." },
      { code: "lag tabell S, PN = identifiserendes PN + svak nøkkel", indent: 2,
        eli5: "Arket får både nøkkelen til den andre boksen og sin egen lille nøkkel.",
        normal: "Den svake nøkkelen er bare unik sammen med PN-en til den identifiserende entiteten.",
        teknisk: "Har den svake entiteten flere identifiserende entiteter, kommer PN-en til alle med." },
      { code: "identifiserendes PN er også FN til den", indent: 2,
        eli5: "Kolonnene peker tilbake til arket til den identifiserende entiteten. Da er den doble romben ferdig.",
        normal: "Den identifiserende relasjonen er nå realisert og skal ikke realiseres en gang til.",
        teknisk: "FN-en er aldri NULL, fordi en svak entitet alltid har nøyaktig én identifiserende entitet. Den peker på hele PN-en til den identifiserende entiteten.",
        grense: { q: "Hvorfor får ikke den identifiserende relasjonen en egen tabell?", a: "Fordi koblingen allerede ligger i PN-en til den svake tabellen. En egen tabell eller en ekstra FN lagrer det samme to ganger og gir trekk." } },
      { code: "for each 1:1-relasjon R do", indent: 1,
        eli5: "Nå tar vi forholdene der begge sider har høyst én.",
        normal: "Regel 3: 1:1-relasjoner.",
        teknisk: "1:1 kan realiseres på fire måter: sammensmelting (slå sammen tabellene), FN i den ene tabellen, FN i den andre eller egen tabell." },
      { code: "if begge sider er totale then", indent: 2,
        eli5: "Må begge sider være med?",
        normal: "Sammensmelting er bare lov når begge sider har dobbel strek.",
        teknisk: "Er bare én side total, ville sammensmelting tvinge NULL inn i nøkkelen til den totale siden for alle entiteter på den partielle siden som ikke har partner, og en KN kan aldri være NULL.",
        grense: { q: "Hvorfor holder det ikke at én side er total?", a: "Da finnes det entiteter på den partielle siden uten partner. De ville enten mistet raden sin eller fått NULL i den andre sidens nøkkel." } },
      { code: "smelt sammen tabellene, begge nøklene blir KN", indent: 3,
        eli5: "Da kan de to arkene bli ett.",
        normal: "Én tabell, ingen NULL, og begge entitetenes nøkler blir KN-er.",
        teknisk: "Sammensmelting gir én tabell mindre og ingen NULL. Hver av de opprinnelige nøklene identifiserer fortsatt raden." },
      { code: "else", indent: 2,
        eli5: "Ellers…",
        normal: "Bare én (eller ingen) side er total.",
        teknisk: "Nå må vi velge side for FN-en, eller lage en egen tabell." },
      { code: "FN på den totale siden, og den er også KN", indent: 3,
        eli5: "Skriv partneren på arket til den siden som alltid har en, så blir ingen ruter tomme.",
        normal: "FN-en på den totale siden er unik (1:1) og aldri NULL (total), og er derfor også en KN.",
        teknisk: "Er begge sider partielle, gir hvert valg NULL. Da kan en egen tabell med FN til begge, der hver FN er en KN, være riktig. Skriv hvorfor du velger som du gjør." },
      { code: "for each 1:N-relasjon R do", indent: 1,
        eli5: "Nå tar vi forholdene der den ene siden har mange.",
        normal: "Regel 4: 1:N-relasjoner.",
        teknisk: "FN-en havner på siden der hver entitet høyst har én partner." },
      { code: "FN på N-siden, med relasjonsattributtene", indent: 2,
        eli5: "Den som bare kan ha én partner, får partneren i en rute på sitt eget ark.",
        normal: "N-siden er tabellen til entiteten som har N på sin egen strek. Relasjonsattributtene følger med dit FN-en havner.",
        teknisk: "FN-en er ikke en KN, fordi mange rader kan ha samme verdi. Alternativet er en egen tabell med PN = N-sidens PN.",
        grense: { q: "Hvorfor N-siden og ikke 1-siden?", a: "På 1-siden kan én entitet ha mange partnere, og de får ikke plass i én kolonne. På N-siden har hver entitet høyst én." } },
      { code: "for each M:N-relasjon R do", indent: 1,
        eli5: "Nå tar vi forholdene der begge sider har mange.",
        normal: "Regel 5: M:N-relasjoner, også rekursive.",
        teknisk: "Ingen av entitetstabellene har plass til FN-en, så det må bli en ny tabell." },
      { code: "ny tabell, FN til begge sider, PN = alle FN-ene", indent: 2,
        eli5: "Et nytt ark der hver rad er ett par.",
        normal: "PN er alle FN-attributtene sammen. Relasjonsattributter er vanlige kolonner.",
        teknisk: "Relasjonen er en mengde par, så samme par kan ikke forekomme to ganger. Er en side svak, blir hele den sammensatte PN-en med." },
      { code: "for each flerverdiattributt A do", indent: 1,
        eli5: "Så tar vi listene som ventet.",
        normal: "Regel 6: flerverdiattributter.",
        teknisk: "Steget avhenger bare av at tabellen til entiteten finnes." },
      { code: "ny tabell med entitetens PN og A, KN = alle", indent: 2,
        eli5: "Et nytt ark der hver rad er én entitet og én verdi.",
        normal: "Entitetens PN er FN til entitetens tabell, og alle kolonnene sammen er KN.",
        teknisk: "Både entitet og verdi gjentas på tvers av rader, men aldri samme par. Er attributtet også sammensatt, blir alle bladene kolonner i KN-en." },
      { code: "for each n-ær relasjon R do", indent: 1,
        eli5: "Til slutt forholdene med tre eller flere deltakere.",
        normal: "Regel 7: ternære og n-ære relasjoner.",
        teknisk: "De kan aldri legges som FN i en entitetstabell, fordi 1-tallene gjelder kombinasjoner, ikke enkeltentiteter." },
      { code: "ny tabell, FN til alle, KN etter 1-tallene", indent: 2,
        eli5: "Et nytt ark med én kolonne for hver deltaker.",
        normal: "Mange på alle sider: alle FN-ene er KN. 1 på én side: de andre FN-ene er KN. 1 på flere sider: én KN per slik side.",
        teknisk: "1 ved en side E betyr FD-en «de andre deltakerne → E». De andre FN-ene er da en minimal supernøkkel.",
        grense: { q: "Hvorfor er ikke alle FN-ene KN når det står 1 på én side?", a: "Fordi KN-en må være minimal. Med 1 ved OPPGAVE er {Frivillig, Scene} allerede unik, så Oppgave er overflødig i nøkkelen." } },
      { code: "return skjemaet", indent: 1,
        eli5: "Ferdig. Sjekk at alt er med, og skriv en kort begrunnelse for hvert valg.",
        normal: "Sjekk: PN i hver tabell, hver FN peker på en KN, og hver relasjon er realisert nøyaktig én gang.",
        teknisk: "Resultatet er på minst 1NF, men BCNF er ikke garantert. Det sjekkes med normalisering (blokk 7)." }
    ]
  };

  /* ---------- Instanser (egne eksempeldata) ---------- */
  var INST = {
    konsert: { navn: "Konsert", kolonner: [{ navn: "Scene", pk: true }, { navn: "Start", pk: true }, "Slutt"],
      rader: [["Teltet", "18:00", "19:00"], ["Teltet", "20:00", "21:30"], ["Månescenen", "18:00", "19:15"]],
      caption: "Start 18:00 forekommer to ganger, men paret (Scene, Start) er unikt." },
    sceneSjef: { navn: "Scene (FN i Scene)", kolonner: [{ navn: "Navn", pk: true }, "Kapasitet", { navn: "Sjef", fk: "Frivillig" }],
      rader: [["Teltet", 800, "ada@fest.no"], ["Månescenen", 3000, "bo@fest.no"]],
      caption: "Ingen NULL." },
    frivilligSjef: { navn: "Frivillig (FN i Frivillig, dårligere)", kolonner: [{ navn: "Epost", pk: true }, "…", { navn: "Sjef_for", fk: "Scene" }],
      rader: [["ada@fest.no", "…", "Teltet"], ["bo@fest.no", "…", "Månescenen"], ["cem@fest.no", "…", null], ["dina@fest.no", "…", null]],
      marks: { celler: { "2,2": "hit", "3,2": "hit" } },
      caption: "NULL for alle som ikke er sjef." },
    artist1: { navn: "Artist (valg 1)", kolonner: [{ navn: "Artistnr", pk: true }, "Kunstnernavn", "Land", { navn: "Plateselskap", fk: "Plateselskap" }, "Signert"],
      rader: [[1, "Nordlys", "NO", 900111, "2025-03-01"], [2, "Kai Kvist", "SE", 900111, "2024-11-15"], [3, "Myra", "NO", null, null]],
      marks: { celler: { "2,3": "hit", "2,4": "hit" } },
      caption: "Myra har ingen kontrakt og får NULL i to kolonner." },
    kontrakt2: { navn: "Kontrakt (valg 2)", kolonner: [{ navn: "Artist", pk: true, fk: "Artist" }, { navn: "Plateselskap", fk: "Plateselskap" }, "Signert"],
      rader: [[1, 900111, "2025-03-01"], [2, 900111, "2024-11-15"]],
      caption: "Bare artistene med kontrakt, men én tabell mer." },
    spiller: { navn: "Spiller", kolonner: [{ navn: "Artist", pk: true }, { navn: "Scene", pk: true }, { navn: "Start", pk: true }, "Honorar"],
      rader: [[1, "Teltet", "18:00", 40000], [2, "Teltet", "18:00", 25000], [1, "Månescenen", "18:00", 60000]],
      caption: "To artister på samme konsert og én artist på to konserter er begge lov. Bare samme trippel to ganger er forbudt." },
    sjanger: { navn: "Sjanger", kolonner: [{ navn: "Artist", pk: true }, { navn: "Sjanger", pk: true }],
      rader: [[1, "pop"], [1, "elektronika"], [2, "folk"]],
      caption: "Artist 1 står i to rader, men hvert par bare én gang." },
    vakt: { navn: "Vakt", kolonner: [{ navn: "Frivillig", pk: true }, { navn: "Scene", pk: true }, "Oppgave", "Timer"],
      rader: [["ada@fest.no", "Teltet", "bar", 6], ["ada@fest.no", "Månescenen", "bar", 4], ["cem@fest.no", "Teltet", "bar", 6], ["cem@fest.no", "Månescenen", "sikkerhet", 8]] },
    vaktNei: { navn: "Forsøk på å legge til", kolonner: ["Frivillig", "Scene", "Oppgave", "Timer"],
      rader: [["ada@fest.no", "Teltet", "sikkerhet", 3]], marks: { rader: { 0: "drop" } },
      caption: "Avvist: Ada har allerede en oppgave på Teltet, og {Frivillig, Scene} er en KN." },
    gjest: { navn: "Gjest", kolonner: [{ navn: "Gid", pk: true }, "Navn"], rader: [[1, "Ada"], [2, "Bo"], [3, "Cem"], [4, "Dina"]] },
    vip: { navn: "Vip", kolonner: [{ navn: "Gid", pk: true, fk: "Gjest" }, "Bord"], rader: [[1, 7], [2, 3]] },
    presse: { navn: "Presse", kolonner: [{ navn: "Gid", pk: true, fk: "Gjest" }, "Medium"], rader: [[2, "Radio"], [3, "Avis"]] },
    gjestB: { navn: "Gjest (alt i én tabell)", kolonner: [{ navn: "Gid", pk: true }, "Navn", "Bord", "Medium"],
      rader: [[1, "Ada", 7, null], [2, "Bo", 3, "Radio"], [3, "Cem", null, "Avis"], [4, "Dina", null, null]],
      marks: { celler: { "0,3": "hit", "2,2": "hit", "3,2": "hit", "3,3": "hit" } } },
    vipC: { navn: "Vip (egen nøkkel)", kolonner: [{ navn: "Vipnr", pk: true }, { navn: "Gid", fk: "Gjest" }, "Bord"],
      rader: [[101, 1, 7], [102, 2, 3], [103, 2, 5]], marks: { celler: { "1,1": "hit", "2,1": "hit" } },
      caption: "Gjest 2 står to ganger som VIP. Nøklene stopper det ikke, fordi {Gid} ikke er en KN her." }
  };

  /* ---------- SQL-utdrag (hele) ---------- */
  var SQL = "CREATE TABLE frivillig (\n  epost text PRIMARY KEY,\n  fornavn text,\n  etternavn text,\n  fdato date\n);\n\n" +
    "CREATE TABLE scene (\n  navn text PRIMARY KEY,\n  kapasitet int,\n  sjef text UNIQUE NOT NULL REFERENCES frivillig (epost)\n);\n\n" +
    "CREATE TABLE konsert (\n  scene text REFERENCES scene (navn),\n  start timestamp,\n  slutt timestamp,\n  PRIMARY KEY (scene, start)\n);\n\n" +
    "CREATE TABLE spiller (\n  artist int REFERENCES artist (artistnr),\n  scene text,\n  start timestamp,\n  honorar int,\n  PRIMARY KEY (artist, scene, start),\n  FOREIGN KEY (scene, start) REFERENCES konsert (scene, start)\n);";

  /* ---------- «Hvor havner fremmednøkkelen?» ---------- */
  var FN_OVELSE = [
    { tag: "1:1", fig: utenAttr(FIG_SJEF), tittel: "SJEF",
      q: "Hver scene har nøyaktig én sjef. En frivillig er sjef for høyst én scene. Hvor bør fremmednøkkelen stå?",
      options: ["I Scene", "I Frivillig", "I en egen tabell Sjef", "Slå Scene og Frivillig sammen"], answer: 0,
      explain: "SCENE har dobbel strek, så FN-en i Scene blir aldri NULL. Den er også unik (1:1), og blir dermed en KN. I Frivillig ville de fleste fått NULL. Sammensmelting krever at begge sider er totale. En egen tabell er lov, men gir én tabell mer uten å spare noe." },
    { tag: "1:N", fig: utenAttr(FIG_KONTRAKT), tittel: "KONTRAKT",
      q: "En artist har kontrakt med høyst ett plateselskap. Et plateselskap har minst én og potensielt mange artister. Hvor bør fremmednøkkelen stå?",
      options: ["I Artist", "I Plateselskap", "I en egen tabell Kontrakt", "Slå Artist og Plateselskap sammen"], answer: 0, godta: [2],
      explain: "ARTIST har N på sin strek, så hver artist har høyst én partner, og FN-en får plass i Artist. Det gir én tabell mindre, mot NULL for artister uten kontrakt. En egen tabell med PN {Artist} unngår NULL og godtas også når valget er forklart. I Plateselskap går det ikke: et plateselskap har mange artister." },
    { tag: "M:N", fig: utenAttr(FIG_SPILLER_ENKEL), tittel: "SPILLER",
      q: "En artist kan spille på mange konserter, og en konsert har minst én og potensielt mange artister. Hvor havner fremmednøklene?",
      options: ["I Artist", "I Konsert", "I en egen tabell Spiller", "Slå Artist og Konsert sammen"], answer: 2,
      explain: "M:N gir alltid en egen tabell, fordi begge sider kan ha mange partnere. Spiller får FN til Artist og en sammensatt FN (Scene, Start) til Konsert, og PN er alle FN-attributtene: {Artist, Scene, Start}." },
    { tag: "1:1", fig: utenAttr(FIG_ARMBAND), tittel: "BÆRER",
      q: "Hvert festivalpass har nøyaktig ett armbånd, og hvert armbånd hører til nøyaktig ett pass. Hva er det beste valget?",
      options: ["FN i Festivalpass", "FN i Armbånd", "En egen tabell Bærer", "Slå Festivalpass og Armbånd sammen"], answer: 3,
      explain: "Begge sider er totale, så sammensmelting er lov. Det gir ingen NULL og én tabell mindre, og både {År, Løpenr} og {Chipid} blir KN-er. FN på en av sidene gir heller ingen NULL, men én tabell mer." },
    { tag: "1:N", fig: FIG_TEAM, tittel: "MEDLEM_AV",
      q: "Hver frivillig er med i nøyaktig ett team. Et team kan ha mange frivillige, og et team kan være tomt. Hvor bør fremmednøkkelen stå?",
      options: ["I Frivillig", "I Team", "I en egen tabell Medlem_av", "Slå Frivillig og Team sammen"], answer: 0,
      explain: "FRIVILLIG har N på sin strek og er N-siden. I tillegg er FRIVILLIG total, så FN-en i Frivillig blir aldri NULL. Her er det ingen grunn til en egen tabell. FN-en er ikke en KN, fordi mange frivillige kan være på samme team." },
    { tag: "M:N rekursiv", fig: FIG_OPPVARMING, tittel: "OPPVARMING",
      q: "En artist kan varme opp for mange artister og ha mange oppvarmere. Hvordan realiseres OPPVARMING?",
      options: ["Kolonnen Oppvarmer i Artist", "En egen tabell med to FN-er til Artist, med rollenavn", "Ingen FN trengs, den er rekursiv", "En egen tabell Oppvarming(Artist, Artist)"], answer: 1,
      explain: "Rekursiv M:N realiseres som annen M:N: en egen tabell der PN er begge FN-ene. Begge peker på Artist, så kolonnene må hete noe forskjellig. Bruk rollene: Oppvarming(Hovedartist, Oppvarmer). To kolonner med samme navn går ikke." }
  ];

  /* ---------- Flervalg per fane ---------- */
  var QUIZ = {
    algoritmen: [
      { q: "I hvilken rekkefølge tar kursets algoritme ER-elementene?",
        options: ["Entiteter, svake entiteter, 1:1, 1:N, M:N, flerverdi, n-ære.",
                  "Entiteter, 1:1, 1:N, M:N, svake entiteter, flerverdi, n-ære.",
                  "Svake entiteter, entiteter, M:N, 1:N, 1:1, flerverdi, n-ære.",
                  "Entiteter, flerverdi, svake entiteter, n-ære, M:N, 1:N, 1:1."],
        answer: 0,
        explain: "Svake entiteter trenger PN-en til den identifiserende entiteten, så den må realiseres først. Relasjonene trenger tabellene de peker på, og 1:1 og 1:N tas før M:N fordi de ofte ikke gir nye tabeller.",
        kilde: K("Realiseringsnotat s. 2") },
      { q: "Skjemaet ditt er helt riktig, men du har ikke skrevet én eneste begrunnelse. Hva trekker sensor typisk for?",
        options: ["Ingenting, bare skjemaet teller.",
                  "0,5 per valg som ikke er forklart, og 2 poeng i H2020 da forklaringene manglet helt.",
                  "Hele oppgaven gir 0 poeng.",
                  "Bare for det første valget."],
        answer: 1,
        explain: "Oppgaven ber om at valgene forklares. Uten begrunnelse kan sensor ikke se at du valgte og ikke bare gjettet. Én setning per valg holder.",
        kilde: K("Sensorveiledning H2020 og H2023, parafrasert") }
    ],
    entiteter: [
      { q: "FESTIVALPASS har den sammensatte nøkkelen Passkode med delene År og Løpenr. Hvordan realiseres den?",
        options: ["Kolonnen Passkode, KN {Passkode}.",
                  "Kolonnene År og Løpenr, KN {År, Løpenr}.",
                  "Kolonnene År og Løpenr, KN {År}, {Løpenr}.",
                  "Kolonnene Passkode, År og Løpenr, KN {Passkode}."],
        answer: 1,
        explain: "Bare bladnodene blir kolonner. Siden det er kombinasjonen som er unik, blir de én KN sammen.",
        kilde: K("Realiseringsnotat, F06-02") }
    ],
    svake: [
      { q: "KONSERT er svak med svak nøkkel Start, og den identifiserende entiteten SCENE har PN {Navn}. Hva er PN i Konsert?",
        options: ["{Start}",
                  "{Scene, Start}, der Scene er FN til Scene(Navn)",
                  "{Scene}",
                  "{Scene, Start} pluss en egen tabell PÅ(Scene, Start)"],
        answer: 1,
        explain: "PN = PN-en til den identifiserende entiteten + den svake nøkkelen. D realiserer den identifiserende relasjonen to ganger, og det ga trekk (−2 i H2019, −0,5 i H2020).",
        kilde: K("Realiseringsnotat, F06-02") }
    ],
    "en-til-en": [
      { q: "I SJEF har SCENE 1 og dobbel strek, og FRIVILLIG har 1 og enkel strek. Hva er det beste valget?",
        options: ["Slå Scene og Frivillig sammen.",
                  "FN <span class=\"mono\">Sjef</span> i Scene, som også er en KN.",
                  "FN <span class=\"mono\">Sjef_for</span> i Frivillig, som også er en KN.",
                  "Egen tabell Sjef med PN {Scene, Frivillig}."],
        answer: 1,
        explain: "SCENE er total, så FN-en i Scene blir aldri NULL. Relasjonen er 1:1, så verdien er unik og dermed en KN. A er ikke lov når bare én side er total. C gir NULL, og da kan kolonnen ikke være en KN. D har feil PN: hver av FN-ene skal være en KN for seg.",
        kilde: K("Realiseringsnotat, F06-02 lysark 8–9") },
      { q: "FESTIVALPASS og ARMBÅND er 1:1 med total deltakelse på begge sider, og slås sammen til Festivalpass(År, Løpenr, Type, Chipid, Farge). Hva er KN-ene?",
        options: ["Bare {År, Løpenr}.", "{År, Løpenr} og {Chipid}.", "{År, Løpenr, Chipid}.", "{Chipid} og {Farge}."],
        answer: 1,
        explain: "Ved sammensmelting blir begge entitetenes nøkler KN-er. Hver av dem identifiserer raden alene, så {År, Løpenr, Chipid} er ikke minimal.",
        kilde: K("F06-02 lysark 7") }
    ],
    "en-til-mange": [
      { q: "KONTRAKT (N ved ARTIST, 1 ved PLATESELSKAP) realiseres som egen tabell Kontrakt(Artist, Plateselskap, Signert). Hva er PN?",
        options: ["{Artist, Plateselskap}", "{Artist}", "{Plateselskap}", "{Artist, Plateselskap, Signert}"],
        answer: 1,
        explain: "PN er N-sidens PN alene. Det er nettopp det som sikrer at hver artist har høyst ett plateselskap. Med {Artist, Plateselskap} kunne samme artist fått to plateselskaper, og Signert er et relasjonsattributt som aldri er med i nøkkelen.",
        kilde: K("Realiseringsnotat, F06-02") },
      { q: "Med FN-en i Artist (valg 1): hvor havner relasjonsattributtet Signert?",
        options: ["I Artist, sammen med FN-en.", "I Plateselskap.", "I en egen tabell Signert.", "Det droppes."],
        answer: 0,
        explain: "Et relasjonsattributt følger med dit relasjonen realiseres. Signert avhenger av paret, og paret er bestemt av artisten, så det står i Artist.",
        kilde: K("Realiseringsnotat, ukesoppgaver uke 6") }
    ],
    "mange-til-mange": [
      { q: "Konsert har PN {Scene, Start}. Hva er PN i Spiller(Artist, Scene, Start, Honorar)?",
        options: ["{Artist}", "{Artist, Start}", "{Artist, Scene, Start}", "{Artist, Scene, Start, Honorar}"],
        answer: 2,
        explain: "M:N gir PN = alle FN-attributtene. FN-en til Konsert er hele (Scene, Start). Honorar er et relasjonsattributt og er aldri med i nøkkelen.",
        kilde: K("Realiseringsnotat, F06-02") },
      { q: "Hvordan realiseres den rekursive M:N-relasjonen OPPVARMING på ARTIST?",
        options: ["Oppvarming(Artist, Artist) med PN {Artist, Artist}.",
                  "Oppvarming(Hovedartist, Oppvarmer) med PN {Hovedartist, Oppvarmer} og to FN-er til Artist(Artistnr).",
                  "Kolonnen Oppvarmer i Artist, med FN til Artist(Artistnr).",
                  "Den trenger ingen tabell, fordi den bare involverer én entitet."],
        answer: 1,
        explain: "Rekursiv M:N realiseres som annen M:N, men begge FN-ene peker på samme tabell. Kolonnene må derfor få navn etter rollene. C gir plass til bare én oppvarmer per artist.",
        kilde: K("Eksamen H2023 1.3, løsningsforslag (Relatert)") }
    ],
    flerverdi: [
      { q: "ARTIST har flerverdiattributtet Sjanger. Hvilken realisering er riktig?",
        options: ["Kolonnen Sjanger i Artist, for eksempel «pop, elektronika».",
                  "Kolonnene Sjanger1, Sjanger2 og Sjanger3 i Artist.",
                  "Sjanger(Artist, Sjanger) med PN {Artist, Sjanger} og FN til Artist.",
                  "Sjanger(Artist, Sjanger) med PN {Artist} og FN til Artist."],
        answer: 2,
        explain: "Flerverdi gir en egen tabell der alle attributtene er KN. A bryter 1NF, B gir NULL og et fast tak, og D tillater bare én sjanger per artist.",
        kilde: K("Realiseringsnotat, F06-02") }
    ],
    naere: [
      { q: "I VAKT står 1 ved OPPGAVE og mange ved FRIVILLIG og SCENE. Hva er KN i Vakt(Frivillig, Scene, Oppgave, Timer)?",
        options: ["{Frivillig, Scene, Oppgave}", "{Frivillig, Scene}", "{Oppgave}", "{Frivillig, Scene}, {Frivillig, Oppgave}"],
        answer: 1,
        explain: "1 ved OPPGAVE betyr at frivillig og scene bestemmer oppgaven. A er ikke minimal. D ville krevd 1 også ved SCENE.",
        kilde: K("Realiseringsnotat s. 11–12") },
      { q: "Anta at det står M, N og K ved de tre sidene av VAKT. Hva blir KN?",
        options: ["{Frivillig, Scene}", "{Frivillig, Scene, Oppgave}", "{Frivillig, Scene, Oppgave, Timer}", "Én KN per side: {Frivillig}, {Scene}, {Oppgave}"],
        answer: 1,
        explain: "Med mange på alle sider bestemmer ingen to den tredje, så alle tre FN-ene trengs. Timer er et relasjonsattributt og er aldri med i KN.",
        kilde: K("Realiseringsnotat s. 11–12") }
    ],
    hele: [
      { q: "Hvor mange tabeller får festivalskjemaet?",
        options: ["7", "9", "11", "13"],
        answer: 1,
        explain: "Fem vanlige entiteter, Konsert (svak), Spiller (M:N), Sjanger (flerverdi) og Vakt (ternær). PÅ, SJEF og KONTRAKT er realisert med fremmednøkler og gir ingen egne tabeller.",
        kilde: false },
      { q: "Hvilken normalform er garantert for et skjema som er laget med realiseringsalgoritmen?",
        options: ["1NF", "2NF", "3NF", "BCNF"],
        answer: 0,
        explain: "Bare 1NF er garantert. ER kan ikke uttrykke alle funksjonelle avhengigheter, så for eksempel Postnr → Poststed i Frivillig gir brudd på BCNF uten at noe i diagrammet viser det.",
        kilde: K("F08-03 lysark 3") }
    ],
    subklasser: [
      { q: "Vip(Gid, Bord) har PN {Gid} og FN (Gid) -> Gjest(Gid). Hvilket krav håndhever dette?",
        options: ["At ingen gjest er både VIP og presse.", "At hver gjest er i minst én subklasse.", "At hver VIP også er en gjest.", "Alle tre."],
        answer: 2,
        explain: "FN-en håndhever bare delmengde. Disjunkthet og totalitet må uttrykkes som egne krav.",
        kilde: K("F13-uttrykkskraft s. 8–11") },
      { q: "Hvor hører attributtet Bord, som bare VIP-gjester har, hjemme?",
        options: ["I Gjest, som en kolonne som er NULL for de andre.", "I Vip, sammen med Gid.", "I en egen tabell Bord(Bord).", "I både Gjest og Vip."],
        answer: 1,
        explain: "Subklassens egne attributter står i subklassens tabell. I Gjest ville Bord vært NULL for alle som ikke er VIP.",
        kilde: K("F13-uttrykkskraft s. 8–11") }
    ]
  };

  /* ---------- Sant/usant for hele blokken ---------- */
  var TF = [
    { s: "En 1:1-relasjon kan slås sammen til én tabell når én av sidene er total.", answer: false, blokk: "en-til-en",
      explain: "Begge sidene må være totale. Ellers mister entitetene på den partielle siden som ikke har partner, raden sin, eller de får NULL i nøkkelen til den totale siden.", kilde: K("Realiseringsnotat, F06-02 lysark 8–9") },
    { s: "I en 1:N-relasjon legges FN-en i tabellen til entiteten som har N på sin strek.", answer: true, blokk: "en-til-mange",
      explain: "Den entiteten har høyst én partner, så partnerens PN får plass i én kolonne.", kilde: K("Realiseringsnotat, F06-02") },
    { s: "En M:N-relasjon kan realiseres med en FN i en av entitetstabellene.", answer: false, blokk: "mange-til-mange",
      explain: "Begge sider kan ha mange partnere, så det krever alltid en egen tabell.", kilde: K("Realiseringsnotat, F06-02") },
    { s: "Et relasjonsattributt blir en del av PN i tabellen for relasjonen.", answer: false, blokk: "mange-til-mange",
      explain: "Relasjonsattributter er aldri en del av KN eller PN.", kilde: K("Realiseringsnotat") },
    { s: "Utledbare attributter blir vanlige kolonner.", answer: false, blokk: "entiteter",
      explain: "De droppes, fordi de kan regnes ut.", kilde: K("Realiseringsnotat, F06-02") },
    { s: "Et sammensatt attributt gir bare bladnodene som kolonner.", answer: true, blokk: "entiteter",
      explain: "Forelderen forsvinner, og delene nederst i treet blir kolonner.", kilde: K("Realiseringsnotat") },
    { s: "Et flerverdiattributt blir en egen tabell der alle attributtene sammen er KN.", answer: true, blokk: "flerverdi",
      explain: "Hvert par (entitet, verdi) forekommer én gang.", kilde: K("Realiseringsnotat, F06-02") },
    { s: "Den identifiserende relasjonen får en egen tabell.", answer: false, blokk: "svake",
      explain: "Den er realisert gjennom FN-en i den svake tabellen. En egen tabell lagrer det samme to ganger.", kilde: K("Realiseringsnotat, F06-02") },
    { s: "Er den identifiserende entiteten selv svak, arver den svake tabellen hele dens sammensatte PN.", answer: true, blokk: "svake",
      explain: "PN-en vokser nedover nivåene, og FN-en peker på hele PN-en til den identifiserende entiteten.", kilde: K("Realiseringsnotat") },
    { s: "En ternær relasjon blir alltid en egen tabell.", answer: true, blokk: "naere",
      explain: "1-tallene gjelder kombinasjoner, så relasjonen kan ikke legges som FN i en entitetstabell.", kilde: K("Realiseringsnotat s. 11–12") },
    { s: "Står det 1 på to sider av en ternær relasjon, får tabellen to KN-er.", answer: true, blokk: "naere",
      explain: "Hver 1-side gir en KN bestående av de to andre FN-ene.", kilde: K("Realiseringsnotat s. 11–12") },
    { s: "Et skjema laget med realiseringsalgoritmen er alltid på BCNF.", answer: false, blokk: "hele",
      explain: "Bare 1NF er garantert. ER kan ikke uttrykke alle funksjonelle avhengigheter.", kilde: K("F08-03 lysark 3") },
    { s: "Skjemaet for festivalen håndhever at hvert plateselskap har minst én artist.", answer: false, blokk: "hele",
      explain: "Total deltakelse på den refererte siden kan ikke uttrykkes med KN og FN. Ingenting hindrer et plateselskap uten artister.", kilde: false },
    { s: "I en 1:1 er FN-en en KN når den står på en side med total deltakelse.", answer: true, blokk: "en-til-en",
      explain: "Den er unik (1:1) og aldri NULL (total).", kilde: K("Realiseringsnotat, F06-02 lysark 8–9") },
    { s: "I en 1:1 er FN-en en KN også når den står på en partiell side.", answer: false, blokk: "en-til-en",
      explain: "Den kan være NULL, og en KN kan aldri være NULL. Den er bare unik blant verdiene som ikke er NULL.", kilde: K("F06-02 lysark 8–9") },
    { s: "I en egen tabell for en 1:N-relasjon er PN begge FN-ene sammen.", answer: false, blokk: "en-til-mange",
      explain: "PN er N-sidens PN alene. Med begge kunne samme N-entitet fått flere partnere.", kilde: K("Realiseringsnotat") },
    { s: "I en rekursiv M:N-relasjon får kolonnene navn etter rollene.", answer: true, blokk: "mange-til-mange",
      explain: "Begge FN-ene peker på samme tabell, og to kolonner kan ikke hete det samme.", kilde: K("Eksamen H2023 1.3, løsningsforslag (Relatert)") },
    { s: "En FN kan peke på et attributt som ikke er en KN i måltabellen.", answer: false, blokk: "algoritmen",
      explain: "En FN skal alltid peke på en KN i måltabellen, som regel PN-en.", kilde: K("F06-02 (alle FN peker på PN)") },
    { s: "PN og FN håndhever at spesialiseringen er total.", answer: false, blokk: "subklasser",
      explain: "De håndhever bare delmengde (Vip ⊆ Gjest).", kilde: K("F13-uttrykkskraft s. 8–11") },
    { s: "Tabellen for en subklasse bruker superklassens PN som sin PN.", answer: true, blokk: "subklasser",
      explain: "PN-en er samtidig en FN til superklassen. Subklassen får ingen egen nøkkel.", kilde: K("F13-uttrykkskraft s. 8–11") }
  ];

  IN.dataReal = {
    fig: {
      festival: FIG_FESTIVAL, sceneKonsert: FIG_SCENE_KONSERT, attributter: FIG_ATTRIBUTTER, svak: FIG_SVAK,
      sjef: FIG_SJEF, armband: FIG_ARMBAND, kontrakt: FIG_KONTRAKT, mn: FIG_MN, flerverdi: FIG_FLERVERDI,
      ternaer: FIG_TERNAER
    },
    skjema: S,
    steg: STEG,
    regler: REGLER,
    algo: ALGO,
    inst: INST,
    sql: SQL,
    fnOvelse: FN_OVELSE,
    quiz: QUIZ,
    tf: TF
  };
})();
