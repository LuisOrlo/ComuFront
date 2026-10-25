/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Coins02Icon,
  PencilEdit01Icon,
  SentIcon,
  CreditCardIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons"
import { Loader2, Camera, Info } from "lucide-react"
import { getStorageUrl } from "@/lib/utils"
import { toast } from "sonner"
import { financeService } from "@/services/finance.service"
import { ModuloPagoMixtoModal } from "@/components/finanzas/ModuloPagoMixtoModal"
import type { MetodoPagoItem } from "@/components/finanzas/MetodosPagoSplitInput"

export interface ModalEditarPagoDetalleProps {
  open: boolean
  onClose: () => void
  data: any
  onSuccess: () => void
}

const METODO_OPCIONES = [
  { value: "transferencia", label: "Transferencia", icon: SentIcon },
  { value: "efectivo", label: "Efectivo", icon: Coins02Icon },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCardIcon },
  { value: "deposito", label: "Depósito", icon: Wallet02Icon },
  { value: "otro", label: "Otro", icon: Coins02Icon },
]

const round2 = (n: number) => Math.round(n * 100) / 100

export function ModalEditarPagoDetalle({
  open,
  onClose,
  data,
  onSuccess,
}: ModalEditarPagoDetalleProps) {
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determinar si es un pago académico/módulos o pago directo de taller/servicio
  const isCoursePayment = useMemo(() => {
    return Boolean(
      data?.linea_pago_modulo ||
      (Array.isArray(data?.detalle_conceptos) && data.detalle_conceptos.length > 0) ||
      (Array.isArray(data?.modulos) && data.modulos.length > 0) ||
      (Array.isArray(data?.lineas_matricula) && data.lineas_matricula.length > 0)
    )
  }, [data])

  // Lista de conceptos si es pago de curso (deduplicada por linea_id)
  const conceptos = useMemo(() => {
    if (!isCoursePayment) return []
    const rawList: any[] = []
    if (Array.isArray(data?.detalle_conceptos) && data.detalle_conceptos.length > 0) {
      rawList.push(...data.detalle_conceptos)
    } else if (Array.isArray(data?.modulos) && data.modulos.length > 0) {
      rawList.push(...data.modulos)
    } else if (data?.linea_pago_modulo) {
      rawList.push({
        linea_id: data.linea_pago_modulo.id,
        nombre: data.modulo_nombre || data.linea_pago_modulo.modulo?.nombre_modulo || "Módulo",
        monto: data.monto,
        monto_ajustado: data.linea_pago_modulo.monto_ajustado ?? data.monto,
        motivo_ajuste: data.linea_pago_modulo.motivo_ajuste || "",
        metodo_pago: data.metodo_pago,
      })
    }

    // Deduplicar por linea_id para que cada módulo aparezca solo una vez con su monto total acumulado
    const map = new Map<string, any>()
    rawList.forEach((c, idx) => {
      const key = c.linea_id || `concepto-${idx}`
      if (map.has(key)) {
        const existing = map.get(key)
        existing.monto = round2((existing.monto || 0) + (c.monto || 0))
        if (Array.isArray(c.metodos) && c.metodos.length > 0) {
          existing.metodos = [...(existing.metodos || []), ...c.metodos]
        }
      } else {
        map.set(key, { ...c })
      }
    })

    return Array.from(map.values())
  }, [isCoursePayment, data])

  // Estados para Course Payment
  const [precios, setPrecios] = useState<Record<string, string>>({})
  const [motivos, setMotivos] = useState<Record<string, string>>({})
  const [abonos, setAbonos] = useState<Record<string, string>>({})
  const [metodosSimples, setMetodosSimples] = useState<Record<string, string>>({})
  const [desglosesMixtos, setDesglosesMixtos] = useState<Record<string, MetodoPagoItem[]>>({})
  const [expandedAjuste, setExpandedAjuste] = useState<Record<string, boolean>>({})

  // Estados comunes / Direct Payment
  const [montoDirecto, setMontoDirecto] = useState<string>("")
  const [metodoDirecto, setMetodoDirecto] = useState<string>("transferencia")
  const [referenciaPago, setReferenciaPago] = useState<string>("")
  const [fechaPago, setFechaPago] = useState<string>("")
  const [observaciones, setObservaciones] = useState<string>("")
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)

  // Control de modal mixto
  const [modalMixtoLineaId, setModalMixtoLineaId] = useState<string | null>(null)

  // Carga inicial al abrir el modal
  useEffect(() => {
    if (!open || !data) return

    setReferenciaPago(data.referencia_pago || "")
    setObservaciones(data.observaciones || "")
    setComprobanteFile(null)
    setComprobantePreview(null)

    if (data.fecha_pago) {
      const d = data.fecha_pago.split(" ")[0]
      setFechaPago(d)
    } else {
      setFechaPago(new Date().toISOString().split("T")[0])
    }

    if (isCoursePayment) {
      const initPrecios: Record<string, string> = {}
      const initMotivos: Record<string, string> = {}
      const initAbonos: Record<string, string> = {}
      const initMetodosSimples: Record<string, string> = {}
      const initDesgloses: Record<string, MetodoPagoItem[]> = {}

      conceptos.forEach((c: any, idx: number) => {
        const id = c.linea_id || `concepto-${idx}`
        initPrecios[id] = String(c.monto_ajustado ?? c.monto ?? 0)
        initMotivos[id] = c.motivo_ajuste || ""
        initAbonos[id] = String(c.monto ?? 0)

        // Si el concepto tiene sus propios métodos explícitos (ej. pago mixto en este concepto)
        if (Array.isArray(c.metodos) && c.metodos.length >= 2) {
          initDesgloses[id] = c.metodos.map((m: any, i: number) => ({
            id: m.id || `m-${i}`,
            metodo_pago: m.metodo_pago || "transferencia",
            monto: String(m.monto || 0),
            referencia_pago: m.referencia_pago || "",
            comprobante_url: m.comprobante_url || null,
          }))
          initMetodosSimples[id] = "transferencia"
        } else {
          const primMetodo = (Array.isArray(c.metodos) && c.metodos[0]?.metodo_pago)
            || c.metodo_pago
            || data.metodo_pago
            || "transferencia"
          initMetodosSimples[id] = primMetodo === "mixto" ? "transferencia" : primMetodo
        }
      })

      setPrecios(initPrecios)
      setMotivos(initMotivos)
      setAbonos(initAbonos)
      setMetodosSimples(initMetodosSimples)
      setDesglosesMixtos(initDesgloses)
    } else {
      setMontoDirecto(String(data.monto || 0))
      setMetodoDirecto(data.metodo_pago || "transferencia")
    }
  }, [open, data, isCoursePayment, conceptos])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen (JPG, PNG, WEBP)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5 MB")
      return
    }
    setComprobanteFile(file)
    setComprobantePreview(URL.createObjectURL(file))
  }

  // Total calculado en tiempo real para cursos
  const totalCalculado = useMemo(() => {
    if (!isCoursePayment) return parseFloat(montoDirecto) || 0
    return Object.values(abonos).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  }, [isCoursePayment, abonos, montoDirecto])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data?.id) return

    setSaving(true)
    try {
      let uploadedUrl = data.comprobante_url

      // Si seleccionó un nuevo comprobante, subirlo primero
      if (comprobanteFile) {
        const fd = new FormData()
        fd.append("archivo", comprobanteFile)
        const uploadRes = await financeService.uploadComprobantePago(fd)
        uploadedUrl = uploadRes?.data?.url || uploadRes?.url || uploadedUrl
      }

      if (isCoursePayment) {
        const payloadConceptos = conceptos.map((c: any, idx: number) => {
          const id = c.linea_id || `concepto-${idx}`
          const precioNum = Math.max(0, parseFloat(precios[id] || "0") || 0)
          const abonoNum = Math.max(0, parseFloat(abonos[id] || "0") || 0)
          const motivo = motivos[id] || ""
          const desglose = desglosesMixtos[id]

          const base: any = {
            linea_id: c.linea_id,
            monto_ajustado: precioNum,
            monto_abonado: abonoNum,
            motivo_ajuste: motivo,
          }

          if (desglose && desglose.length >= 2) {
            base.metodos = desglose.map((m) => ({
              metodo_pago: m.metodo_pago,
              monto: Math.max(0, parseFloat(m.monto || "0") || 0),
              referencia_pago: m.referencia_pago || referenciaPago,
              comprobante_url: m.comprobante_url || uploadedUrl,
            }))
          } else {
            base.metodos = [
              {
                metodo_pago: metodosSimples[id] || "transferencia",
                monto: abonoNum,
                referencia_pago: referenciaPago,
                comprobante_url: uploadedUrl,
              },
            ]
          }
          return base
        })

        await financeService.updateTransaccion(data.id, {
          conceptos: payloadConceptos,
          referencia_pago: referenciaPago,
          fecha_pago: fechaPago,
          observaciones,
          comprobante_url: uploadedUrl,
        })
      } else {
        const montoNum = Math.max(0, parseFloat(montoDirecto) || 0)
        await financeService.updateTransaccion(data.id, {
          monto: montoNum,
          metodo_pago: metodoDirecto,
          referencia_pago: referenciaPago,
          fecha_pago: fechaPago,
          observaciones,
          comprobante_url: uploadedUrl,
        })
      }

      toast.success("Pago y liquidación actualizados correctamente")
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.mensaje || err?.message || "Error al actualizar la transacción")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={PencilEdit01Icon} size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Editar Transacción #{data?.recibo_codigo || data?.id?.slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500">
                  {isCoursePayment
                    ? "Ajusta precios, abonos o define pagos mixtos por concepto sin restricciones."
                    : "Modifica los datos del pago registrado en el sistema contable."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form id="editTransaccionForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Banner de libertad de edición */}
            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/60 flex items-start gap-2.5 text-xs text-slate-700">
              <Info className="w-4 h-4 text-[#fd761a] shrink-0 mt-0.5" />
              <p>
                Puedes ajustar libremente cualquier valor registrado. Si aplicas un descuento del 100%, el precio se establecerá en $0.00 y se registrará como exonerado/cubierto sin bloquear la liquidación.
              </p>
            </div>

            {/* SECCIÓN A: SI ES PAGO DE CURSO (POR CONCEPTOS) */}
            {isCoursePayment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Conceptos Cubiertos ({conceptos.length})
                  </span>
                  <span className="text-xs font-semibold text-[#fd761a]">
                    Total a registrar: ${totalCalculado.toFixed(2)} USD
                  </span>
                </div>

                <div className="space-y-4">
                  {conceptos.map((c: any, idx: number) => {
                    const id = c.linea_id || `concepto-${idx}`
                    const isExpanded = expandedAjuste[id]
                    const precioVal = parseFloat(precios[id] || "0") || 0
                    const abonoVal = parseFloat(abonos[id] || "0") || 0
                    const saldoResultante = Math.max(0, precioVal - abonoVal)
                    const desglose = desglosesMixtos[id]
                    const esMixtoConfigurado = Array.isArray(desglose) && desglose.length >= 2

                    return (
                      <div
                        key={id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all space-y-3"
                      >
                        {/* Concept Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="size-2 rounded-full bg-[#fd761a]" />
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {c.nombre || c.modulo_nombre || `Concepto #${idx + 1}`}
                            </h4>
                            {esMixtoConfigurado && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                Pago Mixto ({desglose.length} métodos)
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-slate-500">
                              Saldo resultante:{" "}
                              <strong className={saldoResultante === 0 ? "text-emerald-600" : "text-amber-600"}>
                                ${saldoResultante.toFixed(2)}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Price and Paid Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Precio a cobrar
                              </label>
                              <button
                                type="button"
                                onClick={() => setExpandedAjuste((prev) => ({ ...prev, [id]: !prev[id] }))}
                                className="text-[11px] font-semibold text-[#fd761a] hover:underline cursor-pointer"
                              >
                                {isExpanded ? "Ocultar motivo" : "Motivo de ajuste"}
                              </button>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={precios[id] ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const num = Math.max(0, parseFloat(val) || 0)
                                  setPrecios((prev) => ({ ...prev, [id]: val }))
                                  // Si el precio baja y el abono excede el nuevo precio, sincronizar
                                  if (abonoVal > num) {
                                    setAbonos((prev) => ({ ...prev, [id]: String(num) }))
                                  }
                                }}
                                className="w-full pl-7 pr-3 py-2 bg-slate-50 rounded-xl text-slate-900 font-bold text-xs outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Monto pagado / abonado
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={abonos[id] ?? ""}
                                onChange={(e) => setAbonos((prev) => ({ ...prev, [id]: e.target.value }))}
                                className="w-full pl-7 pr-3 py-2 bg-slate-50 rounded-xl text-slate-900 font-bold text-xs outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Motivo de Ajuste Expandible */}
                        {isExpanded && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 animate-in fade-in duration-100">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Motivo del descuento o ajuste de precio:
                            </label>
                            <input
                              type="text"
                              value={motivos[id] ?? ""}
                              onChange={(e) => setMotivos((prev) => ({ ...prev, [id]: e.target.value }))}
                              placeholder="Ej. Beca del 50%, exoneración institucional, convenio..."
                              className="w-full px-2.5 py-1.5 bg-white rounded-lg text-slate-800 text-xs border border-slate-200 focus:border-[#fd761a] outline-none"
                            />
                          </div>
                        )}

                        {/* Métodos de Pago por Concepto */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            {esMixtoConfigurado ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-slate-600">Forma de pago:</span>
                                {desglose.map((m, mIdx) => (
                                  <span
                                    key={m.id || `metodo-${id}-${mIdx}`}
                                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    <strong className="capitalize">{m.metodo_pago}</strong>: ${Number(m.monto).toFixed(2)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600 shrink-0">Forma de pago:</span>
                                <select
                                  value={metodosSimples[id] || "transferencia"}
                                  onChange={(e) => setMetodosSimples((prev) => ({ ...prev, [id]: e.target.value }))}
                                  className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs font-bold text-slate-800 border border-slate-200 focus:bg-white focus:border-[#fd761a] outline-none capitalize cursor-pointer"
                                >
                                  {METODO_OPCIONES.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="capitalize">
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {esMixtoConfigurado ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setModalMixtoLineaId(id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                                >
                                  Editar mixto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDesglosesMixtos((prev) => {
                                      const n = { ...prev }
                                      delete n[id]
                                      return n
                                    })
                                  }}
                                  className="px-2 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                  title="Quitar pago mixto y volver a método único"
                                >
                                  Quitar mixto
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setModalMixtoLineaId(id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-[#fd761a] hover:border-orange-200 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <HugeiconsIcon icon={Coins02Icon} size={14} />
                                <span>Dividir en Pago Mixto</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* SECCIÓN B: PAGO DIRECTO DE TALLER / SERVICIO */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Monto a cobrar / abonar
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={montoDirecto}
                        onChange={(e) => setMontoDirecto(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 rounded-xl text-slate-900 font-bold text-sm outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Método de pago
                    </label>
                    <select
                      value={metodoDirecto}
                      onChange={(e) => setMetodoDirecto(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-slate-900 font-bold text-sm outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all capitalize cursor-pointer"
                    >
                      {METODO_OPCIONES.map((opt) => (
                        <option key={opt.value} value={opt.value} className="capitalize">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN COMÚN: Referencia, Fecha, Comprobante y Observaciones */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Información del Comprobante y Auditoría
              </span>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Fecha declarada del pago
                </label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full sm:w-1/2 px-3.5 py-2 bg-slate-50 rounded-xl text-slate-900 font-medium text-xs border border-slate-200 focus:bg-white focus:border-[#fd761a] outline-none"
                />
              </div>

              {/* Comprobante fotográfico adjunto */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Foto o captura del comprobante
                </label>
                <div className="flex items-center gap-3">
                  {(comprobantePreview || data?.comprobante_url) && (
                    <div className="relative size-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-2xs">
                      <img
                        src={comprobantePreview || getStorageUrl(data?.comprobante_url)}
                        alt="Comprobante"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>{comprobanteFile ? "Cambiar foto elegida" : "Reemplazar comprobante digital"}</span>
                    </button>
                    {comprobanteFile && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1 truncate">
                        Archivo seleccionado: {comprobanteFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Observaciones internas
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles de la corrección o motivo del ajuste contable..."
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-slate-900 text-xs font-medium border border-slate-200 focus:bg-white focus:border-[#fd761a] outline-none resize-none"
                />
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              Total liquidado: <strong className="text-slate-900 text-sm font-bold">${totalCalculado.toFixed(2)} USD</strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="editTransaccionForm"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#fd761a] hover:bg-[#e06512] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                    <span>Guardar y actualizar liquidación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Secundario: Pago Mixto por Concepto */}
      {modalMixtoLineaId && (
        <ModuloPagoMixtoModal
          open={Boolean(modalMixtoLineaId)}
          onClose={() => setModalMixtoLineaId(null)}
          conceptoNombre={
            conceptos.find((c: any) => (c.linea_id || `concepto-0`) === modalMixtoLineaId)?.nombre || "Concepto"
          }
          montoObjetivo={Math.max(0, parseFloat(abonos[modalMixtoLineaId] || "0") || 0)}
          metodosIniciales={
            desglosesMixtos[modalMixtoLineaId] && desglosesMixtos[modalMixtoLineaId].length >= 2
              ? desglosesMixtos[modalMixtoLineaId]
              : undefined
          }
          onSave={(nuevosMetodos) => {
            setDesglosesMixtos((prev) => ({
              ...prev,
              [modalMixtoLineaId]: nuevosMetodos,
            }))
            // Sincronizar monto abonado con la suma exacta
            const totalSuma = nuevosMetodos.reduce((sum, m) => sum + (parseFloat(m.monto || "0") || 0), 0)
            setAbonos((prev) => ({
              ...prev,
              [modalMixtoLineaId]: totalSuma.toFixed(2),
            }))
            setModalMixtoLineaId(null)
          }}
          onRemove={() => {
            setDesglosesMixtos((prev) => {
              const n = { ...prev }
              delete n[modalMixtoLineaId]
              return n
            })
            setModalMixtoLineaId(null)
          }}
        />
      )}
    </>
  )
}
