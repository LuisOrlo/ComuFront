import { COLORS } from "@/lib/constants"
import { ArrowUpRightIcon, ArrowDownRightIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Metricas } from "@/types/estadisticas"

function VariacionPill({ value }: { value: number | string | null }) {
  if (value === null || value === undefined || value === "—") {
    return <span className="text-[10px] font-medium opacity-30">—</span>
  }
  const n = typeof value === "string" ? parseFloat(value) : value
  const positivo = n >= 0
  const color = positivo ? "#16a34a" : "#dc2626"
  const bg = positivo ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)"
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ color, backgroundColor: bg }}>
      <HugeiconsIcon icon={positivo ? ArrowUpRightIcon : ArrowDownRightIcon} size={10} />
      {n > 0 ? "+" : ""}{n}%
    </span>
  )
}

export function ResumenEjecutivo({ m }: { m: Metricas }) {
  const format = (v: number) => "$" + Math.abs(v).toLocaleString()
  const balanceSigno = m.balance >= 0 ? "+" : "\u2212"

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="flex overflow-x-auto divide-x divide-gray-100 scrollbar-thin" style={{ scrollbarWidth: "thin" }}>
        <div className="flex-1 min-w-[160px] px-5 py-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Ingresos</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black" style={{ color: "#16a34a" }}>{format(m.ingresos)}</span>
            <VariacionPill value={m.vs_anio_anterior} />
          </div>
        </div>

        <div className="flex-1 min-w-[140px] px-5 py-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Egresos</p>
          <span className="text-3xl font-black" style={{ color: "#f97316" }}>{format(m.egresos)}</span>
        </div>

        <div className="flex-1 min-w-[200px] px-5 py-4 space-y-1"
          style={{ background: m.balance >= 0 ? "linear-gradient(135deg, rgba(22,163,74,0.04), rgba(22,163,74,0.01))" : "linear-gradient(135deg, rgba(220,38,38,0.04), rgba(220,38,38,0.01))" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Balance Neto</p>
          <span className="text-3xl font-black" style={{ color: m.balance >= 0 ? "#16a34a" : "#dc2626" }}>
            {balanceSigno}{format(m.balance)}
          </span>
          <p className="text-[10px] opacity-30">Margen: {m.margen_neto}%</p>
        </div>

        <div className="flex-1 min-w-[160px] px-5 py-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Estudiantes</p>
          <span className="text-3xl font-black" style={{ color: COLORS.CHARCOAL }}>{m.estudiantes_matriculados}</span>
          <p className="text-[10px] opacity-30">Matriculados</p>
        </div>
      </div>
    </div>
  )
}
