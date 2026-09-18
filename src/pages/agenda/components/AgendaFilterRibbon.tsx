import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import type { TipoDisponible } from "@/services/agenda.service"
import { getEventStyles } from "../utils"

export interface AgendaFilterRibbonProps {
  activeTypes: string[]
  tipos: TipoDisponible[]
  eventCount: number
  countsByType: Record<string, number>
  search: string
  onSearchChange: (search: string) => void
  onToggle: (tipo: string) => void
  onClearAll: () => void
  periodTitle?: string
}

export function AgendaFilterRibbon({
  activeTypes,
  tipos,
  eventCount,
  countsByType,
  search,
  onSearchChange,
  onToggle,
  onClearAll,
}: AgendaFilterRibbonProps) {
  const isTodosActive = activeTypes.length === 0

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Lista de Píldoras de Filtro por Servicio */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-0.5">
        {/* Píldora: Todos */}
        <button
          type="button"
          onClick={onClearAll}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            isTodosActive
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
          }`}
        >
          <span>Todos</span>
          <span
            className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              isTodosActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {eventCount}
          </span>
        </button>

        {/* Píldoras por tipo de servicio */}
        {tipos.map(({ tipo, label }) => {
          const isActive = activeTypes.includes(tipo)
          const styles = getEventStyles(tipo)
          const count = countsByType[tipo] ?? 0

          // Formatear etiqueta (evitar "Curso regular", usar "Curso")
          const displayLabel = tipo === "CLASE_CURSO" ? "Cursos" : label

          return (
            <button
              key={tipo}
              type="button"
              onClick={() => onToggle(tipo)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none border ${
                isActive
                  ? "shadow-2xs font-extrabold"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80 opacity-80 hover:opacity-100"
              }`}
              style={{
                backgroundColor: isActive ? styles.bg : undefined,
                borderColor: isActive ? styles.border : undefined,
                color: isActive ? styles.text : undefined,
              }}
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: styles.color }}
              />
              <span>{displayLabel}</span>
              {count > 0 && (
                <span className="text-[11px] opacity-75 font-semibold">
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Buscador Rápido y Contador en Vivo */}
      <div className="flex items-center gap-2.5 self-stretch lg:self-auto shrink-0">
        {/* Input de Búsqueda Rápida */}
        <div className="relative flex-1 lg:w-60">
          <HugeiconsIcon
            icon={SearchIcon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Filtrar sala, docente..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          )}
        </div>

        {/* Indicador de Actividades */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50/80 border border-orange-200/50 text-xs font-bold text-orange-800 whitespace-nowrap">
          <span className="size-2 rounded-full bg-[#fd761a] animate-pulse" />
          <span>{eventCount} {eventCount === 1 ? "actividad" : "actividades"}</span>
        </div>
      </div>
    </div>
  )
}
