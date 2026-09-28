import { HugeiconsIcon } from "@hugeicons/react"
import {
  TaskEdit01Icon,
  Clock04Icon,
  RefreshIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface Totales {
  total: number
  pendiente: number
  en_progreso: number
  completada: number
}

interface TareaSummaryCardsProps {
  totales: Totales
  selectedEstado?: string
  onSelectEstado?: (estado: string) => void
}

export function TareaSummaryCards({ totales, selectedEstado, onSelectEstado }: TareaSummaryCardsProps) {
  const cards = [
    {
      key: "" as const,
      label: "Total de tareas",
      sublabel: "Todas las registradas",
      count: totales.total ?? 0,
      icon: TaskEdit01Icon,
      accentColor: "#fd761a",
      bgLight: "bg-orange-50/60",
      textColor: "text-[#fd761a]",
      borderColor: "border-orange-100",
    },
    {
      key: "pendiente" as const,
      label: "Pendientes",
      sublabel: "Por iniciar",
      count: totales.pendiente ?? 0,
      icon: Clock04Icon,
      accentColor: "#d97706",
      bgLight: "bg-amber-50/60",
      textColor: "text-amber-600",
      borderColor: "border-amber-100",
    },
    {
      key: "en_progreso" as const,
      label: "En progreso",
      sublabel: "En ejecución activa",
      count: totales.en_progreso ?? 0,
      icon: RefreshIcon,
      accentColor: "#2563eb",
      bgLight: "bg-blue-50/60",
      textColor: "text-blue-600",
      borderColor: "border-blue-100",
    },
    {
      key: "completada" as const,
      label: "Completadas",
      sublabel: "Finalizadas con éxito",
      count: totales.completada ?? 0,
      icon: CheckmarkCircle02Icon,
      accentColor: "#059669",
      bgLight: "bg-emerald-50/60",
      textColor: "text-emerald-600",
      borderColor: "border-emerald-100",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const isSelected = selectedEstado === card.key || (!selectedEstado && card.key === "")

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onSelectEstado?.(card.key)}
            className={cn(
              "text-left p-4 sm:p-5 rounded-2xl bg-white border transition-all duration-200 relative overflow-hidden group focus:outline-none",
              isSelected
                ? "border-[#fd761a] ring-2 ring-[#fd761a]/20 shadow-md bg-gradient-to-b from-white to-orange-50/20"
                : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  {card.label}
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {card.count.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  {card.sublabel}
                </p>
              </div>

              <div
                className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-110",
                  card.bgLight,
                  card.borderColor,
                  card.textColor
                )}
              >
                <HugeiconsIcon icon={card.icon} size={20} />
              </div>
            </div>

            {isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#fd761a]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
