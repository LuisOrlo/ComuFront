import { HugeiconsIcon } from "@hugeicons/react"
import { FileAttachmentIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { FinancialProfile } from "@/services/estudiantes.service"

interface FinancialTabContentProps {
  data: FinancialProfile | null
  loading: boolean
}

export function FinancialTabContent({ data, loading }: FinancialTabContentProps) {
  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin size-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando historial financiero...</p>
      </div>
    )
  }

  if (!data || data.cuentas.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium">Este estudiante no tiene cuentas financieras registradas.</p>
      </div>
    )
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
          <div className="text-xl font-black text-gray-800 mt-0.5">${data.resumen.total_general.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pagado</span>
          <div className="text-xl font-black text-emerald-600 mt-0.5">${data.resumen.total_pagado.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adeudado</span>
          <div className={`text-xl font-black mt-0.5 ${data.resumen.total_adeudado > 0 ? 'text-red-500' : 'text-gray-500'}`}>
            ${data.resumen.total_adeudado.toLocaleString()}
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">% Pagado</span>
          <div className="text-xl font-black text-gray-800 mt-0.5">{data.resumen.porcentaje_pagado}%</div>
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
                        <a href={t.comprobante_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline"
                          style={{ color: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={FileAttachmentIcon} size={11} /> Ver
                        </a>
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
    </div>
  )
}
