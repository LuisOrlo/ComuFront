import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

interface ClientesFiltersProps {
  search: string
  onSearchChange: (value: string) => void
}

export function ClientesFilters({ search, onSearchChange }: ClientesFiltersProps) {
  return (
    <div className="shrink-0 px-6 py-4 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="relative max-w-xs">
        <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-xs font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        />
      </div>
    </div>
  )
}
