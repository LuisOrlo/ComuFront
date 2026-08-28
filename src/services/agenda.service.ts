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

export interface AgendaEventParams {
  fecha_inicio?: string
  fecha_fin?: string
  tipos?: string[]
  per_page?: number
  page?: number
}

export const agendaService = {
  async getEvents(params: AgendaEventParams): Promise<AgendaResponse> {
    const response = await api.get("/academic/agenda", { params })
    return response.data
  },

  async getEventDetail(tipoEvento: string, referenciaId: string): Promise<AgendaEventDetail> {
    const response = await api.get(`/academic/agenda/${tipoEvento}/${referenciaId}`)
    return response.data.data
  },

  async getAllEvents(params: Omit<AgendaEventParams, "page">): Promise<AgendaResponse> {
    const firstPage = await this.getEvents({ ...params, page: 1, per_page: 500 })
    const pages = Array.from({ length: Math.max(firstPage.meta.last_page - 1, 0) }, (_, index) => index + 2)
    const rest = await Promise.all(pages.map(page => this.getEvents({ ...params, page, per_page: 500 })))
    return {
      ...firstPage,
      data: [firstPage.data, ...rest.map(response => response.data)].flat(),
    }
  },

  async downloadPDF(params: {
    vista: "mes" | "semana" | "dia" | "lista"
    fecha_inicio?: string
    fecha_fin?: string
    tipos?: string[]
    titulo?: string
  }): Promise<Blob> {
    const response = await api.get("/academic/agenda/exportar/pdf", {
      params,
      responseType: "blob",
    })
    return response.data
  },
}
