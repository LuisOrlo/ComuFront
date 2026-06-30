/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon } from "@hugeicons/core-free-icons"
import { Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

function fmtDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) }

const CAT_BADGE: Record<string, { bg: string; text: string }> = {
  "Personal": { bg: "oklch(0.5 0.15 260 / 0.12)", text: "#4f46e5" },
  "Servicios": { bg: "oklch(0.5 0.15 80 / 0.12)", text: "#d97706" },
  "Equipos": { bg: "oklch(0.5 0.15 280 / 0.12)", text: "#7c3aed" },
}

interface Props {
  data: any[]
  loading: boolean
  page: number; lastPage: number
  onPageChange: (p: number) => void
  onSort: (col: string) => void
  sortCol: string; sortDir: string
  onDelete: (id: string) => void
}

export function EgresosTabla({ data, loading, page, lastPage, onPageChange, onSort, sortCol, sortDir, onDelete }: Props) {
  const navigate = useNavigate()

  const SortIcon = ({ col }: { col: string }) => (
    <span className="inline-block w-3 text-center opacity-30 ml-0.5">
      {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  )

  const Th = ({ col, label }: { col: string; label: string }) => (
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
            {Th({ col: "fecha_pago", label: "Fecha" })}
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40">Descripción</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40">Categoría</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40">Proveedor</th>
            {Th({ col: "monto", label: "Monto" })}
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40">Método</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: BORDER }}>
          {loading ? (
            <tr><td colSpan={7} className="p-10 text-center opacity-40">Cargando...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={7} className="p-10 text-center opacity-40">Sin egresos registrados</td></tr>
          ) : data.map((item, i) => (
            <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }} className="hover:bg-gray-100/50 transition-colors">
              <td className="px-3 py-2 text-xs font-medium" style={{ color: CHARCOAL }}>{fmtDate(item.fecha_pago)}</td>
              <td className="px-3 py-2 text-xs truncate max-w-[180px]" style={{ color: CHARCOAL }}>{item.descripcion || "—"}</td>
              <td className="px-3 py-2">
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase"
                  style={{ backgroundColor: CAT_BADGE[item.categoria_nombre]?.bg || "#dc262618", color: CAT_BADGE[item.categoria_nombre]?.text || "#dc2626" }}>
                  {item.categoria_nombre || "—"}
                </span>
              </td>
              <td className="px-3 py-2 text-xs opacity-60">{item.proveedor_beneficiario || "—"}</td>
              <td className="px-3 py-2 text-xs font-bold" style={{ color: "#dc2626" }}>${Number(item.monto || 0).toLocaleString()}</td>
              <td className="px-3 py-2 text-xs capitalize opacity-60">{item.metodo_pago || "—"}</td>
              <td className="px-3 py-2 flex gap-1">
                <button onClick={() => navigate(`/finanzas/egresos/${item.id}/editar`)} className="size-7 rounded-full flex items-center justify-center hover:bg-gray-100"><HugeiconsIcon icon={Edit01Icon} size={12} /></button>
                <button onClick={() => onDelete(item.id)} className="size-7 rounded-full flex items-center justify-center hover:bg-red-50"><Trash2 size={12} className="text-red-500" /></button>
              </td>
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
              <td colSpan={2}></td>
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
