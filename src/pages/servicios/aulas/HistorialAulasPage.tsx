import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react"
import { useNavigate } from "react-router"
import {
  Clock,
  ChevronDown,
  CircleCheckBig,
  Search,
  X,
  CalendarDays,
  Plus,
  School,
  DoorOpen,
  Layers,
  RefreshCw,
  CircleX,
  EllipsisVertical,
  RotateCcw,
} from "lucide-react"
import { cn, formatCalendarDate, todayInEcuador } from "@/lib/utils"
import { aulasService, type Aula, type ReservaAula } from "@/services/aulas.service"
import { toast } from "sonner"
import { DetalleAulaDrawer } from "./components/DetalleAulaDrawer"
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
    bg: "bg-slate-100 border-slate-200/80",
    dot: "bg-slate-400",
    text: "text-slate-600",
  },
  cancelado: {
    label: "Cancelado",
    bg: "bg-red-50 border-red-200/70",
    dot: "bg-red-500",
    text: "text-red-700",
  },
}

const FILTROS_ESTADO: Record<string, (reserva: ReservaAula) => boolean> = {
  todos: () => true,
  activos: (reserva) => ["reservado", "confirmado", "en_progreso"].includes(reserva.estado),
  reservados: (reserva) => ["reservado", "confirmado"].includes(reserva.estado),
  en_curso: (reserva) => reserva.estado === "en_progreso",
  completados: (reserva) => reserva.estado === "completado",
  cancelados: (reserva) => reserva.estado === "cancelado",
}

const AVATAR_STYLES = [
  "bg-slate-900 text-white",
  "bg-[#ffdbca] text-[#783200]",
  "bg-[#dae2fd] text-[#131b2e]",
  "bg-[#fcdeb5] text-[#574425]",
  "bg-[#e5eeff] text-[#0b1c30]",
]

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return (first + last).toUpperCase() || "?"
}

