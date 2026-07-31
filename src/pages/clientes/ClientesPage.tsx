import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { ClientesFilters } from "./components/ClientesFilters"
import { ClientesTable } from "./components/ClientesTable"

const ITEMS_PER_PAGE = 500

export function ClientesPage() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<ClienteExterno[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const loadClientes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientesService.getClientes({ per_page: ITEMS_PER_PAGE }) as {
        data: ClienteExterno[]
      }
      setClientes(res.data)
    } catch {
      toast.error("Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await clientesService.deleteCliente(deleteConfirm.id)
      toast.success("Cliente eliminado")
      setDeleteConfirm(null)
      loadClientes()
    } catch {
      toast.error("Error al eliminar cliente")
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Clientes
            </h1>
            <p className="text-sm opacity-50 mt-1">Registro de clientes de servicios</p>
          </div>
          <button
            onClick={() => navigate("/clientes/nuevo")}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-emerald-500/20"
            style={{ backgroundColor: "oklch(0.55 0.18 160)" }}
          >
            <Plus size={18} strokeWidth={2.5} color="white" />
            Nuevo Cliente
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <div className="bg-white rounded-xl border shadow-2xl shadow-black/5 flex flex-col min-h-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <ClientesFilters search={search} onSearchChange={handleSearch} />
          <ClientesTable
            clientes={clientes}
            loading={loading}
            search={search}
            onSearchChange={handleSearch}
            onEdit={(c) => navigate(`/clientes/${c.id}/editar`)}
            onDelete={(c) => setDeleteConfirm({ id: c.id, name: `${c.nombres} ${c.apellidos || ""}`.trim() })}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Cliente"
        message={`¿Eliminar al cliente "${deleteConfirm?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
