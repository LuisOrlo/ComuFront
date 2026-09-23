import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Landmark, Banknote, CreditCard, Inbox } from "lucide-react"
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

const CAT_COLORS: Record<string, string> = {
  "Cursos": "#eff6ff",
  "Cursos personalizados": "#faf5ff",
  "Talleres": "#ecfeff",
  "Podcast": "#f5f3ff",
  "Alquiler de Aulas": "#f5f3ff",
  "Radio": "#fdf4ff",
  "Edición de Video": "#fffbeb",
  "Alquiler de Equipos": "#fef2f2",
  "Streaming": "#f0fdfa",
  "Producción Audiovisual": "#f7fee7",
  "Asesorías": "#fefce8",
}

const CAT_TEXT: Record<string, string> = {
  "Cursos": "#1d4ed8",
  "Cursos personalizados": "#7e22ce",
  "Talleres": "#0e7490",
  "Podcast": "#4338ca",
  "Alquiler de Aulas": "#6d28d9",
  "Radio": "#a21caf",
  "Edición de Video": "#b45309",
  "Alquiler de Equipos": "#b91c1c",
  "Streaming": "#0f766e",
  "Producción Audiovisual": "#4d7c0f",
  "Asesorías": "#a16207",
  "Otros": "#475569",
}

interface IngresoRow {
  id: string
  tipo_movimiento?: "ingreso"
  fecha_pago: string
  concepto?: string
  estudiante_nombre?: string
  categoria?: string
  monto: number
  metodo_pago?: string
  modulos_count?: number
  modulos_detalle?: { id: string; modulo_nombre: string; monto: number }[]
  es_personalizado?: boolean
  comprobante_url?: string | null
  estado_verificacion?: string
}

interface Props {
  data: IngresoRow[]
  loading: boolean
  page: number
  lastPage: number
  onPageChange: (page: number) => void
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

export function IngresosTabla({ data, loading, page, lastPage, onPageChange }: Props) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([{ id: "fecha_pago", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  useEffect(() => {
    if (loading) {
      setPagination((p) => ({ ...p, pageIndex: 0 }))
    }
  }, [loading])

  // Agrupación contable en un solo movimiento unificado si comparten los mismos metadatos
  const displayData = useMemo(() => {
    const groups = new Map<string, IngresoRow>()
    for (const item of data) {
      const key = [
        item.fecha_pago,
        item.concepto || "",
        item.estudiante_nombre || "",
        item.categoria || "",
        item.metodo_pago || "",
        item.comprobante_url || "",
        item.estado_verificacion || "",
      ].join("|")
      const current = groups.get(key)
      if (current) {
        current.monto = Number(current.monto || 0) + Number(item.monto || 0)
        current.modulos_count = (current.modulos_count || 0) + (item.modulos_count || 0)
        current.modulos_detalle = [
          ...(current.modulos_detalle || []),
          ...(item.modulos_detalle || []),
        ]
      } else {
        groups.set(key, { ...item })
      }
    }
    return Array.from(groups.values())
  }, [data])

  const columns = useMemo<ColumnDef<IngresoRow>[]>(
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
        id: "concepto",
        accessorFn: (item) => item.concepto,
        header: "Concepto",
        cell: ({ row }) => {
          const item = row.original
          const concepto =
            item.concepto && !/^\s*[—–-]?\s*0\s*$/.test(item.concepto)
              ? item.concepto
              : item.es_personalizado
                ? "Curso personalizado"
                : "—"
          return (
            <div className="flex flex-col max-w-[220px]">
              <span className="text-xs font-semibold text-slate-900 truncate" title={concepto}>
                {concepto}
              </span>
              {item.modulos_count && item.modulos_count > 1 && (
                <span
                  className="text-[11px] text-slate-500 truncate mt-0.5"
                  title={item.modulos_detalle?.map((m) => m.modulo_nombre).join(" · ")}
                >
                  {item.modulos_detalle?.map((m) => m.modulo_nombre).join(" · ")}
                </span>
              )}
            </div>
          )
        },
        enableSorting: false,
      },
      {
        id: "estudiante",
        accessorFn: (item) => item.estudiante_nombre,
        header: "Estudiante",
        cell: ({ getValue }) => (
          <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
            {getValue<string>() || "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "categoria",
        accessorFn: (item) => item.categoria,
        header: "Categoría",
        cell: ({ row }) => {
          const item = row.original
          const cat = item.categoria || "—"
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              style={{
                backgroundColor: CAT_COLORS[cat] || "#f1f5f9",
                color: CAT_TEXT[cat] || "#475569",
              }}
            >
              {cat}
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
          return (
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 tabular-nums whitespace-nowrap">
                +$
                {Number(item.monto || 0).toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )
        },
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
        header: "Acción",
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-center">
              <button
                onClick={() => navigate(`/finanzas/ingresos/${item.id}`)}
                className="size-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-[#fd761a] hover:bg-orange-50 transition-colors cursor-pointer"
                title="Ver detalle del movimiento"
              >
                <Eye size={16} />
              </button>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [navigate]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: displayData,
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
                    <span className="text-xs font-semibold text-slate-500">Cargando movimientos...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Inbox size={32} strokeWidth={1.5} />
                    <span className="text-xs font-semibold text-slate-600">No se encontraron movimientos</span>
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

      {/* Paginación - Total general omitido explícitamente según requerimiento del usuario */}
      <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span>Mostrando</span>
          <span className="font-semibold text-slate-900">{displayData.length}</span>
          <span>movimientos</span>
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
