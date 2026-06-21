import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Download04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { StudentTable, type StudentRow } from "../components/StudentTable"
import { BulkActionsBar } from "../components/BulkActionsBar"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { tallerService, type InscripcionTaller } from "@/services/taller.service"
import { toast } from "sonner"

export function EstudiantesTallerDetallePage() {
  const { tallerId } = useParams<{ tallerId: string }>()
  const navigate = useNavigate()

  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)
  const [tallerNombre, setTallerNombre] = useState("")

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
      if (tallerRes?.data?.nombre) setTallerNombre(tallerRes.data.nombre)
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
    estado_pago: undefined,
    total_cursos: undefined,
    saldo_pendiente: undefined,
  }))

  const selectedArray = Array.from(selectedIds)

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
        title="Exportar Participantes del Taller"
        description={`${selectedArray.length > 0 ? selectedArray.length : inscripciones.length} participante(s). Elige formato y campos.`}
      />
    </div>
  )
}
