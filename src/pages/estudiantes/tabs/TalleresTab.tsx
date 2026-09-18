import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Clock04Icon,
  BookOpenIcon,
} from "@hugeicons/core-free-icons"
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
import { tallerService, type Taller } from "@/services/taller.service"
import { PaginationControls } from "@/components/table/PaginationControls"
import { CiudadBadge, ModalidadBadge, EstadoBadge } from "../components/Badges"

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


  const columns = useMemo<ColumnDef<Taller>[]>(
    () => [
      {
        id: "taller",
        accessorFn: (t) => t.nombre,
        header: "Taller Intensivo",
        cell: ({ row }) => {
          const t = row.original
          const instructorName = t.instructor
            ? `${t.instructor.nombres} ${t.instructor.apellidos}`
            : ""
          return (
            <div>
              <div className="text-xs font-semibold text-[#0b1c30]">{t.nombre}</div>
              <div className="text-[11px] text-[#45464d] mt-0.5">
                {instructorName ? `Docente: ${instructorName}` : t.descripcion || "Taller formativo"}
              </div>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "ciudad",
        accessorFn: (t) => t.ciudad?.nombre || (t.modalidad === "virtual" ? "Online" : "Presencial"),
        header: "Modalidad & Sede",
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <ModalidadBadge modalidad={t.modalidad} />
              {t.ciudad?.nombre && <CiudadBadge ciudad={t.ciudad.nombre} showIcon={false} />}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "fecha",
        accessorFn: (t) => t.fecha,
        header: "Fecha de Ejecución",
        cell: ({ row }) => {
          const t = row.original
          const horas = t.hora_inicio && t.hora_fin ? ` · ${t.hora_inicio.substring(0, 5)} - ${t.hora_fin.substring(0, 5)}` : ""
          return (
            <span className="font-mono text-xs text-[#45464d]">
              {formatDate(t.fecha)}{horas}
            </span>
          )
        },
        enableSorting: true,
      },
      {
        id: "capacidad",
        accessorFn: (t) => t.inscripciones_count ?? 0,
        header: "Ocupación / Inscritos",
        cell: ({ row }) => {
          const t = row.original
          const capacidad = t.capacidad_maxima || 0
          const inscritos = t.inscripciones_count ?? 0
          const ocupacion = capacidad > 0 ? Math.min(100, Math.round((inscritos / capacidad) * 100)) : 0
          const isHigh = ocupacion >= 90
          return (
            <div className="flex flex-col gap-1 w-full max-w-[200px]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0b1c30]">
                  {inscritos} {capacidad > 0 ? `/ ${capacidad} cupos` : "inscritos"}
                </span>
                {capacidad > 0 && (
                  <span className={`font-bold ${isHigh ? "text-[#fd761a]" : "text-[#009668]"}`}>
                    {ocupacion}%
                  </span>
                )}
              </div>
              {capacidad > 0 && (
                <div className="w-full h-2 rounded-full bg-[#e5eeff] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isHigh ? "bg-[#fd761a]" : "bg-[#4edea3]"
                    }`}
                    style={{ width: `${ocupacion}%` }}
                  />
                </div>
              )}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "estado",
        accessorFn: (t) => t.estado,
        header: "Estado",
        cell: ({ row }) => {
          const t = row.original
          const inscritos = t.inscripciones_count ?? 0
          const cap = t.capacidad_maxima ?? 0

          let estadoText = t.estado
          if (cap > 0 && inscritos >= cap) {
            estadoText = "lleno"
          } else if (cap > 0 && inscritos >= cap * 0.85) {
            estadoText = "ultimos cupos"
          } else if (t.estado === "confirmado" || t.estado === "en_progreso") {
            estadoText = "abierto"
          }

          return <EstadoBadge estado={estadoText} />
        },
        enableSorting: true,
      },
      {
        id: "acciones",
        header: "Acción",
        cell: ({ row }) => (
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate(`/estudiantes/talleres/${row.original.id}`)}
              className="text-xs text-[#9d4300] hover:text-[#783200] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Ver inscritos</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ),
        enableSorting: false,
        size: 130,
      },
    ],
    [navigate]
  )

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
      <div className="p-4 rounded-xl bg-white shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#c6c6cd]/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#ffdbca] flex items-center justify-center text-[#9d4300] shrink-0">
            <HugeiconsIcon icon={BookOpenIcon} size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Talleres</h3>
            
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#c6c6cd]/15">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-80">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#45464d]"
            />
            <input
              type="text"
              placeholder="Buscar taller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs rounded-lg outline-none bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#45464d] focus:bg-white focus:ring-2 focus:ring-[#fd761a] transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={modalidadFilter}
              onChange={(e) => {
                setModalidadFilter(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="h-10 pl-3 pr-8 text-xs font-semibold rounded-lg outline-none bg-[#eff4ff] text-[#0b1c30] cursor-pointer focus:bg-white focus:ring-2 focus:ring-[#fd761a] appearance-none"
            >
              {MODALIDAD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#45464d]" />
          </div>
          <div className="relative">
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="h-10 pl-3 pr-8 text-xs font-semibold rounded-lg outline-none bg-[#eff4ff] text-[#0b1c30] cursor-pointer focus:bg-white focus:ring-2 focus:ring-[#fd761a] appearance-none"
            >
              {ESTADO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#45464d]" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#c6c6cd]/20 rounded-xl p-5">
              <div className="h-5 w-48 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="text-xs font-semibold text-red-700">No se pudieron cargar los talleres.</p>
          <button type="button" onClick={loadData} className="mt-2 text-xs font-semibold underline text-red-700">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#c6c6cd]/20 rounded-xl shadow-sm overflow-hidden">
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
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={`py-3.5 px-4 ${canSort ? "cursor-pointer select-none" : ""} ${isActions ? "text-right" : ""}`}
                          style={{
                            width: header.getSize() !== 150 ? header.getSize() : undefined,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div className={`flex items-center gap-1 ${isActions ? "justify-end" : ""}`}>
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
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[#e5eeff]/60 text-xs text-[#0b1c30]">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-8 py-20 text-center">
                      <div className="w-16 h-16 bg-[#eff4ff] rounded-xl flex items-center justify-center mx-auto mb-4">
                        <HugeiconsIcon icon={Clock04Icon} size={24} className="text-[#45464d]/60" />
                      </div>
                      <h3 className="text-[#0b1c30] font-bold text-sm">No se encontraron talleres</h3>
                      <p className="text-xs text-[#45464d] mt-1">Intenta con otros criterios de búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#eff4ff]/40 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-3.5 px-4">
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
            <div className="px-4 py-3 border-t border-[#c6c6cd]/20 bg-[#eff4ff]">
              <PaginationControls table={table} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
