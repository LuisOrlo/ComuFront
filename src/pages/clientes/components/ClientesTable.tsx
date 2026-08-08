import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { Eye } from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table"
import { COLORS } from "@/lib/constants"
import type { ClienteExterno } from "@/services/clientes.service"
import { PaginationControls } from "@/components/table/PaginationControls"

interface ClientesTableProps {
  clientes: ClienteExterno[]
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
}

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

export function ClientesTable({ clientes, loading, search, onSearchChange }: ClientesTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })

  useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }, [search])

  const columns = useMemo<ColumnDef<ClienteExterno>[]>(() => [
    {
      id: "nombres",
      accessorFn: (c) => `${c.nombres} ${c.apellidos || ""}`.trim(),
      header: "Nombres",
      cell: ({ row }) => {
        const c = row.original
        return <span className="font-bold">{c.nombres} {c.apellidos || ""}</span>
      },
      enableSorting: true,
    },
    {
      id: "cedula",
      accessorFn: (c) => c.cedula,
      header: "Cédula",
      cell: ({ getValue }) => <span className="text-xs opacity-60">{getValue<string>() || "—"}</span>,
      enableSorting: true,
    },
    {
      id: "correo",
      accessorFn: (c) => c.correo,
      header: "Correo",
      cell: ({ getValue }) => <span className="text-xs">{getValue<string>() || "—"}</span>,
      enableSorting: true,
    },
    {
      id: "celular",
      accessorFn: (c) => c.celular,
      header: "Celular",
      cell: ({ getValue }) => <span className="text-xs">{getValue<string>() || "—"}</span>,
      enableSorting: true,
    },
    {
      id: "ciudad",
      accessorFn: (c) => c.ciudad,
      header: "Ciudad",
      cell: ({ getValue }) => <span className="text-xs">{getValue<string>() || "—"}</span>,
      enableSorting: true,
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center justify-center gap-1">
            <button onClick={() => navigate(`/clientes/${c.id}`)}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium"
              style={{ color: "#6b7280" }}>
              <Eye size={13} />
              Ver detalle
            </button>
          </div>
        )
      },
      enableSorting: false,
    },
  ], [navigate])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: clientes,
    columns,
    state: { sorting, pagination, globalFilter: search },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: onSearchChange,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetAll: false,
  })

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}
      </div>
    )
  }

  if (clientes.length === 0) {
    return (
      <div className="flex-1 p-12 text-center">
        <HugeiconsIcon icon={UserGroupIcon} size={40} className="opacity-20 mx-auto mb-3" />
        <p className="text-sm font-bold opacity-40">No hay clientes registrados</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b text-[9px] font-bold uppercase tracking-wider opacity-40" style={{ borderColor: BORDER }}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const isCenter = header.id === "acciones"
                  return (
                    <th key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={canSort ? "cursor-pointer select-none" : ""}
                      style={{
                        textAlign: isCenter ? "center" : "left",
                        padding: "12px 24px",
                      }}>
                      <div className="flex items-center gap-1"
                        style={{ justifyContent: isCenter ? "center" : "flex-start" }}>
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
          <tbody className="divide-y text-sm" style={{ borderColor: BORDER }}>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={40} className="opacity-20 mx-auto mb-3" />
                  <p className="text-sm font-bold opacity-40">No se encontraron clientes</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}
                  className="hover:bg-gray-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}
                      className={cell.column.id === "acciones" ? "px-6 py-4 text-center" : "px-6 py-4"}
                      style={{ color: CHARCOAL }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {table.getRowModel().rows.length > 0 && (
        <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: BORDER }}>
          <PaginationControls table={table} />
        </div>
      )}
    </>
  )
}
