import api, { apiMultipart } from "./auth.service"
import type { DatosAsistenciaPDF } from "@/lib/generarAsistenciaPDF"

const PREFIX = "/academic"

export interface Taller {
  id: string
  nombre: string
  descripcion?: string
  fecha?: string
  fecha_fin?: string | null
  hora_inicio?: string
  hora_fin?: string
  instructor_id?: string
  instructor?: { id: string; nombres: string; apellidos: string }
  modalidad?: string
  ciudad_id?: number
  ciudad?: { id: number; nombre: string }
  capacidad_maxima?: number
  precio?: number
  estado: string
  inscripciones_count?: number
  inscripciones?: InscripcionTaller[]
  asistencias?: AsistenciaTaller[]
  horarios?: HorarioTaller[]
  created_at?: string
}

export interface HorarioTaller {
  id: string
  taller_id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  aula?: string
}

export interface InscripcionTaller {
  id: string
  taller_id: string
  persona_id?: string
  nombres: string
  apellidos: string
  cedula: string
  correo: string
  telefono?: string
  ciudad?: string
  ocupacion?: string
  direccion?: string
  estado_civil?: string
  edad?: number
  fecha_inscripcion: string
  estado: string
  tipo_pago?: string
  monto_pagado?: number
  metodo_pago?: string
  comprobante_url?: string
  pago_verificado?: boolean
  fecha_pago?: string
  taller?: Taller
}

export interface AsistenciaEstudiante {
  id: string
  asistencia_taller_id: string
  inscripcion_taller_id: string | null
  participante_externo_id: string | null
  asistio: boolean
  estado: string
  observaciones: string | null
  inscripcion_taller?: InscripcionTaller | null
}

export interface AsistenciaTaller {
  id: string
  taller_id: string
  fecha_sesion: string
  asistentes: number
  capacidad_registrada: number
  observaciones?: string
  estudiantes?: AsistenciaEstudiante[]
}

export interface TallerStats {
  id: string
  nombre: string
  total_inscritos: number
  capacidad_disponible: number
  tasa_ocupacion: number
  ingreso_total: number
  pagos_verificados: number
  pagos_pendientes: number
  estado: string
  permite_inscripcion: boolean
}

