// Archiwalne układy – V1 (nie edytować)
const C = { oak: 0xc9a06a, white: 0xf1efe9, graphite: 0x4a4d52, wood: 0xb98a55, fabric: 0x8a9a8b, fabric2: 0x7d8fa3, bed: 0xe9e4da, steel: 0x9aa0a6 };

// ---- budulce pozycji ----
const desk = (id, label, x, y, w, d, extra = {}) => ({ id, type: 'desk', label, x, y, w, d, h: 0.74, color: C.oak, ...extra });
const chair = (id, x, y) => ({ id, type: 'chair', label: 'Krzesło biurowe', x, y, w: 0.56, d: 0.56, h: 0.95, color: C.graphite, mobile: true });
const armchair = (id, x, y, w = 0.78, d = 0.74, rot = 0) => ({ id, type: 'armchair', label: 'Fotel do czytania', x, y, w, d, h: 0.85, color: C.fabric, rot });
const wallShelf = (id, label, x, y, w, d, shelves = 3) => ({ id, type: 'wallshelf', label, x, y, w, d, h: 0.9, z0: 1.3, color: C.white, shelves, docs: true });
const tower = (id, label, x, y, w, d, h = 2.1, shelves = 6) => ({ id, type: 'tower', label, x, y, w, d, h, color: C.white, shelves, docs: true });
const sidetable = (id, x, y, s = 0.34) => ({ id, type: 'table', label: 'Stolik pomocniczy', x, y, w: s, d: s, h: 0.5, color: C.wood, open: true });

