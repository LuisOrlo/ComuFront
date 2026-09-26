import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  ArrowDown01Icon,
  UserIcon,
  LibraryIcon,
  CheckmarkCircle04Icon,
  Search01Icon,
  Cancel01Icon,
  Edit01Icon,
  Calendar03Icon,
  Add01Icon,
  SchoolIcon,
  Door01Icon,
  Layers01Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn, formatCalendarDate, todayInEcuador } from "@/lib/utils"
import { aulasService, type Aula, type ReservaAula } from "@/services/aulas.service"
import { toast } from "sonner"
import { DetalleAulaModal } from "./components/DetalleAulaModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { clearAvailabilityCache } from "@/lib/availabilityCache"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; dot: string; text: string }
> = {
  reservado: {
    label: "Reservado",
    bg: "bg-orange-50 border-orange-200/70",
    dot: "bg-[#fd761a]",
    text: "text-orange-800",
  },
  confirmado: {
    label: "Confirmado",
    bg: "bg-blue-50 border-blue-200/70",
    dot: "bg-blue-600",
    text: "text-blue-800",
  },
  en_progreso: {
    label: "En progreso",
    bg: "bg-amber-50 border-amber-200/70",
    dot: "bg-amber-500",
    text: "text-amber-800",
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

export function HistorialAulasPage() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState<ReservaAula[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Modal de detalle
  const [selectedReserva, setSelectedReserva] = useState<ReservaAula | null>(null)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<ReservaAula | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [res, auls] = await Promise.all([
        aulasService.getReservas(),
        aulasService.getAulas(),
      ])
      setReservas(Array.isArray(res) ? res : [])
      setAulas(auls || [])
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const getAulaObj = useCallback(
    (aulaId: string) => {
      return aulas.find((x) => x.id === aulaId)
    },
    [aulas],
  )

  const getAulaNombre = useCallback(
    (aulaId: string) => {
      const a = getAulaObj(aulaId)
      return a?.nombre || "—"
    },
    [getAulaObj],
  )

  const getClienteNombre = useCallback((r: ReservaAula) => {
    if (r.persona) return `${r.persona.nombres || ""} ${r.persona.apellidos || ""}`.trim()
    if (r.cliente_externo) return `${r.cliente_externo.nombres || ""} ${r.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }, [])

  const filtered = useMemo(() => {
    let list = reservas

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r) => {
        const nombre = getClienteNombre(r).toLowerCase()
        const aula = getAulaNombre(r.aula_id).toLowerCase()
        return nombre.includes(q) || aula.includes(q)
      })
    }

    if (estadoFilter === "activos") {
      list = list.filter(
        (r) => r.estado === "reservado" || r.estado === "confirmado" || r.estado === "en_progreso",
      )
    } else if (estadoFilter !== "todos") {
      list = list.filter((r) => r.estado === estadoFilter)
    }

    return list.sort((a, b) => {
      const dateDiff = (b.fecha_reserva || "").localeCompare(a.fecha_reserva || "")
      if (dateDiff !== 0) return dateDiff
      return (b.hora_inicio || "").localeCompare(a.hora_inicio || "")
    })
  }, [reservas, search, estadoFilter, getAulaNombre, getClienteNombre])

  const stats = useMemo(() => {
    return {
      total: reservas.length,
      activos: reservas.filter(
        (r) => r.estado === "reservado" || r.estado === "confirmado" || r.estado === "en_progreso",
      ).length,
      completados: reservas.filter((r) => r.estado === "completado").length,
      cancelados: reservas.filter((r) => r.estado === "cancelado").length,
    }
  }, [reservas])

  const statCards = [
    {
      key: "todos",
      label: "TOTAL ALQUILERES",
      value: stats.total,
      subtitle: "Periodo actual",
      icon: Layers01Icon,
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      key: "activos",
      label: "ACTIVAS / EN CURSO",
      value: stats.activos,
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
      label: "COMPLETADOS",
      value: stats.completados,
      subtitle: "Finalizadas",
      icon: CheckmarkCircle04Icon,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "cancelado",
      label: "CANCELADOS",
      value: stats.cancelados,
      subtitle: "Canceladas",
      icon: Cancel01Icon,
      iconBg: "bg-red-50 text-red-600",
    },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaAula[]> = {}
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

  const getGroupTotal = (items: ReservaAula[]) => {
    return items.reduce((sum, r) => sum + Number(r.precio_total || 0), 0)
  }

  const toggleGroup = (date: string) => {
    setExpandedGroups((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  const handleOpenDetalle = (r: ReservaAula) => {
    setSelectedReserva(r)
    setDetalleModalOpen(true)
  }

  const handlePago = (r: ReservaAula) => {
    const clienteNombre = getClienteNombre(r)
    const aulaNombre = getAulaNombre(r.aula_id)
    navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, {
      state: {
        tipo: "aula",
        servicioId: r.id,
        cuentaId: r.cuenta_por_cobrar?.id,
        nombre: clienteNombre,
        montoTotal: Number(r.precio_total) || 0,
        montoSaldo: r.cuenta_por_cobrar
          ? Number(r.cuenta_por_cobrar.saldo_pendiente)
          : Number(r.precio_total) || 0,
        nombreServicio: `Alquiler de Aula ${aulaNombre}`,
      },
    })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await aulasService.deleteReserva(deleteConfirm.id)
      toast.success("Reserva eliminada")
      clearAvailabilityCache()
      setDeleteConfirm(null)
      setSelectedReserva(null)
      setDetalleModalOpen(false)
      await loadData()
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(message || "Error al eliminar reserva")
    } finally {
      setDeletingItem(false)
    }
  }

  const hoyEcuador = todayInEcuador()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-spin size-8 border-[3px] border-t-transparent rounded-full"
            style={{ borderColor: COLORS.ACCENT }}
          />
          <p className="text-xs font-semibold text-slate-500">Cargando historial de alquileres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header de Página (Alineación exacta con code.html) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              SERVICIOS
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
              Alquiler de Aulas
            </h1>
          </div>

          {/* Action Cluster (Height 40px aligned) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/servicios/aulas/gestion")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={SchoolIcon} size={17} className="text-slate-500" />
              <span>Gestión de Aulas</span>
            </button>
            <button
              onClick={() => navigate("/servicios/aulas/nueva-reserva")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Add01Icon} size={17} className="text-slate-500" />
              <span>Nueva Reserva</span>
            </button>
            <button
              onClick={() => navigate("/servicios/aulas/agenda")}
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
            const isActive = estadoFilter === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setEstadoFilter(isActive ? "todos" : card.key)}
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
              <h2 className="text-lg font-bold text-slate-900">Historial de Alquileres</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-xs font-semibold">
                {filtered.length}
              </span>
            </div>

            {/* Filter Controls (40px Height) */}
            <div className="flex items-center gap-2.5">
              {/* Search Field */}
              <div className="h-10 bg-white border border-slate-200 rounded-xl px-3.5 flex items-center gap-2 shadow-xs w-full sm:w-72 focus-within:ring-2 focus-within:ring-[#fd761a]/25 focus-within:border-[#fd761a] transition-all">
                <HugeiconsIcon icon={Search01Icon} size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar cliente o aula…"
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput("")
                      setSearch("")
                    }}
                    className="text-slate-400 hover:text-slate-700 p-0.5"
                    title="Limpiar búsqueda"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
              </div>

              {/* Quick Refresh Button */}
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
                <HugeiconsIcon icon={SchoolIcon} size={28} />
              </div>
              <p className="font-bold text-sm text-slate-800">
                {search ? `Sin resultados para "${search}"` : "No hay reservaciones registradas"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba modificando la búsqueda o realiza una nueva reserva desde el botón superior.
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
                              const estado = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.reservado
                              const clienteNombre = getClienteNombre(r)
                              const aula = getAulaObj(r.aula_id)
                              const aulaNombre = aula?.nombre || getAulaNombre(r.aula_id)
                              const duration = getDurationText(r.hora_inicio, r.hora_fin)

                              // Estado de pago
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
                                  {/* Left Column: Classroom & Client Profile Details */}
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div
                                      className={cn(
                                        "size-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors",
                                        r.persona_id
                                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white"
                                          : "bg-[#ffdbca]/50 text-[#9d4300] border border-[#ffdbca] group-hover:bg-[#fd761a] group-hover:text-white",
                                      )}
                                    >
                                      <HugeiconsIcon
                                        icon={r.persona_id ? UserIcon : LibraryIcon}
                                        size={20}
                                      />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDetalle(r)}
                                          className="text-[15px] leading-snug font-semibold text-slate-900 group-hover:text-[#fd761a] truncate transition-colors text-left cursor-pointer"
                                        >
                                          {clienteNombre}
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                          <HugeiconsIcon
                                            icon={SchoolIcon}
                                            size={14}
                                            className="text-[#fd761a]"
                                          />
                                          <strong className="font-medium text-slate-800">
                                            {aulaNombre}
                                          </strong>
                                          {aula?.capacidad ? ` · Capacidad ${aula.capacidad} pers.` : ""}
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

                                  {/* Middle Column: Status Badge & Financial Amount */}
                                  <div className="flex items-center gap-6 self-start lg:self-center shrink-0">
                                    <div className="flex flex-col items-start lg:items-end gap-1">
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border",
                                          estado.bg,
                                          estado.text,
                                        )}
                                      >
                                        <span className={cn("size-2 rounded-full", estado.dot)} />
                                        {estado.label}
                                      </span>
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
                                        {aula?.precio_hora
                                          ? `$${Number(aula.precio_hora).toFixed(0)}/sesión base`
                                          : duration || "Tarifa plana"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right Column: Hierarchical Operational Actions */}
                                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                                    <button
                                      onClick={() => handleOpenDetalle(r)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                      type="button"
                                    >
                                      Detalles
                                    </button>
                                    <button
                                      onClick={() => navigate(`/servicios/aulas/reservas/${r.id}/editar`)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                                      type="button"
                                    >
                                      <HugeiconsIcon icon={Edit01Icon} size={14} />
                                      <span>Editar</span>
                                    </button>
                                    {isPagado ? (
                                      <button
                                        onClick={() => handlePago(r)}
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                        type="button"
                                      >
                                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                                        <span>Ver pagos</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handlePago(r)}
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

              {/* Footnote / Audit Metadata Bar */}
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

        {/* Quick Room Availability & Occupancy Insights Strip */}
        {aulas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {aulas.slice(0, 3).map((aula) => {
              const reservasHoyAula = reservas.filter(
                (r) =>
                  r.aula_id === aula.id &&
                  r.fecha_reserva === hoyEcuador &&
                  r.estado !== "cancelado",
              )

              return (
                <div
                  key={aula.id}
                  className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-slate-300 transition-colors"
                >
                  <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <HugeiconsIcon icon={Door01Icon} size={20} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {aula.nombre}
                      {aula.capacidad ? ` · Cap. ${aula.capacidad}` : ""}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium truncate mt-0.5",
                        reservasHoyAula.length > 0 ? "text-amber-700" : "text-emerald-700",
                      )}
                    >
                      {reservasHoyAula.length > 0
                        ? `${reservasHoyAula.length} reserva(s) hoy`
                        : `Disponible · $${Number(aula.precio_hora || 0).toFixed(0)}/sesión`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalle de Alquiler de Aula */}
      <DetalleAulaModal
        isOpen={detalleModalOpen}
        onClose={() => setDetalleModalOpen(false)}
        reserva={selectedReserva}
        aula={selectedReserva ? getAulaObj(selectedReserva.aula_id) : undefined}
        onEdit={
          selectedReserva
            ? () => navigate(`/servicios/aulas/reservas/${selectedReserva.id}/editar`)
            : undefined
        }
        onPago={selectedReserva ? () => handlePago(selectedReserva) : undefined}
        onDelete={selectedReserva ? () => setDeleteConfirm(selectedReserva) : undefined}
      />

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Reserva"
        message="¿Eliminar permanentemente esta reserva? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deletingItem}
        icon="trash"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
