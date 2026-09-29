import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  RadioIcon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Money01Icon,
  InformationCircleIcon,
  Mail01Icon,
  CallIcon,
  IdentificationIcon,
  UserGroupIcon,
  Edit01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import {
  Trash2,
  Play,
  CheckCircle2,
  DollarSign,
  Headphones,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { parseLocalDate, cn } from "@/lib/utils"
import { radioService, type ReservaRadio } from "@/services/radio.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  reservado: {
    label: "Pendiente",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  confirmado: {
    label: "Confirmado",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  en_progreso: {
    label: "En Cabina (En Vivo)",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  completado: {
    label: "Finalizado",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelado: {
    label: "Cancelado",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
}

function formatFechaLarga(f?: string) {
  if (!f) return "—"
  const d = parseLocalDate(f)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function computeDuracion(inicio?: string, fin?: string) {
  if (!inicio || !fin) return "—"
  const [h1, m1] = inicio.split(":").map(Number)
  const [h2, m2] = fin.split(":").map(Number)
  const totalMin = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0))
  if (isNaN(totalMin) || totalMin <= 0) return "—"
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours} ${hours === 1 ? "hora" : "horas"}`
  return `${mins} min`
}

export function ReservaRadioDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const backHref = useMemo(() => {
    const p = new URLSearchParams()
    const e = searchParams.get("estado")
    const d = searchParams.get("fecha_desde")
    const h = searchParams.get("fecha_hasta")
    const s = searchParams.get("search")
    if (e) p.set("estado", e)
    if (d) p.set("fecha_desde", d)
    if (h) p.set("fecha_hasta", h)
    if (s) p.set("search", s)
    const qs = p.toString()
    return `/servicios/radio/historial${qs ? `?${qs}` : ""}`
  }, [searchParams])

  const [reserva, setReserva] = useState<ReservaRadio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadReserva = useCallback(() => {
    if (!id) {
      navigate(backHref)
      return
    }
    setLoading(true)
    radioService
      .getReserva(id)
      .then(setReserva)
      .catch(() => {
        toast.error("Error al cargar los datos de la reserva")
        navigate(backHref)
      })
      .finally(() => setLoading(false))
  }, [id, navigate, backHref])

  useEffect(() => {
    loadReserva()
  }, [loadReserva])

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!reserva) return
    setSaving(true)
    try {
      const updated = await radioService.cambiarEstado(reserva.id, nuevoEstado)
      setReserva(updated)
      toast.success(
        `Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`,
      )
    } catch {
      toast.error("Error al actualizar el estado de la reserva")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReserva = async () => {
    if (!reserva) return
    setDeleting(true)
    try {
      await radioService.deleteReserva(reserva.id)
      toast.success("Reserva de radio eliminada correctamente")
      navigate(backHref)
    } catch {
      toast.error("Error al eliminar la reserva")
    } finally {
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
        <p className="text-xs font-semibold text-slate-500">
          Cargando detalle de reserva de radio...
        </p>
      </div>
    )
  }

  if (!reserva) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <HugeiconsIcon icon={RadioIcon} size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Reserva no encontrada
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          El registro de reserva solicitado no existe o fue eliminado.
        </p>
        <button
          onClick={() => navigate(backHref)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition-all"
        >
          Volver al Historial
        </button>
      </div>
    )
  }

  const isOverdue =
    (reserva.estado === "reservado" || reserva.estado === "confirmado") &&
    new Date(`${reserva.fecha_reserva}T${reserva.hora_fin}`) < new Date()

  const getCliente = () => {
    if (reserva.persona)
      return `${reserva.persona.nombres} ${reserva.persona.apellidos}`.trim()
    if (reserva.cliente_externo)
      return `${reserva.cliente_externo.nombres || ""}`.trim()
    return "Cliente no especificado"
  }

  const clienteCedula = reserva.cliente_externo?.cedula
  const clienteEmail =
    reserva.cliente_externo?.correo ||
    (reserva.persona as unknown as { correo?: string })?.correo
  const clienteTelefono =
    reserva.cliente_externo?.celular ||
    (reserva.persona as unknown as { celular?: string })?.celular

  const estadoCfg = ESTADO_CONFIG[reserva.estado] || ESTADO_CONFIG.reservado
  const duracion = computeDuracion(reserva.hora_inicio, reserva.hora_fin)

  return (
    <div className="min-h-full bg-slate-50/50 text-slate-800 pb-16 flex flex-col">
      {/* Sticky Header */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => navigate(backHref)}
              title="Volver"
              className="size-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs transition-all active:scale-[0.98] shrink-0 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} className="text-slate-500" />
            </button>

            <div className="size-11 rounded-2xl bg-orange-50 text-[#fd761a] border border-orange-200/80 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={RadioIcon} size={22} />
            </div>

            <div className="min-w-0">
              
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate mt-0.5">
                Reserva de Cabina de Radio
              </h1>
            </div>
          </div>

          {/* Action Cluster Header */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Status Select Pill */}
            <div className="relative">
              <select
                value={reserva.estado}
                onChange={(e) => handleCambiarEstado(e.target.value)}
                disabled={saving}
                className={cn(
                  "appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border outline-none cursor-pointer transition-all shadow-2xs",
                  estadoCfg.bg,
                  estadoCfg.text,
                  estadoCfg.border,
                  saving && "opacity-50 pointer-events-none",
                )}
              >
                {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val} className="text-slate-800 bg-white normal-case">
                    {cfg.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className={cn(
                  "absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none",
                  estadoCfg.text,
                )}
              />
            </div>

            {/* Edit Button */}
            <button
              onClick={() =>
                navigate("/servicios/radio", {
                  state: { editarReserva: reserva },
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <HugeiconsIcon icon={Edit01Icon} size={14} className="text-slate-500" />
              <span>Editar</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center justify-center size-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              title="Eliminar reserva"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Urgent Warnings */}
        {isOverdue && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 shadow-2xs">
            <div className="size-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Alert02Icon} size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold">Reserva Vencida o Pendiente de Cierre</p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                La fecha y hora de la transmisión ({reserva.fecha_reserva} {reserva.hora_fin.substring(0, 5)}) ya transcurrió. Recuerda actualizar su estado a finalizado.
              </p>
            </div>
            <button
              onClick={() => handleCambiarEstado("completado")}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs shrink-0 transition-all cursor-pointer"
            >
              Finalizar Ahora
            </button>
          </div>
        )}

        {reserva.estado === "cancelado" && (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-slate-700">
            <div className="size-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Alert02Icon} size={18} />
            </div>
            <div>
              <p className="text-xs font-bold">Esta reserva fue cancelada</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                La franja horaria en la cabina de radio quedó liberada en el sistema.
              </p>
            </div>
          </div>
        )}

        {/* 3 Metric Bento Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Fecha */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={13} className="text-orange-500" />
                Fecha de Emisión
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {reserva.fecha_reserva}
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 capitalize">
              {formatFechaLarga(reserva.fecha_reserva)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Sesión programada en cabina
            </p>
          </div>

          {/* Horario & Duración */}
          <div
            className={cn(
              "bg-white rounded-2xl border p-5 shadow-2xs transition-all hover:shadow-xs",
              isOverdue
                ? "border-rose-200 bg-rose-50/20"
                : "border-slate-200/80",
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={13} className="text-blue-500" />
                Horario de Transmisión
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                {duracion}
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 tracking-tight">
              {reserva.hora_inicio.substring(0, 5)} — {reserva.hora_fin.substring(0, 5)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Uso exclusivo de micrófonos y consola
            </p>
          </div>

          {/* Inversión & Pagos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HugeiconsIcon icon={Money01Icon} size={13} className="text-emerald-500" />
                Inversión Total
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Number(reserva.monto_descuento ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Desc. -${Number(reserva.monto_descuento).toFixed(2)}
                  </span>
                )}
                {Number(reserva.monto_recargo ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Rec. +${Number(reserva.monto_recargo).toFixed(2)}
                  </span>
                )}
                {reserva.pago_registrado ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={11} />
                    Al día
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    <DollarSign size={11} />
                    Pendiente
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                ${Number(reserva.precio_total).toFixed(2)}
              </p>
              {reserva.precio_original && Number(reserva.precio_original) > 0 && (
                <span className="text-sm font-semibold text-slate-400 line-through">
                  ${Number(reserva.precio_original).toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {reserva.tarifa?.nombre || "Tarifa estándar"} (${Number(reserva.tarifa?.precio_por_hora ?? 0).toFixed(2)}/h)
            </p>
          </div>
        </section>

        {/* 2-Column Detail Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card: Cliente / Responsable */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="size-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HugeiconsIcon icon={UserIcon} size={15} />
                </div>
                <span>Responsable de la Reserva</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {reserva.persona_id ? "Alumno / Miembro" : "Cliente Externo"}
              </span>
            </div>

            <div>
              <p className="text-base font-bold text-slate-900">
                {getCliente()}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Titular registrado en la solicitud de reserva de cabina
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {clienteCedula && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <HugeiconsIcon icon={IdentificationIcon} size={16} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Cédula / RUC</p>
                    <p className="font-semibold text-slate-800 truncate">{clienteCedula}</p>
                  </div>
                </div>
              )}

              {clienteTelefono && (
                <a
                  href={`tel:${clienteTelefono}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs transition-colors group"
                >
                  <HugeiconsIcon icon={CallIcon} size={16} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Teléfono / WhatsApp</p>
                    <p className="font-semibold text-slate-800 truncate group-hover:text-emerald-700">{clienteTelefono}</p>
                  </div>
                </a>
              )}

              {clienteEmail && (
                <a
                  href={`mailto:${clienteEmail}`}
                  className="sm:col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs transition-colors group"
                >
                  <HugeiconsIcon icon={Mail01Icon} size={16} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Correo Electrónico</p>
                    <p className="font-semibold text-slate-800 truncate group-hover:text-blue-700">{clienteEmail}</p>
                  </div>
                  <ExternalLink size={13} className="text-slate-300 group-hover:text-slate-500" />
                </a>
              )}

              {!clienteCedula && !clienteTelefono && !clienteEmail && (
                <p className="sm:col-span-2 text-xs text-slate-400 italic">
                  No se registraron datos de contacto adicionales para este responsable.
                </p>
              )}
            </div>
          </div>

          {/* Card: Tarifa y Operador */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="size-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Headphones size={15} />
                </div>
                <span>Servicio & Asistencia Técnica</span>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/80">
                {reserva.tarifa?.nombre || "Tarifa Radio"}
              </span>
            </div>

            {/* Operador Asignado */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-start gap-3">
              <div className="size-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={UserGroupIcon} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Operador Técnico
                </p>
                {reserva.incluye_operador && reserva.operador ? (
                  <div>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {reserva.operador.nombres} {reserva.operador.apellidos}
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      ✓ Operador asignado y confirmado
                    </p>
                  </div>
                ) : reserva.incluye_operador ? (
                  <div>
                    <p className="text-sm font-bold text-amber-700 mt-0.5">
                      Pendiente de asignación
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      La tarifa incluye asistencia técnica en cabina.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mt-0.5">
                      Autogestionado por el usuario
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Esta reserva no requiere asistencia técnica continua.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tarifa y Liquidación Detalle */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Tarifa por hora:</span>
                <span className="font-bold text-slate-900">
                  ${Number(reserva.tarifa?.precio_por_hora ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Tiempo contratado:</span>
                <span className="font-semibold text-slate-800">{duracion}</span>
              </div>
              {reserva.precio_original && Number(reserva.precio_original) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Precio base original:</span>
                  <span className="font-semibold text-slate-700">
                    ${Number(reserva.precio_original).toFixed(2)}
                  </span>
                </div>
              )}
              {Number(reserva.monto_descuento ?? 0) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                  <span>
                    Descuento {reserva.motivo_descuento ? `(${reserva.motivo_descuento})` : ""}:
                  </span>
                  <span className="font-bold">-${Number(reserva.monto_descuento).toFixed(2)}</span>
                </div>
              )}
              {Number(reserva.monto_recargo ?? 0) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-amber-600">
                  <span>
                    Recargo {reserva.motivo_recargo ? `(${reserva.motivo_recargo})` : ""}:
                  </span>
                  <span className="font-bold">+${Number(reserva.monto_recargo).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-slate-800 font-bold">
                <span>Total liquidado:</span>
                <span className="text-slate-900">${Number(reserva.precio_total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card: Observaciones y Pauta */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-3 lg:col-span-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              <HugeiconsIcon icon={InformationCircleIcon} size={15} className="text-slate-400" />
              <span>Observaciones & Pauta de Emisión</span>
            </div>

            {reserva.observaciones ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                {reserva.observaciones}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Sin notas ni especificaciones adicionales para esta reserva.
              </p>
            )}
          </div>
        </div>

        {/* Action Bar Footer */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-900">
              Gestión operativa de la transmisión
            </p>
            <p className="text-[11px] text-slate-500">
              Modifica el estado del servicio o vincula el pago correspondiente en finanzas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Transition: Iniciar */}
            {(reserva.estado === "reservado" || reserva.estado === "confirmado") && (
              <button
                type="button"
                onClick={() => handleCambiarEstado("en_progreso")}
                disabled={saving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Play size={15} className="fill-white" />
                <span>Iniciar Transmisión</span>
              </button>
            )}

            {/* Transition: Finalizar */}
            {reserva.estado === "en_progreso" && (
              <button
                type="button"
                onClick={() => handleCambiarEstado("completado")}
                disabled={saving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Finalizar Sesión</span>
              </button>
            )}

            {/* Finance: Registrar / Ver Pago */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/finanzas/pagos/cuentas/servicios/pago/${reserva.id}`,
                  {
                    state: {
                      tipo: "radio",
                      servicioId: reserva.id,
                      cuentaId: reserva.cuenta_por_cobrar?.id,
                      nombre: getCliente(),
                      montoTotal: Number(reserva.precio_total) || 0,
                      montoSaldo:
                        Number(
                          reserva.cuenta_por_cobrar?.saldo_pendiente ??
                            reserva.precio_total,
                        ) || 0,
                      nombreServicio: "Reserva de Cabina de Radio",
                    },
                  },
                )
              }
              className={cn(
                "flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer",
                reserva.pago_registrado
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  : "bg-[#fd761a] hover:brightness-105 text-white shadow-orange-500/20",
              )}
            >
              <DollarSign size={16} />
              <span>
                {reserva.pago_registrado ? "Ver Comprobante de Pago" : "Registrar Pago"}
              </span>
            </button>
          </div>
        </section>
      </main>

      {/* Confirmation Modal: Delete */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Eliminar Reserva de Radio"
        message={`¿Estás seguro de que deseas eliminar permanentemente la reserva para "${getCliente()}" del día ${reserva.fecha_reserva}? Esta acción liberará la cabina y removerá sus registros.`}
        confirmText="Eliminar Reserva"
        cancelText="Conservar"
        isDangerous={true}
        isLoading={deleting}
        icon="trash"
        onConfirm={handleDeleteReserva}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
