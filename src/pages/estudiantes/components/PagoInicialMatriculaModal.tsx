import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Coins02Icon, Edit01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"
import api from "@/services/auth.service"

interface LineaPagoData {
  id: string
  modulo_id: string
  nombre_modulo: string
  numero_orden: number
  monto_original: number
  monto_ajustado: number
  monto_abonado: number
}

interface PagoInicialMatriculaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lineasPagoIds: string[]
  matriculaId: string
  cursoNombre: string
  estudianteNombre?: string
  estudianteCedula?: string
  onCompleted: () => void
}

export function PagoInicialMatriculaModal({
  open,
  onOpenChange,
  lineasPagoIds,
  matriculaId,
  cursoNombre,
  estudianteNombre,
  estudianteCedula,
  onCompleted,
}: PagoInicialMatriculaModalProps) {
  const [multiModulo, setMultiModulo] = useState(false)
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [saving, setSaving] = useState(false)
  const [lineas, setLineas] = useState<LineaPagoData[]>([])

  // Ajustes de precio por línea
  const [ajustes, setAjustes] = useState<Record<string, { expandido: boolean; nuevoPrecio: string; motivo: string }>>({})

  const loadLineas = async () => {
    try {
      const res = await api.get(`/finanzas/matriculas/${matriculaId}/lineas-pago`)
      setLineas(res.data.datos || [])
    } catch {
      setLineas(lineasPagoIds.map((id, i) => ({
        id,
        modulo_id: id,
        nombre_modulo: `M\u00f3dulo ${i + 1}`,
        numero_orden: i + 1,
        monto_original: 0,
        monto_ajustado: 0,
        monto_abonado: 0,
      })))
    }
  }

  if (open && lineas.length === 0) {
    loadLineas()
  }

  const lineasVisibles = multiModulo ? lineas : [lineas[0]]

  const toggleAjuste = (lineaId: string) => {
    setAjustes(prev => {
      const actual = prev[lineaId]
      if (actual?.expandido) {
        return { ...prev, [lineaId]: { ...actual, expandido: false } }
      }
      const linea = lineas.find(l => l.id === lineaId)
      return {
        ...prev,
        [lineaId]: {
          expandido: true,
          nuevoPrecio: String(linea?.monto_ajustado ?? 0),
          motivo: actual?.motivo ?? "",
        },
      }
    })
  }

  const confirmarAjuste = (lineaId: string) => {
    const a = ajustes[lineaId]
    if (!a) return
    setLineas(prev => prev.map(l => l.id === lineaId ? { ...l, monto_ajustado: parseFloat(a.nuevoPrecio) || 0 } : l))
    setAjustes(prev => ({ ...prev, [lineaId]: { ...a, expandido: false } }))
  }

  const handleRegistrar = async () => {
    setSaving(true)
    try {
      const pagos = lineasVisibles
        .filter(l => {
          const monto = parseFloat(montos[l.id] || "0")
          return monto > 0
        })
        .map(l => {
          const base: Record<string, unknown> = {
            linea_pago_modulo_id: l.id,
            monto: parseFloat(montos[l.id] || "0"),
            metodo_pago: metodoPago,
            fecha_pago: new Date().toISOString(),
          }
          const ajuste = ajustes[l.id]
          if (ajuste && !ajuste.expandido && parseFloat(ajuste.nuevoPrecio || "0") !== l.monto_ajustado) {
            base.monto_ajustado = parseFloat(ajuste.nuevoPrecio || "0")
            base.motivo_ajuste = ajuste.motivo
          }
          return base
        })

      if (pagos.length === 0) {
        toast.error("Ingresa al menos un monto para registrar el pago")
        setSaving(false)
        return
      }

      await api.post("/finanzas/pagos-iniciales", {
        matricula_id: matriculaId,
        pagos,
      })

      toast.success(`Pago${pagos.length > 1 ? 's' : ''} registrado${pagos.length > 1 ? 's' : ''}`)
      onOpenChange(false)
      resetForm()
      onCompleted()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje
      toast.error(msg || "Error al registrar pago")
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setMontos({})
    setMetodoPago("efectivo")
    setMultiModulo(false)
    setLineas([])
    setAjustes({})
  }

  const sorted = [...lineasVisibles].sort((a, b) => a.numero_orden - b.numero_orden)
  const totalModulos = lineas.length

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? "" : "hidden"}`}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50 sticky top-0 z-10 rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-black text-gray-900">Registrar pago inicial</h2>
            <p className="text-sm text-gray-500 mt-1">{cursoNombre}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        <div className="p-8 space-y-5">
          {/* Zona superior: resumen compacto */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estudiante</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{estudianteNombre || "—"}</p>
              {estudianteCedula && <p className="text-xs text-gray-500">{estudianteCedula}</p>}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Curso</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{cursoNombre}</p>
              <p className="text-xs text-gray-500">{totalModulos} m\u00f3dulo{totalModulos !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Zona inferior: tarjetas de módulos */}
          {sorted.map((linea) => {
            const monto = parseFloat(montos[linea.id] || "0")
            const ajuste = ajustes[linea.id]
            const precioEfectivo = !ajuste?.expandido && ajuste?.nuevoPrecio
              ? parseFloat(ajuste.nuevoPrecio) || linea.monto_ajustado
              : linea.monto_ajustado
            const pagado = monto > 0 && monto >= precioEfectivo
            const abonado = monto > 0 && monto < precioEfectivo
            const tieneAjuste = ajuste && !ajuste.expandido && parseFloat(ajuste.nuevoPrecio || "0") !== linea.monto_original

            let indicadorColor = "bg-gray-100"
            let indicadorTexto = ""
            if (pagado) { indicadorColor = "bg-emerald-500"; indicadorTexto = "PAGADO" }
            else if (abonado) { indicadorColor = "bg-amber-500"; indicadorTexto = "ABONO" }

            return (
              <div key={linea.id} className="p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                      M\u00f3dulo {linea.numero_orden || "—"}
                    </span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{linea.nombre_modulo}</p>
                  </div>
                  <div className="text-right">
                    {tieneAjuste ? (
                      <>
                        <span className="text-xs text-gray-400 line-through">${linea.monto_original.toLocaleString()}</span>
                        <span className="text-sm font-black text-gray-700 ml-1">${precioEfectivo.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-sm font-black text-gray-700">${precioEfectivo.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* Ajuste de precio inline */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleAjuste(linea.id)}
                    className="text-[11px] font-medium hover:underline inline-flex items-center gap-1"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    <HugeiconsIcon icon={Edit01Icon} size={11} />
                    {tieneAjuste ? "Ajuste aplicado" : "Modificar precio para este estudiante"}
                  </button>

                  {ajuste?.expandido && (
                    <div className="mt-2 p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nuevo precio</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ajuste.nuevoPrecio}
                          onChange={e => setAjustes(prev => ({ ...prev, [linea.id]: { ...ajuste, nuevoPrecio: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500 mt-1 bg-white"
                          placeholder={String(linea.monto_original)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Motivo del ajuste</label>
                        <input
                          type="text"
                          value={ajuste.motivo}
                          onChange={e => setAjustes(prev => ({ ...prev, [linea.id]: { ...ajuste, motivo: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 mt-1 bg-white"
                          placeholder="Ej: descuento por pronto pago"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => confirmarAjuste(linea.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
                          style={{ backgroundColor: COLORS.ACCENT }}
                        >
                          Confirmar ajuste
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAjuste(linea.id)}
                          className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campo de monto + indicador */}
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={montos[linea.id] || ""}
                      onChange={e => setMontos(prev => ({ ...prev, [linea.id]: e.target.value }))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                  </div>
                  {indicadorTexto && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl text-white whitespace-nowrap ${indicadorColor}`}>
                      {indicadorTexto}
                    </span>
                  )}
                  {abonado && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg whitespace-nowrap">
                      ${(precioEfectivo - monto).toLocaleString()} pend.
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {lineas.length > 1 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={multiModulo}
                onChange={() => setMultiModulo(!multiModulo)}
                className="size-4 rounded border-gray-300"
              />
              <span className="text-xs font-medium text-gray-600">Pagar varios m\u00f3dulos en esta operaci\u00f3n</span>
            </label>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">M\u00e9todo de pago</label>
            <select
              value={metodoPago}
              onChange={e => setMetodoPago(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="deposito">Dep\u00f3sito</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Omitir
            </button>
            <button
              type="button"
              onClick={handleRegistrar}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-60"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <HugeiconsIcon icon={Coins02Icon} size={16} />
              {saving ? "Registrando..." : "Registrar pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
