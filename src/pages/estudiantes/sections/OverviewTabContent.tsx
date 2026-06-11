import type { AcademicProfile, FinancialProfile } from "@/services/estudiantes.service"

interface OverviewTabContentProps {
  academicData: AcademicProfile | null
  financialData: FinancialProfile | null
  academicLoading: boolean
  financialLoading: boolean
}

export function OverviewTabContent({ academicData, financialData, academicLoading, financialLoading }: OverviewTabContentProps) {
  const matriculas = academicData?.matriculas ?? []
  const promedioGeneral = matriculas.length
    ? (matriculas.reduce((acc, m) => acc + (m.promedio || 0), 0) / matriculas.length).toFixed(1)
    : null
  const asistenciaGeneral = matriculas.length
    ? Math.round(matriculas.reduce((acc, m) => acc + m.porcentaje_asistencia, 0) / matriculas.length)
    : null
  const cursosActivos = matriculas.filter(m => m.estado === 'activo').length
  const cursosCompletados = matriculas.filter(m => m.estado === 'completado').length
  const resumen = financialData?.resumen

  return (
    <div>
      <div className="flex items-center gap-8 py-3 border-b">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Promedio General</span>
          <div className="text-2xl font-black text-gray-800 mt-0.5">{academicLoading ? '—' : (promedioGeneral || '—')}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asistencia</span>
          <div className={`text-2xl font-black mt-0.5 ${asistenciaGeneral !== null && asistenciaGeneral < 70 ? 'text-red-500' : 'text-gray-800'}`}>
            {academicLoading ? '—' : `${asistenciaGeneral ?? '—'}%`}
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cursos Activos</span>
          <div className="text-2xl font-black text-gray-800 mt-0.5">{academicLoading ? '—' : cursosActivos}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completados</span>
          <div className="text-2xl font-black text-gray-800 mt-0.5">{academicLoading ? '—' : cursosCompletados}</div>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saldo Pendiente</span>
          <div className={`text-2xl font-black mt-0.5 ${(resumen?.total_adeudado ?? 0) > 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {financialLoading ? '—' : `$${(resumen?.total_adeudado ?? 0).toLocaleString()}`}
          </div>
        </div>
      </div>

      {resumen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Finanzas</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total General</span>
                <span className="font-bold text-gray-800">${resumen.total_general.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Pagado</span>
                <span className="font-bold text-emerald-600">${resumen.total_pagado.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Adeudado</span>
                <span className={`font-bold ${resumen.total_adeudado > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  ${resumen.total_adeudado.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Porcentaje Pagado</span>
                <span className="font-bold">{resumen.porcentaje_pagado}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${resumen.porcentaje_pagado}%`,
                    backgroundColor: resumen.porcentaje_pagado >= 100 ? '#059669' : '#eab308'
                  }}
                />
              </div>
              <div className="flex gap-4 text-xs mt-1">
                <span className="text-red-500 font-bold">{resumen.cuentas_pendientes} Pendientes</span>
                <span className="text-amber-500 font-bold">{resumen.cuentas_abonadas} Abonadas</span>
                <span className="text-emerald-500 font-bold">{resumen.cuentas_pagadas} Pagadas</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Cursos Recientes</h3>
            {matriculas.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">Sin cursos registrados.</p>
            ) : (
              <div className="space-y-2">
                {matriculas.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-sm font-bold text-gray-800 truncate">{m.curso}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(m.fecha_inscripcion).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                        {m.promedio !== null && ` · Promedio ${m.promedio}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-gray-500">{m.porcentaje_asistencia}% asis.</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        m.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' :
                        m.estado === 'completado' ? 'bg-blue-100 text-blue-700' :
                        m.estado === 'retirado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {m.estado}
                      </span>
                    </div>
                  </div>
                ))}
                {matriculas.length > 5 && (
                  <p className="text-xs text-gray-400 pt-1">Y {matriculas.length - 5} cursos mas. Ver pestaña Academico.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
