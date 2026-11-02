// Archiwalne układy – V2 (nie edytować)
const C = { oak: 0xc9a06a, white: 0xf1efe9, graphite: 0x4a4d52, wood: 0xb98a55, fabric: 0x8a9a8b, fabric2: 0x7d8fa3, bed: 0xe9e4da, steel: 0x9aa0a6 };

// ---- budulce pozycji ----
const desk = (id, label, x, y, w, d, extra = {}) => ({ id, type: 'desk', label, x, y, w, d, h: 0.74, color: C.oak, ...extra });
const chair = (id, x, y) => ({ id, type: 'chair', label: 'Krzesło biurowe (w nocy wsunięte pod blat)', x, y, w: 0.56, d: 0.56, h: 0.95, color: C.graphite, mobile: true, nightDy: -0.45, face: { x: x + 0.28, y: 0 } });
const armchair = (id, x, y, w = 0.78, d = 0.74, extra = {}) => ({ id, type: 'armchair', label: 'Fotel wypoczynkowy', x, y, w, d, h: 0.85, color: C.fabric, back: 'W', ...extra });
const wallShelf = (id, label, x, y, w, d, shelves = 3, extra = {}) => ({ id, type: 'wallshelf', label, x, y, w, d, h: 0.9, z0: 1.3, color: C.white, shelves, docs: true, ...extra });
const nightstand = (id, x, y, w = 0.40, d = 0.40) => ({ id, type: 'box', label: `Szafka nocna ${Math.round(w * 100)}×${Math.round(d * 100)}×55`, x, y, w, d, h: 0.55, color: C.wood, bedside: true });
const wardrobe = (id, x, y, w, d, label) => ({ id, type: 'box', label, x, y, w, d, h: 2.10, color: C.white, wardrobe: true });

// wspólne dla wszystkich układów: biurko L pod oknem + wnęka po prawej (półki na dokumenty i drukarkę)
const workzone = () => [
  desk('dm', 'Biurko 272×70 pod oknem i we wnęce', 0.72, 0.0, 2.72, 0.70, { panels: ['W'], monitor: { x: 1.45 } }),
  desk('dr', 'Przedłużenie blatu 70×85 przy ścianie E', 2.74, 0.70, 0.70, 0.85, { panels: ['S'], pad: true }),
  { id: 'kon', type: 'box', label: 'Kontener szuflad 45×60 pod blatem', x: 2.60, y: 0.05, w: 0.45, d: 0.60, h: 0.65, color: C.white, underDesk: true },
  wallShelf('wsn', 'Półki nad blatem: dokumenty + drukarka 84×32', 2.60, 0.0, 0.84, 0.32, 4, { z0: 1.10, h: 1.10, printerShelf: true }),
  { id: 'prn', type: 'printer', label: 'Drukarka 42×32×20 na półce', x: 2.72, y: 0.0, w: 0.42, d: 0.32, h: 0.20, z0: 1.12, color: 0x3a3d42, onShelf: true },
  wallShelf('wse', 'Półki na dokumenty (ściana E) 80×30', 3.14, 0.75, 0.30, 0.80, 3),
  chair('c1', 1.45, 0.80),
];