function getAvatarStyle(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_STYLES[Math.abs(hash) % AVATAR_STYLES.length]
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

const CARD_SHADOW = "shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"

export function HistorialAulasPage() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState<ReservaAula[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [pagoFilter, setPagoFilter] = useState<"todos" | "pagado" | "pendiente">("todos")
  const [sortOrder, setSortOrder] = useState<"recientes" | "antiguos" | "monto">("recientes")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const searchRef = useRef<HTMLInputElement>(null)

  // Panel lateral de detalle
  const [selectedReserva, setSelectedReserva] = useState<ReservaAula | null>(null)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<ReservaAula | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)
  const [updatingEstadoId, setUpdatingEstadoId] = useState<string | null>(null)

  const handleCambiarEstado = async (id: string, nuevoEstado: ReservaAula["estado"]) => {
    const reservaActual = reservas.find((r) => r.id === id)
    if (!reservaActual || reservaActual.estado === nuevoEstado) return

    setUpdatingEstadoId(id)
    try {
      const updated = await aulasService.updateReservaEstado(id, nuevoEstado)
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated, estado: nuevoEstado } : r))
      )
      if (selectedReserva && selectedReserva.id === id) {
        setSelectedReserva((prev) => (prev ? { ...prev, ...updated, estado: nuevoEstado } : null))
      }
      clearAvailabilityCache()
      toast.success(`Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || "Error al actualizar el estado de la reserva")
    } finally {
      setUpdatingEstadoId(null)
    }
  }

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

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

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
        return nombre.includes(q)
      })
    }

    const matcher = FILTROS_ESTADO[estadoFilter]
    if (matcher) list = list.filter(matcher)

    if (pagoFilter !== "todos") {
      list = list.filter((r) => {
        const cuenta = r.cuenta_por_cobrar
        const saldo = cuenta ? Number(cuenta.saldo_pendiente) : Number(r.precio_total) || 0
        const isPagado =
          cuenta?.estado === "pagado" ||
          saldo <= 0 ||
          (cuenta && Number(cuenta.monto_abonado) >= Number(r.precio_total))
        return pagoFilter === "pagado" ? isPagado : !isPagado
      })
    }

    return [...list].sort((a, b) => {
      if (sortOrder === "monto") return Number(b.precio_total || 0) - Number(a.precio_total || 0)
      const keyA = `${a.fecha_reserva || ""} ${a.hora_inicio || ""}`
      const keyB = `${b.fecha_reserva || ""} ${b.hora_inicio || ""}`
      return sortOrder === "antiguos" ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA)
    })
  }, [reservas, search, estadoFilter, pagoFilter, sortOrder, getClienteNombre])

  const stats = useMemo(() => {
    const total = reservas.length
    const activos = reservas.filter((r) => ["reservado", "confirmado", "en_progreso"].includes(r.estado)).length
    const reservados = reservas.filter((r) => ["reservado", "confirmado"].includes(r.estado)).length
    const enCurso = reservas.filter((r) => r.estado === "en_progreso").length
    const completados = reservas.filter((r) => r.estado === "completado").length
    const cancelados = reservas.filter((r) => r.estado === "cancelado").length
    return { total, activos, reservados, enCurso, completados, cancelados }
  }, [reservas])

  const periodoLabel = useMemo(() => {
    const label = new Date()
      .toLocaleDateString("es-EC", { month: "short", year: "numeric" })
      .replace(".", "")
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [])

  const pctCompletados = stats.total ? Math.round((stats.completados / stats.total) * 100) : 0
  const pctCancelados = stats.total ? Math.round((stats.cancelados / stats.total) * 100) : 0

  const statCards = [
    {
      key: "todos",
      label: "Total alquileres",
      value: stats.total,
      badge: (
        <span className="rounded bg-[#FFF7ED] px-1.5 py-0.5 text-[11px] font-semibold text-[#9d4300]">
          {periodoLabel}
        </span>
      ),
      icon: Layers,
      iconBg: "bg-[#FFF7ED] text-[#9d4300]",
    },
    {
      key: "activos",
      label: "Activas / En curso",
      value: stats.activos,
      badge: (
        <span className="inline-flex items-center gap-1 rounded bg-[#ECFDF5] px-1.5 py-0.5 text-[11px] font-semibold text-[#10B981]">
          <span className="size-1.5 animate-pulse rounded-full bg-[#10B981]" />
          En curso
        </span>
      ),
      icon: Clock,
      iconBg: "bg-[#ECFDF5] text-[#10B981]",
    },
    {
      key: "completados",
      label: "Completadas",
      value: stats.completados,
      badge: (
        <span className="text-xs font-medium text-slate-500">
          {stats.total ? `${pctCompletados}% del total` : "Sin registros"}
        </span>
      ),
      icon: CircleCheckBig,
      iconBg: "bg-slate-100 text-slate-500",
    },
    {
      key: "cancelados",
      label: "Canceladas",
      value: stats.cancelados,
      badge: (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
          {pctCancelados}% tasa cancel.
        </span>
      ),
      icon: CircleX,
      iconBg: "bg-slate-100 text-slate-500",
    },
  ]

  const filterTabs = [
    { key: "todos", label: "Todos", count: stats.total },
    { key: "reservados", label: "Reservados", count: stats.reservados },
    { key: "en_curso", label: "En curso", count: stats.enCurso },
    { key: "completados", label: "Completados", count: stats.completados },
    { key: "cancelados", label: "Cancelados", count: stats.cancelados },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaAula[]> = {}
    filtered.forEach((r) => {
      const label = formatCalendarDate(r.fecha_reserva, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      const dateKey = label.charAt(0).toUpperCase() + label.slice(1)
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

  const limpiarFiltros = () => {
    setSearchInput("")
    setSearch("")
    setEstadoFilter("todos")
    setPagoFilter("todos")
    setSortOrder("recientes")
  }

  const hoyEcuador = todayInEcuador()

  if (loading) {
    return (
      <div className="flex h-full min-h-[450px] items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando historial de alquileres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8fafc] pb-16 text-slate-800">
      <div className="flex w-full flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header de página */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="min-w-0">
            
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Alquiler de Aulas
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Supervisa reservas, disponibilidad de espacios y facturación de sesiones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/servicios/aulas/gestion")}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95",
                CARD_SHADOW,
              )}
              type="button"
            >
              <School size={16} className="text-slate-500" />
              <span>Gestión de Aulas</span>
            </button>
            <button
              onClick={() => navigate("/servicios/aulas/agenda")}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95",
                CARD_SHADOW,
              )}
              type="button"
            >
              <CalendarDays size={16} className="text-slate-500" />
              <span>Agenda</span>
            </button>
            <button
              onClick={() => navigate("/servicios/aulas/nueva-reserva")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fd761a] px-4 text-xs font-bold text-white shadow-[0_2px_8px_rgba(253,118,26,0.25)] transition-all hover:bg-[#ea580c] active:scale-95"
              type="button"
            >
              <Plus size={16} />
              <span>Nueva reserva</span>
            </button>
          </div>
        </div>

        {/* Tira de KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            const isActive = estadoFilter === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setEstadoFilter(isActive ? "todos" : card.key)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-white p-3 text-left transition-all hover:shadow-md active:scale-[0.99]",
                  CARD_SHADOW,
                  isActive && "ring-2 ring-[#fd761a]/25",
                )}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {card.label}
                  </span>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                      {card.value}
                    </span>
                    {card.badge}
                  </div>
                </div>
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", card.iconBg)}>
                  <Icon size={19} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Barra de filtros */}
        <div className={cn("space-y-3 rounded-xl border border-slate-200/80 bg-white p-3.5", CARD_SHADOW)}>
          {/* Fila superior: Buscador + Controles de Pago, Orden y Limpiar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs md:max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por cliente..."
                className="h-9 w-full rounded-lg border border-slate-200/80 bg-slate-50 pl-9 pr-8 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#fd761a]/15"
              />
              {searchInput ? (
                <button
                  onClick={() => {
                    setSearchInput("")
                    setSearch("")
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-700"
                  title="Limpiar búsqueda"
                  type="button"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 pl-3 pr-8 text-xs text-slate-600 transition-colors hover:bg-slate-100/70">
                <span className="font-medium text-slate-400">Pago:</span>
                <select
                  value={pagoFilter}
                  onChange={(e) => setPagoFilter(e.target.value as typeof pagoFilter)}
                  className="cursor-pointer appearance-none bg-transparent font-semibold text-slate-800 outline-none"
                >
                  <option value="todos">Todos los pagos</option>
                  <option value="pagado">Pagados</option>
                  <option value="pendiente">Pendientes</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-slate-400" />
              </div>

              <div className="relative flex h-9 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 pl-3 pr-8 text-xs text-slate-600 transition-colors hover:bg-slate-100/70">
                <span className="font-medium text-slate-400">Orden:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  className="cursor-pointer appearance-none bg-transparent font-semibold text-slate-800 outline-none"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="antiguos">Más antiguos</option>
                  <option value="monto">Mayor monto</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-slate-400" />
              </div>

              {(search || estadoFilter !== "todos" || pagoFilter !== "todos" || sortOrder !== "recientes") && (
                <button
                  onClick={limpiarFiltros}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  type="button"
                >
                  <RotateCcw size={13} />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Fila inferior: Pestañas de estado con badges bien espaciadas */}
          <div className="border-t border-slate-100 pt-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {filterTabs.map((tab) => {
                const isActive = estadoFilter === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setEstadoFilter(tab.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                      isActive
                        ? "bg-slate-900 font-semibold text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                        isActive
                          ? "bg-white/20 text-white"
                          : tab.key === "en_curso" && tab.count > 0
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-200/80 text-slate-600",
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabla de reservas */}
        <div className={cn("overflow-hidden rounded-xl bg-white", CARD_SHADOW)}>
          <div className="flex items-center justify-between gap-3 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-slate-900">Historial de reservas</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-xs">
                {filtered.length} registradas
              </span>
            </div>
            <button
              onClick={loadData}
              className="flex size-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
              title="Actualizar datos"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="space-y-3 p-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <School size={28} />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {search ? `Sin resultados para "${search}"` : "No hay reservaciones registradas"}
              </p>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                Prueba modificando la búsqueda o realiza una nueva reserva desde el botón superior.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 pl-4 pr-2 font-semibold">Cliente / Aula</th>
                      <th className="px-3 py-2.5 font-semibold">Fecha y horario</th>
                      <th className="px-2 py-2.5 font-semibold">Estado</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                      <th className="px-3 py-2.5 font-semibold">Pago</th>
                      <th className="w-10 py-2.5 pl-1 pr-4" />
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-800">
                    {groupedByDate.map(([date, items]) => {
                      const isOpen = expandedGroups[date] !== false
                      const dayTotal = getGroupTotal(items)

                      return (
                        <Fragment key={date}>
                          <tr className="border-b border-slate-100 bg-slate-50/80">
                            <td colSpan={6} className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => toggleGroup(date)}
                                className="flex w-full items-center justify-between gap-3 text-left"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <ChevronDown
                                    size={14}
                                    className={cn(
                                      "shrink-0 text-slate-400 transition-transform",
                                      !isOpen && "-rotate-90",
                                    )}
                                  />
                                  <CalendarDays size={14} className="shrink-0 text-[#fd761a]" />
                                  <span className="truncate text-xs font-bold text-slate-900">{date}</span>
                                  <span className="shrink-0 text-[11px] text-slate-500">
                                    {items.length} {items.length === 1 ? "reserva" : "reservas"}
                                  </span>
                                </div>
                                <span className="shrink-0 font-mono text-[11px] text-slate-500">
                                  ${dayTotal.toFixed(2)} total
                                </span>
                              </button>
                            </td>
                          </tr>

                          {isOpen &&
                            items.map((r) => {
                              const estado = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.reservado
                              const clienteNombre = getClienteNombre(r)
                              const aula = getAulaObj(r.aula_id)
                              const aulaNombre = aula?.nombre || getAulaNombre(r.aula_id)
                              const duration = getDurationText(r.hora_inicio, r.hora_fin)
                              const isSelected = detalleModalOpen && selectedReserva?.id === r.id

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
                                <tr
                                  key={r.id}
                                  onClick={() => handleOpenDetalle(r)}
                                  className={cn(
                                    "cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/70",
                                    isSelected && "bg-orange-50/60 shadow-[inset_3px_0_0_0_#fd761a]",
                                  )}
                                >
                                  <td className="py-3 pl-4 pr-2">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={cn(
                                          "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                          getAvatarStyle(r.id),
                                        )}
                                      >
                                        {getInitials(clienteNombre)}
                                      </div>
                                      <div className="flex min-w-0 flex-col">
                                        <span className="truncate font-semibold text-slate-900">
                                          {clienteNombre}
                                        </span>
                                        <span className="truncate text-[11px] text-slate-500">
                                          {aulaNombre}
                                          {aula?.capacidad ? ` · ${aula.capacidad} pers.` : ""}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="whitespace-nowrap px-3 py-3">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-slate-900">
                                        {formatCalendarDate(r.fecha_reserva, {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                      <span className="text-[11px] text-slate-500">
                                        {r.hora_inicio?.substring(0, 5)} - {r.hora_fin?.substring(0, 5)}
                                        {duration ? ` (${duration})` : ""}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="whitespace-nowrap px-2 py-3">
                                    <span
                                      className="relative inline-flex items-center"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <span
                                        className={cn(
                                          "pointer-events-none absolute left-2 size-1.5 rounded-full",
                                          estado.dot,
                                          r.estado === "en_progreso" && "animate-pulse",
                                        )}
                                      />
                                      <select
                                        value={r.estado}
                                        onChange={(e) =>
                                          handleCambiarEstado(r.id, e.target.value as ReservaAula["estado"])
                                        }
                                        disabled={updatingEstadoId === r.id}
                                        title="Cambiar estado de la reserva"
                                        className={cn(
                                          "cursor-pointer appearance-none rounded-full border py-0.5 pl-5 pr-6 text-[10px] font-semibold uppercase tracking-wider outline-none transition-all",
                                          estado.bg,
                                          estado.text,
                                          updatingEstadoId === r.id && "pointer-events-none opacity-50",
                                        )}
                                      >
                                        <option value="reservado">Reservado</option>
                                        <option value="confirmado">Confirmado</option>
                                        <option value="en_progreso">En progreso</option>
                                        <option value="completado">Completado</option>
                                        <option value="cancelado">Cancelado</option>
                                      </select>
                                      {updatingEstadoId === r.id ? (
                                        <span className="absolute right-1.5 top-1/2 size-2.5 -translate-y-1/2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      ) : (
                                        <ChevronDown
                                          size={11}
                                          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50"
                                        />
                                      )}
                                    </span>
                                  </td>

                                  <td className="whitespace-nowrap px-3 py-3 text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="font-bold tabular-nums text-slate-900">
                                        ${Number(r.precio_total).toLocaleString("es-EC", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        {aula?.precio_hora
                                          ? `$${Number(aula.precio_hora).toFixed(0)}/h`
                                          : duration || "Tarifa plana"}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="whitespace-nowrap px-3 py-3">
                                    {isPagado ? (
                                      <span
                                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                        title="Pago confirmado"
                                      >
                                        <CircleCheckBig size={12} />
                                        Pagado
                                      </span>
                                    ) : isAbonado ? (
                                      <span
                                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                                        title={`Abono $${Number(cuenta?.monto_abonado).toFixed(2)} · Saldo $${saldo.toFixed(2)}`}
                                      >
                                        <Clock size={11} />
                                        Abonado
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                        title="Pago pendiente"
                                      >
                                        <Clock size={11} />
                                        Pendiente
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3 pl-1 pr-4 text-center">
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleOpenDetalle(r)
                                      }}
                                      className="flex size-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                      title="Ver detalle"
                                      type="button"
                                    >
                                      <EllipsisVertical size={17} />
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:flex-row">
                <span>
                  Mostrando <span className="font-semibold text-slate-900">{filtered.length}</span> de{" "}
                  {reservas.length} reservas registradas
                </span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span>Datos sincronizados</span>
                  <Clock size={13} className="text-slate-400" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Disponibilidad de aulas */}
        {aulas.length > 0 && (
          <section className="mt-2">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Disponibilidad de aulas</h2>
              <span className="text-[11px] font-medium text-slate-500">Hoy</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    className={cn(
                      "flex items-center gap-3 rounded-xl bg-white p-3 transition-colors hover:bg-slate-50/60",
                      CARD_SHADOW,
                    )}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <DoorOpen size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-slate-900">{aula.nombre}</span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            reservasHoyAula.length > 0
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {reservasHoyAula.length > 0 ? "Ocupada" : "Disponible"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {aula.capacidad ? `Cap. ${aula.capacidad} · ` : ""}
                        {reservasHoyAula.length > 0
                          ? `${reservasHoyAula.length} reserva(s) hoy`
                          : `$${Number(aula.precio_hora || 0).toFixed(0)}/h`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Panel lateral de detalle de alquiler */}
      <DetalleAulaDrawer
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
        onEstadoChange={handleCambiarEstado}
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
