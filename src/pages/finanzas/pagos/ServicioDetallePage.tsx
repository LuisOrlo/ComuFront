/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "motion/react"
import { useLocation, useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Money02Icon,
  Clock01Icon,
  CheckmarkCircle04Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE

const SERVICIO_FKS = [
  "reserva_podcast_id",
  "reserva_aula_id",
  "alquiler_equipo_id",
  "edicion_video_id",
  "reserva_radio_id",
]

const FK_TO_TIPO: Record<string, string> = {
  reserva_podcast_id: "podcast",
  reserva_aula_id: "aula",
  alquiler_equipo_id: "equipo",
  edicion_video_id: "edicion",
  reserva_radio_id: "radio",
}

const TIPO_TO_BACKEND: Record<string, string> = {
  aula: "aula",
  podcast: "podcast",
  equipo: "equipo",
  edicion: "edicion",
  radio: "radio",
}

function getNombrePersona(entry: any): string {
  if (entry.persona_nombre) return entry.persona_nombre

  const extractNombre = (entidad: any) =>
    entidad ? `${entidad.nombres || ""} ${entidad.apellidos || ""}`.trim() : ""

  return extractNombre(entry.persona)
    || extractNombre(entry.cliente_externo)
    || extractNombre(entry.reserva_podcast?.persona)
    || extractNombre(entry.reserva_podcast?.cliente_externo)
    || extractNombre(entry.reserva_aula?.persona)
    || extractNombre(entry.reserva_aula?.cliente_externo)
    || extractNombre(entry.alquiler_equipo?.persona)
    || extractNombre(entry.alquiler_equipo?.cliente_externo)
    || extractNombre(entry.reserva_radio?.persona)
    || extractNombre(entry.reserva_radio?.cliente_externo)
    || extractNombre(entry.edicion_video?.cliente)
    || extractNombre(entry.edicion_video?.cliente_externo)
    || "—"
}

function getInfoServicio(entry: any): { tipo: string; servicioId: string } | null {
  for (const fk of SERVICIO_FKS) {
    if (entry[fk]) return { tipo: FK_TO_TIPO[fk], servicioId: entry[fk] }
  }
  if (entry.tipo && entry.id && TIPO_TO_BACKEND[entry.tipo]) {
    return { tipo: TIPO_TO_BACKEND[entry.tipo], servicioId: entry.id }
  }
  return null
}

export function ServicioDetallePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const state = location.state as any

  if (!state) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm font-medium opacity-40" style={{ color: CHARCOAL }}>
            Servicio no encontrado
          </p>
        </div>
      </div>
    )
  }

  const { entries, name, total, cobrado, saldo } = state

  return (
    <div className="px-8 py-6">
      <button
        onClick={() => navigate("/finanzas/pagos/cuentas/servicios")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a Servicios
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black" style={{ color: CHARCOAL }}>
              {name}
            </h2>
            <button
              onClick={() => toast.info("Exportación PDF no implementada aún")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ color: COLORS.ACCENT, backgroundColor: `${COLORS.ACCENT}15` }}
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              Exportar PDF
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoBadge icon={Money02Icon} label="Total esperado" value={`$${(total || 0).toLocaleString()}`} />
            <InfoBadge icon={CheckmarkCircle04Icon} label="Cobrado" value={`$${(cobrado || 0).toLocaleString()}`} />
            <InfoBadge icon={Clock01Icon} label="Pendiente" value={`$${(saldo || 0).toLocaleString()}`} />
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: BORDER }}
        >
          <div className="p-6 border-b" style={{ borderColor: BORDER }}>
            <h3 className="text-base font-black" style={{ color: CHARCOAL }}>
              Personas ({entries?.length || 0}) · ${(cobrado || 0).toLocaleString()} / ${(total || 0).toLocaleString()}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left [&_td]:border [&_th]:border [&_td]:border-[oklch(0.85_0_0)] [&_th]:border-[oklch(0.85_0_0)]">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                  <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 w-[36px] min-w-[36px] text-center" style={{ color: CHARCOAL }}>#</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: CHARCOAL }}>Persona</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: CHARCOAL }}>Total</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: CHARCOAL }}>Abonado</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: CHARCOAL }}>Saldo</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: CHARCOAL }}>Estado</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: CHARCOAL }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: BORDER }}>
                {(!entries || entries.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center opacity-40 text-sm" style={{ color: CHARCOAL }}>
                      Sin registros
                    </td>
                  </tr>
                ) : (
                  entries.map((entry: any, i: number) => {
                    const nombre = getNombrePersona(entry)
                    const montoTotal = Number(entry.monto_total || 0)
                    const montoAbonado = Number(entry.monto_abonado || 0)
                    const montoSaldo = Number(entry.saldo_pendiente || 0)
                    const pagado = montoSaldo <= 0
                    const esCuentaCobrar = entry._origen === "cuenta_cobrar"
                    const cuentaId = entry.cuenta_cobrar_id || (esCuentaCobrar ? entry.id : null)
                    const infoServicio = !cuentaId ? getInfoServicio(entry) : null

                    return (
                      <tr key={cuentaId || entry.id || `idx-${i}`} className="transition-colors" style={{ backgroundColor: i % 2 === 0 ? "transparent" : "oklch(0.97 0 0 / 0.5)" }}>
                        <td className="px-2 py-3 text-center text-xs opacity-40" style={{ color: CHARCOAL }}>{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold truncate max-w-[200px]" style={{ color: CHARCOAL }}>{nombre}</p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="text-xs font-bold" style={{ color: CHARCOAL }}>${montoTotal.toLocaleString()}</p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="text-xs font-bold text-green-600">${montoAbonado.toLocaleString()}</p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="text-xs font-bold" style={{ color: montoSaldo > 0 ? "#dc2626" : CHARCOAL }}>${montoSaldo.toLocaleString()}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold border",
                            pagado ? "bg-green-50 text-green-700 border-green-200"
                              : montoAbonado > 0 ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            <span className={cn("size-1.5 rounded-full shrink-0",
                              pagado ? "bg-green-500" : montoAbonado > 0 ? "bg-amber-500" : "bg-red-500"
                            )} />
                            {pagado ? "Pagado" : montoAbonado > 0 ? "Parcial" : "Pendiente"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {isAdmin && !pagado && (cuentaId || infoServicio) && (
                              <button
                                onClick={() => {
                                  if (cuentaId) {
                                    navigate(`/finanzas/pagos/cuentas/servicios/pago/${cuentaId}`, {
                                      state: { cuentaId, nombre, montoTotal, montoSaldo, nombreServicio: name },
                                    })
                                  } else if (infoServicio) {
                                    navigate(`/finanzas/pagos/cuentas/servicios/pago/${infoServicio.servicioId}`, {
                                      state: { tipo: infoServicio.tipo, servicioId: infoServicio.servicioId, nombre, montoTotal, montoSaldo, nombreServicio: name },
                                    })
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                                style={{ backgroundColor: COLORS.ACCENT }}
                              >
                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                Registrar cobro
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
