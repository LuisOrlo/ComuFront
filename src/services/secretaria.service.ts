import api from "./auth.service"

export interface DashboardData {
  pagos_pendientes_hoy: number
  matriculas_recientes: Array<{
    id: string
    estudiante_nombre: string
    curso: string
    fecha: string
    estado: string
  }>
  cursos_con_cupo: Array<{
    id: string
    nombre: string
    inscritos: number
    capacidad: number
    disponibles: number
    fecha_inicio: string
  }>
  estado_servicios: {
    podcast_activas: number
    edicion_pendientes: number
    alquileres_activos: number
  }
}

export interface CuentaCobrar {
  id: string
  monto_total: number
  monto_abonado: number
  saldo_pendiente: number
  estado: "pendiente" | "abonado" | "pagado" | "anulado"
  created_at: string
  matricula?: {
    estudiante?: { nombres: string; apellidos: string }
    curso_abierto?: { catalogo?: { nombre: string } }
  }
  solicitud_inscripcion?: {
    estudiante?: { nombres: string; apellidos: string }
    participante_externo?: { nombres: string; apellidos: string }
    curso_abierto?: { catalogo?: { nombre: string } }
  }
  inscripcion_taller?: {
    taller?: { nombre: string }
  }
}

export interface TransaccionIngreso {
  id: string
  cuenta_cobrar_id: string
  monto: number
  metodo_pago: string
  comprobante_url?: string
  fecha_pago: string
  estado_verificacion: "pendiente" | "aprobado" | "rechazado"
  observaciones?: string
  motivo_rechazo?: string
}

export interface Alquiler {
  id: string
  fecha_devolucion?: string
  cliente_nombre?: string
  equipo?: { nombre: string }
  fecha_prestamo?: string
  created_at?: string
  fecha_entrega?: string
}

export interface Certificado {
  id: string
  codigo_certificado: string
  estudiante?: { nombres: string; apellidos: string }
  catalogo_curso?: { nombre: string }
  estado: string
}

export interface Curso {
  id: string
  catalogo?: { nombre: string }
  nombre: string
  fecha_inicio: string
  instructor?: { nombres: string; apellidos: string }
  matriculas_count?: number
  capacidad: number
  estado: string
}

export interface TrabajoEdicion {
  id: string
  cliente_nombre?: string
  descripcion?: string
  estado: string
  pagado: boolean
}

export interface ReservaPodcast {
  id: string
  cliente_nombre?: string
  paquete?: { nombre: string }
  fecha_reserva?: string
  created_at?: string
  estado: string
  pagado: boolean
}

export interface SolicitudInscripcion {
  id: string
  estudiante?: { nombres: string; apellidos: string }
  participante_externo?: { nombres: string; apellidos: string }
  curso_abierto?: { catalogo?: { nombre: string } }
  created_at: string
  estado: string
}

