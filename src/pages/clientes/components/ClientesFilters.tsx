import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

interface ClientesFiltersProps {
  search: string
  onSearchChange: (value: string) => void
}

export function ClientesFilters({ search, onSearchChange }: ClientesFiltersProps) {
  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#45464d]">Directorio de clientes</p>
        <p className="mt-1 text-xs text-[#73747b]">Busca por nombre, cédula o datos de contacto.</p>
      </div>
      <div className="relative w-full sm:max-w-xs">
          <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
          <input
            type="text"
            placeholder="Buscar nombre o cédula..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full rounded-xl bg-[#eff4ff] py-2.5 pl-9 pr-4 text-xs font-medium outline-none transition-all placeholder:text-[#76777d] focus:bg-[#e5eeff]"
            aria-label="Buscar clientes"
          />
      </div>
    </div>
  )
}
