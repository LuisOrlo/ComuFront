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
  Download04Icon,
} from "@hugeicons/core-free-icons"
import { agendaService, type AgendaEvent, type AgendaEventParams, type TipoDisponible } from "@/services/agenda.service"
import { AgendaFilterRibbon } from "./components/AgendaFilterRibbon"
import { AgendaDrawer, type DaySelection } from "./components/AgendaDrawer"
import { AgendaWeekView } from "./components/AgendaWeekView"
import { AgendaListView } from "./components/AgendaListView"
import { AgendaDayView } from "./components/AgendaDayView"
import { toast } from "sonner"
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  MONTHS,
  getEventStyles,
  getWeekDays,
  getWeekNumber,
  toLocalDateStr,
  type MacroCategoria,
  isAcademicType,
  isServiceType,
} from "./utils"

const VIEWS = [
  { key: "dayGridMonth", label: "Mes" },
  { key: "timeGridWeek", label: "Semana" },
  { key: "timeGridDay", label: "Día" },
  { key: "listWeek", label: "Lista" },
]

export function AgendaPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [macroCategory, setMacroCategory] = useState<MacroCategoria>("todos")
  const [activeTypes, setActiveTypes] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<TipoDisponible[]>([])
  const [currentRawEvents, setCurrentRawEvents] = useState<AgendaEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const [selectedDay, setSelectedDay] = useState<DaySelection | null>(null)
  const [currentView, setCurrentView] = useState("dayGridMonth")
  const [currentTitle, setCurrentTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const [activeDate, setActiveDate] = useState<Date>(new Date())

  // Criterio unificado de filtrado: Macro-categoría + Píldoras activas
  const matchesFilter = useCallback(
    (ev: AgendaEvent) => {
      if (macroCategory === "academico" && !isAcademicType(ev.tipo_evento)) return false
      if (macroCategory === "servicios" && !isServiceType(ev.tipo_evento)) return false
      if (activeTypes.length > 0 && !activeTypes.includes(ev.tipo_evento)) return false
      return true
    },
    [macroCategory, activeTypes]
  )

  // Eventos filtrados para el día activo en la vista Día
  const activeDayStr = useMemo(() => toLocalDateStr(activeDate), [activeDate])
  const activeDayEvents = useMemo(() => {
    return currentRawEvents
      .filter((ev) => ev.fecha === activeDayStr && matchesFilter(ev))
      .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))
  }, [currentRawEvents, activeDayStr, matchesFilter])

  // Días y eventos calculados para la semana activa (Semana y Lista)
  const weekDays = useMemo(() => {
    const baseDays = getWeekDays(activeDate)
    return baseDays.map((day) => {
      const dayEvents = currentRawEvents
        .filter((ev) => ev.fecha === day.dateStr && matchesFilter(ev))
        .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))

      return {
        ...day,
        events: dayEvents,
      }
    })
  }, [activeDate, currentRawEvents, matchesFilter])


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

  // Conteo de eventos por macro-categoría (Todos, Académico, Servicios)
  const countsByMacro = useMemo(() => {
    let academico = 0
    let servicios = 0
    for (const ev of currentRawEvents) {
      if (isAcademicType(ev.tipo_evento)) academico++
      else if (isServiceType(ev.tipo_evento)) servicios++
    }
    return {
      todos: currentRawEvents.length,
      academico,
      servicios,
    }
  }, [currentRawEvents])

  const handleMacroCategoryChange = useCallback((newMacro: MacroCategoria) => {
    setMacroCategory(newMacro)
    setActiveTypes([])
  }, [])

  const handleToggleType = useCallback((tipo: string) => {
    setActiveTypes((prev) => {
      if (prev.includes(tipo)) {
        const next = prev.filter((t) => t !== tipo)
        return next
      }
      return [...prev, tipo]
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setActiveTypes([])
  }, [])

  // Refetch en FullCalendar cuando cambian los filtros
  useEffect(() => {
    calendarRef.current?.getApi()?.refetchEvents()
  }, [macroCategory, activeTypes])

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
        const response = await agendaService.getAllEvents(params as AgendaEventParams)
        setCurrentRawEvents(response.data)
        setAvailableTypes(response.tipos_disponibles)

        const filteredData = response.data.filter(matchesFilter)

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
        console.error("FullCalendar events fetch error:", err)
        setLoadError("No se pudieron cargar los eventos de este período.")
        failureCallback(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      }
    },
    [activeTypes, matchesFilter]
  )

  // Manejar clic en un evento específico: abre el drawer con su detalle
  const handleEventClick = useCallback((arg: EventClickArg) => {
    const props = arg.event.extendedProps as AgendaEvent
    setSelectedDay(null)
    setSelectedEvent(props)
  }, [])

  // Manejar clic en un día del calendario: abre el drawer con los eventos de ese día
  const handleDateClick = useCallback(
    (arg: { date: Date; dateStr: string }) => {
      setActiveDate(arg.date)
      const dayEvents = currentRawEvents.filter((ev) => ev.fecha === arg.dateStr && matchesFilter(ev))

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
    [currentRawEvents, matchesFilter]
  )

  const handleExportPDF = useCallback(async () => {
    setExporting(true)
    try {
      const api = calendarRef.current?.getApi()
      const view = api?.view
      const start = view?.activeStart ? new Date(view.activeStart) : null
      const end = view?.activeEnd ? new Date(view.activeEnd.getTime() - 86400000) : null

      if (!start || !end) throw new Error("Sin rango visible")

      const vista =
        currentView === "dayGridMonth"
          ? "mes"
          : currentView === "timeGridDay"
            ? "dia"
            : currentView === "listWeek"
              ? "lista"
              : "semana"
      const titulo =
        activeTypes.length === 0
          ? "AGENDA GENERAL"
          : `AGENDA DE ${activeTypes.map((t) => EVENT_TYPE_LABELS[t] || t.replace("CLASE_", "")).join(" - ")}`

      const tipoStr =
        activeTypes.length > 0 ? activeTypes.map((t) => t.replace("CLASE_", "")).join("_") : "GENERAL"
      const rango =
        start.getTime() === end.getTime()
          ? toLocalDateStr(start)
          : `${toLocalDateStr(start)}_A_${toLocalDateStr(end)}`
      const fileName = `AGENDA_${vista.toUpperCase()}_${tipoStr.toUpperCase()}_${rango}.pdf`

      const blob = await agendaService.downloadPDF({
        vista,
        fecha_inicio: toLocalDateStr(start),
        fecha_fin: toLocalDateStr(end),
        titulo,
        tipos: activeTypes.length > 0 ? activeTypes : undefined,
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

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

  // Renderizado personalizado del contenido de cada evento en FullCalendar
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const ev = eventInfo.event.extendedProps as AgendaEvent
    const styles = getEventStyles(ev.tipo_evento)
    const timeText = eventInfo.timeText

    return (
      <div
        className="w-full px-2 py-1 rounded-lg flex flex-col gap-0.5 overflow-hidden transition-all hover:scale-[1.01] shadow-2xs cursor-pointer border-l-[3.5px]"
        style={{
          backgroundColor: styles.bg,
          borderLeftColor: styles.color,
          color: styles.text,
        }}
      >
        <div className="flex items-center justify-between gap-1 leading-none">
          {timeText && (
            <span className="text-[10px] font-extrabold tracking-tight" style={{ color: styles.color }}>
              {timeText}
            </span>
          )}
          {["CLASE_CURSO", "CURSO", "CURSO_PERSONALIZADO"].includes(ev.tipo_evento) && (
            <span className="text-[9px] font-bold uppercase opacity-80">{ev.tipo_label}</span>
          )}
        </div>
        <span className="text-[11px] font-bold truncate leading-tight">
          {eventInfo.event.title}
        </span>
      </div>
    )
  }, [])

  // Texto del período visible según la vista activa
  const periodLabel =
    currentView === "timeGridDay"
      ? new Intl.DateTimeFormat("es-EC", {
          weekday: "short",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(activeDate)
      : currentView === "timeGridWeek" || currentView === "listWeek"
        ? `Semana ${getWeekNumber(activeDate)} · ${weekDays[0]?.dayNumber || ""} al ${weekDays[6]?.dayNumber || ""} de ${MONTHS[activeDate.getMonth()]?.toLowerCase()} de ${activeDate.getFullYear()}`
        : currentTitle || "Calendario"

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-slate-50/50">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* HEADER & TOOLBAR PRINCIPAL */}
          <header className="space-y-3">
            {/* Nivel 1: título + acción global */}
            <div className="flex items-start justify-between gap-3 sm:items-center">
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Agenda General
                </h1>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  Vista Unificada
                </span>
                <span className="flex size-4 shrink-0 items-center justify-center" aria-live="polite">
                  {loading && (
                    <span className="size-4 animate-spin rounded-full border-2 border-orange-200 border-t-[#fd761a]" />
                  )}
                </span>
              </div>

              <button
                onClick={handleExportPDF}
                disabled={exporting}
                aria-busy={exporting}
                aria-label="Exportar PDF"
                title="Exportar PDF"
                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:scale-[1.02] hover:bg-slate-50 active:scale-95 disabled:opacity-50 sm:px-3.5"
              >
                <HugeiconsIcon icon={Download04Icon} size={16} className="text-slate-500" />
                <span className="hidden sm:inline">{exporting ? "Exportando..." : "Exportar PDF"}</span>
              </button>
            </div>

            {/* Nivel 2: controles del calendario */}
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-2xs sm:flex-row sm:items-center">
              {/* Navegación temporal + período actual */}
              <div className="flex min-w-0 items-center gap-2 sm:flex-1">
                <div
                  role="group"
                  aria-label="Navegación por período"
                  className="flex shrink-0 items-center gap-0.5 rounded-lg bg-slate-50 p-0.5"
                >
                  <button
                    onClick={() => handleNavigate("prev")}
                    aria-label="Período anterior"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-slate-800 hover:shadow-2xs"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </button>
                  <button
                    onClick={() => handleNavigate("today")}
                    aria-label="Ir a hoy"
                    className="flex h-8 cursor-pointer items-center justify-center rounded-md px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-white hover:text-slate-900 hover:shadow-2xs"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => handleNavigate("next")}
                    aria-label="Período siguiente"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-slate-800 hover:shadow-2xs"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-1.5 px-1">
                  <HugeiconsIcon icon={Calendar03Icon} size={16} className="shrink-0 text-[#fd761a]" />
                  <span
                    className="truncate text-sm font-bold text-slate-800 first-letter:uppercase"
                    aria-live="polite"
                    title={periodLabel}
                  >
                    {periodLabel}
                  </span>
                </div>
              </div>

              <span className="hidden h-5 w-px shrink-0 bg-slate-200 sm:block" aria-hidden="true" />

              {/* Selector de vistas */}
              <div
                role="group"
                aria-label="Vista del calendario"
                className="flex w-full items-center gap-0.5 rounded-lg bg-slate-50 p-0.5 sm:w-auto sm:shrink-0"
              >
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
                    className={`h-8 flex-1 cursor-pointer rounded-md px-3 text-xs font-bold transition-all sm:flex-none sm:px-3.5 ${
                      currentView === view.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* CINTA DE FILTROS POR MACRO-CATEGORÍA Y CATEGORÍA (de code.html) */}
          <AgendaFilterRibbon
            macroCategory={macroCategory}
            onMacroCategoryChange={handleMacroCategoryChange}
            activeTypes={activeTypes}
            tipos={availableTypes}
            countsByType={countsByType}
            countsByMacro={countsByMacro}
            onToggle={handleToggleType}
            onClearAll={handleClearAll}
            periodTitle={currentTitle}
          />

          {/* SECCIÓN PRINCIPAL DEL CALENDARIO (Ocupa el 100% de ancho) */}
          <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-3 sm:p-5" id="agenda-calendar-container">
            {/* VISTA DÍA DEDICADA (de code.html) */}
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

            {/* VISTA SEMANA DEDICADA (de code.html líneas 424-507) */}
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

            {/* VISTA LISTA DEDICADA (de code.html líneas 539-579) */}
            {currentView === "listWeek" && (
              <AgendaListView
                weekDays={weekDays}
                onSelectEvent={(ev) => {
                  setSelectedDay(null)
                  setSelectedEvent(ev)
                }}
              />
            )}

            {/* FULLCALENDAR PARA VISTA MES (Permanece montado para mes y exportación PDF) */}
            <div className={currentView === "dayGridMonth" ? "block" : "hidden"}>
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
                  min-height: 105px !important;
                  padding: 4px !important;
                  transition: background-color 0.15s ease;
                  cursor: pointer;
                }
                .fc .fc-daygrid-day-frame:hover {
                  background-color: #f8fafc;
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
                noEventsContent="No hay actividades registradas para este período."
              />
            </div>

            {loadError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800" role="alert">
                {loadError}
              </div>
            )}

            {/* CONVENCIONES DE COLOR AL PIE DEL CALENDARIO (de code.html líneas 581-590) */}
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

      {/* PANEL LATERAL DESPLEGABLE (DRAWER SUPERPUESTO POR ENCIMA) */}
      <AgendaDrawer
        event={selectedEvent}
        daySelection={selectedDay}
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
