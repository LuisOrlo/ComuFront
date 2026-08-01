import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { Eye, Pencil } from "lucide-react"
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

const CAT_COLORS: Record<string, string> = {
  "Cursos": "oklch(0.55 0.15 150 / 0.12)",
  "Talleres": "oklch(0.6 0.15 200 / 0.12)",
  "Podcast": "oklch(0.5 0.15 260 / 0.12)",
  "Alquiler de Aulas": "oklch(0.5 0.15 280 / 0.12)",
  "Radio": "oklch(0.5 0.12 320 / 0.12)",
  "Edición de Video": "oklch(0.45 0.15 30 / 0.12)",
  "Alquiler de Equipos": "oklch(0.45 0.12 10 / 0.12)",
  "Streaming": "oklch(0.5 0.12 170 / 0.12)",
  "Producción Audiovisual": "oklch(0.5 0.12 140 / 0.12)",
  "Asesorías": "oklch(0.5 0.12 80 / 0.12)",
}

const CAT_TEXT: Record<string, string> = {
  "Cursos": "#059669", "Talleres": "#0891b2", "Podcast": "#4f46e5",
  "Alquiler de Aulas": "#7c3aed", "Radio": "#a21caf", "Edición de Video": "#d97706",
  "Alquiler de Equipos": "#dc2626", "Streaming": "#0d9488", "Producción Audiovisual": "#65a30d",
  "Asesorías": "#ca8a04", "Otros": "#6b7280",
}

interface IngresoRow {
  id: string
  tipo_movimiento: "ingreso" | "egreso"
  fecha_pago: string
  concepto?: string
  estudiante_nombre?: string
  categoria?: string
  monto: number
  metodo_pago?: string
  modulos_count?: number
  modulos_detalle?: { id: string; modulo_nombre: string; monto: number }[]
}

interface Props {
  data: IngresoRow[]
  loading: boolean
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

export function IngresosTabla({ data, loading }: Props) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([{ id: "fecha_pago", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  useEffect(() => {
    if (loading) {
      setPagination(p => ({ ...p, pageIndex: 0 }))
    }
  }, [loading])

  const columns = useMemo<ColumnDef<IngresoRow>[]>(() => [
    {
      id: "fecha_pago",
      accessorFn: (item) => item.fecha_pago,
      header: "Fecha",
      cell: ({ getValue }) => <span className="text-xs font-medium" style={{ color: CHARCOAL }}>{fmtDate(getValue<string>())}</span>,
      enableSorting: true,
    },
    {
      id: "concepto",
      accessorFn: (item) => item.concepto,
      header: "Concepto",
      cell: ({ row }) => {
        const item = row.original
        const esEgreso = item.tipo_movimiento === "egreso"
        return (
          <span className="text-xs truncate max-w-[160px] block" style={{ color: CHARCOAL }}>
            {esEgreso && <span className="px-1.5 py-0.5 mr-1.5 rounded-full text-[7px] font-bold uppercase bg-red-100 text-red-700">Egreso</span>}
            {item.concepto || "—"}
            {!esEgreso && item.modulos_count && item.modulos_count > 1 && (
              <span className="block text-[9px] opacity-50 truncate mt-0.5">
                {item.modulos_detalle?.map(m => m.modulo_nombre).join(" · ")}
              </span>
            )}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: "estudiante",
      accessorFn: (item) => item.estudiante_nombre,
      header: "Estudiante",
      cell: ({ getValue }) => <span className="text-xs" style={{ color: CHARCOAL }}>{getValue<string>() || "—"}</span>,
      enableSorting: false,
    },
    {
      id: "categoria",
      accessorFn: (item) => item.categoria,
      header: "Categoría",
      cell: ({ row }) => {
        const item = row.original
        const esEgreso = item.tipo_movimiento === "egreso"
        return (
          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase"
            style={{
              backgroundColor: esEgreso ? "oklch(0.55 0.15 30 / 0.1)" : (CAT_COLORS[item.categoria || ""] || "oklch(0.4 0.02 0 / 0.12)"),
              color: esEgreso ? "#dc2626" : (CAT_TEXT[item.categoria || ""] || "#6b7280"),
            }}>
            {item.categoria || "—"}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: "monto",
      accessorFn: (item) => Number(item.monto || 0),
      header: "Monto",
      cell: ({ row }) => {
        const item = row.original
        const esEgreso = item.tipo_movimiento === "egreso"
        return (
          <span className="text-xs font-bold" style={{ color: esEgreso ? "#dc2626" : "oklch(0.55 0.15 150)" }}>
            {esEgreso ? "-" : "+"}${Number(item.monto || 0).toLocaleString()}
          </span>
        )
      },
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
        const esEgreso = item.tipo_movimiento === "egreso"
        return (
          <div className="flex items-center justify-center">
            {esEgreso ? (
              <button onClick={() => navigate(`/finanzas/egresos/${item.id}/editar`)}
                className="size-8 group flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                title="Editar">
                <Pencil size={14} className="opacity-40 group-hover:opacity-100 group-hover:text-amber-600 transition-colors" />
              </button>
            ) : (
              <button onClick={() => navigate(`/finanzas/ingresos/${item.id}`)}
                className="size-8 group flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                title="Ver detalle">
                <Eye size={14} className="opacity-40 group-hover:opacity-100 group-hover:text-blue-600 transition-colors" />
              </button>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
  ], [navigate])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (row) => `${row.tipo_movimiento}-${row.id}`,
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
            <tr><td colSpan={columns.length} className="p-10 text-center opacity-40">Sin ingresos</td></tr>
          ) : table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
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
