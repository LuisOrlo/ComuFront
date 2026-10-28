import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useNavigate } from "react-router"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventClickArg, EventContentArg } from "@fullcalendar/core"
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  ClipboardCheck,
  FileText,
} from "lucide-react"
import {
  instructorService,
  type InstructorClaseHorario,
  type InstructorClaseDetalle,
} from "@/services/instructor.service"
import {
  getWeekDays,
  getWeekNumber,
  MONTHS,
  toLocalDateStr,
} from "@/pages/agenda/utils"
import { toast } from "sonner"

const VIEWS = [
  { key: "timeGridWeek", label: "Semana" },
  { key: "dayGridMonth", label: "Mes" },
] as const

function formatFechaLarga(fechaStr: string): string {
  if (!fechaStr) return ""
  const [y, m, d] = fechaStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const texto = date.toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function calculateDuration(inicio: string, fin: string): string | null {
  if (!inicio || !fin) return null
  const [h1, m1] = inicio.split(":").map(Number)
  const [h2, m2] = fin.split(":").map(Number)
  if (isNaN(h1) || isNaN(h2)) return null
  const mins = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0))
  if (mins <= 0) return null
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hrs > 0 && remMins > 0) return `${hrs}h ${remMins}m`
  if (hrs > 0) return `${hrs} ${hrs === 1 ? "hora" : "horas"}`
  return `${remMins} min`
}

