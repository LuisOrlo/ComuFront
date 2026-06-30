/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE
const PIE_COLORS = ["#4f46e5", "#d97706", "#8b5cf6", "#6b7280"]
const TABS = [
  { key: "mensual", label: "Mensual", desc: "Egresos totales por mes" },
  { key: "categoria", label: "Por Categoría", desc: "Distribución del gasto por tipo" },
  { key: "proveedor", label: "Por Proveedor", desc: "Mayores beneficiarios del período" },
]

export function EgresosGraficos({ grafico, graficoCategorias, graficoProveedores }: {
  grafico: any[]; graficoCategorias?: any[]; graficoProveedores?: any[]
}) {
  const [tab, setTab] = useState("mensual")
  const active = TABS.find(t => t.key === tab)

  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: BORDER }}>
      <div className="flex items-center gap-1 mb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
            style={tab === t.key ? { backgroundColor: "#dc2626", color: "#fff" } : { backgroundColor: "oklch(0.95 0 0)", color: COLORS.TEXT_MUTED }}>
            {t.label}
          </button>
        ))}
      </div>
      {active && <p className="text-[10px] opacity-40 mb-3 pl-1">{active.desc}</p>}
      <div style={{ minHeight: 240, minWidth: 200 }}>
        {tab === "mensual" && grafico.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grafico.map((g: any) => ({ ...g, mes: g.mes?.substring(5) }))}>
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="total" fill="#dc2626" radius={[4, 4, 0, 0]} name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        )}
        {tab === "categoria" && graficoCategorias?.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={graficoCategorias} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, value }: any) => `${name}: $${(value || 0).toLocaleString()}`}>
                {graficoCategorias.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
        {tab === "proveedor" && graficoProveedores?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={graficoProveedores} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="value" fill="#dc2626" radius={[0, 4, 4, 0]} name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  )
}
