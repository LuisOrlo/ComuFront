/**
 * Reinicia la posición de scroll de la página.
 *
 * En esta app el contenedor que scrollea a nivel de página es <main>
 * (el body mide 100dvh), por lo que window.scrollTo por sí solo no basta.
 * Las rutas públicas sin <main> usan window como respaldo.
 */
export function scrollPageToTop(behavior: ScrollBehavior = "auto") {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  const main = document.querySelector("main")
  if (main instanceof HTMLElement) {
    main.scrollTo({ top: 0, left: 0, behavior })
    main.scrollTop = 0
  }

  const overflowContainers = document.querySelectorAll(".overflow-y-auto")
  overflowContainers.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.scrollTo({ top: 0, left: 0, behavior })
      el.scrollTop = 0
    }
  })

  document.documentElement.scrollTo({ top: 0, left: 0, behavior })
  document.documentElement.scrollTop = 0
  document.body.scrollTo({ top: 0, left: 0, behavior })
  document.body.scrollTop = 0
  window.scrollTo({ top: 0, left: 0, behavior })
}
