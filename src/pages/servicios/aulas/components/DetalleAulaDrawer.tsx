import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  School,
  User,
  Library,
  Mail,
  Phone,
  IdCard,
  Clock,
  CalendarDays,
  CircleCheckBig,
  Pencil,
  Trash2,
  Wallet,
  X,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type ReservaAula, type Aula } from "@/services/aulas.service"

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string; dot: string }> = {
  reservado: {
    bg: "bg-orange-50 border-orange-200/70",
    color: "text-orange-800",
    label: "Reservado",
    dot: "bg-[#fd761a]",
  },
  confirmado: {
    bg: "bg-blue-50 border-blue-200/70",
    color: "text-blue-800",
    label: "Confirmado",
    dot: "bg-blue-600",
  },
  en_progreso: {
    bg: "bg-amber-50 border-amber-200/70",
    color: "text-amber-800",
    label: "En progreso",
    dot: "bg-amber-500",
  },
  completado: {
    bg: "bg-slate-100 border-slate-200",
    color: "text-slate-700",
    label: "Completado",
    dot: "bg-slate-400",
  },
  cancelado: {
    bg: "bg-red-50 border-red-200/70",
    color: "text-red-700",
    label: "Cancelado",
    dot: "bg-red-500",
  },
}

function getDurationText(horaInicio?: string, horaFin?: string): string {
  if (!horaInicio || !horaFin) return ""
  const [h1, m1] = horaInicio.slice(0, 5).split(":").map(Number)
  const [h2, m2] = horaFin.slice(0, 5).split(":").map(Number)
  if (isNaN(h1) || isNaN(h2)) return ""
  const mins = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0))
  if (mins <= 0) return ""
  const hrs = mins / 60
  return Number.isInteger(hrs) ? `${hrs}h` : `${hrs.toFixed(1)}h`
}

