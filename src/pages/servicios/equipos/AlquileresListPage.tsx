import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Search01Icon,
  Cancel01Icon,
  Clock01Icon,
  CheckmarkCircle04Icon,
  Alert02Icon,
  Layers01Icon,
  Camera01Icon,
  ArrowReloadHorizontalIcon,
  ArrowDown01Icon,
  Image01Icon,
  Add01Icon,
  UserIcon,
  MatrixIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { cn, formatCalendarDate, getStorageUrl } from "@/lib/utils"
import { equiposService, type AlquilerEquipo } from "@/services/equipos.service"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"
import { toast } from "sonner"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; dot: string; text: string; borderLeft: string }
> = {
  pendiente: {
    label: "Pendiente",
    bg: "bg-blue-50 border-blue-200/70",
    dot: "bg-blue-600",
    text: "text-blue-800",
    borderLeft: "border-l-blue-600",
  },
  activo: {
    label: "Activo",
    bg: "bg-amber-50 border-amber-200/70",
    dot: "bg-amber-500",
    text: "text-amber-800",
    borderLeft: "border-l-amber-500",
  },
  entregado: {
    label: "Entregado",
    bg: "bg-indigo-50 border-indigo-200/70",
    dot: "bg-indigo-600",
    text: "text-indigo-800",
    borderLeft: "border-l-indigo-600",
  },
  devuelto: {
    label: "Devuelto",
    bg: "bg-emerald-50 border-emerald-200/70",
    dot: "bg-emerald-600",
    text: "text-emerald-800",
    borderLeft: "border-l-emerald-600",
  },
  vencido: {
    label: "Vencido",
    bg: "bg-red-50 border-red-200/70",
    dot: "bg-red-500",
    text: "text-red-800",
    borderLeft: "border-l-red-500",
  },
}

