import { useState, useRef } from "react"
import { useNavigate, useParams, useLocation, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, UploadIcon, Coins02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import api from "@/services/auth.service"

export function ClientePagoPage() {
  const { clienteId, cuentaId } = useParams<{ clienteId: string; cuentaId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { montoSaldo?: number; montoTotal?: number; concepto?: string } | null

  const [monto, setMonto] = useState(state?.montoSaldo ? String(state.montoSaldo) : "")
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [fechaPago, setFechaPago] = useState(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date()))
  const [saving, setSaving] = useState(false)
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const saldoActual = state?.montoSaldo ?? 0
  const montoNum = parseFloat(monto || "0")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("El archivo no debe superar los 5MB"); return }
    setComprobanteFile(file)
    setComprobantePreview(URL.createObjectURL(file))
  }

  const handlePagar = async () => {
    if (!montoNum || montoNum <= 0) { toast.error("Ingresa un monto vlido"); return }
    if (montoNum > saldoActual) { toast.error("El monto supera el saldo pendiente"); return }
    setSaving(true)
    try {
      let comprobanteUrl = ""
      if (comprobanteFile) {
        const fd = new FormData()
        fd.append("archivo", comprobanteFile)
        const token = localStorage.getItem("auth_token")
        const res = await api.post("/finanzas/pagos-iniciales/comprobante", fd, {
          headers: { "Content-Type": "multipart/form-data", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        comprobanteUrl = res.data.data?.url || res.data.url || ""
      }
      await financeService.registrarPago({
        cuenta_cobrar_id: cuentaId!,
        monto: montoNum,
        metodo_pago: metodoPago,
        comprobante_url: comprobanteUrl || null,
        fecha_pago: fechaPago,
      })
      toast.success("Pago registrado exitosamente")
      navigate(`/clientes/${clienteId}?tab=pagos`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; mensaje?: string } } }
      toast.error(e?.response?.data?.mensaje || e?.response?.data?.message || "Error al registrar pago")
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50/50">
      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[640px] mx-auto px-4 py-3">
          <Link to={`/clientes/${clienteId}?tab=pagos`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            Volver al perfil del cliente
          </Link>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-4 py-6">
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h2 className="text-lg font-black text-gray-900">Registrar Pago</h2>
            {state?.concepto && <p className="text-sm text-gray-500 mt-0.5">{state.concepto}</p>}
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Saldo pendiente</span>
                <p className="text-xl font-black text-red-500 mt-0.5">${saldoActual.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total cuenta</span>
                <p className="text-xl font-black text-gray-900 mt-0.5">${(state?.montoTotal ?? 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50/40 space-y-3">
              <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Monto a pagar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                <input type="number" min="0" step="0.01" max={saldoActual}
                  value={monto} onChange={e => setMonto(e.target.value)}
                  placeholder={`0.00 (mx $${saldoActual.toLocaleString()})`}
                  className="w-full pl-10 pr-4 py-3.5 min-h-[44px] border-2 border-blue-200 rounded-2xl text-lg font-black font-mono outline-none focus:border-blue-500 bg-white" />
              </div>
              {montoNum > saldoActual && (
                <p className="text-xs text-red-500 font-medium">El monto excede el saldo pendiente</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Método de pago</label>
              <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                className="w-full px-4 py-3 min-h-[44px] border border-gray-200 rounded-2xl text-sm outline-none bg-white">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Fecha de pago</label>
              <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)}
                className="w-full px-4 py-3 min-h-[44px] border border-gray-200 rounded-2xl text-sm outline-none bg-white" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Comprobante</label>
              <div onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 p-4 min-h-[44px] border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {comprobantePreview ? (
                  <>
                    <img src={comprobantePreview} alt="Comprobante" className="size-14 rounded-xl object-cover border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{comprobanteFile?.name}</p>
                      <p className="text-xs text-gray-400">Toca para cambiar</p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview(null) }}
                      className="text-xs font-bold text-red-400 hover:text-red-600">Quitar</button>
                  </>
                ) : (
                  <>
                    <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={UploadIcon} size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600">Subir foto del comprobante</p>
                      <p className="text-xs text-gray-400">Mximo 5MB, JPG o PNG</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <Link to={`/clientes/${clienteId}?tab=pagos`}
                className="flex items-center justify-center px-6 py-3 min-h-[44px] rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                Cancelar
              </Link>
              <button type="button" onClick={handlePagar} disabled={saving || montoNum <= 0}
                className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={Coins02Icon} size={16} />
                {saving ? "Registrando..." : montoNum > 0 ? `Pagar $${montoNum.toLocaleString()}` : "Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
