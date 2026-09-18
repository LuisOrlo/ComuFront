import { HugeiconsIcon } from "@hugeicons/react"
import { MapsLocation01Icon } from "@hugeicons/core-free-icons"

interface CiudadBadgeProps {
  ciudad?: string | null
  className?: string
}

// Mapa con paletas cromáticas únicas para todas las ciudades principales de Ecuador
const CIUDAD_PALETTES: Record<string, { bg: string; text: string; border: string }> = {
  // Principales
  cuenca: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  quito: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  guayaquil: { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
  ambato: { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  manta: { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200" },
  portoviejo: { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  machala: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  loja: { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200" },
  "santo domingo": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  ibarra: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  riobamba: { bg: "bg-orange-50", text: "text-orange-900", border: "border-orange-200" },
  esmeraldas: { bg: "bg-lime-50", text: "text-lime-900", border: "border-lime-200" },
  quevedo: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200" },
  babahoyo: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  latacunga: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
  tulcan: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
  tulcán: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
  guaranda: { bg: "bg-fuchsia-50", text: "text-fuchsia-800", border: "border-fuchsia-200" },
  azogues: { bg: "bg-stone-100", text: "text-stone-800", border: "border-stone-300" },
  puyo: { bg: "bg-emerald-50", text: "text-emerald-900", border: "border-emerald-300" },
  tena: { bg: "bg-teal-50", text: "text-teal-900", border: "border-teal-300" },
  macas: { bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-300" },
  zamora: { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-300" },
  "nueva loja": { bg: "bg-cyan-50", text: "text-cyan-900", border: "border-cyan-300" },
  "lago agrio": { bg: "bg-cyan-50", text: "text-cyan-900", border: "border-cyan-300" },
  coca: { bg: "bg-sky-50", text: "text-sky-900", border: "border-sky-300" },
  "orellana": { bg: "bg-sky-50", text: "text-sky-900", border: "border-sky-300" },
  salinas: { bg: "bg-blue-50", text: "text-blue-900", border: "border-blue-300" },
  "santa elena": { bg: "bg-indigo-50", text: "text-indigo-900", border: "border-indigo-300" },
  otavalo: { bg: "bg-violet-50", text: "text-violet-900", border: "border-violet-300" },
  chone: { bg: "bg-teal-50", text: "text-teal-900", border: "border-teal-200" },
  durán: { bg: "bg-rose-50", text: "text-rose-900", border: "border-rose-300" },
  duran: { bg: "bg-rose-50", text: "text-rose-900", border: "border-rose-300" },
  milagro: { bg: "bg-amber-50", text: "text-amber-950", border: "border-amber-300" },
  samborondón: { bg: "bg-blue-50", text: "text-blue-950", border: "border-blue-300" },
  samborondon: { bg: "bg-blue-50", text: "text-blue-950", border: "border-blue-300" },
  daule: { bg: "bg-cyan-50", text: "text-cyan-950", border: "border-cyan-300" },
  cayambe: { bg: "bg-purple-50", text: "text-purple-900", border: "border-purple-300" },
  sangolquí: { bg: "bg-pink-50", text: "text-pink-900", border: "border-pink-300" },
  sangolqui: { bg: "bg-pink-50", text: "text-pink-900", border: "border-pink-300" },
}

// 24 Paletas deterministas contrastantes para garantizar color único a cualquier otra ciudad
const DYNAMIC_PALETTES = [
  { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200" },
  { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
  { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
  { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200" },
  { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200" },
  { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-orange-50", text: "text-orange-900", border: "border-orange-200" },
  { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-800", border: "border-fuchsia-200" },
  { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200" },
  { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
  { bg: "bg-stone-100", text: "text-stone-800", border: "border-stone-300" },
  { bg: "bg-zinc-100", text: "text-zinc-800", border: "border-zinc-300" },
  { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" },
]

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
  const index = Math.abs(hash) % DYNAMIC_PALETTES.length
  return DYNAMIC_PALETTES[index]
}

export function CiudadBadge({ ciudad, className = "" }: CiudadBadgeProps) {
  if (!ciudad || ciudad.trim() === "" || ciudad === "—" || ciudad === "Sin sede") return null

  const colors = getColorsForCity(ciudad)

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border shrink-0 transition-all ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      <HugeiconsIcon icon={MapsLocation01Icon} size={12} className="shrink-0 opacity-80" />
      <span className="truncate max-w-[130px]">{ciudad}</span>
    </span>
  )
}
