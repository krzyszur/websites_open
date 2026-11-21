# Kalkulator mikroperforacji laserowej

Jeden plik HTML (`index.html`), działa offline w każdej przeglądarce, bez bibliotek i bez serwera.

## Co robi

Na wejściu: materiał (stal 304, miedź, aluminium), grubość, Ø wylotu i wlotu (otwór prosty albo stożkowy), rozstaw, układ (w linii, naprzemiennie, heksagonalny), powierzchnia perforacji, priorytet czas/koszt kontra jakość.

Na wyjściu dla 8 klas laserów (ns IR/zielony/UV, ps IR/zielony, fs IR/zielony/UV) i rekomendacja:
długość fali z uzasadnieniem absorpcji, czas impulsu, energia impulsu, fluencja względem progu ablacji, metoda wiercenia
(udarowa, helikalna, trepanacja, spirala stożkowa), plamka i obiektyw F-theta, liczba impulsów i czas na otwór i na element,
smukłość i stożek, ryzyka (HAZ, grat, akumulacja ciepła, odkształcenie), orientacyjna cena maszyny i koszt usługi.
Na dole: wykres absorpcji, przekrój otworu w skali, opis modelu, lista niepewności, tabela stałych materiałowych i źródła.

## Model (skrót)

- ps/fs: d = δ·ln(F/F_th), energia właściwa e²·F_th/(2δ) przy optimum, korekta za faktyczną fluencję i głębokość otworu.
- ns: próg odparowania ρ·c_p·ΔT·√(ατ)/A; energia właściwa = (stopienie + 30 % odparowania) / (A_wnęki · η_przewodzenia).
- Czas na element = liczba otworów × (energia otworu / moc + przeskok skanera).
- Pełny opis i lista tego, czego model nie uwzględnia: sekcje „Jak to liczy” i „Czego nie jestem pewien” na stronie.

Niepewność czasów ok. 3×, progów ablacji ok. 2×, cen ±50 %. To narzędzie do rozmowy z wykonawcą i wyboru klasy maszyny, nie do ustawiania procesu.

## Przykłady wbudowane

- Stal 0,5 mm, Ø100/250 µm co 500 µm, heks (wynik wstępnego symulatora wyglądu: Ø 80–120 µm, stożek 2–3×).
- Al 0,4 mm, Ø30/90 µm co 200 µm (geometria z US 2011/0122560).
- Cu 0,5 mm, Ø80/200 µm co 400 µm.

## Jak powstał

Napisany przez Claude (Anthropic) w Claude Code, listopad 2026. Stałe materiałowe i progi ablacji z literatury (lista źródeł na stronie),
podane z pamięci modelu i oznaczone jako do weryfikacji. Testy: Playwright + Chromium (trzy przykłady, brak błędów konsoli, widok 400 px, motyw ciemny).

Źródło: repozytorium `krzyszur/websites` (prywatny projekt), ta kopia jest identyczna.
