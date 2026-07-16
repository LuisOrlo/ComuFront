import { useParams, Link, useNavigate } from "react-router"
import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Pencil, Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { InfoBasica } from "./components/InfoBasica"
import { ServiciosContratados } from "./components/ServiciosContratados"
import { PagosRealizados } from "./components/PagosRealizados"

const tabs = [
  { key: "informacion" as const, label: "Informaci\u00f3n" },
  { key: "servicios" as const, label: "Servicios Contratados" },
  { key: "pagos" as const, label: "Pagos Realizados" },
]

export function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<ClienteExterno | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"informacion" | "servicios" | "pagos">("informacion")
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadCliente = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await clientesService.getCliente(id)
      setCliente(data)
    } catch {
      toast.error("Error al cargar datos del cliente")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCliente()
  }, [loadCliente])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin size-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-sm text-gray-400 font-medium">Cargando datos del cliente...</span>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Cliente no encontrado.</p>
        <Link to="/clientes" className="text-sm font-bold mt-4 inline-block" style={{ color: COLORS.ACCENT }}>
          Volver al listado
        </Link>
      </div>
    )
  }

  const name = `${cliente.nombres} ${cliente.apellidos || ""}`.trim()

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/clientes" className="size-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
                {name}
              </h1>
              <p className="text-sm opacity-50 mt-0.5">
                {cliente.cedula && <span>{cliente.cedula} · </span>}
                {cliente.celular && <span>{cliente.celular}</span>}
                {cliente.correo && <span> · {cliente.correo}</span>}
                {cliente.ciudad && <span> · {cliente.ciudad}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all hover:bg-red-50 hover:text-red-600 active:scale-[0.97]"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <Trash2 size={15} strokeWidth={2.5} />
              Eliminar
            </button>
            <Link to={`/clientes/${id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: "oklch(0.55 0.18 160)" }}>
              <Pencil size={15} strokeWidth={2.5} color="white" />
              Editar Cliente
            </Link>
          </div>
        </div>
      </header>

      <ConfirmationModal
        isOpen={deleteConfirm}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a "${name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        isLoading={deleting}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await clientesService.deleteCliente(id!)
            toast.success("Cliente eliminado")
            navigate("/clientes")
          } catch {
            toast.error("Error al eliminar el cliente")
          } finally {
            setDeleting(false)
            setDeleteConfirm(false)
          }
        }}
        onCancel={() => setDeleteConfirm(false)}
      />

      <div className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-xl border shadow-xl shadow-black/5 overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex border-b overflow-x-auto" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.key ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: "oklch(0.55 0.18 160)" }} />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "informacion" && (
              <InfoBasica cliente={cliente} />
            )}
            {activeTab === "servicios" && (
              <ServiciosContratados clienteId={id!} />
            )}
            {activeTab === "pagos" && (
              <PagosRealizados clienteId={id!} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
