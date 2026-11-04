import { useLayoutEffect } from "react"
import { useLocation } from "react-router"
import { scrollPageToTop } from "@/lib/scroll"

/**
 * Reinicia la posición de scroll al cambiar de ruta.
 *
 * Solo reacciona a cambios de pathname; los cambios de query (por ejemplo
 * ?tab=pagos) no deben mover la página. Los enlaces con hash conservan su
 * comportamiento de salto a la sección.
 */
export function RouteScrollReset() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    if (hash) return
    scrollPageToTop()
  }, [pathname, hash])

  return null
}
