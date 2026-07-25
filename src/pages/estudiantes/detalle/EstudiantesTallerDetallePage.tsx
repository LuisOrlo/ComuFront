import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Download04Icon, UserIcon, Calendar02Icon, LibraryIcon, MapsLocation01Icon, Money02Icon, UserGroupIcon, Clock04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { InfoBadge } from "@/components/InfoBadge"
import { StudentTable, type StudentRow } from "../components/StudentTable"
import { BulkActionsBar } from "../components/BulkActionsBar"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { tallerService, type InscripcionTaller, type Taller } from "@/services/taller.service"
import { toast } from "sonner"
import { generarListadoEstudiantesPDF, type EstudiantePDF } from "@/lib/generarEstudiantesPDF"

export function EstudiantesTallerDetallePage() {
  const { tallerId } = useParams<{ tallerId: string }>()
  const navigate = useNavigate()

  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)
  const [tallerNombre, setTallerNombre] = useState("")
  const [taller, setTaller] = useState<Taller | null>(null)

  const loadData = useCallback(async () => {
    if (!tallerId) return
    setLoading(true)
    try {
      const [insRes, tallerRes] = await Promise.all([
        tallerService.listarInscripciones(tallerId),
        tallerService.obtener(tallerId).catch(() => null),
      ])
      const data = insRes.data || insRes.datos || []
      setInscripciones(Array.isArray(data) ? data : [])
      if (tallerRes?.data?.nombre) {
        setTallerNombre(tallerRes.data.nombre)
        setTaller(tallerRes.data)
      }
    } catch {
      toast.error("Error al cargar participantes del taller")
    } finally {
      setLoading(false)
    }
  }, [tallerId])

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
    if (selectedIds.size === inscripciones.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(inscripciones.map(ins => ins.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const studentRows: StudentRow[] = inscripciones.map(ins => ({
    id: ins.id,
    nombres: ins.nombres,
    apellidos: ins.apellidos,
    cedula: ins.cedula,
    correo: ins.correo,
    telefono: ins.telefono,
    ciudad: ins.ciudad,
    fecha_inscripcion: ins.fecha_inscripcion
      ? new Date(ins.fecha_inscripcion).toLocaleDateString("es-ES")
      : undefined,
    estado_pago: undefined,
    total_cursos: undefined,
    saldo_pendiente: undefined,
  }))

  const selectedArray = Array.from(selectedIds)

  const handleExportPDF = async (selectedFields: string[]) => {
    const rows = selectedIds.size > 0
      ? studentRows.filter(r => selectedIds.has(r.id))
      : studentRows

    const estudiantesPDF: EstudiantePDF[] = inscripciones
      .filter(ins => rows.some(r => r.id === ins.id))
      .map(ins => ({
        nombres: ins.nombres,
        apellidos: ins.apellidos,
        cedula: ins.cedula,
        telefono: ins.telefono,
        ciudad: ins.ciudad,
        ocupacion: ins.ocupacion,
        fecha_inscripcion: ins.fecha_inscripcion
          ? new Date(ins.fecha_inscripcion).toLocaleDateString("es-ES")
          : undefined,
      }))

    await generarListadoEstudiantesPDF("taller", {
      nombre: tallerNombre || "Taller",
      instructor: taller?.instructor ? `${taller.instructor.nombres} ${taller.instructor.apellidos}` : undefined,
      fecha: taller?.fecha ? new Date(taller.fecha).toLocaleDateString("es-ES") : undefined,
      total: rows.length,
    }, estudiantesPDF, selectedFields)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate("/estudiantes?tab=talleres")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm mb-6"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
        Volver a Talleres
      </button>

      <header className="mb-4">
        <h1 className="text-2xl font-black text-black">{tallerNombre || "Taller"}</h1>
        <p className="text-sm text-gray-400 mt-1">{inscripciones.length} participante{inscripciones.length !== 1 ? 's' : ''} inscrito{inscripciones.length !== 1 ? 's' : ''}</p>
      </header>

      {taller && (
        <div
          className="rounded-2xl border bg-white p-6 mb-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoBadge icon={UserIcon} label="Instructor" value={taller.instructor ? `${taller.instructor.nombres} ${taller.instructor.apellidos}` : "—"} />
            <InfoBadge icon={Calendar02Icon} label="Fecha" value={taller.fecha ? new Date(taller.fecha).toLocaleDateString("es-ES") : "—"} />
            <InfoBadge icon={LibraryIcon} label="Modalidad" value={taller.modalidad === "virtual" ? "Virtual" : "Presencial"} />
            <InfoBadge icon={MapsLocation01Icon} label="Ciudad" value={taller.modalidad === "virtual" ? "No aplica" : (taller.ciudad?.nombre || "—")} />
            <InfoBadge icon={Money02Icon} label="Precio" value={`$${Number(taller.precio || 0).toLocaleString()}`} />
            <InfoBadge icon={UserGroupIcon} label="Capacidad" value={`${taller.inscripciones_count || 0}/${taller.capacidad_maxima || 0}`} />
            <InfoBadge icon={Clock04Icon} label="Estado" value={taller.estado || "—"} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setExportOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] shadow-sm"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={Download04Icon} size={14} />
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
        contexto="taller"
        onExport={handleExportPDF}
        title="Exportar PDF"
        description={`${selectedArray.length > 0 ? selectedArray.length : inscripciones.length} participante(s).`}
      />
    </div>
  )
}
