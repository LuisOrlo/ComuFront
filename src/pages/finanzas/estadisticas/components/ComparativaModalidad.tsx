import {
  Money01Icon,
  ArrowUp01Icon,
  UserGroupIcon,
  Book02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ModalidadComparativa } from "@/types/estadisticas"

const METRICAS = [
  {
    key: "ingresos" as const,
    label: "Ingresos generados",
    icon: Money01Icon,
    iconColor: "text-emerald-600",
    format: (v: number) => `$${Number(v || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`,
    color: "text-emerald-700 font-bold",
  },
  {
    key: "egresos" as const,
    label: "Egresos asignados",
    icon: ArrowUp01Icon,
    iconColor: "text-orange-500",
    format: (v: number) => `$${Number(v || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`,
    color: "text-slate-600 font-medium",
  },
  {
    key: "estudiantes" as const,
    label: "Estudiantes activos",
    icon: UserGroupIcon,
    iconColor: "text-slate-700",
    format: (v: number) => Number(v || 0).toString(),
    color: "text-slate-900 font-bold",
  },
  {
    key: "cursos" as const,
    label: "Cursos en ejecución",
    icon: Book02Icon,
    iconColor: "text-[#fd761a]",
    format: (v: number) => Number(v || 0).toString(),
    color: "text-slate-900 font-bold",
  },
]

export function ComparativaModalidad({ data }: { data: ModalidadComparativa }) {
  if (!data?.presencial || !data?.virtual) return null

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
        <div className="w-1.5 h-6 rounded-full bg-slate-900" />
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Rendimiento académico y modalidad
          </h2>
          <p className="text-xs text-slate-500">
            Comparativa de métricas institucionales por modalidad de impartición
          </p>
        </div>
      </div>

      <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3 sm:p-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3.5 rounded-l-lg">Métrica institucional</th>
                <th className="py-2.5 px-3.5 text-right font-semibold">Presencial</th>
                <th className="py-2.5 px-3.5 text-right rounded-r-lg font-semibold">Virtual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
              {METRICAS.map(({ key, label, icon: Icon, iconColor, format, color }) => (
                <tr key={key} className="hover:bg-slate-100/50 transition-colors">
                  <td className="py-3 px-3.5 flex items-center gap-2">
                    <span className={iconColor}>
                      <HugeiconsIcon icon={Icon} size={16} />
                    </span>
                    <span className="font-semibold text-slate-800">{label}</span>
                  </td>
                  <td className={`py-3 px-3.5 text-right font-mono tabular-nums ${color}`}>
                    {format(data.presencial[key])}
                  </td>
                  <td className={`py-3 px-3.5 text-right font-mono tabular-nums ${color}`}>
                    {format(data.virtual[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
