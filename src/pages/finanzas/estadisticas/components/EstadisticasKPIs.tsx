import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE

interface KPIData {
  balance: number; ingresos: number; egresos: number; margen_neto: number; vs_anio_anterior: number | null
}

export function EstadisticasKPIs({ m }: { m: KPIData }) {
  const pctBar = m.ingresos > 0 ? Math.min(100, Math.max(0, ((m.ingresos - m.egresos) / m.ingresos) * 100)) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-2 rounded-2xl border p-6 relative overflow-hidden" style={{ borderColor: BORDER, backgroundColor: m.balance >= 0 ? "oklch(0.55 0.15 150 / 0.04)" : "oklch(0.5 0.15 20 / 0.04)" }}>
        <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Balance Neto</p>
        <p className="text-4xl font-black tracking-tight" style={{ color: m.balance >= 0 ? "#16a34a" : "#dc2626" }}>
          {m.balance >= 0 ? "+" : ""}${Math.abs(m.balance || 0).toLocaleString()}
        </p>
        <div className="flex items-center gap-3 mt-3 text-[11px]">
          <span style={{ color: "#16a34a" }}>Ingresos ${(m.ingresos || 0).toLocaleString()}</span>
          <span className="opacity-20">|</span>
          <span style={{ color: "#f97316" }}>Egresos ${(m.egresos || 0).toLocaleString()}</span>
        </div>
        <div className="mt-3 w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.9 0 0)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctBar}%`, backgroundColor: pctBar >= 70 ? "#16a34a" : pctBar >= 30 ? "#f97316" : "#dc2626" }} />
        </div>
      </div>

      <KPIBox label="Margen Neto" value={`${m.margen_neto ?? 0}%`} color="#3b82f6" />
      <KPIBox label="vs Año Anterior" value={typeof m.vs_anio_anterior === 'number' ? `${m.vs_anio_anterior > 0 ? "+" : ""}${m.vs_anio_anterior}%` : "—"} color={typeof m.vs_anio_anterior === 'number' && m.vs_anio_anterior > 0 ? "#16a34a" : "#6b7280"} />
    </div>
  )
}

function KPIBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden flex flex-col justify-center" style={{ borderColor: BORDER }}>
      <div className="absolute top-0 right-0 size-16 rounded-bl-full opacity-10" style={{ backgroundColor: color }} />
      <p className="text-xs font-bold uppercase tracking-widest opacity-40 relative z-10">{label}</p>
      <p className="text-2xl font-black mt-1 relative z-10" style={{ color }}>{value}</p>
    </div>
  )
}
