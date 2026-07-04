import { COLORS } from "@/lib/constants"

interface Totales {
  total: number
  pendiente: number
  en_progreso: number
  completada: number
}

const cards = [
  { key: "total" as const, label: "Total de tareas", color: COLORS.CHARCOAL },
  { key: "pendiente" as const, label: "Pendientes", color: "oklch(0.55 0.01 0)" },
  { key: "en_progreso" as const, label: "En progreso", color: "oklch(0.55 0.14 250)" },
  { key: "completada" as const, label: "Completadas", color: "oklch(0.55 0.14 145)" },
]

export function TareaSummaryCards({ totales }: { totales: Totales }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border bg-white p-4"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: COLORS.TEXT_MUTED }}>
            {card.label}
          </p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: card.color }}>
            {totales[card.key]}
          </p>
        </div>
      ))}
    </div>
  )
}
