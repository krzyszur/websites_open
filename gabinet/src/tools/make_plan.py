#!/usr/bin/env python3
"""
Gabinet – plan pokoju (stan istniejący): PDF (A3, 3 arkusze) + DXF (mm, model 1:1).
Room plan "as measured": PDF (A3, 3 sheets) + DXF (mm, 1:1 model space).

Jedno źródło geometrii -> dwa wyjścia (ezdxf dla DXF, matplotlib dla PDF).
Układ współrzędnych rzutu: X na wschód, Y na północ, początek w narożniku SW (wewnętrzne lica ścian), mm.

Użycie / usage:  python3 make_plan.py [katalog_wyjściowy]
Wymaga / requires: ezdxf, matplotlib
"""
import sys, os, math
import ezdxf
from ezdxf import units
from ezdxf.enums import TextEntityAlignment
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Arc, Rectangle

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
DATE = "2026-11-02"

# ------------------------------------------------------------------ dane / data (mm)
W, D, H = 3440, 3578, 2833                 # szerokość (E-W), długość (N-S) wewnętrzna, wysokość
WIN0, WIN1 = 711, 2553                     # okno: otwór w ścianie N
DOOR0, DOOR1 = 2426, 3270                  # drzwi w ścianie S (zawiasy po stronie E, skrzydło do wnętrza)
PIL_X0 = 3440 - 801                        # słup/występ przy ścianie E: wysunięcie 801
PIL_YN = D - 1609                          # lico N słupa
PIL_YS = PIL_YN - 820                      # lico S słupa
# elementy orientacyjne (ze skanu LiDAR, nie z pomiaru taśmą) / approximate values from the LiDAR scan
SILL, HEAD, NICHE = 500, 2450, 100         # parapet, nadproże okna, głębokość wnęki okiennej
DOOR_H = 2200
RAD = dict(x0=1130, x1=2350, depth=150, z0=40, z1=400)
# gniazdka/przełączniki 85x85: id, ściana, a = odległość od wskazanej ściany do najbliższej krawędzi, od czego, wysokość dolnej krawędzi
SZ = 85
OUTLETS = [
    dict(id="G1", kind="gniazdko", wall="N", a=324, ref="W", z=260, note=""),
    dict(id="G2", kind="gniazdko", wall="N", a=162, ref="E", z=260, note=""),
    dict(id="G3", kind="gniazdko", wall="E", a=348, ref="N", z=260, note="wysokość przyjęta – do potwierdzenia"),
    dict(id="G4", kind="gniazdko", wall="W", a=940, ref="S", z=263, note=""),
    dict(id="W1", kind="przełącznik", wall="S", a=2200, ref="W", z=1250, note=""),
]
AREA = (W * D - 801 * 820) / 1e6

NOTES = [
    "1. Wymiary w mm, w świetle (lica wewnętrzne ścian). Grubości ścian nie mierzono.",
    "2. Wymiary z pomiaru ręcznego właściciela; skan LiDAR (Polycam) zgodny do ok. 2 cm.",
    "3. Rozbieżności pomiarów: suma 1609+820+1162 na ścianie E = 3591 wobec 3578 na ścianie W",
    "    (13 mm) – rysunek przyjmuje 3578, odcinek S ściany E = 1149 (zmierzono 1162).",
    "    Ściana N: 711+1842+885 = 3438 wobec 3440 (S) – przyjęto 3440, odcinek E = 887.",
    "4. Linia przerywana szara = wartości orientacyjne ze skanu (parapet, nadproże, głębokość",
    "    wnęki okna, grzejnik, wysokość drzwi) – do weryfikacji na obiekcie.",
    "5. Gniazdka/przełączniki 85×85 mm: a = odległość od ściany do najbliższej krawędzi,",
    "    z = wysokość dolnej krawędzi nad podłogą. Wysokość G3 przyjęta jak G1/G2.",
    "6. Skrzydło drzwi otwiera się do wnętrza (zawiasy po stronie wschodniej).",
]

