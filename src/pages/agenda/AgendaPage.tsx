import { useState, useCallback, useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import type { EventClickArg } from "@fullcalendar/core"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { agendaService, type AgendaEvent } from "@/services/agenda.service"
import { AgendaLegend } from "./components/AgendaLegend"
import { EventDetailModal } from "./components/EventDetailModal"
import { toast } from "sonner"

const VIEWS = [
  { key: "dayGridMonth", label: "Mes", icon: Calendar03Icon },
  { key: "timeGridWeek", label: "Semana", icon: Calendar03Icon },
  { key: "timeGridDay", label: "Día", icon: Calendar03Icon },
  { key: "listWeek", label: "Lista", icon: Calendar03Icon },
]

export function AgendaPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [activeTypes, setActiveTypes] = useState<string[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const [currentView, setCurrentView] = useState("dayGridMonth")
  const [currentTitle, setCurrentTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleToggleType = useCallback((tipo: string) => {
    setActiveTypes((prev) => {
      if (prev.includes(tipo)) {
        const next = prev.filter((t) => t !== tipo)
        return next.length === 0 ? [] : next
      }
      return [...prev, tipo]
    })
  }, [])

  const fetchEvents = useCallback(
    async ({ start, end }: { start: Date; end: Date }, successCallback: (events: object[]) => void, failureCallback: (error: Error) => void) => {
      setLoading(true)
      try {
        const fechaInicio = start.toISOString().split("T")[0]
        const fechaFin = end.toISOString().split("T")[0]
        const params: Record<string, unknown> = { fecha_inicio: fechaInicio, fecha_fin: fechaFin, per_page: 500 }
        if (activeTypes.length > 0) {
          params.tipos = activeTypes
        }
        const response = await agendaService.getEvents(params as Parameters<typeof agendaService.getEvents>[0])
        const fullCalendarEvents = response.data.map((event) => {
          const startDate = new Date(`${event.fecha}T${event.hora_inicio}`)
          const endDate = new Date(`${event.fecha}T${event.hora_fin}`)
          return {
            id: event.id,
            title: event.titulo,
            start: startDate,
            end: endDate,
            allDay: false,
            backgroundColor: event.color,
            borderColor: event.color,
            textColor: "#ffffff",
            extendedProps: { ...event },
          }
        })
        successCallback(fullCalendarEvents)
        setLoading(false)
      } catch (err) {
        console.error("FullCalendar events fetch error:", err)
        failureCallback(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      }
    },
    [activeTypes],
  )

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const props = arg.event.extendedProps as AgendaEvent
    setSelectedEvent(props)
  }, [])

  const handleExportPDF = useCallback(async () => {
    setExporting(true)
    try {
      const calApi = calendarRef.current?.getApi()
      const view = calApi?.view
      let fechaInicio: string | undefined
      let fechaFin: string | undefined

      if (view) {
        fechaInicio = view.activeStart.toISOString().split("T")[0]
        fechaFin = view.activeEnd.toISOString().split("T")[0]
      }

      const blob = await agendaService.downloadPDF({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tipos: activeTypes.length > 0 ? activeTypes : undefined,
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `agenda_${fechaInicio ?? "general"}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("PDF exportado correctamente")
    } catch {
      toast.error("Error al exportar PDF")
    } finally {
      setExporting(false)
    }
  }, [activeTypes])

  const handleNavigate = useCallback((dir: "prev" | "next" | "today") => {
    const calApi = calendarRef.current?.getApi()
    if (!calApi) return
    if (dir === "today") {
      calApi.today()
    } else if (dir === "prev") {
      calApi.prev()
    } else {
      calApi.next()
    }
  }, [])

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)]">
      {/* HEADER */}
      <header className="shrink-0 px-4 py-3 border-b bg-white flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
            Agenda General
          </h1>
          {loading && (
            <div className="animate-spin rounded-full size-4 border-2 border-t-transparent" style={{ borderColor: COLORS.ACCENT, borderTopColor: "transparent" }} />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AgendaLegend activeTypes={activeTypes} onToggle={handleToggleType} />

          <div className="flex items-center gap-1 rounded-xl border p-0.5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <button
              onClick={() => handleNavigate("prev")}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            </button>
            <button
              onClick={() => handleNavigate("today")}
              className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: COLORS.CHARCOAL }}
            >
              Hoy
            </button>
            <button
              onClick={() => handleNavigate("next")}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>

          <span className="hidden md:inline text-sm font-bold px-2" style={{ color: COLORS.CHARCOAL }}>
            {currentTitle}
          </span>

          <div className="flex items-center gap-1 rounded-xl border p-0.5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {VIEWS.map((view) => (
              <button
                key={view.key}
                onClick={() => {
                  setCurrentView(view.key)
                  calendarRef.current?.getApi()?.changeView(view.key)
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                style={{
                  backgroundColor: currentView === view.key ? COLORS.CHARCOAL : "transparent",
                  color: currentView === view.key ? "white" : COLORS.TEXT_MUTED,
                }}
              >
                {view.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            <HugeiconsIcon icon={Download04Icon} size={14} />
            <span className="hidden sm:inline">{exporting ? "Exportando..." : "PDF"}</span>
          </button>
        </div>
      </header>

      {/* CALENDAR */}
      <div className="flex-1 overflow-hidden p-2 sm:p-4">
        <div className="h-full bg-white rounded-2xl overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}>
          <style>{`
            .fc {
              font-family: inherit;
              --fc-border-color: ${COLORS.BORDER_SUBTLE};
              --fc-today-bg-color: ${COLORS.ACCENT}12;
              --fc-neutral-bg-color: oklch(0.98 0 0);
              --fc-page-bg-color: #ffffff;
              --fc-button-bg-color: transparent;
              --fc-button-border-color: ${COLORS.BORDER_SUBTLE};
              --fc-button-text-color: ${COLORS.CHARCOAL};
              --fc-button-active-bg-color: ${COLORS.CHARCOAL};
              --fc-button-active-text-color: #ffffff;
              --fc-event-bg-color: ${COLORS.ACCENT};
              --fc-event-border-color: ${COLORS.ACCENT};
            }
            .fc .fc-toolbar {
              display: none !important;
            }
            .fc .fc-col-header-cell {
              padding: 10px 4px !important;
              font-size: 11px !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.05em !important;
              color: ${COLORS.TEXT_MUTED} !important;
              background-color: oklch(0.985 0 0) !important;
              border-bottom-width: 1px !important;
            }
            .fc .fc-timegrid-slot {
              height: 40px !important;
            }
            .fc .fc-timegrid-slot-label {
              font-size: 10px !important;
              font-weight: 600 !important;
              color: ${COLORS.TEXT_MUTED} !important;
            }
            .fc .fc-event {
              border-radius: 8px !important;
              padding: 4px 6px !important;
              font-size: 11px !important;
              font-weight: 600 !important;
              border: none !important;
              cursor: pointer !important;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
            }
            .fc .fc-event:hover {
              opacity: 0.9;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            }
            .fc .fc-daygrid-event {
              border-radius: 6px !important;
              padding: 2px 5px !important;
              font-size: 10px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            .fc .fc-day-today {
              background-color: ${COLORS.ACCENT}08 !important;
            }
            .fc .fc-scrollgrid {
              border-radius: 0 !important;
            }
            .fc .fc-list-event {
              cursor: pointer !important;
            }
            .fc .fc-list-event:hover td {
              background-color: oklch(0.97 0 0) !important;
            }
            .fc-theme-standard td, .fc-theme-standard th {
              border-color: ${COLORS.BORDER_SUBTLE} !important;
            }
          `}</style>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={currentView}
            headerToolbar={false}
            events={fetchEvents}
            eventClick={handleEventClick}
            datesSet={(arg) => setCurrentTitle(arg.view.title)}
            height="100%"
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            nowIndicator={true}
            lazyFetching={false}
            locale="es"
            firstDay={1}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            views={{
              dayGridMonth: {
                titleFormat: { year: "numeric", month: "long" },
              },
              timeGridWeek: {
                titleFormat: { year: "numeric", month: "long", day: "numeric" },
                slotDuration: "00:30:00",
              },
              timeGridDay: {
                titleFormat: { year: "numeric", month: "long", day: "numeric", weekday: "long" },
                slotDuration: "00:30:00",
              },
              listWeek: {
                titleFormat: { year: "numeric", month: "long", day: "numeric" },
              },
            }}
            noEventsContent="No hay eventos en este período"
          />
        </div>
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
