import { useState, useMemo, useEffect } from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Check,
  Edit2,
  X,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { parseLocalDate } from "@/lib/utils"

export interface SesionFormItem {
  id?: string
  fecha_sesion: string // 'YYYY-MM-DD'
  hora_inicio: string // 'HH:mm'
  hora_fin: string // 'HH:mm'
  aula?: string
  tema?: string
  observaciones?: string
  hasAsistencia?: boolean
}

interface TallerSesionesCalendarProps {
  fechaInicioTaller?: string | null
  fechaFinTaller?: string | null
  horaInicioDefault?: string | null
  horaFinDefault?: string | null
  diasSemana?: number[] // 1-7 (1 = Lun, 7 = Dom)
  sesiones: SesionFormItem[]
  onChangeSesiones: (sesiones: SesionFormItem[]) => void
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

export function TallerSesionesCalendar({
  fechaInicioTaller,
  fechaFinTaller,
  horaInicioDefault = "09:00",
  horaFinDefault = "12:00",
  sesiones,
  onChangeSesiones,
  readOnly = false,
}: TallerSesionesCalendarProps) {
  // Mes visualizado actualmente
  const initialMonth = useMemo(() => {
    if (fechaInicioTaller) {
      const d = parseLocalDate(fechaInicioTaller)
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1)
    }
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }, [fechaInicioTaller])

  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth)
  const [editingSesion, setEditingSesion] = useState<SesionFormItem | null>(null)
  const [editHoraInicio, setEditHoraInicio] = useState("")
  const [editHoraFin, setEditHoraFin] = useState("")
  const [editAula, setEditAula] = useState("")
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  // Sincronizar mes si cambia la fecha de inicio del taller
  useEffect(() => {
    if (fechaInicioTaller) {
      const d = parseLocalDate(fechaInicioTaller)
      if (!isNaN(d.getTime())) {
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1))
      }
    }
  }, [fechaInicioTaller])

  // Sesiones ordenadas cronológicamente
  const sesionesOrdenadas = useMemo(() => {
    return [...sesiones].sort((a, b) => {
      const diff = a.fecha_sesion.localeCompare(b.fecha_sesion)
      if (diff !== 0) return diff
      return (a.hora_inicio || "").localeCompare(b.hora_inicio || "")
    })
  }, [sesiones])

  // Map para búsqueda rápida O(1)
  const sesionesMap = useMemo(() => {
    const map = new Map<string, { sesion: SesionFormItem; index: number }>()
    sesionesOrdenadas.forEach((s, idx) => {
      map.set(s.fecha_sesion, { sesion: s, index: idx + 1 })
    })
    return map
  }, [sesionesOrdenadas])

  // Horas totales
  const totalHoras = useMemo(() => {
    let minutosTotales = 0
    sesiones.forEach((s) => {
      if (s.hora_inicio && s.hora_fin) {
        const [h1, m1] = s.hora_inicio.split(":").map(Number)
        const [h2, m2] = s.hora_fin.split(":").map(Number)
        const diff = h2 * 60 + m2 - (h1 * 60 + m1)
        if (diff > 0) minutosTotales += diff
      }
    })
    const horas = Math.floor(minutosTotales / 60)
    const mins = minutosTotales % 60
    return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`
  }, [sesiones])

  // Identificar si alguna sesión tiene horario inválido (hora fin <= hora inicio)
  const tieneSesionesInvalidas = useMemo(() => {
    return sesiones.some(
      (s) => !s.hora_inicio || !s.hora_fin || s.hora_fin <= s.hora_inicio
    )
  }, [sesiones])

  // Navegación de mes
  const prevMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  // Comprobar si una fecha está dentro del rango del taller
  const isInRange = (dateStr: string): boolean => {
    if (!fechaInicioTaller) return false
    const d = parseLocalDate(dateStr)
    const start = parseLocalDate(fechaInicioTaller)
    const end = fechaFinTaller ? parseLocalDate(fechaFinTaller) : start
    return d >= start && d <= end
  }

  // Toggle de día al hacer clic en el calendario
  const toggleDia = (dateStr: string) => {
    if (readOnly) return
    if (!isInRange(dateStr)) return

    const existing = sesionesMap.get(dateStr)
    if (existing) {
      if (existing.sesion.hasAsistencia) {
        return // Protegida contra eliminación
      }
      onChangeSesiones(sesiones.filter((s) => s.fecha_sesion !== dateStr))
    } else {
      const nueva: SesionFormItem = {
        fecha_sesion: dateStr,
        hora_inicio: horaInicioDefault || "09:00",
        hora_fin: horaFinDefault || "12:00",
      }
      onChangeSesiones([...sesiones, nueva])
    }
  }

  // Abrir editor de horario puntual
  const abrirEditor = (sesion: SesionFormItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingSesion(sesion)
    setEditHoraInicio(sesion.hora_inicio || horaInicioDefault || "09:00")
    setEditHoraFin(sesion.hora_fin || horaFinDefault || "12:00")
    setEditAula(sesion.aula || "")
  }

  const guardarEdicion = () => {
    if (!editingSesion) return
    if (!editHoraInicio || !editHoraFin) {
      toast.error("Debes ingresar la hora de inicio y de finalización")
      return
    }
    if (editHoraFin <= editHoraInicio) {
      toast.error("La hora de finalización debe ser posterior a la de inicio (no pueden ser iguales ni anteriores)")
      return
    }
    onChangeSesiones(
      sesiones.map((s) =>
        s.fecha_sesion === editingSesion.fecha_sesion
          ? {
              ...s,
              hora_inicio: editHoraInicio,
              hora_fin: editHoraFin,
              aula: editAula.trim() || undefined,
            }
          : s
      )
    )
    toast.success("Horario de la sesión actualizado")
    setEditingSesion(null)
  }

  // Días del mes para renderizar
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7 // 0 = Lunes, 6 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const diasPrevMonth = new Date(year, month, 0).getDate()
  const cells = []

  // Relleno mes anterior
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = diasPrevMonth - i
    const prevMonthIdx = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const dateStr = toDateString(prevYear, prevMonthIdx, dayNum)
    cells.push({ dayNum, dateStr, isCurrentMonth: false })
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = toDateString(year, month, day)
    cells.push({ dayNum: day, dateStr, isCurrentMonth: true })
  }

  // Relleno mes siguiente
  const remaining = (7 - (cells.length % 7)) % 7
  for (let day = 1; day <= remaining; day++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const dateStr = toDateString(nextYear, nextMonthIdx, day)
    cells.push({ dayNum: day, dateStr, isCurrentMonth: false })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
      {/* Header del Calendario */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#fd761a]">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {MESES[month]} {year}
            </h3>
            <p className="text-[11px] text-slate-500">
              Haz clic sobre los días para activar o desactivar sesiones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Selector de modo vista */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Calendario
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Lista ({sesiones.length})
            </button>
          </div>

          {/* Navegación mes */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
              title="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
              title="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* VISTA CALENDARIO */}
      {viewMode === "calendar" ? (
        <div className="flex flex-col">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DIAS_CABECERA.map((d, i) => (
              <div
                key={d}
                className={`py-1.5 text-xs font-bold uppercase tracking-wide ${
                  i >= 5 ? "text-orange-600" : "text-slate-500"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map(({ dayNum, dateStr, isCurrentMonth }) => {
              const inRange = isInRange(dateStr)
              const sessionInfo = sesionesMap.get(dateStr)
              const isSelected = !!sessionInfo
              const hasAsistencia = sessionInfo?.sesion.hasAsistencia
              const isInvalidHorario =
                isSelected &&
                (!sessionInfo.sesion.hora_inicio ||
                  !sessionInfo.sesion.hora_fin ||
                  sessionInfo.sesion.hora_fin <= sessionInfo.sesion.hora_inicio)

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={!inRange || readOnly}
                  onClick={() => toggleDia(dateStr)}
                  className={`group relative flex min-h-[72px] sm:min-h-[80px] flex-col justify-between rounded-xl p-1.5 sm:p-2 text-left transition-all ${
                    !isCurrentMonth
                      ? "bg-slate-50/40 text-slate-300 opacity-40 border border-transparent"
                      : !inRange
                      ? "bg-slate-50/70 text-slate-300 cursor-not-allowed border border-dashed border-slate-200"
                      : isSelected && isInvalidHorario
                      ? "bg-rose-50/90 border-2 border-rose-500 shadow-xs ring-2 ring-rose-200"
                      : isSelected
                      ? "bg-orange-50/80 border-2 border-[#fd761a] shadow-xs ring-2 ring-orange-100"
                      : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:border-orange-300"
                  }`}
                >
                  {/* Número de día y badges */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isSelected && isInvalidHorario
                          ? "text-rose-700"
                          : isSelected
                          ? "text-[#fd761a]"
                          : isCurrentMonth && inRange
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {isSelected && (
                      <span
                        className={`flex size-4 items-center justify-center rounded-full text-white ${
                          isInvalidHorario ? "bg-rose-600 animate-pulse text-[10px] font-black" : "bg-[#fd761a]"
                        }`}
                      >
                        {isInvalidHorario ? "!" : <Check size={10} strokeWidth={3} />}
                      </span>
                    )}
                  </div>

                  {/* Detalle de la sesión si está seleccionada */}
                  {isSelected && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {isInvalidHorario ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-100/90 rounded px-1 py-0.5 animate-pulse">
                          ⚠️ Horario inválido
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate">
                          {sessionInfo.sesion.hora_inicio} - {sessionInfo.sesion.hora_fin}
                        </span>
                      )}
                      {sessionInfo.sesion.aula && (
                        <span className="text-[9px] text-slate-500 truncate flex items-center gap-0.5">
                          <Building2 size={10} /> {sessionInfo.sesion.aula}
                        </span>
                      )}
                      {hasAsistencia && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700">
                          <ShieldCheck size={10} /> Asistencia
                        </span>
                      )}
                    </div>
                  )}

                  {/* Botón de edición rápida al pasar el cursor */}
                  {isSelected && !readOnly && (
                    <div
                      onClick={(e) => abrirEditor(sessionInfo.sesion, e)}
                      className="absolute top-1 right-6 hidden group-hover:flex size-5 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-600 hover:text-[#fd761a] shadow-xs"
                      title="Editar horario puntual"
                    >
                      <Edit2 size={10} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        /* VISTA LISTA CRONOLÓGICA */
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {sesionesOrdenadas.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No hay sesiones programadas aún. Selecciona días en el calendario para agregarlas.
            </div>
          ) : (
            sesionesOrdenadas.map((s, idx) => {
              const isInvalid = !s.hora_inicio || !s.hora_fin || s.hora_fin <= s.hora_inicio

              return (
                <div
                  key={s.fecha_sesion}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 text-xs transition-colors ${
                    isInvalid
                      ? "border-rose-300 bg-rose-50/80 text-rose-900"
                      : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-white text-[10px] font-bold shrink-0 ${
                        isInvalid ? "bg-rose-600 animate-pulse" : "bg-[#fd761a]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 capitalize">
                          {s.fecha_sesion}
                        </span>
                        {isInvalid && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-200/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                            <AlertTriangle size={11} /> Hora fin debe ser mayor a inicio
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className={isInvalid ? "font-bold text-rose-700 underline" : "text-slate-500"}>
                          {s.hora_inicio} – {s.hora_fin}
                        </span>
                        {s.aula && (
                          <span className="font-medium text-slate-600">
                            · Aula: {s.aula}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => abrirEditor(s)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isInvalid
                            ? "bg-rose-600 text-white hover:bg-rose-700 shadow-2xs font-bold"
                            : "text-slate-500 hover:bg-white hover:text-[#fd761a]"
                        }`}
                        title="Editar horario de esta sesión"
                      >
                        <Edit2 size={13} />
                        <span>{isInvalid ? "Corregir horario" : "Editar"}</span>
                      </button>
                      {!s.hasAsistencia && (
                        <button
                          type="button"
                          onClick={() =>
                            onChangeSesiones(sesiones.filter((x) => x.fecha_sesion !== s.fecha_sesion))
                          }
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-white hover:text-rose-600 transition-colors"
                          title="Quitar sesión"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Banner de alerta de horarios inválidos si existe alguna */}
      {tieneSesionesInvalidas && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span className="flex-1 font-medium">
            Hay sesiones con <strong>horario inválido</strong> (la hora de finalización debe ser mayor a la hora de inicio). Corrige las sesiones marcadas en rojo para poder guardar.
          </span>
        </div>
      )}

      {/* Footer / Resumen de Sesiones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-[#fd761a] border border-orange-200">
            <Sparkles size={13} />
            {sesiones.length} {sesiones.length === 1 ? "sesión" : "sesiones"} programadas
          </span>
          <span className="text-xs text-slate-500">
            Total: <strong>{totalHoras}</strong>
          </span>
        </div>

        {!readOnly && sesiones.length > 0 && (
          <button
            type="button"
            onClick={() => onChangeSesiones([])}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
          >
            Limpiar todas las sesiones
          </button>
        )}
      </div>

      {/* Modal de Edición Puntual de Sesión */}
      {editingSesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-bold text-slate-900">
                Horario de sesión: {editingSesion.fecha_sesion}
              </h4>
              <button
                type="button"
                onClick={() => setEditingSesion(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Hora inicio</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="time"
                      value={editHoraInicio}
                      onChange={(e) => setEditHoraInicio(e.target.value)}
                      className="w-full pl-9 pr-2 h-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Hora fin</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="time"
                      value={editHoraFin}
                      onChange={(e) => setEditHoraFin(e.target.value)}
                      className="w-full pl-9 pr-2 h-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Aula / Espacio (opcional)</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ej. Sala Creativa 1"
                    value={editAula}
                    onChange={(e) => setEditAula(e.target.value)}
                    className="w-full pl-9 pr-3 h-10 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a]"
                  />
                </div>
              </div>

              {/* Alerta de validación en vivo de horas */}
              {editHoraInicio && editHoraFin && editHoraFin <= editHoraInicio && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                  <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                  <span>La hora de fin debe ser posterior a la de inicio (no pueden coincidir).</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingSesion(null)}
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarEdicion}
                disabled={!editHoraInicio || !editHoraFin || editHoraFin <= editHoraInicio}
                className="rounded-xl px-4 py-2 text-xs font-bold text-white bg-[#fd761a] hover:bg-orange-600 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
