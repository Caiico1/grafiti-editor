"""Bocetos limpios de letras sueltas al estilo del abecedario a lapiz (wildstyle suave).

Cada letra se define como una o varias formas cerradas; se dibuja primero el
contorno de todas y luego el relleno blanco encima, asi la union queda limpia
y sin cruces interiores. Uso: python letras.py <carpeta_salida>
"""
import os, sys
import pymupdf

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))

import re

def T(path, k, ox, oy):
    """Pasa un trazado medido sobre el boceto original (pixeles ampliados) al lienzo."""
    return re.sub(r"(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)",
                  lambda m: f"{float(m.group(1))*k+ox:.1f},{float(m.group(2))*k+oy:.1f}", path)

# Coordenadas tomadas del boceto a lapiz ampliado 7x, luego escaladas al lienzo.
_U = dict(k=0.6, ox=0, oy=-50)
_X = dict(k=0.46, ox=-30, oy=-20)
_L = dict(k=0.62, ox=20, oy=10)
_E = dict(k=0.62, ox=-10, oy=20)
_A = dict(k=0.6, ox=0, oy=10)
_T = dict(k=0.5, ox=5, oy=0)

LETRAS = {
    "U": dict(
        formas=[T(
            "M100,190 Q200,150 320,130 "                        # remate superior
            "L300,262 C272,380 236,480 216,566 "                # borde interior brazo izq.
            "Q226,592 262,580 "                                 # fondo del hueco
            "C298,470 336,360 350,300 L320,270 "                # lado derecho del hueco
            "L442,198 "                                         # corte inclinado arriba dcha.
            "C446,300 432,380 426,430 L492,418 L428,522 "       # brazo dcho. y pua
            "C432,560 452,590 492,600 L562,612 "                # pie en punta
            "L332,732 L282,642 "                                # base en escalon
            "C220,682 140,712 80,692 C40,672 44,600 60,540 "    # curva inferior izquierda
            "C90,420 130,320 160,242 Q150,214 100,190 Z", **_U)],
        detalles=[T(p, **_U) for p in [
            "M150,262 C120,360 95,450 82,560",
            "M140,186 L280,150",
            "M410,232 L400,330",
        ]],
    ),
    "X": dict(
        formas=[
            T(  # trazo ancho: abajo-izquierda -> arriba-derecha, pie ensanchado y pua hacia arriba
                "M600,140 L650,120 L700,200 L746,334 L700,296 L640,285 "
                "C570,340 525,372 495,400 C440,460 320,610 230,772 "
                "L140,736 L118,622 L160,500 L272,434 L246,542 "
                "C330,432 470,282 600,140 Z", **_X),
            T(  # trazo con gancho: arriba-izquierda -> abajo-derecha, base ancha y pua
                "M155,252 L166,216 Q250,150 322,104 L346,110 "
                "C382,200 432,318 498,398 C540,452 580,520 622,578 "
                "L600,490 L642,502 C700,552 750,630 790,700 L606,792 "
                "C560,690 480,560 420,482 C362,400 300,322 212,236 Z", **_X),
        ],
        detalles=[T(p, **_X) for p in [
            "M180,232 L310,128",
            "M580,176 C540,220 500,262 470,296",
            "M150,712 L136,640",
            "M600,760 C680,730 740,710 780,700",
            "M640,140 L690,210",
        ]],
    ),
    "L": dict(
        formas=[T(
            "M50,165 L200,85 C232,170 252,290 255,400 C330,402 420,404 500,390 "
            "L452,452 C360,490 230,525 140,540 C100,540 88,510 98,470 "
            "C110,420 126,380 138,352 L100,334 L146,300 C152,260 148,220 130,190 Z", **_L)],
        detalles=[T(p, **_L) for p in [
            "M80,168 L185,110",
            "M218,150 C236,240 244,330 240,398",
            "M280,432 C340,430 410,426 470,418",
            "M124,480 C128,450 134,420 142,396",
        ]],
    ),
    "E": dict(
        formas=[T(
            "M70,220 L115,200 L185,98 L205,130 L350,82 L440,80 L335,238 L262,248 "
            "L282,280 L215,305 L218,330 L385,318 L332,355 L380,382 L222,425 "
            "C330,400 450,370 505,378 C548,392 552,450 520,470 "
            "C430,490 300,490 250,495 C210,500 190,540 160,540 "
            "C120,535 108,500 108,450 L105,350 L112,240 Z", **_E)],
        detalles=[T(p, **_E) for p in [
            "M150,250 L150,480",
            "M110,206 L330,104",
            "M260,452 C340,436 430,416 500,412",
        ]],
    ),
    "S": dict(
        formas=[
            "M300,28 L285,92 C220,100 150,118 140,150 C135,175 170,182 230,188 "
            "C300,195 345,215 342,240 L374,232 L344,266 "
            "C335,340 260,375 150,378 L40,368 L110,322 "
            "C190,325 262,312 270,282 C276,258 240,250 190,248 "
            "C110,245 66,225 68,206 L36,212 L70,180 "
            "C78,120 170,70 300,28 Z"],
        detalles=[
            "M98,168 C112,120 190,84 268,56",
            "M300,236 C316,270 300,318 250,342",
        ],
    ),
    "A": dict(
        formas=[T(
            "M30,565 C110,430 190,280 245,160 L192,120 L330,78 L352,38 L482,95 L425,125 "
            "C410,220 420,320 470,380 C505,450 522,520 520,578 L410,585 "
            "C390,520 360,460 330,425 L270,415 L300,500 L332,522 L215,540 "
            "C150,552 90,562 30,565 Z", **_A)],
        detalles=[T(p, **_A) for p in [
            "M80,520 C150,400 210,280 250,192",
            "M444,140 C434,230 444,320 484,392",
            "M300,60 L350,52",
        ]],
        agujeros=[T("M298,240 L328,335 L276,340 Z", **_A)],
    ),
    "T": dict(
        formas=[T(
            "M40,180 L330,205 L272,186 L400,130 L412,200 L690,120 "
            "C640,220 585,320 545,415 C500,370 450,330 422,300 L450,250 L370,258 "
            "C350,360 330,460 335,520 C345,555 380,560 420,565 "
            "C380,620 330,690 270,710 C220,720 190,690 185,640 "
            "C182,560 230,440 290,330 L250,262 C210,300 160,350 118,398 "
            "C98,320 70,240 40,180 Z", **_T)],
        detalles=[T(p, **_T) for p in [
            "M80,200 L300,218",
            "M440,212 L650,150",
            "M296,390 C282,460 270,560 280,640",
        ]],
    ),
}


