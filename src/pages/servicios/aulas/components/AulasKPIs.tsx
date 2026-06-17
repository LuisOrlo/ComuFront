import { useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home02Icon, Calendar03Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
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
      label: "Total Aulas",
      value: stats.totalAulas.toString(),
      sub: `${stats.disponibles} disponibles ahora`,
      color: "oklch(0.62 0.16 245)",
      bg: "oklch(0.62 0.16 245 / 0.1)",
    },
    {
      icon: Calendar03Icon,
      label: "Reservas de Hoy",
      value: stats.hoyCount.toString(),
      sub: undefined,
      color: "oklch(0.62 0.14 85)",
      bg: "oklch(0.62 0.14 85 / 0.12)",
    },
    {
      icon: Clock01Icon,
      label: "Próximas Reservas",
      value: stats.proximas.toString(),
      sub: "Próximos 7 días",
      color: "oklch(0.58 0.16 145)",
      bg: "oklch(0.58 0.16 145 / 0.1)",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 30 }}
          className="relative rounded-2xl border bg-white p-5 flex items-center gap-4 overflow-hidden"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <motion.div
            className="absolute -top-6 -right-6 size-20 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: card.bg }}
          />
          <div
            className="relative z-10 flex items-center justify-center size-11 rounded-xl shrink-0"
            style={{ backgroundColor: card.bg }}
          >
            <HugeiconsIcon icon={card.icon} size={20} style={{ color: card.color }} />
          </div>
          <div className="relative z-10 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40" style={{ color: COLORS.CHARCOAL }}>
              {card.label}
            </p>
            <p className="text-2xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
              {card.value}
            </p>
            {card.sub && (
              <p className="text-[10px] font-medium mt-0.5 opacity-35">{card.sub}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
