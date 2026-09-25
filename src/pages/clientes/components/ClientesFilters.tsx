import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

interface ClientesFiltersProps {
  search: string
  onSearchChange: (value: string) => void
}

export function ClientesFilters({ search, onSearchChange }: ClientesFiltersProps) {
  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Directorio de clientes</p>
        <p className="mt-0.5 text-xs text-slate-400">Busca por cliente, correo, celular o ciudad.</p>
      </div>
      <div className="relative w-full sm:max-w-xs">
        <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar en el directorio..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full rounded-xl bg-slate-50 border border-slate-200/80 py-2.5 pl-9 pr-4 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15"
          aria-label="Buscar clientes"
        />
      </div>
    </div>
  )
}
