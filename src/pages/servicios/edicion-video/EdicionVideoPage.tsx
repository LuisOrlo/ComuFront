import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon,
  Edit01Icon,
  Search01Icon,
  Tick02Icon,
  Calendar03Icon,
  Alert02Icon,
  Clock01Icon,
  ArrowLeft02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import {
  Plus,
  Trash2,
  LayoutGrid,
  LayoutList,
  X,
  Play,
  CheckCircle2,
  RotateCcw,
  DollarSign,
  Eye,
  Film,
} from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn, parseLocalDate } from "@/lib/utils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import {
  edicionVideoService,
  type TrabajoEdicion,
  type EstadoTrabajo,
  ESTADO_TRABAJO_LABELS,
} from "@/services/edicion-video.service"
import { toast } from "sonner"

interface ColumnDef {
  key: EstadoTrabajo
  label: string
  pillBg: string
  pillText: string
  dotBg: string
  headerBg: string
  headerBorder: string
  accentColor: string
}

const KANBAN_COLUMNS: ColumnDef[] = [
  {
    key: "recibido",
    label: "Recibido",
    pillBg: "bg-blue-50",
    pillText: "text-blue-700 border-blue-200",
    dotBg: "bg-blue-500",
    headerBg: "bg-blue-50/50",
    headerBorder: "border-blue-100",
    accentColor: "#3b82f6",
  },
  {
    key: "en_proceso",
    label: "En Proceso",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700 border-amber-200",
    dotBg: "bg-amber-500",
    headerBg: "bg-amber-50/50",
    headerBorder: "border-amber-100",
    accentColor: "#f59e0b",
  },
  {
    key: "revision",
    label: "En Revisión",
    pillBg: "bg-purple-50",
    pillText: "text-purple-700 border-purple-200",
    dotBg: "bg-purple-500",
    headerBg: "bg-purple-50/50",
    headerBorder: "border-purple-100",
    accentColor: "#8b5cf6",
  },
  {
    key: "entregado",
    label: "Entregado",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700 border-emerald-200",
    dotBg: "bg-emerald-500",
    headerBg: "bg-emerald-50/50",
    headerBorder: "border-emerald-100",
    accentColor: "#10b981",
  },
]

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = dateStr.includes("T") ? new Date(dateStr) : parseLocalDate(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = dateStr.includes("T") ? new Date(dateStr) : parseLocalDate(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

export function EdicionVideoPage() {
  const navigate = useNavigate()
  const [trabajos, setTrabajos] = useState<TrabajoEdicion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [vista, setVista] = useState<"pizarra" | "lista">("pizarra")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const loadTrabajos = useCallback(async () => {
    try {
      const params: { search?: string; per_page?: number } = { per_page: 100 }
      if (debouncedSearch) params.search = debouncedSearch
      const res = await edicionVideoService.getTrabajos(params)
      setTrabajos(res.data || [])
    } catch {
      toast.error("Error al cargar trabajos de edición")
    }
  }, [debouncedSearch])

  useEffect(() => {
    setLoading(true)
    loadTrabajos().finally(() => setLoading(false))
  }, [loadTrabajos])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const grouped = useMemo(() => {
    const groups: Record<EstadoTrabajo, TrabajoEdicion[]> = {
      recibido: [],
      en_proceso: [],
      revision: [],
      entregado: [],
    }
    trabajos.forEach((t) => {
      if (groups[t.estado]) groups[t.estado].push(t)
    })
    return groups
  }, [trabajos])

  const filteredTrabajos = useMemo(() => {
    let list = trabajos
    if (filtroEstado !== "todos") {
      list = list.filter((t) => t.estado === filtroEstado)
    }
    return list
  }, [trabajos, filtroEstado])

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await edicionVideoService.deleteTrabajo(deleteConfirm.id)
      toast.success("Trabajo eliminado correctamente")
      setDeleteConfirm(null)
      loadTrabajos()
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(message || "Error al eliminar trabajo")
    } finally {
      setDeletingItem(false)
    }
  }

  const changeEstado = async (id: string, estado: EstadoTrabajo) => {
    try {
      await edicionVideoService.updateTrabajo(id, { estado })
      toast.success(`Trabajo movido a ${ESTADO_TRABAJO_LABELS[estado]}`)
      loadTrabajos()
    } catch {
      toast.error("Error al actualizar estado")
    }
  }

  const handleRegistrarEntrega = async (id: string) => {
    try {
      await edicionVideoService.registrarEntrega(id, {
        fecha_entrega: new Date().toISOString(),
        precio_cobrado: undefined,
      })
      toast.success("Entrega registrada con éxito")
      loadTrabajos()
    } catch {
      toast.error("Error al registrar entrega")
    }
  }

  const handleRegistrarCobro = async (id: string) => {
    try {
      await edicionVideoService.registrarCobro(id)
      toast.success("Cobro registrado con éxito")
      loadTrabajos()
    } catch {
      toast.error("Error al registrar cobro")
    }
  }

  const todayStr = new Date().toISOString().split("T")[0]

  const getClienteNombre = (t: TrabajoEdicion) => {
    if (t.cliente) return `${t.cliente.nombres} ${t.cliente.apellidos}`.trim()
    if (t.cliente_externo) return `${t.cliente_externo.nombres} ${t.cliente_externo.apellidos || ""}`.trim()
    return null
  }

  return (
    <div className="min-h-full bg-slate-50/50 text-slate-800 pb-16 flex flex-col">
      {/* Header Contextual */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            
            <div className="flex items-center gap-3 mt-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Tablero de Producción
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-[#fd761a] border border-orange-200">
                {trabajos.length} {trabajos.length === 1 ? "proyecto" : "proyectos"}
              </span>
            </div>

          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              to="/servicios/edicion-video"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-[0.98]"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={15} className="text-slate-400" />
              <span>Historial</span>
            </Link>

            <button
              onClick={() => navigate("/servicios/edicion-video/nuevo")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Nuevo Trabajo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 flex flex-col min-h-0">
        {/* Filter & View Toolbar */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, descripción o cliente..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFiltroEstado("todos")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                filtroEstado === "todos"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70",
              )}
            >
              Todos ({trabajos.length})
            </button>
            {KANBAN_COLUMNS.map((col) => {
              const count = grouped[col.key].length
              const isActive = filtroEstado === col.key
              return (
                <button
                  key={col.key}
                  onClick={() => setFiltroEstado(isActive ? "todos" : col.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer",
                    isActive
                      ? "bg-white shadow-xs border-slate-300 ring-2 ring-slate-900/10 font-bold"
                      : "bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-600",
                  )}
                >
                  <span className={cn("size-2 rounded-full", col.dotBg)} />
                  <span>{col.label}</span>
                  <span className="text-[11px] opacity-60">({count})</span>
                </button>
              )
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 self-end md:self-auto shrink-0">
            <button
              onClick={() => setVista("pizarra")}
              title="Vista Pizarra (Kanban)"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                vista === "pizarra"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Pizarra</span>
            </button>
            <button
              onClick={() => setVista("lista")}
              title="Vista Lista (Tabla)"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                vista === "lista"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <LayoutList size={15} />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </section>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
            <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
            <p className="text-xs font-semibold text-slate-500">Cargando tablero de producción...</p>
          </div>
        ) : trabajos.length === 0 ? (
          /* Empty State General */
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
            <div className="size-16 rounded-2xl bg-orange-50 text-[#fd761a] flex items-center justify-center border border-orange-100 mb-3.5">
              <HugeiconsIcon icon={VideoIcon} size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {search ? "No se encontraron trabajos" : "Sin trabajos de edición registrados"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
              {search
                ? `No hay coincidencias para "${search}". Intenta con otros términos.`
                : "Comienza registrando un nuevo proyecto audiovisual para planificar las fases de montaje y postproducción."}
            </p>
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                onClick={() => navigate("/servicios/edicion-video/nuevo")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm transition-all hover:brightness-105 active:scale-95 cursor-pointer"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Registrar Primer Trabajo</span>
              </button>
            )}
          </div>
        ) : vista === "pizarra" ? (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 items-start">
            {KANBAN_COLUMNS.map((col) => {
              const allItems = grouped[col.key]
              const items =
                filtroEstado === "todos" || filtroEstado === col.key
                  ? allItems
                  : []

              if (filtroEstado !== "todos" && filtroEstado !== col.key) {
                return null
              }

              return (
                <div
                  key={col.key}
                  className={cn(
                    "flex flex-col bg-slate-100/60 rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs transition-all",
                    filtroEstado !== "todos" && "md:col-span-2 lg:col-span-4",
                  )}
                >
                  {/* Column Header */}
                  <div className={cn("px-4 py-3.5 border-b flex items-center justify-between", col.headerBg, col.headerBorder)}>
                    <div className="flex items-center gap-2.5">
                      <span className={cn("size-2.5 rounded-full", col.dotBg)} />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {col.label}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-bold border",
                          col.pillBg,
                          col.pillText,
                        )}
                      >
                        {allItems.length}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate("/servicios/edicion-video/nuevo")}
                      title="Nuevo trabajo en esta fase"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all cursor-pointer"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Cards Container */}
                  <div
                    className={cn(
                      "p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[160px] scrollbar-thin",
                      filtroEstado !== "todos" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0",
                    )}
                  >
                    {items.length === 0 ? (
                      <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400">
                        <div className="size-10 rounded-xl bg-white/70 border border-slate-200/60 flex items-center justify-center mb-2">
                          <Film size={18} className="opacity-40" />
                        </div>
                        <p className="text-xs font-semibold text-slate-500">Sin trabajos en esta fase</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Las tareas aparecerán aquí</p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {items.map((t, idx) => {
                          const isVencido = t.fecha_limite < todayStr && t.estado !== "entregado"
                          const isProximo = !isVencido && t.fecha_limite === todayStr && t.estado !== "entregado"
                          const clienteNombre = getClienteNombre(t)

                          return (
                            <motion.div
                              key={t.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: idx * 0.02, duration: 0.18 }}
                              onClick={() => navigate(`/servicios/edicion-video/${t.id}`)}
                              className={cn(
                                "bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all group cursor-pointer relative flex flex-col justify-between gap-3",
                                isVencido
                                  ? "border-rose-300 ring-1 ring-rose-200 bg-rose-50/20"
                                  : isProximo
                                    ? "border-amber-300 ring-1 ring-amber-200 bg-amber-50/20"
                                    : "border-slate-200/90 hover:border-slate-300",
                              )}
                            >
                              {/* Card Top: Badges & Actions */}
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {isVencido && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                        <HugeiconsIcon icon={Alert02Icon} size={11} />
                                        <span>Vencido</span>
                                      </span>
                                    )}
                                    {isProximo && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                        <HugeiconsIcon icon={Clock01Icon} size={11} />
                                        <span>Vence hoy</span>
                                      </span>
                                    )}
                                    {t.cobro_registrado ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <HugeiconsIcon icon={Tick02Icon} size={11} />
                                        <span>Cobrado</span>
                                      </span>
                                    ) : t.estado === "entregado" ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                        <DollarSign size={10} />
                                        <span>Por cobrar</span>
                                      </span>
                                    ) : null}
                                  </div>

                                  {/* Quick card action buttons on hover */}
                                  <div
                                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/servicios/edicion-video/${t.id}/editar`)}
                                      title="Editar trabajo"
                                      className="size-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                      <HugeiconsIcon icon={Edit01Icon} size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(t.id, t.titulo)}
                                      title="Eliminar trabajo"
                                      className="size-6 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Title & Client */}
                                <h4
                                  className="text-sm font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors line-clamp-2"
                                  title={t.titulo}
                                >
                                  {t.titulo}
                                </h4>

                                {clienteNombre && (
                                  <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                    <HugeiconsIcon icon={UserIcon} size={12} className="text-slate-400 shrink-0" />
                                    <span className="text-xs font-semibold truncate text-slate-700">
                                      {clienteNombre}
                                    </span>
                                  </div>
                                )}

                                {t.descripcion && (
                                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                                    {t.descripcion}
                                  </p>
                                )}
                              </div>

                              {/* Dates & Editors */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                  <div className="flex items-center gap-1">
                                    <HugeiconsIcon icon={Calendar03Icon} size={12} className="text-slate-400" />
                                    <span>Límite:</span>
                                    <span
                                      className={cn(
                                        "font-semibold",
                                        isVencido ? "text-rose-600 font-bold" : isProximo ? "text-amber-600 font-bold" : "text-slate-700",
                                      )}
                                    >
                                      {formatShortDate(t.fecha_limite)}
                                    </span>
                                  </div>
                                  <span className="text-slate-400 text-[10px]">
                                    Recibido: {formatShortDate(t.fecha_recibo)}
                                  </span>
                                </div>

                                {/* Editors stacked avatars */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
                                    {t.editores && t.editores.length > 0 ? (
                                      <>
                                        {t.editores.slice(0, 3).map((ed) => (
                                          <div
                                            key={ed.id}
                                            title={`${ed.nombres} ${ed.apellidos}`}
                                            className="size-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-2xs shrink-0"
                                          >
                                            {ed.nombres.charAt(0)}
                                            {ed.apellidos.charAt(0)}
                                          </div>
                                        ))}
                                        {t.editores.length > 3 && (
                                          <div className="size-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-2xs shrink-0">
                                            +{t.editores.length - 3}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">Sin editor</span>
                                    )}
                                  </div>

                                  {/* Price Tag */}
                                  {t.precio_cobrado != null && (
                                    <span className="text-xs font-bold text-slate-900">
                                      ${Number(t.precio_cobrado).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Card Action Button (Transition / Entrega / Cobro) */}
                              <div
                                className="pt-2 border-t border-slate-100 flex items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {col.key === "recibido" && (
                                  <button
                                    type="button"
                                    onClick={() => changeEstado(t.id, "en_proceso")}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 transition-all active:scale-[0.98] cursor-pointer"
                                  >
                                    <Play size={12} className="fill-amber-600 text-amber-600" />
                                    <span>Iniciar Edición</span>
                                  </button>
                                )}

                                {col.key === "en_proceso" && (
                                  <button
                                    type="button"
                                    onClick={() => changeEstado(t.id, "revision")}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 transition-all active:scale-[0.98] cursor-pointer"
                                  >
                                    <Eye size={13} />
                                    <span>A Revisión</span>
                                  </button>
                                )}

                                {col.key === "revision" && (
                                  <div className="w-full flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => changeEstado(t.id, "en_proceso")}
                                      title="Devolver a edición"
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                    >
                                      <RotateCcw size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRegistrarEntrega(t.id)}
                                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                      <CheckCircle2 size={13} />
                                      <span>Entregar</span>
                                    </button>
                                  </div>
                                )}

                                {col.key === "entregado" && !t.cobro_registrado && (
                                  <button
                                    type="button"
                                    onClick={() => handleRegistrarCobro(t.id)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                                  >
                                    <DollarSign size={13} />
                                    <span>Registrar Cobro</span>
                                  </button>
                                )}

                                {col.key === "entregado" && t.cobro_registrado && (
                                  <div className="w-full py-1 text-center text-[11px] font-bold text-emerald-600 bg-emerald-50/60 rounded-lg border border-emerald-100 flex items-center justify-center gap-1">
                                    <CheckCircle2 size={12} />
                                    <span>Completado y Cobrado</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table / List View */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Proyecto / Video</th>
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5">Fechas Clave</th>
                    <th className="px-5 py-3.5">Editores</th>
                    <th className="px-5 py-3.5">Finanzas</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <AnimatePresence mode="popLayout">
                    {filteredTrabajos.map((t, i) => {
                      const isVencido = t.fecha_limite < todayStr && t.estado !== "entregado"
                      const isProximo = !isVencido && t.fecha_limite === todayStr && t.estado !== "entregado"
                      const col = KANBAN_COLUMNS.find((c) => c.key === t.estado)
                      const clienteNombre = getClienteNombre(t)

                      return (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02, duration: 0.15 }}
                          onClick={() => navigate(`/servicios/edicion-video/${t.id}`)}
                          className={cn(
                            "cursor-pointer hover:bg-slate-50/80 transition-colors group",
                            isVencido && "bg-rose-50/30",
                            isProximo && "bg-amber-50/30",
                          )}
                        >
                          {/* Proyecto */}
                          <td className="px-5 py-3.5">
                            <div className="min-w-0 max-w-xs">
                              <p className="font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors truncate">
                                {t.titulo}
                              </p>
                              {t.descripcion && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {t.descripcion}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Cliente */}
                          <td className="px-5 py-3.5">
                            {clienteNombre ? (
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <HugeiconsIcon icon={UserIcon} size={13} className="text-slate-400 shrink-0" />
                                <span className="font-semibold truncate max-w-[140px]">{clienteNombre}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Sin cliente</span>
                            )}
                          </td>

                          {/* Estado */}
                          <td className="px-5 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border",
                                col?.pillBg,
                                col?.pillText,
                              )}
                            >
                              <span className={cn("size-1.5 rounded-full", col?.dotBg)} />
                              {ESTADO_TRABAJO_LABELS[t.estado]}
                            </span>
                          </td>

                          {/* Fechas */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-[10px]">Límite:</span>
                                <span
                                  className={cn(
                                    "font-semibold",
                                    isVencido ? "text-rose-600 font-bold" : isProximo ? "text-amber-600 font-bold" : "text-slate-800",
                                  )}
                                >
                                  {formatDate(t.fecha_limite)}
                                </span>
                                {isVencido && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                                    Vencido
                                  </span>
                                )}
                                {isProximo && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                                    Hoy
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Recibido: {formatDate(t.fecha_recibo)}
                              </span>
                            </div>
                          </td>

                          {/* Editores */}
                          <td className="px-5 py-3.5">
                            {t.editores && t.editores.length > 0 ? (
                              <div className="flex items-center -space-x-1.5">
                                {t.editores.slice(0, 3).map((ed) => (
                                  <div
                                    key={ed.id}
                                    title={`${ed.nombres} ${ed.apellidos}`}
                                    className="size-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-2xs shrink-0"
                                  >
                                    {ed.nombres.charAt(0)}
                                    {ed.apellidos.charAt(0)}
                                  </div>
                                ))}
                                {t.editores.length > 3 && (
                                  <div className="size-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-2xs shrink-0">
                                    +{t.editores.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>

                          {/* Finanzas */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-900">
                                {t.precio_cobrado != null ? `$${Number(t.precio_cobrado).toFixed(2)}` : "—"}
                              </span>
                              {t.cobro_registrado ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                  <HugeiconsIcon icon={Tick02Icon} size={11} /> Cobrado
                                </span>
                              ) : t.estado === "entregado" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                  Por cobrar
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="px-5 py-3.5 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Workflow buttons */}
                              {t.estado === "recibido" && (
                                <button
                                  type="button"
                                  onClick={() => changeEstado(t.id, "en_proceso")}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  Iniciar
                                </button>
                              )}
                              {t.estado === "en_proceso" && (
                                <button
                                  type="button"
                                  onClick={() => changeEstado(t.id, "revision")}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                                >
                                  A Revisión
                                </button>
                              )}
                              {t.estado === "revision" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => changeEstado(t.id, "en_proceso")}
                                    title="Ajustar"
                                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <RotateCcw size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRegistrarEntrega(t.id)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  >
                                    Entregar
                                  </button>
                                </>
                              )}
                              {t.estado === "entregado" && !t.cobro_registrado && (
                                <button
                                  type="button"
                                  onClick={() => handleRegistrarCobro(t.id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                                >
                                  Cobrar
                                </button>
                              )}

                              <div className="w-px h-4 bg-slate-200 mx-1" />

                              <button
                                type="button"
                                onClick={() => navigate(`/servicios/edicion-video/${t.id}/editar`)}
                                title="Editar"
                                className="size-7 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <HugeiconsIcon icon={Edit01Icon} size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(t.id, t.titulo)}
                                title="Eliminar"
                                className="size-7 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Trabajo de Edición"
        message={`¿Estás seguro de que deseas eliminar permanentemente el trabajo "${deleteConfirm?.name}"? Esta acción removerá el proyecto del tablero y sus asignaciones.`}
        confirmText="Eliminar Trabajo"
        cancelText="Conservar"
        isDangerous={true}
        isLoading={deletingItem}
        icon="trash"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
