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
  estado: "reservado" | "confirmado" | "en_progreso" | "completado" | "cancelado"
  aula?: Aula
  persona?: {
    nombres?: string
    apellidos?: string
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
}

export const aulasService = {
  // Aulas
  getAulas: async () => {
    const { data } = await api.get<{ data: Aula[] }>("/academic/servicios/aulas")
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
  getReservas: async (filters?: { aula_id?: string, fecha_inicio?: string, fecha_fin?: string }) => {
    const { data } = await api.get<{ data: ReservaAula[] }>("/academic/servicios/reservas-aulas", { params: filters })
    return data.data
  },

  createReserva: async (reserva: Partial<ReservaAula>) => {
    const { data } = await api.post<{ data: ReservaAula }>("/academic/servicios/reservas-aulas", reserva)
    return data.data
  },

  updateReservaEstado: async (id: string, estado: string) => {
    const { data } = await api.put<{ data: ReservaAula }>(`/academic/servicios/reservas-aulas/${id}`, { estado })
    return data.data
  },

  deleteReserva: async (id: string) => {
    await api.delete(`/academic/servicios/reservas-aulas/${id}`)
  }
}
