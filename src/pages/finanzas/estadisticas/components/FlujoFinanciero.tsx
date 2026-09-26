/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Award01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { MesFinanciero } from "@/types/estadisticas"
import { cn } from "@/lib/utils"

const GREEN = "#10b981"
const ORANGE = "#fd761a"
const BLUE = "#3b82f6"

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
]

function mesLabel(mesStr: string): string {
  if (!mesStr) return ""
  const parts = mesStr.split("-")
  if (parts.length >= 2) {
    const idx = parseInt(parts[1], 10) - 1
    return MESES[idx] ?? mesStr
  }
  return mesStr
}

type ChartMode = "barras" | "lineas" | "area"

const MODES: { key: ChartMode; label: string }[] = [
  { key: "barras", label: "Barras" },
  { key: "lineas", label: "Líneas" },
  { key: "area", label: "Área" },
]

export function FlujoFinanciero({
  data,
  insightText,
}: {
  data: MesFinanciero[]
  insightText: string
}) {
  const [mode, setMode] = useState<ChartMode>("barras")

  if (!data?.length) return null

  const chartData = data.map((d: any) => ({
    ...d,
    mes: mesLabel(d.mes),
    balance: Number(d.ingresos || 0) - Number(d.egresos || 0),
  }))

  const totalIngresos = data.reduce((sum, d) => sum + Number(d.ingresos || 0), 0)
  const totalEgresos = data.reduce((sum, d) => sum + Number(d.egresos || 0), 0)
  const totalBalance = totalIngresos - totalEgresos

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-[#fd761a]" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Flujo financiero
            </h2>
            <p className="text-xs text-slate-500">
              Comparativa de ingresos, egresos y balance consolidado del período
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#10b981]" />
              <span>Ingresos (${totalIngresos.toLocaleString()})</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#fd761a]" />
              <span>Egresos (${totalEgresos.toLocaleString()})</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#3b82f6]" />
              <span>Balance ({totalBalance >= 0 ? "+" : ""}${totalBalance.toLocaleString()})</span>
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60 shadow-2xs">
            {MODES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs transition-all cursor-pointer",
                  mode === key
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "0.75rem",
                border: "none",
                color: "#fff",
                fontSize: "12px",
                padding: "8px 12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
              }}
              formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]}
            />
            {mode === "barras" && (
              <>
                <Bar dataKey="ingresos" fill={GREEN} radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="egresos" fill={ORANGE} radius={[4, 4, 0, 0]} name="Egresos" />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={BLUE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: BLUE }}
                  name="Balance"
                />
              </>
            )}
            {mode === "lineas" && (
              <>
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke={GREEN}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: GREEN }}
                  name="Ingresos"
                />
                <Line
                  type="monotone"
                  dataKey="egresos"
                  stroke={ORANGE}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: ORANGE }}
                  name="Egresos"
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={BLUE}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: BLUE }}
                  name="Balance"
                />
              </>
            )}
            {mode === "area" && (
              <>
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke={GREEN}
                  strokeWidth={2}
                  fill="rgba(16, 185, 129, 0.12)"
                  name="Ingresos"
                />
                <Area
                  type="monotone"
                  dataKey="egresos"
                  stroke={ORANGE}
                  strokeWidth={2}
                  fill="rgba(253, 118, 26, 0.12)"
                  name="Egresos"
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={BLUE}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: BLUE }}
                  name="Balance"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Contextual Supporting Highlight Insight Box */}
      {insightText && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
          <div className="size-8 rounded-lg bg-white border border-slate-200 text-[#fd761a] flex items-center justify-center shrink-0 shadow-2xs">
            <HugeiconsIcon icon={Award01Icon} size={18} />
          </div>
          <p className="leading-relaxed">
            <span className="font-semibold text-slate-900">Análisis operativo:</span>{" "}
            {insightText}
          </p>
        </div>
      )}
    </section>
  )
}
