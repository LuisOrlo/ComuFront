import { useParams, Link, useNavigate } from "react-router"
import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { BriefcaseBusiness, CreditCard, Pencil, Trash2, UserRound } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { InfoBasica } from "./components/InfoBasica"
import { ServiciosContratados } from "./components/ServiciosContratados"
import { PagosRealizados } from "./components/PagosRealizados"

const tabs = [
  { key: "informacion" as const, label: "Informaci\u00f3n", icon: UserRound },
  { key: "servicios" as const, label: "Servicios Contratados", icon: BriefcaseBusiness },
  { key: "pagos" as const, label: "Pagos Realizados", icon: CreditCard },
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
    <div className="flex min-h-full flex-col overflow-y-auto bg-[#f8f9ff] text-[#0b1c30]">
      <header className="sticky top-0 z-20 shrink-0 border-b bg-white/95 px-4 py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] sm:px-6 lg:px-8" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
            <Link to="/clientes" className="flex size-9 items-center justify-center rounded-lg text-[#73747b] transition-colors hover:bg-[#eff4ff] hover:text-[#0b1c30]">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Link>
            <div className="hidden size-14 shrink-0 items-center justify-center rounded-full bg-[#fd761a] text-lg font-bold text-white shadow-sm sm:flex">
              {`${cliente.nombres?.[0] ?? ""}${cliente.apellidos?.[0] ?? ""}`.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: COLORS.CHARCOAL }}>
                {name}
              </h1>
              <span className="hidden rounded-full bg-[#e5eeff] px-2.5 py-1 text-[11px] font-semibold text-[#45464d] sm:inline">{cliente.tipo_cliente === "empresa" ? "Empresa" : "Cliente externo"}</span>
              </div>
              <p className="mt-1 text-sm text-[#73747b]">
                {cliente.cedula && <span>{cliente.cedula} · </span>}
                {cliente.celular && <span>{cliente.celular}</span>}
                {cliente.correo && <span> · {cliente.correo}</span>}
                {cliente.ciudad && <span> · {cliente.ciudad}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold transition-all hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <Trash2 size={15} strokeWidth={2.5} />
              Eliminar
            </button>
            <Link to={`/clientes/${id}/editar`}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: COLORS.ACCENT }}>
              <Pencil size={15} strokeWidth={2.5} color="white" />
              Editar Cliente
            </Link>
          </div>
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

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex gap-1 overflow-x-auto border-b p-2" style={{ borderColor: COLORS.BORDER_SUBTLE }} role="tablist" aria-label="Secciones del cliente">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.key ? "text-white shadow-sm" : "text-[#73747b] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                }`}
                style={{ backgroundColor: activeTab === tab.key ? COLORS.ACCENT : "transparent" }}
                role="tab"
                aria-selected={activeTab === tab.key}
              >
                <tab.icon size={16} strokeWidth={2.4} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
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
      </main>
    </div>
  )
}
