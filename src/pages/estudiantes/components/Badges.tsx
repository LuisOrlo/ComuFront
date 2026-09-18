import { HugeiconsIcon } from "@hugeicons/react"
import { MapsLocation01Icon } from "@hugeicons/core-free-icons"
import { getCityColor } from "../utils/cityColor"

export function CiudadBadge({ ciudad, showIcon = true }: { ciudad?: string; showIcon?: boolean }) {
  if (!ciudad || ciudad === "—" || ciudad === "Sin sede") {
    return <span className="text-xs text-[#76777d]">—</span>
  }
  const palette = getCityColor(ciudad)

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${palette.bg} ${palette.text} ${palette.border}`}
    >
      {showIcon && <HugeiconsIcon icon={MapsLocation01Icon} size={12} className="shrink-0 opacity-80" />}
      <span className="truncate max-w-[140px]">{ciudad}</span>
    </span>
  )
}

export function ModalidadBadge({ modalidad }: { modalidad?: string }) {
  if (!modalidad) return null
  const m = modalidad.toLowerCase()
  let colorClass = "bg-[#f1f5f9] text-[#334155] border-[#cbd5e1]"
  let label = modalidad

  if (m === "virtual" || m.includes("online")) {
    colorClass = "bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]"
    label = "Virtual"
  } else if (m === "presencial") {
    colorClass = "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]"
    label = "Presencial"
  } else if (m.includes("hibrid") || m.includes("híbrid")) {
    colorClass = "bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]"
    label = "Híbrido"
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${colorClass}`}>
      <span>{label}</span>
    </span>
  )
}

export function EstadoBadge({ estado }: { estado?: string }) {
  if (!estado) return null
  const e = estado.toLowerCase()
  let colorClass = "bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]"
  let label = estado

  if (
    e === "en_progreso" ||
    e === "en curso" ||
    e === "confirmado" ||
    e === "abierto" ||
    e === "activo" ||
    e === "al_dia"
  ) {
    colorClass = "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]"
    label =
      e === "en_progreso"
        ? "En curso"
        : e === "confirmado"
        ? "Confirmado"
        : e === "abierto"
        ? "Abierto"
        : e === "al_dia"
        ? "Al día"
        : estado
  } else if (e === "pendiente" || e === "por iniciar") {
    colorClass = "bg-[#fef3c7] text-[#b45309] border-[#fde68a]"
    label = "Pendiente"
  } else if (e === "ultimos cupos" || e === "últimos cupos" || e === "abonado") {
    colorClass = "bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]"
    label = e === "abonado" ? "Abonado" : "Últimos cupos"
  } else if (e === "lleno" || e === "cancelado" || e === "deudor") {
    colorClass = "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]"
    label = e === "lleno" ? "Lleno" : e === "deudor" ? "Deudor" : "Cancelado"
  } else if (e === "completado" || e === "finalizado") {
    colorClass = "bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]"
    label = "Completado"
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span>{label}</span>
    </span>
  )
}
