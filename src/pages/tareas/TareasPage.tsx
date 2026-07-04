import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { useTareas } from "@/hooks/useTareas"
import { tareasService, type TareaStaff, type StaffPersona } from "@/services/tareas.service"
import { TareaFilters } from "./components/TareaFilters"
import { TareaSummaryCards } from "./components/TareaSummaryCards"
import { TareaTable } from "./components/TareaTable"
import { TareaFormPanel } from "./components/TareaFormPanel"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

export function TareasPage() {
  const {
    tareas,
    loading,
    totales,
    currentPage,
    lastPage,
    filters,
    setFiltro,
    setPagina,
    setOrden,
    recargar,
  } = useTareas()

  const [staff, setStaff] = useState<StaffPersona[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [tareaEdit, setTareaEdit] = useState<TareaStaff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchStaff = useCallback(async () => {
    try {
      const data = await tareasService.getStaffDisponible()
      setStaff(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStaff()
  }, [fetchStaff])

  function handleOpenCreate() {
    setTareaEdit(null)
    setPanelOpen(true)
  }

  function handleOpenEdit(t: TareaStaff) {
    setTareaEdit(t)
    setPanelOpen(true)
  }

  function handleClosePanel() {
    setPanelOpen(false)
    setTareaEdit(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await tareasService.deleteTarea(deleteTarget)
      toast.success("Tarea eliminada")
      setDeleteTarget(null)
      recargar()
    } catch {
      toast.error("Error al eliminar la tarea")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-5 bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
            Control de Tareas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
            Asignación y seguimiento de tareas del staff
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.97]"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Nueva tarea
        </button>
      </header>

      <div className="flex-1 px-6 py-5 space-y-5">
        <TareaFilters
          titulo={filters.titulo || ""}
          personaId={filters.persona_id || ""}
          estado={filters.estado || ""}
          staff={staff}
          onChange={(key, value) => setFiltro(key as keyof typeof filters, value || undefined)}
        />

        <TareaSummaryCards totales={totales} />

        <TareaTable
          tareas={tareas}
          loading={loading}
          sortField={filters.sort || "created_at"}
          sortDir={filters.dir || "desc"}
          onSort={setOrden}
          onEdit={handleOpenEdit}
          onDelete={setDeleteTarget}
          currentPage={currentPage}
          lastPage={lastPage}
          onPageChange={setPagina}
          onTareaUpdate={recargar}
        />
      </div>

      <TareaFormPanel
        isOpen={panelOpen}
        tarea={tareaEdit}
        staff={staff}
        onClose={handleClosePanel}
        onSave={recargar}
      />

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Eliminar tarea"
        message="¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={deleting}
        icon="trash"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
