import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import type { ReservaRadio } from "@/services/radio.service"
import { Eye, Pencil, Trash2, CreditCard } from "lucide-react"

const ESTADO_COLORS: Record<string, string> = {
  reservado: "bg-orange-100 text-orange-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  en_progreso: "bg-blue-100 text-blue-700",
  completado: "bg-gray-100 text-gray-500",
  cancelado: "bg-red-100 text-red-600",
}

const ESTADO_LABELS: Record<string, string> = {
  reservado: "Pendiente",
  confirmado: "Confirmado",
  en_progreso: "En progreso",
  completado: "Finalizado",
  cancelado: "Cancelado",
}

export function RadioTable({
  reservas,
  onEdit,
  onDelete,
  onRegistrarPago,
  onSelect,
}: {
  reservas: ReservaRadio[]
  onEdit: (r: ReservaRadio) => void
  onDelete: (id: string, name: string) => void
  onRegistrarPago: (id: string) => void
  onSelect: (r: ReservaRadio) => void
}) {
  if (reservas.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-bold opacity-40">No hay reservas para esta semana</p>
      </div>
    )
  }

  return (
    <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <table className="w-full">
          <thead>
            <tr className="border-b text-[9px] font-bold uppercase tracking-wider opacity-40 bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Horario</th>
              <th className="text-left px-4 py-3">Tarifa</th>
              <th className="text-left px-4 py-3">Responsable</th>
              <th className="text-left px-4 py-3">Operador</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {reservas.map(r => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-bold">
                  <button onClick={() => onSelect(r)} className="hover:underline text-left">
                    {new Date(r.fecha_reserva + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })}
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-bold">
                  {r.hora_inicio.substring(0, 5)} – {r.hora_fin.substring(0, 5)}
                </td>
                <td className="px-4 py-3 text-xs">{r.tarifa?.nombre || "—"}</td>
                <td className="px-4 py-3 text-xs truncate max-w-[140px]">
                  {r.persona ? `${r.persona.nombres.split(" ")[0]} ${r.persona.apellidos.split(" ")[0]}` : r.cliente_externo?.nombres || "—"}
                </td>
                <td className="px-4 py-3 text-xs opacity-60">
                  {r.incluye_operador && r.operador ? `${r.operador.nombres.split(" ")[0]}` : r.incluye_operador ? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-right font-bold">${r.precio_total.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", ESTADO_COLORS[r.estado] || "")}>
                    {ESTADO_LABELS[r.estado] || r.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onSelect(r)} className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" title="Ver detalle">
                      <Eye size={13} className="opacity-40" />
                    </button>
                    <button onClick={() => onEdit(r)} className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                      <Pencil size={13} className="opacity-40" />
                    </button>
                    {r.estado === "reservado" && (
                      <button onClick={() => onRegistrarPago(r.id)} className="size-7 flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-colors" title="Registrar pago">
                        <CreditCard size={13} className="opacity-40 text-emerald-600" />
                      </button>
                    )}
                    <button onClick={() => onDelete(r.id, r.tarifa?.nombre || "reserva")} className="size-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" title="Eliminar">
                      <Trash2 size={13} className="opacity-40 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
