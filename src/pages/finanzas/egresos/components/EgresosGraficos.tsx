/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Building, Users, Briefcase, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

const PIE_COLORS = ["#ef4444", "#6366f1", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"]

const TABS = [
  {
    key: "mensual",
    label: "Mensual",
    title: "Evolución de egresos por mes",
    desc: "Distribución cronológica del flujo de caja saliente",
  },
  {
    key: "categoria",
    label: "Por categoría",
    title: "Distribución por categoría",
    desc: "Proporción del gasto operativo según tipo de egreso",
  },
  {
    key: "proveedor",
    label: "Por proveedor",
    title: "Top proveedores y beneficiarios",
    desc: "Destinatarios con mayor volumen de pago en el período",
  },
]

function getCategoryIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("person") || n.includes("docen") || n.includes("honor")) return Users
  if (n.includes("servic") || n.includes("luz") || n.includes("agua")) return Building
  if (n.includes("proveed") || n.includes("equipo")) return Truck
  return Briefcase
}

export function EgresosGraficos({
  grafico = [],
  graficoCategorias = [],
  graficoProveedores = [],
}: {
  grafico: any[]
  graficoCategorias?: any[]
  graficoProveedores?: any[]
}) {
  const [tab, setTab] = useState("mensual")

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0]

  const totalMeses = useMemo(() => {
    return (grafico || []).reduce((sum: number, item: any) => sum + Number(item.total || 0), 0)
  }, [grafico])

  const totalCategorias = useMemo(() => {
    return (graficoCategorias || []).reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)
  }, [graficoCategorias])

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col gap-6">
      {/* Header con pestañas segmentadas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {activeTab.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{activeTab.desc}</p>
        </div>

        {/* Controles de pestañas segmentadas */}
        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl gap-1 self-start sm:self-auto" role="tablist">
          {TABS.map((t) => {
            const isSelected = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#fd761a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido de Gráficos */}
      <div className="min-h-[250px]">
        {/* VISTA 1: MENSUAL */}
        {tab === "mensual" && (
          <div className="w-full flex flex-col gap-4">
            {grafico.length > 0 ? (
              <>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={grafico.map((g: any) => ({
                        ...g,
                        mesDisplay: g.mes ? String(g.mes).substring(5) : "",
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="mesDisplay"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${Number(v)}`}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(239, 68, 68, 0.05)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const dataItem = payload[0].payload
                            return (
                              <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg border border-slate-800">
                                <div className="text-slate-400 text-[10px] uppercase font-semibold">
                                  {dataItem.mes}
                                </div>
                                <div className="text-sm font-bold text-white mt-0.5">
                                  ${Number(dataItem.total || 0).toLocaleString("es-ES", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill="#ef4444"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Leyenda inferior */}
                <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-rose-500"></span>
                    <span>
                      Egresos incurridos ($
                      {totalMeses.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      acumulado)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-52 text-xs text-slate-400">
                No hay egresos históricos registrados para este período
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: POR CATEGORÍA */}
        {tab === "categoria" && (
          <div className="w-full py-2">
            {graficoCategorias && graficoCategorias.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Barras de progreso limpias con métricas */}
                <div className="flex flex-col gap-4">
                  {graficoCategorias.map((c: any, i: number) => {
                    const CatIcon = getCategoryIcon(c.name || "")
                    const pct = totalCategorias > 0 ? Math.round((Number(c.value || 0) / totalCategorias) * 100) : 0
                    const color = PIE_COLORS[i % PIE_COLORS.length]
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-900 font-semibold flex items-center gap-2">
                            <CatIcon size={16} style={{ color }} />
                            <span>{c.name}</span>
                          </span>
                          <span className="text-slate-900 font-bold tabular-nums">
                            $
                            {Number(c.value || 0).toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            <span className="text-slate-500 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Gráfico de dona complementario */}
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={graficoCategorias}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {graficoCategorias.map((_: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [
                          `$${Number(val || 0).toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`,
                          "Monto",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-52 text-xs text-slate-400">
                No hay categorías registradas en este período
              </div>
            )}
          </div>
        )}

        {/* VISTA 3: POR PROVEEDOR */}
        {tab === "proveedor" && (
          <div className="w-full py-2">
            {graficoProveedores && graficoProveedores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col gap-3">
                  {graficoProveedores.slice(0, 6).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                          {item.name || "Proveedor sin nombre"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums shrink-0 ml-3">
                        ${Number(item.value || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={graficoProveedores.slice(0, 6)}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} width={90} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`} />
                      <Bar dataKey="value" fill="#ef4444" radius={[0, 6, 6, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-52 text-xs text-slate-400">
                Sin datos de proveedores para este período
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
