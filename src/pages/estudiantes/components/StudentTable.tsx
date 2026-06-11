import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { GraduationCapIcon, Clock04Icon } from "@hugeicons/core-free-icons"
import { FinancialStatusBadge } from "./FinancialStatusBadge"
import { type Estudiante } from "@/services/estudiantes.service"

interface StudentTableProps {
  estudiantes: Estudiante[]
  loading: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
}

export function StudentTable({ estudiantes, loading, selectedIds, onToggleSelect, onToggleSelectAll }: StudentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white border-b border-gray-100">
            <th className="w-12 px-4 py-5">
              <input
                type="checkbox"
                checked={estudiantes.length > 0 && selectedIds.size === estudiantes.length}
                onChange={onToggleSelectAll}
                className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificacion</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado Financiero</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cursos</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Saldo</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-5"><div className="size-4 rounded bg-gray-100 animate-pulse mx-auto" /></td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
                      <div className="h-3 w-24 bg-gray-50 animate-pulse rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5"><div className="h-6 w-20 bg-gray-100 animate-pulse rounded-lg" /></td>
                <td className="px-6 py-5"><div className="h-6 w-24 bg-gray-100 animate-pulse rounded-lg mx-auto" /></td>
                <td className="px-6 py-5"><div className="h-8 w-12 bg-gray-100 animate-pulse rounded-lg mx-auto" /></td>
                <td className="px-6 py-5"><div className="h-5 w-16 bg-gray-100 animate-pulse rounded mx-auto" /></td>
                <td className="px-6 py-5"><div className="h-8 w-24 bg-gray-100 animate-pulse rounded-xl float-right" /></td>
              </tr>
            ))
          ) : estudiantes.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-8 py-20 text-center">
                <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HugeiconsIcon icon={Clock04Icon} size={24} className="text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold">No se encontraron estudiantes</h3>
                <p className="text-sm text-gray-400 mt-1">Intenta con otros criterios de busqueda o filtros.</p>
              </td>
            </tr>
          ) : (
            estudiantes.map((e, idx) => (
              <tr key={e.id || `student-${idx}`} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(e.id)}
                    onChange={() => onToggleSelect(e.id)}
                    className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm uppercase">
                      {e.nombres.charAt(0)}{e.apellidos.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 leading-tight">{e.nombres} {e.apellidos}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{e.correo || 'Sin correo registrado'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-1 rounded-lg inline-block">{e.cedula || '—'}</div>
                  <div className="mt-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                      e.tipo_estudiante === 'interno' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {e.tipo_estudiante}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <FinancialStatusBadge status={e.estado_pago} />
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-lg font-black text-gray-700">{e.total_cursos || 0}</span>
                </td>
                <td className="px-6 py-5 text-center">
                  {e.saldo_pendiente > 0 ? (
                    <span className="text-sm font-bold text-red-500">${e.saldo_pendiente.toLocaleString()}</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <Link
                    to={`/estudiantes/${e.id}/academico`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <HugeiconsIcon icon={GraduationCapIcon} size={14} />
                    Ver Perfil
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
