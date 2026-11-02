# Gabinet – 3D room layout planner / Planer pokoju 3D

[Open the page / Otwórz stronę](index.html) · [Menu](../index.html) · [Source / Kod źródłowy](src/)

## English

### What it is
A single-file interactive 3D planner for a small room (3.44 × 3.58 m, 2.83 m high, window on the north wall, door on the south wall, a 0.80 × 0.82 m pillar on the east wall). The room must serve as a home study (large desk for drawing, art work and computer work, documents, a printer) **and** a guest bedroom (bed, bedside table, hanging space and luggage storage).

### What the page does
- **15 layouts**: 5 with a fixed 140×200 bed, 5 with a wall-folding bed, 5 with a sofa bed (straight and L-shaped).
- **Two desk variants**: a continuous custom worktop, or a store-bought 180×70 desk plus a custom worktop in the window recess, flush with each other and starting exactly at the edge of the window reveal.
- **Day/night mode** with animated bed folding and a desk chair that tucks under the worktop.
- Toggles for outlets/switch, dimensions, open door, wall cut-away; preset cameras; PNG export (when opened as a local file).
- For each layout: free floor area (day/night), narrowest passage to the desk zone at night, binder capacity of the shelves, outlet accessibility, automatic collision check.
- **“Odrzucone” (Rejected) tab**: earlier versions 1–3 with the reason each was rejected.

### How it was made
1. **Inputs** (provided by the room’s owner): a hand-drawn, dimensioned floor-plan sketch (PDF), a LiDAR scan from the Polycam app (GLB, ~11.6 MB), a KIRI Engine scan (USDZ, not used) and 18 iPhone photos (HEIC).
2. **Data check.** The GLB was loaded with `trimesh`; horizontal slices at several heights were plotted with Matplotlib and compared with the sketch. Width 3.46 m vs 3.44 m and depth 3.60 m vs 3.58 m – i.e. agreement within ~2 cm – so the sketch dimensions were adopted.
3. **Reading the details.** The textured scan was rendered as orthographic wall elevations with three.js in headless Chromium (Playwright); window, sill (0.50 m), radiator, door and outlet positions were measured from those images and cross-checked against the photos (converted from HEIC with Pillow + pillow-heif).
4. **Model.** The room is built parametrically from the sketch (walls with openings, pillar, window, radiator, door leaf, lamp). Furniture is a list of items with plan coordinates and heights.
5. **Validator** (`src/layouts.js`, runs in Node and in the page): footprints for day/night states, collisions, door-swing zone, shelf clearances, free floor on a 5 cm grid, narrowest passage via grid path search with a square clearance (conservative), binder capacity estimate (8 cm per binder).
6. **UI** (`src/main.js`): three.js r160 (OrbitControls, CSS2DRenderer), procedural oak floor texture, auto-hiding walls, animated wall bed and sofa bed. Everything is bundled with esbuild into one HTML file (~570 KB, no external requests).
7. **Iteration with the owner.** Requirements changed over the conversation (L-shaped desk under the window, drawers under the top, L-shaped shelves on brackets, 140 cm bed, sofa bed instead of mattress bed, no tall wardrobe, flush worktops). Each change produced a new version; the earlier ones were archived instead of deleted.
8. **Testing.** After each change: layout validation in Node, automated screenshots of all layouts (day and night, top and perspective views) in headless Chromium, console-error check.

### Tools
Claude Sonnet 5.5 in Claude Code (design, code, analysis) · three.js 0.160 · esbuild · Node.js · Python 3 (Pillow, pillow-heif, trimesh, NumPy, Matplotlib) · poppler (`pdftoppm`) · Playwright + Chromium · Polycam and iPhone (scan and photos).

### Limitations (please read)
- Room dimensions come from the owner’s measurement and are confirmed by the scan to ~2 cm.
- **Outlet and switch positions are approximate (±30 cm)** – read from a blurry textured mesh and from photos. Measure them before ordering custom furniture.
- Sofa-bed dimensions (e.g. ~205 cm deep when unfolded) are typical values; check the data sheet of the actual model.
- Passage widths use a conservative square clearance and a 60 cm person envelope; real passages are usually a bit wider.
- This is an idea-comparison tool, not construction documentation. No structural advice is given.

### Privacy
The page loads nothing from the internet, stores nothing except (optionally) your language choice in the menu, and has no analytics.

### Build from source
```bash
cd src
npm install        # three@0.160.0 and esbuild
node check2.mjs    # validate all layouts (optional)
node build.mjs     # writes index.html
```

---

## Polski

### Co to jest
Jednoplikowy, interaktywny planer 3D małego pokoju (3,44 × 3,58 m, wysokość 2,83 m, okno w ścianie północnej, drzwi w południowej, słup 0,80 × 0,82 m przy ścianie wschodniej). Pokój ma być jednocześnie gabinetem (duże biurko do rysowania, prac plastycznych i pracy z komputerem, dokumenty, drukarka) **oraz** pokojem gościnnym (łóżko, szafka nocna, miejsce na ubrania i bagaże).

