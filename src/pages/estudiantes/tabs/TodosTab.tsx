import { useState, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronLeftIcon, ChevronRightIcon } from "@hugeicons/core-free-icons"
import { useStudentList } from "../hooks/useStudentList"
import { StudentFilters } from "../components/StudentFilters"
import { StudentTable, type StudentRow } from "../components/StudentTable"
import { BulkActionsBar } from "../components/BulkActionsBar"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { COLORS } from "@/lib/constants"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { estudiantesService } from "@/services/estudiantes.service"
import { toast } from "sonner"

export function TodosTab() {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmDeleteCedulasOpen, setConfirmDeleteCedulasOpen] = useState(false)

  const {
    estudiantes,
    loading,
    search,
    setSearch,
    paymentFilter,
    setPaymentFilter,
    stats,
    meta,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    loadPage,
    deleteStudents,
  } = useStudentList()
  const [deleting, setDeleting] = useState(false)
  const [deletingCedulas, setDeletingCedulas] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const selectedArray = Array.from(selectedIds)

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedArray.length === 0) return
    setDeleting(true)
    await deleteStudents(selectedArray)
    setDeleting(false)
    setConfirmDeleteOpen(false)
  }, [selectedArray, deleteStudents])

  const handleBulkDeleteCedulas = useCallback(async () => {
    if (selectedArray.length === 0) return
    setDeletingCedulas(true)
    try {
      const results = await Promise.allSettled(
        selectedArray.map(id => estudiantesService.deleteArchivoCedula(id))
      )
      const success = results.filter(r => r.status === "fulfilled" && (r.value as { eliminado?: boolean })?.eliminado !== false).length
      const failed = results.filter(r => {
        if (r.status === "rejected") return true
        return (r.value as { eliminado?: boolean })?.eliminado === false
      }).length
      if (success > 0) {
        toast.success(`${success} cédula(s) eliminadas del almacenamiento`)
      }
      if (failed > 0) {
        toast.warning(`${failed} estudiante(s) sin foto de cédula o ya eliminada`)
      }
    } catch { toast.error("Error al procesar la eliminación") }
    setDeletingCedulas(false)
    setConfirmDeleteCedulasOpen(false)
    clearSelection()
  }, [selectedArray, clearSelection])

  const studentRows: StudentRow[] = estudiantes.map(e => ({
    id: e.id,
    nombres: e.nombres,
    apellidos: e.apellidos,
    cedula: e.cedula,
    correo: e.correo,
    estado_pago: e.estado_pago,
    total_cursos: e.total_cursos,
    saldo_pendiente: e.saldo_pendiente,
  }))

  return (
    <>
      <StudentFilters
        search={search}
        onSearchChange={setSearch}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={(f) => { setPaymentFilter(f) }}
        stats={stats}
      />

      <div className="min-h-[32px]">
        <BulkActionsBar
          selectedCount={selectedArray.length}
          onClear={clearSelection}
          onDelete={() => setConfirmDeleteOpen(true)}
          onExport={() => setExportOpen(true)}
          onDeleteCedulas={() => setConfirmDeleteCedulasOpen(true)}
        />
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <StudentTable
          estudiantes={studentRows}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />

        {meta && meta.ultima_pagina > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Mostrando {meta.total > 0 ? (meta.actual - 1) * meta.per_page + 1 : 0} - {Math.min(meta.actual * meta.per_page, meta.total)} de {meta.total} estudiantes
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => loadPage(meta.actual - 1)}
                disabled={meta.actual === 1}
                className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                style={{
                  backgroundColor: "oklch(0.97 0 0)",
                  color: COLORS.TEXT_MUTED,
                  opacity: meta.actual === 1 ? 0.4 : 1,
                  cursor: meta.actual === 1 ? "not-allowed" : "pointer",
                }}
              >
                <HugeiconsIcon icon={ChevronLeftIcon} size={16} />
              </button>
              {(() => {
                const maxBotones = 5
                let desde = Math.max(1, meta.actual - Math.floor(maxBotones / 2))
                const hasta = Math.min(meta.ultima_pagina, desde + maxBotones - 1)
                if (hasta - desde + 1 < maxBotones) {
                  desde = Math.max(1, hasta - maxBotones + 1)
                }
                const paginas: number[] = []
                for (let i = desde; i <= hasta; i++) paginas.push(i)
                return paginas.map(pagina => (
                  <button
                    key={pagina}
                    onClick={() => loadPage(pagina)}
                    className="size-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: pagina === meta.actual ? COLORS.ACCENT : "oklch(0.97 0 0)",
                      color: pagina === meta.actual ? "white" : COLORS.TEXT_MUTED,
                    }}
                  >
                    {pagina}
                  </button>
                ))
              })()}
              <button
                onClick={() => loadPage(meta.actual + 1)}
                disabled={meta.actual === meta.ultima_pagina}
                className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                style={{
                  backgroundColor: "oklch(0.97 0 0)",
                  color: COLORS.TEXT_MUTED,
                  opacity: meta.actual === meta.ultima_pagina ? 0.4 : 1,
                  cursor: meta.actual === meta.ultima_pagina ? "not-allowed" : "pointer",
                }}
              >
                <HugeiconsIcon icon={ChevronRightIcon} size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <StudentExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        selectedIds={selectedArray}
        extraFilters={{
          buscar: search || undefined,
          estado_pago: paymentFilter !== "todos" ? paymentFilter : undefined,
        }}
        description={`${selectedArray.length > 0 ? selectedArray.length : (meta?.total ?? 0)} estudiante(s). Elige formato y campos.`}
      />

      <ConfirmationModal
        isOpen={confirmDeleteOpen}
        title="Eliminar estudiantes"
        message={`Estas seguro de eliminar ${selectedArray.length} estudiante(s)? Esta accion eliminara sus matriculas, calificaciones y cuentas financieras. No se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleting}
        icon="trash"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <ConfirmationModal
        isOpen={confirmDeleteCedulasOpen}
        title="Eliminar fotos de cédula"
        message={`¿Eliminar las fotos de cédula de ${selectedArray.length} estudiante(s) del almacenamiento? Los registros se conservarán como constancia histórica. Esta acción es irreversible.`}
        confirmText="Eliminar cédulas"
        cancelText="Cancelar"
        isLoading={deletingCedulas}
        icon="danger"
        onConfirm={handleBulkDeleteCedulas}
        onCancel={() => setConfirmDeleteCedulasOpen(false)}
      />
    </>
  )
}
