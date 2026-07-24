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
  montoSolicitado?: number
  onMontoModulo1Change?: (valido: boolean) => void
  onTotalPrecioChange?: (total: number) => void
  onSubmit: (pagos: any[], metodoPago: string, inscripcion?: { total: number; cubierto: number }) => void
}

export type PagoPreAprobacionRef = {
  submit: () => void
  tieneMontoModulo1: boolean
  totalPrecio: number
}

export const PagoPreAprobacionSection = forwardRef(function PagoPreAprobacionSection({
  cursoAbiertoId, metodoPagoInicial, montoSolicitado, onMontoModulo1Change, onTotalPrecioChange, onSubmit,
}: PagoPreAprobacionSectionProps, ref) {
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [montoTotalInput, setMontoTotalInput] = useState("")
  const [modulos, setModulos] = useState<any[]>([])
  const [modulosCargados, setModulosCargados] = useState(false)
  const [ajustes, setAjustes] = useState<Record<string, { expandido: boolean; nuevoPrecio: string; motivo: string }>>({})
  const [incluirInscripcion, setIncluirInscripcion] = useState(false)
  const [precioInscripcionManual, setPrecioInscripcionManual] = useState("")

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

  const montoModulo1 = sorted.length > 0 ? parseFloat(montos[sorted[0]?.id] || "0") : 0

  useEffect(() => {
    onMontoModulo1Change?.(montoModulo1 > 0)
  }, [montoModulo1, onMontoModulo1Change])

  useEffect(() => {
    if (modulosCargados && sorted.length > 0 && montoSolicitado && montoSolicitado > 0) {
      handleMontoChange(sorted[0].id, String(montoSolicitado))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montoSolicitado, modulosCargados])

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

  const totalPrecio = useMemo(() => {
    return sorted.reduce((sum: number, m: any) => m ? sum + getPrecioEfectivo(m) : sum, 0)
  }, [sorted, getPrecioEfectivo])

  useEffect(() => {
    if (modulosCargados) {
      onTotalPrecioChange?.(totalPrecio)
    }
  }, [totalPrecio, onTotalPrecioChange, modulosCargados])

  const handleMontoChange = useCallback((moduloId: string, valor: string) => {
    setMontoTotalInput("")
    const nuevoMonto = parseFloat(valor) || 0
    const moduloActual = modulos.find((m: any) => m.id === moduloId)
    if (!moduloActual) return
    const precio = getPrecioEfectivo(moduloActual)
    const excedente = Math.round(Math.max(0, nuevoMonto - precio) * 100) / 100
    const idx = sorted.findIndex((m: any) => m.id === moduloId)

    const simulated = { ...montos }

    if (excedente > 0) {
      simulated[moduloId] = String(precio)
      let resto = excedente
      for (let i = idx + 1; i < sorted.length && resto > 0; i++) {
        const sig = sorted[i]
        const sigPrecio = getPrecioEfectivo(sig)
        const aplicado = Math.round(Math.min(resto, sigPrecio) * 100) / 100
        simulated[sig.id] = String(aplicado)
        resto = Math.round((resto - aplicado) * 100) / 100
      }
      const limiteTotal = totalPrecio
      if (resto > 0) {
        toast.error(`El monto excede el precio total de los módulos ($${limiteTotal.toLocaleString()}). El excedente se aplicará a la inscripción si está activa.`)
        return
      }
    } else {
      simulated[moduloId] = valor
      for (let i = idx + 1; i < sorted.length; i++) {
        delete simulated[sorted[i].id]
      }
    }

    setMontos(simulated)
  }, [modulos, sorted, montos, getPrecioEfectivo, totalPrecio])

  const handleTotalChange = useCallback((valor: string) => {
    setMontoTotalInput(valor)
    const total = parseFloat(valor) || 0
    if (total <= 0 || sorted.length === 0) return
    const totalPrecios = sorted.reduce((sum, m) => sum + getPrecioEfectivo(m), 0)
    if (total > totalPrecios) {
      toast.error(`El monto total ($${total.toLocaleString()}) supera el precio total de los módulos ($${totalPrecios.toLocaleString()})`)
      return
    }
    setMontos({})
    let resto = total
    const nuevosMontos: Record<string, string> = {}
    for (const m of sorted) {
      const precio = getPrecioEfectivo(m)
      const aplicar = Math.round(Math.min(resto, precio) * 100) / 100
      if (aplicar > 0) nuevosMontos[m.id] = String(aplicar)
      resto = Math.round((resto - aplicar) * 100) / 100
      if (resto <= 0) break
    }
    setMontos(nuevosMontos)
  }, [sorted, getPrecioEfectivo])

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
  }

  const handleSubmit = useCallback(() => {
    const inscripcionVal = incluirInscripcion ? (parseFloat(precioInscripcionManual) || 0) : 0
    if (totalARegistrar > totalPrecio) {
      toast.error(`El total a registrar ($${totalARegistrar.toLocaleString()}) supera el precio de los módulos ($${totalPrecio.toLocaleString()}). Ajusta los montos.`)
      return
    }
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
      const excedente = Math.max(0, totalARegistrar - totalPrecio)
      const cubierta = Math.min(inscripcionVal, excedente)

      if (cubierta < inscripcionVal) {
        toast.warning(
          `El monto registrado no cubre por completo el precio de inscripción.\n\n` +
          `Inscripción: $${inscripcionVal.toLocaleString()} | Cubierto: $${cubierta.toLocaleString()} | Pendiente: $${(inscripcionVal - cubierta).toLocaleString()}`
        )
      }

      onSubmit(pagos, metodoPagoInicial || "efectivo", { total: inscripcionVal, cubierto: cubierta })
    } else {
      onSubmit(pagos, metodoPagoInicial || "efectivo")
    }
  }, [modulos, montos, ajustes, onSubmit, metodoPagoInicial, totalARegistrar, totalPrecio, incluirInscripcion, precioInscripcionManual])

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    tieneMontoModulo1: montoModulo1 > 0,
    totalPrecio,
  }), [handleSubmit, montoModulo1, totalPrecio])

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
      <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
        <div className="flex-1">
          <p className="text-xs mb-1" style={{ color: COLORS.TEXT_MUTED }}>O ingresa el monto total del comprobante para distribuirlo automáticamente:</p>
          <div className="relative max-w-[260px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
            <input type="number" min="0" step="0.01" placeholder="0.00"
              value={montoTotalInput}
              onChange={e => handleTotalChange(e.target.value)}
              onWheel={e => (e.target as HTMLElement).blur()}
              className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 bg-white"
              style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Total distribuido</p>
          <p className="text-sm font-black mt-0.5" style={{ color: totalARegistrar > 0 ? "oklch(0.55 0.15 150)" : COLORS.CHARCOAL }}>
            ${totalARegistrar.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
      {sorted.map((modulo: any, idx: number) => {
        if (!modulo) return null
        const monto = parseFloat(montos[modulo.id] || "0")
        const precioEfectivo = getPrecioEfectivo(modulo)
        const a = ajustes[modulo.id]
        const tieneAjuste = a && !a.expandido && parseFloat(a.nuevoPrecio || "0") !== (modulo.precio_base ?? 0)
        const pagado = monto > 0 && monto >= precioEfectivo
        const abonado = monto > 0 && monto < precioEfectivo

        const tieneExcedente = pagado && sorted.length > idx + 1 && sorted.slice(idx + 1).some((m: any) => parseFloat(montos[m.id] || "0") > 0)

        let lineaEstado = ""
        if (pagado) {
          if (tieneExcedente) {
            lineaEstado = "Módulo " + (modulo.numero_orden || (idx + 1)) + " pagado completo · excedente aplicado a módulos siguientes"
          } else {
            lineaEstado = "Módulo " + (modulo.numero_orden || (idx + 1)) + " pagado completo"
          }
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
        <div className="p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.ACCENT }}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                Precio de inscripción (opcional)
              </span>
              
            </div>
            <div className="relative w-36">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precioInscripcionManual}
                onChange={e => setPrecioInscripcionManual(e.target.value)}
                onWheel={e => (e.target as HTMLElement).blur()}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-3 rounded-xl border space-y-1.5" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: COLORS.TEXT_MUTED }}>Total del curso</span>
          <span className="font-semibold" style={{ color: COLORS.CHARCOAL }}>${totalPrecio.toLocaleString()}</span>
        </div>
        {incluirInscripcion && parseFloat(precioInscripcionManual || "0") > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: COLORS.TEXT_MUTED }}>Inscripción</span>
            <span className="font-semibold" style={{ color: "oklch(0.65 0.15 75)" }}>${parseFloat(precioInscripcionManual).toLocaleString()}</span>
          </div>
        )}
        {incluirInscripcion && parseFloat(precioInscripcionManual || "0") > 0 && (
          <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <span style={{ color: COLORS.TEXT_MUTED }}>Total a pagar</span>
            <span className="font-semibold" style={{ color: COLORS.ACCENT }}>${(totalPrecio + parseFloat(precioInscripcionManual)).toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs pt-1" style={{ borderTopColor: COLORS.BORDER_SUBTLE, borderTopWidth: incluirInscripcion && parseFloat(precioInscripcionManual || "0") > 0 ? 0 : 1 }}>
          <span style={{ color: COLORS.TEXT_MUTED }}>Valor pagado</span>
          <span className="font-semibold" style={{ color: COLORS.CHARCOAL }}>${totalARegistrar.toLocaleString()} <span className="font-normal opacity-50">({modulosCubiertos}/{sorted.length} módulos)</span></span>
        </div>
        {(montoSolicitado ?? 0) > 0 && (
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span style={{ color: COLORS.TEXT_MUTED }}>Declarado</span>
            <span className="font-semibold" style={{ color: COLORS.TEXT_MUTED }}>${(montoSolicitado ?? 0).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
})
