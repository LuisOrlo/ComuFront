import {
  Video01Icon,
  Mic01Icon,
  Camera01Icon,
  Door01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ActividadServiciosItem } from "@/types/estadisticas"

function getServiceIcon(tipo: string) {
  const t = tipo.toLowerCase()
  if (t.includes("aula") || t.includes("espacio")) return Door01Icon
  if (t.includes("podcast") || t.includes("radio")) return Mic01Icon
  if (t.includes("equipo") || t.includes("cámara") || t.includes("camara")) return Camera01Icon
  if (t.includes("video") || t.includes("edición") || t.includes("edicion")) return Video01Icon
  return Door01Icon
}

export function ActividadServicios({ data }: { data: ActividadServiciosItem[] }) {
  if (!data?.length) return null

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Actividad de servicios
          </h2>
          <p className="text-xs text-slate-500">
            Rendimiento de espacios físicos y servicios complementarios
          </p>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          {data.length} servicios activos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3.5 rounded-l-lg">Servicio</th>
              <th className="py-2.5 px-3.5 text-right font-semibold">Total Ingresos</th>
              <th className="py-2.5 px-3.5 text-right rounded-r-lg font-semibold">Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.map((s) => {
              const Icon = getServiceIcon(s.tipo)
              return (
                <tr key={s.tipo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-medium flex items-center gap-2.5">
                    <span className="size-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={Icon} size={15} />
                    </span>
                    <span className="font-semibold text-slate-900">{s.tipo}</span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 text-sm tabular-nums">
                    ${Number(s.ingresos || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-600">
                    {s.cantidad}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
