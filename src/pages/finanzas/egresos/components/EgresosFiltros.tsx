/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE

interface FiltrosProps {
  filtros: { categoria: string; search: string; fecha_desde: string; fecha_hasta: string }
  categorias: any[]
  onChange: (f: any) => void
}

export function EgresosFiltros({ filtros, categorias, onChange }: FiltrosProps) {
  const badges: { label: string; onClear: () => void }[] = []

  if (filtros.categoria) {
    const cat = categorias.find((c: any) => String(c.id) === filtros.categoria)
    badges.push({ label: cat?.nombre || filtros.categoria, onClear: () => onChange({ ...filtros, categoria: "" }) })
  }
  if (filtros.search) badges.push({ label: `"${filtros.search}"`, onClear: () => onChange({ ...filtros, search: "" }) })
  if (filtros.fecha_desde || filtros.fecha_hasta) badges.push({
    label: `${filtros.fecha_desde || "..."} — ${filtros.fecha_hasta || "..."}`,
    onClear: () => onChange({ ...filtros, fecha_desde: "", fecha_hasta: "" }),
  })

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={filtros.fecha_desde} onChange={e => onChange({ ...filtros, fecha_desde: e.target.value })}
          className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium w-[140px]" style={{ borderColor: BORDER }} />
        <span className="text-[10px] opacity-30">—</span>
        <input type="date" value={filtros.fecha_hasta} onChange={e => onChange({ ...filtros, fecha_hasta: e.target.value })}
          className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium w-[140px]" style={{ borderColor: BORDER }} />
        <select value={filtros.categoria} onChange={e => onChange({ ...filtros, categoria: e.target.value })}
          className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium" style={{ borderColor: BORDER }}>
          <option value="">Todas las categorías</option>
          {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input type="text" value={filtros.search} onChange={e => onChange({ ...filtros, search: e.target.value })}
          placeholder="Buscar descripción/proveedor..." className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium w-56" style={{ borderColor: BORDER }} />
        {badges.length > 0 && (
          <button onClick={() => onChange({ categoria: "", search: "", fecha_desde: "", fecha_hasta: "" })}
            className="text-[10px] font-bold opacity-40 hover:opacity-100 px-2">Limpiar</button>
        )}
      </div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-medium"
              style={{ backgroundColor: "#dc262612", color: "#dc2626" }}>
              {b.label}
              <button onClick={b.onClear} className="hover:opacity-60"><HugeiconsIcon icon={Cancel01Icon} size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