# ---------------------------------------------------------------------------
# Resto del abecedario y numeros: dibujados en el mismo estilo con trazos
# afilados (el lapiz original es demasiado pequeno y solapado para calcarlos).
# Coordenadas: x 40-330, linea base y=370, altura de mayuscula y=50.
# ---------------------------------------------------------------------------
import math

INCLINA = 0.14          # inclinacion hacia la derecha, como el lapiz

def _P(x, y):
    return (x + (370 - y) * INCLINA, y)

def _catmull(pts):
    """Curva suave que pasa por los puntos (sin el M inicial)."""
    d = ""
    n = len(pts)
    for i in range(n - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < n else pts[i + 1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d

class _Letra:
    def __init__(self):
        self.f, self.b, self.h = [], [], []

    def _cinta(self, centro, normales, anchos, lado_brillo=None, tramo=(0.12, 0.55), brillo=True):
        izq = [(c[0] + n[0] * w / 2, c[1] + n[1] * w / 2) for c, n, w in zip(centro, normales, anchos)]
        der = [(c[0] - n[0] * w / 2, c[1] - n[1] * w / 2) for c, n, w in zip(centro, normales, anchos)]
        izq = [_P(*p) for p in izq]
        der = [_P(*p) for p in der][::-1]
        d = (f"M{izq[0][0]:.1f},{izq[0][1]:.1f}" + _catmull(izq)
             + f" L{der[0][0]:.1f},{der[0][1]:.1f}" + _catmull(der) + " Z")
        self.f.append(d)
        if not brillo:
            return self
        # brillo: linea paralela hacia el lado de arriba-izquierda
        n = len(centro)
        a = int(n * tramo[0])
        b = max(a + 2, int(n * tramo[1]))
        pts = []
        for c, nn, w in list(zip(centro, normales, anchos))[a:b]:
            sg = lado_brillo if lado_brillo is not None else (-1 if nn[0] + nn[1] > 0 else 1)
            pts.append(_P(c[0] + sg * nn[0] * w * 0.24, c[1] + sg * nn[1] * w * 0.24))
        if len(pts) >= 2:
            self.b.append(f"M{pts[0][0]:.1f},{pts[0][1]:.1f}" + _catmull(pts))
        return self

    def barra(self, a, b, w0, w1, curva=0, brillo=True):
        (x0, y0), (x1, y1) = a, b
        L = math.hypot(x1 - x0, y1 - y0) or 1
        nx, ny = -(y1 - y0) / L, (x1 - x0) / L
        cx, cy = (x0 + x1) / 2 + nx * curva, (y0 + y1) / 2 + ny * curva
        centro, normales, anchos = [], [], []
        N = 10
        for i in range(N + 1):
            t = i / N
            px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1
            py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1
            tx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx)
            ty = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy)
            l = math.hypot(tx, ty) or 1
            centro.append((px, py))
            normales.append((-ty / l, tx / l))
            anchos.append(w0 + (w1 - w0) * t)
        return self._cinta(centro, normales, anchos, brillo=brillo)

    def arco(self, cx, cy, rx, ry, a0, a1, w0, w1, bulto=0, brillo=True):
        centro, normales, anchos = [], [], []
        N = max(8, int(abs(a1 - a0) / 12))
        for i in range(N + 1):
            t = i / N
            a = math.radians(a0 + (a1 - a0) * t)
            px, py = cx + rx * math.cos(a), cy + ry * math.sin(a)
            nx, ny = math.cos(a) / rx, math.sin(a) / ry
            l = math.hypot(nx, ny)
            centro.append((px, py))
            normales.append((nx / l, ny / l))
            anchos.append(w0 + (w1 - w0) * t + bulto * math.sin(math.pi * t))
        return self._cinta(centro, normales, anchos, lado_brillo=1, tramo=(0.1, 0.45), brillo=brillo)

    def punta(self, a, b, tip):
        pts = [_P(*a), _P(*tip), _P(*b)]
        self.f.append("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z")
        return self

    def dict(self):
        return dict(formas=self.f, detalles=self.b, agujeros=self.h)

