import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { StaffPersona } from "@/services/tareas.service"

interface TareaFiltersProps {
  titulo: string
  personaId: string
  estado: string
  staff: StaffPersona[]
  onChange: (key: string, value: string) => void
}

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
]

export function TareaFilters({ titulo, personaId, estado, staff, onChange }: TareaFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <HugeiconsIcon
          icon={SearchIcon}
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: COLORS.TEXT_MUTED }}
        />
        <input
          type="text"
          placeholder="Buscar por título..."
          value={titulo}
          onChange={(e) => onChange("titulo", e.target.value)}
          className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border bg-white outline-none"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            transition: "border-color 180ms ease-out, box-shadow 180ms ease-out",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT
            e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}20`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
            e.currentTarget.style.boxShadow = "none"
          }}
        />
      </div>

      <select
        value={personaId}
        onChange={(e) => onChange("persona_id", e.target.value)}
        className="h-9 px-3 text-sm rounded-lg border bg-white outline-none"
        style={{
          borderColor: COLORS.BORDER_SUBTLE,
          color: personaId ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
        }}
      >
        <option value="">Todo el staff</option>
        {staff.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre_completo}
          </option>
        ))}
      </select>

      <select
        value={estado}
        onChange={(e) => onChange("estado", e.target.value)}
        className="h-9 px-3 text-sm rounded-lg border bg-white outline-none"
        style={{
          borderColor: COLORS.BORDER_SUBTLE,
          color: estado ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
        }}
      >
        {ESTADOS.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>
    </div>
  )
}
