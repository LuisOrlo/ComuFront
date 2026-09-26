import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { CiudadesTopItem } from "@/types/estadisticas"

export function DistribucionGeografica({ data }: { data: CiudadesTopItem[] }) {
  if (!data?.length) return null

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Distribución geográfica
          </h2>
          <p className="text-xs text-slate-500">
            Procedencia de los estudiantes inscritos y volumen de recaudación por ciudad
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1">
        <div className="lg:col-span-7">
          <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 220)}>
            <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20 }}>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 11, fill: "#334155" }}
                width={80}
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
                formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, "Ingresos"]}
              />
              <Bar dataKey="ingresos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-5 overflow-x-auto bg-slate-50/70 border border-slate-200/70 rounded-xl p-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Ciudad</th>
                <th className="text-right py-2 px-2">Ingresos</th>
                <th className="text-right py-2 px-2">Estudiantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-100/50 transition-colors">
                  <td className="py-2.5 px-2 font-semibold text-slate-900">{c.nombre}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-600 tabular-nums">
                    ${Number(c.ingresos || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-slate-700">{c.estudiantes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
