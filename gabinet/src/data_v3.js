// Archiwalne układy – V3 (nie edytować)
const C = { oak: 0xc9a06a, white: 0xf1efe9, graphite: 0x4a4d52, wood: 0xb98a55, fabric: 0x8a9a8b, fabric2: 0x7d8fa3, bed: 0xe9e4da, steel: 0x9aa0a6 };

// ---- budulce pozycji ----
const desk = (id, label, x, y, w, d, extra = {}) => ({ id, type: 'desk', label, x, y, w, d, h: 0.74, color: C.oak, ...extra });
const chair = (id, x, y) => ({ id, type: 'chair', label: 'Krzesło biurowe (w nocy wsunięte pod blat)', x, y, w: 0.56, d: 0.56, h: 0.95, color: C.graphite, mobile: true, nightDy: -0.45, face: { x: x + 0.28, y: 0 } });
const nightstand = (id, x, y, w = 0.40, d = 0.40) => ({ id, type: 'box', label: `Szafka nocna ${Math.round(w * 100)}×${Math.round(d * 100)}×55`, x, y, w, d, h: 0.55, color: C.wood, bedside: true });

// Szafy gości – NIE stoją przy oknie (zasłaniałyby światło): przy słupie albo na ścianie zachodniej, z wolną strefą otwierania drzwi
const wardrobePillar = (zoneD = 0.36, doors = 'drzwi skrzydłowe', depth = 0.55) => ({ id: 'war', type: 'box', label: `Szafa na ubrania gości 75×${Math.round(depth * 100)}×210 przy słupie (${doors})`, x: 2.635 - depth, y: 1.65, w: depth, d: 0.75, h: 2.10, color: C.white, wardrobe: true, back: 'E', ...(zoneD > 0 ? { zone: { x: 2.635 - depth - zoneD, y: 1.65, w: zoneD, d: 0.75, label: 'Strefa otwierania drzwi szafy' } } : {}) });
const wardrobeWest = (y = 1.0, len = 0.75, sliding = false) => ({ id: 'war', type: 'box', label: `Szafa na ubrania gości ${Math.round(len * 100)}×60×210 przy ścianie zachodniej${sliding ? ' (drzwi przesuwne)' : ''}`, x: 0.0, y, w: 0.60, d: len, h: 2.10, color: C.white, wardrobe: true, back: 'W', ...(sliding ? {} : { zone: { x: 0.60, y, w: 0.36, d: len, label: 'Strefa otwierania drzwi szafy' } }) });

// wspólne dla wszystkich układów: biurko L pod oknem + wnęka po prawej, półki L na kątownikach, szuflady pod blatem
const workzone = () => [
  desk('dm', 'Biurko 272×70 pod oknem i we wnęce', 0.72, 0.0, 2.72, 0.70, { panels: ['W'], monitor: { x: 1.45 } }),
  desk('dr', 'Przedłużenie blatu 70×85 przy ścianie E', 2.74, 0.70, 0.70, 0.85, { panels: ['S'], pad: true }),
  { id: 'szu1', type: 'drawers', label: 'Szuflady pod blatem 80×60 (przybory, papier A3)', x: 2.60, y: 0.05, w: 0.80, d: 0.60, h: 0.11, z0: 0.61, color: C.white, underDesk: true },
  { id: 'szu2', type: 'drawers', label: 'Szuflady pod blatem 62×70 (rysunki, dokumenty)', x: 2.78, y: 0.74, w: 0.62, d: 0.72, h: 0.11, z0: 0.61, color: C.white, underDesk: true },
  { id: 'lsh', type: 'lshelf', label: 'Półki w kształcie L na kątownikach (dokumenty + drukarka)', arms: [{ x: 2.60, y: 0.0, w: 0.84, d: 0.32 }, { x: 3.12, y: 0.32, w: 0.32, d: 1.23 }], z0: 1.10, h: 1.05, shelves: 4, printerShelf: true, color: C.white, docs: true },
  { id: 'prn', type: 'printer', label: 'Drukarka 42×32×20 na półce', x: 2.66, y: 0.0, w: 0.42, d: 0.32, h: 0.20, z0: 1.12, color: 0x3a3d42, onShelf: true },
  chair('c1', 1.45, 0.80),
];

