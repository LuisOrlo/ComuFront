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
import { MoreVertical } from "lucide-react"
import { Link } from "react-router"
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { parseLocalDate } from "@/lib/utils"
import type { MatriculaDetallada } from "@/services/cursos.service"

interface Props {
  matriculas: MatriculaDetallada[]
  meta?: { total: number; per_page: number; current_page: number; last_page: number }
  onPageChange?: (page: number) => void
}

const BORDER = COLORS.BORDER_SUBTLE
const TEXT_MUTED = COLORS.TEXT_MUTED
const ACCENT = COLORS.ACCENT

function formatDate(d?: string) {
  if (!d) return "—"
  return parseLocalDate(d).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })
}

function getStudentName(row: MatriculaDetallada) {
  const e = row.estudiante || row.solicitud_inscripcion?.estudiante
  const ext = row.solicitud_inscripcion?.participante_externo
  return [e?.nombres || ext?.nombres || "", e?.apellidos || ext?.apellidos || ""].filter(Boolean).join(" ") || "—"
}

function getCiudad(row: MatriculaDetallada) {
  return row.estudiante?.ciudad || row.solicitud_inscripcion?.estudiante?.ciudad || row.solicitud_inscripcion?.participante_externo?.ciudad || "—"
}

function getCorreo(row: MatriculaDetallada) {
  return row.estudiante?.correo || row.solicitud_inscripcion?.estudiante?.correo || row.solicitud_inscripcion?.participante_externo?.correo || ""
}

function getOcupacion(row: MatriculaDetallada) {
  return row.estudiante?.perfil_estudiante?.ocupacion || row.solicitud_inscripcion?.estudiante?.perfil_estudiante?.ocupacion || "—"
}

const PAGE_SIZES = [10, 20, 50]

