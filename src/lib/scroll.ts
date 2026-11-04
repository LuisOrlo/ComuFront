/**
 * Reinicia la posición de scroll de la página.
 *
 * En esta app el contenedor que scrollea a nivel de página es <main>
 * (el body mide 100dvh), por lo que window.scrollTo por sí solo no basta.
 * Las rutas públicas sin <main> usan window como respaldo.
 */
export function scrollPageToTop(behavior: ScrollBehavior = "auto") {
  const main = document.querySelector("main")
  if (main instanceof HTMLElement) {
    main.scrollTo({ top: 0, left: 0, behavior })
  }
  window.scrollTo({ top: 0, left: 0, behavior })
}
