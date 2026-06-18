import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import type { ReservaRadio } from "@/services/radio.service"
import { formatDate, timeToMinutes } from "./radio-calendar.utils"

const ESTADO_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  reservado: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", label: "Pendiente" },
  confirmado: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", label: "Confirmado" },
  en_progreso: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", label: "En progreso" },
  completado: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-500", label: "Finalizado" },
  cancelado: { bg: "bg-red-50", border: "border-red-200", text: "text-red-400", label: "Cancelado" },
}

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
            <div key={hour} className="grid grid-cols-8 min-h-[50px]">
              <div className="p-2 text-center border-r bg-gray-50/20 flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-[10px] font-mono font-bold opacity-40">{hour.toString().padStart(2, "0")}:00</span>
              </div>
              {weekDays.map((day, di) => {
                const dateStr = formatDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                const r = reservas.find(rr =>
                  rr.fecha_reserva === dateStr &&
                  hour >= parseInt(rr.hora_inicio.split(":")[0]) &&
                  hour < parseInt(rr.hora_fin.split(":")[0])
                )
                const first = r && hour === parseInt(r.hora_inicio.split(":")[0])

                return (
                  <div key={di} className={cn("p-0.5 border-r last:border-0 relative", isPast && "bg-gray-100/40")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {first && r && (() => {
                      const es = ESTADO_STYLES[r.estado] || ESTADO_STYLES.reservado
                      const duracionHoras = timeToMinutes(r.hora_fin) - timeToMinutes(r.hora_inicio)
                      return (
                        <button
                          onClick={() => onSelect(r)}
                          className={cn(
                            "w-full rounded-xl p-1.5 text-left hover:brightness-110 cursor-pointer border transition-all",
                            es.bg, es.border
                          )}
                          style={{ height: `${Math.max(1, duracionHoras / 60) * 50 - 6}px` }}
                        >
                          <p className={cn("text-[9px] font-bold leading-tight truncate", es.text)}>
                            {fmtHora(r.hora_inicio)}–{fmtHora(r.hora_fin)}
                          </p>
                          <p className="text-[8px] font-medium truncate opacity-60">{r.tarifa?.nombre}</p>
                          <p className="text-[7px] truncate opacity-40">
                            {r.persona ? `${r.persona.nombres.split(" ")[0]} ${r.persona.apellidos.split(" ")[0]}` : r.cliente_externo?.nombres}
                          </p>
                          {r.incluye_operador && r.operador && (
                            <p className="text-[7px] truncate opacity-30">Op: {r.operador.nombres.split(" ")[0]}</p>
                          )}
                        </button>
                      )
                    })()}
                    {!first && r && (
                      <div
                        className={cn("w-full rounded-xl border", r.estado === "cancelado" ? "border-red-200 bg-red-50/30" : r.estado === "completado" ? "border-gray-200 bg-gray-50/30" : "border-transparent")}
                      />
                    )}
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
