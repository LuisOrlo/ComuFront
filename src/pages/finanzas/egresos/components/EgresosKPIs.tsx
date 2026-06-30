import { HugeiconsIcon } from "@hugeicons/react"
import { MoneyIcon, UserIcon, AiFolderIcon, PackageIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE

function Variacion({ actual, previo }: { actual: number; previo?: number }) {
  if (!previo || previo === 0) return null
  const pct = ((actual - previo) / previo) * 100
  const bajo = pct <= 0
  return (
    <span className="text-[10px] font-bold ml-2" style={{ color: bajo ? "oklch(0.55 0.15 150)" : "#dc2626" }}>
      {bajo ? "▼" : "▲"} {Math.abs(Math.round(pct))}%
    </span>
  )
}

interface Totales {
  total: number; personal: number; servicios: number; equipos: number; varios: number
  previo_total?: number; previo_personal?: number; previo_servicios?: number; previo_varios?: number
}

export function EgresosKPIs({ totales }: { totales: Totales }) {
  const items = [
    { label: "Total egresado", value: totales.total, previo: totales.previo_total, color: "#dc2626", bg: "oklch(0.5 0.15 20 / 0.1)", icon: MoneyIcon },
    { label: "Personal", value: totales.personal, previo: totales.previo_personal, color: "#4f46e5", bg: "oklch(0.5 0.15 260 / 0.08)", icon: UserIcon },
    { label: "Servicios", value: totales.servicios, previo: totales.previo_servicios, color: "#d97706", bg: "oklch(0.5 0.15 80 / 0.08)", icon: AiFolderIcon },
    { label: "Varios", value: totales.varios, previo: totales.previo_varios, color: "#6b7280", bg: "oklch(0.5 0.02 0 / 0.06)", icon: PackageIcon },
  ]

  const pct = (v: number) => totales.total ? `${Math.round(v / totales.total * 100)}%` : ""

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border bg-white p-4 relative overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="absolute top-0 right-0 size-16 rounded-bl-full opacity-10" style={{ backgroundColor: item.color }} />
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <HugeiconsIcon icon={item.icon} size={14} style={{ color: item.color, opacity: 0.6 }} />
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">{item.label}</p>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <p className="text-xl font-black" style={{ color: i === 0 ? "#dc2626" : COLORS.CHARCOAL }}>
              ${(item.value || 0).toLocaleString()}
            </p>
            <span className="text-[10px] font-bold opacity-40">({pct(item.value)})</span>
            {item.previo !== undefined && <Variacion actual={item.value} previo={item.previo} />}
          </div>
        </div>
      ))}
    </div>
  )
}
