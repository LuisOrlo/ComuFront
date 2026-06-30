/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE
const PIE_COLORS = ["#059669", "#4f46e5", "#0891b2", "#d97706", "#dc2626"]

const CAT_BAR_COLORS: Record<string, string> = {
  "Cursos": "#059669", "Talleres": "#0891b2", "Podcast": "#4f46e5",
  "Aulas": "#7c3aed", "Radio": "#a21caf", "Edición": "#d97706",
  "Equipos": "#dc2626", "Streaming": "#0d9488", "Producción": "#65a30d",
  "Otros": "#6b7280",
}

const TABS = [
  { key: "mensual", label: "Mensual", desc: "Evolución de ingresos totales por mes" },
  { key: "metodo", label: "Por Método", desc: "Proporción efectivo vs transferencia" },
  { key: "servicios", label: "Top Servicios", desc: "Categorías con mayor facturación en el período" },
]

export function IngresosGraficos({ grafico, graficoMetodo, graficoCategorias }: {
  grafico: any[]
  graficoMetodo?: any[]
  graficoCategorias?: any[]
}) {
  const [tab, setTab] = useState("mensual")

  const active = TABS.find(t => t.key === tab)

  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: BORDER }}>
      <div className="flex items-center gap-1 mb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
            style={tab === t.key ? { backgroundColor: COLORS.ACCENT, color: "#fff" } : { backgroundColor: "oklch(0.95 0 0)", color: COLORS.TEXT_MUTED }}>
            {t.label}
          </button>
        ))}
      </div>
      {active && (
        <p className="text-[10px] opacity-40 mb-3 pl-1">{active.desc}</p>
      )}
      <div style={{ minHeight: 240 }}>
        {tab === "mensual" && grafico.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grafico.map((g: any) => ({ ...g, mes: g.mes?.substring(5) }))}>
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="total" fill={COLORS.ACCENT} radius={[4, 4, 0, 0]} name="Ingresos" />
            </BarChart>
          </ResponsiveContainer>
        )}
        {tab === "metodo" && graficoMetodo?.length && (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={graficoMetodo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }: any) => `${name}: $${(value || 0).toLocaleString()}`}>
                {graficoMetodo.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {tab === "servicios" && graficoCategorias?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={graficoCategorias} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Ingresos">
                {graficoCategorias.map((item: any, i: number) => (
                  <Cell key={i} fill={CAT_BAR_COLORS[item.name] || COLORS.ACCENT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
        {tab === "servicios" && !graficoCategorias?.length && (
          <div className="flex items-center justify-center h-[220px] text-xs opacity-40">Sin datos de categorías</div>
        )}
      </div>
    </div>
  )
}
