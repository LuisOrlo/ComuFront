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
import { cn } from "@/lib/utils"
import type { ClienteExterno } from "@/services/clientes.service"
import { PaginationControls } from "@/components/table/PaginationControls"

interface ClientesTableProps {
  clientes: ClienteExterno[]
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
}

function getInitials(cliente: ClienteExterno) {
  const label = cliente.nombre_mostrado || (cliente.tipo_cliente === "empresa" && cliente.nombre_empresa ? cliente.nombre_empresa : `${cliente.nombres || ""} ${cliente.apellidos || ""}`) || "CL"
  return label.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase()
}

export function ClientesTable({ clientes, loading, search, onSearchChange }: ClientesTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }, [search])

  const columns = useMemo<ColumnDef<ClienteExterno>[]>(() => [
    {
      id: "nombres",
      accessorFn: (c) => c.nombre_mostrado || (c.tipo_cliente === "empresa" && c.nombre_empresa ? c.nombre_empresa : `${c.nombres || ""} ${c.apellidos || ""}`.trim()) || "—",
      header: "Cliente / Razón Social",
      cell: ({ row }) => {
        const c = row.original
        const displayName = c.nombre_mostrado || (c.tipo_cliente === "empresa" && c.nombre_empresa ? c.nombre_empresa : `${c.nombres || ""} ${c.apellidos || ""}`.trim()) || "—"
        return (
          <div className="flex min-w-[200px] items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-2xs">
              {getInitials(c)}
            </span>
            <div className="min-w-0">
              <span
                onClick={() => navigate(`/clientes/${c.id}`)}
                className="block truncate font-bold text-slate-900 hover:text-[#fd761a] transition-colors cursor-pointer text-sm"
              >
                {displayName}
              </span>
              {c.tipo_cliente === "empresa" && c.contactos && c.contactos.length > 0 && (
                <span className="block truncate text-[11px] text-slate-400 font-medium">
                  Contacto: {c.contactos[0].nombres} {c.contactos[0].apellidos || ""}
                </span>
              )}
            </div>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "tipo",
      accessorFn: (c) => (c.tipo_cliente === "empresa" ? "Cliente" : "Persona"),
      header: "Tipo",
      cell: ({ row }) => {
        const c = row.original
        const isCliente = c.tipo_cliente === "empresa"
        return isCliente ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 border border-orange-200/80 text-[#9d4300]">
            <span className="size-1.5 rounded-full bg-[#fd761a]" />
            Cliente
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-200/80 text-blue-700">
            <span className="size-1.5 rounded-full bg-blue-600" />
            Persona
          </span>
        )
      },
      enableSorting: true,
    },
    {
      id: "correo",
      accessorFn: (c) => c.correo,
      header: "Correo",
      cell: ({ getValue }) => {
        const val = getValue<string>()
        return (
          <span className="text-xs text-slate-600 font-medium truncate block max-w-[220px]" title={val || undefined}>
            {val || "—"}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      id: "celular",
      accessorFn: (c) => c.celular,
      header: "Celular",
      cell: ({ getValue }) => {
        const val = getValue<string>()
        return (
          <span className="text-xs font-mono font-medium text-slate-700">
            {val || "—"}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      id: "ciudad",
      accessorFn: (c) => c.ciudad,
      header: "Ciudad",
      cell: ({ getValue }) => {
        const val = getValue<string>()
        return (
          <span className="text-xs text-slate-600 font-medium">
            {val || "—"}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center justify-end pr-2">
            <button
              onClick={() => navigate(`/clientes/${c.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/80 text-slate-700 hover:bg-orange-50 hover:text-[#fd761a] hover:border-orange-200/80 transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <Eye size={13} />
              <span>Ver detalle</span>
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
      <div className="flex-1 p-8 space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (clientes.length === 0) {
    return (
      <div className="flex-1 p-14 text-center">
        <HugeiconsIcon icon={UserGroupIcon} size={36} className="text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-700">No hay clientes registrados</p>
        <p className="text-xs text-slate-400 mt-0.5">Registra nuevos clientes para comenzar.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[780px] border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const isActions = header.id === "acciones"
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={cn("px-4 py-3.5 text-left", canSort && "cursor-pointer select-none hover:text-slate-800")}
                    >
                      <div className={cn("flex items-center gap-1", isActions && "justify-end pr-2")}>
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {canSort && (
                          <span className="inline-flex flex-col leading-none ml-1">
                            <HugeiconsIcon icon={ArrowUp01Icon} size={10} className={sorted === "asc" ? "text-slate-800 font-bold" : "opacity-30"} />
                            <HugeiconsIcon icon={ArrowDown01Icon} size={10} className={sorted === "desc" ? "text-slate-800 font-bold" : "opacity-30"} />
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={36} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No se encontraron clientes con el filtro aplicado</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-default"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 text-slate-800">
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
        <div className="shrink-0 px-4 py-3 border-t border-slate-200/80 bg-slate-50/50">
          <PaginationControls table={table} />
        </div>
      )}
    </>
  )
}
