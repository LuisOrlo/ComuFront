import { useMemo, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BadgeCheckIcon,
  Download04Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons"
import { Trash2, Eye, MoreHorizontal, BadgeCheck } from "lucide-react"
import { CERT_STATUS_LABELS } from "../certStatus"
import type { EstudiantePanel } from "@/services/certificados.service"

interface CertificadosTableProps {
  rows: EstudiantePanel[]
  onEmitir: (row: EstudiantePanel) => void
  onDescargar: (certId: string) => void
  onReupload: (row: EstudiantePanel) => void
  onMarcarEntregado: (certId: string) => void
  onOpenDetail: (certId: string) => void
  onOpenDelete: (row: EstudiantePanel) => void
}

const PAGE_SIZES = [15, 25, 50, 100]
const MENU_WIDTH = 190
const MENU_HEIGHT = 220

function getIniciales(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-emerald-600",
    "bg-blue-600",
    "bg-violet-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
  ]
  return colors[(name.charCodeAt(0) || 0) % colors.length]
}

function getEstado(row: EstudiantePanel): string {
  return row.certificado_id ? (row.estado_certificado || "generado") : "pendiente"
}

export function CertificadosTable({
  rows,
  onEmitir,
  onDescargar,
  onReupload,
  onMarcarEntregado,
  onOpenDetail,
  onOpenDelete,
}: CertificadosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })
  const [globalFilter, setGlobalFilter] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const filteredData = useMemo(() => {
    const term = globalFilter.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) =>
      [
        [r.nombres, r.apellidos].filter(Boolean).join(" "),
        r.nombres,
        r.apellidos,
        r.cedula,
        r.nombre_instancia,
        r.catalogo_nombre,
        r.codigo_certificado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  }, [rows, globalFilter])

  const columns = useMemo<ColumnDef<EstudiantePanel>[]>(
    () => [
      {
        id: "estudiante",
        accessorFn: (r) => [r.nombres, r.apellidos].filter(Boolean).join(" "),
        header: "Estudiante",
        cell: ({ row }) => {
          const nombreCompleto =
            [row.original.nombres, row.original.apellidos].filter(Boolean).join(" ").trim() ||
            "Estudiante sin nombre"
          const avatarBg = getAvatarColor(nombreCompleto)

          return (
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-2xs ${avatarBg}`}
              >
                {getIniciales(nombreCompleto)}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#0b1c30] truncate">
                  {nombreCompleto}
                </p>
                <p className="text-[11px] text-[#76777d] mt-0.5">
                  {row.original.cedula ? `C.I. ${row.original.cedula}` : "Sin cédula"}
                </p>
              </div>
            </div>
          )
        },
        enableSorting: true,
        size: 260,
      },
      {
        id: "curso",
        accessorFn: (r) => r.nombre_instancia || r.catalogo_nombre,
        header: "Curso / Programa",
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-bold text-[#0b1c30] truncate">
                {r.nombre_instancia || r.catalogo_nombre}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#0b1c30] border border-[#c6c6cd]/30">
                  {r.catalogo_nombre}
                </span>
                {r.modalidad && (
                  <span className="text-[10px] font-semibold text-[#76777d] capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                    {r.modalidad}
                  </span>
                )}
              </div>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "estado",
        accessorFn: (r) => getEstado(r),
        header: "Estado",
        cell: ({ getValue }) => {
          const estado = getValue<string>()

          if (estado === "pendiente") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Pendiente</span>
              </span>
            )
          }

          if (estado === "generado") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Emitido</span>
              </span>
            )
          }

          if (estado === "entregado") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Entregado</span>
              </span>
            )
          }

          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span>{CERT_STATUS_LABELS[estado] || estado}</span>
            </span>
          )
        },
        enableSorting: true,
        size: 130,
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const r = row.original
          const estado = getEstado(r)

          return (
            <div className="flex items-center gap-2 justify-end">
              {estado === "pendiente" ? (
                <button
                  type="button"
                  onClick={() => onEmitir(r)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  <HugeiconsIcon icon={BadgeCheckIcon} size={14} />
                  <span>Emitir</span>
                </button>
              ) : r.archivo_purgado ? (
                <button
                  type="button"
                  onClick={() => onReupload(r)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer"
                >
                  <HugeiconsIcon icon={Upload04Icon} size={14} />
                  <span>Re-subir PDF</span>
                </button>
              ) : r.archivo_pdf_url ? (
                <button
                  type="button"
                  onClick={() => r.certificado_id && onDescargar(r.certificado_id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0b1c30] bg-white border border-[#c6c6cd]/40 hover:bg-[#eff4ff] hover:border-[#fd761a]/40 transition-all shadow-2xs cursor-pointer"
                >
                  <HugeiconsIcon icon={Download04Icon} size={14} />
                  <span>Descargar</span>
                </button>
              ) : null}

              {r.certificado_id && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      if (menuOpen === r.matricula_id) {
                        setMenuOpen(null)
                        return
                      }
                      const rect = e.currentTarget.getBoundingClientRect()
                      const left = Math.max(
                        8,
                        Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
                      )
                      const top = Math.max(
                        8,
                        Math.min(rect.bottom + 4, window.innerHeight - MENU_HEIGHT)
                      )
                      setMenuPos({ top, left })
                      setMenuOpen(r.matricula_id)
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-[#76777d] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                    title="Más acciones"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              )}
            </div>
          )
        },
        enableSorting: false,
        size: 230,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menuOpen]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetAll: false,
  })

  const menuRow = menuOpen ? rows.find((r) => r.matricula_id === menuOpen) : undefined

  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const { pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const from = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalRows)

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76777d]"
          />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
            placeholder="Buscar por nombre, cédula o curso..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#c6c6cd]/40 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm text-[#0b1c30] font-medium outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#76777d] justify-end">
          <span>
            Mostrando <strong>{filteredData.length}</strong> de <strong>{rows.length}</strong> registros
          </span>
        </div>
      </div>

      {/* Tabla Estilizada */}
      <div className="rounded-2xl border border-[#c6c6cd]/25 overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="bg-[#eff4ff] border-b border-[#c6c6cd]/30 text-[11px] font-bold uppercase tracking-wider text-[#45464d]"
                >
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={`py-3.5 px-4 ${
                          canSort ? "cursor-pointer select-none hover:text-[#fd761a]" : ""
                        }`}
                        style={{
                          width: header.getSize() !== 150 ? header.getSize() : undefined,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
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
                  <td colSpan={columns.length} className="px-8 py-16 text-center text-[#76777d]">
                    <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#fd761a] flex items-center justify-center mx-auto mb-3">
                      <HugeiconsIcon icon={BadgeCheckIcon} size={24} />
                    </div>
                    <p className="font-bold text-sm text-[#0b1c30]">Sin coincidencias de búsqueda</p>
                    <p className="text-xs text-[#45464d] mt-1">
                      No encontramos ningún registro que coincida con &quot;{globalFilter}&quot;.
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#eff4ff]/40 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Paginación Integrado en la Tabla */}
        <div className="p-3.5 px-5 bg-[#eff4ff]/80 border-t border-[#c6c6cd]/25 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Lado izquierdo: Selector de filas y conteo */}
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            <div className="inline-flex items-center gap-2 whitespace-nowrap">
              <span className="text-[#45464d] font-medium">Filas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="h-8 px-2.5 rounded-lg border border-[#c6c6cd]/40 bg-white text-xs font-bold text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#fd761a]/20 cursor-pointer shadow-2xs"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[#c6c6cd] hidden sm:inline">|</span>
            <span className="text-[#45464d] whitespace-nowrap">
              Mostrando <strong className="text-[#0b1c30]">{from}–{to}</strong> de{" "}
              <strong className="text-[#0b1c30]">{totalRows}</strong> estudiantes
            </span>
          </div>

          {/* Lado derecho: Botones de navegación Anterior / Páginas / Siguiente */}
          <div className="inline-flex items-center gap-1.5 flex-nowrap">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 px-3 rounded-lg border border-[#c6c6cd]/30 bg-white text-[#0b1c30] text-xs font-semibold shadow-2xs hover:bg-[#eff4ff] hover:border-[#fd761a]/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="inline-flex items-center gap-1 flex-nowrap">
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1
                const isActive = currentPage === pageNum

                if (
                  totalPages > 7 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - currentPage) > 1
                ) {
                  if (Math.abs(pageNum - currentPage) === 2) {
                    return (
                      <span key={pageNum} className="px-1 text-[#76777d]">
                        ...
                      </span>
                    )
                  }
                  return null
                }

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => table.setPageIndex(pageNum - 1)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#fd761a] text-white shadow-xs"
                        : "bg-white border border-[#c6c6cd]/30 text-[#0b1c30] hover:bg-[#eff4ff] hover:border-[#fd761a]/30"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 px-3 rounded-lg border border-[#c6c6cd]/30 bg-white text-[#0b1c30] text-xs font-semibold shadow-2xs hover:bg-[#eff4ff] hover:border-[#fd761a]/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Menú Contextual Flotante (Portal) */}
      {menuOpen &&
        menuRow &&
        menuRow.certificado_id &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
            <div
              className="fixed z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#c6c6cd]/30 p-1.5 min-w-[170px] animate-in fade-in zoom-in-95 duration-100"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                type="button"
                onClick={() => {
                  onOpenDetail(menuRow.certificado_id!)
                  setMenuOpen(null)
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#eff4ff] text-[#0b1c30] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye size={14} className="text-[#fd761a]" />
                <span>Ver detalle</span>
              </button>

              {getEstado(menuRow) === "generado" && (
                <button
                  type="button"
                  onClick={() => {
                    onMarcarEntregado(menuRow.certificado_id!)
                    setMenuOpen(null)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <BadgeCheck size={14} className="text-emerald-600" />
                  <span>Marcar entregado</span>
                </button>
              )}

              {menuRow.archivo_purgado ? (
                <button
                  type="button"
                  onClick={() => {
                    onReupload(menuRow)
                    setMenuOpen(null)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-amber-50 text-amber-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={Upload04Icon} size={14} className="text-amber-600" />
                  <span>Re-subir PDF</span>
                </button>
              ) : menuRow.archivo_pdf_url ? (
                <button
                  type="button"
                  onClick={() => {
                    onDescargar(menuRow.certificado_id!)
                    setMenuOpen(null)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#eff4ff] text-[#0b1c30] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={Download04Icon} size={14} className="text-[#fd761a]" />
                  <span>Descargar PDF</span>
                </button>
              ) : null}

              <div className="border-t border-[#c6c6cd]/20 my-1" />

              <button
                type="button"
                onClick={() => {
                  onOpenDelete(menuRow)
                  setMenuOpen(null)
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Eliminar archivo PDF</span>
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  )
}
