import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import type { Table } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

interface PaginationControlsProps<T> {
  table: Table<T>
  pageSizes?: number[]
}

export function PaginationControls<T>({ table, pageSizes = [10, 15, 25, 50, 100] }: PaginationControlsProps<T>) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = Math.max(1, table.getPageCount())
  const { pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const from = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalRows)

  // Generar páginas numeradas
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      {/* Selector de filas por página y rango */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 whitespace-nowrap">Filas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold outline-none focus:border-[#fd761a] transition-colors cursor-pointer text-xs"
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-500 font-medium whitespace-nowrap">
          Mostrando <span className="font-semibold text-slate-800">{from}–{to}</span> de{" "}
          <span className="font-semibold text-slate-800">{totalRows}</span>
        </span>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) =>
            typeof page === "number" ? (
              <button
                key={idx}
                type="button"
                onClick={() => table.setPageIndex(page - 1)}
                className={cn(
                  "size-8 rounded-lg text-xs font-semibold transition-all",
                  currentPage === page
                    ? "bg-[#fd761a] text-white shadow-2xs"
                    : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                )}
              >
                {page}
              </button>
            ) : (
              <span key={idx} className="px-1 text-xs text-slate-400">
                {page}
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </button>
      </div>
    </div>
  )
}
