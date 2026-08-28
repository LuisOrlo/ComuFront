import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowRight02Icon, ArrowUp01Icon, ArrowDown01Icon, Clock04Icon } from "@hugeicons/core-free-icons"
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
import { tallerService, type Taller } from "@/services/taller.service"
import { PaginationControls } from "@/components/table/PaginationControls"

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const ACCENT = COLORS.ACCENT

const MODALIDAD_OPTIONS = [
  { value: "", label: "Todas las modalidades" },
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
]

const ESTADO_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
]

export function TalleresTab() {
  const navigate = useNavigate()
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [modalidadFilter, setModalidadFilter] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params: Record<string, unknown> = { per_page: 500 }
      if (search) params.search = search
      if (modalidadFilter) params.modalidad = modalidadFilter
      if (estadoFilter) params.estado = estadoFilter

      const res = await tallerService.listar(params)
      const data = res.data || res.datos || []
      setTalleres(Array.isArray(data) ? data : [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [search, modalidadFilter, estadoFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatDate = (d?: string) => {
    if (!d) return "—"
    try {
      const date = new Date(d.includes("T") ? d : d + "T00:00:00")
      return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })
    } catch {
      return d
    }
  }

  const estadoLabel: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    en_progreso: "En progreso",
    completado: "Completado",
    cancelado: "Cancelado",
  }

  const estadoColor: Record<string, string> = {
    pendiente: "bg-amber-50 text-amber-600",
    confirmado: "bg-blue-50 text-blue-600",
    en_progreso: "bg-emerald-50 text-emerald-600",
    completado: "bg-gray-100 text-gray-500",
    cancelado: "bg-red-50 text-red-500",
  }

  const columns = useMemo<ColumnDef<Taller>[]>(() => [
    {
      id: "taller",
      accessorFn: (t) => t.nombre,
      header: "Taller",
      cell: ({ row }) => <div className="text-sm font-semibold" style={{ color: CHARCOAL }}>{row.original.nombre}</div>,
      enableSorting: true,
    },
    {
      id: "ciudad",
      accessorFn: (t) => t.modalidad === "virtual" ? "No aplica" : (t.ciudad?.nombre || "—"),
      header: "Ciudad",
      cell: ({ getValue }) => <span className="text-sm" style={{ color: CHARCOAL }}>{getValue<string>()}</span>,
      enableSorting: true,
    },
    {
      id: "fecha",
      accessorFn: (t) => t.fecha,
      header: "Fecha",
      cell: ({ row }) => <span className="text-sm" style={{ color: CHARCOAL }}>{formatDate(row.original.fecha)}</span>,
      enableSorting: true,
    },
    {
      id: "modalidad",
      accessorFn: (t) => t.modalidad,
      header: "Modalidad",
      cell: ({ getValue }) => {
        const modalidad = getValue<string>()
        return (
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
            modalidad === "virtual"
              ? "bg-purple-50 text-purple-600"
              : "bg-blue-50 text-blue-600"
          }`}>
            {modalidad === "virtual" ? "Virtual" : "Presencial"}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      id: "inscritos",
      accessorFn: (t) => t.inscripciones_count ?? 0,
      header: "Inscritos",
      cell: ({ row }) => {
        const t = row.original
        return (
          <span className="text-base font-semibold" style={{ color: CHARCOAL }}>
            {t.inscripciones_count ?? 0}
            {t.capacidad_maxima ? ` / ${t.capacidad_maxima}` : ""}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      id: "estado",
      accessorFn: (t) => t.estado,
      header: "Estado",
      cell: ({ getValue }) => {
        const estado = getValue<string>()
        return (
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${estadoColor[estado] || "bg-gray-100 text-gray-500"}`}>
            {estadoLabel[estado] || estado}
          </span>
        )
      },
      enableSorting: true,
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/estudiantes/talleres/${row.original.id}`)}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [navigate])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: talleres,
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
      <div className="flex items-center gap-3 mb-4">
        <div className="relative max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: TEXT_MUTED }}
          />
          <input
            type="text"
            placeholder="Buscar taller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        <select
          value={modalidadFilter}
          onChange={(e) => { setModalidadFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
          className="px-3 py-2 text-sm border rounded-lg outline-none bg-white cursor-pointer"
          style={{ borderColor: BORDER, color: CHARCOAL }}
        >
          {MODALIDAD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
          className="px-3 py-2 text-sm border rounded-lg outline-none bg-white cursor-pointer"
          style={{ borderColor: BORDER, color: CHARCOAL }}
        >
          {ESTADO_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-5" style={{ borderColor: BORDER }}>
              <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-700">No se pudieron cargar los talleres.</p>
          <button type="button" onClick={loadData} className="mt-3 text-sm font-semibold underline text-red-700">Reintentar</button>
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
                      <h3 className="text-gray-900 font-bold">No se encontraron talleres</h3>
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
