import { useState, useCallback, useRef, useEffect } from "react"
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
import { cursosService } from "@/services/cursos.service"
import { AgendaLegend } from "./components/AgendaLegend"
import { EventDetailModal } from "./components/EventDetailModal"
import { exportToPDF } from "@/lib/pdf-export"
import { toast } from "sonner"
import {
  MONTHS,
  EVENT_TYPE_LABELS,
  formatDay,
  formatDayMonth,
  formatDayMonthYear,
  buildCardScheduleElement,
} from "./utils"

const VIEWS = [
  { key: "dayGridMonth", label: "Mes", icon: Calendar03Icon },
  { key: "timeGridWeek", label: "Semana", icon: Calendar03Icon },
  { key: "timeGridDay", label: "Día", icon: Calendar03Icon },
  { key: "listWeek", label: "Lista", icon: Calendar03Icon },
]

export function AgendaPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [activeTypes, setActiveTypes] = useState<string[]>([])
  const [activeCatalogs, setActiveCatalogs] = useState<string[]>([])
  const [catalogs, setCatalogs] = useState<{id: string, nombre: string}[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const [currentView, setCurrentView] = useState("dayGridMonth")
  const [currentTitle, setCurrentTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    cursosService.getCatalogos(undefined, 1, { per_page: 100 }).then(res => setCatalogs(res.data))
  }, [])

  const handleToggleType = useCallback((tipo: string) => {
    setActiveTypes((prev) => {
      if (prev.includes(tipo)) {
        const next = prev.filter((t) => t !== tipo)
        if (tipo === 'CLASE_CURSO') setActiveCatalogs([]) // Reset si se quita curso
        return next.length === 0 ? [] : next
      }
      return [...prev, tipo]
    })
  }, [])

  const handleToggleCatalog = useCallback((catalogId: string) => {
    setActiveCatalogs((prev) => {
      if (prev.includes(catalogId)) {
        return prev.filter((c) => c !== catalogId)
      }
      return [...prev, catalogId]
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
        if (activeCatalogs.length > 0) {
            params.catalogos = activeCatalogs
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
    [activeTypes, activeCatalogs],
  )

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const props = arg.event.extendedProps as AgendaEvent
    setSelectedEvent(props)
  }, [])

  const handleExportPDF = useCallback(async () => {
    setExporting(true)
    try {
      const api = calendarRef.current?.getApi()
      const view = api?.view
      const start = view?.activeStart ? new Date(view.activeStart) : null
      const end = view?.activeEnd ? new Date(view.activeEnd.getTime() - 86400000) : null

      const title = activeTypes.length === 0
        ? 'AGENDA GENERAL'
        : `AGENDA DE ${activeTypes.map(t => EVENT_TYPE_LABELS[t] || t.replace('CLASE_', '')).join(' - ')}`

      let subtitle = ''
      if (start && end) {
        if (currentView === 'dayGridMonth') {
          if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            subtitle = `${formatDay(start)} - ${formatDay(end)} DE ${MONTHS[end.getMonth()]}`
          } else {
            subtitle = `${formatDayMonth(start)} - ${formatDayMonth(end)}`
          }
        } else if (currentView === 'timeGridDay') {
          subtitle = formatDayMonthYear(start)
        } else {
          if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            subtitle = `${formatDay(start)} - ${formatDayMonth(end)}`
          } else {
            subtitle = `${formatDayMonth(start)} - ${formatDayMonth(end)}`
          }
        }
      }

      const tipoStr = activeTypes.length > 0 
        ? activeTypes.map(t => t.replace('CLASE_', '')).join('_') 
        : 'GENERAL'
      const fileName = `AGENDA_${tipoStr.toUpperCase()}`

      const isWeekOrDay = currentView === 'timeGridWeek' || currentView === 'timeGridDay'

      if (isWeekOrDay) {
        const events = api?.getEvents() ?? []
        const viewStart = view?.activeStart
        const viewEnd = view?.activeEnd

        if (viewStart && viewEnd) {
          const scheduleEl = buildCardScheduleElement(
            events.map(ev => ({
              start: ev.start,
              end: ev.end,
              title: ev.title,
              backgroundColor: ev.backgroundColor,
            })),
            viewStart,
            viewEnd
          )

          document.body.appendChild(scheduleEl)
          try {
            await exportToPDF('agenda-card-schedule', fileName, { title, subtitle, titleColor: COLORS.ACCENT })
          } finally {
            scheduleEl.remove()
          }
        }
      } else {
        await exportToPDF('agenda-calendar-container', fileName, { title, subtitle, titleColor: COLORS.ACCENT, viewType: currentView })
      }

      toast.success("PDF exportado correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Error al exportar PDF")
    } finally {
      setExporting(false)
    }
  }, [activeTypes, currentView])

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
    <div className="flex flex-col h-[calc(100dvh-56px)] overflow-y-auto">
      {/* HEADER */}
      <header className="shrink-0 px-4 py-3 border-b bg-white flex flex-col gap-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
                Agenda General
              </h1>
              {loading && (
                <div className="animate-spin rounded-full size-4 border-2 border-t-transparent" style={{ borderColor: COLORS.ACCENT, borderTopColor: "transparent" }} />
              )}
            </div>

            <div className="flex items-center gap-2">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={Download04Icon} size={14} />
                <span className="hidden sm:inline">{exporting ? "Exportando..." : "PDF"}</span>
              </button>
            </div>
        </div>
        
        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          <AgendaLegend activeTypes={activeTypes} onToggle={handleToggleType} />
          {activeTypes.includes('CLASE_CURSO') && (
            <div className="flex items-center gap-1 border-l pl-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-xs font-bold" style={{ color: COLORS.TEXT_MUTED }}>Catálogos:</span>
                {catalogs.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => handleToggleCatalog(cat.id)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${activeCatalogs.includes(cat.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {cat.nombre}
                    </button>
                ))}
            </div>
          )}
        </div>
      </header>

      {/* CALENDAR */}
      <div className="flex-1 p-2 sm:p-4" id="agenda-calendar-container">
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
            height="auto"
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
