/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import {
  ComposedChart, Bar, Line, Area,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { COLORS } from "@/lib/constants"
import type { MesFinanciero } from "@/types/estadisticas"

const GREEN = "#16a34a"
const ORANGE = "#f97316"
const BLUE = "#3b82f6"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function mesLabel(mesStr: string): string {
  const [, m] = mesStr.split("-")
  const idx = parseInt(m, 10) - 1
  return MESES[idx] ?? mesStr
}

type ChartMode = "barras" | "lineas" | "area"

const MODES: { key: ChartMode; label: string }[] = [
  { key: "barras", label: "Barras" },
  { key: "lineas", label: "Líneas" },
  { key: "area", label: "Área" },
]

export function FlujoFinanciero({ data, insightText }: { data: MesFinanciero[]; insightText: string }) {
  const [mode, setMode] = useState<ChartMode>("barras")

  if (!data?.length) return null

  const chartData = data.map((d: any) => ({
    ...d,
    mes: mesLabel(d.mes),
    balance: d.ingresos - d.egresos,
    estimado: d.estimado,
  }))

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Flujo financiero</h3>
        <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-lg">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
              style={mode === key ? { backgroundColor: "#fff", color: COLORS.CHARCOAL, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: COLORS.TEXT_MUTED }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData}>
          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {mode === "barras" && (
            <>
              <Bar dataKey="ingresos" fill={GREEN} radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="egresos" fill={ORANGE} radius={[4, 4, 0, 0]} name="Egresos" />
              <Line type="monotone" dataKey="balance" stroke={BLUE} strokeWidth={2} dot={false} name="Balance" />
            </>
          )}
          {mode === "lineas" && (
            <>
              <Line type="monotone" dataKey="ingresos" stroke={GREEN} strokeWidth={2.5} dot={{ r: 4 }} name="Ingresos" />
              <Line type="monotone" dataKey="egresos" stroke={ORANGE} strokeWidth={2.5} dot={{ r: 4 }} name="Egresos" />
              <Line type="monotone" dataKey="balance" stroke={BLUE} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4 }} name="Balance" />
            </>
          )}
          {mode === "area" && (
            <>
              <Area type="monotone" dataKey="ingresos" stroke={GREEN} strokeWidth={2.5} fill="rgba(22,163,74,0.12)" dot={{ r: 4 }} name="Ingresos" />
              <Area type="monotone" dataKey="egresos" stroke={ORANGE} strokeWidth={2.5} fill="rgba(249,115,22,0.12)" dot={{ r: 4 }} name="Egresos" />
              <Line type="monotone" dataKey="balance" stroke={BLUE} strokeWidth={2.5} dot={{ r: 4 }} name="Balance" />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {insightText && (
        <p className="text-sm font-medium italic opacity-50" style={{ color: COLORS.CHARCOAL }}>
          {insightText}
        </p>
      )}
    </div>
  )
}
