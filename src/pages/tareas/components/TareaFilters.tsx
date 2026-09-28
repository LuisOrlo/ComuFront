import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Cancel01Icon,
  UserGroupIcon,
  FilterIcon,
} from "@hugeicons/core-free-icons"
import type { StaffPersona } from "@/services/tareas.service"

interface TareaFiltersProps {
  titulo: string
  personaId: string
  estado: string
  staff: StaffPersona[]
  onChange: (key: string, value: string) => void
  onReset?: () => void
}

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
]

export function TareaFilters({
  titulo,
  personaId,
  estado,
  staff,
  onChange,
  onReset,
}: TareaFiltersProps) {
  const hasActiveFilters = !!titulo || !!personaId || !!estado

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Búsqueda por título */}
        <div className="relative flex-1 min-w-[220px]">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar tarea por título o descripción..."
            value={titulo}
            onChange={(e) => onChange("titulo", e.target.value)}
            className="w-full h-10 pl-10 pr-9 text-sm rounded-xl border border-slate-200/90 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
          />
          {titulo && (
            <button
              type="button"
              onClick={() => onChange("titulo", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
              title="Borrar búsqueda"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          )}
        </div>

        {/* Selector de Staff */}
        <div className="relative sm:w-64">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={personaId}
            onChange={(e) => onChange("persona_id", e.target.value)}
            className="w-full h-10 pl-10 pr-8 text-sm rounded-xl border border-slate-200/90 bg-slate-50/50 text-slate-900 focus:outline-none focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all appearance-none cursor-pointer"
          >
            <option value="">Todo el personal</option>
            {staff.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_completo} ({p.tipo})
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Selector de Estado */}
        <div className="relative sm:w-52">
          <HugeiconsIcon
            icon={FilterIcon}
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={estado}
            onChange={(e) => onChange("estado", e.target.value)}
            className="w-full h-10 pl-10 pr-8 text-sm rounded-xl border border-slate-200/90 bg-slate-50/50 text-slate-900 focus:outline-none focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all appearance-none cursor-pointer"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Botón de limpiar filtros si hay alguno activo */}
        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
