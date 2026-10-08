import React, { useState, useEffect, useMemo } from "react"
import type { AgendaEvent } from "@/services/agenda.service"
import { type WeekDayInfo, getWeekNumber, MONTHS, toLocalDateStr } from "../utils"

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

  const [selectedMobileDateStr, setSelectedMobileDateStr] = useState<string>(() =>
    toLocalDateStr(activeDate)
  )
  const [mobileWeekMode, setMobileWeekMode] = useState<"day" | "all">("day")

  useEffect(() => {
    setSelectedMobileDateStr(toLocalDateStr(activeDate))
  }, [activeDate])

  const activeMobileDay = useMemo(() => {
    return weekDays.find((d) => d.dateStr === selectedMobileDateStr) || weekDays[0]
  }, [weekDays, selectedMobileDateStr])

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

  const totalWeekEvents = useMemo(() => {
    return weekDays.reduce((acc, d) => acc + d.events.length, 0)
  }, [weekDays])

  return (
    <div className="w-full bg-white rounded-2xl p-2.5 sm:p-4" id="view-semana">
      {/* Encabezado Semana */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-lg font-bold text-slate-900">
            {startDay && endDay
              ? `Semana del ${startDay.dayNumber} al ${endDay.dayNumber} de ${monthName}, ${year}`
              : "Semana"}
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Switch de modo móvil: Por día vs Toda la semana */}
          <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setMobileWeekMode("day")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
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

      {/* VISTA ESCRITORIO / TABLET: Grid 7 Columnas */}
      <div className="hidden md:block w-full overflow-x-auto pb-2 mt-4">
        <div className="grid grid-cols-7 gap-3 min-w-[700px]">
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
                          {ev.tipo_evento === "STREAMING" ? (
                            <div className="flex flex-col gap-0.5 text-[11px] opacity-90">
                              {ev.instructor_nombre && (
                                <span className={`font-semibold truncate ${theme.sub}`}>
                                  👤 {ev.instructor_nombre}
                                </span>
                              )}
                              {ev.aula_nombre && (
                                <span className="text-[10px] text-slate-500 font-medium truncate">
                                  📍 {ev.aula_nombre}
                                </span>
                              )}
                            </div>
                          ) : ev.instructor_nombre ? (
                            <span className={`text-[11px] font-medium opacity-85 truncate ${theme.sub}`}>
                              {ev.instructor_nombre}
                            </span>
                          ) : null}
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

      {/* VISTA MÓVIL: Selector de Día Táctil o Lista Desplegada */}
      <div className="block md:hidden mt-3 space-y-3">
        {/* Tira de 7 días seleccionable */}
        <div className="grid grid-cols-7 gap-1 p-1 bg-slate-100/90 rounded-xl">
          {weekDays.map((day) => {
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
                className={`flex flex-col items-center py-2 px-0.5 rounded-lg transition-all text-center relative cursor-pointer ${
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
                  <span
                    className={`size-1.5 rounded-full mt-1 ${
                      isSelected && mobileWeekMode === "day"
                        ? "bg-[#fd761a]"
                        : "bg-[#fd761a]"
                    }`}
                  />
                ) : (
                  <span className="size-1.5 mt-1" />
                )}
              </button>
            )
          })}
        </div>

        {/* Modo 1: Actividades del Día Seleccionado */}
        {mobileWeekMode === "day" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 pt-0.5">
              <span className="text-xs font-bold text-slate-800 capitalize">
                {activeMobileDay?.dayLong} {activeMobileDay?.dayNumber} de {monthName}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {activeMobileDay?.events.length || 0}{" "}
                {activeMobileDay?.events.length === 1 ? "actividad" : "actividades"}
              </span>
            </div>

            {activeMobileDay && activeMobileDay.events.length > 0 ? (
              <div className="flex flex-col gap-2">
                {activeMobileDay.events.map((ev) => {
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
                      onClick={() => onSelectEvent(ev)}
                      className={`p-3 rounded-xl border shadow-2xs flex flex-col gap-1.5 cursor-pointer transition-all active:scale-[0.99] group ${theme.bg}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {timeStr && (
                          <span className={`text-[11px] font-bold ${theme.time}`}>
                            {timeStr}
                          </span>
                        )}
                        {ev.tipo_evento && (
                          <span className="text-[10px] font-bold uppercase opacity-75">
                            {ev.tipo_evento.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm font-bold leading-tight ${theme.title}`}>
                        {displayTitle}
                      </span>
                      {ev.tipo_evento === "STREAMING" ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          {ev.instructor_nombre && (
                            <span className={`font-semibold truncate ${theme.sub}`}>
                              👤 {ev.instructor_nombre}
                            </span>
                          )}
                          {ev.aula_nombre && (
                            <span className="text-slate-500 font-medium truncate text-[11px]">
                              📍 {ev.aula_nombre}
                            </span>
                          )}
                        </div>
                      ) : ev.instructor_nombre ? (
                        <span className={`text-xs font-medium opacity-85 truncate ${theme.sub}`}>
                          {ev.instructor_nombre}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                Sin actividades programadas para este día
              </div>
            )}
          </div>
        )}

        {/* Modo 2: Toda la semana ordenada por días con eventos */}
        {mobileWeekMode === "all" && (
          <div className="space-y-4">
            {weekDays.filter((d) => d.events.length > 0).length > 0 ? (
              weekDays
                .filter((d) => d.events.length > 0)
                .map((day) => (
                  <div key={day.dateStr} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className="size-2 rounded-full bg-[#fd761a]" />
                      <span className="text-xs font-black text-slate-800 capitalize">
                        {day.dayLong} {day.dayNumber}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        ({day.events.length})
                      </span>
                    </div>
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
                            onClick={() => onSelectEvent(ev)}
                            className={`p-3 rounded-xl border shadow-2xs flex flex-col gap-1.5 cursor-pointer transition-all active:scale-[0.99] group ${theme.bg}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              {timeStr && (
                                <span className={`text-[11px] font-bold ${theme.time}`}>
                                  {timeStr}
                                </span>
                              )}
                              {ev.tipo_evento && (
                                <span className="text-[10px] font-bold uppercase opacity-75">
                                  {ev.tipo_evento.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                            <span className={`text-xs sm:text-sm font-bold leading-tight ${theme.title}`}>
                              {displayTitle}
                            </span>
                            {ev.instructor_nombre && (
                              <span className={`text-xs font-medium opacity-85 truncate ${theme.sub}`}>
                                {ev.instructor_nombre}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                No hay actividades programadas en toda esta semana
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
