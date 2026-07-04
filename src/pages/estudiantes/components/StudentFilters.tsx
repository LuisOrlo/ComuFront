import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, UserGroupIcon, AlertCircleIcon, Coins01Icon, CheckmarkCircle02Icon, Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { Segment } from "@/services/estudiantes.service"

type PaymentFilter = "todos" | "deudor" | "abonado" | "al_dia"

interface StudentFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  paymentFilter: PaymentFilter
  onPaymentFilterChange: (value: PaymentFilter) => void
  stats: { todos: number; deudor: number; abonado: number; al_dia: number }
  segments: Segment[]
  activeSegmentId: string | null
  onSegmentClick: (s: Segment | null) => void
  conFaltas: boolean
  onConFaltasChange: (v: boolean) => void
}

const filters = [
  { id: "todos" as const, label: "Todos", icon: UserGroupIcon },
  { id: "deudor" as const, label: "Pendientes", icon: AlertCircleIcon },
  { id: "abonado" as const, label: "Abonos", icon: Coins01Icon },
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
  segments,
  activeSegmentId,
  onSegmentClick,
  conFaltas,
  onConFaltasChange,
}: StudentFiltersProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, cedula o correo..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onPaymentFilterChange(f.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              paymentFilter === f.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HugeiconsIcon icon={f.icon} size={14} style={{ color: paymentFilter === f.id ? indicatorColor[f.id] : undefined }} />
            <span className="hidden sm:inline">{f.label}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${paymentFilter === f.id ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}>
              {stats[f.id]}
            </span>
            {paymentFilter === f.id && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: indicatorColor[f.id] }} />}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onConFaltasChange(!conFaltas)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
            conFaltas ? 'text-white border-transparent shadow-sm' : 'text-gray-600 bg-white border-gray-200 hover:border-gray-300'
          }`}
          style={conFaltas ? { backgroundColor: COLORS.ACCENT } : {}}
        >
          <span className="flex items-center gap-1.5">
            {conFaltas && <HugeiconsIcon icon={Cancel01Icon} size={12} />}
            Con faltas
          </span>
        </button>

        {segments.length > 0 && (
          <>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Segmentos:</span>
            <div className="flex gap-1.5 overflow-x-auto">
              {segments.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => onSegmentClick(activeSegmentId === seg.id ? null : seg)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                    activeSegmentId === seg.id ? 'text-white border-transparent shadow-sm' : 'text-gray-600 bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  style={activeSegmentId === seg.id ? { backgroundColor: COLORS.ACCENT } : {}}
                >
                  {seg.nombre}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
