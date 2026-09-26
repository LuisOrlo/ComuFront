/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Payment02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { DiaSemanaItem, MetodoPagoItem } from "@/types/estadisticas"

const PAYMENT_COLORS = ["#fd761a", "#0f172a", "#3b82f6", "#10b981", "#8b5cf6"]

export function PatronesCobro({
  metodos,
  dias,
}: {
  metodos: MetodoPagoItem[]
  dias: DiaSemanaItem[]
}) {
  if (!metodos?.length && !dias?.length) return null

  const totalMetodos = metodos.reduce((sum, item) => sum + Number(item.value || 0), 0)

  // Encontrar el día con mayor recaudación
  const maxDia = dias.reduce(
    (max, cur) => (Number(cur.value || 0) > Number(max.value || 0) ? cur : max),
    dias[0] || { dia: "", value: 0 }
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Cobros</h2>
          <p className="text-xs text-slate-500">
            Desglose por canal de recaudación y dinámica diaria
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch pt-1">
        {/* Sub-block 1: Métodos de pago */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col items-center justify-between space-y-3">
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Métodos de pago
            </span>
            <span className="text-xs font-semibold text-slate-800">
              ${totalMetodos.toLocaleString()} Total
            </span>
          </div>

          <div className="relative size-28 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metodos}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={36}
                  outerRadius={52}
                  paddingAngle={2}
                >
                  {metodos.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "0.5rem",
                    border: "none",
                    color: "#fff",
                    fontSize: "11px",
                    padding: "6px 10px",
                  }}
                  formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Monto"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
              <HugeiconsIcon icon={Payment02Icon} size={20} />
            </div>
          </div>

          <div className="w-full space-y-1.5 text-xs pt-1">
            {metodos.map((item, index) => {
              const pct =
                totalMetodos > 0
                  ? ((Number(item.value || 0) / totalMetodos) * 100).toFixed(1)
                  : "0"
              const color = PAYMENT_COLORS[index % PAYMENT_COLORS.length]
              return (
                <div key={item.name} className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 font-medium truncate">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="capitalize truncate">{item.name}</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                    ${Number(item.value || 0).toLocaleString()}{" "}
                    <span className="text-slate-400 font-normal">({pct}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sub-block 2: Cobros por día */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cobros por día
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {dias.filter((d) => Number(d.value || 0) > 0).length} días con actividad
            </span>
          </div>

          {dias.length > 0 ? (
            <div className="w-full h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dias} margin={{ top: 15, right: 5, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="dia"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "0.5rem",
                      border: "none",
                      color: "#fff",
                      fontSize: "11px",
                      padding: "6px 10px",
                    }}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Recaudación"]}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {dias.map((entry, index) => {
                      const isMax = Number(entry.value) === Number(maxDia?.value) && Number(entry.value) > 0
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isMax ? "#fd761a" : "#0f172a"}
                        />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-slate-400">Sin cobros registrados.</p>
          )}

          {maxDia && Number(maxDia.value) > 0 && (
            <p className="text-[11px] text-slate-500 text-center">
              Mayor actividad de cobro registrada el{" "}
              <strong className="text-slate-800 font-semibold">{maxDia.dia}</strong> ($
              {Number(maxDia.value).toLocaleString()})
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
