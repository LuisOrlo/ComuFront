/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Invoice02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

export function HistorialPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [transacciones, setTransacciones] = useState<any[]>([])

  const loadHistorial = async () => {
    try {
      const res = await financeService.getTransacciones({ per_page: 50 })
      setTransacciones(res.data)
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistorial()
  }, [])

  const badgeEstado = (estado: string) => {
    if (estado === "aprobado")  return "bg-green-100 text-green-700"
    if (estado === "rechazado") return "bg-red-100 text-red-700"
    return "bg-amber-100 text-amber-700"
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              <button onClick={() => navigate("/finanzas/pagos")} className="hover:underline">Finanzas</button>
              <span className="size-1 rounded-full bg-current opacity-50" />
              Historial
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Historial Financiero
            </h1>
            <p className="text-xs opacity-40 mt-1">Todos los movimientos de pago registrados en el sistema</p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 pb-8 pt-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="p-6 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h2 className="text-lg font-black flex items-center gap-3" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={Invoice02Icon} size={22} style={{ color: COLORS.ACCENT }} />
              Historial Completo
              {transacciones.length > 0 && (
                <span className="text-sm font-bold opacity-40">({transacciones.length})</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="p-20 text-center opacity-40 font-medium" style={{ color: COLORS.CHARCOAL }}>Cargando historial...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Fecha</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Origen</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Monto</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {transacciones.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <p className="font-medium text-sm opacity-30" style={{ color: COLORS.CHARCOAL }}>No hay movimientos registrados aún</p>
                        <p className="text-xs mt-1 opacity-20">Los pagos y abonos aparecerán aquí una vez registrados</p>
                      </td>
                    </tr>
                  ) : (
                    transacciones.map((t) => (
                      <tr key={t.id} className="transition-colors hover:bg-black/[0.02]">
                        <td className="px-8 py-4 text-xs font-bold opacity-60" style={{ color: COLORS.CHARCOAL }}>
                          {new Date(t.fecha_pago).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                          {(() => {
                            const cp = t.cuenta_por_cobrar
                            const m = cp?.matricula
                            const s = cp?.solicitud_inscripcion
                            const pe = s?.participante_externo
                            if (m?.estudiante) return `${m.estudiante.nombres} ${m.estudiante.apellidos}`
                            if (s?.estudiante) return `${s.estudiante.nombres} ${s.estudiante.apellidos}`
                            if (pe) return `${pe.nombres} ${pe.apellidos}`
                            return "—"
                          })()}
                        </td>
                        <td className="px-6 py-4 font-black" style={{ color: COLORS.ACCENT }}>${t.monto}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase", badgeEstado(t.estado_verificacion))}>
                            {t.estado_verificacion}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
