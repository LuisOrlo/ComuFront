/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

const CAT_COLORS: Record<string, string> = {
  "Cursos": "oklch(0.55 0.15 150 / 0.12)",
  "Talleres": "oklch(0.6 0.15 200 / 0.12)",
  "Podcast": "oklch(0.5 0.15 260 / 0.12)",
  "Alquiler de Aulas": "oklch(0.5 0.15 280 / 0.12)",
  "Radio": "oklch(0.5 0.12 320 / 0.12)",
  "Edición de Video": "oklch(0.45 0.15 30 / 0.12)",
  "Alquiler de Equipos": "oklch(0.45 0.12 10 / 0.12)",
  "Streaming": "oklch(0.5 0.12 170 / 0.12)",
  "Producción Audiovisual": "oklch(0.5 0.12 140 / 0.12)",
  "Asesorías": "oklch(0.5 0.12 80 / 0.12)",
}

const CAT_TEXT: Record<string, string> = {
  "Cursos": "#059669", "Talleres": "#0891b2", "Podcast": "#4f46e5",
  "Alquiler de Aulas": "#7c3aed", "Radio": "#a21caf", "Edición de Video": "#d97706",
  "Alquiler de Equipos": "#dc2626", "Streaming": "#0d9488", "Producción Audiovisual": "#65a30d",
  "Asesorías": "#ca8a04", "Otros": "#6b7280",
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

interface Props {
  data: any[]
  loading: boolean
  page: number
  lastPage: number
  onPageChange: (p: number) => void
  onSort: (col: string) => void
  sortCol: string
  sortDir: string
}

export function IngresosTabla({ data, loading, page, lastPage, onPageChange, onSort, sortCol, sortDir }: Props) {
  const navigate = useNavigate()

  const SortIcon = ({ col }: { col: string }) => (
    <span className="inline-block w-3 text-center opacity-30 ml-0.5">
      {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  )

  const sortableHeader = (col: string, label: string) => (
    <th onClick={() => onSort(col)} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 cursor-pointer hover:opacity-70 select-none">
      {label}<SortIcon col={col} />
    </th>
  )

  const totalFila = data.reduce((s: number, r: any) => s + Number(r.monto || 0), 0)

  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/80">
            {sortableHeader("fecha_pago", "Fecha")}
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40">Concepto</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40">Estudiante</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40">Categoría</th>
            {sortableHeader("monto", "Monto")}
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40">Método</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: BORDER }}>
          {loading ? (
            <tr><td colSpan={6} className="p-10 text-center opacity-40">Cargando...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={6} className="p-10 text-center opacity-40">Sin ingresos</td></tr>
          ) : data.map((item: any) => (
            <tr key={item.id} onClick={() => navigate(`/finanzas/ingresos/${item.id}`)}
              className="hover:bg-gray-50 cursor-pointer transition-colors">
              <td className="px-3 py-2 text-xs font-medium" style={{ color: CHARCOAL }}>{fmtDate(item.fecha_pago)}</td>
              <td className="px-3 py-2 text-xs truncate max-w-[160px]" style={{ color: CHARCOAL }}>{item.concepto || "—"}</td>
              <td className="px-3 py-2 text-xs" style={{ color: CHARCOAL }}>{item.estudiante_nombre || "—"}</td>
              <td className="px-3 py-2">
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase"
                  style={{ backgroundColor: CAT_COLORS[item.categoria] || "oklch(0.4 0.02 0 / 0.12)", color: CAT_TEXT[item.categoria] || "#6b7280" }}>
                  {item.categoria}
                </span>
              </td>
              <td className="px-3 py-2 text-xs font-bold" style={{ color: "oklch(0.55 0.15 150)" }}>${Number(item.monto || 0).toLocaleString()}</td>
              <td className="px-3 py-2 text-xs capitalize opacity-60">{item.metodo_pago}</td>
            </tr>
          ))}
        </tbody>
        {data.length > 0 && (
          <tfoot>
            <tr style={{ backgroundColor: CHARCOAL }}>
              <td className="px-3 py-2" colSpan={4}>
                <span className="text-[10px] font-bold text-white/60">Total ({data.length} registros)</span>
              </td>
              <td className="px-3 py-2 text-xs font-bold text-white">${totalFila.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>
      {lastPage > 1 && (
        <div className="flex justify-center gap-2 py-3 border-t" style={{ borderColor: BORDER }}>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gray-100 disabled:opacity-30">Anterior</button>
          <span className="px-2 py-1.5 text-[10px] opacity-40">{page} de {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => onPageChange(page + 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gray-100 disabled:opacity-30">Siguiente</button>
        </div>
      )}
    </div>
  )
}
