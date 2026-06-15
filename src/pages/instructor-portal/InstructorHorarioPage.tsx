import { useState, useEffect, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  BookOpen01Icon,
  Clock01Icon,
  Home02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { instructorService, type InstructorCurso } from "@/services/instructor.service"
import { toast } from "sonner"

const DAYS = [
  { num: 1, short: "Lun", full: "Lunes" },
  { num: 2, short: "Mar", full: "Martes" },
  { num: 3, short: "Mie", full: "Miércoles" },
  { num: 4, short: "Jue", full: "Jueves" },
  { num: 5, short: "Vie", full: "Viernes" },
  { num: 6, short: "Sab", full: "Sábado" },
  { num: 7, short: "Dom", full: "Domingo" },
]

interface AgendaItem {
  cursoId: string
  nombre: string
  catalogo: string
  ciudad: string
  dia: number
  horaInicio: string
  horaFin: string
  color: string
  fechaInicio: string
  fechaFin: string
}

const COURSE_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#3b82f6",
]

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number)
  return h + m / 60
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":")
  return `${h}:${m}`
}

export function InstructorHorarioPage() {
  const [cursos, setCursos] = useState<InstructorCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const loadHorario = () => {
    setError(null)
    setLoading(true)
    instructorService
      .getMisCursos()
      .then((data) => {
        setCursos(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error("Error cargando cursos:", err)
        const msg =
          typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { status?: number; data?: { mensaje?: string } } }).response?.data?.mensaje
            : null
        setError(msg || "No se pudo conectar con el servidor")
        toast.error("Error al cargar horario")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHorario()
  }, [])

  const agendaItems = useMemo<AgendaItem[]>(() => {
    const items: AgendaItem[] = []
    
    if (!Array.isArray(cursos)) return items;

    // Comparación robusta de IDs (soporta string/number mezclados)
    const isSelected = (id: string | number) => 
      selectedCursoId ? String(id) === String(selectedCursoId) : true;

    cursos.forEach((curso, idx) => {
      if (!curso || !isSelected(curso.id)) return;

      const h = curso.horario
      if (!h?.hora_inicio || !h?.hora_fin) return

      // Procesar días de la semana: prefiere el nuevo formato (relacion),
      // pero cae al formato antiguo (columna array) si el nuevo esta vacio
      const rawDias = (Array.isArray(h.dias_semana) && h.dias_semana.length > 0)
        ? h.dias_semana
        : (h.dia_semana ?? [])
      
      const diasArray = Array.isArray(rawDias) ? rawDias : [rawDias]
      
      const dias = diasArray
        .map((d: { dia_semana?: number }) => {
          if (typeof d === "number") return d;
          return d?.dia_semana;
        })
        .filter((d): d is number => typeof d === "number" && d >= 1 && d <= 7)

      dias.forEach((dia) => {
        items.push({
          cursoId: String(curso.id),
          nombre: curso.nombre_instancia,
          catalogo: curso.catalogo?.nombre ?? "",
          ciudad: curso.ciudad?.nombre ?? "",
          dia,
          horaInicio: h.hora_inicio!,
          horaFin: h.hora_fin!,
          color: COURSE_COLORS[idx % COURSE_COLORS.length],
          fechaInicio: curso.fecha_inicio,
          fechaFin: curso.fecha_fin,
        })
      })
    })
    return items
  }, [cursos, selectedCursoId])

  const timeRange = useMemo(() => {
    // Si no hay items, mostramos un rango estándar por defecto
    if (agendaItems.length === 0) return { start: 7, end: 21, slots: 14 }
    
    let min = 24
    let max = 0
    agendaItems.forEach((item) => {
      const s = parseTime(item.horaInicio)
      const e = parseTime(item.horaFin)
      if (s < min) min = s
      if (e > max) max = e
    })
    
    // Ajustar a la hora entera más cercana con un margen
    const start = Math.max(0, Math.floor(min) - 1)
    const end = Math.min(24, Math.ceil(max) + 1)
    return { start, end, slots: Math.max(1, end - start) }
  }, [agendaItems])

  const activeDays = useMemo(() => {
    const set = new Set<number>()
    agendaItems.forEach((i) => set.add(i.dia))
    return DAYS.filter((d) => set.has(d.num))
  }, [agendaItems])

  const monthDays = useMemo(() => {
    if (viewMode !== "month") return []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    const startPad = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
    const endPad = lastDayOfMonth.getDay() === 0 ? 0 : 7 - lastDayOfMonth.getDay()

    const days: Array<{
      date: Date; dayNumber: number; isCurrentMonth: boolean; isToday: boolean
      courses: AgendaItem[]
    }> = []

    for (let i = startPad; i > 0; i--) {
      const d = new Date(year, month, 1 - i)
      days.push({ date: d, dayNumber: d.getDate(), isCurrentMonth: false, isToday: false, courses: [] })
    }

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const date = new Date(year, month, d)
      const dow = date.getDay() === 0 ? 7 : date.getDay()
      const today = new Date()
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      days.push({
        date, dayNumber: d, isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        courses: agendaItems.filter(i => {
          if (i.dia !== dow) return false
          const start = (i.fechaInicio || "").split("T")[0].split(" ")[0]
          const end = (i.fechaFin || "").split("T")[0].split(" ")[0]
          if (!start || !end) return false
          return dateStr >= start && dateStr <= end
        }),
      })
    }

    for (let i = 1; i <= endPad; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d, dayNumber: d.getDate(), isCurrentMonth: false, isToday: false, courses: [] })
    }

    return days
  }, [viewMode, currentMonth, agendaItems])

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="p-16 text-center" style={{ color: COLORS.TEXT_MUTED }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: COLORS.ACCENT }} />
          Cargando horario...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div
          className="bg-white rounded-2xl p-16 text-center"
          style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
        >
          <HugeiconsIcon
            icon={Calendar03Icon}
            size={56}
            className="mx-auto mb-4"
            style={{ color: "oklch(0.85 0.01 15)" }}
          />
          <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.CHARCOAL }}>
            Error al cargar el horario
          </h3>
          <p style={{ color: COLORS.TEXT_MUTED }} className="text-sm max-w-md mx-auto mb-4">
            {error}
          </p>
          <button
            onClick={loadHorario}
            className="px-5 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          {viewMode === "month" && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" style={{ color: COLORS.TEXT_MUTED }}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              </button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" style={{ color: COLORS.TEXT_MUTED }}>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </button>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
              {viewMode === "week" ? "Horario Semanal" : currentMonth.toLocaleDateString("es-EC", { month: "long", year: "numeric" })}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <button onClick={() => setViewMode("week")}
              className="px-4 py-2 text-xs font-bold transition-colors"
              style={{ backgroundColor: viewMode === "week" ? COLORS.CHARCOAL : "transparent", color: viewMode === "week" ? "white" : COLORS.TEXT_MUTED }}>
              Semana
            </button>
            <button onClick={() => setViewMode("month")}
              className="px-4 py-2 text-xs font-bold transition-colors"
              style={{ backgroundColor: viewMode === "month" ? COLORS.CHARCOAL : "transparent", color: viewMode === "month" ? "white" : COLORS.TEXT_MUTED }}>
              Mes
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
            <span className="size-2 rounded-full" style={{ backgroundColor: COLORS.ACCENT }} />
            {cursos.length} curso{cursos.length !== 1 ? "s" : ""} asignado{cursos.length !== 1 ? "s" : ""}
          </div>
        </div>
      </header>

      {/* Summary cards at top */}
      {cursos.length > 0 && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {cursos.map((curso, idx) => {
            const isSelected = selectedCursoId && String(selectedCursoId) === String(curso.id);
            const courseColor = COURSE_COLORS[idx % COURSE_COLORS.length];
            
            return (
              <button
                key={curso.id}
                onClick={() => setSelectedCursoId(isSelected ? null : curso.id)}
                className="bg-white rounded-xl p-4 hover:shadow-md transition-all group text-left w-full"
                style={{ 
                  borderColor: isSelected ? courseColor : COLORS.BORDER_SUBTLE, 
                  borderWidth: isSelected ? 2 : 1,
                  backgroundColor: isSelected ? `${courseColor}05` : "white",
                  boxShadow: isSelected ? `0 4px 12px ${courseColor}20` : "none"
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: courseColor,
                      color: "white",
                    }}
                  >
                    <HugeiconsIcon icon={BookOpen01Icon} size={18} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-bold truncate"
                      style={{ color: COLORS.CHARCOAL }}
                    >
                      {curso.nombre_instancia}
                    </p>
                    <p className="text-[10px] truncate flex items-center gap-1" style={{ color: COLORS.TEXT_MUTED }}>
                      {curso.catalogo?.color && (
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: curso.catalogo.color }} />
                      )}
                      {curso.catalogo?.nombre}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
          {selectedCursoId && (
            <button
              onClick={() => setSelectedCursoId(null)}
              className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all border-dashed flex items-center justify-center gap-2"
              style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
            >
              <span className="text-xs font-bold" style={{ color: COLORS.TEXT_MUTED }}>
                Ver Todos
              </span>
            </button>
          )}
        </div>
      )}

      {viewMode === "month" ? (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {DAYS.map(day => (
              <div key={day.num} className="p-2 md:p-3 text-center border-l first:border-l-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block" style={{ color: COLORS.TEXT_MUTED }}>
                  {day.full}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider sm:hidden" style={{ color: COLORS.TEXT_MUTED }}>
                  {day.short}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => (
              <div key={idx}
                className="min-h-[70px] md:min-h-[90px] p-1 border-b border-l" style={{
                  borderColor: COLORS.BORDER_SUBTLE,
                  opacity: day.isCurrentMonth ? 1 : 0.25,
                }}
              >
                <span className={`text-[11px] md:text-xs font-semibold inline-flex items-center justify-center size-5 md:size-6 rounded-full ${day.isToday ? 'text-white' : ''}`}
                  style={day.isToday ? { backgroundColor: COLORS.ACCENT } : { color: COLORS.CHARCOAL }}
                >
                  {day.dayNumber}
                </span>
                <div className="mt-0.5 md:mt-1 space-y-0.5">
                  {day.courses.map((course, ci) => (
                    <div key={ci}
                      className="rounded-sm md:rounded px-0.5 md:px-1 py-0.5 text-[6px] md:text-[8px] font-semibold text-white truncate leading-tight"
                      style={{ backgroundColor: course.color }}
                      title={`${course.nombre} (${formatTime(course.horaInicio)} - ${formatTime(course.horaFin)})`}
                    >
                      <span className="hidden sm:inline">{course.nombre}</span>
                      <span className="sm:hidden inline-block size-1.5 rounded-full bg-white/80" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : agendaItems.length === 0 ? (
        cursos.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-16 text-center"
            style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={56}
              className="mx-auto mb-4"
              style={{ color: "oklch(0.9 0 0)" }}
            />
            <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.CHARCOAL }}>
              No tienes cursos asignados
            </h3>
            <p style={{ color: COLORS.TEXT_MUTED }} className="text-sm max-w-md mx-auto">
              No se encontraron cursos donde figures como instructor. Contacta con administracion si crees que esto es un error.
            </p>
          </div>
        ) : (
          <div
            className="bg-white rounded-2xl p-16 text-center"
            style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={56}
              className="mx-auto mb-4"
              style={{ color: "oklch(0.9 0 0)" }}
            />
            <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.CHARCOAL }}>
              Sin dias de horario configurados
            </h3>
            <p style={{ color: COLORS.TEXT_MUTED }} className="text-sm max-w-md mx-auto">
              Tus cursos tienen horario definido pero no se han configurado los dias de la semana. Contacta con administracion para completar los horarios.
            </p>
          </div>
        )
      ) : (
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
        >
          {/* Day headers */}
          <div
            className="grid border-b sticky top-0 bg-white z-10"
            style={{
              gridTemplateColumns: `60px repeat(${activeDays.length}, 1fr)`,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="p-3" />
            {activeDays.map((day) => (
              <div
                key={day.num}
                className="p-3 text-center border-l"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  {day.short}
                </p>
                <p className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>
                  {day.full}
                </p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="overflow-auto max-h-[calc(100vh-280px)] [&::-webkit-scrollbar]:w-0 [-ms-overflow-style:none] [scrollbar-width:none]">
            <div
              className="grid relative"
              style={{
                gridTemplateColumns: `60px repeat(${activeDays.length}, 1fr)`,
                minHeight: `${timeRange.slots * 80}px`,
              }}
            >
              {/* Time labels */}
              {Array.from({ length: timeRange.slots }, (_, i) => {
                const hour = timeRange.start + i
                return (
                  <div key={`label-${hour}`} className="contents">
                    <div
                      className="border-b px-2 py-1 text-right"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    >
                      <span
                        className="text-[9px] font-mono font-bold"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        {String(hour).padStart(2, "0")}:00
                      </span>
                    </div>
                    {activeDays.map((day) => (
                      <div
                        key={`cell-${hour}-${day.num}`}
                        className="border-b border-l"
                        style={{
                          borderColor: COLORS.BORDER_SUBTLE,
                          backgroundColor: hour % 2 === 0 ? "transparent" : "oklch(0.985 0 0)",
                        }}
                      />
                    ))}
                  </div>
                )
              })}

              {/* Course blocks */}
              {agendaItems.map((item, idx) => {
                const startHour = parseTime(item.horaInicio)
                const endHour = parseTime(item.horaFin)
                const top = ((startHour - timeRange.start) / timeRange.slots) * 100
                const height = ((endHour - startHour) / timeRange.slots) * 100
                const dayIdx = activeDays.findIndex((d) => d.num === item.dia)

                return (
                  <button
                    key={`${item.cursoId}-${item.dia}-${idx}`}
                    onClick={() => {
                      const idStr = String(item.cursoId);
                      setSelectedCursoId(selectedCursoId && String(selectedCursoId) === idStr ? null : idStr);
                    }}
                    className="absolute mx-0.5 rounded-lg px-2 py-1 overflow-hidden transition-all hover:brightness-110 hover:shadow-lg cursor-pointer text-left"
                    style={{
                      top: `${top}%`,
                      height: `${Math.max(height, 4)}%`,
                      left: `calc(60px + ${(dayIdx / activeDays.length) * 100}%)`,
                      width: `calc(${(1 / activeDays.length) * 100}% - 4px)`,
                      backgroundColor: item.color,
                      color: "white",
                      border: "none",
                    }}
                  >
                    <p className="text-[9px] font-bold leading-tight truncate">
                      {item.nombre}
                    </p>
                    <p className="text-[8px] opacity-80 leading-tight truncate">
                      {item.catalogo}
                    </p>
                    <p className="text-[8px] opacity-70 mt-0.5 flex items-center gap-1">
                      <HugeiconsIcon icon={Clock01Icon} size={10} />
                      {formatTime(item.horaInicio)} – {formatTime(item.horaFin)}
                    </p>
                    {item.ciudad && (
                      <p className="text-[7px] opacity-60 flex items-center gap-0.5 truncate">
                        <HugeiconsIcon icon={Home02Icon} size={9} />
                        {item.ciudad}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
