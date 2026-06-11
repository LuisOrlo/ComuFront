import { useState, useEffect } from "react"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Invoice02Icon } from "@hugeicons/core-free-icons"

export function FinanceHistorial() {
  const [loading, setLoading] = useState(true)
  const [transacciones, setTransacciones] = useState<any[]>([])

  useEffect(() => {
    loadHistorial()
  }, [])

  const loadHistorial = async () => {
    try {
      const res = await financeService.getTransacciones({ per_page: 50 })
      setTransacciones(res.data)
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-20 text-center text-gray-400">Cargando historial...</div>

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-50">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
           <HugeiconsIcon icon={Invoice02Icon} size={24} className="text-blue-500" />
           Historial Financiero Completo
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Origen</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transacciones.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-20 text-center">
                  <p className="text-gray-300 font-medium text-sm">No hay movimientos registrados aún</p>
                  <p className="text-gray-200 text-xs mt-1">Los pagos y abonos aparecerán aquí una vez registrados</p>
                </td>
              </tr>
            ) : (
              transacciones.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4 text-xs font-bold text-gray-600">{new Date(t.fecha_pago).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {(t.cuenta_por_cobrar?.matricula?.estudiante
                      ? `${t.cuenta_por_cobrar.matricula.estudiante.nombres} ${t.cuenta_por_cobrar.matricula.estudiante.apellidos}`
                      : t.cuenta_por_cobrar?.solicitud_inscripcion?.estudiante
                      ? `${t.cuenta_por_cobrar.solicitud_inscripcion.estudiante.nombres} ${t.cuenta_por_cobrar.solicitud_inscripcion.estudiante.apellidos}`
                      : t.cuenta_por_cobrar?.solicitud_inscripcion?.participante_externo
                      ? `${t.cuenta_por_cobrar.solicitud_inscripcion.participante_externo.nombres} ${t.cuenta_por_cobrar.solicitud_inscripcion.participante_externo.apellidos}`
                      : "—")}
                  </td>
                  <td className="px-6 py-4 font-black text-blue-600">${t.monto}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                      t.estado_verificacion === 'aprobado' ? 'bg-green-100 text-green-700' :
                      t.estado_verificacion === 'rechazado' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {t.estado_verificacion}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
