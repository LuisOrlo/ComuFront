import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { usePermission } from "@/hooks/usePermission"
import { FileAttachmentIcon, PaymentIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { FinancialProfile, LineaPagoModulo } from "@/services/estudiantes.service"

interface FinancialTabContentProps {
  data: FinancialProfile | null
  loading: boolean
  onPagoInicial?: (data: { lineasPagoIds: string[]; matriculaId: string; cursoNombre: string }) => void
}

export function FinancialTabContent({ data, loading, onPagoInicial }: FinancialTabContentProps) {
  const { isAdmin } = usePermission()
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null)
  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin size-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando historial financiero...</p>
      </div>
    )
  }

  const tieneDatos = data && (
    data.cuentas.length > 0 ||
    (data.matriculas && data.matriculas.some(m => (m.lineas_pago?.length ?? 0) > 0)) ||
    data.transacciones.length > 0
  )

  if (!tieneDatos) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium">Este estudiante no tiene cuentas financieras registradas.</p>
      </div>
    )
  }

  const resumenReal = {
    total_general: data.resumen.total_general > 0
      ? data.resumen.total_general
      : data.matriculas?.reduce((sum, m) =>
          sum + (m.lineas_pago?.reduce((s, lp) => s + (lp.monto_ajustado ?? 0), 0) ?? 0), 0) ?? 0,
    total_pagado: data.resumen.total_pagado > 0
      ? data.resumen.total_pagado
      : data.matriculas?.reduce((sum, m) =>
          sum + (m.lineas_pago?.reduce((s, lp) => s + (lp.monto_abonado ?? 0), 0) ?? 0), 0) ?? 0,
    total_adeudado: data.resumen.total_adeudado > 0
      ? data.resumen.total_adeudado
      : data.matriculas?.reduce((sum, m) =>
          sum + (m.lineas_pago?.reduce((s, lp) => s + (lp.saldo_pendiente ?? 0), 0) ?? 0), 0) ?? 0,
    porcentaje_pagado: data.resumen.porcentaje_pagado,
    cuentas_pendientes: data.resumen.cuentas_pendientes,
    cuentas_abonadas: data.resumen.cuentas_abonadas,
    cuentas_pagadas: data.resumen.cuentas_pagadas,
  }

  if (data.resumen.total_general <= 0 && resumenReal.total_general > 0) {
    resumenReal.porcentaje_pagado = resumenReal.total_general > 0
      ? Math.round((resumenReal.total_pagado / resumenReal.total_general) * 100)
      : 0
    resumenReal.cuentas_pendientes = data.matriculas?.reduce((sum, m) =>
      sum + (m.lineas_pago?.filter(lp => lp.estado === 'pendiente').length ?? 0), 0) ?? 0
    resumenReal.cuentas_abonadas = data.matriculas?.reduce((sum, m) =>
      sum + (m.lineas_pago?.filter(lp => lp.estado === 'abonado').length ?? 0), 0) ?? 0
    resumenReal.cuentas_pagadas = data.matriculas?.reduce((sum, m) =>
      sum + (m.lineas_pago?.filter(lp => lp.estado === 'pagado').length ?? 0), 0) ?? 0
  }

  const estadoClasses: Record<string, string> = {
    pendiente: 'bg-red-100 text-red-700',
    abonado: 'bg-amber-100 text-amber-700',
    pagado: 'bg-emerald-100 text-emerald-700',
    anulado: 'bg-gray-100 text-gray-500',
  }

  const metodoLabels: Record<string, string> = {
    efectivo: 'Efectivo', transferencia: 'Transferencia', deposito: 'Deposito', tarjeta: 'Tarjeta', otro: 'Otro',
  }

  const verifClasses: Record<string, string> = {
    aprobado: 'bg-emerald-100 text-emerald-700',
    rechazado: 'bg-red-100 text-red-700',
    pendiente: 'bg-amber-100 text-amber-700',
  }

  return (
    <div>
      <div className="flex items-center gap-8 py-3 border-b mb-6">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total General</span>
          <div className="text-xl font-black text-gray-800 mt-0.5">${resumenReal.total_general.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pagado</span>
          <div className="text-xl font-black text-emerald-600 mt-0.5">${resumenReal.total_pagado.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adeudado</span>
          <div className={`text-xl font-black mt-0.5 ${resumenReal.total_adeudado > 0 ? 'text-red-500' : 'text-gray-500'}`}>
            ${resumenReal.total_adeudado.toLocaleString()}
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">% Pagado</span>
          <div className="text-xl font-black text-gray-800 mt-0.5">{resumenReal.porcentaje_pagado}%</div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Cuentas por Cobrar ({data.cuentas.length})
        </h3>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase">Concepto</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Total</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Abonado</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Pendiente</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-right">%</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.cuentas.map((cuenta) => (
                <tr key={cuenta.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-bold text-gray-800">{cuenta.concepto}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">${cuenta.monto_total.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono text-emerald-600">${cuenta.monto_abonado.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono">
                    <span className={cuenta.saldo_pendiente > 0 ? 'text-red-500 font-bold' : 'text-gray-400'}>
                      ${cuenta.saldo_pendiente.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-gray-500">
                    {cuenta.monto_total > 0 ? Math.round((cuenta.monto_abonado / cuenta.monto_total) * 100) : 0}%
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${estadoClasses[cuenta.estado] || 'bg-gray-100 text-gray-600'}`}>
                      {cuenta.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.matriculas && data.matriculas.filter(m => m.lineas_pago?.length > 0).length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Desglose por Módulo
          </h3>
          {data.matriculas.filter(m => m.lineas_pago?.length > 0).map(matricula => (
            <div key={matricula.id} className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50/70 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>
                  {matricula.curso.nombre}
                  {matricula.curso.instancia ? ` — ${matricula.curso.instancia}` : ''}
                </span>
                {isAdmin && onPagoInicial && matricula.lineas_pago.some(lp => lp.estado !== 'pagado') && (
                  <button onClick={() => onPagoInicial({
                    lineasPagoIds: matricula.lineas_pago.map(lp => lp.id),
                    matriculaId: matricula.id,
                    cursoNombre: matricula.curso.nombre,
                  })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors hover:bg-gray-100"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={PaymentIcon} size={12} />
                    Registrar pago
                  </button>
                )}
              </div>
              {matricula.lineas_pago.map((lp, idx) => (
                <ModuleRow key={lp.id} linea={lp} isLast={idx === matricula.lineas_pago.length - 1} />
              ))}
            </div>
          ))}
        </div>
      )}

      {data.transacciones.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Historial de Pagos ({data.transacciones.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase">Fecha</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase">Concepto</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Monto</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase">Metodo</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase">Comp.</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Verif.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.transacciones.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(t.fecha_pago).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-700 text-xs max-w-48 truncate">{t.concepto}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600">${t.monto.toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{metodoLabels[t.metodo_pago] || t.metodo_pago}</td>
                    <td className="px-5 py-3">
                     {t.comprobante_url ? (
                        <button onClick={() => setImagenExpandida(t.comprobante_url)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline"
                          style={{ color: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={FileAttachmentIcon} size={11} /> Ver
                        </button>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${verifClasses[t.estado_verificacion] || 'bg-gray-100 text-gray-600'}`}>
                        {t.estado_verificacion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {imagenExpandida && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setImagenExpandida(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setImagenExpandida(null) }}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-sm font-bold transition-colors"
          >
            Cerrar [X]
          </button>
          <img
            src={imagenExpandida}
            alt="Comprobante"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function ModuleRow({ linea, isLast }: { linea: LineaPagoModulo; isLast: boolean }) {
  const estadoStyle: Record<string, { bg: string; color: string }> = {
    pendiente: { bg: 'rgba(239,68,68,0.08)', color: '#dc2626' },
    abonado: { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
    pagado: { bg: 'rgba(16,185,129,0.08)', color: '#059669' },
  }
  const s = estadoStyle[linea.estado] || estadoStyle.pendiente
  const pct = linea.monto_ajustado > 0 ? Math.round((linea.monto_abonado / linea.monto_ajustado) * 100) : 0

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/30 transition-colors"
      style={{ borderBottom: isLast ? 'none' : `1px solid ${COLORS.BORDER_SUBTLE}` }}>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
          {linea.modulo.nombre || `Módulo ${linea.modulo.numero_orden}`}
        </span>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
            Total: <span className="font-semibold" style={{ color: COLORS.CHARCOAL }}>${linea.monto_ajustado.toFixed(2)}</span>
          </span>
          <span className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
            Abonado: <span className="font-semibold" style={{ color: '#059669' }}>${linea.monto_abonado.toFixed(2)}</span>
          </span>
          <span className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
            Saldo:{' '}
            <span className={`font-semibold ${linea.saldo_pendiente > 0 ? '' : ''}`}
              style={{ color: linea.saldo_pendiente > 0 ? '#dc2626' : '#059669' }}>
              ${linea.saldo_pendiente.toFixed(2)}
            </span>
          </span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.BORDER_SUBTLE }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${pct}%`,
            backgroundColor: linea.estado === 'pagado' ? '#059669' : linea.estado === 'abonado' ? '#d97706' : COLORS.ACCENT,
          }} />
        </div>
        <span className="text-[10px] font-bold">{pct}%</span>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
          style={{ backgroundColor: s.bg, color: s.color }}>
          {linea.estado}
        </span>
      </div>
    </div>
  )
}
