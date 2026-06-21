import api, { apiMultipart } from "./auth.service"

export interface Estudiante {
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  celular?: string
  es_activo: boolean
  total_cursos: number
  estado_pago: "deudor" | "abonado" | "al_dia" | "ninguno"
  saldo_pendiente: number
  ciudad?: { nombre: string; id?: string; pais?: string }
  perfil_estudiante?: {
    fecha_nacimiento?: string
    notas_internas?: string
    primera_matricula?: string
    ultima_matricula?: string
    total_cursos?: number
    ocupacion?: string
    direccion?: string
    ciudad?: string
    estado_civil?: string
    edad?: number
  } | null
  creado_en?: string
  actualizado_en?: string
}

export interface EstudiantesResponse {
  datos: Estudiante[]
  stats?: {
    todos: number
    deudor: number
    abonado: number
    al_dia: number
  }
  meta?: {
    actual: number
    ultima_pagina: number
    total: number
    per_page: number
  }
}

export interface AcademicProfile {
  estudiante: {
    id: string
    nombre_completo: string
    cedula: string
    correo: string
  }
  matriculas: Array<{
    id: string
    curso: string
    estado: string
    fecha_inscripcion: string
    porcentaje_asistencia: number
    promedio: number | null
    notas: Array<{
      modulo: string
      calificacion: number
      aprobado: boolean
    }>
  }>
}

export interface CursoAlternativo {
  id: string
  nombre_instancia: string
  modalidad: string
  precio_base: number
  capacidad_maxima: number
  espacios_disponibles: number
  fecha_inicio: string | null
  fecha_fin: string | null
  ciudad: string | null
  horario: {
    nombre_referencial: string
    hora_inicio: string
    hora_fin: string
    dias: number[]
  } | null
}

export interface TransferirResponse {
  success: boolean
  message: string
  data: {
    cambio_horario_id: string
    matricula_nueva_id: string
    notas_migradas: number
    diferencia_precio: number
  }
}

export interface FinancialAccount {
  id: string
  origen: string
  origen_id: string
  concepto: string
  monto_total: number
  monto_abonado: number
  saldo_pendiente: number
  estado: string
  fecha_creacion: string
  transacciones: Array<{
    id: string
    monto: number
    metodo_pago: string
    comprobante_url: string | null
    fecha_pago: string
    estado_verificacion: string
    observaciones: string | null
  }>
}

export interface FinancialProfile {
  estudiante: {
    id: string
    nombre_completo: string
    cedula: string
    correo: string
    celular: string
  }
  cuentas: FinancialAccount[]
  transacciones: Array<{
    id: string
    cuenta_id: string
    concepto: string
    monto: number
    metodo_pago: string
    comprobante_url: string | null
    fecha_pago: string
    estado_verificacion: string
    observaciones: string | null
  }>
  resumen: {
    total_adeudado: number
    total_pagado: number
    total_general: number
    porcentaje_pagado: number
    cuentas_pendientes: number
    cuentas_abonadas: number
    cuentas_pagadas: number
  }
}

export interface StudentStats {
  total_estudiantes: number
  por_ciudad: Array<{ ciudad: string; total: number }>
  matriculas_por_estado: Record<string, number>
  promedio_general: number
  tasa_completacion: number
}

export interface Segment {
  id: string
  nombre: string
  descripcion: string | null
  criterios: SegmentCriteria
  created_at: string
}

export interface SegmentCriteria {
  estado_pago?: string
  cursos_min?: number
  cursos_max?: number
  promedio_min?: number
}

export interface ImportValidateResult {
  total_registros: number
  registros_validos: number
  registros_con_error: number
  errores: string[]
  vista_previa: Array<{
    linea: number
    nombres: string
    apellidos: string
    cedula: string
    correo: string
    celular: string
    estado_validacion: string
  }>
}

export interface ImportResult {
  creados: number
  errores: string[]
  total_procesados: number
}

