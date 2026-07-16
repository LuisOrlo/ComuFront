/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "motion/react"
import { useLocation, useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  AiFolderIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-100 to-fuchsia-100">
                <HugeiconsIcon icon={AiFolderIcon} size={22} style={{ color: ACCENT }} />
              </div>
              <div>
                <h2 className="text-xl font-black" style={{ color: CHARCOAL }}>{name}</h2>
                <p className="text-xs opacity-40">{entries?.length || 0} persona{(entries?.length || 0) !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <button
              onClick={() => toast.info("Exportación PDF no implementada aún")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              Exportar PDF
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 space-y-1 border-l-4 border-gray-300">
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Total</p>
              <p className="text-lg font-black" style={{ color: CHARCOAL }}>${(total || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/80 space-y-1 border-l-4 border-green-500">
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cobrado</p>
              <p className="text-lg font-black text-green-700">${(cobrado || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/80 space-y-1 border-l-4 border-red-500">
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Pendiente</p>
              <p className="text-lg font-black text-red-700">${(saldo || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white overflow-hidden shadow-sm"
          style={{ borderColor: BORDER }}
        >
          <div className="p-6 border-b" style={{ borderColor: BORDER }}>
            <h3 className="text-base font-black" style={{ color: CHARCOAL }}>
              Personas ({entries?.length || 0})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100/70">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: CHARCOAL }}>Persona</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: CHARCOAL }}>Total</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: CHARCOAL }}>Abonado</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: CHARCOAL }}>Saldo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: CHARCOAL }}>Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-50 text-right" style={{ color: CHARCOAL }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: BORDER }}>
                {(!entries || entries.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center opacity-40 text-sm" style={{ color: CHARCOAL }}>
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
                      <tr key={cuentaId || entry.id || `idx-${i}`} className={cn("transition-colors hover:bg-gray-50/60", i % 2 === 0 ? "bg-white" : "bg-gray-50/20")}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={UserIcon} size={14} className="opacity-50" style={{ color: CHARCOAL }} />
                            </div>
                            <span className="text-sm font-bold truncate max-w-[200px]" style={{ color: CHARCOAL }}>
                              {nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold" style={{ color: CHARCOAL }}>${montoTotal.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-green-700">${montoAbonado.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold" style={{ color: montoSaldo > 0 ? "#dc2626" : CHARCOAL }}>${montoSaldo.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold border",
                            pagado
                              ? "bg-gradient-to-r from-green-50 to-green-100/80 text-green-700 border-green-200"
                              : montoAbonado > 0
                                ? "bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-700 border-amber-200"
                                : "bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 border-red-200"
                          )}>
                            <span className={cn(
                              "size-1.5 rounded-full shrink-0",
                              pagado ? "bg-green-500" : montoAbonado > 0 ? "bg-amber-500" : "bg-red-500"
                            )} />
                            {pagado ? "Pagado" : montoAbonado > 0 ? "Parcial" : "Pendiente"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {pagado ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-green-50 to-green-100/80 text-green-700 border border-green-200">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                                Pagado completo
                              </span>
                            ) : isAdmin && (cuentaId || infoServicio) ? (
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
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
                                style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}
                              >
                                Registrar cobro
                                <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                              </button>
                            ) : null}
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
