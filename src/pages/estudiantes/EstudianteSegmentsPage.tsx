import { useState, useEffect } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, LayersIcon, Delete02Icon, AddCircleIcon, UserGroupIcon, ChevronRightIcon } from "@hugeicons/core-free-icons"
import { Dialog } from "radix-ui"
import { estudiantesService, type Segment } from "@/services/estudiantes.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"

export function EstudianteSegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadSegments = async () => {
    try {
      const data = await estudiantesService.getSegments()
      setSegments(data)
    } catch {
      toast.error("Error al cargar segmentos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSegments()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await estudiantesService.deleteSegment(deleteTarget.id)
      toast.success("Segmento eliminado")
      loadSegments()
    } catch {
      toast.error("Error al eliminar segmento")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/estudiantes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a listado de estudiantes
      </Link>

      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-black mt-1">Segmentos de Estudiantes</h1>
          <p className="text-black mt-1">Agrupa estudiantes dinamicamente con criterios personalizados.</p>
        </div>
        <CreateSegmentDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={loadSegments} />
      </header>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin size-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <span className="text-sm text-gray-400">Cargando segmentos...</span>
        </div>
      ) : segments.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-2xl">
          <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HugeiconsIcon icon={LayersIcon} size={24} className="text-gray-300" />
          </div>
          <h3 className="text-gray-900 font-bold">No hay segmentos creados</h3>
          <p className="text-sm text-gray-400 mt-1">Crea tu primer segmento para clasificar estudiantes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {segments.map((seg) => (
            <div key={seg.id} className="bg-white border rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-gray-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{seg.nombre}</h3>
                  {seg.descripcion && <p className="text-xs text-gray-400 mt-0.5">{seg.descripcion}</p>}
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {Object.entries(seg.criterios).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded-md bg-gray-100 text-[9px] font-bold text-gray-500 uppercase">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/estudiantes`}
                  className="size-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                  title="Ver estudiantes"
                >
                  <HugeiconsIcon icon={ChevronRightIcon} size={16} className="text-gray-400" />
                </Link>
                <button
                  onClick={() => setDeleteTarget({ id: seg.id, nombre: seg.nombre })}
                  className="size-10 flex items-center justify-center rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Eliminar segmento"
        message={`Estas seguro de eliminar el segmento "${deleteTarget?.nombre}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleting}
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function CreateSegmentDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [criterios, setCriterios] = useState({
    estado_pago: "todos",
    cursos_min: undefined as number | undefined,
    cursos_max: undefined as number | undefined,
    promedio_min: undefined as number | undefined,
    ausencias_min: undefined as number | undefined,
    tardanzas_min: undefined as number | undefined,
  })
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    try {
      const cleanCriterios: Record<string, string | number> = {}
      if (criterios.estado_pago !== "todos") cleanCriterios.estado_pago = criterios.estado_pago
      if (criterios.cursos_min !== undefined) cleanCriterios.cursos_min = criterios.cursos_min
      if (criterios.cursos_max !== undefined) cleanCriterios.cursos_max = criterios.cursos_max
      if (criterios.promedio_min !== undefined) cleanCriterios.promedio_min = criterios.promedio_min
      if (criterios.ausencias_min !== undefined) cleanCriterios.ausencias_min = criterios.ausencias_min
      if (criterios.tardanzas_min !== undefined) cleanCriterios.tardanzas_min = criterios.tardanzas_min

      await estudiantesService.createSegment({ nombre, descripcion: descripcion || undefined, criterios: cleanCriterios })
      toast.success("Segmento creado")
      onOpenChange(false)
      setNombre("")
      setDescripcion("")
      setCriterios({ estado_pago: "todos", cursos_min: undefined, cursos_max: undefined, promedio_min: undefined, ausencias_min: undefined, tardanzas_min: undefined })
      onCreated()
    } catch {
      toast.error("Error al crear segmento")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97] shadow-lg"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={AddCircleIcon} size={18} />
          Nuevo Segmento
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] w-full max-w-lg p-0 z-50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
            <div>
              <Dialog.Title className="text-xl font-black text-gray-900">Nuevo Segmento</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1">Define criterios para agrupar estudiantes automaticamente.</Dialog.Description>
            </div>
            <Dialog.Close className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
              X
            </Dialog.Close>
          </div>
          <div className="p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre *</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Deudores activos" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Descripcion</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripcion opcional del segmento" rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Estado Pago</label>
                <select value={criterios.estado_pago} onChange={e => setCriterios({ ...criterios, estado_pago: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white">
                  <option value="todos">Todos</option>
                  <option value="deudor">Pendientes</option>
                  <option value="abonado">Abonos</option>
                  <option value="al_dia">Al dia</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cursos Minimo</label>
                <input type="number" min={0} value={criterios.cursos_min ?? ""} onChange={e => setCriterios({ ...criterios, cursos_min: e.target.value ? Number(e.target.value) : undefined })} placeholder="Sin minimo" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cursos Maximo</label>
                <input type="number" min={0} value={criterios.cursos_max ?? ""} onChange={e => setCriterios({ ...criterios, cursos_max: e.target.value ? Number(e.target.value) : undefined })} placeholder="Sin maximo" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Promedio Minimo</label>
                <input type="number" min={0} max={10} step={0.1} value={criterios.promedio_min ?? ""} onChange={e => setCriterios({ ...criterios, promedio_min: e.target.value ? Number(e.target.value) : undefined })} placeholder="Sin minimo de promedio" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Ausencias Minimas</label>
                <input type="number" min={0} value={criterios.ausencias_min ?? ""} onChange={e => setCriterios({ ...criterios, ausencias_min: e.target.value ? Number(e.target.value) : undefined })} placeholder="Sin minimo" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Tardanzas Minimas</label>
                <input type="number" min={0} value={criterios.tardanzas_min ?? ""} onChange={e => setCriterios({ ...criterios, tardanzas_min: e.target.value ? Number(e.target.value) : undefined })} placeholder="Sin minimo" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Dialog.Close className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</Dialog.Close>
              <button onClick={handleCreate} disabled={saving || !nombre.trim()} className="px-8 py-3 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-60" style={{ backgroundColor: COLORS.ACCENT }}>
                {saving ? "Creando..." : "Crear Segmento"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
