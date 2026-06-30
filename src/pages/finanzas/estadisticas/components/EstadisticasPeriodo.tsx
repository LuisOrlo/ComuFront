import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE

const OPTIONS = [
  { key: "este_mes", label: "Este mes" },
  { key: "trimestre", label: "Trimestre" },
  { key: "este_año", label: "Este año" },
  { key: "custom", label: "Personalizado" },
]

function getRange(periodo: string, customDesde: string, customHasta: string) {
  if (periodo === "custom") return { desde: customDesde, hasta: customHasta }
  const now = new Date()
  if (periodo === "este_mes") return { desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], hasta: now.toISOString().split("T")[0] }
  if (periodo === "trimestre") return { desde: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0], hasta: now.toISOString().split("T")[0] }
  return { desde: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0], hasta: now.toISOString().split("T")[0] }
}

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

interface Props {
  periodo: string
  setPeriodo: (p: string) => void
  customDesde: string
  setCustomDesde: (d: string) => void
  customHasta: string
  setCustomHasta: (d: string) => void
  onApply: (desde: string, hasta: string) => void
}

export function EstadisticasPeriodo({ periodo, setPeriodo, customDesde, setCustomDesde, customHasta, setCustomHasta, onApply }: Props) {
  const r = getRange(periodo, customDesde, customHasta)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl">
          {OPTIONS.map(o => (
            <button key={o.key} onClick={() => setPeriodo(o.key)}
              className="px-4 py-1.5 rounded-[10px] text-[11px] font-bold transition-all"
              style={periodo === o.key ? { backgroundColor: "#fff", color: COLORS.CHARCOAL, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: COLORS.TEXT_MUTED }}>
              {o.label}
            </button>
          ))}
        </div>
        {periodo === "custom" && (
          <>
            <input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)}
              className="px-3 py-1.5 rounded-xl border bg-gray-50 text-[10px] font-medium w-[140px]" style={{ borderColor: BORDER }} />
            <span className="text-[10px] opacity-30">—</span>
            <input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)}
              className="px-3 py-1.5 rounded-xl border bg-gray-50 text-[10px] font-medium w-[140px]" style={{ borderColor: BORDER }} />
            <button onClick={() => onApply(customDesde, customHasta)}
              className="px-4 py-1.5 rounded-xl text-[10px] font-bold text-white" style={{ backgroundColor: COLORS.ACCENT }}>
              Aplicar
            </button>
          </>
        )}
      </div>
      <p className="text-[10px] opacity-30 tracking-wide">
        Mostrando datos del {fmt(r.desde)} al {fmt(r.hasta)}
      </p>
    </div>
  )
}
