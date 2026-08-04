import type { AcademicProfile, FinancialProfile } from "@/services/estudiantes.service"
import { COLORS } from "@/lib/constants"

interface OverviewTabContentProps {
  academicData: AcademicProfile | null
  financialData: FinancialProfile | null
  academicLoading: boolean
  financialLoading: boolean
}

export function OverviewTabContent({ academicData, financialData, academicLoading, financialLoading }: OverviewTabContentProps) {
  const matriculas = academicData?.matriculas ?? []
  const esSoloTaller = matriculas.length > 0 && matriculas.every(m => m.curso.startsWith("Taller:"))
  const promedioGeneral = matriculas.length
    ? (matriculas.reduce((acc, m) => acc + (m.promedio || 0), 0) / matriculas.length).toFixed(1)
    : null
  const asistenciaGeneral = matriculas.length
    ? Math.round(matriculas.reduce((acc, m) => acc + m.porcentaje_asistencia, 0) / matriculas.length)
    : null
  const cursosActivos = matriculas.filter(m => m.estado === 'activo').length
  const cursosCompletados = matriculas.filter(m => m.estado === 'completado').length
  const resumen = financialData?.resumen
  const servicios = (financialData?.cuentas ?? []).filter(c => c.origen === 'servicio').sort((a, b) => (b.saldo_pendiente ?? 0) - (a.saldo_pendiente ?? 0))
  const serviciosEnDeuda = servicios.filter(s => s.saldo_pendiente > 0)

  const estadoClasses: Record<string, string> = {
    pendiente: 'bg-red-100 text-red-700',
    abonado: 'bg-amber-100 text-amber-700',
    pagado: 'bg-emerald-100 text-emerald-700',
    anulado: 'bg-gray-100 text-gray-500',
  }

  return (
    <div>
      <div className="flex items-center gap-8 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Promedio General</span>
          <div className="text-2xl font-black mt-0.5" style={{ color: COLORS.CHARCOAL }}>{academicLoading ? '—' : (promedioGeneral || '—')}</div>
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Asistencia</span>
          <div className="text-2xl font-black mt-0.5" style={{ color: asistenciaGeneral !== null && asistenciaGeneral < 70 ? "oklch(0.5 0.15 20)" : COLORS.CHARCOAL }}>
            {academicLoading ? '—' : `${asistenciaGeneral ?? '—'}%`}
          </div>
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Cursos Activos</span>
          <div className="text-2xl font-black mt-0.5" style={{ color: COLORS.CHARCOAL }}>{academicLoading ? '—' : cursosActivos}</div>
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Completados</span>
          <div className="text-2xl font-black mt-0.5" style={{ color: COLORS.CHARCOAL }}>{academicLoading ? '—' : cursosCompletados}</div>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Saldo Pendiente</span>
          <div className="text-2xl font-black mt-0.5" style={{ color: (resumen?.total_adeudado ?? 0) > 0 ? "oklch(0.5 0.15 20)" : COLORS.TEXT_MUTED }}>
            {financialLoading ? '—' : `$${(resumen?.total_adeudado ?? 0).toLocaleString()}`}
          </div>
        </div>
      </div>

      {resumen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.TEXT_MUTED }}>Finanzas</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.TEXT_MUTED }}>Total General</span>
                <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>${resumen.total_general.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.TEXT_MUTED }}>Total Pagado</span>
                <span className="font-bold" style={{ color: "oklch(0.55 0.15 150)" }}>${resumen.total_pagado.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.TEXT_MUTED }}>Total Adeudado</span>
                <span className="font-bold" style={{ color: resumen.total_adeudado > 0 ? "oklch(0.5 0.15 20)" : COLORS.TEXT_MUTED }}>
                  ${resumen.total_adeudado.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.TEXT_MUTED }}>Porcentaje Pagado</span>
                <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>{resumen.porcentaje_pagado}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mt-2" style={{ backgroundColor: "oklch(0.93 0 0)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${resumen.porcentaje_pagado}%`,
                    backgroundColor: resumen.porcentaje_pagado >= 100 ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)"
                  }}
                />
              </div>
              <div className="flex gap-4 text-xs mt-1">
                <span className="font-bold" style={{ color: "oklch(0.5 0.15 20)" }}>{resumen.cuentas_pendientes} Pendientes</span>
                <span className="font-bold" style={{ color: "oklch(0.65 0.15 75)" }}>{resumen.cuentas_abonadas} Abonadas</span>
                <span className="font-bold" style={{ color: "oklch(0.55 0.15 150)" }}>{resumen.cuentas_pagadas} Pagadas</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.TEXT_MUTED }}>{esSoloTaller ? 'Talleres' : 'Cursos'} Recientes</h3>
            {matriculas.length === 0 ? (
              <p className="text-sm py-4" style={{ color: COLORS.TEXT_MUTED }}>Sin {esSoloTaller ? 'talleres' : 'cursos'} registrados.</p>
            ) : (
              <div className="space-y-2">
                {matriculas.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{m.curso}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                        {new Date(m.fecha_inscripcion).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                        {m.promedio !== null && ` · Promedio ${m.promedio}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{m.porcentaje_asistencia}% asis.</span>
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
                  <p className="text-xs pt-1" style={{ color: COLORS.TEXT_MUTED }}>Y {matriculas.length - 5} {esSoloTaller ? 'talleres' : 'cursos'} mas. Ver pestaña Academico.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {servicios.length > 0 && (
        <div className="mt-8 border-t pt-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
              Servicios ({servicios.length})
            </h3>
            {serviciosEnDeuda.length > 0 && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                {serviciosEnDeuda.length} con deuda
              </span>
            )}
          </div>
          <div className="space-y-2">
            {servicios.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{s.concepto}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                    ${s.monto_total.toLocaleString()} · Saldo: ${s.saldo_pendiente.toLocaleString()}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${estadoClasses[s.estado] || 'bg-gray-100 text-gray-600'}`}>
                  {s.estado}
                </span>
              </div>
            ))}
            {servicios.length > 5 && (
              <p className="text-xs pt-1" style={{ color: COLORS.TEXT_MUTED }}>Y {servicios.length - 5} servicio{servicios.length - 5 !== 1 ? 's' : ''} más. Ver pestaña Financiero.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
