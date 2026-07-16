import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, CheckmarkCircle01Icon, Cancel01Icon, TimeHalfPassIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { clientesService } from "@/services/clientes.service"
import { toast } from "sonner"

interface PagosRealizadosProps {
  clienteId: string
}

const estadoConfig: Record<string, { icon: typeof CreditCardIcon; color: string; bg: string; label: string }> = {
  pagado: { icon: CheckmarkCircle01Icon, color: "oklch(0.55 0.18 160)", bg: "oklch(0.95 0.02 160)", label: "Pagado" },
  abonado: { icon: TimeHalfPassIcon, color: "oklch(0.55 0.18 80)", bg: "oklch(0.95 0.02 80)", label: "Abonado" },
  pendiente: { icon: Cancel01Icon, color: "oklch(0.55 0.18 30)", bg: "oklch(0.95 0.02 30)", label: "Pendiente" },
}

export function PagosRealizados({ clienteId }: PagosRealizadosProps) {
  const [cuentas, setCuentas] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientesService.getClienteFinancial(clienteId).then(setCuentas).catch(() => {
      toast.error("Error al cargar informaci\u00f3n financiera")
    }).finally(() => setLoading(false))
  }, [clienteId])

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
        {cuentas.map((cuenta) => {
          const estado = String(cuenta.estado || "pendiente")
          const cfg = estadoConfig[estado] || estadoConfig.pendiente
          const Icon = cfg.icon
          const total = Number(cuenta.monto_total) || 0
          const abonado = Number(cuenta.monto_abonado) || 0
          const saldo = total - abonado
          const transacciones = (cuenta.transacciones as Array<Record<string, unknown>>) || []

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
                      {cuenta.tipo ? String(cuenta.tipo) : "Servicio"}
                    </p>
                    <p className="text-[10px] opacity-40">
                      {cuenta.created_at ? new Date(String(cuenta.created_at)).toLocaleDateString("es-ES") : ""}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
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
    </div>
  )
}