export const secretariaService = {
  async getDashboard() {
    const response = await api.get("/secretaria/dashboard")
    return response.data.datos as DashboardData
  },

  async getEstudiantes(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/estudiantes", { params })
    return response.data
  },

  async getEstudiante(id: string) {
    const response = await api.get(`/secretaria/estudiantes/${id}`)
    return response.data
  },

  async createEstudiante(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/estudiantes", data)
    return response.data
  },

  async updateEstudiante(id: string, data: Record<string, unknown>) {
    const response = await api.put(`/secretaria/estudiantes/${id}`, data)
    return response.data
  },

  async getAcademicProfile(id: string) {
    const response = await api.get(`/secretaria/estudiantes/${id}/academic-profile`)
    return response.data
  },

  async getCuentas(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/finanzas/cuentas", { params })
    return response.data
  },

  async getCuentaDetalle(id: string) {
    const response = await api.get(`/secretaria/finanzas/cuentas/${id}`)
    return response.data
  },

  async registrarPago(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/finanzas/pagos", data)
    return response.data
  },

  async verificarTransaccion(id: string, data: Record<string, unknown>) {
    const response = await api.post(`/secretaria/finanzas/transacciones/${id}/verificar`, data)
    return response.data
  },

  async getMatriculas(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/matriculas", { params })
    return response.data
  },

  async createMatricula(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/matriculas", data)
    return response.data
  },

  async getCursos(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/cursos", { params })
    return response.data
  },

  async getCurso(id: string) {
    const response = await api.get(`/secretaria/cursos/${id}`)
    return response.data
  },

  async getCursoHorarios(id: string) {
    const response = await api.get(`/secretaria/cursos/${id}/horarios`)
    return response.data
  },

  async getCursoMatriculas(id: string) {
    const response = await api.get(`/secretaria/cursos/${id}/matriculas`)
    return response.data
  },

  async getCursoModulos(id: string) {
    const response = await api.get(`/secretaria/cursos/${id}/modulos`)
    return response.data
  },

  async getTalleres(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/talleres", { params })
    return response.data
  },

  async getTaller(id: string) {
    const response = await api.get(`/secretaria/talleres/${id}`)
    return response.data
  },

  async getPodcastPaquetes() {
    const response = await api.get("/secretaria/servicios/podcast/paquetes")
    return response.data
  },

  async getReservasPodcast(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/servicios/podcast/reservas", { params })
    return response.data
  },

  async createReservaPodcast(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/servicios/podcast/reservas", data)
    return response.data
  },

  async registrarPagoPodcast(id: string, data: Record<string, unknown>) {
    const response = await api.post(`/secretaria/servicios/podcast/reservas/${id}/pago`, data)
    return response.data
  },

  async getTrabajosEdicion(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/servicios/edicion-video", { params })
    return response.data
  },

  async createTrabajoEdicion(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/servicios/edicion-video", data)
    return response.data
  },

  async updateTrabajoEdicion(id: string, data: Record<string, unknown>) {
    const response = await api.put(`/secretaria/servicios/edicion-video/${id}`, data)
    return response.data
  },

  async entregarTrabajoEdicion(id: string) {
    const response = await api.post(`/secretaria/servicios/edicion-video/${id}/entregar`)
    return response.data
  },

  async cobrarTrabajoEdicion(id: string) {
    const response = await api.post(`/secretaria/servicios/edicion-video/${id}/cobro`)
    return response.data
  },

  async getEquipos() {
    const response = await api.get("/secretaria/servicios/equipos")
    return response.data
  },

  async getAlquileres(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/servicios/equipos/alquileres", { params })
    return response.data
  },

  async createAlquiler(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/servicios/equipos/alquileres", data)
    return response.data
  },

  async entregarEquipo(id: string) {
    const response = await api.post(`/secretaria/servicios/equipos/alquileres/${id}/entregar`)
    return response.data
  },

  async devolverEquipo(id: string) {
    const response = await api.post(`/secretaria/servicios/equipos/alquileres/${id}/devolver`)
    return response.data
  },

  async getCertificados(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/certificados", { params })
    return response.data
  },

  async createCertificado(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/certificados", data)
    return response.data
  },

  async bulkCertificados(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/certificados/bulk", data)
    return response.data
  },

  async marcarEntregado(id: string) {
    const response = await api.patch(`/secretaria/certificados/${id}/entregar`)
    return response.data
  },

  async deleteCertificado(id: string) {
    const response = await api.delete(`/secretaria/certificados/${id}`)
    return response.data
  },

  async getSolicitudes(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/solicitudes-inscripcion", { params })
    return response.data
  },

  async getSolicitud(id: string) {
    const response = await api.get(`/secretaria/solicitudes-inscripcion/${id}`)
    return response.data
  },

  async aprobarSolicitud(id: string) {
    const response = await api.post(`/secretaria/solicitudes-inscripcion/${id}/validar`)
    return response.data
  },

  async rechazarSolicitud(id: string, data?: Record<string, unknown>) {
    const response = await api.post(`/secretaria/solicitudes-inscripcion/${id}/rechazar`, data)
    return response.data
  },

  async getAsistencia(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/asistencia", { params })
    return response.data
  },

  async registrarAsistencia(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/asistencia", data)
    return response.data
  },

  async getClientesExternos(params?: Record<string, unknown>) {
    const response = await api.get("/secretaria/clientes-externos", { params })
    return response.data
  },

  async buscarClientePorCedula(data: Record<string, unknown>) {
    const response = await api.post("/secretaria/clientes-externos/buscar-cedula", data)
    return response.data
  },
}
