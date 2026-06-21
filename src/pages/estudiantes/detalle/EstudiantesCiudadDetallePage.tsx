import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Download04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { StudentTable, type StudentRow } from "../components/StudentTable"
import { BulkActionsBar } from "../components/BulkActionsBar"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { estudiantesService } from "@/services/estudiantes.service"
import { toast } from "sonner"

export function EstudiantesCiudadDetallePage() {
  const { ciudadId } = useParams<{ ciudadId: string }>()
  const navigate = useNavigate()
  const ciudadNombre = ciudadId ? decodeURIComponent(ciudadId) : ""

  const [estudiantes, setEstudiantes] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!ciudadNombre) return
    setLoading(true)
    try {
      const resp = await estudiantesService.getEstudiantes({ per_page: 2000 })
      const data = resp.datos || []
      const nameLower = ciudadNombre.toLowerCase()
      const filtered = data
        .filter(e => {
          const c1 = e.ciudad?.nombre?.toLowerCase()
          const c2 = e.perfil_estudiante?.ciudad?.toLowerCase()
          return (c1 && c1 === nameLower) || (c2 && c2 === nameLower)
        })
        .map(e => ({
          id: e.id,
          nombres: e.nombres,
          apellidos: e.apellidos,
          cedula: e.cedula,
          correo: e.correo,
          estado_pago: e.estado_pago,
          total_cursos: e.total_cursos,
          saldo_pendiente: e.saldo_pendiente,
        }))
      setEstudiantes(filtered)
    } catch {
      toast.error("Error al cargar estudiantes")
    } finally {
      setLoading(false)
    }
  }, [ciudadNombre])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === estudiantes.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(estudiantes.map(r => r.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectedArray = Array.from(selectedIds)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate("/estudiantes?tab=ciudades")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm mb-6"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
        Volver a Ciudades
      </button>

      <header className="mb-4">
        <h1 className="text-2xl font-black text-black">{ciudadNombre}</h1>
        <p className="text-sm text-gray-400 mt-1">{estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''} en esta ciudad</p>
      </header>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setExportOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] shadow-sm"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={Download04Icon} size={14} />
          Exportar
        </button>
      </div>

      <div className="min-h-[32px]">
        <BulkActionsBar
          selectedCount={selectedArray.length}
          onClear={clearSelection}
          onDelete={() => {}}
          onExport={() => setExportOpen(true)}
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
      </div>

      <StudentExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        selectedIds={selectedArray}
        extraFilters={{
          buscar: ciudadNombre,
        }}
        title="Exportar Estudiantes de la Ciudad"
        description={`${selectedArray.length > 0 ? selectedArray.length : estudiantes.length} estudiante(s). Elige formato y campos.`}
      />
    </div>
  )
}