export const estudiantesService = {
  async getEstudiantes(params: Record<string, string | number | undefined>): Promise<EstudiantesResponse> {
    const response = await api.get("/personas/estudiantes", { params })
    return {
      datos: response.data.datos ?? [],
      stats: response.data.stats,
      meta: response.data.meta,
    }
  },

  async getStudentById(id: string): Promise<Estudiante> {
    const response = await api.get(`/personas/estudiantes/${id}`)
    return response.data.datos
  },

  async createEstudiante(data: {
    nombres: string
    apellidos: string
    cedula?: string
    correo?: string
    celular?: string
    ciudad_id?: number | string
    fecha_nacimiento?: string
    notas_internas?: string
    ocupacion?: string
    direccion?: string
    estado_civil?: string
    edad?: number
  }): Promise<Estudiante> {
    const response = await api.post("/personas/estudiantes", data)
    return response.data.datos
  },

  async updateStudent(id: string, data: {
    nombres?: string
    apellidos?: string
    cedula?: string
    correo?: string
    celular?: string
    ciudad_id?: number | string
    fecha_nacimiento?: string
    notas_internas?: string
    ocupacion?: string
    direccion?: string
    estado_civil?: string
    edad?: number
  }) {
    const response = await api.put(`/personas/estudiantes/${id}`, data)
    return response.data
  },

  async deleteStudent(id: string) {
    const response = await api.delete(`/personas/estudiantes/${id}`)
    return response.data
  },

  async getAcademicProfile(id: string): Promise<AcademicProfile> {
    const response = await api.get(`/personas/estudiantes/${id}/academic-profile`)
    return response.data.datos
  },

  async getFinancialProfile(id: string): Promise<FinancialProfile> {
    const response = await api.get(`/personas/estudiantes/${id}/financial-profile`)
    return response.data.datos
  },

  async getStudentStats(): Promise<StudentStats> {
    const response = await api.get("/personas/estudiantes/stats")
    return response.data.datos
  },

  async getSegments(): Promise<Segment[]> {
    const response = await api.get("/personas/estudiantes/segmentos")
    return response.data.datos
  },

  async createSegment(data: { nombre: string; descripcion?: string; criterios: SegmentCriteria }) {
    const response = await api.post("/personas/estudiantes/segmentos", data)
    return response.data
  },

  async deleteSegment(id: string) {
    const response = await api.delete(`/personas/estudiantes/segmentos/${id}`)
    return response.data
  },

  async getSegmentStudents(id: string): Promise<{ segmento: Segment; estudiantes: Estudiante[]; total: number }> {
    const response = await api.get(`/personas/estudiantes/segmentos/${id}/students`)
    return response.data.datos
  },

  async validateImport(file: File): Promise<ImportValidateResult> {
    const formData = new FormData()
    formData.append("archivo", file)
    const response = await apiMultipart.post("/personas/estudiantes/importar/validar", formData)
    return response.data.datos
  },

  async importStudents(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append("archivo", file)
    const response = await apiMultipart.post("/personas/estudiantes/importar", formData)
    return response.data.datos
  },

  async getAlternativos(matriculaId: string): Promise<CursoAlternativo[]> {
    const response = await api.get(`/academic/matriculas/${matriculaId}/alternativos`)
    return response.data.datos ?? response.data
  },

  async transferirCurso(matriculaId: string, data: { curso_abierto_nuevo_id: string; motivo?: string }): Promise<TransferirResponse> {
    const response = await api.post(`/academic/matriculas/${matriculaId}/transferir`, data)
    return response.data
  },

  async exportStudents(params: {
    formato: "csv" | "pdf" | "excel"
    campos?: string[]
    ids?: string[]
    buscar?: string
    estado_pago?: string
  }): Promise<Blob> {
    const response = await api.post("/personas/estudiantes/exportar", params, {
      responseType: "blob"
    })
    return response.data
  }
}
