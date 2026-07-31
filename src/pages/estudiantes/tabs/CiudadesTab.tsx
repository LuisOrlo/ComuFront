import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowRight02Icon, Clock04Icon, ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
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
import { estudiantesService } from "@/services/estudiantes.service"
import { PaginationControls } from "@/components/table/PaginationControls"

interface CiudadRow {
  ciudad: string
  total: number
  cursos_activos: number
  talleres_activos: number
}

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const ACCENT = COLORS.ACCENT

export function CiudadesTab() {
  const navigate = useNavigate()
  const [ciudades, setCiudades] = useState<CiudadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await estudiantesService.getCiudades({ per_page: 500 })
      setCiudades(resp.datos)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return ciudades.filter(c =>
      !search || c.ciudad.toLowerCase().includes(search.toLowerCase())
    )
  }, [ciudades, search])

  const columns = useMemo<ColumnDef<CiudadRow>[]>(() => [
    {
      id: "rowNumber",
      header: "#",
      cell: ({ row }) => <span className="text-xs opacity-40" style={{ color: CHARCOAL }}>{row.index + 1}</span>,
      enableSorting: false,
      size: 44,
    },
    {
      id: "ciudad",
      accessorFn: (c) => c.ciudad,
      header: "Ciudad",
      cell: ({ getValue }) => <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{getValue<string>()}</span>,
      enableSorting: true,
    },
    {
      id: "estudiantes",
      accessorFn: (c) => c.total,
      header: "Estudiantes",
      cell: ({ getValue }) => <span className="text-base font-semibold" style={{ color: CHARCOAL }}>{getValue<number>()}</span>,
      enableSorting: true,
    },
    {
      id: "cursos",
      accessorFn: (c) => c.cursos_activos,
      header: "Cursos",
      cell: ({ getValue }) => <span className="text-base font-semibold" style={{ color: CHARCOAL }}>{getValue<number>()}</span>,
      enableSorting: true,
    },
    {
      id: "talleres",
      accessorFn: (c) => c.talleres_activos,
      header: "Talleres",
      cell: ({ getValue }) => <span className="text-base font-semibold" style={{ color: CHARCOAL }}>{getValue<number>()}</span>,
      enableSorting: true,
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/estudiantes/ciudades/${encodeURIComponent(row.original.ciudad)}`)}
          className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
          style={{ color: TEXT_MUTED }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = ACCENT
            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${ACCENT} 10%, transparent)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = TEXT_MUTED
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          <HugeiconsIcon icon={ArrowRight02Icon} size={16} />
        </button>
      ),
      enableSorting: false,
      size: 64,
    },
  ], [navigate])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetAll: false,
  })

  return (
    <div>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: TEXT_MUTED }}
          />
          <input
            type="text"
            placeholder="Buscar ciudad..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
            className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg outline-none transition-all duration-180 ease-out"
            style={{
              borderColor: BORDER,
              color: CHARCOAL,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = ACCENT
              e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = BORDER
              e.currentTarget.style.boxShadow = "none"
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-5" style={{ borderColor: BORDER }}>
              <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse [&_td]:border [&_th]:border [&_td]:border-[oklch(0.85_0_0)] [&_th]:border-[oklch(0.85_0_0)]">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-gray-50/80 border-b" style={{ borderColor: BORDER }}>
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort()
                      const sorted = header.column.getIsSorted()
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
                          <div className="flex items-center gap-1">
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
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-8 py-20 text-center">
                      <div className="size-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
                      </div>
                      <h3 className="text-gray-900 font-bold">No se encontraron ciudades</h3>
                      <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda.</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="transition-colors duration-150"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(0.98 0 0)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ padding: "12px 16px" }}>
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
            <div className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
              <PaginationControls table={table} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
