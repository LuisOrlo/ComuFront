import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Download04Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { usePermission } from "@/hooks/usePermission"

interface BulkActionsBarProps {
  selectedCount: number
  onClear: () => void
  onDelete: () => void
  onExport: () => void
}

export function BulkActionsBar({ selectedCount, onClear, onDelete, onExport }: BulkActionsBarProps) {
  const { isAdmin } = usePermission()
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-blue-50/80 border border-blue-100 rounded-2xl mb-4">
      <span className="text-sm font-bold text-blue-700">
        {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <HugeiconsIcon icon={Download04Icon} size={14} />
          Exportar
        </button>
        {isAdmin && (<button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          Eliminar
        </button>)}
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
          Deseleccionar
        </button>
      </div>
    </div>
  )
}
