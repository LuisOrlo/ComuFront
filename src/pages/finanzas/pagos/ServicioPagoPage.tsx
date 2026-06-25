/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Money01Icon, UserIcon, UploadIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import api from "@/services/auth.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE

export function ServicioPagoPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as any

  const [monto, setMonto] = useState(state?.montoSaldo?.toString() || "0")
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [comprobanteUrl, setComprobanteUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!state?.cuentaId) return
    financeService.getTransacciones({ cuenta_cobrar_id: state.cuentaId, per_page: 50 })
      .then((res: any) => setTransacciones(res.data || []))
      .catch(() => {})
  }, [state?.cuentaId])

  if (!state?.cuentaId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-sm font-bold" style={{ color: CHARCOAL }}>No hay cuenta para este servicio</p>
        <p className="text-xs opacity-40 max-w-xs">Este servicio no tiene una cuenta por cobrar. Registra el pago desde el módulo del servicio.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97] text-white"
          style={{ backgroundColor: ACCENT }}
        >
          Volver
        </button>
      </div>
    )
  }

  const { cuentaId, nombre, montoTotal, montoSaldo, nombreServicio } = state

  const handleUploadComprobante = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error("Selecciona un archivo"); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const token = localStorage.getItem("auth_token")
      const res = await api.post("/finanzas/pagos-iniciales/comprobante", fd, {
        headers: { "Content-Type": "multipart/form-data", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      setComprobanteUrl(res.data.data?.url || res.data.url || "")
      toast.success("Comprobante subido")
    } catch {
      toast.error("Error al subir comprobante")
    } finally {
      setUploading(false)
    }
  }

  const handlePagar = async () => {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) { toast.error("Ingresa un monto válido"); return }
    if (montoNum > montoSaldo) { toast.error("El monto supera el saldo pendiente"); return }
    setSaving(true)
    try {
      await financeService.registrarPago({
        cuenta_cobrar_id: cuentaId,
        monto: montoNum,
        metodo_pago: metodoPago,
        comprobante_url: comprobanteUrl || null,
      })
      toast.success("Pago registrado exitosamente")
      setMonto("0")
      setComprobanteUrl("")
      financeService.getTransacciones({ cuenta_cobrar_id: cuentaId, per_page: 50 })
        .then((res: any) => setTransacciones(res.data || []))
        .catch(() => {})
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.mensaje || "Error al registrar pago")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-8 py-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-black/5 text-xs font-bold active:scale-[0.97]"
        style={{ color: COLORS.TEXT_MUTED }}
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
        Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border bg-white p-6 space-y-4" style={{ borderColor: BORDER }}>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Monto a pagar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold opacity-30">$</span>
                <input
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  min={0}
                  max={montoSaldo}
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 bg-gray-50/60 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                  style={{ borderColor: BORDER }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Método de pago</label>
              <select
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                style={{ borderColor: BORDER }}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia / Depósito</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Comprobante</label>
              <input
                type="file"
                ref={fileRef}
                accept="image/*,.pdf"
                className="hidden"
                onChange={() => handleUploadComprobante()}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 rounded-xl border-2 border-dashed text-xs font-bold transition-all hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ borderColor: BORDER, color: CHARCOAL }}
              >
                <HugeiconsIcon icon={UploadIcon} size={14} />
                {uploading ? "Subiendo..." : comprobanteUrl ? "Comprobante subido" : "Subir comprobante"}
              </button>
              {comprobanteUrl && (
                <p className="text-[10px] text-green-600 font-medium truncate">Subido correctamente</p>
              )}
            </div>

            <div className="py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 px-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Money01Icon} size={18} />
                <span className="text-sm font-bold">Total a pagar</span>
              </div>
              <span className="text-xl font-black">${parseFloat(monto || "0").toFixed(2)}</span>
            </div>

            <button
              onClick={handlePagar}
              disabled={saving || !monto || parseFloat(monto) <= 0}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-violet-500/20 active:scale-[0.97] disabled:opacity-40"
              style={{ backgroundColor: ACCENT }}
            >
              {saving ? "Registrando..." : "Registrar Pago"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 space-y-4 h-fit" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <HugeiconsIcon icon={UserIcon} size={18} style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{nombre || "Cliente"}</p>
              <p className="text-[10px] opacity-40">{nombreServicio || "Servicio"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50">
              <p className="text-[10px] opacity-40">Total</p>
              <p className="font-bold" style={{ color: CHARCOAL }}>${(montoTotal || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50">
              <p className="text-[10px] opacity-40">Saldo pendiente</p>
              <p className="font-bold text-red-600">${(montoSaldo || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {transacciones.length > 0 && (
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="px-5 py-3.5 border-b bg-gray-50/80" style={{ borderColor: BORDER }}>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Historial de pagos</span>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {transacciones.map((t: any) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Money01Icon} size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: CHARCOAL }}>${Number(t.monto || 0).toLocaleString()}</p>
                    <p className="text-[10px] opacity-40">{t.fecha_pago ? new Date(t.fecha_pago).toLocaleDateString("es-ES") : "—"} · {t.metodo_pago || "—"}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase px-2 py-1 rounded-full",
                  t.estado_verificacion === "aprobado" ? "bg-green-100 text-green-700" :
                  t.estado_verificacion === "rechazado" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                )}>
                  {t.estado_verificacion === "aprobado" ? "Verificado" :
                   t.estado_verificacion === "rechazado" ? "Rechazado" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
