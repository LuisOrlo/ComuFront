import { useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Microphone, Clock01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { ReservaPodcast } from "@/services/podcast.service"

function fmtDate(d: Date) { return d.toISOString().split("T")[0] }

export function PodcastKPIs({ reservas }: { reservas: ReservaPodcast[] }) {
  const today = fmtDate(new Date())

  const stats = useMemo(() => {
    const now = new Date()
    const todayReservas = reservas.filter(r => r.fecha_reserva === today)
    const hoyCount = todayReservas.length
    const hoyEnProgreso = todayReservas.filter(r => r.estado === "en_progreso" || r.estado === "confirmado").length

    const next7Days = new Date()
    next7Days.setDate(next7Days.getDate() + 7)
    const proximas = reservas.filter(r => {
      const d = new Date(r.fecha_reserva + "T00:00:00")
      return d >= new Date(today + "T00:00:00") && d <= next7Days && r.estado !== "cancelado" && r.estado !== "completado"
    }).length

    const hoyHorasOcupadas = todayReservas.filter(r => r.estado !== "cancelado").reduce((acc, r) => {
      const [h1, m1] = r.hora_inicio.split(":").map(Number)
      const [h2, m2] = r.hora_fin.split(":").map(Number)
      return acc + ((h2 + m2 / 60) - (h1 + m1 / 60))
    }, 0)
    const horaActual = now.getHours() + now.getMinutes() / 60
    const horasRestantes = Math.max(0, 20 - Math.max(7, horaActual))
    const disponibilidad = Math.max(0, horasRestantes - hoyHorasOcupadas)

    return { hoyCount, hoyEnProgreso, proximas, disponibilidad }
  }, [reservas, today])

  const cards = [
    {
      icon: Microphone,
      label: "Reservas de Hoy",
      value: stats.hoyCount.toString(),
      sub: stats.hoyEnProgreso > 0 ? `${stats.hoyEnProgreso} en progreso` : undefined,
      color: "oklch(0.62 0.16 245)",
      bg: "oklch(0.62 0.16 245 / 0.1)",
    },
    {
      icon: Clock01Icon,
      label: "Próximas Reservas",
      value: stats.proximas.toString(),
      sub: "Próximos 7 días",
      color: "oklch(0.62 0.14 85)",
      bg: "oklch(0.62 0.14 85 / 0.12)",
    },
    {
      icon: UserIcon,
      label: "Disponibilidad Hoy",
      value: `${Math.floor(stats.disponibilidad)} hrs`,
      sub: stats.disponibilidad > 0 ? "Libre" : "Completo",
      color: "oklch(0.55 0.18 15)",
      bg: "oklch(0.55 0.18 15 / 0.1)",
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
