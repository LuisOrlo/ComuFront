import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type Cell,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { MatriculaDetallada } from "@/services/cursos.service"

interface Props {
  matriculas: MatriculaDetallada[]
}

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const ACCENT = COLORS.ACCENT

function formatDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })
}

function getStudentName(row: MatriculaDetallada) {
  const e = row.estudiante || row.solicitud_inscripcion?.estudiante
  const ext = row.solicitud_inscripcion?.participante_externo
  return [e?.nombres || ext?.nombres || "", e?.apellidos || ext?.apellidos || ""].filter(Boolean).join(" ") || "—"
}

function getCiudad(row: MatriculaDetallada) {
  return row.estudiante?.ciudad || row.solicitud_inscripcion?.estudiante?.ciudad || row.solicitud_inscripcion?.participante_externo?.ciudad || "—"
}

function getOcupacion(row: MatriculaDetallada) {
  return row.estudiante?.perfil_estudiante?.ocupacion || row.solicitud_inscripcion?.estudiante?.perfil_estudiante?.ocupacion || "—"
}

const PAGE_SIZES = [10, 20, 50]

function Badge({ children, color }: { children: string; color: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
      {children}
    </span>
  )
}

export function CursoEstudiantesTable({ matriculas }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [globalFilter, setGlobalFilter] = useState("")

  const columns = useMemo<ColumnDef<MatriculaDetallada>[]>(() => [
    {
      id: "rowNumber",
      header: "#",
      cell: ({ row }) => <span style={{ color: TEXT_MUTED }}>{row.index + 1}</span>,
      enableSorting: false,
      size: 44,
    },
    {
      id: "estudiante",
      header: "Estudiante",
      accessorFn: getStudentName,
      enableSorting: true,
    },
    {
      id: "ciudad",
      header: "Ciudad",
      accessorFn: getCiudad,
      cell: ({ getValue }) => <Badge color={COLORS.ACCENT}>{getValue<string>()}</Badge>,
      enableSorting: true,
    },
    {
      id: "ocupacion",
      header: "Ocupación",
      accessorFn: getOcupacion,
      cell: ({ getValue }) => <Badge color="oklch(0.50 0.12 260)">{getValue<string>()}</Badge>,
      enableSorting: true,
    },
    {
      id: "inscripcion",
      header: "Inscripción",
      accessorFn: (row) => formatDate(row.fecha_inscripcion),
      cell: ({ getValue }) => <span style={{ color: TEXT_MUTED }}>{getValue<string>()}</span>,
      enableSorting: true,
    },
  ], [])

  const table = useReactTable({
    data: matriculas,
    columns,
    state: { sorting, pagination, globalFilter },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetAll: false,
  })

  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const { pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const from = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalRows)

  function renderCellContent(cell: Cell<MatriculaDetallada, unknown>) {
    return flexRender(cell.column.columnDef.cell, cell.getContext())
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="relative w-full sm:w-72">
        <HugeiconsIcon icon={Search01Icon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => { setGlobalFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
          placeholder="Buscar estudiante..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none"
          style={{ borderColor: BORDER }}
        />
      </div>

      {/* Table */}
      <div style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ backgroundColor: ACCENT }}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        color: "white",
                        borderBottom: "none",
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                      className={canSort ? "cursor-pointer select-none" : ""}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {canSort && (
                          <span className="inline-flex flex-col leading-none ml-1">
                            <HugeiconsIcon icon={ArrowUp01Icon} size={10} className={sorted === "asc" ? "text-white" : "text-white/40"} />
                            <HugeiconsIcon icon={ArrowDown01Icon} size={10} className={sorted === "desc" ? "text-white" : "text-white/40"} />
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "48px 16px", textAlign: "center", color: TEXT_MUTED }}>
                  No se encontraron estudiantes
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr key={row.id} style={{
                  borderBottom: `1px solid ${BORDER}`,
                  backgroundColor: idx % 2 === 0 ? "white" : `${ACCENT}04`,
                }}
                  className="hover:bg-amber-50/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{
                      padding: "10px 16px",
                      fontSize: "13px",
                      color: CHARCOAL,
                    }}>
                      {renderCellContent(cell)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: TEXT_MUTED }}>
        <div className="flex items-center gap-2">
          <span>Filas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border bg-white outline-none text-xs font-medium"
            style={{ borderColor: BORDER }}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <span className="font-medium">
          {from}–{to} de {totalRows}
        </span>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="-ml-2" />
          </button>
          <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(0, Math.min(currentPage - 3, totalPages - 5))
            const pageNum = start + i + 1
            return (
              <button key={pageNum} type="button" onClick={() => table.setPageIndex(pageNum - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: currentPage === pageNum ? ACCENT : "transparent",
                  color: currentPage === pageNum ? "white" : TEXT_MUTED,
                  boxShadow: currentPage === pageNum ? `0 2px 6px ${ACCENT}44` : "none",
                }}>
                {pageNum}
              </button>
            )
          })}
          <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="rotate-180" />
          </button>
          <button type="button" onClick={() => table.setPageIndex(totalPages - 1)} disabled={!table.getCanNextPage()}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="rotate-180" />
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="-ml-2 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  )
}
