import { COLORS } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoneyIcon, GraduationCapIcon, AiFolderIcon, SchoolIcon, InvoiceIcon } from "@hugeicons/core-free-icons"

const BORDER = COLORS.BORDER_SUBTLE

interface KPIData {
  total: number
  egresos?: number
  balance?: number
  cursos: number
  servicios: number
  otros: number
  talleres?: number
  previo_total?: number
  previo_cursos?: number
  previo_servicios?: number
  previo_otros?: number
}

function Variacion({ actual, previo }: { actual: number; previo?: number }) {
  if (!previo || previo === 0) return null
  const pct = ((actual - previo) / previo) * 100
  const subio = pct >= 0
  return (
    <span className="text-[10px] font-bold ml-2" style={{ color: subio ? "oklch(0.55 0.15 150)" : "#dc2626" }}>
      {subio ? "▲" : "▼"} {Math.abs(Math.round(pct))}%
    </span>
  )
}

export function IngresosKPIs({ totales }: { totales: KPIData }) {
  const balance = totales.balance ?? totales.total
  const egresos = totales.egresos ?? 0
  const items = [
    { label: "Balance Neto", value: balance, color: "oklch(0.55 0.15 150)", bg: "oklch(0.55 0.15 150 / 0.1)", icon: MoneyIcon },
    { label: "Total ingresado", value: totales.total, previo: totales.previo_total, color: "#059669", bg: "oklch(0.55 0.15 150 / 0.06)", icon: InvoiceIcon },
    { label: "Egresos", value: egresos, color: "#dc2626", bg: "oklch(0.55 0.15 30 / 0.08)", icon: InvoiceIcon },
    { label: "Cursos", value: totales.cursos, previo: totales.previo_cursos, color: "#059669", bg: "oklch(0.55 0.15 150 / 0.08)", icon: GraduationCapIcon },
    { label: "Servicios", value: totales.servicios, previo: totales.previo_servicios, color: "#7c3aed", bg: "oklch(0.5 0.15 280 / 0.08)", icon: AiFolderIcon },
    { label: "Talleres", value: totales.talleres ?? 0, color: "#0891b2", bg: "oklch(0.6 0.15 200 / 0.08)", icon: SchoolIcon },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item, i) => {
        const displayValue = i === 2 ? -Math.abs(item.value) : item.value
        return (
          <div key={i} className="rounded-2xl border bg-white p-4 relative overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="absolute top-0 right-0 size-16 rounded-bl-full opacity-10" style={{ backgroundColor: item.color }} />
            <div className="flex items-center gap-2 mb-1 relative z-10">
              <HugeiconsIcon icon={item.icon} size={14} style={{ color: item.color, opacity: 0.6 }} />
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">{item.label}</p>
            </div>
            <div className="flex items-baseline gap-1 relative z-10">
              <p className="text-xl font-black" style={{ color: item.color }}>
                {i === 2 ? "-$" : "$"}{Math.abs(displayValue || 0).toLocaleString()}
              </p>
              {item.previo !== undefined && <Variacion actual={item.value} previo={item.previo} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