# ------------------------------------------------------------------ prymitywy / primitives
class View:
    """Zbiór prymitywów w lokalnych współrzędnych (mm, Y w górę)."""
    def __init__(self, name):
        self.name, self.ops = name, []
    def line(self, layer, p1, p2): self.ops.append(("line", layer, p1, p2))
    def poly(self, layer, pts, closed=False): self.ops.append(("poly", layer, list(pts), closed))
    def rect(self, layer, p1, p2):
        (x0, y0), (x1, y1) = p1, p2
        self.poly(layer, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], True)
    def arc(self, layer, c, r, a0, a1): self.ops.append(("arc", layer, c, r, a0, a1))
    def text(self, layer, p, s, h=50, ha="c", va="m", rot=0): self.ops.append(("text", layer, p, s, h, ha, va, rot))
    def dim(self, p1, p2, base, orient): self.ops.append(("dim", p1, p2, base, orient))  # orient 'h' (base=y) lub 'v' (base=x)


def build_plan():
    v = View("plan")
    # ściany (lica wewnętrzne) – odcinki
    wall = lambda a, b: v.line("SCIANY", a, b)
    wall((0, 0), (DOOR0, 0)); wall((DOOR1, 0), (W, 0))                              # S (z otworem drzwiowym)
    wall((W, 0), (W, PIL_YS)); wall((W, PIL_YS), (PIL_X0, PIL_YS))                   # E (dół) + słup
    wall((PIL_X0, PIL_YS), (PIL_X0, PIL_YN)); wall((PIL_X0, PIL_YN), (W, PIL_YN)); wall((W, PIL_YN), (W, D))
    wall((W, D), (WIN1, D)); wall((WIN0, D), (0, D))                                 # N (z otworem okiennym)
    wall((0, D), (0, 0))                                                             # W
    # okno + wnęka (orientacyjnie)
    v.poly("OTWORY_APPROX", [(WIN0, D), (WIN0, D + NICHE), (WIN1, D + NICHE), (WIN1, D)])
    v.line("OTWORY", (WIN0, D + 40), (WIN1, D + 40)); v.line("OTWORY", (WIN0, D + 60), (WIN1, D + 60))
    # drzwi: otwór, skrzydło otwarte 90° i łuk
    v.line("OTWORY", (DOOR0, 0), (DOOR0, -60)); v.line("OTWORY", (DOOR1, 0), (DOOR1, -60))
    v.line("DRZWI", (DOOR1, 0), (DOOR1, DOOR1 - DOOR0))
    v.arc("DRZWI_LUK", (DOOR1, 0), DOOR1 - DOOR0, 90, 180)
    # grzejnik (orientacyjnie)
    v.rect("GRZEJNIK_APPROX", (RAD["x0"], D - RAD["depth"]), (RAD["x1"], D))
    # gniazdka (prostokąty 85 x 30 przy ścianie) + podpisy
    for o in OUTLETS:
        L = [f'{o["id"]}', f'z={o["z"]}']
        if o["wall"] == "N":
            x0 = o["a"] if o["ref"] == "W" else W - o["a"] - SZ
            v.rect("GNIAZDA", (x0, D - 30), (x0 + SZ, D)); v.text("GNIAZDA", (x0 + SZ / 2, D - 105), L[0], 50)
            v.text("GNIAZDA", (x0 + SZ / 2, D - 165), L[1], 40)
        elif o["wall"] == "E":
            y0 = D - o["a"] - SZ
            v.rect("GNIAZDA", (W - 30, y0), (W, y0 + SZ)); v.text("GNIAZDA", (W - 70, y0 + SZ / 2 + 30), L[0], 50, "r")
            v.text("GNIAZDA", (W - 70, y0 + SZ / 2 - 30), L[1], 40, "r")
        elif o["wall"] == "W":
            y0 = o["a"]
            v.rect("GNIAZDA", (0, y0), (30, y0 + SZ)); v.text("GNIAZDA", (70, y0 + SZ / 2 + 30), L[0], 50, "l")
            v.text("GNIAZDA", (70, y0 + SZ / 2 - 30), L[1], 40, "l")
        elif o["wall"] == "S":
            x0 = o["a"]
            v.rect("GNIAZDA", (x0, 0), (x0 + SZ, 30)); v.text("GNIAZDA", (x0 + SZ / 2, 105), L[0], 50)
            v.text("GNIAZDA", (x0 + SZ / 2, 165), L[1], 40)
    # wymiary – strona N (nad ścianą)
    v.dim((0, D), (324, D), D + 250, "h"); v.dim((W - 162, D), (W, D), D + 250, "h")
    v.dim((0, D), (WIN0, D), D + 450, "h"); v.dim((WIN0, D), (WIN1, D), D + 450, "h"); v.dim((WIN1, D), (W, D), D + 450, "h")
    v.dim((0, D), (W, D), D + 650, "h")
    # strona E
    v.dim((W, D - 348), (W, D), W + 250, "v")
    v.dim((W, PIL_YN), (W, D), W + 450, "v"); v.dim((W, PIL_YS), (W, PIL_YN), W + 450, "v"); v.dim((W, 0), (W, PIL_YS), W + 450, "v")
    # strona S (pod ścianą)
    v.dim((0, 0), (2200, 0), -250, "h")
    v.dim((0, 0), (DOOR0, 0), -450, "h"); v.dim((DOOR0, 0), (DOOR1, 0), -450, "h"); v.dim((DOOR1, 0), (W, 0), -450, "h")
    v.dim((0, 0), (W, 0), -650, "h")
    # strona W
    v.dim((0, 0), (0, 940), -250, "v"); v.dim((0, 0), (0, D), -650, "v")
    # wymiar głębokości słupa (wewnątrz pokoju, pod słupem)
    v.dim((PIL_X0, PIL_YS), (W, PIL_YS), PIL_YS - 110, "h")
    # opis pomieszczenia
    v.text("TEKST", (1250, 1900), "GABINET / POKÓJ GOŚCINNY", 80)
    v.text("TEKST", (1250, 1780), f"pow. ok. {AREA:.2f} m² · wys. {H}".replace(".", ","), 55)
    v.text("TEKST", (DOOR0 + (DOOR1 - DOOR0) / 2 - 260, 360), "drzwi 844", 45)
    v.text("TEKST", ((WIN0 + WIN1) / 2, D - 330), "okno 1842", 45)
    v.text("TEKST", ((RAD["x0"] + RAD["x1"]) / 2, D - RAD["depth"] / 2), "grzejnik (ok.)", 40)
    v.text("TEKST", (3250 - 0, PIL_YN - 410), "słup / występ", 45, "c")
    # strzałka północy
    ax, ay = -300, D + 650
    v.line("TEKST", (ax, ay - 200), (ax, ay + 200)); v.poly("TEKST", [(ax, ay + 280), (ax - 60, ay + 120), (ax + 60, ay + 120)], True)
    v.text("TEKST", (ax, ay + 360), "N", 70)
    return v


