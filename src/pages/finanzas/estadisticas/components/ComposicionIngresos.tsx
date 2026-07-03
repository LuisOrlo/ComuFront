/* eslint-disable @typescript-eslint/no-explicit-any */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { COLORS } from "@/lib/constants"
import type { DistribucionCategoria } from "@/types/estadisticas"

const CAT_COLORS = ["#16a34a", "#3b82f6", "#f97316", "#a855f7", "#eab308", "#06b6d4", "#ec4899", "#8b5cf6"]

interface Props {
  distribucion: DistribucionCategoria[]
  categoriaSeleccionada: string | null
  onSelectCategoria: (cat: string | null) => void
}

export function ComposicionIngresos({ distribucion, categoriaSeleccionada, onSelectCategoria }: Props) {
  if (!distribucion?.length) return null

  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 mb-1">Composición de ingresos</h3>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="lg:w-1/2">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribucion}
                dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                label={({ name, porcentaje }: any) => `${name} ${porcentaje}%`}
                onClick={(_, idx) => {
                  const cat = distribucion[idx]?.name
                  onSelectCategoria(categoriaSeleccionada === cat ? null : cat)
                }}
                style={{ cursor: "pointer" }}
              >
                {distribucion.map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={CAT_COLORS[i % CAT_COLORS.length]}
                    opacity={!categoriaSeleccionada || distribucion[i]?.name === categoriaSeleccionada ? 1 : 0.3}
                    stroke={!categoriaSeleccionada || distribucion[i]?.name === categoriaSeleccionada ? "#fff" : "transparent"}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:w-1/2 w-full space-y-2">
          {distribucion.map((cat, i) => {
            const active = categoriaSeleccionada === cat.name
            const maxValue = Math.max(...distribucion.map(d => d.value), 1)
            const barWidth = (cat.value / maxValue) * 100
            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategoria(active ? null : cat.name)}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="font-bold" style={{ color: COLORS.CHARCOAL, opacity: active ? 1 : 0.6 }}>
                    {cat.name}
                  </span>
                  <span className="opacity-40">
                    ${cat.value.toLocaleString()} · {cat.porcentaje}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.95 0 0)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                      opacity: active || !categoriaSeleccionada ? 1 : 0.3,
                    }}
                  />
                </div>
              </button>
            )
          })}
          {categoriaSeleccionada && (
            <button
              onClick={() => onSelectCategoria(null)}
              className="text-[10px] font-bold opacity-40 hover:opacity-80 transition-opacity"
              style={{ color: COLORS.ACCENT }}
            >
              Mostrar todas las categorías
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
