import { COLORS } from "@/lib/constants"

interface ClientesPaginationProps {
  page: number
  lastPage: number
  total: number
  onPageChange: (page: number) => void
}

export function ClientesPagination({ page, lastPage, total, onPageChange }: ClientesPaginationProps) {
  if (lastPage <= 1) return null

  return (
    <div className="shrink-0 px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <span className="text-xs opacity-40">
        Página {page} de {lastPage} ({total} clientes)
      </span>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="px-4 py-2 rounded-lg text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          Anterior
        </button>
        <button disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}
          className="px-4 py-2 rounded-lg text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          Siguiente
        </button>
      </div>
    </div>
  )
}
