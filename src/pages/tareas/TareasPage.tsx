import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, TaskEdit01Icon, RefreshIcon } from "@hugeicons/core-free-icons"
import { useTareas } from "@/hooks/useTareas"
import { tareasService, type TareaStaff, type StaffPersona } from "@/services/tareas.service"
import { TareaFilters } from "./components/TareaFilters"
import { TareaSummaryCards } from "./components/TareaSummaryCards"
import { TareaTable } from "./components/TareaTable"
import { TareaFormPanel } from "./components/TareaFormPanel"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
      toast.success("Tarea eliminada correctamente")
      setDeleteTarget(null)
      recargar()
    } catch {
      toast.error("Error al eliminar la tarea")
    } finally {
      setDeleting(false)
    }
  }

  function handleResetFilters() {
    setFiltro("titulo", undefined)
    setFiltro("persona_id", undefined)
    setFiltro("estado", undefined)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-[#f8f9ff]">
      {/* Header Superior Moderno */}
      <header className="flex-none border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] shrink-0 shadow-2xs">
                <HugeiconsIcon icon={TaskEdit01Icon} size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Control de Tareas
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Asignación y seguimiento de tareas operativas del staff
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={recargar}
                disabled={loading}
                title="Actualizar lista"
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={18}
                  className={cn(loading ? "animate-spin text-[#fd761a]" : "")}
                />
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-[#fd761a] hover:bg-[#e06513] shadow-sm transition-all active:scale-[0.98]"
              >
                <HugeiconsIcon icon={Add01Icon} size={18} />
                <span>Nueva tarea</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tarjetas KPI Interactivas */}
        <TareaSummaryCards
          totales={totales}
          selectedEstado={filters.estado || ""}
          onSelectEstado={(st) => setFiltro("estado", st || undefined)}
        />

        {/* Barra de Filtros */}
        <TareaFilters
          titulo={filters.titulo || ""}
          personaId={filters.persona_id || ""}
          estado={filters.estado || ""}
          staff={staff}
          onChange={(key, value) => setFiltro(key as keyof typeof filters, value || undefined)}
          onReset={handleResetFilters}
        />

        {/* Tabla de Tareas */}
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
      </main>

      {/* Panel Lateral Drawer para Crear / Editar */}
      <TareaFormPanel
        isOpen={panelOpen}
        tarea={tareaEdit}
        staff={staff}
        onClose={handleClosePanel}
        onSave={recargar}
      />

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Eliminar tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText="Eliminar tarea"
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
