import api from "@/services/auth.service"

export interface AsignacionStaff {
  id?: string
  persona_id: string
  rol?: string
  persona?: {
    id: string
    nombres: string
    apellidos: string
    correo?: string
    celular?: string
  }
}

export interface ConflictoStaff {
  persona_id: string
  persona_nombre: string
  actividad: string
  hora_inicio: string
  hora_fin: string
  tipo_actividad: string
}

export interface DisponibilidadStaffResponse {
  valido: boolean
  conflictos: ConflictoStaff[]
}

export interface TransaccionStreaming {
  id: string
  monto: number
  metodo_pago: string
  fecha_pago: string
  comprobante_url?: string
}

export interface CuentaPorCobrarStreaming {
  id: string
  monto_total: number
  monto_abonado: number
  saldo_pendiente: number
  estado: string
  transacciones?: TransaccionStreaming[]
}

export interface ServicioStreaming {
  id: string
  persona_id?: string | null
  cliente_externo_id?: string | null
  ciudad_id?: number | null
  ciudad?: {
    id: number
    nombre: string
  } | null
  titulo?: string | null
  fecha_evento: string
  hora_inicio: string
  hora_fin: string
  lugar: string
  direccion?: string | null
  referencias_ubicacion?: string | null
  equipos_detalle?: string | null
  descripcion?: string | null
  observaciones?: string | null
  precio_total: number
  precio_original?: number | null
  monto_descuento?: number
  motivo_descuento?: string | null
  monto_recargo?: number
  motivo_recargo?: string | null
  estado: "reservado" | "confirmado" | "en_progreso" | "completado" | "cancelado"
  pago_registrado: boolean
  pago_abonado: boolean
  asignaciones: AsignacionStaff[]
  persona?: {
    id: string
    nombres: string
    apellidos: string
    correo?: string
    cedula?: string
    celular?: string
  } | null
  cliente_externo?: {
    id: string
    nombres: string
    apellidos?: string
    razon_social?: string
    ruc?: string
    cedula?: string
    correo?: string
    celular?: string
  } | null
  created_at?: string
  cuenta_por_cobrar?: CuentaPorCobrarStreaming | null
}

export interface StreamingFilters {
  fecha?: string
  fecha_desde?: string
  fecha_hasta?: string
  estado?: string
  ciudad_id?: number | string
  search?: string
  per_page?: number | string
  page?: number
}

export const streamingService = {
  /**
   * Obtiene todos los servicios con soporte para filtros.
   */
  getAll: async (filters?: StreamingFilters) => {
    const params = { per_page: "all", ...filters }
    const { data } = await api.get<{ data: ServicioStreaming[] }>("/academic/servicios/streaming", { params })
    return data.data
  },

  /**
   * Obtiene lista paginada de servicios.
   */
  getPaged: async (filters?: StreamingFilters) => {
    const { data } = await api.get<{
      data: ServicioStreaming[]
      meta: { current_page: number; last_page: number; per_page: number; total: number }
    }>("/academic/servicios/streaming", { params: filters })
    return data
  },

  /**
   * Ficha técnica y detalle por ID.
   */
  getById: async (id: string) => {
    const { data } = await api.get<{ data: ServicioStreaming }>(`/academic/servicios/streaming/${id}`)
    return data.data
  },

  /**
   * Registra una nueva cobertura de streaming.
   */
  create: async (payload: Partial<ServicioStreaming> & { asignaciones?: Array<{ persona_id: string; rol?: string }> }) => {
    const { data } = await api.post<{ data: ServicioStreaming; message: string }>("/academic/servicios/streaming", payload)
    return data.data
  },

  /**
   * Actualiza una cobertura de streaming.
   */
  update: async (id: string, payload: Partial<ServicioStreaming> & { asignaciones?: Array<{ persona_id: string; rol?: string }> }) => {
    const { data } = await api.put<{ data: ServicioStreaming; message: string }>(`/academic/servicios/streaming/${id}`, payload)
    return data.data
  },

  /**
   * Elimina un streaming (bloqueado si tiene pagos).
   */
  delete: async (id: string) => {
    const { data } = await api.delete<{ message: string }>(`/academic/servicios/streaming/${id}`)
    return data
  },

  /**
   * Cambia el estado operativo del servicio.
   */
  cambiarEstado: async (id: string, estado: ServicioStreaming["estado"]) => {
    const { data } = await api.post<{ data: ServicioStreaming; message: string }>(`/academic/servicios/streaming/${id}/estado`, { estado })
    return data.data
  },

  /**
   * Registra un pago o abono financiero.
   */
  registrarPago: async (id: string, payload?: {
    monto?: number
    metodo_pago?: string
    comprobante_url?: string
    fecha_pago?: string
    observaciones?: string
  }) => {
    const { data } = await api.post<{ data: ServicioStreaming; message: string }>(`/academic/servicios/streaming/${id}/pago`, payload)
    return data.data
  },

  /**
   * Pre-validación reactiva de disponibilidad del personal técnico.
   */
  verificarDisponibilidadStaff: async (payload: {
    fecha_evento: string
    hora_inicio: string
    hora_fin: string
    persona_ids: string[]
    exclude_id?: string
  }) => {
    const { data } = await api.post<DisponibilidadStaffResponse>(
      "/academic/servicios/streaming/verificar-disponibilidad",
      payload
    )
    return data
  },
}
