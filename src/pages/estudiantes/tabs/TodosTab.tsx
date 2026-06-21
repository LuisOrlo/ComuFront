import { useState, useEffect, useCallback } from "react"
import { useStudentList } from "../hooks/useStudentList"
import { StudentFilters } from "../components/StudentFilters"
import { StudentTable, type StudentRow } from "../components/StudentTable"
import { BulkActionsBar } from "../components/BulkActionsBar"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { estudiantesService, type Segment } from "@/services/estudiantes.service"

export function TodosTab() {
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

  const [segments, setSegments] = useState<Segment[]>([])
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    estudiantesService.getSegments().then(setSegments).catch(() => {})
  }, [])

  const handleSegmentClick = (seg: Segment | null) => {
    if (!seg) {
      setActiveSegmentId(null)
      setPaymentFilter("todos")
      setSearch("")
      return
    }
    setActiveSegmentId(seg.id)
    if (seg.criterios.estado_pago) {
      setPaymentFilter(seg.criterios.estado_pago as "todos" | "deudor" | "abonado" | "al_dia")
    } else {
      setPaymentFilter("todos")
    }
  }

  const selectedArray = Array.from(selectedIds)

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedArray.length === 0) return
    setDeleting(true)
    await deleteStudents(selectedArray)
    setDeleting(false)
    setConfirmDeleteOpen(false)
  }, [selectedArray, deleteStudents])

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
    <div>
      <div className="mb-4">
        <StudentFilters
          search={search}
          onSearchChange={setSearch}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={(f) => { setPaymentFilter(f); setActiveSegmentId(null) }}
          stats={stats}
          segments={segments}
          activeSegmentId={activeSegmentId}
          onSegmentClick={handleSegmentClick}
        />
      </div>

      <div className="min-h-[32px]">
        <BulkActionsBar
          selectedCount={selectedArray.length}
          onClear={clearSelection}
          onDelete={() => setConfirmDeleteOpen(true)}
          onExport={() => setExportOpen(true)}
        />
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden border-gray-100">
        <StudentTable
          estudiantes={studentRows}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />

        {meta && meta.ultima_pagina > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50/30 flex justify-between items-center">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>Pagina {meta.actual} de {meta.ultima_pagina}</span>
              <span className="text-gray-300">·</span>
              <span>{meta.total} estudiantes</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={meta.actual === 1}
                onClick={() => loadPage(meta.actual - 1)}
                className="px-3 py-1.5 border rounded-lg text-xs font-bold bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                Anterior
              </button>
              <button
                disabled={meta.actual === meta.ultima_pagina}
                onClick={() => loadPage(meta.actual + 1)}
                className="px-3 py-1.5 border rounded-lg text-xs font-bold bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                Siguiente
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
    </div>
  )
}