export const LAYOUTS_V1 = [
  {
    id: 1,
    name: 'Murphy poziomy – zachód + kącik czytelniczy',
    short: 'Łóżko 160×200 składane do ściany zachodniej, biurko przy ścianie wschodniej, fotel w rogu przy oknie.',
    pros: ['Po złożeniu łóżka środek pokoju jest wolny', 'Biurko ma światło z boku (okno po lewej)', 'Fotel w jasnym narożniku przy oknie', 'Przejście do biurka przy słupie ≥ 0,6 m nawet po rozłożeniu łóżka'],
    cons: ['Fotel i krzesło po rozłożeniu łóżka stoją bardzo blisko', 'Szafa łóżka zasłania gniazdko G4 (zasilanie lampek wewnątrz szafy)', 'Mało miejsca na dokumenty – tylko półki ścienne i regał narożny'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'H', label: 'Łóżko składane poziome 160×200', cabinet: { x: 0, y: 1.05, w: 0.40, d: 2.10, h: 1.95 }, panel: { x: 0.40, y: 1.10, w: 1.60, d: 2.0 }, color: C.white },
      armchair('f1', 0.0, 0.30, 0.70, 0.72),
      sidetable('st1', 0.82, 0.30, 0.30),
      desk('d1', 'Biurko 140×60', 2.84, 0.08, 0.60, 1.40),
      chair('c1', 2.22, 0.52),
      wallShelf('ws1', 'Półki ścienne na segregatory 140×30', 3.14, 0.08, 0.30, 1.40),
      wallShelf('ws2', 'Półki ścienne 58×30', 2.56, 0.0, 0.58, 0.30, 3),
    ],
  },
  {
    id: 2,
    name: 'Murphy pionowy – ściana południowa',
    short: 'Łóżko 160×200 składane pionowo przy ścianie południowej obok drzwi; zachód zostaje na fotel, wschód na biurko.',
    pros: ['Szafa łóżka mieści się w 0,40 m głębokości na krótszej ścianie', 'Po złożeniu łóżka wolna cała ściana zachodnia (3,6 m)', 'Po rozłożeniu łóżka przejście od drzwi do biurka ≥ 80 cm', 'Szafa ma wysokość ~2,45 m – dużo miejsca w korpusie na pościel'],
    cons: ['Po rozłożeniu łóżko zajmuje całą zachodnią połowę pokoju', 'Dostęp do łóżka tylko z jednej strony (wschodniej) przy 160 cm', 'Biurko i fotel tak jak w układzie 1 – dokumenty tylko na półkach ściennych'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'V', label: 'Łóżko składane pionowe 160×200', cabinet: { x: 0.05, y: 3.18, w: 1.75, d: 0.40, h: 2.45 }, panel: { x: 0.15, y: 1.18, w: 1.60, d: 2.0 }, color: C.white },
      armchair('f1', 0.0, 0.30, 0.70, 0.72),
      sidetable('st1', 0.82, 0.30, 0.30),
      desk('d1', 'Biurko 140×60', 2.84, 0.08, 0.60, 1.40),
      chair('c1', 2.22, 0.52),
      wallShelf('ws1', 'Półki ścienne na segregatory 140×30', 3.14, 0.08, 0.30, 1.40),
      wallShelf('ws2', 'Półki ścienne 58×30', 2.56, 0.0, 0.58, 0.30, 3),
    ],
  },
  {
    id: 3,
    name: 'Rozkładana sofa 160×200 + komoda na dokumenty',
    short: 'Zamiast łóżka w ścianie – sofa przy ścianie zachodniej, rozkładana na łóżko; ściana południowa to komoda i regał na dokumenty.',
    pros: ['Sofa to wygodne miejsce wypoczynku na co dzień', 'Najwięcej miejsca na dokumenty (komoda + regał + półki)', 'Prosta, tania konstrukcja – bez montażu mechanizmu w ścianie', 'Wolny środek pokoju także po rozłożeniu (≥1,0 m do słupa)'],
    cons: ['Rozkładanie sofy trwa dłużej niż opuszczenie łóżka z ściany', 'Materac sofy zwykle jest cieńszy niż w łóżku ściennym', 'Sofa zajmuje 0,95 m szerokości cały czas'],
    items: [
      { id: 'sofa', type: 'sofa', label: 'Sofa rozkładana 220×95 (łóżko 160×200)', x: 0.0, y: 0.45, w: 0.95, d: 2.20, h: 0.85, color: C.fabric2, mode: 'day' },
      { id: 'sofaopen', type: 'sofabed', label: 'Sofa rozłożona na łóżko 160×200', x: 0.0, y: 0.45, w: 1.60, d: 2.20, h: 0.48, color: C.fabric2, mode: 'night' },
      sidetable('st1', 0.12, 0.05, 0.30),
      desk('d1', 'Biurko 140×60', 2.84, 0.08, 0.60, 1.40),
      chair('c1', 2.22, 0.52),
      wallShelf('ws1', 'Półki ścienne na segregatory 140×30', 3.14, 0.08, 0.30, 1.40),
      wallShelf('ws2', 'Półki ścienne 58×30', 2.56, 0.0, 0.58, 0.30, 3),
      { id: 'kom', type: 'box', label: 'Komoda 150×38×85', x: 0.05, y: 3.20, w: 1.50, d: 0.38, h: 0.85, color: C.wood },
      tower('t1', 'Regał na segregatory 50×32×210', 1.55, 3.26, 0.50, 0.32, 2.1, 6),
    ],
  },
  {
    id: 4,
    name: 'Murphy poziomy – północ + biurko pod południową ścianą',
    short: 'Łóżko przy północnej części ściany zachodniej, biurko i regał na dokumenty przy ścianie południowej, fotel w jasnym narożniku NE.',
    pros: ['Duży zestaw dokumentów: regał 6 półek + półki nad biurkiem', 'Biurko blisko włącznika światła, gniazdko G4 zostaje wolne', 'Fotel NE ma najlepsze światło dzienne i gniazdka G2/G3 na lampę', 'Biurko oddalone od okna – brak odblasków na monitorze'],
    cons: ['Biurko naprzeciw łóżka – po rozłożeniu krzesło ma ≈0,1 m do łóżka', 'Łóżko tuż przy oknie i grzejniku (zostaje 10 cm do grzejnika)', 'Regał stoi ok. 17 cm od włącznika światła – wygodniej będzie go przesunąć o kilka cm w stronę drzwi'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'H', label: 'Łóżko składane poziome 160×200', cabinet: { x: 0, y: 0.20, w: 0.40, d: 2.10, h: 1.95 }, panel: { x: 0.40, y: 0.25, w: 1.60, d: 2.0 }, color: C.white },
      desk('d1', 'Biurko 140×60', 0.05, 2.98, 1.40, 0.60, { rotAlong: 'x' }),
      chair('c1', 0.45, 2.40),
      wallShelf('ws1', 'Półki ścienne na segregatory 140×30', 0.05, 3.28, 1.40, 0.30),
      tower('t1', 'Regał na segregatory 50×32×210', 1.55, 3.26, 0.50, 0.32, 2.1, 6),
      armchair('f1', 2.30, 0.46, 0.70, 0.74),
      sidetable('st1', 3.08, 0.46, 0.34),
    ],
  },
  {
    id: 5,
    name: 'Biurko przy oknie + Murphy poziomy w południowej części',
    short: 'Biurko przed oknem (najlepsze światło), łóżko składane przy południowej części ściany zachodniej, fotel w rogu NE.',
    pros: ['Biurko pod oknem – najlepsze światło dzienne', 'Szafa łóżka w rogu SW, nie zasłania okna i grzejnika', 'Narożnik NW: wąski regał 34 cm, gniazdko G1 zostaje wolne', 'Najbardziej „biurowy” z układów'],
    cons: ['Grzejnik pod blatem biurka – trzeba zostawić ≥ 30 cm odstępu i nie zasłaniać go papierami', 'Blat (74 cm) przysłania dolną część okna (parapet na 50 cm)', 'Po rozłożeniu łóżka przejście do biurka tylko ok. 60 cm (między łóżkiem a słupem)', 'Najmniej miejsca na dokumenty z wszystkich układów'],
    items: [
      { id: 'wb', type: 'wallbed', orient: 'H', label: 'Łóżko składane poziome 160×200', cabinet: { x: 0, y: 1.48, w: 0.40, d: 2.10, h: 1.95 }, panel: { x: 0.40, y: 1.53, w: 1.60, d: 2.0 }, color: C.white },
      desk('d1', 'Biurko 140×55', 0.95, 0.35, 1.40, 0.55, { rotAlong: 'x' }),
      chair('c1', 1.35, 0.93),
      armchair('f1', 2.60, 0.46, 0.70, 0.74),
      wallShelf('ws1', 'Półki ścienne 140×30 (ściana E)', 3.14, 0.9, 0.30, 0.70, 3),
      { id: 'tw2', type: 'tower', label: 'Regał na segregatory 34×32×210', x: 0.36, y: 0.0, w: 0.34, d: 0.32, h: 2.1, color: C.white, shelves: 6, docs: true },
    ],
  },
];

