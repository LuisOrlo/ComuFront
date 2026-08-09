import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, CheckmarkCircle01Icon, Cancel01Icon, TimeHalfPassIcon, PaymentIcon, FileAttachmentIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { getStorageUrl } from "@/lib/utils"
import { clientesService } from "@/services/clientes.service"
import { toast } from "sonner"
import { formatReservaTitle, formatReservaDate } from "./servicioFormat"

interface PagosRealizadosProps {
  clienteId: string
}

const estadoConfig: Record<string, { icon: typeof CreditCardIcon; color: string; bg: string; label: string }> = {
  pagado: { icon: CheckmarkCircle01Icon, color: "oklch(0.55 0.18 160)", bg: "oklch(0.95 0.02 160)", label: "Pagado" },
  abonado: { icon: TimeHalfPassIcon, color: "oklch(0.55 0.18 80)", bg: "oklch(0.95 0.02 80)", label: "Abonado" },
  pendiente: { icon: Cancel01Icon, color: "oklch(0.55 0.18 30)", bg: "oklch(0.95 0.02 30)", label: "Pendiente" },
}

const PAGOS_POR_PAGINA = 5

const TIPO_LABELS: Record<string, string> = {
  radio: "Radio",
  aulas: "Aulas",
  podcast: "Podcast",
  equipos: "Equipos",
  edicion: "Edición de Video",
}

function getServicioKey(cuenta: Record<string, unknown>): string | null {
  if (cuenta.reserva_radio_id) return "radio"
  if (cuenta.reserva_aula_id) return "aulas"
  if (cuenta.reserva_podcast_id) return "podcast"
  if (cuenta.alquiler_equipo_id) return "equipos"
  if (cuenta.edicion_video_id) return "edicion"
  return null
}

function getServicioItem(key: string, cuenta: Record<string, unknown>): Record<string, unknown> | null {
  const item = { radio: cuenta.reserva_radio, aulas: cuenta.reserva_aula, podcast: cuenta.reserva_podcast, equipos: cuenta.alquiler_equipo, edicion: cuenta.edicion_video }[key]
  return item && typeof item === "object" ? (item as Record<string, unknown>) : null
}

function getServicioNombre(cuenta: Record<string, unknown>): string {
  const key = getServicioKey(cuenta)
  if (!key) return ""
  const item = getServicioItem(key, cuenta)
  if (!item) return ""
  return formatReservaTitle(key, item)
}

function getTipoLabel(cuenta: Record<string, unknown>): string {
  const key = getServicioKey(cuenta)
  return key ? TIPO_LABELS[key] : String(cuenta.tipo || "")
}