def _bandera(L, x, y):
    """Remate en bandera arriba a la izquierda de un trazo vertical."""
    return L.punta((x - 4, y + 8), (x + 30, y - 6), (x - 52, y - 14))

def _pie(L, x, y):
    """Pua del pie hacia la derecha."""
    return L.punta((x - 20, y - 4), (x + 10, y - 34), (x + 62, y + 12))

def _generar():
    G = {}
    L = _Letra(); L.barra((92, 62), (82, 368), 62, 74)
    L.arco(150, 138, 98, 76, -90, 92, 44, 40, 10); L.arco(160, 284, 118, 86, -90, 92, 48, 60, 14)
    _bandera(L, 70, 66); L.punta((240, 210), (235, 238), (300, 214)); _pie(L, 250, 352); G["B"] = L

    L = _Letra(); L.arco(198, 214, 138, 160, -38, -318, 34, 50, 42)
    L.punta((290, 100), (312, 128), (342, 60)); L.punta((286, 338), (312, 306), (352, 352)); G["C"] = L

    L = _Letra(); L.barra((88, 62), (80, 368), 60, 70)
    L.arco(122, 216, 188, 156, -92, 92, 40, 62, 26); _bandera(L, 66, 66); _pie(L, 150, 356); G["D"] = L

    L = _Letra(); L.barra((102, 92), (110, 368), 66, 52, curva=-14); L.barra((62, 88), (318, 58), 50, 38)
    L.punta((292, 46), (300, 80), (344, 30)); L.barra((112, 214), (258, 200), 44, 30)
    L.punta((244, 190), (246, 214), (292, 196)); L.punta((96, 340), (100, 372), (40, 384)); G["F"] = L

    L = _Letra(); L.arco(196, 214, 136, 160, -40, -312, 34, 46, 40)
    L.barra((196, 252), (318, 244), 40, 40); L.barra((300, 248), (300, 352), 48, 40)
    L.punta((290, 340), (312, 318), (350, 372)); L.punta((290, 98), (312, 126), (344, 58)); G["G"] = L

    L = _Letra(); L.barra((82, 62), (72, 368), 60, 68, curva=10); L.barra((262, 62), (272, 368), 60, 68, curva=-10)
    L.barra((92, 216), (262, 206), 40, 40, brillo=False); _bandera(L, 60, 66); _bandera(L, 240, 66); _pie(L, 290, 356); G["H"] = L

    L = _Letra(); L.barra((178, 84), (172, 352), 70, 60); L.barra((70, 82), (290, 62), 46, 40); L.barra((66, 360), (292, 348), 46, 50)
    L.punta((54, 66), (70, 100), (20, 104)); L.punta((276, 330), (296, 362), (346, 330)); G["I"] = L

    L = _Letra(); L.barra((80, 72), (316, 56), 44, 38); L.barra((236, 70), (232, 282), 66, 60)
    L.arco(150, 278, 82, 84, 0, 178, 60, 40, 8); L.punta((56, 270), (90, 278), (60, 214))
    L.punta((300, 44), (306, 76), (348, 30)); G["J"] = L

    L = _Letra(); L.barra((84, 62), (76, 368), 62, 70); L.barra((112, 234), (306, 60), 44, 56); L.barra((130, 196), (300, 368), 56, 64)
    _bandera(L, 64, 66); L.punta((290, 56), (318, 80), (336, 22)); _pie(L, 300, 360); G["K"] = L

    L = _Letra(); L.barra((64, 80), (54, 368), 54, 62, curva=10); L.barra((304, 80), (314, 368), 54, 62, curva=-10)
    L.barra((72, 84), (184, 262), 50, 40); L.barra((184, 262), (298, 84), 40, 50)
    _bandera(L, 44, 84); _pie(L, 330, 356); L.punta((40, 350), (60, 372), (10, 380)); G["M"] = L

    L = _Letra(); L.barra((74, 92), (64, 368), 54, 62); L.barra((82, 72), (282, 360), 58, 50); L.barra((288, 52), (294, 332), 50, 56)
    _bandera(L, 52, 92); L.punta((276, 48), (306, 46), (322, 4)); _pie(L, 296, 356); G["N"] = L

    L = _Letra(); L.barra((74, 112), (64, 368), 52, 60); L.barra((82, 96), (282, 360), 56, 48); L.barra((288, 80), (294, 332), 48, 54)
    _bandera(L, 52, 112); _pie(L, 296, 356)
    L.barra((96, 40), (180, 26), 18, 24, curva=-14, brillo=False); L.barra((180, 26), (270, 22), 24, 16, curva=14, brillo=False); G["Ñ"] = L

    L = _Letra(); L.arco(188, 212, 132, 158, -100, 262, 56, 56, 12)
    L.punta((96, 92), (128, 70), (70, 30)); L.punta((268, 340), (300, 316), (340, 372)); G["O"] = L

    L = _Letra(); L.barra((86, 62), (74, 368), 62, 70); L.arco(150, 148, 126, 92, -90, 92, 44, 44, 20)
    _bandera(L, 64, 66); L.punta((96, 340), (100, 372), (40, 384)); G["P"] = L

    L = _Letra(); L.arco(186, 204, 130, 150, -100, 262, 54, 54, 12)
    L.barra((214, 300), (338, 388), 40, 22); L.punta((322, 368), (334, 398), (380, 392)); L.punta((96, 88), (128, 66), (70, 28)); G["Q"] = L

    L = _Letra(); L.barra((86, 62), (74, 368), 62, 70); L.arco(148, 144, 124, 88, -90, 92, 44, 44, 18)
    L.barra((150, 226), (306, 366), 52, 62); _bandera(L, 64, 66); _pie(L, 304, 358); G["R"] = L

    L = _Letra(); L.barra((56, 62), (176, 368), 68, 40); L.barra((314, 52), (186, 368), 56, 40)
    _bandera(L, 36, 66); L.punta((300, 48), (330, 56), (348, 6)); G["V"] = L

    L = _Letra(); L.barra((44, 62), (112, 368), 56, 36); L.barra((112, 368), (178, 168), 36, 42); L.barra((178, 168), (244, 368), 42, 36)
    L.barra((244, 368), (322, 50), 36, 54); _bandera(L, 24, 66); L.punta((308, 46), (336, 54), (352, 6)); G["W"] = L

    L = _Letra(); L.barra((64, 62), (186, 232), 56, 50); L.barra((316, 52), (166, 368), 58, 48, curva=-10)
    _bandera(L, 44, 66); L.punta((302, 48), (330, 56), (348, 6)); L.punta((150, 350), (176, 370), (110, 396)); G["Y"] = L

    L = _Letra(); L.barra((60, 82), (322, 62), 50, 42); L.barra((302, 84), (84, 348), 56, 56); L.barra((58, 356), (320, 344), 50, 56)
    L.punta((46, 64), (62, 100), (10, 104)); L.punta((304, 326), (326, 360), (372, 318)); G["Z"] = L

    L = _Letra(); L.arco(188, 212, 112, 158, -100, 262, 52, 52, 10); L.punta((112, 84), (142, 64), (92, 22)); G["0"] = L

    L = _Letra(); L.barra((184, 78), (174, 352), 70, 62); L.barra((88, 150), (184, 72), 40, 52); L.barra((86, 362), (286, 350), 46, 50)
    L.punta((270, 332), (290, 364), (338, 334)); G["1"] = L

    L = _Letra(); L.arco(182, 146, 112, 92, -170, 42, 40, 56, 10); L.barra((272, 200), (84, 348), 56, 50); L.barra((64, 358), (322, 344), 48, 56)
    L.punta((76, 130), (100, 150), (40, 174)); L.punta((306, 326), (328, 360), (374, 318)); G["2"] = L

    L = _Letra(); L.arco(170, 136, 110, 82, -164, 92, 36, 46, 10); L.arco(170, 284, 130, 86, -92, 162, 46, 38, 14)
    L.punta((240, 210), (230, 236), (180, 222)); L.punta((60, 318), (82, 340), (30, 360)); G["3"] = L

    L = _Letra(); L.barra((232, 52), (70, 270), 50, 40); L.barra((58, 272), (322, 256), 44, 40); L.barra((236, 64), (244, 368), 62, 54)
    L.punta((300, 240), (310, 272), (356, 236)); _pie(L, 270, 360); G["4"] = L

    L = _Letra(); L.barra((112, 72), (314, 56), 46, 38); L.barra((112, 72), (100, 196), 50, 44); L.arco(170, 272, 132, 96, -152, 152, 44, 38, 22)
    L.punta((298, 44), (304, 78), (348, 30)); L.punta((56, 300), (80, 330), (30, 340)); G["5"] = L

    L = _Letra(); L.arco(200, 232, 136, 144, -56, -360, 38, 52, 10); L.arco(206, 284, 110, 90, 0, -184, 44, 40, 0, brillo=False)
    L.punta((262, 96), (290, 112), (316, 50)); G["6"] = L

    L = _Letra(); L.barra((60, 72), (322, 56), 50, 42); L.barra((304, 74), (148, 368), 58, 50)
    L.punta((46, 54), (62, 92), (10, 96)); L.punta((138, 350), (164, 370), (100, 398)); G["7"] = L

    L = _Letra(); L.arco(186, 132, 96, 80, -90, 272, 44, 44, 6); L.arco(186, 282, 122, 90, -90, 272, 52, 52, 8)
    L.punta((256, 76), (276, 100), (310, 46)); G["8"] = L

    L = _Letra(); L.arco(178, 142, 112, 94, -90, 272, 48, 48, 8); L.barra((282, 150), (232, 368), 56, 48, curva=12)
    L.punta((216, 350), (244, 370), (190, 400)); G["9"] = L
    return {k: v.dict() for k, v in G.items()}

