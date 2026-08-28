import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Money01Icon,
  CheckmarkCircle04Icon,
  PackageIcon,
  Add01Icon,
  MatrixIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { edicionVideoService, type TrabajoEdicion } from "@/services/edicion-video.service"
import { toast } from "sonner"

const ESTADO_COLORS: Record<string, string> = {
  recibido: "bg-blue-100 text-blue-700 border-blue-200",
  en_proceso: "bg-amber-100 text-amber-700 border-amber-200",
  revision: "bg-indigo-100 text-indigo-700 border-indigo-200",
  entregado: "bg-green-100 text-green-700 border-green-200",
}

const ESTADO_LABELS: Record<string, string> = {
  recibido: "Recibido", en_proceso: "En proceso", revision: "Revisión", entregado: "Entregado",
}

const STRIP_COLORS: Record<string, string> = {
  recibido: "bg-blue-500",
  en_proceso: "bg-amber-500",
  revision: "bg-indigo-500",
  entregado: "bg-green-500",
}

export function HistorialEdicionVideoPage() {
  const navigate = useNavigate()
  const [trabajos, setTrabajos] = useState<TrabajoEdicion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("todos")

  useEffect(() => {
    edicionVideoService.getTrabajos()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(res => setTrabajos((res as any)?.data || res || []))
      .catch(() => toast.error("Error al cargar historial"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filtroEstado === "todos") return trabajos
    return trabajos.filter(t => t.estado === filtroEstado)
  }, [trabajos, filtroEstado])

  const getCliente = (t: TrabajoEdicion) => {
    if (t.cliente) return `${t.cliente.nombres} ${t.cliente.apellidos}`
    if (t.cliente_externo) return `${t.cliente_externo.nombres} ${t.cliente_externo.apellidos || ""}`
    return "—"
  }

  const stats = {
    total: trabajos.length,
    recibidos: trabajos.filter(t => t.estado === "recibido").length,
    en_proceso: trabajos.filter(t => t.estado === "en_proceso" || t.estado === "revision").length,
    entregados: trabajos.filter(t => t.estado === "entregado").length,
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
        <div className="px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-35" style={{ color: COLORS.CHARCOAL }}>Servicios</p>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: COLORS.CHARCOAL }}>Edición de Video</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate("/servicios/edicion-video/nuevo")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 active:scale-95"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Nuevo Trabajo
              </button>
              <button
                onClick={() => navigate("/servicios/edicion-video/agenda")}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={MatrixIcon} size={14} />
                Tablero de Producción
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-6">

          <div className="flex gap-1 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {([
              { key: "todos", label: "Todos", icon: PackageIcon },
              { key: "recibido", label: "Recibidos", icon: Clock01Icon },
              { key: "en_proceso", label: "En proceso", icon: VideoIcon },
              { key: "entregado", label: "Entregados", icon: CheckmarkCircle04Icon },
            ]).map(t => (
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
                <HugeiconsIcon icon={VideoIcon} size={18} className="opacity-40" />
              </div>
              <div><p className="text-[9px] font-bold uppercase opacity-40">Total</p><p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>{stats.total}</p></div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={Clock01Icon} size={18} className="text-blue-600" /></div>
              <div><p className="text-[9px] font-bold uppercase opacity-40">Recibidos</p><p className="text-lg font-black text-blue-600">{stats.recibidos}</p></div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={Clock01Icon} size={18} className="text-amber-600" /></div>
              <div><p className="text-[9px] font-bold uppercase opacity-40">En proceso</p><p className="text-lg font-black text-amber-600">{stats.en_proceso}</p></div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={CheckmarkCircle04Icon} size={18} className="text-green-600" /></div>
              <div><p className="text-[9px] font-bold uppercase opacity-40">Entregados</p><p className="text-lg font-black text-green-600">{stats.entregados}</p></div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
              </div>
              <p className="text-sm font-bold opacity-30">Sin trabajos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.sort((a, b) => new Date(b.fecha_recibo).getTime() - new Date(a.fecha_recibo).getTime()).map(t => {
                return (
                  <div key={t.id} className="bg-white rounded-2xl border hover:shadow-sm transition-all overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className={cn("h-1.5 w-full", STRIP_COLORS[t.estado] || "bg-gray-400")} />
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                            t.estado === "en_proceso" ? "bg-amber-100" : t.estado === "revision" ? "bg-indigo-100" : t.estado === "entregado" ? "bg-green-100" : "bg-blue-100"
                          )}>
                            <HugeiconsIcon icon={Calendar03Icon} size={16} className={cn(
                              t.estado === "en_proceso" ? "text-amber-600" : t.estado === "revision" ? "text-indigo-600" : t.estado === "entregado" ? "text-green-600" : "text-blue-600"
                            )} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{t.titulo || "Sin título"}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                              {new Date(t.fecha_recibo).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                              {t.fecha_limite && ` · Límite: ${new Date(t.fecha_limite).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`}
                            </p>
                          </div>
                        </div>
                        <span className={cn("shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border", ESTADO_COLORS[t.estado] || "bg-gray-100")}>
                          {ESTADO_LABELS[t.estado] || t.estado}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                          <div className="size-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" /></div>
                          <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cliente</p><p className="text-xs font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{getCliente(t)}</p></div>
                        </div>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                          <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={Money01Icon} size={14} className="text-emerald-500" /></div>
                          <div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio</p><p className="text-sm font-black" style={{ color: COLORS.ACCENT }}>${Number(t.precio_cobrado || 0).toFixed(2)}</p></div>
                          {(() => {
                            const esPagado = t.cuenta_por_cobrar?.estado === 'pagado' || Number(t.cuenta_por_cobrar?.saldo_pendiente ?? (Number(t.precio_cobrado || 0) - (t.cuenta_por_cobrar?.monto_abonado ?? 0))) <= 0
                            return (
                              <button onClick={() => navigate(`/finanzas/pagos/cuentas/servicios/pago/${t.id}`, { state: { tipo: "edicion", servicioId: t.id, cuentaId: t.cuenta_por_cobrar?.id, nombre: getCliente(t), montoTotal: Number(t.precio_cobrado) || 0, montoSaldo: t.cuenta_por_cobrar ? Number(t.cuenta_por_cobrar.saldo_pendiente) : Number(t.precio_cobrado) || 0, nombreServicio: t.titulo || "Edición de Video" } })}
                                className={cn(
                                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap shrink-0",
                                  esPagado ? "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100" : "text-white hover:opacity-90"
                                )}
                                style={esPagado ? {} : { backgroundColor: COLORS.ACCENT }}>
                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                {esPagado ? "Ver pagos" : "Registrar pago"}
                              </button>
                            )
                          })()}
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
