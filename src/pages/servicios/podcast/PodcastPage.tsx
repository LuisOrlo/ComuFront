import { useState, useEffect, useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PackageIcon, Calendar03Icon, MatrixIcon, ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { podcastService, type ReservaPodcast, type PaquetePodcast } from "@/services/podcast.service"
import { toast } from "sonner"
import { PodcastKPIs } from "./components/PodcastKPIs"
import { PodcastCalendar } from "./components/PodcastCalendar"
import { getWeekRange, getWeekDays } from "./components/podcast-calendar.utils"
import { PodcastTable } from "./components/PodcastTable"
import { ReservaModal } from "./components/ReservaModal"
import { DetalleReservaModal } from "./components/DetalleReservaModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"

const hours = Array.from({ length: 14 }, (_, i) => i + 7)

export function PodcastPage() {
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [reservas, setReservas] = useState<ReservaPodcast[]>([])

  const [vista, setVista] = useState<"calendario" | "lista">("calendario")
  const [fechaRef, setFechaRef] = useState(() => new Date())
  const [filtroEstado, setFiltroEstado] = useState("")

  const [reservaModalOpen, setReservaModalOpen] = useState(false)
  const [editingReserva, setEditingReserva] = useState<ReservaPodcast | null>(null)
  const [detalleReserva, setDetalleReserva] = useState<ReservaPodcast | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const { monday, sunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const weekDays = useMemo(() => getWeekDays(monday), [monday])

  const loadPaquetes = async () => {
    try { setPaquetes(await podcastService.getPaquetes()) }
    catch { toast.error("Error al cargar paquetes") }
  }

  const loadReservas = useCallback(async () => {
    try {
      const filters: Record<string, string> = {}
      if (filtroEstado) filters.estado = filtroEstado
      setReservas(await podcastService.getReservas(filters))
    } catch { toast.error("Error al cargar reservas") }
  }, [filtroEstado])

  useEffect(() => {
    Promise.all([
      podcastService.getPaquetes()
        .then(setPaquetes)
        .catch(() => toast.error("Error al cargar paquetes")),
      (() => {
        const filters: Record<string, string> = {}
        if (filtroEstado) filters.estado = filtroEstado
        return podcastService.getReservas(filters)
          .then(setReservas)
          .catch(() => toast.error("Error al cargar reservas"))
      })(),
    ]).finally(() => setLoading(false))
  }, [filtroEstado])

  const handleEdit = (r: ReservaPodcast) => {
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
      toast.success("Reserva anulada")
      setDeleteConfirm(null)
      loadReservas()
    } catch { toast.error("Error al anular reserva") }
    finally { setDeletingItem(false) }
  }

  const handleRegistrarPago = async (id: string) => {
    try {
      await podcastService.registrarPago(id)
      toast.success("Pago registrado")
      loadReservas()
    } catch { toast.error("Error al registrar pago") }
  }

  const handleReservaSaved = () => {
    loadReservas()
    loadPaquetes()
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Servicios <span className="size-1 rounded-full bg-current opacity-50" /> Producción
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Reservas de Podcast
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/servicios/podcast/paquetes"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all active:scale-[0.97]"
              style={{ color: COLORS.CHARCOAL, backgroundColor: "oklch(0.95 0 0)" }}
            >
              <HugeiconsIcon icon={PackageIcon} size={14} />
              Gestionar Paquetes
            </a>
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

      <div className="flex-1 flex flex-col p-6 lg:p-8 gap-6 min-h-0">
        <PodcastKPIs reservas={reservas} />

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
                      vista === k ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
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
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium outline-none"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="en_progreso">En progreso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="space-y-3 w-full max-w-lg px-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : vista === "calendario" ? (
              <PodcastCalendar
                weekDays={weekDays}
                horas={hours}
                reservas={reservas}
                onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
              />
            ) : (
              <PodcastTable
                reservas={reservas}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRegistrarPago={handleRegistrarPago}
                onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
              />
            )}
          </div>
        </main>
      </div>

      <ReservaModal
        key={editingReserva?.id || "new"}
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