for _k, _v in _generar().items():
    LETRAS.setdefault(_k, _v)

DX, DY, PASOS = 14, 10, 14   # direccion y profundidad del volumen

def svg(d):
    def capa(dx, dy, fill, stroke, w):
        return "".join(f'<path transform="translate({dx:.1f},{dy:.1f})" d="{p}" fill="{fill}" '
                       f'stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"/>' for p in d["formas"])
    pasos = [(DX * k / PASOS, DY * k / PASOS) for k in range(1, PASOS + 1)]
    vol = "".join(capa(x, y, "#000", "#000", 7) for x, y in pasos)          # contorno del bloque
    vol += "".join(capa(x, y, "#b8b8b8", "none", 0) for x, y in pasos)      # relleno gris
    contorno = capa(0, 0, "#000", "#111", 7)
    relleno = capa(0, 0, "#fff", "none", 0)
    det = "".join(f'<path d="{p}" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>' for p in d["detalles"])
    det += "".join(f'<path d="{p}" fill="#111"/>' for p in d.get("agujeros", []))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 0 380 420" width="380" height="420">'
            '<rect x="-10" y="0" width="380" height="420" fill="#fff"/>'
            f'{vol}{contorno}{relleno}{det}</svg>')

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    from PIL import Image
    ims = []
    for L, d in LETRAS.items():
        s = svg(d)
        open(os.path.join(OUT, f"{L}.svg"), "w", encoding="utf-8").write(s)
        doc = pymupdf.open(stream=s.encode(), filetype="svg")
        p = os.path.join(OUT, f"{L}.png")
        doc[0].get_pixmap(dpi=144).save(p)
        ims.append(Image.open(p))
    w, h = ims[0].size
    hoja = Image.new("RGB", (w * len(ims), h), "white")
    for i, im in enumerate(ims):
        hoja.paste(im, (i * w, 0))
    hoja.save(os.path.join(OUT, "hoja.png"))
    print("ok", list(LETRAS))
