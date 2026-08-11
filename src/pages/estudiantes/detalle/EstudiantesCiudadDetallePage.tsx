import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Download04Icon, MapPinIcon, UserGroupIcon, GraduationCapIcon, BookOpenIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { InfoBadge } from "@/components/InfoBadge"
import { StudentTable, type StudentRow } from "../components/StudentTable"
import { BulkActionsBar } from "../components/BulkActionsBar"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { estudiantesService } from "@/services/estudiantes.service"
import { toast } from "sonner"
import { generarListadoEstudiantesPDF, type EstudiantePDF } from "@/lib/generarEstudiantesPDF"

export function EstudiantesCiudadDetallePage() {
  const { ciudadId } = useParams<{ ciudadId: string }>()
  const navigate = useNavigate()
  const ciudadNombre = ciudadId ? decodeURIComponent(ciudadId) : ""

  const [estudiantes, setEstudiantes] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [ciudadStats, setCiudadStats] = useState<{ cursos_activos: number; talleres_activos: number }>({ cursos_activos: 0, talleres_activos: 0 })
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
          telefono: e.celular,
          direccion: e.perfil_estudiante?.direccion,
          ocupacion: e.perfil_estudiante?.ocupacion,
          estado_pago: e.estado_pago,
          total_cursos: e.total_cursos,
          saldo_pendiente: e.saldo_pendiente,
        }))
      setEstudiantes(filtered)

      try {
        const cResp = await estudiantesService.getCiudades({ buscar: ciudadNombre })
        const found = (cResp.datos || []).find(c => c.ciudad.toLowerCase() === nameLower)
        if (found) setCiudadStats({ cursos_activos: found.cursos_activos, talleres_activos: found.talleres_activos })
      } catch { /* silent */ }
    } catch {
      toast.error("Error al cargar estudiantes")
    } finally {
      setLoading(false)
    }
  }, [ciudadNombre])

  useEffect(() => {

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

  const handleExportPDF = async (selectedFields: string[]) => {
    const rows = selectedIds.size > 0
      ? estudiantes.filter(r => selectedIds.has(r.id))
      : estudiantes

    const estudiantesPDF: EstudiantePDF[] = rows.map(r => ({
      nombres: r.nombres ?? "",
      apellidos: r.apellidos ?? "",
      cedula: r.cedula ?? "",
      correo: r.correo,
      telefono: r.telefono,
      ciudad: r.ciudad,
      direccion: r.direccion,
      ocupacion: r.ocupacion,
      total_cursos: r.total_cursos,
    }))

    await generarListadoEstudiantesPDF("ciudad", {
      nombre: ciudadNombre,
      ciudad: ciudadNombre,
      total: rows.length,
    }, estudiantesPDF, selectedFields)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate("/estudiantes")}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-5"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
        Volver a Estudiantes
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${COLORS.ACCENT}18` }}
          >
            <HugeiconsIcon icon={MapPinIcon} size={28} style={{ color: COLORS.ACCENT }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-black">{ciudadNombre}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-400">
                <span className="font-semibold text-gray-600">{estudiantes.length}</span> estudiante{estudiantes.length !== 1 ? 's' : ''}
              </span>
              <span className="size-1 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-400">Vista detallada</span>
            </div>
          </div>
        </div>

        {ciudadStats.cursos_activos > 0 || ciudadStats.talleres_activos > 0 ? (
          <div
            className="rounded-2xl border bg-white p-6 mb-6"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div className="grid grid-cols-3 gap-4">
              <InfoBadge icon={UserGroupIcon} label="Estudiantes" value={String(estudiantes.length)} />
              <InfoBadge icon={GraduationCapIcon} label="Cursos activos" value={String(ciudadStats.cursos_activos)} />
              <InfoBadge icon={BookOpenIcon} label="Talleres activos" value={String(ciudadStats.talleres_activos)} />
            </div>
          </div>
        ) : null}

        <button
          onClick={() => setExportOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shrink-0"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={Download04Icon} size={16} />
          Exportar PDF
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
        contexto="ciudad"
        onExport={handleExportPDF}
        title="Exportar PDF"
        description={`${selectedArray.length > 0 ? selectedArray.length : estudiantes.length} estudiante(s).`}
      />
    </div>
  )
}
