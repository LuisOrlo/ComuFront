import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  Money01Icon,
  UserIcon,
  UserGroupIcon,
  NoteIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

const ESTADO_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  reservado: { label: "Pendiente", bg: "#fef3c7", text: "#92400e" },
  confirmado: { label: "Confirmado", bg: "#d1fae5", text: "#065f46" },
  en_progreso: { label: "En progreso", bg: "#dbeafe", text: "#1e40af" },
  completado: { label: "Finalizado", bg: "#f3f4f6", text: "#6b7280" },
  cancelado: { label: "Cancelado", bg: "#fee2e2", text: "#991b1b" },
}

function formatDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
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

  const fields: { icon: IconSvgElement; label: string; value: string }[] = [
    { icon: Calendar03Icon, label: "Fecha", value: formatDate(reserva.fecha_reserva) },
    { icon: Clock01Icon, label: "Horario", value: `${reserva.hora_inicio.substring(0, 5)} – ${reserva.hora_fin.substring(0, 5)}` },
    { icon: Money01Icon, label: "Tarifa", value: `${reserva.tarifa?.nombre || "—"} ($${(reserva.tarifa?.precio_por_hora ?? 0).toFixed(2)}/h)` },
    { icon: Money01Icon, label: "Total", value: `$${reserva.precio_total.toFixed(2)}` },
    { icon: UserIcon, label: "Responsable", value: reserva.persona ? `${reserva.persona.nombres} ${reserva.persona.apellidos}` : reserva.cliente_externo?.nombres || "—" },
    { icon: UserGroupIcon, label: "Operador", value: reserva.incluye_operador && reserva.operador ? `${reserva.operador.nombres} ${reserva.operador.apellidos}` : reserva.incluye_operador ? "Sin asignar" : "No requiere" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
        style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
      >
        <div className="p-5 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-start gap-3">
            <div
              className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: estilo.bg }}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={20} style={{ color: estilo.text }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold pr-6" style={{ color: COLORS.CHARCOAL }}>
                Detalle de Reserva
              </h2>
              <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                Reserva de espacio de radio
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-5 right-5 size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold"
              style={{ backgroundColor: estilo.bg, color: estilo.text }}
            >
              {estilo.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {fields.map((field, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <HugeiconsIcon icon={field.icon} size={14} style={{ color: COLORS.TEXT_MUTED, marginTop: 2 }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                    {field.label}
                  </p>
                  <p className="text-xs font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>
                    {field.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {reserva.observaciones && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="flex items-start gap-2.5">
                <HugeiconsIcon icon={NoteIcon} size={14} style={{ color: COLORS.TEXT_MUTED, marginTop: 2 }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.TEXT_MUTED }}>
                    Observaciones
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.CHARCOAL }}>
                    {reserva.observaciones}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ReservaRadio {
  id: string
  estado: string
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
  precio_total: number
  observaciones?: string
  incluye_operador: boolean
  tarifa?: { nombre: string; precio_por_hora: number }
  persona?: { nombres: string; apellidos: string }
  cliente_externo?: { nombres: string }
  operador?: { nombres: string; apellidos: string }
}
