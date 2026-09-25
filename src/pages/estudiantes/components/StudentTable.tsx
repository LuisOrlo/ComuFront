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
import {
  Clock04Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Coins01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { PaginationControls } from "@/components/table/PaginationControls"
import { CiudadBadge } from "./Badges"

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
  onClearSelection?: () => void
  variant?: "estudiantes" | "participantes"
  meta?: { actual: number; ultima_pagina: number; total: number; per_page: number }
  onPageChange?: (page: number) => void
}

function FinancialCell({ saldo_pendiente, estado_pago }: { saldo_pendiente?: number; estado_pago?: string }) {
  if (estado_pago === "al_dia") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#009668] text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#009668]"></span>
        Al día
      </span>
    )
  }
  if (estado_pago === "deudor") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdbca] text-[#783200] text-xs font-semibold">
        <HugeiconsIcon icon={Clock04Icon} size={13} />
        Pendiente {saldo_pendiente ? `($${saldo_pendiente.toLocaleString()})` : ""}
      </span>
    )
  }
  if (estado_pago === "abonado") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
        <HugeiconsIcon icon={Coins01Icon} size={13} className="text-[#9d4300]" />
        Abonado {saldo_pendiente ? `(Saldo $${saldo_pendiente.toLocaleString()})` : ""}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#45464d] text-xs font-medium">
      Sin actividad
    </span>
  )
}

