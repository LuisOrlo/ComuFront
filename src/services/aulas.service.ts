import api from "@/services/auth.service"

export interface Aula {
  id: string
  nombre: string
  capacidad: number
  precio_hora: number
  caracteristicas?: string
}

export interface ReservaAula {
  id: string
  aula_id: string
  persona_id?: string
  cliente_externo_id?: string
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
  precio_total: number
  precio_original?: number | null
  monto_descuento?: number
  motivo_descuento?: string | null
  estado: "reservado" | "confirmado" | "en_progreso" | "completado" | "cancelado"
  observaciones?: string
  aula?: Aula
  persona?: {
    tipo?: string
    nombres?: string
    apellidos?: string
    cedula?: string
    correo?: string
    celular?: string
  }
  cliente_externo?: {
    nombres?: string
    apellidos?: string
    cedula?: string
    correo?: string
    celular?: string
  }
  cuenta_por_cobrar?: {
    id: string
    monto_total: number
    monto_abonado: number
    saldo_pendiente: number
    estado: string
  }
}

export const aulasService = {
  // Aulas
  getAulas: async () => {
    const { data } = await api.get<{ data: Aula[] }>("/academic/servicios/aulas")
    return data.data
  },

  getAula: async (id: string) => {
    const { data } = await api.get<{ data: Aula }>(`/academic/servicios/aulas/${id}`)
    return data.data
  },

  createAula: async (aula: Partial<Aula>) => {
    const { data } = await api.post<{ data: Aula }>("/academic/servicios/aulas", aula)
    return data.data
  },

  updateAula: async (id: string, aula: Partial<Aula>) => {
    const { data } = await api.put<{ data: Aula }>(`/academic/servicios/aulas/${id}`, aula)
    return data.data
  },

  deleteAula: async (id: string) => {
    await api.delete(`/academic/servicios/aulas/${id}`)
  },

  // Reservas
  getReservas: async (filters?: { aula_id?: string, fecha_inicio?: string, fecha_fin?: string, fecha_desde?: string, fecha_hasta?: string, per_page?: number | string }) => {
    const params = { per_page: "all", ...filters }
    const { data } = await api.get<{ data: ReservaAula[] }>("/academic/servicios/reservas-aulas", { params })
    return data.data
  },

  getReserva: async (id: string) => {
    const { data } = await api.get<{ data: ReservaAula }>(`/academic/servicios/reservas-aulas/${id}`)
    return data.data
  },

  createReserva: async (reserva: Partial<ReservaAula>) => {
    const { data } = await api.post<{ data: ReservaAula }>("/academic/servicios/reservas-aulas", reserva)
    return data.data
  },

  createReservasBatch: async (payload: {
    persona_id?: string | null
    cliente_externo_id?: string | null
    reservas: Array<Record<string, unknown>>
  }) => {
    const { data } = await api.post<{ data: ReservaAula[] }>("/academic/servicios/reservas-aulas/lote", payload)
    return data.data
  },

  updateReservaEstado: async (id: string, estado: string) => {
    const { data } = await api.put<{ data: ReservaAula }>(`/academic/servicios/reservas-aulas/${id}`, { estado })
    return data.data
  },

  updateReserva: async (id: string, reserva: Partial<ReservaAula>) => {
    const { data } = await api.put<{ data: ReservaAula }>(`/academic/servicios/reservas-aulas/${id}`, reserva)
    return data.data
  },

  deleteReserva: async (id: string) => {
    await api.delete(`/academic/servicios/reservas-aulas/${id}`)
  }
}
