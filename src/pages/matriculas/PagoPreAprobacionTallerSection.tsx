import { useState, useCallback, useImperativeHandle, forwardRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PaymentIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService } from "@/services/taller.service"
import { toast } from "sonner"
import { AjustePrecioPanel } from "./components/solicitudes/AjustePrecioPanel"

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
  const [precioEfectivo, setPrecioEfectivo] = useState(precioBase)
  const [monto, setMonto] = useState(String(montoInicial || precioBase || 0))
  const [tipoPago, setTipoPago] = useState(tipoPagoInicial || "abono")
  const [metodo, setMetodo] = useState(metodoInicial || "efectivo")
  const [saving, setSaving] = useState(false)

  const [ajuste, setAjuste] = useState<{ expandido: boolean; motivo: string }>({
    expandido: false,
    motivo: "",
  })

  const handleMontoChange = (val: string) => {
    const numVal = parseFloat(val) || 0
    if (numVal > precioEfectivo && precioEfectivo > 0) {
      setMonto(String(precioEfectivo))
      setTipoPago("completo")
      toast.warning(`El monto no puede exceder el precio del taller ($${precioEfectivo.toFixed(2)}). Se ajustó al máximo.`)
      return
    }
    setMonto(val)
    setTipoPago(numVal >= precioEfectivo ? "completo" : "abono")
  }

  const submit = useCallback(async (): Promise<boolean> => {
    setSaving(true)
    try {
      const montoNum = parseFloat(monto) || 0
      const data: { monto_pagado: number; tipo_pago: string; metodo_pago: string; monto_ajustado?: number; motivo_ajuste?: string } = {
        monto_pagado: montoNum,
        tipo_pago: tipoPago,
        metodo_pago: metodo,
      }
      if (Math.abs(precioEfectivo - precioBase) > 0.001) {
        data.monto_ajustado = precioEfectivo
        data.motivo_ajuste = ajuste.motivo
      }
      await tallerService.actualizarInscripcion(inscripcionId, data)
      onSaved?.({ monto_pagado: data.monto_pagado, tipo_pago: data.tipo_pago, metodo_pago: data.metodo_pago })
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [inscripcionId, monto, tipoPago, metodo, precioEfectivo, precioBase, ajuste, onSaved])

  useImperativeHandle(ref, () => ({
    submit,
    getMonto: () => parseFloat(monto) || 0,
    getTipoPago: () => tipoPago,
    getMetodoPago: () => metodo,
  }), [submit, monto, tipoPago, metodo])

  const montoNum = parseFloat(monto) || 0
  const esCompleto = montoNum >= precioEfectivo

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <HugeiconsIcon icon={PaymentIcon} size={14} style={{ color: COLORS.ACCENT }} />
        <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
          Registro de pago del Taller
        </h4>
      </div>

      <div className="p-4 rounded-xl border space-y-4 bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
              Concepto
            </span>
            <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.CHARCOAL }}>
              Taller Intensivo
            </p>
          </div>

          <AjustePrecioPanel
            precioOriginal={precioBase}
            precioActual={precioEfectivo}
            motivoActual={ajuste.motivo}
            expandido={ajuste.expandido}
            onConfirmar={(nuevoPrecio, motivo) => {
              setPrecioEfectivo(nuevoPrecio)
              setAjuste({ expandido: false, motivo })
              if (montoNum > nuevoPrecio) {
                setMonto(String(nuevoPrecio))
              }
            }}
            onCancelar={() => {
              setAjuste(prev => ({ ...prev, expandido: false }))
            }}
            onToggleExpandir={() => setAjuste(prev => ({ ...prev, expandido: !prev.expandido }))}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: COLORS.TEXT_MUTED }}>
            Monto a cobrar ahora
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
              className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 transition-all bg-white"
              style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <span style={{ color: COLORS.TEXT_MUTED }}>Tipo de pago</span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full border transition-colors"
            style={{
              backgroundColor: esCompleto ? "oklch(0.55 0.15 150 / 0.12)" : "oklch(0.65 0.15 75 / 0.12)",
              color: esCompleto ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)",
              borderColor: esCompleto ? "oklch(0.55 0.15 150 / 0.3)" : "oklch(0.65 0.15 75 / 0.3)",
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
            className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none bg-white font-medium"
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
