/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react"
import {
  X,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ImageIcon,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { tallerService } from "@/services/taller.service"
import { AjustePrecioPanel } from "./AjustePrecioPanel"
import {
  MetodosPagoSplitInput,
  type MetodoPagoItem,
  type ModalidadComprobante,
} from "@/components/finanzas/MetodosPagoSplitInput"

export interface ModalEditarPagoTallerProps {
  open: boolean
  onClose: () => void
  inscripcionId: string
  selected: any
  onSuccess: () => void
}

export function ModalEditarPagoTaller({
  open,
  onClose,
  inscripcionId,
  selected,
  onSuccess,
}: ModalEditarPagoTallerProps) {
  const [saving, setSaving] = useState(false)
  const precioBase = Number(selected?.taller?.precio || 0)

  const [precioEfectivo, setPrecioEfectivo] = useState(
    Number(selected?.precio_ajustado ?? selected?.cuenta_por_cobrar?.monto_total ?? precioBase)
  )
  const [motivoAjuste, setMotivoAjuste] = useState(selected?.motivo_ajuste || "")
  const [ajusteExpandido, setAjusteExpandido] = useState(false)

  const [monto, setMonto] = useState(
    String(selected?.monto_pagado ?? selected?.cuenta_por_cobrar?.monto_abonado ?? 0)
  )
  const [modalidadComprobante, setModalidadComprobante] = useState<ModalidadComprobante>("unico")
  const [comprobanteUnicoUrl, setComprobanteUnicoUrl] = useState<string | null>(
    selected?.comprobante_url || null
  )
  const [uploadingUnico, setUploadingUnico] = useState(false)
  const comprobanteUnicoRef = useRef<HTMLInputElement>(null)

  const [metodos, setMetodos] = useState<MetodoPagoItem[]>([])

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (!open) return

    const base = Number(selected?.taller?.precio || 0)
    const precioActual = Number(selected?.precio_ajustado ?? selected?.cuenta_por_cobrar?.monto_total ?? base)
    const abonadoActual = Number(selected?.monto_pagado ?? selected?.cuenta_por_cobrar?.monto_abonado ?? 0)

    setPrecioEfectivo(precioActual)
    setMotivoAjuste(selected?.motivo_ajuste || "")
    setAjusteExpandido(false)
    setMonto(String(abonadoActual))
    setComprobanteUnicoUrl(selected?.comprobante_url || null)

    const txs: any[] =
      selected?.cuenta_por_cobrar?.transacciones ||
      selected?.cuentaPorCobrar?.transacciones ||
      []

    if (txs.length > 0) {
      setMetodos(
        txs.map((t, idx) => ({
          id: t.id || `tx-taller-${idx}`,
          metodo_pago: (["transferencia", "efectivo", "tarjeta", "deposito", "otro"].includes(t.metodo_pago)
            ? t.metodo_pago
            : "transferencia") as MetodoPagoItem["metodo_pago"],
          monto: String(t.monto ?? 0),
          referencia_pago: t.referencia_pago || "",
          comprobante_url: t.comprobante_url || null,
        }))
      )
    } else {
      const rawMetodo = (selected?.metodo_pago || "efectivo").toLowerCase()
      const mVal = ["transferencia", "efectivo", "tarjeta", "deposito", "otro"].includes(rawMetodo)
        ? rawMetodo
        : "efectivo"

      setMetodos([
        {
          id: "taller-pago-1",
          metodo_pago: mVal as MetodoPagoItem["metodo_pago"],
          monto: String(abonadoActual),
          referencia_pago: selected?.referencia_pago || "",
          comprobante_url: selected?.comprobante_url || null,
        },
      ])
    }
  }, [open, selected])

  if (!open) return null

  const montoNum = parseFloat(monto) || 0
  const esCompleto = montoNum >= precioEfectivo && precioEfectivo > 0

  const handleMontoChange = (val: string) => {
    const numVal = parseFloat(val) || 0
    if (numVal > precioEfectivo && precioEfectivo >= 0) {
      setMonto(String(precioEfectivo))
      if (metodos.length === 1) {
        setMetodos([{ ...metodos[0], monto: String(precioEfectivo) }])
      }
      toast.warning(`El monto no puede exceder el precio del taller ($${precioEfectivo.toFixed(2)}).`)
      return
    }
    setMonto(val)
    if (metodos.length === 1) {
      setMetodos([{ ...metodos[0], monto: val }])
    }
  }

  const handleUploadComprobanteUnico = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingUnico(true)
    try {
      const res = await tallerService.uploadComprobante(file)
      setComprobanteUnicoUrl(res.url)
      toast.success("Comprobante subido")
    } catch {
      toast.error("Error al subir comprobante")
    } finally {
      setUploadingUnico(false)
    }
  }

  const handleGuardar = async () => {
    if (montoNum > precioEfectivo) {
      toast.error(`El monto abonado ($${montoNum.toFixed(2)}) no puede exceder el precio ($${precioEfectivo.toFixed(2)}).`)
      return
    }

    if (precioEfectivo !== precioBase && !motivoAjuste.trim()) {
      toast.error("Debes indicar un motivo para el ajuste de precio.")
      setAjusteExpandido(true)
      return
    }

    const metodosSumCentavos = metodos.reduce(
      (sum, m) => sum + Math.round((parseFloat(m.monto) || 0) * 100),
      0
    )
    const totalEsperadoCentavos = Math.round(montoNum * 100)

    if (montoNum > 0 && metodosSumCentavos !== totalEsperadoCentavos) {
      toast.error(
        `La suma de los métodos de pago ($${(metodosSumCentavos / 100).toFixed(2)}) debe coincidir con el monto a cobrar ($${montoNum.toFixed(2)}).`
      )
      return
    }

    setSaving(true)
    try {
      // Subir archivos de comprobantes adjuntos en métodos individuales si existen
      const metodosActualizados = await Promise.all(
        metodos.map(async (m) => {
          if (m.comprobante_file) {
            const res = await tallerService.uploadComprobante(m.comprobante_file)
            return { ...m, comprobante_url: res.url, comprobante_file: undefined }
          }
          return m
        })
      )

      const payload = {
        monto_pagado: montoNum,
        precio_ajustado: precioEfectivo,
        motivo_ajuste: motivoAjuste || undefined,
        tipo_pago: esCompleto ? "completo" : "abono",
        metodo_pago: metodosActualizados[0]?.metodo_pago || "efectivo",
        metodos_pago:
          montoNum > 0
            ? metodosActualizados.map((m) => ({
                metodo_pago: m.metodo_pago,
                monto: parseFloat(m.monto) || 0,
                referencia_pago: m.referencia_pago || undefined,
                comprobante_url:
                  modalidadComprobante === "unico"
                    ? comprobanteUnicoUrl || undefined
                    : m.comprobante_url || undefined,
              }))
            : [],
      }

      await tallerService.actualizarPagoInscripcion(inscripcionId, payload)
      toast.success("Pago del taller actualizado exitosamente")
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.mensaje || "Error al actualizar el pago del taller")
    } finally {
      setSaving(false)
    }
  }

  const saldoPendiente = Math.max(0, precioEfectivo - montoNum)
  const tallerNombre = selected?.taller?.nombre || selected?.taller?.nombre_simple || "Taller"

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabecera del modal */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Editar Pago del Taller</h3>
              <p className="text-xs text-slate-500">
                Ajusta el arancel, actualiza los abonos y concilia los comprobantes registrados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del modal (Scrollable) */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* Tarjeta de Concepto y Ajuste de Precio */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Concepto de Cobro
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{tallerNombre}</p>
                <p className="text-xs text-slate-500">
                  Arancel base original: <span className="font-mono font-bold">${precioBase.toFixed(2)}</span>
                </p>
              </div>

              <AjustePrecioPanel
                precioOriginal={precioBase}
                precioActual={precioEfectivo}
                motivoActual={motivoAjuste}
                expandido={ajusteExpandido}
                onConfirmar={(nuevoPrecio, motivo) => {
                  setPrecioEfectivo(nuevoPrecio)
                  setMotivoAjuste(motivo)
                  setAjusteExpandido(false)
                  if (montoNum > nuevoPrecio) {
                    setMonto(String(nuevoPrecio))
                    if (metodos.length === 1) {
                      setMetodos([{ ...metodos[0], monto: String(nuevoPrecio) }])
                    }
                  }
                }}
                onCancelar={() => setAjusteExpandido(false)}
                onToggleExpandir={() => setAjusteExpandido((prev) => !prev)}
              />
            </div>

            {precioEfectivo !== precioBase && (
              <div className="p-2.5 rounded-lg bg-orange-50/80 border border-orange-200/60 text-xs text-orange-900 flex items-start gap-2">
                <AlertCircle size={16} className="text-[#fd761a] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Precio pactado: ${precioEfectivo.toFixed(2)}</span>
                  {motivoAjuste && <p className="text-orange-700 mt-0.5">Motivo: {motivoAjuste}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Campo de Monto Pagado */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block text-slate-500">
              Monto Pagado / Abonado
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => handleMontoChange(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === "0") e.target.select()
                }}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                disabled={saving}
                className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-base font-bold font-mono outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a] transition-all bg-white text-slate-900"
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-2 px-1">
              <span className="text-slate-500">
                Estado:{" "}
                <strong className={esCompleto ? "text-emerald-700" : "text-amber-700"}>
                  {esCompleto ? "PAGO COMPLETO" : montoNum > 0 ? "ABONO PARCIAL" : "PENDIENTE"}
                </strong>
              </span>
              <span className="font-mono text-slate-600">
                Saldo pendiente: <strong className="text-slate-900">${saldoPendiente.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          {/* Comprobante único cuando la modalidad es único */}
          {modalidadComprobante === "unico" && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Comprobante de Pago Principal
              </span>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                  <ImageIcon size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    {comprobanteUnicoUrl ? "Comprobante cargado" : "Sin comprobante cargado"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={comprobanteUnicoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadComprobanteUnico}
                  />
                  <button
                    type="button"
                    onClick={() => comprobanteUnicoRef.current?.click()}
                    disabled={uploadingUnico || saving}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>{uploadingUnico ? "Subiendo..." : comprobanteUnicoUrl ? "Cambiar foto" : "Subir foto"}</span>
                  </button>
                  {comprobanteUnicoUrl && (
                    <button
                      type="button"
                      onClick={() => setComprobanteUnicoUrl(null)}
                      className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer font-semibold"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Desglose de Métodos de Pago */}
          <div className="pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Métodos de Pago Utilizados
            </span>
            <MetodosPagoSplitInput
              totalEsperado={montoNum}
              metodos={metodos}
              onChange={setMetodos}
              disabled={saving}
              permitirComprobantePorMetodo={true}
              modalidadComprobante={modalidadComprobante}
              onModalidadComprobanteChange={setModalidadComprobante}
            />
          </div>
        </div>

        {/* Footer de acciones */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Total a registrar:</span>
            <span className="font-mono font-black text-sm text-slate-900">
              ${montoNum.toFixed(2)} de ${precioEfectivo.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving}
              type="button"
              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>{saving ? "Guardando..." : "Guardar cambios"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
