import { useId, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddCircleIcon,
  Delete02Icon,
  CreditCardIcon,
  Coins02Icon,
  SentIcon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Image01Icon,
  Upload05Icon,
} from "@hugeicons/core-free-icons"

export interface ConceptoDestino {
  id: string
  nombre: string
  saldo?: number
  montoACobrar?: number
  precioTotal?: number
}

export interface MetodoPagoItem {
  id: string
  metodo_pago: "efectivo" | "transferencia" | "deposito" | "tarjeta" | "otro"
  monto: string
  linea_pago_modulo_id?: string
  modulo_id?: string
  referencia_pago?: string | null
  comprobante_url?: string | null
  comprobante_file?: File | null
  comprobante_preview_url?: string | null
}

export type ModalidadComprobante = "unico" | "por_metodo"

export interface MetodosPagoSplitInputProps {
  totalEsperado: number
  metodos: MetodoPagoItem[]
  onChange: (metodos: MetodoPagoItem[]) => void
  conceptos?: ConceptoDestino[]
  disabled?: boolean
  hideSingleToggle?: boolean
  permitirComprobantePorMetodo?: boolean
  modalidadComprobante?: ModalidadComprobante
  onModalidadComprobanteChange?: (modalidad: ModalidadComprobante) => void
}

const METODOS_OPCIONES: { value: MetodoPagoItem["metodo_pago"]; label: string; icon: typeof Coins02Icon }[] = [
  { value: "efectivo", label: "Efectivo", icon: Coins02Icon },
  { value: "transferencia", label: "Transferencia bancaria", icon: SentIcon },
  { value: "deposito", label: "Depósito bancario", icon: CreditCardIcon },
  { value: "tarjeta", label: "Tarjeta débito / crédito", icon: CreditCardIcon },
  { value: "otro", label: "Otro método", icon: Coins02Icon },
]

