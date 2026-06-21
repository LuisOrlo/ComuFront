import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowRight02Icon, Clock04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller } from "@/services/taller.service"

export function TalleresTab() {
  const navigate = useNavigate()
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalidadFilter, setModalidadFilter] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await tallerService.listar()
      const data = res.data || res.datos || []
      setTalleres(Array.isArray(data) ? data : [])
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

  const filtered = talleres.filter(t => {
    const s = search.toLowerCase()
    const nameMatch = !s || t.nombre.toLowerCase().includes(s)
    const modMatch = !modalidadFilter || t.modalidad === modalidadFilter
    const estMatch = !estadoFilter || t.estado === estadoFilter
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
            placeholder="Buscar taller..."
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
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="en_progreso">En progreso</option>
          <option value="completado">Completado</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Taller</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Instructor</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modalidad</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Inscritos</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-4 py-4 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
                      </div>
                      <h3 className="text-gray-900 font-bold">No se encontraron talleres</h3>
                      <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{t.nombre}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-600">
                          {t.instructor ? `${t.instructor.nombres} ${t.instructor.apellidos}` : "Sin asignar"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-600">{formatDate(t.fecha)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                          t.modalidad === "virtual"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {t.modalidad === "virtual" ? "Virtual" : "Presencial"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-bold text-gray-700">
                          {t.inscripciones_count ?? 0}
                          {t.capacidad_maxima ? ` / ${t.capacidad_maxima}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${estadoColor[t.estado] || "bg-gray-100 text-gray-500"}`}>
                          {estadoLabel[t.estado] || t.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => navigate(`/estudiantes/talleres/${t.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all active:scale-[0.97] shadow-sm"
                          style={{ backgroundColor: COLORS.ACCENT }}
                        >
                          Ver
                          <HugeiconsIcon icon={ArrowRight02Icon} size={11} />
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
