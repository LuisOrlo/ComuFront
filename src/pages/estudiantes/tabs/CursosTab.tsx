import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, ArrowRight02Icon, ArrowDown01Icon, Clock04Icon,
  LibraryIcon, ChevronDownIcon, ChevronRightIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService, type Curso, type CatalogoCurso } from "@/services/cursos.service"

interface GrupoCatalogo {
  catalogo: CatalogoCurso
  cursos: Curso[]
  totalEstudiantes: number
}

export function CursosTab() {
  const [grupos, setGrupos] = useState<GrupoCatalogo[]>([])
  const [sinCatalogo, setSinCatalogo] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [modalidadFilter, setModalidadFilter] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("")
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [cursosRes, catalogosRes] = await Promise.all([
        cursosService.getCursos({ per_page: 500 }),
        cursosService.getCatalogos(undefined, 1),
      ])
      const cursos = cursosRes.data
      const catalogos = catalogosRes.data

      const gruposMap = new Map<string, GrupoCatalogo>()
      for (const cat of catalogos) {
        gruposMap.set(cat.id, { catalogo: cat, cursos: [], totalEstudiantes: 0 })
      }

      const sinCat: Curso[] = []

      for (const c of cursos) {
        let matched = false
        for (const cat of catalogos) {
          if (c.nombre && cat.nombre && (
            c.tipo === "regular" || c.tipo === "personalizado"
          )) {
            const grupo = gruposMap.get(cat.id)
            if (grupo) {
              grupo.cursos.push(c)
              grupo.totalEstudiantes += c.estudiantes
              matched = true
              break
            }
          }
        }
        if (!matched) {
          sinCat.push(c)
        }
      }

      const gruposArr = Array.from(gruposMap.values()).filter(g => g.cursos.length > 0)
      gruposArr.sort((a, b) => a.catalogo.nombre.localeCompare(b.catalogo.nombre))
      sinCat.sort((a, b) => a.nombre.localeCompare(b.nombre))

      setGrupos(gruposArr)
      setSinCatalogo(sinCat)
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

  useEffect(() => {
    if (search || modalidadFilter || estadoFilter) {
      const idsToExpand = new Set<string>()
      for (const g of grupos) {
        const s = search.toLowerCase()
        const cursosMatch = g.cursos.some(c => {
          const nameMatch = !s || c.nombre.toLowerCase().includes(s)
          const modMatch = !modalidadFilter || c.modalidad === modalidadFilter
          const estMatch = !estadoFilter || c.estado === estadoFilter
          return nameMatch && modMatch && estMatch
        })
        if (cursosMatch) {
          idsToExpand.add(g.catalogo.id)
        }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedIds(idsToExpand)
    } else {
      setExpandedIds(new Set())
    }
  }, [search, modalidadFilter, estadoFilter, grupos])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredGrupos = grupos.filter(g => {
    if (!search && !modalidadFilter && !estadoFilter) return true
    const s = search.toLowerCase()
    return g.cursos.some(c => {
      const nameMatch = !s || c.nombre.toLowerCase().includes(s)
      const modMatch = !modalidadFilter || c.modalidad === modalidadFilter
      const estMatch = !estadoFilter || c.estado === estadoFilter
      return nameMatch && modMatch && estMatch
    })
  })

  const filteredSinCatalogo = sinCatalogo.filter(c => {
    const s = search.toLowerCase()
    const nameMatch = !s || c.nombre.toLowerCase().includes(s)
    const modMatch = !modalidadFilter || c.modalidad === modalidadFilter
    const estMatch = !estadoFilter || c.estado === estadoFilter
    return nameMatch && modMatch && estMatch
  })

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
            <option value="en_progreso">En progreso</option>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
          </span>
        </div>
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
        <div className="space-y-2">
          {filteredGrupos.map(g => {
            const isExpanded = expandedIds.has(g.catalogo.id)
            let filteredCursos = g.cursos
            if (modalidadFilter) filteredCursos = filteredCursos.filter(c => c.modalidad === modalidadFilter)
            if (estadoFilter) filteredCursos = filteredCursos.filter(c => c.estado === estadoFilter)
            if (search) {
              filteredCursos = filteredCursos.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))
            }

            if (filteredCursos.length === 0) return null

            return (
              <div key={g.catalogo.id} className="bg-white border rounded-xl shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button
                  onClick={() => toggleExpand(g.catalogo.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[oklch(0.98 0 0)] transition-colors duration-150 text-left"
                >
                  <HugeiconsIcon
                    icon={isExpanded ? ChevronDownIcon : ChevronRightIcon}
                    size={16}
                    className="text-gray-400 shrink-0"
                  />
                  <HugeiconsIcon icon={LibraryIcon} size={18} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>{g.catalogo.nombre}</span>
                    <span className="text-xs ml-2" style={{ color: COLORS.TEXT_MUTED }}>
                      {g.cursos.length} curso{g.cursos.length !== 1 ? 's' : ''} · {g.totalEstudiantes} estudiante{g.totalEstudiantes !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/80 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Curso</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Instructor</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Modalidad</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Ciudad</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estado</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estudiantes</th>
                            <th className="px-4 py-3 w-16" />
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          {filteredCursos.map(c => (
                            <tr key={c.id} className="transition-colors duration-150" style={{ ["--hover-bg" as string]: "oklch(0.98 0 0)" } as React.CSSProperties}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(0.98 0 0)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <td className="px-4 py-3">
                                <div className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>{c.nombre}</div>
                                <div className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                                  {c.fechaInicio && c.fechaFin ? `${c.fechaInicio} — ${c.fechaFin}` : 'Sin fechas'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>{c.instructor}</span>
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
                                <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>{c.ciudad}</span>
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filteredSinCatalogo.length > 0 && (
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="px-5 py-4 bg-gray-50/30">
                <span className="text-sm font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Sin catalogo</span>
                <span className="text-xs ml-2" style={{ color: COLORS.TEXT_MUTED }}>{filteredSinCatalogo.length} curso{filteredSinCatalogo.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Curso</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Instructor</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Modalidad</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Ciudad</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estado</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estudiantes</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {filteredSinCatalogo.map(c => (
                      <tr key={c.id} className="transition-colors duration-150" style={{ ["--hover-bg" as string]: "oklch(0.98 0 0)" } as React.CSSProperties}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(0.98 0 0)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>{c.nombre}</div>
                          <div className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                            {c.fechaInicio && c.fechaFin ? `${c.fechaInicio} — ${c.fechaFin}` : 'Sin fechas'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>{c.instructor}</span>
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
                          <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>{c.ciudad}</span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredGrupos.length === 0 && filteredSinCatalogo.length === 0 && !loading && (
            <div className="bg-white border rounded-xl py-20 text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold">No se encontraron cursos</h3>
              <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
