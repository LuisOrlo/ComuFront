import api from "@/services/auth.service"

export interface HorasInstructorRecord {
  id: string
  instructor_id: string
  curso_abierto_id?: string
  fecha: string
  horas_trabajadas: number
  tarifa_aplicada: number
  monto_a_pagar: number
  pagado: boolean
  instructor?: { id: string; nombres: string; apellidos: string }
}

export const horasService = {
  async getHoras(filters?: {
    instructor_id?: string
    pagado?: boolean
    desde?: string
    hasta?: string
    page?: number
  }): Promise<{ data: HorasInstructorRecord[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }> {
    const params: Record<string, string | number | boolean | undefined> = { per_page: 15, page: filters?.page || 1 }
    if (filters?.instructor_id) params.instructor_id = filters.instructor_id
    if (filters?.pagado !== undefined) params.pagado = String(filters.pagado)
    if (filters?.desde) params.desde = filters.desde
    if (filters?.hasta) params.hasta = filters.hasta
    const res = await api.get("/academic/horas-instructor", { params })
    return res.data
  },

  async crear(data: {
    instructor_id: string
    fecha: string
    horas_trabajadas: number
    tarifa_aplicada: number
    curso_abierto_id?: string
  }) {
    const res = await api.post("/academic/horas-instructor", data)
    return res.data
  },

  async actualizar(id: string, data: {
    horas_trabajadas?: number
    tarifa_aplicada?: number
    pagado?: boolean
  }) {
    const res = await api.put(`/academic/horas-instructor/${id}`, data)
    return res.data
  },

  async eliminar(id: string): Promise<void> {
    await api.delete(`/academic/horas-instructor/${id}`)
  },

  async bulkPagar(ids: string[]) {
    const res = await api.post("/academic/horas-instructor/bulk/pagar", { ids })
    return res.data
  },
}
