import api from "@/services/auth.service"

export interface RecordatorioItem {
  id: string
  entidad_tipo: "curso" | "taller" | "certificado"
  entidad_id: string
  tipo_evento: "inicio" | "fin" | "modulo" | "certificado"
  titulo: string
  subtitulo: string
  descripcion: string
  fecha_evento: string
  dias_restantes: number
  urgencia: "urgente" | "proximo"
  accion_label: string
  accion_url: string
}

export interface RecordatoriosResponse {
  urgentes_count: number
  proximos_count: number
  total_count: number
  items: RecordatorioItem[]
}

export interface RecordatoriosConfig {
  inicio?: {
    activo: boolean
    modo: "dias_antes" | "fecha_fija"
    dias_antes?: number
    fecha?: string
  }
  fin?: {
    activo: boolean
    modo: "dias_antes" | "fecha_fija"
    dias_antes?: number
    fecha?: string
  }
  proximo_modulo?: {
    activo: boolean
    dias_antes?: number
  }
  certificados?: {
    activo: boolean
    modo?: "dias_despues" | "dias_antes" | "fecha_fija"
    dias?: number
    fecha?: string
  }
}

export const recordatoriosService = {
  async getRecordatorios(): Promise<RecordatoriosResponse> {
    const response = await api.get<RecordatoriosResponse>("/academic/recordatorios")
    const data = response.data ?? {}
    return {
      urgentes_count: typeof data.urgentes_count === "number" ? data.urgentes_count : 0,
      proximos_count: typeof data.proximos_count === "number" ? data.proximos_count : 0,
      total_count: typeof data.total_count === "number" ? data.total_count : 0,
      items: Array.isArray(data.items) ? data.items : [],
    }
  },
}
