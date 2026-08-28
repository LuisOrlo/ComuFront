import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Money01Icon,
  CheckmarkCircle04Icon,
  PackageIcon,
  Cancel01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  Search01Icon,
  Add01Icon,
  Home02Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { podcastService, type ReservaPodcast } from "@/services/podcast.service"
import { toast } from "sonner"

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-blue-100 text-blue-700 border-blue-200",
  confirmado: "bg-amber-100 text-amber-700 border-amber-200",
  en_progreso: "bg-indigo-100 text-indigo-700 border-indigo-200",
  completado: "bg-green-100 text-green-700 border-green-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente", confirmado: "Confirmado", en_progreso: "En progreso", completado: "Completado", cancelado: "Cancelado",
}

const STRIP_COLORS: Record<string, string> = {
  pendiente: "bg-blue-500",
  confirmado: "bg-amber-500",
  en_progreso: "bg-indigo-500",
  completado: "bg-green-500",
  cancelado: "bg-red-500",
}

export function HistorialPodcastPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [reservas, setReservas] = useState<ReservaPodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "todos")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    podcastService.getReservas()
      .then(data => {
        setReservas(data)
        const newExpanded = new Set<string>()
        data.forEach((r: ReservaPodcast) => {
          if (r.estado !== "completado" && r.estado !== "cancelado") newExpanded.add(r.id)
        })
        setExpanded(newExpanded)
      })
      .catch(() => toast.error("Error al cargar historial"))
      .finally(() => setLoading(false))
  }, [])

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
    if (filtroEstado === "activos") list = list.filter(r => r.estado === "pendiente" || r.estado === "confirmado" || r.estado === "en_progreso")
    else if (filtroEstado !== "todos") list = list.filter(r => r.estado === filtroEstado)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => {
        const cliente = r.cliente_externo
          ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.toLowerCase()
          : r.persona ? `${r.persona.nombres} ${r.persona.apellidos}`.toLowerCase() : ""
        const titulo = (r.titulo || r.paquete?.nombre || "").toLowerCase()
        return cliente.includes(q) || titulo.includes(q)
      })
    }
    return list.sort((a, b) => new Date(b.fecha_reserva).getTime() - new Date(a.fecha_reserva).getTime())
  }, [reservas, filtroEstado, search])

  const getCliente = (r: ReservaPodcast) => {
    if (r.persona) return `${r.persona.nombres} ${r.persona.apellidos}`
    if (r.cliente_externo) return `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`
    return "—"
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    setSavingMap(prev => ({ ...prev, [id]: true }))
    try {
      await podcastService.cambiarEstado(id, nuevoEstado)
      toast.success(`Estado cambiado a ${ESTADO_LABELS[nuevoEstado] || nuevoEstado}`)
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado as ReservaPodcast["estado"] } : r))
    } catch { toast.error("Error al cambiar estado") }
    finally { setSavingMap(prev => ({ ...prev, [id]: false })) }
  }

  const buildDetailHref = (r: ReservaPodcast) => {
    const p = new URLSearchParams()
    if (filtroEstado !== "todos") p.set("estado", filtroEstado)
    if (search) p.set("search", search)
    const qs = p.toString()
    return `/servicios/podcast/reservas/${r.id}${qs ? `?${qs}` : ""}`
  }

  const stats = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === "pendiente" || r.estado === "confirmado" || r.estado === "en_progreso").length,
    completados: reservas.filter(r => r.estado === "completado").length,
    cancelados: reservas.filter(r => r.estado === "cancelado").length,
  }

  const statCards = [
    { key: "todos", label: "Total", value: stats.total, color: "bg-gray-100 text-gray-500", icon: Home02Icon },
    { key: "activos", label: "Activos", value: stats.pendientes, color: "bg-amber-100 text-amber-600", icon: Clock01Icon },
    { key: "completado", label: "Completados", value: stats.completados, color: "bg-green-100 text-green-600", icon: CheckmarkCircle04Icon },
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
              <h1 className="text-2xl font-black tracking-tight" style={{ color: COLORS.CHARCOAL }}>Podcast</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate("/servicios/podcast/paquetes")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 active:scale-95"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              >
                <HugeiconsIcon icon={PackageIcon} size={14} />
                Paquetes
              </button>
              <button
                onClick={() => navigate("/servicios/podcast/nueva")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 active:scale-95"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Nueva Reserva
              </button>
              <button
                onClick={() => navigate("/servicios/podcast/agenda")}
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
                  onClick={() => setFiltroEstado(isActive ? "todos" : card.key)}
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

          <div className="relative max-w-sm">
            <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente o reserva..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100">
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
              </div>
              <p className="text-sm font-bold opacity-30">Sin reservas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => {
                const isExpanded = expanded.has(r.id)
                const isCompleted = r.estado === "completado" || r.estado === "cancelado"
                return (
                  <div key={r.id}
                    className="bg-white rounded-2xl border hover:shadow-sm transition-all overflow-hidden"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className={cn("h-1.5 w-full", STRIP_COLORS[r.estado] || "bg-gray-400")} />

                    <div
                      className={cn("px-5 py-4 flex items-start gap-3", isCompleted ? "cursor-pointer hover:bg-gray-50/50 transition-colors" : "border-b")}
                      onClick={() => isCompleted && toggleExpand(r.id)}
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    >
                      <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                        r.estado === "confirmado" ? "bg-amber-100" :
                        r.estado === "completado" ? "bg-green-100" :
                        r.estado === "en_progreso" ? "bg-indigo-100" :
                        r.estado === "cancelado" ? "bg-red-100" :
                        "bg-blue-100"
                      )}>
                        <HugeiconsIcon icon={Calendar03Icon} size={16}
                          className={cn(
                            r.estado === "confirmado" ? "text-amber-600" :
                            r.estado === "completado" ? "text-green-600" :
                            r.estado === "en_progreso" ? "text-indigo-600" :
                            r.estado === "cancelado" ? "text-red-600" :
                            "text-blue-600"
                          )} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                          {r.titulo || r.paquete?.nombre || "Sin título"}
                        </p>
                        <p className="text-[10px] opacity-40 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{new Date(r.fecha_reserva).toLocaleDateString("es-ES", { day: "numeric", month: "long" })} · {r.hora_inicio?.substring(0, 5)} – {r.hora_fin?.substring(0, 5)}</span>
                          <span className="opacity-30">·</span>
                          <span className="font-medium opacity-60">{getCliente(r)}</span>
                          <span className="opacity-30">·</span>
                          <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>${Number(r.precio_total).toFixed(2)}</span>
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
                                <div className="size-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                  <HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cliente</p>
                                  <p className="text-xs font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                                    {getCliente(r)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                                <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                  <HugeiconsIcon icon={Money01Icon} size={14} className="text-emerald-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio total</p>
                                  <p className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>
                                    ${Number(r.precio_total).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {(() => {
                                const esPagado = r.cuenta_por_cobrar?.estado === 'pagado' || Number(r.cuenta_por_cobrar?.saldo_pendiente ?? (r.precio_total - (r.cuenta_por_cobrar?.monto_abonado ?? 0))) <= 0
                                return (
                                  <button onClick={() => navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, { state: { tipo: "podcast", servicioId: r.id, cuentaId: r.cuenta_por_cobrar?.id, nombre: getCliente(r), montoTotal: Number(r.precio_total) || 0, montoSaldo: r.cuenta_por_cobrar ? Number(r.cuenta_por_cobrar.saldo_pendiente) : Number(r.precio_total) || 0, nombreServicio: r.titulo || r.paquete?.nombre || "Podcast" } })}
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
                                  <HugeiconsIcon icon={ArrowRight01Icon} size={11} />
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
        </div>
      </div>
    </div>
  )
}
