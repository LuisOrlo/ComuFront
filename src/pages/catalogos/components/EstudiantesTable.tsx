import { useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, Users } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { MatriculaDetallada } from "@/services/cursos.service"
import { PaginationControls } from "@/components/table/PaginationControls"
import { getEstudianteData, estadoBadge } from "./estudiantesHelpers"

const BORDER = COLORS.BORDER_SUBTLE
const TEXT_MUTED = COLORS.TEXT_MUTED
const ACCENT = COLORS.ACCENT

interface EstudiantesTableProps {
  matriculas: MatriculaDetallada[]
  loading: boolean
  search: string
  onSearchChange: (v: string) => void
}

interface Row {
  id: string
  nombres: string
  apellidos: string
  cedula: string
  correo: string
  estado: string
}

function toRow(m: MatriculaDetallada): Row {
  const e = getEstudianteData(m)
  return {
    id: m.id,
    nombres: e?.nombres || "N/A",
    apellidos: e?.apellidos || "",
    cedula: e?.cedula || "",
    correo: e?.correo || "",
    estado: m.estado || "",
  }
}

export function EstudiantesTable({ matriculas, loading, search, onSearchChange }: EstudiantesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "apellidos", desc: false }])

  const data = useMemo<Row[]>(() => matriculas.map(toRow), [matriculas])

  const columns = useMemo(
    () => [
      {
        accessorKey: "nombres",
        header: "Estudiante",
        cell: ({ row }: { row: { original: Row } }) => {
          const r = row.original
          const initial = (r.nombres?.[0] || "?").toUpperCase()
          return (
            <div className="flex items-center gap-3">
              <span
                className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  backgroundColor: `color-mix(in srgb, ${ACCENT} 12%, transparent)`,
                  color: ACCENT,
                }}
              >
                {initial}
              </span>
              <span className="font-semibold" style={{ color: COLORS.CHARCOAL }}>
                {r.nombres} {r.apellidos}
              </span>
            </div>
          )
        },
      },
      { accessorKey: "cedula", header: "Cédula" },
      {
        accessorKey: "correo",
        header: "Correo",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const v = getValue() as string
          return <span className="truncate max-w-[220px] inline-block align-bottom">{v || "—"}</span>
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const v = getValue() as string
          const badge = estadoBadge(v)
          return (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
          )
        },
      },
    ],
    []
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  if (loading) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
        <div className="p-8 flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: ACCENT, borderTopColor: "transparent" }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <HugeiconsIcon
          icon={SearchIcon}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          size={14}
          style={{ color: TEXT_MUTED }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar estudiante..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border bg-white/70 text-sm outline-none transition-all focus:bg-white focus:ring-2"
          style={{ borderColor: BORDER, color: COLORS.CHARCOAL }}
        />
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <HugeiconsIcon icon={Users} size={32} style={{ color: TEXT_MUTED }} />
          <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>
            {search ? "Sin resultados" : "Sin estudiantes inscritos"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: BORDER }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b" style={{ borderColor: BORDER }}>
                      {hg.headers.map((header) => {
                        const sortable = header.column.getCanSort()
                        return (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${sortable ? "cursor-pointer select-none hover:bg-gray-50" : ""}`}
                            style={{ color: TEXT_MUTED }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: " ↑",
                              desc: " ↓",
                            }[header.column.getIsSorted() as string] ?? null}
                          </th>
                        )
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50/70 transition-colors"
                      style={{ borderColor: BORDER }}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-xs" style={{ color: COLORS.CHARCOAL }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationControls table={table} />
        </>
      )}
    </div>
  )
}