import api from "@/services/auth.service"

export interface StaffPersona {
  id: string
  nombre_completo: string
  iniciales: string
  tipo: string
}

export interface TareaStaff {
  id: string
  titulo: string
  descripcion?: string
  persona_id: string
  persona?: { id: string; nombres: string; apellidos: string; tipo: string }
  fecha_inicio: string
  fecha_fin?: string
  estado: "pendiente" | "en_progreso" | "completada" | "cancelada"
  created_at: string
}

export interface TareasResponse {
  tareas: TareaStaff[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  totales: {
    total: number
    pendiente: number
    en_progreso: number
    completada: number
  }
}

export interface TareaFilters {
  titulo?: string
  persona_id?: string
  estado?: string
  page?: number
  per_page?: number
  sort?: string
  dir?: string
}

export const tareasService = {
  async getTareas(filters?: TareaFilters): Promise<TareasResponse> {
    const params: Record<string, string | number> = {}
    if (filters?.titulo) params.titulo = filters.titulo
    if (filters?.persona_id) params.persona_id = filters.persona_id
    if (filters?.estado) params.estado = filters.estado
    if (filters?.page) params.page = filters.page
    if (filters?.per_page) params.per_page = filters.per_page
    if (filters?.sort) params.sort = filters.sort
    if (filters?.dir) params.dir = filters.dir
    const res = await api.get("/academic/ops/tareas", { params })
    return res.data
  },

  async getStaffDisponible(): Promise<StaffPersona[]> {
    const res = await api.get("/academic/ops/staff-disponible")
    return res.data.staff
  },

  async createTarea(data: Partial<TareaStaff>): Promise<TareaStaff> {
    const res = await api.post("/academic/ops/tareas", data)
    return res.data.tarea
  },

  async updateTarea(id: string, data: Partial<TareaStaff>): Promise<TareaStaff> {
    const res = await api.put(`/academic/ops/tareas/${id}`, data)
    return res.data.tarea
  },

  async cambiarEstado(id: string, estado: string): Promise<TareaStaff> {
    const res = await api.patch(`/academic/ops/tareas/${id}/estado`, { estado })
    return res.data.tarea
  },

  async deleteTarea(id: string): Promise<void> {
    await api.delete(`/academic/ops/tareas/${id}`)
  },
}
