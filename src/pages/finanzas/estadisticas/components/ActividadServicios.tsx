import { COLORS } from "@/lib/constants"
import type { ActividadServiciosItem } from "@/types/estadisticas"

export function ActividadServicios({ data }: { data: ActividadServiciosItem[] }) {
  if (!data?.length) return null

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Actividad de servicios</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Servicio</th>
              <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Ingresos</th>
              <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {data.map(s => (
              <tr key={s.tipo} className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <td className="py-2.5 px-4 font-medium" style={{ color: COLORS.CHARCOAL }}>{s.tipo}</td>
                <td className="py-2.5 px-4 text-right font-bold" style={{ color: "#16a34a" }}>${s.ingresos.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-right opacity-60">{s.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
