import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, ArrowRight02Icon, Clock04Icon,
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
  const navigate = useNavigate()
  const [grupos, setGrupos] = useState<GrupoCatalogo[]>([])
  const [sinCatalogo, setSinCatalogo] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [modalidadFilter, setModalidadFilter] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("")

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
        const catMatch = !s || g.catalogo.nombre.toLowerCase().includes(s)
        const cursosMatch = g.cursos.some(c => {
          const nameMatch = !s || c.nombre.toLowerCase().includes(s)
          const modMatch = !modalidadFilter || c.modalidad === modalidadFilter
          const estMatch = !estadoFilter || c.estado === estadoFilter
          return nameMatch && modMatch && estMatch
        })
        if (catMatch || cursosMatch) {
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
    const catMatch = g.catalogo.nombre.toLowerCase().includes(s)
    const cursosMatch = g.cursos.some(c => {
      const nameMatch = !s || c.nombre.toLowerCase().includes(s)
      const modMatch = !modalidadFilter || c.modalidad === modalidadFilter
      const estMatch = !estadoFilter || c.estado === estadoFilter
      return nameMatch && modMatch && estMatch
    })
    return catMatch || cursosMatch
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
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar catalogo o curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all"
          />
        </div>
        <select
          value={modalidadFilter}
          onChange={(e) => setModalidadFilter(e.target.value)}
          className="px-3 py-2.5 text-xs font-bold bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-blue-500/30 transition-all"
        >
          <option value="">Modalidad</option>
          <option value="presencial">Presencial</option>
          <option value="virtual">Virtual</option>
        </select>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="px-3 py-2.5 text-xs font-bold bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-blue-500/30 transition-all"
        >
          <option value="">Estado</option>
          <option value="en_progreso">En progreso</option>
          <option value="pendiente">Pendiente</option>
          <option value="completado">Completado</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
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
            if (search && !g.catalogo.nombre.toLowerCase().includes(search.toLowerCase())) {
              filteredCursos = filteredCursos.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))
            }

            if (filteredCursos.length === 0) return null

            return (
              <div key={g.catalogo.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleExpand(g.catalogo.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <HugeiconsIcon
                    icon={isExpanded ? ChevronDownIcon : ChevronRightIcon}
                    size={16}
                    className="text-gray-400 shrink-0"
                  />
                  <HugeiconsIcon icon={LibraryIcon} size={18} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-900">{g.catalogo.nombre}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {g.cursos.length} curso{g.cursos.length !== 1 ? 's' : ''} · {g.totalEstudiantes} estudiante{g.totalEstudiantes !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Curso</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Instructor</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modalidad</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estudiantes</th>
                            <th className="px-4 py-3 w-16" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredCursos.map(c => (
                            <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-900">{c.nombre}</div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {c.fechaInicio && c.fechaFin ? `${c.fechaInicio} — ${c.fechaFin}` : 'Sin fechas'}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-xs text-gray-600">{c.instructor}</span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                                  c.modalidad === "virtual"
                                    ? "bg-purple-50 text-purple-600"
                                    : "bg-blue-50 text-blue-600"
                                }`}>
                                  {c.modalidad === "virtual" ? "Virtual" : "Presencial"}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-xs text-gray-600">{c.ciudad}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                                  c.estado === "en_progreso"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : c.estado === "pendiente"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}>
                                  {c.estado === "en_progreso" ? "En progreso" : c.estado === "pendiente" ? "Pendiente" : "Completado"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm font-bold text-gray-700">{c.estudiantes}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => navigate(`/estudiantes/cursos/${c.id}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all active:scale-[0.97] shadow-sm"
                                  style={{ backgroundColor: COLORS.ACCENT }}
                                >
                                  Ver
                                  <HugeiconsIcon icon={ArrowRight02Icon} size={11} />
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
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gray-50/30">
                <span className="text-sm font-bold text-gray-500">Sin catalogo</span>
                <span className="text-xs text-gray-400 ml-2">{filteredSinCatalogo.length} curso{filteredSinCatalogo.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Curso</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Instructor</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modalidad</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estudiantes</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredSinCatalogo.map(c => (
                      <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{c.nombre}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {c.fechaInicio && c.fechaFin ? `${c.fechaInicio} — ${c.fechaFin}` : 'Sin fechas'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-600">{c.instructor}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                            c.modalidad === "virtual"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-blue-50 text-blue-600"
                          }`}>
                            {c.modalidad === "virtual" ? "Virtual" : "Presencial"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-600">{c.ciudad}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                            c.estado === "en_progreso"
                              ? "bg-emerald-50 text-emerald-600"
                              : c.estado === "pendiente"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {c.estado === "en_progreso" ? "En progreso" : c.estado === "pendiente" ? "Pendiente" : "Completado"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-bold text-gray-700">{c.estudiantes}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => navigate(`/estudiantes/cursos/${c.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all active:scale-[0.97] shadow-sm"
                            style={{ backgroundColor: COLORS.ACCENT }}
                          >
                            Ver
                            <HugeiconsIcon icon={ArrowRight02Icon} size={11} />
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
            <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center">
              <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
