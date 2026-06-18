import api from "@/services/auth.service"

export interface TarifaRadio {
  id: string
  nombre: string
  descripcion?: string
  precio_por_hora: number
  incluye_operador: boolean
  es_activo: boolean
}

export interface ReservaRadio {
  id: string
  tarifa_id: string
  persona_id?: string
  cliente_externo_id?: string
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
  incluye_operador: boolean
  operador_id?: string
  precio_total: number
  estado: "reservado" | "confirmado" | "en_progreso" | "completado" | "cancelado"
  observaciones?: string
  tarifa?: TarifaRadio
  persona?: { id: string; nombres: string; apellidos: string }
  cliente_externo?: { id: string; nombres: string; cedula?: string; correo?: string; celular?: string }
  operador?: { id: string; nombres: string; apellidos: string }
  created_at?: string
  updated_at?: string
}

export interface BloqueDisponible {
  hora_inicio: string
  hora_fin: string
  disponible: boolean
}

export const radioService = {
  // Tarifas
  getTarifas: async () => {
    const { data } = await api.get<{ data: TarifaRadio[] }>("/academic/servicios/tarifas-radio")
    return data.data
  },

  createTarifa: async (tarifa: Partial<TarifaRadio>) => {
    const { data } = await api.post<{ data: TarifaRadio }>("/academic/servicios/tarifas-radio", tarifa)
    return data.data
  },

  updateTarifa: async (id: string, tarifa: Partial<TarifaRadio>) => {
    const { data } = await api.put<{ data: TarifaRadio }>(`/academic/servicios/tarifas-radio/${id}`, tarifa)
    return data.data
  },

  deleteTarifa: async (id: string) => {
    await api.delete(`/academic/servicios/tarifas-radio/${id}`)
  },

  // Reservas
  getReservas: async (filters?: {
    fecha?: string
    fecha_desde?: string
    fecha_hasta?: string
    tarifa_id?: string
    operador_id?: string
    estado?: string
    search?: string
    page?: number
    per_page?: number
  }) => {
    const { data } = await api.get<{ data: ReservaRadio[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }>(
      "/academic/servicios/reservas-radio", { params: filters }
    )
    return data
  },

  createReserva: async (reserva: Partial<ReservaRadio>) => {
    const { data } = await api.post<{ data: ReservaRadio }>("/academic/servicios/reservas-radio", reserva)
    return data.data
  },

  updateReserva: async (id: string, reserva: Partial<ReservaRadio>) => {
    const { data } = await api.put<{ data: ReservaRadio }>(`/academic/servicios/reservas-radio/${id}`, reserva)
    return data.data
  },

  deleteReserva: async (id: string) => {
    await api.delete(`/academic/servicios/reservas-radio/${id}`)
  },

  cambiarEstado: async (id: string, estado: string) => {
    const { data } = await api.post<{ data: ReservaRadio }>(`/academic/servicios/reservas-radio/${id}/estado`, { estado })
    return data.data
  },

  asignarOperador: async (id: string, operador_id: string | null) => {
    const { data } = await api.post<{ data: ReservaRadio }>(`/academic/servicios/reservas-radio/${id}/operador`, { operador_id })
    return data.data
  },

  registrarPago: async (id: string) => {
    const { data } = await api.post<{ data: ReservaRadio }>(`/academic/servicios/reservas-radio/${id}/pago`)
    return data.data
  },

  getDisponibles: async (fecha: string) => {
    const { data } = await api.get<{ data: BloqueDisponible[] }>("/academic/servicios/reservas-radio/disponibles", { params: { fecha } })
    return data.data
  },

  getHistorial: async (filters?: {
    fecha_desde?: string
    fecha_hasta?: string
    estado?: string
    page?: number
    per_page?: number
  }) => {
    const { data } = await api.get<{ data: ReservaRadio[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }>(
      "/academic/servicios/reservas-radio/historial", { params: filters }
    )
    return data
  },
}
