import api from "@/services/auth.service"
import type { EstadisticasResponse, CatalogoDetalleResponse, EstudianteDetalleResponse } from "@/types/estadisticas"

interface PagoInicialDto {
  matricula_id?: string
  solicitud_inscripcion_id?: string
  inscripcion_taller_id?: string
  monto: number
  metodo_pago?: string
  referencia_pago?: string
  comprobante_url?: string | null
  fecha_pago?: string
  observaciones?: string
}

interface PagosInicialesDto {
  matricula_id?: string
  inscripcion_taller_id?: string
  solicitud_inscripcion_id?: string
  monto_total: number
  monto_inicial: number
  fecha_pago: string
  metodo_pago: string
  cuotas: number
  observaciones?: string
}

interface RegistroPagoDto extends PagoInicialDto {
  cuenta_cobrar_id: string
}

export const financeService = {
  async getEstadisticas(params: Record<string, string | number | undefined>) {
    const response = await api.get<EstadisticasResponse>("/finanzas/estadisticas", { params })
    return response.data
  },

  async getEstadisticasCatalogo(id: string, params: Record<string, string | number | undefined>) {
    const response = await api.get<CatalogoDetalleResponse>(`/finanzas/estadisticas/catalogo/${id}`, { params })
    return response.data
  },

  async getEstadisticasEstudiante(id: string, params: Record<string, string | number | undefined>) {
    const response = await api.get<EstudianteDetalleResponse>(`/finanzas/estadisticas/estudiante/${id}`, { params })
    return response.data
  },

  async getCuentas(params?: Record<string, string | number | undefined>) {
    const response = await api.get("/finanzas/cuentas", { params })
    return response.data
  },

  async getCuentaDetalle(id: string) {
    const response = await api.get(`/finanzas/cuentas/${id}`)
    return response.data
  },

  async registrarPago(dto: RegistroPagoDto) {
    const response = await api.post("/finanzas/pagos", dto)
    return response.data
  },

  async registrarPagosIniciales(dto: PagosInicialesDto) {
    const response = await api.post("/finanzas/pagos-iniciales", dto)
    return response.data
  },

  async uploadComprobantePago(formData: FormData) {
    const response = await api.post("/finanzas/pagos-iniciales/comprobante", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  async getTransacciones(params?: Record<string, string | number | undefined>) {
    const response = await api.get("/finanzas/transacciones", { params })
    return response.data
  },

  async getHistorial(params?: Record<string, string | number | undefined>) {
    const response = await api.get("/finanzas/historial", { params })
    return response.data
  },

  async getTransaccionDetalle(id: string) {
    const response = await api.get(`/finanzas/transacciones/${id}/detalle`)
    return response.data
  },

  async verificarTransaccion(id: string, dto: { estado_verificacion: string; motivo_rechazo?: string }) {
    const response = await api.post(`/finanzas/transacciones/${id}/verificar`, dto)
    return response.data
  },

  async getResumen() {
    const response = await api.get("/finanzas/resumen")
    return response.data
  },

  async getCursoFinanciero(id: string) {
    const response = await api.get(`/finanzas/cursos/${id}/financiero`)
    return response.data
  },

  async getEstudianteFinancieroCurso(cursoId: string, matriculaId: string) {
    const response = await api.get(`/finanzas/cursos/${cursoId}/estudiante/${matriculaId}/financiero`)
    return response.data
  },

  async getTallerFinanciero(id: string) {
    const response = await api.get(`/finanzas/talleres/${id}/financiero`)
    return response.data
  },

  async getServicioFinanciero(tipo: string, id: string) {
    const response = await api.get(`/finanzas/servicios/${tipo}/${id}/financiero`)
    return response.data
  },

  async pagarServicio(tipo: string, id: string, dto: { monto: number; metodo_pago: string; referencia_pago?: string; comprobante_url?: string; fecha_pago?: string }) {
    const response = await api.post(`/finanzas/pagar-servicio/${tipo}/${id}`, dto)
    return response.data
  },

  async getLineasPagoPorMatricula(matriculaId: string) {
    const response = await api.get(`/finanzas/matriculas/${matriculaId}/lineas-pago`)
    return response.data
  },

  async getHistorialParticipanteTaller(tallerId: string, participanteId: string) {
    const response = await api.get(`/finanzas/talleres/${tallerId}/participante/${participanteId}`)
    return response.data
  },

  async getIngresos(params?: Record<string, string | number | undefined>) {
    const response = await api.get("/finanzas/ingresos", { params })
    return response.data
  },

  async getEgresos(params?: Record<string, string | number | undefined>) {
    const response = await api.get("/finanzas/egresos", { params })
    return response.data
  },

  async getEgreso(id: string) {
    const response = await api.get(`/finanzas/egresos/${id}`)
    return response.data
  },

  async createEgreso(dto: Record<string, unknown>) {
    const response = await api.post("/finanzas/egresos", dto)
    return response.data
  },

  async updateEgreso(id: string, dto: Record<string, unknown>) {
    const response = await api.put(`/finanzas/egresos/${id}`, dto)
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

  async getPersonalDisponible(): Promise<Array<{ id: string; nombre_completo: string; tipo: string }>> {
    const response = await api.get("/finanzas/egresos/personal-disponible")
    return response.data.data
  },

  async deleteComprobante(id: string, tipoMovimiento: "ingreso" | "egreso") {
    const endpoint = tipoMovimiento === "ingreso"
      ? `/finanzas/transacciones-ingreso/${id}/archivo`
      : `/finanzas/transacciones-egreso/${id}/archivo`
    const response = await api.delete(endpoint, { data: { campo: "comprobante_url" } })
    return response.data
  },
}
