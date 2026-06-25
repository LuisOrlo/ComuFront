import { motion } from "motion/react"

interface HealthBarProps {
  recaudado: number
  total: number
}

export function HealthBar({ recaudado, total }: HealthBarProps) {
  const pct = total > 0 ? (recaudado / total) * 100 : 0
  const barColor =
    pct >= 80 ? "oklch(0.55 0.15 150)" :
    pct >= 50 ? "oklch(0.65 0.15 75)" :
    "oklch(0.5 0.15 20)"

  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.93 0 0)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: barColor }}
      />
    </div>
  )
}
