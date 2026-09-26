import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  CheckmarkCircle04Icon,
  PackageIcon,
  Cancel01Icon,
  Search01Icon,
  Add01Icon,
  ArrowDown01Icon,
  Layers01Icon,
  Mic01Icon,
  ArrowReloadHorizontalIcon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { cn, formatCalendarDate } from "@/lib/utils"
import { podcastService, type ReservaPodcast, type PaquetePodcast } from "@/services/podcast.service"
import { toast } from "sonner"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; dot: string; text: string }
> = {
  pendiente: {
    label: "Pendiente",
    bg: "bg-blue-50 border-blue-200/70",
    dot: "bg-blue-600",
    text: "text-blue-800",
  },
  confirmado: {
    label: "Confirmado",
    bg: "bg-amber-50 border-amber-200/70",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  en_progreso: {
    label: "En progreso",
    bg: "bg-indigo-50 border-indigo-200/70",
    dot: "bg-indigo-600",
    text: "text-indigo-800",
  },
  completado: {
    label: "Completado",
    bg: "bg-emerald-50 border-emerald-200/70",
    dot: "bg-emerald-600",
    text: "text-emerald-800",
  },
  cancelado: {
    label: "Cancelado",
    bg: "bg-red-50 border-red-200/70",
    dot: "bg-red-500",
    text: "text-red-800",
  },
}

function getDurationText(horaInicio?: string, horaFin?: string): string {
  if (!horaInicio || !horaFin) return ""
  const [h1, m1] = horaInicio.slice(0, 5).split(":").map(Number)
  const [h2, m2] = horaFin.slice(0, 5).split(":").map(Number)
  if (isNaN(h1) || isNaN(h2)) return ""
  const mins = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0))
  if (mins <= 0) return ""
  const hrs = mins / 60
  return Number.isInteger(hrs) ? `${hrs}h` : `${hrs.toFixed(1)}h`
}

