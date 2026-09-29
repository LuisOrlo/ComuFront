import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Alert02Icon,
  Clock01Icon,
  Tick02Icon,
  Edit01Icon,
  Delete01Icon,
  UserIcon,
  VideoIcon,
  CalendarIcon,
  Mail01Icon,
  CallIcon,
  CheckmarkCircle02Icon,
  PlayIcon,
  RefreshIcon,
  Money01Icon,
  File02Icon,
} from "@hugeicons/core-free-icons"
import { cn, parseLocalDate } from "@/lib/utils"
import {
  edicionVideoService,
  type TrabajoEdicion,
  type EstadoTrabajo,
  ESTADO_TRABAJO_LABELS,
} from "@/services/edicion-video.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

const STEPS: { key: EstadoTrabajo; label: string; num: number }[] = [
  { key: "recibido", label: "Recibido", num: 1 },
  { key: "en_proceso", label: "En Proceso", num: 2 },
  { key: "revision", label: "En Revisión", num: 3 },
  { key: "entregado", label: "Entregado", num: 4 },
]

function getStepIndex(estado: EstadoTrabajo): number {
  switch (estado) {
    case "recibido":
      return 0
    case "en_proceso":
      return 1
    case "revision":
      return 2
    case "entregado":
      return 3
    default:
      return 0
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = dateStr.includes("T") ? new Date(dateStr) : parseLocalDate(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

function getDaysDiff(limitStr?: string) {
  if (!limitStr) return null
  const d = limitStr.includes("T") ? new Date(limitStr) : parseLocalDate(limitStr)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  const diffTime = target.getTime() - today.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

export function EdicionVideoDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [trabajo, setTrabajo] = useState<TrabajoEdicion | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadTrabajo = useCallback(() => {
    if (!id) return
    edicionVideoService
      .getTrabajo(id)
      .then(setTrabajo)
      .catch(() => {
        toast.error("Error al cargar el trabajo de edición")
        navigate("/servicios/edicion-video")
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    loadTrabajo()
  }, [loadTrabajo])

  const changeEstado = async (estado: EstadoTrabajo) => {
    if (!id) return
    setActionLoading(true)
    try {
      await edicionVideoService.updateTrabajo(id, { estado })
      toast.success(`Trabajo movido a ${ESTADO_TRABAJO_LABELS[estado]}`)
      loadTrabajo()
    } catch {
      toast.error("Error al actualizar el estado")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegistrarEntrega = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await edicionVideoService.registrarEntrega(id, { fecha_entrega: new Date().toISOString() })
      toast.success("Entrega del trabajo registrada")
      loadTrabajo()
    } catch {
      toast.error("Error al registrar la entrega")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegistrarCobro = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await edicionVideoService.registrarCobro(id)
      toast.success("Cobro registrado exitosamente")
      loadTrabajo()
    } catch {
      toast.error("Error al registrar el cobro")
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await edicionVideoService.deleteTrabajo(id)
      toast.success("Trabajo de edición eliminado")
      navigate("/servicios/edicion-video")
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(message || "Error al eliminar el trabajo")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#f8f9ff]">
        <header className="border-b border-slate-200/80 bg-white px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-44 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!trabajo) return null

  const todayStr = new Date().toISOString().split("T")[0]
  const isVencido = trabajo.fecha_limite < todayStr && trabajo.estado !== "entregado"
  const isProximo = !isVencido && trabajo.fecha_limite === todayStr && trabajo.estado !== "entregado"
  const currentStepIdx = getStepIndex(trabajo.estado)
  const daysDiff = getDaysDiff(trabajo.fecha_limite)

  const clienteNombre =
    trabajo.cliente
      ? `${trabajo.cliente.nombres} ${trabajo.cliente.apellidos}`
      : trabajo.cliente_externo
      ? `${trabajo.cliente_externo.nombres} ${trabajo.cliente_externo.apellidos || ""}`.trim()
      : null

  const clienteEmail = trabajo.cliente?.correo || trabajo.cliente_externo?.correo
  const clienteTelefono = trabajo.cliente_externo?.celular
  const clienteCedula = trabajo.cliente_externo?.cedula

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8f9ff]">
      {/* Header Compacto y Moderno */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Lado Izquierdo: Volver + Título + Badges */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/servicios/edicion-video"
                className="size-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0 shadow-2xs"
                title="Volver a Edición de Video"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              </Link>

              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] shrink-0 shadow-2xs">
                <HugeiconsIcon icon={VideoIcon} size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                    {trabajo.titulo}
                  </h1>

                  {/* Badges compactos */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                      trabajo.estado === "recibido" && "bg-blue-50 text-blue-700 border-blue-200",
                      trabajo.estado === "en_proceso" && "bg-amber-50 text-amber-700 border-amber-200",
                      trabajo.estado === "revision" && "bg-indigo-50 text-indigo-700 border-indigo-200",
                      trabajo.estado === "entregado" && "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        trabajo.estado === "recibido" && "bg-blue-500",
                        trabajo.estado === "en_proceso" && "bg-amber-500",
                        trabajo.estado === "revision" && "bg-indigo-500",
                        trabajo.estado === "entregado" && "bg-emerald-500"
                      )}
                    />
                    {ESTADO_TRABAJO_LABELS[trabajo.estado]}
                  </span>

                  {isVencido && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <HugeiconsIcon icon={Alert02Icon} size={11} />
                      Vencido
                    </span>
                  )}

                  {isProximo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <HugeiconsIcon icon={Clock01Icon} size={11} />
                      Vence hoy
                    </span>
                  )}

                  {trabajo.cobro_registrado && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <HugeiconsIcon icon={Tick02Icon} size={11} />
                      Cobrado
                    </span>
                  )}
                </div>

                
              </div>
            </div>

            {/* Lado Derecho: Acciones Editar y Eliminar */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/servicios/edicion-video/${id}/editar`}
                className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                <HugeiconsIcon icon={Edit01Icon} size={14} className="text-slate-500" />
                <span>Editar</span>
              </Link>

              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all active:scale-[0.98]"
              >
                <HugeiconsIcon icon={Delete01Icon} size={14} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal Proporcionado y Ajustado */}
      <main className="flex-1 overflow-y-auto max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Stepper y Barra de Acción Integrados en una sola tarjeta compacta */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* 4 Pasos compactos */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1">
              {STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIdx
                const isCurrent = idx === currentStepIdx

                return (
                  <div key={step.key} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                        isCurrent && "bg-orange-50 text-[#fd761a] border border-orange-200 shadow-2xs",
                        isPassed && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        !isPassed && !isCurrent && "bg-slate-50 text-slate-400 border border-slate-100"
                      )}
                    >
                      <span
                        className={cn(
                          "size-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                          isCurrent && "bg-[#fd761a] text-white",
                          isPassed && "bg-emerald-600 text-white",
                          !isPassed && !isCurrent && "bg-slate-200 text-slate-500"
                        )}
                      >
                        {isPassed ? "✓" : step.num}
                      </span>
                      <span>{step.label}</span>
                    </div>

                    {idx < STEPS.length - 1 && (
                      <span className="text-slate-300 hidden sm:inline">→</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Botón de Siguiente Acción Directa */}
            <div className="flex items-center gap-2 shrink-0">
              {trabajo.estado === "recibido" && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => changeEstado("en_proceso")}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06513] shadow-2xs transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <HugeiconsIcon icon={PlayIcon} size={14} />
                  <span>Iniciar Trabajo</span>
                </button>
              )}

              {trabajo.estado === "en_proceso" && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => changeEstado("revision")}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <HugeiconsIcon icon={RefreshIcon} size={14} />
                  <span>Enviar a Revisión</span>
                </button>
              )}

              {trabajo.estado === "revision" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => changeEstado("en_proceso")}
                    className="h-9 px-3 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Volver a Proceso
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleRegistrarEntrega}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    <HugeiconsIcon icon={Tick02Icon} size={14} />
                    <span>Registrar Entrega</span>
                  </button>
                </div>
              )}

              {trabajo.estado === "entregado" && !trabajo.cobro_registrado && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleRegistrarCobro}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <HugeiconsIcon icon={Money01Icon} size={14} />
                  <span>Registrar Cobro</span>
                </button>
              )}

              {trabajo.estado === "entregado" && trabajo.cobro_registrado && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                  Completado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Layout en 2 Columnas Compacto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Columna Izquierda (Principal) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Descripción del Trabajo */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={File02Icon} size={15} className="text-[#fd761a]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Descripción
                </h3>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {trabajo.descripcion || "Sin descripción proporcionada."}
              </p>
            </div>

            {/* Fechas y Cronograma */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={CalendarIcon} size={15} className="text-[#fd761a]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Fechas y Plazos
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Fecha Solicitud */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Solicitud
                  </span>
                  <p className="text-xs font-bold text-slate-800">{formatDate(trabajo.fecha_recibo)}</p>
                </div>

                {/* Fecha Límite */}
                <div
                  className={cn(
                    "p-3 rounded-lg border space-y-0.5",
                    isVencido
                      ? "bg-rose-50/70 border-rose-200 text-rose-800"
                      : isProximo
                      ? "bg-amber-50/70 border-amber-200 text-amber-800"
                      : "bg-slate-50 border-slate-100 text-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isVencido ? "text-rose-600" : isProximo ? "text-amber-600" : "text-slate-400"
                      )}
                    >
                      Límite
                    </span>
                    {isVencido && <span className="text-[10px] font-bold text-rose-600">Vencida</span>}
                    {isProximo && <span className="text-[10px] font-bold text-amber-600">Hoy</span>}
                  </div>
                  <p className="text-xs font-bold">{formatDate(trabajo.fecha_limite)}</p>
                  {daysDiff !== null && (
                    <p className="text-[10px] opacity-75">
                      {isVencido
                        ? `Hace ${Math.abs(daysDiff)} día(s)`
                        : daysDiff > 0
                        ? `En ${daysDiff} día(s)`
                        : "Hoy"}
                    </p>
                  )}
                </div>

                {/* Fecha Entrega */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Entrega
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {trabajo.fecha_entrega ? formatDate(trabajo.fecha_entrega) : "Pendiente"}
                  </p>
                </div>
              </div>
            </div>

            {/* Observaciones / Notas */}
            {trabajo.notas && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Notas u Observaciones
                </h3>
                <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-200/70">
                  <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {trabajo.notas}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha (Sidebar) */}
          <div className="space-y-4">
            {/* Cliente */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Cliente
              </h3>

              {clienteNombre ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center font-bold text-xs shrink-0">
                      <HugeiconsIcon icon={UserIcon} size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {clienteNombre}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {trabajo.cliente ? "Cliente Registrado" : "Cliente Externo"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    {clienteEmail && (
                      <div className="flex items-center gap-2 truncate">
                        <HugeiconsIcon icon={Mail01Icon} size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{clienteEmail}</span>
                      </div>
                    )}
                    {clienteTelefono && (
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={CallIcon} size={13} className="text-slate-400 shrink-0" />
                        <span>{clienteTelefono}</span>
                      </div>
                    )}
                    {clienteCedula && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">CI:</span>
                        <span>{clienteCedula}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Sin cliente asignado.</p>
              )}
            </div>

            {/* Editores Asignados */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Editores ({trabajo.editores?.length || 0})
                </h3>
              </div>

              {trabajo.editores && trabajo.editores.length > 0 ? (
                <div className="space-y-1.5">
                  {trabajo.editores.map((ed) => (
                    <div
                      key={ed.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="size-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {(ed.nombres?.charAt(0) || "") + (ed.apellidos?.charAt(0) || "")}
                      </div>
                      <span className="font-medium text-slate-800 truncate">
                        {ed.nombres} {ed.apellidos}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Sin editores asignados.</p>
              )}
            </div>

            {/* Resumen Financiero */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Detalle Financiero
              </h3>

              {trabajo.precio_cobrado != null ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">Precio Cobrado:</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-slate-900">
                        ${Number(trabajo.precio_cobrado).toFixed(2)}
                      </span>
                      {trabajo.precio_original && Number(trabajo.precio_original) > 0 && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ${Number(trabajo.precio_original).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {trabajo.monto_descuento && Number(trabajo.monto_descuento) > 0 && (
                    <div className="p-2 rounded-lg bg-orange-50 border border-orange-100 text-[11px] text-orange-800 space-y-0.5">
                      <p className="font-semibold">
                        Descuento: -${Number(trabajo.monto_descuento).toFixed(2)}
                      </p>
                      {trabajo.motivo_descuento && (
                        <p className="italic text-orange-700">"{trabajo.motivo_descuento}"</p>
                      )}
                    </div>
                  )}

                  {trabajo.monto_recargo && Number(trabajo.monto_recargo) > 0 && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                      <p className="font-semibold">
                        Recargo: +${Number(trabajo.monto_recargo).toFixed(2)}
                      </p>
                      {trabajo.motivo_recargo && (
                        <p className="italic text-amber-800">"{trabajo.motivo_recargo}"</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500">Estado del Pago:</span>
                    <span
                      className={cn(
                        "font-semibold px-2 py-0.5 rounded text-[10px]",
                        trabajo.cobro_registrado
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      )}
                    >
                      {trabajo.cobro_registrado ? "Cobrado" : "Pendiente"}
                    </span>
                  </div>

                  {trabajo.cuenta_por_cobrar && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500">
                        <span>Abonado:</span>
                        <span className="text-emerald-600 font-semibold">
                          ${Number(trabajo.cuenta_por_cobrar.monto_abonado).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                        <span className="text-slate-700">Saldo pendiente:</span>
                        <span className="text-rose-600">
                          ${Number(trabajo.cuenta_por_cobrar.saldo_pendiente).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Sin costo fijado.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmationModal
        isOpen={deleteConfirm}
        title="Eliminar Trabajo de Edición"
        message={`¿Estás seguro de que deseas eliminar el trabajo "${trabajo.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar trabajo"
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
