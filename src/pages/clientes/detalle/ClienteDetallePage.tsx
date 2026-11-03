import { useParams, Link, useNavigate } from "react-router"
import { useState, useEffect, useCallback } from "react"
import {
  ArrowLeft,
  BriefcaseBusiness,
  CreditCard,
  EllipsisVertical,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react"
import { COLORS } from "@/lib/constants"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { InfoBasica } from "./components/InfoBasica"
import { ServiciosContratados } from "./components/ServiciosContratados"
import { PagosRealizados } from "./components/PagosRealizados"

const tabs = [
  { key: "informacion" as const, label: "Información", icon: UserRound },
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
  const [showActionsMenu, setShowActionsMenu] = useState(false)

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

  const esEmpresa = cliente.tipo_cliente === "empresa"
  const name =
    cliente.nombre_mostrado ||
    (esEmpresa ? cliente.nombre_empresa || "" : `${cliente.nombres} ${cliente.apellidos || ""}`).trim()
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const tipoLabel = esEmpresa ? "Empresa" : "Persona"

  return (
    <div className="flex min-h-full flex-col overflow-y-auto bg-[#f8f9ff] text-[#0b1c30]">
      <header
        className="relative z-20 shrink-0 border-b bg-white px-4 py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] sm:px-6 lg:px-8"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="mx-auto max-w-7xl">
          {/* Identidad + acciones */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/clientes")}
                aria-label="Volver a la lista de clientes"
                title="Volver a clientes"
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-[#73747b] transition-colors hover:bg-[#eff4ff] hover:text-[#0b1c30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a] focus-visible:ring-offset-2"
              >
                <ArrowLeft size={18} />
              </button>

              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm ring-2 ring-white sm:size-16 sm:text-xl"
                style={{ background: "linear-gradient(135deg, #fd761a 0%, #e05e07 100%)" }}
                aria-hidden="true"
              >
                {initials || "?"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <h1 className="break-words text-xl font-bold tracking-tight text-[#0b1c30] sm:text-2xl lg:text-[28px]">
                    {name}
                  </h1>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      esEmpresa
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-orange-200 bg-orange-50 text-orange-700"
                    }`}
                  >
                    {esEmpresa ? <BriefcaseBusiness size={11} /> : <UserRound size={11} />}
                    {tipoLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Link
                to={`/clientes/${id}/editar`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a] focus-visible:ring-offset-2 sm:flex-none"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Pencil size={14} />
                Editar cliente
              </Link>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowActionsMenu((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={showActionsMenu}
                  aria-label="Más acciones"
                  title="Más acciones"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-[#e5eeff] bg-white text-[#73747b] transition-all hover:bg-[#f8f9ff] hover:text-[#0b1c30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a] focus-visible:ring-offset-2"
                >
                  <EllipsisVertical size={17} />
                </button>

                {showActionsMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)} />
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-[#e5eeff] bg-white p-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowActionsMenu(false)
                          setDeleteConfirm(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Eliminar cliente
                      </button>
                    </div>
                  </>
                )}
              </div>
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
          <div
            className="flex gap-1.5 overflow-x-auto border-b bg-[#fafbfc] p-2.5"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
            role="tablist"
            aria-label="Secciones del cliente"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  id={`tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.key}`}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#fff1e6] text-[#b45309] ring-1 ring-[#ffd7bd]"
                      : "text-[#73747b] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                  }`}
                >
                  <tab.icon size={15} strokeWidth={2.4} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "informacion" && (
              <div id="panel-informacion" role="tabpanel" aria-labelledby="tab-informacion">
                <InfoBasica cliente={cliente} />
              </div>
            )}
            {activeTab === "servicios" && (
              <div id="panel-servicios" role="tabpanel" aria-labelledby="tab-servicios">
                <ServiciosContratados clienteId={id!} />
              </div>
            )}
            {activeTab === "pagos" && (
              <div id="panel-pagos" role="tabpanel" aria-labelledby="tab-pagos">
                <PagosRealizados clienteId={id!} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