def elev_frame(v, w):
    v.line("SCIANY", (0, 0), (w, 0)); v.line("SCIANY", (0, H), (w, H))
    v.line("SCIANY", (0, 0), (0, H)); v.line("SCIANY", (w, 0), (w, H))
    v.dim((0, 0), (0, H), -250, "v")
    v.dim((0, 0), (w, 0), -250, "h")


def outlet_rect(v, o, x0):
    v.rect("GNIAZDA", (x0, o["z"]), (x0 + SZ, o["z"] + SZ))
    v.line("GNIAZDA", (x0, o["z"]), (x0 + SZ, o["z"] + SZ)); v.line("GNIAZDA", (x0, o["z"] + SZ), (x0 + SZ, o["z"]))


def build_elev(wall):
    """Widoki ścian od wnętrza pokoju. Lewo-prawo: N: W→E, E: N→S, S: E→W, W: S→N."""
    if wall == "N":
        v = View("elevN"); w = W; elev_frame(v, w)
        v.rect("OTWORY_APPROX", (WIN0, SILL), (WIN1, HEAD))
        v.line("OTWORY_APPROX", ((WIN0 + WIN1) / 2, SILL), ((WIN0 + WIN1) / 2, HEAD))
        v.rect("GRZEJNIK_APPROX", (RAD["x0"], RAD["z0"]), (RAD["x1"], RAD["z1"]))
        for o in OUTLETS:
            if o["wall"] == "N":
                x0 = o["a"] if o["ref"] == "W" else W - o["a"] - SZ
                outlet_rect(v, o, x0); v.text("GNIAZDA", (x0 + SZ / 2, o["z"] + SZ + 70), o["id"], 50)
                if o["ref"] == "W": v.dim((0, o["z"]), (x0, o["z"]), 600, "h")
                else: v.dim((x0 + SZ, o["z"]), (W, o["z"]), 600, "h")
        v.dim((WIN0, SILL), (WIN0, HEAD), WIN0 - 250, "v"); v.dim((WIN0, 0), (WIN0, SILL), WIN0 - 250, "v")
        v.dim((WIN0, H), (WIN1, H), H + 250, "h")
        v.dim((0, H), (WIN0, H), H + 250, "h"); v.dim((WIN1, H), (W, H), H + 250, "h")
        v.text("TEKST", ((WIN0 + WIN1) / 2, HEAD + 120), "okno 1842 (wys. ok. 500–2450)", 45)
        v.text("TEKST", ((RAD["x0"] + RAD["x1"]) / 2, (RAD["z0"] + RAD["z1"]) / 2), "grzejnik (ok.)", 40)
        title = "ŚCIANA PÓŁNOCNA (widok od wnętrza)"
    elif wall == "E":
        v = View("elevE"); w = D; elev_frame(v, w)
        # słup: wysunięty 801 w stronę widza
        v.rect("SLUP", (D - PIL_YN, 0), (D - PIL_YS, H))
        v.text("TEKST", ((D - PIL_YN + D - PIL_YS) / 2, H / 2), "słup / występ", 55, "c", "m", 90)
        v.text("TEKST", ((D - PIL_YN + D - PIL_YS) / 2 - 120, H / 2 - 700), "wysunięcie 801", 45, "c", "m", 90)
        for o in OUTLETS:
            if o["wall"] == "E":
                x0 = o["a"]; outlet_rect(v, o, x0); v.text("GNIAZDA", (x0 + SZ / 2, o["z"] + SZ + 70), o["id"] + " (zał. z=260)", 50, "l")
                v.dim((0, o["z"]), (x0, o["z"]), 700, "h")
        v.dim((0, H), (D - PIL_YN, H), H + 250, "h"); v.dim((D - PIL_YN, H), (D - PIL_YS, H), H + 250, "h"); v.dim((D - PIL_YS, H), (D, H), H + 250, "h")
        title = "ŚCIANA WSCHODNIA (widok od wnętrza)"
    elif wall == "S":
        v = View("elevS"); w = W; elev_frame(v, w)
        x0d, x1d = W - DOOR1, W - DOOR0
        v.rect("OTWORY_APPROX", (x0d, 0), (x1d, DOOR_H))
        for o in OUTLETS:
            if o["wall"] == "S":
                xw = o["a"]; x0 = W - xw - SZ
                outlet_rect(v, o, x0); v.text("GNIAZDA", (x0 + SZ / 2, o["z"] + SZ + 70), o["id"], 50)
                v.dim((x0 + SZ, o["z"]), (W, o["z"]), o["z"] + SZ + 250, "h")
        v.dim((x0d, 0), (x0d, DOOR_H), x0d + 250, "v")
        v.dim((0, H), (x0d, H), H + 250, "h"); v.dim((x0d, H), (x1d, H), H + 250, "h"); v.dim((x1d, H), (W, H), H + 250, "h")
        v.text("TEKST", ((x0d + x1d) / 2, DOOR_H + 120), "drzwi 844 (wys. ok. 2200)", 45)
        title = "ŚCIANA POŁUDNIOWA (widok od wnętrza)"
    else:
        v = View("elevW"); w = D; elev_frame(v, w)
        for o in OUTLETS:
            if o["wall"] == "W":
                x0 = o["a"]; outlet_rect(v, o, x0); v.text("GNIAZDA", (x0 + SZ / 2, o["z"] + SZ + 70), o["id"], 50)
                v.dim((0, o["z"]), (x0, o["z"]), 700, "h")
        title = "ŚCIANA ZACHODNIA (widok od wnętrza)"
    v.w = w
    # wymiary wysokości gniazdek (pionowo, obok elementu)
    for o in OUTLETS:
        if o["wall"] == wall:
            if wall == "N": x0 = o["a"] if o["ref"] == "W" else W - o["a"] - SZ
            elif wall == "E": x0 = o["a"]
            elif wall == "S": x0 = W - o["a"] - SZ
            else: x0 = o["a"]
            if x0 + SZ + 220 > v.w - 80: v.dim((x0, 0), (x0, o["z"]), x0 - 220, "v")
            else: v.dim((x0 + SZ, 0), (x0 + SZ, o["z"]), x0 + SZ + 220, "v")
    v.title = title; v.w = w
    return v


