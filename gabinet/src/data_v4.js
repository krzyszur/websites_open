// Archiwalne układy – V4 (z wieszakami ściennymi; nie edytować)
const C = { oak: 0xc9a06a, white: 0xf1efe9, graphite: 0x4a4d52, wood: 0xb98a55, fabric: 0x8a9a8b, fabric2: 0x7d8fa3, bed: 0xe9e4da, steel: 0x9aa0a6, sofa: 0x6f7480 };

// ---- budulce pozycji ----
const desk = (id, label, x, y, w, d, extra = {}) => ({ id, type: 'desk', label, x, y, w, d, h: 0.74, color: C.oak, ...extra });
const chair = (id, x, y) => ({ id, type: 'chair', label: 'Krzesło biurowe (w nocy wsunięte pod blat)', x, y, w: 0.56, d: 0.56, h: 0.95, color: C.graphite, mobile: true, nightDy: -0.45, face: { x: x + 0.28, y: 0 } });
const plantItem = (cx = 0.30, cy = 0.30) => ({ id: 'plant', type: 'plant', label: 'Monstera w doniczce Ø42 cm, wys. ok. 1,2 m (narożnik NW, jak na zdjęciach)', x: cx - 0.21, y: cy - 0.21, w: 0.42, d: 0.42, h: 1.2, color: 0x2f6b3a });
const nightstand = (id, x, y, w = 0.40, d = 0.40) => ({ id, type: 'box', label: `Szafka nocna ${Math.round(w * 100)}×${Math.round(d * 100)}×55`, x, y, w, d, h: 0.55, color: C.wood, bedside: true });

// Szafy gości – NIE stoją przy oknie (zasłaniałyby światło): przy słupie albo na ścianie zachodniej, z wolną strefą otwierania drzwi
const wardrobePillar = (zoneD = 0.36, doors = 'drzwi skrzydłowe', depth = 0.55) => ({ id: 'war', type: 'box', label: `Szafa na ubrania gości 75×${Math.round(depth * 100)}×210 przy słupie (${doors})`, x: 2.635 - depth, y: 1.65, w: depth, d: 0.75, h: 2.10, color: C.white, wardrobe: true, back: 'E', ...(zoneD > 0 ? { zone: { x: 2.635 - depth - zoneD, y: 1.65, w: zoneD, d: 0.75, label: 'Strefa otwierania drzwi szafy' } } : {}) });
const wardrobeWest = (y = 1.0, len = 0.75, sliding = false) => ({ id: 'war', type: 'box', label: `Szafa na ubrania gości ${Math.round(len * 100)}×60×210 przy ścianie zachodniej${sliding ? ' (drzwi przesuwne)' : ''}`, x: 0.0, y, w: 0.60, d: len, h: 2.10, color: C.white, wardrobe: true, back: 'W', ...(sliding ? {} : { zone: { x: 0.60, y, w: 0.36, d: len, label: 'Strefa otwierania drzwi szafy' } }) });
// garderoba gości bez wysokiej szafy: komoda 40 cm + wieszak ścienny z drążkiem nad nią (ściana zachodnia albo ściana słupa)
const komodaRail = (y, len = 0.60, side = 'W', sfx = '') => {
  const x = side === 'W' ? 0.0 : 2.635 - 0.40, xr = side === 'W' ? 0.0 : 2.635 - 0.55;
  const where = side === 'W' ? 'przy ścianie zachodniej' : 'przy słupie';
  return [
    { id: 'kom' + sfx, type: 'box', label: `Komoda ${Math.round(len * 100)}×40×85 ${where} (bielizna gości, walizka)`, x, y, w: 0.40, d: len, h: 0.85, color: C.wood, back: side },
    { id: 'rail' + sfx, type: 'rail', label: `Wieszak ścienny z drążkiem ${Math.round(len * 100)} cm nad komodą ${where}`, x: xr, y, w: 0.55, d: len, h: 0.85, z0: 1.15, color: C.steel, wallSide: side },
  ];
};

