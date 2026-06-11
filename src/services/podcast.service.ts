import api from "@/services/auth.service"

export interface ItemPaquete {
  id: string
  nombre: string
  incluido: boolean
}

export interface PaquetePodcast {
  id: string
  nombre: string
  descripcion?: string
  precio_por_hora: number
  items: ItemPaquete[]
  activo: boolean
}

export interface AsignacionPersonal {
  id: string
  persona_id: string
  rol?: string
  persona?: { id: string; nombres: string; apellidos: string }
}

export interface ReservaPodcast {
  id: string
  paquete_id: string
  cliente_externo_id?: string
  persona_id?: string
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
  precio_total: number
  pago_registrado: boolean
  estado: "pendiente" | "confirmado" | "en_progreso" | "completado" | "cancelado"
  notas?: string
  asignaciones?: AsignacionPersonal[]
  paquete?: PaquetePodcast
  persona?: { id: string; nombres: string; apellidos: string; correo?: string }
  cliente_externo?: { id: string; nombres: string; apellidos?: string; cedula?: string; correo?: string; celular?: string }
  created_at?: string
}

export const podcastService = {
  getPaquetes: async () => {
    const { data } = await api.get<{ data: PaquetePodcast[] }>("/academic/servicios/paquetes-podcast")
    return data.data
  },

  createPaquete: async (paquete: Partial<PaquetePodcast>) => {
    const { data } = await api.post<{ data: PaquetePodcast }>("/academic/servicios/paquetes-podcast", paquete)
    return data.data
  },

  updatePaquete: async (id: string, paquete: Partial<PaquetePodcast>) => {
    const { data } = await api.put<{ data: PaquetePodcast }>(`/academic/servicios/paquetes-podcast/${id}`, paquete)
    return data.data
  },

  deletePaquete: async (id: string) => {
    await api.delete(`/academic/servicios/paquetes-podcast/${id}`)
  },

  getReservas: async (filters?: { fecha?: string; paquete_id?: string; estado?: string }) => {
    const { data } = await api.get<{ data: ReservaPodcast[] }>("/academic/servicios/reservas-podcast", { params: filters })
    return data.data
  },

  createReserva: async (reserva: Partial<ReservaPodcast>) => {
    const { data } = await api.post<{ data: ReservaPodcast }>("/academic/servicios/reservas-podcast", reserva)
    return data.data
  },

  updateReserva: async (id: string, reserva: Partial<ReservaPodcast>) => {
    const { data } = await api.put<{ data: ReservaPodcast }>(`/academic/servicios/reservas-podcast/${id}`, reserva)
    return data.data
  },

  deleteReserva: async (id: string) => {
    await api.delete(`/academic/servicios/reservas-podcast/${id}`)
  },

  registrarPago: async (id: string) => {
    const { data } = await api.post<{ data: ReservaPodcast }>(`/academic/servicios/reservas-podcast/${id}/pago`)
    return data.data
  },
}
