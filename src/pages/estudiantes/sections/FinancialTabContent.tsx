import { useState, useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { getStorageUrl } from "@/lib/utils"
import type { FinancialProfile } from "@/services/estudiantes.service"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  Layers,
  FileText,
  Download,
  Edit2,
  Plus,
  X,
} from "lucide-react"

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
  const [showFullHistorial, setShowFullHistorial] = useState(false)
  const [editModal, setEditModal] = useState<{
    isGroup: boolean
    id: string
    ids: string[]
    monto: number
    metodo: string
  } | null>(null)
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
        const promises = editModal.ids.map((txId) => {
          const m = parseFloat(editMontosValues[txId])
          if (!m || m <= 0) throw new Error("Ingresa montos válidos")

          let dto: FormData | { monto: number; metodo_pago: string }
          if (editFile) {
            const fd = new FormData()
            fd.append("monto", String(m))
            fd.append("metodo_pago", editMetodo)
            fd.append("comprobante", editFile)
            dto = fd
          } else {
            dto = { monto: m, metodo_pago: editMetodo }
          }
          return financeService.updateTransaccion(txId, dto)
        })
        await Promise.all(promises)
      } else {
        const monto = parseFloat(editMonto)
        if (!monto || monto <= 0) {
          throw new Error("Ingresa un monto válido")
        }

        let dto: FormData | { monto: number; metodo_pago: string }
        if (editFile) {
          const fd = new FormData()
          fd.append("monto", String(monto))
          fd.append("metodo_pago", editMetodo)
          fd.append("comprobante", editFile)
          dto = fd
        } else {
          dto = { monto, metodo_pago: editMetodo }
        }
        await financeService.updateTransaccion(editModal.id, dto)
      }
      toast.success("Pago actualizado correctamente")
      setEditModal(null)
      setEditFile(null)
      onRefresh()
    } catch (err: unknown) {
      const errorObj = err as { message?: string; response?: { data?: { mensaje?: string } } }
      toast.error(errorObj?.message || errorObj?.response?.data?.mensaje || "Error al actualizar")
    } finally {
      setSavingEdit(false)
    }
  }, [editModal, editMonto, editMetodo, editMontosValues, editFile, onRefresh])

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="animate-spin size-7 border-2 border-[#fd761a] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400">Cargando expediente financiero...</p>
      </div>
    )
  }

  const tieneDatos =
    data &&
    (data.cuentas.length > 0 ||
      (data.matriculas && data.matriculas.some((m) => (m.lineas_pago?.length ?? 0) > 0)) ||
      data.transacciones.length > 0)

  if (!tieneDatos) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Receipt className="size-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Sin cuentas financieras</p>
        <p className="text-xs text-slate-400 mt-1">Este estudiante no tiene cuentas ni pagos registrados.</p>
      </div>
    )
  }

  const resumenReal = {
    total_general:
      data.resumen.total_general > 0
        ? data.resumen.total_general
        : data.matriculas?.reduce(
            (sum, m) =>
              sum + (m.lineas_pago?.reduce((s, lp) => s + (lp.monto_original ?? 0), 0) ?? 0),
            0
          ) ?? 0,
    total_pagado:
      data.resumen.total_pagado > 0
        ? data.resumen.total_pagado
        : data.matriculas?.reduce(
            (sum, m) =>
              sum + (m.lineas_pago?.reduce((s, lp) => s + (lp.monto_abonado ?? 0), 0) ?? 0),
            0
          ) ?? 0,
    total_adeudado:
      data.resumen.total_adeudado > 0
        ? data.resumen.total_adeudado
        : data.matriculas?.reduce(
            (sum, m) =>
              sum + (m.lineas_pago?.reduce((s, lp) => s + (lp.saldo_pendiente ?? 0), 0) ?? 0),
            0
          ) ?? 0,
    porcentaje_pagado: data.resumen.porcentaje_pagado,
  }

  if (data.resumen.total_general <= 0 && resumenReal.total_general > 0) {
    resumenReal.porcentaje_pagado =
      resumenReal.total_general > 0
        ? Math.round((resumenReal.total_pagado / resumenReal.total_general) * 100)
        : 0
  }

  const estadoBadgeClass = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pagado":
        return "bg-emerald-100 text-emerald-800"
      case "abonado":
        return "bg-amber-100 text-amber-800"
      case "pendiente":
        return "bg-rose-100 text-rose-800"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const verifBadgeClass = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "aprobado":
        return "bg-emerald-100 text-emerald-800"
      case "rechazado":
        return "bg-rose-100 text-rose-800"
      case "pendiente":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const metodoLabels: Record<string, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    deposito: "Depósito",
    tarjeta: "Tarjeta",
    otro: "Otro",
  }

  // Agrupar transacciones similares
  const groupedMap = new Map<string, (typeof data.transacciones)[0] & { count: number; ids: string[] }>()
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
  const groupedTransacciones = Array.from(groupedMap.values()).sort(
    (a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
  )

  const transaccionesMostradas = showFullHistorial
    ? groupedTransacciones
    : groupedTransacciones.slice(0, 10)

  const lineasTotalesCount =
    data.matriculas?.reduce((acc, m) => acc + (m.lineas_pago?.length || 0), 0) || 0

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Financial KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total General</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ${resumenReal.total_general.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5">Valor del programa</span>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Pagado</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            ${resumenReal.total_pagado.toFixed(2)}
          </span>
          <span className="text-xs text-emerald-700 font-medium mt-0.5">
            {groupedTransacciones.length} transacción{groupedTransacciones.length !== 1 ? "es" : ""}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Adeudado / Por Vencer
          </span>
          <span
            className={`text-2xl font-bold mt-1 font-mono ${
              resumenReal.total_adeudado > 0 ? "text-rose-600" : "text-slate-500"
            }`}
          >
            ${resumenReal.total_adeudado.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5">
            {resumenReal.total_adeudado > 0 ? "Saldo por liquidar" : "Sin saldos pendientes"}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">% Liquidado</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {resumenReal.porcentaje_pagado}%
          </span>
          <span
            className={`text-xs font-semibold mt-0.5 ${
              resumenReal.porcentaje_pagado >= 100 ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {resumenReal.porcentaje_pagado >= 100 ? "Totalmente Saldado" : "Pendiente de completar"}
          </span>
        </div>
      </div>

      {/* Section: Cuentas y Obligaciones Registradas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-[#fd761a]" />
            <h3 className="text-sm font-bold text-slate-900">Cuentas y Obligaciones Registradas</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {data.cuentas.length} {data.cuentas.length === 1 ? "Cuenta Activa" : "Cuentas Activas"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Concepto</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Abonado</th>
                <th className="py-3 px-4 text-right">Pendiente</th>
                <th className="py-3 px-4 text-center">%</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.cuentas.map((cuenta) => {
                const pct =
                  cuenta.monto_total > 0
                    ? Math.round((cuenta.monto_abonado / cuenta.monto_total) * 100)
                    : 0
                return (
                  <tr key={cuenta.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div>{cuenta.concepto}</div>
                      <span className="block font-normal text-xs text-slate-500 font-mono mt-0.5">
                        {cuenta.origen === "matricula" ? "Inscripción a Programa" : "Servicio / Obligación"}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-right text-slate-900 whitespace-nowrap">
                      ${cuenta.monto_total.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-right text-emerald-600 whitespace-nowrap">
                      ${cuenta.monto_abonado.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-right whitespace-nowrap">
                      <span className={cuenta.saldo_pendiente > 0 ? "text-rose-600 font-bold" : "text-slate-400"}>
                        ${cuenta.saldo_pendiente.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-800 font-mono text-xs">
                      {pct}%
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${estadoBadgeClass(
                          cuenta.estado
                        )}`}
                      >
                        {cuenta.estado.charAt(0).toUpperCase() + cuenta.estado.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {isAdmin && cuenta.saldo_pendiente > 0 && cuenta.estado !== "pagado" ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (cuenta.origen === "matricula") {
                              const params = new URLSearchParams({
                                curso: cuenta.concepto,
                                nombre: data?.estudiante?.nombre_completo || "",
                                cedula: data?.estudiante?.cedula || "",
                              })
                              navigate(
                                `/estudiantes/${estudianteId}/academico/registrar-pago/${cuenta.origen_id}?${params.toString()}`
                              )
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
                          className="text-[#fd761a] hover:text-[#ea580c] font-semibold text-xs inline-flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <CreditCard className="size-3.5" />
                          <span>Pagar saldo</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Al día</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Desglose por Módulo (Collapsible Ledger) */}
      {data.matriculas && data.matriculas.some((m) => (m.lineas_pago?.length ?? 0) > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <details className="group" open>
            <summary className="px-6 py-3.5 cursor-pointer flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/60 transition-colors list-none select-none border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-[#fd761a]" />
                <h4 className="text-sm font-bold text-slate-900">Desglose por Módulo e Inscripción</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  {lineasTotalesCount} conceptos agrupados
                </span>
                <ChevronDown className="size-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </div>
            </summary>

            <div className="overflow-x-auto">
              {data.matriculas
                .filter((m) => (m.lineas_pago?.length ?? 0) > 0)
                .map((matricula) => (
                  <div key={matricula.id} className="border-b last:border-b-0 border-slate-100">
                    <div className="px-6 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {matricula.curso.nombre}
                        {matricula.curso.instancia ? ` — ${matricula.curso.instancia}` : ""}
                      </span>
                      {isAdmin && matricula.lineas_pago.some((lp) => lp.estado !== "pagado") && (
                        <button
                          type="button"
                          onClick={() => {
                            const params = new URLSearchParams({
                              curso: matricula.curso.nombre,
                              nombre: data?.estudiante?.nombre_completo || "",
                              cedula: data?.estudiante?.cedula || "",
                            })
                            navigate(
                              `/estudiantes/${estudianteId}/academico/registrar-pago/${matricula.id}?${params.toString()}`
                            )
                          }}
                          className="text-[#fd761a] hover:text-[#ea580c] text-[11px] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Plus className="size-3" />
                          Registrar pago
                        </button>
                      )}
                    </div>

                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-white text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="py-2.5 px-6">Ítem</th>
                          <th className="py-2.5 px-4 text-right">Total</th>
                          <th className="py-2.5 px-4 text-right">Abonado</th>
                          <th className="py-2.5 px-4 text-right">Saldo</th>
                          <th className="py-2.5 px-4 text-center">Progreso</th>
                          <th className="py-2.5 px-6 text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {matricula.lineas_pago.map((lp) => {
                          const pct =
                            lp.monto_original > 0
                              ? Math.round((lp.monto_abonado / lp.monto_original) * 100)
                              : 0
                          const esInscripcion = lp.tipo === "inscripcion"
                          const nombre = esInscripcion
                            ? "Inscripción / Matrícula Institucional"
                            : lp.modulo?.nombre || `Módulo ${lp.modulo?.numero_orden || ""}`

                          return (
                            <tr key={lp.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3 px-6 font-medium text-slate-800">{nombre}</td>
                              <td className="py-3 px-4 font-mono text-right text-slate-800">
                                ${lp.monto_original.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 font-mono text-right text-emerald-600 font-bold">
                                ${lp.monto_abonado.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 font-mono text-right text-slate-600">
                                <span
                                  className={lp.saldo_pendiente > 0 ? "text-rose-600 font-semibold" : "text-slate-400"}
                                >
                                  ${lp.saldo_pendiente.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        lp.estado === "pagado" ? "bg-emerald-500" : "bg-amber-500"
                                      }`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-mono">{pct}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-6 text-right">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${estadoBadgeClass(
                                    lp.estado
                                  )}`}
                                >
                                  {lp.estado}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          </details>
        </div>
      )}

      {/* Section: Historial de Transacciones y Comprobantes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="px-6 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-[#fd761a]" />
            <h3 className="text-sm font-bold text-slate-900">Historial de Transacciones y Comprobantes</h3>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (data.matriculas?.[0]?.id) {
                  const m = data.matriculas[0]
                  const params = new URLSearchParams({
                    curso: m.curso.nombre,
                    nombre: data?.estudiante?.nombre_completo || "",
                    cedula: data?.estudiante?.cedula || "",
                  })
                  navigate(`/estudiantes/${estudianteId}/academico/registrar-pago/${m.id}?${params.toString()}`)
                } else {
                  toast.info("Seleccione una matrícula para registrar un pago")
                }
              }}
              className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="size-3.5 text-[#fd761a]" />
              <span>+ Registrar pago manual</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Fecha</th>
                <th className="py-3 px-4">Concepto</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Comprobante</th>
                <th className="py-3 px-4">Verificación</th>
                {isAdmin && <th className="py-3 px-6 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transaccionesMostradas.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {new Date(t.fecha_pago + "T00:00:00").toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-800 text-xs">
                    <div>{t.concepto}</div>
                    {t.count > 1 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Agrupa {t.count} pagos combinados
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-right text-emerald-700 text-xs whitespace-nowrap">
                    ${t.monto.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-700 whitespace-nowrap">
                    {metodoLabels[t.metodo_pago] || t.metodo_pago}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {t.comprobante_url ? (
                      <button
                        type="button"
                        onClick={() => setImagenExpandida(getStorageUrl(t.comprobante_url))}
                        className="text-[#fd761a] hover:underline font-mono text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="size-3.5" />
                        <span>Ver archivo</span>
                      </button>
                    ) : (
                      <span className="text-slate-300 text-xs font-mono">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${verifBadgeClass(
                        t.estado_verificacion
                      )}`}
                    >
                      {t.estado_verificacion === "aprobado" && <CheckCircle2 className="size-3" />}
                      {t.estado_verificacion}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.comprobante_url && (
                          <a
                            href={getStorageUrl(t.comprobante_url)}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Descargar comprobante"
                          >
                            <Download className="size-4" />
                          </a>
                        )}
                        {t.estado_verificacion === "aprobado" && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditMetodo(t.metodo_pago)
                              setEditFile(null)
                              if (t.count > 1) {
                                const m: Record<string, string> = {}
                                t.ids.forEach((id) => {
                                  const original = data.transacciones.find((tr) => tr.id === id)
                                  if (original) {
                                    m[id] = String(original.monto)
                                  }
                                })
                                setEditMontosValues(m)
                                setEditModal({
                                  isGroup: true,
                                  id: t.id,
                                  ids: t.ids,
                                  monto: t.monto,
                                  metodo: t.metodo_pago,
                                })
                              } else {
                                setEditModal({
                                  isGroup: false,
                                  id: t.id,
                                  ids: [t.id],
                                  monto: t.monto,
                                  metodo: t.metodo_pago,
                                })
                                setEditMonto(String(t.monto))
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Editar pago"
                          >
                            <Edit2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {groupedTransacciones.length > 10 && !showFullHistorial && (
          <div className="p-3 text-center border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowFullHistorial(true)}
              className="text-xs font-bold text-[#fd761a] hover:underline cursor-pointer"
            >
              Ver historial completo ({groupedTransacciones.length} pagos)
            </button>
          </div>
        )}
      </div>

      {/* Edit Payment Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 z-10 border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Editar Transacción de Pago</h3>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {editModal.isGroup ? (
                <div className="space-y-3">
                  {editModal.ids.map((txId, i) => {
                    const original = data?.transacciones?.find((tr) => tr.id === txId)
                    let lineaNombre = `Línea de pago ${i + 1}`

                    if (original && original.linea_pago_modulo_id && data?.matriculas) {
                      for (const m of data.matriculas) {
                        const lp = m.lineas_pago?.find((l) => l.id === original.linea_pago_modulo_id)
                        if (lp) {
                          lineaNombre =
                            lp.modulo?.nombre ||
                            (lp.tipo === "inscripcion" ? "Inscripción / Matrícula" : "Módulo")
                          break
                        }
                      }
                    } else if (original && original.concepto) {
                      const partes = original.concepto.split(" - ")
                      if (partes.length > 1) {
                        lineaNombre = partes[partes.length - 1].trim()
                      } else {
                        lineaNombre = original.concepto
                      }
                    }

                    return (
                      <div
                        key={txId}
                        className="p-3 border rounded-xl bg-slate-50 border-slate-200/80"
                      >
                        <div className="text-xs font-bold text-slate-800 mb-2">
                          {lineaNombre} {original ? `(Original: $${original.monto.toFixed(2)})` : ""}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            Monto asignado
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">
                              $
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={editMontosValues[txId] || ""}
                              onChange={(e) =>
                                setEditMontosValues((prev) => ({ ...prev, [txId]: e.target.value }))
                              }
                              className="w-full pl-7 pr-3 py-1.5 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-[#fd761a]/20 border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Monto
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">
                      $
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editMonto}
                      onChange={(e) => setEditMonto(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-[#fd761a]/20 border-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Método de Pago Global
                  </label>
                  <select
                    value={editMetodo}
                    onChange={(e) => setEditMetodo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white border-slate-200"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="deposito">Depósito</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Nuevo Comprobante (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#fd761a] hover:file:bg-orange-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full preview overlay for receipts */}
      {imagenExpandida && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setImagenExpandida(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setImagenExpandida(null)
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
          <img
            src={imagenExpandida}
            alt="Comprobante de pago ampliado"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
