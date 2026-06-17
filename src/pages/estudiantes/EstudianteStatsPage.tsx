import { useState, useEffect } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, UserGroupIcon, SchoolIcon, MapPinIcon } from "@hugeicons/core-free-icons"
import { estudiantesService, type StudentStats } from "@/services/estudiantes.service"

import { toast } from "sonner"

export function EstudianteStatsPage() {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    estudiantesService.getStudentStats()
      .then(setStats)
      .catch(() => toast.error("Error al cargar estadisticas"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin size-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-sm text-gray-400 font-medium">Cargando estadisticas...</span>
      </div>
    )
  }

  if (!stats) return null

  const totalMatriculas = Object.values(stats.matriculas_por_estado).reduce((a, b) => a + b, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to="/estudiantes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a listado de estudiantes
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-black text-black mt-1">Estadisticas de Estudiantes</h1>
        <p className="text-black mt-1">Metricas generales y tendencias del modulo de gestion estudiantil.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-white border rounded-2xl shadow-sm">
          <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-blue-600" />
          </div>
          <div className="text-3xl font-black text-gray-800">{stats.total_estudiantes}</div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Total Estudiantes</div>
        </div>
        <div className="p-6 bg-white border rounded-2xl shadow-sm">
          <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <HugeiconsIcon icon={SchoolIcon} size={20} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-gray-800">{totalMatriculas}</div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Matriculas</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Metricas Academicas</h3>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-black text-gray-800">{stats.promedio_general}</div>
              <div className="text-xs text-gray-400 mt-1">Promedio General</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-emerald-600">{stats.tasa_completacion}%</div>
              <div className="text-xs text-gray-400 mt-1">Tasa de Completacion</div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Estado de Matriculas</h3>
          <div className="space-y-3">
            {Object.entries(stats.matriculas_por_estado).map(([estado, total]) => (
              <div key={estado} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 w-24 uppercase">{estado}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${totalMatriculas > 0 ? (total / totalMatriculas) * 100 : 0}%`,
                      backgroundColor: estado === 'completado' ? 'oklch(0.55 0.15 150)' :
                                       estado === 'activo' ? 'oklch(0.65 0.2 45)' :
                                       estado === 'retirado' ? 'oklch(0.5 0.15 20)' :
                                       'oklch(0.6 0 0.7)'
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-400 w-12 text-right">{total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={MapPinIcon} size={16} className="text-gray-400" />
          Distribucion por Ciudad
        </h3>
        {stats.por_ciudad.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Ciudad</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Estudiantes</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Distribucion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.por_ciudad.map((c) => (
                  <tr key={c.ciudad} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-700">{c.ciudad}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{c.total}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-48">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${stats.total_estudiantes > 0 ? (c.total / stats.total_estudiantes) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">
                          {stats.total_estudiantes > 0 ? ((c.total / stats.total_estudiantes) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Sin datos de distribucion por ciudad.</p>
        )}
      </div>
    </div>
  )
}
