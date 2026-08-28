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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border"
        style={{
          backgroundColor: activeTypes.length === 0 ? COLORS.CHARCOAL + "18" : "transparent",
          borderColor: activeTypes.length === 0 ? COLORS.CHARCOAL : COLORS.BORDER_SUBTLE,
          color: activeTypes.length === 0 ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
          opacity: activeTypes.length === 0 ? 1 : 0.5,
        }}
      >
        Todos
      </button>
      {tipos.map(({ tipo, label, color }) => {
        const isActive = activeTypes.length === 0 || activeTypes.includes(tipo)
        return (
          <button
            key={tipo}
            onClick={() => onToggle(tipo)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border"
            style={{
              backgroundColor: isActive ? color + "18" : "transparent",
              borderColor: isActive ? color : COLORS.BORDER_SUBTLE,
              color: isActive ? color : COLORS.TEXT_MUTED,
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
          </button>
        )
      })}
      {eventCount !== undefined && (
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-1"
          style={{ backgroundColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
        >
          {eventCount} {eventCount === 1 ? "evento" : "eventos"}
        </span>
      )}
    </div>
  )
}