export function MetodosPagoSplitInput({
  totalEsperado,
  metodos,
  onChange,
  conceptos,
  disabled = false,
  hideSingleToggle = false,
  permitirComprobantePorMetodo = false,
  modalidadComprobante = "unico",
  onModalidadComprobanteChange,
}: MetodosPagoSplitInputProps) {
  const componentId = useId()
  const isMultiple = metodos.length > 1
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // Cálculo en centavos para precisión monetaria absoluta
  const totalEsperadoCentavos = Math.round(totalEsperado * 100)
  const sumaIngresadaCentavos = metodos.reduce((acc, m) => {
    const val = parseFloat(m.monto) || 0
    return acc + Math.round(val * 100)
  }, 0)

  const diferenciaCentavos = totalEsperadoCentavos - sumaIngresadaCentavos
  const esExacto = totalEsperadoCentavos > 0 && diferenciaCentavos === 0
  const esExcedido = diferenciaCentavos < 0

  // Detección automática del concepto activo con fondos a cobrar
  const conceptosActivos = conceptos?.filter((c) => (c.montoACobrar ?? 0) > 0)
  const defaultConceptoId =
    conceptosActivos && conceptosActivos.length === 1
      ? conceptosActivos[0].id
      : conceptos?.[0]?.id

  // Validación de montos asignados a cada módulo vs monto a cobrar de ese módulo.
  // IMPORTANTE: Esta validación por módulo SOLO aplica cuando hay múltiples métodos (isMultiple).
  // En modo de método único, el método cubre globalmente la transacción distribuida entre los módulos.
  const desbalancesConcepto = !isMultiple
    ? []
    : (conceptos || [])
        .filter((c) => (c.montoACobrar ?? 0) > 0)
        .map((c) => {
          const sumaCentavos = metodos
            .filter((m) => m.linea_pago_modulo_id === c.id)
            .reduce((acc, m) => acc + Math.round((parseFloat(m.monto) || 0) * 100), 0)
          const maxCentavos = Math.round((c.montoACobrar ?? 0) * 100)
          return {
            concepto: c,
            suma: sumaCentavos / 100,
            max: c.montoACobrar ?? 0,
            excede: sumaCentavos > maxCentavos,
            diferencia: (sumaCentavos - maxCentavos) / 100,
          }
        })
        .filter((d) => d.excede)

  const handleMetodoChange = <K extends keyof MetodoPagoItem>(
    index: number,
    campo: K,
    valor: MetodoPagoItem[K]
  ) => {
    const copia = [...metodos]
    copia[index] = { ...copia[index], [campo]: valor }
    onChange(copia)
  }

  const handleFileSelect = (idx: number, file: File | null) => {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    const copia = [...metodos]
    copia[idx] = {
      ...copia[idx],
      comprobante_file: file,
      comprobante_preview_url: previewUrl,
    }
    onChange(copia)
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
    onChange(copia)
  }

  const handleAgregarMetodo = () => {
    if (metodos.length >= 5) return
    const faltante = Math.max(0, diferenciaCentavos / 100)
    const nuevo: MetodoPagoItem = {
      id: `${componentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      metodo_pago: "transferencia",
      monto: faltante > 0 ? faltante.toFixed(2) : "",
      linea_pago_modulo_id: defaultConceptoId,
    }
    onChange([...metodos, nuevo])
  }

  const handleRemoverMetodo = (index: number) => {
    if (metodos.length <= 1) return
    if (metodos[index].comprobante_preview_url) {
      URL.revokeObjectURL(metodos[index].comprobante_preview_url!)
    }
    const copia = metodos.filter((_, i) => i !== index)
    onChange(copia)
  }

  const handleToggleMultiple = (enable: boolean) => {
    if (enable) {
      if (metodos.length === 1) {
        const mitad = Math.floor(totalEsperadoCentavos / 2) / 100
        const resto = (totalEsperadoCentavos - Math.round(mitad * 100)) / 100
        const primerId = metodos[0].linea_pago_modulo_id || defaultConceptoId
        const segundoId =
          conceptosActivos && conceptosActivos.length === 1
            ? primerId
            : conceptos?.[1]?.id || primerId

        onChange([
          {
            ...metodos[0],
            monto: mitad > 0 ? mitad.toFixed(2) : "",
            linea_pago_modulo_id: primerId,
          },
          {
            id: `${componentId}-${Date.now()}-sec`,
            metodo_pago: metodos[0].metodo_pago === "efectivo" ? "transferencia" : "efectivo",
            monto: resto > 0 ? resto.toFixed(2) : "",
            linea_pago_modulo_id: segundoId,
          },
        ])
      }
    } else {
      // Reducir a un solo método cubriendo el total esperado y sin anclaje exclusivo a un módulo
      onChange([
        {
          ...metodos[0],
          monto: totalEsperado > 0 ? totalEsperado.toFixed(2) : metodos[0].monto,
          linea_pago_modulo_id: undefined,
        },
      ])
    }
  }

  return (
    <div className="space-y-3.5 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
      {/* Encabezado con Switch de Modo (Único vs Dividido) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <HugeiconsIcon icon={Coins02Icon} size={15} className="text-[#fd761a]" />
            <span>Forma de Pago</span>
            <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isMultiple
              ? "El pago se dividirá entre varios métodos (ej. efectivo y transferencia)."
              : "Selecciona el método con el que el cliente realiza este abono."}
          </p>
        </div>

        {!hideSingleToggle && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleToggleMultiple(false)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                !isMultiple
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Método único
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleToggleMultiple(true)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                isMultiple
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Múltiples métodos (Mixto)
            </button>
          </div>
        )}
      </div>

      {/* Selector de Modalidad de Comprobante (cuando hay múltiples métodos y está habilitado) */}
      {isMultiple && permitirComprobantePorMetodo && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HugeiconsIcon icon={Image01Icon} size={15} className="text-[#fd761a]" />
                <span>Gestión de Comprobantes</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {modalidadComprobante === "unico"
                  ? "Se usará el comprobante principal de la solicitud para respaldar todo el pago."
                  : "Podrás subir una foto de comprobante específica para cada método de pago."}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs self-start sm:self-auto shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onModalidadComprobanteChange?.("unico")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  modalidadComprobante === "unico"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Comprobante único
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onModalidadComprobanteChange?.("por_metodo")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  modalidadComprobante === "por_metodo"
                    ? "bg-[#fd761a] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Un comprobante por método
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Métodos */}
      <div className="space-y-2.5">
        {metodos.map((item, idx) => {
          const showConceptoSelect = Boolean(isMultiple && conceptos && conceptos.length > 1)
          return (
            <div
              key={item.id || idx}
              className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 transition-all"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                {/* Selector de Método */}
                <div className={`${showConceptoSelect ? "sm:col-span-4" : isMultiple ? "sm:col-span-5" : "sm:col-span-6"} space-y-1`}>
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <span>Método #{idx + 1}</span>
                  </label>
                  <select
                    disabled={disabled}
                    value={item.metodo_pago}
                    onChange={(e) => handleMetodoChange(idx, "metodo_pago", e.target.value as MetodoPagoItem["metodo_pago"])}
                    className="w-full h-9.5 px-3 bg-slate-50 rounded-lg text-slate-900 text-xs font-semibold border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none cursor-pointer"
                  >
                    {METODOS_OPCIONES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Monto del Método */}
                <div className={`${showConceptoSelect ? "sm:col-span-3" : isMultiple ? "sm:col-span-4" : "sm:col-span-6"} space-y-1`}>
                  <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                    <span>Monto cubierto</span>
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
                      disabled={disabled}
                      placeholder="0.00"
                      value={item.monto}
                      onChange={(e) => handleMetodoChange(idx, "monto", e.target.value)}
                      className="w-full h-9.5 pl-7 pr-3 bg-slate-50 rounded-lg text-slate-900 text-xs font-bold border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none"
                    />
                  </div>
                </div>

                {/* Módulo / Concepto de destino si aplica (solo en modo mixto con múltiples conceptos) */}
                {showConceptoSelect && (
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 truncate block">
                      Aplica a módulo
                    </label>
                    <select
                      disabled={disabled}
                      value={item.linea_pago_modulo_id || ""}
                      onChange={(e) => handleMetodoChange(idx, "linea_pago_modulo_id", e.target.value)}
                      className="w-full h-9.5 px-2.5 bg-slate-50 rounded-lg text-slate-900 text-xs font-semibold border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none cursor-pointer truncate"
                    >
                      <option value="">(Cualquier módulo)</option>
                      {conceptos?.map((c) => {
                        let labelDetalle = ""
                        if (c.montoACobrar !== undefined && c.montoACobrar > 0) {
                          labelDetalle = `($${c.montoACobrar.toFixed(2)} a cobrar)`
                        } else if (c.saldo !== undefined && c.saldo > 0) {
                          labelDetalle = `(Base: $${c.saldo.toFixed(2)})`
                        }
                        return (
                          <option key={c.id} value={c.id}>
                            {c.nombre} {labelDetalle}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                {/* Botón eliminar método (solo si hay más de 1) */}
                {isMultiple && (
                  <div className={`${showConceptoSelect ? "sm:col-span-2" : "sm:col-span-3"} flex justify-end`}>
                    <button
                      type="button"
                      disabled={disabled || metodos.length <= 1}
                      onClick={() => handleRemoverMetodo(idx)}
                      title="Quitar este método de pago"
                      className="h-9.5 px-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                      <span className="hidden sm:inline">Quitar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Input y Preview de Comprobante por Método (Todo método requiere comprobante) */}
              {isMultiple && permitirComprobantePorMetodo && modalidadComprobante === "por_metodo" && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 w-full justify-between">
                    <input
                      ref={(el) => { fileInputRefs.current[idx] = el }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={disabled}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFileSelect(idx, f)
                      }}
                    />

                    {item.comprobante_preview_url || item.comprobante_url ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                          <img
                            src={item.comprobante_preview_url || item.comprobante_url || ""}
                            alt="Comprobante"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[220px]">
                          {item.comprobante_file?.name || "Comprobante cargado"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium flex items-center gap-1">
                        <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                        Comprobante requerido para {item.metodo_pago}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <HugeiconsIcon icon={Upload05Icon} size={13} />
                        <span>
                          {item.comprobante_preview_url || item.comprobante_url
                            ? "Cambiar foto"
                            : "Subir comprobante"}
                        </span>
                      </button>
                      {(item.comprobante_preview_url || item.comprobante_url) && (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleFileRemove(idx)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Quitar comprobante de este método"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Alertas de Desbalance por Módulo (si los métodos asignados superan el monto a cobrar del módulo) */}
      {desbalancesConcepto.length > 0 && (
        <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 space-y-1">
          {desbalancesConcepto.map((d) => (
            <div key={d.concepto.id} className="flex items-center gap-1.5 font-semibold">
              <HugeiconsIcon icon={AlertCircleIcon} size={15} className="text-rose-600 shrink-0" />
              <span>
                La suma de métodos asignados a <strong>{d.concepto.nombre}</strong> (${d.suma.toFixed(2)}) excede su monto a cobrar (${d.max.toFixed(2)}) por ${d.diferencia.toFixed(2)}.
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Botón Agregar Método (si es modo múltiple y menos de 5) */}
      {isMultiple && metodos.length < 5 && (
        <button
          type="button"
          disabled={disabled}
          onClick={handleAgregarMetodo}
          className="w-full py-2 border border-dashed border-slate-300 hover:border-[#fd761a] hover:bg-orange-50/40 rounded-xl text-xs font-bold text-slate-700 hover:text-[#fd761a] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={AddCircleIcon} size={16} />
          <span>Agregar otro método de pago ({metodos.length}/5)</span>
        </button>
      )}

      {/* Balance y Validación de Sumas */}
      {totalEsperado > 0 && (
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
            esExacto && desbalancesConcepto.length === 0
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : esExcedido || desbalancesConcepto.length > 0
              ? "bg-rose-50/70 border-rose-200 text-rose-900"
              : "bg-amber-50/70 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-1.5 font-medium">
            <HugeiconsIcon
              icon={esExacto && desbalancesConcepto.length === 0 ? CheckmarkCircle02Icon : AlertCircleIcon}
              size={16}
              className={esExacto && desbalancesConcepto.length === 0 ? "text-emerald-600" : "text-rose-600"}
            />
            <span>
              {esExacto && desbalancesConcepto.length === 0
                ? "Suma de métodos exacta y balanceada"
                : esExcedido
                ? `Los métodos exceden el total por $${(Math.abs(diferenciaCentavos) / 100).toFixed(2)}`
                : desbalancesConcepto.length > 0
                ? "Existen módulos con montos asignados en exceso"
                : `Falta asignar $${(diferenciaCentavos / 100).toFixed(2)} para cubrir el total`}
            </span>
          </div>

          <div className="font-bold shrink-0 pl-2">
            ${(sumaIngresadaCentavos / 100).toFixed(2)} / ${totalEsperado.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  )
}
