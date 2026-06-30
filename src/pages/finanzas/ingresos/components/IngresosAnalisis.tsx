import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Money02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

interface AnalyticsData {
  metodo_top?: string
}

export function IngresosAnalisis({ analytics }: { analytics?: AnalyticsData }) {
  const [open, setOpen] = useState(false)

  if (!analytics) return null

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
      <button onClick={() => setOpen(!open)}
        className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
        <span className="text-xs font-bold uppercase tracking-wider opacity-40">Análisis del período</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="opacity-40" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div className="px-5 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {analytics.metodo_top && (
            <div className="p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <HugeiconsIcon icon={Money02Icon} size={12} className="opacity-30" />
                <p className="text-[9px] font-bold uppercase opacity-40">Método más usado</p>
              </div>
              <p className="text-sm font-bold capitalize" style={{ color: CHARCOAL }}>{analytics.metodo_top}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