export function InstructorHorarioPage() {
  const navigate = useNavigate()
  const calendarRef = useRef<FullCalendar>(null)

  // Vistas: SEMANA por defecto como solicitado
  const [currentView, setCurrentView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek")
  const [activeDate, setActiveDate] = useState<Date>(() => new Date())
  const [currentMonthTitle, setCurrentMonthTitle] = useState("")

  // Clases del período visible y filtros dinámicos
  const [rawClases, setRawClases] = useState<InstructorClaseHorario[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null)

  // Estado para la vista móvil de la semana
  const [selectedMobileDateStr, setSelectedMobileDateStr] = useState<string>(() =>
    toLocalDateStr(new Date())
  )
  const [mobileWeekMode, setMobileWeekMode] = useState<"day" | "all">("day")

  // Estado del drawer de detalle de clase
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null)
  const [claseDetalle, setClaseDetalle] = useState<InstructorClaseDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Días de la semana actual
  const weekDays = useMemo(() => getWeekDays(activeDate), [activeDate])
  const weekNumber = useMemo(() => getWeekNumber(activeDate), [activeDate])

  const { weekStartDay, weekEndDay, weekMonthName, weekYear } = useMemo(() => {
    if (!weekDays || weekDays.length === 0) {
      return { weekStartDay: null, weekEndDay: null, weekMonthName: "", weekYear: "" }
    }
    const first = weekDays[0]
    const last = weekDays[weekDays.length - 1]
    const month = MONTHS[first.date.getMonth()]?.toLowerCase() || ""
    return {
      weekStartDay: first,
      weekEndDay: last,
      weekMonthName: month,
      weekYear: first.date.getFullYear().toString(),
    }
  }, [weekDays])

  // Cargar clases en vista semanal
  const loadSemanaClases = useCallback(async () => {
    if (currentView !== "timeGridWeek") return
    setLoading(true)
    try {
      const fechaInicio = weekDays[0].dateStr
      const fechaFin = weekDays[6].dateStr
      const clases = await instructorService.getHorario({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      })
      setRawClases(Array.isArray(clases) ? clases : [])
    } catch (err) {
      console.error("Error al cargar clases de la semana:", err)
      toast.error("Error al cargar horario semanal")
    } finally {
      setLoading(false)
    }
  }, [currentView, weekDays])

  useEffect(() => {
    if (currentView === "timeGridWeek") {
      loadSemanaClases()
    }
  }, [currentView, loadSemanaClases])

  // Cargar clases en vista mensual para FullCalendar
  const fetchMonthClases = useCallback(
    async (
      { start, end }: { start: Date; end: Date },
      successCallback: (events: object[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      setLoading(true)
      try {
        const fechaInicio = toLocalDateStr(start)
        const fechaFin = toLocalDateStr(end)

        const clases = await instructorService.getHorario({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        })

        setRawClases(Array.isArray(clases) ? clases : [])

        const events = (clases || []).map((c) => {
          const color = c.color || "#fd761a"
          return {
            id: c.id,
            title: c.curso_nombre,
            start: `${c.fecha_clase}T${c.hora_inicio}`,
            end: `${c.fecha_clase}T${c.hora_fin}`,
            allDay: false,
            backgroundColor: color,
            borderColor: color,
            extendedProps: c,
          }
        })

        successCallback(events)
      } catch (err) {
        console.error("Error al cargar clases del mes:", err)
        failureCallback(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Cursos que realmente aparecen en el período actual (omite cursos con 0 clases)
  const cursosVisibles = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; color: string; count: number }>()

    rawClases.forEach((c) => {
      if (!c.curso_id) return
      const existing = map.get(c.curso_id)
      if (existing) {
        existing.count += 1
      } else {
        map.set(c.curso_id, {
          id: c.curso_id,
          nombre: c.curso_nombre,
          color: c.color || "#fd761a",
          count: 1,
        })
      }
    })

    return Array.from(map.values())
  }, [rawClases])

  // Si el curso seleccionado no está en el nuevo período, resetear filtro
  useEffect(() => {
    if (selectedCursoId && !cursosVisibles.some((c) => c.id === selectedCursoId)) {
      setSelectedCursoId(null)
    }
  }, [cursosVisibles, selectedCursoId])

  // Clases filtradas por el curso activo
  const clasesFiltradas = useMemo(() => {
    if (!selectedCursoId) return rawClases
    return rawClases.filter((c) => c.curso_id === selectedCursoId)
  }, [rawClases, selectedCursoId])

  // Días de la semana con sus clases correspondientes
  const weekDaysConClases = useMemo(() => {
    return weekDays.map((day) => {
      const events = clasesFiltradas
        .filter((c) => c.fecha_clase === day.dateStr)
        .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))

      return {
        ...day,
        events,
      }
    })
  }, [weekDays, clasesFiltradas])

  const totalWeekEvents = useMemo(() => {
    return weekDaysConClases.reduce((acc, d) => acc + d.events.length, 0)
  }, [weekDaysConClases])

  const activeMobileDay = useMemo(() => {
    return (
      weekDaysConClases.find((d) => d.dateStr === selectedMobileDateStr) ||
      weekDaysConClases[0]
    )
  }, [weekDaysConClases, selectedMobileDateStr])

  // Navegación temporal
  const handleNavigate = (dir: "prev" | "next" | "today") => {
    if (dir === "today") {
      const today = new Date()
      setActiveDate(today)
      setSelectedMobileDateStr(toLocalDateStr(today))
      if (currentView === "dayGridMonth") {
        calendarRef.current?.getApi()?.today()
      }
      return
    }

    if (currentView === "timeGridWeek") {
      setActiveDate((prev) => {
        const next = new Date(prev)
        next.setDate(next.getDate() + (dir === "prev" ? -7 : 7))
        setSelectedMobileDateStr(toLocalDateStr(next))
        return next
      })
    } else {
      const calApi = calendarRef.current?.getApi()
      if (!calApi) return
      if (dir === "prev") calApi.prev()
      else calApi.next()
      const start = calApi.view.currentStart || calApi.view.activeStart
      if (start) setActiveDate(start)
    }
  }

  // Abrir detalle puntual de una clase
  const abrirDetalleClase = useCallback(async (claseId: string) => {
    setSelectedClaseId(claseId)
    setClaseDetalle(null)
    setLoadingDetalle(true)

    try {
      const detalle = await instructorService.getDetalleClase(claseId)
      setClaseDetalle(detalle)
    } catch (err) {
      console.error("Error al obtener detalle de clase:", err)
      toast.error("No se pudo cargar el detalle de la clase")
    } finally {
      setLoadingDetalle(false)
    }
  }, [])

  // Event click en FullCalendar (vista Mes)
  const handleFullCalendarEventClick = useCallback(
    (arg: EventClickArg) => {
      const id = arg.event.id
      if (id) abrirDetalleClase(id)
    },
    [abrirDetalleClase]
  )

  // Renderizado personalizado de eventos en FullCalendar (vista Mes)
  const renderMonthEventContent = useCallback((eventInfo: EventContentArg) => {
    const c = eventInfo.event.extendedProps as InstructorClaseHorario
    const hora = (c.hora_inicio || "").substring(0, 5)

    return (
      <div
        className="w-full px-2 py-1 rounded-lg flex flex-col gap-0.5 overflow-hidden transition-all hover:scale-[1.01] shadow-2xs cursor-pointer border-l-[3.5px] bg-white text-[#0b1c30] border-[#e2e8f0]"
        style={{ borderLeftColor: c.color || "#fd761a" }}
      >
        <div className="flex items-center justify-between gap-1 leading-none">
          <span className="text-[10px] font-extrabold text-[#fd761a] tracking-tight">
            {hora}
          </span>
          {c.asistencia_registrada ? (
            <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 mr-0.5" />
              Lista
            </span>
          ) : (
            <span className="inline-flex items-center text-[9px] font-bold text-orange-700 bg-orange-50 px-1 py-0.2 rounded shrink-0">
              <Clock className="w-2.5 h-2.5 text-orange-500 mr-0.5" />
              Pendiente
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold truncate leading-tight text-[#0b1c30]">
          {c.curso_nombre}
        </span>
        {c.modulo_nombre && (
          <span className="text-[10px] text-slate-500 truncate leading-none">
            Mód. {c.modulo_numero}: {c.modulo_nombre}
          </span>
        )}
      </div>
    )
  }, [])

  // Título del período según la vista activa
  const periodTitle = useMemo(() => {
    if (currentView === "timeGridWeek") {
      return weekStartDay && weekEndDay
        ? `Semana del ${weekStartDay.dayNumber} al ${weekEndDay.dayNumber} de ${weekMonthName}, ${weekYear}`
        : "Semana"
    }
    return currentMonthTitle || "Calendario Mensual"
  }, [currentView, weekStartDay, weekEndDay, weekMonthName, weekYear, currentMonthTitle])

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-slate-50/50">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 space-y-4">
          {/* ─── HEADER & TOOLBAR PRINCIPAL (ESTILO AGENDA) ─── */}
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Mi Horario
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                  {currentView === "timeGridWeek" ? "Vista Semana" : "Vista Mes"}
                </span>
                {loading && (
                  <div className="size-4 rounded-full border-2 border-orange-200 border-t-[#fd761a] animate-spin ml-1" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                Calendario de clases asignadas. Haz clic en cualquier sesión para ver sus detalles.
              </p>
            </div>

            {/* CONTROLES DE FECHA Y SELECTOR DE VISTAS (SEMANA Y MES) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Navegación temporal: < Hoy > */}
              <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs gap-0.5">
                <button
                  type="button"
                  onClick={() => handleNavigate("prev")}
                  aria-label="Período anterior"
                  className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("today")}
                  aria-label="Ir a hoy"
                  className="px-3 h-8 flex items-center justify-center text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate("next")}
                  aria-label="Período siguiente"
                  className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Título de Período Actual */}
              <div className="flex items-center gap-2 px-3.5 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-slate-800">
                <Calendar className="w-4 h-4 text-[#fd761a]" />
                <span className="text-xs sm:text-sm font-bold capitalize">
                  {periodTitle}
                </span>
              </div>

              {/* Selector de Vistas: SOLAMENTE Semana y Mes */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-0.5">
                {VIEWS.map((view) => (
                  <button
                    key={view.key}
                    type="button"
                    onClick={() => {
                      setCurrentView(view.key)
                      if (view.key === "dayGridMonth") {
                        setTimeout(() => {
                          calendarRef.current?.getApi()?.updateSize()
                        }, 50)
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
          </header>

          {/* ─── FILTRO DINÁMICO POR CURSOS DEL PERÍODO ACTUAL ─── */}
          {cursosVisibles.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-xs flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Cursos en este período:
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {cursosVisibles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCursoId(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                      selectedCursoId === null
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    Todos ({rawClases.length})
                  </button>
                )}

                {cursosVisibles.map((c) => {
                  const isSelected = selectedCursoId === c.id

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCursoId(isSelected ? null : c.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                        isSelected
                          ? "bg-white border-slate-900 text-slate-900 shadow-xs ring-2 ring-slate-900/10"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate max-w-[200px]">{c.nombre}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white border border-slate-200 text-slate-600 font-extrabold">
                        {c.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── VISTA SEMANAL DEDICADA (IDÉNTICA A AGENDAWEEKVIEW) ─── */}
          {currentView === "timeGridWeek" && (
            <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-5 shadow-xs" id="view-semana">
              {/* Encabezado Semana */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-lg font-bold text-slate-900">
                    {periodTitle}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                  {/* Switch móvil: Por día vs Toda la semana */}
                  <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold text-slate-600">
                    <button
                      type="button"
                      onClick={() => setMobileWeekMode("day")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        mobileWeekMode === "day"
                          ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                          : "hover:text-slate-900"
                      }`}
                    >
                      Por día
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileWeekMode("all")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        mobileWeekMode === "all"
                          ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                          : "hover:text-slate-900"
                      }`}
                    >
                      Toda la semana ({totalWeekEvents})
                    </button>
                  </div>

                  <span className="text-xs font-bold text-[#fd761a] bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Semana {weekNumber}
                  </span>
                </div>
              </div>

              {/* VISTA ESCRITORIO / TABLET: Grid 7 Columnas idéntico a AgendaWeekView */}
              <div className="hidden md:block w-full overflow-x-auto pb-2 mt-4">
                <div className="grid grid-cols-7 gap-3 min-w-[750px]">
                  {weekDaysConClases.map((day) => {
                    const isToday = day.isToday
                    const isSunday = day.dayShort === "DOM"

                    return (
                      <div
                        key={day.dateStr}
                        className={`flex flex-col gap-2 ${
                          isSunday && day.events.length === 0 ? "opacity-75" : ""
                        }`}
                      >
                        {/* Tile de Cabecera del Día */}
                        <div
                          className={`text-center p-2 rounded-xl transition-all shadow-2xs ${
                            isToday
                              ? "bg-[#ffdbca] text-[#933700] ring-1 ring-[#fd761a]/30 font-black"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="text-[11px] font-bold uppercase tracking-wider">
                            {day.dayShort}
                          </div>
                          <div className="text-[18px] font-extrabold leading-tight">
                            {day.dayNumber}
                          </div>
                        </div>

                        {/* Lista de Clases del Día */}
                        {day.events.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {day.events.map((clase) => {
                              const timeStr = `${(clase.hora_inicio || "").substring(0, 5)} - ${(clase.hora_fin || "").substring(0, 5)}`
                              const isRegistrada = clase.asistencia_registrada

                              return (
                                <div
                                  key={clase.id}
                                  onClick={() => abrirDetalleClase(clase.id)}
                                  className="p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xs group bg-white border-l-[3.5px]"
                                  style={{ borderLeftColor: clase.color || "#fd761a" }}
                                >
                                  <div className="flex items-center justify-between gap-1 leading-none">
                                    <span className="text-[10px] font-bold text-[#fd761a]">
                                      {timeStr}
                                    </span>
                                    {isRegistrada ? (
                                      <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded shrink-0">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 mr-0.5" />
                                        Lista
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center text-[9px] font-bold text-orange-700 bg-orange-50 px-1 py-0.2 rounded shrink-0">
                                        <Clock className="w-2.5 h-2.5 text-orange-500 mr-0.5" />
                                        Pendiente
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold leading-tight line-clamp-2 text-slate-900 group-hover:text-[#fd761a] transition-colors">
                                      {clase.curso_nombre}
                                    </span>
                                    {clase.modulo_nombre && (
                                      <p className="text-[11px] text-slate-500 truncate leading-tight">
                                        Mód. {clase.modulo_numero}: {clase.modulo_nombre}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                                    <span className="truncate">{clase.ciudad || "Presencial"}</span>
                                    <span className="text-slate-600 font-bold group-hover:translate-x-0.5 transition-transform">
                                      Ver →
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400 font-medium rounded-xl">
                            Sin clases
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* VISTA MÓVIL: Selector de Día Táctil o Lista Desplegada */}
              <div className="block md:hidden mt-3 space-y-3">
                {/* Tira de 7 días táctil */}
                <div className="grid grid-cols-7 gap-1 p-1 bg-slate-100/90 rounded-xl">
                  {weekDaysConClases.map((day) => {
                    const isSelected = day.dateStr === activeMobileDay?.dateStr
                    const hasEvents = day.events.length > 0

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedMobileDateStr(day.dateStr)
                          if (mobileWeekMode === "all") setMobileWeekMode("day")
                        }}
                        className={`flex flex-col items-center py-2 px-0.5 rounded-lg transition-all text-center relative ${
                          isSelected && mobileWeekMode === "day"
                            ? "bg-slate-900 text-white shadow-xs"
                            : day.isToday
                            ? "bg-[#ffdbca] text-[#933700] ring-1 ring-[#fd761a]/30"
                            : "text-slate-700 hover:bg-white/60"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                          {day.dayShort}
                        </span>
                        <span className="text-sm font-black leading-tight mt-0.5">
                          {day.dayNumber}
                        </span>
                        {hasEvents ? (
                          <span className="size-1.5 rounded-full mt-1 bg-[#fd761a]" />
                        ) : (
                          <span className="size-1.5 mt-1" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Lista móvil de clases */}
                {mobileWeekMode === "day" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                      <span>{activeMobileDay?.dayLong} {activeMobileDay?.dayNumber}</span>
                      <span>{activeMobileDay?.events.length || 0} clase(s)</span>
                    </div>

                    {activeMobileDay && activeMobileDay.events.length > 0 ? (
                      activeMobileDay.events.map((clase) => (
                        <div
                          key={clase.id}
                          onClick={() => abrirDetalleClase(clase.id)}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-1.5 cursor-pointer border-l-[3.5px]"
                          style={{ borderLeftColor: clase.color || "#fd761a" }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#fd761a]">
                              {clase.hora_inicio?.substring(0, 5)} - {clase.hora_fin?.substring(0, 5)}
                            </span>
                            {clase.asistencia_registrada ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Asistencia Lista
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                                Pendiente
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-slate-900">{clase.curso_nombre}</span>
                          {clase.modulo_nombre && (
                            <span className="text-xs text-slate-500">
                              Módulo {clase.modulo_numero}: {clase.modulo_nombre}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 bg-white border border-dashed rounded-xl border-slate-200">
                        No hay clases programadas para este día.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weekDaysConClases.map((day) => (
                      <div key={day.dateStr} className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-700 px-1">
                          {day.dayLong} {day.dayNumber}
                        </span>
                        {day.events.length > 0 ? (
                          day.events.map((clase) => (
                            <div
                              key={clase.id}
                              onClick={() => abrirDetalleClase(clase.id)}
                              className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-1 cursor-pointer border-l-[3.5px]"
                              style={{ borderLeftColor: clase.color || "#fd761a" }}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#fd761a]">
                                  {clase.hora_inicio?.substring(0, 5)} - {clase.hora_fin?.substring(0, 5)}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-900">{clase.curso_nombre}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-slate-400 italic">Sin clases</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── VISTA MENSUAL (FULLCALENDAR DAYGRIDMONTH) ─── */}
          {currentView === "dayGridMonth" && (
            <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-3 sm:p-5">
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
                  min-height: 110px !important;
                  padding: 4px !important;
                  transition: background-color 0.15s ease;
                  cursor: pointer;
                }
                .fc .fc-daygrid-day-frame:hover {
                  background-color: #f8fafc;
                }
                .fc .fc-event {
                  border-radius: 8px !important;
                  border: none !important;
                  background: transparent !important;
                  padding: 0 !important;
                  margin-top: 2px !important;
                  margin-bottom: 2px !important;
                }
                .fc .fc-daygrid-event-harness {
                  margin-bottom: 2px !important;
                }
              `}</style>

              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={fetchMonthClases}
                eventClick={handleFullCalendarEventClick}
                eventContent={renderMonthEventContent}
                datesSet={(arg) => setCurrentMonthTitle(arg.view.title)}
                height="auto"
                locale="es"
                firstDay={1}
                views={{
                  dayGridMonth: {
                    titleFormat: { year: "numeric", month: "long" },
                  },
                }}
                noEventsContent="No hay clases programadas para este mes."
              />
            </div>
          )}
        </div>
      </main>

      {/* ─── DRAWER LATERAL DE DETALLE DE CLASE AL DAR CLIC ─── */}
      {createPortal(
        <AnimatePresence>
          {selectedClaseId && (
            <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedClaseId(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden"
            >
              {/* Header del drawer */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100/70 border border-orange-200 flex items-center justify-center text-[#fd761a]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      Detalle de la Clase
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Información académica y estado de la sesión
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClaseId(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido del detalle */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loadingDetalle || !claseDetalle ? (
                  <div className="py-20 text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#fd761a]" />
                    <p className="text-xs font-medium text-slate-500">Cargando datos de la clase...</p>
                  </div>
                ) : (
                  <>
                    {/* Tarjeta de Curso y Módulo */}
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: claseDetalle.color || "#fd761a" }}
                        >
                          {claseDetalle.catalogo_nombre || "Curso"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {claseDetalle.modalidad && (
                            <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold">
                              {claseDetalle.modalidad}
                            </span>
                          )}
                          {claseDetalle.ciudad && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {claseDetalle.ciudad}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-snug">
                          {claseDetalle.curso_nombre}
                        </h4>
                        {claseDetalle.modulo_nombre && (
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            Módulo {claseDetalle.modulo_numero}: {claseDetalle.modulo_nombre}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Fecha y Horario */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-[#fd761a]" />
                          Fecha
                        </span>
                        <p className="text-xs font-bold text-slate-900">
                          {formatFechaLarga(claseDetalle.fecha_clase)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-[#fd761a]" />
                          Horario
                        </span>
                        <p className="text-xs font-bold text-slate-900">
                          {claseDetalle.hora_inicio?.substring(0, 5)} – {claseDetalle.hora_fin?.substring(0, 5)}
                        </p>
                        {calculateDuration(claseDetalle.hora_inicio, claseDetalle.hora_fin) && (
                          <span className="text-[10px] text-slate-500 font-medium block">
                            Duración: {calculateDuration(claseDetalle.hora_inicio, claseDetalle.hora_fin)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estado de Asistencia */}
                    <div
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        claseDetalle.asistencia_registrada
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-orange-50/70 border-orange-200 text-orange-950"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          claseDetalle.asistencia_registrada
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {claseDetalle.asistencia_registrada ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">
                            {claseDetalle.asistencia_registrada
                              ? "Asistencia Registrada"
                              : "Asistencia Pendiente"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              claseDetalle.asistencia_registrada
                                ? "bg-emerald-200/60 text-emerald-800"
                                : "bg-orange-200/60 text-orange-800"
                            }`}
                          >
                            {claseDetalle.asistencia_registrada ? "Completada" : "Por tomar"}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80">
                          {claseDetalle.asistencia_registrada
                            ? `${claseDetalle.asistencias_presentes} de ${claseDetalle.total_estudiantes} estudiantes asistieron a esta sesión.`
                            : `Hay ${claseDetalle.total_estudiantes} estudiantes matriculados listos para pase de lista.`}
                        </p>
                      </div>
                    </div>

                    {/* Observaciones de la clase si existen */}
                    {claseDetalle.observaciones ? (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Observaciones
                        </span>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">
                          {claseDetalle.observaciones}
                        </p>
                      </div>
                    ) : null}

                    {/* Resumen de estudiantes */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Estudiantes en nómina</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">
                        {claseDetalle.total_estudiantes}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer con acción directa para tomar asistencia */}
              {claseDetalle && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedClaseId(null)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cerrar
                  </button>

                  {claseDetalle.curso_id && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/instructor/cursos/${claseDetalle.curso_id}?tab=asistencia`)
                      }}
                      className="px-4 py-2 rounded-xl bg-[#fd761a] hover:bg-[#9d4300] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>{claseDetalle.asistencia_registrada ? "Ver Asistencia" : "Tomar Asistencia"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  )
}
