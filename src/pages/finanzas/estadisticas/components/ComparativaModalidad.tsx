import { COLORS } from "@/lib/constants"
import type { ModalidadComparativa } from "@/types/estadisticas"

const METRICAS = [
  { key: "ingresos" as const, label: "Ingresos", format: (v: number) => `$${v.toLocaleString()}`, color: "#16a34a" },
  { key: "egresos" as const, label: "Egresos", format: (v: number) => `$${v.toLocaleString()}`, color: "#f97316" },
  { key: "estudiantes" as const, label: "Estudiantes", format: (v: number) => v.toString(), color: COLORS.CHARCOAL },
  { key: "cursos" as const, label: "Cursos", format: (v: number) => v.toString(), color: COLORS.CHARCOAL },
]

export function ComparativaModalidad({ data }: { data: ModalidadComparativa }) {
  if (!data?.presencial || !data?.virtual) return null

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Rendimiento por modalidad</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider w-1/3">Métrica</th>
              <th className="text-right py-2 px-4 font-bold uppercase tracking-wider" style={{ color: COLORS.CHARCOAL }}>Presencial</th>
              <th className="text-right py-2 px-4 font-bold uppercase tracking-wider" style={{ color: COLORS.CHARCOAL }}>Virtual</th>
            </tr>
          </thead>
          <tbody>
            {METRICAS.map(({ key, label, format, color }) => (
              <tr key={key} className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <td className="py-2.5 px-4 font-medium opacity-50">{label}</td>
                <td className="py-2.5 px-4 text-right font-bold" style={{ color }}>
                  {format(data.presencial[key])}
                </td>
                <td className="py-2.5 px-4 text-right font-bold" style={{ color }}>
                  {format(data.virtual[key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
