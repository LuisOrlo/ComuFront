import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight02Icon,
  ArrowDown01Icon,
  Search01Icon,
  Cancel01Icon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Alert02Icon,
  CheckmarkCircle04Icon,
  Image01Icon,
  Layers01Icon,
  Camera01Icon,
  ArrowReloadHorizontalIcon,
  Edit01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { cn, formatCalendarDate } from "@/lib/utils"
import { equiposService, type Equipo, type AlquilerEquipo } from "@/services/equipos.service"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"
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
  activo: {
    label: "Activo",
    bg: "bg-amber-50 border-amber-200/70",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  entregado: {
    label: "Entregado",
    bg: "bg-indigo-50 border-indigo-200/70",
    dot: "bg-indigo-600",
    text: "text-indigo-800",
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
    text: "text-red-800",
  },
}

export function HistorialEquipoPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [equipo, setEquipo] = useState<Equipo | null>(null)
  const [alquileres, setAlquileres] = useState<AlquilerEquipo[]>([])
  const [loading, setLoading] = useState(true)
  const [zoomFoto, setZoomFoto] = useState<string | null>(null)

  const [cedula, setCedula] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, last_page: 1, current_page: 1, per_page: 10 })

  const [filtroEstado, setFiltroEstado] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [devolverOpen, setDevolverOpen] = useState(false)
  const [alquilerADevolver, setAlquilerADevolver] = useState<AlquilerEquipo | null>(null)
  const [devolverForm, setDevolverForm] = useState({ observaciones: "" })
  const [fotoRetornoFile, setFotoRetornoFile] = useState<File | null>(null)
  const [fotoRetornoPreview, setFotoRetornoPreview] = useState<string | null>(null)

  const loadData = useCallback(
    async (silent = false) => {
      if (!id) return
      if (!silent) setLoading(true)
      try {
        const params: { equipo_id: string; page: number; per_page: number; cedula?: string; estado?: string } = {
          equipo_id: id,
          page,
          per_page: 10,
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

  const getResponsable = (a: AlquilerEquipo) => {
    if (a.persona) return `${a.persona.nombres} ${a.persona.apellidos}`.trim()
    if (a.cliente_externo) return `${a.cliente_externo.nombres} ${a.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }

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

  const activosCount = alquileres.filter(
    (a) => a.estado === "activo" || a.estado === "entregado",
  ).length
  const vencidosCount = alquileres.filter(
    (a) =>
      a.estado === "vencido" ||
      ((a.estado === "activo" || a.estado === "entregado") &&
        new Date(a.fecha_devolucion_esperada) < new Date()),
  ).length
  const devueltosCount = alquileres.filter((a) => a.estado === "devuelto").length

  const statCards = [
    {
      key: "",
      label: "TOTAL ALQUILERES",
      value: meta.total,
      subtitle: "Periodo actual",
      icon: Layers01Icon,
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      key: "activo",
      label: "ACTIVOS / ENTREGADOS",
      value: activosCount,
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
      value: vencidosCount,
      subtitle: "Requieren retorno",
      icon: Alert02Icon,
      iconBg: "bg-red-50 text-red-600",
    },
    {
      key: "devuelto",
      label: "DEVUELTOS",
      value: devueltosCount,
      subtitle: "Finalizados",
      icon: CheckmarkCircle04Icon,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, AlquilerEquipo[]> = {}
    alquileres.forEach((a) => {
      const dateKey = formatCalendarDate(a.fecha_entrega, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).toUpperCase()
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(a)
    })
    return Object.entries(groups)
  }, [alquileres])

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
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando historial de alquileres...</p>
        </div>
      </div>
    )
  }

  if (!equipo) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <p className="text-sm font-semibold text-slate-500">Equipo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header de Página */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => navigate("/servicios/equipos")}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver a equipos"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="min-w-0">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                SERVICIOS · EQUIPOS
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5 truncate">
                {equipo.nombre}
              </h1>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                "h-10 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5",
                equipo.estado === "disponible"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : equipo.estado === "alquilado"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-red-50 text-red-700 border-red-200",
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
                  : "En mantenimiento"}
            </span>

            <button
              onClick={() => navigate("/servicios/equipos/nuevo-alquiler")}
              className="h-10 px-4 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Add01Icon} size={17} />
              <span>Nuevo Alquiler</span>
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
                onClick={() => {
                  setFiltroEstado(isActive ? "" : card.key)
                  setPage(1)
                }}
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
                {alquileres.length}
              </span>
            </div>

            {/* Filter Controls (40px Height) */}
            <div className="flex items-center gap-2.5">
              <div className="h-10 bg-white border border-slate-200 rounded-xl px-3.5 flex items-center gap-2 shadow-xs w-full sm:w-72 focus-within:ring-2 focus-within:ring-[#fd761a]/25 focus-within:border-[#fd761a] transition-all">
                <HugeiconsIcon icon={Search01Icon} size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setPage(1)
                  }}
                  placeholder="Buscar por cédula o responsable…"
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {cedula && (
                  <button
                    onClick={() => {
                      setCedula("")
                      setPage(1)
                    }}
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

          {/* Group by Date Card Assembly */}
          {alquileres.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-14 text-center space-y-3 shadow-xs">
              <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <HugeiconsIcon icon={Camera01Icon} size={28} />
              </div>
              <p className="font-bold text-sm text-slate-800">
                {cedula ? `Sin resultados para "${cedula}"` : "Sin alquileres registrados"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Este equipo no registra alquileres con los filtros seleccionados.
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

                              return (
                                <div
                                  key={a.id}
                                  className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors duration-150 group"
                                >
                                  {/* Left Column */}
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="size-11 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#fd761a] group-hover:text-white transition-colors">
                                      <HugeiconsIcon icon={UserIcon} size={20} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[15px] leading-snug font-semibold text-slate-900 group-hover:text-[#fd761a] truncate transition-colors">
                                          {responsable}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                          <HugeiconsIcon
                                            icon={Clock01Icon}
                                            size={14}
                                            className="text-slate-400"
                                          />
                                          <span>
                                            Retorno: {formatCalendarDate(a.fecha_devolucion_esperada, { day: "numeric", month: "short" })}
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
                                            : abonado > 0
                                              ? "text-amber-700"
                                              : "text-slate-500",
                                        )}
                                      >
                                        {isPagado
                                          ? "Pagado"
                                          : abonado > 0
                                            ? `Abono $${abonado.toFixed(2)} · Saldo $${saldo.toFixed(2)}`
                                            : "Pago pendiente"}
                                      </span>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0 pl-2">
                                      <span className="text-base font-bold text-slate-900 tracking-tight">
                                        ${Number(a.precio_total).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        ${Number(equipo.precio_diario).toFixed(0)}/día base
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right Column: Hierarchical Actions */}
                                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                                    {a.estado === "pendiente" && (
                                      <button
                                        onClick={() => handleEntregar(a.id)}
                                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                                        type="button"
                                      >
                                        Entregar
                                      </button>
                                    )}

                                    {(a.estado === "activo" ||
                                      a.estado === "entregado" ||
                                      a.estado === "vencido") && (
                                      <button
                                        onClick={() => openDevolverModal(a)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                                        type="button"
                                      >
                                        Devolver
                                      </button>
                                    )}

                                    <button
                                      onClick={() => navigate(`/servicios/equipos/alquileres/${a.id}/editar`)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                                      type="button"
                                    >
                                      <HugeiconsIcon icon={Edit01Icon} size={14} />
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
                                              nombre: responsable,
                                              montoTotal: total || 0,
                                              montoSaldo: saldo || 0,
                                              nombreServicio: `Alquiler de ${equipo.nombre}`,
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
                                              montoTotal: total || 0,
                                              montoSaldo: saldo || 0,
                                              nombreServicio: `Alquiler de ${equipo.nombre}`,
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

              {/* Footnote / Paginación */}
              <div className="px-5 py-3 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs shadow-2xs">
                <span className="font-medium">
                  Mostrando {alquileres.length} de {meta.total} registros
                </span>

                {meta.last_page > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold transition-all hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
                      <span>Anterior</span>
                    </button>
                    <span className="text-xs font-semibold text-slate-700 px-2">
                      {meta.current_page} / {meta.last_page}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                      disabled={page >= meta.last_page}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold transition-all hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900">Registrar Devolución</h2>
                <button
                  onClick={() => setDevolverOpen(false)}
                  className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Foto de retorno
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium hover:bg-slate-100 transition-colors text-center text-slate-600">
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
                      <div className="size-12 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <img src={fotoRetornoPreview} className="w-full h-full object-cover" />
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 resize-none text-slate-800"
                  />
                </div>
              </div>
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setDevolverOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDevolver}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#fd761a] hover:opacity-95 shadow-xs cursor-pointer active:scale-95"
                >
                  Confirmar Devolución
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {zoomFoto && <ImageZoom url={zoomFoto} onClose={() => setZoomFoto(null)} />}
    </div>
  )
}
