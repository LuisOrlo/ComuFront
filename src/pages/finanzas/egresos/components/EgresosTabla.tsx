import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Landmark, Banknote, CreditCard, Inbox } from "lucide-react"
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

const CAT_BADGE: Record<string, { bg: string; text: string }> = {
  "Personal": { bg: "#eef2ff", text: "#4338ca" },
  "Servicios": { bg: "#fef3c7", text: "#b45309" },
  "Equipos": { bg: "#faf5ff", text: "#7e22ce" },
  "Varios": { bg: "#f1f5f9", text: "#475569" },
  "Honorarios": { bg: "#e0e7ff", text: "#3730a3" },
  "Mantenimiento": { bg: "#ecfeff", text: "#0e7490" },
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
  page: number
  lastPage: number
  onPageChange: (page: number) => void
  onDelete: (id: string) => void
}

function fmtDate(d: string) {
  if (!d) return "—"
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return d
  }
}

function getMethodIcon(method?: string) {
  const m = (method || "").toLowerCase()
  if (m.includes("transf") || m.includes("banc")) return Landmark
  if (m.includes("efect") || m.includes("caja")) return Banknote
  return CreditCard
}

export function EgresosTabla({ data, loading, page, lastPage, onPageChange, onDelete }: Props) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([{ id: "fecha_pago", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  useEffect(() => {
    if (loading) {
      setPagination((p) => ({ ...p, pageIndex: 0 }))
    }
  }, [loading])

  const columns = useMemo<ColumnDef<EgresoRow>[]>(
    () => [
      {
        id: "fecha_pago",
        accessorFn: (item) => item.fecha_pago,
        header: "Fecha",
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-700 whitespace-nowrap font-medium">
            {fmtDate(getValue<string>())}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: "descripcion",
        accessorFn: (item) => item.descripcion,
        header: "Descripción",
        cell: ({ getValue }) => (
          <span
            className="text-xs font-semibold text-slate-900 truncate max-w-[220px] block"
            title={getValue<string>() || ""}
          >
            {getValue<string>() || "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "categoria",
        accessorFn: (item) => item.categoria_nombre,
        header: "Categoría",
        cell: ({ getValue }) => {
          const cat = getValue<string>() || "—"
          const badgeStyle = CAT_BADGE[cat] || { bg: "#fef2f2", text: "#b91c1c" }
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              style={{
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
              }}
            >
              {cat}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        id: "proveedor",
        accessorFn: (item) => item.proveedor_beneficiario,
        header: "Proveedor",
        cell: ({ getValue }) => (
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
            {getValue<string>() || "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "monto",
        accessorFn: (item) => Number(item.monto || 0),
        header: "Monto",
        cell: ({ getValue }) => (
          <div className="text-right">
            <span className="text-xs font-bold text-rose-600 tabular-nums whitespace-nowrap">
              -$
              {Number(getValue<number>() || 0).toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: "metodo",
        accessorFn: (item) => item.metodo_pago,
        header: "Método",
        cell: ({ getValue }) => {
          const val = getValue<string>() || "—"
          const MethodIcon = getMethodIcon(val)
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap capitalize">
              <MethodIcon size={14} className="text-slate-400 shrink-0" />
              <span>{val}</span>
            </div>
          )
        },
        enableSorting: false,
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => navigate(`/finanzas/egresos/${item.id}`)}
                className="size-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Ver detalle"
              >
                <Eye size={15} />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/finanzas/egresos/${item.id}/editar`)}
                className="size-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                title="Editar egreso"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="size-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Eliminar egreso"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [navigate, onDelete]
  )

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-slate-50/80 border-b border-slate-200/80">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const isCenter = header.id === "acciones"
                  const isRight = header.id === "monto"

                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={`py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${
                        canSort ? "cursor-pointer hover:text-slate-800 select-none transition-colors" : ""
                      }`}
                      style={{ textAlign: isCenter ? "center" : isRight ? "right" : "left" }}
                    >
                      <div
                        className="inline-flex items-center gap-1.5"
                        style={{
                          justifyContent: isCenter ? "center" : isRight ? "flex-end" : "flex-start",
                        }}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {canSort && (
                          <span className="text-slate-400">
                            {sorted === "asc" ? (
                              <ArrowUp size={12} className="text-[#fd761a]" />
                            ) : sorted === "desc" ? (
                              <ArrowDown size={12} className="text-[#fd761a]" />
                            ) : (
                              <ArrowUpDown size={12} className="opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="size-6 border-2 border-[#fd761a] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-semibold text-slate-500">Cargando egresos...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Inbox size={32} strokeWidth={1.5} />
                    <span className="text-xs font-semibold text-slate-600">No se encontraron egresos</span>
                    <span className="text-[11px] text-slate-400">Prueba ajustando los filtros de búsqueda</span>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors group">
                  {row.getVisibleCells().map((cell) => {
                    const isCenter = cell.column.id === "acciones"
                    return (
                      <td
                        key={cell.id}
                        className={`py-3.5 px-4 ${isCenter ? "text-center" : ""}`}
                      >
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

      {/* Paginación - Total general omitido para mantener coherencia con Ingresos */}
      <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span>Mostrando</span>
          <span className="font-semibold text-slate-900">{data.length}</span>
          <span>egresos</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-700">
            Página {page} de {lastPage}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= lastPage || loading}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
