/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar02Icon,
  Money02Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  MapsLocation01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate, NavLink } from "react-router"

export function TallerCuentasDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const res = await financeService.getTallerFinanciero(id)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar datos financieros del taller")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const taller = data?.taller || data || {}

  const getPagoTypeLabel = (participante: any) => {
    if (participante.lineas_pago_modulo) return "Por Módulo"
    if (participante.pago_unico) return "Pago Único"
    return "—"
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Cargando datos del taller...
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Taller no encontrado
          </div>
        </div>
      </div>
    )
  }

  const participantes = data.participantes || []

  return (
    <div className="px-8 py-6">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3" style={{ color: COLORS.CHARCOAL }}>
        <NavLink to="/finanzas/pagos" className="hover:underline">Finanzas</NavLink>
        <span className="size-1 rounded-full bg-current opacity-50" />
        <NavLink to="/finanzas/pagos/cuentas/talleres" className="hover:underline">Talleres</NavLink>
        <span className="size-1 rounded-full bg-current opacity-50" />
        <span>{taller.nombre || "Detalle"}</span>
      </div>

      <button
        onClick={() => navigate("/finanzas/pagos/cuentas/talleres")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: COLORS.CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a Talleres
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black" style={{ color: COLORS.CHARCOAL }}>
              {taller.nombre || "Taller"}
            </h2>
            <button
              onClick={() => {
                toast.info("Exportación PDF no implementada aún")
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ color: COLORS.ACCENT, backgroundColor: `${COLORS.ACCENT}15` }}
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              Exportar PDF
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoBadge icon={UserIcon} label="Instructor" value={taller.instructor_nombre || taller.instructor?.persona?.nombres || "—"} />
            <InfoBadge icon={Calendar02Icon} label="Fecha" value={taller.fecha ? new Date(taller.fecha).toLocaleDateString("es-ES") : "—"} />
            <InfoBadge icon={Money02Icon} label="Precio" value={`$${Number(taller.precio || 0).toLocaleString()}`} />
            <InfoBadge icon={MapsLocation01Icon} label="Modalidad" value={taller.modalidad || "—"} />
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="p-6 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-base font-black" style={{ color: COLORS.CHARCOAL }}>
              Participantes ({participantes.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Nombre</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Tipo Pago</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Monto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: COLORS.CHARCOAL }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {participantes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center opacity-40 text-sm" style={{ color: COLORS.CHARCOAL }}>
                      No hay participantes registrados
                    </td>
                  </tr>
                ) : (
                  participantes.map((p: any) => {
                    const nombre = p.estudiante_nombre || p.participante_nombre || (p.participante ? `${p.participante.nombres || ""} ${p.participante.apellidos || ""}`.trim() : "—")
                    const pagadoCompleto = Number(p.saldo_pendiente || p.saldo || 0) <= 0
                    const tallerId = id
                    const participanteId = p.id || p.participante_id

                    return (
                      <tr key={p.id} className="transition-colors hover:bg-black/[0.02]">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{nombre}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold opacity-60" style={{ color: COLORS.CHARCOAL }}>
                            {getPagoTypeLabel(p)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                              ${Number(p.total_abonado || p.monto_abonado || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] opacity-40">
                              de ${Number(p.monto_total || 0).toLocaleString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {pagadoCompleto ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-100 text-green-700">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                                Pagado completo
                              </span>
                            ) : (
                              <button
                                onClick={() => navigate(`/finanzas/pagos/cuentas/talleres/${tallerId}/participante/${participanteId}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                style={{ color: COLORS.ACCENT, backgroundColor: `${COLORS.ACCENT}15` }}
                              >
                                Registrar cobro
                                <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                              </button>
                            )}
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
    </div>
  )
}

function InfoBadge({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
      <HugeiconsIcon icon={Icon} size={14} style={{ color: COLORS.TEXT_MUTED }} />
      <div>
        <p className="text-[9px] font-bold uppercase opacity-40">{label}</p>
        <p className="text-xs font-bold">{value}</p>
      </div>
    </div>
  )
}