# ------------------------------------------------------------------ DXF
def write_dxf(path, plan, elevs):
    doc = ezdxf.new("R2010", setup=True)
    doc.units = units.MM
    doc.header["$INSUNITS"] = 4
    doc.styles.get("Standard").dxf.font = "arial.ttf"
    L = {"SCIANY": (7, 50, "Continuous"), "OTWORY": (7, 25, "Continuous"), "OTWORY_APPROX": (8, 25, "DASHED"), "DRZWI": (7, 25, "Continuous"),
         "DRZWI_LUK": (8, 18, "DASHED"), "SLUP": (7, 35, "Continuous"), "GRZEJNIK_APPROX": (8, 25, "DASHED"), "GNIAZDA": (1, 35, "Continuous"),
         "WYMIARY": (3, 18, "Continuous"), "TEKST": (7, 18, "Continuous"), "UWAGI": (7, 18, "Continuous")}
    for n, (c, lw, lt) in L.items():
        doc.layers.add(n, color=c, lineweight=lw, linetype=lt)
    ds = doc.dimstyles.get("EZDXF")
    for k, val in dict(dimtxt=50, dimasz=40, dimtsz=30, dimexe=30, dimexo=25, dimgap=20, dimdec=0, dimtad=1, dimzin=8, dimclrd=3, dimclre=3, dimclrt=3, dimlfac=1).items():
        ds.dxf.set(k, val)
    msp = doc.modelspace()
    dimstyle = dict(dimtxt=50, dimasz=40, dimtsz=30, dimexe=30, dimexo=25, dimgap=20, dimdec=0, dimtad=1, dimclrd=3, dimclre=3, dimclrt=3, dimtxsty="Standard")
    AL = {"l": 0, "c": 1, "r": 2}
    def emit(v, ox, oy):
        P = lambda p: (p[0] + ox, p[1] + oy)
        for op in v.ops:
            k = op[0]
            if k == "line": msp.add_line(P(op[2]), P(op[3]), dxfattribs={"layer": op[1]})
            elif k == "poly": msp.add_lwpolyline([P(p) for p in op[2]], close=op[3], dxfattribs={"layer": op[1]})
            elif k == "arc": msp.add_arc(P(op[2]), op[3], op[4], op[5], dxfattribs={"layer": op[1]})
            elif k == "text":
                _, layer, p, s, h, ha, va, rot = op
                al = {("l", "m"): TextEntityAlignment.MIDDLE_LEFT, ("c", "m"): TextEntityAlignment.MIDDLE_CENTER, ("r", "m"): TextEntityAlignment.MIDDLE_RIGHT}[(ha, va)]
                t = msp.add_text(s, dxfattribs={"layer": layer, "height": h, "rotation": rot, "style": "Standard"}); t.set_placement(P(p), align=al)
            elif k == "dim":
                _, p1, p2, base, orient = op
                if orient == "h":
                    d = msp.add_linear_dim(base=P((0, base)), p1=P(p1), p2=P(p2), angle=0, override=dimstyle, dxfattribs={"layer": "WYMIARY"})
                else:
                    d = msp.add_linear_dim(base=P((base, 0)), p1=P(p1), p2=P(p2), angle=90, override=dimstyle, dxfattribs={"layer": "WYMIARY"})
                d.render()
    emit(plan, 0, 0)
    msp.add_text("RZUT – STAN ISTNIEJĄCY (X na wschód, Y na północ, początek: narożnik SW)", dxfattribs={"layer": "TEKST", "height": 80}).set_placement((-700, D + 1150), align=TextEntityAlignment.MIDDLE_LEFT)
    x = 6500
    for v in elevs:
        emit(v, x, 0)
        msp.add_text(v.title, dxfattribs={"layer": "TEKST", "height": 80}).set_placement((x, H + 800), align=TextEntityAlignment.MIDDLE_LEFT)
        x += v.w + 1300
    notes = "\\P".join(["UWAGI / NOTES"] + NOTES + ["", "Jednostki: mm. Opracowano: " + DATE + " (Claude, AI) na podstawie pomiarów właściciela i skanu LiDAR."])
    mt = msp.add_mtext(notes, dxfattribs={"layer": "UWAGI", "char_height": 50, "width": 3600, "style": "Standard"}); mt.set_location((6500, -1100))
    # tabela gniazdek
    rows = ["TABELA GNIAZDEK / OUTLETS (85×85 mm)", "id   element       ściana  a [mm]  od ściany  z [mm] (dolna krawędź)"]
    for o in OUTLETS:
        rows.append(f'{o["id"]:<4} {o["kind"]:<12} {o["wall"]:^6} {o["a"]:^7} {o["ref"]:^9} {o["z"]:^6} {o["note"]}')
    mt2 = msp.add_mtext("\\P".join(rows), dxfattribs={"layer": "UWAGI", "char_height": 50, "width": 5200}); mt2.set_location((10400, -1100))
    doc.audit()
    doc.saveas(path)
    return doc


