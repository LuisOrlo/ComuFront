/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  CheckmarkCircle02Icon, 
  Cancel01Icon,
  ViewIcon,
  Clock01Icon
} from "@hugeicons/core-free-icons"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

export function FinanceValidacion() {
  const [loading, setLoading] = useState(true)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [verifying, setVerifying] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)

  const loadPendientes = async () => {
    try {
      const res = await financeService.getTransacciones({ estado_verificacion: "pendiente" })
      setTransacciones(res.data)
    } catch {
      toast.error("Error al cargar comprobantes pendientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPendientes()
  }, [])

  const handleVerificar = async (id: string, estado: "aprobado" | "rechazado") => {
    setVerifying(id)
    try {
      await financeService.verificarTransaccion(id, { estado })
      toast.success(`Transacción ${estado} correctamente`)
      loadPendientes()
    } catch {
      toast.error("Error al procesar verificación")
    } finally {
      setVerifying(null)
    }
  }

  const getNombreEstudiante = (t: any) => {
    const s = t.cuenta_por_cobrar?.solicitud_inscripcion
    const m = t.cuenta_por_cobrar?.matricula
    if (m?.estudiante) return `${m.estudiante.nombres} ${m.estudiante.apellidos}`
    if (s?.estudiante) return `${s.estudiante.nombres} ${s.estudiante.apellidos}`
    if (s?.participante_externo) return `${s.participante_externo.nombres} ${s.participante_externo.apellidos}`
    return "Desconocido"
  }

  if (loading) return <div className="p-20 text-center text-gray-400 font-medium">Cargando comprobantes...</div>

  return (
    <><div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-50">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
           <HugeiconsIcon icon={Clock01Icon} size={24} className="text-amber-500" />
           Comprobantes Pendientes de Verificación
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante / Fecha</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Método</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Comprobante</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones Administrativas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transacciones.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-medium">No hay comprobantes por verificar</td></tr>
            ) : (
              transacciones.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-gray-900">{getNombreEstudiante(t)}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">{new Date(t.fecha_pago).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5 font-black text-blue-600">${t.monto}</td>
                  <td className="px-6 py-5 capitalize text-sm font-medium text-gray-600">{t.metodo_pago}</td>
                  <td className="px-6 py-5 text-center">
                    {t.comprobante_url ? (
                      <button
                        onClick={() => setModalImage(t.comprobante_url)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                      >
                        <HugeiconsIcon icon={ViewIcon} size={14} /> VER
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Sin archivo</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        disabled={verifying === t.id}
                        onClick={() => handleVerificar(t.id, "rechazado")}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                       >
                          <HugeiconsIcon icon={Cancel01Icon} size={14} className="inline mr-1" /> Rechazar
                       </button>
                       <button 
                        disabled={verifying === t.id}
                        onClick={() => handleVerificar(t.id, "aprobado")}
                        className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
                       >
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="inline mr-1" /> Aprobar
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
