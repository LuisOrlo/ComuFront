import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Microphone, UserIcon, Money01Icon, Mail01Icon, CallIcon,
  IdentificationIcon, Clock01Icon, Tick02Icon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import type { ReservaPodcast } from "@/services/podcast.service"

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-700 border-green-200" },
  en_progreso: { label: "En progreso", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completado: { label: "Completado", color: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
}

function fmtHora(h: string) { return h.substring(0, 5) }

export function DetalleReservaModal({ isOpen, onClose, reserva }: {
  isOpen: boolean
  onClose: () => void
  reserva: ReservaPodcast | null
}) {
  return (
    <AnimatePresence>
      {isOpen && reserva && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div>
                <h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Detalle de Reserva</h2>
                <p className="text-xs font-medium opacity-40 mt-0.5">Información completa de la reserva</p>
              </div>
              <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {reserva.paquete && (
                <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <HugeiconsIcon icon={Microphone} size={22} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{reserva.paquete.nombre}</p>
                    <p className="text-[10px] font-medium opacity-50">${reserva.paquete.precio_por_hora}/hr · {reserva.paquete.items?.length || 0} ítems</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fecha</p>
                  <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{new Date(reserva.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Horario</p>
                  <p className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="opacity-40" />
                    {fmtHora(reserva.hora_inicio)} — {fmtHora(reserva.hora_fin)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Tipo</p>
                  <div className="flex items-center gap-2">
                    {reserva.persona_id ? (
                      <><HugeiconsIcon icon={UserIcon} size={16} className="text-indigo-500" /><span className="text-sm font-bold text-indigo-600">Uso Interno</span></>
                    ) : (
                      <><HugeiconsIcon icon={Money01Icon} size={16} className="text-emerald-500" /><span className="text-sm font-bold text-emerald-600">Cliente Externo</span></>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio</p>
                  <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>${Number(reserva.precio_total).toFixed(2)}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estado</p>
                <div className="flex items-center gap-2">
                  <span className={cn("inline-block px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border", ESTADO_LABELS[reserva.estado]?.color || "bg-gray-100")}>
                    {ESTADO_LABELS[reserva.estado]?.label || reserva.estado}
                  </span>
                  {reserva.pago_registrado && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                      <HugeiconsIcon icon={Tick02Icon} size={10} /> Pagado
                    </span>
                  )}
                </div>
              </div>
              {reserva.notas && (
                <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Notas</p>
                  <p className="text-xs font-medium" style={{ color: COLORS.CHARCOAL }}>{reserva.notas}</p>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-gray-50 space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Responsable</p>
                {reserva.persona ? (
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-indigo-600" /></div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{reserva.persona.nombres} {reserva.persona.apellidos}</p>
                      {reserva.persona.correo && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={Mail01Icon} size={10} />{reserva.persona.correo}</p>}
                    </div>
                  </div>
                ) : reserva.cliente_externo ? (
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-emerald-600" /></div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{reserva.cliente_externo.nombres} {reserva.cliente_externo.apellidos}</p>
                      <div className="flex flex-wrap gap-x-3">
                        {reserva.cliente_externo.cedula && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={IdentificationIcon} size={10} />{reserva.cliente_externo.cedula}</p>}
                        {reserva.cliente_externo.correo && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={Mail01Icon} size={10} />{reserva.cliente_externo.correo}</p>}
                        {reserva.cliente_externo.celular && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={CallIcon} size={10} />{reserva.cliente_externo.celular}</p>}
                      </div>
                    </div>
                  </div>
                ) : <p className="text-xs opacity-30 italic">No especificado</p>}

                {reserva.asignaciones && reserva.asignaciones.length > 0 && (
                  <div className="pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Personal a cargo</p>
                    <div className="flex flex-wrap gap-2">
                      {reserva.asignaciones.map(a => (
                        <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200">
                          <div className="size-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                            {a.persona ? `${a.persona.nombres[0]}${a.persona.apellidos[0]}` : "?"}
                          </div>
                          <span className="text-[11px] font-bold text-violet-700">{a.persona?.nombres} {a.persona?.apellidos}</span>
                          {a.rol && <span className="text-[9px] font-medium text-violet-400 bg-violet-100/50 px-1.5 py-0.5 rounded">{a.rol}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-5 bg-gray-50 border-t flex justify-end" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <button onClick={onClose} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cerrar</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
