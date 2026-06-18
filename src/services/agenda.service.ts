import api from "@/services/auth.service"

export interface AgendaEvent {
  id: string
  tipo_evento: string
  referencia_id: string
  titulo: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  instructor_id: string | null
  instructor_nombre: string | null
  aula_nombre: string | null
  estado: string | null
  modalidad: string | null
  participantes_count: number | null
  capacidad_maxima: number | null
  color: string
  tipo_label: string
  ciudad_nombre: string | null
  catalogo_nombre: string | null
  nombre_instancia: string | null
  detalle?: Record<string, unknown>
}

export interface AgendaEventDetail extends AgendaEvent {
  detalle: Record<string, unknown>
}

export interface TipoDisponible {
  tipo: string
  label: string
  color: string
}

export interface AgendaResponse {
  data: AgendaEvent[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
  tipos_disponibles: TipoDisponible[]
}

export const agendaService = {
  async getEvents(params: {
    fecha_inicio?: string
    fecha_fin?: string
    tipos?: string[]
    per_page?: number
    page?: number
  }): Promise<AgendaResponse> {
    const response = await api.get("/academic/agenda", { params })
    return response.data
  },

  async getEventDetail(tipoEvento: string, referenciaId: string): Promise<AgendaEventDetail> {
    const response = await api.get(`/academic/agenda/${tipoEvento}/${referenciaId}`)
    return response.data.data
  },

  async downloadPDF(params: {
    fecha_inicio?: string
    fecha_fin?: string
    tipos?: string[]
  }): Promise<Blob> {
    const response = await api.get("/academic/agenda/exportar/pdf", {
      params,
      responseType: "blob",
    })
    return response.data
  },
}
