import { COLORS } from "@/lib/constants"
import { useNavigate, useSearchParams } from "react-router-dom"
import type { Metricas, TopEstudiante } from "@/types/estadisticas"

function formatearFrase(tasa: number): string {
  const deCada10 = Math.round(tasa / 10)
  return `${deCada10} de cada 10 estudiantes vuelven a inscribirse`
}

export function RetencionFidelizacion({ metricas, topEstudiantes }: { metricas: Metricas; topEstudiantes: TopEstudiante[] }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">Tasa de retención</p>
          <span className="text-4xl font-black" style={{ color: "#16a34a" }}>{metricas.tasa_retencion}%</span>
          <p className="text-xs opacity-40 mt-1">{formatearFrase(metricas.tasa_retencion)}</p>
        </div>

        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">Tasa de abandono</p>
          <span className="text-4xl font-black" style={{ color: "#dc2626" }}>{metricas.tasa_abandono}%</span>
          <p className="text-xs opacity-40 mt-1">Estudiantes que no se reinscribieron en el período</p>
        </div>
      </div>

      {topEstudiantes?.length > 0 && (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Top 10 estudiantes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">#</th>
                  <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Estudiante</th>
                  <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Total ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topEstudiantes.map((e, i) => (
                  <tr key={e.id}
                    onClick={() => navigate(`/finanzas/estadisticas/estudiante/${e.id}?${searchParams.toString()}`)}
                    className="border-b cursor-pointer transition-colors hover:bg-gray-50/50"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <td className="py-2.5 px-4 font-bold opacity-30">{i + 1}</td>
                    <td className="py-2.5 px-4 font-medium" style={{ color: COLORS.CHARCOAL }}>{e.nombre}</td>
                    <td className="py-2.5 px-4 text-right font-bold" style={{ color: "#16a34a" }}>${e.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
