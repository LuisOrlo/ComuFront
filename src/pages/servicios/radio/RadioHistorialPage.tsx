import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight02Icon,
  Calendar03Icon, UserIcon, Clock01Icon, Money01Icon,
  CheckmarkCircle04Icon, Cancel01Icon, RadioIcon,
  ArrowDown01Icon, Search01Icon, Add01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { radioService, type ReservaRadio, type TarifaRadio } from "@/services/radio.service"
import { ReservaForm } from "./components/ReservaForm"
import { toast } from "sonner"

const ESTADO_LABELS: Record<string, string> = {
  reservado: "Pendiente", confirmado: "Confirmado", en_progreso: "En progreso", completado: "Finalizado", cancelado: "Cancelado",
}

const ESTADO_COLORS: Record<string, string> = {
  reservado: "bg-orange-100 text-orange-700 border-orange-200",
  confirmado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  en_progreso: "bg-blue-100 text-blue-700 border-blue-200",
  completado: "bg-gray-100 text-gray-500 border-gray-300",
  cancelado: "bg-red-100 text-red-600 border-red-200",
}

const STRIP_COLORS: Record<string, string> = {
  reservado: "bg-orange-500", confirmado: "bg-emerald-500", en_progreso: "bg-blue-500", completado: "bg-gray-500", cancelado: "bg-red-500",
}

