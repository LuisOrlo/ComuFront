import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react"
import { useNavigate, useParams, useLocation } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Search,
  X,
  CalendarDays,
  Plus,
  Layers,
  RefreshCw,
  RotateCcw,
  Pencil,
  Trash2,
  Camera,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  Check,
} from "lucide-react"
import { cn, formatCalendarDate } from "@/lib/utils"
import { equiposService, type Equipo, type AlquilerEquipo } from "@/services/equipos.service"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ConfirmationModal"

const CARD_SHADOW = "shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; dot: string; text: string }
> = {
  pendiente: {
    label: "Pendiente",
    bg: "bg-blue-50 border-blue-200/70",
    dot: "bg-blue-500",
    text: "text-blue-700",
  },
  activo: {
    label: "Activo",
    bg: "bg-amber-50 border-amber-200/70",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  entregado: {
    label: "Entregado",
    bg: "bg-orange-50 border-orange-200/70",
    dot: "bg-orange-500",
    text: "text-[#9d4300]",
  },
  devuelto: {
    label: "Devuelto",
    bg: "bg-emerald-50 border-emerald-200/70",
    dot: "bg-emerald-600",
    text: "text-emerald-800",
  },
  vencido: {
    label: "Vencido",
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

export function HistorialEquipoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()

  const [equipo, setEquipo] = useState<Equipo | null>(null)
  const [alquileres, setAlquileres] = useState<AlquilerEquipo[]>([])
  const [loading, setLoading] = useState(true)
  const [zoomFoto, setZoomFoto] = useState<string | null>(null)

  const [cedula, setCedula] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, last_page: 1, current_page: 1, per_page: 10 })

  const [filtroEstado, setFiltroEstado] = useState("")
  const [pagoFilter, setPagoFilter] = useState<"todos" | "pagado" | "pendiente">("todos")
  const [sortOrder, setSortOrder] = useState<"recientes" | "antiguos" | "monto">("recientes")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [devolverOpen, setDevolverOpen] = useState(false)
  const [alquilerADevolver, setAlquilerADevolver] = useState<AlquilerEquipo | null>(null)
  const [devolverForm, setDevolverForm] = useState({ observaciones: "" })
  const [fotoRetornoFile, setFotoRetornoFile] = useState<File | null>(null)
  const [fotoRetornoPreview, setFotoRetornoPreview] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AlquilerEquipo | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(
    async (silent = false) => {
      if (!id) return
      if (!silent) setLoading(true)
      try {
        const params: {
          equipo_id: string
          page: number
          per_page: number
          cedula?: string
          estado?: string
        } = {
          equipo_id: id,
          page,
          per_page: 20,
        }
        if (cedula.trim()) params.cedula = cedula.trim()
        if (filtroEstado) params.estado = filtroEstado
        const [eq, result] = await Promise.all([
          equiposService.getEquipo(id),
          equiposService.getAlquileresConMeta(params),
        ])
        setEquipo(eq)
        setAlquileres(result.data)
        setMeta(result.meta)
      } catch {
        toast.error("Error al cargar historial")
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [id, page, cedula, filtroEstado],
  )

  useEffect(() => {
    if (!id) {
      navigate("/servicios/equipos")
      return
    }
    loadData()
  }, [id, navigate, loadData])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCedula(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const getResponsable = useCallback((a: AlquilerEquipo) => {
    if (a.persona) return `${a.persona.nombres || ""} ${a.persona.apellidos || ""}`.trim()
    if (a.cliente_externo) return `${a.cliente_externo.nombres || ""} ${a.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }, [])

  const openDevolverModal = (a: AlquilerEquipo) => {
    setAlquilerADevolver(a)
    setDevolverForm({ observaciones: "" })
    setFotoRetornoFile(null)
    setFotoRetornoPreview(null)
    setDevolverOpen(true)
  }

  const handleEntregar = async (alquilerId: string) => {
    try {
      setAlquileres((prev) =>
        prev.map((a) => (a.id === alquilerId ? { ...a, estado: "entregado" } : a)),
      )
      setEquipo((prev) => (prev ? { ...prev, estado: "alquilado" } : null))
      await equiposService.entregarEquipo(alquilerId)
      toast.success("Equipo marcado como entregado")
      loadData(true)
    } catch {
      toast.error("Error al registrar entrega")
      loadData(true)
    }
  }

  const handleDevolver = async () => {
    if (!alquilerADevolver) return
    try {
      const payload = fotoRetornoFile
        ? (() => {
            const fd = new FormData()
            fd.append("foto_retorno", fotoRetornoFile)
            if (devolverForm.observaciones) fd.append("observaciones", devolverForm.observaciones)
            return fd
          })()
        : devolverForm
      setAlquileres((prev) =>
        prev.map((a) => (a.id === alquilerADevolver.id ? { ...a, estado: "devuelto" } : a)),
      )
      setEquipo((prev) => (prev ? { ...prev, estado: "disponible" } : null))
      await equiposService.devolverEquipo(alquilerADevolver.id, payload)
      toast.success("Equipo devuelto correctamente")
      setDevolverOpen(false)
      setAlquilerADevolver(null)
      setFotoRetornoFile(null)
      setFotoRetornoPreview(null)
      loadData(true)
    } catch {
      toast.error("Error al registrar devolución")
      loadData(true)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await equiposService.deleteAlquiler(deleteConfirm.id)
      toast.success("Alquiler eliminado")
      setDeleteConfirm(null)
      await loadData(true)
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(message || "Error al eliminar alquiler")
    } finally {
      setDeletingItem(false)
    }
  }

  const filtered = useMemo(() => {
    let list = alquileres

    if (pagoFilter !== "todos") {
      list = list.filter((a) => {
        const total = Number(a.cuenta_por_cobrar?.monto_total ?? a.precio_total)
        const abonado = Number(a.cuenta_por_cobrar?.monto_abonado ?? 0)
        const saldo = total - abonado
        const isPagado = a.cuenta_por_cobrar?.estado === "pagado" || saldo <= 0
        return pagoFilter === "pagado" ? isPagado : !isPagado
      })
    }

    return [...list].sort((a, b) => {
      if (sortOrder === "monto") return Number(b.precio_total || 0) - Number(a.precio_total || 0)
      const keyA = `${a.fecha_entrega || ""} ${a.created_at || ""}`
      const keyB = `${b.fecha_entrega || ""} ${b.created_at || ""}`
      return sortOrder === "antiguos" ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA)
    })
  }, [alquileres, pagoFilter, sortOrder])

  const stats = useMemo(() => {
    const total = meta.total || alquileres.length
    const activos = alquileres.filter(
      (a) => a.estado === "activo" || a.estado === "entregado",
    ).length
    const vencidos = alquileres.filter((a) => {
      const isOverdue =
        (a.estado === "activo" || a.estado === "entregado") &&
        new Date(a.fecha_devolucion_esperada) < new Date()
      return a.estado === "vencido" || isOverdue
    }).length
    const devueltos = alquileres.filter((a) => a.estado === "devuelto").length
    const pendientes = alquileres.filter((a) => a.estado === "pendiente").length
    return { total, activos, vencidos, devueltos, pendientes }
  }, [alquileres, meta.total])

  const periodoLabel = useMemo(() => {
    const label = new Date()
      .toLocaleDateString("es-EC", { month: "short", year: "numeric" })
      .replace(".", "")
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [])

  const statCards = [
    {
      key: "",
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
      key: "activo",
      label: "Activos / En curso",
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
      key: "vencido",
      label: "Vencidos",
      value: stats.vencidos,
      badge: (
        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600">
          {stats.vencidos} por retornar
        </span>
      ),
      icon: AlertCircle,
      iconBg: "bg-red-50 text-red-600",
    },
    {
      key: "devuelto",
      label: "Devueltos",
      value: stats.devueltos,
      badge: (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
          Finalizados
        </span>
      ),
      icon: CircleCheckBig,
      iconBg: "bg-slate-100 text-slate-500",
    },
  ]

  const filterTabs = [
    { key: "", label: "Todos", count: stats.total },
    { key: "activo", label: "Activos", count: stats.activos },
    { key: "pendiente", label: "Pendientes", count: stats.pendientes },
    { key: "entregado", label: "Entregados", count: alquileres.filter((a) => a.estado === "entregado").length },
    { key: "devuelto", label: "Devueltos", count: stats.devueltos },
    { key: "vencido", label: "Vencidos", count: stats.vencidos },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, AlquilerEquipo[]> = {}
    filtered.forEach((a) => {
      const label = formatCalendarDate(a.fecha_entrega, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      const dateKey = label.charAt(0).toUpperCase() + label.slice(1)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(a)
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

  const getGroupTotal = (items: AlquilerEquipo[]) => {
    return items.reduce((sum, a) => sum + Number(a.precio_total || 0), 0)
  }

  const limpiarFiltros = () => {
    setSearchInput("")
    setCedula("")
    setFiltroEstado("")
    setPagoFilter("todos")
    setSortOrder("recientes")
    setPage(1)
  }

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

  if (!equipo) {
    return (
      <div className="flex h-full min-h-[450px] items-center justify-center bg-[#f8fafc]">
        <p className="text-sm font-semibold text-slate-500">Equipo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8fafc] pb-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header de página */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => navigate("/servicios/equipos")}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
              title="Volver a equipos"
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="space-y-1 min-w-0">
              
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl truncate">
                {equipo.nombre}
              </h1>
              <p className="text-xs text-slate-500">
                Historial de alquileres, entregas, devoluciones y pagos registrados.
              </p>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2 sm:self-auto">
            <span
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold uppercase tracking-wider",
                equipo.estado === "disponible"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                  : equipo.estado === "alquilado"
                    ? "bg-amber-50 text-amber-700 border-amber-200/80"
                    : "bg-red-50 text-red-700 border-red-200/80",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  equipo.estado === "disponible"
                    ? "bg-emerald-500"
                    : equipo.estado === "alquilado"
                      ? "bg-amber-500"
                      : "bg-red-500",
                )}
              />
              {equipo.estado === "disponible"
                ? "Disponible"
                : equipo.estado === "alquilado"
                  ? "Alquilado"
                  : "Mantenimiento"}
            </span>

            <button
              onClick={() => navigate(`/servicios/equipos/nuevo-alquiler/${id || equipo.id}`)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#fd761a] px-4 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
              type="button"
            >
              <Plus size={16} />
              <span>Nuevo Alquiler</span>
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
                onClick={() => {
                  setFiltroEstado(isActive ? "" : card.key)
                  setPage(1)
                }}
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
                placeholder="Buscar por cédula o responsable..."
                className="h-9 w-full rounded-lg border border-slate-200/80 bg-slate-50 pl-9 pr-8 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#fd761a]/15"
              />
              {searchInput ? (
                <button
                  onClick={() => {
                    setSearchInput("")
                    setCedula("")
                    setPage(1)
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

              {(cedula || filtroEstado || pagoFilter !== "todos" || sortOrder !== "recientes") && (
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
                    onClick={() => {
                      setFiltroEstado(tab.key)
                      setPage(1)
                    }}
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
                          : tab.key === "activo" && tab.count > 0
                            ? "bg-orange-100 text-orange-700"
                            : tab.key === "vencido" && tab.count > 0
                              ? "bg-red-100 text-red-700"
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

        {/* Tabla de alquileres de equipos */}
        <div className={cn("overflow-hidden rounded-xl bg-white", CARD_SHADOW)}>
          <div className="flex items-center justify-between gap-3 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-slate-900">Historial de alquileres</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-xs">
                {filtered.length} de {meta.total} registrados
              </span>
            </div>
            <button
              onClick={() => loadData(true)}
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
                <Camera size={28} />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {cedula ? `Sin resultados para "${cedula}"` : "No hay alquileres registrados"}
              </p>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                Prueba modificando la búsqueda o registra un nuevo alquiler desde el botón superior.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 pl-4 pr-2 font-semibold">Responsable / Cliente</th>
                      <th className="px-3 py-2.5 font-semibold">Fechas de Alquiler</th>
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
                                    {items.length} {items.length === 1 ? "alquiler" : "alquileres"}
                                  </span>
                                </div>
                                <span className="shrink-0 font-mono text-[11px] text-slate-500">
                                  ${dayTotal.toFixed(2)} total
                                </span>
                              </button>
                            </td>
                          </tr>

                          {isOpen &&
                            items.map((a) => {
                              const isOverdue =
                                (a.estado === "activo" || a.estado === "entregado") &&
                                new Date(a.fecha_devolucion_esperada) < new Date()
                              const displayEstado = isOverdue ? "vencido" : a.estado
                              const estado = ESTADO_CONFIG[displayEstado] || ESTADO_CONFIG.pendiente
                              const responsableNombre = getResponsable(a)

                              const total = Number(a.cuenta_por_cobrar?.monto_total ?? a.precio_total)
                              const abonado = Number(a.cuenta_por_cobrar?.monto_abonado ?? 0)
                              const saldo = total - abonado
                              const isPagado = a.cuenta_por_cobrar?.estado === "pagado" || saldo <= 0
                              const isAbonado = !isPagado && abonado > 0

                              return (
                                <tr
                                  key={a.id}
                                  className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/70"
                                >
                                  <td className="py-3 pl-4 pr-2">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={cn(
                                          "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                          getAvatarStyle(a.id),
                                        )}
                                      >
                                        {getInitials(responsableNombre)}
                                      </div>
                                      <div className="flex min-w-0 flex-col">
                                        <div className="flex items-center gap-1.5">
                                          <span className="truncate font-semibold text-slate-900">
                                            {responsableNombre}
                                          </span>
                                          {(a.persona?.cedula || a.cliente_externo?.cedula) && (
                                            <span className="text-[10px] text-slate-400">
                                              · {a.persona?.cedula || a.cliente_externo?.cedula}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                          {a.foto_salida_url && (
                                            <button
                                              type="button"
                                              onClick={() => setZoomFoto(a.foto_salida_url!)}
                                              className="inline-flex items-center gap-0.5 text-[#fd761a] hover:underline cursor-pointer"
                                            >
                                              <ImageIcon size={11} />
                                              <span>Salida</span>
                                            </button>
                                          )}
                                          {a.foto_retorno_url && (
                                            <button
                                              type="button"
                                              onClick={() => setZoomFoto(a.foto_retorno_url!)}
                                              className="inline-flex items-center gap-0.5 text-emerald-700 hover:underline cursor-pointer"
                                            >
                                              <ImageIcon size={11} />
                                              <span>Retorno</span>
                                            </button>
                                          )}
                                          {!a.foto_salida_url && !a.foto_retorno_url && (
                                            <span>Sin fotos adjuntas</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="whitespace-nowrap px-3 py-3">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-slate-900">
                                        {formatCalendarDate(a.fecha_entrega, {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                      <span className="text-[11px] text-slate-500">
                                        Retorno: {formatCalendarDate(a.fecha_devolucion_esperada, { day: "numeric", month: "short" })}
                                        {isOverdue && (
                                          <span className="ml-1 rounded bg-red-50 px-1 py-0.2 text-[9px] font-bold text-red-600">
                                            Vencido
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="whitespace-nowrap px-2 py-3">
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                        estado.bg,
                                        estado.text,
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "size-1.5 rounded-full",
                                          estado.dot,
                                          displayEstado === "activo" && "animate-pulse",
                                        )}
                                      />
                                      {estado.label}
                                    </span>
                                  </td>

                                  <td className="whitespace-nowrap px-3 py-3 text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="font-bold tabular-nums text-slate-900">
                                        ${Number(a.precio_total).toLocaleString("es-EC", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        ${Number(equipo.precio_diario).toFixed(0)}/día base
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
                                    <div className="inline-flex items-center gap-1.5">
                                      {a.estado === "pendiente" && (
                                        <button
                                          onClick={() => handleEntregar(a.id)}
                                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 cursor-pointer"
                                          type="button"
                                        >
                                          <Check size={12} />
                                          <span>Entregar</span>
                                        </button>
                                      )}

                                      {(a.estado === "activo" ||
                                        a.estado === "entregado" ||
                                        a.estado === "vencido") && (
                                        <button
                                          onClick={() => openDevolverModal(a)}
                                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer"
                                          type="button"
                                        >
                                          <span>Devolver</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => navigate(`/servicios/equipos/alquileres/${a.id}/editar`)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                                        type="button"
                                        title="Editar alquiler"
                                      >
                                        <Pencil size={12} />
                                        <span>Editar</span>
                                      </button>

                                      {isPagado ? (
                                        <button
                                          onClick={() =>
                                            navigate(`/finanzas/pagos/cuentas/servicios/pago/${a.id}`, {
                                              state: {
                                                tipo: "equipo",
                                                servicioId: a.id,
                                                cuentaId: a.cuenta_por_cobrar?.id,
                                                nombre: responsableNombre,
                                                montoTotal: total || 0,
                                                montoSaldo: saldo || 0,
                                                nombreServicio: `Alquiler de ${equipo.nombre}`,
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
                                            navigate(`/finanzas/pagos/cuentas/servicios/pago/${a.id}`, {
                                              state: {
                                                tipo: "equipo",
                                                servicioId: a.id,
                                                cuentaId: a.cuenta_por_cobrar?.id,
                                                nombre: responsableNombre,
                                                montoTotal: total || 0,
                                                montoSaldo: saldo || 0,
                                                nombreServicio: `Alquiler de ${equipo.nombre}`,
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

                                      <button
                                        onClick={() => setDeleteConfirm(a)}
                                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                        type="button"
                                        title="Eliminar alquiler"
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

              {/* Pie de tabla con paginación */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-2.5 text-xs text-slate-500 sm:flex-row">
                <span className="font-medium">
                  Mostrando {filtered.length} de {meta.total} alquileres registrados
                </span>

                {meta.last_page > 1 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      type="button"
                    >
                      <ChevronLeft size={13} />
                      <span>Anterior</span>
                    </button>
                    <span className="font-semibold text-slate-700 px-1">
                      {meta.current_page} / {meta.last_page}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                      disabled={page >= meta.last_page}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      type="button"
                    >
                      <span>Siguiente</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>Datos sincronizados</span>
                    <Clock size={12} className="text-slate-400" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Tarjeta de ficha técnica del equipo */}
        {equipo && (
          <div className={cn("rounded-xl border border-slate-200/80 bg-white p-4", CARD_SHADOW)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {equipo.foto_url ? (
                  <img
                    src={equipo.foto_url}
                    alt={equipo.nombre}
                    className="size-12 rounded-xl object-cover border border-slate-200 cursor-pointer"
                    onClick={() => setZoomFoto(equipo.foto_url!)}
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Camera size={22} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 truncate text-sm">{equipo.nombre}</h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                        equipo.estado === "disponible"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : equipo.estado === "alquilado"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200",
                      )}
                    >
                      {equipo.estado === "disponible"
                        ? "Disponible"
                        : equipo.estado === "alquilado"
                          ? "Alquilado"
                          : "Mantenimiento"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {equipo.descripcion || "Sin descripción adicional"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tarifa diaria</span>
                  <span className="font-bold text-slate-900">${Number(equipo.precio_diario).toFixed(2)}/día</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/servicios/equipos/${equipo.id}/editar`)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                >
                  <Pencil size={13} />
                  <span>Editar equipo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Devolución */}
      <AnimatePresence>
        {devolverOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDevolverOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900">Registrar Devolución</h2>
                <button
                  onClick={() => setDevolverOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Foto de retorno (opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100">
                        {fotoRetornoFile ? fotoRetornoFile.name : "Seleccionar imagen"}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFotoRetornoFile(file)
                            setFotoRetornoPreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </label>
                    {fotoRetornoPreview && (
                      <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                        <img src={fotoRetornoPreview} className="size-full object-cover" alt="Preview retorno" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Observaciones
                  </label>
                  <textarea
                    value={devolverForm.observaciones}
                    onChange={(e) =>
                      setDevolverForm({ ...devolverForm, observaciones: e.target.value })
                    }
                    rows={2}
                    placeholder="Condiciones del equipo devuelto..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-5 py-4">
                <button
                  onClick={() => setDevolverOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDevolver}
                  className="rounded-xl bg-[#fd761a] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95 active:scale-95 cursor-pointer"
                  type="button"
                >
                  Confirmar Devolución
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {zoomFoto && <ImageZoom url={zoomFoto} onClose={() => setZoomFoto(null)} />}

      <ConfirmationModal
        isOpen={Boolean(deleteConfirm)}
        title="Eliminar alquiler"
        message={`¿Eliminar permanentemente el alquiler de "${deleteConfirm?.equipo?.nombre || equipo?.nombre || "equipo"}"? Esta acción no se puede deshacer.`}
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
