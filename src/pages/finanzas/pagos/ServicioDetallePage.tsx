/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLocation, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, UserIcon, AiFolderIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { HealthBar } from "./sections/HealthBar"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function getNombrePersona(entry: any): string {
  if (entry.persona_nombre) return entry.persona_nombre
  const p = entry.persona
  if (p) return `${p.nombres || ""} ${p.apellidos || ""}`.trim()
  const ce = entry.cliente_externo
  if (ce) return `${ce.nombres || ""} ${ce.apellidos || ""}`.trim()
  return "—"
}

export function ServicioDetallePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as any

  if (!state) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm opacity-40">Sin datos de servicio</p>
      </div>
    )
  }

  const { entries, name, total, cobrado, saldo } = state

  return (
    <div className="px-8 py-6 space-y-4">
      <button
        onClick={() => navigate("/finanzas/pagos/cuentas/servicios")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-black/5 text-xs font-bold active:scale-[0.97]"
        style={{ color: MUTED }}
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
        Volver a Servicios
      </button>

      <div className="rounded-2xl border bg-white p-5 space-y-3" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={AiFolderIcon} size={22} style={{ color: "#7c3aed" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{name}</h2>
            <p className="text-xs opacity-40">{entries?.length || 0} persona{(entries?.length || 0) !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <HealthBar recaudado={cobrado} total={total} />

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] opacity-40">Total</p>
            <p className="font-bold" style={{ color: CHARCOAL }}>${(total || 0).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] opacity-40">Cobrado</p>
            <p className="font-bold text-green-600">${(cobrado || 0).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] opacity-40">Pendiente</p>
            <p className="font-bold text-red-600">${(saldo || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-b from-gray-50 to-gray-100/80">
                {["Persona", "Total", "Abonado", "Saldo", "Estado", "Acción"].map((h, i) => (
                  <th key={i} className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 border-r last:border-0" style={{ borderColor: BORDER }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: BORDER }}>
              {(!entries || entries.length === 0) ? (
                <tr><td colSpan={6} className="p-12 text-center text-xs opacity-40">Sin registros</td></tr>
              ) : (
                entries.map((entry: any) => {
                  const nombre = getNombrePersona(entry)
                  const montoTotal = Number(entry.monto_total || 0)
                  const montoAbonado = Number(entry.monto_abonado || 0)
                  const montoSaldo = Number(entry.saldo_pendiente || 0)
                  const pagado = montoSaldo <= 0
                  const tieneCuenta = !!entry.cuenta_cobrar_id || entry._origen === "cuenta_cobrar" || !!entry.id?.startsWith?.("lpm-") === false

                  return (
                    <tr key={entry.id || Math.random()} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3 border-r" style={{ borderColor: BORDER }}>
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={UserIcon} size={12} className="opacity-40" />
                          </div>
                          <span className="text-xs font-semibold truncate max-w-[140px]" style={{ color: CHARCOAL }}>
                            {nombre}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 border-r text-xs font-medium" style={{ borderColor: BORDER, color: CHARCOAL }}>
                        ${montoTotal.toLocaleString()}
                      </td>
                      <td className="p-3 border-r text-xs font-medium text-green-600" style={{ borderColor: BORDER }}>
                        ${montoAbonado.toLocaleString()}
                      </td>
                      <td className="p-3 border-r text-xs font-medium" style={{ borderColor: BORDER, color: montoSaldo > 0 ? "#dc2626" : undefined }}>
                        ${montoSaldo.toLocaleString()}
                      </td>
                      <td className="p-3 border-r" style={{ borderColor: BORDER }}>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider",
                          pagado ? "bg-green-100 text-green-700" : montoAbonado > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>
                          {pagado ? "Pagado" : montoAbonado > 0 ? "Parcial" : "Pendiente"}
                        </span>
                      </td>
                      <td className="p-3">
                        {!pagado && tieneCuenta ? (
                          <button
                            onClick={() => {
                              const cuentaId = entry.cuenta_cobrar_id || entry.id
                              navigate(`/finanzas/pagos/cuentas/servicios/pago/${cuentaId}`, {
                                state: { cuentaId, nombre, montoTotal, montoAbonado, montoSaldo, nombreServicio: name },
                              })
                            }}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
                            style={{ backgroundColor: ACCENT }}
                          >
                            Registrar cobro
                          </button>
                        ) : pagado ? (
                          <span className="text-[10px] font-bold text-green-600">Completo</span>
                        ) : (
                          <span className="text-[10px] opacity-40">Sin cuenta</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
