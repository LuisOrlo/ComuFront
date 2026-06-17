import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import type { ReservaPodcast } from "@/services/podcast.service"

function fmtDate(d: Date) { return d.toISOString().split("T")[0] }
function fmtHora(h: string) { return h.substring(0, 5) }

export function PodcastCalendar({ weekDays, horas, reservas, onSelect }: {
  weekDays: Date[]
  horas: number[]
  reservas: ReservaPodcast[]
  onSelect: (r: ReservaPodcast) => void
}) {
  const today = new Date()
  return (
    <motion.div key="sw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
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
        <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {horas.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[50px]">
              <div className="p-2 text-center border-r bg-gray-50/20 flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-[10px] font-mono font-bold opacity-40">{hour.toString().padStart(2, "0")}:00</span>
              </div>
              {weekDays.map((day, di) => {
                const dateStr = fmtDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const r = reservas.find(rr => rr.fecha_reserva === dateStr && hour >= parseInt(rr.hora_inicio.split(":")[0]) && hour < parseInt(rr.hora_fin.split(":")[0]))
                const first = r && hour === parseInt(r.hora_inicio.split(":")[0])
                return (
                  <div key={di} className={cn("p-0.5 border-r last:border-0 relative", isPast && "bg-gray-100/40")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {first && (
                      <button
                        onClick={() => onSelect(r)}
                        className={cn(
                          "w-full rounded-xl p-1.5 text-left hover:brightness-110 cursor-pointer border",
                          r.persona_id ? "bg-indigo-50 border-indigo-200" : "bg-emerald-50 border-emerald-200"
                        )}
                        style={{ height: `${Math.max(1, parseInt(r.hora_fin.split(":")[0]) - parseInt(r.hora_inicio.split(":")[0])) * 50 - 6}px` }}
                      >
                        <p className={cn("text-[9px] font-bold leading-tight truncate", r.persona_id ? "text-indigo-600" : "text-emerald-600")}>
                          {fmtHora(r.hora_inicio)}–{fmtHora(r.hora_fin)}
                        </p>
                        <p className="text-[8px] font-medium opacity-50 truncate">{r.paquete?.nombre}</p>
                      </button>
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