# ------------------------------------------------------------------ PDF
LW = {"SCIANY": 0.5, "OTWORY": 0.25, "OTWORY_APPROX": 0.25, "DRZWI": 0.25, "DRZWI_LUK": 0.18, "SLUP": 0.35, "GRZEJNIK_APPROX": 0.25,
      "GNIAZDA": 0.35, "WYMIARY": 0.18, "TEKST": 0.18}
COL = {"OTWORY_APPROX": "#7a7a7a", "DRZWI_LUK": "#7a7a7a", "GRZEJNIK_APPROX": "#7a7a7a", "GNIAZDA": "#c0261f", "WYMIARY": "#0b6b2a"}
DASH = {"OTWORY_APPROX": (0, (6, 3)), "DRZWI_LUK": (0, (6, 3)), "GRZEJNIK_APPROX": (0, (6, 3))}
MM = 72 / 25.4


class Page:
    def __init__(self, pdf, title, sheet_no, sheets, scale_txt):
        self.fig = plt.figure(figsize=(420 / 25.4, 297 / 25.4)); self.ax = self.fig.add_axes([0, 0, 1, 1])
        self.ax.set_xlim(0, 420); self.ax.set_ylim(0, 297); self.ax.axis("off")
        self.pdf, self.title, self.n, self.N, self.scale_txt = pdf, title, sheet_no, sheets, scale_txt
    def frame_and_block(self):
        a = self.ax
        a.add_patch(Rectangle((0.5, 0.5), 419, 296, fill=False, lw=0.3 * MM, ec="#555"))
        a.add_patch(Rectangle((20, 10), 390, 277, fill=False, lw=0.7 * MM, ec="black"))
        # tabliczka rysunkowa wg ISO 7200 (uproszczona): prawy dolny róg 150 x 46
        x0, y0, w, h = 260, 10, 150, 46
        a.add_patch(Rectangle((x0, y0), w, h, fill=False, lw=0.5 * MM, ec="black"))
        def hl(y, xa=x0, xb=x0 + w): a.plot([xa, xb], [y, y], color="black", lw=0.25 * MM)
        def vl(x, ya, yb): a.plot([x, x], [ya, yb], color="black", lw=0.25 * MM)
        hl(y0 + 30); hl(y0 + 21); hl(y0 + 11)
        vl(x0 + 100, y0, y0 + 30); vl(x0 + 50, y0, y0 + 11); vl(x0 + 100, y0, y0 + 11)
        vl(x0 + 75, y0 + 11, y0 + 21); vl(x0 + 112, y0 + 11, y0 + 21)
        T = lambda x, y, s, fs=6, w="normal", ha="left": a.text(x, y, s, fontsize=fs, fontweight=w, ha=ha, va="center", family="DejaVu Sans")
        T(x0 + 3, y0 + 42, "Gabinet / pokój gościnny – stan istniejący", 10.5, "bold")
        T(x0 + 3, y0 + 36.5, "Existing-condition plan – study & guest room", 7)
        T(x0 + 3, y0 + 26, "Tytuł arkusza / sheet title:", 5, ha="left"); T(x0 + 3, y0 + 23, self.title, 7.5, "bold")
        T(x0 + 103, y0 + 26, "Jednostki: mm", 6.5); T(x0 + 103, y0 + 23, "Rzutowanie europejskie (metoda E)", 5.2)
        T(x0 + 3, y0 + 18, "Skala / scale", 5); T(x0 + 3, y0 + 14, self.scale_txt, 7.5, "bold")
        T(x0 + 78, y0 + 18, "Arkusz / sheet", 5); T(x0 + 78, y0 + 14, f"{self.n} / {self.N}", 7.5, "bold")
        T(x0 + 115, y0 + 18, "Data / date", 5); T(x0 + 115, y0 + 14, DATE, 7.5, "bold")
        T(x0 + 3, y0 + 8, "Źródło: pomiar właściciela, skan LiDAR (Polycam)", 5.2); T(x0 + 3, y0 + 4, "Opracowanie: Claude (AI) – bez grubości ścian", 5.2)
        T(x0 + 53, y0 + 8, "Nr rys. / no.", 5); T(x0 + 53, y0 + 4, f"GAB-0{self.n}", 7.5, "bold")
        T(x0 + 103, y0 + 8, "Format A3", 6.5); T(x0 + 103, y0 + 4, "Wersja 1.0", 6.5)
    def draw(self, v, ox, oy, sc, x_off=0):
        """ox, oy: położenie punktu (0,0) widoku na arkuszu [mm]; sc: mianownik skali."""
        a = self.ax
        P = lambda p: (ox + p[0] / sc, oy + p[1] / sc)
        for op in v.ops:
            k = op[0]
            if k == "line":
                (x1, y1), (x2, y2) = P(op[2]), P(op[3]); a.plot([x1, x2], [y1, y2], color=COL.get(op[1], "black"), lw=LW.get(op[1], 0.25) * MM, ls=DASH.get(op[1], "-"), solid_capstyle="butt")
            elif k == "poly":
                pts = [P(p) for p in op[2]]; xs, ys = zip(*pts)
                if op[3]: xs, ys = xs + (xs[0],), ys + (ys[0],)
                a.plot(xs, ys, color=COL.get(op[1], "black"), lw=LW.get(op[1], 0.25) * MM, ls=DASH.get(op[1], "-"), solid_capstyle="butt")
            elif k == "arc":
                c = P(op[2]); r = op[3] / sc
                a.add_patch(Arc(c, 2 * r, 2 * r, theta1=op[4], theta2=op[5], color=COL.get(op[1], "black"), lw=LW.get(op[1], 0.18) * MM, ls=DASH.get(op[1], "-")))
            elif k == "text":
                _, layer, p, s, h, ha, va, rot = op; x, y = P(p)
                a.text(x, y, s, fontsize=h / sc * MM * 1.0, color=COL.get(layer, "black"), ha={"l": "left", "c": "center", "r": "right"}[ha], va="center", rotation=rot, family="DejaVu Sans")
            elif k == "dim":
                _, p1, p2, base, orient = op
                col = COL["WYMIARY"]; lw = 0.18 * MM
                if orient == "h":
                    (x1, _), (x2, _) = P(p1), P(p2); yb = oy + base / sc
                    for (px, py) in (p1, p2):
                        X, Y = P((px, py)); sgn = 1 if base > py else -1
                        a.plot([X, X], [Y + sgn * 1.0, yb + sgn * 1.5], color=col, lw=lw)
                    a.plot([x1, x2], [yb, yb], color=col, lw=lw)
                    for X in (x1, x2): a.plot([X - 0.9, X + 0.9], [yb - 0.9, yb + 0.9], color=col, lw=0.35 * MM)
                    val = abs(p2[0] - p1[0]); mid = (x1 + x2) / 2
                    a.text(mid, yb + 1.9, f"{val:.0f}", fontsize=2.5 * MM, color=col, ha="center", va="center")
                else:
                    (_, y1), (_, y2) = P(p1), P(p2); xb = ox + base / sc
                    for (px, py) in (p1, p2):
                        X, Y = P((px, py)); sgn = 1 if base > px else -1
                        a.plot([X + sgn * 1.0, xb + sgn * 1.5], [Y, Y], color=col, lw=lw)
                    a.plot([xb, xb], [y1, y2], color=col, lw=lw)
                    for Y in (y1, y2): a.plot([xb - 0.9, xb + 0.9], [Y - 0.9, Y + 0.9], color=col, lw=0.35 * MM)
                    val = abs(p2[1] - p1[1]); mid = (y1 + y2) / 2
                    a.text(xb - 1.9, mid, f"{val:.0f}", fontsize=2.5 * MM, color=col, ha="center", va="center", rotation=90)
    def text_block(self, x, y, lines, fs=6.2, lh=4.0, w="normal"):
        for i, s in enumerate(lines): self.ax.text(x, y - i * lh, s, fontsize=fs, ha="left", va="center", fontweight=("bold" if (i == 0 and w == "title") else "normal"), family="DejaVu Sans")
    def save(self):
        self.frame_and_block(); self.pdf.savefig(self.fig); plt.close(self.fig)