export const LAYOUTS_V2 = [
  {
    id: 1,
    name: 'Łóżko 140 składane pionowo (ściana S) + szafa NW',
    short: 'Łóżko 140×200 chowane pionowo w ścianie południowej obok drzwi, szafka nocna przy wezgłowiu, szafa na ubrania gości w narożniku NW. W dzień lekki fotel wypoczynkowy.',
    pros: ['Po rozłożeniu łóżka przejście po wschodniej stronie ≈ 1,1 m', 'Biurko L pod oknem ma całą długość ściany północnej', 'Szafka nocna na stałe przy wezgłowiu (książka, lampka)', 'W dzień wolna prawie cała zachodnia połowa pokoju (fotel, rysowanie na podłodze, joga)'],
    cons: ['Po rozłożeniu łóżko zajmuje całą zachodnią połowę pokoju', 'Fotel jest „dzienny” – na noc trzeba go odsunąć (np. pod okno)', 'Dostęp do łóżka tylko od wschodu (po lewej ściana) – dla pary wygodniej, gdy jedna osoba śpi od ściany'],
    guest: ['Ubrania: szafa 75×60×210 z drążkiem w narożniku NW (ok. 70 cm wieszaków)', 'Bagaże: półka nad szafą (wys. 210–230) lub walizka rozłożona na rozłożonym łóżku', 'Szafka nocna: 40×40×55 po wschodniej stronie wezgłowia'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'V', label: 'Łóżko składane pionowe 140×200', cabinet: { x: 0.05, y: 3.18, w: 1.55, d: 0.40, h: 2.45 }, panel: { x: 0.125, y: 1.18, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 1.60, 3.18),
      wardrobe('war', 0.0, 0.30, 0.60, 0.75, 'Szafa na ubrania gości 75×60×210'),
      armchair('f1', 0.15, 1.70, 0.85, 0.85, { mode: 'day', label: 'Fotel wypoczynkowy (tylko w dzień)' }),
      ...workzone(),
    ],
  },
  {
    id: 2,
    name: 'Łóżko 140 składane poziomo (ściana W) + zabudowa przy ścianie',
    short: 'Cała ściana zachodnia jako zabudowa: szafa gości, łóżko 140×200 składane poziomo i szafka nocna na końcu. Rozłożone łóżko może zostać jako leżanka – przejście ≈ 84 cm.',
    pros: ['Rozłożone łóżko zostawia 84 cm przejścia – może zostać rozłożone jako leżanka na dzień', 'Cała ściana zachodnia to jedna, spójna zabudowa (szafa + łóżko + nocna)', 'Biurko L i okno nie mają żadnych przeszkód'],
    cons: ['Zabudowa zajmuje 40 cm ściany zachodniej na stałe', 'Szafka nocna jest przy wezgłowiu (końcu łóżka), nie z boku', 'Fotel w dzień musi być lekki / przesuwany'],
    guest: ['Ubrania: szafa 75×60×210 z drążkiem (NW) przy łóżku', 'Bagaże: półka nad szafą lub walizka na rozłożonym łóżku', 'Szafka nocna: 40×36×55 przy wezgłowiu w narożniku SW'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'H', label: 'Łóżko składane poziome 140×200', cabinet: { x: 0, y: 1.05, w: 0.40, d: 2.10, h: 1.95 }, panel: { x: 0.40, y: 1.10, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 0.0, 3.17, 0.40, 0.38),
      wardrobe('war', 0.0, 0.30, 0.60, 0.75, 'Szafa na ubrania gości 75×60×210'),
      armchair('f1', 0.95, 1.95, 0.85, 0.85, { mode: 'day', label: 'Fotel wypoczynkowy (tylko w dzień)' }),
      ...workzone(),
    ],
  },
  {
    id: 3,
    name: 'Łóżko 140 stałe przy ścianie zachodniej (z pojemnikiem)',
    short: 'Łóżko 140×200 na stałe, wzdłuż ściany zachodniej, z pojemnikiem na pościel i walizki; w dzień leżanka z wałkami. Bez mechanizmu – najwygodniejszy materac, najtańsze i najtrwalsze.',
    pros: ['Zwykłe łóżko z dowolnym materacem – bez ograniczeń mechanizmu', 'Przejście od drzwi do okna ≈ 1,2 m, nic się nie składa', 'Pojemnik pod łóżkiem na pościel i walizki + ława/komoda w nogach', 'Leżanka do odpoczynku zawsze gotowa (najchłodniejszy pokój latem)'],
    cons: ['Łóżko zajmuje 2,8 m² podłogi cały czas (wolna podłoga ≈ 50%)', 'Nie ma wolnego miejsca na fotel – odpoczynek na łóżku', 'Gniazdko G4 zostaje za łóżkiem – przenieść je przy wezgłowiu (lampka)', 'Ława/komoda tuż przy szafie – ciasna strefa przy zachodniej ścianie'],
    guest: ['Ubrania: szafa 75×60×210 z drążkiem (NW) + ława/komoda 140×42×45 w nogach łóżka', 'Bagaże: pojemnik pod łóżkiem i ława; półka nad szafą', 'Szafka nocna: 40×40×55 po wschodniej stronie wezgłowia'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.0, y: 1.55, w: 1.40, d: 2.0, h: 0.50, head: 'S', color: C.bed },
      { id: 'lawa', type: 'box', label: 'Ława / komoda 140×40×45 (bagaże)', x: 0.0, y: 1.10, w: 1.40, d: 0.40, h: 0.45, color: C.wood },
      nightstand('ns', 1.42, 3.13),
      wardrobe('war', 0.0, 0.30, 0.60, 0.75, 'Szafa na ubrania gości 75×60×210'),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },
  {
    id: 4,
    name: 'Łóżko 140 stałe wzdłuż ściany południowej (leżanka przy ścianie)',
    short: 'Łóżko 140×200 długim bokiem do ściany południowej, wezgłowie przy zachodniej – w dzień działa jak leżanka z oparciem o ścianę. Cała północno-zachodnia ściana na szafę.',
    pros: ['Leżanka oparta o ścianę – najwygodniejsza do czytania i odpoczynku w dzień', 'Szafa 120×60 na ubrania gości + pojemnik pod łóżkiem na bagaże', 'Środek pokoju wolny, biurko L bez przeszkód'],
    cons: ['Łóżko zajmuje 2,8 m² cały czas', 'Przejście do biurka między łóżkiem a słupem ≈ 64 cm', 'Dostęp do łóżka z jednej strony (północnej) – druga strona to ściana', 'Gniazdko G4 zostaje za łóżkiem – przenieść je przy wezgłowiu (lampka)'],
    guest: ['Ubrania: szafa 120×60×210 z drążkami przy ścianie zachodniej', 'Bagaże: pojemnik pod łóżkiem + półka nad szafą', 'Szafka nocna: 40×38×55 przy wezgłowiu (zachód)'],
    items: [
      { id: 'bed', type: 'fixedbed', label: 'Łóżko 140×200 z pojemnikiem na pościel i bagaże', x: 0.0, y: 2.18, w: 2.0, d: 1.40, h: 0.50, head: 'W', color: C.bed },
      nightstand('ns', 0.0, 1.76, 0.40, 0.38),
      wardrobe('war', 0.0, 0.30, 0.60, 1.20, 'Szafa na ubrania gości 120×60×210'),
      ...workzone(),
    ].map(i => i.id === 'c1' ? { ...i, x: 1.50, face: { x: 1.78, y: 0 } } : i),
  },
  {
    id: 5,
    name: 'Łóżko 140 składane pionowo + szafa przy słupie + fotel w narożniku',
    short: 'Jak układ 1, ale szafa gości stoi przy słupie (wykorzystuje martwą przestrzeń), a w jasnym narożniku NW stoi na stałe fotel wypoczynkowy.',
    pros: ['Fotel wypoczynkowy w jasnym narożniku przy oknie – zostaje także po rozłożeniu łóżka', 'Szafa wykorzystuje ścianę słupa – cała zachodnia ściana wolna', 'Przejście ≈ 60 cm przy szafie – wystarcza dla jednej osoby'],
    cons: ['Przejście między rozłożonym łóżkiem a szafą ≈ 60 cm', 'Drzwi szafy otwierają się w przejście – trzeba zostawić lekki odstęp', 'Fotel blisko biurka – brak miejsca na dużą pufę'],
    guest: ['Ubrania: szafa 75×50×210 przy słupie (drzwi składane lub przesuwne)', 'Bagaże: półka nad szafą lub walizka na rozłożonym łóżku', 'Szafka nocna: 40×40×55 przy wezgłowiu'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'V', label: 'Łóżko składane pionowe 140×200', cabinet: { x: 0.05, y: 3.18, w: 1.55, d: 0.40, h: 2.45 }, panel: { x: 0.125, y: 1.18, w: 1.40, d: 2.0 }, color: C.white },
      nightstand('ns', 1.60, 3.18),
      wardrobe('war', 2.14, 1.65, 0.49, 0.75, 'Szafa na ubrania gości 75×49×210 (przy słupie)'),
      armchair('f1', 0.0, 0.30, 0.70, 0.72),
      ...workzone(),
    ],
  },
];

