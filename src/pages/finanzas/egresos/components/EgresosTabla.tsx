import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { Eye, Pencil, Trash2 } from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table"
import { COLORS } from "@/lib/constants"
import { PaginationControls } from "@/components/table/PaginationControls"

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

function fmtDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) }

const CAT_BADGE: Record<string, { bg: string; text: string }> = {
  "Personal": { bg: "oklch(0.5 0.15 260 / 0.12)", text: "#4f46e5" },
  "Servicios": { bg: "oklch(0.5 0.15 80 / 0.12)", text: "#d97706" },
  "Equipos": { bg: "oklch(0.5 0.15 280 / 0.12)", text: "#7c3aed" },
}

interface EgresoRow {
  id: string
  fecha_pago: string
  descripcion?: string
  categoria_nombre?: string
  proveedor_beneficiario?: string
  monto: number
  metodo_pago?: string
}

interface Props {
  data: EgresoRow[]
  loading: boolean
  onDelete: (id: string) => void
}

export function EgresosTabla({ data, loading, onDelete }: Props) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([{ id: "fecha_pago", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  useEffect(() => {
    if (loading) {
      setPagination(p => ({ ...p, pageIndex: 0 }))
    }
  }, [loading])

  const columns = useMemo<ColumnDef<EgresoRow>[]>(() => [
    {
      id: "fecha_pago",
      accessorFn: (item) => item.fecha_pago,
      header: "Fecha",
      cell: ({ getValue }) => <span className="text-xs font-medium" style={{ color: CHARCOAL }}>{fmtDate(getValue<string>())}</span>,
      enableSorting: true,
    },
    {
      id: "descripcion",
      accessorFn: (item) => item.descripcion,
      header: "Descripción",
      cell: ({ getValue }) => <span className="text-xs truncate max-w-[180px] block" style={{ color: CHARCOAL }}>{getValue<string>() || "—"}</span>,
      enableSorting: false,
    },
    {
      id: "categoria",
      accessorFn: (item) => item.categoria_nombre,
      header: "Categoría",
      cell: ({ getValue }) => {
        const cat = getValue<string>()
        return (
          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase"
            style={{ backgroundColor: CAT_BADGE[cat || ""]?.bg || "#dc262618", color: CAT_BADGE[cat || ""]?.text || "#dc2626" }}>
            {cat || "—"}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: "proveedor",
      accessorFn: (item) => item.proveedor_beneficiario,
      header: "Proveedor",
      cell: ({ getValue }) => <span className="text-xs opacity-60">{getValue<string>() || "—"}</span>,
      enableSorting: false,
    },
    {
      id: "monto",
      accessorFn: (item) => Number(item.monto || 0),
      header: "Monto",
      cell: ({ getValue }) => <span className="text-xs font-bold" style={{ color: "#dc2626" }}>${Number(getValue<number>() || 0).toLocaleString()}</span>,
      enableSorting: true,
    },
    {
      id: "metodo",
      accessorFn: (item) => item.metodo_pago,
      header: "Método",
      cell: ({ getValue }) => <span className="text-xs capitalize opacity-60">{getValue<string>() || "—"}</span>,
      enableSorting: false,
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center justify-center gap-1">
            <button onClick={() => navigate(`/finanzas/egresos/${item.id}`)}
              className="size-8 group flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              title="Ver detalle">
              <Eye size={14} className="opacity-40 group-hover:opacity-100 group-hover:text-blue-600 transition-colors" />
            </button>
            <button onClick={() => navigate(`/finanzas/egresos/${item.id}/editar`)}
              className="size-8 group flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              title="Editar">
              <Pencil size={14} className="opacity-40 group-hover:opacity-100 group-hover:text-amber-600 transition-colors" />
            </button>
            <button onClick={() => onDelete(item.id)}
              className="size-8 group flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
              title="Eliminar">
              <Trash2 size={14} className="opacity-40 text-red-500 group-hover:opacity-100 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
        )
      },
      enableSorting: false,
    },
  ], [navigate, onDelete])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetAll: false,
  })

  const totalFila = data.reduce((s, r) => s + Number(r.monto || 0), 0)

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-gray-50/80">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                const isCenter = header.id === "acciones"
                return (
                  <th key={header.id}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    className={canSort ? "px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 cursor-pointer hover:opacity-70 select-none" : "px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40"}
                    style={{ textAlign: isCenter ? "center" : "left" }}>
                    <div className="flex items-center gap-1" style={{ justifyContent: isCenter ? "center" : "flex-start" }}>
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      {canSort && (
                        <span className="inline-flex flex-col leading-none ml-1">
                          <HugeiconsIcon icon={ArrowUp01Icon} size={9} className={sorted === "asc" ? "" : "opacity-40"} />
                          <HugeiconsIcon icon={ArrowDown01Icon} size={9} className={sorted === "desc" ? "" : "opacity-40"} />
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
            <tr><td colSpan={columns.length} className="p-10 text-center opacity-40">Cargando...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="p-10 text-center opacity-40">Sin egresos registrados</td></tr>
          ) : table.getRowModel().rows.map((row, i) => (
            <tr key={row.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }} className="hover:bg-gray-100/50 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}
                  className={cell.column.id === "acciones" ? "px-3 py-2 text-center" : "px-3 py-2"}
                  style={{ color: CHARCOAL }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {data.length > 0 && (
          <tfoot>
            <tr style={{ backgroundColor: CHARCOAL }}>
              <td className="px-3 py-2" colSpan={5}>
                <span className="text-[10px] font-bold text-white/60">Total ({data.length} registros)</span>
              </td>
              <td className="px-3 py-2 text-xs font-bold text-white">${totalFila.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>
      {data.length > 0 && (
        <div className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
          <PaginationControls table={table} />
        </div>
      )}
    </div>
  )
}
