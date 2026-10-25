/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Coins02Icon,
  PencilEdit01Icon,
  Delete02Icon,
  Alert02Icon,
  SentIcon,
  CreditCardIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { cursosService } from "@/services/cursos.service"
import { ModuloPagoMixtoModal } from "@/components/finanzas/ModuloPagoMixtoModal"
import type { MetodoPagoItem } from "@/components/finanzas/MetodosPagoSplitInput"

export interface ModalEditarPagoMatriculaProps {
  open: boolean
  onClose: () => void
  solicitudId: string
  selected: any
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

export function ModalEditarPagoMatricula({
  open,
  onClose,
  solicitudId,
  selected,
  onSuccess,
}: ModalEditarPagoMatriculaProps) {
  const [saving, setSaving] = useState(false)
  const [precios, setPrecios] = useState<Record<string, string>>({})
  const [motivos, setMotivos] = useState<Record<string, string>>({})
  const [abonos, setAbonos] = useState<Record<string, string>>({})
  const [metodosSimples, setMetodosSimples] = useState<Record<string, string>>({})
  const [desglosesMixtos, setDesglosesMixtos] = useState<Record<string, MetodoPagoItem[]>>({})
  const [expandedAjuste, setExpandedAjuste] = useState<Record<string, boolean>>({})

  // Control del modal secundario de pago mixto por módulo
  const [modalMixtoLineaId, setModalMixtoLineaId] = useState<string | null>(null)

  // Obtener todas las líneas (módulos + inscripción si existe)
  const lineas = useMemo(() => {
    const list: any[] = []
    if (selected?.lineas_pago?.modulos) {
      list.push(...selected.lineas_pago.modulos)
    }
    if (selected?.lineas_pago?.inscripcion) {
      list.push(selected.lineas_pago.inscripcion)
    }
    return list
  }, [selected])

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (!open || !lineas.length) return

    const initialPrecios: Record<string, string> = {}
    const initialMotivos: Record<string, string> = {}
    const initialAbonos: Record<string, string> = {}
    const initialMetodosSimples: Record<string, string> = {}
    const initialDesgloses: Record<string, MetodoPagoItem[]> = {}

    lineas.forEach((lp) => {
      initialPrecios[lp.id] = String(lp.monto_ajustado ?? lp.monto_original ?? 0)
      initialMotivos[lp.id] = lp.motivo_ajuste || ""
      initialAbonos[lp.id] = String(lp.monto_abonado ?? 0)

      const txs: any[] = lp.metodos || []
      if (txs.length >= 2) {
        initialDesgloses[lp.id] = txs.map((t, idx) => ({
          id: t.id || `tx-${lp.id}-${idx}`,
          metodo_pago: METODO_OPCIONES.some((m) => m.value === t.metodo_pago) ? t.metodo_pago : "transferencia",
          monto: Number(t.monto).toFixed(2),
          comprobante_url: t.comprobante_url || null,
          referencia_pago: t.referencia_pago || "",
        }))
        initialMetodosSimples[lp.id] = METODO_OPCIONES.some((m) => m.value === txs[0]?.metodo_pago)
          ? txs[0].metodo_pago
          : "transferencia"
      } else if (txs.length === 1) {
        initialMetodosSimples[lp.id] = METODO_OPCIONES.some((m) => m.value === txs[0]?.metodo_pago)
          ? txs[0].metodo_pago
          : "transferencia"
      } else {
        const rawTipo = (selected?.pago?.comprobante?.tipo || "").toLowerCase()
        initialMetodosSimples[lp.id] = METODO_OPCIONES.some((m) => m.value === rawTipo) ? rawTipo : "transferencia"
      }
    })

    setPrecios(initialPrecios)
    setMotivos(initialMotivos)
    setAbonos(initialAbonos)
    setMetodosSimples(initialMetodosSimples)
    setDesglosesMixtos(initialDesgloses)
    setExpandedAjuste({})
  }, [open, lineas, selected])

  if (!open) return null

  // Cálculos en vivo
  const totalPrecioCalculado = lineas.reduce((acc, lp) => {
    const p = parseFloat(precios[lp.id] ?? String(lp.monto_ajustado ?? 0)) || 0
    return acc + p
  }, 0)

  const totalAbonadoCalculado = lineas.reduce((acc, lp) => {
    const a = parseFloat(abonos[lp.id] ?? String(lp.monto_abonado ?? 0)) || 0
    return acc + a
  }, 0)

  const saldoCalculado = Math.max(0, totalPrecioCalculado - totalAbonadoCalculado)

  // Cambios pendientes respecto a lo guardado en base de datos
  const hayCambios = lineas.some((lp) => {
    const pOrig = Number(lp.monto_ajustado ?? 0)
    const aOrig = Number(lp.monto_abonado ?? 0)
    const pCur = parseFloat(precios[lp.id] ?? String(pOrig)) || 0
    const aCur = parseFloat(abonos[lp.id] ?? String(aOrig)) || 0
    const mOrig = lp.motivo_ajuste || ""
    const mCur = motivos[lp.id] || ""
    const tieneMixto = (desglosesMixtos[lp.id]?.length || 0) >= 2
    const teniaMixto = (lp.metodos?.length || 0) >= 2

    return (
      Math.abs(pOrig - pCur) > 0.001 ||
      Math.abs(aOrig - aCur) > 0.001 ||
      mOrig !== mCur ||
      tieneMixto !== teniaMixto
    )
  })

  // Validación de exceso de abono sobre precio
  const lineaExcedida = lineas.find((lp) => {
    const p = parseFloat(precios[lp.id] ?? String(lp.monto_ajustado ?? 0)) || 0
    const a = parseFloat(abonos[lp.id] ?? String(lp.monto_abonado ?? 0)) || 0
    return a > p
  })

  // Guardar corrección
  const handleGuardar = async () => {
    if (lineaExcedida) {
      toast.error(
        `El monto abonado en "${lineaExcedida.modulo_nombre}" no puede superar su precio ($${parseFloat(
          precios[lineaExcedida.id] || "0"
        ).toFixed(2)})`
      )
      return
    }

    // Validar que los pagos mixtos configurados cuadren exactamente con el monto pagado
    const lineaDesbalanceada = lineas.find((lp) => {
      const d = desglosesMixtos[lp.id]
      if (!d || d.length < 2) return false
      const a = parseFloat(abonos[lp.id] ?? String(lp.monto_abonado ?? 0)) || 0
      const suma = d.reduce((acc, m) => acc + (parseFloat(m.monto || "0") || 0), 0)
      return Math.abs(suma - a) > 0.009
    })

    if (lineaDesbalanceada) {
      const d = desglosesMixtos[lineaDesbalanceada.id]
      const suma = d.reduce((acc, m) => acc + (parseFloat(m.monto || "0") || 0), 0)
      const a = parseFloat(abonos[lineaDesbalanceada.id] || "0")
      toast.error(
        `El pago mixto en "${lineaDesbalanceada.modulo_nombre}" suma $${suma.toFixed(2)} pero el monto pagado es $${a.toFixed(2)}. Abre "Editar mixto" para nivelar montos o haz clic en "Quitar mixto".`
      )
      return
    }

    setSaving(true)
    try {
      // Subir archivos de comprobantes si se agregaron nuevos
      const desglosesActualizados: Record<string, MetodoPagoItem[]> = { ...desglosesMixtos }
      for (const lineaId of Object.keys(desglosesActualizados)) {
        const items = desglosesActualizados[lineaId] || []
        const promesas = items.map(async (item) => {
          if (item.comprobante_file) {
            const res = await cursosService.uploadComprobante(item.comprobante_file)
            return { ...item, comprobante_url: res.url, comprobante_file: undefined }
          }
          return item
        })
        desglosesActualizados[lineaId] = await Promise.all(promesas)
      }

      // Preparar payload
      const lineasPayload = lineas.map((lp) => {
        const nuevoPrecio = parseFloat(precios[lp.id] ?? String(lp.monto_ajustado ?? 0)) || 0
        const nuevoAbono = parseFloat(abonos[lp.id] ?? String(lp.monto_abonado ?? 0)) || 0
        const nuevoMotivo = motivos[lp.id] !== undefined ? motivos[lp.id] : lp.motivo_ajuste
        const desglose = desglosesActualizados[lp.id]
        const esMixto = desglose && desglose.length >= 2

        const basePayload: any = {
          id: lp.id,
          monto_ajustado: nuevoPrecio,
          monto_abonado: nuevoAbono,
          motivo_ajuste: nuevoMotivo || null,
        }

        if (esMixto && nuevoAbono > 0) {
          basePayload.metodos = desglose.map((m) => ({
            metodo_pago: METODO_OPCIONES.some((o) => o.value === m.metodo_pago) ? m.metodo_pago : "transferencia",
            monto: parseFloat(m.monto) || 0,
            comprobante_url: m.comprobante_url || null,
            referencia_pago: m.id || null,
          }))
          // Sincronizar monto abonado de la línea con la suma exacta de sus métodos
          basePayload.monto_abonado = round2(
            basePayload.metodos.reduce((acc: number, item: any) => acc + item.monto, 0)
          )
        } else if (nuevoAbono > 0) {
          const mSimple = metodosSimples[lp.id]
          const metodoValido = METODO_OPCIONES.some((o) => o.value === mSimple) ? mSimple : "transferencia"
          basePayload.metodos = [
            {
              metodo_pago: metodoValido,
              monto: nuevoAbono,
              comprobante_url: selected?.pago?.comprobante?.url || null,
            },
          ]
        } else {
          basePayload.metodos = []
        }

        return basePayload
      })

      await cursosService.actualizarLineasPago(solicitudId, lineasPayload)
      toast.success("Liquidación y métodos de pago actualizados correctamente")
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.mensaje || "Error al actualizar los pagos de la matrícula")
    } finally {
      setSaving(false)
    }
  }

  const lineaMixtaActiva = lineas.find((l) => l.id === modalMixtoLineaId)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#fd761a]" />
                <h2 className="text-base font-bold text-slate-900">
                  Editar y Corregir Liquidación de Matrícula
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajusta precios, abonos o define pagos mixtos por concepto sin restricciones.
              </p>
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

          {/* Body Scrollable */}
          <div className="p-6 overflow-y-auto space-y-4">
            {lineas.map((lp) => {
              const precioOrig = Number(lp.monto_original ?? lp.monto_ajustado ?? 0)
              const precioVal = precios[lp.id] ?? String(lp.monto_ajustado ?? 0)
              const precioNum = parseFloat(precioVal) || 0
              const abonoVal = abonos[lp.id] ?? String(lp.monto_abonado ?? 0)
              const abonoNum = parseFloat(abonoVal) || 0
              const motivoVal = motivos[lp.id] ?? (lp.motivo_ajuste || "")
              const saldoItem = Math.max(0, precioNum - abonoNum)
              const excede = abonoNum > precioNum

              const desglose = desglosesMixtos[lp.id]
              const esMixto = desglose && desglose.length >= 2
              const metodoSimple = METODO_OPCIONES.some((o) => o.value === metodosSimples[lp.id])
                ? metodosSimples[lp.id]
                : "transferencia"
              const expandidoAjuste = Boolean(expandedAjuste[lp.id])
              const sumaDesglose = desglose
                ? desglose.reduce((acc, m) => acc + (parseFloat(m.monto || "0") || 0), 0)
                : 0
              const desgloseDesbalanceado = esMixto && Math.abs(sumaDesglose - abonoNum) > 0.009

              return (
                <div
                  key={lp.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all space-y-3",
                    excede
                      ? "border-rose-300 bg-rose-50/20"
                      : desgloseDesbalanceado
                      ? "border-amber-400 bg-amber-50/30 ring-1 ring-amber-300/60"
                      : esMixto
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-slate-200 bg-white"
                  )}
                >
                  {/* Fila Principal: Concepto, Precio y Abono */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {lp.modulo_nombre}
                        </span>
                        {lp.tipo === "inscripcion" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            Matrícula
                          </span>
                        )}
                        {esMixto && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Pago Mixto ({desglose.length} métodos)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>
                          Precio base: <strong>${precioOrig.toFixed(2)}</strong>
                        </span>
                        <span>·</span>
                        {precioNum === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                            100% Descuento (Exonerado · Saldo: $0.00)
                          </span>
                        ) : (
                          <span>
                            Saldo resultante:{" "}
                            <strong
                              className={cn(
                                saldoItem > 0 ? "text-amber-600" : "text-emerald-600"
                              )}
                            >
                              ${saldoItem.toFixed(2)}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controles de Precio y Abono */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {/* Precio */}
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Precio a cobrar
                        </span>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                            $
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={precioVal}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9.]/g, "")
                              if ((v.match(/\./g) || []).length <= 1) {
                                setPrecios((prev) => ({ ...prev, [lp.id]: v }))
                                if (parseFloat(v) === 0) {
                                  setAbonos((prev) => ({ ...prev, [lp.id]: "0" }))
                                }
                              }
                            }}
                            className="w-full pl-6 pr-2 py-1 text-right text-xs font-mono font-bold rounded-lg border border-slate-300 focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none"
                          />
                        </div>
                      </div>

                      {/* Monto abonado */}
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Monto pagado
                        </span>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                            $
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={abonoVal}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9.]/g, "")
                              if ((v.match(/\./g) || []).length <= 1) {
                                setAbonos((prev) => ({ ...prev, [lp.id]: v }))
                              }
                            }}
                            className={cn(
                              "w-full pl-6 pr-2 py-1 text-right text-xs font-mono font-bold rounded-lg border focus:ring-1 outline-none",
                              excede
                                ? "border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-rose-400"
                                : "border-slate-300 focus:border-[#fd761a] focus:ring-[#fd761a]"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel de Ajuste de Precio / Descuento si difiere del original */}
                  {(precioNum !== precioOrig || expandidoAjuste) && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium shrink-0">
                        Motivo del ajuste:
                      </span>
                      <input
                        type="text"
                        placeholder="Ej. Beca del 100%, Descuento promocional, exoneración..."
                        value={motivoVal}
                        onChange={(e) =>
                          setMotivos((prev) => ({ ...prev, [lp.id]: e.target.value }))
                        }
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none"
                      />
                    </div>
                  )}

                  {/* Indicación cuando el módulo está 100% exonerado o sin abono */}
                  {abonoNum === 0 && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 py-0.5">
                      {precioNum === 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                          Módulo 100% exonerado (no requiere pago). Se registrará cubierto al guardar.
                        </span>
                      ) : (
                        <span className="italic">
                          Sin abonos iniciales registrados para este módulo (Saldo pendiente completo: ${saldoItem.toFixed(2)}).
                        </span>
                      )}
                    </div>
                  )}

                  {/* Métodos de Pago para este módulo si hay monto pagado */}
                  {abonoNum > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-600">
                          Forma de pago:
                        </span>

                        {esMixto ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {desglose.map((dm, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-amber-300 text-slate-800 shadow-2xs"
                                >
                                  <span className="capitalize">{dm.metodo_pago}</span>: $
                                  {parseFloat(dm.monto || "0").toFixed(2)}
                                </span>
                              ))}
                            </div>
                            {desgloseDesbalanceado && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                                <HugeiconsIcon icon={Alert02Icon} size={12} className="text-amber-600 shrink-0" />
                                Desglose: ${sumaDesglose.toFixed(2)} ≠ Pagado: ${abonoNum.toFixed(2)} (Actualiza en "Editar mixto")
                              </span>
                            )}
                          </div>
                        ) : (
                          <select
                            value={metodoSimple}
                            onChange={(e) =>
                              setMetodosSimples((prev) => ({
                                ...prev,
                                [lp.id]: e.target.value,
                              }))
                            }
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none"
                          >
                            {METODO_OPCIONES.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Botones para configurar o quitar Pago Mixto en este módulo */}
                      <div className="flex items-center gap-2">
                        {esMixto ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setModalMixtoLineaId(lp.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                              <span>Editar mixto</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDesglosesMixtos((prev) => {
                                  const next = { ...prev }
                                  delete next[lp.id]
                                  return next
                                })
                                setMetodosSimples((prev) => ({
                                  ...prev,
                                  [lp.id]: prev[lp.id] && prev[lp.id] !== "mixto" ? prev[lp.id] : "transferencia",
                                }))
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Volver a un solo método"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={13} />
                              <span>Quitar mixto</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setModalMixtoLineaId(lp.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border border-dashed border-amber-400 text-amber-800 bg-amber-50/60 hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <HugeiconsIcon icon={Coins02Icon} size={13} />
                            <span>Dividir en Pago Mixto</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Alerta de exceso si se supera el precio */}
                  {excede && (
                    <div className="p-2 rounded-lg bg-rose-100/60 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <HugeiconsIcon icon={Alert02Icon} size={14} className="shrink-0" />
                      <span>
                        El abono (${abonoNum.toFixed(2)}) supera el precio del módulo ($
                        {precioNum.toFixed(2)}).
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer con Balance y Botones */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <span>
                Total Curso:{" "}
                <strong className="text-slate-900 font-mono">
                  ${totalPrecioCalculado.toFixed(2)}
                </strong>
              </span>
              <span>·</span>
              <span>
                Abonado:{" "}
                <strong className="text-emerald-700 font-mono">
                  ${totalAbonadoCalculado.toFixed(2)}
                </strong>
              </span>
              <span>·</span>
              <span>
                Saldo restante:{" "}
                <strong
                  className={cn(
                    "font-mono",
                    saldoCalculado > 0 ? "text-amber-600" : "text-emerald-600"
                  )}
                >
                  ${saldoCalculado.toFixed(2)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={saving || Boolean(lineaExcedida) || !hayCambios}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-all shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                <span>{saving ? "Guardando..." : "Guardar corrección"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Secundario para dividir el abono del módulo en pago mixto */}
      {lineaMixtaActiva && (
        <ModuloPagoMixtoModal
          open={Boolean(modalMixtoLineaId)}
          onClose={() => setModalMixtoLineaId(null)}
          conceptoNombre={lineaMixtaActiva.modulo_nombre}
          montoObjetivo={
            parseFloat(abonos[lineaMixtaActiva.id] ?? String(lineaMixtaActiva.monto_abonado ?? 0)) || 0
          }
          metodosIniciales={
            desglosesMixtos[lineaMixtaActiva.id] ||
            (lineaMixtaActiva.metodos && lineaMixtaActiva.metodos.length > 0
              ? lineaMixtaActiva.metodos.map((t: any, idx: number) => ({
                  id: t.id || `tx-${lineaMixtaActiva.id}-${idx}`,
                  metodo_pago: METODO_OPCIONES.some((m) => m.value === t.metodo_pago) ? t.metodo_pago : "transferencia",
                  monto: Number(t.monto).toFixed(2),
                  comprobante_url: t.comprobante_url || selected?.pago?.comprobante?.url || null,
                  referencia_pago: t.referencia_pago || "",
                }))
              : selected?.pago?.comprobante?.url
              ? [
                  {
                    id: `tx-${lineaMixtaActiva.id}-0`,
                    metodo_pago: metodosSimples[lineaMixtaActiva.id] || "transferencia",
                    monto: String(
                      parseFloat(abonos[lineaMixtaActiva.id] ?? String(lineaMixtaActiva.monto_abonado ?? 0)) || 0
                    ),
                    comprobante_url: selected.pago.comprobante.url,
                  },
                ]
              : undefined)
          }
          onSave={(metodosGuardados) => {
            setDesglosesMixtos((prev) => ({
              ...prev,
              [lineaMixtaActiva.id]: metodosGuardados,
            }))
            const suma = metodosGuardados.reduce(
              (acc, m) => acc + (parseFloat(m.monto || "0") || 0),
              0
            )
            setAbonos((prev) => ({
              ...prev,
              [lineaMixtaActiva.id]: suma.toFixed(2),
            }))
            if (metodosGuardados.length > 0 && metodosGuardados[0].metodo_pago) {
              const primer = metodosGuardados[0].metodo_pago
              setMetodosSimples((prev) => ({
                ...prev,
                [lineaMixtaActiva.id]: METODO_OPCIONES.some((m) => m.value === primer) ? primer : "transferencia",
              }))
            }
            setModalMixtoLineaId(null)
          }}
          onRemove={() => {
            setDesglosesMixtos((prev) => {
              const next = { ...prev }
              delete next[lineaMixtaActiva.id]
              return next
            })
            setMetodosSimples((prev) => ({
              ...prev,
              [lineaMixtaActiva.id]: "transferencia",
            }))
            setModalMixtoLineaId(null)
          }}
        />
      )}
    </>
  )
}
