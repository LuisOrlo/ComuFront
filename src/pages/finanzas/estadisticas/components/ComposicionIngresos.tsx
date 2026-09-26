/* eslint-disable @typescript-eslint/no-explicit-any */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import type { DistribucionCategoria } from "@/types/estadisticas"

const CAT_COLORS = [
  "#8b5cf6", // Cursos (Purple)
  "#10b981", // Equipos (Emerald)
  "#f59e0b", // Aulas (Amber)
  "#6366f1", // Talleres (Indigo)
  "#06b6d4", // Edición (Cyan)
  "#f43f5e", // Podcast (Rose)
  "#fd761a", // Naranja
  "#3b82f6", // Azul
]

interface Props {
  distribucion: DistribucionCategoria[]
  categoriaSeleccionada: string | null
  onSelectCategoria: (cat: string | null) => void
}

export function ComposicionIngresos({
  distribucion,
  categoriaSeleccionada,
  onSelectCategoria,
}: Props) {
  if (!distribucion?.length) return null

  const total = distribucion.reduce((sum, d) => sum + Number(d.value || 0), 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Composición de ingresos
          </h2>
          <p className="text-xs text-slate-500">
            Distribución por líneas de servicio facturadas
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60">
          Total: ${total.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
        {/* Donut Chart with Center Metric */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distribucion}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={2}
                onClick={(_, idx) => {
                  const cat = distribucion[idx]?.name
                  onSelectCategoria(categoriaSeleccionada === cat ? null : cat)
                }}
                style={{ cursor: "pointer" }}
              >
                {distribucion.map((_: any, i: number) => {
                  const active =
                    !categoriaSeleccionada ||
                    distribucion[i]?.name === categoriaSeleccionada
                  return (
                    <Cell
                      key={i}
                      fill={CAT_COLORS[i % CAT_COLORS.length]}
                      opacity={active ? 1 : 0.25}
                      stroke={active ? "#fff" : "transparent"}
                      strokeWidth={2}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "0.75rem",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Ingresos"]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              TOTAL
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              ${total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Category Progress Bars */}
        <div className="sm:col-span-7 space-y-3 text-xs">
          {distribucion.map((cat, i) => {
            const active = categoriaSeleccionada === cat.name
            const pct = cat.porcentaje ?? (total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0)
            const color = CAT_COLORS[i % CAT_COLORS.length]

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategoria(active ? null : cat.name)}
                className="w-full text-left group cursor-pointer transition-opacity"
                style={{
                  opacity: !categoriaSeleccionada || active ? 1 : 0.4,
                }}
              >
                <div className="flex justify-between items-center text-slate-800 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold group-hover:text-[#fd761a] transition-colors">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="font-mono text-slate-700 font-semibold tabular-nums shrink-0">
                    ${cat.value.toLocaleString()}{" "}
                    <span className="text-slate-400 font-normal">· {pct}%</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(pct)))}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </button>
            )
          })}

          {categoriaSeleccionada && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSelectCategoria(null)}
                className="text-xs font-semibold text-[#fd761a] hover:underline cursor-pointer"
              >
                ← Mostrar todas las categorías
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
