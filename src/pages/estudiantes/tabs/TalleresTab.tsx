import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowRight02Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowDown01Icon, Clock04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller } from "@/services/taller.service"

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export function TalleresTab() {
  const navigate = useNavigate()
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalidadFilter, setModalidadFilter] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<Meta | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, per_page: 15 }
      if (search) params.search = search
      if (modalidadFilter) params.modalidad = modalidadFilter
      if (estadoFilter) params.estado = estadoFilter

      const res = await tallerService.listar(params)
      const data = res.data || res.datos || []
      setTalleres(Array.isArray(data) ? data : [])
      setMeta({
        current_page: res.current_page ?? res.meta?.current_page ?? 1,
        last_page: res.last_page ?? res.meta?.last_page ?? 1,
        per_page: res.per_page ?? res.meta?.per_page ?? 15,
        total: res.total ?? res.meta?.total ?? 0,
      })
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, search, modalidadFilter, estadoFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [search, modalidadFilter, estadoFilter])

  const formatDate = (d?: string) => {
    if (!d) return "—"
    try {
      const date = new Date(d.includes("T") ? d : d + "T00:00:00")
      return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })
    } catch {
      return d
    }
  }

  const estadoLabel: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    en_progreso: "En progreso",
    completado: "Completado",
    cancelado: "Cancelado",
  }

  const estadoColor: Record<string, string> = {
    pendiente: "bg-amber-50 text-amber-600",
    confirmado: "bg-blue-50 text-blue-600",
    en_progreso: "bg-emerald-50 text-emerald-600",
    completado: "bg-gray-100 text-gray-500",
    cancelado: "bg-red-50 text-red-500",
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <input
            type="text"
            placeholder="Buscar taller..."
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
        <div className="relative">
          <select
            value={modalidadFilter}
            onChange={(e) => setModalidadFilter(e.target.value)}
            className="appearance-none bg-white border rounded-lg pl-3 pr-8 py-2 text-sm outline-none cursor-pointer min-w-[130px] select-none transition-all duration-180 ease-out"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              color: modalidadFilter ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <option value="">Todos</option>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
          </span>
        </div>
        <div className="relative">
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="appearance-none bg-white border rounded-lg pl-3 pr-8 py-2 text-sm outline-none cursor-pointer min-w-[130px] select-none transition-all duration-180 ease-out"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              color: estadoFilter ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="en_progreso">En progreso</option>
            <option value="completado">Completado</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
          </span>
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
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Taller</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Instructor</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Modalidad</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Inscritos</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estado</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {talleres.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="size-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
                      </div>
                      <h3 className="text-gray-900 font-bold">No se encontraron talleres</h3>
                      <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda.</p>
                    </td>
                  </tr>
                ) : (
                  talleres.map(t => (
                    <tr key={t.id} className="transition-colors duration-150" style={{ ["--hover-bg" as string]: "oklch(0.98 0 0)" } as React.CSSProperties}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(0.98 0 0)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>{t.nombre}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>
                          {t.instructor ? `${t.instructor.nombres} ${t.instructor.apellidos}` : "Sin asignar"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>{formatDate(t.fecha)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
                          t.modalidad === "virtual"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {t.modalidad === "virtual" ? "Virtual" : "Presencial"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-base font-semibold" style={{ color: COLORS.CHARCOAL }}>
                          {t.inscripciones_count ?? 0}
                          {t.capacidad_maxima ? ` / ${t.capacidad_maxima}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${estadoColor[t.estado] || "bg-gray-100 text-gray-500"}`}>
                          {estadoLabel[t.estado] || t.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/estudiantes/talleres/${t.id}`)}
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
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
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
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
