import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import type { ReservaPodcast } from "@/services/podcast.service"

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-700 border-green-200" },
  en_progreso: { label: "En progreso", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completado: { label: "Completado", color: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
}

function fmtDate(d: Date) { return d.toISOString().split("T")[0] }
function fmtHora(h: string) { return h.substring(0, 5) }

export function PodcastTable({ reservas, onEdit, onDelete, onRegistrarPago, onSelect }: {
  reservas: ReservaPodcast[]
  onEdit: (r: ReservaPodcast) => void
  onDelete: (id: string, name: string) => void
  onRegistrarPago: (id: string) => void
  onSelect: (r: ReservaPodcast) => void
}) {
  const today = fmtDate(new Date())
  return (
    <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-b from-gray-50 to-gray-100/80">
                {["Fecha", "Hora", "Paquete", "Cliente", "Encargado", "Estado", "Pago", "Total", ""].map((h, i) => (
                  <th key={`podcast-h-${i}`} className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 border-r last:border-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {reservas.length === 0 ? (
                <tr><td colSpan={9} className="p-12 text-center text-xs opacity-40">No hay reservas registradas</td></tr>
              ) : (
                reservas.map(r => {
                  const isToday = r.fecha_reserva === today
                  const vencido = new Date(r.fecha_reserva + "T" + (r.hora_fin || "23:59")) < new Date() && r.estado !== "completado" && r.estado !== "cancelado"
                  return (
                    <tr key={r.id} onClick={() => onSelect(r)} className={cn("cursor-pointer hover:bg-gray-50/80", isToday && "bg-amber-50/40")}>
                      <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <div className="flex items-center gap-2">
                          {isToday && <div className="size-1.5 rounded-full bg-amber-400" />}
                          {vencido && <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />}
                          <span className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>
                            {new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 border-r text-xs font-mono opacity-60" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)}</td>
                      <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <span className="text-xs font-bold truncate max-w-[120px]" style={{ color: COLORS.CHARCOAL }}>{r.paquete?.nombre || "—"}</span>
                      </td>
                      <td className="p-3 border-r text-xs font-medium opacity-60 max-w-[100px] truncate" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {r.cliente_externo ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.trim() : "—"}
                      </td>
                      <td className="p-3 border-r text-xs font-medium opacity-60 max-w-[100px] truncate" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {r.persona ? `${r.persona.nombres} ${r.persona.apellidos}` : "—"}
                      </td>
                      <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border", ESTADO_LABELS[r.estado]?.color || "bg-gray-100")}>
                          {ESTADO_LABELS[r.estado]?.label || r.estado}
                        </span>
                      </td>
                      <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {r.pago_registrado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-green-100 text-green-700"><HugeiconsIcon icon={Tick02Icon} size={10} /> Pagado</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onRegistrarPago(r.id) }}
                            className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                          >Pendiente</button>
                        )}
                      </td>
                      <td className="p-3 border-r text-xs font-bold text-right" style={{ borderColor: COLORS.BORDER_SUBTLE }}>${Number(r.precio_total).toFixed(2)}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); onEdit(r) }} className="size-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10" title="Editar"><HugeiconsIcon icon={Edit01Icon} size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(r.id, r.paquete?.nombre || r.fecha_reserva) }} className="size-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100" title="Eliminar"><Trash2 size={12} className="text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
