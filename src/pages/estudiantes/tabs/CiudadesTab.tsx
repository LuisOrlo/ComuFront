import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowRight02Icon, Clock04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { estudiantesService, type Estudiante } from "@/services/estudiantes.service"

interface CiudadRow {
  ciudad: string
  total: number
}

export function CiudadesTab() {
  const navigate = useNavigate()
  const [ciudades, setCiudades] = useState<CiudadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await estudiantesService.getEstudiantes({ per_page: 1000 })
      const data: Estudiante[] = resp.datos || []

      const map = new Map<string, number>()
      for (const e of data) {
        const ciudad = e.ciudad?.nombre?.trim() || e.perfil_estudiante?.ciudad?.trim()
        if (ciudad) {
          map.set(ciudad, (map.get(ciudad) || 0) + 1)
        }
      }

      const filtradas: CiudadRow[] = Array.from(map.entries())
        .map(([ciudad, total]) => ({ ciudad, total }))
        .sort((a, b) => b.total - a.total)

      setCiudades(filtradas)
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

  const filtered = ciudades.filter(c =>
    !search || c.ciudad.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-4">
        <div className="relative flex-1 min-w-0">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all"
          />
        </div>
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
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estudiantes</th>
                  <th className="px-6 py-4 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                      <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
                      </div>
                      <h3 className="text-gray-900 font-bold">No se encontraron ciudades</h3>
                      <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.ciudad} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">{c.ciudad}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-black text-gray-700">{c.total}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/estudiantes/ciudades/${encodeURIComponent(c.ciudad)}`)}
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
