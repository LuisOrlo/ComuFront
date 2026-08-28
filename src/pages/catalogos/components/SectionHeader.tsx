import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ChevronDownIcon } from "@hugeicons/core-free-icons"
import type { ReactNode } from "react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  count?: number
  color?: string
  onBack?: () => void
  backLabel?: string
  action?: ReactNode
  className?: string
  icon?: ReactNode
  subtitle?: string
  collapsible?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function SectionHeader({
  title,
  count,
  color,
  onBack,
  backLabel,
  action,
  className,
  icon,
  subtitle,
  collapsible,
  collapsed,
  onToggleCollapse,
}: SectionHeaderProps) {
  const accent = color || COLORS.ACCENT
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-2 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-2 py-1 hover:bg-black/5 transition-colors shrink-0"
            style={{ color: COLORS.CHARCOAL }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
            {backLabel || "Volver"}
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="shrink-0">{icon}</span>}
            <h2 className="text-[11px] font-bold uppercase tracking-widest truncate" style={{ color: accent }}>
              {title}
            </h2>
            {count !== undefined && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60 shrink-0" style={{ color: COLORS.TEXT_MUTED }}>
                {count}
              </span>
            )}
            {collapsible && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="size-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors shrink-0"
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Expandir" : "Colapsar"}
              >
                <HugeiconsIcon
                  icon={ChevronDownIcon}
                  size={13}
                  className={cn("transition-transform", collapsed && "rotate-180")}
                />
              </button>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: COLORS.TEXT_MUTED }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}