import { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon, RadioIcon, Calendar03Icon, UserIcon,
  Clock01Icon, Money01Icon, CheckmarkCircle04Icon,
  InformationCircleIcon, Mail01Icon, CallIcon, IdentificationIcon,
  UserGroupIcon, Edit01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { radioService, type ReservaRadio } from "@/services/radio.service"
import { toast } from "sonner"

const ESTADO_COLORS: Record<string, string> = {
  reservado: "bg-orange-100 text-orange-700 border-orange-200",
  confirmado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  en_progreso: "bg-blue-100 text-blue-700 border-blue-200",
  completado: "bg-gray-100 text-gray-500 border-gray-300",
  cancelado: "bg-red-100 text-red-600 border-red-200",
}

const ESTADO_LABELS: Record<string, string> = {
  reservado: "Pendiente", confirmado: "Confirmado", en_progreso: "En progreso", completado: "Finalizado", cancelado: "Cancelado",
}

function formatFechaLarga(f?: string) {
  if (!f) return "—"
  return new Date(f).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
}

export function ReservaRadioDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const backHref = `/servicios/radio/historial${(() => { const p = new URLSearchParams(); const e = searchParams.get("estado"); const d = searchParams.get("fecha_desde"); const h = searchParams.get("fecha_hasta"); const s = searchParams.get("search"); if (e) p.set("estado", e); if (d) p.set("fecha_desde", d); if (h) p.set("fecha_hasta", h); if (s) p.set("search", s); const qs = p.toString(); return qs ? `?${qs}` : "" })()}`

  const [reserva, setReserva] = useState<ReservaRadio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) { navigate(backHref); return }
    radioService.getReserva(id)
      .then(setReserva)
      .catch(() => { toast.error("Error al cargar reserva"); navigate(backHref) })
      .finally(() => setLoading(false))
  }, [id, navigate, backHref])

  const handleFinalizar = async () => {
    if (!reserva) return
    setSaving(true)
    try {
      await radioService.cambiarEstado(reserva.id, "completado")
      toast.success("Reserva marcada como finalizada")
      setReserva(prev => prev ? { ...prev, estado: "completado" } : null)
    } catch { toast.error("Error al cambiar estado") }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full" style={{ borderColor: COLORS.ACCENT }} />
          <p className="text-xs font-medium opacity-40">Cargando reserva...</p>
        </div>
      </div>
    )
  }

  if (!reserva) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-medium opacity-40">Reserva no encontrada</p>
      </div>
    )
  }

  const isOverdue = (reserva.estado === "reservado" || reserva.estado === "confirmado") && new Date(`${reserva.fecha_reserva}T${reserva.hora_fin}`) < new Date()
  const getCliente = () => {
    if (reserva.persona) return `${reserva.persona.nombres} ${reserva.persona.apellidos}`
    if (reserva.cliente_externo) return reserva.cliente_externo.nombres || "—"
    return "—"
  }
  const clienteCedula = reserva.cliente_externo?.cedula
  const clienteEmail = reserva.cliente_externo?.correo
  const clienteTelefono = reserva.cliente_externo?.celular

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 border-b bg-white sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(backHref)}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={RadioIcon} size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  Reserva de Radio
                </h1>
                <p className="text-xs opacity-40 mt-0.5 truncate">
                  {reserva.tarifa?.nombre || "Sin tarifa"} · ${Number(reserva.tarifa?.precio_por_hora ?? 0).toFixed(2)}/hr
                </p>
              </div>
            </div>
            <select
              value={reserva.estado}
              onChange={e => reserva && radioService.cambiarEstado(reserva.id, e.target.value).then(r => setReserva(r)).catch(() => toast.error("Error"))}
              disabled={saving}
              className={cn("ml-auto px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border outline-none cursor-pointer shrink-0", saving ? "opacity-50" : "", ESTADO_COLORS[reserva.estado] || "bg-gray-100")}
            >
              {Object.entries(ESTADO_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-5">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border p-4 space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={11} /> Fecha
              </p>
              <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{formatFechaLarga(reserva.fecha_reserva)}</p>
            </div>
            <div className={cn("bg-white rounded-2xl border p-4 space-y-1", isOverdue ? "bg-red-50 border-red-200" : "")}
              style={{ borderColor: isOverdue ? undefined : COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={11} /> Horario
              </p>
              <p className={cn("text-sm font-bold", isOverdue ? "text-red-700" : "")} style={{ color: isOverdue ? undefined : COLORS.CHARCOAL }}>
                {reserva.hora_inicio.substring(0, 5)} – {reserva.hora_fin.substring(0, 5)}
              </p>
              {isOverdue && <p className="text-[10px] text-red-500 font-medium">Reserva vencida</p>}
            </div>
            <div className="bg-white rounded-2xl border p-4 space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                <HugeiconsIcon icon={Money01Icon} size={11} /> Total
              </p>
              <p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>${Number(reserva.precio_total).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tarifa:</span>
            <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>
              {reserva.tarifa?.nombre || "—"} (${Number(reserva.tarifa?.precio_por_hora ?? 0).toFixed(2)}/h)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
                <HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" /> Responsable
              </h3>
              <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{getCliente()}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs opacity-50">
                {clienteCedula && <span className="flex items-center gap-1"><HugeiconsIcon icon={IdentificationIcon} size={12} />{clienteCedula}</span>}
                {clienteEmail && <span className="flex items-center gap-1"><HugeiconsIcon icon={Mail01Icon} size={12} />{clienteEmail}</span>}
                {clienteTelefono && <span className="flex items-center gap-1"><HugeiconsIcon icon={CallIcon} size={12} />{clienteTelefono}</span>}
                {!clienteCedula && !clienteEmail && !clienteTelefono && <span>Sin datos de contacto</span>}
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
                <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-violet-500" /> Operador
              </h3>
              {reserva.incluye_operador && reserva.operador ? (
                <>
                  <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                    {reserva.operador.nombres} {reserva.operador.apellidos}
                  </p>
                </>
              ) : reserva.incluye_operador ? (
                <p className="text-sm opacity-40">Sin asignar</p>
              ) : (
                <p className="text-sm opacity-40">No requiere operador</p>
              )}
            </div>
          </div>

          {reserva.observaciones && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5 mb-2">
                <HugeiconsIcon icon={InformationCircleIcon} size={11} /> Observaciones
              </p>
              <p className="text-xs opacity-60">{reserva.observaciones}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 pb-4">
            {(reserva.estado === "reservado" || reserva.estado === "confirmado" || reserva.estado === "en_progreso") && (
              <button onClick={handleFinalizar} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />
                {saving ? "Procesando..." : "Marcar como finalizado"}
              </button>
            )}
            {!reserva.pago_registrado && (
              <button onClick={() => navigate(`/finanzas/pagos/cuentas/servicios/pago/${reserva.id}`, { state: { tipo: "radio", servicioId: reserva.id, nombre: getCliente(), montoTotal: Number(reserva.precio_total) || 0, montoSaldo: Number(reserva.precio_total) || 0, nombreServicio: `Reserva de Radio` } })} className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:bg-gray-50 active:scale-[0.98]"
                style={{ borderColor: COLORS.ACCENT, color: COLORS.ACCENT }}>
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />
                Registrar pago
              </button>
            )}
            {reserva.estado === "completado" && (
              <p className="text-sm font-medium py-3 opacity-40" style={{ color: COLORS.CHARCOAL }}>Esta reserva ya fue finalizada</p>
            )}
          </div>

          <button onClick={() => navigate("/servicios/radio", { state: { editarReserva: reserva } })}
            className="inline-flex items-center gap-2 text-xs opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: COLORS.CHARCOAL }}>
            <HugeiconsIcon icon={Edit01Icon} size={13} />
            Editar reserva
          </button>
        </div>
      </div>
    </div>
  )
}
