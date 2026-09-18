import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Cancel01Icon,
  UserIcon,
  Home02Icon,
  Calendar03Icon,
  SignalIcon,
  UserGroupIcon,
  Link01Icon,
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

const DETALLE_LABELS: Record<string, string> = {
  modulo: "Módulo",
  observaciones: "Observaciones",
  descripcion: "Descripción",
  precio: "Precio",
  precio_total: "Precio total",
  abierto_externos: "Abierto a externos",
  notas_sesion: "Notas de sesión",
  cliente: "Cliente",
  aula_capacidad: "Capacidad del aula",
  aula_caracteristicas: "Características del aula",
}

function formatDetailValue(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (typeof value === "number" && key.includes("precio")) {
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value)
  }
  return String(value)
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
  const navigate = useNavigate()
  const [detail, setDetail] = useState<AgendaEventDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (event.tipo_evento && event.referencia_id) {

      setLoading(true)
      agendaService
        .getEventDetail(event.tipo_evento, event.referencia_id)
        .then(setDetail)
        .catch(() => toast.error("Error al cargar detalle"))
        .finally(() => setLoading(false))
    }
  }, [event.tipo_evento, event.referencia_id])

  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const data = detail ?? event
  const color = getEventColor(data)

  const cursoId = data.curso_id ?? (typeof data.detalle?.curso_id === "string" ? data.detalle.curso_id : null)

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="agenda-event-title">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl sm:top-4 sm:right-4 sm:h-[calc(100%-2rem)] sm:rounded-2xl"
        style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
      >
        <div className="border-b p-5 sm:p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, white)`, color }}>
                  {getEventLabel(data)}
                </span>
                {data.modalidad && <span className="rounded-md bg-[#e5eeff] px-2 py-1 text-[11px] font-semibold text-[#45464d]">{data.modalidad}</span>}
              </div>
              <h2 id="agenda-event-title" className="pr-8 text-xl font-bold leading-tight tracking-tight" style={{ color: COLORS.CHARCOAL }}>
                {data.titulo}
              </h2>
              {data.estado && <div className="mt-3 flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: color }} />{estadoBadge(data.estado)}</div>}
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar detalle del evento"
              className="shrink-0 size-8 flex items-center justify-center rounded-lg hover:bg-[#eff4ff] transition-colors"
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
          <div className="space-y-5 p-5 sm:p-6">
            <div className="space-y-4 rounded-xl bg-[#eff4ff] p-4">
              <InfoField icon={Calendar03Icon} label="Fecha y horario" value={`${formatDate(data.fecha)} · ${formatTime(data.hora_inicio)} – ${formatTime(data.hora_fin)}`} />
              {data.instructor_nombre && (
                <InfoField icon={UserIcon} label="Instructor" value={data.instructor_nombre} />
              )}
              {data.aula_nombre && (
                <InfoField icon={Home02Icon} label="Aula" value={data.aula_nombre} />
              )}
              {data.modalidad && (
                <InfoField icon={SignalIcon} label="Modalidad" value={data.modalidad} />
              )}
              {data.participantes_count != null && (
                <InfoField icon={UserGroupIcon} label="Participantes" value={String(data.participantes_count)} />
              )}
              {data.ciudad_nombre && (
                <InfoField icon={Home02Icon} label="Ciudad" value={data.ciudad_nombre} />
              )}
            </div>

            {data.capacidad_maxima != null && data.capacidad_maxima > 0 && data.participantes_count != null && (
              <div className="space-y-2 rounded-xl border p-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="flex items-center justify-between text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>
                  <span>Capacidad</span>
                  <span>{data.participantes_count} / {data.capacidad_maxima}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#e5eeff]">
                  <div className="h-full rounded-full" style={{ width: `${Math.min((data.participantes_count / data.capacidad_maxima) * 100, 100)}%`, backgroundColor: color }} />
                </div>
              </div>
            )}

            {data.detalle && (
              <div>
                <h4 className="text-xs font-bold mb-1.5" style={{ color: COLORS.CHARCOAL }}>Detalles adicionales</h4>
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  {Object.entries(data.detalle).map(([key, value]) => {
                    if (value == null || value === "") return null
                    const label = DETALLE_LABELS[key] ?? key.replace(/_/g, " ")
                    return (
                      <div key={key} className="text-xs flex gap-2">
                        <span
                          className={`font-bold ${DETALLE_LABELS[key] ? "" : "capitalize"}`}
                          style={{ color: COLORS.CHARCOAL }}
                        >
                          {label}:
                        </span>
                        <span style={{ color: COLORS.TEXT_MUTED }}>
                          {formatDetailValue(key, value)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {cursoId && (
              <button type="button" onClick={() => navigate(`/cursos/${cursoId}`)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#eff4ff] px-4 py-2.5 text-xs font-bold transition-colors hover:bg-[#e5eeff]" style={{ color: COLORS.CHARCOAL }}>
                <HugeiconsIcon icon={Link01Icon} size={16} />
                Ver curso
              </button>
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
