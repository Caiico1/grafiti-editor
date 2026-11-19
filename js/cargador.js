/* Carga los abecedarios listados en abecedarios/indice.js y despues el editor.
 * Funciona tambien abriendo index.html como archivo (sin servidor). */
(() => {
  const cargar = (src) => new Promise((ok, fallo) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = () => fallo(src);
    document.body.appendChild(s);
  });
  const ids = window.ABECEDARIOS_INDICE || [];
  Promise.allSettled(ids.map((id) => cargar(`abecedarios/${id}.js`)))
    .then((r) => {
      r.filter((x) => x.status === 'rejected').forEach((x) => console.warn('No se pudo cargar', x.reason));
      return cargar('js/editor.js');
    });
})();
