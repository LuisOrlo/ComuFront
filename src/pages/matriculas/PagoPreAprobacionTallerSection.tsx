import { useState, useCallback, useImperativeHandle, forwardRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PaymentIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService } from "@/services/taller.service"

export type PagoTallerPreAprobacionRef = {
  submit: () => Promise<boolean>
  getMonto: () => number
  getTipoPago: () => string
  getMetodoPago: () => string
}

interface PagoPreAprobacionTallerSectionProps {
  inscripcionId: string
  precioBase: number
  montoInicial: number
  tipoPagoInicial: string
  metodoInicial: string
  onSaved?: (data: { monto_pagado: number; tipo_pago: string; metodo_pago: string }) => void
}

export const PagoPreAprobacionTallerSection = forwardRef(function PagoPreAprobacionTallerSection({
  inscripcionId,
  precioBase,
  montoInicial,
  tipoPagoInicial,
  metodoInicial,
  onSaved,
}: PagoPreAprobacionTallerSectionProps, ref) {
  const [monto, setMonto] = useState(String(montoInicial || precioBase || 0))
  const [tipoPago, setTipoPago] = useState(tipoPagoInicial || "abono")
  const [metodo, setMetodo] = useState(metodoInicial || "efectivo")
  const [saving, setSaving] = useState(false)

  const handleMontoChange = (val: string) => {
    setMonto(val)
    const numVal = parseFloat(val) || 0
    setTipoPago(numVal >= precioBase ? "completo" : "abono")
  }

  const submit = useCallback(async (): Promise<boolean> => {
    setSaving(true)
    try {
      const montoNum = parseFloat(monto) || 0
      const data = {
        monto_pagado: montoNum,
        tipo_pago: tipoPago,
        metodo_pago: metodo,
        fecha_pago: new Date().toISOString().split("T")[0],
      }
      await tallerService.actualizarInscripcion(inscripcionId, data as Record<string, unknown>)
      onSaved?.(data)
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [inscripcionId, monto, tipoPago, metodo, onSaved])

  useImperativeHandle(ref, () => ({
    submit,
    getMonto: () => parseFloat(monto) || 0,
    getTipoPago: () => tipoPago,
    getMetodoPago: () => metodo,
  }), [submit, monto, tipoPago, metodo])

  const montoNum = parseFloat(monto) || 0
  const esCompleto = montoNum >= precioBase

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <HugeiconsIcon icon={PaymentIcon} size={14} style={{ color: COLORS.ACCENT }} />
        <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
          Registro de pago
        </h4>
      </div>

      <div className="p-3 rounded-xl border space-y-3 bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: COLORS.TEXT_MUTED }}>Precio del taller</span>
          <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>${precioBase.toFixed(2)}</span>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: COLORS.TEXT_MUTED }}>
            Monto a cobrar
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={e => handleMontoChange(e.target.value)}
              onWheel={e => (e.target as HTMLElement).blur()}
              disabled={saving}
              className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white"
              style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span style={{ color: COLORS.TEXT_MUTED }}>Tipo de pago</span>
          <span
            className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{
              backgroundColor: esCompleto ? "oklch(0.55 0.15 150 / 0.12)" : "oklch(0.65 0.15 75 / 0.12)",
              color: esCompleto ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)",
            }}
          >
            {esCompleto ? "COMPLETO" : "ABONO"}
          </span>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: COLORS.TEXT_MUTED }}>
            Método de pago
          </label>
          <select
            value={metodo}
            onChange={e => setMetodo(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none bg-white"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia / Depósito</option>
          </select>
        </div>
      </div>
    </div>
  )
})