export function DetalleAulaDrawer({
  isOpen,
  onClose,
  reserva,
  aula,
  onEdit,
  onPago,
  onDelete,
  onEstadoChange,
}: {
  isOpen: boolean
  onClose: () => void
  reserva: ReservaAula | null
  aula?: Aula
  onEdit?: () => void
  onPago?: () => void
  onDelete?: () => void
  onEstadoChange?: (id: string, nuevoEstado: ReservaAula["estado"]) => Promise<void> | void
}) {
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const estado = reserva ? ESTADO_STYLES[reserva.estado] || ESTADO_STYLES.reservado : ESTADO_STYLES.reservado
  const isPersona = !!reserva?.persona_id
  const cliente = reserva?.persona || reserva?.cliente_externo
  const clienteNombre = cliente ? `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() : "—"
  const duration = getDurationText(reserva?.hora_inicio, reserva?.hora_fin)
  const total = Number(reserva?.precio_total || 0)
  const esPagado =
    reserva?.cuenta_por_cobrar?.estado === "pagado" ||
    Number(reserva?.cuenta_por_cobrar?.saldo_pendiente ?? total) <= 0

  const handleEstadoSelect = async (nuevoEstado: ReservaAula["estado"]) => {
    if (!reserva || !onEstadoChange || reserva.estado === nuevoEstado) return
    setIsUpdating(true)
    try {
      await onEstadoChange(reserva.id, nuevoEstado)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && reserva && (
        <div className="fixed inset-0 z-[110]" role="presentation">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-aula-title"
            className="absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl sm:max-w-lg"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 bg-slate-50/60 px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-xs">
                  <School size={19} />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Detalle de alquiler
                  </span>
                  <h2
                    id="detalle-aula-title"
                    className="mt-0.5 truncate text-lg font-bold tracking-tight text-slate-900"
                  >
                    {aula?.nombre || "Aula"}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar detalle"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {/* Espacio asignado + estado */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Espacio asignado
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-slate-900">
                      {aula?.nombre || "Aula —"}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      {aula?.capacidad ? `Capacidad: ${aula.capacidad} personas` : "Capacidad no registrada"}
                    </p>
                  </div>

                  {onEstadoChange ? (
                    <div className="relative shrink-0">
                      <select
                        value={reserva.estado}
                        onChange={(event) => handleEstadoSelect(event.target.value as ReservaAula["estado"])}
                        disabled={isUpdating}
                        title="Cambiar estado de la reserva"
                        className={cn(
                          "cursor-pointer appearance-none rounded-lg border py-1.5 pl-2.5 pr-7 text-[11px] font-semibold outline-none transition-all",
                          estado.bg,
                          estado.color,
                          isUpdating && "pointer-events-none opacity-50",
                        )}
                      >
                        <option value="reservado">Reservado</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="en_progreso">En progreso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                      {isUpdating ? (
                        <span className="absolute right-2 top-1/2 size-2.5 -translate-y-1/2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <ChevronDown
                          size={13}
                          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50"
                        />
                      )}
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        estado.bg,
                        estado.color,
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", estado.dot)} />
                      {estado.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Fecha y horario */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <CalendarDays size={14} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Fecha</span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-slate-800">
                    {new Date(reserva.fecha_reserva + "T00:00:00").toLocaleDateString("es-EC", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Horario</span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-slate-800">
                    {reserva.hora_inicio?.substring(0, 5)} – {reserva.hora_fin?.substring(0, 5)}
                    {duration ? ` (${duration})` : ""}
                  </p>
                </div>
              </div>

              {/* Cliente */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Cliente
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      isPersona ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {isPersona ? <User size={11} /> : <Library size={11} />}
                    {isPersona ? "Cliente interno" : "Cliente externo"}
                  </span>
                </div>

                <p className="mt-1.5 text-sm font-bold text-slate-900">{clienteNombre}</p>

                {(cliente?.cedula || cliente?.celular || cliente?.correo) && (
                  <div className="mt-2.5 grid grid-cols-1 gap-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-600 sm:grid-cols-2">
                    {cliente?.cedula && (
                      <div className="flex items-center gap-1.5">
                        <IdCard size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{cliente.cedula}</span>
                      </div>
                    )}
                    {cliente?.celular && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{cliente.celular}</span>
                      </div>
                    )}
                    {cliente?.correo && (
                      <div className="flex items-center gap-1.5 sm:col-span-full">
                        <Mail size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{cliente.correo}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Facturación */}
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                      Monto total
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight text-emerald-700">
                        ${total.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                      </span>
                      {((reserva.monto_descuento && Number(reserva.monto_descuento) > 0) ||
                        (reserva.monto_recargo && Number(reserva.monto_recargo) > 0)) && (
                        <span className="text-xs font-semibold text-slate-400 line-through">
                          $
                          {Number(
                            reserva.precio_original ||
                              total + Number(reserva.monto_descuento || 0) - Number(reserva.monto_recargo || 0),
                          ).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Wallet size={26} className="shrink-0 text-emerald-500 opacity-50" />
                </div>

                {reserva.monto_descuento && Number(reserva.monto_descuento) > 0 && (
                  <div className="mt-2.5 space-y-0.5 border-t border-emerald-200/60 pt-2 text-xs">
                    <p className="flex items-center justify-between font-semibold text-emerald-800">
                      <span>Descuento aplicado</span>
                      <span>-${Number(reserva.monto_descuento).toFixed(2)}</span>
                    </p>
                    {reserva.motivo_descuento && (
                      <p className="font-medium text-emerald-700/90">Motivo: “{reserva.motivo_descuento}”</p>
                    )}
                  </div>
                )}

                {reserva.monto_recargo && Number(reserva.monto_recargo) > 0 && (
                  <div className="mt-2.5 space-y-0.5 border-t border-emerald-200/60 pt-2 text-xs">
                    <p className="flex items-center justify-between font-semibold text-amber-800">
                      <span>Recargo adicional</span>
                      <span>+${Number(reserva.monto_recargo).toFixed(2)}</span>
                    </p>
                    {reserva.motivo_recargo && (
                      <p className="font-medium text-amber-700/90">Motivo: “{reserva.motivo_recargo}”</p>
                    )}
                  </div>
                )}
              </div>

              {/* Observaciones */}
              {reserva.observaciones && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Observaciones
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs font-medium text-slate-600">
                    {reserva.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 bg-white px-5 py-3.5 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
              {onDelete ? (
                <button
                  onClick={() => {
                    onClose()
                    onDelete()
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  type="button"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose()
                      onEdit()
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    type="button"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                )}
                {onPago && (
                  <button
                    onClick={() => {
                      onClose()
                      onPago()
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all active:scale-95",
                      esPagado
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-[#fd761a] text-white shadow-xs hover:opacity-95",
                    )}
                    type="button"
                  >
                    <CircleCheckBig size={14} />
                    {esPagado ? "Ver pagos" : "Registrar pago"}
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
