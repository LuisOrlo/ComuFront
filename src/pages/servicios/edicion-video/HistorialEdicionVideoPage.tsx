import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Clock,
  ChevronDown,
  CircleCheckBig,
  Search,
  X,
  CalendarDays,
  Plus,
  Layers,
  RefreshCw,
  RotateCcw,
  Pencil,
  Video,
  Kanban,
  ExternalLink,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Tag,
  Check,
  AlertCircle,
} from "lucide-react"
import { cn, formatCalendarDate } from "@/lib/utils"
import {
  edicionVideoService,
  type TrabajoEdicion,
  type EstadoTrabajo,
} from "@/services/edicion-video.service"
import { toast } from "sonner"

const CARD_SHADOW = "shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"

const ESTADO_CONFIG: Record<
  EstadoTrabajo,
  { label: string; bg: string; dot: string; text: string }
> = {
  recibido: {
    label: "Recibido",
    bg: "bg-sky-50 border-sky-200/70",
    dot: "bg-sky-500",
    text: "text-sky-700",
  },
  en_proceso: {
    label: "En proceso",
    bg: "bg-orange-50 border-orange-200/70",
    dot: "bg-orange-500",
    text: "text-[#9d4300]",
  },
  revision: {
    label: "Revisión",
    bg: "bg-purple-50 border-purple-200/70",
    dot: "bg-purple-500",
    text: "text-purple-700",
  },
  entregado: {
    label: "Entregado",
    bg: "bg-emerald-50 border-emerald-200/70",
    dot: "bg-emerald-600",
    text: "text-emerald-800",
  },
}

const STEPS: { key: EstadoTrabajo; label: string; num: number }[] = [
  { key: "recibido", label: "Recibido", num: 1 },
  { key: "en_proceso", label: "En Proceso", num: 2 },
  { key: "revision", label: "Revisión", num: 3 },
  { key: "entregado", label: "Entregado", num: 4 },
]

