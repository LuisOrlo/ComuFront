import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import type { Table } from "@tanstack/react-table"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE
const TEXT_MUTED = COLORS.TEXT_MUTED
const ACCENT = COLORS.ACCENT

interface PaginationControlsProps<T> {
  table: Table<T>
  pageSizes?: number[]
}

export function PaginationControls<T>({ table, pageSizes = [15, 25, 50, 100] }: PaginationControlsProps<T>) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const { pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const from = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalRows)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: TEXT_MUTED }}>
      <div className="flex items-center gap-2">
        <span>Filas por página:</span>
        <select value={pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="px-2 py-1.5 rounded-lg border bg-white outline-none text-xs font-medium"
          style={{ borderColor: BORDER }}>
          {pageSizes.map((s) => <option key={s} value={s}>{s}</option>)}
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
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
        </button>
        <button type="button" onClick={() => table.setPageIndex(totalPages - 1)} disabled={!table.getCanNextPage()}
          className="px-2 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-gray-50 transition-colors"
          style={{ borderColor: BORDER }}>
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="-ml-2" />
        </button>
      </div>
    </div>
  )
}
