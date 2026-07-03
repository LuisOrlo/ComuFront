import { useCallback, useState, useEffect } from "react"
import { COLORS } from "@/lib/constants"
import { Download04Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { exportarEstadisticasPDF } from "@/hooks/useExportPdf"

const BORDER = COLORS.BORDER_SUBTLE
const ACCENT = COLORS.ACCENT

const OPCIONES = [
  { key: "este_mes", label: "Este mes" },
  { key: "trimestre", label: "Trimestre" },
  { key: "este_año", label: "Este año" },
  { key: "custom", label: "Personalizado" },
]

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

function getRange(periodo: string, customDesde: string, customHasta: string) {
  if (periodo === "custom") return { desde: customDesde, hasta: customHasta }
  const now = new Date()
  if (periodo === "este_mes") return { desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], hasta: now.toISOString().split("T")[0] }
  if (periodo === "trimestre") return { desde: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0], hasta: now.toISOString().split("T")[0] }
  return { desde: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0], hasta: now.toISOString().split("T")[0] }
}

interface Props {
  periodo: string
  setPeriodo: (p: string) => void
  customDesde: string
  setCustomDesde: (d: string) => void
  customHasta: string
  setCustomHasta: (d: string) => void
  onApply: (desde: string, hasta: string) => void
  seccionesRef: React.MutableRefObject<Map<string, HTMLDivElement>>
  loading: boolean
  data: unknown | null
}

export function PeriodoSelector({ periodo, setPeriodo, customDesde, setCustomDesde, customHasta, setCustomHasta, onApply, seccionesRef, loading, data }: Props) {
  const [debounceDesde, setDebounceDesde] = useState(customDesde)
  const [debounceHasta, setDebounceHasta] = useState(customHasta)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debounceDesde !== customDesde || debounceHasta !== customHasta) {
        setCustomDesde(debounceDesde)
        setCustomHasta(debounceHasta)
      }
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceDesde, debounceHasta])

  const handleExport = useCallback(async () => {
    if (loading || !data) return
    await exportarEstadisticasPDF(seccionesRef)
  }, [loading, data, seccionesRef])

  const r = getRange(periodo, customDesde, customHasta)

  return (
    <header className="sticky top-0 z-30 shrink-0 px-4 lg:px-8 py-3 border-b bg-white/95 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ borderColor: BORDER }}>
      <h1 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Estadísticas</h1>

      <div className="flex flex-1 items-center gap-2 flex-wrap">
        <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl">
          {OPCIONES.map(o => (
            <button key={o.key} onClick={() => setPeriodo(o.key)}
              className="px-3 lg:px-4 py-1.5 rounded-[10px] text-[11px] font-bold transition-all whitespace-nowrap"
              style={periodo === o.key ? { backgroundColor: "#fff", color: COLORS.CHARCOAL, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: COLORS.TEXT_MUTED }}>
              {o.label}
            </button>
          ))}
        </div>
        {periodo === "custom" && (
          <div className="flex items-center gap-1">
            <input type="date" value={debounceDesde} onChange={e => setDebounceDesde(e.target.value)}
              className="px-3 py-1.5 rounded-xl border bg-gray-50 text-[10px] font-medium w-[130px] lg:w-[140px]" style={{ borderColor: BORDER }} />
            <span className="text-[10px] opacity-30">—</span>
            <input type="date" value={debounceHasta} onChange={e => setDebounceHasta(e.target.value)}
              className="px-3 py-1.5 rounded-xl border bg-gray-50 text-[10px] font-medium w-[130px] lg:w-[140px]" style={{ borderColor: BORDER }} />
            <button onClick={() => { setCustomDesde(debounceDesde); setCustomHasta(debounceHasta); onApply(debounceDesde, debounceHasta) }}
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white" style={{ backgroundColor: ACCENT }}>
              Aplicar
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <p className="text-[10px] opacity-30 tracking-wide hidden lg:block">
          {fmt(r.desde)} — {fmt(r.hasta)}
        </p>
        <button onClick={handleExport} disabled={loading || !data}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-colors hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderColor: BORDER, color: COLORS.TEXT_MUTED }}>
          <HugeiconsIcon icon={Download04Icon} size={13} />
          Exportar PDF
        </button>
      </div>
    </header>
  )
}
