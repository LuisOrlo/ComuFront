import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import type { ReservaRadio } from "@/services/radio.service"

const ESTADO_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  reservado: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" },
  confirmado: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700" },
  en_progreso: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  completado: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-500" },
  cancelado: { bg: "bg-red-50", border: "border-red-200", text: "text-red-400 line-through" },
}

const ESTADO_LABELS: Record<string, string> = {
  reservado: "Pendiente",
  confirmado: "Confirmado",
  en_progreso: "En progreso",
  completado: "Finalizado",
  cancelado: "Cancelado",
}

function fmtHora(h: string) {
  return h.substring(0, 5)
}

function timeToMinutes(t: string) {
  const p = t.split(":")
  return parseInt(p[0]) * 60 + parseInt(p[1] || "0")
}

export function RadioTimeline({
  fecha,
  reservas,
  onSelectReserva,
  onCreateReserva,
}: {
  fecha: Date
  reservas: ReservaRadio[]
  onSelectReserva: (r: ReservaRadio) => void
  onCreateReserva: (horaInicio: string) => void
}) {
  const HORA_INICIO = 7
  const HORA_FIN = 21
  const TOTAL_MINUTOS = (HORA_FIN - HORA_INICIO) * 60
  const hours = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)

  const hoy = new Date()
  const fechaStr = fecha.toISOString().split("T")[0]
  const isToday = fecha.toDateString() === hoy.toDateString()

  return (
    <motion.div
      key={fechaStr}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        {/* Timeline header */}
        <div className="flex items-center border-b px-4 py-3 bg-gradient-to-b from-gray-50 to-gray-100/80" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="w-16 shrink-0" />
          <div className="flex-1 text-center">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
              {fecha.toLocaleDateString("es-ES", { weekday: "long" })}
            </span>
            <span className={cn("text-lg font-bold ml-2", isToday && "text-amber-600")}>
              {fecha.getDate()}
            </span>
          </div>
        </div>

        {/* Timeline body */}
        <div className="relative">
          {/* Grid de horas */}
          {hours.map(hour => {
            const isNow = isToday && hour === hoy.getHours()
            return (
              <div
                key={hour}
                className={cn(
                  "flex border-b h-14 relative group hover:bg-gray-50/50 transition-colors cursor-pointer",
                  isNow && "bg-amber-50/30"
                )}
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
                onClick={() => {
                  const hh = hour.toString().padStart(2, "0")
                  onCreateReserva(`${hh}:00`)
                }}
              >
                <div className="w-16 shrink-0 flex items-start justify-center pt-1 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <span className="text-[10px] font-mono font-bold opacity-40">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
                <div className="flex-1 relative">
                  {/* Línea de "ahora" */}
                  {isNow && hour === hoy.getHours() && (
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-amber-400 z-10"
                      style={{ top: `${(hoy.getMinutes() / 60) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            )
          })}

          {/* Bloques de reservas superpuestos */}
          {reservas
            .filter(r => r.estado !== "cancelado")
            .filter(r => {
              const inicio = timeToMinutes(r.hora_inicio)
              const fin = timeToMinutes(r.hora_fin)
              return fin > HORA_INICIO * 60 && inicio < HORA_FIN * 60
            })
            .map(r => {
              const inicio = Math.max(timeToMinutes(r.hora_inicio), HORA_INICIO * 60)
              const fin = Math.min(timeToMinutes(r.hora_fin), HORA_FIN * 60)
              const top = ((inicio - HORA_INICIO * 60) / TOTAL_MINUTOS) * 100
              const height = ((fin - inicio) / TOTAL_MINUTOS) * 100
              const cs = ESTADO_COLORS[r.estado] || ESTADO_COLORS.reservado

              return (
                <button
                  key={r.id}
                  onClick={(e) => { e.stopPropagation(); onSelectReserva(r) }}
                  className={cn(
                    "absolute left-[68px] right-2 rounded-xl border p-2 text-left hover:brightness-95 transition-all cursor-pointer z-20 overflow-hidden",
                    cs.bg, cs.border
                  )}
                  style={{ top: `${top}%`, height: `${Math.max(height, 3.5)}%` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs font-bold leading-tight truncate", cs.text)}>
                        {fmtHora(r.hora_inicio)}–{fmtHora(r.hora_fin)}
                      </p>
                      <p className="text-[10px] font-medium opacity-60 truncate">
                        {r.tarifa?.nombre}
                      </p>
                      <p className="text-[9px] opacity-40 truncate">
                        {r.persona ? `${r.persona.nombres} ${r.persona.apellidos}` : r.cliente_externo?.nombres}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", cs.bg, cs.text)}>
                        {ESTADO_LABELS[r.estado] || r.estado}
                      </span>
                      {r.incluye_operador && r.operador && (
                        <span className="text-[8px] font-medium opacity-40 truncate max-w-[80px]">
                          Op: {r.operador.nombres.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] font-bold opacity-70">
                      ${r.precio_total.toFixed(2)}
                    </span>
                  </div>
                </button>
              )
            })}

          {/* Indicador de espacio libre al hacer hover */}
          {hours.map(hour => (
            <div
              key={`hover-${hour}`}
              className="absolute left-[68px] right-2 h-14 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10"
              style={{ top: `${((hour - HORA_INICIO) / (HORA_FIN - HORA_INICIO)) * 100}%` }}
            >
              <div className="h-full w-full border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">Click para reservar</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
