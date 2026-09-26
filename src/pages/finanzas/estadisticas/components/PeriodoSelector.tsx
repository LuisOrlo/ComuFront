import { useCallback, useState, useEffect } from "react"
import {
  Download04Icon,
  Calendar01Icon,
  Analytics01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { exportarEstadisticasPDF } from "@/hooks/useExportPdf"
import type { EstadisticasResponse } from "@/types/estadisticas"
import { cn } from "@/lib/utils"

const OPCIONES = [
  { key: "este_mes", label: "Este mes" },
  { key: "trimestre", label: "Trimestre" },
  { key: "este_año", label: "Este año" },
  { key: "custom", label: "Personalizado" },
]

function fmt(d: string) {
  if (!d) return "—"
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-EC", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return d
  }
}

function getRange(periodo: string, customDesde: string, customHasta: string) {
  if (periodo === "custom") return { desde: customDesde, hasta: customHasta }
  const now = new Date()
  if (periodo === "este_mes") {
    return {
      desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
      hasta: now.toISOString().split("T")[0],
    }
  }
  if (periodo === "trimestre") {
    return {
      desde: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        .toISOString()
        .split("T")[0],
      hasta: now.toISOString().split("T")[0],
    }
  }
  return {
    desde: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
    hasta: now.toISOString().split("T")[0],
  }
}

interface Props {
  periodo: string
  setPeriodo: (p: string) => void
  customDesde: string
  setCustomDesde: (d: string) => void
  customHasta: string
  setCustomHasta: (d: string) => void
  onApply: (desde: string, hasta: string) => void
  loading: boolean
  data: EstadisticasResponse | null | undefined
}

export function PeriodoSelector({
  periodo,
  setPeriodo,
  customDesde,
  setCustomDesde,
  customHasta,
  setCustomHasta,
  onApply,
  loading,
  data,
}: Props) {
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
    await exportarEstadisticasPDF(data)
  }, [loading, data])

  const r = getRange(periodo, customDesde, customHasta)

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Live Badge */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-slate-900 text-[#fd761a] flex items-center justify-center shadow-xs shrink-0">
            <HugeiconsIcon icon={Analytics01Icon} size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Estadísticas
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 border border-slate-200/60">
                <span className="size-1.5 rounded-full bg-[#fd761a] animate-pulse" />
                En tiempo real
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Análisis financiero, académico y operativo institucional
            </p>
          </div>
        </div>

        {/* Center & Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Control Pills */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/70 shadow-inner">
            {OPCIONES.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setPeriodo(o.key)}
                className={cn(
                  "px-3 sm:px-3.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer",
                  periodo === o.key
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {periodo === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={debounceDesde}
                onChange={(e) => setDebounceDesde(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#fd761a]"
              />
              <span className="text-xs text-slate-400">—</span>
              <input
                type="date"
                value={debounceHasta}
                onChange={(e) => setDebounceHasta(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#fd761a]"
              />
              <button
                type="button"
                onClick={() => {
                  setCustomDesde(debounceDesde)
                  setCustomHasta(debounceHasta)
                  onApply(debounceDesde, debounceHasta)
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06512] transition-colors cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Date Range Display */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
            <HugeiconsIcon icon={Calendar01Icon} size={15} className="text-slate-400" />
            <span className="font-mono tracking-tight font-medium">
              {fmt(r.desde)} — {fmt(r.hasta)}
            </span>
          </div>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || !data}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <HugeiconsIcon icon={Download04Icon} size={15} className="text-[#fd761a]" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>
    </header>
  )
}
