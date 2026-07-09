import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import type { ReservaRadio } from "@/services/radio.service"
import { formatDate, timeToMinutes } from "./radio-calendar.utils"

const ESTADO_STYLES: Record<string, { bg: string; accent: string; border: string; text: string; label: string }> = {
  reservado: { bg: "bg-orange-50", accent: "bg-orange-400", border: "border-orange-200", text: "text-orange-700", label: "Pendiente" },
  confirmado: { bg: "bg-emerald-50", accent: "bg-emerald-400", border: "border-emerald-200", text: "text-emerald-700", label: "Confirmado" },
  en_progreso: { bg: "bg-blue-50", accent: "bg-blue-400", border: "border-blue-200", text: "text-blue-700", label: "En progreso" },
  completado: { bg: "bg-gray-50", accent: "bg-gray-400", border: "border-gray-200", text: "text-gray-500", label: "Finalizado" },
  cancelado: { bg: "bg-red-50", accent: "bg-red-300", border: "border-red-200", text: "text-red-400", label: "Cancelado" },
}

const ROW_HEIGHT = 50

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
    <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        {/* Header */}
        <div className="grid grid-cols-8 border-b bg-gradient-to-b from-gray-50 to-gray-100/80" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="p-2.5 text-center border-r flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Hora</span>
          </div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div key={i} className={cn("p-2.5 text-center border-r last:border-0 relative", isToday && "bg-amber-50/80")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {isToday && <div className="absolute -top-px left-1 right-1 h-[3px] bg-amber-400 rounded-b-full" />}
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-0.5">{day.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                <div className={cn("text-base font-bold", isToday && "text-amber-600")} style={{ color: isToday ? undefined : COLORS.CHARCOAL }}>{day.getDate()}</div>
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {horas.map(hour => (
            <div key={hour} className="grid grid-cols-8" style={{ minHeight: ROW_HEIGHT }}>
              <div className="p-2 text-center border-r bg-gray-50/20 flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-[10px] font-mono font-bold opacity-40">{hour.toString().padStart(2, "0")}:00</span>
              </div>
              {weekDays.map((day, di) => {
                const dateStr = formatDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                const r = reservas.find(rr =>
                  rr.fecha_reserva === dateStr &&
                  hour >= parseInt(rr.hora_inicio.split(":")[0]) &&
                  hour <= parseInt(rr.hora_fin.split(":")[0])
                )
                const isFirst = r && hour === parseInt(r.hora_inicio.split(":")[0])

                return (
                  <div
                    key={di}
                    className={cn(
                      "border-r last:border-0 relative overflow-visible",
                      isPast && "bg-gray-100/40"
                    )}
                    style={{ borderColor: COLORS.BORDER_SUBTLE, minHeight: ROW_HEIGHT }}
                  >
                    {isFirst && r && (() => {
                      const es = ESTADO_STYLES[r.estado] || ESTADO_STYLES.reservado
                      const inicioMin = timeToMinutes(r.hora_inicio)
                      const finHour = parseInt(r.hora_fin.split(":")[0])
                      const cellHour = hour * 60
                      const top = Math.max(0, ((inicioMin - cellHour) / 60) * ROW_HEIGHT)
                      const height = ((finHour + 1 - hour) * ROW_HEIGHT) - top

                      return (
                        <button
                          onClick={() => onSelect(r)}
                          className={cn(
                            "group absolute left-0.5 right-0.5 rounded-lg text-left cursor-pointer transition-all overflow-visible border z-10",
                            es.bg, es.border, "hover:shadow-md hover:brightness-105"
                          )}
                          style={{ top, height: Math.max(24, height - 2) }}
                        >
                          <div className="flex h-full">
                            <div className={cn("w-1 shrink-0 rounded-l-[5px]", es.accent)} />
                            <div className="flex-1 min-w-0 overflow-hidden p-1.5 flex flex-col justify-center gap-px">
                              <div className="flex items-center gap-1">
                                <div className={cn("size-1.5 rounded-full shrink-0", es.accent)} />
                                <p className={cn("text-[11px] font-bold leading-tight truncate", es.text)}>
                                  {fmtHora(r.hora_inicio)}–{fmtHora(r.hora_fin)}
                                </p>
                              </div>
                              <p className="text-[10px] font-semibold truncate opacity-75 leading-tight">
                                {r.tarifa?.nombre || "Sin tarifa"}
                              </p>
                              <p className="text-[9px] truncate opacity-45 leading-tight">
                                {r.persona
                                  ? `${r.persona.nombres.split(" ")[0]} ${r.persona.apellidos.split(" ")[0]}`
                                  : r.cliente_externo?.nombres || "—"}
                              </p>
                              {r.incluye_operador && r.operador && (
                                <p className="text-[8px] truncate opacity-30 leading-tight">
                                  Op: {r.operador.nombres.split(" ")[0]}
                                </p>
                              )}
                            </div>
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
      </div>
    </motion.div>
  )
}
