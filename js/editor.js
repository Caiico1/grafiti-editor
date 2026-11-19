/* Grafiti Editor (mockup)
 * Lienzo SVG con letras de varios abecedarios. Cada letra se dibuja por capas:
 * volumen 3D, doble contorno, contorno, relleno, huecos y brillos. Detrás de
 * todas, una "nube" común con efecto spray. Encima, la capa del lápiz.
 */
(() => {
'use strict';

const NS = 'http://www.w3.org/2000/svg';
// mismo orden que abecedarios/indice.js (se cargan en paralelo y pueden llegar desordenados)
const ORDEN_ABC = window.ABECEDARIOS_INDICE || [];
const ABCS = (window.ABECEDARIOS || []).slice().sort((a, b) => ORDEN_ABC.indexOf(a.id) - ORDEN_ABC.indexOf(b.id));
const FIRMAS = window.FIRMAS || [];
const ALTURA_BASE = 320;          // alto normalizado de cualquier letra (unidades del lienzo a escala 1)
const CLAVE_ACTUAL = 'grafiti-mockup-actual';
const CLAVE_IMAGENES = 'grafiti-mockup-imagenes';
const CLAVE_DISENOS = 'grafiti-mockup-disenos';
const MAX_LADO_IMAGEN = 2000;

/* ---------- Estilos ---------- */
const ESTILO_BASE = {
  relleno: '#e8261c', degradado: false, relleno2: '#ff9a00',
  contorno: '#111111', grosor: 9, doble: false, colorHueco: '#ffffff', separacion: 7,
  volumen: true, colorVolumen: '#6d0b06', profundidad: 14, angulo: 50,
  brillos: true, colorBrillos: '#ffffff', grosorBrillos: 4,
  sombra: false, colorSombra: '#000000', distSombra: 14, difSombra: 6,
};
// Los estilos rápidos cambian letras y nube; nunca el fondo.
const PRESETS = [
  { nombre: 'Tren', muestra: '#e8261c', estilo: {}, nube: { activa: true, color: '#ffe600', tamano: 42, suavidad: 7, rugosidad: 10 } },
  { nombre: 'Bubble clásico', muestra: '#ff4fa3', estilo: { relleno: '#ff4fa3', degradado: true, relleno2: '#ffd1e8', doble: true, colorHueco: '#ffffff', colorVolumen: '#5b0f35', grosor: 8 }, nube: { activa: true, color: '#3df0ff', tamano: 34, suavidad: 6, rugosidad: 8 } },
  { nombre: 'Cromo', muestra: '#9aa3ad', estilo: { relleno: '#ffffff', degradado: true, relleno2: '#7d8794', contorno: '#0d0f12', colorVolumen: '#2a2f36', colorBrillos: '#ffffff' }, nube: { activa: true, color: '#1e6bff', tamano: 38, suavidad: 8, rugosidad: 12 } },
  { nombre: 'Fuego', muestra: '#ff6a00', estilo: { relleno: '#ffe14d', degradado: true, relleno2: '#ff3d00', contorno: '#2a0700', colorVolumen: '#5c1200', colorBrillos: '#fff7d6' }, nube: { activa: true, color: '#2a0700', tamano: 30, suavidad: 3, rugosidad: 18 } },
  { nombre: 'Neón', muestra: '#7b2bff', estilo: { relleno: '#ff2bd6', degradado: true, relleno2: '#7b2bff', contorno: '#ffffff', grosor: 6, colorVolumen: '#1b0638', colorBrillos: '#ffffff' }, nube: { activa: true, color: '#00e5ff', tamano: 26, suavidad: 14, rugosidad: 0 } },
  { nombre: 'Blanco y negro', muestra: '#888888', estilo: { relleno: '#ffffff', contorno: '#111111', grosor: 7, colorVolumen: '#b8b8b8', profundidad: 12, colorBrillos: '#333333', grosorBrillos: 3 }, nube: { activa: false } },
];

/* ---------- Estado ---------- */
let estado = nuevoEstado();
let seleccion = [];               // ids
let ambito = 'todo';
let abcActivo = ABCS[0] ? ABCS[0].id : null;
let herramienta = 'seleccionar';  // seleccionar | lapiz | goma
const lapiz = { estilo: 'rotulador', color: '#ffffff', grosor: 14, opacidad: 1, grosorGoma: 30 };
let contador = 1;
const historial = { pila: [], pos: -1 };
const medidas = {};               // "abc/L" -> {x,y,w,h,norm}; "firma/id" -> {...}
const imagenes = {};              // id -> dataURL de fondos subidos

function nuevoEstado() {
  return {
    elementos: [],
    dibujo: [],
    estilo: { ...ESTILO_BASE },
    nube: { activa: true, color: '#ffe600', tamano: 42, suavidad: 7, rugosidad: 10 },
    fondo: { tipo: 'pared', color: '#ffffff', imagen: null, ajuste: 'cubrir', oscurecer: 0 },
  };
}

/* ---------- Utilidades ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const lienzo = $('#lienzo');
const clave = (abc, ch) => `${abc}/${ch}`;
const idDef = (abc, ch, capa) => `${capa}-${abc}-${ch.charCodeAt(0)}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r1 = (n) => Math.round(n * 10) / 10;
function buscarLetra(abc, ch) {
  const a = ABCS.find((x) => x.id === abc);
  return a && a.letras[ch] ? a.letras[ch] : null;
}
function estiloDe(el) { return { ...estado.estilo, ...(el.estilo || {}) }; }
function aviso(texto) {
  const a = $('#aviso'); a.textContent = texto; a.hidden = false;
  clearTimeout(aviso.t); aviso.t = setTimeout(() => (a.hidden = true), 2600);
}
function guardarLocal(k, v) {
  try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
}

/* ---------- Definiciones reutilizables (letras y firmas) ---------- */
function prepararDefiniciones() {
  const defs = document.createElementNS(NS, 'defs');
  defs.id = 'defs-letras';
  const medir = document.createElementNS(NS, 'svg');
  medir.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden');
  document.body.appendChild(medir);
  for (const a of ABCS) {
    for (const [ch, d] of Object.entries(a.letras)) {
      const capas = { f: d.formas, h: d.huecos || [], b: d.brillos || [] };
      for (const [capa, paths] of Object.entries(capas)) {
        const g = document.createElementNS(NS, 'g');
        g.id = idDef(a.id, ch, capa);
        for (const p of paths) {
          const path = document.createElementNS(NS, 'path');
          path.setAttribute('d', p);
          // las letras con huecos (A, B, O…) los traen como subtrazos: evenodd los deja vacíos
          if (capa === 'f') path.setAttribute('fill-rule', 'evenodd');
          g.appendChild(path);
        }
        if (capa === 'f') {
          medir.appendChild(g);
          const bb = g.getBBox();
          medidas[clave(a.id, ch)] = { x: bb.x, y: bb.y, w: bb.width, h: bb.height, norm: ALTURA_BASE / bb.height };
        }
        defs.appendChild(g);
      }
    }
  }
  for (const f of FIRMAS) {
    const path = document.createElementNS(NS, 'path');
    path.id = `firma-${f.id}`;
    path.setAttribute('d', f.d);
    path.setAttribute('fill-rule', 'evenodd');
    medir.appendChild(path);
    const bb = path.getBBox();
    medidas[clave('firma', f.id)] = { x: bb.x, y: bb.y, w: bb.width, h: bb.height, norm: 1 };
    defs.appendChild(path);
  }
  medir.remove();
  return defs;
}

/* ---------- Geometría de cada elemento ---------- */
function caja(el) {
  if (el.tipo === 'letra') return medidas[clave(el.abc, el.ch)];
  if (el.tipo === 'firma') return medidas[clave('firma', el.firma)] || { x: 0, y: 0, w: 100, h: 50, norm: 1 };
  if (el.tipo === 'destello') return { x: -60, y: -40, w: 120, h: 80, norm: 1 };
  const ancho = Math.max(1, (el.texto || '').length) * 34;
  return { x: -ancho / 2, y: -40, w: ancho, h: 56, norm: 1 };
}
function escalaTotal(el) { return el.escala * caja(el).norm; }
function transformar(el) {
  const c = caja(el), s = escalaTotal(el);
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  return `translate(${r1(el.x)} ${r1(el.y)}) rotate(${r1(el.rot)}) scale(${(el.espejo ? -s : s).toFixed(4)} ${s.toFixed(4)}) translate(${r1(-cx)} ${r1(-cy)})`;
}
// Desplazamiento de pantalla (dx,dy) expresado en coordenadas locales de la letra
function aLocal(el, dx, dy) {
  const a = (-el.rot * Math.PI) / 180, s = escalaTotal(el);
  let x = (dx * Math.cos(a) - dy * Math.sin(a)) / s;
  const y = (dx * Math.sin(a) + dy * Math.cos(a)) / s;
  if (el.espejo) x = -x;
  return [x, y];
}

/* ---------- Fondos ---------- */
function fondoSVG() {
  const f = estado.fondo;
  if (f.tipo === 'imagen' && f.imagen && imagenes[f.imagen]) {
    const par = f.ajuste === 'ajustar' ? 'xMidYMid meet' : 'xMidYMid slice';
    const base = f.ajuste === 'ajustar' ? `<rect width="1600" height="900" fill="#111"/>` : '';
    const osc = f.oscurecer > 0 ? `<rect width="1600" height="900" fill="#000" opacity="${f.oscurecer / 100}"/>` : '';
    return `${base}<image href="${imagenes[f.imagen]}" x="0" y="0" width="1600" height="900" preserveAspectRatio="${par}"/>${osc}`;
  }
  if (f.tipo === 'transparente') return '';
  if (f.tipo === 'liso') return `<rect width="1600" height="900" fill="${f.color}"/>`;
  return `<defs><pattern id="ladrillo" width="120" height="60" patternUnits="userSpaceOnUse">
      <rect width="120" height="60" fill="#5a2c22"/>
      <rect x="2" y="2" width="116" height="26" rx="2" fill="#8a4334"/>
      <rect x="-58" y="32" width="116" height="26" rx="2" fill="#7d3b2e"/>
      <rect x="62" y="32" width="116" height="26" rx="2" fill="#94493a"/>
    </pattern><radialGradient id="vineta" cx="50%" cy="45%" r="75%">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#ladrillo)"/><rect width="1600" height="900" fill="url(#vineta)"/>`;
}

/* ---------- Dibujo de elementos ---------- */
function usar(id, attrs) {
  let a = '';
  for (const [k, v] of Object.entries(attrs)) a += ` ${k}="${v}"`;
  return `<use href="#${id}"${a}/>`;
}

function dibujarLetra(el, defs) {
  const e = estiloDe(el);
  const k = el.abc, ch = el.ch;
  const F = idDef(k, ch, 'f'), H = idDef(k, ch, 'h'), B = idDef(k, ch, 'b');
  const norm = caja(el).norm;
  const w = e.grosor / norm;                     // grosor en unidades locales
  let capas = '';

  // Volumen 3D: copias desplazadas hacia la dirección elegida
  if (e.volumen && e.profundidad > 0) {
    const a = (e.angulo * Math.PI) / 180;
    const [ox, oy] = aLocal(el, Math.cos(a) * e.profundidad, Math.sin(a) * e.profundidad);
    const n = Math.max(2, Math.round(e.profundidad / 1.5));
    let borde = '', cuerpo = '';
    for (let i = 1; i <= n; i++) {
      const t = `translate(${r1((ox * i) / n)} ${r1((oy * i) / n)})`;
      borde += usar(F, { transform: t, fill: e.contorno, stroke: e.contorno, 'stroke-width': r1(w * 2), 'stroke-linejoin': 'round' });
      cuerpo += usar(F, { transform: t, fill: e.colorVolumen });
    }
    capas += borde + cuerpo;
  }
  // Doble contorno (contorno exterior + hueco claro)
  if (e.doble) {
    const sep = e.separacion / norm;
    capas += usar(F, { fill: e.contorno, stroke: e.contorno, 'stroke-width': r1(w * 4 + sep * 2), 'stroke-linejoin': 'round' });
    capas += usar(F, { fill: e.colorHueco, stroke: e.colorHueco, 'stroke-width': r1(w * 2 + sep * 2), 'stroke-linejoin': 'round' });
  }
  // Contorno y relleno
  let relleno = e.relleno;
  if (e.degradado) {
    const gid = `gr-${el.id}`;
    defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${e.relleno}"/><stop offset="1" stop-color="${e.relleno2}"/></linearGradient>`);
    relleno = `url(#${gid})`;
  }
  if (w > 0) capas += usar(F, { fill: e.contorno, stroke: e.contorno, 'stroke-width': r1(w * 2), 'stroke-linejoin': 'round' });
  capas += usar(F, { fill: relleno });
  capas += usar(H, { fill: e.contorno });
  if (e.brillos) {
    capas += usar(B, { fill: 'none', stroke: e.colorBrillos, 'stroke-width': r1(e.grosorBrillos / norm), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  }

  let filtro = '';
  if (e.sombra) {
    const fid = `sb-${el.id}`;
    defs.push(`<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="${e.distSombra * 0.7}" dy="${e.distSombra}" stdDeviation="${e.difSombra}" flood-color="${e.colorSombra}" flood-opacity=".75"/></filter>`);
    filtro = ` filter="url(#${fid})"`;
  }
  return `<g data-id="${el.id}" class="elem"${filtro}><g transform="${transformar(el)}">${capas}</g></g>`;
}

function dibujarDestello(el) {
  // destello de 4 puntas con brazo horizontal más largo, como en la foto del tren
  return `<g data-id="${el.id}" class="elem"><g transform="${transformar(el)}">
    <circle r="16" fill="url(#halo-destello)"/>
    <path d="M0,-36 Q4,-4 60,0 Q4,4 0,36 Q-4,4 -60,0 Q-4,-4 0,-36 Z" fill="${el.color}"/>
    <circle r="5" fill="${el.color}"/></g></g>`;
}
function dibujarFirma(el) {
  const s = escalaTotal(el);
  return `<g data-id="${el.id}" class="elem"><g transform="${transformar(el)}">
    ${usar(`firma-${el.firma}`, { fill: el.color, stroke: '#000', 'stroke-width': r1(2.5 / s), 'paint-order': 'stroke', 'stroke-linejoin': 'round' })}</g></g>`;
}
function dibujarTexto(el) {
  return `<g data-id="${el.id}" class="elem"><g transform="${transformar(el)}">
    <text x="0" y="0" text-anchor="middle" font-family="'Permanent Marker', cursive" font-size="56"
      fill="${el.color}" stroke="#000" stroke-width="1.5" paint-order="stroke">${esc(el.texto)}</text></g></g>`;
}

function dibujarNube(defs) {
  const n = estado.nube;
  const letras = estado.elementos.filter((e) => e.tipo === 'letra');
  if (!n.activa || !letras.length) return '';
  defs.push(`<filter id="f-nube" x="-20%" y="-30%" width="140%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="ruido"/>
    <feDisplacementMap in="SourceGraphic" in2="ruido" scale="${n.rugosidad * 2.5}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${n.suavidad}"/></filter>`);
  let g = '';
  for (const el of letras) {
    const w = (n.tamano * 2) / escalaTotal(el);
    g += `<g transform="${transformar(el)}">${usar(idDef(el.abc, el.ch, 'f'), { fill: n.color, stroke: n.color, 'stroke-width': r1(w), 'stroke-linejoin': 'round' })}</g>`;
  }
  return `<g filter="url(#f-nube)" pointer-events="none">${g}</g>`;
}

/* ---------- Lápiz: trazos ---------- */
function rutaSuave(puntos) {
  if (!puntos.length) return '';
  const [x0, y0] = puntos[0];
  if (puntos.length < 3) {
    const [x1, y1] = puntos[puntos.length - 1];
    return `M${r1(x0)},${r1(y0)} L${r1(x1 + 0.1)},${r1(y1)}`;
  }
  let d = `M${r1(x0)},${r1(y0)}`;
  for (let i = 1; i < puntos.length - 1; i++) {
    const [x, y] = puntos[i], [nx, ny] = puntos[i + 1];
    d += ` Q${r1(x)},${r1(y)} ${r1((x + nx) / 2)},${r1((y + ny) / 2)}`;
  }
  const [xl, yl] = puntos[puntos.length - 1];
  return d + ` L${r1(xl)},${r1(yl)}`;
}
function dibujarTrazo(t, i, defs) {
  const d = rutaSuave(t.puntos);
  const base = `fill="none" stroke="${t.color}" stroke-linecap="round" stroke-linejoin="round"`;
  if (t.estilo === 'spray') {
    const fid = `fs-${i}`;
    defs.push(`<filter id="${fid}" filterUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900">
      <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="2" seed="${i + 3}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${r1(t.grosor * 0.7)}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="${r1(Math.max(0.6, t.grosor * 0.16))}"/></filter>`);
    return `<g opacity="${t.opacidad}" filter="url(#${fid})">
      <path d="${d}" ${base} stroke-width="${r1(t.grosor * 1.9)}" stroke-opacity=".28"/>
      <path d="${d}" ${base} stroke-width="${t.grosor}"/></g>`;
  }
  let gotas = '';
  for (const g of t.goteos || []) {
    gotas += `<path d="M${r1(g.x)},${r1(g.y)} L${r1(g.x)},${r1(g.y + g.largo)}" ${base} stroke-width="${r1(g.ancho)}"/>
      <ellipse cx="${r1(g.x)}" cy="${r1(g.y + g.largo)}" rx="${r1(g.ancho * 0.75)}" ry="${r1(g.ancho * 0.95)}" fill="${t.color}"/>`;
  }
  return `<g opacity="${t.opacidad}"><path d="${d}" ${base} stroke-width="${t.grosor}"/>${gotas}</g>`;
}
// La goma enmascara solo los trazos anteriores a ella
function dibujarCapaDibujo(defs) {
  let acumulado = '';
  estado.dibujo.forEach((t, i) => {
    if (t.tipo === 'goma') {
      const mid = `mg-${i}`;
      defs.push(`<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900">
        <rect width="1600" height="900" fill="#fff"/>
        <path d="${rutaSuave(t.puntos)}" fill="none" stroke="#000" stroke-width="${t.grosor}" stroke-linecap="round" stroke-linejoin="round"/></mask>`);
      acumulado = `<g mask="url(#${mid})">${acumulado}</g>`;
    } else {
      acumulado += dibujarTrazo(t, i, defs);
    }
  });
  return `<g id="capa-dibujo" pointer-events="none">${acumulado}</g>`;
}
function generarGoteos(t) {
  // Chorretones colgando del trazo, deterministas una vez creados
  const gotas = [];
  let dist = 0, siguiente = t.grosor * (2 + Math.random() * 4);
  for (let i = 1; i < t.puntos.length; i++) {
    const [x0, y0] = t.puntos[i - 1], [x1, y1] = t.puntos[i];
    dist += Math.hypot(x1 - x0, y1 - y0);
    if (dist >= siguiente) {
      dist = 0; siguiente = t.grosor * (2.5 + Math.random() * 6);
      if (Math.random() < 0.7) {
        gotas.push({ x: x1 + (Math.random() - 0.5) * t.grosor * 0.4, y: y1,
          largo: t.grosor * (1.2 + Math.random() * Math.random() * 7), ancho: t.grosor * (0.28 + Math.random() * 0.22) });
      }
    }
  }
  return gotas;
}

function dibujarSeleccion() {
  if (herramienta !== 'seleccionar') return '<g id="capa-seleccion"></g>';
  let g = '';
  for (const id of seleccion) {
    const el = estado.elementos.find((e) => e.id === id);
    if (!el) continue;
    const c = caja(el), s = escalaTotal(el);
    const p = 10 / s, rr = 9 / s;
    g += `<g transform="${transformar(el)}">
      <rect x="${r1(c.x - p)}" y="${r1(c.y - p)}" width="${r1(c.w + 2 * p)}" height="${r1(c.h + 2 * p)}" fill="none"
        stroke="#00b3ff" stroke-width="2" stroke-dasharray="7 5" vector-effect="non-scaling-stroke"/>
      ${seleccion.length === 1 ? `
      <line x1="${r1(c.x + c.w / 2)}" y1="${r1(c.y - p)}" x2="${r1(c.x + c.w / 2)}" y2="${r1(c.y - p - 40 / s)}" stroke="#00b3ff" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <circle data-asa="girar" cx="${r1(c.x + c.w / 2)}" cy="${r1(c.y - p - 40 / s)}" r="${r1(rr)}" fill="#fff" stroke="#00b3ff" stroke-width="2" vector-effect="non-scaling-stroke" style="cursor:grab"/>
      <rect data-asa="escalar" x="${r1(c.x + c.w + p - rr)}" y="${r1(c.y + c.h + p - rr)}" width="${r1(rr * 2)}" height="${r1(rr * 2)}" fill="#00b3ff" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke" style="cursor:nwse-resize"/>` : ''}
    </g>`;
  }
  return `<g id="capa-seleccion">${g}</g>`;
}

let defsLetras = null;
function render() {
  const defs = [];
  const nube = dibujarNube(defs);
  let cuerpo = '';
  for (const el of estado.elementos) {
    if (el.tipo === 'letra') cuerpo += dibujarLetra(el, defs);
    else if (el.tipo === 'destello') cuerpo += dibujarDestello(el);
    else if (el.tipo === 'firma') cuerpo += dibujarFirma(el);
    else cuerpo += dibujarTexto(el);
  }
  const dibujo = dibujarCapaDibujo(defs);
  lienzo.innerHTML = `<g id="capa-fondo">${fondoSVG()}</g>
    <defs>${defs.join('')}<radialGradient id="halo-destello"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    ${nube}<g id="capa-elementos">${cuerpo}</g>${dibujo}${dibujarSeleccion()}`;
  lienzo.insertBefore(defsLetras, lienzo.firstChild);
  actualizarBotones();
}

/* ---------- Historial ---------- */
function confirmar() {
  const foto = JSON.stringify(estado);
  if (historial.pila[historial.pos] === foto) return;
  historial.pila = historial.pila.slice(0, historial.pos + 1);
  historial.pila.push(foto);
  if (historial.pila.length > 100) historial.pila.shift();
  historial.pos = historial.pila.length - 1;
  guardarLocal(CLAVE_ACTUAL, foto);
  actualizarBotones();
}
function irA(pos) {
  if (pos < 0 || pos >= historial.pila.length) return;
  historial.pos = pos;
  estado = JSON.parse(historial.pila[pos]);
  seleccion = seleccion.filter((id) => estado.elementos.some((e) => e.id === id));
  render(); refrescarPanel();
}
function actualizarBotones() {
  $('#btn-deshacer').disabled = historial.pos <= 0;
  $('#btn-rehacer').disabled = historial.pos >= historial.pila.length - 1;
}

/* ---------- Crear elementos ---------- */
function nuevoId() {
  let id;
  do { id = 'e' + contador++; } while (estado.elementos.some((e) => e.id === id));
  return id;
}
function anchoEnLienzo(abc, ch, escala) {
  const m = medidas[clave(abc, ch)];
  return m.w * m.norm * escala;
}
function anadirLetra(abc, ch, x, y) {
  const escala = 0.85;
  if (x === undefined) {
    // a la derecha de la última letra, solapando un poco
    const letras = estado.elementos.filter((e) => e.tipo === 'letra');
    const ult = letras[letras.length - 1];
    if (ult) {
      x = ult.x + (anchoEnLienzo(ult.abc, ult.ch, ult.escala) + anchoEnLienzo(abc, ch, escala)) / 2 * 0.9;
      y = ult.y;
    } else { x = 800; y = 450; }
  }
  const el = { id: nuevoId(), tipo: 'letra', abc, ch, x, y, rot: 0, escala, espejo: false, estilo: {} };
  estado.elementos.push(el);
  elegirHerramienta('seleccionar');
  seleccion = [el.id];
  render(); refrescarPanel(); confirmar();
}
function escribirPalabra(texto) {
  const chars = [...texto.toUpperCase()].filter((c) => c.trim());
  if (!chars.length) return;
  const faltan = [];
  const piezas = [];
  for (let ch of chars) {
    // sin versión acentuada: se usa la letra base (Á→A, Ü→U); la Ñ se respeta
    if (!ABCS.some((a) => a.letras[ch]) && ch !== 'Ñ') ch = ch.normalize('NFD')[0];
    const abc = buscarLetra(abcActivo, ch) ? abcActivo : (ABCS.find((a) => a.letras[ch]) || {}).id;
    if (!abc) { faltan.push(ch); continue; }
    piezas.push({ abc, ch, w: anchoEnLienzo(abc, ch, 0.85) });
  }
  if (!piezas.length) { aviso(`Todavía no hay letras para «${texto}».`); return; }
  const solape = 0.9;
  let total = piezas.reduce((s, p) => s + p.w * solape, 0) + piezas[piezas.length - 1].w * (1 - solape);
  let escala = 0.85;
  if (total > 1450) { escala *= 1450 / total; total = 1450; }
  let x = 800 - total / 2;
  estado.elementos = estado.elementos.filter((e) => e.tipo !== 'letra');
  for (const p of piezas) {
    const w = p.w * escala / 0.85;
    estado.elementos.push({ id: nuevoId(), tipo: 'letra', abc: p.abc, ch: p.ch, x: x + w / 2, y: 450, rot: 0, escala, espejo: false, estilo: {} });
    x += w * solape;
  }
  seleccion = [];
  render(); refrescarPanel(); confirmar();
  if (faltan.length) aviso(`Faltan en los abecedarios: ${[...new Set(faltan)].join(', ')}`);
}
function anadirDestello() {
  const el = { id: nuevoId(), tipo: 'destello', x: 800 + (Math.random() - 0.5) * 600, y: 300 + Math.random() * 200, rot: 0, escala: 1, espejo: false, color: '#ffffff' };
  estado.elementos.push(el); elegirHerramienta('seleccionar'); seleccion = [el.id];
  render(); refrescarPanel(); confirmar();
}
function anadirFirma() {
  if (!FIRMAS.length) { aviso('No hay firmas cargadas'); return; }
  const el = { id: nuevoId(), tipo: 'firma', firma: FIRMAS[0].id, x: 1300, y: 690, rot: -4, escala: 0.55, espejo: false, color: '#ffffff' };
  estado.elementos.push(el); elegirHerramienta('seleccionar'); seleccion = [el.id];
  render(); refrescarPanel(); confirmar();
}

/* ---------- Herramientas ---------- */
function elegirHerramienta(h) {
  herramienta = h;
  document.body.classList.toggle('h-lapiz', h === 'lapiz');
  document.body.classList.toggle('h-goma', h === 'goma');
  $$('.herr').forEach((b) => b.classList.toggle('activa', b.dataset.herr === h));
  const goma = h === 'goma';
  $('#ctl-estilo-lapiz').hidden = goma;
  $('#ctl-color-lapiz').hidden = goma;
  $('#ctl-opacidad-lapiz').hidden = goma;
  refrescarLapiz();
}
function refrescarLapiz() {
  $$('[data-lapiz]').forEach((inp) => {
    const k = inp.dataset.lapiz;
    inp.value = k === 'grosor' && herramienta === 'goma' ? lapiz.grosorGoma : lapiz[k];
  });
}
function conectarLapiz() {
  $$('.herr').forEach((b) => (b.onclick = () => { elegirHerramienta(b.dataset.herr); render(); }));
  $$('[data-lapiz]').forEach((inp) => inp.addEventListener('input', () => {
    const k = inp.dataset.lapiz;
    const v = inp.type === 'range' ? parseFloat(inp.value) : inp.value;
    if (k === 'grosor' && herramienta === 'goma') lapiz.grosorGoma = v; else lapiz[k] = v;
    refrescarLapiz();
  }));
  $('#btn-borrar-dibujo').onclick = () => {
    if (!estado.dibujo.length) { aviso('No hay nada pintado con el lápiz'); return; }
    estado.dibujo = []; render(); confirmar();
  };
}

/* ---------- Interacción con el ratón ---------- */
let gesto = null;
function puntoSVG(ev) {
  const p = lienzo.createSVGPoint();
  p.x = ev.clientX; p.y = ev.clientY;
  return p.matrixTransform(lienzo.getScreenCTM().inverse());
}
lienzo.addEventListener('pointerdown', (ev) => {
  if (ev.button !== 0) return;
  const p = puntoSVG(ev);
  lienzo.setPointerCapture(ev.pointerId);
  if (herramienta !== 'seleccionar') {
    const goma = herramienta === 'goma';
    const t = goma
      ? { tipo: 'goma', grosor: lapiz.grosorGoma, puntos: [[p.x, p.y]] }
      : { tipo: 'trazo', estilo: lapiz.estilo, color: lapiz.color, grosor: lapiz.grosor, opacidad: lapiz.opacidad, puntos: [[p.x, p.y]] };
    const vivo = document.createElementNS(NS, 'path');
    vivo.setAttribute('fill', 'none');
    vivo.setAttribute('stroke-linecap', 'round');
    vivo.setAttribute('stroke-linejoin', 'round');
    vivo.setAttribute('stroke', goma ? '#ff4d4d' : t.color);
    vivo.setAttribute('stroke-opacity', goma ? 0.45 : t.opacidad);
    vivo.setAttribute('stroke-width', t.grosor);
    vivo.setAttribute('pointer-events', 'none');
    lienzo.appendChild(vivo);
    gesto = { tipo: 'pintar', trazo: t, vivo };
    vivo.setAttribute('d', rutaSuave(t.puntos));
    return;
  }
  const asa = ev.target.closest('[data-asa]');
  if (asa && seleccion.length === 1) {
    const el = estado.elementos.find((e) => e.id === seleccion[0]);
    gesto = { tipo: asa.dataset.asa, el, p0: p, rot0: el.rot, esc0: el.escala,
      ang0: Math.atan2(p.y - el.y, p.x - el.x), dist0: Math.hypot(p.x - el.x, p.y - el.y) };
  } else {
    const g = ev.target.closest('[data-id]');
    if (g) {
      const id = g.dataset.id;
      if (ev.shiftKey) seleccion = seleccion.includes(id) ? seleccion.filter((s) => s !== id) : [...seleccion, id];
      else if (!seleccion.includes(id)) seleccion = [id];
      gesto = { tipo: 'mover', p0: p, orig: seleccion.map((sid) => {
        const e = estado.elementos.find((x) => x.id === sid); return { e, x: e.x, y: e.y };
      }) };
    } else {
      seleccion = [];
    }
    render(); refrescarPanel();
  }
});
lienzo.addEventListener('pointermove', (ev) => {
  if (!gesto) return;
  const p = puntoSVG(ev);
  if (gesto.tipo === 'pintar') {
    const pts = gesto.trazo.puntos, [lx, ly] = pts[pts.length - 1];
    if (Math.hypot(p.x - lx, p.y - ly) < 2) return;
    pts.push([p.x, p.y]);
    gesto.vivo.setAttribute('d', rutaSuave(pts));
    return;
  }
  if (gesto.tipo === 'mover') {
    for (const o of gesto.orig) { o.e.x = o.x + p.x - gesto.p0.x; o.e.y = o.y + p.y - gesto.p0.y; }
  } else if (gesto.tipo === 'girar') {
    const el = gesto.el;
    let rot = gesto.rot0 + ((Math.atan2(p.y - el.y, p.x - el.x) - gesto.ang0) * 180) / Math.PI;
    if (ev.shiftKey) rot = Math.round(rot / 15) * 15;
    el.rot = rot;
  } else if (gesto.tipo === 'escalar') {
    const el = gesto.el;
    el.escala = Math.max(0.15, Math.min(4, gesto.esc0 * Math.hypot(p.x - el.x, p.y - el.y) / gesto.dist0));
  }
  gesto.movido = true;
  render();
});
function terminarGesto() {
  if (gesto && gesto.tipo === 'pintar') {
    const t = gesto.trazo;
    t.puntos = t.puntos.map(([x, y]) => [r1(x), r1(y)]);
    if (t.tipo === 'trazo' && t.estilo === 'goteo') t.goteos = generarGoteos(t);
    estado.dibujo.push(t);
    gesto.vivo.remove();
    gesto = null;
    render(); confirmar();
    return;
  }
  if (gesto && gesto.movido) confirmar();
  gesto = null;
}
lienzo.addEventListener('pointerup', terminarGesto);
lienzo.addEventListener('pointercancel', terminarGesto);
lienzo.addEventListener('wheel', (ev) => {
  if (!seleccion.length || herramienta !== 'seleccionar') return;
  ev.preventDefault();
  for (const el of seleccionados()) {
    if (ev.altKey) el.rot += ev.deltaY > 0 ? 3 : -3;
    else el.escala = Math.max(0.15, Math.min(4, el.escala * (ev.deltaY > 0 ? 0.95 : 1.05)));
  }
  render();
  clearTimeout(lienzo._t); lienzo._t = setTimeout(confirmar, 300);
}, { passive: false });

// Soltar letras arrastradas desde la paleta
lienzo.addEventListener('dragover', (ev) => ev.preventDefault());
lienzo.addEventListener('drop', (ev) => {
  ev.preventDefault();
  const dato = ev.dataTransfer.getData('text/plain');
  if (!dato.includes('/')) return;
  const [abc, ch] = dato.split('/');
  const p = puntoSVG(ev);
  anadirLetra(abc, ch, p.x, p.y);
});

function seleccionados() { return estado.elementos.filter((e) => seleccion.includes(e.id)); }

/* ---------- Teclado ---------- */
document.addEventListener('keydown', (ev) => {
  if (ev.target.matches && ev.target.matches('input, select, textarea')) return;
  const ctrl = ev.ctrlKey || ev.metaKey;
  const tecla = ev.key.toLowerCase();
  if (ctrl && tecla === 'z') { ev.preventDefault(); ev.shiftKey ? irA(historial.pos + 1) : irA(historial.pos - 1); return; }
  if (ctrl && tecla === 'y') { ev.preventDefault(); irA(historial.pos + 1); return; }
  if (!ctrl && !ev.altKey) {
    if (tecla === 'v') { elegirHerramienta('seleccionar'); render(); return; }
    if (tecla === 'b') { elegirHerramienta('lapiz'); render(); return; }
    if (tecla === 'e') { elegirHerramienta('goma'); render(); return; }
    if (tecla === 'f') { alternarMaximizado(); return; }
  }
  if (ev.key === 'Escape') {
    if (document.body.classList.contains('max')) { alternarMaximizado(false); return; }
    seleccion = []; render(); refrescarPanel(); return;
  }
  if (!seleccion.length || herramienta !== 'seleccionar') return;
  const sel = seleccionados();
  let cambio = true;
  if (ev.key === 'Delete' || ev.key === 'Backspace') {
    estado.elementos = estado.elementos.filter((e) => !seleccion.includes(e.id)); seleccion = [];
  } else if (ctrl && tecla === 'd') {
    ev.preventDefault();
    const copias = sel.map((e) => ({ ...JSON.parse(JSON.stringify(e)), id: nuevoId(), x: e.x + 40, y: e.y + 30 }));
    estado.elementos.push(...copias); seleccion = copias.map((c) => c.id);
  } else if (ev.key === ']') {
    for (const e of sel) { const i = estado.elementos.indexOf(e); if (i < estado.elementos.length - 1) { estado.elementos.splice(i, 1); estado.elementos.splice(i + 1, 0, e); } }
  } else if (ev.key === '[') {
    for (const e of sel) { const i = estado.elementos.indexOf(e); if (i > 0) { estado.elementos.splice(i, 1); estado.elementos.splice(i - 1, 0, e); } }
  } else if (tecla === 'h') {
    for (const e of sel) e.espejo = !e.espejo;
  } else if (ev.key.startsWith('Arrow')) {
    ev.preventDefault();
    const d = ev.shiftKey ? 10 : 2;
    for (const e of sel) {
      if (ev.key === 'ArrowLeft') e.x -= d; if (ev.key === 'ArrowRight') e.x += d;
      if (ev.key === 'ArrowUp') e.y -= d; if (ev.key === 'ArrowDown') e.y += d;
    }
  } else cambio = false;
  if (cambio) { render(); refrescarPanel(); confirmar(); }
});

/* ---------- Maximizar ---------- */
let pantallaCompletaPropia = false;
function alternarMaximizado(forzar) {
  const activo = forzar === undefined ? !document.body.classList.contains('max') : forzar;
  document.body.classList.toggle('max', activo);
  if (activo && document.documentElement.requestFullscreen && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => (pantallaCompletaPropia = true)).catch(() => {});
  }
  if (!activo && document.fullscreenElement && pantallaCompletaPropia) {
    pantallaCompletaPropia = false;
    document.exitFullscreen().catch(() => {});
  }
}
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && pantallaCompletaPropia) {
    pantallaCompletaPropia = false;
    document.body.classList.remove('max');
  }
});

/* ---------- Selector de letras: abecedario -> letra -> vista previa ---------- */
const ALFABETO = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789'];
let letraActiva = null;
function construirSelectorLetras() {
  const selAbc = $('#sel-abc');
  selAbc.innerHTML = ABCS.map((a) =>
    `<option value="${a.id}"${a.id === abcActivo ? ' selected' : ''}>${esc(a.nombre)} (${Object.keys(a.letras).length})</option>`).join('');
  selAbc.onchange = () => { abcActivo = selAbc.value; llenarLetras(); };
  $('#sel-letra').onchange = (ev) => { letraActiva = ev.target.value; pintarVista(); };
  $('#btn-anadir-letra').onclick = () => { if (letraActiva) anadirLetra(abcActivo, letraActiva); };
  const vista = $('#vista-letra');
  vista.onclick = () => { if (letraActiva) anadirLetra(abcActivo, letraActiva); };
  vista.ondragstart = (ev) => {
    if (!letraActiva) { ev.preventDefault(); return; }
    ev.dataTransfer.setData('text/plain', clave(abcActivo, letraActiva));
  };
  llenarLetras();
}
function llenarLetras() {
  const a = ABCS.find((x) => x.id === abcActivo);
  $('#desc-abc').textContent = a ? a.descripcion : '';
  if (!a) return;
  // Todo el alfabeto; las que aún no existen salen en gris como pendientes
  const extra = Object.keys(a.letras).filter((ch) => !ALFABETO.includes(ch)).sort();
  $('#sel-letra').innerHTML = [...ALFABETO, ...extra].map((ch) => a.letras[ch]
    ? `<option value="${esc(ch)}">${esc(ch)}</option>`
    : `<option value="${esc(ch)}" disabled>${esc(ch)} (pendiente)</option>`).join('');
  if (!letraActiva || !a.letras[letraActiva]) letraActiva = Object.keys(a.letras).sort()[0] || null;
  $('#sel-letra').value = letraActiva || '';
  pintarVista();
}
function pintarVista() {
  const vista = $('#vista-letra');
  const a = ABCS.find((x) => x.id === abcActivo);
  if (!a || !letraActiva || !a.letras[letraActiva]) {
    vista.innerHTML = '<span class="vacia">Este abecedario aún no tiene letras</span>';
    $('#btn-anadir-letra').disabled = true;
    return;
  }
  $('#btn-anadir-letra').disabled = false;
  const ch = letraActiva, m = medidas[clave(a.id, ch)];
  const pad = Math.max(m.w, m.h) * 0.1;
  vista.innerHTML = `<svg viewBox="${m.x - pad} ${m.y - pad} ${m.w + pad * 2} ${m.h + pad * 2}">
    ${usar(idDef(a.id, ch, 'f'), { fill: '#111', stroke: '#111', 'stroke-width': 14, 'stroke-linejoin': 'round' })}
    ${usar(idDef(a.id, ch, 'f'), { fill: '#fff' })}
    ${usar(idDef(a.id, ch, 'h'), { fill: '#111' })}
    ${usar(idDef(a.id, ch, 'b'), { fill: 'none', stroke: '#999', 'stroke-width': 4, 'stroke-linecap': 'round' })}</svg>`;
}

/* ---------- Panel de estilo ---------- */
function construirPresets() {
  const cont = $('#presets');
  for (const p of PRESETS) {
    const b = document.createElement('button');
    b.textContent = p.nombre;
    b.style.background = p.muestra;
    b.onclick = () => {
      estado.estilo = { ...ESTILO_BASE, ...p.estilo };
      for (const e of estado.elementos) if (e.tipo === 'letra') e.estilo = {};
      estado.nube = { ...estado.nube, ...p.nube };
      render(); refrescarPanel(); confirmar();
      aviso(`Estilo «${p.nombre}» aplicado a las letras`);
    };
    cont.appendChild(b);
  }
}

function letraDeReferencia() {
  return seleccionados().find((e) => e.tipo === 'letra');
}
function refrescarPanel() {
  const ref = letraDeReferencia();
  const usarSel = ambito === 'sel' && ref;
  const est = usarSel ? estiloDe(ref) : estado.estilo;
  $$('.panel.der [data-k]').forEach((inp) => {
    const g = inp.dataset.g;
    const v = g ? estado[g][inp.dataset.k] : est[inp.dataset.k];
    if (inp.type === 'checkbox') inp.checked = !!v; else inp.value = v;
  });
  const letrasSel = seleccionados().filter((e) => e.tipo === 'letra');
  $('#ambito-nota').textContent = ambito === 'sel'
    ? (letrasSel.length ? `Cambios solo en ${letrasSel.length === 1 ? 'la letra seleccionada' : `las ${letrasSel.length} letras seleccionadas`}.` : 'Selecciona una o varias letras en el lienzo.')
    : 'Cambios en todas las letras.';
  $$('.panel.der details:not(#sec-elemento)').forEach((d) => {
    const soloGlobal = d.querySelector('[data-g]');
    d.classList.toggle('desactivado', ambito === 'sel' && !letrasSel.length && !soloGlobal);
  });
  $('#btn-quitar-propio').disabled = !letrasSel.some((e) => Object.keys(e.estilo || {}).length);
  // Fondos
  const f = estado.fondo;
  $$('.fondo-btn').forEach((b) => b.classList.toggle('activa', b.dataset.fondo === f.tipo));
  $('#ctl-color-fondo').hidden = f.tipo !== 'liso';
  $('#opciones-imagen').hidden = f.tipo !== 'imagen';
  // Destellos y firmas
  const otro = seleccionados().find((e) => e.tipo !== 'letra');
  const sec = $('#sec-elemento');
  sec.hidden = !(otro && seleccion.length === 1);
  if (otro) {
    $('#ctl-texto').hidden = otro.tipo !== 'texto';
    $('#inp-texto').value = otro.texto || '';
    $('#inp-color-elem').value = otro.color;
  }
}
function aplicarControl(inp) {
  const k = inp.dataset.k, g = inp.dataset.g;
  let v = inp.type === 'checkbox' ? inp.checked : inp.value;
  if (inp.type === 'range') v = parseFloat(v);
  if (g) { estado[g][k] = v; return; }
  const letrasSel = seleccionados().filter((e) => e.tipo === 'letra');
  if (ambito === 'sel') {
    for (const e of letrasSel) e.estilo = { ...(e.estilo || {}), [k]: v };
  } else {
    estado.estilo[k] = v;
    for (const e of estado.elementos) if (e.estilo) delete e.estilo[k];
  }
}
function conectarPanel() {
  $$('.panel.der [data-k]').forEach((inp) => {
    inp.addEventListener('input', () => { aplicarControl(inp); render(); });
    inp.addEventListener('change', () => { aplicarControl(inp); render(); refrescarPanel(); confirmar(); });
  });
  $$('input[name=ambito]').forEach((r) => r.addEventListener('change', () => { ambito = r.value; refrescarPanel(); }));
  $('#btn-quitar-propio').onclick = () => {
    for (const e of seleccionados()) if (e.tipo === 'letra') e.estilo = {};
    render(); refrescarPanel(); confirmar();
  };
  const elem = () => seleccionados().find((e) => e.tipo !== 'letra');
  $('#inp-texto').addEventListener('input', (ev) => { const e = elem(); if (e) { e.texto = ev.target.value; render(); } });
  $('#inp-texto').addEventListener('change', confirmar);
  $('#inp-color-elem').addEventListener('input', (ev) => { const e = elem(); if (e) { e.color = ev.target.value; render(); } });
  $('#inp-color-elem').addEventListener('change', confirmar);
}

/* ---------- Fondos ---------- */
function conectarFondos() {
  $$('.fondo-btn').forEach((b) => (b.onclick = () => {
    estado.fondo.tipo = b.dataset.fondo;
    // el liso es blanco salvo que el usuario haya elegido otro color
    if (b.dataset.fondo === 'liso' && (!estado.fondo.color || estado.fondo.color === '#1f2229')) estado.fondo.color = '#ffffff';
    render(); refrescarPanel(); confirmar();
  }));
  $('#btn-subir-fondo').onclick = () => $('#inp-fondo').click();
  $('#inp-fondo').onchange = (ev) => {
    const archivo = ev.target.files[0];
    ev.target.value = '';
    if (!archivo) return;
    if (!/^image\/(png|jpeg)$/.test(archivo.type)) { aviso('Solo se admiten imágenes JPEG o PNG'); return; }
    const lector = new FileReader();
    lector.onload = () => reducirImagen(lector.result, archivo.type, (dataURL) => {
      const id = 'img' + Date.now();
      imagenes[id] = dataURL;
      estado.fondo.tipo = 'imagen';
      estado.fondo.imagen = id;
      guardarImagenesActuales();
      render(); refrescarPanel(); confirmar();
      aviso('Imagen de fondo cargada');
    });
    lector.readAsDataURL(archivo);
  };
  $('#btn-vaciar-fondo').onclick = () => {
    estado.fondo.tipo = 'transparente';
    estado.fondo.imagen = null;
    render(); refrescarPanel(); confirmar();
    aviso('Fondo vaciado');
  };
}
// Reduce la imagen para no llenar la memoria del navegador
function reducirImagen(src, tipo, listo) {
  const img = new Image();
  img.onload = () => {
    const k = Math.min(1, MAX_LADO_IMAGEN / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    listo(tipo === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = () => aviso('No se pudo leer la imagen');
  img.src = src;
}
function imagenesUsadas(est) {
  const id = est.fondo && est.fondo.imagen;
  return id && imagenes[id] ? { [id]: imagenes[id] } : {};
}
function guardarImagenesActuales() {
  if (!guardarLocal(CLAVE_IMAGENES, JSON.stringify(imagenesUsadas(estado)))) {
    aviso('La imagen es grande: funciona, pero no se recordará al recargar');
  }
}

/* ---------- Barra superior ---------- */
function conectarBarra() {
  $('#form-palabra').addEventListener('submit', (ev) => { ev.preventDefault(); escribirPalabra($('#palabra').value); });
  $('#btn-deshacer').onclick = () => irA(historial.pos - 1);
  $('#btn-rehacer').onclick = () => irA(historial.pos + 1);
  $$('[data-accion=deshacer]').forEach((b) => (b.onclick = () => irA(historial.pos - 1)));
  $$('[data-accion=rehacer]').forEach((b) => (b.onclick = () => irA(historial.pos + 1)));
  $('#btn-destello').onclick = anadirDestello;
  $('#btn-firma').onclick = anadirFirma;
  $('#btn-max').onclick = () => alternarMaximizado(true);
  $('#btn-salir-max').onclick = () => alternarMaximizado(false);
  $('#btn-vaciar').onclick = () => { estado.elementos = []; estado.dibujo = []; seleccion = []; render(); refrescarPanel(); confirmar(); };
  $('#btn-desordenar').onclick = () => {
    for (const e of estado.elementos) if (e.tipo === 'letra') {
      e.rot = (Math.random() - 0.5) * 14;
      e.y = 450 + (Math.random() - 0.5) * 50;
      e.escala = 0.85 * (0.92 + Math.random() * 0.16);
    }
    render(); confirmar();
  };
  $('#btn-guardar').onclick = () => {
    const nombre = prompt('Nombre del diseño:', `Diseño ${new Date().toLocaleString('es-ES')}`);
    if (!nombre) return;
    const lista = leerDisenos().filter((d) => d.nombre !== nombre);
    lista.unshift({ nombre, fecha: Date.now(), estado, imagenes: imagenesUsadas(estado) });
    if (guardarLocal(CLAVE_DISENOS, JSON.stringify(lista))) aviso(`Guardado: ${nombre}`);
    else aviso('No cabe en la memoria del navegador (prueba con una imagen de fondo más pequeña)');
    llenarDisenos();
  };
  $('#sel-disenos').onchange = (ev) => {
    const d = leerDisenos().find((x) => x.nombre === ev.target.value);
    if (!d) return;
    Object.assign(imagenes, d.imagenes || {});
    estado = normalizar(JSON.parse(JSON.stringify(d.estado))); seleccion = [];
    guardarImagenesActuales();
    render(); refrescarPanel(); confirmar(); aviso(`Abierto: ${d.nombre}`);
  };
  $('#btn-borrar-diseno').onclick = () => {
    const n = $('#sel-disenos').value;
    if (!n) { aviso('Elige primero un diseño en la lista'); return; }
    if (!confirm(`¿Borrar el diseño «${n}»?`)) return;
    guardarLocal(CLAVE_DISENOS, JSON.stringify(leerDisenos().filter((d) => d.nombre !== n)));
    llenarDisenos();
  };
  $('#btn-svg').onclick = () => descargar(new Blob([svgExportable()], { type: 'image/svg+xml' }), 'grafiti.svg');
  $('#btn-png').onclick = exportarPNG;
}
function leerDisenos() {
  try { return JSON.parse(localStorage.getItem(CLAVE_DISENOS)) || []; } catch (e) { return []; }
}
function llenarDisenos() {
  const s = $('#sel-disenos');
  s.innerHTML = '<option value="">Abrir diseño…</option>' + leerDisenos().map((d) => `<option>${esc(d.nombre)}</option>`).join('');
}

/* ---------- Exportar ---------- */
function svgExportable() {
  const sel = seleccion; seleccion = []; render();
  const copia = lienzo.cloneNode(true);
  seleccion = sel; render();
  copia.setAttribute('width', 1600); copia.setAttribute('height', 900);
  copia.removeAttribute('id');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(copia);
}
function exportarPNG() {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svgExportable()], { type: 'image/svg+xml' }));
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = 3200; c.height = 1800;
    c.getContext('2d').drawImage(img, 0, 0, 3200, 1800);
    URL.revokeObjectURL(url);
    c.toBlob((b) => descargar(b, 'grafiti.png'), 'image/png');
  };
  img.onerror = () => aviso('No se pudo generar el PNG');
  img.src = url;
}
function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------- Arranque ---------- */
// Adapta diseños guardados con versiones anteriores del mockup
function normalizar(est) {
  const base = nuevoEstado();
  const r = { ...base, ...est, fondo: { ...base.fondo, ...(est.fondo || {}) }, nube: { ...base.nube, ...(est.nube || {}) } };
  if (!['pared', 'liso', 'transparente', 'imagen'].includes(r.fondo.tipo)) r.fondo.tipo = 'pared';
  if (r.fondo.tipo === 'imagen' && !imagenes[r.fondo.imagen]) r.fondo.tipo = 'pared';
  r.dibujo = r.dibujo || [];
  r.elementos = (r.elementos || []).filter((e) => e.tipo !== 'letra' || medidas[clave(e.abc, e.ch)])
    .map((e) => (e.tipo === 'texto' && FIRMAS.length ? { ...e, tipo: 'firma', firma: FIRMAS[0].id, escala: 0.55 } : e));
  return r;
}
function arrancar() {
  if (!ABCS.length) { aviso('No se encontraron abecedarios'); return; }
  defsLetras = prepararDefiniciones();
  try { Object.assign(imagenes, JSON.parse(localStorage.getItem(CLAVE_IMAGENES)) || {}); } catch (e) { /* nada */ }
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(CLAVE_ACTUAL)); } catch (e) { /* nada */ }
  if (guardado && guardado.elementos) {
    estado = normalizar(guardado);
    render();
  } else {
    ejemploInicial();
  }
  construirSelectorLetras(); construirPresets(); conectarPanel(); conectarFondos(); conectarLapiz(); conectarBarra(); llenarDisenos();
  elegirHerramienta('seleccionar');
  refrescarPanel(); confirmar();
}
function ejemploInicial() {
  // SETA: S bubble + E, T, A wildstyle, dos destellos y la firma
  const piezas = [['bubble', 'S'], ['wildstyle', 'E'], ['wildstyle', 'T'], ['wildstyle', 'A']];
  const anchos = piezas.map(([a, c]) => anchoEnLienzo(a, c, 0.85));
  const total = anchos.reduce((s, w) => s + w * 0.88, 0) + anchos[anchos.length - 1] * 0.12;
  let x = 800 - total / 2;
  piezas.forEach(([abc, ch], i) => {
    estado.elementos.push({ id: nuevoId(), tipo: 'letra', abc, ch, x: x + anchos[i] / 2, y: 450, rot: 0, escala: 0.85, espejo: false, estilo: {} });
    x += anchos[i] * 0.88;
  });
  estado.elementos.push({ id: nuevoId(), tipo: 'destello', x: 640, y: 300, rot: 0, escala: 1.3, espejo: false, color: '#ffffff' });
  estado.elementos.push({ id: nuevoId(), tipo: 'destello', x: 1100, y: 560, rot: 0, escala: 1, espejo: false, color: '#ffffff' });
  if (FIRMAS.length) estado.elementos.push({ id: nuevoId(), tipo: 'firma', firma: FIRMAS[0].id, x: 1290, y: 680, rot: -4, escala: 0.5, espejo: false, color: '#ffffff' });
  render();
}

arrancar();
})();
