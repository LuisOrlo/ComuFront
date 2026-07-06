import api, { apiMultipart } from "./auth.service"

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
  nombres: string
  apellidos: string
  cedula: string
  correo: string
  telefono?: string
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

export interface AsistenciaTaller {
  id: string
  taller_id: string
  fecha_sesion: string
  asistentes: number
  capacidad_registrada: number
  observaciones?: string
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

  // Público (sin prefix académico)
  async inscribir(data: Record<string, unknown>) {
    const res = await api.post("/talleres/inscribir", data)
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

  // Para instructor
  async listarPorInstructor(instructorId: string, params?: Record<string, unknown>) {
    const res = await api.get(`${PREFIX}/talleres`, { params: { ...params, instructor_id: instructorId } })
    return res.data
  },
}
