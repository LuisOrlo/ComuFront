import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useLocation } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import { DiscountIcon, HistoryIcon, Calendar03Icon, MatrixIcon, ArrowLeft02Icon, ArrowRight02Icon, Search01Icon, Cancel01Icon, ArrowDown01Icon, Edit01Icon, Delete01Icon, CheckmarkCircle04Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { radioService, type TarifaRadio, type ReservaRadio } from "@/services/radio.service"
import { toast } from "sonner"
import { RadioKPIs } from "./components/RadioKPIs"
import { RadioCalendar } from "./components/RadioCalendar"
import { getWeekRange, getWeekDays } from "./components/radio-calendar.utils"
import { ReservaForm } from "./components/ReservaForm"
import { DetalleReservaModal } from "./components/DetalleReservaModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"

const hours = Array.from({ length: 14 }, (_, i) => i + 7)

function LinkButton({ to, icon, label }: { to: string; icon: IconSvgElement; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all active:scale-[0.97]"
      style={{ color: COLORS.CHARCOAL, backgroundColor: "oklch(0.95 0 0)" }}
    >
      <HugeiconsIcon icon={icon} size={14} />
      {label}
    </Link>
  )
}

export function RadioPage() {
  const [tarifas, setTarifas] = useState<TarifaRadio[]>([])
  const [loading, setLoading] = useState(true)
  const [reservas, setReservas] = useState<ReservaRadio[]>([])

  const [vista, setVista] = useState<"calendario" | "lista">("calendario")
  const [fechaRef, setFechaRef] = useState(() => new Date())
  const [filtroEstado, setFiltroEstado] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [listaFechaDesde, setListaFechaDesde] = useState(() => {
    const { monday } = getWeekRange(new Date())
    return monday.toISOString().split("T")[0]
  })
  const [listaFechaHasta, setListaFechaHasta] = useState(() => {
    const { sunday } = getWeekRange(new Date())
    return sunday.toISOString().split("T")[0]
  })

  const [reservaModalOpen, setReservaModalOpen] = useState(false)
  const [editingReserva, setEditingReserva] = useState<ReservaRadio | null>(null)
  const [detalleReserva, setDetalleReserva] = useState<ReservaRadio | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const { monday, sunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const weekDays = useMemo(() => getWeekDays(monday), [monday])

  const loadReservas = useCallback(async () => {
    try {
      const filters: Record<string, string> = {}
      if (vista === "lista") {
        filters.fecha_desde = listaFechaDesde
        filters.fecha_hasta = listaFechaHasta
      } else {
        filters.fecha_desde = monday.toISOString().split("T")[0]
        filters.fecha_hasta = sunday.toISOString().split("T")[0]
      }
      if (filtroEstado) filters.estado = filtroEstado
      const res = await radioService.getReservas(filters)
      setReservas(res.data)
    } catch {
      toast.error("Error al cargar reservas")
    }
  }, [monday, sunday, filtroEstado, vista, listaFechaDesde, listaFechaHasta])

  const loadTarifas = async () => {
    try {
      setTarifas(await radioService.getTarifas())
    } catch {
      toast.error("Error al cargar tarifas")
    }
  }

  useEffect(() => {

    setLoading(true)
    Promise.all([loadTarifas(), loadReservas()])
      .finally(() => setLoading(false))
  }, [loadReservas])

  const location = useLocation()
  useEffect(() => {
    const initial = location.state as { editarReserva?: ReservaRadio } | null
    if (initial?.editarReserva) {
      setEditingReserva(initial.editarReserva)
      setVista("lista")
      setReservaModalOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ? `${r.cliente_externo.nombres || ""}`.toLowerCase()
          : r.persona ? `${r.persona.nombres} ${r.persona.apellidos}`.toLowerCase() : ""
        const tarifa = (r.tarifa?.nombre || "").toLowerCase()
        return nombre.includes(q) || tarifa.includes(q)
      })
    }
    return list
  }, [reservas, searchQuery])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaRadio[]> = {}
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

  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }))
  }

  const ESTADO_COLORS: Record<string, string> = {
    reservado: "bg-orange-100 text-orange-700",
    confirmado: "bg-emerald-100 text-emerald-700",
    en_progreso: "bg-blue-100 text-blue-700",
    completado: "bg-gray-100 text-gray-500",
    cancelado: "bg-red-100 text-red-600",
  }

  const handleEdit = (r: ReservaRadio) => {
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
      await radioService.deleteReserva(deleteConfirm.id)
      toast.success("Reserva anulada")
      setDeleteConfirm(null)
      loadReservas()
    } catch {
      toast.error("Error al anular reserva")
    } finally {
      setDeletingItem(false)
    }
  }

  const handleRegistrarPago = async (id: string) => {
    try {
      await radioService.registrarPago(id)
      toast.success("Pago registrado")
      loadReservas()
    } catch {
      toast.error("Error al registrar pago")
    }
  }

  const handleReservaSaved = () => {
    loadReservas()
    loadTarifas()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      {!reservaModalOpen && (
        <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
                Alquiler de Radio
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LinkButton to="/servicios/radio/tarifas" icon={DiscountIcon} label="Gestionar Tarifas" />
              <LinkButton to="/servicios/radio/historial" icon={HistoryIcon} label="Historial" />
              <button
                onClick={() => { setEditingReserva(null); setReservaModalOpen(true) }}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-violet-500/20"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Plus size={18} strokeWidth={2.5} color="white" />
                Nueva Reserva
              </button>
            </div>
          </div>
        </header>
      )}

      <div className={cn("flex-1 flex flex-col p-6 lg:p-8 min-h-0", !reservaModalOpen && "gap-6")}>
        {reservaModalOpen ? (
          <div className="flex-1 bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5 flex flex-col min-h-0 overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <ReservaForm
              key={(editingReserva?.id || "new")}
              isOpen={reservaModalOpen}
              onClose={() => { setReservaModalOpen(false); setEditingReserva(null) }}
              tarifas={tarifas}
              editingReserva={editingReserva}
              onSaved={handleReservaSaved}
            />
          </div>
        ) : (
          <>
            <RadioKPIs reservas={reservas} />

            <main className="flex-1 bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5 flex flex-col min-h-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="shrink-0 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl">
                    {([
                      { k: "calendario" as const, label: "Calendario", icon: Calendar03Icon },
                      { k: "lista" as const, label: "Lista", icon: MatrixIcon },
                    ]).map(({ k, label, icon }) => (
                      <button
                        key={k}
                        onClick={() => setVista(k)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-bold transition-all",
                          vista === k ? "bg-white shadow-sm" : "opacity-40 hover:opacity-60"
                        )}
                      >
                        <HugeiconsIcon icon={icon} size={14} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {vista === "calendario" && (
                    <>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => { const d = new Date(fechaRef); d.setDate(d.getDate() - 7); setFechaRef(d) }}
                          className="size-7 flex items-center justify-center rounded-full hover:bg-black/5">
                          <HugeiconsIcon icon={ArrowLeft02Icon} size={14} className="opacity-50" />
                        </button>
                        <button onClick={() => setFechaRef(new Date())}
                          className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-black/5 hover:bg-black/10 transition-all opacity-60 hover:opacity-100">
                          Hoy
                        </button>
                        <span className="text-[11px] font-bold opacity-60 min-w-[120px] text-center">
                          {monday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – {sunday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </span>
                        <button onClick={() => { const d = new Date(fechaRef); d.setDate(d.getDate() + 7); setFechaRef(d) }}
                          className="size-7 flex items-center justify-center rounded-full hover:bg-black/5">
                          <HugeiconsIcon icon={ArrowRight02Icon} size={14} className="opacity-50" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 ml-4 text-[10px] font-medium opacity-40">
                        <span className="flex items-center gap-1"><span className="size-2 rounded bg-orange-100 border border-orange-200" /> Pendiente</span>
                        <span className="flex items-center gap-1"><span className="size-2 rounded bg-emerald-100 border border-emerald-200" /> Confirmado</span>
                        <span className="flex items-center gap-1"><span className="size-2 rounded bg-blue-100 border border-blue-200" /> En progreso</span>
                        <span className="flex items-center gap-1"><span className="size-2 rounded bg-gray-100 border border-gray-200" /> Finalizado</span>
                        <span className="flex items-center gap-1"><span className="size-2 rounded bg-red-100 border border-red-200" /> Cancelado</span>
                      </div>
                    </>
                  )}
                </div>

                {vista === "lista" && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <input
                      type="date"
                      value={listaFechaDesde}
                      onChange={e => setListaFechaDesde(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border bg-gray-50 text-[10px] font-medium outline-none"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    />
                    <span className="text-[10px] opacity-40">–</span>
                    <input
                      type="date"
                      value={listaFechaHasta}
                      onChange={e => setListaFechaHasta(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border bg-gray-50 text-[10px] font-medium outline-none"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    />
                    <button
                      onClick={() => {
                        const { monday, sunday } = getWeekRange(new Date())
                        setListaFechaDesde(monday.toISOString().split("T")[0])
                        setListaFechaHasta(sunday.toISOString().split("T")[0])
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-black/5 hover:bg-black/10 transition-all opacity-60 hover:opacity-100"
                    >
                      Esta semana
                    </button>
                  </div>
                )}

              <div className="flex items-center gap-2">
                  <div className="relative w-48">
                    <HugeiconsIcon icon={Search01Icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                    <input
                      type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                      placeholder="Buscar cliente o reserva..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl border bg-gray-50/60 text-[10px] font-semibold outline-none"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    />
                    {searchInput && (
                      <button onClick={() => { setSearchInput(""); setSearchQuery("") }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-35 hover:opacity-100">
                        <HugeiconsIcon icon={Cancel01Icon} size={11} />
                      </button>
                    )}
                  </div>
                  <select
                    value={filtroEstado}
                    onChange={e => setFiltroEstado(e.target.value)}
                    className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium outline-none"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="reservado">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="completado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="space-y-3 w-full max-w-lg px-8">
                      {[1, 2, 3, 4].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
                    </div>
                  </div>
                ) : vista === "calendario" ? (
                  <RadioCalendar
                    weekDays={weekDays}
                    horas={hours}
                    reservas={reservas}
                    onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                  />
                ) : (
                  <div className="p-6 space-y-4">
                    {groupedByDate.length === 0 ? (
                      <div className="py-16 text-center">
                        <p className="text-sm font-bold opacity-30" style={{ color: COLORS.CHARCOAL }}>
                          {searchQuery ? `Sin resultados para "${searchQuery}"` : "No hay reservas registradas"}
                        </p>
                      </div>
                    ) : (
                      groupedByDate.map(([date, items]) => {
                        const isOpen = !!expandedGroups[date]
                        const dayTotal = items.reduce((s, r) => s + Number(r.precio_total || 0), 0)
                        return (
                          <div key={date} className="border rounded-2xl bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                            <div onClick={() => toggleGroup(date)}
                              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-black/[0.01] transition-colors select-none">
                              <div className="flex items-center gap-3">
                                <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                                  <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="opacity-40" />
                                </motion.div>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: COLORS.CHARCOAL }}>{date}</h3>
                                <span className="text-[10px] opacity-40 font-bold">({items.length})</span>
                              </div>
                              <span className="text-xs font-bold" style={{ color: "oklch(0.55 0.15 150)" }}>
                                Total: ${dayTotal.toLocaleString()}
                              </span>
                            </div>
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                  <div className="divide-y border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                    {items.map(r => {
                                      const color = ESTADO_COLORS[r.estado] || "bg-gray-100 text-gray-600"
                                      return (
                                        <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                          onClick={() => { setDetalleReserva(r); setDetalleOpen(true) }}>
                                          <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                                            r.estado === "reservado" ? "bg-orange-100" : r.estado === "confirmado" ? "bg-emerald-100" :
                                            r.estado === "en_progreso" ? "bg-blue-100" : r.estado === "completado" ? "bg-gray-100" : "bg-red-100")}>
                                            <HugeiconsIcon icon={r.estado === "completado" ? CheckmarkCircle04Icon : Clock01Icon} size={14}
                                              className={r.estado === "reservado" ? "text-orange-600" : r.estado === "confirmado" ? "text-emerald-600" :
                                                r.estado === "en_progreso" ? "text-blue-600" : r.estado === "completado" ? "text-gray-500" : "text-red-600"} />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs font-extrabold truncate" style={{ color: COLORS.CHARCOAL }}>
                                              {r.cliente_externo ? r.cliente_externo.nombres || "—" :
                                               r.persona ? `${r.persona.nombres} ${r.persona.apellidos}` : "—"}
                                            </p>
                                            <p className="text-[10px] opacity-45 font-bold truncate">
                                              {r.hora_inicio.substring(0, 5)} – {r.hora_fin.substring(0, 5)}
                                              {" · "}{r.tarifa?.nombre || "Sin tarifa"}
                                            </p>
                                          </div>
                                          <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0", color)}>
                                            {r.estado}
                                          </span>
                                          <span className="text-xs font-bold w-20 text-right shrink-0" style={{ color: COLORS.CHARCOAL }}>
                                            ${Number(r.precio_total).toLocaleString()}
                                          </span>
                                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                            {!r.pago_registrado && (
                                              <button onClick={() => handleRegistrarPago(r.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                                                style={{ backgroundColor: COLORS.ACCENT }}>
                                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={11} />
                                                Pago
                                              </button>
                                            )}
                                            <button onClick={() => handleEdit(r)}
                                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: COLORS.TEXT_MUTED }}>
                                              <HugeiconsIcon icon={Edit01Icon} size={13} />
                                            </button>
                                            <button onClick={() => handleDelete(r.id, r.tarifa?.nombre || "Sin tarifa")}
                                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: COLORS.TEXT_MUTED }}>
                                              <HugeiconsIcon icon={Delete01Icon} size={13} />
                                            </button>
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
            </main>
          </>
        )}
      </div>

      <DetalleReservaModal
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        reserva={detalleReserva}
        onEdit={() => { if (detalleReserva) handleEdit(detalleReserva) }}
      />

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Anular Reserva"
        message={`¿Anular la reserva de "${deleteConfirm?.name}"?`}
        confirmText="Anular"
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
