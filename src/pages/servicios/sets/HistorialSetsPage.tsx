import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import {
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Pencil,
  Trash2,
  Plus,
  RotateCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { setsService, type SetItem, type ReservaSet } from "@/services/sets.service"
import { SetsKPIs } from "./components/SetsKPIs"
import { DetalleSetModal } from "./components/DetalleSetModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; dot: string; text: string }
> = {
  reservado: {
    label: "Reservado",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    text: "text-blue-700",
  },
  confirmado: {
    label: "Confirmado",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  en_progreso: {
    label: "En progreso",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  completado: {
    label: "Completado",
    bg: "bg-slate-100 border-slate-200",
    dot: "bg-slate-400",
    text: "text-slate-700",
  },
  cancelado: {
    label: "Cancelado",
    bg: "bg-rose-50 border-rose-200",
    dot: "bg-rose-500",
    text: "text-rose-700",
  },
}

export function HistorialSetsPage() {
  const navigate = useNavigate()
  const [sets, setSets] = useState<SetItem[]>([])
  const [reservas, setReservas] = useState<ReservaSet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")

  const [selectedReserva, setSelectedReserva] = useState<ReservaSet | null>(null)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<ReservaSet | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingEstadoId, setUpdatingEstadoId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [resSets, resReservas] = await Promise.all([
        setsService.getSets(),
        setsService.getReservas(),
      ])
      setSets(resSets || [])
      setReservas(resReservas || [])
    } catch {
      toast.error("Error al cargar las reservas de sets")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredReservas = useMemo(() => {
    let list = [...reservas]

    if (estadoFilter !== "todos") {
      list = list.filter((r) => r.estado === estadoFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) => {
        const setName = (r.set?.nombre || "").toLowerCase()
        const cliente = r.persona
          ? `${r.persona.nombres} ${r.persona.apellidos}`.toLowerCase()
          : r.cliente_externo
          ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos}`.toLowerCase()
          : ""
        const cedula = (r.persona?.cedula || r.cliente_externo?.cedula || "").toLowerCase()
        return setName.includes(q) || cliente.includes(q) || cedula.includes(q)
      })
    }

    return list
  }, [reservas, search, estadoFilter])

  const handleCambiarEstado = async (id: string, nuevoEstado: ReservaSet["estado"]) => {
    const actual = reservas.find((r) => r.id === id)
    if (!actual || actual.estado === nuevoEstado) return

    setUpdatingEstadoId(id)
    try {
      const updated = await setsService.updateReservaEstado(id, nuevoEstado)
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated, estado: nuevoEstado } : r))
      )
      if (selectedReserva && selectedReserva.id === id) {
        setSelectedReserva((prev) => (prev ? { ...prev, ...updated, estado: nuevoEstado } : null))
      }
      toast.success(`Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || "Error al actualizar estado")
    } finally {
      setUpdatingEstadoId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await setsService.deleteReserva(deleteConfirm.id)
      toast.success("Reserva eliminada exitosamente")
      setDeleteConfirm(null)
      loadData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || "No se pudo eliminar la reserva")
    } finally {
      setDeleting(false)
    }
  }

  const handlePago = (r: ReservaSet) => {
    const clienteNombre = r.persona
      ? `${r.persona.nombres || ""} ${r.persona.apellidos || ""}`.trim()
      : r.cliente_externo
      ? `${r.cliente_externo.nombres || ""} ${r.cliente_externo.apellidos || ""}`.trim()
      : "Cliente"
    const total = Number(r.precio_total || 0)
    const saldo = r.cuenta_por_cobrar
      ? Number(r.cuenta_por_cobrar.saldo_pendiente ?? (total - r.cuenta_por_cobrar.monto_abonado))
      : total

    navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, {
      state: {
        tipo: "set",
        servicioId: r.id,
        cuentaId: r.cuenta_por_cobrar?.id,
        nombre: clienteNombre,
        montoTotal: total,
        montoSaldo: saldo,
        nombreServicio: `Alquiler de Set ${r.set?.nombre || ""}`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Alquiler de Sets de Grabación</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            title="Refrescar lista"
          >
            <RotateCw size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/servicios/sets/agenda")}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Ver Agenda
          </button>
          <button
            type="button"
            onClick={() => navigate("/servicios/sets/gestion")}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Gestionar Sets
          </button>
          <button
            type="button"
            onClick={() => navigate("/servicios/sets/nueva-reserva")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:opacity-95 transition active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <SetsKPIs sets={sets} reservas={reservas} />

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, cédula o set..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#fd761a] focus:bg-white transition"
          />
        </div>

        {/* State Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          {["todos", "reservado", "confirmado", "en_progreso", "completado", "cancelado"].map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setEstadoFilter(est)}
              className={`px-3 py-1.5 rounded-xl uppercase tracking-wider text-[11px] font-bold transition whitespace-nowrap ${
                estadoFilter === est
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {est === "todos" ? "Todos" : ESTADO_CONFIG[est]?.label || est}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <span className="inline-block size-6 border-2 border-[#fd761a] border-t-transparent rounded-full animate-spin mb-3" />
            <p>Cargando reservas de sets...</p>
          </div>
        ) : filteredReservas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Video size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No se encontraron reservas</p>
            <p className="text-xs text-slate-400 mt-1">
              {search || estadoFilter !== "todos"
                ? "Prueba modificando tus filtros de búsqueda."
                : "Aún no se han agendado alquileres para este servicio."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReservas.map((r) => {
              const estado = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.reservado
              const cliente = r.persona || r.cliente_externo
              const clienteNombre = cliente ? `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() : "—"
              const cuenta = r.cuenta_por_cobrar
              const total = Number(r.precio_total || 0)
              const saldo = cuenta ? Number(cuenta.saldo_pendiente ?? (total - cuenta.monto_abonado)) : total
              const esPagado = cuenta?.estado === "pagado" || saldo <= 0

              return (
                <div
                  key={r.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  {/* Left: Set & Client Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Video size={22} />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReserva(r)
                            setDetalleModalOpen(true)
                          }}
                          className="text-sm font-bold text-slate-900 hover:text-[#fd761a] transition truncate text-left cursor-pointer"
                        >
                          {clienteNombre}
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {r.persona_id ? "Interno" : "Cliente"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="font-bold text-slate-800">{r.set?.nombre || "Set de grabación"}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-[#fd761a]" />
                          {new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-EC", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-slate-400" />
                          {r.hora_inicio?.substring(0, 5)} – {r.hora_fin?.substring(0, 5)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Inline Status Changer & Financial summary */}
                  <div className="flex items-center gap-6 self-start lg:self-center shrink-0">
                    {/* Inline State Badge Select */}
                    <div className="relative">
                      <select
                        value={r.estado}
                        onChange={(e) => handleCambiarEstado(r.id, e.target.value as ReservaSet["estado"])}
                        disabled={updatingEstadoId === r.id}
                        className={cn(
                          "appearance-none inline-flex items-center pl-2.5 pr-6 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border cursor-pointer transition-all shadow-2xs outline-none",
                          estado.bg,
                          estado.text,
                          updatingEstadoId === r.id && "opacity-50 pointer-events-none"
                        )}
                        title="Cambiar estado de la reserva"
                      >
                        <option value="reservado">Reservado</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="en_progreso">En progreso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                      {updatingEstadoId === r.id ? (
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 size-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[9px]">
                          ▼
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end shrink-0 text-right">
                      <span className="text-sm font-black text-slate-900">${total.toFixed(2)}</span>
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          esPagado ? "text-emerald-700" : "text-amber-700"
                        )}
                      >
                        {esPagado ? "Pagado ✓" : `Saldo: $${saldo.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReserva(r)
                        setDetalleModalOpen(true)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      Detalles
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/servicios/sets/reservas/${r.id}/editar`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Pencil size={14} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePago(r)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer",
                        esPagado
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-[#fd761a] text-white hover:opacity-95"
                      )}
                    >
                      <CheckCircle2 size={14} />
                      <span>{esPagado ? "Ver pagos" : "Registrar Pago"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Eliminar reserva"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Detalle */}
      <DetalleSetModal
        isOpen={detalleModalOpen}
        onClose={() => setDetalleModalOpen(false)}
        reserva={selectedReserva}
        set={selectedReserva ? sets.find((s) => s.id === selectedReserva.set_id) : undefined}
        onEdit={
          selectedReserva
            ? () => navigate(`/servicios/sets/reservas/${selectedReserva.id}/editar`)
            : undefined
        }
        onPago={selectedReserva ? () => handlePago(selectedReserva) : undefined}
        onDelete={selectedReserva ? () => setDeleteConfirm(selectedReserva) : undefined}
        onEstadoChange={handleCambiarEstado}
      />

      {/* Modal Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirm)}
        title="Eliminar Reserva de Set"
        message="¿Estás seguro de eliminar esta reserva? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleting}
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
