import { COLORS } from "@/lib/constants"

type Estado = "en_progreso" | "pendiente" | "completado"

const config: Record<Estado, { label: string; bg: string; text: string; border: string }> = {
  en_progreso: {
    label: "En progreso",
    bg: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)`,
    text: COLORS.ACCENT,
    border: `color-mix(in srgb, ${COLORS.ACCENT} 20%, transparent)`,
  },
  pendiente: {
    label: "Pendiente",
    bg: "oklch(0.55 0.05 250 / 0.12)",
    text: "oklch(0.50 0.12 250)",
    border: "oklch(0.55 0.05 250 / 0.20)",
  },
  completado: {
    label: "Completado",
    bg: "oklch(0.50 0.10 140 / 0.12)",
    text: "oklch(0.50 0.12 140)",
    border: "oklch(0.50 0.10 140 / 0.20)",
  },
}

export function StatusBadge({ estado }: { estado: Estado }) {
  const { label, bg, text, border } = config[estado]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
      style={{ backgroundColor: bg, color: text, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  )
}
