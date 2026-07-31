import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Download04Icon, UserIcon, Calendar02Icon, LibraryIcon, MapsLocation01Icon, AiFolderIcon, BookOpenIcon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { InfoBadge } from "@/components/InfoBadge"
import { StudentTable, type StudentRow } from "../components/StudentTable"
import { BulkActionsBar } from "../components/BulkActionsBar"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { cursosService, type MatriculaDetallada, type Curso } from "@/services/cursos.service"
import { estudiantesService, type Estudiante } from "@/services/estudiantes.service"
import { toast } from "sonner"
import { generarListadoEstudiantesPDF, type EstudiantePDF } from "@/lib/generarEstudiantesPDF"

export function EstudiantesCursoDetallePage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const navigate = useNavigate()

  const [matriculas, setMatriculas] = useState<MatriculaDetallada[]>([])
  const [estudiantesMap, setEstudiantesMap] = useState<Map<string, Estudiante>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)
  const [cursoNombre, setCursoNombre] = useState("")
  const [curso, setCurso] = useState<Curso | null>(null)

  const loadData = useCallback(async () => {
    if (!cursoId) return
    setLoading(true)
    try {
      const [mats, curso, estResp] = await Promise.all([
        cursosService.getMatriculasCurso(cursoId),
        cursosService.getCursoById(cursoId).catch(() => null),
        estudiantesService.getEstudiantes({ per_page: 2000 }),
      ])

      const allEstudiantes = estResp.datos || []
      const map = new Map<string, Estudiante>()
      for (const e of allEstudiantes) {
        if (e.cedula) map.set(e.cedula, e)
      }
      setEstudiantesMap(map)

      setMatriculas(mats || [])
      if (curso) { setCursoNombre(curso.nombre); setCurso(curso) }
    } catch {
      toast.error("Error al cargar estudiantes del curso")
    } finally {
      setLoading(false)
    }
  }, [cursoId])

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
    if (selectedIds.size === matriculas.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(matriculas.map((_m, i) => String(i))))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const studentRows: StudentRow[] = matriculas.map((m, idx) => {
    const est = m.estudiante
    const ext = m.solicitud_inscripcion?.participante_externo
    const solEst = m.solicitud_inscripcion?.estudiante

    const nombres = est?.nombres || ext?.nombres || solEst?.nombres || "—"
    const apellidos = est?.apellidos || ext?.apellidos || solEst?.apellidos || ""
    const cedula = est?.cedula || ext?.cedula || solEst?.cedula
    const correo = est?.correo || ext?.correo || solEst?.correo

    const estudianteRecord = cedula ? estudiantesMap.get(cedula) : undefined

    return {
      id: estudianteRecord?.id || est?.id || `mat-${idx}`,
      nombres,
      apellidos,
      cedula,
      correo,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      telefono: est?.celular || (ext as any)?.celular || (solEst as any)?.celular || estudianteRecord?.celular,
      estado_pago: estudianteRecord?.estado_pago || "ninguno",
      total_cursos: estudianteRecord?.total_cursos ?? 0,
      saldo_pendiente: estudianteRecord?.saldo_pendiente ?? 0,
    }
  })

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
      estado_financiero: r.estado_pago,
      saldo: r.saldo_pendiente,
      total_cursos: r.total_cursos,
    }))

    await generarListadoEstudiantesPDF("curso", {
      nombre: cursoNombre || "Curso",
      instructor: curso?.instructor,
      total: rows.length,
    }, estudiantesPDF, selectedFields)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate("/estudiantes?tab=cursos")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm mb-6"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
        Volver a Cursos
      </button>

      <header className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-black">{cursoNombre || "Curso"}</h1>
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] shadow-sm"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            <HugeiconsIcon icon={Download04Icon} size={14} />
            Exportar PDF
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1">{matriculas.length} estudiante{matriculas.length !== 1 ? 's' : ''} matriculado{matriculas.length !== 1 ? 's' : ''}</p>
      </header>

      {curso && (
        <div
          className="rounded-2xl border bg-white p-6 mb-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoBadge icon={UserIcon} label="Instructor" value={curso.instructor || "—"} />
            <InfoBadge icon={Calendar02Icon} label="Inicio" value={curso.fechaInicio ? new Date(curso.fechaInicio).toLocaleDateString("es-ES") : "—"} />
            <InfoBadge icon={Calendar02Icon} label="Fin" value={curso.fechaFin ? new Date(curso.fechaFin).toLocaleDateString("es-ES") : "—"} />
            <InfoBadge icon={LibraryIcon} label="Modalidad" value={curso.modalidad === "virtual" ? "Virtual" : "Presencial"} />
            <InfoBadge icon={MapsLocation01Icon} label="Ciudad" value={curso.modalidad === "virtual" ? "No aplica" : curso.ciudad || "—"} />
            <InfoBadge icon={AiFolderIcon} label="Catálogo" value={curso.catalogoNombre || "—"} />
            <InfoBadge icon={BookOpenIcon} label="Módulos" value={`${curso.moduloActual || 0}/${curso.totalModulos || 0}`} />
            <InfoBadge icon={UserGroupIcon} label="Capacidad" value={`${curso.estudiantes}/${curso.capacidad}`} />
          </div>
        </div>
      )}

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
          estudiantes={studentRows}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          variant="participantes"
        />
      </div>

      <StudentExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        selectedIds={selectedArray}
        contexto="curso"
        onExport={handleExportPDF}
        title="Exportar PDF"
        description={`${selectedArray.length > 0 ? selectedArray.length : matriculas.length} estudiante(s).`}
      />
    </div>
  )
}
