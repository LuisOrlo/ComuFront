import { useState } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Coins02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"
import api from "@/services/auth.service"

interface LineaPagoData {
  id: string
  modulo_id: string
  nombre_modulo: string
  numero_orden: number
  monto_ajustado: number
  monto_abonado: number
}

interface PagoInicialMatriculaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lineasPagoIds: string[]
  matriculaId: string
  cursoNombre: string
  onCompleted: () => void
}

export function PagoInicialMatriculaModal({
  open,
  onOpenChange,
  lineasPagoIds,
  matriculaId,
  cursoNombre,
  onCompleted,
}: PagoInicialMatriculaModalProps) {
  const [multiModulo, setMultiModulo] = useState(false)
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [saving, setSaving] = useState(false)
  const [lineas, setLineas] = useState<LineaPagoData[]>([])

  const loadLineas = async () => {
    try {
      const res = await api.get(`/personas/estudiantes/${lineasPagoIds[0]}/matricula/${matriculaId}/lineas-pago`)
      setLineas(res.data.datos || [])
    } catch {
      // Fallback: crear lineas básicas con los IDs
      setLineas(lineasPagoIds.map((id, i) => ({
        id,
        modulo_id: id,
        nombre_modulo: `Módulo ${i + 1}`,
        numero_orden: i + 1,
        monto_ajustado: 0,
        monto_abonado: 0,
      })))
    }
  }

  // Reactively load lineas when modal opens
  if (open && lineas.length === 0) {
    loadLineas()
  }

  const lineasVisibles = multiModulo ? lineas : [lineas[0]]

  const handleRegistrar = async () => {
    setSaving(true)
    try {
      const pagos = lineasVisibles
        .filter(l => {
          const monto = parseFloat(montos[l.id] || "0")
          return monto > 0
        })
        .map(l => ({
          linea_pago_modulo_id: l.id,
          monto: parseFloat(montos[l.id] || "0"),
          metodo_pago: metodoPago,
          fecha_pago: new Date().toISOString(),
        }))

      if (pagos.length === 0) {
        toast.error("Ingresa al menos un monto para registrar el pago")
        setSaving(false)
        return
      }

      await api.post("/finanzas/pagos-iniciales", {
        matricula_id: matriculaId,
        pagos,
      })

      toast.success(`Pago${pagos.length > 1 ? 's' : ''} registrado${pagos.length > 1 ? 's' : ''}`)
      onOpenChange(false)
      resetForm()
      onCompleted()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje
      toast.error(msg || "Error al registrar pago")
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setMontos({})
    setMetodoPago("efectivo")
    setMultiModulo(false)
    setLineas([])
  }

  const sorted = [...lineasVisibles].sort((a, b) => a.numero_orden - b.numero_orden)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg my-auto overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
              <div>
                <Dialog.Title className="text-xl font-black text-gray-900">Registrar pago inicial</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-1">
                  {cursoNombre}
                </Dialog.Description>
              </div>
              <Dialog.Close className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </Dialog.Close>
            </div>

            <div className="p-8 space-y-5">
              {sorted.map((linea) => {
                const monto = parseFloat(montos[linea.id] || "0")
                const ajustado = linea.monto_ajustado || 0
                const pagado = monto >= ajustado
                const abonado = monto > 0 && monto < ajustado

                return (
                  <div key={linea.id} className="p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                          Módulo {linea.numero_orden || "—"}
                        </span>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">{linea.nombre_modulo}</p>
                      </div>
                      <span className="text-sm font-black text-gray-700">
                        ${ajustado.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={montos[linea.id] || ""}
                          onChange={e => setMontos(prev => ({ ...prev, [linea.id]: e.target.value }))}
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                      </div>
                      {pagado && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg whitespace-nowrap">
                          Queda PAGADO
                        </span>
                      )}
                      {abonado && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg whitespace-nowrap">
                          Queda ABONADO (${(ajustado - monto).toLocaleString()} pend.)
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {lineas.length > 1 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={multiModulo}
                    onChange={() => setMultiModulo(!multiModulo)}
                    className="size-4 rounded border-gray-300"
                  />
                  <span className="text-xs font-medium text-gray-600">Pagar varios módulos en esta operación</span>
                </label>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Método de pago</label>
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="deposito">Depósito</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Dialog.Close className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                  Omitir
                </Dialog.Close>
                <button
                  onClick={handleRegistrar}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: COLORS.ACCENT }}
                >
                  <HugeiconsIcon icon={Coins02Icon} size={16} />
                  {saving ? "Registrando..." : "Registrar pago"}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
