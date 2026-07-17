import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Alert02Icon, Clock01Icon, Tick02Icon,
  Edit01Icon, UserIcon,
} from "@hugeicons/core-free-icons"
import { Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  edicionVideoService,
  type TrabajoEdicion,
  type EstadoTrabajo,
  ESTADO_TRABAJO_LABELS,
} from "@/services/edicion-video.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

const KANBAN_COLUMNS: { key: EstadoTrabajo; label: string; color: string }[] = [
  { key: "recibido", label: "Recibido", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "en_proceso", label: "En proceso", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "revision", label: "Revisión", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "entregado", label: "Entregado", color: "bg-green-100 text-green-700 border-green-200" },
]

export function EdicionVideoDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [trabajo, setTrabajo] = useState<TrabajoEdicion | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadTrabajo = () => {
    if (!id) return
    edicionVideoService.getTrabajo(id).then(setTrabajo).catch(() => {
      toast.error("Error al cargar trabajo")
      navigate("/servicios/edicion-video")
    }).finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTrabajo() }, [id])

  const todayStr = new Date().toISOString().split("T")[0]

  const changeEstado = async (estado: EstadoTrabajo) => {
    if (!id) return
    try {
      await edicionVideoService.updateTrabajo(id, { estado })
      toast.success(`Trabajo movido a ${ESTADO_TRABAJO_LABELS[estado]}`)
      loadTrabajo()
    } catch {
      toast.error("Error al actualizar estado")
    }
  }

  const handleRegistrarEntrega = async () => {
    if (!id) return
    try {
      await edicionVideoService.registrarEntrega(id, { fecha_entrega: new Date().toISOString() })
      toast.success("Entrega registrada")
      loadTrabajo()
    } catch {
      toast.error("Error al registrar entrega")
    }
  }

  const handleRegistrarCobro = async () => {
    if (!id) return
    try {
      await edicionVideoService.registrarCobro(id)
      toast.success("Cobro registrado")
      loadTrabajo()
    } catch {
      toast.error("Error al registrar cobro")
    }
  }

  const confirmDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await edicionVideoService.deleteTrabajo(id)
      toast.success("Trabajo eliminado")
      navigate("/servicios/edicion-video")
    } catch {
      toast.error("Error al eliminar trabajo")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50/30">
        <div className="animate-spin size-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!trabajo) return null

  const isVencido = trabajo.fecha_limite < todayStr && trabajo.estado !== "entregado"
  const isProximo = !isVencido && trabajo.fecha_limite === todayStr && trabajo.estado !== "entregado"
  const col = KANBAN_COLUMNS.find(c => c.key === trabajo.estado)

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 backdrop-blur-md" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center gap-4">
          <Link to="/servicios/edicion-video"
            className="size-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                {trabajo.titulo}
              </h1>
            </div>
            <p className="text-sm opacity-50 mt-0.5">Detalle del trabajo de edición</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/servicios/edicion-video/${id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:bg-gray-50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <HugeiconsIcon icon={Edit01Icon} size={14} />
              Editar
            </Link>
            <button onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border", col?.color || "bg-gray-100")}>
              {ESTADO_TRABAJO_LABELS[trabajo.estado]}
            </span>
            {isVencido && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                <HugeiconsIcon icon={Alert02Icon} size={10} /> Vencido
              </span>
            )}
            {isProximo && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                <HugeiconsIcon icon={Clock01Icon} size={10} /> Vence hoy
              </span>
            )}
            {trabajo.cobro_registrado && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                <HugeiconsIcon icon={Tick02Icon} size={10} /> Cobrado
              </span>
            )}
          </div>

          {/* Descripción */}
          {trabajo.descripcion && (
            <div className="p-5 rounded-2xl bg-white border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>{trabajo.descripcion}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fecha de Recibo</p>
              <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                {new Date(trabajo.fecha_recibo).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fecha Límite</p>
              <p className={cn("text-sm font-bold", isVencido ? "text-red-600" : "")} style={{ color: isVencido ? undefined : COLORS.CHARCOAL }}>
                {new Date(trabajo.fecha_limite).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            {trabajo.fecha_entrega && (
              <div className="p-5 rounded-2xl bg-white border space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fecha de Entrega</p>
                <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                  {new Date(trabajo.fecha_entrega).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            )}
            {trabajo.precio_cobrado != null && (
              <div className="p-5 rounded-2xl bg-white border space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio</p>
                <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                  ${Number(trabajo.precio_cobrado).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Cliente */}
          {trabajo.cliente && (
            <div className="p-5 rounded-2xl bg-white border space-y-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cliente</p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  <HugeiconsIcon icon={UserIcon} size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                    {trabajo.cliente.nombres} {trabajo.cliente.apellidos}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Editores */}
          {trabajo.editores && trabajo.editores.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border space-y-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Editores Asignados</p>
              <div className="flex flex-wrap gap-2">
                {trabajo.editores.map(ed => (
                  <div key={ed.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="size-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                      {ed.nombres.charAt(0)}{ed.apellidos.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-blue-700">{ed.nombres} {ed.apellidos}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {trabajo.notas && (
            <div className="p-5 rounded-2xl bg-white border space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Notas</p>
              <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>{trabajo.notas}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            {trabajo.estado === "recibido" && (
              <button onClick={() => changeEstado("en_proceso")}
                className="flex-1 min-w-[140px] py-3.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all active:scale-[0.98]">
                Iniciar Trabajo
              </button>
            )}
            {trabajo.estado === "en_proceso" && (
              <button onClick={() => changeEstado("revision")}
                className="flex-1 min-w-[140px] py-3.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all active:scale-[0.98]">
                Enviar a Revisión
              </button>
            )}
            {trabajo.estado === "revision" && (
              <>
                <button onClick={() => changeEstado("en_proceso")}
                  className="flex-1 min-w-[140px] py-3.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all active:scale-[0.98]">
                  Volver a Proceso
                </button>
                <button onClick={handleRegistrarEntrega}
                  className="flex-1 min-w-[140px] py-3.5 rounded-xl text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-all active:scale-[0.98]">
                  Registrar Entrega
                </button>
              </>
            )}
            {trabajo.estado === "entregado" && !trabajo.cobro_registrado && (
              <button onClick={handleRegistrarCobro}
                className="flex-1 min-w-[140px] py-3.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all active:scale-[0.98]">
                Registrar Cobro
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirm}
        title="Eliminar Trabajo"
        message={`¿Eliminar el trabajo "${trabajo.titulo}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={deleting}
        icon="trash"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  )
}
