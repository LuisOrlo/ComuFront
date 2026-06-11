import { useState, useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  ArrowLeft01Icon, 
  Coins01Icon, 
  SaveIcon,
  Calendar03Icon,
  Note01Icon
} from "@hugeicons/core-free-icons"
import { Upload } from "lucide-react"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

interface FinancePagoRegistroProps {
  cuentaId: string
  onBack: () => void
  onSuccess: () => void
}

export function FinancePagoRegistro({ cuentaId, onBack, onSuccess }: FinancePagoRegistroProps) {
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
  const [comprobantePreview, setComprobantePreview] = useState<string>("")
  const [comprobanteVisible, setComprobanteVisible] = useState<Record<string, boolean>>({})
  const [modalImage, setModalImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDetalle()
  }, [cuentaId])

  const loadDetalle = async () => {
    try {
      const res = await financeService.getCuentaDetalle(cuentaId)
      setData(res.datos)
      const txs = res.transacciones || res.datos?.transacciones || []
      setTransacciones(txs)
      const saldo = Number(res.datos.monto_total) - Number(res.datos.monto_abonado)
      setForm(prev => ({ ...prev, monto: saldo.toString() }))
    } catch {
      toast.error("Error al cargar detalles")
      onBack()
    } finally {
      setLoading(false)
    }
  }

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
    setSaving(true)
    try {
      await financeService.registrarPago({
        cuenta_cobrar_id: cuentaId,
        ...form,
        monto: parseFloat(form.monto)
      })
      toast.success("Pago registrado correctamente")
      await loadDetalle()
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.mensaje || "Error al registrar pago")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center text-gray-400 font-medium">Cargando información de pago...</div>

  const saldo = data.monto_total - data.monto_abonado

  const badgeEstado = (estado: string) => {
    if (estado === "aprobado")  return "bg-green-100 text-green-700"
    if (estado === "rechazado") return "bg-red-100 text-red-700"
    return "bg-amber-100 text-amber-700"
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Volver a Cuentas
        </button>

        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Registrar Pago / Abono</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Monto a Pagar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={form.monto}
                    onChange={e => setForm({...form, monto: e.target.value})}
                    className="w-full pl-8 pr-4 py-4 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-blue-500/30 outline-none transition-all font-black text-xl text-blue-600"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1">Saldo pendiente: <span className="font-bold text-red-500">${saldo.toFixed(2)}</span></p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Método de Pago</label>
                <select 
                  value={form.metodo_pago}
                  onChange={e => setForm({...form, metodo_pago: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-blue-500/30 outline-none transition-all font-bold"
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
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fecha de Pago</label>
                  <div className="relative">
                    <HugeiconsIcon icon={Calendar03Icon} size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      value={form.fecha_pago}
                      onChange={e => setForm({...form, fecha_pago: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-blue-500/30 outline-none transition-all font-bold"
                      required
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Comprobante (imagen)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center w-full py-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                  >
                    {comprobantePreview ? (
                      <img src={comprobantePreview} alt="Comprobante" className="max-h-32 rounded-xl object-contain" />
                    ) : (
                      <>
                        <Upload size={28} className="text-gray-300 mb-1" />
                        <span className="text-xs text-gray-400 font-medium">Haz clic para seleccionar imagen</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                  {comprobanteFile && (
                    <p className="text-[10px] text-gray-400 ml-1">{comprobanteFile.name}</p>
                  )}
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Observaciones Internas</label>
              <div className="relative">
                <HugeiconsIcon icon={Note01Icon} size={18} className="absolute left-4 top-4 text-gray-400" />
                <textarea 
                  value={form.observaciones}
                  onChange={e => setForm({...form, observaciones: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-blue-500/30 outline-none transition-all text-sm min-h-[100px]"
                  placeholder="Detalles adicionales del movimiento..."
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                "Procesando..."
              ) : (
                <>
                  <HugeiconsIcon icon={SaveIcon} size={24} />
                  Confirmar Registro
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <HugeiconsIcon icon={Coins01Icon} size={20} className="text-blue-400" />
            Estado de Deuda
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-end">
                <span className="text-xs text-gray-400 font-bold uppercase">Monto Total</span>
                <span className="text-xl font-black">${data.monto_total}</span>
             </div>
             <div className="flex justify-between items-end">
                <span className="text-xs text-gray-400 font-bold uppercase">Total Abonado</span>
                <span className="text-xl font-black text-green-400">${data.monto_abonado}</span>
             </div>
             <div className="h-px bg-white/10 my-2" />
             <div className="flex justify-between items-end">
                <span className="text-xs text-gray-400 font-bold uppercase">Saldo Restante</span>
                <span className="text-3xl font-black text-blue-400">${saldo.toFixed(2)}</span>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <HugeiconsIcon icon={Coins01Icon} size={20} className="text-blue-500" />
            Pagos Realizados
            {transacciones.length > 0 && (
              <span className="ml-auto text-sm font-bold text-gray-400">({transacciones.length})</span>
            )}
          </h3>
          <div className="space-y-6">
            {transacciones.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No hay movimientos previos</p>
            ) : (
              transacciones.map((t: any) => (
                <div key={t.id} className="relative pl-6 border-l-2 border-gray-100 pb-2">
                  <div className={`absolute -left-[9px] top-0 size-4 rounded-full border-4 border-white ${
                    t.estado_verificacion === 'aprobado' ? 'bg-green-400' :
                    t.estado_verificacion === 'rechazado' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-gray-900">${t.monto}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(t.fecha_pago).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-500 mt-1 capitalize">{t.metodo_pago}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${badgeEstado(t.estado_verificacion)}`}>
                      {t.estado_verificacion}
                    </span>
                  </div>
                  {t.comprobante_url ? (
                    <div className="mt-2">
                      <button
                        onClick={() => setComprobanteVisible(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {comprobanteVisible[t.id] ? "Ocultar comprobante" : "Ver comprobante"}
                      </button>
                      {comprobanteVisible[t.id] && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
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
                    <p className="mt-1 text-[9px] text-gray-300 italic">Sin comprobante adjunto</p>
                  )}
                  {t.observaciones && (
                    <p className="text-[10px] text-gray-400 mt-1 italic">{t.observaciones}</p>
                  )}
                </div>
              ))
            )}
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
    </>
  )
}
