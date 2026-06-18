import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, UserIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface Operador {
  id: string
  nombres: string
  apellidos: string
  cargo?: string
}

export function OperadorSelector({
  operadores,
  selectedId,
  onSelect,
  disabled,
}: {
  operadores: Operador[]
  selectedId?: string | null
  onSelect: (id: string | null) => void
  disabled?: boolean
}) {
  const [search, setSearch] = useState("")

  const filtered = search
    ? operadores.filter(op =>
        `${op.nombres} ${op.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
        op.cargo?.toLowerCase().includes(search.toLowerCase())
      )
    : operadores

  return (
    <div className="space-y-2">
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
        />
        <input
          type="text"
          placeholder="Buscar operador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          disabled={disabled}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 transition-all disabled:opacity-40"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-[10px] text-center py-4 opacity-40">No se encontraron operadores</p>
        ) : (
          filtered.map(op => {
            const isSelected = selectedId === op.id
            return (
              <button
                key={op.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(isSelected ? null : op.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                  isSelected
                    ? "bg-emerald-50 border border-emerald-200"
                    : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className={cn(
                  "size-8 rounded-full flex items-center justify-center",
                  isSelected ? "bg-emerald-100" : "bg-gray-100"
                )}>
                  {isSelected ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} style={{ color: "oklch(0.55 0.18 160)" }} />
                  ) : (
                    <HugeiconsIcon icon={UserIcon} size={14} className="opacity-40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{op.nombres} {op.apellidos}</p>
                  {op.cargo && <p className="text-[9px] opacity-40 truncate">{op.cargo}</p>}
                </div>
              </button>
            )
          })
        )}
      </div>

      {selectedId && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-[10px] font-bold text-red-500 hover:underline"
        >
          Quitar operador
        </button>
      )}
    </div>
  )
}
