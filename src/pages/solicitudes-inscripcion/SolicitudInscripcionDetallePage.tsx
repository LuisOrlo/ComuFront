import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeftIcon,
  CheckCircle,
  AlertCircle,
  FileIcon,
  Download02Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { 
  solicitudesInscripcionService, 
  type SolicitudInscripcionDetallada 
} from "@/services/solicitudes-inscripcion.service"
import { toast } from "sonner"

export function SolicitudInscripcionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [solicitud, setSolicitud] = useState<SolicitudInscripcionDetallada | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [observaciones, setObservaciones] = useState("")
  const [motivo, setMotivo] = useState("")

  const cargarDetalle = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await solicitudesInscripcionService.getSolicitudDetalle(id)
      setSolicitud(data)
    } catch (err) {
      console.error("Error cargando solicitud:", err)
      setError("Error al cargar los detalles de la solicitud.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) cargarDetalle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleAprobar = async () => {
    if (!solicitud) return
    setProcesando(true)
    try {
      const resultado = await solicitudesInscripcionService.aprobarSolicitud(solicitud.id, {
        observaciones_validacion: observaciones,
      })
      toast.success(resultado.mensaje)
      setShowApprovalForm(false)
      cargarDetalle()
    } catch (err) {
      console.error("Error aprobando:", err)
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al aprobar solicitud")
    } finally {
      setProcesando(false)
    }
  }

  const handleRechazar = async () => {
    if (!solicitud || !motivo.trim()) {
      toast.error("Por favor ingresa un motivo de rechazo")
      return
    }
    setProcesando(true)
    try {
      const resultado = await solicitudesInscripcionService.rechazarSolicitud(solicitud.id, {
        motivo_rechazo: motivo,
      })
      toast.success(resultado.mensaje)
      setShowRejectionForm(false)
      cargarDetalle()
    } catch (err) {
      console.error("Error rechazando:", err)
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al rechazar solicitud")
    } finally {
      setProcesando(false)
    }
  }

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case "aprobado":
        return { bg: `${COLORS.ACCENT}15`, text: COLORS.ACCENT, icon: CheckCircle }
      case "rechazado":
        return { bg: "#ff444415", text: "#ff4444", icon: AlertCircle }
      case "pendiente_validacion":
      case "registrado":
        return { bg: "#ffaa0015", text: "#ffaa00", icon: AlertCircle }
      default:
        return { bg: "#f0f0f0", text: COLORS.TEXT_MUTED, icon: AlertCircle }
    }
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      registrado: "Registrado",
      pendiente_validacion: "Pendiente de Validación",
      aprobado: "Aprobado",
      rechazado: "Rechazado",
      matricula_creada: "Matrícula Creada",
      cancelado: "Cancelado",
    }
    return labels[estado] || estado
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
        <div style={{ color: COLORS.TEXT_MUTED }}>Cargando solicitud...</div>
      </div>
    )
  }

  if (error || !solicitud) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
        <div className="text-center">
          <p style={{ color: "#ff4444" }}>{error || "Solicitud no encontrada"}</p>
          <button
            onClick={() => navigate("/solicitudes-inscripcion")}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  const estadoStyle = getEstadoStyle(solicitud.estado)
  const IconoEstado = estadoStyle.icon
  const puedeValidar = ["registrado", "pendiente_validacion"].includes(solicitud.estado)

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden" style={{ backgroundColor: "#f9fafb" }}>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/solicitudes-inscripcion")}
              className="inline-flex items-center gap-1 text-xs font-medium transition-colors duration-180 hover:underline"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              <HugeiconsIcon icon={ArrowLeftIcon} size={12} />
              Volver
            </button>
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5"
                style={{ backgroundColor: estadoStyle.bg, color: estadoStyle.text }}
              >
                <HugeiconsIcon icon={IconoEstado} size={16} />
                {getEstadoLabel(solicitud.estado)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Información */}
            <div className="lg:col-span-2 space-y-6">
              {/* Datos del Solicitante */}
              <div className="rounded-lg border bg-white p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.CHARCOAL }}>
                  Datos del Solicitante
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Nombres</p>
                      <p className="text-sm mt-1 font-medium" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.estudiante?.nombres || solicitud.participanteExterno?.nombres || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Apellidos</p>
                      <p className="text-sm mt-1 font-medium" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.estudiante?.apellidos || solicitud.participanteExterno?.apellidos || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Correo</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.estudiante?.correo || solicitud.participanteExterno?.correo || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Teléfono</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.estudiante?.celular || solicitud.participanteExterno?.celular || "N/A"}
                      </p>
                    </div>
                  </div>
                  {(solicitud.participanteExterno?.cedula) && (
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Cédula</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.participanteExterno.cedula}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Ocupación</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.participanteExterno?.ocupacion || solicitud.estudiante?.perfil_estudiante?.ocupacion || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Estado Civil</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.participanteExterno?.estado_civil || solicitud.estudiante?.perfil_estudiante?.estado_civil || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Edad</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.participanteExterno?.edad ?? solicitud.estudiante?.perfil_estudiante?.edad ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Dirección</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.participanteExterno?.direccion || solicitud.estudiante?.perfil_estudiante?.direccion || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Curso Solicitado */}
              <div className="rounded-lg border bg-white p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.CHARCOAL }}>
                  Curso Solicitado
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Nombre</p>
                    <p className="text-sm mt-1 font-medium flex items-center gap-1.5" style={{ color: COLORS.CHARCOAL }}>
                      {solicitud.cursoAbierto?.catalogo?.color && (
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: solicitud.cursoAbierto.catalogo.color }} />
                      )}
                      {solicitud.cursoAbierto?.catalogo?.nombre || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Descripción</p>
                    <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                      {solicitud.cursoAbierto?.catalogo?.descripcion || "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Precio Base</p>
                      <p className="text-sm mt-1 font-medium" style={{ color: COLORS.ACCENT }}>
                        ${solicitud.cursoAbierto?.precio_base?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Capacidad</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.cursoAbierto?.estudiantes_inscritos || 0} / {solicitud.cursoAbierto?.capacidad_maxima || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Inicio</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {new Date(solicitud.cursoAbierto?.fecha_inicio || "").toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Fin Estimado</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {new Date(solicitud.cursoAbierto?.fecha_fin_estimada || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Pago */}
              <div className="rounded-lg border bg-white p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.CHARCOAL }}>
                  Información de Pago
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Monto Solicitado</p>
                      <p className="text-sm mt-1 font-medium" style={{ color: COLORS.CHARCOAL }}>
                        ${solicitud.monto_solicitado?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Tipo de Pago</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.tipo_pago ? solicitud.tipo_pago.charAt(0).toUpperCase() + solicitud.tipo_pago.slice(1) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Tipo Comprobante</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.tipo_comprobante ? solicitud.tipo_comprobante.charAt(0).toUpperCase() + solicitud.tipo_comprobante.slice(1) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Fecha Pago</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.fecha_pago_declarada ? new Date(solicitud.fecha_pago_declarada).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              {solicitud.archivo_comprobante_url && (
                <div className="rounded-lg border bg-white p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.CHARCOAL }}>
                    Documentos
                  </h2>
                  <a
                    href={solicitud.archivo_comprobante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "#f9fafb" }}
                  >
                    <HugeiconsIcon icon={FileIcon} size={20} style={{ color: COLORS.ACCENT }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
                        Comprobante de Pago
                      </p>
                      <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                        {solicitud.tipo_comprobante}
                      </p>
                    </div>
                    <HugeiconsIcon icon={Download02Icon} size={18} style={{ color: COLORS.ACCENT }} />
                  </a>
                </div>
              )}
            </div>

            {/* Columna derecha: Acciones */}
            <div className="space-y-4">
              {puedeValidar && (
                <>
                  <button
                    onClick={() => setShowApprovalForm(true)}
                    className="w-full px-4 py-3 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: COLORS.ACCENT }}
                  >
                    ✓ Aprobar Solicitud
                  </button>
                  <button
                    onClick={() => setShowRejectionForm(true)}
                    className="w-full px-4 py-3 rounded-lg text-sm font-medium border transition-all active:scale-[0.98]"
                    style={{ borderColor: "#ff4444", color: "#ff4444" }}
                  >
                    ✗ Rechazar Solicitud
                  </button>
                </>
              )}

              {/* Resumen de validación */}
              {solicitud.validador && (
                <div className="rounded-lg border bg-white p-4 space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Validado por</p>
                  <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
                    {solicitud.validador.nombres} {solicitud.validador.apellidos}
                  </p>
                  {solicitud.fecha_validacion && (
                    <>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Fecha</p>
                      <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>
                        {new Date(solicitud.fecha_validacion).toLocaleString()}
                      </p>
                    </>
                  )}
                  {solicitud.observaciones_validacion && (
                    <>
                      <p className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Observaciones</p>
                      <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.observaciones_validacion}
                      </p>
                    </>
                  )}
                  {solicitud.motivo_rechazo && (
                    <>
                      <p className="text-xs font-semibold" style={{ color: "#ff4444" }}>Motivo Rechazo</p>
                      <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>
                        {solicitud.motivo_rechazo}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Aprobación */}
          {showApprovalForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: COLORS.CHARCOAL }}>
                  Aprobar Solicitud
                </h3>
                <textarea
                  placeholder="Observaciones de validación (opcional)"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none resize-none"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowApprovalForm(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                    disabled={procesando}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAprobar}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: COLORS.ACCENT }}
                    disabled={procesando}
                  >
                    {procesando ? "Procesando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Rechazo */}
          {showRejectionForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: COLORS.CHARCOAL }}>
                  Rechazar Solicitud
                </h3>
                <textarea
                  placeholder="Motivo del rechazo (requerido)"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none resize-none"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  rows={4}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRejectionForm(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                    disabled={procesando}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRechazar}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: "#ff4444" }}
                    disabled={procesando || !motivo.trim()}
                  >
                    {procesando ? "Procesando..." : "Rechazar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
