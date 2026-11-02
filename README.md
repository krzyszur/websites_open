# websites_open

**EN** – Public pages and small tools built with the help of Claude (Anthropic). Every project lives in its own folder, is described on the menu page (`index.html`) in Polish and English, and has its own `README.md` explaining how it was made and which tools were used.

**PL** – Publiczne strony i małe narzędzia tworzone z pomocą Claude (Anthropic). Każdy projekt ma własny katalog, jest opisany po polsku i angielsku na stronie menu (`index.html`) oraz ma własny `README.md` z opisem, jak powstał i z jakich narzędzi korzystano.

## Projects / Projekty

| Project | Description (EN) | Opis (PL) |
|---|---|---|
| [`gabinet/`](gabinet/) | 3D layout planner for a small study + guest room: 15 layouts, day/night mode, collision and passage checks. | Planer 3D małego gabinetu z pokojem gościnnym: 15 układów, tryb dzień/noc, kontrola kolizji i przejść. |

## Structure / Struktura

```
index.html        menu page (PL/EN) / strona menu
README.md         this file / ten plik
.nojekyll         serve files as-is on GitHub Pages
<project>/
  index.html      the page itself / sama strona
  README.md       how it was made, tools, limitations / jak powstała, narzędzia, ograniczenia
  src/            source code (if any) / kod źródłowy (jeśli jest)
```

## Publishing / Publikacja

GitHub Pages: *Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`*. The site is then served at `https://krzyszur.github.io/websites_open/`.

## Adding a project / Dodawanie projektu

1. Create `<project>/index.html` (a single self-contained file is ideal) and `<project>/README.md`.
2. Add a card to `index.html` (copy the `<article class="card">` block) with a PL + EN description, a short “how it was made” and a “tools used” list.
3. Add a row to the table above.

## Note on AI / Uwaga o AI

**EN** – The pages are produced with an AI assistant (Claude Sonnet 5.5 running in Claude Code); the owner provides requirements, measurements and reviews each iteration. Each project README states what was verified and what is only an estimate.

**PL** – Strony powstają z pomocą asystenta AI (Claude Sonnet 5.5 w Claude Code); właściciel dostarcza wymagania i pomiary oraz ocenia każdą iterację. README każdego projektu mówi, co zostało zweryfikowane, a co jest tylko oszacowaniem.

## License / Licencja

No license has been chosen yet – all rights reserved by default. / Licencja nie została jeszcze wybrana – domyślnie wszelkie prawa zastrzeżone.
