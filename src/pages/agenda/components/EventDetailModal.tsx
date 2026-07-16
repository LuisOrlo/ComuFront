import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Cancel01Icon,
  Clock01Icon,
  UserIcon,
  Home02Icon,
  Calendar03Icon,
  SignalIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { type AgendaEvent, type AgendaEventDetail, agendaService } from "@/services/agenda.service"
import { getEventColor, getEventLabel } from "@/pages/agenda/utils"
import { toast } from "sonner"

function formatTime(time: string) {
  if (!time) return "—"
  return time.substring(0, 5)
}

function formatDate(date: string) {
  if (!date) return "—"
  return new Date(date + "T00:00:00").toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function estadoBadge(estado: string | null) {
  if (!estado) return null
  const colors: Record<string, { bg: string; text: string }> = {
    pendiente: { bg: "#fef3c7", text: "#92400e" },
    confirmado: { bg: "#d1fae5", text: "#065f46" },
    activo: { bg: "#d1fae5", text: "#065f46" },
    abierto: { bg: "#d1fae5", text: "#065f46" },
    en_curso: { bg: "#d1fae5", text: "#065f46" },
    completado: { bg: "#dbeafe", text: "#1e40af" },
    cancelado: { bg: "#fee2e2", text: "#991b1b" },
    reservado: { bg: "#ede9fe", text: "#5b21b6" },
  }
  const c = colors[estado] ?? { bg: COLORS.BORDER_SUBTLE, text: COLORS.TEXT_MUTED }
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {estado.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
    </span>
  )
}

export function EventDetailModal({
  event,
  onClose,
}: {
  event: AgendaEvent
  onClose: () => void
}) {
  const [detail, setDetail] = useState<AgendaEventDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (event.tipo_evento && event.referencia_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true)
      agendaService
        .getEventDetail(event.tipo_evento, event.referencia_id)
        .then(setDetail)
        .catch(() => toast.error("Error al cargar detalle"))
        .finally(() => setLoading(false))
    }
  }, [event.tipo_evento, event.referencia_id])

  const data = detail ?? event
  const color = getEventColor(data)

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
              style={{ backgroundColor: color }}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={20} style={{ color: "white" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold pr-6" style={{ color: COLORS.CHARCOAL }}>
                {data.tipo_evento === "CLASE_CURSO" && data.nombre_instancia
                  ? `Clase: ${data.nombre_instancia}`
                  : data.titulo}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                {getEventLabel(data)}
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

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: color }} />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoField icon={Clock01Icon} label="Horario" value={`${formatTime(data.hora_inicio)} – ${formatTime(data.hora_fin)}`} />
              <InfoField icon={Calendar03Icon} label="Fecha" value={formatDate(data.fecha)} />
              <InfoField icon={UserIcon} label="Instructor" value={data.instructor_nombre ?? "—"} />
              {data.tipo_evento !== "CLASE_CURSO" && data.tipo_evento !== "TALLER" && (
                <InfoField icon={Home02Icon} label="Aula" value={data.aula_nombre ?? "—"} />
              )}
              <InfoField icon={SignalIcon} label="Modalidad" value={data.modalidad ?? "—"} />
              <InfoField icon={UserGroupIcon} label="Participantes" value={data.participantes_count != null ? String(data.participantes_count) : "—"} />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold" style={{ color: COLORS.TEXT_MUTED }}>Estado:</span>
              {estadoBadge(data.estado)}
            </div>

            {data.detalle && (
              <div>
                <h4 className="text-xs font-bold mb-1.5" style={{ color: COLORS.CHARCOAL }}>Detalles adicionales</h4>
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  {Object.entries(data.detalle).map(([key, value]) => (
                    value != null && (
                      <div key={key} className="text-xs flex gap-2">
                        <span className="font-bold capitalize" style={{ color: COLORS.CHARCOAL }}>
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span style={{ color: COLORS.TEXT_MUTED }}>
                          {typeof value === "boolean" ? (value ? "Sí" : "No") : String(value)}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <HugeiconsIcon icon={icon} size={14} style={{ color: COLORS.TEXT_MUTED, marginTop: 1 }} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
          {label}
        </p>
        <p className="text-xs font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>
          {value}
        </p>
      </div>
    </div>
  )
}
