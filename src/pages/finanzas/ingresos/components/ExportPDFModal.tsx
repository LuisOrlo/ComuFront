/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Download01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { generarIngresosPDF } from "./generarIngresosPDF"
import { toast } from "sonner"

interface Props {
  isOpen: boolean
  onClose: () => void
  data: any[]
  totales: any
  grafico: any[]
  graficoCategorias: any[]
  filtros: any
}

export function ExportPDFModal({ isOpen, onClose, data, totales, grafico, graficoCategorias, filtros }: Props) {
  const [includeChart, setIncludeChart] = useState(true)
  const [chartType, setChartType] = useState("bar")
  const [includeKPIs, setIncludeKPIs] = useState(true)
  const [includeTable, setIncludeTable] = useState(true)
  const [generating, setGenerating] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generarIngresosPDF(data, totales, grafico, graficoCategorias, filtros, {
        includeChart, chartType, includeKPIs, includeTable,
      })
      toast.success("PDF generado exitosamente")
      onClose()
    } catch { toast.error("Error al generar PDF") }
    finally { setGenerating(false) }
  }

  const chartTypes = [
    { value: "bar", label: "Barras — Ingresos por mes" },
    { value: "pie", label: "Dona — Distribución por categoría" },
    { value: "bar_h", label: "Barras H — Top servicios" },
  ]

  const BORDER = COLORS.BORDER_SUBTLE

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
          <h3 className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>Configurar Reporte PDF</h3>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <ToggleRow label="Incluir gráfico" checked={includeChart} onChange={setIncludeChart} />

          {includeChart && (
            <div className="pl-4 border-l-2 space-y-1.5" style={{ borderColor: `${COLORS.ACCENT}30` }}>
              <p className="text-[9px] font-bold uppercase opacity-40">Tipo de gráfico</p>
              {chartTypes.map(ct => (
                <label key={ct.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="chartType" value={ct.value} checked={chartType === ct.value}
                    onChange={() => setChartType(ct.value)}
                    className="accent-current" style={{ accentColor: COLORS.ACCENT }} />
                  <span className="text-[10px] font-medium">{ct.label}</span>
                </label>
              ))}
            </div>
          )}

          <ToggleRow label="Incluir resumen de KPIs" checked={includeKPIs} onChange={setIncludeKPIs} />
          <ToggleRow label="Incluir tabla de datos" checked={includeTable} onChange={setIncludeTable} />
        </div>

        <div className="px-5 py-4 border-t flex gap-2 justify-end" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100">Cancelar</button>
          <button onClick={handleGenerate} disabled={generating}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50 flex items-center gap-1.5"
            style={{ backgroundColor: COLORS.ACCENT }}>
            <HugeiconsIcon icon={Download01Icon} size={14} />
            {generating ? "Generando..." : "Generar PDF"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium" style={{ color: COLORS.CHARCOAL }}>{label}</span>
      <button onClick={() => onChange(!checked)}
        className="relative w-10 h-5.5 rounded-full transition-colors"
        style={{ backgroundColor: checked ? COLORS.ACCENT : "oklch(0.85 0 0)" }}>
        <span className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "1.3rem" : "0.15rem" }} />
      </button>
    </div>
  )
}
