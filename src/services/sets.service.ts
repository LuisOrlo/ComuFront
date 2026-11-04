import api from "@/services/auth.service"

export interface SetItem {
  id: string
  nombre: string
  precio_hora: number
  descripcion?: string | null
  activo?: boolean
  created_at?: string
  updated_at?: string
}

export interface ReservaSet {
  id: string
  set_id: string
  persona_id?: string | null
  cliente_externo_id?: string | null
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
  precio_total: number
  precio_original?: number | null
  monto_descuento?: number
  motivo_descuento?: string | null
  monto_recargo?: number
  motivo_recargo?: string | null
  estado: "reservado" | "confirmado" | "en_progreso" | "completado" | "cancelado"
  observaciones?: string | null
  set?: SetItem
  persona?: {
    id?: string
    tipo?: string
    nombres?: string
    apellidos?: string
    cedula?: string
    correo?: string
    celular?: string
  } | null
  cliente_externo?: {
    id?: string
    nombres?: string
    apellidos?: string
    nombre_empresa?: string
    tipo_cliente?: "persona" | "empresa"
    cedula?: string
    ruc?: string
    correo?: string
    celular?: string
  } | null
  cuenta_por_cobrar?: {
    id: string
    monto_total: number
    monto_abonado: number
    saldo_pendiente?: number
    estado: string
  } | null
  created_at?: string
  updated_at?: string
}

export const setsService = {
  // Sets
  getSets: async () => {
    const { data } = await api.get<{ data: SetItem[] }>("/academic/servicios/sets")
    return data.data
  },

  getSet: async (id: string) => {
    const { data } = await api.get<{ data: SetItem }>(`/academic/servicios/sets/${id}`)
    return data.data
  },

  createSet: async (payload: Partial<SetItem>) => {
    const { data } = await api.post<{ data: SetItem }>("/academic/servicios/sets", payload)
    return data.data
  },

  updateSet: async (id: string, payload: Partial<SetItem>) => {
    const { data } = await api.put<{ data: SetItem }>(`/academic/servicios/sets/${id}`, payload)
    return data.data
  },

  deleteSet: async (id: string) => {
    await api.delete(`/academic/servicios/sets/${id}`)
  },

  // Reservas de Sets
  getReservas: async (params?: {
    set_id?: string
    fecha_inicio?: string
    fecha_fin?: string
    estado?: string
    search?: string
  }) => {
    const { data } = await api.get<{ data: ReservaSet[] }>("/academic/servicios/reservas-sets", { params })
    return data.data
  },

  getReserva: async (id: string) => {
    const { data } = await api.get<{ data: ReservaSet }>(`/academic/servicios/reservas-sets/${id}`)
    return data.data
  },

  createReserva: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<{ data: ReservaSet }>("/academic/servicios/reservas-sets", payload)
    return data.data
  },

  updateReserva: async (id: string, payload: Partial<ReservaSet> | Record<string, unknown>) => {
    const { data } = await api.put<{ data: ReservaSet }>(`/academic/servicios/reservas-sets/${id}`, payload)
    return data.data
  },

  updateReservaEstado: async (id: string, estado: ReservaSet["estado"]) => {
    const { data } = await api.put<{ data: ReservaSet }>(`/academic/servicios/reservas-sets/${id}`, { estado })
    return data.data
  },

  deleteReserva: async (id: string) => {
    await api.delete(`/academic/servicios/reservas-sets/${id}`)
  },
}
