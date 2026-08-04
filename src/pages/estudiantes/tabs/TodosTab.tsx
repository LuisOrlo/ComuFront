import { useState, useCallback } from "react"
import { useStudentList } from "../hooks/useStudentList"
import { StudentFilters } from "../components/StudentFilters"
import { StudentTable, type StudentRow } from "../components/StudentTable"
import { BulkActionsBar } from "../components/BulkActionsBar"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { generarListadoEstudiantesPDF, type EstudiantePDF } from "@/lib/generarEstudiantesPDF"
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
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    deleteStudents,
  } = useStudentList({ pageSize: 2000 })
  const [deleting, setDeleting] = useState(false)
  const [deletingCedulas, setDeletingCedulas] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const selectedArray = Array.from(selectedIds)

  const handleExportPDF = async (selectedFields: string[]) => {
    const rows = selectedIds.size > 0
      ? studentRows.filter(r => selectedIds.has(r.id))
      : studentRows

    const estudiantesPDF: EstudiantePDF[] = rows.map(r => ({
      nombres: r.nombres,
      apellidos: r.apellidos,
      cedula: r.cedula ?? "",
      correo: r.correo,
      telefono: r.telefono,
      direccion: r.direccion,
      ocupacion: r.ocupacion,
      estado_financiero: r.estado_pago,
      saldo: r.saldo_pendiente,
      total_cursos: r.total_cursos,
    }))

    await generarListadoEstudiantesPDF("todos", {
      nombre: "Estudiantes",
      total: rows.length,
    }, estudiantesPDF, selectedFields)
  }

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
    telefono: e.celular,
    direccion: e.perfil_estudiante?.direccion,
    ocupacion: e.perfil_estudiante?.ocupacion,
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

      <div className="sticky top-0 z-20 min-h-[32px]">
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
      </div>

      <StudentExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        selectedIds={selectedArray}
        contexto="todos"
        onExport={handleExportPDF}
        description={`${selectedArray.length > 0 ? selectedArray.length : studentRows.length} estudiante(s).`}
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