def write_pdf(path, plan, elevs):
    with PdfPages(path) as pdf:
        pdf.infodict().update({"Title": "Gabinet – plan pokoju (stan istniejący)", "Author": "Claude (AI), dane: pomiar właściciela", "Subject": "Rzut i widoki ścian z gniazdkami, mm"})
        # --- arkusz 1: rzut 1:20
        pg = Page(pdf, "Rzut pomieszczenia", 1, 3, "1 : 20")
        pg.draw(plan, 61, 54, 20)
        pg.text_block(264, 280, ["UWAGI / NOTES"] + [n for n in NOTES], 5.6, 3.9, "title")
        y = 280 - (len(NOTES) + 2) * 3.9
        pg.text_block(264, y, ["TABELA GNIAZDEK (85×85 mm)", "id  element       ściana  a [mm]  od   z [mm]"] + [f'{o["id"]:<3} {o["kind"]:<12} {o["wall"]:^6} {o["a"]:^7} {o["ref"]:^5} {o["z"]:^6}' + ("  *" if o["note"] else "") for o in OUTLETS] + ["* wysokość przyjęta – do potwierdzenia", "a – od wskazanej ściany do najbliższej krawędzi", "z – dolna krawędź nad podłogą"], 5.6, 3.9, "title")
        y -= (len(OUTLETS) + 6) * 3.9
        # legenda
        lx, ly = 264, y - 2
        pg.ax.text(lx, ly, "LEGENDA / LEGEND", fontsize=5.6, fontweight="bold", va="center")
        items = [("black", "-", 0.5, "lico ściany (z pomiaru)"), ("#7a7a7a", (0, (6, 3)), 0.25, "wartość orientacyjna ze skanu"), ("#c0261f", "-", 0.35, "gniazdko / przełącznik"), ("#0b6b2a", "-", 0.18, "wymiar [mm]")]
        for i, (c, ls, lw, t) in enumerate(items):
            yy = ly - 5 - i * 4.2; pg.ax.plot([lx, lx + 14], [yy, yy], color=c, ls=ls, lw=lw * MM); pg.ax.text(lx + 17, yy, t, fontsize=5.6, va="center")
        pg.save()
        # --- arkusze 2 i 3: widoki ścian 1:25
        for n, (a, b) in enumerate([(elevs[0], elevs[1]), (elevs[2], elevs[3])]):
            pg = Page(pdf, "Widoki ścian od wnętrza – " + ("N, E" if n == 0 else "S, W"), n + 2, 3, "1 : 25")
            ox_a, ox_b = 52, 52 + a.w / 25 + 60
            pg.draw(a, ox_a, 95, 25); pg.draw(b, ox_b, 95, 25)
            pg.ax.text(ox_a, 95 + H / 25 + 17, a.title, fontsize=8, fontweight="bold", va="center")
            pg.ax.text(ox_b, 95 + H / 25 + 17, b.title, fontsize=8, fontweight="bold", va="center")
            pg.text_block(25, 52, ["Uwagi: wymiary w mm, widoki od wnętrza pokoju.", "Szare linie przerywane – wartości orientacyjne ze skanu (do weryfikacji).", "Gniazdka i przełączniki 85×85 mm; z – wysokość dolnej krawędzi nad podłogą."], 5.6, 4.0)
            pg.save()


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    plan = build_plan(); elevs = [build_elev(w) for w in "NESW"]
    write_dxf(os.path.join(OUT, "plan-pokoju.dxf"), plan, elevs)
    write_pdf(os.path.join(OUT, "plan-pokoju.pdf"), plan, elevs)
    print("OK:", os.listdir(OUT))
