import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Clock,
  ChevronDown,
  CircleCheckBig,
  CircleX,
  Search,
  X,
  CalendarDays,
  Plus,
  Layers,
  RefreshCw,
  RotateCcw,
  Pencil,
  Video,
  Trash2,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Tag,
  AlertCircle,
} from "lucide-react"
import { cn, formatCalendarDate } from "@/lib/utils"
import { setsService, type SetItem, type ReservaSet } from "@/services/sets.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

const CARD_SHADOW = "shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; dot: string; text: string }
> = {
  reservado: {
    label: "Reservado",
    bg: "bg-amber-50 border-amber-200/70",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  confirmado: {
    label: "Confirmado",
    bg: "bg-sky-50 border-sky-200/70",
    dot: "bg-sky-500",
    text: "text-sky-700",
  },
  en_progreso: {
    label: "En progreso",
    bg: "bg-orange-50 border-orange-200/70",
    dot: "bg-orange-500",
    text: "text-[#9d4300]",
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
  const last = parts[1]?.[0] ?? ""
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

export function HistorialSetsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [sets, setSets] = useState<SetItem[]>([])
  const [reservas, setReservas] = useState<ReservaSet[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "todos")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [pagoFilter, setPagoFilter] = useState<"todos" | "pagado" | "pendiente">("todos")
  const [sortOrder, setSortOrder] = useState<"recientes" | "antiguos" | "monto">("recientes")
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [selectedReserva, setSelectedReserva] = useState<ReservaSet | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ReservaSet | null>(null)
  const [deleting, setDeleting] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [resSets, resReservas] = await Promise.all([
        setsService.getSets(),
        setsService.getReservas(),
      ])
      setSets(resSets || [])
      setReservas(resReservas || [])
    } catch {
      toast.error("Error al cargar las reservas de sets")
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

  const getCliente = useCallback((r: ReservaSet) => {
    if (r.persona) return `${r.persona.nombres || ""} ${r.persona.apellidos || ""}`.trim()
    if (r.cliente_externo) return `${r.cliente_externo.nombres || ""} ${r.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }, [])

  const handleCambiarEstado = async (id: string, nuevoEstado: ReservaSet["estado"]) => {
    setSavingMap((prev) => ({ ...prev, [id]: true }))
    try {
      const updated = await setsService.updateReservaEstado(id, nuevoEstado)
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated, estado: nuevoEstado } : r)),
      )
      if (selectedReserva && selectedReserva.id === id) {
        setSelectedReserva((prev) => (prev ? { ...prev, ...updated, estado: nuevoEstado } : null))
      }
      toast.success(`Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || "Error al actualizar estado")
    } finally {
      setSavingMap((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await setsService.deleteReserva(deleteConfirm.id)
      toast.success("Reserva eliminada exitosamente")
      if (selectedReserva?.id === deleteConfirm.id) {
        setSelectedReserva(null)
      }
      setDeleteConfirm(null)
      loadData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || "No se pudo eliminar la reserva")
    } finally {
      setDeleting(false)
    }
  }

  const handlePago = (r: ReservaSet) => {
    const clienteNombre = getCliente(r)
    const total = Number(r.precio_total || 0)
    const saldo = r.cuenta_por_cobrar
      ? Number(r.cuenta_por_cobrar.saldo_pendiente ?? (total - r.cuenta_por_cobrar.monto_abonado))
      : total

    navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, {
      state: {
        tipo: "set",
        servicioId: r.id,
        cuentaId: r.cuenta_por_cobrar?.id,
        nombre: clienteNombre,
        montoTotal: total,
        montoSaldo: saldo,
        nombreServicio: `Alquiler de Set ${r.set?.nombre || ""}`,
        returnUrl: location.pathname + location.search,
      },
    })
  }

  const filtered = useMemo(() => {
    let list = reservas

    if (filtroEstado === "activos") {
      list = list.filter(
        (r) => r.estado === "reservado" || r.estado === "confirmado" || r.estado === "en_progreso",
      )
    } else if (filtroEstado !== "todos") {
      list = list.filter((r) => r.estado === filtroEstado)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r) => {
        const setName = (r.set?.nombre || "").toLowerCase()
        const cliente = getCliente(r).toLowerCase()
        const cedula = (r.persona?.cedula || r.cliente_externo?.cedula || "").toLowerCase()
        return setName.includes(q) || cliente.includes(q) || cedula.includes(q)
      })
    }

    if (pagoFilter !== "todos") {
      list = list.filter((r) => {
        const total = Number(r.precio_total || 0)
        const cuenta = r.cuenta_por_cobrar
        const abonado = Number(cuenta?.monto_abonado || 0)
        const saldo = cuenta ? Number(cuenta.saldo_pendiente ?? (total - abonado)) : total
        const isPagado = cuenta?.estado === "pagado" || saldo <= 0 || (cuenta && abonado >= total)
        return pagoFilter === "pagado" ? isPagado : !isPagado
      })
    }

    return [...list].sort((a, b) => {
      if (sortOrder === "monto") return Number(b.precio_total || 0) - Number(a.precio_total || 0)
      const keyA = `${a.fecha_reserva || ""} ${a.hora_inicio || ""}`
      const keyB = `${b.fecha_reserva || ""} ${b.hora_inicio || ""}`
      return sortOrder === "antiguos" ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA)
    })
  }, [reservas, filtroEstado, search, pagoFilter, sortOrder, getCliente])

  const stats = useMemo(() => {
    const total = reservas.length
    const activos = reservas.filter(
      (r) => r.estado === "reservado" || r.estado === "confirmado" || r.estado === "en_progreso",
    ).length
    const reservados = reservas.filter((r) => r.estado === "reservado").length
    const confirmados = reservas.filter((r) => r.estado === "confirmado").length
    const enProgreso = reservas.filter((r) => r.estado === "en_progreso").length
    const completados = reservas.filter((r) => r.estado === "completado").length
    const cancelados = reservas.filter((r) => r.estado === "cancelado").length
    return { total, activos, reservados, confirmados, enProgreso, completados, cancelados }
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
      label: "Total reservas",
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
      key: "completado",
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
      key: "cancelado",
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
    { key: "activos", label: "Activos", count: stats.activos },
    { key: "reservado", label: "Reservados", count: stats.reservados },
    { key: "confirmado", label: "Confirmados", count: stats.confirmados },
    { key: "en_progreso", label: "En progreso", count: stats.enProgreso },
    { key: "completado", label: "Completados", count: stats.completados },
    { key: "cancelado", label: "Cancelados", count: stats.cancelados },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaSet[]> = {}
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

  const toggleGroup = (date: string) => {
    setExpandedGroups((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  const getGroupTotal = (items: ReservaSet[]) => {
    return items.reduce((sum, r) => sum + Number(r.precio_total || 0), 0)
  }

  const limpiarFiltros = () => {
    setSearchInput("")
    setSearch("")
    setFiltroEstado("todos")
    setPagoFilter("todos")
    setSortOrder("recientes")
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[450px] items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando reservas de sets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8fafc] pb-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header de página */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
           
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Alquiler de Sets de Grabación
            </h1>
            <p className="text-xs text-slate-500">
              Supervisa la ocupación, disponibilidad de escenarios y reservas de sets de filmación.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2 sm:self-auto">
            <button
              onClick={() => navigate("/servicios/sets/gestion")}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
              type="button"
            >
              <Layers size={16} className="text-slate-500" />
              <span>Gestionar Sets</span>
            </button>
            <button
              onClick={() => navigate("/servicios/sets/nueva-reserva")}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
              type="button"
            >
              <Plus size={16} className="text-slate-500" />
              <span>Nueva Reserva</span>
            </button>
            <button
              onClick={() => navigate("/servicios/sets/agenda")}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#fd761a] px-4 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
              type="button"
            >
              <CalendarDays size={16} />
              <span>Agenda</span>
            </button>
          </div>
        </div>

        {/* Tira de KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            const isActive = filtroEstado === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setFiltroEstado(isActive ? "todos" : card.key)}
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
                placeholder="Buscar cliente, cédula o set..."
                className="h-9 w-full rounded-lg border border-slate-200/80 bg-slate-50 pl-9 pr-8 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#fd761a]/15"
              />
              {searchInput ? (
                <button
                  onClick={() => {
                    setSearchInput("")
                    setSearch("")
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-700 cursor-pointer"
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

              {(search || filtroEstado !== "todos" || pagoFilter !== "todos" || sortOrder !== "recientes") && (
                <button
                  onClick={limpiarFiltros}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
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
                const isActive = filtroEstado === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFiltroEstado(tab.key)}
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
                          : tab.key === "en_progreso" && tab.count > 0
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

        {/* Tabla de reservas de sets */}
        <div className={cn("overflow-hidden rounded-xl bg-white", CARD_SHADOW)}>
          <div className="flex items-center justify-between gap-3 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-slate-900">Historial de reservas de sets</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-xs">
                {filtered.length} registradas
              </span>
            </div>
            <button
              onClick={loadData}
              className="flex size-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white hover:text-slate-700 cursor-pointer"
              title="Actualizar datos"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="space-y-3 p-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Video size={28} />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {search ? `Sin resultados para "${search}"` : "No hay reservaciones de sets registradas"}
              </p>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                Prueba modificando la búsqueda o registra una nueva reserva desde el botón superior.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 pl-4 pr-2 font-semibold">Cliente / Set</th>
                      <th className="px-3 py-2.5 font-semibold">Fecha y horario</th>
                      <th className="px-2 py-2.5 font-semibold">Estado</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                      <th className="px-3 py-2.5 font-semibold">Pago</th>
                      <th className="py-2.5 pl-1 pr-4 text-right font-semibold">Acciones</th>
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
                                className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
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
                              const clienteNombre = getCliente(r)
                              const duration = getDurationText(r.hora_inicio, r.hora_fin)
                              const total = Number(r.precio_total || 0)
                              const cuenta = r.cuenta_por_cobrar
                              const abonado = Number(cuenta?.monto_abonado || 0)
                              const saldo = cuenta ? Number(cuenta.saldo_pendiente ?? (total - abonado)) : total
                              const isPagado =
                                cuenta?.estado === "pagado" || saldo <= 0 || (cuenta && abonado >= total)
                              const isAbonado = !isPagado && cuenta && abonado > 0

                              return (
                                <tr
                                  key={r.id}
                                  onClick={() => setSelectedReserva(r)}
                                  className="cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/70"
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
                                        <div className="flex items-center gap-1.5">
                                          <span className="truncate font-semibold text-slate-900">
                                            {clienteNombre}
                                          </span>
                                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 shrink-0">
                                            {r.persona_id ? "Interno" : "Cliente"}
                                          </span>
                                        </div>
                                        <span className="truncate text-[11px] text-slate-500">
                                          {r.set?.nombre || "Set de grabación"}
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
                                      onClick={(e) => e.stopPropagation()}
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
                                        onChange={(e) => {
                                          handleCambiarEstado(r.id, e.target.value as ReservaSet["estado"])
                                        }}
                                        disabled={savingMap[r.id]}
                                        title="Cambiar estado de la reserva"
                                        className={cn(
                                          "cursor-pointer appearance-none rounded-full border py-0.5 pl-5 pr-6 text-[10px] font-semibold uppercase tracking-wider outline-none transition-all",
                                          estado.bg,
                                          estado.text,
                                          savingMap[r.id] && "pointer-events-none opacity-50",
                                        )}
                                      >
                                        <option value="reservado">Reservado</option>
                                        <option value="confirmado">Confirmado</option>
                                        <option value="en_progreso">En progreso</option>
                                        <option value="completado">Completado</option>
                                        <option value="cancelado">Cancelado</option>
                                      </select>
                                      {savingMap[r.id] ? (
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
                                        ${total.toLocaleString("es-EC", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        {r.set?.precio_hora
                                          ? `$${Number(r.set.precio_hora).toFixed(0)}/h`
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
                                        title={`Abono $${abonado.toFixed(2)} · Saldo $${saldo.toFixed(2)}`}
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

                                  <td className="whitespace-nowrap py-3 pl-1 pr-4 text-right">
                                    <div
                                      className="inline-flex items-center gap-1.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => setSelectedReserva(r)}
                                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                                        type="button"
                                      >
                                        Detalles
                                      </button>
                                      <button
                                        onClick={() => navigate(`/servicios/sets/reservas/${r.id}/editar`)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                                        type="button"
                                        title="Editar reserva"
                                      >
                                        <Pencil size={12} />
                                        <span>Editar</span>
                                      </button>
                                      {isPagado ? (
                                        <button
                                          onClick={() => handlePago(r)}
                                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-xs transition-all hover:bg-emerald-100 active:scale-95 cursor-pointer"
                                          type="button"
                                        >
                                          <CircleCheckBig size={12} />
                                          <span>Ver pagos</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handlePago(r)}
                                          className="inline-flex items-center gap-1 rounded-lg bg-[#fd761a] px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95 active:scale-95 cursor-pointer"
                                          type="button"
                                        >
                                          <CircleCheckBig size={12} />
                                          <span>Registrar pago</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setDeleteConfirm(r)}
                                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                        type="button"
                                        title="Eliminar reserva"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
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

              {/* Pie de tabla */}
              <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-2.5 text-xs text-slate-500 sm:flex-row">
                <span className="font-medium">
                  Mostrando {filtered.length} de {reservas.length} reservaciones de sets
                </span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span>Datos sincronizados</span>
                  <Clock size={12} className="text-slate-400" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Franja de sets de grabación */}
        {sets.length > 0 && (
          <section className="mt-2">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Sets de grabación disponibles</h2>
              <span className="text-[11px] font-medium text-slate-500">Tarifas base</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sets.slice(0, 3).map((setItem) => (
                <div
                  key={setItem.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl bg-white p-3 transition-colors hover:bg-slate-50/60",
                    CARD_SHADOW,
                  )}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Video size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold text-slate-900">{setItem.nombre}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          setItem.activo !== false
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {setItem.activo !== false ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      Tarifa: ${Number(setItem.precio_hora || 0).toFixed(2)}/hora
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Drawer Lateral de Detalles en reemplazo del modal */}
      <AnimatePresence>
        {selectedReserva && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedReserva(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Slide-over Panel */}
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
                className="flex w-screen max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
              >
                {/* Header del Drawer */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100">
                      <Video size={20} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900">
                        Detalle de Alquiler de Set
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedReserva.set?.nombre || "Set de grabación"} · Fecha:{" "}
                        {formatCalendarDate(selectedReserva.fecha_reserva, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReserva(null)}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 hover:shadow-xs"
                    title="Cerrar panel lateral"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Contenido scrolleable del Drawer */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-slate-800">
                  {/* Card Set y Estado */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9d4300]">
                          Set Reservado
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {selectedReserva.set?.nombre || "Set de grabación"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tarifa: ${Number(selectedReserva.set?.precio_hora || 0).toFixed(2)}/hora
                        </p>
                      </div>

                      {/* Selector interactivo de estado */}
                      <div className="relative shrink-0">
                        <span
                          className={cn(
                            "pointer-events-none absolute left-2 size-1.5 rounded-full",
                            (ESTADO_CONFIG[selectedReserva.estado] || ESTADO_CONFIG.reservado).dot,
                            selectedReserva.estado === "en_progreso" && "animate-pulse",
                          )}
                        />
                        <select
                          value={selectedReserva.estado}
                          onChange={(e) =>
                            handleCambiarEstado(
                              selectedReserva.id,
                              e.target.value as ReservaSet["estado"],
                            )
                          }
                          disabled={savingMap[selectedReserva.id]}
                          className={cn(
                            "cursor-pointer appearance-none rounded-full border py-1 pl-5 pr-6 text-[10px] font-semibold uppercase tracking-wider outline-none transition-all shadow-2xs",
                            (ESTADO_CONFIG[selectedReserva.estado] || ESTADO_CONFIG.reservado).bg,
                            (ESTADO_CONFIG[selectedReserva.estado] || ESTADO_CONFIG.reservado).text,
                            savingMap[selectedReserva.id] && "pointer-events-none opacity-50",
                          )}
                          title="Cambiar estado de la reserva"
                        >
                          <option value="reservado">Reservado</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="en_progreso">En progreso</option>
                          <option value="completado">Completado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                        {savingMap[selectedReserva.id] ? (
                          <span className="absolute right-1.5 top-1/2 size-2.5 -translate-y-1/2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <ChevronDown
                            size={11}
                            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Datos del Cliente / Responsable */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-[#fd761a]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Responsable / Cliente
                      </h3>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          getAvatarStyle(selectedReserva.id),
                        )}
                      >
                        {getInitials(getCliente(selectedReserva))}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {getCliente(selectedReserva)}
                          </p>
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 shrink-0">
                            {selectedReserva.persona_id ? "Interno" : "Cliente"}
                          </span>
                        </div>

                        {(selectedReserva.persona?.cedula || selectedReserva.cliente_externo?.cedula) && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <FileText size={12} className="text-slate-400" />
                            <span>
                              Cédula:{" "}
                              {selectedReserva.persona?.cedula || selectedReserva.cliente_externo?.cedula}
                            </span>
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-600">
                          {(selectedReserva.persona?.correo || selectedReserva.cliente_externo?.correo) && (
                            <a
                              href={`mailto:${selectedReserva.persona?.correo || selectedReserva.cliente_externo?.correo}`}
                              className="inline-flex items-center gap-1 hover:text-[#fd761a]"
                            >
                              <Mail size={13} className="text-slate-400" />
                              <span>
                                {selectedReserva.persona?.correo || selectedReserva.cliente_externo?.correo}
                              </span>
                            </a>
                          )}
                          {(selectedReserva.persona?.celular || selectedReserva.cliente_externo?.celular) && (
                            <a
                              href={`tel:${selectedReserva.persona?.celular || selectedReserva.cliente_externo?.celular}`}
                              className="inline-flex items-center gap-1 hover:text-[#fd761a]"
                            >
                              <Phone size={13} className="text-slate-400" />
                              <span>
                                {selectedReserva.persona?.celular || selectedReserva.cliente_externo?.celular}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fechas y Horario de Uso */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <CalendarDays size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Fecha de Alquiler
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        {formatCalendarDate(selectedReserva.fecha_reserva, {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Horario de Uso
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        {selectedReserva.hora_inicio?.substring(0, 5)} – {selectedReserva.hora_fin?.substring(0, 5)}
                        {getDurationText(selectedReserva.hora_inicio, selectedReserva.hora_fin)
                          ? ` (${getDurationText(selectedReserva.hora_inicio, selectedReserva.hora_fin)})`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Estado Financiero y Pagos */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign size={15} className="text-[#fd761a]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Estado Financiero
                        </h3>
                      </div>
                      {(() => {
                        const total = Number(selectedReserva.precio_total || 0)
                        const cuenta = selectedReserva.cuenta_por_cobrar
                        const abonado = Number(cuenta?.monto_abonado || 0)
                        const saldo = cuenta ? Number(cuenta.saldo_pendiente ?? (total - abonado)) : total
                        const isPagado = cuenta?.estado === "pagado" || saldo <= 0 || (cuenta && abonado >= total)
                        const isAbonado = !isPagado && cuenta && abonado > 0

                        if (isPagado) {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <CircleCheckBig size={11} />
                              Pagado
                            </span>
                          )
                        }
                        if (isAbonado) {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              <Clock size={11} />
                              Abonado
                            </span>
                          )
                        }
                        return (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            <Clock size={11} />
                            Pendiente
                          </span>
                        )
                      })()}
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Total reserva:</span>
                        <span className="font-bold text-slate-900">
                          ${Number(selectedReserva.precio_total || 0).toLocaleString("es-EC", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {selectedReserva.monto_descuento && Number(selectedReserva.monto_descuento) > 0 ? (
                        <div className="flex items-center justify-between text-xs text-emerald-700">
                          <span className="flex items-center gap-1">
                            <Tag size={11} />
                            Descuento ({selectedReserva.motivo_descuento || "General"}):
                          </span>
                          <span>-${Number(selectedReserva.monto_descuento).toFixed(2)}</span>
                        </div>
                      ) : null}

                      {selectedReserva.monto_recargo && Number(selectedReserva.monto_recargo) > 0 ? (
                        <div className="flex items-center justify-between text-xs text-amber-700">
                          <span className="flex items-center gap-1">
                            <AlertCircle size={11} />
                            Recargo ({selectedReserva.motivo_recargo || "Urgencia"}):
                          </span>
                          <span>+${Number(selectedReserva.monto_recargo).toFixed(2)}</span>
                        </div>
                      ) : null}

                      <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Monto abonado:</span>
                        <span className="font-semibold text-emerald-700">
                          ${Number(selectedReserva.cuenta_por_cobrar?.monto_abonado || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Saldo pendiente:</span>
                        <span className="font-bold text-slate-900">
                          ${(
                            selectedReserva.cuenta_por_cobrar
                              ? Number(
                                  selectedReserva.cuenta_por_cobrar.saldo_pendiente ??
                                    (Number(selectedReserva.precio_total || 0) -
                                      Number(selectedReserva.cuenta_por_cobrar.monto_abonado || 0)),
                                )
                              : Number(selectedReserva.precio_total || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  {selectedReserva.observaciones && (
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Observaciones
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed rounded-lg bg-slate-50 p-2.5 border border-slate-100 whitespace-pre-wrap">
                        {selectedReserva.observaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer del Drawer */}
                <div className="border-t border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReserva(null)}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
                    >
                      Cerrar
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/servicios/sets/reservas/${selectedReserva.id}/editar`)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
                      >
                        <Pencil size={13} />
                        <span>Editar</span>
                      </button>

                      {(() => {
                        const total = Number(selectedReserva.precio_total || 0)
                        const cuenta = selectedReserva.cuenta_por_cobrar
                        const abonado = Number(cuenta?.monto_abonado || 0)
                        const saldo = cuenta ? Number(cuenta.saldo_pendiente ?? (total - abonado)) : total
                        const isPagado = cuenta?.estado === "pagado" || saldo <= 0 || (cuenta && abonado >= total)

                        return isPagado ? (
                          <button
                            type="button"
                            onClick={() => handlePago(selectedReserva)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-xs transition-all hover:bg-emerald-100 active:scale-95 cursor-pointer"
                          >
                            <CircleCheckBig size={14} />
                            <span>Ver pagos</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePago(selectedReserva)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#fd761a] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95 active:scale-95 cursor-pointer"
                          >
                            <CircleCheckBig size={14} />
                            <span>Registrar pago</span>
                          </button>
                        )
                      })()}

                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(selectedReserva)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 shadow-xs transition-all hover:bg-red-100 active:scale-95 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirm)}
        title="Eliminar Reserva de Set"
        message="¿Estás seguro de eliminar esta reserva? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleting}
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
