/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowRight01Icon,
  InvoiceIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

export function CuentasPage() {
  const navigate = useNavigate()
  const [cuentas, setCuentas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await financeService.getCuentas({ per_page: 50 })
        setCuentas(res.data)
      } catch {
        toast.error("Error al cargar cuentas por cobrar")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtradas = cuentas.filter((c) => {
    if (!buscar.trim()) return true
    const q = buscar.toLowerCase()
    const nombre = (() => {
      const s = c.solicitud_inscripcion
      const m = c.matricula
      if (m?.estudiante) return `${m.estudiante.nombres} ${m.estudiante.apellidos}`
      if (s?.estudiante) return `${s.estudiante.nombres} ${s.estudiante.apellidos}`
      if (s?.participante_externo) return `${s.participante_externo.nombres} ${s.participante_externo.apellidos}`
      return ""
    })()
    return nombre.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q)
  })

  const getOrigenLabel = (cuenta: any) => {
    if (cuenta.matricula_id) return "Matrícula"
    if (cuenta.solicitud_inscripcion_id) return "Inscripción"
    if (cuenta.inscripcion_taller_id) return "Taller"
    return "Servicio"
  }

  const getNombreEstudiante = (cuenta: any) => {
    const s = cuenta.solicitud_inscripcion
    const m = cuenta.matricula
    if (m?.estudiante) return `${m.estudiante.nombres} ${m.estudiante.apellidos}`
    if (s?.estudiante) return `${s.estudiante.nombres} ${s.estudiante.apellidos}`
    if (s?.participante_externo) return `${s.participante_externo.nombres} ${s.participante_externo.apellidos}`
    return "Estudiante desconocido"
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              <button onClick={() => navigate("/finanzas/pagos")} className="hover:underline">Finanzas</button>
              <span className="size-1 rounded-full bg-current opacity-50" />
              Cuentas por cobrar
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Cuentas por Cobrar
            </h1>
            <p className="text-xs opacity-40 mt-1">{cuentas.length} cuenta{cuentas.length !== 1 ? "s" : ""} registrada{cuentas.length !== 1 ? "s" : ""}</p>
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
            <div className="relative max-w-md">
              <HugeiconsIcon icon={Search01Icon} size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: COLORS.CHARCOAL }} />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl outline-none transition-all text-sm"
                style={{ backgroundColor: "oklch(0.97 0 0)" }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Beneficiario / Origen</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Monto Total</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Abonado</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Saldo</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40 text-center" style={{ color: COLORS.CHARCOAL }}>Estado</th>
                  <th className="px-8 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center opacity-40 font-medium" style={{ color: COLORS.CHARCOAL }}>Cargando cuentas por cobrar...</td></tr>
                ) : filtradas.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center opacity-40 font-medium" style={{ color: COLORS.CHARCOAL }}>{buscar ? "Sin resultados para tu búsqueda" : "No se encontraron cuentas"}</td></tr>
                ) : (
                  filtradas.map((c, idx) => (
                    <tr key={c.id} className="transition-colors hover:bg-black/[0.02] group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="size-10 rounded-xl border flex items-center justify-center shadow-sm transition-colors group-hover:border-blue-200"
                            style={{ borderColor: COLORS.BORDER_SUBTLE }}
                          >
                            <HugeiconsIcon icon={InvoiceIcon} size={20} style={{ color: COLORS.TEXT_MUTED }} />
                          </motion.div>
                          <div>
                            <p className="font-bold leading-tight" style={{ color: COLORS.CHARCOAL }}>{getNombreEstudiante(c)}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-40" style={{ color: COLORS.CHARCOAL }}>{getOrigenLabel(c)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-bold" style={{ color: COLORS.CHARCOAL }}>${c.monto_total}</td>
                      <td className="px-6 py-5 font-bold text-green-600">${c.monto_abonado}</td>
                      <td className="px-6 py-5 font-black text-red-600">${Number(c.monto_total - c.monto_abonado).toFixed(2)}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                          c.estado === 'pendiente' ? 'bg-red-100 text-red-700' :
                          c.estado === 'abonado' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => navigate(`/finanzas/pagos/cuentas/${c.id}/pago`)}
                          className="size-9 rounded-xl flex items-center justify-center transition-all shadow-sm group-hover:scale-110"
                          style={{ backgroundColor: "oklch(0.95 0 0)" }}
                        >
                          <HugeiconsIcon icon={ArrowRight01Icon} size={18} style={{ color: COLORS.TEXT_MUTED }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
