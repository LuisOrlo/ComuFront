import type { AgendaEvent } from "@/services/agenda.service"

const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  CLASE_CURSO: { label: "Curso", color: "#6366f1" },
  TALLER: { label: "Taller", color: "#f59e0b" },
  ALQUILER_AULA: { label: "Aula", color: "#10b981" },
  PODCAST: { label: "Podcast", color: "#ec4899" },
  STREAMING: { label: "Streaming", color: "#06b6d4" },
  ASESORIA: { label: "Asesoría", color: "#8b5cf6" },
}

export function getEventColor(event: AgendaEvent): string {
  return EVENT_TYPES[event.tipo_evento]?.color ?? "#6b7280"
}

export function getEventLabel(event: AgendaEvent): string {
  return EVENT_TYPES[event.tipo_evento]?.label ?? event.tipo_evento
}

export function getEventTypeColor(tipo: string): string {
  return EVENT_TYPES[tipo]?.color ?? "#6b7280"
}

export function getEventTypeLabel(tipo: string): string {
  return EVENT_TYPES[tipo]?.label ?? tipo
}
