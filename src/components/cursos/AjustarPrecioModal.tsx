import { useState } from "react"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

interface AjustarPrecioModalProps {
  open: boolean
  onClose: () => void
  cursoId: string
  matriculaId: string
  moduloId: string
  nombreModulo: string
  nombreEstudiante: string
  precioBase: number
  precioActual: number
  abonado: number
  esAjustado: boolean
  onSaved: () => void
}

export function AjustarPrecioModal({
  open,
  onClose,
  cursoId,
  matriculaId,
  moduloId,
  nombreModulo,
  nombreEstudiante,
  precioBase,
  precioActual,
  abonado,
  esAjustado,
  onSaved,
}: AjustarPrecioModalProps) {
  const [nuevoPrecio, setNuevoPrecio] = useState("")
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleClose = () => {
    setNuevoPrecio("")
    setMotivo("")
    setError("")
    setSaving(false)
    onClose()
  }

  const handleSave = async () => {
    setError("")
    const precio = parseFloat(nuevoPrecio)

    if (!nuevoPrecio || isNaN(precio) || precio <= 0) {
      setError("Ingresa un precio válido mayor a 0")
      return
    }
    if (precio < abonado) {
      setError(
        `El nuevo precio ($${precio.toFixed(2)}) no puede ser menor al monto ya abonado ($${abonado.toFixed(2)})`
      )
      return
    }
    if (!motivo.trim()) {
      setError("Ingresa el motivo del ajuste")
      return
    }

    setSaving(true)
    try {
      await financeService.ajustarPrecioModulo(cursoId, matriculaId, {
        modulo_id: moduloId,
        nuevo_precio: precio,
        motivo: motivo.trim(),
      })
      toast.success("Precio ajustado correctamente")
      handleClose()
      onSaved()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      const msg = String(data?.mensaje || data?.message || "Error al ajustar el precio")
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div
          className="px-6 py-5 border-b flex items-center justify-between"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>Ajustar Precio del Módulo</h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
              {nombreEstudiante}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-lg"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: COLORS.CHARCOAL }}>
                {nombreModulo}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.TEXT_MUTED }}>Precio original</span>
              <span
                className={`font-semibold ${esAjustado ? "line-through opacity-50" : ""}`}
                style={{ color: esAjustado ? COLORS.TEXT_MUTED : COLORS.CHARCOAL }}
              >
                ${precioBase.toFixed(2)}
              </span>
            </div>
            {esAjustado && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: COLORS.TEXT_MUTED }}>Precio ajustado actual</span>
                <span className="font-semibold" style={{ color: "oklch(0.45 0.12 140)" }}>
                  ${precioActual.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.TEXT_MUTED }}>Abonado</span>
              <span className="font-semibold" style={{ color: "oklch(0.45 0.12 140)" }}>
                ${abonado.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>
                Nuevo precio
              </label>
              <input
                type="number"
                value={nuevoPrecio}
                onChange={e => { setNuevoPrecio(e.target.value); setError("") }}
                min={abonado}
                step="0.01"
                placeholder={`Min: $${abonado.toFixed(2)}`}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none"
                style={{ borderColor: error ? "#ef4444" : COLORS.BORDER_SUBTLE }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>
                Motivo del ajuste
              </label>
              <input
                type="text"
                value={motivo}
                onChange={e => { setMotivo(e.target.value); setError("") }}
                placeholder="Ej: descuento por pronto pago"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none"
                style={{ borderColor: error ? "#ef4444" : COLORS.BORDER_SUBTLE }}
              />
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-500">{error}</p>
          )}
        </div>

        <div
          className="flex gap-3 px-6 py-4 border-t"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}
