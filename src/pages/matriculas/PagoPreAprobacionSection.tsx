/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react"
import axios from "axios"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"

interface PagoPreAprobacionSectionProps {
  cursoAbiertoId: string
  cursoNombre: string
  metodoPagoInicial?: string
  onMontoValidoChange?: (valido: boolean) => void
  onTotalPrecioChange?: (total: number) => void
  onSubmit: (pagos: any[], metodoPago: string, inscripcion?: { total: number; cubierto: number }) => void
}

export type PagoPreAprobacionRef = {
  submit: () => void
  totalPrecio: number
  montoValido: boolean
}

export const PagoPreAprobacionSection = forwardRef(function PagoPreAprobacionSection({
  cursoAbiertoId, metodoPagoInicial, onMontoValidoChange, onTotalPrecioChange, onSubmit,
}: PagoPreAprobacionSectionProps, ref) {
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [modulos, setModulos] = useState<any[]>([])
  const [modulosCargados, setModulosCargados] = useState(false)
  const [ajustes, setAjustes] = useState<Record<string, { expandido: boolean; nuevoPrecio: string; motivo: string }>>({})
  const [incluirInscripcion, setIncluirInscripcion] = useState(false)
  const [precioInscripcionManual, setPrecioInscripcionManual] = useState("")
  const [pagoInscripcion, setPagoInscripcion] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/academic/cursos-abiertos/${cursoAbiertoId}/modulos`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }
        )
        const data = res.data.data || res.data.datos || res.data || []
        setModulos(Array.isArray(data) ? data : [])
      } catch {
        setModulos([])
      } finally {
        setModulosCargados(true)
      }
    }
    load()
  }, [cursoAbiertoId])

  const getPrecioEfectivo = useCallback((modulo: any): number => {
    const a = ajustes[modulo.id]
    if (a && !a.expandido && parseFloat(a.nuevoPrecio || "0") > 0) {
      return parseFloat(a.nuevoPrecio) || 0
    }
    return Number(modulo.precio_base ?? modulo.precio ?? 0)
  }, [ajustes])

  const sorted = useMemo(() => {
    return [...modulos].sort((a, b) => (a.numero_orden ?? 0) - (b.numero_orden ?? 0))
  }, [modulos])

  const totalPrecio = useMemo(() => {
    return sorted.reduce((sum: number, m: any) => m ? sum + getPrecioEfectivo(m) : sum, 0)
  }, [sorted, getPrecioEfectivo])

  useEffect(() => {
    if (modulosCargados) {
      onTotalPrecioChange?.(totalPrecio)
    }
  }, [totalPrecio, onTotalPrecioChange, modulosCargados])

  const inscripcionVal = useMemo(
    () => (incluirInscripcion ? (parseFloat(precioInscripcionManual) || 0) : 0),
    [incluirInscripcion, precioInscripcionManual]
  )

  const inscripcionCubierta = useMemo(
    () => Math.min(inscripcionVal, parseFloat(pagoInscripcion) || 0),
    [inscripcionVal, pagoInscripcion]
  )

  const totalARegistrar = useMemo(() => {
    return sorted.reduce((sum: number, m: any) => m ? sum + parseFloat(montos[m.id] || "0") : sum, 0)
  }, [sorted, montos])

  const modulosCubiertos = useMemo(() => {
    return sorted.filter((m: any) => {
      if (!m) return false
      const monto = parseFloat(montos[m.id] || "0")
      const precio = getPrecioEfectivo(m)
      return monto >= precio
    }).length
  }, [sorted, montos, getPrecioEfectivo])

  const totalIngresado = totalARegistrar + inscripcionCubierta

  const montoValido = totalARegistrar > 0 || (inscripcionVal > 0 && inscripcionCubierta > 0)

  useEffect(() => {
    onMontoValidoChange?.(montoValido)
  }, [montoValido, onMontoValidoChange])

  const handleMontoChange = useCallback((moduloId: string, valor: string) => {
    const moduloActual = modulos.find((m: any) => m.id === moduloId)
    if (!moduloActual) return
    const precio = getPrecioEfectivo(moduloActual)
    const nuevoMonto = parseFloat(valor) || 0
    if (nuevoMonto < 0) {
      setMontos(prev => ({ ...prev, [moduloId]: "0" }))
      return
    }
    if (nuevoMonto > precio) {
      setMontos(prev => ({ ...prev, [moduloId]: String(precio) }))
      toast.warning(`El monto no puede exceder el precio del módulo ($${precio.toLocaleString()}). Se ajustó al máximo.`)
      return
    }
    setMontos(prev => ({ ...prev, [moduloId]: valor }))
  }, [modulos, getPrecioEfectivo])

  const toggleAjuste = (moduloId: string) => {
    setAjustes(prev => {
      const actual = prev[moduloId]
      if (actual?.expandido) return { ...prev, [moduloId]: { ...actual, expandido: false } }
      const mod = modulos.find((m: any) => m.id === moduloId)
      return {
        ...prev,
        [moduloId]: {
          expandido: true,
          nuevoPrecio: String(mod?.precio_base ?? mod?.precio ?? 0),
          motivo: actual?.motivo ?? "",
        },
      }
    })
  }

  const confirmarAjuste = (moduloId: string) => {
    setAjustes(prev => {
      const a = prev[moduloId]
      if (!a) return prev
      return { ...prev, [moduloId]: { ...a, expandido: false } }
    })
    setMontos(prev => {
      const mod = modulos.find((m: any) => m.id === moduloId)
      const a = ajustes[moduloId]
      const nuevoPrecio = a ? parseFloat(a.nuevoPrecio || "0") : getPrecioEfectivo(mod)
      const montoActual = parseFloat(prev[moduloId] || "0")
      if (montoActual > nuevoPrecio && nuevoPrecio > 0) {
        return { ...prev, [moduloId]: String(nuevoPrecio) }
      }
      return prev
    })
  }

  const handleSubmit = useCallback(() => {
    const pagos = modulos
      .filter((m: any) => {
        const monto = parseFloat(montos[m.id] || "0")
        return monto > 0
      })
      .map((m: any) => {
        const base: Record<string, unknown> = {
          modulo_id: m.id,
          monto: parseFloat(montos[m.id] || "0"),
        }
        const a = ajustes[m.id]
        const precioOriginal = m.precio_base ?? m.precio ?? 0
        if (a && !a.expandido && parseFloat(a.nuevoPrecio || "0") !== precioOriginal) {
          base.monto_ajustado = parseFloat(a.nuevoPrecio || "0")
          base.motivo_ajuste = a.motivo
        }
        return base
      })

    if (inscripcionVal > 0) {
      onSubmit(pagos, metodoPagoInicial || "efectivo", { total: inscripcionVal, cubierto: inscripcionCubierta })
    } else {
      onSubmit(pagos, metodoPagoInicial || "efectivo")
    }
  }, [modulos, montos, ajustes, onSubmit, metodoPagoInicial, inscripcionVal, inscripcionCubierta])

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    totalPrecio,
    montoValido,
  }), [handleSubmit, totalPrecio, montoValido])

  if (!modulosCargados) {
    return (
      <div className="pt-4 space-y-3">
        <p className="text-xs opacity-40">Cargando módulos...</p>
      </div>
    )
  }

  if (modulos.length === 0) {
    return (
      <div className="pt-4 space-y-3">
        <p className="text-xs opacity-40">Este curso no tiene módulos configurados</p>
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
      {sorted.map((modulo: any, idx: number) => {
        if (!modulo) return null
        const monto = parseFloat(montos[modulo.id] || "0")
        const precioEfectivo = getPrecioEfectivo(modulo)
        const a = ajustes[modulo.id]
        const tieneAjuste = a && !a.expandido && parseFloat(a.nuevoPrecio || "0") !== (modulo.precio_base ?? 0)
        const pagado = monto > 0 && monto >= precioEfectivo
        const abonado = monto > 0 && monto < precioEfectivo

        let lineaEstado = ""
        if (pagado) {
          lineaEstado = "Módulo " + (modulo.numero_orden || (idx + 1)) + " pagado completo"
        } else if (abonado) {
          const saldo = Math.max(0, precioEfectivo - monto)
          lineaEstado = "Abono · Saldo pendiente: $" + saldo.toLocaleString()
        }

        return (
          <div key={modulo.id} className="p-4 rounded-xl border space-y-3 bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                  Módulo {modulo.numero_orden || (idx + 1)}
                </span>
                <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.CHARCOAL }}>
                  {modulo.nombre_modulo || modulo.nombre || "—"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-right">
                {a?.expandido ? (
                  <span className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>${precioEfectivo.toLocaleString()}</span>
                ) : (
                  <>
                    {tieneAjuste && <span className="text-xs line-through opacity-40">${(modulo.precio_base ?? 0).toLocaleString()}</span>}
                    <span className="text-sm font-black" style={{ color: tieneAjuste ? "oklch(0.65 0.15 75)" : COLORS.CHARCOAL }}>
                      ${precioEfectivo.toLocaleString()}
                    </span>
                  </>
                )}
                <button type="button" onClick={() => toggleAjuste(modulo.id)}
                  className="ml-1 size-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={Edit01Icon} size={12} />
                </button>
              </div>
            </div>

            {a?.expandido && (
              <div className="p-3 rounded-xl border space-y-2" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Nuevo precio</label>
                  <input type="number" min="0" step="0.01" value={a.nuevoPrecio}
                    onChange={e => setAjustes(prev => ({ ...prev, [modulo.id]: { ...a, nuevoPrecio: e.target.value } }))}
                    onWheel={e => (e.target as HTMLElement).blur()}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 mt-1 bg-white"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Motivo del ajuste</label>
                  <input type="text" value={a.motivo}
                    onChange={e => setAjustes(prev => ({ ...prev, [modulo.id]: { ...a, motivo: e.target.value.toUpperCase() } }))}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-blue-500 mt-1 bg-white uppercase"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }} placeholder="EJ: DESCUENTO POR PRONTO PAGO" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => confirmarAjuste(modulo.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: COLORS.ACCENT }}>Confirmar ajuste</button>
                  <button type="button" onClick={() => toggleAjuste(modulo.id)}
                    className="px-4 py-2 rounded-xl text-xs font-medium hover:text-gray-700 transition-colors"
                    style={{ color: COLORS.TEXT_MUTED }}>Cancelar</button>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  value={montos[modulo.id] || ""}
                  onChange={e => handleMontoChange(modulo.id, e.target.value)}
                  onWheel={e => (e.target as HTMLElement).blur()}
                  className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 bg-white"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }} />
              </div>
            </div>

            {lineaEstado && (
              <p className="text-[10px] font-medium" style={{ color: pagado ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)" }}>
                {lineaEstado}
              </p>
            )}
          </div>
        )
      })}
      </div>

      <button
        type="button"
        onClick={() => {
          if (incluirInscripcion) {
            setIncluirInscripcion(false)
            setPrecioInscripcionManual("")
            setPagoInscripcion("")
          } else {
            setIncluirInscripcion(true)
          }
        }}
        className="w-full py-2.5 rounded-xl border border-dashed text-xs font-semibold transition-all hover:bg-blue-50/50 hover:border-blue-300"
        style={{
          borderColor: incluirInscripcion ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
          color: incluirInscripcion ? COLORS.ACCENT : COLORS.TEXT_MUTED,
        }}
      >
        {incluirInscripcion ? "– Quitar precio de inscripción" : "+ Agregar precio de inscripción"}
      </button>

      {incluirInscripcion && (
        <div className="p-4 rounded-xl border space-y-3 bg-white" style={{ borderColor: COLORS.ACCENT }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                Inscripción / Matrícula
              </span>
              <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.CHARCOAL }}>
                Cargo de inscripción
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black" style={{ color: "oklch(0.65 0.15 75)" }}>
                ${parseFloat(precioInscripcionManual || "0").toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                Precio de inscripción
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={precioInscripcionManual}
                  onChange={e => {
                    setPrecioInscripcionManual(e.target.value)
                    const pago = parseFloat(pagoInscripcion) || 0
                    const nuevoPrecio = parseFloat(e.target.value) || 0
                    if (pago > nuevoPrecio) setPagoInscripcion(e.target.value)
                  }}
                  onWheel={e => (e.target as HTMLElement).blur()}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 bg-white"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                Monto a pagar
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                <input
                  type="number" min="0" step="0.01"
                  max={precioInscripcionManual || "0"}
                  value={pagoInscripcion}
                  onChange={e => {
                    const maxVal = parseFloat(precioInscripcionManual) || 0
                    const val = parseFloat(e.target.value) || 0
                    if (val > maxVal) {
                      setPagoInscripcion(String(maxVal))
                      toast.warning(`El pago no puede exceder el precio de inscripción ($${maxVal.toLocaleString()})`)
                    } else {
                      setPagoInscripcion(e.target.value)
                    }
                  }}
                  onWheel={e => (e.target as HTMLElement).blur()}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 bg-white"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
                />
              </div>
            </div>
          </div>

          {parseFloat(pagoInscripcion || "0") > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.08)" }}>
              <span className="text-xs font-semibold" style={{ color: "oklch(0.55 0.15 240)" }}>
                {inscripcionCubierta >= inscripcionVal ? "Inscripción cubierta completa" : "Pago parcial de inscripción"}
              </span>
              <span className="text-xs font-bold" style={{ color: "oklch(0.55 0.15 240)" }}>
                ${inscripcionCubierta.toLocaleString()} de ${inscripcionVal.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-3 rounded-xl border space-y-1.5" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: COLORS.TEXT_MUTED }}>Total del curso</span>
          <span className="font-semibold" style={{ color: COLORS.CHARCOAL }}>${totalPrecio.toLocaleString()}</span>
        </div>
        {incluirInscripcion && parseFloat(precioInscripcionManual || "0") > 0 && (
          <>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: COLORS.TEXT_MUTED }}>Inscripción</span>
              <span className="font-semibold" style={{ color: "oklch(0.65 0.15 75)" }}>${parseFloat(precioInscripcionManual).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1" style={{ borderTopWidth: 1, borderTopColor: COLORS.BORDER_SUBTLE }}>
              <span style={{ color: COLORS.TEXT_MUTED }}>Total a pagar</span>
              <span className="font-semibold" style={{ color: COLORS.ACCENT }}>${(totalPrecio + parseFloat(precioInscripcionManual || "0")).toLocaleString()}</span>
            </div>
          </>
        )}
        {inscripcionCubierta > 0 && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span style={{ color: COLORS.TEXT_MUTED }}>Pago de inscripción</span>
            <span className="font-semibold" style={{ color: "oklch(0.55 0.15 150)" }}>
              ${inscripcionCubierta.toLocaleString()} de ${inscripcionVal.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs pt-1" style={{ borderTopColor: COLORS.BORDER_SUBTLE, borderTopWidth: incluirInscripcion && parseFloat(precioInscripcionManual || "0") > 0 ? 0 : 1 }}>
          <span style={{ color: COLORS.TEXT_MUTED }}>Total ingresado</span>
          <span className="font-semibold" style={{ color: "oklch(0.55 0.15 150)" }}>
            ${totalIngresado.toLocaleString()}{" "}
            <span className="font-normal opacity-50">
              ({incluirInscripcion && inscripcionCubierta > 0
                ? `${modulosCubiertos}/${sorted.length} módulos + inscripción`
                : `${modulosCubiertos}/${sorted.length} módulos`})
            </span>
          </span>
        </div>
      </div>
    </div>
  )
})
