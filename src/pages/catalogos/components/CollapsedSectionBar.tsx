import { HugeiconsIcon } from "@hugeicons/react"
import { RefreshIcon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { COLORS } from "@/lib/constants"

interface CollapsedSectionBarProps {
  label: string
  color?: string
  icon?: IconSvgElement
  emoji?: string
  onExpand: () => void
}

export function CollapsedSectionBar({ label, color, icon, emoji, onExpand }: CollapsedSectionBarProps) {
  const accent = color || COLORS.ACCENT
  return (
    <button
      type="button"
      onClick={onExpand}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-white/80 hover:bg-white transition-colors"
      style={{ borderColor: COLORS.BORDER_SUBTLE }}
      aria-expanded={false}
    >
      <span
        className="size-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
          color: accent,
        }}
      >
        {emoji ? (
          <span className="text-base">{emoji}</span>
        ) : icon ? (
          <HugeiconsIcon icon={icon} size={16} />
        ) : (
          <span className="size-2.5 rounded-full" style={{ backgroundColor: accent }} />
        )}
      </span>

      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: COLORS.TEXT_MUTED }}>
          Catálogo activo
        </span>
        <span className="block text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
          {label}
        </span>
      </span>

      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 8%, transparent)`, color: accent }}>
        <HugeiconsIcon icon={RefreshIcon} size={13} />
        Cambiar
      </span>
    </button>
  )
}