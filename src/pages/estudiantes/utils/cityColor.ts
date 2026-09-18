export const CITY_PALETTES = [
  { bg: "bg-[#e0f2fe]", text: "text-[#0369a1]", border: "border-[#bae6fd]" }, // Sky
  { bg: "bg-[#ecfdf5]", text: "text-[#047857]", border: "border-[#a7f3d0]" }, // Emerald
  { bg: "bg-[#fef3c7]", text: "text-[#92400e]", border: "border-[#fde68a]" }, // Amber
  { bg: "bg-[#f3e8ff]", text: "text-[#6b21a8]", border: "border-[#e9d5ff]" }, // Purple
  { bg: "bg-[#e0e7ff]", text: "text-[#4338ca]", border: "border-[#c7d2fe]" }, // Indigo
  { bg: "bg-[#fce7f3]", text: "text-[#9d174d]", border: "border-[#fbcfe8]" }, // Pink
  { bg: "bg-[#ccfbf1]", text: "text-[#0f766e]", border: "border-[#99f6e4]" }, // Teal
  { bg: "bg-[#ffedd5]", text: "text-[#c2410c]", border: "border-[#fed7aa]" }, // Orange
  { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]", border: "border-[#bfdbfe]" }, // Blue
  { bg: "bg-[#fae8ff]", text: "text-[#86198f]", border: "border-[#f5d0fe]" }, // Fuchsia
  { bg: "bg-[#dcfce7]", text: "text-[#15803d]", border: "border-[#bbf7d0]" }, // Lime-Green
  { bg: "bg-[#f1f5f9]", text: "text-[#334155]", border: "border-[#cbd5e1]" }, // Slate
]

export function getCityColor(name: string) {
  let hash = 0
  const normalized = name.trim().toLowerCase()
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % CITY_PALETTES.length
  return CITY_PALETTES[index]
}
