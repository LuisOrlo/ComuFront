import { useNavigate, useSearchParams } from "react-router"
import { Award01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { TopEstudiante } from "@/types/estadisticas"
import { cn } from "@/lib/utils"

function getInitials(name?: string) {
  if (!name) return "ES"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function RetencionFidelizacion({
  topEstudiantes,
}: {
  topEstudiantes: TopEstudiante[]
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  if (!topEstudiantes?.length) return null

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Estudiantes</h2>
          <p className="text-xs text-slate-500">Top 10 alumnos por volumen de facturación</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-[#fd761a] bg-orange-50 border border-orange-200/60">
          <HugeiconsIcon icon={Award01Icon} size={15} />
          <span>Top {topEstudiantes.length} activos</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3 rounded-l-lg w-12 text-center">#</th>
              <th className="py-2.5 px-3">Estudiante</th>
              <th className="py-2.5 px-3 text-right rounded-r-lg">Total ingresos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {topEstudiantes.map((e, i) => (
              <tr
                key={e.id}
                onClick={() =>
                  navigate(
                    `/finanzas/estadisticas/estudiante/${e.id}?${searchParams.toString()}`
                  )
                }
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                <td
                  className={cn(
                    "py-3 px-3 text-center font-mono font-bold text-xs",
                    i === 0 ? "text-[#fd761a]" : "text-slate-400"
                  )}
                >
                  {i + 1}
                </td>
                <td className="py-3 px-3 font-medium">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                        i === 0 ? "bg-[#fd761a]" : "bg-slate-800"
                      )}
                    >
                      {getInitials(e.nombre)}
                    </div>
                    <span className="truncate group-hover:text-[#fd761a] transition-colors font-semibold">
                      {e.nombre}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 text-sm tabular-nums">
                  ${Number(e.total || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
