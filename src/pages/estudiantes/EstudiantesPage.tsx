import { useState, useEffect } from "react"
import { Link } from "react-router"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalIcon, BarChartIcon, LayersIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { useStudentList } from "./hooks/useStudentList"
import { StudentFilters } from "./components/StudentFilters"
import { StudentTable } from "./components/StudentTable"
import { BulkActionsBar } from "./components/BulkActionsBar"
import { StudentCreateModal } from "./components/StudentCreateModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { estudiantesService, type Segment } from "@/services/estudiantes.service"

export function EstudiantesPage() {
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
    refreshData,
  } = useStudentList()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [segments, setSegments] = useState<Segment[]>([])
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bulkExportOpen, setBulkExportOpen] = useState(false)
  const [bulkFormat, setBulkFormat] = useState<"excel" | "pdf">("excel")
  const [bulkFields, setBulkFields] = useState<string[]>(["nombres", "apellidos", "cedula", "correo", "celular", "edad", "direccion", "ocupacion", "estado_civil", "total_cursos", "estado_pago", "saldo_pendiente"])
  const [bulkExporting, setBulkExporting] = useState(false)

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

  const handleBulkExport = async () => {
    if (selectedArray.length === 0) return
    setBulkExporting(true)
    try {
      const blob = await estudiantesService.exportStudents({
        formato: bulkFormat,
        ids: selectedArray,
        campos: bulkFields,
      })
      const ext = bulkFormat === "excel" ? "xlsx" : "pdf"
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `estudiantes_seleccionados.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      setBulkExportOpen(false)
    } catch {
      // silent
    } finally {
      setBulkExporting(false)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedArray.length === 0) return
    setDeleting(true)
    await deleteStudents(selectedArray)
    setDeleting(false)
    setConfirmDeleteOpen(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-black">Estudiantes</h1>
          
        </div>

        <div className="flex items-center gap-2">
          <StudentCreateModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onCreated={refreshData}
          />

          <div className="relative">
            <button
              onClick={() => setActionsOpen(!actionsOpen)}
              className="inline-flex items-center justify-center size-10 rounded-xl border bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
            </button>
            {actionsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-2xl shadow-xl z-20 p-1.5 overflow-hidden">
                  <Link
                    to="/estudiantes/estadisticas"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <HugeiconsIcon icon={BarChartIcon} size={15} />
                    Estadisticas
                  </Link>
                  <Link
                    to="/estudiantes/segmentos"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <HugeiconsIcon icon={LayersIcon} size={15} />
                    Gestionar Segmentos
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

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
          selectedIds={selectedArray}
        />
      </div>

      <div className="min-h-[32px]">
        <BulkActionsBar
          selectedCount={selectedArray.length}
          onClear={clearSelection}
          onDelete={() => setConfirmDeleteOpen(true)}
          onExport={() => setBulkExportOpen(true)}
        />
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden border-gray-100">
        <StudentTable
          estudiantes={estudiantes}
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

      <Dialog.Root open={bulkExportOpen} onOpenChange={setBulkExportOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] w-full max-w-lg p-0 z-50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
              <div>
                <Dialog.Title className="text-xl font-black text-gray-900">Exportar Seleccion</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-1">
                  {selectedArray.length} estudiante(s) seleccionado(s). Elige formato y campos.
                </Dialog.Description>
              </div>
              <Dialog.Close className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </Dialog.Close>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3 block">Formato</label>
                <div className="flex gap-2">
                  {(["excel", "pdf"] as const).map(f => (
                    <button key={f} onClick={() => setBulkFormat(f)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${bulkFormat === f ? 'text-white border-transparent shadow-sm' : 'text-gray-600 bg-white hover:bg-gray-50'}`}
                      style={bulkFormat === f ? { backgroundColor: "#2563eb" } : {}}
                    >
                      {f === "excel" ? "Excel" : "PDF"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3 block">Campos a exportar</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "nombres", label: "Nombres" },
                    { key: "apellidos", label: "Apellidos" },
                    { key: "cedula", label: "Cedula" },
                    { key: "correo", label: "Correo" },
                    { key: "celular", label: "Celular" },
                    { key: "edad", label: "Edad" },
                    { key: "direccion", label: "Direccion" },
                    { key: "ocupacion", label: "Ocupacion" },
                    { key: "estado_civil", label: "Estado Civil" },
                    { key: "total_cursos", label: "Total Cursos" },
                    { key: "estado_pago", label: "Estado Pago" },
                    { key: "saldo_pendiente", label: "Saldo" },
                  ].map(field => (
                    <label key={field.key} className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={bulkFields.includes(field.key)}
                        onChange={() => setBulkFields(p => p.includes(field.key) ? p.filter(f => f !== field.key) : [...p, field.key])}
                        className="size-4 rounded border-gray-300" />
                      <span className="text-xs font-medium text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Dialog.Close className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</Dialog.Close>
                <button onClick={handleBulkExport} disabled={bulkFields.length === 0 || bulkExporting}
                  className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: "#2563eb" }}>
                  {bulkExporting ? "Exportando..." : `Exportar ${selectedArray.length} Estudiante(s)`}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
