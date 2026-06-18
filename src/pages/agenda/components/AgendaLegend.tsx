import { COLORS } from "@/lib/constants"

const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  CLASE_CURSO: { label: "Curso", color: "#6366f1" },
  TALLER: { label: "Taller", color: "#f59e0b" },
  ALQUILER_AULA: { label: "Aula", color: "#10b981" },
  PODCAST: { label: "Podcast", color: "#ec4899" },
  STREAMING: { label: "Streaming", color: "#06b6d4" },
  ASESORIA: { label: "Asesoría", color: "#8b5cf6" },
}

export function AgendaLegend({
  activeTypes,
  onToggle,
}: {
  activeTypes: string[]
  onToggle: (tipo: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(EVENT_TYPES).map(([tipo, info]) => {
        const isActive = activeTypes.length === 0 || activeTypes.includes(tipo)
        return (
          <button
            key={tipo}
            onClick={() => onToggle(tipo)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border"
            style={{
              backgroundColor: isActive ? info.color + "18" : "transparent",
              borderColor: isActive ? info.color : COLORS.BORDER_SUBTLE,
              color: isActive ? info.color : COLORS.TEXT_MUTED,
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: info.color }}
            />
            {info.label}
          </button>
        )
      })}
    </div>
  )
}
