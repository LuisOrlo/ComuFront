import type { AgendaEvent } from "@/services/agenda.service"

const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  CLASE_CURSO: { label: "Curso", color: "#6366f1" },
  TALLER: { label: "Taller", color: "#f59e0b" },
  ALQUILER_AULA: { label: "Aula", color: "#10b981" },
  PODCAST: { label: "Podcast", color: "#ec4899" },
  STREAMING: { label: "Streaming", color: "#06b6d4" },
  ASESORIA: { label: "Asesoría", color: "#8b5cf6" },
}

export const DAYS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
export const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CLASE_CURSO: 'CURSO',
  TALLER: 'TALLER',
  ALQUILER_AULA: 'AULA',
  PODCAST: 'PODCAST',
  STREAMING: 'STREAMING',
  ASESORIA: 'ASESORÍA',
}

export function formatDay(date: Date): string {
  return `${DAYS[date.getDay()]} ${date.getDate()}`
}

export function formatDayMonth(date: Date): string {
  return `${DAYS[date.getDay()]} ${date.getDate()} DE ${MONTHS[date.getMonth()]}`
}

export function formatDayMonthYear(date: Date): string {
  return `${DAYS[date.getDay()]} ${date.getDate()} DE ${MONTHS[date.getMonth()]} DE ${date.getFullYear()}`
}

interface CardEvent {
  start: Date | null
  end: Date | null
  title: string
  backgroundColor?: string
}

export function buildCardScheduleElement(
  events: CardEvent[],
  viewStart: Date,
  viewEnd: Date
): HTMLDivElement {
  const container = document.createElement('div')
  container.id = 'agenda-card-schedule'
  container.style.cssText = 'padding:16px;background:#fff;font-family:Arial,sans-serif;'

  const daysInRange: Date[] = []
  const d = new Date(viewStart)
  while (d < viewEnd) {
    daysInRange.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }

  for (const day of daysInRange) {
    const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    const dayEvents = events
      .filter(ev => {
        if (!ev.start) return false
        const ek = `${ev.start.getFullYear()}-${String(ev.start.getMonth() + 1).padStart(2, '0')}-${String(ev.start.getDate()).padStart(2, '0')}`
        return ek === dayKey
      })
      .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))

    const dayHeader = document.createElement('div')
    dayHeader.style.cssText = 'font-size:14px;font-weight:700;color:#333;margin:12px 0 8px;padding-bottom:4px;border-bottom:2px solid #e5e7eb;text-transform:uppercase;letter-spacing:0.5px;'
    dayHeader.textContent = formatDayMonthYear(day)
    container.appendChild(dayHeader)

    if (dayEvents.length === 0) {
      const empty = document.createElement('div')
      empty.style.cssText = 'font-size:12px;color:#9ca3af;padding:8px 0;text-align:center;'
      empty.textContent = 'Sin eventos'
      container.appendChild(empty)
    } else {
      for (const ev of dayEvents) {
        const card = document.createElement('div')
        const color = ev.backgroundColor || '#6366f1'
        card.style.cssText = 'display:flex;align-items:stretch;margin-bottom:6px;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);'

        const bar = document.createElement('div')
        bar.style.cssText = `width:5px;flex-shrink:0;background:${color};`
        card.appendChild(bar)

        const body = document.createElement('div')
        body.style.cssText = 'flex:1;padding:10px 14px;background:#fafafa;'

        const timeEl = document.createElement('div')
        timeEl.style.cssText = 'font-size:13px;font-weight:700;color:#333;margin-bottom:2px;'
        const fmt = (dt: Date) => `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
        timeEl.textContent = ev.start && ev.end ? `${fmt(ev.start)} - ${fmt(ev.end)}` : ev.start ? fmt(ev.start) : ''
        body.appendChild(timeEl)

        const name = document.createElement('div')
        name.style.cssText = 'font-size:12px;color:#555;'
        name.textContent = ev.title
        body.appendChild(name)

        card.appendChild(body)
        container.appendChild(card)
      }
    }
  }

  return container
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
