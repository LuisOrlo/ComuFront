import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import { DiscountIcon, HistoryIcon, Calendar03Icon, MatrixIcon, ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { radioService, type TarifaRadio, type ReservaRadio } from "@/services/radio.service"
import { toast } from "sonner"
import type { ClienteExterno } from "@/services/clientes.service"
import { RadioKPIs } from "./components/RadioKPIs"
import { RadioCalendar } from "./components/RadioCalendar"
import { RadioTable } from "./components/RadioTable"
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

  const [listaFechaDesde, setListaFechaDesde] = useState(() => {
    const { monday } = getWeekRange(new Date())
    return monday.toISOString().split("T")[0]
  })
  const [listaFechaHasta, setListaFechaHasta] = useState(() => {
    const { sunday } = getWeekRange(new Date())
    return sunday.toISOString().split("T")[0]
  })

  const location = useLocation()
  const navigate = useNavigate()
  const [reservaModalOpen, setReservaModalOpen] = useState(false)
  const [editingReserva, setEditingReserva] = useState<ReservaRadio | null>(null)
  const [nuevoCliente, setNuevoCliente] = useState<ClienteExterno | undefined>(undefined)
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    Promise.all([loadTarifas(), loadReservas()])
      .finally(() => setLoading(false))
  }, [loadReservas])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const state = location.state as { nuevoCliente?: ClienteExterno } | undefined
    if (state?.nuevoCliente) {
      setNuevoCliente(state.nuevoCliente)
      setReservaModalOpen(true)
      setEditingReserva(null)
      navigate(".", { replace: true, state: {} })
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [location.state, navigate])

  const handleEdit = (r: ReservaRadio) => {
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
              onClose={() => { setReservaModalOpen(false); setEditingReserva(null); setNuevoCliente(undefined) }}
              tarifas={tarifas}
              editingReserva={editingReserva}
              onSaved={handleReservaSaved}
              nuevoCliente={nuevoCliente}
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
                  )}

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
                </div>

                <div className="flex items-center gap-2">
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

              <div>
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
                  <RadioTable
                    reservas={reservas}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRegistrarPago={handleRegistrarPago}
                    onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                  />
                )}
              </div>
            </main>
          </>
        )}
      </div>

      <DetalleReservaModal
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        reserva={detalleReserva}
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
