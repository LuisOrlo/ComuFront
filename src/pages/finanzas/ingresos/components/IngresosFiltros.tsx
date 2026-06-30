/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE

interface FiltrosProps {
  filtros: { categoria: string; metodo_pago: string; search: string; fecha_desde: string; fecha_hasta: string }
  onChange: (f: any) => void
}

const CATEGORIAS = [
  { key: "", label: "Todas las categorías" },
  { key: "cursos", label: "Cursos" }, { key: "talleres", label: "Talleres" },
  { key: "podcast", label: "Podcast" }, { key: "aulas", label: "Alquiler de Aulas" },
  { key: "equipos", label: "Alquiler de Equipos" }, { key: "radio", label: "Radio" },
  { key: "edicion", label: "Edición de Video" }, { key: "streaming", label: "Streaming" },
  { key: "produccion", label: "Producción" }, { key: "asesorias", label: "Asesorías" },
]

export function IngresosFiltros({ filtros, onChange }: FiltrosProps) {
  const badges: { label: string; onClear: () => void }[] = []

  if (filtros.categoria) badges.push({
    label: CATEGORIAS.find(c => c.key === filtros.categoria)?.label || filtros.categoria,
    onClear: () => onChange({ ...filtros, categoria: "" }),
  })
  if (filtros.metodo_pago) badges.push({
    label: filtros.metodo_pago,
    onClear: () => onChange({ ...filtros, metodo_pago: "" }),
  })
  if (filtros.search) badges.push({
    label: `"${filtros.search}"`,
    onClear: () => onChange({ ...filtros, search: "" }),
  })
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
          {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>

        <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl">
          {[{ k: "", l: "Todos" }, { k: "efectivo", l: "Efectivo" }, { k: "transferencia", l: "Transferencia" }].map(m => (
            <button key={m.k} onClick={() => onChange({ ...filtros, metodo_pago: m.k })}
              className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wider transition-all"
              style={filtros.metodo_pago === m.k ? { backgroundColor: "#fff", color: COLORS.CHARCOAL, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: COLORS.TEXT_MUTED }}>
              {m.l}
            </button>
          ))}
        </div>

        <input type="text" value={filtros.search} onChange={e => onChange({ ...filtros, search: e.target.value })}
          placeholder="Buscar estudiante..." className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium w-48" style={{ borderColor: BORDER }} />

        {badges.length > 0 && (
          <button onClick={() => onChange({ categoria: "", metodo_pago: "", search: "", fecha_desde: "", fecha_hasta: "" })}
            className="text-[10px] font-bold opacity-40 hover:opacity-100 px-2">Limpiar</button>
        )}
      </div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-medium"
              style={{ backgroundColor: `${COLORS.ACCENT}12`, color: COLORS.ACCENT }}>
              {b.label}
              <button onClick={b.onClear} className="hover:opacity-60"><HugeiconsIcon icon={Cancel01Icon} size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
