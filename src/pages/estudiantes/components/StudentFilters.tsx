import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { getCityColor } from "../utils/cityColor"

type PaymentFilter = "todos" | "deudor" | "abonado" | "al_dia"

interface StudentFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  paymentFilter: PaymentFilter
  onPaymentFilterChange: (value: PaymentFilter) => void
  stats: { todos: number; deudor: number; abonado: number; al_dia: number }
  ciudadFilter: string
  onCiudadFilterChange: (value: string) => void
  ciudades: string[]
  segmentActive?: boolean
}

const filterOptions = [
  { id: "todos" as const, label: "Todos", defaultBg: "bg-[#eff4ff]", defaultText: "text-[#45464d]", defaultBadge: "bg-[#45464d]/10 text-[#45464d]" },
  { id: "deudor" as const, label: "Pendientes", defaultBg: "bg-[#ffdbca]", defaultText: "text-[#783200]", defaultBadge: "bg-[#783200]/15 text-[#783200]" },
  { id: "abonado" as const, label: "Abonados", defaultBg: "bg-[#dce9ff]", defaultText: "text-[#45464d]", defaultBadge: "bg-[#45464d]/15 text-[#45464d]" },
  { id: "al_dia" as const, label: "Al día", defaultBg: "bg-[#eff4ff]", defaultText: "text-[#45464d]", defaultBadge: "bg-[#45464d]/10 text-[#45464d]" },
]

export function StudentFilters({
  search,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  stats,
  ciudadFilter,
  onCiudadFilterChange,
  ciudades,
  segmentActive = false,
}: StudentFiltersProps) {
  return (
    <>
      {segmentActive && (
        <div role="status" className="mb-4 rounded-lg border px-3 py-2 text-xs font-medium text-blue-800 bg-blue-50 border-blue-100">
          Mostrando estudiantes del segmento seleccionado.
        </div>
      )}
      <div className="p-4 rounded-xl bg-white shadow-sm mb-4 flex flex-col gap-4 border border-[#c6c6cd]/15">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search & City Select */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#45464d]"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o correo..."
                aria-label="Buscar estudiante por nombre o cédula"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-xs placeholder:text-[#45464d] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a] transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={ciudadFilter}
                aria-label="Filtrar estudiantes por ciudad"
                onChange={(e) => onCiudadFilterChange(e.target.value)}
                className="h-10 pl-3 pr-8 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a]"
              >
                <option value="">Todas las ciudades</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#45464d]"
              />
            </div>
          </div>

          {/* Financial Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {filterOptions.map((f) => {
              const isActive = paymentFilter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onPaymentFilterChange(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-[#fd761a] text-white shadow-sm"
                      : `${f.defaultBg} ${f.defaultText} hover:opacity-90`
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isActive ? "bg-black/20 text-white" : f.defaultBadge
                    }`}
                  >
                    {stats[f.id]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Filters Tag Strip */}
        {(ciudadFilter || paymentFilter !== "todos") && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#45464d]">
            <span>Filtros aplicados:</span>
            {ciudadFilter && (
              (() => {
                const p = getCityColor(ciudadFilter)
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${p.bg} ${p.text} ${p.border}`}>
                    <span>Ciudad: {ciudadFilter}</span>
                    <button
                      type="button"
                      onClick={() => onCiudadFilterChange("")}
                      className="hover:opacity-75 transition-opacity cursor-pointer"
                      aria-label="Quitar filtro de ciudad"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={13} />
                    </button>
                  </span>
                )
              })()
            )}
            {paymentFilter !== "todos" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#ffdbca] text-[#783200]">
                <span>
                  Estado: {filterOptions.find((filter) => filter.id === paymentFilter)?.label}
                </span>
                <button
                  type="button"
                  onClick={() => onPaymentFilterChange("todos")}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                  aria-label="Quitar filtro financiero"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={13} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                onCiudadFilterChange("")
                onPaymentFilterChange("todos")
              }}
              className="ml-2 text-[#9d4300] hover:underline font-semibold cursor-pointer text-xs"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </>
  )
}
