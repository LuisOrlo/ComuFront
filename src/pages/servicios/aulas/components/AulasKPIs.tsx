import { useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home02Icon, Calendar03Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import type { Aula, ReservaAula } from "@/services/aulas.service"

function fmtDate(d: Date) { return d.toISOString().split("T")[0] }

export function AulasKPIs({ aulas, reservas }: { aulas: Aula[]; reservas: ReservaAula[] }) {
  const today = fmtDate(new Date())

  const stats = useMemo(() => {
    const totalAulas = aulas.length
    const disponibles = aulas.filter(a =>
      !reservas.some(r =>
        r.aula_id === a.id &&
        r.fecha_reserva === today &&
        r.estado !== "cancelado" &&
        r.hora_inicio <= `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}` &&
        r.hora_fin > `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`
      )
    ).length

    const hoyCount = reservas.filter(r =>
      r.fecha_reserva === today && r.estado !== "cancelado"
    ).length

    const next7Days = new Date()
    next7Days.setDate(next7Days.getDate() + 7)
    const proximas = reservas.filter(r => {
      const d = new Date(r.fecha_reserva + "T00:00:00")
      return d >= new Date(today + "T00:00:00") && d <= next7Days && r.estado !== "cancelado" && r.estado !== "completado"
    }).length

    return { totalAulas, disponibles, hoyCount, proximas }
  }, [aulas, reservas, today])

  const cards = [
    {
      icon: Home02Icon,
      label: "TOTAL AULAS",
      value: stats.totalAulas.toString(),
      sub: `${stats.disponibles} disponibles ahora`,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      icon: Calendar03Icon,
      label: "RESERVAS DE HOY",
      value: stats.hoyCount.toString(),
      sub: "Programadas para el día",
      iconBg: "bg-[#ffdbca] text-[#9d4300]",
    },
    {
      icon: Clock01Icon,
      label: "PRÓXIMAS RESERVAS",
      value: stats.proximas.toString(),
      sub: "Próximos 7 días",
      iconBg: "bg-emerald-50 text-emerald-700",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              {card.label}
            </span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {card.value}
            </span>
            {card.sub && (
              <span className="text-xs text-slate-500 font-medium mt-0.5">{card.sub}</span>
            )}
          </div>
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
            <HugeiconsIcon icon={card.icon} size={20} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
