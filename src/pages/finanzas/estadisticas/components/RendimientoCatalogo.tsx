import { useState } from "react"
import { COLORS } from "@/lib/constants"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate, useSearchParams } from "react-router-dom"
import type { CatalogosTopItem } from "@/types/estadisticas"

type SortField = "nombre" | "ofertas" | "estudiantes" | "ocupacion_pct" | "aprobacion_pct" | "ingreso"
type SortDir = "asc" | "desc"

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <span className="opacity-20 text-[8px] ml-1">↕</span>
  return <HugeiconsIcon icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon} size={10} className="ml-1" />
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
    if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string)
    return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const minEstudiantes = Math.min(...data.map(d => d.estudiantes))

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Rendimiento por catálogo</h3>
      </div>
      <div className="overflow-x-auto scrollbar-thin" style={{ scrollbarWidth: "thin" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {[
                { key: "nombre" as SortField, label: "Nombre", cls: "text-left" },
                { key: "ofertas" as SortField, label: "Ofertas", cls: "text-right" },
                { key: "estudiantes" as SortField, label: "Estud.", cls: "text-right" },
                { key: "ocupacion_pct" as SortField, label: "Ocup.", cls: "text-right" },
                { key: "aprobacion_pct" as SortField, label: "Aprob.", cls: "text-right" },
                { key: "ingreso" as SortField, label: "Ingreso", cls: "text-right" },
              ].map(col => (
                <th key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`py-2 px-4 font-bold opacity-30 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${col.cls}`}>
                  {col.label}
                  <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((cat) => (
              <tr key={cat.id}
                onClick={() => navigate(`/finanzas/estadisticas/catalogo/${cat.id}?${searchParams.toString()}`)}
                className="border-b cursor-pointer transition-colors hover:bg-gray-50/50"
                style={{
                  borderColor: COLORS.BORDER_SUBTLE,
                  backgroundColor: cat.estudiantes === minEstudiantes && cat.estudiantes > 0 ? "rgba(234,179,8,0.06)" : "transparent",
                }}>
                <td className="py-2.5 px-4 font-bold" style={{ color: COLORS.CHARCOAL }}>{cat.nombre}</td>
                <td className="py-2.5 px-4 text-right opacity-60">{cat.ofertas}</td>
                <td className="py-2.5 px-4 text-right font-medium">{cat.estudiantes}</td>
                <td className="py-2.5 px-4 text-right">
                  <span style={{ color: cat.ocupacion_pct >= 70 ? "#16a34a" : cat.ocupacion_pct >= 40 ? "#f97316" : "#6b7280" }}>{cat.ocupacion_pct}%</span>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span style={{ color: cat.aprobacion_pct >= 70 ? "#16a34a" : cat.aprobacion_pct >= 40 ? "#f97316" : "#6b7280" }}>{cat.aprobacion_pct}%</span>
                </td>
                <td className="py-2.5 px-4 text-right font-bold" style={{ color: "#16a34a" }}>
                  ${cat.ingreso.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
