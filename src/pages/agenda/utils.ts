import type { AgendaEvent } from "@/services/agenda.service"

export const EVENT_TYPES: Record<string, { label: string; color: string; bg: string; text: string; border: string }> = {
  CLASE_CURSO: { label: "Curso", color: "#2563eb", bg: "#eff6ff", text: "#1e40af", border: "#3b82f6" },
  CURSO: { label: "Curso", color: "#2563eb", bg: "#eff6ff", text: "#1e40af", border: "#3b82f6" },
  CURSO_PERSONALIZADO: { label: "Curso personalizado", color: "#0f766e", bg: "#f0fdfa", text: "#115e59", border: "#14b8a6" },
  TALLER: { label: "Taller", color: "#9333ea", bg: "#faf5ff", text: "#6b21a8", border: "#a855f7" },
  ALQUILER_AULA: { label: "Alquiler Aula", color: "#059669", bg: "#ecfdf5", text: "#065f46", border: "#10b981" },
  PODCAST: { label: "Podcast", color: "#d97706", bg: "#fffbeb", text: "#92400e", border: "#f59e0b" },
  STREAMING: { label: "Streaming", color: "#e11d48", bg: "#fff1f2", text: "#9f1239", border: "#f43f5e" },
  ASESORIA: { label: "Asesoría", color: "#0891b2", bg: "#ecfeff", text: "#155e75", border: "#06b6d4" },
  RADIO: { label: "Radio", color: "#db2777", bg: "#fdf2f8", text: "#9d174d", border: "#ec4899" },
}

export const DAYS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
export const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CLASE_CURSO: 'CURSO',
  CURSO: 'CURSO',
  CURSO_PERSONALIZADO: 'CURSO PERSONALIZADO',
  TALLER: 'TALLER',
  ALQUILER_AULA: 'AULA',
  PODCAST: 'PODCAST',
  STREAMING: 'STREAMING',
  ASESORIA: 'ASESORÍA',
  RADIO: 'RADIO',
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

export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export interface WeekDayInfo {
  date: Date
  dateStr: string
  dayShort: string
  dayLong: string
  dayNumber: number
  isToday: boolean
}

export function getWeekDays(referenceDate: Date): WeekDayInfo[] {
  const d = new Date(referenceDate)
  const day = d.getDay() // 0 = Sunday, 1 = Monday, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.getFullYear(), d.getMonth(), diff)
  monday.setHours(0, 0, 0, 0)

  const todayStr = toLocalDateStr(new Date())
  const shortNames = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]
  const longNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  const result: WeekDayInfo[] = []
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday)
    current.setDate(monday.getDate() + i)
    const dateStr = toLocalDateStr(current)
    result.push({
      date: current,
      dateStr,
      dayShort: shortNames[i],
      dayLong: longNames[i],
      dayNumber: current.getDate(),
      isToday: dateStr === todayStr,
    })
  }
  return result
}

export function formatDuration(startStr?: string, endStr?: string): string {
  if (!startStr || !endStr) return ""
  const [sh, sm] = startStr.split(":").map(Number)
  const [eh, em] = endStr.split(":").map(Number)
  const diffMinutes = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0))
  if (diffMinutes <= 0) return ""
  const hours = diffMinutes / 60
  return hours % 1 === 0 ? `(${hours} ${hours === 1 ? "hora" : "horas"})` : `(${hours.toFixed(1)} horas)`
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
        const color = ev.backgroundColor || '#2563eb'
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

export function getEventStyles(tipoEvento: string) {
  return EVENT_TYPES[tipoEvento] ?? {
    label: tipoEvento?.replace(/_/g, ' ') || "Evento",
    color: "#64748b",
    bg: "#f8fafc",
    text: "#334155",
    border: "#94a3b8",
  }
}

export function getEventColor(event: AgendaEvent): string {
  return EVENT_TYPES[event.tipo_evento]?.color ?? event.color ?? "#64748b"
}

export function getEventLabel(event: AgendaEvent): string {
  if (event.tipo_evento === "CLASE_CURSO") return "Curso"
  return EVENT_TYPES[event.tipo_evento]?.label ?? event.tipo_label ?? event.tipo_evento
}

export function getEventTypeColor(tipo: string): string {
  return EVENT_TYPES[tipo]?.color ?? "#64748b"
}

export function getEventTypeLabel(tipo: string): string {
  if (tipo === "CLASE_CURSO") return "Curso"
  return EVENT_TYPES[tipo]?.label ?? tipo
}
