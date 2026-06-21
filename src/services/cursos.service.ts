import api, { apiMultipart } from "@/services/auth.service"

// ============================================================================
// TIPOS Y INTERFACES - CATÁLOGOS
// ============================================================================

export interface CatalogoCurso {
  id: string
  programa_id?: string
  nombre: string
  descripcion?: string
  creditos?: number
  horas_totales?: number
  modulos_default?: number
  es_activo: boolean
  categoria: "regular" | "taller" | "personalizado"
  imagen?: string
  color?: string
  created_at?: string
  updated_at?: string
}

export interface CatalogoCursoResponse {
  data: CatalogoCurso[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

// ============================================================================
// TIPOS Y INTERFACES - HORARIOS
// ============================================================================

export interface Horario {
  id: string
  curso_abierto_id: string
  dia: number // 1-7 (lunes-domingo)
  hora_inicio: string // HH:mm
  hora_fin: string // HH:mm
  aula?: string
  created_at?: string
}

export interface HorarioResponse {
  data: Horario[]
  meta?: {
    total: number
    per_page: number
  }
}

// ============================================================================
// TIPOS Y INTERFACES - CURSOS ABIERTOS
// ============================================================================

export interface CursoAbierto {
  id: string
  nombre_instancia: string
  semestre: string
  fecha_inicio: string | null
  fecha_fin: string | null
  capacidad_maxima: number
  docente_id: string
  precio_base?: number
  es_activo: boolean
  modalidad?: "presencial" | "virtual"
  ciudad_id?: number
  estado: "pendiente" | "confirmado" | "en_progreso" | "completado" | "cancelado"
  catalogo?: {
    id: string
    nombre: string
    descripcion: string
    categoria: "regular" | "taller" | "personalizado"
    color?: string
    creditos: number
    horas_totales: number
    modulos_default: number
  }
  docente?: {
    id: string
    nombres: string
    apellidos: string
  }
  ciudad?: {
    id: number
    nombre: string
  }
  horarios?: Array<{
    id: string
    dia: string
    hora_inicio: string
    hora_fin: string
  }>
  matriculas?: Array<{
    id: string
    estudiante_id: string
    estado: string
  }>
  modulos?: Array<{
    id: string
    nombre: string
    numero: number
    fecha_inicio?: string | null
    fecha_fin?: string | null
  }>
  horario?: Record<string, unknown>
  observaciones?: string
}

export interface Curso {
  id: string
  nombre: string
  tipo: "regular" | "taller" | "personalizado"
  modalidad: "presencial" | "virtual"
  ciudad: string
  instructor: string
  moduloActual: number
  totalModulos: number
  estudiantes: number
  capacidad: number
  estado: "en_progreso" | "pendiente" | "completado"
  fechaInicio: string | null
  fechaFin: string | null
  horaInicio: string
  horaFin: string
  precioBase: number
  observaciones: string
  colorCatalogo?: string
  horario?: {
    id: string
    hora_inicio: string
    hora_fin: string
    diasSemana?: Array<{
      id?: string
      dia_semana: number
    }>
  }
}

export interface CursosResponse {
  data: Curso[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface CursoFilters {
  tipo?: string
  modalidad?: string
  ciudad?: string
  catalogo_curso_id?: string
  estado?: string
  search?: string
  per_page?: number
}

// ============================================================================
// TIPOS Y INTERFACES - NOTIFICACIONES
// ============================================================================

export interface NotificacionItem {
  id: string
  estudiante: string
  curso: string
  color?: string
  monto: number
  hora: string
}

export interface NotificacionGrupo {
  fecha: string
  items: NotificacionItem[]
}

export interface NotificacionesResponse {
  pendientes: number
  recientes: NotificacionGrupo[]
}

export interface Nota {
  id: string
  modulo_id: string
  matricula_id: string
  calificacion: number
  modulo?: {
    numero: number
  }
}

export interface MatriculaDetallada {
  id: string
  estado: string
  fecha_inscripcion?: string
  estudiante: {
    id: string
    nombres: string
    apellidos: string
    cedula: string
    correo: string
  } | null
  solicitud_inscripcion?: {
    estudiante?: {
      nombres: string
      apellidos: string
      cedula: string
      correo: string
    } | null
    participante_externo?: {
      nombres: string
      apellidos: string
      cedula: string
      correo: string
    } | null
  } | null
}

// ============================================================================
// TRANSFORMADORES
// ============================================================================

/**
 * Mapea CursoAbierto del backend a Curso del frontend
 * Calcula campos derivados como moduloActual y deduce modalidad/ciudad
 */
function transformCursoAbiertoToCurso(data: CursoAbierto): Curso {
  const typed = data as CursoAbierto & {
    estudiantes_inscritos?: number
    observaciones?: string
    horario?: {
      id: string
      hora_inicio?: string
      hora_fin?: string
      dias_semana?: Array<{ dia_semana: number }>
      diasSemana?: Array<{ dia_semana: number }>
    }
  }

  const docenteNombre = typed.docente
    ? `${typed.docente.nombres} ${typed.docente.apellidos}`.trim()
    : "Sin asignar"

  const modalidad = typed.modalidad || "presencial"
  const ciudad = typed.ciudad?.nombre || "No especificada"

  return {
    id: typed.id,
    nombre: typed.nombre_instancia || typed.catalogo?.nombre || "Sin nombre",
    tipo: (typed.catalogo?.categoria || "regular") as "regular" | "taller" | "personalizado",
    modalidad,
    ciudad,
    instructor: docenteNombre,
    moduloActual: calculateModuloActual(typed.modulos || []),
    totalModulos: typed.modulos?.length || typed.catalogo?.modulos_default || 0,
    estudiantes: typed.estudiantes_inscritos ?? typed.matriculas?.length ?? 0,
    capacidad: typed.capacidad_maxima,
    estado: mapEstadoCurso(typed.estado, typed.modulos),
    fechaInicio: typed.fecha_inicio?.split("T")[0] || null,
    fechaFin: typed.fecha_fin?.split("T")[0] || null,
    horaInicio: typed.horario?.hora_inicio?.substring(0, 5) || "",
    horaFin: typed.horario?.hora_fin?.substring(0, 5) || "",
    precioBase: Number(typed.precio_base) || 0,
    observaciones: typed.observaciones || "",
    colorCatalogo: typed.catalogo?.color,
    horario: typed.horario ? {
      id: typed.horario.id,
      hora_inicio: typed.horario.hora_inicio?.substring(0, 5) || "",
      hora_fin: typed.horario.hora_fin?.substring(0, 5) || "",
      diasSemana: typed.horario.dias_semana || typed.horario.diasSemana || ([] as Array<{ dia_semana: number }>),
    } : undefined,
  }
}

/**
 * Calcula el módulo actual basado en las fechas de los módulos.
 * Retorna cuántos módulos ya han comenzado (fecha_inicio <= hoy).
 */
function calculateModuloActual(modulos: Array<Record<string, unknown>>): number {
  if (!modulos || modulos.length === 0) return 0

  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999)

  return modulos.filter((m) => {
    if (!m.fecha_inicio) return false
    const inicio = new Date(String(m.fecha_inicio) + "T00:00:00")
    return inicio <= hoy
  }).length
}

/**
 * Deriva el estado del curso basado en las fechas de los módulos
 * como fallback si el backend no tiene un estado explícito.
 */
function mapEstadoCurso(
  estado: "pendiente" | "confirmado" | "en_progreso" | "completado" | "cancelado" | undefined,
  modulos?: Array<Record<string, unknown>>
): "en_progreso" | "pendiente" | "completado" {
  // Si el backend tiene un estado explícito no pendiente, usarlo
  if (estado && estado !== "pendiente") {
    const mapping: Record<string, "en_progreso" | "pendiente" | "completado"> = {
      pendiente: "pendiente",
      confirmado: "en_progreso",
      en_progreso: "en_progreso",
      completado: "completado",
      cancelado: "pendiente",
    }
    return mapping[estado] || "pendiente"
  }

  // Derivar de módulos si no hay estado explícito
  if (modulos && modulos.length > 0) {
    const hoy = new Date()
    hoy.setHours(23, 59, 59, 999)

    const todosFinalizados = modulos.every((m) => {
      if (!m.fecha_fin) return false
      return new Date(String(m.fecha_fin) + "T23:59:59") < hoy
    })

    if (todosFinalizados) return "completado"

    const algunoIniciado = modulos.some((m) => {
      if (!m.fecha_inicio) return false
      return new Date(String(m.fecha_inicio) + "T00:00:00") <= hoy
    })

    if (algunoIniciado) return "en_progreso"
  }

  return "pendiente"
}

// ============================================================================
// SERVICIO DE CURSOS
// ============================================================================

export const cursosService = {
  /**
   * Obtener lista de cursos abiertos con filtros y paginación
   */
  async getCursos(
    filters?: CursoFilters,
    page: number = 1
  ): Promise<CursosResponse> {
    const params: Record<string, string | number> = {
      per_page: filters?.per_page || 15,
      page,
    }

    if (filters?.search) {
      params.buscar = filters.search
    }
    if (filters?.tipo) {
      params.categoria = filters.tipo
    }
    if (filters?.modalidad) {
      params.modalidad = filters.modalidad
    }
    if (filters?.ciudad) {
      params.ciudad = filters.ciudad
    }
    if (filters?.catalogo_curso_id) {
      params.catalogo_curso_id = filters.catalogo_curso_id
    }

    const response = await api.get<{ data: CursoAbierto[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }>(
      "/cursos-abiertos",
      { params }
    )

    const cursosTransformados = response.data.data.map(transformCursoAbiertoToCurso)

    return {
      data: cursosTransformados,
      meta: response.data.meta,
    }
  },

  /**
   * Obtener detalles de un curso específico
   */
  async getCursoById(id: string): Promise<Curso> {
    const response = await api.get<{ data: CursoAbierto }>(
      `/academic/cursos-abiertos/${id}`
    )

    return transformCursoAbiertoToCurso(response.data.data)
  },

  /**
   * Obtener detalles de un curso abierto sin transformar (para edición)
   */
  async getCursoAbiertoById(id: string): Promise<CursoAbierto> {
    const response = await api.get<{ data: CursoAbierto }>(
      `/academic/cursos-abiertos/${id}`
    )

    return response.data.data
  },

  /**
   * Obtener notas para calcular módulo actual
   */
  async getNotasCurso(cursoId: string): Promise<Nota[]> {
    const response = await api.get<{ data: Nota[] }>(
      `/academic/cursos-abiertos/${cursoId}/notas`
    )

    return response.data.data
  },

  /**
   * Guardar preferencia de modalidad para un curso (localStorage)
   */
  setModalidadCurso(cursoId: string, modalidad: "presencial" | "virtual") {
    localStorage.setItem(`curso_${cursoId}_modalidad`, modalidad)
  },

  /**
   * Guardar preferencia de ciudad para un curso (localStorage)
   */
  setCiudadCurso(cursoId: string, ciudad: string) {
    localStorage.setItem(`curso_${cursoId}_ciudad`, ciudad)
  },

  // ========================================================================
  // MÉTODOS DE CATÁLOGOS
  // ========================================================================

  /**
   * GET /api/v1/academic/catalogos-cursos
   * Listar catálogos de cursos
   */
  async getCatalogos(
    search?: string,
    page: number = 1
  ): Promise<CatalogoCursoResponse> {
    const params: Record<string, string | number> = {
      per_page: 15,
      page,
    }

    if (search) {
      params.buscar = search
    }

    const response = await api.get<CatalogoCursoResponse>(
      "/catalogo-cursos",
      { params }
    )

    return response.data
  },

  /**
   * GET /api/v1/academic/catalogos-cursos/{id}
   * Obtener detalles de un catálogo
   */
  async getCatalogoById(id: string): Promise<CatalogoCurso> {
    const response = await api.get<{ data: CatalogoCurso }>(
      `/academic/catalogos-cursos/${id}`
    )

    return response.data.data
  },

  /**
   * POST /api/v1/academic/catalogos-cursos
   * Crear nuevo catálogo de curso
   */
  async crearCatalogo(data: {
    programa_id?: string
    nombre: string
    descripcion?: string
    creditos?: number
    horas_totales?: number
    modulos_default?: number
    es_activo?: boolean
    categoria?: "regular" | "taller" | "personalizado"
    imagen?: string
  }): Promise<CatalogoCurso> {
    const response = await api.post<{ data: CatalogoCurso; message: string }>(
      "/academic/catalogos-cursos",
      data
    )

    return response.data.data
  },

  /**
   * PUT /api/v1/academic/catalogos-cursos/{id}
   * Actualizar catálogo
   */
  async actualizarCatalogo(
    id: string,
    data: Partial<CatalogoCurso>
  ): Promise<CatalogoCurso> {
    const response = await api.put<{ data: CatalogoCurso; message: string }>(
      `/academic/catalogos-cursos/${id}`,
      data
    )

    return response.data.data
  },

  /**
   * DELETE /api/v1/academic/catalogos-cursos/{id}
   * Eliminar catálogo
   */
  async eliminarCatalogo(id: string): Promise<void> {
    await api.delete(`/academic/catalogos-cursos/${id}`)
  },

  /**
   * POST /api/v1/academic/catalogos-cursos/upload-imagen
   * Subir imagen para un catálogo
   */
  async uploadImagenCatalogo(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("imagen", file)

      const response = await apiMultipart.post<{ data: { url: string } }>(
        "/academic/catalogos-cursos/upload-imagen",
        formData
      )

    return response.data.data.url
  },

  // ========================================================================
  // MÉTODOS DE CURSOS ABIERTOS (CREAR INSTANCIAS)
  // ========================================================================

  /**
   * POST /api/v1/academic/cursos-abiertos
   * Crear nueva instancia de curso (Curso Abierto)
   */
  async crearCursoAbierto(data: {
    catalogo_curso_id: string
    nombre_instancia: string
    semestre?: string
    fecha_inicio: string
    fecha_fin: string
    hora_inicio?: string
    hora_fin?: string
    capacidad_maxima: number
    docente_id: string
    es_activo?: boolean
    observaciones?: string
    modalidad?: "presencial" | "virtual"
    ciudad_id?: string | number
    modulos?: { nombre?: string; fecha_inicio?: string; fecha_fin?: string }[]
  }): Promise<CursoAbierto> {
    const response = await api.post<{ data: CursoAbierto; message: string }>(
      "/academic/cursos-abiertos",
      data
    )

    return response.data.data
  },

  /**
   * PUT /api/v1/academic/cursos-abiertos/{id}
   * Actualizar curso abierto
   */
  async actualizarCursoAbierto(
    id: string,
    data: Record<string, unknown>
  ): Promise<CursoAbierto> {
    const response = await api.put<{ data: CursoAbierto; message: string }>(
      `/academic/cursos-abiertos/${id}`,
      data
    )

    return response.data.data
  },

  /**
   * DELETE /api/v1/academic/cursos-abiertos/{id}
   * Eliminar curso abierto
   */
  async eliminarCursoAbierto(id: string): Promise<void> {
    await api.delete(`/academic/cursos-abiertos/${id}`)
  },

  // ========================================================================
  // MÉTODOS DE HORARIOS
  // ========================================================================

  /**
   * GET /api/v1/academic/horarios?curso_abierto_id=...
   * Obtener horarios de un curso abierto
   */
  async getHorariosCurso(cursoAbiertoId: string): Promise<Horario[]> {
    const response = await api.get<HorarioResponse>("/academic/horarios", {
      params: { curso_abierto_id: cursoAbiertoId },
    })

    return response.data.data
  },

  /**
   * POST /api/v1/academic/horarios
   * Crear nuevo horario
   */
  async crearHorario(data: {
    curso_abierto_id: string
    dia: number // 1-7
    hora_inicio: string // HH:mm
    hora_fin: string // HH:mm
    aula?: string
  }): Promise<Horario> {
    const response = await api.post<{ data: Horario; message: string }>(
      "/academic/horarios",
      data
    )

    return response.data.data
  },

  /**
   * PUT /api/v1/academic/horarios/{id}
   * Actualizar horario
   */
  async actualizarHorario(id: string, data: Partial<Horario>): Promise<Horario> {
    const response = await api.put<{ data: Horario; message: string }>(
      `/academic/horarios/${id}`,
      data
    )

    return response.data.data
  },

  /**
   * DELETE /api/v1/academic/horarios/{id}
   * Eliminar horario
   */
  async eliminarHorario(id: string): Promise<void> {
    await api.delete(`/academic/horarios/${id}`)
  },

  // ========================================================================
  // MÉTODOS DE MATRÍCULAS
  // ========================================================================

  /**
   * GET /api/v1/academic/cursos-abiertos/{id}/matriculas
   * Obtener matrículas de un curso abierto
   */
  async getMatriculasCurso(cursoAbiertoId: string): Promise<MatriculaDetallada[]> {
    const response = await api.get<{ data: MatriculaDetallada[] }>(
      `/academic/cursos-abiertos/${cursoAbiertoId}/matriculas`
    )
    return response.data.data || []
  },

  // ========================================================================
  // MÉTODOS DE MÓDULOS
  // ========================================================================

  /**
   * GET /api/v1/academic/cursos-abiertos/{id}/modulos
   * Obtener módulos de un curso abierto
   */
  async getModulosCurso(cursoAbiertoId: string): Promise<Record<string, unknown>[]> {
    const response = await api.get(`/academic/modulos`, {
      params: { curso_abierto_id: cursoAbiertoId },
    })
    return response.data.data || []
  },

  /**
   * PUT /api/v1/academic/modulos/{id}
   * Actualizar módulo
   */
  async actualizarModulo(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.put(`/academic/modulos/${id}`, data)
    return response.data.data
  },

  // ========================================================================
  // REGISTRATIONS Y UPLOAD
  // ========================================================================

  /**
   * POST /api/v1/academic/upload/comprobante
   * Subir imagen de comprobante
   */
  async uploadComprobante(file: File): Promise<{ url: string }> {
    const form = new FormData()
    form.append('archivo', file)
    const response = await apiMultipart.post('/upload/comprobante', form)
    return response.data.data
  },

  /**
   * POST /api/v1/academic/registrations
   * Enviar solicitud de matrícula
   */
  async crearSolicitudInscripcion(formData: FormData): Promise<Record<string, unknown>> {
    const response = await apiMultipart.post('/registrations', formData)
    return response.data
  },

  /**
   * GET /api/v1/academic/solicitudes-inscripcion
   * Listar solicitudes
   */
  async getSolicitudesInscripcion(params?: { estado?: string; per_page?: number; page?: number }): Promise<Record<string, unknown>> {
    const response = await api.get('/academic/solicitudes-inscripcion', { params })
    return response.data
  },

  /**
   * GET /api/v1/academic/solicitudes-inscripcion/{id}
   */
  async getSolicitudInscripcionById(id: string): Promise<Record<string, unknown>> {
    const response = await api.get(`/academic/solicitudes-inscripcion/${id}`)
    return response.data.data
  },

  /**
   * POST /api/v1/academic/solicitudes-inscripcion/{id}/validar
   */
  async aprobarSolicitudInscripcion(id: string): Promise<Record<string, unknown>> {
    const response = await api.post(`/academic/solicitudes-inscripcion/${id}/validar`)
    return response.data
  },

  /**
   * POST /api/v1/academic/solicitudes-inscripcion/{id}/rechazar
   */
  async rechazarSolicitudInscripcion(id: string, motivo?: string): Promise<Record<string, unknown>> {
    const response = await api.post(`/academic/solicitudes-inscripcion/${id}/rechazar`, { motivo_rechazo: motivo })
    return response.data
  },

  /**
   * Actualizar datos del estudiante/participante externo de una solicitud
   */
  async actualizarEstudiante(id: string, datos: { nombres?: string; apellidos?: string; correo?: string; celular?: string; cedula?: string; ocupacion?: string; direccion?: string; estado_civil?: string; ciudad?: string; fecha_nacimiento?: string; edad?: number }): Promise<Record<string, unknown>> {
    const response = await api.patch(`/academic/solicitudes-inscripcion/${id}/actualizar-estudiante`, datos)
    return response.data
  },

  async actualizarPago(id: string, datos: { monto_solicitado?: number; tipo_pago?: string; tipo_comprobante?: string; fecha_pago_declarada?: string }): Promise<Record<string, unknown>> {
    const response = await api.patch(`/academic/solicitudes-inscripcion/${id}/actualizar-pago`, datos)
    return response.data
  },

  async actualizarCurso(id: string, datos: { curso_abierto_id: string }): Promise<Record<string, unknown>> {
    const response = await api.patch(`/academic/solicitudes-inscripcion/${id}/actualizar-curso`, datos)
    return response.data
  },

  async exportarParticipantesCurso(id: string, formato: "csv" | "pdf" = "csv"): Promise<Blob> {
    const response = await api.get(`/academic/cursos-abiertos/${id}/exportar`, {
      params: { formato },
      responseType: "blob",
    })
    return response.data
  },

  // ========================================================================
  // NOTIFICACIONES
  // ========================================================================

  async getNotificaciones(): Promise<NotificacionesResponse> {
    const response = await api.get<NotificacionesResponse>("/academic/notificaciones")
    return response.data
  },
}

export default api
