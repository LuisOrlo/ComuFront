import api from "@/services/auth.service"

export interface CursoPersonalizado {
  id: string
  nombre: string
  descripcion?: string | null
  docente_id?: string | null
  docente?: { id: string; nombres: string; apellidos: string } | null
  modalidad: "presencial" | "virtual"
  ciudad_id?: number | null
  ciudad?: string | null
  fecha_inicio: string
  fecha_fin: string
  hora_inicio?: string | null
  hora_fin?: string | null
  dias_semana?: number[]
  precio_total: number
  capacidad: number
  matriculados: number
  cupos_disponibles: number
  estado_visual?: "proximo" | "en_curso" | "finalizado" | "lleno"
  es_activo: boolean
}

export interface CursoPersonalizadoInput {
  nombre: string
  descripcion?: string | null
  docente_id?: string | null
  modalidad: "presencial" | "virtual"
  ciudad_id?: number | null
  fecha_inicio: string
  fecha_fin: string
  hora_inicio: string
  hora_fin: string
  precio_total: number
  capacidad: number
  dias_semana?: number[]
}

export interface CursoPersonalizadoEstudiante {
  matricula_id: string
  estudiante: { id: string; nombre: string; identificacion?: string; correo?: string } | null
  estado_matricula: string
  precio: number
  monto_pagado: number
  saldo_pendiente: number
  estado_financiero?: string | null
  cuenta_id?: string | null
}

export interface FinanzasCursoPersonalizado {
  precio_por_estudiante: number
  total_esperado: number
  total_abonado: number
  saldo_pendiente: number
  cuentas_pagadas: number
  cuentas_abonadas: number
  cuentas_pendientes: number
}

interface ListResponse {
  data: CursoPersonalizado[]
  meta: { total: number; per_page: number; current_page: number; last_page: number }
}

interface DetailResponse {
  data: CursoPersonalizado
  estudiantes: CursoPersonalizadoEstudiante[]
  finanzas: FinanzasCursoPersonalizado
}

export const cursosPersonalizadosService = {
  async listar(filters: {
    search?: string
    modalidad?: string
    docente_id?: string
    fecha_inicio?: string
    fecha_fin?: string
    page?: number
    per_page?: number
  } = {}): Promise<ListResponse> {
    const response = await api.get<ListResponse>("/academic/cursos-personalizados", {
      params: { per_page: 12, ...filters },
    })
    return response.data
  },
  async listarDisponibles(filters: { modalidad?: string; page?: number; per_page?: number } = {}): Promise<ListResponse> {
    const response = await api.get<ListResponse>("/cursos-personalizados/disponibles", {
      params: { per_page: 200, ...filters },
    })
    return response.data
  },
  async obtener(id: string): Promise<DetailResponse> {
    const response = await api.get<DetailResponse>("/academic/cursos-personalizados/" + id)
    return response.data
  },
  async crear(data: CursoPersonalizadoInput): Promise<CursoPersonalizado> {
    const response = await api.post<{ data: CursoPersonalizado }>("/academic/cursos-personalizados", data)
    return response.data.data
  },
  async actualizar(id: string, data: Partial<CursoPersonalizadoInput>): Promise<CursoPersonalizado> {
    const response = await api.put<{ data: CursoPersonalizado }>("/academic/cursos-personalizados/" + id, data)
    return response.data.data
  },
  async eliminar(id: string): Promise<void> {
    await api.delete("/academic/cursos-personalizados/" + id)
  },
}
