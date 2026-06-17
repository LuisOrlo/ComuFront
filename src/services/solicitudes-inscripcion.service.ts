import api from "@/services/auth.service"

export interface SolicitudInscripcionResumen {
  id: string
  estado: string
  fecha_solicitud: string
  estudiante?: {
    nombres: string
    apellidos: string
    correo: string
  }
  participanteExterno?: {
    nombres: string
    apellidos: string
    correo: string
  }
  cursoAbierto?: {
    catalogo?: {
      nombre: string
      color?: string
    }
    precio_base?: number
  }
  monto_solicitado?: number
  tipo_pago?: string
}

export interface DocumentoSolicitud {
  id: string
  tipo: string
  url: string
  nombre: string
  fecha_carga: string
}

export interface SolicitudInscripcionDetallada extends SolicitudInscripcionResumen {
  estudiante?: {
    id: string
    nombres: string
    apellidos: string
    correo: string
    celular?: string
    cedula?: string
    perfil_estudiante?: {
      ocupacion?: string
      direccion?: string
      estado_civil?: string
      edad?: number
      fecha_nacimiento?: string
    } | null
  }
  participanteExterno?: {
    id: string
    nombres: string
    apellidos: string
    correo: string
    celular?: string
    cedula?: string
    ocupacion?: string
    direccion?: string
    estado_civil?: string
    edad?: number
  }
  cursoAbierto: {
    id: string
    catalogo_id: string
    precio_base: number
    capacidad_maxima: number
    estudiantes_inscritos: number
    fecha_inicio: string
    fecha_fin_estimada: string
    catalogo: {
      id: string
      nombre: string
      descripcion: string
      color?: string
    }
  }
  validador?: {
    id: string
    nombres: string
    apellidos: string
    correo: string
  }
  archivo_comprobante_url?: string
  tipo_comprobante?: string
  fecha_pago_declarada?: string
  observaciones_validacion?: string
  motivo_rechazo?: string
  fecha_validacion?: string
  documentos?: DocumentoSolicitud[]
}

export interface SolicitudesResponse {
  data: SolicitudInscripcionResumen[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface ApprobalRequest {
  observaciones_validacion?: string
}

export interface RejectRequest {
  motivo_rechazo: string
  observaciones_rechazo?: string
}

export const solicitudesInscripcionService = {
  /**
   * GET /api/v1/staff/solicitudes-inscripcion
   * Listar solicitudes de inscripción con filtros
   */
  async getSolicitudes(
    filtros?: {
      estado?: string
      curso_abierto_id?: string
      search?: string
      fecha_desde?: string
      fecha_hasta?: string
      per_page?: number
      page?: number
    },
    page: number = 1
  ): Promise<SolicitudesResponse> {
    const params = new URLSearchParams()
    
    if (filtros?.estado) params.append("estado", filtros.estado)
    if (filtros?.curso_abierto_id) params.append("curso_abierto_id", filtros.curso_abierto_id)
    if (filtros?.search) params.append("search", filtros.search)
    if (filtros?.fecha_desde) params.append("fecha_desde", filtros.fecha_desde)
    if (filtros?.fecha_hasta) params.append("fecha_hasta", filtros.fecha_hasta)
    if (filtros?.per_page) params.append("per_page", String(filtros.per_page))
    params.append("page", String(page))

    const response = await api.get<SolicitudesResponse>(
      `/staff/solicitudes-inscripcion?${params.toString()}`
    )
    return response.data
  },

  /**
   * GET /api/v1/staff/solicitudes-inscripcion/{id}
   * Obtener detalles de una solicitud
   */
  async getSolicitudDetalle(id: string): Promise<SolicitudInscripcionDetallada> {
    const response = await api.get<{ data: SolicitudInscripcionDetallada }>(
      `/staff/solicitudes-inscripcion/${id}`
    )
    return response.data.data
  },

  /**
   * POST /api/v1/staff/solicitudes-inscripcion/{id}/validar
   * Aprobar una solicitud
   */
  async aprobarSolicitud(
    id: string,
    datos: ApprobalRequest
  ): Promise<{
    mensaje: string
    data: {
      solicitud_id: string
      matricula_id: string
      cuenta_cobrar_id?: string
      estado: string
    }
  }> {
    const response = await api.post(
      `/staff/solicitudes-inscripcion/${id}/validar`,
      datos
    )
    return response.data
  },

  /**
   * POST /api/v1/staff/solicitudes-inscripcion/{id}/rechazar
   * Rechazar una solicitud
   */
  async rechazarSolicitud(
    id: string,
    datos: RejectRequest
  ): Promise<{
    mensaje: string
    data: {
      solicitud_id: string
      estado: string
    }
  }> {
    const response = await api.post(
      `/staff/solicitudes-inscripcion/${id}/rechazar`,
      datos
    )
    return response.data
  },

  /**
   * POST /api/v1/staff/solicitudes-inscripcion/{id}/cancelar
   * Cancelar una solicitud
   */
  async cancelarSolicitud(id: string): Promise<{
    mensaje: string
    data: {
      solicitud_id: string
      estado: string
    }
  }> {
    const response = await api.post(
      `/staff/solicitudes-inscripcion/${id}/cancelar`,
      {}
    )
    return response.data
  },
}

export default solicitudesInscripcionService
