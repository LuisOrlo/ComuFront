import { useLayoutEffect } from "react"
import { useLocation } from "react-router"

/**
 * Reinicia la posición de scroll al cambiar de ruta.
 *
 * En esta app el contenedor que scrollea a nivel de página es <main>
 * (el body mide 100dvh), por lo que window.scrollTo por sí solo no basta.
 * Las rutas públicas (login, matrícula, agenda pública) no usan <main>,
 * así que se usa window como respaldo.
 */
export function RouteScrollReset() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    // Los enlaces con ancla conservan su comportamiento de salto a sección.
    if (hash) return

    const main = document.querySelector("main")
    if (main instanceof HTMLElement) {
      main.scrollTop = 0
      main.scrollLeft = 0
    }

    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
