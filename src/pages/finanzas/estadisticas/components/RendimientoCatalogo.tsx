import { useState } from "react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate, useSearchParams } from "react-router"
import type { CatalogosTopItem } from "@/types/estadisticas"
import { cn } from "@/lib/utils"

type SortField = "nombre" | "ofertas" | "estudiantes" | "ocupacion_pct" | "aprobacion_pct" | "ingreso"
type SortDir = "asc" | "desc"

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField
  sortField: SortField
  sortDir: SortDir
}) {
  if (field !== sortField) return <span className="opacity-25 text-[9px] ml-1">↕</span>
  return (
    <HugeiconsIcon
      icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
      size={11}
      className="ml-1 text-[#fd761a]"
    />
  )
}

export function RendimientoCatalogo({ data }: { data: CatalogosTopItem[] }) {
  const [sortField, setSortField] = useState<SortField>("ingreso")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  if (!data?.length) return null

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    if (typeof aVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string)
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number)
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Rendimiento por catálogo
          </h2>
          <p className="text-xs text-slate-500">
            Concentración de inscripciones, ocupación y facturación por plan académico
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
          {data.length} catálogos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              {[
                { key: "nombre" as SortField, label: "Nombre del plan", cls: "text-left rounded-l-lg" },
                { key: "ofertas" as SortField, label: "Ofertas", cls: "text-right" },
                { key: "estudiantes" as SortField, label: "Estudiantes", cls: "text-right" },
                { key: "ocupacion_pct" as SortField, label: "Ocupación", cls: "text-right" },
                { key: "aprobacion_pct" as SortField, label: "Aprobación", cls: "text-right" },
                { key: "ingreso" as SortField, label: "Total ingresos", cls: "text-right rounded-r-lg" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`py-2.5 px-3.5 font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-slate-800 transition-colors ${col.cls}`}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {sorted.map((cat) => (
              <tr
                key={cat.id}
                onClick={() =>
                  navigate(`/finanzas/estadisticas/catalogo/${cat.id}?${searchParams.toString()}`)
                }
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                <td className="py-3 px-3.5 font-semibold text-slate-900 group-hover:text-[#fd761a] transition-colors">
                  {cat.nombre}
                </td>
                <td className="py-3 px-3.5 text-right font-medium text-slate-600">{cat.ofertas}</td>
                <td className="py-3 px-3.5 text-right font-semibold text-slate-800">{cat.estudiantes}</td>
                <td className="py-3 px-3.5 text-right font-mono">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-bold border",
                      cat.ocupacion_pct >= 70
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : cat.ocupacion_pct >= 40
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {cat.ocupacion_pct}%
                  </span>
                </td>
                <td className="py-3 px-3.5 text-right font-mono">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-bold border",
                      cat.aprobacion_pct >= 70
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : cat.aprobacion_pct >= 40
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {cat.aprobacion_pct}%
                  </span>
                </td>
                <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 text-sm tabular-nums">
                  ${Number(cat.ingreso || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
