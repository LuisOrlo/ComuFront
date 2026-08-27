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

  // Sincronizar estado cuando se abre o cambian props
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

  if (!expandido) {
    const tieneAjusteGuardado = Math.abs(precioActual - precioOriginal) > 0.001

    return (
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
    )
  }

  return (
    <div
      className="p-3.5 rounded-xl border space-y-3 bg-white shadow-sm mt-2 transition-all"
      style={{ borderColor: COLORS.ACCENT, backgroundColor: "oklch(0.99 0 0)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
          Ajuste de precio
        </span>
        <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>
          Precio original: <strong className="font-mono">${precioOriginal.toFixed(2)}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: COLORS.TEXT_MUTED }}>
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
              className="w-full pl-8 pr-3 py-2 border rounded-xl text-sm font-mono outline-none bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
            />
          </div>
          {nuevoPrecioNum > 0 && Math.abs(nuevoPrecioNum - precioOriginal) <= 0.001 && (
            <p className="text-[10px] text-amber-600 mt-1">El nuevo precio debe ser distinto al original.</p>
          )}
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: COLORS.TEXT_MUTED }}>
            Motivo del ajuste <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value.toUpperCase())}
            placeholder="EJ: DESCUENTO POR PRONTO PAGO"
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none bg-white uppercase transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          />
          {!motivoValido && (
            <p className="text-[10px] text-amber-600 mt-1">Ingresa al menos 3 caracteres de motivo.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 pt-1 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <button
          type="button"
          onClick={handleCancelar}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-100"
          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
          <span>Cancelar</span>
        </button>

        <button
          type="button"
          disabled={!puedeConfirmar}
          onClick={() => puedeConfirmar && onConfirmar(nuevoPrecioNum, motivo.trim())}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
          <span>Confirmar ajuste</span>
        </button>
      </div>
    </div>
  )
}
