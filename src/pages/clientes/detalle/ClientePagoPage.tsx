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
    <div className="min-h-[100dvh] overflow-y-auto bg-[#f8f9ff] text-[#0b1c30]">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
          
          <Link to={`/clientes/${clienteId}?tab=pagos`} className="inline-flex items-center gap-1.5 self-start py-1 text-xs font-bold text-[#73747b] transition-colors hover:text-[#fd761a] sm:self-auto">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={17} />
            Volver a pagos
          </Link>
        </div>

        <section className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between" style={{ border: `1px solid ${COLORS.BORDER_SUBTLE}` }}>
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#ffdbca] text-[#fd761a]"><HugeiconsIcon icon={Coins02Icon} size={25} /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: COLORS.CHARCOAL }}>Registrar pago</h1>
              <p className="mt-1 text-sm text-[#73747b]">{state?.concepto || "Aplicar un pago a la cuenta seleccionada del cliente."}</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-[#ffe4e6] px-3 py-1.5 text-[11px] font-bold text-[#be123c]">Saldo abierto</span>
        </section>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-xl bg-white p-6 shadow-sm" style={{ border: `1px solid ${COLORS.BORDER_SUBTLE}` }}>
            <div className="mb-6 border-b pb-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Información del pago</h2>
              <p className="mt-1 text-sm text-[#73747b]">Completa los datos para registrar la transacción.</p>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl bg-[#eff4ff] p-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#fd761a]">Monto a pagar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#73747b]">$</span>
                  <input type="number" min="0" step="0.01" max={saldoActual} value={monto} onChange={e => setMonto(e.target.value)} placeholder={`0.00 (máx. $${saldoActual.toLocaleString()})`} className="w-full rounded-lg border-2 border-[#d3e4fe] bg-white py-3.5 pl-10 pr-4 font-mono text-xl font-bold outline-none transition-colors focus:border-[#fd761a]" />
                </div>
                {montoNum > saldoActual && <p className="mt-2 text-xs font-semibold text-[#be123c]">El monto excede el saldo pendiente.</p>}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#73747b]">Método de pago</label>
                  <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className="min-h-[46px] w-full rounded-lg border bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-[#fd761a]" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#73747b]">Fecha de pago</label>
                  <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} className="min-h-[46px] w-full rounded-lg border bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-[#fd761a]" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#73747b]">Comprobante</label>
                <div onClick={() => fileInputRef.current?.click()} className="flex min-h-[92px] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#d3e4fe] bg-[#f8f9ff] p-4 transition-all hover:border-[#fd761a] hover:bg-[#eff4ff]">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {comprobantePreview ? <>
                    <img src={comprobantePreview} alt="Comprobante" className="size-16 rounded-xl border object-cover" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#45464d]">{comprobanteFile?.name}</p><p className="text-xs text-[#73747b]">Haz clic para cambiar el archivo</p></div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview(null) }} className="text-xs font-bold text-[#be123c] hover:underline">Quitar</button>
                  </> : <>
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e5eeff] text-[#fd761a]"><HugeiconsIcon icon={UploadIcon} size={20} /></div>
                    <div><p className="text-sm font-bold text-[#45464d]">Subir foto del comprobante</p><p className="mt-1 text-xs text-[#73747b]">Máximo 5MB, JPG o PNG</p></div>
                  </>}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <Link to={`/clientes/${clienteId}?tab=pagos`} className="flex min-h-[46px] items-center justify-center rounded-xl px-6 text-sm font-bold text-[#73747b] transition-colors hover:bg-[#eff4ff] hover:text-[#0b1c30]">Cancelar</Link>
              <button type="button" onClick={handlePagar} disabled={saving || montoNum <= 0} className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={Coins02Icon} size={17} />
                {saving ? "Registrando..." : montoNum > 0 ? `Pagar $${montoNum.toLocaleString()}` : "Registrar pago"}
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl bg-white p-6 shadow-sm" style={{ border: `1px solid ${COLORS.BORDER_SUBTLE}` }}>
              <h2 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>Resumen de la cuenta</h2>
              <div className="mt-4 space-y-4">
                <div><span className="text-[10px] font-bold uppercase tracking-wider text-[#73747b]">Total de la cuenta</span><p className="mt-1 text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>${(state?.montoTotal ?? 0).toLocaleString()}</p></div>
                <div className="border-t pt-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}><span className="text-[10px] font-bold uppercase tracking-wider text-[#73747b]">Saldo pendiente</span><p className="mt-1 text-2xl font-bold text-[#be123c]">${saldoActual.toLocaleString()}</p></div>
              </div>
            </div>
            <div className="rounded-xl bg-[#eff4ff] p-5">
              <p className="text-xs leading-5 text-[#45464d]">El pago se aplicará a la cuenta del servicio seleccionado. Verifica el monto y la fecha antes de confirmar.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
