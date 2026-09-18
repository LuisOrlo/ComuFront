import { COLORS } from "@/lib/constants"
import type { TipoDisponible } from "@/services/agenda.service"

export function AgendaLegend({
  activeTypes,
  tipos,
  eventCount,
  onToggle,
  onClearAll,
}: {
  activeTypes: string[]
  tipos: TipoDisponible[]
  eventCount?: number
  onToggle: (tipo: string) => void
  onClearAll: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all"
        style={{
          backgroundColor: activeTypes.length === 0 ? COLORS.CHARCOAL : "#e5eeff",
          color: activeTypes.length === 0 ? "white" : COLORS.TEXT_MUTED,
        }}
      >
        Todos
        <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[10px] text-white">{eventCount ?? 0}</span>
      </button>
      {tipos.map(({ tipo, label, color, count }) => {
        const isActive = activeTypes.length === 0 || activeTypes.includes(tipo)
        return (
          <button
            key={tipo}
            onClick={() => onToggle(tipo)}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
            style={{
              backgroundColor: isActive ? "#e5eeff" : "#f8f9ff",
              color: isActive ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
              opacity: isActive ? 1 : 0.55,
            }}
          >
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
            <span className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>({count})</span>
          </button>
        )
      })}
    </div>
  )
}
