/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  Search01Icon, 
  FilterIcon, 
  ArrowRight01Icon,
  InvoiceIcon
} from "@hugeicons/core-free-icons"

interface FinanceCuentasProps {
  cuentas: any[]
  loading: boolean
  onSelect: (id: string) => void
}

export function FinanceCuentas({ cuentas, loading, onSelect }: FinanceCuentasProps) {
  const [buscar, setBuscar] = useState("")

  const filtradas = cuentas.filter((c) => {
    if (!buscar.trim()) return true
    const q = buscar.toLowerCase()
    const nombre = (() => {
      const s = c.solicitud_inscripcion
      const m = c.matricula
      if (m?.estudiante) return `${m.estudiante.nombres} ${m.estudiante.apellidos}`
      if (s?.estudiante) return `${s.estudiante.nombres} ${s.estudiante.apellidos}`
      if (s?.participante_externo) return `${s.participante_externo.nombres} ${s.participante_externo.apellidos}`
      return ""
    })()
    return nombre.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q)
  })

  const getOrigenLabel = (cuenta: any) => {
    if (cuenta.matricula_id) return "Matrícula"
    if (cuenta.solicitud_inscripcion_id) return "Inscripción"
    if (cuenta.inscripcion_taller_id) return "Taller"
    return "Servicio"
  }

  const getNombreEstudiante = (cuenta: any) => {
    const s = cuenta.solicitud_inscripcion
    const m = cuenta.matricula
    if (m?.estudiante) return `${m.estudiante.nombres} ${m.estudiante.apellidos}`
    if (s?.estudiante) return `${s.estudiante.nombres} ${s.estudiante.apellidos}`
    if (s?.participante_externo) return `${s.participante_externo.nombres} ${s.participante_externo.apellidos}`
    return "Estudiante desconocido"
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <HugeiconsIcon icon={Search01Icon} size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre o identificación..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500/30 transition-all text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 border border-gray-100 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all text-gray-600">
           <HugeiconsIcon icon={FilterIcon} size={18} />
           Filtrar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Beneficiario / Origen</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Total</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Abonado</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
              <th className="px-8 py-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-medium">Cargando cuentas por cobrar...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-medium">{buscar ? "Sin resultados para tu búsqueda" : "No se encontraron cuentas"}</td></tr>
            ) : (
              filtradas.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm group-hover:border-blue-200 transition-colors">
                         <HugeiconsIcon icon={InvoiceIcon} size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{getNombreEstudiante(c)}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{getOrigenLabel(c)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-gray-700">$${c.monto_total}</td>
                  <td className="px-6 py-5 font-bold text-green-600">$${c.monto_abonado}</td>
                  <td className="px-6 py-5 font-black text-red-600">$${Number(c.monto_total - c.monto_abonado).toFixed(2)}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      c.estado === 'pendiente' ? 'bg-red-100 text-red-700' :
                      c.estado === 'abonado' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => onSelect(c.id)}
                      className="size-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                    </button>
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
