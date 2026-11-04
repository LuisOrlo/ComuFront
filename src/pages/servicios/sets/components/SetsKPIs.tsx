import { useMemo } from "react"
import { motion } from "motion/react"
import { Video, Calendar, Clock } from "lucide-react"
import { COLORS } from "@/lib/constants"
import type { SetItem, ReservaSet } from "@/services/sets.service"

function fmtDate(d: Date) {
  return d.toISOString().split("T")[0]
}

export function SetsKPIs({ sets, reservas }: { sets: SetItem[]; reservas: ReservaSet[] }) {
  const today = fmtDate(new Date())

  const stats = useMemo(() => {
    const totalSets = sets.length
    const activos = sets.filter((s) => s.activo !== false).length

    const hoyCount = reservas.filter(
      (r) => r.fecha_reserva === today && r.estado !== "cancelado"
    ).length

    const next7Days = new Date()
    next7Days.setDate(next7Days.getDate() + 7)
    const proximas = reservas.filter((r) => {
      const d = new Date(r.fecha_reserva + "T00:00:00")
      return (
        d >= new Date(today + "T00:00:00") &&
        d <= next7Days &&
        r.estado !== "cancelado" &&
        r.estado !== "completado"
      )
    }).length

    return { totalSets, activos, hoyCount, proximas }
  }, [sets, reservas, today])

  const cards = [
    {
      icon: Video,
      label: "TOTAL SETS",
      value: stats.totalSets.toString(),
      sub: `${stats.activos} sets operativos`,
      iconBg: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Calendar,
      label: "RESERVAS DE HOY",
      value: stats.hoyCount.toString(),
      sub: "Agendadas para el día",
      iconBg: "bg-[#ffdbca] text-[#9d4300]",
    },
    {
      icon: Clock,
      label: "PRÓXIMAS RESERVAS",
      value: stats.proximas.toString(),
      sub: "En los próximos 7 días",
      iconBg: "bg-emerald-50 text-emerald-700",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const IconComponent = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="rounded-2xl border bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                {card.label}
              </span>
              <div className={`flex size-10 items-center justify-center rounded-xl ${card.iconBg} shadow-2xs`}>
                <IconComponent className="size-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{card.sub}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
