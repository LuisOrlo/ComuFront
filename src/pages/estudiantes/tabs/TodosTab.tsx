import { useState, useCallback } from "react"
import { useSearchParams } from "react-router"
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

interface TodosTabProps {
  exportOpen: boolean
  onExportOpenChange: (open: boolean) => void
}

export function TodosTab({ exportOpen, onExportOpenChange }: TodosTabProps) {
  const [searchParams] = useSearchParams()
  const segmentId = searchParams.get("segmento")
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmDeleteCedulasOpen, setConfirmDeleteCedulasOpen] = useState(false)

  const {
    estudiantes,
    loading,
    search,
    setSearch,
    paymentFilter,
    setPaymentFilter,
    ciudadFilter,
    setCiudadFilter,
    ciudades,
    stats,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    deleteStudents,
    meta,
    loadPage,
  } = useStudentList({ pageSize: 25, segmentId })
  const [deleting, setDeleting] = useState(false)
  const [deletingCedulas, setDeletingCedulas] = useState(false)

  const selectedArray = Array.from(selectedIds)

  const studentRows: StudentRow[] = estudiantes.map((e) => {
    const extra = e as unknown as Record<string, unknown>
    const perfil = e.perfil_estudiante as Record<string, unknown> | null | undefined
    return {
      id: e.id,
      nombres: e.nombres,
      apellidos: e.apellidos,
      cedula: e.cedula,
      correo: e.correo,
      telefono: String(extra.telefono || e.celular || perfil?.celular || perfil?.telefono || ""),
      ciudad: e.ciudad?.nombre || (typeof e.ciudad === "string" ? e.ciudad : undefined) || e.perfil_estudiante?.ciudad || "",
      direccion: String(perfil?.direccion || extra.direccion || ""),
      ocupacion: String(perfil?.ocupacion || extra.ocupacion || ""),
      estado_pago: e.estado_pago,
      total_cursos: e.total_cursos,
      saldo_pendiente: e.saldo_pendiente,
    }
  })

  const handleExportPDF = async (selectedFields: string[]) => {
    let estudiantesPDF: EstudiantePDF[]

    if (segmentId) {
      const segResult = await estudiantesService.getSegmentStudents(segmentId)
      let list = segResult.estudiantes
      if (selectedArray.length > 0) {
        const idSet = new Set(selectedArray)
        list = list.filter(e => idSet.has(e.id))
      } else {
        const term = search.trim().toLowerCase()
        list = list.filter((student) => {
          const fullName = `${student.nombres} ${student.apellidos}`.toLowerCase()
          const city = student.ciudad?.nombre || student.perfil_estudiante?.ciudad || ""
          return (!term || fullName.includes(term) || (student.cedula || "").toLowerCase().includes(term) || (student.correo || "").toLowerCase().includes(term))
            && (paymentFilter === "todos" || student.estado_pago === paymentFilter)
            && (!ciudadFilter || city.toLowerCase() === ciudadFilter.toLowerCase())
        })
      }
      estudiantesPDF = list.map((e) => {
        const extra = e as unknown as Record<string, unknown>
        const perfil = e.perfil_estudiante as Record<string, unknown> | null | undefined
        return {
          nombres: e.nombres,
          apellidos: e.apellidos,
          cedula: e.cedula ?? "",
          correo: e.correo,
          telefono: String(extra.telefono || e.celular || perfil?.celular || perfil?.telefono || ""),
          ciudad: e.ciudad?.nombre || (typeof e.ciudad === "string" ? e.ciudad : undefined) || e.perfil_estudiante?.ciudad || "",
          direccion: String(perfil?.direccion || extra.direccion || ""),
          ocupacion: String(perfil?.ocupacion || extra.ocupacion || ""),
          estado_financiero: e.estado_pago,
          saldo: e.saldo_pendiente,
          total_cursos: e.total_cursos,
        }
      })
    } else {
      try {
        const data = await estudiantesService.getExportData({
          ids: selectedArray.length > 0 ? selectedArray : undefined,
          buscar: search || undefined,
          estado_pago: paymentFilter !== "todos" ? paymentFilter : undefined,
          ciudad: ciudadFilter || undefined,
        })
        estudiantesPDF = data.map((e: Record<string, unknown>) => {
          const perfil = e.perfil_estudiante as Record<string, unknown> | null | undefined
          return {
            nombres: String(e.nombres ?? ""),
            apellidos: String(e.apellidos ?? ""),
            cedula: String(e.cedula ?? ""),
            correo: String(e.correo ?? ""),
            telefono: String(e.telefono || e.celular || ""),
            ciudad: typeof e.ciudad === "string" ? e.ciudad : ((e.ciudad as { nombre?: string } | undefined)?.nombre ?? ""),
            direccion: String(e.direccion || perfil?.direccion || ""),
            ocupacion: String(e.ocupacion || perfil?.ocupacion || ""),
            estado_financiero: String(e.estado_financiero || e.estado_pago || ""),
            saldo: Number(e.saldo ?? e.saldo_pendiente ?? 0),
            total_cursos: Number(e.total_cursos ?? 0),
          }
        })
      } catch {
        const rows = selectedIds.size > 0
          ? studentRows.filter(r => selectedIds.has(r.id))
          : studentRows
        estudiantesPDF = rows.map(r => ({
          nombres: r.nombres,
          apellidos: r.apellidos,
          cedula: r.cedula ?? "",
          correo: r.correo,
          telefono: r.telefono,
          ciudad: r.ciudad,
          direccion: r.direccion,
          ocupacion: r.ocupacion,
          estado_financiero: r.estado_pago,
          saldo: r.saldo_pendiente,
          total_cursos: r.total_cursos,
        }))
      }
    }

    const titleNombre = ciudadFilter ? `Sede ${ciudadFilter}` : (segmentId ? "Segmento de Estudiantes" : "Todos los Estudiantes")

    await generarListadoEstudiantesPDF(
      "todos",
      {
        nombre: titleNombre,
        total: estudiantesPDF.length,
      },
      estudiantesPDF,
      selectedFields
    )
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

  return (
    <>
      <StudentFilters
        search={search}
        onSearchChange={setSearch}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={(f) => { setPaymentFilter(f) }}
        stats={stats}
        ciudadFilter={ciudadFilter}
        onCiudadFilterChange={setCiudadFilter}
        ciudades={ciudades}
        segmentActive={Boolean(segmentId)}
      />

      <div className="sticky top-0 z-20 min-h-[32px]">
        <BulkActionsBar
          selectedCount={selectedArray.length}
          onClear={clearSelection}
          onDelete={() => setConfirmDeleteOpen(true)}
          onExport={() => onExportOpenChange(true)}
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
          meta={meta}
          onPageChange={loadPage}
        />
      </div>

      <StudentExportDialog
        open={exportOpen}
        onOpenChange={onExportOpenChange}
        selectedIds={selectedArray}
        contexto="todos"
        onExport={handleExportPDF}
        description={`${selectedArray.length > 0 ? selectedArray.length : (meta?.total ?? studentRows.length)} estudiante(s).`}
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