function getWeekRange(date: Date) {
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function getWeekDays(monday: Date) {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

export function AlquileresListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [alquileres, setAlquileres] = useState<AlquilerEquipo[]>([])
  const [vencidos, setVencidos] = useState<AlquilerEquipo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "todos")
  const [zoomFoto, setZoomFoto] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Vista mode & calendar reference
  const [vista, setVista] = useState<"lista" | "calendario">("lista")
  const [fechaRef, setFechaRef] = useState(() => new Date())
  const { monday, sunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const weekDays = useMemo(() => getWeekDays(monday), [monday])
  const weekLabel = `${monday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`

  // Modals
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAlquiler, setSelectedAlquiler] = useState<AlquilerEquipo | null>(null)
  const [devolverOpen, setDevolverOpen] = useState(false)
  const [alquilerADevolver, setAlquilerADevolver] = useState<AlquilerEquipo | null>(null)
  const [devolverForm, setDevolverForm] = useState({ observaciones: "" })
  const [fotoRetornoFile, setFotoRetornoFile] = useState<File | null>(null)
  const [fotoRetornoPreview, setFotoRetornoPreview] = useState<string | null>(null)

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const params: { search?: string; estado?: string } = {}
      if (search.trim()) params.search = search.trim()
      if (filtroEstado && filtroEstado !== "todos" && filtroEstado !== "activos") {
        params.estado = filtroEstado
      }
      const [data, venc] = await Promise.all([
        equiposService.getAlquileres(params),
        equiposService.getVencidos().catch(() => []),
      ])
      setAlquileres(data)
      setVencidos(venc)
    } catch {
      toast.error("Error al cargar alquileres")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [search, filtroEstado])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getResponsable = (a: AlquilerEquipo) => {
    if (a.persona) return `${a.persona.nombres} ${a.persona.apellidos}`.trim()
    if (a.cliente_externo) return `${a.cliente_externo.nombres} ${a.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }

  const handleEntregar = async (alquilerId: string) => {
    try {
      setAlquileres((prev) =>
        prev.map((a) => (a.id === alquilerId ? { ...a, estado: "entregado" } : a)),
      )
      await equiposService.entregarEquipo(alquilerId)
      toast.success("Equipo marcado como entregado")
      setDetailOpen(false)
      loadData(true)
    } catch {
      toast.error("Error al registrar entrega")
      loadData(true)
    }
  }

  const openDevolverModal = (a: AlquilerEquipo) => {
    setAlquilerADevolver(a)
    setDevolverForm({ observaciones: "" })
    setFotoRetornoFile(null)
    setFotoRetornoPreview(null)
    setDevolverOpen(true)
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
      await equiposService.devolverEquipo(alquilerADevolver.id, payload)
      toast.success("Equipo devuelto correctamente")
      setDevolverOpen(false)
      setDetailOpen(false)
      setAlquilerADevolver(null)
      setFotoRetornoFile(null)
      setFotoRetornoPreview(null)
      loadData(true)
    } catch {
      toast.error("Error al registrar devolución")
      loadData(true)
    }
  }

  const filtered = useMemo(() => {
    let list = alquileres

    if (filtroEstado === "activos") {
      list = list.filter((a) => a.estado === "activo" || a.estado === "entregado")
    } else if (filtroEstado === "vencido") {
      list = list.filter(
        (a) =>
          a.estado === "vencido" ||
          ((a.estado === "activo" || a.estado === "entregado") &&
            new Date(a.fecha_devolucion_esperada) < new Date()),
      )
    } else if (filtroEstado !== "todos") {
      list = list.filter((a) => a.estado === filtroEstado)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a) => {
        const equipoNombre = (a.equipo?.nombre || "").toLowerCase()
        const responsable = getResponsable(a).toLowerCase()
        return equipoNombre.includes(q) || responsable.includes(q)
      })
    }

    return list.sort((a, b) => {
      const dateDiff = (b.fecha_entrega || "").localeCompare(a.fecha_entrega || "")
      if (dateDiff !== 0) return dateDiff
      return (b.fecha_devolucion_esperada || "").localeCompare(a.fecha_devolucion_esperada || "")
    })
  }, [alquileres, filtroEstado, search])

  const stats = useMemo(() => {
    const activos = alquileres.filter((a) => a.estado === "activo" || a.estado === "entregado").length
    const vencidosCount = alquileres.filter(
      (a) =>
        a.estado === "vencido" ||
        ((a.estado === "activo" || a.estado === "entregado") &&
          new Date(a.fecha_devolucion_esperada) < new Date()),
    ).length
    const devueltos = alquileres.filter((a) => a.estado === "devuelto").length

    return {
      total: alquileres.length,
      activos,
      vencidos: vencidosCount,
      devueltos,
    }
  }, [alquileres])

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
      label: "ACTIVOS / ENTREGADOS",
      value: stats.activos,
      subtitle: (
        <span className="inline-flex items-center gap-1 text-[11px] text-[#9d4300] bg-[#ffdbca]/60 px-2 py-0.5 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]" />
          En curso
        </span>
      ),
      icon: Clock01Icon,
      iconBg: "bg-[#ffdbca] text-[#9d4300]",
    },
    {
      key: "vencido",
      label: "VENCIDOS",
      value: stats.vencidos,
      subtitle: "Requieren retorno",
      icon: Alert02Icon,
      iconBg: "bg-red-50 text-red-600",
    },
    {
      key: "devuelto",
      label: "DEVUELTOS",
      value: stats.devueltos,
      subtitle: "Finalizados",
      icon: CheckmarkCircle04Icon,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, AlquilerEquipo[]> = {}
    filtered.forEach((a) => {
      const dateKey = formatCalendarDate(a.fecha_entrega, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).toUpperCase()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando alquileres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-50/50 text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header de Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              SERVICIOS / EQUIPOS
            </span>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Alquiler de Equipos
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                Historial y Agenda
              </span>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/servicios/equipos")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Camera01Icon} size={16} className="text-slate-500" />
              <span>Catálogo de Equipos</span>
            </button>
            <button
              onClick={() => navigate("/servicios/equipos")}
              className="h-10 px-4 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Add01Icon} size={16} />
              <span>Nuevo Alquiler</span>
            </button>
          </div>
        </div>

        {/* Attention banner if there are overdue rentals */}
        {vencidos.length > 0 && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3.5 shadow-xs">
            <div className="size-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0 text-red-600">
              <HugeiconsIcon icon={Alert02Icon} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-900">
                ¡Atención! Hay {vencidos.length} alquiler{vencidos.length !== 1 ? "es" : ""} vencido{vencidos.length !== 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                Estos equipos han sobrepasado la fecha esperada de devolución y requieren retorno inmediato.
              </p>
            </div>
            <button
              onClick={() => setFiltroEstado("vencido")}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
            >
              Ver vencidos
            </button>
          </div>
        )}

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

        {/* History & Agenda Workspace Module */}
        <div className="flex flex-col gap-4 mt-1">
          {/* Section Header & Filter Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">
                {vista === "lista" ? "Historial de Alquileres" : "Agenda Semanal de Equipos"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-xs font-semibold">
                {filtered.length}
              </span>
            </div>

            {/* Filter Controls & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Segmented selector: Lista | Calendario */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-0.5">
                <button
                  type="button"
                  onClick={() => setVista("lista")}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    vista === "lista"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  )}
                >
                  <HugeiconsIcon icon={MatrixIcon} size={14} />
                  <span>Lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVista("calendario")}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    vista === "calendario"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  )}
                >
                  <HugeiconsIcon icon={Calendar03Icon} size={14} />
                  <span>Calendario</span>
                </button>
              </div>

              {/* In calendar view: date navigation & period badge */}
              {vista === "calendario" && (
                <>
                  <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs gap-0.5">
                    <button
                      onClick={() => {
                        const d = new Date(fechaRef)
                        d.setDate(d.getDate() - 7)
                        setFechaRef(d)
                      }}
                      className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                      aria-label="Semana anterior"
                    >
                      <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                    </button>
                    <button
                      onClick={() => setFechaRef(new Date())}
                      className="px-3 h-8 flex items-center justify-center text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date(fechaRef)
                        d.setDate(d.getDate() + 7)
                        setFechaRef(d)
                      }}
                      className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                      aria-label="Semana siguiente"
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-slate-800">
                    <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-[#fd761a]" />
                    <span className="text-xs font-bold">{weekLabel}</span>
                  </div>
                </>
              )}

              {/* Search bar */}
              <div className="h-10 bg-white border border-slate-200 rounded-xl px-3.5 flex items-center gap-2 shadow-xs w-full sm:w-64 focus-within:ring-2 focus-within:ring-[#fd761a]/25 focus-within:border-[#fd761a] transition-all">
                <HugeiconsIcon icon={Search01Icon} size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por equipo o responsable…"
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
                onClick={() => loadData(true)}
                className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-xs shrink-0 active:scale-95 cursor-pointer"
                title="Actualizar datos"
                type="button"
              >
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={16} />
              </button>
            </div>
          </div>

          {/* Render based on selected View: Calendario vs Lista */}
          {vista === "calendario" ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden p-4 sm:p-5 flex flex-col">
              {/* Grid 7 days */}
              <div className="grid grid-cols-1 md:grid-cols-7 border border-slate-200/80 rounded-2xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
                {weekDays.map((day, di) => {
                  const dStr = day.toISOString().split("T")[0]
                  const isToday = day.toDateString() === new Date().toDateString()
                  const dayRentals = filtered.filter((a) => {
                    const entrega = a.fecha_entrega ? a.fecha_entrega.split("T")[0] : ""
                    const devolucion = a.fecha_devolucion_esperada ? a.fecha_devolucion_esperada.split("T")[0] : ""
                    return (entrega === dStr) || (devolucion === dStr) || (entrega && devolucion && entrega <= dStr && devolucion >= dStr)
                  })

                  return (
                    <div key={di} className={cn("min-h-[260px] flex flex-col bg-white", isToday && "bg-orange-50/20")}>
                      <div className={cn("p-3 border-b border-slate-200/80 text-center relative", isToday ? "bg-orange-50/60" : "bg-slate-50")}>
                        {isToday && <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#fd761a]" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {day.toLocaleDateString("es-ES", { weekday: "short" })}
                        </span>
                        <p className={cn("text-base font-extrabold mt-0.5", isToday ? "text-[#fd761a]" : "text-slate-800")}>
                          {day.getDate()}
                        </p>
                      </div>
                      <div className="p-2 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[460px]">
                        {dayRentals.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center p-3 text-center">
                            <span className="text-[11px] text-slate-300 font-medium">Sin entregas</span>
                          </div>
                        ) : (
                          dayRentals.map((a) => {
                            const isOverdue =
                              (a.estado === "activo" || a.estado === "entregado") &&
                              new Date(a.fecha_devolucion_esperada) < new Date()
                            const displayEstado = isOverdue ? "vencido" : a.estado
                            const estado = ESTADO_CONFIG[displayEstado] || ESTADO_CONFIG.pendiente
                            const responsable = getResponsable(a)

                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAlquiler(a)
                                  setDetailOpen(true)
                                }}
                                className={cn(
                                  "w-full text-left p-2.5 rounded-xl border border-l-[3.5px] shadow-2xs hover:shadow-xs transition-all cursor-pointer",
                                  estado.bg,
                                  estado.borderLeft
                                )}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-bold text-slate-900 truncate">
                                    {a.equipo?.nombre || "Equipo"}
                                  </span>
                                  <span className={cn("size-2 rounded-full shrink-0", estado.dot)} />
                                </div>
                                <p className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                                  {responsable}
                                </p>
                                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-medium">
                                  <span className="truncate">
                                    Ret: {formatCalendarDate(a.fecha_devolucion_esperada, { day: "numeric", month: "short" })}
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    ${Number(a.precio_total).toFixed(2)}
                                  </span>
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-500 flex-wrap">
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className={cn("size-2.5 rounded-full", v.dot)} />
                    <span>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Vista Lista: Group by Date Card Assembly */
            filtered.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-14 text-center space-y-3 shadow-xs">
                <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <HugeiconsIcon icon={Camera01Icon} size={28} />
                </div>
                <p className="font-bold text-sm text-slate-800">
                  {search ? `Sin resultados para "${search}"` : "No hay alquileres registrados"}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Prueba ajustando la búsqueda o registra un nuevo alquiler desde el catálogo de equipos.
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
                            {items.length} {items.length === 1 ? "alquiler" : "alquileres"}
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
                              {items.map((a) => {
                                const isOverdue =
                                  (a.estado === "activo" || a.estado === "entregado") &&
                                  new Date(a.fecha_devolucion_esperada) < new Date()
                                const displayEstado = isOverdue ? "vencido" : a.estado
                                const estado = ESTADO_CONFIG[displayEstado] || ESTADO_CONFIG.pendiente
                                const responsable = getResponsable(a)

                                const total = Number(a.cuenta_por_cobrar?.monto_total ?? a.precio_total)
                                const abonado = Number(a.cuenta_por_cobrar?.monto_abonado ?? 0)
                                const saldo = total - abonado
                                const isPagado =
                                  a.cuenta_por_cobrar?.estado === "pagado" || saldo <= 0
                                const isAbonado = !isPagado && abonado > 0

                                return (
                                  <div
                                    key={a.id}
                                    className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors duration-150 group"
                                  >
                                    {/* Left Column */}
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <div className="size-11 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#fd761a] group-hover:text-white transition-colors overflow-hidden">
                                        {a.equipo?.foto_url ? (
                                          <img
                                            src={getStorageUrl(a.equipo.foto_url)}
                                            alt={a.equipo.nombre}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <HugeiconsIcon icon={Camera01Icon} size={20} />
                                        )}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedAlquiler(a)
                                              setDetailOpen(true)
                                            }}
                                            className="text-[15px] leading-snug font-semibold text-slate-900 group-hover:text-[#fd761a] truncate transition-colors text-left cursor-pointer"
                                          >
                                            {a.equipo?.nombre || "Equipo"}
                                          </button>
                                          {isOverdue && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                              ¡Vencido!
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                          <span className="inline-flex items-center gap-1">
                                            <HugeiconsIcon
                                              icon={UserIcon}
                                              size={14}
                                              className="text-[#fd761a]"
                                            />
                                            <strong className="font-medium text-slate-800">
                                              {responsable}
                                            </strong>
                                          </span>
                                          <span className="inline-block size-1 rounded-full bg-slate-300" />
                                          <span className="inline-flex items-center gap-1">
                                            <HugeiconsIcon
                                              icon={Clock01Icon}
                                              size={14}
                                              className="text-slate-400"
                                            />
                                            <span>
                                              Retorno: {formatCalendarDate(a.fecha_devolucion_esperada, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                          </span>
                                          {a.foto_salida_url && (
                                            <>
                                              <span className="inline-block size-1 rounded-full bg-slate-300" />
                                              <button
                                                type="button"
                                                onClick={() => setZoomFoto(a.foto_salida_url!)}
                                                className="inline-flex items-center gap-1 text-amber-700 hover:underline cursor-pointer"
                                              >
                                                <HugeiconsIcon icon={Image01Icon} size={13} />
                                                Foto salida
                                              </button>
                                            </>
                                          )}
                                          {a.foto_retorno_url && (
                                            <>
                                              <span className="inline-block size-1 rounded-full bg-slate-300" />
                                              <button
                                                type="button"
                                                onClick={() => setZoomFoto(a.foto_retorno_url!)}
                                                className="inline-flex items-center gap-1 text-emerald-700 hover:underline cursor-pointer"
                                              >
                                                <HugeiconsIcon icon={Image01Icon} size={13} />
                                                Foto retorno
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Column */}
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
                                              ? `Abono $${abonado.toFixed(2)} · Saldo $${saldo.toFixed(2)}`
                                              : "Pago pendiente"}
                                        </span>
                                      </div>

                                      <div className="flex flex-col items-end shrink-0 pl-2">
                                        <span className="text-base font-bold text-slate-900 tracking-tight">
                                          ${Number(a.precio_total).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                          {a.equipo?.precio_diario
                                            ? `$${Number(a.equipo.precio_diario).toFixed(0)}/día`
                                            : "Alquiler"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                                      <button
                                        onClick={() => {
                                          setSelectedAlquiler(a)
                                          setDetailOpen(true)
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                        type="button"
                                      >
                                        Detalles
                                      </button>

                                      {a.estado === "pendiente" && (
                                        <button
                                          onClick={() => handleEntregar(a.id)}
                                          className="px-3.5 py-1.5 rounded-lg bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                          type="button"
                                        >
                                          <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                                          <span>Entregar</span>
                                        </button>
                                      )}

                                      {(a.estado === "activo" || a.estado === "entregado" || a.estado === "vencido") && (
                                        <button
                                          onClick={() => openDevolverModal(a)}
                                          className="px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                          type="button"
                                        >
                                          <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                                          <span>Devolver</span>
                                        </button>
                                      )}

                                      {isPagado ? (
                                        <button
                                          onClick={() =>
                                            navigate(`/finanzas/pagos/cuentas/servicios/pago/${a.id}`, {
                                              state: {
                                                tipo: "equipo",
                                                servicioId: a.id,
                                                cuentaId: a.cuenta_por_cobrar?.id,
                                                nombre: responsable,
                                                montoTotal: Number(a.precio_total) || 0,
                                                montoSaldo: saldo || 0,
                                                nombreServicio: a.equipo?.nombre || "Alquiler de Equipo",
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
                                            navigate(`/finanzas/pagos/cuentas/servicios/pago/${a.id}`, {
                                              state: {
                                                tipo: "equipo",
                                                servicioId: a.id,
                                                cuentaId: a.cuenta_por_cobrar?.id,
                                                nombre: responsable,
                                                montoTotal: Number(a.precio_total) || 0,
                                                montoSaldo: saldo || 0,
                                                nombreServicio: a.equipo?.nombre || "Alquiler de Equipo",
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
                    Mostrando {filtered.length} de {alquileres.length} alquileres registrados
                  </span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>Datos sincronizados</span>
                    <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal Detalle */}
      <AnimatePresence>
        {detailOpen && selectedAlquiler && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl w-full max-w-xl flex flex-col max-h-[85vh] shadow-2xl border border-slate-200"
            >
              <div className="shrink-0 p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Detalle de Alquiler
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedAlquiler.equipo?.nombre}
                  </p>
                </div>
                <button
                  onClick={() => setDetailOpen(false)}
                  className="size-9 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Entrega
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {formatCalendarDate(selectedAlquiler.fecha_entrega, {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Devolución esperada
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {formatCalendarDate(selectedAlquiler.fecha_devolucion_esperada, {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Estado
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border",
                        ESTADO_CONFIG[selectedAlquiler.estado]?.bg || "bg-slate-50",
                        ESTADO_CONFIG[selectedAlquiler.estado]?.text || "text-slate-700",
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          ESTADO_CONFIG[selectedAlquiler.estado]?.dot || "bg-slate-400",
                        )}
                      />
                      {ESTADO_CONFIG[selectedAlquiler.estado]?.label || selectedAlquiler.estado}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Precio total
                    </p>
                    <p className="text-lg font-black text-slate-900 mt-1">
                      ${Number(selectedAlquiler.precio_total).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Cliente */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Responsable / Cliente
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {getResponsable(selectedAlquiler)}
                  </p>
                  {(selectedAlquiler.persona?.correo || selectedAlquiler.cliente_externo?.correo) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedAlquiler.persona?.correo || selectedAlquiler.cliente_externo?.correo}
                    </p>
                  )}
                </div>

                {/* Fotos */}
                {(selectedAlquiler.foto_salida_url || selectedAlquiler.foto_retorno_url) && (
                  <div
                    className={cn(
                      "grid gap-3",
                      selectedAlquiler.foto_salida_url && selectedAlquiler.foto_retorno_url
                        ? "grid-cols-2"
                        : "grid-cols-1",
                    )}
                  >
                    {selectedAlquiler.foto_salida_url && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Foto salida
                        </p>
                        <img
                          src={selectedAlquiler.foto_salida_url}
                          alt="Foto salida"
                          className="w-full aspect-square object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setZoomFoto(selectedAlquiler.foto_salida_url!)}
                        />
                      </div>
                    )}
                    {selectedAlquiler.foto_retorno_url && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Foto retorno
                        </p>
                        <img
                          src={selectedAlquiler.foto_retorno_url}
                          alt="Foto retorno"
                          className="w-full aspect-square object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setZoomFoto(selectedAlquiler.foto_retorno_url!)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedAlquiler.observaciones && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Observaciones
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {selectedAlquiler.observaciones}
                    </p>
                  </div>
                )}
              </div>

              <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setDetailOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
                <div className="flex items-center gap-2">
                  {selectedAlquiler.estado === "pendiente" && (
                    <button
                      onClick={() => handleEntregar(selectedAlquiler.id)}
                      className="px-4 py-2 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle04Icon} size={15} />
                      Marcar como Entregado
                    </button>
                  )}
                  {(selectedAlquiler.estado === "activo" ||
                    selectedAlquiler.estado === "entregado" ||
                    selectedAlquiler.estado === "vencido") && (
                    <button
                      onClick={() => {
                        setDetailOpen(false)
                        openDevolverModal(selectedAlquiler)
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle04Icon} size={15} />
                      Registrar Devolución
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Devolver */}
      <AnimatePresence>
        {devolverOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDevolverOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Registrar Devolución
                </h2>
                <button
                  onClick={() => setDevolverOpen(false)}
                  className="size-9 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Foto retorno (opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors text-center">
                        {fotoRetornoFile ? fotoRetornoFile.name : "Seleccionar imagen del equipo devuelto"}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
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
                      <div className="size-14 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={fotoRetornoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Observaciones de recepción
                  </label>
                  <textarea
                    value={devolverForm.observaciones}
                    onChange={(e) =>
                      setDevolverForm({ ...devolverForm, observaciones: e.target.value })
                    }
                    placeholder="Estado físico del equipo, accesorios completos, etc."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setDevolverOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDevolver}
                  className="px-4 py-2 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold transition-all active:scale-95"
                >
                  Confirmar Devolución
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Zoom Foto */}
      {zoomFoto && <ImageZoom url={zoomFoto} onClose={() => setZoomFoto(null)} />}
    </div>
  )
}
