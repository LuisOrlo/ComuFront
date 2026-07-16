import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, UserGroupIcon, AlertCircleIcon, Coins01Icon, CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

type PaymentFilter = "todos" | "deudor" | "abonado" | "al_dia"

interface StudentFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  paymentFilter: PaymentFilter
  onPaymentFilterChange: (value: PaymentFilter) => void
  stats: { todos: number; deudor: number; abonado: number; al_dia: number }
}

const filters = [
  { id: "todos" as const, label: "Todos", icon: UserGroupIcon },
  { id: "deudor" as const, label: "Pendientes", icon: AlertCircleIcon },
  { id: "abonado" as const, label: "Abonados", icon: Coins01Icon },
  { id: "al_dia" as const, label: "Al dia", icon: CheckmarkCircle02Icon },
]

const indicatorColor: Record<string, string> = {
  todos: COLORS.CHARCOAL,
  deudor: "oklch(0.5 0.15 20)",
  abonado: "oklch(0.65 0.15 75)",
  al_dia: "oklch(0.55 0.15 150)",
}

export function StudentFilters({
  search,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  stats,
}: StudentFiltersProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o cedula..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg outline-none transition-all duration-180 ease-out"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.CHARCOAL,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
              e.currentTarget.style.boxShadow = "none"
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg mb-4">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onPaymentFilterChange(f.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              paymentFilter === f.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'hover:bg-white/80'
            }`}
            style={paymentFilter !== f.id ? { color: COLORS.TEXT_MUTED } : undefined}
          >
            <HugeiconsIcon icon={f.icon} size={14} style={{ color: paymentFilter === f.id ? indicatorColor[f.id] : undefined }} />
            <span className="hidden sm:inline">{f.label}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${paymentFilter === f.id ? 'bg-gray-100 text-gray-700' : ''}`} style={paymentFilter !== f.id ? { color: COLORS.TEXT_MUTED } : undefined}>
              {stats[f.id]}
            </span>
            {paymentFilter === f.id && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: indicatorColor[f.id] }} />}
          </button>
        ))}
      </div>
    </>
  )
}
