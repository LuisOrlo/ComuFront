import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  CameraVideoIcon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Money01Icon,
  Location01Icon,
  Mail01Icon,
  CallIcon,
  IdentificationIcon,
  UserGroupIcon,
  ToolsIcon,
  Edit01Icon,
  Alert02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import {
  Trash2,
  ChevronDown,
  CheckCircle2,
  DollarSign,
  Play,
  ExternalLink,
} from "lucide-react"
import { parseLocalDate, cn } from "@/lib/utils"
import {
  streamingService,
  type ServicioStreaming,
} from "@/services/streaming.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  reservado: {
    label: "Reservado",
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
    label: "En Cobertura (En Vivo)",
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

export function StreamingDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [streaming, setStreaming] = useState<ServicioStreaming | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modales
  const [confirmEliminar, setConfirmEliminar] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await streamingService.getById(id)
      setStreaming(data)
    } catch {
      toast.error("Error al cargar la información del servicio")
      navigate("/servicios/streaming")
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCambiarEstado = async (nuevoEstado: ServicioStreaming["estado"]) => {
    if (!streaming || nuevoEstado === streaming.estado) return
    setSaving(true)
    try {
      const updated = await streamingService.cambiarEstado(streaming.id, nuevoEstado)
      setStreaming((prev) => (prev ? { ...prev, estado: updated.estado } : null))
      toast.success(`Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
    } catch {
      toast.error("Error al actualizar el estado")
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async () => {
    if (!streaming) return
    setSaving(true)
    try {
      await streamingService.delete(streaming.id)
      toast.success("Servicio de streaming eliminado")
      navigate("/servicios/streaming")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "No se puede eliminar este servicio"
      toast.error(msg)
    } finally {
      setSaving(false)
      setConfirmEliminar(false)
    }
  }

  const cuenta = streaming?.cuenta_por_cobrar
  const totalMonto = streaming ? Number(streaming.precio_total) : 0
  const abonadoMonto = cuenta
    ? Number(cuenta.monto_abonado)
    : streaming?.pago_registrado
      ? totalMonto
      : 0
  const saldoMonto = cuenta
    ? Number(cuenta.saldo_pendiente)
    : streaming?.pago_registrado
      ? 0
      : totalMonto

  if (loading || !streaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
        <p className="text-xs font-semibold text-slate-500">
          Cargando detalle de cobertura de streaming...
        </p>
      </div>
    )
  }

  const isOverdue =
    (streaming.estado === "reservado" || streaming.estado === "confirmado") &&
    new Date(`${streaming.fecha_evento}T${streaming.hora_fin}`) < new Date()

  const estadoCfg = ESTADO_CONFIG[streaming.estado] || ESTADO_CONFIG.reservado
  const duracion = computeDuracion(streaming.hora_inicio, streaming.hora_fin)

  const clienteNombre = streaming.cliente_externo
    ? `${streaming.cliente_externo.nombres} ${streaming.cliente_externo.apellidos || ""}`.trim()
    : streaming.persona
      ? `${streaming.persona.nombres} ${streaming.persona.apellidos}`.trim()
      : "Cliente sin asignar"

  const clienteIdentificacion =
    streaming.cliente_externo?.cedula ||
    streaming.cliente_externo?.ruc ||
    streaming.persona?.cedula ||
    null

  const clienteCorreo =
    streaming.cliente_externo?.correo ||
    streaming.persona?.correo ||
    null

  const clienteCelular =
    streaming.cliente_externo?.celular ||
    streaming.persona?.celular ||
    null

  return (
    <div className="min-h-full bg-slate-50/50 text-slate-800 pb-16 flex flex-col">
      {/* Sticky Header */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/servicios/streaming"
              title="Volver"
              className="size-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs transition-all active:scale-[0.98] shrink-0 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} className="text-slate-500" />
            </Link>

            <div className="size-11 rounded-2xl bg-orange-50 text-[#fd761a] border border-orange-200/80 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={CameraVideoIcon} size={22} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#fd761a]" />
                <span className="text-[11px] font-bold tracking-widest text-[#fd761a] uppercase">
                  Detalle de la reserva de streaming
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate mt-0.5">
                {streaming.titulo || "Cobertura en Locación"}
              </h1>
            </div>
          </div>

          {/* Action Cluster Header */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Status Select Pill */}
            <div className="relative">
              <select
                value={streaming.estado}
                onChange={(e) =>
                  handleCambiarEstado(e.target.value as ServicioStreaming["estado"])
                }
                disabled={saving}
                className={cn(
                  "appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border outline-none cursor-pointer transition-all shadow-2xs",
                  estadoCfg.bg,
                  estadoCfg.text,
                  estadoCfg.border,
                  saving && "opacity-50 pointer-events-none"
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
                  estadoCfg.text
                )}
              />
            </div>

            {/* Edit Button */}
            <Link
              to={`/servicios/streaming/${streaming.id}/editar`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <HugeiconsIcon icon={Edit01Icon} size={14} className="text-slate-500" />
              <span>Editar</span>
            </Link>

            {/* Delete Button */}
            <button
              onClick={() => setConfirmEliminar(true)}
              className="inline-flex items-center justify-center size-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              title="Eliminar cobertura"
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
              <p className="text-xs font-bold">Cobertura Vencida o Pendiente de Cierre</p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                La fecha y hora de la transmisión ({streaming.fecha_evento} {streaming.hora_fin.substring(0, 5)}) ya transcurrió. Recuerda actualizar su estado a finalizado.
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

        {streaming.estado === "cancelado" && (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-slate-700 shadow-2xs">
            <div className="size-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Alert02Icon} size={18} />
            </div>
            <div>
              <p className="text-xs font-bold">Esta cobertura de streaming fue cancelada</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Los técnicos asignados han quedado liberados de este horario en el sistema.
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
                Fecha del Evento
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {streaming.fecha_evento}
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 capitalize">
              {formatFechaLarga(streaming.fecha_evento)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Producción técnica en locación
            </p>
          </div>

          {/* Horario & Duración */}
          <div
            className={cn(
              "bg-white rounded-2xl border p-5 shadow-2xs transition-all hover:shadow-xs",
              isOverdue ? "border-rose-200 bg-rose-50/20" : "border-slate-200/80"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={13} className="text-blue-500" />
                Horario de Cobertura
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                {duracion}
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 tracking-tight">
              {streaming.hora_inicio?.substring(0, 5)} — {streaming.hora_fin?.substring(0, 5)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Transmisión en vivo y registro audiovisual
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
                {Number(streaming.monto_descuento ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Desc. -${Number(streaming.monto_descuento).toFixed(2)}
                  </span>
                )}
                {Number(streaming.monto_recargo ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Rec. +${Number(streaming.monto_recargo).toFixed(2)}
                  </span>
                )}
                {streaming.pago_registrado ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={11} />
                    Al día
                  </span>
                ) : abonadoMonto > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    <DollarSign size={11} />
                    Abonado
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
                ${totalMonto.toFixed(2)}
              </p>
              {streaming.precio_original && Number(streaming.precio_original) > 0 && (
                <span className="text-sm font-semibold text-slate-400 line-through">
                  ${Number(streaming.precio_original).toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Saldo pendiente: ${saldoMonto.toFixed(2)}
            </p>
          </div>
        </section>

        {/* 2-Column Detail Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card: Locación y Logística */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="size-7 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                  <HugeiconsIcon icon={Location01Icon} size={15} />
                </div>
                <span>Locación & Recinto</span>
              </div>
              {streaming.ciudad?.nombre && (
                <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80">
                  {streaming.ciudad.nombre}
                </span>
              )}
            </div>

            <div>
              <p className="text-base font-bold text-slate-900">
                {streaming.lugar}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {streaming.direccion || "Sin dirección exacta registrada"}
              </p>
            </div>

            {streaming.referencias_ubicacion && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-600 block mb-0.5">
                  Referencias de acceso / locación:
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {streaming.referencias_ubicacion}
                </p>
              </div>
            )}
          </div>

          {/* Card: Cliente / Contratante */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="size-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HugeiconsIcon icon={UserIcon} size={15} />
                </div>
                <span>Contratante / Solicitante</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {streaming.persona ? "Interno / Estudiante" : "Cliente Externo"}
              </span>
            </div>

            <div>
              <p className="text-base font-bold text-slate-900">{clienteNombre}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Titular registrado en la orden de servicio de streaming
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {clienteIdentificacion && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <HugeiconsIcon
                    icon={IdentificationIcon}
                    size={16}
                    className="text-slate-400 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Cédula / RUC</p>
                    <p className="font-semibold text-slate-800 truncate">
                      {clienteIdentificacion}
                    </p>
                  </div>
                </div>
              )}

              {clienteCelular && (
                <a
                  href={`tel:${clienteCelular}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs transition-colors group"
                >
                  <HugeiconsIcon
                    icon={CallIcon}
                    size={16}
                    className="text-slate-400 group-hover:text-emerald-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Teléfono / WhatsApp
                    </p>
                    <p className="font-semibold text-slate-800 truncate group-hover:text-emerald-700">
                      {clienteCelular}
                    </p>
                  </div>
                </a>
              )}

              {clienteCorreo && (
                <a
                  href={`mailto:${clienteCorreo}`}
                  className="sm:col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs transition-colors group"
                >
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    size={16}
                    className="text-slate-400 group-hover:text-blue-600 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Correo Electrónico
                    </p>
                    <p className="font-semibold text-slate-800 truncate group-hover:text-blue-700">
                      {clienteCorreo}
                    </p>
                  </div>
                  <ExternalLink size={13} className="text-slate-300 group-hover:text-slate-500" />
                </a>
              )}

              {!clienteIdentificacion && !clienteCelular && !clienteCorreo && (
                <p className="sm:col-span-2 text-xs text-slate-400 italic">
                  No se registraron datos de contacto adicionales para este cliente.
                </p>
              )}
            </div>
          </div>

          {/* Card: Personal Técnico Asignado */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="size-7 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={15} />
                </div>
                <span>Personal Técnico en Locación</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {streaming.asignaciones?.length || 0} técnico(s)
              </span>
            </div>

            {streaming.asignaciones && streaming.asignaciones.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {streaming.asignaciones.map((asig, i) => (
                  <div
                    key={asig.id || i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center font-black text-xs">
                        {asig.persona?.nombres?.charAt(0) || "T"}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          {asig.persona
                            ? `${asig.persona.nombres} ${asig.persona.apellidos}`
                            : "Personal Técnico"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {asig.persona?.correo || "Personal de cobertura"}
                        </p>
                      </div>
                    </div>
                    {asig.persona?.celular && (
                      <a
                        href={`tel:${asig.persona.celular}`}
                        className="text-[11px] text-slate-500 hover:text-emerald-600 font-mono flex items-center gap-1"
                      >
                        <HugeiconsIcon icon={CallIcon} size={12} />
                        {asig.persona.celular}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No hay técnicos asignados a este evento. Puedes asignarlos en el formulario de edición.
              </p>
            )}
          </div>

          {/* Card: Liquidación Financiera */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HugeiconsIcon icon={Money01Icon} size={15} />
                </div>
                <span>Liquidación & Estado de Cobro</span>
              </div>
              {saldoMonto > 0 ? (
                <Link
                  to={`/servicios/streaming/${streaming.id}/pago`}
                  className="px-2.5 py-1 rounded-lg bg-[#fd761a] hover:bg-[#e06310] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  + Registrar Pago
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold select-none cursor-default">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Pagado Completo
                </span>
              )}
            </div>

            {/* Desglose */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Precio base / original:</span>
                <span className="font-bold text-slate-900">
                  ${Number(streaming.precio_original || streaming.precio_total).toFixed(2)}
                </span>
              </div>

              {streaming.monto_descuento && Number(streaming.monto_descuento) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                  <span>
                    Descuento {streaming.motivo_descuento ? `(${streaming.motivo_descuento})` : ""}:
                  </span>
                  <span className="font-bold">
                    -${Number(streaming.monto_descuento).toFixed(2)}
                  </span>
                </div>
              )}

              {streaming.monto_recargo && Number(streaming.monto_recargo) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-amber-600">
                  <span>
                    Recargo {streaming.motivo_recargo ? `(${streaming.motivo_recargo})` : ""}:
                  </span>
                  <span className="font-bold">
                    +${Number(streaming.monto_recargo).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 text-slate-800 font-bold">
                <span>Total a cobrar:</span>
                <span className="text-slate-900">${totalMonto.toFixed(2)}</span>
              </div>
            </div>

            {/* Resumen Abonado vs Saldo */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Monto Cobrado
                </span>
                <p className="text-base font-black text-emerald-700 mt-0.5">
                  ${abonadoMonto.toFixed(2)}
                </p>
              </div>

              <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-100 text-center">
                <span className="text-[10px] uppercase font-bold text-orange-800 tracking-wider">
                  Saldo Restante
                </span>
                <p className="text-base font-black text-[#fd761a] mt-0.5">
                  ${saldoMonto.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Historial de Pagos si existen */}
            {cuenta && cuenta.transacciones && cuenta.transacciones.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Transacciones Registradas ({cuenta.transacciones.length})
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {cuenta.transacciones.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800 capitalize">{tx.metodo_pago}</p>
                        <p className="text-[10px] text-slate-400">{tx.fecha_pago}</p>
                      </div>
                      <span className="font-black text-emerald-600">
                        +${Number(tx.monto).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card: Equipos Requeridos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              <HugeiconsIcon icon={ToolsIcon} size={15} className="text-slate-400" />
              <span>Equipos & Material Requerido</span>
            </div>

            {streaming.equipos_detalle ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/70 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {streaming.equipos_detalle}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Sin especificaciones de equipos declaradas para este servicio.
              </p>
            )}
          </div>

          {/* Card: Observaciones */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              <HugeiconsIcon icon={InformationCircleIcon} size={15} className="text-slate-400" />
              <span>Observaciones Generales</span>
            </div>

            {streaming.observaciones ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/70 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {streaming.observaciones}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Sin observaciones adicionales registradas.
              </p>
            )}
          </div>
        </div>

        {/* Action Bar Footer */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-900">Gestión operativa de la cobertura</p>
            <p className="text-[11px] text-slate-500">
              Controla el ciclo del servicio o registra cobros asociados a la cuenta.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Transition: Iniciar */}
            {(streaming.estado === "reservado" || streaming.estado === "confirmado") && (
              <button
                type="button"
                onClick={() => handleCambiarEstado("en_progreso")}
                disabled={saving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Play size={15} className="fill-white" />
                <span>Iniciar Cobertura</span>
              </button>
            )}

            {/* Transition: Finalizar */}
            {streaming.estado === "en_progreso" && (
              <button
                type="button"
                onClick={() => handleCambiarEstado("completado")}
                disabled={saving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Finalizar Cobertura</span>
              </button>
            )}

            {/* Finance: Registrar / Ver Pago Link */}
            {saldoMonto > 0 ? (
              <Link
                to={`/servicios/streaming/${streaming.id}/pago`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer bg-[#fd761a] hover:brightness-105 text-white shadow-orange-500/20"
              >
                <DollarSign size={16} />
                <span>Registrar Pago</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
                title="El valor total de este servicio ya ha sido cubierto"
              >
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Pago Liquidado (100%)</span>
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Modal Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={confirmEliminar}
        onCancel={() => setConfirmEliminar(false)}
        onConfirm={handleEliminar}
        title="Eliminar Cobertura de Streaming"
        message={`¿Estás seguro de que deseas eliminar permanentemente la cobertura "${streaming.titulo || "Streaming"}" del día ${streaming.fecha_evento}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar permanentemente"
        isDangerous={true}
        isLoading={saving}
      />
    </div>
  )
}

