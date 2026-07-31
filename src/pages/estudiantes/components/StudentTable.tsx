import { useMemo, useEffect, useState } from "react"
import { Link } from "react-router"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import { GraduationCapIcon, Clock04Icon, ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { FinancialStatusBadge } from "./FinancialStatusBadge"
import { PaginationControls } from "@/components/table/PaginationControls"

export interface StudentRow {
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  telefono?: string
  ciudad?: string
  direccion?: string
  ocupacion?: string
  estado_pago?: string
  total_cursos?: number
  saldo_pendiente?: number
  fecha_inscripcion?: string
}

interface StudentTableProps {
  estudiantes: StudentRow[]
  loading: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  variant?: "estudiantes" | "participantes"
}

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED

const COLUMN_ALIGN: Record<string, "center" | "right"> = {
  estado: "center",
  cursos: "center",
  saldo: "center",
  acciones: "right",
}

function SaldoCell({ saldo_pendiente, estado_pago }: { saldo_pendiente?: number; estado_pago?: string }) {
  if (saldo_pendiente === undefined || saldo_pendiente === null) {
    return <span className="text-sm font-medium" style={{ color: TEXT_MUTED }}>Sin registro</span>
  }
  if (saldo_pendiente > 0) {
    return <span className="text-sm font-bold" style={{ color: "oklch(0.50 0.12 10)" }}>${saldo_pendiente.toLocaleString()}</span>
  }
  if (saldo_pendiente === 0 && estado_pago === "al_dia") {
    return <span className="text-sm font-bold" style={{ color: "oklch(0.50 0.12 150)" }}>Completo</span>
  }
  if (saldo_pendiente === 0 && estado_pago === "ninguno") {
    return <span className="text-sm font-medium" style={{ color: TEXT_MUTED }}>Sin registro</span>
  }
  return <span className="text-sm font-bold">$0</span>
}

function getAlignment(columnId: string): "center" | "right" | undefined {
  return COLUMN_ALIGN[columnId]
}

export function StudentTable({ estudiantes, loading, selectedIds, onToggleSelect, onToggleSelectAll, variant = "estudiantes" }: StudentTableProps) {
  const isEstudiantes = variant === "estudiantes"
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })

  useEffect(() => {
    if (loading) {
      setPagination(p => ({ ...p, pageIndex: 0 }))
    }
  }, [loading])

  const columns = useMemo<ColumnDef<StudentRow>[]>(() => [
    {
      id: "seleccion",
      header: () => (
        <input
          type="checkbox"
          checked={estudiantes.length > 0 && selectedIds.size === estudiantes.length}
          onChange={onToggleSelectAll}
          className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => onToggleSelect(row.original.id)}
          className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      ),
      enableSorting: false,
      size: 48,
    },
    {
      id: "estudiante",
      accessorFn: (r) => `${r.nombres} ${r.apellidos}`,
      header: "Estudiante",
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm uppercase">
              {e.nombres.charAt(0)}{e.apellidos.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight" style={{ color: CHARCOAL }}>{e.nombres} {e.apellidos}</div>
              <div className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>{e.correo || 'Sin correo registrado'}</div>
            </div>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "identificacion",
      accessorFn: (r) => r.cedula,
      header: "Identificacion",
      cell: ({ getValue }) => {
        const cedula = getValue<string>()
        return (
          <div className="text-sm font-mono px-3 py-1 rounded-lg inline-block" style={{ color: CHARCOAL, backgroundColor: "oklch(0.97 0 0)" }}>{cedula || '—'}</div>
        )
      },
      enableSorting: true,
    },
    {
      id: "estado",
      accessorFn: (r) => r.estado_pago || "ninguno",
      header: "Estado Financiero",
      cell: ({ getValue }) => <FinancialStatusBadge status={getValue<string>()} />,
      enableSorting: true,
    },
    {
      id: "cursos",
      accessorFn: (r) => r.total_cursos ?? 0,
      header: "Cursos",
      cell: ({ row }) => {
        const total = row.original.total_cursos
        return (
          <span className="text-base font-semibold" style={{ color: CHARCOAL }}>
            {isEstudiantes ? (total ?? 0) : (total !== undefined && total !== null ? total : "N/A")}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      id: "saldo",
      accessorFn: (r) => r.saldo_pendiente,
      header: "Saldo",
      cell: ({ row }) => <SaldoCell saldo_pendiente={row.original.saldo_pendiente} estado_pago={row.original.estado_pago} />,
      enableSorting: true,
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => {
        const e = row.original
        return e.id && !e.id.startsWith("mat-") ? (
          <Link
            to={`/estudiantes/${e.id}/academico`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 shadow-sm"
            style={{
              backgroundColor: "oklch(0.97 0 0)",
              color: TEXT_MUTED,
            }}
            onMouseEnter={(ev) => {
              ev.currentTarget.style.backgroundColor = COLORS.ACCENT
              ev.currentTarget.style.color = "white"
            }}
            onMouseLeave={(ev) => {
              ev.currentTarget.style.backgroundColor = "oklch(0.97 0 0)"
              ev.currentTarget.style.color = TEXT_MUTED
            }}
          >
            <HugeiconsIcon icon={GraduationCapIcon} size={14} />
            Ver Perfil
          </Link>
        ) : (
          <span className="text-xs" style={{ color: TEXT_MUTED }}>—</span>
        )
      },
      enableSorting: false,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [estudiantes.length, selectedIds.size, onToggleSelect, onToggleSelectAll, isEstudiantes])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: estudiantes,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (row, index) => row.id || `student-${index}`,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetAll: false,
  })

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse [&_td]:border [&_th]:border [&_td]:border-[oklch(0.85_0_0)] [&_th]:border-[oklch(0.85_0_0)]">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-gray-50/80 border-b" style={{ borderColor: BORDER }}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const align = getAlignment(header.id)
                  return (
                    <th key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={canSort ? "cursor-pointer select-none" : ""}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        padding: "12px 16px",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        color: TEXT_MUTED,
                      }}>
                      <div className="flex items-center gap-1"
                        style={{ justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start" }}>
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {canSort && (
                          <span className="inline-flex flex-col leading-none ml-1">
                            <HugeiconsIcon icon={ArrowUp01Icon} size={10} className={sorted === "asc" ? "" : "opacity-40"} />
                            <HugeiconsIcon icon={ArrowDown01Icon} size={10} className={sorted === "desc" ? "" : "opacity-40"} />
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y" style={{ borderColor: BORDER }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="size-4 rounded bg-gray-100 animate-pulse mx-auto" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-gray-100 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
                        <div className="h-3 w-24 bg-gray-50 animate-pulse rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="h-6 w-20 bg-gray-100 animate-pulse rounded-lg" /></td>
                  <td className="px-4 py-3"><div className="h-6 w-24 bg-gray-100 animate-pulse rounded-lg mx-auto" /></td>
                  <td className="px-4 py-3"><div className="h-8 w-12 bg-gray-100 animate-pulse rounded-lg mx-auto" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-100 animate-pulse rounded mx-auto" /></td>
                  <td className="px-4 py-3"><div className="h-8 w-24 bg-gray-100 animate-pulse rounded-xl float-right" /></td>
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-8 py-20 text-center">
                  <div className="size-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-bold">No se encontraron estudiantes</h3>
                  <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda o filtros.</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors duration-150"
                  onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "oklch(0.98 0 0)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "transparent")}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = getAlignment(cell.column.id)
                    return (
                      <td key={cell.id} style={{ padding: "12px 16px", textAlign: align === "center" ? "center" : align === "right" ? "right" : "left" }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && table.getRowModel().rows.length > 0 && (
        <div className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
          <PaginationControls table={table} />
        </div>
      )}
    </div>
  )
}