export function CursoEstudiantesTable({ matriculas, meta, onPageChange }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

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
      cell: ({ getValue, row }) => {
        const nombre = getValue<string>()
        const correo = getCorreo(row.original)
        const iniciales = nombre.split(" ").filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase()
        return <div className="flex items-center gap-3"><span className="size-9 rounded-full bg-[#ffdbca] text-[#5c2400] font-bold text-xs flex items-center justify-center shrink-0">{iniciales || "—"}</span><span><span className="block font-semibold text-[#0b1c30]">{nombre}</span>{correo && <span className="block text-xs font-normal text-[#45464d] mt-0.5">{correo}</span>}</span></div>
      },
      enableSorting: true,
    },
    {
      id: "ciudad",
      header: "Ciudad",
      accessorFn: getCiudad,
      cell: ({ getValue }) => <span className="text-sm text-[#45464d]">{getValue<string>()}</span>,
      enableSorting: true,
    },
    {
      id: "ocupacion",
      header: "Ocupación",
      accessorFn: getOcupacion,
      cell: ({ getValue }) => <span className="inline-block px-2.5 py-1 rounded-full bg-[#e5eeff] text-[11px] text-[#0b1c30]">{getValue<string>()}</span>,
      enableSorting: true,
    },
    {
      id: "notas",
      header: "Notas M1",
      accessorFn: (row) => {
        const notas = (row.notas || []).filter((nota) => nota.modulo?.numero_orden === 1)
        if (notas.length === 0) return null
        return notas.reduce((sum, n) => sum + (Number(n.calificacion) || 0), 0) / notas.length
      },
      cell: ({ getValue }) => {
        const avg = getValue<number | null>()
        if (avg === null || avg === undefined) return <span className="text-xs" style={{ color: TEXT_MUTED }}>—</span>
        const color = avg >= 7 ? "oklch(0.50 0.12 150)" : avg >= 4 ? "oklch(0.65 0.15 80)" : "oklch(0.50 0.12 10)"
        return (
          <span className="inline-block px-2.5 py-1 rounded-lg text-sm font-bold" style={{ backgroundColor: "#d3e4fe", color }}>{avg.toFixed(1)} / 10</span>
        )
      },
      enableSorting: true,
    },
    {
      id: "inscripcion",
      header: "Inscripción",
      accessorFn: (row) => formatDate(row.fecha_inscripcion),
      cell: ({ getValue }) => <span style={{ color: TEXT_MUTED }}>{getValue<string>()}</span>,
      enableSorting: true,
    },
    {
      id: "accion",
      header: () => <span className="block text-right">Acción</span>,
      cell: ({ row }) => row.original.estudiante?.id
        ? <div className="text-right"><Link to={`/estudiantes/${row.original.estudiante.id}/academico`} aria-label={`Ver perfil de ${getStudentName(row.original)}`} className="inline-flex p-1.5 rounded-lg text-[#45464d] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors"><MoreVertical size={20}/></Link></div>
        : <span className="block text-right text-[#c6c6cd]">—</span>,
      enableSorting: false,
    },
  ], [])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: matriculas,
    columns,
    state: { sorting, ...(meta ? {} : { pagination }) },
    onSortingChange: setSorting,
    onPaginationChange: meta ? undefined : setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(meta ? {} : { getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel() }),
    autoResetAll: false,
  })

  const currentPage = meta?.current_page ?? table.getState().pagination.pageIndex + 1
  const totalPages = meta?.last_page ?? table.getPageCount()
  const pageSize = meta?.per_page ?? table.getState().pagination.pageSize
  const totalRows = meta?.total ?? table.getFilteredRowModel().rows.length
  const from = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalRows)

  function renderCellContent(cell: Cell<MatriculaDetallada, unknown>) {
    return flexRender(cell.column.columnDef.cell, cell.getContext())
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ backgroundColor: "#eff4ff" }}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        color: "#45464d",
                        borderBottom: "none",
                        padding: "14px 20px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                    >
                      <button type="button" onClick={canSort ? header.column.getToggleSortingHandler() : undefined} disabled={!canSort} className={`flex items-center gap-1 ${canSort ? "cursor-pointer" : "cursor-default"}`}>
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {canSort && (
                          <span className="inline-flex flex-col leading-none ml-1">
                            <HugeiconsIcon icon={ArrowUp01Icon} size={10} className={sorted === "asc" ? "text-[#9d4300]" : "text-[#76777d]/40"} />
                            <HugeiconsIcon icon={ArrowDown01Icon} size={10} className={sorted === "desc" ? "text-[#9d4300]" : "text-[#76777d]/40"} />
                          </span>
                        )}
                      </button>
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
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} style={{
                  borderBottom: `1px solid ${BORDER}`,
                  backgroundColor: "white",
                }}
                  className="hover:bg-[#eff4ff] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{
                      padding: "16px 20px",
                      fontSize: "14px",
                      color: "#0b1c30",
                    }}>
                      {renderCellContent(cell)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      {/* Pagination */}
      <div className="px-5 py-3.5 bg-[#eff4ff] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: "#45464d" }}>
        {!meta && <div className="flex items-center gap-2">
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
        </div>}

        <span className="font-medium">
          {from}–{to} de {totalRows}
        </span>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => meta && onPageChange ? onPageChange(1) : table.setPageIndex(0)} disabled={currentPage <= 1}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="-ml-2" />
          </button>
          <button type="button" onClick={() => meta && onPageChange ? onPageChange(currentPage - 1) : table.previousPage()} disabled={currentPage <= 1}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(0, Math.min(currentPage - 3, totalPages - 5))
            const pageNum = start + i + 1
            return (
              <button key={pageNum} type="button" onClick={() => meta && onPageChange ? onPageChange(pageNum) : table.setPageIndex(pageNum - 1)}
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
          <button type="button" onClick={() => meta && onPageChange ? onPageChange(currentPage + 1) : table.nextPage()} disabled={currentPage >= totalPages}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="rotate-180" />
          </button>
          <button type="button" onClick={() => meta && onPageChange ? onPageChange(totalPages) : table.setPageIndex(totalPages - 1)} disabled={currentPage >= totalPages}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="rotate-180" />
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="-ml-2 rotate-180" />
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
