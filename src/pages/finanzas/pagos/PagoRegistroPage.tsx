/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Coins01Icon,
  SaveIcon,
  Calendar03Icon,
  Note01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { Upload } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router"

export function PagoRegistroPage() {
  const { cuentaId } = useParams<{ cuentaId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<any>(null)
  const [transacciones, setTransacciones] = useState<any[]>([])

  const [form, setForm] = useState({
    monto: "",
    metodo_pago: "transferencia",
    fecha_pago: new Date().toISOString().split('T')[0],
    observaciones: "",
    comprobante_url: ""
  })

  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState("")
  const [comprobanteVisible, setComprobanteVisible] = useState<Record<string, boolean>>({})
  const [modalImage, setModalImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDetalle = async () => {
    if (!cuentaId) return
    try {
      const res = await financeService.getCuentaDetalle(cuentaId)
      setData(res.datos)
      const txs = res.transacciones || res.datos?.transacciones || []
      setTransacciones(txs)
      const saldo = Number(res.datos.monto_total) - Number(res.datos.monto_abonado)
      setForm(prev => ({ ...prev, monto: saldo.toString() }))
    } catch {
      toast.error("Error al cargar detalles")
      navigate("/finanzas/pagos/cuentas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetalle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuentaId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes")
      return
    }
    setComprobanteFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setComprobantePreview(result)
      setForm(prev => ({ ...prev, comprobante_url: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cuentaId) return
    setSaving(true)
    try {
      await financeService.registrarPago({
        cuenta_cobrar_id: cuentaId,
        ...form,
        monto: parseFloat(form.monto)
      })
      toast.success("Pago registrado correctamente")
      await loadDetalle()
    } catch (err: any) {
      toast.error(err.response?.data?.mensaje || "Error al registrar pago")
    } finally {
      setSaving(false)
    }
  }

  const badgeEstado = (estado: string) => {
    if (estado === "aprobado")  return "bg-green-100 text-green-700"
    if (estado === "rechazado") return "bg-red-100 text-red-700"
    return "bg-amber-100 text-amber-700"
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50/30">
        <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>Finanzas</div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>Registrar Pago</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center text-sm opacity-40 py-20">Cargando información de pago...</div>
      </div>
    )
  }

  if (!data) return null

  const saldo = data.monto_total - data.monto_abonado
  const isFullyPaid = saldo <= 0

  return (
    <div className="flex flex-col min-h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              <button onClick={() => navigate("/finanzas/pagos")} className="hover:underline">Finanzas</button>
              <span className="size-1 rounded-full bg-current opacity-50" />
              <button onClick={() => navigate("/finanzas/pagos/cuentas")} className="hover:underline">Cuentas por cobrar</button>
              <span className="size-1 rounded-full bg-current opacity-50" />
              Registrar pago
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Registrar Pago / Abono
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 pb-8 pt-6 overflow-auto">
        <div className="max-w-5xl">
          <button
            onClick={() => navigate("/finanzas/pagos/cuentas")}
            className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-6"
            style={{ color: COLORS.CHARCOAL }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            Volver a Cuentas
          </button>

          {isFullyPaid && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-5 mb-6 flex items-start gap-4"
              style={{ borderColor: "oklch(0.55 0.15 150 / 0.3)", backgroundColor: "oklch(0.55 0.15 150 / 0.06)" }}
            >
              <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.55 0.15 150 / 0.15)" }}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} style={{ color: "oklch(0.45 0.15 150)" }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "oklch(0.35 0.15 150)" }}>Cuenta totalmente pagada</h3>
                <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.1 150)" }}>
                  Esta cuenta no tiene saldo pendiente. El monto total de ${Number(data.monto_total).toLocaleString()} ha sido cubierto.
                </p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border bg-white p-8"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-40" style={{ color: COLORS.CHARCOAL }}>Monto a Pagar</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black opacity-40" style={{ color: COLORS.CHARCOAL }}>$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={form.monto}
                          onChange={e => setForm({...form, monto: e.target.value})}
                          className="w-full pl-8 pr-4 py-4 rounded-2xl outline-none transition-all font-black text-xl"
                          style={{ backgroundColor: isFullyPaid ? "oklch(0.93 0 0)" : "oklch(0.97 0 0)", color: COLORS.ACCENT }}
                          placeholder="0.00"
                          required
                          disabled={isFullyPaid}
                        />
                      </div>
                      <p className="text-[10px] ml-1">
                        <span className="opacity-40">Saldo pendiente: </span>
                        <span className={cn("font-bold", isFullyPaid ? "text-green-600" : "text-red-500")}>
                          ${saldo.toFixed(2)}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-40" style={{ color: COLORS.CHARCOAL }}>Método de Pago</label>
                      <select
                        value={form.metodo_pago}
                        onChange={e => setForm({...form, metodo_pago: e.target.value})}
                        disabled={isFullyPaid}
                        className="w-full px-4 py-4 rounded-2xl outline-none transition-all font-bold"
                        style={{ backgroundColor: isFullyPaid ? "oklch(0.93 0 0)" : "oklch(0.97 0 0)" }}
                      >
                        <option value="transferencia">Transferencia</option>
                        <option value="deposito">Depósito</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-40" style={{ color: COLORS.CHARCOAL }}>Fecha de Pago</label>
                      <div className="relative">
                        <HugeiconsIcon icon={Calendar03Icon} size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: COLORS.CHARCOAL }} />
                        <input
                          type="date"
                          value={form.fecha_pago}
                          onChange={e => setForm({...form, fecha_pago: e.target.value})}
                          disabled={isFullyPaid}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all font-bold"
                          style={{ backgroundColor: isFullyPaid ? "oklch(0.93 0 0)" : "oklch(0.97 0 0)" }}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-40" style={{ color: COLORS.CHARCOAL }}>Comprobante (imagen)</label>
                      <div
                        onClick={() => !isFullyPaid && fileInputRef.current?.click()}
                        className="relative flex flex-col items-center justify-center w-full py-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                        style={{
                          backgroundColor: isFullyPaid ? "oklch(0.93 0 0)" : "oklch(0.97 0 0)",
                          borderColor: isFullyPaid ? COLORS.BORDER_SUBTLE : "oklch(0.85 0 0)",
                        }}
                      >
                        {comprobantePreview ? (
                          <img src={comprobantePreview} alt="Comprobante" className="max-h-32 rounded-xl object-contain" />
                        ) : (
                          <>
                            <Upload size={28} className="mb-1" style={{ color: COLORS.TEXT_MUTED }} />
                            <span className="text-xs font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>Haz clic para seleccionar imagen</span>
                          </>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={isFullyPaid}
                        />
                      </div>
                      {comprobanteFile && (
                        <p className="text-[10px] opacity-40 ml-1">{comprobanteFile.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-40" style={{ color: COLORS.CHARCOAL }}>Observaciones Internas</label>
                    <div className="relative">
                      <HugeiconsIcon icon={Note01Icon} size={18} className="absolute left-4 top-4 opacity-40" style={{ color: COLORS.CHARCOAL }} />
                      <textarea
                        value={form.observaciones}
                        onChange={e => setForm({...form, observaciones: e.target.value})}
                        disabled={isFullyPaid}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all text-sm min-h-[100px]"
                        style={{ backgroundColor: isFullyPaid ? "oklch(0.93 0 0)" : "oklch(0.97 0 0)" }}
                        placeholder="Detalles adicionales del movimiento..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || isFullyPaid}
                    className="w-full py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-40 text-white"
                    style={{
                      backgroundColor: isFullyPaid ? COLORS.TEXT_MUTED : COLORS.ACCENT,
                      boxShadow: isFullyPaid ? "none" : `0 20px 60px -12px ${COLORS.ACCENT}40`,
                    }}
                  >
                    {saving ? (
                      "Procesando..."
                    ) : isFullyPaid ? (
                      <>
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} />
                        Cuenta Liquidada
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={SaveIcon} size={24} />
                        Confirmar Registro
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-8 text-white"
                style={{ backgroundColor: COLORS.CHARCOAL }}
              >
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <HugeiconsIcon icon={Coins01Icon} size={20} style={{ color: "oklch(0.65 0.2 45 / 0.6)" }} />
                  Estado de Deuda
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase opacity-40">Monto Total</span>
                    <span className="text-xl font-black">${data.monto_total}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase opacity-40">Total Abonado</span>
                    <span className="text-xl font-black" style={{ color: "oklch(0.55 0.15 150)" }}>${data.monto_abonado}</span>
                  </div>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase opacity-40">Saldo Restante</span>
                    <span className={cn("text-3xl font-black", isFullyPaid ? "text-green-400" : "")} style={{ color: isFullyPaid ? undefined : "oklch(0.65 0.2 45 / 0.8)" }}>
                      ${saldo.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border bg-white p-8"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <h3 className="text-lg font-black mb-6 flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
                  <HugeiconsIcon icon={Coins01Icon} size={20} style={{ color: COLORS.ACCENT }} />
                  Pagos Realizados
                  {transacciones.length > 0 && (
                    <span className="ml-auto text-sm font-bold opacity-40">({transacciones.length})</span>
                  )}
                </h3>
                <div className="space-y-6">
                  {transacciones.length === 0 ? (
                    <p className="text-center text-sm opacity-40 py-8">No hay movimientos previos</p>
                  ) : (
                    transacciones.map((t: any) => (
                      <div key={t.id} className="relative pl-6 pb-2" style={{ borderLeft: `2px solid ${COLORS.BORDER_SUBTLE}` }}>
                        <div className={cn(
                          "absolute -left-[9px] top-0 size-4 rounded-full border-4 border-white",
                          t.estado_verificacion === 'aprobado' ? 'bg-green-400' :
                          t.estado_verificacion === 'rechazado' ? 'bg-red-400' : 'bg-amber-400'
                        )} />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>${t.monto}</p>
                            <p className="text-[10px] font-bold uppercase opacity-40">{new Date(t.fecha_pago).toLocaleDateString()}</p>
                            <p className="text-[10px] mt-1 capitalize opacity-40">{t.metodo_pago}</p>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase", badgeEstado(t.estado_verificacion))}>
                            {t.estado_verificacion}
                          </span>
                        </div>
                        {t.comprobante_url ? (
                          <div className="mt-2">
                            <button
                              onClick={() => setComprobanteVisible(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                              className="inline-flex items-center gap-1 text-[10px] font-bold transition-colors"
                              style={{ color: COLORS.ACCENT }}
                            >
                              {comprobanteVisible[t.id] ? "Ocultar comprobante" : "Ver comprobante"}
                            </button>
                            {comprobanteVisible[t.id] && (
                              <div className="mt-2 p-2 rounded-xl border" style={{ backgroundColor: "oklch(0.97 0 0)", borderColor: COLORS.BORDER_SUBTLE }}>
                                <img
                                  src={t.comprobante_url}
                                  alt="Comprobante de pago"
                                  className="max-h-48 rounded-lg object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setModalImage(t.comprobante_url)}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-[9px] italic opacity-30">Sin comprobante adjunto</p>
                        )}
                        {t.observaciones && (
                          <p className="text-[10px] mt-1 italic opacity-40">{t.observaciones}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
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
