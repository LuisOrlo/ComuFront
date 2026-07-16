import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowRight02Icon, ChevronLeftIcon, ChevronRightIcon, Clock04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { estudiantesService } from "@/services/estudiantes.service"

interface CiudadRow {
  ciudad: string
  total: number
}

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export function CiudadesTab() {
  const navigate = useNavigate()
  const [ciudades, setCiudades] = useState<CiudadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<Meta | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await estudiantesService.getCiudades({ page, per_page: 20 })
      setCiudades(resp.datos)
      setMeta(resp.meta)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [search])

  const filtered = ciudades.filter(c =>
    !search || c.ciudad.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-4">
        <div className="relative flex-1 min-w-0">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <input
            type="text"
            placeholder="Buscar ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg outline-none transition-all duration-180 ease-out"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.CHARCOAL,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
              e.currentTarget.style.boxShadow = "none"
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Ciudad</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estudiantes</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                      <div className="size-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
                      </div>
                      <h3 className="text-gray-900 font-bold">No se encontraron ciudades</h3>
                      <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.ciudad} className="transition-colors duration-150" style={{ ["--hover-bg" as string]: "oklch(0.98 0 0)" } as React.CSSProperties}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(0.98 0 0)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>{c.ciudad}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-base font-semibold" style={{ color: COLORS.CHARCOAL }}>{c.total}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/estudiantes/ciudades/${encodeURIComponent(c.ciudad)}`)}
                          className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                          style={{ color: COLORS.TEXT_MUTED }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = COLORS.ACCENT
                            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = COLORS.TEXT_MUTED
                            e.currentTarget.style.backgroundColor = "transparent"
                          }}
                        >
                          <HugeiconsIcon icon={ArrowRight02Icon} size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                Pagina {meta.current_page} de {meta.last_page} ({meta.total} resultados)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{
                    backgroundColor: "oklch(0.97 0 0)",
                    color: COLORS.TEXT_MUTED,
                    opacity: page <= 1 ? 0.4 : 1,
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <HugeiconsIcon icon={ChevronLeftIcon} size={16} />
                </button>
                {(() => {
                  const maxBotones = 5
                  let desde = Math.max(1, meta.current_page - Math.floor(maxBotones / 2))
                  const hasta = Math.min(meta.last_page, desde + maxBotones - 1)
                  if (hasta - desde + 1 < maxBotones) {
                    desde = Math.max(1, hasta - maxBotones + 1)
                  }
                  const paginas: number[] = []
                  for (let i = desde; i <= hasta; i++) paginas.push(i)
                  return paginas.map(pagina => (
                    <button
                      key={pagina}
                      onClick={() => setPage(pagina)}
                      className="size-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors duration-150"
                      style={{
                        backgroundColor: pagina === meta.current_page ? COLORS.ACCENT : "oklch(0.97 0 0)",
                        color: pagina === meta.current_page ? "white" : COLORS.TEXT_MUTED,
                      }}
                    >
                      {pagina}
                    </button>
                  ))
                })()}
                <button
                  onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                  disabled={page >= meta.last_page}
                  className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{
                    backgroundColor: "oklch(0.97 0 0)",
                    color: COLORS.TEXT_MUTED,
                    opacity: page >= meta.last_page ? 0.4 : 1,
                    cursor: page >= meta.last_page ? "not-allowed" : "pointer",
                  }}
                >
                  <HugeiconsIcon icon={ChevronRightIcon} size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
