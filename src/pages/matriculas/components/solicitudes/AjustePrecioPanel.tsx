import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon, CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

interface AjustePrecioPanelProps {
  precioOriginal: number
  precioActual: number
  motivoActual?: string
  expandido: boolean
  onConfirmar: (nuevoPrecio: number, motivo: string) => void
  onCancelar: () => void
  onToggleExpandir: () => void
  labelButton?: string
}

export function AjustePrecioPanel({
  precioOriginal,
  precioActual,
  motivoActual = "",
  expandido,
  onConfirmar,
  onCancelar,
  onToggleExpandir,
  labelButton = "Ajustar precio",
}: AjustePrecioPanelProps) {
  const [nuevoPrecio, setNuevoPrecio] = useState(String(precioActual))
  const [motivo, setMotivo] = useState(motivoActual)

  useEffect(() => {
    if (expandido) {
      setNuevoPrecio(String(precioActual))
      setMotivo(motivoActual)
    }
  }, [expandido, precioActual, motivoActual])

  const handleCancelar = () => {
    setNuevoPrecio(String(precioActual))
    setMotivo(motivoActual)
    onCancelar()
  }

  const nuevoPrecioNum = parseFloat(nuevoPrecio) || 0
  const tieneCambioPrecio = nuevoPrecioNum > 0 && Math.abs(nuevoPrecioNum - precioOriginal) > 0.001
  const motivoValido = motivo.trim().length >= 3
  const puedeConfirmar = tieneCambioPrecio && motivoValido
  const tieneAjusteGuardado = Math.abs(precioActual - precioOriginal) > 0.001

  return (
    <>
      <div className="flex items-center gap-2">
        {tieneAjusteGuardado && (
          <span className="text-xs line-through opacity-40 font-mono" style={{ color: COLORS.TEXT_MUTED }}>
            ${precioOriginal.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
          </span>
        )}
        <span
          className="text-sm font-black font-mono"
          style={{ color: tieneAjusteGuardado ? "oklch(0.65 0.15 75)" : COLORS.CHARCOAL }}
        >
          ${precioActual.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
        </span>
        <button
          type="button"
          onClick={onToggleExpandir}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 active:scale-95 hover:bg-gray-100 shrink-0"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            color: tieneAjusteGuardado ? COLORS.ACCENT : COLORS.TEXT_MUTED,
            backgroundColor: tieneAjusteGuardado ? "oklch(0.65 0.15 75 / 0.08)" : "white",
          }}
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
          <span>{tieneAjusteGuardado ? "Editar ajuste" : labelButton}</span>
        </button>
      </div>

      {expandido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-6 space-y-4 animate-in zoom-in-95 duration-150"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={PencilEdit01Icon} size={18} style={{ color: COLORS.ACCENT }} />
                <h3 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>Ajustar Precio</h3>
              </div>
              <button
                type="button"
                onClick={handleCancelar}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border flex items-center justify-between text-xs" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span style={{ color: COLORS.TEXT_MUTED }}>Precio Original:</span>
              <span className="font-bold font-mono text-sm" style={{ color: COLORS.CHARCOAL }}>
                ${precioOriginal.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: COLORS.TEXT_MUTED }}>
                  Nuevo precio <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(e.target.value)}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm font-mono outline-none bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
                  />
                </div>
                {nuevoPrecioNum > 0 && Math.abs(nuevoPrecioNum - precioOriginal) <= 0.001 && (
                  <p className="text-[11px] text-amber-600 mt-1">El nuevo precio debe ser distinto al original.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: COLORS.TEXT_MUTED }}>
                  Motivo del ajuste <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value.toUpperCase())}
                  placeholder="EJ: DESCUENTO POR PRONTO PAGO"
                  className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none bg-white uppercase transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                />
                {!motivoValido && (
                  <p className="text-[11px] text-amber-600 mt-1">Ingresa al menos 3 caracteres de motivo.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <button
                type="button"
                onClick={handleCancelar}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-100"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!puedeConfirmar}
                onClick={() => puedeConfirmar && onConfirmar(nuevoPrecioNum, motivo.trim())}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                <span>Confirmar ajuste</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
