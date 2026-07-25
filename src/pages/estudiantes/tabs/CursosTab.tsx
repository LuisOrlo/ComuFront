import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, ArrowRight02Icon, Clock04Icon,
  LibraryIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService, type Curso } from "@/services/cursos.service"


export function CursosTab() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalidadFilter, setModalidadFilter] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("")
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const cursosRes = await cursosService.getCursos({ per_page: 500 })
      setCursos(cursosRes.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const filtered = cursos.filter(c => {
    const s = search.toLowerCase()
    const nameMatch = !s || c.nombre.toLowerCase().includes(s)
    const modMatch = !modalidadFilter || c.modalidad === modalidadFilter
    const estMatch = !estadoFilter || c.estado === estadoFilter
    return nameMatch && modMatch && estMatch
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <input
            type="text"
            placeholder="Buscar curso..."
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

      <div className="flex items-center gap-1 border-b mb-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mr-2 shrink-0">Modalidad:</span>
        {[{ value: "", label: "Todos" }, { value: "presencial", label: "Presencial" }, { value: "virtual", label: "Virtual" }].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setModalidadFilter(opt.value)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all"
            style={{
              borderColor: modalidadFilter === opt.value ? COLORS.ACCENT : "transparent",
              color: modalidadFilter === opt.value ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
            }}
          >
            <HugeiconsIcon icon={LibraryIcon} size={13} />
            {opt.label}
          </button>
        ))}
        <span className="flex-1" />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mr-2 shrink-0">Estado:</span>
        {[{ value: "", label: "Todos" }, { value: "en_progreso", label: "En progreso" }, { value: "pendiente", label: "Pendiente" }, { value: "completado", label: "Completado" }].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setEstadoFilter(opt.value)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all"
            style={{
              borderColor: estadoFilter === opt.value ? COLORS.ACCENT : "transparent",
              color: estadoFilter === opt.value ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
            }}
          >
            <HugeiconsIcon icon={Clock04Icon} size={13} />
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse [&_td]:border [&_th]:border [&_td]:border-[oklch(0.85_0_0)] [&_th]:border-[oklch(0.85_0_0)]">
              <thead>
                <tr className="bg-gray-50/80 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 w-[36px] text-center" style={{ color: COLORS.CHARCOAL }}>#</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Curso</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Catálogo</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Modalidad</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Ciudad</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estudiantes</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-20 text-center">
                      <div className="size-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
                      </div>
                      <h3 className="text-gray-900 font-bold">No se encontraron cursos</h3>
                      <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, idx) => (
                    <tr key={c.id} className="transition-colors duration-150" style={{ ["--hover-bg" as string]: "oklch(0.98 0 0)" } as React.CSSProperties}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(0.98 0 0)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td className="px-2 py-3 text-center text-xs opacity-40" style={{ color: COLORS.CHARCOAL }}>{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>{c.nombre}</div>
                        <div className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                          {c.fechaInicio && c.fechaFin ? `${c.fechaInicio} — ${c.fechaFin}` : 'Sin fechas'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>{c.catalogoNombre || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
                          c.modalidad === "virtual"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {c.modalidad === "virtual" ? "Virtual" : "Presencial"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>{c.modalidad === "virtual" ? "No aplica" : c.ciudad}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
                          c.estado === "en_progreso"
                            ? "bg-emerald-50 text-emerald-600"
                            : c.estado === "pendiente"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {c.estado === "en_progreso" ? "En progreso" : c.estado === "pendiente" ? "Pendiente" : "Completado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-base font-semibold" style={{ color: COLORS.CHARCOAL }}>{c.estudiantes}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/estudiantes/cursos/${c.id}`)}
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
        </div>
      )}
    </div>
  )
}