// sofa rozkładana (kanapa z funkcją spania, bez osobnego materaca): zamknięta w dzień, rozłożona w nocy
const sofaBed = (id, label, closed, open, extra = {}) => [
  { id, type: 'sofa', label: `${label} – złożona`, ...closed, h: 0.85, color: C.sofa, mode: 'day', ...extra },
  { id: id + 'o', type: 'sofabed', label: `${label} – rozłożona`, ...open, h: 0.50, color: C.sofa, mode: 'night', ...extra },
];

// wspólne dla wszystkich układów: biurko L pod oknem + wnęka po prawej, półki L na kątownikach, szuflady pod blatem
const workzone = () => [
  desk('dm', 'Biurko 272×70 pod oknem i we wnęce (blat ciągły)', 0.72, 0.0, 2.72, 0.70, { panels: ['W'], monitor: { x: 1.45 } }),
  desk('dr', 'Przedłużenie blatu 70×85 przy ścianie E', 2.74, 0.70, 0.70, 0.85, { panels: ['S'], pad: true }),
  { id: 'szu1', type: 'drawers', label: 'Szuflady pod blatem 80×60 (przybory, papier A3)', x: 2.60, y: 0.05, w: 0.80, d: 0.60, h: 0.11, z0: 0.61, color: C.white, underDesk: true },
  { id: 'szu2', type: 'drawers', label: 'Szuflady pod blatem 62×70 (rysunki, dokumenty)', x: 2.78, y: 0.74, w: 0.62, d: 0.72, h: 0.11, z0: 0.61, color: C.white, underDesk: true },
  { id: 'lsh', type: 'lshelf', label: 'Półki w kształcie L na kątownikach (dokumenty + drukarka)', arms: [{ x: 2.60, y: 0.0, w: 0.84, d: 0.32 }, { x: 3.12, y: 0.32, w: 0.32, d: 1.23 }], z0: 1.10, h: 1.05, shelves: 4, printerShelf: true, color: C.white, docs: true },
  { id: 'prn', type: 'printer', label: 'Drukarka 42×32×20 na półce', x: 2.66, y: 0.0, w: 0.42, d: 0.32, h: 0.20, z0: 1.12, color: 0x3a3d42, onShelf: true },
  chair('c1', 1.45, 0.80),
  plantItem(),
];

// wariant biurka: 'full' = blat ciągły na wymiar; 'store' = biurko ze sklepu 160×70 pod oknem + blat na wymiar we wnęce, zlicowane
function applyDeskVariant(L, variant) {
  if (variant !== 'store') return L;
  const items = [];
  for (const it of L.items) {
    if (it.id === 'dm') {
      items.push(desk('dm', 'Biurko ze sklepu 180×70 pod oknem (kończy się na krawędzi wnęki okna)', 0.753, 0.0, 1.80, 0.70, { panels: ['W', 'E'], monitor: { x: 1.55 }, color: 0xd8d0c2 }));
      items.push(desk('dn', 'Blat na wymiar we wnęce 89×70 (zlicowany z biurkiem, od krawędzi wnęki okna)', 2.553, 0.0, 0.887, 0.70, { panels: [], seam: 'W' }));
    } else items.push(it);
  }
  return { ...L, items };
}