### Co robi strona
- **15 układów**: 5 z łóżkiem stałym 140×200, 5 z łóżkiem składanym do ściany, 5 z rozkładaną sofą (prostą i narożną).
- **Dwa warianty biurka**: ciągły blat na wymiar albo biurko ze sklepu 180×70 + blat na wymiar we wnęce, zlicowane i zaczynające się dokładnie na krawędzi wnęki okna.
- **Tryb dzień/noc** z animacją składania łóżka i wsuwanym pod blat krzesłem.
- Przełączniki: gniazdka/włącznik, wymiary, otwarte drzwi, ukrywanie ścian; gotowe widoki kamery; zapis PNG (po otwarciu pliku lokalnie).
- Dla każdego układu: wolna podłoga (dzień/noc), najwęższe przejście do strefy biurka w nocy, pojemność półek na segregatory, dostępność gniazdek, automatyczna kontrola kolizji.
- **Zakładka „Odrzucone”**: wcześniejsze wersje 1–3 z powodem odrzucenia.

### Jak powstała
1. **Dane wejściowe** (od właściciela pokoju): odręczny szkic rzutu z wymiarami (PDF), skan LiDAR z aplikacji Polycam (GLB, ok. 11,6 MB), skan z KIRI Engine (USDZ, niewykorzystany) i 18 zdjęć z iPhone’a (HEIC).
2. **Kontrola danych.** GLB wczytałem w `trimesh`, przekroje poziome na kilku wysokościach narysowałem w Matplotlib i porównałem ze szkicem. Szerokość 3,46 m vs 3,44 m i głębokość 3,60 m vs 3,58 m – zgodność do ok. 2 cm, więc przyjąłem wymiary ze szkicu.
3. **Odczyt szczegółów.** Teksturowany skan wyrenderowałem jako rzuty ortogonalne ścian w three.js w bezgłowej przeglądarce (Playwright); położenie okna, parapetu (0,50 m), grzejnika, drzwi i gniazdek zmierzyłem na tych obrazach i skontrolowałem ze zdjęciami (HEIC → JPG przez Pillow + pillow-heif).
4. **Model.** Pokój jest budowany parametrycznie ze szkicu (ściany z otworami, słup, okno, grzejnik, skrzydło drzwi, lampa). Meble to lista elementów ze współrzędnymi w planie i wysokościami.
5. **Walidator** (`src/layouts.js`, działa w Node i na stronie): rzuty mebli dla stanu dzień/noc, kolizje, strefa otwierania drzwi, odstępy półek, wolna podłoga na siatce 5 cm, najwęższe przejście (wyszukiwanie ścieżki na siatce z kwadratowym marginesem – zachowawczo), szacunek pojemności na segregatory (8 cm na segregator).
6. **Interfejs** (`src/main.js`): three.js r160 (OrbitControls, CSS2DRenderer), proceduralna tekstura dębowej podłogi, automatyczne ukrywanie ścian, animowane łóżko składane i sofa. Całość spakowana esbuildem do jednego pliku HTML (ok. 570 KB, bez zewnętrznych zapytań).
7. **Iteracje z właścicielem.** Wymagania zmieniały się w rozmowie (biurko L pod oknem, szuflady pod blatem, półki L na kątownikach, łóżko 140, sofa zamiast łóżka z materacem, brak wysokiej szafy, blaty zlicowane). Każda zmiana dawała nową wersję; wcześniejsze trafiały do archiwum zamiast być usuwane.
8. **Testy.** Po każdej zmianie: walidacja układów w Node, automatyczne zrzuty ekranu wszystkich układów (dzień i noc, widok z góry i perspektywa) w bezgłowym Chromium, kontrola błędów konsoli.

### Narzędzia
Claude Sonnet 5.5 w Claude Code (projekt, kod, analiza) · three.js 0.160 · esbuild · Node.js · Python 3 (Pillow, pillow-heif, trimesh, NumPy, Matplotlib) · poppler (`pdftoppm`) · Playwright + Chromium · Polycam i iPhone (skan i zdjęcia).

### Ograniczenia (warto przeczytać)
- Wymiary pokoju pochodzą z pomiaru właściciela i są potwierdzone skanem do ok. 2 cm.
- **Położenie gniazdek i włącznika jest orientacyjne (±30 cm)** – odczytane z nieostrej, teksturowanej siatki i ze zdjęć. Zmierz je przed zamówieniem mebli na wymiar.
- Wymiary sof (np. ok. 205 cm głębokości po rozłożeniu) to wartości typowe; sprawdź kartę produktu konkretnego modelu.
- Przejścia liczone są zachowawczo (kwadratowy margines, obwiednia osoby 60 cm); w rzeczywistości zwykle są nieco szersze.
- To narzędzie do porównywania pomysłów, nie dokumentacja wykonawcza. Strona nie zawiera porad konstrukcyjnych.

### Prywatność
Strona nie pobiera niczego z internetu, nie zapisuje niczego poza (opcjonalnie) wyborem języka w menu i nie ma analityki.

### Budowanie ze źródeł
```bash
cd src
npm install        # three@0.160.0 i esbuild
node check2.mjs    # walidacja wszystkich układów (opcjonalnie)
node build.mjs     # zapisuje index.html
```
