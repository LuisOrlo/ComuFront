import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeftIcon,
  CheckCircle,
  AlertCircle,
  Clock02Icon,
  ChevronRightIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { solicitudesInscripcionService, type SolicitudInscripcionResumen } from "@/services/solicitudes-inscripcion.service"

export function SolicitudesInscripcionPage() {
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState<SolicitudInscripcionResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filtros, setFiltros] = useState({
    estado: "",
    search: "",
  })
  
  const [paginacion, setPaginacion] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 15,
  })

  const cargarSolicitudes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await solicitudesInscripcionService.getSolicitudes(
        {
          estado: filtros.estado || undefined,
          search: filtros.search || undefined,
          per_page: paginacion.perPage,
        },
        paginacion.currentPage
      )
      setSolicitudes(response.data)
      setPaginacion({
        currentPage: response.meta.current_page ?? 1,
        totalPages: response.meta.last_page ?? 1,
        total: response.meta.total ?? 0,
        perPage: response.meta.per_page ?? 15,
      })
    } catch (err) {
      console.error("Error cargando solicitudes:", err)
      setError("Error al cargar las solicitudes. Por favor, intenta de nuevo.")
      setSolicitudes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarSolicitudes()
  }, [filtros, paginacion.currentPage])

  const getEstadoBadgeStyle = (estado: string) => {
    switch (estado) {
      case "aprobado":
        return { bg: `${COLORS.ACCENT}15`, text: COLORS.ACCENT, icon: CheckCircle }
      case "rechazado":
        return { bg: "#ff444415", text: "#ff4444", icon: AlertCircle }
      case "pendiente_validacion":
      case "registrado":
        return { bg: `#ffaa0015`, text: "#ffaa00", icon: Clock02Icon }
      case "matricula_creada":
        return { bg: `${COLORS.ACCENT}15`, text: COLORS.ACCENT, icon: CheckCircle }
      case "cancelado":
        return { bg: "#80808015", text: "#808080", icon: AlertCircle }
      default:
        return { bg: "#f0f0f0", text: COLORS.TEXT_MUTED, icon: AlertCircle }
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "registrado":
        return "Registrado"
      case "pendiente_validacion":
        return "Pendiente"
      case "aprobado":
        return "Aprobado"
      case "rechazado":
        return "Rechazado"
      case "matricula_creada":
        return "Matrícula Creada"
      case "cancelado":
        return "Cancelado"
      default:
        return estado
    }
  }

  const getSolicitanteName = (solicitud: SolicitudInscripcionResumen) => {
    if (solicitud.estudiante) {
      return `${solicitud.estudiante.nombres} ${solicitud.estudiante.apellidos}`
    }
    if (solicitud.participanteExterno) {
      return `${solicitud.participanteExterno.nombres} ${solicitud.participanteExterno.apellidos}`
    }
    return "N/A"
  }

  const getSolicitanteEmail = (solicitud: SolicitudInscripcionResumen) => {
    if (solicitud.estudiante) {
      return solicitud.estudiante.correo
    }
    if (solicitud.participanteExterno) {
      return solicitud.participanteExterno.correo
    }
    return "N/A"
  }

  const handleViewDetalle = (id: string) => {
    navigate(`/solicitudes-inscripcion/${id}`)
  }

  const inicio = (paginacion.currentPage - 1) * paginacion.perPage + 1
  const fin = Math.min(paginacion.currentPage * paginacion.perPage, paginacion.total)

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden" style={{ backgroundColor: "#f9fafb" }}>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* Header */}
          <div>
            <button
              onClick={() => navigate("/matriculas")}
              className="inline-flex items-center gap-1 text-xs font-medium mb-2 transition-colors duration-180 hover:underline"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              <HugeiconsIcon icon={ArrowLeftIcon} size={12} />
              Volver al listado
            </button>
            <h1 className="text-2xl font-semibold" style={{ color: COLORS.CHARCOAL }}>
              Solicitudes de Inscripción
            </h1>
            <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
              Validación y gestión de nuevas solicitudes de estudiantes
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={filtros.search}
                onChange={(e) => setFiltros(p => ({ ...p, search: e.target.value }))}
                className="w-full h-10 px-3 text-sm rounded-lg border outline-none bg-white transition-all"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
            </div>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(p => ({ ...p, estado: e.target.value }))}
              className="h-10 px-3 text-sm rounded-lg border outline-none bg-white cursor-pointer appearance-none"
              style={{ borderColor: COLORS.BORDER_SUBTLE, minWidth: "150px" }}
            >
              <option value="">Todos los estados</option>
              <option value="registrado">Registrado</option>
              <option value="pendiente_validacion">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="matricula_creada">Matrícula Creada</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Estado de carga */}
          {error && (
            <div className="p-4 rounded-lg border" style={{ borderColor: "#ff4444", backgroundColor: "#ff444415" }}>
              <p style={{ color: "#ff4444" }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center" style={{ color: COLORS.TEXT_MUTED }}>
              Cargando solicitudes...
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="p-12 text-center border rounded-lg border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
              No hay solicitudes que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <>
              {/* Lista de solicitudes */}
              <div className="space-y-3">
                {solicitudes.map((solicitud) => {
                  const estadoStyle = getEstadoBadgeStyle(solicitud.estado)
                  const IconoEstado = estadoStyle.icon

                  return (
                    <button
                      key={solicitud.id}
                      onClick={() => handleViewDetalle(solicitud.id)}
                      className="w-full text-left p-4 rounded-lg border transition-all duration-180 hover:shadow-md active:scale-[0.98]"
                      style={{
                        borderColor: COLORS.BORDER_SUBTLE,
                        backgroundColor: "white",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>
                              {getSolicitanteName(solicitud)}
                            </h3>
                            <span
                              className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"
                              style={{ backgroundColor: estadoStyle.bg, color: estadoStyle.text }}
                            >
                              <HugeiconsIcon icon={IconoEstado} size={14} />
                              {getEstadoLabel(solicitud.estado)}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                            {getSolicitanteEmail(solicitud)}
                          </p>
                          {solicitud.cursoAbierto?.catalogo && (
                            <p className="text-xs mt-1 font-medium" style={{ color: COLORS.CHARCOAL }}>
                              {solicitud.cursoAbierto.catalogo.nombre}
                            </p>
                          )}
                          {solicitud.monto_solicitado && (
                            <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                              Monto: ${solicitud.monto_solicitado.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                              {new Date(solicitud.fecha_solicitud).toLocaleDateString()}
                            </p>
                          </div>
                          <HugeiconsIcon
                            icon={ChevronRightIcon}
                            size={18}
                            style={{ color: COLORS.TEXT_MUTED }}
                          />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Paginación */}
              {paginacion.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Mostrando {inicio}-{fin} de {paginacion.total} solicitudes
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaginacion(p => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))}
                      disabled={paginacion.currentPage === 1}
                      className="px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                    >
                      Anterior
                    </button>
                    {Array.from({ length: paginacion.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPaginacion(p => ({ ...p, currentPage: page }))}
                        className="px-3 py-2 text-sm font-medium rounded-lg border transition-all"
                        style={{
                          borderColor: paginacion.currentPage === page ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                          backgroundColor: paginacion.currentPage === page ? `${COLORS.ACCENT}15` : "white",
                          color: paginacion.currentPage === page ? COLORS.ACCENT : COLORS.CHARCOAL,
                        }}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setPaginacion(p => ({ ...p, currentPage: Math.min(p.totalPages, p.currentPage + 1) }))}
                      disabled={paginacion.currentPage === paginacion.totalPages}
                      className="px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
