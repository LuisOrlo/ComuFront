import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Download04Icon, ImageIcon } from "@hugeicons/core-free-icons"
import { usePermission } from "@/hooks/usePermission"

interface BulkActionsBarProps {
  selectedCount: number
  onClear: () => void
  onDelete: () => void
  onExport: () => void
  onDeleteCedulas?: () => void
}

export function BulkActionsBar({ selectedCount, onClear, onDelete, onExport, onDeleteCedulas }: BulkActionsBarProps) {
  const { isAdmin } = usePermission()
  if (selectedCount === 0) return null

  return (
    <div className="p-2.5 px-4 rounded-xl bg-[#e5eeff] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-[#c6c6cd]/20">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded bg-[#fd761a] text-white flex items-center justify-center font-bold text-xs">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-[#0b1c30]">
          estudiante{selectedCount !== 1 ? "s" : ""} seleccionado{selectedCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {onDeleteCedulas && (
          <button
            onClick={onDeleteCedulas}
            type="button"
            className="h-8 px-3 rounded-lg bg-white text-[#783200] text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <HugeiconsIcon icon={ImageIcon} size={15} />
            <span>Eliminar cédulas</span>
          </button>
        )}
        <button
          onClick={onExport}
          type="button"
          className="h-8 px-3 rounded-lg bg-white text-[#0b1c30] text-xs font-semibold hover:bg-[#dce9ff] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <HugeiconsIcon icon={Download04Icon} size={15} />
          <span>Exportar</span>
        </button>
        {isAdmin && (
          <button
            onClick={onDelete}
            type="button"
            className="h-8 px-3 rounded-lg bg-white text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <HugeiconsIcon icon={Delete02Icon} size={15} />
            <span>Eliminar</span>
          </button>
        )}
        <button
          onClick={onClear}
          type="button"
          className="h-8 px-2.5 rounded-lg text-[#45464d] hover:text-[#0b1c30] text-xs font-semibold transition-colors cursor-pointer"
        >
          Desmarcar todos
        </button>
      </div>
    </div>
  )
}
