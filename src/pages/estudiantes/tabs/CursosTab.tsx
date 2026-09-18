import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Clock04Icon,
  GraduationCapIcon,
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
import { cursosService, type Curso } from "@/services/cursos.service"
import { PaginationControls } from "@/components/table/PaginationControls"
import { CiudadBadge, ModalidadBadge, EstadoBadge } from "../components/Badges"

const MODALIDAD_OPTIONS = [
  { value: "", label: "Todas las modalidades" },
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
]

const ESTADO_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "en_progreso", label: "En curso" },
  { value: "pendiente", label: "Pendiente" },
  { value: "completado", label: "Completado" },
]

export function CursosTab() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [modalidadFilter, setModalidadFilter] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const cursosRes = await cursosService.getCursos({ per_page: 500 })
      setCursos(cursosRes.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return cursos.filter((c) => {
      const s = search.toLowerCase()
      const nameMatch = !s || c.nombre.toLowerCase().includes(s)
      const modMatch = !modalidadFilter || c.modalidad === modalidadFilter
      const estMatch = !estadoFilter || c.estado === estadoFilter
      return nameMatch && modMatch && estMatch
    })
  }, [cursos, search, modalidadFilter, estadoFilter])

  const columns = useMemo<ColumnDef<Curso>[]>(
    () => [
      {
        id: "curso",
        accessorFn: (c) => c.nombre,
        header: "Curso / Programa",
        cell: ({ row }) => {
          const c = row.original
          return (
            <div>
              <div className="text-xs font-semibold text-[#0b1c30]">{c.nombre}</div>
              <div className="text-[11px] text-[#45464d] mt-0.5">
                {c.instructor && c.instructor !== "Sin asignar" ? `Prof. ${c.instructor} · ` : ""}
                {c.totalModulos > 0 ? `${c.totalModulos} módulos` : c.fechaInicio && c.fechaFin ? `${c.fechaInicio} — ${c.fechaFin}` : "Programa regular"}
              </div>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "modalidad",
        accessorFn: (c) => c.modalidad,
        header: "Modalidad & Sede",
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <ModalidadBadge modalidad={c.modalidad} />
              {c.ciudad && <CiudadBadge ciudad={c.ciudad} showIcon={false} />}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "horario",
        accessorFn: (c) => c.horaInicio,
        header: "Horario",
        cell: ({ row }) => {
          const c = row.original
          return (
            <span className="text-xs text-[#45464d]">
              {c.horaInicio && c.horaFin ? `${c.horaInicio} - ${c.horaFin}` : c.fechaInicio ? c.fechaInicio : "—"}
            </span>
          )
        },
        enableSorting: true,
      },
      {
        id: "estado",
        accessorFn: (c) => c.estado,
        header: "Estado",
        cell: ({ getValue }) => {
          const estado = getValue<string>()
          return <EstadoBadge estado={estado} />
        },
        enableSorting: true,
      },
      {
        id: "ocupacion",
        accessorFn: (c) => c.estudiantes,
        header: "Ocupación / Inscritos",
        cell: ({ row }) => {
          const c = row.original
          const capacidad = c.capacidad || 0
          const inscritos = c.estudiantes || 0
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
        id: "acciones",
        header: "Acción",
        cell: ({ row }) => (
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate(`/estudiantes/cursos/${row.original.id}`)}
              className="text-xs text-[#9d4300] hover:text-[#783200] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Ver {row.original.estudiantes} estudiante{row.original.estudiantes !== 1 ? "s" : ""}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ),
        enableSorting: false,
        size: 140,
      },
    ],
    [navigate]
  )

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
      <div className="p-4 rounded-xl bg-white shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#c6c6cd]/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#9d4300] shrink-0">
            <HugeiconsIcon icon={GraduationCapIcon} size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Catálogo de Cursos</h3>
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
              placeholder="Buscar curso..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
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
          <p className="text-xs font-semibold text-red-700">No se pudieron cargar los cursos.</p>
          <button type="button" onClick={loadData} className="mt-2 text-xs font-semibold underline text-red-700">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#c6c6cd]/20 rounded-xl overflow-hidden shadow-sm">
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
                      <h3 className="text-[#0b1c30] font-bold text-sm">No se encontraron cursos</h3>
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