export function HistorialPodcastPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [reservas, setReservas] = useState<ReservaPodcast[]>([])
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "todos")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [resData, paqData] = await Promise.all([
        podcastService.getReservas(),
        podcastService.getPaquetes().catch(() => []),
      ])
      setReservas(resData)
      setPaquetes(paqData)
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    let list = reservas
    if (filtroEstado === "activos") {
      list = list.filter(
        (r) => r.estado === "pendiente" || r.estado === "confirmado" || r.estado === "en_progreso",
      )
    } else if (filtroEstado !== "todos") {
      list = list.filter((r) => r.estado === filtroEstado)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r) => {
        const cliente = r.cliente_externo
          ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.toLowerCase()
          : r.persona
            ? `${r.persona.nombres} ${r.persona.apellidos}`.toLowerCase()
            : ""
        const titulo = (r.titulo || r.paquete?.nombre || "").toLowerCase()
        return cliente.includes(q) || titulo.includes(q)
      })
    }

    return list.sort((a, b) => {
      const dateDiff = (b.fecha_reserva || "").localeCompare(a.fecha_reserva || "")
      if (dateDiff !== 0) return dateDiff
      return (b.hora_inicio || "").localeCompare(a.hora_inicio || "")
    })
  }, [reservas, filtroEstado, search])

  const getCliente = (r: ReservaPodcast) => {
    if (r.persona) return `${r.persona.nombres} ${r.persona.apellidos}`.trim()
    if (r.cliente_externo) return `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    setSavingMap((prev) => ({ ...prev, [id]: true }))
    try {
      await podcastService.cambiarEstado(id, nuevoEstado)
      toast.success(`Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
      setReservas((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, estado: nuevoEstado as ReservaPodcast["estado"] } : r,
        ),
      )
    } catch {
      toast.error("Error al cambiar estado")
    } finally {
      setSavingMap((prev) => ({ ...prev, [id]: false }))
    }
  }

  const buildDetailHref = (r: ReservaPodcast) => {
    const p = new URLSearchParams()
    if (filtroEstado !== "todos") p.set("estado", filtroEstado)
    if (search) p.set("search", search)
    const qs = p.toString()
    return `/servicios/podcast/reservas/${r.id}${qs ? `?${qs}` : ""}`
  }

  const stats = useMemo(() => {
    return {
      total: reservas.length,
      pendientes: reservas.filter(
        (r) => r.estado === "pendiente" || r.estado === "confirmado" || r.estado === "en_progreso",
      ).length,
      completados: reservas.filter((r) => r.estado === "completado").length,
      cancelados: reservas.filter((r) => r.estado === "cancelado").length,
    }
  }, [reservas])

  const statCards = [
    {
      key: "todos",
      label: "TOTAL RESERVAS",
      value: stats.total,
      subtitle: "Periodo actual",
      icon: Layers01Icon,
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      key: "activos",
      label: "ACTIVAS / EN CURSO",
      value: stats.pendientes,
      subtitle: (
        <span className="inline-flex items-center gap-1 text-[11px] text-[#9d4300] bg-[#ffdbca]/60 px-2 py-0.5 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]" />
          En progreso
        </span>
      ),
      icon: Clock01Icon,
      iconBg: "bg-[#ffdbca] text-[#9d4300]",
    },
    {
      key: "completado",
      label: "COMPLETADAS",
      value: stats.completados,
      subtitle: "Finalizadas",
      icon: CheckmarkCircle04Icon,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "cancelado",
      label: "CANCELADAS",
      value: stats.cancelados,
      subtitle: "Canceladas",
      icon: Cancel01Icon,
      iconBg: "bg-red-50 text-red-600",
    },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaPodcast[]> = {}
    filtered.forEach((r) => {
      const dateKey = formatCalendarDate(r.fecha_reserva, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).toUpperCase()
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(r)
    })
    return Object.entries(groups)
  }, [filtered])

  useEffect(() => {
    if (Object.keys(expandedGroups).length === 0 && groupedByDate.length > 0) {
      const initial: Record<string, boolean> = {}
      groupedByDate.forEach(([date]) => {
        initial[date] = true
      })
      setExpandedGroups(initial)
    }
  }, [groupedByDate, expandedGroups])

  const toggleGroup = (date: string) => {
    setExpandedGroups((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  const getGroupTotal = (items: ReservaPodcast[]) => {
    return items.reduce((sum, r) => sum + Number(r.precio_total || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando historial de podcast...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header de Página */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              SERVICIOS
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
              Cabina de Podcast
            </h1>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/servicios/podcast/paquetes")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={PackageIcon} size={17} className="text-slate-500" />
              <span>Paquetes</span>
            </button>
            <button
              onClick={() => navigate("/servicios/podcast/nueva")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Add01Icon} size={17} className="text-slate-500" />
              <span>Nueva Reserva</span>
            </button>
            <button
              onClick={() => navigate("/servicios/podcast/agenda")}
              className="h-10 px-5 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Calendar03Icon} size={17} />
              <span>Agenda</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics (4-Column Bento Card Array) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const isActive = filtroEstado === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setFiltroEstado(isActive ? "todos" : card.key)}
                className={cn(
                  "p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between h-[108px] text-left transition-all hover:shadow-md cursor-pointer active:scale-[0.99]",
                  isActive ? "ring-2 ring-[#fd761a]/30 border-[#fd761a]" : "",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    {card.label}
                  </span>
                  <div
                    className={cn(
                      "size-7 rounded-lg flex items-center justify-center shrink-0",
                      card.iconBg,
                    )}
                  >
                    <HugeiconsIcon icon={card.icon} size={16} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                  {typeof card.subtitle === "string" ? (
                    <span className="text-xs text-slate-500 font-medium">{card.subtitle}</span>
                  ) : (
                    card.subtitle
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* History Workspace Module */}
        <div className="flex flex-col gap-4 mt-2">
          {/* History Section Header & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">Historial de Reservas</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-xs font-semibold">
                {filtered.length}
              </span>
            </div>

            {/* Filter Controls (40px Height) */}
            <div className="flex items-center gap-2.5">
              <div className="h-10 bg-white border border-slate-200 rounded-xl px-3.5 flex items-center gap-2 shadow-xs w-full sm:w-72 focus-within:ring-2 focus-within:ring-[#fd761a]/25 focus-within:border-[#fd761a] transition-all">
                <HugeiconsIcon icon={Search01Icon} size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente, título o paquete…"
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-700 p-0.5"
                    title="Limpiar búsqueda"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
              </div>

              <button
                onClick={loadData}
                className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-xs shrink-0 active:scale-95 cursor-pointer"
                title="Actualizar datos"
                type="button"
              >
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={16} />
              </button>
            </div>
          </div>

          {/* Group by Date Card Assembly */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-14 text-center space-y-3 shadow-xs">
              <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <HugeiconsIcon icon={Mic01Icon} size={28} />
              </div>
              <p className="font-bold text-sm text-slate-800">
                {search ? `Sin resultados para "${search}"` : "No hay reservaciones registradas"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba ajustando la búsqueda o registra una nueva reserva desde el botón superior.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByDate.map(([date, items]) => {
                const isOpen = expandedGroups[date] !== false
                const dayTotal = getGroupTotal(items)

                return (
                  <div
                    key={date}
                    className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90"
                  >
                    {/* Date Group Header Bar */}
                    <div
                      onClick={() => toggleGroup(date)}
                      className="bg-slate-50/80 px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors select-none border-b border-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                          <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="text-slate-400" />
                        </motion.div>
                        <div className="size-6 rounded-md bg-slate-200/70 flex items-center justify-center text-slate-600">
                          <HugeiconsIcon icon={Calendar03Icon} size={14} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-slate-900 font-bold">
                          {date}
                        </span>
                        <span className="inline-block size-1 rounded-full bg-slate-300" />
                        <span className="text-xs text-slate-500">
                          {items.length} {items.length === 1 ? "reserva" : "reservas"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-white px-3 py-1 rounded-md shadow-2xs border border-slate-200/70 flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">Total día:</span>
                          <span className="text-xs text-slate-900 font-bold">
                            ${dayTotal.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reservation Rows Container */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col divide-y divide-slate-100">
                            {items.map((r) => {
                              const estado = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.pendiente
                              const cliente = getCliente(r)
                              const duration = getDurationText(r.hora_inicio, r.hora_fin)

                              const cuenta = r.cuenta_por_cobrar
                              const saldo = cuenta
                                ? Number(cuenta.saldo_pendiente)
                                : Number(r.precio_total) || 0
                              const isPagado =
                                cuenta?.estado === "pagado" ||
                                saldo <= 0 ||
                                (cuenta && Number(cuenta.monto_abonado) >= Number(r.precio_total))
                              const isAbonado =
                                !isPagado && cuenta && Number(cuenta.monto_abonado) > 0

                              return (
                                <div
                                  key={r.id}
                                  className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors duration-150 group"
                                >
                                  {/* Left Column */}
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="size-11 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#fd761a] group-hover:text-white transition-colors">
                                      <HugeiconsIcon icon={Mic01Icon} size={20} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => navigate(buildDetailHref(r))}
                                          className="text-[15px] leading-snug font-semibold text-slate-900 group-hover:text-[#fd761a] truncate transition-colors text-left cursor-pointer"
                                        >
                                          {cliente}
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                          <HugeiconsIcon
                                            icon={PackageIcon}
                                            size={14}
                                            className="text-[#fd761a]"
                                          />
                                          <strong className="font-medium text-slate-800">
                                            {r.titulo || r.paquete?.nombre || "Podcast"}
                                          </strong>
                                        </span>
                                        <span className="inline-block size-1 rounded-full bg-slate-300" />
                                        <span className="inline-flex items-center gap-1">
                                          <HugeiconsIcon
                                            icon={Clock01Icon}
                                            size={14}
                                            className="text-slate-400"
                                          />
                                          {r.hora_inicio?.substring(0, 5)} – {r.hora_fin?.substring(0, 5)}
                                          {duration ? ` (${duration})` : ""}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Middle Column */}
                                  <div className="flex items-center gap-6 self-start lg:self-center shrink-0">
                                    <div className="flex flex-col items-start lg:items-end gap-1">
                                      <div className="flex items-center gap-1.5">
                                        <select
                                          value={r.estado}
                                          onChange={(e) => {
                                            e.stopPropagation()
                                            handleCambiarEstado(r.id, e.target.value)
                                          }}
                                          disabled={savingMap[r.id]}
                                          className={cn(
                                            "px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border outline-none cursor-pointer transition-opacity",
                                            savingMap[r.id] ? "opacity-50" : "",
                                            estado.bg,
                                            estado.text,
                                          )}
                                        >
                                          {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
                                            <option key={val} value={val}>
                                              {cfg.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <span
                                        className={cn(
                                          "text-[11px] font-medium",
                                          isPagado
                                            ? "text-emerald-700"
                                            : isAbonado
                                              ? "text-amber-700"
                                              : "text-slate-500",
                                        )}
                                      >
                                        {isPagado
                                          ? "Pagado"
                                          : isAbonado
                                            ? `Abono $${Number(cuenta?.monto_abonado).toFixed(2)} · Saldo $${saldo.toFixed(2)}`
                                            : "Pago pendiente"}
                                      </span>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0 pl-2">
                                      <span className="text-base font-bold text-slate-900 tracking-tight">
                                        ${Number(r.precio_total).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {r.paquete?.precio_por_hora
                                          ? `$${Number(r.paquete.precio_por_hora).toFixed(0)}/sesión base`
                                          : duration || "Tarifa plana"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right Column */}
                                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                                    <button
                                      onClick={() => navigate(buildDetailHref(r))}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                      type="button"
                                    >
                                      Detalles
                                    </button>
                                    <button
                                      onClick={() => navigate(`/servicios/podcast/reservas/${r.id}/editar`)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                                      type="button"
                                    >
                                      <HugeiconsIcon icon={Edit01Icon} size={14} />
                                      <span>Editar</span>
                                    </button>
                                    {isPagado ? (
                                      <button
                                        onClick={() =>
                                          navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, {
                                            state: {
                                              tipo: "podcast",
                                              servicioId: r.id,
                                              cuentaId: r.cuenta_por_cobrar?.id,
                                              nombre: cliente,
                                              montoTotal: Number(r.precio_total) || 0,
                                              montoSaldo: saldo || 0,
                                              nombreServicio: r.titulo || r.paquete?.nombre || "Podcast",
                                            },
                                          })
                                        }
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                        type="button"
                                      >
                                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                                        <span>Ver pagos</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, {
                                            state: {
                                              tipo: "podcast",
                                              servicioId: r.id,
                                              cuentaId: r.cuenta_por_cobrar?.id,
                                              nombre: cliente,
                                              montoTotal: Number(r.precio_total) || 0,
                                              montoSaldo: saldo || 0,
                                              nombreServicio: r.titulo || r.paquete?.nombre || "Podcast",
                                            },
                                          })
                                        }
                                        className="px-3.5 py-1.5 rounded-lg bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                        type="button"
                                      >
                                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                                        <span>Registrar pago</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}

              {/* Footnote */}
              <div className="px-5 py-3 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-xs shadow-2xs">
                <span className="font-medium">
                  Mostrando {filtered.length} de {reservas.length} reservaciones programadas
                </span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span>Datos sincronizados</span>
                  <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Packages Insights Strip */}
        {paquetes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {paquetes.slice(0, 3).map((paquete) => (
              <div
                key={paquete.id}
                className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-slate-300 transition-colors"
              >
                <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <HugeiconsIcon icon={PackageIcon} size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {paquete.nombre}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 truncate mt-0.5">
                    Tarifa: ${Number(paquete.precio_por_hora).toFixed(0)}/sesión · Activo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
