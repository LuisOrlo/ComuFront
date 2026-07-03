import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { GraduationCapIcon, Clock04Icon } from "@hugeicons/core-free-icons"
import { FinancialStatusBadge } from "./FinancialStatusBadge"

export interface StudentRow {
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  estado_pago?: string
  total_cursos?: number
  saldo_pendiente?: number
}

interface StudentTableProps {
  estudiantes: StudentRow[]
  loading: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  variant?: "estudiantes" | "participantes"
}

function SaldoCell({ saldo_pendiente, estado_pago }: { saldo_pendiente?: number; estado_pago?: string }) {
  if (saldo_pendiente === undefined || saldo_pendiente === null) {
    return <span className="text-sm font-medium text-gray-400">Sin registro</span>
  }
  if (saldo_pendiente > 0) {
    return <span className="text-sm font-bold text-red-500">${saldo_pendiente.toLocaleString()}</span>
  }
  if (saldo_pendiente === 0 && estado_pago === "al_dia") {
    return <span className="text-sm font-bold text-emerald-600">Completo</span>
  }
  if (saldo_pendiente === 0 && estado_pago === "ninguno") {
    return <span className="text-sm font-medium text-gray-400">Sin registro</span>
  }
  return <span className="text-sm font-bold">$0</span>
}

export function StudentTable({ estudiantes, loading, selectedIds, onToggleSelect, onToggleSelectAll, variant = "estudiantes" }: StudentTableProps) {
  const isEstudiantes = variant === "estudiantes"

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
                </td>
                <td className="px-6 py-5 text-center">
                  <FinancialStatusBadge status={e.estado_pago || "ninguno"} />
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-lg font-black text-gray-700">
                    {isEstudiantes ? (e.total_cursos ?? 0) : (e.total_cursos !== undefined && e.total_cursos !== null ? e.total_cursos : "N/A")}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <SaldoCell saldo_pendiente={e.saldo_pendiente} estado_pago={e.estado_pago} />
                </td>
                <td className="px-6 py-5 text-right">
                  {e.id && !e.id.startsWith("mat-") ? (
                    <Link
                      to={`/estudiantes/${e.id}/academico`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <HugeiconsIcon icon={GraduationCapIcon} size={14} />
                      Ver Perfil
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
