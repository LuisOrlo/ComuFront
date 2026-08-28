import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SchoolIcon, UserIcon, Money01Icon, Mail01Icon, CallIcon,
  IdentificationIcon, Clock01Icon, CheckmarkCircle04Icon, Edit01Icon,
  LibraryIcon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { type ReservaAula, type Aula } from "@/services/aulas.service"

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  reservado: { bg: "bg-blue-50 border-blue-200", color: "text-blue-700", label: "Reservado" },
  confirmado: { bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-700", label: "Confirmado" },
  en_progreso: { bg: "bg-amber-50 border-amber-200", color: "text-amber-700", label: "En progreso" },
  completado: { bg: "bg-gray-100 border-gray-200", color: "text-gray-600", label: "Completado" },
  cancelado: { bg: "bg-red-50 border-red-200", color: "text-red-600", label: "Cancelado" },
}

export function DetalleAulaModal({ isOpen, onClose, reserva, aula, onEdit, onPago }: {
  isOpen: boolean
  onClose: () => void
  reserva: ReservaAula | null
  aula?: Aula
  onEdit?: () => void
  onPago?: () => void
}) {
  if (!reserva) return null

  const estado = ESTADO_STYLES[reserva.estado] || ESTADO_STYLES.reservado
  const isPersona = !!reserva.persona_id
  const cliente = reserva.persona || reserva.cliente_externo
  const clienteNombre = cliente ? `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() : "—"

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl z-10"
          >
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div>
                <h2 className="text-xl font-black tracking-tight" style={{ color: COLORS.CHARCOAL }}>Detalle de Alquiler</h2>
                <p className="text-xs font-semibold opacity-40 mt-0.5">Información completa de la reserva</p>
              </div>
              <button onClick={onClose} className="size-9 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {/* Header Aula */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-indigo-600 shrink-0">
                  <HugeiconsIcon icon={SchoolIcon} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-500">Aula Reservada</p>
                  <p className="text-base font-black truncate" style={{ color: COLORS.CHARCOAL }}>{aula?.nombre || "Aula —"}</p>
                  {aula?.capacidad && (
                    <p className="text-[11px] font-semibold opacity-50">Capacidad: {aula.capacidad} personas</p>
                  )}
                </div>
                <span className={cn("px-3 py-1 rounded-xl text-xs font-extrabold uppercase border shrink-0", estado.bg, estado.color)}>
                  {estado.label}
                </span>
              </div>

              {/* Grid Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest opacity-40">Fecha de Alquiler</p>
                  <p className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>
                    {new Date(reserva.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest opacity-40">Horario</p>
                  <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="opacity-40" />
                    {reserva.hora_inicio?.substring(0, 5)} – {reserva.hora_fin?.substring(0, 5)}
                  </p>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-40">Cliente</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold",
                    isPersona ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    <HugeiconsIcon icon={isPersona ? UserIcon : LibraryIcon} size={11} />
                    {isPersona ? "Cliente Interno" : "Cliente Externo"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-extrabold" style={{ color: COLORS.CHARCOAL }}>{clienteNombre}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 text-xs">
                  {cliente?.cedula && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <HugeiconsIcon icon={IdentificationIcon} size={14} className="opacity-40" />
                      <span>{cliente.cedula}</span>
                    </div>
                  )}
                  {cliente?.celular && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <HugeiconsIcon icon={CallIcon} size={14} className="opacity-40" />
                      <span>{cliente.celular}</span>
                    </div>
                  )}
                  {cliente?.correo && (
                    <div className="flex items-center gap-2 text-gray-600 col-span-full truncate">
                      <HugeiconsIcon icon={Mail01Icon} size={14} className="opacity-40 shrink-0" />
                      <span className="truncate">{cliente.correo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle Financiero */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">Monto Total</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-emerald-700">${Number(reserva.precio_total || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}</p>
                      {reserva.monto_descuento && Number(reserva.monto_descuento) > 0 && (
                        <span className="text-xs text-gray-400 line-through font-semibold">
                          ${(Number(reserva.precio_original || Number(reserva.precio_total) + Number(reserva.monto_descuento))).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                  <HugeiconsIcon icon={Money01Icon} size={32} className="text-emerald-500 opacity-40 shrink-0" />
                </div>

                {reserva.monto_descuento && Number(reserva.monto_descuento) > 0 && (
                  <div className="pt-2 border-t border-emerald-200/60 text-xs space-y-0.5">
                    <p className="font-bold text-emerald-800 flex items-center justify-between">
                      <span>Descuento aplicado:</span>
                      <span>-${Number(reserva.monto_descuento).toFixed(2)}</span>
                    </p>
                    {reserva.motivo_descuento && (
                      <p className="text-emerald-700 font-medium opacity-90">
                        <span className="font-bold">Motivo:</span> "{reserva.motivo_descuento}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Observaciones si existen */}
              {reserva.observaciones && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest opacity-40">Observaciones</p>
                  <p className="text-xs font-medium opacity-70 whitespace-pre-wrap">{reserva.observaciones}</p>
                </div>
              )}
            </div>

            {/* Acciones del Modal */}
            <div className="p-4 border-t bg-gray-50/50 flex items-center justify-end gap-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit() }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border bg-white text-xs font-bold transition-all hover:bg-gray-50 active:scale-95"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                >
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                  Editar
                </button>
              )}
              {onPago && (() => {
                const esPagado = reserva.cuenta_por_cobrar?.estado === 'pagado' || Number(reserva.cuenta_por_cobrar?.saldo_pendiente ?? (reserva.precio_total - (reserva.cuenta_por_cobrar?.monto_abonado ?? 0))) <= 0
                return (
                  <button
                    onClick={() => { onClose(); onPago() }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95",
                      esPagado ? "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100" : "text-white hover:opacity-90"
                    )}
                    style={esPagado ? {} : { backgroundColor: COLORS.ACCENT }}
                  >
                    <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                    {esPagado ? "Ver pagos" : "Registrar Pago"}
                  </button>
                )
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
