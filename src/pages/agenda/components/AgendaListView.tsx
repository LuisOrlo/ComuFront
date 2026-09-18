import React, { useMemo } from "react"
import type { AgendaEvent } from "@/services/agenda.service"
import { type WeekDayInfo, getEventStyles, MONTHS } from "../utils"

interface AgendaListViewProps {
  weekDays: (WeekDayInfo & { events: AgendaEvent[] })[]
  onSelectEvent: (event: AgendaEvent) => void
}

export const AgendaListView: React.FC<AgendaListViewProps> = ({
  weekDays,
  onSelectEvent,
}) => {
  // Aplanar y ordenar todos los eventos de la semana por fecha y hora
  const allWeekEvents = useMemo(() => {
    const list: { event: AgendaEvent; day: WeekDayInfo }[] = []
    for (const day of weekDays) {
      for (const ev of day.events) {
        list.push({ event: ev, day })
      }
    }
    return list.sort((a, b) => {
      const cmpDate = a.event.fecha.localeCompare(b.event.fecha)
      if (cmpDate !== 0) return cmpDate
      return (a.event.hora_inicio || "").localeCompare(b.event.hora_inicio || "")
    })
  }, [weekDays])

  return (
    <div className="w-full bg-white rounded-2xl p-2 sm:p-4 overflow-x-auto" id="view-lista">
      <table className="w-full text-left min-w-[680px]">
        {/* Encabezado redondeado de tabla (de code.html líneas 542-551) */}
        <thead className="bg-slate-100 rounded-xl text-slate-500 font-bold text-xs uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4 rounded-l-xl">Fecha / Hora</th>
            <th className="py-3 px-4">Servicio</th>
            <th className="py-3 px-4">Actividad / Evento</th>
            <th className="py-3 px-4">Responsable</th>
            <th className="py-3 px-4 rounded-r-xl text-right">Acción</th>
          </tr>
        </thead>

        {/* Filas de eventos (de code.html líneas 552-578) */}
        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
          {allWeekEvents.length > 0 ? (
            allWeekEvents.map(({ event: ev, day }) => {
              const styles = getEventStyles(ev.tipo_evento)
              const monthShort = (MONTHS[day.date.getMonth()] || "").slice(0, 3)
              const timeStr = ev.hora_inicio?.slice(0, 5)
              const displayTitle =
                ev.tipo_evento === "CLASE_CURSO" && ev.nombre_instancia
                  ? ev.nombre_instancia
                  : ev.titulo

              return (
                <tr
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Fecha / Hora: ej. 17 Sep · 10:00 */}
                  <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                    {day.dayNumber} {monthShort} · {timeStr}
                  </td>

                  {/* Servicio: badge pill redondeado */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-block"
                      style={{ backgroundColor: styles.bg, color: styles.text }}
                    >
                      {styles.label}
                    </span>
                  </td>

                  {/* Actividad / Evento */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors">
                    {displayTitle}
                  </td>

                  {/* Responsable */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {ev.instructor_nombre || "—"}
                  </td>

                  {/* Acción */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectEvent(ev)
                      }}
                      className="text-[#fd761a] font-bold text-xs hover:underline cursor-pointer"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={5} className="py-16 text-center text-slate-400 font-medium text-xs">
                No hay actividades programadas para esta semana.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
