import { useState, useEffect } from "react"
import type { AcademicProfile, AsistenciasResponse } from "@/services/estudiantes.service"
import { estudiantesService } from "@/services/estudiantes.service"

interface AcademicTabContentProps {
  data: AcademicProfile | null
  loading: boolean
}

export function AcademicTabContent({ data, loading }: AcademicTabContentProps) {
  const esSoloTalleres = data?.matriculas.length ? data.matriculas.every(m => m.curso.startsWith("Taller:")) : false
  const [asistencias, setAsistencias] = useState<AsistenciasResponse | null>(null)
  const [asistenciasLoading, setAsistenciasLoading] = useState(false)
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!data?.estudiante?.id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAsistenciasLoading(true)
    estudiantesService.getAsistencias(data.estudiante.id)
      .then(setAsistencias)
      .catch(() => setAsistencias(null))
      .finally(() => setAsistenciasLoading(false))
  }, [data?.estudiante?.id])

  const toggleModulo = (key: string) => {
    setExpandedModulos(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const estadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      presente: "bg-emerald-100 text-emerald-700",
      ausente: "bg-red-100 text-red-700",
      tardanza: "bg-amber-100 text-amber-700",
      justificado: "bg-blue-100 text-blue-700",
    }
    return styles[estado] ?? "bg-gray-100 text-gray-600"
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin size-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando historial academico...</p>
      </div>
    )
  }

  if (!data || data.matriculas.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium">Este estudiante no tiene cursos registrados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            {data.matriculas.length} {esSoloTalleres ? 'Taller' : 'Curso'}{data.matriculas.length !== 1 ? (esSoloTalleres ? 'es' : 's') : ''}
          </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="px-0 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Curso</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Inscripcion</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Asistencia</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Promedio</th>
              {!esSoloTalleres && <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Modulos</th>}
              <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.matriculas.map((matricula) => (
              <tr key={matricula.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 pr-4">
                  <span className="font-bold text-gray-900">{matricula.curso}</span>
                </td>
                <td className="px-4 py-4 text-center text-gray-500 text-xs whitespace-nowrap">
                  {new Date(matricula.fecha_inscripcion).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${matricula.porcentaje_asistencia >= 70 ? 'bg-emerald-500' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(matricula.porcentaje_asistencia, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${matricula.porcentaje_asistencia < 70 ? 'text-red-500' : 'text-gray-600'}`}>
                      {matricula.porcentaje_asistencia}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="font-bold text-gray-800">{matricula.promedio ?? '—'}</span>
                </td>
                {!esSoloTalleres && <td className="px-4 py-4 text-center text-gray-500 text-xs">
                  {matricula.notas.length}
                </td>}
                <td className="px-4 py-4 text-center">
                  <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    matricula.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' :
                    matricula.estado === 'completado' ? 'bg-blue-100 text-blue-700' :
                    matricula.estado === 'retirado' ? 'bg-red-100 text-red-700' :
                    matricula.estado === 'reprobado' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {matricula.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!esSoloTalleres && <div className="border-t pt-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">Calificaciones por Modulo</h3>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {data.matriculas.flatMap((matricula) =>
            matricula.notas.map((nota, idx) => (
              <div key={`${matricula.id}-${idx}`} className="flex items-center justify-between px-4 py-3 border-l-2 rounded-r-lg bg-gray-50/50"
                style={{ borderLeftColor: nota.aprobado ? '#2563eb' : '#ef4444' }}>
                <div className="min-w-0 mr-2">
                  <p className="text-xs font-bold text-gray-700 truncate">{nota.modulo}</p>
                  <p className="text-[10px] text-gray-400 truncate">{matricula.curso}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-sm font-black ${nota.aprobado ? 'text-blue-600' : 'text-red-500'}`}>
                    {nota.calificacion ?? '—'}
                  </span>
                </div>
              </div>
            ))
          )}
          {data.matriculas.flatMap(m => m.notas).length === 0 && (
            <p className="text-sm text-gray-400 col-span-full py-6 text-center">Sin calificaciones registradas.</p>
          )}
        </div>
      </div>}

      {!esSoloTalleres && <div className="border-t pt-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">Asistencias por Modulo</h3>
        {asistenciasLoading && (
          <div className="text-center py-8">
            <div className="animate-spin size-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          </div>
        )}
        {!asistenciasLoading && (!asistencias || asistencias.matriculas.length === 0) && (
          <p className="text-sm text-gray-400 py-6 text-center">Sin registros de asistencia.</p>
        )}
        {!asistenciasLoading && asistencias?.matriculas.map((am) => {
          const matriculaData = data.matriculas.find(m => m.id === am.matricula_id)
          return (
            <div key={am.matricula_id} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-800">{matriculaData?.curso ?? am.curso}</h4>
                <div className="flex gap-3 text-[11px] font-bold">
                  {am.total_ausencias > 0 && <span className="text-red-600">{am.total_ausencias} ausencia{am.total_ausencias !== 1 ? 's' : ''}</span>}
                  {am.total_tardanzas > 0 && <span className="text-amber-600">{am.total_tardanzas} tardanza{am.total_tardanzas !== 1 ? 's' : ''}</span>}
                  {am.total_justificados > 0 && <span className="text-blue-600">{am.total_justificados} justificado{am.total_justificados !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div className="space-y-2">
                {am.modulos.map((mod) => {
                  const key = `${am.matricula_id}-${mod.modulo_id}`
                  const isOpen = expandedModulos.has(key)
                  return (
                    <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleModulo(key)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                          <span className="text-sm font-bold text-gray-800">{mod.modulo_nombre}</span>
                        </div>
                        <div className="flex gap-2 text-[10px] font-bold">
                          {mod.total_ausencias > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">{mod.total_ausencias} A</span>}
                          {mod.total_tardanzas > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{mod.total_tardanzas} T</span>}
                          {mod.total_justificados > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{mod.total_justificados} J</span>}
                          {mod.total_ausencias === 0 && mod.total_tardanzas === 0 && mod.total_justificados === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Completo</span>
                          )}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-gray-100">
                          {mod.registros.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-gray-400">Sin registros</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-gray-50/80">
                                    <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Hora</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Justificacion</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {mod.registros.map((reg, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                      <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                                        {new Date(reg.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                                        {reg.hora_inicio} - {reg.hora_fin}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${estadoBadge(reg.estado)}`}>
                                          {reg.estado}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">
                                        {reg.observaciones || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>}
    </div>
  )
}