import { X } from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Clock01Icon, Money01Icon, UserIcon, UserGroupIcon, NoteIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { ReservaRadio } from "@/services/radio.service"

const ESTADO_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  reservado: { label: "Pendiente", bg: "bg-orange-100", text: "text-orange-700" },
  confirmado: { label: "Confirmado", bg: "bg-emerald-100", text: "text-emerald-700" },
  en_progreso: { label: "En progreso", bg: "bg-blue-100", text: "text-blue-700" },
  completado: { label: "Finalizado", bg: "bg-gray-100", text: "text-gray-500" },
  cancelado: { label: "Cancelado", bg: "bg-red-100", text: "text-red-600" },
}

export function DetalleReservaModal({
  isOpen,
  onClose,
  reserva,
}: {
  isOpen: boolean
  onClose: () => void
  reserva: ReservaRadio | null
}) {
  if (!isOpen || !reserva) return null

  const estilo = ESTADO_STYLES[reserva.estado] || ESTADO_STYLES.reservado

  const items = [
    { icon: Calendar03Icon, label: "Fecha", value: new Date(reserva.fecha_reserva + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
    { icon: Clock01Icon, label: "Horario", value: `${reserva.hora_inicio.substring(0, 5)} – ${reserva.hora_fin.substring(0, 5)}` },
    { icon: Money01Icon, label: "Tarifa", value: `${reserva.tarifa?.nombre || "—"} ($${reserva.tarifa?.precio_por_hora.toFixed(2) || "0"}/h)` },
    { icon: Money01Icon, label: "Total", value: `$${reserva.precio_total.toFixed(2)}` },
    { icon: UserIcon, label: "Responsable", value: reserva.persona ? `${reserva.persona.nombres} ${reserva.persona.apellidos}` : reserva.cliente_externo?.nombres || "—" },
    { icon: UserGroupIcon, label: "Operador", value: reserva.incluye_operador && reserva.operador ? `${reserva.operador.nombres} ${reserva.operador.apellidos}` : reserva.incluye_operador ? "Sin asignar" : "No requiere" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
              Detalle de Reserva
            </h2>
            <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", estilo.bg, estilo.text)}>
              {estilo.label}
            </span>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <HugeiconsIcon icon={item.icon} size={14} className="opacity-50" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-40">{item.label}</p>
                <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{item.value}</p>
              </div>
            </div>
          ))}

          {reserva.observaciones && (
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <HugeiconsIcon icon={NoteIcon} size={14} className="opacity-50" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-40">Observaciones</p>
                <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>{reserva.observaciones}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold border transition-all hover:bg-white"
            style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
