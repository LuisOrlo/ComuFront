/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Landmark, Banknote, CreditCard, School, Mic, Wrench, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

const PIE_COLORS = ["#fd761a", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#6366f1", "#ec4899"]

const CAT_COLORS: Record<string, string> = {
  "Cursos": "#3b82f6",
  "Talleres": "#06b6d4",
  "Podcast": "#8b5cf6",
  "Cursos personalizados": "#a855f7",
  "Aulas": "#6366f1",
  "Alquiler de Aulas": "#6366f1",
  "Radio": "#d946ef",
  "Edición": "#f59e0b",
  "Edición de Video": "#f59e0b",
  "Equipos": "#ef4444",
  "Alquiler de Equipos": "#ef4444",
  "Streaming": "#14b8a6",
  "Producción": "#84cc16",
  "Producción Audiovisual": "#84cc16",
  "Otros": "#64748b",
}

const TABS = [
  {
    key: "mensual",
    label: "Mensual",
    title: "Evolución de ingresos por mes",
    desc: "Distribución cronológica del flujo de caja registrado",
  },
  {
    key: "metodo",
    label: "Por método",
    title: "Distribución por método de pago",
    desc: "Proporción y volumen entre transferencias, efectivo y otros medios",
  },
  {
    key: "servicios",
    label: "Top servicios",
    title: "Top servicios y categorías",
    desc: "Categorías y programas con mayor volumen de facturación",
  },
]

function getMethodIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("transf") || n.includes("banc")) return Landmark
  if (n.includes("efect") || n.includes("caja")) return Banknote
  return CreditCard
}

function getCategoryIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("curso")) return School
  if (n.includes("pod") || n.includes("audio") || n.includes("radio")) return Mic
  if (n.includes("taller")) return Wrench
  return Layers
}

export function IngresosGraficos({
  grafico = [],
  graficoMetodo = [],
  graficoCategorias = [],
}: {
  grafico: any[]
  graficoMetodo?: any[]
  graficoCategorias?: any[]
}) {
  const [tab, setTab] = useState("mensual")

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0]

  const totalMeses = useMemo(() => {
    return (grafico || []).reduce((sum: number, item: any) => sum + Number(item.total || 0), 0)
  }, [grafico])

  const totalMetodos = useMemo(() => {
    return (graficoMetodo || []).reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)
  }, [graficoMetodo])

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
                        cursor={{ fill: "rgba(253, 118, 26, 0.06)" }}
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
                        fill="#fd761a"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Leyenda inferior */}
                <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#fd761a]"></span>
                    <span>
                      Ingresos percibidos ($
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
                No hay datos históricos disponibles para este período
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: POR MÉTODO (Sin el cuadro "100% Digitalizado" según instrucciones) */}
        {tab === "metodo" && (
          <div className="w-full py-2">
            {graficoMetodo && graficoMetodo.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Barras de progreso limpias con métricas */}
                <div className="flex flex-col gap-4">
                  {graficoMetodo.map((m: any, i: number) => {
                    const MethodIcon = getMethodIcon(m.name || "")
                    const pct = totalMetodos > 0 ? Math.round((Number(m.value || 0) / totalMetodos) * 100) : 0
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-900 font-semibold flex items-center gap-2">
                            <MethodIcon size={16} className="text-[#fd761a]" />
                            <span className="capitalize">{m.name}</span>
                          </span>
                          <span className="text-slate-900 font-bold tabular-nums">
                            $
                            {Number(m.value || 0).toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            <span className="text-slate-500 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#fd761a] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
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
                        data={graficoMetodo}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {graficoMetodo.map((_: any, index: number) => (
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
                No hay información de métodos de pago registrada
              </div>
            )}
          </div>
        )}

        {/* VISTA 3: TOP SERVICIOS / CATEGORÍAS */}
        {tab === "servicios" && (
          <div className="w-full py-2">
            {graficoCategorias && graficoCategorias.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  {graficoCategorias.map((cat: any, i: number) => {
                    const CatIcon = getCategoryIcon(cat.name || "")
                    const pct = totalCategorias > 0 ? Math.round((Number(cat.value || 0) / totalCategorias) * 100) : 0
                    const color = CAT_COLORS[cat.name] || "#fd761a"
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-900 font-semibold flex items-center gap-2 truncate">
                            <CatIcon size={16} style={{ color }} />
                            <span className="truncate">{cat.name}</span>
                          </span>
                          <span className="text-slate-900 font-bold tabular-nums shrink-0 ml-2">
                            $
                            {Number(cat.value || 0).toLocaleString("es-ES", {
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

                {/* Horizontal bar chart representation */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={graficoCategorias}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} width={80} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {graficoCategorias.map((item: any, i: number) => (
                          <Cell key={i} fill={CAT_COLORS[item.name] || "#fd761a"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-52 text-xs text-slate-400">
                Sin datos de categorías para este período
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
