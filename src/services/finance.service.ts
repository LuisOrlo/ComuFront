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
  }
}
