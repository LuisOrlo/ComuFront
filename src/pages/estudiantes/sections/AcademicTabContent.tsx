import type { AcademicProfile } from "@/services/estudiantes.service"

interface AcademicTabContentProps {
  data: AcademicProfile | null
  loading: boolean
}

export function AcademicTabContent({ data, loading }: AcademicTabContentProps) {
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
          {data.matriculas.length} Curso{data.matriculas.length !== 1 ? 's' : ''}
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
              <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Modulos</th>
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
                <td className="px-4 py-4 text-center text-gray-500 text-xs">
                  {matricula.notas.length}
                </td>
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

      <div className="border-t pt-8">
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
      </div>
    </div>
  )
}
