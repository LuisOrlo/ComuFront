import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Cancel01Icon,
  GridViewIcon,
  FilterIcon,
} from "@hugeicons/core-free-icons"
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Fila Superior: Título con estado de filtros + Buscador en tiempo real + Contador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-orange-50 border border-orange-200/60 text-[#fd761a] flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={FilterIcon} size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                Servicios y Categorías
              </span>
              {!isTodosActive && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#fd761a] text-[10px] font-bold">
                  {activeTypes.length} {activeTypes.length === 1 ? "filtro activo" : "filtros activos"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isTodosActive
                ? "Mostrando todas las actividades y espacios disponibles"
                : "Filtrando por categorías seleccionadas"}
            </p>
          </div>
        </div>

        {/* Buscador Rápido y Contador en Vivo */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
          <div className="relative flex-1 sm:w-64 md:w-72">
            <HugeiconsIcon
              icon={Search01Icon}
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por sala, docente, curso, ciudad..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all shadow-2xs"
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

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50/80 border border-orange-200/50 text-xs font-bold text-orange-800 whitespace-nowrap shadow-2xs">
            <span className="size-2 rounded-full bg-[#fd761a] animate-pulse" />
            <span>{eventCount} {eventCount === 1 ? "actividad" : "actividades"}</span>
          </div>
        </div>
      </div>

      {/* Fila Inferior: Lista de Píldoras de Filtro por Servicio */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Píldora: Todos los servicios */}
        <button
          type="button"
          onClick={onClearAll}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none active:scale-[0.98] ${
            isTodosActive
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
          }`}
        >
          <HugeiconsIcon icon={GridViewIcon} size={14} />
          <span>Todos</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              isTodosActive
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700"
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
          const displayLabel = tipo === "CLASE_CURSO" ? "Cursos" : label

          return (
            <button
              key={tipo}
              type="button"
              onClick={() => onToggle(tipo)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none border active:scale-[0.98] ${
                isActive
                  ? "shadow-2xs font-extrabold ring-1 ring-current/20"
                  : "bg-slate-50/80 hover:bg-slate-100/90 text-slate-700 border-slate-200/90 hover:border-slate-300"
              }`}
              style={{
                backgroundColor: isActive ? styles.bg : undefined,
                borderColor: isActive ? styles.border : undefined,
                color: isActive ? styles.text : undefined,
              }}
            >
              <span
                className="size-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: styles.color }}
              />
              <span>{displayLabel}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isActive
                      ? "bg-black/10 text-inherit"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}

        {/* Botón rápido para Limpiar filtros si hay selección activa */}
        {!isTodosActive && (
          <button
            type="button"
            onClick={onClearAll}
            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>
    </div>
  )
}
