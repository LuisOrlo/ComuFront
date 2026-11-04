import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Video,
  User,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  IdCard,
  Mail,
  Phone,
  X,
} from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { ReservaSet, SetItem } from "@/services/sets.service"

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  reservado: { bg: "bg-blue-50 border-blue-200", color: "text-blue-700", label: "Reservado" },
  confirmado: { bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-700", label: "Confirmado" },
  en_progreso: { bg: "bg-amber-50 border-amber-200", color: "text-amber-700", label: "En progreso" },
  completado: { bg: "bg-gray-100 border-gray-200", color: "text-gray-600", label: "Completado" },
  cancelado: { bg: "bg-red-50 border-red-200", color: "text-red-600", label: "Cancelado" },
}

interface Props {
  isOpen: boolean
  onClose: () => void
  reserva: ReservaSet | null
  set?: SetItem
  onEdit?: () => void
  onPago?: () => void
  onDelete?: () => void
  onEstadoChange?: (id: string, nuevoEstado: ReservaSet["estado"]) => Promise<void> | void
}

export function DetalleSetModal({
  isOpen,
  onClose,
  reserva,
  set,
  onEdit,
  onPago,
  onDelete,
  onEstadoChange,
}: Props) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!reserva) return null

  const estado = ESTADO_STYLES[reserva.estado] || ESTADO_STYLES.reservado
  const cliente = reserva.persona || reserva.cliente_externo
  const clienteNombre = cliente ? `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() : "—"

  const handleEstadoSelect = async (nuevoEstado: ReservaSet["estado"]) => {
    if (!reserva || !onEstadoChange || reserva.estado === nuevoEstado) return
    setIsUpdating(true)
    try {
      await onEstadoChange(reserva.id, nuevoEstado)
    } finally {
      setIsUpdating(false)
    }
  }

  const cuenta = reserva.cuenta_por_cobrar
  const total = Number(reserva.precio_total || 0)
  const abonado = Number(cuenta?.monto_abonado || 0)
  const saldo = cuenta ? Number(cuenta.saldo_pendiente ?? (total - abonado)) : total
  const esPagado = cuenta?.estado === "pagado" || saldo <= 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden z-10 border"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            {/* Header */}
            <div
              className="p-5 border-b flex justify-between items-center bg-slate-50/50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detalle de Alquiler de Set</h3>
                <p className="text-xs text-slate-500">Información de la reserva y estado de cuenta</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Card Set */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-11 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                    <Video size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">Set Reservado</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{set?.nombre || reserva.set?.nombre || "Set"}</p>
                    <p className="text-[11px] text-slate-500">${Number(set?.precio_hora || reserva.set?.precio_hora || 0).toFixed(2)}/hora</p>
                  </div>
                </div>

                {/* Inline Status Changer Badge */}
                {onEstadoChange ? (
                  <div className="relative shrink-0">
                    <select
                      value={reserva.estado}
                      onChange={(e) => handleEstadoSelect(e.target.value as ReservaSet["estado"])}
                      disabled={isUpdating}
                      className={cn(
                        "appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-extrabold uppercase border outline-none cursor-pointer transition-all shadow-2xs",
                        estado.bg,
                        estado.color,
                        isUpdating && "opacity-50 pointer-events-none"
                      )}
                      title="Cambiar estado de la reserva"
                    >
                      <option value="reservado">Reservado</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="en_progreso">En progreso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    {isUpdating ? (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 size-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[10px]">▼</span>
                    )}
                  </div>
                ) : (
                  <span className={cn("px-3 py-1 rounded-xl text-xs font-extrabold uppercase border shrink-0", estado.bg, estado.color)}>
                    {estado.label}
                  </span>
                )}
              </div>

              {/* Grid Fecha y Horario */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha de Alquiler</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {new Date(reserva.fecha_reserva + "T00:00:00").toLocaleDateString("es-EC", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Horario de Uso</p>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Clock size={14} className="text-slate-400" />
                    {reserva.hora_inicio?.substring(0, 5)} – {reserva.hora_fin?.substring(0, 5)}
                  </p>
                </div>
              </div>

              {/* Cliente */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Responsable / Cliente</p>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{clienteNombre}</p>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                      {cliente?.cedula && (
                        <span className="flex items-center gap-1">
                          <IdCard size={12} />
                          {cliente.cedula}
                        </span>
                      )}
                      {cliente?.celular && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {cliente.celular}
                        </span>
                      )}
                      {cliente?.correo && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {cliente.correo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Finanzas */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Estado Financiero</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Total</span>
                    <span className="text-xs font-black text-slate-900">${total.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <span className="text-[10px] text-emerald-600 block">Abonado</span>
                    <span className="text-xs font-black text-emerald-700">${abonado.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <span className="text-[10px] text-amber-600 block">Saldo</span>
                    <span className="text-xs font-black text-amber-700">${saldo.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {reserva.observaciones && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Observaciones</span>
                  <p className="text-slate-700 whitespace-pre-wrap">{reserva.observaciones}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div
              className="p-4 border-t bg-slate-50/50 flex items-center justify-end gap-2"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onEdit()
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                >
                  <Pencil size={14} />
                  <span>Editar</span>
                </button>
              )}

              {onPago && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onPago()
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95",
                    esPagado
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                      : "text-white bg-[#fd761a] hover:opacity-90"
                  )}
                >
                  <CheckCircle2 size={14} />
                  <span>{esPagado ? "Ver pagos" : "Registrar Pago"}</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onDelete()
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition active:scale-95"
                >
                  <Trash2 size={14} />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
