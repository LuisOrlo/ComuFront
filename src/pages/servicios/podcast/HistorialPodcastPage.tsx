import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Home02Icon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Money01Icon,
  CheckmarkCircle04Icon,
  PackageIcon,
  Cancel01Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { podcastService, type ReservaPodcast } from "@/services/podcast.service"
import { toast } from "sonner"

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-blue-100 text-blue-700 border-blue-200",
  confirmado: "bg-amber-100 text-amber-700 border-amber-200",
  en_progreso: "bg-indigo-100 text-indigo-700 border-indigo-200",
  completado: "bg-green-100 text-green-700 border-green-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente", confirmado: "Confirmado", en_progreso: "En progreso", completado: "Completado", cancelado: "Cancelado",
}

const STRIP_COLORS: Record<string, string> = {
  pendiente: "bg-blue-500",
  confirmado: "bg-amber-500",
  en_progreso: "bg-indigo-500",
  completado: "bg-green-500",
  cancelado: "bg-red-500",
}

export function HistorialPodcastPage() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState<ReservaPodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    podcastService.getReservas()
      .then(setReservas)
      .catch(() => toast.error("Error al cargar historial"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filtroEstado === "todos") return reservas
    if (filtroEstado === "activos") return reservas.filter(r => r.estado === "pendiente" || r.estado === "confirmado" || r.estado === "en_progreso")
    return reservas.filter(r => r.estado === filtroEstado)
  }, [reservas, filtroEstado])

  const getCliente = (r: ReservaPodcast) => {
    if (r.persona) return `${r.persona.nombres} ${r.persona.apellidos}`
    if (r.cliente_externo) return `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`
    return "—"
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    setSavingMap(prev => ({ ...prev, [id]: true }))
    try {
      await podcastService.cambiarEstado(id, nuevoEstado)
      toast.success(`Estado cambiado a ${ESTADO_LABELS[nuevoEstado] || nuevoEstado}`)
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado as ReservaPodcast["estado"] } : r))
    } catch { toast.error("Error al cambiar estado") }
    finally { setSavingMap(prev => ({ ...prev, [id]: false })) }
  }

  const stats = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === "pendiente" || r.estado === "confirmado").length,
    completados: reservas.filter(r => r.estado === "completado").length,
    cancelados: reservas.filter(r => r.estado === "cancelado").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full" style={{ borderColor: COLORS.ACCENT }} />
          <p className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 border-b bg-white sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/servicios/podcast")}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.TEXT_MUTED }} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={PackageIcon} size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  Historial de Podcast
                </h1>
                <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.TEXT_MUTED }}>
                  Todas las reservas de podcast
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-6">

          <div className="flex gap-1 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {[
              { key: "todos", label: "Todos", icon: PackageIcon },
              { key: "activos", label: "Activos", icon: Clock01Icon },
              { key: "completado", label: "Completados", icon: CheckmarkCircle04Icon },
              { key: "cancelado", label: "Cancelados", icon: Cancel01Icon },
            ].map(t => (
              <button key={t.key} onClick={() => setFiltroEstado(t.key)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{
                  borderColor: filtroEstado === t.key ? COLORS.ACCENT : "transparent",
                  color: filtroEstado === t.key ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
                }}>
                <HugeiconsIcon icon={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Home02Icon} size={18} className="opacity-40" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Total</p>
                <p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>{stats.total}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Clock01Icon} size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Activos</p>
                <p className="text-lg font-black text-amber-600">{stats.pendientes}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Completados</p>
                <p className="text-lg font-black text-green-600">{stats.completados}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Calendar03Icon} size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cancelados</p>
                <p className="text-lg font-black text-red-600">{stats.cancelados}</p>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
              </div>
              <p className="text-sm font-bold opacity-30">Sin reservas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.sort((a, b) => new Date(b.fecha_reserva).getTime() - new Date(a.fecha_reserva).getTime()).map(r => {
                return (
                  <div key={r.id}
                    className="bg-white rounded-2xl border hover:shadow-sm transition-all overflow-hidden"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className={cn("h-1.5 w-full", STRIP_COLORS[r.estado] || "bg-gray-400")} />

                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                            r.estado === "confirmado" ? "bg-amber-100" :
                            r.estado === "completado" ? "bg-green-100" :
                            r.estado === "en_progreso" ? "bg-indigo-100" :
                            r.estado === "cancelado" ? "bg-red-100" :
                            "bg-blue-100"
                          )}>
                            <HugeiconsIcon icon={Calendar03Icon} size={16}
                              className={cn(
                                r.estado === "confirmado" ? "text-amber-600" :
                                r.estado === "completado" ? "text-green-600" :
                                r.estado === "en_progreso" ? "text-indigo-600" :
                                r.estado === "cancelado" ? "text-red-600" :
                                "text-blue-600"
                              )} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                              {r.titulo || r.paquete?.nombre || "Sin título"}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                              {new Date(r.fecha_reserva).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                              {" · "}{r.hora_inicio?.substring(0, 5)} – {r.hora_fin?.substring(0, 5)}
                            </p>
                          </div>
                        </div>
                        <select
                          value={r.estado}
                          onChange={e => handleCambiarEstado(r.id, e.target.value)}
                          disabled={savingMap[r.id]}
                          className={cn("shrink-0 px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border outline-none cursor-pointer transition-opacity", savingMap[r.id] ? "opacity-50" : "", ESTADO_COLORS[r.estado] || "bg-gray-100")}
                        >
                          {Object.entries(ESTADO_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        <button onClick={() => navigate("/servicios/podcast", { state: { editarReserva: r } })}
                          className="size-7 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50 shrink-0"
                          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
                          title="Editar reserva">
                          <HugeiconsIcon icon={Edit01Icon} size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                          <div className="size-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cliente</p>
                            <p className="text-xs font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                              {getCliente(r)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                          <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Money01Icon} size={14} className="text-emerald-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio total</p>
                            <p className="text-sm font-black" style={{ color: COLORS.ACCENT }}>
                              ${Number(r.precio_total).toFixed(2)}
                            </p>
                          </div>
                          {!r.pago_registrado && (
                            <button onClick={() => navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, { state: { tipo: "podcast", servicioId: r.id, nombre: getCliente(r), montoTotal: Number(r.precio_total) || 0, montoSaldo: Number(r.precio_total) || 0, nombreServicio: r.titulo || r.paquete?.nombre || "Podcast" } })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap shrink-0"
                              style={{ backgroundColor: COLORS.ACCENT }}>
                              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                              Registrar pago
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
