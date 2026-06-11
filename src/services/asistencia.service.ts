import api from "@/services/auth.service"

export interface AsistenciaStaff {
  id: string
  persona_id: string
  fecha: string
  hora_entrada?: string
  hora_salida?: string
  actividades?: string
  observaciones?: string
  persona?: { id: string; nombres: string; apellidos: string }
}

export const asistenciaService = {
  async getAsistencias(filters?: {
    persona_id?: string
    fecha?: string
    desde?: string
    hasta?: string
    page?: number
  }): Promise<{ data: AsistenciaStaff[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }> {
    const params: Record<string, string | number | boolean | undefined> = { per_page: 30, page: filters?.page || 1 }
    if (filters?.persona_id) params.persona_id = filters.persona_id
    if (filters?.fecha) params.fecha = filters.fecha
    if (filters?.desde) params.desde = filters.desde
    if (filters?.hasta) params.hasta = filters.hasta
    const res = await api.get("/academic/asistencia-staff", { params })
    return res.data
  },

  async registrar(data: {
    persona_id: string
    fecha: string
    hora_entrada?: string
    hora_salida?: string
    actividades?: string
    observaciones?: string
  }) {
    const res = await api.post("/academic/asistencia-staff", data)
    return res.data
  },

  async actualizar(id: string, data: {
    hora_entrada?: string
    hora_salida?: string
    actividades?: string
    observaciones?: string
  }) {
    const res = await api.put(`/academic/asistencia-staff/${id}`, data)
    return res.data
  },

  async eliminar(id: string): Promise<void> {
    await api.delete(`/academic/asistencia-staff/${id}`)
  },
}
