"""Abecedario «Bubble»: letras redondas con picos de llama (de la pieza SETA del tren).

Solo datos. Todas las coordenadas son absolutas (M, L, Q, C, Z) para que el
constructor pueda aplicarles la inclinacion. INCLINACION se aplica al exportar.
"""
INCLINACION = dict(skew_grados=-8, dx=48)

def poly(pts, k=0.13):
    # lados ligeramente concavos (hacia el centro) para que los picos parezcan llamas
    cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
    d = f"M{pts[0][0]},{pts[0][1]}"
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        L = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
        vx, vy = cx - mx, cy - my; n = (vx * vx + vy * vy) ** 0.5 or 1
        d += f" Q{mx + vx / n * L * k:.1f},{my + vy / n * L * k:.1f} {x2},{y2}"
    return d + " Z"

K = 0.5523  # aproximacion de circulo con curvas de Bezier

def ell(cx, cy, rx, ry):
    a, b = K * rx, K * ry
    return (f"M{cx+rx},{cy} C{cx+rx},{cy+b} {cx+a},{cy+ry} {cx},{cy+ry} "
            f"C{cx-a},{cy+ry} {cx-rx},{cy+b} {cx-rx},{cy} "
            f"C{cx-rx},{cy-b} {cx-a},{cy-ry} {cx},{cy-ry} "
            f"C{cx+a},{cy-ry} {cx+rx},{cy-b} {cx+rx},{cy} Z")

def circ(cx, cy, r):
    return ell(cx, cy, r, r)

# Cada letra: formas (se unen) + detalles (líneas finas interiores) + agujeros
LETRAS = {
 "S": dict(
   formas=[
     poly([(30,215),(22,150),(64,140),(84,48),(116,124),(176,54),(188,122),(266,100),(226,170),(110,176),(110,200)]),  # brazo alto con picos
     poly([(22,150),(110,140),(110,250),(30,250)], k=0),       # columna izquierda
     poly([(30,215),(250,232),(254,292),(40,268)], k=0.04),       # tramo central
     circ(200,330,64), circ(100,356,46),                  # burbujas base
   ],
   detalles=[
     "M86,80 L98,128", "M176,86 L184,126 L236,116",
     "M64,170 L64,230", "M90,240 Q170,248 226,260",
     "M152,330 Q160,298 196,292", "M70,356 Q74,330 96,326",
   ],
   agujeros=[],
 ),
 "E": dict(
   formas=[
     poly([(58,330),(58,140),(28,112),(82,118),(102,26),(124,112),(130,330)]),
     poly([(118,112),(206,52),(192,108),(268,92),(226,166),(118,170)]),                # brazo alto
     poly([(118,196),(214,170),(196,214),(246,230),(118,256)]),                        # brazo medio
     circ(94,348,52), circ(190,348,56), ell(242,326,38,44),                            # base
   ],
   detalles=[
     "M100,58 L112,112", "M196,74 L186,114 L240,104", "M206,186 L194,214 L226,226",
     "M94,160 L94,290",
     "M60,350 Q62,320 90,312", "M160,340 Q168,310 196,304", "M226,312 Q236,296 256,300",
   ],
   agujeros=[poly([(132,172),(188,174),(132,192)], k=0)],
 ),
 "T": dict(
   formas=[
     poly([(22,178),(44,128),(14,84),(96,104),(150,22),(196,98),(286,74),(252,132),(282,178)]),  # barra con picos
     poly([(108,170),(192,170),(198,320),(102,320)]),                                            # asta
     circ(150,346,58), circ(98,362,32), circ(206,362,30),
   ],
   detalles=[
     "M150,52 L160,104", "M40,100 L96,118", "M262,96 L232,128",
     "M150,196 L150,296",
     "M112,346 Q118,312 148,306",
   ],
   agujeros=[],
 ),
 "A": dict(
   formas=[
     poly([(44,326),(62,196),(26,170),(100,148),(156,14),(198,132),(276,108),(232,196),(246,326)]),  # cuerpo
     circ(88,346,54), circ(206,346,54),
   ],
   detalles=[
     "M156,46 L168,132 L236,128",                  # corte del pico
     "M70,206 L104,170",
     "M92,236 L92,300", "M206,236 L206,300",
     "M52,350 Q56,316 86,308", "M170,350 Q174,316 204,308",
   ],
   agujeros=[poly([(132,206),(156,140),(178,212)])],
 ),
}