export const tallerService = {
  async inscribirEstudianteDesdePerfil(data: { estudiante_id: string; taller_id: string; monto_pagado: number; metodo_pago: string }) {
    const response = await api.post("/academic/inscripciones-talleres/inscribir-desde-perfil", data)
    return response.data
  },

  // Talleres CRUD (admin - usa prefijo /academic)
  async listar(params?: Record<string, unknown>) {
    const res = await api.get(`${PREFIX}/talleres`, { params })
    return res.data
  },

  async obtener(id: string) {
    const res = await api.get(`${PREFIX}/talleres/${id}`)
    return res.data
  },

  async crear(data: Record<string, unknown>) {
    const res = await api.post(`${PREFIX}/talleres`, data)
    return res.data
  },

  async actualizar(id: string, data: Record<string, unknown>) {
    const res = await api.put(`${PREFIX}/talleres/${id}`, data)
    return res.data
  },

  async eliminar(id: string) {
    const res = await api.delete(`${PREFIX}/talleres/${id}`)
    return res.data
  },

  async estadisticas(id: string) {
    const res = await api.get(`${PREFIX}/talleres/${id}/estadisticas`)
    return res.data
  },

  // Inscripciones (admin)
  async listarInscripciones(tallerId: string, params?: Record<string, unknown>) {
    const res = await api.get(`${PREFIX}/talleres/${tallerId}/inscripciones`, { params })
    return res.data
  },

  async listarInscripcionesPendientes(params?: Record<string, unknown>) {
    const res = await api.get(`${PREFIX}/inscripciones-talleres`, { params })
    return res.data
  },

  async getInscripcionById(id: string) {
    const res = await api.get(`${PREFIX}/inscripciones-talleres/${id}`)
    return res.data
  },

  // Público (sin prefix académico)
  async inscribir(data: Record<string, unknown> | FormData) {
    const client = data instanceof FormData ? apiMultipart : api
    const res = await client.post("/talleres/inscribir", data)
    return res.data
  },

  // Admin/Secretaria
  async inscribirEnTaller(tallerId: string, data: Record<string, unknown>) {
    const res = await api.post(`${PREFIX}/talleres/${tallerId}/inscripciones`, data)
    return res.data
  },

  async actualizarInscripcion(id: string, data: Record<string, unknown>) {
    const res = await api.put(`${PREFIX}/inscripciones-talleres/${id}`, data)
    return res.data
  },

  async cambiarEstadoInscripcion(id: string, estado: string) {
    const res = await api.put(`${PREFIX}/inscripciones-talleres/${id}/estado`, { estado })
    return res.data
  },

  async subirComprobante(id: string, file: File) {
    const form = new FormData()
    form.append("archivo", file)
    const res = await apiMultipart.post(`/talleres/inscripciones/${id}/upload-comprobante`, form)
    return res.data
  },

  async subirCedula(id: string, file: File) {
    const form = new FormData()
    form.append("archivo", file)
    const res = await apiMultipart.post(`/talleres/inscripciones/${id}/upload-cedula`, form)
    return res.data
  },

  async verificarPago(id: string, data?: Record<string, unknown>) {
    const res = await api.post(`${PREFIX}/inscripciones-talleres/${id}/verificar-pago`, data || {})
    return res.data
  },

  async eliminarInscripcion(id: string) {
    const res = await api.delete(`${PREFIX}/inscripciones-talleres/${id}`)
    return res.data
  },

  async deleteArchivo(id: string, campo: string) {
    const res = await api.delete(`${PREFIX}/inscripciones-talleres/${id}/archivo`, {
      data: { campo },
    })
    return res.data
  },

  async getAdjacent(id: string, params?: Record<string, unknown>) {
    const res = await api.get(`${PREFIX}/inscripciones-talleres/${id}/adjacent`, { params })
    return res.data as {
      prev_id: string | null
      next_id: string | null
      first_id: string | null
      position: number
      total: number
      stale: boolean
      stale_estado?: string
    }
  },

  async exportarParticipantes(tallerId: string) {
    const res = await api.get(`${PREFIX}/talleres/${tallerId}/exportar`)
    return res.data
  },

  async exportarParticipantesPdf(tallerId: string) {
    const res = await api.get(`${PREFIX}/talleres/${tallerId}/exportar`, {
      params: { formato: "pdf" },
      responseType: "blob",
    })
    return res.data
  },

  // Asistencia
  async listarAsistencias(tallerId: string, params?: Record<string, unknown>) {
    const res = await api.get(`${PREFIX}/talleres/${tallerId}/asistencias`, { params })
    return res.data
  },

  async registrarAsistencia(tallerId: string, data: Record<string, unknown>) {
    const res = await api.post(`${PREFIX}/talleres/${tallerId}/asistencias`, data)
    return res.data
  },

  async listarAsistenciaEstudiantes(tallerId: string, asistenciaId: string) {
    const res = await api.get(`${PREFIX}/talleres/${tallerId}/asistencias/${asistenciaId}/estudiantes`)
    return res.data
  },

  async registrarAsistenciaEstudiantes(tallerId: string, asistenciaId: string, data: Record<string, unknown>) {
    const res = await api.post(`${PREFIX}/talleres/${tallerId}/asistencias/${asistenciaId}/estudiantes`, data)
    return res.data
  },

  // Para instructor
  async listarPorInstructor(instructorId: string, params?: Record<string, unknown>) {
    const res = await api.get(`${PREFIX}/talleres`, { params: { ...params, instructor_id: instructorId } })
    return res.data
  },

  async getAsistenciaPDFData(tallerId: string): Promise<DatosAsistenciaPDF> {
    const res = await api.get<DatosAsistenciaPDF>(`${PREFIX}/talleres/${tallerId}/asistencia-pdf`)
    return res.data
  },

  // Portal Instructor - Talleres
  async listarAsistenciasInstructor(tallerId: string) {
    const res = await api.get(`/instructor/talleres/${tallerId}/asistencias`)
    return res.data
  },

  async listarAsistenciaEstudiantesInstructor(tallerId: string, asistenciaId: string) {
    const res = await api.get(`/instructor/talleres/${tallerId}/asistencias/${asistenciaId}/estudiantes`)
    return res.data
  },

  async actualizarAsistenciaInstructor(sesionId: string, data: Record<string, unknown>) {
    const res = await api.put(`/instructor/talleres/asistencias/${sesionId}`, data)
    return res.data
  },

  async getAsistenciaPDFDataInstructor(tallerId: string): Promise<DatosAsistenciaPDF> {
    const res = await api.get<DatosAsistenciaPDF>(`/instructor/talleres/${tallerId}/asistencia-pdf`)
    return res.data
  },
}
