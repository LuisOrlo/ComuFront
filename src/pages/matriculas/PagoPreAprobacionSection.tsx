/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react"
import { cursosService } from "@/services/cursos.service"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"
import { AjustePrecioPanel } from "./components/solicitudes/AjustePrecioPanel"

interface PagoPreAprobacionSectionProps {
  cursoAbiertoId: string
  cursoNombre: string
  esPersonalizado?: boolean
  precioCurso?: number
  precioMatricula?: number
  metodoPagoInicial?: string
  onMontoValidoChange?: (valido: boolean) => void
  onTotalPrecioChange?: (total: number) => void
  onSubmit: (pagos: any[], metodoPago: string, inscripcion?: { total: number; cubierto: number; motivo_ajuste?: string }) => void
}

export type PagoPreAprobacionRef = {
  submit: () => void
  totalPrecio: number
  montoValido: boolean
}

export const PagoPreAprobacionSection = forwardRef(function PagoPreAprobacionSection({
  cursoAbiertoId,
  esPersonalizado = false,
  precioCurso = 0,
  precioMatricula,
  metodoPagoInicial,
  onMontoValidoChange,
  onTotalPrecioChange,
  onSubmit,
}: PagoPreAprobacionSectionProps, ref) {
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [modulos, setModulos] = useState<any[]>([])
  const [modulosCargados, setModulosCargados] = useState(false)
  const [ajustes, setAjustes] = useState<Record<string, { expandido: boolean; nuevoPrecio: string; motivo: string }>>({})

  // Estado de matrícula / inscripción asignada a nivel de curso
  const [cursoBaseMatricula, setCursoBaseMatricula] = useState<number>(precioMatricula ?? 0)
  const [incluirInscripcion, setIncluirInscripcion] = useState(false)
  const [ajusteInscripcion, setAjusteInscripcion] = useState<{ expandido: boolean; nuevoPrecio: string; motivo: string }>({
    expandido: false,
    nuevoPrecio: "",
    motivo: "",
  })
  const [pagoInscripcion, setPagoInscripcion] = useState("")
  const [pagoCurso, setPagoCurso] = useState("")
  const [ajustePersonalizado, setAjustePersonalizado] = useState({ expandido: false, nuevoPrecio: "", motivo: "" })

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const [dataModulos, cursoData] = await Promise.all([
          cursosService.getModulosPorCurso(cursoAbiertoId).catch(() => []),
          precioMatricula === undefined ? cursosService.getCursoAbiertoById(cursoAbiertoId).catch(() => null) : null,
        ])
        if (!isMounted) return
        setModulos(Array.isArray(dataModulos) ? dataModulos : [])

        const fee = Number(precioMatricula !== undefined ? precioMatricula : (cursoData?.precio_matricula ?? 0))
        setCursoBaseMatricula(fee)
        // Por defecto, si el curso tiene configurado valor de inscripción, seleccionarlo
        if (fee > 0) {
          setIncluirInscripcion(true)
        }
      } catch {
        if (!isMounted) return
        setModulos([])
      } finally {
        if (isMounted) setModulosCargados(true)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [cursoAbiertoId, precioMatricula])

  useEffect(() => {
    if (precioMatricula !== undefined) {
      const fee = Number(precioMatricula) || 0
      setCursoBaseMatricula(fee)
      if (fee > 0) {
        setIncluirInscripcion(true)
      }
    }
  }, [precioMatricula])

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

  const totalPrecioModulos = useMemo(() => {
    return sorted.reduce((sum: number, m: any) => m ? sum + getPrecioEfectivo(m) : sum, 0)
  }, [sorted, getPrecioEfectivo])

  // Precio efectivo de inscripción (con descuento/ajuste si se aplicó)
  const precioInscripcionEfectivo = useMemo(() => {
    if (!incluirInscripcion) return 0
    if (ajusteInscripcion.nuevoPrecio !== "") {
      return parseFloat(ajusteInscripcion.nuevoPrecio) || 0
    }
    return cursoBaseMatricula
  }, [incluirInscripcion, ajusteInscripcion.nuevoPrecio, cursoBaseMatricula])

  const inscripcionCubierta = useMemo(
    () => (incluirInscripcion ? Math.min(precioInscripcionEfectivo, parseFloat(pagoInscripcion) || 0) : 0),
    [incluirInscripcion, precioInscripcionEfectivo, pagoInscripcion]
  )

  const totalPrecio = useMemo(() => {
    const base = esPersonalizado && modulos.length === 0 ? Number(precioCurso) || 0 : totalPrecioModulos
    return base + (incluirInscripcion ? precioInscripcionEfectivo : 0)
  }, [esPersonalizado, modulos.length, precioCurso, totalPrecioModulos, incluirInscripcion, precioInscripcionEfectivo])

  useEffect(() => {
    if (modulosCargados) {
      onTotalPrecioChange?.(totalPrecio)
    }
  }, [totalPrecio, onTotalPrecioChange, modulosCargados])

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

  const totalIngresado = (esPersonalizado && modulos.length === 0 ? (parseFloat(pagoCurso) || 0) : totalARegistrar) + inscripcionCubierta

  const precioPersonalizadoActual = Number(ajustePersonalizado.nuevoPrecio || precioCurso) || 0
  const montoValido = esPersonalizado && modulos.length === 0
    ? (parseFloat(pagoCurso) || 0) > 0 && (parseFloat(pagoCurso) || 0) <= precioPersonalizadoActual
    : totalARegistrar > 0 || (incluirInscripcion && precioInscripcionEfectivo > 0 && inscripcionCubierta > 0)

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

  const handleSubmit = useCallback(() => {
    if (esPersonalizado && modulos.length === 0) {
      onSubmit([], metodoPagoInicial || "efectivo", {
        total: Number(ajustePersonalizado.nuevoPrecio || precioCurso) || 0,
        cubierto: parseFloat(pagoCurso) || 0,
        motivo_ajuste: ajustePersonalizado.nuevoPrecio ? ajustePersonalizado.motivo : undefined,
      })
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

    if (incluirInscripcion && precioInscripcionEfectivo > 0) {
      onSubmit(pagos, metodoPagoInicial || "efectivo", {
        total: precioInscripcionEfectivo,
        cubierto: inscripcionCubierta,
        motivo_ajuste: ajusteInscripcion.nuevoPrecio !== "" ? ajusteInscripcion.motivo : undefined,
      })
    } else {
      onSubmit(pagos, metodoPagoInicial || "efectivo")
    }
  }, [
    modulos,
    montos,
    ajustes,
    onSubmit,
    metodoPagoInicial,
    incluirInscripcion,
    precioInscripcionEfectivo,
    inscripcionCubierta,
    ajusteInscripcion,
    esPersonalizado,
    precioCurso,
    pagoCurso,
    ajustePersonalizado,
  ])

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
    if (esPersonalizado) {
      const precio = Number(precioCurso) || 0
      const precioEfectivo = Number(ajustePersonalizado.nuevoPrecio || precio)
      return (
        <div className="pt-4 space-y-3">
          <div className="p-4 rounded-xl border space-y-3 bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>Curso personalizado</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Precio total:</span>
                <AjustePrecioPanel
                  precioOriginal={precio}
                  precioActual={precioEfectivo}
                  motivoActual={ajustePersonalizado.motivo}
                  expandido={ajustePersonalizado.expandido}
                  labelButton="Aplicar descuento"
                  onToggleExpandir={() => setAjustePersonalizado(prev => ({ ...prev, expandido: true }))}
                  onCancelar={() => setAjustePersonalizado(prev => ({ ...prev, expandido: false }))}
                  onConfirmar={(nuevoPrecio, motivo) => setAjustePersonalizado({ expandido: false, nuevoPrecio: String(nuevoPrecio), motivo })}
                />
              </div>
            </div>
            <label className="block text-xs font-semibold" style={{ color: COLORS.CHARCOAL }}>
              Pago inicial a registrar
              <input
                type="number"
                min="0.01"
                max={precioEfectivo}
                step="0.01"
                value={pagoCurso}
                onChange={e => setPagoCurso(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                placeholder="0.00"
              />
            </label>
            {(parseFloat(pagoCurso) || 0) > precioEfectivo && <p className="text-xs text-red-600">El pago no puede superar el precio total ajustado.</p>}
            {(parseFloat(pagoCurso) || 0) <= 0 && <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Ingresa un pago mayor que cero para aprobar.</p>}
          </div>
        </div>
      )
    }
    return (
      <div className="pt-4 space-y-3">
        <p className="text-xs opacity-40">Este curso no tiene módulos configurados</p>
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sorted.map((modulo: any, idx: number) => {
        if (!modulo) return null
        const monto = parseFloat(montos[modulo.id] || "0")
        const precioOriginal = Number(modulo.precio_base ?? modulo.precio ?? 0)
        const precioEfectivo = getPrecioEfectivo(modulo)
        const a = ajustes[modulo.id]

        const pagado = monto > 0 && monto >= precioEfectivo
        const abonado = monto > 0 && monto < precioEfectivo

        let lineaEstado = ""
        if (pagado) {
          lineaEstado = "Módulo " + (modulo.numero_orden || (idx + 1)) + " pagado completo"
        } else if (abonado) {
          const saldo = Math.max(0, precioEfectivo - monto)
          lineaEstado = "Abono · Saldo pendiente: $" + saldo.toLocaleString("es-EC", { minimumFractionDigits: 2 })
        }

        return (
          <div
            key={modulo.id}
            className="p-4 rounded-xl border space-y-3 bg-white"
            style={{
              borderColor: pagado
                ? "oklch(0.55 0.15 150)"
                : abonado
                ? "oklch(0.65 0.15 75)"
                : COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                  Módulo {modulo.numero_orden || (idx + 1)}
                </span>
                <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.CHARCOAL }}>
                  {modulo.nombre_modulo || modulo.nombre || `Módulo ${idx + 1}`}
                </p>
              </div>

              <AjustePrecioPanel
                precioOriginal={precioOriginal}
                precioActual={precioEfectivo}
                motivoActual={a?.motivo ?? ""}
                expandido={Boolean(a?.expandido)}
                onConfirmar={(nuevoPrecio, motivo) => {
                  setAjustes(prev => ({
                    ...prev,
                    [modulo.id]: { expandido: false, nuevoPrecio: String(nuevoPrecio), motivo }
                  }))
                  setMontos(prev => {
                    const montoActual = parseFloat(prev[modulo.id] || "0")
                    if (montoActual > nuevoPrecio && nuevoPrecio > 0) {
                      return { ...prev, [modulo.id]: String(nuevoPrecio) }
                    }
                    return prev
                  })
                }}
                onCancelar={() => {
                  setAjustes(prev => {
                    const actual = prev[modulo.id]
                    if (!actual) return prev
                    return { ...prev, [modulo.id]: { ...actual, expandido: false } }
                  })
                }}
                onToggleExpandir={() => toggleAjuste(modulo.id)}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Monto a cobrar ahora
              </label>
              <div className="relative">
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
              <p className="text-[11px] font-semibold" style={{ color: pagado ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)" }}>
                {lineaEstado}
              </p>
            )}
          </div>
        )
      })}
      </div>

      {/* Sección Cuota de Inscripción / Matrícula */}
      <div
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          incluirInscripcion
            ? "border-blue-200 bg-white shadow-xs"
            : "border-slate-200/80 bg-slate-50/60"
        }`}
      >
        <div className="p-4 sm:p-4.5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <input
                id="toggle-inscripcion-checkbox"
                type="checkbox"
                checked={incluirInscripcion}
                onChange={(e) => {
                  const checked = e.target.checked
                  setIncluirInscripcion(checked)
                  if (!checked) {
                    setPagoInscripcion("")
                    setAjusteInscripcion({ expandido: false, nuevoPrecio: "", motivo: "" })
                  }
                }}
                className="w-4 h-4 rounded text-[#fd761a] focus:ring-[#fd761a] border-slate-300 cursor-pointer accent-[#fd761a]"
              />
              <label
                htmlFor="toggle-inscripcion-checkbox"
                className="cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    Cuota de Matrícula
                  </span>
                  {!incluirInscripcion && (
                    <span className="text-xs text-slate-400 font-medium">
                      (No cobrar matrícula al estudiante)
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                  Cobrar valor de inscripción al estudiante
                </h4>
              </label>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block font-medium">Precio inscripción</span>
              <span
                className={`text-sm font-black font-mono ${
                  incluirInscripcion ? "text-blue-700" : "text-slate-400 line-through"
                }`}
              >
                ${(incluirInscripcion ? precioInscripcionEfectivo : cursoBaseMatricula).toLocaleString("es-EC", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {incluirInscripcion && (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">
                    Valor base asignado al curso:
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    ${cursoBaseMatricula.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Descuento con AjustePrecioPanel */}
                <AjustePrecioPanel
                  precioOriginal={cursoBaseMatricula}
                  precioActual={precioInscripcionEfectivo}
                  motivoActual={ajusteInscripcion.motivo}
                  expandido={ajusteInscripcion.expandido}
                  labelButton="Aplicar descuento a matrícula"
                  onToggleExpandir={() =>
                    setAjusteInscripcion((prev) => ({
                      ...prev,
                      expandido: !prev.expandido,
                      nuevoPrecio: prev.nuevoPrecio || String(cursoBaseMatricula),
                    }))
                  }
                  onCancelar={() =>
                    setAjusteInscripcion((prev) => ({ ...prev, expandido: false }))
                  }
                  onConfirmar={(nuevoPrecio, motivo) => {
                    setAjusteInscripcion({
                      expandido: false,
                      nuevoPrecio: String(nuevoPrecio),
                      motivo,
                    })
                    const pagoNum = parseFloat(pagoInscripcion) || 0
                    if (pagoNum > nuevoPrecio) {
                      setPagoInscripcion(String(nuevoPrecio))
                    }
                  }}
                />
              </div>

              {cursoBaseMatricula === 0 && ajusteInscripcion.nuevoPrecio === "" && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <span>Este curso no tiene una cuota de matrícula predeterminada ($0.00). Puedes aplicar un valor usando el botón de descuento/ajuste de arriba.</span>
                </div>
              )}

              {/* Input Monto a pagar de inscripción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Monto a cobrar ahora por matrícula
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={precioInscripcionEfectivo}
                      value={pagoInscripcion}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        if (val > precioInscripcionEfectivo) {
                          setPagoInscripcion(String(precioInscripcionEfectivo))
                          toast.warning(
                            `El pago no puede exceder el precio de inscripción ($${precioInscripcionEfectivo.toLocaleString()})`
                          )
                        } else {
                          setPagoInscripcion(e.target.value)
                        }
                      }}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border rounded-xl text-sm font-mono outline-none focus:border-[#fd761a] bg-white transition-all border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  {parseFloat(pagoInscripcion || "0") > 0 ? (
                    <div
                      className="w-full p-2.5 rounded-xl border flex items-center justify-between"
                      style={{
                        backgroundColor: "oklch(0.55 0.15 240 / 0.08)",
                        borderColor: "oklch(0.55 0.15 240 / 0.2)",
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: "oklch(0.45 0.15 240)" }}>
                        {inscripcionCubierta >= precioInscripcionEfectivo
                          ? "Matrícula cubierta completa"
                          : "Pago parcial de matrícula"}
                      </span>
                      <span className="text-xs font-bold font-mono" style={{ color: "oklch(0.45 0.15 240)" }}>
                        ${inscripcionCubierta.toLocaleString("es-EC", { minimumFractionDigits: 2 })} de ${precioInscripcionEfectivo.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      Saldo pendiente: ${precioInscripcionEfectivo.toLocaleString("es-EC", { minimumFractionDigits: 2 })} (se registrará como saldo por cobrar)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumen Total */}
      <div className="p-4 rounded-xl border space-y-3 bg-white shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium" style={{ color: COLORS.TEXT_MUTED }}>Total módulos del curso</span>
          <span className="font-bold text-base font-mono" style={{ color: COLORS.CHARCOAL }}>${totalPrecioModulos.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</span>
        </div>

        {incluirInscripcion && precioInscripcionEfectivo > 0 && (
          <>
            <div className="flex items-center justify-between text-sm pt-2 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="font-medium" style={{ color: COLORS.TEXT_MUTED }}>Inscripción / Matrícula</span>
              <span className="font-bold text-base font-mono" style={{ color: "oklch(0.65 0.15 75)" }}>${precioInscripcionEfectivo.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t font-bold" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span style={{ color: COLORS.CHARCOAL }}>Total Valor Solicitud (Curso + Inscripción)</span>
              <span className="font-extrabold text-base font-mono" style={{ color: COLORS.ACCENT }}>
                ${(totalPrecioModulos + precioInscripcionEfectivo).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}

        <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm" style={{ backgroundColor: "oklch(0.55 0.15 150 / 0.08)", borderColor: "oklch(0.55 0.15 150 / 0.25)" }}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "oklch(0.40 0.16 150)" }}>
              Total Ingresado en esta transacción
            </span>
            <span className="text-xs font-medium opacity-80 block mt-0.5" style={{ color: "oklch(0.35 0.14 150)" }}>
              {incluirInscripcion && inscripcionCubierta > 0
                ? `${modulosCubiertos}/${sorted.length} módulos cubiertos + matrícula`
                : `${modulosCubiertos}/${sorted.length} módulos cubiertos`}
            </span>
          </div>
          <span className="text-xl font-black font-mono" style={{ color: "oklch(0.35 0.18 150)" }}>
            ${totalIngresado.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
})
