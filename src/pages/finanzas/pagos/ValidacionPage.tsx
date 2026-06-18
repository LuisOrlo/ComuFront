/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  ViewIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

export function ValidacionPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [verifying, setVerifying] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)

  const loadPendientes = async () => {
    try {
      const res = await financeService.getTransacciones({ estado_verificacion: "pendiente" })
      setTransacciones(res.data)
    } catch {
      toast.error("Error al cargar comprobantes pendientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPendientes()
  }, [])

  const handleVerificar = async (id: string, estado: "aprobado" | "rechazado") => {
    setVerifying(id)
    try {
      await financeService.verificarTransaccion(id, { estado })
      toast.success(`Transacción ${estado} correctamente`)
      loadPendientes()
    } catch {
      toast.error("Error al procesar verificación")
    } finally {
      setVerifying(null)
    }
  }

  const getNombreEstudiante = (t: any) => {
    const s = t.cuenta_por_cobrar?.solicitud_inscripcion
    const m = t.cuenta_por_cobrar?.matricula
    if (m?.estudiante) return `${m.estudiante.nombres} ${m.estudiante.apellidos}`
    if (s?.estudiante) return `${s.estudiante.nombres} ${s.estudiante.apellidos}`
    if (s?.participante_externo) return `${s.participante_externo.nombres} ${s.participante_externo.apellidos}`
    return "Desconocido"
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              <button onClick={() => navigate("/finanzas/pagos")} className="hover:underline">Finanzas</button>
              <span className="size-1 rounded-full bg-current opacity-50" />
              Validación
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Validación de Pagos
            </h1>
            <p className="text-xs opacity-40 mt-1">Revisa y aprueba comprobantes de pago pendientes</p>
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
              <HugeiconsIcon icon={Clock01Icon} size={22} style={{ color: "oklch(0.65 0.15 75)" }} />
              Comprobantes Pendientes de Verificación
              {transacciones.length > 0 && (
                <span className="text-sm font-bold opacity-40">({transacciones.length})</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="p-20 text-center opacity-40 font-medium" style={{ color: COLORS.CHARCOAL }}>Cargando comprobantes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Estudiante / Fecha</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Monto</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Método</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40 text-center" style={{ color: COLORS.CHARCOAL }}>Comprobante</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {transacciones.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center opacity-40 font-medium" style={{ color: COLORS.CHARCOAL }}>No hay comprobantes por verificar</td></tr>
                  ) : (
                    transacciones.map((t) => (
                      <tr key={t.id} className="transition-colors hover:bg-black/[0.02]">
                        <td className="px-8 py-5">
                          <p className="font-bold" style={{ color: COLORS.CHARCOAL }}>{getNombreEstudiante(t)}</p>
                          <p className="text-[10px] uppercase font-bold mt-0.5 opacity-40">{new Date(t.fecha_pago).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-5 font-black" style={{ color: COLORS.ACCENT }}>${t.monto}</td>
                        <td className="px-6 py-5 capitalize text-sm font-medium opacity-60" style={{ color: COLORS.CHARCOAL }}>{t.metodo_pago}</td>
                        <td className="px-6 py-5 text-center">
                          {t.comprobante_url ? (
                            <button
                              onClick={() => setModalImage(t.comprobante_url)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-white"
                              style={{ backgroundColor: COLORS.ACCENT }}
                            >
                              <HugeiconsIcon icon={ViewIcon} size={14} /> VER
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-widest italic opacity-30">Sin archivo</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              disabled={verifying === t.id}
                              onClick={() => handleVerificar(t.id, "rechazado")}
                              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                              style={{ backgroundColor: "oklch(0.5 0.15 20 / 0.08)", color: "oklch(0.5 0.15 20)" }}
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={14} className="inline mr-1" /> Rechazar
                            </button>
                            <button
                              disabled={verifying === t.id}
                              onClick={() => handleVerificar(t.id, "aprobado")}
                              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 text-white"
                              style={{ backgroundColor: "oklch(0.5 0.15 150)" }}
                            >
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="inline mr-1" /> Aprobar
                            </button>
                          </div>
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

      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setModalImage(null)}
        >
          <div className="relative flex items-center justify-center p-6" style={{ maxWidth: "min(90vw, 1200px)", maxHeight: "90vh" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setModalImage(null); }}
              className="absolute -top-8 right-0 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cerrar [X]
            </button>
            <img
              src={modalImage}
              alt="Comprobante"
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