const LAYOUTS_V4 = [
  // ===== ROZKŁADANA SOFA (kanapa z funkcją spania, jak na zdjęciu) =====
  {
    id: 1, bedType: 'sofa',
    name: 'Sofa 2-os. „amerykanka” pod ścianą południową',
    short: 'Prosta sofa 170×95, spanie ok. 140×195 wysuwane do przodu (3-częściowa piankowa). Rozłożona zajmuje 170×205 cm. Szafka nocna przy wezgłowiu, komoda z wieszakiem na ścianie zachodniej.',
    pros: ['Sofa to w dzień miejsce odpoczynku, w nocy łóżko – bez osobnego materaca', 'Po rozłożeniu przejście po wschodniej stronie ≈ 0,9 m', 'Okno i narożnik NW wolne – nic wysokiego przy oknie', 'Pojemnik na pościel pod siedziskiem (standard w takich sofach)'],
    cons: ['Materac z pianek składanych ma szwy i jest cieńszy niż w zwykłym łóżku', 'Rozkładanie wymaga 2 m wolnego przed sofą', 'Dostęp do łóżka z jednej strony (druga strona to ściana)', 'Gniazdko G4 za rozłożoną sofą – przenieść przy wezgłowiu'],
    guest: ['Ubrania: wieszak ścienny 75 cm (ok. 7 ubrań) nad komodą 75×40×85 przy ścianie zachodniej, za monsterą', 'Bagaże: pojemnik w sofie, na komodzie', 'Szafka nocna: 36×38×55 przy wezgłowiu (wschodnia strona sofy)'],
    items: [
      ...sofaBed('sofa', 'Sofa 2-os. 170×95', { x: 0.05, y: 2.63, w: 1.70, d: 0.95, back: 'S' }, { x: 0.05, y: 1.53, w: 1.70, d: 2.05, back: 'S', head: 'S' }),
      nightstand('ns', 1.78, 3.20, 0.36, 0.38),
      ...komodaRail(0.70, 0.75),
      ...workzone(),
    ],
  },
  {
    id: 2, bedType: 'sofa',
    name: 'Sofa 3-os. „delfin” długim bokiem do ściany południowej',
    short: 'Prosta sofa 210×95, rozkładana wzdłuż (spanie ok. 195×140). Rozłożona zajmuje 210×145 cm – płytsza, ale dłuższa. Komoda z wieszakiem i szafka nocna na ścianie zachodniej.',
    pros: ['Rozłożona jest płytka (145 cm) – zostaje wolna północna część pokoju', 'W dzień 3 miejsca do siedzenia', 'Pojemnik na pościel', 'Najdłuższy wieszak (100 cm) z opcji sof'],
    cons: ['Po rozłożeniu przejście między sofą a słupem tylko ≈ 54–64 cm', 'Gniazdko G4 za sofą/szafką – przenieść przy wezgłowiu', 'Dostęp do łóżka tylko od północy', 'Sofa tuż przy włączniku światła (ok. 12 cm) – wygodniej przesunąć włącznik w stronę drzwi'],
    guest: ['Ubrania: wieszak ścienny 100 cm (ok. 10 ubrań) nad komodą 100×40×85 przy ścianie zachodniej', 'Bagaże: pojemnik w sofie, na komodzie', 'Szafka nocna: 40×36×55 przy wezgłowiu (zachód)'],
    items: [
      ...sofaBed('sofa', 'Sofa 3-os. 210×95', { x: 0.0, y: 2.63, w: 2.10, d: 0.95, back: 'S' }, { x: 0.0, y: 2.13, w: 2.10, d: 1.45, back: 'S', head: 'W' }),
      nightstand('ns', 0.0, 1.76, 0.40, 0.36),
      ...komodaRail(0.70, 1.00),
      ...workzone(),
    ],
  },
  {
    id: 3, bedType: 'sofa',
    name: 'Sofa 3-os. „delfin” przy ścianie zachodniej',
    short: 'Prosta sofa 208×95 wzdłuż ściany zachodniej, rozkładana w głąb pokoju (145 cm). Komoda z wieszakiem przy słupie (wykorzystuje martwą ścianę), szafka nocna przy wezgłowiu.',
    pros: ['Rozłożona sofa zostawia ≈ 1,2 m do słupa', 'Okno i cała północna część zachodniej ściany wolne', 'Szafka nocna na stałe przy sofie (stolik na książkę i lampkę)', 'Komoda i wieszak na ścianie słupa, która i tak jest „martwa”'],
    cons: ['Sofa zajmuje 0,95 m szerokości cały czas', 'Wieszak 75 cm przy słupie – ubrania wiszą w przejściu (ok. 0,8 m do sofy)', 'Gniazdko G4 za sofą – przenieść przy wezgłowiu'],
    guest: ['Ubrania: wieszak ścienny 75 cm nad komodą 75×40×85 przy słupie', 'Bagaże: pojemnik w sofie, na komodzie', 'Szafka nocna: 40×38×55 przy wezgłowiu (północny koniec sofy)'],
    items: [
      ...sofaBed('sofa', 'Sofa 3-os. 208×95', { x: 0.0, y: 1.50, w: 0.95, d: 2.08, back: 'W' }, { x: 0.0, y: 1.50, w: 1.45, d: 2.08, back: 'W', head: 'N' }),
      nightstand('ns', 0.0, 1.08, 0.40, 0.38),
      ...komodaRail(1.65, 0.75, 'E'),
      ...workzone(),
    ],
  },
  {
    id: 4, bedType: 'sofa',
    name: 'Narożnik L w rogu SW (spanie 160×205)',
    short: 'Sofa w kształcie L: długie ramię przy ścianie zachodniej i krótsze przy południowej. Po rozłożeniu łóżko ok. 160×205 cm. Szafka nocna po wschodniej stronie wezgłowia, komoda z wieszakiem na ścianie zachodniej.',
    pros: ['W dzień narożnik zapewnia najwięcej miejsca do siedzenia i leżenia (L)', 'Szerokie spanie ≈ 160 cm', 'Po rozłożeniu przejście do strefy biurka ≈ 1 m (przy szafce nocnej 0,6 m)', 'Pojemnik na pościel'],
    cons: ['Narożnik zajmuje rząd 0,95 m wzdłuż zachodniej i południowej ściany cały czas (wolna podłoga ≈ 50%)', 'Rozkładanie wymaga 2 m wolnego', 'Szafka nocna stoi w przejściu (zostaje ≈ 60 cm do słupa)', 'Gniazdko G4 za narożnikiem – przenieść przy wezgłowiu'],
    guest: ['Ubrania: wieszak ścienny 80 cm nad komodą 80×40×85 przy ścianie zachodniej', 'Bagaże: pojemnik w narożniku, na komodzie', 'Szafka nocna: 36×38×55 po wschodniej stronie wezgłowia'],
    items: [
      { id: 'sofa', type: 'sofa', label: 'Narożnik L – długie ramię 95×203', x: 0.0, y: 1.55, w: 0.95, d: 2.03, h: 0.85, color: C.sofa, back: 'W', mode: 'day' },
      { id: 'sofa2', type: 'sofa', label: 'Narożnik L – krótkie ramię 70×95', x: 0.95, y: 2.63, w: 0.70, d: 0.95, h: 0.85, color: C.sofa, back: 'S', mode: 'day' },
      { id: 'sofao', type: 'sofabed', label: 'Narożnik L – rozłożony na łóżko ok. 160×205', x: 0.0, y: 1.55, w: 1.65, d: 2.03, h: 0.50, color: C.sofa, back: 'W', head: 'N', mode: 'night' },
      nightstand('ns', 1.68, 1.55, 0.36, 0.38),
      ...komodaRail(0.70, 0.80),
      ...workzone(),
    ],
  },
  {
    id: 5, bedType: 'sofa',
    name: 'Sofa 2-os. „amerykanka” przy ścianie zachodniej',
    short: 'Sofa 170×95 przy ścianie zachodniej, rozkładana w głąb pokoju (205 cm). Komoda z wieszakiem na północ od sofy pełni też rolę szafki nocnej.',
    pros: ['Komoda przy wezgłowiu jest jednocześnie szafką nocną', 'Okno i narożnik NW wolne', 'Pojemnik na pościel w sofie', 'Wieszak 80 cm (ok. 8 ubrań)'],
    cons: ['Po rozłożeniu przejście między sofą a słupem tylko ≈ 59 cm', 'Gniazdko G4 za sofą – przenieść przy wezgłowiu'],
    guest: ['Ubrania: wieszak ścienny 80 cm nad komodą 80×40×85', 'Bagaże: pojemnik w sofie, na komodzie', 'Szafka nocna: komoda przy wezgłowiu'],
    items: [
      ...sofaBed('sofa', 'Sofa 2-os. 170×95', { x: 0.0, y: 1.55, w: 0.95, d: 1.70, back: 'W' }, { x: 0.0, y: 1.55, w: 2.05, d: 1.70, back: 'W', head: 'W' }),
      ...komodaRail(0.70, 0.80),
      ...workzone(),
    ],
  },

  // ===== ŁÓŻKO STAŁE 140×200 =====
  {
    id: 6, bedType: 'fixed',
    name: 'Łóżko stałe przy ścianie zachodniej, wezgłowie na południu',
    short: 'Zwykłe łóżko 140×200 z pojemnikiem na pościel i walizki; w dzień leżanka z wałkiem. Ława na bagaże w nogach, szafka nocna przy wezgłowiu, komoda z wieszakiem przy słupie.',
    pros: ['Zwykłe łóżko i materac – najlepszy komfort snu, nic się nie rozkłada', 'Przejście od drzwi do strefy biurka ≈ 0,8 m (między łóżkiem a komodą przy słupie)', 'Pojemnik pod łóżkiem i ława 140×40×45 na bagaże', 'Okno i narożnik NW wolne'],
    cons: ['Łóżko zajmuje 2,8 m² cały czas – wolna podłoga ≈ 50%', 'Brak miejsca na fotel', 'Gniazdko G4 zostaje za łóżkiem – przenieść przy wezgłowiu'],
    guest: ['Ubrania: wieszak ścienny 75 cm nad komodą 75×40×85 przy słupie', 'Bagaże: pojemnik pod łóżkiem + ława 140×40×45 w nogach łóżka', 'Szafka nocna: 40×40×55 przy wezgłowiu (wschód, południowy koniec)'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.0, y: 1.55, w: 1.40, d: 2.0, h: 0.50, head: 'S', color: C.bed },
      { id: 'lawa', type: 'box', label: 'Ława / skrzynia 140×40×45 (bagaże)', x: 0.0, y: 1.08, w: 1.40, d: 0.40, h: 0.45, color: C.wood, back: 'W' },
      nightstand('ns', 1.42, 3.13),
      ...komodaRail(1.65, 0.75, 'E'),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },
  {
    id: 7, bedType: 'fixed',
    name: 'Łóżko stałe przy ścianie zachodniej, wezgłowie na północy',
    short: 'Łóżko 140×200 z pojemnikiem przy ścianie zachodniej, nogami do południowej ściany. Szafka nocna przy wezgłowiu, komoda z wieszakiem na ścianie zachodniej nad łóżkiem.',
    pros: ['Przejście od drzwi do strefy biurka ≈ 0,8 m (przy szafce nocnej), poza tym ≈ 1,2 m', 'Zwykłe łóżko z dowolnym materacem', 'Wezgłowie bliżej okna – więcej światła rano', 'Wieszak 75 cm nad komodą (ok. 7 ubrań)'],
    cons: ['Łóżko zajmuje 2,8 m² cały czas', 'Szafka nocna stoi w przejściu', 'Gniazdko G4 zostaje za łóżkiem – przenieść przy wezgłowiu'],
    guest: ['Ubrania: wieszak ścienny 75 cm nad komodą 75×40×85 (ściana zachodnia)', 'Bagaże: pojemnik pod łóżkiem, komoda', 'Szafka nocna: 40×40×55 przy wezgłowiu (wschód, północny koniec)'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.0, y: 1.58, w: 1.40, d: 2.0, h: 0.50, head: 'N', color: C.bed },
      nightstand('ns', 1.42, 1.58),
      ...komodaRail(0.70, 0.75),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },
  {
    id: 8, bedType: 'fixed',
    name: 'Łóżko stałe wzdłuż ściany południowej, wezgłowie na zachodzie',
    short: 'Łóżko 140×200 długim bokiem do ściany południowej, w dzień leżanka oparta o ścianę. Komoda z wieszakiem i szafka nocna przy ścianie zachodniej.',
    pros: ['Leżanka z oparciem o ścianę – najwygodniejsza do czytania i odpoczynku', 'Pojemnik pod łóżkiem na pościel i bagaże', 'Środek pokoju, okno i narożnik NW wolne', 'Wieszak 100 cm nad komodą (ok. 10 ubrań)'],
    cons: ['Łóżko zajmuje 2,8 m² cały czas', 'Przejście między łóżkiem a słupem ≈ 64 cm', 'Dostęp do łóżka tylko z północy (druga strona to ściana)', 'Gniazdko G4 zostaje za łóżkiem – przenieść przy wezgłowiu'],
    guest: ['Ubrania: wieszak ścienny 100 cm nad komodą 100×40×85 (ściana zachodnia)', 'Bagaże: pojemnik pod łóżkiem, komoda', 'Szafka nocna: 40×38×55 przy wezgłowiu (zachód)'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.0, y: 2.18, w: 2.0, d: 1.40, h: 0.50, head: 'W', color: C.bed },
      nightstand('ns', 0.0, 1.76, 0.40, 0.38),
      ...komodaRail(0.70, 1.00),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },
  {
    id: 9, bedType: 'fixed',
    name: 'Łóżko stałe wzdłuż ściany południowej, wezgłowie przy drzwiach',
    short: 'Łóżko 140×200 długim bokiem do ściany południowej, wezgłowie od strony drzwi, szafka nocna w narożniku przy drzwiach (nad nią włącznik światła).',
    pros: ['Szafka nocna i włącznik światła tuż obok – gaszenie światła z łóżka', 'Zachodnia ściana wolna na dużą komodę z wieszakiem 120 cm', 'Środek pokoju wolny'],
    cons: ['Łóżko zajmuje 2,8 m² cały czas', 'Przejście do strefy biurka ≈ 64 cm (przy słupie)', 'Wezgłowie przy drzwiach – więcej hałasu z korytarza', 'Gniazdko G4 zostaje za łóżkiem – przenieść przy wezgłowiu'],
    guest: ['Ubrania: wieszak ścienny 120 cm (ok. 12 ubrań) nad komodą 120×40×85', 'Bagaże: pojemnik pod łóżkiem, komoda', 'Szafka nocna: 38×38×55 w narożniku przy drzwiach (pod włącznikiem)'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.0, y: 2.18, w: 2.0, d: 1.40, h: 0.50, head: 'E', color: C.bed },
      nightstand('ns', 2.03, 3.20, 0.38, 0.38),
      ...komodaRail(0.70, 1.20),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },
  {
    id: 10, bedType: 'fixed',
    name: 'Łóżko stałe wolnostojące, dostęp z obu stron',
    short: 'Łóżko 140×200 wezgłowiem do ściany południowej, odsunięte od zachodniej ściany – dostęp z obu stron (wygodne dla pary). Szafka nocna przy wezgłowiu, komoda z wieszakiem na ścianie zachodniej.',
    pros: ['Dostęp do łóżka z obu stron – wygodne dla pary', 'Szafka nocna po zachodniej stronie wezgłowia', 'Przejście po wschodniej stronie ≈ 0,7 m'],
    cons: ['Łóżko zajmuje 2,8 m² cały czas', 'Wąskie przejście (50 cm) po zachodniej stronie łóżka', 'Mało miejsca na dodatki'],
    guest: ['Ubrania: wieszak ścienny 80 cm nad komodą 80×40×85 (ściana zachodnia)', 'Bagaże: pojemnik pod łóżkiem, komoda', 'Szafka nocna: 38×40×55 po zachodniej stronie wezgłowia'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.50, y: 1.58, w: 1.40, d: 2.0, h: 0.50, head: 'S', color: C.bed },
      nightstand('ns', 0.10, 3.18, 0.38, 0.40),
      ...komodaRail(0.70, 0.80),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },

  // ===== ŁÓŻKO SKŁADANE DO ŚCIANY 140×200 =====
  {
    id: 11, bedType: 'wall',
    name: 'Łóżko składane pionowo przy ścianie południowej + komoda z wieszakiem przy słupie',
    short: 'Łóżko 140×200 chowane pionowo w ścianie południowej obok drzwi, szafka nocna przy wezgłowiu, komoda z wieszakiem przy słupie. W dzień zachodnia połowa pokoju wolna, w narożniku NW monstera.',
    pros: ['Zwykły materac (do ok. 20–25 cm) i najwygodniejszy sen z opcji składanych', 'W dzień wolna prawie cała zachodnia połowa pokoju', 'Okno i narożnik NW zajmuje tylko monstera – nic wysokiego przy oknie', 'Komoda i wieszak na ścianie słupa, która i tak jest „martwa”'],
    cons: ['Po rozłożeniu łóżko zajmuje całą zachodnią połowę pokoju', 'Przejście do strefy biurka po rozłożeniu ≈ 0,7 m (między łóżkiem a komodą przy słupie)', 'Mechanizm i szafa łóżka to większy koszt (zabudowa na wymiar)', 'Wieszak mieści ok. 7 ubrań (75 cm) i wisi w przejściu'],
    guest: ['Ubrania: wieszak ścienny 75 cm nad komodą 75×40×85 przy słupie', 'Bagaże: komoda lub walizka na rozłożonym łóżku', 'Szafka nocna: 40×40×55 przy wezgłowiu (stała)'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'V', label: 'Łóżko składane pionowe 140×200', cabinet: { x: 0.05, y: 3.18, w: 1.55, d: 0.40, h: 2.45 }, panel: { x: 0.125, y: 1.18, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 1.60, 3.18),
      ...komodaRail(1.65, 0.75, 'E'),
      ...workzone(),
    ],
  },
  {
    id: 12, bedType: 'wall',
    name: 'Łóżko składane poziomo przy ścianie zachodniej, komoda z wieszakiem obok',
    short: 'Łóżko 140×200 składane poziomo do zabudowy przy ścianie zachodniej, szafka nocna na końcu zabudowy. Krótka komoda z wieszakiem na północ od łóżka, obok monstery.',
    pros: ['Rozłożone łóżko zostawia ≈ 84 cm przejścia – może zostać rozłożone jako leżanka na dzień', 'Cała ściana zachodnia to jedna spójna zabudowa', 'Nic wysokiego przy oknie – tylko monstera'],
    cons: ['Zabudowa zajmuje 40 cm ściany zachodniej na stałe', 'Szafka nocna jest przy wezgłowiu (końcu łóżka), nie z boku', 'Wieszak tylko 50 cm (ok. 5 ubrań); liście monstery mogą dotykać ubrań', 'Gniazdko G4 w korpusie łóżka – wyprowadzić'],
    guest: ['Ubrania: wieszak ścienny 50 cm nad komodą 50×40×85', 'Bagaże: komoda lub walizka na rozłożonym łóżku', 'Szafka nocna: 40×38×55 przy wezgłowiu w narożniku SW'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'H', label: 'Łóżko składane poziome 140×200', cabinet: { x: 0, y: 1.05, w: 0.40, d: 2.10, h: 1.95 }, panel: { x: 0.40, y: 1.10, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 0.0, 3.17, 0.40, 0.38),
      ...komodaRail(0.50, 0.50),
      ...workzone().map(i => i.id === 'plant' ? plantItem(0.46, 0.28) : i),
    ],
  },
  {
    id: 13, bedType: 'wall',
    name: 'Łóżko składane poziomo w południowej części ściany zachodniej',
    short: 'Łóżko 140×200 składane poziomo przy południowej części ściany zachodniej, szafka nocna przy wezgłowiu na północy, krótka komoda z wieszakiem nad nią, obok monstery.',
    pros: ['Rozłożone łóżko zostawia ≈ 84 cm przejścia', 'Wezgłowie i szafka nocna bliżej okna', 'Cała zabudowa po jednej stronie – środek pokoju wolny'],
    cons: ['Stopa łóżka przy ścianie południowej – brak miejsca na ławę', 'Wieszak tylko 50 cm (ok. 5 ubrań); liście monstery mogą dotykać ubrań', 'Gniazdko G4 w korpusie łóżka – wyprowadzić'],
    guest: ['Ubrania: wieszak ścienny 50 cm nad komodą 50×40×85', 'Bagaże: komoda lub walizka na rozłożonym łóżku', 'Szafka nocna: 40×38×55 przy wezgłowiu (północ)'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'H', label: 'Łóżko składane poziome 140×200', cabinet: { x: 0, y: 1.45, w: 0.40, d: 2.10, h: 1.95 }, panel: { x: 0.40, y: 1.50, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 0.0, 1.05, 0.40, 0.38),
      ...komodaRail(0.50, 0.50),
      ...workzone().map(i => i.id === 'plant' ? plantItem(0.46, 0.28) : i),
    ],
  },
  {
    id: 14, bedType: 'wall',
    name: 'Łóżko składane pionowo + dwie komody z wieszakami (słup + ściana W)',
    short: 'Łóżko 140×200 chowane pionowo przy ścianie południowej; główna komoda z wieszakiem 80 cm przy słupie i druga, krótka (40 cm), na ścianie zachodniej za monsterą.',
    pros: ['Dwa wieszaki (80 + 40 cm) – ok. 12 ubrań', 'Komoda i wieszak na ścianie słupa, która i tak jest „martwa”', 'Zwykły materac 20–25 cm', 'Nic wysokiego przy oknie – tylko monstera'],
    cons: ['Przejście do strefy biurka po rozłożeniu ≈ 0,65 m', 'Wieszak przy słupie wisi w przejściu', 'Po rozłożeniu łóżko zajmuje całą zachodnią połowę pokoju', 'Koszt mechanizmu i zabudowy'],
    guest: ['Ubrania: wieszak 80 cm nad komodą 80×40×85 przy słupie + wieszak 40 cm nad komodą 40×40×85 na ścianie zachodniej', 'Bagaże: komody lub walizka na rozłożonym łóżku', 'Szafka nocna: 40×40×55 przy wezgłowiu'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'V', label: 'Łóżko składane pionowe 140×200', cabinet: { x: 0.05, y: 3.18, w: 1.55, d: 0.40, h: 2.45 }, panel: { x: 0.125, y: 1.18, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 1.60, 3.18),
      ...komodaRail(1.62, 0.80, 'E'),
      ...komodaRail(0.70, 0.40, 'W', '2'),
      ...workzone(),
    ],
  },
  {
    id: 15, bedType: 'wall',
    name: 'Łóżko składane pionowo przesunięte na wschód + komoda z wieszakiem 1,2 m przy ścianie W',
    short: 'Łóżko 140×200 chowane pionowo w szafie przesuniętej na wschód (x 0,5–2,05 m), dzięki czemu wzdłuż zachodniej ściany zostaje pas na komodę z wieszakiem 1,2 m. Monstera w narożniku NW.',
    pros: ['Najdłuższy wieszak (120 cm, ok. 12 ubrań) z układów składanych', 'Brak wysokiej szafy – pokój jest jasny i lekki', 'Komoda stoi wzdłuż łóżka, daleko od okna i monstery'],
    cons: ['Przejście do strefy biurka po rozłożeniu tylko ≈ 0,65 m (łóżko przesunięte w stronę słupa)', 'Szafa łóżka zajmuje 1,55 m ściany południowej od x = 0,5 m – włącznik W1 zostaje 15 cm od szafy', 'Koszt mechanizmu i zabudowy'],
    guest: ['Ubrania: wieszak ścienny 120 cm nad komodą 120×40×85 przy ścianie zachodniej', 'Bagaże: komoda lub walizka na rozłożonym łóżku', 'Szafka nocna: 36×38×55 przy wezgłowiu (wschód)'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'V', label: 'Łóżko składane pionowe 140×200', cabinet: { x: 0.50, y: 3.18, w: 1.55, d: 0.40, h: 2.45 }, panel: { x: 0.575, y: 1.18, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 2.05, 3.20, 0.36, 0.38),
      ...komodaRail(1.50, 1.20),
      ...workzone(),
    ],
  },
];

// ---- geometria i walidacja ----
