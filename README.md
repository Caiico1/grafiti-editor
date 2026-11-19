# Grafiti Editor (mockup)

Editor web para componer palabras con letras de grafiti de varios abecedarios,
superponerlas y darles estilo: relleno, contorno, doble contorno, volumen 3D,
brillos, sombra, nube de fondo con efecto spray, destellos, firma SETA y un
lápiz para pintar a mano (rotulador, spray, goteo y goma).

## Abrirlo

Doble clic en `index.html`. No necesita instalar nada.

Si el navegador bloquea algo al abrirlo como archivo, sírvelo en local:

```powershell
python -m http.server 8766 --directory .
```

y abre http://localhost:8766

## Uso rápido

- **Escribir**: teclea una palabra arriba. Usa el abecedario activo y, si falta
  una letra, la busca en los otros.
- **Letras**: elige el abecedario en el primer desplegable y la letra en el
  segundo (las que aún no existen salen como «pendiente»). Pulsa «Añadir letra»,
  haz clic en la vista previa o arrástrala al lienzo.
- **Lienzo**: arrastrar para mover; asa redonda para girar (Mayús = de 15 en 15);
  asa cuadrada o rueda para escalar; Alt+rueda para girar.
- **Teclado**: Supr borrar, Ctrl+D duplicar, `[` `]` detrás/delante, H espejo,
  flechas mover fino, Ctrl+Z / Ctrl+Y deshacer y rehacer.
- **Estilo**: «Toda la palabra» cambia todas las letras; «Selección» solo las
  seleccionadas (Mayús+clic para elegir varias).
- **Fondos**: Pared, Liso o Transparente, o una imagen JPEG/PNG propia
  («Subir imagen…»). «Vaciar fondo» la quita. Los estilos rápidos no tocan el fondo.
- **Lápiz** (B) y **Goma** (E): trazo rotulador, spray o goteo, con color,
  grosor y opacidad. La goma solo borra lo pintado con el lápiz.
  «Borrar dibujo» limpia toda esa capa. V vuelve a mover.
- **Maximizar** (⛶ o F): el lienzo ocupa toda la pantalla; Esc para salir.
- **Guardar / Abrir**: los diseños se guardan en este navegador.
- **Exportar**: PNG (3200×1800) o SVG vectorial.

## Estructura

```
index.html                  interfaz
css/estilos.css             estilos
js/cargador.js              carga los abecedarios del índice y luego el editor
js/editor.js                lógica del editor
abecedarios/indice.js       lista de abecedarios a cargar (generado)
abecedarios/<id>.js         un archivo por abecedario (generados)
firmas/<id>.js              firmas vectorizadas
tools/fuentes/<id>.py       trazados de cada abecedario (fuente)
tools/construir_abecedarios.py  genera abecedarios/*.js desde las fuentes
```

## Añadir letras o abecedarios

1. Edita o crea `tools/fuentes/<id>.py` con un diccionario `LETRAS`:
   cada letra tiene `formas` (siluetas cerradas, se unen entre sí),
   `detalles` (líneas de brillo) y opcionalmente `agujeros`.
2. Si es un abecedario nuevo, añádelo a la lista `ABECEDARIOS` de
   `tools/construir_abecedarios.py`.
3. Ejecuta `python tools/construir_abecedarios.py`. Regenera los abecedarios y
   el índice; el editor los muestra solo, sin tocar `index.html`.
4. Si es nuevo, añade su `<script src="abecedarios/<id>.js">` en `index.html`.

El editor mide y normaliza cada letra al cargar, así que letras de abecedarios
distintos salen a la misma altura y se pueden mezclar en una palabra.

## Abecedarios incluidos

- **Wildstyle 1** (`wildstyle`): A–Z, Ñ y 0–9
- **Wildstyle 2** (`dinamico`): A–Z, extraídas automáticamente de una imagen de referencia
- **Wildstyle 3** (`calico`): A–Z, extraídas automáticamente de una imagen de referencia
- **Wildstyle 4** (`bubble`): A, E, S, T
