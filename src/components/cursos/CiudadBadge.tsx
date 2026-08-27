import { HugeiconsIcon } from "@hugeicons/react"
import { MapPinIcon } from "@hugeicons/core-free-icons"

interface CiudadBadgeProps {
  ciudad?: string | null
  className?: string
}

// Mapa de paletas cromáticas por ciudad (fondo, texto, borde)
const CIUDAD_PALETTES: Record<string, { bg: string; text: string; border: string }> = {
  quito: {
    bg: "oklch(0.95 0.06 240)",
    text: "oklch(0.40 0.16 240)",
    border: "oklch(0.88 0.10 240)",
  },
  guayaquil: {
    bg: "oklch(0.95 0.07 190)",
    text: "oklch(0.38 0.15 190)",
    border: "oklch(0.88 0.10 190)",
  },
  cuenca: {
    bg: "oklch(0.95 0.08 35)",
    text: "oklch(0.42 0.18 35)",
    border: "oklch(0.88 0.12 35)",
  },
  ambato: {
    bg: "oklch(0.95 0.07 145)",
    text: "oklch(0.38 0.15 145)",
    border: "oklch(0.88 0.10 145)",
  },
  "santo domingo": {
    bg: "oklch(0.95 0.07 295)",
    text: "oklch(0.40 0.16 295)",
    border: "oklch(0.88 0.10 295)",
  },
  manta: {
    bg: "oklch(0.95 0.07 215)",
    text: "oklch(0.38 0.15 215)",
    border: "oklch(0.88 0.10 215)",
  },
  machala: {
    bg: "oklch(0.95 0.08 85)",
    text: "oklch(0.40 0.16 85)",
    border: "oklch(0.88 0.10 85)",
  },
  loja: {
    bg: "oklch(0.95 0.07 340)",
    text: "oklch(0.40 0.16 340)",
    border: "oklch(0.88 0.10 340)",
  },
  ibarra: {
    bg: "oklch(0.95 0.07 165)",
    text: "oklch(0.38 0.15 165)",
    border: "oklch(0.88 0.10 165)",
  },
  riobamba: {
    bg: "oklch(0.95 0.08 15)",
    text: "oklch(0.42 0.18 15)",
    border: "oklch(0.88 0.12 15)",
  },
}

function getColorsForCity(name: string) {
  const normalized = name.trim().toLowerCase()
  if (CIUDAD_PALETTES[normalized]) {
    return CIUDAD_PALETTES[normalized]
  }

  // Generador determinista de color según el nombre de la ciudad
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360

  return {
    bg: `hsl(${hue}, 85%, 94%)`,
    text: `hsl(${hue}, 70%, 32%)`,
    border: `hsl(${hue}, 55%, 82%)`,
  }
}

export function CiudadBadge({ ciudad, className = "" }: CiudadBadgeProps) {
  if (!ciudad || ciudad.trim() === "") return null

  const colors = getColorsForCity(ciudad)

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-150 shrink-0 ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      <HugeiconsIcon icon={MapPinIcon} size={11} className="shrink-0" />
      <span>{ciudad}</span>
    </span>
  )
}
