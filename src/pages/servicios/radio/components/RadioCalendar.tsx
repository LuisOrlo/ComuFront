import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { ReservaRadio } from "@/services/radio.service"
import { formatDate, timeToMinutes } from "./radio-calendar.utils"

const ESTADO_CAL_STYLES: Record<
  string,
  { bg: string; accent: string; border: string; text: string; label: string }
> = {
  reservado: {
    bg: "bg-orange-50/90 hover:bg-orange-100/90",
    accent: "#fd761a",
    border: "border-orange-200",
    text: "text-orange-900",
    label: "Pendiente",
  },
  confirmado: {
    bg: "bg-emerald-50/90 hover:bg-emerald-100/90",
    accent: "#059669",
    border: "border-emerald-200",
    text: "text-emerald-900",
    label: "Confirmado",
  },
  en_progreso: {
    bg: "bg-blue-50/90 hover:bg-blue-100/90",
    accent: "#2563eb",
    border: "border-blue-200",
    text: "text-blue-900",
    label: "En progreso",
  },
  completado: {
    bg: "bg-slate-50/90 hover:bg-slate-100/90",
    accent: "#64748b",
    border: "border-slate-200",
    text: "text-slate-800",
    label: "Finalizado",
  },
  cancelado: {
    bg: "bg-rose-50/80 hover:bg-rose-100/80",
    accent: "#e11d48",
    border: "border-rose-200",
    text: "text-rose-900",
    label: "Cancelado",
  },
}

const ROW_HEIGHT = 52

function fmtHora(h: string) {
  return h.substring(0, 5)
}

export function RadioCalendar({
  weekDays,
  horas,
  reservas,
  onSelect,
}: {
  weekDays: Date[]
  horas: number[]
  reservas: ReservaRadio[]
  onSelect: (r: ReservaRadio) => void
}) {
  const today = new Date()

  return (
    <motion.div
      key="radio-calendar"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 sm:p-5"
    >
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
        {/* Cabecera de días (estilo AgendaPage) */}
        <div className="grid grid-cols-8 border-b border-slate-200/90 bg-slate-50/90 sticky top-0 z-10 backdrop-blur-xs">
          <div className="p-3 text-center border-r border-slate-200/80 flex items-center justify-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Hora
            </span>
          </div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div
                key={i}
                className={cn(
                  "py-2.5 px-1 text-center border-r border-slate-200/80 last:border-0 relative transition-colors",
                  isToday ? "bg-orange-50/60" : ""
                )}
              >
                {isToday && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#fd761a]" />
                )}
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-0.5">
                  {day.toLocaleDateString("es-ES", { weekday: "short" })}
                </div>
                <div className="inline-flex items-center justify-center">
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full transition-all",
                      isToday
                        ? "bg-[#fd761a] text-white font-extrabold shadow-xs"
                        : "text-slate-800"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ranuras de horas y emisiones */}
        <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
          {horas.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8"
              style={{ minHeight: ROW_HEIGHT }}
            >
              <div className="p-2 text-center border-r border-slate-200/80 bg-slate-50/40 flex items-center justify-center">
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
              {weekDays.map((day, di) => {
                const dateStr = formatDate(day)
                const isPast =
                  day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const isToday = day.toDateString() === today.toDateString()

                const r = reservas.find(
                  (rr) =>
                    rr.fecha_reserva === dateStr &&
                    hour >= parseInt(rr.hora_inicio.split(":")[0]) &&
                    hour <= parseInt(rr.hora_fin.split(":")[0])
                )
                const isFirst = r && hour === parseInt(r.hora_inicio.split(":")[0])

                return (
                  <div
                    key={di}
                    className={cn(
                      "border-r border-slate-100 last:border-0 relative overflow-visible transition-colors",
                      isPast
                        ? "bg-slate-50/40"
                        : isToday
                          ? "bg-orange-50/15 hover:bg-orange-50/40"
                          : "hover:bg-slate-50/70"
                    )}
                    style={{ minHeight: ROW_HEIGHT }}
                  >
                    {isFirst && r && (() => {
                      const es =
                        ESTADO_CAL_STYLES[r.estado] || ESTADO_CAL_STYLES.reservado
                      const inicioMin = timeToMinutes(r.hora_inicio)
                      const finHour = parseInt(r.hora_fin.split(":")[0])
                      const cellHour = hour * 60
                      const top = Math.max(0, ((inicioMin - cellHour) / 60) * ROW_HEIGHT)
                      const height = (finHour + 1 - hour) * ROW_HEIGHT - top
                      const clientName = r.persona
                        ? `${r.persona.nombres} ${r.persona.apellidos}`.trim()
                        : r.cliente_externo?.nombres || "—"

                      return (
                        <button
                          type="button"
                          onClick={() => onSelect(r)}
                          className={cn(
                            "absolute left-0.5 right-0.5 rounded-xl p-2 text-left cursor-pointer transition-all shadow-2xs border border-l-[3.5px] z-10 flex flex-col justify-between overflow-hidden",
                            es.bg,
                            es.border
                          )}
                          style={{
                            borderLeftColor: es.accent,
                            top,
                            height: Math.max(28, height - 4),
                          }}
                        >
                          <div className="flex items-center justify-between gap-1 leading-tight">
                            <span
                              className="text-[10px] font-extrabold tracking-tight"
                              style={{ color: es.accent }}
                            >
                              {fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)}
                            </span>
                            <span className="text-[9px] font-bold uppercase opacity-80 truncate">
                              {es.label}
                            </span>
                          </div>

                          <p className="text-[11px] font-bold text-slate-900 truncate leading-tight my-0.5">
                            {r.tarifa?.nombre || "Emisión Radial"}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-600 truncate leading-tight">
                            <span className="truncate">{clientName}</span>
                            {r.incluye_operador && r.operador && (
                              <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1 rounded ml-1 shrink-0">
                                Op: {r.operador.nombres.split(" ")[0]}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Convenciones de color al pie (estilo AgendaPage) */}
        <div className="flex flex-wrap items-center gap-4 p-4 border-t border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500">
          <span className="font-bold text-slate-700">Estados de emisión:</span>
          {Object.entries(ESTADO_CAL_STYLES).map(([key, item]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.accent }}
              />
              <span className="capitalize">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