export function StudentTable({
  estudiantes,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
  variant = "estudiantes",
  meta,
  onPageChange,
}: StudentTableProps) {
  const isEstudiantes = variant === "estudiantes"
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })
  const [showSelector, setShowSelector] = useState(false)
  const isSelectorVisible = showSelector || selectedIds.size > 0

  useEffect(() => {
    if (loading) {
      setPagination((p) => ({ ...p, pageIndex: 0 }))
    }
  }, [loading])

  const columns = useMemo<ColumnDef<StudentRow>[]>(
    () => {
      const allCols: ColumnDef<StudentRow>[] = []

      if (isSelectorVisible) {
        allCols.push({
          id: "seleccion",
          header: () => (
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={estudiantes.length > 0 && selectedIds.size === estudiantes.length}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-[#c6c6cd] cursor-pointer accent-[#fd761a]"
                aria-label="Seleccionar todos los estudiantes visibles"
                title="Seleccionar todos los estudiantes visibles"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSelector(false)
                  onClearSelection?.()
                }}
                className="text-[#76777d] hover:text-[#ba1a1a] transition-colors p-0.5 rounded cursor-pointer"
                title="Ocultar selector de selección"
                aria-label="Ocultar selector de selección"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} />
              </button>
            </div>
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={selectedIds.has(row.original.id)}
              onChange={() => onToggleSelect(row.original.id)}
              className="w-4 h-4 rounded border-[#c6c6cd] cursor-pointer accent-[#fd761a]"
              aria-label={`Seleccionar ${row.original.nombres} ${row.original.apellidos}`}
            />
          ),
          enableSorting: false,
          size: 54,
        })
      }

      allCols.push(
        {
          id: "estudiante",
        accessorFn: (r) => `${r.nombres} ${r.apellidos}`,
        header: "Estudiante",
        cell: ({ row }) => {
          const e = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e5eeff] text-[#0b1c30] font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                {e.nombres.charAt(0)}
                {e.apellidos.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#0b1c30] truncate">
                  {e.nombres} {e.apellidos}
                </span>
                <span className="text-[11px] text-[#45464d] truncate">
                  {e.correo || "Sin correo registrado"}
                </span>
              </div>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "identificacion",
        accessorFn: (r) => r.cedula,
        header: "Identificación",
        cell: ({ getValue }) => {
          const cedula = getValue<string>()
          return (
            <span className="font-mono text-xs text-[#45464d] bg-[#f8f9ff] px-2.5 py-1 rounded-md border border-[#c6c6cd]/25 inline-block">
              {cedula || "—"}
            </span>
          )
        },
        enableSorting: true,
      },
      {
        id: "ciudad",
        accessorFn: (r) => r.ciudad ?? "—",
        header: "Ciudad / Sede",
        cell: ({ row }) => <CiudadBadge ciudad={row.original.ciudad} />,
        enableSorting: true,
      },
      {
        id: "cursos",
        accessorFn: (r) => r.total_cursos ?? 0,
        header: "Inscripciones",
        cell: ({ row }) => {
          const total = row.original.total_cursos
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#e5eeff] text-[#0b1c30] text-xs font-medium">
              {isEstudiantes ? `${total ?? 0} ${total === 1 ? "curso" : "cursos"}` : total ?? "N/A"}
            </span>
          )
        },
        enableSorting: true,
      },
      {
        id: "estado",
        accessorFn: (r) => r.estado_pago ?? "ninguno",
        header: "Estado financiero",
        cell: ({ row }) => (
          <FinancialCell
            saldo_pendiente={row.original.saldo_pendiente}
            estado_pago={row.original.estado_pago}
          />
        ),
        enableSorting: true,
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const e = row.original
          return e.id && !e.id.startsWith("mat-") ? (
            <div className="text-right">
              <Link
                to={`/estudiantes/${e.id}/academico`}
                className="text-xs text-[#9d4300] hover:text-[#783200] font-semibold transition-colors inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Ver perfil</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-xs text-[#45464d]">—</span>
            </div>
          )
        },
        enableSorting: false,
        size: 100,
      }
    )

    return allCols
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [isSelectorVisible, estudiantes.length, selectedIds.size, onToggleSelect, onToggleSelectAll, isEstudiantes]
)

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: estudiantes,
    columns,
    state: { sorting, ...(meta ? {} : { pagination }) },
    onSortingChange: setSorting,
    onPaginationChange: meta ? undefined : setPagination,
    getRowId: (row, index) => row.id || `student-${index}`,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(meta ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    autoResetAll: false,
  })

  const totalCount = meta?.total ?? estudiantes.length
  const currentPage = meta?.actual ?? pagination.pageIndex + 1
  const pageSize = meta?.per_page ?? pagination.pageSize
  const startRange = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endRange = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden mb-4 border border-[#c6c6cd]/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-[#eff4ff] border-b border-[#c6c6cd]/30 text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const isActions = header.id === "acciones"
                  return (
                    <th
                      key={header.id}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                      className={`py-3.5 px-4 ${isActions ? "text-right" : ""}`}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header.id === "seleccion" ? (
                        flexRender(header.column.columnDef.header, header.getContext())
                      ) : (
                        <div className={`inline-flex items-center gap-2 ${isActions ? "ml-auto justify-end" : ""}`}>
                          {header.id === "estudiante" && !isSelectorVisible && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowSelector(true)
                              }}
                              className="w-4 h-4 rounded border border-[#c6c6cd] hover:border-[#fd761a] hover:bg-[#ffdbca]/20 bg-white transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                              title="Activar casillas de selección"
                              aria-label="Activar casillas de selección"
                            />
                          )}
                          <button
                            type="button"
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                            disabled={!canSort}
                            className={`inline-flex items-center gap-1 font-bold ${
                              canSort ? "cursor-pointer hover:text-[#fd761a]" : "cursor-default"
                            }`}
                          >
                            <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            {canSort && (
                              <span className="inline-flex flex-col leading-none ml-1">
                                <HugeiconsIcon
                                  icon={ArrowUp01Icon}
                                  size={10}
                                  className={sorted === "asc" ? "text-[#fd761a]" : "opacity-40"}
                                />
                                <HugeiconsIcon
                                  icon={ArrowDown01Icon}
                                  size={10}
                                  className={sorted === "desc" ? "text-[#fd761a]" : "opacity-40"}
                                />
                              </span>
                            )}
                          </button>
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#e5eeff]/60 text-xs text-[#0b1c30]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="hover:bg-[#eff4ff]/30">
                  {isSelectorVisible && (
                    <td className="py-3 px-4"><div className="w-4 h-4 rounded bg-gray-100 animate-pulse" /></td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 bg-gray-100 animate-pulse rounded" />
                        <div className="h-3 w-24 bg-gray-50 animate-pulse rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><div className="h-6 w-24 bg-gray-100 animate-pulse rounded-md" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-20 bg-gray-100 animate-pulse rounded" /></td>
                  <td className="py-3 px-4"><div className="h-5 w-16 bg-gray-100 animate-pulse rounded-full" /></td>
                  <td className="py-3 px-4"><div className="h-6 w-20 bg-gray-100 animate-pulse rounded-full" /></td>
                  <td className="py-3 px-4 text-right"><div className="h-4 w-16 bg-gray-100 animate-pulse rounded ml-auto" /></td>
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-8 py-20 text-center">
                  <div className="w-16 h-16 bg-[#eff4ff] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <HugeiconsIcon icon={Clock04Icon} size={26} className="text-[#45464d]/60" />
                  </div>
                  <h3 className="text-[#0b1c30] font-bold text-sm">No se encontraron estudiantes</h3>
                  <p className="text-xs text-[#45464d] mt-1">Intenta con otros criterios de búsqueda o filtros.</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#eff4ff]/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && table.getRowModel().rows.length > 0 && meta && onPageChange && (
        <div className="p-3.5 px-4 bg-[#eff4ff] flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#c6c6cd]/20 text-xs">
          <div className="flex items-center gap-1.5 text-[#45464d]">
            <span>
              Mostrando <span className="font-semibold text-[#0b1c30]">{startRange}–{endRange}</span> de{" "}
              <span className="font-semibold text-[#0b1c30]">{meta.total}</span> estudiantes
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(meta.actual - 1)}
              disabled={meta.actual <= 1}
              className="h-8 px-2.5 rounded bg-white text-[#45464d] hover:text-[#0b1c30] text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 border border-[#c6c6cd]/30"
            >
              Anterior
            </button>
            <span className="h-8 min-w-[32px] px-2 rounded bg-[#fd761a] text-white text-xs font-bold shadow-sm flex items-center justify-center">
              {meta.actual}
            </span>
            {meta.actual < meta.ultima_pagina && (
              <button
                type="button"
                onClick={() => onPageChange(meta.actual + 1)}
                className="h-8 min-w-[32px] px-2 rounded bg-white hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold shadow-sm transition-colors border border-[#c6c6cd]/30 flex items-center justify-center cursor-pointer"
              >
                {meta.actual + 1}
              </button>
            )}
            <button
              type="button"
              onClick={() => onPageChange(meta.actual + 1)}
              disabled={meta.actual >= meta.ultima_pagina}
              className="h-8 px-2.5 rounded bg-white text-[#0b1c30] text-xs font-semibold shadow-sm hover:bg-[#e5eeff] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 border border-[#c6c6cd]/30"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {!loading && table.getRowModel().rows.length > 0 && !meta && (
        <div className="px-4 py-3 border-t border-[#c6c6cd]/20 bg-[#eff4ff]">
          <PaginationControls table={table} />
        </div>
      )}
    </div>
  )
}