function getStepIndex(estado: EstadoTrabajo): number {
  switch (estado) {
    case "recibido":
      return 0
    case "en_proceso":
      return 1
    case "revision":
      return 2
    case "entregado":
      return 3
    default:
      return 0
  }
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

function getDaysDiff(limitStr?: string) {
  if (!limitStr) return null
  const d = limitStr.includes("T") ? new Date(limitStr) : new Date(limitStr + "T00:00:00")
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  const diffTime = target.getTime() - today.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

export function HistorialEdicionVideoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [trabajos, setTrabajos] = useState<TrabajoEdicion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "todos")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [pagoFilter, setPagoFilter] = useState<"todos" | "pagado" | "pendiente">("todos")
  const [sortOrder, setSortOrder] = useState<"recientes" | "antiguos" | "monto">("recientes")
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [selectedTrabajo, setSelectedTrabajo] = useState<TrabajoEdicion | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await edicionVideoService.getTrabajos()
      setTrabajos(res.data)
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

  const getCliente = useCallback((t: TrabajoEdicion) => {
    if (t.cliente) return `${t.cliente.nombres || ""} ${t.cliente.apellidos || ""}`.trim()
    if (t.cliente_externo) return `${t.cliente_externo.nombres || ""} ${t.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }, [])

  const changeEstado = async (id: string, nuevoEstado: EstadoTrabajo) => {
    setSavingMap((prev) => ({ ...prev, [id]: true }))
    try {
      setTrabajos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, estado: nuevoEstado } : t)),
      )
      if (selectedTrabajo?.id === id) {
        setSelectedTrabajo((prev) => (prev ? { ...prev, estado: nuevoEstado } : null))
      }
      await edicionVideoService.updateTrabajo(id, { estado: nuevoEstado })
      toast.success(`Trabajo movido a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
    } catch {
      toast.error("Error al actualizar estado")
      loadData()
    } finally {
      setSavingMap((prev) => ({ ...prev, [id]: false }))
    }
  }

  const filtered = useMemo(() => {
    let list = trabajos

    if (filtroEstado === "activos") {
      list = list.filter(
        (t) => t.estado === "recibido" || t.estado === "en_proceso" || t.estado === "revision",
      )
    } else if (filtroEstado !== "todos") {
      list = list.filter((t) => t.estado === filtroEstado)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => {
        const cliente = getCliente(t).toLowerCase()
        const titulo = (t.titulo || "").toLowerCase()
        const editores = (t.editores || [])
          .map((e) => `${e.nombres} ${e.apellidos}`.toLowerCase())
          .join(" ")
        return cliente.includes(q) || titulo.includes(q) || editores.includes(q)
      })
    }

    if (pagoFilter !== "todos") {
      list = list.filter((t) => {
        const precio = Number(t.precio_cobrado || 0)
        const cuenta = t.cuenta_por_cobrar
        const saldo = cuenta ? Number(cuenta.saldo_pendiente) : precio
        const isPagado =
          cuenta?.estado === "pagado" ||
          saldo <= 0 ||
          (cuenta && Number(cuenta.monto_abonado) >= precio) ||
          t.cobro_registrado
        return pagoFilter === "pagado" ? isPagado : !isPagado
      })
    }

    return [...list].sort((a, b) => {
      if (sortOrder === "monto") return Number(b.precio_cobrado || 0) - Number(a.precio_cobrado || 0)
      const keyA = `${a.fecha_recibo || ""} ${a.created_at || ""}`
      const keyB = `${b.fecha_recibo || ""} ${b.created_at || ""}`
      return sortOrder === "antiguos" ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA)
    })
  }, [trabajos, filtroEstado, search, pagoFilter, sortOrder, getCliente])

  const stats = useMemo(() => {
    const total = trabajos.length
    const activos = trabajos.filter(
      (t) => t.estado === "recibido" || t.estado === "en_proceso" || t.estado === "revision",
    ).length
    const recibidos = trabajos.filter((t) => t.estado === "recibido").length
    const enProceso = trabajos.filter((t) => t.estado === "en_proceso").length
    const revision = trabajos.filter((t) => t.estado === "revision").length
    const entregados = trabajos.filter((t) => t.estado === "entregado").length
    return { total, activos, recibidos, enProceso, revision, entregados }
  }, [trabajos])

  const periodoLabel = useMemo(() => {
    const label = new Date()
      .toLocaleDateString("es-EC", { month: "short", year: "numeric" })
      .replace(".", "")
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [])

  const pctEntregados = stats.total ? Math.round((stats.entregados / stats.total) * 100) : 0

  const statCards = [
    {
      key: "todos",
      label: "Total trabajos",
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
      label: "En producción",
      value: stats.activos,
      badge: (
        <span className="inline-flex items-center gap-1 rounded bg-[#ECFDF5] px-1.5 py-0.5 text-[11px] font-semibold text-[#10B981]">
          <span className="size-1.5 animate-pulse rounded-full bg-[#10B981]" />
          En proceso
        </span>
      ),
      icon: Clock,
      iconBg: "bg-[#ECFDF5] text-[#10B981]",
    },
    {
      key: "revision",
      label: "En revisión",
      value: stats.revision,
      badge: (
        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[11px] font-semibold text-purple-700">
          {stats.revision} {stats.revision === 1 ? "pendiente" : "pendientes"}
        </span>
      ),
      icon: Video,
      iconBg: "bg-purple-50 text-purple-700",
    },
    {
      key: "entregado",
      label: "Entregados",
      value: stats.entregados,
      badge: (
        <span className="text-xs font-medium text-slate-500">
          {stats.total ? `${pctEntregados}% del total` : "Sin registros"}
        </span>
      ),
      icon: CircleCheckBig,
      iconBg: "bg-slate-100 text-slate-500",
    },
  ]

  const filterTabs = [
    { key: "todos", label: "Todos", count: stats.total },
    { key: "activos", label: "Activos", count: stats.activos },
    { key: "recibido", label: "Recibidos", count: stats.recibidos },
    { key: "en_proceso", label: "En proceso", count: stats.enProceso },
    { key: "revision", label: "Revisión", count: stats.revision },
    { key: "entregado", label: "Entregados", count: stats.entregados },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TrabajoEdicion[]> = {}
    filtered.forEach((t) => {
      const label = formatCalendarDate(t.fecha_recibo, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      const dateKey = label.charAt(0).toUpperCase() + label.slice(1)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
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

  const getGroupTotal = (items: TrabajoEdicion[]) => {
    return items.reduce((sum, t) => sum + Number(t.precio_cobrado || 0), 0)
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
          <p className="text-xs font-semibold text-slate-500">Cargando historial de edición de video...</p>
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
              Edición de Video
            </h1>
            <p className="text-xs text-slate-500">
              Supervisa proyectos audiovisuales, estados de entrega y pagos de clientes.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2 sm:self-auto">
            <button
              onClick={() => navigate("/servicios/edicion-video/nuevo")}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
              type="button"
            >
              <Plus size={16} className="text-slate-500" />
              <span>Nuevo Trabajo</span>
            </button>
            <button
              onClick={() => navigate("/servicios/edicion-video/agenda")}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#fd761a] px-4 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
              type="button"
            >
              <Kanban size={16} />
              <span>Tablero de Producción</span>
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
                placeholder="Buscar cliente, título o editor..."
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
                          : tab.key === "en_proceso" && tab.count > 0
                            ? "bg-orange-100 text-orange-700"
                            : tab.key === "revision" && tab.count > 0
                              ? "bg-purple-100 text-purple-700"
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

        {/* Tabla de trabajos */}
        <div className={cn("overflow-hidden rounded-xl bg-white", CARD_SHADOW)}>
          <div className="flex items-center justify-between gap-3 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-slate-900">Historial de trabajos</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-xs">
                {filtered.length} registrados
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
                {search ? `Sin resultados para "${search}"` : "No hay trabajos registrados"}
              </p>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                Prueba modificando la búsqueda o registra un nuevo trabajo desde el botón superior.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 pl-4 pr-2 font-semibold">Cliente / Trabajo</th>
                      <th className="px-3 py-2.5 font-semibold">Recepción y límite</th>
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
                                    {items.length} {items.length === 1 ? "trabajo" : "trabajos"}
                                  </span>
                                </div>
                                <span className="shrink-0 font-mono text-[11px] text-slate-500">
                                  ${dayTotal.toFixed(2)} total
                                </span>
                              </button>
                            </td>
                          </tr>

                          {isOpen &&
                            items.map((t) => {
                              const estado = ESTADO_CONFIG[t.estado] || ESTADO_CONFIG.recibido
                              const clienteNombre = getCliente(t)
                              const precio = Number(t.precio_cobrado || 0)
                              const cuenta = t.cuenta_por_cobrar
                              const saldo = cuenta ? Number(cuenta.saldo_pendiente) : precio
                              const isPagado =
                                cuenta?.estado === "pagado" ||
                                saldo <= 0 ||
                                (cuenta && Number(cuenta.monto_abonado) >= precio) ||
                                t.cobro_registrado
                              const isAbonado = !isPagado && cuenta && Number(cuenta.monto_abonado) > 0
                              const diffDays = getDaysDiff(t.fecha_limite)

                              return (
                                <tr
                                  key={t.id}
                                  onClick={() => setSelectedTrabajo(t)}
                                  className="cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/70"
                                >
                                  <td className="py-3 pl-4 pr-2">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={cn(
                                          "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                          getAvatarStyle(t.id),
                                        )}
                                      >
                                        {getInitials(clienteNombre)}
                                      </div>
                                      <div className="flex min-w-0 flex-col">
                                        <span className="truncate font-semibold text-slate-900">
                                          {clienteNombre}
                                        </span>
                                        <span className="truncate text-[11px] text-slate-500">
                                          {t.titulo || "Sin título"}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="whitespace-nowrap px-3 py-3">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-slate-900">
                                        {formatCalendarDate(t.fecha_recibo, {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                      <span className="text-[11px] text-slate-500">
                                        {t.fecha_limite ? (
                                          <span className="inline-flex items-center gap-1">
                                            <span>Límite: {formatCalendarDate(t.fecha_limite, { day: "numeric", month: "short" })}</span>
                                            {diffDays !== null && (
                                              <span
                                                className={cn(
                                                  "rounded px-1 py-0.2 text-[9px] font-bold",
                                                  diffDays < 0
                                                    ? "bg-red-50 text-red-600"
                                                    : diffDays <= 1
                                                      ? "bg-amber-50 text-amber-700"
                                                      : "bg-slate-100 text-slate-500",
                                                )}
                                              >
                                                {diffDays < 0
                                                  ? `${Math.abs(diffDays)}d vencido`
                                                  : diffDays === 0
                                                    ? "Hoy"
                                                    : `${diffDays}d`}
                                              </span>
                                            )}
                                          </span>
                                        ) : (
                                          "Sin fecha límite"
                                        )}
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
                                          t.estado === "en_proceso" && "animate-pulse",
                                        )}
                                      />
                                      <select
                                        value={t.estado}
                                        onChange={(e) => {
                                          changeEstado(t.id, e.target.value as EstadoTrabajo)
                                        }}
                                        disabled={savingMap[t.id]}
                                        title="Cambiar estado del trabajo"
                                        className={cn(
                                          "cursor-pointer appearance-none rounded-full border py-0.5 pl-5 pr-6 text-[10px] font-semibold uppercase tracking-wider outline-none transition-all",
                                          estado.bg,
                                          estado.text,
                                          savingMap[t.id] && "pointer-events-none opacity-50",
                                        )}
                                      >
                                        {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
                                          <option key={val} value={val}>
                                            {cfg.label}
                                          </option>
                                        ))}
                                      </select>
                                      {savingMap[t.id] ? (
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
                                        ${precio.toLocaleString("es-EC", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      {t.monto_descuento && Number(t.monto_descuento) > 0 ? (
                                        <span className="text-[10px] text-slate-400 line-through">
                                          ${(Number(t.precio_original || precio + Number(t.monto_descuento))).toFixed(2)}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-500">
                                          Tarifa fijada
                                        </span>
                                      )}
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

                                  <td className="whitespace-nowrap py-3 pl-1 pr-4 text-right">
                                    <div
                                      className="inline-flex items-center gap-1.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => setSelectedTrabajo(t)}
                                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                                        type="button"
                                      >
                                        Detalles
                                      </button>
                                      <button
                                        onClick={() => navigate(`/servicios/edicion-video/${t.id}/editar`)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                                        type="button"
                                        title="Editar trabajo"
                                      >
                                        <Pencil size={12} />
                                        <span>Editar</span>
                                      </button>
                                      {isPagado ? (
                                        <button
                                          onClick={() =>
                                            navigate(`/finanzas/pagos/cuentas/servicios/pago/${t.id}`, {
                                              state: {
                                                tipo: "edicion",
                                                servicioId: t.id,
                                                cuentaId: t.cuenta_por_cobrar?.id,
                                                nombre: clienteNombre,
                                                montoTotal: precio,
                                                montoSaldo: saldo,
                                                nombreServicio: t.titulo || "Edición de Video",
                                                returnUrl: location.pathname + location.search,
                                              },
                                            })
                                          }
                                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-xs transition-all hover:bg-emerald-100 active:scale-95 cursor-pointer"
                                          type="button"
                                        >
                                          <CircleCheckBig size={12} />
                                          <span>Ver pagos</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            navigate(`/finanzas/pagos/cuentas/servicios/pago/${t.id}`, {
                                              state: {
                                                tipo: "edicion",
                                                servicioId: t.id,
                                                cuentaId: t.cuenta_por_cobrar?.id,
                                                nombre: clienteNombre,
                                                montoTotal: precio,
                                                montoSaldo: saldo,
                                                nombreServicio: t.titulo || "Edición de Video",
                                                returnUrl: location.pathname + location.search,
                                              },
                                            })
                                          }
                                          className="inline-flex items-center gap-1 rounded-lg bg-[#fd761a] px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95 active:scale-95 cursor-pointer"
                                          type="button"
                                        >
                                          <CircleCheckBig size={12} />
                                          <span>Registrar pago</span>
                                        </button>
                                      )}
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
                  Mostrando {filtered.length} de {trabajos.length} trabajos de edición
                </span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span>Datos sincronizados</span>
                  <Clock size={12} className="text-slate-400" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawer Lateral de Detalles */}
      <AnimatePresence>
        {selectedTrabajo && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedTrabajo(null)}
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
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-base font-bold text-slate-900">
                          {selectedTrabajo.titulo || "Detalles del trabajo"}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500">
                        Recepción: {formatCalendarDate(selectedTrabajo.fecha_recibo, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/servicios/edicion-video/${selectedTrabajo.id}`)}
                      className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 hover:shadow-xs"
                      title="Ver página completa del trabajo"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTrabajo(null)}
                      className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 hover:shadow-xs"
                      title="Cerrar panel lateral"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Contenido scrolleable del Drawer */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-slate-800">
                  {/* Flujo de Estados / Stepper */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Estado de producción
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          ESTADO_CONFIG[selectedTrabajo.estado]?.bg,
                          ESTADO_CONFIG[selectedTrabajo.estado]?.text,
                        )}
                      >
                        {ESTADO_CONFIG[selectedTrabajo.estado]?.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {STEPS.map((step, idx) => {
                        const currentStepIdx = getStepIndex(selectedTrabajo.estado)
                        const isDone = idx < currentStepIdx
                        const isCurrent = idx === currentStepIdx
                        return (
                          <button
                            key={step.key}
                            type="button"
                            onClick={() => changeEstado(selectedTrabajo.id, step.key)}
                            disabled={savingMap[selectedTrabajo.id]}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-all cursor-pointer",
                              isCurrent
                                ? "bg-white font-bold text-[#fd761a] shadow-xs ring-1 ring-[#fd761a]/30"
                                : isDone
                                  ? "text-emerald-700 hover:bg-white/80"
                                  : "text-slate-400 hover:bg-white/60",
                            )}
                          >
                            <div
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                                isCurrent
                                  ? "bg-[#fd761a] text-white"
                                  : isDone
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-500",
                              )}
                            >
                              {isDone ? <Check size={11} strokeWidth={3} /> : step.num}
                            </div>
                            <span className="text-[10px] leading-tight font-medium">
                              {step.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Datos del Cliente */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-[#fd761a]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Cliente
                      </h3>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          getAvatarStyle(selectedTrabajo.id),
                        )}
                      >
                        {getInitials(getCliente(selectedTrabajo))}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-bold text-slate-900">
                          {getCliente(selectedTrabajo)}
                        </p>
                        {selectedTrabajo.cliente_externo?.cedula && (
                          <p className="text-xs text-slate-500">
                            Cédula / RUC: {selectedTrabajo.cliente_externo.cedula}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-600">
                          {(selectedTrabajo.cliente?.correo || selectedTrabajo.cliente_externo?.correo) && (
                            <a
                              href={`mailto:${selectedTrabajo.cliente?.correo || selectedTrabajo.cliente_externo?.correo}`}
                              className="inline-flex items-center gap-1 hover:text-[#fd761a]"
                            >
                              <Mail size={13} className="text-slate-400" />
                              <span>{selectedTrabajo.cliente?.correo || selectedTrabajo.cliente_externo?.correo}</span>
                            </a>
                          )}
                          {selectedTrabajo.cliente_externo?.celular && (
                            <a
                              href={`tel:${selectedTrabajo.cliente_externo.celular}`}
                              className="inline-flex items-center gap-1 hover:text-[#fd761a]"
                            >
                              <Phone size={13} className="text-slate-400" />
                              <span>{selectedTrabajo.cliente_externo.celular}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fechas e Hitos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <CalendarDays size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Fecha Recibo
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        {formatCalendarDate(selectedTrabajo.fecha_recibo, {
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
                          Fecha Límite
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900">
                          {selectedTrabajo.fecha_limite
                            ? formatCalendarDate(selectedTrabajo.fecha_limite, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Sin definir"}
                        </p>
                        {selectedTrabajo.fecha_limite && (() => {
                          const diff = getDaysDiff(selectedTrabajo.fecha_limite)
                          if (diff === null) return null
                          return (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[9px] font-bold",
                                diff < 0
                                  ? "bg-red-50 text-red-600"
                                  : diff <= 1
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700",
                              )}
                            >
                              {diff < 0
                                ? `${Math.abs(diff)}d vencido`
                                : diff === 0
                                  ? "Hoy"
                                  : `${diff}d restantes`}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Descripción y Notas */}
                  {(selectedTrabajo.descripcion || selectedTrabajo.notas) && (
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-[#fd761a]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Detalles del Trabajo
                        </h3>
                      </div>
                      {selectedTrabajo.descripcion && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            Descripción / Pauta
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                            {selectedTrabajo.descripcion}
                          </p>
                        </div>
                      )}
                      {selectedTrabajo.notas && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            Notas internas
                          </span>
                          <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/60">
                            {selectedTrabajo.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Editores Asignados */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Equipo de Edición
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {selectedTrabajo.editores?.length || 0} asignados
                      </span>
                    </div>

                    {selectedTrabajo.editores && selectedTrabajo.editores.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedTrabajo.editores.map((ed) => (
                          <div
                            key={ed.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                          >
                            <User size={12} className="text-slate-400" />
                            <span>{ed.nombres} {ed.apellidos}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No hay editores asignados a este trabajo.
                      </p>
                    )}
                  </div>

                  {/* Resumen Financiero y Pago */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign size={15} className="text-[#fd761a]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Resumen Financiero
                        </h3>
                      </div>
                      {(() => {
                        const precio = Number(selectedTrabajo.precio_cobrado || 0)
                        const cuenta = selectedTrabajo.cuenta_por_cobrar
                        const saldo = cuenta ? Number(cuenta.saldo_pendiente) : precio
                        const isPagado =
                          cuenta?.estado === "pagado" ||
                          saldo <= 0 ||
                          (cuenta && Number(cuenta.monto_abonado) >= precio) ||
                          selectedTrabajo.cobro_registrado
                        const isAbonado = !isPagado && cuenta && Number(cuenta.monto_abonado) > 0

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
                        <span className="text-slate-500">Precio pactado:</span>
                        <span className="font-bold text-slate-900">
                          ${Number(selectedTrabajo.precio_cobrado || 0).toLocaleString("es-EC", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {selectedTrabajo.monto_descuento && Number(selectedTrabajo.monto_descuento) > 0 ? (
                        <div className="flex items-center justify-between text-xs text-emerald-700">
                          <span className="flex items-center gap-1">
                            <Tag size={11} />
                            Descuento ({selectedTrabajo.motivo_descuento || "General"}):
                          </span>
                          <span>-${Number(selectedTrabajo.monto_descuento).toFixed(2)}</span>
                        </div>
                      ) : null}

                      {selectedTrabajo.monto_recargo && Number(selectedTrabajo.monto_recargo) > 0 ? (
                        <div className="flex items-center justify-between text-xs text-amber-700">
                          <span className="flex items-center gap-1">
                            <AlertCircle size={11} />
                            Recargo ({selectedTrabajo.motivo_recargo || "Urgencia"}):
                          </span>
                          <span>+${Number(selectedTrabajo.monto_recargo).toFixed(2)}</span>
                        </div>
                      ) : null}

                      <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Abonado:</span>
                        <span className="font-semibold text-emerald-700">
                          ${Number(selectedTrabajo.cuenta_por_cobrar?.monto_abonado || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Saldo pendiente:</span>
                        <span className="font-bold text-slate-900">
                          ${(
                            selectedTrabajo.cuenta_por_cobrar
                              ? Number(selectedTrabajo.cuenta_por_cobrar.saldo_pendiente)
                              : Number(selectedTrabajo.precio_cobrado || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer del Drawer */}
                <div className="border-t border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTrabajo(null)}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
                    >
                      Cerrar
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/servicios/edicion-video/${selectedTrabajo.id}/editar`)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
                      >
                        <Pencil size={13} />
                        <span>Editar</span>
                      </button>

                      {(() => {
                        const precio = Number(selectedTrabajo.precio_cobrado || 0)
                        const cuenta = selectedTrabajo.cuenta_por_cobrar
                        const saldo = cuenta ? Number(cuenta.saldo_pendiente) : precio
                        const isPagado =
                          cuenta?.estado === "pagado" ||
                          saldo <= 0 ||
                          (cuenta && Number(cuenta.monto_abonado) >= precio) ||
                          selectedTrabajo.cobro_registrado

                        return isPagado ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/finanzas/pagos/cuentas/servicios/pago/${selectedTrabajo.id}`, {
                                state: {
                                  tipo: "edicion",
                                  servicioId: selectedTrabajo.id,
                                  cuentaId: selectedTrabajo.cuenta_por_cobrar?.id,
                                  nombre: getCliente(selectedTrabajo),
                                  montoTotal: precio,
                                  montoSaldo: saldo,
                                  nombreServicio: selectedTrabajo.titulo || "Edición de Video",
                                  returnUrl: location.pathname + location.search,
                                },
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-xs transition-all hover:bg-emerald-100 active:scale-95 cursor-pointer"
                          >
                            <CircleCheckBig size={14} />
                            <span>Ver pagos</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/finanzas/pagos/cuentas/servicios/pago/${selectedTrabajo.id}`, {
                                state: {
                                  tipo: "edicion",
                                  servicioId: selectedTrabajo.id,
                                  cuentaId: selectedTrabajo.cuenta_por_cobrar?.id,
                                  nombre: getCliente(selectedTrabajo),
                                  montoTotal: precio,
                                  montoSaldo: saldo,
                                  nombreServicio: selectedTrabajo.titulo || "Edición de Video",
                                  returnUrl: location.pathname + location.search,
                                },
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#fd761a] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95 active:scale-95 cursor-pointer"
                          >
                            <CircleCheckBig size={14} />
                            <span>Registrar pago</span>
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
