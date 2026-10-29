import { useState, useMemo } from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Info,
  CalendarPlus,
  Edit2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { parseLocalDate } from "@/lib/utils"
import { toast } from "sonner"

export interface ClaseProgramada {
  id?: string
  fecha_clase: string // 'YYYY-MM-DD'
  hora_inicio: string // 'HH:mm'
  hora_fin: string    // 'HH:mm'
  asistencia_registrada?: boolean
  modulo_id?: string
  observaciones?: string
}

interface CursoClasesCalendarProps {
  fechaInicioCurso?: string | null
  fechaFinCurso?: string | null
  horaInicioCurso?: string | null
  horaFinCurso?: string | null
  diasSemana?: number[] // [1, 2, ..., 7] (1 = Lun, 7 = Dom)
  clases: ClaseProgramada[]
  onChangeClases?: (clases: ClaseProgramada[]) => void
  isEdit?: boolean
  readOnly?: boolean
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const DIAS_CABECERA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function toDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

function formatFechaCompleta(fechaStr: string): string {
  const date = parseLocalDate(fechaStr)
  if (isNaN(date.getTime())) return fechaStr
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  return `${dias[date.getDay()]}, ${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`
}

export function CursoClasesCalendar({
  fechaInicioCurso,
  fechaFinCurso,
  horaInicioCurso,
  horaFinCurso,
  diasSemana,
  clases,
  onChangeClases,
  isEdit = false,
  readOnly = false,
}: CursoClasesCalendarProps) {
  // Si estamos en edición y hay clases existentes cargadas
  void isEdit

  // Si no se pasaron clases explícitas pero hay fechas y días de semana (ej: vista en detalles de curso antiguo),
  // se calculan de manera estimada
  const effectiveClases = useMemo(() => {
    if (clases && clases.length > 0) return clases
    if (fechaInicioCurso && fechaFinCurso && diasSemana && diasSemana.length > 0) {
      const inicio = parseLocalDate(fechaInicioCurso)
      const fin = parseLocalDate(fechaFinCurso)
      if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime()) && inicio <= fin) {
        const generadas: ClaseProgramada[] = []
        const curr = new Date(inicio)
        while (curr.getTime() <= fin.getTime()) {
          const isoDay = curr.getDay() === 0 ? 7 : curr.getDay()
          if (diasSemana.includes(isoDay)) {
            generadas.push({
              fecha_clase: toDateString(curr.getFullYear(), curr.getMonth(), curr.getDate()),
              hora_inicio: horaInicioCurso || "08:00",
              hora_fin: horaFinCurso || "10:00",
            })
          }
          curr.setDate(curr.getDate() + 1)
        }
        return generadas
      }
    }
    return []
  }, [clases, fechaInicioCurso, fechaFinCurso, diasSemana, horaInicioCurso, horaFinCurso])

  // Mes visualizado en el calendario
  const initialDate = useMemo(() => {
    if (fechaInicioCurso) {
      const d = parseLocalDate(fechaInicioCurso)
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1)
    }
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }, [fechaInicioCurso])

  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate)
  const [sessionToEdit, setSessionToEdit] = useState<ClaseProgramada | null>(null)
  const [editHoraInicio, setEditHoraInicio] = useState("")
  const [editHoraFin, setEditHoraFin] = useState("")
  const [showAddCustomModal, setShowAddCustomModal] = useState(false)
  const [manualDate, setManualDate] = useState("")
  const [manualHoraInicio, setManualHoraInicio] = useState(horaInicioCurso || "08:00")
  const [manualHoraFin, setManualHoraFin] = useState(horaFinCurso || "10:00")
  const [showList, setShowList] = useState(false)

  // Clases ordenadas cronológicamente
  const clasesOrdenadas = useMemo(() => {
    return [...effectiveClases].sort((a, b) => {
      const dateDiff = a.fecha_clase.localeCompare(b.fecha_clase)
      if (dateDiff !== 0) return dateDiff
      return (a.hora_inicio || "").localeCompare(b.hora_inicio || "")
    })
  }, [effectiveClases])

  // Map rápido por fecha para lookup O(1)
  const clasesMap = useMemo(() => {
    const map = new Map<string, { clase: ClaseProgramada; index: number }>()
    clasesOrdenadas.forEach((clase, idx) => {
      map.set(clase.fecha_clase, { clase, index: idx + 1 })
    })
    return map
  }, [clasesOrdenadas])

  // Conteo de clases dentro y fuera de rango
  const stats = useMemo(() => {
    let enRango = 0
    let preInicio = 0
    let postFin = 0

    effectiveClases.forEach((c) => {
      if (fechaInicioCurso && c.fecha_clase < fechaInicioCurso) {
        preInicio++
      } else if (fechaFinCurso && c.fecha_clase > fechaFinCurso) {
        postFin++
      } else {
        enRango++
      }
    })

    return { total: effectiveClases.length, enRango, preInicio, postFin, fueraRango: preInicio + postFin }
  }, [effectiveClases, fechaInicioCurso, fechaFinCurso])

  // Navegación de mes
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleGoToCourseStart = () => {
    if (fechaInicioCurso) {
      const d = parseLocalDate(fechaInicioCurso)
      if (!isNaN(d.getTime())) setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }

  // Generar cuadrícula de días para el mes actual
  const monthCells = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    // 0=Dom, 1=Lun ... convertimos a 0=Lun, 6=Dom
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const todayStr = toDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

    const cells: Array<{
      dateStr: string
      dayNumber: number
      isCurrentMonth: boolean
      isToday: boolean
      isWithinCourseRange: boolean
      isBeforeCourse: boolean
      isAfterCourse: boolean
      claseData?: { clase: ClaseProgramada; index: number }
    }> = []

    // Días del mes anterior (padding)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const dateStr = toDateString(prevYear, prevMonth, day)
      const claseData = clasesMap.get(dateStr)

      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWithinCourseRange: (!fechaInicioCurso || dateStr >= fechaInicioCurso) && (!fechaFinCurso || dateStr <= fechaFinCurso),
        isBeforeCourse: Boolean(fechaInicioCurso && dateStr < fechaInicioCurso),
        isAfterCourse: Boolean(fechaFinCurso && dateStr > fechaFinCurso),
        claseData,
      })
    }

    // Días del mes actual
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = toDateString(year, month, day)
      const claseData = clasesMap.get(dateStr)

      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWithinCourseRange: (!fechaInicioCurso || dateStr >= fechaInicioCurso) && (!fechaFinCurso || dateStr <= fechaFinCurso),
        isBeforeCourse: Boolean(fechaInicioCurso && dateStr < fechaInicioCurso),
        isAfterCourse: Boolean(fechaFinCurso && dateStr > fechaFinCurso),
        claseData,
      })
    }

    // Días del siguiente mes (padding para completar filas de 7)
    const remaining = (7 - (cells.length % 7)) % 7
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      const dateStr = toDateString(nextYear, nextMonth, day)
      const claseData = clasesMap.get(dateStr)

      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWithinCourseRange: (!fechaInicioCurso || dateStr >= fechaInicioCurso) && (!fechaFinCurso || dateStr <= fechaFinCurso),
        isBeforeCourse: Boolean(fechaInicioCurso && dateStr < fechaInicioCurso),
        isAfterCourse: Boolean(fechaFinCurso && dateStr > fechaFinCurso),
        claseData,
      })
    }

    return cells
  }, [currentMonth, clasesMap, fechaInicioCurso, fechaFinCurso])

  // Agregar clase rápida al hacer clic en un día sin clase
  const handleAddClase = (dateStr: string) => {
    if (readOnly || !onChangeClases || clasesMap.has(dateStr)) return

    const nuevaClase: ClaseProgramada = {
      fecha_clase: dateStr,
      hora_inicio: horaInicioCurso || "08:00",
      hora_fin: horaFinCurso || "10:00",
    }

    const nuevas = [...clases, nuevaClase]
    onChangeClases(nuevas)

    if (fechaInicioCurso && dateStr < fechaInicioCurso) {
      toast.info(`Clase especial agregada previa a la fecha de inicio oficial (${dateStr})`)
    } else if (fechaFinCurso && dateStr > fechaFinCurso) {
      toast.info(`Clase especial agregada posterior al cierre oficial (${dateStr})`)
    } else {
      toast.success(`Clase agregada para el ${dateStr}`)
    }
  }

  // Quitar clase
  const handleRemoveClase = (dateStr: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (readOnly || !onChangeClases) return
    const claseExistente = clases.find((c) => c.fecha_clase === dateStr)
    if (claseExistente?.asistencia_registrada) {
      toast.error("No se puede eliminar una clase que ya tiene asistencia registrada en el sistema.")
      return
    }

    const filtradas = clases.filter((c) => c.fecha_clase !== dateStr)
    onChangeClases(filtradas)
    toast.success(`Clase eliminada del ${dateStr}`)
  }

  // Abrir modal de edición de sesión
  const handleOpenEditSession = (clase: ClaseProgramada, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSessionToEdit(clase)
    setEditHoraInicio(clase.hora_inicio || horaInicioCurso || "08:00")
    setEditHoraFin(clase.hora_fin || horaFinCurso || "10:00")
  }

  // Guardar horario modificado de la sesión
  const handleSaveEditSession = () => {
    if (readOnly || !onChangeClases || !sessionToEdit) return
    if (!editHoraInicio || !editHoraFin) {
      toast.error("Debes especificar la hora de inicio y fin")
      return
    }
    if (editHoraFin <= editHoraInicio) {
      toast.error("La hora de fin debe ser posterior a la de inicio")
      return
    }

    const actualizadas = clases.map((c) => {
      if (c.fecha_clase === sessionToEdit.fecha_clase) {
        return {
          ...c,
          hora_inicio: editHoraInicio,
          hora_fin: editHoraFin,
        }
      }
      return c
    })

    onChangeClases(actualizadas)
    toast.success(`Horario actualizado para la sesión del ${sessionToEdit.fecha_clase}`)
    setSessionToEdit(null)
  }

  // Restablecer horario de la sesión al horario base del curso
  const handleResetSessionToCourseTime = () => {
    setEditHoraInicio(horaInicioCurso || "08:00")
    setEditHoraFin(horaFinCurso || "10:00")
  }

  // Regenerar recurrencia estándar
  const handleRegenerateFromRecurrence = () => {
    if (readOnly || !onChangeClases) return
    if (!fechaInicioCurso || !fechaFinCurso) {
      toast.error("Configura primero las fechas de inicio y fin del curso en el Paso 2")
      return
    }
    if (!diasSemana || diasSemana.length === 0) {
      toast.error("Selecciona al menos un día de la semana arriba")
      return
    }

    const inicio = parseLocalDate(fechaInicioCurso)
    const fin = parseLocalDate(fechaFinCurso)
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
      toast.error("Las fechas de inicio y fin no son válidas")
      return
    }

    const generadas: ClaseProgramada[] = []
    const curr = new Date(inicio)

    while (curr.getTime() <= fin.getTime()) {
      const isoDay = curr.getDay() === 0 ? 7 : curr.getDay()
      if (diasSemana.includes(isoDay)) {
        const dateStr = toDateString(curr.getFullYear(), curr.getMonth(), curr.getDate())
        generadas.push({
          fecha_clase: dateStr,
          hora_inicio: horaInicioCurso || "08:00",
          hora_fin: horaFinCurso || "10:00",
        })
      }
      curr.setDate(curr.getDate() + 1)
    }

    onChangeClases(generadas)
    toast.success(`Se generaron ${generadas.length} clases según el patrón de días seleccionado`)
  }

  // Agregar fecha manual desde modal
  const handleAddManualDate = () => {
    if (readOnly || !onChangeClases) return
    if (!manualDate) {
      toast.error("Selecciona una fecha")
      return
    }
    if (clasesMap.has(manualDate)) {
      toast.error("Ya existe una clase programada para esta fecha")
      return
    }
    if (manualHoraFin <= manualHoraInicio) {
      toast.error("La hora de fin debe ser posterior a la de inicio")
      return
    }

    const nuevaClase: ClaseProgramada = {
      fecha_clase: manualDate,
      hora_inicio: manualHoraInicio,
      hora_fin: manualHoraFin,
    }

    const nuevas = [...clases, nuevaClase]
    onChangeClases(nuevas)

    // Navegar al mes de la fecha agregada
    const d = parseLocalDate(manualDate)
    if (!isNaN(d.getTime())) {
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    }

    setShowAddCustomModal(false)
    setManualDate("")
    toast.success(`Clase agregada para el ${manualDate}`)
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
      {/* ================= HEADER & STATS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-orange-100 text-[#fd761a] flex items-center justify-center font-bold">
              <CalendarIcon size={18} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Calendario de clases programadas
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            {readOnly
              ? "Días y horarios programados para las sesiones de este curso."
              : "Haz clic en cualquier día para agregar o quitar clases. Puedes incluir fechas antes o después del período oficial si surge algún conflicto o necesidad especial."}
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-[#fd761a]">
            <span>{stats.total} {stats.total === 1 ? "clase" : "clases"}</span>
          </div>

          {stats.fueraRango > 0 && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800"
              title="Clases programadas fuera del rango formal de fecha de inicio y fin del curso"
            >
              <Sparkles size={13} className="text-amber-600" />
              <span>{stats.fueraRango} fuera de rango oficial</span>
            </div>
          )}

          {!readOnly && onChangeClases && (
            <>
              <button
                type="button"
                onClick={handleRegenerateFromRecurrence}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                title="Recalcular clases dentro del período según los días de la semana marcados arriba"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Restablecer a recurrencia</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setManualHoraInicio(horaInicioCurso || "08:00")
                  setManualHoraFin(horaFinCurso || "10:00")
                  setShowAddCustomModal(true)
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#fd761a] hover:bg-[#e06512] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <CalendarPlus size={14} />
                <span>Agregar fecha</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= CALENDAR TOOLBAR ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-900 min-w-36 text-center select-none">
            {MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {fechaInicioCurso && (
            <button
              type="button"
              onClick={handleGoToCourseStart}
              className="text-[11px] font-semibold text-[#fd761a] hover:underline cursor-pointer"
            >
              Ir al inicio ({fechaInicioCurso})
            </button>
          )}
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* ================= CALENDAR GRID ================= */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center">
          {DIAS_CABECERA.map((d, i) => (
            <div key={d} className={`py-2 text-[11px] font-bold uppercase tracking-wider ${i >= 5 ? "text-amber-700" : "text-slate-600"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {monthCells.map((cell) => {
            const hasClass = Boolean(cell.claseData)
            const clase = cell.claseData?.clase
            const sessionNum = cell.claseData?.index
            const isCustomTime =
              clase &&
              ((clase.hora_inicio && clase.hora_inicio !== horaInicioCurso) ||
                (clase.hora_fin && clase.hora_fin !== horaFinCurso))

            return (
              <div
                key={cell.dateStr}
                onClick={() => {
                  if (!readOnly && !hasClass) {
                    handleAddClase(cell.dateStr)
                  }
                }}
                className={`min-h-24 p-1.5 sm:p-2 flex flex-col justify-between transition-all group relative ${
                  !cell.isCurrentMonth ? "bg-slate-50/50 text-slate-400" : "text-slate-800"
                } ${
                  hasClass
                    ? "bg-orange-50/70 border-orange-200 ring-1 ring-orange-200"
                    : readOnly
                    ? "cursor-default"
                    : "hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {/* Day Header (Number & Badges) */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      cell.isToday
                        ? "bg-[#fd761a] text-white shadow-2xs"
                        : hasClass
                        ? "bg-orange-200 text-orange-950 font-extrabold"
                        : "text-slate-700"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Actions on hover or if class exists */}
                  <div className="flex items-center gap-1">
                    {!readOnly && hasClass && clase && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditSession(clase, e)}
                          title="Editar horario de esta clase"
                          className="size-5 rounded flex items-center justify-center bg-white hover:bg-orange-100 text-slate-600 hover:text-[#fd761a] shadow-2xs transition-colors cursor-pointer"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveClase(cell.dateStr, e)}
                          title="Quitar esta clase"
                          className="size-5 rounded flex items-center justify-center bg-white hover:bg-red-100 text-slate-400 hover:text-red-600 shadow-2xs transition-colors cursor-pointer"
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                    {!readOnly && !hasClass && (
                      <span className="opacity-0 group-hover:opacity-100 text-[#fd761a] size-5 rounded flex items-center justify-center bg-orange-50 transition-opacity">
                        <Plus size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Body / Class Details */}
                {hasClass && clase ? (
                  <div
                    onClick={(e) => handleOpenEditSession(clase, e)}
                    className="mt-1.5 p-1.5 rounded-lg bg-white border border-orange-200/90 shadow-2xs flex flex-col gap-0.5 cursor-pointer hover:border-orange-400 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 leading-none">
                      <span className="text-[10px] font-extrabold text-[#fd761a]">
                        Sesión #{sessionNum}
                      </span>
                      {clase.asistencia_registrada && (
                        <span className="size-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center" title="Asistencia registrada">
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-700 font-semibold font-mono">
                      <Clock size={10} className={isCustomTime ? "text-amber-600" : "text-slate-400"} />
                      <span>
                        {clase.hora_inicio || horaInicioCurso || "08:00"} – {clase.hora_fin || horaFinCurso || "10:00"}
                      </span>
                    </div>

                    {isCustomTime && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 rounded px-1 self-start">
                        Horario esp.
                      </span>
                    )}

                    {cell.isBeforeCourse && (
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 rounded px-1 self-start" title="Clase previa a la fecha de inicio del curso">
                        Pre-inicio
                      </span>
                    )}

                    {cell.isAfterCourse && (
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-50 rounded px-1 self-start" title="Clase posterior a la fecha de fin del curso">
                        Post-cierre
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-[10px] text-slate-300 select-none">
                    {/* Empty cell placeholder */}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ================= COLLAPSIBLE SESSIONS LIST ================= */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          type="button"
          onClick={() => setShowList((prev) => !prev)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#fd761a]" />
            <span>Listado cronológico de sesiones ({clasesOrdenadas.length} en total)</span>
          </div>
          {showList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showList && (
          <div className="p-3 bg-white border-t border-slate-200 max-h-72 overflow-y-auto divide-y divide-slate-100">
            {clasesOrdenadas.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Aún no has agregado ninguna clase. Haz clic sobre los días del calendario o pulsa "Restablecer a recurrencia".
              </p>
            ) : (
              clasesOrdenadas.map((c, index) => {
                const isBefore = Boolean(fechaInicioCurso && c.fecha_clase < fechaInicioCurso)
                const isAfter = Boolean(fechaFinCurso && c.fecha_clase > fechaFinCurso)
                const isCustomTime =
                  (c.hora_inicio && c.hora_inicio !== horaInicioCurso) ||
                  (c.hora_fin && c.hora_fin !== horaFinCurso)

                return (
                  <div key={c.fecha_clase} className="py-2 px-1 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-6 rounded-md bg-orange-100 text-[#fd761a] flex items-center justify-center font-bold text-[11px] shrink-0">
                        #{index + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 truncate">
                          {formatFechaCompleta(c.fecha_clase)}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>{c.hora_inicio || horaInicioCurso} – {c.hora_fin || horaFinCurso}</span>
                          {isCustomTime && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 rounded">
                              Horario especial
                            </span>
                          )}
                          {isBefore && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 rounded">
                              Pre-inicio
                            </span>
                          )}
                          {isAfter && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1 rounded">
                              Post-cierre
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!readOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSession(c)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-[#fd761a] transition-colors"
                          title="Cambiar horario"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveClase(c.fecha_clase)}
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Eliminar clase"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: EDIT / VIEW SESSION TIME ================= */}
      {sessionToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setSessionToEdit(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-orange-100 text-[#fd761a] flex items-center justify-center font-bold">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {readOnly ? "Detalle de sesión de clase" : "Editar horario de sesión"}
                  </h4>
                  <p className="text-xs text-slate-500">{formatFechaCompleta(sessionToEdit.fecha_clase)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSessionToEdit(null)}
                className="size-7 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Outside Range Info Alert */}
            {(fechaInicioCurso && sessionToEdit.fecha_clase < fechaInicioCurso) && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2 text-xs text-blue-800">
                <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Esta sesión se programó antes de la fecha de inicio oficial del curso. El rango de fechas oficial del curso se mantendrá intacto.</span>
              </div>
            )}
            {(fechaFinCurso && sessionToEdit.fecha_clase > fechaFinCurso) && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-2 text-xs text-purple-800">
                <Info size={15} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Esta sesión se programó después de la fecha de cierre oficial del curso. El rango de fechas oficial del curso se mantendrá intacto.</span>
              </div>
            )}

            {readOnly ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Horario de clase:</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {sessionToEdit.hora_inicio || horaInicioCurso || "08:00"} – {sessionToEdit.hora_fin || horaFinCurso || "10:00"}
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hora de inicio</label>
                    <input
                      type="time"
                      value={editHoraInicio}
                      onChange={(e) => setEditHoraInicio(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hora de fin</label>
                    <input
                      type="time"
                      value={editHoraFin}
                      onChange={(e) => setEditHoraFin(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a]"
                    />
                  </div>
                </div>

                {horaInicioCurso && horaFinCurso && (
                  <button
                    type="button"
                    onClick={handleResetSessionToCourseTime}
                    className="text-xs font-semibold text-[#fd761a] hover:underline cursor-pointer"
                  >
                    Restablecer a horario base ({horaInicioCurso} – {horaFinCurso})
                  </button>
                )}
              </>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              {readOnly ? (
                <div className="w-full flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSessionToEdit(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveClase(sessionToEdit.fecha_clase)
                      setSessionToEdit(null)
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Eliminar sesión
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSessionToEdit(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditSession}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#fd761a] hover:bg-[#e06512] text-white shadow-sm transition-all cursor-pointer"
                    >
                      Guardar horario
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD MANUAL DATE ================= */}
      {showAddCustomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setShowAddCustomModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-orange-100 text-[#fd761a] flex items-center justify-center font-bold">
                  <CalendarPlus size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Agregar fecha de clase específica</h4>
                  <p className="text-xs text-slate-500">Selecciona cualquier fecha dentro o fuera del período oficial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="size-7 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de la clase</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hora de inicio</label>
                <input
                  type="time"
                  value={manualHoraInicio}
                  onChange={(e) => setManualHoraInicio(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hora de fin</label>
                <input
                  type="time"
                  value={manualHoraFin}
                  onChange={(e) => setManualHoraFin(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddManualDate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#fd761a] hover:bg-[#e06512] text-white shadow-sm transition-all cursor-pointer"
              >
                Agregar clase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
