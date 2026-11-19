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