export function RadioHistorialPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [reservas, setReservas] = useState<ReservaRadio[]>([])
  const [tarifas, setTarifas] = useState<TarifaRadio[]>([])
  const [reservaModalOpen, setReservaModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "todos")
  const [fechaDesde, setFechaDesde] = useState(searchParams.get("fecha_desde") || "")
  const [fechaHasta, setFechaHasta] = useState(searchParams.get("fecha_hasta") || "")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const loadHistorial = useCallback(async () => {
    setLoading(true)
    try {
      const filters: Record<string, string | number> = { page, per_page: 15 }
      if (filtroEstado && filtroEstado !== "todos") filters.estado = filtroEstado
      if (fechaDesde) filters.fecha_desde = fechaDesde
      if (fechaHasta) filters.fecha_hasta = fechaHasta
      const res = await radioService.getReservas(filters)
      setReservas(res.data)
      setMeta(res.meta)

      const newExpanded = new Set<string>()
      res.data.forEach((r: ReservaRadio) => {
        if (r.estado !== "completado" && r.estado !== "cancelado") newExpanded.add(r.id)
      })
      setExpanded(newExpanded)
    } catch { toast.error("Error al cargar historial") }
    finally { setLoading(false) }
  }, [page, filtroEstado, fechaDesde, fechaHasta])

  useEffect(() => {
    loadHistorial()
    radioService.getTarifas().then(setTarifas).catch(() => {})
  }, [loadHistorial])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    let list = reservas
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => {
        const cliente = r.cliente_externo
          ? `${r.cliente_externo.nombres || ""}`.toLowerCase()
          : r.persona ? `${r.persona.nombres} ${r.persona.apellidos}`.toLowerCase() : ""
        const tarifa = (r.tarifa?.nombre || "").toLowerCase()
        return cliente.includes(q) || tarifa.includes(q)
      })
    }
    return list
  }, [reservas, search])

  const getCliente = (r: ReservaRadio) => {
    if (r.persona) return `${r.persona.nombres} ${r.persona.apellidos}`
    if (r.cliente_externo) return r.cliente_externo.nombres || "—"
    return "—"
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    setSavingMap(prev => ({ ...prev, [id]: true }))
    try {
      await radioService.cambiarEstado(id, nuevoEstado)
      toast.success(`Estado cambiado a ${ESTADO_LABELS[nuevoEstado] || nuevoEstado}`)
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado as ReservaRadio["estado"] } : r))
    } catch { toast.error("Error al cambiar estado") }
    finally { setSavingMap(prev => ({ ...prev, [id]: false })) }
  }

  const buildDetailHref = (r: ReservaRadio) => {
    const p = new URLSearchParams()
    if (filtroEstado !== "todos") p.set("estado", filtroEstado)
    if (fechaDesde) p.set("fecha_desde", fechaDesde)
    if (fechaHasta) p.set("fecha_hasta", fechaHasta)
    if (search) p.set("search", search)
    const qs = p.toString()
    return `/servicios/radio/reservas/${r.id}${qs ? `?${qs}` : ""}`
  }

  const stats = {
    total: meta.total,
    pendientes: reservas.filter(r => r.estado === "reservado" || r.estado === "confirmado" || r.estado === "en_progreso").length,
    completados: reservas.filter(r => r.estado === "completado").length,
    cancelados: reservas.filter(r => r.estado === "cancelado").length,
  }

  const statCards = [
    { key: "todos", label: "Total", value: stats.total, color: "bg-gray-100 text-gray-500", icon: RadioIcon },
    { key: "activos", label: "Activos", value: stats.pendientes, color: "bg-amber-100 text-amber-600", icon: Clock01Icon },
    { key: "completado", label: "Finalizados", value: stats.completados, color: "bg-green-100 text-green-600", icon: CheckmarkCircle04Icon },
    { key: "cancelado", label: "Cancelados", value: stats.cancelados, color: "bg-red-100 text-red-600", icon: Cancel01Icon },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full" style={{ borderColor: COLORS.ACCENT }} />
          <p className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 border-b bg-white sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-35" style={{ color: COLORS.CHARCOAL }}>Servicios</p>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: COLORS.CHARCOAL }}>Radio</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setReservaModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 active:scale-95"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Nueva Reserva
              </button>
              <button
                onClick={() => navigate("/servicios/radio/tarifas")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 active:scale-95"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              >
                <HugeiconsIcon icon={Money01Icon} size={14} />
                Tarifas
              </button>
              <button
                onClick={() => navigate("/servicios/radio/agenda")}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={Calendar03Icon} size={14} />
                Agenda
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-5">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(card => {
              const isActive = filtroEstado === card.key
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => { setFiltroEstado(isActive ? "todos" : card.key); setPage(1) }}
                  className={cn(
                    "bg-white rounded-2xl border p-4 flex items-center gap-3 transition-all active:scale-[0.98] text-left cursor-pointer hover:border-orange-300 hover:shadow-md",
                    isActive ? "shadow-sm" : ""
                  )}
                  style={{ borderColor: isActive ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }}
                >
                  <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", card.color.split(" ")[0])}>
                    <HugeiconsIcon icon={card.icon} size={18} className={card.color.split(" ")[1]} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{card.label}</p>
                    <p className="text-lg font-black" style={{ color: isActive ? COLORS.ACCENT : COLORS.CHARCOAL }}>
                      {card.value}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm">
              <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente o tarifa..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-xl border text-xs font-medium outline-none bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-xl border text-xs font-medium outline-none bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
              </div>
              <p className="text-sm font-bold opacity-30">No hay reservas en el historial</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => {
                const isExpanded = expanded.has(r.id)
                const isCompleted = r.estado === "completado" || r.estado === "cancelado"
                return (
                  <div key={r.id} className="bg-white rounded-2xl border hover:shadow-sm transition-all overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className={cn("h-1.5 w-full", STRIP_COLORS[r.estado] || "bg-gray-400")} />

                    <div
                      className={cn("px-5 py-4 flex items-start gap-3", isCompleted ? "cursor-pointer hover:bg-gray-50/50 transition-colors" : "border-b")}
                      onClick={() => isCompleted && toggleExpand(r.id)}
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    >
                      <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                        r.estado === "confirmado" ? "bg-emerald-100" : r.estado === "en_progreso" ? "bg-blue-100" : r.estado === "completado" ? "bg-gray-100" : r.estado === "cancelado" ? "bg-red-100" : "bg-orange-100"
                      )}>
                        <HugeiconsIcon icon={Calendar03Icon} size={16} className={cn(
                          r.estado === "confirmado" ? "text-emerald-600" : r.estado === "en_progreso" ? "text-blue-600" : r.estado === "completado" ? "text-gray-500" : r.estado === "cancelado" ? "text-red-600" : "text-orange-600"
                        )} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                          {new Date(r.fecha_reserva + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                        </p>
                        <p className="text-[10px] opacity-40 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{r.hora_inicio.substring(0, 5)} – {r.hora_fin.substring(0, 5)}</span>
                          <span className="opacity-30">·</span>
                          <span className="font-medium opacity-60">{getCliente(r)}</span>
                          <span className="opacity-30">·</span>
                          <span className="font-medium opacity-60">{r.tarifa?.nombre || "Sin tarifa"}</span>
                          <span className="opacity-30">·</span>
                          <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>${r.precio_total.toFixed(2)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={r.estado}
                          onChange={e => { e.stopPropagation(); handleCambiarEstado(r.id, e.target.value) }}
                          disabled={savingMap[r.id]}
                          className={cn("px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border outline-none cursor-pointer transition-opacity", savingMap[r.id] ? "opacity-50" : "", ESTADO_COLORS[r.estado] || "bg-gray-100")}
                        >
                          {Object.entries(ESTADO_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        {isCompleted && (
                          <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            size={14}
                            className="opacity-30 shrink-0 transition-transform"
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                          />
                        )}
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                                <div className="size-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" /></div>
                                <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cliente</p><p className="text-xs font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{getCliente(r)}</p></div>
                              </div>
                              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                                <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={Money01Icon} size={14} className="text-emerald-500" /></div>
                                <div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio total</p><p className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>${r.precio_total.toFixed(2)}</p></div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {(() => {
                                const esPagado = r.cuenta_por_cobrar?.estado === 'pagado' || Number(r.cuenta_por_cobrar?.saldo_pendiente ?? (r.precio_total - (r.cuenta_por_cobrar?.monto_abonado ?? 0))) <= 0
                                return (
                                  <button onClick={() => navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, { state: { tipo: "radio", servicioId: r.id, cuentaId: r.cuenta_por_cobrar?.id, nombre: getCliente(r), montoTotal: Number(r.precio_total) || 0, montoSaldo: r.cuenta_por_cobrar ? Number(r.cuenta_por_cobrar.saldo_pendiente) : Number(r.precio_total) || 0, nombreServicio: `Reserva de Radio` } })}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap shrink-0",
                                      esPagado ? "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100" : "text-white hover:opacity-90"
                                    )}
                                    style={esPagado ? {} : { backgroundColor: COLORS.ACCENT }}>
                                    <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                    {esPagado ? "Ver pagos" : "Registrar pago"}
                                  </button>
                                )
                              })()}
                              {!isCompleted && (
                                <button onClick={() => navigate(buildDetailHref(r))}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:bg-gray-50 active:scale-95"
                                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                                  <HugeiconsIcon icon={ArrowRight02Icon} size={11} />
                                  Ver detalle completo
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Página {meta.current_page} de {meta.last_page} ({meta.total} reservas)</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Anterior</button>
                <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReservaForm
        isOpen={reservaModalOpen}
        onClose={() => setReservaModalOpen(false)}
        tarifas={tarifas}
        onSaved={() => { setReservaModalOpen(false); loadHistorial(); }}
      />
    </div>
  )
}
