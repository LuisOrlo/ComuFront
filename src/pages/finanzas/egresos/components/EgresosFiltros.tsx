/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { SlidersHorizontal, ChevronDown, Calendar, Search, RotateCcw, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FiltrosProps {
  filtros: {
    categoria: string
    search: string
    fecha_desde: string
    fecha_hasta: string
  }
  categorias: any[]
  onChange: (f: any) => void
}

export function EgresosFiltros({ filtros, categorias, onChange }: FiltrosProps) {
  const [open, setOpen] = useState(true)

  const badges: { label: string; onClear: () => void }[] = []

  if (filtros.categoria) {
    const cat = categorias.find((c: any) => String(c.id) === String(filtros.categoria))
    badges.push({
      label: `Categoría: ${cat?.nombre || filtros.categoria}`,
      onClear: () => onChange({ ...filtros, categoria: "" }),
    })
  }

  if (filtros.search) {
    badges.push({
      label: `Buscar: "${filtros.search}"`,
      onClear: () => onChange({ ...filtros, search: "" }),
    })
  }

  if (filtros.fecha_desde || filtros.fecha_hasta) {
    badges.push({
      label: `Período: ${filtros.fecha_desde || "..."} — ${filtros.fecha_hasta || "..."}`,
      onClear: () => onChange({ ...filtros, fecha_desde: "", fecha_hasta: "" }),
    })
  }

  const activeCount = badges.length

  const handleReset = () => {
    onChange({
      categoria: "",
      search: "",
      fecha_desde: "",
      fecha_hasta: "",
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Encabezado colapsable */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center">
            <SlidersHorizontal size={16} strokeWidth={2.2} />
          </span>
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Análisis del Período
          </span>
          {activeCount > 0 ? (
            <span className="bg-orange-50 text-[#fd761a] border border-orange-200/70 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {activeCount} {activeCount === 1 ? "filtro activo" : "filtros activos"}
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-semibold">
              Filtros y Búsqueda
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={cn("text-slate-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Panel de Filtros */}
      {open && (
        <div className="p-4 sm:p-5 pt-0 flex flex-col gap-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 items-end">
            {/* Desde */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Desde</label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-3 text-slate-400 pointer-events-none"
                />
                <input
                  type="date"
                  value={filtros.fecha_desde}
                  onChange={(e) => onChange({ ...filtros, fecha_desde: e.target.value })}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] transition-all"
                />
              </div>
            </div>

            {/* Hasta */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Hasta</label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-3 text-slate-400 pointer-events-none"
                />
                <input
                  type="date"
                  value={filtros.fecha_hasta}
                  onChange={(e) => onChange({ ...filtros, fecha_hasta: e.target.value })}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] transition-all"
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Categoría</label>
              <div className="relative">
                <select
                  value={filtros.categoria}
                  onChange={(e) => onChange({ ...filtros, categoria: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] transition-all appearance-none pr-8 cursor-pointer"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Búsqueda rápida */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Búsqueda rápida</label>
              <div className="relative flex items-center">
                <Search
                  size={16}
                  className="absolute left-3 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={filtros.search}
                  onChange={(e) => onChange({ ...filtros, search: e.target.value })}
                  placeholder="Descripción o proveedor..."
                  className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] transition-all"
                />
                {filtros.search && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filtros, search: "" })}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title="Borrar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chips de filtros activos */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {badges.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Activos:</span>
                {badges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#fd761a] border border-orange-200/70"
                  >
                    <span>{b.label}</span>
                    <button
                      type="button"
                      onClick={b.onClear}
                      className="hover:opacity-70 transition-opacity p-0.5 rounded-full hover:bg-orange-100"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 hover:text-[#fd761a] flex items-center gap-1 ml-2 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Limpiar todo</span>
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">
                Mostrando todos los egresos registrados sin restricciones.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
