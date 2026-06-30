/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./auth.service"

export interface CuentaPorCobrar {
  id: string
  monto_total: number
  monto_abonado: number
  saldo_pendiente: number
  estado: "pendiente" | "abonado" | "pagado" | "anulado"
  created_at: string
  matricula?: any
  solicitud_inscripcion?: any
  inscripcion_taller?: any
}

export interface TransaccionIngreso {
  id: string
  cuenta_cobrar_id: string
  monto: number
  metodo_pago: string
  comprobante_url?: string
  fecha_pago: string
  registrado_por?: any
  estado_verificacion: "pendiente" | "aprobado" | "rechazado"
  observaciones?: string
  motivo_rechazo?: string
}

export const financeService = {
  async getResumen() {
    const response = await api.get("/finanzas/resumen")
    return response.data.datos
  },

  async getCuentas(params: any) {
    const response = await api.get("/finanzas/cuentas", { params })
    return response.data
  },

  async getCuentaDetalle(id: string) {
    const response = await api.get(`/finanzas/cuentas/${id}`)
    return response.data
  },

  async registrarPago(data: any) {
    const response = await api.post("/finanzas/pagos", data)
    return response.data
  },

  async getTransacciones(params: any) {
    const response = await api.get("/finanzas/transacciones", { params })
    return response.data
  },

  async verificarTransaccion(id: string, data: any) {
    const response = await api.post(`/finanzas/transacciones/${id}/verificar`, data)
    return response.data
  },

  async getHistorial(params: any) {
    const response = await api.get("/finanzas/historial", { params })
    return response.data
  },

  async getTransaccionDetalle(id: string) {
    const response = await api.get(`/finanzas/transacciones/${id}/detalle`)
    return response.data
  },

  async getEstudianteFinancieroCurso(cursoId: string, matriculaId: string) {
    const response = await api.get(`/finanzas/cursos/${cursoId}/estudiante/${matriculaId}/financiero`)
    return response.data
  },

  async getCursoFinanciero(id: string) {
    const response = await api.get(`/finanzas/cursos/${id}/financiero`)
    return response.data
  },

  async getTallerFinanciero(id: string) {
    const response = await api.get(`/finanzas/talleres/${id}/financiero`)
    return response.data
  },

  async getHistorialParticipanteTaller(tallerId: string, participanteId: string) {
    const response = await api.get(`/finanzas/talleres/${tallerId}/participante/${participanteId}`)
    return response.data
  },

  async getIngresos(params: any) {
    const response = await api.get("/finanzas/ingresos", { params })
    return response.data
  },

  async getEgresos(params: any) {
    const response = await api.get("/finanzas/egresos", { params })
    return response.data
  },

  async createEgreso(data: any) {
    const response = await api.post("/finanzas/egresos", data)
    return response.data
  },

  async updateEgreso(id: string, data: any) {
    const response = await api.put(`/finanzas/egresos/${id}`, data)
    return response.data
  },

  async deleteEgreso(id: string) {
    const response = await api.delete(`/finanzas/egresos/${id}`)
    return response.data
  },

  async getEgresoCategorias() {
    const response = await api.get("/finanzas/egresos/categorias")
    return response.data
  },

  async getEstadisticas(params: any) {
    const response = await api.get("/finanzas/estadisticas", { params })
    return response.data
  },
}