export function PagosRealizados({ clienteId }: PagosRealizadosProps) {
  const navigate = useNavigate()
  const [cuentas, setCuentas] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)

  useEffect(() => {
    clientesService.getClienteFinancial(clienteId).then(setCuentas).catch(() => {
      toast.error("Error al cargar informaci\u00f3n financiera")
    }).finally(() => setLoading(false))
  }, [clienteId])

  useEffect(() => {
    setPaginaActual(1)
  }, [cuentas])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />)}
      </div>
    )
  }

  if (cuentas.length === 0) {
    return (
      <div className="text-center py-12">
        <HugeiconsIcon icon={CreditCardIcon} size={40} className="opacity-20 mx-auto mb-3" />
        <p className="text-sm font-bold opacity-40">No hay registros financieros</p>
      </div>
    )
  }

  const totalPendiente = cuentas
    .filter(c => c.estado !== "pagado")
    .reduce((sum, c) => sum + (Number(c.monto_total) - Number(c.monto_abonado || 0)), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-lg border" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.98 0 0)" }}>
        <div className="flex items-center gap-2 text-sm">
          <span className="opacity-50">Total cuentas:</span>
          <span className="font-bold">{cuentas.length}</span>
        </div>
        <div className="w-px h-6" style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
        <div className="flex items-center gap-2 text-sm">
          <span className="opacity-50">Saldo pendiente:</span>
          <span className="font-bold" style={{ color: totalPendiente > 0 ? "oklch(0.55 0.18 30)" : "oklch(0.55 0.18 160)" }}>
            ${totalPendiente.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {cuentas.slice((paginaActual - 1) * PAGOS_POR_PAGINA, paginaActual * PAGOS_POR_PAGINA).map((cuenta) => {
          const estado = String(cuenta.estado || "pendiente")
          const cfg = estadoConfig[estado] || estadoConfig.pendiente
          const Icon = cfg.icon
          const total = Number(cuenta.monto_total) || 0
          const abonado = Number(cuenta.monto_abonado) || 0
          const saldo = total - abonado
          const transacciones = (cuenta.transacciones as Array<Record<string, unknown>>) || []
          const nombreServicio = getServicioNombre(cuenta)
          const tipoLabel = getTipoLabel(cuenta)
          const concepto = nombreServicio || tipoLabel || "Servicio"
          const servicioKey = getServicioKey(cuenta)
          const reserva = servicioKey ? getServicioItem(servicioKey, cuenta) : null
          const fechaReserva = reserva
            ? formatReservaDate(servicioKey!, reserva)
            : (cuenta.created_at ? new Date(String(cuenta.created_at)).toLocaleDateString("es-ES") : "")

          return (
            <div key={String(cuenta.id)}
              className="rounded-lg border p-4 space-y-3"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                    <HugeiconsIcon icon={Icon} size={14} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
                      {[tipoLabel, nombreServicio].filter(Boolean).join(" · ") || String(cuenta.tipo || "Servicio")}
                    </p>
                    <p className="text-[10px] opacity-40">
                      {fechaReserva}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {saldo > 0 && (
                    <button onClick={() => navigate(`/clientes/${clienteId}/pagar/${cuenta.id}`, {
                      state: { montoSaldo: saldo, montoTotal: total, concepto }
                    })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors hover:bg-gray-100"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                      <HugeiconsIcon icon={PaymentIcon} size={12} />
                      Pagar
                    </button>
                  )}
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span>Total: <strong>${total.toFixed(2)}</strong></span>
                {abonado > 0 && <span>Abonado: <strong>${abonado.toFixed(2)}</strong></span>}
                {saldo > 0 && <span style={{ color: "oklch(0.55 0.18 30)" }}>Saldo: <strong>${saldo.toFixed(2)}</strong></span>}
              </div>

              {transacciones.length > 0 && (
                <div className="pt-2 border-t space-y-1.5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-30">Transacciones</p>
                  {transacciones.map((tx: Record<string, unknown>, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="opacity-50">{tx.created_at ? new Date(String(tx.created_at)).toLocaleDateString("es-ES") : ""}</span>
                        <span className="font-medium">{String(tx.metodo_pago || tx.tipo_pago || "")}</span>
      {imagenExpandida && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setImagenExpandida(null)}>
          <button onClick={(e) => { e.stopPropagation(); setImagenExpandida(null) }}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-sm font-bold transition-colors">
            Cerrar [X]
          </button>
          <img src={imagenExpandida} alt="Comprobante"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
                      <span className="font-bold">${Number(tx.monto || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {(() => {
        const totalPaginas = Math.max(1, Math.ceil(cuentas.length / PAGOS_POR_PAGINA))
        if (totalPaginas <= 1) return null
        return (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              Anterior
            </button>
            <span className="text-xs font-medium opacity-50">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              Siguiente
            </button>
          </div>
        )
      })()}

      {(() => {
        const allTransacciones = cuentas.flatMap(c => {
          const txs = (c.transacciones as Array<Record<string, unknown>>) || []
          const concepto = getServicioNombre(c) || String(c.concepto || c.tipo || "Servicio")
          return txs.map(tx => ({ ...tx, cuentaConcepto: concepto } as Record<string, unknown>))
        }).sort((a, b) => {
          const da = new Date(String(a.fecha_pago || 0)).getTime()
          const db = new Date(String(b.fecha_pago || 0)).getTime()
          if (da !== db) return db - da
          return String(b.id).localeCompare(String(a.id))
        })

        if (allTransacciones.length === 0) return null

        return (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3" style={{ color: COLORS.CHARCOAL }}>
              Historial de pagos ({allTransacciones.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase w-28">Fecha</th>
                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase">Concepto</th>
                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase w-28">Mtodo</th>
                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-right w-24">Monto</th>
                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase w-14">Comp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allTransacciones.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {tx.fecha_pago ? new Date(String(tx.fecha_pago)).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-700 truncate max-w-48">{String(tx["cuentaConcepto"] ?? "—")}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap capitalize">{String(tx.metodo_pago || tx.tipo_pago || "—")}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600 text-xs whitespace-nowrap">${Number(tx.monto || 0).toFixed(2)}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {tx.comprobante_url ? (
                          <button onClick={() => setImagenExpandida(getStorageUrl(String(tx.comprobante_url)))}
                            className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline"
                            style={{ color: COLORS.ACCENT }}>
                            <HugeiconsIcon icon={FileAttachmentIcon} size={11} /> Ver
                          </button>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