export const LAYOUTS_V3 = [
  {
    id: 1, bedType: 'sofa',
    name: 'Sofa rozkładana przy ścianie zachodniej',
    short: 'Sofa 208×95 rozkłada się na łóżko 140×200 prosto do pokoju. Szafka nocna na stałe przy wezgłowiu (jako stolik przy sofie), szafa gości przy słupie.',
    pros: ['Sofa to na co dzień miejsce odpoczynku w najchłodniejszym pokoju', 'Okno i narożnik NW wolne – maksimum światła', 'Szafka nocna cały czas przy sofie – stolik na książkę i lampkę', 'Pojemnik w sofie na pościel i poduszki'],
    cons: ['Sofa zajmuje 0,95 m szerokości cały czas', 'Materac sofy jest cieńszy niż w zwykłym łóżku (szukaj sofy z materacem 14–16 cm i mechanizmem „włoskim” lub „amerykańskim”)', 'Przejście między rozłożoną sofą a szafą ≈ 64 cm', 'Gniazdko G4 za sofą – przenieść przy wezgłowiu'],
    guest: ['Ubrania: szafa 75×55×210 z drążkiem przy słupie (drzwi otwierają się w strefę 36 cm)', 'Bagaże: pojemnik w sofie + półka nad szafą', 'Szafka nocna: 40×38×55 przy wezgłowiu (północny koniec sofy)'],
    items: [
      { id: 'sofa', type: 'sofa', label: 'Sofa rozkładana 208×95 (łóżko 140×200)', x: 0.0, y: 1.50, w: 0.95, d: 2.08, h: 0.85, color: C.fabric2, back: 'W', mode: 'day' },
      { id: 'sofaopen', type: 'sofabed', label: 'Sofa rozłożona na łóżko 140×200', x: 0.0, y: 1.50, w: 1.45, d: 2.08, h: 0.50, color: C.fabric2, head: 'N', mode: 'night' },
      nightstand('ns', 0.0, 1.08, 0.40, 0.38),
      wardrobePillar(),
      ...workzone(),
    ],
  },
  {
    id: 2, bedType: 'sofa',
    name: 'Sofa rozkładana długim bokiem do ściany południowej',
    short: 'Sofa 210×95 stoi pod ścianą południową; po rozłożeniu łóżko 140×200 ma ok. 1,4 m głębokości. Szafa gości i szafka nocna przy ścianie zachodniej.',
    pros: ['W dzień sofa jest płytka (95 cm) – najwięcej wolnej podłogi', 'Środek pokoju, okno i narożnik NW wolne', 'Szafa gości na ścianie zachodniej, daleko od okna'],
    cons: ['Po rozłożeniu przejście między łóżkiem a słupem tylko ≈ 64 cm', 'Dostęp do łóżka tylko od północy (druga strona to ściana)', 'Sofa tuż przy włączniku światła (ok. 12 cm) – wygodniej przesunąć włącznik w stronę drzwi', 'Gniazdko G4 za szafą/wezgłowiem – przenieść'],
    guest: ['Ubrania: szafa 75×60×210 przy ścianie zachodniej (strefa drzwi 36 cm)', 'Bagaże: pojemnik w sofie, półka nad szafą', 'Szafka nocna: 40×38×55 przy wezgłowiu (zachód)'],
    items: [
      { id: 'sofa', type: 'sofa', label: 'Sofa rozkładana 210×95 (łóżko 140×200)', x: 0.0, y: 2.63, w: 2.10, d: 0.95, h: 0.85, color: C.fabric2, back: 'S', mode: 'day' },
      { id: 'sofaopen', type: 'sofabed', label: 'Sofa rozłożona na łóżko 140×200', x: 0.0, y: 2.18, w: 2.0, d: 1.40, h: 0.50, color: C.fabric2, head: 'W', mode: 'night' },
      nightstand('ns', 0.0, 1.76, 0.40, 0.38),
      wardrobeWest(1.0),
      ...workzone(),
    ],
  },
  {
    id: 3, bedType: 'sofa',
    name: 'Sofa rozkładana „do przodu” przy ścianie południowej',
    short: 'Sofa 175×95 rozkłada się w głąb pokoju (mechanizm typu włoski) na łóżko 140×200 – wezgłowie przy ścianie południowej, szafka nocna przy wezgłowiu.',
    pros: ['Rozłożone łóżko jest wąskie i długie – po wschodniej stronie zostaje ≈ 1,0 m przejścia', 'W dzień sofa ma tylko 175 cm długości – dużo miejsca przy zachodniej ścianie', 'Wygodniejszy materac niż w typowym tapczanie (mechanizm ze stelażem i materacem piankowym)', 'Szafa na ścianie zachodniej nad sofą – okno i narożnik NW wolne'],
    cons: ['Rozłożona sofa zajmuje całą zachodnią część pokoju', 'Brak komody – ubrania w szafie, bagaże w pojemniku sofy', 'Niższy standard snu niż w zwykłym łóżku'],
    guest: ['Ubrania: szafa 72×60×210 przy ścianie zachodniej (strefa drzwi 36 cm)', 'Bagaże: pojemnik w sofie + półka nad szafą', 'Szafka nocna: 38×40×55 przy wezgłowiu, wschodnia strona sofy'],
    items: [
      { id: 'sofa', type: 'sofa', label: 'Sofa rozkładana do przodu 175×95 (łóżko 140×200)', x: 0.05, y: 2.63, w: 1.75, d: 0.95, h: 0.85, color: C.fabric2, back: 'S', mode: 'day' },
      { id: 'sofaopen', type: 'sofabed', label: 'Sofa rozłożona na łóżko 140×200', x: 0.20, y: 1.58, w: 1.40, d: 2.0, h: 0.50, color: C.fabric2, head: 'S', mode: 'night' },
      nightstand('ns', 1.80, 3.18, 0.38, 0.40),
      wardrobeWest(0.83, 0.72),
      ...workzone(),
    ],
  },
  {
    id: 4, bedType: 'fixed',
    name: 'Łóżko stałe 140×200 przy ścianie zachodniej (z pojemnikiem)',
    short: 'Zwykłe łóżko z dowolnym materacem, z pojemnikiem na pościel i walizki; w dzień leżanka z wałkiem. Ława na bagaże w nogach, szafka nocna przy wezgłowiu, szafa przy słupie.',
    pros: ['Zwykłe łóżko i materac – najlepszy komfort snu, nic się nie rozkłada', 'Przejście od drzwi do strefy biurka ≈ 1,2 m', 'Pojemnik pod łóżkiem i ława 140×40×45 na bagaże', 'Okno i narożnik NW wolne'],
    cons: ['Łóżko zajmuje 2,8 m² cały czas – wolna podłoga ≈ 50%', 'Brak miejsca na fotel', 'Gniazdko G4 zostaje za łóżkiem – przenieść przy wezgłowiu'],
    guest: ['Ubrania: szafa 75×55×210 przy słupie', 'Bagaże: pojemnik pod łóżkiem + ława 140×40×45 w nogach łóżka', 'Szafka nocna: 40×40×55 przy wezgłowiu (wschód, południowy koniec)'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.0, y: 1.55, w: 1.40, d: 2.0, h: 0.50, head: 'S', color: C.bed },
      { id: 'lawa', type: 'box', label: 'Ława / skrzynia 140×40×45 (bagaże)', x: 0.0, y: 1.08, w: 1.40, d: 0.40, h: 0.45, color: C.wood, back: 'W' },
      nightstand('ns', 1.42, 3.13),
      wardrobePillar(),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },
  {
    id: 5, bedType: 'fixed',
    name: 'Łóżko stałe 140×200 wzdłuż ściany południowej (leżanka)',
    short: 'Łóżko długim bokiem do ściany południowej, w dzień leżanka oparta o ścianę. Szafa gości i szafka nocna przy ścianie zachodniej.',
    pros: ['Leżanka z oparciem o ścianę – najwygodniejsza do czytania i odpoczynku', 'Pojemnik pod łóżkiem na pościel i bagaże', 'Środek pokoju, okno i narożnik NW wolne'],
    cons: ['Łóżko zajmuje 2,8 m² cały czas', 'Przejście między łóżkiem a słupem ≈ 64 cm', 'Dostęp do łóżka tylko z północy (druga strona to ściana)', 'Gniazdko G4 zostaje za łóżkiem – przenieść przy wezgłowiu'],
    guest: ['Ubrania: szafa 75×60×210 przy ścianie zachodniej', 'Bagaże: pojemnik pod łóżkiem, półka nad szafą', 'Szafka nocna: 40×38×55 przy wezgłowiu (zachód)'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.0, y: 2.18, w: 2.0, d: 1.40, h: 0.50, head: 'W', color: C.bed },
      nightstand('ns', 0.0, 1.76, 0.40, 0.38),
      wardrobeWest(1.0),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },
  {
    id: 6, bedType: 'wall',
    name: 'Łóżko 140 składane pionowo przy ścianie południowej',
    short: 'Łóżko 140×200 chowane pionowo w ścianie południowej obok drzwi, szafka nocna przy wezgłowiu, szafa gości przy słupie. W dzień zachodnia połowa pokoju wolna.',
    pros: ['Zwykły materac (do ok. 20–25 cm) i najwygodniejszy sen z opcji składanych', 'W dzień wolna prawie cała zachodnia połowa pokoju (joga, rysowanie na podłodze)', 'Po rozłożeniu łóżka przejście do strefy biurka ≈ 60 cm (przy szafie) – poza tym wolna podłoga 66% w dzień', 'Okno i narożnik NW wolne'],
    cons: ['Po rozłożeniu łóżko zajmuje całą zachodnią połowę pokoju', 'Mechanizm i szafa to większy koszt (zabudowa na wymiar)', 'Dostęp do łóżka tylko od wschodu (po zachodniej stronie 12 cm)'],
    guest: ['Ubrania: szafa 75×50×210 przy słupie z drzwiami przesuwnymi (wieszaki obracane w poprzek)', 'Bagaże: półka nad szafą lub walizka na rozłożonym łóżku', 'Szafka nocna: 40×40×55 przy wezgłowiu (stała)'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'V', label: 'Łóżko składane pionowe 140×200', cabinet: { x: 0.05, y: 3.18, w: 1.55, d: 0.40, h: 2.45 }, panel: { x: 0.125, y: 1.18, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 1.60, 3.18),
      wardrobePillar(0, 'drzwi przesuwne', 0.50),
      ...workzone(),
    ],
  },
  {
    id: 7, bedType: 'wall',
    name: 'Łóżko 140 składane poziomo przy ścianie zachodniej',
    short: 'Łóżko 140×200 składane poziomo do zabudowy przy ścianie zachodniej, szafka nocna na końcu zabudowy. Szafa na końcu zabudowy (północna część ściany zachodniej) z drzwiami przesuwnymi.',
    pros: ['Rozłożone łóżko zostawia ≈ 84 cm przejścia – może zostać rozłożone jako leżanka na dzień', 'Cała ściana zachodnia to jedna spójna zabudowa', 'Narożnik NW zostaje wolny (szafa odsunięta o 30 cm od północnej ściany)'],
    cons: ['Zabudowa zajmuje 40 cm ściany zachodniej na stałe', 'Szafka nocna jest przy wezgłowiu (końcu łóżka), nie z boku', 'Szafa musi stać przy zachodniej ścianie na północ od łóżka (przy słupie zabrakłoby przejścia) – 35 cm od narożnika, z drzwiami przesuwnymi; jedyne miejsce bez kolizji w tym układzie', 'Gniazdko G4 w korpusie łóżka – wyprowadzić'],
    guest: ['Ubrania: szafa 75×60×210 z drzwiami przesuwnymi, tuż przy łóżku', 'Bagaże: półka nad szafą lub walizka na rozłożonym łóżku', 'Szafka nocna: 40×38×55 przy wezgłowiu w narożniku SW'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'H', label: 'Łóżko składane poziome 140×200', cabinet: { x: 0, y: 1.05, w: 0.40, d: 2.10, h: 1.95 }, panel: { x: 0.40, y: 1.10, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 0.0, 3.17, 0.40, 0.38),
      wardrobeWest(0.30, 0.75, true),
      ...workzone(),
    ],
  },
];

