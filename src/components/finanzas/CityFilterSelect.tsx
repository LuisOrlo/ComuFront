import { MapPin } from "lucide-react"

export interface CityOption {
  id: string | number
  nombre: string
}

export interface CityFilterSelectProps {
  ciudades: CityOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CityFilterSelect({ ciudades, value, onChange, disabled }: CityFilterSelectProps) {
  return (
    <div className="relative min-w-[150px]">
      <MapPin
        size={14}
        className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
          value ? "text-[#fd761a]" : "text-slate-400"
        }`}
      />
      <select
        value={value}
        aria-label="Filtrar por ciudad"
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none h-9 pl-8.5 pr-7 rounded-xl border text-xs font-semibold outline-none cursor-pointer transition-all disabled:opacity-50 ${
          value
            ? "bg-orange-50/80 border-[#fd761a] text-[#fd761a] font-bold shadow-2xs"
            : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
        }`}
      >
        <option value="">Todas las ciudades</option>
        {ciudades.map((ciudad) => (
          <option key={String(ciudad.id)} value={String(ciudad.id)} className="text-slate-900 bg-white">
            {ciudad.nombre}
          </option>
        ))}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
        ▼
      </span>
    </div>
  )
}
