import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon } from "@hugeicons/core-free-icons"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import type { ClienteExterno } from "@/services/clientes.service"

interface ClientesTableProps {
  clientes: ClienteExterno[]
  loading: boolean
  onEdit: (cliente: ClienteExterno) => void
  onDelete: (cliente: ClienteExterno) => void
}

export function ClientesTable({ clientes, loading, onEdit, onDelete }: ClientesTableProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}
      </div>
    )
  }

  if (clientes.length === 0) {
    return (
      <div className="flex-1 p-12 text-center">
        <HugeiconsIcon icon={UserGroupIcon} size={40} className="opacity-20 mx-auto mb-3" />
        <p className="text-sm font-bold opacity-40">No hay clientes registrados</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-[9px] font-bold uppercase tracking-wider opacity-40" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <th className="text-left px-6 py-3">Nombres</th>
            <th className="text-left px-6 py-3">Cédula</th>
            <th className="text-left px-6 py-3">Correo</th>
            <th className="text-left px-6 py-3">Celular</th>
            <th className="text-left px-6 py-3">Ciudad</th>
            <th className="text-center px-6 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y text-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {clientes.map(c => (
            <tr key={c.id}
              className="hover:bg-gray-50/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/clientes/${c.id}`)}>
              <td className="px-6 py-4 font-bold">
                {c.nombres} {c.apellidos || ""}
              </td>
              <td className="px-6 py-4 text-xs opacity-60">{c.cedula || "—"}</td>
              <td className="px-6 py-4 text-xs">{c.correo || "—"}</td>
              <td className="px-6 py-4 text-xs">{c.celular || "—"}</td>
              <td className="px-6 py-4 text-xs">{c.ciudad || "—"}</td>
              <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => navigate(`/clientes/${c.id}`)}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    title="Ver detalle">
                    <Eye size={14} className="opacity-40" />
                  </button>
                  <button onClick={() => onEdit(c)}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    title="Editar">
                    <Pencil size={14} className="opacity-40" />
                  </button>
                  <button onClick={() => onDelete(c)}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                    title="Eliminar">
                    <Trash2 size={14} className="opacity-40 text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
