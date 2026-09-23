/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { SlidersHorizontal, ChevronDown, Calendar, Search, RotateCcw, X, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface FiltrosProps {
  filtros: {
    categoria: string
    metodo_pago: string
    search: string
    fecha_desde: string
    fecha_hasta: string
  }
  onChange: (f: any) => void
  analytics?: { metodo_top?: string } | null
}

const CATEGORIAS = [
  { key: "", label: "Todas las categorías" },
  { key: "cursos", label: "Cursos" },
  { key: "cursos_personalizados", label: "Cursos personalizados" },
  { key: "talleres", label: "Talleres" },
  { key: "podcast", label: "Podcast" },
  { key: "aulas", label: "Alquiler de Aulas" },
  { key: "equipos", label: "Alquiler de Equipos" },
  { key: "radio", label: "Radio" },
  { key: "edicion", label: "Edición de Video" },
  { key: "streaming", label: "Streaming" },
  { key: "produccion", label: "Producción Audiovisual" },
  { key: "asesorias", label: "Asesorías" },
]

export function IngresosFiltros({ filtros, onChange, analytics }: FiltrosProps) {
  const [open, setOpen] = useState(true)

  const badges: { label: string; onClear: () => void }[] = []

  if (filtros.categoria) {
    badges.push({
      label: CATEGORIAS.find((c) => c.key === filtros.categoria)?.label || filtros.categoria,
      onClear: () => onChange({ ...filtros, categoria: "" }),
    })
  }

  if (filtros.metodo_pago) {
    badges.push({
      label: `Método: ${filtros.metodo_pago}`,
      onClear: () => onChange({ ...filtros, metodo_pago: "" }),
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
      metodo_pago: "",
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
            <div className="lg:col-span-2 flex flex-col gap-1">
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
            <div className="lg:col-span-2 flex flex-col gap-1">
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
                  {CATEGORIAS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Segmentado Método de Pago */}
            <div className="lg:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Método de pago</label>
              <div className="h-10 p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200/50">
                {[
                  { k: "", l: "Todos" },
                  { k: "efectivo", l: "Efectivo" },
                  { k: "transferencia", l: "Transf." },
                ].map((m) => {
                  const isSelected = filtros.metodo_pago === m.k
                  return (
                    <button
                      key={m.k}
                      type="button"
                      onClick={() => onChange({ ...filtros, metodo_pago: m.k })}
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        isSelected
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                      )}
                    >
                      {m.l}
                    </button>
                  )
                })}
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
                  placeholder="Buscar estudiante o concepto..."
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

          {/* Chips de filtros activos y Métricas analíticas */}
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
                Mostrando todos los registros del ciclo actual sin restricciones.
              </span>
            )}

            {/* Indicador de método más usado si está presente en analytics */}
            {analytics?.metodo_top && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                <CreditCard size={14} className="text-[#fd761a]" />
                <span className="text-slate-400 font-medium">Método más usado:</span>
                <span className="font-bold text-slate-900 capitalize">{analytics.metodo_top}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
