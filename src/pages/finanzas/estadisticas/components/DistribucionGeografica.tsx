import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { COLORS } from "@/lib/constants"
import type { CiudadesTopItem } from "@/types/estadisticas"

export function DistribucionGeografica({ data }: { data: CiudadesTopItem[] }) {
  if (!data?.length) return null

  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3">Distribución geográfica</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={Math.max(data.length * 36, 200)}>
          <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={90} />
            <Tooltip formatter={(v) => `$${Number(v ?? 0).toLocaleString()}`} />
            <Bar dataKey="ingresos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <th className="text-left py-2 font-bold opacity-30 uppercase tracking-wider">Ciudad</th>
                <th className="text-right py-2 font-bold opacity-30 uppercase tracking-wider">Ingresos</th>
                <th className="text-right py-2 font-bold opacity-30 uppercase tracking-wider">Estudiantes</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => (
                <tr key={c.id} className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <td className="py-2 font-medium" style={{ color: COLORS.CHARCOAL }}>{c.nombre}</td>
                  <td className="py-2 text-right font-bold" style={{ color: "#16a34a" }}>${c.ingresos.toLocaleString()}</td>
                  <td className="py-2 text-right opacity-60">{c.estudiantes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
