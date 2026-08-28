import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock04Icon,
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
  ViewIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { aulasService, type Aula, type ReservaAula } from "@/services/aulas.service"
import { toast } from "sonner"
import { DetalleAulaModal } from "./components/DetalleAulaModal"

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  reservado: { bg: "bg-blue-50 border-blue-200", color: "text-blue-700", label: "Reservado" },
  confirmado: { bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-700", label: "Confirmado" },
  en_progreso: { bg: "bg-amber-50 border-amber-200", color: "text-amber-700", label: "En progreso" },
  completado: { bg: "bg-gray-100 border-gray-200", color: "text-gray-600", label: "Completado" },
  cancelado: { bg: "bg-red-50 border-red-200", color: "text-red-600", label: "Cancelado" },
}

export function HistorialAulasPage() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState<ReservaAula[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Modal de detalle
  const [selectedReserva, setSelectedReserva] = useState<ReservaAula | null>(null)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)

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

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const getAulaObj = useCallback((aulaId: string) => {
    return aulas.find(x => x.id === aulaId)
  }, [aulas])

  const getAulaNombre = useCallback((aulaId: string) => {
    const a = getAulaObj(aulaId)
    return a?.nombre || "—"
  }, [getAulaObj])

  const getClienteNombre = useCallback((r: ReservaAula) => {
    if (r.persona) return `${r.persona.nombres || ""} ${r.persona.apellidos || ""}`.trim()
    if (r.cliente_externo) return `${r.cliente_externo.nombres || ""} ${r.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }, [])

  const filtered = useMemo(() => {
    let list = reservas

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => {
        const nombre = getClienteNombre(r).toLowerCase()
        const aula = getAulaNombre(r.aula_id).toLowerCase()
        return nombre.includes(q) || aula.includes(q)
      })
    }

    if (estadoFilter === "activos") {
      list = list.filter(r => r.estado === "reservado" || r.estado === "confirmado" || r.estado === "en_progreso")
    } else if (estadoFilter !== "todos") {
      list = list.filter(r => r.estado === estadoFilter)
    }

    if (tipoFilter !== "todos") {
      if (tipoFilter === "interno") list = list.filter(r => r.persona_id)
      else if (tipoFilter === "externo") list = list.filter(r => !r.persona_id)
    }

    return list.sort((a, b) =>
      new Date(b.fecha_reserva).getTime() - new Date(a.fecha_reserva).getTime()
    )
  }, [reservas, search, estadoFilter, tipoFilter, getAulaNombre, getClienteNombre])

  const stats = useMemo(() => {
    return {
      total: reservas.length,
      activos: reservas.filter(r => r.estado === "reservado" || r.estado === "confirmado" || r.estado === "en_progreso").length,
      completados: reservas.filter(r => r.estado === "completado").length,
      cancelados: reservas.filter(r => r.estado === "cancelado").length,
    }
  }, [reservas])

  const statCards = [
    { key: "todos", label: "Total Alquileres", value: stats.total, color: "bg-gray-100 text-gray-600", icon: SchoolIcon },
    { key: "activos", label: "Activas / En Curso", value: stats.activos, color: "bg-amber-100 text-amber-600", icon: Clock01Icon },
    { key: "completado", label: "Completados", value: stats.completados, color: "bg-emerald-100 text-emerald-600", icon: CheckmarkCircle04Icon },
    { key: "cancelado", label: "Cancelados", value: stats.cancelados, color: "bg-red-100 text-red-600", icon: Cancel01Icon },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaAula[]> = {}
    filtered.forEach(r => {
      const dateKey = new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(r)
    })
    return Object.entries(groups)
  }, [filtered])

  useEffect(() => {
    if (Object.keys(expandedGroups).length === 0 && groupedByDate.length > 0) {
      setExpandedGroups({ [groupedByDate[0][0]]: true })
    }
  }, [groupedByDate, expandedGroups])

  const getGroupTotal = (items: ReservaAula[]) => {
    return items.reduce((sum, r) => sum + Number(r.precio_total || 0), 0)
  }

  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }))
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
        montoSaldo: r.cuenta_por_cobrar ? Number(r.cuenta_por_cobrar.saldo_pendiente) : Number(r.precio_total) || 0,
        nombreServicio: `Alquiler de Aula ${aulaNombre}`,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20 bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full" style={{ borderColor: COLORS.ACCENT }} />
          <p className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Cargando historial de alquileres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header del servicio */}
      <header className="shrink-0 px-6 lg:px-8 py-5 border-b bg-white sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-35" style={{ color: COLORS.CHARCOAL }}>Servicios</p>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: COLORS.CHARCOAL }}>Alquiler de Aulas</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate("/servicios/aulas/gestion")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 active:scale-95"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            >
              <HugeiconsIcon icon={SchoolIcon} size={14} />
              Gestión de Aulas
            </button>
            <button
              onClick={() => navigate("/servicios/aulas/nueva-reserva")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 active:scale-95"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            >
              <HugeiconsIcon icon={Add01Icon} size={14} />
              Nueva Reserva
            </button>
            <button
              onClick={() => navigate("/servicios/aulas/agenda")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={14} />
              Agenda
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6 space-y-5">
          {/* Tarjetas KPI Interactivas con color */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(card => {
              const isActive = estadoFilter === card.key
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setEstadoFilter(isActive ? "todos" : card.key)}
                  className={cn(
                    "bg-white rounded-2xl border p-4 flex items-center gap-3 transition-all active:scale-[0.98] text-left cursor-pointer hover:border-violet-300 hover:shadow-md",
                    isActive ? "shadow-sm border-violet-400" : ""
                  )}
                  style={{ borderColor: isActive ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }}
                >
                  <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", card.color.split(" ")[0])}>
                    <HugeiconsIcon icon={card.icon} size={18} className={card.color.split(" ")[1]} />
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest opacity-40">{card.label}</p>
                    <p className="text-lg font-black" style={{ color: isActive ? COLORS.ACCENT : COLORS.CHARCOAL }}>
                      {card.value}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {/* Barra de Filtros y Búsqueda */}
            <div className="p-5 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={Clock04Icon} size={22} style={{ color: COLORS.ACCENT }} />
                <div>
                  <h2 className="text-base font-black flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
                    Historial de Alquileres
                    {filtered.length > 0 && <span className="text-xs font-extrabold opacity-45 bg-gray-200 px-2 py-0.5 rounded-full">({filtered.length})</span>}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Buscar cliente o aula..."
                    className="w-full pl-9 pr-9 py-2 rounded-xl border bg-white text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/10"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  />
                  {searchInput && (
                    <button onClick={() => { setSearchInput(""); setSearch("") }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-35 hover:opacity-100">
                      <HugeiconsIcon icon={Cancel01Icon} size={13} />
                    </button>
                  )}
                </div>

                <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border bg-white text-xs font-bold outline-none cursor-pointer"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <option value="todos">Todos los clientes</option>
                  <option value="interno">Clientes Internos</option>
                  <option value="externo">Clientes Externos</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-20 text-center space-y-2">
                <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <HugeiconsIcon icon={SchoolIcon} size={28} className="opacity-20" />
                </div>
                <p className="font-bold text-sm opacity-40" style={{ color: COLORS.CHARCOAL }}>
                  {search ? `Sin resultados para "${search}"` : "No hay reservas registradas"}
                </p>
                <p className="text-xs opacity-30">Prueba modificando los filtros o realizando una nueva reserva</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {groupedByDate.map(([date, items]) => {
                  const isOpen = !!expandedGroups[date]
                  const dayTotal = getGroupTotal(items)

                  return (
                    <div key={date} className="border rounded-2xl bg-white overflow-hidden shadow-xs transition-all" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <div
                        onClick={() => toggleGroup(date)}
                        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                            <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="opacity-40" />
                          </motion.div>
                          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider" style={{ color: COLORS.CHARCOAL }}>
                            {date}
                          </h3>
                          <span className="text-[10px] sm:text-xs opacity-40 font-bold">
                            ({items.length} reserva{items.length !== 1 ? "s" : ""})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-bold text-xs sm:text-sm shrink-0">
                          <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 font-black">
                            Total: ${dayTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="divide-y border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                              {items.map((r) => {
                                const estado = ESTADO_STYLES[r.estado] || ESTADO_STYLES.reservado
                                const clienteNombre = getClienteNombre(r)
                                const aulaNombre = getAulaNombre(r.aula_id)
                                return (
                                  <div key={r.id} className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                                    <div className={cn(
                                      "size-9 rounded-xl flex items-center justify-center shrink-0",
                                      r.persona_id ? "bg-indigo-100" : "bg-emerald-100"
                                    )}>
                                      <HugeiconsIcon icon={r.persona_id ? UserIcon : LibraryIcon} size={14}
                                        className={r.persona_id ? "text-indigo-600" : "text-emerald-600"} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-extrabold truncate" style={{ color: COLORS.CHARCOAL }}>
                                        {clienteNombre}
                                      </p>
                                      <p className="text-[10px] opacity-50 font-bold truncate">
                                        <span className="text-indigo-600">{aulaNombre}</span>
                                        {" · "}
                                        {r.hora_inicio?.substring(0, 5)} – {r.hora_fin?.substring(0, 5)}
                                      </p>
                                    </div>

                                    <span className={cn("inline-flex px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border shrink-0", estado.bg, estado.color)}>
                                      {estado.label}
                                    </span>

                                    <span className="text-xs font-black w-20 text-right shrink-0" style={{ color: COLORS.CHARCOAL }}>
                                      ${Number(r.precio_total).toLocaleString()}
                                    </span>

                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                      <button onClick={() => handleOpenDetalle(r)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                                        style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
                                        title="Ver detalle completo">
                                        <HugeiconsIcon icon={ViewIcon} size={13} />
                                        <span>Detalles</span>
                                      </button>

                                      <button onClick={() => navigate(`/servicios/aulas/reservas/${r.id}/editar`)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold hover:bg-gray-100 hover:text-amber-600 transition-colors"
                                        style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
                                        title="Editar reserva">
                                        <HugeiconsIcon icon={Edit01Icon} size={13} />
                                        <span>Editar</span>
                                      </button>

                                      {r.cuenta_por_cobrar?.estado === 'pagado' || Number(r.cuenta_por_cobrar?.saldo_pendiente ?? (r.precio_total - (r.cuenta_por_cobrar?.monto_abonado ?? 0))) <= 0 ? (
                                        <button onClick={() => handlePago(r)}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 transition-all hover:bg-emerald-100 active:scale-95">
                                          <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                          <span className="hidden sm:inline">Ver pagos</span>
                                        </button>
                                      ) : (
                                        <button onClick={() => handlePago(r)}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                                          style={{ backgroundColor: COLORS.ACCENT }}>
                                          <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                          <span className="hidden sm:inline">Registrar pago</span>
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
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modal de Detalle de Alquiler de Aula */}
      <DetalleAulaModal
        isOpen={detalleModalOpen}
        onClose={() => setDetalleModalOpen(false)}
        reserva={selectedReserva}
        aula={selectedReserva ? getAulaObj(selectedReserva.aula_id) : undefined}
        onEdit={selectedReserva ? () => navigate(`/servicios/aulas/reservas/${selectedReserva.id}/editar`) : undefined}
        onPago={selectedReserva ? () => handlePago(selectedReserva) : undefined}
      />
    </div>
  )
}
