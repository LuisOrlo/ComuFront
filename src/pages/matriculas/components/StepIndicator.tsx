import { COLORS } from "@/lib/constants"

interface StepIndicatorProps {
  subStep: "modalidad" | "ciudad" | "tipo" | "lista"
  selectedModalidad: string
}

export function StepIndicator({ subStep, selectedModalidad }: StepIndicatorProps) {

  const rawSteps = [
    { key: "modalidad", label: "Modalidad" },
    { key: "ciudad", label: "Ciudad" },
    { key: "tipo", label: "Categoria" },
    { key: "lista", label: "Disponibles" },
  ]

  const steps = selectedModalidad === "virtual"
    ? rawSteps.filter(s => s.key !== "ciudad")
    : rawSteps

  const stepOrder = steps.map(s => s.key)
  const currentIdx = stepOrder.indexOf(subStep)

  return (
    <div className="flex items-center gap-0">
      {steps.filter((_, i) => i <= currentIdx).map((s, i) => {
        const isPast = currentIdx > i
        const isCurrent = subStep === s.key
        return (
          <div key={s.key} className="flex items-center gap-0 flex-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors"
              style={{ backgroundColor: isCurrent ? `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` : "transparent", color: isCurrent || isPast ? COLORS.ACCENT : COLORS.TEXT_MUTED }}>
              <div className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: isPast ? COLORS.ACCENT : isCurrent ? COLORS.ACCENT : "oklch(0.90 0 0)", color: isPast || isCurrent ? "#fff" : COLORS.TEXT_MUTED }}>
                {i + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < currentIdx && <div className="flex-1 h-px mx-1 sm:mx-2" style={{ backgroundColor: isPast ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }} />}
          </div>
        )
      })}
    </div>
  )
}
