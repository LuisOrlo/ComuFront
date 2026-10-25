import { useState, useEffect, useRef, useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { getStorageUrl } from "@/lib/utils"
import {
  Cancel01Icon,
  Coins02Icon,
  AddCircleIcon,
  Delete02Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Upload05Icon,
  CreditCardIcon,
  SentIcon,
} from "@hugeicons/core-free-icons"
import type { MetodoPagoItem } from "./MetodosPagoSplitInput"

export interface ModuloPagoMixtoModalProps {
  open: boolean
  onClose: () => void
  conceptoNombre: string
  montoObjetivo: number
  metodosIniciales?: MetodoPagoItem[]
  onSave: (metodos: MetodoPagoItem[]) => void
  onRemove?: () => void
  permitirComprobantePorMetodo?: boolean
}

const METODOS_OPCIONES: { value: MetodoPagoItem["metodo_pago"]; label: string; icon: typeof Coins02Icon }[] = [
  { value: "transferencia", label: "Transferencia bancaria", icon: SentIcon },
  { value: "efectivo", label: "Efectivo", icon: Coins02Icon },
  { value: "tarjeta", label: "Tarjeta de débito / crédito", icon: CreditCardIcon },
  { value: "deposito", label: "Depósito bancario", icon: SentIcon },
  { value: "otro", label: "Otro método", icon: Coins02Icon },
]

export function ModuloPagoMixtoModal({
  open,
  onClose,
  conceptoNombre,
  montoObjetivo,
  metodosIniciales,
  onSave,
  onRemove,
  permitirComprobantePorMetodo = true,
}: ModuloPagoMixtoModalProps) {
  const componentId = useId()
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const [modalidadComprobante, setModalidadComprobante] = useState<"unico" | "por_metodo">("unico")
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
  const [metodos, setMetodos] = useState<MetodoPagoItem[]>([])

  // Inicializar o resetear cuando se abre el modal
  useEffect(() => {
    if (!open) return

    if (metodosIniciales && metodosIniciales.length >= 2) {
      setMetodos(
        metodosIniciales.map((m) => ({
          ...m,
          id: m.id || `${componentId}-${Math.random().toString(36).substring(2, 7)}`,
        }))
      )
      const tieneComprobanteIndividual = metodosIniciales.some(
        (m) => m.comprobante_file || m.comprobante_url
      )
      if (tieneComprobanteIndividual) {
        setModalidadComprobante("por_metodo")
      }
    } else if (metodosIniciales && metodosIniciales.length === 1) {
      const baseM = metodosIniciales[0]
      const totalCentavos = Math.round(montoObjetivo * 100)
      const mitadCentavos = Math.floor(totalCentavos / 2)
      const restoCentavos = totalCentavos - mitadCentavos

      setMetodos([
        {
          id: `${componentId}-1`,
          metodo_pago: baseM.metodo_pago || "transferencia",
          monto: (mitadCentavos / 100).toFixed(2),
          comprobante_url: baseM.comprobante_url || null,
          comprobante_file: baseM.comprobante_file || null,
          comprobante_preview_url: baseM.comprobante_preview_url || null,
        },
        {
          id: `${componentId}-2`,
          metodo_pago: baseM.metodo_pago === "efectivo" ? "transferencia" : "efectivo",
          monto: (restoCentavos / 100).toFixed(2),
          comprobante_url: null,
        },
      ])
      if (baseM.comprobante_url || baseM.comprobante_file) {
        setModalidadComprobante("por_metodo")
      }
    } else {
      // Dividir el monto objetivo en 2 mitades exactas en centavos
      const totalCentavos = Math.round(montoObjetivo * 100)
      const mitadCentavos = Math.floor(totalCentavos / 2)
      const restoCentavos = totalCentavos - mitadCentavos

      setMetodos([
        {
          id: `${componentId}-1`,
          metodo_pago: "transferencia",
          monto: (mitadCentavos / 100).toFixed(2),
        },
        {
          id: `${componentId}-2`,
          metodo_pago: "efectivo",
          monto: (restoCentavos / 100).toFixed(2),
        },
      ])
      setModalidadComprobante("unico")
    }
  }, [open, montoObjetivo, metodosIniciales, componentId])

  if (!open) return null

  // Cálculos matemáticos en centavos
  const totalEsperadoCentavos = Math.round(montoObjetivo * 100)
  const sumaIngresadaCentavos = metodos.reduce((acc, m) => {
    const val = parseFloat(m.monto) || 0
    return acc + Math.round(val * 100)
  }, 0)
  const diferenciaCentavos = totalEsperadoCentavos - sumaIngresadaCentavos
  const esExacto = diferenciaCentavos === 0
  const esExcedido = diferenciaCentavos < 0

  const handleMetodoChange = <K extends keyof MetodoPagoItem>(
    index: number,
    campo: K,
    valor: MetodoPagoItem[K]
  ) => {
    const copia = [...metodos]
    copia[index] = { ...copia[index], [campo]: valor }
    setMetodos(copia)
  }

  const handleAgregarMetodo = () => {
    if (metodos.length >= 5) return
    const faltante = Math.max(0, diferenciaCentavos / 100)
    const nuevo: MetodoPagoItem = {
      id: `${componentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      metodo_pago: "transferencia",
      monto: faltante > 0 ? faltante.toFixed(2) : "",
    }
    setMetodos([...metodos, nuevo])
  }

  const handleRemoverMetodo = (index: number) => {
    if (metodos.length <= 2) return
    if (metodos[index].comprobante_preview_url) {
      URL.revokeObjectURL(metodos[index].comprobante_preview_url!)
    }
    setMetodos(metodos.filter((_, i) => i !== index))
  }

  const handleFileSelect = (idx: number, file: File | null) => {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    const copia = [...metodos]
    copia[idx] = {
      ...copia[idx],
      comprobante_file: file,
      comprobante_preview_url: previewUrl,
      comprobante_url: null,
    }
    setMetodos(copia)
  }

  const handleFileRemove = (idx: number) => {
    const copia = [...metodos]
    if (copia[idx].comprobante_preview_url) {
      URL.revokeObjectURL(copia[idx].comprobante_preview_url!)
    }
    copia[idx] = {
      ...copia[idx],
      comprobante_file: null,
      comprobante_preview_url: null,
      comprobante_url: null,
    }
    setMetodos(copia)
  }

  const handleGuardar = () => {
    if (!esExacto) return
    if (modalidadComprobante === "por_metodo") {
      const sinComprobante = metodos.some(
        (m) => !m.comprobante_file && !m.comprobante_url && parseFloat(m.monto || "0") > 0
      )
      if (sinComprobante) {
        return
      }
    }
    onSave(metodos)
    onClose()
  }

  const faltaComprobante =
    modalidadComprobante === "por_metodo" &&
    metodos.some((m) => !m.comprobante_file && !m.comprobante_url && parseFloat(m.monto || "0") > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Coins02Icon} size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Pago mixto para {conceptoNombre}
              </h3>
              <p className="text-xs text-slate-500">
                Divide el cobro de este modulo en varios métodos de pago
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Tarjeta de Monto Objetivo */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/50 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                Monto total a cubrir en este concepto
              </span>
              <span className="text-xs text-blue-600/80 block mt-0.5">
                La suma de los métodos debe igualar este valor
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black font-mono text-blue-900">
                ${montoObjetivo.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Selector de Comprobante por Método (Opcional) */}
          {permitirComprobantePorMetodo && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    Gestión de Comprobantes
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {modalidadComprobante === "unico"
                      ? "Se usará el comprobante principal de la solicitud para este módulo."
                      : "Sube un comprobante individual para cada método de pago."}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalidadComprobante("unico")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      modalidadComprobante === "unico"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Comprobante único
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidadComprobante("por_metodo")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      modalidadComprobante === "por_metodo"
                        ? "bg-[#fd761a] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Por método
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Métodos para este módulo */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Métodos de pago aplicados ({metodos.length})
            </label>

            {metodos.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  {/* Selector del método */}
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Método #{idx + 1}
                    </label>
                    <select
                      value={item.metodo_pago}
                      onChange={(e) =>
                        handleMetodoChange(
                          idx,
                          "metodo_pago",
                          e.target.value as MetodoPagoItem["metodo_pago"]
                        )
                      }
                      className="w-full h-9.5 px-3 bg-slate-50 rounded-lg text-slate-900 text-xs font-semibold border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none cursor-pointer"
                    >
                      {METODOS_OPCIONES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monto cubierto */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Monto</span>
                      <span className="text-[10px] text-slate-400">USD $</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={item.monto}
                        onChange={(e) => handleMetodoChange(idx, "monto", e.target.value)}
                        className="w-full h-9.5 pl-7 pr-3 bg-slate-50 rounded-lg text-slate-900 text-xs font-bold border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none"
                      />
                    </div>
                  </div>

                  {/* Botón quitar método */}
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      disabled={metodos.length <= 2}
                      onClick={() => handleRemoverMetodo(idx)}
                      title={metodos.length <= 2 ? "Debe haber mínimo 2 métodos" : "Quitar método"}
                      className="h-9.5 px-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed w-full"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} />
                    </button>
                  </div>
                </div>

                {/* Subida de comprobante individual si modalidad por método */}
                {permitirComprobantePorMetodo && modalidadComprobante === "por_metodo" && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[idx] = el
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFileSelect(idx, f)
                      }}
                    />

                    {item.comprobante_preview_url || item.comprobante_url ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            const url = item.comprobante_preview_url || (item.comprobante_url ? getStorageUrl(item.comprobante_url) : "")
                            if (url) setExpandedImageUrl(url)
                          }}
                          className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 hover:opacity-80 transition-opacity cursor-pointer shadow-2xs"
                          title="Clic para ver comprobante en tamaño completo"
                        >
                          <img
                            src={item.comprobante_preview_url || getStorageUrl(item.comprobante_url) || ""}
                            alt="Comprobante"
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                          {item.comprobante_file?.name || "Comprobante cargado"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium flex items-center gap-1">
                        <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                        Comprobante requerido
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <HugeiconsIcon icon={Upload05Icon} size={13} />
                        <span>
                          {item.comprobante_preview_url || item.comprobante_url
                            ? "Cambiar"
                            : "Subir foto"}
                        </span>
                      </button>
                      {(item.comprobante_preview_url || item.comprobante_url) && (
                        <button
                          type="button"
                          onClick={() => handleFileRemove(idx)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botón Agregar Método (si < 5) */}
          {metodos.length < 5 && (
            <button
              type="button"
              onClick={handleAgregarMetodo}
              className="w-full py-2 border border-dashed border-slate-300 hover:border-[#fd761a] hover:bg-orange-50/40 rounded-xl text-xs font-bold text-slate-700 hover:text-[#fd761a] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={AddCircleIcon} size={16} />
              <span>Agregar otro método a este pago ({metodos.length}/5)</span>
            </button>
          )}

          {/* Barra de balance del concepto */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
              esExacto
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : esExcedido
                ? "bg-rose-50/70 border-rose-200 text-rose-900"
                : "bg-amber-50/70 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <HugeiconsIcon
                icon={esExacto ? CheckmarkCircle02Icon : AlertCircleIcon}
                size={16}
                className={esExacto ? "text-emerald-600" : "text-rose-600"}
              />
              <span>
                {esExacto
                  ? "Suma exacta y balanceada"
                  : esExcedido
                  ? `Excede el monto del concepto por $${(Math.abs(diferenciaCentavos) / 100).toFixed(2)}`
                  : `Faltan $${(diferenciaCentavos / 100).toFixed(2)} para cubrir los $${montoObjetivo.toFixed(2)}`}
              </span>
            </div>
            <div className="font-bold shrink-0 pl-2">
              ${(sumaIngresadaCentavos / 100).toFixed(2)} / ${montoObjetivo.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Pie del modal con acciones */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            {onRemove && (
              <button
                type="button"
                onClick={() => {
                  onRemove()
                  onClose()
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} />
                <span>Quitar pago mixto (volver a método único)</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!esExacto || faltaComprobante}
              onClick={handleGuardar}
              className="px-4 py-2 rounded-xl bg-[#fd761a] hover:bg-[#e66914] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar pago mixto
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox para ver comprobante ampliado */}
      {expandedImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setExpandedImageUrl(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpandedImageUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer z-10"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
            <img
              src={expandedImageUrl}
              alt="Comprobante en detalle"
              className="max-w-full max-h-[82vh] rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
