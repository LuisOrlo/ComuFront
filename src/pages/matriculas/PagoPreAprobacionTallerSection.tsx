import { useState, useCallback, useImperativeHandle, forwardRef, useRef } from "react"
import { CreditCard } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { tallerService } from "@/services/taller.service"
import { toast } from "sonner"
import { AjustePrecioPanel } from "./components/solicitudes/AjustePrecioPanel"
import { MetodosPagoSplitInput, type MetodoPagoItem, type ModalidadComprobante } from "@/components/finanzas/MetodosPagoSplitInput"

export type PagoTallerPreAprobacionRef = {
  submit: () => Promise<boolean>
  getMonto: () => number
  getTipoPago: () => string
  getMetodoPago: () => string
  getMetodosPago: () => MetodoPagoItem[]
  getGrupoPagoId: () => string
}

interface PagoPreAprobacionTallerSectionProps {
  inscripcionId: string
  precioBase: number
  montoInicial?: number
  tipoPagoInicial: string
  metodoInicial: string
  onSaved?: (data: { monto_pagado: number; tipo_pago: string; metodo_pago: string }) => void
}

export const PagoPreAprobacionTallerSection = forwardRef(function PagoPreAprobacionTallerSection({
  inscripcionId,
  precioBase,
  montoInicial = 0,
  tipoPagoInicial,
  metodoInicial,
  onSaved,
}: PagoPreAprobacionTallerSectionProps, ref) {
  const [precioEfectivo, setPrecioEfectivo] = useState(precioBase)
  const [monto, setMonto] = useState(String(montoInicial || 0))
  const [tipoPago, setTipoPago] = useState(tipoPagoInicial || "abono")
  const [grupoPagoId] = useState(() => crypto.randomUUID())
  const [modalidadComprobante, setModalidadComprobante] = useState<ModalidadComprobante>("unico")
  const [metodos, setMetodos] = useState<MetodoPagoItem[]>(() => [
    {
      id: "taller-pago-1",
      metodo_pago: (metodoInicial === "transferencia" || metodoInicial === "deposito" || metodoInicial === "tarjeta") ? metodoInicial : "efectivo",
      monto: String(montoInicial || 0),
    },
  ])
  const metodosRef = useRef<MetodoPagoItem[]>(metodos)
  metodosRef.current = metodos
  const [saving, setSaving] = useState(false)

  const [ajuste, setAjuste] = useState<{ expandido: boolean; motivo: string }>({
    expandido: false,
    motivo: "",
  })

  const handleMontoChange = (val: string) => {
    const numVal = parseFloat(val) || 0
    if (numVal > precioEfectivo && precioEfectivo >= 0) {
      setMonto(String(precioEfectivo))
      setTipoPago("completo")
      if (metodos.length === 1) {
        setMetodos([{ ...metodos[0], monto: String(precioEfectivo) }])
      }
      toast.warning(`El monto no puede exceder el precio del taller ($${precioEfectivo.toFixed(2)}). Se ajustó al máximo.`)
      return
    }
    setMonto(val)
    setTipoPago(numVal >= precioEfectivo ? "completo" : "abono")
    if (metodos.length === 1) {
      setMetodos([{ ...metodos[0], monto: val }])
    }
  }

  const submit = useCallback(async (): Promise<boolean> => {
    const montoNum = parseFloat(monto) || 0
    const metodosSumCentavos = metodos.reduce((sum, m) => sum + Math.round((parseFloat(m.monto) || 0) * 100), 0)
    const totalEsperadoCentavos = Math.round(montoNum * 100)

    if (montoNum > 0 && metodosSumCentavos !== totalEsperadoCentavos) {
      toast.error(`La suma de los métodos ($${(metodosSumCentavos / 100).toFixed(2)}) debe coincidir con el monto a cobrar ($${montoNum.toFixed(2)})`)
      return false
    }

    if (modalidadComprobante === "por_metodo") {
      const faltaComprobante = metodos.some(
        (m) => m.metodo_pago !== "efectivo" && !m.comprobante_file && !m.comprobante_url && (parseFloat(m.monto) || 0) > 0
      )
      if (faltaComprobante) {
        toast.error("Hay métodos de pago que requieren su comprobante adjunto")
        return false
      }
    }

    setSaving(true)
    try {
      let metodosActualizados = [...metodos]
      const tieneArchivos = metodosActualizados.some((m) => m.comprobante_file && !m.comprobante_url)
      if (tieneArchivos) {
        try {
          const uploadPromises = metodosActualizados.map(async (m) => {
            if (m.comprobante_file && !m.comprobante_url) {
              const res = await tallerService.uploadComprobante(m.comprobante_file)
              return { ...m, comprobante_url: res.url }
            }
            return m
          })
          metodosActualizados = await Promise.all(uploadPromises)
          setMetodos(metodosActualizados)
          metodosRef.current = metodosActualizados
        } catch {
          toast.error("Error al subir uno de los comprobantes del pago mixto")
          return false
        }
      }

      const data: { monto_pagado: number; tipo_pago: string; metodo_pago: string; monto_ajustado?: number; precio_ajustado?: number; motivo_ajuste?: string } = {
        monto_pagado: montoNum,
        tipo_pago: tipoPago,
        metodo_pago: metodosActualizados[0]?.metodo_pago || "efectivo",
      }
      if (precioEfectivo !== precioBase) {
        data.monto_ajustado = precioEfectivo
        data.precio_ajustado = precioEfectivo
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
  }, [inscripcionId, monto, tipoPago, metodos, modalidadComprobante, precioEfectivo, precioBase, ajuste, onSaved])

  useImperativeHandle(ref, () => ({
    submit,
    getMonto: () => parseFloat(monto) || 0,
    getTipoPago: () => tipoPago,
    getMetodoPago: () => metodosRef.current[0]?.metodo_pago || "efectivo",
    getMetodosPago: () => metodosRef.current,
    getGrupoPagoId: () => grupoPagoId,
  }), [submit, monto, tipoPago, grupoPagoId])

  const montoNum = parseFloat(monto) || 0
  const esCompleto = montoNum >= precioEfectivo

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard size={14} style={{ color: COLORS.ACCENT }} />
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
              if (montoNum > nuevoPrecio || nuevoPrecio === 0) {
                const s = String(nuevoPrecio)
                setMonto(s)
                if (metodos.length === 1) {
                  setMetodos([{ ...metodos[0], monto: s }])
                }
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
              onFocus={e => { if (e.target.value === "0") e.target.select() }}
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

        <div className="pt-2">
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
    </div>
  )
})
