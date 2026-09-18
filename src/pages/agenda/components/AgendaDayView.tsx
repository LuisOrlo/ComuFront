import React from "react"
import type { AgendaEvent } from "@/services/agenda.service"
import { getEventStyles } from "../utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"

interface AgendaDayViewProps {
  activeDate: Date
  activeDayEvents: AgendaEvent[]
  onSelectEvent: (event: AgendaEvent) => void
}

export const AgendaDayView: React.FC<AgendaDayViewProps> = ({
  activeDate,
  activeDayEvents,
  onSelectEvent,
}) => {
  return (
    <div className="p-2 sm:p-4">
      {/* Header del Día (de code.html) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="size-10 rounded-xl bg-[#fd761a] text-white font-black text-lg flex items-center justify-center shadow-xs shadow-[#fd761a]/30">
            {activeDate.getDate()}
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 capitalize">
              {new Intl.DateTimeFormat("es-EC", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(activeDate)}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {activeDayEvents.length}{" "}
              {activeDayEvents.length === 1 ? "compromiso" : "compromisos"} en cronograma hoy
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            activeDayEvents.length > 0
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {activeDayEvents.length > 0 ? "Jornada Activa" : "Sin Actividades"}
        </span>
      </div>

      {/* Lista timeline de compromisos del día */}
      {activeDayEvents.length > 0 ? (
        <div className="divide-y divide-slate-100 mt-2">
          {activeDayEvents.map((event) => {
            const styles = getEventStyles(event.tipo_evento)
            const displayTitle =
              event.tipo_evento === "CLASE_CURSO" && event.nombre_instancia
                ? `Clase: ${event.nombre_instancia}`
                : event.titulo

            const subInfo = [
              event.instructor_nombre,
              event.ciudad_nombre,
              event.participantes_count != null
                ? `${event.participantes_count} participantes confirmados`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="py-4 flex items-start gap-4 hover:bg-slate-50/80 px-3 rounded-2xl transition-colors cursor-pointer group"
              >
                <span className="font-mono text-xl sm:text-2xl font-black text-[#fd761a] w-20 sm:w-24 shrink-0 mt-0.5">
                  {event.hora_inicio?.slice(0, 5)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: styles.bg, color: styles.text }}
                    >
                      {styles.label}
                    </span>
                    {event.modalidad && (
                      <span className="text-[10px] font-semibold text-slate-400 capitalize">
                        {event.modalidad}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors">
                    {displayTitle}
                  </h4>
                  {subInfo && <p className="text-xs text-slate-500 mt-0.5">{subInfo}</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400">
          <div className="size-12 rounded-2xl bg-orange-50 text-[#fd761a] flex items-center justify-center mx-auto mb-3">
            <HugeiconsIcon icon={Calendar03Icon} size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">
            No hay compromisos programados para este día
          </h4>
          <p className="text-xs text-slate-500">
            Usa los controles de navegación para explorar otros días de la agenda.
          </p>
        </div>
      )}
    </div>
  )
}
