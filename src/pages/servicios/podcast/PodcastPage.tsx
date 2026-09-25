import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PackageIcon, Calendar03Icon, MatrixIcon, ArrowLeft02Icon, ArrowRight02Icon, ArrowLeft01Icon, Clock01Icon, ArrowDown01Icon, Search01Icon, Cancel01Icon, CheckmarkCircle04Icon, Edit01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { podcastService, type ReservaPodcast, type PaquetePodcast } from "@/services/podcast.service"
import { toast } from "sonner"
import { PodcastKPIs } from "./components/PodcastKPIs"
import { PodcastCalendar } from "./components/PodcastCalendar"
import { getWeekRange, getWeekDays } from "./components/podcast-calendar.utils"
import { ReservaModal } from "./components/ReservaModal"
import { DetalleReservaModal } from "./components/DetalleReservaModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { clearAvailabilityCache } from "@/lib/availabilityCache"

const hours = Array.from({ length: 14 }, (_, i) => i + 7)

export function PodcastPage() {
  const navigate = useNavigate()
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [reservas, setReservas] = useState<ReservaPodcast[]>([])

  const [vista, setVista] = useState<"calendario" | "lista">("calendario")
  const [fechaRef, setFechaRef] = useState(() => new Date())
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [reservaModalOpen, setReservaModalOpen] = useState(false)
  const [editingReserva, setEditingReserva] = useState<ReservaPodcast | null>(null)
  const [detalleReserva, setDetalleReserva] = useState<ReservaPodcast | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)
  const { monday, sunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const weekDays = useMemo(() => getWeekDays(monday), [monday])

  const loadReservas = useCallback(async () => {
    try {
      setReservas(await podcastService.getReservas())
    } catch { toast.error("Error al cargar reservas") }
  }, [])

  useEffect(() => {
    Promise.all([
      podcastService.getPaquetes()
        .then(setPaquetes)
        .catch(() => toast.error("Error al cargar paquetes")),
      podcastService.getReservas()
        .then(setReservas)
        .catch(() => toast.error("Error al cargar reservas")),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (searchQuery && vista === "calendario") setVista("lista")
  }, [searchQuery, vista])

  const filtered = useMemo(() => {
    let list = reservas
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(r => {
        const nombre = r.cliente_externo
          ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.toLowerCase()
          : r.persona ? `${r.persona.nombres} ${r.persona.apellidos}`.toLowerCase() : ""
        const titulo = (r.titulo || r.paquete?.nombre || "").toLowerCase()
        return nombre.includes(q) || titulo.includes(q)
      })
    }
    return list
  }, [reservas, searchQuery])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaPodcast[]> = {}
    filtered
      .slice()
      .sort((a, b) => new Date(b.fecha_reserva).getTime() - new Date(a.fecha_reserva).getTime())
      .forEach(r => {
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

  const handleEdit = (r: ReservaPodcast) => {
    setDetalleOpen(false)
    setEditingReserva(r)
    setReservaModalOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await podcastService.deleteReserva(deleteConfirm.id)
      toast.success("Reserva eliminada")
      clearAvailabilityCache()
      setDeleteConfirm(null)
      loadReservas()
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(message || "Error al eliminar reserva")
    }
    finally { setDeletingItem(false) }
  }

  const handleRegistrarPago = async (id: string) => {
    try {
      await podcastService.registrarPago(id)
      toast.success("Pago registrado")
      loadReservas()
    } catch { toast.error("Error al registrar pago") }
  }

  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }))
  }

  const ESTADO_COLORS: Record<string, string> = {
    pendiente: "bg-blue-100 text-blue-700 border-blue-200",
    confirmado: "bg-amber-100 text-amber-700 border-amber-200",
    en_progreso: "bg-indigo-100 text-indigo-700 border-indigo-200",
    completado: "bg-green-100 text-green-700 border-green-200",
    cancelado: "bg-red-100 text-red-700 border-red-200",
  }

  const handleReservaSaved = () => {
    loadReservas()
  }

  return (
    <div className="min-h-full flex flex-col bg-slate-50/50 text-slate-800">
      {/* Header Principal */}
      <header className="shrink-0 px-6 sm:px-8 py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Servicios / Cabina de Podcast
            </span>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Agenda de Grabaciones
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                Cabina
              </span>
              {loading && (
                <div className="size-4 rounded-full border-2 border-orange-200 border-t-[#fd761a] animate-spin ml-1" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/servicios/podcast/paquetes"
              className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <HugeiconsIcon icon={PackageIcon} size={15} className="text-slate-500" />
              <span>Paquetes</span>
            </Link>
            <button
              onClick={() => navigate("/servicios/podcast/nueva-reserva")}
              className="h-10 px-4 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-2xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <HugeiconsIcon icon={Calendar03Icon} size={15} />
              <span>Nueva Reserva</span>
            </button>
            <button
              onClick={() => navigate("/servicios/podcast")}
              className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} className="text-slate-500" />
              <span>Historial</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <PodcastKPIs reservas={reservas} />

        {/* Contenedor Principal de la Agenda */}
        <main className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {/* Toolbar de Controles (estilo AgendaPage) */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/40">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Selector de Vistas Segmentado: Calendario | Lista */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-0.5">
                {[
                  { k: "calendario" as const, label: "Calendario", icon: Calendar03Icon },
                  { k: "lista" as const, label: "Lista", icon: MatrixIcon },
                ].map(({ k, label, icon }) => (
                  <button
                    key={k}
                    onClick={() => setVista(k)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      vista === k
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    )}
                  >
                    <HugeiconsIcon icon={icon} size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Controles de Navegación Temporal (estilo AgendaPage) */}
              {vista === "calendario" && (
                <>
                  <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs gap-0.5">
                    <button
                      onClick={() => {
                        const d = new Date(fechaRef)
                        d.setDate(d.getDate() - 7)
                        setFechaRef(d)
                      }}
                      aria-label="Semana anterior"
                      className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={ArrowLeft02Icon} size={15} />
                    </button>
                    <button
                      onClick={() => setFechaRef(new Date())}
                      aria-label="Ir a hoy"
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
                      aria-label="Semana siguiente"
                      className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={ArrowRight02Icon} size={15} />
                    </button>
                  </div>

                  {/* Badge de Semana Actual */}
                  <div className="flex items-center gap-2 px-3.5 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-slate-800">
                    <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-[#fd761a]" />
                    <span className="text-xs sm:text-sm font-bold capitalize">
                      {monday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – {sunday.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Buscador Rápido */}
            <div className="flex items-center gap-2.5">
              <div className="h-10 bg-white border border-slate-200/90 rounded-xl px-3.5 flex items-center gap-2 shadow-2xs w-full sm:w-64 focus-within:ring-2 focus-within:ring-[#fd761a]/20 focus-within:border-[#fd761a] transition-all">
                <HugeiconsIcon icon={Search01Icon} size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar cliente o programa..."
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
                />
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput("")
                      setSearchQuery("")
                    }}
                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="space-y-3 w-full max-w-lg px-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : vista === "calendario" ? (
              <PodcastCalendar
                weekDays={weekDays}
                horas={hours}
                reservas={reservas}
                onSelect={(r) => {
                  setDetalleReserva(r)
                  setDetalleOpen(true)
                }}
              />
            ) : (
              <div className="p-4 sm:p-6 space-y-4">
                {groupedByDate.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <HugeiconsIcon icon={Calendar03Icon} size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {searchQuery
                        ? `Sin resultados para "${searchQuery}"`
                        : "No hay reservas de podcast registradas"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Prueba seleccionando otra fecha o creando una nueva reserva.
                    </p>
                  </div>
                ) : (
                  groupedByDate.map(([date, items]) => {
                    const isOpen = !!expandedGroups[date]
                    const dayTotal = items.reduce((s, r) => s + Number(r.precio_total || 0), 0)
                    return (
                      <div
                        key={date}
                        className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs"
                      >
                        <div
                          onClick={() => toggleGroup(date)}
                          className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: isOpen ? 0 : -90 }}
                              transition={{ duration: 0.15 }}
                              className="text-slate-400"
                            >
                              <HugeiconsIcon icon={ArrowDown01Icon} size={15} />
                            </motion.div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              {date}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-[10px] font-bold text-slate-700">
                              {items.length} sesión{items.length !== 1 ? "es" : ""}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                            Total: ${dayTotal.toFixed(2)} USD
                          </span>
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
                              <div className="divide-y divide-slate-100">
                                {items.map((r) => {
                                  const color =
                                    ESTADO_COLORS[r.estado] ||
                                    "bg-slate-100 text-slate-600 border-slate-200"
                                  const clientName = r.cliente_externo
                                    ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.trim()
                                    : r.persona
                                      ? `${r.persona.nombres} ${r.persona.apellidos}`.trim()
                                      : "—"
                                  return (
                                    <div
                                      key={r.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer"
                                      onClick={() => {
                                        setDetalleReserva(r)
                                        setDetalleOpen(true)
                                      }}
                                    >
                                      <div className="flex items-center gap-3.5 min-w-0">
                                        <div
                                          className={cn(
                                            "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                                            r.estado === "pendiente"
                                              ? "bg-blue-50 text-blue-600 border-blue-100"
                                              : r.estado === "confirmado"
                                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                                : r.estado === "en_progreso"
                                                  ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                  : r.estado === "completado"
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-red-50 text-red-600 border-red-100"
                                          )}
                                        >
                                          <HugeiconsIcon
                                            icon={
                                              r.estado === "completado"
                                                ? CheckmarkCircle04Icon
                                                : Clock01Icon
                                            }
                                            size={16}
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold text-slate-900 truncate">
                                            {clientName}
                                          </p>
                                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                            <span className="font-semibold text-slate-700">
                                              {r.titulo || r.paquete?.nombre || "Sin título"}
                                            </span>
                                            {" · "}
                                            <span>
                                              {r.hora_inicio?.substring(0, 5)} – {r.hora_fin?.substring(0, 5)}
                                            </span>
                                          </p>
                                        </div>
                                      </div>

                                      <div
                                        className="flex items-center gap-3 shrink-0 self-end sm:self-center"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <span
                                          className={cn(
                                            "inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            color
                                          )}
                                        >
                                          {r.estado}
                                        </span>
                                        <span className="text-xs font-extrabold text-slate-900 w-24 text-right">
                                          ${Number(r.precio_total).toFixed(2)} USD
                                        </span>
                                        <div className="flex items-center gap-1 pl-1">
                                          {!r.pago_registrado && (
                                            <button
                                              onClick={() => handleRegistrarPago(r.id)}
                                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95 shadow-2xs cursor-pointer"
                                            >
                                              <HugeiconsIcon
                                                icon={CheckmarkCircle04Icon}
                                                size={12}
                                              />
                                              <span>Pagar</span>
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleEdit(r)}
                                            className="size-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                            title="Editar reserva"
                                          >
                                            <HugeiconsIcon icon={Edit01Icon} size={14} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDelete(
                                                r.id,
                                                r.titulo || r.paquete?.nombre || "Grabación"
                                              )
                                            }
                                            className="size-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                                            title="Eliminar reserva"
                                          >
                                            <HugeiconsIcon icon={Delete01Icon} size={14} />
                                          </button>
                                        </div>
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
                  })
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <ReservaModal
        key={editingReserva?.id || "edit"}
        isOpen={reservaModalOpen}
        onClose={() => { setReservaModalOpen(false); setEditingReserva(null) }}
        paquetes={paquetes}
        editingReserva={editingReserva}
        onSaved={handleReservaSaved}
      />

      <DetalleReservaModal
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        reserva={detalleReserva}
        onEdit={() => { if (detalleReserva) handleEdit(detalleReserva) }}
      />

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Reserva"
        message={`¿Eliminar permanentemente la reserva de "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
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
