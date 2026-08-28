import { HugeiconsIcon } from "@hugeicons/react"
import { useState, useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { FileAttachmentIcon, PaymentIcon, PencilEdit01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { getStorageUrl } from "@/lib/utils"
import type { FinancialProfile, LineaPagoModulo } from "@/services/estudiantes.service"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

interface FinancialTabContentProps {
  data: FinancialProfile | null
  loading: boolean
  onRefresh: () => void
}

export function FinancialTabContent({ data, loading, onRefresh }: FinancialTabContentProps) {
  const { id: estudianteId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null)
  const [expandedCursos, setExpandedCursos] = useState<Set<string>>(new Set())
  const [showFullHistorial, setShowFullHistorial] = useState(false)
  const [editModal, setEditModal] = useState<{ isGroup: boolean; id: string; ids: string[]; monto: number; metodo: string } | null>(null)
  const [editMonto, setEditMonto] = useState("")
  const [editMetodo, setEditMetodo] = useState("")
  const [editMontosValues, setEditMontosValues] = useState<Record<string, string>>({})
  const [editFile, setEditFile] = useState<File | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const handleSaveEdit = useCallback(async () => {
    if (!editModal) return
    setSavingEdit(true)
    try {
      if (editModal.isGroup) {
        const promises = editModal.ids.map(txId => {
          const m = parseFloat(editMontosValues[txId])
          if (!m || m <= 0) throw new Error("Ingresa montos válidos")
          
          let dto: any
          if (editFile) {
            dto = new FormData()
            dto.append("monto", String(m))
            dto.append("metodo_pago", editMetodo)
            dto.append("comprobante", editFile)
          } else {
            dto = { monto: m, metodo_pago: editMetodo }
          }
          return financeService.updateTransaccion(txId, dto)
        })
        await Promise.all(promises)
      } else {
        const monto = parseFloat(editMonto)
        if (!monto || monto <= 0) { throw new Error("Ingresa un monto válido") }
        
        let dto: any
        if (editFile) {
          dto = new FormData()
          dto.append("monto", String(monto))
          dto.append("metodo_pago", editMetodo)
          dto.append("comprobante", editFile)
        } else {
          dto = { monto, metodo_pago: editMetodo }
        }
        await financeService.updateTransaccion(editModal.id, dto)
      }
      toast.success("Pago actualizado correctamente")
      setEditModal(null)
      setEditFile(null)
      onRefresh()
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.message || (err as any)?.response?.data?.mensaje || "Error al actualizar")
    } finally { setSavingEdit(false) }
  }, [editModal, editMonto, editMetodo, editMontosValues, editFile, onRefresh])

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
          sum + (m.lineas_pago?.reduce((s, lp) => s + (lp.monto_original ?? 0), 0) ?? 0), 0) ?? 0,
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
                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Acción</th>
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
                  <td className="px-5 py-3 text-center">
                    {isAdmin && cuenta.saldo_pendiente > 0 && cuenta.estado !== 'pagado' && (
                      <button
                        onClick={() => {
                          if (cuenta.origen === 'matricula') {
                            const params = new URLSearchParams({
                              curso: cuenta.concepto,
                              nombre: data?.estudiante?.nombre_completo || '',
                              cedula: data?.estudiante?.cedula || '',
                            })
                            navigate(`/estudiantes/${estudianteId}/academico/registrar-pago/${cuenta.origen_id}?${params.toString()}`)
                          } else {
                            navigate(`/finanzas/pagos/cuentas/servicios/pago/${cuenta.id}`, {
                              state: {
                                cuentaId: cuenta.id,
                                montoSaldo: cuenta.saldo_pendiente,
                                montoTotal: cuenta.monto_total,
                                concepto: cuenta.concepto,
                              },
                            })
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors hover:bg-gray-100"
                        style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}
                      >
                        <HugeiconsIcon icon={PaymentIcon} size={12} />
                        Pagar
                      </button>
                    )}
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
          {data.matriculas.filter(m => m.lineas_pago?.length > 0).map(matricula => {
            const hasSaldo = matricula.lineas_pago.some(lp => lp.saldo_pendiente > 0)
            const isOpen = expandedCursos.has(matricula.id)
            const toggleCurso = () => setExpandedCursos(prev => {
              const next = new Set(prev)
              if (next.has(matricula.id)) next.delete(matricula.id)
              else next.add(matricula.id)
              return next
            })

            return (
            <div key={matricula.id} className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <button
                onClick={toggleCurso}
                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50/70 text-left hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs transition-transform ${isOpen ? 'rotate-90' : ''} shrink-0`}>▶</span>
                  <span className="text-sm font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>
                    {matricula.curso.nombre}
                    {matricula.curso.instancia ? ` — ${matricula.curso.instancia}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {hasSaldo && !isOpen && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      Pendiente
                    </span>
                  )}
                  {!isOpen && (
                    <span className="text-[10px] text-gray-400">
                      {matricula.lineas_pago.length} módulo{matricula.lineas_pago.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
              {isOpen && (
                <>
                  {isAdmin && matricula.lineas_pago.some(lp => lp.estado !== 'pagado') && (
                    <div className="px-5 py-2 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <button onClick={() => {
                        const params = new URLSearchParams({
                          curso: matricula.curso.nombre,
                          nombre: data?.estudiante?.nombre_completo || '',
                          cedula: data?.estudiante?.cedula || '',
                        })
                        navigate(`/estudiantes/${estudianteId}/academico/registrar-pago/${matricula.id}?${params.toString()}`)
                      }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors hover:bg-gray-100"
                        style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                        <HugeiconsIcon icon={PaymentIcon} size={12} />
                        Registrar pago
                      </button>
                    </div>
                  )}
                  {matricula.lineas_pago.map((lp, idx) => (
                    <ModuleRow key={lp.id} linea={lp} isLast={idx === matricula.lineas_pago.length - 1} />
                  ))}
                </>
              )}
            </div>
          )})}
        </div>
      )}

      {data.transacciones.length > 0 && (() => {
        const groupedMap = new Map<string, typeof data.transacciones[0] & { count: number, ids: string[] }>()
        for (const t of data.transacciones) {
          const key = `${t.fecha_pago}_${t.concepto}_${t.metodo_pago}_${t.comprobante_url}_${t.estado_verificacion}`
          if (groupedMap.has(key)) {
            const existing = groupedMap.get(key)!
            if (!existing.ids.includes(t.id)) {
              existing.monto += t.monto
              existing.count++
              existing.ids.push(t.id)
            }
          } else {
            groupedMap.set(key, { ...t, count: 1, ids: [t.id] })
          }
        }
        const groupedTransacciones = Array.from(groupedMap.values()).sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())
        
        const transaccionesMostradas = showFullHistorial
          ? groupedTransacciones
          : groupedTransacciones.slice(0, 10)
        return (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Historial de Pagos ({groupedTransacciones.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase w-24">Fecha</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase">Concepto</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-right w-20">Monto</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase w-24">Mtodo</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase w-14">Comp.</th>
                  <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-center w-20">Verif.</th>
                  {isAdmin && <th className="px-5 py-3 w-16"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transaccionesMostradas.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(t.fecha_pago + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-700 text-xs truncate">{t.concepto}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600 text-xs whitespace-nowrap">${t.monto.toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{metodoLabels[t.metodo_pago] || t.metodo_pago}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {t.comprobante_url ? (
                         <button onClick={() => setImagenExpandida(getStorageUrl(t.comprobante_url))}
                          className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline"
                          style={{ color: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={FileAttachmentIcon} size={11} /> Ver
                        </button>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${verifClasses[t.estado_verificacion] || 'bg-gray-100 text-gray-600'}`}>
                        {t.estado_verificacion}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        {t.estado_verificacion === 'aprobado' && (
                          <button onClick={() => {
                            setEditMetodo(t.metodo_pago)
                            setEditFile(null)
                            if (t.count > 1) {
                              const m: Record<string, string> = {}
                              t.ids.forEach(id => {
                                const original = data.transacciones.find(tr => tr.id === id)
                                if (original) {
                                  m[id] = String(original.monto)
                                }
                              })
                              setEditMontosValues(m)
                              setEditModal({ isGroup: true, id: t.id, ids: t.ids, monto: t.monto, metodo: t.metodo_pago })
                            } else {
                              setEditModal({ isGroup: false, id: t.id, ids: [t.id], monto: t.monto, metodo: t.metodo_pago })
                              setEditMonto(String(t.monto))
                            }
                          }}
                            className="inline-flex items-center gap-1 text-[10px] font-medium hover:underline transition-colors"
                            style={{ color: COLORS.TEXT_MUTED }}>
                            <HugeiconsIcon icon={PencilEdit01Icon} size={12} />
                            Editar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {groupedTransacciones.length > 10 && !showFullHistorial && (
            <button
              onClick={() => setShowFullHistorial(true)}
              className="mt-3 text-xs font-bold hover:underline"
              style={{ color: COLORS.ACCENT }}
            >
              Ver historial completo ({groupedTransacciones.length} pagos)
            </button>
          )}
        </div>
      )})()}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setEditModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 z-10 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h3 className="text-sm font-black text-gray-900">Editar pago</h3>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {editModal.isGroup ? (
                <div className="space-y-3">
                  {editModal.ids.map((txId, i) => {
                    const original = data?.transacciones?.find(tr => tr.id === txId)
                    let lineaNombre = `Línea de pago ${i + 1}`
                    
                    if (original && original.linea_pago_modulo_id && data?.matriculas) {
                      for (const m of data.matriculas) {
                        const lp = m.lineas_pago?.find(l => l.id === original.linea_pago_modulo_id)
                        if (lp) {
                          lineaNombre = lp.modulo?.nombre || (lp.tipo === 'inscripcion' ? 'Inscripción / Matrícula' : 'Módulo')
                          break
                        }
                      }
                    } else if (original && original.concepto) {
                      const partes = original.concepto.split(' - ')
                      if (partes.length > 1) {
                        lineaNombre = partes[partes.length - 1].trim()
                      } else {
                        lineaNombre = original.concepto
                      }
                    }

                    return (
                      <div key={txId} className="p-3 border rounded-lg bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <div className="text-xs font-bold text-gray-700 mb-2">{lineaNombre} {original ? `(Original: $${original.monto.toLocaleString()})` : ''}</div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Monto asignado</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">$</span>
                            <input type="number" min="0.01" step="0.01" value={editMontosValues[txId] || ''}
                              onChange={e => setEditMontosValues(prev => ({ ...prev, [txId]: e.target.value }))}
                              className="w-full pl-7 pr-3 py-1.5 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/10 bg-white"
                              style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Monto</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">$</span>
                    <input type="number" min="0.01" step="0.01" value={editMonto}
                      onChange={e => setEditMonto(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/10"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t mt-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Método de Pago Global</label>
                    <select value={editMetodo} onChange={e => setEditMetodo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="deposito">Depósito</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Nuevo Comprobante (Opcional)</label>
                    <input type="file" accept="image/*,.pdf"
                      onChange={e => setEditFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <button onClick={() => setEditModal(null)} disabled={savingEdit}
                className="px-4 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-100 disabled:opacity-50"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={savingEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                {savingEdit ? "Guardando..." : "Guardar"}
              </button>
            </div>
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
  const pct = linea.monto_original > 0 ? Math.round((linea.monto_abonado / linea.monto_original) * 100) : 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const esInscripcion = (linea as any).tipo === 'inscripcion'
  const nombre = esInscripcion
    ? 'Inscripción / Matrícula'
    : (linea.modulo?.nombre || `Módulo ${linea.modulo?.numero_orden}`)

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/30 transition-colors"
      style={{ borderBottom: isLast ? 'none' : `1px solid ${COLORS.BORDER_SUBTLE}` }}>
      <div className="min-w-0 flex-1">
          <span className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
            {nombre}
          </span>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
            Total: <span className="font-semibold" style={{ color: COLORS.CHARCOAL }}>${linea.monto_original.toFixed(2)}</span>
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
