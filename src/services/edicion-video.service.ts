import api from "@/services/auth.service"

export type EstadoTrabajo = "recibido" | "en_proceso" | "revision" | "entregado"

export interface TrabajoEdicion {
  id: string
  titulo: string
  descripcion?: string
  fecha_recibo: string
  fecha_limite: string
  fecha_entrega?: string
  estado: EstadoTrabajo
  editor_ids: string[]
  editores?: { id: string; nombres: string; apellidos: string }[]
  persona_id?: string
  cliente_externo_id?: string
  cliente?: { id: string; nombres: string; apellidos: string }
  cliente_externo?: { id: string; nombres: string; apellidos?: string; cedula?: string; correo?: string; celular?: string }
  reserva_podcast_id?: string
  precio_cobrado?: number | null
  cobro_registrado: boolean
  notas?: string
  created_at?: string
}

export const ESTADO_TRABAJO_LABELS: Record<EstadoTrabajo, string> = {
  recibido: "Recibido",
  en_proceso: "En proceso",
  revision: "Revisión",
  entregado: "Entregado",
}

export const edicionVideoService = {
  getTrabajos: async (filters?: { estado?: string; search?: string; per_page?: number }) => {
    const { data } = await api.get<{ data: TrabajoEdicion[] }>("/academic/servicios/trabajos-edicion", { params: filters })
    return data
  },

  getTrabajo: async (id: string) => {
    const { data } = await api.get<{ data: TrabajoEdicion }>(`/academic/servicios/trabajos-edicion/${id}`)
    return data.data
  },

  createTrabajo: async (trabajo: Partial<TrabajoEdicion>) => {
    const { data } = await api.post<{ data: TrabajoEdicion }>("/academic/servicios/trabajos-edicion", trabajo)
    return data.data
  },

  updateTrabajo: async (id: string, trabajo: Partial<TrabajoEdicion>) => {
    const { data } = await api.put<{ data: TrabajoEdicion }>(`/academic/servicios/trabajos-edicion/${id}`, trabajo)
    return data.data
  },

  deleteTrabajo: async (id: string) => {
    await api.delete(`/academic/servicios/trabajos-edicion/${id}`)
  },

  registrarEntrega: async (id: string, payload: { fecha_entrega: string; precio_cobrado?: number }) => {
    const { data } = await api.post<{ data: TrabajoEdicion }>(`/academic/servicios/trabajos-edicion/${id}/entregar`, payload)
    return data.data
  },

  registrarCobro: async (id: string) => {
    const { data } = await api.post<{ data: TrabajoEdicion }>(`/academic/servicios/trabajos-edicion/${id}/cobro`)
    return data.data
  },
}
