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
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowUp01Icon, ArrowDown01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Trash2, Download, Upload, Eye, MoreHorizontal, BadgeCheck } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { CERT_STATUS_LABELS, CERT_STATUS_COLORS } from "../certStatus"
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

const GREEN = "#0F9F6E"
const AMBER = "#D97706"
const GRAY = "#6B7280"
const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const ACCENT = COLORS.ACCENT

const PAGE_SIZES = [15, 25, 50, 100]
const MENU_WIDTH = 180
const MENU_HEIGHT = 232

function getIniciales(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}
function getAvatarColor(name: string) {
  const colors = ["#0F9F6E", "#2563EB", "#7C3AED", "#D97706", "#DC2626"]
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
    return rows.filter(r =>
      [
        `${r.nombres} ${r.apellidos}`, r.nombres, r.apellidos, r.cedula,
      ].filter(Boolean).join(" ").toLowerCase().includes(term),
    )
  }, [rows, globalFilter])

  const columns = useMemo<ColumnDef<EstudiantePanel>[]>(() => [
    {
      id: "estudiante",
      accessorFn: (r) => `${r.nombres} ${r.apellidos}`,
      header: "Estudiante",
      cell: ({ row }) => {
        const nombreCompleto = `${row.original.nombres} ${row.original.apellidos}`
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ backgroundColor: getAvatarColor(nombreCompleto) }}>
              {getIniciales(nombreCompleto)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>{nombreCompleto}</p>
              <p className="text-xs opacity-40">{row.original.cedula}</p>
            </div>
          </div>
        )
      },
      enableSorting: true,
      size: 280,
    },
    {
      id: "curso",
      accessorFn: (r) => r.nombre_instancia || r.catalogo_nombre,
      header: "Curso",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: CHARCOAL }}>{r.nombre_instancia || r.catalogo_nombre}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ color: GREEN, backgroundColor: `${GREEN}08` }}>
                {r.catalogo_nombre}
              </span>
              {r.modalidad && <span className="text-[10px] opacity-30 capitalize">· {r.modalidad}</span>}
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
        const color = CERT_STATUS_COLORS[estado] || GRAY
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            <span style={{ color }}>{CERT_STATUS_LABELS[estado] || estado}</span>
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
              <button onClick={() => onEmitir(r)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ backgroundColor: GREEN }}>
                <BadgeCheck size={13} /> Emitir
              </button>
            ) : r.archivo_purgado ? (
              <button onClick={() => onReupload(r)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 border"
                style={{ color: AMBER, borderColor: `${AMBER}40`, backgroundColor: `${AMBER}08` }}>
                <Upload size={13} /> Re-subir PDF
              </button>
            ) : r.archivo_pdf_url ? (
              <button onClick={() => r.certificado_id && onDescargar(r.certificado_id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 border"
                style={{ color: CERT_STATUS_COLORS[estado] || GRAY, borderColor: `${CERT_STATUS_COLORS[estado] || GRAY}40`, backgroundColor: `${CERT_STATUS_COLORS[estado] || GRAY}08` }}>
                <Download size={13} /> Descargar
              </button>
            ) : null}

            {r.certificado_id && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    if (menuOpen === r.matricula_id) { setMenuOpen(null); return }
                    const rect = e.currentTarget.getBoundingClientRect()
                    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8))
                    const top = Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - MENU_HEIGHT))
                    setMenuPos({ top, left })
                    setMenuOpen(r.matricula_id)
                  }}
                  className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-200/60 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 240,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

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

  const menuRow = menuOpen ? rows.find(r => r.matricula_id === menuOpen) : undefined

  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const { pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const from = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalRows)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => { setGlobalFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
            placeholder="Buscar por nombre o cédula..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-gray-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
            style={{ borderColor: BORDER }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-gray-50/80" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <th key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={canSort ? "cursor-pointer select-none" : ""}
                        style={{
                          width: header.getSize() !== 150 ? header.getSize() : undefined,
                          padding: "10px 16px",
                          textAlign: "left",
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
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: "48px 16px", textAlign: "center", color: TEXT_MUTED }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                      <div className="size-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${AMBER}10` }}>
                        <BadgeCheck size={28} opacity={0.3} color={AMBER} />
                      </div>
                      <p className="text-sm font-bold opacity-30">Sin resultados</p>
                      <p className="text-xs opacity-20">Ajusta los filtros o emite nuevos certificados</p>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  return (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${BORDER}60` }}
                      className="hover:bg-amber-50/40 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ padding: "10px 16px", fontSize: "13px", color: CHARCOAL }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: TEXT_MUTED }}>
        <div className="flex items-center gap-2">
          <span>Filas por página:</span>
          <select value={pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border bg-white outline-none text-xs font-medium"
            style={{ borderColor: BORDER }}>
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <span className="font-medium">{from}–{to} de {totalRows}</span>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="-ml-2" />
          </button>
          <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(0, Math.min(currentPage - 3, totalPages - 5))
            const pageNum = start + i + 1
            return (
              <button key={pageNum} type="button" onClick={() => table.setPageIndex(pageNum - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: currentPage === pageNum ? ACCENT : "transparent",
                  color: currentPage === pageNum ? "white" : TEXT_MUTED,
                  boxShadow: currentPage === pageNum ? `0 2px 6px ${ACCENT}44` : "none",
                }}>
                {pageNum}
              </button>
            )
          })}
          <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="rotate-180" />
          </button>
          <button type="button" onClick={() => table.setPageIndex(totalPages - 1)} disabled={!table.getCanNextPage()}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="rotate-180" />
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="-ml-2 rotate-180" />
          </button>
        </div>
      </div>

      {/* Context menu (portal to body) */}
      {menuOpen && menuRow && menuRow.certificado_id && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
          <div className="fixed z-50 bg-white rounded-xl shadow-xl border py-1 min-w-[160px]"
            style={{ top: menuPos.top, left: menuPos.left, borderColor: BORDER }}>
            <button onClick={() => { onOpenDetail(menuRow.certificado_id!); setMenuOpen(null) }}
              className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2" style={{ color: CHARCOAL }}>
              <Eye size={13} /> Ver certificado
            </button>
            {getEstado(menuRow) === "generado" && (
              <button onClick={() => { onMarcarEntregado(menuRow.certificado_id!); setMenuOpen(null) }}
                className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2" style={{ color: CHARCOAL }}>
                <BadgeCheck size={13} /> Marcar entregado
              </button>
            )}
            {menuRow.archivo_purgado ? (
              <button onClick={() => { onReupload(menuRow); setMenuOpen(null) }}
                className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-amber-50 flex items-center gap-2 text-amber-600">
                <Upload size={13} /> Re-subir PDF
              </button>
            ) : menuRow.archivo_pdf_url ? (
              <button onClick={() => { onDescargar(menuRow.certificado_id!); setMenuOpen(null) }}
                className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2" style={{ color: CHARCOAL }}>
                <Download size={13} /> Descargar
              </button>
            ) : null}
            <div className="border-t my-1" style={{ borderColor: BORDER }} />
            <button onClick={() => { onOpenDelete(menuRow); setMenuOpen(null) }}
              className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-red-50 flex items-center gap-2 text-red-600">
              <Trash2 size={13} /> Eliminar PDF
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
