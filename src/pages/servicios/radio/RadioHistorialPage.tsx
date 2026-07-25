import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Money01Icon,
  CheckmarkCircle04Icon,
  Cancel01Icon,
  RadioIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { Link } from "react-router"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { radioService, type ReservaRadio } from "@/services/radio.service"
import { toast } from "sonner"
import { DetalleReservaModal } from "./components/DetalleReservaModal"

const ESTADO_LABELS: Record<string, string> = {
  reservado: "Pendiente", confirmado: "Confirmado", en_progreso: "En progreso", completado: "Finalizado", cancelado: "Cancelado",
}

const ESTADO_COLORS: Record<string, string> = {
  reservado: "bg-orange-100 text-orange-700 border-orange-200",
  confirmado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  en_progreso: "bg-blue-100 text-blue-700 border-blue-200",
  completado: "bg-gray-100 text-gray-500 border-gray-300",
  cancelado: "bg-red-100 text-red-600 border-red-200",
}

const STRIP_COLORS: Record<string, string> = {
  reservado: "bg-orange-500", confirmado: "bg-emerald-500", en_progreso: "bg-blue-500", completado: "bg-gray-500", cancelado: "bg-red-500",
}

export function RadioHistorialPage() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState<ReservaRadio[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [detalleReserva, setDetalleReserva] = useState<ReservaRadio | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const loadHistorial = useCallback(async () => {
    setLoading(true)
    try {
      const filters: Record<string, string | number> = { page, per_page: 15 }
      if (filtroEstado && filtroEstado !== "todos") filters.estado = filtroEstado
      if (fechaDesde) filters.fecha_desde = fechaDesde
      if (fechaHasta) filters.fecha_hasta = fechaHasta
      const res = await radioService.getReservas(filters)
      setReservas(res.data)
      setMeta(res.meta)
    } catch { toast.error("Error al cargar historial") }
    finally { setLoading(false) }
  }, [page, filtroEstado, fechaDesde, fechaHasta])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistorial()
  }, [loadHistorial])

  const getCliente = (r: ReservaRadio) => {
    if (r.persona) return `${r.persona.nombres} ${r.persona.apellidos}`
    if (r.cliente_externo) return r.cliente_externo.nombres || "—"
    return "—"
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 border-b bg-white sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <Link to="/servicios/radio" className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.TEXT_MUTED }} />
            </Link>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={RadioIcon} size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>Historial de Radio</h1>
                <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.TEXT_MUTED }}>Todas las reservas de radio</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-6">

          <div className="flex gap-1 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {([
              { key: "todos", label: "Todos", icon: PackageIcon },
              { key: "confirmado", label: "Confirmados", icon: CheckmarkCircle04Icon },
              { key: "en_progreso", label: "En progreso", icon: Clock01Icon },
              { key: "completado", label: "Finalizados", icon: CheckmarkCircle04Icon },
              { key: "cancelado", label: "Cancelados", icon: Cancel01Icon },
            ]).map(t => (
              <button key={t.key} onClick={() => { setFiltroEstado(t.key); setPage(1) }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{ borderColor: filtroEstado === t.key ? COLORS.ACCENT : "transparent", color: filtroEstado === t.key ? COLORS.CHARCOAL : COLORS.TEXT_MUTED }}>
                <HugeiconsIcon icon={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-xl border text-xs font-medium outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-xl border text-xs font-medium outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : reservas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
              </div>
              <p className="text-sm font-bold opacity-30">No hay reservas en el historial</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservas.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border hover:shadow-sm transition-all overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className={cn("h-1.5 w-full", STRIP_COLORS[r.estado] || "bg-gray-400")} />
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                          r.estado === "confirmado" ? "bg-emerald-100" : r.estado === "en_progreso" ? "bg-blue-100" : r.estado === "completado" ? "bg-gray-100" : r.estado === "cancelado" ? "bg-red-100" : "bg-orange-100"
                        )}>
                          <HugeiconsIcon icon={Calendar03Icon} size={16} className={cn(
                            r.estado === "confirmado" ? "text-emerald-600" : r.estado === "en_progreso" ? "text-blue-600" : r.estado === "completado" ? "text-gray-500" : r.estado === "cancelado" ? "text-red-600" : "text-orange-600"
                          )} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                            {new Date(r.fecha_reserva + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                            {r.hora_inicio.substring(0, 5)} – {r.hora_fin.substring(0, 5)}
                            {" · "}{r.tarifa?.nombre || "Sin tarifa"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { setDetalleReserva(r); setDetalleOpen(true) }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors hover:bg-gray-50"
                          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                          <HugeiconsIcon icon={Calendar03Icon} size={12} />Ver detalle
                        </button>
                        <span className={cn("px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border", ESTADO_COLORS[r.estado] || "bg-gray-100")}>
                          {ESTADO_LABELS[r.estado] || r.estado}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                        <div className="size-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" /></div>
                        <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cliente</p><p className="text-xs font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{getCliente(r)}</p></div>
                      </div>
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                        <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={Money01Icon} size={14} className="text-emerald-500" /></div>
                        <div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio total</p><p className="text-sm font-black" style={{ color: COLORS.ACCENT }}>${r.precio_total.toFixed(2)}</p></div>
                        <button onClick={() => navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, { state: { tipo: "radio", servicioId: r.id, nombre: getCliente(r), montoTotal: Number(r.precio_total) || 0, montoSaldo: Number(r.precio_total) || 0, nombreServicio: `Reserva de Radio` } })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap shrink-0" style={{ backgroundColor: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />Registrar pago
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Página {meta.current_page} de {meta.last_page} ({meta.total} reservas)</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Anterior</button>
                <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DetalleReservaModal isOpen={detalleOpen} onClose={() => setDetalleOpen(false)} reserva={detalleReserva} />
    </div>
  )
}
