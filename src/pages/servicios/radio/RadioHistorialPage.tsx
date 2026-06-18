import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { ArrowLeft, Eye } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { radioService, type ReservaRadio } from "@/services/radio.service"
import { toast } from "sonner"
import { DetalleReservaModal } from "./components/DetalleReservaModal"

const ESTADO_LABELS: Record<string, string> = {
  reservado: "Pendiente",
  confirmado: "Confirmado",
  en_progreso: "En progreso",
  completado: "Finalizado",
  cancelado: "Cancelado",
}

const ESTADO_COLORS: Record<string, string> = {
  reservado: "bg-orange-100 text-orange-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  en_progreso: "bg-blue-100 text-blue-700",
  completado: "bg-gray-100 text-gray-500",
  cancelado: "bg-red-100 text-red-600",
}

export function RadioHistorialPage() {
  const [reservas, setReservas] = useState<ReservaRadio[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [filtroEstado, setFiltroEstado] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [detalleReserva, setDetalleReserva] = useState<ReservaRadio | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const loadHistorial = useCallback(async () => {
    setLoading(true)
    try {
      const filters: Record<string, string | number> = { page, per_page: 15 }
      if (filtroEstado) filters.estado = filtroEstado
      if (fechaDesde) filters.fecha_desde = fechaDesde
      if (fechaHasta) filters.fecha_hasta = fechaHasta
      const res = await radioService.getHistorial(filters)
      setReservas(res.data)
      setMeta(res.meta)
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }, [page, filtroEstado, fechaDesde, fechaHasta])

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistorial() }, [loadHistorial])

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Servicios <span className="size-1 rounded-full bg-current opacity-50" /> Radio
            </div>
            <div className="flex items-center gap-4">
              <Link to="/servicios/radio" className="size-9 flex items-center justify-center rounded-full hover:bg-black/5">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
                Historial de Reservas
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <div className="bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5 flex flex-col min-h-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {/* Filters */}
          <div className="shrink-0 px-6 py-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-xl border text-[11px] font-medium outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-xl border text-[11px] font-medium outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
            <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-xl border text-[11px] font-medium outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <option value="">Todos los estados</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_progreso">En progreso</option>
              <option value="completado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : reservas.length === 0 ? (
              <div className="p-12 text-center">
                <HugeiconsIcon icon={Clock01Icon} size={40} className="opacity-20 mx-auto mb-3" />
                <p className="text-sm font-bold opacity-40">No hay reservas en el historial</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-[9px] font-bold uppercase tracking-wider opacity-40" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <th className="text-left px-6 py-3">Fecha</th>
                    <th className="text-left px-6 py-3">Horario</th>
                    <th className="text-left px-6 py-3">Tarifa</th>
                    <th className="text-left px-6 py-3">Responsable</th>
                    <th className="text-left px-6 py-3">Operador</th>
                    <th className="text-right px-6 py-3">Total</th>
                    <th className="text-center px-6 py-3">Estado</th>
                    <th className="text-center px-6 py-3"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {reservas.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold">
                        {new Date(r.fecha_reserva + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold">
                        {r.hora_inicio.substring(0, 5)} – {r.hora_fin.substring(0, 5)}
                      </td>
                      <td className="px-6 py-4">{r.tarifa?.nombre || "—"}</td>
                      <td className="px-6 py-4 truncate max-w-[160px]">
                        {r.persona ? `${r.persona.nombres} ${r.persona.apellidos}` : r.cliente_externo?.nombres || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs opacity-60">
                        {r.incluye_operador && r.operador ? `${r.operador.nombres.split(" ")[0]} ${r.operador.apellidos.split(" ")[0]}` : r.incluye_operador ? "Sin asignar" : "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">${r.precio_total.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", ESTADO_COLORS[r.estado] || "")}>
                          {ESTADO_LABELS[r.estado] || r.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => { setDetalleReserva(r); setDetalleOpen(true) }}
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Eye size={14} className="opacity-40" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="shrink-0 px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="text-xs opacity-40">
                Página {meta.current_page} de {meta.last_page} ({meta.total} reservas)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  Anterior
                </button>
                <button
                  disabled={page >= meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DetalleReservaModal
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        reserva={detalleReserva}
      />
    </div>
  )
}
