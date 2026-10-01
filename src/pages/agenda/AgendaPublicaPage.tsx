import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import type { EventClickArg, EventContentArg } from "@fullcalendar/core"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import {
  agendaPublicaService,
  type AgendaEvent,
  type AgendaEventParams,
  type TipoDisponible,
} from "@/services/agenda.service"
import { AgendaFilterRibbon } from "./components/AgendaFilterRibbon"
import { AgendaDrawer, type DaySelection } from "./components/AgendaDrawer"
import { AgendaWeekView } from "./components/AgendaWeekView"
import { AgendaListView } from "./components/AgendaListView"
import { AgendaDayView } from "./components/AgendaDayView"
import {
  EVENT_TYPES,
  MONTHS,
  getEventStyles,
  getWeekDays,
  getWeekNumber,
  toLocalDateStr,
} from "./utils"

const VIEWS = [
  { key: "dayGridMonth", label: "Mes" },
  { key: "timeGridWeek", label: "Semana" },
  { key: "timeGridDay", label: "Día" },
  { key: "listWeek", label: "Lista" },
]

export function AgendaPublicaPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [activeTypes, setActiveTypes] = useState<string[]>([])
  const [eventCount, setEventCount] = useState(0)
  const [availableTypes, setAvailableTypes] = useState<TipoDisponible[]>([])
  const [currentRawEvents, setCurrentRawEvents] = useState<AgendaEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const [selectedDay, setSelectedDay] = useState<DaySelection | null>(null)
  const [currentView, setCurrentView] = useState("dayGridMonth")
  const [currentTitle, setCurrentTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [activeDate, setActiveDate] = useState<Date>(new Date())

  // Eventos filtrados para el día activo en la vista Día
  const activeDayStr = useMemo(() => toLocalDateStr(activeDate), [activeDate])
  const activeDayEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return currentRawEvents
      .filter((ev) => {
        if (ev.fecha !== activeDayStr) return false
        if (activeTypes.length > 0 && !activeTypes.includes(ev.tipo_evento)) return false
        if (!query) return true
        return (
          ev.titulo?.toLowerCase().includes(query) ||
          ev.instructor_nombre?.toLowerCase().includes(query) ||
          ev.aula_nombre?.toLowerCase().includes(query) ||
          ev.nombre_instancia?.toLowerCase().includes(query) ||
          ev.ciudad_nombre?.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))
  }, [currentRawEvents, activeDayStr, search, activeTypes])

  // Días y eventos calculados para la semana activa (Semana y Lista)
  const weekDays = useMemo(() => {
    const baseDays = getWeekDays(activeDate)
    const query = search.trim().toLowerCase()

    return baseDays.map((day) => {
      const dayEvents = currentRawEvents
        .filter((ev) => {
          if (ev.fecha !== day.dateStr) return false
          if (activeTypes.length > 0 && !activeTypes.includes(ev.tipo_evento)) return false
          if (!query) return true
          return (
            ev.titulo?.toLowerCase().includes(query) ||
            ev.instructor_nombre?.toLowerCase().includes(query) ||
            ev.aula_nombre?.toLowerCase().includes(query) ||
            ev.nombre_instancia?.toLowerCase().includes(query) ||
            ev.ciudad_nombre?.toLowerCase().includes(query)
          )
        })
        .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))

      return {
        ...day,
        events: dayEvents,
      }
    })
  }, [activeDate, currentRawEvents, search, activeTypes])

  // Redimensionar FullCalendar al volver a la vista Mes
  useEffect(() => {
    if (currentView === "dayGridMonth") {
      const timer = setTimeout(() => {
        calendarRef.current?.getApi()?.updateSize()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [currentView])

  // Conteo de eventos por tipo en el período visible
  const countsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const ev of currentRawEvents) {
      counts[ev.tipo_evento] = (counts[ev.tipo_evento] || 0) + 1
    }
    return counts
  }, [currentRawEvents])

  const handleToggleType = useCallback((tipo: string) => {
    setActiveTypes((prev) => {
      if (prev.includes(tipo)) {
        return prev.filter((t) => t !== tipo)
      }
      return [...prev, tipo]
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setActiveTypes([])
  }, [])

  // Refetch en FullCalendar cuando cambian los tipos activos o la búsqueda
  useEffect(() => {
    calendarRef.current?.getApi()?.refetchEvents()
  }, [activeTypes, search])

  const fetchEvents = useCallback(
    async (
      { start, end }: { start: Date; end: Date },
      successCallback: (events: object[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      setLoading(true)
      setLoadError(null)
      try {
        const fechaInicio = toLocalDateStr(start)
        const fechaFin = toLocalDateStr(end)
        const params: Record<string, unknown> = {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          per_page: 500,
        }
        if (activeTypes.length > 0) {
          params.tipos = activeTypes
        }
        const response = await agendaPublicaService.getAllEvents(params as AgendaEventParams)
        setCurrentRawEvents(response.data)
        setAvailableTypes(response.tipos_disponibles)

        // Filtrado por texto si hay búsqueda rápida
        const query = search.trim().toLowerCase()
        const filteredData = query
          ? response.data.filter((ev) => {
              return (
                ev.titulo?.toLowerCase().includes(query) ||
                ev.instructor_nombre?.toLowerCase().includes(query) ||
                ev.aula_nombre?.toLowerCase().includes(query) ||
                ev.nombre_instancia?.toLowerCase().includes(query) ||
                ev.ciudad_nombre?.toLowerCase().includes(query)
              )
            })
          : response.data

        setEventCount(filteredData.length)

        const fullCalendarEvents = filteredData.map((event) => {
          const startDate = new Date(`${event.fecha}T${event.hora_inicio}`)
          const endDate = new Date(`${event.fecha}T${event.hora_fin}`)
          const styles = getEventStyles(event.tipo_evento)

          return {
            id: event.id,
            title: ["CLASE_CURSO", "CURSO", "CURSO_PERSONALIZADO"].includes(event.tipo_evento) && event.nombre_instancia
              ? event.nombre_instancia
              : event.titulo,
            start: startDate,
            end: endDate,
            allDay: false,
            backgroundColor: styles.bg,
            borderColor: styles.border,
            textColor: styles.text,
            extendedProps: { ...event },
          }
        })

        successCallback(fullCalendarEvents)
        setLoading(false)
      } catch (err) {
        console.error("FullCalendar public events fetch error:", err)
        setLoadError("No se pudieron cargar los eventos de este período.")
        failureCallback(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      }
    },
    [activeTypes, search]
  )

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const props = arg.event.extendedProps as AgendaEvent
    setSelectedDay(null)
    setSelectedEvent(props)
  }, [])

  const handleDateClick = useCallback(
    (arg: { date: Date; dateStr: string }) => {
      setActiveDate(arg.date)
      const dayEvents = currentRawEvents.filter((ev) => ev.fecha === arg.dateStr)

      if (dayEvents.length === 1) {
        setSelectedDay(null)
        setSelectedEvent(dayEvents[0])
      } else {
        setSelectedEvent(null)
        setSelectedDay({
          date: arg.date,
          dateStr: arg.dateStr,
          events: dayEvents,
        })
      }
    },
    [currentRawEvents]
  )

  const handleNavigate = useCallback((dir: "prev" | "next" | "today") => {
    const calApi = calendarRef.current?.getApi()
    if (!calApi) return

    if (dir === "today") {
      const today = new Date()
      setActiveDate(today)
      calApi.today()
      calApi.gotoDate(today)
    } else if (currentView === "timeGridDay") {
      setActiveDate((prev) => {
        const next = new Date(prev)
        next.setDate(next.getDate() + (dir === "prev" ? -1 : 1))
        calApi.gotoDate(next)
        return next
      })
    } else if (currentView === "timeGridWeek" || currentView === "listWeek") {
      setActiveDate((prev) => {
        const next = new Date(prev)
        next.setDate(next.getDate() + (dir === "prev" ? -7 : 7))
        calApi.gotoDate(next)
        return next
      })
    } else {
      if (dir === "prev") {
        calApi.prev()
      } else {
        calApi.next()
      }
      const currentStart = calApi.view.currentStart || calApi.view.activeStart
      if (currentStart) {
        setActiveDate(currentStart)
      }
    }
  }, [currentView])

  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const ev = eventInfo.event.extendedProps as AgendaEvent
    const styles = getEventStyles(ev.tipo_evento)
    const timeText = eventInfo.timeText

    return (
      <div
        className="w-full px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg flex flex-col gap-0.5 overflow-hidden transition-all hover:scale-[1.01] shadow-2xs cursor-pointer border-l-2 sm:border-l-[3.5px]"
        style={{
          backgroundColor: styles.bg,
          borderLeftColor: styles.color,
          color: styles.text,
        }}
      >
        <div className="flex items-center justify-between gap-1 leading-none">
          {timeText && (
            <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight truncate" style={{ color: styles.color }}>
              {timeText}
            </span>
          )}
          {["CLASE_CURSO", "CURSO", "CURSO_PERSONALIZADO"].includes(ev.tipo_evento) && (
            <span className="hidden sm:inline-block text-[9px] font-bold uppercase opacity-80">{ev.tipo_label}</span>
          )}
        </div>
        <span className="text-[10px] sm:text-[11px] font-bold truncate leading-tight">
          {eventInfo.event.title}
        </span>
      </div>
    )
  }, [])

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50/60 selection:bg-orange-100 selection:text-[#fd761a]">
      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
          {/* HEADER & TOOLBAR PRINCIPAL */}
          <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Cronograma de Actividades
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0">
                  Acceso Libre
                </span>
                {loading && (
                  <div className="size-4 rounded-full border-2 border-orange-200 border-t-[#fd761a] animate-spin ml-1" />
                )}
              </div>
            </div>

            {/* CONTROLES DE FECHA Y SELECTOR DE VISTAS */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 sm:gap-2.5 w-full xl:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                {/* Navegación temporal: < Hoy > */}
                <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs gap-0.5 shrink-0">
                  <button
                    onClick={() => handleNavigate("prev")}
                    aria-label="Período anterior"
                    className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </button>
                  <button
                    onClick={() => handleNavigate("today")}
                    aria-label="Ir a hoy"
                    className="px-2.5 sm:px-3 h-8 flex items-center justify-center text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => handleNavigate("next")}
                    aria-label="Período siguiente"
                    className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </div>

                {/* Título de Mes/Período Actual */}
                <div className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2 px-3 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-slate-800 min-w-0">
                  <HugeiconsIcon icon={Calendar03Icon} size={18} className="text-[#fd761a] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold capitalize truncate">
                    {currentView === "timeGridDay"
                      ? new Intl.DateTimeFormat("es-EC", { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(activeDate)
                      : currentView === "timeGridWeek" || currentView === "listWeek"
                        ? `Semana ${getWeekNumber(activeDate)} · ${weekDays[0]?.dayNumber || ""} al ${weekDays[6]?.dayNumber || ""} de ${MONTHS[activeDate.getMonth()]?.toLowerCase()} de ${activeDate.getFullYear()}`
                        : currentTitle || "Calendario"}
                  </span>
                </div>
              </div>

              {/* Selector de Vistas: Mes | Semana | Día | Lista */}
              <div className="grid grid-cols-4 sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-0.5 w-full sm:w-auto">
                {VIEWS.map((view) => (
                  <button
                    key={view.key}
                    onClick={() => {
                      setCurrentView(view.key)
                      const calApi = calendarRef.current?.getApi()
                      if (calApi) {
                        calApi.changeView(view.key)
                        calApi.gotoDate(activeDate)
                      }
                    }}
                    aria-label={`Vista de ${view.label.toLowerCase()}`}
                    aria-pressed={currentView === view.key}
                    className={`px-2 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      currentView === view.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* CINTA DE FILTROS POR CATEGORÍA Y BUSCADOR */}
          <AgendaFilterRibbon
            activeTypes={activeTypes}
            tipos={availableTypes}
            eventCount={eventCount}
            countsByType={countsByType}
            search={search}
            onSearchChange={setSearch}
            onToggle={handleToggleType}
            onClearAll={handleClearAll}
            periodTitle={currentTitle}
          />

          {/* SECCIÓN PRINCIPAL DEL CALENDARIO */}
          <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-2 sm:p-5" id="agenda-publica-calendar-container">
            {/* VISTA DÍA DEDICADA */}
            {currentView === "timeGridDay" && (
              <AgendaDayView
                activeDate={activeDate}
                activeDayEvents={activeDayEvents}
                onSelectEvent={(ev) => {
                  setSelectedDay(null)
                  setSelectedEvent(ev)
                }}
              />
            )}

            {/* VISTA SEMANA DEDICADA */}
            {currentView === "timeGridWeek" && (
              <AgendaWeekView
                weekDays={weekDays}
                activeDate={activeDate}
                onSelectEvent={(ev) => {
                  setSelectedDay(null)
                  setSelectedEvent(ev)
                }}
                onSelectDay={(date, dateStr, events) => {
                  setActiveDate(date)
                  if (events.length === 1) {
                    setSelectedDay(null)
                    setSelectedEvent(events[0])
                  } else {
                    setSelectedEvent(null)
                    setSelectedDay({
                      date,
                      dateStr,
                      events,
                    })
                  }
                }}
              />
            )}

            {/* VISTA LISTA DEDICADA */}
            {currentView === "listWeek" && (
              <AgendaListView
                weekDays={weekDays}
                onSelectEvent={(ev) => {
                  setSelectedDay(null)
                  setSelectedEvent(ev)
                }}
              />
            )}

            {/* FULLCALENDAR PARA VISTA MES */}
            <div className={`${currentView === "dayGridMonth" ? "block" : "hidden"} overflow-x-auto sm:overflow-visible`}>
              <style>{`
                .fc {
                  font-family: inherit;
                  --fc-border-color: #f1f5f9;
                  --fc-today-bg-color: rgba(253, 118, 26, 0.04);
                  --fc-neutral-bg-color: #f8fafc;
                  --fc-page-bg-color: #ffffff;
                }
                .fc .fc-toolbar {
                  display: none !important;
                }
                .fc .fc-col-header-cell {
                  padding: 10px 4px !important;
                  font-size: 11px !important;
                  font-weight: 800 !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.06em !important;
                  color: #64748b !important;
                  background-color: #f8fafc !important;
                  border-bottom: 1px solid #e2e8f0 !important;
                  border-color: #e2e8f0 !important;
                }
                .fc .fc-daygrid-day-number {
                  font-size: 12px !important;
                  font-weight: 700 !important;
                  color: #334155 !important;
                  padding: 6px 8px !important;
                }
                .fc .fc-day-today {
                  background-color: rgba(253, 118, 26, 0.05) !important;
                }
                .fc .fc-day-today .fc-daygrid-day-number {
                  background-color: #fd761a !important;
                  color: #ffffff !important;
                  border-radius: 8px !important;
                  padding: 2px 7px !important;
                  font-weight: 800 !important;
                  box-shadow: 0 2px 6px rgba(253, 118, 26, 0.35) !important;
                }
                .fc .fc-daygrid-day-frame {
                  min-height: 95px !important;
                  padding: 3px !important;
                  transition: background-color 0.15s ease;
                  cursor: pointer;
                }
                .fc .fc-daygrid-day-frame:hover {
                  background-color: #f8fafc;
                }
                .fc .fc-daygrid-more-link {
                  font-size: 10px !important;
                  font-weight: 800 !important;
                  color: #fd761a !important;
                  background-color: rgba(253, 118, 26, 0.08) !important;
                  border-radius: 6px !important;
                  padding: 1px 5px !important;
                  margin-top: 2px !important;
                  display: inline-block !important;
                }
                .fc .fc-timegrid-slot {
                  height: 42px !important;
                }
                .fc .fc-timegrid-slot-label {
                  font-size: 11px !important;
                  font-weight: 700 !important;
                  color: #64748b !important;
                }
                .fc .fc-event {
                  border-radius: 8px !important;
                  border: none !important;
                  background: transparent !important;
                  padding: 0 !important;
                }
                .fc-theme-standard td, .fc-theme-standard th {
                  border-color: #e2e8f0 !important;
                }
                .fc .fc-scrollgrid {
                  border-radius: 12px !important;
                  overflow: hidden !important;
                  border: 1px solid #e2e8f0 !important;
                }
                .fc .fc-list-event {
                  cursor: pointer !important;
                }
                .fc .fc-list-event:hover td {
                  background-color: #f8fafc !important;
                }

                @media (max-width: 640px) {
                  .fc .fc-col-header-cell {
                    padding: 6px 1px !important;
                    font-size: 10px !important;
                    letter-spacing: 0 !important;
                  }
                  .fc .fc-daygrid-day-number {
                    font-size: 11px !important;
                    padding: 2px 4px !important;
                  }
                  .fc .fc-daygrid-day-frame {
                    min-height: 56px !important;
                    padding: 2px !important;
                  }
                  .fc .fc-day-today .fc-daygrid-day-number {
                    padding: 1px 5px !important;
                    border-radius: 6px !important;
                    font-size: 10px !important;
                  }
                  .fc .fc-daygrid-more-link {
                    font-size: 9px !important;
                    padding: 1px 3px !important;
                  }
                }
              `}</style>

              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={currentView}
                headerToolbar={false}
                events={fetchEvents}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                eventContent={renderEventContent}
                dayMaxEvents={3}
                moreLinkText={(n) => `+${n} más`}
                datesSet={(arg) => {
                  setCurrentTitle(arg.view.title)
                  if (currentView === "timeGridDay" && (arg.view.currentStart || arg.view.activeStart)) {
                    setActiveDate(arg.view.currentStart || arg.view.activeStart)
                  }
                }}
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
                    dayMaxEvents: 3,
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
                noEventsContent="No hay actividades programadas para este período."
              />
            </div>

            {loadError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800" role="alert">
                {loadError}
              </div>
            )}

            {/* CONVENCIONES DE COLOR */}
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-slate-100 px-2 text-xs font-semibold text-slate-500">
              <span className="font-bold text-slate-700">Convenciones de color:</span>
              {Object.entries(EVENT_TYPES).map(([key, item]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="capitalize">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* DRAWER ENRIQUECIDO DE DETALLES DEL EVENTO (MODO PÚBLICO) */}
      <AgendaDrawer
        event={selectedEvent}
        daySelection={selectedDay}
        isPublic={true}
        onClose={() => {
          setSelectedEvent(null)
          setSelectedDay(null)
        }}
        onSelectEvent={(ev) => {
          setSelectedEvent(ev)
        }}
      />
    </div>
  )
}
