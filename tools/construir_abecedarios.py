"""Genera abecedarios/<id>.js a partir de las fuentes de tools/fuentes.

Uso (desde la carpeta del proyecto):  python tools/construir_abecedarios.py
Cada abecedario es un archivo JS que se registra en window.ABECEDARIOS, asi el
editor funciona abriendo index.html directamente, sin servidor.
"""
import importlib.util, json, math, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTES = os.path.join(RAIZ, "tools", "fuentes")

PAR = re.compile(r"(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)")

def cargar(nombre):
    spec = importlib.util.spec_from_file_location(nombre, os.path.join(FUENTES, nombre + ".py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m

def inclinar(path, grados, dx):
    t = math.tan(math.radians(grados))
    return PAR.sub(lambda m: f"{float(m.group(1)) + t * float(m.group(2)) + dx:.1f},{float(m.group(2)):.1f}", path)

def redondear(path):
    return PAR.sub(lambda m: f"{float(m.group(1)):.1f},{float(m.group(2)):.1f}", path)

ABECEDARIOS = [
    dict(id="wildstyle", nombre="Wildstyle lápiz", modulo="wildstyle",
         descripcion="Letras afiladas calcadas de un abecedario a lápiz."),
    dict(id="bubble", nombre="Bubble", modulo="bubble",
         descripcion="Letras redondas con picos de llama, de la pieza del tren."),
    dict(id="dinamico", nombre="Wildstyle dinámico", modulo="dinamico",
         descripcion="Letras gruesas con remates afilados, extraídas de una imagen de referencia."),
    dict(id="calico", nombre="WildStyle Calico", modulo="calico",
         descripcion="Letras bubble anchas con remates en punta, extraídas de una imagen de referencia."),
]

def main():
    os.makedirs(os.path.join(RAIZ, "abecedarios"), exist_ok=True)
    for a in ABECEDARIOS:
        m = cargar(a["modulo"])
        inc = getattr(m, "INCLINACION", None)
        tr = (lambda p: inclinar(p, inc["skew_grados"], inc["dx"])) if inc else redondear
        letras = {}
        for ch, d in m.LETRAS.items():
            letras[ch] = dict(
                formas=[tr(p) for p in d["formas"]],
                brillos=[tr(p) for p in d.get("detalles", [])],
                huecos=[tr(p) for p in d.get("agujeros", [])],
            )
        datos = dict(id=a["id"], nombre=a["nombre"], descripcion=a["descripcion"], letras=letras)
        js = ("// Generado por tools/construir_abecedarios.py. No editar a mano.\n"
              "window.ABECEDARIOS = window.ABECEDARIOS || [];\n"
              f"window.ABECEDARIOS.push({json.dumps(datos, ensure_ascii=False, indent=1)});\n")
        ruta = os.path.join(RAIZ, "abecedarios", a["id"] + ".js")
        open(ruta, "w", encoding="utf-8").write(js)
        print(a["id"], sorted(letras))
    # Indice: el editor carga solo los abecedarios que aparecen aqui
    ids = [a["id"] for a in ABECEDARIOS]
    open(os.path.join(RAIZ, "abecedarios", "indice.js"), "w", encoding="utf-8").write(
        "// Generado por tools/construir_abecedarios.py. Lista de abecedarios a cargar.\n"
        f"window.ABECEDARIOS_INDICE = {json.dumps(ids)};\n")
    print("indice", ids)

if __name__ == "__main__":
    main()
