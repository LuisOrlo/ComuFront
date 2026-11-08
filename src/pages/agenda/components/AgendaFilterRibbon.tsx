import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  GridViewIcon,
  FilterIcon,
  GraduationCapIcon,
  ToolsIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons"
import type { TipoDisponible } from "@/services/agenda.service"
import { getEventStyles, type MacroCategoria, isAcademicType, isServiceType } from "../utils"

export interface AgendaFilterRibbonProps {
  macroCategory: MacroCategoria
  onMacroCategoryChange: (macro: MacroCategoria) => void
  activeTypes: string[]
  tipos: TipoDisponible[]
  countsByType: Record<string, number>
  countsByMacro: Record<MacroCategoria, number>
  onToggle: (tipo: string) => void
  onClearAll: () => void
  periodTitle?: string
}

export function AgendaFilterRibbon({
  macroCategory,
  onMacroCategoryChange,
  activeTypes,
  tipos,
  countsByType,
  countsByMacro,
  onToggle,
  onClearAll,
}: AgendaFilterRibbonProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const isTodosSubActive = activeTypes.length === 0

  // Filtrar las opciones según el macro-área activa
  const visibleTipos = tipos.filter(({ tipo }) => {
    if (macroCategory === "academico") return isAcademicType(tipo)
    if (macroCategory === "servicios") return isServiceType(tipo)
    return true
  })

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col gap-3 sm:gap-4 transition-all">
      {/* Fila Superior: Encabezado contextual + Botón de alternar móvil + Selector de Macro-Categoría */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-3.5 border-b border-slate-100 pb-3 sm:pb-3.5">
        {/* Título, estado y botón móvil de toggle */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 sm:size-9 rounded-xl bg-orange-50 border border-orange-200/60 text-[#fd761a] flex items-center justify-center shrink-0 shadow-2xs">
              <HugeiconsIcon icon={FilterIcon} size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  Filtrar Actividades
                </span>
                {!isTodosSubActive && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#fd761a] text-[10px] font-bold">
                    {activeTypes.length} {activeTypes.length === 1 ? "activo" : "activos"}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate hidden sm:block">
                {macroCategory === "academico"
                  ? "Mostrando ofertas formativas (Cursos, Talleres y Asesorías)"
                  : macroCategory === "servicios"
                    ? "Mostrando servicios de alquiler, podcast, radio y coberturas"
                    : "Explorando todas las actividades y servicios institucionales"}
              </p>
            </div>
          </div>

          {/* Botón exclusivo para dispositivos móviles: Expandir / Colapsar sub-filtros */}
          <button
            type="button"
            onClick={() => setIsMobileExpanded((prev) => !prev)}
            aria-expanded={isMobileExpanded}
            className={`md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              !isTodosSubActive || isMobileExpanded
                ? "bg-orange-50 border-orange-200 text-[#fd761a]"
                : "bg-slate-100 border-slate-200/80 text-slate-700"
            }`}
          >
            <HugeiconsIcon icon={FilterIcon} size={13} />
            <span>Sub-filtros</span>
            <HugeiconsIcon
              icon={isMobileExpanded ? ArrowUp01Icon : ArrowDown01Icon}
              size={14}
            />
          </button>
        </div>

        {/* Macro-Segmentos: Todos | Cursos & Academia | Servicios & Espacios */}
        <div className="grid grid-cols-3 sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-1 w-full md:w-auto">
          {/* Tab: Todos */}
          <button
            type="button"
            onClick={() => {
              onMacroCategoryChange("todos")
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              macroCategory === "todos"
                ? "bg-white text-slate-900 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <HugeiconsIcon icon={GridViewIcon} size={13} className="shrink-0" />
            <span className="truncate">Todos</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold shrink-0 ${
                macroCategory === "todos"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200/80 text-slate-600"
              }`}
            >
              {countsByMacro.todos}
            </span>
          </button>

          {/* Tab: Área Académica */}
          <button
            type="button"
            onClick={() => {
              onMacroCategoryChange("academico")
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              macroCategory === "academico"
                ? "bg-blue-600 text-white shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <HugeiconsIcon icon={GraduationCapIcon} size={13} className="shrink-0" />
            <span className="truncate">Academia</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold shrink-0 ${
                macroCategory === "academico"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 text-slate-600"
              }`}
            >
              {countsByMacro.academico}
            </span>
          </button>

          {/* Tab: Servicios & Producción */}
          <button
            type="button"
            onClick={() => {
              onMacroCategoryChange("servicios")
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              macroCategory === "servicios"
                ? "bg-emerald-700 text-white shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <HugeiconsIcon icon={ToolsIcon} size={13} className="shrink-0" />
            <span className="truncate">Servicios</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold shrink-0 ${
                macroCategory === "servicios"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 text-slate-600"
              }`}
            >
              {countsByMacro.servicios}
            </span>
          </button>
        </div>
      </div>

      {/* Fila Inferior: Lista de Píldoras de Filtro por Servicio / Categoría */}
      {/* En desktop siempre visible; en móvil sólo visible si isMobileExpanded está activo */}
      <div
        className={`${
          isMobileExpanded ? "flex flex-wrap" : "hidden md:flex md:flex-wrap"
        } items-center gap-2 sm:gap-2.5 transition-all`}
      >
        {/* Píldora: Todos los de esta categoría */}
        <button
          type="button"
          onClick={onClearAll}
          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none active:scale-[0.98] ${
            isTodosSubActive
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
          }`}
        >
          <HugeiconsIcon icon={GridViewIcon} size={13} />
          <span>
            {macroCategory === "academico"
              ? "Todos los cursos"
              : macroCategory === "servicios"
                ? "Todos los servicios"
                : "Todo el catálogo"}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              isTodosSubActive
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {macroCategory === "academico"
              ? countsByMacro.academico
              : macroCategory === "servicios"
                ? countsByMacro.servicios
                : countsByMacro.todos}
          </span>
        </button>

        {/* Píldoras específicas por tipo */}
        {visibleTipos.map(({ tipo, label }) => {
          const isActive = activeTypes.includes(tipo)
          const styles = getEventStyles(tipo)
          const count = countsByType[tipo] ?? 0
          const displayLabel = tipo === "CLASE_CURSO" ? "Cursos" : label

          return (
            <button
              key={tipo}
              type="button"
              onClick={() => onToggle(tipo)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none border active:scale-[0.98] ${
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
        {!isTodosSubActive && (
          <button
            type="button"
            onClick={onClearAll}
            className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
            <span>Restablecer</span>
          </button>
        )}
      </div>
    </div>
  )
}
