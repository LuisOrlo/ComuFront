import React, { useMemo } from "react"
import type { AgendaEvent } from "@/services/agenda.service"
import { type WeekDayInfo, getWeekNumber, MONTHS } from "../utils"

interface AgendaWeekViewProps {
  weekDays: (WeekDayInfo & { events: AgendaEvent[] })[]
  activeDate: Date
  onSelectEvent: (event: AgendaEvent) => void
  onSelectDay: (date: Date, dateStr: string, events: AgendaEvent[]) => void
}

function getCardTheme(tipoEvento: string) {
  switch (tipoEvento) {
    case "CLASE_CURSO":
      return {
        bg: "bg-blue-50 hover:bg-blue-100/70 border-blue-100",
        time: "text-blue-700",
        title: "text-blue-950",
        sub: "text-blue-600",
      }
    case "TALLER":
      return {
        bg: "bg-purple-50 hover:bg-purple-100/70 border-purple-100",
        time: "text-purple-700",
        title: "text-purple-950",
        sub: "text-purple-600",
      }
    case "PODCAST":
      return {
        bg: "bg-amber-50 hover:bg-amber-100/70 border-amber-100",
        time: "text-amber-700",
        title: "text-amber-950",
        sub: "text-amber-600",
      }
    case "STREAMING":
      return {
        bg: "bg-rose-50 hover:bg-rose-100/70 border-rose-100",
        time: "text-rose-700",
        title: "text-rose-950",
        sub: "text-rose-600",
      }
    case "ALQUILER_AULA":
      return {
        bg: "bg-emerald-50 hover:bg-emerald-100/70 border-emerald-100",
        time: "text-emerald-700",
        title: "text-emerald-950",
        sub: "text-emerald-600",
      }
    case "ASESORIA":
      return {
        bg: "bg-cyan-50 hover:bg-cyan-100/70 border-cyan-100",
        time: "text-cyan-700",
        title: "text-cyan-950",
        sub: "text-cyan-600",
      }
    case "RADIO":
      return {
        bg: "bg-pink-50 hover:bg-pink-100/70 border-pink-100",
        time: "text-pink-700",
        title: "text-pink-950",
        sub: "text-pink-600",
      }
    default:
      return {
        bg: "bg-slate-50 hover:bg-slate-100 border-slate-200",
        time: "text-slate-600",
        title: "text-slate-900",
        sub: "text-slate-500",
      }
  }
}

export const AgendaWeekView: React.FC<AgendaWeekViewProps> = ({
  weekDays,
  activeDate,
  onSelectEvent,
  onSelectDay,
}) => {
  const weekNumber = useMemo(() => getWeekNumber(activeDate), [activeDate])

  const { startDay, endDay, monthName, year } = useMemo(() => {
    if (!weekDays || weekDays.length === 0) {
      return { startDay: null, endDay: null, monthName: "", year: "" }
    }
    const first = weekDays[0]
    const last = weekDays[weekDays.length - 1]
    const month = MONTHS[first.date.getMonth()]?.toLowerCase() || ""
    return {
      startDay: first,
      endDay: last,
      monthName: month,
      year: first.date.getFullYear().toString(),
    }
  }, [weekDays])

  return (
    <div className="w-full bg-white rounded-2xl p-2 sm:p-4" id="view-semana">
      {/* Encabezado Semana (de code.html líneas 426-429) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-base sm:text-lg font-bold text-slate-900">
          {startDay && endDay
            ? `Semana del ${startDay.dayNumber} al ${endDay.dayNumber} de ${monthName}, ${year}`
            : "Semana"}
        </span>
        <span className="text-xs font-bold text-[#fd761a] bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-full">
          Semana {weekNumber}
        </span>
      </div>

      {/* Grid 7 Columnas (de code.html líneas 430-506) */}
      <div className="grid grid-cols-7 gap-3 mt-4 min-w-[720px] overflow-x-auto pb-2">
        {weekDays.map((day) => {
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
                onClick={() => onSelectDay(day.date, day.dateStr, day.events)}
                className={`text-center p-2 rounded-xl cursor-pointer transition-all shadow-2xs hover:scale-[1.02] ${
                  isToday
                    ? "bg-[#ffdbca] text-[#933700] ring-1 ring-[#fd761a]/30"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title={`Ver actividades del ${day.dayLong}`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider">
                  {day.dayShort}
                </div>
                <div className="text-[18px] font-extrabold leading-tight">
                  {day.dayNumber}
                </div>
              </div>

              {/* Lista de Eventos del Día */}
              {day.events.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {day.events.map((ev) => {
                    const theme = getCardTheme(ev.tipo_evento)
                    const displayTitle =
                      ev.tipo_evento === "CLASE_CURSO" && ev.nombre_instancia
                        ? `Clase: ${ev.nombre_instancia}`
                        : ev.titulo

                    const timeStr = ev.hora_fin
                      ? `${ev.hora_inicio?.slice(0, 5)} - ${ev.hora_fin?.slice(0, 5)}`
                      : ev.hora_inicio?.slice(0, 5)

                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectEvent(ev)
                        }}
                        className={`p-2.5 rounded-xl border shadow-2xs flex flex-col gap-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xs group ${theme.bg}`}
                      >
                        {timeStr && (
                          <span className={`text-[10px] font-bold ${theme.time}`}>
                            {timeStr}
                          </span>
                        )}
                        <span className={`text-xs font-bold leading-tight line-clamp-2 ${theme.title}`}>
                          {displayTitle}
                        </span>
                        {ev.instructor_nombre && (
                          <span className={`text-[11px] font-medium opacity-85 truncate ${theme.sub}`}>
                            {ev.instructor_nombre}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div
                  onClick={() => onSelectDay(day.date, day.dateStr, day.events)}
                  className="p-3 text-center text-xs text-slate-400 font-medium cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Sin eventos
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
